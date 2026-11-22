/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION SOFTWARE
 * R2: REPOSITORY PERSISTENCE & DATA CONTRACTS TEST SUITE
 * 
 * Verifies:
 * - Patient CRUD operations and immutable audit trail emission.
 * - Visit lifecycle persistence.
 * - Nutrition plan versioning and storage.
 * - Multi-tenancy and sync state diagnostics.
 */

import { LocalDemoRepository } from '../src/repositories/LocalDemoRepository';
import { SupabasePracticeRepository } from '../src/repositories/SupabasePracticeRepository';
import { PatientProfile, ClinicalVisit, WeeklyDietPlan } from '../src/types';
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
console.log('SHUDDHO R2: REPOSITORY PERSISTENCE & AUDIT TRAIL TEST SUITE');
console.log('================================================================\n');

(async () => {
  const repo = new LocalDemoRepository();

  const testPatient: PatientProfile = {
    schema_version: 2,
    id: 'pt_persist_01',
    name: 'Begum Rokeya',
    age: 45,
    gender: 'female',
    phone: '01812345678',
    email: 'rokeya@example.com',
    visit_date: '2026-11-22',
    current_visit_id: 'vis_rokeya_01',
    current_phase: 1,
    height_cm: 154,
    weight_kg: 62,
    waist_cm: 80,
    activity_level: 'sedentary',
    sleep_hours: 7,
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
    calculated: calculateAnthropometrics(45, 'female', 154, 62, 80, 'sedentary', ['t2d_ir'], 'adult_standard', undefined, 'clamped_to_bmr'),
    is_diet_plan_dirty: false
  };

  // -------------------------------------------------------------------
  // 1. Patient Lifecycle Persistence
  // -------------------------------------------------------------------
  console.log('--- 1. Patient Lifecycle Persistence ---');
  await repo.savePatient(testPatient);
  const fetched = await repo.getPatientById('pt_persist_01');
  assert(fetched !== null && fetched.name === 'Begum Rokeya', '1. Patient saved and retrieved by ID');

  const allPatients = await repo.getPatients();
  assert(allPatients.some(p => p.id === 'pt_persist_01'), '1. Patient appears in full practice directory');

  // Verify Audit Event created
  const auditList = await repo.getAuditEvents('pt_persist_01');
  assert(auditList.length > 0, '1. Audit event logged for patient creation');
  assert(auditList[0].event_type === 'PATIENT_CREATED', '1. Event type is PATIENT_CREATED');

  // -------------------------------------------------------------------
  // 2. Visit Operations
  // -------------------------------------------------------------------
  console.log('\n--- 2. Clinical Visit Persistence ---');
  const visit: ClinicalVisit = {
    visit_id: 'vis_rokeya_01',
    patient_id: 'pt_persist_01',
    visit_number: 1,
    visit_date: '2026-11-22',
    visit_type: 'baseline_consultation',
    status: 'completed',
    clinical_notes: 'Baseline metabolic consultation completed.',
    created_at: new Date().toISOString()
  };

  await repo.saveVisit(visit);
  const visits = await repo.getVisits('pt_persist_01');
  assert(visits.length === 1 && visits[0].visit_id === 'vis_rokeya_01', '2. Clinical visit saved and retrieved');

  // -------------------------------------------------------------------
  // 3. Nutrition Plan Operations
  // -------------------------------------------------------------------
  console.log('\n--- 3. Nutrition Plan Persistence ---');
  const plan: WeeklyDietPlan = {
    plan_id: 'plan_rokeya_01',
    patient_id: 'pt_persist_01',
    visit_id: 'vis_rokeya_01',
    version: 1,
    schema_version: 2,
    status: 'draft',
    is_approved: false,
    meal_structure: '3_meals_1_snack',
    nutritional_adequacy: {} as any,
    target_macros: { calories: 1400, protein_g: 70, carbs_g: 140, fat_g: 45 },
    days: [],
    overall_safety_status: 'SAFE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  await repo.saveNutritionPlan(plan);
  const retrievedPlan = await repo.getNutritionPlan('pt_persist_01', 'vis_rokeya_01');
  assert(retrievedPlan !== null && retrievedPlan.plan_id === 'plan_rokeya_01', '3. Nutrition plan saved and retrieved');

  // -------------------------------------------------------------------
  // 4. Clinical Sign-Off Transaction
  // -------------------------------------------------------------------
  console.log('\n--- 4. Clinical Approval Transaction ---');
  const clinician: ClinicianAuthProfile = {
    id: 'c_nut_01',
    auth_user_id: 'u_nut_01',
    organization_id: 'org_01',
    name: 'Dr. Farhana Rahman, MD, CNS',
    email: 'farhana@shuddhobd.com',
    role: 'TREATING_NUTRITIONIST',
    license_number: 'BMDC-A-67123',
    is_active: true
  };

  const approved = await repo.approveNutritionPlan(plan, clinician, 'Metabolic stabilization plan approved.');
  assert(approved.status === 'approved', '4. Plan status transitioned to approved');
  assert(approved.is_approved === true, '4. is_approved flag set to true');

  const approvalAudits = await repo.getAuditEvents('pt_persist_01');
  const approvalAudit = approvalAudits.find(a => a.event_type === 'PLAN_APPROVED');
  assert(approvalAudit !== undefined, '4. PLAN_APPROVED audit event logged in audit trail');
  assert(approvalAudit?.clinician_name === 'Dr. Farhana Rahman, MD, CNS', '4. Clinician name bound to approval audit record');

  // -------------------------------------------------------------------
  // 5. Supabase Practice Repository Unit & Integration Assertions
  // -------------------------------------------------------------------
  console.log('\n--- 5. Supabase Practice Repository Unit Assertions ---');
  const mockTableData: Record<string, any[]> = {
    patients: [{ client_id: 'pt_mock', name: 'Mock Pt', age: 30, gender: 'male', height_cm: 170, weight_kg: 70, organization_id: 'org_mock_01' }],
    visits: [{ client_visit_id: 'vis_mock_01', patient_id: 'pt_mock', visit_number: 1, visit_date: '2026-11-22', visit_type: 'initial_assessment', status: 'completed' }],
    nutrition_plans: [{ client_plan_id: 'plan_mock_01', patient_id: 'pt_mock', visit_id: 'vis_mock_01', version: 1, status: 'draft', is_approved: false }],
    approval_records: [],
    audit_events: [{ id: 'ae_mock_01', organization_id: 'org_mock_01', patient_id: 'pt_mock', event_type: 'PATIENT_CREATED', timestamp: new Date().toISOString() }]
  };

  class MockQueryBuilder {
    private data: any[];
    private filters: Array<(row: any) => boolean> = [];

    constructor(data: any[]) {
      this.data = data;
    }

    select() { return this; }
    order() { return this; }
    limit() { return this; }
    eq(col: string, val: any) {
      this.filters.push(r => r[col] === val);
      return this;
    }
    or(expr: string) {
      this.filters.push(r => expr.includes(r.client_id) || expr.includes(r.id));
      return this;
    }
    async maybeSingle() {
      let res = this.data;
      for (const f of this.filters) res = res.filter(f);
      return { data: res[0] || null, error: null };
    }
    async single() {
      return this.maybeSingle();
    }
    then(resolve: any, reject: any) {
      let res = this.data;
      for (const f of this.filters) res = res.filter(f);
      return Promise.resolve({ data: res, error: null }).then(resolve, reject);
    }
  }

  const mockSupabaseClient: any = {
    from: (table: string) => {
      const q = new MockQueryBuilder(mockTableData[table] || []);
      return {
        select: () => q,
        upsert: (payload: any) => ({
          select: () => ({
            single: () => {
              if (!mockTableData[table]) mockTableData[table] = [];
              mockTableData[table].push(payload);
              return Promise.resolve({ data: payload, error: null });
            }
          })
        }),
        insert: (payload: any) => {
          if (!mockTableData[table]) mockTableData[table] = [];
          mockTableData[table].push(payload);
          return Promise.resolve({ data: payload, error: null });
        },
        delete: () => ({
          or: () => Promise.resolve({ error: null })
        })
      };
    }
  };

  const cloudRepo = new SupabasePracticeRepository(mockSupabaseClient, 'org_mock_01');
  assert(cloudRepo.isCloud === true, '5. SupabasePracticeRepository has isCloud: true');
  
  const cloudPatients = await cloudRepo.getPatients();
  assert(cloudPatients.length >= 1 && cloudPatients[0].name === 'Mock Pt', '5. Supabase mapped PostgreSQL row to PatientProfile');

  const fetchedCloudPt = await cloudRepo.getPatientById('pt_mock');
  assert(fetchedCloudPt !== null && fetchedCloudPt.name === 'Mock Pt', '5. Supabase getPatientById retrieved matching patient');

  const savedCloudPt = await cloudRepo.savePatient({
    ...testPatient,
    id: 'pt_cloud_save',
    name: 'Rabeya Khatun'
  });
  assert(savedCloudPt.id === 'pt_cloud_save', '5. Supabase savePatient successfully upserted patient record');

  const cloudVisits = await cloudRepo.getVisits('pt_mock');
  assert(cloudVisits.length >= 1, '5. Supabase getVisits retrieved visit records');

  const cloudPlan = await cloudRepo.getNutritionPlan('pt_mock', 'vis_mock_01');
  assert(cloudPlan !== null && cloudPlan.plan_id === 'plan_mock_01', '5. Supabase getNutritionPlan retrieved plan');

  const cloudAudits = await cloudRepo.getAuditEvents('pt_mock');
  assert(cloudAudits.length >= 1, '5. Supabase getAuditEvents retrieved audit trail');

  console.log('\n================================================================');
  console.log(`R2 PERSISTENCE TEST RESULTS: ${passedAssertions}/${totalAssertions} PASSED (${failedAssertions} FAILED)`);
  console.log('================================================================\n');

  if (failedAssertions > 0) {
    process.exit(1);
  }
})();
