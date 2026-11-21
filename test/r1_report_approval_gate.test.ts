/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION SOFTWARE
 * R1: REPORT APPROVAL & RELEASE GATE ACCEPTANCE TEST SUITE
 * 
 * Verifies Scenarios H, I, J, K, L, M, N:
 * - Scenario H: Draft plan cannot be released as final patient prescription.
 * - Scenario I: Approved plan can be released.
 * - Scenario J: Hard-stop plan cannot be released.
 * - Scenario K: Confirmed RED food blocks release.
 * - Scenario L: Editing approved plan invalidates release permission.
 * - Scenario M: Patient switching never leaks data between patients.
 * - Scenario N: Historical visit data remains strictly isolated.
 */

import foodsData from '../src/data/foods.json';
import { resolveConflicts } from '../src/engine/conflictResolver';
import { 
  buildPatientReportProjection, 
  validateReportReleaseEligibility 
} from '../src/engine/reports/dualReportEngine';
import { 
  generateWeeklyDietPlan,
  approveWeeklyDietPlan,
  invalidateWeeklyPlanApproval
} from '../src/engine/weeklyPlanner';
import { 
  PatientProfile, 
  DietChartMeal, 
  WeeklyDietPlan,
  ClinicalVisit,
  FoodItem
} from '../src/types';

const allFoods = foodsData as FoodItem[];

function makePlan(p: PatientProfile): WeeklyDietPlan {
  const tl = resolveConflicts(allFoods, p.selected_conditions as any, [], p.confirmed_allergies);
  return generateWeeklyDietPlan(p, allFoods, tl);
}

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

function createSyntheticPatient(id: string, name: string, overrides: Partial<PatientProfile> = {}): PatientProfile {
  return {
    schema_version: 2,
    id,
    name,
    age: 48,
    gender: 'female',
    phone: '01712-345678',
    email: `${id}@example.com`,
    visit_date: '2026-11-21',
    current_visit_id: `vis_${id}_1`,
    current_phase: 1,
    height_cm: 152,
    weight_kg: 74,
    waist_cm: 92,
    activity_level: 'sedentary',
    sleep_hours: 7,
    shift_worker: false,
    population_group: 'adult_standard',
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: [],
    allergy_reconciliation_status: 'none_confirmed',
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    selected_conditions: ['t2d_ir', 'fatty_liver', 'hypothyroid', 'uric_acid_gout'],
    active_medications: [],
    medication_records: [],
    medication_reconciliation_status: 'fully_reconciled',
    feeding_status: {
      route: 'oral_standard',
      oral_intake_permitted: true,
      requires_specialist_support: false
    },
    gut_profile: {
      bloating: 'none',
      acid_reflux_hypoacidity: false,
      bristol_stool_score: 4,
      energy_score: 7,
      sleep_quality_score: 7,
      digestive_fire_agni: 'samagni'
    },
    labs: {
      hba1c: 6.5,
      lab_flags: []
    },
    calculated: {
      bmi: 32.03,
      bmi_category_en: 'Obese Class I',
      bmi_category_bn: 'স্থূলতা গ্রেড ১',
      ibw_kg: 52,
      adjusted_bw_kg: 56,
      whtr: 0.61,
      whtr_risk_en: 'high',
      whtr_risk_bn: 'উচ্চ ঝুঁকি',
      bmr: 1320,
      tdee: 1584,
      bmr_safe_calorie_floor: 1320,
      target_calories: 1550,
      target_protein_g: 78,
      target_carbs_g: 175,
      target_fat_g: 45,
      protein_ratio_used: '20%',
      population_group: 'adult_standard',
      bmr_floor_strategy: 'clamped_to_bmr',
      is_estimated: false,
      energy_calculation_method: 'mifflin_st_jeor'
    },
    is_diet_plan_dirty: false,
    ...overrides
  };
}

