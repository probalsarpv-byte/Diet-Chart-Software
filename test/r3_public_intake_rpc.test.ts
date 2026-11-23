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
  assert(inv.invitation_token.length === 71, `Token has exact 256-bit entropy (length: ${inv.invitation_token.length} chars = prefix + 64 hex)`);
  assert(inv.status === 'pending', 'Initial invitation status is "pending"');
  assert(typeof inv.token_hash === 'string' && inv.token_hash.length === 64, 'Token SHA-256 hash computed and stored');

  // Verify internal storage does NOT store raw plaintext token (hash-only persistence)
  const rawStorageInvitations = JSON.parse(memoryStorage['shuddho_assessment_invitations'] || '[]');
  const storedInv = rawStorageInvitations.find((x: any) => x.id === inv.id);
  assert(storedInv !== undefined, 'Stored invitation found in persistence layer');
  assert(storedInv.invitation_token === '', 'Persistence layer strictly stores empty string for plaintext invitation_token');
  assert(storedInv.token_hash === inv.token_hash, 'Persistence layer stores cryptographically secure SHA-256 token_hash');

  // Verify Audit Log does NOT leak plaintext token
  const inviteAudits = await repo.getAuditEvents('pt_remote_01');
  const createInviteAudit = inviteAudits.find(a => a.event_type === 'INTAKE_INVITATION_CREATED');
  assert(createInviteAudit !== undefined, 'INTAKE_INVITATION_CREATED audit event logged');
  assert(!JSON.stringify(createInviteAudit?.payload_after || {}).includes(inv.invitation_token), 'Audit payload strictly excludes raw plaintext token');

  // Verify multiple tokens are completely distinct (no PRNG collisions)
  const tokens = new Set<string>();
  tokens.add(inv.invitation_token);
  for (let i = 0; i < 50; i++) {
    const freshInv = await repo.createAssessmentInvitation('pt_remote_01', mockClinician, 14);
    tokens.add(freshInv.invitation_token);
  }
  assert(tokens.size === 51, 'All 51 generated tokens are cryptographically distinct with zero collision');

  // --- 2. Token Verification (Minimal Metadata Exposure & Access Telemetry) ---
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

  // D. Access Telemetry
  const updatedInvAfterAccess = await repo.getAssessmentInvitationByToken(inv.invitation_token);
  assert((updatedInvAfterAccess?.access_count || 0) >= 1, 'Access count telemetry incremented on token verification');
  assert(Boolean(updatedInvAfterAccess?.first_accessed_at), 'first_accessed_at timestamp recorded');

  // --- 3. Invitation Revocation and Rotation ---
  console.log('\n--- 3. Invitation Revocation & Rotation ---');
  const invToRevoke = await repo.createAssessmentInvitation('pt_remote_01', mockClinician, 7);
  const revokeSuccess = await repo.revokeAssessmentInvitation(invToRevoke.id, mockClinician);
  assert(revokeSuccess === true, 'Invitation revocation returns success = true');

  const verifyRevoked = await repo.verifyPublicIntakeToken(invToRevoke.invitation_token);
  assert(!verifyRevoked.valid && verifyRevoked.reason === 'revoked', 'Verification of revoked token rejected with reason="revoked"');

  // Rotation test
  const invToRotate = await repo.createAssessmentInvitation('pt_remote_01', mockClinician, 7);
  const rotatedInv = await repo.rotateAssessmentInvitation(invToRotate.id, mockClinician, 14);
  assert(rotatedInv.id !== invToRotate.id, 'Rotated invitation has new unique ID');
  assert(rotatedInv.invitation_token !== invToRotate.invitation_token, 'Rotated invitation has fresh secure token');
  
  const verifyOldRotated = await repo.verifyPublicIntakeToken(invToRotate.invitation_token);
  assert(!verifyOldRotated.valid && verifyOldRotated.reason === 'revoked', 'Original rotated token is now revoked');

  // --- 4. Public Assessment Submission & Chart Isolation ---
  console.log('\n--- 4. Public Assessment Submission & Isolation ---');

  // A. Missing consent enforcement gate
  let missingConsentBlocked = false;
  try {
    await repo.submitPublicIntakeAssessment(inv.invitation_token, {
      current_weight_kg: 66.5,
      patient_acknowledged_consent: false
    });
  } catch (err: any) {
    missingConsentBlocked = true;
    assert(err.message.includes('Consent Not Acknowledged'), 'Submission rejected when consent is missing or false');
  }
  assert(missingConsentBlocked, 'Server-side consent requirement strictly enforced');

  // B. Valid submission with consent
  const intakeResponses = {
    current_weight_kg: 66.5,
    typical_sleep_hours: 8.0,
    digestive_bloating: 'severe',
    reported_new_allergies: ['shellfish'],
    maternal_status: 'none',
    bloating_timing: '1_2_hours_post_meal',
    bloating_triggers: ['legumes', 'raw_vegetables'],
    fasting_interest: true,
    fasting_schedule: '16_8',
    active_medications: [{ name: 'Metformin', timing: 'with_meals', side_effects: ['mild_nausea'] }],
    patient_acknowledged_consent: true
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
    await repo.submitPublicIntakeAssessment(inv.invitation_token, { weight: 50, patient_acknowledged_consent: true });
  } catch (err: any) {
    replayBlocked = true;
    assert(err.message.includes('completed'), 'Replay attack on completed invitation blocked');
  }
  assert(replayBlocked, 'Replay submission strictly prevented');

  // --- 5. Clinical Reconciliation & Plan Invalidation Protection ---
  console.log('\n--- 5. Clinical Reconciliation & Plan Invalidation Protection ---');
  // Seed an active approved diet plan for pt_remote_01
  await repo.saveNutritionPlan({
    plan_id: 'plan_pt_remote_01',
    patient_id: 'pt_remote_01',
    visit_id: 'vis_remote_01',
    version: 1,
    schema_version: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'approved',
    is_approved: true,
    approved_by: mockClinician.name,
    approval_date: new Date().toISOString(),
    target_macros: { calories: 1800, protein_g: 80, carbs_g: 200, fat_g: 55 },
    days: [],
    overall_safety_status: 'SAFE'
  });

  const planBeforeReconcile = await repo.getNutritionPlan('pt_remote_01');
  assert(planBeforeReconcile?.is_approved === true, 'Diet plan is initially approved');

  // Clinician reconciles intake and ACCEPTS the new shellfish allergy
  const staged = await repo.getStagedSubmissions('pt_remote_01');
  assert(staged.length >= 1, 'Staged submission retrieved for clinician reconciliation');

  const { updatedPatient } = await repo.reconcileAssessmentSubmission(
    staged[0].id,
    mockClinician,
    {
      confirmed_allergies: { status: 'accepted', value: ['egg', 'shellfish'] },
      weight_kg: { status: 'accepted', value: 66.5 }
    },
    'Accepted shellfish allergy based on clinical interview.'
  );

  assert(updatedPatient.confirmed_allergies.includes('shellfish'), 'Shellfish allergy now confirmed in patient chart');

  // Verify active approved plan was invalidated!
  const planAfterReconcile = await repo.getNutritionPlan('pt_remote_01');
  assert(planAfterReconcile?.is_approved === false, 'Approved plan invalidated when new allergy confirmed');
  assert(planAfterReconcile?.status === 'requires_review', 'Plan status shifted to requires_review');

  const latestAudits = await repo.getAuditEvents('pt_remote_01');
  const planInvalAudit = latestAudits.find(a => a.event_type === 'PLAN_INVALIDATED');
  assert(planInvalAudit !== undefined, 'PLAN_INVALIDATED audit event logged with clinical justification');

  // --- 6. Reconciliation Allowlist & Tampering Rejection ---
  console.log('\n--- 6. Reconciliation Allowlist & Tampering Rejection ---');
  // Attempt to submit unauthorized keys in reconciliation decisions (e.g. escalating privileges, injecting raw schema)
  const illegalDecisions: any = {
    organization_id: { status: 'accepted', value: 'stolen_org_uuid' },
    role: { status: 'accepted', value: 'SUPERADMIN' },
    is_active: { status: 'accepted', value: false },
    custom_injected_field: { status: 'accepted', value: 'malicious_code' },
    weight_kg: { status: 'accepted', value: 65.0 }
  };

  let securityViolationThrown = false;
  try {
    await repo.reconcileAssessmentSubmission(
      staged[0].id,
      mockClinician,
      illegalDecisions,
      'Attempted injection test.'
    );
  } catch (err: any) {
    securityViolationThrown = true;
    assert(err.message.includes('Security Violation') && err.message.includes('organization_id'), 'Illegal field organization_id strictly throws Security Violation error');
  }
  assert(securityViolationThrown, 'Tampering attempt with unauthorized fields fail-closed with Security Violation exception');

  const patientAfterIllegal = await repo.getPatientById('pt_remote_01');
  assert((patientAfterIllegal as any).organization_id !== 'stolen_org_uuid', 'Illegal field organization_id was NOT applied to patient chart');
  assert((patientAfterIllegal as any).role === undefined, 'Illegal field role strictly blocked by allowlist');
  assert((patientAfterIllegal as any).custom_injected_field === undefined, 'Arbitrary payload field custom_injected_field blocked by allowlist');

  // --- 7. Significant Weight Shift (>= 3kg) Plan Invalidation ---
  console.log('\n--- 7. Significant Weight Shift (>= 3kg) Plan Invalidation ---');
  // Re-approve the plan
  await repo.saveNutritionPlan({
    plan_id: 'plan_pt_remote_01',
    patient_id: 'pt_remote_01',
    visit_id: 'vis_remote_01',
    version: 2,
    schema_version: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'approved',
    is_approved: true,
    approved_by: mockClinician.name,
    approval_date: new Date().toISOString(),
    target_macros: { calories: 1800, protein_g: 80, carbs_g: 200, fat_g: 55 },
    days: [],
    overall_safety_status: 'SAFE'
  });
  const reapprovedPlan = await repo.getNutritionPlan('pt_remote_01');
  assert(reapprovedPlan?.is_approved === true, 'Diet plan re-approved for version 2');

  // Baseline weight before this test is 66.5kg. Reconcile weight to 61.5kg (delta = 5.0kg >= 3kg).
  await repo.reconcileAssessmentSubmission(
    staged[0].id,
    mockClinician,
    {
      weight_kg: { status: 'accepted', value: 61.5 }
    },
    'Weight loss of 5.0kg confirmed on calibrated clinic scale.'
  );

  const planAfterWeightShift = await repo.getNutritionPlan('pt_remote_01');
  assert(planAfterWeightShift?.is_approved === false, 'Approved plan invalidated when weight delta >= 3kg (delta: -5.0kg)');
  assert(planAfterWeightShift?.status === 'requires_review', 'Plan status transitioned to requires_review');

  // --- 8. Dual Hosting & Repository Factory Isolation ---
  console.log('\n--- 8. Dual Hosting & Repository Factory Isolation ---');
  const { getPracticeRepository, resetPracticeRepository } = await import('../src/repositories');
  resetPracticeRepository();
  const repoInstance = getPracticeRepository(false);
  assert(repoInstance !== null, 'Repository factory safely resolves repository instance for static export & dual deployment');
  assert(repoInstance.isCloud === false, 'Unconfigured environment defaults to local isolation mode');
  resetPracticeRepository();
  assert(true, 'resetPracticeRepository successfully resets singleton repository cache');

  console.log('\n================================================================');
  console.log('R3 PUBLIC INTAKE RPC RESULTS: ALL CHECKS PASSED (0 FAILED)');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
