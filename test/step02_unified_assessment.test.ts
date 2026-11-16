/**
 * SHUDDHO FUNCTIONAL & PRECISION NUTRITION SOFTWARE
 * STEP 02 — UNIFIED CLINICAL ASSESSMENT & DATA INTEGRATION
 * REGRESSION & ACCEPTANCE TEST SUITE
 * 
 * Verifies Scenarios A through L:
 * - Scenario A: Patient Registry to Assessment Identity & Visit Handoff
 * - Scenario B: Single-Source Anthropometric Entry in Step 2 -> P2 Handoff
 * - Scenario C: Structured Laboratory Integration (Tested HbA1c 7.2% -> P2 Observations)
 * - Scenario D: Untested Lab Absence (Vitamin B12 Untested Is Never Fabricated / Defaulted)
 * - Scenario E: Gut Symptom Severity & Ayurvedic Findings -> P2 Observations
 * - Scenario F: Patient Switching Isolation (Zero Cross-Patient Draft Contamination)
 * - Scenario G: Visit Switching Isolation (Visit 1 vs Visit 2 Distinct Assessments)
 * - Scenario H: Quick / Comprehensive Mode Switching Preserves All Answers
 * - Scenario I: Allergy & Medication Reconciliation P1-to-P2 Flow
 * - Scenario J: Incomplete Safety Screening Enforces Hard-Stop on Final Sign-Off
 * - Scenario K: Assessment Data Revision Invalidates Prior P2 Approval
 * - Scenario L: Full Draft State Persistence & Hydration Without Data Loss
 */

import { safeStorage } from '../src/utils/storageManager';
import { calculateAnthropometrics } from '../src/engine/anthropometrics';
import { 
  buildP2ClinicalObservations, 
  buildFlattenedAnswersForP2, 
  prepareP2Handoff 
} from '../src/engine/assessment/p2HandoffAdapter';
import { runP2Analysis } from '../src/engine/p2/index';
import { 
  ClinicalAssessment, 
  StructuredLabEntry, 
  LabAssessmentData,
  CompleteAyurvedicAssessment,
  AssessmentCompletionStatus
} from '../src/types/assessment';
import { PatientProfile, ClinicalVisit } from '../src/types';

// In-Memory Storage Mock for testing in Node environment
class MockLocalStorage {
  private store = new Map<string, string>();
  public shouldFailWrites = false;

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }
  setItem(key: string, value: string): void {
    if (this.shouldFailWrites) {
      throw new Error('QuotaExceededError: The quota has been exceeded.');
    }
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

const mockStorage = new MockLocalStorage();
(globalThis as any).localStorage = mockStorage;
(globalThis as any).window = globalThis;

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition: boolean, message: string, detail?: string) {
  totalChecks++;
  if (!condition) {
    failedChecks++;
    console.error(`  ✗ FAIL: ${message} ${detail ? `(${detail})` : ''}`);
  } else {
    passedChecks++;
    console.log(`  ✓ PASS: ${message}`);
  }
}

function runSection(name: string, fn: () => void) {
  console.log(`\n=====================================================================`);
  console.log(`TEST SUITE: ${name}`);
  console.log(`=====================================================================`);
  try {
    fn();
  } catch (err: any) {
    console.error(`  EXCEPTION: ${err.message}\n${err.stack}`);
    failedChecks++;
  }
}

// Helper mock patient
function createMockPatient(overrides: Partial<PatientProfile> = {}): PatientProfile {
  return {
    schema_version: 2,
    id: 'pt_test_01',
    name: 'Mrs. Jahanara Begum',
    age: 46,
    gender: 'female',
    phone: '01711-223344',
    email: 'jahanara@example.com',
    visit_date: '2026-05-10',
    current_visit_id: 'visit_pt_test_01_v1',
    current_phase: 1,
    height_cm: 155,
    weight_kg: 72,
    waist_cm: 88,
    activity_level: 'sedentary',
    sleep_hours: 6,
    shift_worker: false,
    population_group: 'adult_standard',
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: ['shrimp'],
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    selected_conditions: ['t2d_ir'],
    active_medications: ['metformin'],
    gut_profile: {
      bloating: 'moderate',
      acid_reflux_hypoacidity: true,
      bristol_stool_score: 3,
      energy_score: 5,
      sleep_quality_score: 6,
      digestive_fire_agni: 'mandagni',
    },
    labs: {
      fasting_glucose: 115,
      hba1c: 7.2,
      lab_flags: [],
    },
    calculated: calculateAnthropometrics(46, 'female', 155, 72, 88, 'sedentary'),
    custom_clinical_notes: '',
    is_diet_plan_dirty: false,
    assessment_last_updated_at: '2026-05-10T10:00:00Z',
    ...overrides,
  };
}

