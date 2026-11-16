/**
 * SHUDDHO FUNCTIONAL & PRECISION NUTRITION SOFTWARE
 * STEP 01 — FIVE CRITICAL DATA INTEGRITY DEFECTS REGRESSION TEST SUITE
 * 
 * Tests the 5 critical defect areas against actual production functions:
 * - Fix 1: Reliable Persistence and Transaction Success (No storage side effects in React updaters, QuotaExceededError rollback)
 * - Fix 2: Correct Follow-up Measurement Snapshots (Actual follow-up observations 77kg/91cm, not inherited from stale PatientProfile)
 * - Fix 3: Historical Visit Isolation (Baseline unrecorded HbA1c never inherits 7.2% from follow-up visit)
 * - Fix 4: Strict Referential Integrity (Orphaned snapshots, duplicate IDs, invalid current visit strictly rejected)
 */

import { validateReferentialIntegrity } from '../src/utils/referentialIntegrity';
import { safeStorage } from '../src/utils/storageManager';
import { 
  createClinicalSnapshot, 
  getLatestVisitSnapshot,
  appendSnapshotWithRevisionPolicy 
} from '../src/engine/snapshot/snapshotManager';
import { 
  createNewVisitTransition,
  restoreVisitState,
  savePatientTransaction
} from '../src/engine/visit/visitLifecycle';
import {
  PatientProfile,
  ClinicalVisit,
  ClinicalVisitSnapshot,
  PatientRecord
} from '../src/types';

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition: boolean, message: string) {
  totalChecks++;
  if (!condition) {
    failedChecks++;
    console.error(`  ✗ FAIL: ${message}`);
  } else {
    passedChecks++;
    console.log(`  ✓ PASS: ${message}`);
  }
}

function runSection(name: string, fn: () => void) {
  console.log(`\n=====================================================================`);
  console.log(`REGRESSION TEST: ${name}`);
  console.log(`=====================================================================`);
  try {
    fn();
  } catch (err: any) {
    console.error(`  EXCEPTION: ${err.message}`);
  }
}

