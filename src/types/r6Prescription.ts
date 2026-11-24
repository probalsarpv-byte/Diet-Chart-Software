/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Phase R6: Master Prescription Composer Typed Contracts
 * 
 * Unifies:
 * 1. Demographic & Clinical Identity
 * 2. Strict Safety Directives & Exclusion Alerts
 * 3. 7-Food-Group Metabolic Traffic Light Dietary Guide
 * 4. Dynamic Multi-Day Diet Chart with Fasting Window Support
 * 5. Bangladeshi Food Exchange & Household Portion Guide (Bati, Cup, Spoon, Piece, Palm)
 * 6. 6-Column Chronological Medication & Supplementation Protocol
 * 7. Lifestyle, Exercise, Sleep & Hydration Support
 * 8. Clinical Sign-off, Versioning & Fail-Closed Safety Gate
 */

import { 
  StructuredTrafficLightGuide
} from './index';

export interface MedicationProtocolRow {
  id: string;
  sequence_time: string; // "07:00", "08:00", "13:00", "20:00", or "UNKNOWN"
  sequence_time_bn: string; // "সকাল ০৮:০০", "রাত ০৮:০০", etc.
  sequence_time_en: string;
  brand_name: string; // Brand name e.g. "Comet 500"
  generic_name: string; // "Metformin Hydrochloride"
  dosage_display_en: string; // "500 mg (1 tablet)"
  dosage_display_bn: string; // "৫০০ মিগ্রা (১টি ট্যাবলেট)"
  duration_en: string; // "Ongoing (Continuous)" or "14 days"
  duration_bn: string; // "চলমান (দীর্ঘমেয়াদী)" or "১৪ দিন"
  clinical_instructions_en: string;
  clinical_instructions_bn: string;
  item_type: 'medication' | 'supplement' | 'candidate_supplement';
  approval_status: 'prescribed_approved' | 'draft_candidate' | 'discontinued';
  relationship_to_meals?: 'before_meal' | 'with_meal' | 'after_meal' | 'empty_stomach' | 'bedtime' | 'anytime' | 'before_meal_empty_stomach' | 'independent_of_meals' | 'unknown';
  requires_clinician_verification?: boolean;
}

export interface FoodExchangeRule {
  exchange_group: 'grains' | 'proteins' | 'vegetables' | 'fruits' | 'dairy' | 'fats_oils';
  title_bn: string;
  title_en: string;
  household_measure_bn: string;
  household_measure_en: string;
  standard_raw_weight_g: number;
  standard_cooked_weight_g?: number;
  local_measure_unit: 'bati' | 'cup' | 'glass' | 'spoon' | 'piece' | 'palm' | 'fist';
  raw_to_cooked_conversion_note_bn: string;
  raw_to_cooked_conversion_note_en: string;
  common_examples_bn: string[];
  common_examples_en: string[];
}

export interface FastingSafetyEvaluation {
  is_fasting_prescribed: boolean;
  fasting_protocol?: '12_12' | '14_10' | '16_8' | 'custom' | 'none';
  eating_window_start?: string; // e.g. "10:00"
  eating_window_end?: string; // e.g. "18:00"
  fasting_hours: number;
  is_safe_for_medication_regimen: boolean;
  safety_warnings_bn: string[];
  safety_warnings_en: string[];
  hypoglycemia_precautions_bn?: string;
  hypoglycemia_precautions_en?: string;
}

export interface R6PrescriptionMasterPayload {
  prescription_id: string;
  schema_version: string; // "R6.0"
  generated_at: string;
  is_approved: boolean;
  plan_version: number;
  is_released: boolean;
  release_eligibility: {
    is_eligible: boolean;
    blocking_reasons_en: string[];
    blocking_reasons_bn: string[];
  };
  clinic_header: {
    name_bn: string;
    name_en: string;
    tagline_bn: string;
    tagline_en: string;
    contact?: string;
    address?: string;
  };
  clinician: {
    name: string;
    designation_bn?: string;
    designation_en?: string;
    license?: string;
    signoff_date?: string;
  };
  patient: {
    id: string;
    name: string;
    age_display: string;
    gender_display: string;
    visit_id: string;
    visit_date: string;
    phase_title: string;
    duration_weeks: string;
    followup_date?: string;
  };
  safety_directives: {
    allergies_to_avoid_bn: string[];
    allergies_to_avoid_en: string[];
    clinical_food_exclusions_bn: string[];
    clinical_food_exclusions_en: string[];
    fluid_limit_ml?: number;
    fluid_restriction_active: boolean;
    cooking_oil_rules_bn?: string;
    cooking_oil_rules_en?: string;
    salt_rules_bn?: string;
    salt_rules_en?: string;
  };
  seven_food_group_guide: StructuredTrafficLightGuide;
  fasting_evaluation: FastingSafetyEvaluation;
  dynamic_diet_chart: {
    total_days: number;
    meal_count_per_day: number;
    days: Array<{
      day_number: number;
      day_name_bn: string;
      day_name_en: string;
      fasting_display_bn?: string;
      fasting_display_en?: string;
      meals: Array<{
        meal_slot: string;
        title_bn: string;
        title_en: string;
        target_time: string;
        items: Array<{
          food_name_bn: string;
          food_name_en: string;
          raw_serving_weight_g: number;
          household_portion_bn: string;
          household_portion_en: string;
          preparation_note_bn: string;
          preparation_note_en: string;
          alternatives: Array<{
            name_bn: string;
            name_en: string;
            portion_bn: string;
            portion_en: string;
          }>;
        }>;
      }>;
    }>;
  };
  food_exchange_guide: FoodExchangeRule[];
  medication_supplement_protocol: {
    columns: [
      'সময় (Time Sequence)',
      'ওষুধ/সাপ্লিমেন্ট (ব্র্যান্ড)',
      'জেনেরিক নাম (Generic)',
      'ডোজ ও পরিমাণ (Dosage)',
      'Duration',
      'ক্লিনিক্যাল নির্দেশনা'
    ];
    active_rows: MedicationProtocolRow[];
    draft_candidates: MedicationProtocolRow[];
  };
  lifestyle_support: {
    hydration: {
      target_daily_ml: number;
      instructions_bn: string;
      instructions_en: string;
    };
    exercise: {
      target_bn: string;
      target_en: string;
      safety_instructions_bn: string;
      safety_instructions_en: string;
    };
    sleep_circadian: {
      sleep_target_hours: number;
      caffeine_curfew?: string;
      dinner_curfew?: string;
      instructions_bn: string;
      instructions_en: string;
    };
  };
  disclaimers: {
    bn: string;
    en: string;
  };
}
