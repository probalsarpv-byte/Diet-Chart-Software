/**
 * Step 01 Test: Snapshot Manager & Revision Immutability
 */

import {
  createClinicalSnapshot,
  appendSnapshotWithRevisionPolicy,
  getLatestVisitSnapshot,
  getApprovedBaselineSnapshot
} from '../src/engine/snapshot/snapshotManager';
import { ClinicalVisitSnapshot, PatientProfile } from '../src/types';
import { calculateAnthropometrics } from '../src/engine/anthropometrics';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

console.log('=====================================================================');
console.log('TASK 3: SNAPSHOT MANAGER & REVISION IMMUTABILITY TESTS');
console.log('=====================================================================\n');

const samplePatient: PatientProfile = {
  schema_version: 2,
  id: 'pt_test_01',
  name: 'Test Patient',
  age: 45,
  gender: 'female',
  phone: '01700000000',
  visit_date: '2026-03-25',
  current_phase: 1,
  height_cm: 155,
  weight_kg: 75,
  waist_cm: 90,
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
    energy_score: 6,
    sleep_quality_score: 6,
    digestive_fire_agni: 'samagni'
  },
  labs: {},
  calculated: calculateAnthropometrics(45, 'female', 155, 75, 90, 'sedentary', [])
};

// 1. Initial Snapshot Creation
console.log('1. Initial Snapshot Creation');
const snap1 = createClinicalSnapshot({
  patient: samplePatient,
  visitId: 'vis_01',
  isBaseline: true,
  approvalStatus: 'approved',
  approvedBy: 'Dr. Clinician, RD'
});

assert(snap1.snapshot_id.startsWith('snap_'), 'Snapshot ID has snap_ prefix');
assert(snap1.visit_id === 'vis_01', 'Snapshot visit_id is vis_01');
assert(snap1.is_baseline === true, 'Snapshot is baseline');
assert(snap1.revision === 1, 'Initial revision is 1');
assert(snap1.approval_status === 'approved', 'Approval status is approved');
assert(snap1.anthropometrics.weight_kg === 75, 'Weight is 75 kg');

// 2. Revision Policy: Approved Snapshot Protection
console.log('\n2. Revision Policy: Approved Snapshot Protection');
const initialSnapshots: ClinicalVisitSnapshot[] = [snap1];

// Amending the visit with new waist measurement
const amendedPatient = { ...samplePatient, waist_cm: 88 };
const snap2 = createClinicalSnapshot({
  patient: amendedPatient,
  visitId: 'vis_01',
  isBaseline: true,
  approvalStatus: 'draft',
  amendmentReason: 'Clinician remeasured waist circumference'
});

const updatedSnapshots = appendSnapshotWithRevisionPolicy(initialSnapshots, snap2);

assert(updatedSnapshots.length === 2, 'Both original approved snapshot and amendment are retained (not overwritten)');
const rev1 = updatedSnapshots.find(s => s.revision === 1)!;
const rev2 = updatedSnapshots.find(s => s.revision === 2)!;
assert(rev1.approval_status === 'approved', 'Revision 1 remains approved');
assert(rev1.anthropometrics.waist_cm === 90, 'Revision 1 waist is 90 cm');
assert(rev2.revision === 2, 'Revision 2 incremented to 2');
assert(rev2.anthropometrics.waist_cm === 88, 'Revision 2 waist is 88 cm');
assert(rev2.amended_from_snapshot_id === snap1.snapshot_id, 'Revision 2 references ancestor snapshot');

// 3. Draft Snapshot Replacement
console.log('\n3. Draft Snapshot In-Place Update');
const draftSnapshots = [snap2];
const snap2Edited = {
  ...snap2,
  anthropometrics: { ...snap2.anthropometrics, weight_kg: 74 }
};
const updatedDrafts = appendSnapshotWithRevisionPolicy(draftSnapshots, snap2Edited);
assert(updatedDrafts.length === 1, 'Unapproved draft snapshot is updated in place without duplicate entries');
assert(updatedDrafts[0].anthropometrics.weight_kg === 74, 'Updated draft reflects new weight');

// 4. Query Helpers
console.log('\n4. Query Helpers');
const latest = getLatestVisitSnapshot(updatedSnapshots, 'vis_01');
assert(latest?.revision === 2, 'Latest snapshot returns revision 2');
const baseline = getApprovedBaselineSnapshot(updatedSnapshots);
assert(baseline?.snapshot_id === snap1.snapshot_id, 'Approved baseline helper returns revision 1');

console.log('\nALL SNAPSHOT MANAGER TESTS PASSED!');
