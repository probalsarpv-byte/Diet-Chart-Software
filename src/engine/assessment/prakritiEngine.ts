/**
 * SHUDDHO FUNCTIONAL NUTRITION SOFTWARE
 * Ayurvedic Prakriti Constitutional Assessment Engine (Phase P1)
 * 
 * 100% Deterministic, explainable scoring for innate dosha constitution.
 * Calculates Vata, Pitta, and Kapha percentage scores and classifies
 * primary single, dual (Dvandvaja), or balanced (Tridoshic) constitutions.
 */

import { PrakritiScore, PrakritiDoshaType } from '../../types/assessment';

export interface PrakritiTraitOption {
  value: 'vata' | 'pitta' | 'kapha';
  label_en: string;
  label_bn: string;
}

export interface PrakritiQuestion {
  id: string;
  trait_en: string;
  trait_bn: string;
  options: PrakritiTraitOption[];
  isQuickEligible: boolean;
}

export const PRAKRITI_QUESTIONS: PrakritiQuestion[] = [
  {
    id: 'pra_body_frame',
    trait_en: 'Body Frame & Bone Structure',
    trait_bn: 'শারীরিক গঠন ও অস্থির কাঠামো',
    isQuickEligible: true,
    options: [
      { value: 'vata', label_en: 'Slender, thin, prominent joints, difficulty gaining weight', label_bn: 'পাতলা, সরু হাড়, গাঁট স্পষ্ট, ওজন বাড়ানো কঠিন' },
      { value: 'pitta', label_en: 'Medium build, athletic, proportionate, moderate muscle tone', label_bn: 'মাঝারি গড়ন, পেশিবহুল, সুষম ও দৃঢ় মাংসপেশি' },
      { value: 'kapha', label_en: 'Broad, sturdy, solid, heavy bones, gains weight easily', label_bn: 'চওড়া ও বলিষ্ঠ হাড়, ভারী গড়ন, সহজে ওজন বৃদ্ধি পায়' }
    ]
  },
  {
    id: 'pra_skin_texture',
    trait_en: 'Natural Skin Tendency',
    trait_bn: 'ত্বকের প্রাকৃতিক বৈশিষ্ট্য',
    isQuickEligible: true,
    options: [
      { value: 'vata', label_en: 'Dry, rough, thin, cracks easily, cool to touch', label_bn: 'শুষ্ক, রুক্ষ, খসখসে, দ্রুত ফাটার প্রবণতা ও ঠান্ডা' },
      { value: 'pitta', label_en: 'Warm, reddish undertone, sensitive, moles/freckles, prone to rashes', label_bn: 'উষ্ণ, লালচে ভাব, সংবেদনশীল ত্বক, তিল বা লালচে দাগ' },
      { value: 'kapha', label_en: 'Thick, smooth, oily/moist, soft, cool, pale/clear', label_bn: 'পুরু, তৈলাক্ত, নরম, উজ্জ্বল ও মসৃণ ত্বক' }
    ]
  },
  {
    id: 'pra_hair_characteristics',
    trait_en: 'Hair Characteristics',
    trait_bn: 'চুলের বৈশিষ্ট্য',
    isQuickEligible: false,
    options: [
      { value: 'vata', label_en: 'Dry, brittle, frizzy, thin, coarse, split ends', label_bn: 'শুষ্ক, রুক্ষ, ভঙ্গুর, পাতলা ও জট লাগার প্রবণতা' },
      { value: 'pitta', label_en: 'Fine, silky, early graying or thinning, reddish/blonde highlights', label_bn: 'নরম, রেশমি, অল্প বয়সে চুল পাকা বা পড়ার প্রবণতা' },
      { value: 'kapha', label_en: 'Thick, dense, lustrous, wavy, deep dark, naturally oily', label_bn: 'ঘন, কালো, চকচকে, ঢেউ খেলানো ও গোড়ায় তৈলাক্ত' }
    ]
  },
  {
    id: 'pra_appetite_nature',
    trait_en: 'Appetite & Hunger Pattern',
    trait_bn: 'ক্ষুধা ও রুচির প্রকৃতি',
    isQuickEligible: true,
    options: [
      { value: 'vata', label_en: 'Irregular, variable; forgets to eat or gets sudden cravings', label_bn: 'অনিয়মিত, পরিবর্তনশীল; কখনো ক্ষুধা পায় না আবার কখনো তীব্র হয়' },
      { value: 'pitta', label_en: 'Strong, intense; irritable or weak if meals are delayed', label_bn: 'তীব্র ও সময়মতো; খাবার দেরিতে পেলে মেজাজ খিটখিটে হয়' },
      { value: 'kapha', label_en: 'Steady, mild; can comfortably skip meals without distress', label_bn: 'ধীর ও নিয়মিত; খাবার বাদ দিলেও তেমন কোনো কষ্ট হয় না' }
    ]
  },
  {
    id: 'pra_digestion_speed',
    trait_en: 'Natural Digestion Tendency',
    trait_bn: 'হজমের স্বাভাবিক প্রবণতা',
    isQuickEligible: true,
    options: [
      { value: 'vata', label_en: 'Variable digestion, prone to bloating, gas, dryness', label_bn: 'পরিবর্তনশীল হজম, প্রায়ই পেট ফাঁপা, গ্যাস ও পেট কামড়ানো' },
      { value: 'pitta', label_en: 'Rapid, fiery digestion, prone to acidity, burning, loose stools', label_bn: 'দ্রুত ও তীব্র হজম, এসিডিটি, বুকজ্বালা ও পাতলা পায়খানার প্রবণতা' },
      { value: 'kapha', label_en: 'Slow, sluggish digestion; feels heavy for hours after eating', label_bn: 'ধীরগতির হজম; খাওয়ার পর অনেকক্ষণ পেট ভারী ও অলস লাগে' }
    ]
  },
  {
    id: 'pra_temperature_preference',
    trait_en: 'Climate & Temperature Sensitivity',
    trait_bn: 'আবহাওয়া ও তাপমাত্রার পছন্দ',
    isQuickEligible: true,
    options: [
      { value: 'vata', label_en: 'Dislikes cold, drafty, dry weather; prefers warmth, blankets', label_bn: 'ঠান্ডা ও শুষ্ক আবহাওয়া একদম সহ্য হয় না; গরম ও রোদ পছন্দ' },
      { value: 'pitta', label_en: 'Dislikes heat, sun, humidity; sweats easily, craves cool breeze', label_bn: 'গরম সহ্য করতে পারে না; দ্রুত ঘাম হয় ও ঠান্ডা পরিবেশ পছন্দ' },
      { value: 'kapha', label_en: 'Dislikes cold, damp, rainy weather; tolerates warmth well', label_bn: 'স্যাঁতসেঁতে ঠান্ডা ও বর্ষাকাল অপছন্দ; উষ্ণ শুষ্ক পরিবেশ পছন্দ' }
    ]
  },
  {
    id: 'pra_sleep_pattern',
    trait_en: 'Natural Sleep Tendency',
    trait_bn: 'ঘুমের স্বভাবজাত ধরন',
    isQuickEligible: true,
    options: [
      { value: 'vata', label_en: 'Light, interrupted, difficulty falling asleep, wakes easily', label_bn: 'পাতলা ও অগভীর ঘুম, সহজে ঘুম আসে না, সামান্য শব্দে ভেঙে যায়' },
      { value: 'pitta', label_en: 'Moderate, sound (6-7h); wakes up alert, intense dreams', label_bn: 'পরিমিত গাঢ় ঘুম (৬-৭ ঘণ্টা); জাগ্রত হলে সতেজ অনুভূতি' },
      { value: 'kapha', label_en: 'Heavy, deep, prolonged (>8h); difficult to wake in morning', label_bn: 'অতিরিক্ত গভীর ও দীর্ঘ ঘুম (>৮ ঘণ্টা); সকালে উঠতে কষ্ট হয়' }
    ]
  },
  {
    id: 'pra_elimination_habit',
    trait_en: 'Natural Bowel Tendency',
    trait_bn: 'স্বাভাবিক মলত্যাগের বৈশিষ্ট্য',
    isQuickEligible: true,
    options: [
      { value: 'vata', label_en: 'Dry, hard, irregular, prone to constipation (Bristol 1-2)', label_bn: 'শক্ত, শুষ্ক, অনিয়মিত এবং কোষ্ঠকাঠিন্যের প্রবণতা' },
      { value: 'pitta', label_en: 'Regular, soft, yellowish, 2-3 times/day, loose with spicy food', label_bn: 'নরম, হলুদ বর্ণের, দিনে ২-৩ বার; ঝাল খেলে পেট নরম হয়' },
      { value: 'kapha', label_en: 'Consistent, well-formed, heavy, once daily, slow transit', label_bn: 'নিয়মিত, স্বাভাবিক আকৃতির, ভারী ও দিনে একবার পরিষ্কার' }
    ]
  },
  {
    id: 'pra_physical_stamina',
    trait_en: 'Physical Energy & Activity Pattern',
    trait_bn: 'দৈহিক শক্তি ও কর্মস্পৃহা',
    isQuickEligible: false,
    options: [
      { value: 'vata', label_en: 'Quick bursts of energy, exhausts rapidly, restless movements', label_bn: 'দ্রুত শক্তির স্ফূরণ কিন্তু দ্রুত ক্লান্ত হয়; অস্থির নড়াচড়া' },
      { value: 'pitta', label_en: 'Moderate steady endurance, competitive, purposeful activity', label_bn: 'পরিমিত স্থির স্ট্যামিনা, প্রতিযোগিতামূলক মনোভাব ও লক্ষ্যমুখী' },
      { value: 'kapha', label_en: 'High steady endurance, methodical, slow to start, great stamina', label_bn: 'অসাধারণ দীর্ঘস্থায়ী সহনশীলতা, ধীরস্থির তবে অনেকক্ষণ কাজ করতে পারে' }
    ]
  },
  {
    id: 'pra_mental_tendency',
    trait_en: 'Mind & Memory Processing',
    trait_bn: 'মনোভাব ও স্মৃতিশক্তির ধরন',
    isQuickEligible: true,
    options: [
      { value: 'vata', label_en: 'Learns very quickly, forgets quickly; creative, overthinking', label_bn: 'খুব দ্রুত শিখে কিন্তু দ্রুত ভুলে যায়; অতিরিক্ত চিন্তা ও কল্পনাপ্রবণ' },
      { value: 'pitta', label_en: 'Sharp, analytical, logical, decisive, good retentive memory', label_bn: 'ধারালো, বিশ্লেষণধর্মী, বাস্তববাদী ও তীক্ষ্ণ স্মৃতিশক্তি' },
      { value: 'kapha', label_en: 'Learns slowly through repetition, never forgets; calm, loyal', label_bn: 'ধীরে শেখে তবে কখনো ভোলে না; শান্ত, স্থির ও ধৈর্যশীল' }
    ]
  },
  {
    id: 'pra_stress_reaction',
    trait_en: 'Reaction to Sudden Stress',
    trait_bn: 'তীব্র মানসিক চাপে তাৎক্ষণিক প্রতিক্রিয়া',
    isQuickEligible: true,
    options: [
      { value: 'vata', label_en: 'Anxiety, nervous worry, fear, trembling, sleep disruption', label_bn: 'উদ্বেগ, ভয়, অস্থিরতা, বুক ধড়ফড় ও অনিদ্রা' },
      { value: 'pitta', label_en: 'Irritability, anger, frustration, critical judgment, argument', label_bn: 'রাগ, ক্ষোভ, অধৈর্য হওয়া ও প্রতিবাদী মনোভাব' },
      { value: 'kapha', label_en: 'Withdrawal, silence, procrastination, comfort eating, stubbornness', label_bn: 'চুপচাপ থাকা, সিদ্ধান্ত পিছিয়ে দেওয়া, অলসতা বা বেশি খাওয়া' }
    ]
  },
  {
    id: 'pra_speech_pattern',
    trait_en: 'Speech & Communication Style',
    trait_bn: 'কথা বলার ধরন ও ভাবপ্রকাশ',
    isQuickEligible: false,
    options: [
      { value: 'vata', label_en: 'Fast, enthusiastic, rambling, talks a lot, jumps topics', label_bn: 'দ্রুত, উচ্ছ্বসিত, অনর্গল কথা বলা ও এক প্রসঙ্গ থেকে অন্য প্রসঙ্গে যাওয়া' },
      { value: 'pitta', label_en: 'Precise, articulate, convincing, sharp, direct, assertive', label_bn: 'স্পষ্ট, যুক্তিপূর্ণ, আত্মবিশ্বাসী, সরাসরি ও প্রভাবশালী' },
      { value: 'kapha', label_en: 'Slow, melodious, thoughtful, speaks only when necessary', label_bn: 'ধীর, গম্ভীর, মিষ্টি স্বর এবং প্রয়োজনের অতিরিক্ত কথা না বলা' }
    ]
  }
];

