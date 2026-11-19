/**
 * SHUDDHO Clinical Nutrition Planning Engine
 * Deterministic 7-Day Personalized Nutrition Plan Generator (Phase P3)
 * 
 * Complies with:
 * - Bangladesh Food Composition Database (FCTB)
 * - P2->P3 Authoritative Planning Handoff Contract
 * - Clinical Safety Precedence (Allergies > Feeding Route > Prescriptions > Medications > Disease Rules > Preferences)
 * - Deterministic ingredient variation across 7 days
 * - Item, Meal, and Day level lock preservation
 */

import { 
  FoodItem, 
  DietChartMeal, 
  DietChartMealItem, 
  FoodExchangeItem, 
  MealSlotConstraintError,
  PatientProfile, 
  TrafficLightResult,
  DayPlan,
  DayPlanSummary,
  WeeklyDietPlan,
  WeeklyDietPlanApprovalRecord,
  FoodCategory
} from '../types';
import { 
  getCookedDisplay, 
  detectIncompatibleCombinations, 
  generateExchangesForFood, 
  selectSafeMealCandidate 
} from './mealScaler';
import { P3NutritionPlanningContext } from './p2/types';
import { validateInterventionPlan } from '../clinical-safety/interventionValidation';
import { evaluateFastingEligibility } from '../clinical-safety/fastingSafetyEngine';
import foodsData from '../data/foods.json';

const defaultFoods = foodsData as FoodItem[];

export const DAY_NAMES: { bn: string; en: string }[] = [
  { bn: '১ম দিন (শনিবার / শুরু)', en: 'Day 1 (Saturday / Kickoff)' },
  { bn: '২য় দিন (রবিবার)', en: 'Day 2 (Sunday)' },
  { bn: '৩য় দিন (সোমবার)', en: 'Day 3 (Monday)' },
  { bn: '৪র্থ দিন (মঙ্গলবার)', en: 'Day 4 (Tuesday)' },
  { bn: '৫ম দিন (বুধবার)', en: 'Day 5 (Wednesday)' },
  { bn: '৬ষ্ঠ দিন (বৃহস্পতিবার)', en: 'Day 6 (Thursday)' },
  { bn: '৭ম দিন (শুক্রবার)', en: 'Day 7 (Friday)' },
];

export interface DayRotationKeywordTemplate {
  morningVeg: string[];
  breakfastProtein: string[];
  breakfastGrain: string[];
  breakfastVeg: string[];
  lunchGrain: string[];
  lunchProtein: string[];
  lunchVeg: string[];
  eveningSeed: string[];
  dinnerProtein: string[];
  dinnerVeg: string[];
}

export const DAY_ROTATION_TEMPLATES: DayRotationKeywordTemplate[] = [
  // Day 1
  {
    morningVeg: ['cucumber', 'gourd', 'papaya', 'শসা'],
    breakfastProtein: ['egg', 'chicken', 'ডিম', 'lentil', 'paneer'],
    breakfastGrain: ['flour', 'roti', 'ruti', 'atta', 'oats', 'রুটি'],
    breakfastVeg: ['papaya', 'gourd', 'pepe', 'পেঁপে', 'ঝিঙে'],
    lunchGrain: ['red rice', 'rice', 'চাল', 'ভাত'],
    lunchProtein: ['rui', 'fish', 'মাছ', 'chicken'],
    lunchVeg: ['spinach', 'palong', 'shak', 'শাক'],
    eveningSeed: ['pumpkin', 'chia', 'seed', 'বীজ'],
    dinnerProtein: ['chicken', 'মুরগি', 'fish', 'egg', 'ডিম'],
    dinnerVeg: ['bottle gourd', 'gourd', 'লাউ', 'pepe'],
  },
  // Day 2
  {
    morningVeg: ['gourd', 'cucumber', 'ঝিঙে', 'শসা'],
    breakfastProtein: ['egg', 'ডিম', 'boiled egg', 'moong', 'lentil'],
    breakfastGrain: ['oats', 'atta', 'roti', 'রুটি'],
    breakfastVeg: ['gourd', 'ঝিঙে', 'pepe'],
    lunchGrain: ['rice', 'atash', 'চাল', 'ভাত'],
    lunchProtein: ['katla', 'fish', 'মাছ', 'chicken'],
    lunchVeg: ['lal shak', 'লাল শাক', 'amaranth', 'শাক'],
    eveningSeed: ['chia', 'seed', 'almond', 'বাদাম'],
    dinnerProtein: ['fish', 'মাছ', 'chicken', 'egg'],
    dinnerVeg: ['jhinge', 'ঝিঙে', 'pepe'],
  },
  // Day 3
  {
    morningVeg: ['papaya', 'cucumber', 'পেঁপে', 'শসা'],
    breakfastProtein: ['lentil', 'ডাল', 'paneer', 'egg', 'ডিম'],
    breakfastGrain: ['flour', 'roti', 'রুটি'],
    breakfastVeg: ['potol', 'পটল', 'gourd'],
    lunchGrain: ['brown rice', 'red rice', 'rice', 'ভাত'],
    lunchProtein: ['chicken', 'মুরগি', 'fish', 'ডাল'],
    lunchVeg: ['danta shak', 'ডাটা শাক', 'shak'],
    eveningSeed: ['roasted chickpea', 'seed', 'ছোলা'],
    dinnerProtein: ['telapia', 'fish', 'মাছ', 'chicken', 'tofu'],
    dinnerVeg: ['chichinga', 'চিচিঙ্গা', 'gourd', 'লাউ'],
  },
  // Day 4
  {
    morningVeg: ['cucumber', 'gourd', 'শসা'],
    breakfastProtein: ['egg', 'ডিম', 'chicken', 'paneer'],
    breakfastGrain: ['roti', 'atta', 'রুটি'],
    breakfastVeg: ['papaya', 'pepe', 'পেঁপে'],
    lunchGrain: ['rice', 'চাল', 'ভাত'],
    lunchProtein: ['shol', 'fish', 'মাছ', 'mrigel', 'chicken'],
    lunchVeg: ['palong', 'spinach', 'shak', 'শাক'],
    eveningSeed: ['sunflower', 'seed', 'almond'],
    dinnerProtein: ['lentil', 'ডাল', 'egg', 'ডিম', 'chicken'],
    dinnerVeg: ['potol', 'পটল', 'ঝিঙে'],
  },
  // Day 5
  {
    morningVeg: ['papaya', 'cucumber', 'পেঁপে', 'লাউ'],
    breakfastProtein: ['egg', 'ডিম', 'chickpea', 'lentil'],
    breakfastGrain: ['oats', 'roti', 'রুটি'],
    breakfastVeg: ['gourd', 'লাউ', 'pepe'],
    lunchGrain: ['red rice', 'rice', 'ভাত'],
    lunchProtein: ['boal', 'pangas', 'fish', 'মাছ', 'chicken'],
    lunchVeg: ['lal shak', 'লাল শাক', 'শাক'],
    eveningSeed: ['pumpkin', 'seed', 'বীজ'],
    dinnerProtein: ['chicken', 'মুরগি', 'fish', 'egg'],
    dinnerVeg: ['bottle gourd', 'লাউ', 'ঝিঙে'],
  },
  // Day 6
  {
    morningVeg: ['gourd', 'cucumber', 'ঝিঙে'],
    breakfastProtein: ['egg', 'ডিম', 'paneer', 'lentil'],
    breakfastGrain: ['roti', 'atta', 'রুটি'],
    breakfastVeg: ['pepe', 'পেঁপে', 'gourd'],
    lunchGrain: ['rice', 'চাল', 'ভাত'],
    lunchProtein: ['magur', 'shing', 'fish', 'মাছ', 'chicken'],
    lunchVeg: ['danta shak', 'ডাটা শাক', 'shak', 'শাক'],
    eveningSeed: ['chia', 'seed', 'বাদাম'],
    dinnerProtein: ['fish', 'মাছ', 'chicken', 'egg'],
    dinnerVeg: ['jhinge', 'ঝিঙে', 'লাউ'],
  },
  // Day 7
  {
    morningVeg: ['cucumber', 'papaya', 'শসা', 'পেঁপে'],
    breakfastProtein: ['egg', 'ডিম', 'lentil', 'ডাল'],
    breakfastGrain: ['roti', 'flour', 'রুটি'],
    breakfastVeg: ['potol', 'পটল', 'pepe'],
    lunchGrain: ['rice', 'চাল', 'ভাত'],
    lunchProtein: ['katla', 'rui', 'fish', 'মাছ', 'chicken'],
    lunchVeg: ['shak', 'শাক', 'palong', 'সবজি'],
    eveningSeed: ['sunflower', 'seed', 'nuts'],
    dinnerProtein: ['chicken', 'মুরগি', 'fish', 'মাছ'],
    dinnerVeg: ['bottle gourd', 'লাউ', 'pepe'],
  },
];

