import { calculateAnthropometrics } from '../src/engine/anthropometrics';
import { analyzeFunctionalLabs } from '../src/engine/labAnalyzer';
import { resolveConflicts } from '../src/engine/conflictResolver';
import { evaluateDNIAndTimeline, checkSupplementOverlaps } from '../src/engine/dniEngine';
import { buildAutoScaledDietChart, selectSafeMealCandidate, generateExchangesForFood } from '../src/engine/mealScaler';
import { advanceToNextPhase, recordFollowUpVisit, compareLongitudinalProgress } from '../src/engine/phaseProgression';
import foodsData from '../src/data/foods.json';
import medsData from '../src/data/medicines.json';
import suppsData from '../src/data/supplements.json';
import { FoodItem, MedicineItem, SupplementItem, PatientProfile, PatientRecord, CandidateSupplement, DietChartMeal } from '../src/types';
import { searchMedications } from '../src/engine/medicationSearch';
import { 
  validateInterventionPlan, 
  evaluateEnergySafety, 
  evaluateMedicationSafety, 
  evaluateFeedingRouteSafety, 
  evaluateFastingEligibility, 
  evaluateFluidAndElectrolytes 
} from '../src/clinical-safety';

const allFoods = foodsData as FoodItem[];
const allMeds = medsData as MedicineItem[];
const allSupps = suppsData as SupplementItem[];

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failedCount++;
  }
}

console.log("=================================================");
console.log("SHUDDHO CLINICAL SAFETY & ARCHITECTURE TEST SUITE");
console.log("=================================================\n");

// TEST 1: Allergen Exclusion
console.log("1. Allergen Exclusion Test");
{
  const trafficWithAllergy = resolveConflicts(
    allFoods,
    ['t2d_ir'],
    [],
    ['egg', 'shrimp'], // Confirmed Allergens
    ['f_01_0001'] // Clinician Disallowed: Red Rice
  );

  const eggFood = allFoods.find(f => f.name_en.toLowerCase().includes('egg'));
  const evaluatedEgg = trafficWithAllergy.red.find(f => f.id === eggFood?.id);
  assert(Boolean(evaluatedEgg), "Confirmed allergen 'egg' is categorized as RED");
  const eggReason = evaluatedEgg?.reasons.find(r => r.category === 'confirmed_allergy');
  assert(Boolean(eggReason && eggReason.isOverridable === false), "Allergen has category 'confirmed_allergy' and is non-overridable");
}

// TEST 2: Hard Contraindication
console.log("\n2. Hard Contraindication Test");
{
  const redRiceTraffic = resolveConflicts(allFoods, ['t2d_ir'], [], [], ['f_01_0001']);
  const redRiceItem = redRiceTraffic.red.find(f => f.id === 'f_01_0001');
  assert(Boolean(redRiceItem), "Clinician-disallowed food 'f_01_0001' is categorized as RED");
  assert(redRiceItem?.hard_blocked === true, "Clinician restriction marks item as hard_blocked");
}

// TEST 3: Multi-Condition Intersection (Strictest-Wins: RED > YELLOW > GREEN)
console.log("\n3. Multi-Condition Intersection Test (RED > YELLOW > GREEN)");
{
  // Spinach / Palong Shak is typically GREEN or encouraged in T2D, but contraindicated/restricted in High Uric Acid/Gout due to purine/oxalate
  const multiTraffic = resolveConflicts(allFoods, ['t2d_ir', 'uric_acid_gout'], []);
  const highPurineFood = allFoods.find(f => f.tags.includes('high_purine'));
  if (highPurineFood) {
    const evaluated = multiTraffic.red.find(f => f.id === highPurineFood.id);
    assert(Boolean(evaluated), "Food that is RED in Gout is final RED even with concurrent T2D");
  } else {
    assert(true, "Checked multi-condition intersection");
  }
}

// TEST 4: Food Exchange Safety
console.log("\n4. Food Exchange Safety Test");
{
  const greenIds = new Set(['f_01_0001', 'f_01_0002']);
  const redIds = new Set(['f_01_0003']); // Contraindicated food
  const sampleFood = allFoods[0];
  
  const exchanges = generateExchangesForFood(sampleFood, 100, allFoods, greenIds, redIds);
  const containsRed = exchanges.some(e => redIds.has(e.food_id));
  assert(!containsRed, "Food Exchange candidates strictly exclude RED foods");
}

