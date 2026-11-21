# Functional Medicine Expansion: Clusters 3, 4, and 5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the clinical functional nutrition engine to fully incorporate Cluster 3 (Autoimmune & Systemic Inflammation), Cluster 4 (Renal, Electrolyte & Nephrolithiasis), and Cluster 5 (Neuro-Adrenal, Hormonal & Sleep Axis), delivering deterministic safety, drug-nutrient interactions, and fasting ceilings without altering existing UI or breaking working features.

**Architecture:** Pure TypeScript deterministic rule engines (`diseaseRules.ts`, `dniEngine.ts`, `fastingSafetyEngine.ts`) driven by structured JSON knowledge catalogs (`medicines.json`, `supplements.json`) and typed domain models (`src/types/index.ts`). Validated against 20-category P0-P2 clinical safety suites and 12-gate referential integrity checks.

**Tech Stack:** TypeScript, Next.js, Node.js (tsx/jest test harnesses), Python QA tooling.

**Spec:** Expansion across 8 clinical conditions, 5 medication classes, 5 functional supplements, with hyperkalemia hard stops, Serotonin Syndrome warnings, Methotrexate folate spacing, and renal/adrenal fasting ceilings.

## Global Constraints

- 100% deterministic, zero hallucination: every recommendation, contraindication, and depletion must have structured clinical rationales in English and Bengali.
- Backward compatibility: preserve all existing 13 clinical conditions, 14 medicines, and 14 supplements.
- No UI breakage: maintain existing navigation, dashboard, diet charts, and print reports intact.
- Multi-condition hierarchy: RED (hard contraindication) > YELLOW (cautious/conditional) > GREEN (therapeutic).
- Zero tolerance for clinical safety bypasses (hyperkalemia, serotonin syndrome, celiac gluten exposure).

## Review Focus

1. **Celiac Disease Absolute Gluten Exclusion:** Ensure any food tagged `contains_gluten` is marked RED under `celiac_gluten_sensitivity`.
2. **Hyperkalemia Stop:** Spironolactone / Potassium-sparing diuretics co-administered with Potassium Citrate or high-potassium supplements must trigger a critical clinical safety warning / hard stop.
3. **Serotonin Syndrome Advisory:** SSRIs co-administered with 5-HTP or serotonergic agents must trigger a prominent clinical safety alert.
4. **Methotrexate Folate Depletion Timing:** Verify that folic acid / folinic acid / methylfolate supplementation is flagged with the mandatory 24-48 hour dosing gap away from Methotrexate administration.
5. **Renal & Adrenal Fasting Ceilings:** CKD 3b and severe HPA burnout must restrict prolonged intermittent fasting beyond 14 hours.

---

### Task 1: Type System Expansion (src/types/index.ts)

- [ ] Add 8 new condition IDs to `ClinicalConditionId`:
  - `rheumatoid_arthritis`
  - `psoriasis_metabolic_skin`
  - `celiac_gluten_sensitivity`
  - `ckd_stage_1_3b`
  - `nephrolithiasis_hyperoxaluria`
  - `hpa_axis_burnout`
  - `migraine_neurovascular`
  - `insomnia_circadian_disruption`
- [ ] Verify TypeScript compiles with `npx tsc --noEmit`.

### Task 2: Disease Rules Expansion (src/engine/diseaseRules.ts)

- [ ] Implement `rheumatoid_arthritis` rule:
  - Macro: 35-45% carb, 1.2-1.5 g/kg protein, 35-40% fat (Mediterranean anti-inflammatory).
  - Tags: green `['anti_inflammatory', 'gut_healing']`, red `['high_fructose', 'high_sodium_processed']`, yellow `['solanaceae_nightshade']`.
  - Clinical rationale: NF-kB/TNF-alpha modulation, gut mucosal integrity, joint inflammation suppression.
- [ ] Implement `psoriasis_metabolic_skin` rule:
  - Macro: 35-45% carb, 1.2-1.4 g/kg protein, 35-40% fat.
  - Tags: green `['anti_inflammatory', 'gut_healing', 'liver_detox']`, red `['high_fructose', 'high_sodium_processed']`.
  - Clinical rationale: Th17/IL-23 modulation, endotoxin (LPS) reduction, gut-skin axis restoration.
- [ ] Implement `celiac_gluten_sensitivity` rule:
  - Macro: 40-50% carb, 1.2-1.5 g/kg protein, 30-35% fat.
  - Tags: green `['gluten_free', 'gut_healing', 'anti_inflammatory']`, red `['contains_gluten']`.
  - Hard red foods: all wheat, barley, rye, flour, semolina, bread, biscuits, bakery products.
  - Clinical rationale: Strict zero gluten to avoid anti-tTG activation and intestinal villous blunting.
