/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION PLATFORM
 * PHASE R8-E: INTELLIGENT FOOD SUBSTITUTION & IMPACT SIMULATION ENGINE (U11)
 *
 * Replaces naive `.slice(0, 4)`, arbitrary 100g fallback, and `?? 0` handling with:
 * - Full-pool clinical filtering & ranking BEFORE slicing
 * - Explicit mode-aware portion scaling (no divide-by-zero, practical portion bounds)
 * - Near-zero absolute tolerance handling
 * - Honest `no_suitable_equivalent` when no safe/practical equivalent exists
 * - Full meal & daily nutrient impact preview + constraint violation detection
 */

import { FoodExchangeItem, FoodItem, PatientProfile, WeeklyDietPlan } from '../../types';
import { R5NutritionAdjustmentContract } from '../../types/r5Systems';
import { R7LabIntelligenceSummary } from '../../types/r7Laboratory';
import {
  R8ComputedNutrientSubtotal,
  R8ConstraintComplianceStatus,
  R8ConstraintEvaluationResult,
  R8MealAndDailyImpact,
  R8NutrientDelta,
  R8SubstitutionCandidateResult,
  R8SubstitutionMatchStatus,
  R8SubstitutionMode,
  R8SubstitutionRequest,
  R8SubstitutionResponse,
} from '../../types/r8FoodKnowledge';
import { buildR5NutritionAdjustmentContract } from '../r5NutritionContract';
import {
  aggregateFoodNutrients,
  aggregateMealItemsNutrients,
  extractFoodNutrientMeasurement,
  R8_BASELINE_FOODS,
  R8_CANONICAL_NUTRIENTS,
  R8ResolvableMealItem,
  resolveR8NutrientId,
} from './foodFoundation';
import { evaluatePatientFoodEligibility } from './knowledgeNetwork';

export const R8_DEFAULT_MATCH_TOLERANCE_PCT = 15;

function formatCookedPortionDisplay(food: FoodItem, rawGrams: number, cookedGrams: number): { bn: string; en: string } {
  const n = `${food.name_en} ${food.name_bn}`.toLowerCase();
  if (n.includes('rice') || n.includes('চাল') || n.includes('ভাত')) {
    const katori = Math.round((cookedGrams / 140) * 10) / 10;
    return {
      bn: `${Math.round(cookedGrams)} গ্রাম রান্না করা (প্রায় ${katori} মাঝারি বাটি / কাপ)`,
      en: `${Math.round(cookedGrams)}g cooked (~${katori} medium bowl/cup)`,
    };
  }
  if (n.includes('ruti') || n.includes('roti') || n.includes('রুটি') || n.includes('atta') || n.includes('আটা')) {
    const pieces = Math.max(1, Math.round(rawGrams / 35));
    return {
      bn: `${pieces}টি মাঝারি রুটি (~${Math.round(rawGrams)} গ্রাম কাঁচা আটা)`,
      en: `${pieces} medium ruti (~${Math.round(rawGrams)}g raw flour)`,
    };
  }
  if (n.includes('dal') || n.includes('lentil') || n.includes('gram') || n.includes('ডাল') || n.includes('ছোলা')) {
    const bati = Math.round((cookedGrams / 150) * 10) / 10;
    return {
      bn: `${Math.round(cookedGrams)} গ্রাম রান্না করা (প্রায় ${bati} বাটি)`,
      en: `${Math.round(cookedGrams)}g cooked (~${bati} bowl)`,
    };
  }
  if (n.includes('egg') || n.includes('ডিম')) {
    const pcs = Math.max(1, Math.round(rawGrams / 50));
    return {
      bn: `${pcs}টি ডিম (~${Math.round(rawGrams)} গ্রাম)`,
      en: `${pcs} egg(s) (~${Math.round(rawGrams)}g)`,
    };
  }
  return {
    bn: `${Math.round(cookedGrams)} গ্রাম রান্না / পরিবেশন (${Math.round(rawGrams)} গ্রাম কাঁচা)`,
    en: `${Math.round(cookedGrams)}g cooked/edible (${Math.round(rawGrams)}g raw)`,
  };
}

const CORE_COMPARISON_NUTRIENTS = [
  'energy',
  'protein',
  'available_carbohydrate',
  'total_fat',
  'dietary_fiber',
  'potassium',
  'sodium',
  'phosphorus',
  'iron',
  'calcium',
  'magnesium',
];

function getPracticalPortionBounds(food: FoodItem): { minG: number; maxG: number } {
  const cat = `${food.category} ${food.exchange_group || ''}`.toLowerCase();
  if (cat.includes('oil') || cat.includes('fat') || cat.includes('spice') || cat.includes('herb')) {
    return { minG: 2, maxG: 45 };
  }
  if (cat.includes('nut') || cat.includes('seed')) {
    return { minG: 5, maxG: 80 };
  }
  if (cat.includes('grain') || cat.includes('cereal') || cat.includes('pulse') || cat.includes('legume')) {
    return { minG: 15, maxG: 250 };
  }
  if (cat.includes('fish') || cat.includes('meat') || cat.includes('egg')) {
    return { minG: 25, maxG: 300 };
  }
  if (cat.includes('vegetable') || cat.includes('fruit') || cat.includes('dairy') || cat.includes('milk')) {
    return { minG: 30, maxG: 450 };
  }
  return { minG: 10, maxG: 400 };
}