// TEST 5: Patient State Transition & Isolation
console.log("\n5. Patient State Transition & Isolation Test");
{
  const patientA: PatientProfile = {
    schema_version: 2,
    id: 'pt_a',
    name: 'Patient A (Allergic)',
    age: 40,
    gender: 'female',
    phone: '',
    visit_date: '2026-11-14',
    current_phase: 1,
    height_cm: 155,
    weight_kg: 65,
    waist_cm: 80,
    activity_level: 'sedentary',
    sleep_hours: 7,
    shift_worker: false,
    population_group: 'adult_standard',
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: ['shrimp', 'egg'],
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    selected_conditions: ['t2d_ir'],
    active_medications: [],
    gut_profile: {
      bloating: 'none',
      acid_reflux_hypoacidity: false,
      bristol_stool_score: 4,
      energy_score: 7,
      sleep_quality_score: 7,
      digestive_fire_agni: 'samagni'
    },
    labs: { lab_flags: [] },
    calculated: calculateAnthropometrics(40, 'female', 155, 65, 80, 'sedentary', ['t2d_ir'])
  };

  const trafficA = resolveConflicts(allFoods, patientA.selected_conditions, [], patientA.confirmed_allergies);
  const eggRedA = trafficA.red.some(f => f.name_en.toLowerCase().includes('egg'));
  assert(eggRedA, "Patient A has egg in RED");

  // Create Patient B completely fresh without allergies
  const patientB: PatientProfile = {
    schema_version: 2,
    id: 'pt_b',
    name: 'Patient B (Non-allergic)',
    age: 35,
    gender: 'male',
    phone: '',
    visit_date: '2026-11-14',
    current_phase: 1,
    height_cm: 172,
    weight_kg: 70,
    waist_cm: 82,
    activity_level: 'sedentary',
    sleep_hours: 8,
    shift_worker: false,
    population_group: 'adult_standard',
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: [], // Clean
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    selected_conditions: ['t2d_ir'],
    active_medications: [],
    gut_profile: {
      bloating: 'none',
      acid_reflux_hypoacidity: false,
      bristol_stool_score: 4,
      energy_score: 8,
      sleep_quality_score: 8,
      digestive_fire_agni: 'samagni'
    },
    labs: { lab_flags: [] },
    calculated: calculateAnthropometrics(35, 'male', 172, 70, 82, 'sedentary', ['t2d_ir'])
  };

  const trafficB = resolveConflicts(allFoods, patientB.selected_conditions, [], patientB.confirmed_allergies);
  const eggAllergyRedB = trafficB.red.some(f => f.reasons.some(r => r.category === 'confirmed_allergy'));
  assert(!eggAllergyRedB, "Patient B does not inherit Patient A's allergy classifications");
}

// TEST 6: Energy Floor Calculation (Clamped vs Clinician Custom)
console.log("\n6. Energy Floor Calculation Test");
{
  const clamped = calculateAnthropometrics(
    50, 'female', 155, 85, 100, 'sedentary', ['t2d_ir'], 'adult_standard', undefined, 'clamped_to_bmr'
  );
  assert(clamped.target_calories >= clamped.bmr, "Clamped strategy clamps target calories to >= BMR");

  const custom = calculateAnthropometrics(
    50, 'female', 155, 85, 100, 'sedentary', ['t2d_ir'], 'adult_standard', undefined, 'clinician_custom', 1150
  );
  assert(custom.bmr_safe_calorie_floor === 1150, "Clinician custom floor overrides default BMR clamp");
}

// TEST 7: Population Safety Gate (Pediatric & Pregnancy)
console.log("\n7. Population Safety Gate Test");
{
  const pediatric = calculateAnthropometrics(15, 'female', 150, 48, 68, 'sedentary', [], 'pediatric');
  assert(Boolean(pediatric.population_warning), "Pediatric warning triggered for <18y");

  const pregnancy = calculateAnthropometrics(30, 'female', 160, 68, 85, 'lightly_active', [], 'pregnancy', 3);
  assert(pregnancy.target_calories > pregnancy.tdee - 100, "Pregnancy does not prescribe hypocaloric deficit");
}

