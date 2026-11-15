/**
 * SHUDDHO FUNCTIONAL NUTRITION SOFTWARE
 * Core Clinical Data Architecture (Phase P0 Foundation)
 * 
 * Foundational clinical entities, multiple population/pathway models,
 * feeding routes, safety results, intervention versioning, and Ayurvedic contracts.
 */

import { PopulationGroup } from './index';

// ── 1. Population & Clinical Pathways ──────────────────────────────
export type ClinicalPathway =
  | 'metabolic'
  | 'underweight_restoration'
  | 'oncology'
  | 'renal'
  | 'cardiovascular'
  | 'gastrointestinal_hepatic'
  | 'surgical_postoperative'
  | 'critical_care_specialized_support'
  | 'other_multimorbidity';

export interface PatientPopulationProfile {
  primary_group: PopulationGroup;
  secondary_groups?: PopulationGroup[];
  clinical_pathways: ClinicalPathway[];
  trimester?: 1 | 2 | 3; // for pregnancy
  lactation_stage_months?: number; // for lactation
  gestational_age_weeks?: number; // for pediatric / neonatal
  corrected_age_months?: number;
}

// ── 2. Feeding Route & Hospital Safety ─────────────────────────────
export type FeedingRouteType =
  | 'oral_standard'
  | 'oral_nutritional_supplements'
  | 'modified_texture_pureed'
  | 'modified_texture_soft'
  | 'modified_texture_thickened_liquid'
  | 'enteral_tube_nasogastric'
  | 'enteral_tube_peg_pej'
  | 'parenteral_total_tpn'
  | 'parenteral_peripheral_ppn'
  | 'npo_nil_per_os'
  | 'temporarily_restricted_oral';

export interface FeedingStatus {
  route: FeedingRouteType;
  oral_intake_permitted: boolean;
  requires_specialist_support: boolean;
  swallowing_difficulty_dysphagia?: boolean;
  aspiration_risk?: boolean;
  fluid_restriction_active?: boolean;
  clinical_notes?: string;
  prescribed_by?: string;
  effective_date?: string;
}

// ── 3. Allergies & Medical Contraindications ───────────────────────
export type AllergySeverity = 'mild' | 'moderate' | 'severe_anaphylactic';
export type AllergyVerificationStatus = 'patient_reported' | 'clinician_verified' | 'laboratory_confirmed';

export interface AllergyRecord {
  id: string;
  allergen: string; // e.g. 'peanut', 'egg', 'shrimp', 'cow_milk', 'wheat_gluten', 'soy', 'tree_nuts'
  allergen_bn: string;
  severity: AllergySeverity;
  verification_status: AllergyVerificationStatus;
  reaction_description?: string;
  is_hard_contraindication: true; // Allergies are ALWAYS non-overrideable hard stops
  date_documented: string;
}

// ── 4. Medication Reconciliation Model ────────────────────────────
export type MedicationVerificationStatus = 'unverified' | 'patient_reported' | 'prescription_verified' | 'pharmacist_reviewed';

export interface MedicationRecord {
  id: string;
  medicine_identity_id?: string;
  generic_name: string;
  brand_name?: string;
  dose: string;
  unit: string;
  route: 'oral' | 'subcutaneous' | 'intravenous' | 'topical' | 'inhalation' | 'other';
  frequency: string;
  administration_time?: string;
  relationship_to_meals: 'with_meal' | 'before_meal_empty_stomach' | 'after_meal' | 'independent_of_meals' | 'bedtime';
  start_date?: string;
  expected_duration?: string;
  indication?: string;
  prescriber_instructions?: string;
  last_verified_date: string;
  verification_status: MedicationVerificationStatus;
  is_active: boolean;
  rule_coverage_status: 'fully_covered' | 'partially_covered' | 'no_rules_available';
}

// ── 5. Supplement Protocol Model ──────────────────────────────────
export interface SupplementRecord {
  id: string;
  generic_nutrient: string;
  chemical_form?: string; // e.g. 'methylcobalamin', 'magnesium_glycinate', 'cholecalciferol'
  dose: string;
  unit: string;
  frequency: string;
  administration_time: string;
  relationship_to_meals: 'with_meal' | 'empty_stomach' | 'with_fatty_meal' | 'bedtime';
  duration_weeks?: number;
  clinical_purpose_en: string;
  clinical_purpose_bn: string;
  triggering_finding?: string;
  triggering_lab?: string;
  known_drug_interactions: string[];
  contraindications: string[];
  monitoring_parameters: string[];
  approval_status: 'draft_candidate' | 'clinician_approved' | 'rejected' | 'discontinued';
  verified_bd_brands?: string[];
}

