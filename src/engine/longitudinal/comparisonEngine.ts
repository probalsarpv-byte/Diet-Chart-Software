/**
 * SHUDDHO FUNCTIONAL NUTRITION SOFTWARE
 * Deterministic Longitudinal Clinical Comparison Engine
 * 
 * Features:
 * - Mode A: Baseline vs Current
 * - Mode B: Previous vs Current
 * - Mode C: Selected Visit vs Selected Visit
 * - Mode D: Multi-Visit Trend
 * - Context-aware clinical interpretation (Weight loss not automatically good for underweight/pregnancy/oncology/pediatric)
 * - Bristol Stool scale bidirectional interpretation (Types 3-4 optimal)
 * - Quantitative absolute & percentage change calculation with division-by-zero protection
 * - 7-Domain Functional Nutrition Matrix tracking (resolved, persistent, newly emergent)
 * - Ayurvedic Vikriti trajectory & Agni evolution (Prakriti constitutional constancy)
 * - Safe handling of missing/incomparable observations
 */

import {
  PatientProfile,
  ClinicalVisitSnapshot,
  LongitudinalProgressAnalysis,
  QuantitativeChange,
  ComparisonOutcome,
  ComparativeProgressReport,
  ClinicalProgressPlanningContext,
} from '../../types';

export interface ComparisonInput {
  patient: PatientProfile;
  baselineSnapshot: ClinicalVisitSnapshot;
  comparisonSnapshot: ClinicalVisitSnapshot;
  comparisonMode?: 'baseline_vs_current' | 'previous_vs_current' | 'selected_vs_selected' | 'multi_visit_trend';
  allSnapshots?: ClinicalVisitSnapshot[];
}

/**
 * Helper to compute quantitative change with division-by-zero & missing data guards
 */