/**
 * Deterministically computes Prakriti constitution scores from trait answers.
 */
export function calculatePrakriti(answers: Record<string, string>): PrakritiScore {
  let vataCount = 0;
  let pittaCount = 0;
  let kaphaCount = 0;
  let totalEvaluated = 0;

  for (const q of PRAKRITI_QUESTIONS) {
    const ans = answers[q.id];
    if (ans === 'vata') {
      vataCount++;
      totalEvaluated++;
    } else if (ans === 'pitta') {
      pittaCount++;
      totalEvaluated++;
    } else if (ans === 'kapha') {
      kaphaCount++;
      totalEvaluated++;
    }
  }

  // Fallback defaults if zero answers
  if (totalEvaluated === 0) {
    return {
      vata_score: 33,
      pitta_score: 33,
      kapha_score: 34,
      primary_constitution: 'tridoshic',
      is_preliminary: true,
      total_questions_evaluated: 0
    };
  }

  const vataPct = Math.round((vataCount / totalEvaluated) * 100);
  const pittaPct = Math.round((pittaCount / totalEvaluated) * 100);
  const kaphaPct = Math.round((kaphaCount / totalEvaluated) * 100);

  // Determine constitution
  let primary: PrakritiDoshaType = 'tridoshic';
  let secondary: 'vata' | 'pitta' | 'kapha' | undefined = undefined;

  const scores = [
    { dosha: 'vata' as const, score: vataPct },
    { dosha: 'pitta' as const, score: pittaPct },
    { dosha: 'kapha' as const, score: kaphaPct }
  ].sort((a, b) => b.score - a.score);

  const highest = scores[0];
  const second = scores[1];
  const lowest = scores[2];

  // If top dosha exceeds second by >= 14% -> Single dominant constitution
  if (highest.score - second.score >= 14) {
    primary = highest.dosha;
    secondary = second.dosha;
  }
  // If top two are close (diff < 14) and lowest is significantly lower -> Dual constitution (Dvandvaja)
  else if (highest.score - lowest.score >= 14) {
    const pair = [highest.dosha, second.dosha].sort().join('_');
    if (pair === 'pitta_vata' || pair === 'vata_pitta') primary = 'vata_pitta';
    else if (pair === 'kapha_pitta' || pair === 'pitta_kapha') primary = 'pitta_kapha';
    else primary = 'vata_kapha';
    secondary = second.dosha;
  }
  // Otherwise all three are balanced within 13% -> Tridoshic (Sannipata)
  else {
    primary = 'tridoshic';
  }

  return {
    vata_score: vataPct,
    pitta_score: pittaPct,
    kapha_score: kaphaPct,
    primary_constitution: primary,
    secondary_dosha: secondary,
    is_preliminary: totalEvaluated < 8,
    total_questions_evaluated: totalEvaluated
  };
}