// ── 6. Laboratory Observation Model ────────────────────────────────
export type LabTestStatus = 'previously_tested' | 'recommended' | 'pending_result' | 'not_tested' | 'declined_unavailable';

export interface LaboratoryObservation {
  id: string;
  marker_id: string; // e.g. 'hba1c', 'fasting_glucose', 'serum_potassium', 'serum_phosphorus'
  marker_name_en: string;
  marker_name_bn: string;
  numeric_value?: number;
  text_value?: string;
  unit: string;
  conventional_ref_range: { low: number; high: number };
  functional_optimal_range?: { low: number; high: number };
  test_date?: string;
  status: LabTestStatus;
  interpretation?: 'optimal' | 'borderline_low' | 'borderline_high' | 'abnormal_low' | 'abnormal_high' | 'critical';
  is_missing_or_unknown: boolean; // Never assume missing is zero or normal!
}

// ── 7. Patient-Specific Nutrient & Fluid Constraints ──────────────
export interface NutritionRequirement {
  id: string;
  patient_id: string;
  nutrient: 'energy_kcal' | 'protein_g' | 'carbs_g' | 'fat_g' | 'fiber_g' | 'sodium_mg' | 'potassium_mg' | 'phosphorus_mg' | 'calcium_mg' | 'water_ml';
  min_target?: number;
  max_target?: number;
  strict_ceiling?: number; // Hard upper limit (e.g. renal potassium ceiling)
  strict_floor?: number;   // Hard lower limit (e.g. BMR energy floor)
  unit: string;
  clinical_reason_en: string;
  clinical_reason_bn: string;
  setting_clinician?: string;
  effective_date: string;
  severity: 'hard_stop' | 'clinical_review' | 'advisory';
}

export interface FluidPrescription {
  patient_id: string;
  total_fluid_limit_ml?: number; // e.g. 1500 mL in dialysis or CHF
  is_restricted: boolean;
  accounting: {
    plain_water_ml: number;
    functional_drinks_ml: number;
    beverages_tea_coffee_ml: number;
    milk_dairy_liquids_ml: number;
    soups_liquid_foods_ml: number;
    oral_nutrition_supplements_ml: number;
  };
  total_prescribed_ml: number;
  clinical_rationale: string;
}

// ── 8. Standardized Clinical Safety Engine Models ──────────────────
export type ClinicalSafetyDecision =
  | 'HARD_STOP'
  | 'CLINICAL_REVIEW_REQUIRED'
  | 'ADVISORY'
  | 'ELIGIBLE_FOR_APPROVAL';

export interface ClinicalSafetyResult {
  rule_id: string;
  rule_version: string;
  patient_id: string;
  decision: ClinicalSafetyDecision;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title_en: string;
  title_bn: string;
  clinical_explanation_en: string;
  clinical_explanation_bn: string;
  required_action_en: string;
  required_action_bn: string;
  affected_entity?: {
    type: 'food' | 'nutrient' | 'medicine' | 'meal' | 'intervention' | 'fasting';
    id: string;
    name_en: string;
    name_bn: string;
  };
  triggering_observations: string[];
  missing_information?: string[];
  clinician_review_required: boolean;
  applicable_population?: PopulationGroup[];
  provenance_reference: string;
  timestamp: string;
}

// ── 9. Intervention Versioning & Locking Models ────────────────────
export type InterventionApprovalStatus =
  | 'draft'
  | 'review_required'
  | 'clinician_approved'
  | 'rejected'
  | 'superseded';

export interface InterventionLockState {
  locked_food_ids: string[];
  locked_meal_ids: string[];
  locked_days: number[]; // 1-7 for P3
  locked_supplement_ids: string[];
  locked_sections: ('diet' | 'supplements' | 'hydration' | 'fasting' | 'functional_drinks')[];
}

