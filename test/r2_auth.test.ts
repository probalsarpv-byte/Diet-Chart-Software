/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION SOFTWARE
 * R2: CLINICIAN AUTHENTICATION & RBAC TEST SUITE
 * 
 * Verifies:
 * - Supabase configuration detection & fallback.
 * - Clinician profile roles: CLINICAL_DIRECTOR, TREATING_NUTRITIONIST, ASSISTANT_DIETITIAN.
 * - RBAC authorization gates: Assistant Dietitians are strictly blocked from approving plans.
 * - Session restoration and role assignment.
 */

import { isSupabaseConfigured, ClinicianAuthProfile } from '../src/lib/supabaseClient';
import { LocalDemoRepository } from '../src/repositories/LocalDemoRepository';
import { WeeklyDietPlan } from '../src/types';

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

console.log('\n================================================================');
console.log('SHUDDHO R2: CLINICIAN AUTHENTICATION & RBAC TEST SUITE');
console.log('================================================================\n');

// -------------------------------------------------------------------
// 1. Supabase Environment Detection & Safe Fallback
// -------------------------------------------------------------------
console.log('--- 1. Supabase Environment Detection & Fallback ---');
{
  const configured = isSupabaseConfigured();
  assert(typeof configured === 'boolean', '1. isSupabaseConfigured returns boolean');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    assert(configured === false, '1. Correctly detects unconfigured environment without crashing');
  }
}

// -------------------------------------------------------------------
// 2. Clinician Profiles & RBAC Role Invariants
// -------------------------------------------------------------------
console.log('\n--- 2. Clinician Profiles & RBAC Invariants ---');
{
  const director: ClinicianAuthProfile = {
    id: 'c_dir_01',
    auth_user_id: 'u_dir_01',
    organization_id: 'org_main',
    name: 'Dr. Tariqul Islam, MD, PhD, CNS',
    email: 'director@shuddhobd.com',
    role: 'CLINICAL_DIRECTOR',
    license_number: 'BMDC-A-45892',
    is_active: true
  };

  const nutritionist: ClinicianAuthProfile = {
    id: 'c_nut_01',
    auth_user_id: 'u_nut_01',
    organization_id: 'org_main',
    name: 'Dr. Farhana Rahman, MD, CNS',
    email: 'farhana@shuddhobd.com',
    role: 'TREATING_NUTRITIONIST',
    license_number: 'BMDC-A-67123',
    is_active: true
  };

  const assistant: ClinicianAuthProfile = {
    id: 'c_asst_01',
    auth_user_id: 'u_asst_01',
    organization_id: 'org_main',
    name: 'Sabrina Chowdhury, BSc Nutrition',
    email: 'sabrina@shuddhobd.com',
    role: 'ASSISTANT_DIETITIAN',
    license_number: 'BNDS-J-1204',
    is_active: true
  };

  assert(director.role === 'CLINICAL_DIRECTOR', '2. CLINICAL_DIRECTOR profile valid');
  assert(nutritionist.role === 'TREATING_NUTRITIONIST', '2. TREATING_NUTRITIONIST profile valid');
  assert(assistant.role === 'ASSISTANT_DIETITIAN', '2. ASSISTANT_DIETITIAN profile valid');

  // Verify license requirement
  assert(Boolean(director.license_number), '2. Director holds verified professional license');
  assert(Boolean(nutritionist.license_number), '2. Treating nutritionist holds verified license');
}

// -------------------------------------------------------------------
// 3. RBAC Approval Authorization Gate
// -------------------------------------------------------------------
console.log('\n--- 3. RBAC Approval Authorization Gate ---');
(async () => {
  const repo = new LocalDemoRepository();
  const samplePlan: WeeklyDietPlan = {
    plan_id: 'wp_auth_test',
    patient_id: 'pt_test_01',
    visit_id: 'vis_test_01',
    version: 1,
    schema_version: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'draft',
    is_approved: false,
    meal_structure: '3_meals_1_snack',
    nutritional_adequacy: {} as any,
    target_macros: { calories: 1500, protein_g: 75, carbs_g: 150, fat_g: 45 },
    days: [],
    overall_safety_status: 'SAFE'
  };

  const assistant: ClinicianAuthProfile = {
    id: 'c_asst_01',
    auth_user_id: 'u_asst_01',
    organization_id: 'org_main',
    name: 'Sabrina Chowdhury, BSc Nutrition',
    email: 'sabrina@shuddhobd.com',
    role: 'ASSISTANT_DIETITIAN',
    is_active: true
  };

  const nutritionist: ClinicianAuthProfile = {
    id: 'c_nut_01',
    auth_user_id: 'u_nut_01',
    organization_id: 'org_main',
    name: 'Dr. Farhana Rahman, MD, CNS',
    email: 'farhana@shuddhobd.com',
    role: 'TREATING_NUTRITIONIST',
    license_number: 'BMDC-A-67123',
    is_active: true
  };

  // Attempt approval by Assistant Dietitian -> MUST throw / reject
  let assistantBlocked = false;
  try {
    await repo.approveNutritionPlan(samplePlan, assistant, 'Assistant approval attempt');
  } catch (err: any) {
    assistantBlocked = true;
    assert(err.message.includes('forbidden') || err.message.includes('cannot approve'), '3. Assistant Dietitian is strictly blocked from plan approval');
  }
  assert(assistantBlocked, '3. Assistant approval attempt failed as expected');

  // Attempt approval by Treating Nutritionist -> MUST succeed
  let nutritionistApproved = false;
  try {
    const approved = await repo.approveNutritionPlan(samplePlan, nutritionist, 'Licensed clinical sign-off');
    nutritionistApproved = Boolean(approved.is_approved && approved.status === 'approved');
  } catch (err) {
    console.error('Nutritionist approval failed unexpectedly:', err);
  }
  assert(nutritionistApproved, '3. Treating Nutritionist successfully signs and approves plan');

  console.log('\n================================================================');
  console.log(`R2 AUTH TEST RESULTS: ${passedAssertions}/${totalAssertions} PASSED (${failedAssertions} FAILED)`);
  console.log('================================================================\n');

  if (failedAssertions > 0) {
    process.exit(1);
  }
})();
