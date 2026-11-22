# SHUDDHO Clinical Platform — Phase R3 Specification
## Patient Self-Assessment Portal, Staging Queue & Reconciliation Architecture (Feature U19)

**Document ID:** `SHUDDHO-SPEC-R3-U19`  
**Version:** `1.0.0`  
**Status:** `VERIFIED & IMPLEMENTED`  
**Target Release:** `Phase R3`  
**Feature Ownership:** `U19` (Patient Self-Assessment Link and Approval)  

---

### 1. Executive Summary

Phase R3 delivers a secure, HIPAA-aligned, tokenized remote patient intake portal and clinician-supervised reconciliation engine for the SHUDDHO Clinical Functional Nutrition Platform.

Prior to R3, patient intake required synchronous, in-person consultation data entry by a clinician. With R3:
1. **Remote Intake via Dedicated Public Route (`/intake`):** Clinicians generate time-limited, cryptographically randomized invitation tokens allowing patients to complete comprehensive 5-step functional assessments from any modern smartphone or desktop browser without requiring practitioner accounts.
2. **Fail-Closed Clinical Staging Isolation:** Patient self-reported submissions stage into an isolated intake buffer (`assessment_submissions`). Patient data is strictly prevented from mutating active clinical records, anthropometrics, or clinical safety gates automatically.
3. **Selective Clinician Reconciliation Diff Viewer:** Practitioners open a side-by-side reconciliation interface comparing the patient's existing active chart against self-reported submissions. Practitioners can selectively **Accept**, **Reject**, or **Edit** each item before merging into the active clinical dossier.
4. **Audit Trail Provenance:** Merges emit permanent `ASSESSMENT_SUBMISSION_ACCEPTED` or `ASSESSMENT_SUBMISSION_REJECTED` audit events tied to the authenticated reviewer with before/after state diffs.
5. **Dual Architecture Support:** Functions interchangeably in offline/local demo mode (`LocalDemoRepository`) and multi-tenant cloud PostgreSQL with Row-Level Security (`SupabasePracticeRepository`).

---

### 2. Threat Model & Safety Invariants

#### 2.1 Invariant 1: Unvetted Patient Claims Never Contaminate Safety Gates
- **Rationale:** A patient may erroneously or maliciously report incorrect body measurements, false diagnoses, or self-assumed allergies. If automatically merged, an unvetted allergy could lock essential therapeutic food groups, or an extreme weight entry could trigger hazardous macro recalculations.
- **Enforcement:** `submitAssessment` appends only to `assessment_submissions` with status `pending`. No write operation to `patients` or `plans` occurs until a licensed clinician executes `reconcileAssessmentSubmission`.

#### 2.2 Invariant 2: Cryptographic Token Life-Cycle & Fail-Closed Expiration
- **Rationale:** Intake links sent via SMS, email, or WhatsApp must not remain active indefinitely.
- **Enforcement:**
  - Tokens use high-entropy pseudorandom strings (`sh_inv_<random>`).
  - Tokens carry an explicit `expires_at` timestamp (default: 14 days, configurable to 7 or 30 days).
  - Calling `getAssessmentInvitationByToken` or `submitAssessment` against an expired, missing, or revoked token immediately halts execution and returns a descriptive security failure.
  - Submitting once marks the token `status: 'completed'`, rendering replay attacks impossible.

#### 2.3 Invariant 3: Multi-Tenancy Tenant Isolation
- **Rationale:** Submissions or invitations from Clinic A must never leak to Clinic B.
- **Enforcement:**
  - All invitations, submissions, and reviews carry an immutable `organization_id`.
  - In `SupabasePracticeRepository`, PostgreSQL Row-Level Security (RLS) policies enforce `organization_id = auth.jwt() ->> 'organization_id'`.

---

### 3. Data Model & Architecture Contracts

