# Step 03: Premium Clinical Dashboard, Follow-Up Management & Longitudinal Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the SHUDDHO clinical workflow into a premium, responsive, reliable healthcare SaaS platform featuring an authoritative Practice Command Center dashboard, transactional follow-up appointment lifecycle management, deterministic 4-mode longitudinal progress comparison, honest clinical trend visualizations, and A4 printable progress reports with explicit clinician approval.

**Architecture:**
- **Package A (Dashboard):** Clinic-wide operational aggregation across all persisted records in `shuddho_saved_patients` using Asia/Dhaka timezone calculations. Safe patient handoff prior to visit or assessment operations. Zero synthetic demo metrics when the practice has zero registered patients.
- **Package B (Follow-Up Management):** Transactional appointment lifecycle (`scheduled`, `due_today`, `overdue`, `rescheduled`, `completed`, `cancelled`) with atomic storage commit via `savePatientTransaction`. Distinct collision-resistant visit IDs for all consultations (Visit 1, 2, 3 never share IDs). Starting a consultation links the appointment without prematurely marking it completed; completion occurs upon finalization.
- **Package C (Longitudinal Progress & Comparative Reports):** Deterministic 4-mode comparison engine (Mode A: Baseline vs Current, Mode B: Previous vs Current, Mode C: Selected Pair, Mode D: Multi-Visit Trend). Context-aware clinical interpretation (pediatric growth, pregnancy, underweight restoration, and oncology never treat weight loss as automatically beneficial). Honest data visualizations (zero fabricated intermediate points). Elegant A4 printable layout across Sections A–L with verifiable clinician approval persisted to `safeStorage`.

**Tech Stack:** Next.js 14, React 18, TypeScript 5.6, Tailwind CSS (Deep navy `#0B132B`, teal `#0D9488`, emerald `#10B981`, slate tones), Playwright E2E, tsx test runner, safeStorage LocalStorage engine.

**Spec:** [USER_REQUEST] SHUDDHO Step 03 — Premium Clinical Dashboard, Follow-Up Management & Longitudinal Progress.

---

## Global Constraints
- **Zero runtime AI:** 100% deterministic TypeScript clinical calculations and persistence.
- **Data integrity & honesty:** Zero fabricated laboratory measurements, zero synthesized intermediate trend points, zero synthetic demo counters when practice has 0 patients.
- **Next.js static export compatibility:** `npm.cmd run build` must compile cleanly (`output: 'export'` for GitHub Pages).
- **Timezone boundary:** All appointment date calculations (Today, Overdue, Due Today, Next 7 Days) must use `Asia/Dhaka` timezone.
- **Git safety:** Work exclusively on `feature/step03-premium-dashboard-followup` branched from commit `687442825f2f051beae203a7e4856a655bef7305`. Do not merge to main automatically.
- **Preservation boundary:** Preserve all P0 clinical safety screening, P1 9-step assessment wizard, P2 clinical intelligence matrices, and Step 01/02 data contracts. Do not begin P3 Diet Generator.

---

## Review Focus
1. **Stale/Premature State in Appointment Consultation Initiation:** Opening a consultation from an appointment must not prematurely mark the appointment `completed` or create a visit with stale in-memory patient state when clicking Patient B while Patient A was active.
2. **Appointment Persistence Integrity:** Calling `scheduleFollowUp`, `rescheduleFollowUp`, `cancelFollowUp`, and `completeFollowUp` must execute an atomic transaction write to `safeStorage` (`shuddho_saved_patients`), not merely update ephemeral React state.
3. **Clinic-Wide Dashboard Aggregation:** Dashboard KPIs must aggregate all patients in `savedPatients`, excluding cancelled and completed appointments from pending/due/overdue tallies, and strictly respecting Asia/Dhaka calendar days.
4. **Clinical Interpretation Context Guard:** Weight loss must not be marked as `improved` for pregnant, pediatric, oncology, or underweight restoration cases where weight maintenance or gain is clinically required.
5. **Comparative Report Approval Persistence:** Progress report approval must be an explicit clinician action validating non-placeholder practitioner credentials, atomic write-back verification to `safeStorage` (both dedicated key and patient aggregate), and rollback on failure.

---

## Root-Cause Matrix

