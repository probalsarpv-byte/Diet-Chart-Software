/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Phase R7-C: Medication–Nutrient–Laboratory Intelligence Engine
 *
 * Maps all 21 MedicationNutritionRule entries with explicit canonical nutrient IDs,
 * exact route applicability, relevant lab markers, evidence grades/versions, and
 * laboratory-qualified intervention state resolution.
 */

import {
  DrugNutrientFinding,
  MedicationNutritionRule,
  R5MedicationRecord
} from '../../types/r5Systems';
import { R7LabIntelligenceSummary } from '../../types/r7Laboratory';

export interface R7DniRuleMetadata {
  rule_id: string;
  affected_nutrient_ids: string[];
  affected_nutrient_labels: string[];
  interaction_mechanism: string;
  route_applicability: string[];
  excluded_routes?: string[];
  timing_requirements?: string;
  relevant_lab_markers: string[];
  evidence_grade: 'A' | 'B' | 'C' | 'D';
  evidence_id: string;
  rule_version: string;
}

export const R7_DNI_RULE_METADATA: Record<string, R7DniRuleMetadata> = {
  RULE_INSULIN_CARB_TIMING: {
    rule_id: 'RULE_INSULIN_CARB_TIMING',
    affected_nutrient_ids: ['carbohydrate_timing'],
    affected_nutrient_labels: ['Carbohydrate Timing', 'Rapid Hypoglycemia Rescue'],
    interaction_mechanism: 'Exogenous insulin acts independently of absorbed glucose; uncompensated meal skipping risks severe hypoglycemia.',
    route_applicability: ['subcutaneous', 'intravenous', 'all'],
    relevant_lab_markers: ['fasting_glucose', 'pp_glucose', 'hba1c'],
    evidence_grade: 'A',
    evidence_id: 'ADA_STANDARDS_2026',
    rule_version: 'r7.1'
  },
  RULE_SULFONYLUREA_FASTING: {
    rule_id: 'RULE_SULFONYLUREA_FASTING',
    affected_nutrient_ids: ['carbohydrate_timing'],
    affected_nutrient_labels: ['Carbohydrate Timing', 'Meal Regularity'],
    interaction_mechanism: 'Glucose-independent pancreatic beta-cell K-ATP channel blockade causes persistent insulin release.',
    route_applicability: ['oral'],
    relevant_lab_markers: ['fasting_glucose', 'hba1c', 'egfr'],
    evidence_grade: 'A',
    evidence_id: 'ADA_STANDARDS_2026',
    rule_version: 'r7.1'
  },
  RULE_METFORMIN_B12_DEPLETION: {
    rule_id: 'RULE_METFORMIN_B12_DEPLETION',
    affected_nutrient_ids: ['vitamin_b12', 'folate'],
    affected_nutrient_labels: ['Vitamin B12', 'Folic Acid'],
    interaction_mechanism: 'Antagonism of calcium-dependent intrinsic factor-B12 receptor endocytosis in the terminal ileum.',
    route_applicability: ['oral'],
    timing_requirements: 'Take Metformin with meals; monitor serum Vitamin B12 / MCV periodically.',
    relevant_lab_markers: ['vitamin_b12', 'homocysteine', 'mcv', 'hemoglobin'],
    evidence_grade: 'A',
    evidence_id: 'MHRA_METFORMIN_B12_2022',
    rule_version: 'r7.1'
  },
  RULE_SGLT2_HYDRATION_FASTING: {
    rule_id: 'RULE_SGLT2_HYDRATION_FASTING',
    affected_nutrient_ids: ['fluid', 'carbohydrate_timing'],
    affected_nutrient_labels: ['Fluid', 'Carbohydrate Floor'],
    interaction_mechanism: 'Osmotic diuresis and suppressed insulin-to-glucagon ratio increase euglycemic ketoacidosis & dehydration risk during prolonged fasting/keto.',
    route_applicability: ['oral'],
    relevant_lab_markers: ['egfr', 'creatinine', 'fasting_glucose'],
    evidence_grade: 'A',
    evidence_id: 'ADA_STANDARDS_2026',
    rule_version: 'r7.1'
  },
  RULE_LEVOTHYROXINE_MINERAL_TIMING: {
    rule_id: 'RULE_LEVOTHYROXINE_MINERAL_TIMING',
    affected_nutrient_ids: ['calcium', 'iron', 'magnesium', 'zinc'],
    affected_nutrient_labels: ['Calcium', 'Iron', 'Magnesium', 'Zinc'],
    interaction_mechanism: 'Intraluminal chelation and gastric pH changes reduce oral levothyroxine absorption by 20-40%.',
    route_applicability: ['oral'],
    timing_requirements: 'Fasting waking administration >=4.0 hours apart from Ca, Fe, Mg, Zn, or soy.',
    relevant_lab_markers: ['tsh', 'free_t4', 'free_t3'],
    evidence_grade: 'A',
    evidence_id: 'DAILYMED_SPL_CURRENT',
    rule_version: 'r7.1'
  },
  RULE_CORTICOSTEROID_METABOLIC: {
    rule_id: 'RULE_CORTICOSTEROID_METABOLIC',
    affected_nutrient_ids: ['calcium', 'vitamin_d3', 'potassium'],
    affected_nutrient_labels: ['Calcium', 'Vitamin D3', 'Potassium'],
    interaction_mechanism: 'Systemic glucocorticoids suppress bone formation, impair calcium retention, and worsen postprandial insulin resistance.',
    route_applicability: ['oral', 'intravenous', 'intramuscular', 'systemic'],
    excluded_routes: ['inhal', 'topical', 'nasal', 'ophthalmic', 'otic', 'cream', 'ointment'],
    relevant_lab_markers: ['vitamin_d_25oh', 'calcium', 'fasting_glucose', 'hba1c', 'serum_potassium'],
    evidence_grade: 'A',
    evidence_id: 'ADA_STANDARDS_2026',
    rule_version: 'r7.1'
  },
  RULE_WARFARIN_VITAMIN_K: {
    rule_id: 'RULE_WARFARIN_VITAMIN_K',
    affected_nutrient_ids: ['vitamin_k'],
    affected_nutrient_labels: ['Vitamin K', 'Vitamin E Caution'],
    interaction_mechanism: 'VKORC1 antagonism makes anticoagulation sensitive to day-to-day swings in dietary phylloquinone.',
    route_applicability: ['oral'],
    timing_requirements: 'Maintain steady daily Vitamin K intake (do not eliminate greens erratically).',
    relevant_lab_markers: ['hemoglobin', 'platelets'],
    evidence_grade: 'A',
    evidence_id: 'NIH_ODS_UL_GENERAL_2024',
    rule_version: 'r7.1'
  },
  RULE_ACEI_ARB_POTASSIUM: {
    rule_id: 'RULE_ACEI_ARB_POTASSIUM',
    affected_nutrient_ids: ['potassium'],
    affected_nutrient_labels: ['Potassium'],
    interaction_mechanism: 'RAAS blockade lowers aldosterone, reducing renal collecting duct potassium excretion.',
    route_applicability: ['oral'],
    relevant_lab_markers: ['potassium', 'creatinine', 'reported_egfr'],
    evidence_grade: 'A',
    evidence_id: 'KDIGO_CKD_2024',
    rule_version: 'r7.1'
  },
  RULE_K_SPARING_DIURETIC: {
    rule_id: 'RULE_K_SPARING_DIURETIC',
    affected_nutrient_ids: ['potassium'],
    affected_nutrient_labels: ['Potassium'],
    interaction_mechanism: 'Mineralocorticoid receptor / ENaC inhibition blocks distal tubular potassium wasting, creating severe hyperkalemia risk.',
    route_applicability: ['oral'],
    relevant_lab_markers: ['potassium', 'creatinine', 'reported_egfr'],
    evidence_grade: 'A',
    evidence_id: 'KDIGO_CKD_2024',
    rule_version: 'r7.1'
  },
  RULE_LOOP_THIAZIDE_ELECTROLYTE: {
    rule_id: 'RULE_LOOP_THIAZIDE_ELECTROLYTE',
    affected_nutrient_ids: ['potassium', 'magnesium', 'thiamine_b1', 'sodium'],
    affected_nutrient_labels: ['Potassium', 'Magnesium', 'Thiamine (B1)', 'Sodium'],
    interaction_mechanism: 'Increased distal tubular Na delivery accelerates K+, Mg2+, and thiamine urinary losses.',
    route_applicability: ['oral', 'intravenous', 'all'],
    relevant_lab_markers: ['potassium', 'magnesium', 'sodium', 'reported_egfr'],
    evidence_grade: 'A',
    evidence_id: 'KDIGO_CKD_2024',
    rule_version: 'r7.1'
  },
  RULE_STATIN_COQ10: {
    rule_id: 'RULE_STATIN_COQ10',
    affected_nutrient_ids: ['coq10'],
    affected_nutrient_labels: ['Coenzyme Q10'],
    interaction_mechanism: 'HMG-CoA reductase inhibition lowers mevalonate pathway ubiquinone intermediates; clinical trial evidence for routine primary CoQ10 prophylaxis remains mixed.',
    route_applicability: ['oral'],
    relevant_lab_markers: ['total_cholesterol', 'ldl_c', 'alt'],
    evidence_grade: 'C',
    evidence_id: 'AHA_ACC_LIPIDS_2018',
    rule_version: 'r7.1'
  },
  RULE_MAOI_TYRAMINE_RESTRICTION: {
    rule_id: 'RULE_MAOI_TYRAMINE_RESTRICTION',
    affected_nutrient_ids: ['tyramine'],
    affected_nutrient_labels: ['Tyramine'],
    interaction_mechanism: 'Irreversible intestinal & hepatic MAO-A inhibition allows dietary tyramine pressor catecholamine release -> hypertensive crisis.',
    route_applicability: ['oral', 'transdermal', 'all'],
    relevant_lab_markers: [],
    evidence_grade: 'A',
    evidence_id: 'DAILYMED_SPL_CURRENT',
    rule_version: 'r7.1'
  },
  RULE_LITHIUM_FLUID_SODIUM: {
    rule_id: 'RULE_LITHIUM_FLUID_SODIUM',
    affected_nutrient_ids: ['sodium', 'fluid'],
    affected_nutrient_labels: ['Sodium', 'Fluid'],
    interaction_mechanism: 'Proximal renal tubule co-reabsorbs lithium alongside sodium; sodium depletion or dehydration triggers toxic lithium retention.',
    route_applicability: ['oral'],
    relevant_lab_markers: ['sodium', 'creatinine', 'egfr', 'tsh'],
    evidence_grade: 'A',
    evidence_id: 'DAILYMED_SPL_CURRENT',
    rule_version: 'r7.1'
  },
  RULE_ANTIPSYCHOTIC_METABOLIC: {
    rule_id: 'RULE_ANTIPSYCHOTIC_METABOLIC',
    affected_nutrient_ids: ['glycemic_load', 'omega_3'],
    affected_nutrient_labels: ['Glycemic Load', 'Omega-3 Fatty Acids'],
    interaction_mechanism: 'H1 / 5-HT2C receptor antagonism increases insulin resistance, visceral adiposity, and hypertriglyceridemia.',
    route_applicability: ['oral', 'intramuscular', 'all'],
    relevant_lab_markers: ['fasting_glucose', 'hba1c', 'triglycerides', 'ldl_c'],
    evidence_grade: 'A',
    evidence_id: 'ADA_STANDARDS_2026',
    rule_version: 'r7.1'
  },
  RULE_ANTIEPILEPTIC_MICRONUTRIENT: {
    rule_id: 'RULE_ANTIEPILEPTIC_MICRONUTRIENT',
    affected_nutrient_ids: ['vitamin_d3', 'folate', 'calcium'],
    affected_nutrient_labels: ['Vitamin D3', 'Folic Acid', 'Calcium'],
    interaction_mechanism: 'CYP450 induction accelerates 25(OH)D catabolism and alters folate/carnitine metabolism.',
    route_applicability: ['oral', 'intravenous', 'all'],
    relevant_lab_markers: ['vitamin_d_25oh', 'folate', 'calcium', 'alt'],
    evidence_grade: 'A',
    evidence_id: 'ENDOCRINE_VITD_2024',
    rule_version: 'r7.1'
  },
  RULE_STIMULANT_APPETITE_GROWTH: {
    rule_id: 'RULE_STIMULANT_APPETITE_GROWTH',
    affected_nutrient_ids: ['energy_intake', 'protein'],
    affected_nutrient_labels: ['Energy Density', 'Nutrient-Dense Protein Breakfast'],
    interaction_mechanism: 'Sympathomimetic anorexia peaks midday, blunting energy intake during critical pediatric/adolescent growth windows.',
    route_applicability: ['oral', 'transdermal', 'all'],
    relevant_lab_markers: ['albumin', 'ferritin', 'hemoglobin'],
    evidence_grade: 'B',
    evidence_id: 'DAILYMED_SPL_CURRENT',
    rule_version: 'r7.1'
  },
  RULE_PPI_MICRONUTRIENT_MALABSORPTION: {
    rule_id: 'RULE_PPI_MICRONUTRIENT_MALABSORPTION',
    affected_nutrient_ids: ['magnesium', 'vitamin_b12', 'iron', 'calcium'],
    affected_nutrient_labels: ['Magnesium', 'Vitamin B12', 'Iron', 'Calcium'],
    interaction_mechanism: 'Chronic hypochlorhydria reduces TRPM6/7 magnesium absorption, dietary B12 release, ferric iron reduction, and calcium carbonate solubility.',
    route_applicability: ['oral', 'intravenous', 'all'],
    relevant_lab_markers: ['magnesium', 'vitamin_b12', 'ferritin', 'serum_iron', 'calcium'],
    evidence_grade: 'B',
    evidence_id: 'NIH_ODS_UL_MAGNESIUM_2024',
    rule_version: 'r7.1'
  },
  RULE_FLUOROQUINOLONE_MINERAL_CHELATION: {
    rule_id: 'RULE_FLUOROQUINOLONE_MINERAL_CHELATION',
    affected_nutrient_ids: ['calcium', 'iron', 'magnesium', 'zinc'],
    affected_nutrient_labels: ['Calcium', 'Iron', 'Magnesium', 'Zinc'],
    interaction_mechanism: 'Divalent and trivalent cations chelate oral fluoroquinolones and tetracyclines, reducing antibiotic AUC by >50%.',
    route_applicability: ['oral'],
    excluded_routes: ['iv', 'intravenous', 'topical', 'ophthalmic', 'otic'],
    timing_requirements: 'Separate Ca, Fe, Mg, Zn, and dairy by 2-4 hours from oral dose.',
    relevant_lab_markers: ['creatinine', 'egfr'],
    evidence_grade: 'A',
    evidence_id: 'DAILYMED_SPL_CURRENT',
    rule_version: 'r7.1'
  },
  RULE_ISONIAZID_B6_NEUROPATHY: {
    rule_id: 'RULE_ISONIAZID_B6_NEUROPATHY',
    affected_nutrient_ids: ['pyridoxine_b6'],
    affected_nutrient_labels: ['Vitamin B6'],
    interaction_mechanism: 'Isoniazid forms inactive hydrazone complexes with pyridoxal-5-phosphate causing functional B6 deficiency neuropathy.',
    route_applicability: ['oral', 'all'],
    relevant_lab_markers: ['alt', 'ast', 'total_bilirubin'],
    evidence_grade: 'A',
    evidence_id: 'WHO_FERRITIN_2020',
    rule_version: 'r7.1'
  },
  RULE_METHOTREXATE_FOLATE: {
    rule_id: 'RULE_METHOTREXATE_FOLATE',
    affected_nutrient_ids: ['folate'],
    affected_nutrient_labels: ['Folic Acid'],
    interaction_mechanism: 'Competitive DHFR blockade depletes intracellular tetrahydrofolate pools, driving mucositis & hepatotoxicity unless rescued per prescriber protocol.',
    route_applicability: ['oral', 'subcutaneous', 'intramuscular', 'all'],
    relevant_lab_markers: ['folate', 'alt', 'ast', 'mcv', 'cbc_wbc'],
    evidence_grade: 'A',
    evidence_id: 'DAILYMED_SPL_CURRENT',
    rule_version: 'r7.1'
  },
  RULE_BISPHOSPHONATE_POSTURE: {
    rule_id: 'RULE_BISPHOSPHONATE_POSTURE',
    affected_nutrient_ids: ['calcium', 'vitamin_d3', 'magnesium', 'iron'],
    affected_nutrient_labels: ['Calcium', 'Iron', 'Magnesium', 'Vitamin D3'],
    interaction_mechanism: 'Oral bisphosphonate absorption (<1%) is abolished by food/minerals and requires esophageal transit clearance.',
    route_applicability: ['oral'],
    excluded_routes: ['iv', 'intravenous', 'injection', 'infusion', 'parenteral'],
    timing_requirements: 'Take oral tablet upright with plain water >=30-60 min before food, calcium, iron, or magnesium.',
    relevant_lab_markers: ['calcium', 'vitamin_d_25oh', 'creatinine', 'egfr'],
    evidence_grade: 'A',
    evidence_id: 'DAILYMED_SPL_CURRENT',
    rule_version: 'r7.1'
  }
};

