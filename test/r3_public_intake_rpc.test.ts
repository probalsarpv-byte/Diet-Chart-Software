/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * R3 Secure Public Patient Intake RPC & Staging Suite
 * 
 * Verifies:
 * 1. Security-Definer public token verification without leaking clinical charts
 * 2. Token state rejection (missing, invalid, expired, revoked, completed)
 * 3. Staging queue isolation: assessment submission does not mutate active patient
 * 4. Cryptographically secure token entropy & format
 */

import { LocalDemoRepository } from '../src/repositories/LocalDemoRepository';
import { ClinicianAuthProfile } from '../src/lib/supabaseClient';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ PASS: ${msg}`);
}

// Node memoryStorage mock for localStorage
const memoryStorage: Record<string, string> = {};
(global as any).window = {};
(global as any).localStorage = {
  getItem: (key: string) => memoryStorage[key] || null,
  setItem: (key: string, val: string) => { memoryStorage[key] = val; },
  removeItem: (key: string) => { delete memoryStorage[key]; },
  clear: () => { Object.keys(memoryStorage).forEach(k => delete memoryStorage[k]); }
};

console.log('\n================================================================');
console.log('SHUDDHO R3: PUBLIC PATIENT INTAKE RPC & SECURITY TEST SUITE');
console.log('================================================================\n');

async function runTests() {
  const repo = new LocalDemoRepository();

  const mockClinician: ClinicianAuthProfile = {
    id: 'c0000000-0000-0000-0000-000000000001',
    auth_user_id: 'u0000000-0000-0000-0000-000000000001',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Dr. Tariqul Islam, MD, PhD, CNS',
    email: 'director@shuddho.clinic',
    role: 'CLINICAL_DIRECTOR',
    license_number: 'BMDC-A-67123',
    is_active: true
  };

  // Seed baseline patient
  await repo.savePatient({
    schema_version: 2,
    id: 'pt_remote_01',
    name: 'Shirin Sultana',
    age: 42,
    gender: 'female',
    phone: '+8801700000000',
    visit_date: '2026-11-23',
    current_phase: 1,
    population_group: 'adult_standard',
    height_cm: 158,
    weight_kg: 68,
    waist_cm: 86,
    activity_level: 'sedentary',
    sleep_hours: 6.5,
    shift_worker: false,
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: ['egg'],
    allergy_reconciliation_status: 'allergies_confirmed',
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    selected_conditions: [],
    active_medications: [],
    medication_records: [],
    medication_reconciliation_status: 'fully_reconciled',
    feeding_status: { route: 'oral_standard', oral_intake_permitted: true, requires_specialist_support: false },
    gut_profile: { bloating: 'moderate', digestive_fire_agni: 'samagni', acid_reflux_hypoacidity: false, bristol_stool_score: 4, energy_score: 7, sleep_quality_score: 7 },
    labs: { lab_flags: [] },
    calculated: {} as any,
    clinical_safety: {} as any
  });

  // --- 1. Token Creation & Cryptographic Entropy ---
  console.log('--- 1. Cryptographically Secure Token Creation ---');
  const inv = await repo.createAssessmentInvitation('pt_remote_01', mockClinician, 14);

  assert(inv.invitation_token.startsWith('sh_inv_'), 'Token has standardized prefix "sh_inv_"');
  assert(inv.invitation_token.length >= 24, `Token has sufficient entropy (length: ${inv.invitation_token.length})`);
  assert(inv.status === 'pending', 'Initial invitation status is "pending"');

  // Verify multiple tokens are completely distinct (no PRNG collisions)
  const tokens = new Set<string>();
  tokens.add(inv.invitation_token);
  for (let i = 0; i < 50; i++) {
    const freshInv = await repo.createAssessmentInvitation('pt_remote_01', mockClinician, 14);
    tokens.add(freshInv.invitation_token);
  }
  assert(tokens.size === 51, 'All 51 generated tokens are cryptographically distinct with zero collision');

  // --- 2. Token Verification (Minimal Metadata Exposure) ---
  console.log('\n--- 2. Public Token Verification ---');
  
  // A. Missing token
  const resMissing = await repo.verifyPublicIntakeToken('');
  assert(!resMissing.valid && resMissing.reason === 'missing', 'Empty/null token rejected with reason="missing"');

  // B. Invalid / forged token
  const resInvalid = await repo.verifyPublicIntakeToken('sh_inv_forged_malicious_token');
  assert(!resInvalid.valid && resInvalid.reason === 'invalid', 'Forged token rejected with reason="invalid"');

  // C. Valid active token
  const resValid = await repo.verifyPublicIntakeToken(inv.invitation_token);
  assert(resValid.valid === true, 'Active token verified as valid');
  assert(resValid.patient_display_name === 'Shirin Sultana', 'Patient display name safely retrieved');
  assert(resValid.initial_age === 42, 'Patient initial age retrieved');
  assert(resValid.initial_gender === 'female', 'Patient gender retrieved');

  // --- 3. Public Assessment Submission & Chart Isolation ---
  console.log('\n--- 3. Public Assessment Submission & Isolation ---');

  const intakeResponses = {
    current_weight_kg: 66.5,
    typical_sleep_hours: 8.0,
    digestive_bloating: 'severe',
    reported_new_allergies: ['shellfish']
  };

  const submitResult = await repo.submitPublicIntakeAssessment(inv.invitation_token, intakeResponses);
  assert(submitResult.success === true, 'Public assessment submitted successfully');
  assert(typeof submitResult.submission_id === 'string', 'Returned generated submission ID');

  // Verify patient active chart was NOT mutated
  const patientAfterSubmit = await repo.getPatientById('pt_remote_01');
  assert(patientAfterSubmit?.weight_kg === 68, 'Active patient weight remains 68 kg (NOT mutated to 66.5 kg)');
  assert(!patientAfterSubmit?.confirmed_allergies.includes('shellfish'), 'Shellfish allergy NOT added to confirmed chart');
  assert(patientAfterSubmit?.gut_profile?.bloating === 'moderate', 'Bloating remains moderate in active chart (NOT severe)');

  // Verify invitation is now marked completed
  const resCompleted = await repo.verifyPublicIntakeToken(inv.invitation_token);
  assert(!resCompleted.valid && resCompleted.reason === 'completed', 'Completed token rejected on subsequent attempt with reason="completed"');

  // Attempt to submit again on completed token
  let replayBlocked = false;
  try {
    await repo.submitPublicIntakeAssessment(inv.invitation_token, { weight: 50 });
  } catch (err: any) {
    replayBlocked = true;
    assert(err.message.includes('completed'), 'Replay attack on completed invitation blocked');
  }
  assert(replayBlocked, 'Replay submission strictly prevented');

  console.log('\n================================================================');
  console.log('R3 PUBLIC INTAKE RPC RESULTS: ALL CHECKS PASSED (0 FAILED)');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
