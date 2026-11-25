/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Phase R4: Protocol Studio Typed Contracts & Data Models
 * 
 * Clinical protocol entities covering:
 * - Lifestyle & Behavioral Guidance
 * - Exercise Prescription & Movement Safety
 * - Sleep & Circadian Chronobiology
 * - Personalized Hydration & Fluid Restrictions
 * - Targeted Supplement Protocols & Elemental Dosing
 * - Visual 24-Hour Chronotherapy Timeline
 * - Multi-Axis Clinical Safety & Hard-Stop Evaluation
 */

import { SupplementOverlapWarning } from './index';

// ── 1. Lifestyle Prescription ───────────────────────────────────────
export type LifestyleCategory =
  | 'daily_routine'
  | 'light_exposure'
  | 'sedentary_reduction'
  | 'stress_management'
  | 'work_rest'
  | 'shift_work'
  | 'sleep_hygiene'
  | 'behavioral_adherence';

export type EvidenceGrade =
  | 'evidence_based'
  | 'clinical_guideline'
  | 'expert_consensus'
  | 'review_required';

export type ProtocolSafetyClassification =
  | 'SAFE'
  | 'CAUTION'
  | 'REQUIRES_REVIEW'
  | 'CONTRAINDICATED';

export interface LifestyleRecommendation {
  id: string;
  category: LifestyleCategory;
  action_en: string;
  action_bn: string;
  suggested_frequency: string;
  suggested_time: string;
  expected_purpose_en: string;
  expected_purpose_bn: string;
  clinical_rationale_en: string;
  clinical_rationale_bn: string;
  safety_classification: ProtocolSafetyClassification;
  evidence_status: EvidenceGrade;
  is_active: boolean;
  is_custom?: boolean;
}

export interface LifestyleProtocol {
  recommendations: LifestyleRecommendation[];
  overall_focus_en: string;
  overall_focus_bn: string;
  adherence_support_notes?: string;
  shift_work_adaptation_notes?: string;
}

// ── 2. Exercise Prescription ────────────────────────────────────────
export type ExerciseCategory =
  | 'walking'
  | 'brisk_walking'
  | 'aerobic_conditioning'
  | 'resistance_training'
  | 'mobility'
  | 'flexibility'
  | 'balance_training'
  | 'post_meal_walking'
  | 'breathing_exercises'
  | 'low_impact'
  | 'rehabilitation';

export type ExerciseIntensity =
  | 'very_light'
  | 'light'
  | 'moderate'
  | 'vigorous'
  | 'high_intensity';

export interface ExerciseItem {
  id: string;
  category: ExerciseCategory;
  title_en: string;
  title_bn: string;
  frequency_per_week: number;
  duration_minutes: number;
  intensity: ExerciseIntensity;
  target_rpe?: number; // Borg CR-10 scale (1-10)
  sets?: number;
  reps?: number;
  rest_seconds?: number;
  weekly_progression_en: string;
  weekly_progression_bn: string;
  monitoring_instructions_en: string;
  monitoring_instructions_bn: string;
  stop_conditions_en: string[];
  stop_conditions_bn: string[];
  contraindications: string[];
  clinician_notes?: string;
  approval_status: 'draft' | 'approved' | 'review_required' | 'contraindicated';
}

export interface ExerciseProtocol {
  items: ExerciseItem[];
  overall_safety_status: 'SAFE' | 'CAUTION' | 'REQUIRES_CLINICAL_REVIEW' | 'HARD_STOP';
  clinical_contraindications: string[];
  risk_factors_evaluated: string[];
  cardiorespiratory_clearance_status: 'cleared_standard' | 'restricted_low_impact' | 'requires_medical_clearance' | 'strictly_contraindicated';
  weekly_aerobic_minutes_target: number;
  weekly_resistance_sessions_target: number;
}

// ── 3. Sleep & Circadian Chronotherapy ──────────────────────────────
export interface DaylightExposurePlan {
  scheduled_time: string;
  duration_minutes: number;
  instructions_en: string;
  instructions_bn: string;
}

export interface EveningLightManagement {
  cutoff_time: string;
  blue_blockers_recommended: boolean;
  screen_curfew_hours_before_bed: number;
  instructions_en: string;
  instructions_bn: string;
}