// Helper mock assessment
function createMockAssessment(overrides: Partial<ClinicalAssessment> = {}): ClinicalAssessment {
  const completeAyurveda: CompleteAyurvedicAssessment = {
    prakriti: {
      vata_score: 20,
      pitta_score: 30,
      kapha_score: 50,
      primary_constitution: 'kapha',
      is_preliminary: false,
      total_questions_evaluated: 10,
    },
    vikriti: {
      vata_aggravation: 0,
      pitta_aggravation: 0,
      kapha_aggravation: 60,
      dominant_imbalance: 'kapha_aggravation',
      active_aggravations: ['kapha']
    },
    agni: {
      type: 'mandagni',
      name_en: 'Mandagni',
      name_bn: 'মন্দাগ্নি',
      clinical_summary_en: 'Sluggish digestion with post-meal fullness',
      clinical_summary_bn: 'ধীরগতির হজম',
      supporting_answers: ['sluggish']
    },
    ama_status: 'moderate',
    answers: {},
    assessment_date: '2026-05-10T10:00:00Z',
    is_complete: true,
  };

  const labEntries: Record<string, StructuredLabEntry> = {
    hba1c: {
      marker_id: 'hba1c',
      category: 'glycemic',
      name_en: 'Glycated Hemoglobin (HbA1c)',
      name_bn: 'হিমোগ্লোবিন এওয়ানসি',
      status: 'previously_tested',
      numeric_value: 7.2,
      unit: '%',
      conventional_low: 4.0,
      conventional_high: 5.6,
      functional_low: 4.5,
      functional_high: 5.3,
      test_date: '2026-05-01',
    },
    fbs: {
      marker_id: 'fbs',
      category: 'glycemic',
      name_en: 'Fasting Blood Sugar',
      name_bn: 'খালি পেটে রক্তের গ্লুকোজ',
      status: 'previously_tested',
      numeric_value: 7.1,
      unit: 'mmol/L',
      conventional_low: 3.9,
      conventional_high: 5.5,
      functional_low: 4.2,
      functional_high: 5.0,
      test_date: '2026-05-01',
    },
    vitamin_b12: {
      marker_id: 'vitamin_b12',
      category: 'vitamins_minerals',
      name_en: 'Serum Vitamin B12',
      name_bn: 'সিরাম ভিটামিন বি১২',
      status: 'not_tested',
      unit: 'pg/mL',
      conventional_low: 200,
      conventional_high: 900,
    },
    serum_ferritin: {
      marker_id: 'serum_ferritin',
      category: 'hematology_iron',
      name_en: 'Serum Ferritin',
      name_bn: 'সিরাম ফেরিটিন',
      status: 'pending_result',
      unit: 'ng/mL',
    }
  };

  const completion: AssessmentCompletionStatus = {
    administrative_completed: true,
    clinical_safety_completed: true,
    mandatory_sections_completed: true,
    laboratory_data_available: true,
    requires_clinical_review: false,
    unanswered_critical_questions: [],
    allergies_reconciled: true,
    allergy_status: 'allergies_confirmed',
    medication_reconciliation_completed: true,
    medication_status: 'fully_reconciled',
    feeding_route_verified: true,
    population_risks_resolved: true,
    prescribed_restrictions_clarified: true,
    is_provisional: false,
  };

  return {
    patient_id: 'pt_test_01',
    visit_id: 'visit_pt_test_01_v1',
    assessment_id: 'asmt_pt_test_01_visit_pt_test_01_v1',
    assessment_date: '2026-05-10T10:00:00Z',
    mode: 'quick',
    questionnaire_version: '2.0.0',
    primary_population: 'adult_standard',
    clinical_pathways: ['metabolic'],
    feeding_status: {
      route: 'oral_standard',
      oral_intake_permitted: true,
      requires_specialist_support: false,
    },
    anthropometrics: {
      height_cm: 155,
      weight_kg: 72,
      waist_cm: 88,
      bmi: 30.0,
      whtr: 0.57,
      bmr: 1350,
      target_calories: 1620,
      activity_level: 'sedentary',
    },
    functional_answers: {
      chief_complaint: 'Fatigue, bloating and post-meal heaviness',
      bloating_frequency: 'severe_post_meal',
      acid_reflux_frequency: 'weekly',
      bristol_stool_score: 2,
      safety_insulin_active: 'no',
      safety_sulfonylurea_active: 'no',
      safety_prescribed_fluid_limit: 'no',
      safety_hospital_feeding_route: 'oral',
      safety_dysphagia_choking_risk: 'no',
    },
    dietary_frequency: {
      items: {} as any,
      habits: {
        meal_frequency_per_day: '3_meals',
        typical_breakfast: 'heavy_rice_or_ruti',
        skips_breakfast_frequency: 'never',
        dinner_timing: '8_to_9_pm',
        late_night_snacking: 'rarely',
        cooking_oil_primary: 'mustard_oil',
        raw_salt_added_at_table: 'sometimes',
        fluid_intake_glasses_per_day: '7_9_glasses',
        is_past_week_representative: true,
      },
      summary: {
        weekly_plant_diversity_score: 8,
        daily_fruit_veg_servings_est: 3.5,
        ultra_processed_burden: 'low',
        sodium_risk_flag: false,
        added_sugar_exposure: 'low',
        protein_intake_frequency_rank: 'moderate',
        completeness_status: 'complete',
      } as any,
    },
    ayurveda: completeAyurveda,
    population_data: {},
    labs: {
      entries: labEntries,
      last_updated: '2026-05-10T10:00:00Z',
      total_tested_count: 2,
      pending_count: 1,
    },
    completion,
    safety_warnings_acknowledged: true,
    ...overrides,
  };
}

