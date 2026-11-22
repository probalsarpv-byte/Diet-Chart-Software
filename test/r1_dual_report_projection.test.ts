/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION SOFTWARE
 * R1: DUAL REPORT PROJECTION ACCEPTANCE TEST SUITE
 * 
 * Verifies Scenarios A, B, C, D, E, F, G, Q:
 * - Scenario A: Patient projection excludes all nutrition calculation keys at every nested level.
 * - Scenario B: Patient projection contains correct food name, timing, preparation and portion.
 * - Scenario C: Patient serving gram weights remain visible.
 * - Scenario D: Clinician projection retains exact original calories, protein, carbs, fats and clinical calculations.
 * - Scenario E: All 7 days show correctly.
 * - Scenario F: Daily report and full weekly report follow the same privacy rules.
 * - Scenario G: Bengali and English work across both projections.
 * - Scenario Q: Missing lab/nutrient data is not fabricated as zero.
 */

import foodsData from '../src/data/foods.json';
import { resolveConflicts } from '../src/engine/conflictResolver';
import { 
  buildClinicianReportProjection, 
  buildPatientReportProjection, 
  validatePatientReportProjection,
  validateReportReleaseEligibility
} from '../src/engine/reports/dualReportEngine';
import { 
  generateWeeklyDietPlan,
  approveWeeklyDietPlan
} from '../src/engine/weeklyPlanner';
import { 
  PatientProfile, 
  DietChartMeal, 
  WeeklyDietPlan,
  FoodItem 
} from '../src/types';

const allFoods = foodsData as FoodItem[];

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition: boolean, message: string) {
  totalAssertions++;
  if (!condition) {
    failedAssertions++;
    console.error(`  ✗ FAIL: ${message}`);
  } else {
    passedAssertions++;
    console.log(`  ✓ PASS: ${message}`);
  }
}

function createSyntheticPatient(id: string = 'pt_r1_test', overrides: Partial<PatientProfile> = {}): PatientProfile {
  return {
    schema_version: 2,
    id,
    name: 'Mrs. Selina Parveen',
    age: 48,
    gender: 'female',
    phone: '01711223344',
    email: 'selina@example.com',
    visit_date: '2026-11-21',
    current_visit_id: `vis_${id}_1`,
    current_phase: 1,
    height_cm: 156,
    weight_kg: 68,
    waist_cm: 86,
    activity_level: 'sedentary',
    sleep_hours: 7,
    shift_worker: false,
    population_group: 'adult_standard',
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: ['egg'],
    allergy_reconciliation_status: 'allergies_confirmed',
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    selected_conditions: ['t2d_ir', 'hypertension_ckd'],
    active_medications: ['metformin'],
    medication_records: [],
    medication_reconciliation_status: 'fully_reconciled',
    gut_profile: {
      bloating: 'mild',
      acid_reflux_hypoacidity: false,
      bristol_stool_score: 4,
      energy_score: 6,
      sleep_quality_score: 7,
      digestive_fire_agni: 'samagni'
    },
    labs: {
      hba1c: 6.8,
      fasting_glucose: 122,
      vitamin_d3: 18.5, // deficient (<20)
      vitamin_b12: null as any, // missing
      lab_flags: [
        {
          marker: 'hba1c',
          value: 6.8,
          unit: '%',
          conventional_range: '< 5.7',
          optimal_range: '< 5.7',
          status: 'abnormal',
          insight_en: 'Elevated HbA1c indicative of persistent glycemic dysregulation',
          insight_bn: 'উচ্চ এইচবিএওয়ানসি গ্লুকোজ অনিয়ন্ত্রণ নির্দেশ করে'
        }
      ]
    },
    calculated: {
      bmi: 27.9,
      bmi_category_en: 'overweight',
      bmi_category_bn: 'অতিরিক্ত ওজন',
      ibw_kg: 53,
      adjusted_bw_kg: 56,
      whtr: 0.55,
      whtr_risk_en: 'high',
      whtr_risk_bn: 'উচ্চ ঝুঁকি',
      bmr: 1320,
      tdee: 1584,
      bmr_safe_calorie_floor: 1320,
      target_calories: 1400,
      target_protein_g: 70,
      target_carbs_g: 140,
      target_fat_g: 45,
      protein_ratio_used: '20%',
      population_group: 'adult_standard',
      bmr_floor_strategy: 'clamped_to_bmr',
      is_estimated: false,
      energy_calculation_method: 'mifflin_st_jeor'
    },
    is_diet_plan_dirty: false,
    clinical_safety: {
      fluid_restriction: {
        is_restricted: false,
        limit_ml: undefined
      }
    },
    ...overrides
  };
}

