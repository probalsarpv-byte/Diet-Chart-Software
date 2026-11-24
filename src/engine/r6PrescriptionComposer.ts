/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Phase R6: Master Prescription Composer Engine
 * 
 * Clinical Principles:
 * 1. 6-Column Chronological Medication & Supplementation Protocol.
 * 2. Multi-dose chronological expansion with unknown timing safeguards.
 * 3. 7-Food-Group Metabolic Traffic Light Dietary Guide.
 * 4. Dynamic Multi-Day Diet Chart with 3-5+ meals and fasting support.
 * 5. Authentic Bangladeshi Food Exchange Guide (Bati, Cup, Glass, Spoon, Piece, Palm).
 * 6. Evidence-governed fasting safety (Hypoglycemia protection for Insulin & Secretagogues).
 * 7. Lifestyle, Exercise, Sleep & Hydration support integration.
 * 8. Professional A4 release eligibility verification and gating.
 */

import { 
  PatientProfile, 
  ClinicalVisit, 
  WeeklyDietPlan, 
  DietChartMeal,
  FoodItem,
  SevenFoodGroupCategory,
  StructuredTrafficLightGuide
} from '../types';
import { R5MedicationRecord } from '../types/r5Systems';
import { 
  R6PrescriptionMasterPayload, 
  MedicationProtocolRow, 
  FoodExchangeRule, 
  FastingSafetyEvaluation 
} from '../types/r6Prescription';
import { 
  buildStructuredTrafficLightGuide, 
  validateReportReleaseEligibility 
} from './reports/dualReportEngine';
import { CLINICAL_PHASES } from './phaseProgression';

/**
 * Standard Bangladeshi Food Exchange Definitions with Local Household Measures
 */