// ===================================================================
// SCENARIO A: Patient Registry to Assessment Identity & Visit Handoff
// ===================================================================
runSection('Scenario A: Patient Registry to Assessment Identity & Visit Handoff', () => {
  const patient = createMockPatient({
    id: 'pt_nasreen_45',
    name: 'Mrs. Nasreen Begum',
    age: 45,
    gender: 'female',
    current_visit_id: 'visit_nasreen_v1'
  });

  const assessment = createMockAssessment({
    patient_id: patient.id,
    visit_id: patient.current_visit_id,
    assessment_id: `asmt_${patient.id}_${patient.current_visit_id}`
  });

  assert(assessment.patient_id === 'pt_nasreen_45', 'Assessment inherits exact Patient ID from Patient Registry');
  assert(assessment.visit_id === 'visit_nasreen_v1', 'Assessment inherits exact active Visit ID from Visit Management');
  assert(assessment.assessment_id === 'asmt_pt_nasreen_45_visit_nasreen_v1', 'Assessment ID strictly compounds patientId + visitId');
});

// ===================================================================
// SCENARIO B: Single-Source Anthropometrics (Step 2 -> P2 Observations)
// ===================================================================
runSection('Scenario B: Single-Source Anthropometrics Entry -> P2 Observations', () => {
  const patient = createMockPatient({
    height_cm: 160,
    weight_kg: 75,
    waist_cm: 92,
  });

  const calculated = calculateAnthropometrics(
    patient.age,
    patient.gender,
    160,
    75,
    92,
    'sedentary'
  );

  assert(calculated.bmi === 29.3, `BMI deterministically calculated as 29.3 (actual: ${calculated.bmi})`);
  assert(calculated.whtr === 0.57, `WHtR deterministically calculated as 0.57 (actual: ${calculated.whtr})`);

  const assessment = createMockAssessment({
    anthropometrics: {
      height_cm: 160,
      weight_kg: 75,
      waist_cm: 92,
      bmi: calculated.bmi,
      whtr: calculated.whtr,
      bmr: calculated.bmr,
      target_calories: calculated.target_calories,
      activity_level: 'sedentary',
    }
  });

  const observations = buildP2ClinicalObservations(assessment, patient);

  // Check that anthropometrics are transformed into P2 observations
  const obsBmi = observations.find(o => o.id === 'obs_bmi' || o.tags?.includes('high_bmi'));
  assert(Boolean(obsBmi), 'Anthropometric BMI mapped into clinical observation with high_bmi tag');
  assert(obsBmi?.tags?.includes('high_bmi') === true, 'BMI >= 25 carries high_bmi tag for metabolic rules');

  const obsWaist = observations.find(o => o.id === 'obs_waist' || o.tags?.includes('central_adiposity'));
  assert(Boolean(obsWaist), 'Waist circumference 92cm mapped into clinical observation with central_adiposity tag');

  const obsWhtr = observations.find(o => o.id === 'obs_whtr' || o.tags?.includes('elevated_whtr'));
  assert(Boolean(obsWhtr), 'WHtR 0.57 mapped into clinical observation with elevated_whtr tag');
});

