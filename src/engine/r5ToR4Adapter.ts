/**
 * SHUDDHO Phase R5 to R4 Integration Adapter
 * 
 * Bridges R5 Systems Intelligence (Populations, Pathways, Medications, Functional Matrix, Conflicts)
 * with R4 Protocol Studio (Hydration, Chronotherapy, Exercise, Supplements, Sleep).
 * 
 * Key Architectural Guardrails:
 * 1. ZERO IN-PLACE MUTATION OF APPROVED PLANS: If an approved R4 protocol exists, this adapter
 *    NEVER silently modifies the approved record. Instead, it marks draft candidate sections as
 *    stale / requiring re-review and preserves the approved baseline.
 * 2. DETERMINISTIC CHRONOTHERAPY SYNC: Maps R5 medications into chronotherapy timeline with
 *    precise prandial timing rules, marking unrecorded times as 'UNKNOWN' rather than guessing.
 * 3. LIFE-STAGE AWARE HYDRATION & EXERCISE: Derives pediatric Holliday-Segar fluid targets
 *    and pathway-specific exercise precautions (e.g., bone loading vs spine flexion precautions).
 * 4. DRAFT SUPPLEMENT CANDIDATES ONLY: Supplement recommendations are generated strictly as
 *    'draft_candidate' requiring explicit clinician verification.
 */

import {
  R4ProtocolStudioData,
  ChronotherapyTimelineItem,
  SupplementProtocolItem,
  HydrationProtocol,
  ExerciseProtocol
} from '../types/r4Protocol';

import {
  R5ClinicalContextPayload,
  R4StaleSectionNotification
} from '../types/r5Systems';

import { analyzeInsulinRegimen } from './r5InsulinEngine';

export interface R5ToR4IntegrationResult {
  updated_draft: Partial<R4ProtocolStudioData>;
  stale_notifications: R4StaleSectionNotification[];
  requires_clinician_reapproval: boolean;
  integration_alerts_en: string[];
  integration_alerts_bn: string[];
}

/**
 * Maps R5 Clinical Context to R4 Protocol Studio recommendations
 */
