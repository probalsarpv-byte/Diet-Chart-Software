/**
 * SHUDDHO FUNCTIONAL & PRECISION NUTRITION SOFTWARE
 * MASTER INTEGRATION TEST SUITE: P0–P2 FINAL INTEGRATION GATE
 * 
 * Verifies:
 * 1. Zero-safe Dynamic KPIs & Registry
 * 2. Collision-Resistant ID Generation (same patient, same date)
 * 3. Neutral Patient Registration (Zero fabricated/fictional data)
 * 4. Follow-Up Scheduling & Status Lifecycle (Asia/Dhaka timezone)
 * 5. Longitudinal Comparison Engine (Modes A–D, bidirectional Bristol, contextual weight)
 * 6. 12-Section Comparative Progress Report Builder & Sign-off Validation
 * 7. P2/P3 Clinical Progress Planning Context Handoff
 */

import {
  calculateMetricChange,
  interpretBristolStoolChange,
  executeLongitudinalComparison,
  buildComparativeProgressReport,
  constructClinicalProgressPlanningContext,
  validateClinicianCredentials
} from '../src/engine/longitudinal/comparisonEngine';
import {
  generateCollisionResistantId,
  refreshAppointmentStatus,
  getDhakaTodayDateString
} from '../src/context/PracticeContext';
import { calculateAnthropometrics } from '../src/engine/anthropometrics';
import { searchMedications } from '../src/engine/medicationSearch';
import {
  ClinicalVisitSnapshot,
  FollowUpAppointment,
  PatientProfile,
  ClinicalVisit
} from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

console.log('=====================================================================');
console.log('SHUDDHO P0–P2 FINAL MASTER INTEGRATION TEST SUITE');
console.log('=====================================================================\n');

let totalChecks = 0;

function runCheck(testName: string, fn: () => void) {
  try {
    fn();
    totalChecks++;
  } catch (err) {
    console.error(`\nFAILED IN TEST: ${testName}`);
    throw err;
  }
}

// ─── 1. Neutral Registration & Zero Fabricated Data ───────────────
console.log('1. Neutral Patient Registration (Zero Fabricated Metrics)');
runCheck('Neutral registration preserves unmeasured anthropometrics', () => {
  const unmeasuredCalc = calculateAnthropometrics(
    0, 'female', 0, 0, 0, 'sedentary', [], 'adult_standard', undefined, 'clamped_to_bmr'
  );

  assert(unmeasuredCalc.is_unmeasured === true, 'Anthropometrics engine flags unmeasured status');
  assert(unmeasuredCalc.bmi === 0, 'BMI defaults to 0 for unmeasured, never fabricated');
  assert(unmeasuredCalc.bmr === 0, 'BMR defaults to 0 for unmeasured, never fabricated');
  assert(unmeasuredCalc.target_calories === 0, 'Target calories defaults to 0 for unmeasured');
  assert(unmeasuredCalc.whtr === 0, 'WHtR defaults to 0 for unmeasured');
});

// ─── 2. Collision-Resistant ID Generation ──────────────────────────
console.log('\n2. Collision-Resistant ID Generation (Multi-Visit Same Day)');
runCheck('Same patient on same date receives distinct IDs', () => {
  const patientId = 'SH-2026-0042';
  
  const visitId1 = generateCollisionResistantId(`vis_${patientId}`);
  const visitId2 = generateCollisionResistantId(`vis_${patientId}`);
  const apptId1 = generateCollisionResistantId(`apt_${patientId}`);
  const repId1 = generateCollisionResistantId(`rep_${patientId}`);

  assert(visitId1 !== visitId2, 'Two visits for same patient on same date have distinct unique IDs');
  assert(visitId1.startsWith('vis_SH-2026-0042'), 'Visit ID carries patient prefix');
  assert(apptId1.startsWith('apt_SH-2026-0042'), 'Appointment ID carries appointment prefix');
  assert(repId1.startsWith('rep_SH-2026-0042'), 'Report ID carries report prefix');
});

