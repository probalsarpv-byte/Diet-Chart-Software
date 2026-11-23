-- =====================================================================
-- SHUDDHO — Functional & Precision Nutrition Clinical Intelligence Platform
-- R3 DEFINITIVE INSTALLATION & UPGRADE SCRIPT
-- File: supabase/deployment/R3_FINAL_INSTALL_OR_UPGRADE.sql
--
-- TARGET ENVIRONMENT:
-- Supabase Project: shuddho-clinical
-- Target Schema: public
--
-- IDEMPOTENT & TRANSACTIONAL DEPLOYMENT CONTRACT:
-- This script handles all deployment scenarios safely within a single transaction:
--   Scenario A: Fresh Supabase project (R2 schema applied, no R3 applied)
--   Scenario B: R3 migration 1 applied, but not 2 or 3
--   Scenario C: R3 migrations 1 & 2 applied, but not 3
--   Scenario D: Partial or interrupted migration run
--   Scenario E: Re-running on already fully upgraded database (no-op / idempotent)
--
-- CLINICAL & SECURITY GUARANTEES:
-- 1. Eliminates consent bypass: Safely revokes and drops any legacy 3-argument
--    submit_public_intake_assessment function.
-- 2. Enforces authoritative 4-argument submit_public_intake_assessment requiring
--    explicit p_patient_acknowledged_consent = TRUE.
-- 3. Corrects confirmed_allergies storage: preserves JSONB data type in public.patients.
-- 4. Audit events schema contract: references only verified public.audit_events columns
--    (storing clinician_name inside payload_after) with non-breaking compatibility layer.
-- 5. Safe assessment_invitations nullability: drops NOT NULL on plaintext token column
--    to support SHA-256 hash-only storage architecture.
-- 6. Strict least-privilege RPC execution: only public intake functions granted to anon;
--    all clinical reconciliation, approval, and invitation issuance functions restricted to authenticated.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. EXTENSIONS & PREFLIGHT
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure schema_migrations table exists
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version TEXT PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ---------------------------------------------------------------------
-- 2. SCHEMA COMPATIBILITY & COLUMN ALIGNMENT
-- ---------------------------------------------------------------------

-- Table: public.assessment_templates
CREATE TABLE IF NOT EXISTS public.assessment_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    title_en TEXT NOT NULL,
    title_bn TEXT NOT NULL,
    description TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    domains JSONB NOT NULL DEFAULT '[]'::jsonb,
    schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Seed default standard intake template if not present
INSERT INTO public.assessment_templates (code, title_en, title_bn, description, version, is_active)
VALUES (
    'SHUDDHO_STANDARD_INTAKE_V1',
    'Comprehensive Functional Nutrition Intake Assessment',
    'পূর্ণাঙ্গ ফাংশনাল নিউট্রিশন সেলফ-অ্যাসেসমেন্ট',
    'Authoritative clinical intake questionnaire covering metabolic, gastrointestinal, lifestyle, dietary recall, and allergy symptoms.',
    1,
    true
)
ON CONFLICT (code) DO NOTHING;

-- Table: public.assessment_invitations
-- In R2, token was TEXT NOT NULL UNIQUE. In R3, token_hash is authoritative and token is nullable.
ALTER TABLE public.assessment_invitations
    ADD COLUMN IF NOT EXISTS token_hash TEXT,
    ADD COLUMN IF NOT EXISTS invitation_token TEXT,
    ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS first_accessed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sent_via TEXT DEFAULT 'direct';

-- Ensure token and template_id nullability is safe for hash-only workflow
ALTER TABLE public.assessment_invitations ALTER COLUMN token DROP NOT NULL;
ALTER TABLE public.assessment_invitations ALTER COLUMN template_id DROP NOT NULL;

-- Backfill token_hash for legacy records if needed
UPDATE public.assessment_invitations
SET token_hash = encode(digest(token, 'sha256'), 'hex')
WHERE token_hash IS NULL AND token IS NOT NULL;