console.log('\n================================================================');
console.log('SHUDDHO R1: REPORT APPROVAL & RELEASE GATE ACCEPTANCE SUITE');
console.log('================================================================\n');

// -------------------------------------------------------------------
// SCENARIO H: Draft Plan Cannot Be Released as Final Patient Prescription
// -------------------------------------------------------------------
console.log('--- SCENARIO H: Draft Plan Cannot Be Released ---');
{
  const patient = createSyntheticPatient('pt_draft_01', 'Draft Patient');
  const draftPlan = makePlan(patient);
  assert(draftPlan.status === 'draft', 'Scenario H: Generated plan starts in "draft" status');

  const releaseCheck = validateReportReleaseEligibility({
    patient,
    plan: draftPlan,
    weeklyDietPlan: draftPlan
  });

  assert(!releaseCheck.isEligible, 'Scenario H: Draft plan is strictly ineligible for patient release');
  assert(releaseCheck.blockingReasons.some(r => r.includes('approved')), 'Scenario H: Explains blocking reason as missing approval');

  const patientPayload = buildPatientReportProjection({
    patient,
    dietChart: draftPlan.days[0].meals,
    weeklyDietPlan: draftPlan
  });
  assert(patientPayload.is_released === false, 'Scenario H: Patient payload has is_released: false');
  assert(patientPayload.release_eligibility.is_eligible === false, 'Scenario H: Release eligibility flag is false in payload');
}

// -------------------------------------------------------------------
// SCENARIO I: Formally Approved Plan Can Be Released
// -------------------------------------------------------------------
console.log('\n--- SCENARIO I: Formally Approved Plan Can Be Released ---');
{
  const patient = createSyntheticPatient('pt_approved_01', 'Approved Patient');
  const draftPlan = makePlan(patient);

  const approvedPlan = approveWeeklyDietPlan(
    draftPlan,
    'Dr. Farhana Rahman, MD, CNS',
    'Prescribed 4-week metabolic restoration protocol.'
  );

  assert(approvedPlan.status === 'approved' && approvedPlan.is_approved === true, 'Scenario I: Plan transitioned to "approved"');

  const releaseCheck = validateReportReleaseEligibility({
    patient,
    plan: approvedPlan,
    weeklyDietPlan: approvedPlan
  });

  assert(releaseCheck.isEligible, 'Scenario I: Approved plan is eligible for patient release');
  assert(releaseCheck.blockingReasons.length === 0, 'Scenario I: Zero blocking reasons on approved plan');

  const patientPayload = buildPatientReportProjection({
    patient,
    dietChart: approvedPlan.days[0].meals,
    weeklyDietPlan: approvedPlan
  });
  assert(patientPayload.is_released === true, 'Scenario I: Patient payload has is_released: true');
  assert(patientPayload.nutritionist_signoff.is_verified === true, 'Scenario I: Nutritionist signoff is verified');
  assert(patientPayload.nutritionist_signoff.clinician_name === 'Dr. Farhana Rahman, MD, CNS', 'Scenario I: Nutritionist name preserved on patient release');
}

// -------------------------------------------------------------------
// SCENARIO J: Plan with Active HARD_STOP Cannot Be Released
// -------------------------------------------------------------------
console.log('\n--- SCENARIO J: Clinical Hard Stop Blocks Release ---');
{
  const patient = createSyntheticPatient('pt_hardstop_01', 'Hard Stop Patient');
  const draftPlan = makePlan(patient);
  
  // Attempt release while safety evaluation indicates HARD_STOP
  const releaseCheck = validateReportReleaseEligibility({
    patient,
    plan: draftPlan,
    weeklyDietPlan: draftPlan,
    safetyEvaluation: { overallDecision: 'HARD_STOP', reasons: ['ALLERGEN_CONFIRMED_HARD_STOP'] }
  });

  assert(!releaseCheck.isEligible, 'Scenario J: Safety HARD_STOP blocks release eligibility');
  assert(releaseCheck.blockingReasons.some(r => r.includes('HARD_STOP')), 'Scenario J: Explains active HARD_STOP reason');
}

