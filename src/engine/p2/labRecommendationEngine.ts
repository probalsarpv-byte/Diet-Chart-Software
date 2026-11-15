// P2 Personalized Laboratory Recommendation Engine
// Deterministic rule-based laboratory recommendations tailored to patient symptoms,
// hypotheses, conditions, medications, and clinical safety priority.

import { PatientProfile } from '../../types';
import {
  ClinicalObservation,
  ClinicalHypothesis,
  FunctionalDomain,
  LabPriority,
  LabRecommendation,
} from './types';

interface LabRule {
  id: string;
  testName_en: string;
  testName_bn: string;
  category: LabRecommendation['category'];
  basePriority: LabPriority;
  specimenType: string;
  fastingRequirement_en: string;
  fastingRequirement_bn: string;
  clinicalRationale_en: string;
  clinicalRationale_bn: string;
  interpretationGuidance_en: string;
  interpretationGuidance_bn: string;
  associatedDomain: FunctionalDomain;
  matchedLabKey?: keyof PatientProfile['labs'];
  triggerCondition: (
    patient: PatientProfile,
    observations: ClinicalObservation[],
    hypotheses: ClinicalHypothesis[],
    hasRecordedLab: boolean
  ) => { shouldRecommend: boolean; elevatedPriority?: LabPriority };
}

