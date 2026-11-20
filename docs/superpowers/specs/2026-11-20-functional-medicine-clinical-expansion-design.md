# Design Document: Functional Medicine Clinical Expansion (Clusters 1 & 2)

**Topic:** Clinical Functional Medicine Rule, Medication & Protocol Expansion  
**Date:** 2026-11-20  
**Status:** PROPOSED FOR APPROVAL (Post-Builder Review)  
**Location:** `docs/superpowers/specs/2026-11-20-functional-medicine-clinical-expansion-design.md`  

---

## 1. Intent & Clinical Mission
SHUDDHO has completed its core foundational architecture (Steps 01 to 05, P0, P1, P2, and Premium Design Foundation). To evolve into a comprehensive clinical-grade functional medicine tool capable of serving a broader spectrum of complex, multi-morbid patients, the clinical rule set, medication database, drug-nutrient interaction (DNI) engine, and functional supplement catalog are being systematically expanded.

This expansion introduces deep systems-biology modeling for **Cardiometabolic, Endocrine, Gastrointestinal, and Mucosal** disorders without modifying the underlying structural architecture, UI components, or existing test selectors.

---

## 2. Goals, Non-Goals & Anti-Goals

### 2.1 Goals
1. **Cluster 1: Advanced Cardiometabolic & Endocrine Expansion**
   - Add 3 clinical conditions to `ClinicalConditionId` and `DISEASE_RULES`:
     - `dyslipidemia_atherosclerosis`: Dyslipidemia / Atherogenic Dyslipidemia & Cardiovascular Risk.
     - `metabolic_syndrome`: Metabolic Syndrome / Triad of Hypertriglyceridemia, Low HDL, Visceral Adiposity.
     - `lada_early_pancreatic`: Latent Autoimmune Diabetes in Adults / Early Beta-Cell Insufficiency.
   - Expand `medicines.json` with 4 new drug classes:
     - SGLT2 Inhibitors (*Empagliflozin, Dapagliflozin*): Euglycemic DKA risk, hydration/electrolyte shifts, strict fasting warnings.
     - Sulfonylureas (*Gliclazide, Glimepiride*): Hypoglycemia risk, contraindication with prolonged intermittent fasting.
     - Incretin / GLP-1 Receptor Agonists (*Semaglutide, Liraglutide*): Delayed gastric emptying, sarcopenia/protein-sparing alerts, anti-reflux timing.
     - Angiotensin Receptor Blockers (ARBs) & ACE Inhibitors (*Losartan, Telmisartan, Ramipril*): Potassium-sparing precautions, zinc/magnesium depletions.
   - Expand `supplements.json` with targeted metabolic nutraceuticals:
     - `supp_alpha_lipoic_acid`: Alpha Lipoic Acid (R-ALA) for mitochondrial antioxidant recycling & insulin signaling.
     - `supp_inositol_40_1`: Myo-Inositol & D-Chiro Inositol (40:1 physiological ratio) for insulin-sensitization & ovarian cellular signaling.
     - `supp_active_folate_bcomplex`: Co-enzymated B-Complex (L-Methylfolate 5-MTHF, Methylcobalamin, P-5-P) for homocysteine biotransformation.

