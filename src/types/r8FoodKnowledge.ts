/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION PLATFORM
 * PHASE R8: FOOD, NUTRIENT, BIOACTIVE, MECHANISM & INTELLIGENT SUBSTITUTION TYPES
 */

import { FoodItem, PatientProfile } from './index';
import { FunctionalMatrixDomain } from './r5Systems';

export type TrafficLightStatus = 'GREEN' | 'YELLOW' | 'RED';

export type R8FoodState = 'raw' | 'cooked' | 'dried' | 'fermented' | 'processed' | 'ready_to_eat';
export type R8MeasurementBasis = 'per_100g_edible' | 'per_100g_as_purchased' | 'per_serving' | 'qualitative';
export type R8NutrientDataQuality =
  | 'measured_numeric'
  | 'measured_zero'
  | 'documented_absence'
  | 'trace_amount'
  | 'below_detection_limit'
  | 'calculated_estimate'
  | 'missing_unknown'
  | 'unavailable'
  | 'unsupported_conversion';

export type R8EvidenceCategory =
  | 'established_human_physiology'
  | 'clinical_guideline'
  | 'human_intervention'
  | 'human_observational'
  | 'preclinical_mechanistic'
  | 'exploratory_hypothesis';

export interface R8EvidenceReference {
  evidence_id: string;
  claim_en: string;
  claim_bn: string;
  category: R8EvidenceCategory;
  source_title: string;
  publication_year: number;
  url_or_doi: string;
  study_or_source_type: string;
  population_context: string;
  exposure_formulation: string;
  dose_context: string;
  limitations_en: string;
  limitations_bn: string;
  review_date: string;
}

export interface R8CanonicalNutrientDefinition {
  canonical_id: string;
  r7_nutrient_id?: string;
  group: 'energy_macro' | 'fatty_acid' | 'amino_acid' | 'mineral' | 'vitamin' | 'other';
  label_en: string;
  label_bn: string;
  canonical_unit: 'kcal' | 'kJ' | 'g' | 'mg' | 'mcg' | 'IU' | 'mcg_RAE' | 'mcg_DFE';
  supported_units: string[];
  food_json_key?: string;
  chemical_forms?: string[];
  established_functions_en: string;
  established_functions_bn: string;
  absorption_considerations_en?: string;
  relevant_lab_markers?: string[];
  relevant_systems: FunctionalMatrixDomain[];
  evidence_ids: string[];
  uncertainties_en?: string;
}

export interface R8NutrientMeasurement {
  canonical_nutrient_id: string;
  value: number | null;
  unit: string;
  quality: R8NutrientDataQuality;
  basis: R8MeasurementBasis;
  food_state: R8FoodState;
  source: string;
  note_en?: string;
}

export interface R8FoodMetadataExtension {
  food_id: string;
  source_database_id: string;
  source_version: string;
  food_state: R8FoodState;
  measurement_basis: R8MeasurementBasis;
  regional_aliases_bn: string[];
  regional_aliases_en: string[];
  preparation_notes_en?: string;
  preparation_notes_bn?: string;
}

export interface R8BioactiveCompound {
  compound_id: string;
  family:
    | 'polyphenols'
    | 'flavonoids'
    | 'curcuminoids'
    | 'gingerols_shogaols'
    | 'glucosinolates_isothiocyanates'
    | 'carotenoids'
    | 'phytosterols'
    | 'lignans'
    | 'organosulfur'
    | 'fermentable_fiber_prebiotic'
    | 'bioactive_peptide';
  name_en: string;
  name_bn: string;
  culinary_vs_extract_note_en: string;
  culinary_vs_extract_note_bn: string;
  evidence_category: R8EvidenceCategory;
  evidence_ids: string[];
}

export interface R8FoodBioactiveLink {
  food_id: string;
  compound_id: string;
  presence_type:
    | 'measured_quantitative'
    | 'documented_qualitative'
    | 'estimated_method'
    | 'literature_potential'
    | 'unknown';
  quantity?: number | null;
  unit?: string;
  preparation_state?: R8FoodState;
  evidence_category: R8EvidenceCategory;
  evidence_ids: string[];
  limitations_en: string;
}

