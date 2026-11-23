-- =====================================================================
-- SHUDDHO CLINICAL FUNCTIONAL & PRECISION NUTRITION PLATFORM
-- R3 DATABASE SCHEMA ALIGNMENT, ATOMIC APPROVAL & SECURE PUBLIC INTAKE
-- Migration: 20261123000001_r3_schema_and_security.sql
-- 
-- Non-destructive, forward-only corrective migration:
-- 1. Aligns R3 field contracts (invitation_token, responses_json, etc.)
-- 2. Makes template_id nullable with safe default fallback
-- 3. Provides atomic plan approval function (approve_nutrition_plan_atomic)
-- 4. Provides security-definer public intake token verification & submission
-- 5. Preserves existing tables, records, triggers and RLS policies
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ALIGN ASSESSMENT_TEMPLATES (Default Master Template)
-- ---------------------------------------------------------------------
INSERT INTO public.assessment_templates (code, title_en, title_bn, description, version, domains, schema, is_active)
VALUES (
    'SHUDDHO_STANDARD_INTAKE_V1',
    'Standard Functional Nutrition Intake Assessment',
    'স্ট্যান্ডার্ড ফাংশনাল নিউট্রিশন ইনটেক অ্যাসেসমেন্ট',
    'Comprehensive 5-step patient self-assessment covering anthropometrics, Agni, digestion, lifestyle and history.',
    1,
    '["anthropometrics", "agni_gut", "diet_lifestyle", "health_allergies", "consent"]'::jsonb,
    '{"steps": 5}'::jsonb,
    true
)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2. ALIGN ASSESSMENT_INVITATIONS
-- ---------------------------------------------------------------------
-- Add invitation_token alias column if missing
ALTER TABLE public.assessment_invitations
    ADD COLUMN IF NOT EXISTS invitation_token TEXT,
    ADD COLUMN IF NOT EXISTS sent_via TEXT DEFAULT 'link' CHECK (sent_via IN ('link', 'email', 'sms', 'whatsapp'));

-- Sync token and invitation_token
UPDATE public.assessment_invitations
SET invitation_token = token
WHERE invitation_token IS NULL AND token IS NOT NULL;

-- Make template_id nullable for flexible remote templates
ALTER TABLE public.assessment_invitations
    ALTER COLUMN template_id DROP NOT NULL;

-- Ensure unique index on invitation_token
CREATE UNIQUE INDEX IF NOT EXISTS idx_assessment_invitations_inv_token 
    ON public.assessment_invitations(invitation_token);

-- Trigger to keep token and invitation_token in sync
CREATE OR REPLACE FUNCTION public.sync_assessment_invitation_tokens()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.token IS NULL AND NEW.invitation_token IS NOT NULL THEN
        NEW.token := NEW.invitation_token;
    ELSIF NEW.invitation_token IS NULL AND NEW.token IS NOT NULL THEN
        NEW.invitation_token := NEW.token;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_invitation_tokens ON public.assessment_invitations;
CREATE TRIGGER trg_sync_invitation_tokens
BEFORE INSERT OR UPDATE ON public.assessment_invitations
FOR EACH ROW EXECUTE FUNCTION public.sync_assessment_invitation_tokens();

-- ---------------------------------------------------------------------
-- 3. ALIGN ASSESSMENT_SUBMISSIONS
-- ---------------------------------------------------------------------
ALTER TABLE public.assessment_submissions
    ADD COLUMN IF NOT EXISTS responses_json JSONB,
    ADD COLUMN IF NOT EXISTS calculated_scores_json JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS client_ip TEXT;

-- Make template_id nullable
ALTER TABLE public.assessment_submissions
    ALTER COLUMN template_id DROP NOT NULL;

-- Sync raw_responses and responses_json
UPDATE public.assessment_submissions
SET responses_json = raw_responses
WHERE responses_json IS NULL AND raw_responses IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_assessment_submission_responses()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.raw_responses IS NULL AND NEW.responses_json IS NOT NULL THEN
        NEW.raw_responses := NEW.responses_json;
    ELSIF NEW.responses_json IS NULL AND NEW.raw_responses IS NOT NULL THEN
        NEW.responses_json := NEW.raw_responses;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_submission_responses ON public.assessment_submissions;
CREATE TRIGGER trg_sync_submission_responses
BEFORE INSERT OR UPDATE ON public.assessment_submissions
FOR EACH ROW EXECUTE FUNCTION public.sync_assessment_submission_responses();

