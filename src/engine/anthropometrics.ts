import { 
  ActivityLevel, 
  CalculatedAnthropometrics, 
  ClinicalConditionId,
  PopulationGroup,
  BmrFloorStrategy
} from '../types';

export const ACTIVITY_FACTORS: Record<ActivityLevel, { factor: number; label_en: string; label_bn: string }> = {
  sedentary: { factor: 1.2, label_en: "Sedentary (Desk job, minimal exercise)", label_bn: "অলস জীবনযাপন (বসে কাজ, কোনো ব্যায়াম নেই)" },
  lightly_active: { factor: 1.375, label_en: "Lightly Active (1-3 days/week light exercise)", label_bn: "হালকা সক্রিয় (সপ্তাহে ১-৩ দিন হালকা ব্যায়াম/হাঁটা)" },
  moderately_active: { factor: 1.55, label_en: "Moderately Active (3-5 days/week brisk exercise)", label_bn: "পরিমিত সক্রিয় (সপ্তাহে ৩-৫ দিন দ্রুত হাঁটা/ব্যায়াম)" },
  very_active: { factor: 1.725, label_en: "Very Active (6-7 days/week hard exercise/physical labor)", label_bn: "অত্যন্ত সক্রিয় (প্রতিদিন ভারী ব্যায়াম বা কায়িক শ্রম)" }
};

/**
 * Deterministic Anthropometric & Metabolic Energy Calculator
 * 
 * Clinical Features:
 * - Mifflin-St Jeor Equation for estimated Basal Metabolic Rate (BMR)
 * - Devine Equation for Ideal Body Weight (IBW)
 * - Adjusted Body Weight for BMI >= 25 to prevent protein overfeeding
 * - WHO Asian BMI Classifications (23.0 overweight, 27.5 obese)
 * - Waist-to-Height Ratio (WHtR) for visceral adiposity assessment
 * - Population Safety Gates (Pediatrics, Pregnancy, Lactation alerts)
 * - Configurable BMR Calorie Floor Strategy (clamped, clinician custom, or clinical guidance)
 * - Explicit estimation provenance labeling
 */
