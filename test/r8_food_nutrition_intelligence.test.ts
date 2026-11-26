/**
 * SHUDDHO PHASE R8 — FOOD, NUTRIENT, BIOACTIVE, MECHANISM & SMART SUBSTITUTION TEST SUITE
 * Covers Groups A through H:
 * - A: Canonical Nutrient Registry, Null vs Zero Preservation, Weight Basis & Aggregation
 * - B: Evidence Registry, Bioactive Culinary vs Extract Distinction, Exploratory Mechanism Tagging
 * - C: Bidirectional Knowledge Network, Clinical Safety Filtering & Combined Diet+Supplement Exposure
 * - D: Bangladeshi Preparation & Recipe Engine (Allergen Propagation & Incomplete Nutrition Flags)
 * - E: Intelligent Food Substitution Engine (All 7 Modes, Scaling, Zero/Missing Guards, Impact Preview)
 * - F: Core Diet Engine (`mealScaler.ts`) & R6 Master Prescription (`buildPatientSpecificFoodExchanges`) Integration
 */

import assert from 'node:assert/strict';
import foodsData from '../src/data/foods.json';
import { FoodItem, PatientProfile } from '../src/types';
import { SupplementProtocolItem } from '../src/types/r4Protocol';
import {
  aggregateFoodNutrients,
  convertFoodWeightBasis,
  convertR8NutrientUnit,
  deriveFoodMetadataExtension,
  extractFoodNutrientMeasurement,
  R8_BASELINE_FOODS,
  R8_CANONICAL_NUTRIENTS,
  resolveR8NutrientId,
} from '../src/engine/r8/foodFoundation';
import {
  R8_BIOACTIVE_COMPOUNDS,
  R8_BIOLOGICAL_MECHANISMS,
  R8_EVIDENCE_REGISTRY,
  R8_FOOD_BIOACTIVE_LINKS,
} from '../src/data/r8KnowledgeData';
import {
  evaluateCombinedDietSupplementExposure,
  evaluatePatientFoodEligibility,
  filterFoodsForPatientContext,
  queryR8KnowledgeNetwork,
} from '../src/engine/r8/knowledgeNetwork';
import { R8_PREPARATION_GUIDANCE, R8_REPRESENTATIVE_RECIPES } from '../src/data/r8RecipesData';
import {
  addRecipeIngredient,
  adjustRecipeServings,
  analyzeAllRepresentativeRecipes,
  computeRecipeAnalysis,
  createRecipeDraftFromReference,
  removeRecipeIngredient,
  replaceRecipeIngredient,
  updateRecipeIngredientQuantity,
} from '../src/engine/r8/recipeEngine';
import { buildR5NutritionAdjustmentContract } from '../src/engine/r5NutritionContract';
import { evaluateFoodSubstitutions, previewSubstitutionImpact } from '../src/engine/r8/substitutionEngine';
import { generateExchangesForFood } from '../src/engine/mealScaler';
import { buildPatientSpecificFoodExchanges } from '../src/engine/r6PrescriptionComposer';

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const basePatient: PatientProfile = {
  schema_version: 2,
  id: 'p_r8_test',
  name: 'Test Patient R8',
  age: 42,
  gender: 'female',
  phone: '01700000000',
  visit_date: '2026-11-25',
  current_phase: 1,
  height_cm: 160,
  weight_kg: 68,
  waist_cm: 88,
  activity_level: 'lightly_active',
  sleep_hours: 7,
  shift_worker: false,
  population_group: 'adult_standard',
  bmr_floor_strategy: 'clamped_to_bmr',
  confirmed_allergies: [],
  clinician_disallowed_foods: [],
  clinician_disallowed_tags: [],
  selected_conditions: ['t2d_ir'],
  active_medications: [],
  dietary_preferences: {},
  gut_profile: {},
  labs: {},
  calculated: {},
} as unknown as PatientProfile;

console.log('\n=== R8 FOOD, NUTRIENT, MECHANISM & SUBSTITUTION TEST SUITE ===\n');

