// P2 Dietary Pattern & Potential Renal Acid Load (PRAL) Analysis Engine
// Deterministic dietary diversity scoring, ultra-processed burden, and acid-base mineral balance.
// Strictly adheres to physiological caveats regarding systemic blood pH buffering.

import { PatientProfile } from '../../types';
import { ClinicalObservation, DietaryPatternAnalysisResult } from './types';
import { FFQFoodGroupId, DietaryFrequencyAssessment } from '../../types/assessment';

// Canonical 12 Plant Categories supporting both P1 FFQ and detailed intake categories
const PLANT_FOOD_GROUPS: Array<{ category: string; aliases: string[] }> = [
  { category: 'leafy_greens', aliases: ['leafy_greens_shak', 'ffq_leafy_greens', 'q_ffq_leafy_greens'] },
  { category: 'cruciferous_or_salad', aliases: ['raw_salad_cucumber', 'ffq_cruciferous', 'q_ffq_cruciferous'] },
  { category: 'root_tubers_grains', aliases: ['other_grains_khichuri_poha', 'ffq_root_tubers', 'q_ffq_root_tubers'] },
  { category: 'gourds_squash_legumes', aliases: ['legumes_chickpeas_chola', 'ffq_gourds_squash', 'q_ffq_gourds_squash'] },
  { category: 'other_vegetables', aliases: ['other_vegetables_curry', 'ffq_other_colored_veg', 'q_ffq_other_colored_veg'] },
  { category: 'fresh_fruits', aliases: ['fresh_fruits_seasonal', 'ffq_fresh_fruits', 'q_ffq_fresh_fruits'] },
  { category: 'lentils_dal', aliases: ['lentils_dal_soup', 'ffq_lentils_pulses', 'q_ffq_lentils_pulses'] },
  { category: 'whole_grains', aliases: ['whole_grains_oats', 'roti_handmade_atta', 'ffq_whole_grains', 'q_ffq_whole_grains'] },
  { category: 'nuts_seeds', aliases: ['nuts_seeds_chia_almonds', 'ffq_nuts_seeds', 'q_ffq_nuts_seeds'] },
  { category: 'herbs_alliums_teas', aliases: ['tea_herbal_without_sugar', 'ffq_herbs_alliums', 'q_ffq_herbs_alliums'] },
  { category: 'fermented_foods', aliases: ['fermented_foods_pantabhaat', 'ffq_fermented_foods', 'q_ffq_fermented_foods'] },
  { category: 'healthy_plant_fats', aliases: ['ffq_healthy_plant_fats', 'q_ffq_healthy_plant_fats', 'mustard_oil'] },
];

export interface QuantifiedDietaryNutrients {
  protein_g?: number;
  phosphorus_mg?: number;
  potassium_mg?: number;
  magnesium_mg?: number;
  calcium_mg?: number;
}

