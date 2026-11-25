# SHUDDHO — Phase R7 Backlog (Non-Critical & Deferred Enhancements)

**Phase:** R7 — Advanced Laboratory & Supplement Intelligence  
**Date:** 2026-11-25  
**Scope:** Verified non-critical enhancements, external integrations, and post-R15 schema items intentionally kept out of the R7 critical safety closure commit.

---

## 1. Non-Critical Clinical UX & Reporting Enhancements
- **Rich SVG Sparkline / Longitudinal Multi-Visit Charting Panel:** Plot normalized lab trends interactively across 3+ visits inside `StepLaboratoryIntake.tsx` and `ClinicianReportView.tsx` (currently R7 computes normalized comparable deltas cleanly in tabular cards).
- **Lab Sheet OCR / HL7 FHIR Bundle Parser (Scheduled Phase R14):** Automated ingestion of diagnostic center PDF/HL7 lab sheets into staged `imported_unreconciled` `StructuredLabEntry` queues for clinician confirmation.
- **Per-Drug Interactive CYP450 / P-gp Herbal Interaction Matrix:** Expand static contraindication tags into structured phytochemical CYP induction/inhibition warnings (e.g., St. John's Wort, high-dose Berberine CYP3A4/CYP2D6 interactions).

## 2. Pharmaceutical & Supplement Brand Governance (External / Post-MVP)
- **Live DGDA Registry Synchronization:** Connect an authenticated Bangladesh DGDA medicinal & nutraceutical verification feed to populate documentary `product_identity_verified`, `formulation_verified`, and `regulatory_status: 'registered_dgda'` metadata cleanly without static catalog assumptions.

## 3. Deferred Database Schema Additions (Post-R15 Only)
Per [DEFERRED_DEPLOYMENT_MANIFEST.md](../database/DEFERRED_DEPLOYMENT_MANIFEST.md), production PostgreSQL / Supabase DDL remains deferred until post-R15 authorization:
- `laboratory_observations` (normalized canonical values, `original_value`/`original_unit`, provenance, `supersedes_observation_id`, visit scoping).
- `supplement_protocol_ingredients` & `supplement_ul_audit_events` tables tied to `r4_lifestyle_plans` versioning.