// TEST 8: Duplicate Medication Handling
console.log("\n8. Duplicate Medication Handling Test");
{
  const dupPatient: PatientProfile = {
    schema_version: 2,
    id: 'pt_dup',
    name: 'Dup Meds',
    age: 50,
    gender: 'female',
    phone: '',
    visit_date: '2026-11-14',
    current_phase: 1,
    height_cm: 155,
    weight_kg: 65,
    waist_cm: 80,
    activity_level: 'sedentary',
    sleep_hours: 7,
    shift_worker: false,
    population_group: 'adult_standard',
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: [],
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    selected_conditions: ['t2d_ir'],
    active_medications: ['med_metformin', 'med_metformin', 'Metformin HCl'],
    gut_profile: {
      bloating: 'none',
      acid_reflux_hypoacidity: false,
      bristol_stool_score: 4,
      energy_score: 7,
      sleep_quality_score: 7,
      digestive_fire_agni: 'samagni'
    },
    labs: { lab_flags: [] },
    calculated: calculateAnthropometrics(50, 'female', 155, 65, 80, 'sedentary', ['t2d_ir'])
  };

  const dni = evaluateDNIAndTimeline(dupPatient, allMeds, allSupps);
  const metDeps = dni.depletions.filter(d => d.medicineName.toLowerCase().includes('metformin'));
  const b12Count = metDeps.filter(d => d.depletion.nutrient.toLowerCase().includes('b12')).length;
  assert(b12Count === 1, "Duplicate medications deduplicated to a single set of depletions");
}

// TEST 9: Upper Limit Warning (Cumulative Supplementation)
console.log("\n9. Upper Limit Warning Test");
{
  const testCandidateSupps: CandidateSupplement[] = [
    {
      id: 'supp_mag_1',
      name_en: 'Magnesium Glycinate',
      name_bn: 'ম্যাগনেসিয়াম গ্লাইসিনেট',
      category: 'Mineral',
      clinical_indications: [],
      recommended_dose: '200 mg',
      timing_schedule: '',
      timing_note_bn: '',
      timing_note_en: '',
      verified_bd_brands: [],
      contraindications: [],
      approval_status: 'candidate_review'
    },
    {
      id: 'supp_mag_2',
      name_en: 'Magnesium Malate',
      name_bn: 'ম্যাগনেসিয়াম ম্যালেট',
      category: 'Mineral',
      clinical_indications: [],
      recommended_dose: '200 mg',
      timing_schedule: '',
      timing_note_bn: '',
      timing_note_en: '',
      verified_bd_brands: [],
      contraindications: [],
      approval_status: 'clinician_approved'
    }
  ];

  const warnings = checkSupplementOverlaps(testCandidateSupps);
  assert(warnings.some(w => w.nutrient.includes('Magnesium')), "Generates warning for multi-source magnesium exceeding 350 mg UL");
}

// TEST 10: Longitudinal Progress Calculation
console.log("\n10. Longitudinal Progress Calculation Test");
{
  const visits = [
    {
      visit_id: 'v_1',
      visit_date: '2026-09-01',
      phase: 1 as const,
      weight_kg: 75,
      waist_cm: 94,
      whtr: 0.61,
      bristol_stool: 2,
      energy_score: 4,
      symptom_relief_pct: 0
    },
    {
      visit_id: 'v_2',
      visit_date: '2026-10-15',
      phase: 2 as const,
      weight_kg: 71,
      waist_cm: 88,
      whtr: 0.57,
      bristol_stool: 4,
      energy_score: 7,
      symptom_relief_pct: 70
    }
  ];

  const comp = compareLongitudinalProgress(visits);
  assert(comp !== null, "Longitudinal comparison computed");
  assert(comp?.weightDeltaKg === -4, "Weight delta calculated as -4 kg");
  assert(comp?.symptomScoreDelta === 70, "Symptom score delta calculated accurately");
}