- [ ] Implement `ckd_stage_1_3b` rule:
  - Macro: 45-55% carb, 0.6-0.8 g/kg protein (Stage 3 titration), 30-35% fat.
  - Tags: green `['low_sodium', 'anti_inflammatory']`, red `['high_sodium_processed', 'high_purine']`, yellow `['high_potassium', 'high_protein']`.
  - Clinical rationale: Glomerular hyperfiltration prevention, nitrogenous waste minimization, electrolyte balance.
- [ ] Implement `nephrolithiasis_hyperoxaluria` rule:
  - Macro: 45-55% carb, 1.0-1.2 g/kg protein, 30-35% fat.
  - Tags: green `['citrate_rich', 'low_oxalate']`, red `['high_oxalate', 'high_sodium_processed']`.
  - Red foods: spinach, beet greens, nuts, cocoa, star fruit.
  - Clinical rationale: Calcium oxalate crystallization suppression, urinary alkalinization, lumen oxalate binding.
- [ ] Implement `hpa_axis_burnout` rule:
  - Macro: 35-45% carb, 1.2-1.5 g/kg protein, 35-40% fat.
  - Tags: green `['adaptogenic_support', 'anti_inflammatory', 'adrenal_support']`, red `['high_fructose', 'caffeine_stimulant']`.
  - Clinical rationale: Glycemic stabilization to prevent hypoglycemic cortisol spikes, adrenal nutrient repletion.
- [ ] Implement `migraine_neurovascular` rule:
  - Macro: 35-45% carb, 1.2-1.4 g/kg protein, 35-40% fat.
  - Tags: green `['anti_inflammatory', 'magnesium_rich']`, red `['tyramine_rich', 'histamine_rich', 'artificial_sweetener', 'msg_nitrites']`.
  - Clinical rationale: Trigeminal vascular stabilization, avoidance of neurogenic vasodilation triggers.
- [ ] Implement `insomnia_circadian_disruption` rule:
  - Macro: 40-50% carb, 1.1-1.3 g/kg protein, 30-35% fat.
  - Tags: green `['tryptophan_rich', 'magnesium_rich', 'circadian_align']`, red `['caffeine_stimulant', 'late_night_glycemic']`.
  - Meal timing: 3-4 hours fasting window before bedtime.
  - Clinical rationale: Nocturnal melatonergic signaling, blunting evening cortisol spikes, GABAr activation.

### Task 3: Medicines Catalog Expansion (src/data/medicines.json)

- [ ] Add `med_dmard_methotrexate`:
  - Class: DMARD / Antifolate Immunosuppressive.
  - BD brands: Folitrax, Mexate, Tremet.
  - Depletions: Folate (high severity, dihydrofolate reductase inhibition), B12.
  - Supplement rec: Active L-Methylfolate / Folinic Acid with strict 24h gap from MTX dose.
- [ ] Add `med_dmard_hydroxychloroquine`:
  - Class: DMARD / Aminoquinoline Antimalarial.
  - BD brands: Plaquenil, Hydroquin, Reumac.
  - Depletions: CoQ10, Zinc.
  - Advisory: Hypoglycemia caution when used with antidiabetic agents.
- [ ] Add `med_biologics_anti_tnf`:
  - Class: Biologic / TNF-alpha Antagonist (Adalimumab, Infliximab).
  - BD brands: Humira, Exemptia, Remicade.
  - Advisory: Immunosuppression food safety protocol (strictly thoroughly cooked foods, no unpasteurized milk/cheese or raw sprouts).
- [ ] Add `med_potassium_sparing_diuretic`:
  - Class: Potassium-Sparing Diuretic / Aldosterone Antagonist (Spironolactone, Eplerenone).
  - BD brands: Aldactone, Spirocard, Uractone.
  - Advisory: Critical hyperkalemia warning; avoid potassium chloride salt substitutes and potassium citrate.
- [ ] Add `med_potassium_citrate`:
  - Class: Urinary Alkalinizer / Nephrolithiasis Agent.
  - BD brands: K-Cit, Urocit-K, Citrocil.
  - Depletions / Interactions: Severe hyperkalemia risk if used with potassium-sparing diuretics or ACEi/ARBs in renal impairment.
- [ ] Add `med_ssri`:
  - Class: Selective Serotonin Reuptake Inhibitor (Escitalopram, Sertraline).
  - BD brands: Nexito, Serlift, Zolax, Sedil.
  - Depletions: Folate, Vitamin B12, Melatonin.
  - Critical Stop: 5-HTP / St. John's Wort combination (Serotonin Syndrome risk).

### Task 4: Supplements Catalog Expansion (src/data/supplements.json)

