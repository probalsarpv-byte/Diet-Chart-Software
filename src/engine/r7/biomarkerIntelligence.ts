/**
 * SHUDDHO Phase R7-B: Advanced Biomarker Pattern Intelligence Engine
 *
 * Implements:
 * - Three separated interpretation layers (Lab Ref Interval | Established Decision Threshold | Exploratory Functional Zone)
 * - Population-aware interpretation (pediatric, pregnancy, sex-unspecified protection, renal)
 * - Hardened derived biomarker indices (HOMA-IR, TG/HDL, Non-HDL, TSAT, AST/ALT, FIB-4, UACR, NLR, CKD-EPI 2021 eGFR)
 * - 10 evidence-qualified Multi-Biomarker Pattern evaluations (no manufactured confidence % or unproven diagnoses)
 * - Critical laboratory safety escalation contract propagating to R6 release gating
 * - Comparable unit-normalized longitudinal trends
 */

import {
  R7NormalizedLabObservation,
  R7DualRangeBiomarkerEvaluation,
  R7BiomarkerClassificationStatus,
  R7SafetySeverity,
  R7DerivedBiomarkerResult,
  R7BiomarkerPatternFinding,
  R7CriticalLabFinding,
  R7LabTrendEntry,
  R7LabIntelligenceSummary,
  R7ReferenceProvenance
} from '@/types/r7Laboratory';
import { R5PopulationProfile } from '@/types/r5Systems';
import { PatientProfile, StructuredLabEntry } from '@/types';
import {
  resolveCanonicalMarker,
  convertLabUnitValue,
  isEligibleCanonicalScalarObservation,
  reconcilePatientLaboratories
} from './labFoundation';

function roundDisplay(val: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

function datesCompatibleForRatio(
  d1?: string,
  d2?: string,
  maxDaysDiff = 14,
  options?: { requireDates?: boolean; reportId1?: string; reportId2?: string }
): boolean {
  const r1 = (options?.reportId1 || '').trim();
  const r2 = (options?.reportId2 || '').trim();
  if (r1 && r2 && r1 !== r2) {
    return false;
  }

  const s1 = (d1 || '').trim();
  const s2 = (d2 || '').trim();
  if (!s1 || !s2) {
    // Shared non-empty lab report accession can confirm same episode if dates were omitted;
    // otherwise missing dates are NEVER assumed compatible.
    if (r1 && r1 === r2) return true;
    return options?.requireDates === false;
  }

  if (maxDaysDiff === 0) {
    const hasTime1 = /[T\s]\d{2}:\d{2}/.test(s1);
    const hasTime2 = /[T\s]\d{2}:\d{2}/.test(s2);
    if (hasTime1 && hasTime2) {
      const t1 = Date.parse(s1);
      const t2 = Date.parse(s2);
      if (!isNaN(t1) && !isNaN(t2)) {
        // Same-day draws with contradictory timestamps (> 2h apart) are distinct collection episodes
        return Math.abs(t1 - t2) <= 2 * 60 * 60 * 1000;
      }
    }
    const day1 = s1.slice(0, 10);
    const day2 = s2.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(day1) && /^\d{4}-\d{2}-\d{2}$/.test(day2)) {
      return day1 === day2;
    }
  }

  const t1 = Date.parse(s1);
  const t2 = Date.parse(s2);
  if (isNaN(t1) || isNaN(t2)) return s1 === s2;
  const days = Math.abs(t1 - t2) / (1000 * 60 * 60 * 24);
  return days <= maxDaysDiff;
}

function specimensCompatibleForRatio(s1?: string, s2?: string): boolean {
  if (!s1 || !s2 || s1 === 'unknown' || s2 === 'unknown') return true;
  const bloodSet = new Set(['serum', 'plasma', 'whole_blood']);
  if (bloodSet.has(s1) && bloodSet.has(s2)) return true;
  if (s1.startsWith('urine') && s2.startsWith('urine')) return true;
  return s1 === s2;
}

/**
 * Resolves Layer 1 Reference Interval with strict respect for population, pregnancy, and unentered sex.
 */
function resolveLayer1Reference(
  obs: R7NormalizedLabObservation,
  population: R5PopulationProfile
): {
  low?: number;
  high?: number;
  display: string;
  provenance: R7ReferenceProvenance;
  isAdultIntervalInapplicableToPediatric: boolean;
  populationNotes?: string;
} {
  // 1. Laboratory-provided reference interval has priority
  if (obs.lab_ref_low !== undefined || obs.lab_ref_high !== undefined) {
    const lo = obs.lab_ref_low !== undefined ? roundDisplay(obs.lab_ref_low) : '';
    const hi = obs.lab_ref_high !== undefined ? roundDisplay(obs.lab_ref_high) : '';
    const unit = obs.canonical_unit || obs.original_unit || '';
    const disp = lo !== '' && hi !== '' ? `${lo}–${hi} ${unit}` : lo !== '' ? `>=${lo} ${unit}` : `<=${hi} ${unit}`;
    return {
      low: obs.lab_ref_low,
      high: obs.lab_ref_high,
      display: disp.trim(),
      provenance: 'laboratory_provided',
      isAdultIntervalInapplicableToPediatric: false
    };
  }

  const def = resolveCanonicalMarker(obs.canonical_marker_id);
  const fb = def?.fallback_reference_interval;
  if (!fb) {
    return {
      display: 'Laboratory reference interval unavailable',
      provenance: 'unavailable',
      isAdultIntervalInapplicableToPediatric: false
    };
  }

  const isPediatric =
    population.life_stage === 'infant' ||
    population.life_stage === 'child' ||
    population.life_stage === 'adolescent';

  // Pediatric safety check (B06): Do NOT silently apply adult-only thresholds to children
  if (isPediatric && (def.population_applicability === 'adult_only' || def.population_applicability === 'pediatric_caution' || fb.pediatric_note)) {
    return {
      display: 'Pediatric reference interval not established in fallback',
      provenance: 'unavailable',
      isAdultIntervalInapplicableToPediatric: true,
      populationNotes: fb.pediatric_note || 'Adult reference intervals do not apply to pediatric patients without age-specific laboratory intervals.'
    };
  }

  // Pregnancy physiological adaptation (B07)
  if (population.pregnancy?.active) {
    if (obs.canonical_marker_id === 'hemoglobin') {
      const trimester = population.pregnancy.trimester;
      const pregLow = trimester === 2 ? 10.5 : 11.0;
      return {
        low: pregLow,
        high: 15.0,
        display: `${pregLow}–15.0 g/dL (Pregnancy Trimester ${trimester})`,
        provenance: 'population_adapted',
        isAdultIntervalInapplicableToPediatric: false,
        populationNotes: `Pregnancy-specific WHO hemoglobin threshold applied (Trimester ${trimester}).`
      };
    }
    if (obs.canonical_marker_id === 'tsh' && fb.pregnancy_note) {
      return {
        low: 0.1,
        high: population.pregnancy.trimester === 1 ? 2.5 : 3.0,
        display: `${population.pregnancy.trimester === 1 ? '0.1–2.5' : '0.2–3.0'} µIU/mL (Pregnancy T${population.pregnancy.trimester})`,
        provenance: 'population_adapted',
        isAdultIntervalInapplicableToPediatric: false,
        populationNotes: fb.pregnancy_note
      };
    }
  }

  // Sex-specific fallback ONLY when sex is explicitly male or female; NEVER default unspecified -> female! (B05)
  if (def.population_applicability === 'sex_specific_ref') {
    if (population.sex === 'male' && fb.male) {
      return {
        low: fb.male.low,
        high: fb.male.high,
        display: fb.male.text,
        provenance: 'guideline_fallback',
        isAdultIntervalInapplicableToPediatric: false
      };
    }
    if (population.sex === 'female' && fb.female) {
      return {
        low: fb.female.low,
        high: fb.female.high,
        display: fb.female.text,
        provenance: 'guideline_fallback',
        isAdultIntervalInapplicableToPediatric: false
      };
    }
    if (fb.adult_all) {
      return {
        low: fb.adult_all.low,
        high: fb.adult_all.high,
        display: fb.adult_all.text,
        provenance: 'guideline_fallback',
        isAdultIntervalInapplicableToPediatric: false,
        populationNotes: 'Biological sex unspecified: sex-neutral fallback interval used rather than assuming female.'
      };
    }
  }

  if (fb.adult_all) {
    return {
      low: fb.adult_all.low,
      high: fb.adult_all.high,
      display: fb.adult_all.text,
      provenance: 'guideline_fallback',
      isAdultIntervalInapplicableToPediatric: false
    };
  }

  return {
    display: 'Laboratory reference interval unavailable',
    provenance: 'unavailable',
    isAdultIntervalInapplicableToPediatric: false
  };
}

/**
 * Evaluates a single normalized biomarker observation across Layers 1, 2, and 3.
 */