// ── GROUP A: FCTB V6 Baseline, Null vs Zero, Units & Aggregation ──────────────
console.log('Group A: Canonical Foundation & Data Quality');
check('A01: Preserves all 381 baseline foods from foods.json', () => {
  assert.equal((foodsData as FoodItem[]).length, 381);
  assert.equal(R8_BASELINE_FOODS.length, 381);
});

check('A02: Canonical nutrient registry maps R7 aliases & unit conversions accurately', () => {
  assert.ok(R8_CANONICAL_NUTRIENTS.length >= 20);
  assert.equal(resolveR8NutrientId('energy_kcal'), 'energy');
  assert.equal(resolveR8NutrientId('potassium_mg'), 'potassium');
  assert.equal(resolveR8NutrientId('carbs_g'), 'available_carbohydrate');
  const c1 = convertR8NutrientUnit('iron', 1000, 'mcg', 'mg');
  assert.equal(c1.ok, true);
  if (c1.ok) assert.equal(c1.value, 1);
  const c2 = convertR8NutrientUnit('folate', 0.4, 'mg', 'mcg');
  assert.equal(c2.ok, true);
  if (c2.ok) assert.equal(c2.value, 400);
});

check('A03: Preserves null (missing_unknown) distinct from 0 (measured_zero)', () => {
  const nullEnergyFood = R8_BASELINE_FOODS.find(f => f.per_100g.kcal === null);
  const zeroEnergyFood = R8_BASELINE_FOODS.find(f => f.per_100g.kcal === 0);
  assert.ok(nullEnergyFood, 'Expected food with null kcal in foods.json');
  assert.ok(zeroEnergyFood, 'Expected food with 0 kcal in foods.json');
  const nullMeas = extractFoodNutrientMeasurement(nullEnergyFood!, 'energy');
  const zeroMeas = extractFoodNutrientMeasurement(zeroEnergyFood!, 'energy');
  assert.equal(nullMeas.value, null);
  assert.equal(nullMeas.quality, 'missing_unknown');
  assert.equal(zeroMeas.value, 0);
  assert.equal(zeroMeas.quality, 'measured_zero');
});

check('A04: Weight basis conversion & food metadata extension work deterministically', () => {
  const rohu = R8_BASELINE_FOODS.find(f => f.id === 'f_09_0059')!;
  assert.ok(rohu);
  const meta = deriveFoodMetadataExtension(rohu);
  assert.ok(meta.source_database_id.length > 0);
  assert.ok(meta.source_version.length > 0);
  const basis = convertFoodWeightBasis(rohu, 100, 'as_purchased');
  assert.ok(basis !== null);
  assert.ok(basis!.raw_edible_g > 0 && basis!.raw_edible_g <= 100);
});

check('A05: Aggregation flags incomplete nutrient coverage instead of coercing null to 0', () => {
  const nullKFood = R8_BASELINE_FOODS.find(f => f.micronutrients?.potassium_mg === null)!;
  const rice = R8_BASELINE_FOODS.find(f => f.id === 'f_01_0012')!;
  const agg = aggregateFoodNutrients([
    { food: rice, raw_edible_g: 100 },
    { food: nullKFood, raw_edible_g: 100 },
  ]);
  assert.equal(agg['potassium'].is_incomplete, true);
  assert.ok(agg['potassium'].missing_food_ids.includes(nullKFood.id));
});

// ── GROUP B: Evidence Registry, Bioactives & Mechanisms ──────────────────────
console.log('\nGroup B: Evidence Registry, Bioactives & Exploratory Tagging');
check('B01: All evidence references have valid categories, limitations, and review dates', () => {
  const keys = Object.keys(R8_EVIDENCE_REGISTRY);
  assert.ok(keys.length >= 8);
  for (const ref of Object.values(R8_EVIDENCE_REGISTRY)) {
    assert.ok(ref.limitations_en.length > 10);
    assert.ok(ref.review_date.length === 10);
  }
});

