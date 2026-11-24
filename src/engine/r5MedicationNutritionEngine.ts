/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Phase R5: Comprehensive Evidence-Governed Medication-Nutrition Rule Engine
 * 
 * Clinical Rule Registry covering:
 * - Diabetes & Endocrine: Insulin, Sulfonylurea, Metformin, SGLT2i, GLP-1, Corticosteroids, Thyroid
 * - Cardiovascular & Renal: Warfarin, DOACs, Statins, ACEi/ARBs, Diuretics (Loop/Thiazide/K-sparing)
 * - Psychiatric & Neurological: MAOIs (tyramine), Lithium (Na/fluid), Antipsychotics (metabolic),
 *   SSRIs/SNRIs, Antiepileptics (Valproate/Carbamazepine), Stimulants (appetite/growth)
 * - Gastrointestinal: PPIs, H2 blockers
 * - Antimicrobial & Immune: Fluoroquinolones, Tetracyclines, Isoniazid (B6), Methotrexate (Folate)
 * - Bone Health: Bisphosphonates (Alendronate)
 */

import { MedicationNutritionRule, DrugNutrientFinding, R5MedicationRecord } from '@/types/r5Systems';
import { PatientProfile } from '@/types';

export const MEDICATION_NUTRITION_RULES: MedicationNutritionRule[] = [
  // ── 1. Diabetes & Endocrine ───────────────────────────────────────
  {
    rule_id: 'RULE_INSULIN_CARB_TIMING',
    drug_category: 'diabetes_endocrine',
    generic_patterns: ['insulin', 'insulin aspart', 'insulin lispro', 'insulin glargine', 'insulin detemir', 'insulin degludec'],
    severity: 'critical_hard_stop',
    title_en: 'Insulin Administration & Hypoglycemia Safeguard',
    title_bn: 'ইনসুলিন গ্রহণ ও বিপজ্জনক হাইপোগ্লাইসেমিয়া সুরক্ষা',
    trigger_criteria_en: 'Active prescription of exogenous basal, bolus, or premixed insulin.',
    trigger_criteria_bn: 'রোগীর সক্রিয় ইনসুলিন প্রেসক্রিপশন বিদ্যমান।',
    nutritional_consequence_en: 'Severe neuroglycopenic hypoglycemia risk if meals are skipped, delayed, or devoid of planned carbohydrates.',
    nutritional_consequence_bn: 'খাবার বাদ দিলে বা শর্করাবিহীন রাখলে রক্তে গ্লুকোজ অতিরিক্ত কমে গিয়ে বিপজ্জনক হাইপোগ্লাইসেমিয়া ও জ্ঞান হারানোর ঝুঁকি থাকে।',
    mechanism_rationale_en: 'Exogenous insulin continues to promote intracellular glucose uptake irrespective of systemic euglycemia, precipitating rapid hypoglycemia without oral glucose replenishment.',
    mechanism_rationale_bn: 'শরীরে ইনসুলিন উপস্থিত থাকলে তা গ্লুকোজ কোষে প্রবেশ করাতে থাকে; সময়মতো খাবার না খেলে রক্তে চিনি বিপজ্জনকভাবে কমে যায়।',
    evidence_source: 'ADA Standards of Care in Diabetes (2026); Endocrine Society Clinical Practice Guidelines.',
    revision_date: '2026-11-24',
    required_action_en: 'Mandate 15-20g fast-acting carbohydrates (glucose tablets/juice) on hand. Strictly forbid unmonitored prolonged fasting (>14h). Align meal timing with insulin peak pharmacokinetics.',
    required_action_bn: 'সর্বদা ১৫-২০ গ্রাম দ্রুত কার্যকর গ্লুকোজ সাথে রাখুন। দীর্ঘক্ষণ না খেয়ে থাকা (১৪ ঘণ্টার বেশি ফাস্টিং) সম্পূর্ণ নিষিদ্ধ। ইনসুলিন নেওয়ার নির্দিষ্ট সময়ের মধ্যে সুষম খাবার গ্রহণ নিশ্চিত করুন।'
  },
  {
    rule_id: 'RULE_SULFONYLUREA_FASTING',
    drug_category: 'diabetes_endocrine',
    generic_patterns: ['glimepiride', 'gliclazide', 'glibenclamide', 'glipizide'],
    severity: 'critical_hard_stop',
    title_en: 'Sulfonylurea Meal Synchronization & Fasting Warning',
    title_bn: 'সালফোনিলইউরিয়া ওষুধ ও উপবাসকালীন সতর্কতা',
    trigger_criteria_en: 'Active prescription of sulfonylurea insulin secretagogues.',
    trigger_criteria_bn: 'সালফোনিলইউরিয়া জাতীয় ডায়াবেটিস ওষুধ সেবনরত।',
    nutritional_consequence_en: 'Prolonged insulin secretion independent of glucose levels; high hypoglycemia risk if carbohydrate intake is erratic or delayed.',
    nutritional_consequence_bn: 'অগ্ন্যাশয় থেকে অনবরত ইনসুলিন নিঃসৃত হওয়ায় দীর্ঘক্ষণ না খেয়ে থাকলে বিপজ্জনক হাইপোগ্লাইসেমিয়া হতে পারে।',
    evidence_source: 'ADA Pharmacologic Approaches to Glycemic Treatment (2025).',
    revision_date: '2026-11-24',
    mechanism_rationale_en: 'Sulfonylureas close ATP-sensitive K+ channels in pancreatic beta cells, triggering calcium influx and continuous insulin exocytosis.',
    mechanism_rationale_bn: 'ওষুধটি বিটা কোষ থেকে অনবরত ইনসুলিন নিঃসরণ বৃদ্ধি করে।',
    required_action_en: 'Ensure meals with predictable complex carbohydrates within 30 minutes of dosing. Intermittent fasting protocols require prescribing physician dosage reduction.',
    required_action_bn: 'ওষুধ গ্রহণের ৩০ মিনিটের মধ্যে জটিল শর্করাযুক্ত সুষম খাবার গ্রহণ করুন। ফাস্টিং শুরু করার পূর্বে চিকিৎসকের পরামর্শে ওষুধের মাত্রা সমন্বয় করুন।'
  },
  {
    rule_id: 'RULE_METFORMIN_B12_DEPLETION',
    drug_category: 'diabetes_endocrine',
    generic_patterns: ['metformin', 'metformin hydrochloride'],
    severity: 'high_clinical_review',
    title_en: 'Metformin-Induced Vitamin B12 Malabsorption',
    title_bn: 'মেটফর্মিন জনিত ভিটামিন বি১২ ঘাটতি ঝুঁকি',
    trigger_criteria_en: 'Metformin therapy for >4 months, particularly at doses >= 1000 mg/day.',
    trigger_criteria_bn: '৪ মাসের অধিক সময় ধরে মেটফর্মিন সেবন (বিশেষত ১০০০ মিগ্রা বা তদূর্ধ্ব)।',
    nutritional_consequence_en: 'Progressive reduction in serum cyanocobalamin/methylcobalamin; potential peripheral neuropathy, macrocytic anemia, and elevated homocysteine.',
    nutritional_consequence_bn: 'শরীরে ভিটামিন বি১২ শোষণ কমে যায়, যার ফলে হাত-পায়ে অবশ ভাব, রক্তশূন্যতা এবং হোমোসিস্টিন বৃদ্ধি পেতে পারে।',
    evidence_source: 'ADA Standards of Care; de Jager et al., BMJ (Long-term metformin and B12 deficiency).',
    revision_date: '2026-11-24',
    mechanism_rationale_en: 'Metformin antagonizes calcium-dependent membrane binding of the intrinsic factor-B12 complex to cubilin receptors in the terminal ileum.',
    mechanism_rationale_bn: 'মেটফর্মিন অন্ত্রের শেষ প্রান্তে ক্যালসিয়াম নির্ভর ভিটামিন বি১২ শোষণে বাধা প্রদান করে।',
    required_action_en: 'Assess serum Vitamin B12 and methylmalonic acid annually. Consider bioactive sublingual/oral Methylcobalamin (1000 mcg/day) or dietary B12 repletion.',
    required_action_bn: 'বার্ষিক সিরাম ভিটামিন বি১২ পরীক্ষা করুন। চিকিৎসকের পরামর্শে মিথাইলকোবালামিন (১০০০ মাইক্রোগ্রাম) সাপ্লিমেন্ট গ্রহণের পরিকল্পনা করুন।'
  },
  {
    rule_id: 'RULE_SGLT2_HYDRATION_FASTING',
    drug_category: 'diabetes_endocrine',
    generic_patterns: ['dapagliflozin', 'empagliflozin', 'canagliflozin'],
    severity: 'high_clinical_review',
    title_en: 'SGLT2 Inhibitor Glycosuria, Fluid Loss & Ketoacidosis Screening',
    title_bn: 'এসজিএলটি২ ইনহিবিটর: প্রস্রাবে গ্লুকোজ ক্ষয় ও ডিহাইড্রেশন সতর্কতা',
    trigger_criteria_en: 'Active prescription of SGLT2 inhibitor.',
    trigger_criteria_bn: 'এসজিএলটি২ ইনহিবিটর জাতীয় ওষুধ সেবন।',
    nutritional_consequence_en: 'Osmotic diuresis (300-500 mL/day extra fluid loss), electrolyte wasting, and rare euglycemic diabetic ketoacidosis (euDKA) under very low carbohydrate or ketogenic diets.',
    nutritional_consequence_bn: 'প্রস্রাবের সাথে অতিরিক্ত চিনি ও পানি বের হওয়ায় শরীর পানিশূন্য হতে পারে। অত্যন্ত কম শর্করার খাবার বা কিটো ডায়েটে ইগ্লাইসেমিক ডিকেএ হওয়ার ঝুঁকি থাকে।',
    evidence_source: 'FDA Drug Safety Communication: SGLT2 inhibitors and Ketoacidosis.',
    revision_date: '2026-11-24',
    mechanism_rationale_en: 'Inhibition of renal tubular SGLT2 transporter shifts whole-body substrate oxidation toward lipolysis and ketogenesis; excessive carbohydrate restriction exaggerates glucagon-to-insulin ratio.',
    mechanism_rationale_bn: 'কিডনিতে গ্লুকোজ পুনঃশোষণ বন্ধ থাকায় শরীরে ফ্যাট ভেঙে কিটোন তৈরি বৃদ্ধি পায়।',
    required_action_en: 'Increase fluid intake by 300-500 mL/day (unless restricted by cardiorenal limits). Strictly avoid ketogenic or extreme carbohydrate restriction (<50g/day) without endocrinologist co-management.',
    required_action_bn: 'প্রতিদিন অতিরিক্ত ৩০০-৫০০ মিলি পানি পান করুন। চিকিৎসকের নিবিড় তত্ত্বাবধান ব্যতীত কিটোজেনিক বা চরম কার্বোহাইড্রেট বর্জন সম্পূর্ণরূপে পরিহার করুন।'
  },
  {
    rule_id: 'RULE_LEVOTHYROXINE_MINERAL_TIMING',
    drug_category: 'diabetes_endocrine',
    generic_patterns: ['levothyroxine', 'levothyroxine sodium', 'thyroxine', 'eltroxin', 'thyrox'],
    severity: 'critical_hard_stop',
    title_en: 'Levothyroxine Critical Chelation & Separation Rule',
    title_bn: 'লেভোথাইরক্সিন ওষুধ ও খনিজ লবণের ৪ ঘণ্টার ব্যবধান',
    trigger_criteria_en: 'Active Levothyroxine therapy with concurrent mineral supplements, iron, calcium, or coffee.',
    trigger_criteria_bn: 'লেভোথাইরক্সিনের সাথে ক্যালসিয়াম, আয়রন, ম্যাগনেসিয়াম বা কফি গ্রহণ।',
    nutritional_consequence_en: 'Up to 60-80% reduction in thyroid hormone bioavailability, causing persistent hypothyroidism, fatigue, and dyslipidemia.',
    nutritional_consequence_bn: 'থাইরক্সিন ওষুধ শরীরে অপর্যাপ্তভাবে শোষিত হয়, ফলে ক্লান্তি, ওজন বৃদ্ধি এবং থাইরয়েড হরমোনের ঘাটতি অব্যাহত থাকে।',
    evidence_source: 'American Thyroid Association Guidelines for Hypothyroidism.',
    revision_date: '2026-11-24',
    mechanism_rationale_en: 'Divalent and trivalent metal ions (Ca2+, Fe2+, Fe3+, Mg2+, Al3+) form insoluble, unabsorbable chelates with levothyroxine in the gastric and jejunal lumen.',
    mechanism_rationale_bn: 'ক্যালসিয়াম ও আয়রন থাইরক্সিনের সাথে অদ্রবণীয় জটিল যৌগ গঠন করে যা অন্ত্রে শোষিত হতে পারে না।',
    required_action_en: 'Administer Levothyroxine immediately upon waking with plain water only. Enforce strict minimum 4-hour spacing before any calcium, iron, multivitamin, or high-fiber supplement.',
    required_action_bn: 'সকালে খালি পেটে শুধুমাত্র এক গ্লাস সাধারণ পানি দিয়ে লেভোথাইরক্সিন সেবন করুন। যেকোনো ক্যালসিয়াম, আয়রন বা মাল্টিভিটামিন থেকে কমপক্ষে ৪ ঘণ্টা দূরে রাখুন।'
  },
  {
    rule_id: 'RULE_CORTICOSTEROID_METABOLIC',
    drug_category: 'diabetes_endocrine',
    generic_patterns: ['prednisolone', 'dexamethasone', 'hydrocortisone', 'methylprednisolone'],
    severity: 'high_clinical_review',
    title_en: 'Systemic Corticosteroid Bone, Electrolyte & Glycemic Impact',
    title_bn: 'স্টেরয়েড ওষুধ: হাড়ের ক্ষয়, লবণ জমা ও রক্তে চিনি বৃদ্ধি',
    trigger_criteria_en: 'Systemic oral corticosteroid use >2 weeks.',
    trigger_criteria_bn: '২ সপ্তাহের বেশি সময় ধরে ওরালি স্টেরয়েড সেবন।',
    nutritional_consequence_en: 'Accelerated trabecular bone demineralization (osteopenia/osteoporosis), sodium and water retention, potassium wasting, and postprandial insulin resistance.',
    nutritional_consequence_bn: 'ক্যালসিয়াম প্রস্রাবের মাধ্যমে বের হয়ে হাড় ক্ষয় হয়, শরীরে পানি ও লবণ জমা হয়ে ফুলে যেতে পারে এবং রক্তে চিনি বৃদ্ধি পায়।',
    evidence_source: 'American College of Rheumatology Glucocorticoid-Induced Osteoporosis Guidelines.',
    revision_date: '2026-11-24',
    mechanism_rationale_en: 'Glucocorticoids inhibit intestinal calcium absorption (TRPV6 down-regulation), stimulate renal calcium excretion, increase osteoclast activity, and impair skeletal muscle GLUT4 translocation.',
    mechanism_rationale_bn: 'স্টেরয়েড অন্ত্রে ক্যালসিয়াম শোষণ কমায় এবং পেশিতে চিনি প্রবেশে বাধা প্রদান করে।',
    required_action_en: 'Provide adequate dietary Calcium (1000-1200 mg/day) and Vitamin D3 (800-2000 IU/day). Restrict dietary added sodium (<2000 mg/day). Prioritize potassium-rich vegetables and moderate glycemic load carbohydrates.',
    required_action_bn: 'ক্যালসিয়াম ও ভিটামিন ডি সমৃদ্ধ সুষম খাবার গ্রহণ করুন। অতিরিক্ত লবণ পরিহার করুন এবং রক্তে চিনির মাত্রা নিয়মিত পরীক্ষা করুন।'
  },

  // ── 2. Cardiovascular & Renal ─────────────────────────────────────
  {
    rule_id: 'RULE_WARFARIN_VITAMIN_K',
    drug_category: 'cardiovascular_renal',
    generic_patterns: ['warfarin', 'warfarin sodium'],
    severity: 'critical_hard_stop',
    title_en: 'Warfarin Anticoagulation & Dietary Vitamin K Consistency',
    title_bn: 'ওয়ারফারিন ওষুধ ও খাবারে ভিটামিন কে-এর ধারাবাহিকতা রক্ষা',
    trigger_criteria_en: 'Active Warfarin anticoagulant therapy.',
    trigger_criteria_bn: 'ওয়ারফারিন নামক রক্ত পাতলা রাখার ওষুধ সেবন।',
    nutritional_consequence_en: 'Severe thromboembolic stroke or fatal hemorrhage risk from acute fluctuations in dietary Vitamin K (phylloquinone) intake.',
    nutritional_consequence_bn: 'সবুজ শাকসবজিতে থাকা ভিটামিন কে হঠাৎ বেশি খেলে রক্ত জমাট বেঁধে স্ট্রোক হতে পারে, আর একেবারেই না খেলে অতিরিক্ত রক্তক্ষরণ হতে পারে।',
    evidence_source: 'Chest Antithrombotic Therapy Guidelines; American College of Cardiology.',
    revision_date: '2026-11-24',
    mechanism_rationale_en: 'Warfarin competitively inhibits Vitamin K epoxide reductase (VKORC1). Dramatic shifts in dietary Vitamin K overcome the enzymatic block, destabilizing INR.',
    mechanism_rationale_bn: 'ওয়ারফারিন রক্ত জমাট বাঁধার ভিটামিন কে চক্রকে বাধা দেয়; খাবারে ভিটামিন কে ওঠানামা করলে ওষুধের কার্যকারিতা বিঘ্নিত হয়।',
    required_action_en: 'Maintain steady, consistent weekly Vitamin K intake. Strictly avoid sudden large servings or abrupt cessation of dark leafy greens. Restrict concurrent high-dose Vitamin E (>400 IU) and Ginkgo.',
    required_action_bn: 'প্রতি সপ্তাহে সবুজ শাকসবজি গ্রহণের পরিমাণ সামঞ্জস্যপূর্ণ ও অপরিবর্তিত রাখুন। হঠাৎ করে অতিরিক্ত শাক খাওয়া বা একেবারেই বন্ধ করা সম্পূর্ণ নিষিদ্ধ।'
  },
  {
    rule_id: 'RULE_ACEI_ARB_POTASSIUM',
    drug_category: 'cardiovascular_renal',
    generic_patterns: ['losartan', 'losartan potassium', 'telmisartan', 'valsartan', 'ramipril', 'enalapril', 'lisinopril', 'captopril'],
    severity: 'high_clinical_review',
    title_en: 'RAAS Inhibitor & Potassium Retention Caution',
    title_bn: 'রক্তচাপের ওষুধ (ACEi/ARB) ও পটাশিয়াম বৃদ্ধি ঝুঁকি',
    trigger_criteria_en: 'Active ACE inhibitor or ARB therapy, especially with eGFR < 45 mL/min.',
    trigger_criteria_bn: 'উচ্চ রক্তচাপের এসিই ইনহিবিটর বা এআরবি ওষুধ সেবন (বিশেষত যাদের কিডনি দুর্বল)।',
    nutritional_consequence_en: 'Hyperkalemia (>5.5 mEq/L) leading to fatal cardiac arrhythmias, especially if consuming potassium-enriched salt substitutes.',
    nutritional_consequence_bn: 'রক্তে পটাশিয়াম বিপজ্জনকভাবে বৃদ্ধি পেয়ে হৃদস্পন্দনে প্রাণঘাতী ছন্দপতন (অ্যারিদমিয়া) ঘটাতে পারে।',
    evidence_source: 'KDIGO Clinical Practice Guideline for Diabetes and CKD.',
    revision_date: '2026-11-24',
    mechanism_rationale_en: 'Suppression of angiotensin II or aldosterone decreases renal cortical collecting duct potassium secretion via ROMK channels.',
    mechanism_rationale_bn: 'ওষুধটি কিডনি দিয়ে অতিরিক্ত পটাশিয়াম নিষ্কাশনে বাধা দেয়।',
    required_action_en: 'Strictly prohibit potassium chloride "low-sodium" salt substitutes. Monitor serum potassium every 3-6 months. Moderate intake of high-potassium extracts.',
    required_action_bn: 'পটাশিয়ামযুক্ত বিকল্প লবণ (লো-সোডিয়াম সল্ট) ব্যবহার সম্পূর্ণ নিষিদ্ধ। সিরাম পটাশিয়াম নিয়মিত পরীক্ষা করুন।'
  },
  {
    rule_id: 'RULE_K_SPARING_DIURETIC',
    drug_category: 'cardiovascular_renal',
    generic_patterns: ['spironolactone', 'eplerenone', 'amiloride'],
    severity: 'critical_hard_stop',
    title_en: 'Potassium-Sparing Diuretic Severe Hyperkalemia Hard Stop',
    title_bn: 'স্পাইরোনোল্যাকটোন ওষুধ ও পটাশিয়াম সাপ্লিমেন্ট সম্পূর্ণ নিষিদ্ধ',
    trigger_criteria_en: 'Concurrent Spironolactone with potassium supplements or salt substitutes.',
    trigger_criteria_bn: 'স্পাইরোনোল্যাকটোনের সাথে পটাশিয়াম সাপ্লিমেন্ট বা উচ্চ পটাশিয়াম খাদ্য।',
    nutritional_consequence_en: 'Severe acute hyperkalemia (>6.0 mEq/L) with sudden ventricular fibrillation risk.',
    nutritional_consequence_bn: 'রক্তে পটাশিয়াম অতিরিক্ত বেড়ে গিয়ে হঠাৎ হৃদস্পন্দন বন্ধ হওয়ার ঝুঁকি থাকে।',
    evidence_source: 'AHA/ACC Heart Failure Guidelines.',
    revision_date: '2026-11-24',
    mechanism_rationale_en: 'Mineralocorticoid receptor antagonism directly blocks epithelial sodium channel (ENaC) and sodium-potassium ATPase exchange in the distal nephron.',
    mechanism_rationale_bn: 'কিডনিতে খনিজ হরমোন অ্যালডোস্টেরন ব্লক থাকায় পটাশিয়াম শরীরে জমে যায়।',
    required_action_en: 'Strictly contraindicate over-the-counter potassium supplements and potassium-based salt substitutes. Clinical hard stop enforced.',
    required_action_bn: 'পটাশিয়াম সাপ্লিমেন্ট এবং পটাশিয়ামযুক্ত লবণ সম্পূর্ণ বন্ধ রাখুন। ক্লিনিক্যাল হার্ড স্টপ কার্যকর।'
  },
  {
    rule_id: 'RULE_LOOP_THIAZIDE_ELECTROLYTE',
    drug_category: 'cardiovascular_renal',
    generic_patterns: ['furosemide', 'frusemide', 'hydrochlorothiazide', 'torsemide', 'indapamide'],
    severity: 'high_clinical_review',
    title_en: 'Loop & Thiazide Diuretic Micronutrient & Electrolyte Depletion',
    title_bn: 'ডাইইউরেটিক (পানির ওষুধ): পটাশিয়াম ও ম্যাগনেসিয়াম ক্ষয়',
    trigger_criteria_en: 'Active therapy with loop or thiazide diuretics.',
    trigger_criteria_bn: 'লুপ বা থায়াজাইড ডাইইউরেটিক ওষুধ সেবন।',
    nutritional_consequence_en: 'Urinary wasting of Potassium, Magnesium, Zinc, and Thiamine (B1); increased risk of muscle cramps, arrhythmias, and fatigue.',
    nutritional_consequence_bn: 'প্রস্রাবের মাধ্যমে পটাশিয়াম, ম্যাগনেসিয়াম, জিংক ও ভিটামিন বি১ শরীর থেকে বের হয়ে যায়। ফলে মাংসপেশিতে টান ও ক্লান্তি হয়।',
    evidence_source: 'European Society of Cardiology Guidelines; Journal of Nutrition & Metabolism.',
    revision_date: '2026-11-24',
    mechanism_rationale_en: 'Inhibition of NKCC2 (loop) or NCCT (thiazide) symporters impairs lumen-positive transepithelial potential driving paracellular reabsorption of divalent cations.',
    mechanism_rationale_bn: 'কিডনির ফিল্টারে খনিজ পুনঃশোষণ ব্যাহত হওয়ায় প্রস্রাবে লবণ ও পানি বেশি নির্গত হয়।',
    required_action_en: 'Ensure adequate dietary intake of Magnesium (seeds, nuts, greens) and Potassium (bananas, potatoes, coconut water if renal function intact). Screen electrolytes regularly.',
    required_action_bn: 'খাবারে পর্যাপ্ত ম্যাগনেসিয়াম ও পটাশিয়াম সমৃদ্ধ উপাদান রাখুন (কিডনির অবস্থা বিবেচনা করে)। চিকিৎসকের পরামর্শে ইলেক্ট্রোলাইট পরীক্ষা করান।'
  },
  {
    rule_id: 'RULE_STATIN_COQ10',
    drug_category: 'cardiovascular_renal',
    generic_patterns: ['atorvastatin', 'rosuvastatin', 'simvastatin', 'pravastatin'],
    severity: 'moderate_caution',
    title_en: 'HMG-CoA Reductase Inhibitor (Statin) CoQ10 Depletion & Grapefruit Interaction',
    title_bn: 'স্ট্যাটিন ওষুধ: কোএনজাইম কিউ১০ হ্রাস ও জাম্বুরা/গ্রেপফ্রুট পরিহার',
    trigger_criteria_en: 'Active statin therapy, especially with reported muscle aches/myalgias.',
    trigger_criteria_bn: 'কোলেস্টেরলের স্ট্যাটিন ওষুধ সেবন ও পেশির ব্যথা।',
    nutritional_consequence_en: 'Downregulated endogenous Coenzyme Q10 synthesis in skeletal muscle; CYP3A4 inhibition with grapefruit increases toxicity risk for atorvastatin/simvastatin.',
    nutritional_consequence_bn: 'পেশির মাইটোকন্ড্রিয়ায় কোএনজাইম কিউ১০ হ্রাস পায়। গ্রেপফ্রুট বা জাম্বুরা খেলে রক্তে ওষুধের মাত্রা বিপজ্জনকভাবে বেড়ে যেতে পারে।',
    evidence_source: 'National Lipid Association; American College of Cardiology Statin Safety Task Force.',
    revision_date: '2026-11-24',
    mechanism_rationale_en: 'Inhibition of HMG-CoA reductase blocks mevalonate pathway, downstream reducing farnesyl pyrophosphate needed for ubiquinone (CoQ10) side-chain assembly.',
    mechanism_rationale_bn: 'ওষুধটি মেভালোনেট পাথওয়ে ব্লক করায় শরীরে কোএনজাইম কিউ১০ তৈরি কমে যায়।',
    required_action_en: 'Avoid regular consumption of grapefruit/grapefruit juice with CYP3A4-metabolized statins. Consider CoQ10 (Ubiquinol 100-200 mg/day) for muscle complaints under clinician review.',
    required_action_bn: 'ওষুধ চলাকালীন গ্রেপফ্রুট বা জাম্বুরার রস পরিহার করুন। পেশির ব্যথায় চিকিৎসকের পরামর্শে কোএনজাইম কিউ১০ বিবেচনা করুন।'
  },

  // ── 3. Psychiatric & Neurological ─────────────────────────────────
  {
    rule_id: 'RULE_MAOI_TYRAMINE_RESTRICTION',
    drug_category: 'psychiatric_neurological',
    generic_patterns: ['phenelzine', 'tranylcypromine', 'isocarboxazid', 'selegiline'],
    severity: 'critical_hard_stop',
    title_en: 'Irreversible MAOI Tyramine Hypertensive Crisis Hard Stop',
    title_bn: 'এমএওআই ওষুধ ও টাইরামিনযুক্ত খাদ্য: বিপজ্জনক রক্তচাপ সংকট',
    trigger_criteria_en: 'Active prescription of non-selective or irreversible MAO inhibitor.',
    trigger_criteria_bn: 'এমএওআই জাতীয় অ্যান্টিডিপ্রেসেন্ট ওষুধ সেবন।',
    nutritional_consequence_en: 'Severe sudden hypertensive crisis (SBP > 220 mmHg), intracranial hemorrhage, myocardial infarction, and death if aged/fermented foods are consumed.',
    nutritional_consequence_bn: 'পুরোনো পনির, গাঁজানো খাবার বা শুকনো মাংসে থাকা টাইরামিন রক্তচাপ হঠাৎ মারাত্মকভাবে বৃদ্ধি করে ব্রেন স্ট্রোক ঘটাতে পারে।',
    evidence_source: 'FDA Black Box Warning; Stahl’s Essential Psychopharmacology.',
    revision_date: '2026-11-24',
    mechanism_rationale_en: 'Inhibition of gastrointestinal and hepatic MAO-A permits dietary tyramine to enter systemic circulation intact, releasing massive norepinephrine stores from postganglionic sympathetic neurons.',
    mechanism_rationale_bn: 'অন্ত্রে টাইরামিন ধ্বংসকারী এনজাইম নিষ্ক্রিয় থাকায় টাইরামিন রক্তে মিশে গিয়ে অ্যাড্রেনালিন হরমোন তীব্রভাবে বাড়িয়ে দেয়।',
    required_action_en: 'Strictly prohibit aged cheeses, cured/fermented meats, draft beer, soy sauce, Marmite/yeast extracts, and overripe bananas. Hard stop enforced.',
    required_action_bn: 'পুরোনো পনির, সয়াসস, ফার্মেন্টেড খাবার ও গাঁজানো পানীয় সম্পূর্ণ নিষিদ্ধ। খাদ্যতালিকায় সর্বদা টাটকা খাবার নিশ্চিত করুন।'
  },
  {
    rule_id: 'RULE_LITHIUM_FLUID_SODIUM',
    drug_category: 'psychiatric_neurological',
    generic_patterns: ['lithium', 'lithium carbonate', 'lithium citrate'],
    severity: 'critical_hard_stop',
    title_en: 'Lithium Narrow Therapeutic Window: Sodium & Fluid Stability',
    title_bn: 'লিথিয়াম ওষুধ: লবণ ও তরল ভারসাম্যের ধারাবাহিকতা',
    trigger_criteria_en: 'Active Lithium therapy for mood stabilization.',
    trigger_criteria_bn: 'মুড স্ট্যাবিলাইজার হিসেবে লিথিয়াম সেবন।',
    nutritional_consequence_en: 'Narrow therapeutic window (0.6-1.2 mEq/L). Acute sodium restriction or dehydration causes lithium retention, leading to irreversible neurotoxicity, ataxia, coma, and renal failure.',
    nutritional_consequence_bn: 'খাবারে লবণ হঠাৎ কমিয়ে দিলে বা পানিশূন্যতা হলে রক্তে লিথিয়ামের বিষক্রিয়া সৃষ্টি হয়ে মস্তিষ্ক ও স্নায়ুর স্থায়ী ক্ষতি হতে পারে।',
    evidence_source: 'CANMAT Bipolar Disorder Guidelines; APA Practice Guideline for Bipolar Disorder.',
    revision_date: '2026-11-24',
    mechanism_rationale_en: 'Lithium is handled identically to sodium in the proximal renal tubule. Hyponatremia or hypovolemia upregulates proximal tubular sodium/lithium reabsorption.',
    mechanism_rationale_bn: 'কিডনি লিথিয়ামকে লবণের মতো বিবেচনা করে; লবণ কম খেলে কিডনি লিথিয়াম শরীর থেকে বের না করে জমিয়ে রাখে।',
    required_action_en: 'Maintain steady, consistent daily fluid and sodium intake. Strictly prohibit crash low-sodium diets or unmonitored fluid restriction. Keep well-hydrated during fever or hot weather.',
    required_action_bn: 'প্রতিদিনের খাবারে লবণের পরিমাণ এবং পানি পানের মাত্রা অপরিবর্তিত রাখুন। হঠাৎ লবণ বর্জন করা সম্পূর্ণ নিষেধ। গরমে বা ডায়রিয়ায় পর্যাপ্ত পানি নিশ্চিত করুন।'
  },
  {
    rule_id: 'RULE_ANTIPSYCHOTIC_METABOLIC',
    drug_category: 'psychiatric_neurological',
    generic_patterns: ['olanzapine', 'clozapine', 'quetiapine', 'risperidone', 'aripiprazole'],
    severity: 'high_clinical_review',
    title_en: 'Atypical Antipsychotic Cardiometabolic & Weight Trajectory Monitoring',
    title_bn: 'অ্যান্টিসাইকোটিক ওষুধ: ওজন বৃদ্ধি ও মেটাবলিক সিন্ড্রোম পর্যবেক্ষণ',
    trigger_criteria_en: 'Active prescription of second-generation atypical antipsychotic.',
    trigger_criteria_bn: 'দ্বিতীয় প্রজন্মের অ্যান্টিসাইকোটিক ওষুধ সেবন।',
    nutritional_consequence_en: 'Significant orexigenic weight gain (hyperphagia), rapid central adiposity, hypertriglyceridemia, and secondary Type 2 Diabetes.',
    nutritional_consequence_bn: 'ক্ষুধা অতিরিক্ত বৃদ্ধি পাওয়ায় ওজন দ্রুত বেড়ে যায়, ফ্যাটি লিভার, ট্রাইগ্লিসারাইড বৃদ্ধি এবং ডায়াবেটিসের ঝুঁকি বাড়ে।',
    evidence_source: 'American Diabetes Association & American Psychiatric Association Consensus on Antipsychotic Drugs and Obesity.',
    revision_date: '2026-11-24',
    mechanism_rationale_en: 'Antagonism of hypothalamic 5-HT2C and H1 histamine receptors stimulates AMPK activity, promoting hyperphagia and downregulating brown fat thermogenesis.',
    mechanism_rationale_bn: 'মস্তিষ্কের ক্ষুধা নিয়ন্ত্রণকারী রিসেপ্টর উদ্দীপিত হওয়ায় অতিরিক্ত খাওয়ার প্রবণতা তৈরি হয়।',
    required_action_en: 'Prioritize low-energy-density, high-fiber, and high-satiety functional foods. Monitor fasting lipid profile, HbA1c, and waist circumference every 3 months. Never advise stopping medication.',
    required_action_bn: 'উচ্চ আঁশযুক্ত ও দীর্ঘক্ষণ তৃপ্তি দেয় এমন খাবার নির্বাচন করুন। প্রতি ৩ মাস অন্তর রক্তের চিনি ও চর্বি পরীক্ষা করুন। ওষুধ কোনো অবস্থাতেই বন্ধ করবেন না।'
  },
  {
    rule_id: 'RULE_ANTIEPILEPTIC_MICRONUTRIENT',
    drug_category: 'psychiatric_neurological',
    generic_patterns: ['valproate', 'sodium valproate', 'valproic acid', 'carbamazepine', 'phenytoin'],
    severity: 'high_clinical_review',
    title_en: 'Antiepileptic / Mood Stabilizer Bone Density & Folate Depletion',
    title_bn: 'মৃগীরোগ/মুড ওষুধ: ভিটামিন ডি, ফলিক অ্যাসিড ও হাড় ক্ষয়',
    trigger_criteria_en: 'Chronic use of Valproate, Carbamazepine, or Phenytoin.',
    trigger_criteria_bn: 'দীর্ঘমেয়াদে ভালপ্রোয়েট বা কার্বামাজেপিন ওষুধ সেবন।',
    nutritional_consequence_en: 'Accelerated Vitamin D catabolism resulting in hypocalcemia, secondary hyperparathyroidism, and osteomalacia; Folate and L-carnitine depletion.',
    nutritional_consequence_bn: 'ভিটামিন ডি দ্রুত ভেঙে গিয়ে হাড়ের ঘনত্ব কমে যায় এবং ফলিক অ্যাসিডের ঘাটতি তৈরি হতে পারে।',
    evidence_source: 'American Academy of Neurology Practice Guidelines.',
    revision_date: '2026-11-24',
    mechanism_rationale_en: 'Enzyme-inducing AEDs induce hepatic CYP enzymes that convert 25-hydroxyvitamin D to inactive polar metabolites.',
    mechanism_rationale_bn: 'ওষুধটি লিভারের এনজাইম সক্রিয় করে ভিটামিন ডি ধ্বংসের গতি বাড়িয়ে দেয়।',
    required_action_en: 'Evaluate serum 25(OH)D and Folate. Ensure adequate dietary Vitamin D3 (1000-2000 IU/day) and Calcium (1000 mg/day). Screen bone mineral density in chronic therapy.',
    required_action_bn: 'নিয়মিত ভিটামিন ডি এবং ফলিক অ্যাসিড পর্যবেক্ষণ করুন। ক্যালসিয়াম সমৃদ্ধ সুষম খাবার নিশ্চিত করুন।'
  },
  {
    rule_id: 'RULE_STIMULANT_APPETITE_GROWTH',
    drug_category: 'psychiatric_neurological',
    generic_patterns: ['methylphenidate', 'atomoxetine', 'modafinil', 'dexamphetamine'],
    severity: 'high_clinical_review',
    title_en: 'CNS Stimulant Anorexia & Pediatric Growth Trajectory Monitoring',
    title_bn: 'উত্তেজক/মনোযোগের ওষুধ: ক্ষুধা হ্রাস ও শিশুর শারীরিক বৃদ্ধি পর্যবেক্ষণ',
    trigger_criteria_en: 'Prescription of CNS stimulants in pediatric, adolescent, or underweight patients.',
    trigger_criteria_bn: 'শিশু, কিশোর বা কম ওজনের রোগীদের ক্ষেত্রে মনোযোগ বা এডিএইচডি ওষুধ সেবন।',
    nutritional_consequence_en: 'Severe midday appetite suppression, meal avoidance, involuntary weight loss, and potential deceleration of height velocity in children.',
    nutritional_consequence_bn: 'দুপুরের ক্ষুধা সম্পূর্ণরূপে নষ্ট হয়ে যেতে পারে, ফলে শিশুদের ওজন ও স্বাভাবিক শারীরিক বৃদ্ধি ব্যাহত হতে পারে।',
    evidence_source: 'American Academy of Child and Adolescent Psychiatry (AACAP) Practice Parameters.',
    revision_date: '2026-11-24',
    mechanism_rationale_en: 'Dopamine and norepinephrine reuptake inhibition in the lateral hypothalamus suppresses orexigenic neuropeptide Y (NPY) and ghrelin signaling.',
    mechanism_rationale_bn: 'মস্তিষ্কে ডোপামিন ও নর-অ্যাড্রেনালিন বৃদ্ধি পেয়ে ক্ষুধার অনুভূতি সাময়িকভাবে বন্ধ করে দেয়।',
    required_action_en: 'Deliver nutrient-dense caloric meals before morning dose and in the late evening after drug wears off. Track monthly pediatric growth percentiles (height and weight).',
    required_action_bn: 'সকালে ওষুধ সেবনের পূর্বে একটি পুষ্টিকর ভারী নাস্তা দিন এবং রাতে ওষুধের প্রভাব কেটে গেলে ক্যালরিবহুল খাবার নিশ্চিত করুন। প্রতি মাসে শিশুর উচ্চতা ও ওজন পরিমাপ করুন।'
  },

  // ── 4. Gastrointestinal ───────────────────────────────────────────
  {
    rule_id: 'RULE_PPI_MICRONUTRIENT_MALABSORPTION',
    drug_category: 'gastrointestinal',
    generic_patterns: ['omeprazole', 'esomeprazole', 'pantoprazole', 'rabeprazole', 'lansoprazole'],
    severity: 'high_clinical_review',
    title_en: 'Proton Pump Inhibitor Hypochlorhydria & Micronutrient Malabsorption',
    title_bn: 'গ্যাস্ট্রিকের পিপিআই ওষুধ: পাকস্থলীর অ্যাসিড হ্রাস ও পুষ্টি উপাদান শোষণ বাধা',
    trigger_criteria_en: 'Chronic daily PPI therapy exceeding 8 weeks.',
    trigger_criteria_bn: '২ মাসের অধিক সময় ধরে দৈনিক পিপিআই বা গ্যাস্ট্রিকের ওষুধ সেবন।',
    nutritional_consequence_en: 'Reduced absorption of protein-bound Vitamin B12, non-heme Iron, Calcium carbonate, and Magnesium; dysbiosis / SIBO risk.',
    nutritional_consequence_bn: 'পাকস্থলীতে অ্যাসিড না থাকায় খাবার থেকে ভিটামিন বি১২, আয়রন, ক্যালসিয়াম ও ম্যাগনেসিয়াম শোষণ ব্যাহত হয় এবং পেটে ক্ষতিকর জীবাণু বৃদ্ধি পায়।',
    evidence_source: 'American Gastroenterological Association (AGA) Best Practice Advice on PPI Safety; FDA Drug Safety Communications.',
    revision_date: '2026-11-24',
    mechanism_rationale_en: 'Irreversible inhibition of H+/K+ ATPase elevates gastric pH (>4.0), preventing pepsinogen cleavage to pepsin and impairing ionization of mineral salts.',
    mechanism_rationale_bn: 'পাকস্থলীর অ্যাসিড নিঃসরন বন্ধ থাকায় খাবারের পুষ্টি উপাদান মুক্ত ও শোষিত হতে পারে না।',
    required_action_en: 'Assess serum B12, Magnesium, and Ferritin annually. If calcium supplementation is needed, prioritize acid-independent Calcium Citrate over Calcium Carbonate.',
    required_action_bn: 'বার্ষিক রক্তের ম্যাগনেসিয়াম ও বি১২ পরীক্ষা করুন। ক্যালসিয়াম সাপ্লিমেন্ট গ্রহণের ক্ষেত্রে ক্যালসিয়াম কার্বনেটের পরিবর্তে ক্যালসিয়াম সাইট্রেট নির্বাচন করুন।'
  },

  // ── 5. Antimicrobial & Immune ─────────────────────────────────────
  {
    rule_id: 'RULE_FLUOROQUINOLONE_MINERAL_CHELATION',
    drug_category: 'antimicrobial_immune',
    generic_patterns: ['ciprofloxacin', 'levofloxacin', 'moxifloxacin', 'doxycycline', 'tetracycline'],
    severity: 'critical_hard_stop',
    title_en: 'Antibiotic Mineral Chelation & Antimicrobial Inactivation',
    title_bn: 'অ্যান্টিবায়োটিক ও খনিজ লবণের চিলেশন: কার্যকারিতা ধ্বংসের ঝুঁকি',
    trigger_criteria_en: 'Concurrent oral fluoroquinolone or tetracycline with mineral supplements or dairy.',
    trigger_criteria_bn: 'সিপ্রোফ্লক্সাসিন বা ডক্সিসাইক্লিন অ্যান্টিবায়োটিকের সাথে দুধ, ক্যালসিয়াম বা আয়রন গ্রহণ।',
    nutritional_consequence_en: 'Up to 90% reduction in peak antibiotic concentration (Cmax), causing clinical treatment failure and antimicrobial resistance.',
    nutritional_consequence_bn: 'অ্যান্টিবায়োটিকের কার্যকারিতা প্রায় ৯০% নষ্ট হয়ে যায়, ফলে জীবাণু ধ্বংস হয় না এবং অ্যান্টিবায়োটিক রেজিস্ট্যান্স তৈরি হয়।',
    evidence_source: 'Clinical Infectious Diseases; FDA Approved Prescribing Information.',
    revision_date: '2026-11-24',
    mechanism_rationale_en: '4-keto and 3-carboxyl groups of fluoroquinolones form insoluble polyvalent metal coordination complexes with Ca2+, Mg2+, Fe2+, Al3+, and Zn2+.',
    mechanism_rationale_bn: 'খনিজ উপাদান অ্যান্টিবায়োটিকের সাথে রাসায়নিক বন্ধন তৈরি করে একে অকার্যকর করে দেয়।',
    required_action_en: 'Separate oral antibiotic from calcium, iron, magnesium, zinc, antacids, and dairy by at least 2 hours before or 4-6 hours after administration.',
    required_action_bn: 'অ্যান্টিবায়োটিক গ্রহণের অন্তত ২ ঘণ্টা পূর্বে অথবা ৪-৬ ঘণ্টা পর ক্যালসিয়াম, আয়রন, দুধ ও দুগ্ধজাত খাবার গ্রহণ করুন।'
  },
  {
    rule_id: 'RULE_ISONIAZID_B6_NEUROPATHY',
    drug_category: 'antimicrobial_immune',
    generic_patterns: ['isoniazid', 'inh'],
    severity: 'critical_hard_stop',
    title_en: 'Isoniazid Pyridoxine (Vitamin B6) Depletion & Peripheral Neuropathy',
    title_bn: 'আইসোনিয়াজিড (যক্ষ্মা ওষুধ) ও ভিটামিন বি৬ ঘাটতি: স্নায়ুরক্ষায় পাইরিডক্সিন আবশ্যক',
    trigger_criteria_en: 'Active Isoniazid antitubercular therapy.',
    trigger_criteria_bn: 'যক্ষ্মা চিকিৎসার জন্য আইসোনিয়াজিড সেবন।',
    nutritional_consequence_en: 'Severe burning peripheral neuropathy, paresthesias, and seizures from acute cellular Pyridoxal-5-Phosphate deficiency.',
    nutritional_consequence_bn: 'হাত-পায়ে তীব্র জ্বালাপোড়া, অবশ ভাব এবং স্নায়ুর মারাত্মক ক্ষতি হতে পারে।',
    evidence_source: 'WHO Guidelines for Treatment of Drug-Susceptible Tuberculosis.',
    revision_date: '2026-11-24',
    mechanism_rationale_en: 'Isoniazid binds pyridoxal to form isonicotinyl-hydrazones excreted in urine; it also inhibits pyridoxal kinase, depleting active PLP.',
    mechanism_rationale_bn: 'ওষুধটি শরীর থেকে ভিটামিন বি৬ প্রস্রাবের মাধ্যমে বের করে দেয় এবং স্নায়ুর কোষে সক্রিয় ভিটামিন বি৬ তৈরি বন্ধ করে।',
    required_action_en: 'Mandate daily Pyridoxine (Vitamin B6 10-50 mg/day) co-administration throughout duration of Isoniazid therapy.',
    required_action_bn: 'আইসোনিয়াজিড চলাকালীন প্রতিদিন ১০-৫০ মিলিগ্রাম ভিটামিন বি৬ (পাইরিডক্সিন) সেবন বাধ্যতামূলক।'
  },
  {
    rule_id: 'RULE_METHOTREXATE_FOLATE',
    drug_category: 'antimicrobial_immune',
    generic_patterns: ['methotrexate'],
    severity: 'high_clinical_review',
    title_en: 'Methotrexate Dihydrofolate Reductase Inhibition & Folate Protocol',
    title_bn: 'মিথোট্রেক্সেট ওষুধ: ফলিক অ্যাসিডের ঘাটতি ও হেপাটোটক্সিসিটি রোধ',
    trigger_criteria_en: 'Weekly Methotrexate therapy for rheumatoid arthritis, psoriasis, or inflammatory disease.',
    trigger_criteria_bn: 'রিউমাটয়েড বা চর্মরোগে সপ্তাহে একবার মিথোট্রেক্সেট সেবন।',
    nutritional_consequence_en: 'Mucositis, oral ulcers, alopecia, hepatotoxicity, and bone marrow suppression from systemic folate depletion.',
    nutritional_consequence_bn: 'মুখে ঘা, চুল পড়া, লিভারের ক্ষতি এবং রক্তকণিকা কমে যাওয়ার ঝুঁকি থাকে।',
    evidence_source: 'American College of Rheumatology Methotrexate Safety Guidelines.',
    revision_date: '2026-11-24',
    mechanism_rationale_en: 'Competitive inhibition of dihydrofolate reductase (DHFR) arrests purine/pyrimidine synthesis and increases tissue homocysteine.',
    mechanism_rationale_bn: 'ওষুধটি কোষের ডিএনএ তৈরিতে প্রয়োজনীয় ফলিক অ্যাসিডের কার্যকারিতা সাময়িকভাবে বন্ধ করে।',
    required_action_en: 'Prescribe Folic Acid (1-5 mg/day) on non-methotrexate days (skip the day of MTX dosing to preserve antirheumatic efficacy).',
    required_action_bn: 'সপ্তাহে যেদিন মিথোট্রেক্সেট খাওয়া হয় সেদিন বাদে বাকি দিনগুলোতে চিকিৎসকের পরামর্শ অনুযায়ী ফলিক অ্যাসিড (১-৫ মিগ্রা) গ্রহণ করুন।'
  },

  // ── 6. Bone Health ────────────────────────────────────────────────
  {
    rule_id: 'RULE_BISPHOSPHONATE_POSTURE',
    drug_category: 'cardiovascular_renal',
    generic_patterns: ['alendronate', 'alendronic acid', 'risedronate', 'ibandronate', 'ibandronic acid'],
    severity: 'critical_hard_stop',
    title_en: 'Oral Bisphosphonate Esophageal Erosion & Upright Fasting Rule',
    title_bn: 'বাইসফসফোনেট (হাড় ক্ষয় রোধের ওষুধ): খাদ্যনালী সুরক্ষা ও ৬০ মিনিট সোজা বসার নিয়ম',
    trigger_criteria_en: 'Active oral bisphosphonate therapy (does not apply to IV zoledronic acid).',
    trigger_criteria_bn: 'হাড় ক্ষয় রোধে মুখে খাওয়ার বাইসফসফোনেট সেবন (আইভি ইনজেকশনের ক্ষেত্রে প্রযোজ্য নয়)।',
    nutritional_consequence_en: 'Severe corrosive chemical esophagitis, esophageal ulceration, perforation, and near-zero drug absorption if taken with food or beverages.',
    nutritional_consequence_bn: 'খাবারের সাথে বা শোয়া অবস্থায় খেলে খাদ্যনালীতে তীব্র ক্ষত (আলসার) হতে পারে এবং ওষুধের কার্যকারিতা শূন্যে নেমে আসে।',
    evidence_source: 'Endocrine Society Guidelines on Pharmacological Management of Osteoporosis.',
    revision_date: '2026-11-24',
    mechanism_rationale_en: 'Oral bisphosphonates are poorly bioavailable (<1%) and highly irritating to non-keratinized esophageal squamous epithelium.',
    mechanism_rationale_bn: 'ওষুধটি খাদ্যনালীর মিউকোসায় তীব্র রাসায়নিক প্রদাহ সৃষ্টি করতে পারে।',
    required_action_en: 'Take upon waking with a full glass of plain water only. Remain strictly upright (sitting or standing) for at least 30-60 minutes. Do not eat, drink, or take supplements for 60 minutes.',
    required_action_bn: 'সকালে ঘুম থেকে উঠে এক পূর্ণ গ্লাস সাধারণ পানি দিয়ে সেবন করুন। পরবর্তী ৬০ মিনিট সম্পূর্ণ সোজা হয়ে বসে বা দাঁড়িয়ে থাকুন (শোয়া যাবে না) এবং অন্য কোনো খাবার বা পানি গ্রহণ করবেন না।'
  }
];