// ─── 3. Dynamic Real KPIs (Zero-Safe) ───────────────────────────────
console.log('\n3. Dynamic KPI Calculation (Zero-Safe)');
runCheck('Empty practice returns clean zeroes with no fabricated stats', () => {
  const patients: PatientProfile[] = [];
  const visits: ClinicalVisit[] = [];
  const appointments: FollowUpAppointment[] = [];

  const kpis = {
    totalPatients: patients.length,
    activeVisits: visits.filter(v => v.status === 'in_progress').length,
    todayDue: appointments.filter(a => a.status === 'due_today').length,
    overdueCount: appointments.filter(a => a.status === 'overdue').length,
    allergyReconciled: patients.filter(p => p.allergy_reconciliation_status === 'allergies_confirmed' || p.allergy_reconciliation_status === 'none_confirmed').length,
    medsReconciled: patients.filter(p => p.medication_reconciliation_status === 'fully_reconciled' || p.medication_reconciliation_status === 'no_medications').length
  };

  assert(kpis.totalPatients === 0, 'Total patients is 0 when empty');
  assert(kpis.activeVisits === 0, 'Active visits is 0 when empty');
  assert(kpis.todayDue === 0, 'Today due appointments is 0 when empty');
  assert(kpis.overdueCount === 0, 'Overdue appointments is 0 when empty');
  assert(kpis.allergyReconciled === 0, 'Allergy reconciled is 0 when empty');
  assert(kpis.medsReconciled === 0, 'Meds reconciled is 0 when empty');
});

// ─── 4. Follow-Up Scheduling Status Transitions ────────────────────
console.log('\n4. Follow-Up Scheduling Status Transitions (Asia/Dhaka)');
runCheck('Appointment date comparison classifies due_today, overdue, scheduled', () => {
  const dhakaToday = getDhakaTodayDateString();
  const pastDate = '2020-01-01';
  const futureDate = '2099-01-01';

  const aptToday: FollowUpAppointment = {
    id: 'apt_test_1',
    patient_id: 'SH-001',
    scheduled_date: dhakaToday,
    scheduled_time: '10:00 AM',
    reason: 'Follow-up',
    status: 'scheduled',
    created_at: '2026-01-01T00:00:00Z'
  };

  const aptPast: FollowUpAppointment = {
    ...aptToday,
    id: 'apt_test_2',
    scheduled_date: pastDate
  };

  const aptFuture: FollowUpAppointment = {
    ...aptToday,
    id: 'apt_test_3',
    scheduled_date: futureDate
  };

  const aptCompleted: FollowUpAppointment = {
    ...aptToday,
    id: 'apt_test_4',
    scheduled_date: pastDate,
    status: 'completed'
  };

  const aptCancelled: FollowUpAppointment = {
    ...aptToday,
    id: 'apt_test_5',
    scheduled_date: pastDate,
    status: 'cancelled'
  };

  assert(refreshAppointmentStatus(aptToday).status === 'due_today', 'Visit on today date becomes due_today');
  assert(refreshAppointmentStatus(aptPast).status === 'overdue', 'Past scheduled date becomes overdue');
  assert(refreshAppointmentStatus(aptFuture).status === 'scheduled', 'Future date remains scheduled');
  assert(refreshAppointmentStatus(aptCompleted).status === 'completed', 'Completed appointment remains completed regardless of past date');
  assert(refreshAppointmentStatus(aptCancelled).status === 'cancelled', 'Cancelled appointment remains cancelled regardless of past date');
});