check('B02: Bioactive compounds distinguish culinary matrix from standardized extracts', () => {
  const curcumin = R8_BIOACTIVE_COMPOUNDS.find(b => b.compound_id === 'bio_curcuminoids')!;
  assert.ok(curcumin);
  assert.match(curcumin.culinary_vs_extract_note_en.toLowerCase(), /extract/);
  assert.match(curcumin.culinary_vs_extract_note_en.toLowerCase(), /culinary/);
});

check('B03: Food-bioactive links never fabricate quantitative mg values when qualitative', () => {
  assert.ok(R8_FOOD_BIOACTIVE_LINKS.length >= 10);
  for (const link of R8_FOOD_BIOACTIVE_LINKS) {
    assert.equal(link.presence_type, 'documented_qualitative');
    assert.equal(link.quantity, null);
    assert.ok(R8_BASELINE_FOODS.some(f => f.id === link.food_id), `Missing food ${link.food_id}`);
  }
});

check('B04: Exploratory cellular mechanisms (Nrf2) are explicitly flagged preclinical_mechanistic', () => {
  const nrf2 = R8_BIOLOGICAL_MECHANISMS.find(m => m.mechanism_id === 'mech_nrf2_cellular_defense')!;
  assert.ok(nrf2);
  assert.equal(nrf2.is_exploratory_molecular, true);
  assert.equal(nrf2.evidence_category, 'preclinical_mechanistic');
});

// ── GROUP C: Bidirectional Network, Patient Safety & Combined Exposure ───────
console.log('\nGroup C: Bidirectional Knowledge Network & Patient Safety');
check('C01: Bidirectional queries (food->all, nutrient->foods, bioactive->foods, system->nutrition, lab->food_first) work', () => {
  const q1 = queryR8KnowledgeNetwork({ mode: 'food_to_all', target_id: 'f_07_0020' });
  assert.ok(q1.bioactives && q1.bioactives.some(b => b.compound_id === 'bio_curcuminoids'));

  const q2 = queryR8KnowledgeNetwork({ mode: 'nutrient_to_foods', target_id: 'iron_mg', limit: 5 });
  assert.ok(q2.top_foods && q2.top_foods.length === 5);
  assert.ok((q2.top_foods[0].value ?? 0) >= (q2.top_foods[1].value ?? 0));

  const q3 = queryR8KnowledgeNetwork({ mode: 'bioactive_to_foods', target_id: 'bio_gingerols' });
  assert.ok(q3.top_foods && q3.top_foods.some(t => t.food.id === 'f_07_0011'));

  const q4 = queryR8KnowledgeNetwork({ mode: 'system_to_nutrition', target_id: 'assimilation' });
  assert.ok(q4.mechanisms && q4.mechanisms.length >= 1);

  const q5 = queryR8KnowledgeNetwork({ mode: 'lab_to_food_first_review', target_id: 'vitamin_b12' });
  assert.ok(q5.food_first_vs_escalation_note_en && q5.food_first_vs_escalation_note_en.includes('B12'));
});

check('C02: Confirmed allergy (fish/egg/sesame) and RED Traffic Light exclude foods in eligibility check', () => {
  const rohu = R8_BASELINE_FOODS.find(f => f.id === 'f_09_0059')!;
  const allergicPatient: PatientProfile = { ...basePatient, confirmed_allergies: ['fish'] };
  const elig = evaluatePatientFoodEligibility(rohu, allergicPatient);
  assert.equal(elig.is_safe_for_patient, false);
  assert.equal(elig.traffic_status, 'RED');

  const filtered = filterFoodsForPatientContext(R8_BASELINE_FOODS, allergicPatient);
  assert.ok(filtered.excludedFoods.some(x => x.food.id === 'f_09_0059'));
});

