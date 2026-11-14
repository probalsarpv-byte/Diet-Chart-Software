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
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
  micronutrients?: {
    calcium_mg: number;
    iron_mg: number;
    magnesium_mg: number;
    potassium_mg: number;
    sodium_mg: number;
    zinc_mg: number;
    vitamin_c_mg: number;
    folate_mcg: number;
    vitamin_a_mcg: number;
  };
  raw_to_cooked_ratio: number;
  glycemic_load: GlycemicLoad;
  pral_score: number;
  tags: string[];
  prep_note_bn: string;
  prep_note_en: string;
}

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

export interface ActivityLevelConfig {
  factor: number;
  label_en: string;
  label_bn: string;
}

export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
export type AgniType = 'mandagni' | 'tikshnagni' | 'vishamagni' | 'samagni';
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
}

export interface FunctionalLabs {
  hba1c?: number;
  fasting_glucose?: number;
  fasting_insulin?: number;
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

export interface GutAndAyurvedicProfile {
  bloating: 'none' | 'mild' | 'severe';
  acid_reflux_hypoacidity: boolean;
  bristol_stool_score: number; // 1-7
  energy_score: number; // 1-10
  sleep_quality_score: number; // 1-10
  digestive_fire_agni: AgniType;
}

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  phone: string;
  email?: string;
  visit_date: string;
  current_phase: 1 | 2 | 3 | 4;
  height_cm: number;
  weight_kg: number;
  waist_cm: number;
  activity_level: ActivityLevel;
  sleep_hours: number;
  shift_worker: boolean;
  selected_conditions: ClinicalConditionId[];
  active_medications: string[]; // medicine IDs or generic names
  gut_profile: GutAndAyurvedicProfile;
  labs: FunctionalLabs;
  calculated: CalculatedAnthropometrics;
  dietary_preferences?: {
    is_vegetarian?: boolean;
    avoid_beef?: boolean;
    avoid_mutton?: boolean;
    preferred_oil?: 'mustard_oil' | 'desi_ghee' | 'coconut_oil';
    meal_structure?: '3_meals' | '3_meals_1_snack' | 'intermittent_fasting_16_8';
  };
  custom_clinical_notes?: string;
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
  redFoods?: string[]; // specific food codes or keywords
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
  conditionId: ClinicalConditionId | 'DNI_INTERACTION';
  conditionNameBn: string;
  conditionNameEn: string;
  status: 'GREEN' | 'YELLOW' | 'RED';
  note_bn: string;
  note_en: string;
}

export interface EvaluatedFoodItem extends FoodItem {
  traffic_status: 'GREEN' | 'YELLOW' | 'RED';
  reasons: EvaluatedReason[];
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
}

export interface IncompatiblePairWarning {
  warning_bn: string;
  warning_en: string;
  severity: 'high' | 'medium';
}

export interface DietChartMeal {
  id: string;
  meal_type: 'morning_protocol' | 'breakfast' | 'mid_morning' | 'lunch' | 'evening_snack' | 'dinner' | 'night_protocol';
  title_bn: string;
  title_en: string;
  target_time: string;
  items: DietChartMealItem[];
  meal_calories: number;
  meal_protein_g: number;
  meal_carbs_g: number;
  meal_fat_g: number;
  meal_gl: number;
  meal_pral: number;
  incompatible_warnings: IncompatiblePairWarning[];
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
  symptom_relief_pct: number;
  homa_ir?: number;
  tg_hdl_ratio?: number;
  hba1c?: number;
  tsh?: number;
  uric_acid?: number;
  notes_bn?: string;
  notes_en?: string;
}

export interface PatientRecord {
  patient: PatientProfile;
  visits: LongitudinalVisit[];
  current_diet_chart: DietChartMeal[];
  current_supplements: SupplementItem[];
  timeline: DailyTimelineItem[];
  updated_at: string;
}

