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
  }
};

