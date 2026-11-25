/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION PLATFORM
 * WORKSTREAM R8-A: CANONICAL FOOD & NUTRIENT KNOWLEDGE FOUNDATION
 *
 * Zero-cost deterministic registry & unit-safe aggregation layer preserving all
 * existing Bangladesh FCTB V6 food IDs, explicit null-vs-zero semantics,
 * food states, edible portion factors, and cooking yields.
 */

import foodsJson from '../../data/foods.json';
import { FoodItem } from '../../types';
import {
  R8CanonicalNutrientDefinition,
  R8ComputedNutrientSubtotal,
  R8FoodMetadataExtension,
  R8FoodState,
  R8MeasurementBasis,
  R8NutrientDataQuality,
  R8NutrientMeasurement
} from '../../types/r8FoodKnowledge';
import { canonicalizeNutrientId } from '../r7/supplementIntelligence';

export const R8_BASELINE_FOODS: FoodItem[] = foodsJson as FoodItem[];

/**
 * Unified canonical nutrient registry bridging R8 food composition and R7 supplement/lab IDs.
 */
export const R8_CANONICAL_NUTRIENTS: R8CanonicalNutrientDefinition[] = [
  // Energy & Macronutrients
  {
    canonical_id: 'energy',
    group: 'energy_macro',
    label_en: 'Energy',
    label_bn: 'শক্তি (ক্যালরি)',
    canonical_unit: 'kcal',
    supported_units: ['kcal', 'kJ'],
    food_json_key: 'kcal',
    established_functions_en: 'Basal metabolism, cellular ATP synthesis, thermogenesis, and physical work.',
    established_functions_bn: 'বিপাকীয় ক্রিয়া ও শারীরিক শক্তির প্রধান উৎস।',
    relevant_systems: ['energy'],
    evidence_ids: ['EVID_FAO_INFOODS']
  },
  {
    canonical_id: 'protein',
    group: 'energy_macro',
    label_en: 'Protein',
    label_bn: 'প্রোটিন',
    canonical_unit: 'g',
    supported_units: ['g', 'mg'],
    food_json_key: 'protein_g',
    established_functions_en: 'Tissue synthesis, enzyme/hormone structure, immune globulins, and nitrogen balance.',
    established_functions_bn: 'কোষ ও পেশী গঠন, এনজাইম এবং রোগ প্রতিরোধে সহায়ক।',
    relevant_lab_markers: ['albumin', 'creatinine'],
    relevant_systems: ['structural_integrity', 'defense_repair'],
    evidence_ids: ['EVID_FAO_INFOODS', 'EVID_KDIGO_2024_CKD']
  },
  {
    canonical_id: 'available_carbohydrate',
    group: 'energy_macro',
    label_en: 'Available Carbohydrate',
    label_bn: 'শর্করা (কার্বোহাইড্রেট)',
    canonical_unit: 'g',
    supported_units: ['g', 'mg'],
    food_json_key: 'carbs_g',
    established_functions_en: 'Primary glycemic fuel for brain, erythrocytes, and skeletal muscle.',
    established_functions_bn: 'মস্তিষ্ক ও শরীরের দ্রুত শক্তির উৎস; রক্তে গ্লুকোজ নিয়ন্ত্রণে গুরুত্বপূর্ণ।',
    relevant_lab_markers: ['fasting_glucose', 'postprandial_glucose', 'hba1c'],
    relevant_systems: ['energy', 'communication'],
    evidence_ids: ['EVID_ADA_2026_GLYCEMIC']
  },
  {
    canonical_id: 'total_fat',
    group: 'energy_macro',
    label_en: 'Total Fat',
    label_bn: 'মোট চর্বি (ফ্যাট)',
    canonical_unit: 'g',
    supported_units: ['g', 'mg'],
    food_json_key: 'fat_g',
    established_functions_en: 'Energy storage, cell membrane phospholipids, bile stimulation, and fat-soluble vitamin transport.',
    established_functions_bn: 'কোষ ঝিল্লি গঠন ও ভিটামিন এ, ডি, ই, কে শোষণে সহায়ক।',
    relevant_lab_markers: ['triglycerides', 'total_cholesterol', 'ldl', 'hdl'],
    relevant_systems: ['transport', 'assimilation'],
    evidence_ids: ['EVID_AHA_ACC_LIPIDS']
  },
  {
    canonical_id: 'dietary_fiber',
    group: 'energy_macro',
    label_en: 'Dietary Fiber',
    label_bn: 'খাদ্য আঁশ (ফাইবার)',
    canonical_unit: 'g',
    supported_units: ['g', 'mg'],
    food_json_key: 'fiber_g',
    established_functions_en: 'Stool bulk, colonic SCFA fermentation substrate, postprandial glycemic attenuation, and bile-acid binding.',
    established_functions_bn: 'অন্ত্রের গতিশীলতা, অণুজীবের পুষ্টি ও রক্তের শর্করা ও কোলেস্টেরল নিয়ন্ত্রণে সহায়ক।',
    relevant_lab_markers: ['ldl', 'fasting_glucose', 'hba1c'],
    relevant_systems: ['assimilation', 'transport'],
    evidence_ids: ['EVID_ADA_2026_GLYCEMIC', 'EVID_AHA_ACC_LIPIDS']
  },
  // Fatty acids & Amino acids (documented where measured; missing where unmeasured in FCTB V6)
  {
    canonical_id: 'ala_omega3',
    r7_nutrient_id: 'omega3_epa_dha',
    group: 'fatty_acid',
    label_en: 'Alpha-Linolenic Acid (ALA) / n-3 Fatty Acids',
    label_bn: 'ওমেগা-৩ ফ্যাটি এসিড',
    canonical_unit: 'g',
    supported_units: ['g', 'mg'],
    established_functions_en: 'Essential plant n-3 precursor (limited endogenous conversion to EPA/DHA in humans).',
    established_functions_bn: 'উদ্ভিজ্জ ওমেগা-৩; মানবদেহে EPA/DHA রূপান্তর সীমিত।',
    relevant_systems: ['defense_repair', 'transport'],
    evidence_ids: ['EVID_NIH_ODS_MICRONUTRIENTS'],
    uncertainties_en: 'FCTB V6 reports total fat rather than individual fatty acid isomers for most local foods.'
  },
  {
    canonical_id: 'epa_dha',
    r7_nutrient_id: 'omega3_epa_dha',
    group: 'fatty_acid',
    label_en: 'EPA + DHA Marine Omega-3',
    label_bn: 'ইপিএ + ডিএইচএ (সামুদ্রিক ওমেগা-৩)',
    canonical_unit: 'mg',
    supported_units: ['mg', 'g'],
    established_functions_en: 'Cell membrane fluidity, triglyceride lowering at pharmacological intake, and specialized pro-resolving mediator substrate.',
    established_functions_bn: 'কোষ ঝিল্লি ও ট্রাইগ্লিসারাইড নিয়ন্ত্রণে ভূমিকা; প্রজাতিভেদে মাছে ভিন্ন মাত্রা।',
    relevant_lab_markers: ['triglycerides'],
    relevant_systems: ['defense_repair', 'transport'],
    evidence_ids: ['EVID_AHA_ACC_LIPIDS', 'EVID_NIH_ODS_MICRONUTRIENTS'],
    uncertainties_en: 'Freshwater carp and small indigenous fish have distinct lipid profiles from cold-water marine salmon.'
  },
  // Minerals
  {
    canonical_id: 'calcium',
    r7_nutrient_id: 'calcium',
    group: 'mineral',
    label_en: 'Calcium',
    label_bn: 'ক্যালসিয়াম',
    canonical_unit: 'mg',
    supported_units: ['mg', 'g'],
    food_json_key: 'calcium_mg',
    established_functions_en: 'Hydroxyapatite bone mineralization, neuromuscular excitability, and vascular contraction.',
    established_functions_bn: 'হাড় ও দাঁত গঠন এবং স্নায়ু-পেশীর স্বাভাবিক কার্যক্রমে আবশ্যক।',
    absorption_considerations_en: 'Oxalates and high phytates reduce fractional absorption; vitamin D supports active intestinal transport.',
    relevant_lab_markers: ['total_calcium', 'vitamin_d3'],
    relevant_systems: ['structural_integrity', 'communication'],
    evidence_ids: ['EVID_NIH_ODS_MICRONUTRIENTS']
  },
  {
    canonical_id: 'iron',
    r7_nutrient_id: 'iron',
    group: 'mineral',
    label_en: 'Iron (Total Dietary)',
    label_bn: 'আয়রন (লৌহ)',
    canonical_unit: 'mg',
    supported_units: ['mg', 'mcg'],
    food_json_key: 'iron_mg',
    chemical_forms: ['heme_iron', 'non_heme_iron'],
    established_functions_en: 'Hemoglobin oxygen transport, myoglobin, and mitochondrial cytochrome electron transport.',
    established_functions_bn: 'হিমোগ্লোবিন তৈরি ও কোষে অক্সিজেন পরিবহনের জন্য অপরিহার্য।',
    absorption_considerations_en: 'Non-heme iron absorption is enhanced by ascorbic acid and inhibited by phytates, polyphenols/tea, and calcium.',
    relevant_lab_markers: ['hemoglobin', 'ferritin', 'serum_iron', 'tibc'],
    relevant_systems: ['transport', 'energy'],
    evidence_ids: ['EVID_WHO_2020_FERRITIN', 'EVID_NIH_ODS_MICRONUTRIENTS']
  },
  {
    canonical_id: 'magnesium',
    r7_nutrient_id: 'magnesium',
    group: 'mineral',
    label_en: 'Magnesium',
    label_bn: 'ম্যাগনেসিয়াম',
    canonical_unit: 'mg',
    supported_units: ['mg', 'g'],
    food_json_key: 'magnesium_mg',
    established_functions_en: 'Cofactor for >300 ATP-dependent enzymatic reactions, insulin receptor tyrosine kinase, and vascular tone.',
    established_functions_bn: 'তিন শতাধিক এনজাইম, ইনসুলিন সংবেদনশীলতা ও স্নায়ুর ভারসাম্যে সহায়ক।',
    relevant_lab_markers: ['magnesium', 'fasting_glucose'],
    relevant_systems: ['energy', 'communication'],
    evidence_ids: ['EVID_NIH_ODS_MICRONUTRIENTS'],
    uncertainties_en: 'IOM 350 mg/day UL applies strictly to supplemental magnesium salts, NOT food-bound magnesium.'
  },
  {
    canonical_id: 'phosphorus',
    r7_nutrient_id: 'phosphorus',
    group: 'mineral',
    label_en: 'Phosphorus',
    label_bn: 'ফসফরাস',
    canonical_unit: 'mg',
    supported_units: ['mg', 'g'],
    food_json_key: 'phosphorus_mg',
    established_functions_en: 'ATP, nucleic acids, phospholipids, and skeletal mineralization; requires strict review in CKD.',
    established_functions_bn: 'শক্তি উৎপাদন ও হাড় গঠনে সহায়ক; কিডনি রোগে মাত্রা নিয়ন্ত্রণ জরুরি।',
    relevant_lab_markers: ['phosphorus', 'reported_egfr'],
    relevant_systems: ['structural_integrity', 'energy'],
    evidence_ids: ['EVID_KDIGO_2024_CKD']
  },
  {
    canonical_id: 'potassium',
    r7_nutrient_id: 'potassium',
    group: 'mineral',
    label_en: 'Potassium',
    label_bn: 'পটাশিয়াম',
    canonical_unit: 'mg',
    supported_units: ['mg', 'g'],
    food_json_key: 'potassium_mg',
    established_functions_en: 'Intracellular electrolyte gradient, cardiac repolarization, and blood pressure modulation.',
    established_functions_bn: 'হৃদস্পন্দন, রক্তচাপ ও কোষীয় ইলেক্ট্রোলাইট ভারসাম্য রক্ষায় অত্যাবশ্যক।',
    relevant_lab_markers: ['potassium', 'reported_egfr'],
    relevant_systems: ['transport', 'communication'],
    evidence_ids: ['EVID_KDIGO_2024_CKD']
  },
  {
    canonical_id: 'sodium',
    r7_nutrient_id: 'sodium',
    group: 'mineral',
    label_en: 'Sodium',
    label_bn: 'সোডিয়াম',
    canonical_unit: 'mg',
    supported_units: ['mg', 'g'],
    food_json_key: 'sodium_mg',
    established_functions_en: 'Extracellular fluid osmolarity and nerve action potentials; excess raises blood pressure in salt-sensitive patients.',
    established_functions_bn: 'তরল ভারসাম্য ও রক্তচাপ নিয়ন্ত্রণে গুরুত্বপূর্ণ।',
    relevant_lab_markers: ['sodium'],
    relevant_systems: ['transport'],
    evidence_ids: ['EVID_KDIGO_2024_CKD', 'EVID_AHA_ACC_LIPIDS']
  },
  {
    canonical_id: 'zinc',
    r7_nutrient_id: 'zinc',
    group: 'mineral',
    label_en: 'Zinc',
    label_bn: 'জিংক',
    canonical_unit: 'mg',
    supported_units: ['mg', 'mcg'],
    food_json_key: 'zinc_mg',
    established_functions_en: 'DNA transcription fingers, mucosal barrier integrity, innate/adaptive immunity, and insulin storage.',
    established_functions_bn: 'রোগ প্রতিরোধ ক্ষমতা, ত্বক ও অন্ত্রের আবরণী সুরক্ষায় আবশ্যক।',
    relevant_lab_markers: ['zinc', 'copper'],
    relevant_systems: ['defense_repair', 'assimilation'],
    evidence_ids: ['EVID_NIH_ODS_MICRONUTRIENTS']
  },
  {
    canonical_id: 'copper',
    r7_nutrient_id: 'copper',
    group: 'mineral',
    label_en: 'Copper',
    label_bn: 'কপার (তামা)',
    canonical_unit: 'mg',
    supported_units: ['mg', 'mcg'],
    food_json_key: 'copper_mg',
    established_functions_en: 'Ceruloplasmin ferroxidase iron mobilization and superoxide dismutase antioxidant defense.',
    established_functions_bn: 'আয়রন পরিবহন ও অ্যান্টিঅক্সিডেন্ট এনজাইমের কো-ফ্যাক্টর।',
    relevant_systems: ['defense_repair', 'transport'],
    evidence_ids: ['EVID_NIH_ODS_MICRONUTRIENTS']
  },
  {
    canonical_id: 'selenium',
    r7_nutrient_id: 'selenium',
    group: 'mineral',
    label_en: 'Selenium',
    label_bn: 'সেলেনিয়াম',
    canonical_unit: 'mcg',
    supported_units: ['mcg', 'mg'],
    established_functions_en: 'Selenoproteins including iodothyronine deiodinases (T4->T3) and glutathione peroxidase.',
    established_functions_bn: 'থাইরয়েড হরমোন সক্রিয়করণ ও গ্লুটাথায়ন পারঅক্সিডেজে ভূমিকা রাখে।',
    relevant_lab_markers: ['tsh', 'ft3', 'ft4'],
    relevant_systems: ['communication', 'defense_repair'],
    evidence_ids: ['EVID_NIH_ODS_MICRONUTRIENTS'],
    uncertainties_en: 'Selenium content varies sharply by soil selenium; omitted from FCTB V6 routine entries.'
  },
  {
    canonical_id: 'iodine',
    r7_nutrient_id: 'iodine',
    group: 'mineral',
    label_en: 'Iodine',
    label_bn: 'আয়োডিন',
    canonical_unit: 'mcg',
    supported_units: ['mcg', 'mg'],
    established_functions_en: 'Essential constituent of thyroxine (T4) and triiodothyronine (T3).',
    established_functions_bn: 'থাইরয়েড হরমোন (T4/T3) সংশ্লেষণের মূল উপাদান।',
    relevant_lab_markers: ['tsh', 'ft4'],
    relevant_systems: ['communication'],
    evidence_ids: ['EVID_NIH_ODS_MICRONUTRIENTS']
  },
  // Vitamins
  {
    canonical_id: 'vitamin_a',
    r7_nutrient_id: 'vitamin_a',
    group: 'vitamin',
    label_en: 'Vitamin A (RAE)',
    label_bn: 'ভিটামিন এ',
    canonical_unit: 'mcg_RAE',
    supported_units: ['mcg', 'mcg_RAE', 'IU'],
    food_json_key: 'vitamin_a_mcg',
    chemical_forms: ['preformed_retinol', 'beta_carotene_provitamin'],
    established_functions_en: 'Rhodopsin visual cycle, epithelial differentiation, and mucosal IgA immunity.',
    established_functions_bn: 'দৃষ্টিশক্তি ও মিউকোসাল রোগ প্রতিরোধ ক্ষমতায় অপরিহার্য।',
    relevant_systems: ['defense_repair', 'assimilation'],
    evidence_ids: ['EVID_NIH_ODS_MICRONUTRIENTS']
  },
  {
    canonical_id: 'vitamin_d',
    r7_nutrient_id: 'vitamin_d',
    group: 'vitamin',
    label_en: 'Vitamin D',
    label_bn: 'ভিটামিন ডি',
    canonical_unit: 'mcg',
    supported_units: ['mcg', 'IU'],
    food_json_key: 'vitamin_d_mcg',
    chemical_forms: ['cholecalciferol_d3', 'ergocalciferol_d2'],
    established_functions_en: 'Intestinal calcium/phosphate absorption, osteoblast maturation, and immune regulation.',
    established_functions_bn: 'ক্যালসিয়াম শোষণ, হাড়ের ঘনত্ব ও রোগ প্রতিরোধে সহায়ক।',
    relevant_lab_markers: ['vitamin_d3', 'total_calcium'],
    relevant_systems: ['structural_integrity', 'defense_repair'],
    evidence_ids: ['EVID_ENDOCRINE_2024_VITD']
  },
  {
    canonical_id: 'vitamin_e',
    r7_nutrient_id: 'vitamin_e',
    group: 'vitamin',
    label_en: 'Vitamin E (Alpha-Tocopherol)',
    label_bn: 'ভিটামিন ই',
    canonical_unit: 'mg',
    supported_units: ['mg', 'mcg'],
    food_json_key: 'vitamin_e_mg',
    established_functions_en: 'Lipid-phase peroxyl radical scavenging protecting PUFA membranes.',
    established_functions_bn: 'লিপিড-ভিত্তিক কোষ ঝিল্লির অক্সিডেটিভ সুরক্ষা।',
    relevant_systems: ['defense_repair', 'transport'],
    evidence_ids: ['EVID_NIH_ODS_MICRONUTRIENTS']
  },
  {
    canonical_id: 'vitamin_k',
    r7_nutrient_id: 'vitamin_k',
    group: 'vitamin',
    label_en: 'Vitamin K (Phylloquinone)',
    label_bn: 'ভিটামিন কে',
    canonical_unit: 'mcg',
    supported_units: ['mcg', 'mg'],
    established_functions_en: 'Gamma-carboxylation of coagulation factors (II, VII, IX, X) and osteocalcin; maintain consistent intake on warfarin.',
    established_functions_bn: 'রক্ত জমাট বাঁধা ও হাড়ের প্রোটিন সক্রিয়করণে ভূমিকা; ওয়ারফারিন সেবনে দৈনিক সমতা জরুরি।',
    relevant_systems: ['transport', 'structural_integrity'],
    evidence_ids: ['EVID_DAILYMED_PRESCRIBING']
  },
  {
    canonical_id: 'thiamin',
    r7_nutrient_id: 'thiamin',
    group: 'vitamin',
    label_en: 'Vitamin B1 (Thiamin)',
    label_bn: 'থায়ামিন (ভিটামিন বি১)',
    canonical_unit: 'mg',
    supported_units: ['mg', 'mcg'],
    food_json_key: 'thiamin_mg',
    established_functions_en: 'Pyruvate dehydrogenase and alpha-ketoglutarate dehydrogenase cofactor for glucose oxidation.',
    established_functions_bn: 'শর্করা থেকে কোষীয় শক্তি উৎপাদনে অপরিহার্য।',
    relevant_systems: ['energy'],
    evidence_ids: ['EVID_NIH_ODS_MICRONUTRIENTS']
  },
  {
    canonical_id: 'riboflavin',
    r7_nutrient_id: 'riboflavin',
    group: 'vitamin',
    label_en: 'Vitamin B2 (Riboflavin)',
    label_bn: 'রাইবোফ্লাভিন (ভিটামিন বি২)',
    canonical_unit: 'mg',
    supported_units: ['mg', 'mcg'],
    food_json_key: 'riboflavin_mg',
    established_functions_en: 'FAD/FMN flavoprotein redox reactions in electron transport and glutathione reductase.',
    established_functions_bn: 'মাইটোকন্ড্রিয়াল শক্তি ও রেডক্স ভারসাম্যে ভূমিকা।',
    relevant_systems: ['energy', 'biotransformation'],
    evidence_ids: ['EVID_NIH_ODS_MICRONUTRIENTS']
  },
  {
    canonical_id: 'niacin',
    r7_nutrient_id: 'niacin',
    group: 'vitamin',
    label_en: 'Vitamin B3 (Niacin)',
    label_bn: 'নায়াসিন (ভিটামিন বি৩)',
    canonical_unit: 'mg',
    supported_units: ['mg', 'mcg'],
    food_json_key: 'niacin_mg',
    established_functions_en: 'NAD+/NADP+ coenzyme in catabolism, DNA repair, and hepatic metabolism.',
    established_functions_bn: 'শক্তি বিপাক ও NAD+ কো-এনজাইম গঠনে সহায়ক।',
    relevant_systems: ['energy', 'biotransformation'],
    evidence_ids: ['EVID_NIH_ODS_MICRONUTRIENTS']
  },
  {
    canonical_id: 'vitamin_b6',
    r7_nutrient_id: 'vitamin_b6',
    group: 'vitamin',
    label_en: 'Vitamin B6 (Pyridoxine)',
    label_bn: 'ভিটামিন বি৬',
    canonical_unit: 'mg',
    supported_units: ['mg', 'mcg'],
    food_json_key: 'vitamin_b6_mg',
    established_functions_en: 'PLP cofactor for amino acid transamination, neurotransmitter synthesis, and transsulfuration.',
    established_functions_bn: 'অ্যামাইনো অ্যাসিড বিপাক ও স্নায়ু-সঙ্কেত সংশ্লেষণে ভূমিকা।',
    relevant_lab_markers: ['homocysteine'],
    relevant_systems: ['energy', 'biotransformation', 'communication'],
    evidence_ids: ['EVID_NIH_ODS_MICRONUTRIENTS']
  },
  {
    canonical_id: 'folate',
    r7_nutrient_id: 'folate',
    group: 'vitamin',
    label_en: 'Folate (Dietary Folate Equivalents)',
    label_bn: 'ফোলেট (ভিটামিন বি৯)',
    canonical_unit: 'mcg_DFE',
    supported_units: ['mcg', 'mcg_DFE'],
    food_json_key: 'folate_mcg',
    established_functions_en: 'One-carbon methyl donor for purine/thymidylate DNA synthesis and homocysteine remethylation.',
    established_functions_bn: 'ডিএনএ সংশ্লেষণ, লোহিত রক্তকণিকা ও হোমোসিস্টিন নিয়ন্ত্রণে আবশ্যক।',
    relevant_lab_markers: ['folate', 'homocysteine', 'hemoglobin'],
    relevant_systems: ['biotransformation', 'transport'],
    evidence_ids: ['EVID_NIH_ODS_MICRONUTRIENTS']
  },
  {
    canonical_id: 'vitamin_b12',
    r7_nutrient_id: 'vitamin_b12',
    group: 'vitamin',
    label_en: 'Vitamin B12 (Cobalamin)',
    label_bn: 'ভিটামিন বি১২',
    canonical_unit: 'mcg',
    supported_units: ['mcg', 'mg'],
    established_functions_en: 'Methionine synthase and methylmalonyl-CoA mutase cofactor; essential for myelin and erythropoiesis.',
    established_functions_bn: 'স্নায়ু আবরণী ও লোহিত রক্তকণিকা গঠনে অপরিহার্য; কেবল প্রাণিজ/ফার্মেন্টেড/ফর্টিফাইড উৎসে মেলে।',
    relevant_lab_markers: ['vitamin_b12', 'homocysteine', 'hemoglobin'],
    relevant_systems: ['energy', 'communication', 'transport'],
    evidence_ids: ['EVID_ADA_2026_GLYCEMIC', 'EVID_NIH_ODS_MICRONUTRIENTS']
  },
  {
    canonical_id: 'vitamin_c',
    r7_nutrient_id: 'vitamin_c',
    group: 'vitamin',
    label_en: 'Vitamin C (Ascorbic Acid)',
    label_bn: 'ভিটামিন সি',
    canonical_unit: 'mg',
    supported_units: ['mg', 'mcg'],
    food_json_key: 'vitamin_c_mg',
    established_functions_en: 'Collagen prolyl/lysyl hydroxylation, non-heme ferric-to-ferrous iron reduction, and aqueous antioxidant.',
    established_functions_bn: 'কোলাজেন তৈরি, উদ্ভিজ্জ আয়রন শোষণ বৃদ্ধি ও অ্যান্টিঅক্সিডেন্ট সুরক্ষা।',
    relevant_systems: ['defense_repair', 'structural_integrity'],
    evidence_ids: ['EVID_NIH_ODS_MICRONUTRIENTS']
  }
];