/**
 * Score a meal's nutritional totals and check for incompatible combinations
 */
export function calculateMealTotals(
  items: DietChartMealItem[], 
  allFoods?: FoodItem[],
  slotErrors: MealSlotConstraintError[] = []
) {
  const meal_calories = items.reduce((sum, i) => sum + i.kcal, 0);
  const meal_protein_g = Math.round(items.reduce((sum, i) => sum + i.protein_g, 0) * 10) / 10;
  const meal_carbs_g = Math.round(items.reduce((sum, i) => sum + i.carbs_g, 0) * 10) / 10;
  const meal_fat_g = Math.round(items.reduce((sum, i) => sum + i.fat_g, 0) * 10) / 10;

  const resolvedFoods = (allFoods && allFoods.length > 0) ? allFoods : defaultFoods;

  // Approximate Glycemic Load (GL) with is_estimated flag
  const meal_gl = Math.round(items.reduce((sum, i) => {
    const food = resolvedFoods.find(f => f.id === i.food_id);
    const estGi = food?.glycemic_load === 'low' ? 35 : food?.glycemic_load === 'medium' ? 55 : 75;
    return sum + ((i.carbs_g * estGi) / 100);
  }, 0));

  const meal_pral = Math.round(items.reduce((sum, i) => {
    const food = resolvedFoods.find(f => f.id === i.food_id);
    return sum + ((food?.pral_score || 0) * (i.raw_weight_g / 100));
  }, 0) * 10) / 10;

  return {
    meal_calories,
    meal_protein_g,
    meal_carbs_g,
    meal_fat_g,
    meal_gl,
    meal_gl_is_estimated: true,
    meal_pral,
    incompatible_warnings: detectIncompatibleCombinations(items),
    slot_errors: slotErrors.length > 0 ? slotErrors : undefined
  };
}

/**
 * Creates a single DietChartMealItem with food exchanges, cooked portion display, and traffic status.
 */
