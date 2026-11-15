/**
 * SHUDDHO FUNCTIONAL NUTRITION SOFTWARE
 * Medication Identity & Search Service (MediNutrition V5 Integration)
 * 
 * Provides fast, normalized search across 32,461 Bangladesh brands and 2,189 generics.
 * Differentiates covered vs. uncovered medications with explicit clinical review flags.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const compactData = require('../data/medicine_index_compact.json');

export interface MedicineSearchResult {
  type: 'brand' | 'generic';
  name: string;
  generic_name: string;
  manufacturer?: string;
  strength?: string;
  dosage_form?: string;
  is_combination: boolean;
  active_ingredients: string[];
  rule_coverage_status: 'fully_covered' | 'partially_covered' | 'no_rules_available';
  clinical_coverage_note_en: string;
  clinical_coverage_note_bn: string;
  source: string;
}

// Known generics with established clinical nutrition rules in Shuddho
const COVERED_GENERICS_MAP: Record<string, 'fully_covered' | 'partially_covered'> = {
  // Diabetes & Glycemic Management
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

  // Cardiovascular & Renal
  'atorvastatin': 'fully_covered',
  'rosuvastatin': 'fully_covered',
  'simvastatin': 'fully_covered',
  'amlodipine': 'fully_covered',
  'losartan': 'fully_covered',
  'losartan potassium': 'fully_covered',
  'telmisartan': 'fully_covered',
  'valsartan': 'fully_covered',
  'ramipril': 'fully_covered',
  'enalapril': 'fully_covered',
  'lisinopril': 'fully_covered',
  'spironolactone': 'fully_covered',
  'furosemide': 'fully_covered',
  'frusemide': 'fully_covered',
  'hydrochlorothiazide': 'fully_covered',
  'warfarin': 'fully_covered',
  'warfarin sodium': 'fully_covered',

  // Gastrointestinal & Endocrine
  'omeprazole': 'fully_covered',
  'esomeprazole': 'fully_covered',
  'pantoprazole': 'fully_covered',
  'rabeprazole': 'fully_covered',
  'lansoprazole': 'fully_covered',
  'levothyroxine': 'fully_covered',
  'levothyroxine sodium': 'fully_covered',
  'thyroxine': 'fully_covered',

  // Mineral & Bone
  'calcium acetate': 'fully_covered',
  'sevelamer': 'fully_covered',
  'prednisolone': 'fully_covered',
  'dexamethasone': 'fully_covered',
  'methotrexate': 'fully_covered',
};

// Normalized generic index for O(1) matching
const { generics, manufacturers, brands, genericFormulations } = compactData as {
  generics: string[];
  manufacturers: string[];
  brands: [string, number, number][]; // [brandName, genericIdx, mfrIdx]
  genericFormulations: { name: string; strength: string; dosage_form: string }[];
};

function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

function resolveCoverage(genericName: string): {
  status: 'fully_covered' | 'partially_covered' | 'no_rules_available';
  note_en: string;
  note_bn: string;
} {
  const norm = genericName.toLowerCase();
  for (const [key, cov] of Object.entries(COVERED_GENERICS_MAP)) {
    if (norm.includes(key)) {
      return {
        status: cov,
        note_en: cov === 'fully_covered' 
          ? 'Comprehensive drug-nutrient & meal timing rules available.'
          : 'Basic drug-nutrient precautions available.',
        note_bn: cov === 'fully_covered'
          ? 'সম্পূর্ণ ওষুধ-পুষ্টি এবং মিল টাইমিং রুল বিদ্যমান।'
          : 'প্রাথমিক ওষুধ-পুষ্টি সতর্কতা বিদ্যমান।'
      };
    }
  }

  return {
    status: 'no_rules_available',
    note_en: 'Medicine identified in Bangladesh corpus, but clinical interaction coverage is incomplete. Prescribing or dietary intervention requires clinician verification.',
    note_bn: 'ওষুধটি বাংলাদেশের ডাটাবেসে শনাক্ত হলেও ক্লিনিক্যাল ইন্টারঅ্যাকশন কভারেজ সম্পূর্ণ নয়। খাদ্যতালিকায় অন্তর্ভুক্তির পূর্বে ক্লিনিক্যাল পর্যালোচনা আবশ্যক।'
  };
}

/**
 * High-performance search across 32,461 brands and 2,189 generics.
 * Uses strict prefix and word-boundary matching to prevent unsafe partial matching.
 */
