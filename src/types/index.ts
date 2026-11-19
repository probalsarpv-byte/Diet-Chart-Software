import type {
  ClinicalPathway,
  FeedingStatus,
  AyurvedicAssessmentContext,
  InterventionApprovalStatus,
  InterventionLockState,
  FastingSafetyEligibility,
  FluidPrescription
} from './clinical';
export * from './clinical';
export * from './assessment';

export const CURRENT_SCHEMA_VERSION = 2;

export type FoodCategory = 
  | 'grain'
  | 'protein'
  | 'vegetable'
  | 'fruit'
  | 'fat_oil'
  | 'seed_nut'
  | 'spice_herb'
  | 'beverage'
  | 'dairy';

export type GlycemicLoad = 'low' | 'medium' | 'high';

export interface FoodItem {
  id: string;
  code?: string;
  name_bn: string;
  name_en: string;
  category: FoodCategory;
  exchange_group: 'grain' | 'lean_protein' | 'fatty_protein' | 'vegetable' | 'fruit' | 'fat' | 'dairy' | 'seed_nut';
  per_100g: {
    kcal: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    fiber_g: number | null;
    water_g?: number | null;
    ash_g?: number | null;
  };
  micronutrients?: {
    calcium_mg?: number | null;
    iron_mg?: number | null;
    magnesium_mg?: number | null;
    phosphorus_mg?: number | null; // Core P0 integration
    potassium_mg?: number | null;
    sodium_mg?: number | null;
    zinc_mg?: number | null;
    copper_mg?: number | null;
    vitamin_a_mcg?: number | null;
    vitamin_d_mcg?: number | null;
    vitamin_e_mg?: number | null;
    thiamin_mg?: number | null;
    riboflavin_mg?: number | null;
    niacin_mg?: number | null;
    vitamin_b6_mg?: number | null;
    folate_mcg?: number | null;
    vitamin_c_mg?: number | null;
  };
  raw_to_cooked_ratio: number;
  glycemic_load: GlycemicLoad;
  pral_score: number;
  tags: string[];
  prep_note_bn: string;
  prep_note_en: string;
  edible_portion_factor?: number;
  scientific_name?: string;
  source_reference?: string;
  fodmap_level?: 'low' | 'moderate' | 'high';
  purine_level?: 'low' | 'moderate' | 'high';
  oxalate_level?: 'low' | 'moderate' | 'high';
  histamine_level?: 'low' | 'moderate' | 'high';
}

export type RestrictionCategory = 
  | 'confirmed_allergy'
  | 'clinician_restriction'
  | 'hard_contraindication'
  | 'evidence_conditional'
  | 'suspected_intolerance'
  | 'phase_specific'
  | 'preference';

export interface NutrientDepletion {
  nutrient: string;
  severity: 'high' | 'medium' | 'low';
  reason_bn: string;
  reason_en: string;
  supplement_recommendation?: {
    name_en: string;
    name_bn: string;
    dose: string;
    timing: string;
    verified_bd_brands: string[];
  };
}

export interface TimingRule {
  rule_bn: string;
  rule_en: string;
  time_slot: string;
}

export interface FoodInteraction {
  food_or_group: string;
  effect_bn: string;
  effect_en: string;
  action: 'strictly_avoid' | 'strictly_avoid_raw' | 'strictly_avoid_timing' | 'caution_hyperkalemia' | 'monitor';
}

export interface MedicineItem {
  id: string;
  generic_name: string;
  brand_names_bd: string[];
  drug_class: string;
  mechanism_bn: string;
  mechanism_en: string;
  depletions: NutrientDepletion[];
  timing_rules: TimingRule[];
  food_interactions: FoodInteraction[];
}

export interface SupplementItem {
  id: string;
  name_en: string;
  name_bn: string;
  category: string;
  clinical_indications: string[];
  recommended_dose: string;
  timing_schedule: string;
  timing_note_bn: string;
  timing_note_en: string;
  verified_bd_brands: string[];
  contraindications: string[];
}

