# SHUDDHO — Master Feature Registry & Traceability Matrix

**Registry Code:** SHUDDHO-REG-MFR-002  
**Version:** 1.0.0-R0  
**Phase:** R0 Baseline  
**Total Features Registered:** 38 (8 Foundational + 30 Unique Clinical Capabilities)  
**Ownership Rule:** Every feature has exactly one primary implementation phase owner.  

---

## 1. Registry Taxonomy & Status Legend

- **IMPLEMENTED:** Fully authored in TypeScript, tested via unit/E2E suites, and actively running in the current application.
- **PARTIALLY IMPLEMENTED:** Core data structures, schemas, or calculation engines exist in code, but user interface, persistence, or advanced workflows remain to be finalized in a designated roadmap phase.
- **PLANNED:** Fully specified with input/output contracts, UI wireframes, and clinical safety bounds; slated for implementation in a target release (R1–R13).
- **FUTURE:** Long-term strategic capability with defined architecture interfaces; implementation deferred to AI (R14) or Native Mobile (R15).
- **EXCLUDED:** Explicitly out of scope (e.g. inpatient hospital EHR, insurance claims).

---

## 2. Foundational Core Engines (F01 – F08)

### [F01] Deterministic Clinical Safety Engine
- **Description:** Central rule-based gatekeeper evaluating energy floors, allergy hard blocks, renal protein clamps, and absolute contraindications with zero AI hallucination.
- **Benchmark / Inspiration:** Custom clinical governance standard; hospital clinical safety guidelines.
- **Primary Phase Owner:** **R0** (Maintained across all phases)
- **Dependencies:** None
- **Current Status:** `IMPLEMENTED` (`src/clinical-safety/`)
- **Input Data:** Patient anthropometrics, allergies, medications, clinical pathways, proposed meal plan.
- **Output Data:** `SafetyEvaluationResult` (status: `HARD_STOP`, `ADVISORY`, or `CLEARED`, citations, stop reasons).
- **Clinical Safety Considerations:** Allergies and feeding routes (NPO) are non-overridable hard stops.
- **Required UI:** Amber warning banners, red modal alerts, blocked sign-off buttons.
- **Acceptance Criteria:** 100% pass rate across clinical unit tests (`p0_clinical_safety.test.ts`).
- **Future Integration:** Real-time webhook gatekeeper for external automated diet generators.

### [F02] Adaptive 14-Domain Functional Assessment Engine
- **Description:** Comprehensive functional medicine questionnaire evaluating 7 physiological domains, medical history, chronobiology, and Ayurvedic Agni/Prakriti/Vikriti.
- **Benchmark / Inspiration:** Institute for Functional Medicine (IFM) Matrix Questionnaire; Charaka Samhita.
- **Primary Phase Owner:** **R0** (Engine implemented, remote web portal in R3)
- **Dependencies:** F01
- **Current Status:** `IMPLEMENTED` (`src/engine/assessment/`, `src/components/tabs/AssessmentTab.tsx`)
- **Input Data:** Clinician observations, patient answers, symptom severity (0–3 scale).
- **Output Data:** Domain severity scores, dosha balances, metabolic flags, P2 handoff payload.
- **Clinical Safety Considerations:** Flags acute red-flag symptoms (severe chest pain, sudden dyspnea) immediately.
- **Required UI:** 14-domain stepper wizard with progress indicators and real-time clinical snapshot rail.
- **Acceptance Criteria:** All 14 domains persist to localStorage and hydrate without schema corruption.
- **Future Integration:** Direct sync with R3 patient remote submission portal.

### [F03] 7-Day Cyclical Precision Diet Planning Studio
- **Description:** Asymmetric 8:4 studio layout allowing clinicians to formulate, fine-tune, and verify daily meal plans with real-time Atwater macro balancing.
- **Benchmark / Inspiration:** Nutrium, That Clean Life.
- **Primary Phase Owner:** **R0** (Studio UI & local calculations implemented; dual report in R1, cloud sync in R2)
- **Dependencies:** F01, F08
- **Current Status:** `IMPLEMENTED` (`src/components/tabs/DietChartTab.tsx`, `src/engine/weeklyPlanner.ts`)
- **Input Data:** Target calories, macro ratios, patient allergies, food database items, day selections.
- **Output Data:** Structured 7-day plan with meal times, gram weights, macro actuals, and variance alerts.
- **Clinical Safety Considerations:** Live BMR floor clamp; glycemic load and PRAL renal safety monitoring.
- **Required UI:** 8-column main meal editor with day tabs + 4-column sticky live inspector rail.
- **Acceptance Criteria:** Sum of meal calories matches daily total within 1 kcal precision; zero duplicate items.
- **Future Integration:** R9 family kitchen scaling and R1 dual report exporter.

### [F04] Longitudinal Comparison & Multi-Mode Analytics
- **Description:** Multi-visit trendline engine comparing baseline, previous, and selected consultations across anthropometrics, blood markers, and symptom scores.
- **Benchmark / Inspiration:** Cronometer Pro, Cerbo.
- **Primary Phase Owner:** **R0** (Core trendlines implemented; advanced multi-cohort in R10)
- **Dependencies:** F01, F06
- **Current Status:** `IMPLEMENTED` (`src/engine/longitudinal/comparisonEngine.ts`, `src/components/tabs/FollowUpTab.tsx`)
- **Input Data:** Array of historical clinical visit snapshots for an active patient.
- **Output Data:** Delta calculations (absolute & percentage change), SVG responsive trendline charts.
- **Clinical Safety Considerations:** Alerts if weight loss exceeds safe threshold (>1.5 kg/week without supervision).
- **Required UI:** 4 comparison modes (A: Baseline vs Current, B: Prev vs Current, C: Selected vs Selected, D: Multi-visit SVG).
- **Acceptance Criteria:** Correctly maps dates and values without data cross-contamination between patient IDs.
- **Future Integration:** R12 clinical outcomes research database.

