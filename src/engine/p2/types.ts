// P2 Clinical Intelligence Engine - Type Definitions
// All types for the Root-Cause Intelligence system

import { ClinicalAssessment } from '../../types/assessment';

export type FunctionalDomain =
  | 'assimilation'
  | 'defense_repair'
  | 'energy'
  | 'biotransformation'
  | 'transport'
  | 'communication'
  | 'structural_integrity';

export type EvidenceSupportLevel =
  | 'sufficient'      // multiple independent corroborating observations
  | 'some'            // at least one direct observation
  | 'limited'         // indirect or conflicting
  | 'insufficient'    // too little data
  | 'not_applicable'; // rule excluded by population/context

export type HypothesisCluster =
  | 'gastrointestinal'
  | 'metabolic'
  | 'nutritional'
  | 'immune_inflammatory'
  | 'endocrine_hormonal'
  | 'hepatic_biotransformation'
  | 'sleep_stress_circadian'
  | 'medication_supplement'
  | 'musculoskeletal'
  | 'environmental_behavioral';

export type ClinicalUrgency = 'immediate' | 'urgent' | 'routine' | 'monitoring';
export type PopulationApplicability =
  | 'adult'
  | 'pregnancy'
  | 'lactation'
  | 'pediatric'
  | 'adolescent'
  | 'geriatric'
  | 'oncology'
  | 'renal'
  | 'malnutrition_risk'
  | 'all';

export type EvidenceProvenance =
  | 'established_clinical'
  | 'emerging_research'
  | 'mechanistic'
  | 'traditional_interpretive'
  | 'practitioner_configured'
  | 'review_required';

export type ClinicianDecision =
  | 'accepted'
  | 'rejected'
  | 'uncertain'
  | 'more_info_needed'
  | 'pending';

// ─── Clinical Observation ────────────────────────────────────────
export interface ClinicalObservation {
  id: string;
  patientId: string;
  visitId: string;
  category: 'symptom' | 'lab' | 'anthropometric' | 'dietary' | 'medication' | 'supplement' | 'allergy' | 'lifestyle' | 'exposure' | 'history' | 'clinician_note';
  sourceQuestionId?: string;
  sourceLabMarker?: string;
  observedValue: string | number | boolean;
  unit?: string;
  date: string;
  severity?: 'none' | 'mild' | 'moderate' | 'severe';
  frequency?: 'never' | 'rarely' | 'sometimes' | 'often' | 'always';
  durationWeeks?: number;
  dataSource: 'patient_reported' | 'measured' | 'clinician_recorded' | 'calculated';
  verificationStatus: 'unverified' | 'clinician_verified' | 'lab_confirmed';
  isMissing?: boolean;
  associatedDomains: FunctionalDomain[];
  tags?: string[];
  title_en?: string;
  title_bn?: string;
  provenance?: string;
}

// ─── Functional Domain Summary ───────────────────────────────────
export interface DomainFinding {
  domain: FunctionalDomain;
  domainName_en: string;
  domainName_bn: string;
  relevantObservations: string[]; // observation IDs
  supportingEvidence: string[];
  pertinentNegatives: string[];
  missingInformation: string[];
  potentialConfounders: string[];
  clinicalReviewFlags: string[];
  furtherAssessmentSuggestions: string[];
  overallBurden: 'none' | 'mild' | 'moderate' | 'significant' | 'insufficient_data';
}

// ─── Clinical Rule ────────────────────────────────────────────────
export interface ClinicalRule {
  ruleId: string;
  ruleVersion: string;
  clinicalDomain: FunctionalDomain;
  targetHypothesis: string; // hypothesis ID
  cluster: HypothesisCluster;
  inclusionCriteria: string[]; // observation tags or IDs required
  exclusionCriteria: string[];
  requiredObservations: string[];
  optionalObservations: string[];
  contradictoryFindings: string[];
  applicablePopulations: PopulationApplicability[];
  safetyExclusions: string[];
  evidenceReference: string;
  evidenceProvenance: EvidenceProvenance;
  lastReviewDate: string;
  explanation_en: string;
  explanation_bn: string;
  weight: number; // internal ordering weight (0-10, documented)
}