export const STANDARD_BANGLADESHI_EXCHANGES: FoodExchangeRule[] = [
  {
    exchange_group: 'grains',
    title_bn: 'শস্য ও কার্বোহাইড্রেট এক্সচেঞ্জ',
    title_en: 'Grains & Carbohydrate Exchange',
    household_measure_bn: '১/২ কাপ রান্না ভাত অথবা ১টি মাঝারি লাল আটার রুটি',
    household_measure_en: '1/2 cup cooked rice or 1 medium whole wheat roti',
    standard_raw_weight_g: 30,
    standard_cooked_weight_g: 80,
    local_measure_unit: 'cup',
    raw_to_cooked_conversion_note_bn: 'কাঁচা চাল ৩০ গ্রাম রান্না করলে প্রায় ৮০ গ্রাম (১/২ কাপ) ভাত হয়। কাঁচা আটা ৩০ গ্রামে ১টি মাঝারি রুটি তৈরি হয়।',
    raw_to_cooked_conversion_note_en: '30g raw rice yields approximately 80g (1/2 cup) cooked rice. 30g whole wheat flour yields 1 medium roti.',
    common_examples_bn: ['লাল চালের ভাত', 'লাল আটার রুটি', 'চিঁড়া (১/২ কাপ)', 'মুড়ি (১ কাপ)', 'রোল্ড ওটস (৩০ গ্রাম কাঁচা)'],
    common_examples_en: ['Brown/Parboiled Rice', 'Whole Wheat Roti', 'Flattened Rice (Chira)', 'Puffed Rice (Muri)', 'Rolled Oats']
  },
  {
    exchange_group: 'proteins',
    title_bn: 'প্রোটিন (মাছ, মাংস, ডিম ও ডাল) এক্সচেঞ্জ',
    title_en: 'Protein (Fish, Meat, Poultry, Legumes) Exchange',
    household_measure_bn: '১টি মুরগির ডিম অথবা ১ মাঝারি টুকরো মাছ অথবা ১/২ বাটি ঘন ডাল',
    household_measure_en: '1 whole egg or 1 medium piece fish or 1/2 bati thick dal',
    standard_raw_weight_g: 30,
    standard_cooked_weight_g: 45,
    local_measure_unit: 'piece',
    raw_to_cooked_conversion_note_bn: 'কাঁচা মাছ/মাংস ৬০ গ্রাম রান্না করলে প্রায় ৪০-৪৫ গ্রাম হয় (পানির ওজন হ্রাস পায়)। কাঁচা ডাল ২৫-৩০ গ্রাম রান্নায় প্রায় ১০০ গ্রাম (১/২ বাটি) ঘন ডাল তৈরি হয়।',
    raw_to_cooked_conversion_note_en: '60g raw fish/meat cooks down to ~40-45g. 25-30g raw lentils yields ~100g (1/2 bati) cooked thick dal.',
    common_examples_bn: ['দেশি রুই/কাতল মাছ (১ টুকরো)', 'চিংড়ি/ছোট মাছ (১/২ বাটি)', 'মুরগির বুকের মাংস (১ মাঝারি টুকরো)', 'সেদ্ধ ডিম (১টি)', 'মসুর/মুগ ডাল (১/২ বাটি)'],
    common_examples_en: ['Carp/Rohu Fish (1 piece)', 'Small Local Fish (1/2 bati)', 'Chicken Breast (1 piece)', 'Boiled Egg (1 whole)', 'Lentil/Moong Dal (1/2 bati)']
  },
  {
    exchange_group: 'proteins',
    title_bn: 'প্রোটিনের হাতের তালু পরিমাপ (Palm Portion)',
    title_en: 'Protein Palm Portion Exchange',
    household_measure_bn: '১টি হাতের তালুর সমান রান্না মাছ বা চামড়াহীন মুরগি (~৮০-১০০ গ্রাম)',
    household_measure_en: '1 palm-sized cooked fish or skinless poultry (~80-100g)',
    standard_raw_weight_g: 100,
    standard_cooked_weight_g: 80,
    local_measure_unit: 'palm',
    raw_to_cooked_conversion_note_bn: 'হাতের তালুর পরিমাপ (আঙুল ব্যতীত) প্রায় ৮০-১০০ গ্রাম রান্না মাংস/মাছের সমান, যা উচ্চমানের জৈব প্রোটিন সরবরাহ করে।',
    raw_to_cooked_conversion_note_en: 'A palm-sized cooked portion (excluding fingers) provides approximately 80 to 100 grams cooked serving yielding rich biological value protein.',
    common_examples_bn: ['মাছের পেটি/গাদা', 'মুরগির বুকের মাংস', 'টোকু/পনিরের পুরু টুকরো'],
    common_examples_en: ['Fish Fillet', 'Chicken Breast', 'Tofu/Paneer Slices']
  },
  {
    exchange_group: 'vegetables',
    title_bn: 'শাকসবজি এক্সচেঞ্জ (নন-স্টার্চি)',
    title_en: 'Non-Starchy Vegetables & Greens Exchange',
    household_measure_bn: '১ মাঝারি বাটি রান্না সবজি অথবা ১/২ বাটি রান্না শাক',
    household_measure_en: '1 medium bati cooked vegetables or 1/2 bati cooked greens',
    standard_raw_weight_g: 100,
    standard_cooked_weight_g: 150,
    local_measure_unit: 'bati',
    raw_to_cooked_conversion_note_bn: 'কাঁচা শাক ১৫০ গ্রাম রান্না করলে পানি কমে ৫০-৬০ গ্রাম (১/২ বাটি) হয়। কাঁচা পেঁপে/লাউ/পটল ১০০ গ্রাম রান্নায় প্রায় ১৫০ গ্রাম সবজি হয়।',
    raw_to_cooked_conversion_note_en: '150g raw leafy greens reduces to ~50-60g (1/2 bati). 100g raw gourds yields ~150g cooked vegetables.',
    common_examples_bn: ['লাউ', 'পেঁপে', 'পটল', 'ঢ্যাঁড়শ', 'করলা', 'লাল শাক', 'পালং শাক', 'ঝিঙে'],
    common_examples_en: ['Bottle Gourd', 'Green Papaya', 'Pointed Gourd (Potol)', 'Okra', 'Bitter Gourd', 'Red Amaranth (Lal Shak)', 'Spinach']
  },
  {
    exchange_group: 'fruits',
    title_bn: 'ফলমূল এক্সচেঞ্জ',
    title_en: 'Fruit Exchange',
    household_measure_bn: '১টি মাঝারি পেয়ারা অথবা ১/২ কাপ কাটা দেশি ফল',
    household_measure_en: '1 medium guava or 1/2 cup sliced local fruit',
    standard_raw_weight_g: 100,
    standard_cooked_weight_g: 100,
    local_measure_unit: 'piece',
    raw_to_cooked_conversion_note_bn: 'ফল সবসময় তাজা ও গোটা অবস্থায় খাওয়া শ্রেয়; জুস না করে আশঁসহ চিবিয়ে খাওয়া রক্তে শর্করা নিয়ন্ত্রণে সহায়ক।',
    raw_to_cooked_conversion_note_en: 'Fruits should always be eaten fresh and whole with fiber; avoiding juice prevents rapid glycemic spikes.',
    common_examples_bn: ['সবুজ পেয়ারা (১টি মাঝারি)', 'আমলকী (২-৩টি)', 'কাঁচা-পাকা পেঁপে (১/২ কাপ)', 'কমলা/মাল্টা (১টি মাঝারি)', 'আপেল (১টি ছোট)'],
    common_examples_en: ['Green Guava (1 medium)', 'Amla (2-3 pcs)', 'Papaya slices (1/2 cup)', 'Orange/Malta (1 medium)', 'Green Apple (1 small)']
  },
  {
    exchange_group: 'dairy',
    title_bn: 'দুগ্ধজাত ও প্রোবায়োটিক এক্সচেঞ্জ',
    title_en: 'Dairy & Probiotic Exchange',
    household_measure_bn: '১ গ্লাস (২০০ মিলি) ঘরে পাতা টকদই অথবা পাতলা লো-ফ্যাট দুধ',
    household_measure_en: '1 glass (200 ml) homemade plain sour yogurt or skim milk',
    standard_raw_weight_g: 200,
    standard_cooked_weight_g: 200,
    local_measure_unit: 'glass',
    raw_to_cooked_conversion_note_bn: 'মিষ্টি দই সম্পূর্ণ বর্জনীয়। টকদই সরাসরি অথবা ১ চিমটি বিট লবণ ও পুদিনা পাতা মিশিয়ে ঘোল/বোরহানি আকারে গ্রহণ করা যায়।',
    raw_to_cooked_conversion_note_en: 'Sweet yogurt is strictly avoided. Plain curd can be eaten directly or whisked into mint buttermilk.',
    common_examples_bn: ['ঘরে পাতা মিষ্টিহীন টকদই', 'লো-ফ্যাট গরুর দুধ', 'তাজা ছানা (৩০ গ্রাম)'],
    common_examples_en: ['Homemade Plain Sour Curd', 'Low-fat Cow Milk', 'Fresh Cottage Cheese (Chhena, 30g)']
  },
  {
    exchange_group: 'fats_oils',
    title_bn: 'স্বাস্থ্যকর ফ্যাট ও তেল এক্সচেঞ্জ',
    title_en: 'Healthy Fats, Seeds & Oils Exchange',
    household_measure_bn: '১ চা চামচ (৫ মিলি) সরিষার তেল/ঘি অথবা ১ মুঠো বাদাম/বীজ',
    household_measure_en: '1 tsp (5 ml) mustard oil/ghee or 1 small handful nuts/seeds',
    standard_raw_weight_g: 5,
    standard_cooked_weight_g: 5,
    local_measure_unit: 'spoon',
    raw_to_cooked_conversion_note_bn: '১ চা চামচ সমান ৫ গ্রাম তেল। রান্নার তেল কখনোই পুনর্বার গরম করে ব্যবহার করা যাবে না। বাদাম কাঁচা বা শুকনো তাওয়ায় ভেজে সেব্য।',
    raw_to_cooked_conversion_note_en: '1 tsp equals 5g oil. Never reuse reheated cooking oil. Nuts should be eaten raw or dry-roasted.',
    common_examples_bn: ['ঘানিভাঙ্গা সরিষার তেল (১ চা চামচ)', 'খাঁটি দেশি ঘি (১ চা চামচ)', 'চিনাবাদাম/কাঠবাদাম (১০-১২টি)', 'চিয়া সিড (১ চা চামচ)'],
    common_examples_en: ['Cold-pressed Mustard Oil (1 tsp)', 'Pure Ghee (1 tsp)', 'Peanuts/Almonds (10-12 pcs)', 'Chia Seeds (1 tsp)']
  }
];

