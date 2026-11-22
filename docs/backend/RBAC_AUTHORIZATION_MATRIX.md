# Role-Based Access Control (RBAC) Authorization Matrix

**Document ID:** SHUDDHO-DOC-R2-005  
**Audited Roles:** 3 Tier Clinical Staff Hierarchy  

---

## 1. Clinician Roles & Clinical Scope

### 1.1 `CLINICAL_DIRECTOR` (Medical Director / Chief Clinical Nutritionist)
- **Clinical Privileges:** Unrestricted clinical analysis, diagnosis, drug-nutrient reconciliation, and plan approval.
- **Administrative Privileges:** Add/remove clinicians, edit clinic profile, delete erroneous patient profiles, manage master FCTB food catalog overrides.

### 1.2 `TREATING_NUTRITIONIST` (Licensed Functional Nutritionist / Registered Dietitian)
- **Clinical Privileges:** Conduct consultations, run Phase 2 root-cause intelligence, create/modify 7-day personalized weekly nutrition plans, sign formal legal approval records (`approval_records`), release patient prescriptions (`patient_reports`).
- **Administrative Privileges:** Manage assigned patients and consultations. Cannot edit clinic organization settings or delete patient records.

### 1.3 `ASSISTANT_DIETITIAN` (Junior Dietitian / Clinical Associate)
- **Clinical Privileges:** Enter intake anthropometrics, transcribe lab biomarkers, assist in drafting meal plans.
- **RESTRICTIONS (Fail Closed):**
  - **STRICTLY PROHIBITED** from signing or approving nutrition plans.
  - **STRICTLY PROHIBITED** from inserting or modifying `approval_records`.
  - **STRICTLY PROHIBITED** from releasing patient diet prescriptions.
  - Plan approval button is disabled in the UI; database RLS policies enforce hard denial at the PostgreSQL level.

---

## 2. Granular Capability Matrix

| Operational Capability | CLINICAL_DIRECTOR | TREATING_NUTRITIONIST | ASSISTANT_DIETITIAN |
|---|:---:|:---:|:---:|
| View Patient Registry | ✅ Full Clinic | ✅ Full Clinic | ✅ Full Clinic |
| Register New Patient | ✅ Yes | ✅ Yes | ✅ Yes |
| Record Somatic Anthropometrics | ✅ Yes | ✅ Yes | ✅ Yes |
| Enter Laboratory Results | ✅ Yes | ✅ Yes | ✅ Yes |
| Run Phase 2 Clinical Intelligence | ✅ Yes | ✅ Yes | ✅ Read / Preview |
| Generate 7-Day Nutrition Plan | ✅ Yes | ✅ Yes | ✅ Yes (Draft only) |
| Modify Meal Items & Grams | ✅ Yes | ✅ Yes | ✅ Yes (Draft only) |
| **Formally Approve Nutrition Plan** | ✅ **YES** | ✅ **YES** | ❌ **FORBIDDEN** |
| **Release Patient Diet Prescription** | ✅ **YES** | ✅ **YES** | ❌ **FORBIDDEN** |
| Schedule Follow-Up Appointment | ✅ Yes | ✅ Yes | ✅ Yes |
| View Clinical Audit Log (U18) | ✅ Full Clinic | ✅ Full Clinic | ✅ Assigned Patients |
| Manage Clinic Practice Settings | ✅ Yes | ❌ No | ❌ No |
| Add / Invite Clinicians | ✅ Yes | ❌ No | ❌ No |
| Delete Patient Records | ✅ Yes | ❌ No | ❌ No |