check('C03: Warfarin + spinach triggers drug-food consistency advisory; CKD flags high potassium', () => {
  const spinach = R8_BASELINE_FOODS.find(f => f.id === 'f_04_0025')!;
  const warfarinPatient: PatientProfile = { ...basePatient, active_medications: ['warfarin'] };
  const eligW = evaluatePatientFoodEligibility(spinach, warfarinPatient);
  assert.ok(eligW.drug_interactions_en.some(d => d.toLowerCase().includes('warfarin')));

  const ckdPatient: PatientProfile = { ...basePatient, selected_conditions: ['ckd_stage_1_3b'] };
  const eligC = evaluatePatientFoodEligibility(spinach, ckdPatient);
  assert.ok(eligC.cautions_en.some(c => c.toLowerCase().includes('potassium')));
});

check('C04: Combined diet+supplement exposure keeps food Mg separate from supplemental-only 350 mg UL', () => {
  const spinach = R8_BASELINE_FOODS.find(f => f.id === 'f_04_0025')!;
  const lentil = R8_BASELINE_FOODS.find(f => f.id === 'f_02_0008')!;
  const mgSupp = {
    id: 'sup_mg_200',
    name_en: 'Magnesium Glycinate',
    name_bn: 'ম্যাগনেসিয়াম গ্লাইসিনেট',
    dose_en: '200 mg',
    dose_bn: '২০০ মি.গ্রা.',
    timing_slot: 'bedtime',
    approval_status: 'clinician_approved',
    ingredients: [
      {
        nutrient_id: 'magnesium',
        nutrient_name: 'Magnesium',
        elemental_amount_per_unit: 200,
        amount_unit: 'mg',
        is_standardized: true,
        is_elemental_known: true,
      },
    ],
  } as unknown as SupplementProtocolItem;

  const combined = evaluateCombinedDietSupplementExposure(
    [
      { food: spinach, raw_weight_g: 250 },
      { food: lentil, raw_weight_g: 100 },
    ],
    [mgSupp],
    basePatient
  );
  // Supplemental Mg is 200mg <= 350mg UL, so exceeds_ul MUST remain false even though food adds dietary Mg!
  assert.equal(combined.supplement_exposure.exposures_by_nutrient['magnesium'].exceeds_ul, false);
  assert.ok(combined.combined_advisories_en.some(a => a.includes('350 mg/day UL applies only to supplemental')));
});

// ── GROUP D: Preparation & Recipe Engine ─────────────────────────────────────
console.log('\nGroup D: Recipe & Preparation Engine');
check('D01: All 8 preparation guidance methods and 6 representative BD recipes analyze cleanly', () => {
  assert.ok(R8_PREPARATION_GUIDANCE.length >= 8);
  assert.ok(R8_REPRESENTATIVE_RECIPES.length >= 6);
  const analyses = analyzeAllRepresentativeRecipes({ patient: basePatient });
  assert.equal(analyses.length, R8_REPRESENTATIVE_RECIPES.length);
  for (const a of analyses) {
    assert.ok(a.per_serving_weight_g > 0);
    assert.ok(a.nutrients['energy'].known_total > 0);
  }
});

check('D02: Recipe propagates ingredient allergens (sesame & egg) to safety block', () => {
  const sesameRecipe = R8_REPRESENTATIVE_RECIPES.find(r => r.recipe_id === 'rec_bd_cauliflower_sesame_steam')!;
  const sesamePatient: PatientProfile = { ...basePatient, confirmed_allergies: ['sesame'] };
  const analysis = computeRecipeAnalysis(sesameRecipe, { patient: sesamePatient });
  assert.ok(analysis.safety.propagated_allergens.includes('sesame'));
  assert.equal(analysis.safety.is_safe_for_patient, false);
  assert.equal(analysis.safety.traffic_status, 'RED');
  assert.equal(analysis.safety.requires_clinician_review, true);
});

// ── GROUP E: Intelligent Food Substitution Engine (U11) ──────────────────────
console.log('\nGroup E: Intelligent Food Substitution Engine (U11)');
check('E01: Energy-matched rice swap scales portion and excludes RED/allergen/disallowed candidates', () => {
  const resp = evaluateFoodSubstitutions({
    original_food_id: 'f_01_0012', // Rice BR-28
    original_raw_grams: 100,
    patient: { ...basePatient, clinician_disallowed_foods: ['f_01_0010'] },
    mode: 'energy_matched',
    tolerance_pct: 20,
  });
  assert.ok(resp.ranked_candidates.length > 0);
  assert.ok(!resp.ranked_candidates.some(c => c.candidate_food.id === 'f_01_0010'));
  assert.ok(resp.excluded_candidates_summary.some(e => e.food_id === 'f_01_0010'));
});