/**
 * Formats time string into Bengali and English time of day displays
 */
function formatTimeDisplays(timeStr: string): { time_bn: string; time_en: string } {
  if (!timeStr || timeStr === 'UNKNOWN') {
    return {
      time_bn: 'সময় অনির্ধারিত (ক্লিনিক্যাল নির্দেশনা আবশ্যক)',
      time_en: 'UNKNOWN (Timing Requires Clinician Order)'
    };
  }

  const parts = timeStr.split(':');
  if (parts.length < 2) {
    return { time_bn: timeStr, time_en: timeStr };
  }

  const hours = parseInt(parts[0], 10);
  const mins = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const timeEn = `${displayHours}:${mins} ${ampm} (${timeStr})`;

  let periodBn = 'সকাল';
  if (hours >= 12 && hours < 16) periodBn = 'দুপুর';
  else if (hours >= 16 && hours < 19) periodBn = 'বিকাল';
  else if (hours >= 19 && hours <= 23) periodBn = 'রাত';
  else if (hours >= 0 && hours < 6) periodBn = 'ভোর';

  // Bangla digits converter
  const toBnDigits = (n: number | string) =>
    String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)]);

  const timeBn = `${periodBn} ${toBnDigits(displayHours)}:${toBnDigits(mins)}`;
  return { time_bn: timeBn, time_en: timeEn };
}

/**
 * Maps relationship to meals to clinical instructions
 */
function getMealInstruction(relation?: string): { bn: string; en: string } {
  switch (relation) {
    case 'before_meal':
      return {
        bn: 'খাবার গ্রহণের ৩০ মিনিট পূর্বে সেব্য।',
        en: 'Take 30 minutes before meal.'
      };
    case 'with_meal':
      return {
        bn: 'খাবারের সাথে অথবা খাবার শেষ করার পরপরই সেব্য।',
        en: 'Take with meal or immediately after eating.'
      };
    case 'after_meal':
      return {
        bn: 'খাবারের ৩০ মিনিট পর সেব্য।',
        en: 'Take 30 minutes after meal.'
      };
    case 'empty_stomach':
      return {
        bn: 'সকালে সম্পূর্ণ খালি পেটে ১ গ্লাস বিশুদ্ধ পানির সাথে সেব্য।',
        en: 'Take on empty stomach with a full glass of water.'
      };
    case 'bedtime':
      return {
        bn: 'রাতে ঘুমানোর পূর্বে সেব্য।',
        en: 'Take at bedtime.'
      };
    default:
      return {
        bn: 'চিকিৎসকের পরামর্শ অনুযায়ী সেব্য।',
        en: 'Take as directed by clinician.'
      };
  }
}