// ─── Hypothesis ───────────────────────────────────────────────────
export interface ClinicalHypothesis {
  id: string;
  cluster: HypothesisCluster;
  title_en: string;
  title_bn: string;
  description_en: string;
  description_bn: string;
  biologicalSystems: FunctionalDomain[];
  supportingObservationIds: string[];
  contradictoryObservationIds: string[];
  missingEvidence: string[];
  alternativeExplanations: string[];
  confounders: string[];
  potentialNutritionTargets: string[];
  requiredInvestigations: string[];
  evidenceSupportLevel: EvidenceSupportLevel;
  triggeringRuleIds: string[];
  applicablePopulations: PopulationApplicability[];
  clinicianDecision: ClinicianDecision;
  clinicianNote?: string;
  clinicianDecidedAt?: string;
  clinicianDecidedBy?: string;
  isConfirmedDiagnosis: boolean; // always false for hypotheses
  confirmingDiagnosisSource?: string; // only if patient has existing confirmed diagnosis
}

// ─── Safety Flag ──────────────────────────────────────────────────
export interface ClinicalRedFlag {
  id: string;
  title_en: string;
  title_bn: string;
  triggeringObservationIds: string[];
  urgency: ClinicalUrgency;
  recommendedAction_en: string;
  recommendedAction_bn: string;
  blocksAutoIntervention: boolean;
  requiresClinicianReview: boolean;
}

// ─── Priority ─────────────────────────────────────────────────────
export interface ClinicalPriority {
  id: string;
  type: 'medical_urgency' | 'nutrition_intervention' | 'further_assessment';
  title_en: string;
  title_bn: string;
  linkedHypothesisId?: string;
  linkedObservationIds: string[];
  urgency: ClinicalUrgency;
  rationale_en: string;
  rationale_bn: string;
  rank: number;
}

// ─── Timeline Event ───────────────────────────────────────────────
export interface ClinicalTimelineEvent {
  id: string;
  date: string;
  eventType: 'symptom_onset' | 'medication_start' | 'medication_stop' | 'antibiotic_exposure' | 'dietary_change' | 'weight_change' | 'illness' | 'lab_result' | 'lifestyle_change' | 'reproductive_event' | 'intervention' | 'clinician_note';
  title_en: string;
  title_bn: string;
  description_en: string;
  description_bn: string;
  relatedHypothesisIds: string[];
  temporalAssociation?: string; // "possible contributor" label, never "cause"
  clinicianConfirmed?: boolean;
  clinicianAnnotation?: string;
}

// ─── Intervention Goal ────────────────────────────────────────────
export interface InterventionGoal {
  id: string;
  category: 'dietary_adequacy' | 'macronutrient_target' | 'protein_distribution' | 'fiber_adequacy' | 'meal_timing' | 'hydration' | 'food_trigger_investigation' | 'reintroduction' | 'nutritional_support' | 'metabolic_strategy' | 'sleep_circadian' | 'lifestyle_physical_activity' | 'restriction_management' | 'medication_nutrient_review' | 'lab_followup';
  title_en: string;
  title_bn: string;
  clinicalObjective_en: string;
  clinicalObjective_bn: string;
  linkedObservationId?: string;
  linkedHypothesisId?: string;
  linkedConfirmedCondition?: string;
  rationale_en: string;
  rationale_bn: string;
  safetyConsiderations: string[];
  nutritionalConstraints: string[];
  monitoringIndicators: string[];
  proposedFollowUpWeeks?: number;
  clinicianApprovalStatus: 'pending' | 'approved' | 'rejected' | 'modified';
  clinicianNote?: string;
}

// ─── Clinician Approval Record ────────────────────────────────────
export interface ClinicianApprovalRecord {
  targetId: string; // hypothesis or intervention ID
  targetType: 'hypothesis' | 'intervention';
  decision: ClinicianDecision | 'approved' | 'rejected';
  clinicianId?: string;
  timestamp: string;
  reason?: string;
  evidenceSnapshot: string; // JSON-serialized minimal snapshot
  ruleVersion: string;
}

// ─── Safety Constraint (for P3 diet engine) ──────────────────────
export interface SafetyConstraint {
  type: 'confirmed_allergy' | 'hard_contraindication' | 'population_restriction' | 'medication_food_interaction' | 'clinician_disallowed';
  description_en: string;
  description_bn: string;
  affectedFoodIds?: string[];
  affectedTags?: string[];
  source: string;
}

