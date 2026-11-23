# SHUDDHO Clinical Nutrition Intelligence Platform
## Deferred Database Deployment Manifest

**Document Version:** 1.0.0  
**Effective Date:** November 23, 2026  
**Architectural Policy Authority:** Principal Full-Stack Engineer, Supabase Security Architect & Clinical Database Architect  

---

### 1. Architectural Policy & Guardrails

Per mandatory platform architecture directives:
1. **Deferred Production Schema Deployment Standard:**
   Production Supabase database modifications and live schema executions are **STRICTLY DEFERRED** until after all platform development phases through Phase R15 are fully completed and verified.
2. **Zero Live Database Mutation During Phase Sprints:**
   No engineer or automated harness may execute DDL migrations, alter tables, drop policies, or reset the production database during intermediate sprint cycles.
3. **Graceful Fallback & Runtime Decoupling:**
   All application layers (engines, UI components, repositories) must function identically in both cloud-connected mode (using local repository emulation / safe fallbacks for undeployed schemas) and local demo mode.
4. **Forward-Only SQL Artifact Preparation:**
   Each development phase generates its verified, idempotent, forward-only SQL migration file within `supabase/migrations/` so that a single coordinated deployment can be safely run at Phase R15 closure.

---

### 2. Deferred Migration Registry

| Migration Version | Phase Name | Migration File | Status | Planned Execution Window |
|---|---|---|---|---|
| `20261124000001` | Phase R4: Protocol Studio & Lifestyle Prescriptions | `supabase/migrations/20261124000001_r4_protocol_studio.sql` | **NOT DEPLOYED (DEFERRED)** | Post-R15 Unified Release |
| `20261125000001` | Phase R5: Systems Intelligence & Multimorbidity | `supabase/migrations/20261125000001_r5_systems_intelligence.sql` | **NOT DEPLOYED (DEFERRED)** | Post-R15 Unified Release |

---

### 3. Detailed Phase Migration Specifications

#### Migration `20261124000001_r4_protocol_studio.sql` (Phase R4)
- **Target Schema:** `public.lifestyle_plans` (alteration), `public.schema_migrations` (version stamp), RPC `public.approve_lifestyle_plan_atomic`
- **New Columns:**
  - `version INTEGER DEFAULT 1`
  - `mode TEXT DEFAULT 'automatic_generated'`
  - `lifestyle_protocol JSONB DEFAULT '{}'::jsonb`
  - `supplement_protocol JSONB DEFAULT '[]'::jsonb`
  - `chronotherapy_schedule JSONB DEFAULT '[]'::jsonb`
  - `safety_evaluation JSONB DEFAULT '{}'::jsonb`
  - `is_approved BOOLEAN DEFAULT false`
  - `approved_by UUID REFERENCES public.clinicians(id)`
  - `approved_at TIMESTAMPTZ`
  - `approval_notes TEXT`
- **RPC Contract:** `approve_lifestyle_plan_atomic(p_plan_id UUID, p_notes TEXT)` provides atomic server-side verification of clinician credentials and locks records during state transitions.
- **Runtime Impact During Deferral:** Zero. In cloud mode, `SupabasePracticeRepository` safely handles lifestyle plans without blocking, while local simulation mode tags approvals as non-authoritative.

#### Migration `20261125000001_r5_systems_intelligence.sql` (Phase R5)
- **Target Tables Created:**
  1. `public.patient_clinical_pathways`: Multi-select overlapping clinical pathways with `selection_status` ('NOT_ASSESSED', 'NO_KNOWN_PATHWAY', 'PATHWAYS_SELECTED').
  2. `public.patient_running_medications`: Structured running medication cards with timing schedules, meal relationships, rule coverage, and verification status.
  3. `public.functional_matrix_observations`: 7-domain Functional Medicine Matrix and ATM (Antecedents, Triggers, Mediators) observations.
  4. `public.multimorbidity_conflict_records`: Deterministic 9-step hierarchical conflict priority resolutions with hard safety boundaries.
  5. `public.systems_network_snapshots`: Mechanistic cross-system directed graph snapshots with identified therapeutic hub nodes.
- **Security & RLS:**
  - Row Level Security (RLS) is enabled on all 5 tables.
  - Multi-tenancy isolation policies enforce `organization_id = public.get_current_user_org_id()`.
- **Runtime Impact During Deferral:** Zero. In-memory and browser localStorage adapters persist R5 pathway state and running medications cleanly during clinic sessions.

---

### 4. Verification Checkpoints for Post-R15 Live Execution

When Phase R15 is concluded, the deployment lead will apply all migrations sequentially via:
```bash
# Verify connection to shuddho-clinical
npx supabase db status

# Execute deferred migrations in forward order
npx supabase migration up

# Validate schema version registrations
# SELECT * FROM public.schema_migrations ORDER BY version ASC;
```

---
*Signed by: Lead Clinical Software Architect & Supabase Database Security Engineer*