export interface CandidateSupplement extends SupplementItem {
  approval_status: 'candidate_review' | 'clinician_approved' | 'rejected';
  prescribed_dose?: string;
  clinician_notes?: string;
  indication_trigger?: string;
}

export interface SupplementOverlapWarning {
  nutrient: string;
  total_amount_estimated: string;
  tolerable_upper_limit: string;
  sources: string[];
  warning_bn: string;
  warning_en: string;
  severity: 'high' | 'medium';
}

export interface ActivityLevelConfig {
  factor: number;
  label_en: string;
  label_bn: string;
}

export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
export type AgniType = 'mandagni' | 'tikshnagni' | 'vishamagni' | 'samagni' | 'unassessed';
export type PopulationGroup =
  | 'adult_standard'
  | 'pediatric'
  | 'adolescent'
  | 'pregnancy'
  | 'lactation'
  | 'geriatric'
  | 'oncology'
  | 'renal'
  | 'malnutrition_risk'
  | 'all';
export type BmrFloorStrategy = 'clamped_to_bmr' | 'clinician_custom' | 'unrestricted_clinical_guidance';

export interface AssessmentAnswerMap {
  [questionId: string]: any;
}

export interface AssessmentData {
  version: string; // matches questionnaireRegistry.version
  answers: AssessmentAnswerMap;
  completed: boolean;
  completedAt?: string; // ISO timestamp
}

export type ClinicalConditionId = 
  | 't2d_ir'
  | 'hypothyroid'
  | 'fatty_liver'
  | 'pcos'
  | 'gut_dysbiosis'
  | 'uric_acid_gout'
  | 'hypertension_ckd';

export interface CalculatedAnthropometrics {
  bmi: number;
  bmi_category_en: string;
  bmi_category_bn: string;
  ibw_kg: number;
  adjusted_bw_kg: number;
  whtr: number;
  whtr_risk_en: string;
  whtr_risk_bn: string;
  bmr: number;
  tdee: number;
  bmr_safe_calorie_floor: number;
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  protein_ratio_used: string;
  population_group: PopulationGroup;
  population_warning?: string;
  bmr_floor_strategy: BmrFloorStrategy;
  is_estimated: boolean;
  energy_calculation_method: string;
  is_unmeasured?: boolean;
}

export interface LabFlag {
  marker: string;
  value: number;
  unit: string;
  conventional_range: string;
  optimal_range: string;
  status: 'optimal' | 'borderline' | 'abnormal' | 'critical';
  insight_en: string;
  insight_bn: string;
  is_diagnostic_threshold?: boolean;
}

export interface FunctionalLabs {
  hba1c?: number;
  fasting_glucose?: number;
  fasting_insulin?: number;
  two_hour_post_prandial?: number;
  total_cholesterol?: number;
  ldl?: number;
  serum_creatinine?: number;
  egfr?: number;
  potassium?: number;
  sodium?: number;
  hemoglobin?: number;
  hs_crp?: number;
  homa_ir?: number;
  homa_ir_status_en?: string;
  homa_ir_status_bn?: string;
  tsh?: number;
  ft3?: number;
  ft4?: number;
  vitamin_d3?: number;
  vitamin_b12?: number;
  ferritin?: number;
  uric_acid?: number;
  alt?: number;
  ast?: number;
  triglycerides?: number;
  hdl?: number;
  tg_hdl_ratio?: number;
  tg_hdl_status_en?: string;
  tg_hdl_status_bn?: string;
  lab_flags: LabFlag[];
}

export type BloatingSeverity = 'none' | 'mild' | 'moderate' | 'severe';

export interface GutAndAyurvedicProfile {
  bloating: BloatingSeverity;
  acid_reflux_hypoacidity: boolean;
  bristol_stool_score: number; // 1-7
  energy_score: number; // 1-10
  sleep_quality_score: number; // 1-10
  digestive_fire_agni: AgniType;
}

