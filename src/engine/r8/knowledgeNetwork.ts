/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION PLATFORM
 * PHASE R8-B & R8-C: BIDIRECTIONAL FOOD-NUTRIENT-BIOACTIVE-MECHANISM NETWORK
 * AND PATIENT-SAFE CLINICAL ELIGIBILITY & COMBINED DIET-SUPPLEMENT EXPOSURE
 */

import { FoodItem, PatientProfile } from '../../types';
import { R5MedicationRecord, R5NutritionAdjustmentContract } from '../../types/r5Systems';
import { R7LabIntelligenceSummary } from '../../types/r7Laboratory';
import { R7SupplementExposureSummary, SupplementProtocolItem } from '../../types/r4Protocol';
import {
  R8_BIOACTIVE_COMPOUNDS,
  R8_BIOLOGICAL_MECHANISMS,
  R8_EVIDENCE_REGISTRY,
  R8_FOOD_BIOACTIVE_LINKS,
} from '../../data/r8KnowledgeData';
import {
  R8BioactiveCompound,
  R8BiologicalMechanism,
  R8EvidenceReference,
  R8KnowledgeEdge,
  R8KnowledgeNode,
  R8PatientFoodEligibilityResult,
  TrafficLightStatus,
} from '../../types/r8FoodKnowledge';
import { evaluateMedicationNutritionInteractions } from '../r5MedicationNutritionEngine';
import { calculateR7SupplementExposure, resolveLifeStageUpperLimit } from '../r7/supplementIntelligence';
import { buildR5PopulationProfile } from '../r5PopulationEngine';
import { isEligibleCanonicalScalarObservation } from '../r7/labFoundation';
import {
  aggregateFoodNutrients,
  extractFoodNutrientMeasurement,
  R8_BASELINE_FOODS,
  R8_CANONICAL_NUTRIENTS,
  resolveR8NutrientId,
} from './foodFoundation';

const ALLERGEN_SYNONYMS: Record<string, string[]> = {
  egg: ['egg', 'eggs', 'albumen', 'ovalbumin', 'ডিম'],
  fish: ['fish', 'rohu', 'hilsa', 'catla', 'mrigal', 'mola', 'pangas', 'tilapia', 'মাছ', 'ইলিশ', 'রুই'],
  shellfish: ['shrimp', 'prawn', 'crab', 'lobster', 'chingri', 'চিংড়ি'],
  dairy: ['milk', 'curd', 'yogurt', 'cheese', 'paneer', 'ghee', 'butter', 'whey', 'casein', 'buttermilk', 'দুধ', 'দই'],
  sesame: ['sesame', 'til', 'tahini', 'তিল'],
  soy: ['soy', 'soya', 'soybean', 'tofu', 'সয়া'],
  peanut: ['peanut', 'groundnut', 'চিনাবাদাম'],
  tree_nut: ['almond', 'cashew', 'walnut', 'pistachio', 'বাদাম'],
  gluten: ['wheat', 'atta', 'maida', 'barley', 'rye', 'semolina', 'suji', 'গম'],
  mustard: ['mustard', 'সরিষা'],
};

function matchesAllergyToken(food: FoodItem, allergy: string): boolean {
  const allergyLower = allergy.trim().toLowerCase();
  if (!allergyLower) return false;

  const foodTags = (food.tags || []).map((t: string) => t.toLowerCase());
  const foodText = `${food.name_en} ${food.name_bn} ${food.category} ${foodTags.join(' ')}`.toLowerCase();

  if (foodTags.some((t: string) => t.includes(allergyLower) || allergyLower.includes(t))) {
    return true;
  }
  if (foodText.includes(allergyLower)) {
    return true;
  }

  for (const [, syns] of Object.entries(ALLERGEN_SYNONYMS)) {
    if (syns.some(s => allergyLower.includes(s))) {
      if (syns.some(s => foodText.includes(s))) {
        return true;
      }
    }
  }
  return false;
}