console.log('\n================================================================');
console.log('SHUDDHO R1: DUAL REPORT PROJECTION ACCEPTANCE SUITE (U20 & U21)');
console.log('================================================================\n');

// ── Test Setup: Generate Authoritative Plan ──
const patient = createSyntheticPatient();
const trafficLight = resolveConflicts(allFoods, patient.selected_conditions as any, [], patient.confirmed_allergies);
const generatedPlan = generateWeeklyDietPlan(patient, allFoods, trafficLight);

// -------------------------------------------------------------------
// SCENARIO A: Patient Projection Excludes All Calculation Keys
// -------------------------------------------------------------------
console.log('--- SCENARIO A: Strict Exclusion of All Nutritional Calculation Keys ---');
{
  const patientPayload = buildPatientReportProjection({
    patient,
    dietChart: generatedPlan.days[0].meals,
    weeklyDietPlan: generatedPlan
  });

  const privacyCheck = validatePatientReportProjection(patientPayload);
  assert(privacyCheck.isValid, 'Scenario A: validatePatientReportProjection confirms 0 violations in patient payload');
  if (!privacyCheck.isValid) {
    console.error('Violations found:', privacyCheck.violations);
  }

  // Recursive examination of raw JSON string
  const jsonStr = JSON.stringify(patientPayload);
  assert(!jsonStr.includes('"kcal"'), 'Scenario A: Raw JSON contains NO "kcal" key');
  assert(!jsonStr.includes('"calories"'), 'Scenario A: Raw JSON contains NO "calories" key');
  assert(!jsonStr.includes('"meal_calories"'), 'Scenario A: Raw JSON contains NO "meal_calories" key');
  assert(!jsonStr.includes('"protein_g"'), 'Scenario A: Raw JSON contains NO "protein_g" key');
  assert(!jsonStr.includes('"carbs_g"'), 'Scenario A: Raw JSON contains NO "carbs_g" key');
  assert(!jsonStr.includes('"fat_g"'), 'Scenario A: Raw JSON contains NO "fat_g" key');
  assert(!jsonStr.includes('"bmr"'), 'Scenario A: Raw JSON contains NO "bmr" key');
  assert(!jsonStr.includes('"tdee"'), 'Scenario A: Raw JSON contains NO "tdee" key');
  assert(!jsonStr.includes('"pral"'), 'Scenario A: Raw JSON contains NO "pral" key');
  assert(!jsonStr.includes('"glycemic_load"'), 'Scenario A: Raw JSON contains NO "glycemic_load" key');
  assert(!jsonStr.includes('"target_calories"'), 'Scenario A: Raw JSON contains NO "target_calories" key');
  assert(!jsonStr.includes('"target_protein_g"'), 'Scenario A: Raw JSON contains NO "target_protein_g" key');
}

