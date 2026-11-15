/**
 * SHUDDHO FUNCTIONAL NUTRITION SOFTWARE
 * Ayurvedic Agni (Digestive Fire) Assessment Engine (Phase P1)
 * 
 * Classifies metabolic and gastrointestinal digestion into the 4 classical
 * Ayurvedic categories: Samagni, Vishamagni, Tikshnagni, and Mandagni.
 */

import { AgniAssessmentResult, AgniClassification } from '../../types/assessment';

export interface AgniQuestion {
  id: string;
  question_en: string;
  question_bn: string;
  options: {
    value: AgniClassification;
    label_en: string;
    label_bn: string;
  }[];
}

export const AGNI_QUESTIONS: AgniQuestion[] = [
  {
    id: 'agni_hunger_pattern',
    question_en: 'How does your hunger behave throughout the day?',
    question_bn: 'সারাদিনে আপনার ক্ষুধার ধরন কেমন থাকে?',
    options: [
      {
        value: 'samagni',
        label_en: 'Regular, predictable hunger at regular meal times',
        label_bn: 'নির্দিষ্ট সময়ে স্বাভাবিক ও নিয়মিত ক্ষুধা পায়'
      },
      {
        value: 'vishamagni',
        label_en: 'Highly irregular; ravenous one day, no appetite the next',
        label_bn: 'অত্যন্ত অনিয়মিত; কোনোদিন অনেক ক্ষুধা আবার কোনোদিন ক্ষুধাই লাগে না'
      },
      {
        value: 'tikshnagni',
        label_en: 'Intense, sharp, ravenous; cannot tolerate missing or delaying meals',
        label_bn: 'তীব্র ও অসহ্য ক্ষুধা; খাবার সামান্য দেরি হলেই বুক জ্বলে বা খিটখিটে লাগে'
      },
      {
        value: 'mandagni',
        label_en: 'Poor, weak, sluggish; rarely feels true hunger',
        label_bn: 'খুবই কম ক্ষুধা; খাওয়ার স্বাভাবিক আগ্রহ থাকে না বললেই চলে'
      }
    ]
  },
  {
    id: 'agni_post_meal_feel',
    question_en: 'How do you feel 1 to 2 hours after a standard balanced meal?',
    question_bn: 'স্বাভাবিক খাবারের ১ থেকে ২ ঘণ্টা পর কেমন বোধ হয়?',
    options: [
      {
        value: 'samagni',
        label_en: 'Comfortable, energized, light, clean digestion',
        label_bn: 'স্বাভাবিক, সতেজ, হালকা এবং স্বস্তিদায়ক হজম'
      },
      {
        value: 'vishamagni',
        label_en: 'Bloated, gassy, abdominal cramps, variable distension',
        label_bn: 'পেট ফাঁপা, গ্যাস, পেটে মোচড় দেওয়া বা অস্বস্তি'
      },
      {
        value: 'tikshnagni',
        label_en: 'Burning in stomach, acid regurgitation, excessive thirst',
        label_bn: 'পেটে ও বুকে জ্বালাপোড়া, টক ঢেকুর বা অতিরিক্ত পানির পিপাসা'
      },
      {
        value: 'mandagni',
        label_en: 'Heavy, sluggish, sleepy, food sits like a brick for hours',
        label_bn: 'পেটে পাথর জমে থাকার মতো ভারী ভাব, তীব্র আলস্য ও ঘুম ভাব'
      }
    ]
  },
  {
    id: 'agni_bowel_evacuation',
    question_en: 'What is your primary morning bowel evacuation characteristic?',
    question_bn: 'সকালে মলত্যাগের প্রধান বৈশিষ্ট্য কোনটি?',
    options: [
      {
        value: 'samagni',
        label_en: 'Daily smooth evacuation in morning, well-formed, floating',
        label_bn: 'প্রতিদিন সকালে সহজে ও স্বাভাবিকভাবে মল পরিষ্কার হওয়া'
      },
      {
        value: 'vishamagni',
        label_en: 'Dry, hard, irregular pellets, alternating with soft days',
        label_bn: 'শুষ্ক, শক্ত বা অনিয়মিত কোষ্ঠকাঠিন্য'
      },
      {
        value: 'tikshnagni',
        label_en: 'Loose, urgent, burning, frequent (2-3 times/day)',
        label_bn: 'নরম, দ্রুত বেগ আসা, মলদ্বারে জ্বালাপোড়া বা দিনে একাধিকবার'
      },
      {
        value: 'mandagni',
        label_en: 'Sticky, heavy, mucousy, incomplete sensation, slow transit',
        label_bn: 'আঠালো, ভারী, মিউকাসযুক্ত বা পেট পুরোপুরি পরিষ্কার না হওয়ার অনুভূতি'
      }
    ]
  },
  {
    id: 'agni_tongue_coating',
    question_en: 'What does your tongue look like upon waking in the morning?',
    question_bn: 'সকালে ঘুম থেকে ওঠার পর আপনার জিহ্বার অবস্থা কেমন থাকে?',
    options: [
      {
        value: 'samagni',
        label_en: 'Clean, pink, moist with negligible or no coating',
        label_bn: 'পরিষ্কার, গোলাপি ও আর্দ্র (কোনো সাদা প্রলেপ নেই)'
      },
      {
        value: 'vishamagni',
        label_en: 'Dry, cracked, thin brown or patchy white coating',
        label_bn: 'শুষ্ক, ফাটা ফাটা বা পাতলা খসখসে সাদা প্রলেপ'
      },
      {
        value: 'tikshnagni',
        label_en: 'Red, inflamed, yellowish or orange coating, red papillae',
        label_bn: 'লালচে, জিহ্বার ডগা লাল বা হালকা হলুদ আস্তরণ'
      },
      {
        value: 'mandagni',
        label_en: 'Thick white greasy coating, tooth marks on sides (high Ama)',
        label_bn: 'পুরু সাদা আঠালো আস্তরণ ও জিহ্বার পাশে দাঁতের দাগ (আম সঞ্চয়)'
      }
    ]
  }
];