```
┌─────────────────────────────────┐
│ Clinician Workspace             │
│ (Authenticated Practitioner)    │
└──────────────┬──────────────────┘
               │ 1. Creates Invitation
               ▼
┌─────────────────────────────────┐
│ assessment_invitations          │
│ - token: sh_inv_xxx             │
│ - expires_at: timestamp         │
│ - status: pending               │
└──────────────┬──────────────────┘
               │ 2. Patient accesses /intake?token=sh_inv_xxx
               ▼
┌─────────────────────────────────┐
│ Public Patient Intake Form      │
│ (Bilingual, Responsive, Mobile) │
└──────────────┬──────────────────┘
               │ 3. Submits self-assessment
               ▼
┌─────────────────────────────────┐
│ assessment_submissions (STAGING)│ ◄─── Completely Isolated Buffer
│ - responses_json                │      (No mutation of active chart)
│ - status: pending               │
└──────────────┬──────────────────┘
               │ 4. Clinician reviews diffs
               ▼
┌─────────────────────────────────┐
│ Reconciliation Diff Viewer      │
│ [Accept] [Reject] [Edit]        │
└──────────────┬──────────────────┘
               │ 5. Clinician signs off & merges
               ├──────────────────────────────┐
               ▼                              ▼
┌─────────────────────────────────┐ ┌─────────────────────────────────┐
│ Active Patient Dossier          │ │ assessment_reviews & Audit Log  │
│ - Recalculated Anthropometrics  │ │ - Immutable Review Record       │
│ - Verified Allergies/Vitals     │ │ - ASSESSMENT_SUBMISSION_ACCEPTED│
└─────────────────────────────────┘ └─────────────────────────────────┘
```

#### 3.1 `AssessmentInvitation`
```typescript
export interface AssessmentInvitation {
  id: string;
  organization_id: string;
  patient_id: string;
  template_id?: string;
  invitation_token: string;
  expires_at: string; // ISO timestamp
  status: 'pending' | 'completed' | 'expired' | 'revoked';
  sent_via: 'link' | 'email' | 'sms' | 'whatsapp';
  created_at: string; // ISO timestamp
}
```

#### 3.2 `AssessmentSubmission`
```typescript
export interface AssessmentSubmission {
  id: string;
  organization_id: string;
  invitation_id: string;
  patient_id: string;
  responses_json: Record<string, any>;
  calculated_scores_json?: Record<string, any>;
  submitted_at: string;
  client_ip?: string;
}
```

#### 3.3 `AssessmentReview`
```typescript
export interface AssessmentReview {
  id: string;
  organization_id: string;
  submission_id: string;
  reviewer_id: string;
  reviewer_name: string;
  review_status: 'approved' | 'rejected' | 'partially_accepted';
  reconciliation_diff_json: Record<string, any>;
  merged_patient_snapshot?: any;
  review_notes?: string;
  reviewed_at: string;
}
```

---

### 4. User Experience & Component Registry

| Component | Path | Description |
| :--- | :--- | :--- |
| `IntakePage` | `src/app/intake/page.tsx` | App Router public page wrapped in `<Suspense>` for Next.js static export compatibility. |
| `PatientIntakeForm` | `src/components/intake/PatientIntakeForm.tsx` | 5-step responsive bilingual form covering Demographics, Agni, Stool, Diet & Water, Health/Allergies, and Declaration. |
| `IntakeInvalidToken` | `src/components/intake/IntakeInvalidToken.tsx` | Friendly, secure error screen for missing, expired, completed, or revoked tokens. |
| `IntakeSubmittedSuccess`| `src/components/intake/IntakeSubmittedSuccess.tsx` | Submission confirmation receipt and patient reassurance screen. |
| `ClinicianInvitationModal` | `src/components/intake/ClinicianInvitationModal.tsx`| Clinician modal for token creation, expiration tuning, WhatsApp sharing, and token history. |
| `IntakeReconciliationModal`| `src/components/intake/IntakeReconciliationModal.tsx`| Clinician side-by-side reconciliation diff viewer with selective Accept/Reject/Edit toggles. |

---

### 5. Automated Verification & Test Coverage

Phase R3 is verified across three independent test suites totaling 50 dedicated assertions, plus 0 regressions across all 619 pre-existing assertions:

1. **`test/r3_intake_workflow.test.ts` (27 Assertions):**
   - End-to-end token generation, lookups, patient submission staging, and selective clinician reconciliation.
2. **`test/r3_portal_security.test.ts` (23 Assertions):**
   - Fail-closed expiration verification, anti-tampering against forged tokens, multi-tenant isolation, chart contamination prevention, and immutable audit logging.
3. **`test/r3_browser_e2e.test.ts` (Playwright Browser Test):**
   - Real headless Chrome navigation through missing token handling, multi-step intake completion, submission receipt, and clinician workspace modal interaction.
