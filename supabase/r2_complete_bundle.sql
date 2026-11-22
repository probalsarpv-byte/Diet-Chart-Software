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

-- [START RLS POLICIES MIGRATION 20261122000002]
CREATE OR REPLACE FUNCTION public.current_clinician_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.clinicians WHERE auth_user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

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

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_hypotheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lifestyle_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outcome_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_file_references ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "org_select_policy" ON public.organizations FOR SELECT TO authenticated
    USING (id IN (SELECT org_id FROM public.current_clinician_org_ids()));

CREATE POLICY "clinicians_select_policy" ON public.clinicians FOR SELECT TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

CREATE POLICY "patients_select_policy" ON public.patients FOR SELECT TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));
CREATE POLICY "patients_insert_policy" ON public.patients FOR INSERT TO authenticated
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));
CREATE POLICY "patients_update_policy" ON public.patients FOR UPDATE TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()))
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));
CREATE POLICY "patients_delete_director_only" ON public.patients FOR DELETE TO authenticated
    USING (public.get_clinician_role(organization_id) = 'CLINICAL_DIRECTOR');

CREATE POLICY "visits_all_org_policy" ON public.visits FOR ALL TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()))
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

CREATE POLICY "nutrition_plans_select" ON public.nutrition_plans FOR SELECT TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));
CREATE POLICY "nutrition_plans_insert" ON public.nutrition_plans FOR INSERT TO authenticated
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));
CREATE POLICY "nutrition_plans_update" ON public.nutrition_plans FOR UPDATE TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()))
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

CREATE POLICY "approval_records_select" ON public.approval_records FOR SELECT TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));
CREATE POLICY "approval_records_insert_licensed_only" ON public.approval_records FOR INSERT TO authenticated
    WITH CHECK (
        organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()) AND
        public.get_clinician_role(organization_id) IN ('CLINICAL_DIRECTOR', 'TREATING_NUTRITIONIST')
    );
CREATE POLICY "approval_records_delete_forbidden" ON public.approval_records FOR DELETE TO authenticated
    USING (false);

CREATE POLICY "audit_events_select_org" ON public.audit_events FOR SELECT TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));
CREATE POLICY "audit_events_insert_append_only" ON public.audit_events FOR INSERT TO authenticated
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));
CREATE POLICY "audit_events_update_forbidden" ON public.audit_events FOR UPDATE TO authenticated
    USING (false);
CREATE POLICY "audit_events_delete_forbidden" ON public.audit_events FOR DELETE TO authenticated
    USING (false);

CREATE POLICY "foods_select_all" ON public.foods FOR SELECT TO authenticated USING (true);
CREATE POLICY "recipes_select_all" ON public.recipes FOR SELECT TO authenticated USING (true);

-- Seed Initial Migration Status
INSERT INTO public.schema_migrations (version) VALUES 
    ('20261122000001_r2_master_schema'),
    ('20261122000002_r2_rls_policies')
ON CONFLICT (version) DO NOTHING;
