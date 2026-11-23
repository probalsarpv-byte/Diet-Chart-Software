/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Phase R4: Deterministic Personalized Exercise Protocol Engine
 * 
 * Provides evidence-based exercise prescription with strict multi-axis clinical screening:
 * - Cardiovascular & severe hypertension safety gating
 * - Hypoglycemia risk with glycemic medications (insulin, secretagogues)
 * - Frailty, fall-risk & elderly balance prioritization
 * - Pregnancy & postpartum biomechanical adaptations
 * - Musculoskeletal & renal impairment intensity modulation
 * - Borg CR-10 RPE targets, progressive overload, and explicit stop conditions
 */

import { PatientProfile } from '@/types';
import { 
  ExerciseProtocol, 
  ExerciseItem, 
  ExerciseCategory, 
  ExerciseIntensity 
} from '@/types/r4Protocol';

export function generateExerciseProtocol(patient: PatientProfile): ExerciseProtocol {
  const items: ExerciseItem[] = [];
  const contraindications: string[] = [];
  const riskFactors: string[] = [];

  const age = patient.age || 35;
  const isElderly = age >= 65;
  const isPediatric = age < 18;
  const conditions = patient.selected_conditions || [];
  const activeMeds = (patient.active_medications || []).map(m => (m || '').toLowerCase());
  const populationGroup = patient.population_group || 'adult_standard';
  const labs = patient.labs || {};

  // Check critical clinical flags
  const sysBp = patient.vitals?.systolic_bp || (patient as any).vitals?.systolic;
  const diaBp = patient.vitals?.diastolic_bp || (patient as any).vitals?.diastolic;
  const hasSevereHypertension = (sysBp !== undefined && sysBp >= 180) || (diaBp !== undefined && diaBp >= 110);
  
  const confirmedConds = (patient.confirmed_conditions || []).map(c => c.toLowerCase());
  const hasRecentCardiacEvent = confirmedConds.some(c => c.includes('myocardial') || c.includes('infarction') || c.includes('cardiac') || c.includes('angina')) ||
    Boolean((patient.clinical_safety as any)?.unstable_angina);

  const hasHeartFailure = confirmedConds.some(c => c.includes('heart_failure') || c.includes('chf'));

  const onInsulin = activeMeds.some(m => m.includes('insulin')) || Boolean(patient.clinical_safety?.insulin_treatment);
  const onSulfonylurea = activeMeds.some(m => m.includes('gliclazide') || m.includes('glimepiride') || m.includes('glipizide')) || Boolean(patient.clinical_safety?.sulfonylurea_treatment);
  const hasHypoglycemiaRisk = onInsulin || onSulfonylurea;

  const hasSevereRenal = conditions.includes('ckd_stage_1_3b') || 
    confirmedConds.some(c => c.includes('ckd') || c.includes('dialysis') || c.includes('renal')) ||
    (labs.egfr !== undefined && labs.egfr < 30);

  const hasSevereAnemia = labs.hemoglobin !== undefined && labs.hemoglobin < 8.0;

  const hasJointPainOrOsteoarthritis = conditions.includes('uric_acid_gout') || 
    conditions.includes('rheumatoid_arthritis') ||
    confirmedConds.some(c => c.includes('osteoarthritis') || c.includes('gout') || c.includes('arthritis'));

  const isPregnant = populationGroup === 'pregnancy' || patient.trimester !== undefined;

  // ── Safety Assessment ──────────────────────────────────────────────
  let overallSafety: 'SAFE' | 'CAUTION' | 'REQUIRES_CLINICAL_REVIEW' | 'HARD_STOP' = 'SAFE';
  let clearanceStatus: 'cleared_standard' | 'restricted_low_impact' | 'requires_medical_clearance' | 'strictly_contraindicated' = 'cleared_standard';

  if (hasRecentCardiacEvent || hasSevereHypertension) {
    overallSafety = 'HARD_STOP';
    clearanceStatus = 'strictly_contraindicated';
    contraindications.push(
      hasSevereHypertension 
        ? 'Severe Uncontrolled Hypertension (BP >= 180/110 mmHg): Strenuous exertion contraindicated until blood pressure pharmacologically stabilized.'
        : 'Active / Unstable Cardiovascular Event: Strenuous exercise strictly contraindicated without formal cardiology clearance.'
    );
  } else if (hasHeartFailure || hasSevereAnemia) {
    overallSafety = 'REQUIRES_CLINICAL_REVIEW';
    clearanceStatus = 'requires_medical_clearance';
    if (hasHeartFailure) riskFactors.push('Congestive Heart Failure: Requires supervised cardiac rehabilitation protocol.');
    if (hasSevereAnemia) riskFactors.push('Severe Anemia (Hb < 8 g/dL): Severe exertional hypoxemia and tachycardia risk.');
  } else if (hasHypoglycemiaRisk || hasSevereRenal || isElderly || isPregnant) {
    overallSafety = 'CAUTION';
    clearanceStatus = 'restricted_low_impact';
    if (hasHypoglycemiaRisk) riskFactors.push('Hypoglycemia Risk: Patient taking insulin or sulfonylurea; blood glucose must be >=100 mg/dL prior to exercise.');
    if (hasSevereRenal) riskFactors.push('Renal Impairment: Avoid dehydrating strenuous workouts and rhabdomyolysis triggers.');
    if (isElderly) riskFactors.push('Advanced Age / Fall Risk: Protocol adjusted for balance, joint protection, and fall prevention.');
    if (isPregnant) riskFactors.push('Pregnancy Context: Avoid supine position, contact sports, and excessive core intra-abdominal pressure.');
  }

  // If HARD STOP, return empty prescription with strict warnings
  if (overallSafety === 'HARD_STOP') {
    return {
      items: [],
      overall_safety_status: 'HARD_STOP',
      clinical_contraindications: contraindications,
      risk_factors_evaluated: riskFactors,
      cardiorespiratory_clearance_status: clearanceStatus,
      weekly_aerobic_minutes_target: 0,
      weekly_resistance_sessions_target: 0
    };
  }

  // ── Item 1: Foundational Aerobic / Daily Walking ────────────────────
  if (isElderly) {
    items.push({
      id: 'ex_gentle_walking_elderly',
      category: 'walking',
      title_en: 'Supported Indoor / Level-Surface Walking',
      title_bn: 'সমতল স্থানে ধীরে ধীরে হাঁটা (ব্যালেন্স সহায়তা সহ)',
      frequency_per_week: 5,
      duration_minutes: 20,
      intensity: 'light',
      target_rpe: 3,
      weekly_progression_en: 'Increase duration by 2-3 minutes every 2 weeks as tolerated, maintaining safe footwear.',
      weekly_progression_bn: 'প্রতি ২ সপ্তাহে সহ্যক্ষমতা অনুযায়ী ২-৩ মিনিট বাড়ান, অবশ্যই আরামদায়ক জুতো ব্যবহার করুন।',
      monitoring_instructions_en: 'Monitor balance and shortness of breath. Rest immediately if lightheadedness occurs.',
      monitoring_instructions_bn: 'ভারসাম্য ও শ্বাসকষ্টের দিকে খেয়াল রাখুন। মাথা ঘোরার ভাব হলে সাথে সাথে বসে বিশ্রাম নিন।',
      stop_conditions_en: ['Dizziness or unsteadiness', 'Chest discomfort', 'Sudden shortness of breath'],
      stop_conditions_bn: ['মাথা ঘোরা বা ভারসাম্যহীনতা', 'বুকে চাপ বা ব্যথা', 'হঠাৎ শ্বাসকষ্ট'],
      contraindications: ['Severe unassisted ataxia', 'Acute joint inflammation'],
      clinician_notes: 'Encourage walking with companion or using walking stick on level pavement.',
      approval_status: 'approved'
    });
  } else if (hasJointPainOrOsteoarthritis) {
    items.push({
      id: 'ex_low_impact_aerobic',
      category: 'low_impact',
      title_en: 'Low-Impact Non-Weight Bearing Aerobic Conditioning (Cycling or Swimming)',
      title_bn: 'হাঁটুর জয়েন্ট সুরক্ষিত রেখে হালকা সাঁতার বা স্টেশনারি সাইক্লিং',
      frequency_per_week: 4,
      duration_minutes: 25,
      intensity: 'moderate',
      target_rpe: 4,
      weekly_progression_en: 'Increase duration by 5 minutes weekly up to 40 minutes as joint comfort allows.',
      weekly_progression_bn: 'জয়েন্টে ব্যথা না হলে প্রতি সপ্তাহে ৫ মিনিট করে বাড়িয়ে সর্বোচ্চ ৪০ মিনিট পর্যন্ত করুন।',
      monitoring_instructions_en: 'Ensure zero joint shearing stress. Discontinue if post-exercise joint swelling persists >2 hours.',
      monitoring_instructions_bn: 'হাঁটু বা গোড়ালিতে চাপ যেন না পড়ে। ব্যায়ামের পর ফোলাভাব দেখা দিলে সাময়িক স্থগিত রাখুন।',
      stop_conditions_en: ['Acute localized joint pain', 'Severe knee swelling'],
      stop_conditions_bn: ['জয়েন্টে তীব্র ব্যথা', 'হাঁটু বা অস্থিসন্ধি ফুলে যাওয়া'],
      contraindications: ['Acute gout attack in weight-bearing joint'],
      clinician_notes: 'Stationary recumbent bike preferred over upright treadmill to protect patellofemoral cartilage.',
      approval_status: 'approved'
    });
  } else if (isPregnant) {
    items.push({
      id: 'ex_prenatal_walking',
      category: 'walking',
      title_en: 'Prenatal Low-Impact Walking & Posture Alignment',
      title_bn: 'গর্ভাবস্থায় নিরাপদ গতিতে হালকা হাঁটা ও অঙ্গবিন্যাস',
      frequency_per_week: 5,
      duration_minutes: 20,
      intensity: 'light',
      target_rpe: 3,
      weekly_progression_en: 'Maintain steady comfort without increasing heart rate excessively; focus on consistent daily steps.',
      weekly_progression_bn: 'গতি না বাড়িয়ে আরামদায়ক ছন্দে প্রতিদিন নিয়মিত হাঁটার অভ্যাস বজায় রাখুন।',
      monitoring_instructions_en: 'Talk test must be positive at all times (able to hold a full conversation without gasping). Ensure hydration.',
      monitoring_instructions_bn: 'হাঁটার সময় স্বাভাবিকভাবে কথা বলতে পারা উচিত। সাথে পর্যাপ্ত পানি রাখুন।',
      stop_conditions_en: ['Vaginal bleeding', 'Abdominal cramping', 'Dizziness or shortness of breath prior to exertion'],
      stop_conditions_bn: ['যোনিপথে রক্তপাত', 'পেটে তীব্র টান বা মোচড়', 'হাঁটার আগেই মাথা ঘোরা বা বুক ধড়ফড়'],
      contraindications: ['Placenta previa after 26 weeks', 'Preeclampsia', 'Incompetent cervix'],
      clinician_notes: 'Avoid hot, humid outdoor weather. Walk in air-conditioned or shaded morning environments.',
      approval_status: 'approved'
    });
  } else {
    items.push({
      id: 'ex_brisk_walking_standard',
      category: 'brisk_walking',
      title_en: 'Brisk Aerobic Walking (Moderate Cardiorespiratory Conditioning)',
      title_bn: 'দ্রুত পদচারণা / অ্যারোবিক হাঁটা (পরিমিত কার্ডিও ব্যায়াম)',
      frequency_per_week: 5,
      duration_minutes: 30,
      intensity: 'moderate',
      target_rpe: 5,
      weekly_progression_en: 'Progress from 30 mins 4x/week to 40 mins 5x/week (aim for 150-200 min/week total).',
      weekly_progression_bn: 'সপ্তাহে ৪ দিন ৩০ মিনিট থেকে শুরু করে ৫ দিন ৪০ মিনিটে উন্নীত করুন (লক্ষ্য: ১৫০-২০০ মিনিট/সপ্তাহ)।',
      monitoring_instructions_en: hasHypoglycemiaRisk
        ? 'Pre-exercise glucose check mandated. Carry 15g fast-acting glucose or fruit juice to prevent acute hypoglycemia. Should be breathing faster but speaking in complete sentences.'
        : 'Should be breathing noticeably faster than rest but able to speak in complete sentences.',
      monitoring_instructions_bn: hasHypoglycemiaRisk
        ? 'ব্যায়ামের পূর্বে রক্তের সুগার পরিমাপ করুন এবং হাইপোগ্লাইসেমিয়া রোধে সাথে ১৫ গ্রাম দ্রুত শোষণযোগ্য গ্লুকোজ বা ফলের জুস রাখুন।'
        : 'শ্বাস-প্রশ্বাস কিছুটা দ্রুত হবে কিন্তু একনাগাড়ে কথা বলা সম্ভব হতে হবে।',
      stop_conditions_en: ['Chest pressure', 'Palpitations', 'Severe joint pain'],
      stop_conditions_bn: ['বুকে চাপ অনুভব', 'হৃদস্পন্দনে তীব্র অস্বাভাবিকতা', 'জয়েন্টে হঠাৎ ব্যথা'],
      contraindications: ['Acute febrile illness', 'Uncontrolled cardiac dysrhythmias'],
      clinician_notes: hasHypoglycemiaRisk 
        ? 'Pre-exercise glucose check mandated. Carry 15g fast-acting glucose tablets or fruit juice.'
        : undefined,
      approval_status: 'approved'
    });
  }

  // ── Item 2: Postprandial Walking (Shatapadi) for Glycemic Control ──
  if (conditions.includes('t2d_ir') || conditions.includes('pcos') || conditions.includes('metabolic_syndrome')) {
    items.push({
      id: 'ex_post_meal_stroll',
      category: 'post_meal_walking',
      title_en: 'Post-Meal Glycemic Stroll (10-15 Minutes, Non-Strenuous)',
      title_bn: 'খাবারের পর ধীরগতির হাঁটা (১০-১৫ মিনিট)',
      frequency_per_week: 7,
      duration_minutes: 15,
      intensity: 'very_light',
      target_rpe: 2,
      weekly_progression_en: 'Establish consistency after the largest meal of the day; expand to lunch and dinner.',
      weekly_progression_bn: 'দিনের প্রধান খাবারের পর নিয়মিত করুন; ধীরে ধীরে দুপুর ও রাত উভয় খাবারের পরেই অভ্যাস করুন।',
      monitoring_instructions_en: 'Gentle conversational pace. Avoid speed or incline to prevent digestive discomfort.',
      monitoring_instructions_bn: 'একদম শান্ত গতিতে হাঁটুন। দ্রুত দৌড়ানো বা শরীর ঝাঁকানো পরিহার করুন যাতে হজমে ব্যাঘাত না ঘটে।',
      stop_conditions_en: ['Severe abdominal cramps', 'Nausea'],
      stop_conditions_bn: ['পেটে তীব্র ব্যথা', 'বমি বমি ভাব'],
      contraindications: ['Severe postprandial hypotension'],
      approval_status: 'approved'
    });
  }

  // ── Item 3: Resistance & Functional Muscle Preservation ─────────────
  if (isElderly) {
    items.push({
      id: 'ex_balance_fall_prevention',
      category: 'balance_training',
      title_en: 'Fall-Prevention Balance & Chair Sit-to-Stand Mobility',
      title_bn: 'পতন রোধে ব্যালেন্স ব্যায়াম ও চেয়ার থেকে ওঠা-বসা',
      frequency_per_week: 3,
      duration_minutes: 15,
      intensity: 'light',
      target_rpe: 3,
      sets: 2,
      reps: 8,
      rest_seconds: 60,
      weekly_progression_en: 'Progress from assisted chair stands (holding stable table) to unassisted as leg power improves.',
      weekly_progression_bn: 'প্রথমে টেবিল বা চেয়ার ধরে দাঁড়িয়ে বসা শুরু করুন, শক্তি বাড়লে হাত না ধরে করার চেষ্টা করুন।',
      monitoring_instructions_en: 'Perform near a stable sturdy chair or countertop. Always ensure clear floor without trip hazards.',
      monitoring_instructions_bn: 'শক্ত ও স্থির চেয়ারের কাছে দাঁড়িয়ে করুন। মেঝের কার্পেট বা পিচ্ছিল স্থানে করবেন না।',
      stop_conditions_en: ['Loss of balance', 'Sudden dizziness'],
      stop_conditions_bn: ['ভারসাম্য হারানো', 'মাথা ঘোরা'],
      contraindications: ['Severe acute vertigo'],
      clinician_notes: 'Essential for sarcopenia mitigation and neuromuscular coordination.',
      approval_status: 'approved'
    });
  } else if (!isPediatric && !isPregnant) {
    items.push({
      id: 'ex_resistance_training_standard',
      category: 'resistance_training',
      title_en: 'Whole-Body Functional Resistance Training (Bodyweight / Resistance Bands)',
      title_bn: 'সম্পূর্ণ শরীরের কার্যকরী শক্তি বর্ধক ব্যায়াম (বডিওয়েট বা রেজিস্ট্যান্স ব্যান্ড)',
      frequency_per_week: 2,
      duration_minutes: 25,
      intensity: 'moderate',
      target_rpe: 6,
      sets: 2,
      reps: 10,
      rest_seconds: 90,
      weekly_progression_en: 'Begin with bodyweight squats, wall push-ups, and band pull-aparts. Add 1 rep per set weekly until 12 reps reached.',
      weekly_progression_bn: 'চেয়ার স্কোয়াট, দেয়াল পুশ-আপ ও ব্যান্ড দিয়ে শুরু করুন। প্রতি সপ্তাহে ১টি করে বাড়িয়ে ১২টি রেপসে পৌঁছান।',
      monitoring_instructions_en: 'Never hold breath during exertion (avoid Valsalva maneuver to prevent blood pressure spikes). Exhale on effort.',
      monitoring_instructions_bn: 'ব্যায়ামের সময় কোনো অবস্থাতেই শ্বাস আটকে রাখবেন না। জোর দেওয়ার সময় স্বাভাবিকভাবে মুখ দিয়ে শ্বাস ছাড়ুন।',
      stop_conditions_en: ['Sudden joint pain', 'Dizziness', 'Excessive muscle tremor'],
      stop_conditions_bn: ['জয়েন্টে আকস্মিক খচখচে ব্যথা', 'মাথা ঘোরা', 'অতিরিক্ত পেশি কাঁপুনি'],
      contraindications: ['Severe uncorrected aortic stenosis', 'Active retinal detachment or proliferative retinopathy'],
      clinician_notes: 'Critical for preserving lean skeletal muscle mass, bone mineral density, and basal metabolic rate.',
      approval_status: 'approved'
    });
  }

  // ── Item 4: Flexibility & Diaphragmatic Mobility ────────────────────
  items.push({
    id: 'ex_mobility_flexibility',
    category: 'flexibility',
    title_en: 'Gentle Spinal Mobility & Hamstring/Calf Flexibility',
    title_bn: 'মেরুদণ্ডের নমনীয়তা ও পেশির স্ট্রেচিং (হালকা যোগাসন/স্ট্রেচ)',
    frequency_per_week: 5,
    duration_minutes: 10,
    intensity: 'very_light',
    target_rpe: 2,
    weekly_progression_en: 'Hold each gentle stretch for 15-20 seconds without bouncing. Breathe smoothly throughout.',
    weekly_progression_bn: 'প্রতিটি স্ট্রেচ ঝাঁকুনি না দিয়ে আলতোভাবে ১৫-২০ সেকেন্ড ধরে রাখুন। স্বাভাবিক শ্বাস নিন।',
    monitoring_instructions_en: 'Move to point of mild gentle tension, never acute pain.',
    monitoring_instructions_bn: 'পেশিতে হালকা টান লাগা পর্যন্ত করুন, ব্যথা লাগলে সাথে সাথে থামিয়ে দিন।',
    stop_conditions_en: ['Nerve shooting pain or numbness', 'Joint pinch'],
    stop_conditions_bn: ['রগে বা স্নায়ুতে হঠাৎ তীব্র টান বা অবশ ভাব', 'জয়েন্টে চিমটি কাটার অনুভূতি'],
    contraindications: ['Acute intervertebral disc herniation with radiculopathy'],
    approval_status: 'approved'
  });

  const totalAerobicMinutes = items
    .filter(i => i.category === 'walking' || i.category === 'brisk_walking' || i.category === 'aerobic_conditioning' || i.category === 'low_impact')
    .reduce((sum, i) => sum + (i.frequency_per_week * i.duration_minutes), 0);

  const resistanceSessions = items
    .filter(i => i.category === 'resistance_training' || i.category === 'balance_training')
    .reduce((sum, i) => Math.max(sum, i.frequency_per_week), 0);

  return {
    items,
    overall_safety_status: overallSafety,
    clinical_contraindications: contraindications,
    risk_factors_evaluated: riskFactors,
    cardiorespiratory_clearance_status: clearanceStatus,
    weekly_aerobic_minutes_target: totalAerobicMinutes,
    weekly_resistance_sessions_target: resistanceSessions
  };
}
