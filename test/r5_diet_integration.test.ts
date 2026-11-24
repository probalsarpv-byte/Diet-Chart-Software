/**
 * SHUDDHO Phase R5: Diet Integration, Traffic Light Synchronization & Prescription Contract Tests
 * 
 * Verifies:
 * 1. Step 1 Clinical Pathway to Condition ID mapping (bidirectional harmony)
 * 2. Traffic Light reactive filtering to R5 Clinical Pathways & Lab safety gating
 * 3. 7-Food-Group Traffic Light classification without arbitrary truncation
 * 4. Unified chronological 6-column prescription schedule handoff builder
 * 5. Weekly Diet Planner ingestion of R5 multimorbidity and protein constraints
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import { 
  mapPathwaysToConditionIds,
  EXPANDED_PATHWAY_TO_CONDITION_MAP,
  mapConditionsToPathways
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

  describe('1. Step 1 Clinical Pathways & Condition Synchronization', () => {
    test('correctly maps metabolic and endocrine pathway to diabetes and metabolic conditions', () => {
      const conditions = mapPathwaysToConditionIds(['metabolic_endocrine']);
      assert.ok(conditions.includes('t2d_ir'));
      assert.ok(conditions.includes('fatty_liver'));
      assert.ok(conditions.includes('metabolic_syndrome'));
    });

    test('correctly maps cardiovascular pathway to hypertension and dyslipidemia', () => {
      const conditions = mapPathwaysToConditionIds(['cardiovascular']);
      assert.ok(conditions.includes('dyslipidemia_atherosclerosis'));
      assert.ok(conditions.includes('hypertension_ckd'));
    });

    test('correctly maps renal and electrolyte pathway to CKD and gout conditions', () => {
      const conditions = mapPathwaysToConditionIds(['renal_electrolyte']);
      assert.ok(conditions.includes('hypertension_ckd'));
      assert.ok(conditions.includes('uric_acid_gout'));
    });

    test('handles empty or non-assessed pathways gracefully returning empty list', () => {
      const conditions = mapPathwaysToConditionIds([]);
      assert.strictEqual(conditions.length, 0);
    });
  });

  describe('2. Traffic Light Reactive Filtering & Lab Safety Gating', () => {
    test('clinical pathway selection drives Traffic Light food categorization', () => {
      const pathwayConditions = mapPathwaysToConditionIds(['metabolic_endocrine']);
      const result = resolveConflicts(allFoods, pathwayConditions);

      assert.ok(result.red.length > 0);
      const sugarFood = result.red.find(f => f.name_en.toLowerCase().includes('sugar') || f.name_bn.includes('চিনি'));
      assert.ok(sugarFood, 'High sugar food must be in Red zone for metabolic pathway');
    });

    test('elevated serum potassium (K+ >= 5.0) triggers strict hyperkalemia red classification', () => {
      const labs = { serum_potassium: 5.4, egfr: 45 };
      const result = resolveConflicts(allFoods, [], [], [], [], [], 1, undefined, labs);

      const highPotassiumFoods = result.red.filter(f => 
        f.reasons.some(r => r.conditionId === 'HYPERKALEMIA_SAFETY')
      );
      assert.ok(highPotassiumFoods.length > 0, 'High potassium foods must be classified RED when serum K+ is 5.4');
      const sample = highPotassiumFoods[0];
      const safetyReason = sample.reasons.find(r => r.conditionId === 'HYPERKALEMIA_SAFETY');
      assert.strictEqual(safetyReason?.status, 'RED');
      assert.ok(safetyReason?.note_en.includes('arrhythmia'));
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

  describe('3. 7-Food-Group Structured Traffic Light Guide', () => {
    test('buildStructuredTrafficLightGuide maps all foods into the 7 standard food groups', () => {
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

    test('untruncated food items are populated across green, yellow, and red zones', () => {
      const trafficLight = resolveConflicts(allFoods, ['t2d_ir', 'hypertension_ckd']);
      const guide = buildStructuredTrafficLightGuide(trafficLight);

      const grainsGroup = guide.groups.find(g => g.group_id === 'grains_carbs');
      assert.ok(grainsGroup);
      assert.ok(grainsGroup.green.length > 0 || grainsGroup.yellow.length > 0 || grainsGroup.red.length > 0);

      // Verify no artificial slice(0, 20) truncation on total counts
      const totalInGuide = guide.groups.reduce((acc, g) => acc + g.green.length + g.yellow.length + g.red.length, 0);
      assert.strictEqual(totalInGuide, allFoods.length, 'Every food item must be classified into a group without data loss');
    });
  });

  describe('4. Unified Chronological Prescription Schedule Handoff', () => {
    test('compiles medications and supplements into 6-column chronological schedule', () => {
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
        clinician_name: 'Dr. Clinical Nutritionist',
        license_number: 'CN-2026-001',
        approved_at: new Date().toISOString()
      });

      assert.strictEqual(schedule.items.length, 3);
      assert.strictEqual(schedule.patient_id, 'pat_001');

      // Check Omeprazole
      const omeprazole = schedule.items.find(i => i.generic_name === 'Omeprazole');
      assert.ok(omeprazole);
      assert.strictEqual(omeprazole.type, 'MEDICATION');
      assert.strictEqual(omeprazole.brand_name, 'Seclo 20');
      assert.strictEqual(omeprazole.meal_relationship, 'BEFORE_MEAL');
      assert.strictEqual(omeprazole.approval_status, 'APPROVED');

      // Check Supplement
      const mag = schedule.items.find(i => i.generic_name === 'Magnesium');
      assert.ok(mag);
      assert.strictEqual(mag.type, 'SUPPLEMENT');
      assert.strictEqual(mag.meal_relationship, 'BEDTIME');
      assert.strictEqual(mag.approval_status, 'APPROVED');
    });
  });

  describe('5. Weekly Diet Planner Integration with R5 Constraints', () => {
    test('weekly planner respects protein cap derived from R5 multimorbidity', () => {
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
        // R5 Multimorbidity restricts protein in Stage 3-4 CKD to 0.8 g/kg (70 * 0.8 = 56g)
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
  });

});