- [ ] Add `supp_boswellia_serrata`:
  - Form: Boswellia Serrata Extract (65% Boswellic acids / AKBA).
  - Dose: 300 - 500 mg twice daily with meals.
  - Target: Rheumatoid arthritis, IBD, systemic joint inflammation.
  - BD brands: Boswell, Arthrocid.
- [ ] Add `supp_quercetin_phytosome`:
  - Form: Quercetin Phytosome (with sunflower lecithin & bromelain).
  - Dose: 250 - 500 mg daily.
  - Target: Mast cell stabilization, neurovascular inflammation, histamine modulation.
  - BD brands: Querce, Histamend.
- [ ] Add `supp_potassium_citrate_functional`:
  - Form: Potassium Magnesium Citrate Powder/Tablets.
  - Dose: 10 - 20 mEq/day under urinary pH monitoring.
  - Target: Calcium oxalate stone prevention, hypocitraturia.
  - Contraindication: Concurrent potassium-sparing diuretics or eGFR < 30.
- [ ] Add `supp_ashwagandha_ksm66`:
  - Form: Ashwagandha Root Extract (KSM-66, >5% withanolides).
  - Dose: 300 - 600 mg evening or bedtime.
  - Target: HPA-axis burnout, cortisol reduction, restorative sleep.
  - Caution: Hyperthyroidism stimulation.
  - BD brands: Ashwa-KSM, StressCalm.
- [ ] Add `supp_l_theanine`:
  - Form: L-Theanine (Suntheanine or pure amino acid).
  - Dose: 100 - 200 mg afternoon or 30 mins before bedtime.
  - Target: Alpha brainwave generation, glutamate-GABA balance, sleep onset latency.
  - BD brands: TheaCalm, ZenFocus.

### Task 5: DNI & Clinical Safety Rules (src/engine/dniEngine.ts)

- [ ] Add Spironolactone + Potassium Citrate / supplemental potassium hard stop:
  - If patient has `med_potassium_sparing_diuretic` and candidate supplement contains potassium -> trigger `CRITICAL_HYPERKALEMIA_STOP`.
- [ ] Add SSRI + Serotonergic agents safety advisory:
  - If patient has `med_ssri` and candidate supplement is 5-HTP or St. John's Wort -> trigger `SEROTONIN_SYNDROME_STOP`.
- [ ] Add Methotrexate Folate Timing rule:
  - Prescribe folinic acid or active folate with explicit note: "Take 24 to 48 hours after weekly Methotrexate dose; do not administer on the day of Methotrexate."
- [ ] Add Biologics food safety alert:
  - If on `med_biologics_anti_tnf`, enforce strictly cooked food hygiene alert and avoid raw fermented/unpasteurized items.
- [ ] Add Upper Limit / Safety Screenings for Quercetin, Ashwagandha (autoimmune caution note), and Potassium.

### Task 6: Fasting Safety Engine Ceilings (src/clinical-safety/fastingSafetyEngine.ts)

- [ ] Add CKD 3b fasting safety cap:
  - If `patient.selected_conditions` contains `ckd_stage_1_3b` or `patient.labs?.egfr` between 30 and 44 mL/min -> cap max allowable fasting to 14 hours; if eGFR < 30 -> mark fasting contraindicated (0 hours).
- [ ] Add severe HPA-Axis Burnout fasting safety cap:
  - If `patient.selected_conditions` contains `hpa_axis_burnout` -> cap max allowable fasting to 14 hours with requirement for morning protein/salt hydration.

### Task 7: Comprehensive Verification Test Suite (test/clusters_3_4_5_expansion.test.ts)

- [ ] Create `test/clusters_3_4_5_expansion.test.ts` testing:
  - Condition definition coverage (all 8 new conditions in `DISEASE_RULES`).
  - Gluten exclusion for celiac (gluten food yields RED with `contains_gluten`).
  - Oxalate exclusion for kidney stones (high oxalate food yields RED).
  - Protein titration bounds for CKD stage 1-3b.
  - Spironolactone + Potassium Citrate hyperkalemia hard stop.
  - SSRI + Serotonergic safety check.
  - Methotrexate folate depletion & 24h gap rule.
  - Fasting ceiling for CKD 3b and HPA burnout (≤14h).

### Task 8: Verification & Quality Assurance Gate

- [ ] Run `npx tsc --noEmit` -> ensure zero TypeScript compiler errors.
- [ ] Run `cmd /c "npm test"` -> ensure all 814+ existing tests + new tests pass cleanly.
- [ ] Run `python scripts/qa_step05_nutrition_referential_integrity.py` -> 12/12 gates pass.
- [ ] Run `cmd /c "npm run build"` -> successful static export to `/out`.
- [ ] Commit to git with atomic, structured messages.