export function evaluateBiomarkerObservation(
  obs: R7NormalizedLabObservation,
  population: R5PopulationProfile,
  allObsByMarker?: Record<string, R7NormalizedLabObservation>
): R7DualRangeBiomarkerEvaluation {
  const def = resolveCanonicalMarker(obs.canonical_marker_id);
  const labelEn = def?.label_en || obs.original_marker_name || obs.canonical_marker_id;
  const labelBn = def?.label_bn || obs.original_marker_name || obs.canonical_marker_id;
  const layer1 = resolveLayer1Reference(obs, population);

  const baseReturn = (
    refStatus: R7BiomarkerClassificationStatus,
    insightEn: string,
    insightBn: string,
    severity: R7SafetySeverity = 'none',
    extra?: Partial<R7DualRangeBiomarkerEvaluation>
  ): R7DualRangeBiomarkerEvaluation => ({
    observation: obs,
    marker_label_en: labelEn,
    marker_label_bn: labelBn,
    panel: obs.panel,
    reference_status: refStatus,
    exploratory_functional_status: 'not_supported',
    layer1_reference_interval: {
      low: layer1.low,
      high: layer1.high,
      unit: obs.canonical_unit || obs.original_unit,
      display: layer1.display,
      provenance: layer1.provenance,
      source_note: layer1.populationNotes
    },
    safety_severity: severity,
    is_critical_finding: severity === 'critical',
    is_urgent_verification_required: severity === 'critical' && (obs.verification_status === 'unverified' || obs.verification_status === 'patient_reported'),
    insight_en: insightEn,
    insight_bn: insightBn,
    related_systems: def?.related_systems || [],
    evidence_ids: def?.evidence_ids || [],
    population_notes: layer1.populationNotes,
    ...extra
  });

  if (obs.availability === 'pending') {
    return baseReturn('result_pending', 'Result pending — no automated interpretation performed.', 'ফলাফল অপেক্ষমাণ — কোনো স্বয়ংক্রিয় ব্যাখ্যা তৈরি হয়নি।');
  }
  if (obs.availability === 'not_tested' || obs.availability === 'declined_unavailable') {
    return baseReturn('not_assessed', 'Not tested / unavailable.', 'পরীক্ষা করা হয়নি বা অনুপলব্ধ।');
  }
  if (obs.data_quality_flags.includes('conflicting_duplicate_results')) {
    return baseReturn(
      'conflicting_results',
      'Conflicting duplicate laboratory results exist for this biomarker. Clinician reconciliation required.',
      'এই বায়োমার্কারের জন্য পরস্পরবিরোধী ফলাফল পাওয়া গেছে। চিকিৎসকের পুনর্মিলন আবশ্যক।',
      'moderate_review'
    );
  }
  if (!obs.is_interpretable || obs.availability === 'invalid') {
    const unitIssue = obs.data_quality_flags.includes('unsupported_unit') || obs.data_quality_flags.includes('missing_unit');
    return baseReturn(
      unitIssue || obs.availability === 'invalid' ? 'clinical_review_required' : 'indeterminate',
      unitIssue
        ? `Unsupported or missing unit ("${obs.original_unit || 'none'}"); numeric interpretation suppressed.`
        : 'Malformed or uninterpretable laboratory entry; clinician verification required.',
      unitIssue
        ? 'অসমর্থিত বা অনুপস্থিত একক; নিরাপদ থাকার জন্য স্বয়ংক্রিয় ব্যাখ্যা স্থগিত।'
        : 'অসম্পূর্ণ বা ত্রুটিপূর্ণ ল্যাব মান; চিকিৎসকের যাচাইকরণ প্রয়োজন।',
      'moderate_review'
    );
  }

  if (layer1.isAdultIntervalInapplicableToPediatric) {
    return baseReturn(
      'not_applicable',
      layer1.populationNotes || 'Adult threshold not applicable to pediatric patient without age-calibrated laboratory range.',
      'শিশু রোগীর জন্য প্রাপ্তবয়স্কদের ল্যাব সীমা প্রযোজ্য নয়।',
      'info'
    );
  }

  const val = obs.normalized_value!;
  const isInequality = !obs.is_exact_measurement && Boolean(obs.inequality_operator);

  // Determine Layer 1 Reference Interval Position
  let refStatus: R7BiomarkerClassificationStatus = 'indeterminate';
  if (isInequality) {
    refStatus = 'indeterminate';
  } else if (layer1.low !== undefined && val < layer1.low) {
    refStatus = 'below_reference_interval';
  } else if (layer1.high !== undefined && val > layer1.high) {
    refStatus = 'above_reference_interval';
  } else if (layer1.low !== undefined || layer1.high !== undefined) {
    refStatus = 'within_reference_interval';
  }

  // Layer 2: Validated Clinical Decision Thresholds
  let layer2: R7DualRangeBiomarkerEvaluation['layer2_decision_threshold'];
  let decisionStatus: R7BiomarkerClassificationStatus | undefined;
  let severity: R7SafetySeverity = 'none';
  let insightEn = '';
  let insightBn = '';

  const cid = obs.canonical_marker_id;

  if (cid === 'hba1c') {
    const isPreg = population.pregnancy?.active;
    if (isPreg) {
      layer2 = {
        threshold_label_en: 'Pregnancy Glycemic Context',
        threshold_label_bn: 'গর্ভকালীন গ্লুকোজ প্রেক্ষাপট',
        threshold_display: 'OGTT preferred over HbA1c for GDM diagnosis (ADA 2026)',
        met: val >= 6.5,
        evidence_id: 'EVID_ADA_2026_GLYCEMIC'
      };
    } else {
      const metDiabetes = val >= 6.5;
      const metPrediabetes = val >= 5.7 && val < 6.5;
      layer2 = {
        threshold_label_en: metDiabetes ? 'ADA Diabetes Decision Threshold (>=6.5%)' : 'ADA Prediabetes Range (5.7–6.4%)',
        threshold_label_bn: metDiabetes ? 'এডিএ ডায়াবেটিস সীমা (>=৬.৫%)' : 'এডিএ প্রি-ডায়াবেটিস সীমা (৫.৭–৬.৪%)',
        threshold_display: metDiabetes ? '>= 6.5%' : '5.7 – 6.4%',
        met: metDiabetes || metPrediabetes,
        evidence_id: 'EVID_ADA_2026_GLYCEMIC',
        requires_confirmatory_repeat: metDiabetes
      };
      if (metDiabetes) {
        decisionStatus = 'meets_clinical_decision_threshold';
        severity = 'moderate_review';
        insightEn = 'HbA1c >=6.5% meets the ADA hyperglycemia diagnostic threshold (confirm unless unequivocal).';
        insightBn = 'HbA1c >=৬.৫% এডিএ ডায়াবেটিস সীমা অতিক্রম করেছে।';
      } else if (val < 4.0) {
        insightEn = 'HbA1c below lower reference (<4.0%): does NOT meet diabetes threshold; review for hypoglycemia or altered RBC lifespan.';
        insightBn = 'স্বাভাবিকের নিচে HbA1c (<৪.০%): এটি ডায়াবেটিস নয়।';
      } else if (metPrediabetes) {
        decisionStatus = 'meets_clinical_decision_threshold';
        insightEn = 'HbA1c 5.7–6.4% falls in the ADA prediabetes risk range (below the 6.5% diabetes threshold).';
        insightBn = 'HbA1c ৫.৭–৬.৪% প্রি-ডায়াবেটিস ঝুঁকি সীমায় আছে (ডায়াবেটিস সীমার নিচে)।';
      } else {
        insightEn = 'HbA1c is below both prediabetes (<5.7%) and diabetes (<6.5%) ADA thresholds.';
        insightBn = 'HbA1c প্রি-ডায়াবেটিস ও ডায়াবেটিস সীমার নিচে (স্বাভাবিক) রয়েছে।';
      }
    }
  } else if (cid === 'fasting_glucose') {
    if (val < 54) {
      refStatus = 'critical_low';
      severity = 'critical';
      insightEn = 'CRITICAL LOW Fasting Glucose (<54 mg/dL / <3.0 mmol/L): clinically significant hypoglycemia — urgent clinical intervention/verification needed.';
      insightBn = 'মারাত্মক নিম্ন গ্লুকোজ (<৫৪ মিলিগ্রাম/ডেসিলিটার): জরুরি চিকিৎসা পর্যালোচনা আবশ্যক।';
    } else if (val >= 400) {
      refStatus = 'critical_high';
      severity = 'critical';
      insightEn = 'CRITICAL HIGH Glucose (>=400 mg/dL): severe hyperglycemia crisis risk — urgent clinical assessment required.';
      insightBn = 'মারাত্মক উচ্চ গ্লুকোজ (>=৪০০ মিলিগ্রাম/ডেসিলিটার): জরুরি চিকিৎসা পর্যালোচনা আবশ্যক।';
    } else if (val >= 126) {
      decisionStatus = 'meets_clinical_decision_threshold';
      severity = 'moderate_review';
      layer2 = {
        threshold_label_en: 'ADA Fasting Diabetes Threshold (>=126 mg/dL)',
        threshold_label_bn: 'এডিএ ফাস্টিং ডায়াবেটিস সীমা (>=১২৬ mg/dL)',
        threshold_display: '>= 126 mg/dL (7.0 mmol/L)',
        met: true,
        evidence_id: 'EVID_ADA_2026_GLYCEMIC',
        requires_confirmatory_repeat: true
      };
      insightEn = 'Normalized fasting glucose >=126 mg/dL (>=7.0 mmol/L) meets ADA fasting diabetes threshold.';
      insightBn = 'খালি পেটে গ্লুকোজ ১২৬ মিলিগ্রাম/ডেসিলিটারের বেশি বা সমান।';
    } else if (val >= 100) {
      decisionStatus = 'meets_clinical_decision_threshold';
      layer2 = {
        threshold_label_en: 'ADA Impaired Fasting Glucose (100–125 mg/dL)',
        threshold_label_bn: 'ইমপেয়ার্ড ফাস্টিং গ্লুকোজ (১০০–১২৫ mg/dL)',
        threshold_display: '100–125 mg/dL (5.6–6.9 mmol/L)',
        met: true,
        evidence_id: 'EVID_ADA_2026_GLYCEMIC'
      };
      insightEn = 'Normalized fasting glucose 100–125 mg/dL meets IFG range (below 126 mg/dL diabetes limit).';
      insightBn = 'খালি পেটে গ্লুকোজ সীমান্তবর্তী (১০০–১২৫ mg/dL)।';
    } else if (val < 70) {
      insightEn = 'Low fasting glucose (<70 mg/dL / <3.9 mmol/L): hypoglycemia range — distinct from hyperglycemia.';
      insightBn = 'স্বাভাবিকের নিচে ফাস্টিং গ্লুকোজ (<৭০ mg/dL) — হাইপোগ্লাইসেমিয়া ঝুঁকি।';
    } else {
      insightEn = 'Normalized fasting glucose within normal reference interval (70–99 mg/dL).';
      insightBn = 'খালি পেটে গ্লুকোজ স্বাভাবিক সীমায় রয়েছে।';
    }
  } else if (cid === 'potassium') {
    if (val >= 6.0) {
      refStatus = 'critical_high';
      severity = 'critical';
      layer2 = {
        threshold_label_en: 'Critical Hyperkalemia Alert (>=6.0 mmol/L)',
        threshold_label_bn: 'মারাত্মক হাইপারক্যালেমিয়া (>=৬.০ mmol/L)',
        threshold_display: '>= 6.0 mmol/L',
        met: true,
        evidence_id: 'EVID_KDIGO_2024_CKD'
      };
      insightEn = 'CRITICAL HIGH Serum Potassium (>=6.0 mmol/L): acute arrhythmia hazard requiring immediate medical escalation (cannot be managed via autonomous dietary K limits alone).';
      insightBn = 'মারাত্মক উচ্চ পটাশিয়াম (>=৬.০ mmol/L): জরুরি মেডিকেল মূল্যায়ন ও ইসিজি পর্যালোচনা আবশ্যক।';
    } else if (val < 2.5) {
      refStatus = 'critical_low';
      severity = 'critical';
      insightEn = 'CRITICAL LOW Serum Potassium (<2.5 mmol/L): urgent medical evaluation required.';
      insightBn = 'মারাত্মক নিম্ন পটাশিয়াম (<২.৫ mmol/L): জরুরি মেডিকেল মূল্যায়ন আবশ্যক।';
    } else if (val > 5.0) {
      severity = 'moderate_review';
      insightEn = 'Elevated serum potassium (>5.0 mmol/L): assess renal function, K-retaining drugs, pseudohyperkalemia, and dietary review.';
      insightBn = 'উচ্চ সিরাম পটাশিয়াম (>৫.০ mmol/L): কিডনি ও ওষুধ পর্যালোচনা প্রয়োজন।';
    } else if (val < 3.5) {
      severity = 'moderate_review';
      insightEn = 'Low serum potassium (<3.5 mmol/L): potassium restriction contraindicated; investigate losses.';
      insightBn = 'নিম্ন সিরাম পটাশিয়াম (<৩.৫ mmol/L): পটাশিয়াম সীমাবদ্ধ করা নিষিদ্ধ।';
    } else {
      insightEn = 'Serum potassium within normal reference interval (3.5–5.0 mmol/L).';
      insightBn = 'সিরাম পটাশিয়াম স্বাভাবিক সীমায় আছে।';
    }
  } else if (cid === 'vitamin_d3') {
    if (val > 150) {
      refStatus = 'critical_high';
      severity = 'critical';
      insightEn = 'CRITICAL HIGH 25(OH)D (>150 ng/mL): Vitamin D excess / hypercalcemia risk — stop supplements and assess serum calcium.';
      insightBn = 'অত্যন্ত উচ্চ ভিটামিন ডি (>১৫০ ng/mL): বিষক্রিয়া ঝুঁকি — সাপ্লিমেন্ট বন্ধ করে ক্যালসিয়াম পরীক্ষা করুন।';
    } else if (val > 100) {
      severity = 'moderate_review';
      insightEn = 'Elevated 25(OH)D (>100 ng/mL): above upper reference threshold — NOT deficient; stop excess empiric dosing.';
      insightBn = 'স্বাভাবিকের বেশি ভিটামিন ডি (>১০০ ng/mL): এটি ঘাটতি নয়।';
    } else if (val < 20) {
      decisionStatus = 'meets_clinical_decision_threshold';
      layer2 = {
        threshold_label_en: 'Low 25(OH)D (<20 ng/mL)',
        threshold_label_bn: 'নিম্ন ভিটামিন ডি (<২০ ng/mL)',
        threshold_display: '< 20 ng/mL (50 nmol/L)',
        met: true,
        evidence_id: 'EVID_ENDOCRINE_2024_VITD'
      };
      insightEn = '25(OH)D below 20 ng/mL (50 nmol/L); evaluate clinically per Endocrine Society 2024 guidance.';
      insightBn = 'ভিটামিন ডি ২০ ng/mL-এর নিচে; ক্লিনিক্যাল মূল্যায়ন প্রয়োজন।';
    } else {
      insightEn = '25(OH)D within 20–100 ng/mL reference range.';
      insightBn = 'ভিটামিন ডি প্রচলিত স্বাভাবিক সীমার মধ্যে রয়েছে।';
    }
  } else if (cid === 'ferritin') {
    const crpVal = allObsByMarker?.hs_crp?.normalized_value ?? allObsByMarker?.crp?.normalized_value;
    const isInflamed = crpVal !== undefined && crpVal > 3.0;
    if (val < 15) {
      decisionStatus = 'meets_clinical_decision_threshold';
      layer2 = {
        threshold_label_en: 'WHO Iron Store Depletion (<15 ng/mL)',
        threshold_label_bn: 'ডব্লিউএইচও আয়রন ঘাটতি সীমা (<১৫ ng/mL)',
        threshold_display: '< 15 ng/mL (µg/L)',
        met: true,
        evidence_id: 'EVID_WHO_2020_FERRITIN'
      };
      insightEn = 'Ferritin <15 ng/mL satisfies WHO threshold for depleted iron stores.';
      insightBn = 'ফেরিটিন ১৫ ng/mL-এর নিচে, যা আয়রন সঞ্চয় ঘাটতি নির্দেশ করে।';
    } else if (refStatus === 'above_reference_interval' && isInflamed) {
      insightEn = `Elevated ferritin (${roundDisplay(val)} ng/mL) concurrent with elevated CRP (${roundDisplay(crpVal!)} mg/L): inflammation elevates acute-phase ferritin and can mask iron deficiency; check TSAT/TIBC.`;
      insightBn = 'উচ্চ প্রদাহের (CRP) সাথে উচ্চ ফেরিটিন: প্রদাহ আয়রন ঘাটতিকে আড়াল করতে পারে; টিস্যাট পরীক্ষা প্রয়োজন।';
    } else if (refStatus === 'above_reference_interval') {
      insightEn = 'Elevated ferritin above reference interval: evaluate for inflammation, liver injury, or iron overload (with TSAT).';
      insightBn = 'উচ্চ ফেরিটিন: প্রদাহ, লিভার চাপ বা অতিরিক্ত আয়রন মূল্যায়ন প্রয়োজন।';
    } else {
      insightEn = isInflamed
        ? 'Ferritin is within numeric reference interval, but elevated CRP may artificially elevate ferritin.'
        : 'Serum ferritin within reference interval.';
      insightBn = 'ফেরিটিন প্রচলিত সীমার মধ্যে রয়েছে।';
    }
  } else if (cid === 'tsh') {
    if (val < 0.05) {
      refStatus = 'critical_low';
      severity = 'critical';
      insightEn = 'Markedly suppressed TSH (<0.05 µIU/mL): evaluate for overt hyperthyroidism or over-replacement.';
      insightBn = 'অত্যন্ত কম টিএসএইচ (<০.০৫): জরুরি থাইরয়েড পর্যালোচনা আবশ্যক।';
    } else if (refStatus === 'within_reference_interval') {
      insightEn = 'TSH is within the laboratory reference interval; values inside normal reference do NOT diagnose hypothyroidism.';
      insightBn = 'টিএসএইচ স্বাভাবিক ল্যাব সীমার মধ্যে; এটি হাইপোথাইরয়েড রোগ নিশ্চিত করে না।';
    } else if (refStatus === 'above_reference_interval') {
      severity = val > 10 ? 'moderate_review' : 'info';
      insightEn = 'Elevated TSH above reference interval: evaluate with Free T4 and antibodies before diagnostic conclusions.';
      insightBn = 'ল্যাব সীমার উপরে টিএসএইচ: ফ্রি টি৪ সহ চিকিৎসকের মূল্যায়ন প্রয়োজন।';
    } else {
      insightEn = 'TSH below reference interval: evaluate with Free T4/T3 and thyroid hormone dose.';
      insightBn = 'ল্যাব সীমার নিচে টিএসএইচ: ফ্রি টি৪ সহ পর্যালোচনা প্রয়োজন।';
    }
  } else if (cid === 'reported_egfr') {
    if (val < 15) {
      refStatus = 'critical_low';
      severity = 'critical';
      insightEn = 'CRITICAL LOW eGFR (<15 mL/min/1.73m²): requires immediate nephrology/medical co-management.';
      insightBn = 'অত্যন্ত কম ইজিএফআর (<১৫): অবিলম্বে নেফ্রোলজি পরামর্শ আবশ্যক।';
    } else if (val < 60) {
      decisionStatus = 'meets_clinical_decision_threshold';
      severity = 'moderate_review';
      layer2 = {
        threshold_label_en: 'KDIGO Reduced eGFR (<60 mL/min/1.73m²)',
        threshold_label_bn: 'কেডিগো নিম্ন ইজিএফআর (<৬০)',
        threshold_display: '< 60 mL/min/1.73m² (chronicity requires >=3 months persistence)',
        met: true,
        evidence_id: 'EVID_KDIGO_2024_CKD',
        requires_confirmatory_repeat: true
      };
      insightEn = 'Single eGFR <60 mL/min/1.73m² indicates reduced filtration requiring review and repeat verification >=3 months before diagnosing chronic kidney disease.';
      insightBn = 'একক eGFR <৬০ হলেই দীর্ঘস্থায়ী কিডনি রোগ (CKD) নিশ্চিত হয় না; ৩ মাস পর পুনরায় পরীক্ষা ও চিকিৎসকের মূল্যায়ন আবশ্যক।';
    } else {
      insightEn = 'Reported eGFR >=60 mL/min/1.73m².';
      insightBn = 'রিপোর্টেড ইজিএফআর স্বাভাবিক সীমায় আছে।';
    }
  } else if (cid === 'sodium' && (val < 120 || val >= 160)) {
    refStatus = val < 120 ? 'critical_low' : 'critical_high';
    severity = 'critical';
    insightEn = `CRITICAL Sodium (${roundDisplay(val)} mmol/L): severe dysnatremia requiring urgent medical evaluation.`;
    insightBn = `মারাত্মক অস্বাভাবিক সোডিয়াম (${roundDisplay(val)} mmol/L): জরুরি মেডিকেল মূল্যায়ন আবশ্যক।`;
  } else if (cid === 'hemoglobin' && val < 7.0) {
    refStatus = 'critical_low';
    severity = 'critical';
    insightEn = 'CRITICAL LOW Hemoglobin (<7.0 g/dL): severe anemia requiring urgent medical evaluation.';
    insightBn = 'মারাত্মক নিম্ন হিমোগ্লোবিন (<৭.০ g/dL): জরুরি মেডিকেল মূল্যায়ন আবশ্যক।';
  } else if (cid === 'platelets' && val < 50) {
    refStatus = 'critical_low';
    severity = 'critical';
    insightEn = 'CRITICAL LOW Platelets (<50 x10⁹/L): thrombocytopenia bleeding hazard requiring urgent review.';
    insightBn = 'মারাত্মক নিম্ন প্লাটিলেট (<৫০): জরুরি মেডিকেল মূল্যায়ন আবশ্যক।';
  } else if (cid === 'triglycerides' && val >= 500) {
    severity = val >= 1000 ? 'critical' : 'moderate_review';
    if (val >= 1000) refStatus = 'critical_high';
    insightEn = val >= 1000
      ? 'CRITICAL Severe Hypertriglyceridemia (>=1000 mg/dL): high acute pancreatitis risk — urgent clinician management required.'
      : 'Markedly elevated triglycerides (>=500 mg/dL): assess pancreatitis risk and clinical lipid therapy.';
    insightBn = 'অত্যন্ত উচ্চ ট্রাইগ্লিসারাইড (>=৫০০ mg/dL): চিকিৎসকের জরুরি মূল্যায়ন প্রয়োজন।';
  } else if (cid === 'homocysteine' && val > 15.0) {
    insightEn = 'Elevated homocysteine (>15 µmol/L): non-specific finding reflecting folate, B12, B6, renal, or genetic context — does not alone establish a single deficiency.';
    insightBn = 'উচ্চ হোমোসিস্টিন (>১৫ µmol/L): অ-নির্দিষ্ট সূচক; একক ঘাটতি নিশ্চিত করে না।';
  } else if (isInequality) {
    insightEn = `Non-exact inequality value (${obs.inequality_operator} ${obs.original_value} ${obs.original_unit}) preserved without fabricating an exact midpoint.`;
    insightBn = 'অসমতা মান সংরক্ষণ করা হয়েছে; কাল্পনিক সঠিক সংখ্যা তৈরি করা হয়নি।';
  } else if (refStatus === 'within_reference_interval') {
    insightEn = `${labelEn} is within reference interval.`;
    insightBn = `${labelBn} স্বাভাবিক রেফারেন্স সীমার মধ্যে রয়েছে।`;
  } else if (refStatus === 'below_reference_interval') {
    insightEn = `${labelEn} is below reference interval.`;
    insightBn = `${labelBn} স্বাভাবিক রেফারেন্স সীমার নিচে রয়েছে।`;
  } else if (refStatus === 'above_reference_interval') {
    insightEn = `${labelEn} is above reference interval.`;
    insightBn = `${labelBn} স্বাভাবিক রেফারেন্স সীমার উপরে রয়েছে।`;
  } else {
    insightEn = `${labelEn} recorded (${obs.display_normalized_value ?? obs.original_value} ${obs.canonical_unit || obs.original_unit || ''}); automated reference unavailable.`;
    insightBn = `${labelBn} সংরক্ষিত হয়েছে; স্বয়ংক্রিয় রেফারেন্স সীমা নেই।`;
  }

  // Unverified critical or abnormal escalation rule
  const isUnverifiedUrgent =
    severity === 'critical' &&
    (obs.verification_status === 'unverified' ||
      obs.verification_status === 'patient_reported' ||
      obs.verification_status === 'imported_unreconciled');

  // Layer 3: Exploratory Functional Range (never overrides Layers 1/2!)
  let exploratoryStatus: R7DualRangeBiomarkerEvaluation['exploratory_functional_status'] = 'not_supported';
  let layer3: R7DualRangeBiomarkerEvaluation['layer3_exploratory_functional'];
  if (def?.exploratory_functional_range && !isInequality && def.population_applicability !== 'adult_only') {
    const exp = def.exploratory_functional_range;
    const inExp =
      (exp.low === undefined || val >= exp.low) &&
      (exp.high === undefined || val <= exp.high);
    exploratoryStatus = inExp ? 'within_exploratory_zone' : 'outside_exploratory_zone';
    layer3 = {
      low: exp.low,
      high: exp.high,
      unit: obs.canonical_unit,
      display: exp.text,
      note_en: exp.disclaimer_en,
      note_bn: exp.disclaimer_bn,
      is_exploratory: true
    };
  }

  return baseReturn(
    obs.verification_status === 'unverified' && severity === 'none' && refStatus === 'indeterminate'
      ? 'unverified_result'
      : refStatus,
    insightEn,
    insightBn,
    severity,
    {
      clinical_decision_status: decisionStatus,
      exploratory_functional_status: exploratoryStatus,
      layer2_decision_threshold: layer2,
      layer3_exploratory_functional: layer3,
      is_critical_finding: severity === 'critical',
      is_urgent_verification_required: isUnverifiedUrgent
    }
  );
}

