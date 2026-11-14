import { calculateAnthropometrics } from '../src/engine/anthropometrics';
import { analyzeFunctionalLabs } from '../src/engine/labAnalyzer';
import { resolveConflicts } from '../src/engine/conflictResolver';
import { evaluateDNIAndTimeline, checkSupplementOverlaps } from '../src/engine/dniEngine';
import { buildAutoScaledDietChart, selectSafeMealCandidate } from '../src/engine/mealScaler';
import { advanceToNextPhase, recordFollowUpVisit } from '../src/engine/phaseProgression';
import foodsData from '../src/data/foods.json';
import medsData from '../src/data/medicines.json';
import suppsData from '../src/data/supplements.json';
import { FoodItem, MedicineItem, SupplementItem, PatientProfile, PatientRecord, CandidateSupplement } from '../src/types';

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

// TEST SUITE 1: Food Safety & Allergen Non-Overridable Exclusion
console.log("Suite 1: Food Safety & Allergen Non-Overridable Exclusion");
{
  const trafficWithAllergy = resolveConflicts(
    allFoods,
    ['t2d_ir'],
    [],
    ['egg', 'shrimp'], // Confirmed Allergens
    ['f_01_0001'] // Clinician Disallowed: Red Rice
  );

  // Check egg is strictly RED
  const eggFood = allFoods.find(f => f.name_en.toLowerCase().includes('egg'));
  const evaluatedEgg = trafficWithAllergy.red.find(f => f.id === eggFood?.id);
  assert(Boolean(evaluatedEgg), "Confirmed allergen 'egg' is categorized as RED");
  const eggReason = evaluatedEgg?.reasons.find(r => r.category === 'confirmed_allergy');
  assert(Boolean(eggReason && eggReason.isOverridable === false), "Allergen has category 'confirmed_allergy' and is non-overridable");

  // Check clinician disallowed food is RED
  const redRiceItem = trafficWithAllergy.red.find(f => f.id === 'f_01_0001');
  assert(Boolean(redRiceItem), "Clinician-disallowed food 'f_01_0001' is categorized as RED");
  const clinicianReason = redRiceItem?.reasons.find(r => r.category === 'clinician_restriction');
  assert(Boolean(clinicianReason && clinicianReason.isOverridable === false), "Clinician exclusion has category 'clinician_restriction'");

  // Test Auto-Scaled Diet Chart NEVER selects egg when allergic
  const testPatient: PatientProfile = {
    schema_version: 2,
    id: 'pt_test_allergy',
    name: 'Allergy Test Patient',
    age: 45,
    gender: 'female',
    phone: '',
    visit_date: '2026-11-14',
    current_phase: 1,
    height_cm: 155,
    weight_kg: 68,
    waist_cm: 85,
    activity_level: 'sedentary',
    sleep_hours: 7,
    shift_worker: false,
    population_group: 'adult_standard',
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: ['egg'],
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
    calculated: calculateAnthropometrics(45, 'female', 155, 68, 85, 'sedentary', ['t2d_ir'])
  };

  const generatedChart = buildAutoScaledDietChart(testPatient, allFoods, trafficWithAllergy);
  const items = generatedChart.flatMap(m => m.items);
  const containsEgg = items.some(i => i.food_name_en.toLowerCase().includes('egg'));
  assert(!containsEgg, "Diet Chart NEVER selects egg for egg-allergic patient");
}

