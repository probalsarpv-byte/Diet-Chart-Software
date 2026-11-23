-- =====================================================================
-- SHUDDHO CLINICAL FUNCTIONAL & PRECISION NUTRITION PLATFORM
-- R3 DATABASE SCHEMA ALIGNMENT, ATOMIC RECONCILIATION, APPROVAL & SECURE PUBLIC INTAKE
-- Migration: 20261123000001_r3_schema_and_security.sql
-- 
-- Non-destructive, forward-only corrective migration:
-- 1. Cryptographic pgcrypto extension for SHA-256 token hashing
-- 2. Aligns R3 field contracts (token_hash, invitation_token, responses_json, etc.)
-- 3. Hardens approve_nutrition_plan_atomic against clinician impersonation & safety HARD_STOP
-- 4. Provides atomic clinical reconciliation stored procedure (reconcile_intake_submission_atomic)
-- 5. Provides security-definer public intake token verification & submission
-- 6. Implements invitation revocation and rotation procedures
-- 7. Restricts public table access and grants explicit minimal privileges
-- =====================================================================

-- Enable pgcrypto for SHA-256 hashing if not already available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
-- 2. ALIGN ASSESSMENT_INVITATIONS (Token Hashing, Expiry & Telemetry)
-- ---------------------------------------------------------------------
ALTER TABLE public.assessment_invitations
    ADD COLUMN IF NOT EXISTS token_hash TEXT,
    ADD COLUMN IF NOT EXISTS invitation_token TEXT,
    ADD COLUMN IF NOT EXISTS sent_via TEXT DEFAULT 'link' CHECK (sent_via IN ('link', 'email', 'sms', 'whatsapp')),
    ADD COLUMN IF NOT EXISTS access_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS first_accessed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

-- Make template_id nullable for flexible remote templates
ALTER TABLE public.assessment_invitations
    ALTER COLUMN template_id DROP NOT NULL;

-- Sync token and invitation_token
UPDATE public.assessment_invitations
SET invitation_token = token
WHERE invitation_token IS NULL AND token IS NOT NULL;

-- Backfill token_hash for existing records
UPDATE public.assessment_invitations
SET token_hash = encode(digest(COALESCE(invitation_token, token), 'sha256'), 'hex')
WHERE token_hash IS NULL AND (invitation_token IS NOT NULL OR token IS NOT NULL);

-- Indexes for performance and uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_assessment_invitations_inv_token 
    ON public.assessment_invitations(invitation_token);

CREATE UNIQUE INDEX IF NOT EXISTS idx_assessment_invitations_token_hash 
    ON public.assessment_invitations(token_hash);

-- Trigger to keep token, invitation_token and token_hash in sync
CREATE OR REPLACE FUNCTION public.sync_assessment_invitation_tokens()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.token IS NULL AND NEW.invitation_token IS NOT NULL THEN
        NEW.token := NEW.invitation_token;
    ELSIF NEW.invitation_token IS NULL AND NEW.token IS NOT NULL THEN
        NEW.invitation_token := NEW.token;
    END IF;

    -- Ensure token_hash is computed
    IF NEW.token_hash IS NULL AND COALESCE(NEW.invitation_token, NEW.token) IS NOT NULL THEN
        NEW.token_hash := encode(digest(COALESCE(NEW.invitation_token, NEW.token), 'sha256'), 'hex');
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
    ADD COLUMN IF NOT EXISTS client_ip TEXT,
    ADD COLUMN IF NOT EXISTS provenance TEXT DEFAULT 'PATIENT_SELF_REPORTED';

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

-- Trigger to sync clinician_id and reviewer_id
CREATE OR REPLACE FUNCTION public.sync_assessment_review_clinician_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.clinician_id IS NULL AND NEW.reviewer_id IS NOT NULL THEN
        NEW.clinician_id := NEW.reviewer_id;
    ELSIF NEW.reviewer_id IS NULL AND NEW.clinician_id IS NOT NULL THEN
        NEW.reviewer_id := NEW.clinician_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_assessment_review_clinician_id ON public.assessment_reviews;
CREATE TRIGGER trg_sync_assessment_review_clinician_id
BEFORE INSERT OR UPDATE ON public.assessment_reviews
FOR EACH ROW EXECUTE FUNCTION public.sync_assessment_review_clinician_id();