const NUTRIENT_BY_ID = new Map<string, R8CanonicalNutrientDefinition>(
  R8_CANONICAL_NUTRIENTS.map(n => [n.canonical_id, n])
);

const NUTRIENT_ALIAS_MAP: Record<string, string> = {
  kcal: 'energy',
  calories: 'energy',
  protein_g: 'protein',
  carbs_g: 'available_carbohydrate',
  carbohydrate: 'available_carbohydrate',
  carbohydrates: 'available_carbohydrate',
  fat_g: 'total_fat',
  energy_kcal: 'energy',
  fiber_g: 'dietary_fiber',
  fiber: 'dietary_fiber',
  calcium_mg: 'calcium',
  iron_mg: 'iron',
  magnesium_mg: 'magnesium',
  phosphorus_mg: 'phosphorus',
  potassium_mg: 'potassium',
  sodium_mg: 'sodium',
  zinc_mg: 'zinc',
  copper_mg: 'copper',
  vitamin_a_mcg: 'vitamin_a',
  vitamin_d_mcg: 'vitamin_d',
  vitamin_d3: 'vitamin_d',
  vitamin_e_mg: 'vitamin_e',
  thiamin_mg: 'thiamin',
  b1: 'thiamin',
  riboflavin_mg: 'riboflavin',
  b2: 'riboflavin',
  niacin_mg: 'niacin',
  b3: 'niacin',
  vitamin_b6_mg: 'vitamin_b6',
  b6: 'vitamin_b6',
  folate_mcg: 'folate',
  b9: 'folate',
  b12: 'vitamin_b12',
  vitamin_c_mg: 'vitamin_c',
  ascorbic_acid: 'vitamin_c'
};

