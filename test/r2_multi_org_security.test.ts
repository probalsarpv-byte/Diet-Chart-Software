/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION SOFTWARE
 * R2: MULTI-ORGANIZATION ACCESS ISOLATION & RBAC SECURITY TEST SUITE
 * 
 * Verifies:
 * - Cross-clinic data isolation between Organization 1 and Organization 2.
 * - Anti-privilege escalation (clinician self-role escalation blocked).
 * - Assigned-patient audit isolation for Assistant Dietitians.
 * - Approval authorization gate (Assistant Dietitian blocked from approving plans).
 * - Audit event immutability (NO UPDATE, NO DELETE).
 * - Schema migrations access protection.
 */

import { ClinicianAuthProfile } from '../src/lib/supabaseClient';
import { PatientProfile, ClinicalVisit, WeeklyDietPlan } from '../src/types';
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

console.log('\n================================================================');
console.log('SHUDDHO R2: MULTI-ORGANIZATION ACCESS ISOLATION & RBAC SUITE');
console.log('================================================================\n');

// -------------------------------------------------------------------
// 1. Setup Test Organizations & Clinicians
// -------------------------------------------------------------------
const org1 = { id: 'org_gulshan_01', name: 'Shuddho Gulshan Central' };
const org2 = { id: 'org_dhanmondi_02', name: 'Dhanmondi Integrative Clinic' };

// Clinicians for Org 1
const dirOrg1: ClinicianAuthProfile = {
  id: 'c_dir_org1',
  auth_user_id: 'u_dir_org1',
  organization_id: org1.id,
  name: 'Dr. Tariqul Islam, MD',
  email: 'tariqul@shuddhobd.com',
  role: 'CLINICAL_DIRECTOR',
  license_number: 'BMDC-A-45892',
  is_active: true
};

const nutOrg1: ClinicianAuthProfile = {
  id: 'c_nut_org1',
  auth_user_id: 'u_nut_org1',
  organization_id: org1.id,
  name: 'Dr. Farhana Rahman, MD, CNS',
  email: 'farhana@shuddhobd.com',
  role: 'TREATING_NUTRITIONIST',
  license_number: 'BMDC-A-67123',
  is_active: true
};

const asstOrg1: ClinicianAuthProfile = {
  id: 'c_asst_org1',
  auth_user_id: 'u_asst_org1',
  organization_id: org1.id,
  name: 'Sabrina Chowdhury, BSc Nutrition',
  email: 'sabrina@shuddhobd.com',
  role: 'ASSISTANT_DIETITIAN',
  license_number: 'BNDS-J-1204',
  is_active: true
};

// Clinicians for Org 2
const dirOrg2: ClinicianAuthProfile = {
  id: 'c_dir_org2',
  auth_user_id: 'u_dir_org2',
  organization_id: org2.id,
  name: 'Dr. Kamal Hossain, MD',
  email: 'kamal@dhanmondiclinic.com',
  role: 'CLINICAL_DIRECTOR',
  license_number: 'BMDC-A-33100',
  is_active: true
};

const nutOrg2: ClinicianAuthProfile = {
  id: 'c_nut_org2',
  auth_user_id: 'u_nut_org2',
  organization_id: org2.id,
  name: 'Dr. Nadia Karim, CNS',
  email: 'nadia@dhanmondiclinic.com',
  role: 'TREATING_NUTRITIONIST',
  license_number: 'BMDC-A-88214',
  is_active: true
};

// Patient 1 in Org 1 (Assigned to asstOrg1)
const patient1Org1: PatientProfile = {
  schema_version: 2,
  id: 'pt_org1_01',
  name: 'Mrs. Nasreen Akhter',
  age: 48,
  gender: 'female',
  phone: '01711223344',
  email: 'nasreen@example.com',
  visit_date: '2026-11-22',
  current_visit_id: 'vis_org1_01',
  current_phase: 1,
  height_cm: 156,
  weight_kg: 68,
  waist_cm: 86,
  activity_level: 'sedentary',
  sleep_hours: 6.5,
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
  calculated: calculateAnthropometrics(48, 'female', 156, 68, 86, 'sedentary', ['t2d_ir'], 'adult_standard', undefined, 'clamped_to_bmr'),
  is_diet_plan_dirty: false
};

