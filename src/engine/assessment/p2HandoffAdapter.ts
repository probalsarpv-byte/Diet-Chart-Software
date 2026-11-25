/**
 * SHUDDHO FUNCTIONAL NUTRITION SOFTWARE
 * P2 Clinical Intelligence Handoff Adapter (Phase P1)
 * 
 * Bridges Phase P1 Adaptive Assessment structured data into
 * Phase P2 Clinical Intelligence Engine observations and hypothesis inputs.
 */

import { PatientProfile } from '../../types';
import { ClinicalObservation, FunctionalDomain } from '../p2/types';
import {
  ClinicalAssessment,
  AssessmentCompletionStatus,
  DietaryFrequencyAssessment,
  CompleteAyurvedicAssessment,
  PopulationSpecificData,
  LabAssessmentData
} from '../../types/assessment';
import { normalizeSingleLabEntry } from '../r7/labFoundation';

export interface P2HandoffPackage {
  patient: PatientProfile;
  assessment: ClinicalAssessment;
  derivedObservations: ClinicalObservation[];
  flattenedAnswersForP2: Record<string, any>;
}

export interface GlucoseInterpretation {
  isValid: boolean;
  status: 'normal' | 'elevated' | 'uninterpretable';
  tags: string[];
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  flag: 'NORMAL' | 'HIGH' | 'ELEVATED' | 'UNINTERPRETABLE';
  normalRange: string;
  warningNote?: string;
}

export function interpretGlucoseMarker(
  marker: 'fbs' | 'ppbs',
  value: number,
  unit: string
): GlucoseInterpretation {
  const normUnit = (unit || '').trim().toLowerCase();
  const isMmol = normUnit === 'mmol/l';
  const isMgDl = normUnit === 'mg/dl';

  if (!isMmol && !isMgDl) {
    return {
      isValid: false,
      status: 'uninterpretable',
      tags: ['lab_marker', marker, 'unsupported_unit'],
      severity: 'none',
      flag: 'UNINTERPRETABLE',
      normalRange: 'N/A',
      warningNote: `Unsupported or unknown unit: ${unit}`
    };
  }

  // Non-positive or non-physiological check:
  // Glucose <= 0 or > 1500 mg/dL (or > ~83.3 mmol/L)
  if (typeof value !== 'number' || isNaN(value) || value <= 0 || (isMmol && value > 83.3) || (isMgDl && value > 1500)) {
    return {
      isValid: false,
      status: 'uninterpretable',
      tags: ['lab_marker', marker, 'uninterpretable_glucose_value'],
      severity: 'none',
      flag: 'UNINTERPRETABLE',
      normalRange: isMmol ? (marker === 'fbs' ? '3.9–5.5 mmol/L' : '<= 7.8 mmol/L') : (marker === 'fbs' ? '70–99 mg/dL' : '< 140 mg/dL'),
      warningNote: `Non-physiological glucose value: ${value}`
    };
  }

  if (marker === 'fbs') {
    const normalRange = isMmol ? '3.9–5.5 mmol/L' : '70–99 mg/dL';
    const isElevated = isMmol ? value > 5.5 : value >= 100;
    if (isElevated) {
      return {
        isValid: true,
        status: 'elevated',
        tags: ['lab_marker', 'fbs', 'elevated_fasting_glucose', 'fasting_hyperglycemia', 'obs_elevated_fasting_glucose'],
        severity: 'moderate',
        flag: 'HIGH',
        normalRange
      };
    } else {
      return {
        isValid: true,
        status: 'normal',
        tags: ['lab_marker', 'fbs', 'normal_fasting_glucose', 'obs_normal_fasting_glucose'],
        severity: 'none',
        flag: 'NORMAL',
        normalRange
      };
    }
  } else {
    // ppbs
    const normalRange = isMmol ? '<= 7.8 mmol/L' : '< 140 mg/dL';
    const isElevated = isMmol ? value > 7.8 : value >= 140;
    if (isElevated) {
      return {
        isValid: true,
        status: 'elevated',
        tags: ['lab_marker', 'ppbs', 'elevated_postprandial_glucose', 'glycemic_instability'],
        severity: 'moderate',
        flag: 'HIGH',
        normalRange
      };
    } else {
      return {
        isValid: true,
        status: 'normal',
        tags: ['lab_marker', 'ppbs', 'normal_postprandial_glucose'],
        severity: 'none',
        flag: 'NORMAL',
        normalRange
      };
    }
  }
}

