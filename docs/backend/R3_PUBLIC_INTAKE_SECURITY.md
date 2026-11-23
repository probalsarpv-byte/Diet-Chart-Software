# SHUDDHO Clinical Nutrition Platform
## R3 Public Patient Intake Security Architecture

**Author:** Security Architect & Supabase Infrastructure Engineer  
**Date:** November 23, 2026  
**Audience:** Security Auditors, Healthcare Compliance Officers, DevOps Engineers

---

### 1. Problem Statement & Threat Model

In a multi-tenant healthcare application operating with strict PostgreSQL Row Level Security (RLS):
1. **The RLS Conflict**: All medical tables (`patients`, `visits`, `assessment_invitations`, `assessment_submissions`) are restricted to authenticated clinicians belonging to the patient's organization.
2. **The Anonymous Patient**: An incoming patient accessing `/intake?token=sh_inv_...` is an unauthenticated visitor (`role = anon`).
3. **The Anti-Pattern**: Widening RLS policies to allow public `SELECT` or `INSERT` on `patients` or `assessment_invitations` creates dangerous data leakage and tampering risks.

---

### 2. The Solution: Security-Definer Isolation

Instead of compromising table-level RLS policies, SHUDDHO implements a **dual-layer isolation architecture**:

```
[ Unauthenticated Patient ]
           │
           ▼
[ /intake?token=sh_inv_... ]
           │ (calls RPC via anon key)
           ▼
[ SECURITY DEFINER RPCs ]
 ├─ verify_public_intake_token(p_token)
 └─ submit_public_intake_assessment(p_token, p_responses)
           │ (Executes with elevated search_path = public)
           ▼
[ Scoped Invitation Validation & Staging Table Insert ]
           │
           ▼
[ Clinician Staging Queue (assessment_submissions) ]
           │ (Clinician manually reviews diff)
           ▼
[ Active Patient Medical Record (patients) ]
```

#### Security Properties
1. **Zero Table-Level RLS Weakening**: `patients` and `assessment_invitations` remain 100% inaccessible to anonymous table queries.
2. **Minimal Data Surface**: `verify_public_intake_token` returns only `patient_display_name`, `initial_age`, and `initial_gender`. No clinical condition, lab value, medication, or allergy data is ever returned.
3. **No Direct Chart Mutation**: The submission procedure writes strictly to `assessment_submissions`. It is structurally impossible for an unreviewed public intake submission to alter an active patient's diet plan, confirmed allergies, or clinical conditions.
4. **Strict Cryptographic Entropy**: Tokens are generated via browser or Node `crypto.getRandomValues(new Uint8Array(16))`, formatted as 32 hex characters with a `sh_inv_` prefix, preventing guessing or enumeration attacks.
5. **Single-Use Replay Prevention**: Once a submission is recorded, the invitation status transitions immediately to `'completed'`, rejecting all replay attempts.
