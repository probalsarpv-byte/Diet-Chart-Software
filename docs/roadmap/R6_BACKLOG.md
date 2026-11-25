# SHUDDHO — R6 Master Prescription Composer Backlog

This document captures verified non-critical backlog items and future enhancements deferred post-R6 to maintain strict release gating and zero-defect focus.

## 1. Non-Critical UX & UI Enhancements (P2/P3)
- **Interactive Drag-and-Drop Meal Sequence:** Allow clinicians to dynamically reorder meal time slots on the fly with live collision recalculation.
- **Visual Plate Diagram Widget:** Optional SVG plate proportion graphic (1/2 non-starchy vegetables, 1/4 protein, 1/4 low-GI whole grains) rendered alongside the Food Exchange Guide.
- **Custom QR Code Prescription Verification:** Generate an encrypted cryptographic QR code on the patient printout that links to the patient's verified digital portal view.
- **Historical Visit R4 Snapshot Archive Coupling (R7 Candidate):** Persist immutable per-visit `r4_protocol` snapshots directly inside `ClinicalVisitSnapshot` during visit capture so retrospective multi-visit reports always surface point-in-time R4 supplement approvals alongside medications and diet charts.

## 2. Hardware & External Integrations (Deferred Post-R15)
- **BLE Bluetooth Food Scale Integration:** Direct live weight capture from smart kitchen scales into the portion guide.
- **Continuous Glucose Monitor (CGM) Streaming API:** Live telemetry ingestion from Dexcom/Abbott FreeStyle Libre cloud endpoints into the Fasting Safety Evaluator.

## 3. Database & Distributed Architecture (Strictly Deferred Post-R15)
- **Production Supabase RPC Migrations:** Atomic prescription release stored procedures and historical audit event ledger triggers remain scheduled post-R15 per project database policy.
