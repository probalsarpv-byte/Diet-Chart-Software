-- =====================================================================
-- SHUDDHO Clinical Functional Nutrition Platform
-- Phase R4: Advanced Lifestyle, Chronotherapy & Supplements (U06)
-- Forward-only Idempotent Migration
-- =====================================================================

BEGIN;

-- 1. Extend public.lifestyle_plans with R4 Protocol Studio columns
ALTER TABLE public.lifestyle_plans
    ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'automatic_generated',
    ADD COLUMN IF NOT EXISTS lifestyle_protocol JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS supplement_protocol JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS chronotherapy_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS safety_evaluation JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.clinicians(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS approval_notes TEXT;

-- 2. Create index on status and approval
CREATE INDEX IF NOT EXISTS idx_lifestyle_plans_approval 
    ON public.lifestyle_plans(patient_id, is_approved);

CREATE INDEX IF NOT EXISTS idx_lifestyle_plans_version 
    ON public.lifestyle_plans(patient_id, version);

-- 3. Register Migration (conforming strictly to schema_migrations: version, applied_at)
INSERT INTO public.schema_migrations (version, applied_at)
VALUES ('20261124000001', timezone('utc'::text, now()))
ON CONFLICT (version) DO UPDATE 
SET applied_at = timezone('utc'::text, now());

-- 4. Authoritative Approval RPC (Atomic Server-Side Verification)
-- Prepares the secure server-side contract for deferred post-R15 deployment.
CREATE OR REPLACE FUNCTION public.approve_lifestyle_plan_atomic(
    p_plan_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_clinician_id UUID;
    v_clinician_name TEXT;
    v_license TEXT;
    v_plan RECORD;
    v_new_version INT;
BEGIN
    -- Verify authenticated user
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required for formal protocol approval.';
    END IF;

    -- Look up authenticated clinician
    SELECT id, name, license_number
    INTO v_clinician_id, v_clinician_name, v_license
    FROM public.clinicians
    WHERE auth_user_id = auth.uid() AND is_active = true;

    IF v_clinician_id IS NULL THEN
        RAISE EXCEPTION 'No active clinician profile found for authenticated user.';
    END IF;

    IF v_license IS NULL OR trim(v_license) = '' THEN
        RAISE EXCEPTION 'Clinician must have a registered professional license number for formal approval.';
    END IF;

    -- Lock plan record
    SELECT * INTO v_plan
    FROM public.lifestyle_plans
    WHERE id = p_plan_id
    FOR UPDATE;

    IF v_plan.id IS NULL THEN
        RAISE EXCEPTION 'Lifestyle plan % not found.', p_plan_id;
    END IF;

    -- Verify safety evaluation has 0 hard stops
    IF (v_plan.safety_evaluation->'hard_stops') IS NOT NULL AND jsonb_array_length(v_plan.safety_evaluation->'hard_stops') > 0 THEN
        RAISE EXCEPTION 'Protocol approval blocked: Unresolved clinical hard stops present.';
    END IF;

    v_new_version := COALESCE(v_plan.version, 1) + 1;

    -- Update plan atomically
    UPDATE public.lifestyle_plans
    SET is_approved = true,
        approved_by = v_clinician_id,
        approved_at = timezone('utc'::text, now()),
        approval_notes = COALESCE(p_notes, v_plan.approval_notes),
        version = v_new_version,
        status = 'active',
        updated_at = timezone('utc'::text, now())
    WHERE id = p_plan_id;

    -- Log authoritative audit event
    INSERT INTO public.audit_events (
        organization_id,
        clinician_id,
        patient_id,
        event_type,
        entity_type,
        entity_id,
        payload_after
    ) VALUES (
        v_plan.organization_id,
        v_clinician_id,
        v_plan.patient_id,
        'PLAN_APPROVED',
        'lifestyle_plan',
        p_plan_id::text,
        jsonb_build_object(
            'version', v_new_version,
            'approved_by', v_clinician_id,
            'clinician_name', v_clinician_name,
            'license', v_license,
            'notes', p_notes
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'plan_id', p_plan_id,
        'version', v_new_version,
        'approved_at', timezone('utc'::text, now())
    );
END;
$$;

COMMIT;