function toR5Meds(patient: Partial<PatientProfile>): R5MedicationRecord[] {
  const meds: R5MedicationRecord[] = [];
  if (Array.isArray((patient as any).r5_medications)) {
    meds.push(...(patient as any).r5_medications);
  }
  const rawMeds = (patient as any).medication_records || patient.active_medications || [];
  if (Array.isArray(rawMeds)) {
    for (const m of rawMeds) {
      if (typeof m === 'string') {
        meds.push({
          id: `med_${m}`,
          generic_name: m,
          route: 'oral',
          administration_times: [],
          is_timing_unknown: true,
          relationship_to_meals: 'unknown',
          is_prn: false,
          is_chronic: true,
          reconciliation_status: 'confirmed_active',
          verification_status: 'patient_reported',
          rule_coverage: 'rule_covered',
          source: 'manual',
          status: 'active',
        } as unknown as R5MedicationRecord);
      } else if (m && typeof m === 'object') {
        meds.push({
          id: (m as any).id || `med_${(m as any).generic_name || (m as any).name || 'unknown'}`,
          generic_name: (m as any).generic_name || (m as any).name || '',
          brand_name: (m as any).brand_name,
          status: (m as any).status || 'active',
          route: (m as any).route || 'oral',
          administration_times: (m as any).administration_times || [],
          is_timing_unknown: (m as any).is_timing_unknown ?? true,
          relationship_to_meals: (m as any).relationship_to_meals || 'unknown',
          is_prn: Boolean((m as any).is_prn),
          is_chronic: (m as any).is_chronic ?? true,
          reconciliation_status: (m as any).reconciliation_status || 'confirmed_active',
          verification_status: (m as any).verification_status || 'patient_reported',
          rule_coverage: (m as any).rule_coverage || 'rule_covered',
          source: (m as any).source || 'manual',
        } as unknown as R5MedicationRecord);
      }
    }
  }
  return meds;
}

