/**
 * SHUDDHO Phase R5 — Systems Intelligence Comprehensive Unit Test Suite
 * 
 * Verifies:
 * 1. Life-Stage First Population Engine (Infant, Child, Adolescent, Adult, Geriatric, Pregnancy, Lactation)
 * 2. 16+ Clinical Pathways Registry & Search Service
 * 3. Smart Medication Search across Bangladesh Corpus with Typo Tolerance & Combo Detection
 * 4. Insulin-Aware Nutrition Regimen & Hypoglycemia Safeguards (Zero Autonomous ICR/ISF)
 * 5. Comprehensive Evidence-Governed Medication-Nutrition Interaction Rules (including Psychiatric)
 * 6. 7-Domain Functional Medicine Matrix & ATM Framework
 * 7. Deterministic Systems Network Graph & Hub Centrality
 * 8. Multimorbidity Conflict Priority Resolution Layer (9-step life-safety hierarchy)
 * 9. R5 to R4 Integration Adapter (Zero in-place mutation of approved plans)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  buildR5PopulationProfile,
  mapR5ToLegacyPopulationGroup
} from '../src/engine/r5PopulationEngine';

import {
  CLINICAL_PATHWAY_REGISTRY,
  searchClinicalPathways,
  mapConditionsToPathways,
  evaluatePathwaySelectionState
} from '../src/engine/r5PathwayRegistry';

import {
  searchSmartMedications,
  createManualMedicationRecord,
  identifyCombinationDrug
} from '../src/engine/r5MedicationSearchEngine';

import {
  analyzeInsulinRegimen
} from '../src/engine/r5InsulinEngine';

import {
  MEDICATION_NUTRITION_RULES,
  evaluateMedicationNutritionInteractions
} from '../src/engine/r5MedicationNutritionEngine';

import {
  evaluateFunctionalMatrix,
  buildSystemsNetworkGraph,
  FUNCTIONAL_DOMAINS_META,
  adaptAssessmentEvidenceToMatrixInput
} from '../src/engine/r5SystemsNetworkEngine';

import {
  resolveMultimorbidityConflicts
} from '../src/engine/r5MultimorbidityEngine';

import {
  adaptR5ContextToR4
} from '../src/engine/r5ToR4Adapter';

import {
  validateReportReleaseEligibility
} from '../src/engine/reports/dualReportEngine';

import { R5MedicationRecord, R5ClinicalContextPayload } from '../src/types/r5Systems';

describe('Phase R5 — Systems Intelligence & Clinical Engines', () => {

  // ── 1. Life-Stage First Population Engine ──────────────────────────
  describe('1. Life-Stage First Population Model', () => {
    it('correctly classifies infant (biological age 0) without treating it as unentered', () => {
      const profile = buildR5PopulationProfile({ age: 0 });
      assert.strictEqual(profile.life_stage, 'infant');
      assert.strictEqual(profile.age, 0);
      assert.strictEqual(profile.is_age_unentered, false);
      assert.strictEqual(mapR5ToLegacyPopulationGroup(profile), 'pediatric');
    });

    it('handles truly unentered age safely as not_yet_assessed', () => {
      const profile = buildR5PopulationProfile({});
      assert.strictEqual(profile.life_stage, 'not_yet_assessed');
      assert.strictEqual(profile.age, undefined);
      assert.strictEqual(profile.is_age_unentered, true);
    });

    it('classifies child (age 6) and adolescent (age 15)', () => {
      const child = buildR5PopulationProfile({ age: 6 });
      assert.strictEqual(child.life_stage, 'child');
      assert.strictEqual(mapR5ToLegacyPopulationGroup(child), 'pediatric');

      const teen = buildR5PopulationProfile({ age: 15 });
      assert.strictEqual(teen.life_stage, 'adolescent');
      assert.strictEqual(mapR5ToLegacyPopulationGroup(teen), 'adolescent');
    });

    it('classifies adult (age 35) and older adult (age 72)', () => {
      const adult = buildR5PopulationProfile({ age: 35 });
      assert.strictEqual(adult.life_stage, 'adult');
      assert.strictEqual(mapR5ToLegacyPopulationGroup(adult), 'adult_standard');

      const senior = buildR5PopulationProfile({ age: 72 });
      assert.strictEqual(senior.life_stage, 'older_adult');
      assert.strictEqual(mapR5ToLegacyPopulationGroup(senior), 'geriatric');
    });

    it('detects pregnancy trimester and high risk flags', () => {
      const pregnant = buildR5PopulationProfile({
        age: 28,
        population_group: 'pregnancy',
        selected_conditions: ['pregnancy_second_trimester' as any]
      });
      assert.strictEqual(pregnant.pregnancy?.active, true);
      assert.strictEqual(pregnant.pregnancy?.trimester, 2);
      assert.strictEqual(mapR5ToLegacyPopulationGroup(pregnant), 'pregnancy');
    });

    it('detects lactation modifier with stage', () => {
      const lactating = buildR5PopulationProfile({
        age: 30,
        population_group: 'lactation',
        selected_conditions: ['lactation_7_12m' as any]
      });
      assert.strictEqual(lactating.lactation?.active, true);
      assert.strictEqual(lactating.lactation?.stage, '>6m');
    });

    it('flags clinical contexts: oncology, renal disease, and malnutrition risk from BMI', () => {
      const complexPatient = buildR5PopulationProfile({
        age: 55,
        weight_kg: 42,
        height_cm: 160, // BMI = 16.4 (< 18.5)
        confirmed_conditions: ['Renal failure CKD stage 3', 'Gastric oncology']
      });
      assert.ok(complexPatient.clinical_contexts.includes('oncology'));
      assert.ok(complexPatient.clinical_contexts.includes('renal_disease'));
      assert.ok(complexPatient.clinical_contexts.includes('malnutrition_risk'));
    });
  });

  // ── 2. Clinical Pathways Registry ──────────────────────────────────
  describe('2. Clinical Pathways Registry & Search', () => {
    it('contains at least 16 comprehensive clinical pathways', () => {
      assert.ok(CLINICAL_PATHWAY_REGISTRY.length >= 16);
    });

    it('searches clinical pathways by English and Bengali terms', () => {
      const diabetesRes = searchClinicalPathways('diabetes');
      assert.ok(diabetesRes.length > 0);
      assert.strictEqual(diabetesRes[0].id, 'metabolic_endocrine');

      const kidneyRes = searchClinicalPathways('কিডনি');
      assert.ok(kidneyRes.length > 0);
      assert.strictEqual(kidneyRes[0].id, 'renal_electrolyte');
    });

    it('maps legacy clinical condition IDs to pathways', () => {
      const mapped = mapConditionsToPathways(['t2d_ir', 'fatty_liver']);
      assert.ok(mapped.includes('metabolic_endocrine'));
      assert.ok(mapped.includes('gastrointestinal_hepatobiliary'));
    });

    it('correctly derives NOT_ASSESSED, NO_KNOWN_PATHWAY, and PATHWAYS_SELECTED states', () => {
      const unassessed = evaluatePathwaySelectionState([]);
      assert.strictEqual(unassessed.status, 'NOT_ASSESSED');

      const healthy = evaluatePathwaySelectionState([], true);
      assert.strictEqual(healthy.status, 'NO_KNOWN_PATHWAY');
      assert.strictEqual(healthy.selected_pathways.length, 0);

      const active = evaluatePathwaySelectionState(['metabolic_endocrine', 'cardiovascular']);
      assert.strictEqual(active.status, 'PATHWAYS_SELECTED');
      assert.strictEqual(active.selected_pathways.length, 2);
    });
  });

  // ── 3. Smart Medication Search & Typo Tolerance ─────────────────────
  describe('3. Smart Medication Search Engine', () => {
    it('finds exact generic matches in Bangladesh pharmaceutical corpus', () => {
      const res = searchSmartMedications('metformin');
      assert.ok(res.length > 0);
      assert.ok(res[0].generic_name.toLowerCase().includes('metformin'));
      assert.strictEqual(res[0].rule_coverage, 'fully_covered');
    });

    it('identifies brand names and manufacturers', () => {
      const res = searchSmartMedications('Napa');
      assert.ok(res.length > 0);
      assert.ok(res.some(r => (r.brand_name || '').toLowerCase().includes('napa')));
    });

    it('handles Levenshtein distance typo suggestions', () => {
      const typoRes = searchSmartMedications('metforrmin'); // extra r
      assert.ok(typoRes.length > 0);
      assert.ok(typoRes.some(r => r.generic_name.toLowerCase().includes('metformin')));
    });

    it('detects combination drugs and splits active ingredients', () => {
      const combo = identifyCombinationDrug('Metformin + Vildagliptin');
      assert.strictEqual(combo.is_combination, true);
      assert.strictEqual(combo.individual_actives.length, 2);
      assert.ok(combo.individual_actives.includes('Metformin'));
      assert.ok(combo.individual_actives.includes('Vildagliptin'));
    });

    it('creates manual medication records with explicit verification flag', () => {
      const manual = createManualMedicationRecord('Novel Investigational Compound X', '10 mg', 'Once Daily');
      assert.strictEqual(manual.generic_name, 'Novel Investigational Compound X');
      assert.strictEqual(manual.status, 'active');
      assert.strictEqual(manual.is_timing_unknown, true);
      assert.strictEqual(manual.rule_coverage, 'rules_unavailable');
    });
  });

  // ── 4. Insulin-Aware Nutrition Regimen ──────────────────────────────
  describe('4. Insulin Regimen & Hypoglycemia Safeguards', () => {
    it('classifies basal-only regimen and bedtime timing relation', () => {
      const meds: R5MedicationRecord[] = [
        {
          id: 'm1',
          generic_name: 'Insulin Glargine',
          brand_name: 'Lantus',
          prescribed_dose: '20',
          dose_unit: 'units',
          frequency: 'Once Daily at Bedtime',
          route: 'Subcutaneous',
          administration_times: ['22:00'],
          is_timing_unknown: false,
          relationship_to_meals: 'bedtime',
          is_prn: false,
          status: 'active',
          verification_status: 'clinician_verified',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        }
      ];

      const res = analyzeInsulinRegimen(meds);
      assert.strictEqual(res.has_insulin, true);
      assert.strictEqual(res.regimen_context.regimen_type, 'basal_only');
      assert.strictEqual(res.regimen_context.timing_relative_to_meal, 'bedtime');
      assert.strictEqual(res.regimen_context.fast_acting_carbs_mandate, true);
    });

    it('classifies basal-bolus regimen and prandial bolus timing window', () => {
      const meds: R5MedicationRecord[] = [
        {
          id: 'm1',
          generic_name: 'Insulin Glargine',
          brand_name: 'Lantus',
          prescribed_dose: '24',
          dose_unit: 'units',
          frequency: 'Once Daily',
          route: 'Subcutaneous',
          administration_times: ['22:00'],
          is_timing_unknown: false,
          relationship_to_meals: 'bedtime',
          is_prn: false,
          status: 'active',
          verification_status: 'clinician_verified',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        },
        {
          id: 'm2',
          generic_name: 'Insulin Aspart',
          brand_name: 'NovoRapid',
          prescribed_dose: '6',
          dose_unit: 'units',
          frequency: 'TDS before meals',
          route: 'Subcutaneous',
          administration_times: ['08:00', '13:00', '20:00'],
          is_timing_unknown: false,
          relationship_to_meals: 'before_meal_empty_stomach',
          is_prn: false,
          status: 'active',
          verification_status: 'clinician_verified',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        }
      ];

      const res = analyzeInsulinRegimen(meds, undefined, { icr: 12, isf: 40 });
      assert.strictEqual(res.regimen_context.regimen_type, 'basal_bolus_multiple_daily_injections');
      assert.strictEqual(res.regimen_context.timing_relative_to_meal, 'immediate_pre_meal');
      assert.strictEqual(res.regimen_context.prescriber_icr, 12);
      assert.strictEqual(res.regimen_context.prescriber_isf, 40);
    });

    it('never invents ICR or ISF when not set by prescriber', () => {
      const meds: R5MedicationRecord[] = [
        {
          id: 'm1',
          generic_name: 'Insulin Lispro',
          prescribed_dose: '8',
          dose_unit: 'units',
          frequency: 'With meals',
          route: 'Subcutaneous',
          administration_times: [],
          is_timing_unknown: true,
          relationship_to_meals: 'with_meal',
          is_prn: false,
          status: 'active',
          verification_status: 'clinician_verified',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        }
      ];

      const res = analyzeInsulinRegimen(meds);
      assert.strictEqual(res.regimen_context.prescriber_icr, undefined);
      assert.strictEqual(res.regimen_context.prescriber_isf, undefined);
    });
  });

  // ── 5. Medication-Nutrition Interaction Rules & Psychiatry ──────────
  describe('5. Medication-Nutrition Interactions & Psychiatric Rules', () => {
    it('has extensive rule library covering psychiatric, metabolic, cardio, and GI domains', () => {
      assert.ok(MEDICATION_NUTRITION_RULES.length >= 10);
      assert.ok(MEDICATION_NUTRITION_RULES.some(r => r.drug_category === 'psychiatric_neurological'));
      assert.ok(MEDICATION_NUTRITION_RULES.some(r => r.drug_category === 'cardiovascular_renal'));
      assert.ok(MEDICATION_NUTRITION_RULES.some(r => r.drug_category === 'diabetes_endocrine'));
    });

    it('triggers critical hard stop for MAOI tyramine interaction', () => {
      const meds: R5MedicationRecord[] = [
        {
          id: 'm_maoi',
          generic_name: 'Selegiline',
          prescribed_dose: '5 mg',
          dose_unit: 'mg',
          frequency: 'Once Daily',
          route: 'Oral',
          administration_times: ['08:00'],
          is_timing_unknown: false,
          relationship_to_meals: 'with_meal',
          is_prn: false,
          status: 'active',
          verification_status: 'clinician_verified',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        }
      ];

      const findings = evaluateMedicationNutritionInteractions(meds);
      assert.ok(findings.length > 0);
      const maoiFinding = findings.find(f => f.rule_id === 'RULE_MAOI_TYRAMINE_RESTRICTION');
      assert.ok(maoiFinding);
      assert.strictEqual(maoiFinding.severity, 'critical_hard_stop');
      assert.ok(maoiFinding.affected_nutrients.includes('Tyramine'));
    });

    it('triggers lithium sodium consistency and hydration warning', () => {
      const meds: R5MedicationRecord[] = [
        {
          id: 'm_lithium',
          generic_name: 'Lithium Carbonate',
          brand_name: 'Eskalith',
          prescribed_dose: '300 mg',
          dose_unit: 'mg',
          frequency: 'Twice Daily',
          route: 'Oral',
          administration_times: ['08:00', '20:00'],
          is_timing_unknown: false,
          relationship_to_meals: 'with_meal',
          is_prn: false,
          status: 'active',
          verification_status: 'clinician_verified',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        }
      ];

      const findings = evaluateMedicationNutritionInteractions(meds);
      const lithiumFinding = findings.find(f => f.rule_id === 'RULE_LITHIUM_FLUID_SODIUM');
      assert.ok(lithiumFinding);
      assert.strictEqual(lithiumFinding.severity, 'critical_hard_stop');
      assert.ok(lithiumFinding.affected_nutrients.includes('Sodium'));
    });

    it('triggers metformin vitamin B12 depletion alert', () => {
      const meds: R5MedicationRecord[] = [
        {
          id: 'm_metformin',
          generic_name: 'Metformin',
          prescribed_dose: '500 mg',
          dose_unit: 'mg',
          frequency: 'Twice Daily',
          route: 'Oral',
          administration_times: ['08:00', '20:00'],
          is_timing_unknown: false,
          relationship_to_meals: 'with_meal',
          is_prn: false,
          status: 'active',
          verification_status: 'clinician_verified',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        }
      ];

      const findings = evaluateMedicationNutritionInteractions(meds);
      const b12Finding = findings.find(f => f.rule_id === 'RULE_METFORMIN_B12_DEPLETION');
      assert.ok(b12Finding);
      assert.strictEqual(b12Finding.severity, 'high_clinical_review');
      assert.ok(b12Finding.affected_nutrients.includes('Vitamin B12'));
    });
  });

  // ── 6. 7-Domain Functional Medicine Matrix & ATM ────────────────────
  describe('6. Functional Medicine Matrix & ATM Model', () => {
    it('maps gastrointestinal symptoms to assimilation domain as mediator', () => {
      const matrix = evaluateFunctionalMatrix({
        pathway_ids: ['gastrointestinal_hepatobiliary'],
        symptoms: ['bloating', 'chronic constipation']
      });

      assert.ok(matrix.domains.assimilation.length > 0);
      assert.strictEqual(matrix.domains.assimilation[0].domain, 'assimilation');
      assert.strictEqual(matrix.domains.assimilation[0].atm_type, 'mediator');
      assert.ok(matrix.atm.mediators.some(m => m.id === 'OBS_ASSIM_01'));
    });

    it('maps polypharmacy burden to biotransformation domain as trigger', () => {
      const dummyMeds: R5MedicationRecord[] = Array.from({ length: 5 }, (_, i) => ({
        id: `m_${i}`,
        generic_name: `Drug ${i}`,
        prescribed_dose: '1',
        dose_unit: 'tab',
        frequency: 'Daily',
        route: 'Oral',
        administration_times: ['08:00'],
        is_timing_unknown: false,
        relationship_to_meals: 'with_meal',
        is_prn: false,
        status: 'active',
        verification_status: 'clinician_verified',
        rule_coverage: 'rules_unavailable',
        source: 'clinician_entry'
      }));

      const matrix = evaluateFunctionalMatrix({
        pathway_ids: [],
        medications: dummyMeds
      });

      assert.ok(matrix.domains.biotransformation.length > 0);
      assert.strictEqual(matrix.domains.biotransformation[0].atm_type, 'trigger');
      assert.ok(matrix.atm.triggers.some(t => t.id === 'OBS_BIOTRANS_01'));
    });

    it('maps family history to communication domain as antecedent', () => {
      const matrix = evaluateFunctionalMatrix({
        pathway_ids: [],
        family_history: ['Type 2 Diabetes in father', 'Premature CAD in brother']
      });

      assert.ok(matrix.atm.antecedents.length > 0);
      assert.strictEqual(matrix.atm.antecedents[0].atm_type, 'antecedent');
      assert.ok(matrix.atm.antecedents[0].title_en.includes('Familial'));
    });

    it('consumes 14-domain assessment answers and maps them dynamically to 7 functional matrix domains with ATM classification', () => {
      const matrix = evaluateFunctionalMatrix({
        pathway_ids: [],
        assessment_answers: {
          bloating_frequency: 'frequent',
          joint_stiffness_pain: 'morning_stiffness',
          morning_fatigue_level: 'severe',
          regular_ppi_antacid_use: 'daily',
          blood_pressure_history: 'hypertension',
          sugar_carbohydrate_cravings: 'intense',
          unintentional_weight_loss: 'yes'
        }
      });

      // Assimilation: Bloating -> Mediator, Patient Reported
      assert.ok(matrix.domains.assimilation.some(o => o.confidence_status === 'PATIENT_REPORTED' && o.atm_type === 'mediator'));
      // Defense & Repair: Joint stiffness -> Mediator, Patient Reported
      assert.ok(matrix.domains.defense_repair.some(o => o.confidence_status === 'PATIENT_REPORTED' && o.atm_type === 'mediator'));
      // Energy: Morning fatigue -> Mediator, Patient Reported (Hypothesis, NOT confirmed disease)
      assert.ok(matrix.domains.energy.some(o => o.confidence_status === 'PATIENT_REPORTED' && o.atm_type === 'mediator'));
      // Biotransformation: Regular PPI use -> Trigger, Patient Reported
      assert.ok(matrix.domains.biotransformation.some(o => o.confidence_status === 'PATIENT_REPORTED' && o.atm_type === 'trigger'));
      // Transport: Hypertension history -> Mediator, Patient Reported
      assert.ok(matrix.domains.transport.some(o => o.confidence_status === 'PATIENT_REPORTED' && o.atm_type === 'mediator'));
      // Communication: Sugar cravings / glycemic volatility -> Mediator, Patient Reported
      assert.ok(matrix.domains.communication.some(o => o.confidence_status === 'PATIENT_REPORTED' && o.atm_type === 'mediator'));
      // Structural Integrity: Unintentional weight loss -> Mediator, Patient Reported
      assert.ok(matrix.domains.structural_integrity.some(o => o.confidence_status === 'PATIENT_REPORTED' && o.atm_type === 'mediator'));
    });

    it('never fabricates abnormalities when assessment answers are negative, normal, or absent', () => {
      const matrix = evaluateFunctionalMatrix({
        pathway_ids: [],
        assessment_answers: {
          bloating_frequency: 'none',
          joint_stiffness_pain: 'none',
          morning_fatigue_level: 'none',
          regular_ppi_antacid_use: 'no',
          unintentional_weight_loss: 'no'
        }
      });

      assert.strictEqual(matrix.domains.assimilation.length, 0);
      assert.strictEqual(matrix.domains.defense_repair.length, 0);
      assert.strictEqual(matrix.domains.energy.length, 0);
      assert.strictEqual(matrix.domains.biotransformation.length, 0);
      assert.strictEqual(matrix.domains.structural_integrity.length, 0);
    });

    it('maps objective lab biomarkers into corresponding functional domains with LAB_SUPPORTED confidence', () => {
      const matrix = evaluateFunctionalMatrix({
        pathway_ids: [],
        lab_entries: {
          hba1c: 7.8,
          alt: 65,
          hs_crp: 4.2
        }
      });

      assert.ok(matrix.domains.communication.some(o => o.confidence_status === 'LAB_SUPPORTED'));
      assert.ok(matrix.domains.biotransformation.some(o => o.confidence_status === 'LAB_SUPPORTED'));
      assert.ok(matrix.domains.defense_repair.some(o => o.confidence_status === 'LAB_SUPPORTED'));
    });
  });

  // ── 7. Deterministic Systems Network Graph ──────────────────────────
  describe('7. Systems Network Graph & Hub Centrality', () => {
    it('constructs typed nodes for all 7 functional domains', () => {
      const matrix = evaluateFunctionalMatrix({ pathway_ids: ['metabolic_endocrine'] });
      const graph = buildSystemsNetworkGraph(matrix, ['metabolic_endocrine'], []);

      assert.ok(graph.nodes.length >= 7);
      const domainNodes = graph.nodes.filter(n => n.type === 'FunctionalSystem');
      assert.strictEqual(domainNodes.length, 7);
    });

    it('generates directional cross-system edge between gut barrier and systemic immune defense', () => {
      const matrix = evaluateFunctionalMatrix({ pathway_ids: ['gastrointestinal_hepatobiliary', 'autoimmune_inflammatory'] });
      const graph = buildSystemsNetworkGraph(matrix, ['gastrointestinal_hepatobiliary', 'autoimmune_inflammatory'], []);

      const gutImmuneEdge = graph.edges.find(e => e.id === 'EDGE_ASSIM_DEFENSE');
      assert.ok(gutImmuneEdge);
      assert.strictEqual(gutImmuneEdge.source_node_id, 'NODE_DOM_assimilation');
      assert.strictEqual(gutImmuneEdge.target_node_id, 'NODE_DOM_defense_repair');
      assert.strictEqual(gutImmuneEdge.relationship, 'MAY_CONTRIBUTE_TO');
    });

    it('generates polypharmacy burden node when patient takes 3+ medications', () => {
      const dummyMeds: R5MedicationRecord[] = Array.from({ length: 4 }, (_, i) => ({
        id: `med_${i}`,
        generic_name: `Rx Drug ${i}`,
        prescribed_dose: '1',
        dose_unit: 'tab',
        frequency: 'Daily',
        route: 'Oral',
        administration_times: [],
        is_timing_unknown: true,
        relationship_to_meals: 'with_meal',
        is_prn: false,
        status: 'active',
        verification_status: 'clinician_verified',
        rule_coverage: 'rules_unavailable',
        source: 'clinician_entry'
      }));

      const matrix = evaluateFunctionalMatrix({ pathway_ids: [], medications: dummyMeds });
      const graph = buildSystemsNetworkGraph(matrix, [], dummyMeds);

      const pharmaNode = graph.nodes.find(n => n.type === 'MedicationExposure');
      assert.ok(pharmaNode);
      const pharmaEdge = graph.edges.find(e => e.id === 'EDGE_PHARMA_BIOTRANS');
      assert.ok(pharmaEdge);
    });

    it('derives node confidence from verified evidence level rather than mere observation count', () => {
      const matrix = evaluateFunctionalMatrix({
        pathway_ids: [],
        assessment_answers: { morning_fatigue_level: 'severe' }
      });
      const graph = buildSystemsNetworkGraph(matrix, [], []);
      const energyNode = graph.nodes.find(n => n.id === 'NODE_DOM_energy');
      assert.ok(energyNode);
      // Fatigue is a patient symptom report, NOT a verified factual pathology
      assert.strictEqual(energyNode.confidence, 'patient_reported');

      const assimNode = graph.nodes.find(n => n.id === 'NODE_DOM_assimilation');
      assert.ok(assimNode);
      assert.strictEqual(assimNode.confidence, 'unconfirmed');
    });

    it('sets uncertainty_flag true on cross-system edges when underlying nodes are unconfirmed or hypothetical', () => {
      const matrix = evaluateFunctionalMatrix({
        pathway_ids: ['gastrointestinal_hepatobiliary']
      });
      const graph = buildSystemsNetworkGraph(matrix, ['gastrointestinal_hepatobiliary'], []);
      const edge = graph.edges.find(e => e.id === 'EDGE_ASSIM_DEFENSE');
      assert.ok(edge);
      // Since defense_repair has no confirmed lab/biomarker, edge must carry uncertainty
      assert.strictEqual(edge.uncertainty_flag, true);
    });
  });

  // ── Acute Clinical Safety & Report Release Gate ─────────────────────
  describe('Acute Clinical Safety Report Release Gate', () => {
    it('blocks patient report release and PDF generation when acute_escalation.block_release is true', () => {
      const eligibility = validateReportReleaseEligibility({
        patient: { id: 'p_acute_01', name: 'Critical Patient', current_visit_id: 'v_01' } as any,
        plan: [{ id: 'm_01', items: [] }] as any,
        weeklyDietPlan: {
          status: 'approved',
          is_approved: true,
          patient_id: 'p_acute_01',
          visit_id: 'v_01',
          version: 1,
          approval_metadata: { plan_version: 1, clinician_name: 'Dr. Clinical Nutritionist Specialist' }
        } as any,
        visit: { visit_id: 'v_01' } as any,
        r5NutritionContract: {
          patient_id: 'p_acute_01',
          clinical_pathway_ids: ['renal_electrolyte'],
          nutrient_constraints: { carbohydrate_consistency_required: false },
          acute_escalation: {
            required: true,
            priority: 'CRITICAL_URGENT',
            block_release: true,
            message_en: 'Critical Hyperkalemia Alert: Serum Potassium >= 6.0 mEq/L',
            message_bn: 'মারাত্মক হাইপারক্যালেমিয়া'
          }
        }
      });

      assert.strictEqual(eligibility.isEligible, false);
      assert.ok(eligibility.blockingReasons.some(r => r.includes('Critical Hyperkalemia Alert') || r.includes('Acute Clinical Safety')));
    });
  });

  // ── 8. Multimorbidity Conflict Priority Resolution Layer ───────────
  describe('8. Multimorbidity Conflict Hierarchy', () => {
    it('Priority 1: MAOI tyramine hard stop strictly overrides GI probiotic fermented food recommendations', () => {
      const meds: R5MedicationRecord[] = [
        {
          id: 'm_maoi',
          generic_name: 'Phenelzine',
          prescribed_dose: '15 mg',
          dose_unit: 'mg',
          frequency: 'TDS',
          route: 'Oral',
          administration_times: ['08:00', '13:00', '18:00'],
          is_timing_unknown: false,
          relationship_to_meals: 'with_meal',
          is_prn: false,
          status: 'active',
          verification_status: 'clinician_verified',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        }
      ];

      const conflicts = resolveMultimorbidityConflicts({
        pathway_ids: ['mental_health_neuropsychiatric', 'gastrointestinal_hepatobiliary'],
        medications: meds
      });

      const maoiConflict = conflicts.find(c => c.conflict_id === 'CONFLICT_MAOI_TYRAMINE');
      assert.ok(maoiConflict);
      assert.strictEqual(maoiConflict.parameter, 'tyramine');
      assert.ok(maoiConflict.hard_safety_boundary_en?.includes('Zero tolerance'));
    });

    it('Priority 2: Lithium steady sodium strictly overrides low-sodium diet to prevent neurotoxicity', () => {
      const meds: R5MedicationRecord[] = [
        {
          id: 'm_lit',
          generic_name: 'Lithium Carbonate',
          prescribed_dose: '400 mg',
          dose_unit: 'mg',
          frequency: 'BD',
          route: 'Oral',
          administration_times: ['08:00', '20:00'],
          is_timing_unknown: false,
          relationship_to_meals: 'with_meal',
          is_prn: false,
          status: 'active',
          verification_status: 'clinician_verified',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        }
      ];

      const conflicts = resolveMultimorbidityConflicts({
        pathway_ids: ['cardiovascular', 'mental_health_neuropsychiatric'],
        medications: meds
      });

      const lithiumConflict = conflicts.find(c => c.conflict_id === 'CONFLICT_LITHIUM_SODIUM');
      assert.ok(lithiumConflict);
      assert.strictEqual(lithiumConflict.parameter, 'sodium');
      assert.ok(lithiumConflict.resolved_priority_recommendation_en.includes('MAINTAIN STEADY SODIUM'));
    });

    it('Priority 3: Fatal hyperkalemic arrhythmia in CKD strictly overrides DASH high-potassium guideline', () => {
      const meds: R5MedicationRecord[] = [
        {
          id: 'm_spiro',
          generic_name: 'Spironolactone',
          prescribed_dose: '25 mg',
          dose_unit: 'mg',
          frequency: 'Daily',
          route: 'Oral',
          administration_times: ['08:00'],
          is_timing_unknown: false,
          relationship_to_meals: 'with_meal',
          is_prn: false,
          status: 'active',
          verification_status: 'clinician_verified',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        }
      ];

      const conflicts = resolveMultimorbidityConflicts({
        pathway_ids: ['renal_electrolyte', 'cardiovascular'],
        medications: meds
      });

      const kConflict = conflicts.find(c => c.conflict_id === 'CONFLICT_RENAL_CVD_POTASSIUM');
      assert.ok(kConflict);
      assert.strictEqual(kConflict.parameter, 'potassium');
      assert.ok(
        kConflict.resolved_priority_recommendation_en.includes('POTASSIUM PHARMACOTHERAPY ADVISORY') ||
        kConflict.resolved_priority_recommendation_en.includes('STRICT POTASSIUM RESTRICTION') ||
        kConflict.resolved_priority_recommendation_en.includes('URGENT_CLINICAL_ASSESSMENT_REQUIRED')
      );

      // Verify documented acute hyperkalemia (K+ >= 6.0) triggers acute medical escalation
      const acuteConflicts = resolveMultimorbidityConflicts({
        pathway_ids: ['renal_electrolyte', 'cardiovascular'],
        medications: meds,
        lab_markers: { potassium: 6.2 }
      });
      const acuteK = acuteConflicts.find(c => c.conflict_id === 'CONFLICT_RENAL_CVD_POTASSIUM');
      assert.ok(acuteK);
      assert.ok(acuteK.resolved_priority_recommendation_en.includes('URGENT_CLINICAL_ASSESSMENT_REQUIRED'));
    });

    it('Priority 4: CKD vs Sarcopenia balances protein at 0.8 g/kg to avoid protein-energy wasting', () => {
      const conflicts = resolveMultimorbidityConflicts({
        pathway_ids: ['renal_electrolyte', 'underweight_malnutrition'],
        medications: []
      });

      const proteinConflict = conflicts.find(c => c.conflict_id === 'CONFLICT_RENAL_SARCOPENIA_PROTEIN');
      assert.ok(proteinConflict);
      assert.strictEqual(proteinConflict.parameter, 'protein');
      assert.ok(proteinConflict.resolved_priority_recommendation_en.includes('0.8 g/kg/day target'));
    });

    it('Priority 5: Warfarin INR stability requires consistent daily Vitamin K portions, not zero', () => {
      const meds: R5MedicationRecord[] = [
        {
          id: 'm_warf',
          generic_name: 'Warfarin Sodium',
          prescribed_dose: '5 mg',
          dose_unit: 'mg',
          frequency: 'Evening',
          route: 'Oral',
          administration_times: ['18:00'],
          is_timing_unknown: false,
          relationship_to_meals: 'with_meal',
          is_prn: false,
          status: 'active',
          verification_status: 'clinician_verified',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        }
      ];

      const conflicts = resolveMultimorbidityConflicts({
        pathway_ids: ['cardiovascular'],
        medications: meds
      });

      const warfConflict = conflicts.find(c => c.conflict_id === 'CONFLICT_WARFARIN_VITAMIN_K');
      assert.ok(warfConflict);
      assert.strictEqual(warfConflict.parameter, 'vitamin_k');
      assert.ok(warfConflict.resolved_priority_recommendation_en.includes('CONSISTENT DAILY VITAMIN K'));
    });
  });

  // ── 9. R5 to R4 Integration Adapter ─────────────────────────────────
  describe('9. R5 to R4 Integration Adapter & Invalidation', () => {
    it('maps R5 medications into chronotherapy timeline and handles unknown timing safely', () => {
      const payload: R5ClinicalContextPayload = {
        population: buildR5PopulationProfile({ age: 45 }),
        pathways: evaluatePathwaySelectionState(['metabolic_endocrine']),
        functional_findings: [],
        medications: [
          {
            id: 'med_levo',
            generic_name: 'Levothyroxine Sodium',
            brand_name: 'Thyrox',
            prescribed_dose: '50 mcg',
            dose_unit: 'mcg',
            frequency: 'Morning',
            route: 'Oral',
            administration_times: [],
            is_timing_unknown: true,
            relationship_to_meals: 'before_meal_empty_stomach',
            is_prn: false,
            status: 'active',
            verification_status: 'clinician_verified',
            rule_coverage: 'fully_covered',
            source: 'clinician_entry'
          }
        ],
        insulin_context: {
          active: false,
          regimen_type: 'basal_only',
          formulation_name: 'None',
          is_fixed_meal_dosing: false,
          cgm_smbg_available: false,
          hypoglycemia_history_past_month: false,
          fast_acting_carbs_mandate: false,
          required_action_summary_en: '',
          required_action_summary_bn: ''
        },
        dni_findings: [],
        multimorbidity_resolutions: [],
        systems_graph: {
          nodes: [],
          edges: [],
          evaluated_at: new Date().toISOString(),
          active_conflicts_count: 0,
          unresolved_hypotheses_count: 0
        },
        stale_r4_sections: [],
        generated_at: new Date().toISOString()
      };

      const result = adaptR5ContextToR4(payload);
      assert.ok(result.updated_draft.chronotherapy_timeline);
      assert.strictEqual(result.updated_draft.chronotherapy_timeline.length, 1);
      const levoItem = result.updated_draft.chronotherapy_timeline[0];
      assert.strictEqual(levoItem.time, 'UNKNOWN');
      assert.strictEqual(levoItem.is_timing_unknown, true);
      assert.ok(levoItem.instructions_en.includes('empty stomach 60 minutes before breakfast'));
    });

    it('never mutates approved protocol in place; requires clinician re-approval', () => {
      const payload: R5ClinicalContextPayload = {
        population: buildR5PopulationProfile({ age: 45 }),
        pathways: evaluatePathwaySelectionState(['metabolic_endocrine']),
        functional_findings: [],
        medications: [],
        insulin_context: {
          active: false,
          regimen_type: 'basal_only',
          formulation_name: 'None',
          is_fixed_meal_dosing: false,
          cgm_smbg_available: false,
          hypoglycemia_history_past_month: false,
          fast_acting_carbs_mandate: false,
          required_action_summary_en: '',
          required_action_summary_bn: ''
        },
        dni_findings: [],
        multimorbidity_resolutions: [],
        systems_graph: {
          nodes: [],
          edges: [],
          evaluated_at: new Date().toISOString(),
          active_conflicts_count: 0,
          unresolved_hypotheses_count: 0
        },
        stale_r4_sections: [],
        generated_at: new Date().toISOString()
      };

      const approvedR4: any = {
        status: 'active',
        is_approved: true,
        version: 2
      };

      const result = adaptR5ContextToR4(payload, approvedR4);
      assert.strictEqual(result.requires_clinician_reapproval, true);
      assert.ok(result.stale_notifications.some(s => s.requires_reapproval === true));
    });

    it('generates candidate supplements as draft_candidate (not approved)', () => {
      const payload: R5ClinicalContextPayload = {
        population: buildR5PopulationProfile({ age: 60 }),
        pathways: evaluatePathwaySelectionState(['cardiovascular']),
        functional_findings: [],
        medications: [
          {
            id: 'med_statin',
            generic_name: 'Atorvastatin',
            brand_name: 'Lipitor',
            prescribed_dose: '20 mg',
            dose_unit: 'mg',
            frequency: 'Bedtime',
            route: 'Oral',
            administration_times: ['21:00'],
            is_timing_unknown: false,
            relationship_to_meals: 'bedtime',
            is_prn: false,
            status: 'active',
            verification_status: 'clinician_verified',
            rule_coverage: 'fully_covered',
            source: 'clinician_entry'
          }
        ],
        insulin_context: {
          active: false,
          regimen_type: 'basal_only',
          formulation_name: 'None',
          is_fixed_meal_dosing: false,
          cgm_smbg_available: false,
          hypoglycemia_history_past_month: false,
          fast_acting_carbs_mandate: false,
          required_action_summary_en: '',
          required_action_summary_bn: ''
        },
        dni_findings: [],
        multimorbidity_resolutions: [],
        systems_graph: {
          nodes: [],
          edges: [],
          evaluated_at: new Date().toISOString(),
          active_conflicts_count: 0,
          unresolved_hypotheses_count: 0
        },
        stale_r4_sections: [],
        generated_at: new Date().toISOString()
      };

      const result = adaptR5ContextToR4(payload);
      assert.ok(result.updated_draft.supplements);
      assert.ok(result.updated_draft.supplements.length > 0);
      const coq10 = result.updated_draft.supplements.find(s => s.id === 'SUPP_COQ10_STATIN');
      assert.ok(coq10);
      assert.strictEqual(coq10.approval_status, 'draft_candidate');
    });

    it('generates distinct chronotherapy timeline items for each administration of multi-dose medications', () => {
      const payload: R5ClinicalContextPayload = {
        population: buildR5PopulationProfile({ age: 50 }),
        pathways: evaluatePathwaySelectionState(['metabolic_endocrine']),
        functional_findings: [],
        medications: [
          {
            id: 'med_metformin',
            generic_name: 'Metformin Hydrochloride',
            brand_name: 'Comet',
            prescribed_dose: '500 mg',
            dose_unit: 'mg',
            frequency: 'Twice daily',
            route: 'Oral',
            administration_times: ['08:00', '20:00'],
            is_timing_unknown: false,
            relationship_to_meals: 'with_meal',
            is_prn: false,
            status: 'active',
            verification_status: 'clinician_verified',
            rule_coverage: 'fully_covered',
            source: 'clinician_entry'
          }
        ],
        insulin_context: {
          active: false,
          regimen_type: 'basal_only',
          formulation_name: 'None',
          is_fixed_meal_dosing: false,
          cgm_smbg_available: false,
          hypoglycemia_history_past_month: false,
          fast_acting_carbs_mandate: false,
          required_action_summary_en: '',
          required_action_summary_bn: ''
        },
        dni_findings: [],
        multimorbidity_resolutions: [],
        systems_graph: {
          nodes: [],
          edges: [],
          evaluated_at: new Date().toISOString(),
          active_conflicts_count: 0,
          unresolved_hypotheses_count: 0
        },
        stale_r4_sections: [],
        generated_at: new Date().toISOString()
      };

      const result = adaptR5ContextToR4(payload);
      assert.ok(result.updated_draft.chronotherapy_timeline);
      const metItems = result.updated_draft.chronotherapy_timeline.filter(t => t.entity_id === 'med_metformin');
      assert.strictEqual(metItems.length, 2);
      assert.strictEqual(metItems[0].time, '08:00');
      assert.strictEqual(metItems[1].time, '20:00');
    });

    it('adapts real 14-domain assessment evidence so R4 protocol builder receives identical functional findings', () => {
      const patient = {
        id: 'p_real_01',
        current_visit_id: 'v_01',
        gut_profile: { bloating: 'moderate', bristol_stool_score: 2 }
      };
      const matrixInput = adaptAssessmentEvidenceToMatrixInput(
        patient,
        { bloating_frequency: 'frequent', morning_fatigue_level: 'severe' },
        { alt: 55 },
        null,
        ['gastrointestinal_hepatobiliary'],
        []
      );
      const matrix = evaluateFunctionalMatrix(matrixInput);
      assert.ok(matrix.domains.assimilation.length > 0);
      assert.ok(matrix.domains.energy.length > 0);
      assert.ok(matrix.domains.biotransformation.length > 0);
    });
  });

});