export function buildP2ClinicalObservations(
  assessment: ClinicalAssessment,
  patient: PatientProfile
): ClinicalObservation[] {
  const observations: ClinicalObservation[] = [];
  const now = new Date().toISOString();

  // Helper to push observations
  function addObs(
    id: string,
    title_en: string,
    title_bn: string,
    domains: FunctionalDomain[],
    severity: 'mild' | 'moderate' | 'severe' = 'moderate',
    tags: string[] = [],
    provenance: string = 'p1_adaptive_assessment'
  ) {
    observations.push({
      id: `obs_${id}`,
      patientId: assessment.patient_id,
      visitId: assessment.visit_id,
      category: 'symptom',
      observedValue: title_en,
      title_en,
      title_bn,
      date: now,
      associatedDomains: domains,
      severity,
      tags,
      dataSource: 'patient_reported',
      verificationStatus: 'clinician_verified',
      provenance
    });
  }

  // 1. Dietary Frequency Findings
  const ffq = assessment.dietary_frequency;
  if (ffq?.summary) {
    if (ffq.summary.completeness_status === 'minimal') {
      addObs(
        'incomplete_ffq_survey',
        'Incomplete 7-Day FFQ Data (Uncertain Dietary Adequacy)',
        'অসম্পূর্ণ খাদ্য ফ্রিকোয়েন্সি তথ্য (পর্যাপ্ততা অনিশ্চিত)',
        ['assimilation'],
        'mild',
        ['incomplete_ffq_data', 'dietary_uncertainty'],
        'ffq_7day_summary'
      );
    } else {
      if (ffq.summary.weekly_plant_diversity_score < 5) {
        addObs(
          'low_plant_diversity',
          'Low Plant Food Group Diversity (<5 distinct plant food groups/week)',
          'কম উদ্ভিজ্জ খাদ্য বৈচিত্র্য (সপ্তাহে ৫টির কম উদ্ভিজ্জ খাদ্য গ্রুপ)',
          ['assimilation'],
          'moderate',
          ['low_food_group_variety', 'low_fiber_diet', 'gut_dysbiosis_risk'],
          'ffq_7day_summary'
        );
      }
      if (ffq.summary.daily_fruit_veg_servings_est < 2.0) {
        addObs(
          'low_fruit_veg',
          'Inadequate Fruit and Vegetable Intake (<2 servings/day)',
          'অপ্রতুল ফল ও শাকসবজি গ্রহণ (দৈনিক ২ সার্ভিংয়ের কম)',
          ['assimilation', 'defense_repair'],
          'moderate',
          ['low_vegetable_intake', 'low_fruit_intake', 'low_fiber_diet'],
          'ffq_7day_summary'
        );
      }
    }
    if (ffq.summary.ultra_processed_burden === 'high' || ffq.summary.ultra_processed_burden === 'very_high') {
      addObs(
        'high_upf_intake',
        'High Ultra-Processed & Fried Street Food Frequency',
        'অতিরিক্ত প্রক্রিয়াজাত ও তেলে ভাজা খাবার গ্রহণ',
        ['assimilation', 'transport', 'energy'],
        'severe',
        ['high_refined_carbs', 'inflammatory_diet', 'high_trans_fat'],
        'ffq_7day_summary'
      );
    }
    if (ffq.summary.sodium_risk_flag) {
      addObs(
        'high_sodium_exposure',
        'Raw Salt at Table or Frequent High-Sodium Processed Snacks',
        'খাবারে বাড়তি কাঁচা লবণ বা অতিরিক্ত লবণাক্ত চানাচুর/ভাজা খাদ্য',
        ['transport', 'structural_integrity'],
        'moderate',
        ['excess_sodium', 'hypertension_risk', 'edema_risk'],
        'ffq_7day_summary'
      );
    }
  }

  // 2. Ayurvedic Findings
  const ayur = assessment.ayurveda;
  if (ayur) {
    if (ayur.agni?.type === 'mandagni') {
      addObs(
        'mandagni_sluggish',
        'Mandagni: Sluggish Digestive Fire with Heaviness & Delayed Gastric Transit',
        'মন্দাগ্নি: ধীরগতির হজম, পেট ভারী ও অজীর্ণ',
        ['assimilation', 'biotransformation'],
        'moderate',
        ['mandagni', 'sluggish_digestion', 'ama_accumulation'],
        'ayurvedic_agni'
      );
    } else if (ayur.agni?.type === 'vishamagni') {
      addObs(
        'vishamagni_irregular',
        'Vishamagni: Variable Irregular Digestion with Bloating & Constipation',
        'বিষমাগ্নি: অনিয়মিত হজম, পেট ফাঁপা ও কোষ্ঠকাঠিন্য',
        ['assimilation', 'communication'],
        'moderate',
        ['vishamagni', 'bloating', 'constipation'],
        'ayurvedic_agni'
      );
    } else if (ayur.agni?.type === 'tikshnagni') {
      addObs(
        'tikshnagni_fiery',
        'Tikshnagni: Fiery Hyper-Metabolism with Acid Regurgitation & Loose Bowels',
        'তীক্ষ্ণাগ্নি: তীব্র ও দ্রুত হজম, বুকজ্বালা ও পাতলা মল',
        ['assimilation', 'defense_repair'],
        'moderate',
        ['tikshnagni', 'acid_reflux', 'loose_stool'],
        'ayurvedic_agni'
      );
    }

    if (ayur.vikriti?.active_aggravations?.includes('vata')) {
      addObs(
        'vata_aggravation',
        'Vata Doshic Aggravation: Intestinal Gas, Skin Dryness, and Restless Sleep',
        'বাত দোষের প্রকোপ: অন্ত্রে বায়ু, ত্বকে শুষ্কতা ও অনিদ্রা',
        ['assimilation', 'communication'],
        'moderate',
        ['vata_aggravation', 'bloating', 'poor_sleep'],
        'ayurvedic_vikriti'
      );
    }
    if (ayur.vikriti?.active_aggravations?.includes('pitta')) {
      addObs(
        'pitta_aggravation',
        'Pitta Doshic Aggravation: Heartburn, Inflammatory Heat, and Irritability',
        'পিত্ত দোষের প্রকোপ: বুকজ্বালা, প্রদাহজনক তাপ ও খিটখিটে মেজাজ',
        ['defense_repair', 'assimilation'],
        'moderate',
        ['pitta_aggravation', 'acid_reflux', 'inflammation'],
        'ayurvedic_vikriti'
      );
    }
  }

  // 3. Functional Question Answers
  const ans = assessment.functional_answers || {};
  if (ans['bloating_frequency'] && ans['bloating_frequency'] !== 'none') {
    addObs(
      'bloating_reported',
      'Post-Meal Abdominal Bloating and Distension',
      'খাবারের পর পেট ফাঁপা ও অস্বস্তি',
      ['assimilation'],
      ans['bloating_frequency'] === 'severe_post_meal' ? 'severe' : 'moderate',
      ['bloating', 'gas'],
      'functional_answers'
    );
  }
  if (ans['acid_reflux_frequency'] && ans['acid_reflux_frequency'] !== 'none') {
    addObs(
      'acid_reflux_reported',
      'Gastroesophageal Acid Regurgitation & Heartburn',
      'গ্যাস্ট্রিক এসিড রিফ্লাক্স ও বুকজ্বালা',
      ['assimilation'],
      'moderate',
      ['acid_reflux', 'heartburn'],
      'functional_answers'
    );
  }
  if (ans['postprandial_fatigue'] === 'yes') {
    addObs(
      'postprandial_fatigue_reported',
      'Severe Post-Meal Energy Crash / Fatigue',
      'খাবারের পর তীব্র ক্লান্তি ও ঝিমুনি',
      ['energy'],
      'moderate',
      ['postprandial_fatigue', 'sugar_crash', 'insulin_resistance_sign'],
      'functional_answers'
    );
  }
  if (ans['sugar_cravings'] === 'strong_daily') {
    addObs(
      'sugar_cravings_reported',
      'Intense Daily Sugar and Refined Carbohydrate Cravings',
      'প্রতিদিন মিষ্টি ও শর্করা জাতীয় খাবারের তীব্র তৃষ্ণা',
      ['energy', 'assimilation'],
      'moderate',
      ['sugar_cravings', 'glycemic_instability'],
      'functional_answers'
    );
  }
  if (ans['joint_stiffness_pain'] === 'yes') {
    addObs(
      'joint_stiffness_reported',
      'Morning Joint Aches & Systemic Low-Grade Inflammation Signs',
      'সকালে গাঁটে ব্যথা, শক্তভাব ও প্রদাহের লক্ষণ',
      ['defense_repair', 'structural_integrity'],
      'moderate',
      ['joint_pain', 'chronic_inflammation'],
      'functional_answers'
    );
  }

  // 4. Pregnancy & Population Modules
  const preg = assessment.population_data?.pregnancy;
  if (preg) {
    addObs(
      'pregnancy_gestational_status',
      `Pregnancy Month ${preg.pregnancy_month} (Trimester ${preg.trimester}, ${preg.gestational_age_weeks} weeks)`,
      `গর্ভাবস্থার ${preg.pregnancy_month}ম মাস (${preg.gestational_age_weeks} সপ্তাহ)`,
      ['assimilation', 'energy', 'transport'],
      'moderate',
      ['pregnancy', 'gestational_nutrition'],
      'masanumasika_pregnancy'
    );
    if (preg.maternal_risks.gestational_diabetes) {
      addObs(
        'gdm_risk',
        'Gestational Diabetes Mellitus (GDM) Risk or Active Diagnosis',
        'জেস্টেশনাল ডায়াবেটিস মেলিটাস (গর্ভকালীন ডায়াবেটিস)',
        ['energy', 'transport'],
        'severe',
        ['gestational_diabetes', 'hyperglycemia_risk'],
        'masanumasika_pregnancy'
      );
    }
  }

  // 5. Anthropometrics (Single Source of Truth from Assessment / Step 2)
  const anthro = assessment.anthropometrics || {
    height_cm: patient.height_cm,
    weight_kg: patient.weight_kg,
    waist_cm: patient.waist_cm,
    bmi: patient.calculated?.bmi ?? 0,
    whtr: patient.calculated?.whtr ?? 0,
    bmr: patient.calculated?.bmr ?? 0,
    target_calories: patient.calculated?.target_calories ?? 0,
    activity_level: patient.activity_level,
  };

  if (anthro.weight_kg > 0) {
    observations.push({
      id: 'obs_weight',
      patientId: assessment.patient_id,
      visitId: assessment.visit_id,
      category: 'anthropometric',
      observedValue: anthro.weight_kg,
      unit: 'kg',
      title_en: `Body Weight: ${anthro.weight_kg} kg`,
      title_bn: `শরীরের ওজন: ${anthro.weight_kg} কেজি`,
      date: now,
      associatedDomains: ['transport', 'energy', 'structural_integrity'],
      severity: 'none',
      tags: ['weight_measurement'],
      dataSource: 'measured',
      verificationStatus: 'clinician_verified',
      provenance: 'p1_demographics_vitals',
    });
  }

  if (anthro.height_cm > 0) {
    observations.push({
      id: 'obs_height',
      patientId: assessment.patient_id,
      visitId: assessment.visit_id,
      category: 'anthropometric',
      observedValue: anthro.height_cm,
      unit: 'cm',
      title_en: `Body Height: ${anthro.height_cm} cm`,
      title_bn: `উচ্চতা: ${anthro.height_cm} সেমি`,
      date: now,
      associatedDomains: ['structural_integrity'],
      severity: 'none',
      tags: ['height_measurement'],
      dataSource: 'measured',
      verificationStatus: 'clinician_verified',
      provenance: 'p1_demographics_vitals',
    });
  }

  if (anthro.bmi > 0) {
    const isObese = anthro.bmi >= 30;
    const isOverweight = anthro.bmi >= 25;
    const isUnderweight = anthro.bmi < 18.5;
    const tags: string[] = [];
    if (isObese) tags.push('high_bmi', 'obesity', 'excess_adiposity');
    else if (isOverweight) tags.push('high_bmi', 'overweight', 'excess_adiposity');
    else if (isUnderweight) tags.push('low_bmi', 'underweight', 'malnutrition_risk');
    else tags.push('normal_bmi');

    observations.push({
      id: 'obs_bmi',
      patientId: assessment.patient_id,
      visitId: assessment.visit_id,
      category: 'anthropometric',
      observedValue: anthro.bmi,
      unit: 'kg/m²',
      title_en: `Body Mass Index: ${anthro.bmi} kg/m²`,
      title_bn: `বিএমআই: ${anthro.bmi} কেজি/মি²`,
      date: now,
      associatedDomains: ['transport', 'energy', 'structural_integrity'],
      severity: isObese ? 'moderate' : isOverweight ? 'mild' : 'none',
      tags,
      dataSource: 'measured',
      verificationStatus: 'clinician_verified',
      provenance: 'p1_demographics_vitals',
    });
  }

  if (anthro.waist_cm > 0) {
    const isFemale = patient.gender === 'female';
    const isCentralAdiposity = isFemale ? anthro.waist_cm > 80 : anthro.waist_cm > 90;
    const tags = isCentralAdiposity ? ['central_adiposity', 'visceral_fat_accumulation'] : ['normal_waist'];

    observations.push({
      id: 'obs_waist',
      patientId: assessment.patient_id,
      visitId: assessment.visit_id,
      category: 'anthropometric',
      observedValue: anthro.waist_cm,
      unit: 'cm',
      title_en: `Waist Circumference: ${anthro.waist_cm} cm`,
      title_bn: `কোমর পরিধি: ${anthro.waist_cm} সেমি`,
      date: now,
      associatedDomains: ['transport', 'energy'],
      severity: isCentralAdiposity ? 'moderate' : 'none',
      tags,
      dataSource: 'measured',
      verificationStatus: 'clinician_verified',
      provenance: 'p1_demographics_vitals',
    });
  }

  if (anthro.whtr > 0) {
    const isElevatedWhtr = anthro.whtr >= 0.5;
    const tags = isElevatedWhtr ? ['elevated_whtr', 'central_adiposity'] : ['normal_whtr'];

    observations.push({
      id: 'obs_whtr',
      patientId: assessment.patient_id,
      visitId: assessment.visit_id,
      category: 'anthropometric',
      observedValue: anthro.whtr,
      unit: 'ratio',
      title_en: `Waist-to-Height Ratio: ${anthro.whtr}`,
      title_bn: `কোমর-উচ্চতা অনুপাত: ${anthro.whtr}`,
      date: now,
      associatedDomains: ['transport', 'energy'],
      severity: isElevatedWhtr ? 'moderate' : 'none',
      tags,
      dataSource: 'measured',
      verificationStatus: 'clinician_verified',
      provenance: 'p1_demographics_vitals',
    });
  }

  // 6. Structured Laboratory Observations (Step 8 Intake)
  if (assessment.labs?.entries) {
    for (const entry of Object.values(assessment.labs.entries)) {
      // Strictly process ONLY tested biomarkers with a valid numeric value!
      // Untested, pending, or unmeasured biomarkers are never hallucinated or converted.
      if (entry.status !== 'previously_tested' || entry.numeric_value === undefined || isNaN(entry.numeric_value)) {
        continue;
      }

      const val = entry.numeric_value;
      const markerId = entry.marker_id;
      const tags: string[] = ['lab_marker', markerId];
      let severity: 'mild' | 'moderate' | 'severe' | 'none' = 'none';
      let domains: FunctionalDomain[] = ['energy'];

      // Domain mapping
      if (entry.category === 'glycemic') domains = ['energy'];
      else if (entry.category === 'lipid') domains = ['transport'];
      else if (entry.category === 'renal') domains = ['biotransformation', 'transport'];
      else if (entry.category === 'hepatic') domains = ['biotransformation'];
      else if (entry.category === 'electrolytes') domains = ['structural_integrity', 'transport'];
      else if (entry.category === 'thyroid') domains = ['communication', 'energy'];
      else if (entry.category === 'hematology_iron') domains = ['transport', 'energy'];
      else if (entry.category === 'vitamins_minerals') domains = ['communication', 'energy', 'defense_repair'];
      else if (entry.category === 'inflammatory_markers') domains = ['defense_repair'];

      // Specific clinical rules and tags
      if (markerId === 'hba1c') {
        if (val >= 6.5) {
          tags.push('elevated_hba1c', 'diabetes_range_hba1c', 'glycemic_dysregulation', 'obs_hba1c_borderline_or_above');
          severity = 'moderate';
        } else if (val >= 5.7) {
          tags.push('elevated_hba1c', 'prediabetes_range_hba1c', 'obs_hba1c_borderline_or_above');
          severity = 'mild';
        } else {
          tags.push('normal_hba1c', 'obs_normal_hba1c');
          severity = 'none';
        }
      } else if (markerId === 'fbs' || markerId === 'ppbs') {
        const interp = interpretGlucoseMarker(markerId, val, entry.unit);
        for (const t of interp.tags) {
          if (!tags.includes(t)) tags.push(t);
        }
        severity = interp.severity;
      } else if (markerId === 'fasting_insulin') {
        if (val > 10) {
          tags.push('elevated_fasting_insulin', 'hyperinsulinemia', 'insulin_resistance_sign');
          severity = 'moderate';
        }
      } else if (markerId === 'serum_creatinine') {
        if (val > (patient.gender === 'female' ? 1.1 : 1.2)) {
          tags.push('elevated_creatinine', 'renal_impairment_sign');
          severity = 'moderate';
        }
      } else if (markerId === 'serum_potassium') {
        if (val > 5.0) {
          tags.push('hyperkalemia', 'electrolyte_imbalance');
          severity = 'moderate';
        } else if (val < 3.5) {
          tags.push('hypokalemia', 'electrolyte_imbalance');
          severity = 'moderate';
        }
      } else if (markerId === 'serum_uric_acid') {
        if (val > (patient.gender === 'female' ? 6.0 : 7.0)) {
          tags.push('elevated_uric_acid', 'hyperuricemia');
          severity = 'moderate';
        }
      } else if (markerId === 'sgpt_alt') {
        if (val > 35) {
          tags.push('elevated_alt', 'hepatic_stress');
          severity = 'moderate';
        }
      } else if (markerId === 'total_cholesterol') {
        if (val > 200) {
          tags.push('elevated_cholesterol', 'dyslipidemia');
          severity = 'mild';
        }
      } else if (markerId === 'triglycerides') {
        if (val > 150) {
          tags.push('elevated_triglycerides', 'dyslipidemia');
          severity = 'moderate';
        }
      } else if (markerId === 'ldl') {
        if (val > 100) {
          tags.push('elevated_ldl', 'dyslipidemia');
          severity = 'moderate';
        }
      } else if (markerId === 'hdl') {
        if (val < (patient.gender === 'female' ? 50 : 40)) {
          tags.push('low_hdl', 'dyslipidemia');
          severity = 'mild';
        }
      } else if (markerId === 'tsh') {
        if (val > 4.5) {
          tags.push('elevated_tsh', 'abnormal_tsh', 'hypothyroid_pattern');
          severity = 'moderate';
        } else if (val < 0.4) {
          tags.push('low_tsh', 'abnormal_tsh', 'hyperthyroid_pattern');
          severity = 'moderate';
        }
      } else if (markerId === 'hemoglobin') {
        if (val < (patient.gender === 'female' ? 12.0 : 13.0)) {
          tags.push('low_hemoglobin', 'anemia_sign');
          severity = 'moderate';
        }
      } else if (markerId === 'serum_ferritin') {
        if (val < 30) {
          tags.push('low_ferritin', 'iron_depletion');
          severity = 'moderate';
        }
      } else if (markerId === 'vitamin_d3') {
        if (val < 30) {
          tags.push('low_vitamin_d3', 'vitamin_d_deficiency');
          severity = 'moderate';
        }
      } else if (markerId === 'vitamin_b12') {
        if (val < 300) {
          tags.push('low_vitamin_b12', 'vitamin_b12_deficiency');
          severity = 'moderate';
        }
      } else if (markerId === 'hs_crp') {
        if (val > 1.0) {
          tags.push('elevated_crp', 'systemic_inflammation');
          severity = val > 3.0 ? 'severe' : 'moderate';
        }
      }

      const normObs = normalizeSingleLabEntry(entry as any, {
        patientId: assessment.patient_id,
        visitId: assessment.visit_id
      });
      const resolvedStatus: ClinicalObservation['verificationStatus'] =
        entry.verification_status === 'clinician_verified' || entry.verification_status === 'lab_document_reviewed'
          ? 'lab_confirmed'
          : 'unverified';

      observations.push({
        id: `obs_lab_${markerId}`,
        patientId: assessment.patient_id,
        visitId: assessment.visit_id,
        category: 'lab',
        sourceLabMarker: markerId,
        observedValue: normObs.normalized_value ?? val,
        unit: normObs.canonical_unit || entry.unit,
        title_en: `${entry.name_en}: ${normObs.normalized_value ?? val} ${normObs.canonical_unit || entry.unit}`,
        title_bn: `${entry.name_bn}: ${normObs.normalized_value ?? val} ${normObs.canonical_unit || entry.unit}`,
        date: entry.test_date || now,
        associatedDomains: domains,
        severity: severity as any,
        tags,
        dataSource: entry.verification_status === 'patient_reported' ? 'patient_reported' : 'measured',
        verificationStatus: resolvedStatus,
        provenance: entry.source_type || 'p1_laboratory_assessment',
      });
    }
  }

  return observations;
}