export function inferNutrientIdsAndLabelsFromRule(rule: MedicationNutritionRule): {
  ids: string[];
  labels: string[];
} {
  if (rule.affected_nutrient_ids && rule.affected_nutrient_ids.length > 0) {
    const meta = R7_DNI_RULE_METADATA[rule.rule_id];
    if (meta) {
      return { ids: meta.affected_nutrient_ids, labels: meta.affected_nutrient_labels };
    }
    return {
      ids: rule.affected_nutrient_ids,
      labels: rule.affected_nutrient_ids.map(id =>
        id
          .split('_')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      )
    };
  }
  const meta = R7_DNI_RULE_METADATA[rule.rule_id];
  if (meta) {
    return { ids: meta.affected_nutrient_ids, labels: meta.affected_nutrient_labels };
  }
  return {
    ids: ['general_monitoring'],
    labels: [rule.title_en]
  };
}

export function isRouteApplicableForRule(
  med: R5MedicationRecord,
  ruleId: string,
  rule?: MedicationNutritionRule
): boolean {
  const route = (med.route || 'oral').toLowerCase().trim();
  const formulation = (med.formulation || '').toLowerCase().trim();
  const combinedRoute = `${route} ${formulation}`;
  const meta = R7_DNI_RULE_METADATA[ruleId];

  const excluded = meta?.excluded_routes || [];
  if (excluded.some(ex => combinedRoute.includes(ex))) {
    return false;
  }

  const allowed = rule?.route_applicability || meta?.route_applicability;
  if (!allowed || allowed.includes('all')) return true;

  if (route === 'unknown' || route === '') return true;
  return allowed.some(r => combinedRoute.includes(r.toLowerCase()));
}