### [F05] Clinician A4 Reporting & Approval Governance Hub
- **Description:** Formal clinical review and sign-off environment verifying document approval, practitioner credentials, and legal disclaimer tracking.
- **Benchmark / Inspiration:** That Clean Life, Cerbo.
- **Primary Phase Owner:** **R0** (Clinician review implemented; dual patient/clinician split in R1)
- **Dependencies:** F01, F03
- **Current Status:** `IMPLEMENTED` (`src/components/tabs/ReportTab.tsx`, `src/engine/p2/clinicalReportBuilder.ts`)
- **Input Data:** Patient clinical dossier, diet plan, P2 intelligence report, practitioner ID.
- **Output Data:** Timestamped approval metadata, printable A4 clinical summary view.
- **Clinical Safety Considerations:** Blocks approval if unverified clinical warnings or hard stops remain active.
- **Required UI:** A4 letterhead container, sign-off credentials modal, approval badge tracker.
- **Acceptance Criteria:** Rejects approval when generic placeholder clinician ID is provided.
- **Future Integration:** Cryptographic digital signatures and PDF generation in R1.

### [F06] Patient Registry & Sticky Clinical Dossier
- **Description:** Central patient census management featuring high-density searchable directory and sticky clinical dossier with chronological visit timeline.
- **Benchmark / Inspiration:** Practice Better, Cerbo.
- **Primary Phase Owner:** **R0** (Local census implemented; cloud multi-tenant DB in R2)
- **Dependencies:** None
- **Current Status:** `IMPLEMENTED` (`src/components/tabs/PatientsTab.tsx`)
- **Input Data:** Patient demographics, contact info, clinical pathway, visit history.
- **Output Data:** Active patient state, filterable patient directory, visit timeline.
- **Clinical Safety Considerations:** Strict isolation between patients; zero data leakage during switching.
- **Required UI:** Asymmetric 7:5 split (7-col searchable directory table + 5-col sticky dossier).
- **Acceptance Criteria:** Switching patients cleanly rehydrates active context across all tabs.
- **Future Integration:** R2 multi-nutritionist team access control and RBAC.

### [F07] Medication & Allergy Reconciliation Suite
- **Description:** Structured reconciliation interface capturing brand/generic pharmaceutical names, dosage, frequency, meal relationships, and confirmed allergen severity.
- **Benchmark / Inspiration:** Cerbo, Epic Systems Reconciliation.
- **Primary Phase Owner:** **R0** (Reconciliation UI & rules implemented; FHIR ingestion in R13)
- **Dependencies:** F01, F08
- **Current Status:** `IMPLEMENTED` (`src/components/reconciliation/`, `src/engine/medicationSearch.ts`)
- **Input Data:** 32,461 DGDA brand index, clinician verified dose and meal timing.
- **Output Data:** Structured `MedicationRecord[]` and `AllergyRecord[]`.
- **Clinical Safety Considerations:** Confirmed allergies permanently lock food items from inclusion in diet plans.
- **Required UI:** Dedicated modal editors with real-time brand-to-generic resolution.
- **Acceptance Criteria:** Brand searches resolve to canonical generic names within <50ms.
- **Future Integration:** Electronic medical record import via HL7/FHIR in R13.

### [F08] Bangladesh Food Composition Database (FCTB V6)
- **Description:** Curated nutritional database of 381 indigenous Bangladeshi food items with macronutrients, minerals, PRAL, glycemic load, purines, and oxalates.
- **Benchmark / Inspiration:** FAO/INFOODS, Institute of Nutrition and Food Science (INFS) Dhaka University.
- **Primary Phase Owner:** **R0** (Static dataset implemented; dynamic cloud library in R8)
- **Dependencies:** None
- **Current Status:** `IMPLEMENTED` (`src/data/foods.json`, `src/engine/mealScaler.ts`)
- **Input Data:** Raw food items, cooked-to-raw yield factors, edible portion coefficients.
- **Output Data:** Normalized 100g nutritional vectors and portion calculation scalars.
- **Clinical Safety Considerations:** Strict preservation of null (unmeasured) vs 0 (true zero) nutrients.
- **Required UI:** Searchable food picker with category filters and Bengali/English search.
- **Acceptance Criteria:** All 381 items pass referential integrity and Atwater macro bounds audits.
- **Future Integration:** Community recipe contributions and vendor pricing in R8.

---

## 3. Unique Clinical Capabilities (U01 – U30)

### [U01] Functional Root-Cause Explorer
- **Description:** Interactive graph explorer tracing clinical symptoms to underlying physiological dysfunctions (e.g., gut permeability, mitochondrial fatigue, insulin resistance).
- **Benchmark / Inspiration:** Etio, Biocanic.
- **Primary Phase Owner:** **R6** (Advanced Clinical Intelligence)
- **Dependencies:** F02, F06
- **Current Status:** `PARTIALLY IMPLEMENTED` (Underlying `hypothesisEngine.ts` exists; visual graph UI planned for R6)
- **Input Data:** 14-domain assessment symptom vector, laboratory biomarkers.
- **Output Data:** Prioritized list of root-cause drivers with biological confidence scores.
- **Clinical Safety Considerations:** Clearly demarcates functional hypotheses from formal diagnostic conclusions.
- **Required UI:** Interactive force-directed node-link graph with domain clustering.
- **Acceptance Criteria:** Clicking a symptom highlights connected upstream mechanisms and downstream consequences.
- **Future Integration:** Feeds diagnostic rationale directly into R5 Master Prescription Composer.