function formatBanglaDosage(dose?: string, unit?: string): string {
  if (!dose || dose.trim() === '') return 'ডোজ অনির্ধারিত (Dose Pending)';
  let full = dose.trim();
  if (unit && !full.toLowerCase().includes(unit.toLowerCase())) {
    full = `${full} ${unit}`.trim();
  }
  const digits = full.replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)]);
  return digits
    .replace(/\bmg\b/gi, 'মিগ্রা')
    .replace(/\bmcg\b/gi, 'মাইক্রোগ্রাম')
    .replace(/\bkg\b/gi, 'কেজি')
    .replace(/\bg\b/gi, 'গ্রাম')
    .replace(/\bml\b/gi, 'মিলি')
    .replace(/\btab(?:let)?s?\b/gi, 'ট্যাবলেট')
    .replace(/\bcap(?:sule)?s?\b/gi, 'ক্যাপসুল')
    .replace(/\bdrop[s]?\b/gi, 'ড্রপ')
    .replace(/\bunit[s]?\b/gi, 'ইউনিট');
}

function formatEnglishDosage(dose?: string, unit?: string): string {
  if (!dose || dose.trim() === '') return 'Dose Pending';
  const trimmed = dose.trim();
  if (unit && !trimmed.toLowerCase().includes(unit.toLowerCase())) {
    return `${trimmed} ${unit}`.trim();
  }
  return trimmed;
}

/**
 * Module 5: 6-Column Chronological Medication & Supplementation Protocol Composer
 */