// ─── Allergy Reconciliation Types ────────────────────────────────
export type AllergyReconciliationStatus =
  | 'allergies_confirmed'      // Specific allergies identified and confirmed
  | 'none_confirmed'           // Explicitly verified zero known allergies
  | 'unknown'                  // Patient / family uncertain
  | 'not_assessed';            // Allergy history not yet evaluated

export interface AllergyReconciliationRecord {
  status: AllergyReconciliationStatus;
  reconciled: boolean;
  reconciled_by?: string;
  reconciled_at?: string;
  confirmed_allergies: string[];
  clinical_notes?: string;
}

// ─── Complete Medication Reconciliation Types ────────────────────
export type MedicationVerificationStatus =
  | 'verified_active'
  | 'discontinued'
  | 'unverified'
  | 'patient_reported';

export interface ReconciledMedicationRecord {
  id: string;
  medication_name: string;
  generic_name?: string;
  dose: string;
  frequency: string;
  timing: string;
  route?: string;
  indication?: string;
  verification_status: MedicationVerificationStatus;
  verified_by?: string;
  verified_at?: string;
  relevant_safety_notes?: string[];
  depletions?: string[];
  food_interactions?: string[];
}

export type MedicationReconciliationOverallStatus =
  | 'fully_reconciled'
  | 'partially_reconciled'
  | 'unreconciled'
  | 'no_medications'
  | 'not_assessed';

export interface MedicationReconciliationSummary {
  status: MedicationReconciliationOverallStatus;
  reconciled_records: ReconciledMedicationRecord[];
  verified_no_medications: boolean;
  reconciled_by?: string;
  reconciled_at?: string;
  missing_elements: string[];
}

export interface PatientProfile {
  schema_version: number;
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  phone: string;
  email?: string;
  visit_date: string;
  current_visit_id?: string;
  current_phase: 1 | 2 | 3 | 4;
  height_cm: number;
  weight_kg: number;
  waist_cm: number;
  activity_level: ActivityLevel;
  sleep_hours: number;
  shift_worker: boolean;
  population_group: PopulationGroup;
  clinical_pathways?: ClinicalPathway[];
  feeding_status?: FeedingStatus;
  fluid_prescription?: FluidPrescription;
  clinical_safety?: {
    insulin_treatment?: boolean;
    sulfonylurea_treatment?: boolean;
    dysphagia?: boolean;
    fluid_restriction?: {
      is_restricted: boolean;
      limit_ml?: number;
      prescribing_physician?: string;
      condition?: string;
    };
    feeding_route?: string;
  };
  ayurvedic_context?: AyurvedicAssessmentContext;
  intervention_version?: number;
  approval_status?: InterventionApprovalStatus;
  lock_state?: InterventionLockState;
  fasting_eligibility?: FastingSafetyEligibility;
  trimester?: 1 | 2 | 3;
  bmr_floor_strategy: BmrFloorStrategy;
  custom_calorie_floor?: number;
  confirmed_allergies: string[]; // e.g. ['peanut', 'egg', 'shrimp', 'gluten', 'dairy']
  allergy_reconciliation?: AllergyReconciliationRecord;
  allergy_reconciliation_status?: AllergyReconciliationStatus;
  clinician_disallowed_foods: string[]; // food IDs or keywords explicitly forbidden by clinician
  clinician_disallowed_tags: string[]; // tags explicitly blocked by clinician
  selected_conditions: ClinicalConditionId[];
  confirmed_conditions?: string[]; // verified clinical diagnoses from licensed provider
  active_medications: string[]; // medicine IDs or generic names
  medication_reconciliation?: MedicationReconciliationSummary;
  medication_reconciliation_status?: MedicationReconciliationOverallStatus;
  medication_records?: ReconciledMedicationRecord[];
  vitals?: {
    systolic_bp?: number;
    diastolic_bp?: number;
    resting_hr_bpm?: number;
    temperature_c?: number;
  };
  gut_profile: GutAndAyurvedicProfile;
  labs: FunctionalLabs;
  calculated: CalculatedAnthropometrics;
  dietary_preferences?: {
    is_vegetarian?: boolean;
    avoid_beef?: boolean;
    avoid_mutton?: boolean;
    preferred_oil?: 'mustard_oil' | 'desi_ghee' | 'coconut_oil';
    meal_structure?: '3_meals' | '3_meals_1_snack' | 'intermittent_fasting_16_8';
    include_morning_protocol?: boolean;
  };
  custom_clinical_notes?: string;
  is_diet_plan_dirty?: boolean;
  assessment_last_updated_at?: string;
  diet_plan_generated_at?: string;
  manual_edits_preserved?: boolean;
}