### [U02] Disease-Mechanism Knowledge Graph
- **Description:** Structured biomedical knowledge graph linking 21 registered conditions, 50+ biological mechanisms, and therapeutic dietary targets.
- **Benchmark / Inspiration:** Etio, Reactome, KEGG.
- **Primary Phase Owner:** **R6** (Advanced Clinical Intelligence)
- **Dependencies:** U01
- **Current Status:** `PARTIALLY IMPLEMENTED` (`src/engine/diseaseRules.ts` contains clinical rules; full relational graph in R6)
- **Input Data:** Disease IDs, inflammatory pathways, metabolic phenotypes.
- **Output Data:** Mechanism activation states (e.g., NF-κB upregulation, mTOR overactivation).
- **Clinical Safety Considerations:** Validated against peer-reviewed clinical pathophysiology literature.
- **Required UI:** Mechanism breakdown drawer with pathway diagrams and evidence links.
- **Acceptance Criteria:** Every disease maps to at least 2 discrete cellular/systemic mechanisms.
- **Future Integration:** Semantic querying and R14 AI Copilot grounding.

### [U03] Multi-Disease Conflict Resolver
- **Description:** Algorithmic arbitration engine resolving contradictory nutritional prescriptions for comorbid patients (e.g., CKD Stage 3b + Gout + Type 2 Diabetes).
- **Benchmark / Inspiration:** Proprietary SHUDDHO Innovation (No commercial platform resolves this deterministically).
- **Primary Phase Owner:** **R6** (Advanced Clinical Intelligence)
- **Dependencies:** F01, U02
- **Current Status:** `IMPLEMENTED` (`src/engine/conflictResolver.ts` enforces RED > YELLOW > GREEN hierarchy)
- **Input Data:** Set of active patient condition IDs and clinical pathway profiles.
- **Output Data:** Unified, non-contradictory food categorization vector and clamped macro boundaries.
- **Clinical Safety Considerations:** Strict hierarchy: Renal/Allergy/Cardiac safety always overrides metabolic optimization.
- **Required UI:** Conflict resolution matrix highlighting resolved contradictory rules and reasons.
- **Acceptance Criteria:** When Gout (high purine = RED) meets T2D (lentils = GREEN), final classification is strictly RED.
- **Future Integration:** Cloud-synchronized condition rule editor in R6.

### [U04] Clinical Evidence Passport
- **Description:** Traceability drawer attached to every automated suggestion displaying clinical rationale, PubMed PMIDs, and evidence grading.
- **Benchmark / Inspiration:** Etio, UpToDate.
- **Primary Phase Owner:** **R6** (Advanced Clinical Intelligence)
- **Dependencies:** U02
- **Current Status:** `PARTIALLY IMPLEMENTED` (`evidenceAggregator.ts` exists; evidence drawer UI in R6)
- **Input Data:** Selected intervention or food tag recommendation.
- **Output Data:** Evidence card: Study design, sample size, primary outcome, evidence tier (1–4), PubMed DOI.
- **Clinical Safety Considerations:** Flags weak/emerging evidence distinctly from established clinical guidelines.
- **Required UI:** Slide-out evidence passport drawer with clickable citation badges.
- **Acceptance Criteria:** Every clinical hypothesis links to at least 1 citable reference.
- **Future Integration:** Automated literature link updater in R12.

### [U05] Disease Stage and Phenotype Engine
- **Description:** Sub-phenotyping engine calibrating nutritional interventions based on disease staging (e.g., CKD Stages 1 vs 3b vs 5; Pre-diabetes vs LADA vs Long-standing T2D).
- **Benchmark / Inspiration:** Biocanic, KDIGO Clinical Practice Guidelines.
- **Primary Phase Owner:** **R6** (Advanced Clinical Intelligence)
- **Dependencies:** F01, U03
- **Current Status:** `IMPLEMENTED` (`diseaseRules.ts` provides stage-specific rules for CKD and diabetes)
- **Input Data:** eGFR, fasting insulin, C-peptide, disease duration, clinical staging.
- **Output Data:** Staged clinical constraints (e.g., CKD 3b protein capped at 0.6–0.8 g/kg; CKD 5 without dialysis 0.6 g/kg).
- **Clinical Safety Considerations:** Prevents catastrophic high-protein or high-potassium prescriptions in advanced renal failure.
- **Required UI:** Phenotype selector badge with stage-calibrated constraint summary.
- **Acceptance Criteria:** Changing CKD stage from 2 to 3b immediately clamps protein target and flags high-potassium foods.
- **Future Integration:** Automated stage suggestion based on R7 laboratory intake.

### [U06] Medication-Supplement-Meal Timeline (Chronotherapy)
- **Description:** 24-hour visual chronotherapy schedule coordinating meal times, prescription drug administration, and nutraceutical supplementation to prevent absorption competition.
- **Benchmark / Inspiration:** Cerbo, Chrono-nutrition clinical research.
- **Primary Phase Owner:** **R4** (Lifestyle, Supplement & Timing Intelligence)
- **Dependencies:** F07, R7 (DNI Engine)
- **Current Status:** `IMPLEMENTED` (`src/components/tabs/DNITab.tsx`, `src/clinical-safety/mealTimingEngine.ts`)
- **Input Data:** Active medications, prescribed supplements, planned meal windows.
- **Output Data:** Continuous 24-hour visual timeline showing scheduled intake times and separation intervals.
- **Clinical Safety Considerations:** Enforces mandatory 2-hour separation between divalent minerals (iron, calcium) and Levothyroxine/Ciprofloxacin.
- **Required UI:** Interactive chronotherapy timeline bar with conflict warning callouts.
- **Acceptance Criteria:** Flags overlap whenever calcium supplement is scheduled within 120 minutes of thyroid medication.
- **Future Integration:** Patient smartphone push notifications in R15.

