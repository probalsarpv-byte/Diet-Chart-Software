/**
 * SHUDDHO Phase R7-A: Canonical Laboratory Data Foundation
 *
 * - Unified canonical marker registry covering all 9 clinical panels
 * - Bidirectional alias mapping (e.g. fbs -> fasting_glucose, sgpt_alt -> alt, serum_potassium -> potassium)
 * - Analyte-specific deterministic unit conversions (unrounded precision internally; display rounding only)
 * - Guardrails against double conversion, fabricated conversions (e.g. Lp(a)), NaN/Infinity, and non-exact inequalities
 * - Single authoritative patient/visit-isolated reconciliation & deduplication boundary
 */

import {
  R7CanonicalMarkerDefinition,
  R7LabPanelId,
  R7NormalizedLabObservation,
  LabResultAvailability,
  LabVerificationStatus,
  LabSourceType,
  LabSpecimenType,
  R7ReferenceProvenance
} from '@/types/r7Laboratory';
import { StructuredLabEntry, FunctionalLabs, PatientProfile } from '@/types';
import { R5PopulationProfile } from '@/types/r5Systems';
import { buildR5PopulationProfile } from '../r5PopulationEngine';

function normalizeUnitString(u?: string | null): string {
  if (!u) return '';
  return u
    .trim()
    .toLowerCase()
    .replace(/μ/g, 'µ')
    .replace(/ug/g, 'µg')
    .replace(/umol/g, 'µmol')
    .replace(/uiu/g, 'µiu')
    .replace(/×/g, '')
    .replace(/³/g, '^3')
    .replace(/⁹/g, '^9')
    .replace(/miu\/l/g, 'µiu/ml') // numerically 1 mIU/L === 1 uIU/mL
    .replace(/\s+/g, '');
}

const GLUCOSE_MMOL_TO_MGDL = 18.0182;
const CHOLESTEROL_MMOL_TO_MGDL = 38.67;
const TRIGLYCERIDES_MMOL_TO_MGDL = 88.57;
const CREATININE_UMOL_TO_MGDL = 1 / 88.42;
const VITD_NMOL_TO_NGML = 1 / 2.496;
const B12_PMOL_TO_PGML = 1.3554;
const FOLATE_NMOL_TO_NGML = 1 / 2.266;
const URIC_ACID_UMOL_TO_MGDL = 1 / 59.48;
const BUN_MMOL_TO_MGDL = 2.801;
const UREA_MMOL_TO_MGDL = 6.006;
const CALCIUM_MMOL_TO_MGDL = 4.008;
const MAGNESIUM_MMOL_TO_MGDL = 2.4305;
const PHOSPHORUS_MMOL_TO_MGDL = 3.097;
const BILIRUBIN_UMOL_TO_MGDL = 1 / 17.104;
const IRON_UMOL_TO_UGDL = 5.585;