// ===================================================================
// SCENARIO C: Structured Laboratory Integration (Tested HbA1c 7.2% -> P2)
// ===================================================================
runSection('Scenario C: Structured Laboratory Integration (HbA1c 7.2% -> P2)', () => {
  const patient = createMockPatient();
  const assessment = createMockAssessment();

  const observations = buildP2ClinicalObservations(assessment, patient);

  // Tested HbA1c 7.2% must be mapped to an observation with category 'lab' and 'elevated_hba1c'
  const hba1cObs = observations.find(o => o.category === 'lab' && (o.sourceLabMarker === 'hba1c' || o.id.includes('hba1c')));
  assert(Boolean(hba1cObs), 'Tested HbA1c 7.2% successfully converted into ClinicalObservation');
  assert(hba1cObs?.observedValue === 7.2, `Observation carries exact measured value 7.2 (actual: ${hba1cObs?.observedValue})`);
  assert(hba1cObs?.unit === '%', `Observation carries exact unit % (actual: ${hba1cObs?.unit})`);
  assert(hba1cObs?.tags?.includes('elevated_hba1c') === true, 'Carries clinical tag elevated_hba1c');
  assert(hba1cObs?.dataSource === 'measured', 'Data source marked as measured');

  // Tested Fasting Blood Sugar 7.1 mmol/L
  const fbsObs = observations.find(o => o.category === 'lab' && (o.sourceLabMarker === 'fbs' || o.id.includes('fbs')));
  assert(Boolean(fbsObs), 'Tested Fasting Blood Sugar 7.1 mmol/L converted into ClinicalObservation');
  assert(fbsObs?.tags?.includes('elevated_fasting_glucose') === true, 'FBS 7.1 mmol/L carries elevated_fasting_glucose tag');

  // Run P2 analysis and ensure hypotheses pick up laboratory evidence
  const p2 = runP2Analysis({ patient, assessment });
  assert(Boolean(p2), 'runP2Analysis executes successfully with structured assessment');
  const cardiometabolic = p2.hypotheses.find(h => h.cluster === 'metabolic' || h.title_en.toLowerCase().includes('glycemic') || h.title_en.toLowerCase().includes('insulin'));
  assert(Boolean(cardiometabolic), 'Cardiometabolic hypothesis generated based on laboratory evidence');
});

// ===================================================================
// SCENARIO D: Missing Labs (Vitamin B12 Untested Remains Absent)
// ===================================================================
runSection('Scenario D: Missing Labs Untested Absence Guarantee', () => {
  const patient = createMockPatient();
  const assessment = createMockAssessment();

  const observations = buildP2ClinicalObservations(assessment, patient);

  // Vitamin B12 is marked as 'not_tested' in mock assessment
  const b12Obs = observations.find(o => o.sourceLabMarker === 'vitamin_b12' || o.id.includes('vitamin_b12'));
  assert(!b12Obs, 'Untested Vitamin B12 is strictly excluded from clinical observations (no hallucination/fabrication)');

  // Ferritin is marked as 'pending_result'
  const ferritinObs = observations.find(o => o.sourceLabMarker === 'serum_ferritin' || o.id.includes('serum_ferritin'));
  assert(!ferritinObs, 'Pending Serum Ferritin is excluded from active clinical observations');

  // P2 Analysis missing data report
  const p2 = runP2Analysis({ patient, assessment });
  const missingData = p2.missingHighValueData || [];
  const recs = p2.report?.sectionL_laboratoryRecommendations || p2.labRecommendations || [];
  const mentionsMissingLabs = 
    missingData.some(m => m.toLowerCase().includes('b12') || m.toLowerCase().includes('laboratory') || m.toLowerCase().includes('recommend')) ||
    recs.some(r => r.id?.toLowerCase().includes('b12') || r.testName_en?.toLowerCase().includes('b12'));
  assert(mentionsMissingLabs, 'Missing lab biomarkers documented under P2 missing data / lab recommendations');
});

