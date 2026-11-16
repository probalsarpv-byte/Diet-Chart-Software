/**
 * Step 01 Test: ID Generation & Referential Integrity
 */

import { generateEntityId } from '../src/utils/idGenerator';
import { validateReferentialIntegrity } from '../src/utils/referentialIntegrity';
import { PatientRecord, ClinicalVisit, ClinicalVisitSnapshot } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

console.log('=====================================================================');
console.log('TASK 1: ID GENERATION & REFERENTIAL INTEGRITY TESTS');
console.log('=====================================================================\n');

// 1. Collision Resistance Test
console.log('1. Collision Resistance (10,000 rapid calls)');
const ids = new Set<string>();
const count = 10000;
for (let i = 0; i < count; i++) {
  const id = generateEntityId('vis');
  ids.add(id);
}
assert(ids.size === count, `All ${count} IDs generated in tight loop are strictly unique (0 collisions)`);

// 2. Prefix format
const patientId = generateEntityId('pt');
const visitId = generateEntityId('vis');
const snapId = generateEntityId('snap');
assert(patientId.startsWith('pt_'), 'Patient ID starts with pt_');
assert(visitId.startsWith('vis_'), 'Visit ID starts with vis_');
assert(snapId.startsWith('snap_'), 'Snapshot ID starts with snap_');

// 3. Referential Integrity Validation
console.log('\n2. Referential Integrity Validation');

const sampleVisit: ClinicalVisit = {
  id: 'vis_valid_01',
  visit_id: 'vis_valid_01',
  patient_id: 'pt_01',
  visit_number: 1,
  visit_type: 'baseline_consultation',
  visit_date: '2026-03-25',
  created_at: '2026-03-25T10:00:00Z',
  status: 'in_progress',
  is_baseline: true
};

const sampleSnap: ClinicalVisitSnapshot = {
  snapshot_id: 'snap_valid_01',
  patient_id: 'pt_01',
  visit_id: 'vis_valid_01',
  visit_date: '2026-03-25',
  is_baseline: true,
  anthropometrics: { weight_kg: 70, height_cm: 165 }
};

const validRecord: PatientRecord = {
  schema_version: 2,
  patient: {
    id: 'pt_01',
    schema_version: 2,
    name: 'Test Patient',
    age: 30,
    gender: 'female',
    phone: '01700000000',
    visit_date: '2026-03-25',
    current_phase: 1,
    height_cm: 165,
    weight_kg: 70,
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
      energy_score: 5,
      sleep_quality_score: 5,
      digestive_fire_agni: 'unassessed'
    },
    labs: {},
    calculated: {
      bmi: 25.7,
      bmi_category_en: 'Overweight',
      bmi_category_bn: 'অতিরিক্ত ওজন',
      whtr: 0.48,
      whtr_risk_en: 'Low',
      whtr_risk_bn: 'স্বাভাবিক',
      ibw_kg: 58,
      adjusted_bw_kg: 61,
      bmr: 1400,
      tdee: 1680,
      bmr_safe_calorie_floor: 1400,
      target_calories: 1400,
      target_protein_g: 70,
      target_carbs_g: 175,
      target_fat_g: 45,
      protein_ratio_used: '1.0 g/kg',
      population_group: 'adult_standard',
      bmr_floor_strategy: 'clamped_to_bmr',
      is_estimated: true,
      energy_calculation_method: 'Mifflin-St Jeor'
    }
  },
  visits: [],
  clinical_visits: [sampleVisit],
  follow_up_appointments: [],
  visit_snapshots: [sampleSnap],
  progress_reports: [],
  current_diet_chart: [],
  current_supplements: [],
  timeline: [],
  updated_at: '2026-03-25T10:00:00Z'
};

const validResult = validateReferentialIntegrity(validRecord);
assert(validResult.isValid === true, 'Valid patient record passes referential integrity check');
assert(validResult.errors.length === 0, 'No errors for valid record');

// Cross-patient contamination detection
const corruptRecord: PatientRecord = {
  ...validRecord,
  visit_snapshots: [
    {
      ...sampleSnap,
      patient_id: 'pt_DIFFERENT' // Wrong patient ID!
    }
  ]
};

const corruptResult = validateReferentialIntegrity(corruptRecord);
assert(corruptResult.isValid === false, 'Detects cross-patient snapshot contamination');
assert(corruptResult.errors.some(e => e.includes('CROSS_PATIENT_SNAPSHOT')), 'Flags CROSS_PATIENT_SNAPSHOT error code');

console.log('\nALL TASK 1 TESTS PASSED!');
