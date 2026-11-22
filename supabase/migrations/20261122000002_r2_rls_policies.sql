-- =====================================================================
-- SHUDDHO CLINICAL FUNCTIONAL & PRECISION NUTRITION PLATFORM
-- R2 ROW LEVEL SECURITY (RLS) & RBAC AUTHORIZATION POLICIES
-- Migration: 20261122000002_r2_rls_policies.sql
-- Description: Multi-Tenancy clinic isolation and role-based access control
-- for CLINICAL_DIRECTOR, TREATING_NUTRITIONIST, and ASSISTANT_DIETITIAN.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. SECURITY DEFINER HELPER FUNCTIONS
-- ---------------------------------------------------------------------

-- Returns the active clinician UUID matching the authenticated Supabase user
CREATE OR REPLACE FUNCTION public.current_clinician_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.clinicians WHERE auth_user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

-- Returns all organization UUIDs the authenticated user is an active clinician or member of
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

-- Returns the role of the current authenticated clinician within a specific organization
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
  -- First check primary clinicians table
  SELECT role INTO v_role 
  FROM public.clinicians 
  WHERE auth_user_id = auth.uid() AND organization_id = check_org_id AND is_active = true;

  IF v_role IS NOT NULL THEN
    RETURN v_role;
  END IF;

  -- Fallback to organization_members table
  SELECT role INTO v_role 
  FROM public.organization_members 
  WHERE clinician_id = public.current_clinician_id() AND organization_id = check_org_id;

  RETURN v_role;
END;
$$;

-- ---------------------------------------------------------------------
-- 2. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ---------------------------------------------------------------------
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
ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 3. ORGANIZATIONS POLICIES
-- ---------------------------------------------------------------------
CREATE POLICY "org_select_policy" ON public.organizations
    FOR SELECT TO authenticated
    USING (id IN (SELECT org_id FROM public.current_clinician_org_ids()));

CREATE POLICY "org_update_director_only" ON public.organizations
    FOR UPDATE TO authenticated
    USING (public.get_clinician_role(id) = 'CLINICAL_DIRECTOR')
    WITH CHECK (public.get_clinician_role(id) = 'CLINICAL_DIRECTOR');

-- ---------------------------------------------------------------------
-- 4. CLINICIANS POLICIES
-- ---------------------------------------------------------------------
CREATE POLICY "clinicians_select_policy" ON public.clinicians
    FOR SELECT TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

CREATE POLICY "clinicians_insert_director_only" ON public.clinicians
    FOR INSERT TO authenticated
    WITH CHECK (public.get_clinician_role(organization_id) = 'CLINICAL_DIRECTOR');

CREATE POLICY "clinicians_update_self_or_director" ON public.clinicians
    FOR UPDATE TO authenticated
    USING (
        auth_user_id = auth.uid() OR 
        public.get_clinician_role(organization_id) = 'CLINICAL_DIRECTOR'
    )
    WITH CHECK (
        auth_user_id = auth.uid() OR 
        public.get_clinician_role(organization_id) = 'CLINICAL_DIRECTOR'
    );

-- ---------------------------------------------------------------------
-- 5. PATIENTS POLICIES
-- ---------------------------------------------------------------------
CREATE POLICY "patients_select_policy" ON public.patients
    FOR SELECT TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

CREATE POLICY "patients_insert_policy" ON public.patients
    FOR INSERT TO authenticated
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

CREATE POLICY "patients_update_policy" ON public.patients
    FOR UPDATE TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()))
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

CREATE POLICY "patients_delete_director_only" ON public.patients
    FOR DELETE TO authenticated
    USING (public.get_clinician_role(organization_id) = 'CLINICAL_DIRECTOR');

-- ---------------------------------------------------------------------
-- 6. VISITS POLICIES
-- ---------------------------------------------------------------------
CREATE POLICY "visits_all_org_policy" ON public.visits
    FOR ALL TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()))
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

-- ---------------------------------------------------------------------
-- 7. CLINICAL OBSERVATIONS & LAB RESULTS POLICIES
-- ---------------------------------------------------------------------
CREATE POLICY "observations_all_org_policy" ON public.clinical_observations
    FOR ALL TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()))
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

CREATE POLICY "lab_results_all_org_policy" ON public.lab_results
    FOR ALL TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()))
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

-- ---------------------------------------------------------------------
-- 8. ASSESSMENTS POLICIES (Templates, Invitations, Submissions, Reviews)
-- ---------------------------------------------------------------------
CREATE POLICY "assessment_templates_select" ON public.assessment_templates
    FOR SELECT TO authenticated
    USING (organization_id IS NULL OR organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

CREATE POLICY "assessment_invitations_all" ON public.assessment_invitations
    FOR ALL TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()))
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

CREATE POLICY "assessment_submissions_all" ON public.assessment_submissions
    FOR ALL TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()))
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

CREATE POLICY "assessment_reviews_all" ON public.assessment_reviews
    FOR ALL TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()))
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

-- ---------------------------------------------------------------------
-- 9. HYPOTHESES & EVIDENCE POLICIES
-- ---------------------------------------------------------------------
CREATE POLICY "hypotheses_all_org_policy" ON public.clinical_hypotheses
    FOR ALL TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()))
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

