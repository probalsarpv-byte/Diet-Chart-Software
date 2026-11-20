# Functional Medicine Clinical Expansion (Clusters 1 & 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand SHUDDHO's clinical coverage to treat complex cardiometabolic, endocrine, gastrointestinal, and mucosal disease patients by introducing 6 new functional medicine disease models, 8 pharmaceutical drug classes, 7 evidence-based functional supplements, and enhanced lab biomarkers without modifying existing software architecture or breaking test selectors.

**Architecture:** Pure TypeScript & JSON deterministic extension. Adds strongly-typed condition IDs to `ClinicalConditionId`, enriches `DISEASE_RULES` with food traffic-lights and timing rules, updates `anthropometrics.ts` for condition macro targeting, expands `medicines.json` and `dniEngine.ts` with drug-nutrient depletions and Betaine HCl/SGLT2i safety guards, and enriches `supplements.json` and `labAnalyzer.ts`.

**Tech Stack:** TypeScript (strict mode), Next.js, Node.js test runner (`tsx`), Python 3 QA gates, Playwright E2E.

**Spec:** `docs/superpowers/specs/2026-11-20-functional-medicine-clinical-expansion-design.md`

## Global Constraints
- **Zero Architectural Refactoring:** No schema renames, no breaking changes to patient/visit contracts.
- **Zero UI Selector Regressions:** All existing DOM elements, `data-testid` attributes, and class names must be preserved.
- **100% Deterministic:** No probabilistic or LLM-based logic.
- **Bilingual Parity:** Every clinical summary, rule, and rationale must have both English (`_en`) and Bengali (`_bn`) translations.
- **Safety Precedence:** SGLT2i ketosis guard (<60g total carbs), SGLT2i fasting cap (≤16h), and Betaine HCl mucosal contraindications are non-negotiable hard clinical boundaries.

## Review Focus
1. **SGLT2i Patient Fasting:** Patient taking Empagliflozin/Dapagliflozin must have fasting hours capped at ≤16h and never receive a strict ketogenic macro prescription (<60g carbs).
2. **Betaine HCl with Active Peptic Ulcer / NSAIDs:** Candidate Betaine HCl must be strictly suppressed from recommendation when concurrent NSAIDs (Naproxen/Ibuprofen/Diclofenac) or gastric burning/ulcers are reported.
3. **Multi-Condition Macro Safety:** When a patient has both LADA/Metabolic Syndrome and CKD/Renal caution, the renal protein restriction (0.8–1.0 g/kg) must take strict clinical precedence.
4. **Zinc & Folate Overlap Upper Limits:** Selecting multiple formulations containing Zinc must flag an alert when cumulative elemental dosage exceeds 40 mg/day; Folate when exceeding 1,000 mcg/day.
5. **Biomarker Non-HDL Derivation:** When Total Cholesterol (e.g. 220 mg/dL) and HDL (e.g. 40 mg/dL) are entered without explicit Non-HDL, `labAnalyzer.ts` must automatically derive Non-HDL as 180 mg/dL and flag it as borderline/abnormal.

---

### Task 1: Type System & Condition ID Expansion

**Files:**
- Modify: `src/types/index.ts:189-197`
- Test: `test/cluster1_cluster2_functional_expansion.test.ts`

**Interfaces:**
- Produces: `ClinicalConditionId` extended with:
  `'dyslipidemia_atherosclerosis' | 'metabolic_syndrome' | 'lada_early_pancreatic' | 'sibo_microbial_overgrowth' | 'gerd_reflux_esophagitis' | 'ibd_mucosal_inflammation'`

- [ ] **Step 1: Write the failing test**

```typescript
// test/cluster1_cluster2_functional_expansion.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ClinicalConditionId } from '../src/types';

describe('Task 1: Condition ID Types', () => {
  it('includes all 6 new condition IDs in ClinicalConditionId type domain', () => {
    const newConditions: ClinicalConditionId[] = [
      'dyslipidemia_atherosclerosis',
      'metabolic_syndrome',
      'lada_early_pancreatic',
      'sibo_microbial_overgrowth',
      'gerd_reflux_esophagitis',
      'ibd_mucosal_inflammation'
    ];
    assert.strictEqual(newConditions.length, 6);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test test/cluster1_cluster2_functional_expansion.test.ts`
Expected: FAIL with TypeScript type mismatch (new conditions not assignable to ClinicalConditionId).

- [ ] **Step 3: Implement in `src/types/index.ts`**

