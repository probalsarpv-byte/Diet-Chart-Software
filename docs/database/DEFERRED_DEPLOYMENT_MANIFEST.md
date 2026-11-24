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

### 5. Post-R5 Assessment Consolidation & Contract Stability Verification (November 24, 2026)

- **Production Database Status:** **ZERO LIVE MUTATIONS EXECUTED**.
- **Supabase Cloud Verification:** Verified that no connection attempts, migrations, or DDL statements were executed against live Supabase production infrastructure.
- **Contract Parity:** Canonical medication adapters (`canonicalToLegacyMedication`, `canonicalToR5Medication`) and `evaluateMedicationReconciliationStatus` guarantee that patient records persist without data loss across both offline demo and local storage layers, aligning directly with the deferred schema targets in `20261125000001_r5_systems_intelligence.sql`.
- **Pre-R15 Readiness:** The schema definition is frozen and verified ready for execution during the post-R15 coordinated release.

---

### 6. Phase R5 Final Integration & Definitive Phase Closure (November 24, 2026)

- **Production Database Policy:** **ZERO LIVE MUTATIONS EXECUTED**. Strictly preserved post-R15 database deferral standard.
- **Contract Parity & Bridges Delivered:**
  1. `R5NutritionAdjustmentContract`: Seamlessly connects R5 Clinical Pathways, Multimorbidity resolutions, and DNI rules directly to `conflictResolver.ts` and `weeklyPlanner.ts`.
  2. `StructuredTrafficLightGuide`: Structured 7-food-group dietary table without artificial `.slice()` truncation.
  3. `UnifiedPrescriptionSchedule`: 6-column chronological prescription schedule contract bridging Domain 13 medications and R4 supplements for Phase R6 handoff.
- **Verification Evidence:**
  - `npx tsc --noEmit`: 0 errors.
  - `npm run test:r5`: 64/64 passed.
  - `npm run test:r5:browser`: 36/36 assertions passed across 22 scenarios.
  - `npm run build`: 7/7 static routes prerendered cleanly.

---

### 7. Phase R5 Final Critical Correction & Clinical Safety Gate (November 24, 2026)

- **Production Database Policy:** **ZERO LIVE MUTATIONS EXECUTED**. Strictly preserved post-R15 database deferral standard.
- **Clinical Safety Gate Corrections (P0-001 through P1-007):**
  1. **P0-001 (Decoupling Clinical Pathways from Confirmed Diagnoses):** Removed false disease inference (Mental Health $\ne$ Dysbiosis, Renal $\ne$ Gout, Metabolic $\ne$ T2D). In `PracticeContext.tsx` and `r5PathwayRegistry.ts`, clinical pathways are strictly treated as assessment lenses rather than auto-confirmed diagnoses.
  2. **P0-002 (Calibrated Potassium Safety Rules):** Removed blanket RED restrictions. Normal potassium ($3.5 \le K < 5.0$) in CKD does not trigger hyperkalemia bans. Borderline potassium ($5.0 \le K < 6.0$) or $\text{eGFR} < 30$ triggers `POTASSIUM_REVIEW` (YELLOW, overridable). Severe hyperkalemia ($K \ge 6.0$) triggers `HYPERKALEMIA_SAFETY` (RED, hard ceiling).
  3. **P0-003 (Calibrated Protein & Sodium Target Generation):** Non-dialysis CKD stage 3-5 without sarcopenia receives $0.8\text{ g/kg}$; dialysis receives $1.2\text{ g/kg}$; sarcopenia/frailty flagged for clinician review; sodium $2000\text{ mg}$ requires verified hypertension/HF diagnosis.
  4. **P0-004 (Medication Reconciliation & Chronological Scheduling):** In `r5ToR4Adapter.ts`, product strength is never substituted for prescribed dose. Twice-daily medications generate distinct administration entries (e.g., 08:30 and 20:30). Unverified draft supplements are strictly prevented from appearing as approved.
  5. **P1-001 (Conditions Tab Deduplication):** Removed interactive toggles in `ConditionsTab.tsx`; replaced with read-only confirmed clinical diagnoses, active pathways, and direct clinical link to Assessment.
  6. **P1-002 (Diet Engine Context Decoupling):** Fallback planning context guarantees `r5NutritionConstraints` reaches `weeklyPlanner.ts` even when P2 planning context is absent.
  7. **P1-004 - P1-007 (Report & Planner Polish):** Deterministic 7-food-group categorization checking food categories before exchange metadata, print-safe multi-page A4 CSS table, and clinician-directed meal structuring without forced 16:8 fasting assumptions.
- **Verification Evidence:**
  - `npx tsc --noEmit`: 0 errors.
  - `npm run test:r5`: 71/71 passed (37 systems intelligence + 16 consolidation + 18 diet integration).
  - `npm run test:r4`: 82/82 passed.
  - `npm test`: All Step 01-05 & R1-R4 test suites passed.
  - `npm run test:r5:browser`: 36/36 assertions passed across 22 scenarios.
  - `npm run build`: 7/7 static routes prerendered cleanly.
- **Phase Status:** **100% PHASE R5 DEFINITIVE CLINICAL SAFETY GATE VERIFIED. PERMANENT R5 CLOSURE APPROVED.**

---
*Signed by: Principal Full-Stack Engineer, Supabase Security Architect & Clinical Database Architect*


