/**
 * SHUDDHO Phase R6 — Master Prescription Composer Unit Tests
 * 
 * Verifies:
 * 1. 6-Column Chronological Medication & Supplementation Protocol
 * 2. Multi-dose drug timeline separation and UNKNOWN timing preservation
 * 3. Separation of approved medications from unapproved draft candidate supplements
 * 4. Fasting safety evaluation (Hypoglycemia safeguards for insulin/secretagogues)
 * 5. Bangladeshi Food Exchange & Household Portion Guide (Bati, Cup, Spoon, Piece, Palm)
 * 6. Master Prescription Composition and Clinical Safety Gating
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  compose6ColumnMedicationProtocol,
  evaluateFastingSafety,
  STANDARD_BANGLADESHI_EXCHANGES,
  composeR6Prescription
} from '../src/engine/r6PrescriptionComposer';

import { R5MedicationRecord } from '../src/types/r5Systems';

describe('Phase R6 — Master Prescription Composer Engine', () => {

  // ── 1. 6-Column Chronological Medication Protocol ───────────────────
  describe('1. 6-Column Chronological Medication Protocol', () => {
    it('sorts medications and supplements strictly chronologically by administration time', () => {
      const meds: R5MedicationRecord[] = [
        {
          id: 'med_statin',
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
          source: 'clinician_entry'
        },
        {
          id: 'med_thyroid',
          generic_name: 'Levothyroxine Sodium',
          brand_name: 'Thyrox 50',
          prescribed_dose: '50 mcg',
          dose_unit: 'mcg',
          frequency: 'Once daily morning',
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
      assert.strictEqual(protocol.active_rows[0].generic_name, 'Levothyroxine Sodium');
      assert.strictEqual(protocol.active_rows[0].sequence_time, '06:30');
      assert.strictEqual(protocol.active_rows[1].generic_name, 'Atorvastatin');
      assert.strictEqual(protocol.active_rows[1].sequence_time, '21:00');
    });

    it('generates distinct chronological rows for each dose of twice-daily medications', () => {
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
          source: 'clinician_entry'
        }
      ];

      const protocol = compose6ColumnMedicationProtocol(meds, []);
      assert.strictEqual(protocol.active_rows.length, 2);
      assert.strictEqual(protocol.active_rows[0].sequence_time, '08:00');
      assert.strictEqual(protocol.active_rows[1].sequence_time, '20:00');
      assert.ok(protocol.active_rows[0].dosage_display_bn.includes('৫০০ মিগ্রা'));
    });

    it('places unknown timing medications at the end with explicit clinical review warning', () => {
      const meds: R5MedicationRecord[] = [
        {
          id: 'med_unknown_time',
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
          id: 'med_known_time',
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
      assert.strictEqual(protocol.active_rows.length, 2);
      assert.strictEqual(protocol.active_rows[0].sequence_time, '07:30');
      assert.strictEqual(protocol.active_rows[1].sequence_time, 'UNKNOWN');
      assert.ok(protocol.active_rows[1].clinical_instructions_bn.includes('সময় নির্ধারণ'));
    });

    it('separates draft candidate supplements from approved medications', () => {
      const candidates = [
        {
          id: 'cand_coq10',
          name: 'Coenzyme Q10',
          name_bn: 'কোএনজাইম কিউ১০',
          dosage: '100 mg daily',
          instructions: 'Take with breakfast',
          instructions_bn: 'সকালের খাবারের সাথে সেব্য',
          clinical_rationale: 'Statin-induced myopathy risk mitigation'
        }
      ];

      const protocol = compose6ColumnMedicationProtocol([], [], candidates);
      assert.strictEqual(protocol.active_rows.length, 0);
      assert.strictEqual(protocol.draft_candidates.length, 1);
      assert.strictEqual(protocol.draft_candidates[0].approval_status, 'draft_candidate');
      assert.strictEqual(protocol.draft_candidates[0].item_type, 'candidate_supplement');
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

  // ── 4. Master Prescription Composition & Safety Gating ──────────────
  describe('4. Master Prescription Composition & Safety Gating', () => {
    const mockPatient = {
      id: 'p_presc_01',
      name: 'Mrs. Fatema Begum',
      age: 52,
      gender: 'female',
      current_phase: 1,
      current_visit_id: 'vis_01',
      visit_date: '2026-03-01',
      confirmed_allergies: ['Shrimp'],
      clinician_disallowed_foods: ['Bitter gourd']
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

    it('builds a released master prescription when plan is verified, clean, and approved', () => {
      const payload = composeR6Prescription({
        patient: mockPatient as any,
        weeklyDietPlan: mockDietPlan,
        medications: [],
        trafficLight: { green: [], yellow: [], red: [] }
      });

      assert.strictEqual(payload.is_approved, true);
      assert.strictEqual(payload.is_released, true);
      assert.strictEqual(payload.schema_version, 'R6.0');
      assert.strictEqual(payload.patient.name, 'Mrs. Fatema Begum');
      assert.strictEqual(payload.clinician.name, 'Dr. Shahriar Ahmed, Lead Nutritionist');
      assert.strictEqual(payload.dynamic_diet_chart.days.length, 1);
    });

    it('strictly locks release when plan is unapproved draft or dirty', () => {
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
      assert.ok(payload.release_eligibility.blocking_reasons_en.length > 0);
    });
  });

});