Update `ClinicalConditionId` type definition to include the 6 new condition literals.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test test/cluster1_cluster2_functional_expansion.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts test/cluster1_cluster2_functional_expansion.test.ts
git commit -m 'feat(types): expand ClinicalConditionId with Clusters 1 and 2 conditions'
```

---

### Task 2: Disease Rules & Anthropometric Macro Integration

**Files:**
- Modify: `src/engine/diseaseRules.ts:200-209`
- Modify: `src/engine/anthropometrics.ts:206-214`
- Test: `test/cluster1_cluster2_functional_expansion.test.ts`

**Interfaces:**
- Consumes: `ClinicalConditionId` from `src/types/index.ts`
- Produces: `DISEASE_RULES` containing all 13 conditions; `calculateAnthropometrics()` computing condition-specific macro splits.

- [ ] **Step 1: Write the failing test**

```typescript
// in test/cluster1_cluster2_functional_expansion.test.ts
import { DISEASE_RULES } from '../src/engine/diseaseRules';
import { calculateAnthropometrics } from '../src/engine/anthropometrics';

describe('Task 2: Disease Rules & Macro Adjustments', () => {
  it('contains valid rules, tags, and bilingual summaries for all 6 new conditions', () => {
    const ids = [
      'dyslipidemia_atherosclerosis',
      'metabolic_syndrome',
      'lada_early_pancreatic',
      'sibo_microbial_overgrowth',
      'gerd_reflux_esophagitis',
      'ibd_mucosal_inflammation'
    ] as const;

    for (const id of ids) {
      const rule = DISEASE_RULES[id];
      assert.ok(rule, `Rule for ${id} must exist`);
      assert.ok(rule.name_bn && rule.name_en, `${id} must have bilingual names`);
      assert.ok(rule.redTags.length > 0, `${id} must have redTags`);
      assert.ok(rule.greenTags.length > 0, `${id} must have greenTags`);
      assert.ok(rule.redFoods.length > 0, `${id} must have redFoods`);
      assert.ok(rule.greenFoods.length > 0, `${id} must have greenFoods`);
      assert.ok(rule.macroAdjustment, `${id} must have macroAdjustment`);
      assert.ok(rule.mealTimingRules.length > 0, `${id} must have mealTimingRules`);
    }
  });

  it('calculates 30% carb and 40% fat for metabolic_syndrome in calculateAnthropometrics', () => {
    const res = calculateAnthropometrics({
      age: 45,
      gender: 'male',
      height_cm: 170,
      weight_kg: 80,
      activity_level: 'sedentary',
      selected_conditions: ['metabolic_syndrome']
    });
    // With 30% carb and 40% fat target ratio
    assert.ok(res.target_carbs_g > 0);
    assert.ok(res.target_fat_g > 0);
    assert.ok(res.target_protein_g >= 90);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test test/cluster1_cluster2_functional_expansion.test.ts`
Expected: FAIL with missing rules in `DISEASE_RULES`.

- [ ] **Step 3: Implement in `src/engine/diseaseRules.ts` and `src/engine/anthropometrics.ts`**

Add rule definitions for:
1. `dyslipidemia_atherosclerosis`: Focus on soluble viscous fiber, plant sterols, omega-3, red rice, cold-pressed mustard oil; red: trans fats, dalda, deep-fried snacks, processed meat.
2. `metabolic_syndrome`: Low glycemic load, visceral fat reduction, AMPK activation, 30% carb, 40% fat, 1.3-1.5g protein/kg.
3. `lada_early_pancreatic`: Beta-cell rest, anti-inflammatory, antioxidant-rich, moderate protein, avoid glycemic spikes.
4. `sibo_microbial_overgrowth`: Low-FODMAP, antimicrobial spices (clove, thyme, oregano), 4-hour MMC spacing, no snacking.
5. `gerd_reflux_esophagitis`: Finish dinner 3h before bed, avoid mint/caffeine/deep-fried/spicy shutki, raise head of bed, small frequent meals.
6. `ibd_mucosal_inflammation`: Soft cooked restorative Bengali meals (lau, papaya, steamed fish), avoid roughage/raw greens/chili/dairy in flare.

In `anthropometrics.ts`, include `dyslipidemia_atherosclerosis`, `metabolic_syndrome`, `lada_early_pancreatic` in the 30% carb / 40% fat branch, and `sibo_microbial_overgrowth`, `gerd_reflux_esophagitis`, `ibd_mucosal_inflammation` in the 35% carb / 35% fat branch.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test test/cluster1_cluster2_functional_expansion.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/diseaseRules.ts src/engine/anthropometrics.ts test/cluster1_cluster2_functional_expansion.test.ts
git commit -m 'feat(engine): implement disease rules and macro targeting for Clusters 1 & 2'
```

---

### Task 3: Medication Database & DNI Engine Expansion

**Files:**
- Modify: `src/data/medicines.json`
- Modify: `src/engine/dniEngine.ts`
- Test: `test/cluster1_cluster2_functional_expansion.test.ts`

**Interfaces:**
- Consumes: Medicine entries and patient active medications
- Produces: DNI depletions, Betaine HCl contraindication suppression, Zinc & Folate cumulative UL warnings.

- [ ] **Step 1: Write the failing test**

```typescript
// in test/cluster1_cluster2_functional_expansion.test.ts
import { runDNIEngine, checkSupplementOverlaps } from '../src/engine/dniEngine';
import medicinesData from '../src/data/medicines.json';

describe('Task 3: Medicines & DNI Engine', () => {
  it('contains SGLT2i, Sulfonylurea, ARB, and H2 blocker classes in medicines.json', () => {
    const classes = medicinesData.map(m => m.drug_class);
    assert.ok(classes.some(c => c.includes('SGLT2')));
    assert.ok(classes.some(c => c.includes('Sulfonylurea')));
    assert.ok(classes.some(c => c.includes('Angiotensin') || c.includes('ARB')));
    assert.ok(classes.some(c => c.includes('H2 Receptor')));
    assert.ok(classes.some(c => c.includes('NSAID')));
  });

  it('flags cumulative Zinc upper limit (>40mg/day) and Folate (>1000mcg/day)', () => {
    const overlaps = checkSupplementOverlaps([
      { id: 'supp_zinc_carnosine', name_en: 'Zinc L-Carnosine 25mg', name_bn: 'জিংক কার্নোসিন', recommended_dose: '25mg', timing: 'with meal', approval_status: 'candidate' },
      { id: 'supp_multivitamin_zinc', name_en: 'Chelated Zinc 20mg', name_bn: 'চিলেটেড জিংক', recommended_dose: '20mg', timing: 'with meal', approval_status: 'candidate' }
    ]);
    assert.ok(overlaps.some(o => o.nutrient.toLowerCase().includes('zinc')));
  });

  it('suppresses Betaine HCl when NSAID medication is active', () => {
    const res = runDNIEngine({
      age: 50,
      gender: 'male',
      height_cm: 172,
      weight_kg: 75,
      activity_level: 'sedentary',
      selected_conditions: ['gerd_reflux_esophagitis'],
      active_medications: ['Naproxen']
    });
    assert.ok(!res.candidateSupplements.some(s => s.id === 'supp_betaine_hcl_pepsin'), 'Betaine HCl must be suppressed');
    assert.ok(res.criticalWarnings.some(w => w.warning_en.toLowerCase().includes('betaine') || w.warning_en.toLowerCase().includes('nsaid')));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test test/cluster1_cluster2_functional_expansion.test.ts`
Expected: FAIL with missing medicine classes.

- [ ] **Step 3: Implement in `src/data/medicines.json` and `src/engine/dniEngine.ts`**

1. Add entries to `medicines.json`:
   - `med_sglt2i`: Empagliflozin / Dapagliflozin
   - `med_sulfonylurea`: Gliclazide / Glimepiride
   - `med_glp1ra`: Semaglutide / Liraglutide
   - `med_arb_acei`: Losartan / Telmisartan / Ramipril
   - `med_h2_blocker`: Famotidine
   - `med_prokinetic`: Mebeverine / Domperidone
   - `med_5asa`: Mesalazine
   - `med_nsaid`: Naproxen / Ibuprofen / Diclofenac
2. In `dniEngine.ts`:
   - Add depletions: SGLT2i &rarr; Magnesium/Electrolytes; ARB &rarr; Zinc/Magnesium; H2 Blocker &rarr; B12/Iron/Calcium; 5-ASA &rarr; Folate; NSAID &rarr; Iron/Folate.
   - In `checkSupplementOverlaps()`: add Folate UL (1,000 mcg).
   - In `runDNIEngine()`: check for NSAID or active ulcer symptoms before offering `supp_betaine_hcl_pepsin`. If NSAIDs or ulcer are present, exclude `supp_betaine_hcl_pepsin` and log a bilingual critical warning.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test test/cluster1_cluster2_functional_expansion.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/medicines.json src/engine/dniEngine.ts test/cluster1_cluster2_functional_expansion.test.ts
git commit -m 'feat(dni): expand medicines, DNI depletions, and Betaine HCl safety guard'
```

---

### Task 4: Fasting Safety Engine Integration for SGLT2i & Sulfonylureas

**Files:**
- Modify: `src/clinical-safety/fastingSafetyEngine.ts:120-180`
- Test: `test/cluster1_cluster2_functional_expansion.test.ts`

**Interfaces:**
- Consumes: Patient active medications and requested fasting window.
- Produces: `FastingSafetyEligibility` enforcing SGLT2i cap at 16h and flagging HARD_STOP on prolonged fasting.

- [ ] **Step 1: Write the failing test**

```typescript
// in test/cluster1_cluster2_functional_expansion.test.ts
import { evaluateFastingSafetyEligibility } from '../src/clinical-safety/fastingSafetyEngine';

describe('Task 4: Fasting Safety for SGLT2i & Sulfonylureas', () => {
  it('caps fasting at 16h and blocks 18h fasting for SGLT2i patient', () => {
    const res = evaluateFastingSafetyEligibility(
      {
        age: 50,
        gender: 'female',
        height_cm: 160,
        weight_kg: 68,
        activity_level: 'sedentary',
        selected_conditions: ['t2d_ir'],
        active_medications: ['Empagliflozin']
      },
      18 // requested 18h fast
    );
    assert.strictEqual(res.is_eligible, false);
    assert.ok(res.safety_flags.some(f => f.code.includes('SGLT2') || f.message_en.includes('SGLT2')));
    assert.ok(res.max_safe_fasting_hours <= 16);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test test/cluster1_cluster2_functional_expansion.test.ts`
Expected: FAIL with SGLT2i not recognized or fasting allowed.

- [ ] **Step 3: Implement in `src/clinical-safety/fastingSafetyEngine.ts`**

Add detection of SGLT2 inhibitors (`empagliflozin`, `dapagliflozin`, `canagliflozin`, `jardiance`, `forxiga`) in active medications.
If present:
- Cap `max_safe_fasting_hours` to 14–16h.
- If requested fasting >16h, set `is_eligible: false` and append `SGLT2_PROLONGED_FASTING_HARD_STOP` explaining the risk of euglycemic DKA.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test test/cluster1_cluster2_functional_expansion.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/clinical-safety/fastingSafetyEngine.ts test/cluster1_cluster2_functional_expansion.test.ts
git commit -m 'feat(safety): enforce SGLT2i fasting ceiling and euglycemic DKA guard'
```

---

### Task 5: Functional Supplements Catalog Expansion

**Files:**
- Modify: `src/data/supplements.json`
- Test: `test/cluster1_cluster2_functional_expansion.test.ts`

**Interfaces:**
- Produces: 7 new functional supplements loaded into `supplements.json` with clinical purposes, contraindications, and Bangladeshi brands.

- [ ] **Step 1: Write the failing test**

```typescript
// in test/cluster1_cluster2_functional_expansion.test.ts
import supplementsData from '../src/data/supplements.json';

describe('Task 5: Functional Supplements Catalog', () => {
  it('contains all 7 new functional supplements with required fields', () => {
    const requiredIds = [
      'supp_alpha_lipoic_acid',
      'supp_inositol_40_1',
      'supp_active_folate_bcomplex',
      'supp_zinc_carnosine',
      'supp_l_glutamine',
      'supp_betaine_hcl_pepsin',
      'supp_curcumin_phytosome'
    ];
    for (const id of requiredIds) {
      const supp = supplementsData.find(s => s.id === id);
      assert.ok(supp, `Supplement ${id} must exist`);
      assert.ok(supp.name_en && supp.name_bn, `${id} must have bilingual names`);
      assert.ok(supp.dose && supp.timing, `${id} must have dose and timing`);
      assert.ok(supp.clinical_purpose_en && supp.clinical_purpose_bn, `${id} must have purposes`);
      assert.ok(Array.isArray(supp.contraindications), `${id} must have contraindications`);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test test/cluster1_cluster2_functional_expansion.test.ts`
Expected: FAIL with missing supplement IDs.

- [ ] **Step 3: Implement in `src/data/supplements.json`**

Add entries for:
1. `supp_alpha_lipoic_acid`: R-ALA 300mg, empty stomach morning, mitochondrial antioxidant.
2. `supp_inositol_40_1`: Myo & D-Chiro Inositol (2000mg/50mg), with breakfast, ovarian & insulin sensitizer.
3. `supp_active_folate_bcomplex`: L-Methylfolate 400mcg + Methylcobalamin, with lunch.
4. `supp_zinc_carnosine`: Zinc L-Carnosine 37.5mg (8mg elemental Zn), empty stomach or with light meal.
5. `supp_l_glutamine`: 5g pure powder, empty stomach morning/bedtime, mucosal barrier repair.
6. `supp_betaine_hcl_pepsin`: 500mg/dose, mid-protein meal, hypochlorhydria, contraindicated in active ulcer.
7. `supp_curcumin_phytosome`: 500mg, with fatty meal (lunch), anti-inflammatory.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test test/cluster1_cluster2_functional_expansion.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/supplements.json test/cluster1_cluster2_functional_expansion.test.ts
git commit -m 'feat(supplements): expand functional medicine supplements catalog'
```

---

### Task 6: Functional Laboratory Biomarkers & Derived Metrics

**Files:**
- Modify: `src/engine/labAnalyzer.ts`
- Test: `test/cluster1_cluster2_functional_expansion.test.ts`

**Interfaces:**
- Consumes: Laboratory observations.
- Produces: Derived Non-HDL Cholesterol, Fasting Insulin, HOMA-IR, hs-CRP, and Homocysteine evaluations.

- [ ] **Step 1: Write the failing test**

```typescript
// in test/cluster1_cluster2_functional_expansion.test.ts
import { analyzeFunctionalBiomarkers } from '../src/engine/labAnalyzer';

describe('Task 6: Lab Analyzer Biomarkers', () => {
  it('automatically derives Non-HDL and evaluates Fasting Insulin and Homocysteine', () => {
    const analysis = analyzeFunctionalBiomarkers({
      total_cholesterol: 230,
      hdl: 45,
      fasting_insulin: 14.5,
      homocysteine: 16.2
    });
    // Non-HDL = 230 - 45 = 185 mg/dL (>130 is high/abnormal)
    assert.strictEqual(analysis.derived_non_hdl, 185);
    assert.strictEqual(analysis.non_hdl_status, 'abnormal_high');
    // Fasting Insulin > 6 µIU/mL is sub-optimal in functional medicine
    assert.strictEqual(analysis.fasting_insulin_status, 'borderline_high');
    // Homocysteine > 15 is abnormal
    assert.strictEqual(analysis.homocysteine_status, 'abnormal_high');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test test/cluster1_cluster2_functional_expansion.test.ts`
Expected: FAIL with derived Non-HDL or statuses not populated.

- [ ] **Step 3: Implement in `src/engine/labAnalyzer.ts`**

Add evaluation logic for:
- Derived Non-HDL (`total_cholesterol - hdl`): Optimal <100, Borderline 100-130, Abnormal >130.
- Fasting Insulin: Functional Optimal 2–6 µIU/mL, Borderline 6.1–12 µIU/mL, High >12 µIU/mL.
- HOMA-IR: Optimal <1.4, Borderline 1.4–1.9, Insulin Resistant >1.9.
- hs-CRP: Optimal <0.5 mg/L, Low-risk 0.5–1.0, Moderate 1.0–3.0, High >3.0.
- Homocysteine: Functional Optimal 6–9 µmol/L, Borderline 9.1–14.9, High ≥15 µmol/L.
- Preserve existing sex-stratified Ferritin and TG/HDL logic completely.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test test/cluster1_cluster2_functional_expansion.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/labAnalyzer.ts test/cluster1_cluster2_functional_expansion.test.ts
git commit -m 'feat(labs): add derived Non-HDL, Fasting Insulin, and Homocysteine functional markers'
```

---

### Task 7: Full Regression Battery & Acceptance Verification

**Files:**
- Test: All suites across the codebase

- [ ] **Step 1: Run comprehensive TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 2: Run unit and integration test suite**

Run: `npm test`
Expected: All 814+ tests PASS (0 failures).

- [ ] **Step 3: Run Python QA referential integrity gates**

Run: `npm run test:step05:qa`
Expected: All 12 QA gates PASS (0 errors).

- [ ] **Step 4: Run Playwright browser E2E test suite**

Run: `npm run test:e2e`
Expected: All 140/140 E2E assertions PASS across Steps 01 to 05.

- [ ] **Step 5: Run Next.js production build**

Run: `npm run build`
Expected: Clean static export generated in `/out`.

- [ ] **Step 6: Final commit and sync to main**

```bash
git add .
git commit -m 'chore: complete functional medicine clinical expansion verification for Clusters 1 & 2'
git checkout main
git merge feature/phase1-premium-design-foundation --no-edit
git push origin main
git checkout feature/phase1-premium-design-foundation
git push origin feature/phase1-premium-design-foundation
```
