/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Phase R4: Deterministic Advanced Lifestyle Engine
 * 
 * Generates evidence-based, personalized lifestyle protocols covering:
 * - Circadian daily routines & meal timing context
 * - Morning daylight exposure & pineal synchronization
 * - Sedentary behavior interruption & postural ergonomics
 * - Vagal parasympathetic stress management & breathing
 * - Work-rest balance & screen-time sleep hygiene
 * - Shift-worker chronobiological adaptation
 */

import { PatientProfile } from '@/types';
import { 
  LifestyleProtocol, 
  LifestyleRecommendation, 
  LifestyleCategory 
} from '@/types/r4Protocol';

export function generateLifestyleProtocol(patient: PatientProfile): LifestyleProtocol {
  const recommendations: LifestyleRecommendation[] = [];

  const isShiftWorker = Boolean(patient.shift_worker);
  const sleepHours = patient.sleep_hours || 7;
  const conditions = patient.selected_conditions || [];
  const activeMeds = (patient.active_medications || []).map(m => (m || '').toLowerCase());
  const activityLevel = patient.activity_level || 'sedentary';
  const gutProfile = patient.gut_profile || {};

  // 1. Circadian Light Exposure Recommendation
  if (isShiftWorker) {
    recommendations.push({
      id: 'rec_light_shift_worker',
      category: 'shift_work',
      action_en: 'Targeted Shift Light Protocol & Morning Sunglasses on Commute',
      action_bn: 'নাইট শিফটে জোরালো আলো এবং সকালে বাড়ি ফেরার পথে ডার্ক সানগ্লাস ব্যবহার',
      suggested_frequency: 'Daily during night-shift cycles',
      suggested_time: 'Start of shift + commute home',
      expected_purpose_en: 'Prevent circadian misalignment and facilitate daytime restorative sleep',
      expected_purpose_bn: 'দিবা-রাত্রির ছন্দের ভারসাম্য বজায় রাখা এবং দিনের বেলায় গভীর ঘুম নিশ্চিত করা',
      clinical_rationale_en: 'Bright light exposure (>1000 lux) during the first half of a night shift promotes alertness and neurocognitive performance, while wearing blue-blocking sunglasses during the morning commute prevents photic suppression of daytime melatonin onset.',
      clinical_rationale_bn: 'শিফটের শুরুতে উজ্জ্বল আলো সতর্কতা বজায় রাখে এবং সকালের যাত্রাপথে সানগ্লাস চোখ দিয়ে মস্তিষ্কে আলো পৌঁছানো আটকে মেলাটোনিন নিঃসরিত হতে সাহায্য করে।',
      safety_classification: 'SAFE',
      evidence_status: 'evidence_based',
      is_active: true
    });
  } else {
    recommendations.push({
      id: 'rec_morning_daylight',
      category: 'light_exposure',
      action_en: 'Direct Morning Sunlight Exposure (15-20 Minutes)',
      action_bn: 'সকালের প্রাকৃতিক রোদে ১৫-২০ মিনিট খোলা বাতাসে থাকা',
      suggested_frequency: 'Daily upon waking',
      suggested_time: '06:30 AM - 08:30 AM',
      expected_purpose_en: 'Circadian entrainment, cortisol awakening response synchronization, and melatonin suppression',
      expected_purpose_bn: 'শরীরের অভ্যন্তরীণ জৈবিক ঘড়ি ঠিক রাখা এবং সকালের সতেজতা বৃদ্ধি করা',
      clinical_rationale_en: 'Morning ocular exposure to outdoor natural light (>10,000 lux) stimulates intrinsically photosensitive retinal ganglion cells (ipRGCs) to synchronize the master suprachiasmatic nucleus (SCN), optimizing daytime energy and setting the nocturnal melatonin timer.',
      clinical_rationale_bn: 'সকালের সূর্যালোক চোখের মাধ্যমে মস্তিষ্কের এসসিএন (SCN) কেন্দ্রকে সক্রিয় করে কর্টিসল হরমোনের স্বাভাবিক প্রবাহ নিশ্চিত করে এবং রাতে ভালো ঘুমের প্রস্তুতি তৈরি করে।',
      safety_classification: 'SAFE',
      evidence_status: 'evidence_based',
      is_active: true
    });
  }

  // 2. Sedentary Interruption & Postural Ergonomics
  if (activityLevel === 'sedentary' || activityLevel === 'lightly_active') {
    recommendations.push({
      id: 'rec_sedentary_breaks',
      category: 'sedentary_reduction',
      action_en: 'Active Sedentary Interruption (2-3 Minute Posture/Walking Break Every 45 Minutes)',
      action_bn: 'প্রতি ৪৫ মিনিট বসে কাজের পর ২-৩ মিনিট দাঁড়িয়ে হাঁটা বা অঙ্গ সঞ্চালন',
      suggested_frequency: 'Throughout working hours (every 45-60 mins)',
      suggested_time: 'Working hours',
      expected_purpose_en: 'Mitigate endothelial stiffness, improve basal insulin sensitivity, and prevent venous stasis',
      expected_purpose_bn: 'রক্তনালীর সংকোচন দূর করা এবং রক্তে গ্লুকোজ ও ইনসুলিনের কার্যকারিতা বৃদ্ধি করা',
      clinical_rationale_en: 'Prolonged uninterrupted sitting induces skeletal muscle lipoprotein lipase suppression and local microvascular dysfunction. Frequent short movement breaks restore shear stress-mediated nitric oxide production and glucose uptake independent of total exercise volume.',
      clinical_rationale_bn: 'টানা বসে থাকলে পেশির মেটাবলিজম ও রক্ত সঞ্চালন ধীর হয়ে যায়। স্বল্প বিরতিতে দাঁড়ালে ইনসুলিন কার্যক্ষমতা বৃদ্ধি পায় এবং ক্লান্তি কমে।',
      safety_classification: 'SAFE',
      evidence_status: 'evidence_based',
      is_active: true
    });
  }

  // 3. Postprandial Glycemic Walking
  if (conditions.includes('t2d_ir') || conditions.includes('pcos') || conditions.includes('metabolic_syndrome') || conditions.includes('fatty_liver')) {
    recommendations.push({
      id: 'rec_postprandial_walking',
      category: 'daily_routine',
      action_en: 'Gentle 10-15 Minute Post-Meal Ambulation (Shatapadi)',
      action_bn: 'ভারী আহারের ১৫-২০ মিনিট পর মৃদু গতিতে ১০-১৫ মিনিট হাঁটা (শতপদী)',
      suggested_frequency: 'Twice daily after main meals (Lunch and Dinner)',
      suggested_time: '15-20 minutes post-meal',
      expected_purpose_en: 'Blunt postprandial glucose excursions via non-insulin mediated GLUT4 muscle translocation',
      expected_purpose_bn: 'খাবারের পর রক্তের সুগার আকস্মিক বৃদ্ধি নিয়ন্ত্রণ এবং ইনসুলিন ছাড়া পেশিতে গ্লুকোজ শোষণ',
      clinical_rationale_en: 'Postprandial low-intensity ambulation contracts skeletal muscles, translocating GLUT4 transporters to the sarcolemma independently of insulin, reducing postprandial glycemic peaks by 15-25% without causing sympathetic adrenergic stress or digestive compromise.',
      clinical_rationale_bn: 'খাবারের পরপরই বসে না থেকে ধীরলয়ে কিছুক্ষণ হাঁটলে পেশি রক্ত থেকে সরাসরি সুগার গ্রহণ করে, ফলে রক্তে অতিরিক্ত সুগার জমতে পারে না।',
      safety_classification: 'SAFE',
      evidence_status: 'evidence_based',
      is_active: true
    });
  }

  // 4. Meal Timing & Gastrointestinal Sleep Buffer
  const hasGerd = conditions.includes('gerd_reflux_esophagitis') || Boolean(gutProfile.acid_reflux_hypoacidity);
  recommendations.push({
    id: 'rec_meal_sleep_spacing',
    category: 'daily_routine',
    action_en: hasGerd 
      ? 'Strict 3-Hour Fasting Window Prior to Bedtime & Left Lateral Recumbent Sleep Position'
      : 'Minimum 2.5-Hour Buffer Between Dinner and Sleep',
    action_bn: hasGerd
      ? 'ঘুমানোর অন্তত ৩ ঘণ্টা পূর্বে রাতের খাবার সম্পন্ন করা এবং বাম কাত হয়ে শোয়া'
      : 'ঘুমানোর অন্তত আড়াই ঘণ্টা পূর্বে রাতের খাবার শেষ করা',
    suggested_frequency: 'Daily evening',
    suggested_time: '07:30 PM - 08:30 PM',
    expected_purpose_en: 'Facilitate gastric emptying, prevent nocturnal acid reflux, and preserve slow-wave deep sleep',
    expected_purpose_bn: 'খাদ্য হজম সহজ করা, রাতের বেলা বুক জ্বালাপোড়া রোধ এবং গভীর ঘুম নিশ্চিত করা',
    clinical_rationale_en: 'Gastric acid clearance and lower esophageal sphincter competency decrease significantly during recumbency. Maintaining a 3-hour post-ingestion buffer allows complete gastric clearance, preventing nocturnal micro-aspiration and esophageal inflammation.',
    clinical_rationale_bn: 'খাওয়ার সাথে সাথেই শুয়ে পড়লে পাকস্থলীর এসিড খাদ্যনালীতে উঠে আসে এবং ঘুমের ব্যাঘাত ঘটে। পর্যাপ্ত ব্যবধান রাখলে হজম সুষ্ঠু হয়।',
    safety_classification: 'SAFE',
    evidence_status: 'clinical_guideline',
    is_active: true
  });

  // 5. Stress Management & Parasympathetic Vagal Activation
  const hasAnxietyOrBurnout = conditions.includes('hpa_axis_burnout') || conditions.includes('hypertension_ckd') || conditions.includes('insomnia_circadian_disruption');
  recommendations.push({
    id: 'rec_stress_vagal_breathing',
    category: 'stress_management',
    action_en: 'Diaphragmatic Resonant Breathing (4-7-8 or 5-Count Coherence Breathing, 5-10 Mins)',
    action_bn: 'পেটের সাহায্যে বুক ভরে গভীর শ্বাস-প্রশ্বাসের ব্যায়াম (৪-৭-৮ বা গভীর নিঃশ্বাস ৫-১০ মিনিট)',
    suggested_frequency: 'Daily (Mid-afternoon and/or 30 mins before bed)',
    suggested_time: '04:30 PM / 09:30 PM',
    expected_purpose_en: 'Enhance vagal tone, lower resting sympathetic tone, and decrease nocturnal cortisol surges',
    expected_purpose_bn: 'স্নায়ু শান্ত করা, কর্টিসল হরমোন কমানো এবং মানসিক চাপ হ্রাস করে রক্তচাপ নিয়ন্ত্রণে সহায়তা',
    clinical_rationale_en: 'Slow diaphragmatic breathing with prolonged exhalation activates pulmonary mechanoreceptors, engaging the vagus nerve to elevate heart rate variability (HRV), decrease systemic vascular resistance, and suppress hypothalamic-pituitary-adrenal (HPA) axis overdrive.',
    clinical_rationale_bn: 'ধীরগতির গভীর নিঃশ্বাস ত্যাগ ভ্যাগাস স্নায়ুকে উদ্দীপিত করে হৃদস্পন্দন ও রক্তচাপ স্বাভাবিক করতে কার্যকর ভূমিকা পালন করে।',
    safety_classification: 'SAFE',
    evidence_status: 'evidence_based',
    is_active: true
  });

  // 6. Evening Blue-Light Curfew & Sleep Hygiene
  recommendations.push({
    id: 'rec_screen_curfew',
    category: 'sleep_hygiene',
    action_en: 'Screen Curfew (Dim or Discontinue Phones/Tablets/Laptops 60-90 Mins Prior to Bed)',
    action_bn: 'ঘুমানোর ১-১.৫ ঘণ্টা পূর্বে মোবাইল, ল্যাপটপ বা উজ্জ্বল স্ক্রিন ব্যবহার বন্ধ বা সীমিত রাখা',
    suggested_frequency: 'Daily',
    suggested_time: '09:00 PM onwards',
    expected_purpose_en: 'Protect endogenous melatonin onset from 460-480nm wavelength light suppression',
    expected_purpose_bn: 'চোখে নীল আলোর প্রভাব কমিয়ে প্রাকৃতিক মেলাটোনিন হরমোনের স্বাভাবিক নিঃসরণ নিশ্চিত করা',
    clinical_rationale_en: 'Short-wavelength blue spectrum light emitted by electronic devices suppresses nocturnal pineal melatonin secretion by up to 50% and shifts circadian rhythm by 1.5 hours, delaying sleep latency and impairing REM/NREM sleep architecture.',
    clinical_rationale_bn: 'মোবাইল ও টিভির নীল আলো মস্তিষ্কে সংকেত পাঠায় যে এখনও দিন রয়েছে, যার ফলে ঘুমের হরমোন মেলাটোনিন নিঃসরণ বন্ধ থাকে এবং ঘুম আসতে দেরি হয়।',
    safety_classification: 'SAFE',
    evidence_status: 'evidence_based',
    is_active: true
  });

  // 7. Behavioral Adherence Guidance
  recommendations.push({
    id: 'rec_behavioral_habit_stacking',
    category: 'behavioral_adherence',
    action_en: 'Behavioral Habit Stacking & Micro-Goal Progression',
    action_bn: 'অভ্যাস গঠন: একটি প্রতিষ্ঠিত অভ্যাসের সাথে নতুন স্বাস্থ্যকর নিয়ম যুক্ত করা (হ্যাবিট স্ট্যাকিং)',
    suggested_frequency: 'Ongoing weekly practice',
    suggested_time: 'Daily reflection',
    expected_purpose_en: 'Sustain lifestyle adherence by anchoring health behaviors to established daily cues',
    expected_purpose_bn: 'দৈনন্দিন কাজের সাথে নতুন নিয়ম সমন্বয় করে স্থায়ী স্বাস্থ্যকর অভ্যাস গড়ে তোলা',
    clinical_rationale_en: 'Habit stacking utilizes pre-existing neural pathways by pairing an established routine (e.g. morning water) with a newly prescribed action (e.g. light exposure or breathing), dramatically improving long-term clinical protocol adherence.',
    clinical_rationale_bn: 'পুরোনো পরিচিত অভ্যাসের সাথে নতুন নিয়ম যুক্ত করলে ভুল হওয়ার সম্ভাবনা কমে এবং দীর্ঘমেয়াদে নিয়ম মেনে চলা সহজ হয়।',
    safety_classification: 'SAFE',
    evidence_status: 'expert_consensus',
    is_active: true
  });

  return {
    recommendations,
    overall_focus_en: isShiftWorker 
      ? 'Shift-work chronobiological resilience, light modulation, and metabolic synchronization.'
      : 'Circadian entrainment, postprandial glucose regulation, autonomic balance, and restorative sleep.',
    overall_focus_bn: isShiftWorker
      ? 'শিফট ওয়ার্কারদের জৈবিক ঘড়ির ভারসাম্য, আলোর সঠিক ব্যবহার এবং মেটাবলিক সুরক্ষা।'
      : 'দৈনিক জৈবিক ছন্দ রক্ষা, খাবারের পর গ্লুকোজ নিয়ন্ত্রণ, স্নায়ুর প্রশান্তি এবং গভীর ঘুম।',
    adherence_support_notes: 'Focus on 1-2 habit changes per week rather than attempting immediate universal compliance.',
    shift_work_adaptation_notes: isShiftWorker 
      ? 'Critical: Ensure dark, quiet bedroom environment (<20°C, blackout shades, earplugs) for daytime sleep cycles.'
      : undefined
  };
}

export const generateLifestyleRecommendations = generateLifestyleProtocol;