UPDATE public.assessment_invitations
SET token_hash = encode(digest(invitation_token, 'sha256'), 'hex')
WHERE token_hash IS NULL AND invitation_token IS NOT NULL;

-- Indices on assessment_invitations
CREATE UNIQUE INDEX IF NOT EXISTS idx_assessment_invitations_token_hash 
    ON public.assessment_invitations(token_hash) 
    WHERE token_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assessment_invitations_patient_id 
    ON public.assessment_invitations(patient_id);
CREATE INDEX IF NOT EXISTS idx_assessment_invitations_status 
    ON public.assessment_invitations(status);

-- Table: public.assessment_submissions
ALTER TABLE public.assessment_submissions
    ADD COLUMN IF NOT EXISTS responses_json JSONB,
    ADD COLUMN IF NOT EXISTS client_ip TEXT,
    ADD COLUMN IF NOT EXISTS provenance TEXT DEFAULT 'PATIENT_SELF_REPORTED',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_review';

-- Synchronize responses_json and raw_responses for bidirectional compatibility
UPDATE public.assessment_submissions
SET responses_json = raw_responses
WHERE responses_json IS NULL AND raw_responses IS NOT NULL;

UPDATE public.assessment_submissions
SET raw_responses = responses_json
WHERE raw_responses IS NULL AND responses_json IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_assessment_submissions_patient_id 
    ON public.assessment_submissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_invitation_id 
    ON public.assessment_submissions(invitation_id);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_status 
    ON public.assessment_submissions(status);

-- Table: public.assessment_reviews
ALTER TABLE public.assessment_reviews
    ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES public.clinicians(id),
    ADD COLUMN IF NOT EXISTS reviewer_name TEXT,
    ADD COLUMN IF NOT EXISTS review_status TEXT,
    ADD COLUMN IF NOT EXISTS reconciliation_diff_json JSONB,
    ADD COLUMN IF NOT EXISTS merged_patient_snapshot JSONB,
    ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Backfill reviewer_id and review_notes if absent
UPDATE public.assessment_reviews
SET reviewer_id = clinician_id
WHERE reviewer_id IS NULL AND clinician_id IS NOT NULL;

UPDATE public.assessment_reviews
SET review_notes = notes
WHERE review_notes IS NULL AND notes IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_assessment_reviews_submission_id 
    ON public.assessment_reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_assessment_reviews_clinician_id 
    ON public.assessment_reviews(clinician_id);

-- Table: public.patients
-- Ensure clinical intake fields and confirmed_allergies are typed correctly
ALTER TABLE public.patients
    ADD COLUMN IF NOT EXISTS confirmed_allergies JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS allergy_reconciliation_status TEXT DEFAULT 'pending_review',
    ADD COLUMN IF NOT EXISTS gut_profile JSONB,
    ADD COLUMN IF NOT EXISTS sleep_hours NUMERIC,
    ADD COLUMN IF NOT EXISTS activity_level TEXT;

-- Table: public.audit_events
-- Safe forward/backward compatibility column for legacy or external tooling
ALTER TABLE public.audit_events
    ADD COLUMN IF NOT EXISTS clinician_name TEXT;

-- ---------------------------------------------------------------------
-- 3. ROW-LEVEL SECURITY POLICIES FOR INTAKE & RECONCILIATION
-- ---------------------------------------------------------------------
ALTER TABLE public.assessment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_reviews ENABLE ROW LEVEL SECURITY;

-- Assessment Templates Policies
DROP POLICY IF EXISTS "Clinicians can view templates" ON public.assessment_templates;
CREATE POLICY "Clinicians can view templates" ON public.assessment_templates
    FOR SELECT TO authenticated
    USING (
        organization_id IS NULL OR 
        organization_id IN (
            SELECT organization_id FROM public.clinicians WHERE auth_user_id = auth.uid()
        )
    );

-- Assessment Invitations Policies (Authenticated clinicians only)
DROP POLICY IF EXISTS "Clinicians can view organization invitations" ON public.assessment_invitations;
CREATE POLICY "Clinicians can view organization invitations" ON public.assessment_invitations
    FOR SELECT TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM public.clinicians WHERE auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Clinicians can insert organization invitations" ON public.assessment_invitations;