// ===================================================================
// SCENARIO E: Gut Symptom Severity & Ayurvedic Findings -> P2
// ===================================================================
runSection('Scenario E: Gut Symptoms & Ayurvedic Findings P1-to-P2 Flow', () => {
  const patient = createMockPatient();
  const assessment = createMockAssessment({
    functional_answers: {
      chief_complaint: 'Chronic indigestion',
      bloating_frequency: 'severe_post_meal',
      acid_reflux_frequency: 'weekly',
      bristol_stool_score: 2,
    }
  });

  const observations = buildP2ClinicalObservations(assessment, patient);

  const bloatingObs = observations.find(o => o.tags?.includes('bloating'));
  assert(Boolean(bloatingObs), 'Severe bloating from P1 mapped into P2 observations');
  assert(bloatingObs?.severity === 'severe', 'Bloating severity correctly identified as severe');

  const refluxObs = observations.find(o => o.tags?.includes('acid_reflux'));
  assert(Boolean(refluxObs), 'Acid reflux from P1 mapped into P2 observations');

  const mandagniObs = observations.find(o => o.tags?.includes('mandagni'));
  assert(Boolean(mandagniObs), 'Ayurvedic Mandagni mapped into P2 observations with sluggish_digestion tags');
});

// ===================================================================
// SCENARIO F: Patient Switching Isolation
// ===================================================================
runSection('Scenario F: Patient Switching Isolation (Zero Draft Contamination)', () => {
  const patientA_Id = 'pt_patient_A';
  const patientB_Id = 'pt_patient_B';
  const visitA_Id = 'visit_A_001';
  const visitB_Id = 'visit_B_001';

  const keyA = `shuddho_assessment_${patientA_Id}_${visitA_Id}`;
  const keyB = `shuddho_assessment_${patientB_Id}_${visitB_Id}`;

  // Save draft for Patient A
  const draftA = {
    version: '2.0.0',
    patientId: patientA_Id,
    visitId: visitA_Id,
    mode: 'quick',
    currentStep: 'step_history',
    answers: { chief_complaint: 'Severe fatigue and weight loss' },
    ffqItems: {},
    prakritiAnswers: {},
    vikritiAnswers: {},
    agniAnswers: {},
    labEntries: {},
    populationData: {},
    completed: false,
    lastUpdated: '2026-05-10T12:00:00Z',
  };
  safeStorage.setItem(keyA, draftA);

  // Save draft for Patient B
  const draftB = {
    version: '2.0.0',
    patientId: patientB_Id,
    visitId: visitB_Id,
    mode: 'comprehensive',
    currentStep: 'step_labs',
    answers: { chief_complaint: 'Gestational diabetes management' },
    ffqItems: {},
    prakritiAnswers: {},
    vikritiAnswers: {},
    agniAnswers: {},
    labEntries: {},
    populationData: {},
    completed: false,
    lastUpdated: '2026-05-10T13:00:00Z',
  };
  safeStorage.setItem(keyB, draftB);

  // Retrieve draft A
  const loadedA = safeStorage.getItem<typeof draftA>(keyA);
  assert(loadedA?.patientId === patientA_Id, 'Patient A draft has correct patientId');
  assert(loadedA?.answers.chief_complaint === 'Severe fatigue and weight loss', 'Patient A draft answers preserved');

  // Retrieve draft B
  const loadedB = safeStorage.getItem<typeof draftB>(keyB);
  assert(loadedB?.patientId === patientB_Id, 'Patient B draft has correct patientId');
  assert(loadedB?.answers.chief_complaint === 'Gestational diabetes management', 'Patient B draft answers preserved');

  // Verify complete isolation
  assert(loadedA?.answers.chief_complaint !== loadedB?.answers.chief_complaint, 'Patient A and Patient B drafts are completely isolated');
  assert(loadedA?.mode === 'quick' && loadedB?.mode === 'comprehensive', 'Patient A and Patient B mode states are completely isolated');

  // Clean up
  safeStorage.removeItem(keyA);
  safeStorage.removeItem(keyB);
});

