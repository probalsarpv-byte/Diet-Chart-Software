import { FunctionalLabs, LabFlag } from '../types';

function isValidNumber(val: any): val is number {
  return typeof val === 'number' && !isNaN(val) && isFinite(val) && val >= 0;
}

/**
 * Functional Lab Analyzer
 * Evaluates biomarkers against strict Functional Medicine Optimal Targets
 * and clearly separates functional risk indicators from clinical diagnostic thresholds.
 */
export function analyzeFunctionalLabs(labs: Partial<FunctionalLabs>, gender: 'male' | 'female' = 'female'): FunctionalLabs {
  const flags: LabFlag[] = [];

  // 1. HOMA-IR Calculation
  let homa_ir: number | undefined = undefined;
  let homa_ir_status_en: string | undefined = undefined;
  let homa_ir_status_bn: string | undefined = undefined;

  if (isValidNumber(labs.fasting_glucose) && isValidNumber(labs.fasting_insulin)) {
    homa_ir = Math.round(((labs.fasting_glucose * labs.fasting_insulin) / 405) * 100) / 100;
    if (homa_ir < 1.4) {
      homa_ir_status_en = "Optimal Insulin Sensitivity (<1.4)";
      homa_ir_status_bn = "উত্তম ইনসুলিন সংবেদনশীলতা (<১.৪)";
    } else if (homa_ir <= 1.9) {
      homa_ir_status_en = "Early Functional Insulin Resistance Risk (1.4 - 1.9)";
      homa_ir_status_bn = "প্রাথমিক ইনসুলিন রেজিস্ট্যান্স ঝুঁকি (১.৪ - ১.৯)";
    } else if (homa_ir <= 2.9) {
      homa_ir_status_en = "Moderate Insulin Resistance Risk (2.0 - 2.9)";
      homa_ir_status_bn = "মাঝারি ইনসুলিন রেজিস্ট্যান্স ঝুঁকি (২.০ - ২.৯)";
    } else {
      homa_ir_status_en = "High Hyperinsulinemic Risk (≥3.0)";
      homa_ir_status_bn = "উচ্চ ইনসুলিন রেজিস্ট্যান্স ঝুঁকি (≥৩.০)";
    }

    flags.push({
      marker: "HOMA-IR (Calculated)",
      value: homa_ir,
      unit: "Index",
      conventional_range: "< 2.5",
      optimal_range: "< 1.4",
      status: homa_ir < 1.4 ? 'optimal' : homa_ir <= 1.9 ? 'borderline' : 'abnormal',
      is_diagnostic_threshold: false,
      insight_en: homa_ir < 1.4 
        ? "Excellent cellular glucose uptake." 
        : "Cellular insulin receptor desensitization indicator; warrants low-glycemic, anti-inflammatory dietary protocol.",
      insight_bn: homa_ir < 1.4 
        ? "কোষে গ্লুকোজ প্রবেশ স্বাভাবিক ও সংবেদনশীল।" 
        : "কোষে ইনসুলিন রেজিস্ট্যান্স নির্দেশক; লো-গ্লাইসেমিক খাদ্যতালিকা ও স্বাস্থ্যকর জীবনধারা প্রয়োজন।"
    });
  }

  // 2. TG / HDL Ratio Calculation
  let tg_hdl_ratio: number | undefined = undefined;
  let tg_hdl_status_en: string | undefined = undefined;
  let tg_hdl_status_bn: string | undefined = undefined;

  if (isValidNumber(labs.triglycerides) && isValidNumber(labs.hdl) && labs.hdl > 0) {
    tg_hdl_ratio = Math.round((labs.triglycerides / labs.hdl) * 100) / 100;
    if (tg_hdl_ratio < 1.5) {
      tg_hdl_status_en = "Optimal Cardioprotective Pattern (<1.5)";
      tg_hdl_status_bn = "চমৎকার কার্ডিওপ্রোটেক্টিভ মাত্রা (<১.৫)";
    } else if (tg_hdl_ratio <= 3.0) {
      tg_hdl_status_en = "Borderline Atherogenic Dyslipidemia Risk (1.5 - 3.0)";
      tg_hdl_status_bn = "সীমান্তবর্তী এথেরোজেনিক ডিসলিপিডেমিয়া ঝুঁকি (১.৫ - ৩.০)";
    } else {
      tg_hdl_status_en = "Elevated Atherogenic Risk Pattern (>3.0)";
      tg_hdl_status_bn = "উচ্চ এথেরোজেনিক ও কার্ডিওভাসকুলার ঝুঁকি (>৩.০)";
    }

    flags.push({
      marker: "Triglyceride / HDL Ratio",
      value: tg_hdl_ratio,
      unit: "Ratio",
      conventional_range: "< 3.0",
      optimal_range: "< 1.5",
      status: tg_hdl_ratio < 1.5 ? 'optimal' : tg_hdl_ratio <= 3.0 ? 'borderline' : 'abnormal',
      is_diagnostic_threshold: false,
      insight_en: tg_hdl_ratio < 1.5 
        ? "Predominantly large, buoyant, benign LDL subfractions." 
        : "Surrogate marker for atherogenic small dense LDL particles and hepatic de novo lipogenesis risk.",
      insight_bn: tg_hdl_ratio < 1.5 
        ? "রক্তে ক্ষতিকর ঘন এলডিএল কণা বৃদ্ধি লক্ষণীয় নয়।" 
        : "যকৃতে অতিরিক্ত চিনি/কার্বোহাইড্রেট থেকে চর্বি তৈরির লক্ষণ; পরিশোধিত চিনি ও প্রক্রিয়াজাত খাদ্য পরিহার আবশ্যক।"
    });
  }

  // 3. HbA1c
  if (isValidNumber(labs.hba1c)) {
    const val = labs.hba1c;
    const isOpt = val >= 4.8 && val <= 5.4;
    const isPred = val >= 5.5 && val <= 6.4;
    const isDiabetic = val >= 6.5;
    flags.push({
      marker: "HbA1c",
      value: val,
      unit: "%",
      conventional_range: "< 5.7%",
      optimal_range: "4.8 - 5.4%",
      status: isOpt ? 'optimal' : isPred ? 'borderline' : 'abnormal',
      is_diagnostic_threshold: isDiabetic,
      insight_en: isOpt 
        ? "Optimal 90-day glycation control." 
        : isPred 
        ? "Prediabetes risk range; functional lifestyle and dietary interventions highly effective." 
        : "Meets conventional diagnostic threshold for diabetes (≥6.5%); requires clinical physician co-management.",
      insight_bn: isOpt 
        ? "রক্তে গত ৩ মাসের গ্লুকোজ মাত্রা সম্পূর্ণ আদর্শ।" 
        : isPred 
        ? "ডায়াবেটিস পূর্ববর্তী স্তর (প্রি-ডায়াবেটিস ঝুঁকি); খাদ্যনিয়ন্ত্রণে শতভাগ প্রতিরোধযোগ্য।" 
        : "ডায়াবেটিসের ক্লিনিক্যাল ডায়াগনস্টিক মাত্রা (≥৬.৫%); ডাক্তারের তত্ত্বাবধান আবশ্যক।"
    });
  }

  // 4. Fasting Glucose
  if (isValidNumber(labs.fasting_glucose)) {
    const val = labs.fasting_glucose;
    const isOpt = val >= 72 && val <= 86;
    const isDiabetic = val >= 126;
    flags.push({
      marker: "Fasting Blood Glucose",
      value: val,
      unit: "mg/dL",
      conventional_range: "70 - 99 mg/dL",
      optimal_range: "72 - 86 mg/dL",
      status: isOpt ? 'optimal' : val <= 99 ? 'borderline' : 'abnormal',
      is_diagnostic_threshold: isDiabetic,
      insight_en: isOpt 
        ? "Optimal fasting metabolic baseline." 
        : val >= 126
        ? "Meets diagnostic threshold for fasting hyperglycemia (≥126 mg/dL)."
        : "Fasting glucose >86 mg/dL indicates early nocturnal hepatic gluconeogenesis upregulation risk.",
      insight_bn: isOpt 
        ? "খালি পেটে রক্তের শর্বরা আদর্শ সীমায় আছে।" 
        : val >= 126
        ? "খালি পেটে অনিয়ন্ত্রিত গ্লুকোজ মাত্রা (≥১২৬ মিলিগ্রাম/ডেসিলিটার)।"
        : "৮৬ এর উপরে খালি পেটের সুগার লিভার থেকে অতিরিক্ত গ্লুকোজ নিঃসরণের ঝুঁকি নির্দেশ করে।"
    });
  }

  // 5. Fasting Insulin
  if (isValidNumber(labs.fasting_insulin)) {
    const val = labs.fasting_insulin;
    const isOpt = val >= 2.0 && val <= 6.0;
    flags.push({
      marker: "Fasting Insulin",
      value: val,
      unit: "µIU/mL",
      conventional_range: "2.6 - 24.9 µIU/mL",
      optimal_range: "2.0 - 6.0 µIU/mL",
      status: isOpt ? 'optimal' : val <= 10.0 ? 'borderline' : 'abnormal',
      is_diagnostic_threshold: false,
      insight_en: isOpt 
        ? "Pancreatic beta-cells in calm, unstressed state." 
        : "Hyperinsulinemia indicator: pancreas may be overcompensating to maintain glucose homeostasis.",
      insight_bn: isOpt 
        ? "প্যানক্রিয়াস বা অগ্ন্যাশয় স্বাভাবিক শান্ত অবস্থায় আছে।" 
        : "হাইপারইনসুলিনেমিয়া নির্দেশক: সুগার নিয়ন্ত্রণে রাখতে অগ্ন্যাশয়কে অতিরিক্ত ইনসুলিন তৈরি করতে হচ্ছে।"
    });
  }

  // 6. TSH (Thyroid Stimulating Hormone)
  if (isValidNumber(labs.tsh)) {
    const val = labs.tsh;
    const isOpt = val >= 1.0 && val <= 2.2;
    flags.push({
      marker: "TSH",
      value: val,
      unit: "µIU/mL",
      conventional_range: "0.45 - 4.5 µIU/mL",
      optimal_range: "1.0 - 2.2 µIU/mL",
      status: isOpt ? 'optimal' : val < 0.45 ? 'critical' : val <= 3.5 ? 'borderline' : 'abnormal',
      is_diagnostic_threshold: val > 10 || val < 0.1,
      insight_en: isOpt 
        ? "Optimal pituitary-thyroid axis feedback." 
        : val > 2.2 
        ? "Functional subclinical hypothyroid risk indicator; evaluate selenium, zinc, and conversion cofactors." 
        : "Possible hyperthyroid state or excessive exogenous thyroid hormone.",
      insight_bn: isOpt 
        ? "থাইরয়েড গ্রন্থির হরমোন সংকেত সম্পূর্ণ স্বাভাবিক।" 
        : val > 2.2 
        ? "কার্যকরী সাবক্লিনিক্যাল হাইপোথাইরয়েড ঝুঁকি নির্দেশক; মেটাবলিজম ধীর হওয়ার লক্ষণ।" 
        : "হাইপারথাইরয়েড বা অতিরিক্ত থাইরক্সিন ডোজের লক্ষণ।"
    });
  }

  // 7. Vitamin D3 (25-OH-D3)
  if (isValidNumber(labs.vitamin_d3)) {
    const val = labs.vitamin_d3;
    const isOpt = val >= 50 && val <= 80;
    flags.push({
      marker: "Vitamin D3 (25-OH)",
      value: val,
      unit: "ng/mL",
      conventional_range: "> 30 ng/mL",
      optimal_range: "50 - 80 ng/mL",
      status: isOpt ? 'optimal' : val >= 30 ? 'borderline' : 'abnormal',
      is_diagnostic_threshold: false,
      insight_en: isOpt 
        ? "Optimal immunomodulatory and genomic nuclear hormone levels." 
        : "Suboptimal/Deficient: may impair insulin sensitivity and immune mucosal defense.",
      insight_bn: isOpt 
        ? "ইমিউনিটি ও হরমোন ভারসাম্যের জন্য আদর্শ।" 
        : "ঘাটতি নির্দেশক; ইনসুলিন রেজিস্ট্যান্স ঝুঁকি ও পেশি-হাড়ের কার্যকারিতা ব্যাহত হতে পারে।"
    });
  }

  // 8. Vitamin B12
  if (isValidNumber(labs.vitamin_b12)) {
    const val = labs.vitamin_b12;
    const isOpt = val >= 550 && val <= 950;
    flags.push({
      marker: "Vitamin B12",
      value: val,
      unit: "pg/mL",
      conventional_range: "200 - 900 pg/mL",
      optimal_range: "550 - 950 pg/mL",
      status: isOpt ? 'optimal' : val >= 400 ? 'borderline' : 'abnormal',
      is_diagnostic_threshold: false,
      insight_en: isOpt 
        ? "Adequate cellular methylation and myelin sheath maintenance." 
        : "Levels <500 pg/mL may associate with neurological fatigue and elevated homocysteine risk.",
      insight_bn: isOpt 
        ? "স্নায়ু ও কোষ মেরামতের জন্য পর্যাপ্ত।" 
        : "৫০০ এর নিচে বি১২ থাকলে ক্লান্তি ও স্নায়বিক অবসাদের ঝুঁকি বৃদ্ধি পায়।"
    });
  }

  // 9. Ferritin
  if (isValidNumber(labs.ferritin)) {
    const val = labs.ferritin;
    const minOpt = gender === 'female' ? 40 : 50;
    const maxOpt = gender === 'female' ? 120 : 150;
    const isOpt = val >= minOpt && val <= maxOpt;
    flags.push({
      marker: "Ferritin (Iron Stores)",
      value: val,
      unit: "ng/mL",
      conventional_range: gender === 'female' ? "15 - 150 ng/mL" : "30 - 400 ng/mL",
      optimal_range: `${minOpt} - ${maxOpt} ng/mL`,
      status: isOpt ? 'optimal' : val < minOpt ? 'abnormal' : 'borderline',
      is_diagnostic_threshold: false,
      insight_en: isOpt 
        ? "Balanced cellular iron stores without oxidative overload." 
        : val < minOpt 
        ? "Low iron storage indicator; may affect thyroid conversion and cellular respiration." 
        : "Elevated ferritin may serve as an acute-phase reactant indicating systemic inflammation.",
      insight_bn: isOpt 
        ? "শরীরে আয়রনের অভ্যন্তরীণ রিজার্ভ পর্যাপ্ত।" 
        : val < minOpt 
        ? "আয়রনের রিজার্ভ কম; ক্লান্তি ও বিপাকীয় কার্যকারিতা ব্যাহত হওয়ার ঝুঁকি।" 
        : "উচ্চ ফেরিটিন শরীরে প্রদাহ বা ফ্যাটি লিভারের সংকেত হতে পারে।"
    });
  }

  // 10. Uric Acid
  if (isValidNumber(labs.uric_acid)) {
    const val = labs.uric_acid;
    const isOpt = val >= 3.5 && val <= 5.5;
    flags.push({
      marker: "Serum Uric Acid",
      value: val,
      unit: "mg/dL",
      conventional_range: "< 7.0 mg/dL",
      optimal_range: "3.5 - 5.5 mg/dL",
      status: isOpt ? 'optimal' : val <= 6.5 ? 'borderline' : 'abnormal',
      is_diagnostic_threshold: val >= 7.0,
      insight_en: isOpt 
        ? "Normal purine metabolism and antioxidant balance." 
        : "Uric acid >5.5 mg/dL indicates purine accumulation and potential endothelial strain.",
      insight_bn: isOpt 
        ? "ইউরিক অ্যাসিড আদর্শ মাত্রায় আছে।" 
        : "৫.৫ এর বেশি ইউরিক অ্যাসিড পিউরিন বিপাকের চাপ ও রক্তনালীর প্রদাহের ঝুঁকি নির্দেশ করে।"
    });
  }

  // 11. ALT (Alanine Aminotransferase)
  if (isValidNumber(labs.alt)) {
    const val = labs.alt;
    const isOpt = val >= 10 && val <= 25;
    flags.push({
      marker: "ALT (SGPT)",
      value: val,
      unit: "U/L",
      conventional_range: "< 45 U/L",
      optimal_range: "10 - 25 U/L",
      status: isOpt ? 'optimal' : val <= 35 ? 'borderline' : 'abnormal',
      is_diagnostic_threshold: val >= 80,
      insight_en: isOpt 
        ? "Healthy hepatocyte cell integrity." 
        : "ALT >25 U/L is a functional marker for hepatic metabolic overload / fatty liver risk.",
      insight_bn: isOpt 
        ? "লিভারের হেপাটোসাইট কোষ স্বাভাবিক।" 
        : "২৫ এর বেশি এসজিপিটি ফ্যাটি লিভার ও যকৃতে বিপাকীয় চাপের প্রাথমিক নির্দেশক।"
    });
  }

  return {
    ...labs,
    homa_ir,
    homa_ir_status_en,
    homa_ir_status_bn,
    tg_hdl_ratio,
    tg_hdl_status_en,
    tg_hdl_status_bn,
    lab_flags: flags
  };
}