// -------------------------------------------------------------------
// SCENARIO B: Patient Projection Contains Foods, Timings & Preparations
// -------------------------------------------------------------------
console.log('\n--- SCENARIO B: Patient Food Names, Meal Timings & Preparation Directives ---');
{
  const patientPayload = buildPatientReportProjection({
    patient,
    dietChart: generatedPlan.days[0].meals,
    weeklyDietPlan: generatedPlan
  });

  const firstDay = patientPayload.days[0];
  assert(Boolean(firstDay), 'Scenario B: First day exists in patient projection');
  assert(firstDay.meals.length >= 3, `Scenario B: At least 3 meals present in patient day (found: ${firstDay.meals.length})`);

  const firstMeal = firstDay.meals[0];
  assert(Boolean(firstMeal.target_time), `Scenario B: Meal timing is present: "${firstMeal.target_time}"`);
  assert(Boolean(firstMeal.title_bn && firstMeal.title_en), `Scenario B: Meal title is bilingual: "${firstMeal.title_bn}" / "${firstMeal.title_en}"`);

  const firstItem = firstMeal.items[0];
  assert(Boolean(firstItem.food_name_bn && firstItem.food_name_en), `Scenario B: Food name is bilingual: "${firstItem.food_name_bn}" / "${firstItem.food_name_en}"`);
  assert(Boolean(firstItem.preparation_note_bn && firstItem.preparation_note_en), `Scenario B: Preparation note is present: "${firstItem.preparation_note_bn}"`);
  assert(Boolean(firstItem.household_portion_bn && firstItem.household_portion_en), `Scenario B: Household portion is present: "${firstItem.household_portion_bn}"`);
}

// -------------------------------------------------------------------
// SCENARIO C: Patient Serving Gram Weights Remain Visible
// -------------------------------------------------------------------
console.log('\n--- SCENARIO C: Patient Serving Gram Weights Preserved ---');
{
  const patientPayload = buildPatientReportProjection({
    patient,
    dietChart: generatedPlan.days[0].meals,
    weeklyDietPlan: generatedPlan
  });

  const firstItem = patientPayload.days[0].meals[0].items[0];
  assert(typeof firstItem.raw_serving_weight_g === 'number' && firstItem.raw_serving_weight_g > 0, 
    `Scenario C: Serving raw weight in grams is preserved: ${firstItem.raw_serving_weight_g}g`);
  assert(firstItem.household_portion_bn.length > 0, 
    `Scenario C: Bengali household measurement preserved: "${firstItem.household_portion_bn}"`);
}

// -------------------------------------------------------------------
// SCENARIO D: Clinician Projection Retains Full Nutritional Analytics
// -------------------------------------------------------------------
console.log('\n--- SCENARIO D: Clinician Projection Retains Full Nutritional Analytics ---');
{
  const clinicianPayload = buildClinicianReportProjection({
    patient,
    dietChart: generatedPlan.days[0].meals,
    weeklyDietPlan: generatedPlan
  });

  assert(clinicianPayload.report_type === 'CLINICIAN_FULL_DOSSIER', 'Scenario D: Report type is CLINICIAN_FULL_DOSSIER');
  assert(clinicianPayload.energy_and_macro_analytics.bmr_kcal === 1320, 'Scenario D: Exact BMR preserved (1320 kcal)');
  assert(clinicianPayload.energy_and_macro_analytics.tdee_kcal === 1584, 'Scenario D: Exact TDEE preserved (1584 kcal)');
  assert(clinicianPayload.energy_and_macro_analytics.target_calories_kcal === 1400, 'Scenario D: Exact target calories preserved (1400 kcal)');
  assert(typeof clinicianPayload.energy_and_macro_analytics.planned_calories_kcal === 'number', 'Scenario D: Planned calories computed');
  assert(clinicianPayload.energy_and_macro_analytics.target_protein_g === 70, 'Scenario D: Target protein preserved (70g)');
  assert(typeof clinicianPayload.energy_and_macro_analytics.planned_protein_g === 'number', 'Scenario D: Planned protein computed');
  assert(typeof clinicianPayload.energy_and_macro_analytics.protein_ratio_pct === 'number', 'Scenario D: Atwater protein % computed');
  assert(typeof clinicianPayload.energy_and_macro_analytics.pral_score === 'number', 'Scenario D: PRAL score computed');
  assert(typeof clinicianPayload.energy_and_macro_analytics.glycemic_load === 'number', 'Scenario D: Glycemic load computed');

  // Verify nested meal-level calculations exist
  const firstMeal = clinicianPayload.days[0].meals[0];
  assert(typeof firstMeal.meal_calories === 'number' && firstMeal.meal_calories > 0, 'Scenario D: Meal-level calories preserved for clinician');
  assert(typeof firstMeal.meal_protein_g === 'number', 'Scenario D: Meal-level protein preserved for clinician');
  const firstItem = firstMeal.items[0];
  assert(typeof firstItem.kcal === 'number', 'Scenario D: Item-level kcal preserved for clinician');
  assert(typeof firstItem.protein_g === 'number', 'Scenario D: Item-level protein_g preserved for clinician');
}