### [U07] Functional Biomarker Pattern Intelligence
- **Description:** Multi-marker pattern analyzer recognizing sub-clinical functional dysfunctions before conventional pathology thresholds are breached (e.g., HOMA-IR, Triglyceride/HDL ratio, De Ritis ratio).
- **Benchmark / Inspiration:** Biocanic, Etio.
- **Primary Phase Owner:** **R7** (Advanced Lab & Supplement Intelligence)
- **Dependencies:** F02
- **Current Status:** `IMPLEMENTED` (`src/engine/labAnalyzer.ts` evaluates functional ranges and ratios)
- **Input Data:** Fasting glucose, fasting insulin, lipid profile, liver transaminases, hs-CRP.
- **Output Data:** Functional pattern alerts (e.g., "Sub-clinical Insulin Resistance", "Atherogenic Dyslipidemia").
- **Clinical Safety Considerations:** Emphasizes that functional ranges are for nutritional optimization, not formal disease diagnosis.
- **Required UI:** Dual-gauge biomarker cards displaying standard reference ranges vs optimal functional zones.
- **Acceptance Criteria:** Triglyceride/HDL ratio > 3.0 triggers functional insulin resistance warning even if fasting glucose is normal.
- **Future Integration:** Automated direct lab API import in R13.

### [U08] Nutrient-Mechanism-Food Mapping
- **Description:** Bidirectional translation matrix connecting therapeutic nutrients (e.g., Sulforaphane, Quercetin, EPA/DHA) to cellular mechanisms and native Bangladeshi whole-food sources.
- **Benchmark / Inspiration:** That Clean Life, Nutrium.
- **Primary Phase Owner:** **R8** (Food, Nutrient & Recipe Knowledge Base)
- **Dependencies:** F08, U02
- **Current Status:** `PARTIALLY IMPLEMENTED` (Nutrient tags exist in `foods.json`; visual translation map in R8)
- **Input Data:** Therapeutic mechanism target (e.g., Nrf2 activation, Sirt1 stimulation).
- **Output Data:** List of local foods richest in required bioactive compounds with edible yield calculations.
- **Clinical Safety Considerations:** Cross-references patient allergies and disease contraindications before suggesting foods.
- **Required UI:** Food-to-Mechanism interactive lookup matrix and recipe tagger.
- **Acceptance Criteria:** Querying "Anti-inflammatory / COX-2 inhibition" yields turmeric (curcumin), ginger, and local fatty fish.
- **Future Integration:** Automated recipe generation in R8.

### [U09] Bangladesh Nutrition Affordability Optimizer
- **Description:** Algorithmic diet cost optimizer substituting expensive imported functional foods with high-density, low-cost native alternatives (e.g., replacing salmon/chia with local Mola/Pabda and flaxseeds/tishi).
- **Benchmark / Inspiration:** Proprietary SHUDDHO Innovation (Bangladesh Public Health Context).
- **Primary Phase Owner:** **R9** (Precision Diet Optimization & Budget Planning)
- **Dependencies:** F03, F08
- **Current Status:** `PLANNED` (Targeted for R9 implementation)
- **Input Data:** Daily patient budget tier (e.g., <200 BDT/day, 200–500 BDT/day, premium), target nutritional profile.
- **Output Data:** Cost-optimized meal plan meeting 100% of macro/micronutrient constraints at minimum cost.
- **Clinical Safety Considerations:** Ensures affordable substitutions do not compromise protein quality or renal electrolytes.
- **Required UI:** Cost tier toggle and daily estimated cost calculator in BDT.
- **Acceptance Criteria:** Swapping imported olive oil/almonds for local mustard oil/peanuts reduces cost by >60% while maintaining EFA profile.
- **Future Integration:** Integration with Dhaka Department of Agricultural Marketing real-time price feeds.

### [U10] Family Kitchen Optimizer
- **Description:** Multi-portion meal planning tool that designs a unified household core menu with specific patient modifications, minimizing separate cooking in joint families.
- **Benchmark / Inspiration:** That Clean Life (Family meal planning adapted for South Asian joint families).
- **Primary Phase Owner:** **R9** (Precision Diet Optimization & Family Kitchen Planning)
- **Dependencies:** F03, U09
- **Current Status:** `PLANNED` (Targeted for R9 implementation)
- **Input Data:** Household member count, patient restrictions, family staple preferences.
- **Output Data:** Base family recipe instructions with separate patient portion modification notes (e.g., "Add salt and oil after removing patient portion").
- **Clinical Safety Considerations:** Eliminates cross-contamination risks for family members with severe celiac or peanut allergies.
- **Required UI:** Family kitchen recipe card with dual instructions (Family Pot vs Patient Dish).
- **Acceptance Criteria:** Generates a unified family curry recipe with step-by-step patient sodium/spice extraction guidance.
- **Future Integration:** Grocery list aggregator across entire family unit in R9.

### [U11] Intelligent Food Substitution Engine
- **Description:** 1-click alternative selector recommending biologically equivalent food swaps matched for macronutrient density, glycemic index, and clinical safety tags.
- **Benchmark / Inspiration:** Nutrium, That Clean Life.
- **Primary Phase Owner:** **R8** (Food, Nutrient & Recipe Knowledge Base)
- **Dependencies:** F01, F08
- **Current Status:** `IMPLEMENTED` (`src/components/tabs/DietChartTab.tsx` alternative swap modal)
- **Input Data:** Target meal item to replace, patient condition profile, calorie/carb ceiling.
- **Output Data:** Ranked list of verified alternative foods within ±10% macro variance.
- **Clinical Safety Considerations:** Filter strictly suppresses any candidate item marked RED in the active safety matrix.
- **Required UI:** Quick-swap modal showing variance deltas and safety match indicators.
- **Acceptance Criteria:** Swapping rice (100g) suggests equal-carb portions of oats or brown atta without violating active restrictions.
- **Future Integration:** AI-enhanced seasonal substitution suggestions in R14.