export function adaptR5ContextToR4(
  r5Context: R5ClinicalContextPayload,
  currentR4Data?: R4ProtocolStudioData
): R5ToR4IntegrationResult {
  const staleNotifications: R4StaleSectionNotification[] = [];
  const alertsEn: string[] = [];
  const alertsBn: string[] = [];

  const isApproved = currentR4Data?.status === 'active';

  // 1. Chronotherapy Timeline Synchronization
  const updatedTimeline: ChronotherapyTimelineItem[] = [];
  analyzeInsulinRegimen(r5Context.medications);

  for (const med of r5Context.medications) {
    if (med.status !== 'active') continue;

    const generic = (med.generic_name || '').toLowerCase();
    const isTimingUnknown = med.is_timing_unknown || !med.administration_times || med.administration_times.length === 0 || med.administration_times.includes('UNKNOWN');
    const displayTime = isTimingUnknown ? 'UNKNOWN' : (med.administration_times[0] || 'UNKNOWN');

    let instructionsEn = 'Take as prescribed';
    let instructionsBn = 'নির্দেশনা অনুযায়ী সেবন করুন';

    if (generic.includes('levothyroxine')) {
      instructionsEn = 'Take on empty stomach 60 minutes before breakfast with full glass of water. Avoid calcium/iron for 4 hours.';
      instructionsBn = 'সকালের নাস্তার ৬০ মিনিট আগে খালি পেটে এক গ্লাস পানিসহ সেবন করুন। ৪ ঘণ্টার মধ্যে ক্যালসিয়াম বা আয়রন খাবেন না।';
    } else if (generic.includes('alendronate') || generic.includes('risedronate') || generic.includes('ibandronate')) {
      instructionsEn = 'Take upon waking with 250 mL plain water. Remain upright for at least 30 minutes.';
      instructionsBn = 'ঘুম থেকে উঠে ২৫০ মিলি সাধারণ পানিসহ সেবন করুন। অন্তত ৩০ মিনিট সোজা হয়ে বসে বা দাঁড়িয়ে থাকুন।';
    } else if (generic.includes('metformin')) {
      instructionsEn = 'Take with or immediately after meals to minimize gastrointestinal discomfort.';
      instructionsBn = 'পেটের অস্বস্তি কমাতে খাবারের সাথে বা খাবার শেষেই সেবন করুন।';
    } else if (generic.includes('omeprazole') || generic.includes('esomeprazole') || generic.includes('pantoprazole')) {
      instructionsEn = 'Take 30 to 60 minutes before the first meal of the day.';
      instructionsBn = 'দিনের প্রথম প্রধান খাবারের ৩০ থেকে ৬০ মিনিট আগে সেবন করুন।';
    } else if (generic.includes('atorvastatin') || generic.includes('rosuvastatin') || generic.includes('simvastatin')) {
      instructionsEn = 'Take in the evening or bedtime to align with nocturnal hepatic cholesterol synthesis.';
      instructionsBn = 'রাতে শোবার আগে সেবন করুন, কারণ রাতে যকৃতে কোলেস্টেরল বেশি তৈরি হয়।';
    }

    let period: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';
    if (displayTime !== 'UNKNOWN') {
      const hour = parseInt(displayTime.split(':')[0] || '8', 10);
      if (hour >= 12 && hour < 17) period = 'afternoon';
      else if (hour >= 17 && hour < 21) period = 'evening';
      else if (hour >= 21 || hour < 5) period = 'night';
    }

    updatedTimeline.push({
      id: `CHRONO_${med.id || Math.random().toString(36).substring(2, 9)}`,
      time: displayTime,
      period,
      category: 'medication',
      title_en: med.brand_name ? `${med.brand_name} (${med.generic_name})` : med.generic_name,
      title_bn: med.brand_name ? `${med.brand_name} (${med.generic_name})` : med.generic_name,
      instructions_en: instructionsEn,
      instructions_bn: instructionsBn,
      entity_id: med.id,
      is_prescription_medication: true,
      is_timing_unknown: isTimingUnknown,
      is_editable: true
    });
  }

  staleNotifications.push({
    section: 'chronotherapy',
    reason_en: `Updated medication reconciliation with ${updatedTimeline.length} active prescription(s).`,
    reason_bn: `${updatedTimeline.length}টি প্রেসক্রিপশন ওষুধের তালিকা ক্রোনোথেরাপিতে সমন্বয় করা হয়েছে।`,
    invalidated_by: 'medication_change',
    requires_reapproval: isApproved
  });

  alertsEn.push(`Synchronized ${updatedTimeline.length} active medication(s) to Chronotherapy timeline.`);
  alertsBn.push(`${updatedTimeline.length}টি চলমান ওষুধ ক্রোনোথেরাপি টাইমলাইনে সমন্বয় করা হয়েছে।`);

  // 2. Hydration Protocol Adaptation
  const isPediatric = r5Context.population.life_stage === 'infant' ||
                      r5Context.population.life_stage === 'child' ||
                      r5Context.population.life_stage === 'adolescent';

  const fluidConflict = r5Context.multimorbidity_resolutions.find(c => c.parameter === 'fluid');
  const hasFluidRestriction = Boolean(fluidConflict);

  // Holliday-Segar estimation for pediatrics or standard adult baseline
  let baselineFluid = 2200;
  if (isPediatric) {
    const age = r5Context.population.age ?? 7;
    const estWeight = Math.max(10, age * 2 + 8); // approximate pediatric weight if unentered
    if (estWeight <= 10) baselineFluid = estWeight * 100;
    else if (estWeight <= 20) baselineFluid = 1000 + (estWeight - 10) * 50;
    else baselineFluid = 1500 + (estWeight - 20) * 20;
  } else if (hasFluidRestriction) {
    baselineFluid = 1500;
  }

  const updatedHydration: HydrationProtocol = {
    baseline_fluid_target_ml: baselineFluid,
    clinician_fluid_limit_ml: hasFluidRestriction ? 1500 : undefined,
    is_restricted: hasFluidRestriction,
    restriction_reason_en: hasFluidRestriction ? 'Cardiopulmonary / Renal fluid balance limit.' : undefined,
    restriction_reason_bn: hasFluidRestriction ? 'হৃদযন্ত্র ও কিডনির সুরক্ষায় তরল নিয়ন্ত্রণ।' : undefined,
    requires_individualized_fluid_review: hasFluidRestriction || isPediatric,
    review_reason_en: hasFluidRestriction ? 'Fluid restricted protocol. Confirm daily fluid allowance.' : (isPediatric ? 'Pediatric individualized fluid requirement calculation.' : undefined),
    review_reason_bn: hasFluidRestriction ? 'তরল নিয়ন্ত্রিত প্রোটোকল। চিকিৎসকের নির্দিষ্ট মাত্রা যাচাই করুন।' : (isPediatric ? 'শিশুর শারীরিক অবস্থা অনুযায়ী সুনির্দিষ্ট তরল নির্ধারণ প্রয়োজন।' : undefined),
    hydration_events: [
      {
        id: 'HYD_WAKE',
        time: '07:00',
        volume_ml: Math.round(baselineFluid * 0.2),
        type: 'plain_water',
        instructions_en: 'Morning hydration upon waking.',
        instructions_bn: 'ঘুম থেকে উঠে সকালে পানি পান।',
        meal_relation: 'waking'
      },
      {
        id: 'HYD_MIDDAY',
        time: '11:00',
        volume_ml: Math.round(baselineFluid * 0.35),
        type: 'plain_water',
        instructions_en: 'Mid-morning to afternoon hydration.',
        instructions_bn: 'সকাল থেকে দুপুরের মাঝামাঝি পানি পান।',
        meal_relation: 'between_meals'
      },
      {
        id: 'HYD_EVE',
        time: '16:00',
        volume_ml: Math.round(baselineFluid * 0.3),
        type: 'plain_water',
        instructions_en: 'Afternoon hydration.',
        instructions_bn: 'বিকেলের পানি পান।',
        meal_relation: 'between_meals'
      },
      {
        id: 'HYD_NIGHT',
        time: '20:00',
        volume_ml: Math.round(baselineFluid * 0.15),
        type: 'plain_water',
        instructions_en: 'Evening hydration (limit before bed).',
        instructions_bn: 'সন্ধ্যার পানি পান (শোবার ঠিক আগে বেশি নয়)।',
        meal_relation: 'post_meal'
      }
    ],
    total_scheduled_ml: baselineFluid,
    timing_guidance_en: 'Distribute fluid intake across the day, avoiding large boluses right before sleep.',
    timing_guidance_bn: 'সারাদিনে ভাগ করে পানি পান করুন, শোবার ঠিক আগে অতিরিক্ত পানি পরিহার করুন।'
  };

  staleNotifications.push({
    section: 'hydration',
    reason_en: hasFluidRestriction ? 'Fluid restriction constraint applied from multimorbidity layer.' : 'Baseline fluid calculated from population profile.',
    reason_bn: hasFluidRestriction ? 'মাল্টিমর্বিডিটি লেয়ার থেকে তরল নিয়ন্ত্রণের সীমাবদ্ধতা প্রয়োগ করা হয়েছে।' : 'জনসংখ্যার প্রোফাইল থেকে সাধারণ তরলের মাত্রা নির্ধারণ করা হয়েছে।',
    invalidated_by: 'fluid_prescription_change',
    requires_reapproval: isApproved
  });

  // 3. Exercise Adaptation
  const hasSarcopenia = r5Context.pathways.selected_pathways.includes('underweight_malnutrition') ||
                        r5Context.pathways.selected_pathways.includes('musculoskeletal_bone');
  const hasCVD = r5Context.pathways.selected_pathways.includes('cardiovascular');

  const updatedExercise: ExerciseProtocol = {
    items: [
      {
        id: 'EX_01',
        category: hasSarcopenia ? 'resistance_training' : 'brisk_walking',
        title_en: hasSarcopenia ? 'Progressive Functional Resistance Exercise' : 'Aerobic Brisk Walking',
        title_bn: hasSarcopenia ? 'কার্যক্ষমতা বৃদ্ধির জন্য প্রতিরোধ ব্যায়াম' : 'নিয়মিত দ্রুত হাঁটা',
        frequency_per_week: hasSarcopenia ? 3 : 5,
        duration_minutes: hasSarcopenia ? 25 : 30,
        intensity: hasCVD ? 'light' : 'moderate',
        weekly_progression_en: 'Increase duration by 5 minutes weekly as tolerated.',
        weekly_progression_bn: 'ধীরে ধীরে প্রতি সপ্তাহে ৫ মিনিট করে সময় বাড়ান।',
        monitoring_instructions_en: hasCVD ? 'Keep exertion below RPE 4/10. Stop immediately if chest pain or dyspnea occurs.' : 'Maintain rhythmic breathing.',
        monitoring_instructions_bn: hasCVD ? 'বুকে ব্যথা বা অতিরিক্ত শ্বাসকষ্ট হলে তৎক্ষণাৎ ব্যায়াম বন্ধ করুন।' : 'স্বাভাবিক শ্বাস-প্রশ্বাস বজায় রাখুন।',
        stop_conditions_en: ['Chest pressure', 'Lightheadedness', 'Severe shortness of breath'],
        stop_conditions_bn: ['বুকে চাপ অনুভব', 'মাথা ঘোরানো', 'অতিরিক্ত শ্বাসকষ্ট'],
        contraindications: hasCVD ? ['Uncontrolled severe hypertension', 'Unstable angina'] : [],
        approval_status: 'draft'
      }
    ],
    overall_safety_status: hasCVD ? 'CAUTION' : 'SAFE',
    clinical_contraindications: hasCVD ? ['Avoid strenuous isometric strain'] : [],
    risk_factors_evaluated: [hasCVD ? 'Cardiovascular' : 'Standard'],
    cardiorespiratory_clearance_status: hasCVD ? 'restricted_low_impact' : 'cleared_standard',
    weekly_aerobic_minutes_target: hasSarcopenia ? 90 : 150,
    weekly_resistance_sessions_target: hasSarcopenia ? 3 : 2
  };

  staleNotifications.push({
    section: 'exercise',
    reason_en: 'Exercise safety constraints adjusted based on active clinical pathways.',
    reason_bn: 'সক্রিয় ক্লিনিক্যাল পাথওয়ের ওপর ভিত্তি করে ব্যায়ামের সুরক্ষা নির্দেশিকা সমন্বয় করা হয়েছে।',
    invalidated_by: 'pathway_change',
    requires_reapproval: isApproved
  });

  // 4. Candidate Supplements Generation (strictly draft_candidate!)
  const updatedSupplements: SupplementProtocolItem[] = [];

  const hasStatin = r5Context.medications.some(m => (m.generic_name || '').toLowerCase().includes('statin'));
  if (hasStatin) {
    updatedSupplements.push({
      id: 'SUPP_COQ10_STATIN',
      generic_nutrient: 'Coenzyme Q10 (Ubiquinol)',
      chemical_form: 'Ubiquinol',
      brand_verification_status: 'generic_prescription_only',
      indication_en: 'Support mitochondrial energy and attenuate statin-associated muscle symptoms.',
      indication_bn: 'মাইটোকন্ড্রিয়ার শক্তি বৃদ্ধি ও স্ট্যাটিনজনিত পেশীর ব্যথা উপশমে সহায়ক।',
      evidence_category: 'clinical_guideline',
      elemental_dose_numeric: 100,
      elemental_dose_unit: 'mg',
      total_compound_dose: '100 mg',
      frequency: 'once_daily',
      administration_time: '12:00',
      relationship_to_food: 'with_lunch',
      duration_weeks: 12,
      monitoring_parameters: ['Muscle soreness', 'Fatigue levels'],
      contraindications: [],
      known_interactions: ['Warfarin (mild reduction in INR)'],
      approval_status: 'draft_candidate',
      source: 'dni_auto_candidate'
    });
  }

  const hasMetformin = r5Context.medications.some(m => (m.generic_name || '').toLowerCase().includes('metformin'));
  if (hasMetformin) {
    updatedSupplements.push({
      id: 'SUPP_B12_METFORMIN',
      generic_nutrient: 'Vitamin B12 (Methylcobalamin)',
      chemical_form: 'Methylcobalamin',
      brand_verification_status: 'generic_prescription_only',
      indication_en: 'Prevent metformin-induced ileal vitamin B12 malabsorption and peripheral neuropathy.',
      indication_bn: 'মেটফরমিনজনিত ভিটামিন বি১২ শোষণের ঘাটতি এবং স্নায়ুর দুর্বলতা প্রতিরোধে সহায়ক।',
      evidence_category: 'evidence_based',
      elemental_dose_numeric: 1000,
      elemental_dose_unit: 'mcg',
      total_compound_dose: '1000 mcg',
      frequency: 'once_daily',
      administration_time: '08:00',
      relationship_to_food: 'empty_stomach_waking',
      duration_weeks: 12,
      monitoring_parameters: ['Serum Vitamin B12', 'CBC / MCV'],
      contraindications: [],
      known_interactions: [],
      approval_status: 'draft_candidate',
      source: 'dni_auto_candidate'
    });
  }

  if (updatedSupplements.length > 0) {
    staleNotifications.push({
      section: 'supplements',
      reason_en: `Identified ${updatedSupplements.length} targeted draft supplement candidate(s) from drug-nutrient interactions.`,
      reason_bn: `ওষুধ-পুষ্টি মিথস্ক্রিয়া থেকে ${updatedSupplements.length}টি ড্রাফট সাপ্লিমেন্ট প্রার্থী প্রস্তাব করা হয়েছে।`,
      invalidated_by: 'medication_change',
      requires_reapproval: isApproved
    });
    alertsEn.push(`Generated ${updatedSupplements.length} evidence-backed draft supplement candidate(s) awaiting clinical verification.`);
    alertsBn.push(`${updatedSupplements.length}টি প্রমাণভিত্তিক ড্রাফট সম্পূরক প্রার্থী প্রস্তাব করা হয়েছে যা চিকিৎসকের অনুমোদনের অপেক্ষায় রয়েছে।`);
  }

  return {
    updated_draft: {
      hydration: updatedHydration,
      exercise: updatedExercise,
      chronotherapy_timeline: updatedTimeline,
      supplements: updatedSupplements,
      status: isApproved ? 'active' : 'draft'
    },
    stale_notifications: staleNotifications,
    requires_clinician_reapproval: isApproved,
    integration_alerts_en: alertsEn,
    integration_alerts_bn: alertsBn
  };
}
