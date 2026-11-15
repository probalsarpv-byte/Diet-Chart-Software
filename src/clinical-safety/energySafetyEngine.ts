/**
 * SHUDDHO FUNCTIONAL NUTRITION SOFTWARE
 * Energy Floor & Nutritional Requirement Safety Engine (Phase P0 Foundation)
 * 
 * Enforces non-bypassable BMR energy floor for adult weight management:
 * Daily Planned Energy >= Estimated BMR.
 * Validates actual day totals including discretionary cooking oils/fats.
 */

import { PatientProfile, DietChartMeal, ClinicalSafetyResult, DiscretionaryFatAndSaltSchedule } from '../types';

export function evaluateEnergySafety(
  patient: PatientProfile,
  meals: DietChartMeal[],
  discretionarySchedule?: DiscretionaryFatAndSaltSchedule
): ClinicalSafetyResult[] {
  const results: ClinicalSafetyResult[] = [];
  const pop = patient.population_group;
  const pathways = patient.clinical_pathways || [];

  // Calculate actual total planned energy from meals
  const mealCalories = meals.reduce((sum, m) => sum + (m.meal_calories || 0), 0);
  
  // Discretionary oil/ghee calories (9 kcal/g fat)
  const discretionaryFatKcal = discretionarySchedule?.total_fat_calories 
    ?? ((discretionarySchedule?.total_added_fat_g ?? 0) * 9);

  const totalDailyCalories = mealCalories + discretionaryFatKcal;
  const bmr = patient.calculated?.bmr || 0;
  const strategy = patient.bmr_floor_strategy || 'clamped_to_bmr';
  const customFloor = patient.custom_calorie_floor;

  // 1. Special Populations Safety Routing (Pediatric, Pregnancy, Lactation, Malnutrition)
  if (pop === 'pregnancy') {
    if (totalDailyCalories < 1800 && totalDailyCalories > 0) {
      results.push({
        rule_id: 'PREGNANCY_ENERGY_ADEQUACY_STOP',
        rule_version: '1.0.0',
        patient_id: patient.id,
        decision: 'HARD_STOP',
        severity: 'critical',
        title_en: 'Gestational Energy Floor Violation: Hypocaloric Plan in Pregnancy',
        title_bn: 'গর্ভাবস্থায় বিপজ্জনক ক্যালোরি ঘাটতি: অপর্যাপ্ত খাদ্যতালিকা',
        clinical_explanation_en: `Planned total energy (${totalDailyCalories} kcal) is below the minimum safe gestational threshold (1800 kcal/day). Hypocaloric diets induce maternal ketonemia and fetal growth restriction.`,
        clinical_explanation_bn: `গর্ভাবস্থায় পরিকল্পিত ক্যালোরি (${totalDailyCalories} kcal) নিরাপদ সীমার (১৮০০ kcal) নিচে। এটি ভ্রূণের বৃদ্ধিতে বাধা সৃষ্টি করতে পারে।`,
        required_action_en: 'Increase energy intake to meet gestational requirements. Weight-loss deficits are strictly contraindicated in pregnancy.',
        required_action_bn: 'ক্যালোরি বৃদ্ধি করুন। গর্ভাবস্থায় ওজন কমানোর ডায়েট সম্পূর্ণ নিষিদ্ধ।',
        triggering_observations: [`pregnancy_trimester:${patient.trimester || 1}`],
        clinician_review_required: true,
        provenance_reference: 'ACOG / IOM Gestational Weight Gain & Nutritional Guidelines',
        timestamp: new Date().toISOString()
      });
    }
    return results; // Skip adult weight management check
  }

  if (pop === 'pediatric' || patient.age < 18) {
    results.push({
      rule_id: 'PEDIATRIC_GROWTH_ROUTE_ADVISORY',
      rule_version: '1.0.0',
      patient_id: patient.id,
      decision: 'CLINICAL_REVIEW_REQUIRED',
      severity: 'high',
      title_en: 'Pediatric Patient: Adult Energy Restriction Blocked',
      title_bn: 'শিশুর পুষ্টি: প্রাপ্তবয়স্কদের ওজন কমানোর হিসাব প্রযোজ্য নয়',
      clinical_explanation_en: 'Adult functional weight management equations do not account for pediatric growth velocity and pubertal development.',
      clinical_explanation_bn: 'শিশুর ক্ষেত্রে প্রাপ্তবয়স্কদের সমীকরণ ব্যবহার করা যাবে না। বৃদ্ধির জন্য পর্যাপ্ত পুষ্টি প্রয়োজন।',
      required_action_en: 'Route patient to pediatric growth and energy calculation charts (WHO/CDC growth standards).',
      required_action_bn: 'হু/সিডিসি পেডিয়াট্রিক গ্রোথ চার্ট অনুসরণ করুন।',
      triggering_observations: [`patient_age:${patient.age}`],
      clinician_review_required: true,
      provenance_reference: 'WHO Pediatric Growth & Energy Requirement Guidelines',
      timestamp: new Date().toISOString()
    });
    return results;
  }

  if (pop === 'oncology' || pathways.includes('oncology') || (patient.weight_kg && patient.weight_kg < 45)) {
    if (totalDailyCalories < (bmr * 1.2) && totalDailyCalories > 0) {
      results.push({
        rule_id: 'ONCOLOGY_CACHECHIA_ENERGY_STOP',
        rule_version: '1.0.0',
        patient_id: patient.id,
        decision: 'HARD_STOP',
        severity: 'critical',
        title_en: 'Oncology / Malnutrition: Inadequate Caloric Provision',
        title_bn: 'ক্যান্সার ও ম্যালনিউট্রিশন: মারাত্মক ক্যালোরি ঘাটতি',
        clinical_explanation_en: `Planned daily energy (${totalDailyCalories} kcal) is below the hypermetabolic requirement (estimated BMR * 1.2 = ${Math.round(bmr * 1.2)} kcal). Risks accelerated cancer cachexia and loss of lean mass.`,
        clinical_explanation_bn: `পরিকল্পিত ক্যালোরি ক্যান্সার মেটাবলিজমের চাহিদার তুলনায় কম। এটি পেশিক্ষয় ত্বরান্বিত করবে।`,
        required_action_en: 'Mandate hypercaloric, high-protein nutritional restoration protocol.',
        required_action_bn: 'উচ্চ ক্যালোরি ও উচ্চ প্রোটিনযুক্ত খাবার নিশ্চিত করুন।',
        triggering_observations: [`weight_kg:${patient.weight_kg}`, 'oncology_malnutrition_risk'],
        clinician_review_required: true,
        provenance_reference: 'ESPEN Guidelines on Nutrition in Cancer Patients',
        timestamp: new Date().toISOString()
      });
    }
    return results;
  }

  // 2. Adult Functional Weight Management: Planned Daily Energy >= Estimated BMR
  const effectiveFloor = strategy === 'clinician_custom' && customFloor && customFloor > 0
    ? customFloor
    : bmr;

  if (strategy !== 'unrestricted_clinical_guidance' && bmr > 0 && totalDailyCalories > 0) {
    if (totalDailyCalories < effectiveFloor) {
      const deficit = Math.round(effectiveFloor - totalDailyCalories);
      results.push({
        rule_id: 'ADULT_BMR_FLOOR_HARD_STOP',
        rule_version: '1.0.0',
        patient_id: patient.id,
        decision: 'HARD_STOP',
        severity: 'critical',
        title_en: `BMR Calorie Floor Violation: Total Energy (${totalDailyCalories} kcal) Below Basal Requirement (${effectiveFloor} kcal)`,
        title_bn: `বিএমআর ক্যালোরি ফ্লোর লঙ্ঘন: দৈনিক ক্যালোরি (${totalDailyCalories} kcal) মূল মেটাবলিক চাহিদার (${effectiveFloor} kcal) নিচে`,
        clinical_explanation_en: `The actual calculated total of the planned day (${totalDailyCalories} kcal, including meals and oils) is below the patient's estimated BMR (${effectiveFloor} kcal) by ${deficit} kcal. Severe hypocaloria slows metabolic rate (adaptive thermogenesis), increases muscle loss, and precipitates gallbladder stasis.`,
        clinical_explanation_bn: `পরিকল্পিত দৈনিক খাবার ও তেলের মোট ক্যালোরি (${totalDailyCalories} kcal) রোগীর বিএমআরের (${effectiveFloor} kcal) চেয়ে ${deficit} kcal কম। অতিরিক্ত ক্যালোরি হ্রাস মেটাবলিজম ধীর করে এবং পেশি ক্ষয় বাড়ায়।`,
        required_action_en: `Adjust portion sizes, meal items, or discretionary oils to provide at least ${effectiveFloor} kcal/day. Final approval cannot be granted while below BMR.`,
        required_action_bn: `খাবারের পরিমাণ বা তেলের মাত্রা বাড়িয়ে দৈনিক ক্যালোরি অন্তত ${effectiveFloor} kcal এ উন্নীত করুন।`,
        affected_entity: {
          type: 'nutrient',
          id: 'energy_kcal',
          name_en: 'Daily Energy (kcal)',
          name_bn: 'দৈনিক ক্যালোরি'
        },
        triggering_observations: [`planned_kcal:${totalDailyCalories}`, `bmr_floor:${effectiveFloor}`],
        clinician_review_required: true,
        provenance_reference: 'Shuddho Adult Functional Weight Management BMR-Floor Policy',
        timestamp: new Date().toISOString()
      });
    }
  }

  return results;
}
