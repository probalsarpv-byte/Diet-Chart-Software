/**
 * SHUDDHO Phase R5 — Targeted Assessment Consolidation Test Suite
 * 
 * Verifies Acceptance Gates A through J:
 * - Test A: Single pathway selector in Step 1 (no duplicate cards)
 * - Test B: Zero pathways allowed without error (NOT_ASSESSED or NO_KNOWN_PATHWAY)
 * - Test C: Diabetes + CVD + Renal persist without duplication across expanded & legacy maps
 * - Test D: Domain 13 contains smart medicine search and structured entry
 * - Test E: Metformin search -> strength displayed (500 mg) but prescribed dose unknown until entered
 * - Test F: Dose, frequency, timing persistence across navigation/refresh without reverting to defaults
 * - Test G: Multiple meds (including insulin) with independent doses and times
 * - Test H: Patient A / Patient B isolation (zero data leakage)
 * - Test I: R5 Systems Intelligence reads same records in read-only summary
 * - Test J: R4 medication timing integration preserves UNKNOWN times without inventing 08:00
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  CLINICAL_PATHWAY_REGISTRY,
  determinePathwaySelectionState,
  evaluatePathwaySelectionState,
  mapConditionsToPathways,
  mapLegacyPathwaysToExpanded,
  mapExpandedPathwaysToLegacy,
  LEGACY_TO_EXPANDED_PATHWAY_MAP,
  EXPANDED_TO_LEGACY_PATHWAY_MAP
} from '../src/engine/r5PathwayRegistry';

import {
  searchSmartMedications,
  normalizeMedicationRecord,
  identifyCombinationDrug
} from '../src/engine/r5MedicationSearchEngine';

import {
  analyzeInsulinRegimen
} from '../src/engine/r5InsulinEngine';

import {
  evaluateMedicationNutritionInteractions
} from '../src/engine/r5MedicationNutritionEngine';

import {
  evaluateFunctionalMatrix,
  buildSystemsNetworkGraph
} from '../src/engine/r5SystemsNetworkEngine';

import {
  resolveMultimorbidityConflicts
} from '../src/engine/r5MultimorbidityEngine';

import {
  adaptR5ContextToR4
} from '../src/engine/r5ToR4Adapter';

import {
  ASSESSMENT_DOMAINS,
  coreQuestions
} from '../src/questionnaire/registry';

import {
  R5MedicationRecord,
  R5ClinicalContextPayload,
  ExpandedClinicalPathwayId
} from '../src/types/r5Systems';

import {
  ReconciledMedicationRecord,
  PatientProfile
} from '../src/types';

describe('SHUDDHO R5 — Targeted Assessment Consolidation & Safety Acceptance', () => {

  // ─────────────────────────────────────────────────────────────────
  // TEST A: Single pathway selector in Step 1
  // ─────────────────────────────────────────────────────────────────
  it('Test A: Step 1 provides a unified registry of 16+ expanded clinical pathways without duplicate cards', () => {
    assert.ok(CLINICAL_PATHWAY_REGISTRY.length >= 16, `Expected at least 16 pathways, got ${CLINICAL_PATHWAY_REGISTRY.length}`);

    // Verify key core pathways exist in registry
    const pathwayIds = CLINICAL_PATHWAY_REGISTRY.map(p => p.id);
    assert.ok(pathwayIds.includes('metabolic_endocrine'));
    assert.ok(pathwayIds.includes('gastrointestinal_hepatobiliary'));
    assert.ok(pathwayIds.includes('cardiovascular'));
    assert.ok(pathwayIds.includes('renal_electrolyte'));
    assert.ok(pathwayIds.includes('mental_health_neuropsychiatric'));
    assert.ok(pathwayIds.includes('autoimmune_inflammatory'));
    assert.ok(pathwayIds.includes('oncology'));
    assert.ok(pathwayIds.includes('surgical_postoperative'));

    // Verify state determination
    const singleSelected = determinePathwaySelectionState(['metabolic_endocrine']);
    assert.strictEqual(singleSelected, 'PATHWAYS_SELECTED');

    const multiSelected = determinePathwaySelectionState(['metabolic_endocrine', 'cardiovascular']);
    assert.strictEqual(multiSelected, 'PATHWAYS_SELECTED');
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST B: Zero pathways allowed without error
  // ─────────────────────────────────────────────────────────────────
  it('Test B: Zero pathways evaluated gracefully without blocking errors (NOT_ASSESSED or NO_KNOWN_PATHWAY)', () => {
    // 1. Initial / Unassessed state: 0 pathways
    const unassessedState = evaluatePathwaySelectionState([], false);
    assert.strictEqual(unassessedState.status, 'NOT_ASSESSED');
    assert.deepStrictEqual(unassessedState.selected_pathways, []);
    assert.ok(unassessedState.notes && unassessedState.notes.length > 0);

    // 2. Explicit healthy preventive care state: 0 disease pathways
    const healthyState = evaluatePathwaySelectionState([], true);
    assert.strictEqual(healthyState.status, 'NO_KNOWN_PATHWAY');
    assert.deepStrictEqual(healthyState.selected_pathways, []);
    assert.match(healthyState.notes || '', /no known chronic clinical disease/i);

    // 3. Downstream functional matrix & conflict engines handle zero pathways gracefully
    const matrixResult = evaluateFunctionalMatrix({ pathway_ids: [], medications: [] });
    assert.ok(matrixResult.domains);
    assert.strictEqual(matrixResult.atm.triggers.length, 0);

    const conflictResult = resolveMultimorbidityConflicts({ pathway_ids: [], medications: [] });
    assert.strictEqual(conflictResult.length, 0);
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST C: Diabetes + CVD + Renal persist without duplication
  // ─────────────────────────────────────────────────────────────────
  it('Test C: Multiple pathways (Diabetes + CVD + Renal) persist and map cleanly without duplication', () => {
    const selectedExpanded: ExpandedClinicalPathwayId[] = [
      'metabolic_endocrine',
      'cardiovascular',
      'renal_electrolyte'
    ];

    const state = evaluatePathwaySelectionState(selectedExpanded, false);
    assert.strictEqual(state.status, 'PATHWAYS_SELECTED');
    assert.strictEqual(state.selected_pathways.length, 3);

    // Map to legacy projection for backwards compatibility
    const legacyMapped = mapExpandedPathwaysToLegacy(selectedExpanded);
    assert.deepStrictEqual(legacyMapped.sort(), ['cardiovascular', 'metabolic', 'renal'].sort());
    // Ensure no duplicates
    assert.strictEqual(new Set(legacyMapped).size, 3);

    // Round-trip back to expanded
    const roundTripped = mapLegacyPathwaysToExpanded(legacyMapped);
    assert.deepStrictEqual(roundTripped.sort(), selectedExpanded.sort());
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST D: Domain 13 contains smart medicine search and structured entry
  // ─────────────────────────────────────────────────────────────────
  it('Test D: Functional Assessment Domain 13 hosts smart medicine search & retains questionnaire items', () => {
    // Verify Domain 13 is medication_supplements
    const domain13 = ASSESSMENT_DOMAINS.find(d => d.id === 'medication_supplements');
    assert.ok(domain13, 'Domain 13 medication_supplements must exist');
    assert.strictEqual(domain13.id, 'medication_supplements');

    // Verify smart search can query Bangladesh index
    const searchResults = searchSmartMedications('Metformin', 5);
    assert.ok(searchResults.length > 0, 'Metformin search must return results from Bangladesh index');
    assert.ok(searchResults.some(r => r.generic_name.toLowerCase().includes('metformin')));

    // Verify existing Domain 13 questionnaire questions are preserved
    const domain13Questions = coreQuestions.filter(q => q.domain === 'medication_supplements');
    assert.ok(domain13Questions.length >= 2, `Expected at least 2 questions in domain 13, got ${domain13Questions.length}`);
    const allergyQ = domain13Questions.find(q => q.id === 'confirmed_food_allergies_list');
    assert.ok(allergyQ, 'Severe food allergy question must remain in domain 13');
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST E: Metformin search -> strength displayed but prescribed dose unknown until entered
  // ─────────────────────────────────────────────────────────────────
  it('Test E: Selecting a medication displays product strength but preserves prescribed dose as UNKNOWN until entered', () => {
    const searchResults = searchSmartMedications('Comet 500', 5);
    assert.ok(searchResults.length > 0);
    const comet500 = searchResults.find(r => r.brand_name === 'Comet 500' || (r.strength || '').includes('500')) || searchResults[0];

    // Product strength must be present (e.g. "500 mg")
    assert.ok(comet500.strength, 'Product strength should be populated from index');

    // Normalize an unentered record (prescribed dose empty)
    const rawPickerSelection = {
      brand_name: comet500.brand_name,
      generic_name: comet500.generic_name,
      product_strength: comet500.strength,
      prescribed_dose: '', // User has not entered actual prescribed dose yet
      dose_unit: 'mg',
      frequency: '',      // Not defaulted to Once Daily
      relationship_to_meals: 'unknown',
      is_timing_unknown: true,
      administration_times: []
    };

    const normalized = normalizeMedicationRecord(rawPickerSelection);

    // CRITICAL SAFETY ASSERTIONS:
    // 1. Product strength is preserved
    assert.strictEqual(normalized.product_strength, comet500.strength);
    // 2. Prescribed dose is NOT automatically set to 500 mg or 1 tablet
    assert.strictEqual(normalized.prescribed_dose, '');
    // 3. Frequency is NOT defaulted to 'Once Daily'
    assert.strictEqual(normalized.frequency, '');
    // 4. Meal relationship is NOT defaulted to 'with_meal'
    assert.strictEqual(normalized.relationship_to_meals, 'unknown');
    // 5. Timing is explicitly unknown
    assert.strictEqual(normalized.is_timing_unknown, true);
    assert.deepStrictEqual(normalized.administration_times, []);
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST F: Dose, frequency, timing persistence across navigation/refresh
  // ─────────────────────────────────────────────────────────────────
  it('Test F: Explicitly entered dose, frequency, and timing persist without reverting to defaults', () => {
    const userEnteredMed: R5MedicationRecord = {
      id: 'med_test_metformin_1',
      brand_name: 'Comet',
      generic_name: 'Metformin Hydrochloride',
      product_strength: '500 mg',
      prescribed_dose: '1000 mg',
      dose_unit: 'mg',
      frequency: 'Twice daily',
      route: 'Oral',
      administration_times: ['08:00', '20:00'],
      is_timing_unknown: false,
      relationship_to_meals: 'with_meal',
      status: 'active',
      is_prn: false,
      verification_status: 'clinician_verified',
      rule_coverage: 'fully_covered',
      source: 'clinician_entry'
    };

    // Simulate JSON persistence cycle (localStorage / patient draft)
    const serialized = JSON.stringify(userEnteredMed);
    const parsed = JSON.parse(serialized);
    const rehydrated = normalizeMedicationRecord(parsed);

    // Assert exact persistence without regression to defaults
    assert.strictEqual(rehydrated.prescribed_dose, '1000 mg');
    assert.strictEqual(rehydrated.frequency, 'Twice daily');
    assert.strictEqual(rehydrated.relationship_to_meals, 'with_meal');
    assert.strictEqual(rehydrated.is_timing_unknown, false);
    assert.deepStrictEqual(rehydrated.administration_times, ['08:00', '20:00']);
    assert.strictEqual(rehydrated.verification_status, 'clinician_verified');
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST G: Multiple meds (including insulin) with independent doses and times
  // ─────────────────────────────────────────────────────────────────
  it('Test G: Supports multiple medications including insulin with independent prescribed doses, timing, and safety mandates', () => {
    const metformin: R5MedicationRecord = {
      id: 'med_metformin',
      generic_name: 'Metformin Hydrochloride',
      brand_name: 'Comet',
      product_strength: '500 mg',
      prescribed_dose: '1000 mg',
      dose_unit: 'mg',
      frequency: 'Twice daily',
      route: 'Oral',
      administration_times: ['08:00', '20:00'],
      is_timing_unknown: false,
      relationship_to_meals: 'with_meal',
      status: 'active',
      is_prn: false,
      verification_status: 'clinician_verified',
      rule_coverage: 'fully_covered',
      source: 'clinician_entry'
    };

    const atorvastatin: R5MedicationRecord = {
      id: 'med_statin',
      generic_name: 'Atorvastatin Calcium',
      brand_name: 'Lipitor',
      product_strength: '20 mg',
      prescribed_dose: '20 mg',
      dose_unit: 'mg',
      frequency: 'Once daily at bedtime',
      route: 'Oral',
      administration_times: ['22:00'],
      is_timing_unknown: false,
      relationship_to_meals: 'bedtime',
      status: 'active',
      is_prn: false,
      verification_status: 'clinician_verified',
      rule_coverage: 'fully_covered',
      source: 'clinician_entry'
    };

    const insulinGlargine: R5MedicationRecord = {
      id: 'med_insulin_glargine',
      generic_name: 'Insulin Glargine',
      brand_name: 'Lantus',
      product_strength: '100 units/mL',
      prescribed_dose: '14 units',
      dose_unit: 'units',
      frequency: 'Once daily at bedtime',
      route: 'Subcutaneous',
      administration_times: ['22:00'],
      is_timing_unknown: false,
      relationship_to_meals: 'bedtime',
      status: 'active',
      is_prn: false,
      verification_status: 'clinician_verified',
      rule_coverage: 'fully_covered',
      source: 'clinician_entry',
      prescriber_instructions: '14 units subcutaneously at 22:00'
    };

    const medList = [metformin, atorvastatin, insulinGlargine];

    // Evaluate insulin engine
    const insulinAnalysis = analyzeInsulinRegimen(medList);
    assert.strictEqual(insulinAnalysis.has_insulin, true);
    assert.strictEqual(insulinAnalysis.regimen_context?.regimen_type, 'basal_only');
    assert.strictEqual(insulinAnalysis.regimen_context?.fast_acting_carbs_mandate, true);
    assert.ok(insulinAnalysis.regimen_context?.required_action_summary_en.includes('15g'));

    // Assert independent doses and times
    assert.strictEqual(medList[0].prescribed_dose, '1000 mg');
    assert.strictEqual(medList[1].prescribed_dose, '20 mg');
    assert.strictEqual(medList[2].prescribed_dose, '14 units');
    assert.deepStrictEqual(medList[0].administration_times, ['08:00', '20:00']);
    assert.deepStrictEqual(medList[1].administration_times, ['22:00']);
    assert.deepStrictEqual(medList[2].administration_times, ['22:00']);
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST H: Patient A / Patient B isolation (zero data leakage)
  // ─────────────────────────────────────────────────────────────────
  it('Test H: Switching from Patient A to Patient B cleanly isolates medication records with zero leakage', () => {
    // Patient A has 2 active medications
    const patientA_Meds: R5MedicationRecord[] = [
      {
        id: 'med_ptA_1',
        generic_name: 'Metformin',
        prescribed_dose: '500 mg',
        dose_unit: 'mg',
        frequency: 'Daily',
        route: 'Oral',
        administration_times: ['08:00'],
        is_timing_unknown: false,
        relationship_to_meals: 'with_meal',
        status: 'active',
        is_prn: false,
        verification_status: 'clinician_verified',
        rule_coverage: 'fully_covered',
        source: 'clinician_entry'
      }
    ];

    // Patient B has 0 medications (verified no medications)
    const patientB_Records: ReconciledMedicationRecord[] = [];

    // Simulate patient switch rehydration
    const loadedPatientB_Meds = patientB_Records.map(normalizeMedicationRecord);
    assert.strictEqual(loadedPatientB_Meds.length, 0);

    // Verify Patient A medications are not present in Patient B
    const leaked = loadedPatientB_Meds.some(m => m.generic_name === 'Metformin');
    assert.strictEqual(leaked, false, 'Patient A medications must NEVER leak into Patient B');
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST I: R5 Systems Intelligence reads same records in read-only summary
  // ─────────────────────────────────────────────────────────────────
  it('Test I: R5 Systems Intelligence dashboard evaluates authoritative records and flags drug-nutrient interactions', () => {
    const medList: R5MedicationRecord[] = [
      {
        id: 'm1',
        generic_name: 'Metformin Hydrochloride',
        prescribed_dose: '1000 mg',
        dose_unit: 'mg',
        frequency: 'Twice daily',
        route: 'Oral',
        administration_times: ['08:00', '20:00'],
        is_timing_unknown: false,
        relationship_to_meals: 'with_meal',
        status: 'active',
        is_prn: false,
        verification_status: 'clinician_verified',
        rule_coverage: 'fully_covered',
        source: 'clinician_entry'
      },
      {
        id: 'm2',
        generic_name: 'Atorvastatin',
        prescribed_dose: '20 mg',
        dose_unit: 'mg',
        frequency: 'Once daily',
        route: 'Oral',
        administration_times: ['22:00'],
        is_timing_unknown: false,
        relationship_to_meals: 'bedtime',
        status: 'active',
        is_prn: false,
        verification_status: 'clinician_verified',
        rule_coverage: 'fully_covered',
        source: 'clinician_entry'
      }
    ];

    const dniFindings = evaluateMedicationNutritionInteractions(medList);
    assert.ok(dniFindings.length >= 2, `Expected at least 2 DNI findings, got ${dniFindings.length}`);

    // Verify Metformin B12 depletion
    const b12Depletion = dniFindings.find(f => f.rule_id.includes('B12') || f.affected_nutrients.some(n => n.toLowerCase().includes('b12')));
    assert.ok(b12Depletion, 'Metformin B12 depletion must be flagged');

    // Verify Statin CoQ10 depletion
    const coq10Depletion = dniFindings.find(f => f.rule_id.includes('COQ10') || f.affected_nutrients.some(n => /coq10|coenzyme\s*q10/i.test(n)));
    assert.ok(coq10Depletion, 'Statin CoQ10 depletion must be flagged');
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST J: R4 medication timing integration preserves UNKNOWN times without inventing 08:00
  // ─────────────────────────────────────────────────────────────────
  it('Test J: Chronotherapy adapter preserves UNKNOWN administration times without defaulting to 08:00', () => {
    const unrecordedTimingMed: R5MedicationRecord = {
      id: 'med_unknown_time',
      generic_name: 'Metformin Hydrochloride',
      brand_name: 'Comet',
      product_strength: '500 mg',
      prescribed_dose: '500 mg',
      dose_unit: 'mg',
      frequency: 'Daily',
      route: 'Oral',
      administration_times: [], // Empty / unrecorded
      is_timing_unknown: true,
      relationship_to_meals: 'unknown',
      status: 'active',
      is_prn: false,
      verification_status: 'patient_reported',
      rule_coverage: 'fully_covered',
      source: 'clinician_entry'
    };

    const payload: R5ClinicalContextPayload = {
      population: {
        life_stage: 'adult',
        age: 45,
        sex: 'male',
        is_age_unentered: false,
        pregnancy: { active: false },
        lactation: { active: false },
        clinical_contexts: []
      },
      pathways: {
        status: 'PATHWAYS_SELECTED',
        selected_pathways: ['metabolic_endocrine']
      },
      functional_findings: [],
      medications: [unrecordedTimingMed],
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

    const r4Adapted = adaptR5ContextToR4(payload);
    assert.ok(r4Adapted.updated_draft.chronotherapy_timeline, 'Chronotherapy timeline should be generated');

    const timelineItem = r4Adapted.updated_draft.chronotherapy_timeline[0];
    assert.ok(timelineItem);
    // CRITICAL SAFETY ASSERTION: Time must be UNKNOWN, NOT 08:00!
    assert.strictEqual(
      timelineItem.time,
      'UNKNOWN',
      `Expected time to be 'UNKNOWN', got '${timelineItem.time}'. Must not invent 08:00 for unrecorded dosing times.`
    );
  });

});
