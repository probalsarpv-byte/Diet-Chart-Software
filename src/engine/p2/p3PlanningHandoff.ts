// P2 to P3 Structured Clinical Planning Handoff Engine
// Packages clinical findings, approved hypotheses, and safety constraints into P3NutritionPlanningContext.
// Strictly enforces separation of Hypertension and Chronic Kidney Disease (CKD).
// Strictly verifies feeding route and hospital safety.
// Independent, versioned clinical approval governance.

import { PatientProfile } from '../../types';
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
  // A patient with hypertension alone must NOT be subjected to renal protein restriction (0.8 g/kg)
  // or potassium restrictions (2000 mg).
  // CKD must be explicitly confirmed by renal pathway, documented diagnosis, or impaired renal labs.
  const isRenalPathway = patient.clinical_pathways?.includes('renal');
  const confirmedConditions: string[] = (patient as any).confirmed_conditions || [];
  const patientLabs = patient.labs as any;
  const hasDocumentedCkd =
    Boolean(isRenalPathway) ||
    confirmedConditions.some((c: string) => /ckd|kidney|renal_impairment/i.test(c)) ||
    Boolean(patientLabs?.creatinine && patientLabs.creatinine > 1.5) ||
    Boolean(patientLabs?.egfr && patientLabs.egfr < 60) ||
    Boolean(patient.selected_conditions?.includes('hypertension_ckd') && isRenalPathway);

  const hasHypertensionOnly =
    (patient.selected_conditions?.includes('hypertension_ckd') || patient.clinical_pathways?.includes('cardiovascular')) &&
    !hasDocumentedCkd;

  let prescribedProteinCap_g: number | undefined = undefined;
  let prescribedSodiumLimit_mg: number | undefined = undefined;
  let prescribedPotassiumLimit_mg: number | undefined = undefined;
  let prescribedFluidLimit_mL: number | undefined = undefined;

  if (hasDocumentedCkd) {
    // Documented Chronic Kidney Disease: Glomerular preservation protocol
    prescribedProteinCap_g = Math.round(patient.weight_kg * 0.8);
    prescribedSodiumLimit_mg = 1500;
    prescribedPotassiumLimit_mg = 2000;
    if (patient.feeding_status?.fluid_restriction_active) {
      prescribedFluidLimit_mL = 1500;
    }
    hardRestrictions.push({
      type: 'hard_contraindication',
      description_en: 'Glomerular protection in verified renal impairment (CKD): protein capped at 0.8 g/kg/day, sodium <= 1500 mg, potassium <= 2000 mg.',
      description_bn: 'কিডনি সুরক্ষা (সিকেডি): প্রোটিন দৈনিক সর্বোচ্চ ০.৮ গ্রাম/কেজি, সোডিয়াম <= ১৫০০ মিলিগ্রাম, পটাশিয়াম <= ২০০০ মিলিগ্রাম।',
      source: 'renal_pathway',
    });
  } else if (hasHypertensionOnly) {
    // Hypertension without CKD: Restrict sodium for blood pressure; do NOT restrict protein or potassium
    prescribedSodiumLimit_mg = 1500;
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

  // Safety findings
  const clinicalSafetyFindings = [
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
