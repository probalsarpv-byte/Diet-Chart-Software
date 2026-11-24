/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Phase R5: Advanced Functional Nutrition Assessment & Systems Intelligence Contracts
 * 
 * Defines core contracts for:
 * 1. Life-Stage First Population Model & Clinical Contexts
 * 2. Optional Overlapping Clinical Pathways Registry (16+ domains)
 * 3. 7-Domain Functional Medicine Matrix & ATM (Antecedents, Triggers, Mediators)
 * 4. Deterministic Interconnected Systems Network (Nodes & Typed Edges)
 * 5. Structured Running Medication Entry & Reconciliation
 * 6. Insulin-Aware Nutrition Regimen & Carbohydrate Synchronization
 * 7. Comprehensive Medication-Nutrition Interaction Rules & Psychiatric Nutrition
 * 8. Multimorbidity Conflict Priority Resolution Layer
 * 9. R4 Integration Adapter & Stale Section Invalidation Contracts
 */

import { PopulationGroup } from './index';

// ── 1. Population Model — Life Stage First ──────────────────────────
export type LifeStage =
  | 'infant'          // 0 - 1 year
  | 'child'           // 1 - 12 years
  | 'adolescent'      // 12 - 18 years
  | 'adult'           // 18 - 64 years
  | 'older_adult'     // 65+ years (geriatric context)
  | 'not_yet_assessed';

export interface PregnancyModifier {
  active: boolean;
  trimester?: 1 | 2 | 3;
  gestational_age_weeks?: number;
  expected_due_date?: string;
  is_high_risk?: boolean;
}

export interface LactationModifier {
  active: boolean;
  stage?: '<6m' | '>6m';
  exclusive_breastfeeding?: boolean;
  postpartum_months?: number;
}

export type ClinicalContextFlag =
  | 'oncology'
  | 'renal_disease'
  | 'malnutrition_risk'
  | 'specialized_feeding'
  | 'frailty'
  | 'disability_functional_limitation'
  | 'bariatric_history'
  | 'eating_disorder_history';

export interface R5PopulationProfile {
  life_stage: LifeStage;
  age?: number;               // Explicitly optional! Never assumed 0 when unentered.
  is_age_unentered: boolean;  // True when user has not recorded age
  sex?: 'male' | 'female' | 'other' | 'unentered';
  pregnancy?: PregnancyModifier;
  lactation?: LactationModifier;
  clinical_contexts: ClinicalContextFlag[];
  historical_population_group?: PopulationGroup; // Backwards compatibility anchor
}

// ── 2. Optional Overlapping Clinical Pathways (16+ Domains) ─────────
export type ExpandedClinicalPathwayId =
  | 'metabolic_endocrine'                 // T2D, IR, Thyroid, PCOS, Metabolic Syndrome
  | 'gastrointestinal_hepatobiliary'      // GERD, SIBO, IBD, IBS, NAFLD, Cirrhosis
  | 'cardiovascular'                      // Hypertension, Dyslipidemia, CAD, Atherosclerosis
  | 'renal_electrolyte'                   // CKD 1-5, Hemodialysis, Proteinuria, Nephrotic
  | 'oncology'                            // Solid tumors, Hematologic, Chemotherapy support
  | 'underweight_malnutrition'            // Involuntary weight loss, Sarcopenia, Micronutrient deficiency
  | 'surgical_postoperative'              // Pre/Post-op, Bariatric, Resection, Stoma
  | 'critical_care_specialized_feeding'   // TPN, PPN, Enteral PEG/NG, Dysphagia, NPO
  | 'mental_health_neuropsychiatric'      // Major Depression, Anxiety, Bipolar, Schizophrenia
  | 'neurological_neurodevelopmental'     // Epilepsy, Migraine, Parkinson's, ADHD, Autism
  | 'autoimmune_inflammatory'             // RA, Hashimoto's, Lupus, Celiac, Chronic Inflammation
  | 'reproductive_hormonal'               // Infertility, Menopause, Endometriosis, Andropause
  | 'musculoskeletal_bone'                // Osteoporosis, Osteoarthritis, Gout, Chronic Pain
  | 'dermatological_skin'                 // Eczema, Psoriasis, Acne, Wound Healing
  | 'feeding_swallowing_rehabilitation'   // Mechanical Dysphagia, Oral Aversion, Stroke Rehab
  | 'other_multimorbidity';               // Complex multi-system intersecting conditions

export type R5ClinicalPathwayId = ExpandedClinicalPathwayId;

export type ClinicalPathwayCategory =
  | 'Metabolic & Organ Systems'
  | 'Immune & Inflammatory'
  | 'Neuropsychiatric & Brain'
  | 'Surgical & Acute Care'
  | 'Life Span & Musculoskeletal';

export type PathwaySelectionState =
  | 'NOT_ASSESSED'
  | 'NO_KNOWN_PATHWAY'
  | 'PATHWAYS_SELECTED';

export interface ClinicalPathwayMetadata {
  id: ExpandedClinicalPathwayId;
  category: ClinicalPathwayCategory;
  title_en: string;
  title_bn: string;
  description_en: string;
  description_bn: string;
  icon_name: string;
  relevant_conditions_map: string[];
}