// TEST SUITE 2: Slot Constraint Error Engine (No Silent Unsafe Fallbacks)
console.log("\nSuite 2: Safety-Constrained Selection & Error Generation");
{
  const testPatient: PatientProfile = {
    schema_version: 2,
    id: 'pt_test_constraint',
    name: 'Constraint Test Patient',
    age: 40,
    gender: 'male',
    phone: '',
    visit_date: '2026-11-14',
    current_phase: 1,
    height_cm: 170,
    weight_kg: 75,
    waist_cm: 90,
    activity_level: 'sedentary',
    sleep_hours: 7,
    shift_worker: false,
    population_group: 'adult_standard',
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: ['dairy'],
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
    calculated: calculateAnthropometrics(40, 'male', 170, 75, 90, 'sedentary', ['t2d_ir'])
  };

  // Simulate empty category for testing slot constraint error
  const res = selectSafeMealCandidate(
    'Special Protein Slot',
    'protein',
    ['nonexistent_food_keyword_xyz'],
    allFoods,
    [], // No green candidates
    [], // No yellow candidates
    trafficLightDummyRed(allFoods),
    testPatient
  );

  assert(res.food === null, "Returns food = null when all candidates are contraindicated");
  assert(Boolean(res.error), "Returns structured MealSlotConstraintError");
  assert(res.error?.slot_name === 'Special Protein Slot', "Error contains matching slot name");
}

function trafficLightDummyRed(foods: FoodItem[]) {
  return foods.map(f => ({
    ...f,
    traffic_status: 'RED' as const,
    reasons: []
  }));
}

// TEST SUITE 3: Population-Specific Safety Checks (Pediatric & Gestational)
console.log("\nSuite 3: Population-Specific Metabolic Safety Gates");
{
  // Pediatric case
  const pediatricCalc = calculateAnthropometrics(
    14, // <18 pediatric
    'male',
    150,
    45,
    65,
    'moderately_active',
    [],
    'pediatric'
  );
  assert(Boolean(pediatricCalc.population_warning), "Pediatric intake generates explicit clinical warning");
  assert(pediatricCalc.is_estimated === true, "Anthropometric output marked as estimated");

  // Pregnancy case
  const pregnancyCalc = calculateAnthropometrics(
    28,
    'female',
    160,
    65,
    80,
    'lightly_active',
    [],
    'pregnancy',
    2 // 2nd Trimester (+340 kcal)
  );
  assert(Boolean(pregnancyCalc.population_warning), "Pregnancy generates gestational energy warning");
  assert(pregnancyCalc.target_calories >= pregnancyCalc.tdee, "Pregnancy never prescribes a hypocaloric deficit");
}

// TEST SUITE 4: Drug-Nutrient Deduplication & Upper Intake Level (UL) Screening
console.log("\nSuite 4: DNI Deduplication & Cumulative Nutrient Overlap Screening");
{
  const duplicateMedsPatient: PatientProfile = {
    schema_version: 2,
    id: 'pt_dup_meds',
    name: 'Duplicate Meds Patient',
    age: 55,
    gender: 'male',
    phone: '',
    visit_date: '2026-11-14',
    current_phase: 1,
    height_cm: 168,
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
    active_medications: ['med_metformin', 'metformin', 'Metformin 500mg', 'med_ppi', 'med_ppi'], // Duplicates!
    gut_profile: {
      bloating: 'none',
      acid_reflux_hypoacidity: false,
      bristol_stool_score: 4,
      energy_score: 6,
      sleep_quality_score: 6,
      digestive_fire_agni: 'samagni'
    },
    labs: { lab_flags: [] },
    calculated: calculateAnthropometrics(55, 'male', 168, 80, 95, 'sedentary', ['t2d_ir'])
  };

  const dniResult = evaluateDNIAndTimeline(duplicateMedsPatient, allMeds, allSupps);
  // Deduplication check
  const metforminDepletions = dniResult.depletions.filter(d => d.medicineName.toLowerCase().includes('metformin'));
  // Should not have duplicated sets of depletions
  const b12Depletions = metforminDepletions.filter(d => d.depletion.nutrient.toLowerCase().includes('b12'));
  assert(b12Depletions.length === 1, "Duplicate active medication inputs are strictly deduplicated");

  // Candidate supplements review check
  const candidateSupps = dniResult.candidateSupplements;
  assert(candidateSupps.every(s => s.approval_status === 'candidate_review'), "Candidate supplements default to 'candidate_review'");

  // Overlap screening test: Two magnesium supplements
  const testCandidateSupps: CandidateSupplement[] = [
    {
      id: 'supp_magnesium_glycinate',
      name_en: 'Magnesium Bisglycinate',
      name_bn: 'ম্যাগনেসিয়াম গ্লাইসিনেট',
      category: 'Mineral',
      clinical_indications: ['Insulin resistance'],
      recommended_dose: '200 mg elemental',
      timing_schedule: 'Bedtime',
      timing_note_bn: '',
      timing_note_en: '',
      verified_bd_brands: ['Gefomag'],
      contraindications: [],
      approval_status: 'candidate_review'
    },
    {
      id: 'supp_magnesium_citrate',
      name_en: 'Magnesium Citrate',
      name_bn: 'ম্যাগনেসিয়াম সাইট্রেট',
      category: 'Mineral',
      clinical_indications: ['Constipation'],
      recommended_dose: '250 mg elemental',
      timing_schedule: 'Evening',
      timing_note_bn: '',
      timing_note_en: '',
      verified_bd_brands: ['Mag-C'],
      contraindications: [],
      approval_status: 'candidate_review'
    }
  ];

  const overlaps = checkSupplementOverlaps(testCandidateSupps);
  assert(overlaps.length > 0, "Detects cumulative supplemental magnesium overlap exceeding 350 mg UL");
  assert(overlaps[0].nutrient.includes("Magnesium"), "Overlap warning flags specific nutrient (Magnesium)");
}

