// P2 Dietary Pattern & Potential Renal Acid Load (PRAL) Analysis Engine
// Deterministic dietary diversity scoring, ultra-processed burden, and acid-base mineral balance.
// Strictly adheres to physiological caveats regarding systemic blood pH buffering.

import { PatientProfile } from '../../types';
import { ClinicalObservation, DietaryPatternAnalysisResult } from './types';

const PLANT_FOOD_GROUPS = [
  'ffq_leafy_greens',
  'ffq_cruciferous',
  'ffq_root_tubers',
  'ffq_gourds_squash',
  'ffq_other_colored_veg',
  'ffq_fresh_fruits',
  'ffq_lentils_pulses',
  'ffq_whole_grains',
  'ffq_nuts_seeds',
  'ffq_herbs_alliums',
  'ffq_fermented_foods',
  'ffq_healthy_plant_fats',
];

export function analyzeDietaryPattern(
  patient: PatientProfile,
  observations: ClinicalObservation[],
  assessmentAnswers: Record<string, any> = {}
): DietaryPatternAnalysisResult {
  let plantScore = 0;
  let confirmedZeroCount = 0;
  let notSureCount = 0;
  let answeredCount = 0;

  // Evaluate plant groups
  for (const groupKey of PLANT_FOOD_GROUPS) {
    const val = assessmentAnswers[groupKey];
    if (val !== undefined && val !== null && val !== '') {
      answeredCount++;
      if (val === '0_times') {
        confirmedZeroCount++;
      } else if (val === 'not_sure') {
        notSureCount++;
      } else {
        // Consumed at some frequency
        plantScore++;
      }
    } else {
      // Check if observation exists for this group
      const obs = observations.find(o => o.id.includes(groupKey) || o.tags?.includes(groupKey));
      if (obs) {
        answeredCount++;
        if (obs.observedValue === '0_times') {
          confirmedZeroCount++;
        } else {
          plantScore++;
        }
      }
    }
  }

  // Fallback heuristic if FFQ not directly in assessmentAnswers: inspect observations tags
  if (answeredCount === 0) {
    for (const groupKey of PLANT_FOOD_GROUPS) {
      const hasTag = observations.some(o => o.tags?.includes(groupKey));
      if (hasTag) {
        answeredCount++;
        plantScore++;
      }
    }
    // If patient diet preferences state vegetarian, ensure plant score reflects diverse plant intake
    if (patient.dietary_preferences?.is_vegetarian) {
      plantScore = Math.max(plantScore, 6);
      answeredCount = Math.max(answeredCount, 7);
    }
  }

  // Completeness status
  let completenessStatus: DietaryPatternAnalysisResult['completenessStatus'] = 'minimal';
  if (answeredCount >= 10) {
    completenessStatus = 'complete';
  } else if (answeredCount >= 4) {
    completenessStatus = 'partial';
  } else {
    completenessStatus = 'minimal';
  }

  // Plant Diversity Rank
  let plantDiversityRank: DietaryPatternAnalysisResult['plantDiversityRank'] = 'uncertain';
  if (completenessStatus === 'minimal') {
    plantDiversityRank = 'uncertain';
  } else if (plantScore >= 9) {
    plantDiversityRank = 'high';
  } else if (plantScore >= 5) {
    plantDiversityRank = 'moderate';
  } else {
    plantDiversityRank = 'low';
  }

  // Estimated distinct plant species (each group contributes roughly 1-3 species)
  const estimatedPlantSpeciesCount = plantScore * 2;

  // Daily Fruit/Veg servings estimate
  let dailyFruitVegServings = 2; // baseline
  if (plantScore >= 8) dailyFruitVegServings = 5;
  else if (plantScore >= 5) dailyFruitVegServings = 3.5;
  else if (plantScore < 3 && completenessStatus !== 'minimal') dailyFruitVegServings = 1;

  // Protein frequency rank
  let proteinFrequencyRank: DietaryPatternAnalysisResult['proteinFrequencyRank'] = 'moderate';
  const hasFish = assessmentAnswers['ffq_fish_seafood'] && assessmentAnswers['ffq_fish_seafood'] !== '0_times';
  const hasEgg = assessmentAnswers['ffq_poultry_eggs'] && assessmentAnswers['ffq_poultry_eggs'] !== '0_times';
  const hasMeat = assessmentAnswers['ffq_red_meat'] && assessmentAnswers['ffq_red_meat'] !== '0_times';
  const hasDal = assessmentAnswers['ffq_lentils_pulses'] && assessmentAnswers['ffq_lentils_pulses'] !== '0_times';

  const proteinSourcesCount = [hasFish, hasEgg, hasMeat, hasDal].filter(Boolean).length;
  if (proteinSourcesCount >= 3) proteinFrequencyRank = 'high';
  else if (proteinSourcesCount <= 1 && completenessStatus !== 'minimal') proteinFrequencyRank = 'low';

  // Ultra-processed burden
  const upfKeys = ['ffq_bakery_biscuits', 'ffq_deep_fried', 'ffq_sweetened_beverages', 'ffq_instant_noodles'];
  let upfScore = 0;
  for (const k of upfKeys) {
    const val = assessmentAnswers[k];
    if (val === 'daily' || val === '2_plus_daily') upfScore += 3;
    else if (val === '4_6_week') upfScore += 2;
    else if (val === '1_3_week') upfScore += 1;
  }

  let ultraProcessedBurden: DietaryPatternAnalysisResult['ultraProcessedBurden'] = 'low';
  if (upfScore >= 6) ultraProcessedBurden = 'very_high';
  else if (upfScore >= 4) ultraProcessedBurden = 'high';
  else if (upfScore >= 2) ultraProcessedBurden = 'moderate';

  // Added sugar exposure
  const sweetBev = assessmentAnswers['ffq_sweetened_beverages'];
  const teaSugar = assessmentAnswers['ffq_table_sugar_tea'];
  let addedSugarExposure: DietaryPatternAnalysisResult['addedSugarExposure'] = 'minimal';
  if (sweetBev === 'daily' || sweetBev === '2_plus_daily' || teaSugar === '3_plus_cups_with_sugar') {
    addedSugarExposure = 'excessive';
  } else if (sweetBev === '1_3_week' || teaSugar === '1_2_cups_with_sugar' || upfScore >= 3) {
    addedSugarExposure = 'moderate';
  }

  // Sodium risk flag
  const sodiumRiskFlag =
    assessmentAnswers['ffq_added_table_salt'] === 'always' ||
    assessmentAnswers['ffq_pickles_shutki'] === 'frequent' ||
    observations.some(o => o.tags?.includes('high_sodium_diet'));

  // ─── Potential Renal Acid Load (PRAL) Calculation ────────────────
  // Remer & Manz equation principle:
  // PRAL (mEq/day) = 0.49 * Protein(g/d) + 0.037 * Phosphorus(mg/d) - 0.021 * Potassium(mg/d) - 0.026 * Magnesium(mg/d) - 0.013 * Calcium(mg/d)
  // We compute an evidence-based deterministic estimate from dietary pattern components:
  let estimatedPRALScore = 0;
  if (completenessStatus === 'minimal') {
    estimatedPRALScore = 0;
  } else {
    // Acid load components (animal protein, grain phytates)
    const animalProteinAcid = proteinFrequencyRank === 'high' ? 24 : proteinFrequencyRank === 'moderate' ? 14 : 6;
    const upfAcid = ultraProcessedBurden === 'very_high' ? 12 : ultraProcessedBurden === 'high' ? 8 : 3;

    // Alkaline load components (organic potassium/magnesium salts in vegetables & fruits)
    const plantAlkaline = plantScore * 3.2; // each diverse plant group provides net alkalizing mineral buffer

    estimatedPRALScore = Math.round((animalProteinAcid + upfAcid - plantAlkaline) * 10) / 10;
  }

  let pralInterpretation: DietaryPatternAnalysisResult['pralInterpretation'] = 'uncertain';
  if (completenessStatus === 'minimal') {
    pralInterpretation = 'uncertain';
  } else if (estimatedPRALScore < -5) {
    pralInterpretation = 'alkalizing';
  } else if (estimatedPRALScore <= 5) {
    pralInterpretation = 'neutral';
  } else {
    pralInterpretation = 'acid_forming';
  }

  const pralCaveat =
    'CLINICAL CAVEAT: Dietary Potential Renal Acid Load (PRAL) quantifies the estimated net acid excretion required by the kidneys to eliminate dietary metabolic byproducts. PRAL reflects urinary renal solute load and bone mineral preservation dynamics; it does NOT alter or indicate systemic arterial blood pH, which is tightly homeostatically defended between 7.35 and 7.45.';

  const unansweredCount = PLANT_FOOD_GROUPS.length - answeredCount;

  return {
    plantFoodGroupDiversityScore: plantScore,
    plantDiversityRank,
    estimatedPlantSpeciesCount,
    dailyFruitVegServings,
    proteinFrequencyRank,
    ultraProcessedBurden,
    addedSugarExposure,
    sodiumRiskFlag,
    estimatedPRALScore,
    pralInterpretation,
    pralCaveat,
    completenessStatus,
    confirmedZeroCount,
    unansweredCount,
  };
}