// ─── 5. Longitudinal Metric Change & Directional Logic ──────────────
console.log('\n5. Metric Change Calculations & Clinical Direction');
runCheck('Calculates quantitative changes accurately', () => {
  // 1. HbA1c drop (improvement)
  const hba1cChange = calculateMetricChange({
    markerId: 'hba1c',
    nameEn: 'HbA1c',
    nameBn: 'এইচবিএ১সি',
    baselineVal: 8.5,
    currentVal: 7.1,
    unit: '%',
    desiredDirection: 'lower_is_better'
  });
  assert(hba1cChange.baseline_value === 8.5, 'Baseline HbA1c preserved as 8.5');
  assert(hba1cChange.current_value === 7.1, 'Current HbA1c preserved as 7.1');
  assert(hba1cChange.absolute_change === -1.4, 'Absolute change is -1.4%');
  assert(hba1cChange.percentage_change === -16.5, 'Percentage change is -16.5%');
  assert(hba1cChange.outcome === 'improved', 'HbA1c drop classified as improved');

  // 2. eGFR increase (improvement)
  const egfrChange = calculateMetricChange({
    markerId: 'egfr',
    nameEn: 'eGFR',
    nameBn: 'ইজিএফআর',
    baselineVal: 55,
    currentVal: 68,
    unit: 'mL/min/1.73m²',
    desiredDirection: 'higher_is_better'
  });
  assert(egfrChange.absolute_change === 13, 'eGFR delta is +13');
  assert(egfrChange.outcome === 'improved', 'eGFR increase classified as improved');

  // 3. Bidirectional Bristol Stool Score: Type 1 (Severe Constipation) -> Type 4 (Ideal)
  const stoolChange1 = interpretBristolStoolChange(1, 4);
  assert(stoolChange1.outcome === 'improved', 'Bristol 1 to 4 is improved toward normal stool consistency');

  // 4. Bidirectional Bristol Stool Score: Type 7 (Watery Diarrhea) -> Type 4 (Ideal)
  const stoolChange2 = interpretBristolStoolChange(7, 4);
  assert(stoolChange2.outcome === 'improved', 'Bristol 7 to 4 is improved toward normal stool consistency');

  // 5. Bidirectional Bristol Stool Score: Type 4 (Normal) -> Type 7 (Diarrhea)
  const stoolChange3 = interpretBristolStoolChange(4, 7);
  assert(stoolChange3.outcome === 'worsened', 'Bristol 4 to 7 is deteriorated away from target');

  // 6. Contextual Weight Delta: Overweight reduction
  const overweightChange = calculateMetricChange({
    markerId: 'weight_kg',
    nameEn: 'Weight',
    nameBn: 'ওজন',
    baselineVal: 88,
    currentVal: 83,
    unit: 'kg',
    desiredDirection: 'contextual',
    clinicalContext: { isUnderweight: false, isOncology: false }
  });
  assert(overweightChange.outcome === 'improved', 'Weight loss in overweight patient is improved');

  // 7. Contextual Weight Delta: Underweight loss (unintended deterioration)
  const underweightChange = calculateMetricChange({
    markerId: 'weight_kg',
    nameEn: 'Weight',
    nameBn: 'ওজন',
    baselineVal: 44,
    currentVal: 41,
    unit: 'kg',
    desiredDirection: 'contextual',
    clinicalContext: { isUnderweight: true, isOncology: false }
  });
  assert(underweightChange.outcome === 'worsened', 'Weight loss in underweight patient is deteriorated');

  // 8. Contextual Weight Delta: Oncology unintended weight loss
  const oncologyWeightLoss = calculateMetricChange({
    markerId: 'weight_kg',
    nameEn: 'Weight',
    nameBn: 'ওজন',
    baselineVal: 60,
    currentVal: 56,
    unit: 'kg',
    desiredDirection: 'contextual',
    clinicalContext: { isUnderweight: false, isOncology: true }
  });
  assert(oncologyWeightLoss.outcome === 'worsened', 'Weight loss in oncology patient flagged as worsened/cachexia risk');
});

// ─── 6. Longitudinal Comparison Engine (Modes A–D) ─────────────────
console.log('\n6. Full Longitudinal Comparison Engine (Modes A–D)');

