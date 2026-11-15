// P2 to P3 Structured Clinical Planning Handoff Engine
// Packages clinical findings, approved hypotheses, and safety constraints into P3NutritionPlanningContext.
// Strictly enforces separation of Hypertension and Chronic Kidney Disease (CKD).
// Strictly verifies feeding route and hospital safety.
// Independent, versioned clinical approval governance.

import { PatientProfile } from '../../types';
import { ClinicalAssessment } from '../../types/assessment';
import {
  P3NutritionPlanningContext,
  SafetyConstraint,
  ClinicalPriority,
  ClinicalRedFlag,
  InterventionGoal,
  DietaryPatternAnalysisResult,
  AyurvedicInterpretationResult,
  MasanumasikaPregnancyAnalysisResult,
  MetabolicHealthAnalysisResult,
  ClinicianApprovalRecord,
} from './types';

export interface ConstructP3Params {
  patient: PatientProfile;
  priorities: ClinicalPriority[];
  redFlags: ClinicalRedFlag[];
  interventionGoals: InterventionGoal[];
  dietaryPatternAnalysis: DietaryPatternAnalysisResult;
  ayurvedicInterpretation: AyurvedicInterpretationResult;
  masanumasikaAnalysis: MasanumasikaPregnancyAnalysisResult;
  metabolicHealthAnalysis: MetabolicHealthAnalysisResult;
  assessment?: ClinicalAssessment;
  assessmentAnswers?: Record<string, any>;
  approvals?: ClinicianApprovalRecord[];
  isOverallApproved?: boolean;
  approvedByClinicianId?: string;
  approvalTimestamp?: string;
  analysisInvalidatedAt?: string;
  invalidationReason?: string;
}

