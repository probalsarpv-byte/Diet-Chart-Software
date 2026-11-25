/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Phase R7-C: Individualized Supplement Intelligence Engine
 *
 * Implements:
 * - Multi-ingredient formulation decomposition & elemental calculation
 * - Separation of Current Approved vs Proposed Candidate vs Fortified Dietary exposure
 * - Physical product deduplication (prevents double-counting same SKU across sync sources)
 * - Age/life-stage Tolerable Upper Limit (UL) registry (pediatric through geriatric, pregnancy/lactation, renal gates)
 * - Single-dose bolus & laxative tolerance checks
 * - Incomplete composition / unknown dose preservation (never coerces unknown -> 0)
 * - Honest brand verification provenance metadata (no fabricated BD market verification)
 */

import {
  PatientProfile
} from '../../types';
import {
  R7NutrientExposureBucket,
  R7SupplementExposureSummary,
  SupplementBrandVerificationMetadata,
  SupplementFrequency,
  SupplementIngredient,
  SupplementProtocolItem
} from '../../types/r4Protocol';
import { R5PopulationProfile } from '../../types/r5Systems';
import { buildR5PopulationProfile } from '../r5PopulationEngine';
import { R7LabIntelligenceSummary } from '../../types/r7Laboratory';

export interface LifeStageUpperLimit {
  nutrient_id: string;
  nutrient_name: string;
  unit: string;
  ul_by_stage: {
    infant_0_12m?: number;
    child_1_3?: number;
    child_4_8?: number;
    child_9_13?: number;
    adolescent_14_18?: number;
    adult_19_50: number;
    adult_51_plus: number;
    pregnancy?: number;
    lactation?: number;
  };
  single_dose_bolus_threshold?: number;
  single_dose_rationale_en?: string;
  renal_egfr30_caution?: string;
  evidence_id: string;
  note_en: string;
}