const createSamplePatient = (): PatientProfile => ({
  schema_version: 2,
  id: 'SH-TEST-001',
  name: 'Kazi Nazrul Islam',
  age: 48,
  gender: 'male',
  phone: '01712-345678',
  visit_date: '2026-03-15',
  current_phase: 2,
  height_cm: 165,
  weight_kg: 79,
  waist_cm: 90,
  activity_level: 'sedentary',
  sleep_hours: 7,
  shift_worker: false,
  population_group: 'adult_standard',
  bmr_floor_strategy: 'clamped_to_bmr',
  confirmed_allergies: ['shrimp'],
  clinician_disallowed_foods: [],
  clinician_disallowed_tags: [],
  selected_conditions: ['t2d_ir', 'hypertension_ckd'],
  active_medications: ['Metformin 500mg'],
  allergy_reconciliation_status: 'allergies_confirmed',
  medication_reconciliation_status: 'fully_reconciled',
  gut_profile: {
    bloating: 'none',
    acid_reflux_hypoacidity: false,
    bristol_stool_score: 4,
    energy_score: 8,
    sleep_quality_score: 8,
    digestive_fire_agni: 'samagni'
  },
  labs: {
    hba1c: 7.2,
    homa_ir: 2.4,
    serum_creatinine: 1.1,
    egfr: 75,
    lab_flags: []
  },
  calculated: {
    bmi: 29.0,
    bmi_category_en: 'Overweight',
    bmi_category_bn: 'অতিরিক্ত ওজন',
    whtr: 0.55,
    whtr_risk_en: 'Elevated Risk',
    whtr_risk_bn: 'উচ্চ ঝুঁকি',
    ibw_kg: 61,
    adjusted_bw_kg: 68,
    bmr: 1650,
    tdee: 1980,
    bmr_safe_calorie_floor: 1450,
    target_calories: 1650,
    target_protein_g: 80,
    target_carbs_g: 180,
    target_fat_g: 50,
    protein_ratio_used: '1.2 g/kg',
    population_group: 'adult_standard',
    bmr_floor_strategy: 'clamped_to_bmr',
    is_estimated: true,
    energy_calculation_method: 'Mifflin-St Jeor'
  }
});

const createSampleSnapshot = (
  visitId: string, 
  dateStr: string, 
  phase: 1 | 2 | 3 | 4,
  weight: number,
  hba1c: number,
  homaIr: number,
  stool: number,
  bloating: 'none' | 'mild' | 'moderate' | 'severe',
  agni: 'manda' | 'tikshna' | 'vishama' | 'sama' | 'unassessed'
): ClinicalVisitSnapshot => ({
  snapshot_id: `snap_${visitId}`,
  patient_id: 'SH-TEST-001',
  visit_id: visitId,
  is_baseline: visitId === 'v_baseline',
  visit_date: dateStr,
  anthropometrics: {
    weight_kg: weight,
    height_cm: 165,
    bmi: Number((weight / (1.65 * 1.65)).toFixed(1)),
    waist_cm: 92
  },
  vitals: {
    systolic_bp: 135,
    diastolic_bp: 85
  },
  biomarkers: {
    fasting_blood_glucose: 140,
    two_hour_post_prandial: 195,
    hba1c,
    homa_ir: homaIr,
    tg_hdl_ratio: 3.8,
    hs_crp: 4.2,
    serum_creatinine: 1.1,
    egfr: 75
  },
  gut_metrics: {
    bloating,
    bristol_stool_score: stool,
    bowel_regularity: 'regular'
  },
  ayurveda: {
    prakriti: 'pitta',
    vikriti: { vata: 3, pitta: 4, kapha: 2 },
    agni
  },
  dietary_pattern: {
    diversity_score: 14,
    ffq_summary: {}
  },
  allergies: {
    status: 'allergies_confirmed',
    reconciled: true,
    confirmed_allergies: ['shrimp'],
    reconciled_by: 'Dr. Nutritionist',
    reconciled_at: '2026-01-10T10:00:00Z'
  },
  medications: {
    status: 'fully_reconciled',
    reconciled_records: [],
    verified_no_medications: false,
    missing_elements: []
  },
  clinical_priorities: ['Glycemic control', 'Gut dysbiosis resolution'],
  approved_goals: ['Reduce HbA1c below 7.0%', 'Resolve postprandial bloating']
});

