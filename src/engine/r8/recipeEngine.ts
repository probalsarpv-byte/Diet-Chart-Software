/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION PLATFORM
 * PHASE R8-D: RECIPE & PREPARATION ANALYSIS ENGINE
 *
 * Computes transparent nutrient totals per recipe & per serving using R8-A
 * canonical aggregation (never fabricating missing nutrients or fake absorption %),
 * and propagates ALL ingredient allergens, Traffic Light RED/YELLOW flags,
 * and clinical contraindications to recipe-level safety.
 */

import { FoodItem, PatientProfile } from '../../types';
import { R5NutritionAdjustmentContract } from '../../types/r5Systems';
import { R8_PREPARATION_GUIDANCE, R8_REPRESENTATIVE_RECIPES } from '../../data/r8RecipesData';
import {
  R8ComputedRecipeAnalysis,
  R8PreparationGuidance,
  R8Recipe,
  TrafficLightStatus,
} from '../../types/r8FoodKnowledge';
import { aggregateFoodNutrients, R8_BASELINE_FOODS } from './foodFoundation';
import { evaluatePatientFoodEligibility } from './knowledgeNetwork';

export function validateRecipeQuantity(grams: number): { valid: boolean; reason?: string } {
  if (typeof grams !== 'number' || !Number.isFinite(grams) || grams <= 0 || grams > 5000) {
    return { valid: false, reason: `Invalid ingredient weight (${grams}); must be finite and between >0 and 5000g.` };
  }
  return { valid: true };
}

export function createRecipeDraftFromReference(
  base: R8Recipe,
  options?: { patientId?: string; visitId?: string; versionSuffix?: string }
): R8Recipe {
  return {
    ...base,
    version: options?.versionSuffix ? `${base.version}-${options.versionSuffix}` : base.version,
    ingredients: base.ingredients.map(i => ({ ...i })),
    provenance: options?.patientId
      ? `${base.provenance} | Patient Draft (${options.patientId}${options.visitId ? ` / ${options.visitId}` : ''})`
      : base.provenance,
  };
}

export function addRecipeIngredient(
  recipe: R8Recipe,
  foodId: string,
  rawWeightG: number,
  foods: FoodItem[] = R8_BASELINE_FOODS
): { ok: true; recipe: R8Recipe } | { ok: false; reason: string } {
  const qtyCheck = validateRecipeQuantity(rawWeightG);
  if (!qtyCheck.valid) return { ok: false, reason: qtyCheck.reason! };
  if (!foods.some(f => f.id === foodId)) {
    return { ok: false, reason: `Unrecognized food ID "${foodId}"; cannot verify composition.` };
  }
  return {
    ok: true,
    recipe: {
      ...recipe,
      ingredients: [
        ...recipe.ingredients,
        { food_id: foodId, raw_weight_g: Math.round(rawWeightG * 10) / 10, edible_portion_applied: true },
      ],
    },
  };
}

export function removeRecipeIngredient(recipe: R8Recipe, index: number): R8Recipe {
  if (index < 0 || index >= recipe.ingredients.length) return recipe;
  return {
    ...recipe,
    ingredients: recipe.ingredients.filter((_, i) => i !== index),
  };
}

export function updateRecipeIngredientQuantity(
  recipe: R8Recipe,
  index: number,
  rawWeightG: number
): { ok: true; recipe: R8Recipe } | { ok: false; reason: string } {
  const qtyCheck = validateRecipeQuantity(rawWeightG);
  if (!qtyCheck.valid) return { ok: false, reason: qtyCheck.reason! };
  if (index < 0 || index >= recipe.ingredients.length) {
    return { ok: false, reason: `Ingredient index ${index} out of bounds.` };
  }
  return {
    ok: true,
    recipe: {
      ...recipe,
      ingredients: recipe.ingredients.map((ing, i) =>
        i === index ? { ...ing, raw_weight_g: Math.round(rawWeightG * 10) / 10 } : ing
      ),
    },
  };
}

export function replaceRecipeIngredient(
  recipe: R8Recipe,
  index: number,
  newFoodId: string,
  foods: FoodItem[] = R8_BASELINE_FOODS
): { ok: true; recipe: R8Recipe } | { ok: false; reason: string } {
  if (!foods.some(f => f.id === newFoodId)) {
    return { ok: false, reason: `Unrecognized replacement food ID "${newFoodId}".` };
  }
  if (index < 0 || index >= recipe.ingredients.length) {
    return { ok: false, reason: `Ingredient index ${index} out of bounds.` };
  }
  return {
    ok: true,
    recipe: {
      ...recipe,
      ingredients: recipe.ingredients.map((ing, i) =>
        i === index ? { ...ing, food_id: newFoodId } : ing
      ),
    },
  };
}

