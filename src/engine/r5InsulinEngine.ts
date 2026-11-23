/**
 * SHUDDHO Phase R5 — Insulin Engine
 * 
 * Clinical Intelligence for Insulin Regimen Detection, Meal Synchronization & Hypoglycemia Safeguards.
 * 
 * Safety Principles:
 * 1. ZERO AUTONOMOUS ICR / ISF GENERATION: Only licensed prescribers determine insulin dosing ratios.
 *    Shuddho records prescriber values but NEVER invents or calculates pump / injection doses.
 * 2. PRECISE REGIMEN CLASSIFICATION: Classifies regimens into basal_only, rapid_acting_mealtime,
 *    regular_insulin, nph_intermediate, premixed_fixed_ratio, basal_bolus_multiple_daily_injections,
 *    continuous_subcutaneous_insulin_pump, or automated_insulin_delivery.
 * 3. STRICT MEAL SYNCHRONIZATION: Calculates meal delay windows and carbohydrate distribution mandates
 *    based on insulin pharmacokinetics (onset, peak, duration).
 * 4. HYPOGLYCEMIA RESCUE MANDATE: Universal 15-15 rule protocol in English and Bengali for all
 *    insulin-treated patients.
 */

import {
  R5MedicationRecord,
  InsulinRegimenType,
  InsulinRegimenContext
} from '../types/r5Systems';

// Generic drug patterns for classification
const BASAL_ANALOGS = ['glargine', 'detemir', 'degludec'];
const RAPID_ANALOGS = ['lispro', 'aspart', 'glulisine', 'ultra-rapid aspart'];
const REGULAR_INSULIN = ['regular insulin', 'human insulin regular', 'soluble insulin'];
const NPH_INSULIN = ['isophane', 'nph', 'human insulin nph'];
const PREMIX_PATTERNS = ['70/30', '50/50', '75/25', 'premix', 'biphasic'];

export interface InsulinClassificationResult {
  has_insulin: boolean;
  regimen_context: InsulinRegimenContext;
}

/**
 * Analyzes active medications and determines insulin regimen context
 */