// ─── Nutritional Target (for P3 diet engine) ─────────────────────
export interface NutritionalTarget {
  nutrient: string;
  targetMin?: number;
  targetMax?: number;
  unit: string;
  rationale_en: string;
  rationale_bn: string;
  source: 'anthropometric_calculation' | 'condition_adjustment' | 'lab_finding' | 'clinician_set';
}

// ─── Diet Planning Context (P3 interface) ────────────────────────
export interface DietPlanningContext {
  patientId: string;
  visitId: string;
  generatedAt: string;
  confirmedAllergies: string[];
  hardRestrictions: SafetyConstraint[];
  approvedInterventionGoals: InterventionGoal[];
  nutritionalTargets: NutritionalTarget[];
  lifeStage: string;
  medicationConstraints: string[];
  foodPreferences: Record<string, unknown>;
  currentCarePhase: 1 | 2 | 3 | 4;
  clinicianApprovedHypotheses: string[];
  unconfirmedHypotheses: string[]; // NOT to be used as hard food restrictions
}

// ─── Targeted Laboratory Recommendation ──────────────────────────
export type LabPriority =
  | 'immediate_clinical_evaluation'
  | 'high_priority'
  | 'routine_consideration'
  | 'optional_conditional'
  | 'not_indicated';

export interface LabRecommendation {
  id: string;
  testName_en: string;
  testName_bn: string;
  category: 'metabolic' | 'renal' | 'hepatic' | 'hematology_iron' | 'thyroid' | 'inflammatory' | 'vitamins_minerals' | 'gastrointestinal';
  clinicalRationale_en: string;
  clinicalRationale_bn: string;
  triggeringFindingIds: string[];
  priority: LabPriority;
  existingTestStatus: 'tested' | 'pending' | 'not_tested';
  lastKnownValue?: string | number;
  lastTestedDate?: string;
  missingInformationToClarify: string[];
  requiresClinicianApproval: boolean;
  clinicianApproved?: boolean;
  specimenType?: string;
  fastingRequirement_en?: string;
  fastingRequirement_bn?: string;
  interpretationGuidance_en?: string;
  interpretationGuidance_bn?: string;
  isAlreadyRecorded?: boolean;
}

// ─── Ayurvedic Interpretation Models ─────────────────────────────
export interface AyurvedicInterpretationResult {
  frameworkVersion: string;
  prakriti: {
    vata_score: number;
    pitta_score: number;
    kapha_score: number;
    dominant_constitution: string;
    is_preliminary: boolean;
    primaryDosha?: 'Vata' | 'Pitta' | 'Kapha' | 'Vata-Pitta' | 'Pitta-Kapha' | 'Vata-Kapha' | 'Tridoshic' | 'Unassessed';
    vataPercentage?: number;
    pittaPercentage?: number;
    kaphaPercentage?: number;
    constitutionalTendencies_en?: string[];
    constitutionalTendencies_bn?: string[];
  };
  vikriti: {
    vata_imbalance: number;
    pitta_imbalance: number;
    kapha_imbalance: number;
    primary_aggravation: string;
    aggravation_severity: 'none' | 'mild' | 'moderate' | 'severe';
    aggravatedDoshas?: Array<'Vata' | 'Pitta' | 'Kapha'>;
    primaryAggravation?: 'Vata' | 'Pitta' | 'Kapha' | 'Dual' | 'None';
    triggeringSymptomIds?: string[];
  };
  agni: {
    type: 'samagni' | 'vishamagni' | 'tikshnagni' | 'mandagni' | 'unassessed';
    clinical_manifestation_en: string;
    clinical_manifestation_bn: string;
    therapeutic_diet_principles_en: string[];
    therapeutic_diet_principles_bn: string[];
    status?: 'Sama' | 'Vishama' | 'Tikshna' | 'Manda' | 'Unassessed';
    description_en?: string;
    description_bn?: string;
    dietaryAdjustments_en?: string[];
    dietaryAdjustments_bn?: string[];
  };
  pathya_apathya_handoff: {
    favored_rasas: string[];
    minimized_rasas: string[];
    virya_preference: 'sheeta' | 'ushna' | 'neutral';
    pathya_foods_bn: string[];
    apathya_foods_bn: string[];
    digestive_tolerance_notes_en: string;
    digestive_tolerance_notes_bn: string;
  };
  pathyaRecommendations?: {
    generalPrinciples_en: string[];
    generalPrinciples_bn: string[];
    favorableFoods: string[];
    unfavorableFoods: string[];
  };
  clinicalSafetyPrimacyNote: string;
  safetyOverrideNotice?: string;
}