### [U12] Smart Grocery and Meal Preparation Planner
- **Description:** Automated weekly grocery aggregator consolidating 7-day meal plans into raw market weights, categorized by local bazaar sections (কাঁচাবাজার, মাছের বাজার, মুদি).
- **Benchmark / Inspiration:** That Clean Life, Practice Better.
- **Primary Phase Owner:** **R9** (Precision Diet Optimization & Grocery Planning)
- **Dependencies:** F03, F08
- **Current Status:** `PLANNED` (Targeted for R9 implementation)
- **Input Data:** Approved 7-day diet plan, household size scalar.
- **Output Data:** Consolidated grocery list with raw purchase weights and weekly batch-prep timeline.
- **Clinical Safety Considerations:** Incorporates raw-to-cooked yield factors to prevent caloric under-purchasing.
- **Required UI:** Printable & mobile-friendly grocery checklist organized by wet market departments.
- **Acceptance Criteria:** Accurately converts cooked chicken/fish grams to raw market purchase kg using edible portion factors.
- **Future Integration:** Export to WhatsApp and local grocery delivery platforms in R11/R15.

### [U13] Nutrition What-If Simulator
- **Description:** Interactive sandbox allowing clinicians to manipulate macronutrient ratios, fasting windows, or food exchanges and preview real-time metabolic and safety consequences.
- **Benchmark / Inspiration:** Cronometer Pro, Etio.
- **Primary Phase Owner:** **R9** (Precision Diet Optimization & What-If Simulator)
- **Dependencies:** F01, F03
- **Current Status:** `PARTIALLY IMPLEMENTED` (`DietChartTab.tsx` recalculates live on gram change; full sandbox mode in R9)
- **Input Data:** Experimental calorie/macro targets, simulated food additions.
- **Output Data:** Real-time delta previews: Predicted glycemic load, PRAL shift, BMR floor proximity, potential safety alerts.
- **Clinical Safety Considerations:** Clear visual banner indicating that the workspace is in simulation mode and unapproved.
- **Required UI:** Dual-pane simulator slider with "Apply to Plan" and "Discard Simulation" controls.
- **Acceptance Criteria:** Slashing carbs by 50% immediately displays ketone advisory and fluid balance alerts.
- **Future Integration:** Feeds predictive modeling into U14 Digital Twin.

### [U14] Clinical Digital Twin Scenario Model
- **Description:** In-silico metabolic scenario simulator modeling anticipated patient weight trajectory, glycemic stability, and renal load over 4–12 weeks.
- **Benchmark / Inspiration:** Etio, Hall NIH Mathematical Model for Human Metabolism.
- **Primary Phase Owner:** **R12** (Clinical Research & Outcome Analytics)
- **Dependencies:** F04, U13
- **Current Status:** `PLANNED` (Targeted for R12 implementation)
- **Input Data:** Patient baseline anthropometrics, body fat %, planned caloric deficit, metabolic adaptation factor.
- **Output Data:** Multi-week projection curve (Weight, Fat Mass, Lean Mass, Resting Energy Expenditure decline).
- **Clinical Safety Considerations:** Prevents unrealistic weight loss projections; models adaptive thermogenesis dampening.
- **Required UI:** Forecast trendline chart with confidence interval boundaries.
- **Acceptance Criteria:** Accurately models non-linear weight loss slowdown due to metabolic adaptation over 12 weeks.
- **Future Integration:** Model calibration using real CGM and wearable inputs in R13.

### [U15] N-of-1 Nutrition Response Tracker
- **Description:** Single-subject clinical trial engine tracking patient-specific biological responses to deliberate dietary eliminations and reintroductions (e.g., gluten, dairy, FODMAPs).
- **Benchmark / Inspiration:** Biocanic, IFM Food Elimination Protocols.
- **Primary Phase Owner:** **R10** (Longitudinal Follow-up & Outcome Tracking)
- **Dependencies:** F02, F04
- **Current Status:** `PLANNED` (Targeted for R10 implementation)
- **Input Data:** Elimination phase timeline, food challenge dates, structured symptom reaction logs.
- **Output Data:** Statistical correlation between reintroduced food items and symptom exacerbations.
- **Clinical Safety Considerations:** Immediate protocol cessation rule if acute allergic or inflammatory reactions emerge.
- **Required UI:** Food challenge calendar and symptom correlation matrix.
- **Acceptance Criteria:** Identifies statistically significant symptom spikes within 48 hours of specific food challenges.
- **Future Integration:** Patient self-logging via R15 mobile app.

### [U16] Therapeutic Protocol Phase Manager
- **Description:** Staged protocol progression engine guiding patients through therapeutic phases (e.g., Phase 1: Elimination/Gut Reset, Phase 2: Repair/Reinoculation, Phase 3: Long-term Maintenance).
- **Benchmark / Inspiration:** Biocanic, OptiMantra.
- **Primary Phase Owner:** **R10** (Longitudinal Follow-up & Phase Manager)
- **Dependencies:** F01, F03, F06
- **Current Status:** `IMPLEMENTED` (`src/engine/phaseProgression.ts`, `patient.current_phase` tracking)
- **Input Data:** Active therapeutic phase, clinical milestone completion checklist, visit duration.
- **Output Data:** Phase status, phase-specific diet constraints, phase advancement eligibility badge.
- **Clinical Safety Considerations:** Blocks premature phase advancement if baseline symptoms or inflammatory markers remain unmanaged.
- **Required UI:** Phase progression stepper bar in patient context banner and follow-up workspace.
- **Acceptance Criteria:** Advancing to Phase 2 automatically updates available food exchanges and unlocks repair supplements.
- **Future Integration:** Automated patient notification of phase transition in R11.