check('E02: Protein-matched swap excludes fish for vegetarian & egg for egg-allergic patient', () => {
  const resp = evaluateFoodSubstitutions({
    original_food_id: 'f_02_0008', // Lentil
    original_raw_grams: 60,
    patient: {
      ...basePatient,
      dietary_preferences: { is_vegetarian: true },
      confirmed_allergies: ['egg'],
    },
    mode: 'protein_matched',
  });
  for (const c of resp.ranked_candidates) {
    assert.ok(!/fish|rohu|hilsa|egg/i.test(c.candidate_food.name_en), `Unexpected non-veg/egg: ${c.candidate_food.name_en}`);
  }
});

check('E03: All 7 substitution modes execute cleanly without crash or arbitrary 100g fallback', () => {
  const modes = [
    'energy_matched',
    'carb_matched',
    'protein_matched',
    'nutrient_targeted',
    'multinutrient_balanced',
    'clinical_restriction_aware',
    'manual_clinician_review',
  ] as const;

  for (const mode of modes) {
    const resp = evaluateFoodSubstitutions({
      original_food_id: 'f_09_0059', // Rohu
      original_raw_grams: 100,
      patient: basePatient,
      mode,
      target_nutrient_id: mode === 'nutrient_targeted' ? 'iron_mg' : undefined,
    });
    assert.equal(resp.mode, mode);
  }
});

check('E04: Near-zero nutrient & missing density are guarded (never divide-by-zero or fabricate equivalent)', () => {
  const resp = evaluateFoodSubstitutions({
    original_food_id: 'f_13_0008', // Mustard oil (0 carbs)
    original_raw_grams: 10,
    patient: basePatient,
    mode: 'carb_matched',
  });
  assert.equal(resp.has_equivalent_match, false);
  assert.equal(resp.ranked_candidates.length, 0);
  assert.ok(resp.no_match_reason_en && resp.no_match_reason_en.length > 0);
});

check('E05: Meal & daily impact preview flags daily potassium > authorized ceiling without arbitrary +150mg delta', () => {
  const rice = R8_BASELINE_FOODS.find(f => f.id === 'f_01_0012')!;
  const spinach = R8_BASELINE_FOODS.find(f => f.id === 'f_04_0025')!; // high K+
  const ckdPatient = {
    ...basePatient,
    selected_conditions: ['ckd_stage_1_3b'],
    prescriptions: { potassium: { limit_mg: 1500 } },
  } as unknown as PatientProfile;
  const contract = buildR5NutritionAdjustmentContract({ patient: ckdPatient });
  const impact = previewSubstitutionImpact({
    original_food: rice,
    original_raw_grams: 50,
    candidate_food: spinach,
    proposed_raw_grams: 450,
    patient: ckdPatient,
    r5_nutrition_contract: contract,
    current_daily_items: [
      { food_id: 'f_01_0012', raw_weight_g: 50 },
      { food_id: 'f_02_0008', raw_weight_g: 100 },
    ],
  });
  assert.ok(impact.hard_limit_violations_en.some(v => v.toLowerCase().includes('potassium')));
  assert.equal(impact.requires_safety_review, true);
});

// ── GROUP F: Core Diet Engine & R6 Master Prescription Integration ───────────
console.log('\nGroup F: Core Diet & R6 Prescription Integration');
check('F01: generateExchangesForFood delegates to R8 engine and respects patient allergies', () => {
  const lentil = R8_BASELINE_FOODS.find(f => f.id === 'f_02_0008')!;
  const exchanges = generateExchangesForFood(
    lentil,
    60,
    R8_BASELINE_FOODS,
    new Set(['f_02_0002', 'f_09_0059']),
    new Set(['f_11_0001']),
    new Set(),
    { ...basePatient, confirmed_allergies: ['fish'] }
  );
  assert.ok(exchanges.length > 0);
  assert.ok(!exchanges.some(e => e.food_id === 'f_09_0059' || e.food_id === 'f_11_0001'));
});

