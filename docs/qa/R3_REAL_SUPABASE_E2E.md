# SHUDDHO Clinical Functional & Precision Nutrition Platform
## R3 Real Supabase Live End-to-End Verification Guide & Acceptance Protocol

**Document Code:** SHUDDHO-QA-E2E-032  
**Database Project:** `shuddho-clinical`  
**Host Environment:** Supabase Cloud (PostgreSQL 15+ with pg_crypto & RLS)  
**Target Environment:** Primary Cloudflare Workers (`https://shuddho-nutrition.probalofficial007.workers.dev/`) & Secondary GitHub Pages  
**Date:** November 23, 2026  
**Status:** **APPROVED / READY FOR PRODUCTION EXECUTION**

---

### 1. Verification Context & Pre-Flight Conditions

The live production environment already has:
- Supabase project: `shuddho-clinical`
- 27 tables created with Row Level Security enabled
- Verified Clinical Director profile in `organizations` and `clinicians` tables
- Cloudflare Pages environment variables configured:
  - `CF_PAGES=1`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

This document details the exact end-to-end verification protocol to validate Phase R3 remote patient intake on the live Supabase backend.

---

### 2. End-to-End Live Verification Protocol (10 Steps)

#### Step 1: Execute Migration in Supabase SQL Editor
1. Log in to the Supabase Dashboard: `https://supabase.com/dashboard/project/shuddho-clinical`.
2. Open the **SQL Editor**.
3. Load and execute `supabase/migrations/20261123000002_r3_security_completion.sql` (or the complete idempotent bundle `supabase/r3_complete_bundle.sql`).
4. Confirm successful execution with 0 errors.

#### Step 2: Verify Database Schema & Privilege State
Run the following verification query in SQL Editor:
```sql
SELECT 
  routine_name, 
  security_type, 
  routine_schema 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'issue_assessment_invitation',
    'verify_public_intake_token',
    'submit_public_intake_assessment',
    'reconcile_intake_submission_atomic',
    'approve_nutrition_plan_atomic'
  );
```
**Expected Result:** All 5 routines exist with `security_type = 'DEFINER'`.

#### Step 3: Issue Remote Assessment Invitation
1. In the live web application, sign in as the Clinical Director (`director@shuddho.clinic`).
2. Select any active patient (e.g. Mrs. Nasreen Akhter or a test patient).
3. Click the **"Remote Intake"** button in the top navigation bar.
4. Select expiry period (e.g. 14 days) and click **"Generate Link"**.
5. Copy the generated link (format: `https://shuddho-nutrition.probalofficial007.workers.dev/intake/?token=sh_inv_...`).
6. **Database Verification Query:**
   ```sql
   SELECT id, patient_id, token_hash, invitation_token, status, expires_at, access_count 
   FROM public.assessment_invitations 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
   **Expected Verification:**
   - `token_hash` contains a 64-character SHA-256 hex string.
   - `invitation_token` is empty or NULL (plaintext token is never persisted).
   - `status` is `'pending'`.
   - `access_count` is 0.

#### Step 4: Validate Public Token Verification & Telemetry
1. Open an Incognito / Private browser tab.
2. Navigate to the copied intake URL.
3. Verify that the **Patient Self-Assessment Portal** loads smoothly without requiring login credentials.
4. Verify that the patient's first name, age, and biological sex are accurately displayed.
5. **Database Verification Query:**
   ```sql
   SELECT access_count, first_accessed_at, last_accessed_at 
   FROM public.assessment_invitations 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
   **Expected Verification:** `access_count` is 1; `first_accessed_at` is set.

#### Step 5: Test Invalid / Tampered Token Fail-Closed Protection
1. In the Incognito tab, edit the URL query parameter to an invalid token: `?token=sh_inv_tampered_invalid_token`.
2. Reload the page.
3. Verify that the **Intake Invalid Token Screen** renders with clear error feedback: `"Invalid or Expired Link"`.
4. Verify that zero patient or clinical data is leaked.