/**
 * Computes all 9 evidence-supported derived biomarker calculations with strict input provenance,
 * fasting/specimen/date compatibility, divide-by-zero rejection, and population eligibility.
 */
export function computeR7DerivedBiomarkers(options: {
  observations: Record<string, R7NormalizedLabObservation>;
  patient: Partial<PatientProfile>;
  population: R5PopulationProfile;
}): R7DerivedBiomarkerResult[] {
  const { observations: obs, patient, population } = options;
  const results: R7DerivedBiomarkerResult[] = [];

  const getUsable = (id: string) => {
    const o = obs[id];
    if (!o || !isEligibleCanonicalScalarObservation(o)) return undefined;
    return o;
  };

  // 1. HOMA-IR (Checkpoint C: strictly requires paired same-day fasting blood draw, documented fasting_status='fasting' on BOTH, confirmed verification, and no exogenous insulin)
  {
    const fbg = getUsable('fasting_glucose');
    const ins = getUsable('fasting_insulin');
    const onExogenousInsulin =
      (patient.medication_records || []).some(
        m => m.status === 'active' && (m.generic_name || '').toLowerCase().includes('insulin')
      ) ||
      (patient.active_medications || []).some(m => m.toLowerCase().includes('insulin'));

    if (fbg && ins) {
      const sameEpisode = datesCompatibleForRatio(fbg.collection_datetime, ins.collection_datetime, 0, {
        requireDates: true,
        reportId1: fbg.lab_report_id,
        reportId2: ins.lab_report_id
      });
      const specOk = specimensCompatibleForRatio(fbg.specimen_type, ins.specimen_type);
      const bothDocumentedFasting = fbg.fasting_status === 'fasting' && ins.fasting_status === 'fasting';
      const bothVerified =
        (fbg.verification_status === 'clinician_verified' || fbg.verification_status === 'lab_document_reviewed') &&
        (ins.verification_status === 'clinician_verified' || ins.verification_status === 'lab_document_reviewed');

      if (onExogenousInsulin) {
        results.push({
          derived_id: 'homa_ir',
          name_en: 'HOMA-IR Insulin Resistance Index',
          name_bn: 'হোমা-আইআর (HOMA-IR)',
          formula_id: 'MATTHEWS_HOMAIR_1985',
          formula_version: 'v1.0',
          status: 'not_applicable',
          input_observation_ids: [fbg.observation_id, ins.observation_id],
          input_summary: [
            { marker_id: 'fasting_glucose', value: fbg.normalized_value, unit: fbg.canonical_unit, collection_datetime: fbg.collection_datetime, verification_status: fbg.verification_status },
            { marker_id: 'fasting_insulin', value: ins.normalized_value, unit: ins.canonical_unit, collection_datetime: ins.collection_datetime, verification_status: ins.verification_status }
          ],
          eligibility_met: false,
          ineligibility_reason_en: 'HOMA-IR is invalid in patients receiving exogenous insulin therapy.',
          ineligibility_reason_bn: 'বহিঃস্থ ইনসুলিন ব্যবহারকারীদের ক্ষেত্রে HOMA-IR প্রযোজ্য নয়।',
          evidence_source_id: 'EVID_MATTHEWS_1985_HOMAIR',
          limitations_en: 'Unreliable under exogenous insulin or beta-cell failure.',
          limitations_bn: 'ইনসুলিন থেরাপিতে অকার্যকর।'
        });
      } else if (!bothDocumentedFasting) {
        results.push({
          derived_id: 'homa_ir',
          name_en: 'HOMA-IR Insulin Resistance Index',
          name_bn: 'হোমা-আইআর (HOMA-IR)',
          formula_id: 'MATTHEWS_HOMAIR_1985',
          formula_version: 'v1.0',
          status: 'not_applicable',
          input_observation_ids: [fbg.observation_id, ins.observation_id],
          input_summary: [],
          eligibility_met: false,
          ineligibility_reason_en:
            fbg.fasting_status === 'nonfasting' || ins.fasting_status === 'nonfasting'
              ? 'Fasting compatibility failed (sample documented as non-fasting).'
              : 'HOMA-IR requires documented fasting status on both glucose and insulin (unknown fasting state is ineligible).',
          ineligibility_reason_bn: 'খালি পেটের নমুনা নিশ্চিত না হলে বা নন-ফাস্টিং হলে HOMA-IR হিসাবযোগ্য নয়।',
          evidence_source_id: 'EVID_MATTHEWS_1985_HOMAIR',
          limitations_en: 'Requires documented fasting state on both paired draws.',
          limitations_bn: 'উভয় পরীক্ষায় ফাস্টিং অবস্থা নথিভুক্ত থাকা আবশ্যক।'
        });
      } else if (!bothVerified) {
        results.push({
          derived_id: 'homa_ir',
          name_en: 'HOMA-IR Insulin Resistance Index',
          name_bn: 'হোমা-আইআর (HOMA-IR)',
          formula_id: 'MATTHEWS_HOMAIR_1985',
          formula_version: 'v1.0',
          status: 'unavailable',
          input_observation_ids: [fbg.observation_id, ins.observation_id],
          input_summary: [],
          eligibility_met: false,
          ineligibility_reason_en: 'Unverified glucose or insulin entries cannot produce a verified derived HOMA-IR calculation.',
          ineligibility_reason_bn: 'অযাচাইকৃত ফলাফল থেকে নির্ভরযোগ্য HOMA-IR হিসাব করা যায় না।',
          evidence_source_id: 'EVID_MATTHEWS_1985_HOMAIR',
          limitations_en: 'Requires clinician-verified or lab-reviewed glucose and insulin.',
          limitations_bn: 'যাচাইকৃত ফলাফল প্রয়োজন।'
        });
      } else if (!sameEpisode || !specOk) {
        results.push({
          derived_id: 'homa_ir',
          name_en: 'HOMA-IR Insulin Resistance Index',
          name_bn: 'হোমা-আইআর (HOMA-IR)',
          formula_id: 'MATTHEWS_HOMAIR_1985',
          formula_version: 'v1.0',
          status: 'unavailable',
          input_observation_ids: [fbg.observation_id, ins.observation_id],
          input_summary: [],
          eligibility_met: false,
          ineligibility_reason_en: !sameEpisode
            ? 'HOMA-IR requires same-day paired collection dates (or shared laboratory report ID); missing or multi-day mismatched draws excluded.'
            : 'Incompatible specimen types for paired HOMA-IR.',
          ineligibility_reason_bn: 'একই দিনের নমুনা বা অভিন্ন ল্যাব রিপোর্ট আইডি ছাড়া HOMA-IR হিসাবযোগ্য নয়।',
          evidence_source_id: 'EVID_MATTHEWS_1985_HOMAIR',
          limitations_en: 'Paired same-day fasting blood draw required.',
          limitations_bn: 'একই দিনের ফাস্টিং নমুনা প্রয়োজন।'
        });
      } else {
        const val = (fbg.normalized_value! * ins.normalized_value!) / 405;
        results.push({
          derived_id: 'homa_ir',
          name_en: 'HOMA-IR Insulin Resistance Index',
          name_bn: 'হোমা-আইআর (HOMA-IR)',
          formula_id: 'MATTHEWS_HOMAIR_1985',
          formula_version: 'v1.0',
          status: 'calculated',
          value: val,
          display_value: roundDisplay(val, 2).toString(),
          unit: 'Index',
          input_observation_ids: [fbg.observation_id, ins.observation_id],
          input_summary: [
            { marker_id: 'fasting_glucose', value: fbg.display_normalized_value, unit: fbg.canonical_unit, collection_datetime: fbg.collection_datetime, verification_status: fbg.verification_status },
            { marker_id: 'fasting_insulin', value: ins.display_normalized_value, unit: ins.canonical_unit, collection_datetime: ins.collection_datetime, verification_status: ins.verification_status }
          ],
          eligibility_met: true,
          evidence_source_id: 'EVID_MATTHEWS_1985_HOMAIR',
          limitations_en: 'Same-day paired fasting inputs verified. No single universal HOMA-IR diagnostic threshold applies across all populations.',
          limitations_bn: 'একই দিনের ফাস্টিং নমুনা থেকে গণনাকৃত; সর্বজনীন একক ডায়াগনস্টিক সীমা প্রযোজ্য নয়।',
          interpretation_en: val >= 2.5 ? 'Elevated HOMA-IR (>=2.5); interpret in metabolic context.' : 'Lower/normal HOMA-IR index.',
          interpretation_bn: val >= 2.5 ? 'উচ্চ হোমা-আইআর প্রবণতা।' : 'স্বাভাবিক সীমার হোমা-আইআর।'
        });
      }
    }
  }

  // 2. TG/HDL Ratio
  {
    const tg = getUsable('triglycerides');
    const hdl = getUsable('hdl');
    if (tg && hdl) {
      if (hdl.normalized_value! <= 0 || !datesCompatibleForRatio(tg.collection_datetime, hdl.collection_datetime, 14)) {
        results.push({
          derived_id: 'tg_hdl_ratio',
          name_en: 'Triglyceride / HDL Ratio',
          name_bn: 'টিজি / এইচডিএল অনুপাত',
          formula_id: 'LIPID_TG_HDL_MGDL',
          formula_version: 'v1.0',
          status: 'unavailable',
          input_observation_ids: [tg.observation_id, hdl.observation_id],
          input_summary: [],
          eligibility_met: false,
          ineligibility_reason_en: hdl.normalized_value! <= 0 ? 'Invalid HDL denominator (<=0).' : 'Collection dates incompatible (>14 days apart).',
          evidence_source_id: 'EVID_AHA_ACC_LIPIDS',
          limitations_en: 'Cannot divide by zero or compare disparate dates.',
          limitations_bn: 'গণনা অযোগ্য।'
        });
      } else {
        const val = tg.normalized_value! / hdl.normalized_value!;
        results.push({
          derived_id: 'tg_hdl_ratio',
          name_en: 'Triglyceride / HDL Ratio',
          name_bn: 'টিজি / এইচডিএল অনুপাত',
          formula_id: 'LIPID_TG_HDL_MGDL',
          formula_version: 'v1.0',
          status: 'calculated',
          value: val,
          display_value: roundDisplay(val, 2).toString(),
          unit: 'mg/dL ratio',
          input_observation_ids: [tg.observation_id, hdl.observation_id],
          input_summary: [
            { marker_id: 'triglycerides', value: tg.display_normalized_value, unit: 'mg/dL', collection_datetime: tg.collection_datetime, verification_status: tg.verification_status },
            { marker_id: 'hdl', value: hdl.display_normalized_value, unit: 'mg/dL', collection_datetime: hdl.collection_datetime, verification_status: hdl.verification_status }
          ],
          eligibility_met: true,
          evidence_source_id: 'EVID_AHA_ACC_LIPIDS',
          limitations_en: 'Computed from normalized mg/dL values; surrogate cardiometabolic indicator only — does NOT directly measure LDL particle diameter.',
          limitations_bn: 'এটি এলডিএল কণার আকার সরাসরি পরিমাপ করে না।'
        });
      }
    }
  }

  // 3. Non-HDL Cholesterol
  {
    const tc = getUsable('total_cholesterol');
    const hdl = getUsable('hdl');
    if (tc && hdl && datesCompatibleForRatio(tc.collection_datetime, hdl.collection_datetime, 14) && tc.normalized_value! >= hdl.normalized_value!) {
      const val = tc.normalized_value! - hdl.normalized_value!;
      results.push({
        derived_id: 'non_hdl',
        name_en: 'Non-HDL Cholesterol',
        name_bn: 'নন-এইচডিএল কোলেস্টেরল',
        formula_id: 'AHA_NON_HDL_TC_MINUS_HDL',
        formula_version: 'v1.0',
        status: 'calculated',
        value: val,
        display_value: roundDisplay(val, 1).toString(),
        unit: 'mg/dL',
        input_observation_ids: [tc.observation_id, hdl.observation_id],
        input_summary: [
          { marker_id: 'total_cholesterol', value: tc.display_normalized_value, unit: 'mg/dL', collection_datetime: tc.collection_datetime, verification_status: tc.verification_status },
          { marker_id: 'hdl', value: hdl.display_normalized_value, unit: 'mg/dL', collection_datetime: hdl.collection_datetime, verification_status: hdl.verification_status }
        ],
        eligibility_met: true,
        evidence_source_id: 'EVID_AHA_ACC_LIPIDS',
        limitations_en: 'Non-fasting compatible; risk target depends on overall ASCVD risk profile.',
        limitations_bn: 'সামগ্রিক হৃদরোগ ঝুঁকি অনুযায়ী লক্ষ্যমাত্রা নির্ধারিত হয়।'
      });
    }
  }

  // 4. Transferrin Saturation (TSAT %)
  {
    const fe = getUsable('serum_iron');
    const tibc = getUsable('tibc');
    if (fe && tibc) {
      if (tibc.normalized_value! <= 0 || !datesCompatibleForRatio(fe.collection_datetime, tibc.collection_datetime, 14) || !specimensCompatibleForRatio(fe.specimen_type, tibc.specimen_type)) {
        results.push({
          derived_id: 'transferrin_saturation',
          name_en: 'Transferrin Saturation (TSAT)',
          name_bn: 'ট্রান্সফেরিন স্যাচুরেশন (TSAT)',
          formula_id: 'TSAT_IRON_OVER_TIBC_PCT',
          formula_version: 'v1.0',
          status: 'unavailable',
          input_observation_ids: [fe.observation_id, tibc.observation_id],
          input_summary: [],
          eligibility_met: false,
          ineligibility_reason_en: 'Invalid TIBC denominator or incompatible specimen/dates.',
          evidence_source_id: 'EVID_WHO_2020_FERRITIN',
          limitations_en: 'Requires same-draw serum iron and TIBC.',
          limitations_bn: 'একই সময়ের সিরাম আয়রন ও টিআইবিসি প্রয়োজন।'
        });
      } else {
        const val = (fe.normalized_value! / tibc.normalized_value!) * 100;
        results.push({
          derived_id: 'transferrin_saturation',
          name_en: 'Transferrin Saturation (TSAT)',
          name_bn: 'ট্রান্সফেরিন স্যাচুরেশন (TSAT)',
          formula_id: 'TSAT_IRON_OVER_TIBC_PCT',
          formula_version: 'v1.0',
          status: 'calculated',
          value: val,
          display_value: roundDisplay(val, 1).toString(),
          unit: '%',
          input_observation_ids: [fe.observation_id, tibc.observation_id],
          input_summary: [
            { marker_id: 'serum_iron', value: fe.display_normalized_value, unit: 'µg/dL', collection_datetime: fe.collection_datetime, verification_status: fe.verification_status },
            { marker_id: 'tibc', value: tibc.display_normalized_value, unit: 'µg/dL', collection_datetime: tibc.collection_datetime, verification_status: tibc.verification_status }
          ],
          eligibility_met: true,
          evidence_source_id: 'EVID_WHO_2020_FERRITIN',
          limitations_en: 'Serum iron exhibits diurnal variation; interpret TSAT (<20% low iron availability, >45% iron overload screen) alongside ferritin and CRP.',
          limitations_bn: 'ফেরিটিন ও সিআরপির সাথে সমন্বয় করে মূল্যায়ন করুন।'
        });
      }
    }
  }

  // 5. AST/ALT Ratio (De Ritis)
  {
    const ast = getUsable('ast');
    const alt = getUsable('alt');
    if (ast && alt && alt.normalized_value! > 0 && datesCompatibleForRatio(ast.collection_datetime, alt.collection_datetime, 7)) {
      const val = ast.normalized_value! / alt.normalized_value!;
      results.push({
        derived_id: 'ast_alt_ratio',
        name_en: 'AST / ALT Ratio',
        name_bn: 'এএসটি / এএলটি অনুপাত',
        formula_id: 'DE_RITIS_AST_ALT',
        formula_version: 'v1.0',
        status: 'calculated',
        value: val,
        display_value: roundDisplay(val, 2).toString(),
        unit: 'Ratio',
        input_observation_ids: [ast.observation_id, alt.observation_id],
        input_summary: [
          { marker_id: 'ast', value: ast.display_normalized_value, unit: 'U/L', collection_datetime: ast.collection_datetime, verification_status: ast.verification_status },
          { marker_id: 'alt', value: alt.display_normalized_value, unit: 'U/L', collection_datetime: alt.collection_datetime, verification_status: alt.verification_status }
        ],
        eligibility_met: true,
        evidence_source_id: 'EVID_STERLING_2006_FIB4',
        limitations_en: 'Non-specific ratio; AST is also expressed in skeletal/cardiac muscle.',
        limitations_bn: 'মাংসপেশীর প্রভাবেও AST বাড়তে পারে।'
      });
    }
  }

  // 6. FIB-4 Index (Strictly gated for adults >=18y and positive denominators)
  {
    const ast = getUsable('ast');
    const alt = getUsable('alt');
    const plt = getUsable('platelets');
    if (ast && alt && plt) {
      const age = population.age;
      const isAdult = age !== undefined && age >= 18;
      const datesOk =
        datesCompatibleForRatio(ast.collection_datetime, alt.collection_datetime, 14) &&
        datesCompatibleForRatio(ast.collection_datetime, plt.collection_datetime, 14);
      if (!isAdult) {
        results.push({
          derived_id: 'fib4',
          name_en: 'FIB-4 Hepatic Fibrosis Score',
          name_bn: 'ফিব-৪ সূচক (FIB-4)',
          formula_id: 'STERLING_FIB4_2006',
          formula_version: 'v1.0',
          status: 'not_applicable',
          input_observation_ids: [ast.observation_id, alt.observation_id, plt.observation_id],
          input_summary: [],
          eligibility_met: false,
          ineligibility_reason_en: age === undefined ? 'Patient age unavailable for FIB-4.' : 'FIB-4 is not validated in pediatric/adolescent patients (<18 years).',
          ineligibility_reason_bn: '১৮ বছরের কম বয়সী বা বয়স অনুপস্থিত রোগীদের ক্ষেত্রে FIB-4 প্রযোজ্য নয়।',
          evidence_source_id: 'EVID_STERLING_2006_FIB4',
          limitations_en: 'Validated in adults >=18y (standard risk strata validated primarily for 35–65y; >=65y uses higher <2.0 rule-out cutoff).',
          limitations_bn: 'শিশুদের ক্ষেত্রে প্রযোজ্য নয়।'
        });
      } else if (plt.normalized_value! <= 0 || alt.normalized_value! <= 0 || !datesOk) {
        results.push({
          derived_id: 'fib4',
          name_en: 'FIB-4 Hepatic Fibrosis Score',
          name_bn: 'ফিব-৪ সূচক (FIB-4)',
          formula_id: 'STERLING_FIB4_2006',
          formula_version: 'v1.0',
          status: 'unavailable',
          input_observation_ids: [ast.observation_id, alt.observation_id, plt.observation_id],
          input_summary: [],
          eligibility_met: false,
          ineligibility_reason_en: !datesOk ? 'AST, ALT, and Platelets collection dates are incompatible (>14 days apart).' : 'Invalid zero/negative Platelets or ALT denominator.',
          evidence_source_id: 'EVID_STERLING_2006_FIB4',
          limitations_en: 'Requires positive Platelets and ALT from compatible dates.',
          limitations_bn: 'সামঞ্জস্যপূর্ণ তারিখ ও প্লেটলেট মান প্রয়োজন।'
        });
      } else {
        const val = (age! * ast.normalized_value!) / (plt.normalized_value! * Math.sqrt(alt.normalized_value!));
        const ageCaution = age! < 35 || age! >= 65
          ? `Age ${age}y is outside prime 35–65y validation cohort (use age >=65 cutoff <2.0 if elderly; reduced accuracy if <35y).`
          : 'Non-invasive fibrosis screen (<1.3 low risk, 1.3–2.67 indeterminate, >2.67 high risk); does not diagnose cirrhosis alone.';
        results.push({
          derived_id: 'fib4',
          name_en: 'FIB-4 Hepatic Fibrosis Score',
          name_bn: 'ফিব-৪ সূচক (FIB-4)',
          formula_id: 'STERLING_FIB4_2006',
          formula_version: 'v1.0',
          status: 'calculated',
          value: val,
          display_value: roundDisplay(val, 2).toString(),
          unit: 'Index',
          input_observation_ids: [ast.observation_id, alt.observation_id, plt.observation_id],
          input_summary: [
            { marker_id: 'ast', value: ast.display_normalized_value, unit: 'U/L', collection_datetime: ast.collection_datetime, verification_status: ast.verification_status },
            { marker_id: 'alt', value: alt.display_normalized_value, unit: 'U/L', collection_datetime: alt.collection_datetime, verification_status: alt.verification_status },
            { marker_id: 'platelets', value: plt.display_normalized_value, unit: '10^9/L', collection_datetime: plt.collection_datetime, verification_status: plt.verification_status }
          ],
          eligibility_met: true,
          evidence_source_id: 'EVID_STERLING_2006_FIB4',
          limitations_en: ageCaution,
          limitations_bn: 'বয়স ও তীব্র হেপাটাইটিস বিবেচনায় রেখে চিকিৎসকের মূল্যায়ন প্রয়োজন।'
        });
      }
    }
  }

  // 7. UACR (Direct or calculated from urine_albumin mg/L divided by urine_creatinine g/L -> mg/g)
  {
    const directUacr = getUsable('uacr');
    const uAlb = getUsable('urine_albumin');
    const uCr = getUsable('urine_creatinine');
    if (directUacr) {
      results.push({
        derived_id: 'uacr',
        name_en: 'Urine Albumin-to-Creatinine Ratio (UACR)',
        name_bn: 'ইউরিন অ্যালবুমিন-ক্রিয়েটিনিন অনুপাত (UACR)',
        formula_id: 'KDIGO_UACR_DIRECT',
        formula_version: 'v1.0',
        status: 'calculated',
        value: directUacr.normalized_value!,
        display_value: roundDisplay(directUacr.normalized_value!, 1).toString(),
        unit: 'mg/g',
        input_observation_ids: [directUacr.observation_id],
        input_summary: [{ marker_id: 'uacr', value: directUacr.display_normalized_value, unit: 'mg/g', collection_datetime: directUacr.collection_datetime, verification_status: directUacr.verification_status }],
        eligibility_met: true,
        evidence_source_id: 'EVID_KDIGO_2024_CKD',
        limitations_en: 'Persistent albuminuria requires >=2 of 3 positive samples over 3 months; exercise, UTI, and fever cause transient elevation.',
        limitations_bn: 'দীর্ঘস্থায়ী অ্যালবুমিনুরিয়া নিশ্চিত করতে ৩ মাসে একাধিক পরীক্ষা প্রয়োজন।'
      });
    } else if (uAlb && uCr) {
      const bothUrine = uAlb.specimen_type.startsWith('urine') && uCr.specimen_type.startsWith('urine');
      if (!bothUrine || uCr.normalized_value! <= 0 || !datesCompatibleForRatio(uAlb.collection_datetime, uCr.collection_datetime, 1)) {
        results.push({
          derived_id: 'uacr',
          name_en: 'Urine Albumin-to-Creatinine Ratio (UACR)',
          name_bn: 'ইউরিন অ্যালবুমিন-ক্রিয়েটিনিন অনুপাত (UACR)',
          formula_id: 'KDIGO_UACR_CALC',
          formula_version: 'v1.0',
          status: 'unavailable',
          input_observation_ids: [uAlb.observation_id, uCr.observation_id],
          input_summary: [],
          eligibility_met: false,
          ineligibility_reason_en: !bothUrine ? 'UACR requires paired urine specimens.' : 'Invalid urine creatinine denominator or mismatched collection dates.',
          evidence_source_id: 'EVID_KDIGO_2024_CKD',
          limitations_en: 'Must be measured from same spot urine specimen.',
          limitations_bn: 'একই প্রস্রাবের নমুনা থেকে পরিমাপ আবশ্যক।'
        });
      } else {
        const val = uAlb.normalized_value! / uCr.normalized_value!;
        results.push({
          derived_id: 'uacr',
          name_en: 'Urine Albumin-to-Creatinine Ratio (UACR)',
          name_bn: 'ইউরিন অ্যালবুমিন-ক্রিয়েটিনিন অনুপাত (UACR)',
          formula_id: 'KDIGO_UACR_CALC',
          formula_version: 'v1.0',
          status: 'calculated',
          value: val,
          display_value: roundDisplay(val, 1).toString(),
          unit: 'mg/g',
          input_observation_ids: [uAlb.observation_id, uCr.observation_id],
          input_summary: [
            { marker_id: 'urine_albumin', value: uAlb.display_normalized_value, unit: 'mg/L', collection_datetime: uAlb.collection_datetime, verification_status: uAlb.verification_status },
            { marker_id: 'urine_creatinine', value: uCr.display_normalized_value, unit: 'g/L', collection_datetime: uCr.collection_datetime, verification_status: uCr.verification_status }
          ],
          eligibility_met: true,
          evidence_source_id: 'EVID_KDIGO_2024_CKD',
          limitations_en: 'Persistent albuminuria requires >=2 positive specimens over >=3 months.',
          limitations_bn: 'নিশ্চিতকরণের জন্য একাধিক পরীক্ষা প্রয়োজন।'
        });
      }
    }
  }

  // 8. NLR (Neutrophil-to-Lymphocyte Ratio)
  {
    const anc = getUsable('neutrophils_abs');
    const alc = getUsable('lymphocytes_abs');
    if (anc && alc && alc.normalized_value! > 0 && datesCompatibleForRatio(anc.collection_datetime, alc.collection_datetime, 7)) {
      const val = anc.normalized_value! / alc.normalized_value!;
      results.push({
        derived_id: 'nlr',
        name_en: 'Neutrophil-to-Lymphocyte Ratio (NLR)',
        name_bn: 'নিউট্রোফিল-লিম্ফোসাইট অনুপাত (NLR)',
        formula_id: 'CBC_ANC_OVER_ALC',
        formula_version: 'v1.0',
        status: 'calculated',
        value: val,
        display_value: roundDisplay(val, 2).toString(),
        unit: 'Ratio',
        input_observation_ids: [anc.observation_id, alc.observation_id],
        input_summary: [
          { marker_id: 'neutrophils_abs', value: anc.display_normalized_value, unit: '10^9/L', collection_datetime: anc.collection_datetime, verification_status: anc.verification_status },
          { marker_id: 'lymphocytes_abs', value: alc.display_normalized_value, unit: '10^9/L', collection_datetime: alc.collection_datetime, verification_status: alc.verification_status }
        ],
        eligibility_met: true,
        evidence_source_id: 'EVID_WHO_2020_FERRITIN',
        limitations_en: 'Non-specific inflammatory stress ratio influenced by infection, corticosteroids, and stress.',
        limitations_bn: 'স্টেরয়েড বা সংক্রমণের কারণে এটি পরিবর্তিত হতে পারে।'
      });
    }
  }

  // 9. Calculated CKD-EPI 2021 eGFR (strictly separate from laboratory-reported eGFR!)
  {
    const cr = getUsable('creatinine');
    if (cr) {
      const isAdult = population.age !== undefined && population.age >= 18;
      const hasKnownSex = population.sex === 'male' || population.sex === 'female';
      const isPregnant = patient.population_group === 'pregnancy' || (population as any).reproductive_status === 'pregnant';
      const hasAki = Boolean((patient as any).aki_suspected || (patient as any).acute_kidney_injury);
      if (!isAdult || !hasKnownSex || isPregnant || hasAki || cr.normalized_value! <= 0) {
        results.push({
          derived_id: 'calculated_egfr',
          name_en: 'Calculated eGFR (CKD-EPI 2021 Cr, Race-Free)',
          name_bn: 'হিসাবকৃত ইজিএফআর (CKD-EPI 2021)',
          formula_id: 'CKD_EPI_2021_CR',
          formula_version: '2021',
          status: 'not_applicable',
          input_observation_ids: [cr.observation_id],
          input_summary: [
            {
              marker_id: 'creatinine',
              value: cr.display_normalized_value,
              unit: 'mg/dL',
              collection_datetime: cr.collection_datetime,
              verification_status: cr.verification_status
            }
          ],
          eligibility_met: false,
          ineligibility_reason_en: !isAdult
            ? 'Adult CKD-EPI 2021 equation is inapplicable to pediatric (<18y) or unentered-age records.'
            : isPregnant
            ? 'CKD-EPI 2021 creatinine-based equation is clinically inapplicable in pregnancy due to gestational hyperfiltration.'
            : hasAki
            ? 'Creatinine-based steady-state eGFR is clinically invalid in suspected acute kidney injury.'
            : 'Explicit biological sex (male/female) required for CKD-EPI 2021 equation (never defaults unspecified sex).',
          ineligibility_reason_bn: isPregnant
            ? 'গর্ভাবস্থায় ক্রিয়েটিনিন-ভিত্তিক eGFR প্রযোজ্য নয়।'
            : hasAki
            ? 'তীব্র কিডনি আঘাতে (AKI) স্থির-অবস্থার eGFR গণনা প্রযোজ্য নয়।'
            : 'শিশু বা লিঙ্গ অনির্ধারিত রোগীতে প্রযোজ্য নয়।',
          evidence_source_id: 'EVID_KDIGO_2024_CKD',
          limitations_en: 'Always inspect laboratory-reported eGFR separately if present.',
          limitations_bn: 'শিশু, গর্ভাবস্থা, তীব্র কিডনি আঘাত বা লিঙ্গ অনির্ধারিত রোগীতে প্রযোজ্য নয়।'
        });
      } else {
        const scr = cr.normalized_value!;
        const kappa = population.sex === 'female' ? 0.7 : 0.9;
        const alpha = population.sex === 'female' ? -0.241 : -0.302;
        const sexMultiplier = population.sex === 'female' ? 1.012 : 1.0;
        const minPart = Math.min(scr / kappa, 1);
        const maxPart = Math.max(scr / kappa, 1);
        const egfr = 142 * Math.pow(minPart, alpha) * Math.pow(maxPart, -1.2) * Math.pow(0.9938, population.age!) * sexMultiplier;
        results.push({
          derived_id: 'calculated_egfr',
          name_en: 'Calculated eGFR (CKD-EPI 2021 Cr, Race-Free)',
          name_bn: 'হিসাবকৃত ইজিএফআর (CKD-EPI 2021)',
          formula_id: 'CKD_EPI_2021_CR',
          formula_version: '2021',
          status: 'calculated',
          value: egfr,
          display_value: roundDisplay(egfr, 1).toString(),
          unit: 'mL/min/1.73m²',
          input_observation_ids: [cr.observation_id],
          input_summary: [{ marker_id: 'creatinine', value: cr.display_normalized_value, unit: 'mg/dL', collection_datetime: cr.collection_datetime, verification_status: cr.verification_status }],
          eligibility_met: true,
          evidence_source_id: 'EVID_KDIGO_2024_CKD',
          limitations_en: 'Calculated separately from laboratory-reported eGFR. Chronicity requires >=3 months persistence and clinical review; inaccurate in acute kidney injury, extremes of muscle mass, or pregnancy.',
          limitations_bn: 'ল্যাব-রিপোর্টেড eGFR থেকে আলাদাভাবে গণনাকৃত; একক মানে CKD নির্ণয় করা যায় না।'
        });
      }
    }
  }

  return results;
}