export function calculateAgni(answers: Record<string, AgniClassification>): AgniAssessmentResult {
  const tally: Record<AgniClassification, number> = {
    samagni: 0,
    vishamagni: 0,
    tikshnagni: 0,
    mandagni: 0
  };

  const supporting: string[] = [];

  for (const q of AGNI_QUESTIONS) {
    const ans = answers[q.id];
    if (ans && tally[ans] !== undefined) {
      tally[ans]++;
      supporting.push(`${q.id}:${ans}`);
    }
  }

  let topType: AgniClassification = 'samagni';
  let maxCount = -1;

  for (const [type, count] of Object.entries(tally) as [AgniClassification, number][]) {
    if (count > maxCount) {
      maxCount = count;
      topType = type;
    }
  }

  const meta: Record<AgniClassification, {
    name_en: string;
    name_bn: string;
    summary_en: string;
    summary_bn: string;
  }> = {
    samagni: {
      name_en: 'Samagni (Balanced Digestive Fire)',
      name_bn: 'সমাগ্নি (সুষম ও স্বাভাবিক পরিপাক অগ্নি)',
      summary_en: 'Metabolic equilibrium. Food is digested properly within optimal physiological transit time without gas, acidity, or heaviness.',
      summary_bn: 'মেটাবলিক ভারসাম্য। গ্যাস, এসিডিটি বা পেটে ভারী ভাব ছাড়াই স্বাভাবিক সময়ে খাদ্য সম্পূর্ণ পরিপাক ও আত্মীকরণ হয়।'
    },
    vishamagni: {
      name_en: 'Vishamagni (Irregular / Variable Digestive Fire)',
      name_bn: 'বিষমাগ্নি (অনিয়মিত ও অস্থির পরিপাক অগ্নি)',
      summary_en: 'Vata-disturbed digestion. Fluctuation between strong appetite and total anorexia, accompanied by abdominal distension and constipation.',
      summary_bn: 'বায়ু বা বাত দোষের প্রভাবে অনিয়মিত পরিপাক। কখনো তীব্র ক্ষুধা আবার কখনো অজীর্ণ, সঙ্গে পেট ফাঁপা ও কোষ্ঠকাঠিন্য।'
    },
    tikshnagni: {
      name_en: 'Tikshnagni (Hyperactive / Fiery Digestion)',
      name_bn: 'তীক্ষ্ণাগ্নি (অতিরিক্ত তীব্র ও দাহক পরিপাক অগ্নি)',
      summary_en: 'Pitta-dominated hyper-metabolism. Rapid transit, acid regurgitation, heartburn, tissue burning, and urgent loose bowel movements.',
      summary_bn: 'পিত্তের আধিক্যে অতিরিক্ত তীব্র হজম প্রক্রিয়া। বুকজ্বালা, টক ঢেকুর, দ্রুত খাদ্য নিষ্কাশন ও পাতলা পায়খানার প্রবণতা।'
    },
    mandagni: {
      name_en: 'Mandagni (Hypoactive / Sluggish Digestion)',
      name_bn: 'মন্দাগ্নি (ধীর ও দুর্বল পরিপাক অগ্নি)',
      summary_en: 'Kapha-dominated metabolic sluggishness. Delayed gastric emptying, low appetite, persistent abdominal heaviness, and metabolic toxin (Ama) accumulation.',
      summary_bn: 'কফ দোষের আধিক্যে ধীরগতির হজম। দুর্বল ক্ষুধা, দীর্ঘক্ষণ পেট ভারী থাকা, বদহজম এবং শরীরে আম (টক্সিন) সঞ্চয়।'
    }
  };

  const sel = meta[topType];

  return {
    type: topType,
    name_en: sel.name_en,
    name_bn: sel.name_bn,
    clinical_summary_en: sel.summary_en,
    clinical_summary_bn: sel.summary_bn,
    supporting_answers: supporting
  };
}