export function compose6ColumnMedicationProtocol(
  medications: R5MedicationRecord[] = [],
  supplements: any[] = [],
  candidateSupplements: any[] = []
): {
  columns: [
    'সময় (Time Sequence)',
    'ওষুধ/সাপ্লিমেন্ট (ব্র্যান্ড)',
    'জেনেরিক নাম (Generic)',
    'ডোজ ও পরিমাণ (Dosage)',
    'Duration',
    'ক্লিনিক্যাল নির্দেশনা'
  ];
  active_rows: MedicationProtocolRow[];
  draft_candidates: MedicationProtocolRow[];
} {
  const activeRows: MedicationProtocolRow[] = [];
  const draftCandidates: MedicationProtocolRow[] = [];

  // 1. Process Prescribed Medications
  for (const med of medications) {
    const adminTimes = (med.administration_times && med.administration_times.length > 0)
      ? med.administration_times
      : ['UNKNOWN'];

    const mealNote = getMealInstruction(med.relationship_to_meals);
    const brandDisplay = med.brand_name || med.generic_name;
    const doseEn = formatEnglishDosage(med.prescribed_dose, med.dose_unit);
    const doseBn = formatBanglaDosage(med.prescribed_dose, med.dose_unit);

    for (let i = 0; i < adminTimes.length; i++) {
      const time = adminTimes[i];
      const timeDisplays = formatTimeDisplays(time);
      const isUnknown = time === 'UNKNOWN' || Boolean(med.is_timing_unknown);

      const row: MedicationProtocolRow = {
        id: `${med.id}_dose_${i + 1}`,
        sequence_time: time,
        sequence_time_bn: timeDisplays.time_bn,
        sequence_time_en: timeDisplays.time_en,
        brand_name: brandDisplay,
        generic_name: med.generic_name,
        dosage_display_en: doseEn,
        dosage_display_bn: doseBn,
        duration_en: 'Ongoing / Long-term',
        duration_bn: 'চলমান (দীর্ঘমেয়াদী)',
        clinical_instructions_en: isUnknown 
          ? `TIMING REQUIRES REVIEW: Prescribed administration time not recorded. ${mealNote.en}`
          : mealNote.en,
        clinical_instructions_bn: isUnknown 
          ? `সময় নির্ধারণ প্রয়োজন: গ্রহণের সুনির্দিষ্ট সময় নথিভুক্ত হয়নি। ${mealNote.bn}`
          : mealNote.bn,
        item_type: 'medication',
        approval_status: 'prescribed_approved',
        relationship_to_meals: med.relationship_to_meals,
        requires_clinician_verification: isUnknown
      };
      activeRows.push(row);
    }
  }

  // 2. Process Approved Supplements
  for (const supp of supplements) {
    if (supp.approval_status === 'approved' || supp.is_approved === true) {
      const time = supp.administration_time || supp.timing || '09:00';
      const timeDisplays = formatTimeDisplays(time);
      const row: MedicationProtocolRow = {
        id: supp.id || `supp_${Math.random()}`,
        sequence_time: time,
        sequence_time_bn: timeDisplays.time_bn,
        sequence_time_en: timeDisplays.time_en,
        brand_name: supp.brand_name || supp.name || supp.title_bn,
        generic_name: supp.generic_name || supp.name_en || supp.elemental_form || supp.name,
        dosage_display_en: supp.dosage || supp.dose || 'As directed',
        dosage_display_bn: supp.dosage_bn || supp.dosage || 'নির্দেশিত মাত্রায়',
        duration_en: supp.duration_weeks ? `${supp.duration_weeks} weeks` : 'Continuous',
        duration_bn: supp.duration_weeks ? `${supp.duration_weeks} সপ্তাহ` : 'চলমান',
        clinical_instructions_en: supp.instructions_en || 'Take as advised with meals.',
        clinical_instructions_bn: supp.instructions_bn || 'খাবারের সাথে নির্দেশিত মাত্রায় সেব্য।',
        item_type: 'supplement',
        approval_status: 'prescribed_approved'
      };
      activeRows.push(row);
    } else {
      // Draft / Candidate Supplements
      const row: MedicationProtocolRow = {
        id: supp.id || `cand_supp_${Math.random()}`,
        sequence_time: 'UNKNOWN',
        sequence_time_bn: 'খসড়া প্রস্তাবনা (অনুমোদন সাপেক্ষ)',
        sequence_time_en: 'Draft Candidate (Pending Approval)',
        brand_name: supp.brand_name || supp.name || supp.title_bn,
        generic_name: supp.generic_name || supp.name_en || supp.elemental_form || supp.name,
        dosage_display_en: supp.dosage || 'Candidate dose',
        dosage_display_bn: supp.dosage_bn || supp.dosage || 'প্রস্তাবিত মাত্রা',
        duration_en: 'Review required',
        duration_bn: 'ক্লিনিক্যাল অনুমোদন প্রয়োজন',
        clinical_instructions_en: supp.clinical_rationale || 'Candidate micronutrient intervention pending clinician sign-off.',
        clinical_instructions_bn: supp.clinical_rationale_bn || 'চিকিৎসক কর্তৃক অনুমোদনের অপেক্ষায় খসড়া পুষ্টি উপাদান।',
        item_type: 'candidate_supplement',
        approval_status: 'draft_candidate',
        requires_clinician_verification: true
      };
      draftCandidates.push(row);
    }
  }

  // 3. Process Explicit Candidate Supplements
  for (const cand of candidateSupplements) {
    const row: MedicationProtocolRow = {
      id: cand.id || `cand_${Math.random()}`,
      sequence_time: 'UNKNOWN',
      sequence_time_bn: 'খসড়া প্রস্তাবনা (অনুমোদন সাপেক্ষ)',
      sequence_time_en: 'Draft Candidate (Pending Approval)',
      brand_name: cand.name_bn || cand.name || 'সাপ্লিমেন্ট প্রার্থী',
      generic_name: cand.name_en || cand.name || 'Candidate Supplement',
      dosage_display_en: cand.dosage || 'Candidate dose',
      dosage_display_bn: cand.dosage_bn || cand.dosage || 'প্রস্তাবিত মাত্রা',
      duration_en: 'Clinician confirmation required',
      duration_bn: 'ক্লিনিক্যাল অনুমোদন প্রয়োজন',
      clinical_instructions_en: cand.clinical_rationale || cand.instructions || 'Identified candidate supplement; requires licensed clinician verification.',
      clinical_instructions_bn: cand.clinical_rationale_bn || cand.instructions_bn || 'ওষুধের ঘাটতি বা ল্যাব রিপোর্টের ভিত্তিতে প্রস্তাবিত; চিকিৎসকের যাচাইকরণ প্রয়োজন।',
      item_type: 'candidate_supplement',
      approval_status: 'draft_candidate',
      requires_clinician_verification: true
    };
    draftCandidates.push(row);
  }

  // 4. Sort Chronologically
  activeRows.sort((a, b) => {
    if (a.sequence_time === 'UNKNOWN') return 1;
    if (b.sequence_time === 'UNKNOWN') return -1;
    return a.sequence_time.localeCompare(b.sequence_time);
  });

  return {
    columns: [
      'সময় (Time Sequence)',
      'ওষুধ/সাপ্লিমেন্ট (ব্র্যান্ড)',
      'জেনেরিক নাম (Generic)',
      'ডোজ ও পরিমাণ (Dosage)',
      'Duration',
      'ক্লিনিক্যাল নির্দেশনা'
    ],
    active_rows: activeRows,
    draft_candidates: draftCandidates
  };
}

/**
 * Module 3: Fasting Safety Evaluator
 * Enforces hypoglycemia safeguards for Insulin and Sulfonylurea therapies
 */