export interface R8BiologicalMechanism {
  mechanism_id: string;
  name_en: string;
  name_bn: string;
  category:
    | 'digestive_absorption'
    | 'glycemic_insulin'
    | 'lipid_cardiometabolic'
    | 'oxidative_inflammatory'
    | 'cellular_energy'
    | 'one_carbon_hematology'
    | 'endocrine_mineral'
    | 'hepatic_detox'
    | 'renal_electrolyte';
  pathway_tag?: string;
  evidence_category: R8EvidenceCategory;
  is_exploratory_molecular: boolean;
  relevant_systems: FunctionalMatrixDomain[];
  summary_en: string;
  summary_bn: string;
  limitations_en: string;
  evidence_ids: string[];
}

export type R8KnowledgeNodeType =
  | 'Food'
  | 'Nutrient'
  | 'BioactiveCompound'
  | 'Recipe'
  | 'PreparationMethod'
  | 'BiologicalMechanism'
  | 'FunctionalSystem'
  | 'LaboratoryObservation'
  | 'ClinicalCondition'
  | 'MedicationExposure'
  | 'SafetyConstraint';

export type R8KnowledgeRelationType =
  | 'CONTAINS_NUTRIENT'
  | 'CONTAINS_BIOACTIVE'
  | 'PARTICIPATES_IN'
  | 'ASSOCIATED_WITH'
  | 'MAY_MODIFY'
  | 'MAY_AFFECT_ABSORPTION'
  | 'SUPPORTS_PHYSIOLOGICAL_FUNCTION'
  | 'INTERACTS_WITH'
  | 'REQUIRES_REVIEW'
  | 'CONTRAINDICATES'
  | 'SUPPORTED_BY';

export interface R8KnowledgeNode {
  id: string;
  type: R8KnowledgeNodeType;
  label_en: string;
  label_bn: string;
  payload?: Record<string, any>;
}

export interface R8KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  relationship: R8KnowledgeRelationType;
  evidence_category: R8EvidenceCategory;
  evidence_ids: string[];
  limitations_en: string;
  directionality: 'directed' | 'undirected';
  verification_state: 'established' | 'evidence_qualified' | 'exploratory' | 'patient_safety_gated';
}

export interface R8PatientFoodEligibilityResult {
  food_id: string;
  is_safe_for_patient: boolean;
  traffic_status: TrafficLightStatus | 'UNCLASSIFIED';
  exclusion_reasons_en: string[];
  exclusion_reasons_bn: string[];
  cautions_en: string[];
  cautions_bn: string[];
  drug_interactions_en: string[];
  preparation_requirements_en: string[];
}

export type R8PreparationMethodType =
  | 'washing'
  | 'soaking'
  | 'boiling'
  | 'steaming'
  | 'pressure_cooking'
  | 'roasting'
  | 'grilling'
  | 'frying'
  | 'fermentation'
  | 'germination'
  | 'bengali_curry';

export interface R8PreparationGuidance {
  id: string;
  method: R8PreparationMethodType;
  applicable_categories: string[];
  title_en: string;
  title_bn: string;
  nutrient_retention_note_en: string;
  nutrient_retention_note_bn: string;
  clinical_applicability_en: string;
  limitations_en: string;
  evidence_ids: string[];
}

export interface R8RecipeIngredient {
  food_id: string;
  raw_weight_g: number;
  edible_portion_applied?: boolean;
  preparation_note_en?: string;
  is_added_seasoning_or_fat?: boolean;
}

export interface R8Recipe {
  recipe_id: string;
  version: string;
  name_en: string;
  name_bn: string;
  category: string;
  preparation_method: R8PreparationMethodType;
  ingredients: R8RecipeIngredient[];
  water_added_ml: number;
  final_cooked_yield_g: number;
  servings: number;
  household_serving_en: string;
  household_serving_bn: string;
  guidance_en: string;
  guidance_bn: string;
  provenance: string;
}

export interface R8ComputedNutrientSubtotal {
  canonical_nutrient_id: string;
  label_en: string;
  unit: string;
  known_total: number;
  per_serving: number;
  contributing_foods_count: number;
  total_foods_count: number;
  missing_food_ids: string[];
  is_incomplete: boolean;
  coverage_ratio: number;
}

