// Phase P2 Advanced Clinical Intelligence Test Suite
// Verifies 7-Domain Functional Matrix, Lab Recommendations, Ayurvedic & Masanumasika Analysis,
// Dietary Pattern & PRAL, Metabolic & Gut Health, Pre-Intervention Health Report, and P3 Planning Handoff.

import { runP2Analysis } from '../src/engine/p2';
import { PatientProfile } from '../src/types';
import { calculateAnthropometrics } from '../src/engine/anthropometrics';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

function makeSyntheticPatient(overrides: Partial<PatientProfile> = {}): PatientProfile {
  const baseCalc = calculateAnthropometrics(45, 'female', 155, 68, 86, 'sedentary', ['t2d_ir']);
  return {
    schema_version: 2,
    id: 'pt_test_p2',
    name: 'Mrs. Test Patient',
    age: 45,
    gender: 'female',
    phone: '01700-000000',
    visit_date: '2026-11-15',
    current_phase: 1,
    height_cm: 155,
    weight_kg: 68,
    waist_cm: 86,
    activity_level: 'sedentary',
    sleep_hours: 6,
    shift_worker: false,
    population_group: 'adult_standard',
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: ['shrimp', 'peanut'],
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    selected_conditions: ['t2d_ir'],
    active_medications: ['metformin', 'gliclazide'],
    gut_profile: {
      bloating: 'mild',
      acid_reflux_hypoacidity: false,
      bristol_stool_score: 4,
      energy_score: 5,
      sleep_quality_score: 6,
      digestive_fire_agni: 'samagni',
    },
    labs: {
      fasting_glucose: 140,
      fasting_insulin: 16,
      hba1c: 7.2,
      triglycerides: 210,
      hdl: 36,
      ferritin: 22,
      lab_flags: [],
    },
    calculated: baseCalc,
    is_diet_plan_dirty: false,
    ...overrides,
  };
}

console.log("=====================================================================");
console.log("SHUDDHO PHASE P2 ADVANCED CLINICAL INTELLIGENCE VERIFICATION SUITE");
console.log("=====================================================================\n");

// ─── 1. Functional Matrix & Insufficient Data Handling ───────────
console.log("1. 7-Domain Functional Matrix & Data Gap Status");
{
  const patient = makeSyntheticPatient({ selected_conditions: [] });
  const result = runP2Analysis(patient, {});

  assert(result.domainFindings.length === 7, "Matrix contains exactly 7 functional medicine domains");
  const allDomains = ['assimilation', 'defense_repair', 'energy', 'biotransformation', 'transport', 'communication', 'structural_integrity'];
  const hasAll = allDomains.every(d => result.domainFindings.some(f => f.domain === d));
  assert(hasAll, "All 7 specific functional domains are represented");

  // An unobserved domain with no pertinent negatives should be 'insufficient_data', never false 'no dysfunction'
  const unassessedDomain = result.domainFindings.find(f => f.domain === 'communication');
  assert(
    unassessedDomain !== undefined && unassessedDomain.overallBurden === 'insufficient_data',
    "Unassessed domain correctly reports 'insufficient_data' without falsely claiming 'no dysfunction'"
  );
}

// ─── 2. Personalized Laboratory Recommendation Engine ─────────────
console.log("\n2. Personalized Laboratory Recommendation Engine");
{
  const patient = makeSyntheticPatient({
    active_medications: ['insulin_glargine', 'gliclazide'],
    labs: { lab_flags: [] }, // No glucose lab on file
  });
  const result = runP2Analysis(patient, {});

  assert(result.labRecommendations.length > 0, "Generates personalized lab recommendations");

  // Immediate priority check for hypoglycemic medication without recent glucose test
  const fbgRec = result.labRecommendations.find(r => r.id === 'lab_fasting_glucose');
  assert(fbgRec !== undefined, "Recommends Fasting Blood Glucose");
  assert(
    fbgRec?.priority === 'immediate_clinical_evaluation',
    "Elevates glucose test to 'immediate_clinical_evaluation' due to active hypoglycemic medication risk",
    `Priority was ${fbgRec?.priority}`
  );

  // Check tested status reflection
  const patientWithLabs = makeSyntheticPatient({
    labs: { fasting_glucose: 110, hba1c: 6.5, ferritin: 45, lab_flags: [] },
  });
  const resultWithLabs = runP2Analysis(patientWithLabs, {});
  const hba1cRec = resultWithLabs.labRecommendations.find(r => r.id === 'lab_hba1c');
  assert(hba1cRec?.existingTestStatus === 'tested', "Recognizes existing HbA1c test and marks status as 'tested'");
  assert(hba1cRec?.lastKnownValue === 6.5, "Preserves last recorded value for clinician review");

  // Verify non-duplicative panel categorization
  const categories = new Set(result.labRecommendations.map(r => r.category));
  assert(categories.has('metabolic') && categories.has('hematology_iron'), "Categorizes tests into clinical panels");
}