export function evaluatePatientFoodEligibility(
  food: FoodItem,
  patient?: Partial<PatientProfile>,
  options?: {
    trafficLight?: {
      green?: Array<{ id: string }>;
      yellow?: Array<{ id: string; reasons?: any[] }>;
      red?: Array<{ id: string; reasons?: any[] }>;
    };
    labSummary?: R7LabIntelligenceSummary;
    r5NutritionContract?: R5NutritionAdjustmentContract;
  }
): R8PatientFoodEligibilityResult {
  const exclusionReasonsEn: string[] = [];
  const exclusionReasonsBn: string[] = [];
  const cautionsEn: string[] = [];
  const cautionsBn: string[] = [];
  const drugInteractionsEn: string[] = [];
  const prepRequirementsEn: string[] = [];

  let trafficStatus: TrafficLightStatus | 'UNCLASSIFIED' = 'UNCLASSIFIED';
  if (options?.trafficLight) {
    const redMatch = options.trafficLight.red?.find(r => r.id === food.id);
    const yellowMatch = options.trafficLight.yellow?.find(y => y.id === food.id);
    const greenMatch = options.trafficLight.green?.find(g => g.id === food.id);
    if (redMatch) {
      trafficStatus = 'RED';
      const reasons = (redMatch.reasons || []).map((r: any) => r.message_en || r.reason || String(r)).filter(Boolean);
      exclusionReasonsEn.push(reasons.length ? `Traffic Light RED: ${reasons.join('; ')}` : 'Traffic Light RED contraindication.');
      exclusionReasonsBn.push('ট্রাফিক লাইট লাল (নিষিদ্ধ) তালিকাভুক্ত।');
    } else if (yellowMatch) {
      trafficStatus = 'YELLOW';
      const reasons = (yellowMatch.reasons || []).map((r: any) => r.message_en || r.reason || String(r)).filter(Boolean);
      cautionsEn.push(reasons.length ? `Traffic Light YELLOW: ${reasons.join('; ')}` : 'Traffic Light YELLOW: use with portion/preparation caution.');
      cautionsBn.push('ট্রাফিক লাইট হলুদ: পরিমিত ও সতর্কতার সাথে গ্রহণীয়।');
    } else if (greenMatch) {
      trafficStatus = 'GREEN';
    }
  }

  if (patient) {
    // 1. Confirmed Allergies / Intolerances
    const allergies = Array.isArray(patient.confirmed_allergies) ? patient.confirmed_allergies : [];
    for (const allergy of allergies) {
      if (matchesAllergyToken(food, allergy)) {
        exclusionReasonsEn.push(`Confirmed allergy/intolerance match: "${allergy}".`);
        exclusionReasonsBn.push(`অ্যালার্জি সতর্কতা: "${allergy}"।`);
      }
    }

    // 2. Canonical Renal / Electrolyte context (prefer R5 contract / R7 canonical lab summary over unverified legacy scalars)
    const conditions = [
      ...(Array.isArray(patient.selected_conditions) ? patient.selected_conditions : []),
      ...(Array.isArray(patient.confirmed_conditions) ? patient.confirmed_conditions : []),
    ];
    const hasRenalCondition = conditions.some((c: any) => /ckd|renal|kidney|hyperkal/i.test(String(c)));
    const labCtx = options?.r5NutritionContract?.lab_safety_context;
    const r7Pot = options?.labSummary?.observations?.potassium;
    const potValue =
      labCtx?.serum_potassium_mmol_l ??
      (r7Pot && isEligibleCanonicalScalarObservation(r7Pot) ? r7Pot.normalized_value : undefined);
    const potLimit = options?.r5NutritionContract?.nutrient_constraints?.potassium_mg_max;
    const egfrUnavailableOrUnverified =
      hasRenalCondition &&
      labCtx &&
      labCtx.egfr_state !== 'available_verified';

    const hasElevatedK =
      (potValue !== undefined && potValue >= 5.0) ||
      Boolean(potLimit) ||
      hasRenalCondition;

    if (egfrUnavailableOrUnverified) {
      cautionsEn.push(
        `Renal laboratory status is ${labCtx!.egfr_state} (not verified normal); verify renal function before finalizing electrolyte/protein choices.`
      );
    }

    if (hasElevatedK) {
      const kMeas = extractFoodNutrientMeasurement(food, 'potassium_mg');
      if (kMeas.value !== null && kMeas.value >= 350) {
        cautionsEn.push(`High potassium (${kMeas.value} mg/100g) in renal/hyperkalemia review context; leach/soak or verify against authorized potassium target.`);
        cautionsBn.push(`উচ্চ পটাশিয়াম (${kMeas.value} mg/100g); কিডনি সতর্কতায় ভিজিয়ে বা অনুমোদিত মাত্রা যাচাই করুন।`);
        prepRequirementsEn.push('Dice, soak in warm water, and discard boiling water if prescribed for potassium moderation.');
      } else if (kMeas.quality === 'missing_unknown' && potLimit !== undefined) {
        cautionsEn.push('Potassium value missing in FCTB V6; verify before prescribing under active potassium limit.');
        cautionsBn.push('পটাশিয়ামের তথ্য অনুপস্থিত; অনুমোদিত পটাশিয়াম সীমায় যাচাই প্রয়োজন।');
      }
    }

    // 3. Medication-Food Interactions via R5/R7 engine
    const meds = toR5Meds(patient);
    if (meds.length > 0) {
      const dniFindings = evaluateMedicationNutritionInteractions(meds, patient, {
        labSummary: options?.labSummary,
      });
      const foodText = `${food.name_en} ${food.category}`.toLowerCase();
      const vitK = extractFoodNutrientMeasurement(food, 'vitamin_k_mcg');

      for (const finding of dniFindings) {
        if (/warfarin|anticoagul/i.test(finding.drug_name)) {
          if ((vitK.value !== null && vitK.value >= 50) || /spinach|amaranth|drumstick, leaves|cabbage/i.test(foodText)) {
            drugInteractionsEn.push(`${finding.drug_name}: keep vitamin K-rich greens intake consistent (avoid sudden spikes).`);
          }
          if (/garlic|ginger|turmeric/i.test(foodText)) {
            drugInteractionsEn.push(`${finding.drug_name}: culinary spice amounts are usually acceptable, avoid high-dose concentrates.`);
          }
        }
        if (/levothyroxine|thyroid/i.test(finding.drug_name)) {
          if (/soy|milk|curd|sesame/i.test(foodText)) {
            drugInteractionsEn.push(`${finding.drug_name}: separate calcium/soy-rich foods by >=4 hours from morning dose.`);
          }
        }
        if (/spironolactone|ace|arb|lisinopril|losartan|enalapril/i.test(finding.drug_name)) {
          const kMeas = extractFoodNutrientMeasurement(food, 'potassium_mg');
          if (kMeas.value !== null && kMeas.value >= 400) {
            drugInteractionsEn.push(`${finding.drug_name}: monitor cumulative potassium intake (${kMeas.value} mg/100g).`);
          }
        }
      }
    }
  }

  const isSafe = exclusionReasonsEn.length === 0;
  return {
    food_id: food.id,
    is_safe_for_patient: isSafe,
    traffic_status: isSafe ? trafficStatus : 'RED',
    exclusion_reasons_en: exclusionReasonsEn,
    exclusion_reasons_bn: exclusionReasonsBn,
    cautions_en: cautionsEn,
    cautions_bn: cautionsBn,
    drug_interactions_en: drugInteractionsEn,
    preparation_requirements_en: prepRequirementsEn,
  };
}

