-- =====================================================================
-- SHUDDHO CLINICAL FUNCTIONAL & PRECISION NUTRITION PLATFORM
-- R2 COMPLETE ALL-IN-ONE SUPABASE BUNDLE
-- File: supabase/r2_complete_bundle.sql
-- 
-- INSTRUCTIONS FOR USE:
-- 1. Open Supabase Dashboard for your project (shuddho-clinical).
-- 2. Navigate to SQL Editor -> New Query.
-- 3. Copy and paste the entire contents of this file.
-- 4. Click Run (Cmd+Enter or Ctrl+Enter).
-- =====================================================================

-- [START SCHEMA MIGRATION 20261122000001]
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);

CREATE TABLE IF NOT EXISTS public.clinicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('CLINICAL_DIRECTOR', 'TREATING_NUTRITIONIST', 'ASSISTANT_DIETITIAN')),
    license_number TEXT,
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_clinicians_org ON public.clinicians(organization_id);
CREATE INDEX IF NOT EXISTS idx_clinicians_auth ON public.clinicians(auth_user_id);

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    clinician_id UUID NOT NULL REFERENCES public.clinicians(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('CLINICAL_DIRECTOR', 'TREATING_NUTRITIONIST', 'ASSISTANT_DIETITIAN')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(organization_id, clinician_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_clinician ON public.organization_members(clinician_id);

CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 0 AND age <= 130),
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    phone TEXT,
    email TEXT,
    current_visit_id TEXT,
    current_phase INTEGER NOT NULL DEFAULT 1 CHECK (current_phase BETWEEN 1 AND 4),
    population_group TEXT NOT NULL DEFAULT 'adult_standard',
    height_cm NUMERIC(5, 2) NOT NULL CHECK (height_cm > 0),
    weight_kg NUMERIC(5, 2) NOT NULL CHECK (weight_kg > 0),
    waist_cm NUMERIC(5, 2),
    activity_level TEXT NOT NULL DEFAULT 'sedentary',
    sleep_hours NUMERIC(3, 1) DEFAULT 7.0,
    shift_worker BOOLEAN DEFAULT false,
    bmr_floor_strategy TEXT DEFAULT 'clamped_to_bmr',
    confirmed_allergies JSONB NOT NULL DEFAULT '[]'::jsonb,
    allergy_reconciliation_status TEXT DEFAULT 'none_confirmed',
    clinician_disallowed_foods JSONB NOT NULL DEFAULT '[]'::jsonb,
    clinician_disallowed_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    selected_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    active_medications JSONB NOT NULL DEFAULT '[]'::jsonb,
    medication_records JSONB NOT NULL DEFAULT '[]'::jsonb,
    medication_reconciliation_status TEXT DEFAULT 'unreconciled',
    feeding_status JSONB NOT NULL DEFAULT '{"route": "oral_standard", "oral_intake_permitted": true}'::jsonb,
    gut_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    labs JSONB NOT NULL DEFAULT '{}'::jsonb,
    calculated JSONB NOT NULL DEFAULT '{}'::jsonb,
    clinical_safety JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_diet_plan_dirty BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(organization_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_patients_org ON public.patients(organization_id);
CREATE INDEX IF NOT EXISTS idx_patients_client_id ON public.patients(client_id);

CREATE TABLE IF NOT EXISTS public.patient_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    clinician_id UUID NOT NULL REFERENCES public.clinicians(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT true,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(patient_id, clinician_id)
);

CREATE INDEX IF NOT EXISTS idx_patient_assignments_pt ON public.patient_assignments(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_assignments_cl ON public.patient_assignments(clinician_id);

CREATE TABLE IF NOT EXISTS public.visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_visit_id TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_number INTEGER NOT NULL DEFAULT 1,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    phase_number INTEGER NOT NULL DEFAULT 1,
    visit_type TEXT NOT NULL CHECK (visit_type IN ('initial_assessment', 'phase_progression_review', 'acute_flare_review', 'discharge_summary')),
    primary_goals JSONB DEFAULT '[]'::jsonb,
    clinical_notes TEXT,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(organization_id, client_visit_id)
);

CREATE INDEX IF NOT EXISTS idx_visits_patient ON public.visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_org ON public.visits(organization_id);

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

CREATE TABLE IF NOT EXISTS public.assessment_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
    template_id UUID NOT NULL REFERENCES public.assessment_templates(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_assessment_invitations_token ON public.assessment_invitations(token);
CREATE INDEX IF NOT EXISTS idx_assessment_invitations_pt ON public.assessment_invitations(patient_id);

CREATE TABLE IF NOT EXISTS public.assessment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    invitation_id UUID NOT NULL REFERENCES public.assessment_invitations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.assessment_templates(id) ON DELETE CASCADE,
    raw_responses JSONB NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_assessment_submissions_pt ON public.assessment_submissions(patient_id);

CREATE TABLE IF NOT EXISTS public.assessment_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES public.assessment_submissions(id) ON DELETE CASCADE,
    clinician_id UUID NOT NULL REFERENCES public.clinicians(id) ON DELETE CASCADE,
    domain_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    clinical_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
    interpretation_notes TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'completed')),
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.clinical_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('somatic', 'tongue', 'pulse', 'gut', 'physical_sign', 'vital')),
    observation_key TEXT NOT NULL,
    finding_value JSONB NOT NULL,
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
    notes TEXT,
    observed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_observations_pt ON public.clinical_observations(patient_id);

