# U18 Clinical Audit Log Specification

**Document ID:** SHUDDHO-DOC-R2-006  
**Regulatory Standard:** 21 CFR Part 11 & Clinical Health Informatics Compliance  
**Table:** `public.audit_events`  
**Immutability:** Strictly Enforced by PostgreSQL RLS  

---

## 1. Architectural Mandate

In clinical nutrition and metabolic therapeutics, every patient identity creation, biomarker entry, prescription generation, modification, and formal clinician approval must be permanently recorded in an unalterable audit ledger.

---

## 2. Event Types & Payloads

| Event Type | Entity Type | Trigger Context |
|---|---|---|
| `PATIENT_CREATED` | `patient` | New patient registered in practice |
| `PATIENT_UPDATED` | `patient` | Somatic measurements, labs, or allergies modified |
| `PATIENT_DELETED` | `patient` | Record deleted by Clinical Director |
| `VISIT_CREATED` | `visit` | Consultation visit initiated |
| `PLAN_GENERATED` | `nutrition_plan`| 7-day personalized weekly diet plan created |
| `PLAN_UPDATED` | `nutrition_plan`| Meal gram weights or food exchanges modified |
| `PLAN_APPROVED` | `approval_record`| Licensed clinician applies digital signature |
| `PLAN_INVALIDATED` | `nutrition_plan`| Post-approval edit transitions plan to requires_review |
| `REPORT_RELEASED` | `patient_report`| Patient-safe diet prescription released |
| `DATA_MIGRATED` | `patient` | LocalStorage data imported into Supabase |
| `SESSION_LOGIN` | `auth` | Clinician authenticated session established |
| `SESSION_LOGOUT` | `auth` | Clinician session terminated |

---

## 3. Database Schema & Immutability Rules

```sql
CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    clinician_id UUID REFERENCES public.clinicians(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    payload_before JSONB,
    payload_after JSONB,
    client_ip TEXT,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### RLS Policies
- `audit_events_select_org`: Authenticated clinicians in the organization can read audit records.
- `audit_events_insert_append_only`: Authenticated clinicians can append audit events.
- `audit_events_update_forbidden`: `FOR UPDATE TO authenticated USING (false)`.
- `audit_events_delete_forbidden`: `FOR DELETE TO authenticated USING (false)`.