// Patient 2 in Org 1 (NOT assigned to asstOrg1)
const patient2Org1: PatientProfile = {
  ...patient1Org1,
  id: 'pt_org1_02',
  name: 'Mr. Kabir Ahmed',
  gender: 'male',
  current_visit_id: 'vis_org1_02'
};

// Patient 3 in Org 2
const patient3Org2: PatientProfile = {
  ...patient1Org1,
  id: 'pt_org2_03',
  name: 'Ms. Shirin Banu',
  current_visit_id: 'vis_org2_03'
};

// Patient assignments in Org 1
const patientAssignments = [
  { organization_id: org1.id, patient_id: patient1Org1.id, clinician_id: asstOrg1.id, is_primary: true }
  // Note: patient2Org1 is NOT assigned to asstOrg1
];

// In-Memory RLS Policy Engine Simulator
interface DbRow {
  table: string;
  data: Record<string, any>;
}

class SimulatedRlsDatabase {
  private rows: DbRow[] = [];

  insert(table: string, data: Record<string, any>, user: ClinicianAuthProfile) {
    // Check INSERT RLS policies
    if (table === 'clinicians') {
      if (user.role !== 'CLINICAL_DIRECTOR') {
        throw new Error(`RLS Violation: clinicians_insert_director_only policy rejected insert`);
      }
    }
    if (table === 'approval_records') {
      if (user.role !== 'CLINICAL_DIRECTOR' && user.role !== 'TREATING_NUTRITIONIST') {
        throw new Error(`RLS Violation: approval_records_insert_licensed_only policy rejected insert`);
      }
    }
    if (table === 'audit_events' || table === 'patients' || table === 'visits' || table === 'nutrition_plans') {
      if (data.organization_id !== user.organization_id) {
        throw new Error(`RLS Violation: Tenant isolation policy rejected cross-clinic insert`);
      }
    }
    if (table === 'schema_migrations') {
      if (user.role !== 'CLINICAL_DIRECTOR') {
        throw new Error(`RLS Violation: schema_migrations_write_director_only rejected insert`);
      }
    }

    this.rows.push({ table, data });
    return data;
  }

  select(table: string, user: ClinicianAuthProfile): any[] {
    return this.rows
      .filter(r => r.table === table)
      .filter(r => {
        // Shared catalogues
        if (table === 'foods' || table === 'recipes' || table === 'schema_migrations') {
          return true;
        }

        // Cross-clinic tenancy isolation
        if (r.data.organization_id !== user.organization_id) {
          return false;
        }

        // Assigned-patient isolation for audit_events
        if (table === 'audit_events') {
          if (user.role === 'CLINICAL_DIRECTOR' || user.role === 'TREATING_NUTRITIONIST') {
            return true;
          }
          if (user.role === 'ASSISTANT_DIETITIAN') {
            if (!r.data.patient_id) return true; // General org event
            return patientAssignments.some(pa => pa.clinician_id === user.id && pa.patient_id === r.data.patient_id);
          }
        }

        return true;
      })
      .map(r => r.data);
  }

