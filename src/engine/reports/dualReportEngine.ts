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
import {
  evaluateDailyPlanConstraints,
  filterAuthorizedPatientAlternatives
} from '@/engine/r8/substitutionEngine';
import {
  SevenFoodGroupCategory,
  FoodGuideEntry,
  SevenFoodGroupSection,
  StructuredTrafficLightGuide,
  R5MedicationRecord
} from '@/types/r5Systems';
import { 
  MedicationProtocolRow, 
  FoodExchangeRule, 
  FastingSafetyEvaluation,
  PatientFoodExchangeItem,
  R6PrescriptionMasterPayload
} from '@/types/r6Prescription';
import { R4ProtocolStudioData, R7SupplementExposureSummary, SupplementProtocolItem } from '@/types/r4Protocol';
import { R7LabIntelligenceSummary } from '@/types/r7Laboratory';
import { StructuredLabEntry } from '@/types/assessment';
import { evaluateR7LaboratoryIntelligence } from '@/engine/r7/biomarkerIntelligence';
import { calculateR7SupplementExposure } from '@/engine/r7/supplementIntelligence';
import { 
  compose6ColumnMedicationProtocol, 
  evaluateMedicationSafetyContract,
  evaluateR6HydrationAndFluidSafety,
  validateR4ProtocolAuthorization,
  evaluateFastingSafety, 
  STANDARD_BANGLADESHI_EXCHANGES,
  composeR6Prescription
} from '@/engine/r6PrescriptionComposer';

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
    bmr_kcal: number | null;
    tdee_kcal: number | null;
    bmr_safe_floor_kcal: number | null;
    target_calories_kcal: number | null;
    planned_calories_kcal: number;
    calorie_variance_kcal: number | null;
    calorie_achievement_pct: number | null;
    target_protein_g: number | null;
    planned_protein_g: number;
    protein_variance_g: number | null;
    protein_achievement_pct: number | null;
    protein_ratio_pct: number;
    target_carbs_g: number | null;
    planned_carbs_g: number;
    carbs_variance_g: number | null;
    carbs_achievement_pct: number | null;
    carbs_ratio_pct: number;
    target_fat_g: number | null;
    planned_fat_g: number;
    fat_variance_g: number | null;
    fat_achievement_pct: number | null;
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
    source_type?: 'dietary_intake' | 'serum_biomarker';
  }>;
  serum_laboratory_biomarkers?: Record<string, {
    marker: string;
    value: number | null;
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
  r7_lab_intelligence?: R7LabIntelligenceSummary;
  r7_supplement_exposure?: R7SupplementExposureSummary;
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
    clinic_tagline_bn?: string;
    clinic_tagline_en?: string;
    contact_phone?: string;
    clinic_address?: string;
  };
  nutritionist_signoff: {
    clinician_name: string;
    license_title_bn?: string;
    license_title_en?: string;
    approval_date?: string;
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
  seven_food_group_guide?: StructuredTrafficLightGuide;
  chronological_schedule: Array<{
    time: string;
    title_bn: string;
    title_en: string;
    instructions_bn: string;
    instructions_en: string;
  }>;
  days: PatientDayPlan[];
  medication_supplement_protocol?: {
    columns: [
      'সময় (Time Sequence)',
      'ওষুধ/সাপ্লিমেন্ট (ব্র্যান্ড)',
      'জেনেরিক নাম (Generic)',
      'ডোজ ও পরিমাণ (Dosage)',
      'Duration',
      'ক্লিনিক্যাল নির্দেশনা'
    ];
    active_rows: MedicationProtocolRow[];
    pending_verification_rows: MedicationProtocolRow[];
    draft_candidates: MedicationProtocolRow[];
    has_unresolved_verification: boolean;
  };
  food_exchange_guide?: FoodExchangeRule[];
  patient_specific_exchanges?: PatientFoodExchangeItem[];
  fasting_evaluation?: FastingSafetyEvaluation;
  lifestyle_support?: R6PrescriptionMasterPayload['lifestyle_support'];
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
  expectedVisitId?: string;
  safetyEvaluation?: any;
  isDietPlanDirty?: boolean;
  r5NutritionContract?: any;
  medications?: R5MedicationRecord[];
  r4Protocol?: R4ProtocolStudioData | null;
  supplements?: any[];
  isR4ProtocolDirty?: boolean;
  r7LabSummary?: R7LabIntelligenceSummary;
  structuredLabEntries?: Record<string, StructuredLabEntry>;
}): ReleaseEligibilityResult {
  const {
    patient,
    plan,
    weeklyDietPlan,
    visit,
    expectedVisitId,
    safetyEvaluation,
    isDietPlanDirty,
    r5NutritionContract,
    medications
  } = options;
  const blockingReasons: string[] = [];
  const blockingReasons_bn: string[] = [];

  // Check 1: Patient Existence & ID Integrity (Fail Closed)
  if (!patient || !patient.id || patient.id.trim() === '') {
    blockingReasons.push('No valid patient profile is selected.');
    blockingReasons_bn.push('কোনো সঠিক রোগীর প্রোফাইল নির্বাচিত হয়নি।');
  } else if (weeklyDietPlan && (!weeklyDietPlan.patient_id || weeklyDietPlan.patient_id.trim() === '')) {
    blockingReasons.push('Plan patient identifier is missing or unverified.');
    blockingReasons_bn.push('প্ল্যানের রোগী শনাক্তকারী অনুপস্থিত বা অযাচাইকৃত।');
  } else if (weeklyDietPlan?.patient_id && weeklyDietPlan.patient_id !== patient.id) {
    blockingReasons.push(`Plan patient identity mismatch: plan belongs to ${weeklyDietPlan.patient_id}, active patient is ${patient.id}.`);
    blockingReasons_bn.push(`রোগীর পরিচয়ের অমিল: প্ল্যানটি ${weeklyDietPlan.patient_id} এর জন্য প্রস্তুতকৃত, বর্তমান রোগী ${patient.id}।`);
  }

  // Check 2: Visit Context & ID Integrity (Fail Closed)
  const effectiveVisitId = expectedVisitId || visit?.visit_id || visit?.id || patient.current_visit_id;
  if (!effectiveVisitId || effectiveVisitId.trim() === '') {
    blockingReasons.push('No valid clinical consultation visit is linked to this record.');
    blockingReasons_bn.push('এই রেকর্ডের সাথে কোনো সক্রিয় ক্লিনিক্যাল কনসাল্টেশন ভিজিট সংযুক্ত নেই।');
  } else if (weeklyDietPlan && !weeklyDietPlan.visit_id) {
    blockingReasons.push('Plan visit identifier is missing or unverified.');
    blockingReasons_bn.push('প্ল্যানের ভিজিট শনাক্তকারী অনুপস্থিত বা অযাচাইকৃত।');
  } else if (weeklyDietPlan?.visit_id && effectiveVisitId && weeklyDietPlan.visit_id !== effectiveVisitId) {
    blockingReasons.push(`Plan visit ID (${weeklyDietPlan.visit_id}) does not match selected consultation visit ID (${effectiveVisitId}).`);
    blockingReasons_bn.push(`ভিজিট আইডির অমিল: প্ল্যানের ভিজিট (${weeklyDietPlan.visit_id}) নির্বাচিত ভিজিটের (${effectiveVisitId}) সাথে মেলে না।`);
  }

  // Check 3: Plan Existence
  const hasWeeklyPlan = Boolean(weeklyDietPlan && weeklyDietPlan.days && weeklyDietPlan.days.length > 0);
  const hasDailyPlan = Boolean(Array.isArray(plan) && plan.length > 0);
  if (!hasWeeklyPlan && !hasDailyPlan) {
    blockingReasons.push('No clinical nutrition plan has been generated.');
    blockingReasons_bn.push('কোনো ক্লিনিক্যাল পুষ্টি পরিকল্পনা এখনো প্রস্তুত করা হয়নি।');
  }

  // Check 4: Clinical Approval Status & Version Match
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

  // Approval Version Integrity: Enforce exact approval-version binding
  if (isApproved && weeklyDietPlan) {
    const boundVersion = weeklyDietPlan.approval_metadata?.plan_version;
    if (boundVersion === undefined || boundVersion === null) {
      blockingReasons.push('Approval record is missing bound plan version metadata.');
      blockingReasons_bn.push('অনুমোদন রেকর্ডে প্ল্যান সংস্করণ মেটাডাটা অনুপস্থিত।');
    } else if (boundVersion !== weeklyDietPlan.version) {
      blockingReasons.push(`Approval record bound to version ${boundVersion}, but current plan is at version ${weeklyDietPlan.version}.`);
      blockingReasons_bn.push(`অনুমোদন সংস্করণ ${boundVersion}-এর সাথে প্ল্যানের বর্তমান সংস্করণ ${weeklyDietPlan.version} মিলছে না।`);
    }

    if (weeklyDietPlan.previous_approval && weeklyDietPlan.previous_approval.version >= weeklyDietPlan.version) {
      blockingReasons.push(`Prior approval version (${weeklyDietPlan.previous_approval.version}) is invalid for plan version (${weeklyDietPlan.version}).`);
      blockingReasons_bn.push(`পূর্ববর্তী অনুমোদন সংস্করণ (${weeklyDietPlan.previous_approval.version}) বর্তমান সংস্করণের (${weeklyDietPlan.version}) জন্য অকার্যকর।`);
    }
  }

  // Check 5: Plan Invalidated Check
  if (weeklyDietPlan?.invalidated_at || (weeklyDietPlan?.invalidation_reason && weeklyDietPlan.status !== 'approved')) {
    blockingReasons.push(`Prior approval was invalidated: ${weeklyDietPlan.invalidation_reason || 'Plan was edited'}.`);
    blockingReasons_bn.push(`পূর্ববর্তী অনুমোদন বাতিল হয়েছে: ${weeklyDietPlan.invalidation_reason || 'প্ল্যান পরিমার্জন করা হয়েছে'}।`);
  }

  // Check 6: Dirty State Check (Unsaved/Unapproved edits)
  if (isDietPlanDirty || patient.is_diet_plan_dirty) {
    blockingReasons.push('Unsaved or unapproved modifications detected. Recalculate and obtain clinician sign-off.');
    blockingReasons_bn.push('অসংরক্ষিত বা অননুমোদিত পরিমার্জন বিদ্যমান। পুনরায় হিসাব করে ক্লিনিক্যাল অনুমোদন নিন।');
  }

  // Check 7: Clinical Safety Hard Stop Check (Fail Closed on ANY Hard Stop)
  const hasOverallHardStop = safetyEvaluation?.overallDecision === 'HARD_STOP';
  const hasPlanHardStop = weeklyDietPlan?.overall_safety_status === 'HARD_STOP';
  const hasUnresolvedHardStops = Boolean(weeklyDietPlan?.unresolved_hard_stops && weeklyDietPlan.unresolved_hard_stops.length > 0);
  const hasDayHardStop = Boolean(weeklyDietPlan?.days?.some(d => d.safety_decision === 'HARD_STOP'));
  if (hasOverallHardStop || hasPlanHardStop || hasUnresolvedHardStops || hasDayHardStop) {
    blockingReasons.push('Active Clinical Safety HARD_STOP detected. Prescription release is strictly blocked.');
    blockingReasons_bn.push('সক্রিয় ক্লিনিক্যাল সেফটি হার্ড স্টপ বিদ্যমান। রোগীর জন্য চূড়ান্ত প্রেসক্রিপশন প্রকাশ সম্পূর্ণ নিষিদ্ধ।');
  }

  // Check 7b (Checkpoint G14): Revalidate authoritative R8 daily nutrient hard constraints directly (never trust cached flags)
  if (weeklyDietPlan?.days && weeklyDietPlan.days.length > 0) {
    for (const d of weeklyDietPlan.days) {
      const dailyItems = (d.meals || []).flatMap(m => (m.items || []).map(it => ({
        item_id: it.id,
        meal_id: m.id,
        food_id: it.food_id,
        raw_weight_g: it.raw_weight_g,
        is_recipe_item: it.is_recipe_item,
        recipe_reference: it.recipe_reference
      })));
      const r8DayCheck = evaluateDailyPlanConstraints({
        daily_items: dailyItems,
        patient,
        r5_nutrition_contract: r5NutritionContract,
        r7_lab_summary: options.r7LabSummary
      });
      if (r8DayCheck.hard_limit_violations_en.length > 0) {
        const msg = `Day ${d.day_number} R8 Clinical Constraint Violation: ${r8DayCheck.hard_limit_violations_en.join('; ')}`;
        if (!blockingReasons.includes(msg)) {
          blockingReasons.push(msg);
          blockingReasons_bn.push(`দিন ${d.day_number} অনুমোদিত পুষ্টি সীমা লঙ্ঘন: ${r8DayCheck.hard_limit_violations_en.join('; ')}`);
        }
      }
    }
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
      for (const itm of (m.items || [])) {
        if (itm.traffic_status === 'RED') redItemsFound++;
      }
    }
  }
  if (redItemsFound > 0) {
    blockingReasons.push(`Plan contains ${redItemsFound} contraindicated (RED) food item(s). Resolve all RED items prior to release.`);
    blockingReasons_bn.push(`খাদ্যতালিকায় ${redItemsFound}টি নিষিদ্ধ (লাল) খাবার অন্তর্ভুক্ত রয়েছে। মুক্তির পূর্বে অবশ্যই এগুলো অপসারণ করুন।`);
  }

  // Check 9: Sign-Off Metadata Authenticity
  const clinicianName = weeklyDietPlan?.approved_by || weeklyDietPlan?.approval_metadata?.clinician_name;
  if (isApproved && (!clinicianName || clinicianName.trim() === '' || clinicianName === 'Unassigned Clinician' || clinicianName.toLowerCase() === 'doctor')) {
    blockingReasons.push('Approval signature metadata is incomplete or contains placeholder clinician name.');
    blockingReasons_bn.push('অনুমোদনের স্বাক্ষর সংক্রান্ত মেটাডাটা অসম্পূর্ণ বা স্থানধারক চিকিৎসকের নাম রয়েছে।');
  }

  // Check 10: R5 Nutrition Adjustment Contract / Acute Escalation Block
  const effectiveContract = r5NutritionContract || (patient as any)?.r5_nutrition_contract;
  if (effectiveContract?.acute_escalation?.block_release === true) {
    const escMsgEn = effectiveContract.acute_escalation.message_en || 'Acute clinical safety escalation active. Immediate medical intervention required.';
    const escMsgBn = effectiveContract.acute_escalation.message_bn || 'জরুরি ক্লিনিক্যাল ঝুঁকি বিদ্যমান। তাৎক্ষণিক মেডিকেল মূল্যায়ন আবশ্যক।';
    blockingReasons.push(`Acute Clinical Safety Escalation: ${escMsgEn}`);
    blockingReasons_bn.push(`জরুরি ক্লিনিক্যাল ঝুঁকি: ${escMsgBn}`);
  }

  // Check 11: Single Medication Safety Contract (Checkpoint A)
  const effectiveMedications: R5MedicationRecord[] = medications !== undefined
    ? medications
    : ((patient?.medication_records as any) || []);

  if (Array.isArray(effectiveMedications) && effectiveMedications.length > 0) {
    for (const med of effectiveMedications) {
      const assessment = evaluateMedicationSafetyContract(med);
      if (assessment.classification === 'pending_verification' || assessment.classification === 'draft_candidate') {
        const medName = med.brand_name || med.generic_name || (med as any).medication_name || 'Medication';
        blockingReasons.push(`Medication verification required before patient release (${medName}): ${assessment.issues_en.join('; ')}`);
        blockingReasons_bn.push(`ওষুধের তথ্য যাচাইকরণ অসম্পূর্ণ (${medName}): ${assessment.issues_bn.join('; ')}`);
      }
    }
  } else if (
    patient?.active_medications &&
    patient.active_medications.length > 0 &&
    patient.medication_reconciliation_status !== 'fully_reconciled'
  ) {
    blockingReasons.push(`Medication reconciliation incomplete for active medications (${patient.active_medications.join(', ')}). Complete Domain 13 verification before release.`);
    blockingReasons_bn.push(`সক্রিয় ওষুধগুলোর (${patient.active_medications.join(', ')}) ডোমেন ১৩ যাচাইকরণ ও মাত্রা নির্ধারণ সম্পন্ন হয়নি।`);
  }

  // Check 12: Fluid Restriction Quantitative Confirmation Gate (Checkpoint B)
  if (patient && patient.id) {
    const hydrationSafety = evaluateR6HydrationAndFluidSafety(patient, options.r4Protocol, effectiveVisitId);
    if (hydrationSafety.requires_clinician_confirmation) {
      blockingReasons.push('Fluid restriction or fluid-sensitive diagnosis requires an explicit clinician-confirmed quantitative daily fluid limit (mL/day) before patient release.');
      blockingReasons_bn.push('তরল সীমাবদ্ধতা বা তরল-সংবেদনশীল রোগের জন্য চিকিৎসকের নিশ্চিতকৃত দৈনিক সুনির্দিষ্ট তরল সীমা (মি.লি.) আবশ্যক।');
    }
  }

  // Check 13: Strict R4 Protocol & Supplement Authorization Gate (Checkpoint C)
  const standaloneSupplements = options.supplements || [];
  if (options.r4Protocol || standaloneSupplements.length > 0) {
    const r4Auth = validateR4ProtocolAuthorization({
      r4Protocol: options.r4Protocol,
      standaloneSupplements,
      patientId: patient?.id,
      visitId: effectiveVisitId,
      isProtocolDirty: options.isR4ProtocolDirty
    });

    if (!r4Auth.isAuthorized) {
      const hasStandaloneClaimWithoutR4 = !options.r4Protocol && r4Auth.hasClinicianApprovedSupplements;
      const hasActiveOrInvalidatedR4 = Boolean(
        options.r4Protocol && (
          r4Auth.hasClinicianApprovedSupplements ||
          r4Auth.isCrossPatientMismatch ||
          r4Auth.isCrossVisitMismatch ||
          r4Auth.isStaleStatus ||
          r4Auth.isHardStop ||
          r4Auth.isInvalidatedOrMissingProvenance ||
          options.r4Protocol.status === 'active'
        )
      );

      if (hasStandaloneClaimWithoutR4 || hasActiveOrInvalidatedR4) {
        blockingReasons.push(
          r4Auth.reason_en ||
          'R4 supplement/lifestyle protocol requires current clinician sign-off for this patient and visit before release.'
        );
        blockingReasons_bn.push(
          r4Auth.reason_bn ||
          'এই রোগী ও ভিজিটের জন্য R4 সাপ্লিমেন্ট/জীবনযাপন প্রোটোকল চিকিৎসকের অনুমোদন আবশ্যক।'
        );
      }
    }
  }

  // Check 14: R7 Critical Laboratory & Unresolved Lab Reconciliation Gate (Non-bypassable)
  const r7LabSummary: R7LabIntelligenceSummary | undefined = (options as any).r7LabSummary || (
    patient && patient.id
      ? evaluateR7LaboratoryIntelligence({
          patient,
          visitId: effectiveVisitId,
          structuredEntries: (options as any).structuredLabEntries
        })
      : undefined
  );
  if (r7LabSummary?.blocks_patient_release) {
    for (const reason of r7LabSummary.blocking_reasons_en) {
      if (!blockingReasons.includes(reason)) blockingReasons.push(reason);
    }
    for (const reasonBn of r7LabSummary.blocking_reasons_bn) {
      if (!blockingReasons_bn.includes(reasonBn)) blockingReasons_bn.push(reasonBn);
    }
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
  includeAllDays?: boolean;
  activeDayNumber?: number;
  r4Protocol?: R4ProtocolStudioData | null;
  r7LabSummary?: R7LabIntelligenceSummary;
  structuredLabEntries?: Record<string, StructuredLabEntry>;
}): ClinicianReportPayload {
  const { 
    patient, 
    dietChart, 
    weeklyDietPlan, 
    dniResult, 
    trafficLight, 
    p2AnalysisResult, 
    candidateSupplements = [], 
    visit,
    includeAllDays = true,
    activeDayNumber = 1
  } = options;

  const phaseInfo = CLINICAL_PHASES[patient.current_phase || 1];
  const visitId = visit?.visit_id || visit?.id || patient.current_visit_id || 'vis_current';
  const visitDate = visit?.visit_date || patient.visit_date;

  // Build days list for clinician
  const clinicianDays: ClinicianDayPlan[] = [];

  if (weeklyDietPlan?.days && weeklyDietPlan.days.length > 0) {
    const daysToProject = includeAllDays
      ? weeklyDietPlan.days
      : weeklyDietPlan.days.filter(d => d.day_number === activeDayNumber);

    for (const day of daysToProject) {
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
    const targetKcal = patient.calculated?.target_calories ?? null;
    const targetProt = patient.calculated?.target_protein_g ?? null;
    const targetCarbs = patient.calculated?.target_carbs_g ?? null;
    const targetFat = patient.calculated?.target_fat_g ?? null;

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
        calorie_variance: targetKcal !== null ? (dayCal - targetKcal) : 0,
        protein_variance: targetProt !== null ? Math.round((dayProt - targetProt) * 10) / 10 : 0,
        carbs_variance: targetCarbs !== null ? Math.round((dayCarbs - targetCarbs) * 10) / 10 : 0,
        fat_variance: targetFat !== null ? Math.round((dayFat - targetFat) * 10) / 10 : 0
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

  const targetKcal = weeklyDietPlan?.target_macros?.calories ?? patient.calculated?.target_calories ?? null;
  const targetProt = weeklyDietPlan?.target_macros?.protein_g ?? patient.calculated?.target_protein_g ?? null;
  const targetCarbs = weeklyDietPlan?.target_macros?.carbs_g ?? patient.calculated?.target_carbs_g ?? null;
  const targetFat = weeklyDietPlan?.target_macros?.fat_g ?? patient.calculated?.target_fat_g ?? null;

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
    source_type: 'dietary_intake' | 'serum_biomarker';
  }> = {
    calcium: { actual_amount: null, unit: 'mg', status: 'not_available', status_label: 'Not Available in Food Composition Database', source_type: 'dietary_intake' },
    iron: { actual_amount: null, unit: 'mg', status: 'not_available', status_label: 'Not Available in Food Composition Database', source_type: 'dietary_intake' },
    potassium: { actual_amount: null, unit: 'mg', status: 'not_available', status_label: 'Calculated Per Item (FCTB Native Subset)', source_type: 'dietary_intake' },
    sodium: { actual_amount: null, unit: 'mg', status: 'not_available', status_label: 'Not Available in Food Composition Database', source_type: 'dietary_intake' },
    vitamin_d: {
      actual_amount: patient.labs?.vitamin_d3 ?? null,
      unit: 'ng/mL',
      status: patient.labs?.vitamin_d3 ? (patient.labs.vitamin_d3 < 20 ? 'deficient' : patient.labs.vitamin_d3 < 30 ? 'marginal' : 'optimal') : 'not_available',
      status_label: patient.labs?.vitamin_d3 ? `${patient.labs.vitamin_d3} ng/mL (Serum Lab)` : 'Laboratory Measurement Not Recorded',
      source_type: 'serum_biomarker'
    },
    vitamin_b12: {
      actual_amount: patient.labs?.vitamin_b12 ?? null,
      unit: 'pg/mL',
      status: patient.labs?.vitamin_b12 ? (patient.labs.vitamin_b12 < 200 ? 'deficient' : patient.labs.vitamin_b12 < 350 ? 'marginal' : 'optimal') : 'not_available',
      status_label: patient.labs?.vitamin_b12 ? `${patient.labs.vitamin_b12} pg/mL (Serum Lab)` : 'Laboratory Measurement Not Recorded',
      source_type: 'serum_biomarker'
    }
  };

  const serumLaboratoryBiomarkers: Record<string, {
    marker: string;
    value: number | null;
    unit: string;
    status: 'optimal' | 'marginal' | 'deficient' | 'excess' | 'not_available';
    status_label: string;
  }> = {
    vitamin_d3_serum: {
      marker: '25-Hydroxy Vitamin D',
      value: patient.labs?.vitamin_d3 ?? null,
      unit: 'ng/mL',
      status: patient.labs?.vitamin_d3 ? (patient.labs.vitamin_d3 < 20 ? 'deficient' : patient.labs.vitamin_d3 < 30 ? 'marginal' : 'optimal') : 'not_available',
      status_label: patient.labs?.vitamin_d3 ? `${patient.labs.vitamin_d3} ng/mL (Serum 25-OH D)` : 'Not Tested / No Lab Record'
    },
    vitamin_b12_serum: {
      marker: 'Serum Cobalamin (B12)',
      value: patient.labs?.vitamin_b12 ?? null,
      unit: 'pg/mL',
      status: patient.labs?.vitamin_b12 ? (patient.labs.vitamin_b12 < 200 ? 'deficient' : patient.labs.vitamin_b12 < 350 ? 'marginal' : 'optimal') : 'not_available',
      status_label: patient.labs?.vitamin_b12 ? `${patient.labs.vitamin_b12} pg/mL (Serum B12)` : 'Not Tested / No Lab Record'
    }
  };

  const r7LabSummary: R7LabIntelligenceSummary | undefined =
    (options as any).r7LabSummary ||
    evaluateR7LaboratoryIntelligence({
      patient,
      visitId,
      structuredEntries: (options as any).structuredLabEntries
    });

  const activeSupplementsForExposure: SupplementProtocolItem[] =
    (options as any).r4Protocol?.supplements ||
    (Array.isArray(candidateSupplements) ? candidateSupplements : []);
  const r7SupplementExposure =
    activeSupplementsForExposure.length > 0
      ? calculateR7SupplementExposure({
          supplements: activeSupplementsForExposure,
          patient,
          labSummary: r7LabSummary
        })
      : undefined;

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
      bmr_kcal: patient.calculated?.bmr ?? null,
      tdee_kcal: patient.calculated?.tdee ?? null,
      bmr_safe_floor_kcal: patient.calculated?.bmr_safe_calorie_floor ?? null,
      target_calories_kcal: targetKcal,
      planned_calories_kcal: plannedKcal,
      calorie_variance_kcal: targetKcal !== null ? (plannedKcal - targetKcal) : null,
      calorie_achievement_pct: (targetKcal !== null && targetKcal > 0) ? Math.round((plannedKcal / targetKcal) * 100) : null,
      target_protein_g: targetProt,
      planned_protein_g: plannedProt,
      protein_variance_g: targetProt !== null ? Math.round((plannedProt - targetProt) * 10) / 10 : null,
      protein_achievement_pct: (targetProt !== null && targetProt > 0) ? Math.round((plannedProt / targetProt) * 100) : null,
      protein_ratio_pct: proteinRatioPct,
      target_carbs_g: targetCarbs,
      planned_carbs_g: plannedCarbs,
      carbs_variance_g: targetCarbs !== null ? Math.round((plannedCarbs - targetCarbs) * 10) / 10 : null,
      carbs_achievement_pct: (targetCarbs !== null && targetCarbs > 0) ? Math.round((plannedCarbs / targetCarbs) * 100) : null,
      carbs_ratio_pct: carbsRatioPct,
      target_fat_g: targetFat,
      planned_fat_g: plannedFat,
      fat_variance_g: targetFat !== null ? Math.round((plannedFat - targetFat) * 10) / 10 : null,
      fat_achievement_pct: (targetFat !== null && targetFat > 0) ? Math.round((plannedFat / targetFat) * 100) : null,
      fat_ratio_pct: fatRatioPct,
      total_fiber_g: plannedFiber,
      glycemic_load: plannedGl,
      glycemic_load_is_estimated: firstDay?.summary.gl_is_estimated ?? true,
      pral_score: plannedPral
    },
    micronutrient_sufficiency: micronutrientSufficiency,
    serum_laboratory_biomarkers: serumLaboratoryBiomarkers,
    days: clinicianDays,
    drug_nutrient_interactions: {
      timeline: dniResult?.timeline || [],
      critical_warnings: dniResult?.criticalWarnings || [],
      depletions: dniResult?.depletions || []
    },
    supplement_considerations: candidateSupplements || [],
    r7_lab_intelligence: r7LabSummary,
    r7_supplement_exposure: r7SupplementExposure,
    clinical_disclaimers: {
      en: 'CONFIDENTIAL CLINICAL NUTRITION DOSSIER. For licensed healthcare provider analysis only. Contains raw biochemical, Atwater, and drug-nutrient interaction calculations.',
      bn: 'গোপনীয় ক্লিনিক্যাল নিউট্রিশন ডসিয়ার। শুধুমাত্র লাইসেন্সধারী স্বাস্থ্যসেবা প্রদানকারীর মূল্যায়নের জন্য। এতে বায়োকেমিক্যাল হিসাব, অ্যাটওয়াটার রেশিও এবং ড্রাগ-নিউট্রিয়েন্ট ইন্টারঅ্যাকশন সংক্রান্ত তথ্য রয়েছে।'
    }
  };
}