export interface DiseaseRule {
  id: ClinicalConditionId;
  name_en: string;
  name_bn: string;
  clinical_summary_en: string;
  clinical_summary_bn: string;
  redTags: string[];
  yellowTags: string[];
  greenTags: string[];
  redFoods?: string[];
  yellowFoods?: string[];
  greenFoods?: string[];
  macroAdjustment: {
    carb_pct_range: [number, number];
    protein_g_per_kg: [number, number];
    fat_pct_range: [number, number];
  };
  mealTimingRules: {
    rule_bn: string;
    rule_en: string;
  }[];
  clinicalRationaleBn: string;
  clinicalRationaleEn: string;
}

export interface EvaluatedReason {
  conditionId: ClinicalConditionId | 'DNI_INTERACTION' | 'ALLERGY' | 'CLINICIAN_RULE' | 'PHASE_RULE';
  conditionNameBn: string;
  conditionNameEn: string;
  status: 'GREEN' | 'YELLOW' | 'RED';
  category: RestrictionCategory;
  provenance: string;
  isOverridable: boolean;
  note_bn: string;
  note_en: string;
}

export interface EvaluatedFoodItem extends FoodItem {
  traffic_status: 'GREEN' | 'YELLOW' | 'RED';
  reasons: EvaluatedReason[];
  hard_blocked?: boolean;
}

export interface TrafficLightResult {
  green: EvaluatedFoodItem[];
  yellow: EvaluatedFoodItem[];
  red: EvaluatedFoodItem[];
}

export interface FoodExchangeItem {
  food_id: string;
  name_bn: string;
  name_en: string;
  raw_weight_g: number;
  cooked_display_bn: string;
  cooked_display_en: string;
  kcal: number;
  protein_g: number;
  traffic_status: 'GREEN' | 'YELLOW';
}

export interface DietChartMealItem {
  id: string;
  food_id: string;
  food_name_bn: string;
  food_name_en: string;
  category: FoodCategory;
  raw_weight_g: number;
  cooked_weight_g: number;
  cooked_display_bn: string;
  cooked_display_en: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  prep_note_bn: string;
  prep_note_en: string;
  alternatives: FoodExchangeItem[];
  traffic_status?: 'GREEN' | 'YELLOW' | 'RED';
  contraindicated_reasons?: string[];
  contraindicated_reasons_bn?: string[];
  is_locked?: boolean;
}

export interface IncompatiblePairWarning {
  warning_bn: string;
  warning_en: string;
  severity: 'high' | 'medium';
}

export interface MealSlotConstraintError {
  slot_name: string;
  category: FoodCategory;
  reason_bn: string;
  reason_en: string;
  violated_constraints: string[];
}

export interface DietChartMeal {
  id: string;
  meal_type: 'morning_protocol' | 'breakfast' | 'mid_morning' | 'lunch' | 'evening_snack' | 'dinner' | 'night_protocol';
  title_bn: string;
  title_en: string;
  target_time: string;
  scheduled_time?: string;
  items: DietChartMealItem[];
  meal_calories: number;
  meal_protein_g: number;
  meal_carbs_g: number;
  meal_fat_g: number;
  meal_gl: number;
  meal_gl_is_estimated: boolean;
  meal_pral: number;
  incompatible_warnings: IncompatiblePairWarning[];
  slot_errors?: MealSlotConstraintError[];
  is_locked?: boolean;
}

