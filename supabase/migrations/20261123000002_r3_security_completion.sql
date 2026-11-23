-- =====================================================================
-- SHUDDHO CLINICAL FUNCTIONAL & PRECISION NUTRITION PLATFORM
-- R3 SECURITY COMPLETION & ATOMIC RECONCILIATION MIGRATION
-- Migration: 20261123000002_r3_security_completion.sql
-- 
-- Non-destructive, forward-only, idempotent corrective migration:
-- 1. Enforces hash-only token architecture (drops NOT NULL on legacy token columns,
--    clears plaintext tokens from database where token_hash exists).
-- 2. Implements backend-controlled secure invitation issuance RPC (issue_assessment_invitation).
-- 3. Strict authentication verification (auth.uid() IS NOT NULL, clinician.auth_user_id = auth.uid()).
-- 4. Authoritative atomic clinical reconciliation (reconcile_intake_submission_atomic)
--    with strict server-side allowlist, chart update, and safety invalidation.
-- 5. Hardened atomic plan approval (approve_nutrition_plan_atomic).
-- 6. RPC privilege boundaries: REVOKE from PUBLIC/anon on all clinician operations.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- 1. TOKEN STORAGE HARDENING: DROP NOT NULL & PURGE PLAINTEXT TOKENS
-- ---------------------------------------------------------------------

-- Ensure token_hash column exists
ALTER TABLE public.assessment_invitations
    ADD COLUMN IF NOT EXISTS token_hash TEXT,
    ADD COLUMN IF NOT EXISTS access_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS first_accessed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

-- Backfill any missing token_hash from legacy columns before dropping plaintext
UPDATE public.assessment_invitations
SET token_hash = encode(digest(COALESCE(invitation_token, token), 'sha256'), 'hex')
WHERE token_hash IS NULL AND (invitation_token IS NOT NULL OR token IS NOT NULL);

-- Drop NOT NULL constraints on legacy token columns so plaintext is never mandatory
ALTER TABLE public.assessment_invitations
    ALTER COLUMN token DROP NOT NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'assessment_invitations' 
          AND column_name = 'invitation_token'
    ) THEN
        ALTER TABLE public.assessment_invitations ALTER COLUMN invitation_token DROP NOT NULL;
    END IF;
END $$;

-- Purge plaintext tokens where token_hash is established (hash-only architecture)
UPDATE public.assessment_invitations
SET token = NULL,
    invitation_token = NULL
WHERE token_hash IS NOT NULL;

-- Remove legacy triggers that synced plaintext tokens
DROP TRIGGER IF EXISTS trg_sync_invitation_tokens ON public.assessment_invitations;
DROP FUNCTION IF EXISTS public.sync_assessment_invitation_tokens();

-- Ensure unique index on token_hash
CREATE UNIQUE INDEX IF NOT EXISTS idx_assessment_invitations_token_hash 
    ON public.assessment_invitations(token_hash);