export function resolveR8NutrientId(inputId: string): string {
  const raw = (inputId || '').trim().toLowerCase();
  if (NUTRIENT_BY_ID.has(raw)) return raw;
  if (NUTRIENT_ALIAS_MAP[raw]) return NUTRIENT_ALIAS_MAP[raw];
  const r7Canon = canonicalizeNutrientId(raw);
  if (NUTRIENT_BY_ID.has(r7Canon)) return r7Canon;
  return raw;
}

export function getR8NutrientDefinition(nutrientId: string): R8CanonicalNutrientDefinition | undefined {
  return NUTRIENT_BY_ID.get(resolveR8NutrientId(nutrientId));
}

/**
 * Nutrient-specific unit converter refusing unsupported chemical-form equivalences.
 */
export function convertR8NutrientUnit(
  nutrientId: string,
  value: number,
  fromUnit: string,
  toUnit?: string
): { ok: true; value: number; unit: string } | { ok: false; reason: string } {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return { ok: false, reason: 'Invalid or negative nutrient quantity.' };
  }
  const cid = resolveR8NutrientId(nutrientId);
  const def = NUTRIENT_BY_ID.get(cid);
  const target = (toUnit || def?.canonical_unit || fromUnit).trim();
  const src = (fromUnit || '').trim();
  if (!src) return { ok: false, reason: 'Missing source nutrient unit.' };

  if (src.toLowerCase() === target.toLowerCase()) {
    return { ok: true, value, unit: target };
  }

  // Energy: kcal <-> kJ
  if (cid === 'energy') {
    if (src.toLowerCase() === 'kj' && target.toLowerCase() === 'kcal') {
      return { ok: true, value: value / 4.184, unit: 'kcal' };
    }
    if (src.toLowerCase() === 'kcal' && target.toLowerCase() === 'kj') {
      return { ok: true, value: value * 4.184, unit: 'kJ' };
    }
  }

  // Vitamin D: 1 mcg = 40 IU
  if (cid === 'vitamin_d') {
    if (src.toUpperCase() === 'IU' && target === 'mcg') return { ok: true, value: value / 40, unit: 'mcg' };
    if (src === 'mcg' && target.toUpperCase() === 'IU') return { ok: true, value: value * 40, unit: 'IU' };
  }

  // Vitamin A: preformed retinol 1 IU = 0.3 mcg RAE; refuse ambiguous generic beta-carotene IU conversion unless specified
  if (cid === 'vitamin_a') {
    if ((src === 'mcg' || src === 'mcg_RAE') && (target === 'mcg' || target === 'mcg_RAE')) {
      return { ok: true, value, unit: target };
    }
    return { ok: false, reason: 'Vitamin A IU-to-RAE conversion depends on preformed retinol vs beta-carotene form; specify RAE directly.' };
  }

  // Folate: dietary food folate 1 mcg = 1 mcg DFE (synthetic folic acid = 1.7x; refuse ambiguous folic acid equivalence)
  if (cid === 'folate') {
    if ((src === 'mcg' || src === 'mcg_DFE') && (target === 'mcg' || target === 'mcg_DFE')) {
      return { ok: true, value, unit: target };
    }
  }

  // Standard SI mass conversions (g <-> mg <-> mcg)
  const massFactorToMg: Record<string, number> = {
    g: 1000,
    mg: 1,
    mcg: 0.001,
    'µg': 0.001
  };
  const fSrc = massFactorToMg[src.toLowerCase()] ?? massFactorToMg[src];
  const fTgt = massFactorToMg[target.toLowerCase()] ?? massFactorToMg[target];
  if (fSrc !== undefined && fTgt !== undefined) {
    return { ok: true, value: (value * fSrc) / fTgt, unit: target };
  }

  return { ok: false, reason: `Unsupported nutrient conversion from "${fromUnit}" to "${target}" for ${cid}.` };
}