// TEST SUITE 5: Phase Progression Data Integrity (No Synthetic Relief Percentages)
console.log("\nSuite 5: Phase Progression & Longitudinal Data Integrity");
{
  const basePatient: PatientProfile = {
    schema_version: 2,
    id: 'pt_phase_test',
    name: 'Phase Test Patient',
    age: 48,
    gender: 'female',
    phone: '',
    visit_date: '2026-11-14',
    current_phase: 1,
    height_cm: 152,
    weight_kg: 74,
    waist_cm: 92,
    activity_level: 'sedentary',
    sleep_hours: 6,
    shift_worker: false,
    population_group: 'adult_standard',
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: [],
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    selected_conditions: ['t2d_ir'],
    active_medications: [],
    gut_profile: {
      bloating: 'mild',
      acid_reflux_hypoacidity: false,
      bristol_stool_score: 3,
      energy_score: 5,
      sleep_quality_score: 6,
      digestive_fire_agni: 'mandagni'
    },
    labs: { lab_flags: [] },
    calculated: calculateAnthropometrics(48, 'female', 152, 74, 92, 'sedentary', ['t2d_ir'])
  };

  const initialRecord: PatientRecord = {
    schema_version: 2,
    patient: basePatient,
    visits: [],
    current_diet_chart: [],
    current_supplements: [],
    timeline: [],
    updated_at: '2026-11-14T00:00:00.000Z'
  };

  // Advance to Phase 2 with actual clinician evaluation (70% relief, not fabricated 25% or 50%)
  const advancedRecord = advanceToNextPhase(initialRecord, {
    actualSymptomReliefPct: 70,
    rationale: "Patient achieved digestive stability and reduced fasting glucose.",
    clinicalObservations: "Reported no bloating; ready for sprouted lentil introduction."
  });

  assert(advancedRecord.patient.current_phase === 2, "Advances care phase from 1 to 2");
  const newVisit = advancedRecord.visits[0];
  assert(newVisit.symptom_relief_pct === 70, "Records actual clinician-evaluated symptom relief (70%), not synthetic 25*phase");
  assert(newVisit.phase_transition_rationale?.includes("digestive stability") === true, "Records explicit phase transition rationale");
  assert(newVisit.is_phase_transition === true, "Flags visit as a phase transition");

  // Regular follow-up without advancing phase
  const followUpRecord = recordFollowUpVisit(advancedRecord, {
    weight_kg: 72.5,
    symptom_relief_pct: 75,
    notes_en: "Mid-phase check-in: excellent adherence."
  });

  assert(followUpRecord.patient.current_phase === 2, "Regular visit keeps current phase at 2 without forcing transition");
  assert(followUpRecord.visits.length === 2, "Logs second visit in longitudinal history");
}

console.log("\n=================================================");
console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("=================================================");

if (failedCount > 0) {
  process.exit(1);
}