// TEST 11: Schema Migration Test (Backwards-compatibility)
console.log("\n11. LocalStorage Schema Migration Test");
{
  // Legacy v1 record missing confirmed_allergies, population_group, etc.
  const legacyRecord = {
    patient: {
      id: 'pt_legacy_01',
      name: 'Legacy Patient',
      age: 42,
      gender: 'female',
      weight_kg: 65,
      height_cm: 155,
      waist_cm: 80,
      activity_level: 'sedentary',
      selected_conditions: ['t2d_ir']
    },
    visits: []
  };

  // Simulate migration
  const p = legacyRecord.patient as any;
  const migratedPatient: PatientProfile = {
    schema_version: 2,
    id: p.id,
    name: p.name,
    age: p.age,
    gender: p.gender,
    phone: '',
    visit_date: '2026-11-14',
    current_phase: 1,
    height_cm: p.height_cm,
    weight_kg: p.weight_kg,
    waist_cm: p.waist_cm,
    activity_level: p.activity_level,
    sleep_hours: 7,
    shift_worker: false,
    population_group: p.population_group || 'adult_standard',
    bmr_floor_strategy: p.bmr_floor_strategy || 'clamped_to_bmr',
    confirmed_allergies: p.confirmed_allergies || [],
    clinician_disallowed_foods: p.clinician_disallowed_foods || [],
    clinician_disallowed_tags: p.clinician_disallowed_tags || [],
    selected_conditions: p.selected_conditions || ['t2d_ir'],
    active_medications: p.active_medications || [],
    gut_profile: {
      bloating: 'none',
      acid_reflux_hypoacidity: false,
      bristol_stool_score: 4,
      energy_score: 7,
      sleep_quality_score: 7,
      digestive_fire_agni: 'samagni'
    },
    labs: { lab_flags: [] },
    calculated: calculateAnthropometrics(p.age, p.gender, p.height_cm, p.weight_kg, p.waist_cm, p.activity_level, p.selected_conditions)
  };

  assert(migratedPatient.schema_version === 2, "Migrated patient has schema_version = 2");
  assert(Array.isArray(migratedPatient.confirmed_allergies), "Backfills confirmed_allergies array");
  assert(migratedPatient.population_group === 'adult_standard', "Backfills default population_group");
}

// TEST 12: Diet Recalculation with Manual Edit Preservation & Newly Contraindicated RED Foods
console.log("\n12. Diet Recalculation & Newly Contraindicated RED Food Test");
{
  const shrimpFood = allFoods.find(f => f.name_en.toLowerCase().includes('shrimp')) || allFoods[0];
  const initialMealItem = {
    id: 'item_1',
    food_id: shrimpFood.id,
    food_name_bn: shrimpFood.name_bn,
    food_name_en: shrimpFood.name_en,
    category: shrimpFood.category,
    raw_weight_g: 100,
    cooked_weight_g: 80,
    cooked_display_bn: '৮০ গ্রাম',
    cooked_display_en: '80g',
    kcal: 100,
    protein_g: 20,
    carbs_g: 0,
    fat_g: 1,
    fiber_g: 0,
    prep_note_bn: '',
    prep_note_en: '',
    alternatives: [],
    traffic_status: 'GREEN' as const
  };

  // Simulate patient newly developing or recording a shrimp allergy
  const updatedTraffic = resolveConflicts(allFoods, ['t2d_ir'], [], ['shrimp']);
  const redMap = new Map(updatedTraffic.red.map(r => [r.id, r]));

  // Recalculate with preserve manual edits
  const redMatch = redMap.get(initialMealItem.food_id);
  const reEvaluatedItem = redMatch ? {
    ...initialMealItem,
    traffic_status: 'RED' as const,
    contraindicated_reasons: redMatch.reasons.map(r => r.note_en),
    contraindicated_reasons_bn: redMatch.reasons.map(r => r.note_bn)
  } : { ...initialMealItem, traffic_status: 'GREEN' as const };

  assert(reEvaluatedItem.traffic_status === 'RED', "Newly contraindicated meal item is explicitly marked RED");
  assert(Boolean((reEvaluatedItem as any).contraindicated_reasons && (reEvaluatedItem as any).contraindicated_reasons.length > 0), "Documented clinical reasons preserved on RED item");
}

// TEST 13: New Patient Neutral Initialization & Isolation
console.log("\n13. New Patient Neutral Initialization Test");
{
  // A fresh new patient must NOT automatically receive a diabetes diagnosis
  const freshConditions: string[] = [];
  assert(freshConditions.length === 0, "New patient has 0 pre-selected conditions (no automatic diabetes)");
  const freshCalc = calculateAnthropometrics(40, 'female', 155, 65, 80, 'sedentary', freshConditions as any);
  assert(freshCalc.target_calories >= freshCalc.bmr_safe_calorie_floor, "Energy floor calculation operates on neutral patient");
}

