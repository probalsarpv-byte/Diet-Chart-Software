import { FunctionalLabs, LabFlag } from '../types';

/**
 * Functional Lab Analyzer
 * Evaluates biomarkers against strict Functional Medicine Optimal Targets
 * rather than standard disease-state laboratory reference ranges.
 */
export function analyzeFunctionalLabs(labs: Partial<FunctionalLabs>, gender: 'male' | 'female' = 'female'): FunctionalLabs {
  const flags: LabFlag[] = [];

  // 1. HOMA-IR Calculation
  let homa_ir: number | undefined = undefined;
  let homa_ir_status_en: string | undefined = undefined;
  let homa_ir_status_bn: string | undefined = undefined;

  if (labs.fasting_glucose && labs.fasting_insulin) {
    homa_ir = Math.round(((labs.fasting_glucose * labs.fasting_insulin) / 405) * 100) / 100;
    if (homa_ir < 1.4) {
      homa_ir_status_en = "Optimal Insulin Sensitivity (<1.4)";
      homa_ir_status_bn = "উত্তম ইনসুলিন সংবেদনশীলতা (<১.৪)";
    } else if (homa_ir <= 1.9) {
      homa_ir_status_en = "Early Insulin Resistance (1.4 - 1.9)";
      homa_ir_status_bn = "প্রাথমিক ইনসুলিন রেজিস্ট্যান্স (১.৪ - ১.৯)";
    } else if (homa_ir <= 2.9) {
      homa_ir_status_en = "Moderate Insulin Resistance (2.0 - 2.9)";
      homa_ir_status_bn = "মাঝারি ইনসুলিন রেজিস্ট্যান্স (২.০ - ২.৯)";
    } else {
      homa_ir_status_en = "Severe Hyperinsulinemic Resistance (≥3.0)";
      homa_ir_status_bn = "মারাত্মক ইনসুলিন রেজিস্ট্যান্স (≥৩.০)";
    }

    flags.push({
      marker: "HOMA-IR (Calculated)",
      value: homa_ir,
      unit: "Index",
      conventional_range: "< 2.5",
      optimal_range: "< 1.4",
      status: homa_ir < 1.4 ? 'optimal' : homa_ir <= 1.9 ? 'borderline' : 'abnormal',
      insight_en: homa_ir < 1.4 
        ? "Excellent cellular glucose uptake." 
        : "Cellular insulin receptor desensitization present; warrants low-glycemic, anti-inflammatory dietary protocol.",
      insight_bn: homa_ir < 1.4 
        ? "কোষে গ্লুকোজ প্রবেশ স্বাভাবিক ও সংবেদনশীল।" 
        : "কোষে ইনসুলিন রেজিস্ট্যান্স বিদ্যমান; লো-গ্লাইসেমিক খাদ্যতালিকা ও ইন্টারমিটেন্ট উপবাস প্রয়োজন।"
    });
  }

  // 2. TG / HDL Ratio Calculation
  let tg_hdl_ratio: number | undefined = undefined;
  let tg_hdl_status_en: string | undefined = undefined;
  let tg_hdl_status_bn: string | undefined = undefined;

  if (labs.triglycerides && labs.hdl && labs.hdl > 0) {
    tg_hdl_ratio = Math.round((labs.triglycerides / labs.hdl) * 100) / 100;
    if (tg_hdl_ratio < 1.5) {
      tg_hdl_status_en = "Optimal Cardioprotective Pattern (<1.5)";
      tg_hdl_status_bn = "চমৎকার কার্ডিওপ্রোটেক্টিভ মাত্রা (<১.৫)";
    } else if (tg_hdl_ratio <= 3.0) {
      tg_hdl_status_en = "Borderline Atherogenic Dyslipidemia (1.5 - 3.0)";
      tg_hdl_status_bn = "সীমান্তবর্তী এথেরোজেনিক ডিসলিপিডেমিয়া (১.৫ - ৩.০)";
    } else {
      tg_hdl_status_en = "High Atherogenic Risk (sdLDL particle predominance >3.0)";
      tg_hdl_status_bn = "উচ্চ এথেরোজেনিক ও হার্ট অ্যাটাকের ঝুঁকি (ছোট ঘন এলডিএল কণা বৃদ্ধি >৩.০)";
    }

    flags.push({
      marker: "Triglyceride / HDL Ratio",
      value: tg_hdl_ratio,
      unit: "Ratio",
      conventional_range: "< 3.0",
      optimal_range: "< 1.5",
      status: tg_hdl_ratio < 1.5 ? 'optimal' : tg_hdl_ratio <= 3.0 ? 'borderline' : 'abnormal',
      insight_en: tg_hdl_ratio < 1.5 
        ? "Predominantly large, buoyant, benign LDL subfractions." 
        : "Strong surrogate marker for atherogenic small dense LDL particles and hepatic de novo lipogenesis.",
      insight_bn: tg_hdl_ratio < 1.5 
        ? "রক্তে ক্ষতিকর ঘন এলডিএল কণা নেই।" 
        : "যকৃতে অতিরিক্ত কার্বোহাইড্রেট থেকে চর্বি তৈরির লক্ষণ; চিনি ও পরিশোধিত তেল পরিহার আবশ্যক।"
    });
  }

  // 3. HbA1c
  if (labs.hba1c !== undefined) {
    const val = labs.hba1c;
    const isOpt = val >= 4.8 && val <= 5.4;
    const isPred = val >= 5.5 && val <= 6.4;
    flags.push({
      marker: "HbA1c",
      value: val,
      unit: "%",
      conventional_range: "< 5.7%",
      optimal_range: "4.8 - 5.4%",
      status: isOpt ? 'optimal' : isPred ? 'borderline' : 'abnormal',
      insight_en: isOpt 
        ? "Optimal 90-day glycation control." 
        : isPred 
        ? "Subclinical glycation and advanced glycation end-products (AGEs) formation." 
        : "Overt diabetic glycemia requiring strict carbohydrate capping.",
      insight_bn: isOpt 
        ? "রক্তে গত ৩ মাসের গ্লুকোজ মাত্রা সম্পূর্ণ আদর্শ।" 
        : isPred 
        ? "ডায়াবেটিস পূর্ববর্তী স্তর (প্রি-ডায়াবেটিস); খাদ্যনিয়ন্ত্রণে শতভাগ নিরাময়যোগ্য।" 
        : "অনিয়ন্ত্রিত ডায়াবেটিস; কার্বোহাইড্রেট কঠোরভাবে সীমিত করা জরুরি।"
    });
  }

  // 4. Fasting Glucose
  if (labs.fasting_glucose !== undefined) {
    const val = labs.fasting_glucose;
    const isOpt = val >= 72 && val <= 86;
    flags.push({
      marker: "Fasting Blood Glucose",
      value: val,
      unit: "mg/dL",
      conventional_range: "70 - 99 mg/dL",
      optimal_range: "72 - 86 mg/dL",
      status: isOpt ? 'optimal' : val <= 99 ? 'borderline' : 'abnormal',
      insight_en: isOpt 
        ? "Optimal fasting metabolic baseline." 
        : "Fasting glucose >86 mg/dL indicates early nocturnal hepatic gluconeogenesis upregulation.",
      insight_bn: isOpt 
        ? "খালি পেটে রক্তের শর্করা আদর্শ সীমায় আছে।" 
        : "৮৬ এর উপরে খালি পেটের সুগার লিভার থেকে অতিরিক্ত গ্লুকোজ নিঃসরণের পূর্বাভাস দেয়।"
    });
  }

  // 5. Fasting Insulin
  if (labs.fasting_insulin !== undefined) {
    const val = labs.fasting_insulin;
    const isOpt = val >= 2.0 && val <= 6.0;
    flags.push({
      marker: "Fasting Insulin",
      value: val,
      unit: "µIU/mL",
      conventional_range: "2.6 - 24.9 µIU/mL",
      optimal_range: "2.0 - 6.0 µIU/mL",
      status: isOpt ? 'optimal' : val <= 10.0 ? 'borderline' : 'abnormal',
      insight_en: isOpt 
        ? "Pancreatic beta-cells in calm, unstressed state." 
        : "Hyperinsulinemia: pancreas is overworking to maintain normal blood sugar.",
      insight_bn: isOpt 
        ? "প্যানক্রিয়াস বা অগ্ন্যাশয় স্বাভাবিক শান্ত অবস্থায় আছে।" 
        : "হাইপারইনসুলিনেমিয়া: সুগার নিয়ন্ত্রণে রাখতে অগ্ন্যাশয়কে অতিরিক্ত ইনসুলিন তৈরি করতে হচ্ছে।"
    });
  }

  // 6. TSH (Thyroid Stimulating Hormone)
  if (labs.tsh !== undefined) {
    const val = labs.tsh;
    const isOpt = val >= 1.0 && val <= 2.2;
    flags.push({
      marker: "TSH",
      value: val,
      unit: "µIU/mL",
      conventional_range: "0.45 - 4.5 µIU/mL",
      optimal_range: "1.0 - 2.2 µIU/mL",
      status: isOpt ? 'optimal' : val < 0.45 ? 'critical' : val <= 3.5 ? 'borderline' : 'abnormal',
      insight_en: isOpt 
        ? "Optimal pituitary-thyroid axis feedback." 
        : val > 2.2 
        ? "Functional subclinical hypothyroid stress; assess selenium, zinc, and gut conversion." 
        : "Possible hyperthyroid state or excessive exogenous thyroid hormone.",
      insight_bn: isOpt 
        ? "থাইরয়েড গ্রন্থির হরমোন সংকেত সম্পূর্ণ স্বাভাবিক।" 
        : val > 2.2 
        ? "কার্যকরী সাবক্লিনিক্যাল হাইপোথাইরয়েডিজম; মেটাবলিজম ধীর ও ওজন কমাতে বাধা সৃষ্টি করছে।" 
        : "হাইপারথাইরয়েড বা অতিরিক্ত থাইরক্সিন ডোজের লক্ষণ।"
    });
  }

  // 7. Vitamin D3 (25-OH-D3)
  if (labs.vitamin_d3 !== undefined) {
    const val = labs.vitamin_d3;
    const isOpt = val >= 50 && val <= 80;
    flags.push({
      marker: "Vitamin D3 (25-OH)",
      value: val,
      unit: "ng/mL",
      conventional_range: "> 30 ng/mL",
      optimal_range: "50 - 80 ng/mL",
      status: isOpt ? 'optimal' : val >= 30 ? 'borderline' : 'abnormal',
      insight_en: isOpt 
        ? "Optimal immunomodulatory and genomic nuclear hormone levels." 
        : "Deficient: impairs insulin sensitivity, increases autoimmune flare risks and weakens mucosal immunity.",
      insight_bn: isOpt 
        ? "ইমিউনিটি ও হরমোন ভারসাম্যের জন্য শতভাগ আদর্শ।" 
        : "মারাত্মক ঘাটতি; ইনসুলিন রেজিস্ট্যান্স বৃদ্ধি, অটোইমিউন ঝুঁকি ও হাড়-পেশির ব্যথার মূল কারণ।"
    });
  }

  // 8. Vitamin B12
  if (labs.vitamin_b12 !== undefined) {
    const val = labs.vitamin_b12;
    const isOpt = val >= 550 && val <= 950;
    flags.push({
      marker: "Vitamin B12",
      value: val,
      unit: "pg/mL",
      conventional_range: "200 - 900 pg/mL",
      optimal_range: "550 - 950 pg/mL",
      status: isOpt ? 'optimal' : val >= 400 ? 'borderline' : 'abnormal',
      insight_en: isOpt 
        ? "Adequate cellular methylation and myelin sheath maintenance." 
        : "Levels <500 pg/mL can cause subacute neuropathy, brain fog and elevated homocysteine.",
      insight_bn: isOpt 
        ? "স্নায়ু ও মস্তিষ্কের কোষ মেরামতের জন্য পর্যাপ্ত।" 
        : "৫০০ এর নিচে বি১২ থাকলে হাত-পায়ে ঝিঁঝিঁ ধরা, অবসাদ ও ভুলে যাওয়ার সমস্যা দেখা দেয়।"
    });
  }

  // 9. Ferritin
  if (labs.ferritin !== undefined) {
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
      insight_en: isOpt 
        ? "Balanced cellular iron stores without oxidative iron overload." 
        : val < minOpt 
        ? "Depleted iron reserves impairing thyroid T4-to-T3 conversion and hair follicles." 
        : "Elevated ferritin serves as an acute phase reactant signaling systemic inflammation.",
      insight_bn: isOpt 
        ? "শরীরে আয়রনের অভ্যন্তরীণ রিজার্ভ পর্যাপ্ত।" 
        : val < minOpt 
        ? "আয়রনের ঘাটতি; চুল পড়া, ক্লান্তি ও থাইরয়েড হরমোন সক্রিয়করণে বাধার কারণ।" 
        : "উচ্চ ফেরিটিন শরীরে প্রদাহ বা ফ্যাটি লিভারের সংকেত হতে পারে।"
    });
  }

  // 10. Uric Acid
  if (labs.uric_acid !== undefined) {
    const val = labs.uric_acid;
    const isOpt = val >= 3.5 && val <= 5.5;
    flags.push({
      marker: "Serum Uric Acid",
      value: val,
      unit: "mg/dL",
      conventional_range: "< 7.0 mg/dL",
      optimal_range: "3.5 - 5.5 mg/dL",
      status: isOpt ? 'optimal' : val <= 6.5 ? 'borderline' : 'abnormal',
      insight_en: isOpt 
        ? "Normal purine metabolism and antioxidant balance." 
        : "Uric acid >5.5 mg/dL promotes endothelial nitric oxide quenching, hypertension and gouty arthropathy.",
      insight_bn: isOpt 
        ? "ইউরিক অ্যাসিড আদর্শ মাত্রায় আছে।" 
        : "৫.৫ এর বেশি ইউরিক অ্যাসিড রক্তনালী সংকুচিত করে, রক্তচাপ বাড়ায় ও অস্থিসন্ধিতে ব্যথার ঝুঁকি তৈরি করে।"
    });
  }

  // 11. ALT (Alanine Aminotransferase)
  if (labs.alt !== undefined) {
    const val = labs.alt;
    const isOpt = val >= 10 && val <= 25;
    flags.push({
      marker: "ALT (SGPT)",
      value: val,
      unit: "U/L",
      conventional_range: "< 45 U/L",
      optimal_range: "10 - 25 U/L",
      status: isOpt ? 'optimal' : val <= 35 ? 'borderline' : 'abnormal',
      insight_en: isOpt 
        ? "Healthy hepatocyte cell integrity." 
        : "ALT >25 U/L is a sensitive herald for Metabolic Dysfunction-Associated Steatohepatitis (MASH / NAFLD).",
      insight_bn: isOpt 
        ? "লিভারের হেপাটোসাইট কোষ সুস্থ ও সুরক্ষিত।" 
        : "২৫ এর বেশি এসজিপিটি ফ্যাটি লিভার ও যকৃতে প্রদাহের প্রাথমিক সতর্কবার্তা।"
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

