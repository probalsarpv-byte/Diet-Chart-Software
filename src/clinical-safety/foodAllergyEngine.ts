/**
 * SHUDDHO FUNCTIONAL NUTRITION SOFTWARE
 * Food Allergy & Hard Restriction Safety Engine (Phase P0 Foundation)
 * 
 * Enforces non-overrideable allergen safety and clinician-prescribed food restrictions.
 * Global Precedence Level 1: Confirmed Allergy / Severe Medical Contraindication.
 */

import { FoodItem, PatientProfile, DietChartMeal, ClinicalSafetyResult } from '../types';

export function evaluateFoodAllergiesAndHardRestrictions(
  patient: PatientProfile,
  meals: DietChartMeal[],
  allFoods: FoodItem[]
): ClinicalSafetyResult[] {
  const results: ClinicalSafetyResult[] = [];
  const foodMap = new Map(allFoods.map(f => [f.id, f]));
  const allergies = (patient.confirmed_allergies || []).map(a => a.toLowerCase().trim());
  const clinicianDisallowedFoods = new Set(patient.clinician_disallowed_foods || []);
  const clinicianDisallowedTags = new Set(patient.clinician_disallowed_tags || []);

  const allergenTagMap: Record<string, string[]> = {
    egg: ['egg', 'contains_egg', 'contains_eggs'],
    peanut: ['peanut', 'peanuts', 'contains_peanut', 'contains_peanuts'],
    shrimp: ['shrimp', 'prawn', 'contains_shellfish', 'shellfish', 'crustacean'],
    cow_milk: ['cow_milk', 'milk', 'dairy', 'contains_dairy', 'contains_lactose', 'whey', 'casein'],
    dairy: ['cow_milk', 'milk', 'dairy', 'contains_dairy', 'contains_lactose', 'whey', 'casein'],
    gluten: ['gluten', 'contains_gluten', 'wheat', 'barley', 'rye'],
    wheat: ['wheat', 'contains_wheat', 'gluten', 'contains_gluten'],
    soy: ['soy', 'soybean', 'contains_soy'],
    tree_nuts: ['tree_nut', 'contains_tree_nuts', 'almond', 'cashew', 'walnut', 'pistachio'],
    fish: ['fish', 'contains_fish', 'sea_fish']
  };

  for (const meal of meals) {
    for (const item of meal.items) {
      const food = foodMap.get(item.food_id);
      if (!food) continue;

      const foodTags = (food.tags || []).map(t => t.toLowerCase());
      const foodNameLower = (food.name_en + ' ' + food.name_bn).toLowerCase();

      // 1. Confirmed Allergies Check (Non-overrideable Hard Stop)
      for (const allergen of allergies) {
        const associatedTags = allergenTagMap[allergen] || [allergen];
        const matchesTag = associatedTags.some(t => foodTags.includes(t));
        const matchesName = foodNameLower.includes(allergen);

        if (matchesTag || matchesName) {
          results.push({
            rule_id: 'ALLERGY_HARD_STOP',
            rule_version: '1.0.0',
            patient_id: patient.id,
            decision: 'HARD_STOP',
            severity: 'critical',
            title_en: `CRITICAL ALLERGEN DETECTED: ${food.name_en} contains ${allergen.toUpperCase()}`,
            title_bn: `মারাত্মক অ্যালার্জেন শনাক্ত: ${food.name_bn}-এ ${allergen} উপস্থিত`,
            clinical_explanation_en: `Patient has a documented confirmed allergy to '${allergen}'. Ingestion can trigger severe hypersensitivity or fatal anaphylaxis.`,
            clinical_explanation_bn: `রোগীর '${allergen}'-এ নিশ্চিত অ্যালার্জি রয়েছে। এটি সেবনে মারাত্মক অ্যালার্জিক প্রতিক্রিয়া হতে পারে।`,
            required_action_en: `Remove ${food.name_en} from meal '${meal.title_en}' immediately. Allergen restrictions are non-overrideable.`,
            required_action_bn: `'${meal.title_bn}' থেকে ${food.name_bn} অবিলম্বে অপসারণ করুন।`,
            affected_entity: {
              type: 'food',
              id: food.id,
              name_en: food.name_en,
              name_bn: food.name_bn
            },
            triggering_observations: [`allergy:${allergen}`],
            clinician_review_required: true,
            provenance_reference: 'Global Precedence Level 1: Confirmed Severe Allergy Safety',
            timestamp: new Date().toISOString()
          });
        }
      }

      // 2. Clinician Explicitly Disallowed Food (Hard Stop)
      if (clinicianDisallowedFoods.has(food.id)) {
        results.push({
          rule_id: 'CLINICIAN_DISALLOWED_FOOD_STOP',
          rule_version: '1.0.0',
          patient_id: patient.id,
          decision: 'HARD_STOP',
          severity: 'high',
          title_en: `Clinician Prescribed Restriction: ${food.name_en} is explicitly disallowed`,
          title_bn: `চিকিৎসক কর্তৃক নিষিদ্ধ খাদ্য: ${food.name_bn} তালিকাভুক্ত করা যাবে না`,
          clinical_explanation_en: `The attending nutritionist has specifically restricted food ID '${food.id}' for this patient record.`,
          clinical_explanation_bn: `দায়িত্বপ্রাপ্ত পুষ্টিবিদ এই রোগীর জন্য '${food.name_bn}' নির্দিষ্টভাবে নিষিদ্ধ করেছেন।`,
          required_action_en: `Remove ${food.name_en} or obtain clinician authorization to clear the disallowed restriction.`,
          required_action_bn: `${food.name_bn} খাবার তালিকা থেকে বাদ দিন।`,
          affected_entity: {
            type: 'food',
            id: food.id,
            name_en: food.name_en,
            name_bn: food.name_bn
          },
          triggering_observations: [`clinician_disallowed_food:${food.id}`],
          clinician_review_required: true,
          provenance_reference: 'Global Precedence Level 2: Patient-Specific Clinician Restriction',
          timestamp: new Date().toISOString()
        });
      }

      // 3. Clinician Explicitly Disallowed Tags (Hard Stop)
      for (const disallowedTag of Array.from(clinicianDisallowedTags)) {
        if (foodTags.includes(disallowedTag.toLowerCase())) {
          results.push({
            rule_id: 'CLINICIAN_DISALLOWED_TAG_STOP',
            rule_version: '1.0.0',
            patient_id: patient.id,
            decision: 'HARD_STOP',
            severity: 'high',
            title_en: `Clinician Tag Restriction: ${food.name_en} carries blocked tag '${disallowedTag}'`,
            title_bn: `চিকিৎসক কর্তৃক নিষিদ্ধ ট্যাগ: ${food.name_bn}-এ নিষিদ্ধ ট্যাগ '${disallowedTag}' বিদ্যমান`,
            clinical_explanation_en: `Clinician has blocked all foods tagged with '${disallowedTag}'.`,
            clinical_explanation_bn: `চিকিৎসক '${disallowedTag}' সম্পর্কিত সকল খাদ্য গ্রহণ সাময়িকভাবে নিষিদ্ধ করেছেন।`,
            required_action_en: `Replace ${food.name_en} with a compliant alternative.`,
            required_action_bn: `${food.name_bn} এর পরিবর্তে বিকল্প খাদ্য নির্বাচন করুন।`,
            affected_entity: {
              type: 'food',
              id: food.id,
              name_en: food.name_en,
              name_bn: food.name_bn
            },
            triggering_observations: [`disallowed_tag:${disallowedTag}`],
            clinician_review_required: true,
            provenance_reference: 'Global Precedence Level 2: Patient-Specific Clinician Restriction',
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }

  return results;
}
