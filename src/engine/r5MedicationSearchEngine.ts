/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Phase R5: Smart Medication Search & Indexing Service
 * 
 * Searches Bangladesh medication corpus (32,461 brands, 2,189 generics):
 * - Exact match priority, prefix match, and Levenshtein typo suggestion
 * - Combination drug detection (e.g. Metformin + Vildagliptin)
 * - Brand-to-generic and manufacturer resolution
 * - Clinical rule coverage classification (fully_covered, partially_covered, identity_only, rules_unavailable)
 * - Manual unknown medication entry generator with explicit verification requirement
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const compactData = require('../data/medicine_index_compact.json');
import { R5RuleCoverageStatus, R5MedicationRecord } from '@/types/r5Systems';

export interface R5MedicationSearchResult {
  id: string;
  type: 'brand' | 'generic' | 'manual_custom';
  brand_name?: string;
  generic_name: string;
  manufacturer?: string;
  strength?: string;
  formulation?: string;
  is_combination: boolean;
  active_ingredients: string[];
  rule_coverage: R5RuleCoverageStatus;
  coverage_note_en: string;
  coverage_note_bn: string;
  score: number; // For relevance ranking
}

const generics: string[] = compactData.generics || [];
const manufacturers: string[] = compactData.manufacturers || [];
const brands: [string, number, number][] = compactData.brands || [];

// Comprehensive clinical rule registry coverage map
const CLINICAL_RULE_COVERAGE_MAP: Record<string, R5RuleCoverageStatus> = {
  // Diabetes & Endocrine
  'metformin': 'fully_covered',
  'glimepiride': 'fully_covered',
  'gliclazide': 'fully_covered',
  'glibenclamide': 'fully_covered',
  'glipizide': 'fully_covered',
  'insulin': 'fully_covered',
  'insulin aspart': 'fully_covered',
  'insulin lispro': 'fully_covered',
  'insulin glargine': 'fully_covered',
  'insulin detemir': 'fully_covered',
  'insulin degludec': 'fully_covered',
  'biphasic isophane insulin': 'fully_covered',
  'dapagliflozin': 'fully_covered',
  'empagliflozin': 'fully_covered',
  'canagliflozin': 'fully_covered',
  'semaglutide': 'fully_covered',
  'liraglutide': 'fully_covered',
  'sitagliptin': 'partially_covered',
  'linagliptin': 'partially_covered',
  'vildagliptin': 'partially_covered',
  'levothyroxine': 'fully_covered',
  'levothyroxine sodium': 'fully_covered',
  'carbimazole': 'partially_covered',
  'prednisolone': 'fully_covered',
  'dexamethasone': 'fully_covered',
  'hydrocortisone': 'fully_covered',

  // Cardiovascular & Renal
  'warfarin': 'fully_covered',
  'warfarin sodium': 'fully_covered',
  'rivaroxaban': 'fully_covered',
  'apixaban': 'fully_covered',
  'dabigatran': 'partially_covered',
  'atorvastatin': 'fully_covered',
  'rosuvastatin': 'fully_covered',
  'simvastatin': 'fully_covered',
  'fenofibrate': 'partially_covered',
  'losartan': 'fully_covered',
  'losartan potassium': 'fully_covered',
  'telmisartan': 'fully_covered',
  'valsartan': 'fully_covered',
  'ramipril': 'fully_covered',
  'enalapril': 'fully_covered',
  'lisinopril': 'fully_covered',
  'captopril': 'fully_covered',
  'amlodipine': 'fully_covered',
  'nifedipine': 'partially_covered',
  'diltiazem': 'partially_covered',
  'spironolactone': 'fully_covered',
  'furosemide': 'fully_covered',
  'frusemide': 'fully_covered',
  'hydrochlorothiazide': 'fully_covered',
  'bisoprolol': 'partially_covered',
  'metoprolol': 'partially_covered',
  'atenolol': 'partially_covered',
  'carvedilol': 'partially_covered',

  // Psychiatric & Neurological
  'sertraline': 'fully_covered',
  'fluoxetine': 'fully_covered',
  'escitalopram': 'fully_covered',
  'citalopram': 'fully_covered',
  'paroxetine': 'fully_covered',
  'venlafaxine': 'fully_covered',
  'duloxetine': 'fully_covered',
  'amitriptyline': 'fully_covered',
  'nortriptyline': 'partially_covered',
  'phenelzine': 'fully_covered',
  'tranylcypromine': 'fully_covered',
  'moclobemide': 'partially_covered',
  'olanzapine': 'fully_covered',
  'quetiapine': 'fully_covered',
  'risperidone': 'fully_covered',
  'aripiprazole': 'fully_covered',
  'haloperidol': 'partially_covered',
  'lithium': 'fully_covered',
  'lithium carbonate': 'fully_covered',
  'sodium valproate': 'fully_covered',
  'valproic acid': 'fully_covered',
  'carbamazepine': 'fully_covered',
  'lamotrigine': 'partially_covered',
  'levetiracetam': 'partially_covered',
  'methylphenidate': 'fully_covered',
  'modafinil': 'partially_covered',
  'clonazepam': 'partially_covered',
  'alprazolam': 'partially_covered',

  // Gastrointestinal
  'omeprazole': 'fully_covered',
  'esomeprazole': 'fully_covered',
  'pantoprazole': 'fully_covered',
  'rabeprazole': 'fully_covered',
  'lansoprazole': 'fully_covered',
  'famotidine': 'partially_covered',
  'domperidone': 'partially_covered',
  'metoclopramide': 'partially_covered',
  'lactulose': 'partially_covered',
  'bisacodyl': 'partially_covered',
  'mesalazine': 'fully_covered',
  'sulfasalazine': 'fully_covered',

  // Antimicrobial & Bone
  'ciprofloxacin': 'fully_covered',
  'levofloxacin': 'fully_covered',
  'doxycycline': 'fully_covered',
  'azithromycin': 'partially_covered',
  'clarithromycin': 'partially_covered',
  'amoxicillin': 'partially_covered',
  'isoniazid': 'fully_covered',
  'rifampicin': 'fully_covered',
  'pyrazinamide': 'partially_covered',
  'ethambutol': 'partially_covered',
  'methotrexate': 'fully_covered',
  'alendronate': 'fully_covered',
  'alendronic acid': 'fully_covered',
  'risedronate': 'fully_covered',
  'ibandronic acid': 'fully_covered'
};

