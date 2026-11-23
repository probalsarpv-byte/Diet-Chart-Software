/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Phase R4: Deterministic Supplement Protocol & Nutrient Overlap Safety Engine
 * 
 * Provides evidence-based supplement candidate generation, unit normalization,
 * and multi-source nutrient overlap screening against established Tolerable Upper Intake Levels (UL):
 * - Safe numeric extraction distinguishing elemental vs compound mass
 * - Unit normalization (mg, mcg, IU, daily vs weekly dosing)
 * - Strict non-zero handling: unknown doses marked UNDETERMINED — CLINICIAN REVIEW REQUIRED
 * - Population-specific reference limits (pediatric, pregnancy, renal impairment)
 * - Safe manual/automated protocol builder with draft/approval workflow
 */

import supplementsCatalog from '@/data/supplements.json';
import medicinesCatalog from '@/data/medicines.json';
import { PatientProfile, SupplementOverlapWarning } from '@/types';
import { 
  SupplementProtocolItem, 
  EvidenceGrade, 
  SupplementFrequency, 
  FoodRelationship 
} from '@/types/r4Protocol';

export interface ParsedDoseInfo {
  raw: string;
  numericMin?: number;
  numericMax?: number;
  representativeDailyValue?: number;
  elementalValue?: number;
  unit?: 'mg' | 'mcg' | 'g' | 'IU';
  isElemental: boolean;
  isWeekly: boolean;
  isUndetermined: boolean;
  parseNote?: string;
}

/**
 * Safely parses dose string into numeric quantities and units.
 * Never treats unknown doses as zero!
 */
export function parseDoseString(doseStr: string, frequency: SupplementFrequency = 'once_daily'): ParsedDoseInfo {
  if (!doseStr || doseStr.trim() === '') {
    return {
      raw: doseStr || '',
      isElemental: false,
      isWeekly: false,
      isUndetermined: true,
      parseNote: 'Empty dose string'
    };
  }

  const clean = doseStr.toLowerCase().replace(/,/g, '');
  const isElemental = clean.includes('elemental');
  const isWeekly = frequency === 'weekly' || clean.includes('weekly') || clean.includes('per week');

  // Detect Unit
  let unit: 'mg' | 'mcg' | 'g' | 'IU' | undefined = undefined;
  if (clean.includes('iu')) {
    unit = 'IU';
  } else if (clean.includes('mcg') || clean.includes('μg') || clean.includes('ug')) {
    unit = 'mcg';
  } else if (clean.includes('mg')) {
    unit = 'mg';
  } else if (clean.includes(' g ') || clean.endsWith('g')) {
    unit = 'g';
  }

  if (!unit) {
    return {
      raw: doseStr,
      isElemental,
      isWeekly,
      isUndetermined: true,
      parseNote: 'Unknown or unparseable unit'
    };
  }

  // Extract numbers (e.g. "200 - 400 mg", "1000 mcg", "4000 iu")
  const matches = clean.match(/(\d+(?:\.\d+)?)/g);
  if (!matches || matches.length === 0) {
    return {
      raw: doseStr,
      unit,
      isElemental,
      isWeekly,
      isUndetermined: true,
      parseNote: 'No numeric values detected'
    };
  }

  const num1 = parseFloat(matches[0]);
  const num2 = matches.length > 1 ? parseFloat(matches[1]) : undefined;

  // Detect explicit elemental quantification, e.g. "200 mg elemental (2000 mg bisglycinate)"
  const elementalMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:mg|mcg|iu)?\s*elemental/);
  const elementalVal = elementalMatch ? parseFloat(elementalMatch[1]) : (isElemental ? num1 : undefined);

  let representative = elementalVal !== undefined ? elementalVal : (num2 !== undefined ? num2 : num1);

  // Frequency adjustment to daily equivalent
  if (isWeekly) {
    representative = representative / 7;
  } else if (frequency === 'twice_daily') {
    representative = representative * 2;
  } else if (frequency === 'thrice_daily') {
    representative = representative * 3;
  }

  return {
    raw: doseStr,
    numericMin: num1,
    numericMax: num2,
    representativeDailyValue: Math.round(representative * 100) / 100,
    elementalValue: elementalVal,
    unit,
    isElemental,
    isWeekly,
    isUndetermined: false
  };
}