export function filterFoodsForPatientContext(
  foods: FoodItem[],
  patient?: Partial<PatientProfile>,
  options?: {
    trafficLight?: {
      green?: Array<{ id: string }>;
      yellow?: Array<{ id: string; reasons?: any[] }>;
      red?: Array<{ id: string; reasons?: any[] }>;
    };
    labSummary?: R7LabIntelligenceSummary;
  }
) {
  const safeFoods: Array<{ food: FoodItem; eligibility: R8PatientFoodEligibilityResult }> = [];
  const cautionFoods: Array<{ food: FoodItem; eligibility: R8PatientFoodEligibilityResult }> = [];
  const excludedFoods: Array<{ food: FoodItem; eligibility: R8PatientFoodEligibilityResult }> = [];

  for (const food of foods) {
    const eligibility = evaluatePatientFoodEligibility(food, patient, options);
    if (!eligibility.is_safe_for_patient) {
      excludedFoods.push({ food, eligibility });
    } else if (
      eligibility.traffic_status === 'YELLOW' ||
      eligibility.cautions_en.length > 0 ||
      eligibility.drug_interactions_en.length > 0
    ) {
      cautionFoods.push({ food, eligibility });
    } else {
      safeFoods.push({ food, eligibility });
    }
  }

  return { safeFoods, cautionFoods, excludedFoods };
}

export interface R8NetworkQueryResult {
  query_type: string;
  nodes: R8KnowledgeNode[];
  edges: R8KnowledgeEdge[];
  evidence: R8EvidenceReference[];
  top_foods?: Array<{
    food: FoodItem;
    value: number | null;
    unit: string;
    quality: string;
    eligibility?: R8PatientFoodEligibilityResult;
  }>;
  bioactives?: R8BioactiveCompound[];
  mechanisms?: R8BiologicalMechanism[];
  food_first_vs_escalation_note_en?: string;
}