// ─── 3. Ayurvedic Prakriti-Vikriti & Agni Assessment ───────────────
console.log("\n3. Ayurvedic Interpretation & Clinical Safety Primacy");
{
  const patient = makeSyntheticPatient({
    confirmed_allergies: ['dairy', 'cow_milk'],
  });
  const answers = {
    q_ayur_prakriti_body_frame: 'medium_muscular',
    q_ayur_prakriti_skin: 'warm_sensitive_oily',
    q_ayur_prakriti_temperature: 'easily_overheated',
    q_gi_heartburn: 'daily',
    q_gi_acid_reflux: 'daily',
  };
  const result = runP2Analysis(patient, answers);

  const ayur = result.ayurvedicInterpretation;
  assert(ayur !== undefined, "Generates Ayurvedic interpretation result");
  assert(ayur.prakriti.dominant_constitution.includes('Pitta'), "Correctly identifies dominant Pitta Prakriti from constitutional markers");
  assert(ayur.agni.type === 'tikshnagni', "Correctly assesses Tikshnagni (sharp/hyper-metabolic fire) from heartburn/acid reflux symptoms");

  // Clinical Safety Primacy: Dairy allergy must suppress milk/curd/takra
  const hasDairyInPathya = ayur.pathya_apathya_handoff.pathya_foods_bn.some(f => /milk|ghol|buttermilk|chhena|curd/i.test(f));
  assert(!hasDairyInPathya, "Clinical Safety Primacy: Confirmed dairy allergy strictly eliminates dairy products from favorable Ayurvedic foods");
  assert(ayur.clinicalSafetyPrimacyNote.includes('CLINICAL SAFETY PRIMACY'), "Includes explicit Clinical Safety Primacy notice");
}

// ─── 4. Masanumasika Pregnancy Nutrition Analysis ─────────────────
console.log("\n4. 9-Month Masanumasika Pregnancy Nutrition Analysis");
{
  // Test Non-pregnant patient
  const nonPregPatient = makeSyntheticPatient({ population_group: 'adult_standard' });
  const nonPregResult = runP2Analysis(nonPregPatient, {});
  assert(nonPregResult.masanumasikaAnalysis.applicable === false, "Returns applicable: false for non-pregnant patient");

  // Test Pregnant patient in Month 5 (Week 20)
  const pregPatient = makeSyntheticPatient({
    population_group: 'pregnancy',
    trimester: 2,
  });
  const answers = {
    q_pregnancy_gestational_weeks: 20,
    q_pregnancy_gestational_days: 2,
  };
  const pregResult = runP2Analysis(pregPatient, answers);
  const masanu = pregResult.masanumasikaAnalysis;

  assert(masanu.applicable === true, "Identifies pregnant patient and enables Masanumasika analysis");
  assert(masanu.pregnancyMonth === 5, "Calculates accurate pregnancy month (Month 5 for 20 weeks)");
  assert(masanu.trimester === 2, "Identifies Trimester 2");
  assert(masanu.maternalNutritionalPriorities !== undefined && masanu.maternalNutritionalPriorities.length > 0, "Provides trimester-specific maternal nutritional priorities");

  // Non-pharmacological boundary check
  assert(
    masanu.safetyBoundaryNotice.includes('STRICT MATERNAL SAFETY BOUNDARY') &&
    masanu.safetyBoundaryNotice.includes('medicinal herbs'),
    "Strictly enforces non-pharmacological boundary (prohibits medicinal herbs, bhasmas, panchakarma)"
  );
}

// ─── 5. Dietary Pattern & Potential Renal Acid Load (PRAL) ────────
console.log("\n5. Dietary Pattern & PRAL Acid Load Analysis");
{
  const patient = makeSyntheticPatient();
  const answers = {
    ffq_leafy_greens: '4_6_week',
    ffq_cruciferous: '1_3_week',
    ffq_root_tubers: 'daily',
    ffq_gourds_squash: '4_6_week',
    ffq_other_colored_veg: 'daily',
    ffq_fresh_fruits: 'daily',
    ffq_lentils_pulses: 'daily',
    ffq_whole_grains: 'daily',
    ffq_nuts_seeds: '1_3_week',
    ffq_herbs_alliums: 'daily',
    ffq_fermented_foods: '0_times', // Confirmed zero
    ffq_healthy_plant_fats: 'daily',
    ffq_bakery_biscuits: '1_3_week',
    ffq_deep_fried: '0_times',
    ffq_sweetened_beverages: '0_times',
  };
  const result = runP2Analysis(patient, answers);
  const dp = result.dietaryPatternAnalysis;

  assert(dp.plantFoodGroupDiversityScore >= 10, "Accurately scores plant food diversity (>= 10 out of 12 groups)");
  assert(dp.plantDiversityRank === 'high', "Classifies plant diversity as 'high'");
  assert(dp.confirmedZeroCount >= 1, "Differentiates confirmed zero intake from missing responses");
  assert(
    dp.pralStatus === 'insufficient_quantitative_data' && (dp.estimatedPRALScore === null || dp.estimatedPRALScore === undefined),
    "Refuses to generate fabricated numerical PRAL score without quantified nutrient gram data (returns insufficient_quantitative_data)"
  );
  assert(
    dp.pralCaveat.includes('CLINICAL CAVEAT') && dp.pralCaveat.includes('systemic arterial blood pH'),
    "Includes mandatory caveat stating PRAL reflects renal mineral solute load, not systemic blood pH"
  );
}

