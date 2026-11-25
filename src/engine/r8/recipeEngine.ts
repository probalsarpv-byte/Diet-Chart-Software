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
import { R8_PREPARATION_GUIDANCE, R8_REPRESENTATIVE_RECIPES } from '../../data/r8RecipesData';
import {
  R8ComputedRecipeAnalysis,
  R8PreparationGuidance,
  R8Recipe,
  TrafficLightStatus,
} from '../../types/r8FoodKnowledge';
import { aggregateFoodNutrients, R8_BASELINE_FOODS } from './foodFoundation';
import { evaluatePatientFoodEligibility } from './knowledgeNetwork';

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
  const perServingWeightG = Math.round(((recipe.final_cooked_yield_g || totalRawIngredientG) / servings) * 10) / 10;

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
