import { 
  FoodItem, 
  DietChartMeal, 
  DietChartMealItem, 
  FoodExchangeItem, 
  IncompatiblePairWarning, 
  PatientProfile, 
  EvaluatedFoodItem,
  MealSlotConstraintError,
  FoodCategory,
  TrafficLightResult
} from '../types';

export function getCookedDisplay(food: FoodItem, rawGrams: number, cookedGrams: number): { bn: string; en: string } {
  const n = (food.name_en + ' ' + food.name_bn).toLowerCase();

  if (n.includes('rice') || n.includes('চাল') || n.includes('ভাত')) {
    const katori = Math.round((cookedGrams / 140) * 10) / 10;
    return {
      bn: `${Math.round(cookedGrams)} গ্রাম রান্না করা (প্রায় ${katori} মাঝারি বাটি / কাপ)`,
      en: `${Math.round(cookedGrams)}g cooked (~${katori} medium bowl/cup)`
    };
  }
  if (n.includes('ruti') || n.includes('roti') || n.includes('রুটি') || n.includes('atta') || n.includes('আটা')) {
    const pieces = Math.max(1, Math.round(rawGrams / 35));
    return {
      bn: `${Math.round(cookedGrams)} গ্রাম (${pieces} টি পাতলা হাতে তৈরি লাল আটার রুটি)`,
      en: `${Math.round(cookedGrams)}g (${pieces} handmade whole-wheat roti)`
    };
  }
  if (n.includes('dal') || n.includes('lentil') || n.includes('ডাল')) {
    const bati = Math.round((cookedGrams / 100) * 10) / 10;
    return {
      bn: `${Math.round(cookedGrams)} গ্রাম সেদ্ধ ডাল (প্রায় ${bati} বাটি পাতলা/ঘন ঝোল)`,
      en: `${Math.round(cookedGrams)}g cooked (~${bati} standard bowl)`
    };
  }
  if (n.includes('fish') || n.includes('মাছ')) {
    const pcs = Math.max(1, Math.round(rawGrams / 90));
    return {
      bn: `${Math.round(cookedGrams)} গ্রাম রান্না করা (${pcs} মাঝারি টুকরা)`,
      en: `${Math.round(cookedGrams)}g cooked (${pcs} medium cooked piece)`
    };
  }
  if (n.includes('chicken') || n.includes('মুরগি')) {
    const pcs = Math.max(1, Math.round(rawGrams / 50));
    return {
      bn: `${Math.round(cookedGrams)} গ্রাম রান্না করা (${pcs} মাঝারি টুকরা)`,
      en: `${Math.round(cookedGrams)}g cooked (${pcs} medium curry pieces)`
    };
  }
  if (n.includes('egg') || n.includes('ডিম')) {
    const eggCount = Math.max(1, Math.round(rawGrams / 50));
    return {
      bn: `${eggCount} টি গোটা ডিম (সিদ্ধ বা ঘিয়ে পোচ)`,
      en: `${eggCount} whole egg(s) (boiled or ghee poached)`
    };
  }
  if (n.includes('oil') || n.includes('তেল') || n.includes('ghee') || n.includes('ঘি')) {
    const tsp = Math.round((rawGrams / 5) * 10) / 10;
    return {
      bn: `${rawGrams} গ্রাম (প্রায় ${tsp} চা চামচ)`,
      en: `${rawGrams}g (~${tsp} teaspoon)`
    };
  }
  if (food.category === 'vegetable' || n.includes('shak') || n.includes('শাক')) {
    const bowl = Math.round((cookedGrams / 120) * 10) / 10;
    return {
      bn: `${Math.round(cookedGrams)} গ্রাম রান্না করা (প্রায় ${bowl} বাটি সবজি)`,
      en: `${Math.round(cookedGrams)}g cooked (~${bowl} vegetable bowl)`
    };
  }

  return {
    bn: `${Math.round(cookedGrams)} গ্রাম রান্না করা পরিবেশন`,
    en: `${Math.round(cookedGrams)}g prepared portion`
  };
}

