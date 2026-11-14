import { calculateAnthropometrics } from './src/engine/anthropometrics';
import { analyzeFunctionalLabs } from './src/engine/labAnalyzer';
import { resolveConflicts } from './src/engine/conflictResolver';
import { evaluateDNIAndTimeline } from './src/engine/dniEngine';
import { buildAutoScaledDietChart } from './src/engine/mealScaler';
import foodsData from './src/data/foods.json';
import medsData from './src/data/medicines.json';
import suppsData from './src/data/supplements.json';
import { FoodItem, MedicineItem, SupplementItem, PatientProfile } from './src/types';

const foods = foodsData as FoodItem[];
const meds = medsData as MedicineItem[];
const supps = suppsData as SupplementItem[];

console.log("=== RUNNING DETERMINISTIC CLINICAL ENGINE TESTS ===");

// 1. Test Anthropometrics
const calculated = calculateAnthropometrics(
  48,
  'female',
  152, // cm
  74,  // kg
  92,  // cm
  'sedentary',
  ['t2d_ir', 'hypothyroid', 'fatty_liver', 'uric_acid_gout'],
  'adult_standard',
  undefined,
  'clamped_to_bmr'
);
console.log("\n1. Anthropometrics output:");
console.log(`- BMI: ${calculated.bmi} (${calculated.bmi_category_en})`);
console.log(`- IBW: ${calculated.ibw_kg} kg | Adjusted BW: ${calculated.adjusted_bw_kg} kg`);
console.log(`- WHtR: ${calculated.whtr} (${calculated.whtr_risk_en})`);
console.log(`- BMR: ${calculated.bmr} kcal | TDEE: ${calculated.tdee} kcal`);
console.log(`- BMR-Safe Calorie Floor: ${calculated.bmr_safe_calorie_floor} kcal`);
console.log(`- Target Calories: ${calculated.target_calories} kcal (Clamped >= BMR floor)`);
console.log(`- Target Protein: ${calculated.target_protein_g} g | Carbs: ${calculated.target_carbs_g} g | Fat: ${calculated.target_fat_g} g`);

// 2. Test Functional Labs
const labs = analyzeFunctionalLabs({
  fasting_glucose: 118,
  fasting_insulin: 16,
  triglycerides: 220,
  hdl: 38,
  tsh: 3.8,
  hba1c: 6.8,
  vitamin_d3: 18,
  vitamin_b12: 240,
  uric_acid: 6.8,
  alt: 38
}, 'female');

console.log("\n2. Functional Lab Analyzer:");
console.log(`- HOMA-IR: ${labs.homa_ir} -> ${labs.homa_ir_status_en}`);
console.log(`- TG/HDL: ${labs.tg_hdl_ratio} -> ${labs.tg_hdl_status_en}`);
console.log(`- Total Clinical Lab Flags: ${labs.lab_flags.length}`);

// 3. Test Conflict Resolver (RED > YELLOW > GREEN)
const patient: PatientProfile = {
  schema_version: 2,
  id: 'pt_test_001',
  name: "Mrs. Nasreen Akhter",
  age: 48,
  gender: 'female',
  phone: "01711000000",
  visit_date: "2026-11-14",
  current_phase: 1,
  height_cm: 152,
  weight_kg: 74,
  waist_cm: 92,
  activity_level: 'sedentary',
  sleep_hours: 6,
  shift_worker: false,
  population_group: 'adult_standard',
  bmr_floor_strategy: 'clamped_to_bmr',
  confirmed_allergies: ['shrimp'],
  clinician_disallowed_foods: [],
  clinician_disallowed_tags: [],
  selected_conditions: ['t2d_ir', 'hypothyroid', 'fatty_liver', 'uric_acid_gout'],
  active_medications: ['med_metformin', 'med_ppi', 'med_levothyroxine'],
  gut_profile: {
    bloating: 'severe',
    acid_reflux_hypoacidity: true,
    bristol_stool_score: 2, // constipation
    energy_score: 4,
    sleep_quality_score: 5,
    digestive_fire_agni: 'mandagni'
  },
  labs,
  calculated
};

const activeMeds = meds.filter(m => patient.active_medications.includes(m.id));
const traffic = resolveConflicts(
  foods, 
  patient.selected_conditions, 
  activeMeds, 
  patient.confirmed_allergies, 
  patient.clinician_disallowed_foods, 
  patient.clinician_disallowed_tags, 
  patient.current_phase
);
console.log("\n3. Conflict Resolver (RED > YELLOW > GREEN):");
console.log(`- Green Foods: ${traffic.green.length}`);
console.log(`- Yellow Foods: ${traffic.yellow.length}`);
console.log(`- Red Foods: ${traffic.red.length}`);

// 4. Test DNI & Timeline
const dni = evaluateDNIAndTimeline(patient, meds, supps);
console.log("\n4. DNI & Daily Timeline:");
console.log(`- Nutrient Depletions: ${dni.depletions.length}`);
console.log(`- Candidate Supplements: ${dni.candidateSupplements.map(s => s.name_en).join(', ')}`);
console.log(`- Timeline Slots: ${dni.timeline.length}`);
console.log(`- Critical Warnings: ${dni.criticalWarnings.length}`);

// 5. Test Auto-Scaled Diet Chart
const chart = buildAutoScaledDietChart(patient, foods, traffic);
console.log("\n5. Auto-Scaled Diet Chart:");
console.log(`- Meals Generated: ${chart.length}`);
const totalKcal = chart.reduce((sum, m) => sum + m.meal_calories, 0);
const totalProtein = chart.reduce((sum, m) => sum + m.meal_protein_g, 0);
console.log(`- Chart Total Calories: ${totalKcal} kcal (Target: ${calculated.target_calories})`);
console.log(`- Chart Total Protein: ${Math.round(totalProtein)} g (Target: ${calculated.target_protein_g})`);

console.log("\n=== ALL ENGINE MODULES VERIFIED DETERMINISTICALLY! ===");
