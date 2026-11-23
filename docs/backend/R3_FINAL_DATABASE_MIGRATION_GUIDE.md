# SHUDDHO Clinical Functional & Precision Nutrition Platform
## R3 Final Database Migration & SQL Bundle Deployment Guide

**Document Code:** SHUDDHO-DB-MIG-033  
**Target Database:** `shuddho-clinical` (Supabase PostgreSQL)  
**Migration Files:**
- Single Corrective Migration: `supabase/migrations/20261123000002_r3_security_completion.sql`
- Complete Consolidated Bundle: `supabase/r3_complete_bundle.sql`  
**Execution Environment:** Supabase SQL Editor / Supabase CLI  
**Date:** November 23, 2026  
**Audience:** PostgreSQL Database Administrator, Supabase Security Architect

---

### 1. Executive Summary

Phase R3 extends the database schema to support secure remote patient intake (Feature U19). 
This migration:
1. Hardens the `assessment_invitations` table: drops legacy `NOT NULL` constraints on plaintext tokens, clears existing plaintext tokens, and enforces SHA-256 hash storage.
2. Implements `public.issue_assessment_invitation` RPC (generates 256-bit cryptographically secure token, stores only hash, returns plaintext once to authorized clinician).
3. Hardens `public.revoke_assessment_invitation` and `public.rotate_assessment_invitation` with strict `auth.uid() IS NOT NULL`, active status, and organization checks.
4. Implements `public.reconcile_intake_submission_atomic` with a strict server-side allowlist (`weight_kg`, `height_cm`, `waist_cm`, `sleep_hours`, `activity_level`, `gut_profile`, `confirmed_allergies`), **directly updates `patients` row in PostgreSQL**, executes a clinical safety classifier (new allergy or weight shift $\ge 3\text{ kg}$), and invalidates approved plans with a `PLAN_INVALIDATED` audit trail.
5. Hardens `public.approve_nutrition_plan_atomic` requiring `auth.uid() IS NOT NULL`, active clinician role, professional license number verification, plan-patient binding, and `HARD_STOP` rejection.
6. Enforces least-privilege permissions: revokes all public execution rights and grants access only to `authenticated` (and `anon` strictly on the public intake RPCs).

---

### 2. Migration Execution Instructions

#### Option A: Supabase Web SQL Editor (Recommended)

1. Log into your Supabase project dashboard:
   `https://supabase.com/dashboard/project/shuddho-clinical`
2. Navigate to **SQL Editor** in the left sidebar.
3. Click **"New Query"**.
4. Open `supabase/migrations/20261123000002_r3_security_completion.sql` (or `supabase/r3_complete_bundle.sql`).
5. Copy the entire file contents and paste into the SQL Editor.
6. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`).
7. Verify that the query completes with:
   `Success. No rows returned` (or NOTICE logs showing preflight checks passed).

---

### 3. Pre-Flight Checks & Safety Guarantees

Both SQL migration scripts are designed with **strict forward-only idempotency**:
- **Existence Checks:** Checks `IF EXISTS` / `IF NOT EXISTS` before altering columns, creating tables, or creating policies.
- **Safe Type Transitions:** Plaintext token columns (`token`, `invitation_token`) have their `NOT NULL` constraints dropped before clearing.
- **Zero Data Loss:** Existing organizations, clinicians, patients, and nutrition plans are preserved intact.
- **Transaction Rollback:** If any statement fails, the entire transaction rolls back automatically (`BEGIN ... COMMIT`).

---

### 4. Post-Migration Verification Queries

Execute the following queries in the Supabase SQL Editor to confirm that all security controls and stored procedures are active:

#### Query 1: Verify Table Structure & Constraints
```sql
SELECT 
  table_name, 
  column_name, 
  is_nullable, 
  data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'assessment_invitations' 
  AND column_name IN ('token_hash', 'invitation_token', 'token', 'access_count')
ORDER BY column_name;
```
**Expected:** `token_hash` exists; `invitation_token` and `token` have `is_nullable = 'YES'`.

#### Query 2: Verify Security Definer Functions
```sql
SELECT 
  routine_name, 
  security_type, 
  data_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'issue_assessment_invitation',
    'revoke_assessment_invitation',
    'rotate_assessment_invitation',
    'verify_public_intake_token',
    'submit_public_intake_assessment',
    'reconcile_intake_submission_atomic',
    'approve_nutrition_plan_atomic'
  )
ORDER BY routine_name;
```
**Expected:** 7 routines returned, all with `security_type = 'DEFINER'`.

#### Query 3: Verify Function Execution Privileges
```sql
SELECT 
  routine_name, 
  grantee, 
  privilege_type 
FROM information_schema.routine_privileges 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'issue_assessment_invitation',
    'verify_public_intake_token',
    'submit_public_intake_assessment',
    'reconcile_intake_submission_atomic'
  )
ORDER BY routine_name, grantee;
```
**Expected:**
- `verify_public_intake_token` & `submit_public_intake_assessment` have grants for `anon` and `authenticated`.
- `issue_assessment_invitation` & `reconcile_intake_submission_atomic` have grants **only** for `authenticated` (and `service_role`). Zero grants for `anon` or `PUBLIC`.

---

### 5. Rollback & Disaster Recovery Protocol

If an unexpected database error occurs:
1. The migration runs inside an explicit transaction block (`BEGIN ... COMMIT`). An unhandled failure automatically triggers a complete rollback.
2. To manually revert function definitions to their prior state without affecting table data, re-run the previous stable migration:
   `supabase/migrations/20261123000001_r3_schema_and_security.sql`.
