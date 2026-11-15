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
  if (pop === 'pregnancy' || pop === 'lactation') {
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

  // 3. Underweight & Malnutrition Risk
  if (weight && weight < 45) {
    isEligible = false;
    maxHours = 0;
    riskLevel = 'contraindicated';
    reasons_en.push('Underweight status (<45 kg) contraindicates fasting due to inadequate glycogen stores and catabolic risk.');
    reasons_bn.push('কম ওজনের (<৪৫ কেজি) রোগীদের জন্য উপবাস নিষিদ্ধ।');
    safetyResults.push({
      rule_id: 'FASTING_UNDERWEIGHT_STOP',
      rule_version: '1.0.0',
      patient_id: patient.id,
      decision: 'HARD_STOP',
      severity: 'critical',
      title_en: 'Fasting Contraindicated: Severe Underweight / Cachexia Risk',
      title_bn: 'কম ওজনের কারণে উপবাস নিষিদ্ধ',
      clinical_explanation_en: 'Patient has inadequate adipose and glycogen reserves. Fasting will accelerate somatic muscle proteolysis.',
      clinical_explanation_bn: 'শরীরে সঞ্চিত শক্তির ঘাটতি থাকায় উপবাস করলে মাংসপেশি ভেঙে মারাত্মক ক্ষতি হবে।',
      required_action_en: 'Initiate hypercaloric refeeding protocol. Fasting is blocked.',
      required_action_bn: 'পুষ্টিকর খাবারের মাধ্যমে ওজন বৃদ্ধির পরিকল্পনা করুন।',
      triggering_observations: [`weight_kg:${weight}`],
      clinician_review_required: true,
      provenance_reference: 'ESPEN Malnutrition Protocol',
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