#### Step 6: Patient Completes Multi-Step Intake Assessment
1. Return to the valid intake link in the Incognito tab.
2. Complete Step 1 (Anthropometrics: enter new weight, height, waist).
3. Complete Step 2 (Digestion: select bloating timing, trigger chips, stool score).
4. Complete Step 3 (Diet & Lifestyle: select fasting schedule).
5. Complete Step 4 (Medications & Allergies: report new suspected allergen, e.g., 'shellfish').
6. Complete Step 5 (Review & Informed Consent: check clinical consent checkbox).
7. Click **"Submit Assessment"**.
8. Verify that the **IntakeSubmittedSuccess** receipt screen renders with a unique submission timestamp and confirmation message.

#### Step 7: Staging Isolation Verification
1. Run query in SQL Editor:
   ```sql
   SELECT id, invitation_id, patient_id, submitted_at, responses_json 
   FROM public.assessment_submissions 
   ORDER BY submitted_at DESC 
   LIMIT 1;
   ```
   **Expected Verification:** Submission is stored in `assessment_submissions`.
2. Check the active patient record:
   ```sql
   SELECT weight_kg, confirmed_allergies, updated_at 
   FROM public.patients 
   WHERE id = (SELECT patient_id FROM public.assessment_submissions ORDER BY submitted_at DESC LIMIT 1);
   ```
   **CRITICAL CLINICAL INVARIANT:** The active patient chart in `public.patients` MUST NOT have changed! Weight remains unchanged and the new allergen is NOT present in `confirmed_allergies`.

#### Step 8: Clinician Staging Queue & Reconciliation Diff Review
1. Return to the clinician window (logged in as Clinical Director).
2. Note that the **Staged Intake Badge** now displays `(1)` pending review.
3. Click the intake badge or menu to open the **Intake Reconciliation Modal**.
4. Review the side-by-side diff:
   - Baseline Clinical Value vs Patient Self-Reported Value.
5. Selectively decide:
   - Accept weight update.
   - Accept digestive profile updates.
   - Accept newly reported allergy ('shellfish').
6. Enter clinical rationale notes and click **"Approve & Reconcile Chart"**.

#### Step 9: Atomic Chart Merge & Automatic Plan Invalidation Check
1. Query the patient table:
   ```sql
   SELECT weight_kg, confirmed_allergies, updated_at 
   FROM public.patients 
   WHERE id = (SELECT patient_id FROM public.assessment_submissions ORDER BY submitted_at DESC LIMIT 1);
   ```
   **Expected Verification:** Active patient weight is now updated to the reconciled value, and `confirmed_allergies` contains `'shellfish'`.
2. Query nutrition plans for this patient:
   ```sql
   SELECT plan_id, status, is_approved, overall_safety_status 
   FROM public.nutrition_plans 
   WHERE patient_id = (SELECT patient_id FROM public.assessment_submissions ORDER BY submitted_at DESC LIMIT 1);
   ```
   **SAFETY INVARIANT:** Any previously approved plan has transitioned to `is_approved = false` and `status = 'requires_review'`.
3. Query audit events:
   ```sql
   SELECT event_type, clinician_name, timestamp, payload_before, payload_after 
   FROM public.audit_events 
   WHERE patient_id = (SELECT patient_id FROM public.assessment_submissions ORDER BY submitted_at DESC LIMIT 1)
   ORDER BY timestamp DESC 
   LIMIT 3;
   ```
   **Expected Verification:**
   - `ASSESSMENT_SUBMISSION_ACCEPTED` logged with reviewer name.
   - `PLAN_INVALIDATED` logged citing the newly accepted allergen.

#### Step 10: Multi-Tenancy Isolation Test
1. Attempt to query or reconcile the submission using an authenticated clinician from a different organization UUID.
2. Verify that PostgreSQL RLS and the RPC function strictly raise an authorization error:
   `'Access denied: You can only reconcile submissions for your own organization.'`
3. Verify zero cross-organization leakage.

---

### 3. Summary of Live Acceptance Status

Upon completing Steps 1 through 10, Phase R3 is certified 100% operational on live Supabase cloud infrastructure with zero defects and complete clinical safety adherence.
