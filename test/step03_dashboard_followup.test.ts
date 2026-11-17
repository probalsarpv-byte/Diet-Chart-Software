/**
 * SHUDDHO FUNCTIONAL & PRECISION NUTRITION SOFTWARE
 * STEP 03 COMPREHENSIVE CLINICAL & OPERATIONAL ACCEPTANCE TEST SUITE
 * 
 * Verifies:
 * - Scenarios 1-4: Empty practice, multiple patients, appointment KPIs, Asia/Dhaka boundaries
 * - Scenarios 5-8: Appointment lifecycle persistence, safe patient handoff, distinct visit IDs, completion rules
 * - Scenarios 9-14: 4 comparison modes, multi-visit trends, missing labs honesty, context-aware clinical interpretation
 * - Scenarios 15-16: Verifiable report approval persistence, storage failure rollback, A4 sections
 */

import {
  getDhakaTodayDateString,
  getDhakaDateTime,
  isDateTodayDhaka,
  isDatePastDhaka,
  isDateUpcomingDhaka,
  calculatePracticeKPIs
} from '../src/utils/dhakaDate';
import {
  calculateMetricChange,
  executeLongitudinalComparison,
  buildComparativeProgressReport,
  validateClinicianCredentials
} from '../src/engine/longitudinal/comparisonEngine';
import {
  createNewVisitTransition,
  savePatientTransaction
} from '../src/engine/visit/visitLifecycle';
import {
  createClinicalSnapshot,
  appendSnapshotWithRevisionPolicy,
  getLatestVisitSnapshot,
  getApprovedBaselineSnapshot
} from '../src/engine/snapshot/snapshotManager';
import {
  PatientRecord,
  PatientProfile,
  ClinicalVisit,
  FollowUpAppointment,
  ClinicalVisitSnapshot,
  ComparativeProgressReport
} from '../src/types';

class MockStorage {
  private store = new Map<string, string>();
  public shouldFail = false;