### [U17] Smart Reassessment Trigger
- **Description:** Automated alert engine notifying practitioners when patient follow-up intervals, lab expirations, or stagnation rules require a new assessment.
- **Benchmark / Inspiration:** Practice Better, Cerbo.
- **Primary Phase Owner:** **R10** (Longitudinal Follow-up & Practice Automation)
- **Dependencies:** F04, F06
- **Current Status:** `IMPLEMENTED` (`src/components/tabs/DashboardTab.tsx` follow-up queue and overdue badges)
- **Input Data:** Last consultation date, scheduled follow-up date, HbA1c/lipid lab testing dates.
- **Output Data:** Actionable clinical tasks (e.g., "HbA1c test expired (>90 days)", "Follow-up overdue by 7 days").
- **Clinical Safety Considerations:** Ensures high-risk patients on insulin or diuretics are not lost to follow-up.
- **Required UI:** Executive dashboard task queue with direct "Schedule Follow-up" launcher.
- **Acceptance Criteria:** Overdue appointments highlight in high-contrast amber/rose badges across dashboard.
- **Future Integration:** Automated SMS/WhatsApp appointment reminders in R11.

### [U18] Explainable Prescription and Decision History
- **Description:** Comprehensive, chronological audit log capturing every clinical choice, manual gram edit, rule override, and clinician sign-off with permanent provenance.
- **Benchmark / Inspiration:** Cerbo, 21 CFR Part 11 Audit Trail Guidelines.
- **Primary Phase Owner:** **R2** (Secure Backend & Audit Architecture)
- **Dependencies:** F05
- **Current Status:** `IMPLEMENTED` (`src/repositories/SupabasePracticeRepository.ts`, `src/components/audit/AuditHistoryModal.tsx`, `src/components/migration/DataMigrationWizard.tsx`)
- **Input Data:** Clinician user ID, timestamp, before/after state diff, justification rationale.
- **Output Data:** Immutable audit event stream viewable by practice supervisors.
- **Clinical Safety Considerations:** Critical for medico-legal liability and peer clinical review.
- **Required UI:** Audit trail drawer with side-by-side revision comparisons and timestamp stamps.
- **Acceptance Criteria:** Any modification to an approved diet chart immediately logs an invalidation event.
- **Future Integration:** Cryptographic tamper-evident hash chaining in R2.

### [U19] Patient Self-Assessment Link and Approval
- **Description:** Secure web workflow generating tokenized patient intake links, allowing clients to fill out functional assessments from home, which stage in an approval queue before clinician acceptance.
- **Benchmark / Inspiration:** Practice Better, OptiMantra.
- **Primary Phase Owner:** **R3** (Patient Self-Assessment Portal)
- **Dependencies:** F02, R2 (Backend Auth & DB)
- **Current Status:** `IMPLEMENTED` (`src/app/intake/page.tsx`, `src/components/intake/PatientIntakeForm.tsx`, `src/components/intake/ClinicianInvitationModal.tsx`, `src/components/intake/IntakeReconciliationModal.tsx`, `src/repositories/LocalDemoRepository.ts`, `src/repositories/SupabasePracticeRepository.ts`)
- **Input Data:** Patient-submitted demographic, dietary, symptom, and lifestyle answers via public web portal.
- **Output Data:** Staged submission record with diff viewer comparing patient claims against clinical records.
- **Clinical Safety Considerations:** Patient-submitted medical claims cannot modify safety rules until vetted by clinician.
- **Required UI:** Public responsive intake form + Clinician Intake Review & Reconciliation Queue.
- **Acceptance Criteria:** Clinician can accept, reject, or edit individual submitted answers before merging into patient dossier.
- **Future Integration:** Direct mobile intake via R15.

### [U20] Nutritionist-Only Nutrient Analytics
- **Description:** Deep clinical nutrition analytical workbench reserved strictly for treating practitioners, calculating complex micronutrient sufficiency curves, amino acid scores, and bioavailability ratios.
- **Benchmark / Inspiration:** Cronometer Pro, Nutrium.
- **Primary Phase Owner:** **R1** (Dual Report & Analytics Studio)
- **Dependencies:** F03, F08
- **Current Status:** `IMPLEMENTED` (`src/engine/reports/dualReportEngine.ts`, `src/components/reports/ClinicianReportView.tsx`, `src/components/tabs/ReportTab.tsx` U20 Studio)
- **Input Data:** Full 7-day meal plan, detailed micronutrient vectors from FCTB.
- **Output Data:** DRI/RDA fulfillment percentages, Atwater distribution, sodium-potassium ratio, calcium-magnesium ratio.
- **Clinical Safety Considerations:** Provides clinicians with full biochemical depth to detect hidden micronutrient insufficiencies.
- **Required UI:** Sticky 4-column studio inspector rail and comprehensive clinician report view.
- **Acceptance Criteria:** Computes exact quotients for weekly averages without rounding distortion.
- **Future Integration:** Automated supplement recommendations based on nutrient deficits in R4.

### [U21] Patient-Safe Diet Chart Without Calories/Macros
- **Description:** Strict patient report projection rendering clear food items, meal times, portion sizes in household measures, and cooking instructions, **guaranteed to omit all calorie and macro figures**.
- **Benchmark / Inspiration:** Proprietary SHUDDHO Innovation (Clinical Psychology & Eating Disorder Prevention Standard).
- **Primary Phase Owner:** **R1** (Dual Report & PDF Studio)
- **Dependencies:** F03, F05
- **Current Status:** `IMPLEMENTED` (`src/engine/reports/dualReportEngine.ts`, `src/components/reports/PatientDietReportView.tsx`, `src/components/tabs/ReportTab.tsx` U21 Studio)
- **Input Data:** Approved clinician diet plan.
- **Output Data:** Sanitized patient PDF and web view containing zero numerical energy or macro tokens.
- **Clinical Safety Considerations:** Prevents patient obsession, anxiety, and dangerous self-adjustments.
- **Required UI:** Patient-facing print layout and mobile prescription card.
- **Acceptance Criteria:** Automated test asserts that string searches for "kcal", "calorie", "protein g", "carb g", "fat g" return zero matches in patient export.
- **Future Integration:** Interactive interactive patient mobile view in R15.