// -------------------------------------------------------------------
// SCENARIO E: All 7 Days Show Correctly
// -------------------------------------------------------------------
console.log('\n--- SCENARIO E: All 7 Days Represented in Both Projections ---');
{
  const clinicianPayload = buildClinicianReportProjection({
    patient,
    dietChart: generatedPlan.days[0].meals,
    weeklyDietPlan: generatedPlan
  });
  const patientPayload = buildPatientReportProjection({
    patient,
    dietChart: generatedPlan.days[0].meals,
    weeklyDietPlan: generatedPlan,
    includeAllDays: true
  });

  assert(clinicianPayload.days.length === 7, `Scenario E: Clinician projection contains exactly 7 days (found: ${clinicianPayload.days.length})`);
  assert(patientPayload.days.length === 7, `Scenario E: Patient projection contains exactly 7 days (found: ${patientPayload.days.length})`);

  for (let d = 1; d <= 7; d++) {
    assert(clinicianPayload.days[d - 1].day_number === d, `Scenario E: Clinician day ${d} correctly sequenced`);
    assert(patientPayload.days[d - 1].day_number === d, `Scenario E: Patient day ${d} correctly sequenced`);
  }
}

// -------------------------------------------------------------------
// SCENARIO F: Daily Report and Weekly Report Follow Same Privacy Rules
// -------------------------------------------------------------------
console.log('\n--- SCENARIO F: Single-Day vs 7-Day Consistency in Patient Privacy ---');
{
  // Daily patient report (single day)
  const singleDayPatientPayload = buildPatientReportProjection({
    patient,
    dietChart: generatedPlan.days[0].meals,
    weeklyDietPlan: generatedPlan,
    activeDayNumber: 1,
    includeAllDays: false
  });

  assert(singleDayPatientPayload.days.length === 1, 'Scenario F: Single-day projection contains exactly 1 day');
  const singleDayPrivacy = validatePatientReportProjection(singleDayPatientPayload);
  assert(singleDayPrivacy.isValid, 'Scenario F: Single-day patient projection has 0 privacy violations');

  // Full weekly patient report
  const weeklyPatientPayload = buildPatientReportProjection({
    patient,
    dietChart: generatedPlan.days[0].meals,
    weeklyDietPlan: generatedPlan,
    includeAllDays: true
  });

  assert(weeklyPatientPayload.days.length === 7, 'Scenario F: Full weekly projection contains 7 days');
  const weeklyPrivacy = validatePatientReportProjection(weeklyPatientPayload);
  assert(weeklyPrivacy.isValid, 'Scenario F: Full weekly patient projection has 0 privacy violations');
}

// -------------------------------------------------------------------
// SCENARIO G: Bilingual Integrity (Bengali & English)
// -------------------------------------------------------------------
console.log('\n--- SCENARIO G: Bilingual Integrity (Bengali & English) ---');
{
  const patientPayload = buildPatientReportProjection({
    patient,
    dietChart: generatedPlan.days[0].meals,
    weeklyDietPlan: generatedPlan
  });

  assert(Boolean(patientPayload.clinic_letterhead.clinic_name_bn), 'Scenario G: Clinic name in Bengali present');
  assert(Boolean(patientPayload.clinic_letterhead.clinic_name_en), 'Scenario G: Clinic name in English present');
  assert(Boolean(patientPayload.safety_instructions.cooking_oil_rules_bn), 'Scenario G: Cooking oil rules in Bengali present');
  assert(Boolean(patientPayload.safety_instructions.cooking_oil_rules_en), 'Scenario G: Cooking oil rules in English present');
  assert(Boolean(patientPayload.safety_instructions.salt_guidelines_bn), 'Scenario G: Salt guidelines in Bengali present');
  assert(Boolean(patientPayload.safety_instructions.salt_guidelines_en), 'Scenario G: Salt guidelines in English present');
  assert(Boolean(patientPayload.disclaimers.bn), 'Scenario G: Bengali disclaimer present');
  assert(Boolean(patientPayload.disclaimers.en), 'Scenario G: English disclaimer present');
}

