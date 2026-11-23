/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION PLATFORM
 * Phase R4: Advanced Lifestyle, Exercise, Chronotherapy & Supplement Intelligence
 * Comprehensive Multi-Axis Engine, Safety Gate & Persistence Test Suite
 */

import { generateLifestyleRecommendations, generateLifestyleProtocol } from '../src/engine/lifestyleEngine';
import { generateExerciseProtocol } from '../src/engine/exerciseEngine';
import { 
  generateSleepCircadianProtocol, 
  timeToMinutes, 
  minutesToTime, 
  calculateIntervalHours, 
  subtractHoursFromTime, 
  addHoursToTime 
} from '../src/engine/sleepEngine';
import { generateHydrationProtocol } from '../src/engine/hydrationEngine';
import { 
  parseDoseString, 
  checkAdvancedSupplementOverlaps, 
  generateCandidateSupplements 
} from '../src/engine/supplementEngine';
import { 
  buildChronotherapyTimeline, 
  calculateCircularDifferenceHours 
} from '../src/engine/chronotherapyEngine';
import { evaluateR4ProtocolSafety } from '../src/engine/r4SafetyEngine';
import { 
  generateAutomaticProtocolDraft, 
  createManualProtocolTemplate, 
  recalculateProtocolSafety 
} from '../src/engine/r4ProtocolStudioEngine';
import { LocalDemoRepository } from '../src/repositories/LocalDemoRepository';
import { PatientProfile } from '../src/types';
import { ClinicianAuthProfile } from '../src/lib/supabaseClient';
import { SupplementProtocolItem } from '../src/types/r4Protocol';

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

// In-memory localStorage mock for node test runner
const memoryStorage: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (key: string) => memoryStorage[key] || null,
  setItem: (key: string, val: string) => { memoryStorage[key] = val; },
  removeItem: (key: string) => { delete memoryStorage[key]; },
  clear: () => { for (const k in memoryStorage) delete memoryStorage[k]; }
};
(global as any).window = {};

console.log('\n================================================================');
console.log('SHUDDHO PHASE R4: PROTOCOL STUDIO & SAFETY ENGINE TEST SUITE');
console.log('================================================================\n');

// Standard Synthetic Baseline Patient (42yo Male, T2D, Sedentary)
function createSyntheticTestPatient(overrides: Partial<PatientProfile> = {}): PatientProfile {
  return {
    schema_version: 2,
    id: 'pt_test_r4_001',
    name: 'Rahim Uddin (Synthetic Test)',
    age: 45,
    gender: 'male',
    phone: '01711000000',
    visit_date: '2026-11-24',
    current_phase: 1,
    height_cm: 172,
    weight_kg: 78,
    waist_cm: 94,
    activity_level: 'sedentary',
    sleep_hours: 6.5,
    shift_worker: false,
    population_group: 'adult_standard',
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: [],
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    selected_conditions: ['t2d_ir', 'hypertension_ckd'],
    active_medications: ['Metformin 500mg', 'Amlodipine 5mg'],
    gut_profile: {
      bloating: 'mild',
      acid_reflux_hypoacidity: true,
      bristol_stool_score: 4,
      energy_score: 6,
      sleep_quality_score: 5,
      digestive_fire_agni: 'mandagni'
    },
    labs: {
      hba1c: 7.4,
      fasting_glucose: 142,
      serum_creatinine: 1.1,
      egfr: 82,
      hemoglobin: 13.8,
      lab_flags: []
    },
    calculated: {
      bmi: 26.37,
      bmi_category_en: 'Overweight',
      bmi_category_bn: 'অতিরিক্ত ওজন',
      ibw_kg: 68,
      adjusted_bw_kg: 70.5,
      whtr: 0.54,
      whtr_risk_en: 'Increased Risk',
      whtr_risk_bn: 'ঝুঁকিপূর্ণ',
      bmr: 1620,
      tdee: 1944,
      bmr_safe_calorie_floor: 1620,
      target_calories: 1650,
      target_protein_g: 90,
      target_carbs_g: 170,
      target_fat_g: 55,
      protein_ratio_used: '1.2 g/kg',
      population_group: 'adult_standard',
      bmr_floor_strategy: 'clamped_to_bmr',
      is_estimated: false,
      energy_calculation_method: 'Mifflin-St Jeor'
    },
    vitals: {
      systolic_bp: 132,
      diastolic_bp: 84
    },
    ...overrides
  };
}

