/**
 * SHUDDHO FUNCTIONAL NUTRITION SOFTWARE
 * Seven-Day Food Frequency Questionnaire (FFQ) Engine (Phase P1)
 * 
 * 100% Deterministic survey-style dietary pattern analyzer.
 * Calculates weekly servings, plant diversity, ultra-processed burden,
 * and clinical flags without imposing the burden of a daily food diary.
 */

import {
  FFQFoodGroupId,
  FFQFrequencyOption,
  FFQPortionSize,
  FFQItemDefinition,
  FFQItemResponse,
  DietaryHabitsSurvey,
  DietaryFrequencyAssessment
} from '../../types/assessment';

export const FFQ_FOOD_DEFINITIONS: FFQItemDefinition[] = [
  // ── Grains ────────────────────────────────────────────────────────
  {
    id: 'rice_white_brown',
    name_en: 'White or Brown Rice (Cooked)',
    name_bn: 'সাদা বা লাল চালের ভাত',
    category: 'grain',
    isHighValueQuick: true,
    standardPortionDescription_en: '1 medium katori / cup cooked (~140g)',
    standardPortionDescription_bn: '১ মাঝারি বাটি বা কাপ (~১৪০ গ্রাম)',
    approxGramPerPortion: 140
  },
  {
    id: 'roti_handmade_atta',
    name_en: 'Handmade Whole-Wheat Roti / Chapati',
    name_bn: 'হাতে তৈরি লাল আটার রুটি',
    category: 'grain',
    isHighValueQuick: true,
    standardPortionDescription_en: '1 thin handmade roti (~35g raw flour)',
    standardPortionDescription_bn: '১টি পাতলা হাতে তৈরি রুটি (~৩৫ গ্রাম আটা)',
    approxGramPerPortion: 45
  },
  {
    id: 'other_grains_khichuri_poha',
    name_en: 'Khichuri, Chira (Flattened Rice), Muri (Puffed Rice)',
    name_bn: 'খিচুড়ি, চিড়া বা মুড়ি',
    category: 'grain',
    isHighValueQuick: false,
    standardPortionDescription_en: '1 medium bowl (~100g cooked / 40g dry)',
    standardPortionDescription_bn: '১ মাঝারি বাটি (~১০০ গ্রাম রান্না / ৪০ গ্রাম শুকনো)',
    approxGramPerPortion: 80
  },
  {
    id: 'whole_grains_oats',
    name_en: 'Rolled Oats, Barley, or Millets (Jowar/Bajra/Kaon)',
    name_bn: 'ওটস, বার্লি বা কাউনের চাল',
    category: 'grain',
    isHighValueQuick: false,
    standardPortionDescription_en: '1 small bowl cooked (~40g dry weight)',
    standardPortionDescription_bn: '১ ছোট বাটি রান্না ওটস বা বার্লি',
    approxGramPerPortion: 120
  },

  // ── Plant Proteins / Legumes ─────────────────────────────────────
  {
    id: 'lentils_dal_soup',
    name_en: 'Lentil Soup (Masoor, Moong, or Chana Dal)',
    name_bn: 'মসুর, মুগ বা ছোলার পাতলা/ঘন ডাল',
    category: 'protein',
    isHighValueQuick: true,
    standardPortionDescription_en: '1 standard bowl of prepared dal (~100 mL)',
    standardPortionDescription_bn: '১ প্রমাণ বাটি রান্না ডাল (~১০০ মিলি)',
    approxGramPerPortion: 120
  },
  {
    id: 'legumes_chickpeas_chola',
    name_en: 'Chickpeas (Chola), Peas (Motor), or Bean Seeds',
    name_bn: 'ছোলা, মটরশুঁটি বা শিমের বিচি',
    category: 'protein',
    isHighValueQuick: false,
    standardPortionDescription_en: '1 small cup cooked (~80g)',
    standardPortionDescription_bn: '১ ছোট কাপ সেদ্ধ বা রান্না ছোলা (~৮০ গ্রাম)',
    approxGramPerPortion: 80
  },

  // ── Animal Proteins ──────────────────────────────────────────────
  {
    id: 'fish_sweetwater_rui_katla',
    name_en: 'Freshwater Carp Fish (Rui, Katla, Mrigal, Tilapia)',
    name_bn: 'তাজা রুই, কাতলা, মৃগেল বা কার্প মাছ',
    category: 'protein',
    isHighValueQuick: true,
    standardPortionDescription_en: '1 medium cooked fish piece (~80-90g)',
    standardPortionDescription_bn: '১ মাঝারি রান্না মাছের টুকরা (~৮০-৯০ গ্রাম)',
    approxGramPerPortion: 85
  },
  {
    id: 'fish_small_mola_dhela',
    name_en: 'Small Indigenous Fish with Bones (Mola, Dhela, Kachki, Batashi)',
    name_bn: 'কাঁটা সহ ছোট মাছ (মলা, ঢেলা, কাচকি, বাতাসি)',
    category: 'protein',
    isHighValueQuick: false,
    standardPortionDescription_en: '1 small bowl cooked (~60-70g)',
    standardPortionDescription_bn: '১ ছোট বাটি রান্না ছোট মাছ (~৬০-৭০ গ্রাম)',
    approxGramPerPortion: 65
  },
  {
    id: 'fish_marine_hilsa_rupchanda',
    name_en: 'Hilsa (Ilish) or Marine Fish (Rupchanda, Koral)',
    name_bn: 'ইলিশ বা সামুদ্রিক মাছ (রূপচাঁদা, কোরাল)',
    category: 'protein',
    isHighValueQuick: false,
    standardPortionDescription_en: '1 cooked piece (~90g)',
    standardPortionDescription_bn: '১ মাঝারি রান্না টুকরা (~৯০ গ্রাম)',
    approxGramPerPortion: 90
  },
  {
    id: 'poultry_chicken',
    name_en: 'Chicken (Deshi or Broiler)',
    name_bn: 'দেশি বা ব্রয়লার মুরগির মাংস',
    category: 'protein',
    isHighValueQuick: true,
    standardPortionDescription_en: '2 medium curry pieces (~80-100g cooked)',
    standardPortionDescription_bn: '২ মাঝারি টুকরা মুরগির মাংস (~৮০-১০০ গ্রাম)',
    approxGramPerPortion: 90
  },
  {
    id: 'red_meat_beef_mutton',
    name_en: 'Red Meat (Beef or Mutton)',
    name_bn: 'গরু বা খাসির মাংস',
    category: 'protein',
    isHighValueQuick: true,
    standardPortionDescription_en: '2-3 medium curry pieces (~80-100g cooked)',
    standardPortionDescription_bn: '২-৩ টুকরা মাংস (~৮০-১০০ গ্রাম)',
    approxGramPerPortion: 90
  },
  {
    id: 'eggs_whole',
    name_en: 'Whole Egg (Chicken or Duck)',
    name_bn: 'গোটা মুরগি বা হাঁসের ডিম',
    category: 'protein',
    isHighValueQuick: true,
    standardPortionDescription_en: '1 whole egg boiled or poached (~50g)',
    standardPortionDescription_bn: '১টি আস্ত ডিম সেদ্ধ বা পোচ (~৫০ গ্রাম)',
    approxGramPerPortion: 50
  },

  // ── Dairy ────────────────────────────────────────────────────────
  {
    id: 'milk_cow',
    name_en: 'Liquid Cow Milk',
    name_bn: 'তরল গরুর দুধ',
    category: 'dairy',
    isHighValueQuick: true,
    standardPortionDescription_en: '1 cup / glass (~150-200 mL)',
    standardPortionDescription_bn: '১ কাপ বা গ্লাস দুধ (~১৫০-২০০ মিলি)',
    approxGramPerPortion: 180
  },
  {
    id: 'curd_yogurt_doi',
    name_en: 'Fresh Curd / Yogurt (Tok Doi or Sweet Doi)',
    name_bn: 'টক দই বা ঘরে পাতা মিষ্টি দই',
    category: 'dairy',
    isHighValueQuick: true,
    standardPortionDescription_en: '1 small cup / bowl (~100g)',
    standardPortionDescription_bn: '১ ছোট কাপ বা বাটি (~১০০ গ্রাম)',
    approxGramPerPortion: 100
  },

  // ── Vegetables & Fruits ──────────────────────────────────────────
  {
    id: 'leafy_greens_shak',
    name_en: 'Green Leafy Vegetables (Lal Shak, Palong, Pui, Kolmi)',
    name_bn: 'সবুজ বা লাল শাক (পালং, লাল, পুঁই, কলমি শাক)',
    category: 'vegetable',
    isHighValueQuick: true,
    standardPortionDescription_en: '1 cooked bowl (~100-120g)',
    standardPortionDescription_bn: '১ বাটি রান্না শাক (~১০০-১২০ গ্রাম)',
    approxGramPerPortion: 110
  },
  {
    id: 'other_vegetables_curry',
    name_en: 'Non-Leafy Vegetables (Bottle Gourd, Papaya, Potol, Pumpkin)',
    name_bn: 'অন্যান্য সবজি (লাউ, পেঁপে, পটল, মিষ্টি কুমড়া)',
    category: 'vegetable',
    isHighValueQuick: true,
    standardPortionDescription_en: '1 standard bowl of cooked vegetable curry (~120g)',
    standardPortionDescription_bn: '১ বাটি রান্না সবজির তরকারি (~১২০ গ্রাম)',
    approxGramPerPortion: 120
  },
  {
    id: 'raw_salad_cucumber',
    name_en: 'Raw Salad (Cucumber, Tomato, Carrots)',
    name_bn: 'কাঁচা সালাদ (শসা, টমেটো, গাজর)',
    category: 'vegetable',
    isHighValueQuick: false,
    standardPortionDescription_en: '1 small plate sliced salad (~80g)',
    standardPortionDescription_bn: '১ ছোট প্লেট কাটা সালাদ (~৮০ গ্রাম)',
    approxGramPerPortion: 80
  },
  {
    id: 'fresh_fruits_seasonal',
    name_en: 'Fresh Seasonal Whole Fruits (Banana, Guava, Apple, Papaya)',
    name_bn: 'তাজা মৌসুমি ফল (কলা, পেয়ারা, আপেল, আম, পেঁপে)',
    category: 'fruit',
    isHighValueQuick: true,
    standardPortionDescription_en: '1 medium fruit (e.g. 1 banana/guava, ~100-120g)',
    standardPortionDescription_bn: '১টি মাঝারি গোটা ফল (~১০০-১২০ গ্রাম)',
    approxGramPerPortion: 110
  },
  {
    id: 'nuts_seeds_chia_almonds',
    name_en: 'Nuts & Seeds (Peanuts, Almonds, Chia Seeds, Kalijira)',
    name_bn: 'বাদাম ও বীজ (চিনাবাদাম, কাঠবাদাম, চিয়া সিড, কালোজিরা)',
    category: 'snack_sweet',
    isHighValueQuick: false,
    standardPortionDescription_en: '1 small handful or tablespoon (~15-20g)',
    standardPortionDescription_bn: '১ ছোট মুঠ বা টেবিল চামচ (~১৫-২০ গ্রাম)',
    approxGramPerPortion: 20
  },
  {
    id: 'fermented_foods_pantabhaat',
    name_en: 'Fermented Foods (Panta Bhaat, Homemade Probiotic Pickles)',
    name_bn: 'ফার্মেন্টেড খাবার (পান্তা ভাত, ঘরে পাতা তেল ছাড়া আচার)',
    category: 'grain',
    isHighValueQuick: false,
    standardPortionDescription_en: '1 bowl panta bhaat (~150g)',
    standardPortionDescription_bn: '১ বাটি পান্তা ভাত (~১৫০ গ্রাম)',
    approxGramPerPortion: 150
  },

  // ── Ultra-Processed & High-Risk Foods ────────────────────────────
  {
    id: 'fried_snacks_singara_puri',
    name_en: 'Deep-Fried Street Snacks (Singara, Somucha, Puri, Piyaju, Beguni)',
    name_bn: 'তেলে ভাজা নাস্তা (সিঙ্গাড়া, সমুচা, পুরি, পেঁয়াজু, বেগুনি)',
    category: 'snack_sweet',
    isHighValueQuick: true,
    standardPortionDescription_en: '1-2 pieces deep fried snack (~70g)',
    standardPortionDescription_bn: '১-২টি তেলে ভাজা খাবার (~৭০ গ্রাম)',
    approxGramPerPortion: 70
  },
  {
    id: 'sweets_mishti_dessert',
    name_en: 'Traditional Bengali Sweets (Roshogolla, Sandesh, Halwa, Payesh)',
    name_bn: 'ঐতিহ্যবাহী মিষ্টি (রসগোল্লা, সন্দেশ, হালুয়া, পায়েস)',
    category: 'snack_sweet',
    isHighValueQuick: true,
    standardPortionDescription_en: '1-2 pieces sweet (~60-80g)',
    standardPortionDescription_bn: '১-২টি মিষ্টি (~৬০-৮০ গ্রাম)',
    approxGramPerPortion: 70
  },
  {
    id: 'bakery_biscuits_bread',
    name_en: 'Commercial Biscuits, Toast, White Sliced Bread, Bakery Patties',
    name_bn: 'প্যাকেটজাত বিস্কুট, টোস্ট, সাদা পাউরুটি বা বেকারি প্যাটিস',
    category: 'snack_sweet',
    isHighValueQuick: true,
    standardPortionDescription_en: '2-4 commercial biscuits or 2 slices bread (~40-60g)',
    standardPortionDescription_bn: '২-৪টি বিস্কুট বা ২ স্লাইস পাউরুটি',
    approxGramPerPortion: 50
  },
  {
    id: 'packaged_chips_chanachur',
    name_en: 'Packaged Chanachur, Chips, Fried Noodles, Dalmut',
    name_bn: 'প্যাকেট চানাচুর, চিপস, নিমকি, ডালমুট',
    category: 'snack_sweet',
    isHighValueQuick: false,
    standardPortionDescription_en: '1 small pack chanachur/chips (~30-50g)',
    standardPortionDescription_bn: '১ ছোট প্যাকেট চানাচুর বা চিপস',
    approxGramPerPortion: 40
  },
  {
    id: 'sugar_sweetened_beverages',
    name_en: 'Carbonated Soft Drinks, Commercial Juice, Energy Drinks',
    name_bn: 'কোমল পানীয় (কোক, ফান্টা), প্যাকেট জুস বা এনার্জি ড্রিংকস',
    category: 'beverage',
    isHighValueQuick: true,
    standardPortionDescription_en: '1 bottle / glass (~250 mL)',
    standardPortionDescription_bn: '১ বোতল বা গ্লাস (~২৫০ মিলি)',
    approxGramPerPortion: 250
  },
  {
    id: 'tea_coffee_with_sugar',
    name_en: 'Traditional Milk Tea or Coffee with Added Sugar',
    name_bn: 'চিনি ও কনডেন্সড মিল্ক দেওয়া দুধ চা বা কফি',
    category: 'beverage',
    isHighValueQuick: true,
    standardPortionDescription_en: '1 standard cup with 1-2 tsp sugar (~120 mL)',
    standardPortionDescription_bn: '১ কাপ চিনিযুক্ত চা (~১২০ মিলি)',
    approxGramPerPortion: 120
  },
  {
    id: 'tea_herbal_without_sugar',
    name_en: 'Black Tea, Green Tea, or Herbal Infusions without Sugar',
    name_bn: 'চিনি ছাড়া লাল চা, গ্রিন টি বা আদা-লেবু চা',
    category: 'beverage',
    isHighValueQuick: false,
    standardPortionDescription_en: '1 cup (~150 mL)',
    standardPortionDescription_bn: '১ কাপ চিনিহীন চা (~১৫০ মিলি)',
    approxGramPerPortion: 150
  }
];