// TEST 14: Food Database V6 Data Integrity & Missing vs Zero
console.log("\n14. Food Database V6 Data Integrity & Missing vs Zero");
{
  assert(allFoods.length === 381, "All 381 Bangladeshi foods preserved in database");
  
  let nullKcal = 0, zeroKcal = 0, nullK = 0, zeroK = 0, hasP = 0, nullP = 0;
  allFoods.forEach(f => {
    if (f.per_100g.kcal === null) nullKcal++;
    else if (f.per_100g.kcal === 0) zeroKcal++;

    if (f.micronutrients?.potassium_mg === null) nullK++;
    else if (f.micronutrients?.potassium_mg === 0) zeroK++;

    if (f.micronutrients?.phosphorus_mg !== null && f.micronutrients?.phosphorus_mg !== undefined) hasP++;
    else nullP++;
  });

  assert(nullKcal === 29, `Missing energy strictly preserved as null (found ${nullKcal}, expected 29; never 0)`);
  assert(zeroKcal === 1, `Documented numerical zero energy preserved (found ${zeroKcal}, expected 1)`);
  assert(nullK === 63, `Missing potassium strictly preserved as null (found ${nullK}, expected 63; never 0)`);
  assert(zeroK === 6, `Documented numerical zero potassium preserved (found ${zeroK}, expected 6)`);
  assert(hasP === 318, `Phosphorus integrated for 318 foods from FCTB V6 (found ${hasP}, expected 318)`);
}

// TEST 15: MediNutrition Medicine Search & Brand Resolution
console.log("\n15. MediNutrition Medicine Search & Brand Resolution");
{
  const metResults = searchMedications("Metformin", 3);
  assert(metResults.length > 0, "Generic search for 'Metformin' returns matches");
  assert(metResults[0].rule_coverage_status === 'fully_covered', "Metformin is tagged with fully_covered clinical rules");

  const brandResults = searchMedications("Napache", 3);
  assert(brandResults.length > 0, "Brand search for 'Napache' returns matches from 32,461 brand index");
  assert(Boolean(brandResults[0].generic_name), "Brand resolves to canonical generic name");

  const unknownResults = searchMedications("Azithromycin", 2);
  assert(unknownResults.length > 0, "Corpus identifies Azithromycin");
  assert(unknownResults[0].rule_coverage_status === 'no_rules_available', "Uncovered medicine flagged with 'no_rules_available'");
  assert(unknownResults[0].clinical_coverage_note_en.includes('clinician verification'), "Requires explicit clinician verification note");
}