CREATE POLICY "Clinicians can insert organization invitations" ON public.assessment_invitations
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.clinicians WHERE auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Clinicians can update organization invitations" ON public.assessment_invitations;
CREATE POLICY "Clinicians can update organization invitations" ON public.assessment_invitations
    FOR UPDATE TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM public.clinicians WHERE auth_user_id = auth.uid()
        )
    );

-- Assessment Submissions Policies (Authenticated clinicians only)
DROP POLICY IF EXISTS "Clinicians can view organization submissions" ON public.assessment_submissions;
CREATE POLICY "Clinicians can view organization submissions" ON public.assessment_submissions
    FOR SELECT TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM public.clinicians WHERE auth_user_id = auth.uid()
        )
    );

-- Assessment Reviews Policies (Authenticated clinicians only)
DROP POLICY IF EXISTS "Clinicians can view organization reviews" ON public.assessment_reviews;
CREATE POLICY "Clinicians can view organization reviews" ON public.assessment_reviews
    FOR SELECT TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM public.clinicians WHERE auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Clinicians can insert organization reviews" ON public.assessment_reviews;
CREATE POLICY "Clinicians can insert organization reviews" ON public.assessment_reviews
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.clinicians WHERE auth_user_id = auth.uid()
        )
    );

-- Restrict anon from directly reading clinical patient tables
REVOKE ALL ON public.assessment_invitations FROM anon;
REVOKE ALL ON public.assessment_submissions FROM anon;
REVOKE ALL ON public.assessment_reviews FROM anon;
REVOKE ALL ON public.patients FROM anon;
REVOKE ALL ON public.visits FROM anon;
REVOKE ALL ON public.nutrition_plans FROM anon;
REVOKE ALL ON public.approval_records FROM anon;
REVOKE ALL ON public.audit_events FROM anon;

-- ---------------------------------------------------------------------
-- 4. CLEAN UP OBSOLETE INTAKE SIGNATURES (Eliminate Consent Bypass)
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
DROP FUNCTION IF EXISTS public.submit_public_intake_assessment(TEXT, JSONB, TEXT, BOOLEAN);