CREATE TABLE IF NOT EXISTS public.clinical_hypotheses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
    clinician_id UUID NOT NULL REFERENCES public.clinicians(id) ON DELETE CASCADE,
    primary_domain TEXT NOT NULL,
    hypothesis_text TEXT NOT NULL,
    confidence_level TEXT NOT NULL CHECK (confidence_level IN ('speculative', 'moderate', 'high', 'confirmed')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'ruled_out')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.evidence_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hypothesis_id UUID REFERENCES public.clinical_hypotheses(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('pubmed', 'clinical_guideline', 'textbook', 'journal_article')),
    title TEXT NOT NULL,
    citation TEXT,
    pubmed_id TEXT,
    doi TEXT,
    url TEXT,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
    panel_name TEXT NOT NULL,
    marker_name TEXT NOT NULL,
    measured_value NUMERIC(10, 3) NOT NULL,
    unit TEXT NOT NULL,
    conventional_range TEXT,
    optimal_range TEXT,
    status TEXT NOT NULL CHECK (status IN ('optimal', 'marginal', 'deficient', 'excess', 'abnormal', 'critical')),
    lab_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_lab_results_pt ON public.lab_results(patient_id);

CREATE TABLE IF NOT EXISTS public.foods (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name_en TEXT NOT NULL,
    name_bn TEXT NOT NULL,
    category TEXT NOT NULL,
    serving_raw_weight_g NUMERIC(8, 2) NOT NULL DEFAULT 100,
    serving_cooked_weight_g NUMERIC(8, 2) NOT NULL DEFAULT 100,
    calories_kcal NUMERIC(8, 2) NOT NULL DEFAULT 0,
    protein_g NUMERIC(8, 2) NOT NULL DEFAULT 0,
    carbs_g NUMERIC(8, 2) NOT NULL DEFAULT 0,
    fat_g NUMERIC(8, 2) NOT NULL DEFAULT 0,
    fiber_g NUMERIC(8, 2) NOT NULL DEFAULT 0,
    glycemic_load NUMERIC(8, 2) NOT NULL DEFAULT 0,
    pral_score NUMERIC(8, 2) NOT NULL DEFAULT 0,
    micronutrients JSONB NOT NULL DEFAULT '{}'::jsonb,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name_en TEXT NOT NULL,
    name_bn TEXT NOT NULL,
    category TEXT NOT NULL,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    instructions_en TEXT,
    instructions_bn TEXT,
    yields_servings INTEGER DEFAULT 1,
    total_prep_time_min INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
    generic_name TEXT NOT NULL,
    brand_name TEXT,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    route TEXT DEFAULT 'oral',
    purpose TEXT,
    start_date DATE,
    end_date DATE,
    depletions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_medications_pt ON public.medications(patient_id);

CREATE TABLE IF NOT EXISTS public.supplements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
    supplement_name TEXT NOT NULL,
    brand TEXT,
    dosage TEXT NOT NULL,
    form TEXT NOT NULL,
    timing TEXT NOT NULL,
    rationale TEXT,
    evidence_grade TEXT CHECK (evidence_grade IN ('A', 'B', 'C', 'expert_consensus')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'discontinued')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_supplements_pt ON public.supplements(patient_id);

CREATE TABLE IF NOT EXISTS public.nutrition_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_plan_id TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'requires_review')),
    is_approved BOOLEAN NOT NULL DEFAULT false,
    meal_structure TEXT NOT NULL DEFAULT '3_meals_1_snack',
    fasting_schedule JSONB,
    target_macros JSONB NOT NULL DEFAULT '{}'::jsonb,
    days_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    nutritional_adequacy JSONB NOT NULL DEFAULT '{}'::jsonb,
    overall_safety_status TEXT NOT NULL DEFAULT 'SAFE' CHECK (overall_safety_status IN ('SAFE', 'CLINICAL_REVIEW_REQUIRED', 'HARD_STOP')),
    unresolved_hard_stops JSONB DEFAULT '[]'::jsonb,
    p2_handoff_summary JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(organization_id, client_plan_id)
);