export function adjustRecipeServings(
  recipe: R8Recipe,
  newServings: number,
  mode: 'divide_fixed_batch' | 'scale_batch'
): { ok: true; recipe: R8Recipe } | { ok: false; reason: string } {
  if (typeof newServings !== 'number' || !Number.isFinite(newServings) || newServings < 1 || newServings > 24) {
    return { ok: false, reason: 'Servings must be a finite number between 1 and 24.' };
  }
  const roundedServings = Math.round(newServings);
  if (mode === 'divide_fixed_batch') {
    return {
      ok: true,
      recipe: { ...recipe, servings: roundedServings },
    };
  }
  const prevServings = Math.max(1, recipe.servings || 1);
  const ratio = roundedServings / prevServings;
  return {
    ok: true,
    recipe: {
      ...recipe,
      servings: roundedServings,
      water_added_ml: Math.round((recipe.water_added_ml || 0) * ratio),
      final_cooked_yield_g:
        recipe.final_cooked_yield_g > 0 ? Math.round(recipe.final_cooked_yield_g * ratio) : 0,
      ingredients: recipe.ingredients.map(ing => ({
        ...ing,
        raw_weight_g: Math.round(ing.raw_weight_g * ratio * 10) / 10,
      })),
    },
  };
}

export function getPreparationGuidanceForMethod(
  method: R8Recipe['preparation_method']
): R8PreparationGuidance | undefined {
  return R8_PREPARATION_GUIDANCE.find(g => g.method === method);
}