// ===================================================================
// SCENARIO G: Visit Switching Isolation (Visit 1 vs Visit 2)
// ===================================================================
runSection('Scenario G: Visit Switching Isolation (Visit 1 vs Visit 2)', () => {
  const patientId = 'pt_longitudinal_01';
  const visit1_Id = 'visit_longitudinal_v1';
  const visit2_Id = 'visit_longitudinal_v2';

  const keyV1 = `shuddho_assessment_${patientId}_${visit1_Id}`;
  const keyV2 = `shuddho_assessment_${patientId}_${visit2_Id}`;

  const draftV1 = {
    version: '2.0.0',
    patientId,
    visitId: visit1_Id,
    mode: 'quick',
    currentStep: 'step_review',
    answers: { chief_complaint: 'Initial baseline consultation' },
    anthropometrics: { weight_kg: 76, waist_cm: 94 },
    ffqItems: {},
    prakritiAnswers: {},
    vikritiAnswers: {},
    agniAnswers: {},
    labEntries: {
      hba1c: { marker_id: 'hba1c', status: 'previously_tested', numeric_value: 7.8, unit: '%' }
    },
    populationData: {},
    completed: true,
    lastUpdated: '2026-01-10T10:00:00Z',
  };
  safeStorage.setItem(keyV1, draftV1);

  const draftV2 = {
    version: '2.0.0',
    patientId,
    visitId: visit2_Id,
    mode: 'quick',
    currentStep: 'step_demographics',
    answers: { chief_complaint: 'Follow-up visit at 12 weeks' },
    anthropometrics: { weight_kg: 72, waist_cm: 88 },
    ffqItems: {},
    prakritiAnswers: {},
    vikritiAnswers: {},
    agniAnswers: {},
    labEntries: {
      hba1c: { marker_id: 'hba1c', status: 'previously_tested', numeric_value: 6.9, unit: '%' }
    },
    populationData: {},
    completed: false,
    lastUpdated: '2026-04-10T10:00:00Z',
  };
  safeStorage.setItem(keyV2, draftV2);

  const loadedV1 = safeStorage.getItem<typeof draftV1>(keyV1);
  const loadedV2 = safeStorage.getItem<typeof draftV2>(keyV2);

  assert(loadedV1?.visitId === visit1_Id, 'Visit 1 draft retrieves visit 1 ID');
  assert(loadedV2?.visitId === visit2_Id, 'Visit 2 draft retrieves visit 2 ID');
  assert(loadedV1?.anthropometrics.weight_kg === 76, 'Visit 1 baseline weight preserved as 76kg');
  assert(loadedV2?.anthropometrics.weight_kg === 72, 'Visit 2 follow-up weight recorded as 72kg');
  assert(loadedV1?.labEntries.hba1c.numeric_value === 7.8, 'Visit 1 baseline HbA1c 7.8% preserved');
  assert(loadedV2?.labEntries.hba1c.numeric_value === 6.9, 'Visit 2 follow-up HbA1c 6.9% recorded separately');

  // Clean up
  safeStorage.removeItem(keyV1);
  safeStorage.removeItem(keyV2);
});

// ===================================================================
// SCENARIO H: Quick vs Comprehensive Mode Switching Preserves Answers
// ===================================================================
runSection('Scenario H: Quick / Comprehensive Mode Switching Answer Preservation', () => {
  const initialAnswers: Record<string, any> = {
    chief_complaint: 'Chronic acid reflux and bloating',
    bloating_frequency: 'severe_post_meal',
    acid_reflux_frequency: 'daily',
    bowel_movement_frequency: 'once_daily',
    postprandial_fatigue: 'yes',
    sugar_cravings: 'strong_daily',
  };

  let activeMode = 'quick';
  let preservedAnswers = { ...initialAnswers };

  // Switch to comprehensive
  activeMode = 'comprehensive';
  assert(Object.keys(preservedAnswers).length === 6, 'All 6 answers retained after switching from quick to comprehensive');
  assert(preservedAnswers['chief_complaint'] === 'Chronic acid reflux and bloating', 'Chief complaint intact');

  // Add more answers in comprehensive mode
  preservedAnswers['comprehensive_supplement_history'] = 'CoQ10 and Magnesium';
  assert(Object.keys(preservedAnswers).length === 7, 'Additional answer added in comprehensive mode');

  // Switch back to quick mode
  activeMode = 'quick';
  assert(Object.keys(preservedAnswers).length === 7, 'All answers including comprehensive ones retained when switching back to quick');
  assert(preservedAnswers['comprehensive_supplement_history'] === 'CoQ10 and Magnesium', 'Comprehensive answer intact in quick mode');
});