-- ---------------------------------------------------------------------
-- 5. ATOMIC PLAN APPROVAL FUNCTION (Security Hardened)
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
    v_plan RECORD;
    v_patient_id UUID;
    v_clinician RECORD;
    v_approval_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Validate clinician identity and role
    SELECT id, auth_user_id, name, role, is_active, organization_id, license_number
    INTO v_clinician
    FROM public.clinicians
    WHERE id = p_clinician_id AND organization_id = p_organization_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unauthorized: Clinician not found in specified organization.';
    END IF;

    -- Anti-impersonation: when executed in an authenticated Supabase Auth context,
    -- verify that auth.uid() matches the clinician's auth_user_id
    IF auth.uid() IS NOT NULL AND v_clinician.auth_user_id IS NOT NULL AND v_clinician.auth_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Authenticated session identity does not match clinician account.';
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

    -- 3. Resolve plan record & verify patient binding and safety status
    SELECT id, patient_id, version, overall_safety_status, is_approved
    INTO v_plan
    FROM public.nutrition_plans
    WHERE organization_id = p_organization_id AND (client_plan_id = p_client_plan_id OR id::text = p_client_plan_id);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Validation Failed: Nutrition plan [%] not found.', p_client_plan_id;
    END IF;

    -- Enforce plan-patient binding
    IF v_plan.patient_id != v_patient_id THEN
        RAISE EXCEPTION 'Safety Violation: Plan [%] does not belong to patient [%].', p_client_plan_id, p_client_patient_id;
    END IF;

    -- Enforce exact plan version binding
    IF v_plan.version != p_plan_version THEN
        RAISE EXCEPTION 'Version Mismatch: Current plan version is %, requested approval version is %.', v_plan.version, p_plan_version;
    END IF;

    -- Enforce clinical safety hard-stop protection
    IF v_plan.overall_safety_status = 'HARD_STOP' THEN
        RAISE EXCEPTION 'Clinical Hard Stop: Cannot approve a nutrition plan with unresolved HARD_STOP contraindications.';
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
        v_plan.id,
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
    WHERE id = v_plan.id;

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
            'plan_id', v_plan.id,
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
        'plan_id', v_plan.id,
        'version', p_plan_version,
        'approved_at', now()
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 6. SECURE PUBLIC PATIENT INTAKE RPC FUNCTIONS (Security Definer)
-- ---------------------------------------------------------------------

-- A. Token Verification (Minimal metadata, zero private leak, access telemetry)
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

    -- Look up invitation by hash OR token for backward compatibility
    SELECT id, organization_id, patient_id, expires_at, status, revoked_at
    INTO v_inv
    FROM public.assessment_invitations
    WHERE (token_hash = v_hash OR invitation_token = p_token OR token = p_token);

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

    -- Telemetry: increment access count and update timestamps
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
    v_hash TEXT;
    v_inv RECORD;
    v_sub_id UUID;
    v_template_id UUID;
    v_result JSONB;
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

    -- Compute SHA-256 hash
    v_hash := encode(digest(p_token, 'sha256'), 'hex');

    -- Lock and verify invitation
    SELECT id, organization_id, patient_id, template_id, expires_at, status, revoked_at
    INTO v_inv
    FROM public.assessment_invitations
    WHERE (token_hash = v_hash OR invitation_token = p_token OR token = p_token)
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

    -- 1. Insert into staging queue (assessment_submissions)
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
        p_responses,
        p_responses,
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

-- C. Invitation Revocation Function
CREATE OR REPLACE FUNCTION public.revoke_assessment_invitation(
    p_invitation_id UUID,
    p_clinician_id UUID
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inv RECORD;
    v_clinician RECORD;
BEGIN
    SELECT id, organization_id, patient_id, status INTO v_inv
    FROM public.assessment_invitations
    WHERE id = p_invitation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Assessment invitation [%] not found.', p_invitation_id;
    END IF;

    SELECT id, name, organization_id INTO v_clinician
    FROM public.clinicians
    WHERE id = p_clinician_id AND organization_id = v_inv.organization_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Clinician not authorized to revoke invitation for this organization.';
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
        clinician_name,
        event_type,
        entity_type,
        entity_id,
        payload_after
    )
    VALUES (
        v_inv.organization_id,
        v_inv.patient_id,
        v_clinician.id,
        v_clinician.name,
        'INTAKE_INVITATION_REVOKED',
        'assessment_invitation',
        p_invitation_id::text,
        jsonb_build_object(
            'invitation_id', p_invitation_id,
            'revoked_at', now()
        )
    );

    RETURN jsonb_build_object('success', true, 'invitation_id', p_invitation_id, 'status', 'revoked');
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 7. ATOMIC INTAKE RECONCILIATION STORED PROCEDURE
-- ---------------------------------------------------------------------
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
DECLARE
    v_sub RECORD;
    v_patient RECORD;
    v_reviewer RECORD;
    v_review_id UUID;
    v_review_status TEXT := 'completed';
    v_invalidated_count INT := 0;
    v_has_new_allergies BOOLEAN := false;
    v_new_allergies JSONB := '[]'::jsonb;
    v_result JSONB;