export const R7_CANONICAL_MARKERS: R7CanonicalMarkerDefinition[] = [
  // ── PANEL 1: Glycemic & Insulin Regulation ────────────────────────
  {
    canonical_id: 'fasting_glucose',
    legacy_marker_ids: ['fbs', 'fasting_blood_glucose', 'fasting_plasma_glucose', 'fpg', 'fbg'],
    aliases: ['fbs', 'fpg', 'fbg', 'fasting blood sugar', 'fasting plasma glucose', 'fasting_blood_glucose'],
    panel: 'glycemic',
    label_en: 'Fasting Plasma Glucose (FPG / FBS)',
    label_bn: 'খালি পেটে রক্তের গ্লুকোজ (FBS)',
    result_type: 'numeric',
    canonical_unit: 'mg/dL',
    supported_units: ['mg/dL', 'mmol/L'],
    compatible_specimens: ['plasma', 'serum', 'whole_blood', 'capillary'],
    default_specimen: 'plasma',
    requires_fasting: true,
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['energy', 'communication'],
    evidence_ids: ['EVID_ADA_2026_GLYCEMIC'],
    physiological_bounds: { min: 10, max: 1800 },
    fallback_reference_interval: {
      adult_all: { low: 70, high: 99, text: '70–99 mg/dL (3.9–5.5 mmol/L)', source: 'ADA 2026' }
    },
    exploratory_functional_range: {
      low: 72,
      high: 88,
      text: '72–88 mg/dL (exploratory fasting glycemic range)',
      disclaimer_en: 'Exploratory wellness target; not a diagnostic or hypoglycemia standard.',
      disclaimer_bn: 'অনুসন্ধানমূলক ফাংশনাল সীমা; রোগ নির্ণয়ের মানদণ্ড নয়।'
    }
  },
  {
    canonical_id: 'postprandial_glucose',
    legacy_marker_ids: ['ppbs', 'two_hour_post_prandial', '2hpp'],
    aliases: ['ppbs', '2hpp', 'postprandial glucose', '2h post-prandial glucose', 'two_hour_post_prandial'],
    panel: 'glycemic',
    label_en: '2h Post-Prandial Glucose (2hPP / PPBS)',
    label_bn: 'খাওয়ার ২ ঘণ্টা পর গ্লুকোজ (2hPP)',
    result_type: 'numeric',
    canonical_unit: 'mg/dL',
    supported_units: ['mg/dL', 'mmol/L'],
    compatible_specimens: ['plasma', 'serum', 'capillary'],
    default_specimen: 'plasma',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['energy', 'communication'],
    evidence_ids: ['EVID_ADA_2026_GLYCEMIC'],
    physiological_bounds: { min: 10, max: 1800 },
    fallback_reference_interval: {
      adult_all: { low: 70, high: 139, text: '<140 mg/dL (<7.8 mmol/L)', source: 'Standard non-OGTT postprandial' }
    }
  },
  {
    canonical_id: 'random_glucose',
    legacy_marker_ids: ['rbs', 'random_blood_sugar'],
    aliases: ['rbs', 'random blood glucose', 'random_blood_sugar'],
    panel: 'glycemic',
    label_en: 'Random Plasma Glucose (RBS)',
    label_bn: 'যেকোনো সময়ের গ্লুকোজ (RBS)',
    result_type: 'numeric',
    canonical_unit: 'mg/dL',
    supported_units: ['mg/dL', 'mmol/L'],
    compatible_specimens: ['plasma', 'serum', 'capillary'],
    default_specimen: 'plasma',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['energy', 'communication'],
    evidence_ids: ['EVID_ADA_2026_GLYCEMIC'],
    physiological_bounds: { min: 10, max: 1800 }
  },
  {
    canonical_id: 'ogtt_2h_glucose',
    legacy_marker_ids: ['ogtt_2h'],
    aliases: ['ogtt 2h', 'ogtt_2h', '75g ogtt'],
    panel: 'glycemic',
    label_en: '2h Oral Glucose Tolerance Test (75g OGTT)',
    label_bn: '৭৫ গ্রাম ওজিটিটি (২ ঘণ্টার গ্লুকোজ)',
    result_type: 'numeric',
    canonical_unit: 'mg/dL',
    supported_units: ['mg/dL', 'mmol/L'],
    compatible_specimens: ['plasma'],
    default_specimen: 'plasma',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['energy', 'communication'],
    evidence_ids: ['EVID_ADA_2026_GLYCEMIC'],
    physiological_bounds: { min: 10, max: 1800 },
    fallback_reference_interval: {
      adult_all: { high: 139, text: '<140 mg/dL (non-pregnant); >=200 mg/dL diabetes', source: 'ADA 2026' }
    }
  },
  {
    canonical_id: 'hba1c',
    legacy_marker_ids: ['a1c'],
    aliases: ['a1c', 'glycated hemoglobin', 'glycated haemoglobin', 'hb a1c'],
    panel: 'glycemic',
    label_en: 'Glycated Hemoglobin (HbA1c)',
    label_bn: 'হিমোগ্লোবিন এওয়ানসি (HbA1c)',
    result_type: 'numeric',
    canonical_unit: '%',
    supported_units: ['%', 'mmol/mol'],
    compatible_specimens: ['whole_blood'],
    default_specimen: 'whole_blood',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['energy', 'communication'],
    evidence_ids: ['EVID_ADA_2026_GLYCEMIC'],
    physiological_bounds: { min: 2.0, max: 25.0 },
    fallback_reference_interval: {
      adult_all: { low: 4.0, high: 5.6, text: '4.0–5.6% (<39 mmol/mol)', source: 'ADA 2026' }
    },
    exploratory_functional_range: {
      low: 4.8,
      high: 5.4,
      text: '4.8–5.4% (exploratory lower-risk zone)',
      disclaimer_en: 'Exploratory wellness target; avoid hypoglycemic over-suppression.',
      disclaimer_bn: 'অনুসন্ধানমূলক ফাংশনাল সীমা; ওষুধের দ্বারা অতিরিক্ত কমানো উচিত নয়।'
    }
  },
  {
    canonical_id: 'fasting_insulin',
    legacy_marker_ids: ['insulin_fasting'],
    aliases: ['fasting serum insulin', 'insulin', 'insulin_fasting'],
    panel: 'glycemic',
    label_en: 'Fasting Serum Insulin',
    label_bn: 'ফাস্টিং ইনসুলিন',
    result_type: 'numeric',
    canonical_unit: 'µIU/mL',
    supported_units: ['µIU/mL', 'uIU/mL', 'mIU/L', 'pmol/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    requires_fasting: true,
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['energy', 'communication'],
    evidence_ids: ['EVID_MATTHEWS_1985_HOMAIR'],
    physiological_bounds: { min: 0.1, max: 1000 },
    fallback_reference_interval: {
      adult_all: { low: 2.6, high: 24.9, text: '2.6–24.9 µIU/mL', source: 'Standard Immunoassay' }
    },
    exploratory_functional_range: {
      low: 2.0,
      high: 6.0,
      text: '2.0–6.0 µIU/mL (exploratory metabolic zone)',
      disclaimer_en: 'Assay-dependent and exploratory; insulin assays are not universally standardized.',
      disclaimer_bn: 'অ্যাসে-নির্ভর ও অনুসন্ধানমূলক সীমা।'
    }
  },
  {
    canonical_id: 'c_peptide',
    legacy_marker_ids: ['cpeptide'],
    aliases: ['c-peptide', 'c peptide', 'fasting c-peptide'],
    panel: 'glycemic',
    label_en: 'Serum C-Peptide',
    label_bn: 'সিরাম সি-পেপটাইড',
    result_type: 'numeric',
    canonical_unit: 'ng/mL',
    supported_units: ['ng/mL', 'nmol/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['energy', 'communication'],
    evidence_ids: ['EVID_ADA_2026_GLYCEMIC'],
    physiological_bounds: { min: 0.01, max: 50 },
    fallback_reference_interval: {
      adult_all: { low: 0.8, high: 3.1, text: '0.8–3.1 ng/mL (fasting)', source: 'Standard Reference' }
    }
  },

  // ── PANEL 2: Lipid & Cardiometabolic Profile ──────────────────────
  {
    canonical_id: 'total_cholesterol',
    legacy_marker_ids: ['tc', 'chol'],
    aliases: ['tc', 'cholesterol', 'serum cholesterol'],
    panel: 'lipid',
    label_en: 'Total Cholesterol',
    label_bn: 'টোটাল কোলেস্টেরল',
    result_type: 'numeric',
    canonical_unit: 'mg/dL',
    supported_units: ['mg/dL', 'mmol/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['transport'],
    evidence_ids: ['EVID_AHA_ACC_LIPIDS'],
    physiological_bounds: { min: 30, max: 1500 },
    fallback_reference_interval: {
      adult_all: { low: 100, high: 200, text: '<200 mg/dL (<5.18 mmol/L)', source: 'AHA/ACC' }
    }
  },
  {
    canonical_id: 'triglycerides',
    legacy_marker_ids: ['tg'],
    aliases: ['tg', 'serum triglycerides', 'trigs'],
    panel: 'lipid',
    label_en: 'Serum Triglycerides (TG)',
    label_bn: 'ট্রাইগ্লিসারাইড (TG)',
    result_type: 'numeric',
    canonical_unit: 'mg/dL',
    supported_units: ['mg/dL', 'mmol/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['transport', 'energy'],
    evidence_ids: ['EVID_AHA_ACC_LIPIDS'],
    physiological_bounds: { min: 15, max: 5000 },
    fallback_reference_interval: {
      adult_all: { low: 35, high: 150, text: '<150 mg/dL (<1.7 mmol/L)', source: 'AHA/ACC' }
    },
    exploratory_functional_range: {
      low: 50,
      high: 100,
      text: '50–100 mg/dL (exploratory fasting TG)',
      disclaimer_en: 'Exploratory cardiometabolic range; non-fasting draws run higher.',
      disclaimer_bn: 'অনুসন্ধানমূলক সীমা।'
    }
  },
  {
    canonical_id: 'hdl',
    legacy_marker_ids: ['hdl_c'],
    aliases: ['hdl-c', 'hdl cholesterol', 'hdl_c'],
    panel: 'lipid',
    label_en: 'HDL Cholesterol (HDL-C)',
    label_bn: 'এইচডিএল কোলেস্টেরল (HDL-C)',
    result_type: 'numeric',
    canonical_unit: 'mg/dL',
    supported_units: ['mg/dL', 'mmol/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'sex_specific_ref',
    interpretation_eligible: true,
    related_systems: ['transport'],
    evidence_ids: ['EVID_AHA_ACC_LIPIDS'],
    physiological_bounds: { min: 5, max: 200 },
    fallback_reference_interval: {
      male: { low: 40, high: 90, text: '>=40 mg/dL (>=1.03 mmol/L)', source: 'AHA/ACC' },
      female: { low: 50, high: 90, text: '>=50 mg/dL (>=1.29 mmol/L)', source: 'AHA/ACC' },
      adult_all: { low: 40, high: 90, text: '40–90 mg/dL', source: 'AHA/ACC (sex-unspecified)' }
    }
  },
  {
    canonical_id: 'ldl',
    legacy_marker_ids: ['ldl_c'],
    aliases: ['ldl-c', 'ldl cholesterol', 'ldl_c'],
    panel: 'lipid',
    label_en: 'LDL Cholesterol (LDL-C)',
    label_bn: 'এলডিএল কোলেস্টেরল (LDL-C)',
    result_type: 'numeric',
    canonical_unit: 'mg/dL',
    supported_units: ['mg/dL', 'mmol/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['transport'],
    evidence_ids: ['EVID_AHA_ACC_LIPIDS'],
    physiological_bounds: { min: 10, max: 1000 },
    fallback_reference_interval: {
      adult_all: { low: 40, high: 100, text: '<100 mg/dL optimal baseline (targets individualized by ASCVD risk)', source: 'AHA/ACC' }
    }
  },
  {
    canonical_id: 'apob',
    legacy_marker_ids: ['apo_b'],
    aliases: ['apolipoprotein b', 'apo b', 'apo_b'],
    panel: 'lipid',
    label_en: 'Apolipoprotein B (ApoB)',
    label_bn: 'অ্যাপোলিপোপ্রোটিন বি (ApoB)',
    result_type: 'numeric',
    canonical_unit: 'mg/dL',
    supported_units: ['mg/dL', 'g/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['transport'],
    evidence_ids: ['EVID_AHA_ACC_LIPIDS'],
    physiological_bounds: { min: 15, max: 400 },
    fallback_reference_interval: {
      adult_all: { low: 40, high: 100, text: '<100 mg/dL (<90 mg/dL in elevated risk)', source: 'AHA/ACC / ESC' }
    }
  },
  {
    canonical_id: 'lpa',
    legacy_marker_ids: ['lp_a', 'lipoprotein_a'],
    aliases: ['lp(a)', 'lipoprotein(a)', 'lipoprotein_a', 'lp_a'],
    panel: 'lipid',
    label_en: 'Lipoprotein(a) [Lp(a)]',
    label_bn: 'লাইপোপ্রোটিন(এ) [Lp(a)]',
    result_type: 'numeric',
    canonical_unit: 'nmol/L', // Note: keeps original unit when mg/dL; NEVER converts between mg/dL and nmol/L
    supported_units: ['nmol/L', 'mg/dL'],
    disallowed_cross_conversions: [
      {
        from: 'mg/dL',
        to: 'nmol/L',
        reason: 'Unsupported universal Lp(a) mass-to-molar conversion due to apo(a) kringle isoform heterogeneity.'
      },
      {
        from: 'nmol/L',
        to: 'mg/dL',
        reason: 'Unsupported universal Lp(a) molar-to-mass conversion due to apo(a) kringle isoform heterogeneity.'
      }
    ],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['transport'],
    evidence_ids: ['EVID_AHA_ACC_LIPIDS'],
    physiological_bounds: { min: 1, max: 1000 }
  },

  // ── PANEL 3: Renal Function ───────────────────────────────────────
  {
    canonical_id: 'creatinine',
    legacy_marker_ids: ['serum_creatinine', 'cr'],
    aliases: ['serum_creatinine', 'serum creatinine', 'scr', 'cr'],
    panel: 'renal',
    label_en: 'Serum Creatinine',
    label_bn: 'সিরাম ক্রিয়েটিনিন',
    result_type: 'numeric',
    canonical_unit: 'mg/dL',
    supported_units: ['mg/dL', 'µmol/L', 'umol/L', 'mcmol/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'sex_specific_ref',
    interpretation_eligible: true,
    related_systems: ['biotransformation', 'transport'],
    evidence_ids: ['EVID_KDIGO_2024_CKD'],
    physiological_bounds: { min: 0.1, max: 25 },
    fallback_reference_interval: {
      male: { low: 0.7, high: 1.3, text: '0.7–1.3 mg/dL (62–115 µmol/L)', source: 'Standard Adult Male' },
      female: { low: 0.5, high: 1.1, text: '0.5–1.1 mg/dL (44–97 µmol/L)', source: 'Standard Adult Female' },
      adult_all: { low: 0.5, high: 1.3, text: '0.5–1.3 mg/dL (sex-unspecified reference)', source: 'Standard Adult Range' }
    }
  },
  {
    canonical_id: 'reported_egfr',
    legacy_marker_ids: ['egfr'],
    aliases: ['egfr', 'estimated gfr', 'lab egfr'],
    panel: 'renal',
    label_en: 'Laboratory-Reported eGFR',
    label_bn: 'ল্যাব-রিপোর্টেড ইজিএফআর (eGFR)',
    result_type: 'numeric',
    canonical_unit: 'mL/min/1.73m²',
    supported_units: ['mL/min/1.73m²', 'mL/min/1.73m2', 'mL/min'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'adult_only',
    interpretation_eligible: true,
    related_systems: ['biotransformation', 'transport'],
    evidence_ids: ['EVID_KDIGO_2024_CKD'],
    physiological_bounds: { min: 2, max: 200 },
    fallback_reference_interval: {
      adult_all: { low: 60, high: 150, text: '>=60 mL/min/1.73m² (chronicity requires >=3 months)', source: 'KDIGO 2024' }
    }
  },
  {
    canonical_id: 'urea',
    legacy_marker_ids: ['serum_urea'],
    aliases: ['serum urea', 'blood urea', 'serum_urea'],
    panel: 'renal',
    label_en: 'Serum Urea',
    label_bn: 'সিরাম ইউরিয়া',
    result_type: 'numeric',
    canonical_unit: 'mg/dL',
    supported_units: ['mg/dL', 'mmol/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['biotransformation'],
    evidence_ids: ['EVID_KDIGO_2024_CKD'],
    physiological_bounds: { min: 2, max: 400 },
    fallback_reference_interval: {
      adult_all: { low: 10, high: 45, text: '10–45 mg/dL', source: 'Standard Reference' }
    }
  },
  {
    canonical_id: 'bun',
    legacy_marker_ids: [],
    aliases: ['blood urea nitrogen', 'serum bun'],
    panel: 'renal',
    label_en: 'Blood Urea Nitrogen (BUN)',
    label_bn: 'ব্লাড ইউরিয়া নাইট্রোজেন (BUN)',
    result_type: 'numeric',
    canonical_unit: 'mg/dL',
    supported_units: ['mg/dL', 'mmol/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['biotransformation'],
    evidence_ids: ['EVID_KDIGO_2024_CKD'],
    physiological_bounds: { min: 1, max: 200 },
    fallback_reference_interval: {
      adult_all: { low: 6, high: 20, text: '6–20 mg/dL', source: 'Standard Reference' }
    }
  },
  {
    canonical_id: 'urine_albumin',
    legacy_marker_ids: ['microalbumin_urine'],
    aliases: ['urine albumin', 'spot urine albumin', 'microalbumin'],
    panel: 'renal',
    label_en: 'Urine Albumin (Spot)',
    label_bn: 'প্রস্রাবে অ্যালবুমিন',
    result_type: 'numeric',
    canonical_unit: 'mg/L',
    supported_units: ['mg/L', 'mg/dL'],
    compatible_specimens: ['urine_spot', 'urine_24h'],
    default_specimen: 'urine_spot',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['transport', 'biotransformation'],
    evidence_ids: ['EVID_KDIGO_2024_CKD'],
    physiological_bounds: { min: 0.1, max: 10000 }
  },
  {
    canonical_id: 'urine_creatinine',
    legacy_marker_ids: [],
    aliases: ['urine creatinine', 'spot urine creatinine'],
    panel: 'renal',
    label_en: 'Urine Creatinine (Spot)',
    label_bn: 'প্রস্রাবে ক্রিয়েটিনিন',
    result_type: 'numeric',
    canonical_unit: 'g/L',
    supported_units: ['g/L', 'mg/dL', 'mmol/L'],
    compatible_specimens: ['urine_spot', 'urine_24h'],
    default_specimen: 'urine_spot',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['biotransformation'],
    evidence_ids: ['EVID_KDIGO_2024_CKD'],
    physiological_bounds: { min: 0.05, max: 10 }
  },
  {
    canonical_id: 'uacr',
    legacy_marker_ids: ['acr', 'urine_acr'],
    aliases: ['uacr', 'acr', 'albumin creatinine ratio', 'urine_acr'],
    panel: 'renal',
    label_en: 'Urine Albumin-to-Creatinine Ratio (UACR)',
    label_bn: 'ইউরিন অ্যালবুমিন-ক্রিয়েটিনিন অনুপাত (UACR)',
    result_type: 'numeric',
    canonical_unit: 'mg/g',
    supported_units: ['mg/g', 'mg/mmol'],
    compatible_specimens: ['urine_spot'],
    default_specimen: 'urine_spot',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['transport', 'biotransformation'],
    evidence_ids: ['EVID_KDIGO_2024_CKD'],
    physiological_bounds: { min: 0.1, max: 10000 },
    fallback_reference_interval: {
      adult_all: { high: 29.9, text: '<30 mg/g (<3.0 mg/mmol)', source: 'KDIGO 2024' }
    }
  },
  {
    canonical_id: 'uric_acid',
    legacy_marker_ids: ['serum_uric_acid'],
    aliases: ['serum_uric_acid', 'serum uric acid', 'urate'],
    panel: 'renal',
    label_en: 'Serum Uric Acid',
    label_bn: 'সিরাম ইউরিক এসিড',
    result_type: 'numeric',
    canonical_unit: 'mg/dL',
    supported_units: ['mg/dL', 'µmol/L', 'umol/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'sex_specific_ref',
    interpretation_eligible: true,
    related_systems: ['biotransformation', 'structural_integrity'],
    evidence_ids: ['EVID_KDIGO_2024_CKD'],
    physiological_bounds: { min: 0.5, max: 25 },
    fallback_reference_interval: {
      male: { low: 3.4, high: 7.0, text: '3.4–7.0 mg/dL', source: 'Standard Adult Male' },
      female: { low: 2.4, high: 6.0, text: '2.4–6.0 mg/dL', source: 'Standard Adult Female' },
      adult_all: { low: 2.4, high: 7.0, text: '2.4–7.0 mg/dL (sex-unspecified range)', source: 'Standard Reference' }
    }
  },

  // ── PANEL 4: Electrolytes & Minerals ──────────────────────────────
  {
    canonical_id: 'sodium',
    legacy_marker_ids: ['serum_sodium', 'na'],
    aliases: ['serum sodium', 'na+', 'na', 'serum_sodium'],
    panel: 'electrolytes',
    label_en: 'Serum Sodium (Na+)',
    label_bn: 'সিরাম সোডিয়াম (Na+)',
    result_type: 'numeric',
    canonical_unit: 'mmol/L',
    supported_units: ['mmol/L', 'mEq/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['transport'],
    evidence_ids: ['EVID_KDIGO_2024_CKD'],
    physiological_bounds: { min: 90, max: 200 },
    fallback_reference_interval: {
      adult_all: { low: 135, high: 145, text: '135–145 mmol/L (mEq/L)', source: 'Clinical Chemistry Standard' }
    }
  },
  {
    canonical_id: 'potassium',
    legacy_marker_ids: ['serum_potassium', 'k'],
    aliases: ['serum_potassium', 'serum potassium', 'k+', 'k'],
    panel: 'electrolytes',
    label_en: 'Serum Potassium (K+)',
    label_bn: 'সিরাম পটাশিয়াম (K+)',
    result_type: 'numeric',
    canonical_unit: 'mmol/L',
    supported_units: ['mmol/L', 'mEq/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['transport', 'energy'],
    evidence_ids: ['EVID_KDIGO_2024_CKD'],
    physiological_bounds: { min: 1.5, max: 11.0 },
    fallback_reference_interval: {
      adult_all: { low: 3.5, high: 5.0, text: '3.5–5.0 mmol/L (mEq/L)', source: 'Clinical Chemistry Standard' }
    }
  },
  {
    canonical_id: 'total_calcium',
    legacy_marker_ids: ['calcium', 'serum_calcium'],
    aliases: ['total calcium', 'serum calcium', 'ca', 'calcium', 'serum_calcium'],
    panel: 'electrolytes',
    label_en: 'Total Serum Calcium',
    label_bn: 'টোটাল সিরাম ক্যালসিয়াম',
    result_type: 'numeric',
    canonical_unit: 'mg/dL',
    supported_units: ['mg/dL', 'mmol/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['structural_integrity', 'communication'],
    evidence_ids: ['EVID_NIH_ODS_MICRONUTRIENTS'],
    physiological_bounds: { min: 4.0, max: 20.0 },
    fallback_reference_interval: {
      adult_all: { low: 8.5, high: 10.5, text: '8.5–10.5 mg/dL (2.12–2.62 mmol/L)', source: 'Clinical Chemistry Standard' }
    }
  },
  {
    canonical_id: 'ionized_calcium',
    legacy_marker_ids: ['ica'],
    aliases: ['ionized calcium', 'ica', 'free calcium'],
    panel: 'electrolytes',
    label_en: 'Ionized Calcium',
    label_bn: 'আয়োনাইজড ক্যালসিয়াম',
    result_type: 'numeric',
    canonical_unit: 'mmol/L',
    supported_units: ['mmol/L', 'mg/dL'],
    compatible_specimens: ['serum', 'plasma', 'whole_blood'],
    default_specimen: 'whole_blood',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['structural_integrity', 'communication'],
    evidence_ids: ['EVID_NIH_ODS_MICRONUTRIENTS'],
    physiological_bounds: { min: 0.4, max: 2.5 },
    fallback_reference_interval: {
      adult_all: { low: 1.12, high: 1.32, text: '1.12–1.32 mmol/L', source: 'Clinical Chemistry Standard' }
    }
  },
  {
    canonical_id: 'magnesium',
    legacy_marker_ids: ['serum_magnesium', 'mg'],
    aliases: ['serum magnesium', 'serum_magnesium', 'mg2+'],
    panel: 'electrolytes',
    label_en: 'Serum Magnesium (Mg)',
    label_bn: 'সিরাম ম্যাগনেসিয়াম (Mg)',
    result_type: 'numeric',
    canonical_unit: 'mg/dL',
    supported_units: ['mg/dL', 'mmol/L', 'mEq/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['energy', 'structural_integrity'],
    evidence_ids: ['EVID_NIH_ODS_MICRONUTRIENTS'],
    physiological_bounds: { min: 0.3, max: 10.0 },
    fallback_reference_interval: {
      adult_all: { low: 1.7, high: 2.2, text: '1.7–2.2 mg/dL (0.70–0.91 mmol/L)', source: 'Clinical Chemistry Standard' }
    }
  },
  {
    canonical_id: 'phosphorus',
    legacy_marker_ids: ['serum_phosphorus', 'phosphate'],
    aliases: ['serum_phosphorus', 'serum phosphorus', 'phosphate', 'po4'],
    panel: 'electrolytes',
    label_en: 'Serum Phosphorus (PO4)',
    label_bn: 'সিরাম ফসফরাস (PO4)',
    result_type: 'numeric',
    canonical_unit: 'mg/dL',
    supported_units: ['mg/dL', 'mmol/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'pediatric_caution',
    interpretation_eligible: true,
    related_systems: ['structural_integrity', 'energy'],
    evidence_ids: ['EVID_KDIGO_2024_CKD'],
    physiological_bounds: { min: 0.5, max: 15.0 },
    fallback_reference_interval: {
      adult_all: { low: 2.5, high: 4.5, text: '2.5–4.5 mg/dL (adults; higher in children)', source: 'Clinical Chemistry Standard' },
      pediatric_note: 'Pediatric serum phosphorus physiological intervals are significantly higher (typically 4.0–7.0 mg/dL depending on age).'
    }
  },
  {
    canonical_id: 'bicarbonate',
    legacy_marker_ids: ['hco3', 'total_co2'],
    aliases: ['serum bicarbonate', 'hco3', 'tco2', 'total co2'],
    panel: 'electrolytes',
    label_en: 'Serum Bicarbonate (HCO3- / Total CO2)',
    label_bn: 'সিরাম বাইকার্বনেট (HCO3-)',
    result_type: 'numeric',
    canonical_unit: 'mmol/L',
    supported_units: ['mmol/L', 'mEq/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['biotransformation', 'transport'],
    evidence_ids: ['EVID_KDIGO_2024_CKD'],
    physiological_bounds: { min: 5, max: 50 },
    fallback_reference_interval: {
      adult_all: { low: 22, high: 29, text: '22–29 mmol/L', source: 'KDIGO 2024' }
    }
  },

  // ── PANEL 5: Hepatic Profile ──────────────────────────────────────
  {
    canonical_id: 'alt',
    legacy_marker_ids: ['sgpt_alt', 'sgpt'],
    aliases: ['sgpt_alt', 'sgpt', 'alanine aminotransferase', 'gpt'],
    panel: 'hepatic',
    label_en: 'ALT (SGPT)',
    label_bn: 'এসজিপিটি / এএলটি (ALT)',
    result_type: 'numeric',
    canonical_unit: 'U/L',
    supported_units: ['U/L', 'IU/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['biotransformation'],
    evidence_ids: ['EVID_STERLING_2006_FIB4'],
    physiological_bounds: { min: 1, max: 10000 },
    fallback_reference_interval: {
      adult_all: { low: 7, high: 45, text: '7–45 U/L (assay-dependent)', source: 'Standard Reference' }
    },
    exploratory_functional_range: {
      low: 10,
      high: 25,
      text: '10–25 U/L (exploratory low-normal transaminase range)',
      disclaimer_en: 'Assay-dependent exploratory range; verify with laboratory interval.',
      disclaimer_bn: 'ল্যাব-নির্ভর অনুসন্ধানমূলক সীমা।'
    }
  },
  {
    canonical_id: 'ast',
    legacy_marker_ids: ['sgot_ast', 'sgot'],
    aliases: ['sgot', 'sgot_ast', 'aspartate aminotransferase', 'got'],
    panel: 'hepatic',
    label_en: 'AST (SGOT)',
    label_bn: 'এসজিওটি / এএসটি (AST)',
    result_type: 'numeric',
    canonical_unit: 'U/L',
    supported_units: ['U/L', 'IU/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['biotransformation'],
    evidence_ids: ['EVID_STERLING_2006_FIB4'],
    physiological_bounds: { min: 1, max: 10000 },
    fallback_reference_interval: {
      adult_all: { low: 8, high: 40, text: '8–40 U/L', source: 'Standard Reference' }
    }
  },
  {
    canonical_id: 'ggt',
    legacy_marker_ids: [],
    aliases: ['gamma-gt', 'gamma glutamyl transferase'],
    panel: 'hepatic',
    label_en: 'Gamma-Glutamyl Transferase (GGT)',
    label_bn: 'জিজিটি (GGT)',
    result_type: 'numeric',
    canonical_unit: 'U/L',
    supported_units: ['U/L', 'IU/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'sex_specific_ref',
    interpretation_eligible: true,
    related_systems: ['biotransformation'],
    evidence_ids: ['EVID_STERLING_2006_FIB4'],
    physiological_bounds: { min: 1, max: 5000 },
    fallback_reference_interval: {
      male: { low: 8, high: 61, text: '8–61 U/L', source: 'Standard Adult Male' },
      female: { low: 5, high: 36, text: '5–36 U/L', source: 'Standard Adult Female' },
      adult_all: { low: 5, high: 61, text: '5–61 U/L (sex-unspecified)', source: 'Standard Reference' }
    }
  },
  {
    canonical_id: 'alp',
    legacy_marker_ids: ['alkaline_phosphatase'],
    aliases: ['alkaline phosphatase', 'alk phos', 'alkaline_phosphatase'],
    panel: 'hepatic',
    label_en: 'Alkaline Phosphatase (ALP)',
    label_bn: 'অ্যালকালাইন ফসফাটেজ (ALP)',
    result_type: 'numeric',
    canonical_unit: 'U/L',
    supported_units: ['U/L', 'IU/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'pediatric_caution',
    interpretation_eligible: true,
    related_systems: ['biotransformation', 'structural_integrity'],
    evidence_ids: ['EVID_STERLING_2006_FIB4'],
    physiological_bounds: { min: 10, max: 3000 },
    fallback_reference_interval: {
      adult_all: { low: 44, high: 147, text: '44–147 U/L (adults; physiologically higher during bone growth/pregnancy)', source: 'Standard Adult Reference' },
      pediatric_note: 'Pediatric ALP is physiologically elevated during skeletal growth spurts; adult ranges must not be applied.',
      pregnancy_note: 'Placental ALP rises physiologically in late pregnancy.'
    }
  },
  {
    canonical_id: 'total_bilirubin',
    legacy_marker_ids: ['bilirubin_total'],
    aliases: ['total bilirubin', 'tbil', 'bilirubin_total'],
    panel: 'hepatic',
    label_en: 'Total Bilirubin',
    label_bn: 'টোটাল বিলিরুবিন',
    result_type: 'numeric',
    canonical_unit: 'mg/dL',
    supported_units: ['mg/dL', 'µmol/L', 'umol/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['biotransformation'],
    evidence_ids: ['EVID_STERLING_2006_FIB4'],
    physiological_bounds: { min: 0.05, max: 50 },
    fallback_reference_interval: {
      adult_all: { low: 0.1, high: 1.2, text: '0.1–1.2 mg/dL (1.7–20.5 µmol/L)', source: 'Standard Reference' }
    }
  },
  {
    canonical_id: 'direct_bilirubin',
    legacy_marker_ids: ['bilirubin_direct'],
    aliases: ['direct bilirubin', 'conjugated bilirubin', 'dbil', 'bilirubin_direct'],
    panel: 'hepatic',
    label_en: 'Direct (Conjugated) Bilirubin',
    label_bn: 'ডিরেক্ট বিলিরুবিন',
    result_type: 'numeric',
    canonical_unit: 'mg/dL',
    supported_units: ['mg/dL', 'µmol/L', 'umol/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['biotransformation'],
    evidence_ids: ['EVID_STERLING_2006_FIB4'],
    physiological_bounds: { min: 0.0, max: 40 },
    fallback_reference_interval: {
      adult_all: { low: 0.0, high: 0.3, text: '0.0–0.3 mg/dL', source: 'Standard Reference' }
    }
  },
  {
    canonical_id: 'albumin',
    legacy_marker_ids: ['serum_albumin'],
    aliases: ['serum albumin', 'serum_albumin'],
    panel: 'hepatic',
    label_en: 'Serum Albumin',
    label_bn: 'সিরাম অ্যালবুমিন',
    result_type: 'numeric',
    canonical_unit: 'g/dL',
    supported_units: ['g/dL', 'g/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['biotransformation', 'structural_integrity', 'transport'],
    evidence_ids: ['EVID_STERLING_2006_FIB4'],
    physiological_bounds: { min: 0.5, max: 8.0 },
    fallback_reference_interval: {
      adult_all: { low: 3.5, high: 5.2, text: '3.5–5.2 g/dL (35–52 g/L)', source: 'Standard Reference' }
    }
  },
  {
    canonical_id: 'total_protein',
    legacy_marker_ids: ['serum_protein'],
    aliases: ['total serum protein', 'serum protein', 'tp'],
    panel: 'hepatic',
    label_en: 'Total Serum Protein',
    label_bn: 'টোটাল সিরাম প্রোটিন',
    result_type: 'numeric',
    canonical_unit: 'g/dL',
    supported_units: ['g/dL', 'g/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['biotransformation', 'structural_integrity'],
    evidence_ids: ['EVID_STERLING_2006_FIB4'],
    physiological_bounds: { min: 2.0, max: 14.0 },
    fallback_reference_interval: {
      adult_all: { low: 6.0, high: 8.3, text: '6.0–8.3 g/dL (60–83 g/L)', source: 'Standard Reference' }
    }
  },

  // ── PANEL 6: Thyroid Profile ──────────────────────────────────────
  {
    canonical_id: 'tsh',
    legacy_marker_ids: [],
    aliases: ['thyroid stimulating hormone', 'thyrotropin'],
    panel: 'thyroid',
    label_en: 'Thyroid Stimulating Hormone (TSH)',
    label_bn: 'টিএসএইচ (TSH)',
    result_type: 'numeric',
    canonical_unit: 'µIU/mL',
    supported_units: ['µIU/mL', 'uIU/mL', 'mIU/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['communication', 'energy'],
    evidence_ids: ['EVID_DAILYMED_PRESCRIBING'],
    physiological_bounds: { min: 0.001, max: 200 },
    fallback_reference_interval: {
      adult_all: { low: 0.4, high: 4.5, text: '0.4–4.5 µIU/mL (non-pregnant adult; pregnancy trimesters use narrower ATA targets)', source: 'Standard Adult Reference' },
      pregnancy_note: 'Pregnancy TSH reference intervals are trimester-specific (typically <2.5 in T1, <3.0 in T2/T3 per lab assay).'
    },
    exploratory_functional_range: {
      low: 0.8,
      high: 2.5,
      text: '0.8–2.5 µIU/mL (exploratory TSH comfort zone)',
      disclaimer_en: 'Exploratory zone; normal TSH inside laboratory reference (e.g., 3.2 µIU/mL) does NOT diagnose hypothyroidism.',
      disclaimer_bn: 'অনুসন্ধানমূলক সীমা; ল্যাব রেঞ্জের ভেতরের মান কখনোই থাইরয়েড রোগ নিশ্চিত করে না।'
    }
  },
  {
    canonical_id: 'ft4',
    legacy_marker_ids: ['free_t4'],
    aliases: ['free t4', 'free thyroxine', 'free_t4'],
    panel: 'thyroid',
    label_en: 'Free Thyroxine (Free T4)',
    label_bn: 'ফ্রি টি৪ (Free T4)',
    result_type: 'numeric',
    canonical_unit: 'ng/dL',
    supported_units: ['ng/dL', 'pmol/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['communication', 'energy'],
    evidence_ids: ['EVID_DAILYMED_PRESCRIBING'],
    physiological_bounds: { min: 0.05, max: 15.0 },
    fallback_reference_interval: {
      adult_all: { low: 0.8, high: 1.8, text: '0.8–1.8 ng/dL (10–23 pmol/L)', source: 'Standard Adult Reference' }
    }
  },
  {
    canonical_id: 'ft3',
    legacy_marker_ids: ['free_t3'],
    aliases: ['free t3', 'free triiodothyronine', 'free_t3'],
    panel: 'thyroid',
    label_en: 'Free Triiodothyronine (Free T3)',
    label_bn: 'ফ্রি টি৩ (Free T3)',
    result_type: 'numeric',
    canonical_unit: 'pg/mL',
    supported_units: ['pg/mL', 'pmol/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['communication', 'energy'],
    evidence_ids: ['EVID_DAILYMED_PRESCRIBING'],
    physiological_bounds: { min: 0.2, max: 30.0 },
    fallback_reference_interval: {
      adult_all: { low: 2.3, high: 4.2, text: '2.3–4.2 pg/mL (3.5–6.5 pmol/L)', source: 'Standard Adult Reference' }
    }
  },
  {
    canonical_id: 'tpo_antibodies',
    legacy_marker_ids: ['anti_tpo'],
    aliases: ['anti-tpo', 'tpo ab', 'thyroid peroxidase antibody', 'anti_tpo'],
    panel: 'thyroid',
    label_en: 'Thyroid Peroxidase Antibodies (Anti-TPO)',
    label_bn: 'অ্যান্টি-টিপিও অ্যান্টিবডি (Anti-TPO)',
    result_type: 'numeric',
    canonical_unit: 'IU/mL',
    supported_units: ['IU/mL', 'U/mL'],
    compatible_specimens: ['serum'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['defense_repair', 'communication'],
    evidence_ids: ['EVID_DAILYMED_PRESCRIBING'],
    physiological_bounds: { min: 0, max: 50000 },
    fallback_reference_interval: {
      adult_all: { low: 0, high: 34, text: '<35 IU/mL (assay-dependent)', source: 'Standard Immunoassay' }
    }
  },
  {
    canonical_id: 'tg_antibodies',
    legacy_marker_ids: ['anti_tg'],
    aliases: ['anti-tg', 'thyroglobulin antibody', 'anti_tg'],
    panel: 'thyroid',
    label_en: 'Thyroglobulin Antibodies (Anti-Tg)',
    label_bn: 'থাইরোগ্লোবুলিন অ্যান্টিবডি (Anti-Tg)',
    result_type: 'numeric',
    canonical_unit: 'IU/mL',
    supported_units: ['IU/mL', 'U/mL'],
    compatible_specimens: ['serum'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['defense_repair', 'communication'],
    evidence_ids: ['EVID_DAILYMED_PRESCRIBING'],
    physiological_bounds: { min: 0, max: 50000 },
    fallback_reference_interval: {
      adult_all: { low: 0, high: 40, text: '<40 IU/mL (assay-dependent)', source: 'Standard Immunoassay' }
    }
  },

  // ── PANEL 7: Hematology & Iron Status ─────────────────────────────
  {
    canonical_id: 'hemoglobin',
    legacy_marker_ids: ['hb', 'hgb'],
    aliases: ['hb', 'hgb', 'haemoglobin'],
    panel: 'hematology_iron',
    label_en: 'Hemoglobin (Hb)',
    label_bn: 'হিমোগ্লোবিন (Hb)',
    result_type: 'numeric',
    canonical_unit: 'g/dL',
    supported_units: ['g/dL', 'g/L'],
    compatible_specimens: ['whole_blood'],
    default_specimen: 'whole_blood',
    population_applicability: 'sex_specific_ref',
    interpretation_eligible: true,
    related_systems: ['transport', 'energy'],
    evidence_ids: ['EVID_WHO_2020_FERRITIN'],
    physiological_bounds: { min: 2.0, max: 25.0 },
    fallback_reference_interval: {
      male: { low: 13.0, high: 17.5, text: '13.0–17.5 g/dL (WHO non-anemic male >=13.0)', source: 'WHO' },
      female: { low: 12.0, high: 15.5, text: '12.0–15.5 g/dL (WHO non-pregnant >=12.0; pregnancy >=11.0)', source: 'WHO' },
      adult_all: { low: 12.0, high: 17.5, text: '12.0–17.5 g/dL (sex-unspecified baseline)', source: 'WHO Baseline' }
    }
  },
  {
    canonical_id: 'hematocrit',
    legacy_marker_ids: ['hct', 'pcv'],
    aliases: ['hct', 'pcv', 'packed cell volume'],
    panel: 'hematology_iron',
    label_en: 'Hematocrit (HCT / PCV)',
    label_bn: 'হেমাটোক্রিট (HCT)',
    result_type: 'numeric',
    canonical_unit: '%',
    supported_units: ['%', 'L/L'],
    compatible_specimens: ['whole_blood'],
    default_specimen: 'whole_blood',
    population_applicability: 'sex_specific_ref',
    interpretation_eligible: true,
    related_systems: ['transport'],
    evidence_ids: ['EVID_WHO_2020_FERRITIN'],
    physiological_bounds: { min: 10, max: 75 }
  },
  {
    canonical_id: 'rbc',
    legacy_marker_ids: ['rbc_count'],
    aliases: ['red blood cell count', 'rbc count'],
    panel: 'hematology_iron',
    label_en: 'RBC Count',
    label_bn: 'লোহিত রক্তকণিকা (RBC)',
    result_type: 'numeric',
    canonical_unit: '10^6/µL',
    supported_units: ['10^6/µL', '10^12/L', 'M/µL'],
    compatible_specimens: ['whole_blood'],
    default_specimen: 'whole_blood',
    population_applicability: 'sex_specific_ref',
    interpretation_eligible: true,
    related_systems: ['transport'],
    evidence_ids: ['EVID_WHO_2020_FERRITIN'],
    physiological_bounds: { min: 1.0, max: 10.0 }
  },
  {
    canonical_id: 'mcv',
    legacy_marker_ids: [],
    aliases: ['mean corpuscular volume'],
    panel: 'hematology_iron',
    label_en: 'Mean Corpuscular Volume (MCV)',
    label_bn: 'এমসিভি (MCV)',
    result_type: 'numeric',
    canonical_unit: 'fL',
    supported_units: ['fL'],
    compatible_specimens: ['whole_blood'],
    default_specimen: 'whole_blood',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['transport', 'assimilation'],
    evidence_ids: ['EVID_WHO_2020_FERRITIN', 'EVID_MHRA_2022_METFORMIN_B12'],
    physiological_bounds: { min: 40, max: 150 },
    fallback_reference_interval: {
      adult_all: { low: 80, high: 100, text: '80–100 fL', source: 'Hematology Standard' }
    }
  },
  {
    canonical_id: 'mch',
    legacy_marker_ids: [],
    aliases: ['mean corpuscular hemoglobin'],
    panel: 'hematology_iron',
    label_en: 'Mean Corpuscular Hemoglobin (MCH)',
    label_bn: 'এমসিএইচ (MCH)',
    result_type: 'numeric',
    canonical_unit: 'pg',
    supported_units: ['pg'],
    compatible_specimens: ['whole_blood'],
    default_specimen: 'whole_blood',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['transport'],
    evidence_ids: ['EVID_WHO_2020_FERRITIN'],
    physiological_bounds: { min: 10, max: 50 },
    fallback_reference_interval: {
      adult_all: { low: 27, high: 33, text: '27–33 pg', source: 'Hematology Standard' }
    }
  },
  {
    canonical_id: 'mchc',
    legacy_marker_ids: [],
    aliases: ['mean corpuscular hemoglobin concentration'],
    panel: 'hematology_iron',
    label_en: 'MCHC',
    label_bn: 'এমসিএইচসি (MCHC)',
    result_type: 'numeric',
    canonical_unit: 'g/dL',
    supported_units: ['g/dL', 'g/L'],
    compatible_specimens: ['whole_blood'],
    default_specimen: 'whole_blood',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['transport'],
    evidence_ids: ['EVID_WHO_2020_FERRITIN'],
    physiological_bounds: { min: 20, max: 42 },
    fallback_reference_interval: {
      adult_all: { low: 32, high: 36, text: '32–36 g/dL', source: 'Hematology Standard' }
    }
  },
  {
    canonical_id: 'rdw',
    legacy_marker_ids: ['rdw_cv'],
    aliases: ['red cell distribution width', 'rdw-cv'],
    panel: 'hematology_iron',
    label_en: 'Red Cell Distribution Width (RDW)',
    label_bn: 'আরডিডব্লিউ (RDW)',
    result_type: 'numeric',
    canonical_unit: '%',
    supported_units: ['%'],
    compatible_specimens: ['whole_blood'],
    default_specimen: 'whole_blood',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['transport', 'assimilation'],
    evidence_ids: ['EVID_WHO_2020_FERRITIN'],
    physiological_bounds: { min: 8, max: 35 },
    fallback_reference_interval: {
      adult_all: { low: 11.5, high: 14.5, text: '11.5–14.5%', source: 'Hematology Standard' }
    }
  },
  {
    canonical_id: 'platelets',
    legacy_marker_ids: ['plt', 'platelet_count'],
    aliases: ['plt', 'platelet count', 'platelet_count'],
    panel: 'hematology_iron',
    label_en: 'Platelet Count',
    label_bn: 'প্লাটিলেট সংখ্যা',
    result_type: 'numeric',
    canonical_unit: '10^9/L',
    supported_units: ['10^9/L', '10^3/µL', 'K/µL', '/mm3'],
    compatible_specimens: ['whole_blood'],
    default_specimen: 'whole_blood',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['defense_repair', 'biotransformation'],
    evidence_ids: ['EVID_STERLING_2006_FIB4'],
    physiological_bounds: { min: 5, max: 2000 },
    fallback_reference_interval: {
      adult_all: { low: 150, high: 450, text: '150–450 x10⁹/L', source: 'Hematology Standard' }
    }
  },
  {
    canonical_id: 'ferritin',
    legacy_marker_ids: ['serum_ferritin'],
    aliases: ['serum_ferritin', 'serum ferritin'],
    panel: 'hematology_iron',
    label_en: 'Serum Ferritin',
    label_bn: 'সিরাম ফেরিটিন (আয়রন সঞ্চয়)',
    result_type: 'numeric',
    canonical_unit: 'ng/mL',
    supported_units: ['ng/mL', 'µg/L', 'ug/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'sex_specific_ref',
    interpretation_eligible: true,
    related_systems: ['transport', 'energy', 'assimilation', 'defense_repair'],
    evidence_ids: ['EVID_WHO_2020_FERRITIN'],
    physiological_bounds: { min: 1, max: 15000 },
    fallback_reference_interval: {
      male: { low: 30, high: 300, text: '30–300 ng/mL (WHO depletion <15 µg/L)', source: 'WHO 2020 / Adult Male' },
      female: { low: 15, high: 150, text: '15–150 ng/mL (WHO depletion <15 µg/L)', source: 'WHO 2020 / Adult Female' },
      adult_all: { low: 15, high: 300, text: '15–300 ng/mL (sex-unspecified; WHO depletion <15 µg/L)', source: 'WHO 2020' }
    }
  },
  {
    canonical_id: 'serum_iron',
    legacy_marker_ids: ['iron'],
    aliases: ['serum iron', 'fe'],
    panel: 'hematology_iron',
    label_en: 'Serum Iron',
    label_bn: 'সিরাম আয়রন',
    result_type: 'numeric',
    canonical_unit: 'µg/dL',
    supported_units: ['µg/dL', 'ug/dL', 'µmol/L', 'umol/L'],
    compatible_specimens: ['serum'],
    default_specimen: 'serum',
    population_applicability: 'sex_specific_ref',
    interpretation_eligible: true,
    related_systems: ['transport', 'assimilation'],
    evidence_ids: ['EVID_WHO_2020_FERRITIN'],
    physiological_bounds: { min: 5, max: 1000 },
    fallback_reference_interval: {
      male: { low: 65, high: 175, text: '65–175 µg/dL', source: 'Standard Adult Male' },
      female: { low: 50, high: 170, text: '50–170 µg/dL', source: 'Standard Adult Female' },
      adult_all: { low: 50, high: 175, text: '50–175 µg/dL', source: 'Standard Reference' }
    }
  },
  {
    canonical_id: 'tibc',
    legacy_marker_ids: [],
    aliases: ['total iron binding capacity', 'total iron-binding capacity'],
    panel: 'hematology_iron',
    label_en: 'Total Iron-Binding Capacity (TIBC)',
    label_bn: 'টিআইবিসি (TIBC)',
    result_type: 'numeric',
    canonical_unit: 'µg/dL',
    supported_units: ['µg/dL', 'ug/dL', 'µmol/L', 'umol/L'],
    compatible_specimens: ['serum'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['transport', 'assimilation'],
    evidence_ids: ['EVID_WHO_2020_FERRITIN'],
    physiological_bounds: { min: 50, max: 800 },
    fallback_reference_interval: {
      adult_all: { low: 240, high: 450, text: '240–450 µg/dL', source: 'Standard Reference' }
    }
  },

  // ── PANEL 8: Nutritional Biomarkers ───────────────────────────────
  {
    canonical_id: 'vitamin_b12',
    legacy_marker_ids: ['b12', 'cobalamin'],
    aliases: ['serum vitamin b12', 'b12', 'cobalamin', 'cyanocobalamin'],
    panel: 'vitamins_minerals',
    label_en: 'Serum Vitamin B12',
    label_bn: 'সিরাম ভিটামিন বি১২',
    result_type: 'numeric',
    canonical_unit: 'pg/mL',
    supported_units: ['pg/mL', 'ng/L', 'pmol/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['energy', 'communication', 'assimilation'],
    evidence_ids: ['EVID_MHRA_2022_METFORMIN_B12', 'EVID_NIH_ODS_MICRONUTRIENTS'],
    physiological_bounds: { min: 30, max: 10000 },
    fallback_reference_interval: {
      adult_all: { low: 200, high: 900, text: '200–900 pg/mL (148–664 pmol/L)', source: 'Clinical Standard' }
    },
    exploratory_functional_range: {
      low: 400,
      high: 900,
      text: '400–900 pg/mL (exploratory sufficiency range)',
      disclaimer_en: 'Borderline B12 (200–350 pg/mL) warrants MMA/homocysteine context rather than assuming deficiency.',
      disclaimer_bn: 'সীমান্তবর্তী বি১২ (২০০–৩৫০ pg/mL) হলে নিশ্চিতকরণের জন্য এমএমএ বা ক্লিনিক্যাল পর্যালোচনা প্রয়োজন।'
    }
  },
  {
    canonical_id: 'folate',
    legacy_marker_ids: ['serum_folate'],
    aliases: ['serum folate', 'folic acid', 'vitamin b9', 'serum_folate'],
    panel: 'vitamins_minerals',
    label_en: 'Serum Folate (Vitamin B9)',
    label_bn: 'সিরাম ফোলেট (ভিটামিন বি৯)',
    result_type: 'numeric',
    canonical_unit: 'ng/mL',
    supported_units: ['ng/mL', 'µg/L', 'ug/L', 'nmol/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['energy', 'assimilation', 'communication'],
    evidence_ids: ['EVID_NIH_ODS_MICRONUTRIENTS'],
    physiological_bounds: { min: 0.5, max: 100 },
    fallback_reference_interval: {
      adult_all: { low: 4.0, high: 20.0, text: '>=4.0 ng/mL (WHO sufficiency cutoff)', source: 'WHO / NIH ODS' }
    }
  },
  {
    canonical_id: 'vitamin_d3',
    legacy_marker_ids: ['vit_d', 'vitamin_d', '25ohd'],
    aliases: ['25-hydroxy vitamin d3', '25(oh)d', 'vit_d', 'vitamin_d', '25ohd'],
    panel: 'vitamins_minerals',
    label_en: '25-Hydroxyvitamin D [25(OH)D]',
    label_bn: 'ভিটামিন ডি (25-OH Vitamin D)',
    result_type: 'numeric',
    canonical_unit: 'ng/mL',
    supported_units: ['ng/mL', 'µg/L', 'ug/L', 'nmol/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['structural_integrity', 'defense_repair', 'communication'],
    evidence_ids: ['EVID_ENDOCRINE_2024_VITD'],
    physiological_bounds: { min: 2, max: 350 },
    fallback_reference_interval: {
      adult_all: { low: 20, high: 100, text: '20–100 ng/mL (50–250 nmol/L); >100–150 excess risk', source: 'Endocrine Society / IOM' }
    },
    exploratory_functional_range: {
      low: 30,
      high: 60,
      text: '30–60 ng/mL (exploratory clinical range)',
      disclaimer_en: 'Per Endocrine Society 2024, uniform targets like 50–80 ng/mL are not mandated for general healthy adults.',
      disclaimer_bn: 'অনুসন্ধানমূলক সীমা; সুস্থ প্রাপ্তবয়স্কদের জন্য সর্বজনীন উচ্চ লক্ষ্যমাত্রা বাধ্যতামূলক নয়।'
    }
  },
  {
    canonical_id: 'homocysteine',
    legacy_marker_ids: ['hcy'],
    aliases: ['serum homocysteine', 'hcy'],
    panel: 'vitamins_minerals',
    label_en: 'Serum Homocysteine',
    label_bn: 'সিরাম হোমোসিস্টিন',
    result_type: 'numeric',
    canonical_unit: 'µmol/L',
    supported_units: ['µmol/L', 'umol/L'],
    compatible_specimens: ['plasma', 'serum'],
    default_specimen: 'plasma',
    requires_fasting: true,
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['transport', 'communication'],
    evidence_ids: ['EVID_NIH_ODS_MICRONUTRIENTS'],
    physiological_bounds: { min: 1, max: 200 },
    fallback_reference_interval: {
      adult_all: { low: 5.0, high: 15.0, text: '5.0–15.0 µmol/L', source: 'Clinical Standard' }
    }
  },
  {
    canonical_id: 'methylmalonic_acid',
    legacy_marker_ids: ['mma'],
    aliases: ['mma', 'serum methylmalonic acid'],
    panel: 'vitamins_minerals',
    label_en: 'Methylmalonic Acid (MMA)',
    label_bn: 'মিথাইলম্যালোনিক এসিড (MMA)',
    result_type: 'numeric',
    canonical_unit: 'nmol/L',
    supported_units: ['nmol/L', 'µmol/L', 'umol/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['energy', 'communication'],
    evidence_ids: ['EVID_MHRA_2022_METFORMIN_B12'],
    physiological_bounds: { min: 10, max: 20000 },
    fallback_reference_interval: {
      adult_all: { low: 0, high: 270, text: '<=270 nmol/L (assay-dependent; elevated also in renal impairment)', source: 'Standard Reference' }
    }
  },
  {
    canonical_id: 'zinc',
    legacy_marker_ids: ['serum_zinc', 'zn'],
    aliases: ['serum zinc', 'serum_zinc', 'zn'],
    panel: 'vitamins_minerals',
    label_en: 'Serum Zinc (Zn)',
    label_bn: 'সিরাম জিংক (Zn)',
    result_type: 'numeric',
    canonical_unit: 'µg/dL',
    supported_units: ['µg/dL', 'ug/dL', 'µmol/L', 'umol/L'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['defense_repair', 'assimilation'],
    evidence_ids: ['EVID_NIH_ODS_MICRONUTRIENTS'],
    physiological_bounds: { min: 10, max: 500 },
    fallback_reference_interval: {
      adult_all: { low: 60, high: 130, text: '60–130 µg/dL (diurnal and acute-phase sensitive)', source: 'IZiNCG / NIH ODS' }
    }
  },
  {
    canonical_id: 'copper',
    legacy_marker_ids: ['serum_copper', 'cu'],
    aliases: ['serum copper', 'serum_copper', 'cu'],
    panel: 'vitamins_minerals',
    label_en: 'Serum Copper (Cu)',
    label_bn: 'সিরাম কপার (Cu)',
    result_type: 'numeric',
    canonical_unit: 'µg/dL',
    supported_units: ['µg/dL', 'ug/dL', 'µmol/L', 'umol/L'],
    compatible_specimens: ['serum'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['defense_repair', 'transport'],
    evidence_ids: ['EVID_NIH_ODS_MICRONUTRIENTS'],
    physiological_bounds: { min: 10, max: 500 },
    fallback_reference_interval: {
      adult_all: { low: 70, high: 155, text: '70–155 µg/dL', source: 'Standard Reference' }
    }
  },

  // ── PANEL 9: Immune & Inflammatory Profile ────────────────────────
  {
    canonical_id: 'crp',
    legacy_marker_ids: ['c_reactive_protein'],
    aliases: ['c-reactive protein', 'c_reactive_protein', 'standard crp'],
    panel: 'inflammatory_markers',
    label_en: 'C-Reactive Protein (Standard CRP)',
    label_bn: 'সি-রিঅ্যাক্টিভ প্রোটিন (CRP)',
    result_type: 'numeric',
    canonical_unit: 'mg/L',
    supported_units: ['mg/L', 'mg/dL'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['defense_repair'],
    evidence_ids: ['EVID_WHO_2020_FERRITIN'],
    physiological_bounds: { min: 0, max: 500 },
    fallback_reference_interval: {
      adult_all: { low: 0, high: 5.0, text: '<5.0 mg/L (standard acute-phase assay; distinct from high-sensitivity hs-CRP)', source: 'Clinical Standard' }
    }
  },
  {
    canonical_id: 'hs_crp',
    legacy_marker_ids: ['hscrp'],
    aliases: ['high-sensitivity crp', 'hscrp', 'hs crp'],
    panel: 'inflammatory_markers',
    label_en: 'High-Sensitivity CRP (hs-CRP)',
    label_bn: 'এইচএস-সিআরপি (hs-CRP)',
    result_type: 'numeric',
    canonical_unit: 'mg/L',
    supported_units: ['mg/L', 'mg/dL'],
    compatible_specimens: ['serum', 'plasma'],
    default_specimen: 'serum',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['defense_repair', 'transport'],
    evidence_ids: ['EVID_AHA_ACC_LIPIDS', 'EVID_WHO_2020_FERRITIN'],
    physiological_bounds: { min: 0, max: 200 },
    fallback_reference_interval: {
      adult_all: { low: 0, high: 3.0, text: '<3.0 mg/L (<1.0 low CVD risk, 1.0–3.0 moderate, >3.0 high; >10 suggests acute phase)', source: 'AHA/CDC' }
    }
  },
  {
    canonical_id: 'esr',
    legacy_marker_ids: [],
    aliases: ['erythrocyte sedimentation rate'],
    panel: 'inflammatory_markers',
    label_en: 'Erythrocyte Sedimentation Rate (ESR)',
    label_bn: 'ইএসআর (ESR)',
    result_type: 'numeric',
    canonical_unit: 'mm/hr',
    supported_units: ['mm/hr', 'mm/1st hr'],
    compatible_specimens: ['whole_blood'],
    default_specimen: 'whole_blood',
    population_applicability: 'sex_specific_ref',
    interpretation_eligible: true,
    related_systems: ['defense_repair'],
    evidence_ids: ['EVID_WHO_2020_FERRITIN'],
    physiological_bounds: { min: 0, max: 200 },
    fallback_reference_interval: {
      male: { low: 0, high: 15, text: '0–15 mm/hr (adult male <50y)', source: 'Clinical Standard' },
      female: { low: 0, high: 20, text: '0–20 mm/hr (adult female <50y)', source: 'Clinical Standard' },
      adult_all: { low: 0, high: 20, text: '0–20 mm/hr (age/sex dependent)', source: 'Clinical Standard' }
    }
  },
  {
    canonical_id: 'wbc',
    legacy_marker_ids: ['total_wbc'],
    aliases: ['total wbc', 'white blood cell count', 'total_wbc', 'leukocytes'],
    panel: 'inflammatory_markers',
    label_en: 'Total WBC Count',
    label_bn: 'শ্বেত রক্তকণিকা (Total WBC)',
    result_type: 'numeric',
    canonical_unit: '10^9/L',
    supported_units: ['10^9/L', '10^3/µL', '/mm3'],
    compatible_specimens: ['whole_blood'],
    default_specimen: 'whole_blood',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['defense_repair'],
    evidence_ids: ['EVID_WHO_2020_FERRITIN'],
    physiological_bounds: { min: 0.1, max: 300 },
    fallback_reference_interval: {
      adult_all: { low: 4.0, high: 11.0, text: '4.0–11.0 x10⁹/L', source: 'Hematology Standard' }
    }
  },
  {
    canonical_id: 'neutrophils_abs',
    legacy_marker_ids: ['anc'],
    aliases: ['anc', 'absolute neutrophil count', 'neutrophils'],
    panel: 'inflammatory_markers',
    label_en: 'Absolute Neutrophil Count (ANC)',
    label_bn: 'নিউট্রোফিল সংখ্যা (ANC)',
    result_type: 'numeric',
    canonical_unit: '10^9/L',
    supported_units: ['10^9/L', '10^3/µL', '/mm3'],
    compatible_specimens: ['whole_blood'],
    default_specimen: 'whole_blood',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['defense_repair'],
    evidence_ids: ['EVID_WHO_2020_FERRITIN'],
    physiological_bounds: { min: 0, max: 100 },
    fallback_reference_interval: {
      adult_all: { low: 1.5, high: 8.0, text: '1.5–8.0 x10⁹/L', source: 'Hematology Standard' }
    }
  },
  {
    canonical_id: 'lymphocytes_abs',
    legacy_marker_ids: ['alc'],
    aliases: ['alc', 'absolute lymphocyte count', 'lymphocytes'],
    panel: 'inflammatory_markers',
    label_en: 'Absolute Lymphocyte Count (ALC)',
    label_bn: 'লিম্ফোসাইট সংখ্যা (ALC)',
    result_type: 'numeric',
    canonical_unit: '10^9/L',
    supported_units: ['10^9/L', '10^3/µL', '/mm3'],
    compatible_specimens: ['whole_blood'],
    default_specimen: 'whole_blood',
    population_applicability: 'all',
    interpretation_eligible: true,
    related_systems: ['defense_repair'],
    evidence_ids: ['EVID_WHO_2020_FERRITIN'],
    physiological_bounds: { min: 0, max: 100 },
    fallback_reference_interval: {
      adult_all: { low: 1.0, high: 4.8, text: '1.0–4.8 x10⁹/L', source: 'Hematology Standard' }
    }
  },
  {
    canonical_id: 'differential_note',
    legacy_marker_ids: ['wbc_differential'],
    aliases: ['differential count', 'wbc_differential'],
    panel: 'inflammatory_markers',
    label_en: 'WBC Differential Summary (Qualitative / Note)',
    label_bn: 'ডাব্লিউবিসি ডিফারেনশিয়াল নোট',
    result_type: 'qualitative',
    canonical_unit: 'note',
    supported_units: ['note', '%'],
    compatible_specimens: ['whole_blood'],
    default_specimen: 'whole_blood',
    population_applicability: 'all',
    interpretation_eligible: false,
    related_systems: ['defense_repair'],
    evidence_ids: []
  }
];

const MARKER_LOOKUP_MAP: Record<string, R7CanonicalMarkerDefinition> = (() => {
  const map: Record<string, R7CanonicalMarkerDefinition> = {};
  for (const def of R7_CANONICAL_MARKERS) {
    map[def.canonical_id.toLowerCase()] = def;
    for (const leg of def.legacy_marker_ids) {
      map[leg.toLowerCase()] = def;
    }
    for (const al of def.aliases) {
      map[al.toLowerCase()] = def;
    }
  }
  return map;
})();

export function resolveCanonicalMarker(markerIdOrAlias: string): R7CanonicalMarkerDefinition | undefined {
  if (!markerIdOrAlias) return undefined;
  if (!markerIdOrAlias || typeof markerIdOrAlias !== 'string') return undefined;
  const clean = markerIdOrAlias.trim().toLowerCase();
  return MARKER_LOOKUP_MAP[clean] || MARKER_LOOKUP_MAP[clean.replace(/[\s-]+/g, '_')];
}

export function getCanonicalMarkerId(markerIdOrAlias?: string): string {
  if (!markerIdOrAlias || typeof markerIdOrAlias !== 'string') return 'unknown_marker';
  const def = resolveCanonicalMarker(markerIdOrAlias);
  return def ? def.canonical_id : markerIdOrAlias.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

/**
 * Converts a numeric result from sourceUnit to targetCanonicalUnit using analyte-specific chemistry rules.
 * Returns { converted, formula_id } or { error } if unsupported or disallowed (e.g. Lp(a)).
 */
export function convertLabUnitValue(
  canonicalMarkerId: string,
  value: number,
  fromUnit: string,
  toUnit?: string
): { ok: true; value: number; unit: string; converted: boolean; formula_id?: string } | { ok: false; error: string } {
  if (typeof value !== 'number' || !Number.isFinite(value) || isNaN(value)) {
    return { ok: false, error: 'Non-finite or malformed numeric laboratory value' };
  }

  const def = resolveCanonicalMarker(canonicalMarkerId);
  const fromNorm = normalizeUnitString(fromUnit);
  const targetUnit = toUnit || def?.canonical_unit || fromUnit;
  const targetNorm = normalizeUnitString(targetUnit);

  if (!fromNorm) {
    return { ok: false, error: 'Missing original measurement unit' };
  }

  // Exact or 1:1 equivalent normalized units
  if (fromNorm === targetNorm) {
    return { ok: true, value, unit: targetUnit, converted: false };
  }

  // Explicit 1:1 equivalents
  if (
    ((fromNorm === 'µg/l' || fromNorm === 'ng/ml') && (targetNorm === 'µg/l' || targetNorm === 'ng/ml')) ||
    ((fromNorm === 'pg/ml' || fromNorm === 'ng/l') && (targetNorm === 'pg/ml' || targetNorm === 'ng/l')) ||
    ((fromNorm === 'mmol/l' || fromNorm === 'meq/l') &&
      (targetNorm === 'mmol/l' || targetNorm === 'meq/l') &&
      (canonicalMarkerId === 'potassium' || canonicalMarkerId === 'sodium' || canonicalMarkerId === 'bicarbonate')) ||
    ((fromNorm === 'u/l' || fromNorm === 'iu/l') && (targetNorm === 'u/l' || targetNorm === 'iu/l')) ||
    ((fromNorm === 'µiu/ml' || fromNorm === 'miu/l') && (targetNorm === 'µiu/ml' || targetNorm === 'miu/l')) ||
    ((fromNorm === 'iu/ml' || fromNorm === 'u/ml') && (targetNorm === 'iu/ml' || targetNorm === 'u/ml')) ||
    ((fromNorm === '10^9/l' || fromNorm === '10^3/µl' || fromNorm === 'k/µl') &&
      (targetNorm === '10^9/l' || targetNorm === '10^3/µl' || targetNorm === 'k/µl'))
  ) {
    return { ok: true, value, unit: targetUnit, converted: false };
  }

  // Disallow Lp(a) universal conversion explicitly (keep original unit safely as non-convertible distinct measurement)
  if (canonicalMarkerId === 'lpa') {
    return {
      ok: false,
      error: 'Unsupported universal conversion between Lp(a) mg/dL and nmol/L; preserve reporting laboratory unit.'
    };
  }

  // Glucose (fasting, postprandial, random, OGTT)
  if (
    canonicalMarkerId === 'fasting_glucose' ||
    canonicalMarkerId === 'postprandial_glucose' ||
    canonicalMarkerId === 'random_glucose' ||
    canonicalMarkerId === 'ogtt_2h_glucose'
  ) {
    if (fromNorm === 'mmol/l' && targetNorm === 'mg/dl') {
      return { ok: true, value: value * GLUCOSE_MMOL_TO_MGDL, unit: 'mg/dL', converted: true, formula_id: 'GLU_MMOL_TO_MGDL' };
    }
    if (fromNorm === 'mg/dl' && targetNorm === 'mmol/L'.toLowerCase()) {
      return { ok: true, value: value / GLUCOSE_MMOL_TO_MGDL, unit: 'mmol/L', converted: true, formula_id: 'GLU_MGDL_TO_MMOL' };
    }
  }

  // Cholesterol & Lipoproteins (TC, HDL, LDL)
  if (canonicalMarkerId === 'total_cholesterol' || canonicalMarkerId === 'hdl' || canonicalMarkerId === 'ldl') {
    if (fromNorm === 'mmol/l' && targetNorm === 'mg/dl') {
      return { ok: true, value: value * CHOLESTEROL_MMOL_TO_MGDL, unit: 'mg/dL', converted: true, formula_id: 'CHOL_MMOL_TO_MGDL' };
    }
    if (fromNorm === 'mg/dl' && targetNorm === 'mmol/l') {
      return { ok: true, value: value / CHOLESTEROL_MMOL_TO_MGDL, unit: 'mmol/L', converted: true, formula_id: 'CHOL_MGDL_TO_MMOL' };
    }
  }

  // Triglycerides (strictly separate MW 88.57 vs Cholesterol 38.67)
  if (canonicalMarkerId === 'triglycerides') {
    if (fromNorm === 'mmol/l' && targetNorm === 'mg/dl') {
      return { ok: true, value: value * TRIGLYCERIDES_MMOL_TO_MGDL, unit: 'mg/dL', converted: true, formula_id: 'TG_MMOL_TO_MGDL' };
    }
    if (fromNorm === 'mg/dl' && targetNorm === 'mmol/l') {
      return { ok: true, value: value / TRIGLYCERIDES_MMOL_TO_MGDL, unit: 'mmol/L', converted: true, formula_id: 'TG_MGDL_TO_MMOL' };
    }
  }

  // ApoB
  if (canonicalMarkerId === 'apob') {
    if (fromNorm === 'g/l' && targetNorm === 'mg/dl') {
      return { ok: true, value: value * 100, unit: 'mg/dL', converted: true, formula_id: 'APOB_GL_TO_MGDL' };
    }
  }

  // HbA1c IFCC mmol/mol <-> NGSP %
  if (canonicalMarkerId === 'hba1c') {
    if (fromNorm === 'mmol/mol' && targetNorm === '%') {
      return { ok: true, value: 0.09148 * value + 2.152, unit: '%', converted: true, formula_id: 'HBA1C_IFCC_TO_NGSP' };
    }
    if (fromNorm === '%' && targetNorm === 'mmol/mol') {
      return { ok: true, value: (value - 2.152) / 0.09148, unit: 'mmol/mol', converted: true, formula_id: 'HBA1C_NGSP_TO_IFCC' };
    }
  }

  // Fasting Insulin (pmol/L -> uIU/mL: / 6.945 vs WHO 6.0; standard clinical pmol/L / 6.945; keep explicit formula)
  if (canonicalMarkerId === 'fasting_insulin' && fromNorm === 'pmol/l' && targetNorm === 'µiu/ml') {
    return { ok: true, value: value / 6.945, unit: 'µIU/mL', converted: true, formula_id: 'INSULIN_PMOL_TO_UIU' };
  }

  // C-Peptide
  if (canonicalMarkerId === 'c_peptide' && fromNorm === 'nmol/l' && targetNorm === 'ng/ml') {
    return { ok: true, value: value * 3.021, unit: 'ng/mL', converted: true, formula_id: 'CPEPTIDE_NMOL_TO_NGML' };
  }

  // Creatinine (mg/dL <-> µmol/L)
  if (canonicalMarkerId === 'creatinine') {
    if ((fromNorm === 'µmol/l' || fromNorm === 'mcmol/l') && targetNorm === 'mg/dl') {
      return { ok: true, value: value * CREATININE_UMOL_TO_MGDL, unit: 'mg/dL', converted: true, formula_id: 'CR_UMOL_TO_MGDL' };
    }
    if (fromNorm === 'mg/dl' && targetNorm === 'µmol/l') {
      return { ok: true, value: value / CREATININE_UMOL_TO_MGDL, unit: 'µmol/L', converted: true, formula_id: 'CR_MGDL_TO_UMOL' };
    }
  }

  // Urea / BUN
  if (canonicalMarkerId === 'urea' && fromNorm === 'mmol/l' && targetNorm === 'mg/dl') {
    return { ok: true, value: value * UREA_MMOL_TO_MGDL, unit: 'mg/dL', converted: true, formula_id: 'UREA_MMOL_TO_MGDL' };
  }
  if (canonicalMarkerId === 'bun' && fromNorm === 'mmol/l' && targetNorm === 'mg/dl') {
    return { ok: true, value: value * BUN_MMOL_TO_MGDL, unit: 'mg/dL', converted: true, formula_id: 'BUN_MMOL_TO_MGDL' };
  }

  // Uric acid
  if (canonicalMarkerId === 'uric_acid' && fromNorm === 'µmol/l' && targetNorm === 'mg/dL'.toLowerCase()) {
    return { ok: true, value: value * URIC_ACID_UMOL_TO_MGDL, unit: 'mg/dL', converted: true, formula_id: 'URATE_UMOL_TO_MGDL' };
  }

  // Urine albumin & creatinine & UACR
  if (canonicalMarkerId === 'urine_albumin' && fromNorm === 'mg/dl' && targetNorm === 'mg/l') {
    return { ok: true, value: value * 10, unit: 'mg/L', converted: true, formula_id: 'UALB_MGDL_TO_MGL' };
  }
  if (canonicalMarkerId === 'urine_creatinine') {
    if (fromNorm === 'mg/dl' && targetNorm === 'g/l') {
      return { ok: true, value: value * 0.01, unit: 'g/L', converted: true, formula_id: 'UCR_MGDL_TO_GL' };
    }
    if (fromNorm === 'mmol/l' && targetNorm === 'g/l') {
      return { ok: true, value: value * 0.11312, unit: 'g/L', converted: true, formula_id: 'UCR_MMOL_TO_GL' };
    }
  }
  if (canonicalMarkerId === 'uacr' && fromNorm === 'mg/mmol' && targetNorm === 'mg/g') {
    return { ok: true, value: value * 8.84, unit: 'mg/g', converted: true, formula_id: 'UACR_MGMMOL_TO_MGG' };
  }

  // Calcium / Ionized Calcium / Magnesium / Phosphorus
  if (canonicalMarkerId === 'total_calcium' && fromNorm === 'mmol/l' && targetNorm === 'mg/dl') {
    return { ok: true, value: value * CALCIUM_MMOL_TO_MGDL, unit: 'mg/dL', converted: true, formula_id: 'CA_MMOL_TO_MGDL' };
  }
  if (canonicalMarkerId === 'ionized_calcium' && fromNorm === 'mg/dl' && targetNorm === 'mmol/l') {
    return { ok: true, value: value / CALCIUM_MMOL_TO_MGDL, unit: 'mmol/L', converted: true, formula_id: 'ICA_MGDL_TO_MMOL' };
  }
  if (canonicalMarkerId === 'magnesium') {
    if (fromNorm === 'mmol/l' && targetNorm === 'mg/dl') {
      return { ok: true, value: value * MAGNESIUM_MMOL_TO_MGDL, unit: 'mg/dL', converted: true, formula_id: 'MG_MMOL_TO_MGDL' };
    }
    if (fromNorm === 'meq/l' && targetNorm === 'mg/dl') {
      return { ok: true, value: value * (MAGNESIUM_MMOL_TO_MGDL / 2), unit: 'mg/dL', converted: true, formula_id: 'MG_MEQ_TO_MGDL' };
    }
  }
  if (canonicalMarkerId === 'phosphorus' && fromNorm === 'mmol/l' && targetNorm === 'mg/dl') {
    return { ok: true, value: value * PHOSPHORUS_MMOL_TO_MGDL, unit: 'mg/dL', converted: true, formula_id: 'PO4_MMOL_TO_MGDL' };
  }

  // Vitamin D (25-OH-D): nmol/L -> ng/mL
  if (canonicalMarkerId === 'vitamin_d3' && fromNorm === 'nmol/l' && targetNorm === 'ng/ml') {
    return { ok: true, value: value * VITD_NMOL_TO_NGML, unit: 'ng/mL', converted: true, formula_id: 'VITD_NMOL_TO_NGML' };
  }

  // Vitamin B12: pmol/L -> pg/mL
  if (canonicalMarkerId === 'vitamin_b12' && fromNorm === 'pmol/l' && targetNorm === 'pg/ml') {
    return { ok: true, value: value * B12_PMOL_TO_PGML, unit: 'pg/mL', converted: true, formula_id: 'B12_PMOL_TO_PGML' };
  }

  // Folate: nmol/L -> ng/mL
  if (canonicalMarkerId === 'folate' && fromNorm === 'nmol/l' && targetNorm === 'ng/ml') {
    return { ok: true, value: value * FOLATE_NMOL_TO_NGML, unit: 'ng/mL', converted: true, formula_id: 'FOLATE_NMOL_TO_NGML' };
  }

  // MMA: µmol/L -> nmol/L
  if (canonicalMarkerId === 'methylmalonic_acid' && fromNorm === 'µmol/l' && targetNorm === 'nmol/l') {
    return { ok: true, value: value * 1000, unit: 'nmol/L', converted: true, formula_id: 'MMA_UMOL_TO_NMOL' };
  }

  // Zinc & Copper: µmol/L -> µg/dL
  if (canonicalMarkerId === 'zinc' && fromNorm === 'µmol/l' && targetNorm === 'µg/dl') {
    return { ok: true, value: value * 6.538, unit: 'µg/dL', converted: true, formula_id: 'ZN_UMOL_TO_UGDL' };
  }
  if (canonicalMarkerId === 'copper' && fromNorm === 'µmol/l' && targetNorm === 'µg/dl') {
    return { ok: true, value: value * 6.355, unit: 'µg/dL', converted: true, formula_id: 'CU_UMOL_TO_UGDL' };
  }

  // Hemoglobin, MCHC, Albumin, Total Protein: g/L -> g/dL
  if (
    (canonicalMarkerId === 'hemoglobin' ||
      canonicalMarkerId === 'mchc' ||
      canonicalMarkerId === 'albumin' ||
      canonicalMarkerId === 'total_protein') &&
    fromNorm === 'g/l' &&
    targetNorm === 'g/dl'
  ) {
    return { ok: true, value: value / 10, unit: 'g/dL', converted: true, formula_id: 'GL_TO_GDL' };
  }

  // Hematocrit L/L -> %
  if (canonicalMarkerId === 'hematocrit' && fromNorm === 'l/l' && targetNorm === '%') {
    return { ok: true, value: value * 100, unit: '%', converted: true, formula_id: 'HCT_LL_TO_PCT' };
  }

  // Bilirubin (µmol/L -> mg/dL)
  if (
    (canonicalMarkerId === 'total_bilirubin' || canonicalMarkerId === 'direct_bilirubin') &&
    fromNorm === 'µmol/l' &&
    targetNorm === 'mg/dl'
  ) {
    return { ok: true, value: value * BILIRUBIN_UMOL_TO_MGDL, unit: 'mg/dL', converted: true, formula_id: 'BILI_UMOL_TO_MGDL' };
  }

  // Iron & TIBC (µmol/L -> µg/dL)
  if ((canonicalMarkerId === 'serum_iron' || canonicalMarkerId === 'tibc') && fromNorm === 'µmol/l' && targetNorm === 'µg/dl') {
    return { ok: true, value: value * IRON_UMOL_TO_UGDL, unit: 'µg/dL', converted: true, formula_id: 'FE_UMOL_TO_UGDL' };
  }

  // Free T4 / Free T3
  if (canonicalMarkerId === 'ft4' && fromNorm === 'pmol/l' && targetNorm === 'ng/dl') {
    return { ok: true, value: value / 12.87, unit: 'ng/dL', converted: true, formula_id: 'FT4_PMOL_TO_NGDL' };
  }
  if (canonicalMarkerId === 'ft3' && fromNorm === 'pmol/l' && targetNorm === 'pg/ml') {
    return { ok: true, value: value / 1.536, unit: 'pg/mL', converted: true, formula_id: 'FT3_PMOL_TO_PGML' };
  }

  // CRP / hs-CRP mg/dL -> mg/L
  if ((canonicalMarkerId === 'crp' || canonicalMarkerId === 'hs_crp') && fromNorm === 'mg/dl' && targetNorm === 'mg/l') {
    return { ok: true, value: value * 10, unit: 'mg/L', converted: true, formula_id: 'CRP_MGDL_TO_MGL' };
  }

  // Platelets / WBC / ANC / ALC: /mm3 -> 10^9/L (/ 1000)
  if (
    (canonicalMarkerId === 'platelets' ||
      canonicalMarkerId === 'wbc' ||
      canonicalMarkerId === 'neutrophils_abs' ||
      canonicalMarkerId === 'lymphocytes_abs') &&
    fromNorm === '/mm3' &&
    targetNorm === '10^9/l'
  ) {
    return { ok: true, value: value / 1000, unit: '10^9/L', converted: true, formula_id: 'MM3_TO_10E9L' };
  }

  // Unknown or unsupported unit conversion
  return {
    ok: false,
    error: `Unsupported unit "${fromUnit}" for biomarker "${canonicalMarkerId}" (expected ${targetUnit})`
  };
}

function parseRawValueOrInequality(raw: unknown): {
  numeric?: number;
  inequality?: '<' | '<=' | '>' | '>=';
  isExact: boolean;
  isMalformed: boolean;
} {
  if (raw === undefined || raw === null || raw === '') {
    return { isExact: false, isMalformed: false };
  }
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || isNaN(raw)) {
      return { isExact: false, isMalformed: true };
    }
    return { numeric: raw, isExact: true, isMalformed: false };
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return { isExact: false, isMalformed: false };

    const ineqMatch = trimmed.match(/^(<=|>=|<|>)\s*([+-]?\d+(?:\.\d+)?)$/);
    if (ineqMatch) {
      const val = Number(ineqMatch[2]);
      if (!Number.isFinite(val) || isNaN(val)) return { isExact: false, isMalformed: true };
      return {
        numeric: val,
        inequality: ineqMatch[1] as '<' | '<=' | '>' | '>=',
        isExact: false,
        isMalformed: false
      };
    }

    // Strict numeric regex (reject "12abc" or "NaN" or "Infinity")
    if (/^[+-]?\d+(?:\.\d+)?$/.test(trimmed)) {
      const val = Number(trimmed);
      if (!Number.isFinite(val) || isNaN(val)) return { isExact: false, isMalformed: true };
      return { numeric: val, isExact: true, isMalformed: false };
    }

    return { isExact: false, isMalformed: true };
  }
  return { isExact: false, isMalformed: true };
}

function mapLegacyStatusToAvailability(status?: StructuredLabEntry['status'] | string): LabResultAvailability {
  switch (status) {
    case 'previously_tested':
      return 'available';
    case 'pending_result':
      return 'pending';
    case 'not_tested':
      return 'not_tested';
    case 'declined_unavailable':
    case 'declined_or_cost':
      return 'declined_unavailable';
    case 'invalid':
      return 'invalid';
    case 'superseded':
      return 'superseded';
    default:
      return 'not_tested';
  }
}

function displayRound(val: number): number {
  if (Math.abs(val) >= 100) return Math.round(val * 10) / 10;
  if (Math.abs(val) >= 10) return Math.round(val * 100) / 100;
  return Math.round(val * 1000) / 1000;
}

/**
 * Normalizes a single StructuredLabEntry (preserving double-conversion protection,
 * original units/values, verification metadata, and population/unit safety checks).
 */
export function normalizeSingleLabEntry(
  entry: StructuredLabEntry,
  context?: { patientId?: string; visitId?: string; defaultSourceType?: LabSourceType }
): R7NormalizedLabObservation {
  const canonicalId = getCanonicalMarkerId(entry.canonical_marker_id || entry.marker_id);
  const def = resolveCanonicalMarker(canonicalId);
  const panel: R7LabPanelId = def?.panel || entry.category || 'custom';
  const flags: string[] = [];

  // Scope mismatch protection
  if (entry.patient_id && context?.patientId && entry.patient_id !== context.patientId) {
    flags.push('patient_identity_mismatch');
  }
  if (entry.visit_id && context?.visitId && entry.visit_id !== context.visitId) {
    flags.push('visit_identity_mismatch');
  }

  let availability = mapLegacyStatusToAvailability(entry.status);
  const rawInput = entry.original_value ?? (entry.numeric_value !== undefined ? entry.numeric_value : entry.text_value);
  const originalUnit = entry.original_unit ?? entry.unit;

  // Guard double conversion: if already converted/normalized and matching canonical unit
  if (
    entry.normalized_value !== undefined &&
    Number.isFinite(entry.normalized_value) &&
    entry.canonical_unit &&
    def &&
    normalizeUnitString(entry.canonical_unit) === normalizeUnitString(def.canonical_unit)
  ) {
    const verification: LabVerificationStatus = entry.verification_status || 'unverified';
    return {
      observation_id: entry.observation_id || `obs_${context?.patientId || 'pt'}_${canonicalId}_${entry.test_date || 'nodate'}`,
      canonical_marker_id: canonicalId,
      original_marker_id: entry.marker_id,
      original_marker_name: entry.name_en,
      panel,
      patient_id: entry.patient_id || context?.patientId,
      visit_id: entry.visit_id || context?.visitId,
      lab_report_id: entry.lab_report_id,
      original_value: entry.original_value ?? entry.normalized_value,
      original_unit: originalUnit || entry.canonical_unit,
      normalized_value: entry.normalized_value,
      display_normalized_value: displayRound(entry.normalized_value),
      canonical_unit: entry.canonical_unit,
      is_exact_measurement: !entry.inequality_operator,
      inequality_operator: entry.inequality_operator,
      qualitative_result: entry.qualitative_result,
      specimen_type: entry.specimen_type || def.default_specimen || 'serum',
      collection_datetime: entry.test_date,
      report_date: entry.report_date,
      fasting_status: entry.fasting_status || 'unknown',
      lab_ref_low: entry.conventional_low,
      lab_ref_high: entry.conventional_high,
      ref_interval_provenance: entry.ref_interval_provenance || (entry.conventional_low !== undefined || entry.conventional_high !== undefined ? 'laboratory_provided' : 'unavailable'),
      availability,
      verification_status: verification,
      source_type: entry.source_type || context?.defaultSourceType || 'manual_clinician_entry',
      assay_method: entry.assay_method,
      verified_by: entry.verified_by,
      verified_at: entry.verified_at,
      supersedes_observation_id: entry.supersedes_observation_id,
      notes: entry.clinical_notes || entry.notes,
      data_quality_flags: [...flags, 'already_normalized'],
      is_interpretable: availability === 'available' && !flags.includes('patient_identity_mismatch') && !flags.includes('visit_identity_mismatch')
    };
  }

  // Non-available statuses must never produce normalized quantitative measurements
  if (availability !== 'available') {
    return {
      observation_id: entry.observation_id || `obs_${context?.patientId || 'pt'}_${canonicalId}_${entry.test_date || 'nodate'}`,
      canonical_marker_id: canonicalId,
      original_marker_id: entry.marker_id,
      original_marker_name: entry.name_en,
      panel,
      patient_id: entry.patient_id || context?.patientId,
      visit_id: entry.visit_id || context?.visitId,
      lab_report_id: entry.lab_report_id,
      original_value: undefined,
      original_unit: originalUnit,
      normalized_value: undefined,
      display_normalized_value: undefined,
      canonical_unit: def?.canonical_unit || originalUnit,
      is_exact_measurement: false,
      specimen_type: entry.specimen_type || def?.default_specimen || 'unknown',
      collection_datetime: entry.test_date,
      report_date: entry.report_date,
      fasting_status: entry.fasting_status || 'unknown',
      lab_ref_low: entry.conventional_low,
      lab_ref_high: entry.conventional_high,
      ref_interval_provenance: entry.conventional_low !== undefined || entry.conventional_high !== undefined ? (entry.ref_interval_provenance || 'laboratory_provided') : 'unavailable',
      availability,
      verification_status: entry.verification_status || 'unverified',
      source_type: entry.source_type || context?.defaultSourceType || 'manual_clinician_entry',
      notes: entry.clinical_notes || entry.notes,
      data_quality_flags: flags,
      is_interpretable: false
    };
  }

  // Parse numeric or inequality
  if (def?.result_type === 'qualitative') {
    return {
      observation_id: entry.observation_id || `obs_${context?.patientId || 'pt'}_${canonicalId}`,
      canonical_marker_id: canonicalId,
      original_marker_id: entry.marker_id,
      original_marker_name: entry.name_en,
      panel,
      patient_id: entry.patient_id || context?.patientId,
      visit_id: entry.visit_id || context?.visitId,
      original_value: rawInput,
      original_unit: originalUnit,
      is_exact_measurement: false,
      qualitative_result: entry.qualitative_result || (typeof rawInput === 'string' ? rawInput : undefined),
      specimen_type: entry.specimen_type || def.default_specimen,
      collection_datetime: entry.test_date,
      report_date: entry.report_date,
      fasting_status: entry.fasting_status || 'unknown',
      ref_interval_provenance: 'unavailable',
      availability: 'available',
      verification_status: entry.verification_status || 'unverified',
      source_type: entry.source_type || context?.defaultSourceType || 'manual_clinician_entry',
      notes: entry.clinical_notes || entry.notes,
      data_quality_flags: flags,
      is_interpretable: false
    };
  }

  const parsed = parseRawValueOrInequality(rawInput);
  if (parsed.isMalformed || parsed.numeric === undefined) {
    flags.push(parsed.isMalformed ? 'malformed_numeric_value' : 'missing_numeric_value');
    return {
      observation_id: entry.observation_id || `obs_${context?.patientId || 'pt'}_${canonicalId}`,
      canonical_marker_id: canonicalId,
      original_marker_id: entry.marker_id,
      original_marker_name: entry.name_en,
      panel,
      patient_id: entry.patient_id || context?.patientId,
      visit_id: entry.visit_id || context?.visitId,
      original_value: rawInput,
      original_unit: originalUnit,
      is_exact_measurement: false,
      specimen_type: entry.specimen_type || def?.default_specimen || 'unknown',
      collection_datetime: entry.test_date,
      report_date: entry.report_date,
      fasting_status: entry.fasting_status || 'unknown',
      ref_interval_provenance: 'unavailable',
      availability: 'invalid',
      verification_status: entry.verification_status || 'unverified',
      source_type: entry.source_type || context?.defaultSourceType || 'manual_clinician_entry',
      notes: entry.clinical_notes || entry.notes,
      data_quality_flags: flags,
      is_interpretable: false
    };
  }

  if (!parsed.isExact && parsed.inequality) {
    flags.push('inequality_non_exact');
  }

  // Unit conversion
  let normalizedValue: number | undefined;
  let canonicalUnit = def?.canonical_unit || originalUnit;
  if (!originalUnit || originalUnit.trim() === '') {
    flags.push('missing_unit');
  } else if (canonicalId === 'lpa') {
    const normU = normalizeUnitString(originalUnit);
    if (normU === 'nmol/l' || normU === 'mg/dl') {
      normalizedValue = parsed.numeric;
      canonicalUnit = normU === 'nmol/l' ? 'nmol/L' : 'mg/dL';
      if (normU === 'mg/dl') {
        flags.push('lpa_mass_unit_preserved_no_molar_conversion');
      }
    } else {
      flags.push('unsupported_unit');
    }
  } else if (def) {
    const conv = convertLabUnitValue(canonicalId, parsed.numeric, originalUnit, def.canonical_unit);
    if (conv.ok) {
      normalizedValue = conv.value;
      canonicalUnit = conv.unit;
    } else {
      flags.push('unsupported_unit');
    }
  } else {
    // Custom biomarker: preserve original numeric value and unit without inventing conversion
    normalizedValue = parsed.numeric;
    canonicalUnit = originalUnit;
  }

  // Physiological bounds check
  if (normalizedValue !== undefined && def?.physiological_bounds) {
    if (normalizedValue < def.physiological_bounds.min || normalizedValue > def.physiological_bounds.max || normalizedValue < 0) {
      flags.push('clinically_implausible_value');
      availability = 'invalid';
      normalizedValue = undefined;
    }
  } else if (normalizedValue !== undefined && normalizedValue < 0) {
    flags.push('negative_value_rejected');
    availability = 'invalid';
    normalizedValue = undefined;
  }

  // Important provenance rule (Finding C):
  // Legacy `previously_tested` without explicit verification_status is NOT automatically clinician_verified!
  const verificationStatus: LabVerificationStatus = entry.verification_status || 'unverified';

  const hasUnitOrScopeError =
    flags.includes('unsupported_unit') ||
    flags.includes('missing_unit') ||
    flags.includes('patient_identity_mismatch') ||
    flags.includes('visit_identity_mismatch') ||
    availability === 'invalid';

  // Normalize user-entered conventional intervals if original unit was converted
  let labRefLow = entry.lab_ref_low ?? entry.conventional_low;
  let labRefHigh = entry.lab_ref_high ?? entry.conventional_high;
  if (!hasUnitOrScopeError && def && originalUnit && normalizeUnitString(originalUnit) !== normalizeUnitString(canonicalUnit)) {
    if (labRefLow !== undefined && Number.isFinite(labRefLow)) {
      const convLow = convertLabUnitValue(canonicalId, labRefLow, originalUnit, canonicalUnit);
      if (convLow.ok) labRefLow = convLow.value;
    }
    if (labRefHigh !== undefined && Number.isFinite(labRefHigh)) {
      const convHigh = convertLabUnitValue(canonicalId, labRefHigh, originalUnit, canonicalUnit);
      if (convHigh.ok) labRefHigh = convHigh.value;
    }
  }

  const refProvenance: R7ReferenceProvenance =
    entry.ref_interval_provenance ||
    (labRefLow !== undefined || labRefHigh !== undefined ? 'laboratory_provided' : 'unavailable');

  return {
    observation_id: entry.observation_id || `obs_${context?.patientId || 'pt'}_${canonicalId}_${entry.test_date || 'nodate'}`,
    canonical_marker_id: canonicalId,
    original_marker_id: entry.marker_id,
    original_marker_name: entry.name_en,
    panel,
    patient_id: entry.patient_id || context?.patientId,
    visit_id: entry.visit_id || context?.visitId,
    lab_report_id: entry.lab_report_id,
    original_value: rawInput,
    original_unit: originalUnit,
    normalized_value: normalizedValue,
    display_normalized_value: normalizedValue !== undefined ? displayRound(normalizedValue) : undefined,
    canonical_unit: canonicalUnit,
    is_exact_measurement: parsed.isExact && !hasUnitOrScopeError,
    inequality_operator: parsed.inequality,
    specimen_type: entry.specimen_type || def?.default_specimen || 'unknown',
    collection_datetime: entry.test_date,
    report_date: entry.report_date,
    fasting_status: entry.fasting_status || 'unknown',
    lab_ref_low: labRefLow,
    lab_ref_high: labRefHigh,
    ref_interval_provenance: refProvenance,
    availability,
    verification_status: verificationStatus,
    source_type: entry.source_type || context?.defaultSourceType || 'manual_clinician_entry',
    assay_method: entry.assay_method,
    verified_by: entry.verified_by,
    verified_at: entry.verified_at,
    supersedes_observation_id: entry.supersedes_observation_id,
    notes: entry.clinical_notes || entry.notes,
    data_quality_flags: flags,
    is_interpretable: availability === 'available' && normalizedValue !== undefined && !hasUnitOrScopeError
  };
}

/**
 * Authoritative shared reconciliation & deduplication boundary across:
 * - Structured assessment entries (`labEntries`)
 * - Legacy `PatientProfile.labs` scalar fields
 * Enforces patient/visit isolation, conflict detection, and historical observation preservation.
 */
export function reconcilePatientLaboratories(options: {
  patient: Partial<PatientProfile>;
  visitId?: string;
  structuredEntries?: Record<string, StructuredLabEntry> | StructuredLabEntry[];
  historicalEntries?: StructuredLabEntry[];
  population?: R5PopulationProfile;
}): {
  latestByCanonical: Record<string, R7NormalizedLabObservation>;
  allObservations: R7NormalizedLabObservation[];
  historyByCanonical: Record<string, R7NormalizedLabObservation[]>;
  conflicts: Array<{ canonical_marker_id: string; observations: R7NormalizedLabObservation[] }>;
  reviewQueue: R7NormalizedLabObservation[];
  rejectedForeignRecords: R7NormalizedLabObservation[];
  population: R5PopulationProfile;
} {
  const { patient, visitId, structuredEntries, historicalEntries = [] } = options;
  const patientId = patient.id;
  const effectiveVisitId = visitId || patient.current_visit_id;
  const population = options.population || buildR5PopulationProfile(patient);

  const normalizedList: R7NormalizedLabObservation[] = [];
  const rejectedForeignRecords: R7NormalizedLabObservation[] = [];

  const entriesArr: StructuredLabEntry[] = [];
  if (Array.isArray(structuredEntries)) {
    entriesArr.push(...structuredEntries);
  } else if (structuredEntries && typeof structuredEntries === 'object') {
    for (const [k, v] of Object.entries(structuredEntries as Record<string, any>)) {
      if (v === undefined || v === null || Array.isArray(v) || k === 'lab_flags' || k === 'last_updated' || k === 'notes') {
        continue;
      }
      if (typeof v === 'number' && !isNaN(v)) {
        const def = resolveCanonicalMarker(k);
        entriesArr.push({
          marker_id: k,
          category: (def?.panel as any) || 'glycemic',
          name_en: def?.label_en || k,
          name_bn: def?.label_bn || k,
          status: 'previously_tested',
          unit: def?.canonical_unit || '',
          numeric_value: v,
          original_value: v,
          original_unit: def?.canonical_unit || '',
          verification_status: 'lab_document_reviewed'
        });
      } else if (typeof v === 'object') {
        const resolvedMarkerId = v.canonical_marker_id || v.marker_id || k;
        const def = resolveCanonicalMarker(resolvedMarkerId);
        const numericVal = v.numeric_value ?? v.value ?? v.original_value;
        entriesArr.push({
          ...v,
          marker_id: resolvedMarkerId,
          category: v.category || (def?.panel as any) || 'glycemic',
          name_en: v.name_en || def?.label_en || resolvedMarkerId,
          name_bn: v.name_bn || def?.label_bn || resolvedMarkerId,
          status: v.status || (numericVal !== undefined ? 'previously_tested' : 'never_tested'),
          unit: v.unit || v.original_unit || def?.canonical_unit || '',
          numeric_value: numericVal
        });
      }
    }
  }

  // 1. Normalize current visit structured entries (isolate foreign patient/visit records)
  for (const rawEntry of entriesArr) {
    if (!rawEntry) continue;
    const obs = normalizeSingleLabEntry(rawEntry, {
      patientId,
      visitId: effectiveVisitId,
      defaultSourceType: 'manual_clinician_entry'
    });
    if (obs.data_quality_flags.includes('patient_identity_mismatch') || obs.data_quality_flags.includes('visit_identity_mismatch')) {
      rejectedForeignRecords.push(obs);
      continue;
    }
    normalizedList.push(obs);
  }

  // 2. Convert legacy scalar `patient.labs` fields ONLY when not already represented in structured entries
  const legacyLabs = patient.labs as Partial<FunctionalLabs> | undefined;
  if (legacyLabs && typeof legacyLabs === 'object') {
    const legacyScalarMap: Array<{ key: keyof FunctionalLabs; canonicalId: string; unit: string }> = [
      { key: 'fasting_glucose', canonicalId: 'fasting_glucose', unit: 'mg/dL' },
      { key: 'two_hour_post_prandial', canonicalId: 'postprandial_glucose', unit: 'mg/dL' },
      { key: 'hba1c', canonicalId: 'hba1c', unit: '%' },
      { key: 'fasting_insulin', canonicalId: 'fasting_insulin', unit: 'µIU/mL' },
      { key: 'total_cholesterol', canonicalId: 'total_cholesterol', unit: 'mg/dL' },
      { key: 'triglycerides', canonicalId: 'triglycerides', unit: 'mg/dL' },
      { key: 'hdl', canonicalId: 'hdl', unit: 'mg/dL' },
      { key: 'ldl', canonicalId: 'ldl', unit: 'mg/dL' },
      { key: 'serum_creatinine', canonicalId: 'creatinine', unit: 'mg/dL' },
      { key: 'egfr', canonicalId: 'reported_egfr', unit: 'mL/min/1.73m²' },
      { key: 'potassium', canonicalId: 'potassium', unit: 'mmol/L' },
      { key: 'sodium', canonicalId: 'sodium', unit: 'mmol/L' },
      { key: 'alt', canonicalId: 'alt', unit: 'U/L' },
      { key: 'ast', canonicalId: 'ast', unit: 'U/L' },
      { key: 'tsh', canonicalId: 'tsh', unit: 'µIU/mL' },
      { key: 'ft4', canonicalId: 'ft4', unit: 'ng/dL' },
      { key: 'ft3', canonicalId: 'ft3', unit: 'pg/mL' },
      { key: 'hemoglobin', canonicalId: 'hemoglobin', unit: 'g/dL' },
      { key: 'ferritin', canonicalId: 'ferritin', unit: 'ng/mL' },
      { key: 'uric_acid', canonicalId: 'uric_acid', unit: 'mg/dL' },
      { key: 'vitamin_d3', canonicalId: 'vitamin_d3', unit: 'ng/mL' },
      { key: 'vitamin_b12', canonicalId: 'vitamin_b12', unit: 'pg/mL' },
      { key: 'homocysteine', canonicalId: 'homocysteine', unit: 'µmol/L' },
      { key: 'hs_crp', canonicalId: 'hs_crp', unit: 'mg/L' }
    ];

    const presentCanonical = new Set(
      normalizedList
        .filter(
          o =>
            o.availability === 'available' ||
            o.availability === 'pending' ||
            o.availability === 'invalid' ||
            o.availability === 'declined_unavailable' ||
            o.availability === 'superseded'
        )
        .map(o => o.canonical_marker_id)
    );

    for (const item of legacyScalarMap) {
      const val = legacyLabs[item.key];
      if (val === undefined || val === null) continue;
      if (presentCanonical.has(item.canonicalId)) continue;

      const def = resolveCanonicalMarker(item.canonicalId);
      const legacyEntry: StructuredLabEntry = {
        marker_id: item.canonicalId,
        canonical_marker_id: item.canonicalId,
        observation_id: `legacy_${patientId || 'pt'}_${item.canonicalId}`,
        patient_id: patientId,
        visit_id: effectiveVisitId,
        category: (def?.panel === 'custom' ? 'glycemic' : def?.panel) || 'glycemic',
        name_en: def?.label_en || item.canonicalId,
        name_bn: def?.label_bn || item.canonicalId,
        status: 'previously_tested',
        numeric_value: typeof val === 'number' ? val : Number(val),
        original_value: val as any,
        unit: item.unit,
        verification_status: 'unverified',
        source_type: 'legacy_patient_profile'
      };
      const normObs = normalizeSingleLabEntry(legacyEntry, {
        patientId,
        visitId: effectiveVisitId,
        defaultSourceType: 'legacy_patient_profile'
      });
      normObs.data_quality_flags.push('legacy_scalar_migration_unprovenanced');
      normalizedList.push(normObs);
    }
  }

  // 3. Reconcile duplicates and conflicts per canonical marker
  const latestByCanonical: Record<string, R7NormalizedLabObservation> = {};
  const byMarkerAll: Record<string, R7NormalizedLabObservation[]> = {};
  const conflicts: Array<{ canonical_marker_id: string; observations: R7NormalizedLabObservation[] }> = [];

  for (const obs of normalizedList) {
    if (!byMarkerAll[obs.canonical_marker_id]) byMarkerAll[obs.canonical_marker_id] = [];
    byMarkerAll[obs.canonical_marker_id].push(obs);
  }

  for (const [markerId, list] of Object.entries(byMarkerAll)) {
    const activeObs = list.filter(o => o.availability !== 'superseded');
    const availableObs = activeObs.filter(o => o.availability === 'available' && o.normalized_value !== undefined);

    if (availableObs.length <= 1) {
      // Choose single available, else invalid/pending, else first entry
      latestByCanonical[markerId] =
        availableObs[0] ||
        activeObs.find(o => o.availability === 'invalid') ||
        activeObs.find(o => o.availability === 'pending') ||
        activeObs[0] ||
        list[0];
      continue;
    }

    // Multiple available results for same marker in current scope:
    // Check if superseded explicitly or distinct collection dates; otherwise flag conflict!
    const supersededIds = new Set(activeObs.map(o => o.supersedes_observation_id).filter(Boolean));
    const nonsuperseded = availableObs.filter(o => !supersededIds.has(o.observation_id));

    if (nonsuperseded.length === 1) {
      latestByCanonical[markerId] = nonsuperseded[0];
      continue;
    }

    // Group by collection date; if same/missing date and values differ significantly -> CONFLICT
    const sorted = [...nonsuperseded].sort((a, b) => {
      const da = a.collection_datetime || '';
      const db = b.collection_datetime || '';
      if (da !== db) return db.localeCompare(da);
      const rank = (v: LabVerificationStatus) =>
        v === 'clinician_verified' ? 4 : v === 'lab_document_reviewed' ? 3 : v === 'imported_unreconciled' ? 2 : 1;
      return rank(b.verification_status) - rank(a.verification_status);
    });

    const top = sorted[0];
    const hasSameDateConflict = sorted.some(other => {
      if (other === top) return false;
      const sameDate = (other.collection_datetime || '') === (top.collection_datetime || '');
      if (!sameDate) return false;
      const v1 = top.normalized_value!;
      const v2 = other.normalized_value!;
      return Math.abs(v1 - v2) > Math.max(0.01, Math.abs(v1) * 0.005);
    });

    if (hasSameDateConflict) {
      const flaggedConflict: R7NormalizedLabObservation = {
        ...top,
        data_quality_flags: Array.from(new Set([...top.data_quality_flags, 'conflicting_duplicate_results'])),
        is_interpretable: false
      };
      latestByCanonical[markerId] = flaggedConflict;
      conflicts.push({ canonical_marker_id: markerId, observations: sorted });
    } else {
      latestByCanonical[markerId] = top;
    }
  }

  // 4. Historical longitudinal series (strictly isolated to same patientId)
  const historyByCanonical: Record<string, R7NormalizedLabObservation[]> = {};
  const pushHistory = (obs: R7NormalizedLabObservation) => {
    if (obs.patient_id && patientId && obs.patient_id !== patientId) {
      rejectedForeignRecords.push(obs);
      return;
    }
    if (obs.availability !== 'available' || obs.normalized_value === undefined) return;
    if (!historyByCanonical[obs.canonical_marker_id]) historyByCanonical[obs.canonical_marker_id] = [];
    historyByCanonical[obs.canonical_marker_id].push(obs);
  };

  for (const obs of normalizedList) pushHistory(obs);
  for (const h of historicalEntries) {
    const normH = normalizeSingleLabEntry(h, { patientId, visitId: h.visit_id, defaultSourceType: 'manual_clinician_entry' });
    if (!normH.data_quality_flags.includes('patient_identity_mismatch')) {
      pushHistory(normH);
    } else {
      rejectedForeignRecords.push(normH);
    }
  }

  for (const markerId of Object.keys(historyByCanonical)) {
    const dedup = new Map<string, R7NormalizedLabObservation>();
    for (const o of historyByCanonical[markerId]) {
      const key = `${o.visit_id || ''}|${o.collection_datetime || ''}|${o.normalized_value}`;
      if (!dedup.has(key)) dedup.set(key, o);
    }
    historyByCanonical[markerId] = Array.from(dedup.values()).sort((a, b) =>
      (b.collection_datetime || b.visit_id || '').localeCompare(a.collection_datetime || a.visit_id || '')
    );
  }

  const reviewQueue = Object.values(latestByCanonical).filter(
    o =>
      o.availability === 'invalid' ||
      o.data_quality_flags.some(f =>
        ['unsupported_unit', 'malformed_numeric_value', 'missing_unit', 'conflicting_duplicate_results', 'clinically_implausible_value', 'inequality_non_exact'].includes(f)
      )
  );

  return {
    latestByCanonical,
    allObservations: Object.values(latestByCanonical),
    historyByCanonical,
    conflicts,
    reviewQueue,
    rejectedForeignRecords,
    population
  };
}

export const R7_CANONICAL_TO_LEGACY_LAB_KEY: Record<string, keyof FunctionalLabs> = {
  fasting_glucose: 'fasting_glucose',
  postprandial_glucose: 'two_hour_post_prandial',
  hba1c: 'hba1c',
  fasting_insulin: 'fasting_insulin',
  total_cholesterol: 'total_cholesterol',
  triglycerides: 'triglycerides',
  hdl: 'hdl',
  ldl: 'ldl',
  creatinine: 'serum_creatinine',
  reported_egfr: 'egfr',
  potassium: 'potassium',
  sodium: 'sodium',
  alt: 'alt',
  ast: 'ast',
  tsh: 'tsh',
  ft4: 'ft4',
  ft3: 'ft3',
  hemoglobin: 'hemoglobin',
  ferritin: 'ferritin',
  uric_acid: 'uric_acid',
  vitamin_d3: 'vitamin_d3',
  vitamin_b12: 'vitamin_b12',
  homocysteine: 'homocysteine',
  hs_crp: 'hs_crp'
};

const BLOCKING_SCALAR_QUALITY_FLAGS = new Set([
  'patient_identity_mismatch',
  'visit_identity_mismatch',
  'unsupported_unit',
  'missing_unit',
  'malformed_numeric_value',
  'missing_numeric_value',
  'clinically_implausible_value',
  'negative_value_rejected',
  'conflicting_duplicate_results',
  'inequality_non_exact'
]);

/**
 * Authoritative Checkpoint A gate: determines whether a normalized canonical observation
 * is clinically & structurally eligible for scalar numeric projection or rule evaluation.
 */
export function isEligibleCanonicalScalarObservation(
  obs?: R7NormalizedLabObservation | null,
  conflicts?: Set<string> | Array<{ canonical_marker_id: string }>
): boolean {
  if (!obs) return false;
  if (obs.availability !== 'available') return false;
  if (!obs.is_interpretable) return false;
  if (typeof obs.normalized_value !== 'number' || !Number.isFinite(obs.normalized_value) || obs.normalized_value < 0) {
    return false;
  }
  if (!obs.is_exact_measurement || Boolean(obs.inequality_operator)) return false;
  if (obs.data_quality_flags.some(f => BLOCKING_SCALAR_QUALITY_FLAGS.has(f))) return false;

  if (conflicts) {
    if (conflicts instanceof Set) {
      if (conflicts.has(obs.canonical_marker_id)) return false;
    } else if (conflicts.some(c => c.canonical_marker_id === obs.canonical_marker_id)) {
      return false;
    }
  }
  return true;
}

/**
 * Projects structured R7 laboratory entries onto legacy `PatientProfile.labs` scalar keys
 * ONLY when eligible in canonical form, and actively clears stale scalar values (`undefined`)
 * whenever a structured entry becomes invalid, pending, not tested, declined, unsupported, or conflicting.
 */
export function projectStructuredLabsToLegacyScalars(options: {
  patient: Partial<PatientProfile>;
  visitId?: string;
  structuredEntries: Record<string, StructuredLabEntry> | StructuredLabEntry[];
}): Partial<FunctionalLabs> {
  const patch: Record<string, any> = {};
  const entriesArr = Array.isArray(options.structuredEntries)
    ? options.structuredEntries
    : Object.values(options.structuredEntries || {});

  // Identify every legacy key touched by current structured entries (for clearing stale scalars)
  const recon = reconcilePatientLaboratories({
    patient: { ...options.patient, labs: undefined },
    visitId: options.visitId,
    structuredEntries: options.structuredEntries
  });

  for (const entry of entriesArr) {
    if (!entry) continue;
    const cid = getCanonicalMarkerId(entry.canonical_marker_id || entry.marker_id);
    const legacyKey = R7_CANONICAL_TO_LEGACY_LAB_KEY[cid];
    if (!legacyKey) continue;
    const obs = recon.latestByCanonical[cid];
    patch[legacyKey] = isEligibleCanonicalScalarObservation(obs, recon.conflicts)
      ? obs.normalized_value
      : undefined;
  }

  return patch as Partial<FunctionalLabs>;
}

/**
 * Generates catalog StructuredLabEntry rows for the extended R7 9-panel UI while keeping
 * exact backward compatibility with existing 19 STANDARD_LAB_MARKERS IDs.
 */
export function buildR7CatalogEntries(preserveLegacyIds: boolean = true): StructuredLabEntry[] {
  const legacyIdPreference: Record<string, string> = {
    fasting_glucose: 'fbs',
    postprandial_glucose: 'ppbs',
    creatinine: 'serum_creatinine',
    uric_acid: 'serum_uric_acid',
    alt: 'sgpt_alt',
    potassium: 'serum_potassium',
    phosphorus: 'serum_phosphorus',
    ferritin: 'serum_ferritin'
  };

  return R7_CANONICAL_MARKERS.map(def => {
    const markerId = preserveLegacyIds && legacyIdPreference[def.canonical_id]
      ? legacyIdPreference[def.canonical_id]
      : def.canonical_id;

    // Preserve legacy display units on legacy 19 entries (e.g. fbs mmol/L) while unit normalization converts safely!
    const unit =
      markerId === 'fbs' || markerId === 'ppbs' ? 'mmol/L' : def.canonical_unit;
    const conv =
      markerId === 'fbs'
        ? { low: 3.9, high: 5.5 }
        : markerId === 'ppbs'
        ? { low: 4.4, high: 7.8 }
        : def.fallback_reference_interval?.adult_all;

    return {
      marker_id: markerId,
      canonical_marker_id: def.canonical_id,
      category: (def.panel === 'custom' ? 'glycemic' : def.panel),
      name_en: def.label_en,
      name_bn: def.label_bn,
      status: 'not_tested',
      unit,
      conventional_low: conv?.low,
      conventional_high: conv?.high,
      functional_low: def.exploratory_functional_range?.low,
      functional_high: def.exploratory_functional_range?.high,
      specimen_type: def.default_specimen,
      fasting_status: def.requires_fasting ? 'unknown' : undefined,
      ref_interval_provenance: conv ? 'guideline_fallback' : 'unavailable',
      verification_status: 'unverified'
    };
  });
}