export function detectIncompatibleCombinations(items: DietChartMealItem[]): IncompatiblePairWarning[] {
  const warnings: IncompatiblePairWarning[] = [];
  const text = items.map(i => (i.food_name_en + ' ' + i.food_name_bn).toLowerCase()).join(' ');

  // 1. Fish + Milk / Dairy (Viruddha Ahara)
  if ((text.includes('fish') || text.includes('মাছ')) && (text.includes('milk') || text.includes('দুধ') || text.includes('curd') || text.includes('দই'))) {
    warnings.push({
      warning_bn: "বিরুদ্ধ আহার সতর্কতা: মাছ এবং দুধ/দুগ্ধজাত খাবার একসাথে গ্রহণ হজমে জটিলতা ও অম্লপিত্ত তৈরি করে।",
      warning_en: "Incompatible Food Combination: Fish and dairy ingested concurrently perturb digestive fire (Viruddha Ahara).",
      severity: 'high'
    });
  }

  // 2. High Oxalate + High Iron Incompatible Pairing
  if (text.includes('spinach') && text.includes('iron')) {
    warnings.push({
      warning_bn: "অক্সালেট-আয়রন ব্লক: পালং শাকের অক্সালেট আয়রন শোষণ কমায়; লেবুর রস মিশিয়ে গ্রহণ করুন।",
      warning_en: "Oxalate-Mineral binding: Oxalates in spinach inhibit non-heme iron uptake; pair with fresh lemon juice (Vit C).",
      severity: 'medium'
    });
  }

  // 3. Raw Fruit immediately with heavy meal
  if (items.some(i => i.category === 'fruit') && items.some(i => i.category === 'protein' && i.raw_weight_g > 80)) {
    warnings.push({
      warning_bn: "ফল ও ভারী প্রোটিন: মিষ্টি ফল ভারী প্রোটিন খাবারের সাথে না খেয়ে খাবারের ২ ঘণ্টা পর বা খালি পেটে খাওয়া শ্রেয়।",
      warning_en: "Fruit timing: Simple sugars from fruits ferment when trapped behind slow-digesting animal proteins.",
      severity: 'medium'
    });
  }

  return warnings;
}

/**
 * Generate safe, clinically verified food exchanges.
 * Confirmed allergens, hard contraindications, and clinician-restricted foods are strictly excluded.
 */
export function generateExchangesForFood(
  food: FoodItem,
  rawGrams: number,
  allFoods: FoodItem[],
  greenFoodIds: Set<string>,
  redFoodIds: Set<string> = new Set(),
  yellowFoodIds: Set<string> = new Set()
): FoodExchangeItem[] {
  const targetKcal = (food.per_100g.kcal * rawGrams) / 100;
  const targetProtein = (food.per_100g.protein_g * rawGrams) / 100;

  // Candidates: Same exchange group, NOT red, NOT current food
  const candidates = allFoods.filter(f => 
    f.id !== food.id &&
    f.exchange_group === food.exchange_group &&
    !redFoodIds.has(f.id) &&
    (greenFoodIds.has(f.id) || yellowFoodIds.has(f.id) || (greenFoodIds.size === 0 && !redFoodIds.has(f.id)))
  );

  const exchanges: FoodExchangeItem[] = [];

  for (const cand of candidates.slice(0, 4)) {
    let scaledGrams = 100;
    if (food.exchange_group === 'grain' && cand.per_100g.kcal > 0) {
      scaledGrams = Math.round((targetKcal / cand.per_100g.kcal) * 100);
    } else if ((food.exchange_group === 'lean_protein' || food.exchange_group === 'fatty_protein') && cand.per_100g.protein_g > 0) {
      scaledGrams = Math.round((targetProtein / cand.per_100g.protein_g) * 100);
    } else if (cand.per_100g.kcal > 0) {
      scaledGrams = Math.round((targetKcal / cand.per_100g.kcal) * 100);
    }

    if (scaledGrams > 0 && scaledGrams < 500) {
      const cookedGrams = Math.round(scaledGrams * cand.raw_to_cooked_ratio);
      const display = getCookedDisplay(cand, scaledGrams, cookedGrams);
      const status: 'GREEN' | 'YELLOW' = greenFoodIds.has(cand.id) ? 'GREEN' : 'YELLOW';

      exchanges.push({
        food_id: cand.id,
        name_bn: cand.name_bn,
        name_en: cand.name_en,
        raw_weight_g: scaledGrams,
        cooked_display_bn: display.bn,
        cooked_display_en: display.en,
        kcal: Math.round((cand.per_100g.kcal * scaledGrams) / 100),
        protein_g: Math.round(((cand.per_100g.protein_g * scaledGrams) / 100) * 10) / 10,
        traffic_status: status
      });
    }
  }

  return exchanges;
}

