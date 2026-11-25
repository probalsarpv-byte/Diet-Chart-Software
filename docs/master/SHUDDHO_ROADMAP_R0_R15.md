# SHUDDHO — Master Development Roadmap (R0 – R15)

**Document Code:** SHUDDHO-DOC-RDM-004  
**Version:** 1.0.0-R0  
**Phase Baseline:** R0 Architecture Baseline  
**Target Release Horizon:** 16 Controlled Phases (R0 through R15)  
**Governance Standard:** Progressive Verification & Zero Clinical Degradation  

---

## 1. Roadmap Architecture & Execution Philosophy

Project SHUDDHO executes across 16 disciplined, staged phases. Each phase has a strictly bounded scope, non-overlapping feature ownership, explicit dependencies, and automated QA acceptance gates.

```
+---------------------------------------------------------------------------------------------------------------+
|                                      SHUDDHO 16-PHASE MASTER TIMELINE                                         |
+------------------------------------+------------------------------------+-------------------------------------+
| FOUNDATION & CORE CLINICAL ENGINES | DATA, INTAKE & ADVANCED LOGIC      | PRACTICE, RESEARCH & FUTURE HORIZON |
| • R0: Master Architecture (LOCKED) | • R6: Advanced Functional AI (P2)  | • R11: Practice Portal & Teamwork   |
| • R1: Dual Report & PDF Studio     | • R7: Advanced Labs & Supplements  | • R12: Research & Outcome Analytics |
| • R2: Secure Backend, Auth & DB    | • R8: Food & Nutrient Knowledge    | • R13: Lab, Wearable & FHIR APIs    |
| • R3: Patient Self-Assessment      | • R9: Diet & Family Kitchen Budget | • R14: Future AI Layer (DEFERRED)   |
| • R4: Lifestyle & Chronotherapy    | • R10: Longitudinal Outcome Track  | • R15: Native iOS/Android (DEFERRED)|
| • R5: Master Prescription Composer |                                    |                                     |
+------------------------------------+------------------------------------+-------------------------------------+
```

---

## 2. Phase-by-Phase Roadmap Matrix (R0 – R15)