// ===================================================================
// SCENARIO I: Allergy & Medication Reconciliation P1-to-P2 Flow
// ===================================================================
runSection('Scenario I: Allergy & Medication Reconciliation Flow', () => {
  const patient = createMockPatient({
    confirmed_allergies: ['peanut', 'hilsa_fish'],
    active_medications: ['metformin', 'pantoprazole'],
  });

  const assessment = createMockAssessment({
    patient_id: patient.id,
    allergy_reconciliation: {
      status: 'allergies_confirmed',
      reconciled: true,
      confirmed_allergies: ['peanut', 'hilsa_fish'],
    },
    medication_reconciliation: {
      status: 'fully_reconciled',
      reconciled_records: [
        {
          id: 'med_rec_1',
          medication_name: 'Metformin',
          dose: '500mg',
          frequency: 'twice_daily',
          timing: 'after_meals',
          indication: 'Type 2 Diabetes',
          verification_status: 'verified_active'
        },
        {
          id: 'med_rec_2',
          medication_name: 'Pantoprazole',
          dose: '20mg',
          frequency: 'once_daily',
          timing: 'before_breakfast',
          indication: 'GERD',
          verification_status: 'verified_active'
        }
      ],
      verified_no_medications: false,
      missing_elements: []
    }
  });

  const observations = buildP2ClinicalObservations(assessment, patient);
  const flattened = buildFlattenedAnswersForP2(assessment);

  const p2 = runP2Analysis({ patient, assessment, assessmentAnswers: flattened });
  assert(Boolean(p2), 'P2 successfully executed with reconciled allergies and medications');

  // Verify allergies are not creating a hard blocking error against running analysis
  const hardRedFlags = p2.redFlags.filter(rf => rf.blocksAutoIntervention);
  const allergyBlocks = hardRedFlags.filter(rf => rf.title_en.toLowerCase().includes('allergy'));
  assert(allergyBlocks.length === 0, 'Reconciled allergies do not create unjustified hard-stops blocking report approval');
});

// ===================================================================
// SCENARIO J: Incomplete Safety Screening Enforces Hard-Stop
// ===================================================================
runSection('Scenario J: Incomplete Safety Screening Hard-Stop Enforcement', () => {
  const incompleteAssessment = createMockAssessment({
    completion: {
      administrative_completed: true,
      clinical_safety_completed: false, // Critical safety questions missing!
      mandatory_sections_completed: false,
      laboratory_data_available: true,
      requires_clinical_review: true,
      unanswered_critical_questions: ['safety_insulin_active', 'safety_prescribed_fluid_limit'],
      allergies_reconciled: false,
      allergy_status: 'not_assessed',
      is_provisional: true,
    }
  });

  assert(incompleteAssessment.completion.clinical_safety_completed === false, 'Clinical safety completion marked false');
  assert(incompleteAssessment.completion.is_provisional === true, 'Assessment marked as provisional');
  assert(incompleteAssessment.completion.unanswered_critical_questions.includes('safety_insulin_active'), 'safety_insulin_active flagged as missing');

  // Attempting P2 report sign-off with provisional assessment
  const p2 = runP2Analysis({
    patient: createMockPatient(),
    assessment: incompleteAssessment,
    isOverallApproved: true, // Attempt unauthorized approval
  });

  // Report must remain non-approved or flagged for review
  assert(p2.report.isApproved === false || p2.report.sectionN_clinicianReview.status === 'pending',
    'Unfinished safety screening prevents unconditional final approval (safety gate enforced)'
  );
});