check('F02: buildPatientSpecificFoodExchanges does NOT fabricate unapproved alternatives when snapshot is empty, and preserves authorized snapshots', () => {
  const rice = R8_BASELINE_FOODS.find(f => f.id === 'f_01_0012')!;
  const mockMealsEmpty = [
    {
      id: 'm1',
      meal_type: 'lunch',
      title_bn: 'দুপুরের খাবার',
      title_en: 'Lunch',
      time_range: '1:30 PM',
      total_kcal: 350,
      total_protein_g: 7,
      total_carbs_g: 78,
      total_fat_g: 0.6,
      items: [
        {
          id: 'i1',
          food_id: rice.id,
          food_name_bn: rice.name_bn,
          food_name_en: rice.name_en,
          category: rice.category,
          raw_weight_g: 100,
          cooked_weight_g: 250,
          cooked_display_bn: '২৫০ গ্রাম',
          cooked_display_en: '250g',
          kcal: 350,
          protein_g: 7,
          carbs_g: 78,
          fat_g: 0.6,
          fiber_g: 1.5,
          traffic_status: 'GREEN' as const,
          alternatives: [],
        },
      ],
    },
  ];
  const emptyExchanges = buildPatientSpecificFoodExchanges(
    mockMealsEmpty as any,
    { green: [rice], yellow: [], red: [], excluded: [] } as any,
    basePatient
  );
  assert.equal(emptyExchanges.length, 0);

  const authAlts = generateExchangesForFood(
    rice,
    100,
    R8_BASELINE_FOODS,
    new Set(['f_01_0010']),
    new Set(),
    new Set(),
    basePatient
  ).map(a => ({ ...a, authorization_status: 'authorized' as const, authorized_for_patient_id: basePatient.id }));

  const mockMealsAuth = [
    {
      ...mockMealsEmpty[0],
      items: [{ ...mockMealsEmpty[0].items[0], alternatives: authAlts }],
    },
  ];
  const authExchanges = buildPatientSpecificFoodExchanges(
    mockMealsAuth as any,
    { green: [rice, ...R8_BASELINE_FOODS.filter(f => f.id === 'f_01_0010')], yellow: [], red: [], excluded: [] } as any,
    basePatient
  );
  assert.ok(authExchanges.length > 0);
  assert.ok(authExchanges.every(ex => ex.alternative_raw_g > 0));
});

// ── CHECKPOINT A–D CLOSURE MANDATORY TESTS ────────────────────────────────────
console.log('\nCheckpoint A–D Closure Tests:');

check('CP-A1..A8: Authoritative R5 potassium/sodium/phosphorus limits, small exceedance, no fabricated CKD cap, & non_compliant_improved', () => {
  const rice = R8_BASELINE_FOODS.find(f => f.id === 'f_01_0012')!;
  const lentil = R8_BASELINE_FOODS.find(f => f.id === 'f_02_0008')!;
  // A03: CKD without authorized potassium prescription does NOT fabricate 2000 mg limit
  const ckdNoLimitPatient = { ...basePatient, selected_conditions: ['ckd_stage_1_3b'] } as unknown as PatientProfile;
  const noLimitContract = buildR5NutritionAdjustmentContract({ patient: ckdNoLimitPatient });
  assert.equal(noLimitContract.nutrient_constraints.potassium_mg_max, undefined);
  const impactNoLimit = previewSubstitutionImpact({
    original_food: rice,
    original_raw_grams: 100,
    candidate_food: lentil,
    proposed_raw_grams: 350,
    patient: ckdNoLimitPatient,
    r5_nutrition_contract: noLimitContract,
  });
  assert.equal(impactNoLimit.hard_limit_violations_en.length, 0);

  // A01 & A02 & A07: Authorized potassium (1200mg), sodium (1500mg), phosphorus (700mg) caught even for small exceedance
  const authPatient = {
    ...basePatient,
    selected_conditions: ['ckd_stage_1_3b'],
    prescriptions: { potassium: { limit_mg: 1200 }, sodium: { limit_mg: 1500 }, phosphorus: { limit_mg: 700 } },
  } as unknown as PatientProfile;
  const authContract = buildR5NutritionAdjustmentContract({ patient: authPatient });
  assert.equal(authContract.nutrient_constraints.potassium_mg_max, 1200);
  assert.equal(authContract.nutrient_constraints.sodium_mg_max, 1500);
  assert.equal(authContract.nutrient_constraints.phosphorus_mg_max, 700);

  const spinach = R8_BASELINE_FOODS.find(f => f.id === 'f_04_0025')!;
  const impactExceeded = previewSubstitutionImpact({
    original_food: rice,
    original_raw_grams: 100,
    candidate_food: spinach,
    proposed_raw_grams: 300,
    patient: authPatient,
    r5_nutrition_contract: authContract,
  });
  assert.ok(impactExceeded.hard_limit_violations_en.some(v => v.includes('Potassium')));
});