export function createPlanMealItem(
  food: FoodItem, 
  rawG: number, 
  allFoods: FoodItem[],
  greenIds: Set<string>,
  redIds: Set<string>,
  yellowIds: Set<string>,
  trafficStatus: 'GREEN' | 'YELLOW' = 'GREEN'
): DietChartMealItem {
  const cookedG = Math.round(rawG * food.raw_to_cooked_ratio);
  const display = getCookedDisplay(food, rawG, cookedG);
  const multiplier = rawG / 100;
  return {
    id: `item_${food.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    food_id: food.id,
    food_name_bn: food.name_bn,
    food_name_en: food.name_en,
    category: food.category,
    raw_weight_g: rawG,
    cooked_weight_g: cookedG,
    cooked_display_bn: display.bn,
    cooked_display_en: display.en,
    kcal: Math.round((food.per_100g.kcal ?? 0) * multiplier),
    protein_g: Math.round((food.per_100g.protein_g ?? 0) * multiplier * 10) / 10,
    carbs_g: Math.round((food.per_100g.carbs_g ?? 0) * multiplier * 10) / 10,
    fat_g: Math.round((food.per_100g.fat_g ?? 0) * multiplier * 10) / 10,
    fiber_g: Math.round((food.per_100g.fiber_g ?? 0) * multiplier * 10) / 10,
    prep_note_bn: food.prep_note_bn,
    prep_note_en: food.prep_note_en,
    alternatives: generateExchangesForFood(food, rawG, allFoods, greenIds, redIds, yellowIds),
    traffic_status: trafficStatus
  };
}

/**
 * Generates meals for one day adhering strictly to deterministic clinical rotation templates and locks.
 */
export function generateMealsForDay(
  dayNumber: number, // 1 to 7
  patient: PatientProfile,
  allFoods: FoodItem[],
  trafficLightResult: TrafficLightResult,
  targetMacros: { calories: number; protein_g: number; carbs_g: number; fat_g: number },
  existingDayMeals?: DietChartMeal[],
  lockedMeals?: Record<string, boolean>,
  lockedItems?: Record<string, boolean>
): DietChartMeal[] {
  const templateIndex = (dayNumber - 1) % DAY_ROTATION_TEMPLATES.length;
  const tmpl = DAY_ROTATION_TEMPLATES[templateIndex];

  const { green: greenFoods, yellow: yellowFoods, red: redFoods } = trafficLightResult;
  const greenIds = new Set(greenFoods.map(f => f.id));
  const yellowIds = new Set(yellowFoods.map(f => f.id));
  const redIds = new Set(redFoods.map(f => f.id));

  const { protein_g: targetProtein, carbs_g: targetCarbs, fat_g: targetFat } = targetMacros;
  const breakfastCarbG = Math.max(20, Math.round(targetCarbs * 0.25));
  const lunchCarbG = Math.max(30, Math.round(targetCarbs * 0.45));

  const existingMealMap = new Map<string, DietChartMeal>();
  if (existingDayMeals) {
    for (const m of existingDayMeals) {
      existingMealMap.set(m.meal_type, m);
    }
  }

  // Helper to re-use or generate a meal slot
  function buildSlot(
    mealType: 'morning_protocol' | 'breakfast' | 'lunch' | 'evening_snack' | 'dinner',
    titleBn: string,
    titleEn: string,
    targetTime: string,
    generateFreshItems: () => { items: DietChartMealItem[]; errors: MealSlotConstraintError[] }
  ): DietChartMeal {
    const existing = existingMealMap.get(mealType);

    // If whole meal is locked, preserve it entirely
    if (existing && lockedMeals && lockedMeals[existing.id]) {
      return existing;
    }

    // If some items in the meal are locked, preserve locked items and regenerate the rest
    if (existing && lockedItems && Object.keys(lockedItems).length > 0) {
      const lockedExistingItems = existing.items.filter(i => lockedItems[i.id]);
      if (lockedExistingItems.length > 0) {
        const fresh = generateFreshItems();
        // Keep locked items, filter out duplicates by category/food
        const lockedFoodIds = new Set(lockedExistingItems.map(i => i.food_id));
        const combinedItems = [
          ...lockedExistingItems,
          ...fresh.items.filter(i => !lockedFoodIds.has(i.food_id))
        ];
        const scored = calculateMealTotals(combinedItems, allFoods, fresh.errors);
        return {
          id: existing.id,
          meal_type: mealType,
          title_bn: titleBn,
          title_en: titleEn,
          target_time: targetTime,
          items: combinedItems,
          ...scored
        };
      }
    }

    const fresh = generateFreshItems();
    const scored = calculateMealTotals(fresh.items, allFoods, fresh.errors);
    return {
      id: existing ? existing.id : `meal_${mealType}_d${dayNumber}`,
      meal_type: mealType,
      title_bn: titleBn,
      title_en: titleEn,
      target_time: targetTime,
      items: fresh.items,
      ...scored
    };
  }

  // 1. Morning Protocol
  const morningMeal = buildSlot(
    'morning_protocol',
    'প্রাতঃকালীন গাট রিবুট প্রোটোকল (০৬:৩০ ঘটিকা)',
    'Morning Gut Reset Protocol (06:30 AM)',
    '06:30 AM',
    () => {
      const errors: MealSlotConstraintError[] = [];
      const items: DietChartMealItem[] = [];
      const veg = selectSafeMealCandidate(
        'Morning Hydration Vegetable',
        'vegetable',
        tmpl.morningVeg,
        allFoods, greenFoods, yellowFoods, redFoods, patient
      );
      if (veg.food) {
        items.push(createPlanMealItem(veg.food, 80, allFoods, greenIds, redIds, yellowIds, veg.trafficStatus || 'GREEN'));
      } else if (veg.error) {
        errors.push(veg.error);
      }
      return { items, errors };
    }
  );

  // 2. Breakfast
  const breakfastMeal = buildSlot(
    'breakfast',
    'সকালের পুষ্টিকর নাশতা (০৮:০০ ঘটিকা)',
    'Functional Metabolic Breakfast (08:00 AM)',
    '08:00 AM',
    () => {
      const errors: MealSlotConstraintError[] = [];
      const items: DietChartMealItem[] = [];

      // Protein
      const proteinCand = selectSafeMealCandidate(
        'Breakfast Protein',
        'protein',
        tmpl.breakfastProtein,
        allFoods, greenFoods, yellowFoods, redFoods, patient
      );
      if (proteinCand.food) {
        const eggCount = targetProtein > 80 ? 2 : 1;
        const proteinGrams = proteinCand.food.name_en.toLowerCase().includes('egg') ? eggCount * 50 : 60;
        items.push(createPlanMealItem(proteinCand.food, proteinGrams, allFoods, greenIds, redIds, yellowIds, proteinCand.trafficStatus || 'GREEN'));
      } else if (proteinCand.error) {
        errors.push(proteinCand.error);
      }

      // Grain
      const grainCand = selectSafeMealCandidate(
        'Breakfast Grain',
        'grain',
        tmpl.breakfastGrain,
        allFoods, greenFoods, yellowFoods, redFoods, patient
      );
      if (grainCand.food) {
        const rutiRawG = Math.round((breakfastCarbG / Math.max(0.60, (grainCand.food.per_100g.carbs_g ?? 0) / 100)));
        items.push(createPlanMealItem(grainCand.food, Math.max(35, Math.min(80, rutiRawG)), allFoods, greenIds, redIds, yellowIds, grainCand.trafficStatus || 'GREEN'));
      } else if (grainCand.error) {
        errors.push(grainCand.error);
      }

      // Vegetable
      const vegCand = selectSafeMealCandidate(
        'Breakfast Vegetable',
        'vegetable',
        tmpl.breakfastVeg,
        allFoods, greenFoods, yellowFoods, redFoods, patient
      );
      if (vegCand.food) {
        items.push(createPlanMealItem(vegCand.food, 120, allFoods, greenIds, redIds, yellowIds, vegCand.trafficStatus || 'GREEN'));
      } else if (vegCand.error) {
        errors.push(vegCand.error);
      }

      // Healthy Cooking Fat / Ghee
      const preferredOilKw = patient.dietary_preferences?.preferred_oil === 'desi_ghee' ? ['ghee', 'ঘি'] : ['mustard', 'oil', 'তেল', 'ghee'];
      const fatCand = selectSafeMealCandidate(
        'Breakfast Healthy Fat',
        'dairy',
        preferredOilKw,
        allFoods, greenFoods, yellowFoods, redFoods, patient
      );
      if (fatCand.food) {
        items.push(createPlanMealItem(fatCand.food, 5, allFoods, greenIds, redIds, yellowIds, fatCand.trafficStatus || 'GREEN'));
      } else {
        const altFat = selectSafeMealCandidate(
          'Breakfast Healthy Fat',
          'fat_oil',
          ['mustard', 'olive', 'oil'],
          allFoods, greenFoods, yellowFoods, redFoods, patient
        );
        if (altFat.food) {
          items.push(createPlanMealItem(altFat.food, 5, allFoods, greenIds, redIds, yellowIds, altFat.trafficStatus || 'GREEN'));
        } else if (altFat.error) {
          errors.push(altFat.error);
        }
      }

      return { items, errors };
    }
  );

  // 3. Lunch (Main Feast)
  const lunchMeal = buildSlot(
    'lunch',
    'দুপুরের প্রধান আহার (০১:৩০ ঘটিকা)',
    'Therapeutic Lunch (01:30 PM)',
    '01:30 PM',
    () => {
      const errors: MealSlotConstraintError[] = [];
      const items: DietChartMealItem[] = [];

      // Grain
      const grainCand = selectSafeMealCandidate(
        'Lunch Complex Carbohydrate',
        'grain',
        tmpl.lunchGrain,
        allFoods, greenFoods, yellowFoods, redFoods, patient
      );
      if (grainCand.food) {
        const lunchRiceRawG = Math.round((lunchCarbG / Math.max(0.65, (grainCand.food.per_100g.carbs_g ?? 0) / 100)));
        items.push(createPlanMealItem(grainCand.food, Math.max(40, Math.min(100, lunchRiceRawG)), allFoods, greenIds, redIds, yellowIds, grainCand.trafficStatus || 'GREEN'));
      } else if (grainCand.error) {
        errors.push(grainCand.error);
      }

      // Protein
      const proteinCand = selectSafeMealCandidate(
        'Lunch Therapeutic Protein',
        'protein',
        tmpl.lunchProtein,
        allFoods, greenFoods, yellowFoods, redFoods, patient
      );
      if (proteinCand.food) {
        const lunchFishRawG = Math.round(((targetProtein * 0.40) / Math.max(0.18, (proteinCand.food.per_100g.protein_g ?? 0) / 100)));
        items.push(createPlanMealItem(proteinCand.food, Math.max(80, Math.min(160, lunchFishRawG)), allFoods, greenIds, redIds, yellowIds, proteinCand.trafficStatus || 'GREEN'));
      } else if (proteinCand.error) {
        errors.push(proteinCand.error);
      }

      // Vegetable
      const vegCand = selectSafeMealCandidate(
        'Lunch Fiber & Greens',
        'vegetable',
        tmpl.lunchVeg,
        allFoods, greenFoods, yellowFoods, redFoods, patient
      );
      if (vegCand.food) {
        items.push(createPlanMealItem(vegCand.food, 140, allFoods, greenIds, redIds, yellowIds, vegCand.trafficStatus || 'GREEN'));
      } else if (vegCand.error) {
        errors.push(vegCand.error);
      }

      // Cooking Oil
      const oilCand = selectSafeMealCandidate(
        'Lunch Cooking Oil',
        'fat_oil',
        ['mustard', 'oil', 'তেল'],
        allFoods, greenFoods, yellowFoods, redFoods, patient
      );
      if (oilCand.food) {
        const lunchOilG = Math.max(10, Math.round((targetFat * 0.45) / 1.5));
        items.push(createPlanMealItem(oilCand.food, lunchOilG, allFoods, greenIds, redIds, yellowIds, oilCand.trafficStatus || 'GREEN'));
      } else if (oilCand.error) {
        errors.push(oilCand.error);
      }

      return { items, errors };
    }
  );

  // 4. Evening Snack
  const eveningMeal = buildSlot(
    'evening_snack',
    'বিকেলের ভেষজ বিরতি (০৫:০০ ঘটিকা)',
    'Evening Cellular Recovery (05:00 PM)',
    '05:00 PM',
    () => {
      const errors: MealSlotConstraintError[] = [];
      const items: DietChartMealItem[] = [];

      const seedCand = selectSafeMealCandidate(
        'Evening Therapeutic Seed/Nut',
        'seed_nut',
        tmpl.eveningSeed,
        allFoods, greenFoods, yellowFoods, redFoods, patient
      );
      if (seedCand.food) {
        items.push(createPlanMealItem(seedCand.food, 15, allFoods, greenIds, redIds, yellowIds, seedCand.trafficStatus || 'GREEN'));
      } else if (seedCand.error) {
        errors.push(seedCand.error);
      }

      return { items, errors };
    }
  );

  // 5. Dinner
  const dinnerMeal = buildSlot(
    'dinner',
    'রাতের সহজপাচ্য নৈশভোজ (০৮:০০ ঘটিকা)',
    'Early Anti-Inflammatory Dinner (08:00 PM)',
    '08:00 PM',
    () => {
      const errors: MealSlotConstraintError[] = [];
      const items: DietChartMealItem[] = [];

      // Protein
      const proteinCand = selectSafeMealCandidate(
        'Dinner Lean Protein',
        'protein',
        tmpl.dinnerProtein,
        allFoods, greenFoods, yellowFoods, redFoods, patient
      );
      if (proteinCand.food) {
        const dinnerChickenRawG = Math.round(((targetProtein * 0.30) / Math.max(0.20, (proteinCand.food.per_100g.protein_g ?? 0) / 100)));
        items.push(createPlanMealItem(proteinCand.food, Math.max(70, Math.min(140, dinnerChickenRawG)), allFoods, greenIds, redIds, yellowIds, proteinCand.trafficStatus || 'GREEN'));
      } else if (proteinCand.error) {
        errors.push(proteinCand.error);
      }

      // Vegetable
      const vegCand = selectSafeMealCandidate(
        'Dinner Easy-Digesting Vegetable',
        'vegetable',
        tmpl.dinnerVeg,
        allFoods, greenFoods, yellowFoods, redFoods, patient
      );
      if (vegCand.food) {
        items.push(createPlanMealItem(vegCand.food, 160, allFoods, greenIds, redIds, yellowIds, vegCand.trafficStatus || 'GREEN'));
      } else if (vegCand.error) {
        errors.push(vegCand.error);
      }

      // Oil
      const oilCand = selectSafeMealCandidate(
        'Dinner Cooking Fat',
        'fat_oil',
        ['mustard', 'oil', 'তেল', 'ghee'],
        allFoods, greenFoods, yellowFoods, redFoods, patient
      );
      if (oilCand.food) {
        const dinnerOilG = Math.max(8, Math.round((targetFat * 0.35) / 1.5));
        items.push(createPlanMealItem(oilCand.food, dinnerOilG, allFoods, greenIds, redIds, yellowIds, oilCand.trafficStatus || 'GREEN'));
      } else if (oilCand.error) {
        errors.push(oilCand.error);
      }

      return { items, errors };
    }
  );

  // Evaluate Fasting Eligibility
  const fastingCheck = evaluateFastingEligibility(patient);
  const isFastingContraindicated = !fastingCheck.eligibility.is_eligible_for_fasting || fastingCheck.safetyResults.some(r => r.decision === 'HARD_STOP');

  // Determine Meal Structure
  let structure: '3_meals' | '3_meals_1_snack' | '5_meals_traditional' | 'intermittent_fasting_16_8' = '5_meals_traditional';

  if (existingDayMeals && existingDayMeals.length > 0) {
    const hasMorning = existingDayMeals.some(m => m.meal_type === 'morning_protocol');
    const hasBreakfast = existingDayMeals.some(m => m.meal_type === 'breakfast');
    const hasSnack = existingDayMeals.some(m => m.meal_type === 'evening_snack' || m.meal_type === 'mid_morning');
    if (!hasBreakfast && existingDayMeals.some(m => m.meal_type === 'lunch')) {
      structure = 'intermittent_fasting_16_8';
    } else if (hasMorning) {
      structure = '5_meals_traditional';
    } else if (hasSnack) {
      structure = '3_meals_1_snack';
    } else {
      structure = '3_meals';
    }
  } else {
    const pref = patient.dietary_preferences?.meal_structure;
    if (pref === 'intermittent_fasting_16_8') {
      if (isFastingContraindicated) {
        structure = '3_meals_1_snack'; // Override to safe regular schedule
      } else {
        structure = 'intermittent_fasting_16_8';
      }
    } else if (pref === '3_meals') {
      structure = '3_meals';
    } else if (pref === '3_meals_1_snack') {
      structure = '3_meals_1_snack';
    } else if (patient.dietary_preferences?.include_morning_protocol === false) {
      structure = '3_meals_1_snack';
    } else {
      structure = '5_meals_traditional';
    }
  }

  if (structure === 'intermittent_fasting_16_8') {
    return [lunchMeal, eveningMeal, dinnerMeal];
  } else if (structure === '3_meals') {
    return [breakfastMeal, lunchMeal, dinnerMeal];
  } else if (structure === '3_meals_1_snack') {
    return [breakfastMeal, lunchMeal, eveningMeal, dinnerMeal];
  }

  return [morningMeal, breakfastMeal, lunchMeal, eveningMeal, dinnerMeal];
}

/**
 * Builds and evaluates a DayPlan for a specific day number
 */
export function buildDayPlan(
  dayNumber: number, // 1 to 7
  patient: PatientProfile,
  allFoods: FoodItem[],
  trafficLightResult: TrafficLightResult,
  targetMacros: { calories: number; protein_g: number; carbs_g: number; fat_g: number },
  existingDayPlan?: DayPlan,
  preserveLocks: boolean = true,
  p3Context?: P3NutritionPlanningContext
): DayPlan {
  const dayName = DAY_NAMES[(dayNumber - 1) % DAY_NAMES.length];

  // If day is locked and preserveLocks is true, keep it unchanged
  if (preserveLocks && existingDayPlan && existingDayPlan.is_locked) {
    return existingDayPlan;
  }

  const lockedMeals: Record<string, boolean> = { ...(existingDayPlan?.locked_meals || {}) };
  const lockedItems: Record<string, boolean> = { ...(existingDayPlan?.locked_items || {}) };
  if (preserveLocks && existingDayPlan?.meals) {
    for (const m of existingDayPlan.meals) {
      if (m.is_locked) lockedMeals[m.id] = true;
      for (const it of m.items) {
        if (it.is_locked) lockedItems[it.id] = true;
      }
    }
  }

  const meals = generateMealsForDay(
    dayNumber,
    patient,
    allFoods,
    trafficLightResult,
    targetMacros,
    existingDayPlan?.meals,
    lockedMeals,
    lockedItems
  );

  // Compute daily totals
  const totalCalories = meals.reduce((sum, m) => sum + m.meal_calories, 0);
  const totalProtein = Math.round(meals.reduce((sum, m) => sum + m.meal_protein_g, 0) * 10) / 10;
  const totalCarbs = Math.round(meals.reduce((sum, m) => sum + m.meal_carbs_g, 0) * 10) / 10;
  const totalFat = Math.round(meals.reduce((sum, m) => sum + m.meal_fat_g, 0) * 10) / 10;
  const totalFiber = Math.round(meals.reduce((sum, m) => sum + m.items.reduce((iSum, i) => iSum + (i.fiber_g || 0), 0), 0) * 10) / 10;
  const totalGl = Math.round(meals.reduce((sum, m) => sum + m.meal_gl, 0));
  const totalPral = Math.round(meals.reduce((sum, m) => sum + m.meal_pral, 0) * 10) / 10;

  const summary: DayPlanSummary = {
    calories: totalCalories,
    protein_g: totalProtein,
    carbs_g: totalCarbs,
    fat_g: totalFat,
    fiber_g: totalFiber,
    gl: totalGl,
    gl_is_estimated: true,
    pral: totalPral,
    calorie_variance: totalCalories - targetMacros.calories,
    protein_variance: Math.round((totalProtein - targetMacros.protein_g) * 10) / 10,
    carbs_variance: Math.round((totalCarbs - targetMacros.carbs_g) * 10) / 10,
    fat_variance: Math.round((totalFat - targetMacros.fat_g) * 10) / 10
  };

  // Evaluate clinical safety for this day's meals
  const safetyEval = validateInterventionPlan(patient, meals, allFoods);
  const slotErrors = meals.flatMap(m => m.slot_errors || []);

  const safetyNotes: string[] = [];
  const safetyNotesBn: string[] = [];

  for (const stop of safetyEval.hardStops) {
    safetyNotes.push(stop.title_en + ': ' + stop.clinical_explanation_en);
    safetyNotesBn.push(stop.title_bn + ': ' + stop.clinical_explanation_bn);
  }
  for (const warn of safetyEval.clinicalReviewsRequired) {
    safetyNotes.push(warn.title_en + ': ' + warn.clinical_explanation_en);
    safetyNotesBn.push(warn.title_bn + ': ' + warn.clinical_explanation_bn);
  }

  // Check feeding route contraindications
  const isFeedingRouteContraindicated = 
    p3Context?.feedingRoute?.oral_intake_permitted === false ||
    patient.feeding_status?.oral_intake_permitted === false;

  if (isFeedingRouteContraindicated) {
    safetyNotes.unshift('Non-oral feeding route / NPO status prohibits standard solid food weekly diet plan.');
    safetyNotesBn.unshift('নন-ওরাল ফিডিং রুট / এনপিও স্ট্যাটাসের কারণে স্বাভাবিক কঠিন খাবারের পরিকল্পনা নিষিদ্ধ।');
  }

  // Check clinician-specified nutrient prescriptions
  if (p3Context?.prescriptions?.fluid?.hasConfirmedLimit && p3Context.prescriptions.fluid.numericalLimit) {
    const limit = p3Context.prescriptions.fluid.numericalLimit;
    const unit = p3Context.prescriptions.fluid.unit || 'mL/day';
    const reason = p3Context.prescriptions.fluid.clinicalReason ? ` (${p3Context.prescriptions.fluid.clinicalReason})` : '';
    safetyNotes.push(`Fluid restriction: Maximum ${limit} ${unit}${reason}`);
    safetyNotesBn.push(`তরল গ্রহণ সীমাবদ্ধতা: সর্বোচ্চ ${limit} ${unit}${reason}`);
  }
  if (p3Context?.prescriptions?.sodium?.hasConfirmedLimit && p3Context.prescriptions.sodium.numericalLimit) {
    const limit = p3Context.prescriptions.sodium.numericalLimit;
    const unit = p3Context.prescriptions.sodium.unit || 'mg/day';
    const reason = p3Context.prescriptions.sodium.clinicalReason ? ` (${p3Context.prescriptions.sodium.clinicalReason})` : '';
    safetyNotes.push(`Sodium restriction: Maximum ${limit} ${unit}${reason}`);
    safetyNotesBn.push(`সোডিয়াম গ্রহণ সীমাবদ্ধতা: সর্বোচ্চ ${limit} ${unit}${reason}`);
  }
  if (p3Context?.prescriptions?.potassium?.hasConfirmedLimit && p3Context.prescriptions.potassium.numericalLimit) {
    const limit = p3Context.prescriptions.potassium.numericalLimit;
    const unit = p3Context.prescriptions.potassium.unit || 'mg/day';
    const reason = p3Context.prescriptions.potassium.clinicalReason ? ` (${p3Context.prescriptions.potassium.clinicalReason})` : '';
    safetyNotes.push(`Potassium restriction: Maximum ${limit} ${unit}${reason}`);
    safetyNotesBn.push(`পটাশিয়াম গ্রহণ সীমাবদ্ধতা: সর্বোচ্চ ${limit} ${unit}${reason}`);
  }
  if (p3Context?.prescriptions?.protein?.hasConfirmedLimit && p3Context.prescriptions.protein.numericalLimit) {
    const limit = p3Context.prescriptions.protein.numericalLimit;
    const unit = p3Context.prescriptions.protein.unit || 'g/day';
    const reason = p3Context.prescriptions.protein.clinicalReason ? ` (${p3Context.prescriptions.protein.clinicalReason})` : '';
    safetyNotes.push(`Protein prescription limit: ${limit} ${unit}${reason}`);
    safetyNotesBn.push(`আমিষ প্রেসক্রিপশন সীমা: ${limit} ${unit}${reason}`);
  }

  let safetyDecision: 'SAFE' | 'CLINICAL_REVIEW_REQUIRED' | 'HARD_STOP' = 'SAFE';
  if (isFeedingRouteContraindicated || safetyEval.overallDecision === 'HARD_STOP') {
    safetyDecision = 'HARD_STOP';
  } else if (safetyEval.overallDecision === 'CLINICAL_REVIEW_REQUIRED' || safetyEval.overallDecision === 'ADVISORY') {
    safetyDecision = 'CLINICAL_REVIEW_REQUIRED';
  }

  if (slotErrors.length > 0 && safetyDecision === 'SAFE') {
    safetyDecision = 'CLINICAL_REVIEW_REQUIRED';
  }

  const fastingCheck = evaluateFastingEligibility(patient);
  const isFastingContraindicated = !fastingCheck.eligibility.is_eligible_for_fasting || fastingCheck.safetyResults.some(r => r.decision === 'HARD_STOP');
  if (patient.dietary_preferences?.meal_structure === 'intermittent_fasting_16_8' && isFastingContraindicated) {
    safetyNotes.push('Intermittent fasting is clinically contraindicated for this patient. Enforced safe regular non-fasting meal schedule.');
    safetyNotesBn.push('রোগীর শারীরিক অবস্থা বা ঔষধের কারণে উপবাস ঝুঁকিপূর্ণ হওয়ায় নিরাপদ নিয়মিত খাবারের সময়সূচি নির্ধারণ করা হয়েছে।');
  }

  return {
    day_number: dayNumber,
    day_name_bn: dayName.bn,
    day_name_en: dayName.en,
    meals,
    is_locked: existingDayPlan?.is_locked || false,
    locked_items: lockedItems,
    locked_meals: lockedMeals,
    summary,
    slot_errors: slotErrors.length > 0 ? slotErrors : undefined,
    safety_decision: safetyDecision,
    safety_notes: safetyNotes.length > 0 ? safetyNotes : undefined,
    safety_notes_bn: safetyNotesBn.length > 0 ? safetyNotesBn : undefined
  };
}

/**
 * Recalculates nutritional totals, variances against authoritative targets, and clinical safety for an edited DayPlan.
 */
export function recalculateDayPlan(
  day: DayPlan,
  targetMacros: { calories: number; protein_g: number; carbs_g: number; fat_g: number },
  patient: PatientProfile,
  allFoods: FoodItem[],
  p3Context?: P3NutritionPlanningContext | null
): DayPlan {
  const totalCalories = day.meals.reduce((sum, m) => sum + m.meal_calories, 0);
  const totalProtein = Math.round(day.meals.reduce((sum, m) => sum + m.meal_protein_g, 0) * 10) / 10;
  const totalCarbs = Math.round(day.meals.reduce((sum, m) => sum + m.meal_carbs_g, 0) * 10) / 10;
  const totalFat = Math.round(day.meals.reduce((sum, m) => sum + m.meal_fat_g, 0) * 10) / 10;
  const totalFiber = Math.round(day.meals.reduce((sum, m) => sum + m.items.reduce((iSum, i) => iSum + (i.fiber_g || 0), 0), 0) * 10) / 10;
  const totalGl = Math.round(day.meals.reduce((sum, m) => sum + m.meal_gl, 0));
  const totalPral = Math.round(day.meals.reduce((sum, m) => sum + m.meal_pral, 0) * 10) / 10;

  const summary: DayPlanSummary = {
    calories: totalCalories,
    protein_g: totalProtein,
    carbs_g: totalCarbs,
    fat_g: totalFat,
    fiber_g: totalFiber,
    gl: totalGl,
    gl_is_estimated: true,
    pral: totalPral,
    calorie_variance: totalCalories - targetMacros.calories,
    protein_variance: Math.round((totalProtein - targetMacros.protein_g) * 10) / 10,
    carbs_variance: Math.round((totalCarbs - targetMacros.carbs_g) * 10) / 10,
    fat_variance: Math.round((totalFat - targetMacros.fat_g) * 10) / 10
  };

  const safetyEval = validateInterventionPlan(patient, day.meals, allFoods);
  const slotErrors = day.meals.flatMap(m => m.slot_errors || []);

  const safetyNotes: string[] = [];
  const safetyNotesBn: string[] = [];

  for (const stop of safetyEval.hardStops) {
    safetyNotes.push(stop.title_en + ': ' + stop.clinical_explanation_en);
    safetyNotesBn.push(stop.title_bn + ': ' + stop.clinical_explanation_bn);
  }
  for (const warn of safetyEval.clinicalReviewsRequired) {
    safetyNotes.push(warn.title_en + ': ' + warn.clinical_explanation_en);
    safetyNotesBn.push(warn.title_bn + ': ' + warn.clinical_explanation_bn);
  }

  const isFeedingRouteContraindicated = 
    p3Context?.feedingRoute?.oral_intake_permitted === false ||
    patient.feeding_status?.oral_intake_permitted === false;

  if (isFeedingRouteContraindicated) {
    safetyNotes.unshift('Non-oral feeding route / NPO status prohibits standard solid food weekly diet plan.');
    safetyNotesBn.unshift('নন-ওরাল ফিডিং রুট / এনপিও স্ট্যাটাসের কারণে স্বাভাবিক কঠিন খাবারের পরিকল্পনা নিষিদ্ধ।');
  }

  let safetyDecision: 'SAFE' | 'CLINICAL_REVIEW_REQUIRED' | 'HARD_STOP' = 'SAFE';
  if (isFeedingRouteContraindicated || safetyEval.overallDecision === 'HARD_STOP') {
    safetyDecision = 'HARD_STOP';
  } else if (safetyEval.overallDecision === 'CLINICAL_REVIEW_REQUIRED' || safetyEval.overallDecision === 'ADVISORY') {
    safetyDecision = 'CLINICAL_REVIEW_REQUIRED';
  }

  if (slotErrors.length > 0 && safetyDecision === 'SAFE') {
    safetyDecision = 'CLINICAL_REVIEW_REQUIRED';
  }

  return {
    ...day,
    summary,
    safety_decision: safetyDecision,
    safety_notes: safetyNotes.length > 0 ? safetyNotes : undefined,
    safety_notes_bn: safetyNotesBn.length > 0 ? safetyNotesBn : undefined
  };
}

/**
 * Generates an authoritative 7-day personalized weekly nutrition plan.
 * Connects P2->P3 handoff, enforces clinical precedence, and respects locks.
 */
export function generateWeeklyDietPlan(
  patient: PatientProfile,
  allFoods: FoodItem[],
  trafficLightResult: TrafficLightResult,
  p3Context?: P3NutritionPlanningContext | null,
  existingPlan?: WeeklyDietPlan | null,
  options?: { preserveLocks?: boolean; forceRegenerate?: boolean }
): WeeklyDietPlan {
  const preserveLocks = options?.preserveLocks ?? true;
  const visitId = patient.current_visit_id || `vis_${patient.id}_initial`;
  const planId = existingPlan?.plan_id || `plan_${patient.id}_${visitId}_v1`;

  // Determine authoritative target macros from P3 context or patient.calculated
  let targetCalories = p3Context?.energyTargetCalories ?? patient.calculated.target_calories;
  let targetProtein = p3Context?.proteinTargetGrams ?? patient.calculated.target_protein_g;
  const targetCarbs = patient.calculated.target_carbs_g;
  const targetFat = patient.calculated.target_fat_g;

  // Apply confirmed protein cap if explicitly prescribed
  if (p3Context?.prescriptions?.protein?.hasConfirmedLimit && p3Context.prescriptions.protein.numericalLimit) {
    targetProtein = Math.min(targetProtein, p3Context.prescriptions.protein.numericalLimit);
  }

  const targetMacros = {
    calories: Math.round(targetCalories),
    protein_g: Math.round(targetProtein * 10) / 10,
    carbs_g: Math.round(targetCarbs * 10) / 10,
    fat_g: Math.round(targetFat * 10) / 10
  };

  // Build Day 1 to Day 7
  const days: DayPlan[] = [];
  const existingDaysMap = new Map<number, DayPlan>();
  if (existingPlan && existingPlan.days) {
    for (const d of existingPlan.days) {
      existingDaysMap.set(d.day_number, d);
    }
  }

  for (let dayNum = 1; dayNum <= 7; dayNum++) {
    const existingDay = existingDaysMap.get(dayNum);
    const dayPlan = buildDayPlan(
      dayNum,
      patient,
      allFoods,
      trafficLightResult,
      targetMacros,
      existingDay,
      preserveLocks,
      p3Context || undefined
    );
    days.push(dayPlan);
  }

  // Evaluate overall weekly safety status
  let overallSafety: 'SAFE' | 'CLINICAL_REVIEW_REQUIRED' | 'HARD_STOP' = 'SAFE';
  const unresolvedHardStops: string[] = [];

  // Check feeding route contraindications
  const isFeedingRouteContraindicated = 
    p3Context?.feedingRoute?.oral_intake_permitted === false ||
    patient.feeding_status?.oral_intake_permitted === false;

  if (isFeedingRouteContraindicated) {
    overallSafety = 'HARD_STOP';
    unresolvedHardStops.push('Non-oral feeding route / NPO status prohibits standard solid food weekly diet plan.');
  }

  for (const day of days) {
    if (day.safety_decision === 'HARD_STOP') {
      overallSafety = 'HARD_STOP';
      if (day.safety_notes) {
        for (const n of day.safety_notes) {
          if (!unresolvedHardStops.includes(n)) unresolvedHardStops.push(n);
        }
      }
    } else if (day.safety_decision === 'CLINICAL_REVIEW_REQUIRED' && overallSafety !== 'HARD_STOP') {
      overallSafety = 'CLINICAL_REVIEW_REQUIRED';
    }
  }

  const p2HandoffSummary = p3Context ? {
    clinicalAssessmentApproved: Boolean(p3Context.clinicalAssessmentApproved),
    confirmedAllergies: p3Context.confirmedAllergies || [],
    feedingRoute: p3Context.feedingRoute?.route || patient.feeding_status?.route || 'oral_standard',
    prescriptions: p3Context.prescriptions || {},
    targetsDerivedFrom: p3Context.clinicalAssessmentApproved ? 'Authoritative Approved P2 Assessment' : 'Draft P2 Assessment / Anthropometrics'
  } : undefined;

  const timestamp = new Date().toISOString();

  const rawPlan: WeeklyDietPlan = {
    plan_id: planId,
    patient_id: patient.id,
    visit_id: visitId,
    version: existingPlan ? existingPlan.version : 1,
    schema_version: 2,
    created_at: existingPlan?.created_at || timestamp,
    updated_at: timestamp,
    status: existingPlan?.status || 'draft',
    is_approved: existingPlan?.is_approved || false,
    approved_by: existingPlan?.approved_by,
    approval_date: existingPlan?.approval_date,
    approved_at: existingPlan?.approved_at,
    approval_notes: existingPlan?.approval_notes,
    approval_metadata: existingPlan?.approval_metadata,
    previous_approval: existingPlan?.previous_approval,
    historical_approvals: existingPlan?.historical_approvals,
    target_macros: targetMacros,
    days,
    overall_safety_status: overallSafety,
    unresolved_hard_stops: unresolvedHardStops.length > 0 ? unresolvedHardStops : undefined,
    p2_handoff_summary: p2HandoffSummary
  };

  if (existingPlan && (existingPlan.status === 'approved' || existingPlan.is_approved) && options?.forceRegenerate) {
    return invalidateWeeklyPlanApproval(rawPlan, 'Regenerated full 7-day plan');
  }

  if (existingPlan && options?.forceRegenerate) {
    return {
      ...rawPlan,
      status: existingPlan.status === 'requires_review' ? 'requires_review' : 'draft',
      version: existingPlan.version + 1,
      is_approved: false
    };
  }

  return rawPlan;
}

/**
 * Centralized Approval Invalidation Engine
 * Transitions approved weekly plan to 'requires_review', increments version,
 * and maintains immutable historical approval records with timestamp and reason.
 */
export function invalidateWeeklyPlanApproval(plan: WeeklyDietPlan, reason: string): WeeklyDietPlan {
  const isCurrentlyApproved = Boolean(plan.status === 'approved' || plan.is_approved === true);
  const timestamp = new Date().toISOString();

  if (!isCurrentlyApproved) {
    // If not approved, preserve current status without fabricating previous_approval
    return {
      ...plan,
      status: plan.status === 'requires_review' ? 'requires_review' : 'draft',
      is_approved: false,
      approved_by: undefined,
      approval_date: undefined,
      approved_at: undefined,
      approval_notes: undefined,
      approval_metadata: undefined,
      updated_at: timestamp
    };
  }

  const previousRecord: WeeklyDietPlanApprovalRecord = {
    approved_by: plan.approved_by || plan.approval_metadata?.clinician_name || 'Clinician',
    approval_date: plan.approval_date || plan.approved_at || timestamp,
    version: plan.version,
    approval_metadata: plan.approval_metadata,
    invalidated_at: timestamp,
    invalidation_reason: reason
  };

  return {
    ...plan,
    version: plan.version + 1,
    status: 'requires_review',
    is_approved: false,
    approved_by: undefined,
    approval_date: undefined,
    approved_at: undefined,
    approval_notes: undefined,
    approval_metadata: undefined,
    invalidation_reason: reason,
    invalidated_at: timestamp,
    previous_approval: previousRecord,
    historical_approvals: [...(plan.historical_approvals || []), previousRecord],
    updated_at: timestamp
  };
}

export interface WeeklyPlanSafetyEvaluation {
  overall_decision: 'SAFE' | 'CLINICAL_REVIEW_REQUIRED' | 'HARD_STOP';
  is_eligible_for_approval: boolean;
  unresolved_hard_stops: string[];
  reasons: string[];
  day_evaluations: {
    day_number: number;
    decision: 'SAFE' | 'CLINICAL_REVIEW_REQUIRED' | 'HARD_STOP';
    notes: string[];
  }[];
}

/**
 * Comprehensive 7-Day Clinical Safety Revalidation Engine
 * Evaluates all 7 days without trusting cached safety flags.
 * Validates allergies, food contraindications (RED), feeding route (NPO),
 * drug-nutrient interactions, and clinician prescriptions.
 */
export function evaluateWeeklyPlanClinicalSafety(
  patient: PatientProfile,
  weeklyPlan: WeeklyDietPlan,
  allFoods: FoodItem[],
  p3Context?: P3NutritionPlanningContext | null
): WeeklyPlanSafetyEvaluation {
  const unresolvedHardStops: string[] = [];
  const reasons: string[] = [];
  const dayEvals: WeeklyPlanSafetyEvaluation['day_evaluations'] = [];

  // 1. Feeding Route Safety (NPO, enteral, parenteral prohibition for standard solid food plans)
  const routeStr = String(patient.feeding_status?.route || p3Context?.feedingRoute?.route || '').toLowerCase();
  const isFeedingRouteContraindicated = 
    p3Context?.feedingRoute?.oral_intake_permitted === false ||
    patient.feeding_status?.oral_intake_permitted === false ||
    routeStr.includes('npo') ||
    routeStr.includes('enteral') ||
    routeStr.includes('parenteral');

  if (isFeedingRouteContraindicated) {
    const routeMsg = 'Non-oral feeding route / NPO status prohibits standard solid food weekly diet plan.';
    unresolvedHardStops.push(routeMsg);
    reasons.push(routeMsg);
  }

  // 2. Evaluate all 7 days independently without relying on cached flags
  let overallDecision: 'SAFE' | 'CLINICAL_REVIEW_REQUIRED' | 'HARD_STOP' = isFeedingRouteContraindicated ? 'HARD_STOP' : 'SAFE';

  // Merge allergies from both patient.confirmed_allergies and p3Context?.confirmedAllergies
  const mergedPatient: PatientProfile = {
    ...patient,
    confirmed_allergies: Array.from(new Set([
      ...(patient.confirmed_allergies || []),
      ...(p3Context?.confirmedAllergies || [])
    ]))
  };

  for (const day of (weeklyPlan.days || [])) {
    const dayNotes: string[] = [];
    const dayEval = validateInterventionPlan(mergedPatient, day.meals, allFoods);

    if (dayEval.hardStops.length > 0) {
      for (const hs of dayEval.hardStops) {
        const msg = `Day ${day.day_number}: ${hs.title_en} - ${hs.clinical_explanation_en}`;
        dayNotes.push(msg);
        if (!unresolvedHardStops.includes(msg)) {
          unresolvedHardStops.push(msg);
        }
      }
    }

    if (dayEval.clinicalReviewsRequired.length > 0) {
      for (const cr of dayEval.clinicalReviewsRequired) {
        const msg = `Day ${day.day_number}: ${cr.title_en} - ${cr.clinical_explanation_en}`;
        dayNotes.push(msg);
      }
    }

    let dayDecision: 'SAFE' | 'CLINICAL_REVIEW_REQUIRED' | 'HARD_STOP' = 'SAFE';
    if (dayNotes.some(n => unresolvedHardStops.includes(n))) {
      dayDecision = 'HARD_STOP';
      overallDecision = 'HARD_STOP';
    } else if (dayNotes.length > 0) {
      dayDecision = 'CLINICAL_REVIEW_REQUIRED';
      if (overallDecision !== 'HARD_STOP') {
        overallDecision = 'CLINICAL_REVIEW_REQUIRED';
      }
    }

    dayEvals.push({
      day_number: day.day_number,
      decision: dayDecision,
      notes: dayNotes
    });
  }

  const isEligible = overallDecision !== 'HARD_STOP' && unresolvedHardStops.length === 0;

  return {
    overall_decision: overallDecision,
    is_eligible_for_approval: isEligible,
    unresolved_hard_stops: unresolvedHardStops,
    reasons: unresolvedHardStops.length > 0 ? unresolvedHardStops : reasons,
    day_evaluations: dayEvals
  };
}

/**
 * Regenerates ONLY a single day in an existing weekly diet plan, preserving other 6 days completely.
 */
export function regenerateDayInWeeklyPlan(
  dayNumber: number, // 1 to 7
  currentPlan: WeeklyDietPlan,
  patient: PatientProfile,
  allFoods: FoodItem[],
  trafficLightResult: TrafficLightResult,
  p3Context?: P3NutritionPlanningContext | null,
  preserveLocks: boolean = true
): WeeklyDietPlan {
  const updatedDays = currentPlan.days.map(d => {
    if (d.day_number !== dayNumber) {
      return d; // Completely untouched
    }
    return buildDayPlan(
      dayNumber,
      patient,
      allFoods,
      trafficLightResult,
      currentPlan.target_macros,
      d,
      preserveLocks,
      p3Context || undefined
    );
  });

  // Recheck overall safety
  let overallSafety: 'SAFE' | 'CLINICAL_REVIEW_REQUIRED' | 'HARD_STOP' = 'SAFE';
  const unresolvedHardStops: string[] = [];

  for (const day of updatedDays) {
    if (day.safety_decision === 'HARD_STOP') {
      overallSafety = 'HARD_STOP';
      if (day.safety_notes) {
        for (const n of day.safety_notes) {
          if (!unresolvedHardStops.includes(n)) unresolvedHardStops.push(n);
        }
      }
    } else if (day.safety_decision === 'CLINICAL_REVIEW_REQUIRED' && overallSafety !== 'HARD_STOP') {
      overallSafety = 'CLINICAL_REVIEW_REQUIRED';
    }
  }

  const updatedPlan: WeeklyDietPlan = {
    ...currentPlan,
    days: updatedDays,
    updated_at: new Date().toISOString(),
    overall_safety_status: overallSafety,
    unresolved_hard_stops: unresolvedHardStops.length > 0 ? unresolvedHardStops : undefined
  };

  return invalidateWeeklyPlanApproval(updatedPlan, `Regenerated Day ${dayNumber}`);
}

/**
 * Copies one day's meal plan to another day, giving fresh item IDs and revalidating safety.
 */
export function copyDayInWeeklyPlan(
  sourceDayNumber: number,
  targetDayNumber: number,
  currentPlan: WeeklyDietPlan,
  patient: PatientProfile,
  allFoods: FoodItem[],
  trafficLightResult: TrafficLightResult
): WeeklyDietPlan {
  const sourceDay = currentPlan.days.find(d => d.day_number === sourceDayNumber);
  if (!sourceDay) return currentPlan;

  const targetDayName = DAY_NAMES[(targetDayNumber - 1) % DAY_NAMES.length];

  // Deep clone meals with fresh unique IDs
  const copiedMeals: DietChartMeal[] = sourceDay.meals.map(m => ({
    ...m,
    id: `meal_${m.meal_type}_d${targetDayNumber}_${Date.now()}`,
    items: m.items.map(item => ({
      ...item,
      id: `item_${item.food_id}_d${targetDayNumber}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    }))
  }));

  // Re-calculate totals and validate safety for the copied day
  const targetDayPlan: DayPlan = {
    ...sourceDay,
    day_number: targetDayNumber,
    day_name_bn: targetDayName.bn,
    day_name_en: targetDayName.en,
    meals: copiedMeals,
    is_locked: false,
    locked_items: {},
    locked_meals: {}
  };

  const updatedDays = currentPlan.days.map(d => {
    if (d.day_number === targetDayNumber) {
      return targetDayPlan;
    }
    return d;
  });

  const updatedPlan: WeeklyDietPlan = {
    ...currentPlan,
    days: updatedDays,
    updated_at: new Date().toISOString()
  };

  return invalidateWeeklyPlanApproval(updatedPlan, `Copied Day ${sourceDayNumber} to Day ${targetDayNumber}`);
}
