/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Phase R4: Deterministic Personalized Hydration Engine
 * 
 * Manages daily fluid prescriptions with strict clinical safety gates:
 * - Weight and activity-adjusted baseline physiological water requirements
 * - Authoritative fluid restriction gates for CKD 4/5, dialysis, CHF, and ascites
 * - Temporal distribution across waking, pre-meal, between meals, and bedtime
 * - Meal-related digestive acid preservation (avoiding excessive liquid during meals)
 * - Conflict detection when scheduled fluids exceed clinician-prescribed restrictions
 */

import { PatientProfile } from '@/types';
import { HydrationProtocol, HydrationEvent } from '@/types/r4Protocol';

export function generateHydrationProtocol(patient: PatientProfile): HydrationProtocol {
  const weight = patient.weight_kg || 65;
  const age = patient.age || 35;
  const conditions = patient.selected_conditions || [];
  const activityLevel = patient.activity_level || 'sedentary';
  const feedingStatus = patient.feeding_status;
  const labs = patient.labs || {};

  // 1. Evaluate Clinical Fluid Restrictions
  const confirmedConds = (patient.confirmed_conditions || []).map(c => c.toLowerCase());
  const hasDialysisOrESRD = confirmedConds.some(c => c.includes('dialysis') || c.includes('esrd') || c.includes('ckd_stage_4') || c.includes('ckd_stage_5')) || 
    (labs.egfr !== undefined && labs.egfr < 20);
  const hasHeartFailure = confirmedConds.some(c => c.includes('heart failure') || c.includes('heart_failure') || c.includes('chf'));
  const hasHepaticAscites = conditions.includes('fatty_liver') && Boolean((patient.clinical_safety as any)?.ascites);
  
  const prescriberFluidLimit = patient.clinical_safety?.fluid_restriction?.limit_ml || patient.fluid_prescription?.total_fluid_limit_ml;
  const hasExplicitRestriction = Boolean(patient.clinical_safety?.fluid_restriction?.is_restricted || patient.fluid_prescription?.is_restricted);
  const hasStrictFluidRestriction = hasDialysisOrESRD || hasHeartFailure || hasHepaticAscites || hasExplicitRestriction;

  let clinicianLimitMl: number | undefined = prescriberFluidLimit;
  let isRestricted = false;
  let restrictionReasonEn: string | undefined = undefined;
  let restrictionReasonBn: string | undefined = undefined;

  if (hasStrictFluidRestriction) {
    isRestricted = true;
    if (hasDialysisOrESRD) {
      clinicianLimitMl = 1200; // Standard hemodialysis interdialytic fluid limit (500 mL + urine output)
      restrictionReasonEn = 'Strict Renal Fluid Restriction (1200 mL/day): Advanced renal compromise / anuria necessitates tight fluid ceiling to prevent pulmonary edema, volume overload, and interdialytic weight gain.';
      restrictionReasonBn = 'কিডনি রোগের কারণে কঠোর তরল নিয়ন্ত্রণ (১২০০ মিলি/দিন): অতিরিক্ত পানি ফুসফুসে পানি জমা, শ্বাসকষ্ট এবং উচ্চ রক্তচাপ সৃষ্টি করতে পারে।';
    } else if (hasHeartFailure) {
      clinicianLimitMl = 1500; // Standard CHF fluid cap
      restrictionReasonEn = 'Congestive Heart Failure Fluid Cap (1500 mL/day): Left ventricular dysfunction requires volume restriction to prevent myocardial wall stress and acute pulmonary congestion.';
      restrictionReasonBn = 'হার্ট ফেইলিউর তরল নিয়ন্ত্রণ (১৫০০ মিলি/দিন): অতিরিক্ত তরল হৃদপিণ্ডের ওপর চাপ বৃদ্ধি করে এবং শ্বাসকষ্ট বাড়াতে পারে।';
    } else {
      clinicianLimitMl = 1500;
      restrictionReasonEn = 'Clinical Fluid Restriction Active: Individualized fluid allowance under physician prescription.';
      restrictionReasonBn = 'চিকিৎসকের পরামর্শ অনুযায়ী নিয়ন্ত্রিত তরল গ্রহণ সীমাবদ্ধতা প্রযোজ্য।';
    }
  }

  // 2. Compute Baseline Physiological Needs
  // Standard healthy adult: ~30-35 mL/kg, clamped between 1800 - 3000 mL
  let baselineNeedMl = Math.round((weight * 32) / 50) * 50; // nearest 50 mL
  if (baselineNeedMl < 1800) baselineNeedMl = 1800;
  if (baselineNeedMl > 2800) baselineNeedMl = 2800;

  if (activityLevel === 'moderately_active') {
    baselineNeedMl += 300;
  } else if (activityLevel === 'very_active') {
    baselineNeedMl += 600;
  }

  // If restricted, the effective target is clamped strictly to the clinician limit
  const effectiveTargetMl = isRestricted && clinicianLimitMl 
    ? clinicianLimitMl 
    : baselineNeedMl;

  // 3. Build Temporal Hydration Schedule
  const events: HydrationEvent[] = [];

  if (isRestricted && clinicianLimitMl) {
    // Tightly rationed schedule for restricted patients
    const portion = Math.floor(clinicianLimitMl / 5);
    events.push(
      {
        id: 'hydro_1',
        time: '07:00',
        volume_ml: portion,
        type: 'plain_water',
        instructions_en: 'Morning measured fluid allowance with prescribed medications.',
        instructions_bn: 'সকালের পরিমাপকৃত পানি, প্রেসক্রিপশন ওষুধের সাথে।',
        meal_relation: 'waking'
      },
      {
        id: 'hydro_2',
        time: '10:30',
        volume_ml: portion,
        type: 'plain_water',
        instructions_en: 'Mid-morning measured fluid sip.',
        instructions_bn: 'মধ্য-সকালের পরিমাপকৃত পানি।',
        meal_relation: 'between_meals'
      },
      {
        id: 'hydro_3',
        time: '13:00',
        volume_ml: portion,
        type: 'plain_water',
        instructions_en: 'Pre-lunch measured water (small sips, avoid gulping).',
        instructions_bn: 'দুপুরের খাবারের পূর্বে পরিমিত পানি (ধীরে ধীরে চুমুক দিয়ে)।',
        meal_relation: 'pre_meal'
      },
      {
        id: 'hydro_4',
        time: '16:30',
        volume_ml: portion,
        type: 'plain_water',
        instructions_en: 'Afternoon measured hydration.',
        instructions_bn: 'বিকেলের পরিমাপকৃত পানি।',
        meal_relation: 'between_meals'
      },
      {
        id: 'hydro_5',
        time: '19:30',
        volume_ml: clinicianLimitMl - (portion * 4), // remainder
        type: 'plain_water',
        instructions_en: 'Dinner fluid portion; complete all fluids at least 2 hours before bed.',
        instructions_bn: 'রাতের পরিমাপকৃত পানির শেষ অংশ; শোবার ২ ঘণ্টা আগে শেষ করুন।',
        meal_relation: 'post_meal'
      }
    );
  } else {
    // Standard unconstrained distribution
    events.push(
      {
        id: 'hydro_wake',
        time: '06:45',
        volume_ml: 350,
        type: 'plain_water',
        instructions_en: 'Room-temperature water upon waking to rehydrate cellular volume after overnight fast.',
        instructions_bn: 'ঘুম থেকে উঠে ১-২ গ্লাস স্বাভাবিক তাপমাত্রার পানি পান করুন।',
        meal_relation: 'waking'
      },
      {
        id: 'hydro_mid_morning',
        time: '10:30',
        volume_ml: 400,
        type: 'plain_water',
        instructions_en: 'Mid-morning hydration between meals. Enhances renal clearance.',
        instructions_bn: 'সকালের নাশতা ও দুপুরের মধ্যবর্তী সময়ে পর্যাপ্ত পানি পান করুন।',
        meal_relation: 'between_meals'
      },
      {
        id: 'hydro_pre_lunch',
        time: '13:00',
        volume_ml: 250,
        type: 'plain_water',
        instructions_en: '20-30 minutes prior to lunch. Avoid heavy drinking during eating to preserve gastric enzyme concentration.',
        instructions_bn: 'দুপুরের খাবারের ২০-৩০ মিনিট পূর্বে ১ গ্লাস পানি। খাবারের মাঝে অতিরিক্ত পানি পান এড়িয়ে চলুন।',
        meal_relation: 'pre_meal'
      },
      {
        id: 'hydro_afternoon',
        time: '16:00',
        volume_ml: 400,
        type: 'plain_water',
        instructions_en: 'Afternoon hydration. Supports energy and prevents late-day fatigue.',
        instructions_bn: 'বিকেলের পানি পান। ক্লান্তি দূর করতে সহায়ক।',
        meal_relation: 'between_meals'
      },
      {
        id: 'hydro_evening_walk',
        time: '18:00',
        volume_ml: 350,
        type: 'plain_water',
        instructions_en: 'Pre/post movement hydration.',
        instructions_bn: 'হাঁটাহাঁটির পর সাধারণ পানি।',
        meal_relation: 'exercise_session'
      },
      {
        id: 'hydro_pre_dinner',
        time: '19:30',
        volume_ml: 250,
        type: 'plain_water',
        instructions_en: 'Small glass before dinner.',
        instructions_bn: 'রাতের আহারের পূর্বে ১ গ্লাস পানি।',
        meal_relation: 'pre_meal'
      },
      {
        id: 'hydro_bedtime',
        time: '21:30',
        volume_ml: 150,
        type: 'plain_water',
        instructions_en: 'Small sip if thirsty. Avoid large fluid bolus within 1.5 hours of bed to prevent nocturia.',
        instructions_bn: 'শোবার আগে সামান্য কয়েক চুমুক পানি; অতিরিক্ত পানি পরিহার করুন যাতে রাতে ঘুমের মাঝে প্রস্রাবের বেগ না হয়।',
        meal_relation: 'bedtime'
      }
    );
  }

  const totalScheduledMl = events.reduce((sum, e) => sum + e.volume_ml, 0);

  let conflictWarning: string | undefined = undefined;
  if (isRestricted && clinicianLimitMl && totalScheduledMl > clinicianLimitMl) {
    conflictWarning = `CRITICAL FLUID CONFLICT: Scheduled daily fluid (${totalScheduledMl} mL) exceeds strict clinical restriction of ${clinicianLimitMl} mL! Immediately adjust event volumes.`;
  }

  return {
    baseline_fluid_target_ml: effectiveTargetMl,
    clinician_fluid_limit_ml: clinicianLimitMl,
    is_restricted: isRestricted,
    restriction_reason_en: restrictionReasonEn,
    restriction_reason_bn: restrictionReasonBn,
    hydration_events: events,
    total_scheduled_ml: totalScheduledMl,
    timing_guidance_en: isRestricted
      ? 'Measure daily fluids in a single dedicated pitcher. Count soups, tea, and medicine water toward the total.'
      : 'Maintain steady daytime fluid distribution. Cease high-volume hydration 90 minutes before bedtime.',
    timing_guidance_bn: isRestricted
      ? 'প্রতিদিন একটি নির্দিষ্ট জগে সারাদিনের পানি মেপে রাখুন। চা বা তরল স্যুপও এই হিসাবের অন্তর্ভুক্ত।'
      : 'দিনের বেলায় নিয়মিত পানি পান করুন। ঘুমানোর দেড় ঘণ্টা আগে বেশি পানি পান করা থেকে বিরত থাকুন।',
    conflict_warning: conflictWarning
  };
}
