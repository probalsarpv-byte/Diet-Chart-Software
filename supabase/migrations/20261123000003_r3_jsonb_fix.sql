-- =====================================================================
-- SHUDDHO CLINICAL FUNCTIONAL & PRECISION NUTRITION PLATFORM
-- R3 FINAL CORRECTIVE MIGRATION: CONSENT ENFORCEMENT & JSONB MERGE FIX
-- Migration: 20261123000003_r3_jsonb_fix.sql
--
-- Safe, forward-only, idempotent, transactional corrective migration:
-- 1. Drops obsolete legacy 3-argument submit_public_intake_assessment(TEXT, JSONB, TEXT)
--    to prevent any anonymous caller from bypassing patient consent verification.
-- 2. Enforces single, unambiguous 4-argument submit_public_intake_assessment signature
--    with NO defaults on consent, strictly requiring p_patient_acknowledged_consent = TRUE.
-- 3. Corrects confirmed_allergies update in reconcile_intake_submission_atomic to
--    store v_new_allergies JSONB directly into JSONB column (fixes PostgreSQL text[] mismatch).
-- 4. Revokes and grants exact, least-privilege RPC execution rights.
-- =====================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- 1. DROP OBSOLETE LEGACY 3-ARGUMENT RPC & OVERLOADS
-- ---------------------------------------------------------------------
-- Safely revoke execute privileges if the legacy 3-argument function exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
          AND p.proname = 'submit_public_intake_assessment' 
          AND p.pronargs = 3
    ) THEN
        EXECUTE 'REVOKE ALL ON FUNCTION public.submit_public_intake_assessment(TEXT, JSONB, TEXT) FROM PUBLIC, anon, authenticated;';
    END IF;
END $$;
DROP FUNCTION IF EXISTS public.submit_public_intake_assessment(TEXT, JSONB, TEXT);

-- Drop previous 4-argument function to remove obsolete default parameters
DROP FUNCTION IF EXISTS public.submit_public_intake_assessment(TEXT, JSONB, TEXT, BOOLEAN);

