# SHUDDHO Clinical Nutrition Platform
## R3 Schema Contract, SQL Migrations & Stored Procedures

**File Path:** `supabase/migrations/20261123000001_r3_schema_and_security.sql`  
**Applied Database:** Supabase PostgreSQL (`shuddho-clinical`)  
**Architecture:** Idempotent, Forward-Only, Non-Destructive

---

### 1. Schema Alignment Contracts

The R3 schema migration aligns the TypeScript repository interfaces with PostgreSQL database structures:

#### A. Master Assessment Template
- Ensures `public.assessment_templates` contains canonical template code `'SHUDDHO_STANDARD_INTAKE_V1'`.
- Includes 14 functional medicine domains: Metabolic, Gastrointestinal, Immune, Detoxification, Hormonal, Cardiovascular, Musculoskeletal, Neurological, Sleep/Circadian, Lifestyle, Dietary, Environmental, Mind-Body, and Genetics.

#### B. Assessment Invitations Alignment (`public.assessment_invitations`)
- Adds `invitation_token TEXT UNIQUE` column alongside legacy `token`.
- Adds column `sent_via TEXT DEFAULT 'link'`.
- Alters `template_id` to allow `NULL` (defaults automatically to canonical standard intake template).
- Installs trigger `sync_invitation_tokens_bi` to keep `token` and `invitation_token` in sync bidirectionally.

#### C. Assessment Submissions Alignment (`public.assessment_submissions`)
- Adds `responses_json JSONB` alongside legacy `raw_responses`.
- Adds `calculated_scores_json JSONB DEFAULT '{}'::jsonb`.
- Adds `client_ip TEXT`.
- Alters `template_id` to allow `NULL`.
- Installs trigger `sync_submission_responses_bi` to keep `raw_responses` and `responses_json` in sync bidirectionally.

#### D. Assessment Reviews Alignment (`public.assessment_reviews`)
- Adds `reviewer_id UUID` referencing `public.clinicians(id)`.
- Adds `reviewer_name TEXT`.
- Adds `review_status TEXT CHECK (review_status IN ('pending', 'approved', 'rejected', 'partially_accepted'))`.
- Adds `reconciliation_diff_json JSONB NOT NULL DEFAULT '{}'::jsonb`.
- Adds `merged_patient_snapshot JSONB`.
- Adds `review_notes TEXT`.

---

### 2. Atomic Stored Procedures

#### `public.approve_nutrition_plan_atomic`
```sql
CREATE OR REPLACE FUNCTION public.approve_nutrition_plan_atomic(
    p_organization_id UUID,
    p_client_plan_id TEXT,
    p_client_patient_id TEXT,
    p_clinician_id UUID,
    p_license_number TEXT,
    p_plan_version INTEGER,
    p_notes TEXT DEFAULT NULL
) RETURNS JSONB ...
```
- Validates clinician identity, active status, and RBAC authorization (`CLINICAL_DIRECTOR` or `TREATING_NUTRITIONIST`).
- Rejects empty professional license numbers.
- Inserts into `public.approval_records` FIRST, enforcing atomic signature.
- Updates `public.nutrition_plans` to approved state.
- Records `PLAN_APPROVED` in `public.audit_events`.

#### `public.verify_public_intake_token`
```sql
CREATE OR REPLACE FUNCTION public.verify_public_intake_token(p_token TEXT)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public ...
```
- Verifies token existence, revocation, completion, and expiration.
- Returns minimal patient metadata (`patient_display_name`, `initial_age`, `initial_gender`) without exposing medical chart history.

#### `public.submit_public_intake_assessment`
```sql
CREATE OR REPLACE FUNCTION public.submit_public_intake_assessment(
    p_token TEXT,
    p_responses JSONB,
    p_client_ip TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public ...
```
- Locks and validates invitation row.
- Stages raw responses into `public.assessment_submissions`.
- Marks invitation status as `'completed'`.
- Logs `INTAKE_SUBMITTED` audit event.