export interface PatientPathwayState {
  status: PathwaySelectionState;
  selected_pathways: ExpandedClinicalPathwayId[];
  notes?: string;
  assessed_at?: string;
}

// ── 3. 7-Domain Functional Medicine Matrix & ATM Model ──────────────
export type FunctionalMatrixDomain =
  | 'assimilation'             // Digestion, Absorption, Microbiome, GI barrier
  | 'defense_repair'           // Immune, Inflammation, Infection, Food reactions
  | 'energy'                   // Mitochondria, Oxidation-Reduction, Satiety/Energy
  | 'biotransformation'        // Liver Phase I/II, Toxicity, Elimination
  | 'transport'                // Cardiovascular, Lymphatic, Endothelial, Fluid
  | 'communication'            // Endocrine, Neurotransmitters, Cytokines
  | 'structural_integrity';    // Cell membranes, Musculoskeletal, Connective tissue

export type ATMType =
  | 'antecedent'               // Genetic, family, or historical predisposing factor
  | 'trigger'                  // Initiating acute event or circumstance
  | 'mediator';                // Factors perpetuating the observed dysfunction

export interface FunctionalObservation {
  id: string;
  observation_id?: string;
  domain: FunctionalMatrixDomain;
  atm_type?: ATMType;
  title_en: string;
  title_bn: string;
  description_en: string;
  description_bn: string;
  confidence_status: 'confirmed_clinical' | 'patient_reported' | 'lab_supported' | 'clinician_verified' | 'plausible_hypothesis' | 'insufficient_evidence';
  evidence_source: string;
  source_type: 'intake_self_report' | 'clinical_history' | 'biomarker_lab' | 'functional_assessment' | 'clinician_evaluation';
  clinician_verified: boolean;
  visit_id?: string;
  recorded_at: string;
}

// ── 4. Deterministic Interconnected Systems Network Engine ──────────
export type SystemsNodeType =
  | 'PatientObservation'
  | 'FunctionalSystem'
  | 'ClinicalCondition'
  | 'MedicationExposure'
  | 'NutrientExposure'
  | 'LifestyleFactor'
  | 'LaboratoryObservation'
  | 'ClinicalHypothesis'
  | 'SafetyConstraint'
  | 'InterventionCandidate';

export type SystemsEdgeRelation =
  | 'ASSOCIATED_WITH'
  | 'MAY_CONTRIBUTE_TO'
  | 'MAY_MODIFY'
  | 'INTERACTS_WITH'
  | 'REQUIRES_REVIEW'
  | 'CONTRAINDICATES'
  | 'SUPPORTED_BY'
  | 'CONFLICTS_WITH';

export interface SystemsNetworkNode {
  id: string;
  type: SystemsNodeType;
  label_en: string;
  label_bn: string;
  functional_domains: FunctionalMatrixDomain[];
  confidence: 'verified_fact' | 'patient_reported' | 'hypothesis' | 'unconfirmed';
  data_payload?: Record<string, any>;
}

export interface SystemsNetworkEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship: SystemsEdgeRelation;
  clinical_relevance: 'critical_safety' | 'high_priority' | 'moderate' | 'exploratory';
  evidence_citation: string;
  rationale_en: string;
  rationale_bn: string;
  uncertainty_flag: boolean;
  applicable_population?: string;
  last_evaluated: string;
}

export interface SystemsNetworkGraph {
  nodes: SystemsNetworkNode[];
  edges: SystemsNetworkEdge[];
  evaluated_at: string;
  active_conflicts_count: number;
  unresolved_hypotheses_count: number;
}

// ── 5. Structured Running Medication Entry & Reconciliation ─────────
export type R5MedicationStatus =
  | 'active'
  | 'discontinued'
  | 'draft_candidate'
  | 'unknown';

export type R5RuleCoverageStatus =
  | 'fully_covered'
  | 'partially_covered'
  | 'identity_only'
  | 'rules_unavailable';

export interface R5MedicationRecord {
  id: string;
  brand_name?: string;
  generic_name: string;
  manufacturer?: string;
  formulation?: string;              // e.g. "Tablet", "Capsule", "Injection"
  product_strength?: string;         // e.g. "500 mg", "10 mg/5 mL"
  prescribed_dose: string;           // e.g. "500 mg" or "2 tablets"
  dose_unit: string;                 // e.g. "mg", "units", "tablets"
  frequency: string;                 // e.g. "Twice Daily", "With breakfast"
  route: string;                     // e.g. "Oral", "Subcutaneous"
  administration_times: string[];    // e.g. ["08:00", "20:00"]
  is_timing_unknown: boolean;
  relationship_to_meals: 'with_meal' | 'before_meal_empty_stomach' | 'after_meal' | 'independent_of_meals' | 'bedtime' | 'unknown';
  indication?: string;
  start_date?: string;
  stop_date?: string;
  is_prn: boolean;                   // Pro re nata / As-needed
  prescriber_instructions?: string;
  dose_titration_history?: string;
  adherence_status?: 'adherent' | 'intermittent_misses' | 'severe_nonadherence' | 'unknown';
  adverse_effects_reported?: string[];
  verification_status: 'patient_reported' | 'clinician_verified' | 'prescription_documented' | 'unverified';
  status: R5MedicationStatus;
  rule_coverage: R5RuleCoverageStatus;
  source: 'intake_staged' | 'clinician_entry' | 'legacy_record';
  verified_by?: string;
  verified_at?: string;
  notes?: string;
}

