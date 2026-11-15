/**
 * SHUDDHO FUNCTIONAL NUTRITION SOFTWARE
 * Feeding Route & Hospital Safety Engine (Phase P0 Foundation)
 * 
 * Enforces hospital feeding safety constraints:
 * Blocks standard oral diet charts for NPO, enteral tube, and parenteral patients.
 * Evaluates dysphagia texture modifications and aspiration risks.
 */

import { PatientProfile, DietChartMeal, ClinicalSafetyResult } from '../types';

export function evaluateFeedingRouteSafety(
  patient: PatientProfile,
  meals: DietChartMeal[]
): ClinicalSafetyResult[] {
  const results: ClinicalSafetyResult[] = [];
  const status = patient.feeding_status;

  if (!status) {
    return results; // Defaults to standard oral if unspecified
  }

  // 1. NPO (Nil Per Os) - Absolute Oral Block
  if (status.route === 'npo_nil_per_os' || !status.oral_intake_permitted) {
    if (meals.length > 0) {
      results.push({
        rule_id: 'FEEDING_ROUTE_NPO_HARD_STOP',
        rule_version: '1.0.0',
        patient_id: patient.id,
        decision: 'HARD_STOP',
        severity: 'critical',
        title_en: 'NPO HOSPITAL SAFETY STOP: All Oral Intake Strictly Prohibited',
        title_bn: 'এনপিও সতর্কতা: সকল প্রকার মুখে খাবার গ্রহণ সম্পূর্ণ নিষিদ্ধ',
        clinical_explanation_en: 'Patient is classified as NPO (Nil Per Os) due to acute surgical preparation, bowel obstruction, active GI bleeding, or airway compromise. Generating or approving an oral diet chart presents severe clinical risk.',
        clinical_explanation_bn: 'রোগী এনপিও (মুখে খাবার গ্রহণ নিষিদ্ধ) অবস্থায় রয়েছেন। সাধারণ খাদ্যতালিকা অনুমোদন করা যাবে না।',
        required_action_en: 'Standard oral meal plan is blocked. Maintain intravenous hydration or consult attending physician for NPO clearance.',
        required_action_bn: 'মুখে খাবার তালিকা বন্ধ রাখুন এবং চিকিৎসকের পরবর্তী আদেশের জন্য অপেক্ষা করুন।',
        triggering_observations: [`feeding_route:${status.route}`, 'oral_intake_permitted:false'],
        clinician_review_required: true,
        provenance_reference: 'Hospital Clinical Nutrition Safety Standards (ASPEN/ESPEN)',
        timestamp: new Date().toISOString()
      });
    }
  }

  // 2. Enteral Tube Feeding (NG / PEG / PEJ)
  if (status.route === 'enteral_tube_nasogastric' || status.route === 'enteral_tube_peg_pej') {
    results.push({
      rule_id: 'ENTERAL_TUBE_SPECIALIST_STOP',
      rule_version: '1.0.0',
      patient_id: patient.id,
      decision: 'HARD_STOP',
      severity: 'critical',
      title_en: 'Enteral Tube Route: Standard Solid Food Diet Chart Incompatible',
      title_bn: 'নাসোগ্যাস্ট্রিক/এন্টেরাল টিউব: সাধারণ শক্ত খাবার নিষিদ্ধ',
      clinical_explanation_en: `Patient is receiving enteral tube feeding via ${status.route}. Standard solid or cooked whole meals cannot be administered through feeding tubes and cause tube blockage or aspiration.`,
      clinical_explanation_bn: 'রোগী টিউব ফিডিংয়ের মাধ্যমে খাবার নিচ্ছেন। সাধারণ শক্ত খাবার টিউবে দেওয়া যাবে না।',
      required_action_en: 'Route patient to Enteral Nutrition Support Protocol (commercial enteral formula or standardized blenderized liquid prescription).',
      required_action_bn: 'এন্টেরাল ফর্মুলা বা ব্লেন্ডারাইজড তরল খাদ্য প্রোটোকলে স্থানান্তর করুন।',
      triggering_observations: [`feeding_route:${status.route}`],
      clinician_review_required: true,
      provenance_reference: 'ASPEN Enteral Nutrition Practice Recommendations',
      timestamp: new Date().toISOString()
    });
  }

  // 3. Parenteral Nutrition (TPN / PPN)
  if (status.route === 'parenteral_total_tpn' || status.route === 'parenteral_peripheral_ppn') {
    results.push({
      rule_id: 'PARENTERAL_NUTRITION_STOP',
      rule_version: '1.0.0',
      patient_id: patient.id,
      decision: 'HARD_STOP',
      severity: 'critical',
      title_en: 'Parenteral Nutrition: Oral Diet Chart Prohibited',
      title_bn: 'প্যারেন্টেরাল পুষ্টি (শিরাপথে): মুখের সাধারণ খাদ্যতালিকা নিষিদ্ধ',
      clinical_explanation_en: 'Patient is dependent on central or peripheral venous nutrition due to intestinal failure. Routine oral charts are contraindicated.',
      clinical_explanation_bn: 'রোগী শিরাপথে পুষ্টি নিচ্ছেন। মুখের সাধারণ খাদ্যতালিকা প্রযোজ্য নয়।',
      required_action_en: 'Route to hospital clinical pharmacy & nutrition support team for parenteral osmolarity and electrolyte compounding.',
      required_action_bn: 'হাসপাতালের নিউট্রিশন সাপোর্ট টিম ও ক্লিনিক্যাল ফার্মাসির সাথে যোগাযোগ করুন।',
      triggering_observations: [`feeding_route:${status.route}`],
      clinician_review_required: true,
      provenance_reference: 'ASPEN Parenteral Nutrition Safety Consensus Recommendations',
      timestamp: new Date().toISOString()
    });
  }

  // 4. Dysphagia & Swallowing Impairment (Texture Modification)
  if (status.swallowing_difficulty_dysphagia || status.aspiration_risk) {
    results.push({
      rule_id: 'DYSPHAGIA_TEXTURE_MODIFICATION_REVIEW',
      rule_version: '1.0.0',
      patient_id: patient.id,
      decision: 'CLINICAL_REVIEW_REQUIRED',
      severity: 'high',
      title_en: 'Dysphagia / Aspiration Risk: Texture Modification Mandated',
      title_bn: 'ডিসফেজিয়া ও অ্যাসপিরেশন ঝুঁকি: খাবারের গঠন পরিবর্তন আবশ্যক',
      clinical_explanation_en: 'Patient exhibits dysphagia or choking/aspiration risk. Standard hard, crumbly, or mixed-consistency foods risk fatal pulmonary aspiration pneumonia.',
      clinical_explanation_bn: 'রোগীর গিলতে সমস্যা রয়েছে। সাধারণ শক্ত খাবার ফুসফুসে চলে গিয়ে অ্যাসপিরেশন নিউমোনিয়া হতে পারে।',
      required_action_en: 'Verify diet chart conforms to IDDSI (International Dysphagia Diet Standardisation Initiative) pureed (Level 4) or soft & bite-sized (Level 6) specifications.',
      required_action_bn: 'আইডিডিএসআই গাইডলাইন অনুযায়ী খাবার নরম, ব্লেন্ড বা পিউরি করে প্রস্তুত করুন।',
      triggering_observations: ['dysphagia:true', 'aspiration_risk:true'],
      clinician_review_required: true,
      provenance_reference: 'IDDSI Framework and Clinical Guidelines',
      timestamp: new Date().toISOString()
    });
  }

  return results;
}