export const R7_LIFE_STAGE_UL_REGISTRY: Record<string, LifeStageUpperLimit> = {
  magnesium: {
    nutrient_id: 'magnesium',
    nutrient_name: 'Supplemental Elemental Magnesium',
    unit: 'mg',
    ul_by_stage: {
      infant_0_12m: undefined, // Supplemental Mg discouraged without specialist supervision
      child_1_3: 65,
      child_4_8: 110,
      child_9_13: 350,
      adolescent_14_18: 350,
      adult_19_50: 350,
      adult_51_plus: 350,
      pregnancy: 350,
      lactation: 350
    },
    single_dose_bolus_threshold: 350,
    single_dose_rationale_en: 'Single bolus >=350 mg supplemental magnesium increases osmotic diarrhea / GI intolerance risk.',
    renal_egfr30_caution: 'eGFR < 30 mL/min/1.73m2: high risk of hypermagnesemia — clinician renal authorization mandatory.',
    evidence_id: 'NIH_ODS_UL_MAGNESIUM_2024',
    note_en: 'IOM/FNB Tolerable Upper Limit applies strictly to non-food supplemental/pharmacologic magnesium.'
  },
  vitamin_d3: {
    nutrient_id: 'vitamin_d3',
    nutrient_name: 'Vitamin D3 (Cholecalciferol)',
    unit: 'IU',
    ul_by_stage: {
      infant_0_12m: 1500,
      child_1_3: 2500,
      child_4_8: 3000,
      child_9_13: 4000,
      adolescent_14_18: 4000,
      adult_19_50: 4000,
      adult_51_plus: 4000,
      pregnancy: 4000,
      lactation: 4000
    },
    single_dose_bolus_threshold: 10000,
    single_dose_rationale_en: 'High single/weekly bolus dosing (>=10,000 IU per administration) requires periodic 25(OH)D & calcium monitoring.',
    renal_egfr30_caution: 'In CKD, monitor serum calcium, phosphate, and PTH before escalating Vitamin D3.',
    evidence_id: 'ENDOCRINE_VITD_2024',
    note_en: 'IOM 4,000 IU/day UL for age >=9y; higher short-term weekly repletion requires baseline 25(OH)D deficiency and prescriber supervision.'
  },
  zinc: {
    nutrient_id: 'zinc',
    nutrient_name: 'Elemental Zinc',
    unit: 'mg',
    ul_by_stage: {
      infant_0_12m: 5,
      child_1_3: 7,
      child_4_8: 12,
      child_9_13: 23,
      adolescent_14_18: 34,
      adult_19_50: 40,
      adult_51_plus: 40,
      pregnancy: 40,
      lactation: 40
    },
    single_dose_bolus_threshold: 50,
    single_dose_rationale_en: 'Single dose >=50 mg elemental zinc causes nausea/gastric irritation and chronic copper antagonism.',
    evidence_id: 'NIH_ODS_UL_GENERAL_2024',
    note_en: 'Chronic intake >40 mg/day in adults impairs copper absorption (ceruloplasmin/anemia risk).'
  },
  iron: {
    nutrient_id: 'iron',
    nutrient_name: 'Elemental Iron',
    unit: 'mg',
    ul_by_stage: {
      infant_0_12m: 40,
      child_1_3: 40,
      child_4_8: 40,
      child_9_13: 40,
      adolescent_14_18: 45,
      adult_19_50: 45,
      adult_51_plus: 45,
      pregnancy: 45,
      lactation: 45
    },
    single_dose_bolus_threshold: 65,
    single_dose_rationale_en: 'High single elemental iron bolus (>=65 mg) worsens GI side effects and hepcidin upregulation; alternate-day dosing may improve fractional absorption.',
    evidence_id: 'WHO_FERRITIN_2020',
    note_en: '45 mg/day IOM UL (unless clinician-supervised iron-deficiency repletion with confirmed low ferritin/TSAT).'
  },
  calcium: {
    nutrient_id: 'calcium',
    nutrient_name: 'Elemental Calcium',
    unit: 'mg',
    ul_by_stage: {
      infant_0_12m: 1500,
      child_1_3: 2500,
      child_4_8: 2500,
      child_9_13: 3000,
      adolescent_14_18: 3000,
      adult_19_50: 2500,
      adult_51_plus: 2000,
      pregnancy: 2500,
      lactation: 2500
    },
    single_dose_bolus_threshold: 600,
    single_dose_rationale_en: 'Intestinal calcium transport saturates near 500-600 mg elemental per administration; divide larger daily doses.',
    renal_egfr30_caution: 'CKD / vascular calcification risk: total elemental calcium load must be reviewed against serum Ca and phosphate.',
    evidence_id: 'NIH_ODS_UL_GENERAL_2024',
    note_en: 'Adult UL decreases to 2,000 mg/day above age 50 (IOM).'
  },
  folate: {
    nutrient_id: 'folate',
    nutrient_name: 'Supplemental Folate / Folic Acid',
    unit: 'mcg',
    ul_by_stage: {
      infant_0_12m: undefined,
      child_1_3: 300,
      child_4_8: 400,
      child_9_13: 600,
      adolescent_14_18: 800,
      adult_19_50: 1000,
      adult_51_plus: 1000,
      pregnancy: 1000,
      lactation: 1000
    },
    evidence_id: 'NIH_ODS_UL_GENERAL_2024',
    note_en: 'Supplemental folate >=1,000 mcg/day can mask hematologic signs of Vitamin B12 deficiency.'
  },
  pyridoxine_b6: {
    nutrient_id: 'pyridoxine_b6',
    nutrient_name: 'Vitamin B6 (Pyridoxine)',
    unit: 'mg',
    ul_by_stage: {
      infant_0_12m: undefined,
      child_1_3: 30,
      child_4_8: 40,
      child_9_13: 60,
      adolescent_14_18: 80,
      adult_19_50: 100,
      adult_51_plus: 100,
      pregnancy: 100,
      lactation: 100
    },
    single_dose_bolus_threshold: 50,
    single_dose_rationale_en: 'Chronic B6 >=50-100 mg/day carries dose-dependent sensory peripheral neuropathy risk (EFSA 2023 recommends 12 mg UL).',
    evidence_id: 'NIH_ODS_UL_GENERAL_2024',
    note_en: 'IOM UL 100 mg/day; review if >12-50 mg/day chronically without isoniazid indication.'
  },
  selenium: {
    nutrient_id: 'selenium',
    nutrient_name: 'Selenium',
    unit: 'mcg',
    ul_by_stage: {
      infant_0_12m: 60,
      child_1_3: 90,
      child_4_8: 150,
      child_9_13: 280,
      adolescent_14_18: 400,
      adult_19_50: 400,
      adult_51_plus: 400,
      pregnancy: 400,
      lactation: 400
    },
    evidence_id: 'NIH_ODS_UL_GENERAL_2024',
    note_en: 'Excess selenium (>400 mcg/day) induces selenosis (alopecia, nail brittleness, neuropathy).'
  },
  vitamin_a: {
    nutrient_id: 'vitamin_a',
    nutrient_name: 'Preformed Vitamin A (Retinol)',
    unit: 'mcg',
    ul_by_stage: {
      infant_0_12m: 600,
      child_1_3: 600,
      child_4_8: 900,
      child_9_13: 1700,
      adolescent_14_18: 2800,
      adult_19_50: 3000,
      adult_51_plus: 3000,
      pregnancy: 3000,
      lactation: 3000
    },
    evidence_id: 'NIH_ODS_UL_GENERAL_2024',
    note_en: 'Preformed retinol excess (>3,000 mcg RAE or >10,000 IU in pregnancy) is teratogenic.'
  },
  vitamin_c: {
    nutrient_id: 'vitamin_c',
    nutrient_name: 'Vitamin C (Ascorbic Acid)',
    unit: 'mg',
    ul_by_stage: {
      infant_0_12m: undefined,
      child_1_3: 400,
      child_4_8: 650,
      child_9_13: 1200,
      adolescent_14_18: 1800,
      adult_19_50: 2000,
      adult_51_plus: 2000,
      pregnancy: 2000,
      lactation: 2000
    },
    renal_egfr30_caution: 'CKD / calcium oxalate stone history: high-dose Vitamin C (>500 mg/day) converts partially to oxalate.',
    evidence_id: 'NIH_ODS_UL_GENERAL_2024',
    note_en: 'IOM adult UL 2,000 mg/day.'
  },
  potassium: {
    nutrient_id: 'potassium',
    nutrient_name: 'Supplemental Potassium',
    unit: 'mg',
    ul_by_stage: {
      adult_19_50: 99, // Standard OTC limit per unit without prescription
      adult_51_plus: 99,
      child_1_3: 0,
      child_4_8: 0,
      child_9_13: 0,
      adolescent_14_18: 99,
      pregnancy: 99,
      lactation: 99
    },
    renal_egfr30_caution: 'eGFR < 30 mL/min, hyperkalemia, or RAAS/K-sparing therapy: supplemental potassium CONTRAINDICATED unless inpatient/nephrologist prescribed.',
    evidence_id: 'KDIGO_CKD_2024',
    note_en: 'Supplemental potassium requires potassium-safety clearance against renal function, serum K+, and medications.'
  }
};