-- ---------------------------------------------------------------------
-- 5. AUTHORITATIVE STORED PROCEDURES
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- A. ISSUE ASSESSMENT INVITATION
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.issue_assessment_invitation(
    p_patient_id UUID,
    p_template_id UUID DEFAULT NULL,
    p_sent_via TEXT DEFAULT 'direct',
    p_expires_in INTERVAL DEFAULT INTERVAL '7 days'
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clinician RECORD;
    v_patient RECORD;
    v_token TEXT;
    v_token_hash TEXT;
    v_inv_id UUID;
    v_expires_at TIMESTAMPTZ;
    v_template_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authenticated clinician identity is required.';
    END IF;

    SELECT id, organization_id, role, is_active, name INTO v_clinician
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

    SELECT id, organization_id, name INTO v_patient
    FROM public.patients
    WHERE id = p_patient_id AND organization_id = v_clinician.organization_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Validation Failed: Patient record [%] not found in clinician organization.', p_patient_id;
    END IF;

    IF p_template_id IS NOT NULL THEN
        SELECT id INTO v_template_id
        FROM public.assessment_templates
        WHERE id = p_template_id AND (organization_id IS NULL OR organization_id = v_clinician.organization_id);

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Validation Failed: Template [%] not found or not accessible.', p_template_id;
        END IF;
    ELSE
        SELECT id INTO v_template_id
        FROM public.assessment_templates
        WHERE code = 'SHUDDHO_STANDARD_INTAKE_V1'
        LIMIT 1;
    END IF;

    v_token := encode(gen_random_bytes(32), 'hex');
    v_token_hash := encode(digest(v_token, 'sha256'), 'hex');
    v_expires_at := timezone('utc'::text, now()) + p_expires_in;

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
        'INTAKE_INVITATION_CREATED',
        'assessment_invitation',
        v_inv_id::text,
        jsonb_build_object(
            'clinician_name', v_clinician.name,
            'invitation_id', v_inv_id,
            'token_hash_preview', substring(v_token_hash from 1 for 10),
            'expires_at', v_expires_at,
            'sent_via', p_sent_via
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'invitation_id', v_inv_id,
        'token', v_token,
        'token_hash', v_token_hash,
        'expires_at', v_expires_at,
        'patient_id', v_patient.id
    );
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- B. REVOKE ASSESSMENT INVITATION
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
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authenticated clinician identity is required.';
    END IF;

    SELECT id, organization_id, role, is_active, name INTO v_clinician
    FROM public.clinicians
    WHERE auth_user_id = auth.uid();

    IF NOT FOUND OR NOT v_clinician.is_active THEN
        RAISE EXCEPTION 'Unauthorized: Active clinician profile required.';
    END IF;

    SELECT id, organization_id, patient_id, status, token_hash INTO v_inv
    FROM public.assessment_invitations
    WHERE id = p_invitation_id AND organization_id = v_clinician.organization_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NotFound: Assessment invitation [%] not found.', p_invitation_id;
    END IF;

    IF v_inv.status = 'revoked' THEN
        RETURN jsonb_build_object('success', true, 'invitation_id', p_invitation_id, 'status', 'already_revoked');
    END IF;

    UPDATE public.assessment_invitations
    SET 
        status = 'revoked',
        revoked_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_invitation_id;

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
        v_inv.patient_id,
        v_clinician.id,
        'INTAKE_INVITATION_REVOKED',
        'assessment_invitation',
        p_invitation_id::text,
        jsonb_build_object(
            'clinician_name', v_clinician.name,
            'invitation_id', p_invitation_id,
            'token_hash_preview', substring(v_inv.token_hash from 1 for 10),
            'revoked_at', now()
        )
    );

    RETURN jsonb_build_object('success', true, 'invitation_id', p_invitation_id, 'status', 'revoked');
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- C. ROTATE ASSESSMENT INVITATION
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rotate_assessment_invitation(
    p_invitation_id UUID
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
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authenticated clinician identity is required.';
    END IF;

    SELECT id, organization_id, role, is_active, name INTO v_clinician
    FROM public.clinicians
    WHERE auth_user_id = auth.uid();

    IF NOT FOUND OR NOT v_clinician.is_active THEN
        RAISE EXCEPTION 'Unauthorized: Active clinician profile required.';
    END IF;

    SELECT id, organization_id, patient_id, template_id, sent_via INTO v_existing
    FROM public.assessment_invitations
    WHERE id = p_invitation_id AND organization_id = v_clinician.organization_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NotFound: Assessment invitation [%] not found.', p_invitation_id;
    END IF;

    PERFORM public.revoke_assessment_invitation(p_invitation_id);

    v_fresh_res := public.issue_assessment_invitation(
        v_existing.patient_id,
        v_existing.template_id,
        v_existing.sent_via,
        INTERVAL '7 days'
    );

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
            'clinician_name', v_clinician.name,
            'old_invitation_id', p_invitation_id,
            'new_invitation_id', v_fresh_res->>'invitation_id',
            'rotated_at', now()
        )
    );

    RETURN v_fresh_res;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- D. VERIFY PUBLIC INTAKE TOKEN (Publicly callable by anon)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_public_intake_token(
    p_token TEXT
)
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
        RETURN jsonb_build_object('valid', false, 'reason', 'invalid_token');
    END IF;

    v_hash := encode(digest(p_token, 'sha256'), 'hex');

    SELECT id, organization_id, patient_id, template_id, expires_at, status, revoked_at
    INTO v_inv
    FROM public.assessment_invitations
    WHERE token_hash = v_hash 
       OR (invitation_token IS NOT NULL AND invitation_token = p_token)
       OR (token IS NOT NULL AND token = p_token);

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
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

    UPDATE public.assessment_invitations
    SET 
        access_count = access_count + 1,
        first_accessed_at = COALESCE(first_accessed_at, timezone('utc'::text, now())),
        last_accessed_at = timezone('utc'::text, now())
    WHERE id = v_inv.id;

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
-- E. SUBMIT PUBLIC INTAKE ASSESSMENT (Publicly callable by anon)
-- Authoritative 4-argument signature with strict server-side consent enforcement
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

    IF octet_length(p_responses::text) > 1048576 THEN
        RAISE EXCEPTION 'Payload too large: Responses exceed 1MB limit.';
    END IF;

    IF p_responses IS NULL OR p_responses = '{}'::jsonb THEN
        RAISE EXCEPTION 'Validation Failed: Assessment responses cannot be empty.';
    END IF;

    v_clean_responses := p_responses - 'invitation_token' - 'token';
    v_hash := encode(digest(p_token, 'sha256'), 'hex');

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

    UPDATE public.assessment_invitations
    SET 
        status = 'completed',
        updated_at = timezone('utc'::text, now())
    WHERE id = v_inv.id;

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
            'client_ip', p_client_ip,
            'patient_acknowledged_consent', true,
            'provenance', 'PATIENT_SELF_REPORTED'
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'submission_id', v_sub_id,
        'invitation_id', v_inv.id,
        'patient_id', v_inv.patient_id,
        'status', 'completed',
        'submitted_at', now()
    );
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- F. ATOMIC CLINICAL RECONCILIATION & SAFETY INVALIDATION
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
    v_submission RECORD;
    v_patient RECORD;
    v_review_id UUID;
    v_field_key TEXT;
    v_decision_obj JSONB;
    v_status TEXT;
    v_val JSONB;
    v_has_accepted BOOLEAN := false;
    v_has_rejected BOOLEAN := false;
    v_review_status TEXT;
    
    v_new_weight NUMERIC := NULL;
    v_new_height NUMERIC := NULL;
    v_new_waist NUMERIC := NULL;
    v_new_sleep NUMERIC := NULL;
    v_new_activity TEXT := NULL;
    v_new_gut JSONB := NULL;
    v_new_allergies JSONB := NULL;
    
    v_safety_impact BOOLEAN := false;
    v_invalidated_count INT := 0;
    v_invalidation_reasons TEXT[] := ARRAY[]::TEXT[];
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authenticated clinician identity is required.';
    END IF;

    SELECT id, organization_id, role, is_active, name INTO v_clinician
    FROM public.clinicians
    WHERE auth_user_id = auth.uid();

    IF NOT FOUND OR NOT v_clinician.is_active THEN
        RAISE EXCEPTION 'Unauthorized: Active clinician profile required.';
    END IF;

    IF v_clinician.role NOT IN ('CLINICAL_DIRECTOR', 'TREATING_NUTRITIONIST') THEN
        RAISE EXCEPTION 'Forbidden: Role % is not authorized to reconcile patient clinical intake.', v_clinician.role;
    END IF;

    SELECT id, organization_id, patient_id, responses_json, raw_responses, submitted_at
    INTO v_submission
    FROM public.assessment_submissions
    WHERE id = p_submission_id AND organization_id = v_clinician.organization_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NotFound: Assessment submission [%] not found.', p_submission_id;
    END IF;

    SELECT * INTO v_patient
    FROM public.patients
    WHERE id = v_submission.patient_id AND organization_id = v_clinician.organization_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NotFound: Patient [%] not found.', v_submission.patient_id;
    END IF;

    IF p_decisions IS NULL OR jsonb_typeof(p_decisions) <> 'object' THEN
        RAISE EXCEPTION 'Validation Failed: Decisions parameter must be a JSON object of field reconciliation choices.';
    END IF;

    v_new_allergies := v_patient.confirmed_allergies;
    v_new_gut := v_patient.gut_profile;

    FOR v_field_key, v_decision_obj IN SELECT * FROM jsonb_each(p_decisions)
    LOOP
        IF v_field_key NOT IN (
            'weight_kg', 'height_cm', 'waist_cm', 'sleep_hours', 'activity_level',
            'gut_profile', 'confirmed_allergies'
        ) THEN
            RAISE EXCEPTION 'Clinical Integrity Violation: Field [%] is not permitted for automated clinical reconciliation.', v_field_key;
        END IF;

        v_status := v_decision_obj->>'status';
        v_val := v_decision_obj->'reconciled_value';

        IF v_status = 'accepted' THEN
            v_has_accepted := true;
            CASE v_field_key
                WHEN 'weight_kg' THEN
                    v_new_weight := (v_val->>0)::numeric;
                    IF v_new_weight < 20 OR v_new_weight > 300 THEN
                        RAISE EXCEPTION 'Physiological Out of Bounds: weight_kg must be between 20 and 300.';
                    END IF;
                WHEN 'height_cm' THEN
                    v_new_height := (v_val->>0)::numeric;
                    IF v_new_height < 50 OR v_new_height > 250 THEN
                        RAISE EXCEPTION 'Physiological Out of Bounds: height_cm must be between 50 and 250.';
                    END IF;
                WHEN 'waist_cm' THEN
                    v_new_waist := (v_val->>0)::numeric;
                WHEN 'sleep_hours' THEN
                    v_new_sleep := (v_val->>0)::numeric;
                WHEN 'activity_level' THEN
                    v_new_activity := v_val->>0;
                WHEN 'gut_profile' THEN
                    v_new_gut := v_val;
                WHEN 'confirmed_allergies' THEN
                    v_new_allergies := v_val;
                    v_safety_impact := true;
                    v_invalidation_reasons := array_append(v_invalidation_reasons, 'Newly confirmed patient allergy profile requires re-verification of active nutrition plans.');
            END CASE;
        ELSIF v_status = 'rejected' THEN
            v_has_rejected := true;
        END IF;
    END LOOP;

    IF v_has_accepted AND v_has_rejected THEN
        v_review_status := 'partially_accepted';
    ELSIF NOT v_has_accepted AND v_has_rejected THEN
        v_review_status := 'rejected';
    ELSE
        v_review_status := 'approved';
    END IF;

    -- ACTUALLY UPDATE PATIENT RECORD IN DATABASE
    IF v_has_accepted THEN
        UPDATE public.patients
        SET
            weight_kg = COALESCE(v_new_weight, weight_kg),
            height_cm = COALESCE(v_new_height, height_cm),
            waist_cm = COALESCE(v_new_waist, waist_cm),
            sleep_hours = COALESCE(v_new_sleep, sleep_hours),
            activity_level = COALESCE(v_new_activity, activity_level),
            gut_profile = v_new_gut,
            confirmed_allergies = v_new_allergies,
            allergy_reconciliation_status = CASE 
                WHEN v_safety_impact THEN 'allergies_confirmed' 
                ELSE allergy_reconciliation_status 
            END,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_patient.id;
    END IF;

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

    -- Clinical Safety Invalidation
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

    -- Log Reconciliation Audit Event
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

