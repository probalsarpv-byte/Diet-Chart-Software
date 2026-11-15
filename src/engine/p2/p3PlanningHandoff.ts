// P2 to P3 Structured Clinical Planning Handoff Engine
// Packages clinical findings, approved hypotheses, and safety constraints into P3NutritionPlanningContext.

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

export function constructP3PlanningContext(params: {
  patient: PatientProfile;
  priorities: ClinicalPriority[];
  redFlags: ClinicalRedFlag[];
  interventionGoals: InterventionGoal[];
  dietaryPatternAnalysis: DietaryPatternAnalysisResult;
  ayurvedicInterpretation: AyurvedicInterpretationResult;
  masanumasikaAnalysis: MasanumasikaPregnancyAnalysisResult;
  metabolicHealthAnalysis: MetabolicHealthAnalysisResult;
  approvals?: ClinicianApprovalRecord[];
}): P3NutritionPlanningContext {
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
  } = params;

  const visitDateClean = patient.visit_date.replace(/[^0-9]/g, '');
  const visitId = `visit_${patient.id}_${visitDateClean}`;
  const assessmentId = `asmt_${patient.id}_${visitId}`;

  // Feeding route evaluation
  const route = patient.feeding_status?.route || 'Oral';
  const isOral = route.toLowerCase() === 'oral';
  const feedingRoute = {
    route,
    oral_intake_permitted: isOral,
    requires_specialist_support: !isOral,
  };

  // Hard safety constraints
  const hardRestrictions: SafetyConstraint[] = [];

  for (const allergen of patient.confirmed_allergies) {
    hardRestrictions.push({
      type: 'confirmed_allergy',
      description_en: `Confirmed allergic hypersensitivity to ${allergen}. Absolute exclusion required.`,
      description_bn: `${allergen}-এ নিশ্চিত অ্যালার্জি। খাদ্যতালিকা থেকে সম্পূর্ণ বর্জনীয়।`,
      affectedFoodIds: [allergen],
      source: 'patient_profile',
    });
  }

  // Clinical limits
  let prescribedProteinCap_g: number | undefined = undefined;
  let prescribedSodiumLimit_mg: number | undefined = undefined;
  let prescribedPotassiumLimit_mg: number | undefined = undefined;
  let prescribedFluidLimit_mL: number | undefined = undefined;

  const hasCkd = patient.selected_conditions.includes('hypertension_ckd');
  if (hasCkd) {
    prescribedProteinCap_g = Math.round(patient.weight_kg * 0.8);
    prescribedSodiumLimit_mg = 1500;
    prescribedPotassiumLimit_mg = 2000;
    hardRestrictions.push({
      type: 'hard_contraindication',
      description_en: 'Glomerular protection in renal impairment: maximum protein 0.8 g/kg/day.',
      description_bn: 'কিডনি সুরক্ষায় দৈনিক প্রোটিন সর্বোচ্চ ০.৮ গ্রাম/কেজি।',
      source: 'renal_pathway',
    });
  }

  // Energy & Protein calculations
  let bmr = 0;
  if (patient.gender === 'male') {
    bmr = 10 * patient.weight_kg + 6.25 * patient.height_cm - 5 * patient.age + 5;
  } else {
    bmr = 10 * patient.weight_kg + 6.25 * patient.height_cm - 5 * patient.age - 161;
  }
  const activityMultiplier = patient.activity_level === 'very_active' ? 1.725 : patient.activity_level === 'moderately_active' ? 1.55 : patient.activity_level === 'lightly_active' ? 1.375 : 1.2;
  let tdee = Math.round(bmr * activityMultiplier);

  // Pregnancy adjustments
  if (patient.population_group === 'pregnancy') {
    const trimester = patient.trimester || 2;
    if (trimester === 2) tdee += 340;
    else if (trimester === 3) tdee += 450;
  }

  // Baseline protein calculation
  let proteinTarget = Math.round(patient.weight_kg * 1.0);
  if (patient.population_group === 'pregnancy') {
    proteinTarget = Math.round(patient.weight_kg * 1.2) + 15;
  } else if (hasCkd && prescribedProteinCap_g) {
    proteinTarget = prescribedProteinCap_g;
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

  const clinicalAssessmentApproved = approvals.some(a => a.decision === 'accepted');

  return {
    patientId: patient.id,
    visitId,
    assessmentId,
    assessmentVersion: '2.0.0',
    clinicalAssessmentApproved,
    approvalTimestamp: clinicalAssessmentApproved ? new Date().toISOString() : undefined,
    approvedByClinicianId: clinicalAssessmentApproved ? 'Clinician' : undefined,

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