// ─── Masanumasika Pregnancy Analysis Models ───────────────────────
export interface MasanumasikaPregnancyAnalysisResult {
  applicable: boolean;
  gestationalAgeVerified: boolean;
  gestationalWeeks?: number;
  gestationalDays?: number;
  pregnancyMonth?: number;
  trimester?: 1 | 2 | 3;
  classicalMonthTitle_en?: string;
  classicalMonthTitle_bn?: string;
  classicalAyurvedicFocus?: string[];
  bangladeshiWholeFoodAdaptations?: string[];
  maternalNutritionalPriorities?: Array<{
    nutrient: string;
    rationale_en: string;
    rationale_bn: string;
    dietarySources: string[];
  }>;
  strictFoodSafetyExclusions?: string[];
  safetyBoundaryNotice: string;
  clinicianReviewStatus: 'pending' | 'reviewed';
}

// ─── Dietary Pattern & Acid Load (PRAL) Models ───────────────────
export interface DietaryPatternAnalysisResult {
  plantFoodGroupDiversityScore: number; // 0-12 plant groups
  plantDiversityRank: 'high' | 'moderate' | 'low' | 'uncertain';
  estimatedPlantSpeciesCount?: number;
  dailyFruitVegServings: number;
  proteinFrequencyRank: 'low' | 'moderate' | 'high';
  ultraProcessedBurden: 'low' | 'moderate' | 'high' | 'very_high';
  addedSugarExposure: 'minimal' | 'moderate' | 'excessive';
  sodiumRiskFlag: boolean;
  estimatedPRALScore?: number | null; // mEq/day when quantified nutrient grams provided; otherwise null
  pralStatus: 'insufficient_quantitative_data' | 'calculated' | 'unavailable';
  pralInterpretation: 'alkalizing' | 'neutral' | 'acid_forming' | 'uncertain' | 'insufficient_data';
  pralCaveat: string;
  completenessStatus: 'complete' | 'partial' | 'minimal';
  confirmedZeroCount: number;
  notSureCount: number;
  unansweredCount: number;
}

// ─── Metabolic Health Analysis Models ─────────────────────────────
export interface MetabolicHealthAnalysisResult {
  glycemicStabilityPattern: 'stable' | 'reactive_hypoglycemia_tendency' | 'dysglycemia_pattern' | 'uncertain';
  hypoglycemicMedicationActive: boolean;
  medicationMealSafetyPriority: boolean;
  centralAdiposityRisk: boolean;
  homaIrAnalysis?: {
    value: number;
    status: 'normal' | 'borderline' | 'significant_insulin_resistance';
    isValidated: boolean;
  };
  metabolicPriorities: string[];
}

// ─── Gut Health Analysis Models ──────────────────────────────────
export interface GutHealthAnalysisResult {
  bristolPattern: string;
  transitTimeEstimate: 'rapid_diarrhea' | 'normal' | 'delayed_constipation';
  dysbiosisSymptomBurden: 'none' | 'mild' | 'moderate' | 'significant';
  upperGiStatus: string;
  functionalMechanisms: string[];
  dietaryContributors: string[];
  microbiomeTestingCaveat: string;
  furtherInvestigationsSuggested: string[];
}

// ─── Structured P3 Planning Handoff Contract ─────────────────────
export interface P3NutritionPlanningContext {
  patientId: string;
  visitId: string;
  assessmentId: string;
  assessmentVersion: string;
  clinicalAssessmentApproved: boolean;
  approvalTimestamp?: string;
  approvedByClinicianId?: string;
  analysisInvalidatedAt?: string;
  invalidationReason?: string;
  
  confirmedAllergies: string[];
  feedingRoute: { route: string; oral_intake_permitted: boolean; requires_specialist_support: boolean };
  hardRestrictions: SafetyConstraint[];
  prescribedFluidLimit_mL?: number;
  prescribedSodiumLimit_mg?: number;
  prescribedPotassiumLimit_mg?: number;
  prescribedProteinCap_g?: number;
  
