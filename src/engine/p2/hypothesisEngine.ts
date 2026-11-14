// P2 Hypothesis Engine
// Evaluates ClinicalRules against ClinicalObservations and
// generates ClinicalHypothesis[] deterministically.

import { PatientProfile } from '../../types';
import {
  ClinicalObservation,
  ClinicalRule,
  ClinicalHypothesis,
  EvidenceSupportLevel,
  FunctionalDomain,
  HypothesisCluster,
  PopulationApplicability,
} from './types';

// ─── Hypothesis metadata seed ──────────────────────────────────────
// Provides human-readable title/description per hypothesis ID
const HYPOTHESIS_META: Record<
  string,
  {
    title_en: string;
    title_bn: string;
    description_en: string;
    description_bn: string;
    potentialNutritionTargets: string[];
    requiredInvestigations: string[];
  }
> = {
  hyp_lactose_intolerance: {
    title_en: 'Possible Lactose Malabsorption/Intolerance',
    title_bn: 'সম্ভাব্য ল্যাকটোজ অসহিষ্ণুতা',
    description_en:
      'GI symptoms occurring in temporal association with dairy consumption may indicate lactase insufficiency or lactose malabsorption. This is a clinical hypothesis, not a confirmed diagnosis.',
    description_bn:
      'দুগ্ধজাত খাবারের সাথে সময়গতভাবে সম্পর্কিত গ্যাস্ট্রোইন্টেস্টাইনাল উপসর্গগুলি ল্যাকটেজের অপর্যাপ্ততা বা ল্যাকটোজ ম্যালঅ্যাবসর্পশন নির্দেশ করতে পারে।',
    potentialNutritionTargets: ['Lactose reduction trial', 'Calcium adequacy from non-dairy sources', 'Fermented dairy tolerance assessment'],
    requiredInvestigations: ['Hydrogen breath test (gold standard)', 'Dietary elimination trial (minimum 2 weeks)', 'Genetic test for LCT variant (optional)'],
  },
  hyp_fermentable_carb_sensitivity: {
    title_en: 'Possible Fermentable Carbohydrate Sensitivity (FODMAP Pattern)',
    title_bn: 'সম্ভাব্য গাঁজনযোগ্য শর্করার প্রতি সংবেদনশীলতা (FODMAP প্যাটার্ন)',
    description_en:
      'Recurrent bloating, flatulence, and abdominal pain without structural cause may represent fermentable oligosaccharide, disaccharide, monosaccharide and polyol (FODMAP) sensitivity.',
    description_bn:
      'কাঠামোগত কারণ ছাড়া বারবার পেট ফাঁপা, বায়ু এবং পেটে ব্যথা FODMAP সংবেদনশীলতার ইঙ্গিত দিতে পারে।',
    potentialNutritionTargets: ['Low-FODMAP dietary assessment', 'FODMAP trigger food identification', 'Staged FODMAP reintroduction'],
    requiredInvestigations: ['Low-FODMAP dietary elimination trial', 'Colonoscopy/imaging if red flags present', 'Clinician referral for GI investigation'],
  },
  hyp_low_fiber_intake: {
    title_en: 'Inadequate Dietary Fiber Intake',
    title_bn: 'অপর্যাপ্ত খাদ্যতালিকায় আঁশ গ্রহণ',
    description_en:
      'Dietary history suggests fiber intake below recommended levels (25–38 g/day), which may impair bowel regularity, microbiome diversity, and glycemic control.',
    description_bn:
      'খাদ্যতালিকার ইতিহাস প্রস্তাবিত মাত্রার নিচে আঁশ গ্রহণের ইঙ্গিত দেয়।',
    potentialNutritionTargets: ['Increase vegetable servings', 'Introduce whole grains', 'Add legumes progressively'],
    requiredInvestigations: ['3-day diet recall', 'Dietary fiber intake calculation'],
  },
  hyp_insulin_resistance_pattern: {
    title_en: 'Insulin Resistance Pattern (Metabolic)',
    title_bn: 'ইনসুলিন রেজিস্ট্যান্স প্যাটার্ন (বিপাকীয়)',
    description_en:
      'Elevated HOMA-IR combined with central adiposity supports an insulin resistance pattern. This hypothesis guides metabolic nutrition strategy. Clinician review required for therapeutic decisions.',
    description_bn:
      'কেন্দ্রীয় স্থূলতার সাথে HOMA-IR বৃদ্ধি ইনসুলিন রেজিস্ট্যান্স প্যাটার্ন সমর্থন করে।',
    potentialNutritionTargets: ['Low glycemic index diet', 'Carbohydrate distribution strategy', 'Meal timing optimization', 'Protein adequacy for satiety'],
    requiredInvestigations: ['Fasting insulin', 'HOMA-IR calculation', 'Lipid panel', 'HbA1c'],
  },
  hyp_glycemic_dysregulation: {
    title_en: 'Glycemic Dysregulation Pattern',
    title_bn: 'গ্লাইসেমিক ডিসরেগুলেশন প্যাটার্ন',
    description_en:
      'Borderline or elevated HbA1c/fasting glucose indicates impaired glucose regulation requiring dietary glycemic management. Clinician must review for diagnosis.',
    description_bn:
      'সীমারেখায় বা উন্নত HbA1c/ফাস্টিং গ্লুকোজ গ্লুকোজ নিয়ন্ত্রণে দুর্বলতার ইঙ্গিত দেয়।',
    potentialNutritionTargets: ['Glycemic load reduction', 'Refined carbohydrate minimisation', 'Fibre and protein balance'],
    requiredInvestigations: ['HbA1c', 'Fasting glucose', 'Post-prandial glucose if symptomatic'],
  },
  hyp_central_adiposity_risk: {
    title_en: 'Central Adiposity Pattern',
    title_bn: 'কেন্দ্রীয় স্থূলতার প্যাটার্ন',
    description_en:
      'WHtR ≥ 0.5 indicates central adiposity, an independent cardiometabolic risk beyond BMI. Nutritional and lifestyle intervention is indicated.',
    description_bn:
      'WHtR ≥ ০.৫ কেন্দ্রীয় স্থূলতার ইঙ্গিত দেয়, যা BMI-এর বাইরে একটি স্বতন্ত্র কার্ডিওমেটাবলিক ঝুঁকি।',
    potentialNutritionTargets: ['Caloric adequacy with quality focus', 'Macronutrient rebalancing', 'Anti-inflammatory dietary pattern'],
    requiredInvestigations: ['Waist circumference monitoring', 'Lipid panel', 'Blood pressure'],
  },
  hyp_inadequate_protein_intake: {
    title_en: 'Likely Inadequate Dietary Protein Intake',
    title_bn: 'সম্ভাব্য অপর্যাপ্ত খাদ্যতালিকায় প্রোটিন গ্রহণ',
    description_en:
      'Dietary history suggests protein intake below requirements, potentially affecting muscle maintenance, immune function, and tissue repair.',
    description_bn:
      'খাদ্যতালিকার ইতিহাস প্রয়োজনীয়তার নিচে প্রোটিন গ্রহণের ইঙ্গিত দেয়।',
    potentialNutritionTargets: ['Protein distribution across meals', 'High-quality protein sources', 'Protein-rich local food emphasis'],
    requiredInvestigations: ['3-day diet recall protein analysis', 'Serum albumin (if malnutrition risk)'],
  },
  hyp_possible_iron_inadequacy: {
    title_en: 'Possible Iron Inadequacy / Depletion',
    title_bn: 'সম্ভাব্য আয়রনের অপর্যাপ্ততা / হ্রাস',
    description_en:
      'Low ferritin with associated symptoms raises concern for iron depletion. Requires clinical review and further investigation before dietary or supplementation changes.',
    description_bn:
      'সম্পর্কিত উপসর্গের সাথে কম ফেরিটিন আয়রন হ্রাসের উদ্বেগ বাড়ায়।',
    potentialNutritionTargets: ['Iron-rich food optimisation', 'Vitamin C co-consumption for absorption', 'Tea/coffee timing relative to meals', 'Iron absorption inhibitor review'],
    requiredInvestigations: ['Full blood count', 'Serum ferritin and iron studies', 'Clinician review for supplementation decision'],
  },
  hyp_vitamin_d_nutritional_concern: {
    title_en: 'Vitamin D Insufficiency / Deficiency Pattern',
    title_bn: 'ভিটামিন D অপর্যাপ্ততা / ঘাটতির প্যাটার্ন',
    description_en:
      'Measured vitamin D3 below optimal levels. Associated with musculoskeletal, immune, and metabolic health concerns. Clinical review and supplementation decision required.',
    description_bn:
      'পরিমাপকৃত ভিটামিন D3 সর্বোত্তম মাত্রার নিচে। এটি কঙ্কাল-পেশী, ইমিউন এবং বিপাকীয় স্বাস্থ্যের সাথে সম্পর্কিত।',
    potentialNutritionTargets: ['Vitamin D-rich food sources', 'Sun exposure guidance', 'Supplementation assessment (clinician decision only)'],
    requiredInvestigations: ['Serum 25(OH)D', 'Calcium and PTH if deficiency confirmed'],
  },
  hyp_low_dietary_diversity: {
    title_en: 'Low Dietary Diversity',
    title_bn: 'কম খাদ্য বৈচিত্র্য',
    description_en:
      'Limited variety across food groups raises risk of multiple micronutrient inadequacies and reduced gut microbiome richness.',
    description_bn:
      'খাদ্য গোষ্ঠীতে সীমিত বৈচিত্র্য একাধিক মাইক্রোনিউট্রিয়েন্টের ঘাটতি এবং অন্ত্রের মাইক্রোবায়োম সমৃদ্ধি হ্রাসের ঝুঁকি বাড়ায়।',
    potentialNutritionTargets: ['Increase food group variety', 'Rotate protein sources', 'Rainbow vegetable approach'],
    requiredInvestigations: ['Dietary diversity score (minimum dietary diversity-women tool)', '3-day diet recall'],
  },
  hyp_persistent_inflammatory_burden: {
    title_en: 'Persistent Inflammatory Burden Pattern',
    title_bn: 'ক্রমাগত প্রদাহজনিত বোঝার প্যাটার্ন',
    description_en:
      'Elevated inflammatory markers with chronic systemic symptoms suggest persistent low-grade inflammation. Anti-inflammatory dietary approach may be beneficial.',
    description_bn:
      'দীর্ঘস্থায়ী উপসর্গের সাথে উন্নত প্রদাহজনক মার্কার ক্রমাগত নিম্ন-গ্রেড প্রদাহের ইঙ্গিত দেয়।',
    potentialNutritionTargets: ['Omega-3 to omega-6 ratio improvement', 'Colourful phytonutrient-rich diet', 'Ultra-processed food reduction'],
    requiredInvestigations: ['hs-CRP', 'ESR', 'Full blood count', 'Clinician review for autoimmune exclusion'],
  },
  hyp_confirmed_food_allergy_restriction: {
    title_en: 'Confirmed Food Allergy — Dietary Restriction Required',
    title_bn: 'নিশ্চিত খাদ্য অ্যালার্জি — খাদ্যতালিকায় বিধিনিষেধ প্রয়োজন',
    description_en:
      'Confirmed food allergy requires strict dietary exclusion. Nutritional adequacy review for the excluded food group is mandatory.',
    description_bn:
      'নিশ্চিত খাদ্য অ্যালার্জি কঠোর খাদ্যতালিকায় বাদ দেওয়া প্রয়োজন।',
    potentialNutritionTargets: ['Allergen-free menu planning', 'Nutritional compensation for excluded group', 'Cross-contamination risk management'],
    requiredInvestigations: ['Allergy specialist review', 'IgE testing for specific allergens if not done', 'Nutritional adequacy assessment'],
  },
  hyp_gut_dysbiosis_pattern: {
    title_en: 'Possible Gut Microbiome Disruption',
    title_bn: 'সম্ভাব্য অন্ত্রের মাইক্রোবায়োম ব্যাঘাত',
    description_en:
      'Recent antibiotic exposure with GI symptoms may indicate gut microbiome disruption. Dietary restoration approach may help.',
    description_bn:
      'গ্যাস্ট্রোইন্টেস্টাইনাল উপসর্গের সাথে সাম্প্রতিক অ্যান্টিবায়োটিক এক্সপোজার অন্ত্রের মাইক্রোবায়োম ব্যাঘাত নির্দেশ করতে পারে।',
    potentialNutritionTargets: ['Probiotic food sources (clinician review)', 'Prebiotic fibre foods', 'Dietary diversity restoration'],
    requiredInvestigations: ['Stool culture if indicated', 'Clinician review for Clostridioides difficile if severe'],
  },
  hyp_established_thyroid_nutrition: {
    title_en: 'Thyroid Function Abnormality — Nutritional Assessment Required',
    title_bn: 'থাইরয়েড ফাংশনের অস্বাভাবিকতা — পুষ্টি মূল্যায়ন প্রয়োজন',
    description_en:
      'Abnormal TSH requires nutritional review for selenium, iodine, and goitrogenic food intake, coordinated with treating physician.',
    description_bn:
      'অস্বাভাবিক TSH সেলেনিয়াম, আয়োডিন এবং গয়ট্রোজেনিক খাদ্য গ্রহণের পুষ্টি পর্যালোচনা প্রয়োজন।',
    potentialNutritionTargets: ['Iodine dietary adequacy', 'Selenium food sources', 'Goitrogenic food preparation guidance', 'Medication-food interaction review'],
    requiredInvestigations: ['TSH, fT3, fT4', 'Thyroid antibodies (if not done)', 'Iodine intake assessment'],
  },
  hyp_menstrual_irregularity_assessment: {
    title_en: 'Menstrual Irregularity — Nutritional Adequacy Assessment',
    title_bn: 'মাসিকের অনিয়ম — পুষ্টির পর্যাপ্ততা মূল্যায়ন',
    description_en:
      'Menstrual irregularity warrants assessment for nutritional adequacy, energy availability, and hormonal contributors.',
    description_bn:
      'মাসিকের অনিয়ম পুষ্টির পর্যাপ্ততা এবং শক্তির প্রাপ্যতা মূল্যায়নের প্রয়োজন।',
    potentialNutritionTargets: ['Energy adequacy', 'Iron and folate assessment', 'Anti-inflammatory dietary pattern'],
    requiredInvestigations: ['Menstrual history', 'Reproductive hormone panel', 'Iron studies', 'Clinician review'],
  },
  hyp_pcos_metabolic_pattern: {
    title_en: 'PCOS — Metabolic Nutritional Pattern',
    title_bn: 'PCOS — বিপাকীয় পুষ্টির প্যাটার্ন',
    description_en:
      'PCOS with metabolic features requires a low-GI dietary strategy, adequate protein, and lifestyle intervention to improve hormonal and metabolic outcomes.',
    description_bn:
      'বিপাকীয় বৈশিষ্ট্যযুক্ত PCOS কম-GI খাদ্যতালিকা, পর্যাপ্ত প্রোটিন এবং জীবনযাত্রার হস্তক্ষেপ প্রয়োজন।',
    potentialNutritionTargets: ['Low GI diet', 'Insulin sensitising dietary pattern', 'Anti-inflammatory foods', 'Protein adequacy'],
    requiredInvestigations: ['HOMA-IR', 'Reproductive hormone panel', 'Lipid panel', 'Ultrasound (if not done)'],
  },
  hyp_elevated_liver_biomarkers: {
    title_en: 'Elevated Liver Biomarkers — Hepatic Stress Pattern',
    title_bn: 'উন্নত লিভার বায়োমার্কার — হেপাটিক স্ট্রেস প্যাটার্ন',
    description_en:
      'Elevated ALT/AST suggests hepatic stress. Requires review of dietary fat quality, caloric density, and hepatotoxic exposures.',
    description_bn:
      'উন্নত ALT/AST হেপাটিক চাপের ইঙ্গিত দেয়।',
    potentialNutritionTargets: ['Reduce saturated and trans fats', 'Increase antioxidant-rich foods', 'Caloric adequacy review', 'Alcohol elimination'],
    requiredInvestigations: ['Full liver function panel', 'Hepatitis serology if indicated', 'Abdominal ultrasound (clinician decision)'],
  },
  hyp_medication_hepatic_monitoring: {
    title_en: 'Medication-Related Hepatic Monitoring Required',
    title_bn: 'ওষুধ-সম্পর্কিত হেপাটিক পর্যবেক্ষণ প্রয়োজন',
    description_en:
      'Use of hepatotoxic medications warrants monitoring of liver function markers and avoidance of additional hepatic burden.',
    description_bn:
      'হেপাটোটক্সিক ওষুধ ব্যবহারে লিভার ফাংশন মার্কার পর্যবেক্ষণ প্রয়োজন।',
    potentialNutritionTargets: ['Hepatoprotective dietary pattern', 'Alcohol elimination', 'Supplement interaction review'],
    requiredInvestigations: ['ALT/AST monitoring frequency per prescribing guidelines', 'Medication review with prescriber'],
  },
  hyp_sleep_restriction_pattern: {
    title_en: 'Chronic Sleep Restriction Pattern',
    title_bn: 'দীর্ঘস্থায়ী ঘুমের বিধিনিষেধ প্যাটার্ন',
    description_en:
      'Chronic sleep restriction (<7h/night) is associated with dysglycemia, cortisol dysregulation, increased appetite, and reduced diet quality.',
    description_bn:
      'দীর্ঘস্থায়ী ঘুমের বিধিনিষেধ ডাইসগ্লাইসেমিয়া, কর্টিসল ডিসরেগুলেশন এবং বর্ধিত ক্ষুধার সাথে সম্পর্কিত।',
    potentialNutritionTargets: ['Sleep hygiene nutritional support', 'Evening meal timing', 'Caffeine timing guidance'],
    requiredInvestigations: ['Sleep diary', 'Sleep study if indicated', 'Cortisol pattern if clinically indicated'],
  },
  hyp_circadian_misalignment: {
    title_en: 'Circadian Misalignment (Shift Work Pattern)',
    title_bn: 'সার্কাডিয়ান মিসঅ্যালাইনমেন্ট (শিফট ওয়ার্ক প্যাটার্ন)',
    description_en:
      'Shift work creates circadian misalignment, increasing metabolic disease risk. Chrono-nutritional strategies are indicated.',
    description_bn:
      'শিফট কাজ সার্কাডিয়ান মিসঅ্যালাইনমেন্ট তৈরি করে।',
    potentialNutritionTargets: ['Chrono-nutrition meal timing', 'Avoid heavy meals at night', 'Light meal strategy for night shifts'],
    requiredInvestigations: ['Work schedule assessment', 'Metabolic panel'],
  },
  hyp_medication_gi_symptoms: {
    title_en: 'Medication-Related GI Symptoms',
    title_bn: 'ওষুধ-সম্পর্কিত গ্যাস্ট্রোইন্টেস্টাইনাল উপসর্গ',
    description_en:
      'Current medication(s) may be contributing to GI symptoms. Medication timing relative to food and appropriate administration strategies should be reviewed.',
    description_bn:
      'বর্তমান ওষুধ গ্যাস্ট্রোইন্টেস্টাইনাল উপসর্গে অবদান রাখতে পারে।',
    potentialNutritionTargets: ['Medication-food timing optimisation', 'Probiotic food support (clinician review)', 'GI-soothing dietary strategies'],
    requiredInvestigations: ['Medication review with prescriber', 'Dietary diary relative to medication timing'],
  },
  hyp_medication_nutrient_depletion_risk: {
    title_en: 'Medication-Related Nutrient Depletion Risk',
    title_bn: 'ওষুধ-সম্পর্কিত পুষ্টি হ্রাসের ঝুঁকি',
    description_en:
      'Long-term medication use is associated with specific nutrient depletion. Dietary and supplementation review required (clinician decision).',
    description_bn:
      'দীর্ঘমেয়াদী ওষুধ ব্যবহার নির্দিষ্ট পুষ্টি হ্রাসের সাথে সম্পর্কিত।',
    potentialNutritionTargets: ['Nutrient-rich dietary sources for depleted nutrients', 'Lab monitoring of depleted nutrients'],
    requiredInvestigations: ['B12 level (if on metformin)', 'Magnesium level (if on PPI)', 'Prescriber review'],
  },
  hyp_low_protein_muscle_health: {
    title_en: 'Low Protein Intake with Muscle Health Concern',
    title_bn: 'কম প্রোটিন গ্রহণ এবং পেশী স্বাস্থ্যের উদ্বেগ',
    description_en:
      'Muscle weakness/loss with low protein intake raises concern for sarcopenia risk, particularly in older adults.',
    description_bn:
      'কম প্রোটিন গ্রহণের সাথে পেশী দুর্বলতা/ক্ষতি স্যারকোপেনিয়ার ঝুঁকির উদ্বেগ বাড়ায়।',
    potentialNutritionTargets: ['Protein distribution across meals', 'Resistance exercise + protein timing', 'Leucine-rich protein sources'],
    requiredInvestigations: ['Handgrip strength assessment', 'Body composition if available', 'Clinician review for sarcopenia screening'],
  },
  hyp_reduced_physical_activity: {
    title_en: 'Sedentary Lifestyle Pattern',
    title_bn: 'আসীন জীবনধারা প্যাটার্ন',
    description_en:
      'Sedentary lifestyle is an independent cardiometabolic risk factor. Nutritional strategy should complement physical activity recommendations.',
    description_bn:
      'আসীন জীবনধারা একটি স্বতন্ত্র কার্ডিওমেটাবলিক ঝুঁকির কারণ।',
    potentialNutritionTargets: ['Caloric target adjusted for activity level', 'High-satiety nutrient-dense foods', 'Protein for muscle maintenance'],
    requiredInvestigations: ['Physical activity assessment', 'Metabolic panel'],
  },
  hyp_irregular_meal_patterns: {
    title_en: 'Irregular Meal Patterns',
    title_bn: 'অনিয়মিত খাবারের প্যাটার্ন',
    description_en:
      'Irregular meal timing and meal skipping are associated with dysglycemia, compensatory overeating, and poor dietary quality.',
    description_bn:
      'অনিয়মিত খাবারের সময় এবং খাবার বাদ দেওয়া ডাইসগ্লাইসেমিয়ার সাথে সম্পর্কিত।',
    potentialNutritionTargets: ['Regular meal schedule', '3-5 structured meals/day', 'Meal preparation strategies'],
    requiredInvestigations: ['Detailed meal timing diary', 'Glycemic monitoring if indicated'],
  },
  hyp_inadequate_hydration: {
    title_en: 'Inadequate Hydration Pattern',
    title_bn: 'অপর্যাপ্ত হাইড্রেশন প্যাটার্ন',
    description_en:
      'Reported low fluid intake with signs of dehydration warrants targeted hydration guidance.',
    description_bn:
      'পানিশূন্যতার লক্ষণসহ কম তরল গ্রহণ লক্ষ্যমাত্রিক হাইড্রেশন নির্দেশিকা প্রয়োজন।',
    potentialNutritionTargets: ['Fluid intake targets', 'Hydrating food sources', 'Water reminder strategies'],
    requiredInvestigations: ['Urine colour/frequency assessment', 'Clinical dehydration assessment'],
  },
};