function areGroupsCompatible(orig: FoodItem, cand: FoodItem, mode: R8SubstitutionMode): boolean {
  if (mode === 'manual_clinician_review' || mode === 'nutrient_targeted') return true;
  const origEx = (orig.exchange_group || '').toLowerCase();
  const candEx = (cand.exchange_group || '').toLowerCase();
  if (origEx && candEx && origEx === candEx) return true;
  const origCat = (orig.category || '').toLowerCase();
  const candCat = (cand.category || '').toLowerCase();
  if (origCat === candCat) return true;
  // Allow legume <-> fish/egg/meat/dairy protein swaps in protein_matched or clinical_restriction_aware
  const proteinCats = ['legume', 'pulse', 'fish', 'meat', 'egg', 'poultry', 'protein'];
  const origIsProt = proteinCats.some(p => origEx.includes(p) || origCat.includes(p));
  const candIsProt = proteinCats.some(p => candEx.includes(p) || candCat.includes(p));
  if ((mode === 'protein_matched' || mode === 'clinical_restriction_aware') && origIsProt && candIsProt) {
    return true;
  }
  return false;
}

function checkDietaryPreferenceExclusion(food: FoodItem, patient: Partial<PatientProfile>): string | null {
  const dp = patient.dietary_preferences;
  const cat = `${food.category} ${food.name_en}`.toLowerCase();
  if (dp?.is_vegetarian) {
    if (/fish|meat|chicken|beef|mutton|prawn|shrimp|rohu|hilsa|mola|egg/.test(cat)) {
      return 'Excluded by vegetarian dietary preference.';
    }
  }
  if (dp?.avoid_beef && /beef/.test(cat)) {
    return 'Excluded by avoid_beef dietary preference.';
  }
  if (dp?.avoid_mutton && /mutton/.test(cat)) {
    return 'Excluded by avoid_mutton dietary preference.';
  }
  if (/pork|ham|bacon|alcohol|wine|beer/.test(cat)) {
    return 'Excluded by cultural/Halal clinical safety rule.';
  }
  const disallowed = Array.isArray(patient.clinician_disallowed_foods)
    ? patient.clinician_disallowed_foods
    : [];
  for (const d of disallowed) {
    const dl = String(d).trim().toLowerCase();
    if (dl && (food.id.toLowerCase() === dl || food.name_en.toLowerCase().includes(dl) || food.name_bn.includes(dl))) {
      return `Excluded by clinician_disallowed_foods: "${d}".`;
    }
  }
  return null;
}

function getPrimaryScalingNutrient(mode: R8SubstitutionMode, targetNutrientId?: string): string {
  switch (mode) {
    case 'carb_matched':
      return 'available_carbohydrate';
    case 'protein_matched':
      return 'protein';
    case 'nutrient_targeted':
      return targetNutrientId ? resolveR8NutrientId(targetNutrientId) : 'energy';
    case 'energy_matched':
    case 'multinutrient_balanced':
    case 'clinical_restriction_aware':
    case 'manual_clinician_review':
    default:
      return 'energy';
  }
}

export interface AuthorizedPlanValidation {
  isPlanAuthorized: boolean;
  reason?: string;
}

/**
 * Validates whether a WeeklyDietPlan holds valid current clinician authorization
 * for the active patient, visit, and plan version (Checkpoint F1).
 */
export function isWeeklyPlanCurrentlyAuthorized(
  plan: WeeklyDietPlan | null | undefined,
  patient: Partial<PatientProfile>,
  visitId?: string
): AuthorizedPlanValidation {
  if (!plan || !('status' in plan)) {
    return { isPlanAuthorized: false, reason: 'No approved WeeklyDietPlan instance present.' };
  }
  if (plan.status !== 'approved' || plan.is_approved !== true) {
    return { isPlanAuthorized: false, reason: `Plan status is "${plan.status}" (is_approved=${Boolean(plan.is_approved)}).` };
  }
  if (!patient.id || plan.patient_id !== patient.id) {
    return { isPlanAuthorized: false, reason: 'Plan patient_id does not match active patient.' };
  }
  const effectiveVisitId = visitId || patient.current_visit_id || plan.visit_id;
  if (plan.visit_id && effectiveVisitId && plan.visit_id !== effectiveVisitId) {
    return { isPlanAuthorized: false, reason: 'Plan visit_id does not match active visit.' };
  }
  if (plan.approval_metadata?.plan_version !== undefined && plan.approval_metadata.plan_version !== plan.version) {
    return { isPlanAuthorized: false, reason: 'Plan approval_metadata.plan_version is stale.' };
  }
  return { isPlanAuthorized: true };
}

/**
 * Single authoritative authorization filter for patient-facing Food Alternatives (Checkpoint F3 & F5).
 * Enforced across: Food Exchange Guide, R6 Master Prescription meal alternatives,
 * Dual Report patient meal substitutes, patient preview, and Chromium A4 PDF export.
 */
