/**
 * SHUDDHO FUNCTIONAL NUTRITION SOFTWARE
 * Ayurvedic Vikriti (Current Doshic Imbalance) Engine (Phase P1)
 * 
 * Evaluates current acute or chronic dosha aggravations separate
 * from innate constitutional baseline (Prakriti).
 */

import { VikritiScore } from '../../types/assessment';

export interface VikritiQuestion {
  id: string;
  imbalance_symptom_en: string;
  imbalance_symptom_bn: string;
  dosha: 'vata' | 'pitta' | 'kapha';
  isHighValueQuick: boolean;
}

export const VIKRITI_QUESTIONS: VikritiQuestion[] = [
  // Vata Aggravations
  {
    id: 'vik_gas_bloating',
    imbalance_symptom_en: 'Excess gas, bloating, or abdominal distension, especially late afternoon/evening',
    imbalance_symptom_bn: 'অতিরিক্ত গ্যাস, পেট ফাঁপা বা পেট ফুলে থাকা (বিশেষ করে বিকেলে বা সন্ধ্যায়)',
    dosha: 'vata',
    isHighValueQuick: true
  },
  {
    id: 'vik_constipation_hard_stool',
    imbalance_symptom_en: 'Hard, dry, pebbly stools or difficult evacuation (constipation)',
    imbalance_symptom_bn: 'শক্ত, শুষ্ক বা অনিয়মিত মলত্যাগ এবং কোষ্ঠকাঠিন্যের কষ্ট',
    dosha: 'vata',
    isHighValueQuick: true
  },
  {
    id: 'vik_nervous_anxiety',
    imbalance_symptom_en: 'Restlessness, racing thoughts, ungrounded anxiety, or palpitations',
    imbalance_symptom_bn: 'মানসিক অস্থিরতা, অতিরিক্ত দুশ্চিন্তা, ভয় ও বুক ধড়ফড়ানি',
    dosha: 'vata',
    isHighValueQuick: true
  },
  {
    id: 'vik_dry_skin_joint_crack',
    imbalance_symptom_en: 'Severe skin dryness, cracking heels, or popping/cracking joints',
    imbalance_symptom_bn: 'ত্বকের অতিরিক্ত শুষ্কতা, পা ফাটা বা গাঁটে কটকট শব্দ হওয়া',
    dosha: 'vata',
    isHighValueQuick: false
  },

  // Pitta Aggravations
  {
    id: 'vik_acidity_heartburn',
    imbalance_symptom_en: 'Acid reflux, sour belching, burning in chest, or burning sensation after eating',
    imbalance_symptom_bn: 'বুকজ্বালা, টক ঢেকুর, এসিডিটি বা খাবারের পর খাদ্যনালীতে জ্বালাপোড়া',
    dosha: 'pitta',
    isHighValueQuick: true
  },
  {
    id: 'vik_loose_stools',
    imbalance_symptom_en: 'Urgent, loose, burning stools or diarrhea triggered by warm/spicy meals',
    imbalance_symptom_bn: 'দ্রুত নরম বা পাতলা পায়খানা, পায়ুপথে জ্বালাপোড়া বা ঝাল খেলেই ডায়রিয়া',
    dosha: 'pitta',
    isHighValueQuick: true
  },
  {
    id: 'vik_skin_heat_rashes',
    imbalance_symptom_en: 'Red inflamed skin eruptions, urticaria, acne, or excessive body heat/flushes',
    imbalance_symptom_bn: 'ত্বকে লালচে ফুসকুড়ি, অ্যালার্জির চাকা, ব্রণ বা শরীরে অতিরিক্ত তাপের অনুভূতি',
    dosha: 'pitta',
    isHighValueQuick: true
  },
  {
    id: 'vik_irritability_anger',
    imbalance_symptom_en: 'Short temper, impatience, intense critical irritability, or anger flares',
    imbalance_symptom_bn: 'অল্পতেই অধৈর্য ও তীব্র খিটখিটে মেজাজ বা হঠাৎ রাগ হওয়া',
    dosha: 'pitta',
    isHighValueQuick: false
  },

  // Kapha Aggravations
  {
    id: 'vik_heaviness_sluggishness',
    imbalance_symptom_en: 'Heavy, sluggish sensation in body/stomach lasting hours after moderate meals',
    imbalance_symptom_bn: 'সামান্য খাওয়ার পরও পেটে ও শরীরে দীর্ঘক্ষণ ভারী ও অলস অনুভূতি',
    dosha: 'kapha',
    isHighValueQuick: true
  },
  {
    id: 'vik_mucus_congestion',
    imbalance_symptom_en: 'Excess mucus in throat, morning sinus congestion, or coated white tongue',
    imbalance_symptom_bn: 'গলায় অতিরিক্ত শ্লেষ্মা, সকালে নাক বন্ধ ও জিহ্বায় সাদা আস্তরণ (আম)',
    dosha: 'kapha',
    isHighValueQuick: true
  },
  {
    id: 'vik_fluid_retention',
    imbalance_symptom_en: 'Puffy eyes, swollen ankles/feet, or persistent fluid retention (edema)',
    imbalance_symptom_bn: 'সকালে চোখ ফোলা, পায়ে পানি আসা বা শরীরে রস সঞ্চয়',
    dosha: 'kapha',
    isHighValueQuick: true
  },
  {
    id: 'vik_daytime_sleepiness',
    imbalance_symptom_en: 'Excessive lethargy, brain fog, and intense daytime sleepiness',
    imbalance_symptom_bn: 'অতিরিক্ত আলস্য, ব্রেন ফগ ও দিনের বেলা তীব্র ঘুম ঘুম ভাব',
    dosha: 'kapha',
    isHighValueQuick: false
  }
];