export function analyzeInsulinRegimen(
  medications: R5MedicationRecord[],
  hypoHistory?: {
    severe_recent_episode?: boolean;
    nocturnal_hypo?: boolean;
    hypoglycemia_unawareness?: boolean;
  },
  prescriberSettings?: {
    icr?: number;
    isf?: number;
    target_glucose_range?: string;
    is_pump?: boolean;
    is_aid?: boolean;
    cgm_smbg_available?: boolean;
  }
): InsulinClassificationResult {
  const detectedInsulins: Array<{
    generic: string;
    brand?: string;
    category: 'BASAL' | 'RAPID' | 'REGULAR' | 'NPH' | 'PREMIX';
    timing?: string;
  }> = [];

  for (const med of medications) {
    if (med.status !== 'active') continue;
    const genericLower = (med.generic_name || '').toLowerCase();
    const brandLower = (med.brand_name || '').toLowerCase();
    const combined = `${genericLower} ${brandLower}`;

    let category: 'BASAL' | 'RAPID' | 'REGULAR' | 'NPH' | 'PREMIX' | null = null;

    if (PREMIX_PATTERNS.some(p => combined.includes(p))) {
      category = 'PREMIX';
    } else if (BASAL_ANALOGS.some(b => combined.includes(b))) {
      category = 'BASAL';
    } else if (RAPID_ANALOGS.some(r => combined.includes(r))) {
      category = 'RAPID';
    } else if (NPH_INSULIN.some(n => combined.includes(n))) {
      category = 'NPH';
    } else if (REGULAR_INSULIN.some(reg => combined.includes(reg)) || genericLower.includes('insulin')) {
      category = 'REGULAR';
    }

    if (category) {
      detectedInsulins.push({
        generic: med.generic_name,
        brand: med.brand_name,
        category,
        timing: med.administration_times?.[0]
      });
    }
  }

  if (detectedInsulins.length === 0) {
    return {
      has_insulin: false,
      regimen_context: {
        active: false,
        regimen_type: 'basal_only',
        formulation_name: 'None',
        is_fixed_meal_dosing: false,
        cgm_smbg_available: false,
        hypoglycemia_history_past_month: false,
        fast_acting_carbs_mandate: false,
        required_action_summary_en: 'No active insulin therapy documented.',
        required_action_summary_bn: 'কোনো সক্রিয় ইনসুলিন থেরাপি নথিভুক্ত নেই।'
      }
    };
  }

  // Determine Regimen Type
  let regimenType: InsulinRegimenType = 'basal_only';
  let formulationName = detectedInsulins.map(d => d.brand ? `${d.brand} (${d.generic})` : d.generic).join(', ');
  let timingRelation: 'immediate_pre_meal' | '15_min_pre_meal' | 'post_meal' | 'bedtime' = '15_min_pre_meal';

  const hasBasal = detectedInsulins.some(i => i.category === 'BASAL');
  const hasRapid = detectedInsulins.some(i => i.category === 'RAPID');
  const hasPremix = detectedInsulins.some(i => i.category === 'PREMIX');
  const hasNPH = detectedInsulins.some(i => i.category === 'NPH');
  const hasRegular = detectedInsulins.some(i => i.category === 'REGULAR');

  if (prescriberSettings?.is_aid) {
    regimenType = 'automated_insulin_delivery';
    timingRelation = 'immediate_pre_meal';
  } else if (prescriberSettings?.is_pump) {
    regimenType = 'continuous_subcutaneous_insulin_pump';
    timingRelation = 'immediate_pre_meal';
  } else if (hasPremix) {
    regimenType = 'premixed_fixed_ratio';
    timingRelation = '15_min_pre_meal';
  } else if (hasBasal && hasRapid) {
    regimenType = 'basal_bolus_multiple_daily_injections';
    timingRelation = 'immediate_pre_meal';
  } else if (hasNPH && (hasRapid || hasRegular)) {
    regimenType = 'basal_bolus_multiple_daily_injections';
    timingRelation = '15_min_pre_meal';
  } else if (hasBasal && !hasRapid && !hasRegular) {
    regimenType = 'basal_only';
    timingRelation = 'bedtime';
  } else if (hasRapid) {
    regimenType = 'rapid_acting_mealtime';
    timingRelation = 'immediate_pre_meal';
  } else if (hasRegular) {
    regimenType = 'regular_insulin';
    timingRelation = '15_min_pre_meal';
  }

  const hasHypo = hypoHistory?.severe_recent_episode || hypoHistory?.nocturnal_hypo || hypoHistory?.hypoglycemia_unawareness || false;

  let actionEn = 'Synchronize prandial meal timing with insulin injection. Patient must carry 15g fast-acting glucose.';
  let actionBn = 'খাবারের সময়ের সাথে ইনসুলিন ইনজেকশনের সমন্বয় করুন। রোগীর কাছে সর্বদা ১৫ গ্রাম দ্রুত গ্লুকোজ থাকতে হবে।';

  if (regimenType === 'premixed_fixed_ratio') {
    actionEn = 'Fixed carbohydrate consistency required across breakfast and dinner. Bedtime carbohydrate buffer snack recommended to prevent nocturnal hypoglycemia.';
    actionBn = 'সকালের নাস্তা ও রাতের খাবারে কার্বোহাইড্রেটের পরিমাণ স্থির রাখা জরুরি। রাতের লো সুগার রোধে শোবার আগে হালকা নাস্তার পরামর্শ দেওয়া হচ্ছে।';
  } else if (regimenType === 'basal_bolus_multiple_daily_injections' || regimenType === 'continuous_subcutaneous_insulin_pump') {
    actionEn = 'Do not delay meals after bolus injection (0-15 min window). Match carbohydrate estimation to prescribed ICR.';
    actionBn = 'বোলাস ইনজেকশনের পর খাবার গ্রহণে দেরি করবেন না (০-১৫ মিনিট)। ডাক্তারের নির্ধারিত রেশিও অনুযায়ী কার্বোহাইড্রেট গ্রহণ করুন।';
  }

  return {
    has_insulin: true,
    regimen_context: {
      active: true,
      regimen_type: regimenType,
      formulation_name: formulationName,
      timing_relative_to_meal: timingRelation,
      is_fixed_meal_dosing: regimenType === 'premixed_fixed_ratio',
      prescriber_icr: prescriberSettings?.icr,
      prescriber_isf: prescriberSettings?.isf,
      cgm_smbg_available: prescriberSettings?.cgm_smbg_available ?? false,
      hypoglycemia_history_past_month: hasHypo,
      fast_acting_carbs_mandate: true,
      required_action_summary_en: actionEn,
      required_action_summary_bn: actionBn
    }
  };
}
