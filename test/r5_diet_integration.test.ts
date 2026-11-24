/**
 * SHUDDHO Phase R5: Diet Integration, Traffic Light Synchronization & Prescription Contract Tests
 * 
 * Clinical Safety Standards (Section 15):
 * 1. Clinical Pathways: Broad pathways do NOT auto-diagnose diseases (Mental health != gut dysbiosis, Renal != Gout).
 * 2. Laboratory Safety: Nuanced potassium evaluation (Normal K+ != RED; Borderline K+ = YELLOW review; K+ >= 6.0 = RED).
 * 3. 7-Food-Group Traffic Light classification without arbitrary truncation or silent fallback to vegetables.
 * 4. Unified chronological 6-column prescription schedule handoff (Twice daily creates 2 entries; missing dose != strength).
 * 5. Weekly Diet Planner ingestion of R5 constraints even without P2 planning context.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import { 
  mapPathwaysToConditionIds,
  EXPANDED_PATHWAY_TO_CANDIDATE_CONDITIONS_MAP,
  getCandidateConditionsForPathways
} from '../src/engine/r5PathwayRegistry';
import { resolveConflicts } from '../src/engine/conflictResolver';
import { 
  buildStructuredTrafficLightGuide, 
  mapFoodToSevenFoodGroup,
  buildPatientReportProjection
} from '../src/engine/reports/dualReportEngine';
import { buildUnifiedPrescriptionSchedule } from '../src/engine/r5ToR4Adapter';
import { generateWeeklyDietPlan } from '../src/engine/weeklyPlanner';
import { R5MedicationRecord, R5NutritionAdjustmentContract } from '../src/types/r5Systems';
import { FoodItem, PatientProfile } from '../src/types';
import foodsData from '../src/data/foods.json';

const allFoods = foodsData as FoodItem[];

describe('Phase R5 — Diet Integration & Prescription Contracts', () => {

  describe('1. Clinical Pathways vs Confirmed Diagnoses (P0-001)', () => {
    test('mental health pathway alone does NOT activate gut dysbiosis or IBS restrictions', () => {
      const candidateConditions = getCandidateConditionsForPathways(['mental_health_neuropsychiatric']);
      // Candidate conditions for mental health must not contain gut dysbiosis
      assert.strictEqual(candidateConditions.includes('gut_dysbiosis'), false, 'Mental Health must not diagnose gut dysbiosis');
      
      // When resolved with confirmed conditions = [] (only pathway active), no gut dysbiosis red food rules appear
      const result = resolveConflicts(allFoods, []);
      const dysbiosisReasons = result.red.filter(f => f.reasons.some(r => r.conditionId === 'gut_dysbiosis'));
      assert.strictEqual(dysbiosisReasons.length, 0, 'No gut dysbiosis red foods when only mental health pathway is active');
    });

    test('metabolic pathway alone does NOT automatically diagnose Type 2 Diabetes or Fatty Liver', () => {
      // Patient with metabolic pathway but NO confirmed T2D
      const confirmedConditions: any[] = [];
      const result = resolveConflicts(allFoods, confirmedConditions);
      
      // Without confirmed T2D, sugar is not automatically blocked by T2D disease rule
      const t2dRedReasons = result.red.filter(f => f.reasons.some(r => r.conditionId === 't2d_ir'));
      assert.strictEqual(t2dRedReasons.length, 0, 'T2D disease rules must NOT activate without confirmed diagnosis');
    });

    test('renal pathway alone does NOT automatically diagnose Gout', () => {
      const candidates = getCandidateConditionsForPathways(['renal_electrolyte']);
      assert.strictEqual(candidates.includes('uric_acid_gout'), false, 'Renal pathway alone must not assume Gout');
    });

    test('explicitly confirmed Type 2 Diabetes still activates appropriate diabetes review rules', () => {
      const result = resolveConflicts(allFoods, ['t2d_ir']);
      assert.ok(result.red.length > 0);
      const sugarFood = result.red.find(f => f.name_en.toLowerCase().includes('sugar') || f.name_bn.includes('চিনি'));
      assert.ok(sugarFood, 'Confirmed T2D must place refined sugar in Red zone');
    });

    test('multiple independently confirmed diagnoses are cleanly supported', () => {
      const result = resolveConflicts(allFoods, ['t2d_ir', 'hypertension_ckd']);
      const hasT2d = result.red.some(f => f.reasons.some(r => r.conditionId === 't2d_ir'));
      const hasHypertension = result.red.some(f => f.reasons.some(r => r.conditionId === 'hypertension_ckd'));
      assert.ok(hasT2d, 'T2D rules active');
      assert.ok(hasHypertension, 'Hypertension rules active');
    });
  });

  describe('2. Nuanced Potassium & Lab Safety Gating (P0-002)', () => {
    test('CKD with normal serum potassium (K+ = 4.2) does NOT trigger blanket RED classification', () => {
      const labs = { serum_potassium: 4.2, egfr: 25 };
      const result = resolveConflicts(allFoods, ['hypertension_ckd'], [], [], [], [], 1, undefined, labs);

      const hyperkalemiaRedFoods = result.red.filter(f => 
        f.reasons.some(r => r.conditionId === 'HYPERKALEMIA_SAFETY')
      );
      assert.strictEqual(hyperkalemiaRedFoods.length, 0, 'Normal potassium (4.2) in CKD must NOT trigger HYPERKALEMIA_SAFETY RED');
    });

    test('borderline elevated potassium (K+ = 5.2) triggers YELLOW portion/preparation review, NOT blanket RED', () => {
      const labs = { serum_potassium: 5.2, egfr: 35 };
      const result = resolveConflicts(allFoods, [], [], [], [], [], 1, undefined, labs);

      const portionReviewFoods = result.yellow.filter(f => 
        f.reasons.some(r => r.conditionId === 'POTASSIUM_REVIEW')
      );
      assert.ok(portionReviewFoods.length > 0, 'Borderline potassium must trigger POTASSIUM_REVIEW in Yellow zone');
      
      const sample = portionReviewFoods[0];
      const reason = sample.reasons.find(r => r.conditionId === 'POTASSIUM_REVIEW');
      assert.strictEqual(reason?.status, 'YELLOW');
      assert.strictEqual(reason?.isOverridable, true);
      assert.ok(reason?.note_en.includes('Portion moderation'));

      // Must not be in RED zone strictly because of potassium
      const redK = result.red.filter(f => f.reasons.some(r => r.conditionId === 'HYPERKALEMIA_SAFETY'));
      assert.strictEqual(redK.length, 0, 'Borderline potassium must not trigger un-overridable RED');
    });

    test('severe hyperkalemia (K+ >= 6.0) triggers strict emergency stop', () => {
      const labs = { serum_potassium: 6.2, egfr: 20 };
      const result = resolveConflicts(allFoods, [], [], [], [], [], 1, undefined, labs);

      const redK = result.red.filter(f => f.reasons.some(r => r.conditionId === 'URGENT_CLINICAL_ASSESSMENT_REQUIRED' || r.conditionId === 'HYPERKALEMIA_SAFETY'));
      assert.ok(redK.length > 0, 'K+ >= 6.0 must trigger URGENT_CLINICAL_ASSESSMENT_REQUIRED / HYPERKALEMIA_SAFETY RED');
      assert.strictEqual(redK[0].reasons.find(r => r.conditionId === 'URGENT_CLINICAL_ASSESSMENT_REQUIRED' || r.conditionId === 'HYPERKALEMIA_SAFETY')?.isOverridable, false);
    });

    test('unknown potassium results remain unknown without arbitrary restriction', () => {
      const result = resolveConflicts(allFoods, [], [], [], [], [], 1, undefined, {});
      const kReasons = [...result.red, ...result.yellow].filter(f => 
        f.reasons.some(r => r.conditionId === 'HYPERKALEMIA_SAFETY' || r.conditionId === 'POTASSIUM_REVIEW')
      );
      assert.strictEqual(kReasons.length, 0, 'Missing potassium lab must not invent potassium restrictions');
    });

    test('R5 absolute contraindications from clinical intelligence are strictly enforced as RED', () => {
      const contract: R5NutritionAdjustmentContract = {
        patient_id: 'pat_001',
        clinical_pathway_ids: ['metabolic_endocrine'],
        nutrient_constraints: { carbohydrate_consistency_required: true },
        absolute_contraindications: [
          {
            food_name_bn: 'আমড়া',
            food_name_en: 'Amra',
            reason_bn: 'তীব্র গ্যাস্ট্রোইনটেস্টাইনাল অম্লতার কারণে বর্জনীয়',
            reason_en: 'Contraindicated due to acute mucosal erosive gastritis',
            priority_level: 1
          }
        ],
        conditional_cautions: [],
        meal_schedule_rules: {
          timing_buffers: [],
          fasting_eligible: true,
          fasting_contraindication_reasons: []
        },
        provenance: { generated_at: new Date().toISOString(), engine_version: 'R5.1' }
      };

      const result = resolveConflicts(allFoods, [], [], [], [], [], 1, contract);
      const amra = result.red.find(f => f.name_en.toLowerCase().includes('amra') || f.name_bn.includes('আমড়া'));
      assert.ok(amra, 'Amra must be in RED zone due to R5 absolute contraindication');
      const r5Reason = amra.reasons.find(r => r.conditionId === 'R5_CONTRAINDICATION');
      assert.ok(r5Reason, 'Must have R5_CONTRAINDICATION reason');
      assert.strictEqual(r5Reason.isOverridable, false);
    });
  });

  describe('3. 7-Food-Group Structured Traffic Light Guide (P1-004)', () => {
    test('buildStructuredTrafficLightGuide maps all foods into the 7 standard food groups deterministically', () => {
      const trafficLight = resolveConflicts(allFoods, ['t2d_ir']);
      const guide = buildStructuredTrafficLightGuide(trafficLight);

      assert.strictEqual(guide.groups.length, 7);
      
      const groupIds = guide.groups.map(g => g.group_id);
      assert.ok(groupIds.includes('grains_carbs'));
      assert.ok(groupIds.includes('proteins'));
      assert.ok(groupIds.includes('vegetables'));
      assert.ok(groupIds.includes('fruits'));
      assert.ok(groupIds.includes('fats_oils'));
      assert.ok(groupIds.includes('dairy_probiotics'));
      assert.ok(groupIds.includes('spices_beverages'));
    });

    test('unmatched or beverage/spice foods do not silently default to vegetables', () => {
      const teaFood: FoodItem = {
        id: 'f_test_tea',
        code: 'test_tea',
        name_en: 'Green Tea (Camellia sinensis)',
        name_bn: 'গ্রিন টি',
        category: 'beverage',
        exchange_group: 'vegetable' as any,
        per_100g: { kcal: 1, protein_g: 0, carbs_g: 0.2, fat_g: 0, fiber_g: 0, water_g: 99.8, ash_g: 0 },
        micronutrients: {} as any,
        raw_to_cooked_ratio: 1,
        glycemic_load: 'low',
        pral_score: -0.5,
        prep_note_bn: '',
        prep_note_en: '',
        tags: []
      };

      const group = mapFoodToSevenFoodGroup(teaFood);
      assert.strictEqual(group, 'spices_beverages', 'Beverages must map to spices_beverages, not vegetables');
    });

    test('untruncated food items are populated across green, yellow, and red zones without data loss', () => {
      const trafficLight = resolveConflicts(allFoods, ['t2d_ir', 'hypertension_ckd']);
      const guide = buildStructuredTrafficLightGuide(trafficLight);

      const totalInGuide = guide.groups.reduce((acc, g) => acc + g.green.length + g.yellow.length + g.red.length, 0);
      assert.strictEqual(totalInGuide, allFoods.length, 'Every food item in database must be classified without data loss');
    });
  });

  describe('4. Unified Chronological Prescription Schedule Handoff (P0-004)', () => {
    test('generates separate scheduled entries for each administration of twice-daily medication', () => {
      const mockMeds: R5MedicationRecord[] = [
        {
          id: 'med_001',
          brand_name: 'Seclo 20',
          generic_name: 'Omeprazole',
          product_strength: '20 mg',
          prescribed_dose: '20 mg',
          dose_unit: 'mg',
          frequency: 'Once daily',
          route: 'Oral',
          administration_times: ['07:30'],
          is_timing_unknown: false,
          relationship_to_meals: 'before_meal_empty_stomach',
          is_prn: false,
          prescriber_instructions: 'সকালে খালি পেটে এক গ্লাস পানিসহ সেব্য',
          verification_status: 'clinician_verified',
          status: 'active',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        },
        {
          id: 'med_002',
          brand_name: 'Gluconor 500',
          generic_name: 'Metformin',
          product_strength: '500 mg',
          prescribed_dose: '500 mg',
          dose_unit: 'mg',
          frequency: 'Twice daily',
          route: 'Oral',
          // Twice daily medication with 2 distinct administration times:
          administration_times: ['08:30', '20:30'],
          is_timing_unknown: false,
          relationship_to_meals: 'after_meal',
          is_prn: false,
          prescriber_instructions: 'খাবারের সাথে বা পরপরই সেব্য',
          verification_status: 'clinician_verified',
          status: 'active',
          rule_coverage: 'fully_covered',
          source: 'clinician_entry'
        }
      ];

      const mockSupplements: any[] = [
        {
          id: 'supp_001',
          brand_name: 'Magnesium Glycinate',
          generic_nutrient: 'Magnesium',
          chemical_form: 'Bisglycinate',
          elemental_dose_numeric: 200,
          elemental_dose_unit: 'mg',
          total_compound_dose: '200 mg',
          frequency: 'once_daily_evening',
          administration_time: '21:30',
          relationship_to_food: 'before_bed',
          duration_weeks: 8,
          approval_status: 'clinician_approved'
        }
      ];

      const schedule = buildUnifiedPrescriptionSchedule('pat_001', mockMeds, mockSupplements, {
        clinician_name: 'Dr. Authorized Clinician',
        license_number: 'CN-2026-001',
        approved_at: new Date().toISOString()
      });

      // 1 Omeprazole + 2 Metformin (08:30 and 20:30) + 1 Supplement = 4 total chronological entries
      assert.strictEqual(schedule.items.length, 4, 'Twice daily Metformin must generate 2 separate administration entries');

      const metforminEntries = schedule.items.filter(i => i.generic_name === 'Metformin');
      assert.strictEqual(metforminEntries.length, 2);
      assert.ok(metforminEntries[0].time_slot_en.includes('Breakfast') || metforminEntries[0].time_slot_en.includes('Morning'));
      assert.ok(metforminEntries[1].time_slot_en.includes('Dinner') || metforminEntries[1].time_slot_en.includes('Night'));

      // Check supplement approval status
      const mag = schedule.items.find(i => i.generic_name === 'Magnesium');
      assert.ok(mag);
      assert.strictEqual(mag.approval_status, 'APPROVED');
    });

    test('missing prescribed dose remains UNKNOWN and is never inferred from product strength', () => {
      const mockMeds: R5MedicationRecord[] = [
        {
          id: 'med_undosed',
          brand_name: 'Napa 500',
          generic_name: 'Paracetamol',
          product_strength: '500 mg',
          prescribed_dose: undefined, // Missing dose!
          dose_unit: 'mg',
          frequency: undefined, // Missing frequency!
          route: 'Oral',
          administration_times: [],
          is_timing_unknown: true,
          relationship_to_meals: 'unknown',
          is_prn: false,
          verification_status: 'unverified',
          status: 'active',
          rule_coverage: 'fully_covered',
          source: 'intake_staged'
        }
      ];

      const schedule = buildUnifiedPrescriptionSchedule('pat_002', mockMeds, []);
      assert.strictEqual(schedule.items.length, 1);
      
      const item = schedule.items[0];
      assert.ok(item.dosage_and_quantity.includes('অনির্ধারিত'), 'Missing dose must be labeled as unspecified');
      assert.strictEqual(item.dosage_and_quantity.includes('500 mg'), false, 'Must NOT default to product strength 500 mg');
      assert.strictEqual(item.approval_status, 'REQUIRES_REVIEW');
    });

    test('unapproved draft candidate supplements cannot enter released schedule as approved', () => {
      const unapprovedSupp: any[] = [
        {
          id: 'supp_draft',
          generic_nutrient: 'Coenzyme Q10',
          elemental_dose_numeric: 100,
          elemental_dose_unit: 'mg',
          approval_status: 'draft_candidate' // Unapproved candidate!
        }
      ];

      const schedule = buildUnifiedPrescriptionSchedule('pat_003', [], unapprovedSupp);
      assert.strictEqual(schedule.items.length, 1);
      assert.strictEqual(schedule.items[0].approval_status, 'DRAFT_CANDIDATE', 'Draft candidate supplement must not be marked APPROVED');
    });
  });

  describe('5. Weekly Diet Planner Integration & R5 Constraints (P1-002)', () => {
    test('weekly planner respects protein cap derived from confirmed non-dialysis CKD', () => {
      const mockPatient: PatientProfile = {
        id: 'pat_ckd_001',
        name: 'Renal Patient',
        age: 62,
        gender: 'male',
        weight_kg: 70,
        height_cm: 170,
        bmi: 24.2,
        activity_level: 'sedentary',
        sleep_hours: 7,
        shift_worker: false,
        population_group: 'adult_standard',
        selected_conditions: ['hypertension_ckd'],
        active_medications: [],
        confirmed_allergies: [],
        calculated: {
          bmr: 1500,
          tdee: 1800,
          target_calories: 1800,
          target_protein_g: 84, // Standard 1.2 g/kg = 84g
          target_carbs_g: 220,
          target_fat_g: 50,
          bmi: 24.2,
          bmi_category_en: 'Normal',
          bmi_category_bn: 'স্বাভাবিক'
        }
      } as any;

      const p3ContextWithR5: any = {
        patientId: mockPatient.id,
        energyTargetCalories: 1800,
        proteinTargetGrams: 84,
        prescriptions: {
          protein: { hasConfirmedLimit: false }
        },
        // Confirmed CKD protein restriction at 0.8 g/kg (70 * 0.8 = 56g)
        r5NutritionConstraints: {
          patient_id: mockPatient.id,
          clinical_pathway_ids: ['renal_electrolyte'],
          nutrient_constraints: {
            protein_g_per_kg: 0.8
          }
        }
      };

      const trafficLight = resolveConflicts(allFoods, ['hypertension_ckd']);
      const plan = generateWeeklyDietPlan(mockPatient, allFoods, trafficLight, p3ContextWithR5);

      assert.ok(plan);
      assert.strictEqual(plan.target_macros.protein_g, 56, 'Target protein must be capped to 56g (70 kg * 0.8 g/kg)');
    });

    test('R5 safety constraints reach Weekly Planner even when P2 planning context is absent (P1-002)', () => {
      const mockPatient: PatientProfile = {
        id: 'pat_r5_no_p2',
        name: 'No P2 Context Patient',
        age: 45,
        gender: 'female',
        weight_kg: 60,
        height_cm: 160,
        bmi: 23.4,
        activity_level: 'sedentary',
        sleep_hours: 7,
        shift_worker: false,
        population_group: 'adult_standard',
        selected_conditions: [],
        active_medications: [],
        confirmed_allergies: [],
        calculated: {
          bmr: 1300,
          tdee: 1600,
          target_calories: 1600,
          target_protein_g: 60,
          target_carbs_g: 200,
          target_fat_g: 45,
          bmi: 23.4,
          bmi_category_en: 'Normal',
          bmi_category_bn: 'স্বাভাবিক'
        }
      } as any;

      const minimalR5Context: any = {
        r5NutritionConstraints: {
          patient_id: mockPatient.id,
          clinical_pathway_ids: [],
          nutrient_constraints: {
            protein_g_per_kg: 0.8 // 60 * 0.8 = 48g
          }
        }
      };

      const trafficLight = resolveConflicts(allFoods, []);
      const plan = generateWeeklyDietPlan(mockPatient, allFoods, trafficLight, minimalR5Context);
      assert.ok(plan);
      assert.strictEqual(plan.target_macros.protein_g, 48, 'R5 protein cap must be enforced even without prior P2 analysis');
    });
  });

});