/**
 * Generates the 10 evidence-aware Multi-Biomarker Pattern evaluations (R7-B Section 6.5).
 * Never manufactures confidence % scores or unsubstantiated functional diagnoses.
 */
export function evaluateBiomarkerPatterns(options: {
  observations: Record<string, R7NormalizedLabObservation>;
  evaluations: R7DualRangeBiomarkerEvaluation[];
  derived: R7DerivedBiomarkerResult[];
  population: R5PopulationProfile;
}): R7BiomarkerPatternFinding[] {
  const { observations: obs, derived, population } = options;
  const patterns: R7BiomarkerPatternFinding[] = [];

  const getObs = (id: string) => {
    const o = obs[id];
    return o && o.is_interpretable && o.normalized_value !== undefined ? o : undefined;
  };
  const deriveVerifState = (list: Array<R7NormalizedLabObservation | undefined>): R7BiomarkerPatternFinding['verification_state'] => {
    const valid = list.filter((x): x is R7NormalizedLabObservation => Boolean(x));
    if (valid.length === 0) return 'insufficient_data';
    const verifiedCount = valid.filter(x => x.verification_status === 'clinician_verified' || x.verification_status === 'lab_document_reviewed').length;
    if (verifiedCount === valid.length) return 'verified';
    if (verifiedCount > 0) return 'partially_verified';
    return 'unverified';
  };
  const popLabel = `${population.life_stage}${population.pregnancy?.active ? ` (pregnancy T${population.pregnancy.trimester})` : ''}${population.sex !== 'unentered' ? `, ${population.sex}` : ', sex unspecified'}`;

  // 1. Glycemic Dysregulation Pattern
  {
    const fbg = getObs('fasting_glucose');
    const ppbs = getObs('postprandial_glucose');
    const a1c = getObs('hba1c');
    const present = [fbg, ppbs, a1c].filter((x): x is R7NormalizedLabObservation => Boolean(x));
    if (present.length > 0) {
      const supporting: string[] = [];
      const contradictory: string[] = [];
      if (fbg && fbg.normalized_value! >= 100) supporting.push(fbg.observation_id); else if (fbg) contradictory.push(fbg.observation_id);
      if (a1c && a1c.normalized_value! >= 5.7) supporting.push(a1c.observation_id); else if (a1c) contradictory.push(a1c.observation_id);
      if (ppbs && ppbs.normalized_value! >= 140) supporting.push(ppbs.observation_id); else if (ppbs) contradictory.push(ppbs.observation_id);

      const missing = ['fasting_glucose', 'hba1c', 'postprandial_glucose'].filter(k => !getObs(k));
      if (supporting.length > 0) {
        patterns.push({
          pattern_id: 'glycemic_dysregulation',
          title_en: 'Glycemic Dysregulation Pattern',
          title_bn: 'গ্লাইসেমিক অনিয়ম প্যাটার্ন',
          supporting_observation_ids: supporting,
          contradictory_observation_ids: contradictory,
          missing_relevant_markers: missing,
          applicable_population: popLabel,
          verification_state: deriveVerifState(present),
          evidence_certainty: supporting.some(id => id.includes('hba1c') || id.includes('fasting_glucose')) ? 'guideline_supported' : 'clinical_review_indicated',
          clinical_interpretation_en:
            contradictory.length > 0
              ? 'Discordant glycemic biomarkers observed (some elevated, others within reference interval); review timing, anemia/RBC turnover, and postprandial patterns.'
              : 'Elevated glycemic biomarker(s) aligned with impaired glucose regulation.',
          clinical_interpretation_bn: 'রক্তে শর্করা নিয়ন্ত্রণের অসামঞ্জস্য লক্ষণীয়; চিকিৎসকের পর্যালোচনা ও খাদ্য পরিকল্পনা প্রয়োজন।',
          possible_nutrition_implications_en: ['Low glycemic load carbohydrate pairing with protein/fiber', 'Postprandial walking consideration'],
          possible_nutrition_implications_bn: ['লো-গ্লাইসেমিক খাদ্য ও আঁশযুক্ত খাবার'],
          relevant_functional_systems: ['energy', 'communication'],
          monitoring_considerations_en: ['Repeat HbA1c / fasting plasma glucose per ADA guidance'],
          recommended_review_action_en: 'Confirm glycemic targets and medication timing synchronization.',
          recommended_review_action_bn: 'গ্লুকোজ লক্ষ্যমাত্রা ও ওষুধের সময়সূচি যাচাই করুন।',
          evidence_ids: ['EVID_ADA_2026_GLYCEMIC']
        });
      }
    }
  }

  // 2. Insulin-Associated Metabolic Pattern
  {
    const ins = getObs('fasting_insulin');
    const tg = getObs('triglycerides');
    const hdl = getObs('hdl');
    const homa = derived.find(d => d.derived_id === 'homa_ir' && d.status === 'calculated');
    const present = [ins, tg, hdl].filter((x): x is R7NormalizedLabObservation => Boolean(x));
    const hasSignal =
      (ins && ins.normalized_value! > 10) ||
      (homa && homa.value !== undefined && homa.value >= 2.5) ||
      (tg && tg.normalized_value! > 150 && hdl && hdl.normalized_value! < (population.sex === 'female' ? 50 : 40));

    if (present.length > 0 && hasSignal) {
      patterns.push({
        pattern_id: 'insulin_associated_metabolic',
        title_en: 'Insulin-Associated Metabolic Pattern',
        title_bn: 'ইনসুলিন-সংশ্লিষ্ট মেটাবলিক প্যাটার্ন',
        supporting_observation_ids: present.map(p => p.observation_id),
        contradictory_observation_ids: [],
        missing_relevant_markers: ['fasting_glucose', 'fasting_insulin', 'triglycerides', 'hdl'].filter(k => !getObs(k)),
        applicable_population: popLabel,
        verification_state: deriveVerifState(present),
        evidence_certainty: 'clinical_review_indicated',
        clinical_interpretation_en: 'Pattern suggests insulin-associated metabolic strain (hyperinsulinemia, elevated HOMA-IR, or high-TG/low-HDL clustering); verify fasting status.',
        clinical_interpretation_bn: 'ইনসুলিন ও লিপিড সূচকে মেটাবলিক চাপের ইঙ্গিত; ফাস্টিং অবস্থা নিশ্চিত করুন।',
        possible_nutrition_implications_en: ['Replace refined carbohydrates with whole grains/legumes', 'Resistance activity review'],
        possible_nutrition_implications_bn: ['পরিশোধিত শর্করা হ্রাস ও প্রোটিন-ফাইবার সমন্বয়'],
        relevant_functional_systems: ['energy', 'communication', 'transport'],
        monitoring_considerations_en: ['Monitor fasting glucose, lipid panel, and waist circumference'],
        recommended_review_action_en: 'Correlate with waist-to-height ratio, blood pressure, and hepatic transaminases.',
        recommended_review_action_bn: 'কোমরের পরিধি, রক্তচাপ ও লিভারের এনজাইমসহ মূল্যায়ন করুন।',
        evidence_ids: ['EVID_MATTHEWS_1985_HOMAIR']
      });
    }
  }

  // 3. Atherogenic Lipid Pattern
  {
    const tc = getObs('total_cholesterol');
    const ldl = getObs('ldl');
    const tg = getObs('triglycerides');
    const hdl = getObs('hdl');
    const apob = getObs('apob');
    const lpa = getObs('lpa');
    const nonHdl = derived.find(d => d.derived_id === 'non_hdl' && d.status === 'calculated');
    const present = [tc, ldl, tg, hdl, apob, lpa].filter((x): x is R7NormalizedLabObservation => Boolean(x));
    const hasRiskSignal =
      (ldl && ldl.normalized_value! >= 130) ||
      (nonHdl && nonHdl.value! >= 130) ||
      (apob && apob.normalized_value! >= 100) ||
      (tg && tg.normalized_value! >= 150) ||
      (lpa && ((lpa.canonical_unit === 'nmol/L' && lpa.normalized_value! >= 125) || (lpa.canonical_unit === 'mg/dL' && lpa.normalized_value! >= 50)));

    if (present.length > 0 && hasRiskSignal) {
      patterns.push({
        pattern_id: 'atherogenic_lipid',
        title_en: 'Atherogenic Lipid Pattern',
        title_bn: 'এথেরোজেনিক লিপিড প্যাটার্ন',
        supporting_observation_ids: present.map(p => p.observation_id),
        contradictory_observation_ids: [],
        missing_relevant_markers: ['apob', 'lpa', 'hdl'].filter(k => !getObs(k)),
        applicable_population: popLabel,
        verification_state: deriveVerifState(present),
        evidence_certainty: 'guideline_supported',
        clinical_interpretation_en: 'Lipid markers indicate elevated atherogenic lipoprotein or triglyceride burden (note: Lp(a) preserved in reporting unit without universal conversion).',
        clinical_interpretation_bn: 'রক্তের লিপিড সূচকে এথেরোজেনিক ঝুঁকির ইঙ্গিত।',
        possible_nutrition_implications_en: ['Prioritize viscous soluble fiber (oats, legumes, psyllium)', 'Limit trans/saturated fats and refined sugars'],
        possible_nutrition_implications_bn: ['দ্রবণীয় ফাইবার ও অসম্পৃক্ত চর্বি বৃদ্ধি'],
        relevant_functional_systems: ['transport'],
        monitoring_considerations_en: ['Assess overall ASCVD risk profile and statin interactions'],
        recommended_review_action_en: 'Review Non-HDL, ApoB (when available), and triglyceride-lowering nutrition options.',
        recommended_review_action_bn: 'নন-এইচডিএল ও সামগ্রিক হৃদরোগ ঝুঁকি পর্যালোচনা করুন।',
        evidence_ids: ['EVID_AHA_ACC_LIPIDS']
      });
    }
  }

  // 4. Renal Function & Electrolyte Review (Never auto-diagnoses CKD from single eGFR!)
  {
    const cr = getObs('creatinine');
    const repEgfr = getObs('reported_egfr');
    const calcEgfr = derived.find(d => d.derived_id === 'calculated_egfr' && d.status === 'calculated');
    const uacr = derived.find(d => d.derived_id === 'uacr' && d.status === 'calculated');
    const k = getObs('potassium');
    const present = [cr, repEgfr, k].filter((x): x is R7NormalizedLabObservation => Boolean(x));
    const egfrVal = repEgfr?.normalized_value ?? calcEgfr?.value;
    const hasRenalSignal =
      (egfrVal !== undefined && egfrVal < 60) ||
      (uacr && uacr.value !== undefined && uacr.value >= 30) ||
      (k && (k.normalized_value! > 5.0 || k.normalized_value! < 3.5));

    if (present.length > 0 && hasRenalSignal) {
      patterns.push({
        pattern_id: 'renal_electrolyte_review',
        title_en: 'Renal Function & Electrolyte Review',
        title_bn: 'কিডনি ও ইলেক্ট্রোলাইট পর্যালোচনা প্যাটার্ন',
        supporting_observation_ids: present.map(p => p.observation_id),
        contradictory_observation_ids: [],
        missing_relevant_markers: ['uacr', 'potassium', 'phosphorus', 'bicarbonate'].filter(id => !getObs(id)),
        applicable_population: popLabel,
        verification_state: deriveVerifState(present),
        evidence_certainty: 'guideline_supported',
        clinical_interpretation_en: 'Abnormal renal filtration, albuminuria, or electrolyte finding detected. Per KDIGO, a single abnormal eGFR or UACR does NOT confirm chronic kidney disease without >=3-month persistence.',
        clinical_interpretation_bn: 'কিডনি বা ইলেক্ট্রোলাইটের অস্বাভাবিক মান পাওয়া গেছে; একক eGFR পরীক্ষার ভিত্তিতে CKD নিশ্চিত করা যায় না (৩ মাসের ফলো-আপ প্রয়োজন)।',
        possible_nutrition_implications_en: ['Avoid arbitrary potassium/protein/fluid numeric caps without confirmed clinical order'],
        possible_nutrition_implications_bn: ['চিকিৎসকের নিশ্চিতকৃত নির্দেশনা ছাড়া অনুমাননির্ভর সীমা প্রয়োগ নয়'],
        relevant_functional_systems: ['biotransformation', 'transport'],
        monitoring_considerations_en: ['Repeat eGFR and spot UACR >=3 months; check RAASi/diuretic drug-electrolyte effects'],
        recommended_review_action_en: 'Review potassium, sodium, and nephrology confirmation before adjusting renal nutrition targets.',
        recommended_review_action_bn: 'পটাশিয়াম ও কিডনির ফলো-আপ পরীক্ষা পর্যালোচনা করুন।',
        evidence_ids: ['EVID_KDIGO_2024_CKD']
      });
    }
  }

  // 5. Hepatic Biomarker Pattern
  {
    const alt = getObs('alt');
    const ast = getObs('ast');
    const ggt = getObs('ggt');
    const bili = getObs('total_bilirubin');
    const fib4 = derived.find(d => d.derived_id === 'fib4' && d.status === 'calculated');
    const present = [alt, ast, ggt, bili].filter((x): x is R7NormalizedLabObservation => Boolean(x));
    const hasHepaticSignal =
      (alt && alt.normalized_value! > 45) ||
      (ast && ast.normalized_value! > 40) ||
      (ggt && ggt.normalized_value! > 60) ||
      (bili && bili.normalized_value! > 1.2) ||
      (fib4 && fib4.value! >= 1.3);

    if (present.length > 0 && hasHepaticSignal) {
      patterns.push({
        pattern_id: 'hepatic_biomarker',
        title_en: 'Hepatic Biomarker Pattern',
        title_bn: 'লিভার বায়োমার্কার প্যাটার্ন',
        supporting_observation_ids: present.map(p => p.observation_id),
        contradictory_observation_ids: [],
        missing_relevant_markers: ['ast', 'ggt', 'platelets', 'albumin'].filter(id => !getObs(id)),
        applicable_population: popLabel,
        verification_state: deriveVerifState(present),
        evidence_certainty: 'clinical_review_indicated',
        clinical_interpretation_en: 'Elevated hepatic enzymes or bilirubin noted; investigate metabolic steatosis, hepatotoxic medications, biliary obstruction, or viral etiology.',
        clinical_interpretation_bn: 'লিভার এনজাইম বা বিলিরুবিন বৃদ্ধি; মেটাবলিক ফ্যাটি লিভার বা ওষুধজনিত প্রভাব পর্যালোচনা প্রয়োজন।',
        possible_nutrition_implications_en: ['Reduce free sugars/fructose and alcohol; emphasize whole-food dietary fiber'],
        possible_nutrition_implications_bn: ['অতিরিক্ত চিনি, ফ্রুক্টোজ ও প্রক্রিয়াজাত খাবার বর্জন'],
        relevant_functional_systems: ['biotransformation'],
        monitoring_considerations_en: ['Reassess transaminases and FIB-4 components (if eligible adult)'],
        recommended_review_action_en: 'Review concomitant hepatotoxic agents/supplements before authorizing herbal extracts.',
        recommended_review_action_bn: 'লিভারে চাপ সৃষ্টিকারী ওষুধ বা হার্বাল সাপ্লিমেন্ট যাচাই করুন।',
        evidence_ids: ['EVID_STERLING_2006_FIB4']
      });
    }
  }

  // 6. Iron Status & Anemia Review (strictly integrates inflammation CRP/hs-CRP context!)
  {
    const hb = getObs('hemoglobin');
    const ferr = getObs('ferritin');
    const mcv = getObs('mcv');
    const crp = getObs('hs_crp') || getObs('crp');
    const tsat = derived.find(d => d.derived_id === 'transferrin_saturation' && d.status === 'calculated');
    const present = [hb, ferr, mcv, crp].filter((x): x is R7NormalizedLabObservation => Boolean(x));
    const hbLow = hb && hb.normalized_value! < (population.pregnancy?.active ? 11.0 : population.sex === 'male' ? 13.0 : 12.0);
    const ferrLow = ferr && ferr.normalized_value! < 30;
    const ferrHighWithInflamm = ferr && ferr.normalized_value! > 150 && crp && crp.normalized_value! > 3.0;

    if ([hb, ferr, mcv].some(Boolean) && (hbLow || ferrLow || ferrHighWithInflamm || (tsat && tsat.value! < 20))) {
      patterns.push({
        pattern_id: 'iron_anemia_review',
        title_en: 'Iron Status & Anemia-Related Review',
        title_bn: 'আয়রন স্ট্যাটাস ও অ্যানিমিয়া পর্যালোচনা',
        supporting_observation_ids: present.map(p => p.observation_id),
        contradictory_observation_ids: [],
        missing_relevant_markers: ['ferritin', 'serum_iron', 'tibc', 'hs_crp'].filter(id => !getObs(id)),
        applicable_population: popLabel,
        verification_state: deriveVerifState(present),
        evidence_certainty: ferrLow && hbLow ? 'guideline_supported' : 'clinical_review_indicated',
        clinical_interpretation_en: ferrHighWithInflamm
          ? 'Elevated ferritin coexists with inflammatory marker elevation; ferritin alone cannot exclude iron deficiency due to acute-phase response — review TSAT and MCV.'
          : 'Iron depletion or reduced hemoglobin context requires clinician evaluation of etiology (dietary inadequacy, malabsorption, PPIs, or blood loss) before empiric iron prescribing.',
        clinical_interpretation_bn: ferrHighWithInflamm
          ? 'উচ্চ প্রদাহের সাথে ফেরিটিন বৃদ্ধি: প্রদাহ আয়রন ঘাটতি আড়াল করতে পারে; টিস্যাট ও এমসিভি দেখা প্রয়োজন।'
          : 'হিমোগ্লোবিন বা ফেরিটিনের ঘাটতি মূল্যায়ন ও কারণ অনুসন্ধান প্রয়োজন।',
        possible_nutrition_implications_en: ['Separate dietary iron enhancers (vitamin C) from tea/coffee polyphenols and calcium supplements'],
        possible_nutrition_implications_bn: ['চা/কফি ও ক্যালসিয়াম থেকে আয়রনযুক্ত খাবারের বিরতি রাখা'],
        relevant_functional_systems: ['transport', 'assimilation', 'energy'],
        monitoring_considerations_en: ['Check CBC, ferritin alongside CRP, and TSAT'],
        recommended_review_action_en: 'Verify whether iron supplementation is clinically indicated prior to authorization.',
        recommended_review_action_bn: 'চিকিৎসকের মাধ্যমে আয়রনের প্রয়োজনীয়তা যাচাই করুন।',
        evidence_ids: ['EVID_WHO_2020_FERRITIN']
      });
    }
  }

  // 7. B12 & Folate Review (Elevated homocysteine is non-specific!)
  {
    const b12 = getObs('vitamin_b12');
    const fol = getObs('folate');
    const hcy = getObs('homocysteine');
    const mma = getObs('methylmalonic_acid');
    const present = [b12, fol, hcy, mma].filter((x): x is R7NormalizedLabObservation => Boolean(x));
    const hasSignal =
      (b12 && b12.normalized_value! < 350) ||
      (fol && fol.normalized_value! < 4.0) ||
      (hcy && hcy.normalized_value! > 15.0) ||
      (mma && mma.normalized_value! > 270);

    if (present.length > 0 && hasSignal) {
      const onlyElevatedHcy = Boolean(hcy && hcy.normalized_value! > 15.0 && !b12 && !mma && !fol);
      patterns.push({
        pattern_id: 'b12_folate_review',
        title_en: 'Vitamin B12, Folate & One-Carbon Biomarker Review',
        title_bn: 'ভিটামিন বি১২ ও ফোলেট বায়োমার্কার পর্যালোচনা',
        supporting_observation_ids: present.map(p => p.observation_id),
        contradictory_observation_ids: [],
        missing_relevant_markers: ['vitamin_b12', 'folate', 'methylmalonic_acid'].filter(id => !getObs(id)),
        applicable_population: popLabel,
        verification_state: deriveVerifState(present),
        evidence_certainty: onlyElevatedHcy ? 'exploratory_context' : 'clinical_review_indicated',
        clinical_interpretation_en: onlyElevatedHcy
          ? 'Elevated homocysteine without B12/folate/MMA measurements is non-specific (can reflect B12, folate, B6, renal clearance, hypothyroidism, or lifestyle factors) and does NOT definitively establish a specific B-vitamin deficiency.'
          : 'Biomarkers warrant B12/folate status review (always verify B12 adequacy before initiating folate >400–1000 mcg/day).',
        clinical_interpretation_bn: onlyElevatedHcy
          ? 'শুধু উচ্চ হোমোসিস্টিন কোনো নির্দিষ্ট ভিটামিনের ঘাটতি প্রমাণ করে না; বি১২, ফোলেট ও কিডনি পরীক্ষা প্রয়োজন।'
          : 'বি১২ ও ফোলেট মাত্রা পর্যালোচনা প্রয়োজন।',
        possible_nutrition_implications_en: ['Assess dietary B12 sources and metformin/PPI malabsorption factors'],
        possible_nutrition_implications_bn: ['খাদ্যে বি১২ ও ফোলেটের উৎস এবং ওষুধের মিথস্ক্রিয়া পর্যালোচনা'],
        relevant_functional_systems: ['energy', 'assimilation', 'communication'],
        monitoring_considerations_en: ['Measure Serum B12, Folate, and MMA/CBC before diagnosing deficiency'],
        recommended_review_action_en: 'Confirm B12 status prior to high-dose folate; evaluate metformin/PPI duration.',
        recommended_review_action_bn: 'ফোলেট শুরু করার আগে বি১২ নিশ্চিত করুন।',
        evidence_ids: ['EVID_MHRA_2022_METFORMIN_B12', 'EVID_NIH_ODS_MICRONUTRIENTS']
      });
    }
  }

  // 8. Thyroid-Associated Laboratory Pattern (Normal TSH inside lab reference never establishes hypothyroidism!)
  {
    const tsh = getObs('tsh');
    const ft4 = getObs('ft4');
    const ft3 = getObs('ft3');
    const tpo = getObs('tpo_antibodies');
    const present = [tsh, ft4, ft3, tpo].filter((x): x is R7NormalizedLabObservation => Boolean(x));
    const hasThyroidAbnormality =
      (tsh && (tsh.normalized_value! > 4.5 || tsh.normalized_value! < 0.4)) ||
      (ft4 && (ft4.normalized_value! < 0.8 || ft4.normalized_value! > 1.8)) ||
      (tpo && tpo.normalized_value! > 34);

    if (present.length > 0 && hasThyroidAbnormality) {
      patterns.push({
        pattern_id: 'thyroid_laboratory',
        title_en: 'Thyroid-Associated Laboratory Pattern',
        title_bn: 'থাইরয়েড ল্যাবরেটরি প্যাটার্ন',
        supporting_observation_ids: present.map(p => p.observation_id),
        contradictory_observation_ids: [],
        missing_relevant_markers: ['tsh', 'ft4', 'tpo_antibodies'].filter(id => !getObs(id)),
        applicable_population: popLabel,
        verification_state: deriveVerifState(present),
        evidence_certainty: 'guideline_supported',
        clinical_interpretation_en: 'Thyroid biomarker outside standard reference limits detected; correlate TSH, Free T4, thyroid antibodies, and Levothyroxine timing compliance.',
        clinical_interpretation_bn: 'থাইরয়েড মার্কার ল্যাব সীমার বাইরে; ফ্রি টি৪ ও লেভোথাইরক্সিন সেবনের সময়সূচি পর্যালোচনা করুন।',
        possible_nutrition_implications_en: ['Enforce strict 4-hour separation between Levothyroxine and calcium/iron/magnesium supplements'],
        possible_nutrition_implications_bn: ['থাইরক্সিন ও ক্যালসিয়াম/আয়রন সাপ্লিমেন্টের মধ্যে ৪ ঘণ্টার ব্যবধান'],
        relevant_functional_systems: ['communication', 'energy'],
        monitoring_considerations_en: ['Endocrinology review for TSH/Free T4 titration'],
        recommended_review_action_en: 'Check divalent cation spacing if taking thyroid replacement.',
        recommended_review_action_bn: 'থাইরয়েড ওষুধের সাথে খনিজ সাপ্লিমেন্টের দূরত্ব যাচাই করুন।',
        evidence_ids: ['EVID_DAILYMED_PRESCRIBING']
      });
    }
  }

  // 9. Vitamin D & Mineral Review
  {
    const vitd = getObs('vitamin_d3');
    const ca = getObs('total_calcium');
    const mg = getObs('magnesium');
    const po4 = getObs('phosphorus');
    const present = [vitd, ca, mg, po4].filter((x): x is R7NormalizedLabObservation => Boolean(x));
    const hasSignal =
      (vitd && (vitd.normalized_value! < 20 || vitd.normalized_value! > 100)) ||
      (ca && (ca.normalized_value! < 8.5 || ca.normalized_value! > 10.5)) ||
      (mg && (mg.normalized_value! < 1.7 || mg.normalized_value! > 2.2)) ||
      (po4 && (po4.normalized_value! < 2.5 || po4.normalized_value! > 4.5));

    if (present.length > 0 && hasSignal) {
      patterns.push({
        pattern_id: 'vitamin_d_mineral_review',
        title_en: 'Vitamin D & Mineral Homeostasis Review',
        title_bn: 'ভিটামিন ডি ও খনিজ ভারসাম্য পর্যালোচনা',
        supporting_observation_ids: present.map(p => p.observation_id),
        contradictory_observation_ids: [],
        missing_relevant_markers: ['total_calcium', 'vitamin_d3', 'magnesium', 'phosphorus'].filter(id => !getObs(id)),
        applicable_population: popLabel,
        verification_state: deriveVerifState(present),
        evidence_certainty: 'clinical_review_indicated',
        clinical_interpretation_en: 'Altered Vitamin D or divalent mineral marker detected; assess calcium/renal context before starting or continuing Vitamin D supplementation.',
        clinical_interpretation_bn: 'ভিটামিন ডি বা খনিজ লবণের মান স্বাভাবিক সীমার বাইরে; ক্যালসিয়াম ও কিডনি অবস্থা যাচাই করুন।',
        possible_nutrition_implications_en: ['Coordinate fat-containing meal timing if Vitamin D is indicated; monitor UL ceilings'],
        possible_nutrition_implications_bn: ['সাপ্লিমেন্ট ডোজ ও ক্যালসিয়াম ভারসাম্য পর্যবেক্ষণ'],
        relevant_functional_systems: ['structural_integrity', 'communication'],
        monitoring_considerations_en: ['Follow serum 25(OH)D and corrected/ionized calcium if supplemented'],
        recommended_review_action_en: 'Verify contraindications (hypercalcemia, severe renal impairment) prior to supplement approval.',
        recommended_review_action_bn: 'সাপ্লিমেন্ট অনুমোদনের আগে ক্যালসিয়াম মাত্রা যাচাই করুন।',
        evidence_ids: ['EVID_ENDOCRINE_2024_VITD', 'EVID_NIH_ODS_MICRONUTRIENTS']
      });
    }
  }

  // 10. Inflammatory Biomarker Pattern (Retains CRP vs hs-CRP distinction; low CRP never excludes all inflammation)
  {
    const hscrp = getObs('hs_crp');
    const crp = getObs('crp');
    const esr = getObs('esr');
    const wbc = getObs('wbc');
    const nlr = derived.find(d => d.derived_id === 'nlr' && d.status === 'calculated');
    const present = [hscrp, crp, esr, wbc].filter((x): x is R7NormalizedLabObservation => Boolean(x));
    const hasInflammSignal =
      (hscrp && hscrp.normalized_value! > 3.0) ||
      (crp && crp.normalized_value! > 5.0) ||
      (esr && esr.normalized_value! > (population.sex === 'female' ? 20 : 15)) ||
      (wbc && (wbc.normalized_value! > 11.0 || wbc.normalized_value! < 4.0)) ||
      (nlr && nlr.value! > 3.5);

    if (present.length > 0 && hasInflammSignal) {
      patterns.push({
        pattern_id: 'inflammatory_biomarker',
        title_en: 'Inflammatory Biomarker Review Pattern',
        title_bn: 'প্রদাহ সূচক পর্যালোচনা প্যাটার্ন',
        supporting_observation_ids: present.map(p => p.observation_id),
        contradictory_observation_ids: [],
        missing_relevant_markers: ['hs_crp', 'esr', 'wbc'].filter(id => !getObs(id)),
        applicable_population: popLabel,
        verification_state: deriveVerifState(present),
        evidence_certainty: 'clinical_review_indicated',
        clinical_interpretation_en: 'Elevated inflammatory biomarker observed (retaining standard CRP acute-phase vs hs-CRP cardiometabolic distinction; clinical infection vs chronic inflammation must be differentiated by physician).',
        clinical_interpretation_bn: 'প্রদাহজনিত বায়োমার্কার বৃদ্ধি পেয়েছে; তীব্র সংক্রমণ বা দীর্ঘমেয়াদী প্রদাহ চিকিৎসকের মাধ্যমে পার্থক্য করা প্রয়োজন।',
        possible_nutrition_implications_en: ['Anti-inflammatory whole-food pattern (omega-3 fish, turmeric, colorful vegetables)'],
        possible_nutrition_implications_bn: ['প্রদাহ-রোধী প্রাকৃতিক খাদ্যাভ্যাস'],
        relevant_functional_systems: ['defense_repair'],
        monitoring_considerations_en: ['Repeat inflammatory markers after resolving acute illness; interpret ferritin cautiously during high CRP'],
        recommended_review_action_en: 'Differentiate acute infection (e.g. CRP/hs-CRP >=10 mg/L) from chronic low-grade inflammation.',
        recommended_review_action_bn: 'তীব্র সংক্রমণ ও দীর্ঘস্থায়ী প্রদাহ আলাদাভাবে মূল্যায়ন করুন।',
        evidence_ids: ['EVID_WHO_2020_FERRITIN']
      });
    }
  }

  return patterns;
}