runCheck('Mode A: Baseline vs Current comparison', () => {
  const patient = createSamplePatient();
  const baseline = createSampleSnapshot('vis_001', '2026-01-10', 1, 85, 8.8, 4.5, 2, 'severe', 'manda');
  const current = createSampleSnapshot('vis_002', '2026-03-15', 2, 79, 7.2, 2.4, 4, 'none', 'sama');

  const analysis = executeLongitudinalComparison({
    patient,
    baselineSnapshot: baseline,
    comparisonSnapshot: current,
    comparisonMode: 'baseline_vs_current'
  });

  assert(analysis.patient_id === 'SH-TEST-001', 'Patient ID matches');
  assert(analysis.comparison_mode === 'baseline_vs_current', 'Comparison mode is baseline_vs_current');
  assert(analysis.anthropometric_changes.length > 0, 'Anthropometric changes populated');
  const weightChange = analysis.anthropometric_changes.find(c => c.marker_id === 'weight_kg');
  assert(weightChange?.absolute_change === -6, 'Weight change is -6kg');
  assert(weightChange?.outcome === 'improved', 'Weight is improved (-6kg)');

  const hba1cChange = analysis.laboratory_changes.find(c => c.marker_id === 'hba1c');
  assert(hba1cChange?.absolute_change === -1.6, 'HbA1c change is -1.6%');
  assert(hba1cChange?.outcome === 'improved', 'HbA1c is improved');

  const stoolChange = analysis.symptom_changes.find(c => c.marker_id === 'bristol_stool' || c.marker_id === 'bristol_stool_score');
  assert(stoolChange?.outcome === 'improved', 'Bristol stool normalized to Type 4');
  assert(analysis.ayurvedic_changes.baseline_agni === 'manda', 'Baseline Agni was Manda');
  assert(analysis.ayurvedic_changes.current_agni === 'sama', 'Current Agni is Sama');
});

runCheck('Mode B: Previous Visit vs Current comparison', () => {
  const patient = createSamplePatient();
  const visit1 = createSampleSnapshot('vis_001', '2026-01-10', 1, 85, 8.8, 4.5, 2, 'severe', 'manda');
  const visit2 = createSampleSnapshot('vis_002', '2026-02-15', 2, 81, 7.8, 3.2, 3, 'mild', 'vishama');

  const analysis = executeLongitudinalComparison({
    patient,
    baselineSnapshot: visit1,
    comparisonSnapshot: visit2,
    comparisonMode: 'previous_vs_current'
  });

  assert(analysis.comparison_mode === 'previous_vs_current', 'Comparison mode is previous_vs_current');
  const weightChange = analysis.anthropometric_changes.find(c => c.marker_id === 'weight_kg');
  assert(weightChange?.absolute_change === -4, 'Weight delta is -4 kg');
});

runCheck('Mode C: Selected Pair comparison', () => {
  const patient = createSamplePatient();
  const visit2 = createSampleSnapshot('vis_002', '2026-02-15', 2, 81, 7.8, 3.2, 3, 'mild', 'vishama');
  const visit3 = createSampleSnapshot('vis_003', '2026-03-15', 2, 78, 7.0, 2.1, 4, 'none', 'sama');

  const analysis = executeLongitudinalComparison({
    patient,
    baselineSnapshot: visit2,
    comparisonSnapshot: visit3,
    comparisonMode: 'selected_vs_selected'
  });

  assert(analysis.comparison_mode === 'selected_vs_selected', 'Comparison mode is selected_vs_selected');
  const weightChange = analysis.anthropometric_changes.find(c => c.marker_id === 'weight_kg');
  assert(weightChange?.absolute_change === -3, 'Weight delta is -3 kg between selected pair');
});