/**
 * Infers food preparation state conservatively from existing FCTB V6 food record without altering foods.json.
 */
export function deriveFoodMetadataExtension(food: FoodItem): R8FoodMetadataExtension {
  const n = `${food.name_en} ${food.name_bn}`.toLowerCase();
  let state: R8FoodState = 'raw';
  if (n.includes('cooked') || n.includes('boiled') || n.includes('রান্না') || n.includes('সিদ্ধ') || n.includes('ভাত')) {
    state = 'cooked';
  } else if (n.includes('dried') || n.includes('শুঁটকি') || n.includes('dry')) {
    state = 'dried';
  } else if (n.includes('curd') || n.includes('yogurt') || n.includes('দই') || n.includes('ferment')) {
    state = 'fermented';
  } else if (n.includes('bread') || n.includes('biscuit') || n.includes('রুটি') || n.includes('oil') || n.includes('ghee')) {
    state = 'processed';
  }

  return {
    food_id: food.id,
    source_database_id: food.code || food.id,
    source_version: 'FCTB-V6-2013-SHUDDHO',
    food_state: state,
    measurement_basis: 'per_100g_edible',
    regional_aliases_bn: [food.name_bn],
    regional_aliases_en: [food.name_en],
    preparation_notes_en: food.prep_note_en,
    preparation_notes_bn: food.prep_note_bn
  };
}