| Phase | Phase Name | Primary Feature IDs | Benchmark Inspiration | Dependencies | Priority | Status | Core Deliverables | Acceptance Criteria |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **R0** | **Master Architecture & Contracts** | **F01–F08** | ISO/IEC 25010 | None | P0 | **COMPLETED** | 10 Master Blueprint Docs, Live `/roadmap/` Route, E2E Acceptance | All 10 docs generated, 164 browser assertions pass, build exit 0. |
| **R1** | **Dual Report & PDF Studio** | **U20, U21** | That Clean Life | R0, F03, F05 | P0 | **COMPLETED** | Strict Clinician vs Patient PDF Exporters, Sanitization Filter | Patient PDF string search for "kcal" or "protein g" yields 0 matches. |
| **R2** | **Secure Backend, Auth & DB** | **U18** | Supabase, HIPAA | R0, R1 | P0 | **COMPLETED** | PostgreSQL Schema, Row-Level Security, Auth Service, DB Migration | Multi-tenant tenant isolation verified; localStorage migration automated. |
| **R3** | **Patient Self-Assessment Portal** | **U19** | Practice Better | R2, F02 | P1 | **COMPLETED** | Public Tokenized Intake Web Form, Clinician Staging Queue | Patient submission stages in review queue; does not alter active chart. |
| **R4** | **Lifestyle & Chronotherapy** | **U06** | Cerbo | R0, F07 | P1 | PLANNED | 24h Visual Chronotherapy Grid, Mineral-Thyroid Spacing Validator | Alerts overlap whenever iron/calcium scheduled <120m from levothyroxine. |
| **R5** | **Master Prescription Composer**| **U24** | That Clean Life | R1, R4 | P1 | PLANNED | Unified Multi-Component Prescription Hub (Diet, Supps, Lifestyle) | Combines diet, timing, hydration, and education handouts in single bundle. |
| **R6** | **Advanced Functional Intelligence**| **U01, U02, U03, U04, U05** | Etio, Biocanic | R0, F02 | P1 | PLANNED | Force-Directed Mechanism Graph, Conflict Matrix, Staging Engine | Resolves multi-morbidity conflicts (RED > YELLOW > GREEN) deterministically. |
| **R7** | **Advanced Labs & Supplements** | **U07** | Biocanic | R0, F07 | P1 | **COMPLETED (Engineering)** | Functional Biomarker Ratio Analyzer, Supplement Depletion Rules | TG/HDL ratio >3.0 flags functional insulin resistance warning. |
| **R8** | **Food & Nutrient Knowledge Base** | **U08, U11** | Nutrium | R0, F08 | P2 | **COMPLETED (Engineering)** | Nutrient-to-Mechanism Matrix, 1-Click Smart Food Substitution | Swapping 100g rice suggests bioequivalent items within ±20% macros with patient safety gating. |
| **R9** | **Precision Diet & Budget Plan**| **U09, U10, U12, U13** | Proprietary BD | R1, R8 | P2 | PLANNED | BDT Cost Tier Optimizer, Joint Family Kitchen Dual Recipe Cards | Generates low-cost local substitutions saving >50% cost with equal macros. |
| **R10**| **Longitudinal Follow-up** | **U15, U16, U17, U22** | Cronometer Pro | R0, F04 | P2 | PLANNED | Therapeutic Phase Progression, N-of-1 Challenge Tracker | Advancing Phase 1 to Phase 2 safely unlocks expanded food exchanges. |
| **R11**| **Practice Management & Portal** | **U25** | Practice Better | R2, R3 | P2 | PLANNED | Multi-Nutritionist RBAC, Template Marketplace, Calendar Service | Nutritionist can publish, share, and clone approved protocol templates. |
| **R12**| **Clinical Research & Analytics**| **U14, U23, U26** | Biocanic Research | R2, R10 | P3 | PLANNED | In-Silico Metabolic Twin, De-identified Cohort Research Engine | HIPAA-compliant de-identification exports cohort statistics to CSV/SPSS. |
| **R13**| **Lab, Wearable & External APIs**| *(External Connectors)*| HL7 / FHIR R4 | R2, R7 | P3 | PLANNED | FHIR DiagnosticReport Ingestion, CGM Telemetry Stream Parsers | Parses FHIR lab bundle and maps biomarkers to functional ranges cleanly. |
| **R14**| **Future AI Intelligence Layer** | **U27, U28, U29** | Passio, OpenAI | R2, R6, R8 | P3 | **DEFERRED** | Photo Meal Estimation, Bengali Speech Diary, Advisory Copilot | AI suggestions strictly staged as unapproved drafts requiring human sign-off. |
| **R15**| **Future Android/iOS Companion** | **U30** | Apple Health | R1, R2, R11 | P3 | **DEFERRED** | Native Swift & Kotlin Apps, Offline SQLite, Push Notifications | Patient mobile companion adheres strictly to U21 (Zero calories/macros). |

---

## 3. Phase Dependency Graph

```
[R0: Master Architecture & Foundation]
   │
   ├──────────────┐
   ▼              ▼
[R1: Dual Report] [R2: Backend & DB]
   │              │
   ├──────────────┼────────────────────────┐
   ▼              ▼                        ▼
[R5: Master Rx] [R3: Patient Portal]   [R4: Lifestyle & Timing]
   │              │                        │
   ├──────────────┴────────────────────────┘
   ▼
[R6: Advanced Clinical Intelligence (P2)]
   │
   ├──────────────┬────────────────────────┐
   ▼              ▼                        ▼
[R7: Labs & DNI] [R8: Food & Recipes]   [R10: Longitudinal Outcomes]
   │              │                        │
   ├──────────────┼────────────────────────┘
   ▼              ▼
[R9: Budget & Family Plan] [R11: Practice Portal]
   │              │
   ├──────────────┴────────────────────────┐
   ▼                                       ▼
[R12: Clinical Research]                [R13: Lab & Wearable APIs]
   │                                       │
   ├───────────────────────────────────────┘
   ▼
[R14: AI Intelligence Layer (DEFERRED)]
   │
   ▼
[R15: Native Android/iOS Apps (DEFERRED)]
```

---

## 4. Phase Verification Gates & Transition Rules

1. **Gate to Proceed from R0 to R1:**
   - 10 Master Blueprint Documents approved and version-controlled.
   - Live `/roadmap/` route compiled and verified in production export.
   - 100% pass rate across existing 164 E2E Playwright assertions and 12 referential integrity gates.
   - Successful GitHub Pages deployment.
2. **Cardinal Development Rule:**
   - No phase may alter existing clinical equations, reference ranges, or safety gates without explicit regression testing and formal architectural sign-off.