// ─── Population mapping ───────────────────────────────────────────
function getPatientPopulations(patient: PatientProfile): PopulationApplicability[] {
  const pops: PopulationApplicability[] = ['all'];
  if (patient.population_group === 'pregnancy') pops.push('pregnancy');
  if (patient.population_group === 'lactation') pops.push('lactation');
  if (patient.population_group === 'pediatric') pops.push('pediatric');
  if (patient.population_group === 'geriatric') pops.push('geriatric');
  if (patient.population_group === 'adult_standard') pops.push('adult');
  if (patient.age < 18) pops.push('adolescent');
  if (patient.selected_conditions.includes('hypertension_ckd')) pops.push('renal');
  return pops;
}

function populationAllowed(rule: ClinicalRule, patientPops: PopulationApplicability[]): boolean {
  // Rule is applicable if any patient population matches
  return rule.applicablePopulations.some((p) => patientPops.includes(p));
}

function populationSafetyBlocked(rule: ClinicalRule, patientPops: PopulationApplicability[]): boolean {
  return rule.safetyExclusions.some((excl) => patientPops.includes(excl as PopulationApplicability));
}

// ─── Evidence evaluation ──────────────────────────────────────────
function evaluateEvidence(
  rule: ClinicalRule,
  obsTags: Set<string>,
): {
  matched: boolean;
  supportingTags: string[];
  contradictoryTags: string[];
  level: EvidenceSupportLevel;
} {
  // Check inclusion criteria (at least one must match)
  const inclusionMatch = rule.inclusionCriteria.some((tag) => obsTags.has(tag));
  if (!inclusionMatch) {
    return { matched: false, supportingTags: [], contradictoryTags: [], level: 'insufficient' };
  }

  // Check exclusion criteria (any match = rule does not apply)
  const exclusionHit = rule.exclusionCriteria.some((tag) => obsTags.has(tag));
  if (exclusionHit) {
    return { matched: false, supportingTags: [], contradictoryTags: [], level: 'not_applicable' };
  }

  const supportingTags: string[] = [];
  const contradictoryTags: string[] = [];

  // Count required observations matched
  let reqMatched = 0;
  for (const req of rule.requiredObservations) {
    if (obsTags.has(req) || obsTags.has(req.replace(/^obs_/, '')) || obsTags.has(`obs_${req}`)) {
      reqMatched++;
      supportingTags.push(req);
    }
  }

  // Count optional observations matched
  let optMatched = 0;
  for (const opt of rule.optionalObservations) {
    if (obsTags.has(opt) || obsTags.has(opt.replace(/^obs_/, '')) || obsTags.has(`obs_${opt}`)) {
      optMatched++;
      supportingTags.push(opt);
    }
  }

  // Check contradictory findings
  for (const contra of rule.contradictoryFindings) {
    if (obsTags.has(contra) || obsTags.has(contra.replace(/^obs_/, '')) || obsTags.has(`obs_${contra}`)) {
      contradictoryTags.push(contra);
    }
  }

  if (rule.cluster === 'gastrointestinal' && (obsTags.has('normal_colonoscopy') || obsTags.has('obs_normal_colonoscopy'))) {
    if (!contradictoryTags.includes('normal_colonoscopy') && !contradictoryTags.includes('obs_normal_colonoscopy')) {
      contradictoryTags.push('normal_colonoscopy');
    }
  }

  if (contradictoryTags.length > 0 && reqMatched === 0) {
    return { matched: false, supportingTags, contradictoryTags, level: 'limited' };
  }

  // Determine evidence support level
  const totalRequired = rule.requiredObservations.length;
  const totalOptional = rule.optionalObservations.length;

  let level: EvidenceSupportLevel;
  const reqRatio = totalRequired > 0 ? reqMatched / totalRequired : 1;
  const hasContradictions = contradictoryTags.length > 0;

  if (reqRatio >= 1 && optMatched >= 1 && !hasContradictions) {
    level = 'sufficient';
  } else if ((reqRatio >= 0.5 || reqMatched >= 1 || optMatched >= 2) && !hasContradictions) {
    level = 'some';
  } else if (hasContradictions) {
    level = 'limited';
  } else if (reqMatched === 0 && optMatched === 0) {
    level = 'insufficient';
  } else {
    level = 'some';
  }

  return { matched: reqMatched > 0 || inclusionMatch, supportingTags, contradictoryTags, level };
}