// ─── 7-Day Personalized Weekly Nutrition Planning System ───────────
export interface DayPlanSummary {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  gl: number;
  gl_is_estimated: boolean;
  pral: number;
  calorie_variance: number;
  protein_variance: number;
  carbs_variance: number;
  fat_variance: number;
}

export interface DayPlan {
  day_number: number; // 1 to 7
  day_name_bn: string;
  day_name_en: string;
  meals: DietChartMeal[];
  is_locked?: boolean;
  locked_items?: Record<string, boolean>;
  locked_meals?: Record<string, boolean>;
  summary: DayPlanSummary;
  slot_errors?: MealSlotConstraintError[];
  safety_decision: 'SAFE' | 'CLINICAL_REVIEW_REQUIRED' | 'HARD_STOP';
  safety_notes?: string[];
  safety_notes_bn?: string[];
  meal_structure?: '3_meals' | '3_meals_1_snack' | '5_meals_traditional' | 'intermittent_fasting_16_8';
  fasting_schedule?: FastingScheduleInfo;
  nutritional_adequacy?: NutritionalAdequacyEvaluation;
}

export interface FastingScheduleInfo {
  is_fasting: boolean;
  is_fasting_active?: boolean;
  fasting_type?: 'intermittent_fasting_16_8' | 'circadian_12_12' | 'none';
  proposed_fasting_hours: number;
  actual_fasting_hours: number;
  planned_fasting_hours?: number;
  eating_window_start?: string; // e.g. "12:00 PM"
  eating_window_end?: string;   // e.g. "08:00 PM"
  eating_window_hours?: number; // e.g. 8
  eligibility_status: 'eligible' | 'contraindicated' | 'high_risk_supervised' | 'not_indicated';
  decision_status: 'no_fasting_prescribed' | 'fasting_contraindicated' | 'fasting_requires_review' | 'fasting_approved';
  rationale_en: string;
  rationale_bn: string;
  reasons_en?: string[];
  reasons_bn?: string[];
  safety_warnings?: string[];
}

export interface NutritionalAdequacyEvaluation {
  is_adequate: boolean;
  calorie_achievement_pct: number;
  protein_achievement_pct: number;
  deficits: string[];
  deficits_bn: string[];
  status_label_en: 'Nutritional Adequacy Achieved' | 'Nutritional Targets Not Achieved' | 'Clinical Review Recommended';
  status_label_bn: string;
}

export interface WeeklyDietPlanApprovalRecord {
  approved_by: string;
  approval_date: string;
  version: number;
  approval_metadata?: {
    clinician_id: string;
    clinician_name: string;
    approval_timestamp: string;
    license_number?: string;
    notes?: string;
  };
  invalidated_at?: string;
  invalidation_reason?: string;
}

export interface WeeklyDietPlan {
  plan_id: string;
  patient_id: string;
  visit_id: string;
  version: number;
  schema_version: number;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'approved' | 'requires_review';
  approved_by?: string;
  approval_date?: string;
  approval_notes?: string;
  is_approved?: boolean;
  approved_at?: string;
  clinician_notes?: string;
  approval_metadata?: {
    clinician_id: string;
    clinician_name: string;
    approval_timestamp: string;
    license_number?: string;
    notes?: string;
  };
  previous_approval?: WeeklyDietPlanApprovalRecord;
  historical_approvals?: WeeklyDietPlanApprovalRecord[];
  target_macros: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  days: DayPlan[];
  overall_safety_status: 'SAFE' | 'CLINICAL_REVIEW_REQUIRED' | 'HARD_STOP';
  unresolved_hard_stops?: string[];
  meal_structure?: '3_meals' | '3_meals_1_snack' | '5_meals_traditional' | 'intermittent_fasting_16_8';
  fasting_schedule?: FastingScheduleInfo;
  nutritional_adequacy?: NutritionalAdequacyEvaluation;
  p2_handoff_summary?: {
    clinicalAssessmentApproved: boolean;
    confirmedAllergies: string[];
    feedingRoute: string;
    prescriptions: Record<string, any>;
    targetsDerivedFrom: string;
  };
  invalidation_reason?: string;
  invalidated_at?: string;
}

