# Row Level Security (RLS) Policy Specification

**Document ID:** SHUDDHO-DOC-R2-004  
**Classification:** Internal Clinical Architecture & Compliance  
**Database:** PostgreSQL 15 (Supabase)  
**Security Model:** Default Deny (`ENABLE ROW LEVEL SECURITY`)  

---

## 1. Helper Functions (Security Definer)

```sql
-- 1. Resolve active clinician UUID from authenticated Supabase auth.uid()
CREATE OR REPLACE FUNCTION public.current_clinician_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.clinicians WHERE auth_user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

-- 2. Resolve organization UUIDs accessible to active clinician
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

-- 3. Resolve role of clinician in target organization
CREATE OR REPLACE FUNCTION public.get_clinician_role(check_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
...
$$;
```

---

## 2. Table-by-Table Policy Matrix

| Table Name | SELECT Policy | INSERT Policy | UPDATE Policy | DELETE Policy |
|---|---|---|---|---|
| `organizations` | Authenticated member of org | Denied | `CLINICAL_DIRECTOR` only | Denied |
| `clinicians` | Same org members | `CLINICAL_DIRECTOR` only | Self or `CLINICAL_DIRECTOR` | Denied |
| `patients` | Same org members | Same org members | Same org members | `CLINICAL_DIRECTOR` only |
| `visits` | Same org members | Same org members | Same org members | Denied |
| `assessment_templates` | Public / Same org | `CLINICAL_DIRECTOR` only | `CLINICAL_DIRECTOR` only | Denied |
| `assessment_invitations` | Same org members | Same org members | Same org members | Denied |
| `assessment_submissions` | Same org members | Same org members | Denied (Immutable response) | Denied |
| `assessment_reviews` | Same org members | Same org members | Same org members | Denied |
| `clinical_observations` | Same org members | Same org members | Same org members | Denied |
| `clinical_hypotheses` | Same org members | Same org members | Same org members | Denied |
| `evidence_references` | Same org members | Same org members | Same org members | Denied |
| `lab_results` | Same org members | Same org members | Same org members | Denied |
| `foods` | Authenticated (All) | `CLINICAL_DIRECTOR` | `CLINICAL_DIRECTOR` | Denied |
| `recipes` | Authenticated (All) | `CLINICAL_DIRECTOR` | `CLINICAL_DIRECTOR` | Denied |
| `medications` | Same org members | Same org members | Same org members | Denied |
| `supplements` | Same org members | Same org members | Same org members | Denied |
| `nutrition_plans` | Same org members | Same org members | Same org members | Denied |
| `lifestyle_plans` | Same org members | Same org members | Same org members | Denied |
| `approval_records` | Same org members | `DIRECTOR` / `NUTRITIONIST` (**ASSISTANT BLOCKED**) | Invalidation only | **STRICTLY FORBIDDEN (false)** |
| `patient_reports` | Same org members | Same org members | Same org members | Denied |
| `follow_ups` | Same org members | Same org members | Same org members | Denied |
| `outcome_records` | Same org members | Same org members | Same org members | Denied |
| `audit_events` | Same org members | Authenticated (Append-only) | **STRICTLY FORBIDDEN (false)** | **STRICTLY FORBIDDEN (false)** |
| `private_file_references`| Same org members | Same org members | Same org members | Denied |
