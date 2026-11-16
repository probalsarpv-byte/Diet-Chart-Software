# Step 01: Clinical Data Integrity & Architecture Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize the Patient–Visit–Assessment–Snapshot data architecture so clinical observations, historical visits, and patient aggregates remain completely isolated, immutable, and crash-resilient across consultations, patient switches, browser reloads, and report generation.

**Architecture:** Implement an authoritative transactional clinical data model where PatientProfile owns stable demographics, ClinicalVisit owns visit metadata, ClinicalAssessment owns visit-specific questionnaire & lab inputs, and ClinicalVisitSnapshot owns immutable historical observations. Enforce referential integrity (`assessment.visit_id === visit.visit_id`, `snapshot.patient_id === visit.patient_id`), replace stale React setter cascades with deterministic aggregate commit boundaries, guard report generation against false baseline substitutions, and provide idempotent legacy migrations.

**Tech Stack:** Next.js 14, React 18, TypeScript 5.6, Node.js v24, Tailwind CSS, LocalStorage persistence, Vitest/tsx test runner, Python 3.15 independent QA scripts.

**Spec:** [USER_REQUEST] Step 01 — Clinical Data Integrity & Architecture Stabilization.

## Global Constraints
- Zero runtime AI: 100% deterministic TypeScript clinical rules and persistence algorithms.
- Zero data fabrication: Unmeasured fields remain strictly unmeasured (null/undefined/unassessed); no synthetic baselines, no invented weights/heights/labs.
- Next.js static export compatibility: `npm run build` must succeed with exit code 0 (`output: 'export'` for GitHub Pages).
- Browser-based local persistence: LocalStorage-compatible aggregate serialization with safe failure handling (no paid backends).
- Scope boundary: No redesign of Dashboard, Matrix, P3 Diet Planning, Diet Chart generator, or aesthetic themes.
- Git workflow: Work strictly on `fix/step01-patient-visit-snapshot-integrity`; never force push or merge to main.

## Review Focus
1. Stale React State in New Visit: `startNewVisit()` followed by `captureVisitSnapshot()` and `saveCurrentPatient()` reading uncommitted closure state, attaching old clinical data to new visits.
2. Historical Snapshot Destruction: `visitSnapshots.filter(s => s.visit_id !== visitId)` silently deleting earlier snapshot revisions or approved baselines.
3. False Baseline Fabrication: `generateProgressReport()` falling back to `currentSnap` when baseline snapshot is absent, fabricating false self-comparisons.
4. Cross-Patient / Cross-Visit Leakage: Switching visits or patients transferring in-memory assessment answers or overwriting another patient's storage.
5. Incomplete / Failed Persistence: Catching storage write/quota errors silently and displaying false success when records failed to save.

---

## Root-Cause Matrix