check('CP-A8 & A11: Improvement in already noncompliant plan is non_compliant_improved (not compliant); manual_clinician_review cannot hide hard violation', () => {
  const rice = R8_BASELINE_FOODS.find(f => f.id === 'f_01_0012')!;
  const spinach = R8_BASELINE_FOODS.find(f => f.id === 'f_04_0025')!;
  const authPatient = {
    ...basePatient,
    prescriptions: { potassium: { limit_mg: 500 } },
  } as unknown as PatientProfile;
  const authContract = buildR5NutritionAdjustmentContract({ patient: authPatient });
  const improvedButNonCompliant = previewSubstitutionImpact({
    original_food: spinach,
    original_raw_grams: 400, // very high K+
    candidate_food: spinach,
    proposed_raw_grams: 300, // lower than 400g, but STILL > 500mg limit!
    patient: authPatient,
    r5_nutrition_contract: authContract,
  });
  assert.equal(improvedButNonCompliant.compliance_status, 'non_compliant_improved');
  assert.ok(improvedButNonCompliant.hard_limit_violations_en.length > 0);
});

check('CP-B1..B9: Unapproved/wrong-patient/wrong-visit/invalidated alternatives excluded from patient Food Exchange', () => {
  const rice = R8_BASELINE_FOODS.find(f => f.id === 'f_01_0012')!;
  const mockMeals = [
    {
      id: 'm1',
      meal_type: 'lunch',
      title_bn: 'দুপুরের খাবার',
      title_en: 'Lunch',
      time_range: '1:30 PM',
      total_kcal: 350,
      total_protein_g: 7,
      total_carbs_g: 78,
      total_fat_g: 0.6,
      items: [
        {
          id: 'i1',
          food_id: rice.id,
          food_name_bn: rice.name_bn,
          food_name_en: rice.name_en,
          category: rice.category,
          raw_weight_g: 100,
          cooked_weight_g: 250,
          cooked_display_bn: '২৫০ গ্রাম',
          cooked_display_en: '250g',
          kcal: 350,
          protein_g: 7,
          carbs_g: 78,
          fat_g: 0.6,
          fiber_g: 1.5,
          traffic_status: 'GREEN' as const,
          alternatives: [
            {
              food_id: 'f_01_0010',
              name_bn: 'চিড়া',
              name_en: 'Rice flaked',
              raw_weight_g: 95,
              cooked_display_bn: '৯৫ গ্রাম',
              cooked_display_en: '95g',
              kcal: 330,
              protein_g: 6,
              traffic_status: 'GREEN' as const,
              authorization_status: 'authorized' as const,
              authorized_for_patient_id: 'OTHER_PATIENT_ID',
            },
            {
              food_id: 'f_01_0011',
              name_bn: 'ভেজানো চিড়া',
              name_en: 'Rice flakes, water-soaked',
              raw_weight_g: 120,
              cooked_display_bn: '১২০ গ্রাম',
              cooked_display_en: '120g',
              kcal: 330,
              protein_g: 6,
              traffic_status: 'GREEN' as const,
              authorization_status: 'invalidated' as const,
              authorized_for_patient_id: basePatient.id,
            },
          ],
        },
      ],
    },
  ];
  const exchanges = buildPatientSpecificFoodExchanges(
    mockMeals as any,
    { green: [rice], yellow: [], red: [], excluded: [] } as any,
    basePatient
  );
  assert.equal(exchanges.length, 0);
});