/**
 * Standard Upper Intake Limits (UL) for Adults and Special Populations
 */
export interface NutrientULReference {
  nutrient: string;
  adultUL: number; // in normalized unit
  unit: 'mg' | 'mcg' | 'IU';
  isSupplementalOnly: boolean;
  pediatricUL?: number;
  pregnancyUL?: number;
  renalUL?: number;
  description_en: string;
  description_bn: string;
}

export const TOLERABLE_UPPER_LIMITS: Record<string, NutrientULReference> = {
  magnesium: {
    nutrient: 'Magnesium (Elemental)',
    adultUL: 350,
    unit: 'mg',
    isSupplementalOnly: true, // Dietary food magnesium has no UL; supplemental elemental Mg has 350 mg UL
    pediatricUL: 110,
    renalUL: 200,
    description_en: 'Supplemental elemental magnesium UL is 350 mg/day to prevent osmotic diarrhea and hypermagnesemia.',
    description_bn: 'সম্পূরক ম্যাগনেসিয়ামের দৈনিক নিরাপদ ঊর্ধ্বসীমা ৩৫০ মিগ্রা; এর বেশি হলে ডায়রিয়ার ঝুঁকি বাড়ে।'
  },
  vitamin_d: {
    nutrient: 'Vitamin D3 (Cholecalciferol)',
    adultUL: 4000,
    unit: 'IU',
    isSupplementalOnly: false,
    pediatricUL: 2500,
    pregnancyUL: 4000,
    description_en: 'Routine maintenance UL is 4,000 IU/day. Higher therapeutic dosing requires serial 25(OH)D monitoring.',
    description_bn: 'ভিটামিন ডি৩ এর রুটিন দৈনিক ঊর্ধ্বসীমা ৪,০০০ আইইউ; এর বেশি নিলে রক্তে ক্যালসিয়াম মাত্রা বৃদ্ধি পেতে পারে।'
  },
  zinc: {
    nutrient: 'Zinc (Elemental)',
    adultUL: 40,
    unit: 'mg',
    isSupplementalOnly: false,
    pediatricUL: 12,
    pregnancyUL: 40,
    description_en: 'Chronic intake above 40 mg/day induces secondary copper deficiency and microcytic anemia.',
    description_bn: 'দৈনিক ৪০ মিগ্রার বেশি জিংক দীর্ঘমেয়াদে গ্রহণ করলে কপার শোষণ কমে রক্তাল্পতার ঝুঁকি তৈরি হয়।'
  },
  folate: {
    nutrient: 'Folate (Vitamin B9 / Methylfolate)',
    adultUL: 1000,
    unit: 'mcg',
    isSupplementalOnly: true,
    pediatricUL: 400,
    pregnancyUL: 1000,
    description_en: 'Supplemental folate UL is 1,000 mcg/day to prevent masking Vitamin B12 deficiency neuropathy.',
    description_bn: 'সম্পূরক ফোলেটের দৈনিক নিরাপদ সীমা ১,০০০ মাইক্রোগ্রাম; এর বেশি হলে ভিটামিন বি১২ ঘাটতি চাপা পড়ে যেতে পারে।'
  },
  calcium: {
    nutrient: 'Calcium (Elemental)',
    adultUL: 2000,
    unit: 'mg',
    isSupplementalOnly: false,
    pediatricUL: 1500,
    renalUL: 1000,
    description_en: 'Total calcium UL is 2,000 mg/day to avoid vascular calcification and nephrolithiasis.',
    description_bn: 'ক্যালসিয়ামের দৈনিক নিরাপদ ঊর্ধ্বসীমা ২,০০০ মিগ্রা; অতিরিক্ত গ্রহণে কিডনিতে পাথর ও রক্তনালীতে ক্যালসিয়াম জমার ঝুঁকি থাকে।'
  },
  potassium: {
    nutrient: 'Potassium (Elemental / Citrate)',
    adultUL: 2000, // Supplemental limit for non-renal patients
    unit: 'mg',
    isSupplementalOnly: true,
    renalUL: 0, // Contraindicated in severe renal
    description_en: 'Supplemental potassium requires clinician titration under serial serum potassium monitoring.',
    description_bn: 'পটাশিয়াম সাপ্লিমেন্ট গ্রহণের ক্ষেত্রে রক্তে পটাশিয়াম মাত্রা পর্যবেক্ষণ আবশ্যক।'
  }
};