export function searchMedications(query: string, maxResults = 25): MedicineSearchResult[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const cleanQuery = query.trim().toLowerCase();
  const results: MedicineSearchResult[] = [];
  const seenKeys = new Set<string>();

  // Helper to add search result
  function addResult(item: MedicineSearchResult) {
    const key = `${item.type}_${item.name}_${item.generic_name}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      results.push(item);
    }
  }

  // 1. Exact Brand matches
  for (let i = 0; i < brands.length; i++) {
    const [brandName, genIdx, mfrIdx] = brands[i];
    if (brandName.toLowerCase() === cleanQuery) {
      const genString = generics[genIdx] || '';
      const mfrString = manufacturers[mfrIdx] || '';
      const coverage = resolveCoverage(genString);
      addResult({
        type: 'brand',
        name: brandName,
        generic_name: genString,
        manufacturer: mfrString,
        is_combination: genString.includes('+') || genString.includes('|'),
        active_ingredients: genString.split(/[+|]/).map(s => s.trim()),
        rule_coverage_status: coverage.status,
        clinical_coverage_note_en: coverage.note_en,
        clinical_coverage_note_bn: coverage.note_bn,
        source: 'Medora/MediNutrition CC BY 4.0'
      });
      if (results.length >= maxResults) return results;
    }
  }

  // 2. Exact Generic matches
  for (const gen of genericFormulations) {
    if (gen.name.toLowerCase() === cleanQuery) {
      const coverage = resolveCoverage(gen.name);
      addResult({
        type: 'generic',
        name: gen.name,
        generic_name: gen.name,
        strength: gen.strength,
        dosage_form: gen.dosage_form,
        is_combination: gen.name.includes('+') || gen.name.includes('|'),
        active_ingredients: gen.name.split(/[+|]/).map(s => s.trim()),
        rule_coverage_status: coverage.status,
        clinical_coverage_note_en: coverage.note_en,
        clinical_coverage_note_bn: coverage.note_bn,
        source: 'Medora/MediNutrition CC BY 4.0'
      });
      if (results.length >= maxResults) return results;
    }
  }

  // 3. Brand Prefix matches
  for (let i = 0; i < brands.length; i++) {
    const [brandName, genIdx, mfrIdx] = brands[i];
    const brandLower = brandName.toLowerCase();
    if (brandLower.startsWith(cleanQuery)) {
      const genString = generics[genIdx] || '';
      const mfrString = manufacturers[mfrIdx] || '';
      const coverage = resolveCoverage(genString);
      addResult({
        type: 'brand',
        name: brandName,
        generic_name: genString,
        manufacturer: mfrString,
        is_combination: genString.includes('+') || genString.includes('|'),
        active_ingredients: genString.split(/[+|]/).map(s => s.trim()),
        rule_coverage_status: coverage.status,
        clinical_coverage_note_en: coverage.note_en,
        clinical_coverage_note_bn: coverage.note_bn,
        source: 'Medora/MediNutrition CC BY 4.0'
      });
      if (results.length >= maxResults) return results;
    }
  }

  // 4. Generic Prefix matches
  for (const gen of genericFormulations) {
    if (gen.name.toLowerCase().startsWith(cleanQuery)) {
      const coverage = resolveCoverage(gen.name);
      addResult({
        type: 'generic',
        name: gen.name,
        generic_name: gen.name,
        strength: gen.strength,
        dosage_form: gen.dosage_form,
        is_combination: gen.name.includes('+') || gen.name.includes('|'),
        active_ingredients: gen.name.split(/[+|]/).map(s => s.trim()),
        rule_coverage_status: coverage.status,
        clinical_coverage_note_en: coverage.note_en,
        clinical_coverage_note_bn: coverage.note_bn,
        source: 'Medora/MediNutrition CC BY 4.0'
      });
      if (results.length >= maxResults) return results;
    }
  }

  // 5. Word boundary Brand matches
  for (let i = 0; i < brands.length; i++) {
    const [brandName, genIdx, mfrIdx] = brands[i];
    const brandLower = brandName.toLowerCase();
    if (brandLower.includes(' ' + cleanQuery) || brandLower.includes('-' + cleanQuery)) {
      const genString = generics[genIdx] || '';
      const mfrString = manufacturers[mfrIdx] || '';
      const coverage = resolveCoverage(genString);
      addResult({
        type: 'brand',
        name: brandName,
        generic_name: genString,
        manufacturer: mfrString,
        is_combination: genString.includes('+') || genString.includes('|'),
        active_ingredients: genString.split(/[+|]/).map(s => s.trim()),
        rule_coverage_status: coverage.status,
        clinical_coverage_note_en: coverage.note_en,
        clinical_coverage_note_bn: coverage.note_bn,
        source: 'Medora/MediNutrition CC BY 4.0'
      });
      if (results.length >= maxResults) return results;
    }
  }

  return results;
}

/**
 * Resolve exact generic identity from a brand or generic query.
 */
export function resolveMedicineIdentity(nameOrBrand: string): MedicineSearchResult | null {
  const matches = searchMedications(nameOrBrand, 1);
  return matches.length > 0 ? matches[0] : null;
}