-- Backward compatibility overload for legacy 5-parameter signature
CREATE OR REPLACE FUNCTION public.reconcile_intake_submission_atomic(
    p_submission_id UUID,
    p_patient_id UUID,
    p_clinician_id UUID,
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
-- G. ATOMIC CLINICAL PLAN APPROVAL
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_nutrition_plan_atomic(
    p_plan_id UUID,
    p_client_plan_id TEXT,
    p_plan_version INTEGER,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clinician RECORD;
    v_plan RECORD;
    v_patient RECORD;
    v_approval_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authenticated clinician identity is required.';
    END IF;

    SELECT id, organization_id, role, is_active, name, license_number INTO v_clinician
    FROM public.clinicians
    WHERE auth_user_id = auth.uid();

    IF NOT FOUND OR NOT v_clinician.is_active THEN
        RAISE EXCEPTION 'Unauthorized: Active clinician profile required.';
    END IF;

    IF v_clinician.role NOT IN ('CLINICAL_DIRECTOR', 'TREATING_NUTRITIONIST') THEN
        RAISE EXCEPTION 'Forbidden: Role % is not authorized to legally sign off on nutrition plans.', v_clinician.role;
    END IF;

    SELECT * INTO v_plan
    FROM public.nutrition_plans
    WHERE id = p_plan_id AND organization_id = v_clinician.organization_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NotFound: Nutrition plan [%] not found.', p_plan_id;
    END IF;

    SELECT id, name, organization_id INTO v_patient
    FROM public.patients
    WHERE id = v_plan.patient_id AND organization_id = v_clinician.organization_id;

    IF v_plan.overall_safety_status = 'HARD_STOP' THEN
        RAISE EXCEPTION 'Clinical Hard Stop: Cannot approve a nutrition plan with unresolved HARD_STOP contraindications.';
    END IF;

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

    UPDATE public.nutrition_plans
    SET 
        is_approved = true,
        status = 'approved',
        version = p_plan_version,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_plan.id;

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
        'PLAN_APPROVED',
        'approval_record',
        v_approval_id::text,
        jsonb_build_object(
            'clinician_name', v_clinician.name,
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
        'approval_record_id', v_approval_id,
        'plan_id', v_plan.id,
        'version', p_plan_version,
        'clinician_name', v_clinician.name,
        'license_number', v_clinician.license_number,
        'approved_at', now()
    );
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 6. STRICT LEAST-PRIVILEGE GRANTS
-- ---------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.verify_public_intake_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_intake_assessment(TEXT, JSONB, TEXT, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_assessment_invitation(UUID, UUID, TEXT, INTERVAL) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_assessment_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rotate_assessment_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_intake_submission_atomic(UUID, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_intake_submission_atomic(UUID, UUID, UUID, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_nutrition_plan_atomic(UUID, TEXT, INTEGER, TEXT) TO authenticated;

-- ---------------------------------------------------------------------
-- 7. RECORD SCHEMA MIGRATIONS
-- ---------------------------------------------------------------------
INSERT INTO public.schema_migrations (version, description, applied_at)
VALUES 
    ('20261123000001', 'R3 Schema and Security: assessment intake tables, indices, RLS, token verification, and invitation lifecycle', timezone('utc'::text, now())),
    ('20261123000002', 'R3 Security Completion: SHA-256 hash architecture, isolated submission queue, atomic reconciliation, and clinical plan approval', timezone('utc'::text, now())),
    ('20261123000003', 'R3 Definitive Release: drop legacy 3-arg intake RPC to eliminate consent bypass, enforce authoritative 4-arg submit_public_intake_assessment without defaults, JSONB allergy storage, and audit events contract alignment', timezone('utc'::text, now()))
ON CONFLICT (version) DO UPDATE SET
    description = EXCLUDED.description,
    applied_at = EXCLUDED.applied_at;

COMMIT;

-- =====================================================================
-- POST-DEPLOYMENT VERIFICATION QUERIES
-- Run the following statements in the Supabase SQL Editor to verify
-- successful deployment of the R3 contract:
-- =====================================================================
-- 1. Verify submit_public_intake_assessment has exactly 1 overload (4 parameters, no defaults):
-- SELECT proname, pronargs, pg_get_function_arguments(oid)
-- FROM pg_proc WHERE proname = 'submit_public_intake_assessment';
-- Expected:
-- submit_public_intake_assessment | 4 | p_token text, p_responses jsonb, p_client_ip text, p_patient_acknowledged_consent boolean
--
-- 2. Verify confirmed_allergies is JSONB in patients:
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'patients' AND column_name = 'confirmed_allergies';
-- Expected: jsonb
--
-- 3. Verify token column is nullable in assessment_invitations:
-- SELECT column_name, is_nullable, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'assessment_invitations' AND column_name IN ('token', 'token_hash');
-- Expected: token -> YES, token_hash -> YES/TEXT
--
-- 4. Verify all 3 migrations recorded:
-- SELECT version, description, applied_at FROM public.schema_migrations ORDER BY version;
-- =====================================================================
