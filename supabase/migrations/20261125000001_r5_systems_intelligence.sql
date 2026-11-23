-- =====================================================================
-- SHUDDHO Clinical Functional Nutrition Platform
-- Phase R5: Systems Network Intelligence, Pathways & Medication Reconciliation
-- Forward-only Idempotent Migration (DEFERRED DEPLOYMENT POST-R15)
-- =====================================================================

BEGIN;

-- 1. Table: public.patient_clinical_pathways
CREATE TABLE IF NOT EXISTS public.patient_clinical_pathways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    selection_status TEXT NOT NULL DEFAULT 'NOT_ASSESSED',
    selected_pathways JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_patient_clinical_pathways_patient 
    ON public.patient_clinical_pathways(patient_id);

CREATE INDEX IF NOT EXISTS idx_patient_clinical_pathways_org 
    ON public.patient_clinical_pathways(organization_id);

-- 2. Table: public.patient_running_medications
CREATE TABLE IF NOT EXISTS public.patient_running_medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    generic_name TEXT NOT NULL,
    brand_name TEXT,
    manufacturer TEXT,
    formulation TEXT DEFAULT 'Tablet',
    product_strength TEXT,
    prescribed_dose TEXT NOT NULL DEFAULT '1',
    dose_unit TEXT NOT NULL DEFAULT 'tablets',
    frequency TEXT NOT NULL DEFAULT 'Once Daily',
    route TEXT NOT NULL DEFAULT 'Oral',
    administration_times JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_timing_unknown BOOLEAN NOT NULL DEFAULT false,
    relationship_to_meals TEXT NOT NULL DEFAULT 'with_meal',
    is_prn BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active',
    verification_status TEXT NOT NULL DEFAULT 'clinician_verified',
    rule_coverage TEXT NOT NULL DEFAULT 'rules_unavailable',
    source TEXT NOT NULL DEFAULT 'clinician_entry',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_patient_running_medications_patient 
    ON public.patient_running_medications(patient_id, status);

CREATE INDEX IF NOT EXISTS idx_patient_running_medications_org 
    ON public.patient_running_medications(organization_id);

-- 3. Table: public.functional_matrix_observations
CREATE TABLE IF NOT EXISTS public.functional_matrix_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    atm_type TEXT,
    title_en TEXT NOT NULL,
    title_bn TEXT NOT NULL,
    description_en TEXT,
    description_bn TEXT,
    confidence_status TEXT NOT NULL DEFAULT 'confirmed_clinical',
    evidence_source TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'clinical_history',
    clinician_verified BOOLEAN NOT NULL DEFAULT true,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_functional_matrix_patient 
    ON public.functional_matrix_observations(patient_id, domain);

CREATE INDEX IF NOT EXISTS idx_functional_matrix_org 
    ON public.functional_matrix_observations(organization_id);

-- 4. Table: public.multimorbidity_conflict_records
CREATE TABLE IF NOT EXISTS public.multimorbidity_conflict_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    conflict_id TEXT NOT NULL,
    parameter TEXT NOT NULL,
    competing_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    competing_recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    resolved_priority_recommendation_en TEXT NOT NULL,
    resolved_priority_recommendation_bn TEXT NOT NULL,
    clinical_decision_rationale_en TEXT NOT NULL,
    clinical_decision_rationale_bn TEXT NOT NULL,
    requires_clinician_verification BOOLEAN NOT NULL DEFAULT true,
    hard_safety_boundary_en TEXT,
    hard_safety_boundary_bn TEXT,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_multimorbidity_conflicts_patient 
    ON public.multimorbidity_conflict_records(patient_id);

CREATE INDEX IF NOT EXISTS idx_multimorbidity_conflicts_org 
    ON public.multimorbidity_conflict_records(organization_id);

-- 5. Table: public.systems_network_snapshots
CREATE TABLE IF NOT EXISTS public.systems_network_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
    edges JSONB NOT NULL DEFAULT '[]'::jsonb,
    active_conflicts_count INTEGER NOT NULL DEFAULT 0,
    unresolved_hypotheses_count INTEGER NOT NULL DEFAULT 0,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_systems_network_snapshots_patient 
    ON public.systems_network_snapshots(patient_id);

CREATE INDEX IF NOT EXISTS idx_systems_network_snapshots_org 
    ON public.systems_network_snapshots(organization_id);

-- 6. Enable Row Level Security (RLS) on all R5 tables
ALTER TABLE public.patient_clinical_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_running_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.functional_matrix_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multimorbidity_conflict_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.systems_network_snapshots ENABLE ROW LEVEL SECURITY;

-- 7. Organization-Isolation RLS Policies
-- Helper function get_current_user_org_id() defined in R2 schema

-- Policy: patient_clinical_pathways
CREATE POLICY "org_isolation_clinical_pathways"
    ON public.patient_clinical_pathways
    FOR ALL
    USING (organization_id = public.get_current_user_org_id())
    WITH CHECK (organization_id = public.get_current_user_org_id());

-- Policy: patient_running_medications
CREATE POLICY "org_isolation_running_medications"
    ON public.patient_running_medications
    FOR ALL
    USING (organization_id = public.get_current_user_org_id())
    WITH CHECK (organization_id = public.get_current_user_org_id());

-- Policy: functional_matrix_observations
CREATE POLICY "org_isolation_functional_matrix"
    ON public.functional_matrix_observations
    FOR ALL
    USING (organization_id = public.get_current_user_org_id())
    WITH CHECK (organization_id = public.get_current_user_org_id());

-- Policy: multimorbidity_conflict_records
CREATE POLICY "org_isolation_multimorbidity_conflicts"
    ON public.multimorbidity_conflict_records
    FOR ALL
    USING (organization_id = public.get_current_user_org_id())
    WITH CHECK (organization_id = public.get_current_user_org_id());

-- Policy: systems_network_snapshots
CREATE POLICY "org_isolation_systems_network_snapshots"
    ON public.systems_network_snapshots
    FOR ALL
    USING (organization_id = public.get_current_user_org_id())
    WITH CHECK (organization_id = public.get_current_user_org_id());

-- 8. Register Migration in public.schema_migrations
INSERT INTO public.schema_migrations (version, applied_at)
VALUES ('20261125000001', timezone('utc'::text, now()))
ON CONFLICT (version) DO UPDATE 
SET applied_at = timezone('utc'::text, now());

COMMIT;