export function filterAuthorizedPatientAlternatives(options: {
  alternatives: FoodExchangeItem[] | undefined | null;
  plan?: WeeklyDietPlan | null;
  patient: Partial<PatientProfile>;
  visitId?: string;
  trafficLight?: {
    green?: Array<{ id: string }>;
    yellow?: Array<{ id: string; reasons?: any[] }>;
    red?: Array<{ id: string; reasons?: any[] }>;
  };
  r5NutritionContract?: R5NutritionAdjustmentContract;
  foodPool?: FoodItem[];
}): FoodExchangeItem[] {
  const { alternatives, plan, patient, visitId, trafficLight, r5NutritionContract, foodPool } = options;
  if (!Array.isArray(alternatives) || alternatives.length === 0) return [];

  const planAuth = isWeeklyPlanCurrentlyAuthorized(plan, patient, visitId);
  if (!planAuth.isPlanAuthorized || !plan) {
    return [];
  }

  const foods = foodPool || R8_BASELINE_FOODS;
  const foodMap = new Map(foods.map(f => [f.id, f]));
  const effectiveVisitId = visitId || patient.current_visit_id || plan.visit_id;
  const redFoodIds = new Set((trafficLight?.red || []).map(r => r.id));
  const confirmedAllergies = new Set((patient.confirmed_allergies || []).map(a => a.toLowerCase()));
  const disallowed = new Set((patient.clinician_disallowed_foods || []).map(d => d.toLowerCase()));
  const activeHardLimits = Boolean(
    r5NutritionContract?.nutrient_constraints?.potassium_mg_max ||
      r5NutritionContract?.nutrient_constraints?.sodium_mg_max ||
      r5NutritionContract?.nutrient_constraints?.phosphorus_mg_max
  );

  return alternatives.filter(alt => {
    if (!alt || !alt.food_id) return false;
    // Never implicitly promote absent/draft/invalidated authorization metadata
    if (alt.authorization_status !== 'authorized') return false;
    if (!alt.authorized_for_patient_id || alt.authorized_for_patient_id !== patient.id) return false;
    if (alt.authorized_for_visit_id && effectiveVisitId && alt.authorized_for_visit_id !== effectiveVisitId) return false;
    if (alt.authorized_for_plan_version !== undefined && alt.authorized_for_plan_version !== plan.version) return false;
    if (alt.match_status === 'clinically_contraindicated') return false;
    if ((alt.traffic_status as string) === 'RED' || (alt.traffic_status as string) === 'UNCLASSIFIED') return false;
    if (redFoodIds.has(alt.food_id)) return false;
    if (alt.requires_clinician_review && !alt.clinician_review_confirmed) return false;
    if (activeHardLimits && alt.is_nutrient_incomplete) return false;

    const altFood = foodMap.get(alt.food_id);
    if (!altFood) return false;

    const prefExclusion = checkDietaryPreferenceExclusion(altFood, patient);
    if (prefExclusion) return false;

    const altNameLower = (altFood.name_en || '').toLowerCase();
    const altNameBn = (altFood.name_bn || '').toLowerCase();
    if ([...confirmedAllergies].some(a => altNameLower.includes(a) || altNameBn.includes(a) || altFood.id.toLowerCase() === a)) return false;
    if ([...disallowed].some(d => altNameLower.includes(d) || altFood.id.toLowerCase() === d || altNameBn.includes(d))) return false;

    const elig = evaluatePatientFoodEligibility(altFood, patient, { trafficLight, r5NutritionContract });
    if (!elig.is_safe_for_patient) return false;

    return true;
  });
}

export interface DailyConstraintEvalResult {
  daily_totals: Record<string, R8ComputedNutrientSubtotal>;
  constraint_evaluations: R8ConstraintEvaluationResult[];
  hard_limit_violations_en: string[];
  indeterminate_reasons_en: string[];
  review_advisories_en: string[];
  compliance_status: R8ConstraintComplianceStatus;
  acute_release_blocked: boolean;
  requires_safety_review: boolean;
}

/**
 * Single authoritative daily nutrient constraint evaluator shared by Preview, Mutation,
 * Recipe Inclusion, Weekly Plan Safety, Approval, and R6 Release Gate (Checkpoint G1 & H2).
 */
