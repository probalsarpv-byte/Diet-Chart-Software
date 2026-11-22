-- =====================================================================
-- SHUDDHO CLINICAL FUNCTIONAL & PRECISION NUTRITION PLATFORM
-- R2 COMPLETE ROW LEVEL SECURITY (RLS) & IDEMPOTENT PATCH MIGRATION
-- Migration: 20261122000003_r2_rls_completion.sql
-- 
-- Objectives:
-- 1. Preserve all existing tables and patient data without loss.
-- 2. Ensure RLS is explicitly enabled across ALL 27 tables (including schema_migrations).
-- 3. Provide helper function current_clinician_assigned_patient_ids().
-- 4. Enforce strict anti-escalation triggers:
--    - prevent_clinician_self_role_escalation (stops non-director privilege escalation)
--    - check_nutrition_plan_approval_permission (stops Assistant Dietitian approving plans)
-- 5. Detect existing policies in pg_policies and create genuinely missing policies.
-- 6. Replace unsafe policies (role escalation, assigned-patient audit isolation).
-- =====================================================================

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
-- 2. SECURITY DEFINER HELPER FUNCTIONS (IDEMPOTENT)
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
-- Force replace unsafe self-update policy if present
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

-- ---------------------------------------------------------------------
-- 6. RECORD MIGRATION COMPLETION
-- ---------------------------------------------------------------------
INSERT INTO public.schema_migrations (version) 
VALUES ('20261122000003_r2_rls_completion')
ON CONFLICT (version) DO NOTHING;
