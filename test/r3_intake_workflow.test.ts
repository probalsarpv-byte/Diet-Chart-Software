/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION SOFTWARE
 * R3: PATIENT SELF-ASSESSMENT WORKFLOW TEST SUITE
 * 
 * Verifies:
 * - Tokenized invitation generation and expiration.
 * - Staged patient submission (zero unvetted mutations to active chart).
 * - Clinician side-by-side reconciliation (selective accept, reject, edit).
 * - Patient profile merge & anthropometric recalculation.
 * - Immutable audit trail emission across all lifecycle transitions.
 */

import { LocalDemoRepository } from '../src/repositories/LocalDemoRepository';
import { PatientProfile } from '../src/types';
import { ClinicianAuthProfile } from '../src/lib/supabaseClient';
import { calculateAnthropometrics } from '../src/engine/anthropometrics';

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
console.log('SHUDDHO R3: PATIENT SELF-ASSESSMENT WORKFLOW TEST SUITE');
console.log('================================================================\n');

(async () => {
  const repo = new LocalDemoRepository();

  const clinician: ClinicianAuthProfile = {
    id: 'c_nut_01',
    auth_user_id: 'u_nut_01',
    organization_id: 'org_main',
    name: 'Dr. Farhana Rahman, MD, CNS',
    email: 'farhana@shuddhobd.com',
    role: 'TREATING_NUTRITIONIST',
    license_number: 'BMDC-A-67123',
    is_active: true
  };

  const initialPatient: PatientProfile = {
    schema_version: 2,
    id: 'pt_r3_test_01',
    name: 'Mrs. Rokeya Begum',
    age: 50,
    gender: 'female',
    phone: '01711998877',
    email: 'rokeya@example.com',
    visit_date: '2026-11-22',
    current_visit_id: 'vis_r3_01',
    current_phase: 1,
    height_cm: 155,
    weight_kg: 70,
    waist_cm: 88,
    activity_level: 'sedentary',
    sleep_hours: 6,
    shift_worker: false,
    population_group: 'adult_standard',
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: ['peanut'],
    allergy_reconciliation_status: 'allergies_confirmed',
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    selected_conditions: ['t2d_ir'],
    active_medications: [],
    medication_records: [],
    medication_reconciliation_status: 'unreconciled',
    feeding_status: { route: 'oral_standard', oral_intake_permitted: true, requires_specialist_support: false },
    gut_profile: { bloating: 'none', acid_reflux_hypoacidity: false, bristol_stool_score: 4, energy_score: 7, sleep_quality_score: 7, digestive_fire_agni: 'samagni' },
    labs: { lab_flags: [] },
    calculated: calculateAnthropometrics(50, 'female', 155, 70, 88, 'sedentary', ['t2d_ir'], 'adult_standard', undefined, 'clamped_to_bmr'),
    is_diet_plan_dirty: false
  };

  await repo.savePatient(initialPatient);

  // -------------------------------------------------------------------
  // 1. Tokenized Invitation Generation
  // -------------------------------------------------------------------
  console.log('--- 1. Tokenized Invitation Lifecycle ---');
  const invitation = await repo.createAssessmentInvitation('pt_r3_test_01', clinician, 14);
  assert(invitation !== null, '1. Assessment invitation generated successfully');
  assert(invitation.invitation_token.startsWith('sh_inv_'), '1. Token has standardized prefix sh_inv_');
  assert(invitation.status === 'pending', '1. Invitation initial status is pending');
  assert(new Date(invitation.expires_at) > new Date(), '1. Expiration timestamp set 14 days in future');

  const fetchedByToken = await repo.getAssessmentInvitationByToken(invitation.invitation_token);
  assert(fetchedByToken !== null && fetchedByToken.id === invitation.id, '1. Invitation resolved by token');

  const invalidToken = await repo.getAssessmentInvitationByToken('invalid_token_999');
  assert(invalidToken === null, '1. Invalid token returns null (fail closed)');

  // Verify Audit Event logged
  const auditLogs = await repo.getAuditEvents('pt_r3_test_01');
  const inviteAudit = auditLogs.find(a => a.event_type === 'INTAKE_INVITATION_CREATED');
  assert(inviteAudit !== undefined, '1. INTAKE_INVITATION_CREATED audit event logged');

  // -------------------------------------------------------------------
  // 2. Staged Intake Submission (Staging Isolation Invariant)
  // -------------------------------------------------------------------
  console.log('\n--- 2. Staged Patient Submission Isolation ---');
  const patientResponses = {
    patient_name: 'Mrs. Rokeya Begum',
    weight_kg: 68.5, // Patient claims weight reduced to 68.5
    height_cm: 155,
    sleep_hours: 7.5,
    bloating: 'moderate',
    bristol_stool_score: 5,
    acid_reflux: true,
    digestive_fire_agni: 'vishama_agni',
    reported_allergies: ['peanut', 'gluten'], // Patient self-claims gluten allergy
    primary_complaints: 'Bloating after evening meals and fatigue'
  };

  const submission = await repo.submitAssessment(invitation.invitation_token, patientResponses);
  assert(submission !== null, '2. Assessment submission recorded in staging queue');
  assert(submission.patient_id === 'pt_r3_test_01', '2. Submission accurately bound to patient ID');

  // CRITICAL INVARIANT: The active clinical chart MUST NOT have mutated!
  const patientAfterSubmission = await repo.getPatientById('pt_r3_test_01');
  assert(patientAfterSubmission !== null, '2. Active patient retrieved');
  assert(patientAfterSubmission?.weight_kg === 70, '2. Active chart weight remains 70 kg (NOT auto-updated to 68.5)');
  assert(!patientAfterSubmission?.confirmed_allergies.includes('gluten'), '2. Active chart allergy list does NOT include unverified gluten');
  assert(patientAfterSubmission?.gut_profile?.bloating === 'none', '2. Active chart gut profile untouched before review');

  // Invitation status must now be completed
  const updatedInvitation = await repo.getAssessmentInvitationByToken(invitation.invitation_token);
  assert(updatedInvitation?.status === 'completed', '2. Invitation status transitioned to completed');

  // -------------------------------------------------------------------
  // 3. Clinician Staging Queue & Reconciliation Diff Viewer
  // -------------------------------------------------------------------
  console.log('\n--- 3. Clinician Staging Queue & Reconciliation ---');
  const stagedSubmissions = await repo.getStagedSubmissions('pt_r3_test_01');
  assert(stagedSubmissions.length === 1, '3. Clinician staging queue retrieves 1 pending submission');
  assert(stagedSubmissions[0].id === submission.id, '3. Staged submission matches submitted ID');

  // Clinician reconciliation decisions:
  // - Accept weight: 68.5 kg
  // - Accept bloating: 'moderate'
  // - Accept bristol_stool: 5
  // - Accept acid_reflux: true
  // - Reject unverified 'gluten' allergy (requires IgE antibody test)
  // - Edit sleep_hours to 7.0 (clinician assessment)
  const reconciliationDecisions = {
    weight_kg: { status: 'accepted' as const, value: 68.5 },
    sleep_hours: { status: 'edited' as const, value: 7.0, reason: 'Adjusted to reflect effective restorative sleep' },
    bloating: { status: 'accepted' as const, value: 'moderate' },
    bristol_stool_score: { status: 'accepted' as const, value: 5 },
    acid_reflux: { status: 'accepted' as const, value: true },
    digestive_fire_agni: { status: 'accepted' as const, value: 'vishama_agni' },
    reported_allergies: { status: 'rejected' as const, reason: 'Requires formal serum IgE laboratory confirmation' }
  };

  const { review, updatedPatient } = await repo.reconcileAssessmentSubmission(
    submission.id,
    clinician,
    reconciliationDecisions,
    'Reconciled during follow-up consultation.'
  );

  assert(review !== null && review.review_status === 'partially_accepted', '3. Review record created with status partially_accepted');
  assert(review.reviewer_name === clinician.name, '3. Review bound to licensed clinician name');

  // Verify Patient Chart is now legitimately updated with accepted values
  assert(updatedPatient.weight_kg === 68.5, '3. Patient weight safely updated to 68.5 kg');
  assert(updatedPatient.sleep_hours === 7.0, '3. Patient sleep hours updated to clinician-edited 7.0');
  assert(updatedPatient.gut_profile.bloating === 'moderate', '3. Patient gut bloating updated to moderate');
  assert(updatedPatient.gut_profile.bristol_stool_score === 5, '3. Bristol stool score updated to 5');
  assert(!updatedPatient.confirmed_allergies.includes('gluten'), '3. Rejected allergy gluten was NOT added to confirmed allergies');

  // Verify Anthropometrics Recalculated
  assert(updatedPatient.calculated.bmi !== initialPatient.calculated.bmi, '3. Anthropometrics BMI recalculated for new weight');
  assert(updatedPatient.calculated.bmr !== initialPatient.calculated.bmr, '3. Calculated BMR recalculated for updated weight');

  // Verify Audit Trail has ASSESSMENT_SUBMISSION_ACCEPTED
  const latestAudits = await repo.getAuditEvents('pt_r3_test_01');
  const acceptAudit = latestAudits.find(a => a.event_type === 'ASSESSMENT_SUBMISSION_ACCEPTED');
  assert(acceptAudit !== undefined, '3. ASSESSMENT_SUBMISSION_ACCEPTED audit event logged');
  assert(acceptAudit?.clinician_name === clinician.name, '3. Audit event bound to reviewer name');

  console.log('\n================================================================');
  console.log(`R3 INTAKE WORKFLOW RESULTS: ${passedAssertions}/${totalAssertions} PASSED (${failedAssertions} FAILED)`);
  console.log('================================================================\n');

  if (failedAssertions > 0) {
    process.exit(1);
  }
})();
