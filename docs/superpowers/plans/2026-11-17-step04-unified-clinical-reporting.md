# Step 04 — Unified Clinical Reporting & Professional Export System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Overview

Step 04 consolidates the clinical reporting experience in SHUDDHO into a patient-safe, visit-specific, historically accurate, approval-controlled, professionally designed, and reliably printable A4 clinical report system.

This plan addresses:
1. **P2 Approval Callback Contract**: Fix `FunctionalNutritionReportProps.onApprove` and `ReportTab.tsx` to return the boolean approval result so UI reflects verified persistence without false failures.
2. **Patient & Visit-Specific Report Identity & Selector**: Add an authoritative report header in `ReportTab.tsx` with patient metadata, visit selector, report generation date, approval badge, draft/approved status indicator, and missing data warnings.
3. **Historical Report Isolation & Multi-Report Selection**: Enable viewing historical saved reports per visit, prevent cross-patient or cross-visit leakage, and allow browsing/selecting saved Comparative Progress Reports.
4. **Diet Prescription Fluid Restriction Safety Boundary**: Qualify the blanket 3.5L water recommendation when fluid restriction is present, displaying the prescribed fluid limit instead.
5. **Print Isolation & Clean A4 Styling**: Ensure only the active report prints (no hidden tab bleed-through or controls), with `@media print` page breaks, high-contrast clinical typography, and proper Bengali font rendering.
6. **Automated Unit, Integration, and Real Browser E2E Tests**: Implement comprehensive regression suites covering Scenarios A–O and Playwright browser acceptance flows.

---

## File Structure & Responsibilities

| File | Responsibility |
|---|---|
| `src/components/p2/FunctionalNutritionReport.tsx` | P2 Assessment Report view. Fix `onApprove?: (clinicianId: string, notes?: string) => boolean;` signature. |
| `src/components/tabs/ReportTab.tsx` | Main Reports Hub workspace. Add visit-specific report selector, patient identity bar, status badges, print isolation classes, fluid restriction guard, and return `approveP2Analysis` result. |
| `src/context/PracticeContext.tsx` | Practice state context. Ensure `selectVisit` / `loadPatient` rehydrates or isolates visit-specific P2 analysis and progress reports correctly without cross-patient contamination. |
| `src/types/index.ts` | Ensure report types support visit-specific linkage and metadata. |
| `test/step04_reporting_system.test.ts` | Focused Unit & Integration test suite covering Scenarios A–O. |
| `test/step04_browser_e2e.test.ts` | Real Chrome browser acceptance tests using Playwright. |
| `package.json` | Register `test:step04` and `test:step04:browser` test commands. |

---

## Tasks

### Package A: Report Identity, Selection & Approval Callback Contract

- [ ] **Task 1: Fix P2 Approval Callback Contract in `FunctionalNutritionReport.tsx` and `ReportTab.tsx`**
  - Update `FunctionalNutritionReportProps.onApprove` signature to return `boolean`.
  - In `ReportTab.tsx`, update `onApprove={(cId, notes) => approveP2Analysis(cId, notes)}` to propagate boolean return value.
  - In `ClinicalIntelligenceTab.tsx`, update `onApprove={(cId, notes) => approveP2Analysis(cId, notes)}`.
  - Verify that `approveP2Analysis` returns `true` on successful persistence and `false` on storage errors.

- [ ] **Task 2: Visit & Report Selection Architecture in `PracticeContext.tsx`**
  - Ensure `loadPatient` and `selectVisit` safely clear or rehydrate `p2AnalysisResult` matching the specific `patient.id` and `current_visit_id`.
  - Prevent Patient A's P2 analysis or progress report from persisting in state when switching to Patient B.
  - Add helper `selectProgressReport(reportId: string)` or ensure `currentProgressReport` can be selected from `progress_reports`.

### Package B: Clinical Data Accuracy & Safety Boundaries