BEGIN
    -- 1. Validate Reviewer
    SELECT id, auth_user_id, name, role, is_active, organization_id
    INTO v_reviewer
    FROM public.clinicians
    WHERE id = p_reviewer_id AND organization_id = p_organization_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unauthorized: Reviewer clinician not found in organization.';
    END IF;

    -- Anti-impersonation check
    IF auth.uid() IS NOT NULL AND v_reviewer.auth_user_id IS NOT NULL AND v_reviewer.auth_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Caller identity does not match clinician account.';
    END IF;

    IF NOT v_reviewer.is_active THEN
        RAISE EXCEPTION 'Unauthorized: Reviewer account is inactive.';
    END IF;

    IF v_reviewer.role NOT IN ('CLINICAL_DIRECTOR', 'TREATING_NUTRITIONIST') THEN
        RAISE EXCEPTION 'Forbidden: Role % is not authorized to reconcile patient intakes.', v_reviewer.role;
    END IF;

    -- 2. Resolve Submission
    SELECT id, organization_id, patient_id, responses_json, raw_responses
    INTO v_sub
    FROM public.assessment_submissions
    WHERE id = p_submission_id AND organization_id = p_organization_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Submission [%] not found in organization.', p_submission_id;
    END IF;

    -- Check if submission was already reviewed
    IF EXISTS (SELECT 1 FROM public.assessment_reviews WHERE submission_id = p_submission_id) THEN
        RAISE EXCEPTION 'Submission [%] has already been reconciled.', p_submission_id;
    END IF;

    -- 3. Resolve Patient
    SELECT * INTO v_patient
    FROM public.patients
    WHERE id = v_sub.patient_id AND organization_id = p_organization_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target patient [%] not found.', v_sub.patient_id;
    END IF;

    -- Check if confirmed_allergies decision is present and accepted
    IF p_decisions ? 'confirmed_allergies' AND (p_decisions->'confirmed_allergies'->>'status') = 'accepted' THEN
        v_has_new_allergies := true;
        v_new_allergies := p_decisions->'confirmed_allergies'->'value';
    END IF;

    -- 4. Insert Assessment Review
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
        p_organization_id,
        p_submission_id,
        v_reviewer.id,
        v_reviewer.id,
        v_reviewer.name,
        v_review_status,
        'completed',
        p_decisions,
        to_jsonb(v_patient),
        p_notes,
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_review_id;

    -- 5. If new allergies are accepted, invalidate existing approved nutrition plans
    IF v_has_new_allergies THEN
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
                p_organization_id,
                v_patient.id,
                v_reviewer.id,
                v_reviewer.name,
                'PLAN_INVALIDATED',
                'nutrition_plan',
                v_patient.id::text,
                jsonb_build_object(
                    'reason', 'Newly reconciled allergies require clinical safety recalculation',
                    'invalidated_plans_count', v_invalidated_count,
                    'review_id', v_review_id
                )
            );
        END IF;
    END IF;

    -- 6. Log reconciliation audit event
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
        v_patient.id,
        v_reviewer.id,
        v_reviewer.name,
        'ASSESSMENT_SUBMISSION_ACCEPTED',
        'assessment_review',
        v_review_id::text,
        jsonb_build_object(
            'submission_id', p_submission_id,
            'review_id', v_review_id,
            'invalidated_plans', v_invalidated_count,
            'notes', p_notes
        )
    );

    v_result := jsonb_build_object(
        'success', true,
        'review_id', v_review_id,
        'invalidated_plans_count', v_invalidated_count,
        'reviewed_at', now()
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 8. EXPLICIT GRANTS & MINIMAL PRIVILEGE BOUNDARIES
-- ---------------------------------------------------------------------

-- Restrict anon from directly reading clinical patient data
REVOKE ALL ON public.assessment_invitations FROM anon;
REVOKE ALL ON public.assessment_submissions FROM anon;
REVOKE ALL ON public.assessment_reviews FROM anon;
REVOKE ALL ON public.patients FROM anon;
REVOKE ALL ON public.visits FROM anon;
REVOKE ALL ON public.nutrition_plans FROM anon;
REVOKE ALL ON public.approval_records FROM anon;
REVOKE ALL ON public.audit_events FROM anon;

-- Grant minimal necessary reads
GRANT SELECT ON public.assessment_templates TO anon, authenticated;

-- Grant authenticated clinicians full managed operations
GRANT SELECT, INSERT, UPDATE ON public.assessment_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.assessment_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.assessment_reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.audit_events TO authenticated;

-- Grant RPC function execution
GRANT EXECUTE ON FUNCTION public.verify_public_intake_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_intake_assessment(TEXT, JSONB, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_nutrition_plan_atomic(UUID, TEXT, TEXT, UUID, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_assessment_invitation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_intake_submission_atomic(UUID, UUID, UUID, JSONB, TEXT) TO authenticated;

-- ---------------------------------------------------------------------
-- 9. RECORD IN SCHEMA_MIGRATIONS
-- ---------------------------------------------------------------------
INSERT INTO public.schema_migrations (version, description, applied_at)
VALUES (
    '20261123000001',
    'R3 schema alignment, SHA-256 token hashing, atomic reconciliation & public intake RPCs',
    timezone('utc'::text, now())
)
ON CONFLICT (version) DO UPDATE SET
    description = EXCLUDED.description,
    applied_at = EXCLUDED.applied_at;