export interface SleepCircadianProtocol {
  wake_time: string; // HH:mm format (e.g. '06:30')
  bed_time: string;  // HH:mm format (e.g. '22:30')
  target_sleep_hours: number;
  sleep_regularity_goal_en: string;
  sleep_regularity_goal_bn: string;
  daylight_exposure: DaylightExposurePlan;
  evening_light: EveningLightManagement;
  caffeine_curfew_time: string;
  last_meal_curfew_time: string;
  exercise_curfew_time: string;
  is_shift_worker: boolean;
  shift_schedule_type: 'regular' | 'night_shift' | 'rotating_shift' | 'evening_shift';
  relaxation_routine_en: string;
  relaxation_routine_bn: string;
  suspected_sleep_disorder_alert?: string;
}

// ── 4. Hydration Protocol ───────────────────────────────────────────
export interface HydrationEvent {
  id: string;
  time: string; // HH:mm
  volume_ml: number;
  type: 'plain_water' | 'mineral_water' | 'herbal_infusion' | 'electrolyte_monitored' | 'with_medication';
  instructions_en: string;
  instructions_bn: string;
  meal_relation: 'waking' | 'pre_meal' | 'post_meal' | 'between_meals' | 'exercise_session' | 'bedtime';
}

export interface HydrationProtocol {
  baseline_fluid_target_ml: number;
  clinician_fluid_limit_ml?: number;
  is_restricted: boolean;
  restriction_reason_en?: string;
  restriction_reason_bn?: string;
  requires_individualized_fluid_review?: boolean;
  review_reason_en?: string;
  review_reason_bn?: string;
  hydration_events: HydrationEvent[];
  total_scheduled_ml: number;
  timing_guidance_en: string;
  timing_guidance_bn: string;
  conflict_warning?: string;
}

// ── 5. Supplement Protocol Builder ──────────────────────────────────
export type SupplementFrequency =
  | 'once_daily'
  | 'twice_daily'
  | 'thrice_daily'
  | 'weekly'
  | 'twice_weekly'
  | 'three_times_weekly'
  | 'alternate_days'
  | 'single_bolus'
  | 'as_needed'
  | 'unknown';

export type FoodRelationship =
  | 'empty_stomach_waking'
  | 'with_breakfast'
  | 'with_lunch'
  | 'with_dinner'
  | 'with_fatty_meal'
  | 'between_meals'
  | 'before_bed'
  | 'independent_of_meals'
  | 'unknown';

export interface SupplementIngredient {
  id?: string;
  nutrient_id: string; // canonical key: 'magnesium', 'vitamin_d3', 'vitamin_k2', 'iron', 'calcium', etc.
  nutrient_name: string;
  chemical_form?: string;
  elemental_amount_per_unit?: number;
  amount_unit?: 'mg' | 'mcg' | 'IU' | 'g' | 'mEq' | 'billion_cfu';
  prescribed_units_per_dose?: number;
  compound_amount_text?: string;
  is_standardized: boolean;
  is_elemental_known: boolean;
}

export interface SupplementBrandVerificationMetadata {
  product_identity_verified: boolean;
  formulation_verified: boolean;
  regulatory_status: 'registered_dgda' | 'otc_supplement' | 'imported_unregistered' | 'unverified';
  retail_availability_status: 'verified_available' | 'unverified_availability' | 'discontinued_or_scarce' | 'not_checked';
  verification_source?: string;
  verification_date?: string;
  manufacturer?: string;
}

export interface R7NutrientExposureBucket {
  nutrient_id: string;
  nutrient_name: string;
  unit: string;
  current_approved_daily: number;
  proposed_candidate_daily: number;
  fortified_diet_daily: number;
  combined_daily: number;
  max_single_admin_dose: number;
  tolerable_upper_limit?: number;
  ul_life_stage?: string;
  ul_reference_id?: string;
  exceeds_ul: boolean;
  exceeds_single_dose_threshold: boolean;
  is_incomplete_exposure: boolean;
  incomplete_reasons: string[];
  contributing_items: Array<{
    item_id: string;
    label: string;
    approval_status: string;
    daily_contribution: number;
    single_dose_contribution: number;
    is_incomplete: boolean;
  }>;
}

export interface R7SupplementExposureSummary {
  exposures_by_nutrient: Record<string, R7NutrientExposureBucket>;
  overlaps: SupplementOverlapWarning[];
  incomplete_items: string[];
  physical_duplicates: Array<{
    physical_key: string;
    item_ids: string[];
    label: string;
  }>;
  safety_blocks: string[];
  safety_reviews: string[];
}

