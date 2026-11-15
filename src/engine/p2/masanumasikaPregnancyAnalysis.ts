// P2 Masanumasika Pregnancy Nutrition Analysis Engine
// Connects the classical 9-month Ayurvedic Garbhini Paricharya framework
// with modern maternal-fetal nutritional requirements using accessible Bangladeshi whole foods.
// Strictly non-pharmacological: Zero medicinal herbs, zero bhasmas, zero Panchakarma.

import { PatientProfile } from '../../types';
import { MasanumasikaPregnancyAnalysisResult } from './types';
import {
  MASANUMASIKA_MONTH_FRAMEWORKS,
  calculatePregnancyMonth,
  getTrimesterFromWeeks,
} from '../../questionnaire/masanumasikaData';

export function analyzeMasanumasikaPregnancy(
  patient: PatientProfile,
  assessmentAnswers: Record<string, any> = {}
): MasanumasikaPregnancyAnalysisResult {
  const isPreg =
    patient.population_group === 'pregnancy' ||
    patient.trimester !== undefined ||
    assessmentAnswers['q_pop_pregnancy_status'] === 'pregnant';

  if (!isPreg) {
    return {
      applicable: false,
      safetyBoundaryNotice: 'Masanumasika analysis is not applicable for non-pregnant patients.',
      clinicianReviewStatus: 'reviewed',
    };
  }

  // Determine gestational age
  const ansWeeks = assessmentAnswers['q_pregnancy_gestational_weeks'];
  const ansDays = assessmentAnswers['q_pregnancy_gestational_days'];
  const gestationalWeeks = typeof ansWeeks === 'number' ? ansWeeks : (patient.gestational_age_weeks || 16);
  const gestationalDays = typeof ansDays === 'number' ? ansDays : (patient.gestational_age_days || 0);

  const pregnancyMonth = calculatePregnancyMonth(gestationalWeeks, gestationalDays);
  const trimester = getTrimesterFromWeeks(gestationalWeeks);

  const framework = MASANUMASIKA_MONTH_FRAMEWORKS[pregnancyMonth] || MASANUMASIKA_MONTH_FRAMEWORKS[4];

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

  const classicalMonthTitle_en = monthNames_en[pregnancyMonth - 1];
  const classicalMonthTitle_bn = monthNames_bn[pregnancyMonth - 1];

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
      nutrient: 'Heme & Non-Heme Iron with Bio-enhancers (Vitamin C)',
      rationale_en: 'Supports maternal plasma volume expansion (~50%), maternal erythropoiesis, and fetal hepatic iron storage.',
      rationale_bn: 'মায়ের রক্তের পরিমাণ ৫০% বৃদ্ধি এবং ভ্রূণের লিভারে আয়রন সঞ্চয় নিশ্চিত করা।',
      dietarySources: ['Sing & Magur fish light broth', 'Green plantain (Kacha kola)', 'Moshur dal with fresh lemon', 'Pomegranate (Bedana)'],
    });
    maternalNutritionalPriorities.push({
      nutrient: 'Calcium & Vitamin D Homeostasis',
      rationale_en: 'Essential for fetal endochondral skeletal ossification and preserving maternal bone mineral density.',
      rationale_bn: 'ভ্রূণের হাড় ও দাঁতের গঠন এবং মায়ের হাড়ের ক্ষয় রোধ।',
      dietarySources: ['Boiled fresh cow milk (250-300 mL/day)', 'Small fish with edible bones (Mola, Dhela, Bele)', 'Fresh homemade chhena'],
    });
    maternalNutritionalPriorities.push({
      nutrient: 'High-Biological-Value Complete Protein',
      rationale_en: 'Required for maternal uterine muscle hypertrophy, placental growth, and rapid fetal somatic tissue accretion.',
      rationale_bn: 'জরায়ু ও প্লাসেন্টার বৃদ্ধি এবং ভ্রূণের পেশী গঠনের জন্য উচ্চমানের প্রোটিন।',
      dietarySources: ['Boiled farm egg (daily)', 'Moong dal soup', 'Rui/Katla fish steak cooked in light broth'],
    });
  } else {
    // 3rd Trimester
    maternalNutritionalPriorities.push({
      nutrient: 'Long-Chain Omega-3 Fatty Acids (DHA / EPA) & Choline',
      rationale_en: 'Rapid fetal cerebral cortical synaptogenesis, retinal photoreceptor maturation, and cognitive development during late gestational brain growth spurt.',
      rationale_bn: 'ভ্রূণের মস্তিষ্কের নিউরন বিকাশ, চোখের রেটিনা গঠন এবং বুদ্ধিবৃত্তিক বিকাশের জন্য জরুরি।',
      dietarySources: ['Fresh indigenous freshwater small fish', 'Boiled egg yolk (choline-rich)', 'Soaked flaxseeds (Tishi) powder', 'Walnuts'],
    });
    maternalNutritionalPriorities.push({
      nutrient: 'Pelvic Softening Nutrients & Digestive Motility Support (Fiber & Healthy Fats)',
      rationale_en: 'Prevents third-trimester constipation from progesterone-induced smooth muscle relaxation and gravitational uterine compression; provides maternal stamina for labor.',
      rationale_bn: 'কোষ্ঠকাঠিন্য প্রতিরোধ, পেলভিক টিস্যু শিথিলকরণ এবং স্বাভাবিক প্রসবের শারীরিক শক্তি বৃদ্ধি।',
      dietarySources: ['1 tsp pure Desi Ghee in warm milk at night', 'Soaked soft dates (Khejurl)', 'Boiled bottle gourd (Lao)', 'Papaya (fully ripe only)'],
    });
  }

  const strictFoodSafetyExclusions = [
    'Unpasteurized raw cow or buffalo milk (risk of Listeria monocytogenes)',
    'Raw or semi-ripe green papaya (contains high latex/papain triggering uterine contractions)',
    'Green or unripe pineapple (bromelain enzymes)',
    'Raw or soft-boiled eggs with runny yolk (Salmonella risk)',
    'Large predatory marine fish with high methylmercury accumulation (Tuna, Shark, King Mackerel)',
    'Street-cooked fried snacks and unhygienic roadside salads',
    'All classical medicinal Ayurvedic herbs (Ashwagandha, Shatavari powders, Dashamula, Bhasmas)',
  ];

  const safetyBoundaryNotice =
    'STRICT MATERNAL SAFETY BOUNDARY: All Masanumasika guidance in Shuddho software is restricted exclusively to culturally familiar, non-pharmacological Bangladeshi whole foods. Classical medicinal herbs, calcined mineral Bhasmas, and Panchakarma therapies are strictly contraindicated during pregnancy.';

  return {
    applicable: true,
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
    clinicianReviewStatus: 'pending',
  };
}