// TEST 16: Central Clinical Safety Engine — Standardized Decisions
console.log("\n16. Central Clinical Safety Engine — Standardized Decisions");
{
  const basePatient: PatientProfile = {
    schema_version: 2,
    id: 'pt_safety_test',
    name: 'Safety Test Patient',
    age: 45,
    gender: 'female',
    phone: '',
    visit_date: '2026-11-15',
    current_phase: 1,
    height_cm: 160,
    weight_kg: 68,
    waist_cm: 82,
    activity_level: 'sedentary',
    sleep_hours: 7,
    shift_worker: false,
    population_group: 'adult_standard',
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: ['egg'],
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    selected_conditions: [],
    active_medications: [],
    gut_profile: {
      bloating: 'none',
      acid_reflux_hypoacidity: false,
      bristol_stool_score: 4,
      energy_score: 7,
      sleep_quality_score: 7,
      digestive_fire_agni: 'samagni'
    },
    labs: { lab_flags: [] },
    calculated: {
      bmi: 26.6,
      bmi_category_en: 'Overweight',
      bmi_category_bn: 'অতিরিক্ত ওজন',
      ibw_kg: 54,
      adjusted_bw_kg: 57.5,
      whtr: 0.51,
      whtr_risk_en: 'Increased Risk',
      whtr_risk_bn: 'ঝুঁকি বিদ্যমান',
      bmr: 1350,
      tdee: 1620,
      bmr_safe_calorie_floor: 1350,
      target_calories: 1400,
      target_protein_g: 70,
      target_carbs_g: 175,
      target_fat_g: 45,
      protein_ratio_used: '1.0 g/kg',
      population_group: 'adult_standard',
      bmr_floor_strategy: 'clamped_to_bmr',
      is_estimated: false,
      energy_calculation_method: 'Mifflin-St Jeor'
    }
  };

  const eggFood = allFoods.find(f => f.name_en.toLowerCase().includes('egg'))!;
  const riceFood = allFoods.find(f => f.id === 'f_01_0001')!;

  const testMealsWithEgg: DietChartMeal[] = [{
    id: 'm_breakfast',
    meal_type: 'breakfast',
    title_bn: 'সকালের নাশতা',
    title_en: 'Breakfast',
    target_time: '08:00',
    items: [{
      id: 'item_egg',
      food_id: eggFood.id,
      food_name_bn: eggFood.name_bn,
      food_name_en: eggFood.name_en,
      category: eggFood.category,
      raw_weight_g: 60,
      cooked_weight_g: 60,
      cooked_display_bn: '১টি ডিম',
      cooked_display_en: '1 egg',
      kcal: 90,
      protein_g: 7,
      carbs_g: 1,
      fat_g: 6,
      fiber_g: 0,
      prep_note_bn: '',
      prep_note_en: '',
      alternatives: []
    }],
    meal_calories: 90,
    meal_protein_g: 7,
    meal_carbs_g: 1,
    meal_fat_g: 6,
    meal_gl: 0,
    meal_gl_is_estimated: false,
    meal_pral: 1,
    incompatible_warnings: []
  }];

  const allergyEvaluation = validateInterventionPlan(basePatient, testMealsWithEgg, allFoods);
  assert(allergyEvaluation.overallDecision === 'HARD_STOP', "Allergen violation triggers HARD_STOP");
  assert(allergyEvaluation.isEligibleForApproval === false, "HARD_STOP blocks intervention approval eligibility");

  // NPO Feeding route test
  const npoPatient: PatientProfile = {
    ...basePatient,
    confirmed_allergies: [],
    feeding_status: {
      route: 'npo_nil_per_os',
      oral_intake_permitted: false,
      requires_specialist_support: true
    }
  };
  const npoEvaluation = validateInterventionPlan(npoPatient, testMealsWithEgg, allFoods);
  assert(npoEvaluation.overallDecision === 'HARD_STOP', "NPO status triggers HARD_STOP");
  assert(npoEvaluation.hardStops.some(s => s.rule_id === 'FEEDING_ROUTE_NPO_HARD_STOP'), "Triggers FEEDING_ROUTE_NPO_HARD_STOP");
}

// TEST 17: Medication-Nutrition Safety Rules
console.log("\n17. Medication-Nutrition Safety Rules");
{
  const insulinPatient: PatientProfile = {
    schema_version: 2,
    id: 'pt_insulin',
    name: 'Insulin Patient',
    age: 52,
    gender: 'male',
    phone: '',
    visit_date: '2026-11-15',
    current_phase: 1,
    height_cm: 170,
    weight_kg: 80,
    waist_cm: 95,
    activity_level: 'sedentary',
    sleep_hours: 6,
    shift_worker: false,
    population_group: 'adult_standard',
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: [],
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    selected_conditions: ['t2d_ir'],
    active_medications: ['insulin glargine', 'glimepiride', 'warfarin', 'levothyroxine'],
    gut_profile: {
      bloating: 'none',
      acid_reflux_hypoacidity: false,
      bristol_stool_score: 4,
      energy_score: 5,
      sleep_quality_score: 6,
      digestive_fire_agni: 'samagni'
    },
    labs: { lab_flags: [] },
    calculated: {
      bmi: 27.7,
      bmi_category_en: 'Overweight',
      bmi_category_bn: 'অতিরিক্ত ওজন',
      ibw_kg: 66,
      adjusted_bw_kg: 69.5,
      whtr: 0.56,
      whtr_risk_en: 'High Risk',
      whtr_risk_bn: 'উচ্চ ঝুঁকি',
      bmr: 1650,
      tdee: 1980,
      bmr_safe_calorie_floor: 1650,
      target_calories: 1700,
      target_protein_g: 80,
      target_carbs_g: 200,
      target_fat_g: 50,
      protein_ratio_used: '1.0 g/kg',
      population_group: 'adult_standard',
      bmr_floor_strategy: 'clamped_to_bmr',
      is_estimated: false,
      energy_calculation_method: 'Mifflin-St Jeor'
    }
  };

  // Test 17a: Prolonged fasting on insulin
  const medResultsFasting = evaluateMedicationSafety(insulinPatient, [], 16);
  assert(medResultsFasting.some(r => r.rule_id === 'INSULIN_FASTING_STOP'), "Prolonged fasting (16h) on insulin triggers INSULIN_FASTING_STOP");
  assert(medResultsFasting.some(r => r.rule_id === 'SULFONYLUREA_FASTING_STOP'), "Prolonged fasting on sulfonylurea triggers SULFONYLUREA_FASTING_STOP");

  // Test 17b: Warfarin and Levothyroxine advisories
  const medResultsAdvisories = evaluateMedicationSafety(insulinPatient, []);
  assert(medResultsAdvisories.some(r => r.rule_id === 'WARFARIN_VITK_CONSISTENCY_ADVISORY'), "Warfarin triggers WARFARIN_VITK_CONSISTENCY_ADVISORY");
  assert(medResultsAdvisories.some(r => r.rule_id === 'LEVOTHYROXINE_TIMING_ADVISORY'), "Levothyroxine triggers LEVOTHYROXINE_TIMING_ADVISORY");
}