interface SafeSelectionResult {
  food: FoodItem | null;
  trafficStatus: 'GREEN' | 'YELLOW' | null;
  error?: MealSlotConstraintError;
}

/**
 * Strict safety-constrained candidate selection engine.
 * Never silently substitutes unsafe/RED foods.
 * Returns structured MealSlotConstraintError if no eligible safe candidate exists.
 */
export function selectSafeMealCandidate(
  slotName: string,
  category: FoodCategory,
  preferredKeywords: string[],
  allFoods: FoodItem[],
  greenFoods: EvaluatedFoodItem[],
  yellowFoods: EvaluatedFoodItem[],
  redFoods: EvaluatedFoodItem[],
  patient: PatientProfile
): SafeSelectionResult {
  const redIds = new Set(redFoods.map(f => f.id));
  const greenIds = new Set(greenFoods.map(f => f.id));
  const yellowIds = new Set(yellowFoods.map(f => f.id));

  // Filter out preference violations (vegetarian, avoid_beef, avoid_mutton)
  const isExcludedByPreference = (f: FoodItem): boolean => {
    const text = `${f.name_en} ${f.name_bn} ${f.category}`.toLowerCase();
    if (patient.dietary_preferences?.is_vegetarian) {
      if (f.category === 'protein' && (text.includes('meat') || text.includes('fish') || text.includes('chicken') || text.includes('beef') || text.includes('mutton') || text.includes('egg') || text.includes('মাছ') || text.includes('মাংস') || text.includes('ডিম'))) {
        return true;
      }
    }
    if (patient.dietary_preferences?.avoid_beef && (text.includes('beef') || text.includes('গরু'))) {
      return true;
    }
    if (patient.dietary_preferences?.avoid_mutton && (text.includes('mutton') || text.includes('খাসি'))) {
      return true;
    }
    return false;
  };

  // 1. Try finding in GREEN foods matching preferred keywords
  for (const kw of preferredKeywords) {
    const match = greenFoods.find(f => 
      f.category === category && 
      !redIds.has(f.id) &&
      !isExcludedByPreference(f) &&
      (f.name_en.toLowerCase().includes(kw) || f.name_bn.toLowerCase().includes(kw) || f.id.toLowerCase().includes(kw))
    );
    if (match) {
      return { food: match, trafficStatus: 'GREEN' };
    }
  }

  // 2. Try any other GREEN food in this category
  const anyGreen = greenFoods.find(f => 
    f.category === category && 
    !redIds.has(f.id) && 
    !isExcludedByPreference(f)
  );
  if (anyGreen) {
    return { food: anyGreen, trafficStatus: 'GREEN' };
  }

  // 3. Try finding in YELLOW foods matching preferred keywords (conditional safety with notes)
  for (const kw of preferredKeywords) {
    const match = yellowFoods.find(f => 
      f.category === category && 
      !redIds.has(f.id) &&
      !isExcludedByPreference(f) &&
      (f.name_en.toLowerCase().includes(kw) || f.name_bn.toLowerCase().includes(kw) || f.id.toLowerCase().includes(kw))
    );
    if (match) {
      return { food: match, trafficStatus: 'YELLOW' };
    }
  }

  // 4. Try any other YELLOW food in this category
  const anyYellow = yellowFoods.find(f => 
    f.category === category && 
    !redIds.has(f.id) && 
    !isExcludedByPreference(f)
  );
  if (anyYellow) {
    return { food: anyYellow, trafficStatus: 'YELLOW' };
  }

  // 5. CRITICAL SAFETY: No safe candidate exists!
  // NEVER fall back to red foods, unrestricted database, or allFoods[0].
  const violatedConstraints: string[] = [];
  if (patient.confirmed_allergies && patient.confirmed_allergies.length > 0) {
    violatedConstraints.push(`Confirmed Allergies: ${patient.confirmed_allergies.join(', ')}`);
  }
  if (patient.clinician_disallowed_foods && patient.clinician_disallowed_foods.length > 0) {
    violatedConstraints.push(`Clinician Restricted Foods: ${patient.clinician_disallowed_foods.join(', ')}`);
  }
  if (patient.selected_conditions && patient.selected_conditions.length > 0) {
    violatedConstraints.push(`Active Conditions: ${patient.selected_conditions.join(', ')}`);
  }

  return {
    food: null,
    trafficStatus: null,
    error: {
      slot_name: slotName,
      category,
      reason_bn: `এই খাদ্য ক্যাটাগরির (${category}) জন্য কোনো সম্পূর্ণ নিরাপদ বা শর্তহীন খাদ্য পাওয়া যায়নি। রোগীর অ্যালার্জি, ক্লিনিক্যাল নিষেধাজ্ঞা অথবা রোগ সংঘাতের কারণে সব বিকল্প খাদ্য লাল তালিকায় রয়েছে। কৃত্রিম বা অনিরাপদ বিকল্প বাদ রাখা হয়েছে।`,
      reason_en: `No clinically safe food candidate available in category '${category}' for slot '${slotName}'. All potential candidates conflict with active allergies, clinician exclusions, or disease contraindications. Unsafe fallback was prevented.`,
      violated_constraints: violatedConstraints
    }
  };
}

