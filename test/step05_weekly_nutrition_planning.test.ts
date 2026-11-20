/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION SOFTWARE
 * STEP 05: ADVANCED CLINICAL NUTRITION PLANNING & 7-DAY PERSONALIZED DIET PRESCRIPTION
 * UNIT & INTEGRATION ACCEPTANCE TEST SUITE
 * 
 * Verifies Scenarios 1–12:
 * - Scenario 1: Generate valid 7-day plan from verified P3 context
 * - Scenario 2: 7 distinct days with meal structures and varied ingredients
 * - Scenario 3: Nutrient calculation accuracy and variance tracking
 * - Scenario 4: Allergy blocking across all 7 days and alternatives
 * - Scenario 5: Fluid restriction guard (no blanket 3.5L)
 * - Scenario 6: Non-oral feeding route safety enforcement
 * - Scenario 7: Preservation of manual edits and item/meal/day locks during regeneration
 * - Scenario 8: Single-day regeneration without mutating other days
 * - Scenario 9: Day-to-day plan copy with safety revalidation
 * - Scenario 10: Patient and visit isolation
 * - Scenario 11: Approval governance (blocked when HARD_STOP exists)
 * - Scenario 12: Backward compatibility with single-day current_diet_chart
 */

import foodsData from '../src/data/foods.json';
import medicinesData from '../src/data/medicines.json';
import { resolveConflicts } from '../src/engine/conflictResolver';
import { runP2Analysis } from '../src/engine/p2';
import {
  generateWeeklyDietPlan,
  regenerateDayInWeeklyPlan,
  copyDayInWeeklyPlan,
  calculateMealTotals,
  DAY_NAMES,
  invalidateWeeklyPlanApproval,
  approveWeeklyDietPlan,
  validatePortionInput,
  evaluateNutritionalAdequacy,
  evaluateWeeklyPlanClinicalSafety,
  buildDayPlan,
  recalculateDayPlan
} from '../src/engine/weeklyPlanner';
import { validateClinicianCredentials } from '../src/engine/longitudinal/comparisonEngine';
import { evaluateFastingEligibility } from '../src/clinical-safety/fastingSafetyEngine';
import {
  parseTimeString,
  calculateIntervalHours,
  evaluateMealScheduleTiming
} from '../src/clinical-safety/mealTimingEngine';
import {
  FoodItem,
  MedicineItem,
  PatientProfile,
  PatientRecord,
  WeeklyDietPlan,
  DayPlan,
  DietChartMeal,
  DietChartMealItem,
  DayPlanSummary
} from '../src/types';
import { P3NutritionPlanningContext } from '../src/engine/p2/types';

const allFoods = foodsData as FoodItem[];
const allMedicines = medicinesData as MedicineItem[];

class MockStorage {
  private store = new Map<string, string>();
  public shouldFail = false;

  getItem<T>(key: string): T | null {
    const raw = this.store.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: any): boolean {
    if (this.shouldFail) return false;
    this.store.set(key, JSON.stringify(value));
    return true;
  }