// -------------------------------------------------------------------
// SCENARIO K: Confirmed RED Food Item Blocks Release
// -------------------------------------------------------------------
console.log('\n--- SCENARIO K: Confirmed Contraindicated RED Food Blocks Release ---');
{
  const patient = createSyntheticPatient('pt_red_food_01', 'Red Food Patient');
  const draftPlan = makePlan(patient);
  
  // Inject a RED food item into Day 1 Meal 1
  const contaminatedPlan: WeeklyDietPlan = {
    ...draftPlan,
    status: 'approved',
    is_approved: true,
    approved_by: 'Dr. Test Clinician',
    days: draftPlan.days.map((d, dIdx) => dIdx === 0 ? {
      ...d,
      meals: d.meals.map((m, mIdx) => mIdx === 0 ? {
        ...m,
        items: [
          ...m.items,
          {
            id: 'item_red_test',
            food_id: 'f_red_01',
            food_name_bn: 'নিষিদ্ধ খাদ্য',
            food_name_en: 'Contraindicated Food',
            category: 'cereals' as any,
            raw_weight_g: 50,
            cooked_weight_g: 50,
            cooked_display_bn: '৫০ গ্রাম',
            cooked_display_en: '50g',
            kcal: 150,
            protein_g: 4,
            carbs_g: 25,
            fat_g: 1,
            fiber_g: 1,
            prep_note_bn: '',
            prep_note_en: '',
            traffic_status: 'RED',
            contraindicated_reasons: ['Celiac disease gluten reaction'],
            alternatives: []
          }
        ]
      } : m)
    } : d)
  };

  const releaseCheck = validateReportReleaseEligibility({
    patient,
    plan: contaminatedPlan,
    weeklyDietPlan: contaminatedPlan
  });

  assert(!releaseCheck.isEligible, 'Scenario K: Plan containing RED food is strictly blocked from release');
  assert(releaseCheck.blockingReasons.some(r => r.includes('RED') || r.includes('contraindicated')), 
    'Scenario K: Explains RED food blocker reason');
}

// -------------------------------------------------------------------
// SCENARIO L: Editing Approved Plan Invalidates Release Permission
// -------------------------------------------------------------------
console.log('\n--- SCENARIO L: Editing Plan Transitions to Requires Review & Blocks Release ---');
{
  const patient = createSyntheticPatient('pt_invalid_01', 'Invalidated Patient');
  const draftPlan = makePlan(patient);
  const approvedPlan = approveWeeklyDietPlan(draftPlan, 'Dr. Ahmed', 'Initial approval');

  // Invalidate plan due to meal modification
  const invalidatedPlan = invalidateWeeklyPlanApproval(approvedPlan, 'Day 2 meal grams manually edited');
  assert(invalidatedPlan.status === 'requires_review', 'Scenario L: Plan status is "requires_review"');
  assert(invalidatedPlan.is_approved === false, 'Scenario L: is_approved reset to false');
  assert(Boolean(invalidatedPlan.invalidated_at), 'Scenario L: invalidated_at timestamp recorded');

  const releaseCheck = validateReportReleaseEligibility({
    patient,
    plan: invalidatedPlan,
    weeklyDietPlan: invalidatedPlan
  });

  assert(!releaseCheck.isEligible, 'Scenario L: Invalidated plan cannot be released to patient');
  assert(releaseCheck.blockingReasons.some(r => r.includes('requires_review') || r.includes('invalidated')), 
    'Scenario L: Explains invalidation reason to clinician');
}

