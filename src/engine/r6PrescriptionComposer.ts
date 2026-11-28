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
import { R4ProtocolStudioData, SupplementProtocolItem } from '../types/r4Protocol';
import { 
  R6PrescriptionMasterPayload, 
  MedicationProtocolRow, 
  FoodExchangeRule, 
  FastingSafetyEvaluation,
  PatientFoodExchangeItem
} from '../types/r6Prescription';
import { 
  buildStructuredTrafficLightGuide, 
  validateReportReleaseEligibility 
} from './reports/dualReportEngine';
import { CLINICAL_PHASES } from './phaseProgression';
import foodsData from '../data/foods.json';
import { filterAuthorizedPatientAlternatives } from './r8/substitutionEngine';

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
    case 'before_meal_empty_stomach':
      return {
        bn: 'সকালে সম্পূর্ণ খালি পেটে অথবা খাবার গ্রহণের ৩০-৬০ মিনিট পূর্বে সেব্য।',
        en: 'Take on empty stomach 30-60 minutes before meal.'
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
    case 'independent_of_meals':
      return {
        bn: 'খাবারের আগে বা পরে যেকোনো সময় সেব্য।',
        en: 'Take with or without food.'
      };
    case 'unknown':
    default:
      return {
        bn: 'সেবন নির্দেশনা ক্লিনিক্যাল পর্যালোচনা প্রয়োজন।',
        en: 'Administration instructions require clinician confirmation.'
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

export interface MedicationSafetyAssessment {
  classification: 'verified_current' | 'pending_verification' | 'draft_candidate' | 'discontinued' | 'historical' | 'held';
  is_clinician_verified: boolean;
  is_dose_pending: boolean;
  is_timing_unknown: boolean;
  is_prn: boolean;
  requires_clinician_verification: boolean;
  admin_times: string[];
  issues_en: string[];
  issues_bn: string[];
}

/**
 * Single Medication Safety Contract Evaluator
 * Distinguishes current verified, patient-reported/unverified, incomplete dosage,
 * unknown timing, explicit PRN, discontinued, held, and historical medications.
 */
export function evaluateMedicationSafetyContract(med: R5MedicationRecord): MedicationSafetyAssessment {
  const rawStatus = (med.status || 'active').toLowerCase();
  const isHistorical =
    rawStatus === 'historical' ||
    rawStatus === 'completed' ||
    rawStatus === 'past' ||
    Boolean((med as any).is_historical);
  const isDiscontinued =
    rawStatus === 'discontinued' ||
    (med.verification_status as string) === 'discontinued';

  if (isDiscontinued) {
    return {
      classification: 'discontinued',
      is_clinician_verified: false,
      is_dose_pending: false,
      is_timing_unknown: false,
      is_prn: Boolean(med.is_prn),
      requires_clinician_verification: false,
      admin_times: [],
      issues_en: [],
      issues_bn: []
    };
  }

  if (isHistorical) {
    return {
      classification: 'historical',
      is_clinician_verified: false,
      is_dose_pending: false,
      is_timing_unknown: false,
      is_prn: Boolean(med.is_prn),
      requires_clinician_verification: false,
      admin_times: [],
      issues_en: [],
      issues_bn: []
    };
  }

  if (rawStatus === 'held') {
    return {
      classification: 'held',
      is_clinician_verified: false,
      is_dose_pending: false,
      is_timing_unknown: false,
      is_prn: Boolean(med.is_prn),
      requires_clinician_verification: false,
      admin_times: [],
      issues_en: [],
      issues_bn: []
    };
  }

  if (rawStatus === 'draft_candidate') {
    return {
      classification: 'draft_candidate',
      is_clinician_verified: false,
      is_dose_pending: false,
      is_timing_unknown: false,
      is_prn: Boolean(med.is_prn),
      requires_clinician_verification: true,
      admin_times: [],
      issues_en: ['Draft candidate medication awaiting clinician approval'],
      issues_bn: ['খসড়া প্রস্তাবিত ওষুধ — চিকিৎসকের অনুমোদন প্রয়োজন']
    };
  }

  const isClinicianVerified =
    med.verification_status === 'clinician_verified' ||
    (med.verification_status as string) === 'verified_active';

  const rawDose = (med.prescribed_dose || (med as any).dose || '').trim();
  const isDosePending =
    !rawDose ||
    rawDose.toUpperCase() === 'UNKNOWN' ||
    rawDose.toUpperCase() === 'UNSPECIFIED';

  const isPRN = Boolean(med.is_prn);
  const validTimes = (med.administration_times || []).filter(
    t => t && t.trim() !== '' && t.trim().toUpperCase() !== 'UNKNOWN'
  );
  // Explicitly verified PRN medications must not be rejected solely for having no scheduled clock time
  const isTimingUnknown = !isPRN && (Boolean(med.is_timing_unknown) || validTimes.length === 0);
  const adminTimes = isPRN ? ['PRN'] : (isTimingUnknown ? ['UNKNOWN'] : validTimes);

  const issuesEn: string[] = [];
  const issuesBn: string[] = [];

  if (!isClinicianVerified) {
    issuesEn.push(`Unverified verification status (${med.verification_status || 'unverified'}) awaiting clinician reconciliation`);
    issuesBn.push(`অযাচাইকৃত বা রোগী-বর্ণিত ওষুধ (${med.verification_status || 'unverified'}) — চিকিৎসকের যাচাই আবশ্যক`);
  }
  if (rawStatus === 'unknown') {
    issuesEn.push('Medication current active status is unconfirmed');
    issuesBn.push('ওষুধটি বর্তমানে চালু কিনা তা নিশ্চিত নয়');
  }
  if (isDosePending) {
    issuesEn.push('Prescribed medication dosage is missing or unknown');
    issuesBn.push('ওষুধের নির্ধারিত মাত্রা অনুপস্থিত বা অজ্ঞাত');
  }
  if (isTimingUnknown) {
    issuesEn.push('Administration timing is unknown');
    issuesBn.push('ওষুধ গ্রহণের সুনির্দিষ্ট সময় অনির্ধারিত');
  }

  const requiresVerification = issuesEn.length > 0;

  return {
    classification: requiresVerification ? 'pending_verification' : 'verified_current',
    is_clinician_verified: isClinicianVerified,
    is_dose_pending: isDosePending,
    is_timing_unknown: isTimingUnknown,
    is_prn: isPRN,
    requires_clinician_verification: requiresVerification,
    admin_times: adminTimes,
    issues_en: issuesEn,
    issues_bn: issuesBn
  };
}

function sortProtocolRowsChronologically(rows: MedicationProtocolRow[]): void {
  rows.sort((a, b) => {
    if (a.sequence_time === b.sequence_time) return 0;
    const isATime = /^\d{1,2}:\d{2}$/.test(a.sequence_time);
    const isBTime = /^\d{1,2}:\d{2}$/.test(b.sequence_time);
    if (isATime && isBTime) return a.sequence_time.localeCompare(b.sequence_time);
    if (isATime && !isBTime) return -1;
    if (!isATime && isBTime) return 1;

    if (a.sequence_time === 'PRN') return -1;
    if (b.sequence_time === 'PRN') return 1;

    if (a.sequence_time === 'UNKNOWN') return 1;
    if (b.sequence_time === 'UNKNOWN') return -1;

    return a.sequence_time.localeCompare(b.sequence_time);
  });
}

/**
 * Module 5: 6-Column Chronological Medication & Supplementation Protocol Composer
 */
export interface R4AuthorizationResult {
  isAuthorized: boolean;
  reason_en?: string;
  reason_bn?: string;
  hasClinicianApprovedSupplements: boolean;
  isCrossPatientMismatch: boolean;
  isCrossVisitMismatch: boolean;
  isStaleStatus: boolean;
  isHardStop: boolean;
  isInvalidatedOrMissingProvenance: boolean;
}

/**
 * Single Authoritative R4 Protocol Authorization Contract (Checkpoint C)
 * Prevents unapproved drafts, stale/superseded versions, missing provenance,
 * HARD_STOP protocols, cross-patient records, or cross-visit plans from entering
 * active patient prescription instructions.
 */
export function validateR4ProtocolAuthorization(options: {
  r4Protocol?: R4ProtocolStudioData | null;
  standaloneSupplements?: any[];
  patientId?: string;
  visitId?: string;
  isProtocolDirty?: boolean;
}): R4AuthorizationResult {
  const { r4Protocol, standaloneSupplements = [], patientId, visitId, isProtocolDirty } = options;
  const r4Supps = r4Protocol?.supplements || [];
  const hasClinicianApprovedSupplements = [...r4Supps, ...standaloneSupplements].some(
    (s: any) => s?.approval_status === 'clinician_approved' || (s?.approval_status === 'approved' && s?.is_approved === true)
  );

  if (!r4Protocol) {
    return {
      isAuthorized: false,
      reason_en: 'No clinician-approved R4 Protocol Studio record is attached.',
      reason_bn: 'কোনো অনুমোদিত R4 প্রোটোকল রেকর্ড সংযুক্ত নেই।',
      hasClinicianApprovedSupplements,
      isCrossPatientMismatch: false,
      isCrossVisitMismatch: false,
      isStaleStatus: false,
      isHardStop: false,
      isInvalidatedOrMissingProvenance: false
    };
  }

  const isCrossPatientMismatch = Boolean(
    !r4Protocol.patient_id || (patientId && r4Protocol.patient_id !== patientId)
  );

  const hasKnownVisitContext = Boolean(visitId && visitId !== 'vis_current');
  const isCrossVisitMismatch = Boolean(
    (hasKnownVisitContext && (!r4Protocol.visit_id || r4Protocol.visit_id !== visitId)) ||
    (visitId && r4Protocol.visit_id && r4Protocol.visit_id !== visitId)
  );

  const isStaleStatus = r4Protocol.status === 'superseded' || r4Protocol.status === 'archived';
  const isHardStop = Boolean(
    r4Protocol.safety_evaluation?.can_approve === false ||
    r4Protocol.safety_evaluation?.overall_status === 'HARD_STOP'
  );
  const isExplicitlyInvalidated = Boolean(
    (r4Protocol as any).invalidated_at ||
    isProtocolDirty ||
    /invalidated/i.test(r4Protocol.approval_notes || '')
  );
  const hasSignoffMetadata = Boolean(
    r4Protocol.approved_by &&
    r4Protocol.approved_by.trim() !== '' &&
    r4Protocol.approved_at &&
    r4Protocol.approved_at.trim() !== '' &&
    (r4Protocol.version === undefined || r4Protocol.version >= 1)
  );
  const isProtocolApprovedState = Boolean(
    r4Protocol.is_approved === true &&
    r4Protocol.status !== 'draft'
  );
  const isInvalidatedOrMissingProvenance = Boolean(
    isExplicitlyInvalidated ||
    (r4Protocol.is_approved === true && !hasSignoffMetadata) ||
    (!isProtocolApprovedState && Boolean(r4Protocol.previous_approved_version))
  );

  let reason_en: string | undefined;
  let reason_bn: string | undefined;
  if (isCrossPatientMismatch) {
    reason_en = `R4 protocol patient mismatch (${r4Protocol.patient_id || 'missing'} vs ${patientId || 'unknown'}).`;
    reason_bn = 'R4 প্রোটোকলের রোগী শনাক্তকারীর অমিল।';
  } else if (isCrossVisitMismatch) {
    reason_en = `R4 protocol visit mismatch (${r4Protocol.visit_id || 'missing'} vs ${visitId || 'unknown'}).`;
    reason_bn = 'R4 প্রোটোকলের ভিজিট শনাক্তকারীর অমিল।';
  } else if (isStaleStatus) {
    reason_en = `R4 protocol status is ${r4Protocol.status} and cannot supply active instructions.`;
    reason_bn = `R4 প্রোটোকলটি পুরনো বা আর্কাইভকৃত (${r4Protocol.status})।`;
  } else if (isHardStop) {
    reason_en = 'R4 protocol has an unresolved HARD_STOP safety evaluation.';
    reason_bn = 'R4 প্রোটোকলে অমীমাংসিত সেফটি হার্ড স্টপ বিদ্যমান।';
  } else if (isExplicitlyInvalidated || !isProtocolApprovedState || !hasSignoffMetadata) {
    reason_en = 'R4 protocol is unapproved, invalidated, or missing clinician sign-off provenance.';
    reason_bn = 'R4 প্রোটোকলটি অনুমোদিত নয় বা চিকিৎসকের স্বাক্ষর মেটাডাটা অনুপস্থিত।';
  }

  const isAuthorized = Boolean(
    !isCrossPatientMismatch &&
    !isCrossVisitMismatch &&
    !isStaleStatus &&
    !isHardStop &&
    !isExplicitlyInvalidated &&
    isProtocolApprovedState &&
    hasSignoffMetadata
  );

  return {
    isAuthorized,
    reason_en,
    reason_bn,
    hasClinicianApprovedSupplements,
    isCrossPatientMismatch,
    isCrossVisitMismatch,
    isStaleStatus,
    isHardStop,
    isInvalidatedOrMissingProvenance
  };
}

function getSupplementDedupKey(s: any): string {
  const generic = (s?.generic_nutrient || s?.generic_name || s?.name_en || s?.name || '').toString().trim().toLowerCase();
  const form = (s?.chemical_form || '').toString().trim().toLowerCase();
  const time = (s?.administration_time || 'UNKNOWN').toString().trim().toUpperCase();
  if (generic) {
    return `nutrient:${generic}|form:${form}|time:${time}`;
  }
  return s?.id ? `id:${s.id}` : `raw:${JSON.stringify(s)}`;
}

export function compose6ColumnMedicationProtocol(
  medications: R5MedicationRecord[] = [],
  supplements: any[] = [],
  candidateSupplements: any[] = [],
  r4Protocol?: R4ProtocolStudioData | null,
  context?: {
    patientId?: string;
    visitId?: string;
    isProtocolDirty?: boolean;
  }
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
  pending_verification_rows: MedicationProtocolRow[];
  draft_candidates: MedicationProtocolRow[];
  has_unresolved_verification: boolean;
} {
  const activeRows: MedicationProtocolRow[] = [];
  const pendingVerificationRows: MedicationProtocolRow[] = [];
  const draftCandidates: MedicationProtocolRow[] = [];

  // 1. Process Prescribed Medications (Domain 13) via single medication safety contract
  for (const med of medications) {
    const assessment = evaluateMedicationSafetyContract(med);

    // Discontinued, historical, and held medications are strictly excluded from active instructions
    if (
      assessment.classification === 'discontinued' ||
      assessment.classification === 'historical' ||
      assessment.classification === 'held'
    ) {
      continue;
    }

    const brandDisplay = med.brand_name || med.generic_name;
    const rawDose = (med.prescribed_dose || (med as any).dose || '').trim();
    const mealNote = getMealInstruction(med.relationship_to_meals);
    const customInstr = med.prescriber_instructions?.trim();

    // Dose formatting - never convert missing dose to product strength
    const doseEn = assessment.is_dose_pending
      ? 'Dose Pending (Review required)'
      : formatEnglishDosage(rawDose, med.dose_unit);
    const doseBn = assessment.is_dose_pending
      ? 'ডোজ নির্ধারণ বাকি (পর্যালোচনা প্রয়োজন)'
      : formatBanglaDosage(rawDose, med.dose_unit);

    // Duration formatting - unknown duration must remain unknown
    let durationEn = 'Not documented';
    let durationBn = 'অনির্দিষ্ট';
    if (med.duration && med.duration.trim() !== '' && med.duration.trim().toUpperCase() !== 'UNKNOWN') {
      durationEn = med.duration.trim();
      durationBn = med.duration_bn || med.duration.trim();
    } else if (med.duration_weeks) {
      durationEn = `${med.duration_weeks} weeks`;
      durationBn = `${med.duration_weeks} সপ্তাহ`;
    }

    if (assessment.classification === 'draft_candidate') {
      draftCandidates.push({
        id: `${med.id}_draft`,
        sequence_time: 'UNKNOWN',
        sequence_time_bn: 'খসড়া প্রস্তাবনা (অনুমোদন সাপেক্ষ)',
        sequence_time_en: 'Draft Candidate (Pending Approval)',
        brand_name: brandDisplay,
        generic_name: med.generic_name,
        dosage_display_en: doseEn,
        dosage_display_bn: doseBn,
        duration_en: durationEn,
        duration_bn: durationBn,
        clinical_instructions_en: customInstr || 'Draft medication candidate awaiting clinician reconciliation.',
        clinical_instructions_bn: customInstr || 'চিকিৎসক কর্তৃক অনুমোদনের অপেক্ষায় খসড়া ওষুধ।',
        item_type: 'medication',
        approval_status: 'draft_candidate',
        relationship_to_meals: med.relationship_to_meals,
        requires_clinician_verification: true,
        verification_issue_reasons_en: assessment.issues_en,
        verification_issue_reasons_bn: assessment.issues_bn,
        source_verification_status: med.verification_status,
        is_prn: assessment.is_prn,
        source_record_id: med.id
      });
      continue;
    }

    for (let i = 0; i < assessment.admin_times.length; i++) {
      const time = assessment.admin_times[i];
      const timeDisplays = assessment.is_prn
        ? { time_bn: 'প্রয়োজনে (PRN)', time_en: 'PRN (As Needed)' }
        : formatTimeDisplays(time);
      const isRowUnknown = !assessment.is_prn && (time === 'UNKNOWN' || assessment.is_timing_unknown);

      const instrEn = customInstr
        ? (isRowUnknown ? `TIMING REQUIRES REVIEW: ${customInstr}` : customInstr)
        : isRowUnknown
        ? `TIMING REQUIRES REVIEW: Prescribed administration time not recorded. ${mealNote.en}`
        : assessment.is_prn
        ? `PRN / AS NEEDED: ${mealNote.en}`
        : mealNote.en;

      const instrBn = customInstr
        ? (isRowUnknown ? `সময় নির্ধারণ প্রয়োজন: ${customInstr}` : customInstr)
        : isRowUnknown
        ? `সময় নির্ধারণ প্রয়োজন: গ্রহণের সুনির্দিষ্ট সময় নথিভুক্ত হয়নি। ${mealNote.bn}`
        : assessment.is_prn
        ? `প্রয়োজনে সেব্য: ${mealNote.bn}`
        : mealNote.bn;

      const row: MedicationProtocolRow = {
        id: `${med.id}_dose_${i + 1}`,
        sequence_time: time,
        sequence_time_bn: timeDisplays.time_bn,
        sequence_time_en: timeDisplays.time_en,
        brand_name: brandDisplay,
        generic_name: med.generic_name,
        dosage_display_en: doseEn,
        dosage_display_bn: doseBn,
        duration_en: durationEn,
        duration_bn: durationBn,
        clinical_instructions_en: instrEn,
        clinical_instructions_bn: instrBn,
        item_type: 'medication',
        approval_status: assessment.requires_clinician_verification
          ? (assessment.is_clinician_verified ? 'requires_verification' : 'unverified')
          : 'prescribed_approved',
        relationship_to_meals: med.relationship_to_meals,
        requires_clinician_verification: assessment.requires_clinician_verification,
        verification_issue_reasons_en: assessment.issues_en.length > 0 ? assessment.issues_en : undefined,
        verification_issue_reasons_bn: assessment.issues_bn.length > 0 ? assessment.issues_bn : undefined,
        source_verification_status: med.verification_status,
        is_prn: assessment.is_prn,
        source_record_id: med.id
      };

      if (assessment.requires_clinician_verification) {
        pendingVerificationRows.push(row);
      } else {
        activeRows.push(row);
      }
    }
  }

  // 2. Process Approved R4 Supplements (Stage B & Checkpoint C: Strict R4 Authorization & Deduplication)
  const protocolAuth = validateR4ProtocolAuthorization({
    r4Protocol,
    standaloneSupplements: supplements,
    patientId: context?.patientId ?? r4Protocol?.patient_id,
    visitId: context?.visitId,
    isProtocolDirty: context?.isProtocolDirty
  });

  const combinedSupplements: any[] = [];
  const seenSupplementKeys = new Set<string>();
  const seenSupplementIds = new Set<string>();

  const registerSupplementIfUnique = (s: any) => {
    if (!s) return;
    if (s.id && seenSupplementIds.has(s.id)) return;
    const semanticKey = getSupplementDedupKey(s);
    if (seenSupplementKeys.has(semanticKey)) return;
    if (s.id) seenSupplementIds.add(s.id);
    seenSupplementKeys.add(semanticKey);
    combinedSupplements.push(s);
  };

  if (r4Protocol?.supplements && Array.isArray(r4Protocol.supplements)) {
    for (const s of r4Protocol.supplements) {
      registerSupplementIfUnique(s);
    }
  }
  for (const s of supplements) {
    registerSupplementIfUnique(s);
  }

  for (const supp of combinedSupplements) {
    // Strictly omit rejected or discontinued supplements
    if (supp.approval_status === 'rejected' || supp.approval_status === 'discontinued') {
      continue;
    }

    const isItemClinicianApproved =
      supp.approval_status === 'clinician_approved' ||
      (supp.approval_status === 'approved' && supp.is_approved === true);
    const isFullyApproved = protocolAuth.isAuthorized && isItemClinicianApproved;

    if (isFullyApproved) {
      // Approved Supplement -> enters active_rows
      const time = (supp.administration_time && supp.administration_time.trim() !== '' && supp.administration_time !== 'UNKNOWN')
        ? supp.administration_time.trim()
        : 'UNKNOWN'; // Never default to 09:00!
      const timeDisplays = formatTimeDisplays(time);

      let doseEn = 'As directed';
      let doseBn = 'নির্দেশিত মাত্রায়';
      if (supp.elemental_dose_numeric && supp.elemental_dose_unit) {
        doseEn = formatEnglishDosage(`${supp.elemental_dose_numeric}`, supp.elemental_dose_unit);
        doseBn = formatBanglaDosage(`${supp.elemental_dose_numeric}`, supp.elemental_dose_unit);
      } else if (supp.total_compound_dose) {
        doseEn = supp.total_compound_dose;
        doseBn = formatBanglaDosage(supp.total_compound_dose);
      } else if (supp.dosage || supp.dose) {
        doseEn = formatEnglishDosage(supp.dosage || supp.dose);
        doseBn = formatBanglaDosage(supp.dosage || supp.dose);
      }

      // Duration - never default to "Continuous"
      let durationEn = 'Not documented';
      let durationBn = 'অনির্দিষ্ট';
      if (supp.duration_weeks) {
        durationEn = `${supp.duration_weeks} weeks`;
        durationBn = `${supp.duration_weeks} সপ্তাহ`;
      } else if (supp.duration && supp.duration.trim() !== '') {
        durationEn = supp.duration;
        durationBn = supp.duration_bn || supp.duration;
      }

      // Meal / food relationship instructions
      let instrEn = supp.instructions_en || '';
      let instrBn = supp.instructions_bn || '';
      if (!instrEn) {
        switch (supp.relationship_to_food) {
          case 'empty_stomach_waking':
            instrBn = 'সকালে ঘুম থেকে উঠে খালি পেটে ১ গ্লাস পানির সাথে সেব্য।';
            instrEn = 'Take on empty stomach upon waking with a full glass of water.';
            break;
          case 'with_breakfast':
            instrBn = 'সকালের নাশতার সাথে সেব্য।';
            instrEn = 'Take with breakfast.';
            break;
          case 'with_lunch':
            instrBn = 'দুপুরের খাবারের সাথে সেব্য।';
            instrEn = 'Take with lunch.';
            break;
          case 'with_dinner':
            instrBn = 'রাতের খাবারের সাথে সেব্য।';
            instrEn = 'Take with dinner.';
            break;
          case 'with_fatty_meal':
            instrBn = 'চর্বিযুক্ত খাবারের সাথে সেব্য (শোষণ বৃদ্ধির জন্য)।';
            instrEn = 'Take with a meal containing healthy fat for optimal absorption.';
            break;
          case 'between_meals':
            instrBn = 'খাবারের মধ্যবর্তী সময়ে সেব্য।';
            instrEn = 'Take between meals.';
            break;
          case 'before_bed':
            instrBn = 'রাতে ঘুমানোর পূর্বে সেব্য।';
            instrEn = 'Take at bedtime.';
            break;
          case 'independent_of_meals':
            instrBn = 'খাবারের আগে বা পরে যেকোনো সময় সেব্য।';
            instrEn = 'Take with or without food as convenient.';
            break;
          default:
            instrBn = 'চিকিৎসকের পরামর্শ অনুযায়ী সেব্য।';
            instrEn = 'Take as directed by prescribing clinician.';
        }
      }

      const row: MedicationProtocolRow = {
        id: supp.id || `supp_${Math.random()}`,
        sequence_time: time,
        sequence_time_bn: timeDisplays.time_bn,
        sequence_time_en: timeDisplays.time_en,
        brand_name: supp.brand_name || supp.name || supp.title_bn || supp.generic_nutrient || 'সাপ্লিমেন্ট',
        generic_name: supp.generic_nutrient 
          ? (supp.chemical_form ? `${supp.generic_nutrient} (${supp.chemical_form})` : supp.generic_nutrient)
          : (supp.generic_name || supp.name_en || supp.elemental_form || supp.name || 'Supplement'),
        dosage_display_en: doseEn,
        dosage_display_bn: doseBn,
        duration_en: durationEn,
        duration_bn: durationBn,
        clinical_instructions_en: time === 'UNKNOWN' ? `TIMING REQUIRES REVIEW. ${instrEn}` : instrEn,
        clinical_instructions_bn: time === 'UNKNOWN' ? `সময় নির্ধারণ প্রয়োজন। ${instrBn}` : instrBn,
        item_type: 'supplement',
        approval_status: 'prescribed_approved',
        requires_clinician_verification: time === 'UNKNOWN'
      };
      activeRows.push(row);
    } else {
      // Stage B & Checkpoint C: Unapproved or unauthorized supplement remains strictly in draft_candidates
      const unauthReasonEn = (isItemClinicianApproved && !protocolAuth.isAuthorized && protocolAuth.reason_en)
        ? `Authorization required (${protocolAuth.reason_en}) `
        : '';
      const unauthReasonBn = (isItemClinicianApproved && !protocolAuth.isAuthorized && protocolAuth.reason_bn)
        ? `প্রোটোকল অনুমোদন আবশ্যক (${protocolAuth.reason_bn}) `
        : '';
      const row: MedicationProtocolRow = {
        id: supp.id || `cand_supp_${draftCandidates.length + 1}`,
        sequence_time: 'UNKNOWN',
        sequence_time_bn: 'খসড়া প্রস্তাবনা (অনুমোদন সাপেক্ষ)',
        sequence_time_en: 'Draft Candidate (Pending Approval)',
        brand_name: supp.brand_name || supp.name || supp.title_bn || supp.generic_nutrient || 'প্রস্তাবিত সাপ্লিমেন্ট',
        generic_name: supp.generic_nutrient || supp.generic_name || supp.name_en || 'Candidate Supplement',
        dosage_display_en: supp.dosage || supp.total_compound_dose || 'Candidate dose',
        dosage_display_bn: supp.dosage_bn || supp.dosage || 'প্রস্তাবিত মাত্রা',
        duration_en: 'Clinician confirmation required',
        duration_bn: 'ক্লিনিক্যাল অনুমোদন প্রয়োজন',
        clinical_instructions_en: `${unauthReasonEn}${supp.clinician_rationale || supp.clinical_rationale || 'Candidate micronutrient intervention pending clinician sign-off.'}`.trim(),
        clinical_instructions_bn: `${unauthReasonBn}${supp.clinical_rationale_bn || 'চিকিৎসক কর্তৃক অনুমোদনের অপেক্ষায় খসড়া পুষ্টি উপাদান।'}`.trim(),
        item_type: 'candidate_supplement',
        approval_status: 'draft_candidate',
        requires_clinician_verification: true
      };
      draftCandidates.push(row);
    }
  }

  // 3. Process Explicit Candidate Supplements (deduplicated against protocol items)
  for (const cand of candidateSupplements) {
    const semanticKey = getSupplementDedupKey(cand);
    if ((cand.id && seenSupplementIds.has(cand.id)) || seenSupplementKeys.has(semanticKey)) {
      continue;
    }
    if (cand.id) seenSupplementIds.add(cand.id);
    seenSupplementKeys.add(semanticKey);

    const row: MedicationProtocolRow = {
      id: cand.id || `cand_${draftCandidates.length + 1}`,
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

  // 4. Sort Chronologically (Stage C: strict sequence)
  sortProtocolRowsChronologically(activeRows);
  sortProtocolRowsChronologically(pendingVerificationRows);

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
    pending_verification_rows: pendingVerificationRows,
    draft_candidates: draftCandidates,
    has_unresolved_verification: pendingVerificationRows.length > 0
  };
}

/**
 * Stage D: Complete Patient-Specific Food Exchange Generator
 * Analyzes foods in the prescribed diet chart and generates safe, equivalent
 * household alternatives based on the Food Database and Traffic Light restrictions.
 */
export function buildPatientSpecificFoodExchanges(
  dietChartOrPlan: WeeklyDietPlan | DietChartMeal[] | undefined,
  trafficLight: any,
  patient: PatientProfile,
  r5NutritionContract?: any,
  visitId?: string
): PatientFoodExchangeItem[] {
  const result: PatientFoodExchangeItem[] = [];
  const processedOriginalIds = new Set<string>();

  const confirmedAllergies = new Set((patient.confirmed_allergies || []).map(a => a.toLowerCase()));
  const disallowed = new Set((patient.clinician_disallowed_foods || []).map(d => d.toLowerCase()));
  const redFoodIds = new Set((trafficLight?.red || []).map((f: any) => f.id));

  // Collect meal items from plan
  const mealItems: Array<{ meal_type: string; item: any }> = [];
  if (dietChartOrPlan) {
    if ('days' in dietChartOrPlan && Array.isArray((dietChartOrPlan as WeeklyDietPlan).days)) {
      for (const day of (dietChartOrPlan as WeeklyDietPlan).days) {
        for (const meal of day.meals || []) {
          for (const item of meal.items || []) {
            mealItems.push({ meal_type: meal.title_bn || meal.meal_type, item });
          }
        }
      }
    } else if (Array.isArray(dietChartOrPlan)) {
      for (const meal of dietChartOrPlan as DietChartMeal[]) {
        for (const item of meal.items || []) {
          mealItems.push({ meal_type: meal.title_bn || meal.meal_type, item });
        }
      }
    }
  }

  function getHouseholdPortion(group: string, rawWeightG: number, cookedRatio: number = 1): { bn: string; en: string } {
    const cookedG = Math.round(rawWeightG * cookedRatio);
    switch (group) {
      case 'grain':
      case 'grains':
        if (cookedG >= 120) {
          return { bn: `১ বাটি (প্রায় ${cookedG} গ্রাম রান্না)`, en: `1 bati (~${cookedG}g cooked)` };
        }
        return { bn: `১/২ বাটি বা ১ কাপ (প্রায় ${cookedG} গ্রাম রান্না)`, en: `1/2 bati or 1 cup (~${cookedG}g cooked)` };
      case 'protein':
      case 'proteins':
      case 'fish_meat_egg':
      case 'legume':
        if (rawWeightG <= 35) {
          return { bn: `১টি ডিম অথবা ১ মাঝারি টুকরো (রান্না ~${cookedG} গ্রাম)`, en: `1 egg or 1 medium piece (~${cookedG}g cooked)` };
        }
        return { bn: `১ মাঝারি বাটি ঘন ডাল বা ১ টুকরো মাছ/মুরগি (রান্না ~${cookedG} গ্রাম)`, en: `1 medium bati thick dal or 1 piece fish/meat (~${cookedG}g cooked)` };
      case 'vegetable':
      case 'vegetables':
        return { bn: `১ মাঝারি বাটি (রান্না ~${cookedG} গ্রাম)`, en: `1 medium bati (~${cookedG}g cooked)` };
      case 'fruit':
      case 'fruits':
        return { bn: `১টি মাঝারি গোটা ফল অথবা ১/২ কাপ কাটা`, en: `1 medium whole fruit or 1/2 cup sliced` };
      case 'dairy':
        return { bn: `১ গ্লাস বা ১ ছোট বাটি (~${cookedG} মিলি/গ্রাম)`, en: `1 glass or 1 small bati (~${cookedG} ml/g)` };
      case 'fats_oils':
      case 'oil':
        return { bn: `১ চা চামচ (৫ গ্রাম/মিলি)`, en: `1 tsp (5 g/ml)` };
      default:
        return { bn: `${rawWeightG} গ্রাম কাঁচা পরিমাপ`, en: `${rawWeightG}g raw portion` };
    }
  }

  const allFoodsList = foodsData as FoodItem[];

  for (const { meal_type, item } of mealItems) {
    const origId = item.food_id || item.id;
    if (!origId || processedOriginalIds.has(origId)) continue;
    processedOriginalIds.add(origId);

    const origFood = allFoodsList.find(f => f.id === origId) ||
      allFoodsList.find(f => (item.food_name_en && f.name_en.toLowerCase().includes(item.food_name_en.toLowerCase())) || (item.food_name_bn && f.name_bn.includes(item.food_name_bn)));
    if (!origFood) continue;

    const group = (origFood.exchange_group || origFood.category || 'other').toLowerCase();
    const ratio = origFood.raw_to_cooked_ratio || 1;
    const rawG = item.raw_weight_g || 100;
    const origHousehold = getHouseholdPortion(group, rawG, ratio);

    // Checkpoint F: Enforce single authoritative authorization filter (status === 'approved' && is_approved === true).
    const planObj: WeeklyDietPlan | null =
      dietChartOrPlan && !Array.isArray(dietChartOrPlan) && 'days' in dietChartOrPlan
        ? (dietChartOrPlan as WeeklyDietPlan)
        : null;

    if (item.is_recipe_item || item.recipe_reference) continue;

    const authorizedAlts = filterAuthorizedPatientAlternatives({
      alternatives: item.alternatives,
      plan: planObj,
      patient,
      visitId: visitId || patient.current_visit_id || planObj?.visit_id,
      trafficLight,
      r5NutritionContract,
      foodPool: allFoodsList,
    });

    for (const altSnap of authorizedAlts) {
      const altFood = allFoodsList.find(x => x.id === altSnap.food_id);
      if (!altFood) continue;

      const altRawG = Math.round(Number(altSnap.raw_weight_g) || 0);
      if (altRawG <= 0) continue;
      const altRatio = altFood.raw_to_cooked_ratio || 1;
      const altHousehold = {
        bn: altSnap.cooked_display_bn || getHouseholdPortion(group, altRawG, altRatio).bn,
        en: altSnap.cooked_display_en || getHouseholdPortion(group, altRawG, altRatio).en,
      };
      const objectiveLabelEn =
        altSnap.matching_mode === 'protein_matched'
          ? 'Protein-matched authorized alternative (portioned for comparable protein).'
          : altSnap.matching_mode === 'carb_matched'
          ? 'Carbohydrate-matched authorized alternative.'
          : altSnap.matching_mode === 'energy_matched'
          ? 'Energy-matched authorized alternative (not identical in every micronutrient).'
          : 'Clinician-reviewed food-group alternative.';
      const objectiveLabelBn =
        altSnap.matching_mode === 'protein_matched'
          ? 'প্রোটিন-সামঞ্জস্যপূর্ণ অনুমোদিত বিকল্প।'
          : altSnap.matching_mode === 'carb_matched'
          ? 'কার্বোহাইড্রেট-সামঞ্জস্যপূর্ণ অনুমোদিত বিকল্প।'
          : 'ক্লিনিক্যালি পর্যালোচিত খাদ্য-বদল বিকল্প।';

      let groupLabelBn = 'সাধারণ খাদ্য';
      let groupLabelEn = 'General Food';
      let groupKey: PatientFoodExchangeItem['exchange_group'] = 'grains';

      if (group.includes('grain')) {
        groupKey = 'grains';
        groupLabelBn = 'শস্য ও কার্বোহাইড্রেট';
        groupLabelEn = 'Grains & Carbohydrates';
      } else if (group.includes('protein') || group.includes('legume') || group.includes('fish') || group.includes('meat') || group.includes('egg')) {
        groupKey = 'proteins';
        groupLabelBn = 'প্রোটিন (মাছ, মাংস, ডিম ও ডাল)';
        groupLabelEn = 'Proteins & Legumes';
      } else if (group.includes('vegetable')) {
        groupKey = 'vegetables';
        groupLabelBn = 'শাকসবজি';
        groupLabelEn = 'Vegetables';
      } else if (group.includes('fruit')) {
        groupKey = 'fruits';
        groupLabelBn = 'ফলমূল';
        groupLabelEn = 'Fruits';
      } else if (group.includes('dairy')) {
        groupKey = 'dairy';
        groupLabelBn = 'দুগ্ধজাত ও প্রোবায়োটিক';
        groupLabelEn = 'Dairy & Probiotics';
      } else if (group.includes('fat') || group.includes('oil')) {
        groupKey = 'fats_oils';
        groupLabelBn = 'স্বাস্থ্যকর ফ্যাট ও তেল';
        groupLabelEn = 'Healthy Fats & Oils';
      }

      result.push({
        original_food_id: origFood.id,
        original_food_name_bn: origFood.name_bn,
        original_food_name_en: origFood.name_en,
        prescribed_meal_slot: meal_type,
        prescribed_raw_g: rawG,
        prescribed_household_portion_bn: origHousehold.bn,
        prescribed_household_portion_en: origHousehold.en,
        exchange_group: groupKey,
        exchange_group_bn: groupLabelBn,
        exchange_group_en: groupLabelEn,
        alternative_food_id: altFood.id,
        alternative_food_name_bn: altFood.name_bn,
        alternative_food_name_en: altFood.name_en,
        alternative_raw_g: altRawG,
        alternative_household_portion_bn: altHousehold.bn,
        alternative_household_portion_en: altHousehold.en,
        nutritional_comparability_bn: objectiveLabelBn,
        nutritional_comparability_en: objectiveLabelEn,
        clinical_caution_bn:
          (Array.isArray(altSnap.conditional_instructions_bn) && altSnap.conditional_instructions_bn.length > 0
            ? altSnap.conditional_instructions_bn.join(' ')
            : undefined) ||
          (altFood.tags?.includes('contains_gluten')
            ? 'গ্লুটেন সংবেদনশীল রোগীদের জন্য বর্জনীয়।'
            : undefined),
        clinical_caution_en:
          (Array.isArray(altSnap.conditional_instructions_en) && altSnap.conditional_instructions_en.length > 0
            ? altSnap.conditional_instructions_en.join(' ')
            : undefined) ||
          (altFood.tags?.includes('contains_gluten')
            ? 'Contains gluten; avoid in celiac or gluten sensitivity.'
            : undefined),
        prep_guidance_bn: altFood.prep_note_bn || 'স্বাভাবিক স্বাস্থ্যকর পদ্ধতিতে রান্না করুন।',
        prep_guidance_en: altFood.prep_note_en || 'Prepare using standard wholesome culinary method.'
      });
    }
  }

  return result;
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

export interface HydrationAndFluidSafetyResult {
  fluid_restriction_active: boolean;
  fluid_limit_ml?: number;
  target_daily_ml?: number;
  is_prescribed: boolean;
  requires_clinician_confirmation: boolean;
  instructions_bn: string;
  instructions_en: string;
}

/**
 * Single Fluid Restriction & Hydration Safety Contract (Checkpoint B)
 * Separates:
 * 1. Confirmed fluid restriction with verified quantitative limit -> exact limit
 * 2. Confirmed fluid restriction with unknown quantitative limit -> no 1500 mL fabrication; requires confirmation & blocks release
 * 3. Fluid-sensitive diagnosis alone -> no numeric fabrication; requires clinician assessment
 * 4. Clinician-approved individualized R4 hydration target -> preserved verbatim
 * 5. Missing hydration assessment -> "Not individually prescribed"
 */
export function evaluateR6HydrationAndFluidSafety(
  patient: PatientProfile,
  r4Protocol?: R4ProtocolStudioData | null,
  visitId?: string
): HydrationAndFluidSafetyResult {
  const selectedConditions = (patient?.selected_conditions || []) as unknown as string[];
  const hasFluidSensitiveDiagnosis =
    selectedConditions.includes('ckd_dialysis') ||
    selectedConditions.includes('heart_failure');

  const protocolAuthForHydration = validateR4ProtocolAuthorization({
    r4Protocol,
    patientId: patient?.id,
    visitId
  });
  const isR4ApprovedForPatientAndVisit = protocolAuthForHydration.isAuthorized;

  // Explicit clinician-confirmed quantitative limit
  const patientPrescribedLimit =
    (patient?.fluid_prescription?.total_fluid_limit_ml && patient.fluid_prescription.total_fluid_limit_ml > 0
      ? patient.fluid_prescription.total_fluid_limit_ml
      : undefined) ??
    (patient?.clinical_safety?.fluid_restriction?.limit_ml && patient.clinical_safety.fluid_restriction.limit_ml > 0
      ? patient.clinical_safety.fluid_restriction.limit_ml
      : undefined) ??
    ((patient?.feeding_status as any)?.fluid_limit_ml && (patient?.feeding_status as any).fluid_limit_ml > 0
      ? (patient?.feeding_status as any).fluid_limit_ml
      : undefined);

  const r4ApprovedFluidLimit =
    isR4ApprovedForPatientAndVisit &&
    r4Protocol?.hydration?.is_restricted &&
    !r4Protocol.hydration.requires_individualized_fluid_review &&
    r4Protocol.hydration.clinician_fluid_limit_ml &&
    r4Protocol.hydration.clinician_fluid_limit_ml > 0
      ? r4Protocol.hydration.clinician_fluid_limit_ml
      : undefined;

  const verifiedFluidLimit = patientPrescribedLimit ?? r4ApprovedFluidLimit;

  const explicitRestrictionFlag = Boolean(
    patient?.fluid_prescription?.is_restricted ||
    patient?.clinical_safety?.fluid_restriction?.is_restricted ||
    r4Protocol?.hydration?.is_restricted ||
    r4Protocol?.hydration?.requires_individualized_fluid_review
  );

  // State 1: Confirmed fluid restriction with verified quantitative limit
  if (verifiedFluidLimit !== undefined && verifiedFluidLimit > 0) {
    return {
      fluid_restriction_active: true,
      fluid_limit_ml: verifiedFluidLimit,
      target_daily_ml: verifiedFluidLimit,
      is_prescribed: true,
      requires_clinician_confirmation: false,
      instructions_bn: `ক্লিনিক্যাল তরল সীমাবদ্ধতা সক্রিয়: চিকিৎসকের নির্দেশ মোতাবেক দৈনিক মোট তরল গ্রহণ কঠোরভাবে সর্বাধিক ${verifiedFluidLimit} মিলিলিটারে সীমাবদ্ধ রাখুন (পানি, চা, ঝোল সহ)। মেপে পানি পান করুন।`,
      instructions_en: `Clinical Fluid Restriction Active: Strictly limit total daily fluid intake to maximum ${verifiedFluidLimit} mL/day as ordered by physician (including water, tea, soups). Measure accurately.`
    };
  }

  // State 2: Fluid restriction flagged/active, OR fluid-sensitive diagnosis, WITHOUT verified numeric limit
  if (explicitRestrictionFlag || hasFluidSensitiveDiagnosis) {
    return {
      fluid_restriction_active: explicitRestrictionFlag,
      fluid_limit_ml: undefined,
      target_daily_ml: undefined,
      is_prescribed: false,
      requires_clinician_confirmation: true,
      instructions_bn: 'তরল সীমাবদ্ধতা — সুনির্দিষ্ট পরিমাণ চিকিৎসকের নিশ্চিতকরণ প্রয়োজন',
      instructions_en: 'Fluid Restriction — Quantitative Limit Requires Clinician Confirmation'
    };
  }

  // State 4: Existing clinician-approved individualized R4 hydration prescription (unrestricted)
  if (
    isR4ApprovedForPatientAndVisit &&
    r4Protocol?.hydration &&
    (r4Protocol.hydration.baseline_fluid_target_ml > 0 || Boolean(r4Protocol.hydration.timing_guidance_en))
  ) {
    const targetMl = r4Protocol.hydration.baseline_fluid_target_ml > 0
      ? r4Protocol.hydration.baseline_fluid_target_ml
      : undefined;
    return {
      fluid_restriction_active: false,
      fluid_limit_ml: undefined,
      target_daily_ml: targetMl,
      is_prescribed: true,
      requires_clinician_confirmation: false,
      instructions_bn: r4Protocol.hydration.timing_guidance_bn || (targetMl
        ? `দৈনিক তরল লক্ষ্যমাত্রা: প্রায় ${targetMl} মিলি। খাবার গ্রহণের ৩০ মিনিট পূর্বে বা পরে পানি পান করুন।`
        : 'ব্যক্তিগতভাবে নির্ধারিত হাইড্রেশন নির্দেশিকা অনুসরণ করুন।'),
      instructions_en: r4Protocol.hydration.timing_guidance_en || (targetMl
        ? `Daily fluid target: approximately ${targetMl} mL. Space hydration 30 min away from meals.`
        : 'Follow individualized hydration guidance.')
    };
  }

  // States 3 & 5: No confirmed restriction and no approved individualized hydration assessment
  return {
    fluid_restriction_active: false,
    fluid_limit_ml: undefined,
    target_daily_ml: undefined,
    is_prescribed: false,
    requires_clinician_confirmation: false,
    instructions_bn: 'ব্যক্তিগতভাবে নির্ধারিত নয়',
    instructions_en: 'Not individually prescribed'
  };
}

/**
 * Module 1 & 8: Master Prescription Composition Engine
 * Stage A: Single Authoritative Composition Flow
 */
export function composeR6Prescription(options: {
  patient: PatientProfile;
  weeklyDietPlan?: WeeklyDietPlan | null;
  dietChart?: DietChartMeal[];
  medications?: R5MedicationRecord[];
  r4Protocol?: R4ProtocolStudioData | null;
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
    r4Protocol,
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

  // 1. Release Gating (Authoritative across Medication, Diet Plan, Fluid, R4 Protocol, Safety)
  const eligibility = validateReportReleaseEligibility({
    patient,
    plan: weeklyDietPlan || dietChart,
    weeklyDietPlan,
    visit,
    safetyEvaluation,
    isDietPlanDirty: isDietPlanDirty ?? patient.is_diet_plan_dirty,
    r5NutritionContract,
    medications,
    r4Protocol,
    supplements
  });

  const isApproved = Boolean(weeklyDietPlan && weeklyDietPlan.status === 'approved' && weeklyDietPlan.is_approved === true);
  const clinicianName = weeklyDietPlan?.approved_by || weeklyDietPlan?.approval_metadata?.clinician_name || 'Unassigned Clinician';

  // 2. Structured 7-Food-Group Guide
  const sevenFoodGroupGuide = buildStructuredTrafficLightGuide(trafficLight);

  // 3. 6-Column Chronological Medication Protocol (Stage B, Stage C & Checkpoint C)
  const medicationProtocol = compose6ColumnMedicationProtocol(
    medications,
    supplements,
    candidateSupplements,
    r4Protocol,
    {
      patientId: patient.id,
      visitId
    }
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
          food_name_bn: item.recipe_reference?.name_bn
            ? `${item.recipe_reference.name_bn} (অনুমোদিত রেসিপি · ${item.recipe_reference.prescribed_servings} পরিবেশন)`
            : item.food_name_bn,
          food_name_en: item.recipe_reference?.name_en
            ? `${item.recipe_reference.name_en} (Authorized Recipe · ${item.recipe_reference.prescribed_servings} serving(s))`
            : item.food_name_en,
          raw_serving_weight_g: item.raw_weight_g,
          household_portion_bn: item.cooked_display_bn,
          household_portion_en: item.cooked_display_en,
          preparation_note_bn: item.prep_note_bn || 'স্বাভাবিক পদ্ধতিতে রান্না',
          preparation_note_en: item.prep_note_en || 'Standard preparation',
          alternatives: filterAuthorizedPatientAlternatives({
            alternatives: item.alternatives,
            plan: weeklyDietPlan,
            patient,
            visitId,
            trafficLight,
            r5NutritionContract,
          }).slice(0, 3).map(alt => ({
            name_bn: alt.name_bn,
            name_en: alt.name_en,
            portion_bn: alt.cooked_display_bn,
            portion_en: alt.cooked_display_en
          }))
        }))
      }))
    };
  });

  // 6. Safety Directives & Fluid Calculation (Checkpoint B: Zero Fabricated 1500 mL)
  const selectedConditions = (patient.selected_conditions || []) as unknown as string[];
  const hydrationSafety = evaluateR6HydrationAndFluidSafety(patient, r4Protocol, visitId);
  const fluidLimit = hydrationSafety.fluid_limit_ml;
  const isFluidRestricted = hydrationSafety.fluid_restriction_active;

  // 7. Stage D: Patient-Specific Food Exchanges
  const patientSpecificExchanges = buildPatientSpecificFoodExchanges(
    weeklyDietPlan || dietChart,
    trafficLight,
    patient,
    r5NutritionContract,
    visitId
  );

  // 8. Stage E: Connect R4 Lifestyle Protocols (Zero Fabricated Blanket Advice)
  const hydrationTargetMl = hydrationSafety.target_daily_ml;
  const hydrationBn = hydrationSafety.instructions_bn;
  const hydrationEn = hydrationSafety.instructions_en;
  const isHydrationPrescribed = hydrationSafety.is_prescribed;

  const r4StageEAuth = validateR4ProtocolAuthorization({
    r4Protocol,
    patientId: patient.id,
    visitId
  });

  // Exercise
  let exerciseTargetBn = 'ব্যক্তিগতভাবে নির্ধারিত নয়';
  let exerciseTargetEn = 'Not individually prescribed';
  let exerciseSafetyBn = 'ব্যায়াম শুরুর পূর্বে চিকিৎসকের পরামর্শ গ্রহণ করুন।';
  let exerciseSafetyEn = 'Consult physician before initiating structured exercise.';
  let isExercisePrescribed = false;

  if (r4StageEAuth.isAuthorized && r4Protocol?.exercise && r4Protocol.exercise.items && r4Protocol.exercise.items.length > 0) {
    const approvedExercises = r4Protocol.exercise.items.filter(i => i.approval_status === 'approved');
    if (approvedExercises.length > 0) {
      isExercisePrescribed = true;
      exerciseTargetBn = approvedExercises.map(e => `${e.title_bn}: সপ্তাহে ${e.frequency_per_week} দিন, ${e.duration_minutes} মিনিট (${e.intensity})`).join('; ');
      exerciseTargetEn = approvedExercises.map(e => `${e.title_en}: ${e.frequency_per_week}x/week, ${e.duration_minutes} min (${e.intensity})`).join('; ');
      exerciseSafetyBn = approvedExercises.map(e => (e.stop_conditions_bn || []).join(', ')).filter(Boolean).join('; ') || 'বুকে ব্যথা বা মাথা ঘোরা দেখা দিলে তাৎক্ষণিক ব্যায়াম বন্ধ করুন।';
      exerciseSafetyEn = approvedExercises.map(e => (e.stop_conditions_en || []).join(', ')).filter(Boolean).join('; ') || 'Stop immediately if chest pain, severe dyspnea, or dizziness occurs.';
    }
  } else if (r4StageEAuth.isAuthorized && r4Protocol?.exercise?.weekly_aerobic_minutes_target) {
    isExercisePrescribed = true;
    exerciseTargetBn = `সাপ্তাহিক অ্যারোবিক লক্ষ্যমাত্রা: ${r4Protocol.exercise.weekly_aerobic_minutes_target} মিনিট পরিমিত শারীরিক সক্রিয়তা।`;
    exerciseTargetEn = `Weekly aerobic target: ${r4Protocol.exercise.weekly_aerobic_minutes_target} minutes moderate physical activity.`;
  }

  // Sleep & Circadian Chronobiology
  let sleepHours: number | undefined = undefined;
  let caffeineCurfew: string | undefined = undefined;
  let dinnerCurfew: string | undefined = undefined;
  let sleepBn = 'ব্যক্তিগতভাবে নির্ধারিত নয়';
  let sleepEn = 'Not individually prescribed';
  let isSleepPrescribed = false;

  if (r4StageEAuth.isAuthorized && r4Protocol?.sleep) {
    isSleepPrescribed = true;
    sleepHours = r4Protocol.sleep.target_sleep_hours;
    caffeineCurfew = r4Protocol.sleep.caffeine_curfew_time;
    dinnerCurfew = r4Protocol.sleep.last_meal_curfew_time;
    sleepBn = `ঘুমের সময়সূচি: রাত ${r4Protocol.sleep.bed_time} থেকে সকাল ${r4Protocol.sleep.wake_time} (লক্ষ্যমাত্রা: ${sleepHours} ঘণ্টা)। ক্যাফেইন বর্জনীয়: ${caffeineCurfew || 'দুপুর ২:০০ টার পর'}। রাতের খাবার সম্পন্ন: ঘুমানোর অন্তত ৩ ঘণ্টা পূর্বে।`;
    sleepEn = `Sleep schedule: ${r4Protocol.sleep.bed_time} to ${r4Protocol.sleep.wake_time} (target: ${sleepHours}h). Caffeine cutoff: ${caffeineCurfew || '14:00'}. Last meal: at least 3h before bed.`;
  }

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
      contact: undefined, // Zero fake clinic contact
      address: undefined  // Zero fake address
    },
    clinician: {
      name: clinicianName,
      designation_bn: 'ক্লিনিক্যাল ফাংশনাল নিউট্রিশনিস্ট',
      designation_en: 'Clinical Functional Nutritionist',
      license: weeklyDietPlan?.approval_metadata?.license_number || undefined,
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
      cooking_oil_rules_bn: isFluidRestricted ? 'পরিমিত রান্নার তেল ব্যবহার করুন।' : 'ব্যক্তিগতভাবে নির্ধারিত নয়',
      cooking_oil_rules_en: isFluidRestricted ? 'Use measured cooking oil.' : 'Not individually prescribed',
      salt_rules_bn: selectedConditions.some(c => c.includes('hypertension') || c.includes('ckd')) 
        ? 'রান্নায় পরিমিত আয়োডিনযুক্ত লবণ; পাতে বাড়তি লবণ সম্পূর্ণ নিষিদ্ধ।' 
        : 'ব্যক্তিগতভাবে নির্ধারিত নয়',
      salt_rules_en: selectedConditions.some(c => c.includes('hypertension') || c.includes('ckd')) 
        ? 'Strict moderate cooking salt; zero raw table salt.' 
        : 'Not individually prescribed'
    },
    seven_food_group_guide: sevenFoodGroupGuide,
    fasting_evaluation: fastingEvaluation,
    dynamic_diet_chart: {
      total_days: formattedDays.length,
      meal_count_per_day: formattedDays[0]?.meals.length || 0,
      days: formattedDays
    },
    food_exchange_guide: STANDARD_BANGLADESHI_EXCHANGES,
    patient_specific_exchanges: patientSpecificExchanges,
    medication_supplement_protocol: medicationProtocol,
    lifestyle_support: {
      hydration: {
        target_daily_ml: hydrationTargetMl,
        is_prescribed: isHydrationPrescribed,
        instructions_bn: hydrationBn,
        instructions_en: hydrationEn
      },
      exercise: {
        target_bn: exerciseTargetBn,
        target_en: exerciseTargetEn,
        is_prescribed: isExercisePrescribed,
        safety_instructions_bn: exerciseSafetyBn,
        safety_instructions_en: exerciseSafetyEn
      },
      sleep_circadian: {
        sleep_target_hours: sleepHours,
        is_prescribed: isSleepPrescribed,
        caffeine_curfew: caffeineCurfew,
        dinner_curfew: dinnerCurfew,
        instructions_bn: sleepBn,
        instructions_en: sleepEn
      }
    },
    disclaimers: {
      bn: 'ব্যক্তিগতকৃত ক্লিনিক্যাল নিউট্রিশন প্রেসক্রিপশন। শুধুমাত্র লাইসেন্সধারী ক্লিনিক্যাল নিউট্রিশনিস্টের অনুমোদনের পর প্রযোজ্য। নির্দেশিত পরিমাপ ও সময়সূচি যথাযথভাবে অনুসরণ করুন।',
      en: 'Personalized Clinical Nutrition Prescription. Valid only upon approval by a licensed clinical nutritionist. Adhere strictly to prescribed portions and timings.'
    }
  };
}
