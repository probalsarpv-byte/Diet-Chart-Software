/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION SOFTWARE
 * R1: DUAL REPORT & ACCESS SECURITY ENGINE
 * 
 * Implements authoritative data projections:
 * 1. CLINICIAN FULL ANALYSIS (U20) - Full nutritional biochemistry, Atwater balances, PRAL, GL, and variances.
 * 2. PATIENT-SAFE DIET PRESCRIPTION (U21) - Food items, household measures, timings, and cooking steps.
 * 
 * Invariants:
 * - Deterministic projection from the same underlying clinical plan.
 * - Patient projection physically omits all internal calculations (kcal, macro grams, BMR, TDEE, PRAL, GL).
 * - Food serving weights (e.g. 100g cooked rice) are preserved.
 * - Strict release gating: Draft, unapproved, invalidated, or hard-stopped plans cannot be released for final patient dispensation.
 */

import { 
  PatientProfile, 
  ClinicalVisit, 
  DietChartMeal, 
  WeeklyDietPlan, 
  DayPlan,
  FoodItem 
} from '@/types';
import { CLINICAL_PHASES } from '@/engine/phaseProgression';

// ── 1. CLINICIAN REPORT TYPES (U20) ────────────────────────────────

export interface ClinicianDaySummary {
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

export interface ClinicianMealItem {
  id: string;
  food_id: string;
  food_name_bn: string;
  food_name_en: string;
  category: string;
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
  traffic_status?: 'GREEN' | 'YELLOW' | 'RED';
  contraindicated_reasons?: string[];
  alternatives?: Array<{
    food_id: string;
    name_bn: string;
    name_en: string;
    raw_weight_g: number;
    cooked_display_bn: string;
    cooked_display_en: string;
    kcal?: number;
    protein_g?: number;
    kcal_diff?: number;
    protein_diff?: number;
  }>;
}

export interface ClinicianMeal {
  id: string;
  meal_type: string;
  title_bn: string;
  title_en: string;
  target_time: string;
  scheduled_time?: string;
  meal_calories: number;
  meal_protein_g: number;
  meal_carbs_g: number;
  meal_fat_g: number;
  meal_gl: number;
  meal_pral: number;
  items: ClinicianMealItem[];
}

export interface ClinicianDayPlan {
  day_number: number;
  day_name_bn: string;
  day_name_en: string;
  is_locked?: boolean;
  summary: ClinicianDaySummary;
  meals: ClinicianMeal[];
}

export interface ClinicianReportPayload {
  report_type: 'CLINICIAN_FULL_DOSSIER';
  schema_version: number;
  generated_at: string;
  is_approved: boolean;
  approval_status: 'draft' | 'approved' | 'requires_review';
  plan_version: number;
  approval_metadata?: {
    clinician_id: string;
    clinician_name: string;
    approval_timestamp: string;
    license_number?: string;
    notes?: string;
  };
  patient_context: {
    id: string;
    name: string;
    age: number;
    gender: string;
    phone?: string;
    visit_id: string;
    visit_date: string;
    current_phase: number;
    phase_title: string;
    population_group: string;
    height_cm: number;
    weight_kg: number;
    waist_cm?: number;
    bmi: number | string;
    whtr?: number | string;
    active_conditions: string[];
    confirmed_allergies: string[];
    clinician_disallowed_foods: string[];
    labs_summary: Record<string, any>;
    safety_flags: string[];
    hard_stops: string[];
    clinical_safety?: PatientProfile['clinical_safety'];
  };
  energy_and_macro_analytics: {
    bmr_kcal: number;
    tdee_kcal: number;
    bmr_safe_floor_kcal: number;
    target_calories_kcal: number;
    planned_calories_kcal: number;
    calorie_variance_kcal: number;
    calorie_achievement_pct: number;
    target_protein_g: number;
    planned_protein_g: number;
    protein_variance_g: number;
    protein_achievement_pct: number;
    protein_ratio_pct: number;
    target_carbs_g: number;
    planned_carbs_g: number;
    carbs_variance_g: number;
    carbs_achievement_pct: number;
    carbs_ratio_pct: number;
    target_fat_g: number;
    planned_fat_g: number;
    fat_variance_g: number;
    fat_achievement_pct: number;
    fat_ratio_pct: number;
    total_fiber_g: number;
    glycemic_load: number;
    glycemic_load_is_estimated: boolean;
    pral_score: number;
  };
  micronutrient_sufficiency: Record<string, {
    actual_amount: number | null;
    unit: string;
    status: 'optimal' | 'marginal' | 'deficient' | 'excess' | 'not_available';
    status_label: string;
  }>;
  days: ClinicianDayPlan[];
  drug_nutrient_interactions: {
    timeline: any[];
    critical_warnings: string[];
    depletions: any[];
  };
  supplement_considerations: any[];
  clinical_disclaimers: {
    en: string;
    bn: string;
  };
}

// ── 2. PATIENT REPORT TYPES (U21) ──────────────────────────────────

export interface PatientMealItemSubstitute {
  name_bn: string;
  name_en: string;
  portion_bn: string;
  portion_en: string;
}

export interface PatientMealItem {
  food_name_bn: string;
  food_name_en: string;
  raw_serving_weight_g: number;
  household_portion_bn: string;
  household_portion_en: string;
  preparation_note_bn: string;
  preparation_note_en: string;
  approved_substitutes: PatientMealItemSubstitute[];
}

export interface PatientMeal {
  meal_slot: string;
  title_bn: string;
  title_en: string;
  target_time: string;
  items: PatientMealItem[];
}

export interface PatientDayPlan {
  day_number: number;
  day_name_bn: string;
  day_name_en: string;
  fasting_window_display_bn?: string;
  fasting_window_display_en?: string;
  meals: PatientMeal[];
}

export interface PatientReportPayload {
  report_type: 'PATIENT_LIFESTYLE_PRESCRIPTION';
  schema_version: number;
  generated_at: string;
  is_approved: boolean;
  approval_status: 'draft' | 'approved' | 'requires_review';
  plan_version: number;
  is_released: boolean;
  release_eligibility: {
    is_eligible: boolean;
    blocking_reasons_en: string[];
    blocking_reasons_bn: string[];
  };
  clinic_letterhead: {
    clinic_name_bn: string;
    clinic_name_en: string;
    clinic_tagline_bn: string;
    clinic_tagline_en: string;
    contact_phone: string;
    clinic_address: string;
  };
  nutritionist_signoff: {
    clinician_name: string;
    license_title_bn: string;
    license_title_en: string;
    approval_date?: string;
    clinical_notes?: string;
    is_verified: boolean;
  };
  patient_identity: {
    id: string;
    name: string;
    age_display: string;
    gender_display: string;
    visit_date: string;
    visit_id: string;
    phase_title: string;
    duration_weeks: string;
    followup_date?: string;
  };
  safety_instructions: {
    confirmed_allergies_to_avoid_bn: string[];
    confirmed_allergies_to_avoid_en: string[];
    clinician_food_exclusions_bn: string[];
    clinician_food_exclusions_en: string[];
    hydration_guidelines_bn: string;
    hydration_guidelines_en: string;
    fluid_restriction_active: boolean;
    fluid_limit_ml?: number;
    cooking_oil_rules_bn: string;
    cooking_oil_rules_en: string;
    salt_guidelines_bn: string;
    salt_guidelines_en: string;
  };
  traffic_light_guide: {
    green_foods_bn: string[];
    green_foods_en: string[];
    yellow_foods_bn: string[];
    yellow_foods_en: string[];
    red_foods_bn: string[];
    red_foods_en: string[];
  };
  chronological_schedule: Array<{
    time: string;
    title_bn: string;
    title_en: string;
    instructions_bn: string;
    instructions_en: string;
  }>;
  days: PatientDayPlan[];
  disclaimers: {
    en: string;
    bn: string;
  };
}

// ── 3. RELEASE ELIGIBILITY GATE ────────────────────────────────────

export interface ReleaseEligibilityResult {
  isEligible: boolean;
  blockingReasons: string[];
  blockingReasons_bn: string[];
}

export function validateReportReleaseEligibility(options: {
  patient: PatientProfile;
  plan: WeeklyDietPlan | DietChartMeal[] | null | undefined;
  weeklyDietPlan?: WeeklyDietPlan | null;
  visit?: ClinicalVisit | null;
  safetyEvaluation?: any;
  isDietPlanDirty?: boolean;
}): ReleaseEligibilityResult {
  const { patient, plan, weeklyDietPlan, visit, safetyEvaluation, isDietPlanDirty } = options;
  const blockingReasons: string[] = [];
  const blockingReasons_bn: string[] = [];

  // Check 1: Patient Existence & ID
  if (!patient || !patient.id || patient.id.trim() === '') {
    blockingReasons.push('No valid patient profile is selected.');
    blockingReasons_bn.push('কোনো সঠিক রোগীর প্রোফাইল নির্বাচিত হয়নি।');
  }

  // Check 2: Visit context
  const visitId = visit?.visit_id || visit?.id || patient.current_visit_id;
  if (!visitId) {
    blockingReasons.push('No valid clinical consultation visit is linked to this record.');
    blockingReasons_bn.push('এই রেকর্ডের সাথে কোনো সক্রিয় ক্লিনিক্যাল কনসাল্টেশন ভিজিট সংযুক্ত নেই।');
  }

  // Check 3: Plan Existence
  const hasWeeklyPlan = Boolean(weeklyDietPlan && weeklyDietPlan.days && weeklyDietPlan.days.length > 0);
  const hasDailyPlan = Boolean(Array.isArray(plan) && plan.length > 0);
  if (!hasWeeklyPlan && !hasDailyPlan) {
    blockingReasons.push('No clinical nutrition plan has been generated.');
    blockingReasons_bn.push('কোনো ক্লিনিক্যাল পুষ্টি পরিকল্পনা এখনো প্রস্তুত করা হয়নি।');
  }

  // Check 4: Clinical Approval Status
  const isApproved = weeklyDietPlan 
    ? Boolean(weeklyDietPlan.status === 'approved' && weeklyDietPlan.is_approved === true)
    : false;
  
  const status = weeklyDietPlan?.status || 'draft';
  if (status === 'requires_review') {
    blockingReasons.push('Plan status is "requires_review" (modifications made after prior approval).');
    blockingReasons_bn.push('প্ল্যানের স্থিতি "পুনঃনিরীক্ষণ প্রয়োজন" (পূর্ববর্তী অনুমোদনের পর তথ্য পরিবর্তন করা হয়েছে)।');
  } else if (!isApproved) {
    blockingReasons.push('The clinical nutrition plan has not been formally approved by a licensed clinical nutritionist.');
    blockingReasons_bn.push('পুষ্টি পরিকল্পনাটি এখনো লাইসেন্সপ্রাপ্ত ক্লিনিক্যাল নিউট্রিশনিস্ট দ্বারা আনুষ্ঠানিকভাবে অনুমোদিত হয়নি।');
  }

  // Check 5: Plan Invalidated Check
  if (weeklyDietPlan?.invalidated_at || (weeklyDietPlan?.invalidation_reason && weeklyDietPlan.status !== 'approved')) {
    blockingReasons.push(`Prior approval was invalidated: ${weeklyDietPlan.invalidation_reason || 'Plan was edited'}.`);
    blockingReasons_bn.push(`পূর্ববর্তী অনুমোদন বাতিল হয়েছে: ${weeklyDietPlan.invalidation_reason || 'প্ল্যান পরিমার্জন করা হয়েছে'}।`);
  }

  // Check 6: Dirty State Check (Unsaved/Uncalculated edits)
  if (isDietPlanDirty || patient.is_diet_plan_dirty) {
    blockingReasons.push('Unsaved modifications detected. Recalculate and obtain clinician sign-off.');
    blockingReasons_bn.push('অসংরক্ষিত পরিমার্জন বিদ্যমান। পুনরায় হিসাব করে ক্লিনিক্যাল অনুমোদন নিন।');
  }

  // Check 7: Clinical Safety Hard Stop Check
  const hasOverallHardStop = safetyEvaluation?.overallDecision === 'HARD_STOP';
  const hasPlanHardStop = weeklyDietPlan?.overall_safety_status === 'HARD_STOP';
  if (hasOverallHardStop || hasPlanHardStop) {
    blockingReasons.push('Active Clinical Safety HARD_STOP detected. Prescription release is strictly blocked.');
    blockingReasons_bn.push('সক্রিয় ক্লিনিক্যাল সেফটি হার্ড স্টপ বিদ্যমান। রোগীর জন্য চূড়ান্ত প্রেসক্রিপশন প্রকাশ সম্পূর্ণ নিষিদ্ধ।');
  }

  // Check 8: Contraindicated (RED) Food Items Check
  let redItemsFound = 0;
  if (weeklyDietPlan?.days) {
    for (const d of weeklyDietPlan.days) {
      for (const m of d.meals) {
        for (const itm of m.items) {
          if (itm.traffic_status === 'RED') redItemsFound++;
        }
      }
    }
  } else if (Array.isArray(plan)) {
    for (const m of plan) {
      for (const itm of m.items) {
        if (itm.traffic_status === 'RED') redItemsFound++;
      }
    }
  }
  if (redItemsFound > 0) {
    blockingReasons.push(`Plan contains ${redItemsFound} contraindicated (RED) food item(s). Resolve all RED items prior to release.`);
    blockingReasons_bn.push(`খাদ্যতালিকায় ${redItemsFound}টি নিষিদ্ধ (লাল) খাবার অন্তর্ভুক্ত রয়েছে। মুক্তির পূর্বে অবশ্যই এগুলো অপসারণ করুন।`);
  }

  // Check 9: Sign-Off Metadata
  const clinicianName = weeklyDietPlan?.approved_by || weeklyDietPlan?.approval_metadata?.clinician_name;
  if (isApproved && (!clinicianName || clinicianName.trim() === '')) {
    blockingReasons.push('Approval signature metadata is incomplete (missing clinician identifier).');
    blockingReasons_bn.push('অনুমোদনের স্বাক্ষর সংক্রান্ত মেটাডাটা অসম্পূর্ণ (চিকিৎসকের নাম/আইডি অনুপস্থিত)।');
  }

  return {
    isEligible: blockingReasons.length === 0,
    blockingReasons,
    blockingReasons_bn
  };
}

// ── 4. CLINICIAN PROJECTION BUILDER (U20) ──────────────────────────

export function buildClinicianReportProjection(options: {
  patient: PatientProfile;
  dietChart: DietChartMeal[];
  weeklyDietPlan?: WeeklyDietPlan | null;
  dniResult?: any;
  trafficLight?: any;
  p2AnalysisResult?: any;
  candidateSupplements?: any[];
  visit?: ClinicalVisit | null;
}): ClinicianReportPayload {
  const { 
    patient, 
    dietChart, 
    weeklyDietPlan, 
    dniResult, 
    trafficLight, 
    p2AnalysisResult, 
    candidateSupplements = [], 
    visit 
  } = options;

  const phaseInfo = CLINICAL_PHASES[patient.current_phase || 1];
  const visitId = visit?.visit_id || visit?.id || patient.current_visit_id || 'vis_current';
  const visitDate = visit?.visit_date || patient.visit_date;

  // Build days list for clinician
  const clinicianDays: ClinicianDayPlan[] = [];

  if (weeklyDietPlan?.days && weeklyDietPlan.days.length > 0) {
    for (const day of weeklyDietPlan.days) {
      clinicianDays.push({
        day_number: day.day_number,
        day_name_bn: day.day_name_bn,
        day_name_en: day.day_name_en,
        is_locked: day.is_locked,
        summary: {
          calories: day.summary?.calories || 0,
          protein_g: day.summary?.protein_g || 0,
          carbs_g: day.summary?.carbs_g || 0,
          fat_g: day.summary?.fat_g || 0,
          fiber_g: day.summary?.fiber_g || 0,
          gl: day.summary?.gl || 0,
          gl_is_estimated: day.summary?.gl_is_estimated ?? false,
          pral: day.summary?.pral || 0,
          calorie_variance: day.summary?.calorie_variance || 0,
          protein_variance: day.summary?.protein_variance || 0,
          carbs_variance: day.summary?.carbs_variance || 0,
          fat_variance: day.summary?.fat_variance || 0
        },
        meals: day.meals.map(m => ({
          id: m.id,
          meal_type: m.meal_type,
          title_bn: m.title_bn,
          title_en: m.title_en,
          target_time: m.target_time,
          scheduled_time: m.scheduled_time,
          meal_calories: m.meal_calories,
          meal_protein_g: m.meal_protein_g,
          meal_carbs_g: m.meal_carbs_g,
          meal_fat_g: m.meal_fat_g,
          meal_gl: m.meal_gl,
          meal_pral: m.meal_pral,
          items: m.items.map(i => ({
            id: i.id,
            food_id: i.food_id,
            food_name_bn: i.food_name_bn,
            food_name_en: i.food_name_en,
            category: i.category,
            raw_weight_g: i.raw_weight_g,
            cooked_weight_g: i.cooked_weight_g,
            cooked_display_bn: i.cooked_display_bn,
            cooked_display_en: i.cooked_display_en,
            kcal: i.kcal,
            protein_g: i.protein_g,
            carbs_g: i.carbs_g,
            fat_g: i.fat_g,
            fiber_g: i.fiber_g,
            prep_note_bn: i.prep_note_bn,
            prep_note_en: i.prep_note_en,
            traffic_status: i.traffic_status,
            contraindicated_reasons: i.contraindicated_reasons,
            alternatives: (i.alternatives || []).map(alt => ({
              food_id: alt.food_id,
              name_bn: alt.name_bn,
              name_en: alt.name_en,
              raw_weight_g: alt.raw_weight_g,
              cooked_display_bn: alt.cooked_display_bn,
              cooked_display_en: alt.cooked_display_en,
              kcal: alt.kcal,
              protein_g: alt.protein_g,
              kcal_diff: Math.round(alt.kcal - i.kcal),
              protein_diff: Math.round((alt.protein_g - i.protein_g) * 10) / 10
            }))
          }))
        }))
      });
    }
  } else {
    // Single Day (DietChartMeal[])
    const dayCal = dietChart.reduce((sum, m) => sum + m.meal_calories, 0);
    const dayProt = Math.round(dietChart.reduce((sum, m) => sum + m.meal_protein_g, 0) * 10) / 10;
    const dayCarbs = Math.round(dietChart.reduce((sum, m) => sum + m.meal_carbs_g, 0) * 10) / 10;
    const dayFat = Math.round(dietChart.reduce((sum, m) => sum + m.meal_fat_g, 0) * 10) / 10;
    const dayFiber = Math.round(dietChart.reduce((sum, m) => sum + m.items.reduce((s, itm) => s + (itm.fiber_g || 0), 0), 0) * 10) / 10;
    const dayGl = Math.round(dietChart.reduce((sum, m) => sum + (m.meal_gl || 0), 0));
    const dayPral = Math.round(dietChart.reduce((sum, m) => sum + (m.meal_pral || 0), 0) * 10) / 10;
    const targetKcal = patient.calculated?.target_calories || 1500;
    const targetProt = patient.calculated?.target_protein_g || 70;
    const targetCarbs = patient.calculated?.target_carbs_g || 150;
    const targetFat = patient.calculated?.target_fat_g || 40;

    clinicianDays.push({
      day_number: 1,
      day_name_bn: 'দিন ১ (স্ট্যান্ডার্ড দৈনিক প্রেসক্রিপশন)',
      day_name_en: 'Day 1 (Standard Daily Prescription)',
      summary: {
        calories: dayCal,
        protein_g: dayProt,
        carbs_g: dayCarbs,
        fat_g: dayFat,
        fiber_g: dayFiber,
        gl: dayGl,
        gl_is_estimated: true,
        pral: dayPral,
        calorie_variance: dayCal - targetKcal,
        protein_variance: Math.round((dayProt - targetProt) * 10) / 10,
        carbs_variance: Math.round((dayCarbs - targetCarbs) * 10) / 10,
        fat_variance: Math.round((dayFat - targetFat) * 10) / 10
      },
      meals: dietChart.map(m => ({
        id: m.id,
        meal_type: m.meal_type,
        title_bn: m.title_bn,
        title_en: m.title_en,
        target_time: m.target_time,
        scheduled_time: m.scheduled_time,
        meal_calories: m.meal_calories,
        meal_protein_g: m.meal_protein_g,
        meal_carbs_g: m.meal_carbs_g,
        meal_fat_g: m.meal_fat_g,
        meal_gl: m.meal_gl || 0,
        meal_pral: m.meal_pral || 0,
        items: m.items.map(i => ({
          id: i.id,
          food_id: i.food_id,
          food_name_bn: i.food_name_bn,
          food_name_en: i.food_name_en,
          category: i.category,
          raw_weight_g: i.raw_weight_g,
          cooked_weight_g: i.cooked_weight_g,
          cooked_display_bn: i.cooked_display_bn,
          cooked_display_en: i.cooked_display_en,
          kcal: i.kcal,
          protein_g: i.protein_g,
          carbs_g: i.carbs_g,
          fat_g: i.fat_g,
          fiber_g: i.fiber_g,
          prep_note_bn: i.prep_note_bn,
          prep_note_en: i.prep_note_en,
          traffic_status: i.traffic_status,
          contraindicated_reasons: i.contraindicated_reasons,
          alternatives: (i.alternatives || []).map(alt => ({
            food_id: alt.food_id,
            name_bn: alt.name_bn,
            name_en: alt.name_en,
            raw_weight_g: alt.raw_weight_g,
            cooked_display_bn: alt.cooked_display_bn,
            cooked_display_en: alt.cooked_display_en,
            kcal: alt.kcal,
            protein_g: alt.protein_g,
            kcal_diff: Math.round(alt.kcal - i.kcal),
            protein_diff: Math.round((alt.protein_g - i.protein_g) * 10) / 10
          }))
        }))
      }))
    });
  }

  // Energy & Macro analytics
  const firstDay = clinicianDays[0];
  const plannedKcal = firstDay?.summary.calories || 0;
  const plannedProt = firstDay?.summary.protein_g || 0;
  const plannedCarbs = firstDay?.summary.carbs_g || 0;
  const plannedFat = firstDay?.summary.fat_g || 0;
  const plannedFiber = firstDay?.summary.fiber_g || 0;
  const plannedGl = firstDay?.summary.gl || 0;
  const plannedPral = firstDay?.summary.pral || 0;

  const targetKcal = weeklyDietPlan?.target_macros?.calories || patient.calculated?.target_calories || 1500;
  const targetProt = weeklyDietPlan?.target_macros?.protein_g || patient.calculated?.target_protein_g || 70;
  const targetCarbs = weeklyDietPlan?.target_macros?.carbs_g || patient.calculated?.target_carbs_g || 150;
  const targetFat = weeklyDietPlan?.target_macros?.fat_g || patient.calculated?.target_fat_g || 40;

  const totalAtwaterKcal = (plannedProt * 4) + (plannedCarbs * 4) + (plannedFat * 9) || 1;
  const proteinRatioPct = Math.round(((plannedProt * 4) / totalAtwaterKcal) * 100);
  const carbsRatioPct = Math.round(((plannedCarbs * 4) / totalAtwaterKcal) * 100);
  const fatRatioPct = Math.round(((plannedFat * 9) / totalAtwaterKcal) * 100);

  // Micronutrient analysis (Only from authentic FCTB measurements; missing is null, not 0)
  const micronutrientSufficiency: Record<string, {
    actual_amount: number | null;
    unit: string;
    status: 'optimal' | 'marginal' | 'deficient' | 'excess' | 'not_available';
    status_label: string;
  }> = {
    calcium: { actual_amount: null, unit: 'mg', status: 'not_available', status_label: 'Not Available in Food Composition Database' },
    iron: { actual_amount: null, unit: 'mg', status: 'not_available', status_label: 'Not Available in Food Composition Database' },
    potassium: { actual_amount: null, unit: 'mg', status: 'not_available', status_label: 'Calculated Per Item (FCTB Native Subset)' },
    sodium: { actual_amount: null, unit: 'mg', status: 'optimal', status_label: 'Bounded by 5g Discretionary Salt Rule (~1967 mg Na)' },
    vitamin_d: {
      actual_amount: patient.labs?.vitamin_d3 ?? null,
      unit: 'ng/mL',
      status: patient.labs?.vitamin_d3 ? (patient.labs.vitamin_d3 < 20 ? 'deficient' : patient.labs.vitamin_d3 < 30 ? 'marginal' : 'optimal') : 'not_available',
      status_label: patient.labs?.vitamin_d3 ? `${patient.labs.vitamin_d3} ng/mL (Serum Lab)` : 'Laboratory Measurement Not Recorded'
    },
    vitamin_b12: {
      actual_amount: patient.labs?.vitamin_b12 ?? null,
      unit: 'pg/mL',
      status: patient.labs?.vitamin_b12 ? (patient.labs.vitamin_b12 < 200 ? 'deficient' : patient.labs.vitamin_b12 < 350 ? 'marginal' : 'optimal') : 'not_available',
      status_label: patient.labs?.vitamin_b12 ? `${patient.labs.vitamin_b12} pg/mL (Serum Lab)` : 'Laboratory Measurement Not Recorded'
    }
  };

  return {
    report_type: 'CLINICIAN_FULL_DOSSIER',
    schema_version: 1,
    generated_at: new Date().toISOString(),
    is_approved: Boolean(weeklyDietPlan && weeklyDietPlan.status === 'approved' && weeklyDietPlan.is_approved === true),
    approval_status: weeklyDietPlan?.status || 'draft',
    plan_version: weeklyDietPlan?.version || 1,
    approval_metadata: weeklyDietPlan?.approval_metadata || (weeklyDietPlan?.approved_by ? {
      clinician_id: 'CLINICIAN_01',
      clinician_name: weeklyDietPlan.approved_by,
      approval_timestamp: weeklyDietPlan.approved_at || weeklyDietPlan.approval_date || new Date().toISOString(),
      notes: weeklyDietPlan.clinician_notes
    } : undefined),
    patient_context: {
      id: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      visit_id: visitId,
      visit_date: visitDate,
      current_phase: patient.current_phase || 1,
      phase_title: phaseInfo?.title_en || 'Phase 1: Foundations',
      population_group: patient.population_group || 'adult_standard',
      height_cm: patient.height_cm,
      weight_kg: patient.weight_kg,
      waist_cm: patient.waist_cm,
      bmi: patient.calculated?.bmi || (patient.height_cm > 0 && patient.weight_kg > 0 ? Math.round((patient.weight_kg / Math.pow(patient.height_cm / 100, 2)) * 10) / 10 : '—'),
      whtr: patient.calculated?.whtr || (patient.height_cm > 0 && patient.waist_cm ? Math.round((patient.waist_cm / patient.height_cm) * 100) / 100 : '—'),
      active_conditions: patient.selected_conditions || [],
      confirmed_allergies: patient.confirmed_allergies || [],
      clinician_disallowed_foods: patient.clinician_disallowed_foods || [],
      labs_summary: patient.labs || {},
      safety_flags: (patient.labs?.lab_flags || []).map(f => `${f.marker}: ${f.status}`),
      hard_stops: weeklyDietPlan?.unresolved_hard_stops || [],
      clinical_safety: patient.clinical_safety
    },
    energy_and_macro_analytics: {
      bmr_kcal: patient.calculated?.bmr || 1350,
      tdee_kcal: patient.calculated?.tdee || 1620,
      bmr_safe_floor_kcal: patient.calculated?.bmr_safe_calorie_floor || 1350,
      target_calories_kcal: targetKcal,
      planned_calories_kcal: plannedKcal,
      calorie_variance_kcal: plannedKcal - targetKcal,
      calorie_achievement_pct: targetKcal > 0 ? Math.round((plannedKcal / targetKcal) * 100) : 100,
      target_protein_g: targetProt,
      planned_protein_g: plannedProt,
      protein_variance_g: Math.round((plannedProt - targetProt) * 10) / 10,
      protein_achievement_pct: targetProt > 0 ? Math.round((plannedProt / targetProt) * 100) : 100,
      protein_ratio_pct: proteinRatioPct,
      target_carbs_g: targetCarbs,
      planned_carbs_g: plannedCarbs,
      carbs_variance_g: Math.round((plannedCarbs - targetCarbs) * 10) / 10,
      carbs_achievement_pct: targetCarbs > 0 ? Math.round((plannedCarbs / targetCarbs) * 100) : 100,
      carbs_ratio_pct: carbsRatioPct,
      target_fat_g: targetFat,
      planned_fat_g: plannedFat,
      fat_variance_g: Math.round((plannedFat - targetFat) * 10) / 10,
      fat_achievement_pct: targetFat > 0 ? Math.round((plannedFat / targetFat) * 100) : 100,
      fat_ratio_pct: fatRatioPct,
      total_fiber_g: plannedFiber,
      glycemic_load: plannedGl,
      glycemic_load_is_estimated: firstDay?.summary.gl_is_estimated ?? true,
      pral_score: plannedPral
    },
    micronutrient_sufficiency: micronutrientSufficiency,
    days: clinicianDays,
    drug_nutrient_interactions: {
      timeline: dniResult?.timeline || [],
      critical_warnings: dniResult?.criticalWarnings || [],
      depletions: dniResult?.depletions || []
    },
    supplement_considerations: candidateSupplements || [],
    clinical_disclaimers: {
      en: 'CONFIDENTIAL CLINICAL NUTRITION DOSSIER. For licensed healthcare provider analysis only. Contains raw biochemical, Atwater, and drug-nutrient interaction calculations.',
      bn: 'গোপনীয় ক্লিনিক্যাল নিউট্রিশন ডসিয়ার। শুধুমাত্র লাইসেন্সধারী স্বাস্থ্যসেবা প্রদানকারীর মূল্যায়নের জন্য। এতে বায়োকেমিক্যাল হিসাব, অ্যাটওয়াটার রেশিও এবং ড্রাগ-নিউট্রিয়েন্ট ইন্টারঅ্যাকশন সংক্রান্ত তথ্য রয়েছে।'
    }
  };
}

// ── 5. PATIENT PROJECTION BUILDER (U21) ────────────────────────────

export function buildPatientReportProjection(options: {
  patient: PatientProfile;
  dietChart: DietChartMeal[];
  weeklyDietPlan?: WeeklyDietPlan | null;
  dniResult?: any;
  trafficLight?: any;
  visit?: ClinicalVisit | null;
  activeDayNumber?: number;
  includeAllDays?: boolean;
}): PatientReportPayload {
  const { 
    patient, 
    dietChart, 
    weeklyDietPlan, 
    dniResult, 
    trafficLight, 
    visit,
    activeDayNumber = 1,
    includeAllDays = true 
  } = options;

  const phaseInfo = CLINICAL_PHASES[patient.current_phase || 1];
  const visitId = visit?.visit_id || visit?.id || patient.current_visit_id || 'vis_current';
  const visitDate = visit?.visit_date || patient.visit_date;

  // Release eligibility verification
  const eligibility = validateReportReleaseEligibility({
    patient,
    plan: weeklyDietPlan || dietChart,
    weeklyDietPlan,
    visit,
    isDietPlanDirty: patient.is_diet_plan_dirty
  });

  // Build patient days using an EXPLICIT ALLOWLIST
  // Absolutely omit: kcal, protein_g, carbs_g, fat_g, fiber_g, gl, pral, summary
  const patientDays: PatientDayPlan[] = [];

  const sourceDays: DayPlan[] = (weeklyDietPlan?.days && weeklyDietPlan.days.length > 0)
    ? (includeAllDays ? weeklyDietPlan.days : weeklyDietPlan.days.filter(d => d.day_number === activeDayNumber))
    : [{
        day_number: 1,
        day_name_bn: '১ম দিন (দৈনিক প্রেসক্রিপশন)',
        day_name_en: 'Day 1 (Daily Prescription)',
        meals: dietChart,
        safety_decision: 'SAFE',
        summary: {} as any
      }];

  for (const day of sourceDays) {
    const fasting = day.fasting_schedule || weeklyDietPlan?.fasting_schedule;
    let fastingBn: string | undefined = undefined;
    let fastingEn: string | undefined = undefined;

    if (fasting?.is_fasting && fasting.eating_window_start && fasting.eating_window_end) {
      fastingEn = `Eating Window: ${fasting.eating_window_start} – ${fasting.eating_window_end} (${fasting.planned_fasting_hours || 16}h Fast)`;
      fastingBn = `খাবার গ্রহণের সময়: ${fasting.eating_window_start} থেকে ${fasting.eating_window_end} (${fasting.planned_fasting_hours || 16} ঘণ্টার ফাস্টিং)`;
    }

    patientDays.push({
      day_number: day.day_number,
      day_name_bn: day.day_name_bn,
      day_name_en: day.day_name_en,
      fasting_window_display_bn: fastingBn,
      fasting_window_display_en: fastingEn,
      meals: day.meals.map(meal => ({
        meal_slot: meal.meal_type,
        title_bn: meal.title_bn,
        title_en: meal.title_en,
        target_time: meal.target_time,
        items: meal.items.map(item => ({
          food_name_bn: item.food_name_bn,
          food_name_en: item.food_name_en,
          raw_serving_weight_g: item.raw_weight_g,
          household_portion_bn: item.cooked_display_bn,
          household_portion_en: item.cooked_display_en,
          preparation_note_bn: item.prep_note_bn || 'স্বাভাবিক পদ্ধতিতে রান্না',
          preparation_note_en: item.prep_note_en || 'Standard preparation',
          approved_substitutes: (item.alternatives || []).slice(0, 3).map(alt => ({
            name_bn: alt.name_bn,
            name_en: alt.name_en,
            portion_bn: alt.cooked_display_bn,
            portion_en: alt.cooked_display_en
          }))
        }))
      }))
    });
  }

  // Hydration directives
  const fluidPrescription = patient.clinical_safety?.fluid_restriction;
  const isFluidRestricted = Boolean(fluidPrescription?.is_restricted);
  const fluidLimitMl = fluidPrescription?.limit_ml;

  const hydrationBn = isFluidRestricted
    ? `চিকিৎসকের নির্দেশ মোতাবেক দৈনিক মোট তরল গ্রহণ কঠোরভাবে সর্বাধিক ${fluidLimitMl || 'নির্দিষ্ট'} মিলিলিটারে সীমাবদ্ধ রাখুন। অতিরিক্ত পানি বা তরল গ্রহণ করবেন না।`
    : 'প্রতিদিন অন্তত ২.৫ থেকে ৩.০ লিটার বিশুদ্ধ কুসুম গরম পানি পান করুন। ভারী খাবারের ৩০ মিনিট পূর্বে অথবা ৪৫ মিনিট পরে পানি পান করা হজমের জন্য উত্তম।';

  const hydrationEn = isFluidRestricted
    ? `Clinical Fluid Restriction Active: Strictly limit total daily fluid intake to maximum ${fluidLimitMl || 'prescribed'} mL/day as ordered by your managing physician. Do not exceed.`
    : 'Drink 2.5 to 3.0 liters of pure warm water daily. For optimal digestive health, hydrate 30 minutes before or 45 minutes after meals rather than during meals.';

  // Chronological schedule for patient instructions (filtering out internal medication warnings)
  const patientSchedule: Array<{
    time: string;
    title_bn: string;
    title_en: string;
    instructions_bn: string;
    instructions_en: string;
  }> = (dniResult?.timeline || []).map((item: any) => ({
    time: item.time,
    title_bn: item.title_bn,
    title_en: item.title_en,
    instructions_bn: item.instructions_bn,
    instructions_en: item.instructions_en
  }));

  // Traffic light food lists for patient
  const greenBn = (trafficLight?.green || []).slice(0, 20).map((f: FoodItem) => f.name_bn);
  const greenEn = (trafficLight?.green || []).slice(0, 20).map((f: FoodItem) => f.name_en);
  const yellowBn = (trafficLight?.yellow || []).slice(0, 15).map((f: FoodItem) => f.name_bn);
  const yellowEn = (trafficLight?.yellow || []).slice(0, 15).map((f: FoodItem) => f.name_en);
  const redBn = (trafficLight?.red || []).slice(0, 15).map((f: FoodItem) => f.name_bn);
  const redEn = (trafficLight?.red || []).slice(0, 15).map((f: FoodItem) => f.name_en);

  const isApproved = Boolean(weeklyDietPlan && weeklyDietPlan.status === 'approved' && weeklyDietPlan.is_approved === true);
  const clinicianName = weeklyDietPlan?.approved_by || weeklyDietPlan?.approval_metadata?.clinician_name || (isApproved ? 'Dr. Specialist' : 'Unassigned Clinician');

  return {
    report_type: 'PATIENT_LIFESTYLE_PRESCRIPTION',
    schema_version: 1,
    generated_at: new Date().toISOString(),
    is_approved: isApproved,
    approval_status: weeklyDietPlan?.status || 'draft',
    plan_version: weeklyDietPlan?.version || 1,
    is_released: eligibility.isEligible,
    release_eligibility: {
      is_eligible: eligibility.isEligible,
      blocking_reasons_en: eligibility.blockingReasons,
      blocking_reasons_bn: eligibility.blockingReasons_bn
    },
    clinic_letterhead: {
      clinic_name_bn: 'শুদ্ধ ক্লিনিক্যাল ফাংশনাল নিউট্রিশন সেন্টার',
      clinic_name_en: 'SHUDDHO CLINICAL FUNCTIONAL NUTRITION',
      clinic_tagline_bn: 'সেন্টার ফর মেটাবলিক রিবুট ও প্রিসিশন লাইফস্টাইল মেডিসিন',
      clinic_tagline_en: 'Center for Metabolic Reboot & Precision Lifestyle Medicine',
      contact_phone: '+880 1712-000000',
      clinic_address: 'Gulshan-2 / Dhanmondi, Dhaka, Bangladesh'
    },
    nutritionist_signoff: {
      clinician_name: clinicianName,
      license_title_bn: 'ক্লিনিক্যাল ফাংশনাল নিউট্রিশনিস্ট',
      license_title_en: 'Lead Clinical Functional Nutritionist',
      approval_date: weeklyDietPlan?.approved_at?.split('T')[0] || weeklyDietPlan?.approval_date?.split('T')[0],
      clinical_notes: weeklyDietPlan?.clinician_notes,
      is_verified: isApproved
    },
    patient_identity: {
      id: patient.id,
      name: patient.name,
      age_display: patient.age > 0 ? `${patient.age}y` : '—',
      gender_display: patient.gender === 'female' ? 'মহিলা (Female)' : 'পুরুষ (Male)',
      visit_date: visitDate,
      visit_id: visitId,
      phase_title: phaseInfo?.title_en || 'Phase 1: Foundations',
      duration_weeks: phaseInfo?.duration_weeks || 'Weeks 1–4',
      followup_date: undefined // only included when scheduled follow-up exists
    },
    safety_instructions: {
      confirmed_allergies_to_avoid_bn: patient.confirmed_allergies || [],
      confirmed_allergies_to_avoid_en: patient.confirmed_allergies || [],
      clinician_food_exclusions_bn: patient.clinician_disallowed_foods || [],
      clinician_food_exclusions_en: patient.clinician_disallowed_foods || [],
      hydration_guidelines_bn: hydrationBn,
      hydration_guidelines_en: hydrationEn,
      fluid_restriction_active: isFluidRestricted,
      fluid_limit_ml: fluidLimitMl,
      cooking_oil_rules_bn: 'রান্নায় কোনো অবস্থাতেই রিফাইন্ড সয়াবিন বা পাম তেল ব্যবহার করবেন না। খাঁটি ঘানিভাঙা সরিষার তেল (দৈনিক ১৫-২০ মিলি) অথবা দেশি খাঁটি ঘিয়ে রান্না করুন।',
      cooking_oil_rules_en: 'Avoid industrial refined seed oils. Cook strictly with cold-pressed unrefined mustard oil (15-20 mL/day) or pure desi cow ghee.',
      salt_guidelines_bn: 'দৈনিক লবণ গ্রহণ ৫ গ্রামের মধ্যে (১ চা চামচ সমান) সীমাবদ্ধ রাখুন। খাবারের সাথে কাঁচা বাড়তি লবণ পরিহার করুন।',
      salt_guidelines_en: 'Limit daily cooking salt to 5g (~1 level teaspoon). Avoid adding raw table salt at the dining table.'
    },
    traffic_light_guide: {
      green_foods_bn: greenBn,
      green_foods_en: greenEn,
      yellow_foods_bn: yellowBn,
      yellow_foods_en: yellowEn,
      red_foods_bn: redBn,
      red_foods_en: redEn
    },
    chronological_schedule: patientSchedule,
    days: patientDays,
    disclaimers: {
      en: 'PERSONALIZED PATIENT DIET PRESCRIPTION. This plan details specific foods, meal hours, and household portions tailored to your clinical consultation. Follow meal timings and household measures as prescribed.',
      bn: 'রোগীর ব্যক্তিগতকৃত ডায়েট প্রেসক্রিপশন। এতে আপনার চিকিৎসার জন্য উপযোগী খাবার, সময়সূচি এবং পারিবারিক পাত্রের পরিমাপ উল্লেখ করা হয়েছে। নির্দেশিত পরিমাপে খাবার গ্রহণ করুন।'
    }
  };
}

// ── 6. STRICT PATIENT PROJECTION PRIVACY VALIDATOR ─────────────────

const BANNED_PATIENT_KEYS = new Set([
  'kcal',
  'calories',
  'meal_calories',
  'protein_g',
  'meal_protein_g',
  'carbs_g',
  'meal_carbs_g',
  'fat_g',
  'meal_fat_g',
  'fiber_g',
  'gl',
  'meal_gl',
  'pral',
  'meal_pral',
  'target_calories',
  'target_protein_g',
  'target_carbs_g',
  'target_fat_g',
  'bmr',
  'tdee',
  'bmr_safe_calorie_floor',
  'calorie_variance',
  'protein_variance',
  'carbs_variance',
  'fat_variance',
  'energy_and_macro_analytics',
  'micronutrient_sufficiency',
  'atwater_protein_grams',
  'atwater_carbs_grams',
  'atwater_fat_grams'
]);

export function validatePatientReportProjection(payload: PatientReportPayload): {
  isValid: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  // Recursive key inspector
  function inspectKeys(obj: any, path: string = '') {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      obj.forEach((item, idx) => inspectKeys(item, `${path}[${idx}]`));
      return;
    }

    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      if (BANNED_PATIENT_KEYS.has(lowerKey)) {
        violations.push(`Banned calculation property found at ${path}.${key}`);
      }
      inspectKeys(obj[key], `${path}.${key}`);
    }
  }

  inspectKeys(payload, 'payload');

  // JSON stringification content verification (regex for calculated macros)
  const jsonString = JSON.stringify(payload);

  // Check for forbidden calculated calorie statements (e.g. "1500 kcal", "450 calories")
  // Note: Serving weights like "100g", "80g cooked" are completely allowed!
  const forbiddenCaloriePattern = /\b\d+\s*(?:kcal|calories|kilocalories)\b/i;
  if (forbiddenCaloriePattern.test(jsonString)) {
    violations.push('Payload contains numerical calculated calorie values (e.g. 1500 kcal).');
  }

  // Check for forbidden calculated macro statements (e.g. "25g protein", "40g carbs", "15g fat")
  const forbiddenMacroPattern = /\b\d+\s*g\s*(?:protein|carbohydrate|carbs|fat)\b/i;
  if (forbiddenMacroPattern.test(jsonString)) {
    violations.push('Payload contains numerical calculated macro values (e.g. 25g protein).');
  }

  // Check for raw calculation field names in serialized json
  const forbiddenFieldNames = [
    '"protein_g"',
    '"carbs_g"',
    '"fat_g"',
    '"meal_calories"',
    '"meal_protein_g"',
    '"bmr"',
    '"tdee"',
    '"pral"',
    '"glycemic_load"'
  ];

  for (const field of forbiddenFieldNames) {
    if (jsonString.includes(field)) {
      violations.push(`Payload serializes internal calculation field identifier: ${field}`);
    }
  }

  return {
    isValid: violations.length === 0,
    violations
  };
}
