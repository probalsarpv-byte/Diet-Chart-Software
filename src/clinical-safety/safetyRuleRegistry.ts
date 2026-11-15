/**
 * SHUDDHO FUNCTIONAL NUTRITION SOFTWARE
 * Clinical Safety Rule Registry (Phase P0 Foundation)
 * 
 * Peer-reviewed clinical safety rules for high-priority medications,
 * drug-nutrient interactions, and therapeutic timing.
 */

export interface MedicationSafetyRule {
  id: string;
  drug_class: string;
  generic_patterns: string[];
  severity: 'critical' | 'high' | 'medium';
  title_en: string;
  title_bn: string;
  explanation_en: string;
  explanation_bn: string;
  required_action_en: string;
  required_action_bn: string;
  hypoglycemia_risk?: boolean;
  fasting_contraindicated?: boolean;
  requires_carb_coordination?: boolean;
  requires_mineral_spacing_hours?: number;
  electrolyte_monitoring?: ('potassium' | 'sodium' | 'magnesium' | 'calcium' | 'phosphorus')[];
  b12_monitoring?: boolean;
  vitamin_k_consistency_mandated?: boolean;
  take_with_meals_mandated?: boolean;
  reference_guideline: string;
}

export const PRIORITY_MEDICATION_SAFETY_RULES: MedicationSafetyRule[] = [
  // ── A. Insulin Regimens ──────────────────────────────────────────
  {
    id: 'MED_INSULIN_SAFETY',
    drug_class: 'Insulin (Basal / Bolus / Premixed)',
    generic_patterns: ['insulin', 'aspart', 'lispro', 'glargine', 'detemir', 'degludec', 'isophane'],
    severity: 'critical',
    title_en: 'Insulin Regimen: Severe Hypoglycemia Risk on Carb Restriction or Meal Skipping',
    title_bn: 'ইনসুলিন থেরাপি: শর্করা হ্রাস বা খাবার বাদ দিলে মারাত্মক হাইপোগ্লাইসেমিয়ার ঝুঁকি',
    explanation_en: 'Exogenous insulin continues to lower blood glucose regardless of meal intake. Sudden carbohydrate reduction or fasting without medical insulin dose adjustment can cause life-threatening neuroglycopenic hypoglycemia.',
    explanation_bn: 'ইনসুলিন গ্রহণকারী রোগী হঠাৎ শর্করা কম খেলে বা খাবার বাদ দিলে মারাত্মক হাইপোগ্লাইসেমিয়ার সৃষ্টি হতে পারে। খাদ্যতালিকায় বড় পরিবর্তনের পূর্বে চিকিৎসকের মাধ্যমে ইনসুলিন সমন্বয় আবশ্যক।',
    required_action_en: 'Mandatory clinical review. Never adjust insulin doses automatically. Ensure consistent meal timing and minimum 30g complex carbohydrates per main meal unless under close medical supervision.',
    required_action_bn: 'চিকিৎসকের পরামর্শ ছাড়া ইনসুলিনের ডোজ নিজে পরিবর্তন করবেন না। প্রতি প্রধান খাবারে ন্যূনতম জটিল শর্করা নিশ্চিত করুন।',
    hypoglycemia_risk: true,
    fasting_contraindicated: true,
    requires_carb_coordination: true,
    reference_guideline: 'ADA Standards of Care in Diabetes 2026; Endocrine Society Hypoglycemia Guidelines'
  },

  // ── B. Sulfonylureas ─────────────────────────────────────────────
  {
    id: 'MED_SULFONYLUREA_SAFETY',
    drug_class: 'Sulfonylureas (Insulin Secretagogues)',
    generic_patterns: ['glimepiride', 'gliclazide', 'glibenclamide', 'glipizide'],
    severity: 'critical',
    title_en: 'Sulfonylurea Therapy: Fasting & Meal-Skipping Contraindication',
    title_bn: 'সালফোনিলইউরিয়া থেরাপি: উপবাস ও খাবার বাদ দেওয়া নিষিদ্ধ',
    explanation_en: 'Sulfonylureas stimulate pancreatic beta cells to secrete insulin independent of circulating glucose levels. Prolonged fasting or uncoordinated meal delays create a high risk of prolonged hypoglycemia.',
    explanation_bn: 'সালফোনিলইউরিয়া অগ্ন্যাশয় থেকে অবিরাম ইনসুলিন নিঃসরণ করায় খাবার গ্রহণে দেরি হলে বা রোজা/উপবাস রাখলে বিপজ্জনক হাইপোগ্লাইসেমিয়া হতে পারে।',
    required_action_en: 'Prolonged fasting (>12h) is contraindicated without medical dose tapering. Maintain regular meal schedules.',
    required_action_bn: 'চিকিৎসকের পরামর্শ ছাড়া দীর্ঘ উপবাস (>১২ ঘণ্টা) সম্পূর্ণ নিষিদ্ধ। নিয়মিত সময়ে খাবার গ্রহণ করুন।',
    hypoglycemia_risk: true,
    fasting_contraindicated: true,
    requires_carb_coordination: true,
    reference_guideline: 'IDF-DAR Practical Guidelines for Diabetes in Ramadan 2024'
  },

  // ── C. SGLT2 Inhibitors ──────────────────────────────────────────
  {
    id: 'MED_SGLT2_SAFETY',
    drug_class: 'SGLT2 Inhibitors',
    generic_patterns: ['dapagliflozin', 'empagliflozin', 'canagliflozin'],
    severity: 'high',
    title_en: 'SGLT2 Inhibitor: Euglycemic DKA & Dehydration Risk on Ketogenic Diet / Fasting',
    title_bn: 'এসজিএলটি২ ইনহিবিটর: কিটোজেনিক ডায়েট বা পানিশূন্যতায় ইউগ্লাইসেমিক ডিকেএ ঝুঁকি',
    explanation_en: 'SGLT2 inhibitors promote glucosuria and increase glucagon-to-insulin ratios. Severe carbohydrate restriction (<50g/day) or dehydration during fasting can precipitate fatal euglycemic ketoacidosis.',
    explanation_bn: 'এসজিএলটি২ ইনহিবিটর রক্তে স্বাভাবিক গ্লুকোজেও প্রাণঘাতী কিটোঅ্যাসিডোসিস (eDKA) তৈরি করতে পারে যদি কার্বোহাইড্রেট খুব বেশি কমানো হয় বা শরীরে পানির ঘাটতি হয়।',
    required_action_en: 'Do not prescribe ketogenic or very-low-carb diets. Ensure adequate hydration (minimum 2.5L unless restricted). Suspend during acute illness per sick-day rules.',
    required_action_bn: 'খুব কম কার্ব বা কিটো ডায়েট পরিহার করুন। পর্যাপ্ত পানি পান নিশ্চিত করুন। অসুস্থতার দিনে ওষুধ নিয়ম মেনে চিকিৎসকের পরামর্শে সাময়িক স্থগিত রাখুন।',
    fasting_contraindicated: true,
    reference_guideline: 'FDA Drug Safety Communication: SGLT2 Inhibitors and Ketoacidosis'
  },

  // ── D. GLP-1 Receptor Agonists ───────────────────────────────────
  {
    id: 'MED_GLP1_SAFETY',
    drug_class: 'GLP-1 Receptor Agonists',
    generic_patterns: ['semaglutide', 'liraglutide', 'dulaglutide', 'tirzepatide'],
    severity: 'medium',
    title_en: 'GLP-1 RA: Sarcopenia & Malnutrition Risk via Severe Appetite Suppression',
    title_bn: 'জিএলপি-১ রিসেপ্টর অ্যাগনিস্ট: অতিরিক্ত ক্ষুধা হ্রাসের কারণে মাংসপেশি হ্রাস ও পুষ্টিহীনতা',
    explanation_en: 'Marked delayed gastric emptying and central satiety can cause drastic caloric deficits with inadequate protein intake, leading to muscle wasting (sarcopenia) and micronutrient malabsorption.',
    explanation_bn: 'জিএলপি-১ ওষুধ পাকস্থলী খালি হওয়া ধীর করে ও ক্ষুধা অতিরিক্ত কমিয়ে দেয়। পর্যাপ্ত প্রোটিন না খেলে মাংসপেশি ক্ষয় ও পুষ্টিহীনতা দেখা দেয়।',
    required_action_en: 'Prioritize protein density (minimum 1.2–1.5 g/kg ideal body weight). Recommend small, frequent nutrient-dense meals.',
    required_action_bn: 'প্রতিটি খাবারে পর্যাপ্ত প্রোটিন নিশ্চিত করুন। দিনে ছোট ছোট পুষ্টিকর খাবার গ্রহণ করুন।',
    reference_guideline: 'ESPEN Guidelines on Clinical Nutrition and Metabolic Care'
  },

  // ── E. Metformin ─────────────────────────────────────────────────
  {
    id: 'MED_METFORMIN_SAFETY',
    drug_class: 'Biguanides',
    generic_patterns: ['metformin'],
    severity: 'medium',
    title_en: 'Metformin: Gastrointestinal Tolerance & Long-Term B12 Depletion',
    title_bn: 'মেটফর্মিন: গ্যাস্ট্রোইন্টেস্টাইনাল সহনশীলতা ও ভিটামিন বি১২ এর ঘাটতি',
    explanation_en: 'Metformin interferes with calcium-dependent B12-intrinsic factor absorption in the terminal ileum. Also causes transient nausea and osmotic diarrhea if taken on an empty stomach.',
    explanation_bn: 'মেটফর্মিন দীর্ঘদিন সেবনে অন্ত্রে ভিটামিন বি১২ শোষণ ব্যাহত হয় এবং খালি পেটে সেবনে বমি ভাব ও পাতলা পায়খানা হতে পারে।',
    required_action_en: 'Always administer with or immediately following main meals. Monitor serum B12 annually and supplement active methylcobalamin if deficient.',
    required_action_bn: 'সর্বদা খাবারের সাথে বা খাবারের ঠিক পরে সেবন করুন। নিয়মিত ভিটামিন বি১২ মাত্রা পরীক্ষা করুন।',
    b12_monitoring: true,
    take_with_meals_mandated: true,
    reference_guideline: 'ADA Standards of Medical Care in Diabetes: Metformin and Vitamin B12 Deficiency'
  },

  // ── F. Diuretics ─────────────────────────────────────────────────
  {
    id: 'MED_DIURETICS_SAFETY',
    drug_class: 'Loop and Thiazide Diuretics',
    generic_patterns: ['furosemide', 'frusemide', 'hydrochlorothiazide', 'indapamide', 'torsemide'],
    severity: 'high',
    title_en: 'Diuretic Therapy: Electrolyte Wasting (Potassium, Magnesium, Sodium) & Fluid Balance',
    title_bn: 'ডাইইউরেটিক থেরাপি: পটাসিয়াম, ম্যাগনেসিয়াম ও সোডিয়াম ক্ষয় এবং পানির ভারসাম্য',
    explanation_en: 'Loop and thiazide diuretics cause substantial urinary excretion of potassium and magnesium, increasing the risk of cardiac arrhythmias, cramps, and postural hypotension.',
    explanation_bn: 'ডাইইউরেটিক ওষুধ প্রস্রাবের মাধ্যমে শরীর থেকে পটাসিয়াম ও ম্যাগনেসিয়াম বের করে দেয়, যা পেশিতে টান ও হৃদস্পন্দনের সমস্যা তৈরি করতে পারে।',
    required_action_en: 'Monitor serum electrolytes. Encourage potassium/magnesium-rich foods (unless renal failure coexists). Reconcile with prescribed fluid limits.',
    required_action_bn: 'নিয়মিত সিরাম ইলেক্ট্রোলাইট পরীক্ষা করুন। কিডনি সমস্যা না থাকলে পটাসিয়াম ও ম্যাগনেসিয়ামযুক্ত খাবার গ্রহণে জোর দিন।',
    electrolyte_monitoring: ['potassium', 'magnesium', 'sodium'],
    reference_guideline: 'AHA/ACC Heart Failure Management Guidelines'
  },

  // ── G. ACE Inhibitors, ARBs & MRAs ───────────────────────────────
  {
    id: 'MED_RAAS_POTASSIUM_SAFETY',
    drug_class: 'RAAS Blockers & Potassium-Sparing Agents',
    generic_patterns: ['lisinopril', 'enalapril', 'ramipril', 'losartan', 'valsartan', 'telmisartan', 'spironolactone', 'eplerenone'],
    severity: 'critical',
    title_en: 'RAAS Inhibitors & MRAs: Hyperkalemia Risk with Potassium Salt Substitutes / High-Potassium Foods',
    title_bn: 'রেনিন-অ্যাঞ্জিওটেনসিন ব্লকার: পটাসিয়াম লবণ ও অতিরিক্ত পটাসিয়ামে মারাত্মক হাইপারক্যালেমিয়ার ঝুঁকি',
    explanation_en: 'Inhibition of aldosterone decreases renal potassium secretion. Concomitant use of potassium chloride salt substitutes (e.g. "low sodium salt") or high potassium supplements can precipitate lethal hyperkalemic cardiac arrest.',
    explanation_bn: 'এই ওষুধগুলো কিডনি দিয়ে পটাসিয়াম নির্গমন কমিয়ে দেয়। তাই লো-সোডিয়াম সল্ট (যাতে পটাসিয়াম থাকে) বা উচ্চ পটাসিয়াম সাপ্লিমেন্ট গ্রহণে প্রাণঘাতী কার্ডিয়াক অ্যারেস্ট হতে পারে।',
    required_action_en: 'Strictly avoid potassium-based salt substitutes and potassium supplements. Maintain dietary potassium within safe clinical limits.',
    required_action_bn: 'পটাসিয়ামযুক্ত বিকল্প লবণ ও উচ্চ পটাসিয়াম সাপ্লিমেন্ট সম্পূর্ণ বর্জন করুন।',
    electrolyte_monitoring: ['potassium'],
    reference_guideline: 'KDIGO Clinical Practice Guideline for the Management of Blood Pressure in CKD'
  },

  // ── H. Anticoagulants (Warfarin) ─────────────────────────────────
  {
    id: 'MED_WARFARIN_VITK_SAFETY',
    drug_class: 'Vitamin K Antagonists',
    generic_patterns: ['warfarin'],
    severity: 'critical',
    title_en: 'Warfarin: Strict Dietary Vitamin K Consistency Mandated',
    title_bn: 'ওয়ারফারিন: খাদ্যতালিকায় ভিটামিন কে-এর স্থিরতা রক্ষা বাধ্যতামূলক',
    explanation_en: 'Warfarin acts by antagonizing vitamin K-dependent clotting factors. Sudden surges or drastic reductions in vitamin K intake (spinach, kale, broccoli, green leafy herbs) destabilize INR, causing thrombosis or catastrophic hemorrhage.',
    explanation_bn: 'ওয়ারফারিন গ্রহণের সময় হঠাৎ সবুজ শাকসবজি বাড়ানো বা কমানো যাবে না। ভিটামিন কে-এর তারতম্যে রক্ত অতিরিক্ত জমাট বাঁধতে পারে বা মারাত্মক রক্তপাত হতে পারে।',
    required_action_en: 'Maintain steady, consistent weekly consumption of green vegetables rather than complete avoidance or feast-and-famine cycles. Re-check INR upon any planned dietary change.',
    required_action_bn: 'শাকসবজি পুরোপুরি বন্ধ করবেন না, বরং সপ্তাহে একই পরিমাণে নিয়ম করে গ্রহণ করুন। খাদ্যাভ্যাস পরিবর্তনের সময় আইএনআর পরীক্ষা করুন।',
    vitamin_k_consistency_mandated: true,
    reference_guideline: 'CHEST Guideline and Expert Panel Report: Antithrombotic Therapy'
  },

  // ── I. Thyroid Hormones ──────────────────────────────────────────
  {
    id: 'MED_LEVOTHYROXINE_TIMING_SAFETY',
    drug_class: 'Thyroid Hormones',
    generic_patterns: ['levothyroxine', 'thyroxine'],
    severity: 'high',
    title_en: 'Levothyroxine: Strict Fasting Administration & 4-Hour Mineral Separation',
    title_bn: 'লেভোথাইরক্সিন: খালি পেটে সেবন এবং ক্যালসিয়াম/আয়রন থেকে ৪ ঘণ্টার ব্যবধান',
    explanation_en: 'Levothyroxine is poorly absorbed in the presence of food, dietary fiber, coffee, or polyvalent cations (calcium, iron, magnesium, aluminum antacids), which chelate the hormone in the GI tract.',
    explanation_bn: 'লেভোথাইরক্সিন খাবার, চা-কফি বা ক্যালসিয়াম/আয়রন সাপ্লিমেন্টের সাথে খেলে এর শোষণ ৭০% পর্যন্ত কমে যায়।',
    required_action_en: 'Take with a full glass of plain water upon waking, at least 30–60 minutes before breakfast. Separate all calcium, iron, and multimineral supplements by at least 4 hours.',
    required_action_bn: 'ঘুম থেকে উঠে খালি পেটে এক গ্লাস সাধারণ পানিতে সেবন করুন এবং নাশতার অন্তত ৩০–৬০ মিনিট আগে নিন। ক্যালসিয়াম ও আয়রনযুক্ত বড়ি অন্তত ৪ ঘণ্টা দূরে সেবন করুন।',
    requires_mineral_spacing_hours: 4,
    reference_guideline: 'American Thyroid Association Guidelines for Hypothyroidism'
  },

  // ── J. Phosphate Binders ─────────────────────────────────────────
  {
    id: 'MED_PHOSPHATE_BINDER_SAFETY',
    drug_class: 'Phosphate Binders',
    generic_patterns: ['sevelamer', 'calcium acetate', 'lanthanum', 'sucroferric'],
    severity: 'high',
    title_en: 'Phosphate Binders: Must Be Administered Directly With Meals',
    title_bn: 'ফসফেট বাইন্ডার: অবশ্যই প্রধান খাবারের সাথে সেবন করতে হবে',
    explanation_en: 'Phosphate binders bind dietary phosphorus in the intestinal lumen to prevent absorption in renal patients. If taken between meals, their binding efficacy is lost and systemic side effects increase.',
    explanation_bn: 'ফসফেট বাইন্ডার খাবারের ফসফেট আটকাতে কাজ করে। খাবারের সাথে না খেলে এটি কোনো কাজ করে না।',
    required_action_en: 'Administer with the first bite of each main meal and phosphorus-containing snack. Reconcile with renal phosphorus limits.',
    required_action_bn: 'প্রতিটি প্রধান খাবারের প্রথম লোকমার সাথে সেবন করুন।',
    take_with_meals_mandated: true,
    reference_guideline: 'KDIGO Clinical Practice Guideline for CKD-MBD'
  },

  // ── K. Corticosteroids ───────────────────────────────────────────
  {
    id: 'MED_CORTICOSTEROID_SAFETY',
    drug_class: 'Systemic Glucocorticoids',
    generic_patterns: ['prednisolone', 'prednisone', 'dexamethasone', 'methylprednisolone', 'hydrocortisone'],
    severity: 'high',
    title_en: 'Systemic Corticosteroids: Hyperglycemia, Sodium Retention & Bone Demineralization',
    title_bn: 'কর্টিকোস্টেরয়েড: রক্তে গ্লুকোজ বৃদ্ধি, সোডিয়াম জমা ও হাড় ক্ষয়ের ঝুঁকি',
    explanation_en: 'Glucocorticoids induce hepatic gluconeogenesis, skeletal muscle catabolism, sodium and fluid retention, and inhibit intestinal calcium absorption.',
    explanation_bn: 'স্টেরয়েড ওষুধ রক্তে সুগার বাড়ায়, শরীরে পানি ও লবণ জমিয়ে রক্তচাপ বাড়ায় এবং হাড়ের ক্যালসিয়াম ক্ষয় করে।',
    required_action_en: 'Enforce low-glycemic, low-sodium dietary structure. Ensure adequate protein, calcium, and vitamin D intake.',
    required_action_bn: 'খাবারে লবণ নিয়ন্ত্রণ করুন, মিষ্টি ও সরল শর্করা পরিহার করুন এবং পর্যাপ্ত প্রোটিন ও ক্যালসিয়াম নিশ্চিত করুন।',
    reference_guideline: 'American College of Rheumatology Guideline for Glucocorticoid-Induced Osteoporosis'
  }
];