const LAB_RECOMMENDATION_CATALOG: LabRule[] = [
  // ─── 1. Glycemic Panel ──────────────────────────────────────────
  {
    id: 'lab_fasting_glucose',
    testName_en: 'Fasting Blood Glucose (FBG)',
    testName_bn: 'ফাস্টিং ব্লাড গ্লুকোজ (FBG)',
    category: 'metabolic',
    basePriority: 'routine_consideration',
    specimenType: 'Venous blood (Fluoride/Oxalate tube)',
    fastingRequirement_en: 'Strict 8–10 hours overnight fasting (water permitted)',
    fastingRequirement_bn: 'রাতভর ৮-১০ ঘণ্টা পানি ছাড়া অন্য কিছু না খেয়ে পরীক্ষা',
    clinicalRationale_en: 'Evaluates baseline fasting glycemic regulation, ruling out prediabetes and overt diabetes mellitus.',
    clinicalRationale_bn: 'বেসলাইন গ্লাইসেমিক নিয়ন্ত্রণ মূল্যায়ন এবং প্রিডায়াবেটিস বা ডায়াবেটিস নির্ণয়ে সহায়ক।',
    interpretationGuidance_en: 'Normal: 70–99 mg/dL. Impaired Fasting Glucose (Prediabetes): 100–125 mg/dL. Diabetic range: >= 126 mg/dL.',
    interpretationGuidance_bn: 'স্বাভাবিক: ৭০-৯৯ মিগ্রা/ডেসিলিটার। প্রিডায়াবেটিস: ১০০-১২৫ মিগ্রা/ডেসিলিটার। ডায়াবেটিস: ১২৬ বা তার বেশি।',
    associatedDomain: 'energy',
    matchedLabKey: 'fasting_glucose',
    triggerCondition: (patient, obs, hypotheses, hasRecordedLab) => {
      const hasHypoMeds = patient.active_medications.some(m =>
        /insulin|gliclazide|glimepiride|glipizide|repaglinide/i.test(m)
      );
      if (hasHypoMeds && !hasRecordedLab) {
        return { shouldRecommend: true, elevatedPriority: 'immediate_clinical_evaluation' };
      }
      const hasIR = hypotheses.some(h => h.cluster === 'metabolic') || patient.selected_conditions.includes('t2d_ir');
      return { shouldRecommend: true, elevatedPriority: hasIR ? 'high_priority' : 'routine_consideration' };
    },
  },
  {
    id: 'lab_hba1c',
    testName_en: 'Glycated Hemoglobin (HbA1c)',
    testName_bn: 'হিমোগ্লোবিন এওয়ানসি (HbA1c)',
    category: 'metabolic',
    basePriority: 'high_priority',
    specimenType: 'Venous whole blood (EDTA tube)',
    fastingRequirement_en: 'No fasting required (can be drawn anytime)',
    fastingRequirement_bn: 'উপবাসের প্রয়োজন নেই (যে কোনো সময় রক্ত দেওয়া যায়)',
    clinicalRationale_en: 'Provides a 3-month retrospective index of average glycemic control, unaffected by acute post-meal fluctuations.',
    clinicalRationale_bn: 'বিগত ৩ মাসের গড় রক্তের শর্করা স্তর প্রতিফলিত করে, যা তাৎক্ষণিক খাদ্য পরিবর্তনের দ্বারা প্রভাবিত হয় না।',
    interpretationGuidance_en: 'Normal: < 5.7%. Prediabetes: 5.7–6.4%. Diabetes: >= 6.5%. Therapeutic target for most adults: < 7.0%.',
    interpretationGuidance_bn: 'স্বাভাবিক: < ৫.৭%। প্রিডায়াবেটিস: ৫.৭-৬.৪%। ডায়াবেটিস: >= ৬.৫%।',
    associatedDomain: 'energy',
    matchedLabKey: 'hba1c',
    triggerCondition: (patient, obs, hypotheses) => {
      const bmi = patient.calculated?.bmi || (patient.height_cm ? patient.weight_kg / Math.pow(patient.height_cm / 100, 2) : 22);
      const hasMetabolic = patient.selected_conditions.includes('t2d_ir') ||
        patient.selected_conditions.includes('pcos') ||
        hypotheses.some(h => h.cluster === 'metabolic') ||
        bmi >= 25;
      return { shouldRecommend: true, elevatedPriority: hasMetabolic ? 'high_priority' : 'routine_consideration' };
    },
  },
  {
    id: 'lab_fasting_insulin_homa',
    testName_en: 'Fasting Serum Insulin & HOMA-IR',
    testName_bn: 'ফাস্টিং সিরাম ইনসুলিন ও হোমা-আইআর (HOMA-IR)',
    category: 'metabolic',
    basePriority: 'high_priority',
    specimenType: 'Fasting venous blood (Serum separator tube)',
    fastingRequirement_en: 'Strict 10–12 hours overnight fasting',
    fastingRequirement_bn: '১০-১২ ঘণ্টা রাতভর উপবাস বাধ্যতামূলক',
    clinicalRationale_en: 'Detects functional compensatory hyperinsulinemia and cellular insulin resistance years before fasting glucose elevation occurs.',
    clinicalRationale_bn: 'রক্তে গ্লুকোজ বাড়ার বহু বছর আগেই কোষীয় ইনসুলিন রেজিস্ট্যান্স ও অতিরিক্ত ইনসুলিন নিঃসরণ শনাক্ত করে।',
    interpretationGuidance_en: 'Optimal Fasting Insulin: 2–6 uIU/mL. HOMA-IR < 1.4: Insulin Sensitive. 1.4–1.9: Early resistance. > 1.9: Significant insulin resistance.',
    interpretationGuidance_bn: 'অপটিমাল ইনসুলিন: ২-৬ uIU/mL। HOMA-IR < ১.৪: স্বাভাবিক। ১.৪-১.৯: বর্ডারলাইন। > ১.৯: স্পষ্ট ইনসুলিন রেজিস্ট্যান্স।',
    associatedDomain: 'energy',
    matchedLabKey: 'fasting_insulin',
    triggerCondition: (patient, obs) => {
      const irIndications = patient.selected_conditions.includes('pcos') ||
        patient.selected_conditions.includes('fatty_liver') ||
        patient.selected_conditions.includes('t2d_ir') ||
        (patient.waist_cm && patient.height_cm && (patient.waist_cm / patient.height_cm) > 0.5) ||
        obs.some(o => o.tags?.includes('sugar_cravings') || o.tags?.includes('postprandial_fatigue'));
      return { shouldRecommend: Boolean(irIndications), elevatedPriority: 'high_priority' };
    },
  },

  // ─── 2. Lipid Panel ─────────────────────────────────────────────
  {
    id: 'lab_lipid_profile',
    testName_en: 'Comprehensive Fasting Lipid Profile (TC, TG, HDL, LDL, VLDL)',
    testName_bn: 'ফাস্টিং লিপিড প্রোফাইল (কোলেস্টেরল, ট্রাইগ্লিসারাইড, এইচডিএল, এলডিএল)',
    category: 'metabolic',
    basePriority: 'routine_consideration',
    specimenType: 'Venous blood (Serum)',
    fastingRequirement_en: '10–12 hours overnight fasting (avoid heavy fatty meal the prior evening)',
    fastingRequirement_bn: '১০-১২ ঘণ্টার উপবাস (পূর্বের রাতে অতিরিক্ত চর্বিযুক্ত খাবার পরিহার্য)',
    clinicalRationale_en: 'Evaluates atherogenic dyslipidemia, atherogenic index (TG/HDL ratio), and cardiometabolic transport integrity.',
    clinicalRationale_bn: 'রক্তনালীর চর্বি জমা, ট্রাইগ্লিসারাইড/এইচডিএল অনুপাত এবং হৃদরোগের ঝুঁকি মূল্যায়ন করে।',
    interpretationGuidance_en: 'Optimal: TG < 150 mg/dL, HDL > 40 mg/dL (M) / > 50 mg/dL (F), TG/HDL ratio < 2.0 (ratio > 3.0 indicates small dense LDL / insulin resistance).',
    interpretationGuidance_bn: 'ট্রাইগ্লিসারাইড < ১৫০ মিগ্রা/ডেসিলিটার, এইচডিএল > ৪০-৫০ মিগ্রা/ডেসিলিটার। TG/HDL অনুপাত ২.০ এর নিচে কাম্য।',
    associatedDomain: 'transport',
    matchedLabKey: 'triglycerides',
    triggerCondition: (patient) => {
      const hasCvdRisk = patient.selected_conditions.includes('hypertension_ckd') ||
        patient.selected_conditions.includes('fatty_liver') ||
        (patient.labs.triglycerides && patient.labs.triglycerides > 150);
      return { shouldRecommend: true, elevatedPriority: hasCvdRisk ? 'high_priority' : 'routine_consideration' };
    },
  },

  // ─── 3. Hepatic Panel ───────────────────────────────────────────
  {
    id: 'lab_liver_function',
    testName_en: 'Liver Function Panel (ALT/SGPT, AST/SGOT, Bilirubin, Alkaline Phosphatase)',
    testName_bn: 'লিভার ফাংশন টেস্ট (ALT, AST, বিলিরুবিন, ক্ষারীয় ফসফেটেস)',
    category: 'hepatic',
    basePriority: 'routine_consideration',
    specimenType: 'Venous blood (Serum)',
    fastingRequirement_en: '4–8 hours fasting preferred',
    fastingRequirement_bn: '৪-৮ ঘণ্টা সাধারণ উপবাস কাম্য',
    clinicalRationale_en: 'Assesses hepatocellular integrity, hepatic biotransformation capacity, and non-alcoholic fatty liver disease (NAFLD) progression.',
    clinicalRationale_bn: 'লিভারের কোষের ক্ষতি, ফ্যাটি লিভার এবং লিভারের টক্সিন নিষ্কাশন ক্ষমতা মূল্যায়ন।',
    interpretationGuidance_en: 'Optimal functional ALT < 25 U/L (female), < 30 U/L (male). Conventional reference often goes up to 45–55 U/L.',
    interpretationGuidance_bn: 'ফাংশনাল নরমাল ALT: ২৫ U/L এর নিচে (মহিলা) এবং ৩০ U/L এর নিচে (পুরুষ)।',
    associatedDomain: 'biotransformation',
    matchedLabKey: 'alt',
    triggerCondition: (patient, obs) => {
      const hasHepatic = patient.selected_conditions.includes('fatty_liver') ||
        patient.active_medications.some(m => /statin|methotrexate|paracetamol|isoniazid/i.test(m)) ||
        obs.some(o => o.tags?.includes('hepatotoxic_medication'));
      return { shouldRecommend: true, elevatedPriority: hasHepatic ? 'high_priority' : 'routine_consideration' };
    },
  },

  // ─── 4. Renal Panel ─────────────────────────────────────────────
  {
    id: 'lab_renal_function',
    testName_en: 'Renal Function Profile (Serum Creatinine, eGFR, Blood Urea Nitrogen, Uric Acid)',
    testName_bn: 'রেনাল ফাংশন প্রোফাইল (সিরাম ক্রিয়েটিনিন, ইজিএফআর, ইউরিক এসিড)',
    category: 'renal',
    basePriority: 'routine_consideration',
    specimenType: 'Venous blood (Serum)',
    fastingRequirement_en: 'No strict fasting, but avoid high cooked meat meal 12 hours prior',
    fastingRequirement_bn: 'কঠোর উপবাস দরকার নেই, তবে আগের ১২ ঘণ্টায় অতিরিক্ত মাংস পরিহার করুন',
    clinicalRationale_en: 'Monitors glomerular filtration, clearance of nitrogenous wastes, and purine metabolism for dietary protein and purine tolerance.',
    clinicalRationale_bn: 'কিডনির ছাঁকন ক্ষমতা (eGFR) এবং ইউরিক এসিড মূল্যায়ন, যা খাদ্যতালিকায় প্রোটিনের মাত্রা নির্ধারণে অপরিহার্য।',
    interpretationGuidance_en: 'Creatinine: 0.6–1.2 mg/dL. eGFR > 90 mL/min/1.73m2. Uric acid: 3.5–6.0 mg/dL.',
    interpretationGuidance_bn: 'ক্রিয়েটিনিন: ০.৬-১.২ মিগ্রা/ডেসিলিটার। eGFR ৯০ এর বেশি কাম্য। ইউরিক এসিড ৩.৫-৬.০ মিগ্রা।',
    associatedDomain: 'biotransformation',
    matchedLabKey: 'uric_acid',
    triggerCondition: (patient) => {
      const hasRenal = patient.selected_conditions.includes('hypertension_ckd') ||
        patient.selected_conditions.includes('uric_acid_gout') ||
        (patient.labs.uric_acid && patient.labs.uric_acid > 6.5);
      return { shouldRecommend: true, elevatedPriority: hasRenal ? 'high_priority' : 'routine_consideration' };
    },
  },

  // ─── 5. Thyroid Panel ───────────────────────────────────────────
  {
    id: 'lab_thyroid_profile',
    testName_en: 'Thyroid Function Panel (TSH, Free T4, Free T3)',
    testName_bn: 'থাইরয়েড ফাংশন প্যানেল (TSH, Free T4, Free T3)',
    category: 'thyroid',
    basePriority: 'routine_consideration',
    specimenType: 'Morning venous blood (Serum)',
    fastingRequirement_en: 'Morning fasting blood sample (before taking morning thyroid medication)',
    fastingRequirement_bn: 'সকালের খালি পেটে রক্ত দেওয়া উত্তম (সকালের থাইরয়েড ওষুধ খাওয়ার পূর্বে)',
    clinicalRationale_en: 'Evaluates pituitary-thyroid communication axis controlling cellular metabolic rate, temperature, and gut motility.',
    clinicalRationale_bn: 'কোষীয় মেটাবলিজম, দেহের তাপমাত্রা ও অন্ত্রের গতিশীলতা নিয়ন্ত্রণকারী থাইরয়েড হরমোন মূল্যায়ন।',
    interpretationGuidance_en: 'Functional optimal TSH: 1.0–2.5 uIU/mL. Conventional lab range: 0.4–4.5 uIU/mL.',
    interpretationGuidance_bn: 'ফাংশনাল অপটিমাল TSH: ১.০-২.৫ uIU/mL। ৪.৫ এর বেশি হলে সাবক্লিনিক্যাল হাইপোথাইরয়েডিজম নির্দেশ করে।',
    associatedDomain: 'communication',
    matchedLabKey: 'tsh',
    triggerCondition: (patient, obs) => {
      const hasThyroid = patient.selected_conditions.includes('hypothyroid') ||
        obs.some(o => o.tags?.includes('abnormal_tsh') || o.tags?.includes('cold_intolerance') || o.tags?.includes('unexplained_weight_gain'));
      return { shouldRecommend: true, elevatedPriority: hasThyroid ? 'high_priority' : 'routine_consideration' };
    },
  },

  // ─── 6. Anemia & Iron Panel ─────────────────────────────────────
  {
    id: 'lab_cbc_ferritin',
    testName_en: 'Complete Blood Count (CBC) with Peripheral Blood Film & Serum Ferritin',
    testName_bn: 'সিবিসি (CBC) ও সিরাম ফেরিটিন (লৌহ সঞ্চয় পরীক্ষা)',
    category: 'hematology_iron',
    basePriority: 'high_priority',
    specimenType: 'Venous blood (EDTA + Serum)',
    fastingRequirement_en: 'No fasting required',
    fastingRequirement_bn: 'উপবাসের প্রয়োজন নেই',
    clinicalRationale_en: 'Differentiates microcytic iron deficiency anemia, macrocytic B12/folate deficiency, and cellular iron storage depletion.',
    clinicalRationale_bn: 'রক্তস্বল্পতার ধরন (লৌহ বনাম ভিটামিন বি১২ ঘাটতি) এবং দেহে সংরক্ষিত লোহার সঠিক পরিমাণ নির্ণয়।',
    interpretationGuidance_en: 'Hemoglobin: 12–15 g/dL (F), 13.5–17.5 g/dL (M). Optimal Ferritin: 50–100 ng/mL (< 30 indicates iron storage depletion).',
    interpretationGuidance_bn: 'হিমোগ্লোবিন ১২-১৫ (মহিলা), ১৩.৫-১৭.৫ (পুরুষ)। অপটিমাল ফেরিটিন: ৫০-১০০ ng/mL। ৩০ এর নিচে লৌহ ঘাটতি।',
    associatedDomain: 'transport',
    matchedLabKey: 'ferritin',
    triggerCondition: (patient, obs) => {
      const isFemale = patient.gender === 'female';
      const isPreg = patient.population_group === 'pregnancy';
      const hasFatigue = obs.some(o => o.tags?.includes('fatigue') || o.tags?.includes('pallor'));
      const elevated = isPreg || (hasFatigue && isFemale);
      return { shouldRecommend: true, elevatedPriority: elevated ? 'high_priority' : 'routine_consideration' };
    },
  },

  // ─── 7. Micronutrient Panel ─────────────────────────────────────
  {
    id: 'lab_vitamin_d3',
    testName_en: 'Serum 25-Hydroxyvitamin D3 [25(OH)D]',
    testName_bn: 'সিরাম ভিটামিন ডি৩ [25(OH)D]',
    category: 'vitamins_minerals',
    basePriority: 'routine_consideration',
    specimenType: 'Venous blood (Serum)',
    fastingRequirement_en: 'No fasting required',
    fastingRequirement_bn: 'উপবাসের প্রয়োজন নেই',
    clinicalRationale_en: 'Critical secosteroid hormone modulating immune defense, calcium homeostasis, bone density, and insulin sensitivity.',
    clinicalRationale_bn: 'রোগ প্রতিরোধ ক্ষমতা, হাড়ের ঘনত্ব, ক্যালসিয়াম শোষণ এবং ইনসুলিন সংবেদনশীলতার জন্য প্রধান নিয়ামক।',
    interpretationGuidance_en: 'Deficient: < 20 ng/mL. Insufficient: 20–29 ng/mL. Optimal functional target: 40–60 ng/mL.',
    interpretationGuidance_bn: 'ঘাটতি: < ২০ ng/mL। অপর্যাপ্ত: ২০-২৯ ng/mL। কার্যকরী লক্ষ্যমাত্রা: ৪০-৬০ ng/mL।',
    associatedDomain: 'structural_integrity',
    matchedLabKey: 'vitamin_d3',
    triggerCondition: (patient, obs) => {
      const hasSymptoms = obs.some(o => o.tags?.includes('bone_pain') || o.tags?.includes('muscle_weakness') || o.tags?.includes('low_vitamin_d3'));
      return { shouldRecommend: true, elevatedPriority: hasSymptoms ? 'high_priority' : 'routine_consideration' };
    },
  },
  {
    id: 'lab_vitamin_b12_folate',
    testName_en: 'Serum Vitamin B12 (Cobalamin) & Red Cell Folate',
    testName_bn: 'সিরাম ভিটামিন বি১২ ও ফোলেট',
    category: 'vitamins_minerals',
    basePriority: 'routine_consideration',
    specimenType: 'Fasting venous blood (Serum, protected from light)',
    fastingRequirement_en: 'Overnight fasting preferred',
    fastingRequirement_bn: 'রাতভর খালি পেটে রক্ত দেওয়া উত্তম',
    clinicalRationale_en: 'Evaluates one-carbon methylation pathways, nerve sheath myelination, and macrocytic anemia etiology, especially under metformin or PPI therapy.',
    clinicalRationale_bn: 'স্নায়ু সুরক্ষা, রক্তকণিকা গঠন এবং মেটফরমিন বা এসিডিটির ওষুধের দীর্ঘমেয়াদি ব্যবহারের পার্শ্বপ্রতিক্রিয়া যাচাই।',
    interpretationGuidance_en: 'Optimal functional B12: > 450 pg/mL (conventional lower limit of 200 pg/mL misses neurological B12 deficiency).',
    interpretationGuidance_bn: 'ফাংশনাল নরমাল B12: > ৪৫০ pg/mL। ২০০-৩৫০ রেঞ্জে স্নায়বিক লক্ষণ প্রকাশ পেতে পারে।',
    associatedDomain: 'energy',
    matchedLabKey: 'vitamin_b12',
    triggerCondition: (patient) => {
      const hasMetforminOrPPI = patient.active_medications.some(m =>
        /metformin|omeprazole|esomeprazole|pantoprazole|rabeprazole/i.test(m)
      );
      const isVeg = Boolean(patient.dietary_preferences?.is_vegetarian);
      return { shouldRecommend: true, elevatedPriority: (hasMetforminOrPPI || isVeg) ? 'high_priority' : 'routine_consideration' };
    },
  },

  // ─── 8. Inflammatory Panel ──────────────────────────────────────
  {
    id: 'lab_hscrp',
    testName_en: 'High-Sensitivity C-Reactive Protein (hs-CRP)',
    testName_bn: 'উচ্চ সংবেদনশীল সি-রিঅ্যাকটিভ প্রোটিন (hs-CRP)',
    category: 'inflammatory',
    basePriority: 'routine_consideration',
    specimenType: 'Venous blood (Serum)',
    fastingRequirement_en: 'No fasting required (ensure free of acute infection/fever)',
    fastingRequirement_bn: 'উপবাসের প্রয়োজন নেই (তীব্র জ্বর বা সংক্রমণ মুক্ত অবস্থায় পরীক্ষা কাম্য)',
    clinicalRationale_en: 'Measures low-grade systemic inflammation driving metabolic syndrome, endothelial dysfunction, and insulin resistance.',
    clinicalRationale_bn: 'কোষীয় দীর্ঘস্থায়ী প্রদাহ, হৃদরোগ ও ইনসুলিন রেজিস্ট্যান্সের অভ্যন্তরীণ তীব্রতা মূল্যায়ন।',
    interpretationGuidance_en: 'Low cardiovascular/systemic risk: < 1.0 mg/L. Moderate: 1.0–3.0 mg/L. High risk: > 3.0 mg/L (> 10 mg/L indicates acute infection/injury).',
    interpretationGuidance_bn: 'স্বল্প ঝুঁকি: < ১.০ mg/L। মাঝারি: ১.০-৩.০ mg/L। উচ্চ দীর্ঘস্থায়ী প্রদাহ: > ৩.০ mg/L।',
    associatedDomain: 'defense_repair',
    triggerCondition: (patient, obs, hypotheses) => {
      const hasInflammation = hypotheses.some(h => h.cluster === 'immune_inflammatory') ||
        patient.selected_conditions.includes('fatty_liver') ||
        obs.some(o => o.tags?.includes('joint_pain') || o.tags?.includes('elevated_crp'));
      return { shouldRecommend: Boolean(hasInflammation), elevatedPriority: 'high_priority' };
    },
  },

  // ─── 9. GI Functional Panel ─────────────────────────────────────
  {
    id: 'lab_stool_re',
    testName_en: 'Stool Routine & Microscopic Examination (Stool R/E)',
    testName_bn: 'মল রুটিন ও অণুবীক্ষণিক পরীক্ষা (Stool R/E)',
    category: 'gastrointestinal',
    basePriority: 'routine_consideration',
    specimenType: 'Fresh random stool specimen in sterile container',
    fastingRequirement_en: 'No fasting. Collect fresh sample within 1 hour of delivery to lab.',
    fastingRequirement_bn: 'উপবাস দরকার নেই। সংগ্রহের ১ ঘণ্টার মধ্যে ল্যাবে পৌঁছাতে হবে।',
    clinicalRationale_en: 'Screens for intestinal protozoa, helminthes, undigested food particles (maldigestion), mucus, and occult blood.',
    clinicalRationale_bn: 'পরজীবী কৃমি, প্রোটোজোয়া, অপাচ্য খাদ্যকণা (হজমের ঘাটতি) এবং অন্ত্রের প্রদাহ শনাক্তকরণ।',
    interpretationGuidance_en: 'Normally negative for parasites, reducing substances, pus cells, and RBCs. Undigested starch/fat indicates pancreatic or bile acid insufficiency.',
    interpretationGuidance_bn: 'স্বাভাবিক মলে রক্ত, পুঁজ বা পরজীবী থাকে না। চর্বি বা শ্বেতসার উপস্থিতি দুর্বল হজম নির্দেশ করে।',
    associatedDomain: 'assimilation',
    triggerCondition: (patient, obs) => {
      const hasGi = obs.some(o =>
        o.tags?.includes('bloating') ||
        o.tags?.includes('diarrhea') ||
        o.tags?.includes('constipation') ||
        o.tags?.includes('abdominal_pain')
      );
      return { shouldRecommend: hasGi, elevatedPriority: 'routine_consideration' };
    },
  },
  {
    id: 'lab_stool_calprotectin',
    testName_en: 'Fecal Calprotectin Quantitative Assay',
    testName_bn: 'ফিকাল ক্যালপ্রোটেকটিন পরীক্ষা (অন্ত্রের প্রদাহ সূচক)',
    category: 'gastrointestinal',
    basePriority: 'optional_conditional',
    specimenType: 'First morning stool sample in sterile container',
    fastingRequirement_en: 'No fasting. Avoid NSAIDs for 48 hours prior if clinically permitted.',
    fastingRequirement_bn: 'উপবাস দরকার নেই। আগের ৪৮ ঘণ্টা সম্ভব হলে ব্যথানাশক ওষুধ পরিহার করুন।',
    clinicalRationale_en: 'Differentiates functional bowel disorders (IBS) from organic inflammatory bowel disease (Crohn\'s / Ulcerative Colitis).',
    clinicalRationale_bn: 'ফাংশনাল আইবিএস (IBS) বনাম প্রকৃত অন্ত্রের প্রদাহজনিত রোগ (IBD) আলাদা করতে সাহায্য করে।',
    interpretationGuidance_en: 'Normal: < 50 ug/g. Borderline: 50–120 ug/g. Significant active inflammation: > 120 ug/g (requires gastroenterology referral).',
    interpretationGuidance_bn: 'স্বাভাবিক: < ৫০ ug/g। বর্ডারলাইন: ৫০-১২০ ug/g। সক্রিয় অন্ত্রের প্রদাহ: > ১২০ ug/g।',
    associatedDomain: 'assimilation',
    triggerCondition: (patient, obs) => {
      const hasChronicSevereGi = obs.some(o =>
        (o.tags?.includes('diarrhea') || o.tags?.includes('gi_bleeding') || o.tags?.includes('abdominal_pain')) &&
        (o.severity === 'moderate' || o.severity === 'severe')
      );
      return { shouldRecommend: hasChronicSevereGi, elevatedPriority: 'optional_conditional' };
    },
  },
  {
    id: 'lab_hpylori_antigen',
    testName_en: 'Helicobacter pylori Stool Antigen Test',
    testName_bn: 'এইচ পাইলোরি স্টুল অ্যান্টিজেন পরীক্ষা (H. pylori)',
    category: 'gastrointestinal',
    basePriority: 'high_priority',
    specimenType: 'Stool specimen in clean container',
    fastingRequirement_en: 'Off PPIs for 2 weeks and antibiotics for 4 weeks for accurate detection',
    fastingRequirement_bn: 'সঠিক ফলাফলের জন্য ২ সপ্তাহ এসিডিটির ওষুধ এবং ৪ সপ্তাহ অ্যান্টিবায়োটিক বন্ধ রাখা কাম্য',
    clinicalRationale_en: 'Detects active gastric infection with H. pylori responsible for peptic ulceration, chronic gastritis, and hypochlorhydria.',
    clinicalRationale_bn: 'গ্যাস্ট্রিক আলসার, দীর্ঘমেয়াদী গ্যাস্ট্রাইটিস এবং পাকস্থলীর এসিডের ভারসাম্য নষ্টকারী ব্যাকটেরিয়া শনাক্তকরণ।',
    interpretationGuidance_en: 'Positive: Active infection present requiring medical eradication therapy. Negative: No active colonization detected.',
    interpretationGuidance_bn: 'পজিটিভ হলে ডাক্তারের নির্দেশ অনুযায়ী অ্যান্টিবায়োটিক চিকিৎসা প্রয়োজন।',
    associatedDomain: 'assimilation',
    triggerCondition: (patient, obs) => {
      const hasUpperGi = obs.some(o =>
        o.tags?.includes('acid_reflux') ||
        o.tags?.includes('heartburn') ||
        o.tags?.includes('epigastric_pain') ||
        o.tags?.includes('nausea')
      );
      return { shouldRecommend: hasUpperGi, elevatedPriority: 'high_priority' };
    },
  },
];