- [ ] **Task 3: Diet Prescription Fluid Restriction Guard & Clinical Accuracy**
  - In `ReportTab.tsx`, inspect `patient.clinical_safety?.fluid_restriction` or `clinicalSafetyEvaluation`.
  - If fluid restriction is active (`is_restricted === true`), replace the blanket 3.5 L water guideline with the exact prescribed fluid limit (e.g., `Limit: 1200 mL/day`) and an advisory note.
  - Display explicit notice if allergy screening is unassessed or incomplete.

- [ ] **Task 4: Historical Report Integrity & Invalidation Metadata**
  - Ensure that an approved report retains its `isApproved`, `approvedBy`, `approvalDate`, and `sectionN_clinicianReview` metadata.
  - Display "Approved" vs "Draft / Provisional" vs "Stale / Invalidated" banner based on actual report data.

### Package C: Premium A4 Reporting Experience & Print Isolation

- [ ] **Task 5: Report Workspace UI Refinement & Visit Selector in `ReportTab.tsx`**
  - Add Clinical Patient Header with: Active Patient ID, Name, Selected Visit date & type, Report Revision, Status Badge (Approved / Draft / Stale).
  - Add Visit Selector dropdown allowing the clinician to view report for Visit 1 vs Visit 2.
  - For Comparative Reports, allow selecting which saved report to view or generating comparison for selected visit pairs.
  - Ensure responsive desktop and mobile layouts with clean padding.

- [ ] **Task 6: Strict Print Isolation & A4 Styles**
  - Ensure all non-print elements carry `no-print` / `print:hidden`.
  - Ensure only the currently active report container is visible during print (`hidden` or conditional rendering for non-selected report views so hidden tabs never leak into print).
  - Standardize `@media print` styling: white background, navy text, page-break safety (`break-inside: avoid`), table margins, clear headers/footers.

### Package D: Regression & Real Browser E2E Verification

- [ ] **Task 7: Step 04 Unit & Integration Test Suite (`test/step04_reporting_system.test.ts`)**
  - Implement Scenarios A–O:
    - Scenario A: Patient Isolation (Patient A vs Patient B reports never mix).
    - Scenario B: Visit-Specific Assessment (Visit 1 vs Visit 2 report display).
    - Scenario C: Structured Laboratory Report (authoritative 7.3% vs legacy).
    - Scenario D: Untested Biomarker (honest missing data, zero fabricated numbers).
    - Scenario E: P2 Approval Callback (truthful boolean return and status update).
    - Scenario F: Failed Approval (storage failure rollback and honest failure display).
    - Scenario G: Historical Report Integrity (no silent overwrite of approved reports).
    - Scenario H: Comparative Report (exact visit pair identification).
    - Scenario I: Missing Snapshot (comparison blocked with actionable error).
    - Scenario J: Draft vs Approved status display.
    - Scenario K: Bengali font and typography integrity.
    - Scenario L: Page break safety and table continuity.
    - Scenario M: Patient switching and back (isolated state).
    - Scenario N: Print isolation (active report only in output).
    - Scenario O: Safety hard stops and unassessed allergy protection.

- [ ] **Task 8: Step 04 Real Browser Playwright E2E Suite (`test/step04_browser_e2e.test.ts`)**
  - Flow 1: Registration → Assessment → P2 Analysis → Reports Hub → Review → Approval → Reload → Reopen matching report → Print preview verification.
  - Flow 2: Follow-Up → Generate Comparative Report → Reports Hub → Select Saved Comparative Report → Verify visit pair → Print preview verification.

- [ ] **Task 9: Full Master Regression & Build Verification**
  - Run `npm run test:step01`, `npm run test:step02`, `npm run test:step03`, `npm run test:step04`.
  - Run `npm test` (all suites).
  - Run `npm run test:e2e` (all browser suites).
  - Run `npx tsc --noEmit`.
  - Run `npm run build`.
  - Request independent Senior Healthcare Code Review.