export function evaluateDailyPlanConstraints(options: {
  daily_items: R8ResolvableMealItem[];
  baseline_daily_totals?: Record<string, R8ComputedNutrientSubtotal>;
  patient: Partial<PatientProfile>;
  r5_nutrition_contract?: R5NutritionAdjustmentContract;
  r7_lab_summary?: R7LabIntelligenceSummary;
  foodPool?: FoodItem[];
}): DailyConstraintEvalResult {
  const pool = options.foodPool || R8_BASELINE_FOODS;
  const daily_totals = aggregateMealItemsNutrients(options.daily_items, CORE_COMPARISON_NUTRIENTS, pool);

  const r5Contract =
    options.r5_nutrition_contract ||
    buildR5NutritionAdjustmentContract({ patient: options.patient as PatientProfile });

  const evaluations: R8ConstraintEvaluationResult[] = [];
  const hardLimitViolations: string[] = [];
  const indeterminateReasons: string[] = [];
  const reviewAdvisories: string[] = [];

  const acuteBlocked = Boolean(
    r5Contract.acute_escalation?.block_release || options.r7_lab_summary?.blocks_patient_release
  );
  if (acuteBlocked) {
    const msg =
      r5Contract.acute_escalation?.message_en ||
      options.r7_lab_summary?.blocking_reasons_en?.join(' | ') ||
      'Critical R7/R5 laboratory safety gate blocks release pending urgent clinician review.';
    hardLimitViolations.push(msg);
    evaluations.push({
      parameter: 'acute_lab_safety',
      category: 'unresolved_safety_restriction',
      is_incomplete: false,
      missing_food_ids: [],
      status: 'blocked_unresolved_safety',
      message_en: msg,
    });
  }

  const evaluateAuthorizedUpperLimit = (
    paramKey: string,
    label: string,
    limit: number | undefined,
    unit: string
  ) => {
    if (limit === undefined || !Number.isFinite(limit) || limit <= 0) return;
    const origSub = options.baseline_daily_totals?.[paramKey];
    const propSub = daily_totals[paramKey];
    const baselineVal = origSub?.known_total ?? propSub?.known_total ?? 0;
    const proposedVal = propSub?.known_total ?? 0;
    const isIncomplete = Boolean(propSub?.is_incomplete);
    const missingIds = propSub?.missing_food_ids || [];

    if (proposedVal > limit) {
      let status: R8ConstraintComplianceStatus = 'non_compliant_unchanged';
      if (options.baseline_daily_totals) {
        if (baselineVal <= limit) status = 'non_compliant_worsened';
        else if (proposedVal > baselineVal) status = 'non_compliant_worsened';
        else if (proposedVal < baselineVal) status = 'non_compliant_improved';
      } else {
        status = 'non_compliant_worsened';
      }

      const msg = `${label} exceeds clinician-authorized hard limit (${Math.round(proposedVal * 10) / 10} ${unit} > ${limit} ${unit}${
        options.baseline_daily_totals ? `; baseline ${Math.round(baselineVal * 10) / 10} ${unit}` : ''
      })${status === 'non_compliant_improved' ? ' — improved vs baseline but STILL NON-COMPLIANT' : ''}.`;
      hardLimitViolations.push(msg);
      evaluations.push({
        parameter: paramKey,
        category: 'clinician_authorized_hard_limit',
        limit_value: limit,
        unit,
        baseline_value: baselineVal,
        proposed_value: proposedVal,
        is_incomplete: isIncomplete,
        missing_food_ids: missingIds,
        status,
        message_en: msg,
      });
    } else if (isIncomplete) {
      const msg = `${label} compliance is indeterminate: known subtotal (${Math.round(proposedVal * 10) / 10} ${unit}) is <= ${limit} ${unit}, but ${missingIds.length} item(s) lack ${label} data.`;
      indeterminateReasons.push(msg);
      evaluations.push({
        parameter: paramKey,
        category: 'clinician_authorized_hard_limit',
        limit_value: limit,
        unit,
        baseline_value: baselineVal,
        proposed_value: proposedVal,
        is_incomplete: true,
        missing_food_ids: missingIds,
        status: 'indeterminate_incomplete_data',
        message_en: msg,
      });
    } else {
      evaluations.push({
        parameter: paramKey,
        category: 'clinician_authorized_hard_limit',
        limit_value: limit,
        unit,
        baseline_value: baselineVal,
        proposed_value: proposedVal,
        is_incomplete: false,
        missing_food_ids: [],
        status: 'compliant',
        message_en: `${label} (${Math.round(proposedVal * 10) / 10} ${unit}) within clinician-authorized limit (${limit} ${unit}).`,
      });
    }
  };

  evaluateAuthorizedUpperLimit('potassium', 'Potassium', r5Contract.nutrient_constraints.potassium_mg_max, 'mg');
  evaluateAuthorizedUpperLimit('sodium', 'Sodium', r5Contract.nutrient_constraints.sodium_mg_max, 'mg');
  evaluateAuthorizedUpperLimit('phosphorus', 'Phosphorus', r5Contract.nutrient_constraints.phosphorus_mg_max, 'mg');

  // Checkpoint G4/G15: Distinguish general protein target (range/candidate) vs explicit clinician protein ceiling!
  const proteinPresc = (options.patient as any).prescriptions?.protein;
  if (proteinPresc?.limit_g || (proteinPresc?.is_hard_ceiling && r5Contract.nutrient_constraints.protein_g_per_kg && options.patient.weight_kg)) {
    const hardProtLimit = proteinPresc.limit_g || Math.round(r5Contract.nutrient_constraints.protein_g_per_kg! * options.patient.weight_kg! * 10) / 10;
    evaluateAuthorizedUpperLimit('protein', 'Protein', hardProtLimit, 'g');
  } else if (r5Contract.nutrient_constraints.protein_g_per_kg !== undefined && options.patient.weight_kg) {
    const targetProt = Math.round(r5Contract.nutrient_constraints.protein_g_per_kg * options.patient.weight_kg * 10) / 10;
    const actualProt = daily_totals['protein']?.known_total ?? 0;
    evaluations.push({
      parameter: 'protein',
      category: 'clinician_authorized_target',
      limit_value: targetProt,
      unit: 'g',
      baseline_value: actualProt,
      proposed_value: actualProt,
      is_incomplete: Boolean(daily_totals['protein']?.is_incomplete),
      missing_food_ids: daily_totals['protein']?.missing_food_ids || [],
      status: 'compliant',
      message_en: `Protein target (${targetProt} g/day at ${r5Contract.nutrient_constraints.protein_g_per_kg} g/kg) evaluated as clinical target (planned ${Math.round(actualProt * 10) / 10} g).`,
    });
  }

  // Unverified/missing renal status in renal diagnosis context
  const labCtx = r5Contract.lab_safety_context;
  const conditions = [
    ...(Array.isArray(options.patient.selected_conditions) ? options.patient.selected_conditions : []),
    ...(Array.isArray(options.patient.confirmed_conditions) ? options.patient.confirmed_conditions : []),
  ];
  const hasRenalCondition = conditions.some((c: any) => /ckd|renal|kidney|hyperkal/i.test(String(c)));
  if (hasRenalCondition && labCtx && labCtx.egfr_state !== 'available_verified') {
    const msg = `Renal status is ${labCtx.egfr_state}; cannot assume normal renal clearance without verified eGFR.`;
    reviewAdvisories.push(msg);
    evaluations.push({
      parameter: 'renal_egfr_status',
      category: 'unknown_requirement',
      is_incomplete: true,
      missing_food_ids: [],
      status: 'indeterminate_incomplete_data',
      message_en: msg,
    });
  }

  for (const flag of r5Contract.clinical_review_flags || []) {
    if (flag.flag === 'NUTRITION_ADJUSTMENT_CANDIDATE' || flag.flag === 'CLINICAL_REVIEW_REQUIRED') {
      evaluations.push({
        parameter: flag.parameter,
        category: flag.flag === 'NUTRITION_ADJUSTMENT_CANDIDATE' ? 'evidence_review_recommendation' : 'clinical_caution',
        is_incomplete: false,
        missing_food_ids: [],
        status: 'compliant',
        message_en: flag.rationale_en,
      });
    }
  }

  let complianceStatus: R8ConstraintComplianceStatus = 'compliant';
  if (acuteBlocked || evaluations.some(e => e.status === 'blocked_unresolved_safety')) {
    complianceStatus = 'blocked_unresolved_safety';
  } else if (evaluations.some(e => e.status === 'non_compliant_worsened')) {
    complianceStatus = 'non_compliant_worsened';
  } else if (evaluations.some(e => e.status === 'non_compliant_unchanged')) {
    complianceStatus = 'non_compliant_unchanged';
  } else if (evaluations.some(e => e.status === 'non_compliant_improved')) {
    complianceStatus = 'non_compliant_improved';
  } else if (indeterminateReasons.length > 0) {
    complianceStatus = 'indeterminate_incomplete_data';
  }

  return {
    daily_totals,
    constraint_evaluations: evaluations,
    hard_limit_violations_en: hardLimitViolations,
    indeterminate_reasons_en: indeterminateReasons,
    review_advisories_en: reviewAdvisories,
    compliance_status: complianceStatus,
    acute_release_blocked: acuteBlocked,
    requires_safety_review:
      hardLimitViolations.length > 0 ||
      indeterminateReasons.length > 0 ||
      reviewAdvisories.length > 0 ||
      acuteBlocked,
  };
}