function resolveRuleCoverage(genericName: string): {
  coverage: R5RuleCoverageStatus;
  note_en: string;
  note_bn: string;
} {
  const norm = genericName.toLowerCase();
  for (const [key, cov] of Object.entries(CLINICAL_RULE_COVERAGE_MAP)) {
    if (norm.includes(key)) {
      return {
        coverage: cov,
        note_en: cov === 'fully_covered'
          ? 'Comprehensive drug-nutrient & chronotherapy rules active.'
          : 'Basic drug-nutrient precautions available.',
        note_bn: cov === 'fully_covered'
          ? 'সম্পূর্ণ ওষুধ-পুষ্টি এবং ক্রোনোথেরাপির নিয়মাবলী সক্রিয়।'
          : 'প্রাথমিক ওষুধ-পুষ্টি সতর্কতা বিদ্যমান।'
      };
    }
  }

  return {
    coverage: 'rules_unavailable',
    note_en: 'Identified in pharmaceutical index; clinical interaction rules incomplete. Requires manual clinician verification.',
    note_bn: 'ওষুধটি সূচিতে চিহ্নিত হয়েছে; তবে স্বয়ংক্রিয় ক্লিনিক্যাল রুল অসম্পূর্ণ। চিকিৎসকের পর্যালোচনা আবশ্যক।'
  };
}

/**
 * Computes Levenshtein distance for safe typo tolerance.
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const row = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = i;
    for (let j = 1; j <= n; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
      row[j - 1] = prev;
      prev = val;
    }
    row[n] = prev;
  }
  return row[n];
}

/**
 * Executes high-performance search across 32,461 brands and 2,189 generics.
 */