export function evaluateLabQualifiedDniState(
  nutrientIds: string[],
  relevantLabMarkers: string[],
  ruleSeverity: DrugNutrientFinding['severity'],
  medStatus: R5MedicationRecord['status'],
  labSummary?: R7LabIntelligenceSummary
): {
  relevant_labs_status: DrugNutrientFinding['relevant_labs_status'];
  intervention_state: DrugNutrientFinding['intervention_state'];
  monitoring_indication: string;
} {
  if (medStatus === 'discontinued' || medStatus === 'historical' || medStatus === 'completed' || medStatus === 'held') {
    return {
      relevant_labs_status: 'not_applicable',
      intervention_state: 'historical_only',
      monitoring_indication: `Medication status is '${medStatus}'; excluded from active administration guidance.`
    };
  }

  if (!labSummary || relevantLabMarkers.length === 0) {
    return {
      relevant_labs_status: relevantLabMarkers.length === 0 ? 'not_applicable' : 'missing',
      intervention_state:
        ruleSeverity === 'critical_hard_stop' ? 'contraindicated' : 'monitoring_consideration',
      monitoring_indication:
        relevantLabMarkers.length > 0
          ? `Baseline ${relevantLabMarkers.join('/')} not documented; treat as monitoring consideration until lab verification.`
          : 'Clinical monitoring / spacing consideration.'
    };
  }

  let hasLowOrBorderline = false;
  let hasElevated = false;
  let hasObservedLab = false;

  for (const markerId of relevantLabMarkers) {
    const evalItem = labSummary.evaluations.find(e => e.observation.canonical_marker_id === markerId);
    if (!evalItem) continue;
    hasObservedLab = true;
    const status = evalItem.reference_status;
    if (status === 'below_reference_interval' || status === 'critical_low') {
      hasLowOrBorderline = true;
    } else if (status === 'above_reference_interval' || status === 'critical_high') {
      hasElevated = true;
    } else if (
      evalItem.exploratory_functional_status === 'outside_exploratory_zone' ||
      evalItem.clinical_decision_status === 'meets_clinical_decision_threshold'
    ) {
      hasLowOrBorderline = true;
    }
  }

  if (!hasObservedLab) {
    return {
      relevant_labs_status: 'missing',
      intervention_state:
        ruleSeverity === 'critical_hard_stop' ? 'contraindicated' : 'monitoring_consideration',
      monitoring_indication: `Relevant labs (${relevantLabMarkers.join(', ')}) not yet available. Avoid diagnosing deficiency without laboratory confirmation.`
    };
  }

  if (nutrientIds.includes('potassium') && hasElevated) {
    return {
      relevant_labs_status: 'elevated',
      intervention_state: 'contraindicated',
      monitoring_indication: 'Elevated serum potassium documented with K-retaining therapy — potassium supplementation contraindicated.'
    };
  }

  if (hasLowOrBorderline || hasElevated) {
    return {
      relevant_labs_status: hasLowOrBorderline ? 'borderline_or_low' : 'elevated',
      intervention_state: 'lab_supported_abnormality',
      monitoring_indication: `Objective laboratory abnormality (${relevantLabMarkers.join(', ')}) supports targeted review and candidate intervention.`
    };
  }

  return {
    relevant_labs_status: 'normal',
    intervention_state: 'monitoring_consideration',
    monitoring_indication: `Relevant labs (${relevantLabMarkers.join(', ')}) are within reference limits; maintain periodic monitoring rather than treating as deficiency.`
  };
}

export function extractMetforminDailyMgEstimate(meds: R5MedicationRecord[]): number | undefined {
  let maxDailyMg = 0;
  for (const med of meds) {
    if (med.status === 'discontinued' || med.status === 'historical' || med.status === 'completed' || med.status === 'held') {
      continue;
    }
    const text = `${med.generic_name || ''} ${med.brand_name || ''}`.toLowerCase();
    if (!text.includes('metformin')) continue;
    const rawDose = med.prescribed_dose || med.product_strength || '';
    const m = rawDose.match(/(\d+(?:\.\d+)?)\s*mg/i);
    if (!m) continue;
    const singleMg = parseFloat(m[1]);
    const freq = (med.frequency || '').toLowerCase();
    let mult = 1;
    if (freq.includes('bid') || freq.includes('twice') || freq.includes('1+0+1')) mult = 2;
    else if (freq.includes('tid') || freq.includes('thrice') || freq.includes('1+1+1')) mult = 3;
    maxDailyMg += singleMg * mult;
  }
  return maxDailyMg > 0 ? maxDailyMg : undefined;
}