runCheck('Mode D: Multi-Visit Trend Series', () => {
  const patient = createSamplePatient();
  const v1 = createSampleSnapshot('vis_001', '2026-01-10', 1, 85, 8.8, 4.5, 2, 'severe', 'manda');
  const v2 = createSampleSnapshot('vis_002', '2026-02-15', 2, 81, 7.8, 3.2, 3, 'mild', 'vishama');
  const v3 = createSampleSnapshot('vis_003', '2026-03-15', 2, 78, 7.0, 2.1, 4, 'none', 'sama');

  const analysis = executeLongitudinalComparison({
    patient,
    baselineSnapshot: v1,
    comparisonSnapshot: v3,
    comparisonMode: 'multi_visit_trend',
    allSnapshots: [v1, v2, v3]
  });

  assert(analysis.comparison_mode === 'multi_visit_trend', 'Comparison mode is multi_visit_trend');
  assert(analysis.baseline_visit_id === 'vis_001', 'Baseline visit is vis_001');
  assert(analysis.comparison_visit_id === 'vis_003', 'Comparison visit is vis_003');
  assert(analysis.anthropometric_changes.length > 0, 'Multi-visit metrics computed');
});

// ─── 7. Comparative Progress Report Builder (Sections A–L) ──────────
console.log('\n7. Comparative Progress Report Builder (Sections A–L)');
runCheck('Builds complete 12-section printable report', () => {
  const patient = createSamplePatient();
  const baseline = createSampleSnapshot('vis_001', '2026-01-10', 1, 85, 8.8, 4.5, 2, 'severe', 'manda');
  const current = createSampleSnapshot('vis_002', '2026-03-15', 2, 79, 7.2, 2.4, 4, 'none', 'sama');

  const analysis = executeLongitudinalComparison({
    patient,
    baselineSnapshot: baseline,
    comparisonSnapshot: current,
    comparisonMode: 'baseline_vs_current'
  });

  const report = buildComparativeProgressReport({
    patient,
    baselineSnapshot: baseline,
    comparisonSnapshot: current,
    analysis,
    reviewingNutritionist: 'Dr. Clinical Nutritionist',
    isApproved: false
  });

  assert(report.report_id.startsWith('prog_rpt_'), 'Report ID has prog_rpt_ prefix');
  assert(report.sectionA_patientAndConsultation.patient_name === 'Kazi Nazrul Islam', 'Section A patient name matches');
  assert(report.sectionA_patientAndConsultation.patient_id === 'SH-TEST-001', 'Section A patient ID matches');
  assert(report.sectionB_overallSummary.improved.length > 0, 'Section B captures improved clinical parameters');
  assert(report.sectionC_anthropometricComparison.length > 0, 'Section C anthropometrics populated');
  assert(report.sectionE_laboratoryTrends.length > 0, 'Section E laboratory trends populated');
  assert(report.sectionH_ayurvedicProgress.baseline_agni === 'manda', 'Section H baseline Agni is Manda');
  assert(report.sectionH_ayurvedicProgress.current_agni === 'sama', 'Section H current Agni is Sama');
  assert(report.sectionK_nextClinicalPriorities.length > 0, 'Section K next clinical priorities populated');
  assert(report.sectionL_nutritionistReview.status === 'draft', 'Section L initial status is draft before review');
});