// ── 4b. 7-FOOD-GROUP TRAFFIC LIGHT CLASSIFICATION ENGINE ─────────

export function mapFoodToSevenFoodGroup(food: FoodItem): SevenFoodGroupCategory | 'unclassified' {
  const cat = (food.category || '').toLowerCase().trim();
  const exchange = ((food as any).exchange_group || '').toLowerCase().trim();
  const nameEn = (food.name_en || '').toLowerCase();
  const nameBn = food.name_bn || '';
  const tags = (food.tags || []).map(t => t.toLowerCase());
  const text = `${cat} ${exchange} ${nameEn} ${nameBn} ${tags.join(' ')}`.toLowerCase();

  // 1. Direct Category & Exchange Matching from Authoritative Food Database (P1-004)
  if (cat === 'grain') return 'grains_carbs';
  if (cat === 'protein') return 'proteins';
  if (cat === 'fruit') return 'fruits';
  if (cat === 'dairy') return 'dairy_probiotics';
  if (cat === 'seed_nut' || cat === 'fat_oil') return 'fats_oils';
  if (cat === 'spice_herb' || cat === 'beverage') return 'spices_beverages';
  if (cat === 'vegetable') return 'vegetables';

  // Check structured exchange group next
  if (exchange === 'grain') return 'grains_carbs';
  if (exchange === 'lean_protein' || exchange === 'fatty_protein' || exchange === 'protein' || exchange === 'pulse') return 'proteins';
  if (exchange === 'fruit') return 'fruits';
  if (exchange === 'seed_nut' || exchange === 'fat') return 'fats_oils';
  if (exchange === 'dairy') return 'dairy_probiotics';
  if (exchange === 'vegetable') return 'vegetables';

  // 2. Secondary Semantic / Taxonomic Fallbacks (for external or dynamic food items)
  if (
    cat.includes('cereal') || cat.includes('grain') || 
    text.includes('rice') || text.includes('wheat') || text.includes('roti') || text.includes('ruti') || 
    text.includes('oats') || text.includes('barley') || text.includes('ভাত') || text.includes('রুটি') || 
    text.includes('আটা') || text.includes('গম') || text.includes('সুজি') || text.includes('চিঁড়া') || text.includes('মুড়ি')
  ) {
    return 'grains_carbs';
  }
  if (
    cat.includes('fish') || cat.includes('meat') || cat.includes('egg') || cat.includes('poultry') || 
    cat.includes('legume') || cat.includes('pulse') || text.includes('fish') || text.includes('egg') || 
    text.includes('chicken') || text.includes('beef') || text.includes('dal') || text.includes('lentil') || 
    text.includes('মাছ') || text.includes('ডিম') || text.includes('মাংস') || text.includes('ডাল') || text.includes('মুরগি')
  ) {
    return 'proteins';
  }
  if (
    cat.includes('fruit') || text.includes('fruit') || text.includes('ফল') || 
    text.includes('আপেল') || text.includes('কলা') || text.includes('পেয়ারা') || text.includes('আম') || text.includes('কমলা')
  ) {
    return 'fruits';
  }
  if (
    cat.includes('dairy') || text.includes('milk') || text.includes('yogurt') || text.includes('curd') || 
    text.includes('paneer') || text.includes('দুধ') || text.includes('দই') || text.includes('ছানা') || text.includes('পনির')
  ) {
    return 'dairy_probiotics';
  }
  if (
    cat.includes('oil') || cat.includes('fat') || cat.includes('nut') || cat.includes('seed') || 
    text.includes('oil') || text.includes('ghee') || text.includes('seed') || text.includes('nut') || 
    text.includes('তেল') || text.includes('ঘি') || text.includes('বাদাম') || text.includes('বীজ') || text.includes('চিয়া')
  ) {
    return 'fats_oils';
  }
  if (
    cat.includes('spice') || cat.includes('beverage') || text.includes('tea') || text.includes('water') || 
    text.includes('coffee') || text.includes('turmeric') || text.includes('ginger') || text.includes('garlic') || 
    text.includes('মশলা') || text.includes('পানীয়') || text.includes('চা') || text.includes('হলুদ') || text.includes('আদা') || text.includes('রসুন')
  ) {
    return 'spices_beverages';
  }
  if (
    cat.includes('veg') || text.includes('spinach') || text.includes('leaf') || text.includes('shak') || 
    text.includes('শাক') || text.includes('সবজি') || text.includes('পটল') || text.includes('লাউ')
  ) {
    return 'vegetables';
  }

  // 3. P1-003: For food records without a reliable category: mark as UNCLASSIFIED.
  // Never silently assign an incorrect group (e.g. Vegetables or Spices).
  // Preserves original food ID for data quality review queue.
  return 'unclassified';
}