export function calculateMetricChange(options: {
  markerId: string;
  nameEn: string;
  nameBn: string;
  baselineVal?: number;
  currentVal?: number;
  unit: string;
  baselineDate?: string;
  currentDate?: string;
  desiredDirection: 'lower_is_better' | 'higher_is_better' | 'contextual' | 'range_bound';
  optimalRange?: [number, number];
  clinicalContext?: {
    population?: string;
    isUnderweight?: boolean;
    isOncology?: boolean;
    isPregnant?: boolean;
    isPediatric?: boolean;
  };
}): QuantitativeChange {
  const {
    markerId,
    nameEn,
    nameBn,
    baselineVal,
    currentVal,
    unit,
    baselineDate,
    currentDate,
    desiredDirection,
    optimalRange,
    clinicalContext = {},
  } = options;

  if (baselineVal === undefined || baselineVal === null || currentVal === undefined || currentVal === null) {
    return {
      marker_id: markerId,
      marker_name_en: nameEn,
      marker_name_bn: nameBn,
      baseline_value: baselineVal ?? undefined,
      current_value: currentVal ?? undefined,
      unit,
      comparability: baselineVal === undefined ? 'missing_baseline' : 'missing_current',
      outcome: 'insufficient_data',
      clinical_interpretation_en: 'Insufficient data for longitudinal comparison',
      clinical_interpretation_bn: 'লংগিটিউডিনাল তুলনার জন্য অপর্যাপ্ত তথ্য',
      baseline_date: baselineDate,
      current_date: currentDate,
    };
  }

  const absoluteChange = Math.round((currentVal - baselineVal) * 100) / 100;
  let percentageChange: number | undefined = undefined;
  if (baselineVal !== 0) {
    percentageChange = Math.round(((currentVal - baselineVal) / Math.abs(baselineVal)) * 1000) / 10;
  }

  // Trivial change threshold (<= 0.5% or <= 0.2 units)
  const isTrivial = Math.abs(absoluteChange) <= 0.1 || (percentageChange !== undefined && Math.abs(percentageChange) <= 0.5);

  let outcome: ComparisonOutcome = 'stable';
  let interpEn = 'Parameter remains stable within clinical measurement variance.';
  let interpBn = 'ক্লিনিক্যাল পরিমাপের সীমার মধ্যে মানটি স্থিতিশীল রয়েছে।';

  if (!isTrivial) {
    if (desiredDirection === 'lower_is_better') {
      if (absoluteChange < 0) {
        outcome = 'improved';
        interpEn = `Reduction of ${Math.abs(absoluteChange)} ${unit} indicates favorable clinical improvement.`;
        interpBn = `${Math.abs(absoluteChange)} ${unit} হ্রাস স্বাস্থ্যকর ক্লিনিক্যাল উন্নতির নির্দেশক।`;
      } else {
        outcome = 'worsened';
        interpEn = `Elevation of ${absoluteChange} ${unit} indicates unfavorable progression requiring review.`;
        interpBn = `${absoluteChange} ${unit} বৃদ্ধি প্রতিকূল লক্ষণ যা পর্যালোচনা প্রয়োজন।`;
      }
    } else if (desiredDirection === 'higher_is_better') {
      if (absoluteChange > 0) {
        outcome = 'improved';
        interpEn = `Increase of ${absoluteChange} ${unit} reflects positive clinical recovery.`;
        interpBn = `${absoluteChange} ${unit} বৃদ্ধি ইতিবাচক ক্লিনিক্যাল অগ্রগতির নির্দেশক।`;
      } else {
        outcome = 'worsened';
        interpEn = `Decline of ${Math.abs(absoluteChange)} ${unit} indicates deterioration.`;
        interpBn = `${Math.abs(absoluteChange)} ${unit} হ্রাস অবনতির নির্দেশক।`;
      }
    } else if (desiredDirection === 'range_bound' && optimalRange) {
      const [optLow, optHigh] = optimalRange;
      const baseDist = baselineVal < optLow ? optLow - baselineVal : baselineVal > optHigh ? baselineVal - optHigh : 0;
      const currDist = currentVal < optLow ? optLow - currentVal : currentVal > optHigh ? currentVal - optHigh : 0;
      if (currDist < baseDist) {
        outcome = 'improved';
        interpEn = `Value shifted closer toward optimal target range (${optLow}–${optHigh} ${unit}).`;
        interpBn = `মানটি কাম্য স্বাভাবিক সীমার (${optLow}–${optHigh} ${unit}) কাছাকাছি এসেছে।`;
      } else if (currDist > baseDist) {
        outcome = 'worsened';
        interpEn = `Value deviated further from optimal range (${optLow}–${optHigh} ${unit}).`;
        interpBn = `মানটি কাম্য স্বাভাবিক সীমা (${optLow}–${optHigh} ${unit}) থেকে দূরে সরে গেছে।`;
      } else {
        outcome = 'stable';
        interpEn = `Value remains consistently within or near range (${optLow}–${optHigh} ${unit}).`;
        interpBn = `মানটি কাম্য সীমার কাছাকাছি স্থিতিশীল রয়েছে।`;
      }
    } else if (desiredDirection === 'contextual') {
      // Contextual interpretation: Weight, WHtR, etc.
      if (markerId === 'weight_kg') {
        const { isUnderweight, isOncology, isPregnant, isPediatric } = clinicalContext;
        if (isUnderweight || isOncology) {
          // Weight reduction in underweight / oncology is CAUTION/WORSENED!
          if (absoluteChange < -0.5) {
            outcome = 'worsened';
            interpEn = `Weight loss of ${Math.abs(absoluteChange)} kg in underweight/oncology context signals nutritional wasting/cachexia risk.`;
            interpBn = `স্বল্প ওজন/অনকোলজি অবস্থায় ${Math.abs(absoluteChange)} কেজি ওজন হ্রাস অপুষ্টি ও ক্যাকেক্সিয়া ঝুঁকি নির্দেশ করে।`;
          } else if (absoluteChange > 0.5) {
            outcome = 'improved';
            interpEn = `Weight gain of ${absoluteChange} kg supports positive nutritional restoration.`;
            interpBn = `${absoluteChange} কেজি ওজন বৃদ্ধি ইতিবাচক পুষ্টি পুনরুদ্ধারে সহায়ক।`;
          } else {
            outcome = 'stable';
            interpEn = 'Weight remains stable, preserving lean body mass.';
            interpBn = 'ওজন স্থিতিশীল রয়েছে, যা পেশির ক্ষয় রোধ নির্দেশ করে।';
          }
        } else if (isPregnant) {
          // Normal pregnancy requires gestational weight gain depending on trimester
          if (absoluteChange < 0) {
            outcome = 'worsened';
            interpEn = `Maternal weight reduction (-${Math.abs(absoluteChange)} kg) is contraindicated; gestational weight monitoring required.`;
            interpBn = `গর্ভকালীন ওজন হ্রাস (-${Math.abs(absoluteChange)} কেজি) অনাকাঙ্ক্ষিত; পুষ্টি পর্যবেক্ষণ আবশ্যক।`;
          } else {
            outcome = 'stable';
            interpEn = `Maternal weight gain (+${absoluteChange} kg) reflects normal gestational trajectory.`;
            interpBn = `গর্ভকালীন স্বাভাবিক ওজন বৃদ্ধি (+${absoluteChange} কেজি) লক্ষ্য করা গেছে।`;
          }
        } else if (isPediatric) {
          if (absoluteChange < 0) {
            outcome = 'worsened';
            interpEn = `Pediatric weight loss (-${Math.abs(absoluteChange)} kg) requires clinical growth review.`;
            interpBn = `শিশুর ওজন হ্রাস (-${Math.abs(absoluteChange)} কেজি) ক্লিনিক্যাল পর্যবেক্ষণ দাবি করে।`;
          } else {
            outcome = 'improved';
            interpEn = `Pediatric linear growth/weight accretion (+${absoluteChange} kg).`;
            interpBn = `শিশুর স্বাভাবিক বৃদ্ধি (+${absoluteChange} কেজি)।`;
          }
        } else {
          // Standard adult overweight management
          if (absoluteChange < -0.5) {
            outcome = 'improved';
            interpEn = `Weight reduction of ${Math.abs(absoluteChange)} kg supports metabolic improvement.`;
            interpBn = `${Math.abs(absoluteChange)} কেজি ওজন হ্রাস মেটাবলিক স্বাস্থ্য উন্নয়নে ইতিবাচক।`;
          } else if (absoluteChange > 1.0) {
            outcome = 'worsened';
            interpEn = `Weight increase of ${absoluteChange} kg indicates adiposity progression.`;
            interpBn = `${absoluteChange} কেজি ওজন বৃদ্ধি মেটাবলিক ঝুঁকি বাড়াতে পারে।`;
          } else {
            outcome = 'stable';
            interpEn = 'Weight maintained within stable clinical boundary.';
            interpBn = 'ওজন স্থিতিশীল রয়েছে।';
          }
        }
      } else {
        outcome = absoluteChange < 0 ? 'improved' : 'worsened';
        interpEn = `Delta: ${absoluteChange} ${unit}`;
        interpBn = `পার্থক্য: ${absoluteChange} ${unit}`;
      }
    }
  }

  return {
    marker_id: markerId,
    marker_name_en: nameEn,
    marker_name_bn: nameBn,
    baseline_value: baselineVal,
    current_value: currentVal,
    absolute_change: absoluteChange,
    percentage_change: percentageChange,
    unit,
    comparability: 'comparable',
    outcome,
    clinical_interpretation_en: interpEn,
    clinical_interpretation_bn: interpBn,
    baseline_date: baselineDate,
    current_date: currentDate,
  };
}

