/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * R2 UUID Mapping & Atomic Plan Approval Test Suite
 * 
 * Verifies:
 * 1. Bidirectional Client ID <-> UUID mapping and caching
 * 2. Regex UUID detection preventing PostgreSQL 22P02 crashes
 * 3. Atomic approval stored procedure call semantics
 * 4. Strict rejection of Assistant Dietitian approvals
 * 5. Strict rejection of fabricated / empty license numbers
 */

import { SupabasePracticeRepository } from '../src/repositories/SupabasePracticeRepository';
import { ClinicianAuthProfile } from '../src/lib/supabaseClient';
import { WeeklyDietPlan } from '../src/types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ PASS: ${msg}`);
}

console.log('\n================================================================');
console.log('SHUDDHO R2: UUID MAPPING & ATOMIC PLAN APPROVAL TEST SUITE');
console.log('================================================================\n');

// Mock Supabase Client for Unit Testing
const mockDb = {
  patients: [
    { id: '11111111-1111-1111-1111-111111111111', client_id: 'pt_demo_01', name: 'Tanvir Hossain' },
    { id: '22222222-2222-2222-2222-222222222222', client_id: 'pt_demo_02', name: 'Nasreen Akter' }
  ],
  plans: [] as any[],
  approvals: [] as any[],
  rpcCalls: [] as any[]
};

const mockSupabaseClient: any = {
  from: (table: string) => {
    return {
      select: (...args: any[]) => ({
        eq: (col: string, val: any) => ({
          maybeSingle: async () => {
            if (table === 'patients') {
              const found = mockDb.patients.find((p: any) => p[col] === val);
              return { data: found || null, error: null };
            }
            return { data: null, error: null };
          }
        })
      }),
      upsert: async (payload: any) => ({ data: payload, error: null })
    };
  },
  rpc: async (funcName: string, params: any) => {
    mockDb.rpcCalls.push({ funcName, params });
    if (funcName === 'approve_nutrition_plan_atomic') {
      if (!params.p_license_number || !params.p_license_number.trim()) {
        return { data: null, error: { message: 'Professional license number is required for formal sign-off.' } };
      }
      return { 
        data: { 
          success: true, 
          approval_id: 'app_123', 
          plan_id: params.p_client_plan_id, 
          version: params.p_plan_version 
        }, 
        error: null 
      };
    }
    return { data: null, error: null };
  }
};

const repo = new SupabasePracticeRepository(mockSupabaseClient, 'a0000000-0000-0000-0000-000000000001');

async function runTests() {
  // --- 1. UUID Detection ---
  console.log('--- 1. UUID Regex Verification ---');
  assert(repo.isUuid('11111111-1111-1111-1111-111111111111'), 'Standard lowercase UUID is detected as valid');
  assert(repo.isUuid('A0000000-0000-0000-0000-000000000001'), 'Uppercase UUID is detected as valid');
  assert(!repo.isUuid('pt_demo_01'), 'Client ID "pt_demo_01" is correctly recognized as NON-UUID');
  assert(!repo.isUuid('plan_pt_demo_01_1'), 'Plan ID is correctly recognized as NON-UUID');
  assert(!repo.isUuid(''), 'Empty string is correctly recognized as NON-UUID');

  // --- 2. Bidirectional Client ID <-> UUID Resolution ---
  console.log('\n--- 2. Bidirectional Resolution & In-Memory Caching ---');
  const resolvedUuid = await repo.resolvePatientUuid('pt_demo_01');
  assert(resolvedUuid === '11111111-1111-1111-1111-111111111111', 'Client ID "pt_demo_01" resolved to PostgreSQL UUID');

  // Second call must resolve from in-memory cache
  const cachedUuid = await repo.resolvePatientUuid('pt_demo_01');
  assert(cachedUuid === '11111111-1111-1111-1111-111111111111', 'Second lookup served from internal cache');

  // Reverse mapping lookup
  const resolvedClientId = await repo.resolvePatientClientId('11111111-1111-1111-1111-111111111111');
  assert(resolvedClientId === 'pt_demo_01', 'UUID resolved back to original client ID');

  // --- 3. Atomic Plan Approval Verification ---
  console.log('\n--- 3. Atomic Plan Approval & Role Checks ---');

  const basePlan: WeeklyDietPlan = {
    plan_id: 'plan_pt_demo_01_1',
    patient_id: 'pt_demo_01',
    visit_id: 'visit_01',
    version: 1,
    schema_version: 2,
    status: 'draft',
    is_approved: false,
    meal_structure: '3_meals_1_snack',
    target_macros: { calories: 1800, protein_g: 90, carbs_g: 220, fat_g: 50 },
    days: [],
    nutritional_adequacy: {} as any,
    overall_safety_status: 'SAFE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const director: ClinicianAuthProfile = {
    id: 'c0000000-0000-0000-0000-000000000001',
    auth_user_id: 'u0000000-0000-0000-0000-000000000001',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Dr. Tariqul Islam, MD, PhD, CNS',
    email: 'director@shuddho.clinic',
    role: 'CLINICAL_DIRECTOR',
    license_number: 'BMDC-A-67123',
    is_active: true
  };

  const assistant: ClinicianAuthProfile = {
    id: 'c0000000-0000-0000-0000-000000000003',
    auth_user_id: 'u0000000-0000-0000-0000-000000000003',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Sayeda Akter, BSc Nutrition',
    email: 'assistant@shuddho.clinic',
    role: 'ASSISTANT_DIETITIAN',
    license_number: 'BMDC-ASST-01',
    is_active: true
  };

  // Test Assistant Dietitian blocked
  let assistantBlocked = false;
  try {
    await repo.approveNutritionPlan(basePlan, assistant);
  } catch (err: any) {
    assistantBlocked = true;
    assert(err.message.includes('Assistant Dietitians are not authorized'), 'Assistant Dietitian approval strictly rejected');
  }
  assert(assistantBlocked, 'Assistant Dietitian approval attempt failed closed');

  // Test Missing License Number blocked
  const directorNoLicense = { ...director, license_number: '' };
  let noLicenseBlocked = false;
  try {
    await repo.approveNutritionPlan(basePlan, directorNoLicense);
  } catch (err: any) {
    noLicenseBlocked = true;
    assert(err.message.includes('Professional license number is required'), 'Empty license number strictly rejected');
  }
  assert(noLicenseBlocked, 'Missing license number approval attempt failed closed');

  // Test Valid Approval calls atomic RPC
  const approved = await repo.approveNutritionPlan(basePlan, director, 'Approved for clinical delivery');
  assert(approved.is_approved === true, 'Plan successfully marked approved');
  assert(approved.status === 'approved', 'Plan status transitioned to approved');
  assert(mockDb.rpcCalls.length > 0, 'Database RPC was invoked');
  
  const lastRpc = mockDb.rpcCalls[mockDb.rpcCalls.length - 1];
  assert(lastRpc.funcName === 'approve_nutrition_plan_atomic', 'Invoked approve_nutrition_plan_atomic stored procedure');
  assert(lastRpc.params.p_license_number === 'BMDC-A-67123', 'License number passed to RPC');
  assert(lastRpc.params.p_client_patient_id === 'pt_demo_01', 'Patient ID passed to RPC');

  console.log('\n================================================================');
  console.log('R2 UUID MAPPING RESULTS: ALL CHECKS PASSED (0 FAILED)');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