export function evaluateFastingSafety(
  fastingSchedule: {
    is_fasting?: boolean;
    fasting_schedule?: string;
    eating_window_start?: string;
    eating_window_end?: string;
    planned_fasting_hours?: number;
  } | undefined,
  medications: R5MedicationRecord[] = [],
  insulinActive: boolean = false
): FastingSafetyEvaluation {
  const isFasting = Boolean(fastingSchedule?.is_fasting);
  const protocol = (fastingSchedule?.fasting_schedule as any) || (isFasting ? '12_12' : 'none');

  let hours = 12;
  if (protocol === '14_10') hours = 14;
  else if (protocol === '16_8') hours = 16;
  else if (fastingSchedule?.planned_fasting_hours) hours = fastingSchedule.planned_fasting_hours;

  if (!isFasting || protocol === 'none') {
    return {
      is_fasting_prescribed: false,
      fasting_protocol: 'none',
      fasting_hours: 0,
      is_safe_for_medication_regimen: true,
      safety_warnings_bn: [],
      safety_warnings_en: []
    };
  }

  const warningsBn: string[] = [];
  const warningsEn: string[] = [];
  let isSafe = true;

  // Check for Insulin or Sulfonylurea therapy
  const secretagogueKeywords = ['glimepiride', 'gliclazide', 'glibenclamide', 'glipizide', 'amaryl', 'comprid', 'diaboral', 'diapro'];
  const hasSecretagogue = medications.some(m => {
    const text = `${m.generic_name} ${m.brand_name}`.toLowerCase();
    return secretagogueKeywords.some(k => text.includes(k));
  });

  const hasHighRiskHypoTherapy = insulinActive || hasSecretagogue;

  if (hasHighRiskHypoTherapy && hours > 12) {
    isSafe = false;
    warningsBn.push(
      'সতর্কতা: ইনসুলিন বা সালফোনাইলইউরিয়া সেবনরত অবস্থায় চিকিৎসকের নিবিড় পর্যবেক্ষণ ব্যতীত দীর্ঘ উপবাস বা ফাস্টিংয়ে রক্তে বিপজ্জনক মাত্রায় শর্করা হ্রাসের (Hypoglycemia) মারাত্মক ঝুঁকি বিদ্যমান।'
    );
    warningsEn.push(
      'ALERT: Prolonged intermittent fasting (>12h) during active insulin or sulfonylurea therapy carries a severe risk of acute hypoglycemia. Requires endocrinologist supervision.'
    );
  }

  const hypoPrecautionsBn = hasHighRiskHypoTherapy
    ? 'জরুরি হাইপোগ্লাইসেমিয়া নির্দেশনা: মাথা ঘোরা, বুক ধড়ফড়, অতিরিক্ত ঘাম, হাত কাঁপা বা চোখে অন্ধকার দেখলে অবিলম্বে ১৫ গ্রাম দ্রুত শোষণকারী গ্লুকোজ বা মিষ্টি ফলের রস পান করুন এবং রোজা/ফাস্টিং অবিলম্বে ভেঙে ফেলুন।'
    : undefined;

  const hypoPrecautionsEn = hasHighRiskHypoTherapy
    ? 'Hypoglycemia Emergency Protocol: If dizziness, palpitations, trembling, or cold sweats occur, immediately consume 15g fast-acting carbohydrate (fruit juice or glucose) and break the fast.'
    : undefined;

  return {
    is_fasting_prescribed: true,
    fasting_protocol: protocol,
    eating_window_start: fastingSchedule?.eating_window_start || (hours === 16 ? '12:00' : '08:00'),
    eating_window_end: fastingSchedule?.eating_window_end || (hours === 16 ? '20:00' : '20:00'),
    fasting_hours: hours,
    is_safe_for_medication_regimen: isSafe,
    safety_warnings_bn: warningsBn,
    safety_warnings_en: warningsEn,
    hypoglycemia_precautions_bn: hypoPrecautionsBn,
    hypoglycemia_precautions_en: hypoPrecautionsEn
  };
}

/**
 * Module 1 & 8: Master Prescription Composition Engine
 */