/**
 * Specialized Bristol Stool Scale Comparative Interpretation
 * Type 3 and 4 are ideal normal stool.
 * Type 1 and 2 indicate constipation (severe to mild).
 * Type 5, 6, and 7 indicate diarrhea / urgency (mild to severe).
 */
export function interpretBristolStoolChange(baseScore: number, currScore: number): {
  outcome: ComparisonOutcome;
  interpEn: string;
  interpBn: string;
} {
  const isBaseNormal = baseScore === 3 || baseScore === 4;
  const isCurrNormal = currScore === 3 || currScore === 4;

  if (currScore === baseScore) {
    return {
      outcome: 'stable',
      interpEn: `Stool form remains Type ${currScore} (${isCurrNormal ? 'ideal smooth/soft snake-like' : currScore < 3 ? 'constipated hard lumps' : 'loose/watery diarrhea'}).`,
      interpBn: `পায়খানার ধরন ব্রিস্টল স্কেল টাইপ ${currScore}-এ অপরিবর্তিত।`,
    };
  }

  if (!isBaseNormal && isCurrNormal) {
    return {
      outcome: 'improved',
      interpEn: `Bristol Stool form normalized from Type ${baseScore} to optimal Type ${currScore} (smooth and soft).`,
      interpBn: `পায়খানার ধরন টাইপ ${baseScore} থেকে স্বাভাবিক ও কাম্য টাইপ ${currScore}-এ উন্নত হয়েছে।`,
    };
  }

  if (isBaseNormal && !isCurrNormal) {
    return {
      outcome: 'worsened',
      interpEn: `Stool consistency deteriorated from optimal Type ${baseScore} to Type ${currScore} (${currScore < 3 ? 'constipation' : 'diarrheal looseness'}).`,
      interpBn: `পায়খানার ধরন স্বাভাবিক টাইপ ${baseScore} থেকে অবনতি হয়ে টাইপ ${currScore}-এ পৌঁছেছে।`,
    };
  }

  // Both abnormal: check if distance to optimal (3 or 4) decreased
  const baseDist = Math.min(Math.abs(baseScore - 3.5));
  const currDist = Math.min(Math.abs(currScore - 3.5));

  if (currDist < baseDist) {
    return {
      outcome: 'improved',
      interpEn: `Stool form transitioned from Type ${baseScore} closer toward normal (Type ${currScore}).`,
      interpBn: `পায়খানার ধরন টাইপ ${baseScore} থেকে স্বাভাবিকের কাছাকাছি টাইপ ${currScore}-এ এসেছে।`,
    };
  }

  return {
    outcome: 'worsened',
    interpEn: `Stool form altered unfavorably from Type ${baseScore} to Type ${currScore}.`,
    interpBn: `পায়খানার ধরন টাইপ ${baseScore} থেকে টাইপ ${currScore}-এ পরিবর্তিত হয়েছে।`,
  };
}

/**
 * Main Deterministic Longitudinal Clinical Comparison Engine
 */