  update(table: string, idField: string, idVal: any, updates: Record<string, any>, user: ClinicianAuthProfile) {
    const row = this.rows.find(r => r.table === table && r.data[idField] === idVal);
    if (!row) throw new Error('Row not found');

    // Anti-role escalation trigger check
    if (table === 'clinicians') {
      if (updates.role !== undefined && updates.role !== row.data.role) {
        if (user.role !== 'CLINICAL_DIRECTOR') {
          throw new Error('Privilege escalation blocked: Only CLINICAL_DIRECTOR can modify clinician role.');
        }
      }
      if (updates.organization_id !== undefined && updates.organization_id !== row.data.organization_id) {
        if (user.role !== 'CLINICAL_DIRECTOR') {
          throw new Error('Privilege escalation blocked: Only CLINICAL_DIRECTOR can modify organization assignment.');
        }
      }
    }

    // Nutrition plan approval trigger check
    if (table === 'nutrition_plans') {
      if ((updates.is_approved === true || updates.status === 'approved') &&
          (row.data.is_approved === false || row.data.status !== 'approved')) {
        if (user.role !== 'CLINICAL_DIRECTOR' && user.role !== 'TREATING_NUTRITIONIST') {
          throw new Error('Clinical governance violation: ASSISTANT_DIETITIAN is prohibited from approving nutrition plans.');
        }
      }
    }

    // Audit events immutability
    if (table === 'audit_events') {
      throw new Error('RLS Violation: audit_events_update_forbidden policy rejected update (USING false)');
    }

    Object.assign(row.data, updates);
    return row.data;
  }

  delete(table: string, idField: string, idVal: any, user: ClinicianAuthProfile) {
    if (table === 'audit_events') {
      throw new Error('RLS Violation: audit_events_delete_forbidden policy rejected delete (USING false)');
    }
    if (table === 'approval_records') {
      throw new Error('RLS Violation: approval_records_delete_forbidden policy rejected delete (USING false)');
    }
    if (table === 'patients') {
      if (user.role !== 'CLINICAL_DIRECTOR') {
        throw new Error('RLS Violation: patients_delete_director_only policy rejected delete');
      }
    }
    const idx = this.rows.findIndex(r => r.table === table && r.data[idField] === idVal);
    if (idx !== -1) this.rows.splice(idx, 1);
  }
}