/**
 * Calculates current Vikriti doshic aggravation score.
 */
export function calculateVikriti(answers: Record<string, 'yes' | 'no' | 'sometimes'>): VikritiScore {
  let vataCount = 0;
  let pittaCount = 0;
  let kaphaCount = 0;
  const maxPerDosha = 4;

  for (const q of VIKRITI_QUESTIONS) {
    const val = answers[q.id];
    let points = 0;
    if (val === 'yes') points = 1.0;
    else if (val === 'sometimes') points = 0.5;

    if (q.dosha === 'vata') vataCount += points;
    else if (q.dosha === 'pitta') pittaCount += points;
    else if (q.dosha === 'kapha') kaphaCount += points;
  }

  const vataAgg = Math.round((vataCount / maxPerDosha) * 100);
  const pittaAgg = Math.round((pittaCount / maxPerDosha) * 100);
  const kaphaAgg = Math.round((kaphaCount / maxPerDosha) * 100);

  const active: ('vata' | 'pitta' | 'kapha')[] = [];
  if (vataAgg >= 40) active.push('vata');
  if (pittaAgg >= 40) active.push('pitta');
  if (kaphaAgg >= 40) active.push('kapha');

  let dominant: VikritiScore['dominant_imbalance'] = 'sannipata_balanced';
  const maxVal = Math.max(vataAgg, pittaAgg, kaphaAgg);

  if (maxVal < 25) {
    dominant = 'sannipata_balanced';
  } else if (active.length >= 2) {
    dominant = 'dual_imbalance';
  } else if (vataAgg === maxVal) {
    dominant = 'vata_aggravation';
  } else if (pittaAgg === maxVal) {
    dominant = 'pitta_aggravation';
  } else {
    dominant = 'kapha_aggravation';
  }

  return {
    vata_aggravation: vataAgg,
    pitta_aggravation: pittaAgg,
    kapha_aggravation: kaphaAgg,
    dominant_imbalance: dominant,
    active_aggravations: active
  };
}