export function queryR8KnowledgeNetwork(params: {
  mode:
    | 'food_to_all'
    | 'nutrient_to_foods'
    | 'bioactive_to_foods'
    | 'mechanism_to_foods'
    | 'system_to_nutrition'
    | 'lab_to_food_first_review';
  target_id: string;
  patient?: Partial<PatientProfile>;
  foods?: FoodItem[];
  limit?: number;
}): R8NetworkQueryResult {
  const foods = params.foods || R8_BASELINE_FOODS;
  const limit = params.limit || 10;
  const nodes: R8KnowledgeNode[] = [];
  const edges: R8KnowledgeEdge[] = [];
  const evidenceIds = new Set<string>();

  const collectEvidence = (ids: string[]) => ids.forEach(id => evidenceIds.add(id));

  if (params.mode === 'food_to_all') {
    const food = foods.find(f => f.id === params.target_id);
    if (!food) {
      return { query_type: params.mode, nodes: [], edges: [], evidence: [] };
    }
    nodes.push({
      id: food.id,
      type: 'Food',
      label_en: food.name_en,
      label_bn: food.name_bn,
      payload: { category: food.category },
    });

    const bioactiveLinks = R8_FOOD_BIOACTIVE_LINKS.filter(l => l.food_id === food.id);
    const bioactives: R8BioactiveCompound[] = [];
    const mechSet = new Map<string, R8BiologicalMechanism>();

    for (const link of bioactiveLinks) {
      const bio = R8_BIOACTIVE_COMPOUNDS.find(b => b.compound_id === link.compound_id);
      if (!bio) continue;
      bioactives.push(bio);
      collectEvidence(link.evidence_ids);
      collectEvidence(bio.evidence_ids);
      nodes.push({
        id: bio.compound_id,
        type: 'BioactiveCompound',
        label_en: bio.name_en,
        label_bn: bio.name_bn,
        payload: { presence_type: link.presence_type, culinary_vs_extract: bio.culinary_vs_extract_note_en },
      });
      edges.push({
        id: `${food.id}->${bio.compound_id}`,
        source: food.id,
        target: bio.compound_id,
        relationship: 'CONTAINS_BIOACTIVE',
        evidence_category: link.evidence_category,
        evidence_ids: link.evidence_ids,
        limitations_en: link.limitations_en,
        directionality: 'directed',
        verification_state: link.evidence_category === 'preclinical_mechanistic' ? 'exploratory' : 'evidence_qualified',
      });
    }

    // Link key measured nutrients to mechanisms
    for (const def of R8_CANONICAL_NUTRIENTS) {
      const meas = extractFoodNutrientMeasurement(food, def.canonical_id);
      if (meas.value !== null && meas.value > 0) {
        collectEvidence(def.evidence_ids);
        nodes.push({
          id: def.canonical_id,
          type: 'Nutrient',
          label_en: `${def.label_en} (${meas.value} ${meas.unit}/100g)`,
          label_bn: def.label_bn,
          payload: meas,
        });
        edges.push({
          id: `${food.id}->${def.canonical_id}`,
          source: food.id,
          target: def.canonical_id,
          relationship: 'CONTAINS_NUTRIENT',
          evidence_category: 'established_human_physiology',
          evidence_ids: ['ev_fctb_v6'],
          limitations_en: 'Per 100 g edible portion in FCTB V6.',
          directionality: 'directed',
          verification_state: 'established',
        });

        // Associate relevant mechanisms
        for (const mech of R8_BIOLOGICAL_MECHANISMS) {
          if (mech.relevant_systems.some(sys => def.relevant_systems.includes(sys))) {
            mechSet.set(mech.mechanism_id, mech);
          }
        }
      }
    }

    const mechanisms = Array.from(mechSet.values());
    mechanisms.forEach(m => {
      collectEvidence(m.evidence_ids);
      nodes.push({
        id: m.mechanism_id,
        type: 'BiologicalMechanism',
        label_en: m.name_en,
        label_bn: m.name_bn,
        payload: { is_exploratory_molecular: m.is_exploratory_molecular, category: m.category },
      });
    });

    return {
      query_type: params.mode,
      nodes,
      edges,
      bioactives,
      mechanisms,
      evidence: Array.from(evidenceIds).map(id => R8_EVIDENCE_REGISTRY[id]).filter(Boolean),
    };
  }

  if (params.mode === 'nutrient_to_foods') {
    const canonicalId = resolveR8NutrientId(params.target_id);
    const def = R8_CANONICAL_NUTRIENTS.find(n => n.canonical_id === canonicalId);
    if (def) collectEvidence(def.evidence_ids);

    const ranked = foods
      .map(food => {
        const meas = extractFoodNutrientMeasurement(food, canonicalId);
        return { food, meas };
      })
      .filter(x => x.meas.quality === 'measured_numeric' && x.meas.value !== null && x.meas.value > 0)
      .sort((a, b) => (b.meas.value ?? 0) - (a.meas.value ?? 0))
      .slice(0, limit);

    const topFoods = ranked.map(({ food, meas }) => ({
      food,
      value: meas.value,
      unit: meas.unit,
      quality: meas.quality,
      eligibility: params.patient ? evaluatePatientFoodEligibility(food, params.patient) : undefined,
    }));

    const mechanisms = def
      ? R8_BIOLOGICAL_MECHANISMS.filter(m => m.relevant_systems.some(s => def.relevant_systems.includes(s)))
      : [];
    mechanisms.forEach(m => collectEvidence(m.evidence_ids));

    return {
      query_type: params.mode,
      nodes,
      edges,
      top_foods: topFoods,
      mechanisms,
      evidence: Array.from(evidenceIds).map(id => R8_EVIDENCE_REGISTRY[id]).filter(Boolean),
    };
  }

  if (params.mode === 'bioactive_to_foods') {
    const bio = R8_BIOACTIVE_COMPOUNDS.find(b => b.compound_id === params.target_id);
    if (bio) collectEvidence(bio.evidence_ids);
    const links = R8_FOOD_BIOACTIVE_LINKS.filter(l => l.compound_id === params.target_id);
    const topFoods = links
      .map(l => {
        collectEvidence(l.evidence_ids);
        const food = foods.find(f => f.id === l.food_id);
        if (!food) return null;
        return {
          food,
          value: l.quantity ?? null,
          unit: l.unit || 'qualitative',
          quality: l.presence_type,
          eligibility: params.patient ? evaluatePatientFoodEligibility(food, params.patient) : undefined,
        };
      })
      .filter(Boolean) as R8NetworkQueryResult['top_foods'];

    return {
      query_type: params.mode,
      nodes,
      edges,
      bioactives: bio ? [bio] : [],
      top_foods: topFoods,
      evidence: Array.from(evidenceIds).map(id => R8_EVIDENCE_REGISTRY[id]).filter(Boolean),
    };
  }

  if (params.mode === 'mechanism_to_foods') {
    const mech = R8_BIOLOGICAL_MECHANISMS.find(m => m.mechanism_id === params.target_id);
    if (!mech) return { query_type: params.mode, nodes: [], edges: [], evidence: [] };
    collectEvidence(mech.evidence_ids);

    const matchingNutrients = R8_CANONICAL_NUTRIENTS.filter(n =>
      n.relevant_systems.some(s => mech.relevant_systems.includes(s))
    );
    const primaryNutrient = matchingNutrients[0];
    const topFoods = primaryNutrient
      ? foods
          .map(f => ({ food: f, meas: extractFoodNutrientMeasurement(f, primaryNutrient.canonical_id) }))
          .filter(x => x.meas.value !== null && x.meas.value > 0)
          .sort((a, b) => (b.meas.value ?? 0) - (a.meas.value ?? 0))
          .slice(0, limit)
          .map(({ food, meas }) => ({
            food,
            value: meas.value,
            unit: meas.unit,
            quality: meas.quality,
            eligibility: params.patient ? evaluatePatientFoodEligibility(food, params.patient) : undefined,
          }))
      : [];

    return {
      query_type: params.mode,
      nodes,
      edges,
      mechanisms: [mech],
      top_foods: topFoods,
      evidence: Array.from(evidenceIds).map(id => R8_EVIDENCE_REGISTRY[id]).filter(Boolean),
    };
  }

  if (params.mode === 'system_to_nutrition') {
    const mechs = R8_BIOLOGICAL_MECHANISMS.filter(m =>
      m.relevant_systems.includes(params.target_id as any)
    );
    mechs.forEach(m => collectEvidence(m.evidence_ids));
    const nutrients = R8_CANONICAL_NUTRIENTS.filter(n =>
      n.relevant_systems.includes(params.target_id as any)
    );
    nutrients.forEach(n => collectEvidence(n.evidence_ids));

    return {
      query_type: params.mode,
      nodes,
      edges,
      mechanisms: mechs,
      evidence: Array.from(evidenceIds).map(id => R8_EVIDENCE_REGISTRY[id]).filter(Boolean),
    };
  }

  // lab_to_food_first_review
  const labLower = params.target_id.toLowerCase();
  let nutrientTarget = 'iron_mg';
  let escalationNote = 'Mild dietary support may complement clinician-guided follow-up.';

  if (labLower.includes('ferritin') || labLower.includes('hb') || labLower.includes('hemoglobin')) {
    nutrientTarget = 'iron_mg';
    escalationNote = 'Food-first heme/non-heme iron + vitamin C pairing supports maintenance; overt iron-deficiency anemia requires targeted clinician-prescribed iron therapy and etiology workup.';
  } else if (labLower.includes('b12')) {
    nutrientTarget = 'vitamin_b12_mcg';
    escalationNote = 'Fish, egg, and dairy supply dietary B12; metformin-associated or pernicious/severe B12 deficiency (<200 pg/mL) requires therapeutic B12 supplementation.';
  } else if (labLower.includes('potassium') || labLower.includes('egfr')) {
    nutrientTarget = 'potassium_mg';
    escalationNote = 'Hyperkalemia or reduced eGFR requires KDIGO-aligned electrolyte moderation and potassium-leaching counseling rather than potassium-dense foods.';
  } else if (labLower.includes('hba1c') || labLower.includes('glucose') || labLower.includes('homa')) {
    nutrientTarget = 'fiber_g';
    escalationNote = 'Viscous legume/vegetable fiber and controlled carbohydrate portions support glycemic control alongside medical therapy.';
  }

  const sub = queryR8KnowledgeNetwork({
    mode: 'nutrient_to_foods',
    target_id: nutrientTarget,
    patient: params.patient,
    foods,
    limit,
  });
  return {
    ...sub,
    query_type: 'lab_to_food_first_review',
    food_first_vs_escalation_note_en: escalationNote,
  };
}