// ─── 6. Metabolic Dynamics & Gut Transit Health ────────────────────
console.log("\n6. Metabolic Health & Gut Transit Dynamics");
{
  const patient = makeSyntheticPatient({
    active_medications: ['gliclazide', 'metformin'],
    labs: { fasting_glucose: 130, fasting_insulin: 15, lab_flags: [] },
  });
  const answers = {
    q_gi_stool_form: 'type_1_2',
    q_gi_bloating: 'frequent',
  };
  const result = runP2Analysis(patient, answers);

  const metab = result.metabolicHealthAnalysis;
  assert(metab.hypoglycemicMedicationActive === true, "Flags active hypoglycemic medication (gliclazide)");
  assert(metab.medicationMealSafetyPriority === true, "Enforces medication meal safety priority (prevents fasting hypoglycemia)");
  assert(metab.homaIrAnalysis !== undefined && metab.homaIrAnalysis.status === 'significant_insulin_resistance', "Computes and categorizes HOMA-IR from glucose & insulin");

  const gut = result.gutHealthAnalysis;
  assert(gut.transitTimeEstimate === 'delayed_constipation', "Correctly interprets Bristol Type 1-2 as delayed constipation transit");
  assert(gut.microbiomeTestingCaveat.includes('CLINICAL CAVEAT'), "Includes microbiome testing disclaimer");
}

// ─── 7. Pre-Intervention Clinical Health Assessment Report ────────
console.log("\n7. Clinical Health Assessment Report (Sections A–N)");
{
  const patient = makeSyntheticPatient();
  const result = runP2Analysis(patient, {});
  const report = result.report;

  assert(report !== undefined, "Generates structured ClinicalHealthAssessmentReport");
  assert(Boolean(report.sectionA_patientInfo.id), "Section A: Patient identification present");
  assert(report.sectionB_anthropometrics.bmi > 0, "Section B: Anthropometrics and BMI calculated");
  assert(Boolean(report.sectionC_clinicalHistory), "Section C: Clinical history present");
  assert(report.sectionD_functionalMatrix.length === 7, "Section D: 7-domain matrix present in report");
  assert(Boolean(report.sectionE_dietaryPattern), "Section E: Dietary pattern & PRAL present in report");
  assert(Boolean(report.sectionF_ayurvedicAssessment), "Section F: Ayurvedic interpretation present in report");
  assert(report.sectionH_laboratoryFindings.availableResults.length > 0, "Section H: Available laboratory results formatted");
  assert(report.sectionI_rootCauseHypotheses.length > 0, "Section I: Clinical hypotheses present");
  assert(Boolean(report.sectionJ_medicationReview), "Section J: Medication review & depletions present");
  assert(report.sectionK_clinicalSafety.confirmedAllergies.length > 0, "Section K: Safety & allergies highlighted");
  assert(report.sectionL_laboratoryRecommendations.length > 0, "Section L: Lab recommendations included");
  assert(report.sectionM_clinicalPriorities.length > 0, "Section M: Ranked priorities included");
  assert(Boolean(report.sectionN_clinicianReview), "Section N: Clinician review and sign-off block present");
}

// ─── 8. Phase P3 Nutrition Planning Handoff Contract ──────────────
console.log("\n8. Phase P3 Planning Handoff Contract");
{
  const patient = makeSyntheticPatient({
    selected_conditions: ['t2d_ir', 'hypertension_ckd'],
    clinical_pathways: ['renal'],
    confirmed_allergies: ['peanut'],
  });
  const result = runP2Analysis(patient, {});
  const p3 = result.p3PlanningContext;

  assert(p3 !== undefined, "Generates structured P3NutritionPlanningContext");
  assert(p3.energyTargetCalories > 0, "Calculates safe baseline energy target");
  assert(p3.proteinTargetGrams > 0, "Calculates protein target with clinical constraints");
  assert(p3.confirmedAllergies.includes('peanut'), "Passes confirmed allergies to P3");
  assert(p3.hardRestrictions.some(r => r.type === 'confirmed_allergy'), "Translates confirmed allergies to hard restrictions");
  assert(p3.prescribedProteinCap_g !== undefined, "Enforces protein cap for renal impairment (CKD)");
}

console.log("\n=====================================================================");
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("=====================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("ALL PHASE P2 ADVANCED INTELLIGENCE TESTS PASSED CLEANLY!");
}