CREATE INDEX IF NOT EXISTS idx_nutrition_plans_pt ON public.nutrition_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_plans_org ON public.nutrition_plans(organization_id);

CREATE TABLE IF NOT EXISTS public.lifestyle_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id TEXT,
    sleep_protocol JSONB NOT NULL DEFAULT '{}'::jsonb,
    movement_protocol JSONB NOT NULL DEFAULT '{}'::jsonb,
    stress_protocol JSONB NOT NULL DEFAULT '{}'::jsonb,
    hydration_protocol JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_lifestyle_plans_pt ON public.lifestyle_plans(patient_id);

CREATE TABLE IF NOT EXISTS public.approval_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.nutrition_plans(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    clinician_id UUID NOT NULL REFERENCES public.clinicians(id) ON DELETE CASCADE,
    clinician_name TEXT NOT NULL,
    license_number TEXT NOT NULL,
    plan_version INTEGER NOT NULL CHECK (plan_version >= 1),
    notes TEXT,
    approval_timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    invalidated_at TIMESTAMPTZ,
    invalidation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_approval_records_plan ON public.approval_records(plan_id);
CREATE INDEX IF NOT EXISTS idx_approval_records_pt ON public.approval_records(patient_id);

CREATE TABLE IF NOT EXISTS public.patient_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.nutrition_plans(id) ON DELETE CASCADE,
    visit_id TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    payload_json JSONB NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    released_at TIMESTAMPTZ,
    released_by UUID REFERENCES public.clinicians(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_patient_reports_pt ON public.patient_reports(patient_id);

CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id TEXT,
    scheduled_date DATE NOT NULL,
    reminder_channel TEXT CHECK (reminder_channel IN ('sms', 'whatsapp', 'email', 'phone')),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'missed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_pt ON public.follow_ups(patient_id);

CREATE TABLE IF NOT EXISTS public.outcome_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    baseline_visit_id TEXT NOT NULL,
    outcome_visit_id TEXT NOT NULL,
    weight_change_kg NUMERIC(5, 2),
    bmi_change NUMERIC(4, 2),
    biomarker_improvements JSONB NOT NULL DEFAULT '[]'::jsonb,
    symptom_changes JSONB NOT NULL DEFAULT '[]'::jsonb,
    adherence_score INTEGER CHECK (adherence_score BETWEEN 0 AND 100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_outcome_records_pt ON public.outcome_records(patient_id);

CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    clinician_id UUID REFERENCES public.clinicians(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    payload_before JSONB,
    payload_after JSONB,
    client_ip TEXT,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_events_org ON public.audit_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_pt ON public.audit_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON public.audit_events(timestamp DESC);

CREATE TABLE IF NOT EXISTS public.private_file_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    bucket_name TEXT NOT NULL CHECK (bucket_name IN ('clinical-dossiers', 'patient-files')),
    storage_path TEXT NOT NULL UNIQUE,
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.clinicians(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- [START RLS POLICIES MIGRATION 20261122000002 & 20261122000003]

-- ---------------------------------------------------------------------
-- 1. ENABLE ROW LEVEL SECURITY ACROSS ALL 27 DATABASE TABLES
-- ---------------------------------------------------------------------
ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clinicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.patient_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assessment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assessment_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assessment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assessment_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clinical_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clinical_hypotheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.evidence_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lifestyle_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.approval_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.patient_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.outcome_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.private_file_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.schema_migrations ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 2. SECURITY DEFINER HELPER FUNCTIONS
-- ---------------------------------------------------------------------

-- Returns active clinician UUID matching authenticated user
CREATE OR REPLACE FUNCTION public.current_clinician_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.clinicians WHERE auth_user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

-- Returns all organization UUIDs current user belongs to
CREATE OR REPLACE FUNCTION public.current_clinician_org_ids()
RETURNS TABLE (org_id UUID)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT organization_id FROM public.clinicians WHERE auth_user_id = auth.uid() AND is_active = true
  UNION
  SELECT organization_id FROM public.organization_members WHERE clinician_id = public.current_clinician_id();
$$;

-- Returns clinician role within organization
CREATE OR REPLACE FUNCTION public.get_clinician_role(check_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role 
  FROM public.clinicians 
  WHERE auth_user_id = auth.uid() AND organization_id = check_org_id AND is_active = true;

  IF v_role IS NOT NULL THEN
    RETURN v_role;
  END IF;

  SELECT role INTO v_role 
  FROM public.organization_members 
  WHERE clinician_id = public.current_clinician_id() AND organization_id = check_org_id;

  RETURN v_role;
END;
$$;

-- Returns patient UUIDs assigned to current authenticated clinician
CREATE OR REPLACE FUNCTION public.current_clinician_assigned_patient_ids()
RETURNS TABLE (patient_id UUID)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT patient_id FROM public.patient_assignments WHERE clinician_id = public.current_clinician_id();
$$;

-- ---------------------------------------------------------------------
-- 3. ANTI-PRIVILEGE ESCALATION TRIGGERS
-- ---------------------------------------------------------------------

-- Prevents clinicians from modifying their own role, organization or status
CREATE OR REPLACE FUNCTION public.check_clinician_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role OR 
      NEW.organization_id IS DISTINCT FROM OLD.organization_id OR 
      NEW.is_active IS DISTINCT FROM OLD.is_active) THEN
    IF public.get_clinician_role(OLD.organization_id) != 'CLINICAL_DIRECTOR' THEN
      RAISE EXCEPTION 'Privilege escalation blocked: Only CLINICAL_DIRECTOR can modify clinician role, organization assignment, or active status.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_clinician_self_escalation ON public.clinicians;
CREATE TRIGGER trg_prevent_clinician_self_escalation
  BEFORE UPDATE ON public.clinicians
  FOR EACH ROW
  EXECUTE FUNCTION public.check_clinician_self_escalation();

-- Prevents ASSISTANT_DIETITIAN from marking nutrition plans approved
CREATE OR REPLACE FUNCTION public.check_nutrition_plan_approval_permission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.is_approved = true OR NEW.status = 'approved') AND (OLD.is_approved = false OR OLD.status != 'approved') THEN
    IF public.get_clinician_role(NEW.organization_id) NOT IN ('CLINICAL_DIRECTOR', 'TREATING_NUTRITIONIST') THEN
      RAISE EXCEPTION 'Clinical governance violation: ASSISTANT_DIETITIAN is prohibited from approving nutrition plans.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_nutrition_plan_approval ON public.nutrition_plans;
CREATE TRIGGER trg_check_nutrition_plan_approval
  BEFORE UPDATE ON public.nutrition_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.check_nutrition_plan_approval_permission();

-- ---------------------------------------------------------------------
-- 4. IDEMPOTENT POLICY DEPLOYMENT PROCEDURE
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_r2_policy_if_missing(
    p_table TEXT,
    p_policy TEXT,
    p_cmd TEXT,
    p_roles TEXT,
    p_using TEXT,
    p_with_check TEXT DEFAULT NULL,
    p_force_replace BOOLEAN DEFAULT FALSE
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = p_table AND policyname = p_policy
    ) INTO v_exists;

    IF v_exists AND p_force_replace THEN
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p_policy, p_table);
        v_exists := FALSE;
    END IF;

    IF NOT v_exists THEN
        IF p_cmd = 'INSERT' THEN
            EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO %s WITH CHECK (%s)',
                           p_policy, p_table, p_roles, COALESCE(p_with_check, p_using));
        ELSIF p_cmd = 'SELECT' THEN
            EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO %s USING (%s)',
                           p_policy, p_table, p_roles, p_using);
        ELSIF p_cmd = 'DELETE' THEN
            EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO %s USING (%s)',
                           p_policy, p_table, p_roles, p_using);
        ELSE
            IF p_with_check IS NOT NULL THEN
                EXECUTE format('CREATE POLICY %I ON public.%I FOR %s TO %s USING (%s) WITH CHECK (%s)',
                               p_policy, p_table, p_cmd, p_roles, p_using, p_with_check);
            ELSE
                EXECUTE format('CREATE POLICY %I ON public.%I FOR %s TO %s USING (%s)',
                               p_policy, p_table, p_cmd, p_roles, p_using);
            END IF;
        END IF;
        RAISE NOTICE 'Policy [%] on [%] created successfully.', p_policy, p_table;
    ELSE
        RAISE NOTICE 'Policy [%] on [%] already active (preserved).', p_policy, p_table;
    END IF;