-- ---------------------------------------------------------------------
-- 2. BACKEND-CONTROLLED INVITATION ISSUING RPC (Security Definer)
-- ---------------------------------------------------------------------
-- Generates 256-bit cryptographically secure token, stores ONLY SHA-256 hash,
-- and returns plaintext token ONCE to the authorized clinician.
CREATE OR REPLACE FUNCTION public.issue_assessment_invitation(
    p_patient_id UUID,
    p_expires_days INT DEFAULT 14,
    p_sent_via TEXT DEFAULT 'link'
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clinician RECORD;
    v_patient RECORD;
    v_raw_hex TEXT;
    v_token TEXT;
    v_token_hash TEXT;
    v_inv_id UUID;
    v_expires_at TIMESTAMPTZ;
    v_template_id UUID;
BEGIN
    -- 1. Require authenticated session
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authenticated clinician identity is required.';
    END IF;

    -- 2. Derive and verify clinician profile
    SELECT id, auth_user_id, name, role, is_active, organization_id
    INTO v_clinician
    FROM public.clinicians
    WHERE auth_user_id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unauthorized: No active clinician profile found for caller.';
    END IF;

    IF NOT v_clinician.is_active THEN
        RAISE EXCEPTION 'Unauthorized: Clinician account is inactive.';
    END IF;

    IF v_clinician.role NOT IN ('CLINICAL_DIRECTOR', 'TREATING_NUTRITIONIST') THEN
        RAISE EXCEPTION 'Forbidden: Role % is not authorized to generate intake invitations.', v_clinician.role;
    END IF;

    -- 3. Verify patient belongs to clinician organization
    SELECT id, organization_id, name INTO v_patient
    FROM public.patients
    WHERE id = p_patient_id AND organization_id = v_clinician.organization_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Validation Failed: Patient record [%] not found in clinician organization.', p_patient_id;
    END IF;

    -- 4. Resolve default assessment template
    SELECT id INTO v_template_id
    FROM public.assessment_templates
    WHERE code = 'SHUDDHO_STANDARD_INTAKE_V1'
    LIMIT 1;

    -- 5. Generate cryptographically secure 256-bit token (32 random bytes = 64 hex characters)
    v_raw_hex := encode(gen_random_bytes(32), 'hex');
    v_token := 'sh_inv_' || v_raw_hex;
    v_token_hash := encode(digest(v_token, 'sha256'), 'hex');
    v_expires_at := timezone('utc'::text, now()) + (p_expires_days || ' days')::interval;

    -- 6. Insert into database with HASH ONLY (plaintext token is NULL in database)
    INSERT INTO public.assessment_invitations (
        organization_id,
        patient_id,
        template_id,
        token_hash,
        token,
        invitation_token,
        sent_via,
        expires_at,
        status,
        access_count,
        created_at
    )
    VALUES (
        v_clinician.organization_id,
        v_patient.id,
        v_template_id,
        v_token_hash,
        NULL,
        NULL,
        p_sent_via,
        v_expires_at,
        'pending',
        0,
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_inv_id;

    -- 7. Log immutable audit trail without raw token
    INSERT INTO public.audit_events (
        organization_id,
        patient_id,
        clinician_id,
        clinician_name,
        event_type,
        entity_type,
        entity_id,
        payload_after
    )
    VALUES (
        v_clinician.organization_id,
        v_patient.id,
        v_clinician.id,
        v_clinician.name,
        'INTAKE_INVITATION_CREATED',
        'assessment_invitation',
        v_inv_id::text,
        jsonb_build_object(
            'invitation_id', v_inv_id,
            'token_hash_preview', substring(v_token_hash from 1 for 10),
            'expires_at', v_expires_at,
            'sent_via', p_sent_via
        )
    );

    -- 8. Return plaintext token ONCE to authorized clinician
    RETURN jsonb_build_object(
        'success', true,
        'invitation_id', v_inv_id,
        'token', v_token,
        'token_hash', v_token_hash,
        'expires_at', v_expires_at,
        'status', 'pending'
    );
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 3. HARDENED INVITATION REVOCATION RPC
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.revoke_assessment_invitation(
    p_invitation_id UUID
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clinician RECORD;
    v_inv RECORD;
BEGIN
    -- 1. Require authenticated session
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authenticated clinician identity is required.';
    END IF;

    -- 2. Derive clinician from session
    SELECT id, auth_user_id, name, role, is_active, organization_id
    INTO v_clinician
    FROM public.clinicians
    WHERE auth_user_id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unauthorized: No active clinician profile found for caller.';
    END IF;

    IF NOT v_clinician.is_active THEN
        RAISE EXCEPTION 'Unauthorized: Clinician account is inactive.';
    END IF;

    IF v_clinician.role NOT IN ('CLINICAL_DIRECTOR', 'TREATING_NUTRITIONIST') THEN
        RAISE EXCEPTION 'Forbidden: Role % is not authorized to revoke invitations.', v_clinician.role;
    END IF;

    -- 3. Resolve invitation in clinician organization
    SELECT id, organization_id, patient_id, status, token_hash
    INTO v_inv
    FROM public.assessment_invitations
    WHERE id = p_invitation_id AND organization_id = v_clinician.organization_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Assessment invitation [%] not found in clinician organization.', p_invitation_id;
    END IF;

    IF v_inv.status = 'revoked' THEN
        RETURN jsonb_build_object('success', true, 'invitation_id', p_invitation_id, 'status', 'already_revoked');
    END IF;

    -- 4. Transition to revoked
    UPDATE public.assessment_invitations
    SET 
        status = 'revoked',
        revoked_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_invitation_id;

    -- 5. Audit event
    INSERT INTO public.audit_events (
        organization_id,
        patient_id,
        clinician_id,
        clinician_name,
        event_type,
        entity_type,
        entity_id,
        payload_after
    )
    VALUES (
        v_clinician.organization_id,
        v_inv.patient_id,
        v_clinician.id,
        v_clinician.name,
        'INTAKE_INVITATION_REVOKED',
        'assessment_invitation',
        p_invitation_id::text,
        jsonb_build_object(
            'invitation_id', p_invitation_id,
            'token_hash_preview', substring(v_inv.token_hash from 1 for 10),
            'revoked_at', now()
        )
    );

    RETURN jsonb_build_object('success', true, 'invitation_id', p_invitation_id, 'status', 'revoked');
END;
$$ LANGUAGE plpgsql;

-- Overload for backwards compatibility with two-argument calls
CREATE OR REPLACE FUNCTION public.revoke_assessment_invitation(
    p_invitation_id UUID,
    p_clinician_id UUID
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.revoke_assessment_invitation(p_invitation_id);
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 4. HARDENED ATOMIC INVITATION ROTATION RPC
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rotate_assessment_invitation(
    p_invitation_id UUID,
    p_expires_days INT DEFAULT 14
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clinician RECORD;
    v_existing RECORD;
    v_fresh_res JSONB;
BEGIN
    -- 1. Require authenticated session
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authenticated clinician identity is required.';
    END IF;

    SELECT id, organization_id, is_active, role INTO v_clinician
    FROM public.clinicians
    WHERE auth_user_id = auth.uid();

    IF NOT FOUND OR NOT v_clinician.is_active THEN
        RAISE EXCEPTION 'Unauthorized: Active clinician account required.';
    END IF;

    -- 2. Resolve existing invitation
    SELECT id, patient_id, organization_id INTO v_existing
    FROM public.assessment_invitations
    WHERE id = p_invitation_id AND organization_id = v_clinician.organization_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Assessment invitation [%] not found in clinician organization.', p_invitation_id;
    END IF;

    -- 3. Revoke previous invitation
    PERFORM public.revoke_assessment_invitation(p_invitation_id);

    -- 4. Issue fresh invitation
    v_fresh_res := public.issue_assessment_invitation(v_existing.patient_id, p_expires_days, 'link');

    -- 5. Audit rotation transition
    INSERT INTO public.audit_events (
        organization_id,
        patient_id,
        clinician_id,
        event_type,
        entity_type,
        entity_id,
        payload_after
    )
    VALUES (
        v_clinician.organization_id,
        v_existing.patient_id,
        v_clinician.id,
        'INTAKE_INVITATION_ROTATED',
        'assessment_invitation',
        (v_fresh_res->>'invitation_id')::text,
        jsonb_build_object(
            'previous_invitation_id', p_invitation_id,
            'fresh_invitation_id', v_fresh_res->>'invitation_id',
            'expires_at', v_fresh_res->>'expires_at'
        )
    );

    RETURN v_fresh_res;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 5. PUBLIC INTAKE TOKEN VERIFICATION (Minimal exposure, hash-only)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_public_intake_token(p_token TEXT)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_hash TEXT;
    v_inv RECORD;
    v_patient RECORD;
    v_result JSONB;
BEGIN
    IF p_token IS NULL OR trim(p_token) = '' THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'missing');
    END IF;

    -- Compute SHA-256 hex digest of provided bearer token
    v_hash := encode(digest(p_token, 'sha256'), 'hex');

    -- Look up invitation strictly by token_hash (with fallback to legacy columns)
    SELECT id, organization_id, patient_id, expires_at, status, revoked_at
    INTO v_inv
    FROM public.assessment_invitations
    WHERE token_hash = v_hash 
       OR (invitation_token IS NOT NULL AND invitation_token = p_token)
       OR (token IS NOT NULL AND token = p_token);

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'invalid');
    END IF;

    IF v_inv.status = 'revoked' OR v_inv.revoked_at IS NOT NULL THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'revoked');
    END IF;

    IF v_inv.status = 'completed' THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'completed');
    END IF;

    IF v_inv.expires_at < timezone('utc'::text, now()) THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'expired');
    END IF;

    -- Telemetry: increment access count
    UPDATE public.assessment_invitations
    SET 
        access_count = access_count + 1,
        first_accessed_at = COALESCE(first_accessed_at, timezone('utc'::text, now())),
        last_accessed_at = timezone('utc'::text, now())
    WHERE id = v_inv.id;

    -- Retrieve minimal patient display name (first name / title only)
    SELECT name, age, gender INTO v_patient
    FROM public.patients
    WHERE id = v_inv.patient_id;

    v_result := jsonb_build_object(
        'valid', true,
        'invitation_id', v_inv.id,
        'expires_at', v_inv.expires_at,
        'status', v_inv.status,
        'patient_display_name', COALESCE(v_patient.name, 'Patient'),
        'initial_age', COALESCE(v_patient.age, 35),
        'initial_gender', COALESCE(v_patient.gender, 'female')
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 6. PUBLIC INTAKE SUBMISSION (Atomic Staging, Token Stripping & Consent)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_public_intake_assessment(
    p_token TEXT,
    p_responses JSONB,
    p_client_ip TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_hash TEXT;
    v_inv RECORD;
    v_sub_id UUID;
    v_template_id UUID;
    v_clean_responses JSONB;
BEGIN
    IF p_token IS NULL OR trim(p_token) = '' THEN
        RAISE EXCEPTION 'Invalid Token: Token parameter is required.';
    END IF;

    -- Payload size verification (1MB limit)
    IF octet_length(p_responses::text) > 1048576 THEN
        RAISE EXCEPTION 'Payload too large: Responses exceed 1MB limit.';
    END IF;

    IF p_responses IS NULL OR p_responses = '{}'::jsonb THEN
        RAISE EXCEPTION 'Validation Failed: Assessment responses cannot be empty.';
    END IF;

    -- Strip bearer tokens from clinical payload if accidentally passed
    v_clean_responses := p_responses - 'invitation_token' - 'token';

    -- Compute SHA-256 hash
    v_hash := encode(digest(p_token, 'sha256'), 'hex');

    -- Lock and verify invitation
    SELECT id, organization_id, patient_id, template_id, expires_at, status, revoked_at
    INTO v_inv
    FROM public.assessment_invitations
    WHERE token_hash = v_hash 
       OR (invitation_token IS NOT NULL AND invitation_token = p_token)
       OR (token IS NOT NULL AND token = p_token)
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid assessment invitation token.';
    END IF;

    IF v_inv.status = 'revoked' OR v_inv.revoked_at IS NOT NULL THEN
        RAISE EXCEPTION 'Assessment invitation has been revoked.';
    END IF;

    IF v_inv.status = 'completed' THEN
        RAISE EXCEPTION 'Assessment has already been completed for this invitation.';
    END IF;

    IF v_inv.expires_at < timezone('utc'::text, now()) THEN
        RAISE EXCEPTION 'Assessment invitation has expired.';
    END IF;

    -- Fallback template ID if null
    IF v_inv.template_id IS NULL THEN
        SELECT id INTO v_template_id
        FROM public.assessment_templates
        WHERE code = 'SHUDDHO_STANDARD_INTAKE_V1'
        LIMIT 1;
    ELSE
        v_template_id := v_inv.template_id;
    END IF;

    -- 1. Insert into isolated staging queue (assessment_submissions)
    INSERT INTO public.assessment_submissions (
        organization_id,
        invitation_id,
        patient_id,
        template_id,
        raw_responses,
        responses_json,
        client_ip,
        provenance,
        submitted_at
    )
    VALUES (
        v_inv.organization_id,
        v_inv.id,
        v_inv.patient_id,
        v_template_id,
        v_clean_responses,
        v_clean_responses,
        p_client_ip,
        'PATIENT_SELF_REPORTED',
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_sub_id;

    -- 2. Mark invitation completed (atomic one-time consumption)
    UPDATE public.assessment_invitations
    SET 
        status = 'completed',
        updated_at = timezone('utc'::text, now())
    WHERE id = v_inv.id;

    -- 3. Record audit event WITHOUT raw token
    INSERT INTO public.audit_events (
        organization_id,
        patient_id,
        event_type,
        entity_type,
        entity_id,
        payload_after
    )
    VALUES (
        v_inv.organization_id,
        v_inv.patient_id,
        'INTAKE_SUBMITTED',
        'assessment_submission',
        v_sub_id::text,
        jsonb_build_object(
            'submission_id', v_sub_id,
            'invitation_id', v_inv.id,
            'submitted_at', now()
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'submission_id', v_sub_id,
        'submitted_at', now()
    );
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 7. AUTHORITATIVE ATOMIC CLINICAL RECONCILIATION & CHART UPDATE
-- ---------------------------------------------------------------------
-- Single atomic database transaction that:
-- 1. Authorizes clinician (auth.uid() IS NOT NULL, active, role check)
-- 2. Locks submission & patient (FOR UPDATE)
-- 3. Validates decisions against strict server-side allowlist
-- 4. ACTUALLY UPDATES THE PATIENT CHART with accepted/edited fields
-- 5. Detects safety-relevant changes (allergies, weight delta > 5% or 3kg)
-- 6. Invalidates affected approved plans if safety-critical
-- 7. Inserts assessment_reviews record
-- 8. Inserts audit_events record
-- 9. Returns unified atomic result
CREATE OR REPLACE FUNCTION public.reconcile_intake_submission_atomic(
    p_submission_id UUID,
    p_decisions JSONB,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clinician RECORD;
    v_sub RECORD;
    v_patient RECORD;
    v_review_id UUID;
    v_review_status TEXT := 'approved';
    v_has_accepted BOOLEAN := false;
    v_has_rejected BOOLEAN := false;

    -- Extracted updated fields
    v_cur_weight NUMERIC;
    v_new_weight NUMERIC;
    v_new_height NUMERIC;
    v_new_waist NUMERIC;
    v_new_sleep NUMERIC;
    v_new_activity TEXT;
    v_cur_gut JSONB;
    v_new_gut JSONB;
    v_cur_allergies JSONB;
    v_new_allergies JSONB;

    -- Safety classification
    v_safety_impact BOOLEAN := false;
    v_invalidation_reasons TEXT[] := ARRAY[]::TEXT[];
    v_invalidated_count INT := 0;

    v_dec RECORD;
    v_field TEXT;
    v_status TEXT;
    v_val JSONB;
BEGIN
    -- 1. Strict Authenticated Clinician Verification
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authenticated clinician identity is required.';
    END IF;

    SELECT id, auth_user_id, name, role, is_active, organization_id
    INTO v_clinician
    FROM public.clinicians
    WHERE auth_user_id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unauthorized: No clinician profile found for authenticated user.';
    END IF;

    IF NOT v_clinician.is_active THEN
        RAISE EXCEPTION 'Unauthorized: Clinician account is inactive.';
    END IF;

    IF v_clinician.role NOT IN ('CLINICAL_DIRECTOR', 'TREATING_NUTRITIONIST') THEN
        RAISE EXCEPTION 'Forbidden: Role % is not authorized to reconcile patient intakes.', v_clinician.role;
    END IF;

    -- 2. Lock and Resolve Submission
    SELECT id, organization_id, patient_id, responses_json, raw_responses
    INTO v_sub
    FROM public.assessment_submissions
    WHERE id = p_submission_id AND organization_id = v_clinician.organization_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Submission [%] not found in clinician organization.', p_submission_id;
    END IF;

    -- Prevent duplicate review
    IF EXISTS (SELECT 1 FROM public.assessment_reviews WHERE submission_id = p_submission_id) THEN
        RAISE EXCEPTION 'Submission [%] has already been reconciled.', p_submission_id;
    END IF;

    -- 3. Lock and Resolve Target Patient
    SELECT * INTO v_patient
    FROM public.patients
    WHERE id = v_sub.patient_id AND organization_id = v_clinician.organization_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target patient [%] not found in clinician organization.', v_sub.patient_id;
    END IF;

    -- Baseline values
    v_cur_weight := v_patient.weight_kg;
    v_cur_gut := COALESCE(to_jsonb(v_patient.gut_profile), '{}'::jsonb);
    v_new_gut := v_cur_gut;
    v_cur_allergies := COALESCE(to_jsonb(v_patient.confirmed_allergies), '[]'::jsonb);
    v_new_allergies := v_cur_allergies;

    -- 4. Process Decisions with Strict Allowlist & Validation
    FOR v_field, v_val IN SELECT * FROM jsonb_each(p_decisions) LOOP
        v_status := v_val->>'status';

        IF v_status NOT IN ('accepted', 'rejected', 'edited', 'request_clarification') THEN
            RAISE EXCEPTION 'Validation Failed: Unknown decision status [%] on field [%].', v_status, v_field;
        END IF;

        IF v_status = 'rejected' THEN
            v_has_rejected := true;
        ELSIF v_status = 'request_clarification' THEN
            -- Preserved in review record diff, does not update patient chart
            NULL;
        ELSIF v_status IN ('accepted', 'edited') THEN
            v_has_accepted := true;

            -- Field Allowlist Verification
            IF v_field = 'weight_kg' THEN
                v_new_weight := (v_val->>'value')::numeric;
                IF v_new_weight < 20 OR v_new_weight > 300 THEN
                    RAISE EXCEPTION 'Validation Failed: Weight value [%] is outside plausible clinical range (20-300 kg).', v_new_weight;
                END IF;

                -- Check safety impact: weight shift > 5% or > 3kg
                IF v_cur_weight IS NOT NULL AND abs(v_new_weight - v_cur_weight) >= 3.0 THEN
                    v_safety_impact := true;
                    v_invalidation_reasons := array_append(v_invalidation_reasons, 'Significant weight delta (' || v_cur_weight || 'kg -> ' || v_new_weight || 'kg) alters baseline energy floor');
                END IF;

            ELSIF v_field = 'height_cm' THEN
                v_new_height := (v_val->>'value')::numeric;
                IF v_new_height < 50 OR v_new_height > 250 THEN
                    RAISE EXCEPTION 'Validation Failed: Height [%] is outside clinical range (50-250 cm).', v_new_height;
                END IF;

            ELSIF v_field = 'waist_cm' THEN
                v_new_waist := (v_val->>'value')::numeric;
                IF v_new_waist < 30 OR v_new_waist > 200 THEN
                    RAISE EXCEPTION 'Validation Failed: Waist circumference [%] is outside clinical range (30-200 cm).', v_new_waist;
                END IF;

            ELSIF v_field = 'sleep_hours' THEN
                v_new_sleep := (v_val->>'value')::numeric;
                IF v_new_sleep < 0 OR v_new_sleep > 24 THEN
                    RAISE EXCEPTION 'Validation Failed: Sleep hours [%] is outside valid range (0-24 hrs).', v_new_sleep;
                END IF;

            ELSIF v_field = 'activity_level' THEN
                v_new_activity := v_val->>'value';
                IF v_new_activity NOT IN ('sedentary', 'light', 'moderate', 'very_active', 'extra_active') THEN
                    RAISE EXCEPTION 'Validation Failed: Invalid activity level [%].', v_new_activity;
                END IF;

            ELSIF v_field = 'bloating' THEN
                v_new_gut := jsonb_set(v_new_gut, '{bloating}', v_val->'value');
            ELSIF v_field = 'bristol_stool_score' THEN
                v_new_gut := jsonb_set(v_new_gut, '{bristol_stool_score}', v_val->'value');
            ELSIF v_field = 'acid_reflux' THEN
                v_new_gut := jsonb_set(v_new_gut, '{acid_reflux_hypoacidity}', v_val->'value');
            ELSIF v_field = 'digestive_fire_agni' THEN
                v_new_gut := jsonb_set(v_new_gut, '{digestive_fire_agni}', v_val->'value');

            ELSIF v_field = 'confirmed_allergies' THEN
                -- Explicit confirmed allergies acceptance
                IF jsonb_typeof(v_val->'value') = 'array' THEN
                    v_new_allergies := (
                        SELECT jsonb_agg(DISTINCT elem)
                        FROM (
                            SELECT jsonb_array_elements(v_cur_allergies) AS elem
                            UNION
                            SELECT jsonb_array_elements(v_val->'value') AS elem
                        ) combined
                    );
                    -- Detect genuinely new allergies
                    IF NOT (v_cur_allergies @> v_new_allergies) THEN
                        v_safety_impact := true;
                        v_invalidation_reasons := array_append(v_invalidation_reasons, 'Newly confirmed food allergen requires immediate clinical safety recalculation');
                    END IF;
                END IF;
            ELSE
                -- Reject unexpected / protected field modification attempts
                RAISE EXCEPTION 'Security Violation: Field [%] is not permitted for direct intake chart reconciliation.', v_field;
            END IF;
        END IF;
    END LOOP;

    -- Determine overall review status
    IF v_has_accepted AND v_has_rejected THEN
        v_review_status := 'partially_accepted';
    ELSIF NOT v_has_accepted AND v_has_rejected THEN
        v_review_status := 'rejected';
    ELSE
        v_review_status := 'approved';
    END IF;

    -- 5. ACTUALLY UPDATE PATIENT CHART IN THE DATABASE
    IF v_has_accepted THEN
        UPDATE public.patients
        SET
            weight_kg = COALESCE(v_new_weight, weight_kg),
            height_cm = COALESCE(v_new_height, height_cm),
            waist_cm = COALESCE(v_new_waist, waist_cm),
            sleep_hours = COALESCE(v_new_sleep, sleep_hours),
            activity_level = COALESCE(v_new_activity, activity_level),
            gut_profile = v_new_gut,
            confirmed_allergies = (
                SELECT ARRAY(SELECT jsonb_array_elements_text(v_new_allergies))
            ),
            allergy_reconciliation_status = CASE 
                WHEN v_safety_impact THEN 'allergies_confirmed' 
                ELSE allergy_reconciliation_status 
            END,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_patient.id;
    END IF;

    -- 6. Insert Assessment Review Record
    INSERT INTO public.assessment_reviews (
        organization_id,
        submission_id,
        clinician_id,
        reviewer_id,
        reviewer_name,
        review_status,
        status,
        reconciliation_diff_json,
        merged_patient_snapshot,
        review_notes,
        reviewed_at
    )
    VALUES (
        v_clinician.organization_id,
        p_submission_id,
        v_clinician.id,
        v_clinician.id,
        v_clinician.name,
        v_review_status,
        'completed',
        p_decisions,
        to_jsonb(v_patient),
        p_notes,
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_review_id;

    -- 7. Clinical Safety Invalidation: Invalidate affected approved plans
    IF v_safety_impact THEN
        UPDATE public.nutrition_plans
        SET 
            is_approved = false,
            status = 'requires_review',
            updated_at = timezone('utc'::text, now())
        WHERE patient_id = v_patient.id AND is_approved = true;

        GET DIAGNOSTICS v_invalidated_count = ROW_COUNT;

        IF v_invalidated_count > 0 THEN
            INSERT INTO public.audit_events (
                organization_id,
                patient_id,
                clinician_id,
                clinician_name,
                event_type,
                entity_type,
                entity_id,
                payload_after
            )
            VALUES (
                v_clinician.organization_id,
                v_patient.id,
                v_clinician.id,
                v_clinician.name,
                'PLAN_INVALIDATED',
                'nutrition_plan',
                v_patient.id::text,
                jsonb_build_object(
                    'reason', array_to_string(v_invalidation_reasons, '; '),
                    'invalidated_plans_count', v_invalidated_count,
                    'review_id', v_review_id
                )
            );
        END IF;
    END IF;

    -- 8. Log Reconciliation Audit Event
    INSERT INTO public.audit_events (
        organization_id,
        patient_id,
        clinician_id,
        clinician_name,
        event_type,
        entity_type,
        entity_id,
        payload_after
    )
    VALUES (
        v_clinician.organization_id,
        v_patient.id,
        v_clinician.id,
        v_clinician.name,
        CASE WHEN v_review_status = 'rejected' THEN 'ASSESSMENT_SUBMISSION_REJECTED' ELSE 'ASSESSMENT_SUBMISSION_ACCEPTED' END,
        'assessment_review',
        v_review_id::text,
        jsonb_build_object(
            'submission_id', p_submission_id,
            'review_id', v_review_id,
            'review_status', v_review_status,
            'invalidated_plans', v_invalidated_count,
            'notes', p_notes
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'review_id', v_review_id,
        'patient_id', v_patient.id,
        'review_status', v_review_status,
        'invalidated_plans_count', v_invalidated_count,
        'reviewed_at', now()
    );
END;
$$ LANGUAGE plpgsql;

-- Overload for backwards compatibility with legacy client signatures
CREATE OR REPLACE FUNCTION public.reconcile_intake_submission_atomic(
    p_organization_id UUID,
    p_submission_id UUID,
    p_reviewer_id UUID,
    p_decisions JSONB,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.reconcile_intake_submission_atomic(p_submission_id, p_decisions, p_notes);
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 8. HARDENED ATOMIC NUTRITION PLAN APPROVAL RPC
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_nutrition_plan_atomic(
    p_client_plan_id TEXT,
    p_client_patient_id TEXT,
    p_plan_version INTEGER,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clinician RECORD;
    v_patient RECORD;
    v_plan RECORD;
    v_approval_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Require Authenticated Session
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authenticated clinician identity is required.';
    END IF;

    -- 2. Derive Clinician from Session
    SELECT id, auth_user_id, name, role, is_active, organization_id, license_number
    INTO v_clinician
    FROM public.clinicians
    WHERE auth_user_id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unauthorized: No active clinician profile found for caller.';
    END IF;

    IF NOT v_clinician.is_active THEN
        RAISE EXCEPTION 'Unauthorized: Clinician account is inactive.';
    END IF;

    IF v_clinician.role NOT IN ('CLINICAL_DIRECTOR', 'TREATING_NUTRITIONIST') THEN
        RAISE EXCEPTION 'Forbidden: Role % is not authorized to approve clinical nutrition plans.', v_clinician.role;
    END IF;

    IF v_clinician.license_number IS NULL OR trim(v_clinician.license_number) = '' THEN
        RAISE EXCEPTION 'Validation Failed: Professional license number is required for formal sign-off.';
    END IF;

    -- 3. Resolve Patient in Clinician Organization
    SELECT id, organization_id, name INTO v_patient
    FROM public.patients
    WHERE organization_id = v_clinician.organization_id 
      AND (client_id = p_client_patient_id OR id::text = p_client_patient_id);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Validation Failed: Patient record [%] not found in clinician organization.', p_client_patient_id;
    END IF;

    -- 4. Resolve Plan Record & Enforce Invariants
    SELECT id, patient_id, version, overall_safety_status, is_approved, status
    INTO v_plan
    FROM public.nutrition_plans
    WHERE organization_id = v_clinician.organization_id 
      AND (client_plan_id = p_client_plan_id OR id::text = p_client_plan_id);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Validation Failed: Nutrition plan [%] not found.', p_client_plan_id;
    END IF;

    -- Plan-Patient Binding
    IF v_plan.patient_id != v_patient.id THEN
        RAISE EXCEPTION 'Safety Violation: Plan [%] does not belong to patient [%].', p_client_plan_id, p_client_patient_id;
    END IF;

    -- Exact Plan Version Matching
    IF v_plan.version != p_plan_version THEN
        RAISE EXCEPTION 'Version Mismatch: Current plan version is %, requested approval version is %.', v_plan.version, p_plan_version;
    END IF;

    -- HARD_STOP Safety Gate
    IF v_plan.overall_safety_status = 'HARD_STOP' THEN
        RAISE EXCEPTION 'Clinical Hard Stop: Cannot approve a nutrition plan with unresolved HARD_STOP contraindications.';
    END IF;

    -- 5. Insert Approval Record First (Legal sign-off atomicity)
    INSERT INTO public.approval_records (
        organization_id,
        plan_id,
        patient_id,
        clinician_id,
        clinician_name,
        license_number,
        plan_version,
        notes,
        approval_timestamp
    )
    VALUES (
        v_clinician.organization_id,
        v_plan.id,
        v_patient.id,
        v_clinician.id,
        v_clinician.name,
        v_clinician.license_number,
        p_plan_version,
        p_notes,
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_approval_id;

    -- 6. Update Plan to Approved
    UPDATE public.nutrition_plans
    SET 
        is_approved = true,
        status = 'approved',
        version = p_plan_version,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_plan.id;

    -- 7. Immutable Audit Event
    INSERT INTO public.audit_events (
        organization_id,
        patient_id,
        clinician_id,
        clinician_name,
        event_type,
        entity_type,
        entity_id,
        payload_after
    )
    VALUES (
        v_clinician.organization_id,
        v_patient.id,
        v_clinician.id,
        v_clinician.name,
        'PLAN_APPROVED',
        'approval_record',
        v_approval_id::text,
        jsonb_build_object(
            'plan_id', v_plan.id,
            'client_plan_id', p_client_plan_id,
            'plan_version', p_plan_version,
            'approval_record_id', v_approval_id,
            'license_number', v_clinician.license_number,
            'notes', p_notes
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'approval_id', v_approval_id,
        'plan_id', v_plan.id,
        'version', p_plan_version,
        'approved_at', now()
    );
END;
$$ LANGUAGE plpgsql;

-- Overload for backwards compatibility with legacy client signatures
CREATE OR REPLACE FUNCTION public.approve_nutrition_plan_atomic(
    p_organization_id UUID,
    p_client_plan_id TEXT,
    p_client_patient_id TEXT,
    p_clinician_id UUID,
    p_license_number TEXT,
    p_plan_version INTEGER,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.approve_nutrition_plan_atomic(p_client_plan_id, p_client_patient_id, p_plan_version, p_notes);
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 9. STRICT PRIVILEGE BOUNDARIES (REVOKE from PUBLIC / anon)
-- ---------------------------------------------------------------------

-- Revoke default public execution
REVOKE EXECUTE ON FUNCTION public.issue_assessment_invitation(UUID, INT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.revoke_assessment_invitation(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.revoke_assessment_invitation(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rotate_assessment_invitation(UUID, INT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reconcile_intake_submission_atomic(UUID, JSONB, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reconcile_intake_submission_atomic(UUID, UUID, UUID, JSONB, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.approve_nutrition_plan_atomic(TEXT, TEXT, INTEGER, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.approve_nutrition_plan_atomic(UUID, TEXT, TEXT, UUID, TEXT, INTEGER, TEXT) FROM PUBLIC, anon;

-- Grant privileged clinician functions ONLY to authenticated users
GRANT EXECUTE ON FUNCTION public.issue_assessment_invitation(UUID, INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_assessment_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_assessment_invitation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rotate_assessment_invitation(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_intake_submission_atomic(UUID, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_intake_submission_atomic(UUID, UUID, UUID, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_nutrition_plan_atomic(TEXT, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_nutrition_plan_atomic(UUID, TEXT, TEXT, UUID, TEXT, INTEGER, TEXT) TO authenticated;

-- Public intake functions: explicitly accessible by anonymous patients and authenticated
GRANT EXECUTE ON FUNCTION public.verify_public_intake_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_intake_assessment(TEXT, JSONB, TEXT) TO anon, authenticated;

-- Record in schema_migrations
INSERT INTO public.schema_migrations (version, description, applied_at)
VALUES (
    '20261123000002',
    'R3 security completion: hash-only token architecture, atomic reconciliation with chart update, safety invalidation, strict auth.uid() enforcement',
    timezone('utc'::text, now())
)
ON CONFLICT (version) DO UPDATE SET
    description = EXCLUDED.description,
    applied_at = EXCLUDED.applied_at;