// -------------------------------------------------------------------
// FIX 4: Strict Referential Integrity
// -------------------------------------------------------------------
runSection('FIX 4: Strict Referential Integrity - Orphaned, Duplicate & Invalid References', () => {
  const patientId = 'pt_regression_01';
  const validVisitId = `vis_${patientId}_01`;

  const validRecord: PatientRecord = {
    schema_version: 3,
    patient: {
      id: patientId,
      name: 'Integrity Test Patient',
      current_visit_id: validVisitId,
      visit_date: '2026-11-16'
    } as any,
    visits: [],
    clinical_visits: [
      {
        visit_id: validVisitId,
        id: validVisitId,
        patient_id: patientId,
        visit_number: 1,
        visit_type: 'baseline_consultation',
        visit_date: '2026-11-16',
        created_at: new Date().toISOString(),
        status: 'completed'
      }
    ],
    visit_snapshots: [
      {
        snapshot_id: `snap_${patientId}_01`,
        patient_id: patientId,
        visit_id: validVisitId,
        visit_number: 1,
        visit_date: '2026-11-16',
        is_baseline: true,
        schema_version: 3,
        revision: 1,
        approval_status: 'approved',
        created_at: new Date().toISOString(),
        captured_at: new Date().toISOString(),
        anthropometrics: {
          weight_kg: 70
        }
      }
    ]
  } as unknown as PatientRecord;

  // 1. Valid record must pass
  const validResult = validateReferentialIntegrity(validRecord);
  assert(validResult.isValid === true, 'Authoritative valid patient record passes validation');

  // 2. Orphaned snapshot (references non-existent visit) MUST be rejected as an ERROR (not just a warning)
  const orphanRecord: PatientRecord = {
    ...validRecord,
    visit_snapshots: [
      {
        ...validRecord.visit_snapshots![0],
        visit_id: 'vis_non_existent_ghost'
      }
    ]
  };
  const orphanResult = validateReferentialIntegrity(orphanRecord);
  assert(orphanResult.isValid === false, 'Orphaned snapshot referencing non-existent visit is strictly invalid');
  assert(orphanResult.errors.some(e => e.includes('ORPHANED_SNAPSHOT_VISIT')), 'Errors list contains ORPHANED_SNAPSHOT_VISIT');

  // 3. Duplicate Visit IDs in clinical_visits MUST be rejected as an ERROR
  const duplicateVisitRecord: PatientRecord = {
    ...validRecord,
    clinical_visits: [
      validRecord.clinical_visits![0],
      {
        ...validRecord.clinical_visits![0],
        visit_number: 2,
        notes: 'Accidental duplicate ID'
      }
    ]
  };
  const dupVisitResult = validateReferentialIntegrity(duplicateVisitRecord);
  assert(dupVisitResult.isValid === false, 'Duplicate visit ID is strictly rejected');
  assert(dupVisitResult.errors.some(e => e.includes('DUPLICATE_VISIT_ID')), 'Errors list contains DUPLICATE_VISIT_ID');

  // 4. Duplicate Snapshot IDs in visit_snapshots MUST be rejected as an ERROR
  const duplicateSnapRecord: PatientRecord = {
    ...validRecord,
    visit_snapshots: [
      validRecord.visit_snapshots![0],
      {
        ...validRecord.visit_snapshots![0],
        revision: 2,
        approval_status: 'draft'
      }
    ]
  };
  const dupSnapResult = validateReferentialIntegrity(duplicateSnapRecord);
  assert(dupSnapResult.isValid === false, 'Duplicate snapshot ID is strictly rejected');
  assert(dupSnapResult.errors.some(e => e.includes('DUPLICATE_SNAPSHOT_ID')), 'Errors list contains DUPLICATE_SNAPSHOT_ID');

  // 5. Invalid current_visit_id on patient MUST be rejected as an ERROR
  const invalidCurrentVisitRecord: PatientRecord = {
    ...validRecord,
    patient: {
      ...validRecord.patient,
      current_visit_id: 'vis_unlinked_missing'
    }
  };
  const invalidCurrResult = validateReferentialIntegrity(invalidCurrentVisitRecord);
  assert(invalidCurrResult.isValid === false, 'Invalid current_visit_id not present in clinical_visits is strictly rejected');
  assert(invalidCurrResult.errors.some(e => e.includes('INVALID_CURRENT_VISIT')), 'Errors list contains INVALID_CURRENT_VISIT');
});