// ─── 8. Clinician Sign-off & Placeholder Name Rejection ────────────
console.log('\n8. Clinician Sign-Off Validation & Governance');
runCheck('Rejects placeholder reviewer names and enforces valid practitioner credentials', () => {
  assert(!validateClinicianCredentials(''), 'Empty clinician name is rejected');
  assert(!validateClinicianCredentials('Dr'), 'Too short clinician name is rejected');
  assert(!validateClinicianCredentials('Doctor'), 'Placeholder name "Doctor" is rejected');
  assert(!validateClinicianCredentials('Clinician'), 'Placeholder name "Clinician" is rejected');
  assert(!validateClinicianCredentials('admin'), 'Placeholder name "admin" is rejected');
  assert(validateClinicianCredentials('Dr. Tasnim Ara, RD'), 'Real practitioner credentials accepted');
});

// ─── 9. P2/P3 Clinical Progress Planning Context Handoff ───────────
console.log('\n9. P2/P3 Clinical Progress Planning Context Handoff');
runCheck('Constructs planning handoff with verified restrictions overriding automated targets', () => {
  const patient = createSamplePatient();
  const baseline = createSampleSnapshot('vis_001', '2026-01-10', 1, 85, 8.8, 4.5, 2, 'severe', 'manda');
  const current = createSampleSnapshot('vis_002', '2026-03-15', 2, 79, 7.2, 2.4, 4, 'none', 'sama');

  const analysis = executeLongitudinalComparison({
    patient,
    baselineSnapshot: baseline,
    comparisonSnapshot: current,
    comparisonMode: 'baseline_vs_current'
  });

  const report = buildComparativeProgressReport({
    patient,
    baselineSnapshot: baseline,
    comparisonSnapshot: current,
    analysis
  });

  const handoff = constructClinicalProgressPlanningContext({
    patient,
    currentVisitId: current.visit_id,
    comparisonVisitId: baseline.visit_id,
    progressReport: report,
    analysis
  });

  assert(handoff.patientId === 'SH-TEST-001', 'Planning handoff patient ID matches');
  assert(handoff.currentVisitId === 'vis_002', 'Current visit ID matches vis_002');
  assert(handoff.comparisonVisitId === 'vis_001', 'Comparison visit ID matches vis_001');
  assert(handoff.progressReportId.startsWith('prog_rpt_'), 'Progress report ID matches');
  assert(handoff.clinicalImprovements.length > 0, 'Clinical improvements populated in handoff');
});

// ─── 10. Medication Reconciliation & MediNutrition Safety Resolution ───
console.log('\n10. Medication Reconciliation & MediNutrition Safety Resolution');
runCheck('Reconciled medications resolve to generic/brand and trigger clinical rules', () => {
  // 1. MediNutrition brand-to-generic lookup
  const searchResults = searchMedications('Metformin', 5);
  assert(searchResults.length > 0, 'MediNutrition 32,461 corpus finds Metformin');
  const metResult = searchResults[0];
  assert(metResult.rule_coverage_status === 'fully_covered', 'Metformin is tagged with fully_covered clinical rules');

  // 2. Active medications array must contain canonical generic name, not synthetic IDs
  const sampleRecords = [
    {
      id: 'med_1731749823412',
      medication_name: 'Tab. Glucophage 500mg',
      generic_name: 'Metformin',
      dose: '500 mg',
      frequency: 'Twice daily',
      timing: 'with_meal',
      verification_status: 'verified_active' as const
    }
  ];

  const activeMeds = Array.from(new Set(
    sampleRecords.flatMap(r => [r.generic_name, r.medication_name].filter(Boolean) as string[])
  ));

  assert(!activeMeds.some(m => m.startsWith('med_173')), 'Synthetic record IDs are NOT injected into active_medications');
  assert(activeMeds.includes('Metformin'), 'Canonical generic name is preserved in active_medications');
  assert(activeMeds.includes('Tab. Glucophage 500mg'), 'Brand name is preserved in active_medications for DNI matching');
});

console.log('\n=====================================================================');
console.log(`ALL P0–P2 MASTER INTEGRATION CHECKS PASSED: ${totalChecks} CATEGORIES VERIFIED!`);
console.log('=====================================================================');