  energyTargetCalories: number;
  proteinTargetGrams: number;
  carbohydrateConsiderations: string[];
  
  clinicalSafetyFindings: string[];
  functionalNutritionPriorities: string[];
  dietaryFrequencyFindings: DietaryPatternAnalysisResult;
  
  ayurvedicContext: AyurvedicInterpretationResult;
  pregnancyContext?: MasanumasikaPregnancyAnalysisResult;
  approvedInterventionGoals: InterventionGoal[];
}

// ─── Pre-Intervention Clinical Health Assessment Report ───────────
export interface ClinicalHealthAssessmentReport {
  patientId: string;
  visitId: string;
  reportId: string;
  reportMode: 'quick' | 'comprehensive';
  generatedAt: string;
  revision: number;
  isApproved: boolean;
  approvedBy?: string;
  approvalDate?: string;
  clinicianNotes?: string;
  analysisInvalidatedAt?: string;
  invalidationReason?: string;
  
  sectionA_patientInfo: {
    name: string;
    id: string;
    age: number;
    gender: string;
    visitDate: string;
    assessmentMode: string;
    populationGroup: string;
    clinicalPathways: string[];
  };
  sectionB_anthropometrics: {
    height_cm: number;
    weight_kg: number;
    bmi: number;
    bmiCategory_en: string;
    bmiCategory_bn: string;
    waist_cm: number;
    whtr: number;
    whtrRisk_en: string;
    whtrRisk_bn: string;
    weightTrend: string;
    bmr_safe_floor: number;
  };
  sectionC_clinicalHistory: {
    chiefComplaint: string;
    onsetTimeline: string;
    triggerEvent: string;
    conditions: string[];
    timelineEvents: ClinicalTimelineEvent[];
  };
  sectionD_functionalMatrix: DomainFinding[];
  sectionE_dietaryPattern: DietaryPatternAnalysisResult;
  sectionF_ayurvedicAssessment: AyurvedicInterpretationResult;
  sectionG_pregnancyMasanumasika?: MasanumasikaPregnancyAnalysisResult;
  sectionH_laboratoryFindings: {
    availableResults: Array<{ marker: string; value: string | number; unit: string; flag?: string; normalRange: string }>;
    pendingTests: string[];
    missingInformation: string[];
  };
  sectionI_rootCauseHypotheses: ClinicalHypothesis[];
  sectionJ_medicationReview: {
    medications: string[];
    safetyConsiderations: string[];
    depletionRisks: string[];
  };
  sectionK_clinicalSafety: {
    confirmedAllergies: string[];
    hardStops: string[];
    redFlags: ClinicalRedFlag[];
    feedingRoute: string;
    hypoglycemiaProtocolRequired: boolean;
  };
  sectionL_laboratoryRecommendations: LabRecommendation[];
  sectionM_clinicalPriorities: ClinicalPriority[];
  sectionN_clinicianReview: {
    reviewingNutritionist: string;
    reviewDate: string;
    status: 'pending' | 'provisional_reviewed' | 'fully_approved';
    notes: string;
    revisionNumber: number;
  };
}

// ─── Full P2 Analysis Result ──────────────────────────────────────
export interface P2AnalysisResult {
  patientId: string;
  visitId: string;
  analysisVersion: string;
  generatedAt: string;
  observations: ClinicalObservation[];
  domainFindings: DomainFinding[];
  hypotheses: ClinicalHypothesis[];
  redFlags: ClinicalRedFlag[];
  priorities: ClinicalPriority[];
  timelineEvents: ClinicalTimelineEvent[];
  interventionGoals: InterventionGoal[];
  approvalHistory: ClinicianApprovalRecord[];
  dietPlanningContext: DietPlanningContext;
  missingHighValueData: string[];
  analysisInvalidatedAt?: string;

  // Enhanced P2 Analytics
  labRecommendations: LabRecommendation[];
  ayurvedicInterpretation: AyurvedicInterpretationResult;
  masanumasikaAnalysis: MasanumasikaPregnancyAnalysisResult;
  dietaryPatternAnalysis: DietaryPatternAnalysisResult;
  metabolicHealthAnalysis: MetabolicHealthAnalysisResult;
  gutHealthAnalysis: GutHealthAnalysisResult;
  report: ClinicalHealthAssessmentReport;
  p3PlanningContext: P3NutritionPlanningContext;
}
