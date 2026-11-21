/**
 * SHUDDHO FUNCTIONAL NUTRITION SOFTWARE
 * Fasting Eligibility & Safety Engine (Phase P0 Foundation)
 * 
 * Screens patient profile, medications, and clinical vulnerability
 * to determine fasting eligibility and maximum safe duration.
 */

import { PatientProfile, FastingSafetyEligibility, ClinicalSafetyResult } from '../types';

export function evaluateFastingEligibility(
  patient: PatientProfile,
  proposedFastingHours?: number
): {
  eligibility: FastingSafetyEligibility;
  safetyResults: ClinicalSafetyResult[];
} {
  const safetyResults: ClinicalSafetyResult[] = [];
  const reasons_en: string[] = [];
  const reasons_bn: string[] = [];
  let isEligible = true;
  let maxHours: 0 | 12 | 14 | 16 | 18 = 16;
  let riskLevel: 'contraindicated' | 'high_risk_supervised' | 'moderate_risk' | 'low_risk_eligible' = 'low_risk_eligible';
  let requiresMedAdjustment = false;
  let glucoseMonitoring = false;

  const activeMeds = (patient.active_medications || []).map(m => m.toLowerCase());
  const pop = patient.population_group;
  const age = patient.age;
  const weight = patient.weight_kg;

  // 1. Pregnancy & Lactation (Absolute Contraindication)
  if (pop === 'pregnancy' || pop === 'lactation' || Boolean(patient.trimester)) {
    isEligible = false;
    maxHours = 0;
    riskLevel = 'contraindicated';
    reasons_en.push('Fasting is strictly contraindicated during pregnancy and lactation due to fetal ketosis and maternal milk supply compromise.');
    reasons_bn.push('গর্ভাবস্থা ও স্তন্যদানকালে উপবাস সম্পূর্ণ নিষিদ্ধ।');
    safetyResults.push({
      rule_id: 'FASTING_PREGNANCY_STOP',
      rule_version: '1.0.0',
      patient_id: patient.id,
      decision: 'HARD_STOP',
      severity: 'critical',
      title_en: 'Fasting Prohibited in Pregnancy / Lactation',
      title_bn: 'গর্ভাবস্থায় বা স্তন্যদানকালে রোজা/উপবাস নিষিদ্ধ',
      clinical_explanation_en: 'Prolonged fasting promotes rapid maternal ketogenesis, fetal distress, and impaired lactogenesis.',
      clinical_explanation_bn: 'উপবাস মাতৃদুগ্ধ উৎপাদন হ্রাস করে এবং কিটোন বাড়িয়ে ভ্রূণের ক্ষতি করতে পারে।',
      required_action_en: 'Do not prescribe fasting windows. Provide regular, nutrient-dense meals.',
      required_action_bn: 'উপবাস পরিহার করুন এবং নিয়মিত পুষ্টিকর খাবার গ্রহণ করুন।',
      triggering_observations: [`population_group:${pop}`],
      clinician_review_required: true,
      provenance_reference: 'ACOG Practice Bulletin on Gestational Nutrition',
      timestamp: new Date().toISOString()
    });
  }

  // 2. Pediatric Status (<18y)
  if (age < 18 || pop === 'pediatric' || pop === 'adolescent') {
    isEligible = false;
    maxHours = 0;
    riskLevel = 'contraindicated';
    reasons_en.push('Intermittent fasting is not recommended for pediatric/adolescent patients due to active growth requirements.');
    reasons_bn.push('শিশুদের দৈহিক বৃদ্ধির জন্য ইন্টারমিটেন্ট ফাস্টিং নিষিদ্ধ।');
    safetyResults.push({
      rule_id: 'FASTING_PEDIATRIC_STOP',
      rule_version: '1.0.0',
      patient_id: patient.id,
      decision: 'HARD_STOP',
      severity: 'high',
      title_en: 'Fasting Blocked for Pediatric / Adolescent Age',
      title_bn: 'শিশুদের জন্য উপবাস নিষিদ্ধ',
      clinical_explanation_en: 'Developing children and adolescents require consistent nutrient intake for skeletal and neurodevelopmental growth.',
      clinical_explanation_bn: 'শিশুদের শারীরিক ও মানসিক বৃদ্ধির জন্য নিয়মিত খাবার প্রয়োজন।',
      required_action_en: 'Maintain regular childhood meal structure (3 meals + 2 snacks).',
      required_action_bn: 'শিশুর জন্য নিয়মিত খাবার ও নাশতার ব্যবস্থা রাখুন।',
      triggering_observations: [`age:${age}`],
      clinician_review_required: true,
      provenance_reference: 'AAP Pediatric Nutrition Guidelines',
      timestamp: new Date().toISOString()
    });
  }

  // 3. Underweight & Malnutrition Risk (Adult ESPEN / WHO Malnutrition Protocol)
  const isAdult = (age !== undefined ? age >= 18 : true) && pop !== 'pediatric' && pop !== 'adolescent';
  const effectiveBmi = patient.calculated?.bmi || (weight && patient.height_cm ? Math.round((weight / Math.pow(patient.height_cm / 100, 2)) * 10) / 10 : undefined);
  
  const hasDocumentedMalnutrition = pop === 'malnutrition_risk' || 
    Boolean(patient.clinical_safety && (patient.clinical_safety as any).malnutrition_risk) ||
    Boolean(patient.calculated?.bmi_category_en?.toLowerCase().includes('underweight'));

  // In adults, underweight is defined by BMI < 18.5 kg/m² or severe somatic wasting (<40 kg or documented malnutrition).
  // An absolute weight < 45 kg alone does NOT define underweight in short-stature adults with normal BMI (>= 18.5).
  const isUnderweightAdult = isAdult && (
    (effectiveBmi !== undefined && effectiveBmi < 18.5) ||
    hasDocumentedMalnutrition ||
    (weight !== undefined && weight < 40)
  );

  if (isUnderweightAdult) {
    isEligible = false;
    maxHours = 0;
    riskLevel = 'contraindicated';
    const reasonDetail = effectiveBmi !== undefined 
      ? `BMI ${effectiveBmi} kg/m² (<18.5)` 
      : (hasDocumentedMalnutrition ? 'documented malnutrition risk' : `weight ${weight} kg (<40 kg severe wasting floor)`);
    reasons_en.push(`Adult underweight status (${reasonDetail}) contraindicates fasting due to inadequate glycogen stores and catabolic proteolysis risk.`);
    reasons_bn.push(`কম ওজন বা অপুষ্টি ঝুঁকির কারণে (${reasonDetail}) উপবাস সম্পূর্ণ নিষিদ্ধ।`);
    safetyResults.push({
      rule_id: 'FASTING_UNDERWEIGHT_STOP',
      rule_version: '1.0.0',
      patient_id: patient.id,
      decision: 'HARD_STOP',
      severity: 'critical',
      title_en: 'Fasting Contraindicated: Severe Underweight / Cachexia Risk',
      title_bn: 'কম ওজনের কারণে উপবাস নিষিদ্ধ',
      clinical_explanation_en: `Patient meets adult malnutrition criteria (${reasonDetail}). Prolonged fasting accelerates somatic muscle proteolysis and glycemic instability.`,
      clinical_explanation_bn: 'শরীরে সঞ্চিত শক্তির ঘাটতি থাকায় উপবাস করলে মাংসপেশি ভেঙে মারাত্মক ক্ষতি হবে।',
      required_action_en: 'Initiate hypercaloric refeeding protocol. Fasting is blocked.',
      required_action_bn: 'পুষ্টিকর খাবারের মাধ্যমে ওজন বৃদ্ধির পরিকল্পনা করুন।',
      triggering_observations: [`weight_kg:${weight}`, `bmi:${effectiveBmi}`],
      clinician_review_required: true,
      provenance_reference: 'ESPEN Malnutrition Protocol / WHO Adult Underweight Criteria',
      timestamp: new Date().toISOString()
    });
  }

  // 4. Insulin and Sulfonylureas (Severe Hypoglycemia Risk)
  const hasInsulin = activeMeds.some(m => m.includes('insulin'));
  const hasSulfonylurea = activeMeds.some(m => 
    m.includes('glimepiride') || m.includes('gliclazide') || m.includes('glibenclamide') || m.includes('glipizide')
  );

  if (hasInsulin || hasSulfonylurea) {
    requiresMedAdjustment = true;
    glucoseMonitoring = true;
    if (isEligible) {
      riskLevel = 'high_risk_supervised';
      maxHours = 12; // Maximum 12 hours overnight physiological rest only
      reasons_en.push('Patient is taking hypoglycemic medications (insulin/sulfonylurea). Fasting >12h is restricted without medical dose tapering.');
      reasons_bn.push('ইনসুলিন বা সালফোনিলইউরিয়া ওষুধ গ্রহণের কারণে ১২ ঘণ্টার বেশি উপবাস অত্যন্ত ঝুঁকিপূর্ণ।');
      safetyResults.push({
        rule_id: 'FASTING_HYPOGLYCEMIA_MED_STOP',
        rule_version: '1.0.0',
        patient_id: patient.id,
        decision: (proposedFastingHours && proposedFastingHours > 12) ? 'HARD_STOP' : 'CLINICAL_REVIEW_REQUIRED',
        severity: 'critical',
        title_en: 'High-Risk Fasting: Hypoglycemic Drug Coordination Required',
        title_bn: 'উচ্চ ঝুঁকিপূর্ণ উপবাস: ওষুধের ডোজ সমন্বয় বাধ্যতামূলক',
        clinical_explanation_en: 'Insulin/secretagogue therapies carry imminent risk of severe neuroglycopenia if fasting is prolonged.',
        clinical_explanation_bn: 'ওষুধের ডোজ না কমিয়ে রোজা বা উপবাস রাখলে রক্তে সুগার বিপজ্জনকভাবে কমে অজ্ঞান হওয়ার ঝুঁকি থাকে।',
        required_action_en: 'Cap fasting at 12 hours max. Require daily glucometer self-monitoring. Never adjust insulin without physician order.',
        required_action_bn: '১২ ঘণ্টার বেশি উপবাস বন্ধ রাখুন। নিয়মিত রক্তের সুগার পরীক্ষা করুন।',
        triggering_observations: activeMeds.filter(m => m.includes('insulin') || m.includes('gli')),
        clinician_review_required: true,
        provenance_reference: 'IDF-DAR Diabetes & Fasting Clinical Guidelines',
        timestamp: new Date().toISOString()
      });
    }
  }

  // 4b. SGLT2 Inhibitors (Euglycemic DKA & Dehydration Risk)
  const hasSGLT2 = activeMeds.some(m => 
    m.includes('empagliflozin') || m.includes('dapagliflozin') || m.includes('canagliflozin') ||
    m.includes('jardiance') || m.includes('forxiga') || m.includes('emparol') || m.includes('dapaglif')
  );

  if (hasSGLT2) {
    if (isEligible) {
      if (maxHours > 16) {
        maxHours = 16;
      }
      reasons_en.push('Patient is taking an SGLT2 inhibitor (Empagliflozin/Dapagliflozin). Fasting >16h is strictly restricted due to euglycemic DKA risk.');
      reasons_bn.push('এসজিএলটি২ ইনহিবিটর ওষুধ গ্রহণের কারণে ১৬ ঘণ্টার বেশি উপবাস ইউজ্লাইসেমিক কিটোঅ্যাসিডোসিসের ঝুঁকিতে কঠোরভাবে নিষিদ্ধ।');
      if (proposedFastingHours && proposedFastingHours > 16) {
        safetyResults.push({
          rule_id: 'FASTING_SGLT2_PROLONGED_STOP',
          rule_version: '1.0.0',
          patient_id: patient.id,
          decision: 'HARD_STOP',
          severity: 'critical',
          title_en: 'Fasting Blocked: SGLT2i Euglycemic DKA Hazard',
          title_bn: 'উপবাস নিষিদ্ধ: এসজিএলটি২ কিটোঅ্যাসিডোসিসের ঝুঁকি',
          clinical_explanation_en: `Proposed fasting of ${proposedFastingHours} hours with active SGLT2 inhibitor therapy carries an imminent hazard of euglycemic diabetic ketoacidosis.`,
          clinical_explanation_bn: 'এসজিএলটি২ ওষুধ চলাকালীন দীর্ঘ উপবাসে রক্তে গ্লুকোজ স্বাভাবিক থাকলেও মারাত্মক কিটোঅ্যাসিডোসিস হতে পারে।',
          required_action_en: 'Cap fasting at maximum 14-16 hours and maintain consistent hydration and carbohydrate intake.',
          required_action_bn: 'উপবাস সর্বোচ্চ ১৬ ঘণ্টায় সীমিত রাখুন এবং পর্যাপ্ত পানি ও শর্করা নিশ্চিত করুন।',
          triggering_observations: activeMeds.filter(m => m.includes('empa') || m.includes('dapa') || m.includes('jardiance') || m.includes('forxiga')),
          clinician_review_required: true,
          provenance_reference: 'AACE/ADA Consensus Statement on SGLT2i Euglycemic DKA Prevention',
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  // 4c. Chronic Kidney Disease (Stages 1–3b) & Advanced Renal Failure
  const hasCKD = (patient.selected_conditions || []).includes('ckd_stage_1_3b') || 
    (patient.labs?.egfr !== undefined && patient.labs.egfr < 60);
  const isSevereCKD = patient.labs?.egfr !== undefined && patient.labs.egfr < 30;

  if (isSevereCKD) {
    isEligible = false;
    maxHours = 0;
    riskLevel = 'contraindicated';
    reasons_en.push('Fasting is contraindicated in severe CKD (eGFR <30 mL/min) due to risk of acute uremic catabolism, electrolyte shifts, and volume contraction.');
    reasons_bn.push('তীব্র কিডনি অকার্যকারিতায় (ই-জিএফআর ৩০ এর কম) উপবাস সম্পূর্ণ নিষিদ্ধ।');
    safetyResults.push({
      rule_id: 'FASTING_CKD_STAGE4_5_STOP',
      rule_version: '1.0.0',
      patient_id: patient.id,
      decision: 'HARD_STOP',
      severity: 'critical',
      title_en: 'Fasting Contraindicated in Advanced Renal Failure',
      title_bn: 'উন্নত কিডনি অকার্যকারিতায় রোজা/উপবাস নিষিদ্ধ',
      clinical_explanation_en: 'Severe renal insufficiency cannot maintain acid-base and potassium homeostasis during prolonged catabolic fasting.',
      clinical_explanation_bn: 'কিডনির গুরুতর ক্ষতিতে দীর্ঘ উপবাস এসিড-ক্ষার ও পটাশিয়াম ভারসাম্য নষ্ট করে জীবন ঝুঁকিপূর্ণ করতে পারে।',
      required_action_en: 'Maintain continuous, regulated hydration and non-fasting meal schedule.',
      required_action_bn: 'উপবাস বন্ধ রাখুন এবং নিয়মিত খাবার ও পানি নিশ্চিত করুন।',
      triggering_observations: [`egfr:${patient.labs?.egfr}`],
      clinician_review_required: true,
      provenance_reference: 'KDIGO Clinical Practice Guideline for CKD Nutrition',
      timestamp: new Date().toISOString()
    });
  } else if (hasCKD) {
    if (isEligible) {
      if (maxHours > 14) {
        maxHours = 14;
      }
      riskLevel = riskLevel === 'contraindicated' || riskLevel === 'high_risk_supervised' ? riskLevel : 'moderate_risk';
      reasons_en.push('CKD Stages 1–3b requires restricting fasting to <=14 hours to prevent volume contraction and hyperuricemic crystal precipitation.');
      reasons_bn.push('কিডনি রোগে পানিশূন্যতা ও ইউরিক এসিড জমা এড়াতে উপবাস সর্বোচ্চ ১৪ ঘণ্টায় সীমিত রাখা আবশ্যক।');
      if (proposedFastingHours && proposedFastingHours > 14) {
        safetyResults.push({
          rule_id: 'FASTING_CKD_PROLONGED_STOP',
          rule_version: '1.0.0',
          patient_id: patient.id,
          decision: 'HARD_STOP',
          severity: 'high',
          title_en: 'Fasting Blocked: CKD Catabolic Nitrogen Hazard',
          title_bn: 'উপবাস সীমাবদ্ধ: কিডনি জটিলতা ও প্রোটিন ক্যাটাবলিজমের ঝুঁকি',
          clinical_explanation_en: `Proposed fasting of ${proposedFastingHours} hours in CKD exceeds the safe 14-hour physiological limit, inducing transient hypovolemia and hyperfiltration.`,
          clinical_explanation_bn: 'কিডনি রোগে ১৪ ঘণ্টার বেশি উপবাস পানিশূন্যতা তৈরি করে এবং নেফ্রনের ক্ষতি করতে পারে।',
          required_action_en: 'Cap fasting duration at maximum 14 hours and maintain adequate hydration.',
          required_action_bn: 'উপবাসের সময় সর্বোচ্চ ১৪ ঘণ্টায় সীমাবদ্ধ রাখুন।',
          triggering_observations: [`conditions:ckd_stage_1_3b`, `proposed_hours:${proposedFastingHours}`],
          clinician_review_required: true,
          provenance_reference: 'KDOQI Clinical Practice Guideline for Nutrition in CKD',
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  // 4d. HPA-Axis Dysregulation / Severe Neuro-Adrenal Burnout
  const hasHPABurnout = (patient.selected_conditions || []).includes('hpa_axis_burnout');
  if (hasHPABurnout && isEligible) {
    if (maxHours > 14) {
      maxHours = 14;
    }
    riskLevel = riskLevel === 'contraindicated' || riskLevel === 'high_risk_supervised' ? riskLevel : 'moderate_risk';
    reasons_en.push('HPA-axis burnout requires fasting cap at <=14h to prevent reactive hypoglycemia and adrenal cortisol spikes.');
    reasons_bn.push('অ্যাড্রেনাল ক্লান্তিতে কর্টিসল হরমোন অতিরিক্ত বৃদ্ধি রোধে উপবাস সর্বোচ্চ ১৪ ঘণ্টায় সীমিত রাখা আবশ্যক।');
    if (proposedFastingHours && proposedFastingHours > 14) {
      safetyResults.push({
        rule_id: 'FASTING_HPA_BURNOUT_PROLONGED_STOP',
        rule_version: '1.0.0',
        patient_id: patient.id,
        decision: 'HARD_STOP',
        severity: 'high',
        title_en: 'Fasting Blocked: HPA-Axis Reactive Cortisol Surge',
        title_bn: 'উপবাস সীমাবদ্ধ: এইচপিএ-অ্যাক্সিস কর্টিসল স্পাইকের ঝুঁকি',
        clinical_explanation_en: `Proposed fasting of ${proposedFastingHours} hours in severe neuro-adrenal burnout induces counter-regulatory epinephrine/cortisol surges that exacerbate systemic dysregulation.`,
        clinical_explanation_bn: 'অ্যাড্রেনাল ক্লান্তিতে দীর্ঘ উপবাসে রক্তে সুগার কমে গিয়ে হঠাৎ কর্টিসল বৃদ্ধি পায় যা নার্ভাস সিস্টেমের জন্য ক্ষতিকর।',
        required_action_en: 'Cap fasting at maximum 14 hours and ensure timely morning breakfast.',
        required_action_bn: 'উপবাস সর্বোচ্চ ১৪ ঘণ্টায় সীমাবদ্ধ রাখুন এবং সকালে পুষ্টিকর নাশতা নিশ্চিত করুন।',
        triggering_observations: [`conditions:hpa_axis_burnout`, `proposed_hours:${proposedFastingHours}`],
        clinician_review_required: true,
        provenance_reference: 'Endocrine Society Clinical Practice Guidelines on Adrenal Dysregulation',
        timestamp: new Date().toISOString()
      });
    }
  }

  // 5. Proposed Duration Validation against max allowable
  if (proposedFastingHours && proposedFastingHours > maxHours && isEligible && !safetyResults.some(r => r.rule_id === 'FASTING_HYPOGLYCEMIA_MED_STOP' && r.decision === 'HARD_STOP')) {
    safetyResults.push({
      rule_id: 'FASTING_DURATION_EXCEEDS_MAX_ALLOWABLE',
      rule_version: '1.0.0',
      patient_id: patient.id,
      decision: 'HARD_STOP',
      severity: 'critical',
      title_en: 'Proposed Fasting Duration Exceeds Allowable Limit',
      title_bn: 'প্রস্তাবিত উপবাসের সময়সীমা নিরাপদ সীমার চেয়ে বেশি',
      clinical_explanation_en: `Proposed fasting duration (${proposedFastingHours} hours) exceeds the patient's maximum allowable safe duration (${maxHours} hours).`,
      clinical_explanation_bn: `প্রস্তাবিত ${proposedFastingHours} ঘণ্টার উপবাস রোগীর জন্য অনুমোদিত সর্বোচ্চ ${maxHours} ঘণ্টার চেয়ে বেশি।`,
      required_action_en: `Cap fasting at maximum ${maxHours} hours or switch to a safe non-fasting meal schedule.`,
      required_action_bn: `উপবাসের সময় সর্বোচ্চ ${maxHours} ঘণ্টায় সীমিত রাখুন বা নিয়মিত খাবার সময়সূচি নির্ধারণ করুন।`,
      triggering_observations: [`proposed_hours:${proposedFastingHours}`, `max_allowable:${maxHours}`],
      clinician_review_required: true,
      provenance_reference: 'Clinical Fasting Duration Safety Standards',
      timestamp: new Date().toISOString()
    });
  }

  // 6. Insufficient Data Check
  if ((!patient.age && patient.age !== 0) || !patient.weight_kg) {
    isEligible = false;
    maxHours = 12;
    riskLevel = 'moderate_risk';
    reasons_en.push('Incomplete demographic or anthropometric data. Conservative non-fasting default enforced.');
    reasons_bn.push('রোগীর বয়স বা ওজনের তথ্য অসম্পূর্ণ থাকায় সতর্কতামূলক হিসেবে উপবাস পরিহার করা হয়েছে।');
    safetyResults.push({
      rule_id: 'FASTING_INSUFFICIENT_DATA_REVIEW',
      rule_version: '1.0.0',
      patient_id: patient.id,
      decision: 'CLINICAL_REVIEW_REQUIRED',
      severity: 'medium',
      title_en: 'Fasting Data Incomplete: Conservative Schedule Default',
      title_bn: 'উপবাস মূল্যায়নের জন্য তথ্য অসম্পূর্ণ',
      clinical_explanation_en: 'Missing baseline weight or age requires clinician evaluation before assigning restrictive fasting windows.',
      clinical_explanation_bn: 'প্রয়োজনীয় তথ্যের অনুপস্থিতিতে উপবাস শুরু করার পূর্বে চিকিৎসকের পরামর্শ কাম্য।',
      required_action_en: 'Obtain verified weight and age before prescribing intermittent fasting.',
      required_action_bn: 'উপবাসের পূর্বে রোগীর ওজন ও বয়স নিশ্চিত করুন।',
      triggering_observations: ['incomplete_vitals'],
      clinician_review_required: true,
      provenance_reference: 'Safe Clinical Fasting Screening Standards',
      timestamp: new Date().toISOString()
    });
  }

  const eligibility: FastingSafetyEligibility = {
    is_eligible_for_fasting: isEligible,
    max_allowable_fasting_hours: maxHours,
    contraindication_reasons_en: reasons_en,
    contraindication_reasons_bn: reasons_bn,
    requires_medication_rescheduling: requiresMedAdjustment,
    glucose_monitoring_mandated: glucoseMonitoring,
    risk_level: riskLevel
  };

  return { eligibility, safetyResults };
}