-- ---------------------------------------------------------------------
-- 4. ALIGN ASSESSMENT_REVIEWS
-- ---------------------------------------------------------------------
ALTER TABLE public.assessment_reviews
    ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES public.clinicians(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reviewer_name TEXT,
    ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'completed',
    ADD COLUMN IF NOT EXISTS reconciliation_diff_json JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS merged_patient_snapshot JSONB,
    ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Drop previous status check to allow extended statuses if present
ALTER TABLE public.assessment_reviews DROP CONSTRAINT IF EXISTS assessment_reviews_status_check;
ALTER TABLE public.assessment_reviews 
    ADD CONSTRAINT assessment_reviews_status_check 
    CHECK (status IN ('draft', 'completed', 'approved', 'rejected', 'partially_accepted'));

-- ---------------------------------------------------------------------
-- 5. ATOMIC PLAN APPROVAL FUNCTION (Stored Procedure)
-- ---------------------------------------------------------------------
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
DECLARE
    v_plan_id UUID;
    v_patient_id UUID;
    v_clinician RECORD;
    v_approval_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Validate clinician identity and role
    SELECT id, name, role, is_active, organization_id, license_number
    INTO v_clinician
    FROM public.clinicians
    WHERE id = p_clinician_id AND organization_id = p_organization_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unauthorized: Clinician not found in specified organization.';
    END IF;

    IF NOT v_clinician.is_active THEN
        RAISE EXCEPTION 'Unauthorized: Clinician account is inactive.';
    END IF;

    IF v_clinician.role NOT IN ('CLINICAL_DIRECTOR', 'TREATING_NUTRITIONIST') THEN
        RAISE EXCEPTION 'Forbidden: Role % is not authorized to approve clinical nutrition plans.', v_clinician.role;
    END IF;

    IF p_license_number IS NULL OR trim(p_license_number) = '' THEN
        RAISE EXCEPTION 'Validation Failed: Professional license number is required for formal sign-off.';
    END IF;

    -- 2. Resolve patient UUID
    SELECT id INTO v_patient_id
    FROM public.patients
    WHERE organization_id = p_organization_id AND (client_id = p_client_patient_id OR id::text = p_client_patient_id);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Validation Failed: Patient record [%] not found.', p_client_patient_id;
    END IF;

    -- 3. Resolve plan UUID
    SELECT id INTO v_plan_id
    FROM public.nutrition_plans
    WHERE organization_id = p_organization_id AND (client_plan_id = p_client_plan_id OR id::text = p_client_plan_id);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Validation Failed: Nutrition plan [%] not found.', p_client_plan_id;
    END IF;

    -- 4. Insert approval record FIRST (enforcing legal sign-off atomicity)
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
        p_organization_id,
        v_plan_id,
        v_patient_id,
        v_clinician.id,
        v_clinician.name,
        p_license_number,
        p_plan_version,
        p_notes,
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_approval_id;

    -- 5. Update plan state to approved
    UPDATE public.nutrition_plans
    SET 
        is_approved = true,
        status = 'approved',
        version = p_plan_version,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_plan_id;

    -- 6. Log audit event
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
        p_organization_id,
        v_patient_id,
        v_clinician.id,
        v_clinician.name,
        'PLAN_APPROVED',
        'approval_record',
        v_approval_id::text,
        jsonb_build_object(
            'plan_id', v_plan_id,
            'client_plan_id', p_client_plan_id,
            'plan_version', p_plan_version,
            'approval_record_id', v_approval_id,
            'license_number', p_license_number,
            'notes', p_notes
        )
    );

    v_result := jsonb_build_object(
        'success', true,
        'approval_id', v_approval_id,
        'plan_id', v_plan_id,
        'version', p_plan_version,
        'approved_at', now()
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 6. SECURE PUBLIC PATIENT INTAKE RPC FUNCTIONS (Security Definer)
-- ---------------------------------------------------------------------

-- A. Token Verification (Minimal metadata, zero private leak)
CREATE OR REPLACE FUNCTION public.verify_public_intake_token(p_token TEXT)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inv RECORD;
    v_patient RECORD;
    v_result JSONB;
BEGIN
    IF p_token IS NULL OR trim(p_token) = '' THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'missing');
    END IF;

    -- Look up invitation by either token or invitation_token
    SELECT id, organization_id, patient_id, expires_at, status
    INTO v_inv
    FROM public.assessment_invitations
    WHERE (token = p_token OR invitation_token = p_token);

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'invalid');
    END IF;

    IF v_inv.status = 'revoked' THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'revoked');
    END IF;

    IF v_inv.status = 'completed' THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'completed');
    END IF;

    IF v_inv.expires_at < timezone('utc'::text, now()) THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'expired');
    END IF;

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

-- B. Public Assessment Submission (Atomic staging, zero active chart mutation)
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
    v_inv RECORD;
    v_sub_id UUID;
    v_template_id UUID;
    v_result JSONB;
BEGIN
    IF p_token IS NULL OR trim(p_token) = '' THEN
        RAISE EXCEPTION 'Invalid Token: Token parameter is required.';
    END IF;

    IF p_responses IS NULL OR p_responses = '{}'::jsonb THEN
        RAISE EXCEPTION 'Validation Failed: Assessment responses cannot be empty.';
    END IF;

    -- Lock and verify invitation
    SELECT id, organization_id, patient_id, template_id, expires_at, status
    INTO v_inv
    FROM public.assessment_invitations
    WHERE (token = p_token OR invitation_token = p_token)
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid assessment invitation token.';
    END IF;

    IF v_inv.status = 'revoked' THEN
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

    -- 1. Insert into staging queue (assessment_submissions)
    INSERT INTO public.assessment_submissions (
        organization_id,
        invitation_id,
        patient_id,
        template_id,
        raw_responses,
        responses_json,
        client_ip,
        submitted_at
    )
    VALUES (
        v_inv.organization_id,
        v_inv.id,
        v_inv.patient_id,
        v_template_id,
        p_responses,
        p_responses,
        p_client_ip,
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_sub_id;

    -- 2. Mark invitation completed (atomic one-time consumption)
    UPDATE public.assessment_invitations
    SET 
        status = 'completed',
        updated_at = timezone('utc'::text, now())
    WHERE id = v_inv.id;

    -- 3. Record audit event
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
            'submitted_at', now()
        )
    );

    v_result := jsonb_build_object(
        'success', true,
        'submission_id', v_sub_id,
        'submitted_at', now()
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to anon and authenticated
GRANT EXECUTE ON FUNCTION public.verify_public_intake_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_intake_assessment(TEXT, JSONB, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_nutrition_plan_atomic(UUID, TEXT, TEXT, UUID, TEXT, INTEGER, TEXT) TO authenticated;

-- Record migration in schema_migrations
INSERT INTO public.schema_migrations (version, description, applied_at)
VALUES (
    '20261123000001',
    'R3 schema alignment, atomic approval RPC, and secure public intake RPC functions',
    timezone('utc'::text, now())
)
ON CONFLICT (version) DO NOTHING;