| Issue ID | File & Function | Exact Failure Mechanism | Reproduction Scenario | Expected Behavior | Actual Behavior | Severity | Required Correction |
|---|---|---|---|---|---|---|---|
| **RC-301** | `PracticeContext.tsx:1571-1643` (`scheduleFollowUp`, etc.) | Only updates local React state (`setFollowUpAppointments`), never calls `savePatientTransaction` or writes to `safeStorage`. | Schedule follow-up, switch patients or reload page. | Appointment persisted in patient record and storage. | Appointment lost on reload or patient switch. | **CRITICAL** | Wrap all appointment mutations in `savePatientTransaction` updating both active state and `savedPatients`. |
| **RC-302** | `DashboardTab.tsx:171-180` (`handleStartFollowUpForAppointment`) | Calls `loadPatient(apt.patient_id)` then immediately `startNewVisit(apt.patient_id)` before React state updates; then calls `completeFollowUp` immediately. | Click "Start Visit" on Patient B's appointment while Patient A is active. | Patient B loaded, new visit created under Patient B, appointment linked as in-progress. | Uses stale Patient A data in closure; prematurely marks appointment completed. | **CRITICAL** | Implement `startFollowUpForPatientAppointment(patientId, appointmentId)` that retrieves target patient record and creates isolated visit without premature completion. |
| **RC-303** | `DashboardTab.tsx:109-123` (`kpis`) | `a.status === 'due_today' || a.scheduled_date === today` counts appointments whose status is `completed` or `cancelled`. | Create 1 appointment completed today and 1 cancelled today. | Due Today = 0. | Due Today = 2 (completed & cancelled counted). | **HIGH** | Filter out `completed` and `cancelled` from `dueToday`, `overdue`, and `upcoming7Days`. |
| **RC-304** | `PracticeContext.tsx:1859-1907` (`approveProgressReport`) | Only persists to standalone key `shuddho_progress_report_${patient.id}_${reportId}`, does not update `progress_reports` in `savedPatients`. | Approve report, switch patients, return to patient. | Approved report restored with `is_approved === true`. | Report reverts to unapproved draft from `savedPatients`. | **HIGH** | Update `progress_reports` in `PatientRecord` and commit via `savePatientTransaction`. |
| **RC-305** | `comparisonEngine.ts:50-130` (`calculateMetricChange`) | When computing weight delta, assumes reduction is always beneficial regardless of pregnancy, oncology, or underweight status. | Weight loss in pregnant patient (e.g. 60 kg -> 57 kg). | Flagged as `contextual` / `worsened` or requiring clinical review. | Flagged as `improved`. | **HIGH** | Enforce clinical context checking for pregnancy, pediatric, oncology, and underweight patients. |
| **RC-306** | `FollowUpTab.tsx:94-105` | Two-point comparison can be mistakenly presented as multi-visit trend without clear indication of sparse data. | Patient with only 2 visits views trend tab. | Explicit notification: only 2 observation points recorded; table display preferred over misleading curve. | Displays full trend header implying continuous multi-visit progression. | **MEDIUM** | Distinguish 2-point comparisons from true multi-visit (>= 3 points) trends and label data availability clearly. |

---

## Tasks

### Task 1: Asia/Dhaka Date Utilities & Clinic-Wide KPI Aggregator Engine
**Files:**
- Create: `src/utils/dhakaDate.ts`
- Create: `test/step03_dashboard_followup.test.ts` (Scenarios 1–4)

**Interfaces:**
- Consumes: `FollowUpAppointment`, `ClinicalVisit`, `PatientRecord`
- Produces: `getDhakaDateString()`, `isDateTodayDhaka()`, `isDatePastDhaka()`, `isDateUpcomingDhaka()`, `calculatePracticeKPIs(patients: PatientRecord[])`

- [ ] **Step 1: Write failing tests for Dhaka date calculations & practice-wide KPI aggregation**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `src/utils/dhakaDate.ts` with strict timezone handling and KPI aggregation**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit:** `git commit -m "feat(step03): add Asia/Dhaka date calculation utilities and practice KPI aggregator"`

---

### Task 2: PracticeContext Appointment & Consultation Transactional Persistence
**Files:**
- Modify: `src/context/PracticeContext.tsx`
- Test: `test/step03_dashboard_followup.test.ts` (Scenarios 5–8)

**Interfaces:**
- Consumes: `savePatientTransaction`, `FollowUpAppointment`, `AppointmentStatus`
- Produces: Persistent `scheduleFollowUp`, `rescheduleFollowUp`, `cancelFollowUp`, `completeFollowUp`, `startFollowUpConsultation(patientId, appointmentId)`

- [ ] **Step 1: Write failing tests for persistent appointment lifecycle and safe consultation initiation**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Refactor appointment handlers in `PracticeContext.tsx` to commit via `savePatientTransaction`**
- [ ] **Step 4: Ensure starting a consultation generates distinct visit IDs and does not prematurely mark appointments completed**
- [ ] **Step 5: Run tests to verify they pass**
- [ ] **Step 6: Commit:** `git commit -m "feat(step03): transactional persistence for follow-up appointments and consultation lifecycle"`

---

### Task 3: Premium Practice Command Center (DashboardTab.tsx)
**Files:**
- Modify: `src/components/tabs/DashboardTab.tsx`
- Test: `test/step03_dashboard_followup.test.ts` (Scenarios 1, 2, 3, 4, 6)