export function computeRecipeAnalysis(
  recipe: R8Recipe,
  options?: {
    foods?: FoodItem[];
    patient?: PatientProfile;
    r5NutritionContract?: R5NutritionAdjustmentContract;
    trafficLight?: {
      green?: Array<{ id: string }>;
      yellow?: Array<{ id: string; reasons?: any[] }>;
      red?: Array<{ id: string; reasons?: any[] }>;
    };
  }
): R8ComputedRecipeAnalysis {
  const foodPool = options?.foods || R8_BASELINE_FOODS;
  const foodMap = new Map(foodPool.map(f => [f.id, f]));

  const resolvedItems: Array<{ food: FoodItem; raw_edible_g: number }> = [];
  const missingIngredientIds: string[] = [];

  for (const ing of recipe.ingredients) {
    const found = foodMap.get(ing.food_id);
    if (!found) {
      missingIngredientIds.push(ing.food_id);
      continue;
    }
    resolvedItems.push({
      food: found,
      raw_edible_g: Math.max(0, Number(ing.raw_weight_g) || 0),
    });
  }

  const totalRawIngredientG = resolvedItems.reduce((sum, x) => sum + x.raw_edible_g, 0);
  const servings = Math.max(1, Number(recipe.servings) || 1);
  const hasKnownYield = typeof recipe.final_cooked_yield_g === 'number' && Number.isFinite(recipe.final_cooked_yield_g) && recipe.final_cooked_yield_g > 0;
  const perServingWeightG = hasKnownYield
    ? Math.round((recipe.final_cooked_yield_g / servings) * 10) / 10
    : Math.round((totalRawIngredientG / servings) * 10) / 10;

  const nutrients = aggregateFoodNutrients(resolvedItems, undefined, servings);

  const incompleteNutrients = Object.values(nutrients)
    .filter(n => n.is_incomplete)
    .map(n => n.canonical_nutrient_id);

  // Propagate ingredient allergens & patient safety
  const propagatedAllergens = new Set<string>();
  const hardContraindications: string[] = [];
  const cautions: string[] = [];
  const reviewReasons: string[] = [];
  let worstTraffic: TrafficLightStatus = 'GREEN';

  if (missingIngredientIds.length > 0) {
    reviewReasons.push(
      `Missing ${missingIngredientIds.length} ingredient food record(s): ${missingIngredientIds.join(', ')}`
    );
  }

  for (const { food } of resolvedItems) {
    (food.tags || [])
      .filter((t: string) => /allergen|gluten|dairy|egg|fish|sesame|nut|soy|shellfish/i.test(t))
      .forEach((tag: string) => propagatedAllergens.add(tag));
    if (/sesame/i.test(food.name_en)) propagatedAllergens.add('sesame');
    if (/egg/i.test(food.name_en)) propagatedAllergens.add('egg');
    if (/fish|rohu|hilsa|mola/i.test(food.name_en)) propagatedAllergens.add('fish');
    if (/milk|curd/i.test(food.name_en)) propagatedAllergens.add('dairy');

    if (options?.patient) {
      const eligibility = evaluatePatientFoodEligibility(food, options.patient, {
        trafficLight: options.trafficLight,
      });
      if (!eligibility.is_safe_for_patient) {
        hardContraindications.push(
          `${food.name_en}: ${eligibility.exclusion_reasons_en.join('; ')}`
        );
      }
      if (eligibility.traffic_status === 'RED') {
        worstTraffic = 'RED';
      } else if (eligibility.traffic_status === 'YELLOW' && worstTraffic !== 'RED') {
        worstTraffic = 'YELLOW';
      }
      eligibility.cautions_en.forEach(c => cautions.push(`${food.name_en}: ${c}`));
      eligibility.drug_interactions_en.forEach(d => cautions.push(`${food.name_en}: ${d}`));
    }
  }

  if (options?.r5NutritionContract) {
    const nc = options.r5NutritionContract.nutrient_constraints;
    const perServK = nutrients['potassium']?.per_serving ?? 0;
    const perServNa = nutrients['sodium']?.per_serving ?? 0;
    const perServP = nutrients['phosphorus']?.per_serving ?? 0;
    if (nc.potassium_mg_max && perServK > nc.potassium_mg_max) {
      hardContraindications.push(
        `Single serving potassium (${Math.round(perServK)} mg) exceeds patient authorized daily potassium ceiling (${nc.potassium_mg_max} mg).`
      );
    }
    if (nc.sodium_mg_max && perServNa > nc.sodium_mg_max) {
      hardContraindications.push(
        `Single serving sodium (${Math.round(perServNa)} mg) exceeds patient authorized daily sodium ceiling (${nc.sodium_mg_max} mg).`
      );
    }
    if (nc.phosphorus_mg_max && perServP > nc.phosphorus_mg_max) {
      hardContraindications.push(
        `Single serving phosphorus (${Math.round(perServP)} mg) exceeds patient authorized daily phosphorus ceiling (${nc.phosphorus_mg_max} mg).`
      );
    }
  }

  if (hardContraindications.length > 0) {
    worstTraffic = 'RED';
    reviewReasons.push('Contains ingredient(s) contraindicated or allergenic for this patient.');
  }

  if (incompleteNutrients.length > 0) {
    reviewReasons.push(
      `Incomplete FCTB nutrient coverage for ${incompleteNutrients.length} nutrient(s) across recipe ingredients.`
    );
  }

  const prepGuidance = getPreparationGuidanceForMethod(recipe.preparation_method);
  const provenanceNote =
    `Calculated from ${resolvedItems.length}/${recipe.ingredients.length} raw FCTB V6 ingredients ` +
    `(water_added=${recipe.water_added_ml} mL, cooked_yield=${recipe.final_cooked_yield_g} g, servings=${servings}). ` +
    `${prepGuidance ? `Method note: ${prepGuidance.nutrient_retention_note_en}` : ''} ` +
    `Missing ingredient nutrient cells are preserved as incomplete rather than zeroed.`;

  return {
    recipe,
    per_serving_weight_g: perServingWeightG,
    total_raw_ingredient_g: Math.round(totalRawIngredientG * 10) / 10,
    nutrients,
    incomplete_nutrients: incompleteNutrients,
    is_nutrition_incomplete: incompleteNutrients.length > 0 || missingIngredientIds.length > 0,
    safety: {
      is_safe_for_patient: hardContraindications.length === 0 && missingIngredientIds.length === 0,
      traffic_status: worstTraffic,
      propagated_allergens: Array.from(propagatedAllergens),
      hard_contraindications_en: hardContraindications,
      cautions_en: Array.from(new Set(cautions)),
      requires_clinician_review:
        hardContraindications.length > 0 ||
        cautions.length > 0 ||
        missingIngredientIds.length > 0 ||
        incompleteNutrients.includes('energy') ||
        incompleteNutrients.includes('potassium'),
      review_reasons_en: reviewReasons,
    },
    provenance_note_en: provenanceNote,
  };
}

export function analyzeAllRepresentativeRecipes(options?: {
  patient?: PatientProfile;
  trafficLight?: {
    green?: Array<{ id: string }>;
    yellow?: Array<{ id: string; reasons?: any[] }>;
    red?: Array<{ id: string; reasons?: any[] }>;
  };
}): R8ComputedRecipeAnalysis[] {
  return R8_REPRESENTATIVE_RECIPES.map(recipe => computeRecipeAnalysis(recipe, options));
}