// ── 6. Insulin-Aware Nutrition Regimen ──────────────────────────────
export type InsulinRegimenType =
  | 'basal_only'
  | 'rapid_acting_mealtime'
  | 'regular_insulin'
  | 'nph_intermediate'
  | 'premixed_fixed_ratio'
  | 'basal_bolus_multiple_daily_injections'
  | 'fixed_dose_mealtime'
  | 'flexible_carb_ratio_bolus'
  | 'continuous_subcutaneous_insulin_pump'
  | 'automated_insulin_delivery';

export interface InsulinRegimenContext {
  active: boolean;
  regimen_type: InsulinRegimenType;
  formulation_name: string;           // e.g. "Insulin Glargine (Lantus 100 U/mL)"
  prescribed_units?: number;
  administration_time?: string;
  timing_relative_to_meal?: 'immediate_pre_meal' | '15_min_pre_meal' | 'post_meal' | 'bedtime';
  is_fixed_meal_dosing: boolean;
  prescriber_icr?: number;            // Insulin-to-Carb Ratio (1 unit per X grams carb) - NEVER INVENTED!
  prescriber_isf?: number;            // Insulin Sensitivity Factor (1 unit lowers BG by X mg/dL)
  cgm_smbg_available: boolean;
  hypoglycemia_history_past_month: boolean;
  fast_acting_carbs_mandate: boolean; // Mandates 15-20g rapid glucose on hand
  required_action_summary_en: string;
  required_action_summary_bn: string;
}

// ── 7. Comprehensive Medication-Nutrition Interaction Rules ────────
export type DrugNutritionSeverity =
  | 'critical_hard_stop'
  | 'high_clinical_review'
  | 'moderate_caution'
  | 'monitoring_advisory';

export interface MedicationNutritionRule {
  rule_id: string;
  drug_category: 'diabetes_endocrine' | 'cardiovascular_renal' | 'psychiatric_neurological' | 'gastrointestinal' | 'antimicrobial_immune' | 'oncology_metabolic';
  generic_patterns: string[];
  severity: DrugNutritionSeverity;
  trigger_criteria_en: string;
  trigger_criteria_bn: string;
  nutritional_consequence_en: string;
  nutritional_consequence_bn: string;
  mechanism_rationale_en: string;
  mechanism_rationale_bn: string;
  evidence_source: string;
  revision_date: string;
  required_action_en: string;
  required_action_bn: string;
  title_en: string;
  title_bn: string;
}

export interface DrugNutrientFinding {
  rule_id: string;
  drug_name: string;
  severity: DrugNutritionSeverity;
  title_en: string;
  title_bn: string;
  rationale_en: string;
  rationale_bn: string;
  required_action_en: string;
  required_action_bn: string;
  evidence_source: string;
  affected_nutrients: string[];
}

// ── 8. Multimorbidity Conflict Priority Resolution ──────────────────
export interface CompetingRecommendation {
  source_condition: string;
  recommendation_en: string;
  recommendation_bn: string;
  nutrient_parameter: string;
  priority_weight: number;
}

export interface MultimorbidityConflictResolution {
  conflict_id: string;
  parameter: string;                  // e.g. "potassium", "fluid", "carbohydrate", "fiber"
  competing_conditions: string[];
  competing_recommendations: CompetingRecommendation[];
  resolved_priority_recommendation_en: string;
  resolved_priority_recommendation_bn: string;
  clinical_decision_rationale_en: string;
  clinical_decision_rationale_bn: string;
  requires_clinician_verification: boolean;
  hard_safety_boundary_en?: string;
  hard_safety_boundary_bn?: string;
}

// ── 9. R4/R5 Handoff & Invalidation Contract ────────────────────────
export type R4SectionId =
  | 'lifestyle'
  | 'exercise'
  | 'sleep'
  | 'hydration'
  | 'supplements'
  | 'chronotherapy';

export interface R4StaleSectionNotification {
  section: R4SectionId;
  reason_en: string;
  reason_bn: string;
  invalidated_by: 'medication_change' | 'pathway_change' | 'vital_or_lab_change' | 'fluid_prescription_change';
  requires_reapproval: boolean;
}

export interface R5ClinicalContextPayload {
  population: R5PopulationProfile;
  pathways: PatientPathwayState;
  functional_findings: FunctionalObservation[];
  medications: R5MedicationRecord[];
  insulin_context: InsulinRegimenContext;
  dni_findings: DrugNutrientFinding[];
  multimorbidity_resolutions: MultimorbidityConflictResolution[];
  systems_graph: SystemsNetworkGraph;
  stale_r4_sections: R4StaleSectionNotification[];
  generated_at: string;
}
