// P2 Masanumasika Pregnancy Nutrition Analysis Engine
// Connects the classical 9-month Ayurvedic Garbhini Paricharya framework
// with modern maternal-fetal nutritional requirements using accessible Bangladeshi whole foods.
// Strictly non-pharmacological: Zero medicinal herbs, zero bhasmas, zero Panchakarma.
// Strict Clinical Integrity: NEVER invent or guess gestational weeks from trimester defaults.

import { PatientProfile } from '../../types';
import { MasanumasikaPregnancyAnalysisResult } from './types';
import {
  MASANUMASIKA_MONTH_FRAMEWORKS,
  calculatePregnancyMonth,
  getTrimesterFromWeeks,
} from '../../questionnaire/masanumasikaData';
import { MasanumasikaPregnancyAssessment } from '../../types/assessment';

export function analyzeMasanumasikaPregnancy(
  patient: PatientProfile,
  assessmentAnswers: Record<string, any> = {},
  p1Pregnancy?: MasanumasikaPregnancyAssessment | any
): MasanumasikaPregnancyAnalysisResult {
  const isPreg =
    patient.population_group === 'pregnancy' ||
    patient.trimester !== undefined ||
    assessmentAnswers['q_pop_pregnancy_status'] === 'pregnant' ||
    Boolean(p1Pregnancy);

  if (!isPreg) {
    return {
      applicable: false,
      gestationalAgeVerified: true,
      safetyBoundaryNotice: 'Masanumasika analysis is not applicable for non-pregnant patients.',
      clinicianReviewStatus: 'reviewed',
    };
  }

  // 1. Determine recorded gestational age without guessing defaults
  const ansWeeks =
    p1Pregnancy?.gestational_age_weeks ??
    assessmentAnswers['q_pregnancy_gestational_weeks'] ??
    assessmentAnswers['pregnancy_gestational_week'] ??
    (patient as any).gestational_age_weeks;

  const ansDays =
    p1Pregnancy?.gestational_age_days ??
    assessmentAnswers['q_pregnancy_gestational_days'] ??
    assessmentAnswers['pregnancy_gestational_day'] ??
    (patient as any).gestational_age_days ??
    0;

  const hasRecordedWeeks =
    typeof ansWeeks === 'number' &&
    !isNaN(ansWeeks) &&
    ansWeeks > 0 &&
    ansWeeks <= 44;

  // CLINICAL SAFETY AUDIT REQUIREMENT:
  // If gestational age is not explicitly recorded, do NOT guess from trimester (e.g. 16 weeks).
  // Require clinician verification explicitly.
  if (!hasRecordedWeeks) {
    return {
      applicable: true,
      gestationalAgeVerified: false,
      gestationalWeeks: undefined,
      gestationalDays: undefined,
      pregnancyMonth: undefined,
      trimester: patient.trimester || undefined,
      safetyBoundaryNotice:
        'GESTATIONAL AGE UNVERIFIED: Gestational weeks not recorded in assessment. Clinician verification of gestational age is mandatory before prescribing month-specific Masanumasika dietary guidance.',
      clinicianReviewStatus: 'pending',
    };
  }

  const gestationalWeeks = ansWeeks;
  const gestationalDays = typeof ansDays === 'number' && !isNaN(ansDays) ? ansDays : 0;

  const pregnancyMonth = calculatePregnancyMonth(gestationalWeeks, gestationalDays);
  const trimester = getTrimesterFromWeeks(gestationalWeeks);

  const framework = MASANUMASIKA_MONTH_FRAMEWORKS[pregnancyMonth] || MASANUMASIKA_MONTH_FRAMEWORKS[1];

  // Month titles
  const monthNames_en = [
    'First Month (Prathama Masa) - Implantation & Cellular Genesis',
    'Second Month (Dvitiya Masa) - Embryonic Differentiation & Heart Rhythm',
    'Third Month (Tritiya Masa) - Limb Genesis & Organ Primordia',
    'Fourth Month (Chaturtha Masa) - Fetal Somatic Stability & Dwauhridaya',
    'Fifth Month (Panchama Masa) - Muscular Mass & Fetal Sensation (Manas)',
    'Sixth Month (Shashtha Masa) - Integument, Vitality (Ojas) & Strength',
    'Seventh Month (Saptama Masa) - Full Somatic Maturation & Hair/Nail Growth',
    'Eighth Month (Ashtama Masa) - Ojas Stabilization & Maternal Metabolic Fluidity',
    'Ninth Month (Navama Masa) - Pelvic Preparation & Natural Labor Readiness',
  ];

  const monthNames_bn = [
    'প্রথম মাস (প্রথম মাস) - ভ্রূণ সংস্থাপন ও কোষীয় বিভাজন',
    'দ্বিতীয় মাস (দ্বিতীয় মাস) - অঙ্গের কুঁড়ি ও প্রাথমিক হৃদস্পন্দন',
    'তৃতীয় মাস (তৃতীয় মাস) - হাত-পা ও প্রধান প্রত্যঙ্গের বিকাশ',
    'চতুর্থ মাস (চতুর্থ মাস) - ভ্রূণের স্থিতিশীলতা ও দ্বি-হৃদয় পর্ব',
    'পঞ্চম মাস (পঞ্চম মাস) - পেশীবহুল বৃদ্ধি ও ভ্রূণের মানসিক চেতনা',
    'ষষ্ঠ মাস (ষষ্ঠ মাস) - ত্বকের পূর্ণতা, তেজ (ওজঃ) ও শারীরিক শক্তি',
    'সপ্তম মাস (সপ্তম মাস) - পূর্ণ শারীরিক পরিপক্বতা ও অঙ্গসজ্জা',
    'অষ্টম মাস (অষ্টম মাস) - ওজঃ ধাতু স্থিতিশীলতা ও তরল ভারসাম্য',
    'নবম মাস (নবম মাস) - স্বাভাবিক প্রসব প্রস্তুতি ও শ্রোণী শিথিলকরণ',
  ];

  const classicalMonthTitle_en = monthNames_en[pregnancyMonth - 1] || `Month ${pregnancyMonth}`;
  const classicalMonthTitle_bn = monthNames_bn[pregnancyMonth - 1] || `${pregnancyMonth}ম মাস`;

  const classicalAyurvedicFocus = [
    `Classical Source: ${framework.classical_source.replace('_', ' ')}`,
    framework.developmental_focus_en,
    `Maternal Physiology Focus: ${framework.maternal_focus_en}`,
    `Core Dietary Principle: ${framework.dietary_principles_en}`,
  ];

  const bangladeshiWholeFoodAdaptations = [
    ...framework.recommended_traditional_foods_en,
    ...framework.bangladeshi_cultural_substitutes_en,
  ];

  // Trimester & month-specific maternal nutritional priorities
  const maternalNutritionalPriorities: MasanumasikaPregnancyAnalysisResult['maternalNutritionalPriorities'] = [];

  if (trimester === 1) {
    maternalNutritionalPriorities.push({
      nutrient: 'Dietary Folate & Methyl-Donors (Vitamin B9)',
      rationale_en: 'Critical for neural tube closure, DNA methylation, and prevention of neural tube defects during early embryogenesis.',
      rationale_bn: 'ভ্রূণের নিউরাল টিউব বন্ধ হওয়া এবং প্রাথমিক স্নায়ুতন্ত্র গঠনের জন্য অত্যন্ত জরুরি।',
      dietarySources: ['Lal shak', 'Palong shak', 'Moshur dal', 'Fresh sweet oranges', 'Soaked walnuts'],
    });
    maternalNutritionalPriorities.push({
      nutrient: 'Pyridoxine (Vitamin B6) & Natural Electrolytes',
      rationale_en: 'Alleviates early morning sickness and hyperemesis gravidarum while preserving maternal electrolyte equilibrium.',
      rationale_bn: 'সকালের বমি বমি ভাব উপশম এবং ডিহাইড্রেশন প্রতিরোধে প্রাকৃতিক খনিজ ভারসাম্য রক্ষা।',
      dietarySources: ['Tender coconut water (Daber pani)', 'Ripe sweet bananas (Shobri kola)', 'Ginger-infused warm water', 'Puffed rice (Muri)'],
    });
  } else if (trimester === 2) {
    maternalNutritionalPriorities.push({
      nutrient: 'Elemental Iron & Vitamin C Synergists',
      rationale_en: 'Supports 40-50% maternal blood volume expansion, fetal hemoglobin synthesis, and prevention of microcytic anemia.',
      rationale_bn: 'মায়ের রক্ত উৎপাদন বৃদ্ধি এবং গর্ভস্থ শিশুর আয়রন সঞ্চয় নিশ্চিত করা।',
      dietarySources: ['Kochu shak', 'Danta shak', 'Kolmi shak', 'Deshi chicken soup', 'Kacha kola', 'Amloki / Lemon with meals'],
    });
    maternalNutritionalPriorities.push({
      nutrient: 'Calcium & Bioavailable Phosphorus',
      rationale_en: 'Essential for rapid fetal skeletal ossification and preserving maternal trabecular bone mineral density.',
      rationale_bn: 'ভ্রূণের হাড় ও দাঁতের গঠন এবং মায়ের হাড়ের ক্ষয় রোধ।',
      dietarySources: ['Boiled cow milk', 'Mola & Dhela small fish with intact bones', 'Til (sesame seed) paste', 'Yogurt / Dahi'],
    });
  } else {
    // Trimester 3
    maternalNutritionalPriorities.push({
      nutrient: 'Omega-3 Fatty Acids (DHA) & Choline',
      rationale_en: 'Maximal third-trimester fetal cerebral cortex development and retinal photoreceptor maturation.',
      rationale_bn: 'শিশুর মস্তিষ্কের স্নায়বিক সংযোগ এবং চোখের রেটিনা বিকাশের চরম সময়।',
      dietarySources: ['Indigenous river fish (Magur, Shing, Rui head)', 'Pasture eggs', 'Soaked chia seeds', 'Mustard oil in cooking'],
    });
    maternalNutritionalPriorities.push({
      nutrient: 'Soluble Dietary Fiber & Hydration',
      rationale_en: 'Prevents gravid constipation caused by high progesterone motility reduction and uterine rectal compression.',
      rationale_bn: 'গর্ভকালীন কোষ্ঠকাঠিন্য ও হেমোরয়েড প্রতিরোধে দ্রবণীয় খাদ্য আঁশ ও পর্যাপ্ত তরল।',
      dietarySources: ['Ispaghol bhushi soaked in water', 'Ripe papaya', 'Lao (bottle gourd) stew', 'Warm vegetable broth'],
    });
  }

  const strictFoodSafetyExclusions = [
    'Unpasteurized raw milk and artisanal unpasteurized cheeses (Listeria monocytogenes risk)',
    'Raw, undercooked, or street-vended fish, shrimp, or shellfish (Vibrio and Salmonella risk)',
    'Raw or soft-boiled eggs with runny yolk (Salmonella enterica risk)',
    'Excessive high-mercury predatory marine fish: Shark, swordfish, king mackerel',
    'Green/unripe papaya latex (contains high papain/pepsin concentrations with oxytocic uterine contraction risk)',
    'Raw pineapple in early pregnancy (bromelain uterine cervical softening concern in high concentrated amounts)',
    'Ayurvedic medicinal bhasmas, heavy metal formulations, and unstandardized classical churnas (Strict Non-Pharmacological Boundary)',
  ];

  const safetyBoundaryNotice =
    'STRICT MATERNAL SAFETY BOUNDARY: Masanumasika dietary analysis provides non-pharmacological, culturally familiar Bangladeshi whole-food guidance. The use of medicinal herbs, classical bhasmas, and Panchakarma is strictly excluded. Regular obstetric monitoring is mandatory.';

  return {
    applicable: true,
    gestationalAgeVerified: true,
    gestationalWeeks,
    gestationalDays,
    pregnancyMonth,
    trimester,
    classicalMonthTitle_en,
    classicalMonthTitle_bn,
    classicalAyurvedicFocus,
    bangladeshiWholeFoodAdaptations,
    maternalNutritionalPriorities,
    strictFoodSafetyExclusions,
    safetyBoundaryNotice,
    clinicianReviewStatus: 'reviewed',
  };
}