| Issue ID | File & Function | Exact Failure Mechanism | Reproduction Scenario | Expected Behavior | Actual Behavior | Severity | Required Correction |
|---|---|---|---|---|---|---|---|
| **RC-1** | `PracticeContext.tsx:1596` & `PatientsTab.tsx:84-88` (`handleStartNewVisit`) | `startNewVisit` calls React state setters asynchronously; immediate call to `captureVisitSnapshot` reads stale closure `patient.current_visit_id` (old visit ID). | Start New Visit from Patients tab. | Snapshot created with new visit ID and fresh unmeasured observation state. | Snapshot captured under previous visit ID with previous visit's data. | **CRITICAL** | Authoritative transactional state transition function; atomic visit creation returning new snapshot. |
| **RC-2** | `PracticeContext.tsx:1690` (`captureVisitSnapshot`) | `prev.filter(s => s.visit_id !== visitId)` removes all prior snapshots for that visit ID. | Amend an approved snapshot or record multiple revisions. | Previous approved snapshot preserved with revision 1; amendment saved as revision 2. | Prior snapshot deleted from state and LocalStorage. | **CRITICAL** | Revision-aware snapshot retention policy: retain approved snapshots, increment revision number. |
| **RC-3** | `PracticeContext.tsx:1706-1710` (`generateProgressReport`) | If baseline snapshot is missing, `if (!baselineSnap) baselineSnap = currentSnap` substitutes current snapshot. | Generate report for visit without recorded baseline. | Explicit error `MISSING_BASELINE_SNAPSHOT`; report generation blocked. | Current snapshot substituted as baseline; report claims 0% delta or false improvement. | **CRITICAL** | Integrity guard returning structured error `MISSING_BASELINE_SNAPSHOT`, blocking calculation. |
| **RC-4** | `AssessmentContext.tsx:246-250` & `190` | `loadedPatientIdRef` tracks only `patientId`, not `visitId`. Debounced auto-save fires across visit changes. | Patient A: switch from Visit 1 to Visit 2. | Visit 1 answers stay in Visit 1; Visit 2 starts fresh or loads Visit 2 answers. | Visit 1 answers auto-saved into Visit 2's storage key. | **CRITICAL** | Track `loadedVisitIdRef` and cancel/flush pending auto-saves before switching visits. |
| **RC-5** | `PracticeContext.tsx:1492-1502` (`selectVisit`) | `selectVisit` only updates `current_visit_id` on `patient`, leaving current weight/labs/gut metrics in memory. | Reopen historical baseline visit. | Patient's historical weight and observations restored into active view. | Active view displays current follow-up weight under historical visit header. | **HIGH** | Hydrate active patient clinical metrics from the selected visit's recorded snapshot or assessment. |
| **RC-6** | `PracticeContext.tsx:1315-1333` (`loadPatient`) | `loadPatient` does not check for unsaved changes in current patient; always picks `clinical_visits[0]`. | Edit Patient A, switch to Patient B without manual save, return to Patient A. | Unsaved changes safely preserved/flushed; returning to Patient A restores `current_visit_id`. | Unsaved changes silently lost; active visit resets to `clinical_visits[0]`. | **HIGH** | Auto-save draft aggregate before patient load; restore persisted `current_visit_id`. |
| **RC-7** | `FollowUpTab.tsx:109-125` | Constructs `{ visit_id: 'v_baseline', weight_kg: patient.weight_kg }` from live mutable `patient`. | Clinician enters follow-up weight of 77 kg (baseline was 80 kg). | Baseline remains 80 kg; delta is -3 kg. | Baseline becomes 77 kg; delta is 0 kg. | **HIGH** | Source baseline from verified baseline snapshot in `visitSnapshots`, not live `patient`. |
| **RC-8** | `PracticeContext.tsx:1282-1313` (`saveCurrentPatient`) | `localStorage.setItem` errors caught with `console.error`; function returns `void` without reporting failure. | Storage quota exceeded or disabled storage. | Return `{ success: false, error }`, notify clinician, preserve in-memory draft. | Function returns undefined; UI assumes save succeeded. | **HIGH** | Return structured `StorageResult<T>` with verification read-back and error reporting. |

---

## Tasks

### Task 1: Collision-Resistant ID Generation & Referential Integrity Validator
**Files:**
- Create: `src/utils/idGenerator.ts`
- Create: `src/utils/referentialIntegrity.ts`
- Test: `test/step01_id_integrity.test.ts`

- [ ] **Step 1:** Write failing tests in `test/step01_id_integrity.test.ts` checking:
  - `generateEntityId(prefix)` uses `crypto.randomUUID()` where available.
  - 10,000 rapid successive calls on the same millisecond generate 0 collisions.
  - Fallback mechanism works when `crypto.randomUUID` is unavailable.
  - `validateReferentialIntegrity()` flags mismatched patient IDs and orphaned visit/snapshot references.
- [ ] **Step 2:** Run test to verify failure (`tsx test/step01_id_integrity.test.ts`).
- [ ] **Step 3:** Implement `src/utils/idGenerator.ts` and `src/utils/referentialIntegrity.ts`.
- [ ] **Step 4:** Run test to verify green.
- [ ] **Step 5:** Commit: `feat(core): add cryptographic entity ID generator and referential integrity validator`.

---

### Task 2: Mandatory Step 01 Acceptance Tests Harness (Tests A–O)
**Files:**
- Create: `test/step01_clinical_integrity_acceptance.test.ts`
- Modify: `package.json`

- [ ] **Step 1:** Add test script `"test:step01": "tsx test/step01_clinical_integrity_acceptance.test.ts"` to `package.json`.
- [ ] **Step 2:** Code all 15 acceptance tests (Test A through Test O) with precise clinical assertions:
  - Test A: Two Patients (PAT-A, PAT-B isolation).
  - Test B: Two Visits on Same Day (distinct persistent IDs).
  - Test C: Historical Anthropometrics (80kg/95cm baseline vs 77kg/91cm follow-up).
  - Test D: Assessment Isolation (A1, A2, B1 independent).
  - Test E: Browser Reload (restore from storage).
  - Test F: Stale React State (`startNewVisit` -> `capture` race condition).
  - Test G: Approved Snapshot Protection (amendment revisioning).
  - Test H: Missing Baseline (`MISSING_BASELINE_SNAPSHOT`).
  - Test I: Cross-Patient Reference Protection.
  - Test J: Storage Failure handling.
  - Test K: Corrupted Storage Recovery.
  - Test L: Legacy Migration Idempotency.
  - Test M: P1-to-P2 Identity Propagation.
  - Test N: Patient Switching with Unsaved Changes.
  - Test O: New Visit Persistence Failure.
