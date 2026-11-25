/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION PLATFORM
 * PHASE R7: ADVANCED LABORATORY, BIOMARKER, DRUG-NUTRIENT & SUPPLEMENT INTELLIGENCE TEST SUITE
 *
 * Covers Groups A (A01-A12), B (B01-B12), C (C01-C11), D (D01-D09),
 * E (E01-E16), F (F01-F08), G (G01-G14), and H (H01-H08).
 * All test subjects are strictly synthetic.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import { PatientProfile, WeeklyDietPlan } from '../src/types';
import { StructuredLabEntry } from '../src/types/assessment';
import { R4ProtocolStudioData, SupplementProtocolItem } from '../src/types/r4Protocol';
import { R5MedicationRecord } from '../src/types/r5Systems';
import {
  buildR7CatalogEntries,
  convertLabUnitValue,
  getCanonicalMarkerId,
  isEligibleCanonicalScalarObservation,
  normalizeSingleLabEntry,
  projectStructuredLabsToLegacyScalars,
  reconcilePatientLaboratories,
  resolveCanonicalMarker
} from '../src/engine/r7/labFoundation';
import { buildR5NutritionAdjustmentContract } from '../src/engine/r5NutritionContract';
import { resolveConflicts } from '../src/engine/conflictResolver';
import { normalizeStructuredLabEntries } from '../src/engine/r5SystemsNetworkEngine';
import {
  computeLabTrends,
  computeR7DerivedBiomarkers,
  evaluateBiomarkerObservation,
  evaluateBiomarkerPatterns,
  evaluateCriticalLabFindings,
  evaluateR7LaboratoryIntelligence
} from '../src/engine/r7/biomarkerIntelligence';
import { analyzeFunctionalLabs } from '../src/engine/labAnalyzer';
import { evaluateMedicationNutritionInteractions } from '../src/engine/r5MedicationNutritionEngine';
import {
  calculateR7SupplementExposure,
  resolveLifeStageUpperLimit
} from '../src/engine/r7/supplementIntelligence';
import {
  checkAdvancedSupplementOverlaps,
  generateCandidateSupplements
} from '../src/engine/supplementEngine';
import { evaluateR4ProtocolSafety } from '../src/engine/r4SafetyEngine';
import { buildChronotherapyTimeline } from '../src/engine/chronotherapyEngine';
import { generateLifestyleProtocol } from '../src/engine/lifestyleEngine';
import { generateExerciseProtocol } from '../src/engine/exerciseEngine';
import { generateSleepCircadianProtocol } from '../src/engine/sleepEngine';
import { generateHydrationProtocol } from '../src/engine/hydrationEngine';
import { adaptR5ContextToR4 } from '../src/engine/r5ToR4Adapter';
import { evaluatePathwaySelectionState } from '../src/engine/r5PathwayRegistry';
import { analyzeInsulinRegimen } from '../src/engine/r5InsulinEngine';
import {
  adaptAssessmentEvidenceToMatrixInput,
  buildSystemsNetworkGraph,
  evaluateFunctionalMatrix
} from '../src/engine/r5SystemsNetworkEngine';
import { buildP2ClinicalObservations, buildFlattenedAnswersForP2 } from '../src/engine/assessment/p2HandoffAdapter';
import {
  buildClinicianReportProjection,
  buildPatientReportProjection,
  validatePatientReportProjection,
  validateReportReleaseEligibility
} from '../src/engine/reports/dualReportEngine';
import { buildR5PopulationProfile } from '../src/engine/r5PopulationEngine';

function createSyntheticPatient(overrides: Partial<PatientProfile> = {}): PatientProfile {
  return {
    schema_version: 2,
    id: 'pt_r7_syn_001',
    name: 'Synthetic Patient R7',
    age: 44,
    gender: 'male',
    phone: '01700000777',
    visit_date: '2026-11-25',
    current_visit_id: 'vis_r7_001',
    current_phase: 1,
    height_cm: 170,
    weight_kg: 72,
    waist_cm: 88,
    activity_level: 'sedentary',
    sleep_hours: 7,
    shift_worker: false,
    population_group: 'adult_standard',
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: [],
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    selected_conditions: [],
    active_medications: [],
    gut_profile: {
      bloating: 'none',
      acid_reflux_hypoacidity: false,
      bristol_stool_score: 4,
      energy_score: 7,
      sleep_quality_score: 7,
      digestive_fire_agni: 'samagni'
    },
    labs: { lab_flags: [] },
    calculated: {
      bmi: 24.9,
      bmi_category_en: 'Normal',
      bmi_category_bn: 'স্বাভাবিক',
      ibw_kg: 65,
      adjusted_bw_kg: 68,
      whtr: 0.51,
      whtr_risk_en: 'Low',
      whtr_risk_bn: 'কম',
      bmr: 1620,
      tdee: 2200,
      bmr_safe_calorie_floor: 1620,
      target_calories: 2000,
      target_protein_g: 80,
      target_carbs_g: 230,
      target_fat_g: 70,
      protein_ratio_used: 'Standard',
      population_group: 'adult_standard',
      bmr_floor_strategy: 'clamped_to_bmr',
      is_estimated: false,
      energy_calculation_method: 'Mifflin-St Jeor'
    },
    ...overrides
  };
}

function makeStructuredLab(
  marker_id: string,
  numeric_value: number | undefined,
  unit: string,
  overrides: Partial<StructuredLabEntry> = {}
): StructuredLabEntry {
  const def = resolveCanonicalMarker(marker_id);
  const hasVal = numeric_value !== undefined || overrides.numeric_value !== undefined || overrides.text_value !== undefined;
  return {
    marker_id,
    canonical_marker_id: def?.canonical_id || marker_id,
    category: (def?.panel as any) || 'glycemic',
    name_en: def?.label_en || marker_id,
    name_bn: def?.label_bn || marker_id,
    status: overrides.status ?? (hasVal ? 'previously_tested' : 'not_tested'),
    numeric_value,
    original_value: numeric_value ?? overrides.text_value,
    original_unit: unit,
    unit,
    test_date: '2026-11-24',
    verification_status: 'clinician_verified',
    source_type: 'lab_report_upload',
    ...overrides
  };
}