### [U22] Adaptive Follow-up Questionnaire
- **Description:** Dynamic, conditional follow-up questionnaire that shortens intake by only querying symptoms and markers identified as abnormal in previous visits.
- **Benchmark / Inspiration:** Practice Better, Etio.
- **Primary Phase Owner:** **R10** (Longitudinal Follow-up & Dynamic Questionnaires)
- **Dependencies:** F02, F04
- **Current Status:** `PLANNED` (Targeted for R10 implementation)
- **Input Data:** Historical visit symptom baseline, active clinical pathway.
- **Output Data:** Tailored 5-minute follow-up assessment form focusing on specific therapeutic targets.
- **Clinical Safety Considerations:** Always includes mandatory safety red-flag screening regardless of historical status.
- **Required UI:** Streamlined consultation check-in wizard.
- **Acceptance Criteria:** Reduces follow-up documentation time from 20 minutes to under 5 minutes for stable patients.
- **Future Integration:** Remote patient self-completion before follow-up consultation in R3/R15.

### [U23] Clinical Outcomes and Research Engine
- **Description:** Practice-wide analytics dashboard aggregating de-identified patient outcomes across clinical pathways to evaluate real-world therapeutic efficacy.
- **Benchmark / Inspiration:** Biocanic, Cerbo.
- **Primary Phase Owner:** **R12** (Clinical Research & Outcome Analytics)
- **Dependencies:** F04, R2 (Backend DB)
- **Current Status:** `PLANNED` (Targeted for R12 implementation)
- **Input Data:** Anonymized patient outcomes (e.g., HbA1c delta, weight change, symptom resolution).
- **Output Data:** Aggregated cohort statistics, Kaplan-Meier adherence curves, protocol efficacy rankings.
- **Clinical Safety Considerations:** Complete HIPAA/GDPR de-identification (Safe Harbor method); zero PHI exposure.
- **Required UI:** Practice research dashboard with cohort filtering by condition and phase.
- **Acceptance Criteria:** Calculates statistically sound mean deltas and response rates across condition cohorts.
- **Future Integration:** Export to standard clinical research formats (CSV, R, SPSS) in R12.

### [U24] Personalized Patient Education Library
- **Description:** Culturally tailored, bilingual patient educational handouts automatically attached to reports based on diagnosed conditions (e.g., "Managing Uric Acid with Local Foods", "Safe Cooking Oils in Bangladesh").
- **Benchmark / Inspiration:** That Clean Life, Practice Better.
- **Primary Phase Owner:** **R5** (Master Prescription Composer)
- **Dependencies:** F05
- **Current Status:** `PLANNED` (Targeted for R5 implementation)
- **Input Data:** Patient active conditions, education level preference, language (Bengali/English).
- **Output Data:** Illustrated, highly readable 1-page educational guides appended to patient report.
- **Clinical Safety Considerations:** Written at a 6th-grade reading level; reviewed by clinical dietitians.
- **Required UI:** Education asset selector in Master Prescription Composer.
- **Acceptance Criteria:** Prescribing a gout protocol automatically suggests attaching the "Low-Purine Bengali Eating Guide".
- **Future Integration:** Video snippet attachments for mobile app in R15.

### [U25] Nutritionist Protocol/Template Marketplace
- **Description:** Peer-to-peer repository allowing senior clinicians to publish, share, and clone evidence-based dietary templates (e.g., "Dhaka Gestational Diabetes 1600 kcal Protocol").
- **Benchmark / Inspiration:** That Clean Life, Practice Better.
- **Primary Phase Owner:** **R11** (Practice Management & Protocol Sharing)
- **Dependencies:** F03, R2 (Backend DB)
- **Current Status:** `PLANNED` (Targeted for R11 implementation)
- **Input Data:** Curated 7-day meal plan templates, clinical pathway metadata.
- **Output Data:** Versioned, reusable practice protocol templates.
- **Clinical Safety Considerations:** Shared templates must pass deterministic safety validation before publishing.
- **Required UI:** Protocol template browser with search, preview, and 1-click clone into patient chart.
- **Acceptance Criteria:** Clinician can load an approved gestational protocol and customize it in <2 minutes.
- **Future Integration:** Multi-clinic organizational sharing in R11.

### [U26] De-identified Clinical Outcome Benchmarking
- **Description:** Multi-clinic benchmarking tool comparing an individual clinic's therapeutic success rates against anonymized regional and national aggregates.
- **Benchmark / Inspiration:** Biocanic.
- **Primary Phase Owner:** **R12** (Clinical Research & Outcome Benchmarking)
- **Dependencies:** U23
- **Current Status:** `PLANNED` (Targeted for R12 implementation)
- **Input Data:** Anonymized practice outcome metrics.
- **Output Data:** Percentile ranking of clinical effectiveness (e.g., "Top 10% in T2D glycemic stabilization").
- **Clinical Safety Considerations:** Differential privacy noise injection to prevent re-identification of rare conditions.
- **Required UI:** Practice executive benchmarking widget.
- **Acceptance Criteria:** Visualizes clinic performance against regional mean with statistical significance indicators.
- **Future Integration:** National epidemiological research data feeds in R12.

