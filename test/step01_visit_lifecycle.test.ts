/**
 * Step 01 Test: Visit Lifecycle & Atomic Transitions
 */

import { createNewVisitTransition, completeVisitTransition } from '../src/engine/visit/visitLifecycle';
import { PatientProfile, ClinicalVisit } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

console.log('=====================================================================');
console.log('TASK 4: VISIT LIFECYCLE & ATOMIC TRANSITIONS TESTS');
console.log('=====================================================================\n');

const patient: PatientProfile = {
  schema_version: 2,
  id: 'pt_01',
  name: 'Test Patient',
  age: 40,
  gender: 'female',
  phone: '01700000000',
  visit_date: '2026-01-01',
  current_visit_id: 'vis_01',
  current_phase: 1,
  height_cm: 160,
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
  labs: { lab_flags: [] },
  calculated: {} as any
};

const initialVisits: ClinicalVisit[] = [
  {
    id: 'vis_01',
    visit_id: 'vis_01',
    patient_id: 'pt_01',
    visit_number: 1,
    visit_type: 'baseline_consultation',
    visit_date: '2026-01-01',
    created_at: '2026-01-01T00:00:00Z',
    status: 'completed',
    is_baseline: true
  }
];

// 1. Atomic Visit Creation
console.log('1. Atomic Visit Creation');
const transition = createNewVisitTransition({
  patient,
  existingVisits: initialVisits,
  visitType: 'routine_followup',
  notes: 'First follow-up'
});

assert(transition.newVisit.visit_id.startsWith('vis_pt_01_'), 'New visit ID starts with patient prefix');
assert(transition.newVisit.visit_id !== 'vis_01', 'New visit ID is distinct from initial visit');
assert(transition.newVisit.visit_number === 2, 'Visit number is incremented to 2');
assert(transition.updatedPatient.current_visit_id === transition.newVisit.visit_id, 'Updated patient references new visit ID');
assert(transition.updatedVisits.length === 2, 'Updated visits array contains both visits');
assert(transition.updatedVisits[0].visit_id === transition.newVisit.visit_id, 'New visit is prepended at head');

// 2. Visit Completion Transition
console.log('\n2. Visit Completion Transition');
const completion = completeVisitTransition(transition.updatedVisits, transition.newVisit.visit_id, 'Consultation completed successfully');
const completed = completion.find(v => v.visit_id === transition.newVisit.visit_id)!;
assert(completed.status === 'completed', 'Visit status marked completed');
assert(completed.completed_at !== undefined, 'Completion timestamp recorded');

console.log('\nALL VISIT LIFECYCLE TESTS PASSED!');
