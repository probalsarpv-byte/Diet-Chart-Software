/**
 * SHUDDHO FUNCTIONAL NUTRITION SOFTWARE
 * Assessment Data Models & Contracts (Phase P1)
 * 
 * Complete definitions for Quick & Comprehensive assessment modes,
 * 7-Day FFQ, Ayurvedic Prakriti-Vikriti-Agni, Masanumasika Pregnancy,
 * Laboratory intake, and P2 Clinical Intelligence handoff.
 */

import { PopulationGroup } from './index';
import { ClinicalPathway, FeedingStatus, DoshaProfile, AyurvedicAssessmentContext } from './clinical';

// ── 1. Assessment Modes & Navigation Steps ──────────────────────────
export type AssessmentMode = 'quick' | 'comprehensive';

export type AssessmentStepId =
  | 'step_category'       // Step 1: Patient Category & Clinical Pathways
  | 'step_demographics'   // Step 2: Demographics & Anthropometrics
  | 'step_medical_history'// Step 3: Medical History & Mandatory Clinical Safety
  | 'step_functional'     // Step 4: Adaptive Functional Nutrition Domains
  | 'step_ffq'            // Step 5: Seven-Day Food Frequency Questionnaire
  | 'step_ayurveda'       // Step 6: Ayurvedic Prakriti, Vikriti & Agni
  | 'step_population'     // Step 7: Population-Specific Modules (Pediatric/Pregnancy/etc.)
  | 'step_labs'           // Step 8: Laboratory Data Entry Workflow
  | 'step_review';        // Step 9: Clinical Review & P2 Handoff

export interface StepMetadata {
  id: AssessmentStepId;
  stepNumber: number;
  label_en: string;
  label_bn: string;
  description_en: string;
  description_bn: string;
  isMandatory: boolean;
}

export const ASSESSMENT_STEPS: StepMetadata[] = [
  {
    id: 'step_category',
    stepNumber: 1,
    label_en: 'Category & Pathways',
    label_bn: 'রোগীর শ্রেণি ও ক্লিনিক্যাল পথ',
    description_en: 'Primary population group and active clinical pathways',
    description_bn: 'প্রাথমিক জনসংখ্যা দল ও সক্রিয় ক্লিনিক্যাল পথসমূহ',
    isMandatory: true,
  },
  {
    id: 'step_demographics',
    stepNumber: 2,
    label_en: 'Demographics & Vitals',
    label_bn: 'জনমিতি ও শারীরিক পরিমাপ',
    description_en: 'Age, gender, height, weight, waist, and anthropometric ratios',
    description_bn: 'বয়স, লিঙ্গ, উচ্চতা, ওজন, কোমর পরিধি ও নৃতাত্ত্বিক অনুপাত',
    isMandatory: true,
  },
  {
    id: 'step_medical_history',
    stepNumber: 3,
    label_en: 'History & Safety Screening',
    label_bn: 'চিকিৎসা ইতিহাস ও নিরাপত্তা স্ক্রিনিং',
    description_en: 'Chief complaints, diagnoses, confirmed allergies, and high-risk medication screening',
    description_bn: 'প্রধান অভিযোগ, নিশ্চিত রোগনির্ণয়, অ্যালার্জি ও ঝুঁকিপূর্ণ ওষুধ স্ক্রিনিং',
    isMandatory: true,
  },
  {
    id: 'step_functional',
    stepNumber: 4,
    label_en: 'Functional Assessment',
    label_bn: 'ফাংশনাল স্বাস্থ্য মূল্যায়ন',
    description_en: 'Systemic evaluation of GI, microbiome, metabolic, immune, and endocrine health',
    description_bn: 'পরিপাকতন্ত্র, মাইক্রোবায়োম, মেটাবলিক, রোগপ্রতিরোধ ও হরমোন স্বাস্থ্য',
    isMandatory: true,
  },
  {
    id: 'step_ffq',
    stepNumber: 5,
    label_en: '7-Day Food Frequency',
    label_bn: '৭ দিনের খাদ্য গ্রহণের ফ্রিকোয়েন্সি',
    description_en: 'Structured survey-based weekly food intake patterns without daily diary burden',
    description_bn: 'ডায়রির বোঝা ছাড়াই ৭ দিনের কাঠামোগত খাদ্য ফ্রিকোয়েন্সি সমীক্ষা',
    isMandatory: true,
  },
  {
    id: 'step_ayurveda',
    stepNumber: 6,
    label_en: 'Ayurvedic Prakriti & Agni',
    label_bn: 'আয়ুর্বেদিক প্রকৃতি, বিকৃতি ও অগ্নি',
    description_en: 'Constitutional dosha baseline, current imbalances, and metabolic digestive fire',
    description_bn: 'জন্মগত প্রকৃতি, বর্তমান বিকৃতি ও পরিপাক অগ্নির অবস্থা',
    isMandatory: true,
  },
  {
    id: 'step_population',
    stepNumber: 7,
    label_en: 'Specialized Population',
    label_bn: 'বিশেষ জনসংখ্যা মডিউল',
    description_en: 'Conditional modules: Pediatric, Pregnancy, Oncology, Underweight, Renal, etc.',
    description_bn: 'শর্তসাপেক্ষ মডিউল: শিশু, গর্ভবতী, অনকোলজি, কিডনি, অপুষ্টি ইত্যাদি',
    isMandatory: false,
  },
  {
    id: 'step_labs',
    stepNumber: 8,
    label_en: 'Laboratory Data Entry',
    label_bn: 'ল্যাবরেটরি রিপোর্ট ডাটা এন্ট্রি',
    description_en: 'Structured lab biomarkers with status tracking (tested, pending, not tested)',
    description_bn: 'কাঠামোগত ল্যাবরেটরি টেস্ট (পরীক্ষিত, অপেক্ষমাণ, অপ্রীক্ষিত)',
    isMandatory: false,
  },
  {
    id: 'step_review',
    stepNumber: 9,
    label_en: 'Review & Analyze',
    label_bn: 'পর্যালোচনা ও বিশ্লেষণ হ্যান্ডঅফ',
    description_en: 'Comprehensive summary, safety status check, and handoff to P2 Intelligence',
    description_bn: 'সারসংক্ষেপ, নিরাপত্তা নিরীক্ষা এবং P2 ইন্টেলিজেন্সে রূপান্তর',
    isMandatory: true,
  },
];