// ─── Main hypothesis generator ────────────────────────────────────
export function generateHypotheses(
  observations: ClinicalObservation[],
  rules: ClinicalRule[],
  patient: PatientProfile,
): ClinicalHypothesis[] {
  const patientPops = getPatientPopulations(patient);

  // Build flat tag set from all observations
  const obsTags = new Set<string>();
  for (const obs of observations) {
    for (const tag of obs.tags ?? []) {
      obsTags.add(tag);
    }
    obsTags.add(obs.id);
  }

  // Accumulate per-hypothesis data across rules
  const hypothesisMap = new Map<
    string,
    {
      supportingObs: Set<string>;
      contradictoryObs: Set<string>;
      triggeringRules: string[];
      evidenceLevels: EvidenceSupportLevel[];
      cluster: HypothesisCluster;
      domains: Set<FunctionalDomain>;
      pops: Set<PopulationApplicability>;
    }
  >();

  for (const rule of rules) {
    // Population check
    if (!populationAllowed(rule, patientPops)) continue;
    if (populationSafetyBlocked(rule, patientPops)) continue;

    const { matched, supportingTags, contradictoryTags, level } = evaluateEvidence(rule, obsTags);
    if (!matched) continue;

    const hid = rule.targetHypothesis;
    if (!hypothesisMap.has(hid)) {
      hypothesisMap.set(hid, {
        supportingObs: new Set(),
        contradictoryObs: new Set(),
        triggeringRules: [],
        evidenceLevels: [],
        cluster: rule.cluster,
        domains: new Set(),
        pops: new Set(),
      });
    }

    const entry = hypothesisMap.get(hid)!;
    for (const tag of supportingTags) {
      // Map tags back to observation IDs
      for (const obs of observations) {
        if (obs.tags?.includes(tag) || obs.id === tag) {
          entry.supportingObs.add(obs.id);
          for (const d of obs.associatedDomains) entry.domains.add(d);
        }
      }
    }
    for (const tag of contradictoryTags) {
      for (const obs of observations) {
        if (obs.tags?.includes(tag) || obs.id === tag) {
          entry.contradictoryObs.add(obs.id);
        }
      }
    }
    entry.triggeringRules.push(rule.ruleId);
    entry.evidenceLevels.push(level);
    for (const p of rule.applicablePopulations) entry.pops.add(p);
    entry.domains.add(rule.clinicalDomain);
  }

  const hypotheses: ClinicalHypothesis[] = [];
  const evidencePriority: Record<EvidenceSupportLevel, number> = {
    sufficient: 5,
    some: 4,
    limited: 3,
    insufficient: 2,
    not_applicable: 1,
  };

  Array.from(hypothesisMap.entries()).forEach(([hid, entry]) => {
    const meta = HYPOTHESIS_META[hid];
    if (!meta) return;

    // Pick the highest evidence level across all triggering rules
    const bestLevel = entry.evidenceLevels.reduce<EvidenceSupportLevel>((best, curr) => {
      return evidencePriority[curr] > evidencePriority[best] ? curr : best;
    }, 'insufficient');

    // Collect missing evidence
    const missingEvidence: string[] = [];
    const supportedTagsSet = new Set<string>();
    Array.from(entry.supportingObs).forEach((obsId) => {
      const obs = observations.find((o) => o.id === obsId);
      if (obs) for (const t of obs.tags ?? []) supportedTagsSet.add(t);
    });

    hypotheses.push({
      id: hid,
      cluster: entry.cluster,
      title_en: meta.title_en,
      title_bn: meta.title_bn,
      description_en: meta.description_en,
      description_bn: meta.description_bn,
      biologicalSystems: Array.from(entry.domains),
      supportingObservationIds: Array.from(entry.supportingObs),
      contradictoryObservationIds: Array.from(entry.contradictoryObs),
      missingEvidence,
      alternativeExplanations: [],
      confounders: [],
      potentialNutritionTargets: meta.potentialNutritionTargets,
      requiredInvestigations: meta.requiredInvestigations,
      evidenceSupportLevel: bestLevel,
      triggeringRuleIds: entry.triggeringRules,
      applicablePopulations: Array.from(entry.pops),
      clinicianDecision: 'pending',
      isConfirmedDiagnosis: false, // ALWAYS false for hypothesis-generated entries
    });
  });

  // Sort by evidence level (strongest first)
  hypotheses.sort((a, b) => evidencePriority[b.evidenceSupportLevel] - evidencePriority[a.evidenceSupportLevel]);

  return hypotheses;
}