export function previewSubstitutionImpact(options: {
  original_food: FoodItem;
  original_raw_grams: number;
  candidate_food: FoodItem;
  proposed_raw_grams: number;
  patient: Partial<PatientProfile>;
  target_item_id?: string;
  meal_id?: string;
  current_meal_items?: R8ResolvableMealItem[];
  current_daily_items?: R8ResolvableMealItem[];
  r5_nutrition_contract?: R5NutritionAdjustmentContract;
  r7_lab_summary?: R7LabIntelligenceSummary;
  foodPool?: FoodItem[];
}): R8MealAndDailyImpact {
  const pool = options.foodPool || R8_BASELINE_FOODS;

  const mealOrig: R8ResolvableMealItem[] =
    options.current_meal_items && options.current_meal_items.length > 0
      ? options.current_meal_items
      : [{ item_id: options.target_item_id, meal_id: options.meal_id, food_id: options.original_food.id, raw_weight_g: options.original_raw_grams }];

  let replacedMeal = false;
  const mealProp: R8ResolvableMealItem[] = mealOrig.map(item => {
    const matchesTarget = options.target_item_id
      ? item.item_id === options.target_item_id
      : item.food_id === options.original_food.id;
    if (!replacedMeal && matchesTarget) {
      replacedMeal = true;
      return { ...item, food_id: options.candidate_food.id, raw_weight_g: options.proposed_raw_grams, is_recipe_item: false, recipe_reference: undefined };
    }
    return item;
  });

  const dailyOrig: R8ResolvableMealItem[] =
    options.current_daily_items && options.current_daily_items.length > 0
      ? options.current_daily_items
      : mealOrig;

  let replacedDaily = false;
  const dailyProp: R8ResolvableMealItem[] = dailyOrig.map(item => {
    const matchesTarget = options.target_item_id
      ? item.item_id === options.target_item_id && (!options.meal_id || !item.meal_id || item.meal_id === options.meal_id)
      : item.food_id === options.original_food.id;
    if (!replacedDaily && matchesTarget) {
      replacedDaily = true;
      return { ...item, food_id: options.candidate_food.id, raw_weight_g: options.proposed_raw_grams, is_recipe_item: false, recipe_reference: undefined };
    }
    return item;
  });

  const original_meal_totals = aggregateMealItemsNutrients(mealOrig, CORE_COMPARISON_NUTRIENTS, pool);
  const proposed_meal_totals = aggregateMealItemsNutrients(mealProp, CORE_COMPARISON_NUTRIENTS, pool);
  const original_daily_totals = aggregateMealItemsNutrients(dailyOrig, CORE_COMPARISON_NUTRIENTS, pool);

  const constraintEval = evaluateDailyPlanConstraints({
    daily_items: dailyProp,
    baseline_daily_totals: original_daily_totals,
    patient: options.patient,
    r5_nutrition_contract: options.r5_nutrition_contract,
    r7_lab_summary: options.r7_lab_summary,
    foodPool: pool,
  });

  const evaluations = [...constraintEval.constraint_evaluations];
  const hardLimitViolations = [...constraintEval.hard_limit_violations_en];
  let complianceStatus = constraintEval.compliance_status;

  if (options.target_item_id && (!replacedMeal || !replacedDaily)) {
    const msg = `Target meal item "${options.target_item_id}" could not be uniquely resolved in meal/daily context.`;
    hardLimitViolations.push(msg);
    complianceStatus = 'blocked_unresolved_safety';
    evaluations.push({
      parameter: 'target_meal_item',
      category: 'unresolved_safety_restriction',
      is_incomplete: false,
      missing_food_ids: [],
      status: 'blocked_unresolved_safety',
      message_en: msg,
    });
  }

  const hasIncompleteAny =
    Object.values(proposed_meal_totals).some(t => t.is_incomplete) ||
    Object.values(constraintEval.daily_totals).some(t => t.is_incomplete);

  return {
    original_meal_totals,
    proposed_meal_totals,
    original_daily_totals,
    proposed_daily_totals: constraintEval.daily_totals,
    constraint_violations_en: [...hardLimitViolations, ...constraintEval.indeterminate_reasons_en],
    hard_limit_violations_en: hardLimitViolations,
    indeterminate_reasons_en: constraintEval.indeterminate_reasons_en,
    constraint_evaluations: evaluations,
    compliance_status: complianceStatus,
    acute_release_blocked: constraintEval.acute_release_blocked,
    has_incomplete_data: hasIncompleteAny,
    requires_safety_review:
      hardLimitViolations.length > 0 ||
      constraintEval.indeterminate_reasons_en.length > 0 ||
      constraintEval.review_advisories_en.length > 0 ||
      constraintEval.acute_release_blocked,
  };
}