/**
 * Advanced multi-source supplement overlap and cumulative dosage evaluation.
 */
export function checkAdvancedSupplementOverlaps(
  items: SupplementProtocolItem[],
  patient: PatientProfile
): SupplementOverlapWarning[] {
  const warnings: SupplementOverlapWarning[] = [];
  const activeItems = items.filter(i => i.approval_status !== 'rejected' && i.approval_status !== 'discontinued');

  const isPediatric = (patient.age || 35) < 18;
  const isPregnant = patient.population_group === 'pregnancy';
  const hasRenal = (patient.selected_conditions || []).includes('ckd_stage_1_3b') || 
    (patient.confirmed_conditions || []).some(c => c.toLowerCase().includes('ckd') || c.toLowerCase().includes('renal')) ||
    Boolean(patient.labs?.egfr && patient.labs.egfr < 30);

  // Group items by target nutrient
  const nutrientBuckets: Record<string, { item: SupplementProtocolItem; parsed: ParsedDoseInfo }[]> = {
    magnesium: [],
    vitamin_d: [],
    zinc: [],
    folate: [],
    calcium: [],
    potassium: []
  };

  for (const item of activeItems) {
    const text = `${item.generic_nutrient} ${item.chemical_form} ${item.id}`.toLowerCase();
    const parsed = parseDoseString(item.total_compound_dose, item.frequency);

    if (text.includes('magnesium')) nutrientBuckets.magnesium.push({ item, parsed });
    if (text.includes('vitamin d') || text.includes('d3') || text.includes('cholecalciferol')) nutrientBuckets.vitamin_d.push({ item, parsed });
    if (text.includes('zinc')) nutrientBuckets.zinc.push({ item, parsed });
    if (text.includes('folate') || text.includes('folic') || text.includes('b9') || text.includes('methylfolate')) nutrientBuckets.folate.push({ item, parsed });
    if (text.includes('calcium')) nutrientBuckets.calcium.push({ item, parsed });
    if (text.includes('potassium')) nutrientBuckets.potassium.push({ item, parsed });
  }

  // Evaluate each nutrient bucket
  for (const [nutrientKey, entries] of Object.entries(nutrientBuckets)) {
    if (entries.length === 0) continue;

    const ref = TOLERABLE_UPPER_LIMITS[nutrientKey];
    if (!ref) continue;

    // Determine population-specific UL
    let effectiveUL = ref.adultUL;
    if (hasRenal && ref.renalUL !== undefined) {
      effectiveUL = ref.renalUL;
    } else if (isPediatric && ref.pediatricUL !== undefined) {
      effectiveUL = ref.pediatricUL;
    } else if (isPregnant && ref.pregnancyUL !== undefined) {
      effectiveUL = ref.pregnancyUL;
    }

    // Check for multiple sources
    if (entries.length > 1) {
      const sourceNames = entries.map(e => e.item.generic_nutrient);
      const hasUndetermined = entries.some(e => e.parsed.isUndetermined);

      if (hasUndetermined) {
        warnings.push({
          nutrient: ref.nutrient,
          total_amount_estimated: `UNDETERMINED — CLINICIAN REVIEW REQUIRED (${entries.length} concurrent sources)`,
          tolerable_upper_limit: `${effectiveUL} ${ref.unit}/day`,
          sources: sourceNames,
          severity: 'high',
          warning_bn: `সতর্কতা: একাধিক ${ref.nutrient} উৎস চিহ্নিত হয়েছে, কিন্তু সঠিক ডোজ অপরিবর্তনীয় বা অজানা। কোনো সংখ্যা অনুমান না করে ক্লিনিশিয়ানকে সরাসরি লেবেল ও উপাদান যাচাই করতে হবে।`,
          warning_en: `UNDETERMINED OVERLAP: Multiple concurrent ${ref.nutrient} products prescribed (${sourceNames.join(', ')}), with at least one unstandardized dose. Immediate clinician verification required before approval.`
        });
        continue;
      }

      // Check unit compatibility
      const firstUnit = entries[0].parsed.unit;
      const allSameUnit = entries.every(e => e.parsed.unit === firstUnit);

      if (!allSameUnit) {
        warnings.push({
          nutrient: ref.nutrient,
          total_amount_estimated: `UNDETERMINED — INCOMPATIBLE UNITS DETECTED (${entries.map(e => `${e.parsed.representativeDailyValue} ${e.parsed.unit}`).join(' + ')})`,
          tolerable_upper_limit: `${effectiveUL} ${ref.unit}/day`,
          sources: sourceNames,
          severity: 'high',
          warning_bn: `সতর্কতা: একাধিক উৎস থেকে বিভিন্ন পরিমাপের এককে (${entries.map(e => e.parsed.unit).join(', ')}) ${ref.nutrient} নির্ধারিত হয়েছে। সরাসরি যোগ করা অসম্ভব। ক্লিনিশিয়ান রিভিউ আবশ্যক।`,
          warning_en: `INCOMPATIBLE UNITS DETECTED: Multiple sources of ${ref.nutrient} contain mismatched units (${entries.map(e => e.parsed.unit).join(', ')}). Manual chemical normalization required.`
        });
        continue;
      }

      // Sum compatible units
      const totalEstimated = entries.reduce((sum, e) => sum + (e.parsed.representativeDailyValue || 0), 0);

      if (totalEstimated > effectiveUL) {
        warnings.push({
          nutrient: ref.nutrient,
          total_amount_estimated: `${Math.round(totalEstimated)} ${firstUnit}/day`,
          tolerable_upper_limit: `${effectiveUL} ${ref.unit}/day`,
          sources: sourceNames,
          severity: 'high',
          warning_bn: `মারাত্মক ওভারল্যাপ: ${ref.nutrient} এর দৈনিক সম্মিলিত মাত্রা (${Math.round(totalEstimated)} ${firstUnit}) নিরাপদ ঊর্ধ্বসীমা (${effectiveUL} ${ref.unit}) অতিক্রম করেছে। ${ref.description_bn}`,
          warning_en: `TOLERABLE UPPER INTAKE LEVEL (UL) EXCEEDED: Combined estimated daily intake of ${ref.nutrient} (${Math.round(totalEstimated)} ${firstUnit}) exceeds the upper limit of ${effectiveUL} ${ref.unit}/day. ${ref.description_en}`
        });
      } else {
        warnings.push({
          nutrient: ref.nutrient,
          total_amount_estimated: `${Math.round(totalEstimated)} ${firstUnit}/day`,
          tolerable_upper_limit: `${effectiveUL} ${ref.unit}/day`,
          sources: sourceNames,
          severity: 'medium',
          warning_bn: `একাধিক উৎস উপস্থিতি: ${entries.length}টি ফর্মুলেশন থেকে সম্মিলিতভাবে আনুমানিক ${Math.round(totalEstimated)} ${firstUnit}/দিন সরবরাহ হচ্ছে (নিরাপদ সীমার মধ্যে)।`,
          warning_en: `Multi-Source Nutrient Ingestion: ${entries.length} concurrent formulations provide a combined ~${Math.round(totalEstimated)} ${firstUnit}/day (within upper limit).`
        });
      }
    } else {
      // Single source: check if single dose exceeds UL
      const entry = entries[0];
      if (!entry.parsed.isUndetermined && entry.parsed.unit === ref.unit && entry.parsed.representativeDailyValue) {
        if (entry.parsed.representativeDailyValue > effectiveUL) {
          warnings.push({
            nutrient: ref.nutrient,
            total_amount_estimated: `${entry.parsed.representativeDailyValue} ${entry.parsed.unit}/day`,
            tolerable_upper_limit: `${effectiveUL} ${ref.unit}/day`,
            sources: [entry.item.generic_nutrient],
            severity: 'high',
            warning_bn: `একক ডোজ সতর্কতা: ${entry.item.generic_nutrient} এর নির্ধারিত ডোজ (${entry.parsed.representativeDailyValue} ${ref.unit}) নিরাপদ দৈনিক ঊর্ধ্বসীমা (${effectiveUL} ${ref.unit}) অতিক্রম করেছে।`,
            warning_en: `EXCESSIVE SINGLE DOSE: Prescribed single item ${entry.item.generic_nutrient} (${entry.parsed.representativeDailyValue} ${ref.unit}/day) exceeds the established UL of ${effectiveUL} ${ref.unit}/day.`
          });
        }
      }
    }
  }

  return warnings;
}

