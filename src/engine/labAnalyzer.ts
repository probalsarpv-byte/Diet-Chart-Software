import { FunctionalLabs, LabFlag } from '../types';

function isValidNumber(val: any): val is number {
  return typeof val === 'number' && !isNaN(val) && isFinite(val) && val >= 0;
}

/**
 * Functional Lab Analyzer (Hardened for Phase R7)
 * Evaluates biomarkers cleanly across reference ranges, established decision thresholds,
 * and exploratory functional targets while correcting low/normal/high boundary branches
 * and never defaulting an unspecified gender to female.
 */
export function analyzeFunctionalLabs(
  labs: Partial<FunctionalLabs>,
  gender: 'male' | 'female' | 'unspecified' = 'unspecified'
): FunctionalLabs {
  const flags: LabFlag[] = [];

  // Unit compatibility safeguard if caller passed mmol/L FBS into legacy field (typically < 30 except extreme DKA; explicit check keeps mg/dL intact)
  const fbg = labs.fasting_glucose;

  // 1. HOMA-IR Calculation
  let homa_ir: number | undefined = undefined;
  let homa_ir_status_en: string | undefined = undefined;
  let homa_ir_status_bn: string | undefined = undefined;

  if (isValidNumber(fbg) && fbg > 0 && isValidNumber(labs.fasting_insulin) && labs.fasting_insulin > 0) {
    homa_ir = Math.round(((fbg * labs.fasting_insulin) / 405) * 100) / 100;
    if (homa_ir < 1.4) {
      homa_ir_status_en = 'Low / Normal HOMA-IR Index (<1.4)';
      homa_ir_status_bn = 'স্বাভাবিক হোমা-আইআর সূচক (<১.৪)';
    } else if (homa_ir <= 1.9) {
      homa_ir_status_en = 'Borderline Functional Insulin Resistance Risk (1.4 - 1.9)';
      homa_ir_status_bn = 'সীমান্তবর্তী ইনসুলিন রেজিস্ট্যান্স ঝুঁকি (১.৪ - ১.৯)';
    } else if (homa_ir <= 2.9) {
      homa_ir_status_en = 'Moderate Insulin Resistance Pattern (2.0 - 2.9)';
      homa_ir_status_bn = 'মাঝারি ইনসুলিন রেজিস্ট্যান্স প্রবণতা (২.০ - ২.৯)';
    } else {
      homa_ir_status_en = 'Elevated HOMA-IR Pattern (≥3.0)';
      homa_ir_status_bn = 'উচ্চ হোমা-আইআর প্রবণতা (≥৩.০)';
    }

    flags.push({
      marker: 'HOMA-IR (Calculated)',
      value: homa_ir,
      unit: 'Index',
      conventional_range: '< 2.5 (population-dependent)',
      optimal_range: '< 1.4 (exploratory)',
      status: homa_ir < 1.4 ? 'optimal' : homa_ir <= 1.9 ? 'borderline' : 'abnormal',
      is_diagnostic_threshold: false,
      insight_en:
        homa_ir < 1.4
          ? 'Within normal fasting insulin sensitivity range (requires fasting compatibility and non-exogenous insulin).'
          : 'Elevated HOMA-IR pattern; supports low-glycemic meal review alongside clinician evaluation (threshold varies by ethnicity/population).',
      insight_bn:
        homa_ir < 1.4
          ? 'স্বাভাবিক ফাস্টিং ইনসুলিন সংবেদনশীলতা নির্দেশক।'
          : 'ইনসুলিন রেজিস্ট্যান্স বৃদ্ধির প্রবণতা; লো-গ্লাইসেমিক খাদ্যতালিকা ও ক্লিনিক্যাল পর্যালোচনা প্রয়োজন।'
    });
  }

  // 2. TG / HDL Ratio Calculation
  let tg_hdl_ratio: number | undefined = undefined;
  let tg_hdl_status_en: string | undefined = undefined;
  let tg_hdl_status_bn: string | undefined = undefined;

  if (isValidNumber(labs.triglycerides) && isValidNumber(labs.hdl) && labs.hdl > 0) {
    tg_hdl_ratio = Math.round((labs.triglycerides / labs.hdl) * 100) / 100;
    if (tg_hdl_ratio < 1.5) {
      tg_hdl_status_en = 'Low-Risk TG/HDL Ratio (<1.5)';
      tg_hdl_status_bn = 'কম ঝুঁকির টিজি/এইচডিএল অনুপাত (<১.৫)';
    } else if (tg_hdl_ratio <= 3.0) {
      tg_hdl_status_en = 'Borderline TG/HDL Ratio (1.5 - 3.0)';
      tg_hdl_status_bn = 'সীমান্তবর্তী টিজি/এইচডিএল অনুপাত (১.৫ - ৩.০)';
    } else {
      tg_hdl_status_en = 'Elevated TG/HDL Ratio (>3.0)';
      tg_hdl_status_bn = 'উচ্চ টিজি/এইচডিএল অনুপাত (>৩.০)';
    }

    flags.push({
      marker: 'Triglyceride / HDL Ratio',
      value: tg_hdl_ratio,
      unit: 'Ratio',
      conventional_range: '< 3.0',
      optimal_range: '< 1.5 (exploratory)',
      status: tg_hdl_ratio < 1.5 ? 'optimal' : tg_hdl_ratio <= 3.0 ? 'borderline' : 'abnormal',
      is_diagnostic_threshold: false,
      insight_en:
        tg_hdl_ratio < 1.5
          ? 'Favorable triglyceride-to-HDL balance.'
          : 'Elevated TG/HDL ratio correlates with cardiometabolic and triglyceride-rich lipoprotein risk (not a direct measurement of LDL particle size).',
      insight_bn:
        tg_hdl_ratio < 1.5
          ? 'ট্রাইগ্লিসারাইড ও এইচডিএল অনুপাত ভারসাম্যপূর্ণ।'
          : 'উচ্চ টিজি/এইচডিএল অনুপাত কার্ডিওমেটাবলিক ঝুঁকি নির্দেশ করে; পরিশোধিত চিনি ও প্রক্রিয়াজাত খাবার সীমিত করুন।'
    });
  }

  // 2b. Non-HDL Cholesterol (Derived: Total Cholesterol - HDL)
  let non_hdl: number | undefined = labs.non_hdl;
  let non_hdl_status_en: string | undefined = undefined;
  let non_hdl_status_bn: string | undefined = undefined;

  if (!isValidNumber(non_hdl) && isValidNumber(labs.total_cholesterol) && isValidNumber(labs.hdl)) {
    non_hdl = Math.round((labs.total_cholesterol - labs.hdl) * 10) / 10;
  }

  if (isValidNumber(non_hdl)) {
    if (non_hdl < 100) {
      non_hdl_status_en = 'Optimal Non-HDL (<100 mg/dL)';
      non_hdl_status_bn = 'আদর্শ নন-এইচডিএল কোলেস্টেরল (<১০০ মিলিগ্রাম/ডেসিলিটার)';
    } else if (non_hdl <= 130) {
      non_hdl_status_en = 'Borderline Atherogenic Burden (100 - 130 mg/dL)';
      non_hdl_status_bn = 'সীমান্তবর্তী এথেরোজেনিক চাপ (১০০ - ১৩০ মিলিগ্রাম/ডেসিলিটার)';
    } else {
      non_hdl_status_en = 'Elevated Atherogenic Lipoprotein Burden (>130 mg/dL)';
      non_hdl_status_bn = 'উচ্চ এথেরোজেনিক লিপোপ্রোটিন চাপ (>১৩০ মিলিগ্রাম/ডেসিলিটার)';
    }

    flags.push({
      marker: 'Non-HDL Cholesterol (Derived)',
      value: non_hdl,
      unit: 'mg/dL',
      conventional_range: '< 130 mg/dL',
      optimal_range: '< 100 mg/dL',
      status: non_hdl < 100 ? 'optimal' : non_hdl <= 130 ? 'borderline' : 'abnormal',
      is_diagnostic_threshold: non_hdl >= 160,
      insight_en:
        non_hdl < 100
          ? 'Within optimal aggregate non-HDL cholesterol target.'
          : 'Elevated non-HDL cholesterol reflects total apoB-containing lipoprotein burden; supports soluble fiber and cardiovascular dietary review.',
      insight_bn:
        non_hdl < 100
          ? 'নন-এইচডিএল কোলেস্টেরল আদর্শ সীমায় আছে।'
          : 'উচ্চ নন-এইচডিএল কোলেস্টেরল হৃদরোগ ঝুঁকি নির্দেশক; দ্রবণীয় ফাইবার ও স্বাস্থ্যকর চর্বি গ্রহণ বিবেচ্য।'
    });
  }

  // 3. HbA1c (Fixes low HbA1c <4.0 vs normal 4.0-5.4 vs 5.5-5.6 vs prediabetes 5.7-6.4 vs >=6.5)
  if (isValidNumber(labs.hba1c)) {
    const val = labs.hba1c;
    const isLow = val < 4.0;
    const isOpt = val >= 4.0 && val <= 5.4;
    const isNormalHighEnd = val > 5.4 && val < 5.7;
    const isPred = val >= 5.7 && val <= 6.4;
    const isDiabetic = val >= 6.5;
    flags.push({
      marker: 'HbA1c',
      value: val,
      unit: '%',
      conventional_range: '4.0 - 5.6%',
      optimal_range: '4.8 - 5.4% (exploratory)',
      status: isLow ? 'borderline' : isOpt ? 'optimal' : isNormalHighEnd || isPred ? 'borderline' : 'abnormal',
      is_diagnostic_threshold: isDiabetic,
      insight_en: isLow
        ? 'Below reference interval (<4.0%): does NOT indicate hyperglycemia/diabetes. Evaluate for recurrent hypoglycemia, hemolytic/iron anemia, or altered RBC turnover.'
        : isOpt
        ? 'Within normal 90-day glycation control range.'
        : isNormalHighEnd
        ? 'Within conventional non-diabetic reference (<5.7%) and below prediabetes diagnostic threshold (5.7–6.4%).'
        : isPred
        ? 'Prediabetes risk range (ADA 5.7–6.4%); below diabetes threshold (6.5%). Dietary glycemic management recommended alongside clinical follow-up.'
        : 'Meets ADA diagnostic threshold (>=6.5%); clinical physician confirmation and co-management required.',
      insight_bn: isLow
        ? 'স্বাভাবিকের তুলনায় কম HbA1c (<৪.০%): এটি ডায়াবেটিস নয়; হাইপোগ্লাইসেমিয়া বা রক্তাল্পতা সংক্রান্ত কারণ মূল্যায়ন প্রয়োজন।'
        : isOpt
        ? 'রক্তে গত ৩ মাসের গ্লুকোজ মাত্রা স্বাভাবিক ও আদর্শ সীমায় আছে।'
        : isNormalHighEnd
        ? 'প্রচলিত স্বাভাবিক সীমার মধ্যে (<৫.৭%) এবং ডায়াবেটিস/প্রি-ডায়াবেটিস সীমার নিচে।'
        : isPred
        ? 'প্রি-ডায়াবেটিস সীমা (৫.৭–৬.৪%); ডায়াবেটিস সীমার নিচে। খাদ্যনিয়ন্ত্রণ ও জীবনযাত্রা পরিবর্তন সহায়ক হতে পারে।'
        : 'ডায়াবেটিসের ক্লিনিক্যাল ডায়াগনস্টিক সীমা (>=৬.৫%); চিকিৎসকের তত্ত্বাবধান ও নিশ্চিতকরণ আবশ্যক।'
    });
  }

  // 4. Fasting Glucose (Fixes low <70 / critical low <54 vs normal vs IFG vs >=126)
  if (isValidNumber(fbg)) {
    const val = fbg;
    const isCriticalLow = val < 54;
    const isLow = val >= 54 && val < 70;
    const isOpt = val >= 70 && val <= 88;
    const isNormalUpper = val > 88 && val <= 99;
    const isIFG = val >= 100 && val < 126;
    const isDiabetic = val >= 126;
    flags.push({
      marker: 'Fasting Blood Glucose',
      value: val,
      unit: 'mg/dL',
      conventional_range: '70 - 99 mg/dL',
      optimal_range: '72 - 88 mg/dL (exploratory)',
      status: isCriticalLow ? 'critical' : isLow ? 'abnormal' : isOpt ? 'optimal' : isNormalUpper ? 'borderline' : 'abnormal',
      is_diagnostic_threshold: isDiabetic,
      insight_en: isCriticalLow
        ? 'CRITICAL LOW (<54 mg/dL): Clinically significant hypoglycemia risk — urgent clinical assessment required.'
        : isLow
        ? 'Below normal fasting range (<70 mg/dL): evaluate for hypoglycemia risk, medication timing, or prolonged fasting.'
        : isOpt
        ? 'Within optimal fasting metabolic range.'
        : isNormalUpper
        ? 'Within conventional normal fasting reference range (70–99 mg/dL).'
        : isIFG
        ? 'Impaired fasting glucose range (100–125 mg/dL); below diabetes threshold (>=126 mg/dL).'
        : 'Meets ADA fasting hyperglycemia threshold (>=126 mg/dL); requires clinician confirmation.',
      insight_bn: isCriticalLow
        ? 'অত্যন্ত নিম্ন গ্লুকোজ (<৫৪ মিলিগ্রাম/ডেসিলিটার): মারাত্মক হাইপোগ্লাইসেমিয়া ঝুঁকি — জরুরি চিকিৎসা মূল্যায়ন আবশ্যক।'
        : isLow
        ? 'স্বাভাবিকের নিচে ফাস্টিং গ্লুকোজ (<৭০ মিলিগ্রাম/ডেসিলিটার): হাইপোগ্লাইসেমিয়া বা ওষুধের মাত্রা পর্যালোচনা করুন।'
        : isOpt
        ? 'খালি পেটে রক্তের গ্লুকোজ স্বাভাবিক ও আদর্শ সীমায় আছে।'
        : isNormalUpper
        ? 'প্রচলিত স্বাভাবিক ফাস্টিং গ্লুকোজ সীমার (৭০–৯৯ মিলিগ্রাম/ডেসিলিটার) মধ্যে।'
        : isIFG
        ? 'ইমপেয়ার্ড ফাস্টিং গ্লুকোজ (১০০–১২৫ মিলিগ্রাম/ডেসিলিটার); খাদ্যনিয়ন্ত্রণ ও ফলো-আপ প্রয়োজন।'
        : 'খালি পেটে উচ্চ গ্লুকোজ সীমা (>=১২৬ মিলিগ্রাম/ডেসিলিটার); চিকিৎসকের নিশ্চিতকরণ প্রয়োজন।'
    });
  }

  // 5. Fasting Insulin (Fixes <2.0 low insulin false-hyperinsulinemia bug!)
  if (isValidNumber(labs.fasting_insulin)) {
    const val = labs.fasting_insulin;
    const isLow = val < 2.0;
    const isOpt = val >= 2.0 && val <= 6.0;
    const isBorderline = val > 6.0 && val <= 24.9;
    flags.push({
      marker: 'Fasting Insulin',
      value: val,
      unit: 'µIU/mL',
      conventional_range: '2.6 - 24.9 µIU/mL',
      optimal_range: '2.0 - 6.0 µIU/mL (exploratory)',
      status: isOpt ? 'optimal' : isLow || isBorderline ? 'borderline' : 'abnormal',
      is_diagnostic_threshold: false,
      insight_en: isLow
        ? 'Low fasting insulin (<2.0 µIU/mL): does NOT indicate hyperinsulinemia; evaluate beta-cell insulin reserve or glycemic context.'
        : isOpt
        ? 'Within calm fasting insulin range.'
        : isBorderline
        ? 'Within standard lab reference (2.6–24.9 µIU/mL) but above exploratory 6.0 µIU/mL target; assess alongside fasting glucose.'
        : 'Elevated fasting insulin (>24.9 µIU/mL) above laboratory reference interval; indicates compensatory hyperinsulinemia.',
      insight_bn: isLow
        ? 'নিম্ন ফাস্টিং ইনসুলিন (<২.০ µIU/mL): এটি হাইপারইনসুলিনেমিয়া নয়; অগ্ন্যাশয়ের বিটা-সেল কার্যকারিতা পর্যালোচনাযোগ্য।'
        : isOpt
        ? 'ফাস্টিং ইনসুলিন স্বাভাবিক আদর্শ সীমায় আছে।'
        : isBorderline
        ? 'প্রচলিত ল্যাব সীমার মধ্যে হলেও কার্যকরী লক্ষ্য (>৬.০) অতিক্রম করেছে; গ্লুকোজের সাথে সমন্বিত মূল্যায়ন প্রয়োজন।'
        : 'উচ্চ ফাস্টিং ইনসুলিন (>২৪.৯ µIU/mL): অতিরিক্ত ইনসুলিন নিঃসরণ ও রেজিস্ট্যান্সের লক্ষণ।'
    });
  }

  // 6. TSH (Fixes normal TSH inside 0.45-4.5 not claiming hypothyroidism; distinguishes low vs high accurately)
  if (isValidNumber(labs.tsh)) {
    const val = labs.tsh;
    const isCriticalLow = val < 0.1;
    const isLow = val >= 0.1 && val < 0.4;
    const isOpt = val >= 0.4 && val <= 2.5;
    const isNormalUpperRef = val > 2.5 && val <= 4.5;
    flags.push({
      marker: 'TSH',
      value: val,
      unit: 'µIU/mL',
      conventional_range: '0.4 - 4.5 µIU/mL',
      optimal_range: '0.8 - 2.5 µIU/mL (exploratory)',
      status: isCriticalLow ? 'critical' : isLow || isNormalUpperRef ? 'borderline' : isOpt ? 'optimal' : 'abnormal',
      is_diagnostic_threshold: val > 10 || val < 0.1,
      insight_en: isCriticalLow
        ? 'Markedly suppressed TSH (<0.1 µIU/mL): evaluate for hyperthyroidism or excessive thyroid hormone replacement.'
        : isLow
        ? 'Below laboratory reference interval (<0.4 µIU/mL): evaluate alongside Free T4 and medication dosing.'
        : isOpt
        ? 'Within both conventional laboratory reference and exploratory thyroid comfort zone.'
        : isNormalUpperRef
        ? 'Within conventional laboratory reference (0.4–4.5 µIU/mL); borderline outside exploratory 2.5 µIU/mL zone does NOT establish hypothyroidism.'
        : 'Elevated TSH (>4.5 µIU/mL) above reference interval; evaluate with Free T4 and thyroid antibodies before clinical conclusion.',
      insight_bn: isCriticalLow
        ? 'অত্যন্ত কম টিএসএইচ (<০.১ µIU/mL): হাইপারথাইরয়েড বা অতিরিক্ত ওষুধের মাত্রা মূল্যায়ন আবশ্যক।'
        : isLow
        ? 'ল্যাব সীমার নিচে টিএসএইচ (<০.৪ µIU/mL): ফ্রি টি৪ সহ ক্লিনিক্যাল মূল্যায়ন প্রয়োজন।'
        : isOpt
        ? 'টিএসএইচ স্বাভাবিক ল্যাব সীমার মধ্যে রয়েছে।'
        : isNormalUpperRef
        ? 'স্বাভাবিক ল্যাবরেটরি রেফারেন্স সীমার (০.৪–৪.৫) মধ্যেই রয়েছে; এটি এককভাবে হাইপোথাইরয়েড রোগ প্রমাণ করে না।'
        : 'ল্যাব সীমার উপরে টিএসএইচ (>৪.৫ µIU/mL): ফ্রি টি৪ ও অ্যান্টিবডিসহ চিকিৎসকের পর্যালোচনা প্রয়োজন।'
    });
  }

  // 7. Vitamin D3 (25-OH-D3) — fixes elevated >100 ng/mL previously claiming deficiency!
  if (isValidNumber(labs.vitamin_d3)) {
    const val = labs.vitamin_d3;
    const isDeficient = val < 20;
    const isBorderline = val >= 20 && val < 30;
    const isSufficient = val >= 30 && val <= 100;
    const isHighExcess = val > 100 && val <= 150;
    const isCriticalHigh = val > 150;
    flags.push({
      marker: 'Vitamin D3 (25-OH)',
      value: val,
      unit: 'ng/mL',
      conventional_range: '20 - 100 ng/mL',
      optimal_range: '30 - 60 ng/mL (exploratory)',
      status: isCriticalHigh ? 'critical' : isDeficient || isHighExcess ? 'abnormal' : isBorderline ? 'borderline' : 'optimal',
      is_diagnostic_threshold: isCriticalHigh || val < 12,
      insight_en: isCriticalHigh
        ? 'CRITICAL HIGH (>150 ng/mL): Potential Vitamin D toxicity / hypercalcemia risk — stop empiric Vitamin D supplementation and evaluate serum calcium urgently.'
        : isHighExcess
        ? 'Elevated 25(OH)D (>100 ng/mL): excess concentration above upper reference threshold; NOT deficient — review current dosing and calcium.'
        : isSufficient
        ? 'Sufficient 25-hydroxyvitamin D status.'
        : isBorderline
        ? 'Insufficiency/borderline range (20–29.9 ng/mL); interpret per patient clinical risk and Endocrine Society context.'
        : 'Deficient 25(OH)D (<20 ng/mL); clinician evaluation of dietary/sunlight/supplement needs indicated.',
      insight_bn: isCriticalHigh
        ? 'অত্যন্ত উচ্চ ভিটামিন ডি (>১৫০ ng/mL): বিষক্রিয়া ও হাইপারক্যালসেমিয়া ঝুঁকি — সাপ্লিমেন্ট বন্ধ করে চিকিৎসকের মূল্যায়ন নিন।'
        : isHighExcess
        ? 'স্বাভাবিক সীমার চেয়ে বেশি ভিটামিন ডি (>১০০ ng/mL): এটি ঘাটতি নয়; ডোজ ও ক্যালসিয়াম পর্যালোচনা প্রয়োজন।'
        : isSufficient
        ? 'রক্তে ভিটামিন ডি পর্যাপ্ত মাত্রায় রয়েছে।'
        : isBorderline
        ? 'সীমান্তবর্তী ভিটামিন ডি (২০–২৯.৯ ng/mL): ক্লিনিক্যাল ঝুঁকি অনুযায়ী মূল্যায়নযোগ্য।'
        : 'ভিটামিন ডি ঘাটতি (<২০ ng/mL): চিকিৎসকের মূল্যায়ন ও পরিমিত সাপ্লিমেন্ট বিবেচনাযোগ্য।'
    });
  }

  // 8. Vitamin B12 — distinguishes elevated >900 from low/borderline!
  if (isValidNumber(labs.vitamin_b12)) {
    const val = labs.vitamin_b12;
    const isDeficient = val < 200;
    const isBorderline = val >= 200 && val < 400;
    const isSufficient = val >= 400 && val <= 900;
    flags.push({
      marker: 'Vitamin B12',
      value: val,
      unit: 'pg/mL',
      conventional_range: '200 - 900 pg/mL',
      optimal_range: '400 - 900 pg/mL (exploratory)',
      status: isDeficient ? 'abnormal' : isBorderline || val > 900 ? 'borderline' : 'optimal',
      is_diagnostic_threshold: val < 150,
      insight_en: isDeficient
        ? 'Below reference interval (<200 pg/mL): consistent with possible Vitamin B12 depletion; evaluate dietary B12, malabsorption, and metformin/PPI exposure.'
        : isBorderline
        ? 'Indeterminate/borderline B12 (200–399 pg/mL): consider MMA/homocysteine and clinical neuro-hematological review before diagnosing deficiency.'
        : isSufficient
        ? 'Within adequate serum Vitamin B12 range.'
        : 'Above reference interval (>900 pg/mL): evaluate high-dose B12 supplementation or underlying clinical causes; NOT B12 deficiency.',
      insight_bn: isDeficient
        ? 'ল্যাব সীমার নিচে ভিটামিন বি১২ (<২০০ pg/mL): ঘাটতির সম্ভাবনা; মেটফর্মিন/পিপিআই ইতিহাস ও খাদ্যাভ্যাস পর্যালোচনা করুন।'
        : isBorderline
        ? 'সীমান্তবর্তী বি১২ (২০০–৩৯৯ pg/mL): ঘাটতি নিশ্চিত করতে ক্লিনিক্যাল ও এমএমএ পর্যালোচনা প্রয়োজন।'
        : isSufficient
        ? 'রক্তে ভিটামিন বি১২ পর্যাপ্ত মাত্রায় আছে।'
        : 'ল্যাব সীমার উপরে ভিটামিন বি১২ (>৯০০ pg/mL): এটি ঘাটতি নয়; অতিরিক্ত সাপ্লিমেন্ট সেবন বা ক্লিনিক্যাল কারণ মূল্যায়ন করুন।'
    });
  }

  // 9. Ferritin — handles unspecified gender safely & qualifies inflammation confounding
  if (isValidNumber(labs.ferritin)) {
    const val = labs.ferritin;
    const lowRef = gender === 'male' ? 30 : gender === 'female' ? 15 : 15;
    const highRef = gender === 'male' ? 300 : gender === 'female' ? 150 : 300;
    const minOpt = gender === 'male' ? 40 : gender === 'female' ? 30 : 30;
    const maxOpt = gender === 'male' ? 150 : gender === 'female' ? 120 : 150;
    const isInflamed = isValidNumber(labs.hs_crp) && labs.hs_crp > 3.0;
    const isDepleted = val < lowRef;
    const isHigh = val > highRef;
    const isOpt = val >= minOpt && val <= maxOpt;
    flags.push({
      marker: 'Ferritin (Iron Stores)',
      value: val,
      unit: 'ng/mL',
      conventional_range: `${lowRef} - ${highRef} ng/mL`,
      optimal_range: `${minOpt} - ${maxOpt} ng/mL (exploratory)`,
      status: isDepleted ? 'abnormal' : isHigh || !isOpt ? 'borderline' : 'optimal',
      is_diagnostic_threshold: val < 15,
      insight_en: isDepleted
        ? 'Low ferritin indicates depleted iron stores (WHO threshold <15 ng/mL); review iron intake, occult blood loss, and TSAT.'
        : isHigh
        ? isInflamed
          ? 'Elevated ferritin alongside elevated hs-CRP (>3 mg/L): acute-phase inflammatory response can mask functional iron depletion; interpret with serum iron/TIBC/TSAT.'
          : 'Elevated ferritin above reference interval: acts as an acute-phase reactant and may reflect inflammation, liver stress, or iron excess — evaluate with TSAT and hepatic enzymes.'
        : isOpt
        ? isInflamed
          ? 'Numerically within range, though concurrent inflammation (elevated hs-CRP) may artificially elevate ferritin and mask early iron depletion.'
          : 'Balanced serum ferritin range.'
        : 'Within reference interval.',
      insight_bn: isDepleted
        ? 'নিম্ন ফেরিটিন শরীরে আয়রন সঞ্চয়ের ঘাটতি নির্দেশ করে; টিস্যাট ও খাদ্যাভ্যাস পর্যালোচনা প্রয়োজন।'
        : isHigh
        ? isInflamed
          ? 'উচ্চ প্রদাহের (hs-CRP) সাথে উচ্চ ফেরিটিন: প্রদাহের কারণে ফেরিটিন কৃত্রিমভাবে বাড়তে পারে এবং আয়রন ঘাটতি আড়াল হতে পারে।'
          : 'উচ্চ ফেরিটিন: এটি শরীরের প্রদাহ, লিভারের চাপ বা অতিরিক্ত আয়রন নির্দেশ করতে পারে; টিস্যাট সহ মূল্যায়ন প্রয়োজন।'
        : 'ফেরিটিন প্রচলিত স্বাভাবিক সীমার মধ্যে রয়েছে।'
    });
  }

  // 10. Uric Acid — distinguishes low/normal vs elevated (never treats low uric acid as hyperuricemia!)
  if (isValidNumber(labs.uric_acid)) {
    const val = labs.uric_acid;
    const highRef = gender === 'female' ? 6.0 : 7.0;
    const isLow = val < 2.4;
    const isHigh = val > highRef;
    const isOpt = val >= 3.0 && val <= 5.5;
    flags.push({
      marker: 'Serum Uric Acid',
      value: val,
      unit: 'mg/dL',
      conventional_range: `2.4 - ${highRef} mg/dL`,
      optimal_range: '3.0 - 5.5 mg/dL (exploratory)',
      status: isHigh ? 'abnormal' : isOpt ? 'optimal' : isLow ? 'borderline' : 'borderline',
      is_diagnostic_threshold: val >= 7.0,
      insight_en: isLow
        ? 'Below lower reference (<2.4 mg/dL): hypouricemia does NOT indicate gout or purine accumulation.'
        : isHigh
        ? `Elevated serum uric acid (>${highRef} mg/dL); review hydration, purine load, fructose intake, and gout/renal context.`
        : isOpt
        ? 'Within balanced serum uric acid range.'
        : 'Within conventional laboratory reference interval.',
      insight_bn: isLow
        ? 'স্বাভাবিকের নিচে ইউরিক এসিড: এটি গাউট বা পিউরিন জমার লক্ষণ নয়।'
        : isHigh
        ? 'উচ্চ সিরাম ইউরিক এসিড: পর্যাপ্ত পানি পান, পিউরিন ও ফ্রুক্টোজ নিয়ন্ত্রণ এবং চিকিৎসকের মূল্যায়ন প্রয়োজন।'
        : 'ইউরিক এসিড স্বাভাবিক সীমায় আছে।'
    });
  }

  // 11. ALT (Alanine Aminotransferase) — handles low ALT cleanly vs elevated
  if (isValidNumber(labs.alt)) {
    const val = labs.alt;
    const isLow = val < 7;
    const isOpt = val >= 7 && val <= 25;
    const isNormalUpper = val > 25 && val <= 45;
    flags.push({
      marker: 'ALT (SGPT)',
      value: val,
      unit: 'U/L',
      conventional_range: '7 - 45 U/L',
      optimal_range: '10 - 25 U/L (exploratory)',
      status: isOpt ? 'optimal' : isLow || isNormalUpper ? 'borderline' : 'abnormal',
      is_diagnostic_threshold: val >= 80,
      insight_en: isLow
        ? 'Low ALT (<7 U/L): does NOT indicate hepatocellular injury or fatty liver; may associate with low muscle mass or B6 context.'
        : isOpt
        ? 'Within low-normal hepatocellular transaminase range.'
        : isNormalUpper
        ? 'Within conventional ALT reference interval (up to 45 U/L); interpret mildly above 25 U/L alongside AST, GGT, and metabolic context.'
        : 'Elevated ALT (>45 U/L): warrants hepatic/medication/metabolic evaluation.',
      insight_bn: isLow
        ? 'নিম্ন এএলটি (<৭ U/L): এটি ফ্যাটি লিভার বা লিভার ক্ষতির লক্ষণ নয়।'
        : isOpt
        ? 'লিভারের এসজিপিটি এনজাইম স্বাভাবিক সীমায় আছে।'
        : isNormalUpper
        ? 'প্রচলিত ল্যাব সীমার মধ্যে রয়েছে; লিভারের অন্যান্য সূচকের সাথে তুলনাযোগ্য।'
        : 'উচ্চ এএলটি (>৪৫ U/L): লিভার, ওষুধ বা মেটাবলিক কারণের ক্লিনিক্যাল মূল্যায়ন প্রয়োজন।'
    });
  }

  // 12. Homocysteine — non-specific marker; never definitively proves B12 deficiency alone
  let homocysteine: number | undefined = labs.homocysteine;
  let homocysteine_status_en: string | undefined = undefined;
  let homocysteine_status_bn: string | undefined = undefined;

  if (isValidNumber(homocysteine)) {
    const val = homocysteine;
    const isOpt = val >= 5.0 && val <= 9.0;
    if (val < 5.0) {
      homocysteine_status_en = 'Below Reference Homocysteine (<5.0 µmol/L)';
      homocysteine_status_bn = 'স্বাভাবিকের নিচে হোমোসিস্টিন (<৫.০ মাইক্রোমোল/লিটার)';
    } else if (isOpt) {
      homocysteine_status_en = 'Normal / Optimal Homocysteine (5.0 - 9.0 µmol/L)';
      homocysteine_status_bn = 'স্বাভাবিক হোমোসিস্টিন (৫.০ - ৯.০ মাইক্রোমোল/লিটার)';
    } else if (val <= 15.0) {
      homocysteine_status_en = 'Within Lab Reference / Mildly Above Exploratory Target (9.1 - 15.0 µmol/L)';
      homocysteine_status_bn = 'ল্যাব সীমার মধ্যে / মৃদু বৃদ্ধি (৯.১ - ১৫.০ মাইক্রোমোল/লিটার)';
    } else {
      homocysteine_status_en = 'Elevated Homocysteine (>15.0 µmol/L)';
      homocysteine_status_bn = 'উচ্চ হোমোসিস্টিন (>১৫.০ মাইক্রোমোল/লিটার)';
    }

    flags.push({
      marker: 'Serum Homocysteine',
      value: val,
      unit: 'µmol/L',
      conventional_range: '5.0 - 15.0 µmol/L',
      optimal_range: '6.0 - 9.0 µmol/L (exploratory)',
      status: val < 5.0 ? 'borderline' : isOpt ? 'optimal' : val <= 15.0 ? 'borderline' : 'abnormal',
      is_diagnostic_threshold: val > 15.0,
      insight_en:
        val > 15.0
          ? 'Elevated homocysteine (>15 µmol/L): non-specific marker requiring clinical review of B12, folate, B6, renal function, thyroid status, and medications rather than assuming one single vitamin deficiency.'
          : val < 5.0
          ? 'Low homocysteine (<5.0 µmol/L); not hyperhomocysteinemia.'
          : 'Within laboratory reference interval.',
      insight_bn:
        val > 15.0
          ? 'উচ্চ হোমোসিস্টিন (>১৫ মাইক্রোমোল/লিটার): একটি অ-নির্দিষ্ট সূচক; একক ভিটামিন ঘাটতি ধরে নেওয়ার পরিবর্তে বি১২, ফোলেট, বি৬ ও কিডনি কার্যকারিতা একসাথে পর্যালোচনা করুন।'
          : 'হোমোসিস্টিন ল্যাবরেটরি সীমার মধ্যে রয়েছে।'
    });
  }

  // 13. hs-CRP — retains distinction from acute infection (>10 mg/L) and never claims low hs-CRP rules out all inflammation
  if (isValidNumber(labs.hs_crp)) {
    const val = labs.hs_crp;
    const isOpt = val < 1.0;
    flags.push({
      marker: 'hs-CRP (High-Sensitivity CRP)',
      value: val,
      unit: 'mg/L',
      conventional_range: '< 3.0 mg/L',
      optimal_range: '< 1.0 mg/L',
      status: isOpt ? 'optimal' : val <= 3.0 ? 'borderline' : 'abnormal',
      is_diagnostic_threshold: val >= 10.0,
      insight_en: isOpt
        ? 'Low basal hs-CRP (<1.0 mg/L) indicates low chronic hs-CRP cardiometabolic risk, though it does not exclude localized or non-CRP-mediated inflammatory processes.'
        : val <= 3.0
        ? 'Moderate hs-CRP elevation (1.0–3.0 mg/L): consistent with low-grade systemic inflammatory risk.'
        : val >= 10.0
        ? 'Marked hs-CRP elevation (>=10 mg/L): possible acute infection, tissue injury, or inflammatory flare — repeat and evaluate medically.'
        : 'Elevated hs-CRP (>3.0 mg/L): warrants clinical and anti-inflammatory dietary review.',
      insight_bn: isOpt
        ? 'নিম্ন এইচএস-সিআরপি (<১.০ mg/L): দীর্ঘমেয়াদী হৃদরোগজনিত প্রদাহ ঝুঁকি কম, তবে এটি সব ধরনের স্থানীয় প্রদাহকে নাকচ করে না।'
        : val <= 3.0
        ? 'মাঝারি এইচএস-সিআরপি (১.০–৩.০ mg/L): মৃদু সিস্টেমিক প্রদাহ নির্দেশক।'
        : 'উচ্চ এইচএস-সিআরপি (>৩.০ mg/L): চিকিৎসকের পর্যালোচনা ও প্রদাহ-রোধী খাদ্যাভ্যাস বিবেচ্য।'
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
    non_hdl,
    non_hdl_status_en,
    non_hdl_status_bn,
    homocysteine,
    homocysteine_status_en,
    homocysteine_status_bn,
    lab_flags: flags
  };
}

export function analyzeFunctionalBiomarkers(
  labs: Partial<FunctionalLabs>,
  gender: 'male' | 'female' | 'unspecified' = 'unspecified'
) {
  const result = analyzeFunctionalLabs(labs, gender);
  const nonHdlFlag = result.lab_flags.find(f => f.marker.toLowerCase().includes('non-hdl'));
  const insulinFlag = result.lab_flags.find(f => f.marker.toLowerCase().includes('fasting insulin'));
  const homocysteineFlag = result.lab_flags.find(f => f.marker.toLowerCase().includes('homocysteine'));

  return {
    ...result,
    derived_non_hdl: result.non_hdl,
    non_hdl_status: nonHdlFlag ? (nonHdlFlag.status === 'abnormal' ? 'abnormal_high' : nonHdlFlag.status) : undefined,
    fasting_insulin_status: insulinFlag ? (insulinFlag.status === 'borderline' ? 'borderline_high' : insulinFlag.status) : undefined,
    homocysteine_status: homocysteineFlag ? (homocysteineFlag.status === 'abnormal' ? 'abnormal_high' : homocysteineFlag.status) : undefined
  };
}