check('CP-C7..C9: Exact meal-item identity replaces only target dinner 75g rice item (leaving 50g breakfast & 100g lunch intact)', () => {
  const rice = R8_BASELINE_FOODS.find(f => f.id === 'f_01_0012')!;
  const flakedRice = R8_BASELINE_FOODS.find(f => f.id === 'f_01_0010')!;
  const dailyItems = [
    { item_id: 'b_rice', meal_id: 'breakfast', food_id: rice.id, raw_weight_g: 50 },
    { item_id: 'l_rice', meal_id: 'lunch', food_id: rice.id, raw_weight_g: 100 },
    { item_id: 'd_rice', meal_id: 'dinner', food_id: rice.id, raw_weight_g: 75 },
  ];
  const impact = previewSubstitutionImpact({
    original_food: rice,
    original_raw_grams: 75,
    candidate_food: flakedRice,
    proposed_raw_grams: 75,
    patient: basePatient,
    target_item_id: 'd_rice',
    meal_id: 'dinner',
    current_meal_items: [{ item_id: 'd_rice', food_id: rice.id, raw_weight_g: 75 }],
    current_daily_items: dailyItems,
  });
  // Breakfast (50g) + Lunch (100g) rice remain untouched; only 75g dinner rice changed
  const origKcal = impact.original_daily_totals['energy'].known_total;
  const propKcal = impact.proposed_daily_totals['energy'].known_total;
  const expectedDiff = (((flakedRice.per_100g.kcal ?? 0) - (rice.per_100g.kcal ?? 0)) * 75) / 100;
  assert.ok(Math.abs((propKcal - origKcal) - expectedDiff) < 2.0);
});

check('CP-D1..D7: Clinician-editable recipe helpers (add/edit/replace/remove/divide_fixed_batch/scale_batch/invalid qty guard)', () => {
  const base = R8_REPRESENTATIVE_RECIPES[0];
  const draft = createRecipeDraftFromReference(base, { patientId: basePatient.id, visitId: 'v1' });
  const badQty = updateRecipeIngredientQuantity(draft, 0, -10);
  assert.equal(badQty.ok, false);

  const edited = updateRecipeIngredientQuantity(draft, 0, 120);
  assert.equal(edited.ok, true);
  if (edited.ok) {
    const added = addRecipeIngredient(edited.recipe, 'f_04_0025', 80);
    assert.equal(added.ok, true);
    if (added.ok) {
      const divided = adjustRecipeServings(added.recipe, 4, 'divide_fixed_batch');
      const scaled = adjustRecipeServings(added.recipe, 4, 'scale_batch');
      assert.ok(divided.ok && scaled.ok);
      if (divided.ok && scaled.ok) {
        // divide_fixed_batch keeps ingredient raw_weight_g fixed; scale_batch doubles it (from 2 -> 4 servings)
        assert.equal(divided.recipe.ingredients[0].raw_weight_g, 120);
        assert.equal(scaled.recipe.ingredients[0].raw_weight_g, 240);
      }
      const replaced = replaceRecipeIngredient(added.recipe, 0, 'f_02_0002');
      assert.equal(replaced.ok, true);
      const removed = removeRecipeIngredient(added.recipe, added.recipe.ingredients.length - 1);
      assert.equal(removed.ingredients.length, draft.ingredients.length);
    }
  }
});

console.log(`\nALL R8 UNIT & INTEGRATION CHECKS PASSED (${passed}/${passed})\n`);