2. **Cluster 2: Advanced Gastrointestinal & Microbiome Expansion**
   - Add 3 clinical conditions to `ClinicalConditionId` and `DISEASE_RULES`:
     - `sibo_microbial_overgrowth`: Small Intestinal Bacterial Overgrowth (Hydrogen/Methane phenotypes) & High-Fermentation Dysbiosis.
     - `gerd_reflux_esophagitis`: Gastroesophageal Reflux Disease / Lower Esophageal Sphincter (LES) Incompetence & Hypochlorhydria.
     - `ibd_mucosal_inflammation`: Inflammatory Bowel Disease (Ulcerative Colitis & Crohn's Remission/Mild Active).
   - Expand `medicines.json` with GI drug classes + NSAID reconciliation:
     - H2 Receptor Antagonists (*Famotidine*): Gastric acid suppression, B12/Iron/Calcium depletions, weaning protocol support.
     - GI Motility / Prokinetics (*Mebeverine, Domperidone*): Pre-prandial 20-30 minute administration rules.
     - 5-Aminosalicylic Acid (5-ASA) (*Mesalazine*): Folate antagonism, adequate fluid maintenance.
     - NSAIDs (*Naproxen, Ibuprofen, Diclofenac*): Gastric mucosal barrier erosion, iron loss, and Betaine HCl contraindication trigger.
   - Expand `supplements.json` with mucosal and microbiome therapeutics:
     - `supp_zinc_carnosine`: Zinc L-Carnosine for gastric mucosal membrane healing and tight junction stabilization.
     - `supp_l_glutamine`: L-Glutamine pure powder for enterocyte metabolic fuel and intestinal barrier repair.
     - `supp_betaine_hcl_pepsin`: Betaine HCl + Pepsin for gastric hypochlorhydria, digestive fire (Manda Agni) activation.
     - `supp_curcumin_phytosome`: Phospholipid-bound Curcumin for NF-κB down-regulation in mucosal colitis.

3. **Laboratory Biomarker Range Enrichment**
   - Expand `src/engine/labAnalyzer.ts` to evaluate functional optimal vs conventional pathology reference ranges for:
     - Fasting Insulin (Optimal: 2–6 µIU/mL vs Conventional: <25 µIU/mL).
     - HOMA-IR (Optimal: <1.4 vs Pathological: >1.9).
     - hs-CRP (Optimal: <0.5 mg/L vs Average: <1.0–3.0 mg/L).
     - Derived Non-HDL Cholesterol (`Total Cholesterol - HDL`, Optimal: <100 mg/dL).
     - Homocysteine (Optimal: 6–9 µmol/L vs Conventional: <15 µmol/L).
     - Preserve existing sex-stratified Serum Ferritin and TG/HDL ratio rules to maintain 100% test compatibility.

4. **Clinical Safety & Daily Timeline Integration**
   - Deterministic DNI cross-checking in `dniEngine.ts`:
     - Cumulative Upper Limit (UL) screening for Zinc (40 mg/day) and Folate (1,000 mcg/day).
     - Timeline scheduling (morning fasting, 20m pre-meal, with-meal fat-soluble, bedtime neuromuscular recovery).
     - Full English and Bengali bilingual parity across all rationales, summaries, and instructions.

### 2.2 Non-Goals
- No architectural refactoring or altering existing data flows.
- No changes to existing UI component structures, class names, or DOM selectors/testids.
- No replacement of deterministic logic with probabilistic LLM generation.
- No automatic prescription of prescription drugs (all pharmaceuticals remain reconciled and entered under clinician review).

### 2.3 Anti-Goals (Clinical Safety Guardrails)
- **Zero SGLT2i Euglycemic DKA Induction:** Diets with `< 60g total carbs` (matching `medicationSafetyEngine.ts`) and prolonged fasting (>16h) are flagged with HARD_STOP if the patient is on SGLT2 inhibitors.
- **Zero Sulfonylurea Fasting Hypoglycemia:** Intermittent fasting (>14h) without clinician medication titration is blocked when sulfonylureas or insulin are active.
- **Zero Betaine HCl in Active Peptic Ulcer or NSAID Therapy:** Betaine HCl candidate supplement is automatically suppressed with an alert if active ulcer or NSAIDs are detected.
- **Zero High-FODMAP Roughage during Acute Colitis/SIBO:** Insoluble roughage and high-FODMAP fermentables are excluded in active SIBO/IBD phases.

---

## 3. Builder Check Resolution & Concrete Technical Decisions

The following explicit decisions have been resolved and incorporated directly into the implementation design:

1. **Betaine HCl Safety Architecture (Active Ulcer & NSAIDs):**
   - *Decision:* Rather than destabilizing `validateInterventionPlan()`, supplement safety is enforced at candidate evaluation time in `dniEngine.ts`. If concurrent NSAIDs (Naproxen, Ibuprofen, Diclofenac) are active or gastric burning/ulcer is flagged in functional assessment answers, `supp_betaine_hcl_pepsin` is excluded from candidate recommendations and an explicit clinical warning is emitted.
2. **SGLT2 Carbohydrate & Fasting Thresholds:**
   - *Decision:* Retain the existing, verified `< 60g total carbs` threshold in `medicationSafetyEngine.ts` (avoiding risky net-carb refactoring). In `fastingSafetyEngine.ts`, cap fasting eligibility at 14–16h for SGLT2i patients to prevent euglycemic ketoacidosis.
3. **Macronutrient Calculation in `anthropometrics.ts`:**
   - *Decision:* Add the 6 new conditions to `anthropometrics.ts`:
     - Cardiometabolic (`dyslipidemia_atherosclerosis`, `metabolic_syndrome`, `lada_early_pancreatic`): `carb_pct = 0.30`, `fat_pct = 0.40`, protein 1.3–1.5 g/kg.
     - Gastrointestinal (`sibo_microbial_overgrowth`, `gerd_reflux_esophagitis`, `ibd_mucosal_inflammation`): `carb_pct = 0.35`, `fat_pct = 0.35`, protein 1.2–1.4 g/kg.
     - Multi-condition resolution preserves renal protein restrictions as the highest clinical priority.
4. **IBD / SIBO Roughage & Food Tags:**
   - *Decision:* No new tags added to `foods.json` schema. In `DISEASE_RULES`, `ibd_mucosal_inflammation` uses existing valid taxonomy tags (`high_histamine`, `contains_gluten`, `high_fodmap`), and directly enumerates roughage foods in `redFoods` (raw fibrous vegetables, unsoaked seeds, chili, mustard oil, deep-fried snacks) while providing soothing Bengali restorative foods in `greenFoods` (bottle gourd/lau, green papaya, boiled magur/shing fish, jao vat).
5. **Lab Analyzer Biomarkers:**
   - *Decision:* `non_hdl` is derived automatically (`total_cholesterol - hdl`) when both values are available. Existing sex-stratified Ferritin (Female: 40–120 ng/mL, Male: 50–150 ng/mL) and TG/HDL (<1.5 optimal) logic is preserved intact, preventing regressions.

---

## 4. Technical File Touchpoints

1. `src/types/index.ts`: Extend `ClinicalConditionId` with the 6 new conditions.
2. `src/engine/diseaseRules.ts`: Full clinical rule definitions, foods, and timing rules.
3. `src/engine/anthropometrics.ts`: Macro target calculations for the 6 new conditions.
4. `src/data/medicines.json`: 7 new drug classes + NSAIDs.
5. `src/data/supplements.json`: 7 new functional supplements.
6. `src/engine/dniEngine.ts`: Drug-nutrient depletions, Betaine HCl contraindication suppression, and Zinc/Folate UL checks.
7. `src/clinical-safety/fastingSafetyEngine.ts`: SGLT2i fasting safety cap.
8. `src/engine/labAnalyzer.ts`: Derived Non-HDL, Fasting Insulin, HOMA-IR, hs-CRP, and Homocysteine rules.
9. `test/cluster1_cluster2_functional_expansion.test.ts`: Dedicated test suite verifying all additions.

---

## 5. Verification & Testing Strategy
- **New Unit Suite:** `test/cluster1_cluster2_functional_expansion.test.ts` (100% pass on all new rules).
- **Existing Unit Battery:** `npm test` (all 814+ assertions remain 100% green).
- **Python QA Gates:** `npm run test:step05:qa` (all 12 referential integrity gates pass).
- **Playwright E2E:** `npm run test:e2e` (all 140/140 browser assertions pass).
- **Type Checking:** `npx tsc --noEmit` (0 errors).
- **Production Build:** `npm run build` (clean static export).