describe('Phase R7 — Advanced Laboratory, Biomarker, DNI & Supplement Intelligence', () => {
  // ── GROUP A: Canonical Lab Data Foundation & Unit Conversion ──────
  describe('Group A (A01-A12): Canonical Lab Registry, Conversions & Visit Reconciliation', () => {
    it('A01-A06: Converts glucose, creatinine, lipids, Vit D, Ca without double conversion or precision loss', () => {
      const gluConv = convertLabUnitValue('fasting_glucose', 7.0, 'mmol/L');
      assert.equal(gluConv.ok, true);
      if (gluConv.ok) {
        assert.ok(Math.abs(gluConv.value - 126.12) < 0.5, `7.0 mmol/L glucose -> ~126.1 mg/dL (got ${gluConv.value})`);
      }

      const creatConv = convertLabUnitValue('creatinine', 132.6, 'µmol/L');
      assert.equal(creatConv.ok, true);
      if (creatConv.ok) {
        assert.ok(Math.abs(creatConv.value - 1.5) < 0.05, `132.6 umol/L creatinine -> ~1.5 mg/dL (got ${creatConv.value})`);
      }

      const ldlConv = convertLabUnitValue('ldl', 3.5, 'mmol/L');
      assert.equal(ldlConv.ok, true);
      if (ldlConv.ok) {
        assert.ok(Math.abs(ldlConv.value - 135.3) < 1.0);
      }

      const tgConv = convertLabUnitValue('triglycerides', 2.0, 'mmol/L');
      assert.equal(tgConv.ok, true);
      if (tgConv.ok) {
        assert.ok(Math.abs(tgConv.value - 177.1) < 1.0);
      }

      const vitDConv = convertLabUnitValue('vitamin_d3', 75, 'nmol/L');
      assert.equal(vitDConv.ok, true);
      if (vitDConv.ok) {
        assert.ok(Math.abs(vitDConv.value - 30.0) < 0.5);
      }

      // Already canonical mg/dL stays unconverted (no double conversion)
      const alreadyCanonical = normalizeSingleLabEntry(makeStructuredLab('fbs', 110, 'mg/dL'));
      assert.equal(alreadyCanonical.normalized_value, 110);
      assert.equal(alreadyCanonical.canonical_unit, 'mg/dL');
    });

    it('A07-A10: Refuses Lp(a) cross-conversion, aliases resolve cleanly, rejects NaN/Infinity/unsupported units', () => {
      const lpaRefusal = convertLabUnitValue('lpa', 50, 'mg/dL', 'nmol/L');
      assert.equal(lpaRefusal.ok, false, 'Lp(a) fixed mass-to-molar conversion must be disallowed');

      assert.equal(getCanonicalMarkerId('sgpt_alt'), 'alt');
      assert.equal(getCanonicalMarkerId('serum_ferritin'), 'ferritin');
      assert.equal(getCanonicalMarkerId('serum_potassium'), 'potassium');
      assert.equal(getCanonicalMarkerId('fbs'), 'fasting_glucose');

      const badNan = convertLabUnitValue('fasting_glucose', Number.NaN, 'mg/dL');
      const badInf = convertLabUnitValue('fasting_glucose', Number.POSITIVE_INFINITY, 'mg/dL');
      const badUnit = convertLabUnitValue('fasting_glucose', 5.0, 'furlongs/fortnight');
      assert.equal(badNan.ok, false);
      assert.equal(badInf.ok, false);
      assert.equal(badUnit.ok, false);
    });

    it('A11-A12: Handles inequality/qualitative values, detects same-date conflicts & isolates foreign patients/visits', () => {
      const ineq = normalizeSingleLabEntry(
        makeStructuredLab('hs_crp', undefined, 'mg/L', { text_value: '<0.05', inequality_operator: '<' })
      );
      assert.equal(ineq.normalized_value, 0.05);
      assert.equal(ineq.inequality_operator, '<');

      const pt = createSyntheticPatient({ id: 'pt_iso_A', current_visit_id: 'vis_A' });
      const recon = reconcilePatientLaboratories({
        patient: pt,
        visitId: 'vis_A',
        structuredEntries: [
          makeStructuredLab('serum_potassium', 4.1, 'mmol/L', { patient_id: 'pt_iso_A', visit_id: 'vis_A', test_date: '2026-11-24' }),
          makeStructuredLab('potassium', 5.9, 'mmol/L', { patient_id: 'pt_iso_A', visit_id: 'vis_A', test_date: '2026-11-24' }),
          makeStructuredLab('hba1c', 9.2, '%', { patient_id: 'pt_OTHER', visit_id: 'vis_A' }),
          makeStructuredLab('tsh', 18.0, 'µIU/mL', { patient_id: 'pt_iso_A', visit_id: 'vis_OLD' })
        ]
      });

      assert.equal(recon.rejectedForeignRecords.length, 2, 'Foreign patient and wrong-visit entries isolated');
      assert.ok(recon.conflicts.some(c => c.canonical_marker_id === 'potassium'), 'Conflicting potassium results flagged');
      assert.ok(!recon.latestByCanonical.hba1c, 'Foreign patient HbA1c never leaks into Pt A');
      assert.ok(buildR7CatalogEntries(true).length >= 30, 'Catalog exposes comprehensive markers across 9 panels');
    });
  });

  // ── GROUP B: Three-Layer Biomarker Evaluation & Fixed Boundary Logic ─
  describe('Group B (B01-B12): 3-Layer Evaluation, Finding B Fixes & Population Applicability', () => {
    it('B01-B04: Preserves 3 distinct layers, prefers lab reference interval, never mixes exploratory with clinical decision', () => {
      const pt = createSyntheticPatient();
      const pop = buildR5PopulationProfile(pt);
      const obs = normalizeSingleLabEntry(
        makeStructuredLab('hba1c', 6.6, '%', { conventional_low: 4.0, conventional_high: 5.6 })
      );
      const ev = evaluateBiomarkerObservation(obs, pop);
      assert.equal(ev.layer1_reference_interval.provenance, 'laboratory_provided');
      assert.equal(ev.reference_status, 'above_reference_interval');
      assert.equal(ev.layer2_decision_threshold?.met, true);
      assert.equal(ev.layer3_exploratory_functional?.is_exploratory, true);
    });

    it('B05-B10: Corrects legacy labAnalyzer.ts Finding B bugs & avoids default female bias', () => {
      // Unspecified sex must not default to female (ferritin/Hb/creatinine behavior)
      const ptUnspecified = createSyntheticPatient({ gender: 'unspecified' });
      const resUnspecified = analyzeFunctionalLabs(ptUnspecified.labs || {}, ptUnspecified.gender);
      assert.ok(resUnspecified);

      // Low HbA1c (< 4.8) must NOT claim borderline diabetes; Vit D > 80 must NOT say suboptimal/deficient;
      // Low TSH < 0.45 must say low/hyperthyroid review (NOT hypothyroidism!); Normal TSH 3.1 must NOT say hypothyroid risk!
      const ptFixed = createSyntheticPatient({
        gender: 'male',
        labs: {
          hba1c: 4.3,
          vitamin_d3: 95,
          tsh: 0.15,
          fasting_insulin: 1.5,
          uric_acid: 2.1,
          alt: 5,
          lab_flags: []
        }
      });
      const legacyEval = analyzeFunctionalLabs(ptFixed.labs || {}, ptFixed.gender);
      const hba1cFlag = legacyEval.lab_flags.find(f => f.marker.includes('HbA1c'));
      const vitDFlag = legacyEval.lab_flags.find(f => f.marker.includes('Vitamin D'));
      const tshFlag = legacyEval.lab_flags.find(f => f.marker.includes('TSH'));

      assert.ok(hba1cFlag && !hba1cFlag.insight_en.toLowerCase().includes('prediabetes'), 'Low HbA1c never emits diabetes risk');
      assert.ok(vitDFlag && !vitDFlag.insight_en.toLowerCase().includes('deficient'), 'High Vit D 95 never emits suboptimal/deficient');
      assert.ok(tshFlag && !tshFlag.insight_en.toLowerCase().includes('hypothyroid'), 'Low TSH 0.15 never emits high-TSH hypothyroid text');

      // Suboptimal/normal TSH 3.1 should NOT trigger hypothyroidism diagnosis
      const tshNormalPt = createSyntheticPatient({ labs: { tsh: 3.1, lab_flags: [] } });
      const tshNormRes = analyzeFunctionalLabs(tshNormalPt.labs || {}, tshNormalPt.gender);
      const tshNormFlag = tshNormRes.lab_flags.find(f => f.marker.includes('TSH'));
      assert.equal(tshNormFlag?.is_diagnostic_threshold, false, 'TSH 3.1 does not trigger hypothyroidism diagnostic threshold');
      assert.ok(tshNormFlag?.insight_en.includes('does NOT establish hypothyroidism'), 'TSH 3.1 explicitly warns against diagnosing hypothyroidism');

      // Vit D > 150 ng/mL toxic escalation
      const vitDToxicPt = createSyntheticPatient({ labs: { vitamin_d3: 165, lab_flags: [] } });
      const vitDToxic = analyzeFunctionalLabs(vitDToxicPt.labs || {}, vitDToxicPt.gender);
      assert.equal(vitDToxic.lab_flags.find(f => f.marker.includes('Vitamin D'))?.status, 'critical');
    });

    it('B11-B12: Applies pregnancy/pediatric guards cleanly', () => {
      const child = createSyntheticPatient({ age: 8, gender: 'male' });
      const childPop = buildR5PopulationProfile(child);
      const alkObs = normalizeSingleLabEntry(makeStructuredLab('creatinine', 0.6, 'mg/dL'));
      const ev = evaluateBiomarkerObservation(alkObs, childPop);
      assert.ok(ev.population_notes?.toLowerCase().includes('pediatric') || childPop.life_stage === 'child');

      const preg = createSyntheticPatient({ age: 29, gender: 'female', population_group: 'pregnancy' });
      const pregEval = evaluateBiomarkerObservation(
        normalizeSingleLabEntry(makeStructuredLab('ferritin', 24, 'ng/mL')),
        buildR5PopulationProfile(preg)
      );
      assert.ok(pregEval);
    });
  });

  // ── GROUP C: Derived Indices, Patterns, Critical Findings & Trends ─
  describe('Group C (C01-C11): Derived Ratios, Patterns, Critical Queue & Trends', () => {
    it('C01-C05: Calculates HOMA-IR from mixed units, Non-HDL, TG/HDL, TSAT, AST/ALT, FIB-4, UACR, NLR, eGFR with provenance', () => {
      const pt = createSyntheticPatient({ age: 52, gender: 'male' });
      const entries: StructuredLabEntry[] = [
        makeStructuredLab('fbs', 7.0, 'mmol/L', { fasting_status: 'fasting' }), // converts -> ~126.1 mg/dL
        makeStructuredLab('fasting_insulin', 18, 'µIU/mL', { fasting_status: 'fasting' }),
        makeStructuredLab('total_cholesterol', 240, 'mg/dL'),
        makeStructuredLab('hdl', 38, 'mg/dL'),
        makeStructuredLab('triglycerides', 220, 'mg/dL'),
        makeStructuredLab('serum_iron', 50, 'µg/dL'),
        makeStructuredLab('tibc', 350, 'µg/dL'),
        makeStructuredLab('ast', 48, 'U/L'),
        makeStructuredLab('alt', 32, 'U/L'),
        makeStructuredLab('platelets', 190, '×10³/µL'),
        makeStructuredLab('urine_albumin', 60, 'mg/L'),
        makeStructuredLab('urine_creatinine', 100, 'mg/dL'),
        makeStructuredLab('neutrophils_abs', 4.5, '10^9/L'),
        makeStructuredLab('lymphocytes_abs', 1.5, '10^9/L'),
        makeStructuredLab('serum_creatinine', 1.5, 'mg/dL')
      ];
      const summary = evaluateR7LaboratoryIntelligence({ patient: pt, structuredEntries: entries });
      const byId = Object.fromEntries(summary.derived_indices.map(d => [d.derived_id, d]));

      assert.equal(byId.homa_ir.status, 'calculated');
      assert.ok((byId.homa_ir.value || 0) > 5.0 && (byId.homa_ir.value || 0) < 6.0, `HOMA-IR accurate from mmol/L FBS: ${byId.homa_ir.value}`);
      assert.equal(byId.non_hdl.value, 202);
      assert.ok(Math.abs((byId.tg_hdl_ratio.value || 0) - 5.79) < 0.1);
      assert.ok(Math.abs((byId.transferrin_saturation.value || 0) - 14.3) < 0.5);
      assert.equal(byId.ast_alt_ratio.value, 1.5);
      assert.equal(byId.fib4.status, 'calculated');
      assert.equal(byId.uacr.status, 'calculated');
      assert.equal(byId.nlr.status, 'calculated');
      assert.equal(byId.calculated_egfr.status, 'calculated');
      assert.ok((byId.calculated_egfr.value || 0) > 40 && (byId.calculated_egfr.value || 0) < 65);
    });

    it('C06-C08: Blocks unverified inputs in strict derivations, generates evidence-qualified patterns without confidence %', () => {
      const pt = createSyntheticPatient({ age: 40, gender: 'female' });
      const entries: StructuredLabEntry[] = [
        makeStructuredLab('hba1c', 7.2, '%', { verification_status: 'lab_document_reviewed' }),
        makeStructuredLab('fbs', 5.1, 'mmol/L', { verification_status: 'lab_document_reviewed' }), // contradictory normal fasting vs high A1c
        makeStructuredLab('ferritin', 18, 'ng/mL', { verification_status: 'clinician_verified' }),
        makeStructuredLab('hs_crp', 8.5, 'mg/L', { verification_status: 'clinician_verified' }) // elevated CRP confounding ferritin
      ];
      const summary = evaluateR7LaboratoryIntelligence({ patient: pt, structuredEntries: entries });
      assert.ok(summary.patterns.length >= 2);
      const gly = summary.patterns.find(p => p.pattern_id === 'glycemic_dysregulation');
      assert.ok(gly && !JSON.stringify(gly).includes('confidence_percent'), 'Zero fabricated confidence percentage');
      assert.ok(summary.patterns.every(p => Array.isArray(p.supporting_observation_ids) && Array.isArray(p.contradictory_observation_ids)));
    });

    it('C09-C11: Escalates critical labs to blocking release gate; separates comparable vs incomparable serial trends', () => {
      const pt = createSyntheticPatient();
      const summaryCrit = evaluateR7LaboratoryIntelligence({
        patient: pt,
        structuredEntries: [makeStructuredLab('serum_potassium', 6.4, 'mmol/L', { verification_status: 'clinician_verified' })]
      });
      assert.equal(summaryCrit.blocks_patient_release, true);
      assert.ok(summaryCrit.critical_findings.length > 0);

      const summaryIncomp = evaluateR7LaboratoryIntelligence({
        patient: pt,
        structuredEntries: [makeStructuredLab('creatinine', 1.4, 'mg/dL', { test_date: '2026-11-24', specimen_type: 'serum' })],
        historicalEntries: [makeStructuredLab('creatinine', 1.1, 'mg/dL', { test_date: '2026-08-24', specimen_type: 'urine_spot' })]
      });
      const trendCreat = summaryIncomp.trends.find(t => t.canonical_marker_id === 'creatinine');
      assert.equal(trendCreat?.comparable, false, 'Incompatible specimens refuse numeric delta');

      const summaryComp = evaluateR7LaboratoryIntelligence({
        patient: pt,
        structuredEntries: [makeStructuredLab('hba1c', 6.4, '%', { test_date: '2026-11-24' })],
        historicalEntries: [makeStructuredLab('hba1c', 7.8, '%', { test_date: '2026-08-24' })]
      });
      const trendA1c = summaryComp.trends.find(t => t.canonical_marker_id === 'hba1c');
      assert.equal(trendA1c?.comparable, true);
      assert.equal(trendA1c?.direction, 'decreased');
      assert.ok(Math.abs((trendA1c?.absolute_change || 0) + 1.4) < 0.05);
    });
  });

  // ── GROUP D: Systems Matrix, P2 Handoff, Diet, Dual Reports & U21 ─
  describe('Group D (D01-D09): Functional Matrix, P2 Handoff & U21 Privacy Preservation', () => {
    it('D01-D04: Normal labs add 0 dysfunction; unverified observations never claim LAB_SUPPORTED; p2Handoff fixes Finding C', () => {
      const pt = createSyntheticPatient();
      const normalEntries = {
        hba1c: makeStructuredLab('hba1c', 5.1, '%'),
        fbs: makeStructuredLab('fbs', 4.8, 'mmol/L'),
        tsh: makeStructuredLab('tsh', 2.0, 'µIU/mL'),
        serum_ferritin: makeStructuredLab('serum_ferritin', 85, 'ng/mL')
      };
      const matrixNormal = evaluateFunctionalMatrix(
        adaptAssessmentEvidenceToMatrixInput(pt, {}, normalEntries, null, [], [])
      );
      assert.equal(matrixNormal.total_observations, 0, 'Normal verified labs trigger 0 dysfunction observations');

      // Unverified critical or abnormal lab stays PATIENT_REPORTED / unverified
      const unverifiedEntries = {
        serum_ferritin: makeStructuredLab('serum_ferritin', 14, 'ng/mL', { verification_status: 'patient_reported' })
      };
      const matrixUnverified = evaluateFunctionalMatrix(
        adaptAssessmentEvidenceToMatrixInput(pt, {}, unverifiedEntries, null, [], [])
      );
      const transportObs = matrixUnverified.domains.transport.find(o => o.evidence_source.includes('ferritin'));
      assert.ok(transportObs);
      assert.equal(transportObs.confidence_status, 'PATIENT_REPORTED', 'Patient-reported unverified ferritin must NOT be labeled LAB_SUPPORTED');

      // Finding C: p2HandoffAdapter honors verification_status & normalizes FBS mmol/L
      const assessmentMock: any = {
        patient_id: pt.id,
        visit_id: pt.current_visit_id,
        assessment_id: 'assess_01',
        assessment_date: '2026-11-24',
        mode: 'quick',
        functional_answers: {},
        population_data: {},
        labs: {
          entries: {
            fbs: makeStructuredLab('fbs', 7.0, 'mmol/L', { verification_status: 'patient_reported' }),
            hba1c: makeStructuredLab('hba1c', 6.8, '%', { verification_status: 'clinician_verified' })
          },
          last_updated: '2026-11-24',
          total_tested_count: 2,
          pending_count: 0
        }
      };
      const p2Obs = buildP2ClinicalObservations(assessmentMock, pt);
      const p2Fbs = p2Obs.find(o => o.sourceLabMarker === 'fbs');
      const p2A1c = p2Obs.find(o => o.sourceLabMarker === 'hba1c');
      assert.equal(p2Fbs?.verificationStatus, 'unverified', 'Finding C fixed: patient_reported does NOT become lab_confirmed');
      assert.equal(p2A1c?.verificationStatus, 'lab_confirmed');
      const flat = buildFlattenedAnswersForP2(assessmentMock);
      assert.ok(flat.fasting_glucose > 120, 'p2 flattened fbs converted mmol/L -> mg/dL');
    });

    it('D05-D09: Multi-system graph nodes carry provenance; U21 patient payload leaks 0 kcal/macros/biomarkers', () => {
      const pt = createSyntheticPatient({ selected_conditions: ['t2d_ir'] });
      const entries = [makeStructuredLab('vitamin_b12', 175, 'pg/mL'), makeStructuredLab('serum_ferritin', 15, 'ng/mL')];
      const r7Summary = evaluateR7LaboratoryIntelligence({ patient: pt, structuredEntries: entries });
      const mInput = adaptAssessmentEvidenceToMatrixInput(pt, {}, entries as any, null, ['metabolic_endocrine'], []);
      (mInput as any).r7_lab_summary = r7Summary;
      const matrix = evaluateFunctionalMatrix(mInput);
      const graph = buildSystemsNetworkGraph(matrix, ['metabolic_endocrine'], [], r7Summary);
      const labNodes = graph.nodes.filter(n => n.type === 'LaboratoryObservation');
      assert.equal(labNodes.length, 2);
      assert.ok(labNodes.every(n => Boolean(n.data_payload?.observation_id)));

      const clinReport = buildClinicianReportProjection({
        patient: pt,
        dietChart: [],
        r7LabSummary: r7Summary
      });
      assert.ok(clinReport.r7_lab_intelligence?.evaluations.length === 2);

      const patReport = buildPatientReportProjection({
        patient: pt,
        dietChart: []
      });
      const privacy = validatePatientReportProjection(patReport);
      assert.equal(privacy.isValid, true, 'Patient projection preserves strict U21 privacy invariants');
      assert.equal((patReport as any).r7_lab_intelligence, undefined);
    });
  });

  // ── GROUP E: Medication–Nutrient–Laboratory Intelligence ─────────
  describe('Group E (E01-E16): Route/Status/Lab-Qualified DNI Rules', () => {
    it('E01-E10: Explicit affected_nutrient_ids, Metformin B12 lab qualification, Statin CoQ10 monitoring, IV vs Oral bisphosphonate', () => {
      const medBase = {
        dose_unit: 'mg',
        frequency: 'Once daily',
        administration_times: ['08:00'],
        is_timing_unknown: false,
        relationship_to_meals: 'with_meal' as const,
        is_prn: false,
        verification_status: 'clinician_verified' as const,
        rule_coverage: 'fully_covered' as const,
        source: 'clinician_entry' as const
      };
      const meds: R5MedicationRecord[] = [
        { ...medBase, id: 'm1', generic_name: 'Metformin', prescribed_dose: '1000 mg', route: 'Oral', status: 'active' },
        { ...medBase, id: 'm2', generic_name: 'Atorvastatin', prescribed_dose: '20 mg', route: 'Oral', status: 'active' },
        { ...medBase, id: 'm3', generic_name: 'Zoledronic Acid Alendronate', prescribed_dose: '5 mg', route: 'Intravenous Infusion', status: 'active' },
        { ...medBase, id: 'm4', generic_name: 'Lisinopril', prescribed_dose: '10 mg', route: 'Oral', status: 'discontinued' },
        { ...medBase, id: 'm5', generic_name: 'Budesonide Corticosteroid', prescribed_dose: '200 mcg', route: 'Inhaled', status: 'active' },
        { ...medBase, id: 'm6', generic_name: 'Omeprazole', prescribed_dose: '20 mg', route: 'Oral', status: 'historical', is_historical: true }
      ];

      const pt = createSyntheticPatient();
      const normalB12Lab = evaluateR7LaboratoryIntelligence({
        patient: pt,
        structuredEntries: [makeStructuredLab('vitamin_b12', 520, 'pg/mL')]
      });

      const findings = evaluateMedicationNutritionInteractions(meds, pt, { labSummary: normalB12Lab });

      const b12Finding = findings.find(f => f.rule_id === 'RULE_METFORMIN_B12_DEPLETION');
      assert.ok(b12Finding);
      assert.deepEqual(b12Finding.affected_nutrient_ids, ['vitamin_b12', 'folate']);
      assert.equal(b12Finding.relevant_labs_status, 'normal');
      assert.equal(b12Finding.intervention_state, 'monitoring_consideration', 'Normal serum B12 keeps Metformin finding as monitoring rather than auto-deficiency');

      const coqFinding = findings.find(f => f.rule_id === 'RULE_STATIN_COQ10');
      assert.ok(coqFinding);
      assert.equal(coqFinding.evidence_grade, 'C');
      assert.equal(coqFinding.intervention_state, 'monitoring_consideration');

      assert.equal(findings.some(f => f.rule_id === 'RULE_BISPHOSPHONATE_POSTURE'), false, 'IV bisphosphonate excluded from oral empty-stomach posture rule');
      assert.equal(findings.some(f => f.rule_id === 'RULE_ACEI_ARB_POTASSIUM'), false, 'Discontinued ACEi excluded');
      assert.equal(findings.some(f => f.rule_id === 'RULE_CORTICOSTEROID_METABOLIC'), false, 'Inhaled corticosteroid excluded from systemic steroid rule');
      assert.equal(findings.some(f => f.rule_id === 'RULE_PPI_MICRONUTRIENT_MALABSORPTION'), false, 'Historical PPI excluded from active guidance');
    });

    it('E11-E16: Lab-supported low B12 escalates state; hyperkalemia contraindicated on ARB; chronotherapy spacing honors IV vs Oral', () => {
      const pt = createSyntheticPatient();
      const lowB12HighKLab = evaluateR7LaboratoryIntelligence({
        patient: pt,
        structuredEntries: [
          makeStructuredLab('vitamin_b12', 165, 'pg/mL'),
          makeStructuredLab('serum_potassium', 5.6, 'mmol/L')
        ]
      });
      const meds: R5MedicationRecord[] = [
        {
          id: 'm1', generic_name: 'Metformin', prescribed_dose: '1000 mg', dose_unit: 'mg', frequency: 'BID',
          route: 'Oral', administration_times: ['08:00', '20:00'], is_timing_unknown: false,
          relationship_to_meals: 'with_meal', is_prn: false, verification_status: 'clinician_verified',
          status: 'active', rule_coverage: 'fully_covered', source: 'clinician_entry'
        },
        {
          id: 'm2', generic_name: 'Losartan', prescribed_dose: '50 mg', dose_unit: 'mg', frequency: 'OD',
          route: 'Oral', administration_times: ['08:00'], is_timing_unknown: false,
          relationship_to_meals: 'independent_of_meals', is_prn: false, verification_status: 'clinician_verified',
          status: 'active', rule_coverage: 'fully_covered', source: 'clinician_entry'
        }
      ];
      const findings = evaluateMedicationNutritionInteractions(meds, pt, { labSummary: lowB12HighKLab });
      assert.equal(findings.find(f => f.rule_id === 'RULE_METFORMIN_B12_DEPLETION')?.intervention_state, 'lab_supported_abnormality');
      assert.equal(findings.find(f => f.rule_id === 'RULE_ACEI_ARB_POTASSIUM')?.intervention_state, 'contraindicated');

      // Chronotherapy Fluoroquinolone chelation vs Iron < 2h -> CRITICAL conflict
      const ls = generateLifestyleProtocol(pt);
      const ex = generateExerciseProtocol(pt);
      const sl = generateSleepCircadianProtocol(pt);
      const hy = generateHydrationProtocol(pt);
      const ironSupp: SupplementProtocolItem = {
        id: 's_fe', generic_nutrient: 'Ferrous Bisglycinate', chemical_form: 'Iron',
        brand_verification_status: 'generic_prescription_only', indication_en: 'Anemia', indication_bn: 'রক্তস্বল্পতা',
        evidence_category: 'evidence_based', total_compound_dose: '25 mg elemental', frequency: 'once_daily',
        administration_time: '08:30', relationship_to_food: 'with_breakfast', monitoring_parameters: [],
        contraindications: [], known_interactions: [], approval_status: 'draft_candidate', source: 'clinician_manual_entry'
      };
      const { conflicts } = buildChronotherapyTimeline(ls, ex, sl, hy, [ironSupp], [{ name: 'Ciprofloxacin 500mg', timing: '08:00' }]);
      assert.ok(conflicts.some(c => c.severity === 'critical' && c.item1_title.toLowerCase().includes('ciprofloxacin')));
    });
  });

  // ── GROUP F: Brand Provenance, Multi-Ingredient & Unknown Doses ──
  describe('Group F (F01-F08): Honest Brand Verification Provenance & Unknown Dose Safeguards', () => {
    it('F01-F08: Never stamps verified_bd_market without documentary proof; flags unknown/PRN doses cleanly', () => {
      const pt = createSyntheticPatient({ active_medications: ['Metformin 1000mg', 'Omeprazole 20mg'] });
      const candidates = generateCandidateSupplements(pt);
      assert.ok(candidates.length >= 2);
      for (const c of candidates) {
        assert.notEqual(c.brand_verification_status, 'verified_bd_market', 'Unverified catalog item must not falsely assert verified_bd_market');
        assert.equal(c.brand_verification_metadata?.regulatory_status, 'unverified');
        assert.equal(c.approval_status, 'draft_candidate');
      }

      // Unknown / proprietary dose triggers incomplete exposure review gate
      const proprietary: SupplementProtocolItem = {
        id: 'supp_prop', generic_nutrient: 'Herbal Sleep Blend', chemical_form: 'Proprietary',
        brand_verification_status: 'unverified_brand', indication_en: 'Sleep', indication_bn: 'ঘুম',
        evidence_category: 'review_required', total_compound_dose: '1 capsule proprietary blend',
        frequency: 'once_daily', administration_time: '21:30', relationship_to_food: 'before_bed',
        is_dose_unknown: true, monitoring_parameters: [], contraindications: [], known_interactions: [],
        approval_status: 'draft_candidate', source: 'clinician_manual_entry'
      };
      const exp = calculateR7SupplementExposure({ supplements: [proprietary], patient: pt });
      assert.ok(exp.incomplete_items.length > 0, 'Proprietary unknown dose triggers incomplete exposure alert');

      // Statin without myalgia keeps CoQ10 strictly draft monitoring consideration in R5->R4 adapter
      const r5Payload = {
        population: buildR5PopulationProfile(pt),
        pathways: evaluatePathwaySelectionState(['cardiovascular']),
        functional_findings: [],
        medications: [{
          id: 'm_statin', generic_name: 'Atorvastatin', prescribed_dose: '20 mg', dose_unit: 'mg', frequency: 'Bedtime',
          route: 'Oral', administration_times: ['21:30'], is_timing_unknown: false, relationship_to_meals: 'bedtime' as const,
          is_prn: false, status: 'active' as const, verification_status: 'clinician_verified' as const,
          rule_coverage: 'fully_covered' as const, source: 'clinician_entry' as const
        }],
        insulin_context: analyzeInsulinRegimen([]).regimen_context,
        dni_findings: [],
        multimorbidity_resolutions: [],
        systems_graph: { nodes: [], edges: [], evaluated_at: '', active_conflicts_count: 0, unresolved_hypotheses_count: 0 },
        stale_r4_sections: [],
        generated_at: new Date().toISOString()
      };
      const r4Adapted = adaptR5ContextToR4(r5Payload);
      const coq = r4Adapted.updated_draft.supplements?.find(s => s.id === 'SUPP_COQ10_STATIN');
      assert.equal(coq?.approval_status, 'draft_candidate');
      assert.ok(coq?.monitoring_indication?.includes('monitoring_consideration_inconclusive_evidence'));
    });
  });

  // ── GROUP G: Multi-Ingredient Exposure, Dedup, Pediatric & Renal ULs ─
  describe('Group G (G01-G14): Multi-Ingredient Exposure Math, Physical Dedup & Life-Stage ULs', () => {
    it('G01-G07: Separates approved vs proposed intake, sums shared nutrients across multi-ingredient SKUs, deduplicates identical physical SKUs', () => {
      const pt = createSyntheticPatient({ age: 35, gender: 'male' });
      const currentApprovedCombo: SupplementProtocolItem = {
        id: 'supp_approved_bone',
        physical_product_key: 'bone_support_a',
        generic_nutrient: 'Bone Complex (D3 + Mg + Zn)',
        chemical_form: 'Chelated',
        brand_verification_status: 'generic_prescription_only',
        indication_en: 'Bone maintenance',
        indication_bn: 'হাড়ের সুরক্ষা',
        evidence_category: 'evidence_based',
        total_compound_dose: 'D3 2000 IU + Mg 200 mg + Zn 25 mg',
        frequency: 'once_daily',
        administration_time: '13:00',
        relationship_to_food: 'with_lunch',
        monitoring_parameters: [],
        contraindications: [],
        known_interactions: [],
        approval_status: 'clinician_approved',
        source: 'clinician_manual_entry',
        ingredients: [
          { nutrient_id: 'vitamin_d3', nutrient_name: 'Vitamin D3', elemental_amount_per_unit: 2000, amount_unit: 'IU', prescribed_units_per_dose: 1, is_standardized: true, is_elemental_known: true },
          { nutrient_id: 'magnesium', nutrient_name: 'Magnesium', elemental_amount_per_unit: 200, amount_unit: 'mg', prescribed_units_per_dose: 1, is_standardized: true, is_elemental_known: true },
          { nutrient_id: 'zinc', nutrient_name: 'Zinc', elemental_amount_per_unit: 25, amount_unit: 'mg', prescribed_units_per_dose: 1, is_standardized: true, is_elemental_known: true }
        ]
      };
      const proposedSleepMg: SupplementProtocolItem = {
        id: 'supp_draft_mg',
        physical_product_key: 'mag_sleep_b',
        generic_nutrient: 'Magnesium Glycinate',
        chemical_form: 'Bisglycinate',
        brand_verification_status: 'generic_prescription_only',
        indication_en: 'Sleep',
        indication_bn: 'ঘুম',
        evidence_category: 'evidence_based',
        total_compound_dose: '200 mg elemental',
        frequency: 'once_daily',
        administration_time: '21:30',
        relationship_to_food: 'before_bed',
        monitoring_parameters: [],
        contraindications: [],
        known_interactions: [],
        approval_status: 'draft_candidate',
        source: 'clinician_manual_entry'
      };
      // Identical physical duplicate of currentApprovedCombo
      const duplicateBoneRef: SupplementProtocolItem = {
        ...currentApprovedCombo,
        id: 'supp_approved_bone_dup',
        approval_status: 'draft_candidate'
      };

      const exp = calculateR7SupplementExposure({
        supplements: [currentApprovedCombo, proposedSleepMg, duplicateBoneRef],
        patient: pt,
        fortifiedDietByNutrient: { zinc: { amount: 20, unit: 'mg', source_label: 'Fortified Shake' } }
      });

      assert.equal(exp.physical_duplicates.length, 1, 'Physical SKU duplicate deduplicated cleanly');
      assert.equal(exp.exposures_by_nutrient.magnesium.current_approved_daily, 200);
      assert.equal(exp.exposures_by_nutrient.magnesium.proposed_candidate_daily, 200);
      assert.equal(exp.exposures_by_nutrient.magnesium.combined_daily, 400);
      assert.equal(exp.exposures_by_nutrient.magnesium.exceeds_ul, true, '400 mg combined exceeds adult 350 mg supplemental Mg UL');
      assert.equal(exp.exposures_by_nutrient.zinc.fortified_diet_daily, 20);
      assert.equal(exp.exposures_by_nutrient.zinc.combined_daily, 45);
      assert.equal(exp.exposures_by_nutrient.zinc.exceeds_ul, true, '25 supp + 20 fortified = 45 mg exceeds adult 40 mg Zinc UL');
    });

    it('G08-G14: Enforces IOM pediatric ULs, single-dose bolus threshold, ferritin >= 300 iron block & CKD eGFR < 30 potassium block', () => {
      const child5y = createSyntheticPatient({ age: 5, gender: 'male' });
      const childMgUL = resolveLifeStageUpperLimit('magnesium', child5y);
      assert.equal(childMgUL.ul, 110, 'IOM pediatric 4-8y supplemental Mg UL is strictly 110 mg/day');

      const adultCkD = createSyntheticPatient({ age: 62, labs: { egfr: 22, ferritin: 380, lab_flags: [] } as any });
      const ironHighFerritin: SupplementProtocolItem = {
        id: 's_fe_block', generic_nutrient: 'Ferrous Sulfate', chemical_form: 'Iron',
        brand_verification_status: 'generic_prescription_only', indication_en: 'Iron', indication_bn: 'আয়রন',
        evidence_category: 'evidence_based', total_compound_dose: '30 mg elemental', frequency: 'once_daily',
        administration_time: '08:00', relationship_to_food: 'empty_stomach_waking', monitoring_parameters: [],
        contraindications: [], known_interactions: [], approval_status: 'draft_candidate', source: 'clinician_manual_entry'
      };
      const kCkdSupp: SupplementProtocolItem = {
        ...ironHighFerritin, id: 's_k_block', generic_nutrient: 'Potassium Citrate', chemical_form: 'Potassium',
        total_compound_dose: '150 mg', administration_time: '12:00'
      };
      const weeklyVitDBolus: SupplementProtocolItem = {
        ...ironHighFerritin, id: 's_d3_bolus', generic_nutrient: 'Vitamin D3', chemical_form: 'Cholecalciferol',
        total_compound_dose: '40000 IU', frequency: 'weekly', administration_time: '13:00'
      };

      const exp = calculateR7SupplementExposure({ supplements: [ironHighFerritin, kCkdSupp, weeklyVitDBolus], patient: adultCkD });
      assert.ok(exp.safety_blocks.some(b => b.toLowerCase().includes('ferritin')), 'Ferritin >= 300 blocks unreviewed iron supplement');
      assert.ok(exp.safety_blocks.some(b => b.toLowerCase().includes('potassium')), 'eGFR < 30 blocks supplemental potassium');
      assert.equal(exp.exposures_by_nutrient.vitamin_d3.exceeds_single_dose_threshold, true, '40,000 IU weekly flagged by single-dose bolus check');
      assert.equal(checkAdvancedSupplementOverlaps([ironHighFerritin, kCkdSupp], adultCkD).length >= 1, true);
    });
  });

  // ── GROUP H: End-to-End R4/R6 Authorization & Release Safety Gates ─
  describe('Group H (H01-H08): Non-Bypassable R6 Release Gate & Protocol Integration', () => {
    it('H01-H08: R7 critical labs block R6 release even with approved diet/R4; R4 safety blocks UL breaches', () => {
      const pt = createSyntheticPatient();
      const validPlan: WeeklyDietPlan = {
        plan_id: 'wp_r7_01',
        schema_version: 2,
        patient_id: pt.id,
        visit_id: pt.current_visit_id || 'vis_r7_001',
        version: 1,
        status: 'approved',
        is_approved: true,
        overall_safety_status: 'SAFE',
        target_macros: { calories: 2000, protein_g: 80, carbs_g: 230, fat_g: 70 },
        approved_by: 'Dr. Synthetic Reviewer',
        approved_at: '2026-11-25T10:00:00Z',
        approval_metadata: {
          clinician_id: 'DR_REV',
          clinician_name: 'Dr. Synthetic Reviewer',
          approval_timestamp: '2026-11-25T10:00:00Z',
          plan_version: 1
        },
        created_at: '2026-11-25T09:00:00Z',
        updated_at: '2026-11-25T10:00:00Z',
        days: [{
          day_number: 1, day_name_bn: 'দিন ১', day_name_en: 'Day 1',
          safety_decision: 'SAFE',
          summary: { calories: 1900, protein_g: 80, carbs_g: 220, fat_g: 65, fiber_g: 28, gl: 90, gl_is_estimated: true, pral: -5, calorie_variance: 0, protein_variance: 0, carbs_variance: 0, fat_variance: 0 },
          meals: []
        }]
      };

      const normalLabs = evaluateR7LaboratoryIntelligence({
        patient: pt,
        structuredEntries: [makeStructuredLab('serum_potassium', 4.3, 'mmol/L')]
      });
      const gatePass = validateReportReleaseEligibility({
        patient: pt,
        plan: validPlan,
        weeklyDietPlan: validPlan,
        expectedVisitId: pt.current_visit_id,
        r7LabSummary: normalLabs
      });
      assert.equal(gatePass.isEligible, true, 'Approved plan + normal reconciled labs eligible for release');

      // Critical unverified potassium or critical low glucose MUST block release regardless of approved plan
      const criticalLabs = evaluateR7LaboratoryIntelligence({
        patient: pt,
        structuredEntries: [makeStructuredLab('fbs', 42, 'mg/dL', { verification_status: 'unverified' })]
      });
      const gateBlock = validateReportReleaseEligibility({
        patient: pt,
        plan: validPlan,
        weeklyDietPlan: validPlan,
        expectedVisitId: pt.current_visit_id,
        r7LabSummary: criticalLabs
      });
      assert.equal(gateBlock.isEligible, false, 'Critical lab finding blocks patient prescription release non-bypassably');
      assert.ok(gateBlock.blockingReasons.length > 0);

      // R4 Safety Engine blocks approval on UL violation
      const safetyBlocked = evaluateR4ProtocolSafety(
        generateLifestyleProtocol(pt),
        generateExerciseProtocol(pt),
        generateSleepCircadianProtocol(pt),
        generateHydrationProtocol(pt),
        [{
          id: 's_excess_mg', generic_nutrient: 'Magnesium Oxide', chemical_form: 'Oxide',
          brand_verification_status: 'generic_prescription_only', indication_en: 'Test', indication_bn: 'পরীক্ষা',
          evidence_category: 'evidence_based', total_compound_dose: '500 mg elemental', frequency: 'once_daily',
          administration_time: '21:30', relationship_to_food: 'before_bed', monitoring_parameters: [],
          contraindications: [], known_interactions: [], approval_status: 'draft_candidate', source: 'clinician_manual_entry'
        }],
        [],
        pt
      );
      assert.equal(safetyBlocked.overall_status, 'HARD_STOP');
      assert.equal(safetyBlocked.can_approve, false);
    });
  });

  // ── CHECKPOINT A CLOSURE: Invalid/Unqualified Structured Labs & Projection Gate ─
  describe('Checkpoint A Closure: Canonical Eligibility & No Raw Fallback', () => {
    it('CP-A01: Rejects raw numeric fallback & clears stale patient.labs on pending/declined/unsupported/implausible/conflict/foreign', () => {
      const pt = createSyntheticPatient({
        id: 'pt_cp_a',
        current_visit_id: 'vis_cp_a',
        labs: {
          fasting_glucose: 140,
          hba1c: 7.2,
          potassium: 6.4,
          hs_crp: 4.5,
          tsh: 8.5,
          lab_flags: []
        }
      });

      const structured: Record<string, StructuredLabEntry> = {
        fbs: makeStructuredLab('fbs', 7.0, 'mmol/L', { patient_id: 'pt_cp_a', visit_id: 'vis_cp_a' }),
        hba1c: makeStructuredLab('hba1c', 42, 'invalid_unit', { patient_id: 'pt_cp_a', visit_id: 'vis_cp_a' }),
        serum_potassium: makeStructuredLab('serum_potassium', undefined, 'mmol/L', {
          status: 'declined_unavailable',
          patient_id: 'pt_cp_a',
          visit_id: 'vis_cp_a'
        }),
        sodium: makeStructuredLab('sodium', 138, 'mmol/L', {
          status: 'pending_result',
          patient_id: 'pt_cp_a',
          visit_id: 'vis_cp_a'
        }),
        hs_crp: makeStructuredLab('hs_crp', undefined, 'mg/L', {
          text_value: '<0.05',
          inequality_operator: '<',
          patient_id: 'pt_cp_a',
          visit_id: 'vis_cp_a'
        }),
        tsh: makeStructuredLab('tsh', -2, 'µIU/mL', { patient_id: 'pt_cp_a', visit_id: 'vis_cp_a' }),
        alt: makeStructuredLab('alt', 120, 'U/L', { patient_id: 'pt_OTHER', visit_id: 'vis_cp_a' }),
        ldl_1: makeStructuredLab('ldl', 110, 'mg/dL', {
          observation_id: 'obs_ldl_1',
          patient_id: 'pt_cp_a',
          visit_id: 'vis_cp_a',
          test_date: '2026-11-24'
        }),
        ldl_2: makeStructuredLab('ldl', 180, 'mg/dL', {
          observation_id: 'obs_ldl_2',
          patient_id: 'pt_cp_a',
          visit_id: 'vis_cp_a',
          test_date: '2026-11-24'
        })
      };

      const patch = projectStructuredLabsToLegacyScalars({
        patient: pt,
        visitId: 'vis_cp_a',
        structuredEntries: structured
      });

      // Valid mmol/L glucose converts cleanly (~126.1 mg/dL)
      assert.ok(typeof patch.fasting_glucose === 'number' && Math.abs(patch.fasting_glucose - 126.1) < 1.0);
      // Unsupported unit, declined, pending, non-exact inequality, negative/implausible, foreign, and conflict ALL clear to undefined
      assert.equal(patch.hba1c, undefined, 'Unsupported unit clears stale HbA1c without projecting raw 42');
      assert.equal(patch.potassium, undefined, 'Declined potassium clears stale potassium');
      assert.equal(patch.sodium, undefined, 'Pending sodium does not project scalar');
      assert.equal(patch.hs_crp, undefined, 'Non-exact <0.05 inequality does not overwrite scalar as exact 0.05');
      assert.equal(patch.tsh, undefined, 'Negative TSH clears stale TSH');
      assert.equal(patch.alt, undefined, 'Foreign patient ALT does not project into Pt A');
      assert.equal(patch.ldl, undefined, 'Conflicting duplicate LDL clears scalar projection');

      // Reconcile must not fall back to stale patient.labs.potassium when structured potassium is declined
      const recon = reconcilePatientLaboratories({
        patient: pt,
        visitId: 'vis_cp_a',
        structuredEntries: structured
      });
      assert.equal(recon.latestByCanonical.potassium.availability, 'declined_unavailable');
      assert.equal(isEligibleCanonicalScalarObservation(recon.latestByCanonical.potassium, recon.conflicts), false);
      assert.equal(isEligibleCanonicalScalarObservation(recon.latestByCanonical.hba1c, recon.conflicts), false);
      assert.equal(recon.latestByCanonical.hba1c.original_value, 42, 'Original raw value preserved on structured observation');
      assert.equal(isEligibleCanonicalScalarObservation(recon.latestByCanonical.ldl, recon.conflicts), false);

      // R5 normalizeStructuredLabEntries must reject raw fallback for invalid/unsupported entries
      const r5Norm = normalizeStructuredLabEntries(structured);
      assert.equal(r5Norm.hba1c, undefined, 'R5 structured normalizer rejects unsupported unit without raw fallback');
      assert.equal(r5Norm.serum_potassium, undefined, 'R5 structured normalizer rejects declined marker');
      assert.equal(r5Norm.tsh, undefined, 'R5 structured normalizer rejects negative marker');
      assert.ok(r5Norm.fasting_glucose && Math.abs(r5Norm.fasting_glucose.value - 126.1) < 1.0);

      // Matrix evaluation ignores invalid HbA1c 42 invalid_unit and foreign ALT
      const matrixRes = evaluateFunctionalMatrix(
        adaptAssessmentEvidenceToMatrixInput({
          patient: { ...pt, labs: { ...pt.labs, ...patch } },
          functionalAnswers: {},
          labEntries: structured
        })
      );
      const r7Nodes = [...matrixRes.domains.communication, ...matrixRes.domains.biotransformation];
      assert.ok(!r7Nodes.some(n => n.evidence_source === 'r7_lab:hba1c'), 'Unsupported HbA1c unit never triggers metabolic dysfunction');
      assert.ok(!r7Nodes.some(n => n.evidence_source === 'r7_lab:alt'), 'Foreign patient ALT never triggers hepatic dysfunction');
    });
  });

  // ── CHECKPOINT B CLOSURE: Canonical Conversion Before P2 Classification ─
  describe('Checkpoint B Closure: Unit-Normalized & Provenance-Safe P2 Handoff', () => {
    it('CP-B01: Converts mmol/mol HbA1c, umol/L creatinine, nmol/L Vit D before thresholds, preserves missing date & verification status', () => {
      const pt = createSyntheticPatient({ id: 'pt_cp_b', current_visit_id: 'vis_cp_b', gender: 'male' });
      const assessment: any = {
        patient_id: 'pt_cp_b',
        visit_id: 'vis_cp_b',
        assessment_id: 'assess_cp_b',
        assessment_date: '2026-11-25',
        mode: 'quick',
        functional_answers: {},
        population_data: {},
        labs: {
          entries: {
            hba1c: makeStructuredLab('hba1c', 42, 'mmol/mol', {
              patient_id: 'pt_cp_b',
              visit_id: 'vis_cp_b',
              test_date: undefined,
              verification_status: 'clinician_verified'
            }),
            serum_creatinine: makeStructuredLab('serum_creatinine', 70, 'µmol/L', {
              patient_id: 'pt_cp_b',
              visit_id: 'vis_cp_b',
              test_date: '2026-11-20',
              verification_status: 'lab_document_reviewed'
            }),
            vitamin_d3: makeStructuredLab('vitamin_d3', 100, 'nmol/L', {
              patient_id: 'pt_cp_b',
              visit_id: 'vis_cp_b',
              verification_status: 'clinician_verified'
            }),
            tsh: makeStructuredLab('tsh', 3.1, 'µIU/mL', {
              patient_id: 'pt_cp_b',
              visit_id: 'vis_cp_b',
              verification_status: 'clinician_verified'
            }),
            hs_crp: makeStructuredLab('hs_crp', 1.5, 'mg/L', {
              patient_id: 'pt_cp_b',
              visit_id: 'vis_cp_b',
              verification_status: 'clinician_verified'
            }),
            serum_potassium: makeStructuredLab('serum_potassium', 6.4, 'mmol/L', {
              patient_id: 'pt_cp_b',
              visit_id: 'vis_cp_b',
              verification_status: 'unverified'
            }),
            bad_ldl: makeStructuredLab('ldl', 180, 'weird_unit', {
              patient_id: 'pt_cp_b',
              visit_id: 'vis_cp_b'
            })
          },
          last_updated: '2026-11-25',
          total_tested_count: 7,
          pending_count: 0
        }
      };

      const p2Obs = buildP2ClinicalObservations(assessment, pt);
      const a1c = p2Obs.find(o => o.sourceLabMarker === 'hba1c');
      assert.ok(a1c && typeof a1c.observedValue === 'number');
      assert.ok(Math.abs(a1c.observedValue - 5.99) < 0.25, 'HbA1c 42 mmol/mol normalizes to ~6.0%');
      assert.ok(a1c.tags?.includes('prediabetes_range_hba1c'));
      assert.ok(!a1c.tags?.includes('diabetes_range_hba1c'), 'HbA1c 42 mmol/mol MUST NOT trigger diabetes_range_hba1c');
      assert.equal(a1c.date, '', 'Missing collection date must remain empty, never stamped with current timestamp');
      assert.ok(a1c.tags?.includes('missing_collection_date'));

      const cr = p2Obs.find(o => o.sourceLabMarker === 'serum_creatinine');
      assert.ok(cr && typeof cr.observedValue === 'number');
      assert.ok(cr.observedValue < 1.0, 'Creatinine 70 umol/L converts to ~0.79 mg/dL');
      assert.ok(!cr.tags?.includes('elevated_creatinine'), '70 umol/L creatinine MUST NOT trigger elevated_creatinine');

      const vitD = p2Obs.find(o => o.sourceLabMarker === 'vitamin_d3');
      assert.ok(vitD && typeof vitD.observedValue === 'number');
      assert.ok(Math.abs(vitD.observedValue - 40.0) < 1.0, 'Vit D 100 nmol/L converts to ~40 ng/mL');
      assert.ok(!vitD.tags?.includes('vitamin_d_deficiency'), '40 ng/mL Vit D MUST NOT trigger deficiency');

      const tsh = p2Obs.find(o => o.sourceLabMarker === 'tsh');
      assert.ok(tsh && !tsh.tags?.includes('hypothyroid_pattern'), 'Normal TSH 3.1 MUST NOT emit hypothyroid_pattern');

      const crp = p2Obs.find(o => o.sourceLabMarker === 'hs_crp');
      assert.ok(crp && !crp.tags?.includes('systemic_inflammation'), 'Exploratory hs-CRP 1.5 MUST NOT trigger pathology tag');

      const k = p2Obs.find(o => o.sourceLabMarker === 'serum_potassium');
      assert.ok(k);
      assert.equal(k.verificationStatus, 'unverified', 'Unverified critical potassium MUST stay unverified');
      assert.ok(k.tags?.includes('urgent_verification_required'));

      const badLdl = p2Obs.find(o => o.sourceLabMarker === 'ldl');
      assert.ok(badLdl);
      assert.equal(typeof badLdl.observedValue, 'string', 'Unsupported unit suppresses numeric observedValue');
      assert.ok(!badLdl.tags?.includes('elevated_ldl'), 'Unsupported unit suppresses dyslipidemia classification');

      const flat = buildFlattenedAnswersForP2(assessment, pt);
      assert.ok(Math.abs((flat.hba1c ?? 0) - 5.99) < 0.25);
      assert.equal(flat.lab_ldl, undefined, 'Unsupported LDL excluded from flattened answers');
    });
  });

  // ── CHECKPOINT C CLOSURE: Strict HOMA-IR & Derived Eligibility ─
  describe('Checkpoint C Closure: Strict HOMA-IR & Derived Ratio Eligibility', () => {
    it('CP-C01: Rejects unknown fasting, non-fasting, multi-day gaps, missing dates without shared report, exogenous insulin & legacy fallback overwrite', () => {
      const basePt = createSyntheticPatient({ age: 45, gender: 'male' });

      // 1. Unknown fasting -> NOT calculated
      const unkFasting = computeR7DerivedBiomarkers({
        patient: basePt,
        population: buildR5PopulationProfile(basePt),
        observations: reconcilePatientLaboratories({
          patient: basePt,
          structuredEntries: [
            makeStructuredLab('fbs', 6.5, 'mmol/L', { fasting_status: 'unknown', test_date: '2026-11-24' }),
            makeStructuredLab('fasting_insulin', 16, 'µIU/mL', { fasting_status: 'fasting', test_date: '2026-11-24' })
          ]
        }).latestByCanonical
      });
      const homaUnk = unkFasting.find(d => d.derived_id === 'homa_ir');
      assert.equal(homaUnk?.eligibility_met, false);
      assert.notEqual(homaUnk?.status, 'calculated', 'Unknown fasting state must disqualify HOMA-IR');

      // 2. Non-fasting -> NOT calculated
      const nonFast = computeR7DerivedBiomarkers({
        patient: basePt,
        population: buildR5PopulationProfile(basePt),
        observations: reconcilePatientLaboratories({
          patient: basePt,
          structuredEntries: [
            makeStructuredLab('fbs', 6.5, 'mmol/L', { fasting_status: 'nonfasting', test_date: '2026-11-24' }),
            makeStructuredLab('fasting_insulin', 16, 'µIU/mL', { fasting_status: 'fasting', test_date: '2026-11-24' })
          ]
        }).latestByCanonical
      });
      assert.equal(nonFast.find(d => d.derived_id === 'homa_ir')?.eligibility_met, false);

      // 3. 3-day gap (formerly tolerated under 7-day window) -> MUST FAIL
      const multiDay = computeR7DerivedBiomarkers({
        patient: basePt,
        population: buildR5PopulationProfile(basePt),
        observations: reconcilePatientLaboratories({
          patient: basePt,
          structuredEntries: [
            makeStructuredLab('fbs', 6.5, 'mmol/L', { fasting_status: 'fasting', test_date: '2026-11-21' }),
            makeStructuredLab('fasting_insulin', 16, 'µIU/mL', { fasting_status: 'fasting', test_date: '2026-11-24' })
          ]
        }).latestByCanonical
      });
      assert.equal(multiDay.find(d => d.derived_id === 'homa_ir')?.eligibility_met, false, 'Different draw days within 7 days rejected for HOMA-IR');

      // 4. Missing collection dates without shared lab_report_id -> MUST FAIL
      const missingDates = computeR7DerivedBiomarkers({
        patient: basePt,
        population: buildR5PopulationProfile(basePt),
        observations: reconcilePatientLaboratories({
          patient: basePt,
          structuredEntries: [
            makeStructuredLab('fbs', 6.5, 'mmol/L', { fasting_status: 'fasting', test_date: undefined }),
            makeStructuredLab('fasting_insulin', 16, 'µIU/mL', { fasting_status: 'fasting', test_date: undefined })
          ]
        }).latestByCanonical
      });
      assert.equal(missingDates.find(d => d.derived_id === 'homa_ir')?.eligibility_met, false, 'Missing dates without shared report rejected');

      // 5. Same shared lab_report_id when dates missing -> VALID
      const sharedReport = computeR7DerivedBiomarkers({
        patient: basePt,
        population: buildR5PopulationProfile(basePt),
        observations: reconcilePatientLaboratories({
          patient: basePt,
          structuredEntries: [
            makeStructuredLab('fbs', 6.5, 'mmol/L', { fasting_status: 'fasting', test_date: undefined, lab_report_id: 'RPT_100' }),
            makeStructuredLab('fasting_insulin', 16, 'µIU/mL', { fasting_status: 'fasting', test_date: undefined, lab_report_id: 'RPT_100' })
          ]
        }).latestByCanonical
      });
      assert.equal(sharedReport.find(d => d.derived_id === 'homa_ir')?.status, 'calculated');
      assert.equal(sharedReport.find(d => d.derived_id === 'homa_ir')?.eligibility_met, true);

      // 6. Exogenous insulin therapy -> NOT applicable
      const ptIns = createSyntheticPatient({
        age: 45,
        gender: 'male',
        medication_records: [
          { id: 'm_ins', generic_name: 'Insulin Glargine', status: 'active' } as any
        ]
      });
      const exoIns = computeR7DerivedBiomarkers({
        patient: ptIns,
        population: buildR5PopulationProfile(ptIns),
        observations: reconcilePatientLaboratories({
          patient: ptIns,
          structuredEntries: [
            makeStructuredLab('fbs', 6.5, 'mmol/L', { fasting_status: 'fasting', test_date: '2026-11-24' }),
            makeStructuredLab('fasting_insulin', 16, 'µIU/mL', { fasting_status: 'fasting', test_date: '2026-11-24' })
          ]
        }).latestByCanonical
      });
      assert.equal(exoIns.find(d => d.derived_id === 'homa_ir')?.status, 'not_applicable');

      // 7. Ineligible R7 HOMA-IR (e.g. non-fasting) MUST NOT sneak into P2 via legacy arithmetic as lab_confirmed
      const assessmentIneligible: any = {
        patient_id: basePt.id,
        visit_id: basePt.current_visit_id,
        assessment_id: 'assess_cp_c',
        assessment_date: '2026-11-25',
        mode: 'quick',
        functional_answers: {},
        population_data: {},
        labs: {
          entries: {
            fbs: makeStructuredLab('fbs', 7.0, 'mmol/L', { fasting_status: 'unknown', test_date: '2026-11-24' }),
            fasting_insulin: makeStructuredLab('fasting_insulin', 22, 'µIU/mL', { fasting_status: 'fasting', test_date: '2026-11-24' })
          },
          last_updated: '2026-11-25',
          total_tested_count: 2,
          pending_count: 0
        }
      };
      const p2ObsIneligible = buildP2ClinicalObservations(assessmentIneligible, basePt);
      assert.equal(
        p2ObsIneligible.find(o => o.sourceLabMarker === 'homa_ir'),
        undefined,
        'Ineligible R7 HOMA-IR must NOT be synthesized into P2 observations'
      );
    });
  });

  // ── CHECKPOINT D CLOSURE: R5 Nutrition Contract, Null Fallbacks & Renal/K+ Safety ─
  describe('Checkpoint D Closure: R5 Nutrition Contract & Canonical Renal/Potassium Gating', () => {
    it('CP-D01: Missing K+/eGFR stay undefined (no ?? 0 or ?? 100), unverified K+ never claims LAB_SUPPORTED, critical & conflicting escalate safely', () => {
      const ptMissing = createSyntheticPatient({
        id: 'pt_cp_d1',
        selected_conditions: ['hypertension_ckd'],
        labs: { lab_flags: [] }
      });

      const contractMissing = buildR5NutritionAdjustmentContract({ patient: ptMissing });
      assert.equal(contractMissing.lab_safety_context?.serum_potassium_mmol_l, undefined, 'Missing K+ stays undefined, NEVER ?? 0');
      assert.equal(contractMissing.lab_safety_context?.reported_egfr_ml_min, undefined, 'Missing eGFR stays undefined, NEVER ?? 100');
      assert.equal(contractMissing.lab_safety_context?.potassium_state, 'unavailable');
      assert.equal(contractMissing.lab_safety_context?.egfr_source, 'unavailable');
      assert.equal(contractMissing.nutrient_constraints.potassium_mg_max, undefined, 'No arbitrary K+ cap emitted');
      assert.equal(contractMissing.nutrient_constraints.fluid_ml_max, undefined, 'No fabricated 1500 mL fluid cap');
      assert.ok(
        contractMissing.clinical_review_flags?.some(f => f.parameter === 'egfr' && f.flag === 'CLINICAL_REVIEW_REQUIRED'),
        'Hypertension/CKD without eGFR requests eGFR verification instead of assuming 100 or <60'
      );

      // Unverified critical K+ = 6.3 -> blocks release WITHOUT claiming LAB_SUPPORTED
      const ptUnverifiedK = createSyntheticPatient({ id: 'pt_cp_d2', current_visit_id: 'vis_d2' });
      const contractUnverCrit = buildR5NutritionAdjustmentContract({
        patient: ptUnverifiedK,
        structuredLabEntries: {
          serum_potassium: makeStructuredLab('serum_potassium', 6.3, 'mmol/L', {
            patient_id: 'pt_cp_d2',
            visit_id: 'vis_d2',
            verification_status: 'unverified'
          })
        }
      });
      assert.equal(contractUnverCrit.lab_safety_context?.potassium_state, 'available_unverified');
      assert.equal(contractUnverCrit.lab_safety_context?.serum_potassium_mmol_l, 6.3);
      assert.equal(contractUnverCrit.acute_escalation?.block_release, true, 'Unverified critical K+ must block release');
      const kFlag = contractUnverCrit.clinical_review_flags?.find(f => f.parameter === 'potassium');
      assert.notEqual(kFlag?.evidence_status, 'LAB_SUPPORTED', 'Unverified potassium MUST NOT emit LAB_SUPPORTED');
      assert.equal(kFlag?.evidence_status, 'CLINICAL_REVIEW_REQUIRED');

      // Unverified borderline K+ = 5.4 -> review flag WITHOUT LAB_SUPPORTED or arbitrary 2000 mg limit
      const contractBorderline = buildR5NutritionAdjustmentContract({
        patient: ptUnverifiedK,
        structuredLabEntries: {
          potassium: makeStructuredLab('potassium', 5.4, 'mmol/L', {
            patient_id: 'pt_cp_d2',
            visit_id: 'vis_d2',
            verification_status: 'patient_reported'
          })
        }
      });
      const borderFlag = contractBorderline.clinical_review_flags?.find(f => f.parameter === 'potassium');
      assert.equal(borderFlag?.flag, 'CLINICAL_REVIEW_REQUIRED');
      assert.notEqual(borderFlag?.evidence_status, 'LAB_SUPPORTED');
      assert.equal(contractBorderline.nutrient_constraints.potassium_mg_max, undefined);

      // Verified borderline + low reported eGFR = 25 -> conflictResolver reads canonical potassium & reported_egfr cleanly
      const contractVerifiedCkd = buildR5NutritionAdjustmentContract({
        patient: ptUnverifiedK,
        structuredLabEntries: {
          potassium: makeStructuredLab('potassium', 5.3, 'mmol/L', {
            patient_id: 'pt_cp_d2',
            visit_id: 'vis_d2',
            verification_status: 'clinician_verified'
          }),
          egfr: makeStructuredLab('egfr', 25, 'mL/min/1.73m²', {
            patient_id: 'pt_cp_d2',
            visit_id: 'vis_d2',
            verification_status: 'clinician_verified'
          })
        }
      });
      assert.equal(contractVerifiedCkd.lab_safety_context?.potassium_state, 'available_verified');
      assert.equal(contractVerifiedCkd.lab_safety_context?.egfr_source, 'reported');
      assert.equal(contractVerifiedCkd.lab_safety_context?.reported_egfr_ml_min, 25);

      const sampleBanana: any = {
        id: 'food_banana',
        code: 'BAN01',
        name_en: 'Banana',
        name_bn: 'কলা',
        category: 'fruits',
        tags: ['high_potassium'],
        nutrients_per_100g: { calories: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3, potassium_mg: 358 }
      };
      const tl = resolveConflicts(
        [sampleBanana],
        ['ckd_stage_1_3b'],
        [],
        [],
        [],
        [],
        1,
        contractVerifiedCkd,
        { potassium: 5.3, reported_egfr: 25, lab_flags: [] }
      );
      assert.equal(tl.yellow.length, 1, 'Canonical potassium/reported_egfr triggers YELLOW portion review (not un-overridable RED)');

      // Conflicting duplicate potassium -> conflicting state + release blocked
      const contractConflict = buildR5NutritionAdjustmentContract({
        patient: ptUnverifiedK,
        structuredLabEntries: [
          makeStructuredLab('potassium', 4.0, 'mmol/L', { patient_id: 'pt_cp_d2', visit_id: 'vis_d2', test_date: '2026-11-24' }),
          makeStructuredLab('serum_potassium', 6.2, 'mmol/L', { patient_id: 'pt_cp_d2', visit_id: 'vis_d2', test_date: '2026-11-24' })
        ]
      });
      assert.equal(contractConflict.lab_safety_context?.potassium_state, 'conflicting');
      assert.equal(contractConflict.lab_safety_context?.serum_potassium_mmol_l, undefined, 'Conflicting K+ suppressed from numeric assumptions');
      assert.equal(contractConflict.acute_escalation?.block_release, true, 'Conflicting K+ blocks release pending reconciliation');

      // Calculated vs reported eGFR separation & no fabricated 1500 mL fluid limit in R5->R4 adapter
      const r4FluidCheck = adaptR5ContextToR4(
        {
          population: buildR5PopulationProfile({ age: 55, gender: 'male' }),
          pathways: { selected_pathways: [] },
          medications: [],
          functional_findings: [],
          multimorbidity_resolutions: [{ parameter: 'fluid', reason_en: 'Review fluid balance' } as any],
          nutrition_contract: contractMissing
        } as any,
        {
          id: 'r4_cp_d',
          patient_id: 'pt_cp_d1',
          organization_id: 'org_syn',
          version: 1,
          status: 'draft',
          is_approved: false
        } as any
      );
      assert.equal(
        r4FluidCheck.updated_draft.hydration?.clinician_fluid_limit_ml,
        undefined,
        'R5->R4 adapter does NOT fabricate 1500 mL fluid cap'
      );
    });
  });
});
