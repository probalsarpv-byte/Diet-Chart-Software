import { ClinicalConditionId, DiseaseRule } from '../types';

export const DISEASE_RULES: Record<ClinicalConditionId, DiseaseRule> = {
  t2d_ir: {
    id: 't2d_ir',
    name_en: "Type 2 Diabetes / Insulin Resistance",
    name_bn: "টাইপ ২ ডায়াবেটিস / ইনসুলিন রেজিস্ট্যান্স",
    clinical_summary_en: "Characterized by receptor desensitization, postprandial glucose excursions, and hepatic hyperinsulinemia. Focuses on low glycemic load, high viscous fibers, and AMPK activation.",
    clinical_summary_bn: "কোষীয় ইনসুলিন রিসেপ্টরের অকার্যকারিতা ও খাবার পর ব্লাড সুগার স্পাইক। লো-গ্লাইসেমিক খাদ্য, ভোজ্য ফাইবার এবং এএমপিকে পাথওয়ে সক্রিয়করণ মূল লক্ষ্য।",
    redTags: ['high_fructose', 'high_sodium_processed'],
    yellowTags: ['medium_purine', 'high_potassium'],
    greenTags: ['insulin_sensitizing', 'anti_inflammatory', 'low_fodmap', 'gut_healing'],
    redFoods: ['01_0002', '01_0003', '15_0008', '15_0004', '15_0005', 'sugar', 'jaggery', 'honey', 'white bread', 'chanachur', 'biscuit'],
    yellowFoods: ['potato', 'sweet potato', 'ripe mango', 'banana', 'white rice'],
    greenFoods: ['bitter gourd', 'fenugreek', 'cinnamon', 'flaxseed', 'chia', 'spinach', 'red rice', 'egg', 'fish'],
    macroAdjustment: {
      carb_pct_range: [25, 35],
      protein_g_per_kg: [1.2, 1.5],
      fat_pct_range: [35, 45]
    },
    mealTimingRules: [
      {
        rule_bn: "খাবারের মাঝখানে কোনো স্ন্যাকস বা চা-বিস্কুট খাওয়া সম্পূর্ণ বন্ধ রাখুন (দিনে ২-৩ টি মূল খাবার)।",
        rule_en: "Strictly eliminate inter-meal snacking to allow basal insulin levels to drop to baseline."
      },
      {
        rule_bn: "রাতে অন্তত ১২-১৪ ঘণ্টার প্রাকৃতিক উপবাস (Intermittent Fasting) বজায় রাখুন।",
        rule_en: "Maintain a consistent 12-14 hour overnight fast to restore nocturnal insulin sensitivity."
      }
    ],
    clinicalRationaleBn: "ইনসুলিন রেজিস্ট্যান্সে অতিরিক্ত শর্করা ও চিনি যকৃতে চর্বি জমা করে এবং অগ্ন্যাশয়কে ক্লান্ত করে।",
    clinicalRationaleEn: "Excess refined glycemic load drives hyperinsulinemic beta-cell exhaustion and de novo lipogenesis."
  },

  hypothyroid: {
    id: 'hypothyroid',
    name_en: "Hypothyroidism / Hashimoto's Autoimmune",
    name_bn: "হাইপোথাইরয়েডিজম / হাশিমোটোস থাইরয়েডাইটিস",
    clinical_summary_en: "Diminished basal metabolic rate and impaired peripheral T4-to-T3 deiodination. Strict elimination of raw goitrogens, gluten cross-reactivity, and ensuring selenium, zinc and tyrosine availability.",
    clinical_summary_bn: "ধীর মেটাবলিজম এবং টি৪ থেকে টি৩ সক্রিয় হরমোনে রূপান্তরের ঘাটতি। কাঁচা গয়ট্রোজেন ও গ্লুটেন বর্জন এবং সেলেনিয়াম, জিঙ্ক ও টাইরোসিন নিশ্চিতকরণ প্রয়োজন।",
    redTags: ['goitrogen_raw', 'contains_gluten'],
    yellowTags: ['goitrogen_cooked_safe', 'phytate_soak_needed'],
    greenTags: ['gluten_free', 'anti_inflammatory', 'gut_healing', 'choline_rich'],
    redFoods: ['wheat', 'flour', 'semolina', 'bread', 'soybean', 'raw cabbage', 'raw cauliflower', 'raw radish'],
    yellowFoods: ['cooked cabbage', 'cooked cauliflower', 'broccoli cooked', 'mustard greens cooked'],
    greenFoods: ['egg', 'sea fish', 'pumpkin seed', 'pure cow ghee', 'virgin coconut oil', 'red rice', 'papaya'],
    macroAdjustment: {
      carb_pct_range: [35, 45],
      protein_g_per_kg: [1.2, 1.4],
      fat_pct_range: [30, 40]
    },
    mealTimingRules: [
      {
        rule_bn: "ঘুম থেকে উঠে খালি পেটে থাইরক্সিন ওষুধ গ্রহণের পর অন্তত ৬০ মিনিট কোনো খাবার, চা বা কফি খাবেন না।",
        rule_en: "Take thyroid hormone immediately upon rising on an empty stomach; wait 60 mins before breakfast or coffee."
      },
      {
        rule_bn: "ক্যালসিয়াম, আয়রন বা যেকোনো খনিজ সাপ্লিমেন্ট থাইরয়েড ওষুধের অন্তত ৪ ঘণ্টা পর গ্রহণ করুন।",
        rule_en: "Maintain minimum 4 hours gap between thyroid medication and calcium, iron, or magnesium."
      }
    ],
    clinicalRationaleBn: "কাঁচা গয়ট্রোজেন থাইরয়েড আয়োডিন গ্রহণে বাধা দেয় এবং গ্লুটেন আণবিক মিলের কারণে অটোইমিউন অ্যান্টিবডি বাড়ায়। রান্না করলে গয়ট্রোজেন নিরাপদ হয়।",
    clinicalRationaleEn: "Raw isothiocyanates competitively inhibit thyroidal sodium-iodide symporters. Thermal cooking deactivates myrosinase."
  },

  fatty_liver: {
    id: 'fatty_liver',
    name_en: "Fatty Liver (MASLD / NAFLD)",
    name_bn: "ফ্যাটি লিভার (এমএএসএলডি / এনএএফএলডি)",
    clinical_summary_en: "Hepatic lipid accumulation (steatosis >5%) driven by fructose overload, visceral adiposity, and mitochondrial oxidative stress. Protocol focuses on hepatic choline support and lipophagy.",
    clinical_summary_bn: "যকৃতে ৫% এর বেশি অতিরিক্ত চর্বি জমা ও প্রদাহ। ফ্রুক্টোজ বর্জন, কোলিন সরবরাহ এবং হেপাটিক অটোফ্যাজি সক্রিয়করণ প্রধান থেরাপি।",
    redTags: ['high_fructose', 'high_sodium_processed'],
    yellowTags: ['high_purine'],
    greenTags: ['liver_detox', 'choline_rich', 'anti_inflammatory', 'insulin_sensitizing'],
    redFoods: ['sugar', 'honey', 'fruit juice', 'mango', 'sweetmeat', 'bakery products', 'alcohol', 'soft drinks'],
    yellowFoods: ['red meat', 'beef', 'mutton', 'white rice'],
    greenFoods: ['garlic', 'beetroot', 'bitter gourd', 'turmeric', 'egg', 'green tea', 'mustard oil', 'lemon water'],
    macroAdjustment: {
      carb_pct_range: [30, 35],
      protein_g_per_kg: [1.3, 1.5],
      fat_pct_range: [35, 40]
    },
    mealTimingRules: [
      {
        rule_bn: "রাত ৮টার মধ্যে রাতের খাবার শেষ করুন এবং সকালে প্রথম খাবার পর্যন্ত ১৪ ঘণ্টার ফাস্টিং বজায় রাখুন (লিভারের ফ্যাট বার্নিং বাড়ে)।",
        rule_en: "Finish dinner by 8:00 PM and maintain a 14-hour fasting window to promote hepatic fatty acid oxidation."
      }
    ],
    clinicalRationaleBn: "ফ্রি ফ্রুক্টোজ সরাসরি যকৃতে ট্রাইগ্লিসারাইডে রূপান্তরিত হয়; চিনি ও ফলের রস বন্ধ করলে লিভারের চর্বি দ্রুত গলে।",
    clinicalRationaleEn: "Fructose bypasses phosphofructokinase regulation, feeding uninhibited de novo lipogenesis in hepatocytes."
  },

  pcos: {
    id: 'pcos',
    name_en: "PCOS / Hormonal & Ovarian Imbalance",
    name_bn: "পিসিওএস / পলিসিস্টিক ওভারি সিন্ড্রোম",
    clinical_summary_en: "Hyperandrogenism, chronic anovulation, and cellular insulin resistance causing LH/FSH dysregulation. Protocol emphasizes androgen reduction, anti-inflammatory whole foods, and seed cycling.",
    clinical_summary_bn: "পুরুষ হরমোন (এন্ড্রোজেন) বৃদ্ধি, ডিম্বস্ফোটন না হওয়া এবং অনিয়মিত মাসিক। ইনসুলিন সংবেদনশীলতা বৃদ্ধি এবং প্রদাহ দমন প্রধান চিকিৎসা।",
    redTags: ['contains_gluten', 'high_fructose', 'high_sodium_processed'],
    yellowTags: ['goitrogen_raw'],
    greenTags: ['insulin_sensitizing', 'anti_inflammatory', 'seed_nut', 'gut_healing'],
    redFoods: ['wheat', 'bakery', 'sugar', 'pasteurized commercial milk', 'junk food'],
    yellowFoods: ['sweet fruits', 'white rice'],
    greenFoods: ['spearmint tea', 'pumpkin seed', 'flaxseed', 'sunflower seed', 'amla', 'spinach', 'red rice', 'fish'],
    macroAdjustment: {
      carb_pct_range: [30, 35],
      protein_g_per_kg: [1.3, 1.5],
      fat_pct_range: [35, 40]
    },
    mealTimingRules: [
      {
        rule_bn: "সকালের নাশতায় পর্যাপ্ত প্রোটিন (ডিম বা মাছ) রাখুন; এটি সারা দিনের মিষ্টি ও কার্ব ক্রেভিং রোধ করে।",
        rule_en: "Anchor breakfast with substantial clean protein to blunt daytime ghrelin and insulin surges."
      }
    ],
    clinicalRationaleBn: "ইনসুলিন হরমোনের আধিক্য ডিম্বাশয়কে অতিরিক্ত টেস্টোস্টেরন তৈরিতে বাধ্য করে। সুগার নিয়ন্ত্রণ করলেই হরমোন ব্যালেন্স ফিরে আসে।",
    clinicalRationaleEn: "Hyperinsulinemia stimulates ovarian theca cells to overproduce androgens and suppresses sex hormone-binding globulin."
  },

  gut_dysbiosis: {
    id: 'gut_dysbiosis',
    name_en: "Gut Dysbiosis / IBS / Hypoacidity",
    name_bn: "অন্ত্রের ডিসবায়োসিস / আইবিএস / অম্লস্বল্পতা",
    clinical_summary_en: "Mucosal barrier disruption (leaky gut), small intestinal microbial fermentative overgrowth, and inadequate gastric hydrochloric acid. Protocol uses a 4R gut repair and low fermentable oligosaccharides.",
    clinical_summary_bn: "অন্ত্রের মিউকোসা স্তরের ক্ষতি (লিকি গাট), অতিরিক্ত গ্যাস ও বদহজম। সহজে পরিপাকযোগ্য খাবার, পাকস্থলীর এসিড বৃদ্ধি ও প্রোবায়োটিক পুনর্বাসন মূল লক্ষ্য।",
    redTags: ['high_fodmap', 'high_histamine', 'contains_gluten'],
    yellowTags: ['phytate_soak_needed'],
    greenTags: ['low_fodmap', 'gut_healing', 'anti_inflammatory'],
    redFoods: ['raw onion', 'raw garlic', 'wheat', 'shutki', 'deep fried', 'chili', 'milk', 'soft drinks'],
    yellowFoods: ['soaked lentils', 'chickpea', 'cauliflower', 'cabbage'],
    greenFoods: ['papaya', 'bottle gourd', 'pumpkin', 'pure cow ghee', 'ginger', 'bone broth', 'cucumber', 'red rice'],
    macroAdjustment: {
      carb_pct_range: [35, 45],
      protein_g_per_kg: [1.2, 1.4],
      fat_pct_range: [30, 35]
    },
    mealTimingRules: [
      {
        rule_bn: "খাবারের ২০ মিনিট পূর্বে সামান্য আদা কুচি ও সৈন্ধব লবণ চিবিয়ে খেলে পাচক রস নিঃসরণ বহুগুণ বৃদ্ধি পায়।",
        rule_en: "Chew fresh ginger slivers with Himalayan pink salt 20 minutes before meals to stimulate cephalic acid secretion."
      },
      {
        rule_bn: "দুই খাবারের মাঝে অন্তত ৪ ঘণ্টার বিরতি দিন যাতে অন্ত্রের প্রাকৃতিক পরিচ্ছন্নতা তরঙ্গ (MMC) সক্রিয় হতে পারে।",
        rule_en: "Maintain 4-hour spacing between solid meals to enable the Migrating Motor Complex (MMC) housekeeping cycle."
      }
    ],
    clinicalRationaleBn: "উচ্চ গাঁজনযোগ্য কার্বোহাইড্রেট (FODMAP) অন্ত্রের ব্যাকটেরিয়ার দ্রুত পচন ঘটিয়ে গ্যাস, পেট ফাঁপা ও প্রদাহ তৈরি করে।",
    clinicalRationaleEn: "High-FODMAP substrates undergo rapid microbial fermentation in dysbiotic bowels, triggering osmotic distension and pain."
  },

  uric_acid_gout: {
    id: 'uric_acid_gout',
    name_en: "High Uric Acid / Hyperuricemia & Gout",
    name_bn: "উচ্চ ইউরিক অ্যাসিড / গাউট ও অস্থিসন্ধির বাত",
    clinical_summary_en: "Hyperuricemia driven by endogenous purine breakdown, renal URAT1 reabsorption, and hepatic ATP depletion by fructose. Protocol focuses on urinary alkalinization and purine filtering.",
    clinical_summary_bn: "রক্তে অতিরিক্ত ইউরিক অ্যাসিড জমা হয়ে অস্থিসন্ধিতে ক্রিস্টাল তৈরি করে। পিউরিন খাদ্য হ্রাস, ফ্রুক্টোজ বর্জন এবং প্রস্রাব ক্ষারীয় রাখা অত্যাবশ্যক।",
    redTags: ['high_purine', 'high_fructose'],
    yellowTags: ['medium_purine', 'high_oxalate'],
    greenTags: ['anti_inflammatory', 'low_fodmap', 'nitrate_rich'],
    redFoods: ['beef', 'mutton', 'liver', 'kidney', 'hilsha egg', 'shrimp', 'prawn', 'shutki', 'beer', 'honey', 'sugar'],
    yellowFoods: ['lentils', 'masoor dal', 'chicken', 'spinach', 'cauliflower', 'mushrooms'],
    greenFoods: ['bottle gourd', 'cucumber', 'lemon water', 'egg', 'curd', 'red rice', 'papaya', 'pointed gourd'],
    macroAdjustment: {
      carb_pct_range: [45, 50],
      protein_g_per_kg: [1.0, 1.2],
      fat_pct_range: [30, 35]
    },
    mealTimingRules: [
      {
        rule_bn: "প্রতিদিন অন্তত ৩.৫ লিটার বিশুদ্ধ পানি পান করুন; সকালে ও বিকেলে এক গ্লাস কুসুম গরম পানিতে তাজা লেবুর রস মিশিয়ে পান করুন।",
        rule_en: "Drink minimum 3.5 L water daily; consume fresh lemon water morning and evening to alkalinize urine."
      },
      {
        rule_bn: "হঠাৎ দীর্ঘস্থায়ী অনাহার বা তীব্র ক্র্যাশ ডায়েট করবেন না; কিটোন বডি তৈরি হলে কিডনিতে ইউরিক এসিড নির্গমন বাধাগ্রস্ত হয়।",
        rule_en: "Avoid rapid severe caloric starvation or ketogenic extremes as competitive acetoacetate excretion blocks urate clearance."
      }
    ],
    clinicalRationaleBn: "অতিরিক্ত পিউরিনযুক্ত রেড মিট, কলিজা, চিংড়ি ও শুঁটকি সরাসরি ইউরিক এসিডে রূপান্তরিত হয় এবং ফ্রুক্টোজ কিডনি দিয়ে এর নির্গমন রোধ করে।",
    clinicalRationaleEn: "Exogenous purines hydrolyze into uric acid; concomitant fructose phosphorylation rapidly exhausts ATP into AMP and urate."
  },

  hypertension_ckd: {
    id: 'hypertension_ckd',
    name_en: "Hypertension / Early Renal Caution",
    name_bn: "উচ্চ রক্তচাপ / কিডনির প্রাথমিক সুরক্ষা ও সতর্কতা",
    clinical_summary_en: "Endothelial nitric oxide deficiency, renin-angiotensin-aldosterone axis overactivity, and microvascular pressure. Protocol balances sodium-potassium ratio and minimizes nitrogenous load.",
    clinical_summary_bn: "রক্তনালীর সংকোচন, অতিরিক্ত সোডিয়াম রিটেনশন এবং কিডনির ছাঁকন ক্ষমতার প্রাথমিক সুরক্ষা। পরিমিত প্রোটিন ও প্রাকৃতিক নাইট্রেট গ্রহণ লক্ষ্য।",
    redTags: ['high_sodium_processed'],
    yellowTags: ['high_potassium', 'high_purine'],
    greenTags: ['nitrate_rich', 'anti_inflammatory', 'gut_healing'],
    redFoods: ['chanachur', 'pickles', 'salted shutki', 'canned foods', 'bakery bread', 'table salt', 'processed cheese'],
    yellowFoods: ['coconut water', 'banana', 'spinach', 'red meat'],
    greenFoods: ['beetroot', 'cucumber', 'garlic', 'coriander', 'bottle gourd', 'steamed freshwater fish', 'egg white'],
    macroAdjustment: {
      carb_pct_range: [45, 50],
      protein_g_per_kg: [0.8, 1.0],
      fat_pct_range: [30, 35]
    },
    mealTimingRules: [
      {
        rule_bn: "খাবারে বাড়তি কাঁচা লবণ মেশানো সম্পূর্ণ নিষিদ্ধ। রান্নায় প্রাকৃতিক মসলা (রসুন, আদা, জিরা, ধনেপাতা) ব্যবহার করে স্বাদ বৃদ্ধি করুন।",
        rule_en: "Strictly eliminate discretionary table salt; utilize fresh aromatic herbs (garlic, cumin, coriander) for palate flavor."
      }
    ],
    clinicalRationaleBn: "অতিরিক্ত সোডিয়াম রক্তনালীর চাপ বাড়ায় এবং অনিয়ন্ত্রিত উচ্চ রক্তচাপ কিডনির সূক্ষ্ম গ্লোমেরুলাস কোষের ক্ষতি করে।",
    clinicalRationaleEn: "Excess sodium promotes vascular hypervolemia and renal glomerular hyperfiltration injury."
  },

  dyslipidemia_atherosclerosis: {
    id: 'dyslipidemia_atherosclerosis',
    name_en: "Dyslipidemia / Atherosclerosis & Cardiovascular Risk",
    name_bn: "ডিসলিপিডেমিয়া / এথেরোস্ক্লেরোসিস ও হৃদরোগের ঝুঁকি",
    clinical_summary_en: "Elevated atherogenic ApoB/LDL particles, small dense LDL, endothelial oxidative stress, and hypertriglyceridemia. Focuses on soluble viscous fibers, plant sterols, omega-3 fatty acids, and trans-fat elimination.",
    clinical_summary_bn: "রক্তে ক্ষতিকর কোলেস্টেরল (এলডিএল, ট্রাইগ্লিসারাইড) বৃদ্ধি ও রক্তনালীর প্রাচীরে প্লাক জমার ঝুঁকি। দ্রবণীয় ফাইবার, ওমেগা-৩ ও প্রাকৃতিক উদ্ভিজ্জ অ্যান্টিঅক্সিডেন্ট মূল থেরাপি।",
    redTags: ['high_fructose', 'high_sodium_processed'],
    yellowTags: ['high_purine'],
    greenTags: ['anti_inflammatory', 'nitrate_rich', 'choline_rich'],
    redFoods: ['trans fat', 'dalda', 'vanaspati', 'deep fried', 'bakery products', 'processed meat', 'soft drinks', 'sugar'],
    yellowFoods: ['egg yolk', 'red meat', 'beef', 'mutton', 'white rice', 'coconut oil'],
    greenFoods: ['cold pressed mustard oil', 'flaxseed', 'chia', 'garlic', 'fenugreek', 'red rice', 'sea fish', 'bottle gourd', 'green tea'],
    macroAdjustment: {
      carb_pct_range: [30, 35],
      protein_g_per_kg: [1.2, 1.4],
      fat_pct_range: [35, 40]
    },
    mealTimingRules: [
      {
        rule_bn: "সকালে খালি পেটে বা প্রধান খাবারের পূর্বে মেথি ভেজানো পানি অথবা ইসুবগুলের ভুসি পান করলে পিত্ত ও অতিরিক্ত কোলেস্টেরল অন্ত্র দিয়ে নির্গত হয়।",
        rule_en: "Consume soaked fenugreek water or psyllium husk prior to main meals to bind intestinal bile acids and excrete circulating cholesterol."
      }
    ],
    clinicalRationaleBn: "ট্রান্স ফ্যাট ও পরিশোধিত চিনি যকৃতে ভিএলডিএল ও ট্রাইগ্লিসারাইড বাড়ায়; দ্রবণীয় ফাইবার কোলেস্টেরল পুনঃশোষণ রোধ করে।",
    clinicalRationaleEn: "Trans fats and high-fructose syrups upregulate hepatic SREBP-1c, accelerating atherogenic dyslipidemia."
  },

  metabolic_syndrome: {
    id: 'metabolic_syndrome',
    name_en: "Metabolic Syndrome (MetS / Cardiometabolic Triad)",
    name_bn: "মেটাবলিক সিন্ড্রোম (কার্ডিওমেটাবলিক ট্রায়াড)",
    clinical_summary_en: "Co-occurrence of abdominal visceral adiposity, hypertriglyceridemia, low HDL, elevated fasting glucose, and arterial hypertension. Protocol emphasizes low glycemic load, AMPK activation, and circadian fasting.",
    clinical_summary_bn: "পেটের মেদ বৃদ্ধি, উচ্চ ট্রাইগ্লিসারাইড, কম এইচডিএল, উচ্চ রক্তচাপ ও ব্লাড সুগার বৃদ্ধির যৌথ জটিলতা। লো-গ্লাইসেমিক খাদ্য ও মেটাবলিক নমনীয়তা পুনরুদ্ধার লক্ষ্য।",
    redTags: ['high_fructose', 'high_sodium_processed'],
    yellowTags: ['medium_purine'],
    greenTags: ['insulin_sensitizing', 'anti_inflammatory', 'nitrate_rich'],
    redFoods: ['sugar', 'sweets', 'sweetmeat', 'white flour', 'bakery', 'chanachur', 'soft drinks', 'deep fried'],
    yellowFoods: ['white rice', 'potato', 'banana', 'mango'],
    greenFoods: ['bitter gourd', 'cinnamon', 'fenugreek', 'spinach', 'cucumber', 'freshwater fish', 'egg', 'apple cider vinegar'],
    macroAdjustment: {
      carb_pct_range: [25, 35],
      protein_g_per_kg: [1.3, 1.5],
      fat_pct_range: [35, 45]
    },
    mealTimingRules: [
      {
        rule_bn: "প্রতিদিন ১২-১৪ ঘণ্টার প্রাকৃতিক উপবাস (Intermittent Fasting) পালন করুন এবং খাবারের মাঝের অনর্থক স্ন্যাকস খাওয়া বন্ধ রাখুন।",
        rule_en: "Adopt a consistent 12-14 hour overnight fasting interval and eliminate intermediate snacking to lower basal hyperinsulinemia."
      }
    ],
    clinicalRationaleBn: "ইনসুলিন ও ভিসেরাল ফ্যাটের পারস্পরিক চক্র ভাঙতে কার্বোহাইড্রেট নিয়ন্ত্রণ ও দীর্ঘ বিরতির উপবাস অত্যন্ত কার্যকরী।",
    clinicalRationaleEn: "Visceral adipocytes secrete pro-inflammatory adipokines and free fatty acids, exacerbating hepatic and peripheral insulin resistance."
  },

  lada_early_pancreatic: {
    id: 'lada_early_pancreatic',
    name_en: "LADA / Autoimmune Diabetes / Beta-Cell Insufficiency",
    name_bn: "লাডা / অটোইমিউন ডায়াবেটিস ও অগ্ন্যাশয় সুরক্ষা",
    clinical_summary_en: "Adult-onset autoimmune beta-cell failure (anti-GAD/IA-2 antibodies) with progressive insulin deficiency. Protocol focuses on pancreatic beta-cell preservation, immune modulation, and avoiding beta-cell glucotoxicity.",
    clinical_summary_bn: "প্রাপ্তবয়স্কদের অটোইমিউন ডায়াবেটিস যাতে অগ্ন্যাশয়ের ইনসুলিন উৎপাদনকারী বিটা কোষ ধীরে ধীরে ক্ষতিগ্রস্ত হয়। বিটা কোষের দীর্ঘায়ু রক্ষা ও সুগার স্পাইক রোধ লক্ষ্য।",
    redTags: ['high_fructose', 'contains_gluten'],
    yellowTags: ['high_sodium_processed'],
    greenTags: ['anti_inflammatory', 'gluten_free', 'gut_healing'],
    redFoods: ['sugar', 'wheat', 'bakery', 'honey', 'soft drinks', 'sweetmeat'],
    yellowFoods: ['white rice', 'potato', 'sweet fruits'],
    greenFoods: ['egg', 'freshwater fish', 'pure cow ghee', 'leafy greens', 'turmeric', 'pumpkin seeds', 'olive oil'],
    macroAdjustment: {
      carb_pct_range: [30, 35],
      protein_g_per_kg: [1.2, 1.4],
      fat_pct_range: [35, 40]
    },
    mealTimingRules: [
      {
        rule_bn: "প্রতিটি খাবারে প্রোটিন ও স্বাস্থ্যকর চর্বি নিশ্চিত করুন যাতে রক্তে ইনসুলিনের হঠাৎ ঘাটতি বা গ্লুকোজ স্পাইক না ঘটে।",
        rule_en: "Pair complex carbohydrates with clean protein and healthy lipids at every meal to avoid postprandial glucose volatility."
      }
    ],
    clinicalRationaleBn: "উচ্চ গ্লুকোজ বিটা কোষে গ্লুকোটক্সিসিটি সৃষ্টি করে এর ধ্বংস ত্বরান্বিত করে; পরিমিত সুষম খাদ্য বিটা কোষের কর্মক্ষমতা দীর্ঘস্থায়ী করে।",
    clinicalRationaleEn: "Glucotoxicity accelerates apoptotic demise of remaining pancreatic beta-cells; nutritional stabilization mitigates autoimmune stress."
  },

  sibo_microbial_overgrowth: {
    id: 'sibo_microbial_overgrowth',
    name_en: "SIBO / Small Intestinal Bacterial Overgrowth",
    name_bn: "সিবো / ক্ষুদ্রান্ত্রে অতিরিক্ত ব্যাকটেরিয়ার বিস্তার",
    clinical_summary_en: "Abnormal bacterial colonization of the small intestine triggering early carbohydrate fermentation, bloating, methane/hydrogen gas, and migrating motor complex (MMC) failure. Protocol utilizes biphasic low-fermentable foods and MMC spacing.",
    clinical_summary_bn: "ক্ষুদ্রান্ত্রে অনাকাঙ্ক্ষিত ব্যাকটেরিয়ার বংশবৃদ্ধি যার ফলে খাবার গ্রহণের পরপরই তীব্র পেট ফাঁপা, গ্যাস ও হজমে বিঘ্ন ঘটে। লো-ফার্মেন্টেবল খাদ্য ও অন্ত্রের পরিচ্ছন্নতা তরঙ্গ সক্রিয়করণ প্রধান লক্ষ্য।",
    redTags: ['high_fodmap', 'high_fructose'],
    yellowTags: ['phytate_soak_needed'],
    greenTags: ['low_fodmap', 'gut_healing', 'anti_inflammatory'],
    redFoods: ['raw onion', 'raw garlic', 'wheat', 'cauliflower', 'cabbage', 'beans', 'lentils', 'apples', 'soft drinks'],
    yellowFoods: ['well cooked lentils', 'soaked chickpeas', 'ripe papaya'],
    greenFoods: ['bottle gourd', 'cucumber', 'ginger', 'mint', 'red rice', 'steamed freshwater fish', 'egg', 'pure cow ghee'],
    macroAdjustment: {
      carb_pct_range: [35, 40],
      protein_g_per_kg: [1.2, 1.4],
      fat_pct_range: [30, 35]
    },
    mealTimingRules: [
      {
        rule_bn: "দুই মূল খাবারের মাঝে কমপক্ষে ৪-৫ ঘণ্টার সম্পূর্ণ বিরতি রাখুন (কোনো খাবার বা ক্যালোরিযুক্ত পানীয় নয়) যাতে অন্ত্রের প্রাকৃতিক পরিচ্ছন্নতা তরঙ্গ (MMC) খাবার অবশিষ্টাংশ পরিষ্কার করতে পারে।",
        rule_en: "Enforce strict 4-5 hour inter-meal fasting to permit migrating motor complex (MMC) phase III housekeeping contractions."
      }
    ],
    clinicalRationaleBn: "উচ্চ ফার্মান্টেবল কার্বোহাইড্রেট ক্ষুদ্রান্ত্রের ব্যাকটেরিয়ার প্রধান খাদ্য; এগুলো বন্ধ করলে ব্যাকটেরিয়ার বিস্তার ও পেট ফাঁপা দ্রুত কমে।",
    clinicalRationaleEn: "Bacterial fermentation of oligosaccharides in the small intestine yields excessive hydrogen/methane, distending bowel loops."
  },

  gerd_reflux_esophagitis: {
    id: 'gerd_reflux_esophagitis',
    name_en: "GERD / Reflux Esophagitis & LES Dysfunction",
    name_bn: "জিইআরডি / এসিড রিফ্লাক্স ও খাদ্যনালীর প্রদাহ",
    clinical_summary_en: "Retrograde flow of gastric contents into the esophagus due to transient lower esophageal sphincter (LES) relaxations or delayed gastric emptying. Protocol eliminates LES relaxants and mechanical intra-abdominal pressure.",
    clinical_summary_bn: "পাকস্থলীর অ্যাসিড ও পাচক রস খাদ্যনালীতে উঠে আসা, বুকজ্বালা ও গলায় অস্বস্তি। খাদ্যনালীর ভালভ (LES) শিথিলকারী খাবার বর্জন ও সহজপাচ্য হালকা আহার মূল চিকিৎসা।",
    redTags: ['high_histamine', 'high_sodium_processed'],
    yellowTags: ['high_fructose'],
    greenTags: ['gut_healing', 'anti_inflammatory', 'low_fodmap'],
    redFoods: ['deep fried', 'raw chili', 'peppermint', 'mint', 'chocolate', 'coffee', 'black tea', 'citrus fruits', 'tomato sauce', 'soft drinks'],
    yellowFoods: ['cooked onion', 'garlic in curry', 'fatty meat'],
    greenFoods: ['bottle gourd', 'green papaya stew', 'oatmeal', 'boiled fish', 'almond milk', 'cucumber', 'ginger tea', 'red rice'],
    macroAdjustment: {
      carb_pct_range: [40, 45],
      protein_g_per_kg: [1.1, 1.3],
      fat_pct_range: [25, 30]
    },
    mealTimingRules: [
      {
        rule_bn: "শোবার অন্তত ৩ ঘণ্টা পূর্বে রাতের খাবার সম্পন্ন করুন এবং আহারের পরপরই শুয়ে পড়বেন না। একবারে অতিরিক্ত না খেয়ে অল্প অল্প করে দিনে ৩-৪ বার আহার করুন।",
        rule_en: "Complete evening meal at least 3 hours before sleep; avoid postprandial recumbency and consume moderate-volume portions."
      }
    ],
    clinicalRationaleBn: "ভাজাভুজি, অতিরিক্ত চর্বি ও পুদিনা খাদ্যনালীর ভালভ আলগা করে দেয়, ফলে শোবার পর পাকস্থলীর এসিড সহজে খাদ্যনালীতে উঠে বুকজ্বালা ঘটায়।",
    clinicalRationaleEn: "Fat-rich chyme stimulates cholecystokinin release, decreasing lower esophageal sphincter resting tone and delaying gastric emptying."
  },

  ibd_mucosal_inflammation: {
    id: 'ibd_mucosal_inflammation',
    name_en: "IBD / Mucosal Colitis & Intestinal Inflammation",
    name_bn: "আইবিডি / আলসারেটিভ কোলাইটিস ও অন্ত্রের দীর্ঘস্থায়ী প্রদাহ",
    clinical_summary_en: "Chronic intestinal mucosal immune hyperreactivity, impaired epithelial barrier integrity, and microvascular permeability. Protocol focuses on mucosal regeneration, low-residue during active flares, and elemental nutrition support.",
    clinical_summary_bn: "বৃহদান্ত্র বা অন্ত্রের মিউকোসা স্তরের তীব্র প্রদাহ, ক্ষত ও রক্তক্ষরণজনিত সমস্যা। সহজে শোষণযোগ্য মসৃণ নরম পথ্য, প্রদাহ দমন ও অন্ত্রের দেয়াল পুনর্গঠন মূল লক্ষ্য।",
    redTags: ['contains_gluten', 'high_histamine', 'high_fodmap'],
    yellowTags: ['phytate_soak_needed'],
    greenTags: ['gut_healing', 'anti_inflammatory', 'low_fodmap'],
    redFoods: ['raw vegetables', 'roughage', 'spicy shutki', 'chili', 'cow milk', 'seeds', 'nuts', 'deep fried', 'processed meat'],
    yellowFoods: ['well cooked vegetables', 'lentil soup', 'skinless chicken'],
    greenFoods: ['steamed fish', 'magur fish soup', 'boiled green papaya', 'bottle gourd', 'soft rice', 'pure cow ghee', 'turmeric broth'],
    macroAdjustment: {
      carb_pct_range: [40, 45],
      protein_g_per_kg: [1.3, 1.6],
      fat_pct_range: [25, 30]
    },
    mealTimingRules: [
      {
        rule_bn: "প্রদাহের তীব্র অবস্থায় কাঁচা শাকসবজি বা শক্ত খাবার সম্পূর্ণরূপে বাদ দিয়ে নরম ও সহজপাচ্য জাও ভাত, সেদ্ধ পেঁপে ও হালকা মাছের ঝোল গ্রহণ করুন।",
        rule_en: "During inflammatory exacerbations, strictly eliminate raw roughage and seeds; adopt warm, pureed or soft easily absorbed nutrition."
      }
    ],
    clinicalRationaleBn: "অন্ত্রের দেয়ালে ক্ষত থাকলে অপাচ্য আঁশ ও কাঁচা খাদ্য মিউকোসা স্তরে ঘর্ষণ তৈরি করে রক্তক্ষরণ ও প্রদাহ বাড়িয়ে দেয়।",
    clinicalRationaleEn: "Insoluble fibrous roughage induces mechanical friction across friable, inflamed mucosal ulcerations, precipitating micro-hemorrhage."
  },

  rheumatoid_arthritis: {
    id: 'rheumatoid_arthritis',
    name_en: "Rheumatoid Arthritis / Autoimmune Synovitis",
    name_bn: "রিউমাটয়েড আর্থ্রাইটিস / অটোইমিউন বাতজনিত প্রদাহ",
    clinical_summary_en: "Chronic autoimmune inflammatory synovitis mediated by citrullinated protein antibodies, TNF-alpha, and NF-kB activation. Focuses on Mediterranean-style anti-inflammatory nutrition, omega-3 fatty acids, and mucosal immune tolerance.",
    clinical_summary_bn: "অটোইমিউন কারণজনিত অস্থিসন্ধির দীর্ঘস্থায়ী প্রদাহ, ফোলা ও ব্যথা। ওমেগা-৩ ফ্যাটি এসিড, পলিফেনল এবং প্রদাহনাশক খাদ্যাভ্যাস মূল লক্ষ্য।",
    redTags: ['high_fructose', 'high_sodium_processed', 'trans_fat'],
    yellowTags: ['solanaceae_nightshade', 'purine_moderate'],
    greenTags: ['anti_inflammatory', 'gut_healing', 'omega3_rich', 'antioxidant_rich'],
    redFoods: ['sugar', 'carbonated drink', 'bakery products', 'vanaspati', 'deep fried', 'processed meat', 'refined flour'],
    yellowFoods: ['tomato', 'eggplant', 'potato', 'bell pepper'],
    greenFoods: ['sea fish', 'hilsha', 'salmon', 'chia seeds', 'flaxseeds', 'turmeric', 'ginger', 'extra virgin olive oil', 'green tea'],
    macroAdjustment: {
      carb_pct_range: [35, 45],
      protein_g_per_kg: [1.2, 1.5],
      fat_pct_range: [35, 40]
    },
    mealTimingRules: [
      {
        rule_bn: "সন্ধ্যা ৮টার মধ্যে রাতের খাবার সম্পন্ন করে ১২-১৪ ঘণ্টার স্বাভাবিক নৈশ উপবাস রক্ষা করুন যা সিস্টেমিক প্রদাহ কমাতে সহায়ক।",
        rule_en: "Maintain an overnight anti-inflammatory fast of 12-14 hours to modulate circulating inflammatory cytokine peaks."
      }
    ],
    clinicalRationaleBn: "রিফাইন্ড চিনি ও ট্রান্স ফ্যাট প্রো-ইনফ্ল্যামেটরি সাইটোকাইন ও জয়েন্টের প্রদাহ বহুগুণ বাড়িয়ে দেয়।",
    clinicalRationaleEn: "Excess refined carbohydrates and trans-fatty acids upregulate NF-kB and COX-2 enzymatic expression, exacerbating synovial hypervascularity."
  },

  psoriasis_metabolic_skin: {
    id: 'psoriasis_metabolic_skin',
    name_en: "Psoriasis / Th17 Metabolic Skin Inflammation",
    name_bn: "সোরিয়াসিস / অটোইমিউন ত্বকের দীর্ঘস্থায়ী প্রদাহ",
    clinical_summary_en: "Hyperproliferation of keratinocytes driven by the IL-23/IL-17 immune axis, often linked with metabolic endotoxemia and impaired gut barrier. Protocol targets gut-skin axis healing, antioxidant sufficiency, and elimination of pro-inflammatory triggers.",
    clinical_summary_bn: "ত্বকের কেরাটিনোসাইট অতিরিক্ত বৃদ্ধি ও ত্বকে খসখসে লাল স্তর সৃষ্টি। অন্ত্রের দেয়াল নিরাময়, বিষাক্ত টক্সিন দূরীকরণ ও প্রদাহরোধী পথ্য আবশ্যক।",
    redTags: ['high_fructose', 'high_sodium_processed', 'trans_fat', 'contains_gluten'],
    yellowTags: ['solanaceae_nightshade', 'dairy_casein'],
    greenTags: ['anti_inflammatory', 'gut_healing', 'liver_detox', 'antioxidant_rich'],
    redFoods: ['alcohol', 'refined sugar', 'junk food', 'processed food', 'fried snacks', 'sweetmeat', 'bakery products'],
    yellowFoods: ['cow milk', 'paneer', 'tomato', 'potato'],
    greenFoods: ['wild fish', 'pumpkin seeds', 'green leafy vegetables', 'papaya', 'turmeric', 'virgin coconut oil', 'beetroot'],
    macroAdjustment: {
      carb_pct_range: [35, 45],
      protein_g_per_kg: [1.2, 1.4],
      fat_pct_range: [35, 40]
    },
    mealTimingRules: [
      {
        rule_bn: "পর্যাপ্ত পানি ও অ্যান্টিঅক্সিডেন্টযুক্ত সবুজ শাকসবজি দিনে পর্যাপ্ত পরিমাণে গ্রহণ করুন এবং গভীর রাতে ভারী খাবার এড়িয়ে চলুন।",
        rule_en: "Ensure adequate daytime hydration and antioxidant load while avoiding nocturnal heavy eating to lower systemic oxidative stress."
      }
    ],
    clinicalRationaleBn: "অন্ত্রে মাইক্রোবিয়াল ভারসাম্যহীনতা ত্বকে এন্ডোটক্সিন ছড়িয়ে সোরিয়াসিসের প্রলেপকে দ্রুত বৃদ্ধি করে।",
    clinicalRationaleEn: "Circulating lipopolysaccharides (LPS) crossing a permeable gut barrier activate dermal dendritic cells, triggering IL-23 and IL-17 cascades."
  },

  celiac_gluten_sensitivity: {
    id: 'celiac_gluten_sensitivity',
    name_en: "Celiac Disease & Gluten Enteropathy",
    name_bn: "সিলিয়াক ডিজিজ ও গ্লুটেন সংবেদনশীলতা",
    clinical_summary_en: "Autoimmune enteropathy triggered by dietary gluten ingestion, precipitating small intestinal mucosal villous blunting and malabsorption. Protocol mandates absolute lifetime elimination of all gluten-containing grains.",
    clinical_summary_bn: "খাদ্যে গ্লুটেন উপস্থিতির কারণে ক্ষুদ্রান্ত্রের মিউকোসা বিনষ্ট ও খাদ্য শোষণহীনতা। ১০০% সম্পূর্ণ গ্লুটেনমুক্ত খাদ্যাভ্যাস বাধ্যতামূলক।",
    redTags: ['contains_gluten'],
    yellowTags: ['cross_reactive_grain', 'dairy_lactose'],
    greenTags: ['gluten_free', 'gut_healing', 'anti_inflammatory', 'nutrient_dense'],
    redFoods: ['wheat', 'atta', 'maida', 'suji', 'barley', 'rye', 'bread', 'roti', 'paratha', 'biscuit', 'cake', 'chanachur', 'semolina', 'noodles', 'pasta'],
    yellowFoods: ['commercial oats', 'corn flakes', 'processed cheese'],
    greenFoods: ['red rice', 'white rice', 'brown rice', 'quinoa', 'potatoes', 'green banana', 'papaya', 'eggs', 'fresh fish', 'lentils', 'vegetables'],
    macroAdjustment: {
      carb_pct_range: [40, 50],
      protein_g_per_kg: [1.2, 1.5],
      fat_pct_range: [30, 35]
    },
    mealTimingRules: [
      {
        rule_bn: "রান্নাঘর ও থালাবাসনে যেন গ্লুটেন বা গমের সামান্যতম ক্রস-কন্টামিনেশন না ঘটে তা নিশ্চিত করুন।",
        rule_en: "Maintain strict non-cross-contaminated preparation surfaces and utensils to eliminate micro-trace gluten exposure."
      }
    ],
    clinicalRationaleBn: "গমের গ্লুটেনের ফ্র্যাকশন গ্লিয়াডিন টিস্যু ট্রান্সগ্লুটামিনেজ এনজাইমের সাথে যুক্ত হয়ে অটোইমিউন প্রতিক্রিয়ায় ক্ষুদ্রান্ত্রের ভিলাই ধ্বংস করে।",
    clinicalRationaleEn: "Gliadin deamidation by tissue transglutaminase (tTG) triggers CD4+ T-cell activation, resulting in architectural villous blunting and crypt hyperplasia."
  },

  ckd_stage_1_3b: {
    id: 'ckd_stage_1_3b',
    name_en: "Chronic Kidney Disease (Stages 1–3b)",
    name_bn: "ক্রনিক কিডনি ডিজিজ / দীর্ঘস্থায়ী কিডনি রোগ (ধাপ ১–৩বি)",
    clinical_summary_en: "Progressive reduction in functional nephron mass (eGFR 30–89 mL/min). Clinical nutrition focuses on titrating protein to avoid glomerular hyperfiltration, sodium restriction (<2000 mg/day), and avoiding hidden phosphorus additives.",
    clinical_summary_bn: "কিডনির ফিল্ট্রেশন ক্ষমতা হ্রাস (ই-জিএফআর ৩০–৮৯)। প্রোটিন পরিমিতকরণ (০.৬–০.৮ গ্রাম/কেজি), লবণ নিয়ন্ত্রণ এবং অতিরিক্ত অজৈব ফসফেট বর্জন অপরিহার্য।",
    redTags: ['high_sodium_processed', 'inorganic_phosphate_additive'],
    yellowTags: ['high_potassium', 'high_protein', 'high_purine'],
    greenTags: ['renal_protective', 'anti_inflammatory', 'low_sodium'],
    redFoods: ['processed meat', 'packaged soup', 'salty snacks', 'instant noodles', 'baking powder', 'carbonated beverage', 'canned foods'],
    yellowFoods: ['red meat', 'beef', 'mutton', 'banana', 'coconut water', 'spinach', 'dates'],
    greenFoods: ['bottle gourd', 'pointed gourd', 'ridge gourd', 'papaya', 'ash gourd', 'egg white', 'freshwater small fish', 'cauliflower', 'white rice'],
    macroAdjustment: {
      carb_pct_range: [45, 55],
      protein_g_per_kg: [0.6, 0.8],
      fat_pct_range: [30, 35]
    },
    mealTimingRules: [
      {
        rule_bn: "দৈনিক প্রোটিনের পরিমাণ নির্দিষ্ট গ্রাম হিসেবে মেপে ভাগ করে খান, যাতে একসাথে কিডনির ওপর অতিরিক্ত নাইট্রোজেনাস লোড না পড়ে।",
        rule_en: "Distribute daily titrated protein evenly across daytime meals to prevent transient glomerular hyperfiltration spikes."
      },
      {
        rule_bn: "লবণ দৈনিক ৫ গ্রামের নিচে (সোডিয়াম ২০০০ মিগ্রা এর কম) সীমাবদ্ধ রাখুন এবং কাঁচা লবণ সম্পূর্ণরূপে বাদ দিন।",
        rule_en: "Strictly restrict total elemental sodium intake to below 2000 mg/day (under 5g total table salt equivalent)."
      }
    ],
    clinicalRationaleBn: "অতিরিক্ত প্রোটিন অবশিষ্ট কার্যকর নেফ্রনগুলোর ওপর ইন্ট্রাগ্লোমেরুলার প্রেশার ও হাইপারফিল্ট্রেশন ইনজুরি বাড়িয়ে দ্রুত কিডনি নষ্ট করে।",
    clinicalRationaleEn: "Excessive nitrogenous substrate elevates intraglomerular capillary hydrostatic pressure, accelerating focal segmental sclerosis of remnant nephrons."
  },

  nephrolithiasis_hyperoxaluria: {
    id: 'nephrolithiasis_hyperoxaluria',
    name_en: "Nephrolithiasis / Calcium Oxalate Stones",
    name_bn: "কিডনিতে পাথর / ক্যালসিয়াম অক্সালেট নেফ্রোলিথিয়াসিস",
    clinical_summary_en: "Supersaturation of calcium oxalate in renal tubules driven by dietary oxalates, hypocitraturia, and low fluid volume. Nutrition focuses on low-oxalate foods (<50mg/day), dietary calcium-oxalate intestinal pairing, and urinary alkalinization with citrates.",
    clinical_summary_bn: "মূত্রে অতিরিক্ত অক্সালেট ও ক্যালসিয়াম জমে পাথর তৈরি। খাবারে উচ্চ-অক্সালেট বর্জন, পর্যাপ্ত তরল গ্রহণ ও সাইট্রেট সমৃদ্ধ খাদ্য আবশ্যক।",
    redTags: ['high_oxalate', 'high_sodium_processed'],
    yellowTags: ['medium_oxalate', 'high_purine'],
    greenTags: ['low_oxalate', 'citrate_rich', 'renal_protective'],
    redFoods: ['spinach', 'palak', 'beetroot', 'star fruit', 'kamranga', 'cashew nuts', 'almonds', 'dark chocolate', 'cocoa', 'black tea high', 'sweet potato'],
    yellowFoods: ['lady finger', 'okra', 'carrots', 'green beans', 'lentils'],
    greenFoods: ['bottle gourd', 'cucumber', 'lemon water', 'fresh lime', 'cauliflower', 'cabbage', 'egg', 'fish', 'rice', 'milk with meals'],
    macroAdjustment: {
      carb_pct_range: [45, 55],
      protein_g_per_kg: [1.0, 1.2],
      fat_pct_range: [30, 35]
    },
    mealTimingRules: [
      {
        rule_bn: "দিনে অন্তত ২.৫ থেকে ৩ লিটার বিশুদ্ধ পানি ও লেবুর পানি সমান ব্যবধানে গ্রহণ করুন যাতে মূত্র হালকা ও স্বচ্ছ থাকে।",
        rule_en: "Maintain continuous fluid intake of 2.5-3.0 liters/day across waking hours to ensure urinary volume > 2.0 L/day."
      },
      {
        rule_bn: "অক্সালেটযুক্ত খাবার খাওয়ার সময় সাথে ক্যালসিয়ামযুক্ত খাবার (যেমন দুধ বা দই) একসাথে গ্রহণ করুন যাতে অন্ত্রেই অক্সালেট আবদ্ধ হয়।",
        rule_en: "Co-ingest dietary calcium alongside meals containing oxalate to precipitate insoluble calcium oxalate within the gut lumen."
      }
    ],
    clinicalRationaleBn: "অন্ত্রে মুক্ত অক্সালেট সহজেই রক্তে শোষিত হয়ে কিডনির রেনাল টিউবুলে ক্যালসিয়ামের সাথে মিলে পাথর সৃষ্টি করে। খাবার সাথে ক্যালসিয়াম খেলে অক্সালেট মলের সাথে বেরিয়ে যায়।",
    clinicalRationaleEn: "Unbound intestinal oxalate is readily absorbed in the colon and filtered by the glomeruli; tubular supersaturation exceeding the crystallization threshold drives stone formation."
  },

  hpa_axis_burnout: {
    id: 'hpa_axis_burnout',
    name_en: "HPA-Axis Dysregulation & Neuro-Adrenal Burnout",
    name_bn: "এইচপিএ-অ্যাক্সিস ডিজরেগুলেশন ও অ্যাড্রেনাল নার্ভাস ক্লান্তি",
    clinical_summary_en: "Impaired hypothalamic-pituitary-adrenal negative feedback loop, blunted diurnal cortisol curve, and autonomic nervous system exhaustion. Protocol emphasizes glycemic stabilization to prevent hypoglycemic adrenaline surges, electrolyte repletion, and adaptogenic support.",
    clinical_summary_bn: "দীর্ঘস্থায়ী মানসিক ও শারীরিক চাপে কর্টিসল হরমোনের ভারসাম্যহীনতা ও শারীরিক অবসাদ। ব্লাড সুগার স্থিতিশীল রাখা, লবণ-ইলেক্ট্রোলাইট ভারসাম্য ও নার্ভ রিল্যাক্সেশন আবশ্যক।",
    redTags: ['high_fructose', 'caffeine_stimulant', 'high_sodium_processed'],
    yellowTags: ['refined_carbs'],
    greenTags: ['adaptogenic_support', 'anti_inflammatory', 'adrenal_support', 'magnesium_rich'],
    redFoods: ['energy drinks', 'excessive black coffee', 'refined sugar', 'processed pastries', 'alcohol', 'sugary breakfast cereal'],
    yellowFoods: ['white bread', 'white rice solo', 'sweet fruits on empty stomach'],
    greenFoods: ['unrefined sea salt', 'pumpkin seeds', 'avocado', 'eggs', 'whole chicken', 'bone broth', 'coconut water with salt', 'chia seeds', 'green tea mild'],
    macroAdjustment: {
      carb_pct_range: [35, 45],
      protein_g_per_kg: [1.2, 1.5],
      fat_pct_range: [35, 40]
    },
    mealTimingRules: [
      {
        rule_bn: "ঘুম থেকে ওঠার ১ ঘণ্টার মধ্যে প্রোটিনযুক্ত সকালের নাশতা গ্রহণ করুন এবং দীর্ঘ সময় না খেয়ে থাকা পরিহার করুন।",
        rule_en: "Consume a protein-anchored breakfast within 60 minutes of waking to stabilize the diurnal cortisol awakening response."
      },
      {
        rule_bn: "বিকেল ৩টার পর ক্যাফেইন বা কড়া চা-কফি পরিহার করুন এবং দীর্ঘ উপবাস (১৪ ঘণ্টার বেশি) এড়িয়ে চলুন।",
        rule_en: "Strictly avoid caffeine past 3:00 PM and cap fasting at 14 hours to prevent reactive nocturnal hypoglycemia."
      }
    ],
    clinicalRationaleBn: "খাবার দেরিতে খেলে বা রক্তে গ্লুকোজ কমে গেলে ক্লান্ত অ্যাড্রেনাল গ্রন্থিকে কর্টিসল ও অ্যাড্রেনালিন ক্ষরণ করতে হয়, যা নার্ভাস সিস্টেমকে আরও দুর্বল করে।",
    clinicalRationaleEn: "Hypoglycemic episodes provoke counter-regulatory surges of epinephrine and cortisol, driving recurrent HPA-axis hyper-activation and exhaustion."
  },

  migraine_neurovascular: {
    id: 'migraine_neurovascular',
    name_en: "Migraine & Neurovascular Hyperexcitability",
    name_bn: "মাইগ্রেন / নিউরোভাসকুলার স্নায়বিক মাথাব্যথা",
    clinical_summary_en: "Cortical spreading depression, trigeminovascular complex hyperreactivity, and neurogenic mast cell degranulation. Dietary strategy focuses on eliminating vasoactive aminergic triggers (tyramine, histamine, phenylethylamine), artificial sweeteners, and MSG.",
    clinical_summary_bn: "মস্তিষ্কের রক্তনালী ও স্নায়ুর সংবেদনশীলতার কারণে তীব্র একপাশের মাথাব্যথা। খাবারে টাইরামিন, হিস্টামিন, কৃত্রিম মিষ্টি ও টেস্টিং সল্ট পরিহার প্রধান পথ্য।",
    redTags: ['high_histamine', 'tyramine_rich', 'artificial_sweetener', 'msg_nitrites'],
    yellowTags: ['fermented_high', 'citrus_excess'],
    greenTags: ['anti_inflammatory', 'magnesium_rich', 'neuroprotective', 'low_histamine'],
    redFoods: ['aged cheese', 'parmesan', 'shutki', 'cured sausages', 'soy sauce', 'msg', 'tasting salt', 'aspartame', 'diet soda', 'red wine', 'dark chocolate excess'],
    yellowFoods: ['oranges', 'lemons', 'tomatoes', 'fermented pickles'],
    greenFoods: ['fresh chicken', 'fresh ruhi fish', 'boiled rice', 'fresh vegetables', 'bottle gourd', 'cucumber', 'pumpkin seeds', 'coconut water', 'ginger tea'],
    macroAdjustment: {
      carb_pct_range: [35, 45],
      protein_g_per_kg: [1.2, 1.4],
      fat_pct_range: [35, 40]
    },
    mealTimingRules: [
      {
        rule_bn: "কোনো মূল বেলার খাবার বাদ দেবেন না; খাবার বাদ দেওয়া বা হাইপোগ্লাইসেমিয়া মাইগ্রেন ব্যথার প্রধান উদ্দীপক।",
        rule_en: "Never skip scheduled daytime meals; fasting hypoglycemia is a potent trigger of neurogenic trigeminal activation."
      },
      {
        rule_bn: "মাথাব্যথার অনুভূতি শুরু হলে তাৎক্ষণিক আদা চা এবং ম্যাগনেসিয়াম সমৃদ্ধ খাবার বা পানি গ্রহণ করুন।",
        rule_en: "Incorporate fresh ginger infusions at the earliest aura symptoms to suppress 5-HT neurogenic vasodilation."
      }
    ],
    clinicalRationaleBn: "পুরোনো বা গাঁজন করা খাবারের টাইরামিন ও হিস্টামিন মস্তিষ্কের সংবেদনশীল রক্তনালীকে হঠাৎ প্রসারিত ও প্রদাহযুক্ত করে তীব্র মাইগ্রেন ট্রিগার করে।",
    clinicalRationaleEn: "Dietary tyramine displaces norepinephrine into synaptic clefts while exogenous histamines trigger cranial extravasation via H1/H3 receptor pathways."
  },

  insomnia_circadian_disruption: {
    id: 'insomnia_circadian_disruption',
    name_en: "Insomnia & Circadian Sleep Disruption",
    name_bn: "অনিদ্রা / জৈবিক ঘড়ি ও সারকাডিয়ান ছন্দহীনতা",
    clinical_summary_en: "Disrupted suprachiasmatic nucleus signaling, nocturnal hypercortisolemia, and delayed melatonergic onset. Nutrition protocol emphasizes early dinner timing (3-4h prior to sleep), tryptophan-rich precursors, and eliminating evening sympathomimetic stimulants.",
    clinical_summary_bn: "ঘুমের চক্র ব্যাহত হওয়া ও রাতে দেরিতে ঘুম আসা। ঘুমানোর ৩-৪ ঘণ্টা আগে রাতের খাবার শেষ করা, ক্যাফেইন বর্জন এবং মেলাটোনিন সহায়ক পথ্য প্রদান জরুরি।",
    redTags: ['caffeine_stimulant', 'high_fructose', 'high_sodium_processed'],
    yellowTags: ['late_night_carbs'],
    greenTags: ['tryptophan_rich', 'magnesium_rich', 'circadian_align', 'neuroprotective'],
    redFoods: ['coffee after 2pm', 'strong tea evening', 'energy drinks', 'heavy greasy late dinner', 'sweets before bed', 'chocolate'],
    yellowFoods: ['high fat red meat late night', 'spicy curry'],
    greenFoods: ['warm milk with nutmeg', 'chamomile tea', 'pumpkin seeds', 'ripe banana in evening', 'oats', 'pure honey small drip', 'boiled egg yolk', 'almonds'],
    macroAdjustment: {
      carb_pct_range: [40, 50],
      protein_g_per_kg: [1.1, 1.3],
      fat_pct_range: [30, 35]
    },
    mealTimingRules: [
      {
        rule_bn: "ঘুমাতে যাওয়ার অন্তত ৩ থেকে ৪ ঘণ্টা পূর্বে রাতের আহার শেষ করুন এবং শোবার আগে অতিরিক্ত পানি পান থেকে বিরত থাকুন।",
        rule_en: "Finish the final meal at least 3-4 hours prior to scheduled sleep onset to allow core body temperature down-regulation."
      },
      {
        rule_bn: "সন্ধ্যা বা রাতে কোনো প্রকার চা, কফি বা এনার্জি ড্রিংক সম্পূর্ণভাবে বর্জন করুন।",
        rule_en: "Eliminate all caffeinated beverages and stimulants after 2:00 PM to protect nocturnal adenosine receptors."
      }
    ],
    clinicalRationaleBn: "ঘুমানোর ঠিক আগে খাবার খেলে পেটে রক্ত সঞ্চালন ও মেটাবলিক তাপ বাড়ে, যা মস্তিষ্কের স্লিপ সেন্টার ও মেলাটোনিন হরমোন ক্ষরণ বন্ধ করে দেয়।",
    clinicalRationaleEn: "Late nocturnal alimentary thermogenesis delays core body temperature drop, suppressing pineal melatonin synthesis and fragmenting REM sleep architecture."
  }
};