export interface DailyTimelineItem {
  time: string;
  category: 'protocol' | 'medication' | 'supplement' | 'meal' | 'lifestyle';
  title_bn: string;
  title_en: string;
  instructions_bn: string;
  instructions_en: string;
  warning_bn?: string;
  warning_en?: string;
  verified_products?: string[];
  is_prescription_medication?: boolean;
}

export interface LongitudinalVisit {
  visit_id: string;
  visit_date: string;
  phase: 1 | 2 | 3 | 4;
  weight_kg: number;
  waist_cm: number;
  whtr: number;
  bristol_stool: number;
  energy_score: number;
  symptom_relief_pct?: number;
  homa_ir?: number;
  tg_hdl_ratio?: number;
  hba1c?: number;
  tsh?: number;
  uric_acid?: number;
  notes_bn?: string;
  notes_en?: string;
  clinical_observations?: string;
  phase_transition_rationale?: string;
  is_phase_transition?: boolean;
  diet_plan_snapshot_summary?: string;
}

export interface PatientRecord {
  schema_version: number;
  patient: PatientProfile;
  visits: LongitudinalVisit[];
  current_diet_chart: DietChartMeal[];
  current_supplements: CandidateSupplement[];
  timeline: DailyTimelineItem[];
  updated_at: string;
  created_at?: string;
  is_demo_patient?: boolean;
  clinical_visits?: ClinicalVisit[];
  follow_up_appointments?: FollowUpAppointment[];
  visit_snapshots?: ClinicalVisitSnapshot[];
  progress_reports?: ComparativeProgressReport[];
  weekly_diet_plan?: WeeklyDietPlan;
}

// ─── Unified Clinical Visit & Scheduling Management ──────────────
export type ClinicalVisitType =
  | 'baseline_consultation'
  | 'routine_followup'
  | 'comprehensive_reassessment'
  | 'urgent_clinical_review'
  | 'initial_consultation'
  | 'follow_up_consultation'
  | 'initial'
  | 'followup'
  | 'acute';