export function buildAutoScaledDietChart(
  patient: PatientProfile,
  allFoods: FoodItem[],
  trafficLightResult: TrafficLightResult
): DietChartMeal[] {
  const { green: greenFoods, yellow: yellowFoods, red: redFoods } = trafficLightResult;
  const greenIds = new Set(greenFoods.map(f => f.id));
  const yellowIds = new Set(yellowFoods.map(f => f.id));
  const redIds = new Set(redFoods.map(f => f.id));

  const targetCalories = patient.calculated.target_calories;
  const targetProtein = patient.calculated.target_protein_g;
  const targetCarbs = patient.calculated.target_carbs_g;
  const targetFat = patient.calculated.target_fat_g;

  // Carb distribution
  const breakfastCarbG = Math.max(20, Math.round(targetCarbs * 0.25));
  const lunchCarbG = Math.max(30, Math.round(targetCarbs * 0.45));

  // Helper to create meal items with exchange alternatives and traffic status
  function createMealItem(
    food: FoodItem, 
    rawG: number, 
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
      kcal: Math.round(food.per_100g.kcal * multiplier),
      protein_g: Math.round(food.per_100g.protein_g * multiplier * 10) / 10,
      carbs_g: Math.round(food.per_100g.carbs_g * multiplier * 10) / 10,
      fat_g: Math.round(food.per_100g.fat_g * multiplier * 10) / 10,
      fiber_g: Math.round(food.per_100g.fiber_g * multiplier * 10) / 10,
      prep_note_bn: food.prep_note_bn,
      prep_note_en: food.prep_note_en,
      alternatives: generateExchangesForFood(food, rawG, allFoods, greenIds, redIds, yellowIds),
      traffic_status: trafficStatus
    };
  }

  function scoreMeal(items: DietChartMealItem[], slotErrors: MealSlotConstraintError[] = []) {
    const meal_calories = items.reduce((sum, i) => sum + i.kcal, 0);
    const meal_protein_g = Math.round(items.reduce((sum, i) => sum + i.protein_g, 0) * 10) / 10;
    const meal_carbs_g = Math.round(items.reduce((sum, i) => sum + i.carbs_g, 0) * 10) / 10;
    const meal_fat_g = Math.round(items.reduce((sum, i) => sum + i.fat_g, 0) * 10) / 10;

    // Approximate Glycemic Load (GL) with is_estimated flag
    const meal_gl = Math.round(items.reduce((sum, i) => {
      const food = allFoods.find(f => f.id === i.food_id);
      const estGi = food?.glycemic_load === 'low' ? 35 : food?.glycemic_load === 'medium' ? 55 : 75;
      return sum + ((i.carbs_g * estGi) / 100);
    }, 0));

    // PRAL score
    const meal_pral = Math.round(items.reduce((sum, i) => {
      const food = allFoods.find(f => f.id === i.food_id);
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

  // 1. Morning Protocol
  const morningErrors: MealSlotConstraintError[] = [];
  const morningItems: DietChartMealItem[] = [];
  const morningVeg = selectSafeMealCandidate(
    'Morning Hydration Vegetable',
    'vegetable',
    ['cucumber', 'gourd', 'papaya', 'শসা'],
    allFoods, greenFoods, yellowFoods, redFoods, patient
  );
  if (morningVeg.food) {
    morningItems.push(createMealItem(morningVeg.food, 80, morningVeg.trafficStatus || 'GREEN'));
  } else if (morningVeg.error) {
    morningErrors.push(morningVeg.error);
  }
  const morningScored = scoreMeal(morningItems, morningErrors);

  // 2. Breakfast
  const breakfastErrors: MealSlotConstraintError[] = [];
  const breakfastItems: DietChartMealItem[] = [];

  // Protein candidate
  const breakfastProtein = selectSafeMealCandidate(
    'Breakfast Protein',
    'protein',
    ['egg', 'chicken', 'ডিম', 'lentil', 'paneer'],
    allFoods, greenFoods, yellowFoods, redFoods, patient
  );
  if (breakfastProtein.food) {
    const eggCount = targetProtein > 80 ? 2 : 1;
    const proteinGrams = breakfastProtein.food.name_en.toLowerCase().includes('egg') ? eggCount * 50 : 60;
    breakfastItems.push(createMealItem(breakfastProtein.food, proteinGrams, breakfastProtein.trafficStatus || 'GREEN'));
  } else if (breakfastProtein.error) {
    breakfastErrors.push(breakfastProtein.error);
  }

  // Grain candidate
  const breakfastGrain = selectSafeMealCandidate(
    'Breakfast Grain',
    'grain',
    ['flour', 'roti', 'ruti', 'atta', 'oats', 'রুটি'],
    allFoods, greenFoods, yellowFoods, redFoods, patient
  );
  if (breakfastGrain.food) {
    const rutiRawG = Math.round((breakfastCarbG / Math.max(0.60, breakfastGrain.food.per_100g.carbs_g / 100)));
    breakfastItems.push(createMealItem(breakfastGrain.food, Math.max(35, Math.min(80, rutiRawG)), breakfastGrain.trafficStatus || 'GREEN'));
  } else if (breakfastGrain.error) {
    breakfastErrors.push(breakfastGrain.error);
  }

  // Vegetable candidate
  const breakfastVeg = selectSafeMealCandidate(
    'Breakfast Vegetable',
    'vegetable',
    ['papaya', 'gourd', 'pepe', 'পেঁপে', 'ঝিঙে'],
    allFoods, greenFoods, yellowFoods, redFoods, patient
  );
  if (breakfastVeg.food) {
    breakfastItems.push(createMealItem(breakfastVeg.food, 120, breakfastVeg.trafficStatus || 'GREEN'));
  } else if (breakfastVeg.error) {
    breakfastErrors.push(breakfastVeg.error);
  }

  // Fat/Oil candidate
  const preferredOilKw = patient.dietary_preferences?.preferred_oil === 'desi_ghee' ? ['ghee', 'ঘি'] : ['mustard', 'oil', 'তেল', 'ghee'];
  const breakfastFat = selectSafeMealCandidate(
    'Breakfast Healthy Fat',
    'dairy',
    preferredOilKw,
    allFoods, greenFoods, yellowFoods, redFoods, patient
  );
  if (breakfastFat.food) {
    breakfastItems.push(createMealItem(breakfastFat.food, 5, breakfastFat.trafficStatus || 'GREEN'));
  } else {
    // try fat_oil category
    const altFat = selectSafeMealCandidate(
      'Breakfast Healthy Fat',
      'fat_oil',
      ['mustard', 'olive', 'oil'],
      allFoods, greenFoods, yellowFoods, redFoods, patient
    );
    if (altFat.food) {
      breakfastItems.push(createMealItem(altFat.food, 5, altFat.trafficStatus || 'GREEN'));
    } else if (altFat.error) {
      breakfastErrors.push(altFat.error);
    }
  }
  const breakfastScored = scoreMeal(breakfastItems, breakfastErrors);

  // 3. Lunch (Main Feast)
  const lunchErrors: MealSlotConstraintError[] = [];
  const lunchItems: DietChartMealItem[] = [];

  // Lunch Grain
  const lunchGrain = selectSafeMealCandidate(
    'Lunch Complex Carbohydrate',
    'grain',
    ['rice', 'red rice', 'brown rice', 'চাল', 'ভাত'],
    allFoods, greenFoods, yellowFoods, redFoods, patient
  );
  if (lunchGrain.food) {
    const lunchRiceRawG = Math.round((lunchCarbG / Math.max(0.65, lunchGrain.food.per_100g.carbs_g / 100)));
    lunchItems.push(createMealItem(lunchGrain.food, Math.max(40, Math.min(100, lunchRiceRawG)), lunchGrain.trafficStatus || 'GREEN'));
  } else if (lunchGrain.error) {
    lunchErrors.push(lunchGrain.error);
  }

  // Lunch Protein
  const lunchProtein = selectSafeMealCandidate(
    'Lunch Therapeutic Protein',
    'protein',
    ['fish', 'rui', 'মাছ', 'chicken', 'lentil', 'ডাল'],
    allFoods, greenFoods, yellowFoods, redFoods, patient
  );
  if (lunchProtein.food) {
    const lunchFishRawG = Math.round(((targetProtein * 0.40) / Math.max(0.18, lunchProtein.food.per_100g.protein_g / 100)));
    lunchItems.push(createMealItem(lunchProtein.food, Math.max(80, Math.min(160, lunchFishRawG)), lunchProtein.trafficStatus || 'GREEN'));
  } else if (lunchProtein.error) {
    lunchErrors.push(lunchProtein.error);
  }

  // Lunch Vegetable
  const lunchVeg = selectSafeMealCandidate(
    'Lunch Fiber & Greens',
    'vegetable',
    ['spinach', 'shak', 'শাক', 'gourd', 'potol'],
    allFoods, greenFoods, yellowFoods, redFoods, patient
  );
  if (lunchVeg.food) {
    lunchItems.push(createMealItem(lunchVeg.food, 140, lunchVeg.trafficStatus || 'GREEN'));
  } else if (lunchVeg.error) {
    lunchErrors.push(lunchVeg.error);
  }

  // Lunch Oil
  const lunchOil = selectSafeMealCandidate(
    'Lunch Cooking Oil',
    'fat_oil',
    ['mustard', 'oil', 'তেল'],
    allFoods, greenFoods, yellowFoods, redFoods, patient
  );
  if (lunchOil.food) {
    const lunchOilG = Math.max(10, Math.round((targetFat * 0.45) / 1.5));
    lunchItems.push(createMealItem(lunchOil.food, lunchOilG, lunchOil.trafficStatus || 'GREEN'));
  } else if (lunchOil.error) {
    lunchErrors.push(lunchOil.error);
  }
  const lunchScored = scoreMeal(lunchItems, lunchErrors);

  // 4. Evening Snack
  const eveningErrors: MealSlotConstraintError[] = [];
  const eveningItems: DietChartMealItem[] = [];

  const eveningSeed = selectSafeMealCandidate(
    'Evening Therapeutic Seed/Nut',
    'seed_nut',
    ['seed', 'pumpkin', 'chia', 'বীজ'],
    allFoods, greenFoods, yellowFoods, redFoods, patient
  );
  if (eveningSeed.food) {
    eveningItems.push(createMealItem(eveningSeed.food, 15, eveningSeed.trafficStatus || 'GREEN'));
  } else if (eveningSeed.error) {
    eveningErrors.push(eveningSeed.error);
  }
  const eveningScored = scoreMeal(eveningItems, eveningErrors);

  // 5. Dinner
  const dinnerErrors: MealSlotConstraintError[] = [];
  const dinnerItems: DietChartMealItem[] = [];

  // Dinner Protein
  const dinnerProtein = selectSafeMealCandidate(
    'Dinner Lean Protein',
    'protein',
    ['chicken', 'মুরগি', 'fish', 'মাছ', 'egg', 'ডিম', 'tofu'],
    allFoods, greenFoods, yellowFoods, redFoods, patient
  );
  if (dinnerProtein.food) {
    const dinnerChickenRawG = Math.round(((targetProtein * 0.30) / Math.max(0.20, dinnerProtein.food.per_100g.protein_g / 100)));
    dinnerItems.push(createMealItem(dinnerProtein.food, Math.max(70, Math.min(140, dinnerChickenRawG)), dinnerProtein.trafficStatus || 'GREEN'));
  } else if (dinnerProtein.error) {
    dinnerErrors.push(dinnerProtein.error);
  }

  // Dinner Vegetable
  const dinnerVeg = selectSafeMealCandidate(
    'Dinner Easy-Digesting Vegetable',
    'vegetable',
    ['gourd', 'bottle gourd', 'লাউ', 'ঝিঙে', 'pepe'],
    allFoods, greenFoods, yellowFoods, redFoods, patient
  );
  if (dinnerVeg.food) {
    dinnerItems.push(createMealItem(dinnerVeg.food, 160, dinnerVeg.trafficStatus || 'GREEN'));
  } else if (dinnerVeg.error) {
    dinnerErrors.push(dinnerVeg.error);
  }

  // Dinner Oil
  const dinnerOil = selectSafeMealCandidate(
    'Dinner Cooking Fat',
    'fat_oil',
    ['mustard', 'oil', 'তেল', 'ghee'],
    allFoods, greenFoods, yellowFoods, redFoods, patient
  );
  if (dinnerOil.food) {
    const dinnerOilG = Math.max(8, Math.round((targetFat * 0.35) / 1.5));
    dinnerItems.push(createMealItem(dinnerOil.food, dinnerOilG, dinnerOil.trafficStatus || 'GREEN'));
  } else if (dinnerOil.error) {
    dinnerErrors.push(dinnerOil.error);
  }
  const dinnerScored = scoreMeal(dinnerItems, dinnerErrors);

  return [
    {
      id: 'meal_morning_protocol',
      meal_type: 'morning_protocol',
      title_bn: "প্রাতঃকালীন গাট রিবুট প্রোটোকল (০৬:৩০ ঘটিকা)",
      title_en: "Morning Gut Reset Protocol (06:30 AM)",
      target_time: "06:30 AM",
      items: morningItems,
      ...morningScored
    },
    {
      id: 'meal_breakfast',
      meal_type: 'breakfast',
      title_bn: "সকালের পুষ্টিকর নাশতা (০৮:০০ ঘটিকা)",
      title_en: "Functional Metabolic Breakfast (08:00 AM)",
      target_time: "08:00 AM",
      items: breakfastItems,
      ...breakfastScored
    },
    {
      id: 'meal_lunch',
      meal_type: 'lunch',
      title_bn: "দুপুরের প্রধান আহার (০১:৩০ ঘটিকা)",
      title_en: "Therapeutic Lunch (01:30 PM)",
      target_time: "01:30 PM",
      items: lunchItems,
      ...lunchScored
    },
    {
      id: 'meal_evening_snack',
      meal_type: 'evening_snack',
      title_bn: "বিকেলের ভেষজ বিরতি (০৫:০০ ঘটিকা)",
      title_en: "Evening Cellular Recovery (05:00 PM)",
      target_time: "05:00 PM",
      items: eveningItems,
      ...eveningScored
    },
    {
      id: 'meal_dinner',
      meal_type: 'dinner',
      title_bn: "রাতের সহজপাচ্য নৈশভোজ (০৮:০০ ঘটিকা)",
      title_en: "Early Anti-Inflammatory Dinner (08:00 PM)",
      target_time: "08:00 PM",
      items: dinnerItems,
      ...dinnerScored
    }
  ];
}