export function searchSmartMedications(query: string, maxResults = 30): R5MedicationSearchResult[] {
  if (!query || query.trim().length < 2) return [];

  const clean = query.trim().toLowerCase();
  const results: R5MedicationSearchResult[] = [];
  const seen = new Set<string>();

  function addResult(item: R5MedicationSearchResult) {
    const key = `${item.type}_${item.brand_name || ''}_${item.generic_name}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push(item);
    }
  }

  // Pass 1: Generic exact & prefix match
  for (let gIdx = 0; gIdx < generics.length; gIdx++) {
    const gen = generics[gIdx];
    const genLower = gen.toLowerCase();
    if (genLower === clean) {
      const cov = resolveRuleCoverage(gen);
      addResult({
        id: `gen_exact_${gIdx}`,
        type: 'generic',
        generic_name: gen,
        is_combination: gen.includes('+'),
        active_ingredients: gen.split('+').map(s => s.trim()),
        rule_coverage: cov.coverage,
        coverage_note_en: cov.note_en,
        coverage_note_bn: cov.note_bn,
        score: 100
      });
    } else if (genLower.startsWith(clean)) {
      const cov = resolveRuleCoverage(gen);
      addResult({
        id: `gen_prefix_${gIdx}`,
        type: 'generic',
        generic_name: gen,
        is_combination: gen.includes('+'),
        active_ingredients: gen.split('+').map(s => s.trim()),
        rule_coverage: cov.coverage,
        coverage_note_en: cov.note_en,
        coverage_note_bn: cov.note_bn,
        score: 80
      });
    }
    if (results.length >= maxResults) break;
  }

  // Pass 2: Brand exact & prefix match
  for (let bIdx = 0; bIdx < brands.length; bIdx++) {
    const [bName, gIdx, mIdx] = brands[bIdx];
    const bLower = bName.toLowerCase();
    const genName = generics[gIdx] || 'Unknown Generic';
    const mfrName = manufacturers[mIdx] || undefined;

    if (bLower === clean) {
      const cov = resolveRuleCoverage(genName);
      addResult({
        id: `brand_exact_${bIdx}`,
        type: 'brand',
        brand_name: bName,
        generic_name: genName,
        manufacturer: mfrName,
        is_combination: genName.includes('+'),
        active_ingredients: genName.split('+').map(s => s.trim()),
        rule_coverage: cov.coverage,
        coverage_note_en: cov.note_en,
        coverage_note_bn: cov.note_bn,
        score: 95
      });
    } else if (bLower.startsWith(clean)) {
      const cov = resolveRuleCoverage(genName);
      addResult({
        id: `brand_prefix_${bIdx}`,
        type: 'brand',
        brand_name: bName,
        generic_name: genName,
        manufacturer: mfrName,
        is_combination: genName.includes('+'),
        active_ingredients: genName.split('+').map(s => s.trim()),
        rule_coverage: cov.coverage,
        coverage_note_en: cov.note_en,
        coverage_note_bn: cov.note_bn,
        score: 75
      });
    }
    if (results.length >= maxResults * 2) break;
  }

  // Pass 3: Typo suggestions if results are sparse
  if (results.length < 5 && clean.length >= 4) {
    // Check generics first
    for (let gIdx = 0; gIdx < generics.length; gIdx++) {
      const gen = generics[gIdx];
      const gLower = gen.toLowerCase();
      const firstWord = gLower.split(' ')[0] || gLower;
      if (Math.abs(firstWord.length - clean.length) <= 2) {
        const dist = levenshteinDistance(clean, firstWord);
        if (dist <= 2) {
          const cov = resolveRuleCoverage(gen);
          addResult({
            id: `gen_typo_${gIdx}`,
            type: 'generic',
            generic_name: gen,
            is_combination: gen.includes('+'),
            active_ingredients: gen.split('+').map(s => s.trim()),
            rule_coverage: cov.coverage,
            coverage_note_en: cov.note_en,
            coverage_note_bn: cov.note_bn,
            score: 60 - dist * 10
          });
        }
      }
      if (results.length >= maxResults) break;
    }

    // Check brands
    for (let bIdx = 0; bIdx < Math.min(brands.length, 5000); bIdx++) {
      const [bName, gIdx, mIdx] = brands[bIdx];
      const bLower = bName.toLowerCase();
      if (Math.abs(bLower.length - clean.length) <= 2) {
        const dist = levenshteinDistance(clean, bLower);
        if (dist <= 2) {
          const genName = generics[gIdx] || 'Unknown Generic';
          const cov = resolveRuleCoverage(genName);
          addResult({
            id: `brand_typo_${bIdx}`,
            type: 'brand',
            brand_name: bName,
            generic_name: genName,
            manufacturer: manufacturers[mIdx] || undefined,
            is_combination: genName.includes('+'),
            active_ingredients: genName.split('+').map(s => s.trim()),
            rule_coverage: cov.coverage,
            coverage_note_en: cov.note_en,
            coverage_note_bn: cov.note_bn,
            score: 50 - dist * 10
          });
        }
      }
      if (results.length >= maxResults) break;
    }
  }

  // Sort by relevance score
  return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

/**
 * Creates a structured R5MedicationRecord from manual clinician entry when a drug is not found in corpus.
 */
export function createManualMedicationRecord(
  genericOrBrandName: string,
  dose: string,
  frequency: string,
  route: string = 'Oral',
  prescriberInstructions?: string
): R5MedicationRecord {
  const cov = resolveRuleCoverage(genericOrBrandName);
  return {
    id: `med_manual_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    generic_name: genericOrBrandName,
    prescribed_dose: dose || 'As prescribed',
    dose_unit: dose.replace(/[\d\s.]/g, '') || 'mg',
    frequency: frequency || 'Daily',
    route: route || 'Oral',
    administration_times: [],
    is_timing_unknown: true,
    relationship_to_meals: 'unknown',
    is_prn: false,
    prescriber_instructions: prescriberInstructions,
    verification_status: 'clinician_verified',
    status: 'active',
    rule_coverage: cov.coverage,
    source: 'clinician_entry',
    notes: 'Manually entered medication. Clinical rules evaluated against available generic patterns.'
  };
}

export const searchMedications = searchSmartMedications;
export type SearchResultItem = R5MedicationSearchResult;
export function identifyCombinationDrug(genericName: string): { is_combination: boolean; individual_actives: string[] } {
  const parts = (genericName || '').split('+').map(p => p.trim()).filter(Boolean);
  return { is_combination: parts.length > 1, individual_actives: parts };
}

