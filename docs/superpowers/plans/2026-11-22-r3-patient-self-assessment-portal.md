# R3: Patient Self-Assessment Portal (Feature U19) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and integrate Phase R3 (Patient Self-Assessment Portal, Feature U19) into the SHUDDHO Clinical Platform, enabling tokenized remote patient intake, safe submission staging, and clinician-supervised diff reconciliation without altering clinical chart safety gates.

**Architecture:** A standalone, responsive public intake route (`/intake?token=...`) allows patients to complete bilingual functional nutrition assessments without practitioner login. Patient submissions stage into an isolated intake queue (`assessment_submissions`). Practitioners generate tokenized invitations, view a side-by-side reconciliation diff viewer comparing patient claims against current clinical records, and selectively accept, reject, or edit claims before merging into the active patient dossier. All operations are backed by dual repository adapters (`SupabasePracticeRepository` and `LocalDemoRepository`) with immutable audit logging.

**Tech Stack:** Next.js 14 (App Router, static export), React 18, TypeScript, Tailwind CSS, Lucide icons, `@supabase/supabase-js`, TSX / Node.js test runner.

**Spec:** [`docs/master/SHUDDHO_MASTER_FEATURE_REGISTRY.md`](../../master/SHUDDHO_MASTER_FEATURE_REGISTRY.md) (Feature U19), [`docs/master/SHUDDHO_ROADMAP_R0_R15.md`](../../master/SHUDDHO_ROADMAP_R0_R15.md) (Phase R3).

## Global Constraints
- Preserve Next.js static export: `output: 'export'`, `trailingSlash: true`, `images.unoptimized: true`.
- Zero Node.js server actions or server-side API routes (`src/app/api/` is strictly forbidden).
- All client-side search parameter parsing must be wrapped in React `<Suspense>` to prevent prerendering bailout during `next build`.
- Dual deployment support: Cloudflare Pages at root `/` and GitHub Pages at `/Diet-Chart-Software/`.
- Fail-Closed Clinical Safety: Patient-submitted data is staged in `assessment_submissions` and must **never** automatically overwrite active patient clinical records or safety gates without explicit practitioner sign-off.
- Zero service role key exposure: Frontend operates strictly with publishable/anon Supabase keys.
- Preserve 100% pass rate on all existing 619 regression assertions across P0–P2, Step 01–05, R1, and R2.

## Review Focus
1. Public intake route `/intake` must handle missing, malformed, or expired tokens gracefully without crashing.
2. Incompatible or dirty data submitted by a patient (e.g. extreme values, newly declared allergens) must stage safely without triggering unintended hard stops on active nutrition plans until approved.
3. Selective reconciliation: Practitioner must be able to accept some fields (e.g. updated weight or sleep) while rejecting others (e.g. unverified self-diagnosed conditions) or overriding values.
4. Offline / Local Demo mode: Invitation generation, public intake simulation, and reconciliation must work seamlessly in `LocalDemoRepository` when Supabase credentials are absent.
5. Immutability & Audit: Merging an assessment must write a formal `assessment_reviews` record and log an immutable `AuditEvent` (`ASSESSMENT_SUBMISSION_ACCEPTED`) with delta details.

---

### Task 1: R3 Data Contracts & Repository Interfaces

**Files:**
- Modify: `src/repositories/types.ts`
- Test: `test/r3_intake_workflow.test.ts`

- [x] **Step 1.1: Define R3 Data Models in `src/repositories/types.ts`**
  Add TypeScript interfaces for:
  - `AssessmentInvitation` (`id`, `organization_id`, `patient_id`, `template_id`, `invitation_token`, `expires_at`, `status`, `sent_via`, `created_at`)
  - `AssessmentSubmission` (`id`, `organization_id`, `invitation_id`, `patient_id`, `responses_json`, `calculated_scores_json`, `submitted_at`, `client_ip`)
  - `AssessmentReview` (`id`, `organization_id`, `submission_id`, `reviewer_id`, `reviewer_name`, `review_status`, `reconciliation_diff_json`, `merged_patient_snapshot`, `review_notes`, `reviewed_at`)
  - `ReconciliationDecision` (`status: 'accepted' | 'rejected' | 'edited'`, `value?: any`, `reason?: string`)
  - Extend `IPracticeRepository` with R3 methods:
    - `createAssessmentInvitation(patientId: string, clinician: ClinicianAuthProfile, expiresDays?: number): Promise<AssessmentInvitation>`
    - `getAssessmentInvitations(patientId?: string): Promise<AssessmentInvitation[]>`
    - `getAssessmentInvitationByToken(token: string): Promise<AssessmentInvitation | null>`
    - `submitAssessment(invitationToken: string, responses: Record<string, any>): Promise<AssessmentSubmission>`
    - `getStagedSubmissions(patientId?: string): Promise<AssessmentSubmission[]>`
    - `getSubmissionById(submissionId: string): Promise<AssessmentSubmission | null>`
    - `reconcileAssessmentSubmission(submissionId: string, reviewer: ClinicianAuthProfile, decisions: Record<string, ReconciliationDecision>, notes?: string): Promise<{ review: AssessmentReview; updatedPatient: PatientProfile }>`
