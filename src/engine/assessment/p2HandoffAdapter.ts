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

export interface P2HandoffPackage {
  patient: PatientProfile;
  assessment: ClinicalAssessment;
  derivedObservations: ClinicalObservation[];
  flattenedAnswersForP2: Record<string, any>;
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
    if (s.weekly_plant_diversity_score < 10) flat['low_food_group_variety'] = 'yes';
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