export interface R8CombinedDietSupplementResult {
  food_nutrients: Record<string, { amount: number; unit: string; is_incomplete: boolean }>;
  supplement_exposure: R7SupplementExposureSummary;
  combined_advisories_en: string[];
  magnesium_ul_separation_note_en: string;
}

/**
 * Evaluates food-derived nutrients alongside R7 supplement exposure WITHOUT
 * erroneously adding dietary food magnesium against the NIH supplemental-only 350 mg UL.
 */
export function evaluateCombinedDietSupplementExposure(
  dietItems: Array<{ food: FoodItem; raw_weight_g: number }>,
  supplements: SupplementProtocolItem[],
  patient: Partial<PatientProfile>,
  labSummary?: R7LabIntelligenceSummary
): R8CombinedDietSupplementResult {
  const foodTotals = aggregateFoodNutrients(
    dietItems.map(d => ({ food: d.food, raw_edible_g: d.raw_weight_g })),
    [
      'iron',
      'calcium',
      'magnesium',
      'zinc',
      'folate',
      'vitamin_b12',
      'vitamin_c',
      'potassium',
      'sodium',
    ]
  );

  const supplementExposure = calculateR7SupplementExposure({
    supplements,
    patient,
    labSummary,
  });

  const combinedAdvisories: string[] = [];
  const foodMg = foodTotals['magnesium']?.known_total ?? 0;
  const suppMg = supplementExposure.exposures_by_nutrient['magnesium']?.combined_daily ?? 0;

  if (foodMg > 0) {
    combinedAdvisories.push(
      `Food-derived magnesium (${Math.round(foodMg)} mg/day) is tracked separately from supplemental magnesium (${Math.round(suppMg)} mg/day) because the 350 mg/day UL applies only to supplemental/pharmacologic magnesium.`
    );
  }

  const popProfile = buildR5PopulationProfile(patient);
  const zincUl = resolveLifeStageUpperLimit('zinc', popProfile);
  const foodZinc = foodTotals['zinc']?.known_total ?? 0;
  const suppZinc = supplementExposure.exposures_by_nutrient['zinc']?.combined_daily ?? 0;
  if (zincUl?.ul && foodZinc + suppZinc > zincUl.ul) {
    combinedAdvisories.push(
      `Combined food (${Math.round(foodZinc)} mg) + supplemental (${Math.round(suppZinc)} mg) zinc exceeds ${zincUl.ul} mg/day ${zincUl.stageLabel} UL.`
    );
  }

  const ironUl = resolveLifeStageUpperLimit('iron', popProfile);
  const foodIron = foodTotals['iron']?.known_total ?? 0;
  const suppIron = supplementExposure.exposures_by_nutrient['iron']?.combined_daily ?? 0;
  if (ironUl?.ul && foodIron + suppIron > ironUl.ul) {
    combinedAdvisories.push(
      `Combined food (${Math.round(foodIron)} mg) + supplemental (${Math.round(suppIron)} mg) iron exceeds ${ironUl.ul} mg/day ${ironUl.stageLabel} UL.`
    );
  }

  const foodNutrientsSummary: Record<string, { amount: number; unit: string; is_incomplete: boolean }> = {};
  for (const [k, v] of Object.entries(foodTotals)) {
    foodNutrientsSummary[k] = {
      amount: v.known_total,
      unit: v.unit,
      is_incomplete: v.is_incomplete,
    };
  }

  return {
    food_nutrients: foodNutrientsSummary,
    supplement_exposure: supplementExposure,
    combined_advisories_en: combinedAdvisories,
    magnesium_ul_separation_note_en:
      'NIH ODS Tolerable Upper Intake Level (350 mg/day) for magnesium applies strictly to dietary supplements and medications, never intrinsic food magnesium.',
  };
}