export function evaluateFoodSubstitutions(
  request: R8SubstitutionRequest,
  foodPool?: FoodItem[]
): R8SubstitutionResponse {
  const foods = foodPool || R8_BASELINE_FOODS;
  const origFood = foods.find(f => f.id === request.original_food_id);
  const mode: R8SubstitutionMode = request.mode || 'energy_matched';
  const tolerancePct = request.tolerance_pct ?? R8_DEFAULT_MATCH_TOLERANCE_PCT;
  const maxResults = request.max_results ?? 6;
  const r5Contract =
    request.r5_nutrition_contract ||
    buildR5NutritionAdjustmentContract({ patient: request.patient });

  if (!origFood) {
    throw new Error(`Original food ID "${request.original_food_id}" not found in baseline food database.`);
  }

  const scalingNutrientId = getPrimaryScalingNutrient(mode, request.target_nutrient_id);
  const origScalingMeas = extractFoodNutrientMeasurement(origFood, scalingNutrientId);
  const origNutrientTotal =
    origScalingMeas.value !== null ? (origScalingMeas.value * request.original_raw_grams) / 100 : null;

  const excludedSummary: R8SubstitutionResponse['excluded_candidates_summary'] = [];
  const candidates: R8SubstitutionCandidateResult[] = [];

  for (const cand of foods) {
    if (cand.id === origFood.id) continue;
    if (!areGroupsCompatible(origFood, cand, mode)) continue;

    // Dietary preference & disallowed check
    const prefExclusion = checkDietaryPreferenceExclusion(cand, request.patient);
    if (prefExclusion) {
      excludedSummary.push({
        food_id: cand.id,
        name_en: cand.name_en,
        reason_en: prefExclusion,
        is_contraindicated: true,
      });
      continue;
    }

    // Clinical & allergy safety check
    const eligibility = evaluatePatientFoodEligibility(cand, request.patient, {
      trafficLight: request.traffic_light,
      labSummary: request.r7_lab_summary,
      r5NutritionContract: r5Contract,
    });
    if (!eligibility.is_safe_for_patient) {
      excludedSummary.push({
        food_id: cand.id,
        name_en: cand.name_en,
        reason_en: eligibility.exclusion_reasons_en.join('; '),
        is_contraindicated: true,
      });
      continue;
    }

    // Portion scaling without divide-by-zero or arbitrary 100g fallback
    const candScalingMeas = extractFoodNutrientMeasurement(cand, scalingNutrientId);
    if (candScalingMeas.value === null || candScalingMeas.value <= 0) {
      excludedSummary.push({
        food_id: cand.id,
        name_en: cand.name_en,
        reason_en: `Missing or zero ${scalingNutrientId} value in FCTB V6; cannot scale reliably.`,
        is_contraindicated: false,
      });
      continue;
    }

    let proposedRawG = request.original_raw_grams;
    if (origNutrientTotal !== null && origNutrientTotal > 0.5) {
      proposedRawG = Math.round(((origNutrientTotal * 100) / candScalingMeas.value) * 10) / 10;
    } else if (mode === 'manual_clinician_review') {
      proposedRawG = request.original_raw_grams;
    } else {
      excludedSummary.push({
        food_id: cand.id,
        name_en: cand.name_en,
        reason_en: `Original food lacks sufficient ${scalingNutrientId} (${origNutrientTotal ?? 'missing'}) for ${mode} scaling.`,
        is_contraindicated: false,
      });
      continue;
    }

    const bounds = getPracticalPortionBounds(cand);
    if (proposedRawG < bounds.minG || proposedRawG > bounds.maxG) {
      excludedSummary.push({
        food_id: cand.id,
        name_en: cand.name_en,
        reason_en: `Scaled raw weight (${proposedRawG}g) is outside practical portion bounds (${bounds.minG}–${bounds.maxG}g).`,
        is_contraindicated: false,
      });
      continue;
    }

    // Compute nutrient deltas across core nutrients
    const deltas: R8NutrientDelta[] = [];
    const missingNutrientIds: string[] = [];
    for (const nId of CORE_COMPARISON_NUTRIENTS) {
      const def = R8_CANONICAL_NUTRIENTS.find(d => d.canonical_id === nId);
      const oMeas = extractFoodNutrientMeasurement(origFood, nId);
      const cMeas = extractFoodNutrientMeasurement(cand, nId);
      const oAmt = oMeas.value !== null ? Math.round(((oMeas.value * request.original_raw_grams) / 100) * 10) / 10 : null;
      const cAmt = cMeas.value !== null ? Math.round(((cMeas.value * proposedRawG) / 100) * 10) / 10 : null;
      const isMissing = oAmt === null || cAmt === null;
      if (isMissing) missingNutrientIds.push(nId);

      const absDiff = oAmt !== null && cAmt !== null ? Math.round((cAmt - oAmt) * 10) / 10 : null;
      // Near-zero guard: avoid divide-by-zero / exploded percentages when baseline < 0.5
      let pctDiff: number | null = null;
      if (oAmt !== null && cAmt !== null) {
        if (Math.abs(oAmt) >= 0.5) {
          pctDiff = Math.round(((cAmt - oAmt) / oAmt) * 1000) / 10;
        } else {
          pctDiff = Math.abs((cAmt - oAmt)) <= 0.5 ? 0 : null;
        }
      }

      deltas.push({
        nutrient_id: nId,
        label_en: def?.label_en || nId,
        unit: def?.canonical_unit || '',
        original_amount: oAmt,
        candidate_amount: cAmt,
        absolute_diff: absDiff,
        percent_diff: pctDiff,
        is_missing_data: isMissing,
      });
    }

    // Check meal & daily impact
    const impact = previewSubstitutionImpact({
      original_food: origFood,
      original_raw_grams: request.original_raw_grams,
      candidate_food: cand,
      proposed_raw_grams: proposedRawG,
      patient: request.patient,
      target_item_id: request.target_item_id,
      meal_id: request.meal_id,
      current_meal_items: request.current_meal_items,
      current_daily_items: request.current_daily_items,
      r5_nutrition_contract: r5Contract,
      r7_lab_summary: request.r7_lab_summary,
      foodPool: foods,
    });

    const hasHardConstraintViolation = impact.hard_limit_violations_en.length > 0;
    if (hasHardConstraintViolation && mode !== 'manual_clinician_review') {
      excludedSummary.push({
        food_id: cand.id,
        name_en: cand.name_en,
        reason_en: impact.hard_limit_violations_en.join(' '),
        is_contraindicated: true,
      });
      continue;
    }

    // Score similarity (0..100)
    const primaryDelta = deltas.find(d => d.nutrient_id === scalingNutrientId);
    const protDelta = deltas.find(d => d.nutrient_id === 'protein');
    const carbDelta = deltas.find(d => d.nutrient_id === 'available_carbohydrate');

    let score = 90;
    if (primaryDelta?.percent_diff !== null && primaryDelta?.percent_diff !== undefined) {
      score -= Math.min(35, Math.abs(primaryDelta.percent_diff) * 0.8);
    }
    if (protDelta?.percent_diff !== null && protDelta?.percent_diff !== undefined) {
      score -= Math.min(20, Math.abs(protDelta.percent_diff) * 0.25);
    }
    if (carbDelta?.percent_diff !== null && carbDelta?.percent_diff !== undefined) {
      score -= Math.min(20, Math.abs(carbDelta.percent_diff) * 0.25);
    }
    if (eligibility.traffic_status === 'GREEN') score += 8;
    if (eligibility.traffic_status === 'YELLOW') score -= 12;
    if (missingNutrientIds.length > 0) score -= Math.min(12, missingNutrientIds.length * 2);

    score = Math.max(5, Math.min(99, Math.round(score)));

    const isPrimaryWithinTol =
      primaryDelta && primaryDelta.percent_diff !== null
        ? Math.abs(primaryDelta.percent_diff) <= tolerancePct
        : primaryDelta && primaryDelta.absolute_diff !== null
        ? Math.abs(primaryDelta.absolute_diff) <= 1.0
        : false;

    const macroWithinTol = (nId: string) => {
      const d = deltas.find(x => x.nutrient_id === nId);
      if (!d || d.is_missing_data) return false;
      if (d.percent_diff !== null) return Math.abs(d.percent_diff) <= tolerancePct;
      return d.absolute_diff !== null && Math.abs(d.absolute_diff) <= 1.0;
    };

    const isMultinutrientWithinTol =
      macroWithinTol('energy') &&
      macroWithinTol('protein') &&
      macroWithinTol('available_carbohydrate') &&
      macroWithinTol('total_fat');

    const activeHardNutrients = impact.constraint_evaluations
      .filter(e => e.category === 'clinician_authorized_hard_limit')
      .map(e => e.parameter);
    const missingSafetyCritical =
      missingNutrientIds.includes('energy') ||
      missingNutrientIds.includes('protein') ||
      activeHardNutrients.some(p => missingNutrientIds.includes(p)) ||
      impact.indeterminate_reasons_en.length > 0;

    let matchStatus: R8SubstitutionMatchStatus = 'equivalent_within_tolerance';
    if (hasHardConstraintViolation || impact.acute_release_blocked) {
      matchStatus = 'clinically_contraindicated';
    } else if (
      !isPrimaryWithinTol ||
      (mode === 'multinutrient_balanced' && !isMultinutrientWithinTol) ||
      eligibility.traffic_status === 'YELLOW' ||
      eligibility.traffic_status === 'UNCLASSIFIED' ||
      missingSafetyCritical
    ) {
      matchStatus = 'partially_equivalent_review';
    }
    if (!hasHardConstraintViolation && mode === 'clinical_restriction_aware' && !isPrimaryWithinTol) {
      matchStatus = 'non_equivalent_clinical_alternative';
    }

    const cookedGrams = Math.round(proposedRawG * (cand.raw_to_cooked_ratio || 1));
    const display = formatCookedPortionDisplay(cand, proposedRawG, cookedGrams);

    const rankingReasons: string[] = [
      `${mode.replace(/_/g, ' ')}: scaled to ${proposedRawG}g raw (${display.en})`,
      `Traffic Light: ${eligibility.traffic_status}`,
    ];
    if (missingNutrientIds.length > 0) {
      rankingReasons.push(`Incomplete FCTB coverage for: ${missingNutrientIds.join(', ')}`);
    }

    candidates.push({
      candidate_food: cand,
      proposed_raw_grams: proposedRawG,
      proposed_cooked_grams: cookedGrams,
      household_portion_bn: display.bn,
      household_portion_en: display.en,
      basis_note_en: `FCTB V6 raw edible weight (${proposedRawG}g raw -> ~${cookedGrams}g cooked, ratio ${cand.raw_to_cooked_ratio || 1})`,
      matching_mode: mode,
      match_status: matchStatus,
      nutritional_similarity_score: score,
      similarity_label_en:
        score >= 85 ? 'High Equivalence' : score >= 65 ? 'Moderate Equivalence' : 'Partial / Clinical Alternative',
      traffic_status: eligibility.traffic_status,
      nutrient_deltas: deltas,
      missing_nutrient_ids: missingNutrientIds,
      conditional_instructions_en: [
        ...eligibility.cautions_en,
        ...eligibility.drug_interactions_en,
        ...eligibility.preparation_requirements_en,
      ],
      conditional_instructions_bn: [...eligibility.cautions_bn],
      ranking_reasons_en: rankingReasons,
      requires_clinician_review:
        hasHardConstraintViolation ||
        impact.acute_release_blocked ||
        eligibility.traffic_status === 'YELLOW' ||
        eligibility.traffic_status === 'UNCLASSIFIED' ||
        missingSafetyCritical ||
        eligibility.cautions_en.length > 0 ||
        eligibility.drug_interactions_en.length > 0 ||
        impact.requires_safety_review,
      impact,
    });
  }

  // Rank FULL candidate pool BEFORE slicing!
  candidates.sort((a, b) => {
    const aGreen = a.traffic_status === 'GREEN' ? 1 : 0;
    const bGreen = b.traffic_status === 'GREEN' ? 1 : 0;
    if (aGreen !== bGreen) return bGreen - aGreen;
    return b.nutritional_similarity_score - a.nutritional_similarity_score;
  });

  const sliced = candidates.slice(0, maxResults);
  const hasEquivalent = sliced.some(c => c.match_status === 'equivalent_within_tolerance');

  return {
    original_food: origFood,
    original_raw_grams: request.original_raw_grams,
    mode,
    tolerance_pct: tolerancePct,
    has_equivalent_match: hasEquivalent,
    no_match_reason_en:
      sliced.length === 0
        ? 'No safe, practical food equivalent found within clinical and portion constraints.'
        : undefined,
    no_match_reason_bn:
      sliced.length === 0
        ? 'ক্লিনিকাল নিরাপত্তা ও পরিমিত অংশের মধ্যে কোনো উপযুক্ত বিকল্প খাবার পাওয়া যায়নি।'
        : undefined,
    ranked_candidates: sliced,
    excluded_candidates_summary: excludedSummary,
  };
}
