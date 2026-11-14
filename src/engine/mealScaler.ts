import { 
  FoodItem, 
  DietChartMeal, 
  DietChartMealItem, 
  FoodExchangeItem, 
  IncompatiblePairWarning, 
  PatientProfile, 
  EvaluatedFoodItem 
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

  // 1. Fish + Milk / Dairy
  if ((text.includes('fish') || text.includes('মাছ')) && (text.includes('milk') || text.includes('দুধ') || text.includes('curd') || text.includes('দই'))) {
    warnings.push({
      warning_bn: "বিরুদ্ধ আহার সতর্কতা: মাছ এবং দুধ/দুগ্ধজাত খাবার একসাথে গ্রহণ হজমে জটিলতা ও অম্লপিত্ত তৈরি করে।",
      warning_en: "Incompatible Food Combination: Fish and dairy ingested concurrently perturb digestive fire (Viruddha Ahara).",
      severity: 'high'
    });
  }

  // 2. High Oxalate + High Calcium Incompatible Timing
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

export function generateExchangesForFood(
  food: FoodItem,
  rawGrams: number,
  allFoods: FoodItem[],
  greenFoodIds: Set<string>
): FoodExchangeItem[] {
  const targetKcal = (food.per_100g.kcal * rawGrams) / 100;
  const targetProtein = (food.per_100g.protein_g * rawGrams) / 100;

  // Filter foods in same exchange group that are approved (Green) and not the same food
  const candidates = allFoods.filter(f => 
    f.id !== food.id &&
    f.exchange_group === food.exchange_group &&
    (greenFoodIds.size === 0 || greenFoodIds.has(f.id))
  );

  const exchanges: FoodExchangeItem[] = [];

  for (const cand of candidates.slice(0, 4)) {
    // Scale grams to match target kcal or protein
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
      exchanges.push({
        food_id: cand.id,
        name_bn: cand.name_bn,
        name_en: cand.name_en,
        raw_weight_g: scaledGrams,
        cooked_display_bn: display.bn,
        cooked_display_en: display.en,
        kcal: Math.round((cand.per_100g.kcal * scaledGrams) / 100),
        protein_g: Math.round(((cand.per_100g.protein_g * scaledGrams) / 100) * 10) / 10
      });
    }
  }

  return exchanges;
}