export type ClinicalVisitStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface ClinicalVisit {
  id?: string;
  visit_id: string;
  patient_id: string;
  visit_number?: number;
  visit_date: string; // YYYY-MM-DD
  visit_time?: string; // HH:mm
  visit_type: ClinicalVisitType;
  status: ClinicalVisitStatus;
  assessment_id?: string;
  report_id?: string;
  progress_report_id?: string;
  clinician_id?: string;
  chief_complaint?: string;
  clinical_notes?: string;
  clinical_summary?: string;
  notes?: string;
  created_at: string;
  completed_at?: string;
  is_baseline?: boolean;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'due_today'
  | 'overdue'
  | 'completed'
  | 'rescheduled'
  | 'cancelled';

export interface FollowUpAppointment {
  id?: string;
  appointment_id: string;
  patient_id: string;
  patient_name?: string;
  related_visit_id?: string;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time?: string; // HH:mm
  reason?: string;
  reason_en?: string;
  reason_bn?: string;
  appointment_type?: 'routine_followup' | 'lab_review' | 'acute_flare_review' | 'comprehensive_reassessment';
  status: AppointmentStatus;
  clinician_notes?: string;
  notes?: string;
  rescheduled_from?: string;
  cancellation_reason?: string;
  actual_visit_id?: string;
  completed_visit_id?: string;
  rescheduled_history?: {
    previous_date: string;
    previous_time?: string;
    rescheduled_at: string;
    reason?: string;
  }[];
  created_at: string;
  timezone?: string;
}

// ─── Longitudinal Visit Snapshots ─────────────────────────────────
export interface ClinicalVisitSnapshot {
  snapshot_id: string;
  patient_id: string;
  visit_id: string;
  visit_number?: number;
  visit_date: string;
  visit_type?: ClinicalVisitType;
  is_baseline: boolean;
  schema_version?: number;
  revision?: number;
  created_at?: string;
  captured_at?: string;
  approved_by?: string;
  approval_status?: 'draft' | 'approved' | 'invalidated';
  related_assessment_id?: string;
  amendment_reason?: string;
  amended_from_snapshot_id?: string;
  anthropometrics: {
    weight_kg?: number;
    height_cm?: number;
    waist_cm?: number;
    bmi?: number;
    whtr?: number;
    weight_trend?: string;
    bmr_kcal?: number;
    tdee_kcal?: number;
    target_calories?: number;
    target_protein_g?: number;
    target_carbs_g?: number;
    target_fat_g?: number;
  };
  vitals?: {
    systolic_bp?: number;
    diastolic_bp?: number;
    resting_hr_bpm?: number;
    temperature_c?: number;
  };
  biomarkers?: Record<string, number | undefined>;
  gut_metrics?: Record<string, any>;
  ayurvedic_state?: Record<string, any>;
  clinical_safety?: Record<string, any>;
  report_approval_status?: Record<string, any>;
  symptoms?: Record<string, number | string>;
  labs?: Record<string, { value: number; unit: string; test_date?: string; status?: string }>;
  dietary_pattern?: {
    diversity_score?: number;
    meal_frequency?: string;
    ffq_summary?: Record<string, string>;
    noted_changes?: string[];
  };
  ayurveda?: {
    prakriti?: string;
    vikriti?: { vata: number; pitta: number; kapha: number };
    agni?: string;
    ama?: string;
  };
  functional_matrix?: Record<string, { burden: string; score?: number }>;
  medications?: MedicationReconciliationSummary;
  allergies?: AllergyReconciliationRecord;
  adherence?: {
    diet_adherence_pct?: number;
    supplement_adherence_pct?: number;
    barriers?: string[];
    adverse_reactions?: string[];
    clinician_observations?: string;
  };
  clinical_priorities?: string[];
  approved_goals?: string[];
}

// ─── Longitudinal Comparison Engine Models ────────────────────────
export type ComparisonOutcome = 'improved' | 'worsened' | 'stable' | 'insufficient_data';

export interface QuantitativeChange {
  marker_id: string;
  marker_name_en: string;
  marker_name_bn: string;
  baseline_value?: number;
  previous_value?: number;
  current_value?: number;
  absolute_change?: number;
  percentage_change?: number;
  unit: string;
  comparability: 'comparable' | 'different_units' | 'different_scale' | 'missing_baseline' | 'missing_current';
  outcome: ComparisonOutcome;
  clinical_interpretation_en: string;
  clinical_interpretation_bn: string;
  baseline_date?: string;
  current_date?: string;
}

export interface LongitudinalProgressAnalysis {
  patient_id: string;
  baseline_visit_id: string;
  comparison_visit_id: string;
  comparison_mode: 'baseline_vs_current' | 'previous_vs_current' | 'selected_vs_selected' | 'multi_visit_trend';
  generated_at: string;
  anthropometric_changes: QuantitativeChange[];
  symptom_changes: QuantitativeChange[];
  laboratory_changes: QuantitativeChange[];
  functional_domain_changes: {
    domain: string;
    domain_name_en: string;
    domain_name_bn: string;
    baseline_burden: string;
    current_burden: string;
    status: ComparisonOutcome;
    resolved_observations: string[];
    persistent_observations: string[];
    new_observations: string[];
    clinical_notes: string;
  }[];
  ayurvedic_changes: {
    prakriti_constant: string;
    baseline_vikriti?: { vata: number; pitta: number; kapha: number };
    current_vikriti?: { vata: number; pitta: number; kapha: number };
    vikriti_trajectory_en: string;
    vikriti_trajectory_bn: string;
    baseline_agni: string;
    current_agni: string;
    agni_interpretation_en: string;
    agni_interpretation_bn: string;
  };
  adherence_summary?: {
    diet_adherence_pct?: number;
    supplement_adherence_pct?: number;
    reported_barriers: string[];
    adverse_reactions: string[];
  };
  overall_summary: {
    improved_areas: string[];
    worsened_areas: string[];
    stable_areas: string[];
    unresolved_problems: string[];
    insufficient_data_areas: string[];
  };
  clinical_safety_review: {
    new_red_flags: string[];
    new_allergies: string[];
    medication_changes: string[];
    new_contraindications: string[];
  };
  next_clinical_priorities: string[];
  trend_series?: {
    is_multi_visit: boolean;
    data_points: {
      visit_id: string;
      visit_date: string;
      weight_kg?: number;
      waist_cm?: number;
      hba1c?: number;
      bloating_severity?: string;
      bristol_stool_score?: number;
      energy_score?: number;
    }[];
  };
}

// ─── Comparative Clinical Progress Report ─────────────────────────
export interface ComparativeProgressReport {
  report_id: string;
  patient_id: string;
  baseline_visit_id: string;
  comparison_visit_id: string;
  generated_at: string;
  revision: number;
  is_approved: boolean;
  approved_by?: string;
  approval_date?: string;
  clinician_notes?: string;
  sectionA_patientAndConsultation: {
    patient_name: string;
    patient_id: string;
    age: number;
    gender: string;
    baseline_date: string;
    comparison_date: string;
    days_elapsed: number;
    reviewing_nutritionist: string;
  };
  sectionB_overallSummary: {
    improved: string[];
    worsened: string[];
    stable: string[];
    unresolved: string[];
    insufficient_data: string[];
  };
  sectionC_anthropometricComparison: QuantitativeChange[];
  sectionD_symptomProgress: QuantitativeChange[];
  sectionE_laboratoryTrends: QuantitativeChange[];
  sectionF_functionalMatrixChanges: LongitudinalProgressAnalysis['functional_domain_changes'];
  sectionG_dietaryPatternAndAdherence: {
    adherence_score_pct?: number;
    barriers: string[];
    adverse_reactions: string[];
    dietary_changes: string[];
  };
  sectionH_ayurvedicProgress: LongitudinalProgressAnalysis['ayurvedic_changes'];
  sectionI_clinicalSafetyReview: LongitudinalProgressAnalysis['clinical_safety_review'];
  sectionJ_clinicalOutcomeInterpretation: {
    achieved_goals: string[];
    partially_achieved_goals: string[];
    unachieved_goals: string[];
    unassessable_goals: string[];
    causality_caveat_en: string;
    causality_caveat_bn: string;
  };
  sectionK_nextClinicalPriorities: string[];
  sectionL_nutritionistReview: {
    reviewing_nutritionist: string;
    review_date: string;
    status: 'draft' | 'fully_approved';
    notes: string;
    revision: number;
  };
  section_l_clinician_signoff?: {
    is_approved?: boolean;
    clinician_name?: string;
    signoff_date?: string;
    notes?: string;
  };
}

// ─── Future P3/P4 Clinical Progress Planning Context ──────────────
export interface ClinicalProgressPlanningContext {
  patientId: string;
  currentVisitId: string;
  comparisonVisitId: string;
  progressReportId: string;
  generatedAt: string;
  clinicalImprovements: string[];
  clinicalDeteriorations: string[];
  persistentConcerns: string[];
  newlyDetectedRestrictions: string[];
  medicationChanges: string[];
  laboratoryTrends: { marker: string; delta: number; unit: string; outcome: string }[];
  dietaryAdherencePct?: number;
  clinicianReviewStatus: 'approved' | 'pending';
  approvedNextObjectives: string[];
}