// ── 2. Seven-Day Food Frequency Questionnaire (FFQ) ─────────────────
export type FFQFrequencyOption =
  | '0_times'       // 0 times in past 7 days
  | '1_2_times'     // 1 to 2 times
  | '3_4_times'     // 3 to 4 times
  | '5_6_times'     // 5 to 6 times
  | '7_10_times'    // 7 to 10 times (daily or slightly more)
  | '11_14_times'   // 11 to 14 times (~2 times/day)
  | '15_21_times'   // 15 to 21 times (~2-3 times/day)
  | '22_plus_times' // 22+ times (multiple times every day)
  | 'not_sure';

export type FFQPortionSize = 'small' | 'medium' | 'large' | 'extra_large' | 'not_sure';

export type FFQFoodGroupId =
  | 'rice_white_brown'
  | 'roti_handmade_atta'
  | 'other_grains_khichuri_poha'
  | 'whole_grains_oats'
  | 'lentils_dal_soup'
  | 'legumes_chickpeas_chola'
  | 'fish_sweetwater_rui_katla'
  | 'fish_small_mola_dhela'
  | 'fish_marine_hilsa_rupchanda'
  | 'poultry_chicken'
  | 'red_meat_beef_mutton'
  | 'eggs_whole'
  | 'milk_cow'
  | 'curd_yogurt_doi'
  | 'leafy_greens_shak'
  | 'other_vegetables_curry'
  | 'raw_salad_cucumber'
  | 'fresh_fruits_seasonal'
  | 'nuts_seeds_chia_almonds'
  | 'fermented_foods_pantabhaat'
  | 'fried_snacks_singara_puri'
  | 'sweets_mishti_dessert'
  | 'bakery_biscuits_bread'
  | 'packaged_chips_chanachur'
  | 'sugar_sweetened_beverages'
  | 'tea_coffee_with_sugar'
  | 'tea_herbal_without_sugar';

export interface FFQItemDefinition {
  id: FFQFoodGroupId;
  name_en: string;
  name_bn: string;
  category: 'grain' | 'protein' | 'dairy' | 'vegetable' | 'fruit' | 'snack_sweet' | 'beverage';
  isHighValueQuick: boolean;
  standardPortionDescription_en: string;
  standardPortionDescription_bn: string;
  approxGramPerPortion: number;
}

export interface FFQItemResponse {
  food_group_id: FFQFoodGroupId;
  frequency: FFQFrequencyOption;
  portion_size: FFQPortionSize;
  notes?: string;
}

export interface DietaryHabitsSurvey {
  meal_frequency_per_day: '1_meal' | '2_meals' | '3_meals' | '3_meals_1_snack' | '4_plus_meals';
  typical_breakfast: 'heavy_rice_or_ruti' | 'light_tea_biscuit' | 'protein_egg' | 'skipped' | 'variable';
  skips_breakfast_frequency: 'never' | '1_2_days' | '3_4_days' | '5_plus_days';
  dinner_timing: 'before_8_pm' | '8_to_9_pm' | '9_to_10_pm' | 'after_10_pm';
  late_night_snacking: 'never' | 'rarely' | 'frequently_3_plus';
  cooking_oil_primary: 'mustard_oil' | 'soybean_oil' | 'palm_oil' | 'rice_bran' | 'desi_ghee' | 'sunflower_olive';
  raw_salt_added_at_table: 'never' | 'sometimes' | 'always';
  fluid_intake_glasses_per_day: '<4_glasses' | '4_6_glasses' | '7_9_glasses' | '10_plus_glasses';
  is_past_week_representative: boolean;
  unrepresentative_reason?: string; // e.g. illness, wedding, travel, religious fasting
}