export const STOICHIOMETRIC_SALT_ELEMENTAL_FRACTION: Record<string, number> = {
  'magnesium oxide': 0.60,
  'magnesium citrate': 0.16,
  'magnesium glycinate': 0.141,
  'magnesium bisglycinate': 0.141,
  'magnesium taurate': 0.089,
  'magnesium l-threonate': 0.083,
  'calcium carbonate': 0.40,
  'calcium citrate': 0.21,
  'ferrous sulfate': 0.20,
  'ferrous fumarate': 0.33,
  'ferrous gluconate': 0.12,
  'ferrous bisglycinate': 0.20,
  'zinc sulfate': 0.23,
  'zinc gluconate': 0.143,
  'zinc picolinate': 0.21
};

export function canonicalizeNutrientId(nameOrId: string): string {
  const s = (nameOrId || '').toLowerCase().trim();
  if (!s) return 'unknown_nutrient';
  if (s.includes('magnesium') || s === 'mg') return 'magnesium';
  if (s.includes('vitamin d3') || s.includes('cholecalciferol') || s === 'vitamin_d' || s === 'vitamin_d3') return 'vitamin_d3';
  if (s.includes('vitamin k2') || s.includes('mk-7') || s.includes('menaquinone') || s === 'vitamin_k2') return 'vitamin_k2';
  if (s.includes('vitamin k') || s === 'vitamin_k') return 'vitamin_k';
  if (s.includes('b12') || s.includes('cobalamin')) return 'vitamin_b12';
  if (s.includes('folate') || s.includes('folic') || s.includes('5-mthf') || s.includes('methylfolate') || s.includes('b9')) return 'folate';
  if (s.includes('b6') || s.includes('pyridoxine')) return 'pyridoxine_b6';
  if (s.includes('zinc')) return 'zinc';
  if (s.includes('iron') || s.includes('ferrous') || s.includes('ferric')) return 'iron';
  if (s.includes('calcium')) return 'calcium';
  if (s.includes('potassium')) return 'potassium';
  if (s.includes('selenium')) return 'selenium';
  if (s.includes('vitamin a') || s.includes('retinol')) return 'vitamin_a';
  if (s.includes('vitamin c') || s.includes('ascorbic')) return 'vitamin_c';
  if (s.includes('coq10') || s.includes('ubiquinol') || s.includes('ubiquinone')) return 'coq10';
  if (s.includes('omega-3') || s.includes('omega 3') || s.includes('epa/dha') || s.includes('fish oil')) return 'omega_3';
  if (s.includes('berberine')) return 'berberine';
  if (s.includes('ashwagandha')) return 'ashwagandha';
  if (s.includes('theanine')) return 'l_theanine';
  if (s.includes('curcumin')) return 'curcumin';
  if (s.includes('boswellia')) return 'boswellia';
  if (s.includes('quercetin')) return 'quercetin';
  if (s.includes('probiotic') || s.includes('boulardii') || s.includes('lactobacillus')) return 'probiotic';
  return s.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function resolveLifeStageUpperLimit(
  nutrientId: string,
  patient: Partial<PatientProfile>,
  population?: R5PopulationProfile
): { ul?: number; stageLabel: string; unit?: string; def?: LifeStageUpperLimit } {
  const def = R7_LIFE_STAGE_UL_REGISTRY[nutrientId];
  if (!def) return { stageLabel: 'no_ul_defined' };

  const pop = population || buildR5PopulationProfile(patient);
  if (pop.pregnancy?.active && def.ul_by_stage.pregnancy !== undefined) {
    return { ul: def.ul_by_stage.pregnancy, stageLabel: 'pregnancy', unit: def.unit, def };
  }
  if (pop.lactation?.active && def.ul_by_stage.lactation !== undefined) {
    return { ul: def.ul_by_stage.lactation, stageLabel: 'lactation', unit: def.unit, def };
  }

  const age = pop.age;
  if (age === undefined || pop.is_age_unentered) {
    return { ul: def.ul_by_stage.adult_19_50, stageLabel: 'adult_default_age_unentered', unit: def.unit, def };
  }
  if (age < 1) {
    return { ul: def.ul_by_stage.infant_0_12m, stageLabel: 'infant_0_12m', unit: def.unit, def };
  }
  if (age < 4) {
    return { ul: def.ul_by_stage.child_1_3, stageLabel: 'child_1_3y', unit: def.unit, def };
  }
  if (age < 9) {
    return { ul: def.ul_by_stage.child_4_8, stageLabel: 'child_4_8y', unit: def.unit, def };
  }
  if (age < 14) {
    return { ul: def.ul_by_stage.child_9_13, stageLabel: 'child_9_13y', unit: def.unit, def };
  }
  if (age < 19) {
    return { ul: def.ul_by_stage.adolescent_14_18, stageLabel: 'adolescent_14_18y', unit: def.unit, def };
  }
  if (age >= 51) {
    return { ul: def.ul_by_stage.adult_51_plus, stageLabel: 'adult_51_plus', unit: def.unit, def };
  }
  return { ul: def.ul_by_stage.adult_19_50, stageLabel: 'adult_19_50', unit: def.unit, def };
}

export function getFrequencyDailyMultiplier(frequency: SupplementFrequency | string): {
  multiplier?: number;
  isUnknownOrPrn: boolean;
  isBolus: boolean;
} {
  switch (frequency) {
    case 'once_daily':
      return { multiplier: 1, isUnknownOrPrn: false, isBolus: false };
    case 'twice_daily':
      return { multiplier: 2, isUnknownOrPrn: false, isBolus: false };
    case 'thrice_daily':
      return { multiplier: 3, isUnknownOrPrn: false, isBolus: false };
    case 'alternate_days':
      return { multiplier: 0.5, isUnknownOrPrn: false, isBolus: false };
    case 'twice_weekly':
      return { multiplier: 2 / 7, isUnknownOrPrn: false, isBolus: false };
    case 'three_times_weekly':
      return { multiplier: 3 / 7, isUnknownOrPrn: false, isBolus: false };
    case 'weekly':
      return { multiplier: 1 / 7, isUnknownOrPrn: false, isBolus: false };
    case 'single_bolus':
      return { multiplier: undefined, isUnknownOrPrn: false, isBolus: true };
    case 'as_needed':
    case 'unknown':
    default:
      return { multiplier: undefined, isUnknownOrPrn: true, isBolus: false };
  }
}

export function computePhysicalProductKey(item: SupplementProtocolItem): string {
  if (item.physical_product_key) return item.physical_product_key.trim().toLowerCase();
  const base = (item.catalog_id || item.brand_name || item.generic_nutrient || '').trim().toLowerCase();
  const form = (item.chemical_form || '').trim().toLowerCase();
  const dose = (item.total_compound_dose || '').trim().toLowerCase();
  const time = (item.administration_time || 'UNKNOWN').trim().toUpperCase();
  return `${base}::${form}::${dose}::${time}`;
}

export function extractItemIngredients(item: SupplementProtocolItem): SupplementIngredient[] {
  if (item.ingredients && item.ingredients.length > 0) {
    return item.ingredients.map(ing => ({
      ...ing,
      nutrient_id: canonicalizeNutrientId(ing.nutrient_id || ing.nutrient_name)
    }));
  }

  // Fallback for legacy single-nutrient items
  const rawDose = (item.total_compound_dose || '').trim();
  const doseUnknown =
    item.is_dose_unknown ||
    !rawDose ||
    rawDose.toUpperCase() === 'UNKNOWN' ||
    /proprietary|unknown|blend/i.test(rawDose);

  let elementalPerUnit = item.elemental_dose_numeric;
  let unit = item.elemental_dose_unit as SupplementIngredient['amount_unit'];
  const unitsPerDose = item.prescribed_units_per_dose ?? 1;

  if (elementalPerUnit === undefined && !doseUnknown) {
    const match = rawDose.replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*(mg|mcg|ug|µg|iu|g|meq)/i);
    if (match) {
      elementalPerUnit = parseFloat(match[1]);
      const rawU = match[2].toLowerCase();
      unit =
        rawU === 'ug' || rawU === 'µg' || rawU === 'mcg'
          ? 'mcg'
          : rawU === 'iu'
          ? 'IU'
          : rawU === 'meq'
          ? 'mEq'
          : (rawU as any);
    }
  }

  // Multi-ingredient heuristic only if explicit Vitamin D3 + K2 combined string without structured array
  const combinedText = `${item.generic_nutrient} ${item.chemical_form}`.toLowerCase();
  if (combinedText.includes('d3') && (combinedText.includes('k2') || combinedText.includes('mk-7')) && rawDose.includes('+')) {
    const parts = rawDose.split('+').map(p => p.trim());
    const out: SupplementIngredient[] = [];
    for (const part of parts) {
      const m = part.replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*(IU|mcg|mg)/i);
      if (part.toLowerCase().includes('k2') || part.toLowerCase().includes('mk') || m?.[2]?.toLowerCase() === 'mcg') {
        out.push({
          nutrient_id: 'vitamin_k2',
          nutrient_name: 'Vitamin K2 (MK-7)',
          elemental_amount_per_unit: m ? parseFloat(m[1]) : undefined,
          amount_unit: 'mcg',
          prescribed_units_per_dose: unitsPerDose,
          compound_amount_text: part,
          is_standardized: Boolean(m),
          is_elemental_known: Boolean(m)
        });
      } else {
        out.push({
          nutrient_id: 'vitamin_d3',
          nutrient_name: 'Vitamin D3 (Cholecalciferol)',
          elemental_amount_per_unit: m ? parseFloat(m[1]) : undefined,
          amount_unit: 'IU',
          prescribed_units_per_dose: unitsPerDose,
          compound_amount_text: part,
          is_standardized: Boolean(m),
          is_elemental_known: Boolean(m)
        });
      }
    }
    if (out.length > 0) return out;
  }

  const nutrientId = canonicalizeNutrientId(item.generic_nutrient);
  return [
    {
      nutrient_id: nutrientId,
      nutrient_name: item.generic_nutrient,
      chemical_form: item.chemical_form,
      elemental_amount_per_unit: doseUnknown ? undefined : elementalPerUnit,
      amount_unit: unit || (nutrientId === 'vitamin_d3' ? 'IU' : nutrientId === 'vitamin_b12' || nutrientId === 'folate' ? 'mcg' : 'mg'),
      prescribed_units_per_dose: unitsPerDose,
      compound_amount_text: rawDose || 'UNKNOWN',
      is_standardized: !doseUnknown,
      is_elemental_known: !doseUnknown && elementalPerUnit !== undefined
    }
  ];
}

