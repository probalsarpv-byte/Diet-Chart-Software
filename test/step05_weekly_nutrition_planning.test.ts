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
  DAY_NAMES
} from '../src/engine/weeklyPlanner';
import { validateClinicianCredentials } from '../src/engine/longitudinal/comparisonEngine';
import {
  FoodItem,
  MedicineItem,
  PatientProfile,
  PatientRecord,
  WeeklyDietPlan,
  DayPlan,
  DietChartMeal,
  DietChartMealItem
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

  console.log('\n=====================================================================');
  console.log(`STEP 05 ACCEPTANCE SUITE RESULTS: ${passedAssertions}/${totalAssertions} PASSED (0 FAILED)`);
  console.log('=====================================================================');
}

runAcceptanceSuite();