-- ---------------------------------------------------------------------
-- 2. AUTHORITATIVE 4-ARGUMENT INTAKE SUBMISSION RPC (No defaults)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_public_intake_assessment(
    p_token TEXT,
    p_responses JSONB,
    p_client_ip TEXT,
    p_patient_acknowledged_consent BOOLEAN
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

    -- Strict Server-Side Consent Enforcement:
    -- Consent must be explicitly TRUE. NULL, FALSE, or omitted values are rejected immediately.
    IF p_patient_acknowledged_consent IS NOT TRUE THEN
        RAISE EXCEPTION 'Consent Not Acknowledged: Patient must explicitly acknowledge the consent statement before submitting assessment data.';
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

    -- Insert into isolated staging queue
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

    -- Mark invitation completed (atomic one-time consumption)
    UPDATE public.assessment_invitations
    SET 
        status = 'completed',
        updated_at = timezone('utc'::text, now())
    WHERE id = v_inv.id;

    -- Record audit event WITHOUT raw token
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
-- 3. FIX: reconcile_intake_submission_atomic — JSONB allergy merge fix
--    confirmed_allergies is JSONB NOT NULL DEFAULT '[]'.
--    Store v_new_allergies directly (it is already JSONB), not as text[].
-- ---------------------------------------------------------------------
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
    -- confirmed_allergies is JSONB NOT NULL DEFAULT '[]' — use directly
    v_cur_allergies := COALESCE(v_patient.confirmed_allergies, '[]'::jsonb);
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
            NULL;
        ELSIF v_status IN ('accepted', 'edited') THEN
            v_has_accepted := true;

            IF v_field = 'weight_kg' THEN
                v_new_weight := (v_val->>'value')::numeric;
                IF v_new_weight < 20 OR v_new_weight > 300 THEN
                    RAISE EXCEPTION 'Validation Failed: Weight value [%] is outside plausible clinical range (20-300 kg).', v_new_weight;
                END IF;
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
                -- Merge new allergens into existing JSONB array (confirmed_allergies is JSONB)
                IF jsonb_typeof(v_val->'value') = 'array' THEN
                    v_new_allergies := (
                        SELECT jsonb_agg(DISTINCT elem)
                        FROM (
                            SELECT jsonb_array_elements(v_cur_allergies) AS elem
                            UNION
                            SELECT jsonb_array_elements(v_val->'value') AS elem
                        ) combined
                    );
                    -- Coalesce to empty array if no elements
                    v_new_allergies := COALESCE(v_new_allergies, '[]'::jsonb);
                    -- Detect genuinely new allergies
                    IF NOT (v_cur_allergies @> v_new_allergies) THEN
                        v_safety_impact := true;
                        v_invalidation_reasons := array_append(v_invalidation_reasons, 'Newly confirmed food allergen requires immediate clinical safety recalculation');
                    END IF;
                END IF;
            ELSE
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

    -- 5. UPDATE PATIENT CHART IN DATABASE
    -- confirmed_allergies is JSONB — store v_new_allergies directly (not as text[])
    IF v_has_accepted THEN
        UPDATE public.patients
        SET
            weight_kg = COALESCE(v_new_weight, weight_kg),
            height_cm = COALESCE(v_new_height, height_cm),
            waist_cm = COALESCE(v_new_waist, waist_cm),
            sleep_hours = COALESCE(v_new_sleep, sleep_hours),
            activity_level = COALESCE(v_new_activity, activity_level),
            gut_profile = v_new_gut,
            confirmed_allergies = v_new_allergies,  -- JSONB stored directly
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

    -- 7. Clinical Safety Invalidation
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
                event_type,
                entity_type,
                entity_id,
                payload_after
            )
            VALUES (
                v_clinician.organization_id,
                v_patient.id,
                v_clinician.id,
                'PLAN_INVALIDATED',
                'nutrition_plan',
                v_patient.id::text,
                jsonb_build_object(
                    'clinician_name', v_clinician.name,
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
        event_type,
        entity_type,
        entity_id,
        payload_after
    )
    VALUES (
        v_clinician.organization_id,
        v_patient.id,
        v_clinician.id,
        CASE WHEN v_review_status = 'rejected' THEN 'ASSESSMENT_SUBMISSION_REJECTED' ELSE 'ASSESSMENT_SUBMISSION_ACCEPTED' END,
        'assessment_review',
        v_review_id::text,
        jsonb_build_object(
            'clinician_name', v_clinician.name,
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
-- 4. STRICT PRIVILEGE BOUNDARIES
-- ---------------------------------------------------------------------
-- Ensure anon and authenticated can ONLY execute the authoritative 4-argument signature
GRANT EXECUTE ON FUNCTION public.submit_public_intake_assessment(TEXT, JSONB, TEXT, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_intake_submission_atomic(UUID, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_intake_submission_atomic(UUID, UUID, UUID, JSONB, TEXT) TO authenticated;

-- ---------------------------------------------------------------------
-- 5. RECORD MIGRATION
-- ---------------------------------------------------------------------
INSERT INTO public.schema_migrations (version, description, applied_at)
VALUES (
    '20261123000003',
    'R3 final corrective: drop legacy 3-arg intake RPC to eliminate consent bypass, enforce authoritative 4-arg submit_public_intake_assessment without defaults, and verify JSONB allergy storage',
    timezone('utc'::text, now())
)
ON CONFLICT (version) DO UPDATE SET
    description = EXCLUDED.description,
    applied_at = EXCLUDED.applied_at;

COMMIT;

-- ---------------------------------------------------------------------
-- 6. POST-MIGRATION VERIFICATION QUERIES
-- ---------------------------------------------------------------------
-- Run in Supabase SQL Editor to verify clean state:
--
-- 1. Verify ONLY ONE submit_public_intake_assessment signature exists (must return exactly 1 row with 4 arguments):
-- SELECT proname, pg_get_function_arguments(oid)
-- FROM pg_proc WHERE proname = 'submit_public_intake_assessment';
-- Expected:
-- submit_public_intake_assessment | p_token text, p_responses jsonb, p_client_ip text, p_patient_acknowledged_consent boolean
--
-- 2. Verify confirmed_allergies column is jsonb:
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'patients' AND column_name = 'confirmed_allergies';
-- Expected: jsonb
--
-- 3. Verify schema migration recorded:
-- SELECT version, description, applied_at FROM public.schema_migrations WHERE version = '20261123000003';