/**
 * Generates initial candidate supplements based on patient profile and DNI depletions.
 * All items start with approval_status: 'draft_candidate' (NEVER auto-approved).
 */
export function generateCandidateSupplements(patient: PatientProfile): SupplementProtocolItem[] {
  const items: SupplementProtocolItem[] = [];
  const activeMeds = (patient.active_medications || []).map(m => (m || '').toLowerCase());
  const conditions = patient.selected_conditions || [];

  const catalog = supplementsCatalog as any[];

  // Helper to add from catalog with targeted indication
  const addFromCatalog = (
    catalogId: string, 
    indicationEn: string, 
    indicationBn: string, 
    source: 'dni_auto_candidate' | 'condition_targeted',
    overrideTiming?: string,
    overrideFood?: FoodRelationship
  ) => {
    const found = catalog.find(s => s.id === catalogId);
    if (!found) return;

    if (items.some(i => i.catalog_id === catalogId)) return; // No duplicates

    items.push({
      id: `supp_item_${catalogId}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      catalog_id: found.id,
      generic_nutrient: found.name_en,
      chemical_form: found.category || 'Nutraceutical',
      brand_name: found.verified_bd_brands && found.verified_bd_brands.length > 0 
        ? found.verified_bd_brands[0] 
        : undefined,
      brand_verification_status: 'verified_bd_market',
      indication_en: indicationEn,
      indication_bn: indicationBn,
      evidence_category: 'evidence_based',
      total_compound_dose: found.recommended_dose,
      frequency: 'once_daily',
      administration_time: overrideTiming || '08:00',
      relationship_to_food: overrideFood || 'with_breakfast',
      duration_weeks: 12,
      monitoring_parameters: ['Symptom improvement', 'Follow-up clinical review'],
      contraindications: found.contraindications || [],
      known_interactions: [],
      clinician_rationale: `Automated recommendation based on ${source === 'dni_auto_candidate' ? 'medication depletion' : 'clinical condition'}.`,
      approval_status: 'draft_candidate', // Strictly candidate review required!
      source
    });
  };

  // 1. DNI Depletion Candidates
  if (activeMeds.some(m => m.includes('metformin'))) {
    addFromCatalog(
      'supp_methyl_b12',
      'Metformin-induced cellular Vitamin B12 depletion mitigation',
      'মেটফর্মিন ওষুধ ব্যবহারের কারণে ভিটামিন বি১২ শোষণ হ্রাস রোধ',
      'dni_auto_candidate',
      '08:00',
      'with_breakfast'
    );
  }

  if (activeMeds.some(m => m.includes('omeprazole') || m.includes('esomeprazole') || m.includes('pantoprazole') || m.includes('rabeprazole'))) {
    addFromCatalog(
      'supp_magnesium_glycinate',
      'PPI-induced hypomagnesemia & neuromuscular relaxation',
      'পিপিআই ওষুধের কারণে ম্যাগনেসিয়াম ঘাটতি পূরণ ও স্নায়ু শিথিলকরণ',
      'dni_auto_candidate',
      '21:30',
      'before_bed'
    );
  }

  if (activeMeds.some(m => m.includes('statin') || m.includes('atorvastatin') || m.includes('rosuvastatin'))) {
    addFromCatalog(
      'supp_coq10',
      'Statin HMG-CoA reductase inhibition CoQ10 depletion support',
      'স্ট্যাটিন ওষুধের কারণে কো-এনজাইম কিউ১০ ঘাটতি ও পেশির ক্লান্তি রোধ',
      'dni_auto_candidate',
      '13:30',
      'with_fatty_meal'
    );
  }

  if (activeMeds.some(m => m.includes('methotrexate'))) {
    addFromCatalog(
      'supp_active_folate_bcomplex',
      'Methotrexate dihydrofolate reductase inhibition rescue (Administer on non-MTX days)',
      'মেথোট্রেক্সেট ওষুধের অ্যান্টি-ফোলেট পার্শ্বপ্রতিক্রিয়া প্রতিরোধ (ওষুধের নির্দিষ্ট দিন বাদ দিয়ে)',
      'dni_auto_candidate',
      '08:00',
      'with_breakfast'
    );
  }

  // 2. Condition-Targeted Candidates
  if (conditions.includes('gut_dysbiosis') || patient.gut_profile?.acid_reflux_hypoacidity) {
    addFromCatalog(
      'supp_probiotic_boulardii',
      'Intestinal barrier integrity & mucosal microbiota restoration',
      'অন্ত্রের উপকারী ব্যাকটেরিয়া বৃদ্ধি ও পরিপাকতন্ত্রের সুরক্ষা',
      'condition_targeted',
      '10:30',
      'between_meals'
    );
  }

  if (conditions.includes('fatty_liver') || (patient.labs?.tg_hdl_ratio && patient.labs.tg_hdl_ratio > 1.5)) {
    addFromCatalog(
      'supp_omega3',
      'Hepatic lipid export and high-potency EPA/DHA triglyceride regulation',
      'লিভারের চর্বি কমানো এবং ওমেগা-৩ ট্রাইগ্লিসারাইড নিয়ন্ত্রণ',
      'condition_targeted',
      '13:30',
      'with_fatty_meal'
    );
  }

  if (conditions.includes('t2d_ir') || conditions.includes('pcos')) {
    addFromCatalog(
      'supp_berberine_inversion',
      'Cellular AMPK activation & postprandial glucose disposal support',
      'ইনসুলিন সংবেদনশীলতা বৃদ্ধি ও রক্তে গ্লুকোজের আকস্মিক বৃদ্ধি রোধ',
      'condition_targeted',
      '13:15',
      'with_lunch'
    );
  }

  if (conditions.includes('hpa_axis_burnout')) {
    addFromCatalog(
      'supp_ashwagandha_ksm66',
      'HPA-axis adaptogenic modulation & evening cortisol reduction',
      'অ্যাড্রেনাল ক্লান্তি দূরীকরণ এবং কর্টিসল হরমোন নিয়ন্ত্রণ',
      'condition_targeted',
      '21:30',
      'before_bed'
    );
  }

  if (conditions.includes('insomnia_circadian_disruption')) {
    addFromCatalog(
      'supp_l_theanine',
      'Alpha brainwave modulation & nocturnal sleep latency reduction',
      'মস্তিষ্ক শান্ত রাখা এবং দ্রুত ঘুম আসতে সহায়তা করা',
      'condition_targeted',
      '21:30',
      'before_bed'
    );
  }

  return items;
}
