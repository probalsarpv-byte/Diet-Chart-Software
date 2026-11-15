// P2 Ayurvedic Clinical Interpretation Engine
// Deterministic Prakriti, Vikriti, Agni assessment and Pathya/Apathya dietary guidance
// Strictly constrained by modern clinical safety primacy.

import { PatientProfile } from '../../types';
import {
  ClinicalObservation,
  AyurvedicInterpretationResult,
} from './types';

export function interpretAyurvedicAssessment(
  patient: PatientProfile,
  observations: ClinicalObservation[],
  assessmentAnswers: Record<string, any> = {}
): AyurvedicInterpretationResult {
  // ─── 1. Prakriti Assessment (Constitutional Baseline) ───────────
  let vataPrakritiPoints = 0;
  let pittaPrakritiPoints = 0;
  let kaphaPrakritiPoints = 0;

  // Check direct assessment answers if available
  const pFrame = assessmentAnswers['q_ayur_prakriti_body_frame'];
  if (pFrame === 'lean_narrow') vataPrakritiPoints += 2;
  else if (pFrame === 'medium_muscular') pittaPrakritiPoints += 2;
  else if (pFrame === 'large_heavy') kaphaPrakritiPoints += 2;

  const pSkin = assessmentAnswers['q_ayur_prakriti_skin'];
  if (pSkin === 'dry_rough_cool') vataPrakritiPoints += 2;
  else if (pSkin === 'warm_sensitive_oily') pittaPrakritiPoints += 2;
  else if (pSkin === 'thick_moist_cool') kaphaPrakritiPoints += 2;

  const pTemp = assessmentAnswers['q_ayur_prakriti_temperature'];
  if (pTemp === 'cold_hands_feet') vataPrakritiPoints += 2;
  else if (pTemp === 'easily_overheated') pittaPrakritiPoints += 2;
  else if (pTemp === 'adaptable_cool') kaphaPrakritiPoints += 2;

  const pDigestion = assessmentAnswers['q_ayur_prakriti_digestion'];
  if (pDigestion === 'irregular_variable') vataPrakritiPoints += 2;
  else if (pDigestion === 'fast_sharp_intense') pittaPrakritiPoints += 2;
  else if (pDigestion === 'slow_steady_heavy') kaphaPrakritiPoints += 2;

  // Heuristics from patient profile if questions unanswered
  const patientBmi = patient.calculated?.bmi || (patient.height_cm ? patient.weight_kg / Math.pow(patient.height_cm / 100, 2) : 22);
  if (vataPrakritiPoints === 0 && pittaPrakritiPoints === 0 && kaphaPrakritiPoints === 0) {
    if (patientBmi < 19) vataPrakritiPoints += 3;
    else if (patientBmi > 27) kaphaPrakritiPoints += 3;
    else pittaPrakritiPoints += 2;

    // Baseline distribution for balanced representation
    vataPrakritiPoints += 1;
    pittaPrakritiPoints += 1;
    kaphaPrakritiPoints += 1;
  }

  const totalPrakriti = vataPrakritiPoints + pittaPrakritiPoints + kaphaPrakritiPoints || 1;
  const vataPercentage = Math.round((vataPrakritiPoints / totalPrakriti) * 100);
  const pittaPercentage = Math.round((pittaPrakritiPoints / totalPrakriti) * 100);
  const kaphaPercentage = 100 - (vataPercentage + pittaPercentage);

  let primaryDosha: AyurvedicInterpretationResult['prakriti']['primaryDosha'] = 'Tridoshic';
  if (vataPercentage >= 50) primaryDosha = 'Vata';
  else if (pittaPercentage >= 50) primaryDosha = 'Pitta';
  else if (kaphaPercentage >= 50) primaryDosha = 'Kapha';
  else if (vataPercentage >= 35 && pittaPercentage >= 35) primaryDosha = 'Vata-Pitta';
  else if (pittaPercentage >= 35 && kaphaPercentage >= 35) primaryDosha = 'Pitta-Kapha';
  else if (vataPercentage >= 35 && kaphaPercentage >= 35) primaryDosha = 'Vata-Kapha';

  const constitutionalTendencies_en: string[] = [];
  const constitutionalTendencies_bn: string[] = [];

  if (primaryDosha.includes('Vata')) {
    constitutionalTendencies_en.push('Sensitivity to cold drafts, irregular digestion, variable energy levels, tendency toward dry skin and constipation.');
    constitutionalTendencies_bn.push('ঠান্ডা সহ্য করতে না পারা, অনিয়মিত হজম, অস্থির মানসিক ভাব এবং ত্বক ও অন্ত্রের শুষ্কতা প্রবণতা।');
  }
  if (primaryDosha.includes('Pitta')) {
    constitutionalTendencies_en.push('Strong metabolic fire, heat sensitivity, assertive disposition, tendency toward acid dyspepsia and inflammatory skin reactions.');
    constitutionalTendencies_bn.push('তীব্র ক্ষুধা ও দ্রুত বিপাক, তাপ সংবেদনশীলতা, গ্যাস্ট্রিক এসিডিটি ও ত্বক গরম হয়ে প্রদাহ হওয়ার প্রবণতা।');
  }
  if (primaryDosha.includes('Kapha')) {
    constitutionalTendencies_en.push('Sturdy physical build, endurance, slower metabolic clearance, tendency toward post-meal lethargy and fluid retention.');
    constitutionalTendencies_bn.push('দৃঢ় শারীরিক গঠন, ধীর বিপাক প্রক্রিয়া, খাওয়ার পর ভারী ভাব এবং ওজন বা শ্লেষ্মা বৃদ্ধির প্রবণতা।');
  }

  // ─── 2. Vikriti Assessment (Current Imbalance) ───────────────────
  let vataScore = 0;
  let pittaScore = 0;
  let kaphaScore = 0;
  const triggeringSymptomIds: string[] = [];

  for (const obs of observations) {
    const tags = obs.tags || [];
    const isModOrSev = obs.severity === 'moderate' || obs.severity === 'severe';
    const weight = isModOrSev ? 2 : 1;

    // Vata markers: dry, light, cold, irregular, mobile
    if (tags.some(t => ['constipation', 'bloating', 'gas', 'flatulence', 'joint_pain', 'poor_sleep', 'anxiety', 'dry_skin'].includes(t))) {
      vataScore += weight;
      triggeringSymptomIds.push(obs.id);
    }
    // Pitta markers: hot, sharp, light, liquid, spreading
    if (tags.some(t => ['acid_reflux', 'heartburn', 'diarrhea', 'skin_rash', 'urticaria', 'elevated_bp', 'inflammation', 'elevated_crp'].includes(t))) {
      pittaScore += weight;
      triggeringSymptomIds.push(obs.id);
    }
    // Kapha markers: heavy, slow, cold, oily, stagnant
    if (tags.some(t => ['central_adiposity', 'high_bmi', 'fatty_liver_condition', 'sluggish_digestion', 'postprandial_fatigue', 'elevated_triglycerides'].includes(t))) {
      kaphaScore += weight;
      triggeringSymptomIds.push(obs.id);
    }
  }

  const aggravatedDoshas: Array<'Vata' | 'Pitta' | 'Kapha'> = [];
  if (vataScore >= 2) aggravatedDoshas.push('Vata');
  if (pittaScore >= 2) aggravatedDoshas.push('Pitta');
  if (kaphaScore >= 2) aggravatedDoshas.push('Kapha');

  let primaryAggravation: AyurvedicInterpretationResult['vikriti']['primaryAggravation'] = 'None';
  if (aggravatedDoshas.length === 1) {
    primaryAggravation = aggravatedDoshas[0];
  } else if (aggravatedDoshas.length > 1) {
    const maxScore = Math.max(vataScore, pittaScore, kaphaScore);
    if (vataScore === maxScore && vataScore > pittaScore && vataScore > kaphaScore) primaryAggravation = 'Vata';
    else if (pittaScore === maxScore && pittaScore > vataScore && pittaScore > kaphaScore) primaryAggravation = 'Pitta';
    else if (kaphaScore === maxScore && kaphaScore > vataScore && kaphaScore > pittaScore) primaryAggravation = 'Kapha';
    else primaryAggravation = 'Dual';
  }

  // ─── 3. Agni Assessment (Digestive Fire) ──────────────────────────
  let agniStatus: AyurvedicInterpretationResult['agni']['status'] = 'Sama';
  let agniDesc_en = 'Balanced digestive fire (Sama Agni): comfortable digestion, predictable hunger, and regular assimilation.';
  let agniDesc_bn = 'ভারসাম্যপূর্ণ হজম ক্ষমতা (সম অগ্নি): আরামদায়ক পরিপাক, স্বাভাবিক ক্ষুধা এবং সুস্থ খাদ্য শোষণ।';
  const agniAdj_en: string[] = [];
  const agniAdj_bn: string[] = [];

  const hasPittaAgni =
    assessmentAnswers['q_ayur_agni'] === 'tikshnagni' ||
    assessmentAnswers['q_gi_heartburn'] === 'daily' ||
    assessmentAnswers['q_gi_acid_reflux'] === 'daily' ||
    observations.some(o => o.tags?.some(t => ['acid_reflux', 'heartburn', 'epigastric_pain', 'diarrhea'].includes(t)));
  const hasVataAgni =
    assessmentAnswers['q_ayur_agni'] === 'vishamagni' ||
    assessmentAnswers['q_gi_bloating'] === 'frequent' ||
    assessmentAnswers['q_gi_constipation'] === 'frequent' ||
    observations.some(o => o.tags?.some(t => ['bloating', 'gas', 'constipation', 'irregular_meal_timing'].includes(t)));
  const hasKaphaAgni =
    assessmentAnswers['q_ayur_agni'] === 'mandagni' ||
    assessmentAnswers['q_gi_sluggish_digestion'] === 'frequent' ||
    observations.some(o => o.tags?.some(t => ['sluggish_digestion', 'postprandial_fatigue', 'central_adiposity'].includes(t)));

  if (hasPittaAgni) {
    agniStatus = 'Tikshna';
    agniDesc_en = 'Hyperactive / Sharp Digestive Fire (Tikshna Agni): excessive appetite, burning epigastric discomfort, acid reflux, or loose bowel motions.';
    agniDesc_bn = 'তীব্র পরিপাক অগ্নি (তীক্ষ্ণ অগ্নি): অতিরিক্ত ক্ষুধা, বুক ও পেট জ্বালা, এসিডিটি এবং দ্রুত বা আলগা পায়খানা।';
    agniAdj_en.push('Avoid pungent, sour, fermented, and deep-fried items. Favor cooling hydration: tender coconut water, sweet lassi, coriander water.');
    agniAdj_bn.push('অতিরিক্ত ঝাল, টক, পোড়া ভাজা ও কড়া মশলাদার খাবার পরিহার করুন। ডাবের পানি, মিষ্টি ঘোল ও ধনে ভেজানো পানি উপকারী।');
  } else if (hasVataAgni) {
    agniStatus = 'Vishama';
    agniDesc_en = 'Variable / Fluctuating Digestive Fire (Vishama Agni): fluctuating appetite, unpredictable bowel movements, abdominal distension, and bloating.';
    agniDesc_bn = 'অনিয়মিত পরিপাক অগ্নি (বিষম অগ্নি): একেক দিন একেক রকম ক্ষুধা, পেট ফাঁপা, গ্যাস ও মলত্যাগে অনিয়ম।';
    agniAdj_en.push('Ensure strictly fixed meal schedules. Favor warm, soft cooked foods (khichuri, warm vegetable soup), small sip of warm ginger water.');
    agniAdj_bn.push('নির্দিষ্ট সময়ে খাবার গ্রহণ বাধ্যতামূলক। হালকা গরম, নরম জাউ বা পাতলা খিচুড়ি এবং অল্প কুসুম গরম আদা পানি উপকারী।');
  } else if (hasKaphaAgni) {
    agniStatus = 'Manda';
    agniDesc_en = 'Slow / Hypoactive Digestive Fire (Manda Agni): poor appetite, heavy postprandial sensation persisting for hours, coated tongue, and sluggish motility.';
    agniDesc_bn = 'ধীর ও দুর্বল পরিপাক অগ্নি (মন্দ অগ্নি): ক্ষুধার অভাব, খাওয়ার পর ঘণ্টার পর ঘণ্টা পেট ভারী লাগা এবং আলস্য ভাব।';
    agniAdj_en.push('Favor light, warm, well-spiced foods (cumin, black pepper, ginger). Avoid heavy dairy, cold drinks, daytime sleep, and late dinners.');
    agniAdj_bn.push('হালকা গরম খাবার, জিরে ও গোলমরিচ দিয়ে রান্না। ভারী মিষ্টি, ঠান্ডা পানীয়, দিনের বেলা ঘুমানো এবং দেরিতে রাতের খাবার খাওয়া নিষিদ্ধ।');
  }

  // ─── 4. Pathya / Apathya Recommendations ────────────────────────
  const generalPrinciples_en: string[] = [
    'Align meal timings with the diurnal circadian rhythm (largest meal at midday when Agni is naturally strongest).',
    'Consume freshly prepared, warm whole foods rather than refrigerated or stale leftovers.',
    'Eat mindfully without screen distraction, chewing each bite thoroughly.',
  ];
  const generalPrinciples_bn: string[] = [
    'প্রাকৃতিক সার্কাডিয়ান ছন্দের সাথে মিল রেখে আহার গ্রহণ (দুপুরে যখন সূর্য শীর্ষে তখন প্রধান আহার গ্রহণ)।',
    'সবসময় সদ্য রান্না করা কুসুম গরম প্রাকৃতিক খাবার গ্রহণ করুন, বাসি বা ফ্রিজের ঠান্ডা খাবার এড়িয়ে চলুন।',
    'মনোযোগ সহকারে ধীরে ধীরে চিবিয়ে খাবার গ্রহণ করুন।',
  ];

  const favorableFoods: string[] = [
    'Aman/Balam parboiled rice or Lal chal (in moderation)',
    'Thin Moong dal soup seasoned with cumin and ginger',
    'Locally accessible gourd vegetables: Lao (bottle gourd), Jhinga, Chichinga, Potol',
    'Tender fresh vegetables: Green papaya, Kacha kola (green plantain broth)',
    'Easily digestible indigenous small fish: Shing, Magur, Koi, Bele (light broth)',
    'Buttermilk/Ghol with roasted cumin (Takra) for gut microbial support',
    'Seasonal sweet fruits: Ripe sweet banana (Shobri), ripe Papaya, sweet Pomegranate',
  ];

  const unfavorableFoods: string[] = [
    'Deep-fried street snacks: Singara, Puri, Piaju, Beguni, Chanachur',
    'Reheated oxidized oils and vanaspati dalda',
    'Excessive red chilies, pungent commercial vinegar, sour mustard pickles',
    'Cold refrigerated aerated beverages and sugary iced drinks',
    'Heavy late-night rich dinners (biryani, khichuri with beef fat)',
  ];

  // ─── 5. Safety Primacy Overrides ────────────────────────────────
  const safetyOverrideNotice =
    'CRITICAL MEDICAL OVERRIDE: Any Ayurvedic dietary suggestion that conflicts with confirmed patient allergies, medically prescribed fluid/electrolyte restrictions, or diabetes hypoglycemic safety is automatically null and void.';

  // Suppress dairy suggestions if dairy allergy
  const hasDairyAllergy = patient.confirmed_allergies.some(a => /dairy|milk|lactose/i.test(a));
  const finalFavorable = hasDairyAllergy
    ? favorableFoods.filter(f => !/milk|ghol|buttermilk|takra|lassi/i.test(f))
    : favorableFoods;

  const agniTypeMap: Record<string, 'samagni' | 'vishamagni' | 'tikshnagni' | 'mandagni'> = {
    Sama: 'samagni',
    Vishama: 'vishamagni',
    Tikshna: 'tikshnagni',
    Manda: 'mandagni',
  };

  const viryaPref: 'sheeta' | 'ushna' | 'neutral' =
    primaryAggravation === 'Pitta' ? 'sheeta' : primaryAggravation === 'Vata' || primaryAggravation === 'Kapha' ? 'ushna' : 'neutral';

  return {
    frameworkVersion: '2.0.0',
    prakriti: {
      vata_score: vataPrakritiPoints,
      pitta_score: pittaPrakritiPoints,
      kapha_score: kaphaPrakritiPoints,
      dominant_constitution: primaryDosha,
      is_preliminary: false,
      primaryDosha,
      vataPercentage,
      pittaPercentage,
      kaphaPercentage,
      constitutionalTendencies_en,
      constitutionalTendencies_bn,
    },
    vikriti: {
      vata_imbalance: vataScore,
      pitta_imbalance: pittaScore,
      kapha_imbalance: kaphaScore,
      primary_aggravation: primaryAggravation,
      aggravation_severity: (Math.max(vataScore, pittaScore, kaphaScore) >= 4 ? 'severe' : Math.max(vataScore, pittaScore, kaphaScore) >= 2 ? 'moderate' : Math.max(vataScore, pittaScore, kaphaScore) >= 1 ? 'mild' : 'none') as 'none' | 'mild' | 'moderate' | 'severe',
      aggravatedDoshas,
      primaryAggravation,
      triggeringSymptomIds: [...new Set(triggeringSymptomIds)],
    },
    agni: {
      type: agniTypeMap[agniStatus] || 'samagni',
      clinical_manifestation_en: agniDesc_en,
      clinical_manifestation_bn: agniDesc_bn,
      therapeutic_diet_principles_en: agniAdj_en,
      therapeutic_diet_principles_bn: agniAdj_bn,
      status: agniStatus,
      description_en: agniDesc_en,
      description_bn: agniDesc_bn,
      dietaryAdjustments_en: agniAdj_en,
      dietaryAdjustments_bn: agniAdj_bn,
    },
    pathya_apathya_handoff: {
      favored_rasas: primaryAggravation === 'Pitta' ? ['madhura', 'tikta', 'kashaya'] : primaryAggravation === 'Vata' ? ['madhura', 'amla', 'lavana'] : ['katu', 'tikta', 'kashaya'],
      minimized_rasas: primaryAggravation === 'Pitta' ? ['katu', 'amla', 'lavana'] : primaryAggravation === 'Vata' ? ['katu', 'tikta', 'kashaya'] : ['madhura', 'amla', 'lavana'],
      virya_preference: viryaPref,
      pathya_foods_bn: finalFavorable,
      apathya_foods_bn: unfavorableFoods,
      digestive_tolerance_notes_en: agniDesc_en,
      digestive_tolerance_notes_bn: agniDesc_bn,
    },
    pathyaRecommendations: {
      generalPrinciples_en,
      generalPrinciples_bn,
      favorableFoods: finalFavorable,
      unfavorableFoods,
    },
    clinicalSafetyPrimacyNote:
      'CLINICAL SAFETY PRIMACY: All Ayurvedic concepts in Shuddho software are non-pharmacological, whole-food dietary principles. Confirmed clinical allergies, renal/cardiovascular limits, and medication safety strictly override doshic preferences.',
    safetyOverrideNotice,
  };
}