END;
$$;

-- ---------------------------------------------------------------------
-- 5. APPLY POLICIES ACROSS ALL 27 ENTITIES
-- ---------------------------------------------------------------------

-- Table 1: organizations
SELECT public.apply_r2_policy_if_missing('organizations', 'org_select_policy', 'SELECT', 'authenticated', 'id IN (SELECT org_id FROM public.current_clinician_org_ids())', NULL, FALSE);
SELECT public.apply_r2_policy_if_missing('organizations', 'org_update_director_only', 'UPDATE', 'authenticated', 'public.get_clinician_role(id) = ''CLINICAL_DIRECTOR''', 'public.get_clinician_role(id) = ''CLINICAL_DIRECTOR''', FALSE);

-- Table 2: clinicians
SELECT public.apply_r2_policy_if_missing('clinicians', 'clinicians_select_policy', 'SELECT', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', NULL, FALSE);
SELECT public.apply_r2_policy_if_missing('clinicians', 'clinicians_insert_director_only', 'INSERT', 'authenticated', NULL, 'public.get_clinician_role(organization_id) = ''CLINICAL_DIRECTOR''', FALSE);
SELECT public.apply_r2_policy_if_missing('clinicians', 'clinicians_update_director', 'UPDATE', 'authenticated', 'public.get_clinician_role(organization_id) = ''CLINICAL_DIRECTOR''', 'public.get_clinician_role(organization_id) = ''CLINICAL_DIRECTOR''', FALSE);
SELECT public.apply_r2_policy_if_missing('clinicians', 'clinicians_update_self', 'UPDATE', 'authenticated', 'auth_user_id = auth.uid()', 'auth_user_id = auth.uid()', FALSE);
SELECT public.apply_r2_policy_if_missing('clinicians', 'clinicians_delete_director_only', 'DELETE', 'authenticated', 'public.get_clinician_role(organization_id) = ''CLINICAL_DIRECTOR''', NULL, FALSE);

-- Table 3: organization_members
SELECT public.apply_r2_policy_if_missing('organization_members', 'org_members_select', 'SELECT', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', NULL, FALSE);
SELECT public.apply_r2_policy_if_missing('organization_members', 'org_members_insert_director', 'INSERT', 'authenticated', NULL, 'public.get_clinician_role(organization_id) = ''CLINICAL_DIRECTOR''', FALSE);
SELECT public.apply_r2_policy_if_missing('organization_members', 'org_members_update_director', 'UPDATE', 'authenticated', 'public.get_clinician_role(organization_id) = ''CLINICAL_DIRECTOR''', 'public.get_clinician_role(organization_id) = ''CLINICAL_DIRECTOR''', FALSE);
SELECT public.apply_r2_policy_if_missing('organization_members', 'org_members_delete_director', 'DELETE', 'authenticated', 'public.get_clinician_role(organization_id) = ''CLINICAL_DIRECTOR''', NULL, FALSE);

-- Table 4: patients
SELECT public.apply_r2_policy_if_missing('patients', 'patients_select_policy', 'SELECT', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', NULL, FALSE);
SELECT public.apply_r2_policy_if_missing('patients', 'patients_insert_policy', 'INSERT', 'authenticated', NULL, 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', FALSE);
SELECT public.apply_r2_policy_if_missing('patients', 'patients_update_policy', 'UPDATE', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', FALSE);
SELECT public.apply_r2_policy_if_missing('patients', 'patients_delete_director_only', 'DELETE', 'authenticated', 'public.get_clinician_role(organization_id) = ''CLINICAL_DIRECTOR''', NULL, FALSE);

-- Table 5: patient_assignments
SELECT public.apply_r2_policy_if_missing('patient_assignments', 'patient_assignments_select', 'SELECT', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', NULL, FALSE);
SELECT public.apply_r2_policy_if_missing('patient_assignments', 'patient_assignments_insert_licensed', 'INSERT', 'authenticated', NULL, 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()) AND public.get_clinician_role(organization_id) IN (''CLINICAL_DIRECTOR'', ''TREATING_NUTRITIONIST'')', FALSE);
SELECT public.apply_r2_policy_if_missing('patient_assignments', 'patient_assignments_update_licensed', 'UPDATE', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()) AND public.get_clinician_role(organization_id) IN (''CLINICAL_DIRECTOR'', ''TREATING_NUTRITIONIST'')', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()) AND public.get_clinician_role(organization_id) IN (''CLINICAL_DIRECTOR'', ''TREATING_NUTRITIONIST'')', FALSE);
SELECT public.apply_r2_policy_if_missing('patient_assignments', 'patient_assignments_delete_licensed', 'DELETE', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()) AND public.get_clinician_role(organization_id) IN (''CLINICAL_DIRECTOR'', ''TREATING_NUTRITIONIST'')', NULL, FALSE);

-- Table 6: visits
SELECT public.apply_r2_policy_if_missing('visits', 'visits_all_org_policy', 'ALL', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', FALSE);

-- Table 7: assessment_templates
SELECT public.apply_r2_policy_if_missing('assessment_templates', 'assessment_templates_select', 'SELECT', 'authenticated', 'organization_id IS NULL OR organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', NULL, FALSE);
SELECT public.apply_r2_policy_if_missing('assessment_templates', 'assessment_templates_write_director', 'ALL', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()) AND public.get_clinician_role(organization_id) = ''CLINICAL_DIRECTOR''', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()) AND public.get_clinician_role(organization_id) = ''CLINICAL_DIRECTOR''', FALSE);

-- Table 8: assessment_invitations
SELECT public.apply_r2_policy_if_missing('assessment_invitations', 'assessment_invitations_all', 'ALL', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', FALSE);

-- Table 9: assessment_submissions
SELECT public.apply_r2_policy_if_missing('assessment_submissions', 'assessment_submissions_select', 'SELECT', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', NULL, FALSE);
SELECT public.apply_r2_policy_if_missing('assessment_submissions', 'assessment_submissions_insert', 'INSERT', 'authenticated', NULL, 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', FALSE);
SELECT public.apply_r2_policy_if_missing('assessment_submissions', 'assessment_submissions_update_forbidden', 'UPDATE', 'authenticated', 'false', NULL, FALSE);
SELECT public.apply_r2_policy_if_missing('assessment_submissions', 'assessment_submissions_delete_director', 'DELETE', 'authenticated', 'public.get_clinician_role(organization_id) = ''CLINICAL_DIRECTOR''', NULL, FALSE);

-- Table 10: assessment_reviews
SELECT public.apply_r2_policy_if_missing('assessment_reviews', 'assessment_reviews_all', 'ALL', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', FALSE);

-- Table 11: clinical_observations
SELECT public.apply_r2_policy_if_missing('clinical_observations', 'observations_all_org_policy', 'ALL', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', FALSE);

-- Table 12: clinical_hypotheses
SELECT public.apply_r2_policy_if_missing('clinical_hypotheses', 'hypotheses_all_org_policy', 'ALL', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', FALSE);

-- Table 13: evidence_references
SELECT public.apply_r2_policy_if_missing('evidence_references', 'evidence_references_all_org', 'ALL', 'authenticated', 'hypothesis_id IN (SELECT id FROM public.clinical_hypotheses WHERE organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()))', 'hypothesis_id IN (SELECT id FROM public.clinical_hypotheses WHERE organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()))', FALSE);

-- Table 14: lab_results
SELECT public.apply_r2_policy_if_missing('lab_results', 'lab_results_all_org_policy', 'ALL', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', FALSE);

-- Table 15: foods
SELECT public.apply_r2_policy_if_missing('foods', 'foods_select_all', 'SELECT', 'authenticated', 'true', NULL, FALSE);
SELECT public.apply_r2_policy_if_missing('foods', 'foods_write_director_only', 'ALL', 'authenticated', 'EXISTS (SELECT 1 FROM public.clinicians WHERE auth_user_id = auth.uid() AND role = ''CLINICAL_DIRECTOR'')', 'EXISTS (SELECT 1 FROM public.clinicians WHERE auth_user_id = auth.uid() AND role = ''CLINICAL_DIRECTOR'')', FALSE);

-- Table 16: recipes
SELECT public.apply_r2_policy_if_missing('recipes', 'recipes_select_all', 'SELECT', 'authenticated', 'true', NULL, FALSE);
SELECT public.apply_r2_policy_if_missing('recipes', 'recipes_write_director_only', 'ALL', 'authenticated', 'EXISTS (SELECT 1 FROM public.clinicians WHERE auth_user_id = auth.uid() AND role = ''CLINICAL_DIRECTOR'')', 'EXISTS (SELECT 1 FROM public.clinicians WHERE auth_user_id = auth.uid() AND role = ''CLINICAL_DIRECTOR'')', FALSE);

-- Table 17: medications
SELECT public.apply_r2_policy_if_missing('medications', 'medications_all_org_policy', 'ALL', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', FALSE);

-- Table 18: supplements
SELECT public.apply_r2_policy_if_missing('supplements', 'supplements_all_org_policy', 'ALL', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', FALSE);

-- Table 19: nutrition_plans
SELECT public.apply_r2_policy_if_missing('nutrition_plans', 'nutrition_plans_select', 'SELECT', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', NULL, FALSE);
SELECT public.apply_r2_policy_if_missing('nutrition_plans', 'nutrition_plans_insert', 'INSERT', 'authenticated', NULL, 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', FALSE);
SELECT public.apply_r2_policy_if_missing('nutrition_plans', 'nutrition_plans_update', 'UPDATE', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', FALSE);
SELECT public.apply_r2_policy_if_missing('nutrition_plans', 'nutrition_plans_delete_director', 'DELETE', 'authenticated', 'public.get_clinician_role(organization_id) = ''CLINICAL_DIRECTOR''', NULL, FALSE);

-- Table 20: lifestyle_plans
SELECT public.apply_r2_policy_if_missing('lifestyle_plans', 'lifestyle_plans_all_org_policy', 'ALL', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', FALSE);

-- Table 21: approval_records
SELECT public.apply_r2_policy_if_missing('approval_records', 'approval_records_select', 'SELECT', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', NULL, FALSE);
SELECT public.apply_r2_policy_if_missing('approval_records', 'approval_records_insert_licensed_only', 'INSERT', 'authenticated', NULL, 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()) AND public.get_clinician_role(organization_id) IN (''CLINICAL_DIRECTOR'', ''TREATING_NUTRITIONIST'')', FALSE);
SELECT public.apply_r2_policy_if_missing('approval_records', 'approval_records_update_invalidation_only', 'UPDATE', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()) AND public.get_clinician_role(organization_id) IN (''CLINICAL_DIRECTOR'', ''TREATING_NUTRITIONIST'')', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()) AND public.get_clinician_role(organization_id) IN (''CLINICAL_DIRECTOR'', ''TREATING_NUTRITIONIST'')', FALSE);
SELECT public.apply_r2_policy_if_missing('approval_records', 'approval_records_delete_forbidden', 'DELETE', 'authenticated', 'false', NULL, FALSE);

-- Table 22: patient_reports
SELECT public.apply_r2_policy_if_missing('patient_reports', 'patient_reports_select', 'SELECT', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', NULL, FALSE);
SELECT public.apply_r2_policy_if_missing('patient_reports', 'patient_reports_insert_licensed', 'INSERT', 'authenticated', NULL, 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()) AND public.get_clinician_role(organization_id) IN (''CLINICAL_DIRECTOR'', ''TREATING_NUTRITIONIST'')', FALSE);
SELECT public.apply_r2_policy_if_missing('patient_reports', 'patient_reports_update_licensed', 'UPDATE', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()) AND public.get_clinician_role(organization_id) IN (''CLINICAL_DIRECTOR'', ''TREATING_NUTRITIONIST'')', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()) AND public.get_clinician_role(organization_id) IN (''CLINICAL_DIRECTOR'', ''TREATING_NUTRITIONIST'')', FALSE);
SELECT public.apply_r2_policy_if_missing('patient_reports', 'patient_reports_delete_director', 'DELETE', 'authenticated', 'public.get_clinician_role(organization_id) = ''CLINICAL_DIRECTOR''', NULL, FALSE);

-- Table 23: follow_ups
SELECT public.apply_r2_policy_if_missing('follow_ups', 'follow_ups_all_org', 'ALL', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', FALSE);

-- Table 24: outcome_records
SELECT public.apply_r2_policy_if_missing('outcome_records', 'outcome_records_all_org', 'ALL', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', FALSE);

-- Table 25: audit_events (Enforce assigned-patient isolation via force_replace = TRUE)
SELECT public.apply_r2_policy_if_missing('audit_events', 'audit_events_select_org', 'SELECT', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()) AND (public.get_clinician_role(organization_id) IN (''CLINICAL_DIRECTOR'', ''TREATING_NUTRITIONIST'') OR patient_id IS NULL OR patient_id IN (SELECT patient_id FROM public.current_clinician_assigned_patient_ids()))', NULL, TRUE);
SELECT public.apply_r2_policy_if_missing('audit_events', 'audit_events_insert_append_only', 'INSERT', 'authenticated', NULL, 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', FALSE);
SELECT public.apply_r2_policy_if_missing('audit_events', 'audit_events_update_forbidden', 'UPDATE', 'authenticated', 'false', NULL, FALSE);
SELECT public.apply_r2_policy_if_missing('audit_events', 'audit_events_delete_forbidden', 'DELETE', 'authenticated', 'false', NULL, FALSE);

-- Table 26: private_file_references
SELECT public.apply_r2_policy_if_missing('private_file_references', 'private_files_select', 'SELECT', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', NULL, FALSE);
SELECT public.apply_r2_policy_if_missing('private_file_references', 'private_files_insert', 'INSERT', 'authenticated', NULL, 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', FALSE);
SELECT public.apply_r2_policy_if_missing('private_file_references', 'private_files_update', 'UPDATE', 'authenticated', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', 'organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())', FALSE);
SELECT public.apply_r2_policy_if_missing('private_file_references', 'private_files_delete_director', 'DELETE', 'authenticated', 'public.get_clinician_role(organization_id) = ''CLINICAL_DIRECTOR''', NULL, FALSE);

-- Table 27: schema_migrations
SELECT public.apply_r2_policy_if_missing('schema_migrations', 'schema_migrations_select', 'SELECT', 'authenticated', 'true', NULL, FALSE);
SELECT public.apply_r2_policy_if_missing('schema_migrations', 'schema_migrations_write_director_only', 'ALL', 'authenticated', 'EXISTS (SELECT 1 FROM public.clinicians WHERE auth_user_id = auth.uid() AND role = ''CLINICAL_DIRECTOR'')', 'EXISTS (SELECT 1 FROM public.clinicians WHERE auth_user_id = auth.uid() AND role = ''CLINICAL_DIRECTOR'')', FALSE);

-- Clean up temporary helper
DROP FUNCTION IF EXISTS public.apply_r2_policy_if_missing(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN);

-- Seed Initial Migration Status
INSERT INTO public.schema_migrations (version) VALUES 
    ('20261122000001_r2_master_schema'),
    ('20261122000002_r2_rls_policies'),
    ('20261122000003_r2_rls_completion')
ON CONFLICT (version) DO NOTHING;
