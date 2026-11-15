/**
 * SHUDDHO FUNCTIONAL NUTRITION SOFTWARE
 * Fluid, Electrolyte & Sodium Accounting Engine (Phase P0 Foundation)
 * 
 * Enforces non-duplicate fluid accounting (in mL),
 * distinguishes grams of salt from milligrams of sodium (1g NaCl ~ 393 mg Na),
 * and validates renal potassium and phosphorus safety against actual FCTB V6 nutrient data.
 */

import { 
  PatientProfile, 
  DietChartMeal, 
  FluidPrescription, 
  DiscretionaryFatAndSaltSchedule, 
  ClinicalSafetyResult, 
  FoodItem 
} from '../types';

export function evaluateFluidAndElectrolytes(
  patient: PatientProfile,
  meals: DietChartMeal[],
  allFoods: FoodItem[],
  fluidPrescription?: FluidPrescription,
  discretionarySchedule?: DiscretionaryFatAndSaltSchedule
): {
  totalFluidMl: number;
  totalSodiumMg: number;
  totalPotassiumMg: number;
  totalPhosphorusMg: number;
  hasMissingPotassiumData: boolean;
  hasMissingPhosphorusData: boolean;
  safetyResults: ClinicalSafetyResult[];
} {
  const safetyResults: ClinicalSafetyResult[] = [];
  const foodMap = new Map(allFoods.map(f => [f.id, f]));

  let foodSodiumMg = 0;
  let totalPotassiumMg = 0;
  let totalPhosphorusMg = 0;
  let hasMissingPotassiumData = false;
  let hasMissingPhosphorusData = false;

  for (const meal of meals) {
    for (const item of meal.items) {
      const food = foodMap.get(item.food_id);
      if (!food) continue;

      const rawG = item.raw_weight_g || 100;
      const mult = rawG / 100;

      // Sodium
      if (food.micronutrients?.sodium_mg !== null && food.micronutrients?.sodium_mg !== undefined) {
        foodSodiumMg += food.micronutrients.sodium_mg * mult;
      }

      // Potassium
      if (food.micronutrients?.potassium_mg !== null && food.micronutrients?.potassium_mg !== undefined) {
        totalPotassiumMg += food.micronutrients.potassium_mg * mult;
      } else {
        hasMissingPotassiumData = true;
      }

      // Phosphorus
      if (food.micronutrients?.phosphorus_mg !== null && food.micronutrients?.phosphorus_mg !== undefined) {
        totalPhosphorusMg += food.micronutrients.phosphorus_mg * mult;
      } else {
        hasMissingPhosphorusData = true;
      }
    }
  }

  // 1. Sodium from Added Discretionary Salt (1g NaCl = ~393 mg Elemental Sodium)
  const discretionarySaltG = discretionarySchedule?.discretionary_added_salt_g ?? 5; // Default 5g (~2000mg Na)
  const addedSodiumMg = Math.round(discretionarySaltG * 393.4);
  const totalSodiumMg = Math.round(foodSodiumMg + addedSodiumMg);

  // Sodium Restriction Check (e.g. Hypertension, CHF, CKD limit = 2000 mg Na / ~5g salt)
  const hasHypertensionOrRenal = patient.selected_conditions?.includes('hypertension_ckd');
  if (hasHypertensionOrRenal && totalSodiumMg > 2300) {
    safetyResults.push({
      rule_id: 'SODIUM_RESTRICTION_EXCEEDED',
      rule_version: '1.0.0',
      patient_id: patient.id,
      decision: 'CLINICAL_REVIEW_REQUIRED',
      severity: 'high',
      title_en: `Sodium Intake High: Total Sodium (${totalSodiumMg} mg) Exceeds Cardiovascular/Renal Target (2000 mg)`,
      title_bn: `সোডিয়াম মাত্রা বেশি: মোট সোডিয়াম (${totalSodiumMg} mg) লক্ষ্যমাত্রার (২০০০ mg) চেয়ে বেশি`,
      clinical_explanation_en: `Combined dietary sodium (${Math.round(foodSodiumMg)} mg from food + ${addedSodiumMg} mg from ${discretionarySaltG}g added salt) totals ${totalSodiumMg} mg. High sodium increases fluid retention and intraglomerular pressure.`,
      clinical_explanation_bn: `খাবার ও লবণ মিলিয়ে মোট সোডিয়াম (${totalSodiumMg} mg) নির্ধারিত সীমার বেশি। এটি রক্তচাপ বাড়ায়।`,
      required_action_en: `Reduce discretionary cooking salt from ${discretionarySaltG}g to <= 3g/day (~1200mg Na) to achieve target sodium <= 2000 mg/day.`,
      required_action_bn: `রান্নায় বাড়তি লবণের পরিমাণ দৈনিক ৩ গ্রাম বা তার নিচে নামিয়ে আনুন।`,
      affected_entity: {
        type: 'nutrient',
        id: 'sodium_mg',
        name_en: 'Sodium (mg)',
        name_bn: 'সোডিয়াম'
      },
      triggering_observations: [`total_sodium_mg:${totalSodiumMg}`, 'condition:hypertension_ckd'],
      clinician_review_required: true,
      provenance_reference: 'AHA/ACC Hypertension & KDIGO Sodium Management Guidelines',
      timestamp: new Date().toISOString()
    });
  }

  // 2. Fluid Accounting (Non-duplicate counting across categories)
  let totalFluidMl = 0;
  if (fluidPrescription) {
    const ac = fluidPrescription.accounting;
    totalFluidMl = (ac.plain_water_ml || 0) +
                   (ac.functional_drinks_ml || 0) +
                   (ac.beverages_tea_coffee_ml || 0) +
                   (ac.milk_dairy_liquids_ml || 0) +
                   (ac.soups_liquid_foods_ml || 0) +
                   (ac.oral_nutrition_supplements_ml || 0);

    if (fluidPrescription.is_restricted && fluidPrescription.total_fluid_limit_ml) {
      if (totalFluidMl > fluidPrescription.total_fluid_limit_ml) {
        const excessMl = totalFluidMl - fluidPrescription.total_fluid_limit_ml;
        safetyResults.push({
          rule_id: 'FLUID_PRESCRIPTION_EXCEEDED_STOP',
          rule_version: '1.0.0',
          patient_id: patient.id,
          decision: 'HARD_STOP',
          severity: 'critical',
          title_en: `Fluid Limit Exceeded: Total Intake (${totalFluidMl} mL) Exceeds Prescribed Restriction (${fluidPrescription.total_fluid_limit_ml} mL)`,
          title_bn: `পানি গ্রহণের সীমা অতিক্রম: মোট তরল (${totalFluidMl} mL) নির্ধারিত সীমার (${fluidPrescription.total_fluid_limit_ml} mL) চেয়ে বেশি`,
          clinical_explanation_en: `Prescribed fluid limit is ${fluidPrescription.total_fluid_limit_ml} mL (for severe renal/cardiac disease). Planned combined fluid (${totalFluidMl} mL) exceeds ceiling by ${excessMl} mL, risking pulmonary edema and volume overload.`,
          clinical_explanation_bn: `রোগীর জন্য অনুমোদিত তরলের পরিমাণ ${fluidPrescription.total_fluid_limit_ml} mL। অতিরিক্ত ${excessMl} mL পানি ফুসফুসে পানি জমার ঝুঁকি তৈরি করবে।`,
          required_action_en: `Reduce beverage, water, or functional drink allocations to stay strictly within ${fluidPrescription.total_fluid_limit_ml} mL.`,
          required_action_bn: `পানি ও পানীয়ের পরিমাণ কমিয়ে নির্ধারিত সীমার ভেতরে রাখুন।`,
          affected_entity: {
            type: 'nutrient',
            id: 'fluid_ml',
            name_en: 'Total Fluid (mL)',
            name_bn: 'মোট তরল গ্রহণ'
          },
          triggering_observations: [`total_fluid_ml:${totalFluidMl}`, `fluid_limit_ml:${fluidPrescription.total_fluid_limit_ml}`],
          clinician_review_required: true,
          provenance_reference: 'KDOQI Clinical Practice Guideline for Nutrition in CKD',
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  // 3. Renal Nutrient Data Integrity (Potassium & Phosphorus)
  if (hasHypertensionOrRenal) {
    if (hasMissingPotassiumData) {
      safetyResults.push({
        rule_id: 'POTASSIUM_DATA_INCOMPLETE_ADVISORY',
        rule_version: '1.0.0',
        patient_id: patient.id,
        decision: 'ADVISORY',
        severity: 'medium',
        title_en: 'Renal Nutrition Caution: Incomplete Potassium Data for Some Selected Foods',
        title_bn: 'কিডনি পুষ্টি সতর্কতা: কিছু খাবারের পটাসিয়াম মান ডাটাবেসে অপ্রাপ্য',
        clinical_explanation_en: 'One or more foods in the diet chart lack documented potassium values in FCTB V6. The software does not assume missing values are zero.',
        clinical_explanation_bn: 'তালিকার কিছু খাবারের সঠিক পটাসিয়াম মান ডাটাবেসে নেই। সফটওয়্যার অনুপস্থিত মানকে শূন্য হিসেবে গণ্য করে না।',
        required_action_en: 'Clinician should verify potassium-rich ingredients manually.',
        required_action_bn: 'উচ্চ পটাসিয়ামযুক্ত খাবার পুষ্টিবিদ কর্তৃক সতর্কতার সাথে যাচাই করুন।',
        triggering_observations: ['condition:hypertension_ckd', 'missing_potassium_values_present'],
        clinician_review_required: false,
        provenance_reference: 'KDIGO Clinical Practice Guideline on Electrolyte Safety in CKD',
        timestamp: new Date().toISOString()
      });
    }

    if (hasMissingPhosphorusData) {
      safetyResults.push({
        rule_id: 'PHOSPHORUS_DATA_INCOMPLETE_ADVISORY',
        rule_version: '1.0.0',
        patient_id: patient.id,
        decision: 'ADVISORY',
        severity: 'medium',
        title_en: 'Renal Nutrition Caution: Incomplete Phosphorus Data for Some Selected Foods',
        title_bn: 'কিডনি পুষ্টি সতর্কতা: কিছু খাবারের ফসফেট মান ডাটাবেসে অপ্রাপ্য',
        clinical_explanation_en: 'One or more foods lack documented phosphorus data in FCTB V6. Unknown values are preserved as unavailable rather than zero.',
        clinical_explanation_bn: 'তালিকার কিছু খাবারের ফসফেট মান ডাটাবেসে নেই। এটি শূন্য হিসেবে গণ্য করা হয়নি।',
        required_action_en: 'Review phosphorus binder timing and dietary phosphorus sources manually.',
        required_action_bn: 'ফসফেট বাইন্ডারের সময় ও খাবার পুষ্টিবিদ কর্তৃক যাচাই করুন।',
        triggering_observations: ['condition:hypertension_ckd', 'missing_phosphorus_values_present'],
        clinician_review_required: false,
        provenance_reference: 'KDOQI Nutrition in CKD - Phosphorus Evaluation',
        timestamp: new Date().toISOString()
      });
    }
  }

  return {
    totalFluidMl,
    totalSodiumMg,
    totalPotassiumMg: Math.round(totalPotassiumMg),
    totalPhosphorusMg: Math.round(totalPhosphorusMg),
    hasMissingPotassiumData,
    hasMissingPhosphorusData,
    safetyResults
  };
}