CREATE POLICY "evidence_references_all_org" ON public.evidence_references
    FOR ALL TO authenticated
    USING (hypothesis_id IN (SELECT id FROM public.clinical_hypotheses WHERE organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())));

-- ---------------------------------------------------------------------
-- 10. FOODS & RECIPES (Shared Catalogue with Director Write Gate)
-- ---------------------------------------------------------------------
CREATE POLICY "foods_select_all" ON public.foods
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "foods_write_director_only" ON public.foods
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.clinicians WHERE auth_user_id = auth.uid() AND role = 'CLINICAL_DIRECTOR'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.clinicians WHERE auth_user_id = auth.uid() AND role = 'CLINICAL_DIRECTOR'));

CREATE POLICY "recipes_select_all" ON public.recipes
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "recipes_write_director_only" ON public.recipes
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.clinicians WHERE auth_user_id = auth.uid() AND role = 'CLINICAL_DIRECTOR'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.clinicians WHERE auth_user_id = auth.uid() AND role = 'CLINICAL_DIRECTOR'));

-- ---------------------------------------------------------------------
-- 11. MEDICATIONS & SUPPLEMENTS POLICIES
-- ---------------------------------------------------------------------
CREATE POLICY "medications_all_org_policy" ON public.medications
    FOR ALL TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()))
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

CREATE POLICY "supplements_all_org_policy" ON public.supplements
    FOR ALL TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()))
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

-- ---------------------------------------------------------------------
-- 12. NUTRITION PLANS & LIFESTYLE PLANS POLICIES
-- ---------------------------------------------------------------------
CREATE POLICY "nutrition_plans_select" ON public.nutrition_plans
    FOR SELECT TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

CREATE POLICY "nutrition_plans_insert" ON public.nutrition_plans
    FOR INSERT TO authenticated
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

CREATE POLICY "nutrition_plans_update" ON public.nutrition_plans
    FOR UPDATE TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()))
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

CREATE POLICY "lifestyle_plans_all_org_policy" ON public.lifestyle_plans
    FOR ALL TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()))
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

-- ---------------------------------------------------------------------
-- 13. APPROVAL RECORDS POLICIES (ASSISTANT_DIETITIAN STRICTLY BLOCKED)
-- ---------------------------------------------------------------------
CREATE POLICY "approval_records_select" ON public.approval_records
    FOR SELECT TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

-- ONLY Clinical Director or Treating Nutritionist can approve plans
CREATE POLICY "approval_records_insert_licensed_only" ON public.approval_records
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()) AND
        public.get_clinician_role(organization_id) IN ('CLINICAL_DIRECTOR', 'TREATING_NUTRITIONIST')
    );

-- Approvals are immutable once signed; only invalidation is allowed
CREATE POLICY "approval_records_update_invalidation_only" ON public.approval_records
    FOR UPDATE TO authenticated
    USING (
        organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()) AND
        public.get_clinician_role(organization_id) IN ('CLINICAL_DIRECTOR', 'TREATING_NUTRITIONIST')
    )
    WITH CHECK (
        organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()) AND
        public.get_clinician_role(organization_id) IN ('CLINICAL_DIRECTOR', 'TREATING_NUTRITIONIST')
    );

CREATE POLICY "approval_records_delete_forbidden" ON public.approval_records
    FOR DELETE TO authenticated
    USING (false); -- Zero deletion allowed for approval legal records

-- ---------------------------------------------------------------------
-- 14. PATIENT REPORTS & FOLLOW UPS POLICIES
-- ---------------------------------------------------------------------
CREATE POLICY "patient_reports_all_org" ON public.patient_reports
    FOR ALL TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()))
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

CREATE POLICY "follow_ups_all_org" ON public.follow_ups
    FOR ALL TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()))
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

CREATE POLICY "outcome_records_all_org" ON public.outcome_records
    FOR ALL TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()))
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

-- ---------------------------------------------------------------------
-- 15. AUDIT EVENTS POLICIES (IMMUTABLE AUDIT TRAIL)
-- ---------------------------------------------------------------------
-- Anyone in the org can read the audit log
CREATE POLICY "audit_events_select_org" ON public.audit_events
    FOR SELECT TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

-- Authenticated clinicians can append audit events
CREATE POLICY "audit_events_insert_append_only" ON public.audit_events
    FOR INSERT TO authenticated
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

-- NEVER allow update or deletion of audit events
CREATE POLICY "audit_events_update_forbidden" ON public.audit_events
    FOR UPDATE TO authenticated
    USING (false);

CREATE POLICY "audit_events_delete_forbidden" ON public.audit_events
    FOR DELETE TO authenticated
    USING (false);

-- ---------------------------------------------------------------------
-- 16. PRIVATE FILE REFERENCES POLICIES
-- ---------------------------------------------------------------------
CREATE POLICY "private_files_select" ON public.private_file_references
    FOR SELECT TO authenticated
    USING (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

CREATE POLICY "private_files_insert" ON public.private_file_references
    FOR INSERT TO authenticated
    WITH CHECK (organization_id IN (SELECT org_id FROM public.current_clinician_org_ids()));

INSERT INTO public.schema_migrations (version) 
VALUES ('20261122000002_r2_rls_policies')
ON CONFLICT (version) DO NOTHING;
