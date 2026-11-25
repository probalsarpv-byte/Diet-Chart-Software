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
import { R7LabIntelligenceSummary } from '@/types/r7Laboratory';
import {
  calculateR7SupplementExposure,
  extractItemIngredients,
  buildHonestCatalogVerificationMetadata,
  canonicalizeNutrientId,
  resolveLifeStageUpperLimit
} from './r7/supplementIntelligence';

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
 * Phase R7: Integrates multi-ingredient breakdown, physical deduplication, life-stage ULs,
 * and single-dose bolus threshold checks while preserving structured legacy warnings.
 */
export function checkAdvancedSupplementOverlaps(
  items: SupplementProtocolItem[],
  patient: PatientProfile,
  labSummary?: R7LabIntelligenceSummary
): SupplementOverlapWarning[] {
  const warnings: SupplementOverlapWarning[] = [];
  const activeItems = items.filter(i => i.approval_status !== 'rejected' && i.approval_status !== 'discontinued');

  const isPediatric = patient.age !== undefined && patient.age < 18;
  const isPregnant = patient.population_group === 'pregnancy' || Boolean((patient as any).is_pregnant);
  const hasRenal = (patient.selected_conditions || []).includes('ckd_stage_1_3b') || 
    (patient.confirmed_conditions || []).some(c => c.toLowerCase().includes('ckd') || c.toLowerCase().includes('renal')) ||
    Boolean(patient.labs?.egfr && patient.labs.egfr < 30);

  // Run structured R7 exposure summary for multi-ingredient & deduplicated checks
  const r7Exposure = calculateR7SupplementExposure({
    supplements: activeItems,
    patient,
    labSummary
  });

  // 1. Add physical duplicate warnings
  for (const dup of r7Exposure.physical_duplicates) {
    warnings.push({
      nutrient: dup.label,
      total_amount_estimated: `PHYSICAL DUPLICATE DEDUPLICATED (${dup.item_ids.length} entries)`,
      tolerable_upper_limit: 'Deduplicated to prevent false exposure inflation',
      sources: dup.item_ids,
      severity: 'medium',
      warning_bn: `${dup.label}-এর একই প্রোডাক্ট একাধিকবার যুক্ত হয়েছে; মোট মাত্রা দ্বিগুণ গণনা এড়াতে একত্রিত করা হয়েছে।`,
      warning_en: `Duplicate physical product reference detected for "${dup.label}" (${dup.item_ids.length} entries); exposure deduplicated for accuracy.`
    });
  }

  // 2. Group items by target nutrient (supports multi-ingredient formulations via extractItemIngredients)
  const nutrientBuckets: Record<string, { item: SupplementProtocolItem; parsed: ParsedDoseInfo; canonicalId: string }[]> = {
    magnesium: [],
    vitamin_d: [],
    zinc: [],
    folate: [],
    calcium: [],
    potassium: [],
    iron: [],
    vitamin_a: [],
    pyridoxine_b6: [],
    selenium: []
  };

  for (const item of activeItems) {
    const extracted = extractItemIngredients(item);
    for (const ing of extracted) {
      const cid = canonicalizeNutrientId(ing.nutrient_id || ing.nutrient_name);
      const bucketKey = cid === 'vitamin_d3' ? 'vitamin_d' : cid;
      if (!nutrientBuckets[bucketKey]) continue;

      const parsed: ParsedDoseInfo = ing.is_elemental_known && ing.elemental_amount_per_unit !== undefined
        ? (() => {
            const single = ing.elemental_amount_per_unit * (ing.prescribed_units_per_dose ?? item.prescribed_units_per_dose ?? 1);
            const p = parseDoseString(`${single} ${ing.amount_unit || 'mg'}`, item.frequency);
            return p.isUndetermined
              ? {
                  raw: `${single} ${ing.amount_unit || 'mg'}`,
                  elementalValue: single,
                  representativeDailyValue: single,
                  unit: (ing.amount_unit as any) || 'mg',
                  isElemental: ing.is_elemental_known,
                  isWeekly: item.frequency === 'weekly',
                  isUndetermined: false
                }
              : p;
          })()
        : parseDoseString(item.total_compound_dose, item.frequency);

      if (!nutrientBuckets[bucketKey].some(existing => existing.item.id === item.id)) {
        nutrientBuckets[bucketKey].push({ item, parsed, canonicalId: cid });
      }
    }
  }

  // Evaluate each nutrient bucket (preserving legacy TOLERABLE_UPPER_LIMITS & expanding to R7 life-stage ULs)
  for (const [nutrientKey, entries] of Object.entries(nutrientBuckets)) {
    if (entries.length === 0) continue;

    const r7Bucket = r7Exposure.exposures_by_nutrient[entries[0].canonicalId];
    const ref = TOLERABLE_UPPER_LIMITS[nutrientKey];
    const lifeStageUL = resolveLifeStageUpperLimit(entries[0].canonicalId, patient);
    const effectiveUL =
      hasRenal && ref?.renalUL !== undefined
        ? ref.renalUL
        : lifeStageUL.ul !== undefined
        ? lifeStageUL.ul
        : isPediatric && ref?.pediatricUL !== undefined
        ? ref.pediatricUL
        : isPregnant && ref?.pregnancyUL !== undefined
        ? ref.pregnancyUL
        : ref?.adultUL;

    const nutrientLabel = ref?.nutrient || lifeStageUL.def?.nutrient_name || nutrientKey;
    const unitLabel = ref?.unit || lifeStageUL.unit || 'mg';
    if (effectiveUL === undefined && !r7Bucket?.is_incomplete_exposure) continue;

    if (entries.length > 1) {
      const sourceNames = entries.map(e => e.item.generic_nutrient);
      const hasUndetermined = entries.some(e => e.parsed.isUndetermined) || Boolean(r7Bucket?.is_incomplete_exposure);

      if (hasUndetermined) {
        warnings.push({
          nutrient: nutrientLabel,
          total_amount_estimated: `UNDETERMINED — CLINICIAN REVIEW REQUIRED (${entries.length} concurrent sources)`,
          tolerable_upper_limit: effectiveUL !== undefined ? `${effectiveUL} ${unitLabel}/day` : 'No established UL',
          sources: sourceNames,
          severity: 'high',
          warning_bn: `সতর্কতা: একাধিক ${nutrientLabel} উৎস চিহ্নিত হয়েছে, কিন্তু সঠিক ডোজ অনির্ধারিত বা অজানা। ক্লিনিশিয়ানকে সরাসরি লেবেল যাচাই করতে হবে।`,
          warning_en: `UNDETERMINED OVERLAP: Multiple concurrent ${nutrientLabel} products prescribed (${sourceNames.join(', ')}), with at least one unstandardized/incomplete dose. Immediate clinician verification required before approval.`
        });
        continue;
      }

      const firstUnit = entries[0].parsed.unit;
      const allSameUnit = entries.every(e => e.parsed.unit === firstUnit);

      if (!allSameUnit) {
        warnings.push({
          nutrient: nutrientLabel,
          total_amount_estimated: `UNDETERMINED — INCOMPATIBLE UNITS DETECTED (${entries.map(e => `${e.parsed.representativeDailyValue} ${e.parsed.unit}`).join(' + ')})`,
          tolerable_upper_limit: `${effectiveUL} ${unitLabel}/day`,
          sources: sourceNames,
          severity: 'high',
          warning_bn: `সতর্কতা: একাধিক উৎস থেকে বিভিন্ন পরিমাপের এককে (${entries.map(e => e.parsed.unit).join(', ')}) ${nutrientLabel} নির্ধারিত হয়েছে।`,
          warning_en: `INCOMPATIBLE UNITS DETECTED: Multiple sources of ${nutrientLabel} contain mismatched units (${entries.map(e => e.parsed.unit).join(', ')}). Manual chemical normalization required.`
        });
        continue;
      }

      const totalEstimated = r7Bucket ? r7Bucket.combined_daily : entries.reduce((sum, e) => sum + (e.parsed.representativeDailyValue || 0), 0);

      if (effectiveUL !== undefined && totalEstimated > effectiveUL) {
        const currentPart = r7Bucket ? ` (Current approved: ${r7Bucket.current_approved_daily} + Proposed: ${r7Bucket.proposed_candidate_daily})` : '';
        warnings.push({
          nutrient: nutrientLabel,
          total_amount_estimated: `${Math.round(totalEstimated)} ${firstUnit}/day`,
          tolerable_upper_limit: `${effectiveUL} ${unitLabel}/day`,
          sources: sourceNames,
          severity: 'high',
          warning_bn: `মারাত্মক ওভারল্যাপ: ${nutrientLabel} এর দৈনিক সম্মিলিত মাত্রা (${Math.round(totalEstimated)} ${firstUnit}) নিরাপদ ঊর্ধ্বসীমা (${effectiveUL} ${unitLabel}) অতিক্রম করেছে।`,
          warning_en: `TOLERABLE UPPER INTAKE LEVEL (UL) EXCEEDED: Combined estimated daily intake of ${nutrientLabel} (${Math.round(totalEstimated)} ${firstUnit})${currentPart} exceeds the ${lifeStageUL.stageLabel} upper limit of ${effectiveUL} ${unitLabel}/day.`
        });
      } else {
        warnings.push({
          nutrient: nutrientLabel,
          total_amount_estimated: `${Math.round(totalEstimated)} ${firstUnit}/day`,
          tolerable_upper_limit: effectiveUL !== undefined ? `${effectiveUL} ${unitLabel}/day` : 'Monitored',
          sources: sourceNames,
          severity: 'medium',
          warning_bn: `একাধিক উৎস উপস্থিতি: ${entries.length}টি ফর্মুলেশন থেকে সম্মিলিতভাবে আনুমানিক ${Math.round(totalEstimated)} ${firstUnit}/দিন সরবরাহ হচ্ছে।`,
          warning_en: `Multi-Source Nutrient Ingestion: ${entries.length} concurrent formulations provide a combined ~${Math.round(totalEstimated)} ${firstUnit}/day (approved: ${r7Bucket?.current_approved_daily ?? 0}, proposed: ${r7Bucket?.proposed_candidate_daily ?? Math.round(totalEstimated)}).`
        });
      }
    } else {
      const entry = entries[0];
      if (effectiveUL !== undefined && !entry.parsed.isUndetermined && entry.parsed.unit === unitLabel && entry.parsed.representativeDailyValue) {
        if (entry.parsed.representativeDailyValue > effectiveUL) {
          warnings.push({
            nutrient: nutrientLabel,
            total_amount_estimated: `${entry.parsed.representativeDailyValue} ${entry.parsed.unit}/day`,
            tolerable_upper_limit: `${effectiveUL} ${unitLabel}/day`,
            sources: [entry.item.generic_nutrient],
            severity: 'high',
            warning_bn: `একক ডোজ সতর্কতা: ${entry.item.generic_nutrient} এর নির্ধারিত ডোজ (${entry.parsed.representativeDailyValue} ${unitLabel}) নিরাপদ দৈনিক ঊর্ধ্বসীমা (${effectiveUL} ${unitLabel}) অতিক্রম করেছে।`,
            warning_en: `EXCESSIVE SINGLE DOSE: Prescribed single item ${entry.item.generic_nutrient} (${entry.parsed.representativeDailyValue} ${unitLabel}/day) exceeds the established ${lifeStageUL.stageLabel} UL of ${effectiveUL} ${unitLabel}/day.`
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

  // Helper to add from catalog with targeted indication and honest verification metadata
  const addFromCatalog = (
    catalogId: string, 
    indicationEn: string, 
    indicationBn: string, 
    source: 'dni_auto_candidate' | 'condition_targeted',
    overrideTiming?: string,
    overrideFood?: FoodRelationship,
    monitoringIndication?: string
  ) => {
    const found = catalog.find(s => s.id === catalogId);
    if (!found) return;

    if (items.some(i => i.catalog_id === catalogId)) return; // No duplicates

    const verification = buildHonestCatalogVerificationMetadata(found.verified_bd_brands);
    const provisionalItem: SupplementProtocolItem = {
      id: `supp_item_${catalogId}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      catalog_id: found.id,
      physical_product_key: found.id,
      generic_nutrient: found.name_en,
      chemical_form: found.category || 'Nutraceutical',
      brand_name: found.verified_bd_brands && found.verified_bd_brands.length > 0 
        ? found.verified_bd_brands[0] 
        : undefined,
      brand_verification_status: verification.status,
      brand_verification_metadata: verification.metadata,
      indication_en: indicationEn,
      indication_bn: indicationBn,
      evidence_category: 'evidence_based',
      total_compound_dose: found.recommended_dose || 'UNKNOWN',
      route: 'oral',
      frequency: 'once_daily',
      administration_time: overrideTiming || 'UNKNOWN',
      is_timing_unknown: !overrideTiming,
      relationship_to_food: overrideFood || 'with_breakfast',
      duration_weeks: undefined,
      monitoring_parameters: ['Symptom improvement', 'Relevant laboratory re-evaluation'],
      monitoring_indication: monitoringIndication,
      contraindications: found.contraindications || [],
      known_interactions: [],
      clinician_rationale: `Draft candidate surfaced from ${source === 'dni_auto_candidate' ? 'medication-nutrient review' : 'clinical condition'}. Requires clinician authorization.`,
      approval_status: 'draft_candidate', // Strictly candidate review required!
      source
    };
    provisionalItem.ingredients = extractItemIngredients(provisionalItem);
    items.push(provisionalItem);
  };

  // 1. DNI Depletion Candidates (qualified, never blanket deficiency diagnosis)
  if (activeMeds.some(m => m.includes('metformin'))) {
    const metforminHighOrMissingLab =
      activeMeds.some(m => m.includes('1000') || m.includes('1500') || m.includes('2000') || m.includes('850')) ||
      (patient.labs?.vitamin_b12 !== undefined && patient.labs.vitamin_b12 < 300) ||
      patient.labs?.vitamin_b12 === undefined;
    if (metforminHighOrMissingLab) {
      addFromCatalog(
        'supp_methyl_b12',
        'Metformin-associated Vitamin B12 monitoring/repletion candidate (verify serum B12)',
        'মেটফর্মিন ব্যবহারের কারণে ভিটামিন বি১২ পর্যবেক্ষণ ও প্রয়োজনে সাপ্লিমেন্ট প্রার্থী',
        'dni_auto_candidate',
        '08:00',
        'with_breakfast',
        'Monitoring candidate unless low/borderline B12 (<300 pg/mL) or neuropathy symptoms documented.'
      );
    }
  }

  if (activeMeds.some(m => m.includes('omeprazole') || m.includes('esomeprazole') || m.includes('pantoprazole') || m.includes('rabeprazole'))) {
    addFromCatalog(
      'supp_magnesium_glycinate',
      'PPI-associated hypomagnesemia risk monitoring candidate',
      'পিপিআই ওষুধের কারণে ম্যাগনেসিয়াম ঘাটতির ঝুঁকি পর্যবেক্ষণ প্রার্থী',
      'dni_auto_candidate',
      '21:30',
      'before_bed',
      'Verify serum Magnesium & renal function (eGFR >= 30) prior to approval.'
    );
  }

  // Statin: Do NOT blindly auto-recommend CoQ10 unless fatigue / myalgia / low energy clinical indication exists
  const hasMuscleOrFatigueConcern =
    (patient.gut_profile?.energy_score !== undefined && patient.gut_profile.energy_score <= 4) ||
    (patient.confirmed_conditions || []).some(c => /myalgia|fatigue|sams|fibromyalgia/i.test(c || ''));
  if (hasMuscleOrFatigueConcern && activeMeds.some(m => m.includes('statin') || m.includes('atorvastatin') || m.includes('rosuvastatin'))) {
    addFromCatalog(
      'supp_coq10',
      'Conditional CoQ10 trial consideration for symptomatic fatigue/myalgia on statin therapy',
      'স্ট্যাটিন থেরাপিতে পেশির দুর্বলতা বা ক্লান্তি থাকলে শর্তসাপেক্ষ CoQ10 পর্যালোচনা',
      'dni_auto_candidate',
      '13:30',
      'with_fatty_meal',
      'Trial evidence mixed for routine prophylaxis; clinician review required.'
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