export function analyzeDietaryPattern(
  patient: PatientProfile,
  observations: ClinicalObservation[],
  assessmentAnswers: Record<string, any> = {},
  dietaryFrequencyAssessment?: DietaryFrequencyAssessment,
  quantifiedNutrients?: QuantifiedDietaryNutrients
): DietaryPatternAnalysisResult {
  // If complete P1 dietary_frequency assessment is directly available, prioritize its calculated metrics
  const ffqItems = dietaryFrequencyAssessment?.items;

  let plantScore = 0;
  let confirmedZeroCount = 0;
  let notSureCount = 0;
  let answeredCount = 0;

  for (const group of PLANT_FOOD_GROUPS) {
    let val: any = undefined;

    // 1. Direct FFQ item response
    if (ffqItems) {
      for (const alias of group.aliases) {
        if (ffqItems[alias as FFQFoodGroupId]) {
          val = ffqItems[alias as FFQFoodGroupId].frequency;
          break;
        }
      }
    }

    // 2. Answers dictionary search by canonical ID or aliases
    if (val === undefined) {
      for (const alias of group.aliases) {
        if (assessmentAnswers[alias] !== undefined && assessmentAnswers[alias] !== null && assessmentAnswers[alias] !== '') {
          val = assessmentAnswers[alias];
          break;
        }
      }
    }

    // 3. Clinical observations search
    if (val === undefined) {
      const obs = observations.find(o =>
        group.aliases.some(alias => o.id.includes(alias) || o.tags?.includes(alias))
      );
      if (obs) {
        val = obs.observedValue;
      }
    }

    if (val !== undefined && val !== null && val !== '') {
      answeredCount++;
      if (val === '0_times' || val === 0 || val === 'zero') {
        confirmedZeroCount++;
      } else if (val === 'not_sure' || val === 'unknown') {
        notSureCount++;
      } else {
        // Active regular consumption
        plantScore++;
      }
    }
  }

  // Fallback heuristics if no specific plant items recorded
  if (answeredCount === 0) {
    if (patient.dietary_preferences?.is_vegetarian) {
      plantScore = Math.max(plantScore, 6);
      answeredCount = Math.max(answeredCount, 7);
    }
  }

  const unansweredCount = PLANT_FOOD_GROUPS.length - answeredCount;

  // Completeness status
  let completenessStatus: DietaryPatternAnalysisResult['completenessStatus'] =
    dietaryFrequencyAssessment?.summary?.completeness_status ??
    (answeredCount >= 10 ? 'complete' : answeredCount >= 4 ? 'partial' : 'minimal');

  // Plant Diversity Rank
  let plantDiversityRank: DietaryPatternAnalysisResult['plantDiversityRank'] =
    (dietaryFrequencyAssessment?.summary as any)?.plant_diversity_rank ?? 'uncertain';

  if (!dietaryFrequencyAssessment?.summary || plantDiversityRank === 'uncertain') {
    const scoreToEvaluate = dietaryFrequencyAssessment?.summary?.weekly_plant_diversity_score ?? plantScore;
    if (completenessStatus === 'minimal' && !dietaryFrequencyAssessment?.summary) {
      plantDiversityRank = 'uncertain';
    } else if (scoreToEvaluate >= 9) {
      plantDiversityRank = 'high';
    } else if (scoreToEvaluate >= 5) {
      plantDiversityRank = 'moderate';
    } else {
      plantDiversityRank = 'low';
    }
  }

  const finalPlantScore = dietaryFrequencyAssessment?.summary?.weekly_plant_diversity_score ?? plantScore;
  const finalConfirmedZero = (dietaryFrequencyAssessment?.summary as any)?.confirmed_zero_count ?? confirmedZeroCount;
  const finalNotSure = (dietaryFrequencyAssessment?.summary as any)?.not_sure_count ?? notSureCount;
  const finalUnanswered = (dietaryFrequencyAssessment?.summary as any)?.unanswered_count ?? unansweredCount;

  // Daily Fruit/Veg servings estimate from plant score or assessment summary
  let dailyFruitVegServings = dietaryFrequencyAssessment?.summary?.daily_fruit_veg_servings_est ?? 2;
  if (!dietaryFrequencyAssessment?.summary) {
    if (plantScore >= 8) dailyFruitVegServings = 5;
    else if (plantScore >= 5) dailyFruitVegServings = 3.5;
    else if (plantScore < 3 && completenessStatus !== 'minimal') dailyFruitVegServings = 1;
  }

  // Protein frequency rank
  let proteinFrequencyRank: DietaryPatternAnalysisResult['proteinFrequencyRank'] =
    dietaryFrequencyAssessment?.summary?.protein_intake_frequency_rank ?? (dietaryFrequencyAssessment?.summary as any)?.protein_frequency_rank ?? 'moderate';

  if (!dietaryFrequencyAssessment?.summary) {
    const hasFish =
      (assessmentAnswers['fish_sweetwater_rui_katla'] && assessmentAnswers['fish_sweetwater_rui_katla'] !== '0_times') ||
      (assessmentAnswers['ffq_fish_seafood'] && assessmentAnswers['ffq_fish_seafood'] !== '0_times');
    const hasEgg =
      (assessmentAnswers['eggs_whole'] && assessmentAnswers['eggs_whole'] !== '0_times') ||
      (assessmentAnswers['ffq_poultry_eggs'] && assessmentAnswers['ffq_poultry_eggs'] !== '0_times');
    const hasMeat =
      (assessmentAnswers['red_meat_beef_mutton'] && assessmentAnswers['red_meat_beef_mutton'] !== '0_times') ||
      (assessmentAnswers['ffq_red_meat'] && assessmentAnswers['ffq_red_meat'] !== '0_times');
    const hasDal =
      (assessmentAnswers['lentils_dal_soup'] && assessmentAnswers['lentils_dal_soup'] !== '0_times') ||
      (assessmentAnswers['ffq_lentils_pulses'] && assessmentAnswers['ffq_lentils_pulses'] !== '0_times');

    const proteinSourcesCount = [hasFish, hasEgg, hasMeat, hasDal].filter(Boolean).length;
    if (proteinSourcesCount >= 3) proteinFrequencyRank = 'high';
    else if (proteinSourcesCount <= 1 && completenessStatus !== 'minimal') proteinFrequencyRank = 'low';
  }

  // Ultra-processed burden
  let ultraProcessedBurden: DietaryPatternAnalysisResult['ultraProcessedBurden'] =
    dietaryFrequencyAssessment?.summary?.ultra_processed_burden ?? 'low';

  if (!dietaryFrequencyAssessment?.summary) {
    const upfKeys = [
      'fried_snacks_singara_puri',
      'sweets_mishti_dessert',
      'bakery_biscuits_bread',
      'packaged_chips_chanachur',
      'sugar_sweetened_beverages',
      'ffq_bakery_biscuits',
      'ffq_deep_fried',
      'ffq_sweetened_beverages',
      'ffq_instant_noodles',
    ];
    let upfScore = 0;
    for (const k of upfKeys) {
      const val = assessmentAnswers[k];
      if (val === 'daily' || val === '2_plus_daily' || val === '22_plus_times') upfScore += 3;
      else if (val === '4_6_week' || val === '11_21_times' || val === '6_10_times') upfScore += 2;
      else if (val === '1_3_week' || val === '3_5_times' || val === '1_2_times') upfScore += 1;
    }

    if (upfScore >= 6) ultraProcessedBurden = 'very_high';
    else if (upfScore >= 4) ultraProcessedBurden = 'high';
    else if (upfScore >= 2) ultraProcessedBurden = 'moderate';
  }

  // Added sugar exposure
  let addedSugarExposure: DietaryPatternAnalysisResult['addedSugarExposure'] =
    dietaryFrequencyAssessment?.summary?.added_sugar_exposure ?? (dietaryFrequencyAssessment?.summary as any)?.added_sugar_frequency ?? 'minimal';

  if (!dietaryFrequencyAssessment?.summary) {
    const sweetBev = assessmentAnswers['sugar_sweetened_beverages'] || assessmentAnswers['ffq_sweetened_beverages'];
    const teaSugar = assessmentAnswers['tea_coffee_with_sugar'] || assessmentAnswers['ffq_table_sugar_tea'];
    if (sweetBev === 'daily' || sweetBev === '2_plus_daily' || sweetBev === '22_plus_times' || teaSugar === '3_plus_cups_with_sugar' || teaSugar === '22_plus_times') {
      addedSugarExposure = 'excessive';
    } else if (sweetBev === '1_3_week' || sweetBev === '3_5_times' || teaSugar === '1_2_cups_with_sugar' || teaSugar === '6_10_times') {
      addedSugarExposure = 'moderate';
    }
  }

  // Sodium risk flag
  const sodiumRiskFlag =
    dietaryFrequencyAssessment?.summary?.sodium_risk_flag ??
    (assessmentAnswers['ffq_added_table_salt'] === 'always' ||
      assessmentAnswers['raw_salt_added_at_table'] === 'yes' ||
      assessmentAnswers['ffq_pickles_shutki'] === 'frequent' ||
      observations.some(o => o.tags?.includes('high_sodium_diet')));

  // ─── Potential Renal Acid Load (PRAL) Calculation ────────────────
  // Remer & Manz equation principle:
  // PRAL (mEq/day) = 0.49 * Protein(g/d) + 0.037 * Phosphorus(mg/d) - 0.021 * Potassium(mg/d) - 0.026 * Magnesium(mg/d) - 0.013 * Calcium(mg/d)
  //
  // CLINICAL INTEGRITY REQUIREMENT:
  // Do NOT generate a fabricated numerical PRAL score from frequency ticks alone.
  // When quantified gram-level nutrient data is missing, explicitly report insufficient quantitative data.
  let estimatedPRALScore: number | null = null;
  let pralStatus: DietaryPatternAnalysisResult['pralStatus'] = 'insufficient_quantitative_data';
  let pralInterpretation: DietaryPatternAnalysisResult['pralInterpretation'] = 'insufficient_data';

  if (
    quantifiedNutrients &&
    typeof quantifiedNutrients.protein_g === 'number' &&
    typeof quantifiedNutrients.phosphorus_mg === 'number' &&
    typeof quantifiedNutrients.potassium_mg === 'number' &&
    typeof quantifiedNutrients.magnesium_mg === 'number' &&
    typeof quantifiedNutrients.calcium_mg === 'number'
  ) {
    const computedPral =
      0.49 * quantifiedNutrients.protein_g +
      0.037 * quantifiedNutrients.phosphorus_mg -
      0.021 * quantifiedNutrients.potassium_mg -
      0.026 * quantifiedNutrients.magnesium_mg -
      0.013 * quantifiedNutrients.calcium_mg;

    estimatedPRALScore = Math.round(computedPral * 10) / 10;
    pralStatus = 'calculated';
    if (estimatedPRALScore < -5) {
      pralInterpretation = 'alkalizing';
    } else if (estimatedPRALScore <= 5) {
      pralInterpretation = 'neutral';
    } else {
      pralInterpretation = 'acid_forming';
    }
  }

  const pralCaveat =
    'CLINICAL CAVEAT: Dietary Potential Renal Acid Load (PRAL) calculation according to the Remer & Manz equation requires quantified nutrient intakes (protein in g/day, phosphorus, potassium, magnesium, and calcium in mg/day). Frequency responses from FFQ provide qualitative dietary patterns but cannot accurately calculate renal acid load in mEq/day without verified gram-weight nutrient data. PRAL reflects urinary renal solute load and bone mineral preservation dynamics; it does NOT alter or indicate systemic arterial blood pH, which is homeostatically defended between 7.35 and 7.45.';

  return {
    plantFoodGroupDiversityScore: finalPlantScore,
    plantDiversityRank,
    dailyFruitVegServings,
    proteinFrequencyRank,
    ultraProcessedBurden,
    addedSugarExposure,
    sodiumRiskFlag,
    estimatedPRALScore,
    pralStatus,
    pralInterpretation,
    pralCaveat,
    completenessStatus,
    confirmedZeroCount: finalConfirmedZero,
    notSureCount: finalNotSure,
    unansweredCount: finalUnanswered,
  };
}