/**
 * Evaluates Critical Laboratory Safety & Urgent Verification Escalations.
 * Propagates directly into R6 `validateReportReleaseEligibility`.
 */
export function evaluateCriticalLabFindings(options: {
  observations: Record<string, R7NormalizedLabObservation>;
  evaluations: R7DualRangeBiomarkerEvaluation[];
  rawEntries?: Record<string, StructuredLabEntry>;
}): R7CriticalLabFinding[] {
  const { evaluations, rawEntries = {} } = options;
  const findings: R7CriticalLabFinding[] = [];

  for (const ev of evaluations) {
    const obs = ev.observation;
    const rawMatch = rawEntries[obs.original_marker_id] || rawEntries[obs.canonical_marker_id];
    const isLabMarkedCritical = Boolean(rawMatch?.is_critical_lab_flag);
    const isSoftwareCritical = ev.is_critical_finding || ev.reference_status === 'critical_high' || ev.reference_status === 'critical_low';

    if (!isLabMarkedCritical && !isSoftwareCritical) continue;

    const isUnverified =
      obs.verification_status === 'unverified' ||
      obs.verification_status === 'patient_reported' ||
      obs.verification_status === 'imported_unreconciled';

    findings.push({
      finding_id: `crit_${obs.observation_id}`,
      observation_id: obs.observation_id,
      canonical_marker_id: obs.canonical_marker_id,
      marker_label_en: ev.marker_label_en,
      marker_label_bn: ev.marker_label_bn,
      category: isLabMarkedCritical
        ? 'lab_designated_critical'
        : isUnverified
        ? 'urgent_verification_required'
        : 'software_critical_rule',
      value_display: `${obs.display_normalized_value ?? obs.original_value} ${obs.canonical_unit || obs.original_unit || ''}`.trim(),
      verification_status: obs.verification_status,
      requires_clinician_reconciliation: true,
      blocks_patient_release: true,
      action_required_en: isUnverified
        ? `Unverified critical ${ev.marker_label_en} (${obs.display_normalized_value ?? obs.original_value} ${obs.canonical_unit || ''}): urgent source verification and medical reconciliation required before patient release.`
        : `Critical ${ev.marker_label_en} (${obs.display_normalized_value ?? obs.original_value} ${obs.canonical_unit || ''}): documented clinical reconciliation required before patient release.`,
      action_required_bn: isUnverified
        ? `অযাচাইকৃত সংকটাপন্ন ${ev.marker_label_bn}: রোগীর প্রেসক্রিপশন প্রকাশের পূর্বে জরুরি উৎস যাচাই ও মেডিকেল সমন্বয় আবশ্যক।`
        : `সংকটাপন্ন ${ev.marker_label_bn}: প্রেসক্রিপশন প্রকাশের পূর্বে চিকিৎসকের নথিভুক্ত পুনর্মিলন আবশ্যক।`,
      evidence_id: ev.evidence_ids[0] || 'EVID_KDIGO_2024_CKD'
    });
  }

  return findings;
}