// -------------------------------------------------------------------
// SCENARIO Q: Missing Biomarkers Not Fabricated As Zero
// -------------------------------------------------------------------
console.log('\n--- SCENARIO Q: Missing Biomarkers Preserved as Null/Not Available ---');
{
  const clinicianPayload = buildClinicianReportProjection({
    patient,
    dietChart: generatedPlan.days[0].meals,
    weeklyDietPlan: generatedPlan
  });

  // Vitamin B12 was null on patient
  const vitB12 = clinicianPayload.micronutrient_sufficiency['vitamin_b12'];
  assert(vitB12.actual_amount === null, 'Scenario Q: Missing Vitamin B12 actual_amount is strictly null (never 0)');
  assert(vitB12.status === 'not_available', 'Scenario Q: Missing Vitamin B12 status is "not_available"');

  // Calcium is missing in food DB
  const calcium = clinicianPayload.micronutrient_sufficiency['calcium'];
  assert(calcium.actual_amount === null, 'Scenario Q: Missing Calcium is strictly null (never 0)');
  assert(calcium.status === 'not_available', 'Scenario Q: Missing Calcium status is "not_available"');

  // Vitamin D3 was present (18.5)
  const vitD3 = clinicianPayload.micronutrient_sufficiency['vitamin_d'];
  assert(vitD3.actual_amount === 18.5, 'Scenario Q: Present Vitamin D3 is strictly 18.5 ng/mL');
  assert(vitD3.status === 'deficient', 'Scenario Q: Serum Vitamin D3 correctly evaluated as deficient (<20)');
}

// -------------------------------------------------------------------
// SCENARIO U: Private Clinical Notes Strictly Excluded from Patient Payload
// -------------------------------------------------------------------
console.log('\n--- SCENARIO U: Private Clinical Notes Strictly Excluded from Patient Payload ---');
{
  const planWithNotes: WeeklyDietPlan = {
    ...generatedPlan,
    clinician_notes: 'CONFIDENTIAL: Suspected subclinical HPA-axis burnout. Monitor cortisol.',
    approval_notes: 'Approved with cautionary sodium limitation.',
    status: 'approved',
    is_approved: true,
    approved_by: 'Dr. Clinician'
  };

  const patientPayload = buildPatientReportProjection({
    patient,
    dietChart: planWithNotes.days[0].meals,
    weeklyDietPlan: planWithNotes
  });

  const jsonStr = JSON.stringify(patientPayload);
  assert(!jsonStr.includes('CONFIDENTIAL: Suspected subclinical HPA-axis burnout'), 'Scenario U: Clinician internal hypotheses strictly omitted from patient payload');
  assert(!jsonStr.includes('"clinical_notes"'), 'Scenario U: No "clinical_notes" property in patient payload');
  assert(!jsonStr.includes('"approval_notes"'), 'Scenario U: No "approval_notes" property in patient payload');
  const privacyCheck = validatePatientReportProjection(patientPayload);
  assert(privacyCheck.isValid, 'Scenario U: validatePatientReportProjection confirms 0 privacy violations with private clinician notes present');
}