export interface SupplementProtocolItem {
  id: string;
  catalog_id?: string;
  physical_product_key?: string;
  generic_nutrient: string;
  chemical_form: string;
  brand_name?: string;
  brand_verification_status:
    | 'verified_bd_market'
    | 'unverified_brand'
    | 'generic_prescription_only'
    | 'imported'
    | 'catalog_unverified';
  brand_verification_metadata?: SupplementBrandVerificationMetadata;
  ingredients?: SupplementIngredient[];
  indication_en: string;
  indication_bn: string;
  evidence_category: EvidenceGrade;
  product_strength_text?: string;
  prescribed_units_per_dose?: number;
  elemental_dose_numeric?: number;
  elemental_dose_unit?: string; // 'mg' | 'mcg' | 'IU'
  total_compound_dose: string;
  route?: 'oral' | 'sublingual' | 'intramuscular' | 'intravenous' | 'topical' | 'other';
  frequency: SupplementFrequency;
  administration_time: string; // HH:mm format or 'UNKNOWN'
  relationship_to_food: FoodRelationship;
  duration_weeks?: number;
  is_dose_unknown?: boolean;
  is_frequency_unknown?: boolean;
  is_timing_unknown?: boolean;
  is_current_baseline_intake?: boolean;
  monitoring_parameters: string[];
  monitoring_indication?: string;
  contraindications: string[];
  known_interactions: string[];
  linked_lab_marker_ids?: string[];
  linked_dni_rule_ids?: string[];
  clinician_rationale?: string;
  approval_status: 'draft_candidate' | 'clinician_approved' | 'rejected' | 'discontinued';
  source: 'dni_auto_candidate' | 'condition_targeted' | 'clinician_manual_entry' | 'patient_baseline_intake';
}

// ── 6. Visual 24-Hour Chronotherapy Timeline ────────────────────────
export type ChronoEventCategory =
  | 'wake'
  | 'light_exposure'
  | 'meal'
  | 'snack'
  | 'medication'
  | 'supplement'
  | 'hydration'
  | 'exercise'
  | 'relaxation'
  | 'sleep';

export interface ChronoSpacingWarning {
  rule_id: string;
  severity: 'critical' | 'high' | 'medium';
  message_en: string;
  message_bn: string;
  required_gap_hours: number;
  actual_gap_hours: number;
}

export interface ChronotherapyTimelineItem {
  id: string;
  time: string; // HH:mm or "UNKNOWN"
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  category: ChronoEventCategory;
  title_en: string;
  title_bn: string;
  instructions_en: string;
  instructions_bn: string;
  entity_id?: string;
  is_prescription_medication?: boolean;
  is_timing_unknown?: boolean;
  is_editable: boolean;
  collision_detected?: boolean;
  spacing_warnings?: ChronoSpacingWarning[];
}

// ── 7. Clinical Safety Evaluation ───────────────────────────────────
export interface SafetyFinding {
  code: string;
  severity: 'critical' | 'high' | 'medium' | 'advisory';
  title_en: string;
  title_bn: string;
  rationale_en: string;
  rationale_bn: string;
  recommended_action_en: string;
  recommended_action_bn: string;
}

export interface TimingConflictFinding {
  item1_title: string;
  item2_title: string;
  time1: string;
  time2: string;
  min_interval_hours: number;
  actual_interval_hours: number;
  severity: 'critical' | 'high' | 'medium';
  warning_en: string;
  warning_bn: string;
  recommendation_en: string;
  recommendation_bn: string;
}

export interface R4SafetyEvaluation {
  overall_status: 'SAFE' | 'CAUTION' | 'REQUIRES_REVIEW' | 'HARD_STOP';
  can_approve: boolean;
  hard_stops: SafetyFinding[];
  reviews_required: SafetyFinding[];
  cautions: SafetyFinding[];
  nutrient_overlaps: SupplementOverlapWarning[];
  timing_conflicts: TimingConflictFinding[];
  evaluated_at: string;
}

// ── 8. Master R4 Protocol Studio Data Model ─────────────────────────
export interface R4ProtocolStudioData {
  id: string;
  patient_id: string;
  visit_id?: string;
  organization_id: string;
  version: number;
  status: 'draft' | 'active' | 'superseded' | 'archived';
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  approval_notes?: string;
  previous_approved_version?: number;
  is_demo_unverified?: boolean;
  approval_authority?: 'AUTHORITATIVE_CLOUD' | 'LOCAL_SIMULATION_NON_AUTHORITATIVE';
  mode: 'automatic_generated' | 'manual_created' | 'hybrid_edited';
  lifestyle: LifestyleProtocol;
  exercise: ExerciseProtocol;
  sleep: SleepCircadianProtocol;
  hydration: HydrationProtocol;
  supplements: SupplementProtocolItem[];
  chronotherapy_timeline: ChronotherapyTimelineItem[];
  safety_evaluation: R4SafetyEvaluation;
  created_at: string;
  updated_at: string;
}