/**
 * Computes unit-normalized longitudinal trends from same-patient comparable history.
 * Never fabricates historical measurements or infers treatment causation.
 */
export function computeLabTrends(
  historyByCanonical: Record<string, R7NormalizedLabObservation[]>
): R7LabTrendEntry[] {
  const trends: R7LabTrendEntry[] = [];

  for (const [markerId, series] of Object.entries(historyByCanonical)) {
    if (!series || series.length === 0) continue;
    const def = resolveCanonicalMarker(markerId);
    const labelEn = def?.label_en || markerId;
    const labelBn = def?.label_bn || markerId;
    const current = series[0];
    const previous = series.length > 1 ? series[1] : undefined;

    if (!previous) {
      trends.push({
        canonical_marker_id: markerId,
        marker_label_en: labelEn,
        marker_label_bn: labelBn,
        canonical_unit: current.canonical_unit,
        current_value: current.display_normalized_value,
        current_date: current.collection_datetime,
        direction: 'insufficient_history',
        comparable: false,
        reference_interval_changed: false
      });
      continue;
    }

    // Check unit compatibility (e.g. Lp(a) mg/dL vs nmol/L cannot be compared numerically!)
    if (current.canonical_unit !== previous.canonical_unit) {
      trends.push({
        canonical_marker_id: markerId,
        marker_label_en: labelEn,
        marker_label_bn: labelBn,
        canonical_unit: current.canonical_unit,
        current_value: current.display_normalized_value,
        current_date: current.collection_datetime,
        previous_value: previous.display_normalized_value,
        previous_date: previous.collection_datetime,
        direction: 'incomparable',
        comparable: false,
        incomparability_reason: `Incompatible reporting units (${previous.canonical_unit} vs ${current.canonical_unit})`,
        reference_interval_changed: false
      });
      continue;
    }

    // Check specimen compatibility
    if (!specimensCompatibleForRatio(current.specimen_type, previous.specimen_type)) {
      trends.push({
        canonical_marker_id: markerId,
        marker_label_en: labelEn,
        marker_label_bn: labelBn,
        canonical_unit: current.canonical_unit,
        current_value: current.display_normalized_value,
        current_date: current.collection_datetime,
        previous_value: previous.display_normalized_value,
        previous_date: previous.collection_datetime,
        direction: 'incomparable',
        comparable: false,
        incomparability_reason: `Different specimen types (${previous.specimen_type} vs ${current.specimen_type})`,
        reference_interval_changed: false
      });
      continue;
    }

    const vCurr = current.normalized_value!;
    const vPrev = previous.normalized_value!;
    const delta = vCurr - vPrev;
    const pct = vPrev !== 0 ? (delta / vPrev) * 100 : undefined;
    const refChanged =
      current.lab_ref_low !== previous.lab_ref_low || current.lab_ref_high !== previous.lab_ref_high;

    trends.push({
      canonical_marker_id: markerId,
      marker_label_en: labelEn,
      marker_label_bn: labelBn,
      canonical_unit: current.canonical_unit,
      current_value: current.display_normalized_value,
      current_date: current.collection_datetime,
      previous_value: previous.display_normalized_value,
      previous_date: previous.collection_datetime,
      absolute_change: roundDisplay(delta, 2),
      percent_change: pct !== undefined ? roundDisplay(pct, 1) : undefined,
      direction: Math.abs(delta) < 0.001 ? 'stable' : delta > 0 ? 'increased' : 'decreased',
      comparable: true,
      reference_interval_changed: refChanged
    });
  }

  return trends;
}