### [U27] Future AI Food Photo Analyzer (DEFERRED TO R14)
- **Description:** Computer vision pipeline analyzing patient-submitted photos of meals to identify food items, estimate portion sizes, and log dietary adherence.
- **Benchmark / Inspiration:** Passio AI, Cronometer Photo Logging.
- **Primary Phase Owner:** **R14** (Future AI Intelligence Layer)
- **Dependencies:** R2, R15 (Mobile App)
- **Current Status:** `FUTURE / DEFERRED` (Interface contracts defined in R0; zero runtime execution)
- **Input Data:** Smartphone camera images of cooked South Asian meals.
- **Output Data:** Proposed food ID matches, estimated volume/weight, confidence score.
- **Clinical Safety Considerations:** Mandatory human nutritionist verification; AI output is strictly an unverified draft.
- **Required UI:** Photo review staging interface with side-by-side clinician verification.
- **Acceptance Criteria:** Interface contract `IFoodPhotoAnalyzerAdapter` defined and typed cleanly in R0.
- **Future Integration:** Edge-computed vision models in R14/R15.

### [U28] Future Bengali Voice Food Diary (DEFERRED TO R14)
- **Description:** Natural language voice logging engine allowing patients to speak their daily food intake in colloquial Bengali/Banglish, transcribing and resolving items into structured entries.
- **Benchmark / Inspiration:** Proprietary SHUDDHO Innovation (Localized accessibility for non-typists).
- **Primary Phase Owner:** **R14** (Future AI Intelligence Layer)
- **Dependencies:** F08, R15
- **Current Status:** `FUTURE / DEFERRED` (Interface contracts defined in R0; zero runtime execution)
- **Input Data:** Audio voice memos (e.g., "দুপুরে এক বাটি ভাত, রুই মাছ আর শাক খেয়েছি").
- **Output Data:** Structured food log: Food IDs, estimated portions, timestamp.
- **Clinical Safety Considerations:** Draft state flagged for clinician or patient confirmation before nutrient tallying.
- **Required UI:** Audio waveform recorder on mobile web and companion app.
- **Acceptance Criteria:** Interface contract `IBengaliVoiceDiaryAdapter` defined and typed cleanly in R0.
- **Future Integration:** Whisper-based Bengali fine-tuned speech model in R14.

### [U29] Future AI Clinical Copilot (DEFERRED TO R14)
- **Description:** Grounded, retrieval-augmented clinical assistant summarizing complex patient histories, searching functional medicine literature, and suggesting evidence-based protocol options.
- **Benchmark / Inspiration:** Etio, OpenEvidence.
- **Primary Phase Owner:** **R14** (Future AI Intelligence Layer)
- **Dependencies:** U01, U04, R6
- **Current Status:** `FUTURE / DEFERRED` (Interface contracts defined in R0; zero runtime execution)
- **Input Data:** Patient clinical dossier, specific clinician query.
- **Output Data:** Synthesized clinical summary with grounded PubMed PMIDs and suggested interventions.
- **Clinical Safety Considerations:** **Strictly advisory.** Cannot directly modify diet plans or approve prescriptions without clinician action.
- **Required UI:** Collapsible clinical copilot side-panel with one-click citation verification.
- **Acceptance Criteria:** Interface contract `IClinicalCopilotAdapter` defined and typed cleanly in R0.
- **Future Integration:** Localized, privacy-preserving LLM inference pipeline in R14.

### [U30] Future Native Mobile Health Companion (DEFERRED TO R15)
- **Description:** Dedicated iOS and Android patient mobile application delivering daily meal plans, chronotherapy reminders, water tracking, and secure direct clinician messaging.
- **Benchmark / Inspiration:** Practice Better Mobile, Nutrium App.
- **Primary Phase Owner:** **R15** (Future Android/iOS Applications)
- **Dependencies:** R1, R2, R3, R11
- **Current Status:** `FUTURE / DEFERRED` (PWA foundation in R0; native binaries in R15)
- **Input Data:** Patient authentication token, push notification triggers.
- **Output Data:** Daily food schedule, adherence check-offs, biometric telemetry.
- **Clinical Safety Considerations:** Offline emergency clinical instructions; strictly enforces U21 (no raw calories/macros displayed).
- **Required UI:** Native iOS/Android design system adhering to Apple Human Interface and Material 3 standards.
- **Acceptance Criteria:** Interface contracts for mobile API endpoints and offline synchronization defined in R0.
- **Future Integration:** HealthKit, Google Health Connect, and Bluetooth CGM sync in R13/R15.

---

## 4. Single-Owner Traceability Verification

| Primary Phase Owner | Registered Feature IDs |
| :--- | :--- |
| **R0: Foundation & Contracts** | **F01, F02, F03, F04, F05, F06, F07, F08** |
| **R1: Dual Report & PDF Studio** | **U20, U21** |
| **R2: Secure Cloud Backend & DB** | **U18** |
| **R3: Patient Self-Assessment Portal** | **U19** |
| **R4: Lifestyle & Timing Intelligence** | **U06** |
| **R5: Master Prescription Composer** | **U24** |
| **R6: Advanced Clinical Intelligence** | **U01, U02, U03, U04, U05** |
| **R7: Advanced Labs & Supplements** | **U07** |
| **R8: Food & Nutrient Knowledge Base** | **U08, U11** |
| **R9: Precision Diet & Budget Planning**| **U09, U10, U12, U13** |
| **R10: Longitudinal Follow-up & Phases**| **U15, U16, U17, U22** |
| **R11: Practice Management & Portal** | **U25** |
| **R12: Clinical Research & Outcomes** | **U14, U23, U26** |
| **R13: Lab, Wearable & External APIs** | *(Integrations for F07, U07, U30)* |
| **R14: Future AI Intelligence Layer** | **U27, U28, U29** |
| **R15: Future Android/iOS Applications** | **U30** |

**Audit Conclusion:** Exactly 38 features registered. Zero overlapping implementation ownership. 100% of features trace to an explicit primary roadmap phase.
