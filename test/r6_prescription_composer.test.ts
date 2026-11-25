/**
 * SHUDDHO Phase R6 — Master Prescription Composer Unit Tests
 * 
 * Comprehensive Test Suite covering Stages A–H:
 * 1. 6-Column Chronological Medication & Supplementation Protocol (10 Mandated Scenarios)
 * 2. Fasting Safety Evaluation & Hypoglycemia Safeguards
 * 3. Bangladeshi Food Exchange & Household Portion Guide
 * 4. Patient-Specific Food Exchange Generator (Allergen, Disallowed & Red Exclusions)
 * 5. Lifestyle Support Integration (Approved R4 Protocols vs Unprescribed Defaults)
 * 6. Master Prescription Composition, Dual Report Delegation & Release Gating
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  compose6ColumnMedicationProtocol,
  evaluateFastingSafety,
  STANDARD_BANGLADESHI_EXCHANGES,
  buildPatientSpecificFoodExchanges,
  composeR6Prescription
} from '../src/engine/r6PrescriptionComposer';

import { R5MedicationRecord } from '../src/types/r5Systems';
import { R4ProtocolStudioData, SupplementProtocolItem } from '../src/types/r4Protocol';
import { buildPatientReportProjection } from '../src/engine/reports/dualReportEngine';
import { PatientProfile, WeeklyDietPlan } from '../src/types';

describe('Phase R6 — Master Prescription Composer Engine', () => {

  // ── 1. 6-Column Chronological Medication Protocol (10 Mandated Scenarios) ──
  describe('1. 6-Column Chronological Medication Protocol', () => {

    // Scenario 1: Verified medication once daily
    it('Scenario 1: Verified medication once daily preserves duration, formats dose, active status', () => {
      const meds: R5MedicationRecord[] = [
        {
          id: 'med_atorva',
          generic_name: 'Atorvastatin',
          brand_name: 'Lipitor 20',
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
          source: 'clinician_entry',
          duration: '3 months',
          duration_bn: '৩ মাস',
          notes: 'Take at bedtime'
        }
      ];

      const protocol = compose6ColumnMedicationProtocol(meds, []);
      assert.strictEqual(protocol.active_rows.length, 1);
      const row = protocol.active_rows[0];
      assert.strictEqual(row.sequence_time, '21:00');
      assert.strictEqual(row.generic_name, 'Atorvastatin');
      assert.strictEqual(row.brand_name, 'Lipitor 20');
      assert.ok(row.dosage_display_bn.includes('২০'));
      assert.strictEqual(row.duration_en, '3 months');
      assert.strictEqual(row.duration_bn, '৩ মাস');
      assert.strictEqual(row.approval_status, 'prescribed_approved');
      assert.strictEqual(row.requires_clinician_verification, false);
    });

    // Scenario 2: Twice-daily medication
    it('Scenario 2: Twice-daily medication generates distinct chronological rows for each dose', () => {
      const meds: R5MedicationRecord[] = [
        {
          id: 'med_metformin',
          generic_name: 'Metformin Hydrochloride',
          brand_name: 'Comet 500',
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
          source: 'clinician_entry',
          duration: 'Ongoing',
          duration_bn: 'চলমান'
        }
      ];

      const protocol = compose6ColumnMedicationProtocol(meds, []);
      assert.strictEqual(protocol.active_rows.length, 2);
      assert.strictEqual(protocol.active_rows[0].sequence_time, '08:00');
      assert.strictEqual(protocol.active_rows[1].sequence_time, '20:00');
      assert.strictEqual(protocol.active_rows[0].generic_name, 'Metformin Hydrochloride');
      assert.strictEqual(protocol.active_rows[1].generic_name, 'Metformin Hydrochloride');
      assert.ok(protocol.active_rows[0].dosage_display_bn.includes('৫০০ মিগ্রা'));
      assert.ok(protocol.active_rows[1].dosage_display_bn.includes('৫০০ মিগ্রা'));
    });

    // Scenario 3: Two approved supplements from R4 protocol
    it('Scenario 3: Two approved supplements from R4 protocol appear in active rows with elemental dose and timing', () => {
      const approvedSupplements: SupplementProtocolItem[] = [
        {
          id: 'supp_d3',
          brand_name: 'D-Rise 2000',
          generic_nutrient: 'Cholecalciferol (Vitamin D3)',
          chemical_form: 'Cholecalciferol',
          brand_verification_status: 'verified_bd_market',
          indication_en: 'Vitamin D deficiency',
          indication_bn: 'ভিটামিন ডি ঘাটতি',
          evidence_category: 'evidence_based',
          total_compound_dose: '2000 IU',
          frequency: 'once_daily',
          administration_time: '08:30',
          relationship_to_food: 'with_fatty_meal',
          duration_weeks: 12,
          monitoring_parameters: ['Serum 25(OH)D'],
          contraindications: ['Hypercalcemia'],
          known_interactions: [],
          approval_status: 'clinician_approved',
          source: 'condition_targeted',
          clinician_rationale: 'Correct vitamin D deficiency'
        },
        {
          id: 'supp_mag',
          brand_name: 'MagEZ 200',
          generic_nutrient: 'Magnesium Bisglycinate',
          chemical_form: 'Bisglycinate chelate',
          brand_verification_status: 'verified_bd_market',
          indication_en: 'Sleep support',
          indication_bn: 'ঘুমের সহায়তা',
          evidence_category: 'clinical_guideline',
          total_compound_dose: '200 mg elemental Mg',
          frequency: 'once_daily',
          administration_time: '21:30',
          relationship_to_food: 'before_bed',
          duration_weeks: 8,
          monitoring_parameters: ['Renal function'],
          contraindications: ['Severe renal impairment'],
          known_interactions: [],
          approval_status: 'clinician_approved',
          source: 'clinician_manual_entry',
          clinician_rationale: 'Sleep onset and muscle relaxation'
        }
      ];

      const authorizedR4 = {
        id: 'r4_scen3',
        patient_id: 'pt_scen3',
        visit_id: 'vis_scen3',
        organization_id: 'org_test',
        version: 1,
        status: 'active',
        is_approved: true,
        approved_by: 'Dr. Test Clinician',
        approved_at: '2026-11-25T09:00:00Z',
        supplements: approvedSupplements
      } as unknown as R4ProtocolStudioData;

      const protocol = compose6ColumnMedicationProtocol(
        [],
        approvedSupplements,
        [],
        authorizedR4,
        { patientId: 'pt_scen3', visitId: 'vis_scen3' }
      );
      assert.strictEqual(protocol.active_rows.length, 2);
      assert.strictEqual(protocol.active_rows[0].sequence_time, '08:30');
      assert.strictEqual(protocol.active_rows[0].brand_name, 'D-Rise 2000');
      assert.strictEqual(protocol.active_rows[0].item_type, 'supplement');
      assert.strictEqual(protocol.active_rows[0].approval_status, 'prescribed_approved');

      assert.strictEqual(protocol.active_rows[1].sequence_time, '21:30');
      assert.strictEqual(protocol.active_rows[1].brand_name, 'MagEZ 200');
      assert.strictEqual(protocol.active_rows[1].item_type, 'supplement');
      assert.strictEqual(protocol.active_rows[1].approval_status, 'prescribed_approved');
    });

    // Scenario 4: One unapproved supplement
    it('Scenario 4: One unapproved supplement remains strictly in draft_candidates and omitted from active_rows', () => {
      const unapprovedSupplements: SupplementProtocolItem[] = [
        {
          id: 'supp_berberine',
          brand_name: 'Berberine HCI',
          generic_nutrient: 'Berberine Hydrochloride',
          chemical_form: 'HCl',
          brand_verification_status: 'imported',
          indication_en: 'Insulin resistance candidate',
          indication_bn: 'ইনসুলিন রেজিস্ট্যান্স বিকল্প',
          evidence_category: 'review_required',
          total_compound_dose: '500 mg',
          frequency: 'once_daily',
          administration_time: '08:00',
          relationship_to_food: 'with_breakfast',
          duration_weeks: 4,
          monitoring_parameters: ['Liver enzymes'],
          contraindications: ['Pregnancy'],
          known_interactions: ['CYP3A4 substrates'],
          approval_status: 'draft_candidate', // unapproved
          source: 'dni_auto_candidate',
          clinician_rationale: 'AMPK activation candidate'
        }
      ];

      const protocol = compose6ColumnMedicationProtocol([], unapprovedSupplements);
      assert.strictEqual(protocol.active_rows.length, 0, 'Unapproved supplement must NOT be in active_rows');
      assert.strictEqual(protocol.draft_candidates.length, 1, 'Unapproved supplement must be in draft_candidates');
      assert.strictEqual(protocol.draft_candidates[0].approval_status, 'draft_candidate');
      assert.strictEqual(protocol.draft_candidates[0].brand_name, 'Berberine HCI');
    });

    // Scenario 5: Unknown medication dosage
    it('Scenario 5: Unknown medication dosage flags as Dose Pending (Review required), never inferred', () => {
      const meds: R5MedicationRecord[] = [
        {
          id: 'med_lisinopril',
          generic_name: 'Lisinopril',
          brand_name: 'Prinivil',
          prescribed_dose: '', // missing dose
          dose_unit: 'mg',
          frequency: 'Once daily morning',
          route: 'Oral',
          administration_times: ['08:00'],
          is_timing_unknown: false,
          relationship_to_meals: 'independent_of_meals',
          is_prn: false,
          status: 'active',
          verification_status: 'clinician_verified',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        }
      ];

      const protocol = compose6ColumnMedicationProtocol(meds, []);
      assert.strictEqual(protocol.active_rows.length, 0, 'Missing-dose medication must not enter verified active_rows');
      assert.strictEqual(protocol.pending_verification_rows.length, 1);
      assert.strictEqual(protocol.pending_verification_rows[0].dosage_display_en, 'Dose Pending (Review required)');
      assert.ok(protocol.pending_verification_rows[0].dosage_display_bn.includes('ডোজ নির্ধারণ বাকি'));
    });

    // Scenario 6: Unknown timing
    it('Scenario 6: Unknown timing placed in pending_verification_rows with UNKNOWN sequence time and clinical review warning', () => {
      const meds: R5MedicationRecord[] = [
        {
          id: 'med_amlodipine',
          generic_name: 'Amlodipine',
          brand_name: 'Amdocal 5',
          prescribed_dose: '5 mg',
          dose_unit: 'mg',
          frequency: 'Once daily',
          route: 'Oral',
          administration_times: [],
          is_timing_unknown: true,
          relationship_to_meals: 'independent_of_meals',
          is_prn: false,
          status: 'active',
          verification_status: 'clinician_verified',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        },
        {
          id: 'med_omeprazole',
          generic_name: 'Omeprazole',
          brand_name: 'Seclo 20',
          prescribed_dose: '20 mg',
          dose_unit: 'mg',
          frequency: 'Morning before meal',
          route: 'Oral',
          administration_times: ['07:30'],
          is_timing_unknown: false,
          relationship_to_meals: 'before_meal_empty_stomach',
          is_prn: false,
          status: 'active',
          verification_status: 'clinician_verified',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        }
      ];

      const protocol = compose6ColumnMedicationProtocol(meds, []);
      assert.strictEqual(protocol.active_rows.length, 1);
      assert.strictEqual(protocol.active_rows[0].sequence_time, '07:30');
      assert.strictEqual(protocol.pending_verification_rows.length, 1);
      assert.strictEqual(protocol.pending_verification_rows[0].sequence_time, 'UNKNOWN');
      assert.ok(protocol.pending_verification_rows[0].clinical_instructions_bn.includes('সময় নির্ধারণ'));
    });

    // Scenario 7: PRN medication
    it('Scenario 7: Verified PRN medication is accepted in active_rows while UNKNOWN timing stays in pending verification', () => {
      const meds: R5MedicationRecord[] = [
        {
          id: 'med_unknown',
          generic_name: 'Amlodipine',
          brand_name: 'Amdocal',
          prescribed_dose: '5 mg',
          dose_unit: 'mg',
          frequency: 'Daily',
          route: 'Oral',
          administration_times: [],
          is_timing_unknown: true,
          relationship_to_meals: 'independent_of_meals',
          is_prn: false,
          status: 'active',
          verification_status: 'clinician_verified',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        },
        {
          id: 'med_prn_paracetamol',
          generic_name: 'Paracetamol',
          brand_name: 'Napa 500',
          prescribed_dose: '500 mg',
          dose_unit: 'mg',
          frequency: 'As needed for headache',
          route: 'Oral',
          administration_times: [],
          is_timing_unknown: false,
          relationship_to_meals: 'after_meal',
          is_prn: true,
          status: 'active',
          verification_status: 'clinician_verified',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        },
        {
          id: 'med_scheduled',
          generic_name: 'Levothyroxine Sodium',
          brand_name: 'Thyrox 50',
          prescribed_dose: '50 mcg',
          dose_unit: 'mcg',
          frequency: 'Morning',
          route: 'Oral',
          administration_times: ['06:30'],
          is_timing_unknown: false,
          relationship_to_meals: 'before_meal_empty_stomach',
          is_prn: false,
          status: 'active',
          verification_status: 'clinician_verified',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        }
      ];

      const protocol = compose6ColumnMedicationProtocol(meds, []);
      assert.strictEqual(protocol.active_rows.length, 2);
      // Order in active_rows: 06:30 (Scheduled) -> PRN
      assert.strictEqual(protocol.active_rows[0].sequence_time, '06:30');
      assert.strictEqual(protocol.active_rows[1].sequence_time, 'PRN');
      assert.strictEqual(protocol.active_rows[1].is_prn, true);
      // Unknown time stays in pending_verification_rows
      assert.strictEqual(protocol.pending_verification_rows.length, 1);
      assert.strictEqual(protocol.pending_verification_rows[0].sequence_time, 'UNKNOWN');
    });

    // Scenario 8: Drug–supplement timing conflict / separation
    it('Scenario 8: Drug-supplement timing separation (Levothyroxine 06:30 vs Calcium 08:30) preserves separate rows', () => {
      const meds: R5MedicationRecord[] = [
        {
          id: 'med_thyrox',
          generic_name: 'Levothyroxine Sodium',
          brand_name: 'Thyrox 50',
          prescribed_dose: '50 mcg',
          dose_unit: 'mcg',
          frequency: 'Morning empty stomach',
          route: 'Oral',
          administration_times: ['06:30'],
          is_timing_unknown: false,
          relationship_to_meals: 'before_meal_empty_stomach',
          is_prn: false,
          status: 'active',
          verification_status: 'clinician_verified',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        }
      ];

      const supps: SupplementProtocolItem[] = [
        {
          id: 'supp_calcium',
          brand_name: 'Calbo D',
          generic_nutrient: 'Calcium Carbonate + Vitamin D3',
          chemical_form: 'Carbonate',
          brand_verification_status: 'verified_bd_market',
          indication_en: 'Bone density support',
          indication_bn: 'হাড়ের সুরক্ষা',
          evidence_category: 'clinical_guideline',
          total_compound_dose: '500 mg Ca',
          frequency: 'once_daily',
          administration_time: '08:30',
          relationship_to_food: 'with_breakfast',
          duration_weeks: 12,
          monitoring_parameters: ['Serum calcium'],
          contraindications: ['Hypercalcemia'],
          known_interactions: ['Levothyroxine'],
          approval_status: 'clinician_approved',
          source: 'condition_targeted',
          clinician_rationale: 'Bone density support'
        }
      ];

      const authorizedR4 = {
        id: 'r4_scen8',
        patient_id: 'pt_scen8',
        visit_id: 'vis_scen8',
        organization_id: 'org_test',
        version: 1,
        status: 'active',
        is_approved: true,
        approved_by: 'Dr. Test Clinician',
        approved_at: '2026-11-25T09:00:00Z',
        supplements: supps
      } as unknown as R4ProtocolStudioData;

      const protocol = compose6ColumnMedicationProtocol(
        meds,
        supps,
        [],
        authorizedR4,
        { patientId: 'pt_scen8', visitId: 'vis_scen8' }
      );
      assert.strictEqual(protocol.active_rows.length, 2);
      assert.strictEqual(protocol.active_rows[0].sequence_time, '06:30');
      assert.strictEqual(protocol.active_rows[0].generic_name, 'Levothyroxine Sodium');
      assert.strictEqual(protocol.active_rows[1].sequence_time, '08:30');
      assert.strictEqual(protocol.active_rows[1].brand_name, 'Calbo D');
    });

    // Scenario 9: Discontinued medication
    it('Scenario 9: Discontinued medication is strictly excluded from active_rows', () => {
      const meds: R5MedicationRecord[] = [
        {
          id: 'med_active',
          generic_name: 'Metformin Hydrochloride',
          brand_name: 'Comet 500',
          prescribed_dose: '500 mg',
          dose_unit: 'mg',
          frequency: 'Morning',
          route: 'Oral',
          administration_times: ['08:00'],
          is_timing_unknown: false,
          relationship_to_meals: 'with_meal',
          is_prn: false,
          status: 'active',
          verification_status: 'clinician_verified',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        },
        {
          id: 'med_disc',
          generic_name: 'Sitagliptin',
          brand_name: 'Januvia 50',
          prescribed_dose: '50 mg',
          dose_unit: 'mg',
          frequency: 'Morning',
          route: 'Oral',
          administration_times: ['08:00'],
          is_timing_unknown: false,
          relationship_to_meals: 'with_meal',
          is_prn: false,
          status: 'discontinued', // discontinued!
          verification_status: 'clinician_verified',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        }
      ];

      const protocol = compose6ColumnMedicationProtocol(meds, []);
      assert.strictEqual(protocol.active_rows.length, 1);
      assert.strictEqual(protocol.active_rows[0].generic_name, 'Metformin Hydrochloride');
      assert.strictEqual(protocol.active_rows.some(r => r.generic_name === 'Sitagliptin'), false);
    });

    // Scenario 10: Cross-patient isolation
    it('Scenario 10: Cross-patient isolation guarantees Patient A medications do not leak into Patient B', () => {
      const patientAMeds: R5MedicationRecord[] = [
        {
          id: 'med_patient_a_insulin',
          generic_name: 'Insulin Glargine',
          brand_name: 'Lantus',
          prescribed_dose: '14 units',
          dose_unit: 'units',
          frequency: 'Bedtime',
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

      const patientBMeds: R5MedicationRecord[] = [
        {
          id: 'med_patient_b_levo',
          generic_name: 'Levothyroxine Sodium',
          brand_name: 'Thyrox 25',
          prescribed_dose: '25 mcg',
          dose_unit: 'mcg',
          frequency: 'Morning',
          route: 'Oral',
          administration_times: ['06:30'],
          is_timing_unknown: false,
          relationship_to_meals: 'before_meal_empty_stomach',
          is_prn: false,
          status: 'active',
          verification_status: 'clinician_verified',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        }
      ];

      const protocolA = compose6ColumnMedicationProtocol(patientAMeds, []);
      const protocolB = compose6ColumnMedicationProtocol(patientBMeds, []);

      assert.strictEqual(protocolA.active_rows.length, 1);
      assert.strictEqual(protocolA.active_rows[0].generic_name, 'Insulin Glargine');
      assert.strictEqual(protocolB.active_rows.length, 1);
      assert.strictEqual(protocolB.active_rows[0].generic_name, 'Levothyroxine Sodium');
      assert.strictEqual(protocolB.active_rows.some(r => r.generic_name === 'Insulin Glargine'), false);
    });
  });

  // ── 2. Fasting Safety Evaluation ────────────────────────────────────
  describe('2. Fasting Safety Evaluation', () => {
    it('approves gentle 12:12 circadian fasting for non-insulin patient', () => {
      const evaluation = evaluateFastingSafety({
        is_fasting: true,
        fasting_schedule: '12_12',
        eating_window_start: '08:00',
        eating_window_end: '20:00'
      }, [], false);

      assert.strictEqual(evaluation.is_safe_for_medication_regimen, true);
      assert.strictEqual(evaluation.fasting_hours, 12);
      assert.strictEqual(evaluation.safety_warnings_bn.length, 0);
    });

    it('flags prolonged fasting (16:8) on Insulin as contraindicated with hypoglycemia safeguards', () => {
      const evaluation = evaluateFastingSafety({
        is_fasting: true,
        fasting_schedule: '16_8',
        eating_window_start: '12:00',
        eating_window_end: '20:00'
      }, [], true); // insulin active = true

      assert.strictEqual(evaluation.is_safe_for_medication_regimen, false);
      assert.strictEqual(evaluation.fasting_hours, 16);
      assert.ok(evaluation.safety_warnings_bn.some(w => w.includes('ইনসুলিন') || w.includes('হাইপোগ্লাইসেমিয়া')));
      assert.ok(evaluation.hypoglycemia_precautions_bn);
    });

    it('flags prolonged fasting on Sulfonylurea (Glimepiride) with hypoglycemia precaution', () => {
      const meds: R5MedicationRecord[] = [
        {
          id: 'med_su',
          generic_name: 'Glimepiride',
          brand_name: 'Amaryl 1',
          prescribed_dose: '1 mg',
          dose_unit: 'mg',
          frequency: 'Once daily before breakfast',
          route: 'Oral',
          administration_times: ['07:45'],
          is_timing_unknown: false,
          relationship_to_meals: 'before_meal_empty_stomach',
          is_prn: false,
          status: 'active',
          verification_status: 'clinician_verified',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        }
      ];

      const evaluation = evaluateFastingSafety({
        is_fasting: true,
        fasting_schedule: '16_8'
      }, meds, false);

      assert.strictEqual(evaluation.is_safe_for_medication_regimen, false);
      assert.ok(evaluation.safety_warnings_bn.some(w => w.includes('সালফোনাইলইউরিয়া') || w.includes('শর্করার')));
    });
  });

  // ── 3. Bangladeshi Food Exchange & Household Measures ───────────────
  describe('3. Bangladeshi Food Exchange & Household Measures', () => {
    it('provides standard Bangladeshi household measures (Bati, Cup, Glass, Spoon, Piece, Palm)', () => {
      assert.ok(STANDARD_BANGLADESHI_EXCHANGES.length >= 6);
      const units = STANDARD_BANGLADESHI_EXCHANGES.map(e => e.local_measure_unit);
      assert.ok(units.includes('bati'));
      assert.ok(units.includes('cup'));
      assert.ok(units.includes('glass'));
      assert.ok(units.includes('spoon'));
      assert.ok(units.includes('piece'));
      assert.ok(units.includes('palm'));
    });

    it('contains accurate raw to cooked conversion ratios for staples', () => {
      const riceExchange = STANDARD_BANGLADESHI_EXCHANGES.find(e => e.exchange_group === 'grains');
      assert.ok(riceExchange);
      assert.strictEqual(riceExchange.standard_raw_weight_g, 30);
      assert.strictEqual(riceExchange.standard_cooked_weight_g, 80);
      assert.ok(riceExchange.raw_to_cooked_conversion_note_bn.includes('কাঁচা চাল ৩০ গ্রাম'));
    });
  });

  // ── 4. Stage D: Patient-Specific Food Exchange Generator ────────────
  describe('4. Stage D: Patient-Specific Food Exchange Generator', () => {
    const mockPatient: Partial<PatientProfile> = {
      id: 'p_exchange_01',
      name: 'Mr. Rafiqul Islam',
      confirmed_allergies: ['shrimp', 'peanut'],
      clinician_disallowed_foods: ['bitter gourd', 'beef']
    };

    const mockDietPlan: Partial<WeeklyDietPlan> = {
      days: [
        {
          day_number: 1,
          day_name_bn: '১ম দিন',
          day_name_en: 'Day 1',
          safety_decision: 'SAFE',
          meals: [
            {
              meal_type: 'breakfast',
              title_bn: 'সকালের নাস্তা',
              title_en: 'Breakfast',
              target_time: '08:30',
              items: [
                {
                  id: 'f_01_0012',
                  food_name_bn: 'চাল,BR-28,মাঝারি দানা,সিদ্ধ,কলে ছাঁটা',
                  food_name_en: 'Rice, BR-28, parboiled, milled, raw',
                  raw_weight_g: 60,
                  cooked_display_bn: '১ বাটি',
                  cooked_display_en: '1 bati',
                  prep_note_bn: 'সিদ্ধ ভাত',
                  prep_note_en: 'Boiled',
                  traffic_status: 'GREEN',
                  alternatives: []
                }
              ]
            }
          ]
        } as any
      ]
    };

    it('extracts prescribed meal foods and generates valid alternatives within same exchange group', () => {
      const exchanges = buildPatientSpecificFoodExchanges(
        mockDietPlan as any,
        { green: [], yellow: [], red: [] },
        mockPatient as any
      );

      assert.ok(exchanges.length > 0, 'Must produce at least one patient-specific food exchange');
      const first = exchanges[0];
      assert.strictEqual(first.exchange_group, 'grains');
      assert.ok(first.original_food_name_en.includes('Rice'));
      assert.ok(first.alternative_food_name_bn.length > 0);
      assert.ok(first.prescribed_household_portion_bn.includes('বাটি') || first.prescribed_household_portion_bn.includes('কাপ'));
    });

    it('strictly excludes confirmed allergens and clinician disallowed foods from alternatives', () => {
      const exchanges = buildPatientSpecificFoodExchanges(
        mockDietPlan as any,
        { green: [], yellow: [], red: [] },
        mockPatient as any
      );

      for (const ex of exchanges) {
        const altEn = ex.alternative_food_name_en.toLowerCase();
        const altBn = ex.alternative_food_name_bn.toLowerCase();
        assert.strictEqual(altEn.includes('shrimp') || altBn.includes('চিংড়ি'), false, 'Allergen shrimp must be excluded');
        assert.strictEqual(altEn.includes('peanut') || altBn.includes('বাদাম'), false, 'Allergen peanut must be excluded');
        assert.strictEqual(altEn.includes('bitter gourd') || altBn.includes('করলা'), false, 'Disallowed bitter gourd must be excluded');
        assert.strictEqual(altEn.includes('beef') || altBn.includes('গরুর মাংস'), false, 'Disallowed beef must be excluded');
      }
    });

    it('strictly excludes RED foods from traffic light', () => {
      const redFoods = [
        { id: 'rice_white', name_en: 'White Rice', name_bn: 'সাদা চালের ভাত' },
        { id: 'roti_white_flour', name_en: 'White flour roti', name_bn: 'ময়দার রুটি' }
      ];

      const exchanges = buildPatientSpecificFoodExchanges(
        mockDietPlan as any,
        { green: [], yellow: [], red: redFoods },
        mockPatient as any
      );

      for (const ex of exchanges) {
        assert.notStrictEqual(ex.alternative_food_id, 'rice_white', 'Red white rice must not be an alternative');
        assert.notStrictEqual(ex.alternative_food_id, 'roti_white_flour', 'Red white roti must not be an alternative');
      }
    });
  });

  // ── 5. Stage E: Lifestyle Protocols & Support Integration ───────────
  describe('5. Stage E: Lifestyle Protocols & Support Integration', () => {
    const mockPatient: Partial<PatientProfile> = {
      id: 'p_lifestyle_01',
      name: 'Mr. Anisur Rahman',
      confirmed_allergies: [],
      clinician_disallowed_foods: []
    };

    it('maps approved R4 hydration, exercise, and sleep without blanket advice', () => {
      const r4Protocol: Partial<R4ProtocolStudioData> = {
        id: 'proto_lifestyle_01',
        patient_id: 'p_lifestyle_01',
        version: 1,
        status: 'active',
        is_approved: true,
        approved_by: 'clin_shahriar',
        approved_at: '2026-11-25T09:00:00Z',
        hydration: {
          baseline_fluid_target_ml: 2200,
          timing_guidance_bn: 'দৈনিক ২.২ লিটার পানি নিয়মিত পান করুন।',
          timing_guidance_en: 'Drink 2.2L water daily at regular intervals.',
          is_restricted: false
        } as any,
        exercise: {
          items: [
            {
              id: 'ex_walk',
              title_en: 'Brisk Walking',
              title_bn: 'দ্রুত হাঁটা',
              frequency_per_week: 5,
              duration_minutes: 30,
              intensity: 'moderate',
              approval_status: 'approved',
              stop_conditions_bn: ['মাথা ঘোরা'],
              stop_conditions_en: ['Dizziness']
            } as any
          ]
        } as any,
        sleep: {
          target_sleep_hours: 7.5,
          bed_time: '22:30',
          wake_time: '06:00',
          caffeine_curfew_time: '14:00',
          last_meal_curfew_time: '19:30'
        } as any
      };

      const payload = composeR6Prescription({
        patient: mockPatient as any,
        r4Protocol: r4Protocol as any,
        medications: [],
        trafficLight: { green: [], yellow: [], red: [] }
      });

      assert.strictEqual(payload.lifestyle_support.hydration.is_prescribed, true);
      assert.strictEqual(payload.lifestyle_support.hydration.target_daily_ml, 2200);
      assert.strictEqual(payload.lifestyle_support.exercise.is_prescribed, true);
      assert.ok(payload.lifestyle_support.exercise.target_en.includes('Brisk Walking'));
      assert.strictEqual(payload.lifestyle_support.sleep_circadian.is_prescribed, true);
      assert.strictEqual(payload.lifestyle_support.sleep_circadian.sleep_target_hours, 7.5);
    });

    it('emits "Not individually prescribed" when lifestyle components are unprescribed', () => {
      const payload = composeR6Prescription({
        patient: mockPatient as any,
        medications: [],
        trafficLight: { green: [], yellow: [], red: [] }
      });

      assert.strictEqual(payload.lifestyle_support.hydration.is_prescribed, false);
      assert.strictEqual(payload.lifestyle_support.hydration.instructions_en, 'Not individually prescribed');
      assert.strictEqual(payload.lifestyle_support.hydration.instructions_bn, 'ব্যক্তিগতভাবে নির্ধারিত নয়');
      assert.strictEqual(payload.lifestyle_support.exercise.is_prescribed, false);
      assert.strictEqual(payload.lifestyle_support.exercise.target_en, 'Not individually prescribed');
      assert.strictEqual(payload.lifestyle_support.sleep_circadian.is_prescribed, false);
      assert.strictEqual(payload.lifestyle_support.sleep_circadian.instructions_en, 'Not individually prescribed');
    });
  });

  // ── 6. Stage A & H: Dual Report Projection & Master Prescription Release Gating ──
  describe('6. Stage A & H: Dual Report Projection & Master Prescription Release Gating', () => {
    const mockPatient: Partial<PatientProfile> = {
      id: 'p_presc_01',
      name: 'Mrs. Fatema Begum',
      age: 52,
      gender: 'female',
      current_phase: 1,
      current_visit_id: 'vis_01',
      visit_date: '2026-03-01',
      confirmed_allergies: ['Shrimp'],
      clinician_disallowed_foods: ['Bitter gourd'],
      selected_conditions: ['t2d_ir']
    };

    const mockDietPlan: any = {
      id: 'plan_01',
      patient_id: 'p_presc_01',
      visit_id: 'vis_01',
      version: 1,
      status: 'approved',
      is_approved: true,
      approved_by: 'Dr. Shahriar Ahmed, Lead Nutritionist',
      approved_at: '2026-03-01T10:00:00Z',
      approval_metadata: { plan_version: 1, clinician_name: 'Dr. Shahriar Ahmed, Lead Nutritionist' },
      days: [
        {
          day_number: 1,
          day_name_bn: '১ম দিন',
          day_name_en: 'Day 1',
          safety_decision: 'SAFE',
          meals: [
            {
              meal_type: 'breakfast',
              title_bn: 'সকালের নাস্তা',
              title_en: 'Breakfast',
              target_time: '08:30',
              items: [
                {
                  id: 'wheat_roti',
                  food_name_bn: 'লাল আটার রুটি',
                  food_name_en: 'Whole wheat roti',
                  raw_weight_g: 60,
                  cooked_display_bn: '২টি মাঝারি রুটি',
                  cooked_display_en: '2 medium rotis',
                  prep_note_bn: 'তেল ছাড়া তাওয়ায় সেঁকা',
                  prep_note_en: 'Dry roasted on tawa',
                  traffic_status: 'GREEN',
                  alternatives: []
                }
              ]
            }
          ]
        }
      ]
    };

    it('Stage A: buildPatientReportProjection delegates directly to composeR6Prescription', () => {
      const projection = buildPatientReportProjection({
        patient: mockPatient as any,
        dietChart: mockDietPlan.days[0].meals,
        weeklyDietPlan: mockDietPlan,
        trafficLight: { green: [], yellow: [], red: [] },
        medications: []
      });

      assert.strictEqual(projection.report_type, 'PATIENT_LIFESTYLE_PRESCRIPTION');
      assert.strictEqual(projection.is_released, true);
      assert.strictEqual(projection.days.length, 1);
      assert.ok(projection.medication_supplement_protocol);
      assert.ok(projection.food_exchange_guide && projection.food_exchange_guide.length >= 6);
      assert.ok(Array.isArray(projection.patient_specific_exchanges));
    });

    it('Stage H: Strictly locks release when plan is unapproved draft or dirty', () => {
      const draftPlan = {
        ...mockDietPlan,
        status: 'draft',
        is_approved: false
      };

      const payload = composeR6Prescription({
        patient: mockPatient as any,
        weeklyDietPlan: draftPlan,
        medications: [],
        trafficLight: { green: [], yellow: [], red: [] }
      });

      assert.strictEqual(payload.is_released, false);
      assert.strictEqual(payload.is_approved, false);
      assert.ok(payload.release_eligibility.blocking_reasons_en.length > 0);
      assert.ok(payload.release_eligibility.blocking_reasons_bn.length > 0);
    });

    it('Cardinal Privacy Invariant: Zero numerical calories, macro math, BMR, or TDEE in patient report', () => {
      const payload = composeR6Prescription({
        patient: mockPatient as any,
        weeklyDietPlan: mockDietPlan,
        medications: [],
        trafficLight: { green: [], yellow: [], red: [] }
      });

      const serialized = JSON.stringify(payload);
      // Ensure zero numerical kcal (e.g. 1800 kcal, 2000kcal)
      assert.strictEqual(/\b\d+\s*kcal\b/i.test(serialized), false, 'Must not contain numerical kcal');
      // Ensure zero calculated macro grams (e.g. 50g protein)
      assert.strictEqual(/\b\d+\s*g\s*(?:protein|carbohydrate|carbs|fat)\b/i.test(serialized), false, 'Must not contain calculated macro grams');
    });
  });

});