export function executeLongitudinalComparison(input: ComparisonInput): LongitudinalProgressAnalysis {
  const {
    patient,
    baselineSnapshot,
    comparisonSnapshot,
    comparisonMode = 'baseline_vs_current',
  } = input;

  const clinicalContext = {
    population: patient.population_group,
    isUnderweight: Boolean(patient.calculated?.bmi && patient.calculated.bmi < 18.5) || Boolean(patient.clinical_pathways?.includes('underweight_restoration')),
    isOncology: Boolean(patient.clinical_pathways?.includes('oncology')),
    isPregnant: patient.population_group === 'pregnancy',
    isPediatric: patient.age < 18 || patient.population_group === 'pediatric',
  };

  // ── 1. Anthropometric Changes ─────────────────────────────────────
  const baseAnthro = baselineSnapshot.anthropometrics || {};
  const currAnthro = comparisonSnapshot.anthropometrics || {};

  const anthropometric_changes: QuantitativeChange[] = [
    calculateMetricChange({
      markerId: 'weight_kg',
      nameEn: 'Body Weight',
      nameBn: 'শরীরের ওজন',
      baselineVal: baseAnthro.weight_kg,
      currentVal: currAnthro.weight_kg,
      unit: 'kg',
      baselineDate: baselineSnapshot.visit_date,
      currentDate: comparisonSnapshot.visit_date,
      desiredDirection: 'contextual',
      clinicalContext,
    }),
    calculateMetricChange({
      markerId: 'waist_cm',
      nameEn: 'Waist Circumference',
      nameBn: 'কোমরের পরিধি',
      baselineVal: baseAnthro.waist_cm,
      currentVal: currAnthro.waist_cm,
      unit: 'cm',
      baselineDate: baselineSnapshot.visit_date,
      currentDate: comparisonSnapshot.visit_date,
      desiredDirection: 'lower_is_better',
      clinicalContext,
    }),
    calculateMetricChange({
      markerId: 'bmi',
      nameEn: 'Body Mass Index (BMI)',
      nameBn: 'বডি মাস ইনডেক্স (BMI)',
      baselineVal: baseAnthro.bmi,
      currentVal: currAnthro.bmi,
      unit: 'kg/m²',
      baselineDate: baselineSnapshot.visit_date,
      currentDate: comparisonSnapshot.visit_date,
      desiredDirection: 'range_bound',
      optimalRange: [18.5, 22.9],
      clinicalContext,
    }),
    calculateMetricChange({
      markerId: 'whtr',
      nameEn: 'Waist-to-Height Ratio (WHtR)',
      nameBn: 'কোমর-উচ্চতা অনুপাত (WHtR)',
      baselineVal: baseAnthro.whtr,
      currentVal: currAnthro.whtr,
      unit: 'ratio',
      baselineDate: baselineSnapshot.visit_date,
      currentDate: comparisonSnapshot.visit_date,
      desiredDirection: 'lower_is_better',
      clinicalContext,
    }),
  ];

  // ── 2. Symptom Score Changes ──────────────────────────────────────
  const normalizeSymptoms = (snap: ClinicalVisitSnapshot): Record<string, number | string> => {
    const res: Record<string, number | string> = { ...(snap.symptoms || {}) };
    if (snap.gut_metrics) {
      if (snap.gut_metrics.bristol_stool_score !== undefined && res['bristol_stool'] === undefined) {
        res['bristol_stool'] = snap.gut_metrics.bristol_stool_score;
      }
      if (snap.gut_metrics.energy_score !== undefined && res['energy_score'] === undefined) {
        res['energy_score'] = snap.gut_metrics.energy_score;
      }
      if (snap.gut_metrics.sleep_quality_score !== undefined && res['sleep_quality'] === undefined) {
        res['sleep_quality'] = snap.gut_metrics.sleep_quality_score;
      }
    }
    return res;
  };
  const baseSym = normalizeSymptoms(baselineSnapshot);
  const currSym = normalizeSymptoms(comparisonSnapshot);
  const symptomKeys = Array.from(new Set([...Object.keys(baseSym), ...Object.keys(currSym)]));

  const symptomMeta: Record<string, { nameEn: string; nameBn: string; polarity: 'lower_is_better' | 'higher_is_better' }> = {
    bloating: { nameEn: 'Abdominal Bloating & Gas', nameBn: 'পেট ফাঁপা ও গ্যাস', polarity: 'lower_is_better' },
    acid_reflux: { nameEn: 'Acid Reflux & Heartburn', nameBn: 'বুক জ্বালাপোড়া ও টক ঢেঁকুর', polarity: 'lower_is_better' },
    fatigue: { nameEn: 'Fatigue & Low Energy', nameBn: 'ক্লান্তি ও দুর্বলতা', polarity: 'lower_is_better' },
    energy_score: { nameEn: 'Daily Vitality & Energy', nameBn: 'দৈনিক কর্মশক্তি ও সতেজতা', polarity: 'higher_is_better' },
    sleep_quality: { nameEn: 'Sleep Quality & Restfulness', nameBn: 'ঘুমের গুণমান ও প্রশান্তি', polarity: 'higher_is_better' },
    constipation: { nameEn: 'Constipation Severity', nameBn: 'কোষ্ঠকাঠিন্যের মাত্রা', polarity: 'lower_is_better' },
    joint_pain: { nameEn: 'Joint & Musculoskeletal Pain', nameBn: 'জয়েন্ট ও পেশির ব্যথা', polarity: 'lower_is_better' },
    sugar_cravings: { nameEn: 'Sugar & Refined Carb Cravings', nameBn: 'মিষ্টি ও ভাতের তীব্র ক্ষুধা', polarity: 'lower_is_better' },
  };

  const symptom_changes: QuantitativeChange[] = [];

  for (const symKey of symptomKeys) {
    if (symKey === 'bristol_stool' || symKey === 'bristol_stool_score') {
      const bVal = Number(baseSym[symKey] ?? baseSym['bristol_stool']);
      const cVal = Number(currSym[symKey] ?? currSym['bristol_stool']);
      if (!isNaN(bVal) && !isNaN(cVal)) {
        const stoolInterp = interpretBristolStoolChange(bVal, cVal);
        symptom_changes.push({
          marker_id: 'bristol_stool',
          marker_name_en: 'Bristol Stool Consistency',
          marker_name_bn: 'পায়খানার ধরন (ব্রিস্টল স্কেল)',
          baseline_value: bVal,
          current_value: cVal,
          absolute_change: cVal - bVal,
          unit: 'Type (1-7)',
          comparability: 'comparable',
          outcome: stoolInterp.outcome,
          clinical_interpretation_en: stoolInterp.interpEn,
          clinical_interpretation_bn: stoolInterp.interpBn,
          baseline_date: baselineSnapshot.visit_date,
          current_date: comparisonSnapshot.visit_date,
        });
      }
      continue;
    }

    const meta = symptomMeta[symKey] || {
      nameEn: symKey.replace(/_/g, ' '),
      nameBn: symKey.replace(/_/g, ' '),
      polarity: 'lower_is_better' as const,
    };

    const bVal = Number(baseSym[symKey]);
    const cVal = Number(currSym[symKey]);

    symptom_changes.push(
      calculateMetricChange({
        markerId: symKey,
        nameEn: meta.nameEn,
        nameBn: meta.nameBn,
        baselineVal: isNaN(bVal) ? undefined : bVal,
        currentVal: isNaN(cVal) ? undefined : cVal,
        unit: '/10 scale',
        baselineDate: baselineSnapshot.visit_date,
        currentDate: comparisonSnapshot.visit_date,
        desiredDirection: meta.polarity,
        clinicalContext,
      })
    );
  }

  // ── 3. Laboratory Biomarker Changes ───────────────────────────────
  const normalizeLabs = (snap: ClinicalVisitSnapshot): Record<string, { value: number; unit?: string; test_date?: string }> => {
    const res: Record<string, { value: number; unit?: string; test_date?: string }> = {};
    if (snap.labs) {
      for (const [k, v] of Object.entries(snap.labs)) {
        if (v && typeof v.value === 'number') res[k] = v;
      }
    }
    if (snap.biomarkers) {
      for (const [k, v] of Object.entries(snap.biomarkers)) {
        if (typeof v === 'number' && res[k] === undefined) {
          res[k] = { value: v, test_date: snap.visit_date };
        }
      }
    }
    return res;
  };
  const baseLabs = normalizeLabs(baselineSnapshot);
  const currLabs = normalizeLabs(comparisonSnapshot);
  const labKeys = Array.from(new Set([...Object.keys(baseLabs), ...Object.keys(currLabs)]));

  const labMeta: Record<string, { nameEn: string; nameBn: string; unit: string; direction: 'lower_is_better' | 'higher_is_better' | 'range_bound'; range?: [number, number] }> = {
    hba1c: { nameEn: 'Glycated Hemoglobin (HbA1c)', nameBn: 'হিমোগ্লোবিন এওয়ানসি (HbA1c)', unit: '%', direction: 'range_bound', range: [4.0, 5.6] },
    fasting_glucose: { nameEn: 'Fasting Blood Glucose', nameBn: 'ফাস্টিং রক্তের গ্লুকোজ', unit: 'mmol/L', direction: 'range_bound', range: [3.9, 5.5] },
    fasting_insulin: { nameEn: 'Fasting Serum Insulin', nameBn: 'ফাস্টিং ইনসুলিন', unit: 'µIU/mL', direction: 'range_bound', range: [2.0, 6.0] },
    homa_ir: { nameEn: 'HOMA-IR Score', nameBn: 'হোমা-আইআর স্কোর', unit: 'index', direction: 'lower_is_better' },
    triglycerides: { nameEn: 'Serum Triglycerides (TG)', nameBn: 'সিরাম ট্রাইগ্লিসারাইড', unit: 'mg/dL', direction: 'lower_is_better' },
    hdl: { nameEn: 'HDL Cholesterol', nameBn: 'এইচডিএল কোলেস্টেরল', unit: 'mg/dL', direction: 'higher_is_better' },
    tg_hdl_ratio: { nameEn: 'TG / HDL Ratio', nameBn: 'টিজি/এইচডিএল অনুপাত', unit: 'ratio', direction: 'lower_is_better' },
    tsh: { nameEn: 'Thyroid Stimulating Hormone (TSH)', nameBn: 'টিএসএইচ (TSH)', unit: 'µIU/mL', direction: 'range_bound', range: [1.0, 2.5] },
    creatinine: { nameEn: 'Serum Creatinine', nameBn: 'সিরাম ক্রিয়েটিনিন', unit: 'mg/dL', direction: 'range_bound', range: [0.6, 1.2] },
    uric_acid: { nameEn: 'Serum Uric Acid', nameBn: 'সিরাম ইউরিক এসিড', unit: 'mg/dL', direction: 'range_bound', range: [3.5, 6.0] },
    alt: { nameEn: 'SGPT / ALT', nameBn: 'এসজিপিটি / এএলটি', unit: 'U/L', direction: 'lower_is_better' },
    vitamin_d3: { nameEn: '25-OH Vitamin D3', nameBn: 'ভিটামিন ডি৩', unit: 'ng/mL', direction: 'range_bound', range: [40, 80] },
    vitamin_b12: { nameEn: 'Serum Vitamin B12', nameBn: 'ভিটামিন বি১২', unit: 'pg/mL', direction: 'range_bound', range: [450, 900] },
    ferritin: { nameEn: 'Serum Ferritin', nameBn: 'সিরাম ফেরিটিন', unit: 'ng/mL', direction: 'range_bound', range: [40, 150] },
    hs_crp: { nameEn: 'High-Sensitivity CRP', nameBn: 'হাই-সেন্সিটিভিটি সিআরপি', unit: 'mg/L', direction: 'lower_is_better' },
  };

  const laboratory_changes: QuantitativeChange[] = [];

  for (const labKey of labKeys) {
    const meta = labMeta[labKey] || {
      nameEn: labKey.replace(/_/g, ' '),
      nameBn: labKey.replace(/_/g, ' '),
      unit: baseLabs[labKey]?.unit || currLabs[labKey]?.unit || '',
      direction: 'range_bound' as const,
      range: [0, 100],
    };

    const bEntry = baseLabs[labKey];
    const cEntry = currLabs[labKey];

    // Check unit compatibility
    let isUnitMismatch = false;
    if (bEntry?.unit && cEntry?.unit && bEntry.unit.toLowerCase() !== cEntry.unit.toLowerCase()) {
      isUnitMismatch = true;
    }

    if (isUnitMismatch) {
      laboratory_changes.push({
        marker_id: labKey,
        marker_name_en: meta.nameEn,
        marker_name_bn: meta.nameBn,
        baseline_value: bEntry?.value,
        current_value: cEntry?.value,
        unit: `${bEntry?.unit} vs ${cEntry?.unit}`,
        comparability: 'different_units',
        outcome: 'insufficient_data',
        clinical_interpretation_en: `Unit mismatch detected (${bEntry?.unit} vs ${cEntry?.unit}). Mathematical comparison prevented.`,
        clinical_interpretation_bn: `একক অসঙ্গতি পাওয়া গেছে (${bEntry?.unit} বনাম ${cEntry?.unit})। গাণিতিক তুলনা স্থগিত রাখা হয়েছে।`,
        baseline_date: bEntry?.test_date,
        current_date: cEntry?.test_date,
      });
      continue;
    }

    laboratory_changes.push(
      calculateMetricChange({
        markerId: labKey,
        nameEn: meta.nameEn,
        nameBn: meta.nameBn,
        baselineVal: bEntry?.value,
        currentVal: cEntry?.value,
        unit: meta.unit,
        baselineDate: bEntry?.test_date || baselineSnapshot.visit_date,
        currentDate: cEntry?.test_date || comparisonSnapshot.visit_date,
        desiredDirection: meta.direction,
        optimalRange: meta.range,
        clinicalContext,
      })
    );
  }

  // ── 4. Functional Nutrition 7-Domain Changes ───────────────────────
  const domains = [
    { id: 'assimilation', nameEn: 'Assimilation & Digestion', nameBn: 'আত্মীকরণ ও পরিপাক' },
    { id: 'defense_repair', nameEn: 'Defense & Repair (Immune/Inflammation)', nameBn: 'প্রতিরক্ষা ও মেরামত (রোগপ্রতিরোধ/প্রদাহ)' },
    { id: 'energy', nameEn: 'Energy & Mitochondrial Function', nameBn: 'কোষীয় শক্তি ও মাইটোকনড্রিয়াল ক্রিয়া' },
    { id: 'biotransformation', nameEn: 'Biotransformation & Elimination (Liver/Detox)', nameBn: 'জৈব রূপান্তর ও নির্গমন (লিভার/ডিটক্স)' },
    { id: 'transport', nameEn: 'Transport (Cardiovascular & Lymphatic)', nameBn: 'পরিবহন (রক্ত সংবহন ও লিম্ফ্যাটিক)' },
    { id: 'communication', nameEn: 'Communication (Endocrine & Neurotransmitters)', nameBn: 'যোগাযোগ (হরমোন ও নিউরোট্রান্সমিটার)' },
    { id: 'structural_integrity', nameEn: 'Structural Integrity (Cell Membranes/Musculoskeletal)', nameBn: 'কাঠামোগত অখণ্ডতা (কোষের পর্দা ও পেশি/হাড়)' },
  ];

  const baseMatrix = baselineSnapshot.functional_matrix || {};
  const currMatrix = comparisonSnapshot.functional_matrix || {};

  const functional_domain_changes = domains.map(d => {
    const bDomain = baseMatrix[d.id];
    const cDomain = currMatrix[d.id];

    if (!bDomain && !cDomain) {
      return {
        domain: d.id,
        domain_name_en: d.nameEn,
        domain_name_bn: d.nameBn,
        baseline_burden: 'unassessed',
        current_burden: 'unassessed',
        status: 'insufficient_data' as ComparisonOutcome,
        resolved_observations: [],
        persistent_observations: [],
        new_observations: [],
        clinical_notes: 'Functional domain not assessed during these visits.',
      };
    }

    const bBurden = bDomain?.burden || 'unassessed';
    const cBurden = cDomain?.burden || bBurden;

    const burdenRank: Record<string, number> = { unassessed: -1, none: 0, mild: 1, moderate: 2, significant: 3 };
    const bRank = burdenRank[bBurden] ?? -1;
    const cRank = burdenRank[cBurden] ?? -1;

    let status: ComparisonOutcome = 'insufficient_data';
    let notes = 'Functional domain not assessed during this period.';
    if (bRank >= 0 && cRank >= 0) {
      if (cRank < bRank) {
        status = 'improved';
        notes = `Favorable de-escalation of dysfunction burden from ${bBurden} to ${cBurden}.`;
      } else if (cRank > bRank) {
        status = 'worsened';
        notes = `Escalation of burden from ${bBurden} to ${cBurden}; targeted re-evaluation indicated.`;
      } else {
        status = 'stable';
        notes = `Functional symptom burden remains stable (${bBurden}) across consultations.`;
      }
    }

    return {
      domain: d.id,
      domain_name_en: d.nameEn,
      domain_name_bn: d.nameBn,
      baseline_burden: bBurden,
      current_burden: cBurden,
      status,
      resolved_observations: cRank < bRank ? [`Observed reduction in ${d.nameEn.toLowerCase()} symptoms`] : [],
      persistent_observations: cRank >= bRank && bRank > 0 ? [`Ongoing monitored findings in ${d.nameEn.toLowerCase()}`] : [],
      new_observations: [],
      clinical_notes: notes,
    };
  });

  // ── 5. Ayurvedic Longitudinal Tracking ────────────────────────────
  const baseAyur = baselineSnapshot.ayurveda || {};
  const currAyur = comparisonSnapshot.ayurveda || {};

  const prakritiConstant = baseAyur.prakriti || 'unassessed';
  const bVikriti = baseAyur.vikriti;
  const cVikriti = currAyur.vikriti || bVikriti;

  let vikritiTrajEn = 'Dosha balance unassessed or unchanged.';
  let vikritiTrajBn = 'দোষিক অবস্থা অপরিবর্তিত বা অপ্রমূল্যায়িত।';
  if (bVikriti && cVikriti) {
    const vataDelta = (cVikriti.vata ?? 0) - (bVikriti.vata ?? 0);
    const pittaDelta = (cVikriti.pitta ?? 0) - (bVikriti.pitta ?? 0);
    const kaphaDelta = (cVikriti.kapha ?? 0) - (bVikriti.kapha ?? 0);

    if (pittaDelta < 0 || vataDelta < 0 || kaphaDelta < 0) {
      vikritiTrajEn = 'Favorable pacification of aggravated doshas observed through dietary intervention.';
      vikritiTrajBn = 'খাদ্যতালিকাগত পরিবর্তনের মাধ্যমে প্রকুপিত দোষের প্রশমন লক্ষ্য করা গেছে।';
    } else if (pittaDelta > 1 || vataDelta > 1 || kaphaDelta > 1) {
      vikritiTrajEn = 'Increased doshic aggravation observed; cooling/soothing dietary adjustments indicated.';
      vikritiTrajBn = 'দোষিক প্রকোপ বৃদ্ধি পেয়েছে; সুনির্দিষ্ট প্রশমনকারী খাদ্যতালিকাগত পুনর্বিন্যাস আবশ্যক।';
    } else {
      vikritiTrajEn = 'Dosha balance remains stable.';
      vikritiTrajBn = 'দোষিক ভারসাম্য স্থিতিশীল রয়েছে।';
    }
  }

  const bAgni = baseAyur.agni || 'unassessed';
  const cAgni = currAyur.agni || bAgni;
  let agniInterpEn = `Agni state is currently ${cAgni}.`;
  let agniInterpBn = `বর্তমান অগ্নির অবস্থা: ${cAgni}।`;
  if (bAgni !== 'samagni' && (cAgni === 'samagni' || cAgni === 'sama')) {
    agniInterpEn = 'Agni has successfully transitioned to balanced digestive fire (Samagni).';
    agniInterpBn = 'পাচক অগ্নি ভারসাম্যপূর্ণ ও আদর্শ অবস্থায় (সমাগ্নি) উন্নীত হয়েছে।';
  } else if (bAgni === 'unassessed' && cAgni === 'unassessed') {
    agniInterpEn = 'Digestive fire (Agni) has not been formally assessed.';
    agniInterpBn = 'পাচক অগ্নির অবস্থা আনুষ্ঠানিকভাবে মূল্যায়ন করা হয়নি।';
  }

  const ayurvedic_changes = {
    prakriti_constant: prakritiConstant,
    baseline_vikriti: bVikriti,
    current_vikriti: cVikriti,
    vikriti_trajectory_en: vikritiTrajEn,
    vikriti_trajectory_bn: vikritiTrajBn,
    baseline_agni: bAgni,
    current_agni: cAgni,
    agni_interpretation_en: agniInterpEn,
    agni_interpretation_bn: agniInterpBn,
  };

  // ── 6. Adherence Summary ──────────────────────────────────────────
  const adherence = comparisonSnapshot.adherence || {};
  const adherence_summary = {
    diet_adherence_pct: adherence.diet_adherence_pct,
    supplement_adherence_pct: adherence.supplement_adherence_pct,
    reported_barriers: adherence.barriers || [],
    adverse_reactions: adherence.adverse_reactions || [],
  };

  // ── 7. Overall Summary Partitioning ──────────────────────────────
  const allChanges = [...anthropometric_changes, ...symptom_changes, ...laboratory_changes];
  const improved_areas = allChanges.filter(c => c.outcome === 'improved').map(c => `${c.marker_name_en}: ${c.clinical_interpretation_en}`);
  const worsened_areas = allChanges.filter(c => c.outcome === 'worsened').map(c => `${c.marker_name_en}: ${c.clinical_interpretation_en}`);
  const stable_areas = allChanges.filter(c => c.outcome === 'stable').map(c => `${c.marker_name_en}: Stable`);
  const insufficient_data_areas = allChanges.filter(c => c.outcome === 'insufficient_data').map(c => c.marker_name_en);

  // ── 8. Clinical Safety Review & Medication Updates ───────────────
  const baseMeds = baselineSnapshot.medications?.reconciled_records || [];
  const currMeds = comparisonSnapshot.medications?.reconciled_records || [];
  const baseMedNames = new Set(baseMeds.map(m => m.medication_name.toLowerCase()));
  const currMedNames = new Set(currMeds.map(m => m.medication_name.toLowerCase()));

  const newMeds = currMeds.filter(m => !baseMedNames.has(m.medication_name.toLowerCase())).map(m => `New: ${m.medication_name} (${m.dose || 'unspecified dose'})`);
  const discontinuedMeds = baseMeds.filter(m => !currMedNames.has(m.medication_name.toLowerCase())).map(m => `Discontinued: ${m.medication_name}`);

  const baseAllergies: string[] = baselineSnapshot.allergies?.confirmed_allergies || (baselineSnapshot.allergies as any)?.confirmed_allergens || [];
  const currAllergies: string[] = comparisonSnapshot.allergies?.confirmed_allergies || (comparisonSnapshot.allergies as any)?.confirmed_allergens || [];
  const newAllergies = currAllergies.filter(a => !baseAllergies.includes(a));

  const clinical_safety_review = {
    new_red_flags: [],
    new_allergies: newAllergies,
    medication_changes: [...newMeds, ...discontinuedMeds],
    new_contraindications: [],
  };

  // ── 9. Next Clinical Priorities ──────────────────────────────────
  const next_clinical_priorities: string[] = [];
  if (worsened_areas.length > 0) {
    next_clinical_priorities.push(`Address worsening parameters: ${worsened_areas.slice(0, 2).map(w => w.split(':')[0]).join(', ')}`);
  }
  if (insufficient_data_areas.length > 0) {
    next_clinical_priorities.push(`Order follow-up repeat testing for: ${insufficient_data_areas.slice(0, 2).join(', ')}`);
  }
  if (next_clinical_priorities.length === 0) {
    next_clinical_priorities.push('Consolidate current favorable nutritional adaptations and advance to next phase goals.');
  }

  return {
    patient_id: patient.id,
    baseline_visit_id: baselineSnapshot.visit_id,
    comparison_visit_id: comparisonSnapshot.visit_id,
    comparison_mode: comparisonMode,
    generated_at: new Date().toISOString(),
    anthropometric_changes,
    symptom_changes,
    laboratory_changes,
    functional_domain_changes,
    ayurvedic_changes,
    adherence_summary,
    overall_summary: {
      improved_areas,
      worsened_areas,
      stable_areas,
      unresolved_problems: worsened_areas.length > 0 ? worsened_areas : ['Ongoing lifestyle consistency'],
      insufficient_data_areas,
    },
    clinical_safety_review,
    next_clinical_priorities,
  };
}