export function calculateAnthropometrics(
  age: number,
  gender: 'male' | 'female',
  height_cm: number,
  weight_kg: number,
  waist_cm: number,
  activity_level: ActivityLevel = 'sedentary',
  conditions: ClinicalConditionId[] = [],
  population_group: PopulationGroup = 'adult_standard',
  trimester?: 1 | 2 | 3,
  bmr_floor_strategy: BmrFloorStrategy = 'clamped_to_bmr',
  custom_calorie_floor?: number
): CalculatedAnthropometrics {
  const height_m = Math.max(0.5, height_cm / 100);
  const height_in = height_cm / 2.54;

  // 1. Population Suitability Gate
  let population_warning: string | undefined;
  if (age < 18 || population_group === 'pediatric') {
    population_warning = "সতর্কতা: ১৮ বছরের কম বয়সীদের ক্ষেত্রে প্রাপ্তবয়স্কদের Mifflin-St Jeor ও BMI কাট-অফ প্রযোজ্য নয়; পেডিয়াট্রিক গ্রোথ চার্ট (WHO Z-Score) অনুসরণ আবশ্যক। / Warning: Adult Mifflin-St Jeor & BMI thresholds are not validated for pediatric populations (<18y); utilize WHO growth percentiles.";
  } else if (population_group === 'pregnancy') {
    population_warning = `সতর্কতা: গর্ভকালীন পুষ্টিতে ওজন কমানোর উদ্দেশ্যে ক্যালোরি ঘাটতি সম্পূর্ণ নিষিদ্ধ। গর্ভকালীন ট্রাইমেস্টার (${trimester ? `ট্রাইমেস্টার ${trimester}` : 'অনুল্লিখিত'}) অনুযায়ী অতিরিক্ত শক্তির চাহিদা যোগ করা প্রয়োজন। / Warning: Hypocaloric weight-loss diets are contraindicated in pregnancy. Additional gestational energy accretion is required.`;
  } else if (population_group === 'lactation') {
    population_warning = "স্তন্যদানকারী মায়ের জন্য দৈনিক অতিরিক্ত ৪০০-৫০০ কিলোক্যালোরি ও পর্যাপ্ত তরল নিশ্চিত করুন। / Lactation requires an additional ~400-500 kcal/day for milk synthesis.";
  }

  // Safe handling for incomplete/unmeasured anthropometrics during registration
  if (!weight_kg || !height_cm || weight_kg <= 0 || height_cm <= 0) {
    return {
      bmi: 0,
      bmi_category_en: "Unmeasured / Assessment Pending",
      bmi_category_bn: "পরিমাপ করা হয়নি / মূল্যায়ন বাকি",
      ibw_kg: 0,
      adjusted_bw_kg: 0,
      whtr: 0,
      whtr_risk_en: "Unmeasured",
      whtr_risk_bn: "পরিমাপ করা হয়নি",
      bmr: 0,
      tdee: 0,
      bmr_safe_calorie_floor: 0,
      target_calories: 0,
      target_protein_g: 0,
      target_carbs_g: 0,
      target_fat_g: 0,
      protein_ratio_used: "Unmeasured",
      population_group,
      population_warning,
      bmr_floor_strategy,
      is_estimated: true,
      energy_calculation_method: "Unmeasured",
      is_unmeasured: true,
    };
  }

  // 2. BMI Calculation (Asian WHO cut-offs)
  const bmi = Math.round((weight_kg / (height_m * height_m)) * 10) / 10;
  let bmi_category_en = "Normal Weight";
  let bmi_category_bn = "স্বাভাবিক ওজন";

  if (bmi < 18.5) {
    bmi_category_en = "Underweight (<18.5)";
    bmi_category_bn = "স্বল্প ওজন (<১৮.৫)";
  } else if (bmi <= 22.9) {
    bmi_category_en = "Normal Healthy (18.5 - 22.9)";
    bmi_category_bn = "স্বাভাবিক ও স্বাস্থ্যকর (১৮.৫ - ২২.৯)";
  } else if (bmi <= 27.4) {
    bmi_category_en = "Overweight (23.0 - 27.4)";
    bmi_category_bn = "অতিরিক্ত ওজন (২৩.০ - ২৭.৪)";
  } else {
    bmi_category_en = "Obese (≥27.5)";
    bmi_category_bn = "স্থূলতা / ওবেসিটি (≥২৭.৫)";
  }

  // 3. Ideal Body Weight (Devine formula)
  let ibw_kg = 50;
  if (height_in > 60) {
    const inches_over_5ft = height_in - 60;
    if (gender === 'male') {
      ibw_kg = 50 + (2.3 * inches_over_5ft);
    } else {
      ibw_kg = 45.5 + (2.3 * inches_over_5ft);
    }
  } else {
    // Under 5 feet
    ibw_kg = gender === 'male' ? 50 - (2.3 * (60 - height_in)) : 45.5 - (2.3 * (60 - height_in));
  }
  ibw_kg = Math.round(Math.max(30, ibw_kg) * 10) / 10;

  // 4. Adjusted Body Weight (Protects lean mass during protein calculation in overweight/obesity)
  let adjusted_bw_kg = weight_kg;
  let protein_ratio_used = "Actual Weight (1.2 g/kg)";
  if (bmi >= 25 && weight_kg > ibw_kg) {
    adjusted_bw_kg = Math.round((ibw_kg + 0.4 * (weight_kg - ibw_kg)) * 10) / 10;
    protein_ratio_used = "Adjusted Body Weight (1.3 g/kg of Adj BW to protect lean mass)";
  } else if (bmi < 18.5) {
    protein_ratio_used = "Actual Weight (1.4 g/kg for muscle building)";
  }

  // 5. Waist-to-Height Ratio (WHtR)
  const whtr = Math.round((waist_cm / Math.max(50, height_cm)) * 100) / 100;
  let whtr_risk_en = "Low Cardiometabolic Risk (<0.50)";
  let whtr_risk_bn = "কম কার্ডিওমেটাবলিক ঝুঁকি (<০.৫০)";
  if (whtr >= 0.60) {
    whtr_risk_en = "Very High Visceral Fat & Health Risk (≥0.60)";
    whtr_risk_bn = "মারাত্মক ভিসেরাল ফ্যাট ও মেটাবলিক ঝুঁকি (≥০.৬০)";
  } else if (whtr >= 0.50) {
    whtr_risk_en = "Increased Central Adiposity Risk (0.50 - 0.59)";
    whtr_risk_bn = "উচ্চ পেটের চর্বি ও ইনসুলিন রেজিস্ট্যান্স ঝুঁকি (০.৫০ - ০.৫৯)";
  }

  // 6. Mifflin-St Jeor Estimated BMR
  let bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age);
  bmr += gender === 'male' ? 5 : -161;
  bmr = Math.round(Math.max(800, bmr));

  // 7. Estimated TDEE
  const actFactor = ACTIVITY_FACTORS[activity_level]?.factor || 1.2;
  let tdee = Math.round(bmr * actFactor);

  // Pregnancy / Lactation Energy Additions
  if (population_group === 'pregnancy') {
    if (trimester === 2) tdee += 340;
    else if (trimester === 3) tdee += 452;
  } else if (population_group === 'lactation') {
    tdee += 450;
  }

  // 8. Calorie Floor Determination
  let effective_floor = bmr;
  if (bmr_floor_strategy === 'clinician_custom' && custom_calorie_floor && custom_calorie_floor > 600) {
    effective_floor = custom_calorie_floor;
  } else if (bmr_floor_strategy === 'unrestricted_clinical_guidance') {
    effective_floor = 1000; // minimum emergency safety baseline
  }
  const bmr_safe_calorie_floor = effective_floor;

  // 9. Target Calorie Computation
  let target_calories = tdee;
  if (population_group === 'pregnancy' || population_group === 'pediatric') {
    // No deficit
    target_calories = tdee;
  } else if (bmi >= 23) {
    // Moderate deficit of ~450 kcal for weight management, respecting floor strategy
    if (bmr_floor_strategy === 'clamped_to_bmr') {
      target_calories = Math.max(bmr_safe_calorie_floor, tdee - 450);
    } else if (bmr_floor_strategy === 'clinician_custom') {
      target_calories = Math.max(bmr_safe_calorie_floor, tdee - 450);
    } else {
      target_calories = Math.max(1000, tdee - 450);
    }
  } else if (bmi < 18.5) {
    target_calories = tdee + 350;
  } else {
    target_calories = tdee;
  }
  target_calories = Math.round(target_calories / 25) * 25;
  if (bmr_floor_strategy === 'clamped_to_bmr' || bmr_floor_strategy === 'clinician_custom') {
    target_calories = Math.max(bmr_safe_calorie_floor, target_calories);
  }

  // 10. Macronutrient Targets
  let protein_multiplier = 1.2;
  if (conditions.includes('t2d_ir') || conditions.includes('pcos') || conditions.includes('fatty_liver')) {
    protein_multiplier = 1.35;
  }
  if (conditions.includes('hypertension_ckd')) {
    protein_multiplier = 0.9;
    protein_ratio_used = "Renal-Cautious (0.9 g/kg of IBW)";
  }

  const referenceWeightForProtein = bmi >= 25 ? adjusted_bw_kg : weight_kg;
  const target_protein_g = Math.round(referenceWeightForProtein * protein_multiplier);
  const protein_kcal = target_protein_g * 4;

  let carb_pct = 0.40;
  let fat_pct = 0.35;

  if (conditions.includes('t2d_ir') || conditions.includes('pcos') || conditions.includes('fatty_liver')) {
    carb_pct = 0.30;
    fat_pct = 0.40;
  }
  if (conditions.includes('gut_dysbiosis')) {
    carb_pct = 0.35;
    fat_pct = 0.35;
  }

  const remaining_kcal = Math.max(0, target_calories - protein_kcal);
  const target_carbs_g = Math.round((remaining_kcal * (carb_pct / (carb_pct + fat_pct))) / 4);
  const target_fat_g = Math.round((remaining_kcal * (fat_pct / (carb_pct + fat_pct))) / 9);

  return {
    bmi,
    bmi_category_en,
    bmi_category_bn,
    ibw_kg,
    adjusted_bw_kg,
    whtr,
    whtr_risk_en,
    whtr_risk_bn,
    bmr,
    tdee,
    bmr_safe_calorie_floor,
    target_calories,
    target_protein_g,
    target_carbs_g,
    target_fat_g,
    protein_ratio_used,
    population_group,
    population_warning,
    bmr_floor_strategy,
    is_estimated: true,
    energy_calculation_method: "Mifflin-St Jeor (Estimated REE/BMR) + Activity Factor"
  };
}