- [ ] **Step 3:** Run `npm run test:step01` and document which tests fail on the current codebase (reproduction).
- [ ] **Step 4:** Commit: `test(step01): add comprehensive acceptance test suite for tests A through O`.

---

### Task 3: Authoritative Snapshot Creation & Revision Immutability Engine
**Files:**
- Create: `src/engine/snapshot/snapshotManager.ts`
- Modify: `src/types/index.ts`
- Test: `test/step01_snapshot_manager.test.ts`

- [ ] **Step 1:** Write failing tests in `test/step01_snapshot_manager.test.ts`:
  - Capturing snapshot for visit retains existing approved snapshot as revision 1.
  - Capturing amendment creates revision 2 with `amendment_reason` and `amended_at`.
  - Unmeasured fields (weight=0, height=0) recorded as unmeasured, not false zeroes.
- [ ] **Step 2:** Run test to verify failure.
- [ ] **Step 3:** Implement `src/engine/snapshot/snapshotManager.ts` with pure deterministic snapshot creation, amendment versioning, and validation.
- [ ] **Step 4:** Run test to verify green.
- [ ] **Step 5:** Commit: `feat(snapshot): implement immutable snapshot creation and revision management`.

---

### Task 4: Atomic-Like Visit Transition & State Synchronization
**Files:**
- Create: `src/engine/visit/visitLifecycle.ts`
- Modify: `src/context/PracticeContext.tsx`
- Modify: `src/components/tabs/PatientsTab.tsx`
- Modify: `src/components/navigation/PersistentPatientBar.tsx`

- [ ] **Step 1:** Write failing tests reproducing RC-1 (stale state race in `startNewVisit`).
- [ ] **Step 2:** Run test to verify failure.
- [ ] **Step 3:** Implement pure transition `createNewVisitTransition(patient, visits, snapshots, visitType, notes)`.
- [ ] **Step 4:** Update `PracticeContext.tsx`:
  - `startNewVisit` uses atomic transition.
  - Removes the unsafe `captureVisitSnapshot` call immediately after `startNewVisit` in `PatientsTab.tsx`.
- [ ] **Step 5:** Run test to verify green.
- [ ] **Step 6:** Commit: `fix(visit): implement atomic visit transition and eliminate stale React state races`.

---

### Task 5: Visit-Specific Assessment Isolation & Storage Sync
**Files:**
- Modify: `src/context/AssessmentContext.tsx`
- Modify: `src/types/index.ts`

- [ ] **Step 1:** Write failing tests for RC-4: switching visits saves old answers into new visit.
- [ ] **Step 2:** Run test to verify failure.
- [ ] **Step 3:** Update `AssessmentContext.tsx`:
  - Add `loadedVisitIdRef` alongside `loadedPatientIdRef`.
  - When `patientId` or `visitId` changes, flush/cancel debounced auto-save immediately.
  - Validate `stored.patientId === patientId && stored.visitId === visitId` on hydration.
- [ ] **Step 4:** Run test to verify green.
- [ ] **Step 5:** Commit: `fix(assessment): enforce strict visit-specific assessment isolation and cancel stale auto-saves`.

---

### Task 6: Progress Comparison Baseline Guard & FollowUpTab Remediation
**Files:**
- Modify: `src/engine/longitudinal/comparisonEngine.ts`
- Modify: `src/context/PracticeContext.tsx`
- Modify: `src/components/tabs/FollowUpTab.tsx`

- [ ] **Step 1:** Write failing tests for RC-3 (`MISSING_BASELINE_SNAPSHOT`) and RC-7 (mutable baseline in `FollowUpTab`).
- [ ] **Step 2:** Run test to verify failure.
- [ ] **Step 3:** In `generateProgressReport` (`PracticeContext.tsx`), remove lines 1706-1710 that substitute `currentSnap`. Return structured error `{ error: 'MISSING_BASELINE_SNAPSHOT' }` if baseline is missing.
- [ ] **Step 4:** In `FollowUpTab.tsx`, update pipeline comparison to source baseline from verified baseline snapshot in `visitSnapshots`, falling back to first chronological visit, never live `patient`.
- [ ] **Step 5:** Run test to verify green.
- [ ] **Step 6:** Commit: `fix(report): guard longitudinal comparison against missing baselines and eliminate live patient mutation`.