export interface R8ComputedRecipeAnalysis {
  recipe: R8Recipe;
  per_serving_weight_g: number;
  total_raw_ingredient_g: number;
  nutrients: Record<string, R8ComputedNutrientSubtotal>;
  incomplete_nutrients: string[];
  is_nutrition_incomplete: boolean;
  safety: {
    is_safe_for_patient: boolean;
    traffic_status: TrafficLightStatus;
    propagated_allergens: string[];
    hard_contraindications_en: string[];
    cautions_en: string[];
    requires_clinician_review: boolean;
    review_reasons_en: string[];
  };
  provenance_note_en: string;
}

export type R8SubstitutionMode =
  | 'energy_matched'
  | 'carb_matched'
  | 'protein_matched'
  | 'nutrient_targeted'
  | 'multinutrient_balanced'
  | 'clinical_restriction_aware'
  | 'manual_clinician_review';

export type R8SubstitutionMatchStatus =
  | 'equivalent_within_tolerance'
  | 'partially_equivalent_review'
  | 'non_equivalent_clinical_alternative'
  | 'clinically_contraindicated'
  | 'no_suitable_equivalent';

export interface R8SubstitutionRequest {
  original_food_id: string;
  original_raw_grams: number;
  original_food_state?: R8FoodState;
  meal_id?: string;
  patient: PatientProfile;
  visit_id?: string;
  mode?: R8SubstitutionMode;
  target_nutrient_id?: string;
  tolerance_pct?: number;
  max_results?: number;
  current_meal_items?: Array<{ food_id: string; raw_weight_g: number }>;
  current_daily_items?: Array<{ food_id: string; raw_weight_g: number }>;
  traffic_light?: {
    green: Array<{ id: string }>;
    yellow: Array<{ id: string; reasons?: any[] }>;
    red: Array<{ id: string; reasons?: any[] }>;
  };
  r5_nutrition_contract?: any;
  r7_lab_summary?: any;
}

export interface R8NutrientDelta {
  nutrient_id: string;
  label_en: string;
  unit: string;
  original_amount: number | null;
  candidate_amount: number | null;
  absolute_diff: number | null;
  percent_diff: number | null;
  is_missing_data: boolean;
}

export interface R8MealAndDailyImpact {
  original_meal_totals: Record<string, R8ComputedNutrientSubtotal>;
  proposed_meal_totals: Record<string, R8ComputedNutrientSubtotal>;
  original_daily_totals: Record<string, R8ComputedNutrientSubtotal>;
  proposed_daily_totals: Record<string, R8ComputedNutrientSubtotal>;
  constraint_violations_en: string[];
  has_incomplete_data: boolean;
  requires_safety_review: boolean;
}

export interface R8SubstitutionCandidateResult {
  candidate_food: FoodItem;
  proposed_raw_grams: number;
  proposed_cooked_grams: number;
  household_portion_bn: string;
  household_portion_en: string;
  basis_note_en: string;
  matching_mode: R8SubstitutionMode;
  match_status: R8SubstitutionMatchStatus;
  nutritional_similarity_score: number;
  similarity_label_en: string;
  traffic_status: TrafficLightStatus | 'UNCLASSIFIED';
  nutrient_deltas: R8NutrientDelta[];
  missing_nutrient_ids: string[];
  conditional_instructions_en: string[];
  conditional_instructions_bn: string[];
  ranking_reasons_en: string[];
  requires_clinician_review: boolean;
  impact?: R8MealAndDailyImpact;
}

export interface R8SubstitutionResponse {
  original_food: FoodItem;
  original_raw_grams: number;
  mode: R8SubstitutionMode;
  tolerance_pct: number;
  has_equivalent_match: boolean;
  no_match_reason_en?: string;
  no_match_reason_bn?: string;
  ranked_candidates: R8SubstitutionCandidateResult[];
  excluded_candidates_summary: Array<{
    food_id: string;
    name_en: string;
    reason_en: string;
    is_contraindicated: boolean;
  }>;
}
