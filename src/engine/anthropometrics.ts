import { 
  ActivityLevel, 
  CalculatedAnthropometrics, 
  ClinicalConditionId 
} from '../types';

export const ACTIVITY_FACTORS: Record<ActivityLevel, { factor: number; label_en: string; label_bn: string }> = {
  sedentary: { factor: 1.2, label_en: "Sedentary (Desk job, minimal exercise)", label_bn: "অলস জীবনযাপন (বসে কাজ, কোনো ব্যায়াম নেই)" },
  lightly_active: { factor: 1.375, label_en: "Lightly Active (1-3 days/week light exercise)", label_bn: "হালকা সক্রিয় (সপ্তাহে ১-৩ দিন হালকা ব্যায়াম/হাঁটা)" },
  moderately_active: { factor: 1.55, label_en: "Moderately Active (3-5 days/week brisk exercise)", label_bn: "পরিমিত সক্রিয় (সপ্তাহে ৩-৫ দিন দ্রুত হাঁটা/ব্যায়াম)" },
  very_active: { factor: 1.725, label_en: "Very Active (6-7 days/week hard exercise/physical labor)", label_bn: "অত্যন্ত সক্রিয় (প্রতিদিন ভারী ব্যায়াম বা কায়িক শ্রম)" }
};

/**
 * Deterministic Anthropometric Calculator
 * - Mifflin-St Jeor Equation for BMR
 * - Hamwi / Devine Equation for Ideal Body Weight (IBW)
 * - Adjusted Body Weight for BMI >= 25 (prevents overfeeding protein)
 * - Asian BMI Classifications (WHO Asian Cut-offs)
 * - Waist-to-Height Ratio (WHtR) for visceral adiposity and cardiometabolic risk
 * - BMR-Safe Calorie Floor (Strict clinical constraint: intake must never drop below BMR)
 */
export function calculateAnthropometrics(
  age: number,
  gender: 'male' | 'female',
  height_cm: number,
  weight_kg: number,
  waist_cm: number,
  activity_level: ActivityLevel = 'sedentary',
  conditions: ClinicalConditionId[] = []
): CalculatedAnthropometrics {
  const height_m = height_cm / 100;
  const height_in = height_cm / 2.54;

  // 1. BMI Calculation
  const bmi = Math.round((weight_kg / (height_m * height_m)) * 10) / 10;
  let bmi_category_en = "Normal Weight";
  let bmi_category_bn = "স্বাভাবিক ওজন";

  // Asian WHO cut-offs
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

  // 2. Ideal Body Weight (Devine formula)
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
  ibw_kg = Math.round(ibw_kg * 10) / 10;

  // 3. Adjusted Body Weight (Used for protein & calories in overweight/obesity)
  // Adjusted BW = IBW + 0.4 * (Actual - IBW)
  let adjusted_bw_kg = weight_kg;
  let protein_ratio_used = "Actual Weight (1.2 g/kg)";
  if (bmi >= 25 && weight_kg > ibw_kg) {
    adjusted_bw_kg = Math.round((ibw_kg + 0.4 * (weight_kg - ibw_kg)) * 10) / 10;
    protein_ratio_used = "Adjusted Body Weight (1.3 g/kg of Adj BW to protect lean mass)";
  } else if (bmi < 18.5) {
    protein_ratio_used = "Actual Weight (1.4 g/kg for muscle building)";
  }

  // 4. Waist-to-Height Ratio (WHtR)
  const whtr = Math.round((waist_cm / height_cm) * 100) / 100;
  let whtr_risk_en = "Low Cardiometabolic Risk (<0.50)";
  let whtr_risk_bn = "কম কার্ডিওমেটাবলিক ঝুঁকি (<০.৫০)";
  if (whtr >= 0.60) {
    whtr_risk_en = "Very High Visceral Fat & Health Risk (≥0.60)";
    whtr_risk_bn = "মারাত্মক ভিসেরাল ফ্যাট ও মেটাবলিক ঝুঁকি (≥০.৬০)";
  } else if (whtr >= 0.50) {
    whtr_risk_en = "Increased Central Adiposity Risk (0.50 - 0.59)";
    whtr_risk_bn = "উচ্চ পেটের চর্বি ও ইনসুলিন রেজিস্ট্যান্স ঝুঁকি (০.৫০ - ০.৫৯)";
  }

  // 5. Mifflin-St Jeor BMR
  // Men: BMR = 10 * weight (kg) + 6.25 * height (cm) - 5 * age + 5
  // Women: BMR = 10 * weight (kg) + 6.25 * height (cm) - 5 * age - 161
  let bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age);
  bmr += gender === 'male' ? 5 : -161;
  bmr = Math.round(bmr);

  // 6. Total Daily Energy Expenditure (TDEE)
  const actFactor = ACTIVITY_FACTORS[activity_level]?.factor || 1.2;
  const tdee = Math.round(bmr * actFactor);

  // 7. BMR-Safe Calorie Floor Calculation
  // CRITICAL CLINICAL SAFETY: Never prescribe below BMR. Calorie deficit must be safe (15-20% deficit, but max floor = BMR).
  const bmr_safe_calorie_floor = bmr;
  
  let target_calories = tdee;
  if (bmi >= 23) {
    // Moderate fat loss deficit of 400 kcal, but clamped at BMR
    target_calories = Math.max(bmr_safe_calorie_floor, tdee - 450);
  } else if (bmi < 18.5) {
    // Underweight: surplus of 300 kcal
    target_calories = tdee + 350;
  } else {
    // Maintenance
    target_calories = tdee;
  }
  // Round to nearest 25 kcal
  target_calories = Math.round(target_calories / 25) * 25;

  // 8. Macronutrient Targets
  // Base protein: 1.2 - 1.5 g/kg of Adjusted BW (or IBW if severely obese)
  let protein_multiplier = 1.2;
  if (conditions.includes('t2d_ir') || conditions.includes('pcos') || conditions.includes('fatty_liver')) {
    protein_multiplier = 1.35; // higher protein for satiety and insulin stabilization
  }
  if (conditions.includes('hypertension_ckd')) {
    protein_multiplier = 0.9; // cautious protein for renal support
    protein_ratio_used = "Renal-Cautious (0.9 g/kg of IBW)";
  }

  const referenceWeightForProtein = bmi >= 25 ? adjusted_bw_kg : weight_kg;
  const target_protein_g = Math.round(referenceWeightForProtein * protein_multiplier);
  const protein_kcal = target_protein_g * 4;

  // Remaining calories divided between Carbs & Fats
  let carb_pct = 0.40;
  let fat_pct = 0.35;

  if (conditions.includes('t2d_ir') || conditions.includes('pcos') || conditions.includes('fatty_liver')) {
    carb_pct = 0.30;
    fat_pct = 0.40; // healthy fats (mustard oil, ghee, nuts, seeds)
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
    protein_ratio_used
  };
}