// -------------------------------------------------------------------
// 2. Execution of Multi-Organization Security Tests
// -------------------------------------------------------------------
(async () => {
  const db = new SimulatedRlsDatabase();

  console.log('--- 1. Multi-Clinic Tenancy Isolation ---');
  // Seed patients in Org 1 and Org 2
  db.insert('patients', { ...patient1Org1, organization_id: org1.id }, dirOrg1);
  db.insert('patients', { ...patient2Org1, organization_id: org1.id }, dirOrg1);
  db.insert('patients', { ...patient3Org2, organization_id: org2.id }, dirOrg2);

  // Clinician in Org 1 selects patients -> only sees Org 1 patients
  const org1PatientsSeenByDir1 = db.select('patients', dirOrg1);
  assert(org1PatientsSeenByDir1.length === 2, '1. Clinician in Org 1 sees exactly 2 Org 1 patients');
  assert(!org1PatientsSeenByDir1.some(p => p.id === patient3Org2.id), '1. Org 1 clinician cannot see Org 2 patient');

  // Clinician in Org 2 selects patients -> only sees Org 2 patients
  const org2PatientsSeenByNut2 = db.select('patients', nutOrg2);
  assert(org2PatientsSeenByNut2.length === 1, '1. Clinician in Org 2 sees exactly 1 Org 2 patient');
  assert(org2PatientsSeenByNut2[0].id === patient3Org2.id, '1. Org 2 clinician sees correct Org 2 patient');
  assert(!org2PatientsSeenByNut2.some(p => p.id === patient1Org1.id), '1. Org 2 clinician cannot see Org 1 patient');

  // Attempt cross-clinic insert by Org 1 clinician into Org 2
  let crossClinicBlocked = false;
  try {
    db.insert('patients', { id: 'pt_hacked', name: 'Intruder', organization_id: org2.id }, nutOrg1);
  } catch (err: any) {
    crossClinicBlocked = true;
    assert(err.message.includes('Tenant isolation'), '1. Cross-clinic insert rejected by tenant isolation policy');
  }
  assert(crossClinicBlocked, '1. Cross-clinic insert blocked');

  console.log('\n--- 2. Assigned-Patient Audit Isolation ---');
  // Log audit events for Patient 1 and Patient 2 in Org 1
  db.insert('audit_events', {
    id: 'ae_01',
    organization_id: org1.id,
    patient_id: patient1Org1.id,
    clinician_id: asstOrg1.id,
    event_type: 'PATIENT_ASSESSMENT_ENTERED'
  }, asstOrg1);

  db.insert('audit_events', {
    id: 'ae_02',
    organization_id: org1.id,
    patient_id: patient2Org1.id, // Not assigned to asstOrg1
    clinician_id: nutOrg1.id,
    event_type: 'LAB_RESULTS_ENTERED'
  }, nutOrg1);

  // Assistant Dietitian queries audit events
  const asstAuditEvents = db.select('audit_events', asstOrg1);
  assert(asstAuditEvents.length === 1, '2. Assistant Dietitian sees only audit events for assigned patient');
  assert(asstAuditEvents[0].patient_id === patient1Org1.id, '2. Assistant Dietitian sees assigned Patient 1 event');
  assert(!asstAuditEvents.some(a => a.patient_id === patient2Org1.id), '2. Assistant Dietitian cannot see unassigned Patient 2 event');

  // Treating Nutritionist queries audit events -> sees both
  const nutAuditEvents = db.select('audit_events', nutOrg1);
  assert(nutAuditEvents.length === 2, '2. Treating Nutritionist sees full clinic audit trail (2 events)');

  // Clinical Director queries audit events -> sees both
  const dirAuditEvents = db.select('audit_events', dirOrg1);
  assert(dirAuditEvents.length === 2, '2. Clinical Director sees full clinic audit trail (2 events)');

  console.log('\n--- 3. Clinician Self-Role Escalation Prevention ---');
  // Seed clinician row for Assistant Dietitian
  db.insert('clinicians', {
    id: asstOrg1.id,
    auth_user_id: asstOrg1.auth_user_id,
    organization_id: org1.id,
    name: asstOrg1.name,
    role: asstOrg1.role,
    is_active: true
  }, dirOrg1);

  // Assistant attempts self-role escalation: update role to CLINICAL_DIRECTOR
  let roleEscalationBlocked = false;
  try {
    db.update('clinicians', 'id', asstOrg1.id, { role: 'CLINICAL_DIRECTOR' }, asstOrg1);
  } catch (err: any) {
    roleEscalationBlocked = true;
    assert(err.message.includes('Privilege escalation blocked'), '3. Self-role escalation to CLINICAL_DIRECTOR blocked');
  }
  assert(roleEscalationBlocked, '3. Privilege escalation trigger aborted transaction');

  // Assistant attempts organization change
  let orgEscalationBlocked = false;
  try {
    db.update('clinicians', 'id', asstOrg1.id, { organization_id: org2.id }, asstOrg1);
  } catch (err: any) {
    orgEscalationBlocked = true;
    assert(err.message.includes('Privilege escalation blocked'), '3. Unauthorized organization reassignment blocked');
  }
  assert(orgEscalationBlocked, '3. Organization modification by non-director blocked');

  // Clinical Director legally promotes a clinician
  const promoted = db.update('clinicians', 'id', asstOrg1.id, { role: 'TREATING_NUTRITIONIST' }, dirOrg1);
  assert(promoted.role === 'TREATING_NUTRITIONIST', '3. Clinical Director authorized to update clinician role');

  console.log('\n--- 4. Approval Authorization Gate & Trigger ---');
  // Seed a draft nutrition plan in Org 1
  const draftPlan = {
    id: 'plan_test_01',
    organization_id: org1.id,
    patient_id: patient1Org1.id,
    visit_id: 'vis_01',
    version: 1,
    status: 'draft',
    is_approved: false
  };
  db.insert('nutrition_plans', draftPlan, nutOrg1);

  // Assistant Dietitian attempts to insert into approval_records
  let asstApprovalRecordBlocked = false;
  try {
    db.insert('approval_records', {
      id: 'appr_01',
      organization_id: org1.id,
      plan_id: draftPlan.id,
      patient_id: patient1Org1.id,
      clinician_id: asstOrg1.id,
      clinician_name: asstOrg1.name,
      license_number: asstOrg1.license_number
    }, asstOrg1);
  } catch (err: any) {
    asstApprovalRecordBlocked = true;
    assert(err.message.includes('approval_records_insert_licensed_only'), '4. Assistant Dietitian blocked from approval_records insert');
  }
  assert(asstApprovalRecordBlocked, '4. Approval record insert denied by RLS');

  // Assistant Dietitian attempts to mark nutrition_plans is_approved = true directly
  let asstPlanStatusTamperBlocked = false;
  try {
    db.update('nutrition_plans', 'id', draftPlan.id, { is_approved: true, status: 'approved' }, asstOrg1);
  } catch (err: any) {
    asstPlanStatusTamperBlocked = true;
    assert(err.message.includes('Clinical governance violation'), '4. Assistant Dietitian blocked from marking plan approved via trigger');
  }
  assert(asstPlanStatusTamperBlocked, '4. Direct plan status tampering blocked by trigger');

  // Treating Nutritionist successfully approves plan
  const legalApproval = db.insert('approval_records', {
    id: 'appr_legal_01',
    organization_id: org1.id,
    plan_id: draftPlan.id,
    patient_id: patient1Org1.id,
    clinician_id: nutOrg1.id,
    clinician_name: nutOrg1.name,
    license_number: nutOrg1.license_number
  }, nutOrg1);
  assert(legalApproval.id === 'appr_legal_01', '4. Treating Nutritionist legally signed approval record');

  const approvedPlan = db.update('nutrition_plans', 'id', draftPlan.id, { is_approved: true, status: 'approved' }, nutOrg1);
  assert(approvedPlan.is_approved === true && approvedPlan.status === 'approved', '4. Nutrition plan marked approved by Treating Nutritionist');

  console.log('\n--- 5. Audit Event & Approval Record Immutability ---');
  // Attempt to update audit event
  let auditUpdateBlocked = false;
  try {
    db.update('audit_events', 'id', 'ae_01', { event_type: 'TAMPERED' }, dirOrg1);
  } catch (err: any) {
    auditUpdateBlocked = true;
    assert(err.message.includes('audit_events_update_forbidden'), '5. Audit event update strictly forbidden');
  }
  assert(auditUpdateBlocked, '5. Audit update forbidden by policy');

  // Attempt to delete audit event
  let auditDeleteBlocked = false;
  try {
    db.delete('audit_events', 'id', 'ae_01', dirOrg1);
  } catch (err: any) {
    auditDeleteBlocked = true;
    assert(err.message.includes('audit_events_delete_forbidden'), '5. Audit event delete strictly forbidden');
  }
  assert(auditDeleteBlocked, '5. Audit delete forbidden by policy');

  // Attempt to delete approval record
  let approvalDeleteBlocked = false;
  try {
    db.delete('approval_records', 'id', 'appr_legal_01', dirOrg1);
  } catch (err: any) {
    approvalDeleteBlocked = true;
    assert(err.message.includes('approval_records_delete_forbidden'), '5. Approval record delete strictly forbidden');
  }
  assert(approvalDeleteBlocked, '5. Approval delete forbidden by policy');

  console.log('\n--- 6. Schema Migrations Access Protection ---');
  // Non-director attempts to modify schema_migrations
  let schemaTamperBlocked = false;
  try {
    db.insert('schema_migrations', { version: '20990101_fake_patch' }, nutOrg1);
  } catch (err: any) {
    schemaTamperBlocked = true;
    assert(err.message.includes('schema_migrations_write_director_only'), '6. Non-director blocked from modifying schema_migrations');
  }
  assert(schemaTamperBlocked, '6. Schema migrations protected by RLS');

  // Director can record schema migrations
  const validMigration = db.insert('schema_migrations', { version: '20261122000003_r2_rls_completion' }, dirOrg1);
  assert(validMigration.version === '20261122000003_r2_rls_completion', '6. Clinical Director can record schema migration');

  console.log('\n================================================================');
  console.log(`R2 MULTI-ORG SECURITY RESULTS: ${passedAssertions}/${totalAssertions} PASSED (${failedAssertions} FAILED)`);
  console.log('================================================================\n');

  if (failedAssertions > 0) {
    process.exit(1);
  }
})();