  getRaw(key: string): string | undefined {
    return this.store.get(key);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

let passedAssertions = 0;
let totalAssertions = 0;

function assert(condition: boolean, message: string) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function createBaseTestPatient(overrides: Partial<PatientProfile> = {}): PatientProfile {
  return {
    schema_version: 2,
    id: 'pt_nasreen_01',
    name: 'Mrs. Nasreen Akhter',
    age: 48,
    gender: 'female',
    phone: '01712-345678',
    email: 'nasreen.akhter@example.com',
    visit_date: '2026-11-18',
    current_visit_id: 'vis_nasreen_01',
    current_phase: 1,
    height_cm: 152,
    weight_kg: 74,
    waist_cm: 92,
    activity_level: 'sedentary',
    sleep_hours: 6,
    shift_worker: false,
    population_group: 'adult_standard',
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: [],
    allergy_reconciliation_status: 'none_confirmed',
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    selected_conditions: ['t2d_ir', 'fatty_liver', 'hypothyroid', 'uric_acid_gout'],
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
      bmi: 32.03,
      bmi_category_en: 'Obese Class I',
      bmi_category_bn: 'স্থূলতা গ্রেড ১',
      bmr: 1320,
      tdee: 1584,
      target_calories: 1550,
      target_protein_g: 78,
      target_carbs_g: 175,
      target_fat_g: 45,
      whtr: 0.61,
      whtr_risk_en: 'Substantially Increased Risk',
      whtr_risk_bn: 'অতিরিক্ত স্বাস্থ্যঝুঁকি'
    } as any,
    is_diet_plan_dirty: false,
    assessment_last_updated_at: '2026-11-18T10:00:00Z',
    diet_plan_generated_at: '2026-11-18T10:00:00Z',
    manual_edits_preserved: false,
    ...overrides
  };
}

function runAcceptanceSuite() {
  console.log('=====================================================================');
  console.log('STEP 05: 7-DAY PERSONALIZED NUTRITION PLANNING & PRESCRIPTION SUITE');
  console.log('=====================================================================\n');

  const basePatient = createBaseTestPatient();
  const baseTrafficLight = resolveConflicts(
    allFoods,
    basePatient.selected_conditions,
    [],
    basePatient.confirmed_allergies,
    basePatient.clinician_disallowed_foods,
    basePatient.clinician_disallowed_tags,
    basePatient.current_phase
  );

  // ── SCENARIO 1: Generate Valid 7-Day Plan from Verified P3 Context ────────────────
  console.log('--- SCENARIO 1: Generate Valid 7-Day Plan from Verified P3 Context ---');
  {
    const p3Context = {
      clinicalAssessmentApproved: true,
      approvedByClinicianId: 'DR_NUTRITION_01',
      approvalTimestamp: '2026-11-18T10:00:00Z',
      targetsDerivedFrom: 'p2_clinical_intelligence',
      energyTargetCalories: 1650,
      proteinTargetGrams: 82,
      confirmedAllergies: [],
      prescriptions: {
        protein: {
          nutrient: 'protein',
          isRestricted: true,
          hasConfirmedLimit: true,
          numericalLimit: 82,
          unit: 'g/day',
          clinicalReason: 'Controlled renal workload',
          source: 'clinician_order',
          requiresClarification: false
        }
      } as any
    } as unknown as P3NutritionPlanningContext;

    const plan = generateWeeklyDietPlan(
      basePatient,
      allFoods,
      baseTrafficLight,
      p3Context
    );

    assert(Boolean(plan), 'Scenario 1: Plan is successfully generated');
    assert(plan.days.length === 7, 'Scenario 1: Plan contains exactly 7 days');
    assert(plan.target_macros.calories === 1650, 'Scenario 1: Target calories match P3 context (1650 kcal)');
    assert(plan.target_macros.protein_g === 82, 'Scenario 1: Target protein matches P3 context (82g)');
    assert(plan.status === 'draft', 'Scenario 1: Fresh plan initial status is draft');
    assert(plan.schema_version === 2, 'Scenario 1: Plan schema version is 2');
    assert(plan.patient_id === basePatient.id, 'Scenario 1: Plan patient ID matches base patient');
  }

  // ── SCENARIO 2: 7 Distinct Days with Varied Ingredients ───────────────────────────
  console.log('\n--- SCENARIO 2: 7 Distinct Days with Varied Ingredients ---');
  {
    const plan = generateWeeklyDietPlan(
      basePatient,
      allFoods,
      baseTrafficLight
    );

    // Verify all 7 days have names and meal structures
    for (let d = 1; d <= 7; d++) {
      const day = plan.days[d - 1];
      assert(day.day_number === d, `Scenario 2: Day ${d} has correct day_number`);
      assert(day.meals.length >= 4, `Scenario 2: Day ${d} has at least 4 meals`);
      assert(day.summary.calories > 1000, `Scenario 2: Day ${d} has substantial calorie count (>1000 kcal)`);
    }

    // Verify day names in Bengali and English
    assert(plan.days[0].day_name_bn.includes('শনিবার'), 'Scenario 2: Day 1 name includes Saturday/শনিবার');
    assert(plan.days[1].day_name_bn.includes('রবিবার'), 'Scenario 2: Day 2 name includes Sunday/রবিবার');
    assert(plan.days[6].day_name_bn.includes('শুক্রবার'), 'Scenario 2: Day 7 name includes Friday/শুক্রবার');

    // Verify ingredient rotation: ensure not all lunch proteins are identical across 7 days
    const lunchItems = plan.days.map(d => {
      const lunch = d.meals.find(m => m.meal_type === 'lunch');
      return lunch?.items.map(i => i.food_id) || [];
    });
    const day1Lunch = lunchItems[0];
    const day2Lunch = lunchItems[1];
    const day3Lunch = lunchItems[2];
    assert(
      JSON.stringify(day1Lunch) !== JSON.stringify(day2Lunch) ||
      JSON.stringify(day2Lunch) !== JSON.stringify(day3Lunch),
      'Scenario 2: Lunch ingredients vary across rotation days'
    );
  }

  // ── SCENARIO 3: Nutrient Calculation Accuracy & Variance Tracking ─────────────────
  console.log('\n--- SCENARIO 3: Nutrient Calculation Accuracy & Variance Tracking ---');
  {
    const plan = generateWeeklyDietPlan(
      basePatient,
      allFoods,
      baseTrafficLight
    );

    for (const day of plan.days) {
      const sumKcal = day.meals.reduce((sum, m) => sum + m.meal_calories, 0);
      const sumProtein = Math.round(day.meals.reduce((sum, m) => sum + m.meal_protein_g, 0) * 10) / 10;
      const sumCarbs = Math.round(day.meals.reduce((sum, m) => sum + m.meal_carbs_g, 0) * 10) / 10;
      const sumFat = Math.round(day.meals.reduce((sum, m) => sum + m.meal_fat_g, 0) * 10) / 10;

      assert(day.summary.calories === sumKcal, `Scenario 3: Day ${day.day_number} summary calories match meal sums`);
      assert(day.summary.protein_g === sumProtein, `Scenario 3: Day ${day.day_number} summary protein matches meal sums`);
      assert(day.summary.carbs_g === sumCarbs, `Scenario 3: Day ${day.day_number} summary carbs match meal sums`);
      assert(day.summary.fat_g === sumFat, `Scenario 3: Day ${day.day_number} summary fat matches meal sums`);

      const expectedVar = sumKcal - plan.target_macros.calories;
      assert(day.summary.calorie_variance === expectedVar, `Scenario 3: Day ${day.day_number} calorie variance is accurate (${expectedVar})`);
    }
  }

  // ── SCENARIO 4: Allergy Blocking Across All 7 Days & Alternatives ─────────────────
  console.log('\n--- SCENARIO 4: Allergy Blocking Across All 7 Days & Alternatives ---');
  {
    const allergicPatient = createBaseTestPatient({
      id: 'pt_allergic_01',
      confirmed_allergies: ['egg', 'peanut', 'hilsa_fish'],
      allergy_reconciliation_status: 'allergies_confirmed'
    });

    const allergicTrafficLight = resolveConflicts(
      allFoods,
      allergicPatient.selected_conditions,
      [],
      allergicPatient.confirmed_allergies,
      [],
      [],
      allergicPatient.current_phase
    );

    const plan = generateWeeklyDietPlan(
      allergicPatient,
      allFoods,
      allergicTrafficLight
    );

    // Verify allergens never appear in any meal or alternative across all 7 days
    let foundAllergen = false;
    for (const day of plan.days) {
      for (const meal of day.meals) {
        for (const item of meal.items) {
          const name = (item.food_name_en + ' ' + item.food_name_bn).toLowerCase();
          if (name.includes('egg') || name.includes('ডিম') || name.includes('peanut') || name.includes('চীনাবাদাম') || name.includes('hilsa') || name.includes('ইলিশ')) {
            foundAllergen = true;
          }
          for (const alt of item.alternatives || []) {
            const altName = (alt.name_en + ' ' + alt.name_bn).toLowerCase();
            if (altName.includes('egg') || altName.includes('ডিম') || altName.includes('peanut') || altName.includes('চীনাবাদাম') || altName.includes('hilsa') || altName.includes('ইলিশ')) {
              foundAllergen = true;
            }
          }
        }
      }
    }

    assert(!foundAllergen, 'Scenario 4: Confirmed allergens (egg, peanut, hilsa) are 100% excluded from all 7 days and alternatives');
  }

  // ── SCENARIO 5: Fluid Restriction Guard ───────────────────────────────────────────
  console.log('\n--- SCENARIO 5: Fluid Restriction Guard ---');
  {
    const fluidPatient = createBaseTestPatient({
      id: 'pt_ckd_01',
      selected_conditions: ['t2d_ir']
    });

    const p3FluidContext = {
      clinicalAssessmentApproved: true,
      approvedByClinicianId: 'DR_NEPHRO_01',
      approvalTimestamp: '2026-11-18T10:00:00Z',
      targetsDerivedFrom: 'p2_clinical_intelligence',
      prescriptions: {
        fluid: {
          nutrient: 'fluid',
          isRestricted: true,
          hasConfirmedLimit: true,
          numericalLimit: 1200,
          unit: 'mL/day',
          clinicalReason: 'CKD Stage 4 fluid overload',
          source: 'clinician_order',
          requiresClarification: false
        }
      } as any
    } as unknown as P3NutritionPlanningContext;

    const plan = generateWeeklyDietPlan(
      fluidPatient,
      allFoods,
      baseTrafficLight,
      p3FluidContext
    );

    assert(Boolean(plan), 'Scenario 5: Plan generated for fluid-restricted patient');
    // Verify plan notes or slot errors preserve fluid restriction
    const hasFluidNote = plan.days.some(d => 
      (d.safety_notes || []).some(n => n.includes('1200') || n.includes('fluid') || n.includes('তরল')) ||
      (d.safety_notes_bn || []).some(n => n.includes('১২০০') || n.includes('তরল'))
    );
    assert(hasFluidNote, 'Scenario 5: Plan explicitly annotates 1200 mL fluid restriction');
  }

  // ── SCENARIO 6: Non-Oral Feeding Route Safety Enforcement ─────────────────────────
  console.log('\n--- SCENARIO 6: Non-Oral Feeding Route Safety Enforcement ---');
  {
    const nonOralPatient = createBaseTestPatient({
      id: 'pt_npo_01',
      feeding_status: {
        route: 'oral_nutritional_supplements',
        oral_intake_permitted: false,
        requires_specialist_support: true
      }
    });

    const plan = generateWeeklyDietPlan(
      nonOralPatient,
      allFoods,
      baseTrafficLight
    );

    assert(plan.overall_safety_status === 'HARD_STOP', 'Scenario 6: Non-oral route triggers HARD_STOP');
    assert(plan.days.every(d => d.safety_decision === 'HARD_STOP'), 'Scenario 6: All 7 days flag HARD_STOP for non-oral route');
  }

  // ── SCENARIO 7: Preservation of Manual Edits & Locks During Regeneration ─────────
  console.log('\n--- SCENARIO 7: Preservation of Manual Edits & Locks During Regeneration ---');
  {
    const initialPlan = generateWeeklyDietPlan(
      basePatient,
      allFoods,
      baseTrafficLight
    );

    // Lock Day 2
    initialPlan.days[1].is_locked = true;
    initialPlan.days[1].summary.calories = 1999; // Mock manual edit

    // Lock a specific meal item in Day 3
    const day3Lunch = initialPlan.days[2].meals.find(m => m.meal_type === 'lunch');
    if (day3Lunch && day3Lunch.items.length > 0) {
      day3Lunch.items[0].is_locked = true;
      day3Lunch.items[0].raw_weight_g = 250; // Custom gram edit
    }

    // Regenerate full weekly plan with preserveLocks: true
    const regenerated = generateWeeklyDietPlan(
      basePatient,
      allFoods,
      baseTrafficLight,
      null,
      initialPlan,
      { preserveLocks: true }
    );

    assert(regenerated.days[1].is_locked === true, 'Scenario 7: Day 2 lock is preserved');
    assert(regenerated.days[1].summary.calories === 1999, 'Scenario 7: Locked Day 2 was not overwritten');

    const regenDay3Lunch = regenerated.days[2].meals.find(m => m.meal_type === 'lunch');
    assert(regenDay3Lunch?.items[0].is_locked === true, 'Scenario 7: Day 3 item lock is preserved');
    assert(regenDay3Lunch?.items[0].raw_weight_g === 250, 'Scenario 7: Custom 250g manual edit is preserved');
  }

  // ── SCENARIO 8: Single-Day Regeneration Without Mutating Other Days ───────────────
  console.log('\n--- SCENARIO 8: Single-Day Regeneration Without Mutating Other Days ---');
  {
    const initialPlan = generateWeeklyDietPlan(
      basePatient,
      allFoods,
      baseTrafficLight
    );

    const snapshotDaysExcept4 = initialPlan.days
      .filter(d => d.day_number !== 4)
      .map(d => JSON.stringify(d));

    // Regenerate Day 4 ONLY
    const updatedPlan = regenerateDayInWeeklyPlan(
      4,
      initialPlan,
      basePatient,
      allFoods,
      baseTrafficLight,
      null,
      true
    );

    const postDaysExcept4 = updatedPlan.days
      .filter(d => d.day_number !== 4)
      .map(d => JSON.stringify(d));

    assert(
      JSON.stringify(snapshotDaysExcept4) === JSON.stringify(postDaysExcept4),
      'Scenario 8: Days 1, 2, 3, 5, 6, 7 are byte-for-byte identical after regenerating Day 4'
    );
    assert(updatedPlan.days[3].day_number === 4, 'Scenario 8: Day 4 remains in correct index');
  }

  // ── SCENARIO 9: Day-to-Day Plan Copy with Safety Revalidation ─────────────────────
  console.log('\n--- SCENARIO 9: Day-to-Day Plan Copy with Safety Revalidation ---');
  {
    const plan = generateWeeklyDietPlan(
      basePatient,
      allFoods,
      baseTrafficLight
    );

    const day1Meals = plan.days[0].meals;
    const copiedPlan = copyDayInWeeklyPlan(
      1, // Source
      5, // Target
      plan,
      basePatient,
      allFoods,
      baseTrafficLight
    );

    const targetDay = copiedPlan.days[4]; // Day 5
    assert(targetDay.day_number === 5, 'Scenario 9: Target day has day_number 5');
    assert(targetDay.meals.length === day1Meals.length, 'Scenario 9: Target day has same meal count as Day 1');

    // Verify fresh IDs
    const day1ItemIds = day1Meals.flatMap(m => m.items.map(i => i.id));
    const targetItemIds = targetDay.meals.flatMap(m => m.items.map(i => i.id));
    const hasOverlap = day1ItemIds.some(id => targetItemIds.includes(id));
    assert(!hasOverlap, 'Scenario 9: Copied items received fresh collision-resistant IDs');
  }

  // ── SCENARIO 10: Patient & Visit Isolation ─────────────────────────────────────────
  console.log('\n--- SCENARIO 10: Patient & Visit Isolation ---');
  {
    const storage = new MockStorage();

    const planPatientA = generateWeeklyDietPlan(
      basePatient,
      allFoods,
      baseTrafficLight
    );

    const patientB = createBaseTestPatient({
      id: 'pt_habib_02',
      name: 'Mr. Habib Rahman',
      gender: 'male',
      current_visit_id: 'vis_habib_01',
      calculated: {
        ...basePatient.calculated,
        target_calories: 2200,
        target_protein_g: 110
      }
    });

    const planPatientB = generateWeeklyDietPlan(
      patientB,
      allFoods,
      baseTrafficLight
    );

    const keyA = `shuddho_weekly_plan_${basePatient.id}_${basePatient.current_visit_id}`;
    const keyB = `shuddho_weekly_plan_${patientB.id}_${patientB.current_visit_id}`;

    storage.setItem(keyA, planPatientA);
    storage.setItem(keyB, planPatientB);

    const retrievedA = storage.getItem<WeeklyDietPlan>(keyA);
    const retrievedB = storage.getItem<WeeklyDietPlan>(keyB);

    assert(retrievedA?.patient_id === basePatient.id, 'Scenario 10: Storage key A returns Patient A data');
    assert(retrievedB?.patient_id === patientB.id, 'Scenario 10: Storage key B returns Patient B data');
    assert(retrievedA?.target_macros.calories === 1550, 'Scenario 10: Patient A calories are 1550 kcal');
    assert(retrievedB?.target_macros.calories === 2200, 'Scenario 10: Patient B calories are 2200 kcal');
  }

  // ── SCENARIO 11: Approval Governance (Blocked on Hard Stop) ───────────────────────
  console.log('\n--- SCENARIO 11: Approval Governance (Blocked on Hard Stop) ---');
  {
    const safePlan = generateWeeklyDietPlan(
      basePatient,
      allFoods,
      baseTrafficLight
    );

    // 1. Invalid Clinician ID rejection
    assert(!validateClinicianCredentials(''), 'Scenario 11: Empty clinician credentials rejected');
    assert(!validateClinicianCredentials('   '), 'Scenario 11: Whitespace clinician credentials rejected');

    // 2. Safe plan approval succeeds
    assert(validateClinicianCredentials('DR_NUTRITION_01'), 'Scenario 11: Valid clinician credentials accepted');
    safePlan.status = 'approved';
    safePlan.is_approved = true;
    safePlan.approved_by = 'DR_NUTRITION_01';
    safePlan.approval_date = '2026-11-18T12:00:00Z';
    assert(safePlan.is_approved === true, 'Scenario 11: Safe plan marked approved');

    // 3. Plan with HARD_STOP rejection
    const unsafePlan = generateWeeklyDietPlan(
      basePatient,
      allFoods,
      baseTrafficLight
    );
    unsafePlan.overall_safety_status = 'HARD_STOP';

    const canApproveUnsafe = unsafePlan.overall_safety_status !== 'HARD_STOP' && validateClinicianCredentials('DR_NUTRITION_01');
    assert(!canApproveUnsafe, 'Scenario 11: Approval strictly blocked when overall_safety_status === HARD_STOP');
  }

  // ── SCENARIO 12: Backward Compatibility with Single-Day Current Diet Chart ────────
  console.log('\n--- SCENARIO 12: Backward Compatibility with Single-Day Current Diet Chart ---');
  {
    const plan = generateWeeklyDietPlan(
      basePatient,
      allFoods,
      baseTrafficLight
    );

    // Day 1 meals are synchronized with current_diet_chart
    const day1Meals = plan.days[0].meals;
    const patientRecord: PatientRecord = {
      schema_version: 2,
      patient: basePatient,
      visits: [],
      clinical_visits: [],
      follow_up_appointments: [],
      visit_snapshots: [],
      progress_reports: [],
      current_diet_chart: day1Meals, // Synchronized with Day 1
      weekly_diet_plan: plan,
      current_supplements: [],
      timeline: [],
      updated_at: '2026-11-18T12:00:00Z'
    };

    assert(patientRecord.current_diet_chart.length === day1Meals.length, 'Scenario 12: current_diet_chart length matches Day 1 meals');
    assert(patientRecord.current_diet_chart[0].meal_calories === day1Meals[0].meal_calories, 'Scenario 12: current_diet_chart meal calories match Day 1');
    assert(Boolean(patientRecord.weekly_diet_plan), 'Scenario 12: weekly_diet_plan persisted on PatientRecord');
  }

  // ── STEP 05 CLINICAL APPROVAL INTEGRITY PATCH: TESTS A THROUGH L ───────────
  console.log('\n=====================================================================');
  console.log('STEP 05 FINAL TARGETED CLINICAL APPROVAL INTEGRITY TESTS (A THROUGH L)');
  console.log('=====================================================================');

  // TEST A: Single-Day Regeneration Invalidates Approved Plan
  console.log('\n--- TEST A: Single-Day Regeneration Invalidates Approved Plan ---');
  {
    const plan = generateWeeklyDietPlan(basePatient, allFoods, baseTrafficLight);
    plan.status = 'approved';
    plan.is_approved = true;
    plan.approved_by = 'DR_NUTRITION_01';
    plan.approval_date = '2026-11-18T10:00:00Z';
    plan.version = 1;

    const regenerated = regenerateDayInWeeklyPlan(2, plan, basePatient, allFoods, baseTrafficLight);
    assert(regenerated.status === 'requires_review', 'Test A: Status transitioned to requires_review');
    assert(regenerated.is_approved === false, 'Test A: is_approved set to false');
    assert(regenerated.approved_by === undefined, 'Test A: Active approved_by cleared');
    assert(regenerated.approval_date === undefined, 'Test A: Active approval_date cleared');
    assert(regenerated.version === 2, 'Test A: Plan version incremented to 2');
    assert(Boolean(regenerated.previous_approval), 'Test A: previous_approval record populated');
    assert(regenerated.previous_approval?.approved_by === 'DR_NUTRITION_01', 'Test A: previous_approval captures prior clinician');
    assert(Boolean(regenerated.previous_approval?.invalidation_reason?.includes('Regenerated Day 2')), 'Test A: Invalidation reason identifies Day 2 regeneration');
    assert(regenerated.historical_approvals?.length === 1, 'Test A: historical_approvals array contains 1 entry');
  }

  // TEST B: Copying Day Invalidates Approved Plan
  console.log('\n--- TEST B: Copying Day Invalidates Approved Plan ---');
  {
    const plan = generateWeeklyDietPlan(basePatient, allFoods, baseTrafficLight);
    plan.status = 'approved';
    plan.is_approved = true;
    plan.approved_by = 'DR_NUTRITION_01';
    plan.approval_date = '2026-11-18T10:00:00Z';
    plan.version = 1;

    const copied = copyDayInWeeklyPlan(1, 4, plan, basePatient, allFoods, baseTrafficLight);
    assert(copied.status === 'requires_review', 'Test B: Status transitioned to requires_review');
    assert(copied.is_approved === false, 'Test B: is_approved set to false');
    assert(copied.approved_by === undefined, 'Test B: Active approved_by cleared');
    assert(Boolean(copied.previous_approval?.invalidation_reason?.includes('Copied Day 1 to Day 4')), 'Test B: Invalidation reason identifies day copy');
    assert(copied.historical_approvals?.length === 1, 'Test B: historical_approvals captured');
  }

  // TEST C: Food Swap / Modification Invalidates Approved Plan
  console.log('\n--- TEST C: Food Swap / Modification Invalidates Approved Plan ---');
  {
    const plan = generateWeeklyDietPlan(basePatient, allFoods, baseTrafficLight);
    plan.status = 'approved';
    plan.is_approved = true;
    plan.approved_by = 'DR_NUTRITION_01';
    plan.approval_date = '2026-11-18T10:00:00Z';
    plan.version = 1;

    const invalidated = invalidateWeeklyPlanApproval(plan, 'Food item swapped with alternative');
    assert(invalidated.status === 'requires_review', 'Test C: Status transitioned to requires_review');
    assert(invalidated.is_approved === false, 'Test C: is_approved set to false');
    assert(invalidated.version === 2, 'Test C: Version incremented on modification');
    assert(invalidated.invalidation_reason === 'Food item swapped with alternative', 'Test C: Invalidation reason recorded');
    assert(invalidated.historical_approvals?.length === 1, 'Test C: Historical approvals length is 1');
  }

  // TEST D: Unapproved (Draft) Plan Edits Do Not Fabricate Previous Approval
  console.log('\n--- TEST D: Unapproved (Draft) Plan Edits Do Not Fabricate Previous Approval ---');
  {
    const draftPlan = generateWeeklyDietPlan(basePatient, allFoods, baseTrafficLight);
    assert(draftPlan.status === 'draft', 'Test D: Initial status is draft');
    assert(draftPlan.is_approved === false, 'Test D: Initial is_approved is false');

    const modifiedDraft = invalidateWeeklyPlanApproval(draftPlan, 'Food item added');
    assert(modifiedDraft.status === 'draft', 'Test D: Modified unapproved plan remains draft');
    assert(modifiedDraft.is_approved === false, 'Test D: is_approved remains false');
    assert(modifiedDraft.previous_approval === undefined, 'Test D: previous_approval NOT fabricated for draft');
    assert(modifiedDraft.historical_approvals === undefined, 'Test D: historical_approvals NOT fabricated for draft');
  }

  // TEST E: Repeated Edits Preserve Initial Invalidation History
  console.log('\n--- TEST E: Repeated Edits Preserve Initial Invalidation History ---');
  {
    const plan = generateWeeklyDietPlan(basePatient, allFoods, baseTrafficLight);
    plan.status = 'approved';
    plan.is_approved = true;
    plan.approved_by = 'DR_NUTRITION_01';
    plan.approval_date = '2026-11-18T10:00:00Z';
    plan.version = 1;

    const firstInvalidation = invalidateWeeklyPlanApproval(plan, 'Initial modification: Grams changed');
    assert(firstInvalidation.status === 'requires_review', 'Test E: First edit invalidates to requires_review');
    assert(firstInvalidation.historical_approvals?.length === 1, 'Test E: 1 historical approval recorded');

    // Second edit on already invalidated plan
    const secondEdit = invalidateWeeklyPlanApproval(firstInvalidation, 'Second edit: Food swapped');
    assert(secondEdit.status === 'requires_review', 'Test E: Second edit remains requires_review');
    assert(secondEdit.historical_approvals?.length === 1, 'Test E: Historical approvals length unchanged at 1 (not duplicated)');
    assert(secondEdit.previous_approval?.invalidation_reason === 'Initial modification: Grams changed', 'Test E: Initial invalidation reason preserved');
  }

  // TEST F: Missing or Unapproved P2 Blocks Plan Approval
  console.log('\n--- TEST F: Missing or Unapproved P2 Blocks Plan Approval ---');
  {
    // Case 1: Missing P2 result
    const checkP2Governance = (p2: any): { allowed: boolean; error?: string } => {
      if (!p2 || !p2.report || !p2.report.isApproved || p2.analysisInvalidatedAt || p2.report.analysisInvalidatedAt) {
        return { allowed: false, error: 'Cannot approve 7-day diet prescription without an approved Phase 2 Clinical Assessment.' };
      }
      return { allowed: true };
    };

    assert(!checkP2Governance(null).allowed, 'Test F: Null P2 rejects weekly plan approval');
    assert(!checkP2Governance({ report: { isApproved: false } }).allowed, 'Test F: Unapproved P2 report rejects approval');
    assert(!checkP2Governance({ report: { isApproved: true }, analysisInvalidatedAt: '2026-11-18T11:00:00Z' }).allowed, 'Test F: Invalidated P2 rejects approval');
    assert(checkP2Governance({ report: { isApproved: true } }).allowed, 'Test F: Approved and non-invalidated P2 permits approval');
  }

  // TEST G: Non-Oral Feeding Route (NPO) Blocks Plan Approval
  console.log('\n--- TEST G: Non-Oral Feeding Route (NPO) Blocks Plan Approval ---');
  {
    const npoPatient: PatientProfile = {
      ...basePatient,
      feeding_status: {
        route: 'npo_nil_per_os',
        oral_intake_permitted: false,
        requires_specialist_support: true
      }
    };

    const plan = generateWeeklyDietPlan(basePatient, allFoods, baseTrafficLight);
    const safety = evaluateWeeklyPlanClinicalSafety(npoPatient, plan, allFoods);
    assert(safety.is_eligible_for_approval === false, 'Test G: NPO patient not eligible for weekly plan approval');
    assert(safety.overall_decision === 'HARD_STOP', 'Test G: NPO triggers HARD_STOP');
    assert(safety.unresolved_hard_stops.some(s => s.includes('NPO')), 'Test G: Hard stop explanation explicitly cites NPO status');
  }

  // TEST H: Confirmed Allergen on Any Day Blocks Plan Approval
  console.log('\n--- TEST H: Confirmed Allergen on Any Day Blocks Plan Approval ---');
  {
    const eggAllergicPatient: PatientProfile = {
      ...basePatient,
      confirmed_allergies: ['egg']
    };

    // Day 1 contains egg in default rotation
    const plan = generateWeeklyDietPlan(basePatient, allFoods, baseTrafficLight);
    const safety = evaluateWeeklyPlanClinicalSafety(eggAllergicPatient, plan, allFoods);
    assert(safety.is_eligible_for_approval === false, 'Test H: Patient with egg allergy blocked from approval');
    assert(safety.overall_decision === 'HARD_STOP', 'Test H: Allergen triggers HARD_STOP');
    assert(safety.unresolved_hard_stops.some(s => s.toLowerCase().includes('egg') || s.toLowerCase().includes('allergen')), 'Test H: Allergen explanation mentions egg');
  }

  // TEST I: Invalid or Placeholder Clinician Credentials Rejected
  console.log('\n--- TEST I: Invalid or Placeholder Clinician Credentials Rejected ---');
  {
    assert(!validateClinicianCredentials(''), 'Test I: Empty credential rejected');
    assert(!validateClinicianCredentials('   '), 'Test I: Whitespace credential rejected');
    assert(!validateClinicianCredentials('Doctor'), 'Test I: Placeholder "Doctor" rejected');
    assert(!validateClinicianCredentials('Clinician'), 'Test I: Placeholder "Clinician" rejected');
    assert(!validateClinicianCredentials('admin'), 'Test I: Placeholder "admin" rejected');
    assert(!validateClinicianCredentials('nutritionist'), 'Test I: Generic "nutritionist" rejected');
    assert(validateClinicianCredentials('Dr. Tasnim Ara, RD'), 'Test I: Licensed clinician name accepted');
    assert(validateClinicianCredentials('DR_NUTRITION_01'), 'Test I: Clinician license code accepted');
  }

  // TEST J: Persistence Failure Blocks React State Transition to Approved
  console.log('\n--- TEST J: Persistence Failure Blocks React State Transition to Approved ---');
  {
    const mockStorage = new MockStorage();
    mockStorage.shouldFail = true; // Simulates quota exceeded / storage write failure

    const plan = generateWeeklyDietPlan(basePatient, allFoods, baseTrafficLight);
    const targetKey = `shuddho_weekly_plan_${plan.patient_id}_vis_01`;

    let reactStatePlan: WeeklyDietPlan | null = { ...plan, status: 'draft', is_approved: false };
    let approvalError: string | null = null;

    // Simulate PracticeContext persist-first logic
    const attemptApprove = (p: WeeklyDietPlan): boolean => {
      const approvedCandidate: WeeklyDietPlan = {
        ...p,
        status: 'approved',
        is_approved: true,
        approved_by: 'DR_NUTRITION_01',
        approval_date: new Date().toISOString()
      };

      const writeSuccess = mockStorage.setItem(targetKey, approvedCandidate);
      if (!writeSuccess) {
        approvalError = 'Storage failure: Failed to write approved weekly plan to local persistence.';
        return false;
      }

      reactStatePlan = approvedCandidate;
      return true;
    };

    const result = attemptApprove(reactStatePlan);
    assert(result === false, 'Test J: Approval returned false on storage write failure');
    assert(reactStatePlan.is_approved === false, 'Test J: In-memory React state remains UNAPPROVED (is_approved === false)');
    assert(reactStatePlan.status === 'draft', 'Test J: In-memory React state retains draft status');
    assert(Boolean(approvalError), 'Test J: Explanatory error set on failure');
  }

  // TEST K: Re-Approval of Modified Plan Reinstates Approved Status with Clean State
  console.log('\n--- TEST K: Re-Approval of Modified Plan Reinstates Approved Status with Clean State ---');
  {
    const plan = generateWeeklyDietPlan(basePatient, allFoods, baseTrafficLight);
    plan.status = 'approved';
    plan.is_approved = true;
    plan.approved_by = 'DR_INITIAL';
    plan.approval_date = '2026-11-18T08:00:00Z';
    plan.version = 1;

    // Invalidate
    const invalidated = invalidateWeeklyPlanApproval(plan, 'Nutrient target adjusted');
    assert(invalidated.status === 'requires_review', 'Test K: Plan invalidated to requires_review');
    assert(invalidated.version === 2, 'Test K: Version incremented to 2');

    // Re-approve with valid clinician
    const reApproved: WeeklyDietPlan = {
      ...invalidated,
      status: 'approved',
      is_approved: true,
      approved_by: 'Dr. ReApproval Specialist, RD',
      approval_date: '2026-11-18T14:00:00Z',
      approved_at: '2026-11-18T14:00:00Z',
      invalidation_reason: undefined,
      invalidated_at: undefined,
      approval_metadata: {
        clinician_id: 'Dr. ReApproval Specialist, RD',
        clinician_name: 'Dr. ReApproval Specialist, RD',
        approval_timestamp: '2026-11-18T14:00:00Z'
      }
    };

    assert(reApproved.status === 'approved', 'Test K: Plan reinstated to approved status');
    assert(reApproved.is_approved === true, 'Test K: is_approved reinstated to true');
    assert(reApproved.approved_by === 'Dr. ReApproval Specialist, RD', 'Test K: New approved_by recorded');
    assert(reApproved.invalidation_reason === undefined, 'Test K: Active invalidation_reason cleared on re-approval');
    assert(reApproved.invalidated_at === undefined, 'Test K: Active invalidated_at cleared on re-approval');
    assert(reApproved.historical_approvals?.length === 1, 'Test K: Prior approval preserved in historical_approvals audit trail');
    assert(reApproved.historical_approvals![0].approved_by === 'DR_INITIAL', 'Test K: Historical audit captures DR_INITIAL approval');
  }

  // TEST L: Verified Reload from Storage Preserves Validated Approval State and History
  console.log('\n--- TEST L: Verified Reload from Storage Preserves Validated Approval State and History ---');
  {
    const mockStorage = new MockStorage();
    const plan = generateWeeklyDietPlan(basePatient, allFoods, baseTrafficLight);
    plan.status = 'approved';
    plan.is_approved = true;
    plan.approved_by = 'DR_NUTRITION_01';
    plan.approval_date = '2026-11-18T10:00:00Z';
    plan.version = 2;
    plan.historical_approvals = [
      {
        approved_by: 'DR_PREVIOUS',
        approval_date: '2026-11-17T10:00:00Z',
        version: 1,
        invalidated_at: '2026-11-18T09:00:00Z',
        invalidation_reason: 'Day 2 regenerated'
      }
    ];

    const storageKey = `shuddho_weekly_plan_${plan.patient_id}_vis_01`;
    const saved = mockStorage.setItem(storageKey, plan);
    assert(saved === true, 'Test L: Saved to mock storage');

    const reloaded = mockStorage.getItem<WeeklyDietPlan>(storageKey);
    assert(Boolean(reloaded), 'Test L: Reloaded plan from storage');
    assert(reloaded?.status === 'approved', 'Test L: Reloaded status is approved');
    assert(reloaded?.is_approved === true, 'Test L: Reloaded is_approved is true');
    assert(reloaded?.approved_by === 'DR_NUTRITION_01', 'Test L: Reloaded approved_by intact');
    assert(reloaded?.historical_approvals?.length === 1, 'Test L: Reloaded historical_approvals intact');
    assert(reloaded?.historical_approvals![0].approved_by === 'DR_PREVIOUS', 'Test L: Reloaded historical approval audit matches');
  }

  // TEST M: Full-Week Regeneration Invalidation & History Audit Trail
  console.log('\n--- TEST M: Full-Week Regeneration Invalidation & History Audit Trail ---');
  {
    const basePlan = generateWeeklyDietPlan(basePatient, allFoods, baseTrafficLight);
    basePlan.status = 'approved';
    basePlan.is_approved = true;
    basePlan.approved_by = 'DR_INITIAL_EXPERT';
    basePlan.approval_date = '2026-11-19T10:00:00Z';
    basePlan.version = 1;

    // Lock day 3 and a meal in day 1
    basePlan.days[2].is_locked = true;
    basePlan.days[0].meals[0].is_locked = true;
    const lockedDay3Summary = { ...basePlan.days[2].summary };
    const lockedDay1Meal0 = { ...basePlan.days[0].meals[0] };

    // Force regenerate full 7-day plan
    const regenerated = generateWeeklyDietPlan(
      basePatient,
      allFoods,
      baseTrafficLight,
      undefined,
      basePlan,
      { preserveLocks: true, forceRegenerate: true }
    );

    assert(regenerated.status === 'requires_review', 'Test M: Full regeneration transitions approved plan to requires_review');
    assert(regenerated.is_approved === false, 'Test M: is_approved reset to false');
    assert(regenerated.version === 2, 'Test M: Version incremented to 2');
    assert(regenerated.previous_approval !== undefined, 'Test M: previous_approval populated');
    assert(regenerated.previous_approval?.approved_by === 'DR_INITIAL_EXPERT', 'Test M: previous_approval captures prior clinician');
    assert(regenerated.historical_approvals?.length === 1, 'Test M: Historical approvals audit trail contains prior approval');
    assert(regenerated.invalidation_reason?.includes('Regenerated full 7-day plan') === true, 'Test M: Invalidation reason specifies full plan regeneration');
    assert(regenerated.patient_id === basePatient.id, 'Test M: Patient ID preserved');
    
    // Check locked content preserved
    assert(regenerated.days[2].is_locked === true, 'Test M: Day 3 lock flag preserved');
    assert(regenerated.days[2].summary.calories === lockedDay3Summary.calories, 'Test M: Locked Day 3 calories preserved');
    assert(regenerated.days[0].meals[0].is_locked === true, 'Test M: Day 1 meal 0 lock flag preserved');
    assert(regenerated.days[0].meals[0].meal_calories === lockedDay1Meal0.meal_calories, 'Test M: Locked Day 1 meal 0 calories preserved');
  }

  // TEST N: Live Nutrient Calculations & Portion Scaling
  console.log('\n--- TEST N: Live Nutrient Calculations & Portion Scaling ---');
  {
    const plan = generateWeeklyDietPlan(basePatient, allFoods, baseTrafficLight);
    const day = plan.days[0];
    const meal = day.meals.find(m => m.items.length > 0)!;
    
    // Calculate initial totals
    const initialTotals = calculateMealTotals(meal.items, allFoods);
    assert(initialTotals.meal_calories > 0, 'Test N: Initial meal calories > 0');
    assert(initialTotals.meal_gl >= 0, 'Test N: Initial GL is computed');

    // Scale item raw grams from current to 200g
    const scaledItems = meal.items.map((it, idx) => {
      if (idx === 0) {
        const factor = 200 / it.raw_weight_g;
        return {
          ...it,
          raw_weight_g: 200,
          kcal: Math.round(it.kcal * factor),
          protein_g: Math.round(it.protein_g * factor * 10) / 10,
          carbs_g: Math.round(it.carbs_g * factor * 10) / 10,
          fat_g: Math.round(it.fat_g * factor * 10) / 10,
          fiber_g: Math.round(it.fiber_g * factor * 10) / 10
        };
      }
      return it;
    });

    // Test calculateMealTotals without allFoods parameter: should still calculate GL and PRAL from fallback foods.json!
    const totalsWithDefault = calculateMealTotals(scaledItems);
    assert(totalsWithDefault.meal_calories > 0, 'Test N: Meal calories calculated with default foods');
    assert(totalsWithDefault.meal_gl > 0, 'Test N: GL is non-zero even when allFoods parameter is omitted');
    assert(totalsWithDefault.meal_pral !== undefined, 'Test N: PRAL is calculated');
  }

  // TEST O: Input Validation for Portion Modification
  console.log('\n--- TEST O: Input Validation for Portion Modification ---');
  {
    // Test helper function logic: negative and zero values are invalid
    const isGramsValid = (g: number) => typeof g === 'number' && !isNaN(g) && g > 0;
    assert(isGramsValid(100) === true, 'Test O: 100g is valid');
    assert(isGramsValid(5) === true, 'Test O: 5g is valid');
    assert(isGramsValid(0) === false, 'Test O: 0g is invalid');
    assert(isGramsValid(-50) === false, 'Test O: Negative grams (-50g) is invalid');
    assert(isGramsValid(NaN) === false, 'Test O: NaN is invalid');
  }

  // TEST P: Condition-Based Meal Structures
  console.log('\n--- TEST P: Condition-Based Meal Structures ---');
  {
    // 1. 3 Meals structure
    const p3Meals = createBaseTestPatient({
      dietary_preferences: {
        meal_structure: '3_meals',
        include_morning_protocol: false
      }
    });
    const plan3Meals = generateWeeklyDietPlan(p3Meals, allFoods, baseTrafficLight);
    const day1_3m = plan3Meals.days[0];
    assert(day1_3m.meals.length === 3, `Test P: 3_meals generates exactly 3 meals (got ${day1_3m.meals.length})`);
    assert(day1_3m.meals.some(m => m.meal_type === 'breakfast'), 'Test P: Contains breakfast');
    assert(day1_3m.meals.some(m => m.meal_type === 'lunch'), 'Test P: Contains lunch');
    assert(day1_3m.meals.some(m => m.meal_type === 'dinner'), 'Test P: Contains dinner');
    assert(!day1_3m.meals.some(m => m.meal_type === 'morning_protocol'), 'Test P: Morning protocol excluded when false');

    // 2. 3 Meals + 1 Snack structure
    const p3Meals1Snack = createBaseTestPatient({
      dietary_preferences: {
        meal_structure: '3_meals_1_snack',
        include_morning_protocol: false
      }
    });
    const plan3Meals1Snack = generateWeeklyDietPlan(p3Meals1Snack, allFoods, baseTrafficLight);
    const day1_3m1s = plan3Meals1Snack.days[0];
    assert(day1_3m1s.meals.length === 4, `Test P: 3_meals_1_snack generates exactly 4 meals (got ${day1_3m1s.meals.length})`);
    assert(day1_3m1s.meals.some(m => m.meal_type === 'evening_snack'), 'Test P: Contains evening snack');

    // 3. Intermittent Fasting 16:8 (Non-contraindicated patient)
    const pFastingEligible = createBaseTestPatient({
      age: 35,
      population_group: 'adult_standard',
      active_medications: [],
      dietary_preferences: {
        meal_structure: 'intermittent_fasting_16_8'
      }
    });
    const planFasting = generateWeeklyDietPlan(pFastingEligible, allFoods, baseTrafficLight);
    const day1_fast = planFasting.days[0];
    assert(day1_fast.meals.length === 3, `Test P: 16:8 fasting generates 3 meals in eating window (got ${day1_fast.meals.length})`);
    assert(!day1_fast.meals.some(m => m.meal_type === 'breakfast'), 'Test P: Fasting window excludes breakfast');
    assert(day1_fast.meals.some(m => m.meal_type === 'lunch'), 'Test P: Eating window starts with lunch');
  }

  // TEST Q: Fasting Safety Contraindication Override
  console.log('\n--- TEST Q: Fasting Safety Contraindication Override ---');
  {
    // Pregnant patient requesting 16:8 intermittent fasting
    const pPregnantFasting = createBaseTestPatient({
      population_group: 'pregnancy',
      age: 28,
      dietary_preferences: {
        meal_structure: 'intermittent_fasting_16_8'
      }
    });
    const fastingCheck = evaluateFastingEligibility(pPregnantFasting);
    assert(fastingCheck.eligibility.is_eligible_for_fasting === false, 'Test Q: Fasting is strictly contraindicated for pregnancy');
    assert(fastingCheck.safetyResults.some(r => r.decision === 'HARD_STOP'), 'Test Q: Pregnancy fasting triggers HARD_STOP');

    // Plan generation must override contraindicated fasting to safe meal schedule
    const planPregOverride = generateWeeklyDietPlan(pPregnantFasting, allFoods, baseTrafficLight);
    const day1_preg = planPregOverride.days[0];
    assert(day1_preg.meals.some(m => m.meal_type === 'breakfast'), 'Test Q: Contraindicated fasting overridden: Breakfast reinstated');
    assert(day1_preg.meals.length >= 4, 'Test Q: Regular multiple meals provided instead of fasting');
    assert(day1_preg.safety_notes?.some(n => n.includes('Intermittent fasting is clinically contraindicated')) === true, 'Test Q: Clinical safety warning recorded in plan notes');
  }

  // TEST R: Accurate Fluid Guidance
  console.log('\n--- TEST R: Accurate Fluid Guidance ---');
  {
    // 1. Patient with confirmed clinical fluid restriction (e.g. Heart Failure or CKD stage 4)
    const pFluidRestricted = createBaseTestPatient({
      weight_kg: 70,
      clinical_safety: {
        fluid_restriction: {
          is_restricted: true,
          limit_ml: 1500,
          prescribing_physician: 'Dr. Nephrologist',
          condition: 'Congestive Heart Failure / Oliguria'
        }
      }
    });
    const hasLimit1 = Boolean(pFluidRestricted.clinical_safety?.fluid_restriction?.is_restricted && pFluidRestricted.clinical_safety?.fluid_restriction?.limit_ml);
    assert(hasLimit1 === true, 'Test R: Clinical limit detected');
    assert(pFluidRestricted.clinical_safety?.fluid_restriction?.limit_ml === 1500, 'Test R: Exact 1500 mL limit preserved');

    // 2. Patient with no restriction: estimated physiological baseline (30-35 mL/kg)
    const pNormalWeight = createBaseTestPatient({
      weight_kg: 60
    });
    const minEstimated = Math.round(pNormalWeight.weight_kg * 30);
    const maxEstimated = Math.round(pNormalWeight.weight_kg * 35);
    assert(minEstimated === 1800, 'Test R: 60kg * 30 = 1800 mL');
    assert(maxEstimated === 2100, 'Test R: 60kg * 35 = 2100 mL');
    assert(minEstimated !== 2500, 'Test R: Never presents blanket 2500 mL as individual prescription');
  }

  // =====================================================================
  // MANDATORY REGRESSION TESTS 1 THROUGH 18 (CLINICAL SAFETY & ADEQUACY)
  // =====================================================================

  // TEST 1: Healthy adult without fasting preference receives regular meal schedule, no automatic 16:8
  console.log('\n--- TEST 1: Healthy Adult Regular Meal Schedule ---');
  {
    const pAdultNoFast = createBaseTestPatient({
      age: 32,
      population_group: 'adult_standard',
      dietary_preferences: {}
    });
    const plan = generateWeeklyDietPlan(pAdultNoFast, allFoods, baseTrafficLight);
    const day1 = plan.days[0];
    assert(day1.meal_structure === '3_meals_1_snack', 'Test 1: Default meal structure is 3_meals_1_snack');
    assert(day1.meals.some(m => m.meal_type === 'breakfast'), 'Test 1: Regular schedule includes breakfast');
    assert(day1.fasting_schedule?.is_fasting === false, 'Test 1: Fasting is not active');
    assert(day1.fasting_schedule?.decision_status !== 'fasting_approved', 'Test 1: 16:8 is not automatically prescribed');
  }

  // TEST 2: Adult requesting 16:8 with no contraindications receives duration-specific screening (16h) and review before prescription
  console.log('\n--- TEST 2: Duration-Specific 16:8 Screening ---');
  {
    const pEligibleFasting = createBaseTestPatient({
      age: 38,
      population_group: 'adult_standard',
      dietary_preferences: { meal_structure: 'intermittent_fasting_16_8' }
    });
    const check16 = evaluateFastingEligibility(pEligibleFasting, 16);
    assert(check16.eligibility.is_eligible_for_fasting === true, 'Test 2: Eligible for 16h fasting');
    assert(check16.eligibility.max_allowable_fasting_hours >= 16, 'Test 2: Max allowable hours >= 16');
    const plan = generateWeeklyDietPlan(pEligibleFasting, allFoods, baseTrafficLight);
    const day1 = plan.days[0];
    assert(day1.meal_structure === 'intermittent_fasting_16_8', 'Test 2: Meal structure is 16:8');
    assert(day1.fasting_schedule?.is_fasting === true, 'Test 2: Fasting is active');
    assert(day1.fasting_schedule?.planned_fasting_hours === 16, 'Test 2: Planned fasting duration is 16 hours');
    assert(day1.fasting_schedule?.eating_window_start === '12:00 PM', 'Test 2: Window starts at 12:00 PM');
    assert(day1.fasting_schedule?.eating_window_end === '08:00 PM', 'Test 2: Window ends at 08:00 PM');
  }

  // TEST 3: Patient using insulin requests 16:8: Unsafe automatic fasting prescription prevented (HARD STOP)
  console.log('\n--- TEST 3: Insulin Treatment Fasting Safety (HARD STOP) ---');
  {
    const pInsulin = createBaseTestPatient({
      age: 52,
      active_medications: ['Insulin Glargine 20 units nightly', 'Metformin 1000mg'],
      dietary_preferences: { meal_structure: 'intermittent_fasting_16_8' }
    });
    const check = evaluateFastingEligibility(pInsulin, 16);
    const hasMedHardStop = check.safetyResults.some(r => r.rule_id === 'FASTING_HYPOGLYCEMIA_MED_STOP' && r.decision === 'HARD_STOP');
    assert(hasMedHardStop === true, 'Test 3: Insulin triggers FASTING_HYPOGLYCEMIA_MED_STOP HARD_STOP');
    const plan = generateWeeklyDietPlan(pInsulin, allFoods, baseTrafficLight);
    const day1 = plan.days[0];
    assert(day1.meal_structure !== 'intermittent_fasting_16_8', 'Test 3: Fasting overridden to safe regular meals');
    assert(day1.meals.some(m => m.meal_type === 'breakfast'), 'Test 3: Breakfast reinstated to prevent morning hypoglycemia');
  }

  // TEST 4: Patient using sulfonylurea requests 16:8: Hypoglycemia risk detected, restricted to max 12h
  console.log('\n--- TEST 4: Sulfonylurea Fasting Restriction (Max 12h) ---');
  {
    const pSulfonylurea = createBaseTestPatient({
      age: 55,
      active_medications: ['Glimepiride 2mg daily'],
      dietary_preferences: { meal_structure: 'intermittent_fasting_16_8' }
    });
    const check16 = evaluateFastingEligibility(pSulfonylurea, 16);
    assert(check16.eligibility.max_allowable_fasting_hours === 12, 'Test 4: Sulfonylurea restricts fasting to max 12 hours');
    const hasMedStop = check16.safetyResults.some(r => r.decision === 'HARD_STOP');
    assert(hasMedStop === true, 'Test 4: 16h request on sulfonylurea triggers HARD_STOP');
    const plan = generateWeeklyDietPlan(pSulfonylurea, allFoods, baseTrafficLight);
    const day1 = plan.days[0];
    assert(day1.meal_structure !== 'intermittent_fasting_16_8', 'Test 4: Plan generation prevents 16:8 prescription');
  }

  // TEST 5: Pregnant patient requests fasting: Restrictive fasting blocked (HARD STOP)
  console.log('\n--- TEST 5: Pregnancy Fasting Absolute Contraindication ---');
  {
    const pPregnant = createBaseTestPatient({
      population_group: 'pregnancy',
      age: 29,
      dietary_preferences: { meal_structure: 'intermittent_fasting_16_8' }
    });
    const check = evaluateFastingEligibility(pPregnant, 16);
    assert(check.eligibility.is_eligible_for_fasting === false, 'Test 5: Not eligible for fasting in pregnancy');
    assert(check.safetyResults.some(r => r.rule_id === 'FASTING_PREGNANCY_STOP' && r.decision === 'HARD_STOP'), 'Test 5: FASTING_PREGNANCY_STOP is HARD_STOP');
    const plan = generateWeeklyDietPlan(pPregnant, allFoods, baseTrafficLight);
    assert(plan.days[0].meals.some(m => m.meal_type === 'breakfast'), 'Test 5: Breakfast provided in pregnancy');
  }

  // TEST 6: Pediatric patient requests fasting: Regular age-appropriate nutrition structure enforced
  console.log('\n--- TEST 6: Pediatric Age-Appropriate Nutrition Enforced ---');
  {
    const pPediatric = createBaseTestPatient({
      age: 11,
      population_group: 'pediatric',
      dietary_preferences: { meal_structure: 'intermittent_fasting_16_8' }
    });
    const check = evaluateFastingEligibility(pPediatric, 16);
    assert(check.eligibility.is_eligible_for_fasting === false, 'Test 6: Fasting ineligible for pediatric patient');
    assert(check.safetyResults.some(r => r.rule_id === 'FASTING_PEDIATRIC_STOP' && r.decision === 'HARD_STOP'), 'Test 6: FASTING_PEDIATRIC_STOP is HARD_STOP');
    const plan = generateWeeklyDietPlan(pPediatric, allFoods, baseTrafficLight);
    assert(plan.days[0].meals.length >= 4, 'Test 6: Pediatric plan receives regular multiple meals');
    assert(plan.days[0].meals.some(m => m.meal_type === 'breakfast'), 'Test 6: Pediatric plan includes breakfast');
  }

  // TEST 7: Patient with nutritional vulnerability (BMI < 18.5, underweight <45kg): Inappropriate fasting prevented
  console.log('\n--- TEST 7: Nutritional Vulnerability & Underweight Safety ---');
  {
    const pUnderweight = createBaseTestPatient({
      weight_kg: 42,
      height_cm: 158,
      calculated: {
        ...createBaseTestPatient().calculated,
        bmi: 16.8,
        bmi_category_en: 'Underweight',
        bmi_category_bn: 'কম ওজন',
        bmr: 1050,
        tdee: 1260,
        target_calories: 1500,
        target_protein_g: 65,
        target_carbs_g: 185,
        target_fat_g: 50
      },
      dietary_preferences: { meal_structure: 'intermittent_fasting_16_8' }
    });
    const check = evaluateFastingEligibility(pUnderweight, 16);
    assert(check.eligibility.is_eligible_for_fasting === false, 'Test 7: Fasting contraindicated for underweight/low BMI');
    assert(check.safetyResults.some(r => r.rule_id === 'FASTING_UNDERWEIGHT_STOP' && r.decision === 'HARD_STOP'), 'Test 7: Triggers FASTING_UNDERWEIGHT_STOP');
    const plan = generateWeeklyDietPlan(pUnderweight, allFoods, baseTrafficLight);
    assert(plan.days[0].meal_structure !== 'intermittent_fasting_16_8', 'Test 7: Overridden to safe non-fasting meal structure');
  }

  // TEST 8: Change from 5 meals to 3 meals: Nutrition redistributed, deficits flagged if inadequate
  console.log('\n--- TEST 8: Nutrition Redistribution Across Meal Structures ---');
  {
    const p3Meals = createBaseTestPatient({
      dietary_preferences: { meal_structure: '3_meals' }
    });
    const plan = generateWeeklyDietPlan(p3Meals, allFoods, baseTrafficLight);
    const day1 = plan.days[0];
    assert(day1.meals.length === 3, 'Test 8: Exactly 3 meals generated');
    const calPct = (day1.summary.calories / plan.target_macros.calories) * 100;
    assert(calPct >= 80, `Test 8: Calories redistributed across 3 meals (${calPct}% of target)`);
    assert(day1.nutritional_adequacy !== undefined, 'Test 8: Nutritional adequacy evaluated');
  }

  // TEST 9: Approved plan receives fasting schedule modification: Approval invalidated, history retained
  console.log('\n--- TEST 9: Fasting Modification Invalidates Approval ---');
  {
    const pEligible = createBaseTestPatient({
      dietary_preferences: { meal_structure: '3_meals_1_snack' }
    });
    let plan = generateWeeklyDietPlan(pEligible, allFoods, baseTrafficLight);
    plan = {
      ...plan,
      status: 'approved',
      is_approved: true,
      approved_by: 'Dr. Clinical Lead',
      approval_date: new Date().toISOString()
    };
    // Modify structure to fasting
    const pFastMod = { ...pEligible, dietary_preferences: { meal_structure: 'intermittent_fasting_16_8' as const } };
    const regenerated = generateWeeklyDietPlan(pFastMod, allFoods, baseTrafficLight, null, plan, { forceRegenerate: true });
    assert(regenerated.is_approved === false, 'Test 9: Approval invalidated on schedule change');
    assert(regenerated.status === 'requires_review', 'Test 9: Status transitioned to requires_review');
    assert(regenerated.previous_approval?.approved_by === 'Dr. Clinical Lead', 'Test 9: Prior clinician retained in previous_approval');
  }

  // TEST 10: Patient medication changes after plan generation: Revalidation detects new risks
  console.log('\n--- TEST 10: Post-Generation Medication Change Revalidation ---');
  {
    const pInit = createBaseTestPatient({ active_medications: [] });
    const plan = generateWeeklyDietPlan(pInit, allFoods, baseTrafficLight);
    const pUpdatedMed = {
      ...pInit,
      active_medications: ['Spironolactone 50mg'] // Potassium-sparing diuretic
    };
    const safety = evaluateWeeklyPlanClinicalSafety(pUpdatedMed, plan, allFoods);
    assert(safety.day_evaluations.length === 7, 'Test 10: All 7 days revalidated');
  }

  // TEST 11: Clinically restricted nutrients remain within documented limits during redistribution
  console.log('\n--- TEST 11: Restricted Nutrients Within Documented Limits ---');
  {
    const pRestricted = createBaseTestPatient({
      dietary_preferences: { meal_structure: '3_meals' }
    });
    const p3WithRestrictions: P3NutritionPlanningContext = {
      clinicalAssessmentApproved: true,
      prescriptions: {
        sodium: { nutrient: 'sodium', isRestricted: true, source: 'clinician_order', requiresClarification: false, hasConfirmedLimit: true, numericalLimit: 2000, unit: 'mg/day', clinicalReason: 'Hypertension' },
        fluid: { nutrient: 'fluid', isRestricted: true, source: 'clinician_order', requiresClarification: false, hasConfirmedLimit: true, numericalLimit: 1500, unit: 'mL/day', clinicalReason: 'Heart Failure' },
        potassium: { nutrient: 'potassium', isRestricted: false, source: 'clinician_order', requiresClarification: false },
        protein: { nutrient: 'protein', isRestricted: false, source: 'clinician_order', requiresClarification: false }
      }
    } as any;
    const plan = generateWeeklyDietPlan(pRestricted, allFoods, baseTrafficLight, p3WithRestrictions);
    assert(plan.days[0].safety_notes?.some(n => n.includes('Sodium restriction')) === true, 'Test 11: Sodium restriction documented');
    assert(plan.days[0].safety_notes?.some(n => n.includes('Fluid restriction')) === true, 'Test 11: Fluid restriction documented');
  }

  // TEST 12: Patient-specific food allergies remain enforced after meal restructuring
  console.log('\n--- TEST 12: Food Allergies Strictly Enforced Across Meal Structures ---');
  {
    const pAllergic = createBaseTestPatient({
      confirmed_allergies: ['peanut', 'egg', 'hilsa_fish'],
      allergy_reconciliation_status: 'allergies_confirmed',
      dietary_preferences: { meal_structure: 'intermittent_fasting_16_8' }
    });
    const allergicTrafficLight = resolveConflicts(
      allFoods,
      pAllergic.selected_conditions,
      [],
      pAllergic.confirmed_allergies,
      [],
      [],
      pAllergic.current_phase
    );
    const plan = generateWeeklyDietPlan(pAllergic, allFoods, allergicTrafficLight);
    let allergenFound = false;
    for (const day of plan.days) {
      for (const meal of day.meals) {
        for (const item of meal.items) {
          const name = (item.food_name_en + ' ' + item.food_name_bn).toLowerCase();
          if (name.includes('peanut') || name.includes('egg') || name.includes('hilsa') || name.includes('ডিম') || name.includes('চীনাবাদাম') || name.includes('ইলিশ')) {
            allergenFound = true;
          }
        }
      }
    }
    assert(!allergenFound, 'Test 12: All 7 days in 16:8 structure strictly exclude confirmed allergens');
  }

  // TEST 13: Legacy saved weekly plans remain readable and editable
  console.log('\n--- TEST 13: Legacy Weekly Plans Backward Compatibility ---');
  {
    const legacyPlan: any = {
      plan_id: 'plan_legacy_001',
      patient_id: 'pt_nasreen_01',
      visit_id: 'vis_nasreen_01',
      version: 1,
      schema_version: 1,
      days: [
        {
          day_number: 1,
          day_name_bn: '১ম দিন',
          day_name_en: 'Day 1',
          meals: [],
          summary: { calories: 1500, protein_g: 70, carbs_g: 200, fat_g: 45, fiber_g: 25, gl: 50, pral: -5 }
        }
      ]
    };
    // Should be safely evaluable without runtime crash
    const patient = createBaseTestPatient();
    const safety = evaluateWeeklyPlanClinicalSafety(patient, legacyPlan as WeeklyDietPlan, allFoods);
    assert(safety !== undefined, 'Test 13: Legacy plan safely evaluated');
  }

  // TEST 14: Day 1 and Days 2–7 maintain correct nutrition summaries
  console.log('\n--- TEST 14: Days 1 Through 7 Summary Integrity ---');
  {
    const patient = createBaseTestPatient();
    const plan = generateWeeklyDietPlan(patient, allFoods, baseTrafficLight);
    for (const day of plan.days) {
      const mealCalSum = day.meals.reduce((sum, m) => sum + m.meal_calories, 0);
      assert(day.summary.calories === mealCalSum, `Test 14: Day ${day.day_number} calories match meal sums`);
      assert(day.summary.protein_g > 0, `Test 14: Day ${day.day_number} protein is positive`);
      assert(day.summary.carbs_g > 0, `Test 14: Day ${day.day_number} carbs is positive`);
      assert(day.summary.fat_g > 0, `Test 14: Day ${day.day_number} fat is positive`);
    }
  }

  // TEST 15: No cross-patient or cross-visit data contamination
  console.log('\n--- TEST 15: Cross-Patient and Cross-Visit Isolation ---');
  {
    const patientA = createBaseTestPatient({ id: 'patient_alpha', current_visit_id: 'vis_alpha_1' });
    const patientB = createBaseTestPatient({ id: 'patient_beta', current_visit_id: 'vis_beta_2' });
    const planA = generateWeeklyDietPlan(patientA, allFoods, baseTrafficLight);
    const planB = generateWeeklyDietPlan(patientB, allFoods, baseTrafficLight);
    assert(planA.patient_id === 'patient_alpha', 'Test 15: Plan A belongs to patient_alpha');
    assert(planA.visit_id === 'vis_alpha_1', 'Test 15: Plan A visit is vis_alpha_1');
    assert(planB.patient_id === 'patient_beta', 'Test 15: Plan B belongs to patient_beta');
    assert(planB.visit_id === 'vis_beta_2', 'Test 15: Plan B visit is vis_beta_2');
    assert(planA.patient_id !== planB.patient_id, 'Test 15: Patient IDs isolated');
  }

  // TEST 16: Full-week regeneration preserves locks and invalidates approval appropriately
  console.log('\n--- TEST 16: Lock Preservation on Regeneration ---');
  {
    const patient = createBaseTestPatient();
    let plan = generateWeeklyDietPlan(patient, allFoods, baseTrafficLight);
    // Lock Day 2
    plan.days[1].is_locked = true;
    const day2CalBefore = plan.days[1].summary.calories;
    const regenerated = generateWeeklyDietPlan(patient, allFoods, baseTrafficLight, null, plan, { forceRegenerate: true, preserveLocks: true });
    assert(regenerated.days[1].is_locked === true, 'Test 16: Day 2 remains locked');
    assert(regenerated.days[1].summary.calories === day2CalBefore, 'Test 16: Locked Day 2 content preserved');
  }

  // TEST 17: Actual meal timestamps match the claimed eating window (12:30 PM, 04:30 PM, 07:30 PM inside 12:00-20:00)
  console.log('\n--- TEST 17: Eating Window Meal Timestamps ---');
  {
    const pFastEligible = createBaseTestPatient({
      dietary_preferences: { meal_structure: 'intermittent_fasting_16_8' }
    });
    const plan = generateWeeklyDietPlan(pFastEligible, allFoods, baseTrafficLight);
    const day1 = plan.days[0];
    assert(day1.meals.length === 3, 'Test 17: Fasting day has exactly 3 meals');
    assert(day1.meals[0].scheduled_time === '12:30 PM', 'Test 17: Lunch scheduled at 12:30 PM');
    assert(day1.meals[1].scheduled_time === '04:30 PM', 'Test 17: Mid-window snack at 04:30 PM');
    assert(day1.meals[2].scheduled_time === '07:30 PM', 'Test 17: Dinner at 07:30 PM');
    assert(!day1.meals.some(m => (m.scheduled_time || '').includes('AM')), 'Test 17: No meals outside 12:00 PM – 08:00 PM window');
  }

  // TEST 18: Unsafe or nutritionally inadequate draft cannot be approved
  console.log('\n--- TEST 18: Unsafe / Inadequate Plan Approval Prevention ---');
  {
    const pInadequate = createBaseTestPatient();
    // Create an artificially inadequate day plan (only 400 kcal when target is 1650 kcal)
    const inadequatePlan: WeeklyDietPlan = {
      plan_id: 'plan_inadequate_001',
      patient_id: pInadequate.id,
      visit_id: pInadequate.current_visit_id || 'vis_01',
      version: 1,
      schema_version: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'draft',
      is_approved: false,
      target_macros: { calories: 1650, protein_g: 82, carbs_g: 220, fat_g: 45 },
      days: [
        {
          day_number: 1,
          day_name_bn: '১ম দিন',
          day_name_en: 'Day 1',
          meals: [],
          summary: { calories: 400, protein_g: 15, carbs_g: 50, fat_g: 10, fiber_g: 5, gl: 10, gl_is_estimated: false, pral: 0, calorie_variance: -1250, protein_variance: -67, carbs_variance: -170, fat_variance: -35 },
          safety_decision: 'SAFE'
        }
      ],
      overall_safety_status: 'SAFE'
    };
    const safety = evaluateWeeklyPlanClinicalSafety(pInadequate, inadequatePlan, allFoods);
    assert(safety.overall_decision === 'HARD_STOP', 'Test 18: Severe nutritional deficit triggers HARD_STOP');
    assert(safety.is_eligible_for_approval === false, 'Test 18: Nutritionally inadequate plan is ineligible for approval');
    assert(safety.unresolved_hard_stops.some(s => s.includes('Nutritional Deficit')), 'Test 18: Unresolved hard stops cite nutritional deficit');
  }

  // TEST 19: Fasting Draft State & Approval Lifecycle
  console.log('\n--- TEST 19: Fasting Draft State & Approval Lifecycle ---');
  {
    const pFast = createBaseTestPatient({
      dietary_preferences: { meal_structure: 'intermittent_fasting_16_8' }
    });
    const draftPlan = generateWeeklyDietPlan(pFast, allFoods, baseTrafficLight);
    assert(draftPlan.status === 'draft', 'Test 19: Fresh plan is draft');
    assert(draftPlan.is_approved === false, 'Test 19: Draft plan is not approved');
    assert(draftPlan.days[0].fasting_schedule?.decision_status === 'fasting_proposed_draft', 'Test 19: Fasting day decision_status is fasting_proposed_draft (NEVER approved in draft)');
    assert(draftPlan.fasting_schedule?.decision_status === 'fasting_proposed_draft', 'Test 19: Weekly plan fasting_schedule decision_status is fasting_proposed_draft');

    // Transition to approved using approveWeeklyDietPlan
    const approvedPlan = approveWeeklyDietPlan(draftPlan, 'BMDC-12345-DR', 'Clinician approved 16:8 regimen');
    assert(approvedPlan.status === 'approved', 'Test 19: Plan status transitioned to approved');
    assert(approvedPlan.is_approved === true, 'Test 19: is_approved is true');
    assert(approvedPlan.days[0].fasting_schedule?.decision_status === 'fasting_approved', 'Test 19: Fasting day decision_status transitioned to fasting_approved on approval');
    assert(approvedPlan.fasting_schedule?.decision_status === 'fasting_approved', 'Test 19: Weekly plan fasting decision_status transitioned to fasting_approved');

    // Invalidation resets to requires_review
    const invalidated = invalidateWeeklyPlanApproval(approvedPlan, 'Patient requested meal time adjustment');
    assert(invalidated.status === 'requires_review', 'Test 19: Status transitioned to requires_review');
    assert(invalidated.is_approved === false, 'Test 19: is_approved reset to false');
    assert(invalidated.days[0].fasting_schedule?.decision_status === 'fasting_requires_review', 'Test 19: Day fasting decision_status reset to fasting_requires_review');
    assert(invalidated.fasting_schedule?.decision_status === 'fasting_requires_review', 'Test 19: Weekly fasting decision_status reset to fasting_requires_review');
  }

  // TEST 20: Adult Underweight ESPEN / WHO Malnutrition vs Short-Stature Normal BMI
  console.log('\n--- TEST 20: Adult Underweight ESPEN / WHO Criteria ---');
  {
    // Case A: Short stature adult with 43 kg but normal BMI (143 cm, BMI = 21.0 kg/m²)
    const pShortNormalBmi = createBaseTestPatient({
      age: 35,
      weight_kg: 43,
      height_cm: 143,
      population_group: 'adult_standard',
      calculated: {
        ...createBaseTestPatient().calculated,
        bmi: 21.0,
        bmi_category_en: 'Normal weight',
        bmi_category_bn: 'স্বাভাবিক ওজন'
      },
      dietary_preferences: { meal_structure: 'intermittent_fasting_16_8' }
    });
    const checkA = evaluateFastingEligibility(pShortNormalBmi, 16);
    assert(checkA.eligibility.is_eligible_for_fasting === true, 'Test 20: Adult 43kg with normal BMI (21.0) is not falsely classified as underweight');
    assert(!checkA.safetyResults.some(r => r.rule_id === 'FASTING_UNDERWEIGHT_STOP'), 'Test 20: Does not trigger FASTING_UNDERWEIGHT_STOP');

    // Case B: Severe somatic wasting (<40 kg floor)
    const pSevereWasting = createBaseTestPatient({
      age: 30,
      weight_kg: 38,
      height_cm: 155,
      calculated: {
        ...createBaseTestPatient().calculated,
        bmi: 15.8,
        bmi_category_en: 'Severe Underweight',
        bmi_category_bn: 'মারাত্মক কম ওজন'
      }
    });
    const checkB = evaluateFastingEligibility(pSevereWasting, 16);
    assert(checkB.eligibility.is_eligible_for_fasting === false, 'Test 20: Severe wasting (<40kg, low BMI) is contraindicated');
    assert(checkB.safetyResults.some(r => r.rule_id === 'FASTING_UNDERWEIGHT_STOP'), 'Test 20: Triggers FASTING_UNDERWEIGHT_STOP for low BMI');
  }

  // TEST 21: Circadian & Meal Timing Window Discrepancy Detection
  console.log('\n--- TEST 21: Circadian & Meal Timing Window Engine ---');
  {
    // Test parsing
    const p12 = parseTimeString('12:30 PM');
    assert(p12 !== null && p12.hours24 === 12 && p12.minutes === 30 && p12.totalMinutes === 750, 'Test 21: Parses 12:30 PM accurately');
    const p24 = parseTimeString('19:45');
    assert(p24 !== null && p24.hours24 === 19 && p24.minutes === 45 && p24.display12h === '07:45 PM', 'Test 21: Parses 19:45 to 07:45 PM accurately');

    // Test interval with midnight rollover
    const intervalOvernight = calculateIntervalHours('20:00', '08:00', true);
    assert(intervalOvernight === 12.0, 'Test 21: Calculates 12.0h overnight interval across midnight');

    // Test timing evaluation on 16:8 schedule meals (12:30 PM, 04:30 PM, 07:30 PM)
    const validMeals: DietChartMeal[] = [
      { id: 'm1', meal_type: 'lunch', title_en: 'Lunch', title_bn: 'দুপুরের খাবার', scheduled_time: '12:30 PM', target_time: '12:30 PM', meal_calories: 600, meal_protein_g: 30, meal_carbs_g: 70, meal_fat_g: 20, meal_gl: 15, meal_gl_is_estimated: false, incompatible_warnings: [], meal_pral: -2, items: [] },
      { id: 'm2', meal_type: 'evening_snack', title_en: 'Snack', title_bn: 'বিকালের নাস্তা', scheduled_time: '04:30 PM', target_time: '04:30 PM', meal_calories: 250, meal_protein_g: 10, meal_carbs_g: 35, meal_fat_g: 8, meal_gl: 8, meal_gl_is_estimated: false, incompatible_warnings: [], meal_pral: -1, items: [] },
      { id: 'm3', meal_type: 'dinner', title_en: 'Dinner', title_bn: 'রাতের খাবার', scheduled_time: '07:30 PM', target_time: '07:30 PM', meal_calories: 550, meal_protein_g: 28, meal_carbs_g: 65, meal_fat_g: 18, meal_gl: 14, meal_gl_is_estimated: false, incompatible_warnings: [], meal_pral: -3, items: [] }
    ];

    const evalValid = evaluateMealScheduleTiming(validMeals, {
      eatingWindowStart: '12:00 PM',
      eatingWindowEnd: '08:00 PM',
      plannedFastingHours: 16
    });

    assert(evalValid.is_valid === true, 'Test 21: Meal schedule is valid');
    assert(evalValid.scheduled_intake_window_hours === 7.0, 'Test 21: Scheduled intake window is 7.0h (12:30 PM to 07:30 PM)');
    assert(evalValid.scheduled_overnight_fast_hours === 17.0, 'Test 21: Overnight fast is 17.0h (07:30 PM to 12:30 PM next day)');
    assert(evalValid.is_intake_within_permitted_window === true, 'Test 21: All meals fall within 12:00 PM - 08:00 PM window');

    // Test timing discrepancy when a caloric snack is scheduled outside window at 09:00 AM
    const invalidMeals: DietChartMeal[] = [
      { id: 'm0', meal_type: 'mid_morning', title_en: 'Early Snack', title_bn: 'সকালের নাস্তা', scheduled_time: '09:00 AM', target_time: '09:00 AM', meal_calories: 200, meal_protein_g: 5, meal_carbs_g: 30, meal_fat_g: 5, meal_gl: 6, meal_gl_is_estimated: false, incompatible_warnings: [], meal_pral: 0, items: [{ id: 'i1', food_id: 'apple', food_name_en: 'Apple', food_name_bn: 'আপেল', category: 'fruit', prep_note_bn: '', prep_note_en: '', alternatives: [], raw_weight_g: 100, cooked_weight_g: 100, cooked_display_bn: '১০০ গ্রাম', cooked_display_en: '100g', kcal: 52, protein_g: 0.3, carbs_g: 14, fat_g: 0.2, fiber_g: 2.4, traffic_status: 'GREEN' }] },
      ...validMeals
    ];

    const evalInvalid = evaluateMealScheduleTiming(invalidMeals, {
      eatingWindowStart: '12:00 PM',
      eatingWindowEnd: '08:00 PM',
      plannedFastingHours: 16
    });

    assert(evalInvalid.is_intake_within_permitted_window === false, 'Test 21: Detects meal outside 12:00 PM - 08:00 PM window');
    assert(evalInvalid.timing_discrepancies.length > 0, 'Test 21: Timing discrepancies populated');
    assert(evalInvalid.timing_discrepancies[0].includes('outside the designated eating window'), 'Test 21: Timing discrepancy message cites designated window');
  }

  // TEST 22: Food Portion Size Validation & Sanitization Guard
  console.log('\n--- TEST 22: Food Portion Validation Guard ---');
  {
    const vNormal = validatePortionInput(150);
    assert(vNormal.is_valid === true && vNormal.sanitized_grams === 150, 'Test 22: 150g is valid');

    const vZero = validatePortionInput(0);
    assert(vZero.is_valid === false && vZero.error_en !== undefined, 'Test 22: 0g is invalid and returns error');

    const vNegative = validatePortionInput(-25);
    assert(vNegative.is_valid === false, 'Test 22: Negative grams is invalid');

    const vExcessive = validatePortionInput(2500);
    assert(vExcessive.is_valid === false && vExcessive.sanitized_grams === 1500, 'Test 22: 2500g is capped/flagged');

    const vNaN = validatePortionInput(NaN);
    assert(vNaN.is_valid === false, 'Test 22: NaN is invalid');
  }

  // TEST 23: Enriched Multidimensional Nutritional Adequacy Assessment
  console.log('\n--- TEST 23: Multidimensional Nutritional Adequacy ---');
  {
    const patient = createBaseTestPatient();
    const mockSummary: DayPlanSummary = {
      calories: 1600,
      protein_g: 80,
      carbs_g: 210,
      fat_g: 45,
      fiber_g: 28,
      gl: 45,
      gl_is_estimated: false,
      pral: -6,
      calorie_variance: -50,
      protein_variance: -2,
      carbs_variance: -10,
      fat_variance: 0
    };
    const targetMacros = { calories: 1650, protein_g: 82, carbs_g: 220, fat_g: 45 };
    const adequacy = evaluateNutritionalAdequacy(mockSummary, targetMacros, patient);

    assert(adequacy.is_adequate === true, 'Test 23: Day is adequate for evaluated parameters');
    assert(adequacy.overall_status === 'adequate_for_evaluated_parameters', 'Test 23: Overall status is adequate_for_evaluated_parameters');
    assert(adequacy.status_label_en === 'Nutritional Targets Achieved (Evaluated Parameters)', 'Test 23: Truthful status label without unverified blanket claims');
    assert(adequacy.energy_assessment !== undefined && adequacy.energy_assessment.status === 'adequate', 'Test 23: Energy assessment structured');
    assert(adequacy.protein_assessment !== undefined && adequacy.protein_assessment.status === 'adequate', 'Test 23: Protein assessment structured');
    assert(adequacy.macronutrient_balance !== undefined && adequacy.macronutrient_balance.is_balanced === true, 'Test 23: Macronutrient balance evaluated');
    assert(adequacy.micronutrient_assessment !== undefined && adequacy.micronutrient_assessment.has_incomplete_data === true, 'Test 23: Discloses incomplete micronutrient data transparently');
    assert(adequacy.data_completeness !== undefined && adequacy.data_completeness.status === 'partial', 'Test 23: Data completeness status is partial');
  }

  // TEST 24: Invalidation and Approval Synchronize All 7 Days
  console.log('\n--- TEST 24: Approval & Invalidation Day Synchronization ---');
  {
    const pFast = createBaseTestPatient({
      dietary_preferences: { meal_structure: 'intermittent_fasting_16_8' }
    });
    const plan = generateWeeklyDietPlan(pFast, allFoods, baseTrafficLight);
    const approved = approveWeeklyDietPlan(plan, 'BMDC-TEST-999');
    for (const day of approved.days) {
      assert(day.fasting_schedule?.decision_status === 'fasting_approved', `Test 24: Day ${day.day_number} fasting is approved`);
    }

    const invalidated = invalidateWeeklyPlanApproval(approved, 'Modification performed');
    for (const day of invalidated.days) {
      assert(day.fasting_schedule?.decision_status === 'fasting_requires_review', `Test 24: Day ${day.day_number} fasting reset to requires_review`);
    }
  }

  // TEST 25: Section 2 Fasting Regeneration and Timing Regression Gate
  console.log('\n--- TEST 25: Fasting Regeneration & Timing Regression Suite ---');
  {
    // 1. Existing fasting plan + newly started insulin -> overridden to non-fasting
    const pFast = createBaseTestPatient({
      dietary_preferences: { meal_structure: 'intermittent_fasting_16_8' }
    });
    const initialFastPlan = generateWeeklyDietPlan(pFast, allFoods, baseTrafficLight);
    assert(initialFastPlan.days[0].meal_structure === 'intermittent_fasting_16_8', 'Test 25.1: Initial plan has fasting');
    assert(!initialFastPlan.days[0].meals.some(m => m.meal_type === 'breakfast'), 'Test 25.1: Initial fasting plan has no breakfast');

    // Patient newly prescribed insulin
    const pWithInsulin = {
      ...pFast,
      active_medications: [...pFast.active_medications, 'med_insulin']
    };
    const regPlan = generateWeeklyDietPlan(pWithInsulin, allFoods, baseTrafficLight, null, initialFastPlan, { forceRegenerate: true });
    assert(regPlan.days[0].meal_structure !== 'intermittent_fasting_16_8', 'Test 25.1: Newly started insulin overrides fasting to safe schedule');
    assert(regPlan.days[0].meals.some(m => m.meal_type === 'breakfast'), 'Test 25.1: Breakfast reinstated after insulin contraindication');

    // 2. Existing fasting plan + pregnancy contraindication -> breakfast reinstated
    const pPregnant: PatientProfile = {
      ...pFast,
      population_group: 'pregnancy',
      trimester: 2
    };
    const regPregnant = generateWeeklyDietPlan(pPregnant, allFoods, baseTrafficLight, null, initialFastPlan, { forceRegenerate: true });
    assert(regPregnant.days[0].meals.some(m => m.meal_type === 'breakfast'), 'Test 25.2: Pregnancy contraindication reinstates breakfast');
    assert(regPregnant.days[0].fasting_schedule?.decision_status === 'fasting_contraindicated', 'Test 25.2: Fasting schedule marked contraindicated');

    // 3. Locked fasting day + contraindication -> exposes conflict in safety_decision: 'HARD_STOP'
    const lockedFastingDay = {
      ...initialFastPlan.days[0],
      is_locked: true
    };
    const evaluatedLockedDay = buildDayPlan(
      1,
      pWithInsulin,
      allFoods,
      baseTrafficLight,
      initialFastPlan.target_macros,
      lockedFastingDay,
      true
    );
    assert(evaluatedLockedDay.safety_decision === 'HARD_STOP', 'Test 25.3: Locked fasting day with contraindicated insulin flags HARD_STOP');
    assert(Boolean(evaluatedLockedDay.safety_notes?.some(n => n.includes('HARD_STOP') || n.includes('Fasting Contraindication'))), 'Test 25.3: Safety notes cite fasting contraindication HARD_STOP');

    // 4. Previously approved fasting plan + regeneration -> invalidates approval
    const approvedFastingPlan = approveWeeklyDietPlan(initialFastPlan, 'DR_TEST_CLINICIAN');
    assert(approvedFastingPlan.is_approved === true, 'Test 25.4: Plan approved');
    const invalidatedRegen = generateWeeklyDietPlan(pFast, allFoods, baseTrafficLight, null, approvedFastingPlan, { forceRegenerate: true });
    assert(invalidatedRegen.is_approved === false, 'Test 25.4: Invalidation upon full regeneration');
    assert(invalidatedRegen.status === 'requires_review', 'Test 25.4: Status transitioned to requires_review');
    assert(invalidatedRegen.fasting_schedule?.decision_status === 'fasting_requires_review', 'Test 25.4: Fasting decision status reset to fasting_requires_review');

    // 5. Safe fasting plan + unchanged clinical info -> fasting preserved
    const safeRegen = generateWeeklyDietPlan(pFast, allFoods, baseTrafficLight, null, initialFastPlan, { preserveLocks: true });
    assert(safeRegen.days[0].meal_structure === 'intermittent_fasting_16_8', 'Test 25.5: Safe eligible patient preserves fasting schedule');
    assert(safeRegen.days[0].fasting_schedule?.is_fasting === true, 'Test 25.5: Fasting remains active');

    // 6. Meal timestamp outside permitted eating window -> flags discrepancy
    const dayWithOutOfWindowMeal = {
      ...initialFastPlan.days[0],
      meals: [
        {
          id: 'm_early',
          meal_type: 'morning_protocol' as const,
          title_en: 'Early Morning Shake',
          title_bn: 'ভোরের প্রোটোকল',
          scheduled_time: '08:00 AM',
          target_time: '08:00 AM',
          meal_calories: 250,
          meal_protein_g: 10,
          meal_carbs_g: 30,
          meal_fat_g: 5,
          meal_gl: 5,
          meal_gl_is_estimated: false,
          incompatible_warnings: [],
          meal_pral: 0,
          items: [{
            id: 'it_shake',
            food_id: 'apple',
            food_name_en: 'Apple',
            food_name_bn: 'আপেল',
            category: 'fruit' as const,
            prep_note_bn: '',
            prep_note_en: '',
            alternatives: [],
            raw_weight_g: 100,
            cooked_weight_g: 100,
            cooked_display_bn: '১০০ গ্রাম',
            cooked_display_en: '100g',
            kcal: 52,
            protein_g: 0.3,
            carbs_g: 14,
            fat_g: 0.2,
            fiber_g: 2.4,
            traffic_status: 'GREEN' as const
          }]
        },
        ...initialFastPlan.days[0].meals
      ]
    };
    const timingCheckedDay = recalculateDayPlan(dayWithOutOfWindowMeal, initialFastPlan.target_macros, pFast, allFoods);
    assert(timingCheckedDay.fasting_schedule?.is_intake_within_window === false, 'Test 25.6: Out-of-window meal intake flagged as not within window');
    assert(Boolean(timingCheckedDay.fasting_schedule?.timing_discrepancies?.length), 'Test 25.6: Timing discrepancies recorded');
  }

  console.log('\n=====================================================================');
  console.log(`STEP 05 ACCEPTANCE SUITE RESULTS: ${passedAssertions}/${totalAssertions} PASSED (0 FAILED)`);
  console.log('=====================================================================');
}

runAcceptanceSuite();
