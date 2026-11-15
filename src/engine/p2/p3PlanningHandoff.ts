// P2 to P3 Structured Clinical Planning Handoff Engine
// Packages clinical findings, approved hypotheses, and safety constraints into P3NutritionPlanningContext.
// Strictly enforces separation of Hypertension, Suspected Renal Alterations, and Confirmed CKD.
// Strictly verifies feeding route and hospital safety.
// Independent, versioned clinical approval governance.
// Single Authoritative Handoff Contract for Phase P3.

import { PatientProfile } from '../../types';
import { ClinicalAssessment } from '../../types/assessment';
import {
  P3NutritionPlanningContext,
  SafetyConstraint,
  NutritionalTarget,
  PrescribedNutrientRestriction,
  ClinicalPriority,
  ClinicalRedFlag,
  ClinicalHypothesis,
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
  hypotheses?: ClinicalHypothesis[];
  approvals?: ClinicianApprovalRecord[];
  isOverallApproved?: boolean;
  approvedByClinicianId?: string;
  approvalTimestamp?: string;
  analysisInvalidatedAt?: string;
  invalidationReason?: string;
}

function parseNutrientPrescription(
  nutrient: 'sodium' | 'potassium' | 'protein' | 'fluid',
  options: {
    rawFlag?: boolean | string;
    rawNumericValue?: any;
    defaultUnit: 'mg/day' | 'g/day' | 'mL/day' | 'g/kg/day';
    source: 'patient_profile' | 'clinical_assessment' | 'feeding_status' | 'clinician_order';
    date?: string;
    minValid: number;
    maxValid: number;
  }
): PrescribedNutrientRestriction {
  const { rawFlag, rawNumericValue, defaultUnit, source, date, minValid, maxValid } = options;

  const isRestricted =
    rawFlag === true ||
    rawFlag === 'yes' ||
    (typeof rawFlag === 'string' && rawFlag.toLowerCase().includes('restrict')) ||
    (rawNumericValue !== undefined && rawNumericValue !== null && rawNumericValue !== '');

  let numericalLimit: number | undefined = undefined;
  let hasConfirmedLimit = false;
  let requiresClarification = false;
  let clarificationNote_en: string | undefined = undefined;
  let clarificationNote_bn: string | undefined = undefined;

  if (rawNumericValue !== undefined && rawNumericValue !== null && rawNumericValue !== '') {
    const parsed = Number(rawNumericValue);
    if (!isNaN(parsed) && parsed >= minValid && parsed <= maxValid) {
      numericalLimit = parsed;
      hasConfirmedLimit = true;
    } else {
      requiresClarification = true;
      clarificationNote_en = `Documented numerical value (${rawNumericValue}) for ${nutrient} restriction is outside clinically plausible range (${minValid}-${maxValid} ${defaultUnit}). Verification required.`;
      clarificationNote_bn = `${nutrient}-এর জন্য উল্লিখিত সংখ্যাসূচক মান (${rawNumericValue}) চিকিৎসাগতভাবে সঠিক সীমার (${minValid}-${maxValid} ${defaultUnit}) বাইরে। যাচাই আবশ্যক।`;
    }
  }

  if (isRestricted && !hasConfirmedLimit) {
    requiresClarification = true;
    if (!clarificationNote_en) {
      clarificationNote_en = `Clinician-prescribed ${nutrient} restriction is indicated ('Yes'), but confirmed numerical limit (${defaultUnit}) is unrecorded. Clarification required before establishing target.`;
      clarificationNote_bn = `চিকিৎসক কর্তৃক ${nutrient} সীমাবদ্ধতা নির্দেশিত হয়েছে, কিন্তু সুনির্দিষ্ট সংখ্যাসূচক সীমা (${defaultUnit}) অনুপস্থিত। নির্ধারণের পূর্বে স্পষ্টীকরণ আবশ্যক।`;
    }
  }

  return {
    nutrient,
    isRestricted,
    hasConfirmedLimit,
    numericalLimit,
    unit: defaultUnit,
    prescribedDate: date,
    source,
    requiresClarification,
    clarificationNote_en,
    clarificationNote_bn,
  };
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
    hypotheses = [],
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

  // Hard safety constraints for P3 diet planning
  const hardRestrictions: SafetyConstraint[] = [];

  if (!isOralPermitted) {
    hardRestrictions.push({
      type: 'hard_contraindication',
      description_en: `Feeding route is ${rawRoute}. Standard oral solid diet chart is prohibited. Clinical specialist nutrition support required.`,
      description_bn: `ফিডিং রুট ${rawRoute}। মুখে স্বাভাবিক শক্ত খাবার গ্রহণ নিষিদ্ধ। বিশেষজ্ঞ পুষ্টি সহায়তা আবশ্যক।`,
      source: 'hospital_feeding_safety',
    });
  }

  // Preserve all confirmed allergies as mandatory food exclusion constraints
  for (const allergen of patient.confirmed_allergies) {
    hardRestrictions.push({
      type: 'confirmed_allergy',
      description_en: `Confirmed allergic hypersensitivity to ${allergen}. Absolute dietary exclusion required.`,
      description_bn: `${allergen}-এ নিশ্চিত অ্যালার্জি। খাদ্যতালিকা থেকে সম্পূর্ণ বর্জন আবশ্যক।`,
      affectedFoodIds: [allergen],
      source: 'patient_profile',
    });
  }

  // ─── 2. Clinical Separation: Hypertension vs Suspected Renal vs Confirmed CKD ───
  const isRenalPathway = Boolean(patient.clinical_pathways?.includes('renal'));
  const confirmedConditions: string[] = (patient as any).confirmed_conditions || [];
  const patientLabs = patient.labs as any;

  // Confirmed CKD Diagnosis: ONLY established by confirmed condition from licensed medical diagnosis
  const hasConfirmedCkdDiagnosis =
    confirmedConditions.some((c: string) => /^(ckd|chronic_kidney|end_stage_renal|renal_failure)$/i.test(c.trim()));

  // Suspected Renal Abnormality: Enrolling in renal pathway or having abnormal labs is screening, NOT confirmed CKD!
  const hasSuspectedRenalAbnormality =
    isRenalPathway ||
    Boolean(patient.selected_conditions?.includes('hypertension_ckd') && !hasConfirmedCkdDiagnosis) ||
    (Boolean(patientLabs?.creatinine && patientLabs.creatinine > 1.5) ||
     Boolean(patientLabs?.egfr && patientLabs.egfr < 60));

  const hasIsolatedRenalLab =
    !hasConfirmedCkdDiagnosis &&
    !isRenalPathway &&
    (Boolean(patientLabs?.creatinine && patientLabs.creatinine > 1.5) ||
     Boolean(patientLabs?.egfr && patientLabs.egfr < 60));

  // ─── 3. Prescribed Nutrient Restrictions Parsing & Validation ─────
  // CLINICAL AUDIT RULE:
  // Fallback rules converting Yes/No into invented numbers (e.g. 1500, 2000, 0.8) are DELETED.
  // Record existence of restriction separately from confirmed numerical limit.
  // Require clarification when limit is missing.
  const renalData = (assessment?.population_data as any)?.renal;
  const ans = assessmentAnswers || (assessment?.functional_answers) || {};
  const feeding = patient.feeding_status as any;

  // Sodium Prescription
  const rawSodiumFlag =
    ans['cardio_prescribed_sodium_cap'] === 'yes' ||
    ans['cardio_prescribed_sodium_cap'] === true ||
    renalData?.prescribed_sodium_restriction === true ||
    feeding?.prescribed_sodium_restriction === true;
  const rawSodiumNum =
    feeding?.prescribed_sodium_limit_mg ??
    (patient as any).prescribed_sodium_limit_mg ??
    ans['safety_prescribed_sodium_limit_mg'] ??
    renalData?.prescribed_sodium_limit_mg;

  const sodiumPrescription = parseNutrientPrescription('sodium', {
    rawFlag: rawSodiumFlag,
    rawNumericValue: rawSodiumNum,
    defaultUnit: 'mg/day',
    source: rawSodiumNum ? (feeding?.prescribed_sodium_limit_mg ? 'feeding_status' : 'clinician_order') : 'clinical_assessment',
    date: patient.visit_date,
    minValid: 200,
    maxValid: 3500,
  });

  // Potassium Prescription
  const rawPotassiumFlag =
    ans['renal_potassium_restriction_prescribed'] === 'yes' ||
    ans['renal_potassium_restriction_prescribed'] === true ||
    renalData?.prescribed_potassium_restriction === true;
  const rawPotassiumNum =
    (patient as any).prescribed_potassium_limit_mg ??
    ans['safety_prescribed_potassium_limit_mg'] ??
    renalData?.prescribed_potassium_limit_mg;

  const potassiumPrescription = parseNutrientPrescription('potassium', {
    rawFlag: rawPotassiumFlag,
    rawNumericValue: rawPotassiumNum,
    defaultUnit: 'mg/day',
    source: rawPotassiumNum ? 'clinician_order' : 'clinical_assessment',
    date: patient.visit_date,
    minValid: 500,
    maxValid: 4500,
  });

  // Protein Prescription
  const rawProteinFlag =
    ans['renal_protein_restriction_prescribed'] === 'yes' ||
    ans['renal_protein_restriction_prescribed'] === true ||
    ans['renal_prescribed_protein_cap'] !== undefined ||
    (patient as any).prescribed_protein_cap_g !== undefined ||
    renalData?.prescribed_protein_cap_g !== undefined;
  const rawProteinNum =
    (patient as any).prescribed_protein_cap_g ??
    (patient as any).prescribed_protein_cap ??
    ans['renal_prescribed_protein_cap'] ??
    renalData?.prescribed_protein_cap_g;

  const proteinPrescription = parseNutrientPrescription('protein', {
    rawFlag: rawProteinFlag,
    rawNumericValue: rawProteinNum,
    defaultUnit: 'g/day',
    source: rawProteinNum ? 'clinician_order' : 'clinical_assessment',
    date: patient.visit_date,
    minValid: 20,
    maxValid: 180,
  });

  // Fluid Prescription
  const rawFluidFlag =
    ans['safety_prescribed_fluid_limit'] === 'yes' ||
    ans['safety_prescribed_fluid_limit'] === true ||
    ans['cardio_fluid_restriction_advised'] === 'yes' ||
    ans['cardio_fluid_restriction_advised'] === true ||
    feeding?.fluid_limit_ml !== undefined ||
    (patient as any).prescribed_fluid_limit_ml !== undefined ||
    renalData?.prescribed_fluid_limit_ml !== undefined;
  const rawFluidNum =
    feeding?.fluid_limit_ml ??
    (patient as any).prescribed_fluid_limit_ml ??
    ans['safety_prescribed_fluid_limit_ml'] ??
    renalData?.prescribed_fluid_limit_ml;

  const fluidPrescription = parseNutrientPrescription('fluid', {
    rawFlag: rawFluidFlag,
    rawNumericValue: rawFluidNum,
    defaultUnit: 'mL/day',
    source: rawFluidNum ? (feeding?.fluid_limit_ml ? 'feeding_status' : 'clinician_order') : 'clinical_assessment',
    date: patient.visit_date,
    minValid: 500,
    maxValid: 4000,
  });

  const prescriptions = {
    sodium: sodiumPrescription,
    potassium: potassiumPrescription,
    protein: proteinPrescription,
    fluid: fluidPrescription,
  };

  // Confirmed numerical limits (strictly populated only when verified value exists)
  const prescribedSodiumLimit_mg = sodiumPrescription.hasConfirmedLimit ? sodiumPrescription.numericalLimit : undefined;
  const prescribedPotassiumLimit_mg = potassiumPrescription.hasConfirmedLimit ? potassiumPrescription.numericalLimit : undefined;
  const prescribedProteinCap_g = proteinPrescription.hasConfirmedLimit ? proteinPrescription.numericalLimit : undefined;
  const prescribedFluidLimit_mL = fluidPrescription.hasConfirmedLimit ? fluidPrescription.numericalLimit : undefined;

  // Add confirmed limits to hardRestrictions
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

  // ─── 4. Energy & Protein Targets ─────────────────────────────────
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
    tdee += 300;
  }

  // Baseline protein calculation
  let proteinTarget = Math.round(patient.weight_kg * 1.0);
  if (prescribedProteinCap_g) {
    proteinTarget = prescribedProteinCap_g;
  } else if (patient.population_group === 'pregnancy') {
    proteinTarget = Math.round(patient.weight_kg * 1.2) + 15;
  } else if (isOncology || isUnderweight) {
    proteinTarget = Math.round(patient.weight_kg * 1.3);
  }

  // ─── 5. Nutritional Targets Array ────────────────────────────────
  const nutritionalTargets: NutritionalTarget[] = [
    {
      nutrient: 'energy',
      targetMin: tdee,
      targetMax: tdee,
      unit: 'kcal/day',
      rationale_en: 'Estimated daily energy target based on validated anthropometric equations',
      rationale_bn: 'বৈধ সমীকরণ অনুযায়ী দৈনিক শক্তির লক্ষ্যমাত্রা',
      source: 'anthropometric_calculation',
    },
    {
      nutrient: 'protein',
      targetMin: proteinTarget,
      targetMax: prescribedProteinCap_g ? prescribedProteinCap_g : proteinTarget,
      unit: 'g/day',
      rationale_en: prescribedProteinCap_g
        ? `Clinician-prescribed protein cap: ${prescribedProteinCap_g} g/day`
        : 'Safe clinical baseline protein requirement',
      rationale_bn: prescribedProteinCap_g
        ? `চিকিৎসক নির্ধারিত প্রোটিন সীমা: ${prescribedProteinCap_g} গ্রাম`
        : 'নিরাপদ ক্লিনিক্যাল প্রোটিন চাহিদা',
      source: prescribedProteinCap_g ? 'clinician_set' : 'condition_adjustment',
    },
  ];

  if (prescribedSodiumLimit_mg !== undefined) {
    nutritionalTargets.push({
      nutrient: 'sodium',
      targetMax: prescribedSodiumLimit_mg,
      unit: 'mg/day',
      rationale_en: `Clinician-prescribed sodium restriction: max ${prescribedSodiumLimit_mg} mg/day`,
      rationale_bn: `চিকিৎসক নির্ধারিত সোডিয়াম সীমা: দৈনিক অনূর্ধ্ব ${prescribedSodiumLimit_mg} মিলিগ্রাম`,
      source: 'clinician_set',
    });
  }
  if (prescribedPotassiumLimit_mg !== undefined) {
    nutritionalTargets.push({
      nutrient: 'potassium',
      targetMax: prescribedPotassiumLimit_mg,
      unit: 'mg/day',
      rationale_en: `Clinician-prescribed potassium restriction: max ${prescribedPotassiumLimit_mg} mg/day`,
      rationale_bn: `চিকিৎসক নির্ধারিত পটাশিয়াম সীমা: দৈনিক অনূর্ধ্ব ${prescribedPotassiumLimit_mg} মিলিগ্রাম`,
      source: 'clinician_set',
    });
  }
  if (prescribedFluidLimit_mL !== undefined) {
    nutritionalTargets.push({
      nutrient: 'fluid',
      targetMax: prescribedFluidLimit_mL,
      unit: 'mL/day',
      rationale_en: `Clinician-prescribed fluid restriction: max ${prescribedFluidLimit_mL} mL/day`,
      rationale_bn: `চিকিৎসক নির্ধারিত তরল সীমা: দৈনিক অনূর্ধ্ব ${prescribedFluidLimit_mL} মিলি`,
      source: 'clinician_set',
    });
  }

  // ─── 6. Carbohydrate & Medication Precautions ─────────────────────
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

  const medicationPrecautions: string[] = [];
  const meds = patient.active_medications.map(m => m.toLowerCase());
  if (meds.some(m => m.includes('insulin'))) {
    medicationPrecautions.push('Active Insulin Therapy: Rigid meal timing and carbohydrate consistency required to avoid severe hypoglycemia.');
  }
  if (meds.some(m => m.includes('gliclazide') || m.includes('glimepiride') || m.includes('glipizide') || m.includes('sulfonylurea'))) {
    medicationPrecautions.push('Active Sulfonylurea Therapy: Prolonged fasting contraindicated; meals must contain regular complex carbohydrates.');
  }
  if (meds.some(m => m.includes('warfarin'))) {
    medicationPrecautions.push('Warfarin Anticoagulation: Strict daily consistency in dietary vitamin K intake (leafy greens) required.');
  }
  if (meds.some(m => m.includes('thyrox') || m.includes('levothyroxine'))) {
    medicationPrecautions.push('Levothyroxine Therapy: Administer on empty stomach; separate from calcium, iron, and high-fiber foods by at least 4 hours.');
  }
  if (meds.some(m => m.includes('metformin'))) {
    medicationPrecautions.push('Metformin Therapy: Administer with meals to minimize GI distress; monitor long-term vitamin B12 status.');
  }

  // ─── 7. Safety Findings & Clarification Alerts ────────────────────
  const additionalSafetyNotes: string[] = [];
  if (hasIsolatedRenalLab) {
    additionalSafetyNotes.push(
      'Isolated altered renal biomarker (elevated serum creatinine or reduced eGFR) observed without confirmed CKD diagnosis. Nephrology evaluation advised to differentiate AKI vs chronic etiology before applying restrictive renal diet.'
    );
  }
  if (hasConfirmedCkdDiagnosis) {
    additionalSafetyNotes.push(
      'Verified Chronic Kidney Disease documented. Nutrition planning must adhere strictly to documented clinician prescriptions and avoid unprescribed restrictive extremes.'
    );
  } else if (hasSuspectedRenalAbnormality) {
    additionalSafetyNotes.push(
      'Renal pathway assessment active / suspected renal alteration: Clinical screening indicated. Does not constitute confirmed Chronic Kidney Disease; avoid automatic restrictive renal protein caps without nephrology evaluation and explicit prescription.'
    );
  }

  // Add clarification alerts for any prescribed restrictions missing numerical values
  for (const pres of Object.values(prescriptions)) {
    if (pres.requiresClarification && pres.clarificationNote_en) {
      additionalSafetyNotes.push(`CLARIFICATION REQUIRED: ${pres.clarificationNote_en}`);
    }
  }

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

  // ─── 8. Independent Clinical Assessment Approval Governance ──────
  const isPlaceholderClinician = [
    'clinician',
    'dr. clinical nutritionist',
    'doctor',
    'nutritionist',
    'admin',
    'user',
    'test',
    'guest',
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
    prescriptions,
    prescribedFluidLimit_mL,
    prescribedSodiumLimit_mg,
    prescribedPotassiumLimit_mg,
    prescribedProteinCap_g,

    hasSuspectedRenalAbnormality,
    hasConfirmedCkdDiagnosis,

    energyTargetCalories: tdee,
    proteinTargetGrams: proteinTarget,
    nutritionalTargets,
    carbohydrateConsiderations,
    medicationPrecautions,

    clinicalSafetyFindings,
    functionalNutritionPriorities,
    dietaryFrequencyFindings: dietaryPatternAnalysis,

    ayurvedicContext: ayurvedicInterpretation,
    pregnancyContext: masanumasikaAnalysis.applicable ? masanumasikaAnalysis : undefined,
    approvedInterventionGoals,

    // Authoritative Unified Handoff Fields
    generatedAt: new Date().toISOString(),
    lifeStage: patient.population_group,
    medicationConstraints: patient.active_medications,
    foodPreferences: patient.dietary_preferences || {},
    currentCarePhase: patient.current_phase,
    clinicianApprovedHypotheses: (hypotheses || []).filter(h => h.clinicianDecision === 'accepted').map(h => h.id),
    unconfirmedHypotheses: (hypotheses || []).filter(h => h.clinicianDecision === 'pending').map(h => h.id),
  };
}