export function normalizeNutrientDoseUnit(
  value: number,
  fromUnit: string | undefined,
  targetUnit: string | undefined
): number {
  const f = (fromUnit || '').toLowerCase();
  const t = (targetUnit || '').toLowerCase();
  if (!f || !t || f === t) return value;
  if (f === 'g' && t === 'mg') return value * 1000;
  if (f === 'mg' && t === 'mcg') return value * 1000;
  if (f === 'mcg' && t === 'mg') return value / 1000;
  return value;
}

export interface CalculateExposureOptions {
  supplements: SupplementProtocolItem[];
  patient: Partial<PatientProfile>;
  population?: R5PopulationProfile;
  labSummary?: R7LabIntelligenceSummary;
  fortifiedDietByNutrient?: Record<string, { amount: number; unit: string; source_label: string }>;
}

export function calculateR7SupplementExposure(options: CalculateExposureOptions): R7SupplementExposureSummary {
  const { supplements, patient, labSummary, fortifiedDietByNutrient } = options;
  const population = options.population || buildR5PopulationProfile(patient);
  const exposuresByNutrient: Record<string, R7NutrientExposureBucket> = {};
  const incompleteItems: string[] = [];
  const safetyBlocks: string[] = [];
  const safetyReviews: string[] = [];
  const overlaps: R7SupplementExposureSummary['overlaps'] = [];

  // 1. Physical product deduplication
  const physicalMap = new Map<string, SupplementProtocolItem[]>();
  const activeItems = supplements.filter(
    s => s.approval_status !== 'rejected' && s.approval_status !== 'discontinued'
  );

  for (const item of activeItems) {
    const pKey = computePhysicalProductKey(item);
    const list = physicalMap.get(pKey) || [];
    list.push(item);
    physicalMap.set(pKey, list);
  }

  const physicalDuplicates: R7SupplementExposureSummary['physical_duplicates'] = [];
  const deduplicatedItems: SupplementProtocolItem[] = [];
  for (const [pKey, group] of physicalMap.entries()) {
    // Prefer clinician_approved if both approved and draft duplicate exist
    const sorted = [...group].sort((a, b) => {
      if (a.approval_status === 'clinician_approved' && b.approval_status !== 'clinician_approved') return -1;
      if (b.approval_status === 'clinician_approved' && a.approval_status !== 'clinician_approved') return 1;
      return 0;
    });
    deduplicatedItems.push(sorted[0]);
    if (group.length > 1) {
      physicalDuplicates.push({
        physical_key: pKey,
        item_ids: group.map(g => g.id),
        label: sorted[0].brand_name || sorted[0].generic_nutrient
      });
    }
  }

  // 2. Accumulate nutrient exposure per item and ingredient
  for (const item of deduplicatedItems) {
    const ingredients = extractItemIngredients(item);
    const freqInfo = getFrequencyDailyMultiplier(item.frequency);
    const isCurrentApproved =
      item.approval_status === 'clinician_approved' ||
      Boolean(item.is_current_baseline_intake) ||
      item.source === 'patient_baseline_intake';

    if (item.is_frequency_unknown || freqInfo.isUnknownOrPrn) {
      const msg = `${item.generic_nutrient} (${item.id}): unknown or PRN frequency prevents reliable cumulative daily UL verification.`;
      if (!incompleteItems.includes(msg)) incompleteItems.push(msg);
    }

    for (const ing of ingredients) {
      const nid = ing.nutrient_id;
      const ulResolution = resolveLifeStageUpperLimit(nid, patient, population);
      const targetUnit = ulResolution.unit || ing.amount_unit || 'mg';

      if (!exposuresByNutrient[nid]) {
        exposuresByNutrient[nid] = {
          nutrient_id: nid,
          nutrient_name: ulResolution.def?.nutrient_name || ing.nutrient_name,
          unit: targetUnit,
          current_approved_daily: 0,
          proposed_candidate_daily: 0,
          fortified_diet_daily: 0,
          combined_daily: 0,
          max_single_admin_dose: 0,
          tolerable_upper_limit: ulResolution.ul,
          ul_life_stage: ulResolution.stageLabel,
          ul_reference_id: ulResolution.def?.evidence_id,
          exceeds_ul: false,
          exceeds_single_dose_threshold: false,
          is_incomplete_exposure: false,
          incomplete_reasons: [],
          contributing_items: []
        };
      }

      const bucket = exposuresByNutrient[nid];
      const unitsCount = ing.prescribed_units_per_dose ?? item.prescribed_units_per_dose ?? 1;

      if (!ing.is_elemental_known || ing.elemental_amount_per_unit === undefined || Number.isNaN(ing.elemental_amount_per_unit)) {
        bucket.is_incomplete_exposure = true;
        const reason = `${item.generic_nutrient} (${item.id}): exact elemental amount unknown/unstandardized.`;
        if (!bucket.incomplete_reasons.includes(reason)) bucket.incomplete_reasons.push(reason);
        if (!incompleteItems.includes(reason)) incompleteItems.push(reason);
        bucket.contributing_items.push({
          item_id: item.id,
          label: item.brand_name ? `${item.brand_name} (${ing.nutrient_name})` : ing.nutrient_name,
          approval_status: item.approval_status,
          daily_contribution: 0,
          single_dose_contribution: 0,
          is_incomplete: true
        });
        continue;
      }

      const singleAdminRaw = ing.elemental_amount_per_unit * unitsCount;
      const singleAdminNormalized = normalizeNutrientDoseUnit(singleAdminRaw, ing.amount_unit, targetUnit);

      if (singleAdminNormalized > bucket.max_single_admin_dose) {
        bucket.max_single_admin_dose = singleAdminNormalized;
      }

      let dailyContribution = 0;
      let contributionIncomplete = false;
      if (freqInfo.multiplier !== undefined) {
        dailyContribution = singleAdminNormalized * freqInfo.multiplier;
      } else if (freqInfo.isBolus) {
        // Single bolus dose is evaluated on max_single_admin_dose and flagged for supervision
        dailyContribution = 0;
        contributionIncomplete = true;
        bucket.is_incomplete_exposure = true;
        bucket.incomplete_reasons.push(`${item.generic_nutrient}: single bolus regimen evaluated by peak dose (${singleAdminNormalized} ${targetUnit}).`);
      } else {
        contributionIncomplete = true;
        bucket.is_incomplete_exposure = true;
        bucket.incomplete_reasons.push(`${item.generic_nutrient}: unverified/PRN frequency (${item.frequency}).`);
      }

      if (isCurrentApproved) {
        bucket.current_approved_daily += dailyContribution;
      } else {
        bucket.proposed_candidate_daily += dailyContribution;
      }
      bucket.combined_daily =
        bucket.current_approved_daily + bucket.proposed_candidate_daily + bucket.fortified_diet_daily;

      bucket.contributing_items.push({
        item_id: item.id,
        label: item.brand_name ? `${item.brand_name} (${ing.nutrient_name})` : ing.nutrient_name,
        approval_status: item.approval_status,
        daily_contribution: Number(dailyContribution.toFixed(2)),
        single_dose_contribution: Number(singleAdminNormalized.toFixed(2)),
        is_incomplete: contributionIncomplete
      });
    }
  }

  // 3. Add explicit fortified dietary / enteral formula contributions
  if (fortifiedDietByNutrient) {
    for (const [rawKey, dietEntry] of Object.entries(fortifiedDietByNutrient)) {
      const nid = canonicalizeNutrientId(rawKey);
      const ulResolution = resolveLifeStageUpperLimit(nid, patient, population);
      const targetUnit = ulResolution.unit || dietEntry.unit;
      if (!exposuresByNutrient[nid]) {
        exposuresByNutrient[nid] = {
          nutrient_id: nid,
          nutrient_name: ulResolution.def?.nutrient_name || rawKey,
          unit: targetUnit,
          current_approved_daily: 0,
          proposed_candidate_daily: 0,
          fortified_diet_daily: 0,
          combined_daily: 0,
          max_single_admin_dose: 0,
          tolerable_upper_limit: ulResolution.ul,
          ul_life_stage: ulResolution.stageLabel,
          ul_reference_id: ulResolution.def?.evidence_id,
          exceeds_ul: false,
          exceeds_single_dose_threshold: false,
          is_incomplete_exposure: false,
          incomplete_reasons: [],
          contributing_items: []
        };
      }
      const bucket = exposuresByNutrient[nid];
      const normVal = normalizeNutrientDoseUnit(dietEntry.amount, dietEntry.unit, targetUnit);
      bucket.fortified_diet_daily += normVal;
      bucket.combined_daily =
        bucket.current_approved_daily + bucket.proposed_candidate_daily + bucket.fortified_diet_daily;
    }
  }

  // 4. Evaluate UL breaches, single-dose boluses, renal/lab safety gates
  const egfrVal =
    labSummary?.observations?.reported_egfr?.normalized_value ??
    labSummary?.observations?.egfr?.normalized_value ??
    (patient.labs as any)?.egfr;
  const ferritinVal =
    labSummary?.observations?.ferritin?.normalized_value ??
    (patient.labs as any)?.ferritin ??
    (patient.labs as any)?.serum_ferritin;

  for (const bucket of Object.values(exposuresByNutrient)) {
    bucket.current_approved_daily = Number(bucket.current_approved_daily.toFixed(2));
    bucket.proposed_candidate_daily = Number(bucket.proposed_candidate_daily.toFixed(2));
    bucket.fortified_diet_daily = Number(bucket.fortified_diet_daily.toFixed(2));
    bucket.combined_daily = Number(bucket.combined_daily.toFixed(2));

    const def = R7_LIFE_STAGE_UL_REGISTRY[bucket.nutrient_id];

    if (bucket.tolerable_upper_limit !== undefined && bucket.combined_daily > bucket.tolerable_upper_limit) {
      bucket.exceeds_ul = true;
      const msg = `${bucket.nutrient_name} combined daily intake (${bucket.combined_daily} ${bucket.unit}/day = approved ${bucket.current_approved_daily} + proposed ${bucket.proposed_candidate_daily}) exceeds ${bucket.ul_life_stage} Tolerable Upper Limit (${bucket.tolerable_upper_limit} ${bucket.unit}/day).`;
      safetyReviews.push(msg);
      overlaps.push({
        nutrient: bucket.nutrient_name,
        sources: bucket.contributing_items.map(c => c.label),
        total_amount_estimated: `${bucket.combined_daily} ${bucket.unit}`,
        tolerable_upper_limit: `${bucket.tolerable_upper_limit} ${bucket.unit}`,
        severity: 'high',
        warning_en: msg,
        warning_bn: `${bucket.nutrient_name} সম্মিলিত দৈনিক মাত্রা (${bucket.combined_daily} ${bucket.unit}) নিরাপদ সর্বোচ্চ সীমা (${bucket.tolerable_upper_limit} ${bucket.unit}) অতিক্রম করেছে।`
      });
    } else if (bucket.contributing_items.length > 1) {
      // Multi-product overlap even if below UL
      overlaps.push({
        nutrient: bucket.nutrient_name,
        sources: bucket.contributing_items.map(c => c.label),
        total_amount_estimated: `${bucket.combined_daily} ${bucket.unit}`,
        tolerable_upper_limit: bucket.tolerable_upper_limit !== undefined ? `${bucket.tolerable_upper_limit} ${bucket.unit}` : 'No formal UL',
        severity: 'medium',
        warning_en: `Multi-source ${bucket.nutrient_name} overlap across ${bucket.contributing_items.length} products (combined: ${bucket.combined_daily} ${bucket.unit}/day).`,
        warning_bn: `${bucket.contributing_items.length}টি উৎস থেকে ${bucket.nutrient_name} ওভারল্যাপ সনাক্ত হয়েছে (মোট: ${bucket.combined_daily} ${bucket.unit}/দিন)।`
      });
    }

    if (def?.single_dose_bolus_threshold && bucket.max_single_admin_dose >= def.single_dose_bolus_threshold) {
      bucket.exceeds_single_dose_threshold = true;
      safetyReviews.push(`${bucket.nutrient_name}: single administration of ${bucket.max_single_admin_dose} ${bucket.unit} triggers bolus safety review (${def.single_dose_rationale_en}).`);
    }

    if (
      egfrVal !== undefined &&
      typeof egfrVal === 'number' &&
      egfrVal < 30 &&
      (bucket.nutrient_id === 'magnesium' || bucket.nutrient_id === 'potassium')
    ) {
      const msg = `${bucket.nutrient_name} supplementation with eGFR ${egfrVal} mL/min (<30) carries severe accumulation risk.`;
      if (bucket.nutrient_id === 'potassium') safetyBlocks.push(msg);
      else safetyReviews.push(msg);
    }

    if (
      bucket.nutrient_id === 'iron' &&
      ferritinVal !== undefined &&
      typeof ferritinVal === 'number' &&
      ferritinVal >= 300
    ) {
      safetyBlocks.push(`Supplemental Iron contraindicated/held for review: elevated Ferritin (${ferritinVal} ng/mL >= 300 ng/mL).`);
    }
  }

  return {
    exposures_by_nutrient: exposuresByNutrient,
    overlaps,
    incomplete_items: incompleteItems,
    physical_duplicates: physicalDuplicates,
    safety_blocks: safetyBlocks,
    safety_reviews: safetyReviews
  };
}

export function buildHonestCatalogVerificationMetadata(
  brandNames?: string[],
  notes?: string
): {
  status: SupplementProtocolItem['brand_verification_status'];
  metadata: SupplementBrandVerificationMetadata;
} {
  if (!brandNames || brandNames.length === 0) {
    return {
      status: 'generic_prescription_only',
      metadata: {
        product_identity_verified: false,
        formulation_verified: false,
        regulatory_status: 'unverified',
        retail_availability_status: 'not_checked'
      }
    };
  }
  return {
    status: 'catalog_unverified',
    metadata: {
      product_identity_verified: false,
      formulation_verified: false,
      regulatory_status: 'unverified',
      retail_availability_status: 'not_checked',
      verification_source: notes || 'SHUDDHO local catalog reference — clinician must verify actual package label strength & DGDA status before prescribing.'
    }
  };
}