/**
 * Evaluates active patient medications against comprehensive medication-nutrition rules.
 */
export function evaluateMedicationNutritionInteractions(
  medications: R5MedicationRecord[],
  patient?: Partial<PatientProfile>
): DrugNutrientFinding[] {
  const findings: DrugNutrientFinding[] = [];
  const seenRules = new Set<string>();

  medications.forEach(med => {
    if (med.status === 'discontinued') return;

    const medNameLower = (med.generic_name || med.brand_name || '').toLowerCase();

    MEDICATION_NUTRITION_RULES.forEach(rule => {
      // Safety filter: Oral bisphosphonate rules do not apply to IV/injection formulations
      if (rule.rule_id === 'RULE_BISPHOSPHONATE_POSTURE') {
        const routeLower = (med.route || '').toLowerCase();
        if (routeLower.includes('iv') || routeLower.includes('intravenous') || routeLower.includes('injection')) {
          return;
        }
      }

      const matches = rule.generic_patterns.some(pattern => medNameLower.includes(pattern));

      if (matches) {
        const key = `${rule.rule_id}_${med.id}`;
        if (!seenRules.has(key)) {
          seenRules.add(key);

          // Extract affected nutrients from title/consequence
          const affected: string[] = [];
          if (rule.rule_id.includes('B12')) affected.push('Vitamin B12');
          if (rule.rule_id.includes('POTASSIUM')) affected.push('Potassium');
          if (rule.rule_id.includes('TYRAMINE')) affected.push('Tyramine');
          if (rule.rule_id.includes('SODIUM')) affected.push('Sodium', 'Fluid');
          if (rule.rule_id.includes('VITAMIN_K')) affected.push('Vitamin K');
          if (rule.rule_id.includes('COQ10')) affected.push('Coenzyme Q10');
          if (rule.rule_id.includes('MINERAL')) affected.push('Calcium', 'Iron', 'Magnesium');
          if (rule.rule_id.includes('FOLATE')) affected.push('Folic Acid');
          if (rule.rule_id.includes('B6')) affected.push('Vitamin B6');

          findings.push({
            rule_id: rule.rule_id,
            drug_name: med.brand_name ? `${med.brand_name} (${med.generic_name})` : med.generic_name,
            severity: rule.severity,
            title_en: rule.title_en,
            title_bn: rule.title_bn,
            rationale_en: rule.mechanism_rationale_en,
            rationale_bn: rule.mechanism_rationale_bn,
            required_action_en: rule.required_action_en,
            required_action_bn: rule.required_action_bn,
            evidence_source: rule.evidence_source,
            affected_nutrients: affected
          });
        }
      }
    });
  });

  return findings;
}