- [x] **Step 1.2: Write the failing test in `test/r3_intake_workflow.test.ts`**
  Cover invitation generation, token lookup, intake submission staging, and reconciliation workflow.
- [x] **Step 1.3: Run `npx tsx test/r3_intake_workflow.test.ts` and confirm failure.**

---

### Task 2: Implement R3 in LocalDemoRepository & SupabasePracticeRepository

**Files:**
- Modify: `src/repositories/LocalDemoRepository.ts`
- Modify: `src/repositories/SupabasePracticeRepository.ts`
- Test: `test/r3_intake_workflow.test.ts`

- [x] **Step 2.1: Implement R3 in `LocalDemoRepository.ts`**
  - Store invitations in `localStorage` (`shuddho_demo_assessment_invitations`).
  - Store submissions in `localStorage` (`shuddho_demo_assessment_submissions`).
  - Store reviews in `localStorage` (`shuddho_demo_assessment_reviews`).
  - Generate cryptographically sound hex or nanoid tokens (e.g. `sh_inv_<random>`).
  - Implement staging isolation: `submitAssessment` only appends to `submissions` without mutating the active patient.
  - Implement `reconcileAssessmentSubmission`: applies accepted fields to `PatientProfile`, recalculates anthropometrics if height/weight change, marks submission reviewed, emits `ASSESSMENT_SUBMISSION_ACCEPTED` audit event, and persists updated patient.
- [x] **Step 2.2: Implement R3 in `SupabasePracticeRepository.ts`**
  - Connect to PostgreSQL tables: `assessment_invitations`, `assessment_submissions`, `assessment_reviews`, and `patients`.
  - Enforce tenant isolation via `currentOrgId`.
  - Emit immutable audit events to `audit_events`.
- [x] **Step 2.3: Run `npx tsx test/r3_intake_workflow.test.ts` and verify 100% pass.**

---

### Task 3: Build the Public Responsive Intake Portal (`/intake` Route)

**Files:**
- Create: `src/app/intake/page.tsx`
- Create: `src/components/intake/PatientIntakeForm.tsx`
- Create: `src/components/intake/IntakeSubmittedSuccess.tsx`
- Create: `src/components/intake/IntakeInvalidToken.tsx`
- Test: `test/r3_portal_security.test.ts`

- [x] **Step 3.1: Create Public Portal Components**
  - Wrap search params in `<Suspense>` to ensure static export compliance.
  - Read token from URL query (`?token=...`).
  - If token is missing, expired, or revoked, render `IntakeInvalidToken.tsx`.
  - If token is already completed, inform the patient that their responses are safely on file.
  - When valid, render `PatientIntakeForm.tsx`:
    - Clean, modern, medical-grade responsive form with English/Bengali language toggle.
    - Progress stepper:
      1. Personal Information & Anthropometrics (Age, Gender, Height, Weight, Activity, Sleep).
      2. Digestion & Elimination (Agni type, Bristol Stool scale 1–7 visual selector, Bloating severity, Acid reflux).
      3. Dietary Patterns & Water (Meals per day, Vegetarian/Non-veg, Water intake in liters, Tea/Coffee).
      4. Current Health Concerns, Medications & Allergies (Free-text and checkbox selectors).
      5. Final Confirmation & Privacy Consent.
    - Client-side validation ensuring reasonable physiological limits.
    - On submit: calls `submitAssessment(token, responses)` and transitions to `IntakeSubmittedSuccess.tsx`.