(async () => {
  // ===================================================================
  // 1. Lifestyle Engine Tests
  // ===================================================================
  console.log('--- 1. Lifestyle Engine Intelligence ---');
  const basePatient = createSyntheticTestPatient();
  const lifestyleProto = generateLifestyleRecommendations(basePatient);

  assert(lifestyleProto.recommendations.length >= 6, 'Generates at least 6 personalized lifestyle recommendations');
  
  const lightRec = lifestyleProto.recommendations.find(r => r.category === 'light_exposure');
  assert(Boolean(lightRec), 'Includes morning daylight exposure recommendation for SCN circadian entrainment');

  const walkingRec = lifestyleProto.recommendations.find(r => r.id === 'rec_postprandial_walking');
  assert(Boolean(walkingRec), 'Includes postprandial walking recommendation for non-insulin GLUT4 translocation in T2D');

  const gerdRec = lifestyleProto.recommendations.find(r => r.id === 'rec_meal_sleep_spacing');
  assert(Boolean(gerdRec) && gerdRec!.action_en.includes('3-Hour Fasting Window'), 'Prescribes 3-hour dinner-to-bed buffer for acid reflux/GERD');

  // Shift-worker adaptation
  const shiftPatient = createSyntheticTestPatient({ shift_worker: true });
  const shiftLifestyle = generateLifestyleRecommendations(shiftPatient);
  const shiftRec = shiftLifestyle.recommendations.find(r => r.category === 'shift_work');
  assert(Boolean(shiftRec), 'Generates dedicated shift-worker adaptation guidance (sunglasses on morning commute)');

  // ===================================================================
  // 2. Exercise Engine Safety Screening Tests
  // ===================================================================
  console.log('\n--- 2. Exercise Engine & Safety Screening ---');
  const exProtoNormal = generateExerciseProtocol(basePatient);
  assert(exProtoNormal.overall_safety_status === 'SAFE', 'Standard baseline patient cleared as SAFE');
  assert(exProtoNormal.cardiorespiratory_clearance_status === 'cleared_standard', 'Clearance status is cleared_standard');
  assert(exProtoNormal.items.length >= 2, 'Generates default aerobic walking and strength items');

  // Severe uncontrolled hypertension test
  const severeHtPatient = createSyntheticTestPatient({
    vitals: { systolic_bp: 192, diastolic_bp: 114 }
  });
  const exProtoSevereHt = generateExerciseProtocol(severeHtPatient);
  assert(exProtoSevereHt.overall_safety_status === 'HARD_STOP', 'Severe hypertension (BP >= 180/110) triggers exercise HARD_STOP');
  assert(exProtoSevereHt.cardiorespiratory_clearance_status === 'strictly_contraindicated', 'Clearance status is strictly_contraindicated');
  assert(exProtoSevereHt.clinical_contraindications.length > 0, 'Clinical contraindication recorded');

  // Insulin / Sulfonylurea hypoglycemia risk test
  const diabeticInsulinPatient = createSyntheticTestPatient({
    active_medications: ['Insulin Glargine 20U', 'Metformin 1000mg']
  });
  const exProtoInsulin = generateExerciseProtocol(diabeticInsulinPatient);
  assert(exProtoInsulin.overall_safety_status === 'CAUTION', 'Insulin treatment triggers exercise CAUTION');
  const walkingItem = exProtoInsulin.items.find(i => i.category === 'walking' || i.category === 'brisk_walking');
  assert(walkingItem !== undefined && walkingItem.monitoring_instructions_en.includes('hypoglycemia'), 'Exercise item includes pre-exercise glucose check and fast-acting carbs mandate');

  // Severe renal failure (eGFR < 30)
  const ckdPatient = createSyntheticTestPatient({
    labs: { egfr: 22, lab_flags: [] },
    selected_conditions: ['t2d_ir', 'ckd_stage_1_3b']
  });
  const exProtoCkd = generateExerciseProtocol(ckdPatient);
  assert(exProtoCkd.overall_safety_status === 'CAUTION', 'Advanced CKD (eGFR < 30) triggers CAUTION with rhabdomyolysis restriction');

  // ===================================================================
  // 3. Sleep Engine & Cross-Midnight Chronobiology
  // ===================================================================
  console.log('\n--- 3. Sleep Engine & Cross-Midnight Chronobiology ---');
  // Circular time arithmetic tests
  assert(timeToMinutes('00:00') === 0, '00:00 is 0 minutes');
  assert(timeToMinutes('23:59') === 1439, '23:59 is 1439 minutes');
  assert(minutesToTime(0) === '00:00', '0 minutes maps to 00:00');
  assert(minutesToTime(1439) === '23:59', '1439 minutes maps to 23:59');

  // Cross-midnight interval: 23:00 to 07:00 is exactly 8 hours
  const intervalCrossMidnight = calculateIntervalHours('23:00', '07:00');
  assert(intervalCrossMidnight === 8, `calculateIntervalHours('23:00', '07:00') === 8.0 (actual: ${intervalCrossMidnight})`);

  // Circular difference: 23:00 to 01:00 is 2.0 hours
  const circularDiff = calculateCircularDifferenceHours('23:00', '01:00');
  assert(circularDiff === 2, `calculateCircularDifferenceHours('23:00', '01:00') === 2.0 (actual: ${circularDiff})`);

  // Curfews calculation relative to bedtime
  const sleepProto = generateSleepCircadianProtocol(basePatient);
  assert(sleepProto.wake_time === '06:30', 'Calculates wake time 06:30');
  assert(sleepProto.bed_time === '23:00', 'Calculates bed time 23:00 (7.5h target window)');
  assert(sleepProto.caffeine_curfew_time === '14:00', 'Caffeine curfew is 14:00 (9 hours prior to 23:00 bed)');
  assert(sleepProto.last_meal_curfew_time === '20:00', 'Dinner curfew is 20:00 (3 hours prior to 23:00 bed)');

  // Night shift worker sleep schedule
  const sleepProtoNightShift = generateSleepCircadianProtocol(shiftPatient);
  assert(sleepProtoNightShift.wake_time === '16:30', 'Night shift worker wakes at 16:30');
  assert(sleepProtoNightShift.bed_time === '08:30', 'Night shift worker beds down at 08:30 (daytime sleep block)');

  // ===================================================================
  // 4. Hydration Engine & Clinical Restriction Ceilings
  // ===================================================================
  console.log('\n--- 4. Hydration Engine & Fluid Restriction Ceilings ---');
  const hydProtoNormal = generateHydrationProtocol(basePatient);
  assert(hydProtoNormal.is_restricted === false, 'Standard patient has unrestricted fluid target');
  assert(hydProtoNormal.baseline_fluid_target_ml >= 2000, `Baseline fluid target is adequate (actual: ${hydProtoNormal.baseline_fluid_target_ml} mL)`);
  assert(hydProtoNormal.hydration_events.length >= 5, 'Generates structured temporal hydration events throughout the day');

  // Dialysis / ESRD strict ceiling test (1200 mL)
  const dialysisPatient = createSyntheticTestPatient({
    confirmed_conditions: ['ESRD on Hemodialysis'],
    labs: { egfr: 10, lab_flags: [] }
  });
  const hydProtoDialysis = generateHydrationProtocol(dialysisPatient);
  assert(hydProtoDialysis.is_restricted === true, 'Dialysis patient flagged as restricted');
  assert(hydProtoDialysis.clinician_fluid_limit_ml === 1200, 'Enforces strict 1200 mL/day hemodialysis fluid limit');
  assert(hydProtoDialysis.total_scheduled_ml <= 1200, `Total scheduled hydration (${hydProtoDialysis.total_scheduled_ml} mL) does not exceed 1200 mL ceiling`);

  // Congestive Heart Failure strict ceiling test (1500 mL)
  const chfPatient = createSyntheticTestPatient({
    confirmed_conditions: ['Congestive Heart Failure NYHA II']
  });
  const hydProtoChf = generateHydrationProtocol(chfPatient);
  assert(hydProtoChf.is_restricted === true, 'Heart failure patient flagged as restricted');
  assert(hydProtoChf.clinician_fluid_limit_ml === 1500, 'Enforces strict 1500 mL/day CHF fluid ceiling');

  // ===================================================================
  // 5. Supplement Engine, Elemental Dosing & Tolerable Upper Limits
  // ===================================================================
  console.log('\n--- 5. Supplement Engine, Elemental Dosing & Upper Limits ---');
  // Dose string parsing
  const parsedMg = parseDoseString('200 mg elemental (2000 mg bisglycinate)', 'once_daily');
  assert(parsedMg.elementalValue === 200, 'Parses elemental magnesium value (200 mg)');
  assert(parsedMg.unit === 'mg', 'Parses unit as mg');
  assert(parsedMg.isUndetermined === false, 'Standard dose is not undetermined');

  const parsedVitD = parseDoseString('2000 IU', 'once_daily');
  assert(parsedVitD.representativeDailyValue === 2000, 'Parses daily Vitamin D3 (2000 IU)');

  const parsedWeeklyVitD = parseDoseString('40,000 IU', 'weekly');
  assert(Math.round(parsedWeeklyVitD.representativeDailyValue || 0) === 5714, 'Normalizes weekly 40,000 IU dose to ~5714 IU/day');

  // Undetermined dose handling
  const parsedUnknown = parseDoseString('1 capsule proprietary herbal blend', 'once_daily');
  assert(parsedUnknown.isUndetermined === true, 'Proprietary non-standardized blend flagged as isUndetermined (never assumes zero)');

  // Multi-source Magnesium Overlap exceeding Tolerable Upper Limit (350 mg elemental)
  const testSuppsExceedingUL: SupplementProtocolItem[] = [
    {
      id: 'supp_1',
      generic_nutrient: 'Magnesium',
      chemical_form: 'Bisglycinate Chelate',
      brand_verification_status: 'generic_prescription_only',
      indication_en: 'Muscle relaxation and insulin sensitivity',
      indication_bn: 'পেশির শিথিলতা',
      evidence_category: 'evidence_based',
      total_compound_dose: '250 mg elemental',
      frequency: 'once_daily',
      administration_time: '21:30',
      relationship_to_food: 'before_bed',
      duration_weeks: 12,
      monitoring_parameters: [],
      contraindications: [],
      known_interactions: [],
      approval_status: 'draft_candidate',
      source: 'dni_auto_candidate'
    },
    {
      id: 'supp_2',
      generic_nutrient: 'Magnesium',
      chemical_form: 'Citrate',
      brand_verification_status: 'generic_prescription_only',
      indication_en: 'Bowel motility',
      indication_bn: 'হজম সহায়তা',
      evidence_category: 'evidence_based',
      total_compound_dose: '200 mg elemental',
      frequency: 'once_daily',
      administration_time: '08:00',
      relationship_to_food: 'with_breakfast',
      duration_weeks: 12,
      monitoring_parameters: [],
      contraindications: [],
      known_interactions: [],
      approval_status: 'draft_candidate',
      source: 'clinician_manual_entry'
    }
  ];

  const overlapWarnings = checkAdvancedSupplementOverlaps(testSuppsExceedingUL, basePatient);
  assert(overlapWarnings.length > 0, 'Detects multi-source magnesium overlap');
  const magUlWarning = overlapWarnings.find(w => w.nutrient.includes('Magnesium'));
  assert(magUlWarning !== undefined && magUlWarning.severity === 'high', 'Magnesium total (450 mg) flagged as HIGH severity UL violation (ceiling 350 mg/day)');

  // Candidate generation maps DNI depletions
  const metforminPatient = createSyntheticTestPatient({
    active_medications: ['Metformin 1000mg', 'Omeprazole 20mg']
  });
  const candidates = generateCandidateSupplements(metforminPatient);
  const b12Candidate = candidates.find(c => c.generic_nutrient.toLowerCase().includes('b12') || c.chemical_form.toLowerCase().includes('methylcobalamin'));
  assert(Boolean(b12Candidate), 'Generates Vitamin B12 (Methylcobalamin) candidate for Metformin depletion');
  assert(b12Candidate?.approval_status === 'draft_candidate', 'Candidate supplement starts in draft_candidate status (never auto-approved)');

  const mgCandidate = candidates.find(c => c.generic_nutrient.toLowerCase().includes('magnesium'));
  assert(Boolean(mgCandidate), 'Generates Magnesium candidate for PPI (Omeprazole) depletion');

  // ===================================================================
  // 6. Chronotherapy Timeline & Spacing Conflict Detection
  // ===================================================================
  console.log('\n--- 6. Chronotherapy Spacing & Collision Detection ---');
  // Test Case A: Levothyroxine + Calcium collision (< 4 hours)
  const levoMedication = {
    name: 'Thyrox (Levothyroxine)',
    dosage: '50 mcg',
    timing: '06:30' // Taken on waking
  };

  const calciumSupp: SupplementProtocolItem = {
    id: 'supp_calcium_collision',
    generic_nutrient: 'Calcium',
    chemical_form: 'Calcium Carbonate',
    brand_verification_status: 'generic_prescription_only',
    indication_en: 'Bone density',
    indication_bn: 'হাড়ের ঘনত্ব',
    evidence_category: 'evidence_based',
    total_compound_dose: '500 mg',
    frequency: 'once_daily',
    administration_time: '08:00', // Only 1.5 hours after Thyrox (VIOLATION of 4h rule)
    relationship_to_food: 'with_breakfast',
    duration_weeks: 12,
    monitoring_parameters: [],
    contraindications: [],
    known_interactions: [],
    approval_status: 'draft_candidate',
    source: 'clinician_manual_entry'
  };

  const { timeline, conflicts } = buildChronotherapyTimeline(
    lifestyleProto,
    exProtoNormal,
    sleepProto,
    hydProtoNormal,
    [calciumSupp],
    [levoMedication]
  );

  const thyroxCollision = conflicts.find(c => c.severity === 'critical' && c.item1_title.toLowerCase().includes('thyrox') || c.item2_title.toLowerCase().includes('thyrox'));
  assert(Boolean(thyroxCollision), 'Detects CRITICAL spacing collision between Levothyroxine and Calcium (< 4 hours)');
  assert(thyroxCollision?.min_interval_hours === 4.0, 'Specifies required separation of 4.0 hours');

  // Verify that timeline item has collision_detected = true
  const thyroxItem = timeline.find(t => t.title_en.toLowerCase().includes('thyrox'));
  assert(thyroxItem?.collision_detected === true, 'Levothyroxine timeline item marked with collision_detected: true');
  assert(thyroxItem?.is_editable === false, 'Prescription medication is locked from accidental manual rescheduling (is_editable: false)');

  // Test Case B: Oral Antibiotic vs Probiotic (< 2 hours)
  const abxMed = {
    name: 'Ciprofloxacin 500mg',
    timing: '08:00'
  };
  const probioticSupp: SupplementProtocolItem = {
    id: 'supp_prob',
    generic_nutrient: 'Probiotics',
    chemical_form: 'Multi-strain spore former',
    brand_verification_status: 'generic_prescription_only',
    indication_en: 'Microbiome restoration',
    indication_bn: 'অন্ত্রের স্বাস্থ্য',
    evidence_category: 'evidence_based',
    total_compound_dose: '50 Billion CFU',
    frequency: 'once_daily',
    administration_time: '08:30', // Only 30 minutes after antibiotic
    relationship_to_food: 'with_breakfast',
    duration_weeks: 4,
    monitoring_parameters: [],
    contraindications: [],
    known_interactions: [],
    approval_status: 'draft_candidate',
    source: 'clinician_manual_entry'
  };

  const { conflicts: abxConflicts } = buildChronotherapyTimeline(
    lifestyleProto,
    exProtoNormal,
    sleepProto,
    hydProtoNormal,
    [probioticSupp],
    [abxMed]
  );
  const probConflict = abxConflicts.find(c => c.severity === 'high');
  assert(Boolean(probConflict), 'Detects HIGH severity spacing conflict between Antibiotic and Probiotic (< 2 hours)');

  // ===================================================================
  // 7. Master Safety Evaluation & Approval Gating
  // ===================================================================
  console.log('\n--- 7. Master Safety Evaluation & Approval Gating ---');
  // Protocol with Thyrox + Calcium collision -> must have HARD_STOP and can_approve = false
  const safetyWithCollision = evaluateR4ProtocolSafety(
    lifestyleProto,
    exProtoNormal,
    sleepProto,
    hydProtoNormal,
    [calciumSupp],
    conflicts,
    basePatient
  );

  assert(safetyWithCollision.overall_status === 'HARD_STOP', 'Overall safety status is HARD_STOP when critical spacing collision exists');
  assert(safetyWithCollision.can_approve === false, 'can_approve is strictly FALSE when Hard Stop exists');
  assert(safetyWithCollision.hard_stops.length > 0, 'Hard stop finding is populated with clinical remedy');

  // Protocol with fluid ceiling exceeded -> must trigger HARD_STOP
  const excessHydration = {
    ...hydProtoDialysis,
    total_scheduled_ml: 1600 // Exceeds 1200 mL dialysis ceiling
  };
  const safetyExcessFluid = evaluateR4ProtocolSafety(
    lifestyleProto,
    exProtoNormal,
    sleepProto,
    excessHydration,
    [],
    [],
    dialysisPatient
  );
  assert(safetyExcessFluid.overall_status === 'HARD_STOP', 'Exceeding prescribed fluid ceiling triggers HARD_STOP');
  const fluidHardStop = safetyExcessFluid.hard_stops.find(h => h.code === 'FLUID_RESTRICTION_EXCEEDED');
  assert(Boolean(fluidHardStop), 'FLUID_RESTRICTION_EXCEEDED hard stop code emitted');

  // Resolved clean protocol -> can_approve = true
  const resolvedCalciumSupp = {
    ...calciumSupp,
    administration_time: '20:00' // Moved to dinner (13.5 hours after Thyrox)
  };
  const { conflicts: resolvedConflicts } = buildChronotherapyTimeline(
    lifestyleProto,
    exProtoNormal,
    sleepProto,
    hydProtoNormal,
    [resolvedCalciumSupp],
    [levoMedication]
  );
  const safetyResolved = evaluateR4ProtocolSafety(
    lifestyleProto,
    exProtoNormal,
    sleepProto,
    hydProtoNormal,
    [resolvedCalciumSupp],
    resolvedConflicts,
    basePatient
  );
  assert(safetyResolved.hard_stops.length === 0, 'Zero hard stops when spacing conflict is resolved');
  assert(safetyResolved.can_approve === true, 'can_approve is TRUE for clean protocol');

  // ===================================================================
  // 8. Master Protocol Studio Engine & Persistence
  // ===================================================================
  console.log('\n--- 8. Master Protocol Studio Orchestration & Local Demo Repository ---');
  const autoDraft = generateAutomaticProtocolDraft(basePatient);
  assert(autoDraft.id.startsWith('proto-r4-'), 'Generated protocol has valid ID');
  assert(autoDraft.version === 1, 'Initial protocol starts at version 1');
  assert(autoDraft.status === 'draft', 'Initial protocol starts in draft status');
  assert(autoDraft.is_approved === false, 'Initial protocol is not approved');

  // Manual Template instantiation
  const manualTemplate = createManualProtocolTemplate(basePatient);
  assert(manualTemplate.mode === 'manual_created', 'Manual template starts in manual_created mode');
  assert(manualTemplate.lifestyle.recommendations.length === 0, 'Manual template starts with clean recommendation list');

  // Repository Persistence and Approval Testing
  const repo = new LocalDemoRepository();
  const testClinician: ClinicianAuthProfile = {
    id: 'c_lead_dir',
    auth_user_id: 'u_dir_01',
    organization_id: 'org_shuddho',
    name: 'Dr. Probal, MD, PhD, CNS',
    email: 'director@shuddho.clinic',
    role: 'CLINICAL_DIRECTOR',
    license_number: 'BMDC-A-98765',
    is_active: true
  };

  // Test 8.1: Attempting to approve protocol with HARD_STOP must throw error
  const unapprovableProtocol = {
    ...autoDraft,
    safety_evaluation: {
      ...autoDraft.safety_evaluation,
      can_approve: false,
      hard_stops: [{
        code: 'TEST_STOP',
        severity: 'critical' as const,
        title_en: 'Test Stop',
        title_bn: 'টেস্ট স্টপ',
        rationale_en: 'Test rationale',
        rationale_bn: 'টেস্ট কারণ',
        recommended_action_en: 'Resolve issue',
        recommended_action_bn: 'সমাধান করুন'
      }]
    }
  };

  let threwOnHardStop = false;
  try {
    await repo.approveLifestylePlan(unapprovableProtocol, testClinician);
  } catch (err: any) {
    threwOnHardStop = true;
    assert(err.message.includes('Hard Stops'), 'approveLifestylePlan blocks approval when protocol contains Hard Stops');
  }
  assert(threwOnHardStop, 'Hard stop approval gate verified (fail-closed security)');

  // Test 8.2: Save protocol
  const savedProto = await repo.saveLifestylePlan(autoDraft);
  assert(savedProto.id === autoDraft.id, 'saveLifestylePlan returns saved protocol');

  const reloaded = await repo.getLifestylePlan(basePatient.id);
  assert(reloaded !== null && reloaded.id === autoDraft.id, 'getLifestylePlan retrieves stored protocol from repository');

  // Test 8.3: Approve clean protocol
  const approvableProtocol = {
    ...autoDraft,
    safety_evaluation: {
      ...autoDraft.safety_evaluation,
      can_approve: true,
      hard_stops: []
    }
  };

  const approvedProto = await repo.approveLifestylePlan(
    approvableProtocol,
    testClinician,
    'Comprehensive lifestyle and circadian synchronization protocol approved for Phase 1.'
  );

  assert(approvedProto.is_approved === true, 'approvedProto has is_approved: true');
  assert(approvedProto.status === 'active', 'approvedProto status set to active');
  assert(approvedProto.version === 2, 'approvedProto version incremented to 2');
  assert(approvedProto.approved_by === testClinician.id, 'approvedProto stamped with clinician ID');
  assert(Boolean(approvedProto.approved_at), 'approvedProto stamped with ISO timestamp');
  assert(approvedProto.approval_notes?.includes('Phase 1'), 'Approval notes preserved');

  // Test 8.4: Verify audit log entries
  const auditEvents = await repo.getAuditEvents(basePatient.id);
  const planApprovedEvent = auditEvents.find(e => e.event_type === 'PLAN_APPROVED');
  assert(Boolean(planApprovedEvent), 'Authoritative PLAN_APPROVED audit event logged in repository audit trail');

  // ===================================================================
  // Summary
  // ===================================================================
  console.log('\n================================================================');
  console.log(`TOTAL ASSERTIONS: ${totalAssertions}`);
  console.log(`PASSED: ${passedAssertions}`);
  console.log(`FAILED: ${failedAssertions}`);
  console.log('================================================================\n');

  if (failedAssertions > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
})();