**Interfaces:**
- Consumes: `usePractice`, `calculatePracticeKPIs`, `getDhakaDateString`
- Produces: Polished responsive Dashboard (KPI cards, today's schedule, recent patients, quick launcher, zero-patient empty state)

- [ ] **Step 1: Write failing tests for DashboardTab data flow and empty state assertions**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Refactor `DashboardTab.tsx` with premium design system, real KPI calculations, safe patient handoff, and zero fake data**
- [ ] **Step 4: Run tests to verify they pass**
- [ ] **Step 5: Commit:** `git commit -m "feat(step03): premium practice command center dashboard with safe navigation and zero fake data"`

---

### Task 4: Longitudinal Comparison Engine & Context-Aware Clinical Interpretations
**Files:**
- Modify: `src/engine/longitudinal/comparisonEngine.ts`
- Test: `test/step03_dashboard_followup.test.ts` (Scenarios 9–14)

**Interfaces:**
- Consumes: `ClinicalVisitSnapshot[]`, `PatientProfile`, `comparisonMode`
- Produces: 4 comparison modes (`baseline_vs_current`, `previous_vs_current`, `selected_pair`, `multi_visit_trend`), pregnancy/pediatric/oncology/underweight-aware interpretations, honest unmeasured lab handling

- [ ] **Step 1: Write failing tests for 4 comparison modes and contextual clinical outcomes**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Refine `comparisonEngine.ts` to support explicit visit pair selection, trend series extraction, and context-aware metric evaluation**
- [ ] **Step 4: Run tests to verify they pass**
- [ ] **Step 5: Commit:** `git commit -m "feat(step03): context-aware longitudinal comparison engine and multi-visit trend analysis"`

---

### Task 5: Follow-Up Workspace & Lightweight Clinical Visualizations (FollowUpTab.tsx)
**Files:**
- Modify: `src/components/tabs/FollowUpTab.tsx`
- Test: `test/step03_dashboard_followup.test.ts` (Scenarios 7, 8, 11, 12)

**Interfaces:**
- Consumes: `usePractice`, `comparisonEngine`, `CLINICAL_PHASES`
- Produces: 4-subtab workspace (Scheduling, Care Phases & Visits, Comparison Workspace, Comparative Reports), responsive SVG trendlines (Weight, Waist, HbA1c, Symptoms) with missing-data honesty

- [ ] **Step 1: Write failing tests for FollowUpTab sub-tabs, visit recording, and SVG chart rendering logic**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Upgrade `FollowUpTab.tsx` with premium UI, appointment filters, atomic visit logging, and responsive SVG clinical trendlines**
- [ ] **Step 4: Run tests to verify they pass**
- [ ] **Step 5: Commit:** `git commit -m "feat(step03): follow-up management workspace with clinical SVG trendlines and multi-visit comparison"`

---

### Task 6: Comparative Progress Report & Verifiable Clinician Approval (ComparativeProgressReportView.tsx)
**Files:**
- Modify: `src/components/reports/ComparativeProgressReportView.tsx`
- Modify: `src/context/PracticeContext.tsx` (`approveProgressReport`)
- Test: `test/step03_dashboard_followup.test.ts` (Scenarios 15, 16)

**Interfaces:**
- Consumes: `ComparativeProgressReport`, `validateClinicianCredentials`, `safeStorage`
- Produces: A4 print-ready layout (Sections A–L), page-break controls, bilingual typography, verifiable clinician approval with write-back persistence

- [ ] **Step 1: Write failing tests for report approval persistence, storage failure rollback, and A4 print layout contracts**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement atomic report approval in `PracticeContext.tsx` and refine `ComparativeProgressReportView.tsx` with A4 print styling and approval security**
- [ ] **Step 4: Run tests to verify they pass**
- [ ] **Step 5: Commit:** `git commit -m "feat(step03): A4 comparative clinical report with verifiable clinician approval and print styles"`

---

### Task 7: Playwright Real Browser E2E Acceptance Suite
**Files:**
- Create: `test/step03_browser_e2e.test.ts`

**Interfaces:**
- Consumes: Chromium browser via Playwright
- Produces: 18 verified E2E test flows matching Scenarios 1–18 (Dashboard navigation, appointment scheduling, rescheduling, consultation start, follow-up logging, reload recovery, comparison modes, report generation, approval)

- [ ] **Step 1: Write `test/step03_browser_e2e.test.ts`**
- [ ] **Step 2: Run Playwright suite and confirm all scenarios pass cleanly**
- [ ] **Step 3: Commit:** `git commit -m "test(step03): add Playwright browser E2E acceptance tests for dashboard, follow-up, and reports"`

---

### Task 8: Full Verification Pipeline & Independent Code Review
**Steps:**
- [ ] **Run `npm.cmd test`** (P0, P1, P2, Master, Step 01, Step 02, Step 03)
- [ ] **Run `npx.cmd tsc --noEmit`** (0 TypeScript errors)
- [ ] **Run `npm.cmd run build`** (Static export to `out/` succeeds)
- [ ] **Run `npx.cmd tsx test/step03_browser_e2e.test.ts`** (Browser acceptance green)
- [ ] **Dispatch independent code reviewer subagent** using Superpowers protocol
- [ ] **Address any critical/important findings**
- [ ] **Generate final artifact `shuddho_step03_final_report.md` and complete execution**