export interface InterventionRevision {
  intervention_id: string;
  revision_number: number;
  timestamp: string;
  clinician_id: string;
  modification_type: 'initial_generation' | 'manual_food_edit' | 'portion_change' | 'exchange_applied' | 'safety_override' | 'clinician_approval';
  changed_fields: string[];
  previous_snapshot_summary?: string;
  safety_check_summary: {
    hard_stops: number;
    reviews_required: number;
    advisories: number;
    status: InterventionApprovalStatus;
  };
}

export interface InterventionApproval {
  intervention_id: string;
  revision_number: number;
  approved_by: string;
  approval_timestamp: string;
  status: InterventionApprovalStatus;
  clinical_rationale?: string;
  is_valid: boolean; // Invalidated automatically upon any material modification!
}

// ── 10. Ayurvedic Prakriti–Vikriti Personalized Layer ──────────────
export type DoshaLevel = 'low' | 'balanced' | 'aggravated_high';

export interface DoshaProfile {
  vata: DoshaLevel;
  pitta: DoshaLevel;
  kapha: DoshaLevel;
  primary_dosha: 'vata' | 'pitta' | 'kapha' | 'dual_vata_pitta' | 'dual_pitta_kapha' | 'dual_vata_kapha' | 'tridoshic';
}

export interface AyurvedicAssessmentContext {
  // Prakriti (innate constitution - permanent baseline)
  prakriti: DoshaProfile;
  // Vikriti (current doshic imbalance - dynamic clinical state)
  vikriti: DoshaProfile;
  agni_type: 'mandagni' | 'tikshnagni' | 'vishamagni' | 'samagni';
  ama_accumulation: 'none' | 'mild' | 'moderate' | 'severe';
  digestive_symptoms: string[];
  seasonal_context?: 'grishma' | 'varsha' | 'sharat' | 'hemanta' | 'shishira' | 'vasanta';
}

export interface AyurvedicFoodAttributes {
  rasa: ('sweet' | 'sour' | 'salty' | 'pungent' | 'bitter' | 'astringent')[];
  guna: ('heavy' | 'light' | 'oily' | 'dry' | 'hot' | 'cold')[];
  virya: 'ushna_hot' | 'sheeta_cold';
  vipaka: 'madhura_sweet' | 'amla_sour' | 'katu_pungent';
  dosha_effects: {
    vata: 'pacifies' | 'aggravates' | 'neutral';
    pitta: 'pacifies' | 'aggravates' | 'neutral';
    kapha: 'pacifies' | 'aggravates' | 'neutral';
  };
  pathya_indications: string[]; // Suitable conditions
  apathya_contraindications: string[]; // Unsuitable conditions
}

// ── 11. Functional Drinks & Added Oils/Salt Models ─────────────────
export interface FunctionalDrinkItem {
  id: string;
  time_slot: 'morning_empty_stomach' | 'pre_meal_digestive' | 'post_meal_digestive' | 'bedtime_calming' | 'other';
  title_bn: string;
  title_en: string;
  ingredients: { name_en: string; name_bn: string; quantity: string }[];
  liquid_volume_ml: number;
  preparation_instructions_bn: string;
  preparation_instructions_en: string;
  intended_clinical_purpose: string;
  contraindicated_conditions: string[];
  contraindicated_medications: string[];
  clinician_approved: boolean;
}

export interface DiscretionaryFatAndSaltSchedule {
  mustard_oil_g: number;
  desi_ghee_g: number;
  other_cooking_oil_g: number;
  total_added_fat_g: number;
  total_fat_calories: number; // Discretionary fat MUST contribute to total calories!
  discretionary_added_salt_g: number;
  added_sodium_mg: number; // 1g salt ~ 393 mg sodium
}

// ── 12. Fasting Safety Eligibility Model ───────────────────────────
export interface FastingSafetyEligibility {
  is_eligible_for_fasting: boolean;
  max_allowable_fasting_hours: 0 | 12 | 14 | 16 | 18;
  contraindication_reasons_en: string[];
  contraindication_reasons_bn: string[];
  requires_medication_rescheduling: boolean;
  glucose_monitoring_mandated: boolean;
  risk_level: 'contraindicated' | 'high_risk_supervised' | 'moderate_risk' | 'low_risk_eligible';
}