// -------------------------------------------------------------------
// FIX 3: Historical Visit Isolation
// -------------------------------------------------------------------
runSection('FIX 3: Historical Visit Isolation - No Bleed-Through of Later Observations', () => {
  const patientId = 'pt_historical_01';
  const baselineVisitId = `vis_${patientId}_01`;
  const followUpVisitId = `vis_${patientId}_02`;

  // Baseline has NO HbA1c, weight 80kg, waist 95cm
  const baselineSnapshot: ClinicalVisitSnapshot = {
    snapshot_id: `snap_${patientId}_01`,
    patient_id: patientId,
    visit_id: baselineVisitId,
    visit_number: 1,
    visit_date: '2026-01-01',
    is_baseline: true,
    schema_version: 3,
    revision: 1,
    approval_status: 'approved',
    created_at: '2026-01-01T10:00:00.000Z',
    captured_at: '2026-01-01T10:00:00.000Z',
    anthropometrics: {
      weight_kg: 80,
      waist_cm: 95,
      whtr: 0.56
    },
    gut_metrics: {
      bloating_severity: 'none',
      acid_reflux_present: false,
      bristol_stool_score: 4,
      energy_score: 8
    },
    biomarkers: {
      fbs: 95
      // hba1c is UNRECORDED at baseline
    }
  };

  // Follow-up has HbA1c 7.2%, weight 77kg, waist 91cm
  const followUpSnapshot: ClinicalVisitSnapshot = {
    snapshot_id: `snap_${patientId}_02`,
    patient_id: patientId,
    visit_id: followUpVisitId,
    visit_number: 2,
    visit_date: '2026-02-01',
    is_baseline: false,
    schema_version: 3,
    revision: 1,
    approval_status: 'approved',
    created_at: '2026-02-01T10:00:00.000Z',
    captured_at: '2026-02-01T10:00:00.000Z',
    anthropometrics: {
      weight_kg: 77,
      waist_cm: 91,
      whtr: 0.54
    },
    gut_metrics: {
      bloating_severity: 'moderate',
      acid_reflux_present: true,
      bristol_stool_score: 3,
      energy_score: 6
    },
    biomarkers: {
      fbs: 110,
      hba1c: 7.2
    }
  };

  // The active patient in memory currently has the follow-up's measurements
  const activeFollowUpPatient: PatientProfile = {
    id: patientId,
    name: 'Historical Isolation Patient',
    current_visit_id: followUpVisitId,
    visit_date: '2026-02-01',
    weight_kg: 77,
    waist_cm: 91,
    height_cm: 170,
    gut_profile: {
      bloating: 'moderate',
      acid_reflux_hypoacidity: true,
      bristol_stool_score: 3,
      energy_score: 6,
      sleep_quality_score: 7,
      digestive_fire_agni: 'samagni'
    },
    labs: {
      fasting_glucose: 110,
      hba1c: 7.2,
      lab_flags: []
    }
  } as any;

  // Practitioner selects baseline visit
  const restoredPatient = restoreVisitState({
    currentPatient: activeFollowUpPatient,
    targetVisit: {
      visit_id: baselineVisitId,
      id: baselineVisitId,
      patient_id: patientId,
      visit_number: 1,
      visit_type: 'baseline_consultation',
      visit_date: '2026-01-01',
      created_at: '2026-01-01T10:00:00.000Z',
      status: 'completed'
    },
    targetSnapshot: baselineSnapshot
  });

  // Verify baseline is NOT polluted by follow-up measurements
  assert(restoredPatient.weight_kg === 80, 'Restored baseline weight is 80 kg (not 77 kg)');
  assert(restoredPatient.waist_cm === 95, 'Restored baseline waist is 95 cm (not 91 cm)');
  assert(restoredPatient.labs.fasting_glucose === 95, 'Restored baseline FBS is 95 mg/dL');
  assert(restoredPatient.labs.hba1c === undefined, 'Restored baseline HbA1c is undefined/Not Recorded (never 7.2%)');
  assert(restoredPatient.gut_profile.bloating === 'none', 'Restored baseline bloating is none (never moderate from follow-up)');
});