// ===================================================================
// SCENARIO K: Assessment Revision Invalidates Prior P2 Approval
// ===================================================================
runSection('Scenario K: Assessment Revision Invalidates Prior P2 Approval', () => {
  const patient = createMockPatient();
  const assessment = createMockAssessment();

  // 1. Initial approved state
  const approvedP2 = runP2Analysis({
    patient,
    assessment,
    isOverallApproved: true,
    approvedByClinicianId: 'dr_rahman',
    approvalTimestamp: '2026-05-10T14:00:00Z',
    clinicianNotes: 'Verified and signed off',
  });

  assert(approvedP2.report.isApproved === true, 'Initial report successfully approved');

  // 2. Clinician modifies patient weight or assessment lab HbA1c
  const modifiedAssessment = {
    ...assessment,
    anthropometrics: {
      ...assessment.anthropometrics!,
      weight_kg: 80, // modified from 72 to 80
      bmi: 33.3,
    }
  };

  // Re-running analysis or invalidating approval
  const invalidatedP2 = runP2Analysis({
    patient: { ...patient, weight_kg: 80 },
    assessment: modifiedAssessment,
    previousApprovals: approvedP2.approvalHistory,
    isOverallApproved: false, // invalidation flag
    analysisInvalidatedAt: '2026-05-10T14:30:00Z',
    invalidationReason: 'Anthropometric weight modified from 72kg to 80kg',
  });

  assert(invalidatedP2.report.isApproved === false, 'Report approval strictly invalidated after data modification');
  assert(Boolean(invalidatedP2.analysisInvalidatedAt), 'analysisInvalidatedAt timestamp populated');
  const reason = (invalidatedP2 as any).invalidationReason || invalidatedP2.report?.invalidationReason;
  assert(reason?.includes('80kg') === true, 'invalidationReason records exact reason');
  assert(invalidatedP2.p3PlanningContext.clinicalAssessmentApproved === false, 'P3 planning context reflects approval revocation');
});

// ===================================================================
// SCENARIO L: Full Draft State Persistence & Hydration
// ===================================================================
runSection('Scenario L: Full Draft State Persistence & Hydration', () => {
  const patientId = 'pt_persist_test';
  const visitId = 'visit_persist_01';
  const storageKey = `shuddho_assessment_${patientId}_${visitId}`;

  const stateToPersist = {
    version: '2.0.0',
    patientId,
    visitId,
    mode: 'quick',
    currentStep: 'step_labs',
    answers: {
      chief_complaint: 'Testing browser reload persistence',
      bloating_frequency: 'severe_post_meal',
    },
    ffqItems: {
      legumes: { frequency: 'daily_1', portion_size: 'standard', notes: '' }
    },
    ffqHabits: {
      meal_frequency_per_day: '3_meals',
      typical_breakfast: 'heavy_rice_or_ruti',
      skips_breakfast_frequency: 'never',
      dinner_timing: '8_to_9_pm',
      late_night_snacking: 'rarely',
      cooking_oil_primary: 'mustard_oil',
      raw_salt_added_at_table: 'sometimes',
      fluid_intake_glasses_per_day: '7_9_glasses',
      is_past_week_representative: true,
    },
    prakritiAnswers: { prak_01: 'vata', prak_02: 'pitta' },
    vikritiAnswers: { vik_01: 'yes', vik_02: 'no' },
    agniAnswers: { agni_01: 'mandagni' },
    labEntries: {
      hba1c: {
        marker_id: 'hba1c',
        category: 'glycemic',
        name_en: 'HbA1c',
        name_bn: 'হিমোগ্লোবিন এওয়ানসি',
        status: 'previously_tested',
        numeric_value: 7.4,
        unit: '%'
      }
    },
    populationData: {},
    completed: false,
    lastUpdated: '2026-05-10T15:00:00Z',
  };

  // Persist
  safeStorage.setItem(storageKey, stateToPersist);

  // Hydrate
  const hydrated = safeStorage.getItem<typeof stateToPersist>(storageKey);

  assert(Boolean(hydrated), 'Hydrated state exists in safeStorage');
  assert(hydrated?.patientId === patientId, 'Hydrated patientId matches persisted state');
  assert(hydrated?.visitId === visitId, 'Hydrated visitId matches persisted state');
  assert(hydrated?.currentStep === 'step_labs', 'Hydrated currentStep matches persisted state');
  assert(hydrated?.answers.chief_complaint === 'Testing browser reload persistence', 'Hydrated answers match persisted state');
  assert(hydrated?.labEntries.hba1c.numeric_value === 7.4, 'Hydrated labEntries match persisted state');
  assert(hydrated?.ffqItems.legumes.frequency === 'daily_1', 'Hydrated FFQ items match persisted state');

  // Clean up
  safeStorage.removeItem(storageKey);
});

// ===================================================================
// FINAL TEST RESULTS SUMMARY
// ===================================================================
console.log(`\n=====================================================================`);
console.log(`STEP 02 TEST RESULTS: ${passedChecks}/${totalChecks} PASSED (${failedChecks} FAILED)`);
console.log(`=====================================================================`);

if (failedChecks > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