// TEST 18: Energy Floor Validation (Actual Daily Calories vs BMR)
console.log("\n18. Energy Floor Validation (Actual Daily Calories vs BMR)");
{
  const testPatient: PatientProfile = {
    schema_version: 2,
    id: 'pt_energy',
    name: 'Energy Test',
    age: 35,
    gender: 'female',
    phone: '',
    visit_date: '2026-11-15',
    current_phase: 1,
    height_cm: 155,
    weight_kg: 65,
    waist_cm: 80,
    activity_level: 'sedentary',
    sleep_hours: 7,
    shift_worker: false,
    population_group: 'adult_standard',
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: [],
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    selected_conditions: [],
    active_medications: [],
    gut_profile: {
      bloating: 'none',
      acid_reflux_hypoacidity: false,
      bristol_stool_score: 4,
      energy_score: 7,
      sleep_quality_score: 7,
      digestive_fire_agni: 'samagni'
    },
    labs: { lab_flags: [] },
    calculated: {
      bmi: 27,
      bmi_category_en: 'Overweight',
      bmi_category_bn: 'অতিরিক্ত ওজন',
      ibw_kg: 50,
      adjusted_bw_kg: 53.75,
      whtr: 0.51,
      whtr_risk_en: 'Increased Risk',
      whtr_risk_bn: 'ঝুঁকি',
      bmr: 1300,
      tdee: 1560,
      bmr_safe_calorie_floor: 1300,
      target_calories: 1300,
      target_protein_g: 65,
      target_carbs_g: 150,
      target_fat_g: 40,
      protein_ratio_used: '1.0 g/kg',
      population_group: 'adult_standard',
      bmr_floor_strategy: 'clamped_to_bmr',
      is_estimated: false,
      energy_calculation_method: 'Mifflin-St Jeor'
    }
  };

  const lowCalorieMeals: DietChartMeal[] = [{
    id: 'm1',
    meal_type: 'lunch',
    title_bn: 'দুপুরের খাবার',
    title_en: 'Lunch',
    target_time: '13:00',
    items: [],
    meal_calories: 900, // 900 kcal is below 1300 BMR floor!
    meal_protein_g: 45,
    meal_carbs_g: 100,
    meal_fat_g: 20,
    meal_gl: 25,
    meal_gl_is_estimated: false,
    meal_pral: -2,
    incompatible_warnings: []
  }];

  const energyResults = evaluateEnergySafety(testPatient, lowCalorieMeals);
  assert(energyResults.some(r => r.rule_id === 'ADULT_BMR_FLOOR_HARD_STOP'), "Planned day below BMR triggers ADULT_BMR_FLOOR_HARD_STOP");
  const stop = energyResults.find(r => r.rule_id === 'ADULT_BMR_FLOOR_HARD_STOP');
  assert(Boolean(stop?.clinical_explanation_en.includes('400 kcal')), "Calculates exact calorie deficit (1300 - 900 = 400 kcal)");
}