export function constructP3PlanningContext(params: ConstructP3Params): P3NutritionPlanningContext {
  const {
    patient,
    priorities,
    redFlags,
    interventionGoals,
    dietaryPatternAnalysis,
    ayurvedicInterpretation,
    masanumasikaAnalysis,
    metabolicHealthAnalysis,
    assessment,
    assessmentAnswers = {},
    approvals = [],
    isOverallApproved = false,
    approvedByClinicianId,
    approvalTimestamp,
    analysisInvalidatedAt,
    invalidationReason,
  } = params;

  const visitDateClean = patient.visit_date.replace(/[^0-9]/g, '');
  const visitId = `visit_${patient.id}_${visitDateClean}`;
  const assessmentId = `asmt_${patient.id}_${visitId}`;

  // ─── 1. Feeding Route & Hospital Safety Evaluation ───────────────
  const rawRoute = patient.feeding_status?.route || 'oral_standard';
  const isOralPermitted =
    patient.feeding_status?.oral_intake_permitted !== undefined
      ? patient.feeding_status.oral_intake_permitted
      : rawRoute === 'oral_standard' ||
        rawRoute === 'oral_nutritional_supplements' ||
        rawRoute === 'modified_texture_soft' ||
        rawRoute === 'modified_texture_pureed' ||
        rawRoute === 'modified_texture_thickened_liquid' ||
        rawRoute.toLowerCase().includes('oral');

  const requiresSpecialist =
    patient.feeding_status?.requires_specialist_support !== undefined
      ? patient.feeding_status.requires_specialist_support
      : !isOralPermitted ||
        rawRoute === 'npo_nil_per_os' ||
        rawRoute.includes('tube') ||
        rawRoute.includes('parenteral') ||
        Boolean(patient.feeding_status?.swallowing_difficulty_dysphagia);

  const feedingRoute = {
    route: rawRoute,
    oral_intake_permitted: isOralPermitted,
    requires_specialist_support: requiresSpecialist,
  };

  // Hard safety constraints
  const hardRestrictions: SafetyConstraint[] = [];

  if (!isOralPermitted) {
    hardRestrictions.push({
      type: 'hard_contraindication',
      description_en: `Feeding route is ${rawRoute}. Standard oral solid diet chart is prohibited. Clinical specialist nutrition support required.`,
      description_bn: `ফিডিং রুট ${rawRoute}। মুখে স্বাভাবিক শক্ত খাবার গ্রহণ নিষিদ্ধ। বিশেষজ্ঞ পুষ্টি সহায়তা আবশ্যক।`,
      source: 'hospital_feeding_safety',
    });
  }

  for (const allergen of patient.confirmed_allergies) {
    hardRestrictions.push({
      type: 'confirmed_allergy',
      description_en: `Confirmed allergic hypersensitivity to ${allergen}. Absolute exclusion required.`,
      description_bn: `${allergen}-এ নিশ্চিত অ্যালার্জি। খাদ্যতালিকা থেকে সম্পূর্ণ বর্জনীয়।`,
      affectedFoodIds: [allergen],
      source: 'patient_profile',
    });
  }

  // ─── 2. Separation of Hypertension and Chronic Kidney Disease ─────
  // CLINICAL SAFETY AUDIT RULE:
  // 1. An isolated abnormal creatinine (> 1.5) or eGFR (< 60) must NOT automatically be treated as confirmed CKD.
  // 2. Automatically prescribed fixed protein, sodium, potassium, and fluid limits are REMOVED.
  //    Only documented patient-specific prescriptions and verified clinical requirements are populated.
  const isRenalPathway = Boolean(patient.clinical_pathways?.includes('renal'));
  const confirmedConditions: string[] = (patient as any).confirmed_conditions || [];
  const patientLabs = patient.labs as any;

  const hasConfirmedCkdDiagnosis =
    confirmedConditions.some((c: string) => /ckd|chronic_kidney|end_stage_renal|renal_failure/i.test(c)) ||
    Boolean(patient.selected_conditions?.includes('hypertension_ckd') && isRenalPathway);
  const hasDocumentedCkd = hasConfirmedCkdDiagnosis || isRenalPathway;

  const hasIsolatedRenalLab =
    !hasDocumentedCkd &&
    (Boolean(patientLabs?.creatinine && patientLabs.creatinine > 1.5) ||
     Boolean(patientLabs?.egfr && patientLabs.egfr < 60));

  // Extract documented prescriptions from patient profile, feeding status, and assessment
  const renalData = (assessment?.population_data as any)?.renal;
  const ans = assessmentAnswers || (assessment?.functional_answers) || {};
  const feeding = patient.feeding_status as any;

  let prescribedProteinCap_g: number | undefined =
    (patient as any).prescribed_protein_cap_g ??
    (patient as any).prescribed_protein_cap ??
    ans['renal_prescribed_protein_cap'] ??
    (renalData?.prescribed_protein_cap_g ? Number(renalData.prescribed_protein_cap_g) : undefined);

  let prescribedSodiumLimit_mg: number | undefined =
    feeding?.prescribed_sodium_limit_mg ??
    (patient as any).prescribed_sodium_limit_mg ??
    (ans['safety_prescribed_sodium_limit_mg'] ? Number(ans['safety_prescribed_sodium_limit_mg']) : undefined) ??
    (renalData?.prescribed_sodium_limit_mg ? Number(renalData.prescribed_sodium_limit_mg) : undefined) ??
    (renalData?.prescribed_sodium_restriction ? 1500 : undefined) ??
    (ans['cardio_prescribed_sodium_cap'] === 'yes' ? 2000 : undefined);

  let prescribedPotassiumLimit_mg: number | undefined =
    (patient as any).prescribed_potassium_limit_mg ??
    (ans['renal_potassium_restriction_prescribed'] === 'yes' ? 2000 : undefined) ??
    (renalData?.prescribed_potassium_limit_mg ? Number(renalData.prescribed_potassium_limit_mg) : undefined);

  let prescribedFluidLimit_mL: number | undefined =
    feeding?.fluid_limit_ml ??
    (patient as any).prescribed_fluid_limit_ml ??
    (ans['safety_prescribed_fluid_limit_ml'] ? Number(ans['safety_prescribed_fluid_limit_ml']) : undefined) ??
    (renalData?.prescribed_fluid_limit_ml ? Number(renalData.prescribed_fluid_limit_ml) : undefined);

  // Hard restrictions based on explicit documented prescriptions
  if (prescribedProteinCap_g !== undefined) {
    hardRestrictions.push({
      type: 'hard_contraindication',
      description_en: `Clinician-prescribed protein restriction: maximum ${prescribedProteinCap_g} g/day.`,
      description_bn: `চিকিৎসক নির্ধারিত প্রোটিন সীমা: দৈনিক সর্বোচ্চ ${prescribedProteinCap_g} গ্রাম।`,
      source: 'documented_clinical_prescription',
    });
  }
  if (prescribedSodiumLimit_mg !== undefined) {
    hardRestrictions.push({
      type: 'hard_contraindication',
      description_en: `Clinician-prescribed sodium restriction: maximum ${prescribedSodiumLimit_mg} mg/day.`,
      description_bn: `চিকিৎসক নির্ধারিত সোডিয়াম সীমা: দৈনিক সর্বোচ্চ ${prescribedSodiumLimit_mg} মিলিগ্রাম।`,
      source: 'documented_clinical_prescription',
    });
  }
  if (prescribedPotassiumLimit_mg !== undefined) {
    hardRestrictions.push({
      type: 'hard_contraindication',
      description_en: `Clinician-prescribed potassium restriction: maximum ${prescribedPotassiumLimit_mg} mg/day.`,
      description_bn: `চিকিৎসক নির্ধারিত পটাশিয়াম সীমা: দৈনিক সর্বোচ্চ ${prescribedPotassiumLimit_mg} মিলিগ্রাম।`,
      source: 'documented_clinical_prescription',
    });
  }
  if (prescribedFluidLimit_mL !== undefined) {
    hardRestrictions.push({
      type: 'hard_contraindication',
      description_en: `Clinician-prescribed fluid restriction: maximum ${prescribedFluidLimit_mL} mL/day.`,
      description_bn: `চিকিৎসক নির্ধারিত তরল সীমা: দৈনিক সর্বোচ্চ ${prescribedFluidLimit_mL} মিলি।`,
      source: 'documented_clinical_prescription',
    });
  }

  // ─── 3. Energy & Protein Targets ─────────────────────────────────
  let bmr = 0;
  if (patient.gender === 'male') {
    bmr = 10 * patient.weight_kg + 6.25 * patient.height_cm - 5 * patient.age + 5;
  } else {
    bmr = 10 * patient.weight_kg + 6.25 * patient.height_cm - 5 * patient.age - 161;
  }
  const activityMultiplier =
    patient.activity_level === 'very_active'
      ? 1.725
      : patient.activity_level === 'moderately_active'
      ? 1.55
      : patient.activity_level === 'lightly_active'
      ? 1.375
      : 1.2;
  let tdee = Math.round(bmr * activityMultiplier);

  // Pregnancy adjustments
  if (patient.population_group === 'pregnancy') {
    const trimester = patient.trimester || 2;
    if (trimester === 2) tdee += 340;
    else if (trimester === 3) tdee += 450;
  }

  // Oncology and Underweight considerations
  const isOncology = patient.clinical_pathways?.includes('oncology');
  const isUnderweight =
    patient.clinical_pathways?.includes('underweight_restoration') ||
    (patient.calculated?.bmi && patient.calculated.bmi < 18.5);

  if (isOncology || isUnderweight) {
    // Prescribe energy restoration surplus (TDEE + 300 kcal)
    tdee += 300;
  }

  // Baseline protein calculation
  let proteinTarget = Math.round(patient.weight_kg * 1.0);
  if (hasDocumentedCkd && prescribedProteinCap_g) {
    proteinTarget = prescribedProteinCap_g;
  } else if (patient.population_group === 'pregnancy') {
    proteinTarget = Math.round(patient.weight_kg * 1.2) + 15;
  } else if (isOncology || isUnderweight) {
    // High protein requirement to prevent muscle wasting/cachexia
    proteinTarget = Math.round(patient.weight_kg * 1.3);
  }

  // Carbohydrate considerations
  const carbohydrateConsiderations: string[] = [];
  if (metabolicHealthAnalysis.medicationMealSafetyPriority) {
    carbohydrateConsiderations.push(
      'MANDATORY: Carbohydrate regularity synchronized with active hypoglycemic pharmacotherapy (no skipped meals).'
    );
  }
  if (metabolicHealthAnalysis.glycemicStabilityPattern === 'dysglycemia_pattern') {
    carbohydrateConsiderations.push(
      'Emphasize complex carbohydrates with intact fiber matrix (Lal chal, legumes) with total carbohydrate <= 50% of energy.'
    );
  }

  const additionalSafetyNotes: string[] = [];
  if (hasIsolatedRenalLab) {
    additionalSafetyNotes.push(
      'Isolated altered renal biomarker (elevated serum creatinine or reduced eGFR) observed without confirmed CKD diagnosis. Nephrology evaluation advised to differentiate AKI vs chronic etiology before applying restrictive renal diet.'
    );
  }
  if (hasDocumentedCkd) {
    additionalSafetyNotes.push(
      'Verified Chronic Kidney Disease / Renal Pathway documented. Nutrition planning must adhere to documented patient-specific prescriptions and avoid unprescribed restrictive extremes.'
    );
  }

  // Safety findings
  const clinicalSafetyFindings = [
    ...additionalSafetyNotes,
    ...redFlags.map(rf => `${rf.urgency.toUpperCase()}: ${rf.title_en} — ${rf.recommendedAction_en}`),
    ...hardRestrictions.map(r => r.description_en),
  ];

  const functionalNutritionPriorities = priorities.map(p => `Rank ${p.rank} (${p.type}): ${p.title_en}`);

  const approvedInterventionGoals = interventionGoals.map(g => {
    const prior = approvals.find(a => a.targetId === g.id && a.targetType === 'intervention');
    if (prior && prior.decision === 'accepted') {
      return { ...g, clinicianApprovalStatus: 'approved' as const };
    }
    return g;
  });

  // ─── 4. Independent Clinical Assessment Approval Governance ──────
  // CLINICAL INTEGRITY REQUIREMENT:
  // Accepting one hypothesis must NEVER approve the entire assessment or intervention plan.
  // Independent sign-off with verified clinician identity required.
  const isPlaceholderClinician = [
    'clinician',
    'dr. clinical nutritionist',
    'doctor',
    'nutritionist',
    'admin',
    'user',
  ].includes((approvedByClinicianId || '').trim().toLowerCase());

  const hasValidClinician =
    Boolean(approvedByClinicianId) &&
    (approvedByClinicianId || '').trim().length >= 3 &&
    !isPlaceholderClinician;

  const isInvalidated = Boolean(analysisInvalidatedAt);

  const clinicalAssessmentApproved = Boolean(isOverallApproved && hasValidClinician && !isInvalidated);

  return {
    patientId: patient.id,
    visitId,
    assessmentId,
    assessmentVersion: '2.0.0',
    clinicalAssessmentApproved,
    approvalTimestamp: clinicalAssessmentApproved ? (approvalTimestamp || new Date().toISOString()) : undefined,
    approvedByClinicianId: clinicalAssessmentApproved ? approvedByClinicianId : undefined,
    analysisInvalidatedAt,
    invalidationReason,

    confirmedAllergies: patient.confirmed_allergies,
    feedingRoute,
    hardRestrictions,
    prescribedFluidLimit_mL,
    prescribedSodiumLimit_mg,
    prescribedPotassiumLimit_mg,
    prescribedProteinCap_g,

    energyTargetCalories: tdee,
    proteinTargetGrams: proteinTarget,
    carbohydrateConsiderations,

    clinicalSafetyFindings,
    functionalNutritionPriorities,
    dietaryFrequencyFindings: dietaryPatternAnalysis,

    ayurvedicContext: ayurvedicInterpretation,
    pregnancyContext: masanumasikaAnalysis.applicable ? masanumasikaAnalysis : undefined,
    approvedInterventionGoals,
  };
}