/**
 * Creates flattened answers record suitable for P2 evidence aggregator.
 */
export function buildFlattenedAnswersForP2(assessment: ClinicalAssessment): Record<string, any> {
  const flat: Record<string, any> = { ...assessment.functional_answers };

  // Overlay FFQ summary findings
  if (assessment.dietary_frequency?.summary) {
    const s = assessment.dietary_frequency.summary;
    // Actual P1 FFQ plant diversity metric: 12 plant categories. Score < 5 is low diversity; 5-8 moderate; >= 9 high.
    if (s.weekly_plant_diversity_score < 5) flat['low_food_group_variety'] = 'yes';
    if (s.daily_fruit_veg_servings_est < 2) flat['low_vegetable_intake'] = 'yes';
    if (s.ultra_processed_burden === 'high' || s.ultra_processed_burden === 'very_high') flat['fried_food_intake'] = 'frequent';
    if (s.sodium_risk_flag) flat['raw_salt_added_at_table'] = 'yes';
  }

  // Overlay Ayurvedic findings
  if (assessment.ayurveda?.agni) {
    flat['agni_type'] = assessment.ayurveda.agni.type;
  }
  if (assessment.ayurveda?.vikriti?.active_aggravations) {
    flat['active_vikriti'] = assessment.ayurveda.vikriti.active_aggravations;
  }

  // Overlay Pregnancy
  if (assessment.population_data?.pregnancy) {
    flat['gestational_age_weeks'] = assessment.population_data.pregnancy.gestational_age_weeks;
    flat['pregnancy_month'] = assessment.population_data.pregnancy.pregnancy_month;
  }

  // Overlay Structured Tested Labs (R7 normalized canonical units!)
  if (assessment.labs?.entries) {
    for (const [markerId, entry] of Object.entries(assessment.labs.entries)) {
      if (entry.status === 'previously_tested' && entry.numeric_value !== undefined) {
        const normObs = normalizeSingleLabEntry(entry as any, {
          patientId: assessment.patient_id,
          visitId: assessment.visit_id
        });
        const effVal = normObs.normalized_value ?? entry.numeric_value;
        const cid = normObs.canonical_marker_id || markerId;
        flat[`lab_${markerId}`] = effVal;
        flat[`lab_${cid}`] = effVal;
        if (markerId === 'fbs' || cid === 'fasting_glucose') flat['fasting_glucose'] = effVal;
        if (markerId === 'hba1c' || cid === 'hba1c') flat['hba1c'] = effVal;
      }
    }
  }

  return flat;
}

/**
 * Prepares full handoff package to P2 Clinical Intelligence Engine.
 */
export function prepareP2Handoff(
  assessment: ClinicalAssessment,
  patient: PatientProfile
): P2HandoffPackage {
  const derivedObservations = buildP2ClinicalObservations(assessment, patient);
  const flattenedAnswersForP2 = buildFlattenedAnswersForP2(assessment);

  return {
    patient,
    assessment,
    derivedObservations,
    flattenedAnswersForP2
  };
}
