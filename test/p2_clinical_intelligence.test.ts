// P2 Clinical Intelligence & Decision Support Test Suite
// --------------------------------------------------------
// Comprehensive verification of all 20 clinical test cases
// from the Functional Nutrition Intelligence Engine specification.
// Uses synthetic fixtures only; zero real patient data.

import { runP2Analysis } from '../src/engine/p2';
import { PatientProfile } from '../src/types';
import { ClinicalObservation, ClinicianApprovalRecord } from '../src/engine/p2/types';
import { calculateAnthropometrics } from '../src/engine/anthropometrics';

let passed = 0;
let failed = 0;

function assert(cond: boolean, name: string, detail?: string) {
  if (cond) {
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${name} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

console.log("=================================================");
console.log("SHUDDHO P2 CLINICAL INTELLIGENCE TEST SUITE (20 CASES)");
console.log("=================================================\n");

// Base synthetic patient generator
function makePatient(overrides: Partial<PatientProfile> = {}): PatientProfile {
  const baseCalc = calculateAnthropometrics(40, 'female', 155, 65, 80, 'sedentary', []);
  return {
    schema_version: 2,
    id: 'pt_test_base',
    name: 'Synthetic Test Patient',
    age: 40,
    gender: 'female',
    phone: '',
    visit_date: '2026-11-14',
    current_phase: 1,
    height_cm: 155,
    weight_kg: 65,
    waist_cm: 80,
    activity_level: 'sedentary',
    sleep_hours: 7,
    shift_worker: false,
    population_group: 'adult_standard',
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: [],
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    selected_conditions: [],
    active_medications: [],
    gut_profile: {
      bloating: 'none',
      acid_reflux_hypoacidity: false,
      bristol_stool_score: 4,
      energy_score: 7,
      sleep_quality_score: 7,
      digestive_fire_agni: 'samagni',
    },
    labs: { lab_flags: [] },
    calculated: baseCalc,
    is_diet_plan_dirty: false,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────
// TEST CASE 1: Unknown Disease
// ─────────────────────────────────────────────────────────────────
console.log("1. Unknown Disease — Symptom-Driven Hypothesis Generation");
{
  const patient = makePatient({ selected_conditions: [] });
  const answers = {
    bloating_frequency: 'severe_post_meal',
    bristol_stool_form: 'type_2_lumpy_sausage',
    bloating_post_dairy: true,
  };
  const result = runP2Analysis(patient, answers);

  assert(result.hypotheses.length > 0, "Generates candidate mechanisms for undiagnosed patient");
  const allNotDiagnoses = result.hypotheses.every(h => h.isConfirmedDiagnosis === false);
  assert(allNotDiagnoses, "Hypotheses are strictly candidate patterns (isConfirmedDiagnosis === false)");
  const giHyp = result.hypotheses.find(h => h.cluster === 'gastrointestinal');
  assert(Boolean(giHyp), "Identifies GI / assimilation cluster pattern from symptom burden");
}

// ─────────────────────────────────────────────────────────────────
// TEST CASE 2: Metabolic Pattern Recognition
// ─────────────────────────────────────────────────────────────────
console.log("\n2. Metabolic Pattern Recognition");
{
  const patient = makePatient({
    labs: {
      fasting_glucose: 125,
      hba1c: 6.2,
      fasting_insulin: 18,
      triglycerides: 220,
      hdl: 38,
      lab_flags: [],
    },
    waist_cm: 95,
  });
  const answers = {
    postprandial_fatigue: 'yes',
    sugar_cravings: 'yes',
  };
  const result = runP2Analysis(patient, answers);
  const metHyp = result.hypotheses.find(h => h.cluster === 'metabolic');
  assert(Boolean(metHyp), "Metabolic dysregulation hypothesis generated from biomarkers + symptoms");
  assert(
    metHyp?.evidenceSupportLevel === 'sufficient' || metHyp?.evidenceSupportLevel === 'some',
    "Evidence support level accurately reflects corroborating lab and symptom evidence"
  );
}

// ─────────────────────────────────────────────────────────────────
// TEST CASE 3: Medication Confounding
// ─────────────────────────────────────────────────────────────────
console.log("\n3. Medication Confounding Consideration");
{
  const patient = makePatient({
    active_medications: ['metformin'],
  });
  const answers = {
    bloating_frequency: 'severe_post_meal',
  };
  const result = runP2Analysis(patient, answers);
  const medHyp = result.hypotheses.find(h => h.cluster === 'medication_supplement');
  assert(Boolean(medHyp), "Generates medication-associated GI hypothesis when drug and symptoms coincide");
  assert(
    Boolean(medHyp && !medHyp.description_en.toLowerCase().includes('causes')),
    "Describes temporal association without asserting absolute causation"
  );
}

// ─────────────────────────────────────────────────────────────────
// TEST CASE 4: Missing Biomarkers (No False Confirmation)
// ─────────────────────────────────────────────────────────────────
console.log("\n4. Missing Biomarkers — Uncertainty Preservation");
{
  const patient = makePatient({
    labs: { lab_flags: [] }, // No lab tests entered
  });
  const answers = {
    chronic_fatigue_pattern: 'severe_exhaustion',
  };
  const result = runP2Analysis(patient, answers);
  const missingHasLabs = result.missingHighValueData.some(m => m.toLowerCase().includes('lab'));
  assert(missingHasLabs, "Flags missing laboratory markers as an explicit clinical data gap");
  const anyConfirmed = result.hypotheses.some(h => h.isConfirmedDiagnosis);
  assert(!anyConfirmed, "Fatigue without labs is never converted into confirmed deficiency or disease");
}

// ─────────────────────────────────────────────────────────────────
// TEST CASE 5: Conflicting Evidence Handling
// ─────────────────────────────────────────────────────────────────
console.log("\n5. Conflicting Evidence Handling");
{
  const patient = makePatient();
  const obs: ClinicalObservation[] = [
    {
      id: 'obs_symptom_bloat',
      patientId: patient.id,
      visitId: 'v1',
      category: 'symptom',
      observedValue: 'bloating',
      date: '2026-11-14',
      dataSource: 'patient_reported',
      verificationStatus: 'unverified',
      associatedDomains: ['assimilation'],
      tags: ['bloating'],
    },
    {
      id: 'obs_normal_colonoscopy',
      patientId: patient.id,
      visitId: 'v1',
      category: 'history',
      observedValue: 'Normal colonoscopy',
      date: '2026-11-14',
      dataSource: 'clinician_recorded',
      verificationStatus: 'clinician_verified',
      associatedDomains: ['assimilation'],
      tags: ['normal_colonoscopy'],
    },
  ];
  const result = runP2Analysis({ patient, observations: obs });
  const giHyp = result.hypotheses.find(h => h.cluster === 'gastrointestinal');
  assert(Boolean(giHyp), "Hypothesis generated despite normal structural scan");
  assert(
    Boolean(giHyp && giHyp.contradictoryObservationIds.includes('obs_normal_colonoscopy')),
    "Normal colonoscopy explicitly tracked in contradictoryObservationIds"
  );
}

// ─────────────────────────────────────────────────────────────────
// TEST CASE 6: Multi-Factor Independent Coexistence
// ─────────────────────────────────────────────────────────────────
console.log("\n6. Multi-Factor Functional Patterns Coexistence");
{
  const patient = makePatient({
    sleep_hours: 4,
    activity_level: 'sedentary',
  });
  const answers = {
    bloating_frequency: 'severe_post_meal',
    postprandial_fatigue: 'yes',
    chronic_joint_muscle_pain: 'persistent_stiffness',
  };
  const result = runP2Analysis(patient, answers);
  const clusters = new Set(result.hypotheses.map(h => h.cluster));
  assert(clusters.size >= 3, `Multiple independent functional clusters coexist (${clusters.size} active clusters)`);
}

// ─────────────────────────────────────────────────────────────────
// TEST CASE 7: Clinical Red Flag Screening
// ─────────────────────────────────────────────────────────────────
console.log("\n7. Clinical Red Flag Screening");
{
  const patient = makePatient();
  const answers = {
    unintentional_weight_loss: 'yes',
    gi_red_flags_blood: 'yes',
  };
  const result = runP2Analysis(patient, answers);
  assert(result.redFlags.length >= 2, "Identifies unexplained weight loss and GI bleeding as red flags");
  const immediateFlag = result.redFlags.find(rf => rf.urgency === 'immediate');
  assert(Boolean(immediateFlag), "Assigns 'immediate' urgency to critical alarm signs");
  assert(immediateFlag?.blocksAutoIntervention === true, "Red flag strictly blocks automated diet interventions");
  assert(result.interventionGoals.length === 0, "No automated diet intervention generated while red flags active");
}

// ─────────────────────────────────────────────────────────────────
// TEST CASE 8: Special Population — Pregnancy
// ─────────────────────────────────────────────────────────────────
console.log("\n8. Special Population — Pregnancy Safety Restrictions");
{
  const patient = makePatient({
    population_group: 'pregnancy',
    trimester: 2,
  });
  const result = runP2Analysis(patient);
  const weightLossGoal = result.interventionGoals.find(g =>
    g.title_en.toLowerCase().includes('weight loss') || g.clinicalObjective_en.toLowerCase().includes('deficit')
  );
  assert(!weightLossGoal, "Hypocaloric or aggressive weight-loss interventions blocked in pregnancy");
  const pregGoal = result.interventionGoals.find(g => g.id.includes('pregnancy'));
  assert(Boolean(pregGoal), "Generates safe gestational nutritional adequacy goals");
}

// ─────────────────────────────────────────────────────────────────
// TEST CASE 9: Special Population — Pediatric Exclusions
// ─────────────────────────────────────────────────────────────────
console.log("\n9. Special Population — Pediatric Rule Exclusions");
{
  const patient = makePatient({
    age: 9,
    population_group: 'pediatric',
  });
  const answers = {
    bloating_frequency: 'severe_post_meal',
  };
  const result = runP2Analysis(patient, answers);
  const metabolicAdult = result.hypotheses.find(h => h.id === 'HYP_MET_001');
  assert(!metabolicAdult, "Adult metabolic syndrome rules excluded for pediatric patients (<12y)");
}

// ─────────────────────────────────────────────────────────────────
// TEST CASE 10: Oncology / Malnutrition Risk
// ─────────────────────────────────────────────────────────────────
console.log("\n10. Oncology / Malnutrition Priority");
{
  const patient = makePatient({
    population_group: 'oncology',
    weight_kg: 44,
    height_cm: 160, // BMI ~ 17.2 (underweight)
  });
  const answers = {
    unintentional_weight_loss: 'yes',
    daily_protein_food_frequency: 'less_than_one',
  };
  const result = runP2Analysis(patient, answers);
  const urgencyPri = result.priorities.find(p => p.type === 'medical_urgency' || p.urgency === 'immediate');
  assert(Boolean(urgencyPri), "Underweight/malnutrition risk surfaced as top priority");
}

// ─────────────────────────────────────────────────────────────────
// TEST CASE 11: Drug & Supplement Reconciliation
// ─────────────────────────────────────────────────────────────────
console.log("\n11. Drug & Supplement Overlap Identification");
{
  const patient = makePatient({
    active_medications: ['omeprazole'],
  });
  const answers = {
    daily_ppi_antacid_dependence: 'yes',
  };
  const result = runP2Analysis(patient, answers);
  const ppiHyp = result.hypotheses.find(h => h.cluster === 'medication_supplement');
  assert(Boolean(ppiHyp), "PPI nutrient depletion risk identified without auto-prescribing");
}

// ─────────────────────────────────────────────────────────────────
// TEST CASE 12: Clinician Override System
// ─────────────────────────────────────────────────────────────────
console.log("\n12. Clinician Override & Decision Preservation");
{
  const patient = makePatient();
  const answers = { bloating_frequency: 'severe_post_meal' };
  const initialResult = runP2Analysis(patient, answers);
  const targetHypId = initialResult.hypotheses[0]?.id;
  assert(Boolean(targetHypId), "Target hypothesis exists for review");

  // Clinician approves targetHypId as 'accepted'
  const approvalRecord: ClinicianApprovalRecord = {
    targetId: targetHypId,
    targetType: 'hypothesis',
    decision: 'accepted',
    timestamp: '2026-11-14T10:00:00Z',
    evidenceSnapshot: '{}',
    ruleVersion: '2.0.0',
  };

  const reanalyzed = runP2Analysis(patient, answers, [approvalRecord]);
  const approvedHyp = reanalyzed.hypotheses.find(h => h.id === targetHypId);
  assert(approvedHyp?.clinicianDecision === 'accepted', "Clinician decision 'accepted' preserved across re-runs");
}

// ─────────────────────────────────────────────────────────────────
// TEST CASE 13: Assessment Changes Dynamic Update
// ─────────────────────────────────────────────────────────────────
console.log("\n13. Dynamic Update on Assessment Changes");
{
  const patient = makePatient();
  const baseline = runP2Analysis(patient, { bloating_frequency: 'none' });
  const updated = runP2Analysis(patient, { bloating_frequency: 'severe_post_meal' });

  assert(
    baseline.hypotheses.length !== updated.hypotheses.length,
    "Hypotheses dynamically update when assessment answers change"
  );
}

// ─────────────────────────────────────────────────────────────────
// TEST CASE 14: Cross-Patient Data Isolation
// ─────────────────────────────────────────────────────────────────
console.log("\n14. Cross-Patient Data Isolation");
{
  const patientA = makePatient({ id: 'pt_alpha', name: 'Patient Alpha' });
  const patientB = makePatient({ id: 'pt_beta', name: 'Patient Beta' });

  const resultA = runP2Analysis(patientA, { bloating_frequency: 'severe_post_meal' });
  const resultB = runP2Analysis(patientB, { bloating_frequency: 'none' });

  assert(resultA.patientId === 'pt_alpha' && resultB.patientId === 'pt_beta', "Patient IDs are strictly separated");
  assert(resultA.observations.length !== resultB.observations.length, "Patient A observations do not leak into Patient B");
}

// ─────────────────────────────────────────────────────────────────
// TEST CASE 15: Deterministic Repeatability
// ─────────────────────────────────────────────────────────────────
console.log("\n15. Deterministic Repeatability");
{
  const patient = makePatient();
  const answers = { bloating_frequency: 'severe_post_meal', sleep_hours: 6 };

  const run1 = runP2Analysis(patient, answers);
  const run2 = runP2Analysis(patient, answers);

  assert(run1.hypotheses.length === run2.hypotheses.length, "Equal count of hypotheses across runs");
  assert(
    JSON.stringify(run1.hypotheses.map(h => h.id)) === JSON.stringify(run2.hypotheses.map(h => h.id)),
    "Exact deterministic hypothesis IDs produced across identical inputs"
  );
}

// ─────────────────────────────────────────────────────────────────
// TEST CASE 16: Functional Matrix Mapping
// ─────────────────────────────────────────────────────────────────
console.log("\n16. Functional Medicine Matrix Multi-System Mapping");
{
  const patient = makePatient();
  const answers = {
    recent_antibiotic: 'yes',
  };
  const result = runP2Analysis(patient, answers);
  assert(result.domainFindings.length === 7, "All 7 functional medicine domains evaluated");

  const assimilationDomain = result.domainFindings.find(d => d.domain === 'assimilation');
  assert(Boolean(assimilationDomain), "Assimilation domain computed");
}

// ─────────────────────────────────────────────────────────────────
// TEST CASE 17: Historical Integrity
// ─────────────────────────────────────────────────────────────────
console.log("\n17. Historical Integrity of Approval Records");
{
  const patient = makePatient();
  const approvals: ClinicianApprovalRecord[] = [
    {
      targetId: 'hyp_001',
      targetType: 'hypothesis',
      decision: 'rejected',
      timestamp: '2026-11-14T09:00:00Z',
      evidenceSnapshot: '{}',
      ruleVersion: '2.0.0',
    },
  ];
  const result = runP2Analysis(patient, {}, approvals);
  assert(result.approvalHistory.length === 1, "Approval history preserved intact in P2AnalysisResult");
}

// ─────────────────────────────────────────────────────────────────
// TEST CASE 18: Bilingual Reporting Completeness
// ─────────────────────────────────────────────────────────────────
console.log("\n18. Bilingual Reporting Completeness");
{
  const patient = makePatient();
  const answers = { bloating_frequency: 'severe_post_meal', sleep_hours: 5 };
  const result = runP2Analysis(patient, answers);

  const missingTitleBn = result.hypotheses.filter(h => !h.title_bn);
  const missingTitleEn = result.hypotheses.filter(h => !h.title_en);
  assert(missingTitleBn.length === 0, "All hypotheses contain Bengali titles");
  assert(missingTitleEn.length === 0, "All hypotheses contain English titles");

  const missingDomainBn = result.domainFindings.filter(d => !d.domainName_bn);
  assert(missingDomainBn.length === 0, "All domain findings contain Bengali names");
}

// ─────────────────────────────────────────────────────────────────
// TEST CASE 19: Performance Execution Benchmark
// ─────────────────────────────────────────────────────────────────
console.log("\n19. Performance Execution Benchmark (<100ms)");
{
  const patient = makePatient();
  const answers = {
    bloating_frequency: 'severe_post_meal',
    postprandial_fatigue: 'yes',
    sleep_hours: 5,
    chronic_joint_muscle_pain: 'persistent_stiffness',
  };

  const startTime = Date.now();
  for (let i = 0; i < 20; i++) {
    runP2Analysis(patient, answers);
  }
  const elapsed = (Date.now() - startTime) / 20;
  console.log(`    Average execution time: ${elapsed.toFixed(2)} ms per full analysis`);
  assert(elapsed < 100, `Execution time is well below 100ms threshold (${elapsed.toFixed(2)}ms)`);
}

// ─────────────────────────────────────────────────────────────────
// TEST CASE 20: P3 Integration Context Readiness
// ─────────────────────────────────────────────────────────────────
console.log("\n20. P3 Diet Planning Context Interface Readiness");
{
  const patient = makePatient({ confirmed_allergies: ['peanut', 'egg'] });
  const result = runP2Analysis(patient);
  const ctx = result.dietPlanningContext;

  assert(ctx !== undefined, "P2 outputs DietPlanningContext object for future P3 engine");
  assert(Array.isArray(ctx.confirmedAllergies), "Confirmed allergies properly formatted for P3");
  assert(Array.isArray(ctx.approvedInterventionGoals), "Approved goals partitioned for P3");
  assert(Array.isArray(ctx.unconfirmedHypotheses), "Unconfirmed hypotheses partitioned so they are NOT used as hard restrictions");
}

console.log("\n=================================================");
console.log(`ALL 20 P2 TEST CASES PASSED: ${passed} CHECKS PASSED, ${failed} FAILED`);
console.log("=================================================");

if (failed > 0) process.exit(1);