export function buildAutoScaledDietChart(
  patient: PatientProfile,
  allFoods: FoodItem[],
  greenFoods: EvaluatedFoodItem[]
): DietChartMeal[] {
  const greenIds = new Set(greenFoods.map(f => f.id));
  const targetCalories = patient.calculated.target_calories;
  const targetProtein = patient.calculated.target_protein_g;
  const targetCarbs = patient.calculated.target_carbs_g;
  const targetFat = patient.calculated.target_fat_g;

  // Meal calorie distributions:
  // Breakfast: 25% | Lunch: 40% | Evening: 10% | Dinner: 25%
  const breakfastKcal = targetCalories * 0.25;
  const lunchKcal = targetCalories * 0.40;
  const dinnerKcal = targetCalories * 0.25;

  // Helper to find food
  const findSafe = (cat: string, keyword: string, fallbackId: string) => {
    return allFoods.find(f => greenIds.has(f.id) && f.category === cat && f.name_en.toLowerCase().includes(keyword)) ||
           allFoods.find(f => f.category === cat && f.name_en.toLowerCase().includes(keyword)) ||
           allFoods.find(f => f.id === fallbackId) ||
           allFoods[0];
  };

  // Safe staple Bangladeshi foods
  const redRice = findSafe('grain', 'rice', 'f_01_0001');
  const wholeWheatRoti = findSafe('grain', 'flour', 'f_01_0004');
  const ruiFish = findSafe('protein', 'fish', 'f_09_0001');
  const wholeEgg = findSafe('protein', 'egg', 'f_11_0001');
  const countryChicken = findSafe('protein', 'chicken', 'f_10_0001');
  const bottleGourd = findSafe('vegetable', 'gourd', 'f_03_0001');
  const spinachShak = findSafe('vegetable', 'spinach', 'f_04_0001');
  const pureMustardOil = findSafe('fat_oil', 'mustard', 'f_13_0001');
  const pureGhee = findSafe('dairy', 'ghee', 'f_12_0001');
  const pumpkinSeed = findSafe('seed_nut', 'seed', 'f_06_0001');

  // Compute grain raw grams to hit targeted carbs
  // Breakfast carb = 25% of target carbs, Lunch = 45%, Dinner = 30%
  const breakfastCarbG = Math.max(20, Math.round(targetCarbs * 0.25));
  const lunchCarbG = Math.max(30, Math.round(targetCarbs * 0.45));
  const dinnerCarbG = Math.max(20, Math.round(targetCarbs * 0.30));

  // Grains
  const rutiRawG = Math.round((breakfastCarbG / Math.max(0.65, wholeWheatRoti.per_100g.carbs_g / 100)));
  const lunchRiceRawG = Math.round((lunchCarbG / Math.max(0.70, redRice.per_100g.carbs_g / 100)));
  const dinnerGourdRawG = 160;

  // Proteins
  // Total protein target distributed: Breakfast 25g, Lunch 40g, Dinner 25g
  const eggCount = targetProtein > 80 ? 2 : 1;
  const eggRawG = eggCount * 50;
  const lunchFishRawG = Math.round(((targetProtein * 0.40) / Math.max(0.18, ruiFish.per_100g.protein_g / 100)));
  const dinnerChickenRawG = Math.round(((targetProtein * 0.30) / Math.max(0.20, countryChicken.per_100g.protein_g / 100)));

  // Fats
  const breakfastGheeG = 5;
  const lunchOilG = Math.max(10, Math.round((targetFat * 0.45) / 1.5));
  const dinnerOilG = Math.max(8, Math.round((targetFat * 0.35) / 1.5));

  function createMealItem(food: FoodItem, rawG: number): DietChartMealItem {
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
      alternatives: generateExchangesForFood(food, rawG, allFoods, greenIds)
    };
  }

  function scoreMeal(items: DietChartMealItem[]) {
    const meal_calories = items.reduce((sum, i) => sum + i.kcal, 0);
    const meal_protein_g = Math.round(items.reduce((sum, i) => sum + i.protein_g, 0) * 10) / 10;
    const meal_carbs_g = Math.round(items.reduce((sum, i) => sum + i.carbs_g, 0) * 10) / 10;
    const meal_fat_g = Math.round(items.reduce((sum, i) => sum + i.fat_g, 0) * 10) / 10;

    // Approximate Glycemic Load (GL)
    // GL = (Carbs * GI_estimate) / 100
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
      meal_pral,
      incompatible_warnings: detectIncompatibleCombinations(items)
    };
  }

  // 1. Morning Protocol
  const morningItems = [
    createMealItem(findSafe('vegetable', 'cucumber', 'f_03_0002'), 80)
  ];
  const morningScored = scoreMeal(morningItems);

  // 2. Breakfast
  const breakfastItems = [
    createMealItem(wholeEgg, eggRawG),
    createMealItem(wholeWheatRoti, Math.max(35, Math.min(80, rutiRawG))),
    createMealItem(findSafe('vegetable', 'papaya', 'f_03_0003'), 120),
    createMealItem(pureGhee, breakfastGheeG)
  ];
  const breakfastScored = scoreMeal(breakfastItems);

  // 3. Lunch (Main Feast)
  const lunchItems = [
    createMealItem(redRice, Math.max(40, Math.min(100, lunchRiceRawG))),
    createMealItem(ruiFish, Math.max(80, Math.min(160, lunchFishRawG))),
    createMealItem(spinachShak, 140),
    createMealItem(pureMustardOil, lunchOilG)
  ];
  const lunchScored = scoreMeal(lunchItems);

  // 4. Evening Snack
  const eveningItems = [
    createMealItem(pumpkinSeed, 15)
  ];
  const eveningScored = scoreMeal(eveningItems);

  // 5. Dinner
  const dinnerItems = [
    createMealItem(countryChicken, Math.max(70, Math.min(140, dinnerChickenRawG))),
    createMealItem(bottleGourd, dinnerGourdRawG),
    createMealItem(pureMustardOil, dinnerOilG)
  ];
  const dinnerScored = scoreMeal(dinnerItems);

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