// -------------------------------------------------------------------
// SCENARIO V: Missing BMR/TDEE/Target Preserves Null Without Fabrication
// -------------------------------------------------------------------
console.log('\n--- SCENARIO V: Missing BMR/TDEE/Target Preserved as Null ---');
{
  const uncalculatedPatient = createSyntheticPatient('pt_uncalc', {
    calculated: undefined
  });
  const uncalcPlan: WeeklyDietPlan = {
    ...generatedPlan,
    target_macros: undefined as any
  };

  const clinicianPayload = buildClinicianReportProjection({
    patient: uncalculatedPatient,
    dietChart: generatedPlan.days[0].meals,
    weeklyDietPlan: uncalcPlan
  });

  assert(clinicianPayload.energy_and_macro_analytics.bmr_kcal === null, 'Scenario V: Missing BMR preserved as null (never fabricated 1320 or 1350)');
  assert(clinicianPayload.energy_and_macro_analytics.tdee_kcal === null, 'Scenario V: Missing TDEE preserved as null (never fabricated 1584 or 1620)');
  assert(clinicianPayload.energy_and_macro_analytics.target_calories_kcal === null, 'Scenario V: Missing Target Calories preserved as null (never fabricated 1500)');
  assert(clinicianPayload.energy_and_macro_analytics.calorie_variance_kcal === null, 'Scenario V: Calorie variance is null when target is unprescribed');
}

// -------------------------------------------------------------------
// SCENARIO W: Unsupported Blanket Advice Not Emitted
// -------------------------------------------------------------------
console.log('\n--- SCENARIO W: Unsupported Blanket Advice Not Emitted ---');
{
  const unprescribedPatient = createSyntheticPatient('pt_unprescribed', {
    clinical_safety: undefined,
    selected_conditions: []
  });

  const patientPayload = buildPatientReportProjection({
    patient: unprescribedPatient,
    dietChart: generatedPlan.days[0].meals,
    weeklyDietPlan: generatedPlan
  });

  const jsonStr = JSON.stringify(patientPayload);
  assert(!jsonStr.includes('২.৫ থেকে ৩.০ লিটার'), 'Scenario W: Blanket 2.5–3.0L water advice not automatically emitted');
  assert(!jsonStr.includes('2.5 to 3.0 liters'), 'Scenario W: Blanket English 2.5-3.0L water advice not automatically emitted');
  assert(!jsonStr.includes('খাঁটি ঘানিভাঙা সরিষার তেল'), 'Scenario W: Blanket mustard oil advice not automatically emitted');
  assert(!jsonStr.includes('cold-pressed unrefined mustard oil'), 'Scenario W: Blanket English mustard oil advice not automatically emitted');
  assert(patientPayload.safety_instructions.hydration_guidelines_en === 'Not individually prescribed', 'Scenario W: Hydration marked as not individually prescribed');
  assert(patientPayload.safety_instructions.cooking_oil_rules_en === 'Not individually prescribed', 'Scenario W: Cooking oil marked as not individually prescribed');
  assert(patientPayload.safety_instructions.salt_guidelines_en === 'Not individually prescribed', 'Scenario W: Salt marked as not individually prescribed');
}

// -------------------------------------------------------------------
// SCENARIO X: Fake Clinic Information Omitted
// -------------------------------------------------------------------
console.log('\n--- SCENARIO X: Fake Clinic Information Omitted ---');
{
  const patientPayload = buildPatientReportProjection({
    patient,
    dietChart: generatedPlan.days[0].meals,
    weeklyDietPlan: generatedPlan
  });

  const jsonStr = JSON.stringify(patientPayload);
  assert(!jsonStr.includes('+880 1712-000000'), 'Scenario X: Dummy phone number (+880 1712-000000) not emitted');
  assert(!jsonStr.includes('Gulshan-2 / Dhanmondi'), 'Scenario X: Dummy clinic location (Gulshan-2 / Dhanmondi) not emitted');
  assert(!jsonStr.includes('shuddhobd.com'), 'Scenario X: Dummy URL (shuddhobd.com) not emitted');
  assert(patientPayload.clinic_letterhead.contact_phone === undefined, 'Scenario X: Contact phone undefined when not provided');
  assert(patientPayload.clinic_letterhead.clinic_address === undefined, 'Scenario X: Clinic address undefined when not provided');
}

console.log('\n================================================================');
console.log(`R1 DUAL REPORT PROJECTION RESULTS: ${passedAssertions}/${totalAssertions} PASSED (${failedAssertions} FAILED)`);
console.log('================================================================\n');

if (failedAssertions > 0) {
  process.exit(1);
}