// Mapping frequency options to estimated numeric servings per week
export const FREQUENCY_NUMERIC_ESTIMATES: Record<FFQFrequencyOption, number> = {
  '0_times': 0,
  '1_2_times': 1.5,
  '3_4_times': 3.5,
  '5_6_times': 5.5,
  '7_10_times': 8.5,
  '11_14_times': 12.5,
  '15_21_times': 18.0,
  '22_plus_times': 25.0,
  'not_sure': 0
};

// Portion size multipliers relative to standard portion
export const PORTION_MULTIPLIERS: Record<FFQPortionSize, number> = {
  'small': 0.7,
  'medium': 1.0,
  'large': 1.4,
  'extra_large': 1.8,
  'not_sure': 1.0
};

/**
 * Deterministically analyzes FFQ survey responses and dietary habits.
 */
export function analyzeDietaryFrequency(
  items: Record<string, FFQItemResponse>,
  habits: DietaryHabitsSurvey
): DietaryFrequencyAssessment {
  const safeItems: Record<FFQFoodGroupId, FFQItemResponse> = {} as any;

  let totalPlantGroupsPresent = 0;
  let totalVegFruitWeeklyServings = 0;
  let totalProteinWeeklyServings = 0;
  let totalUltraProcessedWeeklyServings = 0;
  let totalAddedSugarWeeklyFrequency = 0;
  let answeredCount = 0;

  const plantGroupIds: FFQFoodGroupId[] = [
    'lentils_dal_soup',
    'legumes_chickpeas_chola',
    'leafy_greens_shak',
    'other_vegetables_curry',
    'raw_salad_cucumber',
    'fresh_fruits_seasonal',
    'nuts_seeds_chia_almonds',
    'whole_grains_oats'
  ];

  const proteinGroupIds: FFQFoodGroupId[] = [
    'lentils_dal_soup',
    'legumes_chickpeas_chola',
    'fish_sweetwater_rui_katla',
    'fish_small_mola_dhela',
    'fish_marine_hilsa_rupchanda',
    'poultry_chicken',
    'red_meat_beef_mutton',
    'eggs_whole',
    'curd_yogurt_doi'
  ];

  const ultraProcessedIds: FFQFoodGroupId[] = [
    'fried_snacks_singara_puri',
    'sweets_mishti_dessert',
    'bakery_biscuits_bread',
    'packaged_chips_chanachur',
    'sugar_sweetened_beverages'
  ];

  for (const def of FFQ_FOOD_DEFINITIONS) {
    const resp = items[def.id] || {
      food_group_id: def.id,
      frequency: '0_times',
      portion_size: 'medium'
    };

    safeItems[def.id] = resp;

    if (resp.frequency && resp.frequency !== '0_times' && resp.frequency !== 'not_sure') {
      answeredCount++;
      const baseFreq = FREQUENCY_NUMERIC_ESTIMATES[resp.frequency];
      const portMult = PORTION_MULTIPLIERS[resp.portion_size || 'medium'];
      const effectiveServings = baseFreq * portMult;

      if (plantGroupIds.includes(def.id) && baseFreq >= 1) {
        totalPlantGroupsPresent++;
      }

      if (def.id === 'leafy_greens_shak' || def.id === 'other_vegetables_curry' || def.id === 'raw_salad_cucumber' || def.id === 'fresh_fruits_seasonal') {
        totalVegFruitWeeklyServings += effectiveServings;
      }

      if (proteinGroupIds.includes(def.id)) {
        totalProteinWeeklyServings += effectiveServings;
      }

      if (ultraProcessedIds.includes(def.id)) {
        totalUltraProcessedWeeklyServings += effectiveServings;
      }

      if (def.id === 'sweets_mishti_dessert' || def.id === 'sugar_sweetened_beverages' || def.id === 'tea_coffee_with_sugar') {
        totalAddedSugarWeeklyFrequency += baseFreq;
      }
    }
  }

  // Daily average servings
  const dailyFruitVeg = Math.round((totalVegFruitWeeklyServings / 7) * 10) / 10;

  // Protein ranking
  const proteinDailyServings = totalProteinWeeklyServings / 7;
  let proteinRank: 'low' | 'moderate' | 'high' = 'moderate';
  if (proteinDailyServings < 1.5) proteinRank = 'low';
  else if (proteinDailyServings >= 3.5) proteinRank = 'high';

  // Ultra-processed rank
  let upfRank: 'low' | 'moderate' | 'high' | 'very_high' = 'low';
  if (totalUltraProcessedWeeklyServings > 21) upfRank = 'very_high';
  else if (totalUltraProcessedWeeklyServings > 12) upfRank = 'high';
  else if (totalUltraProcessedWeeklyServings > 5) upfRank = 'moderate';

  // Sugar rank
  let sugarRank: 'minimal' | 'moderate' | 'excessive' = 'minimal';
  if (totalAddedSugarWeeklyFrequency > 21) sugarRank = 'excessive';
  else if (totalAddedSugarWeeklyFrequency > 7) sugarRank = 'moderate';

  // Sodium risk flag: raw salt at table OR frequent chanachur/pickles
  const rawSaltAtTable = habits.raw_salt_added_at_table === 'always' || habits.raw_salt_added_at_table === 'sometimes';
  const highProcessedSalty = (safeItems['packaged_chips_chanachur']?.frequency !== '0_times' && safeItems['packaged_chips_chanachur']?.frequency !== 'not_sure') ||
                             (safeItems['fried_snacks_singara_puri']?.frequency !== '0_times' && safeItems['fried_snacks_singara_puri']?.frequency !== 'not_sure');
  const sodiumRisk = rawSaltAtTable || highProcessedSalty;

  // Completeness status
  let completeness: 'complete' | 'partial' | 'minimal' = 'minimal';
  if (answeredCount >= 18) completeness = 'complete';
  else if (answeredCount >= 8) completeness = 'partial';

  return {
    items: safeItems,
    habits,
    summary: {
      weekly_plant_diversity_score: totalPlantGroupsPresent,
      daily_fruit_veg_servings_est: dailyFruitVeg,
      protein_intake_frequency_rank: proteinRank,
      ultra_processed_burden: upfRank,
      added_sugar_exposure: sugarRank,
      sodium_risk_flag: sodiumRisk,
      atypical_week_flag: !habits.is_past_week_representative,
      completeness_status: completeness
    }
  };
}
