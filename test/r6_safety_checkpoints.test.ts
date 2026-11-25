/**
 * SHUDDHO Phase R6 — Clinical Release Safety Gate Verification Suite
 *
 * Covers:
 * - Checkpoint A (A1–A10): Medication Verification Controls Patient Release
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  compose6ColumnMedicationProtocol,
  composeR6Prescription
} from '../src/engine/r6PrescriptionComposer';
import {
  validateReportReleaseEligibility,
  buildPatientReportProjection
} from '../src/engine/reports/dualReportEngine';
import { R5MedicationRecord } from '../src/types/r5Systems';
import { PatientProfile, WeeklyDietPlan } from '../src/types';

function makeApprovedPatient(id: string = 'pt_cp_a1', overrides: Partial<PatientProfile> = {}): PatientProfile {
  return {
    schema_version: 2,
    id,
    name: 'Mrs. Synthetic Checkpoint Patient',
    age: 48,
    gender: 'female',
    phone: '01711-000111',
    email: `${id}@example.com`,
    visit_date: '2026-11-25',
    current_visit_id: `vis_${id}_1`,
    current_phase: 1,
    height_cm: 156,
    weight_kg: 65,
    waist_cm: 85,
    activity_level: 'sedentary',
    sleep_hours: 7,
    shift_worker: false,
    population_group: 'adult_standard',
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: [],
    allergy_reconciliation_status: 'none_confirmed',
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    selected_conditions: ['t2d_ir'],
    active_medications: [],
    medication_records: [],
    medication_reconciliation_status: 'fully_reconciled',
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
      bmi: 26.7,
      bmi_category_en: 'Overweight',
      bmi_category_bn: 'অতিরিক্ত ওজন',
      ibw_kg: 52,
      adjusted_bw_kg: 56,
      whtr: 0.54,
      whtr_risk_en: 'moderate',
      whtr_risk_bn: 'মাঝারি ঝুঁকি',
      bmr: 1300,
      tdee: 1560,
      bmr_safe_calorie_floor: 1300,
      target_calories: 1450,
      target_protein_g: 72,
      target_carbs_g: 160,
      target_fat_g: 48,
      protein_ratio_used: '20%',
      population_group: 'adult_standard',
      bmr_floor_strategy: 'clamped_to_bmr',
      is_estimated: false,
      energy_calculation_method: 'mifflin_st_jeor'
    },
    is_diet_plan_dirty: false,
    ...overrides
  };
}

function makeApprovedWeeklyPlan(patientId: string, visitId: string): WeeklyDietPlan {
  return {
    schema_version: 2,
    plan_id: `plan_${patientId}`,
    patient_id: patientId,
    visit_id: visitId,
    version: 1,
    status: 'approved',
    is_approved: true,
    approved_by: 'Dr. Shahriar Ahmed, Lead Nutritionist',
    approved_at: '2026-11-25T09:00:00Z',
    approval_metadata: {
      plan_version: 1,
      clinician_id: 'clin_shahriar',
      clinician_name: 'Dr. Shahriar Ahmed, Lead Nutritionist',
      approval_timestamp: '2026-11-25T09:00:00Z'
    },
    target_macros: {
      calories: 1450,
      protein_g: 72,
      carbs_g: 160,
      fat_g: 48
    },
    days: [
      {
        day_number: 1,
        day_name_bn: '১ম দিন',
        day_name_en: 'Day 1',
        is_locked: false,
        safety_decision: 'SAFE',
        summary: {
          calories: 1450,
          protein_g: 72,
          carbs_g: 160,
          fat_g: 48,
          fiber_g: 28,
          gl: 18,
          gl_is_estimated: false,
          pral: -2,
          calorie_variance: 0,
          protein_variance: 0,
          carbs_variance: 0,
          fat_variance: 0
        },
        meals: [
          {
            id: 'meal_bf_1',
            meal_type: 'breakfast',
            title_bn: 'সকালের নাস্তা',
            title_en: 'Breakfast',
            target_time: '08:00',
            scheduled_time: '08:00 AM',
            meal_calories: 350,
            meal_protein_g: 18,
            meal_carbs_g: 40,
            meal_fat_g: 12,
            meal_gl: 6,
            meal_gl_is_estimated: false,
            meal_pral: -1,
            incompatible_warnings: [],
            is_locked: false,
            items: []
          }
        ]
      }
    ],
    overall_safety_status: 'SAFE',
    created_at: '2026-11-25T08:00:00Z',
    updated_at: '2026-11-25T09:00:00Z'
  };
}

describe('CHECKPOINT A — Medication Verification Controls Patient Release', () => {
  it('A1. Verified medication with complete instructions is correctly included in active_rows and eligible for release', () => {
    const patient = makeApprovedPatient('pt_a1');
    const plan = makeApprovedWeeklyPlan(patient.id, patient.current_visit_id!);
    const verifiedMed: R5MedicationRecord = {
      id: 'med_a1',
      generic_name: 'Metformin Hydrochloride',
      brand_name: 'Comet 500',
      prescribed_dose: '500 mg',
      dose_unit: 'mg',
      frequency: 'Once daily',
      route: 'Oral',
      administration_times: ['08:00'],
      is_timing_unknown: false,
      relationship_to_meals: 'with_meal',
      is_prn: false,
      status: 'active',
      verification_status: 'clinician_verified',
      rule_coverage: 'fully_covered',
      source: 'clinician_entry',
      duration: '3 months',
      duration_bn: '৩ মাস'
    };

    const rx = composeR6Prescription({
      patient,
      weeklyDietPlan: plan,
      medications: [verifiedMed]
    });

    assert.strictEqual(rx.medication_supplement_protocol.active_rows.length, 1);
    assert.strictEqual(rx.medication_supplement_protocol.pending_verification_rows?.length || 0, 0);
    assert.strictEqual(rx.medication_supplement_protocol.active_rows[0].approval_status, 'prescribed_approved');
    assert.strictEqual(rx.medication_supplement_protocol.active_rows[0].requires_clinician_verification, false);
    assert.strictEqual(rx.is_released, true);
    assert.strictEqual(rx.release_eligibility.is_eligible, true);
  });

  it('A2. Unverified / patient-reported medication cannot become a released verified instruction', () => {
    const patient = makeApprovedPatient('pt_a2');
    const plan = makeApprovedWeeklyPlan(patient.id, patient.current_visit_id!);
    const patientReportedMed: R5MedicationRecord = {
      id: 'med_a2',
      generic_name: 'Atorvastatin',
      brand_name: 'Atova 20',
      prescribed_dose: '20 mg',
      dose_unit: 'mg',
      frequency: 'Bedtime',
      route: 'Oral',
      administration_times: ['22:00'],
      is_timing_unknown: false,
      relationship_to_meals: 'bedtime',
      is_prn: false,
      status: 'active',
      verification_status: 'patient_reported',
      rule_coverage: 'fully_covered',
      source: 'intake_staged'
    };

    const rx = composeR6Prescription({
      patient,
      weeklyDietPlan: plan,
      medications: [patientReportedMed]
    });

    assert.strictEqual(rx.medication_supplement_protocol.active_rows.length, 0, 'Unverified medication must not enter active_rows');
    assert.strictEqual(rx.medication_supplement_protocol.pending_verification_rows?.length, 1, 'Unverified medication must move to pending_verification_rows');
    assert.strictEqual(rx.medication_supplement_protocol.has_unresolved_verification, true);
    assert.strictEqual(rx.is_released, false, 'Prescription release must be blocked while unverified medication is present');
    assert.ok(rx.release_eligibility.blocking_reasons_en.some(r => /Atova 20|Atorvastatin/i.test(r)));
  });

  it('A3. Missing or UNKNOWN medication dosage cannot be silently approved and never infers product strength', () => {
    const patient = makeApprovedPatient('pt_a3');
    const plan = makeApprovedWeeklyPlan(patient.id, patient.current_visit_id!);
    const missingDoseMed: R5MedicationRecord = {
      id: 'med_a3',
      generic_name: 'Lisinopril',
      brand_name: 'Zestril 10',
      product_strength: '10 mg',
      prescribed_dose: 'UNKNOWN',
      dose_unit: 'mg',
      frequency: 'Once daily',
      route: 'Oral',
      administration_times: ['08:00'],
      is_timing_unknown: false,
      relationship_to_meals: 'independent_of_meals',
      is_prn: false,
      status: 'active',
      verification_status: 'clinician_verified',
      rule_coverage: 'fully_covered',
      source: 'clinician_entry'
    };

    const rx = composeR6Prescription({
      patient,
      weeklyDietPlan: plan,
      medications: [missingDoseMed]
    });

    assert.strictEqual(rx.medication_supplement_protocol.active_rows.length, 0, 'Medication missing dose must not enter approved active_rows');
    const pending = rx.medication_supplement_protocol.pending_verification_rows || [];
    assert.strictEqual(pending.length, 1);
    assert.strictEqual(pending[0].dosage_display_en, 'Dose Pending (Review required)');
    assert.strictEqual(pending[0].dosage_display_en.includes('10 mg'), false, 'Must never fabricate dose from product_strength');
    assert.strictEqual(rx.is_released, false);
  });

  it('A4. Missing time remains UNKNOWN and prevents silent release', () => {
    const patient = makeApprovedPatient('pt_a4');
    const plan = makeApprovedWeeklyPlan(patient.id, patient.current_visit_id!);
    const unknownTimeMed: R5MedicationRecord = {
      id: 'med_a4',
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
    };

    const rx = composeR6Prescription({
      patient,
      weeklyDietPlan: plan,
      medications: [unknownTimeMed]
    });

    assert.strictEqual(rx.medication_supplement_protocol.active_rows.length, 0);
    const pending = rx.medication_supplement_protocol.pending_verification_rows || [];
    assert.strictEqual(pending.length, 1);
    assert.strictEqual(pending[0].sequence_time, 'UNKNOWN');
    assert.strictEqual(pending[0].duration_en, 'Not documented', 'Unknown duration must not be fabricated');
    assert.strictEqual(rx.is_released, false);
  });

  it('A5. Verified complete PRN medication is represented accurately without requiring scheduled clock time', () => {
    const patient = makeApprovedPatient('pt_a5');
    const plan = makeApprovedWeeklyPlan(patient.id, patient.current_visit_id!);
    const verifiedPrnMed: R5MedicationRecord = {
      id: 'med_a5',
      generic_name: 'Paracetamol',
      brand_name: 'Napa 500',
      prescribed_dose: '500 mg',
      dose_unit: 'mg',
      frequency: 'As needed for fever/pain',
      route: 'Oral',
      administration_times: [],
      is_timing_unknown: false,
      relationship_to_meals: 'after_meal',
      is_prn: true,
      status: 'active',
      verification_status: 'clinician_verified',
      rule_coverage: 'fully_covered',
      source: 'clinician_entry',
      duration: 'As needed (max 5 days)'
    };

    const rx = composeR6Prescription({
      patient,
      weeklyDietPlan: plan,
      medications: [verifiedPrnMed]
    });

    assert.strictEqual(rx.medication_supplement_protocol.active_rows.length, 1);
    assert.strictEqual(rx.medication_supplement_protocol.active_rows[0].sequence_time, 'PRN');
    assert.strictEqual(rx.medication_supplement_protocol.active_rows[0].is_prn, true);
    assert.strictEqual(rx.medication_supplement_protocol.active_rows[0].approval_status, 'prescribed_approved');
    assert.strictEqual(rx.medication_supplement_protocol.active_rows[0].requires_clinician_verification, false);
    assert.strictEqual(rx.is_released, true, 'Verified complete PRN medication must not be blocked solely for lacking clock time');
  });

  it('A6. Discontinued and historical medications are excluded from active instructions and do not block release', () => {
    const patient = makeApprovedPatient('pt_a6');
    const plan = makeApprovedWeeklyPlan(patient.id, patient.current_visit_id!);
    const discontinuedMed: R5MedicationRecord = {
      id: 'med_disc',
      generic_name: 'Sitagliptin',
      brand_name: 'Januvia 50',
      prescribed_dose: '',
      dose_unit: 'mg',
      frequency: '',
      route: 'Oral',
      administration_times: [],
      is_timing_unknown: true,
      relationship_to_meals: 'unknown',
      is_prn: false,
      status: 'discontinued',
      verification_status: 'unverified',
      rule_coverage: 'fully_covered',
      source: 'clinician_entry'
    };
    const historicalMed: R5MedicationRecord = {
      id: 'med_hist',
      generic_name: 'Azithromycin',
      brand_name: 'Zimax 500',
      prescribed_dose: '500 mg',
      dose_unit: 'mg',
      frequency: 'Once daily',
      route: 'Oral',
      administration_times: [],
      is_timing_unknown: true,
      relationship_to_meals: 'independent_of_meals',
      is_prn: false,
      status: 'historical',
      verification_status: 'patient_reported',
      rule_coverage: 'fully_covered',
      source: 'intake_staged'
    };

    const rx = composeR6Prescription({
      patient,
      weeklyDietPlan: plan,
      medications: [discontinuedMed, historicalMed]
    });

    assert.strictEqual(rx.medication_supplement_protocol.active_rows.length, 0);
    assert.strictEqual(rx.medication_supplement_protocol.pending_verification_rows?.length || 0, 0);
    assert.strictEqual(rx.is_released, true, 'Discontinued/historical records must not block current prescription release');
  });

  it('A7 & A8. Authoritative validateReportReleaseEligibility and buildPatientReportProjection enforce the exact same medication gate', () => {
    const patient = makeApprovedPatient('pt_a7');
    const plan = makeApprovedWeeklyPlan(patient.id, patient.current_visit_id!);
    const unverifiedMed: R5MedicationRecord = {
      id: 'med_unv',
      generic_name: 'Glimepiride',
      brand_name: 'Amaryl 1',
      prescribed_dose: '1 mg',
      dose_unit: 'mg',
      frequency: 'Once daily',
      route: 'Oral',
      administration_times: ['07:45'],
      is_timing_unknown: false,
      relationship_to_meals: 'before_meal_empty_stomach',
      is_prn: false,
      status: 'active',
      verification_status: 'unverified',
      rule_coverage: 'fully_covered',
      source: 'intake_staged'
    };

    const eligibility = validateReportReleaseEligibility({
      patient,
      plan,
      weeklyDietPlan: plan,
      medications: [unverifiedMed]
    });
    assert.strictEqual(eligibility.isEligible, false, 'validateReportReleaseEligibility must block unverified medication');

    // Even if a caller passes stale explicit releaseEligibility: { isEligible: true },
    // buildPatientReportProjection MUST NOT bypass the authoritative composer gate!
    const projection = buildPatientReportProjection({
      patient,
      dietChart: plan.days[0].meals,
      weeklyDietPlan: plan,
      medications: [unverifiedMed],
      releaseEligibility: { isEligible: true, blockingReasons: [], blockingReasons_bn: [] }
    });
    assert.strictEqual(projection.is_released, false, 'buildPatientReportProjection must never allow stale explicit eligibility to bypass medication gate');
    assert.strictEqual(projection.release_eligibility.is_eligible, false);
    assert.strictEqual(projection.medication_supplement_protocol?.active_rows.length, 0);
  });

  it('A9. Patient A medication is never included in Patient B prescription', () => {
    const patientA = makeApprovedPatient('pt_iso_a');
    const patientB = makeApprovedPatient('pt_iso_b');
    const planB = makeApprovedWeeklyPlan(patientB.id, patientB.current_visit_id!);

    const medA: R5MedicationRecord = {
      id: 'med_alpha',
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
    };
    const medB: R5MedicationRecord = {
      id: 'med_beta',
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
    };

    const rxA = compose6ColumnMedicationProtocol([medA], []);
    const rxB = composeR6Prescription({
      patient: { ...patientB, medication_records: [medB] as any },
      weeklyDietPlan: planB,
      medications: [medB]
    });

    assert.strictEqual(rxA.active_rows.some(r => r.generic_name === 'Insulin Glargine'), true);
    assert.strictEqual(rxB.medication_supplement_protocol.active_rows.length, 1);
    assert.strictEqual(rxB.medication_supplement_protocol.active_rows[0].generic_name, 'Levothyroxine Sodium');
    assert.strictEqual(rxB.medication_supplement_protocol.active_rows.some(r => r.generic_name === 'Insulin Glargine'), false);
  });

  it('A10. Multiple administration times across verified medications remain chronologically ordered', () => {
    const meds: R5MedicationRecord[] = [
      {
        id: 'med_bid',
        generic_name: 'Metformin Hydrochloride',
        brand_name: 'Comet 500',
        prescribed_dose: '500 mg',
        dose_unit: 'mg',
        frequency: 'Twice daily',
        route: 'Oral',
        administration_times: ['20:00', '08:00'],
        is_timing_unknown: false,
        relationship_to_meals: 'with_meal',
        is_prn: false,
        status: 'active',
        verification_status: 'clinician_verified',
        rule_coverage: 'fully_covered',
        source: 'clinician_entry'
      },
      {
        id: 'med_am',
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

    const proto = compose6ColumnMedicationProtocol(meds, []);
    assert.strictEqual(proto.active_rows.length, 3);
    assert.strictEqual(proto.active_rows[0].sequence_time, '06:30');
    assert.strictEqual(proto.active_rows[1].sequence_time, '08:00');
    assert.strictEqual(proto.active_rows[2].sequence_time, '20:00');
  });
});

describe('CHECKPOINT B — Remove Fabricated Fluid Restriction & Preserve Clinical Limits', () => {
  it('B1. Fluid restriction with confirmed 1000 mL/day preserves exact 1000 mL', () => {
    const patient = makeApprovedPatient('pt_b1', {
      clinical_safety: {
        fluid_restriction: {
          is_restricted: true,
          limit_ml: 1000,
          prescribing_physician: 'Dr. Nephrologist'
        }
      }
    });
    const plan = makeApprovedWeeklyPlan(patient.id, patient.current_visit_id!);

    const rx = composeR6Prescription({ patient, weeklyDietPlan: plan, medications: [] });
    assert.strictEqual(rx.safety_directives.fluid_restriction_active, true);
    assert.strictEqual(rx.safety_directives.fluid_limit_ml, 1000);
    assert.strictEqual(rx.lifestyle_support.hydration.target_daily_ml, 1000);
    assert.ok(rx.lifestyle_support.hydration.instructions_en.includes('1000'));
    assert.strictEqual(rx.is_released, true);
  });

  it('B2. Fluid restriction with confirmed 1200 mL/day preserves exact 1200 mL', () => {
    const patient = makeApprovedPatient('pt_b2', {
      fluid_prescription: {
        patient_id: 'pt_b2',
        is_restricted: true,
        total_fluid_limit_ml: 1200,
        total_prescribed_ml: 1200,
        clinical_rationale: 'Prescribed fluid ceiling',
        accounting: {
          plain_water_ml: 700,
          functional_drinks_ml: 100,
          beverages_tea_coffee_ml: 100,
          milk_dairy_liquids_ml: 100,
          soups_liquid_foods_ml: 200,
          oral_nutrition_supplements_ml: 0
        }
      }
    });
    const plan = makeApprovedWeeklyPlan(patient.id, patient.current_visit_id!);

    const rx = composeR6Prescription({ patient, weeklyDietPlan: plan, medications: [] });
    assert.strictEqual(rx.safety_directives.fluid_restriction_active, true);
    assert.strictEqual(rx.safety_directives.fluid_limit_ml, 1200);
    assert.strictEqual(rx.lifestyle_support.hydration.target_daily_ml, 1200);
    assert.ok(rx.lifestyle_support.hydration.instructions_en.includes('1200'));
    assert.strictEqual(rx.is_released, true);
  });

  it('B3. Fluid restriction active but quantitative limit missing does NOT fabricate 1500 mL', () => {
    const patient = makeApprovedPatient('pt_b3', {
      clinical_safety: {
        fluid_restriction: {
          is_restricted: true,
          limit_ml: undefined
        }
      }
    });
    const plan = makeApprovedWeeklyPlan(patient.id, patient.current_visit_id!);

    const rx = composeR6Prescription({ patient, weeklyDietPlan: plan, medications: [] });
    assert.strictEqual(rx.safety_directives.fluid_restriction_active, true);
    assert.strictEqual(rx.safety_directives.fluid_limit_ml, undefined, 'Missing fluid limit must remain undefined, never 1500');
    assert.strictEqual(rx.lifestyle_support.hydration.target_daily_ml, undefined, 'Hydration target must NOT be invented as 1500 mL');
    assert.strictEqual(rx.lifestyle_support.hydration.instructions_en.includes('1500'), false, 'Must never emit fabricated 1500 mL');
    assert.strictEqual(rx.lifestyle_support.hydration.instructions_en, 'Fluid Restriction — Quantitative Limit Requires Clinician Confirmation');
  });

  it('B4. Patient without approved hydration target or restriction receives no fabricated numeric value (and diagnosis alone never invents 1500 mL)', () => {
    const plainPatient = makeApprovedPatient('pt_b4_plain', {
      selected_conditions: ['t2d_ir']
    });
    const planPlain = makeApprovedWeeklyPlan(plainPatient.id, plainPatient.current_visit_id!);
    const rxPlain = composeR6Prescription({ patient: plainPatient, weeklyDietPlan: planPlain, medications: [] });

    assert.strictEqual(rxPlain.lifestyle_support.hydration.is_prescribed, false);
    assert.strictEqual(rxPlain.lifestyle_support.hydration.target_daily_ml, undefined);
    assert.strictEqual(rxPlain.lifestyle_support.hydration.instructions_en, 'Not individually prescribed');
    assert.strictEqual(rxPlain.lifestyle_support.hydration.instructions_en.includes('2.5'), false);

    // Diagnosis alone (e.g., heart_failure without confirmed fluid order) must NOT invent 1500 mL
    const chfDiagOnlyPatient = makeApprovedPatient('pt_b4_chf', {
      selected_conditions: ['heart_failure' as any]
    });
    const planChf = makeApprovedWeeklyPlan(chfDiagOnlyPatient.id, chfDiagOnlyPatient.current_visit_id!);
    const rxChf = composeR6Prescription({ patient: chfDiagOnlyPatient, weeklyDietPlan: planChf, medications: [] });
    assert.strictEqual(rxChf.lifestyle_support.hydration.target_daily_ml, undefined, 'Diagnosis alone must never invent numeric 1500 mL limit');
    assert.strictEqual(rxChf.lifestyle_support.hydration.instructions_en.includes('1500'), false);
  });

  it('B5. Genuine clinician-approved R4 Hydration instructions are preserved faithfully', () => {
    const patient = makeApprovedPatient('pt_b5');
    const plan = makeApprovedWeeklyPlan(patient.id, patient.current_visit_id!);
    const approvedR4: any = {
      id: 'proto_r4_b5',
      patient_id: patient.id,
      visit_id: patient.current_visit_id,
      organization_id: 'org-1',
      version: 1,
      status: 'active',
      is_approved: true,
      approved_by: 'clin_01',
      approved_at: '2026-11-25T09:00:00Z',
      hydration: {
        baseline_fluid_target_ml: 2100,
        is_restricted: false,
        hydration_events: [],
        total_scheduled_ml: 2100,
        timing_guidance_en: 'Drink 2100 mL/day spaced between meals.',
        timing_guidance_bn: 'খাবারের মধ্যবর্তী সময়ে দৈনিক ২১০০ মি.লি. পানি পান করুন।'
      },
      supplements: []
    };

    const rx = composeR6Prescription({ patient, weeklyDietPlan: plan, r4Protocol: approvedR4, medications: [] });
    assert.strictEqual(rx.lifestyle_support.hydration.is_prescribed, true);
    assert.strictEqual(rx.lifestyle_support.hydration.target_daily_ml, 2100);
    assert.strictEqual(rx.lifestyle_support.hydration.instructions_en, 'Drink 2100 mL/day spaced between meals.');
    assert.strictEqual(rx.is_released, true);
  });

  it('B6. Unresolved fluid restriction (active restriction without quantitative limit) blocks release and prevents misleading numerical instructions', () => {
    const patient = makeApprovedPatient('pt_b6', {
      clinical_safety: {
        fluid_restriction: {
          is_restricted: true,
          limit_ml: undefined
        }
      }
    });
    const plan = makeApprovedWeeklyPlan(patient.id, patient.current_visit_id!);

    const rx = composeR6Prescription({ patient, weeklyDietPlan: plan, medications: [] });
    assert.strictEqual(rx.is_released, false, 'Unresolved fluid restriction without quantitative limit must block release');
    assert.ok(rx.release_eligibility.blocking_reasons_en.some(r => /fluid restriction|quantitative limit/i.test(r)));

    const projection = buildPatientReportProjection({
      patient,
      dietChart: plan.days[0].meals,
      weeklyDietPlan: plan
    });
    assert.strictEqual(projection.is_released, false);
    assert.strictEqual(projection.safety_instructions.fluid_limit_ml, undefined);
    assert.strictEqual(projection.safety_instructions.hydration_guidelines_en, 'Fluid Restriction — Quantitative Limit Requires Clinician Confirmation');
  });
});