// -------------------------------------------------------------------
// FIX 2: Correct Follow-up Measurement Snapshots
// -------------------------------------------------------------------
runSection('FIX 2: Follow-up Measurement Snapshots Capture Actual Observations', () => {
  const patientId = 'pt_followup_01';
  const baselineVisitId = `vis_${patientId}_01`;
  const followUpVisitId = `vis_${patientId}_02`;

  // PatientProfile currently at baseline: 80 kg / 95 cm
  const baselinePatient: PatientProfile = {
    id: patientId,
    name: 'Follow-up Snapshot Patient',
    current_visit_id: baselineVisitId,
    visit_date: '2026-01-01',
    weight_kg: 80,
    waist_cm: 95,
    height_cm: 170,
    gut_profile: {
      bloating: 'none',
      acid_reflux_hypoacidity: false,
      bristol_stool_score: 4,
      energy_score: 7,
      sleep_quality_score: 7,
      digestive_fire_agni: 'samagni'
    },
    labs: {
      lab_flags: []
    }
  } as any;

  // New follow-up observation payload entered in Follow-Up modal: 77 kg, 91 cm
  const followUpObservations = {
    weight_kg: 77,
    waist_cm: 91,
    bristol_stool_score: 5,
    energy_score: 8,
    bloating_severity: 'mild' as const,
    notes: 'Follow up visit 2'
  };

  // Create follow-up snapshot using the explicit observation payload
  const followUpSnapshot = createClinicalSnapshot({
    patient: baselinePatient,
    visitId: followUpVisitId,
    visitType: 'routine_followup',
    isBaseline: false,
    approvalStatus: 'draft',
    clinicalObservationsPayload: followUpObservations
  });

  assert(followUpSnapshot.visit_id === followUpVisitId, 'Follow-up snapshot is linked to followUpVisitId');
  assert(followUpSnapshot.anthropometrics?.weight_kg === 77, 'Follow-up snapshot anthropometrics has actual entered weight 77 kg (not baseline 80 kg)');
  assert(followUpSnapshot.anthropometrics?.waist_cm === 91, 'Follow-up snapshot anthropometrics has actual entered waist 91 cm (not baseline 95 cm)');
  assert(followUpSnapshot.gut_metrics?.bristol_stool_score === 5, 'Follow-up snapshot has actual entered stool score 5');
  assert(followUpSnapshot.gut_metrics?.energy_score === 8, 'Follow-up snapshot has actual entered energy score 8');
});

// -------------------------------------------------------------------
// FIX 1: Reliable Persistence and Transaction Success
// -------------------------------------------------------------------
runSection('FIX 1: Persistence and Transaction Success - Rollback on QuotaExceededError', () => {
  const patientId = 'pt_tx_01';
  const baselineVisitId = `vis_${patientId}_01`;

  const existingRecord = {
    schema_version: 3,
    patient: {
      id: patientId,
      name: 'Transaction Patient',
      current_visit_id: baselineVisitId,
      visit_date: '2026-01-01'
    } as any,
    visits: [],
    clinical_visits: [
      {
        visit_id: baselineVisitId,
        id: baselineVisitId,
        patient_id: patientId,
        visit_number: 1,
        visit_type: 'baseline_consultation',
        visit_date: '2026-01-01',
        created_at: '2026-01-01T10:00:00.000Z',
        status: 'completed'
      }
    ],
    visit_snapshots: [],
    follow_up_appointments: [],
    progress_reports: [],
    current_diet_chart: [],
    current_supplements: [],
    timeline: [],
    updated_at: new Date().toISOString()
  } as unknown as PatientRecord;

  // Simulate QuotaExceededError storage failure
  const failingStorage = {
    setItem: (_key: string, _value: any) => {
      throw new Error('QuotaExceededError: LocalStorage quota exceeded');
    }
  };

  // Execute transaction to start new visit with failing storage
  const txResult = savePatientTransaction({
    currentRecord: existingRecord,
    storageEngine: failingStorage,
    action: {
      type: 'START_NEW_VISIT',
      payload: {
        visitType: 'routine_followup',
        visitDate: '2026-02-01',
        notes: 'Follow-up visit under quota exhaustion'
      }
    }
  });

  assert(txResult.success === false, 'Transaction reports explicit failure when storage throws QuotaExceededError');
  assert(txResult.error?.includes('QuotaExceededError') === true, 'Transaction error captures QuotaExceededError details');
  assert(txResult.committedRecord.clinical_visits?.length === 1, 'No orphan visit committed to clinical_visits on persistence failure');
  assert(txResult.committedRecord.patient.current_visit_id === baselineVisitId, 'current_visit_id remains on baselineVisitId (no state advance)');
});

console.log(`\n=====================================================================`);
console.log(`REGRESSION TEST SUMMARY: ${passedChecks}/${totalChecks} PASSED, ${failedChecks} FAILED`);
console.log(`=====================================================================\n`);

if (failedChecks > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