/**
 * Full R7-A + R7-B Pipeline Orchestrator
 */
export function evaluateR7LaboratoryIntelligence(options: {
  patient: Partial<PatientProfile>;
  visitId?: string;
  structuredEntries?: Record<string, StructuredLabEntry> | StructuredLabEntry[];
  historicalEntries?: StructuredLabEntry[];
}): R7LabIntelligenceSummary {
  const rawEntriesMap = Array.isArray(options.structuredEntries)
    ? Object.fromEntries(options.structuredEntries.map(e => [e.marker_id, e]))
    : options.structuredEntries || {};

  const reconciled = reconcilePatientLaboratories(options);
  const evaluations = reconciled.allObservations.map(obs =>
    evaluateBiomarkerObservation(obs, reconciled.population, reconciled.latestByCanonical)
  );
  const derived_indices = computeR7DerivedBiomarkers({
    observations: reconciled.latestByCanonical,
    patient: options.patient,
    population: reconciled.population
  });
  const patterns = evaluateBiomarkerPatterns({
    observations: reconciled.latestByCanonical,
    evaluations,
    derived: derived_indices,
    population: reconciled.population
  });
  const critical_findings = evaluateCriticalLabFindings({
    observations: reconciled.latestByCanonical,
    evaluations,
    rawEntries: rawEntriesMap
  });
  const trends = computeLabTrends(reconciled.historyByCanonical);

  const blockingCritical = critical_findings.filter(f => f.blocks_patient_release);
  const hasUnverifiedUrgent = critical_findings.some(f => f.category === 'urgent_verification_required');

  const blockingReasonsEn = blockingCritical.map(f => f.action_required_en);
  const blockingReasonsBn = blockingCritical.map(f => f.action_required_bn);

  if (reconciled.conflicts.length > 0) {
    blockingReasonsEn.push(
      `Conflicting duplicate laboratory results for: ${reconciled.conflicts.map(c => c.canonical_marker_id).join(', ')}. Reconcile before patient release.`
    );
    blockingReasonsBn.push(
      `পরস্পরবিরোধী ডুপ্লিকেট ল্যাব ফলাফল (${reconciled.conflicts.map(c => c.canonical_marker_id).join(', ')}) সমন্বয় প্রয়োজন।`
    );
  }

  return {
    patient_id: options.patient.id || 'unknown',
    visit_id: options.visitId || options.patient.current_visit_id,
    reconciled_at: new Date().toISOString(),
    observations: reconciled.latestByCanonical,
    all_observations_list: reconciled.allObservations,
    evaluations,
    derived_indices,
    patterns,
    critical_findings,
    review_queue: reconciled.reviewQueue,
    trends,
    has_blocking_critical_findings: blockingCritical.length > 0,
    has_unverified_urgent_findings: hasUnverifiedUrgent,
    blocks_patient_release: blockingReasonsEn.length > 0,
    blocking_reasons_en: blockingReasonsEn,
    blocking_reasons_bn: blockingReasonsBn
  };
}