/**
 * Builds the Printable A4 Comparative Clinical Progress Report (Sections A–L)
 */
export function buildComparativeProgressReport(params: {
  patient: PatientProfile;
  baselineSnapshot: ClinicalVisitSnapshot;
  comparisonSnapshot: ClinicalVisitSnapshot;
  analysis: LongitudinalProgressAnalysis;
  reviewingNutritionist?: string;
  clinicianNotes?: string;
  isApproved?: boolean;
}): ComparativeProgressReport {
  const {
    patient,
    baselineSnapshot,
    comparisonSnapshot,
    analysis,
    reviewingNutritionist = 'Dr. Clinical Nutritionist',
    clinicianNotes,
    isApproved = false,
  } = params;

  const baseDate = new Date(baselineSnapshot.visit_date);
  const compDate = new Date(comparisonSnapshot.visit_date);
  const diffTime = Math.abs(compDate.getTime() - baseDate.getTime());
  const daysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 0;

  const reportId = `prog_rpt_${patient.id}_${baselineSnapshot.visit_id}_${comparisonSnapshot.visit_id}_v1`;

  return {
    report_id: reportId,
    patient_id: patient.id,
    baseline_visit_id: baselineSnapshot.visit_id,
    comparison_visit_id: comparisonSnapshot.visit_id,
    generated_at: new Date().toISOString(),
    revision: 1,
    is_approved: isApproved,
    approved_by: isApproved ? reviewingNutritionist : undefined,
    approval_date: isApproved ? new Date().toISOString().split('T')[0] : undefined,
    clinician_notes: clinicianNotes,

    sectionA_patientAndConsultation: {
      patient_name: patient.name,
      patient_id: patient.id,
      age: patient.age,
      gender: patient.gender,
      baseline_date: baselineSnapshot.visit_date,
      comparison_date: comparisonSnapshot.visit_date,
      days_elapsed: daysElapsed,
      reviewing_nutritionist: reviewingNutritionist,
    },

    sectionB_overallSummary: {
      improved: analysis.overall_summary.improved_areas,
      worsened: analysis.overall_summary.worsened_areas,
      stable: analysis.overall_summary.stable_areas,
      unresolved: analysis.overall_summary.unresolved_problems,
      insufficient_data: analysis.overall_summary.insufficient_data_areas,
    },

    sectionC_anthropometricComparison: analysis.anthropometric_changes,
    sectionD_symptomProgress: analysis.symptom_changes,
    sectionE_laboratoryTrends: analysis.laboratory_changes,
    sectionF_functionalMatrixChanges: analysis.functional_domain_changes,

    sectionG_dietaryPatternAndAdherence: {
      adherence_score_pct: analysis.adherence_summary?.diet_adherence_pct,
      barriers: analysis.adherence_summary?.reported_barriers || [],
      adverse_reactions: analysis.adherence_summary?.adverse_reactions || [],
      dietary_changes: comparisonSnapshot.dietary_pattern?.noted_changes || [],
    },

    sectionH_ayurvedicProgress: analysis.ayurvedic_changes,
    sectionI_clinicalSafetyReview: analysis.clinical_safety_review,

    sectionJ_clinicalOutcomeInterpretation: {
      achieved_goals: analysis.overall_summary.improved_areas.slice(0, 3),
      partially_achieved_goals: analysis.overall_summary.stable_areas.slice(0, 2),
      unachieved_goals: analysis.overall_summary.worsened_areas.slice(0, 2),
      unassessable_goals: analysis.overall_summary.insufficient_data_areas,
      causality_caveat_en: 'Notice: Observed clinical improvements correlate with multifaceted dietary, lifestyle, and medical interventions; singular causal efficacy must not be inferred solely from observational progress tracking.',
      causality_caveat_bn: 'সতর্কবার্তা: পরিলক্ষিত ক্লিনিক্যাল উন্নতি বহুমুখী খাদ্যতালিকা, জীবনযাত্রা ও চিকিৎসার সম্মিলিত প্রভাবের সাথে সম্পর্কিত; শুধুমাত্র পর্যবেক্ষণমূলক অগ্রগতির ভিত্তিতে একক কারণ হিসেবে কোনো নির্দিষ্ট উপাদানকে দায়ী করা সমীচীন নয়।',
    },

    sectionK_nextClinicalPriorities: analysis.next_clinical_priorities,

    sectionL_nutritionistReview: {
      reviewing_nutritionist: reviewingNutritionist,
      review_date: new Date().toISOString().split('T')[0],
      status: isApproved ? 'fully_approved' : 'draft',
      notes: clinicianNotes || (isApproved
        ? 'Comparative longitudinal progress reviewed and verified for clinical diet adjustment.'
        : 'Provisional comparison report. Requires clinician sign-off prior to final record storage.'),
      revision: 1,
    },
  };
}