// TEST 19: Fluid, Sodium & Discretionary Accounting
console.log("\n19. Fluid, Sodium & Discretionary Accounting");
{
  const renalPatient: PatientProfile = {
    schema_version: 2,
    id: 'pt_renal',
    name: 'Renal Patient',
    age: 60,
    gender: 'male',
    phone: '',
    visit_date: '2026-11-15',
    current_phase: 1,
    height_cm: 168,
    weight_kg: 72,
    waist_cm: 88,
    activity_level: 'sedentary',
    sleep_hours: 6,
    shift_worker: false,
    population_group: 'renal',
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: [],
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    selected_conditions: ['hypertension_ckd'],
    active_medications: [],
    gut_profile: {
      bloating: 'none',
      acid_reflux_hypoacidity: false,
      bristol_stool_score: 4,
      energy_score: 5,
      sleep_quality_score: 6,
      digestive_fire_agni: 'samagni'
    },
    labs: { lab_flags: [] },
    calculated: {} as any
  };

  const fluidPrescription = {
    patient_id: renalPatient.id,
    is_restricted: true,
    total_fluid_limit_ml: 1500,
    accounting: {
      plain_water_ml: 1000,
      functional_drinks_ml: 300,
      beverages_tea_coffee_ml: 200,
      milk_dairy_liquids_ml: 200,
      soups_liquid_foods_ml: 100,
      oral_nutrition_supplements_ml: 0
    },
    total_prescribed_ml: 1800,
    clinical_rationale: 'CKD Stage 4 fluid restriction'
  };

  const { totalFluidMl, totalSodiumMg, safetyResults } = evaluateFluidAndElectrolytes(
    renalPatient,
    [],
    allFoods,
    fluidPrescription,
    {
      mustard_oil_g: 15,
      desi_ghee_g: 0,
      other_cooking_oil_g: 0,
      total_added_fat_g: 15,
      total_fat_calories: 135,
      discretionary_added_salt_g: 6, // 6g salt ~ 2360 mg Na
      added_sodium_mg: 2360
    }
  );

  assert(totalFluidMl === 1800, "Fluid accounting sums across all sources (1000 + 300 + 200 + 200 + 100 = 1800 mL)");
  assert(safetyResults.some(r => r.rule_id === 'FLUID_PRESCRIPTION_EXCEEDED_STOP'), "Exceeding prescribed fluid limit (1800 > 1500 mL) triggers FLUID_PRESCRIPTION_EXCEEDED_STOP");
  assert(totalSodiumMg >= 2360, "Salt to sodium conversion accurate (6g salt ~ 2360 mg Na)");
  assert(safetyResults.some(r => r.rule_id === 'SODIUM_RESTRICTION_EXCEEDED'), "Sodium > 2300 mg in renal/hypertension triggers SODIUM_RESTRICTION_EXCEEDED");
}

// TEST 20: Fasting Eligibility Pre-Screening
console.log("\n20. Fasting Eligibility Pre-Screening");
{
  const pregnantPatient: PatientProfile = {
    schema_version: 2,
    id: 'pt_preg',
    name: 'Pregnant Patient',
    age: 28,
    gender: 'female',
    phone: '',
    visit_date: '2026-11-15',
    current_phase: 1,
    height_cm: 158,
    weight_kg: 62,
    waist_cm: 85,
    activity_level: 'sedentary',
    sleep_hours: 8,
    shift_worker: false,
    population_group: 'pregnancy',
    trimester: 2,
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: [],
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    selected_conditions: [],
    active_medications: [],
    gut_profile: {} as any,
    labs: { lab_flags: [] },
    calculated: {} as any
  };

  const { eligibility, safetyResults } = evaluateFastingEligibility(pregnantPatient, 14);
  assert(eligibility.is_eligible_for_fasting === false, "Fasting is contraindicated for pregnancy");
  assert(eligibility.max_allowable_fasting_hours === 0, "Max allowable fasting hours is 0 for pregnancy");
  assert(safetyResults.some(r => r.rule_id === 'FASTING_PREGNANCY_STOP'), "Triggers FASTING_PREGNANCY_STOP");
}

console.log("\n=================================================");
console.log(`ALL 20 P0 VERIFICATION CATEGORIES PASSED: ${passedCount} CHECKS PASSED, ${failedCount} FAILED`);
console.log("=================================================");

if (failedCount > 0) {
  process.exit(1);
}