/**
 * Extracts a canonical nutrient measurement for a given food item, strictly separating
 * measured `0` from `null`/missing/unavailable values.
 */
export function extractFoodNutrientMeasurement(
  food: FoodItem,
  nutrientId: string
): R8NutrientMeasurement {
  const cid = resolveR8NutrientId(nutrientId);
  const def = NUTRIENT_BY_ID.get(cid);
  const meta = deriveFoodMetadataExtension(food);

  if (!def || !def.food_json_key) {
    return {
      canonical_nutrient_id: cid,
      value: null,
      unit: def?.canonical_unit || 'mg',
      quality: 'unavailable',
      basis: meta.measurement_basis,
      food_state: meta.food_state,
      source: food.source_reference || 'FCTB V6',
      note_en: 'Nutrient not measured in baseline food composition table.'
    };
  }

  const macroDict = food.per_100g as Record<string, number | null | undefined>;
  const microDict = (food.micronutrients || {}) as Record<string, number | null | undefined>;
  const rawVal =
    def.food_json_key in macroDict ? macroDict[def.food_json_key] : microDict[def.food_json_key];

  if (rawVal === null || rawVal === undefined || !Number.isFinite(rawVal) || rawVal < 0) {
    return {
      canonical_nutrient_id: cid,
      value: null,
      unit: def.canonical_unit,
      quality: 'missing_unknown',
      basis: meta.measurement_basis,
      food_state: meta.food_state,
      source: food.source_reference || 'FCTB V6'
    };
  }

  const quality: R8NutrientDataQuality = rawVal === 0 ? 'measured_zero' : 'measured_numeric';
  return {
    canonical_nutrient_id: cid,
    value: rawVal,
    unit: def.canonical_unit,
    quality,
    basis: meta.measurement_basis,
    food_state: meta.food_state,
    source: food.source_reference || 'FCTB V6'
  };
}