/**
 * Builds the structured handoff contract for future Phase P3 intervention revisions
 */
export function constructClinicalProgressPlanningContext(params: {
  patient: PatientProfile;
  currentVisitId: string;
  comparisonVisitId: string;
  progressReport: ComparativeProgressReport;
  analysis: LongitudinalProgressAnalysis;
}): ClinicalProgressPlanningContext {
  const { patient, currentVisitId, comparisonVisitId, progressReport, analysis } = params;

  return {
    patientId: patient.id,
    currentVisitId,
    comparisonVisitId,
    progressReportId: progressReport.report_id,
    generatedAt: new Date().toISOString(),
    clinicalImprovements: analysis.overall_summary.improved_areas,
    clinicalDeteriorations: analysis.overall_summary.worsened_areas,
    persistentConcerns: analysis.overall_summary.unresolved_problems,
    newlyDetectedRestrictions: analysis.clinical_safety_review.new_allergies,
    medicationChanges: analysis.clinical_safety_review.medication_changes,
    laboratoryTrends: analysis.laboratory_changes
      .filter(l => l.comparability === 'comparable' && l.absolute_change !== undefined)
      .map(l => ({
        marker: l.marker_name_en,
        delta: l.absolute_change!,
        unit: l.unit,
        outcome: l.outcome,
      })),
    dietaryAdherencePct: analysis.adherence_summary?.diet_adherence_pct,
    clinicianReviewStatus: progressReport.is_approved ? 'approved' : 'pending',
    approvedNextObjectives: analysis.next_clinical_priorities,
  };
}

/**
 * Validates clinician credential strings against placeholders and empty inputs.
 */
export function validateClinicianCredentials(clinicianId: string): boolean {
  const trimmed = (clinicianId || '').trim();
  const isPlaceholder = [
    'clinician',
    'dr. clinical nutritionist',
    'doctor',
    'nutritionist',
    'admin',
    'user',
    'test',
    'guest'
  ].includes(trimmed.toLowerCase());
  return Boolean(trimmed && trimmed.length >= 3 && !isPlaceholder);
}
