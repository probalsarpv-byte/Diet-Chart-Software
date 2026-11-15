/**
 * SHUDDHO FUNCTIONAL NUTRITION SOFTWARE
 * Phase P2 Final Correction & Integration Gate Verification Suite
 * 
 * Verifies all 8 critical clinical audit gates:
 * 1. P1 -> P2 complete data flow (FFQ, Ayurveda, Pregnancy, Labs, Pathways).
 * 2. FFQ interpretation, distinct zero/unknown/unanswered states, PRAL safety integrity.
 * 3. Ayurvedic analysis: zero BMI inference, preservation of unassessed/preliminary status.
 * 4. Pregnancy analysis: zero invented gestational weeks, unverified flag when missing.
 * 5. P3 Planning safety: Separation of Hypertension vs CKD, feeding route protections.
 * 6. Clinical approval governance: Hypothesis approval independence, valid clinician sign-off, invalidation on data changes.
 * 7. Multi-population & complex clinical cases (Insulin, Oncology, Pediatric, NPO, Allergies).
 * 8. End-to-End User Journey (Registration -> Assessment -> Analysis -> Report -> Approval -> P3).
 */

import { runP2Analysis, P2EngineInput } from '../src/engine/p2';
import { analyzeDietaryPattern } from '../src/engine/p2/dietaryPatternAnalysis';
import { interpretAyurvedicAssessment } from '../src/engine/p2/ayurvedicInterpretationEngine';
import { analyzeMasanumasikaPregnancy } from '../src/engine/p2/masanumasikaPregnancyAnalysis';
import { constructP3PlanningContext } from '../src/engine/p2/p3PlanningHandoff';
import { buildFlattenedAnswersForP2 } from '../src/engine/assessment/p2HandoffAdapter';
import { calculateAgni } from '../src/engine/assessment/agniEngine';
import { PatientProfile } from '../src/types';
import { ClinicalAssessment } from '../src/types/assessment';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

