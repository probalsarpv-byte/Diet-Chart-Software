import { 
  FoodItem, 
  ClinicalConditionId, 
  TrafficLightResult, 
  EvaluatedFoodItem, 
  EvaluatedReason, 
  MedicineItem,
  RestrictionCategory
} from '../types';
import { DISEASE_RULES } from './diseaseRules';

function norm(str: string): string {
  return (str || '').toLowerCase().trim();
}

/**
 * Deterministic Multi-Disease Conflict Resolver
 * Strict Hierarchy: RED > YELLOW > GREEN
 * 
 * Safety priorities:
 * 1. Confirmed Allergies (category: 'confirmed_allergy', RED, non-overridable)
 * 2. Clinician Direct Exclusions (category: 'clinician_restriction', RED, non-overridable)
 * 3. Drug-Food Hard Interactions (category: 'hard_contraindication', RED, non-overridable)
 * 4. Clinical Condition Contraindications (category: 'hard_contraindication', RED)
 * 5. Conditional Evidence / Precautions (category: 'evidence_conditional', YELLOW)
 * 6. Phase-Specific Restrictions (category: 'phase_specific', YELLOW or RED)
 * 7. Safe Baseline Whole Nutrition (category: 'preference', GREEN)
 */
export function resolveConflicts(
  foods: FoodItem[],
  conditions: ClinicalConditionId[],
  activeMedicines: MedicineItem[] = [],
  patientAllergies: string[] = [],
  clinicianDisallowedFoods: string[] = [],
  clinicianDisallowedTags: string[] = [],
  currentPhase: 1 | 2 | 3 | 4 = 1
): TrafficLightResult {
  const result: TrafficLightResult = {
    green: [],
    yellow: [],
    red: []
  };

  const selectedRules = conditions
    .map(c => DISEASE_RULES[c])
    .filter(Boolean);

  const normalizedAllergies = patientAllergies.map(norm).filter(Boolean);
  const normalizedClinicianFoods = clinicianDisallowedFoods.map(norm).filter(Boolean);
  const normalizedClinicianTags = clinicianDisallowedTags.map(norm).filter(Boolean);

  for (const food of foods) {
    const reasons: EvaluatedReason[] = [];
    const foodText = `${norm(food.name_en)} ${norm(food.name_bn)} ${norm(food.category)}`;

    // 1. Confirmed Allergies Check (Highest Safety Priority)
    for (const allergy of normalizedAllergies) {
      const allergyMatches = 
        foodText.includes(allergy) || 
        food.tags.some(t => norm(t).includes(allergy)) ||
        (allergy === 'dairy' && (food.category === 'dairy' || foodText.includes('milk') || foodText.includes('দুধ') || foodText.includes('ছানা') || foodText.includes('পনির') || foodText.includes('দই'))) ||
        (allergy === 'gluten' && (food.tags.includes('high_gluten') || foodText.includes('wheat') || foodText.includes('গম') || foodText.includes('ময়দা') || foodText.includes('আটা') || foodText.includes('সুজি'))) ||
        (allergy === 'egg' && (foodText.includes('egg') || foodText.includes('ডিম'))) ||
        (allergy === 'peanut' && (foodText.includes('peanut') || foodText.includes('চীনাবাদাম'))) ||
        (allergy === 'shrimp' && (foodText.includes('shrimp') || foodText.includes('prawn') || foodText.includes('চিংড়ি'))) ||
        (allergy === 'soy' && (foodText.includes('soy') || foodText.includes('সয়াবিন')));

      if (allergyMatches) {
        reasons.push({
          conditionId: 'ALLERGY',
          conditionNameBn: `নিশ্চিত অ্যালার্জি (${allergy})`,
          conditionNameEn: `Confirmed Allergen (${allergy})`,
          status: 'RED',
          category: 'confirmed_allergy',
          provenance: 'Patient Clinical Intake Profile',
          isOverridable: false,
          note_bn: `রোগীর নিশ্চিত অ্যালার্জি রয়েছে। এই খাদ্য সম্পূর্ণ নিষিদ্ধ।`,
          note_en: `Patient has a documented allergy to this substance. Absolute contraindication.`
        });
      }
    }

    // 2. Clinician Direct Restriction Check
    const isClinicianFoodBlocked = normalizedClinicianFoods.some(dis => 
      food.id === dis || foodText.includes(dis) || (food.code && food.code.toLowerCase() === dis)
    );
    const matchedClinicianTag = normalizedClinicianTags.find(tag => food.tags.includes(tag));

    if (isClinicianFoodBlocked || matchedClinicianTag) {
      reasons.push({
        conditionId: 'CLINICIAN_RULE',
        conditionNameBn: 'চিকিৎসকের সরাসরি নিষেধাজ্ঞা',
        conditionNameEn: 'Clinician Direct Exclusion',
        status: 'RED',
        category: 'clinician_restriction',
        provenance: 'Clinician Individualized Practice Rule',
        isOverridable: false,
        note_bn: `চিকিৎসক ব্যক্তিগত ক্লিনিক্যাল মূল্যায়নের ভিত্তিতে এই খাদ্যটি নিষিদ্ধ করেছেন${matchedClinicianTag ? ` (ট্যাগ: ${matchedClinicianTag})` : ''}।`,
        note_en: `Clinician has specifically restricted this item based on individual clinical evaluation${matchedClinicianTag ? ` (tag: ${matchedClinicianTag})` : ''}.`
      });
    }

    // 3. Drug-Food Interaction Check
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
          const isStrict = inter.action.startsWith('strictly');
          reasons.push({
            conditionId: 'DNI_INTERACTION',
            conditionNameBn: `ওষুধের মিথস্ক্রিয়া (${med.generic_name})`,
            conditionNameEn: `Drug-Food Interaction (${med.generic_name})`,
            status: isStrict ? 'RED' : 'YELLOW',
            category: isStrict ? 'hard_contraindication' : 'evidence_conditional',
            provenance: `Pharmacological Profile: ${med.drug_class}`,
            isOverridable: !isStrict,
            note_bn: inter.effect_bn,
            note_en: inter.effect_en
          });
        }
      }
    }

    // 4. Clinical Condition Disease Rules Check
    for (const rule of selectedRules) {
      const hasRedTag = food.tags.some(t => rule.redTags.includes(t));
      const hasRedFood = rule.redFoods?.some(rf => foodText.includes(norm(rf)) || food.code === rf);

      if (hasRedTag || hasRedFood) {
        reasons.push({
          conditionId: rule.id,
          conditionNameBn: rule.name_bn,
          conditionNameEn: rule.name_en,
          status: 'RED',
          category: 'hard_contraindication',
          provenance: `Evidence-based Disease Protocol: ${rule.name_en}`,
          isOverridable: false,
          note_bn: `${rule.name_bn}: এই খাদ্যটিতে রোগের জন্য ক্ষতিকর উপাদান (${hasRedTag ? food.tags.filter(t => rule.redTags.includes(t)).join(', ') : 'নিষিদ্ধ তালিকা'}) বিদ্যমান।`,
          note_en: `${rule.name_en}: Contraindicated due to clinical risk factors (${hasRedTag ? food.tags.filter(t => rule.redTags.includes(t)).join(', ') : 'restricted item'}).`
        });
      } else {
        const hasYellowTag = food.tags.some(t => rule.yellowTags.includes(t));
        const hasYellowFood = rule.yellowFoods?.some(yf => foodText.includes(norm(yf)) || food.code === yf);

        if (hasYellowTag || hasYellowFood) {
          let note_bn = `${rule.name_bn}: পরিমিত ও শর্তসাপেক্ষে গ্রহণীয়; অতিরিক্ত খেলে জটিলতা বাড়তে পারে।`;
          let note_en = `${rule.name_en}: Conditional/moderate intake. Monitor glycemic/metabolic tolerance.`;

          if (food.tags.includes('goitrogen_raw') && rule.id === 'hypothyroid') {
            note_bn = `${rule.name_bn}: কাঁচা গ্রহণ নিষিদ্ধ। তবে ভালোভাবে সেদ্ধ বা রান্না করে গ্রহণ করলে নিরাপদ।`;
            note_en = `${rule.name_en}: Avoid consuming raw. Thermally cooked or steamed is safe.`;
          } else if (food.tags.includes('phytate_soak_needed')) {
            note_bn = `${rule.name_bn}: পরিমিত গ্রহণীয়; রান্নার পূর্বে ৮-১২ ঘণ্টা পানিতে ভিজিয়ে রাখা আবশ্যক।`;
            note_en = `${rule.name_en}: Moderate portion; soaking for 8-12 hours is mandatory.`;
          }

          reasons.push({
            conditionId: rule.id,
            conditionNameBn: rule.name_bn,
            conditionNameEn: rule.name_en,
            status: 'YELLOW',
            category: 'evidence_conditional',
            provenance: `Functional Clinical Guidelines: ${rule.name_en}`,
            isOverridable: true,
            note_bn,
            note_en
          });
        } else {
          const hasGreenTag = food.tags.some(t => rule.greenTags.includes(t));
          const hasGreenFood = rule.greenFoods?.some(gf => foodText.includes(norm(gf)) || food.code === gf);

          if (hasGreenTag || hasGreenFood) {
            reasons.push({
              conditionId: rule.id,
              conditionNameBn: rule.name_bn,
              conditionNameEn: rule.name_en,
              status: 'GREEN',
              category: 'preference',
              provenance: `Therapeutic Food Guideline: ${rule.name_en}`,
              isOverridable: true,
              note_bn: `${rule.name_bn}: থেরাপিউটিকভাবে উপকারী এবং নিরাময় সহায়ক উপাদান সমৃদ্ধ।`,
              note_en: `${rule.name_en}: Therapeutically beneficial and actively encouraged.`
            });
          }
        }
      }
    }

    // 5. Phase-Specific Considerations (Phase 1 Elimination vs Later Phases)
    if (currentPhase === 1) {
      if (food.tags.includes('high_fodmap') && conditions.includes('gut_dysbiosis')) {
        const alreadyFlaggedRed = reasons.some(r => r.category === 'hard_contraindication' && r.status === 'RED');
        if (!alreadyFlaggedRed) {
          reasons.push({
            conditionId: 'PHASE_RULE',
            conditionNameBn: 'ফেজ ১: পরিপাক তন্ত্র পুনরুদ্ধার (Elimination)',
            conditionNameEn: 'Phase 1: Gut Reset / Elimination Protocol',
            status: 'YELLOW',
            category: 'phase_specific',
            provenance: '4-Phase Functional Protocol: Phase 1',
            isOverridable: true,
            note_bn: 'ফেজ ১ এ সাময়িক বাদ রাখা বা ক্ষুদ্রাংশে সীমাবদ্ধ রাখা উত্তম।',
            note_en: 'Recommended to temporarily restrict or strictly limit during initial Phase 1 elimination.'
          });
        }
      }
    }

    // 6. Strictest-Wins Determination: RED > YELLOW > GREEN
    let finalStatus: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
    const hasRed = reasons.some(r => r.status === 'RED');
    const hasYellow = reasons.some(r => r.status === 'YELLOW');
    const hasGreen = reasons.some(r => r.status === 'GREEN');

    const isHardBlocked = reasons.some(r => 
      r.status === 'RED' && (r.category === 'confirmed_allergy' || r.category === 'clinician_restriction' || r.category === 'hard_contraindication')
    );

    if (hasRed) {
      finalStatus = 'RED';
    } else if (hasYellow) {
      finalStatus = 'YELLOW';
    } else if (hasGreen) {
      finalStatus = 'GREEN';
    } else {
      // Default baseline: Safe whole food with no active flags
      finalStatus = 'GREEN';
      if (reasons.length === 0) {
        reasons.push({
          conditionId: selectedRules[0]?.id || 't2d_ir',
          conditionNameBn: "সাধারণ পরিমিত পুষ্টি",
          conditionNameEn: "General Whole Nutrition",
          status: 'GREEN',
          category: 'preference',
          provenance: 'Standard Whole Food Baseline',
          isOverridable: true,
          note_bn: "নির্বাচিত স্বাস্থ্য অবস্থার সাথে কোনো সংঘাত নেই; স্বাস্থ্যকর ও নিরাপদ।",
          note_en: "No active clinical contraindication identified; safe whole food."
        });
      }
    }

    const evaluatedFood: EvaluatedFoodItem = {
      ...food,
      traffic_status: finalStatus,
      reasons,
      hard_blocked: isHardBlocked
    };

    if (finalStatus === 'RED') {
      result.red.push(evaluatedFood);
    } else if (finalStatus === 'YELLOW') {
      result.yellow.push(evaluatedFood);
    } else {
      result.green.push(evaluatedFood);
    }
  }

  // Sort logically: most relevant / safe first
  result.green.sort((a, b) => b.tags.length - a.tags.length);
  result.yellow.sort((a, b) => b.reasons.length - a.reasons.length);
  result.red.sort((a, b) => b.reasons.length - a.reasons.length);

  return result;
}