export interface DietaryFrequencyAssessment {
  items: Record<FFQFoodGroupId, FFQItemResponse>;
  habits: DietaryHabitsSurvey;
  summary: {
    weekly_plant_diversity_score: number; // 0-30+
    daily_fruit_veg_servings_est: number;
    protein_intake_frequency_rank: 'low' | 'moderate' | 'high';
    ultra_processed_burden: 'low' | 'moderate' | 'high' | 'very_high';
    added_sugar_exposure: 'minimal' | 'moderate' | 'excessive';
    sodium_risk_flag: boolean;
    atypical_week_flag: boolean;
    completeness_status: 'complete' | 'partial' | 'minimal';
  };
}

// ── 3. Complete Ayurvedic Prakriti–Vikriti & Agni Models ────────────
export type PrakritiDoshaType =
  | 'vata'
  | 'pitta'
  | 'kapha'
  | 'vata_pitta'
  | 'pitta_kapha'
  | 'vata_kapha'
  | 'tridoshic';

export interface PrakritiScore {
  vata_score: number;   // 0 - 100
  pitta_score: number;  // 0 - 100
  kapha_score: number;  // 0 - 100
  primary_constitution: PrakritiDoshaType;
  secondary_dosha?: 'vata' | 'pitta' | 'kapha';
  is_preliminary: boolean; // Flagged true when calculated from Quick Assessment
  total_questions_evaluated: number;
}

export interface VikritiScore {
  vata_aggravation: number;  // 0 - 100
  pitta_aggravation: number; // 0 - 100
  kapha_aggravation: number; // 0 - 100
  dominant_imbalance: 'vata_aggravation' | 'pitta_aggravation' | 'kapha_aggravation' | 'dual_imbalance' | 'sannipata_balanced';
  active_aggravations: ('vata' | 'pitta' | 'kapha')[];
}

export type AgniClassification = 'samagni' | 'vishamagni' | 'tikshnagni' | 'mandagni';

export interface AgniAssessmentResult {
  type: AgniClassification;
  name_en: string;
  name_bn: string;
  clinical_summary_en: string;
  clinical_summary_bn: string;
  supporting_answers: string[];
}

export interface CompleteAyurvedicAssessment {
  prakriti: PrakritiScore;
  vikriti: VikritiScore;
  agni: AgniAssessmentResult;
  ama_status: 'none' | 'mild' | 'moderate' | 'severe';
  answers: Record<string, string>;
  assessment_date: string;
  is_complete: boolean;
}

// ── 4. Masanumasika Pregnancy Nutrition Framework (Addendum) ────────
export interface MasanumasikaMonthFramework {
  month: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  classical_source: 'Charaka_Samhita' | 'Sushruta_Samhita' | 'Ashtanga_Hridaya';
  developmental_focus_en: string;
  developmental_focus_bn: string;
  maternal_focus_en: string;
  maternal_focus_bn: string;
  dietary_principles_en: string;
  dietary_principles_bn: string;
  recommended_traditional_foods_en: string[];
  recommended_traditional_foods_bn: string[];
  bangladeshi_cultural_substitutes_en: string[];
  bangladeshi_cultural_substitutes_bn: string[];
  restricted_or_unsafe_items_en: string[];
  restricted_or_unsafe_items_bn: string[];
  hydration_and_fluids_en: string;
  hydration_and_fluids_bn: string;
}

export interface MasanumasikaPregnancyAssessment {
  gestational_age_weeks: number;
  gestational_age_days: number;
  pregnancy_month: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  trimester: 1 | 2 | 3;
  edd_estimated_date_of_delivery?: string;
  pre_pregnancy_weight_kg?: number;
  current_weight_kg?: number;
  weight_gain_trajectory: 'inadequate' | 'appropriate' | 'excessive' | 'not_calculated';
  gravida?: number;
  para?: number;
  maternal_risks: {
    gestational_diabetes: boolean;
    gestational_hypertension: boolean;
    preeclampsia_concerns: boolean;
    anemia: boolean;
    severe_morning_sickness_nausea: boolean;
    constipation_digestive_sluggishness: boolean;
    leg_cramps_electrolyte_signs: boolean;
  };
  reported_fetal_growth?: 'appropriate_for_gestational_age' | 'lagging_growth_concern' | 'macrosomia_concern' | 'not_evaluated';
  current_month_guidance: MasanumasikaMonthFramework;
}

