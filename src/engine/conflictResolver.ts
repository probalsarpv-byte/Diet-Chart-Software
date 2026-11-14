import { 
  FoodItem, 
  ClinicalConditionId, 
  TrafficLightResult, 
  EvaluatedFoodItem, 
  EvaluatedReason, 
  MedicineItem 
} from '../types';
import { DISEASE_RULES } from './diseaseRules';

function norm(str: string): string {
  return (str || '').toLowerCase().trim();
}

/**
 * Deterministic Multi-Disease Conflict Resolver
 * Strict Hierarchy: RED > YELLOW > GREEN
 * If ANY condition or active drug-food interaction marks a food as RED,
 * the final classification MUST BE RED.
 */
export function resolveConflicts(
  foods: FoodItem[],
  conditions: ClinicalConditionId[],
  activeMedicines: MedicineItem[] = []
): TrafficLightResult {
  const result: TrafficLightResult = {
    green: [],
    yellow: [],
    red: []
  };

  const selectedRules = conditions
    .map(c => DISEASE_RULES[c])
    .filter(Boolean);

  for (const food of foods) {
    const reasons: EvaluatedReason[] = [];
    const foodText = `${norm(food.name_en)} ${norm(food.name_bn)} ${norm(food.category)}`;

    // 1. Evaluate against each selected disease rule
    for (const rule of selectedRules) {
      let status: 'GREEN' | 'YELLOW' | 'RED' | null = null;
      let note_bn = '';
      let note_en = '';

      // Check RED criteria
      const hasRedTag = food.tags.some(t => rule.redTags.includes(t));
      const hasRedFood = rule.redFoods?.some(rf => foodText.includes(norm(rf)) || food.code === rf);

      if (hasRedTag || hasRedFood) {
        status = 'RED';
        note_bn = `${rule.name_bn}: এই খাদ্যটিতে রোগের জন্য ক্ষতিকর উপাদান (${hasRedTag ? food.tags.filter(t => rule.redTags.includes(t)).join(', ') : 'নিষিদ্ধ তালিকা'}) বিদ্যমান।`;
        note_en = `${rule.name_en}: Contraindicated due to risk factors (${hasRedTag ? food.tags.filter(t => rule.redTags.includes(t)).join(', ') : 'restricted item'}).`;
      } else {
        // Check YELLOW criteria
        const hasYellowTag = food.tags.some(t => rule.yellowTags.includes(t));
        const hasYellowFood = rule.yellowFoods?.some(yf => foodText.includes(norm(yf)) || food.code === yf);

        if (hasYellowTag || hasYellowFood) {
          status = 'YELLOW';
          if (food.tags.includes('goitrogen_raw') && rule.id === 'hypothyroid') {
            note_bn = `${rule.name_bn}: কাঁচা গ্রহণ নিষিদ্ধ। তবে ভালোভাবে সেদ্ধ বা রান্না করে গ্রহণ করলে নিরাপদ।`;
            note_en = `${rule.name_en}: Avoid consuming raw. Thermally cooked or steamed is safe.`;
          } else if (food.tags.includes('phytate_soak_needed')) {
            note_bn = `${rule.name_bn}: পরিমিত গ্রহণীয়; রান্নার পূর্বে ৮-১২ ঘণ্টা পানিতে ভিজিয়ে রাখা আবশ্যক।`;
            note_en = `${rule.name_en}: Moderate portion; soaking for 8-12 hours is mandatory.`;
          } else {
            note_bn = `${rule.name_bn}: পরিমিত ও শর্তসাপেক্ষে গ্রহণীয়; অতিরিক্ত খেলে জটিলতা বাড়তে পারে।`;
            note_en = `${rule.name_en}: Conditional/moderate intake. Monitor glycemic/metabolic tolerance.`;
          }
        } else {
          // Check GREEN criteria
          const hasGreenTag = food.tags.some(t => rule.greenTags.includes(t));
          const hasGreenFood = rule.greenFoods?.some(gf => foodText.includes(norm(gf)) || food.code === gf);

          if (hasGreenTag || hasGreenFood) {
            status = 'GREEN';
            note_bn = `${rule.name_bn}: থেরাপিউটিকভাবে উপকারী এবং নিরাময় সহায়ক উপাদান সমৃদ্ধ।`;
            note_en = `${rule.name_en}: Therapeutically beneficial and actively encouraged.`;
          }
        }
      }

      if (status) {
        reasons.push({
          conditionId: rule.id,
          conditionNameBn: rule.name_bn,
          conditionNameEn: rule.name_en,
          status,
          note_bn,
          note_en
        });
      }
    }

    // 2. Evaluate against active prescription medications (Drug-Nutrient / Drug-Food Interactions)
    for (const med of activeMedicines) {
      for (const inter of med.food_interactions) {
        const target = norm(inter.food_or_group);
        let matches = false;
        if (target.includes('grapefruit') && (foodText.includes('grapefruit') || foodText.includes('বাতাবি') || foodText.includes('জাম্বুরা'))) {
          matches = true;
        } else if (target.includes('alcohol') && foodText.includes('alcohol')) {
          matches = true;
        } else if (target.includes('potassium') && food.tags.includes('high_potassium') && inter.action === 'caution_hyperkalemia') {
          matches = true;
        } else if (target.includes('sugar') && (food.tags.includes('high_fructose') || food.glycemic_load === 'high')) {
          matches = true;
        }

        if (matches) {
          reasons.push({
            conditionId: 'DNI_INTERACTION',
            conditionNameBn: `ওষুধের মিথস্ক্রিয়া (${med.generic_name})`,
            conditionNameEn: `Drug-Food Interaction (${med.generic_name})`,
            status: inter.action.startsWith('strictly') ? 'RED' : 'YELLOW',
            note_bn: inter.effect_bn,
            note_en: inter.effect_en
          });
        }
      }
    }

    // 3. Strictest-Wins Determination: RED > YELLOW > GREEN
    let finalStatus: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';

    const hasRed = reasons.some(r => r.status === 'RED');
    const hasYellow = reasons.some(r => r.status === 'YELLOW');
    const hasGreen = reasons.some(r => r.status === 'GREEN');

    if (hasRed) {
      finalStatus = 'RED';
    } else if (hasYellow) {
      finalStatus = 'YELLOW';
    } else if (hasGreen) {
      finalStatus = 'GREEN';
    } else {
      // Default: If no conditions flagged it negatively, whole natural food is GREEN
      finalStatus = food.per_100g.kcal > 400 && food.category !== 'fat_oil' && food.category !== 'seed_nut' ? 'YELLOW' : 'GREEN';
      if (reasons.length === 0) {
        reasons.push({
          conditionId: selectedRules[0]?.id || 't2d_ir',
          conditionNameBn: "সাধারণ পরিমিত পুষ্টি",
          conditionNameEn: "General Whole Nutrition",
          status: finalStatus,
          note_bn: "নির্বাচিত স্বাস্থ্য অবস্থার সাথে কোনো সংঘাত নেই; স্বাস্থ্যকর ও নিরাপদ।",
          note_en: "No active clinical contraindication identified; safe whole food."
        });
      }
    }

    const evaluatedFood: EvaluatedFoodItem = {
      ...food,
      traffic_status: finalStatus,
      reasons
    };

    if (finalStatus === 'RED') {
      result.red.push(evaluatedFood);
    } else if (finalStatus === 'YELLOW') {
      result.yellow.push(evaluatedFood);
    } else {
      result.green.push(evaluatedFood);
    }
  }

  // Sort logically: most relevant first
  result.green.sort((a, b) => b.tags.length - a.tags.length);
  result.yellow.sort((a, b) => b.reasons.length - a.reasons.length);
  result.red.sort((a, b) => b.reasons.length - a.reasons.length);

  return result;
}