// -------------------------------------------------------------------
// SCENARIO M: Patient Switching Never Leaks Data Between Patients
// -------------------------------------------------------------------
console.log('\n--- SCENARIO M: Patient Isolation & Zero Cross-Contamination ---');
{
  const patientAlpha = createSyntheticPatient('pt_alpha', 'Mrs. Alpha', { weight_kg: 85, confirmed_allergies: ['peanut'] });
  const patientBeta = createSyntheticPatient('pt_beta', 'Mr. Beta', { weight_kg: 62, confirmed_allergies: ['shrimp'] });

  const planAlpha = makePlan(patientAlpha);
  const planBeta = makePlan(patientBeta);

  const payloadAlpha = buildPatientReportProjection({ patient: patientAlpha, dietChart: planAlpha.days[0].meals, weeklyDietPlan: planAlpha });
  const payloadBeta = buildPatientReportProjection({ patient: patientBeta, dietChart: planBeta.days[0].meals, weeklyDietPlan: planBeta });

  assert(payloadAlpha.patient_identity.name === 'Mrs. Alpha', 'Scenario M: Payload Alpha has Patient Alpha name');
  assert(payloadBeta.patient_identity.name === 'Mr. Beta', 'Scenario M: Payload Beta has Patient Beta name');
  assert(payloadAlpha.safety_instructions.confirmed_allergies_to_avoid_en.includes('peanut'), 'Scenario M: Patient Alpha has peanut allergy');
  assert(!payloadBeta.safety_instructions.confirmed_allergies_to_avoid_en.includes('peanut'), 'Scenario M: Patient Beta does NOT inherit peanut allergy');
  assert(payloadBeta.safety_instructions.confirmed_allergies_to_avoid_en.includes('shrimp'), 'Scenario M: Patient Beta has shrimp allergy');
  assert(!payloadAlpha.safety_instructions.confirmed_allergies_to_avoid_en.includes('shrimp'), 'Scenario M: Patient Alpha does NOT inherit shrimp allergy');
}

// -------------------------------------------------------------------
// SCENARIO N: Historical Visit Isolation
// -------------------------------------------------------------------
console.log('\n--- SCENARIO N: Historical Visit Isolation ---');
{
  const patient = createSyntheticPatient('pt_multi_visit', 'Multi-Visit Patient');
  const visitV1: ClinicalVisit = {
    visit_id: 'vis_oct_01',
    patient_id: patient.id,
    visit_number: 1,
    visit_date: '2026-10-01',
    visit_type: 'baseline_consultation',
    status: 'completed',
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z'
  };
  const visitV2: ClinicalVisit = {
    visit_id: 'vis_nov_15',
    patient_id: patient.id,
    visit_number: 2,
    visit_date: '2026-11-15',
    visit_type: 'follow_up_review',
    status: 'in_progress',
    created_at: '2026-11-15T10:00:00Z',
    updated_at: '2026-11-15T10:00:00Z'
  };

  const plan = makePlan(patient);
  const payloadV1 = buildPatientReportProjection({ patient, dietChart: plan.days[0].meals, weeklyDietPlan: plan, visit: visitV1 });
  const payloadV2 = buildPatientReportProjection({ patient, dietChart: plan.days[0].meals, weeklyDietPlan: plan, visit: visitV2 });

  assert(payloadV1.patient_identity.visit_id === 'vis_oct_01', 'Scenario N: Payload V1 is bound to visit_id vis_oct_01');
  assert(payloadV1.patient_identity.visit_date === '2026-10-01', 'Scenario N: Payload V1 reflects Visit 1 date (2026-10-01)');
  assert(payloadV2.patient_identity.visit_id === 'vis_nov_15', 'Scenario N: Payload V2 is bound to visit_id vis_nov_15');
  assert(payloadV2.patient_identity.visit_date === '2026-11-15', 'Scenario N: Payload V2 reflects Visit 2 date (2026-11-15)');
}

console.log('\n================================================================');
console.log(`R1 APPROVAL GATE RESULTS: ${passedAssertions}/${totalAssertions} PASSED (${failedAssertions} FAILED)`);
console.log('================================================================\n');

if (failedAssertions > 0) {
  process.exit(1);
}