// ── 5. Structured Laboratory Data Intake ────────────────────────────
export type LabCategory =
  | 'glycemic'
  | 'lipid'
  | 'renal'
  | 'hepatic'
  | 'electrolytes'
  | 'thyroid'
  | 'hematology_iron'
  | 'vitamins_minerals'
  | 'inflammatory_markers';

export interface StructuredLabEntry {
  marker_id: string;
  category: LabCategory;
  name_en: string;
  name_bn: string;
  status: 'previously_tested' | 'pending_result' | 'not_tested' | 'declined_unavailable';
  numeric_value?: number;
  text_value?: string;
  unit: string;
  conventional_low?: number;
  conventional_high?: number;
  functional_low?: number;
  functional_high?: number;
  test_date?: string;
  notes?: string;
}

export interface LabAssessmentData {
  entries: Record<string, StructuredLabEntry>;
  last_updated: string;
  total_tested_count: number;
  pending_count: number;
}

// ── 6. Specialized Population Question Data ─────────────────────────
export interface PopulationSpecificData {
  pediatric?: {
    birth_weight_kg?: number;
    breastfeeding_history?: string;
    complementary_feeding_onset_months?: number;
    picky_eating_severity?: string;
    growth_trajectory?: string;
    caregiver_concern_summary?: string;
  };
  adolescent?: {
    pubertal_development_stage?: string;
    menstrual_history?: string;
    body_image_concerns?: string;
    sports_activity_level?: string;
  };
  pregnancy?: MasanumasikaPregnancyAssessment;
  lactation?: {
    postpartum_months: number;
    feeding_type: 'exclusive_breastfeeding' | 'partial_breastfeeding' | 'complementary_feeding';
    maternal_hydration_status: string;
    supply_concerns?: boolean;
  };
  oncology?: {
    cancer_type: string;
    treatment_stage: 'active_chemotherapy' | 'radiotherapy' | 'post_surgical_recovery' | 'remission_survivorship';
    taste_changes_dysgeusia: boolean;
    mucositis_mouth_sores: boolean;
    unintentional_weight_loss_pct?: number;
    appetite_score_1_to_5: number;
  };
  underweight_restoration?: {
    weight_loss_duration_months: number;
    early_satiety_present: boolean;
    refeeding_risk_indicators: boolean;
    muscle_loss_functional_decline: boolean;
  };
  geriatric?: {
    frailty_score_simple: 'robust' | 'pre_frail' | 'frail';
    dentition_chewing_difficulty: boolean;
    swallowing_dysphagia_difficulty: boolean;
    polypharmacy_five_plus_drugs: boolean;
    independent_meal_preparation: boolean;
  };
  renal?: {
    ckd_stage_known?: 'stage_1' | 'stage_2' | 'stage_3a' | 'stage_3b' | 'stage_4' | 'stage_5_dialysis' | 'unknown';
    on_dialysis: boolean;
    dialysis_type?: 'hemodialysis' | 'peritoneal_dialysis';
    prescribed_fluid_limit_ml?: number;
    prescribed_sodium_restriction: boolean;
    prescribed_phosphate_binders: boolean;
  };
  cardiovascular?: {
    heart_failure_diagnosed: boolean;
    prescribed_diuretic: boolean;
    fluid_restriction_advised: boolean;
    daily_weight_monitoring_advised: boolean;
  };
  surgical_postoperative?: {
    surgery_name?: string;
    days_post_op?: number;
    npo_status: boolean;
    current_feeding_route: string;
    bowel_sounds_gas_passed: boolean;
    oral_intake_tolerance: 'tolerating_liquids' | 'nausea_on_intake' | 'strictly_npo';
  };
}

// ── 7. Complete Clinical Assessment & P2 Handoff Contract ───────────
export interface AssessmentCompletionStatus {
  administrative_completed: boolean;
  clinical_safety_completed: boolean;
  mandatory_sections_completed: boolean;
  laboratory_data_available: boolean;
  requires_clinical_review: boolean;
  unanswered_critical_questions: string[];
}

export interface ClinicalAssessment {
  patient_id: string;
  visit_id: string;
  assessment_id: string;
  assessment_date: string;
  mode: AssessmentMode;
  questionnaire_version: string;
  primary_population: PopulationGroup;
  clinical_pathways: ClinicalPathway[];
  feeding_status: FeedingStatus;
  
  // Structured Sub-Assessments
  functional_answers: Record<string, any>;
  dietary_frequency: DietaryFrequencyAssessment;
  ayurveda: CompleteAyurvedicAssessment;
  population_data: PopulationSpecificData;
  labs: LabAssessmentData;
  
  // Status & Governance
  completion: AssessmentCompletionStatus;
  safety_warnings_acknowledged: boolean;
  clinician_notes?: string;
}