export function buildStructuredTrafficLightGuide(trafficLight: any): StructuredTrafficLightGuide {
  const groupsDefinition: { id: SevenFoodGroupCategory; title_bn: string; title_en: string }[] = [
    { id: 'grains_carbs', title_bn: '১. শস্য ও কার্বোহাইড্রেট', title_en: '1. Grains & Carbohydrates' },
    { id: 'proteins', title_bn: '২. প্রোটিন (মাছ, মাংস, ডিম ও ডাল)', title_en: '2. Protein (Fish, Meat, Eggs, Legumes)' },
    { id: 'vegetables', title_bn: '৩. শাকসবজি', title_en: '3. Vegetables & Greens' },
    { id: 'fruits', title_bn: '৪. ফলমূল', title_en: '4. Fruits' },
    { id: 'fats_oils', title_bn: '৫. ফ্যাট ও তেল (স্বাস্থ্যকর তেল ও বীজ)', title_en: '5. Healthy Fats, Seeds & Oils' },
    { id: 'dairy_probiotics', title_bn: '৬. দুগ্ধজাত ও প্রোবায়োটিক', title_en: '6. Dairy & Probiotics' },
    { id: 'spices_beverages', title_bn: '৭. মশলা ও পানীয়', title_en: '7. Spices, Herbs & Beverages' }
  ];

  const mapToEntry = (f: FoodItem): FoodGuideEntry => ({
    food_id: f.id,
    name_bn: f.name_bn,
    name_en: f.name_en,
    household_measure_bn: (f as any).household_measure_bn || (f as any).default_household_measure_bn,
    household_measure_en: (f as any).household_measure_en || (f as any).default_household_measure_en,
    guidance_bn: (f as any).reasons?.[0]?.note_bn,
    guidance_en: (f as any).reasons?.[0]?.note_en
  });

  const unclassifiedQueue: FoodGuideEntry[] = [];
  const allTrafficFoods = [
    ...(trafficLight?.green || []),
    ...(trafficLight?.yellow || []),
    ...(trafficLight?.red || [])
  ];
  for (const f of allTrafficFoods) {
    if (mapFoodToSevenFoodGroup(f) === 'unclassified') {
      unclassifiedQueue.push(mapToEntry(f));
    }
  }

  const sections: SevenFoodGroupSection[] = groupsDefinition.map(g => {
    const green = (trafficLight?.green || []).filter((f: FoodItem) => mapFoodToSevenFoodGroup(f) === g.id).map(mapToEntry);
    const yellow = (trafficLight?.yellow || []).filter((f: FoodItem) => mapFoodToSevenFoodGroup(f) === g.id).map(mapToEntry);
    const red = (trafficLight?.red || []).filter((f: FoodItem) => mapFoodToSevenFoodGroup(f) === g.id).map(mapToEntry);
    return {
      group_id: g.id,
      title_bn: g.title_bn,
      title_en: g.title_en,
      green,
      yellow,
      red
    };
  });

  return {
    groups: sections,
    total_green: trafficLight?.green?.length || 0,
    total_yellow: trafficLight?.yellow?.length || 0,
    total_red: trafficLight?.red?.length || 0,
    unclassified_queue: unclassifiedQueue.length > 0 ? unclassifiedQueue : undefined,
    generated_at: new Date().toISOString()
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
  safetyEvaluation?: any;
  isDietPlanDirty?: boolean;
  releaseEligibility?: ReleaseEligibilityResult;
  r5NutritionContract?: any;
  medications?: R5MedicationRecord[];
  r4Protocol?: R4ProtocolStudioData | null;
  supplements?: any[];
  candidateSupplements?: any[];
}): PatientReportPayload {
  const { 
    patient, 
    dietChart, 
    weeklyDietPlan, 
    dniResult, 
    trafficLight, 
    visit,
    activeDayNumber = 1,
    includeAllDays = true,
    safetyEvaluation,
    isDietPlanDirty,
    releaseEligibility: explicitEligibility,
    r5NutritionContract,
    medications,
    r4Protocol,
    supplements = [],
    candidateSupplements = []
  } = options;

  const phaseInfo = CLINICAL_PHASES[patient.current_phase || 1];
  const visitId = visit?.visit_id || visit?.id || patient.current_visit_id || 'vis_current';
  const visitDate = visit?.visit_date || patient.visit_date;

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

    const isFastingActiveAndApproved = Boolean(
      fasting?.is_fasting &&
      fasting.is_fasting_active !== false &&
      (fasting.decision_status === 'fasting_approved' || weeklyDietPlan?.is_approved)
    );

    if (isFastingActiveAndApproved && fasting?.eating_window_start && fasting?.eating_window_end) {
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
          food_name_bn: item.recipe_reference?.name_bn
            ? `${item.recipe_reference.name_bn} (অনুমোদিত রেসিপি · ${item.recipe_reference.prescribed_servings} পরিবেশন)`
            : item.food_name_bn,
          food_name_en: item.recipe_reference?.name_en
            ? `${item.recipe_reference.name_en} (Authorized Recipe · ${item.recipe_reference.prescribed_servings} serving(s))`
            : item.food_name_en,
          raw_serving_weight_g: item.raw_weight_g,
          household_portion_bn: item.cooked_display_bn,
          household_portion_en: item.cooked_display_en,
          preparation_note_bn: item.prep_note_bn || 'স্বাভাবিক পদ্ধতিতে রান্না',
          preparation_note_en: item.prep_note_en || 'Standard preparation',
          approved_substitutes: filterAuthorizedPatientAlternatives({
            alternatives: item.alternatives,
            plan: weeklyDietPlan,
            patient,
            visitId,
            trafficLight,
            r5NutritionContract
          }).slice(0, 3).map(alt => ({
            name_bn: alt.name_bn,
            name_en: alt.name_en,
            portion_bn: alt.cooked_display_bn,
            portion_en: alt.cooked_display_en
          }))
        }))
      }))
    });
  }

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

  // Traffic light food lists for patient (untruncated complete lists)
  const greenBn = (trafficLight?.green || []).map((f: FoodItem) => f.name_bn);
  const greenEn = (trafficLight?.green || []).map((f: FoodItem) => f.name_en);
  const yellowBn = (trafficLight?.yellow || []).map((f: FoodItem) => f.name_bn);
  const yellowEn = (trafficLight?.yellow || []).map((f: FoodItem) => f.name_en);
  const redBn = (trafficLight?.red || []).map((f: FoodItem) => f.name_bn);
  const redEn = (trafficLight?.red || []).map((f: FoodItem) => f.name_en);

  // 7-Food-Group Structured Traffic Light Guide
  const sevenFoodGroupGuide = buildStructuredTrafficLightGuide(trafficLight);

  const isApproved = Boolean(weeklyDietPlan && weeklyDietPlan.status === 'approved' && weeklyDietPlan.is_approved === true);
  const clinicianName = weeklyDietPlan?.approved_by || weeklyDietPlan?.approval_metadata?.clinician_name || 'Unassigned Clinician';

  const medRecords = medications !== undefined
    ? medications
    : ((patient.medication_records as any) || []);

  // Module 5 & R6 Master Prescription Composition (Authoritative Pipeline)
  const masterPrescription = composeR6Prescription({
    patient,
    weeklyDietPlan,
    dietChart,
    medications: medRecords,
    r4Protocol,
    supplements,
    candidateSupplements,
    trafficLight,
    visit,
    safetyEvaluation,
    r5NutritionContract,
    isDietPlanDirty
  });

  // Authoritative fail-closed release decision: never let stale explicitEligibility override masterPrescription blocks
  const mergedBlockingEn = Array.from(new Set([
    ...masterPrescription.release_eligibility.blocking_reasons_en,
    ...(explicitEligibility?.blockingReasons || [])
  ]));
  const mergedBlockingBn = Array.from(new Set([
    ...masterPrescription.release_eligibility.blocking_reasons_bn,
    ...(explicitEligibility?.blockingReasons_bn || [])
  ]));
  const isReleasedAuthoritative =
    masterPrescription.is_released &&
    (explicitEligibility ? explicitEligibility.isEligible : true) &&
    mergedBlockingEn.length === 0;

  return {
    report_type: 'PATIENT_LIFESTYLE_PRESCRIPTION',
    schema_version: 1,
    generated_at: new Date().toISOString(),
    is_approved: isApproved,
    approval_status: weeklyDietPlan?.status || 'draft',
    plan_version: weeklyDietPlan?.version || 1,
    is_released: isReleasedAuthoritative,
    release_eligibility: {
      is_eligible: isReleasedAuthoritative,
      blocking_reasons_en: mergedBlockingEn,
      blocking_reasons_bn: mergedBlockingBn
    },
    clinic_letterhead: {
      clinic_name_bn: 'শুদ্ধ ক্লিনিক্যাল ফাংশনাল নিউট্রিশন সেন্টার',
      clinic_name_en: 'SHUDDHO CLINICAL FUNCTIONAL NUTRITION',
      clinic_tagline_bn: 'সেন্টার ফর মেটাবলিক রিবুট ও প্রিসিশন লাইফস্টাইল মেডিসিন',
      clinic_tagline_en: 'Center for Metabolic Reboot & Precision Lifestyle Medicine',
      contact_phone: undefined,
      clinic_address: undefined
    },
    nutritionist_signoff: {
      clinician_name: clinicianName,
      license_title_bn: weeklyDietPlan?.approval_metadata?.license_number ? 'ক্লিনিক্যাল ফাংশনাল নিউট্রিশনিস্ট' : undefined,
      license_title_en: weeklyDietPlan?.approval_metadata?.license_number ? 'Lead Clinical Functional Nutritionist' : undefined,
      approval_date: weeklyDietPlan?.approved_at?.split('T')[0] || weeklyDietPlan?.approval_date?.split('T')[0],
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
      confirmed_allergies_to_avoid_bn: masterPrescription.safety_directives.allergies_to_avoid_bn,
      confirmed_allergies_to_avoid_en: masterPrescription.safety_directives.allergies_to_avoid_en,
      clinician_food_exclusions_bn: masterPrescription.safety_directives.clinical_food_exclusions_bn,
      clinician_food_exclusions_en: masterPrescription.safety_directives.clinical_food_exclusions_en,
      hydration_guidelines_bn: masterPrescription.lifestyle_support.hydration.instructions_bn,
      hydration_guidelines_en: masterPrescription.lifestyle_support.hydration.instructions_en,
      fluid_restriction_active: masterPrescription.safety_directives.fluid_restriction_active,
      fluid_limit_ml: masterPrescription.safety_directives.fluid_limit_ml,
      cooking_oil_rules_bn: masterPrescription.safety_directives.cooking_oil_rules_bn || 'ব্যক্তিগতভাবে নির্ধারিত নয়',
      cooking_oil_rules_en: masterPrescription.safety_directives.cooking_oil_rules_en || 'Not individually prescribed',
      salt_guidelines_bn: masterPrescription.safety_directives.salt_rules_bn || 'ব্যক্তিগতভাবে নির্ধারিত নয়',
      salt_guidelines_en: masterPrescription.safety_directives.salt_rules_en || 'Not individually prescribed'
    },
    traffic_light_guide: {
      green_foods_bn: greenBn,
      green_foods_en: greenEn,
      yellow_foods_bn: yellowBn,
      yellow_foods_en: yellowEn,
      red_foods_bn: redBn,
      red_foods_en: redEn
    },
    seven_food_group_guide: masterPrescription.seven_food_group_guide,
    chronological_schedule: patientSchedule,
    days: patientDays,
    medication_supplement_protocol: masterPrescription.medication_supplement_protocol,
    food_exchange_guide: masterPrescription.food_exchange_guide,
    patient_specific_exchanges: masterPrescription.patient_specific_exchanges,
    fasting_evaluation: masterPrescription.fasting_evaluation,
    lifestyle_support: masterPrescription.lifestyle_support,
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
  'atwater_fat_grams',
  'clinical_notes',
  'clinician_notes',
  'approval_notes',
  'internal_hypotheses',
  'internal_clinical_hypotheses',
  'private_observations'
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
    '"glycemic_load"',
    '"clinical_notes"',
    '"clinician_notes"',
    '"approval_notes"',
    '"internal_hypotheses"',
    '"private_observations"'
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
