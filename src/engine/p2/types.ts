// P2 Clinical Intelligence Engine - Type Definitions
// All types for the Root-Cause Intelligence system

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
  overallBurden: 'none' | 'mild' | 'moderate' | 'significant';
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
  analysisInvalidatedAt?: string; // set when patient data changes post-approval
}