export function generateLabRecommendations(
  patient: PatientProfile,
  observations: ClinicalObservation[],
  hypotheses: ClinicalHypothesis[]
): LabRecommendation[] {
  const recommendations: LabRecommendation[] = [];
  const recordedLabs = patient.labs || ({} as PatientProfile['labs']);

  for (const rule of LAB_RECOMMENDATION_CATALOG) {
    let isAlreadyRecorded = false;
    let recordedValue: string | number | undefined = undefined;

    if (rule.matchedLabKey && recordedLabs[rule.matchedLabKey] !== undefined) {
      const val = recordedLabs[rule.matchedLabKey];
      if (typeof val === 'number' || typeof val === 'string') {
        isAlreadyRecorded = true;
        recordedValue = val;
      }
    } else {
      const matchingObs = observations.find(o =>
        o.category === 'lab' &&
        (o.id.includes(rule.id) || (rule.matchedLabKey && o.tags?.includes(`obs_${rule.matchedLabKey}`)))
      );
      if (matchingObs) {
        isAlreadyRecorded = true;
        recordedValue = typeof matchingObs.observedValue === 'boolean'
          ? (matchingObs.observedValue ? 'Positive' : 'Negative')
          : matchingObs.observedValue;
      }
    }

    const { shouldRecommend, elevatedPriority } = rule.triggerCondition(
      patient,
      observations,
      hypotheses,
      isAlreadyRecorded
    );

    if (shouldRecommend) {
      const priority = elevatedPriority || rule.basePriority;

      const matchingHyp = hypotheses.find(h =>
        h.biologicalSystems.includes(rule.associatedDomain) ||
        h.requiredInvestigations.some(inv => rule.id.toLowerCase().includes(inv.toLowerCase()))
      );

      recommendations.push({
        id: rule.id,
        testName_en: rule.testName_en,
        testName_bn: rule.testName_bn,
        category: rule.category,
        clinicalRationale_en: rule.clinicalRationale_en,
        clinicalRationale_bn: rule.clinicalRationale_bn,
        triggeringFindingIds: matchingHyp ? [matchingHyp.id] : [],
        priority,
        existingTestStatus: isAlreadyRecorded ? 'tested' : 'pending',
        lastKnownValue: recordedValue,
        lastTestedDate: isAlreadyRecorded ? patient.visit_date : undefined,
        missingInformationToClarify: isAlreadyRecorded ? [] : [rule.testName_en],
        requiresClinicianApproval: priority === 'immediate_clinical_evaluation' || priority === 'high_priority',
        clinicianApproved: false,
        specimenType: rule.specimenType,
        fastingRequirement_en: rule.fastingRequirement_en,
        fastingRequirement_bn: rule.fastingRequirement_bn,
        interpretationGuidance_en: rule.interpretationGuidance_en,
        interpretationGuidance_bn: rule.interpretationGuidance_bn,
        isAlreadyRecorded,
      });
    }
  }

  const priorityWeight: Record<LabPriority, number> = {
    immediate_clinical_evaluation: 1,
    high_priority: 2,
    routine_consideration: 3,
    optional_conditional: 4,
    not_indicated: 5,
  };

  return recommendations.sort((a, b) => {
    if (a.existingTestStatus !== b.existingTestStatus) {
      return a.existingTestStatus === 'pending' ? -1 : 1;
    }
    return priorityWeight[a.priority] - priorityWeight[b.priority];
  });
}