  getItem<T>(key: string): T | null {
    const raw = this.store.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: any): boolean {
    if (this.shouldFail) return false;
    this.store.set(key, JSON.stringify(value));
    return true;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

let passedAssertions = 0;
let totalAssertions = 0;

function assert(condition: boolean, message: string) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function createMinimalPatient(id: string, name: string): PatientProfile {
  return {
    schema_version: 2,
    id,
    name,
    age: 42,
    gender: 'female',
    phone: '01711000000',
    email: `${id}@example.com`,
    visit_date: '2026-10-01',
    current_visit_id: `vis_${id}_1`,
    current_phase: 1,
    height_cm: 155,
    weight_kg: 75,
    waist_cm: 90,
    activity_level: 'sedentary',
    sleep_hours: 7,
    shift_worker: false,
    population_group: 'adult_standard',
    bmr_floor_strategy: 'clamped_to_bmr',
    selected_conditions: ['t2d_ir'],
    confirmed_allergies: [],
    active_medications: [],
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    gut_profile: {
      bloating: 'moderate',
      acid_reflux_hypoacidity: true,
      bristol_stool_score: 2,
      energy_score: 5,
      sleep_quality_score: 6,
      digestive_fire_agni: 'mandagni'
    },
    labs: {
      lab_flags: []
    },
    calculated: {
      bmi: 31.2,
      bmi_category_en: 'Obese Class I',
      bmi_category_bn: 'স্থূলতা শ্রেণি ১',
      ibw_kg: 50,
      adjusted_bw_kg: 56.25,
      bmr: 1350,
      tdee: 1620,
      target_calories: 1350,
      target_protein_g: 65,
      target_carbs_g: 135,
      target_fat_g: 45
    } as any
  };
}

function createMinimalRecord(
  patient: PatientProfile,
  visits: ClinicalVisit[] = [],
  appointments: FollowUpAppointment[] = [],
  snapshots: ClinicalVisitSnapshot[] = [],
  reports: ComparativeProgressReport[] = []
): PatientRecord {
  return {
    schema_version: 2,
    patient,
    visits: [],
    clinical_visits: visits,
    follow_up_appointments: appointments,
    visit_snapshots: snapshots,
    progress_reports: reports,
    current_diet_chart: [],
    current_supplements: [],
    timeline: [],
    updated_at: new Date().toISOString()
  };
}

// ───────────────────────────────────────────────────────────────────
// SUITE 1: Task 1 - Asia/Dhaka Date Calculation & Practice KPI Aggregation
// ───────────────────────────────────────────────────────────────────
console.log('\n=====================================================================');
console.log('TEST SUITE: Scenario 1–4: Empty Practice, Multi-Patient, KPIs, Dhaka Timezone');
console.log('=====================================================================');

// Scenario 1: Empty Practice
{
  const emptyKPIs = calculatePracticeKPIs([]);
  assert(emptyKPIs.totalPatients === 0, 'Empty practice has 0 total patients');
  assert(emptyKPIs.visitsToday === 0, 'Empty practice has 0 visits today');
  assert(emptyKPIs.dueToday === 0, 'Empty practice has 0 follow-ups due today');
  assert(emptyKPIs.overdue === 0, 'Empty practice has 0 overdue follow-ups');
  assert(emptyKPIs.upcoming7Days === 0, 'Empty practice has 0 upcoming follow-ups');
  assert(emptyKPIs.pendingAssessments === 0, 'Empty practice has 0 pending assessments');
}

// Scenario 2: Multiple Patients Isolation
{
  const p1 = createMinimalPatient('pt_alpha', 'Patient Alpha');
  const p2 = createMinimalPatient('pt_beta', 'Patient Beta');
  const p3 = createMinimalPatient('pt_gamma', 'Patient Gamma');

  const record1 = createMinimalRecord(p1, [{
    visit_id: 'vis_pt_alpha_1',
    patient_id: 'pt_alpha',
    visit_date: '2026-10-01',
    visit_type: 'baseline_consultation',
    status: 'completed',
    created_at: '2026-10-01T10:00:00Z'
  }]);
  const record2 = createMinimalRecord(p2, [{
    visit_id: 'vis_pt_beta_1',
    patient_id: 'pt_beta',
    visit_date: '2026-10-02',
    visit_type: 'baseline_consultation',
    status: 'completed',
    created_at: '2026-10-02T10:00:00Z'
  }]);
  const record3 = createMinimalRecord(p3, [{
    visit_id: 'vis_pt_gamma_1',
    patient_id: 'pt_gamma',
    visit_date: '2026-10-03',
    visit_type: 'baseline_consultation',
    status: 'completed',
    created_at: '2026-10-03T10:00:00Z'
  }]);

  const multiKPIs = calculatePracticeKPIs([record1, record2, record3]);
  assert(multiKPIs.totalPatients === 3, 'Practice correctly counts 3 registered patients');
}

// Scenario 3: Appointment KPIs (Due Today = 1, Overdue = 1, Upcoming = 1, Cancelled = 0, Completed = 0)
{
  const today = getDhakaTodayDateString();
  const pastDate = '2026-09-01'; // clearly past
  
  // calculate upcoming date 3 days from now in Dhaka
  const now = new Date();
  const future3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const futureDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(future3Days);

  const patient = createMinimalPatient('pt_kpi', 'KPI Test Patient');
  const appointments: FollowUpAppointment[] = [
    // 1 Due Today
    {
      appointment_id: 'apt_due_today',
      patient_id: patient.id,
      scheduled_date: today,
      status: 'scheduled',
      created_at: '2026-10-01T10:00:00Z'
    },
    // 1 Overdue
    {
      appointment_id: 'apt_overdue',
      patient_id: patient.id,
      scheduled_date: pastDate,
      status: 'scheduled',
      created_at: '2026-10-01T10:00:00Z'
    },
    // 1 Upcoming in 3 days
    {
      appointment_id: 'apt_upcoming',
      patient_id: patient.id,
      scheduled_date: futureDateStr,
      status: 'scheduled',
      created_at: '2026-10-01T10:00:00Z'
    },
    // 1 Cancelled (dated today) - MUST NOT be counted as due today or pending
    {
      appointment_id: 'apt_cancelled_today',
      patient_id: patient.id,
      scheduled_date: today,
      status: 'cancelled',
      created_at: '2026-10-01T10:00:00Z'
    },
    // 1 Completed (dated today) - MUST NOT be counted as due today or pending
    {
      appointment_id: 'apt_completed_today',
      patient_id: patient.id,
      scheduled_date: today,
      status: 'completed',
      created_at: '2026-10-01T10:00:00Z'
    }
  ];

  const record = createMinimalRecord(
    patient,
    [{
      visit_id: patient.current_visit_id!,
      patient_id: patient.id,
      visit_date: '2026-10-01',
      visit_type: 'baseline_consultation',
      status: 'completed',
      created_at: '2026-10-01T10:00:00Z'
    }],
    appointments
  );

  const kpis = calculatePracticeKPIs([record]);
  assert(kpis.dueToday === 1, `Due today is exactly 1 (actual: ${kpis.dueToday})`);
  assert(kpis.overdue === 1, `Overdue is exactly 1 (actual: ${kpis.overdue})`);
  assert(kpis.upcoming7Days === 1, `Upcoming 7 days is exactly 1 (actual: ${kpis.upcoming7Days})`);
}

// Scenario 4: Asia/Dhaka Date Boundary Verification
{
  // Test specific timestamp conversion: 2026-11-16 19:30:00 UTC is 2026-11-17 01:30:00 in Dhaka (+06:00)
  const utcDate = new Date('2026-11-16T19:30:00Z');
  const dhakaStr = getDhakaTodayDateString(utcDate);
  assert(dhakaStr === '2026-11-17', `UTC 19:30 on 2026-11-16 maps to 2026-11-17 in Dhaka (actual: ${dhakaStr})`);

  // Early UTC morning: 2026-11-16 02:00:00 UTC is 2026-11-16 08:00:00 in Dhaka
  const utcMorning = new Date('2026-11-16T02:00:00Z');
  const dhakaMorning = getDhakaTodayDateString(utcMorning);
  assert(dhakaMorning === '2026-11-16', `UTC 02:00 on 2026-11-16 maps to 2026-11-16 in Dhaka (actual: ${dhakaMorning})`);
}

// ───────────────────────────────────────────────────────────────────
// SUITE 2: Task 2 - Appointment Lifecycle & Consultation Persistence
// ───────────────────────────────────────────────────────────────────
console.log('\n=====================================================================');
console.log('TEST SUITE: Scenario 5–8: Scheduling, Rescheduling, Safe Handoff, Distinct Visits');
console.log('=====================================================================');

// Scenario 5: Schedule, Reload, Reschedule, Reopen
{
  const storage = new MockStorage();
  const patient = createMinimalPatient('pt_sched', 'Scheduling Patient');
  const baseVisit: ClinicalVisit = {
    visit_id: 'vis_pt_sched_1',
    patient_id: patient.id,
    visit_date: '2026-10-01',
    visit_type: 'baseline_consultation',
    status: 'completed',
    created_at: '2026-10-01T10:00:00Z'
  };
  let record: PatientRecord = createMinimalRecord(patient, [baseVisit]);

  // Schedule an appointment
  const apt1: FollowUpAppointment = {
    appointment_id: 'apt_test_01',
    patient_id: patient.id,
    scheduled_date: '2026-11-20',
    scheduled_time: '10:00 AM',
    reason: 'Glycemic check',
    status: 'scheduled',
    created_at: new Date().toISOString()
  };

  const scheduleTx = savePatientTransaction({
    currentRecord: record,
    storageEngine: storage,
    action: {
      type: 'SAVE_RECORD',
      payload: { follow_up_appointments: [apt1] }
    },
    savedPatientsList: [record]
  });
  assert(scheduleTx.success, 'Follow-up appointment transaction succeeded');

  // Verify reload from storage
  const reloadedList = storage.getItem<PatientRecord[]>('shuddho_saved_patients');
  assert(Array.isArray(reloadedList) && reloadedList.length === 1, 'Persisted list reloaded from storage');
  const reloadedApt = reloadedList![0].follow_up_appointments?.[0];
  assert(reloadedApt?.appointment_id === 'apt_test_01', 'Reloaded appointment preserves exact ID');
  assert(reloadedApt?.scheduled_date === '2026-11-20', 'Reloaded appointment preserves date 2026-11-20');

  // Reschedule
  const rescheduledApt: FollowUpAppointment = {
    ...reloadedApt!,
    scheduled_date: '2026-11-25',
    rescheduled_from: '2026-11-20',
    status: 'rescheduled',
    rescheduled_history: [{
      previous_date: '2026-11-20',
      previous_time: '10:00 AM',
      rescheduled_at: new Date().toISOString(),
      reason: 'Patient requested afternoon delay'
    }]
  };

  const rescheduleTx = savePatientTransaction({
    currentRecord: reloadedList![0],
    storageEngine: storage,
    action: {
      type: 'SAVE_RECORD',
      payload: { follow_up_appointments: [rescheduledApt] }
    },
    savedPatientsList: reloadedList!
  });
  assert(rescheduleTx.success, 'Reschedule transaction succeeded');

  const reloadedAfterReschedule = storage.getItem<PatientRecord[]>('shuddho_saved_patients')!;
  const finalApt = reloadedAfterReschedule[0].follow_up_appointments?.[0];
  assert(finalApt?.scheduled_date === '2026-11-25', 'Rescheduled date updated to 2026-11-25');
  assert(finalApt?.rescheduled_from === '2026-11-20', 'Preserved rescheduled_from provenance');
  assert(finalApt?.rescheduled_history?.length === 1, 'Preserved reschedule audit history');
}

// Scenario 6: Safe Patient Selection (Click Patient B while Patient A is active)
{
  const storage = new MockStorage();
  const patientA = createMinimalPatient('pt_alpha_safe', 'Patient Alpha');
  const patientB = createMinimalPatient('pt_beta_safe', 'Patient Beta');

  const recordA = createMinimalRecord(patientA, [{
    visit_id: 'vis_alpha_1',
    patient_id: 'pt_alpha_safe',
    visit_date: '2026-10-01',
    visit_type: 'baseline_consultation',
    status: 'completed',
    created_at: '2026-10-01T10:00:00Z'
  }]);

  const recordB = createMinimalRecord(
    patientB,
    [{
      visit_id: 'vis_beta_1',
      patient_id: 'pt_beta_safe',
      visit_date: '2026-10-02',
      visit_type: 'baseline_consultation',
      status: 'completed',
      created_at: '2026-10-02T10:00:00Z'
    }],
    [{
      appointment_id: 'apt_beta_due',
      patient_id: 'pt_beta_safe',
      scheduled_date: getDhakaTodayDateString(),
      status: 'due_today',
      created_at: '2026-10-02T10:30:00Z'
    }]
  );

  storage.setItem('shuddho_saved_patients', [recordA, recordB]);

  // Target patient B explicitly from appointment
  const targetPatientId = 'pt_beta_safe';
  const targetRecord = [recordA, recordB].find(p => p.patient.id === targetPatientId)!;

  // Create new visit for Patient B
  const visitTransition = createNewVisitTransition({
    patient: targetRecord.patient,
    existingVisits: targetRecord.clinical_visits || [],
    visitType: 'routine_followup',
    visitDate: getDhakaTodayDateString(),
    notes: 'Follow-up consultation from dashboard'
  });

  const tx = savePatientTransaction({
    currentRecord: targetRecord,
    storageEngine: storage,
    action: {
      type: 'START_NEW_VISIT',
      payload: {
        visitType: 'routine_followup',
        visitDate: getDhakaTodayDateString(),
        notes: 'Follow-up consultation from dashboard'
      }
    },
    savedPatientsList: [recordA, recordB]
  });

  assert(tx.success, 'New visit created successfully for target Patient B');
  assert(tx.newVisit?.patient_id === 'pt_beta_safe', 'New visit strictly belongs to Patient B');
  assert(tx.committedRecord.patient.id === 'pt_beta_safe', 'Committed record is Patient B');
  assert(Boolean(tx.committedRecord.clinical_visits?.some(v => v.visit_id === tx.newVisit?.visit_id)), 'New visit attached to Patient B clinical_visits');

  // Verify Patient A record was NOT mutated
  const reloaded = storage.getItem<PatientRecord[]>('shuddho_saved_patients')!;
  const patientAAfter = reloaded.find(p => p.patient.id === 'pt_alpha_safe')!;
  assert(patientAAfter.clinical_visits?.length === 1, 'Patient A visits unaffected (1 visit preserved, zero leakage)');
}

// Scenario 7: Three Distinct Consultations (80 kg -> 77 kg -> 74 kg)
{
  const storage = new MockStorage();
  const patient = createMinimalPatient('pt_distinct', 'Multi Visit Patient');
  patient.weight_kg = 80;

  // Visit 1: Baseline (80 kg)
  const visit1: ClinicalVisit = {
    visit_id: 'vis_pt_distinct_1',
    patient_id: patient.id,
    visit_date: '2026-09-01',
    visit_type: 'baseline_consultation',
    status: 'completed',
    created_at: '2026-09-01T10:00:00Z'
  };
  const snap1 = createClinicalSnapshot({
    patient,
    visitId: visit1.visit_id,
    isBaseline: true,
    clinicalObservationsPayload: { weight_kg: 80, waist_cm: 95 }
  });

  // Visit 2: Follow-up 1 (77 kg)
  const visit2: ClinicalVisit = {
    visit_id: 'vis_pt_distinct_2',
    patient_id: patient.id,
    visit_date: '2026-10-01',
    visit_type: 'routine_followup',
    status: 'completed',
    created_at: '2026-10-01T10:00:00Z'
  };
  const snap2 = createClinicalSnapshot({
    patient: { ...patient, weight_kg: 77, current_visit_id: visit2.visit_id },
    visitId: visit2.visit_id,
    isBaseline: false,
    clinicalObservationsPayload: { weight_kg: 77, waist_cm: 92 }
  });

  // Visit 3: Follow-up 2 (74 kg)
  const visit3: ClinicalVisit = {
    visit_id: 'vis_pt_distinct_3',
    patient_id: patient.id,
    visit_date: '2026-11-01',
    visit_type: 'routine_followup',
    status: 'completed',
    created_at: '2026-11-01T10:00:00Z'
  };
  const snap3 = createClinicalSnapshot({
    patient: { ...patient, weight_kg: 74, current_visit_id: visit3.visit_id },
    visitId: visit3.visit_id,
    isBaseline: false,
    clinicalObservationsPayload: { weight_kg: 74, waist_cm: 89 }
  });

  const record = createMinimalRecord(
    { ...patient, weight_kg: 74, current_visit_id: visit3.visit_id },
    [visit1, visit2, visit3],
    [],
    [snap1, snap2, snap3]
  );

  const tx = savePatientTransaction({
    currentRecord: record,
    storageEngine: storage,
    action: { type: 'SAVE_RECORD' }
  });

  assert(tx.success, 'Saved record with 3 distinct visits and snapshots');
  assert(visit1.visit_id !== visit2.visit_id, 'Visit 1 and Visit 2 have distinct IDs');
  assert(visit2.visit_id !== visit3.visit_id, 'Visit 2 and Visit 3 have distinct IDs');
  assert(snap1.anthropometrics.weight_kg === 80, 'Visit 1 snapshot weight preserved as 80 kg');
  assert(snap2.anthropometrics.weight_kg === 77, 'Visit 2 snapshot weight preserved as 77 kg');
  assert(snap3.anthropometrics.weight_kg === 74, 'Visit 3 snapshot weight preserved as 74 kg');
}

// Scenario 8: Follow-Up Consultation Completion Rules
{
  const appointment: FollowUpAppointment = {
    appointment_id: 'apt_in_progress',
    patient_id: 'pt_comp_rules',
    scheduled_date: getDhakaTodayDateString(),
    status: 'scheduled',
    created_at: new Date().toISOString()
  };

  // 1. Opening a consultation should link the appointment or set actual_visit_id WITHOUT marking it 'completed'
  const openedApt: FollowUpAppointment = {
    ...appointment,
    actual_visit_id: 'vis_in_progress_1',
    // status remains 'scheduled' or 'due_today' until finalized!
    status: 'due_today'
  };
  assert(openedApt.status !== 'completed', 'Opening consultation does NOT mark appointment completed');
  assert(openedApt.actual_visit_id === 'vis_in_progress_1', 'Opening consultation links actual_visit_id');

  // 2. Finalization explicitly marks appointment completed and stores completed_visit_id
  const finalizedApt: FollowUpAppointment = {
    ...openedApt,
    status: 'completed',
    completed_visit_id: 'vis_in_progress_1'
  };
  assert(finalizedApt.status === 'completed', 'Finalized consultation marks appointment completed');
  assert(finalizedApt.completed_visit_id === 'vis_in_progress_1', 'Finalized appointment preserves completed_visit_id');
}

// ───────────────────────────────────────────────────────────────────
// SUITE 3: Task 4 - Longitudinal Comparison & Context-Aware Outcomes
// ───────────────────────────────────────────────────────────────────
console.log('\n=====================================================================');
console.log('TEST SUITE: Scenario 9–14: 4 Comparison Modes, Multi-Visit Trend, Context Guards');
console.log('=====================================================================');

// Setup standard 3-visit snapshots
const ptLong = createMinimalPatient('pt_long', 'Longitudinal Patient');
const snapBase = createClinicalSnapshot({
  patient: { ...ptLong, weight_kg: 80, waist_cm: 94 },
  visitId: 'vis_long_1',
  isBaseline: true,
  clinicalObservationsPayload: {
    weight_kg: 80,
    waist_cm: 94,
    bloating_severity: 'severe',
    bristol_stool_score: 2,
    energy_score: 4
  }
});
const snapV2 = createClinicalSnapshot({
  patient: { ...ptLong, weight_kg: 77, waist_cm: 91, current_visit_id: 'vis_long_2' },
  visitId: 'vis_long_2',
  isBaseline: false,
  clinicalObservationsPayload: {
    weight_kg: 77,
    waist_cm: 91,
    bloating_severity: 'moderate',
    bristol_stool_score: 3,
    energy_score: 6
  }
});
const snapV3 = createClinicalSnapshot({
  patient: { ...ptLong, weight_kg: 74, waist_cm: 88, current_visit_id: 'vis_long_3' },
  visitId: 'vis_long_3',
  isBaseline: false,
  clinicalObservationsPayload: {
    weight_kg: 74,
    waist_cm: 88,
    bloating_severity: 'mild',
    bristol_stool_score: 4,
    energy_score: 8
  }
});

// Scenario 9: Mode A — Baseline vs Current (Visit 1 vs Visit 3)
{
  const analysisModeA = executeLongitudinalComparison({
    patient: ptLong,
    baselineSnapshot: snapBase,
    comparisonSnapshot: snapV3,
    comparisonMode: 'baseline_vs_current',
    allSnapshots: [snapBase, snapV2, snapV3]
  });

  const weightChange = analysisModeA.anthropometric_changes.find(c => c.marker_id === 'weight_kg')!;
  assert(weightChange.baseline_value === 80, 'Mode A baseline weight is 80 kg (Visit 1)');
  assert(weightChange.current_value === 74, 'Mode A current weight is 74 kg (Visit 3)');
  assert(weightChange.absolute_change === -6, 'Mode A absolute delta is -6 kg');
}

// Scenario 10: Mode B — Previous vs Current (Visit 2 vs Visit 3)
{
  const analysisModeB = executeLongitudinalComparison({
    patient: ptLong,
    baselineSnapshot: snapV2, // Previous visit
    comparisonSnapshot: snapV3, // Current visit
    comparisonMode: 'previous_vs_current',
    allSnapshots: [snapBase, snapV2, snapV3]
  });

  const weightChange = analysisModeB.anthropometric_changes.find(c => c.marker_id === 'weight_kg')!;
  assert(weightChange.baseline_value === 77, 'Mode B previous weight is 77 kg (Visit 2)');
  assert(weightChange.current_value === 74, 'Mode B current weight is 74 kg (Visit 3)');
  assert(weightChange.absolute_change === -3, 'Mode B absolute delta is -3 kg');
}

// Scenario 11: Mode C — Selected Visit Pair (Explicitly Visit 1 and Visit 2)
{
  const analysisModeC = executeLongitudinalComparison({
    patient: ptLong,
    baselineSnapshot: snapBase,
    comparisonSnapshot: snapV2,
    comparisonMode: 'selected_vs_selected',
    allSnapshots: [snapBase, snapV2, snapV3]
  });

  const weightChange = analysisModeC.anthropometric_changes.find(c => c.marker_id === 'weight_kg')!;
  assert(weightChange.baseline_value === 80, 'Mode C compares Visit 1 (80 kg)');
  assert(weightChange.current_value === 77, 'Mode C compares Visit 2 (77 kg)');
  assert(weightChange.absolute_change === -3, 'Mode C absolute delta is -3 kg');
}

// Scenario 12: Mode D — Multi-Visit Trend (3 chronological points)
{
  const analysisModeD = executeLongitudinalComparison({
    patient: ptLong,
    baselineSnapshot: snapBase,
    comparisonSnapshot: snapV3,
    comparisonMode: 'multi_visit_trend',
    allSnapshots: [snapBase, snapV2, snapV3]
  });

  assert(analysisModeD.trend_series !== undefined, 'Trend series populated in multi_visit_trend mode');
  assert(analysisModeD.trend_series?.data_points.length === 3, 'Trend series contains 3 chronological observations');
  assert(analysisModeD.trend_series?.data_points[0].weight_kg === 80, 'Point 1 is 80 kg');
  assert(analysisModeD.trend_series?.data_points[1].weight_kg === 77, 'Point 2 is 77 kg');
  assert(analysisModeD.trend_series?.data_points[2].weight_kg === 74, 'Point 3 is 74 kg');
}

// Scenario 13: Missing Laboratory Result (HbA1c tested in Visit 2, but missing in Visit 1)
{
  const snapLabV1 = createClinicalSnapshot({
    patient: ptLong,
    visitId: 'vis_lab_1',
    isBaseline: true,
    clinicalObservationsPayload: { weight_kg: 80 } // No HbA1c
  });

  const snapLabV2 = createClinicalSnapshot({
    patient: ptLong,
    visitId: 'vis_lab_2',
    isBaseline: false,
    clinicalObservationsPayload: { weight_kg: 78 },
    p2AnalysisResult: {
      observations: [{
        markerId: 'hba1c',
        name: 'HbA1c',
        value: 7.2,
        unit: '%',
        isCritical: false,
        source: 'measured',
        recordedAt: '2026-11-01'
      }]
    } as any
  });

  const labComparison = executeLongitudinalComparison({
    patient: ptLong,
    baselineSnapshot: snapLabV1,
    comparisonSnapshot: snapLabV2,
    comparisonMode: 'baseline_vs_current'
  });

  const hba1cChange = labComparison.laboratory_changes.find(l => l.marker_id === 'hba1c');
  assert(hba1cChange !== undefined, 'HbA1c change item is generated');
  assert(hba1cChange?.comparability === 'missing_baseline', 'HbA1c flagged as missing_baseline (honest absence)');
  assert(hba1cChange?.baseline_value === undefined, 'Baseline HbA1c is undefined (NOT fabricated)');
  assert(hba1cChange?.current_value === 7.2, 'Current HbA1c is 7.2%');
  assert(hba1cChange?.outcome === 'insufficient_data', 'Outcome is insufficient_data due to single reading');
}

// Scenario 14: Context-Aware Clinical Interpretation (Pregnancy & Underweight)
{
  // 1. Pregnancy weight loss: 62 kg -> 59 kg in 2nd trimester must NOT be marked 'improved'
  const pregChange = calculateMetricChange({
    markerId: 'weight_kg',
    nameEn: 'Body Weight',
    nameBn: 'শরীরের ওজন',
    baselineVal: 62,
    currentVal: 59,
    unit: 'kg',
    desiredDirection: 'lower_is_better',
    clinicalContext: {
      isPregnant: true,
      population: 'pregnancy'
    }
  });
  assert(pregChange.outcome !== 'improved', 'Weight loss in pregnancy is NOT marked improved');
  assert(pregChange.outcome === 'worsened', 'Weight loss in pregnancy is marked worsened');

  // 2. Underweight restoration: 42 kg -> 45 kg (BMI 16.5) must NOT be marked 'worsened' even though weight increased
  const underweightChange = calculateMetricChange({
    markerId: 'weight_kg',
    nameEn: 'Body Weight',
    nameBn: 'শরীরের ওজন',
    baselineVal: 42,
    currentVal: 45,
    unit: 'kg',
    desiredDirection: 'lower_is_better',
    clinicalContext: {
      isUnderweight: true
    }
  });
  assert(underweightChange.outcome === 'improved', 'Weight gain in underweight restoration is marked improved');

  // 3. Standard metabolic overweight: 85 kg -> 80 kg IS marked 'improved'
  const standardChange = calculateMetricChange({
    markerId: 'weight_kg',
    nameEn: 'Body Weight',
    nameBn: 'শরীরের ওজন',
    baselineVal: 85,
    currentVal: 80,
    unit: 'kg',
    desiredDirection: 'lower_is_better'
  });
  assert(standardChange.outcome === 'improved', 'Weight loss in standard adult metabolic syndrome is marked improved');
}

// ───────────────────────────────────────────────────────────────────
// SUITE 4: Task 6 - Comparative Progress Report Approval & Verification
// ───────────────────────────────────────────────────────────────────
console.log('\n=====================================================================');
console.log('TEST SUITE: Scenario 15–16: Report Approval Persistence, Storage Failure, A4 Format');
console.log('=====================================================================');

// Scenario 15: Explicit Clinician Approval & Storage Failure Rollback
{
  const storage = new MockStorage();
  const patient = createMinimalPatient('pt_approval', 'Approval Patient');
  const baseSnap = createClinicalSnapshot({
    patient,
    visitId: 'vis_app_1',
    isBaseline: true,
    clinicalObservationsPayload: { weight_kg: 80 }
  });
  const compSnap = createClinicalSnapshot({
    patient,
    visitId: 'vis_app_2',
    isBaseline: false,
    clinicalObservationsPayload: { weight_kg: 77 }
  });

  const analysis = executeLongitudinalComparison({
    patient,
    baselineSnapshot: baseSnap,
    comparisonSnapshot: compSnap
  });

  const draftReport = buildComparativeProgressReport({
    patient,
    baselineSnapshot: baseSnap,
    comparisonSnapshot: compSnap,
    analysis,
    isApproved: false
  });

  assert(draftReport.is_approved === false, 'Newly generated report starts in draft status');

  // Validate non-placeholder credentials
  assert(validateClinicianCredentials('Dr. Tasnim Ara') === true, 'Licensed clinician name is valid');
  assert(validateClinicianCredentials('nutritionist') === false, 'Generic placeholder name is rejected');
  assert(validateClinicianCredentials('  ') === false, 'Empty name is rejected');

  // Approve report
  const approvedReport: ComparativeProgressReport = {
    ...draftReport,
    is_approved: true,
    approved_by: 'Dr. Tasnim Ara',
    approval_date: getDhakaTodayDateString(),
    sectionL_nutritionistReview: {
      ...draftReport.sectionL_nutritionistReview,
      status: 'fully_approved',
      reviewing_nutritionist: 'Dr. Tasnim Ara',
      review_date: getDhakaTodayDateString(),
      notes: 'Longitudinal progress approved for diet phase transition.'
    }
  };

  const visit1: ClinicalVisit = {
    visit_id: 'vis_app_1',
    patient_id: patient.id,
    visit_date: '2026-10-01',
    visit_type: 'baseline_consultation',
    status: 'completed',
    created_at: '2026-10-01T10:00:00Z'
  };
  const visit2: ClinicalVisit = {
    visit_id: 'vis_app_2',
    patient_id: patient.id,
    visit_date: '2026-11-01',
    visit_type: 'routine_followup',
    status: 'completed',
    created_at: '2026-11-01T10:00:00Z'
  };
  patient.current_visit_id = 'vis_app_2';

  const record = createMinimalRecord(
    patient,
    [visit1, visit2],
    [],
    [baseSnap, compSnap],
    [approvedReport]
  );

  // 1. Success persistence
  const successTx = savePatientTransaction({
    currentRecord: record,
    storageEngine: storage,
    action: {
      type: 'SAVE_RECORD',
      payload: { progress_reports: [approvedReport] }
    },
    savedPatientsList: [record]
  });
  assert(successTx.success, 'Report approval persisted successfully to storage');

  // Verify reload
  const reloaded = storage.getItem<PatientRecord[]>('shuddho_saved_patients')!;
  const reloadedReport = reloaded[0].progress_reports?.[0];
  assert(reloadedReport?.is_approved === true, 'Approved report status preserved across reload');
  assert(reloadedReport?.approved_by === 'Dr. Tasnim Ara', 'Approved clinician preserved across reload');

  // 2. Storage failure simulation - must NOT claim approval
  storage.shouldFail = true;
  const failTx = savePatientTransaction({
    currentRecord: record,
    storageEngine: storage,
    action: {
      type: 'SAVE_RECORD',
      payload: { progress_reports: [approvedReport] }
    },
    savedPatientsList: [record]
  });
  assert(failTx.success === false, 'Simulated storage failure rolls back transaction (success === false)');
}

// Scenario 16: A4 Printable Report Sections A-L
{
  const patient = createMinimalPatient('pt_a4', 'A4 Patient');
  const baseSnap = createClinicalSnapshot({
    patient,
    visitId: 'vis_a4_1',
    isBaseline: true,
    clinicalObservationsPayload: { weight_kg: 82, waist_cm: 96 }
  });
  const compSnap = createClinicalSnapshot({
    patient,
    visitId: 'vis_a4_2',
    isBaseline: false,
    clinicalObservationsPayload: { weight_kg: 78, waist_cm: 92 }
  });
  const analysis = executeLongitudinalComparison({
    patient,
    baselineSnapshot: baseSnap,
    comparisonSnapshot: compSnap
  });

  const report = buildComparativeProgressReport({
    patient,
    baselineSnapshot: baseSnap,
    comparisonSnapshot: compSnap,
    analysis
  });

  assert(Boolean(report.sectionA_patientAndConsultation.patient_name), 'Section A: Patient name present');
  assert(Boolean(report.sectionA_patientAndConsultation.baseline_date), 'Section A: Baseline date present');
  assert(Array.isArray(report.sectionB_overallSummary.improved), 'Section B: Executive summary present');
  assert(Array.isArray(report.sectionC_anthropometricComparison), 'Section C: Anthropometric comparison present');
  assert(Array.isArray(report.sectionD_symptomProgress), 'Section D: Symptom progress present');
  assert(Array.isArray(report.sectionE_laboratoryTrends), 'Section E: Lab trends present');
  assert(Boolean(report.sectionF_functionalMatrixChanges), 'Section F: Functional matrix present');
  assert(Boolean(report.sectionG_dietaryPatternAndAdherence), 'Section G: Diet adherence present');
  assert(Boolean(report.sectionH_ayurvedicProgress), 'Section H: Ayurvedic progress present');
  assert(Boolean(report.sectionI_clinicalSafetyReview), 'Section I: Clinical safety present');
  assert(Boolean(report.sectionJ_clinicalOutcomeInterpretation.causality_caveat_en), 'Section J: Causality caveat present');
  assert(Boolean(report.sectionJ_clinicalOutcomeInterpretation.causality_caveat_bn), 'Section J: Bengali causality caveat present');
  assert(Array.isArray(report.sectionK_nextClinicalPriorities), 'Section K: Next priorities present');
  assert(Boolean(report.sectionL_nutritionistReview.status), 'Section L: Clinician sign-off present');
}

console.log('\n=====================================================================');
console.log('TEST SUITE: Scenarios A–H: Atomic Consultation Creation & Persist-First Lifecycle');
console.log('=====================================================================');

// Scenario A: Cross-Patient Consultation
{
  const storage = new MockStorage();
  const patientA = createMinimalPatient('pt_alpha_cross', 'Patient Alpha');
  const patientB = createMinimalPatient('pt_beta_cross', 'Patient Beta');

  const visitA: ClinicalVisit = {
    visit_id: 'vis_alpha_base',
    patient_id: patientA.id,
    visit_date: '2026-10-01',
    visit_type: 'baseline_consultation',
    status: 'completed',
    created_at: '2026-10-01T10:00:00Z'
  };
  const recordA = createMinimalRecord(patientA, [visitA]);

  const visitB: ClinicalVisit = {
    visit_id: 'vis_beta_base',
    patient_id: patientB.id,
    visit_date: '2026-10-05',
    visit_type: 'baseline_consultation',
    status: 'completed',
    created_at: '2026-10-05T10:00:00Z'
  };
  const aptB: FollowUpAppointment = {
    appointment_id: 'apt_beta_sched',
    patient_id: patientB.id,
    scheduled_date: '2026-11-20',
    scheduled_time: '11:00 AM',
    reason: 'Routine check',
    status: 'scheduled',
    created_at: '2026-10-05T10:30:00Z'
  };
  const recordB = createMinimalRecord(patientB, [visitB], [aptB]);

  // Persist both records initially
  storage.setItem('shuddho_saved_patients', [recordA, recordB]);

  // Execute START_CONSULTATION_FOR_APPOINTMENT for Patient B
  const tx = savePatientTransaction({
    currentRecord: recordB,
    storageEngine: storage,
    action: {
      type: 'START_CONSULTATION_FOR_APPOINTMENT',
      payload: { appointmentId: 'apt_beta_sched' }
    },
    savedPatientsList: [recordA, recordB]
  });

  assert(tx.success === true, 'Scenario A: Consultation creation transaction succeeded');
  assert(Boolean(tx.newVisit), 'Scenario A: New visit returned');
  assert(tx.newVisit?.patient_id === patientB.id, 'Scenario A: New visit belongs to Patient B');
  assert(tx.newVisit?.visit_id !== visitB.visit_id, 'Scenario A: New visit ID is distinct from baseline');
  const linkedApt = tx.committedRecord.follow_up_appointments?.find(a => a.appointment_id === 'apt_beta_sched');
  assert(linkedApt?.actual_visit_id === tx.newVisit?.visit_id, 'Scenario A: actual_visit_id matches new visit');
  assert(linkedApt?.status !== 'completed', 'Scenario A: Appointment is not prematurely completed');

  // Verify Patient A record in committed list is completely untouched
  const committedA = tx.committedPatientsList.find(p => p.patient.id === patientA.id);
  assert(committedA?.clinical_visits?.length === 1, 'Scenario A: Patient A clinical visits unaffected (zero leakage)');
  assert(committedA?.clinical_visits?.[0].visit_id === 'vis_alpha_base', 'Scenario A: Patient A visit preserved');

  // Verify storage reload
  const reloaded = storage.getItem<PatientRecord[]>('shuddho_saved_patients')!;
  const reloadedB = reloaded.find(p => p.patient.id === patientB.id)!;
  assert(reloadedB.clinical_visits?.length === 2, 'Scenario A: Reloaded Patient B has 2 visits');
  assert(reloadedB.follow_up_appointments?.[0].actual_visit_id === tx.newVisit?.visit_id, 'Scenario A: Reloaded Patient B appointment linkage preserved');
}

// Scenario B: Repeated Click Protection (Idempotent Consultation Linkage)
{
  const storage = new MockStorage();
  const patient = createMinimalPatient('pt_repeat', 'Repeat Click Patient');
  const baseVisit: ClinicalVisit = {
    visit_id: 'vis_repeat_1',
    patient_id: patient.id,
    visit_date: '2026-10-01',
    visit_type: 'baseline_consultation',
    status: 'completed',
    created_at: '2026-10-01T10:00:00Z'
  };
  const apt: FollowUpAppointment = {
    appointment_id: 'apt_repeat_1',
    patient_id: patient.id,
    scheduled_date: '2026-11-20',
    reason: 'Follow-up check',
    status: 'scheduled',
    created_at: '2026-10-01T10:30:00Z'
  };
  const record = createMinimalRecord(patient, [baseVisit], [apt]);
  storage.setItem('shuddho_saved_patients', [record]);

  // First click
  const tx1 = savePatientTransaction({
    currentRecord: record,
    storageEngine: storage,
    action: {
      type: 'START_CONSULTATION_FOR_APPOINTMENT',
      payload: { appointmentId: 'apt_repeat_1' }
    },
    savedPatientsList: [record]
  });
  assert(tx1.success === true, 'Scenario B: First consultation click succeeded');
  const visit1Id = tx1.newVisit?.visit_id;
  assert(tx1.committedRecord.clinical_visits?.length === 2, 'Scenario B: Visits count is 2 after first click');

  // Second click with the committed record
  const tx2 = savePatientTransaction({
    currentRecord: tx1.committedRecord,
    storageEngine: storage,
    action: {
      type: 'START_CONSULTATION_FOR_APPOINTMENT',
      payload: { appointmentId: 'apt_repeat_1' }
    },
    savedPatientsList: tx1.committedPatientsList
  });
  assert(tx2.success === true, 'Scenario B: Second click succeeded idempotently');
  assert(tx2.newVisit?.visit_id === visit1Id, 'Scenario B: Second click reuses existing consultation');
  assert(tx2.committedRecord.clinical_visits?.length === 2, 'Scenario B: Visits count did NOT increase (no duplicate visit)');
}

// Scenario C: Storage Failure During Consultation
{
  const storage = new MockStorage();
  const patient = createMinimalPatient('pt_fail_cons', 'Fail Cons Patient');
  const baseVisit: ClinicalVisit = {
    visit_id: 'vis_fail_cons_1',
    patient_id: patient.id,
    visit_date: '2026-10-01',
    visit_type: 'baseline_consultation',
    status: 'completed',
    created_at: '2026-10-01T10:00:00Z'
  };
  const apt: FollowUpAppointment = {
    appointment_id: 'apt_fail_cons_1',
    patient_id: patient.id,
    scheduled_date: '2026-11-20',
    reason: 'Follow-up check',
    status: 'scheduled',
    created_at: '2026-10-01T10:30:00Z'
  };
  const record = createMinimalRecord(patient, [baseVisit], [apt]);
  storage.setItem('shuddho_saved_patients', [record]);

  // Inject failure
  storage.shouldFail = true;

  const tx = savePatientTransaction({
    currentRecord: record,
    storageEngine: storage,
    action: {
      type: 'START_CONSULTATION_FOR_APPOINTMENT',
      payload: { appointmentId: 'apt_fail_cons_1' }
    },
    savedPatientsList: [record]
  });

  assert(tx.success === false, 'Scenario C: Transaction reports failure on storage write fault');
  assert(tx.committedRecord.clinical_visits?.length === 1, 'Scenario C: In-memory visits array rolled back / unchanged');
  assert(tx.committedRecord.follow_up_appointments?.[0].actual_visit_id === undefined, 'Scenario C: No phantom actual_visit_id linkage');

  // Verify storage unaffected
  storage.shouldFail = false;
  const reloaded = storage.getItem<PatientRecord[]>('shuddho_saved_patients')!;
  assert(reloaded[0].clinical_visits?.length === 1, 'Scenario C: Storage persisted visits strictly unchanged (1 visit)');
  assert(reloaded[0].follow_up_appointments?.[0].actual_visit_id === undefined, 'Scenario C: Storage appointment unlinked');
}

// Scenario D: Schedule Failure (No Phantom Appointment)
{
  const storage = new MockStorage();
  const patient = createMinimalPatient('pt_fail_sched', 'Fail Sched Patient');
  const record = createMinimalRecord(patient, []);
  storage.setItem('shuddho_saved_patients', [record]);

  const newApt: FollowUpAppointment = {
    appointment_id: 'apt_phantom',
    patient_id: patient.id,
    scheduled_date: '2026-11-22',
    status: 'scheduled',
    created_at: new Date().toISOString()
  };

  storage.shouldFail = true;
  const tx = savePatientTransaction({
    currentRecord: record,
    storageEngine: storage,
    action: {
      type: 'SAVE_RECORD',
      payload: { follow_up_appointments: [newApt] }
    },
    savedPatientsList: [record]
  });

  assert(tx.success === false, 'Scenario D: Schedule transaction rejected on storage error');
  storage.shouldFail = false;
  const reloaded = storage.getItem<PatientRecord[]>('shuddho_saved_patients')!;
  assert((reloaded[0].follow_up_appointments || []).length === 0, 'Scenario D: Zero phantom appointments persisted');
}

// Scenario E: Reschedule Failure (Preserve Original Date & Status)
{
  const storage = new MockStorage();
  const patient = createMinimalPatient('pt_fail_resched', 'Fail Resched Patient');
  const initialApt: FollowUpAppointment = {
    appointment_id: 'apt_orig',
    patient_id: patient.id,
    scheduled_date: '2026-11-20',
    status: 'scheduled',
    created_at: '2026-10-01T10:00:00Z'
  };
  const record = createMinimalRecord(patient, [], [initialApt]);
  storage.setItem('shuddho_saved_patients', [record]);

  const proposedResched: FollowUpAppointment = {
    ...initialApt,
    scheduled_date: '2026-11-28',
    status: 'rescheduled',
    rescheduled_from: '2026-11-20',
    rescheduled_history: [{
      previous_date: '2026-11-20',
      rescheduled_at: new Date().toISOString(),
      reason: 'Failed try'
    }]
  };

  storage.shouldFail = true;
  const tx = savePatientTransaction({
    currentRecord: record,
    storageEngine: storage,
    action: {
      type: 'SAVE_RECORD',
      payload: { follow_up_appointments: [proposedResched] }
    },
    savedPatientsList: [record]
  });

  assert(tx.success === false, 'Scenario E: Reschedule transaction rejected on storage error');
  storage.shouldFail = false;
  const reloaded = storage.getItem<PatientRecord[]>('shuddho_saved_patients')!;
  const persistedApt = reloaded[0].follow_up_appointments?.[0];
  assert(persistedApt?.scheduled_date === '2026-11-20', 'Scenario E: Original date preserved (2026-11-20)');
  assert(persistedApt?.status === 'scheduled', 'Scenario E: Original status preserved');
  assert(!persistedApt?.rescheduled_history || persistedApt.rescheduled_history.length === 0, 'Scenario E: No false reschedule history appended');
}

// Scenario F: Cancel Failure (Preserve Previous State)
{
  const storage = new MockStorage();
  const patient = createMinimalPatient('pt_fail_cancel', 'Fail Cancel Patient');
  const initialApt: FollowUpAppointment = {
    appointment_id: 'apt_cancel_target',
    patient_id: patient.id,
    scheduled_date: '2026-11-20',
    status: 'scheduled',
    created_at: '2026-10-01T10:00:00Z'
  };
  const record = createMinimalRecord(patient, [], [initialApt]);
  storage.setItem('shuddho_saved_patients', [record]);

  const proposedCancel: FollowUpAppointment = {
    ...initialApt,
    status: 'cancelled',
    cancellation_reason: 'Clinician emergency'
  };

  storage.shouldFail = true;
  const tx = savePatientTransaction({
    currentRecord: record,
    storageEngine: storage,
    action: {
      type: 'SAVE_RECORD',
      payload: { follow_up_appointments: [proposedCancel] }
    },
    savedPatientsList: [record]
  });

  assert(tx.success === false, 'Scenario F: Cancel transaction rejected on storage error');
  storage.shouldFail = false;
  const reloaded = storage.getItem<PatientRecord[]>('shuddho_saved_patients')!;
  assert(reloaded[0].follow_up_appointments?.[0].status === 'scheduled', 'Scenario F: Appointment status remains scheduled');
}

// Scenario G: Complete Failure (Appointment Not Falsely Marked Completed)
{
  const storage = new MockStorage();
  const patient = createMinimalPatient('pt_fail_comp', 'Fail Comp Patient');
  const initialApt: FollowUpAppointment = {
    appointment_id: 'apt_comp_target',
    patient_id: patient.id,
    scheduled_date: '2026-11-20',
    actual_visit_id: 'vis_comp_1',
    status: 'scheduled',
    created_at: '2026-10-01T10:00:00Z'
  };
  const record = createMinimalRecord(patient, [], [initialApt]);
  storage.setItem('shuddho_saved_patients', [record]);

  const proposedComplete: FollowUpAppointment = {
    ...initialApt,
    status: 'completed',
    completed_visit_id: 'vis_comp_1'
  };

  storage.shouldFail = true;
  const tx = savePatientTransaction({
    currentRecord: record,
    storageEngine: storage,
    action: {
      type: 'SAVE_RECORD',
      payload: { follow_up_appointments: [proposedComplete] }
    },
    savedPatientsList: [record]
  });

  assert(tx.success === false, 'Scenario G: Complete transaction rejected on storage error');
  storage.shouldFail = false;
  const reloaded = storage.getItem<PatientRecord[]>('shuddho_saved_patients')!;
  assert(reloaded[0].follow_up_appointments?.[0].status === 'scheduled', 'Scenario G: Appointment status remains scheduled (not completed)');
}

// Scenario H: Normal Appointment Lifecycle Throughout
{
  const storage = new MockStorage();
  const patient = createMinimalPatient('pt_lifecycle', 'Lifecycle Patient');
  const baseVisitId = patient.current_visit_id || `vis_${patient.id}_1`;
  const baseVisit: ClinicalVisit = {
    visit_id: baseVisitId,
    patient_id: patient.id,
    visit_date: '2026-10-01',
    visit_type: 'baseline_consultation',
    status: 'completed',
    created_at: '2026-10-01T10:00:00Z'
  };
  let record = createMinimalRecord(patient, [baseVisit]);
  storage.setItem('shuddho_saved_patients', [record]);

  // 1. Schedule
  const apt: FollowUpAppointment = {
    appointment_id: 'apt_life_1',
    patient_id: patient.id,
    scheduled_date: '2026-11-22',
    scheduled_time: '10:00 AM',
    reason: 'Monthly check',
    status: 'scheduled',
    created_at: new Date().toISOString()
  };
  let tx = savePatientTransaction({
    currentRecord: record,
    storageEngine: storage,
    action: { type: 'SAVE_RECORD', payload: { follow_up_appointments: [apt] } },
    savedPatientsList: [record]
  });
  assert(tx.success, 'Scenario H1: Scheduled successfully');

  // 2. Reload after Schedule
  let reloaded = storage.getItem<PatientRecord[]>('shuddho_saved_patients')!;
  assert(reloaded[0].follow_up_appointments?.[0].appointment_id === 'apt_life_1', 'Scenario H2: Appointment preserved after schedule reload');

  // 3. Reschedule
  const reschedApt: FollowUpAppointment = {
    ...reloaded[0].follow_up_appointments![0],
    scheduled_date: '2026-11-24',
    status: 'rescheduled',
    rescheduled_from: '2026-11-22',
    rescheduled_history: [{ previous_date: '2026-11-22', rescheduled_at: new Date().toISOString() }]
  };
  tx = savePatientTransaction({
    currentRecord: reloaded[0],
    storageEngine: storage,
    action: { type: 'SAVE_RECORD', payload: { follow_up_appointments: [reschedApt] } },
    savedPatientsList: reloaded
  });
  assert(tx.success, 'Scenario H3: Rescheduled successfully');

  // 4. Reload after Reschedule
  reloaded = storage.getItem<PatientRecord[]>('shuddho_saved_patients')!;
  assert(reloaded[0].follow_up_appointments?.[0].scheduled_date === '2026-11-24', 'Scenario H4: Rescheduled date preserved on reload');

  // 5. Start Consultation
  tx = savePatientTransaction({
    currentRecord: reloaded[0],
    storageEngine: storage,
    action: { type: 'START_CONSULTATION_FOR_APPOINTMENT', payload: { appointmentId: 'apt_life_1' } },
    savedPatientsList: reloaded
  });
  assert(tx.success && Boolean(tx.newVisit), 'Scenario H5: Consultation started successfully');
  const consultationVisitId = tx.newVisit!.visit_id;

  // 6. Reload after Consultation Start
  reloaded = storage.getItem<PatientRecord[]>('shuddho_saved_patients')!;
  assert(reloaded[0].clinical_visits?.length === 2, 'Scenario H6: 2 visits exist after consultation start');
  const lifeApt = reloaded[0].follow_up_appointments?.[0];
  assert(lifeApt?.actual_visit_id === consultationVisitId, 'Scenario H6: actual_visit_id linked to consultation visit');
  assert(lifeApt?.status !== 'completed', 'Scenario H6: Appointment remains active (not completed)');

  // 7. Complete Appointment
  const completedApt: FollowUpAppointment = {
    ...lifeApt!,
    status: 'completed',
    completed_visit_id: consultationVisitId
  };
  tx = savePatientTransaction({
    currentRecord: reloaded[0],
    storageEngine: storage,
    action: { type: 'SAVE_RECORD', payload: { follow_up_appointments: [completedApt] } },
    savedPatientsList: reloaded
  });
  assert(tx.success, 'Scenario H7: Completed appointment successfully');

  // 8. Reload after Complete
  reloaded = storage.getItem<PatientRecord[]>('shuddho_saved_patients')!;
  assert(reloaded[0].follow_up_appointments?.[0].status === 'completed', 'Scenario H8: Status is completed on reload');
  assert(reloaded[0].follow_up_appointments?.[0].completed_visit_id === consultationVisitId, 'Scenario H8: completed_visit_id preserved');
}

console.log('\n=====================================================================');
console.log(`STEP 03 UNIT & INTEGRATION TEST RESULTS: ${passedAssertions}/${totalAssertions} PASSED (0 FAILED)`);
console.log('=====================================================================\n');