/**
 * Converts as-purchased weight to raw edible grams using food.edible_portion_factor,
 * and computes cooked weight without double-converting already-cooked records.
 */
export function convertFoodWeightBasis(
  food: FoodItem,
  inputGrams: number,
  basis: 'as_purchased' | 'raw_edible'
): { raw_edible_g: number; cooked_edible_g: number; state: R8FoodState } | null {
  if (typeof inputGrams !== 'number' || !Number.isFinite(inputGrams) || inputGrams <= 0) {
    return null;
  }
  const meta = deriveFoodMetadataExtension(food);
  const epf = typeof food.edible_portion_factor === 'number' && food.edible_portion_factor > 0 && food.edible_portion_factor <= 1
    ? food.edible_portion_factor
    : 1;
  const rawEdibleG = basis === 'as_purchased' ? inputGrams * epf : inputGrams;
  const yieldRatio =
    meta.food_state === 'cooked' || meta.food_state === 'ready_to_eat'
      ? 1
      : typeof food.raw_to_cooked_ratio === 'number' && food.raw_to_cooked_ratio > 0
      ? food.raw_to_cooked_ratio
      : 1;

  return {
    raw_edible_g: Math.round(rawEdibleG * 10) / 10,
    cooked_edible_g: Math.round(rawEdibleG * yieldRatio * 10) / 10,
    state: meta.food_state
  };
}