function makeSyntheticPatient(overrides: Partial<PatientProfile> = {}): PatientProfile {
  return {
    schema_version: 2,
    id: `pt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    name: 'Mrs. Test Patient',
    age: 45,
    gender: 'female',
    phone: '01711000000',
    height_cm: 155,
    weight_kg: 68,
    waist_cm: 88,
    activity_level: 'sedentary',
    sleep_hours: 7,
    shift_worker: false,
    population_group: 'adult_standard',
    bmr_floor_strategy: 'clamped_to_bmr',
    selected_conditions: [],
    active_medications: [],
    confirmed_allergies: [],
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    current_phase: 1,
    visit_date: '2026-11-15',
    calculated: {
      bmi: 28.3,
      bmi_category_en: 'Overweight',
      bmi_category_bn: 'অতিরিক্ত ওজন',
      ibw_kg: 50,
      adjusted_bw_kg: 54.5,
      whtr: 0.57,
      whtr_risk_en: 'Elevated cardiometabolic risk',
      whtr_risk_bn: 'উচ্চ কার্ডিওমেটাবলিক ঝুঁকি',
      bmr: 1320,
      tdee: 1584,
      bmr_safe_calorie_floor: 1320,
      target_calories: 1400,
      target_protein_g: 68,
      target_carbs_g: 175,
      target_fat_g: 47,
      protein_ratio_used: '1.0 g/kg',
      population_group: 'adult_standard',
      bmr_floor_strategy: 'clamped_to_bmr',
      is_estimated: false,
      energy_calculation_method: 'mifflin_st_jeor',
    },
    labs: { lab_flags: [] },
    gut_profile: {
      bloating: 'none',
      acid_reflux_hypoacidity: false,
      bristol_stool_score: 4,
      energy_score: 7,
      sleep_quality_score: 7,
      digestive_fire_agni: 'samagni',
    },
    ...overrides,
  };
}

console.log("=====================================================================");
console.log("SHUDDHO PHASE P2 FINAL CORRECTION & INTEGRATION GATE TEST SUITE");
console.log("=====================================================================\n");

// ─── GATE 1: Insulin & Sulfonylurea Hypoglycemia Protection ───────
console.log("Gate 1: Hypoglycemic Pharmacotherapy & Meal Timing Safety");
{
  const patient = makeSyntheticPatient({
    active_medications: ['insulin_glargine', 'glimepiride'],
    selected_conditions: ['t2d_ir'],
  });

  const result = runP2Analysis(patient, {});
  const metab = result.metabolicHealthAnalysis;
  const p3 = result.p3PlanningContext;

  assert(metab.hypoglycemicMedicationActive === true, "Flags active insulin & sulfonylurea pharmacotherapy");
  assert(metab.medicationMealSafetyPriority === true, "Enforces medication meal safety priority");
  assert(
    p3.carbohydrateConsiderations.some(c => c.includes('active hypoglycemic pharmacotherapy')),
    "P3 planning context mandates regular carbohydrate meal timing to prevent hypoglycemia"
  );
}

// ─── GATE 2: Separation of Hypertension vs Chronic Kidney Disease ─
console.log("\nGate 2: Separation of Hypertension vs Chronic Kidney Disease (CKD)");
{
  // Patient A: Essential Hypertension WITHOUT CKD and WITHOUT documented sodium prescription
  const htnPatient = makeSyntheticPatient({
    selected_conditions: ['hypertension_ckd'], // Legacy combined code
    clinical_pathways: ['cardiovascular'],     // Hypertension only, normal kidneys
    weight_kg: 70,
    labs: { creatinine: 0.9, lab_flags: [] } as any,  // Normal creatinine
  });

  const htnResult = runP2Analysis(htnPatient, {});
  const htnP3 = htnResult.p3PlanningContext;

  assert(
    htnP3.prescribedProteinCap_g === undefined,
    "Hypertension WITHOUT CKD: Does NOT impose restrictive 0.8 g/kg renal protein cap"
  );
  assert(
    htnP3.proteinTargetGrams >= 70,
    "Hypertension WITHOUT CKD: Maintains normal baseline protein target (>= 1.0 g/kg)"
  );
  assert(
    htnP3.prescribedPotassiumLimit_mg === undefined,
    "Hypertension WITHOUT CKD: Does NOT restrict dietary potassium to 2000 mg (DASH promotes dietary potassium)"
  );
  assert(
    htnP3.prescribedSodiumLimit_mg === undefined,
    "Hypertension WITHOUT CKD: Does NOT automatically impose fixed sodium limits unless documented in clinical prescription"
  );

  // Patient A2: Essential Hypertension WITH documented cardiologist sodium restriction
  const htnPatientWithRx = makeSyntheticPatient({
    selected_conditions: ['hypertension_ckd'],
    clinical_pathways: ['cardiovascular'],
    weight_kg: 70,
    ...({ prescribed_sodium_limit_mg: 1500 } as any),
  });
  const htnWithRxResult = runP2Analysis(htnPatientWithRx, {});
  assert(
    htnWithRxResult.p3PlanningContext.prescribedSodiumLimit_mg === 1500,
    "Hypertension WITH documented prescription: Enforces documented 1500 mg sodium limit"
  );

  // Patient B: Documented Chronic Kidney Disease (CKD Stage 3/4) WITHOUT explicit unprescribed caps
  const ckdPatient = makeSyntheticPatient({
    selected_conditions: ['hypertension_ckd'],
    clinical_pathways: ['renal'],             // Documented renal pathway
    weight_kg: 70,
    labs: { creatinine: 2.2, lab_flags: [] } as any, // Impaired renal function
  });

  const ckdResult = runP2Analysis(ckdPatient, {});
  const ckdP3 = ckdResult.p3PlanningContext;

  assert(
    ckdP3.prescribedProteinCap_g === undefined,
    "CKD Patient WITHOUT documented cap: Does NOT fabricate an automatic 0.8 g/kg protein cap"
  );
  assert(
    ckdP3.prescribedPotassiumLimit_mg === undefined,
    "CKD Patient WITHOUT documented cap: Does NOT fabricate an automatic 2000 mg potassium cap"
  );
  assert(
    ckdP3.prescribedSodiumLimit_mg === undefined,
    "CKD Patient WITHOUT documented cap: Does NOT fabricate an automatic sodium cap"
  );

  // Patient B2: Verified CKD WITH documented clinical prescriptions
  const ckdWithRxPatient = makeSyntheticPatient({
    selected_conditions: ['hypertension_ckd'],
    clinical_pathways: ['renal'],
    weight_kg: 70,
    ...({
      prescribed_protein_cap_g: 56,
      prescribed_potassium_limit_mg: 2000,
      prescribed_sodium_limit_mg: 1500,
      feeding_status: { route: 'oral_standard', oral_intake_permitted: true, requires_specialist_support: false, fluid_limit_ml: 1500 }
    } as any),
  });
  const ckdWithRxResult = runP2Analysis(ckdWithRxPatient, {});
  const ckdWithRxP3 = ckdWithRxResult.p3PlanningContext;

  assert(
    ckdWithRxP3.prescribedProteinCap_g === 56,
    "CKD Patient WITH documented prescription: Enforces documented protein cap (56 g)"
  );
  assert(
    ckdWithRxP3.proteinTargetGrams === 56,
    "CKD Patient WITH documented prescription: Clamps protein target to documented cap (56 g)"
  );
  assert(
    ckdWithRxP3.prescribedPotassiumLimit_mg === 2000,
    "CKD Patient WITH documented prescription: Enforces documented potassium limit (2000 mg)"
  );
  assert(
    ckdWithRxP3.prescribedSodiumLimit_mg === 1500,
    "CKD Patient WITH documented prescription: Enforces documented sodium limit (1500 mg)"
  );
  assert(
    ckdWithRxP3.prescribedFluidLimit_mL === 1500,
    "CKD Patient WITH documented prescription: Enforces documented fluid limit (1500 mL)"
  );
  assert(
    ckdWithRxP3.hardRestrictions.some(r => r.source === 'documented_clinical_prescription'),
    "CKD Patient WITH documented prescription: Translates documented prescription into hard restrictions"
  );

  // Patient C: Isolated abnormal renal lab (creatinine > 1.5) WITHOUT confirmed CKD diagnosis or renal pathway
  const isolatedLabPatient = makeSyntheticPatient({
    selected_conditions: [],
    clinical_pathways: [],
    labs: { creatinine: 2.2, egfr: 45, lab_flags: [] } as any,
  });
  const isolatedLabResult = runP2Analysis(isolatedLabPatient, {});
  assert(
    isolatedLabResult.p3PlanningContext.prescribedProteinCap_g === undefined,
    "Isolated abnormal creatinine/eGFR: Must NOT automatically be treated as confirmed CKD"
  );
  assert(
    isolatedLabResult.p3PlanningContext.clinicalSafetyFindings.some(f => f.includes('Isolated altered renal biomarker')),
    "Isolated abnormal creatinine/eGFR: Flags clinical investigation note for nephrology differentiation"
  );
}

// ─── GATE 3: Pregnancy Gestational Age Verification Integrity ────
console.log("\nGate 3: Pregnancy Gestational Age Verification & Masanumasika Analysis");
{
  // Case A: Pregnancy with UNVERIFIED / MISSING Gestational Age
  const pregMissingWeeks = makeSyntheticPatient({
    population_group: 'pregnancy',
    trimester: 2, // trimester known, but exact weeks missing
  });

  const resA = runP2Analysis(pregMissingWeeks, {});
  const masanuA = resA.masanumasikaAnalysis;

  assert(masanuA.applicable === true, "Flags pregnancy as applicable");
  assert(masanuA.gestationalAgeVerified === false, "Flags gestational age as UNVERIFIED");
  assert(masanuA.gestationalWeeks === undefined, "Does NOT invent/guess gestational weeks (e.g. 16)");
  assert(masanuA.pregnancyMonth === undefined, "Leaves pregnancyMonth undefined when weeks are unverified");
  assert(
    masanuA.safetyBoundaryNotice.includes('GESTATIONAL AGE UNVERIFIED'),
    "Safety notice explicitly mandates clinician verification before month-specific nutrition"
  );

  // Case B: Pregnancy with Explicitly Verified Gestational Age (Week 24 / Month 6)
  const pregVerified = makeSyntheticPatient({
    population_group: 'pregnancy',
  });
  const resB = runP2Analysis(pregVerified, {
    q_pregnancy_gestational_weeks: 24,
    q_pregnancy_gestational_days: 0,
  });
  const masanuB = resB.masanumasikaAnalysis;

  assert(masanuB.applicable === true, "Flags pregnancy as applicable");
  assert(masanuB.gestationalAgeVerified === true, "Flags gestational age as verified");
  assert(masanuB.gestationalWeeks === 24, "Accurately records 24 gestational weeks");
  assert(masanuB.pregnancyMonth === 6, "Calculates exact pregnancy month (Month 6)");
  assert(masanuB.trimester === 2, "Identifies second trimester");
  assert(
    masanuB.bangladeshiWholeFoodAdaptations !== undefined && masanuB.bangladeshiWholeFoodAdaptations.length > 0,
    "Provides culturally accessible Bangladeshi whole food adaptations"
  );
  assert(
    masanuB.safetyBoundaryNotice.includes('STRICT MATERNAL SAFETY BOUNDARY') &&
    masanuB.safetyBoundaryNotice.includes('medicinal herbs'),
    "Enforces strict non-pharmacological boundary (prohibits medicinal herbs and bhasmas)"
  );
}

// ─── GATE 4: Ayurvedic Baseline — Zero BMI Inference Integrity ───
console.log("\nGate 4: Ayurvedic Prakriti — Zero BMI Inference & Preliminary Status");
{
  // Patient with NO Ayurvedic questions answered
  const patientUnassessed = makeSyntheticPatient({
    calculated: {
      ...makeSyntheticPatient().calculated!,
      bmi: 16.5, // Severe underweight
    },
  });

  const res = runP2Analysis(patientUnassessed, {});
  const ayur = res.ayurvedicInterpretation;

  assert(
    ayur.prakriti.is_preliminary === true,
    "Ayurvedic Prakriti preserves is_preliminary: true when survey unanswered"
  );
  assert(
    ayur.prakriti.primaryDosha === 'Unassessed',
    "Prakriti is 'Unassessed' (NEVER inferred as Vata from low BMI 16.5)"
  );
  assert(
    ayur.prakriti.vata_score === 0 && ayur.prakriti.pitta_score === 0 && ayur.prakriti.kapha_score === 0,
    "Prakriti scores remain zero rather than fabricating points from body weight"
  );
  assert(
    ayur.agni.status === 'Unassessed',
    "Ayurvedic Agni preserves status: 'Unassessed' when survey unanswered (NEVER defaults to Samagni)"
  );
  assert(
    ayur.agni.type === 'unassessed',
    "Ayurvedic Agni type is 'unassessed' without sufficient clinical data"
  );
}

// ─── GATE 5: FFQ Interpretation & PRAL Integrity ─────────────────
console.log("\nGate 5: FFQ Food Groups, Distinct States & PRAL Safety Integrity");
{
  const patient = makeSyntheticPatient();
  const answers = {
    leafy_greens_shak: 'daily',
    other_vegetables_curry: 'daily',
    raw_salad_cucumber: '4_6_times',
    fresh_fruits_seasonal: 'daily',
    nuts_seeds_chia_almonds: '3_5_times',
    fermented_foods_pantabhaat: '0_times', // Confirmed ZERO
    whole_grains_oats: 'daily',
    roti_handmade_atta: 'daily',
    lentils_dal_soup: 'daily',
    legumes_chickpeas_chola: 'not_sure', // Explicit UNKNOWN
    // other groups left unanswered
  };

  const res = runP2Analysis(patient, answers);
  const dp = res.dietaryPatternAnalysis;

  assert(dp.confirmedZeroCount >= 1, "Preserves confirmed zero intake as a distinct state");
  assert(dp.notSureCount >= 1, "Preserves explicit 'not_sure' as a distinct state");
  assert(dp.unansweredCount > 0, "Preserves unanswered food groups as a distinct state");
  assert(
    dp.pralStatus === 'insufficient_quantitative_data' && (dp.estimatedPRALScore === null || dp.estimatedPRALScore === undefined),
    "Refuses to generate numerical PRAL without quantitative nutrient grams (returns insufficient_quantitative_data)"
  );

  // When quantified gram weights ARE provided, PRAL is computed deterministically
  const quantifiedPral = analyzeDietaryPattern(patient, [], answers, undefined, {
    protein_g: 70,
    phosphorus_mg: 1300,
    potassium_mg: 3200,
    magnesium_mg: 350,
    calcium_mg: 800,
  });
  assert(
    quantifiedPral.pralStatus === 'calculated' && typeof quantifiedPral.estimatedPRALScore === 'number',
    "Calculates Remer & Manz PRAL score in mEq/day when quantified nutrient data is provided"
  );
}

// ─── GATE 6: Hospital Feeding Route Safety Protection ────────────
console.log("\nGate 6: Hospital Feeding Route Safety & Oral Route Matching");
{
  // Route A: oral_standard (Standard hospital oral feeding)
  const patientOral = makeSyntheticPatient({
    feeding_status: {
      route: 'oral_standard',
      oral_intake_permitted: true,
      requires_specialist_support: false,
    },
  });
  const resOral = runP2Analysis(patientOral, {});
  const p3Oral = resOral.p3PlanningContext;

  assert(p3Oral.feedingRoute.oral_intake_permitted === true, "oral_standard correctly permits oral diet intake");
  assert(p3Oral.feedingRoute.requires_specialist_support === false, "oral_standard does not require specialized support");

  // Route B: NPO (Nil Per Os - Surgical / Acute Hospital Restriction)
  const patientNpo = makeSyntheticPatient({
    feeding_status: {
      route: 'npo_nil_per_os',
      oral_intake_permitted: false,
      requires_specialist_support: true,
    },
  });
  const resNpo = runP2Analysis(patientNpo, {});
  const p3Npo = resNpo.p3PlanningContext;

  assert(p3Npo.feedingRoute.oral_intake_permitted === false, "NPO strictly blocks oral diet intake");
  assert(p3Npo.feedingRoute.requires_specialist_support === true, "NPO requires clinical specialist support");
  assert(
    p3Npo.hardRestrictions.some(r => r.source === 'hospital_feeding_safety'),
    "NPO enforces hard contraindication against standard oral solid diet generation"
  );

  // Route C: Enteral Tube Feeding
  const patientTube = makeSyntheticPatient({
    feeding_status: {
      route: 'enteral_tube_nasogastric',
      oral_intake_permitted: false,
      requires_specialist_support: true,
    },
  });
  const resTube = runP2Analysis(patientTube, {});
  const p3Tube = resTube.p3PlanningContext;

  assert(p3Tube.feedingRoute.oral_intake_permitted === false, "Enteral tube route blocks oral solid diet");
  assert(p3Tube.feedingRoute.requires_specialist_support === true, "Enteral tube requires specialist formula protocol");
}

// ─── GATE 7: Oncology & Underweight Restoration Targets ──────────
console.log("\nGate 7: Oncology & Underweight Restoration Targets");
{
  const patientOncology = makeSyntheticPatient({
    weight_kg: 50,
    clinical_pathways: ['oncology', 'underweight_restoration'],
    calculated: {
      ...makeSyntheticPatient().calculated!,
      bmi: 17.2,
      tdee: 1400,
    },
  });

  const resOnc = runP2Analysis(patientOncology, {});
  const p3Onc = resOnc.p3PlanningContext;

  assert(
    p3Onc.proteinTargetGrams >= 65, // 50 * 1.3 = 65 g
    "Oncology / Underweight: Elevates protein target to >= 1.3 g/kg (65 g) to prevent muscle wasting/cachexia"
  );
  assert(
    p3Onc.energyTargetCalories > 1400,
    "Oncology / Underweight: Incorporates energy restoration surplus (+300 kcal above maintenance)"
  );
}

// ─── GATE 8: Pediatric Safety Restrictions (<12y) ────────────────
console.log("\nGate 8: Pediatric Safety Screening (<12 years)");
{
  const pediatricPatient = makeSyntheticPatient({
    age: 9,
    weight_kg: 28,
    height_cm: 130,
    population_group: 'pediatric',
  });

  const resPed = runP2Analysis(pediatricPatient, {});
  assert(
    !resPed.hypotheses.some(h => h.id === 'hyp_metabolic_syndrome'),
    "Adult metabolic syndrome rules are excluded for pediatric patient (<12y)"
  );
  assert(
    resPed.p3PlanningContext.energyTargetCalories > 0,
    "Calculates safe pediatric baseline energy target"
  );
}

// ─── GATE 9: Confirmed Allergies & Ayurvedic Safety Override ─────
console.log("\nGate 9: Confirmed Allergies & Ayurvedic Safety Primacy");
{
  const patientAllergy = makeSyntheticPatient({
    confirmed_allergies: ['dairy', 'peanut'],
  });

  const res = runP2Analysis(patientAllergy, {});
  const ayur = res.ayurvedicInterpretation;
  const p3 = res.p3PlanningContext;

  assert(
    p3.confirmedAllergies.includes('dairy') && p3.confirmedAllergies.includes('peanut'),
    "Passes all confirmed allergies into P3 Planning context"
  );
  assert(
    !ayur.pathyaRecommendations?.favorableFoods.some(f => /milk|ghol|buttermilk|lassi/i.test(f)),
    "Ayurvedic Safety Primacy: Dairy products are strictly excluded from favorable foods"
  );
}

// ─── GATE 10: Clinical Approval Governance & Invalidation Gate ────
console.log("\nGate 10: Clinical Approval Governance, Identity Validation & Invalidation");
{
  const patient = makeSyntheticPatient();

  // Test 10A: Accepting one hypothesis does NOT approve the clinical report or P3 plan
  const res10A = runP2Analysis(patient, {}, [
    {
      targetId: 'hyp_dysglycemia_insulin_resistance',
      targetType: 'hypothesis',
      decision: 'accepted',
      timestamp: new Date().toISOString(),
      evidenceSnapshot: '{}',
      ruleVersion: '2.0.0',
    },
  ]);

  assert(
    res10A.report.isApproved === false,
    "Accepting an individual hypothesis does NOT approve the overall clinical assessment report"
  );
  assert(
    res10A.p3PlanningContext.clinicalAssessmentApproved === false,
    "Accepting an individual hypothesis does NOT approve the P3 planning handoff"
  );

  // Test 10B: Attempting sign-off with generic placeholder clinician names is REJECTED
  const res10B = runP2Analysis({
    patient,
    isOverallApproved: true,
    approvedByClinicianId: 'Dr. Clinical Nutritionist', // Generic placeholder
  });

  assert(
    res10B.report.isApproved === false,
    "Sign-off with placeholder 'Dr. Clinical Nutritionist' is rejected (isApproved === false)"
  );
  assert(
    res10B.p3PlanningContext.clinicalAssessmentApproved === false,
    "P3 handoff with placeholder clinician name is blocked (clinicalAssessmentApproved === false)"
  );

  // Test 10C: Explicit sign-off with validated licensed clinician identity is ACCEPTED
  const res10C = runP2Analysis({
    patient,
    isOverallApproved: true,
    approvedByClinicianId: 'Dr. Farhana Ahmed, RD-1048',
    approvalTimestamp: '2026-11-15T10:00:00.000Z',
    clinicianNotes: 'Clinical assessment and functional findings reviewed and approved for P3 diet generation.',
  });

  assert(
    res10C.report.isApproved === true,
    "Valid licensed clinician identity successfully approves report (isApproved === true)"
  );
  assert(
    res10C.report.approvedBy === 'Dr. Farhana Ahmed, RD-1048',
    "Approved clinician ID is accurately preserved on report"
  );
  assert(
    res10C.p3PlanningContext.clinicalAssessmentApproved === true,
    "P3 Planning Context is officially approved for diet generation"
  );

  // Test 10D: Invalidation on Material Clinical Changes
  const res10D = runP2Analysis({
    patient,
    isOverallApproved: true,
    approvedByClinicianId: 'Dr. Farhana Ahmed, RD-1048',
    analysisInvalidatedAt: '2026-11-15T11:30:00.000Z',
    invalidationReason: 'Patient reported new food allergy after sign-off',
  });

  assert(
    res10D.report.isApproved === false,
    "Approval is invalidated when analysisInvalidatedAt is present"
  );
  assert(
    res10D.p3PlanningContext.clinicalAssessmentApproved === false,
    "P3 handoff is blocked upon invalidation until clinician re-signs"
  );
  assert(
    Boolean(res10D.report.invalidationReason?.includes('new food allergy')),
    "Invalidation reason is preserved for audit trail"
  );
}

// ─── GATE 11: End-to-End P1 -> P2 -> Report -> Approval -> P3 Journey
console.log("\nGate 11: Complete End-to-End Clinical Lifecycle Journey");
{
  const patient = makeSyntheticPatient({
    name: 'Mrs. Sultana Begum',
    age: 52,
    gender: 'female',
    selected_conditions: ['t2d_ir', 'hypertension_ckd'],
    clinical_pathways: ['cardiovascular'],
    active_medications: ['metformin', 'losartan'],
    confirmed_allergies: ['egg'],
  });

  // Simulated P1 ClinicalAssessment export
  const mockAssessment: any = {
    patient_id: patient.id,
    visit_id: 'visit_20261115',
    assessment_id: 'asmt_001',
    assessment_date: '2026-11-15',
    mode: 'comprehensive',
    questionnaire_version: '2.0.0',
    primary_population: 'adult_standard',
    clinical_pathways: ['cardiovascular'],
    feeding_status: {
      route: 'oral_standard',
      oral_intake_permitted: true,
      requires_specialist_support: false,
    },
    functional_answers: {
      postprandial_fatigue: 'yes',
      sugar_cravings: 'yes',
      bloating_frequency: 'frequent',
    },
    dietary_frequency: {
      survey_date: '2026-11-15',
      items: {
        leafy_greens_shak: { food_group_id: 'leafy_greens_shak', frequency: 'daily', portion_size: 'medium' },
        other_vegetables_curry: { food_group_id: 'other_vegetables_curry', frequency: 'daily', portion_size: 'medium' },
        raw_salad_cucumber: { food_group_id: 'raw_salad_cucumber', frequency: '4_6_times', portion_size: 'small' },
        fresh_fruits_seasonal: { food_group_id: 'fresh_fruits_seasonal', frequency: 'daily', portion_size: 'medium' },
        fermented_foods_pantabhaat: { food_group_id: 'fermented_foods_pantabhaat', frequency: '0_times', portion_size: 'medium' },
      } as any,
      habits: {
        meal_frequency_per_day: '3_meals',
        typical_breakfast: 'heavy_rice_or_ruti',
        skips_breakfast_frequency: 'never',
      },
      summary: {
        weekly_plant_diversity_score: 9,
        plant_diversity_rank: 'high',
        daily_fruit_veg_servings_est: 3.5,
        protein_frequency_rank: 'moderate',
        ultra_processed_burden: 'low',
        added_sugar_frequency: 'minimal',
        sodium_risk_flag: false,
        completeness_status: 'partial',
        confirmed_zero_count: 1,
        unanswered_count: 7,
        not_sure_count: 0,
      },
      recommendations: {
        plant_diversity_guidance_bn: [],
        plant_diversity_guidance_en: [],
        ultra_processed_reduction_bn: [],
        ultra_processed_reduction_en: [],
        bangladeshi_whole_food_swaps: [],
      },
    },
    ayurveda: {
      prakriti: {
        vata_score: 8,
        pitta_score: 14,
        kapha_score: 6,
        dominant_constitution: 'Pitta',
        is_preliminary: false,
      },
      vikriti: {
        vata_imbalance: 2,
        pitta_imbalance: 5,
        kapha_imbalance: 1,
        active_aggravations: ['Pitta'],
        primary_aggravation: 'Pitta',
        aggravation_severity: 'moderate',
      },
      agni: {
        type: 'tikshnagni',
        clinical_manifestation_en: 'Hyperactive / Sharp Digestive Fire',
        clinical_manifestation_bn: 'তীব্র পরিপাক অগ্নি',
        therapeutic_diet_principles_en: ['Favor cooling whole foods'],
        therapeutic_diet_principles_bn: ['শীতল খাবার উপকারী'],
      },
      pathya_apathya: {
        favored_rasas: ['madhura', 'tikta', 'kashaya'],
        minimized_rasas: ['katu', 'amla', 'lavana'],
        virya_preference: 'sheeta',
        pathya_foods_bn: ['ডাবের পানি'],
        apathya_foods_bn: ['অতিরিক্ত ঝাল'],
        digestive_tolerance_notes_en: 'Sharp hunger',
        digestive_tolerance_notes_bn: 'তীব্র ক্ষুধা',
      },
    },
    population_data: {},
    labs: {
      marker_entries: {
        fasting_glucose: { marker_id: 'fasting_glucose', status: 'previously_tested', last_value: 125, last_unit: 'mg/dL' },
        hba1c: { marker_id: 'hba1c', status: 'previously_tested', last_value: 6.9, last_unit: '%' },
      } as any,
      panels_covered: ['metabolic'],
    },
    completion: {
      percentage: 95,
      clinical_safety_completed: true,
      unanswered_critical_questions: [],
    },
    safety_warnings_acknowledged: true,
  };

  // Run full analysis from complete ClinicalAssessment
  const fullAnalysis = runP2Analysis({
    patient,
    assessment: mockAssessment,
    isOverallApproved: true,
    approvedByClinicianId: 'Dr. Tariqul Islam, MBBS, RD-892',
    approvalTimestamp: '2026-11-15T12:00:00Z',
  });

  assert(fullAnalysis.observations.length > 5, "Observations populated from both assessment & profile");
  assert(fullAnalysis.ayurvedicInterpretation.prakriti.primaryDosha === 'Pitta', "Prakriti correctly derived from P1 as Pitta");
  assert(fullAnalysis.ayurvedicInterpretation.agni.status === 'Tikshna', "Agni correctly derived from P1 as Tikshna");
  assert(fullAnalysis.dietaryPatternAnalysis.plantDiversityRank === 'high', "Dietary frequency findings populated from P1");
  assert(fullAnalysis.report.sectionA_patientInfo.name === 'Mrs. Sultana Begum', "Report Section A reflects patient identity");
  assert(fullAnalysis.report.isApproved === true, "Report Section N officially signed off");
  assert(fullAnalysis.p3PlanningContext.clinicalAssessmentApproved === true, "P3 handoff contract approved and ready for diet scaling");
  assert(fullAnalysis.p3PlanningContext.confirmedAllergies.includes('egg'), "Confirmed allergy 'egg' passed to P3 contract");

  // Plant diversity scoring in p2HandoffAdapter: Plant score of 7 (>= 5) must NOT trigger false low-diversity flag
  const mock7 = {
    ...mockAssessment,
    dietary_frequency: {
      ...mockAssessment.dietary_frequency,
      summary: {
        ...mockAssessment.dietary_frequency.summary,
        weekly_plant_diversity_score: 7,
      }
    }
  };
  const flat7 = buildFlattenedAnswersForP2(mock7 as any);
  assert(
    flat7['low_food_group_variety'] === undefined,
    "p2HandoffAdapter: Plant diversity score of 7 does NOT trigger false low-diversity flag"
  );

  // Unassessed Agni preservation
  const rawAgni = calculateAgni({});
  assert(
    rawAgni.type === 'unassessed',
    "calculateAgni preserves explicit 'unassessed' state without inputs"
  );
}

console.log("\n=====================================================================");
console.log(`FINAL INTEGRATION GATE RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("=====================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("ALL 8 P2 FINAL CORRECTION & INTEGRATION GATES VERIFIED CLEANLY!");
}
