-- =====================================================================
-- SHUDDHO CLINICAL FUNCTIONAL & PRECISION NUTRITION PLATFORM
-- R2 MASTER DATABASE SCHEMA MIGRATION
-- Migration: 20261122000001_r2_master_schema.sql
-- Description: Creates 23 R0 master entities + support tables with strict
-- foreign keys, constraints, timestamps, and indexes.
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. ORGANIZATIONS (Multi-Clinic Practice Tenancy)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 2. CLINICIANS (Staff, Directors, Treating Nutritionists)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE, -- References auth.users(id) when Supabase Auth is enabled
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

-- ---------------------------------------------------------------------
-- SUPPORT: ORGANIZATION MEMBERS (Multi-Clinic Staff Binding)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 3. PATIENTS (Master Patient Demographics & Profile)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT NOT NULL, -- Logical ID matching client (e.g. pt_123)
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

-- ---------------------------------------------------------------------
-- SUPPORT: PATIENT ASSIGNMENTS (Treating Clinician Mapping)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 4. VISITS (Clinical Consultations & Historical Progress)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 5. ASSESSMENT TEMPLATES (Questionnaire Definitions)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 6. ASSESSMENT INVITATIONS (Patient Questionnaires Tokens)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 7. ASSESSMENT SUBMISSIONS (Raw Patient Questionnaires Answers)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 8. ASSESSMENT REVIEWS (Clinician Scoring & Matrix Analysis)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 9. CLINICAL OBSERVATIONS (Somatic, Tongue, Pulse, Gut Findings)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 10. CLINICAL HYPOTHESES (Functional Systems Biology Hypotheses)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 11. EVIDENCE REFERENCES (PubMed, Citations, Clinical Guidelines)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 12. LAB RESULTS (Biomarker Measurements & Normal/Functional Ranges)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 13. FOODS (Bangladesh Food Composition Database - FCTB)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.foods (
    id TEXT PRIMARY KEY, -- FCTB code or unique slug
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

-- ---------------------------------------------------------------------
-- 14. RECIPES (Bengali Therapeutic Culinary Formulations)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 15. MEDICATIONS (Reconciled Pharmaceutical Regimens)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 16. SUPPLEMENTS (Targeted Functional Nutraceuticals)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 17. NUTRITION PLANS (Weekly Diet Plans & Day Schedules)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 18. LIFESTYLE PLANS (Circadian, Sleep, Movement & Stress Protocols)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 19. APPROVAL RECORDS (Formal Clinician Sign-Off & Version Binding)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 20. PATIENT REPORTS (Patient-Safe Projected Diet Prescriptions)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 21. FOLLOW UPS (Scheduled Reviews, Reminders & Check-Ins)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 22. OUTCOME RECORDS (Longitudinal Clinical Response & Biomarker Delta)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 23. AUDIT EVENTS (U18 Immutable Clinical Audit Trail)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- SUPPORT: PRIVATE FILE REFERENCES (Supabase Storage Metadata)
-- ---------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_private_files_org ON public.private_file_references(organization_id);
CREATE INDEX IF NOT EXISTS idx_private_files_pt ON public.private_file_references(patient_id);

-- ---------------------------------------------------------------------
-- SUPPORT: SCHEMA MIGRATIONS (Version Ledger)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.schema_migrations (version) 
VALUES ('20261122000001_r2_master_schema')
ON CONFLICT (version) DO NOTHING;