export function composeR6Prescription(options: {
  patient: PatientProfile;
  weeklyDietPlan?: WeeklyDietPlan | null;
  dietChart?: DietChartMeal[];
  medications?: R5MedicationRecord[];
  supplements?: any[];
  candidateSupplements?: any[];
  trafficLight?: any;
  visit?: ClinicalVisit | null;
  safetyEvaluation?: any;
  r5NutritionContract?: any;
  isDietPlanDirty?: boolean;
}): R6PrescriptionMasterPayload {
  const {
    patient,
    weeklyDietPlan,
    dietChart = [],
    medications = [],
    supplements = [],
    candidateSupplements = [],
    trafficLight,
    visit,
    safetyEvaluation,
    r5NutritionContract,
    isDietPlanDirty
  } = options;

  const visitId = visit?.visit_id || visit?.id || patient.current_visit_id || 'vis_current';
  const visitDate = visit?.visit_date || patient.visit_date || new Date().toISOString().split('T')[0];
  const phaseInfo = (CLINICAL_PHASES as any)?.[patient.current_phase || 1] || {
    title_en: 'Phase 1: Foundations',
    title_bn: 'পর্যায় ১: ভিত্তি স্থাপন',
    duration_weeks: 'Weeks 1–4'
  };

  // 1. Release Gating
  const eligibility = validateReportReleaseEligibility({
    patient,
    plan: weeklyDietPlan || dietChart,
    weeklyDietPlan,
    visit,
    safetyEvaluation,
    isDietPlanDirty: isDietPlanDirty ?? patient.is_diet_plan_dirty,
    r5NutritionContract
  });

  const isApproved = Boolean(weeklyDietPlan && weeklyDietPlan.status === 'approved' && weeklyDietPlan.is_approved === true);
  const clinicianName = weeklyDietPlan?.approved_by || weeklyDietPlan?.approval_metadata?.clinician_name || 'Unassigned Clinician';

  // 2. Structured 7-Food-Group Guide
  const sevenFoodGroupGuide = buildStructuredTrafficLightGuide(trafficLight);

  // 3. 6-Column Chronological Medication Protocol
  const medicationProtocol = compose6ColumnMedicationProtocol(
    medications,
    supplements,
    candidateSupplements
  );

  // 4. Fasting Safety
  const fastingSchedule = weeklyDietPlan?.fasting_schedule || (dietChart[0] as any)?.fasting_schedule;
  const insulinActive = Boolean(
    r5NutritionContract?.nutrient_constraints?.carbohydrate_consistency_required ||
    medications.some(m => m.generic_name.toLowerCase().includes('insulin'))
  );
  const fastingEvaluation = evaluateFastingSafety(fastingSchedule, medications, insulinActive);

  // 5. Dynamic Diet Chart Days
  const sourceDays = (weeklyDietPlan?.days && weeklyDietPlan.days.length > 0)
    ? weeklyDietPlan.days
    : [{
        day_number: 1,
        day_name_bn: '১ম দিন (দৈনিক প্রেসক্রিপশন)',
        day_name_en: 'Day 1 (Daily Prescription)',
        meals: dietChart,
        safety_decision: 'SAFE',
        summary: {} as any
      }];

  const formattedDays = sourceDays.map(day => {
    let fastingBn: string | undefined = undefined;
    let fastingEn: string | undefined = undefined;
    if (fastingEvaluation.is_fasting_prescribed) {
      fastingBn = `খাবার গ্রহণের সময়: ${fastingEvaluation.eating_window_start} থেকে ${fastingEvaluation.eating_window_end} (${fastingEvaluation.fasting_hours} ঘণ্টার ফাস্টিং)`;
      fastingEn = `Eating Window: ${fastingEvaluation.eating_window_start} – ${fastingEvaluation.eating_window_end} (${fastingEvaluation.fasting_hours}h Fast)`;
    }

    return {
      day_number: day.day_number,
      day_name_bn: day.day_name_bn,
      day_name_en: day.day_name_en,
      fasting_display_bn: fastingBn,
      fasting_display_en: fastingEn,
      meals: day.meals.map(meal => ({
        meal_slot: meal.meal_type,
        title_bn: meal.title_bn,
        title_en: meal.title_en,
        target_time: meal.target_time,
        items: meal.items.map(item => ({
          food_name_bn: item.food_name_bn,
          food_name_en: item.food_name_en,
          raw_serving_weight_g: item.raw_weight_g,
          household_portion_bn: item.cooked_display_bn,
          household_portion_en: item.cooked_display_en,
          preparation_note_bn: item.prep_note_bn || 'স্বাভাবিক পদ্ধতিতে রান্না',
          preparation_note_en: item.prep_note_en || 'Standard preparation',
          alternatives: (item.alternatives || []).slice(0, 3).map(alt => ({
            name_bn: alt.name_bn,
            name_en: alt.name_en,
            portion_bn: alt.cooked_display_bn,
            portion_en: alt.cooked_display_en
          }))
        }))
      }))
    };
  });

  // 6. Safety Directives
  const fluidLimit = patient.fluid_prescription?.total_fluid_limit_ml || patient.clinical_safety?.fluid_restriction?.limit_ml;
  const selectedConditions = (patient.selected_conditions || []) as unknown as string[];
  const isFluidRestricted = Boolean(
    (patient.clinical_safety?.fluid_restriction?.is_restricted) ||
    selectedConditions.includes('ckd_dialysis') ||
    selectedConditions.includes('heart_failure') ||
    (fluidLimit && fluidLimit > 0)
  );

  return {
    prescription_id: `RX_${patient.id}_V${weeklyDietPlan?.version || 1}`,
    schema_version: 'R6.0',
    generated_at: new Date().toISOString(),
    is_approved: isApproved,
    plan_version: weeklyDietPlan?.version || 1,
    is_released: eligibility.isEligible,
    release_eligibility: {
      is_eligible: eligibility.isEligible,
      blocking_reasons_en: eligibility.blockingReasons,
      blocking_reasons_bn: eligibility.blockingReasons_bn
    },
    clinic_header: {
      name_bn: 'শুদ্ধ ক্লিনিক্যাল ফাংশনাল নিউট্রিশন সেন্টার',
      name_en: 'SHUDDHO CLINICAL FUNCTIONAL NUTRITION',
      tagline_bn: 'সেন্টার ফর মেটাবলিক রিবুট ও প্রিসিশন লাইফস্টাইল মেডিসিন',
      tagline_en: 'Center for Metabolic Reboot & Precision Lifestyle Medicine',
      contact: '+880 1700-000000',
      address: 'Dhaka, Bangladesh'
    },
    clinician: {
      name: clinicianName,
      designation_bn: 'ক্লিনিক্যাল ফাংশনাল নিউট্রিশনিস্ট',
      designation_en: 'Clinical Functional Nutritionist',
      license: weeklyDietPlan?.approval_metadata?.license_number || 'REG-CFN-BD',
      signoff_date: weeklyDietPlan?.approved_at?.split('T')[0] || visitDate
    },
    patient: {
      id: patient.id,
      name: patient.name,
      age_display: patient.age > 0 ? `${patient.age}y` : '—',
      gender_display: patient.gender === 'female' ? 'মহিলা (Female)' : 'পুরুষ (Male)',
      visit_id: visitId,
      visit_date: visitDate,
      phase_title: phaseInfo?.title_en || 'Phase 1: Foundations',
      duration_weeks: phaseInfo?.duration_weeks || 'Weeks 1–4',
      followup_date: undefined
    },
    safety_directives: {
      allergies_to_avoid_bn: patient.confirmed_allergies || [],
      allergies_to_avoid_en: patient.confirmed_allergies || [],
      clinical_food_exclusions_bn: patient.clinician_disallowed_foods || [],
      clinical_food_exclusions_en: patient.clinician_disallowed_foods || [],
      fluid_limit_ml: fluidLimit,
      fluid_restriction_active: isFluidRestricted,
      cooking_oil_rules_bn: 'দৈনিক সর্বোচ্চ ৩-৪ চা চামচ (১৫-২০ মিলি) খাঁটি সরিষার তেল বা ঘি। পোড়া তেল বর্জনীয়।',
      cooking_oil_rules_en: 'Maximum 3-4 tsp (15-20 ml) cold-pressed mustard oil or ghee daily. Reheated oil strictly prohibited.',
      salt_rules_bn: 'রান্নায় পরিমিত আয়োডিনযুক্ত লবণ (দৈনিক অনধিক ১ চা চামচ বা ৫ গ্রাম লবণ)। পাতে বাড়তি লবণ সম্পূর্ণ নিষিদ্ধ।',
      salt_rules_en: 'Cook with moderate iodized salt (< 1 tsp / 5g salt per day). Zero added raw table salt.'
    },
    seven_food_group_guide: sevenFoodGroupGuide,
    fasting_evaluation: fastingEvaluation,
    dynamic_diet_chart: {
      total_days: formattedDays.length,
      meal_count_per_day: formattedDays[0]?.meals.length || 0,
      days: formattedDays
    },
    food_exchange_guide: STANDARD_BANGLADESHI_EXCHANGES,
    medication_supplement_protocol: medicationProtocol,
    lifestyle_support: {
      hydration: {
        target_daily_ml: isFluidRestricted ? (fluidLimit || 1500) : 2500,
        instructions_bn: isFluidRestricted 
          ? `তরল গ্রহণের সর্বোচ্চ দৈনিক সীমা ${fluidLimit || 1500} মিলি (চা, পানি ও ঝোল সহ)। মেপে পানি পান করুন।`
          : 'প্রতিদিন ৮-১০ গ্লাস (২.৫ লিটার) বিশুদ্ধ পানি পান করুন। খাবারের ৩০ মিনিট আগে ও পরে পানি পান শ্রেয়।',
        instructions_en: isFluidRestricted 
          ? `Strict total fluid ceiling of ${fluidLimit || 1500} ml/day (including tea, water, soups). Measure intake accurately.`
          : 'Drink 8-10 glasses (2.5L) of filtered water daily. Space hydration 30 min before and after meals.'
      },
      exercise: {
        target_bn: 'প্রতিদিন প্রধান খাবারের পর ১৫-২০ মিনিট ধীরগতির হাঁটা (Postprandial Walk)। সপ্তাহে ১৫০ মিনিট পরিমিত ব্যায়াম।',
        target_en: '15-20 min light post-meal walk after main meals. Target 150 min moderate activity per week.',
        safety_instructions_bn: 'বুকে অস্বস্তি, শ্বাসকষ্ট বা মাথা ঘোরা দেখা দিলে তাৎক্ষণিক ব্যায়াম বন্ধ করুন।',
        safety_instructions_en: 'Stop exercise immediately if chest discomfort, shortness of breath, or dizziness occurs.'
      },
      sleep_circadian: {
        sleep_target_hours: 7.5,
        caffeine_curfew: '14:00',
        dinner_curfew: '20:30',
        instructions_bn: 'রাত ১১:০০ টার মধ্যে ঘুমানো এবং সকাল ০৬:৩০ টায় ওঠা। দুপুর ২:০০ টার পর চা/কফি বর্জনীয় এবং ঘুমানোর ৩ ঘণ্টা পূর্বে রাতের খাবার সম্পন্ন করুন।',
        instructions_en: 'Aim for 7.5h sleep (bedtime 23:00, wake 06:30). Caffeine curfew 14:00; finish dinner 3h before bed.'
      }
    },
    disclaimers: {
      bn: 'ব্যক্তিগতকৃত ক্লিনিক্যাল নিউট্রিশন প্রেসক্রিপশন। শুধুমাত্র লাইসেন্সধারী ক্লিনিক্যাল নিউট্রিশনিস্টের অনুমোদনের পর প্রযোজ্য। নির্দেশিত পরিমাপ ও সময়সূচি যথাযথভাবে অনুসরণ করুন।',
      en: 'Personalized Clinical Nutrition Prescription. Valid only upon approval by a licensed clinical nutritionist. Adhere strictly to prescribed portions and timings.'
    }
  };
}