- [x] **Step 3.2: Verify with static export build (`npm run build`) to ensure `/intake` prerenders without SSR errors.**

---

### Task 4: Build Clinician Intake Invitation & Reconciliation Modals

**Files:**
- Create: `src/components/intake/ClinicianInvitationModal.tsx`
- Create: `src/components/intake/IntakeReconciliationModal.tsx`
- Modify: `src/context/PracticeContext.tsx`
- Modify: `src/components/tabs/AssessmentTab.tsx`
- Modify: `src/components/Header.tsx`

- [x] **Step 4.1: Create `ClinicianInvitationModal.tsx`**
  - Modal allowing clinician to generate a secure intake link for the current active patient.
  - Expiration selector: 7 days, 14 days, 30 days.
  - Automatically copies link formatted with base URL (`window.location.origin + basePath + '/intake/?token=' + invitation.invitation_token`).
  - Quick action buttons: "Copy Link", "Share via WhatsApp", "Preview Form".
  - Shows list of previous invitations with status badges (`pending`, `completed`, `expired`).
- [x] **Step 4.2: Create `IntakeReconciliationModal.tsx`**
  - Displays pending staged submissions for the active patient (or full clinic directory).
  - Side-by-side reconciliation interface:
    - Left column: Existing Clinical Chart value.
    - Center column: Patient Self-Reported submission value.
    - Right column: Reconciliation Decision toggles: `[Accept]`, `[Reject]`, `[Edit]`.
  - Shows severity and alert badges for newly reported symptoms or allergies.
  - Clinician sign-off button: "Merge Reconciled Answers into Patient Chart".
  - Refreshes patient profile upon successful merge and shows confirmation toast.
- [x] **Step 4.3: Integrate into `PracticeContext.tsx` & `AssessmentTab.tsx`**
  - Add state management for pending intake badges and modal visibility in `PracticeContext`.
  - Add prominent "Remote Intake & Staging Queue" button in `AssessmentTab.tsx`.
  - Add header badge counter if pending patient submissions exist.

---

### Task 5: R3 Security & Regression Test Suites

**Files:**
- Create: `test/r3_portal_security.test.ts`
- Create: `test/r3_browser_e2e.test.ts`
- Modify: `package.json`

- [x] **Step 5.1: Create `test/r3_portal_security.test.ts`**
  - Verify tenant isolation on `assessment_invitations` and `assessment_submissions`.
  - Verify expired tokens reject submission.
  - Verify patient submission does NOT overwrite patient record before reconciliation.
  - Verify clinician reconciliation emits audit event and accurately updates patient record.
  - Verify Assistant Dietitian vs Treating Nutritionist review capabilities.
- [x] **Step 5.2: Create `test/r3_browser_e2e.test.ts`**
  - E2E Playwright test simulating:
    1. Clinician creates invitation link.
    2. Patient navigates to `/intake/?token=...`, completes form, and submits.
    3. Clinician opens reconciliation modal, inspects diffs, accepts weight and digestion changes, and merges.
    4. Clinician verifies updated values reflect in the active patient chart.
- [x] **Step 5.3: Update `package.json` scripts (`test:r3`, `test:r3:security`, update `npm test`).**

---

### Task 6: Full Verification, Documentation & Git Push

**Files:**
- Create: `docs/superpowers/plans/2026-11-22-r3-patient-self-assessment-portal.md`
- Create: `docs/backend/R3_INTAKE_PORTAL_SPECIFICATION.md`
- Modify: `docs/master/SHUDDHO_ROADMAP_R0_R15.md` (Update R3 status to COMPLETED)
- Modify: `docs/master/SHUDDHO_MASTER_FEATURE_REGISTRY.md` (Update U19 status to IMPLEMENTED)

- [x] **Step 6.1: Run full regression suite:** `npm test`
- [x] **Step 6.2: Run TypeScript check:** `npx tsc --noEmit`
- [x] **Step 6.3: Run Next.js static build:** `npm run build`
- [x] **Step 6.4: Commit and push changes to `main`:**
  `git commit -m "feat(r3): implement patient self-assessment portal (U19), staging queue, and clinician reconciliation"`
  `git push origin main`
- [x] **Step 6.5: Generate final R3 completion artifact and deliver closure summary.**