/**
 * Aggregates nutrients across a list of food portions while preserving unknown-value integrity
 * and reporting data coverage & missing contributing foods.
 */
export function aggregateFoodNutrients(
  items: Array<{ food: FoodItem; raw_edible_g: number }>,
  nutrientIds: string[] = ['energy', 'protein', 'available_carbohydrate', 'total_fat', 'dietary_fiber', 'sodium', 'potassium', 'phosphorus', 'calcium', 'iron', 'magnesium', 'zinc', 'vitamin_c', 'folate'],
  servings: number = 1
): Record<string, R8ComputedNutrientSubtotal> {
  const safeServings = servings > 0 && Number.isFinite(servings) ? servings : 1;
  const out: Record<string, R8ComputedNutrientSubtotal> = {};

  for (const nid of nutrientIds) {
    const cid = resolveR8NutrientId(nid);
    const def = NUTRIENT_BY_ID.get(cid);
    let knownTotal = 0;
    let contributing = 0;
    const missingFoodIds: string[] = [];

    for (const item of items) {
      if (!item.food || !Number.isFinite(item.raw_edible_g) || item.raw_edible_g < 0) continue;
      const m = extractFoodNutrientMeasurement(item.food, cid);
      if (m.value !== null && Number.isFinite(m.value)) {
        knownTotal += (m.value * item.raw_edible_g) / 100;
        contributing++;
      } else {
        missingFoodIds.push(item.food.id);
      }
    }

    const totalFoods = items.length;
    const roundedTotal = Math.round(knownTotal * 100) / 100;
    out[cid] = {
      canonical_nutrient_id: cid,
      label_en: def?.label_en || cid,
      unit: def?.canonical_unit || 'mg',
      known_total: roundedTotal,
      per_serving: Math.round((roundedTotal / safeServings) * 100) / 100,
      contributing_foods_count: contributing,
      total_foods_count: totalFoods,
      missing_food_ids: missingFoodIds,
      is_incomplete: missingFoodIds.length > 0,
      coverage_ratio: totalFoods > 0 ? Math.round((contributing / totalFoods) * 100) / 100 : 1
    };
  }

  return out;
}