---

### Task 7: Historical Visit Selection State Restoration & Safe Patient Switching
**Files:**
- Modify: `src/context/PracticeContext.tsx`
- Modify: `src/components/tabs/PatientsTab.tsx`

- [ ] **Step 1:** Write failing tests for RC-5 (historical measurements not restored on `selectVisit`) and RC-6 (unsaved draft lost on `loadPatient`).
- [ ] **Step 2:** Run test to verify failure.
- [ ] **Step 3:** Update `selectVisit`:
  - Look up snapshot for selected visit.
  - Restore historical anthropometrics and observations into active `patient` view for read-only inspection.
- [ ] **Step 4:** Update `loadPatient`:
  - Flush/save current patient draft before loading new patient.
  - Restore persisted `current_visit_id` when valid, rather than defaulting to index 0.
- [ ] **Step 5:** Run test to verify green.
- [ ] **Step 6:** Commit: `fix(navigation): restore historical visit clinical state and protect unsaved drafts on patient switch`.

---

### Task 8: Robust Local Persistence with Verification Read-Back & Quota Handling
**Files:**
- Create: `src/utils/storageManager.ts`
- Modify: `src/context/PracticeContext.tsx`

- [ ] **Step 1:** Write failing tests for RC-8: storage write failure returns structured error and preserves in-memory state.
- [ ] **Step 2:** Run test to verify failure.
- [ ] **Step 3:** Implement `src/utils/storageManager.ts`:
  - `savePatientRecord(record)` with write-back verification.
  - Safe error recovery, quota exhaustion detection, corrupted JSON recovery.
- [ ] **Step 4:** Wire `storageManager` into `PracticeContext.tsx`.
- [ ] **Step 5:** Run test to verify green.
- [ ] **Step 6:** Commit: `feat(storage): implement robust storage manager with verification read-back and quota protection`.

---

### Task 9: Versioned Idempotent Legacy Migration Engine
**Files:**
- Create: `src/utils/legacyMigration.ts`
- Modify: `src/context/PracticeContext.tsx`
- Test: `test/step01_legacy_migration.test.ts`

- [ ] **Step 1:** Write failing tests in `test/step01_legacy_migration.test.ts`:
  - Migrating legacy v1 patient with only `visits: LongitudinalVisit[]` populates `clinical_visits` without duplicate IDs.
  - Running migration twice produces identical state (idempotency).
  - Malformed records safely recovered without deleting other records.
- [ ] **Step 2:** Run test to verify failure.
- [ ] **Step 3:** Implement `src/utils/legacyMigration.ts`.
- [ ] **Step 4:** Run test to verify green.
- [ ] **Step 5:** Commit: `feat(migration): implement idempotent legacy schema migration engine`.

---

### Task 10: Real Browser Integration & Python Independent QA Suite
**Files:**
- Create: `scripts/qa_referential_integrity.py`
- Create: `test/step01_browser_workflow.test.ts` or playwright spec

- [ ] **Step 1:** Implement Python independent QA script `scripts/qa_referential_integrity.py` verifying synthetic patient fixtures, UUID uniqueness, visit referential integrity, and migration idempotency.
- [ ] **Step 2:** Execute Python QA script and record exit code and output.
- [ ] **Step 3:** Execute full browser workflow test verifying: Register Patient A -> Baseline -> Save -> Follow-up -> Save -> Switch Patient B -> Return Patient A -> Reopen both -> Reload.
- [ ] **Step 4:** Run all verification commands:
  - `npm.cmd test`
  - `npx.cmd tsc --noEmit`
  - `npm.cmd run build`
- [ ] **Step 5:** Commit: `test(qa): add python referential integrity validator and browser integration suite`.

---

### Task 11: Independent Code Review & Final Completion Verification Gate
- [ ] **Step 1:** Dispatch Senior Code Reviewer subagent using `requesting-code-review` covering diff between base `feature/p0-p2-unified-clinical-workflow-dashboard-v1` and HEAD on `fix/step01-patient-visit-snapshot-integrity`.
- [ ] **Step 2:** Review findings using `receiving-code-review`. Fix any confirmed Critical or High issues with TDD.
- [ ] **Step 3:** Re-run full test suite, TypeScript check, and static build.
- [ ] **Step 4:** Verify git status is clean and all commits are recorded.
- [ ] **Step 5:** Provide complete final engineering report with execution evidence. Ensure Step 02 and P3 are NOT started.
