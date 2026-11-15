/**
 * SHUDDHO FUNCTIONAL NUTRITION SOFTWARE
 * Central Intervention Validation Engine (Phase P0 Foundation)
 * 
 * Aggregates all clinical safety checks and enforces Global Safety Precedence:
 * 1. Confirmed Severe Allergy / Hard Medical Contraindication (HARD STOP)
 * 2. Patient-Specific Clinician Restrictions (HARD STOP)
 * 3. Medication-Meal / Nutrient Conflicts (HARD STOP / CLINICAL REVIEW)
 * 4. Feeding Route Limitations (HARD STOP)
 * 5. Population Safety Restrictions (HARD STOP)
 * 6. Energy, Fluid & Nutrient Constraints (HARD STOP / REVIEW)
 * 7. Functional Intervention Objectives & Ayurvedic Compatibility
 */

import { 
  PatientProfile, 
  DietChartMeal, 
  FoodItem, 
  FluidPrescription, 
  DiscretionaryFatAndSaltSchedule 
} from '../types';
import { 
  ClinicalSafetyDecision, 
  ClinicalSafetyResult, 
  ComprehensiveSafetyEvaluation 
} from './types';
import { evaluateFoodAllergiesAndHardRestrictions } from './foodAllergyEngine';
import { evaluateEnergySafety } from './energySafetyEngine';
import { evaluateMedicationSafety } from './medicationSafetyEngine';
import { evaluateFeedingRouteSafety } from './feedingRouteSafetyEngine';
import { evaluateFastingEligibility } from './fastingSafetyEngine';
import { evaluateFluidAndElectrolytes } from './fluidElectrolyteEngine';

export function validateInterventionPlan(
  patient: PatientProfile,
  meals: DietChartMeal[],
  allFoods: FoodItem[],
  options?: {
    fluidPrescription?: FluidPrescription;
    discretionarySchedule?: DiscretionaryFatAndSaltSchedule;
    plannedFastingHours?: number;
  }
): ComprehensiveSafetyEvaluation {
  const allResults: ClinicalSafetyResult[] = [];

  // 1. Food Allergies & Hard Prescribed Restrictions
  const allergyResults = evaluateFoodAllergiesAndHardRestrictions(patient, meals, allFoods);
  allResults.push(...allergyResults);

  // 2. Feeding Route Safety (NPO, Enteral, Dysphagia)
  const feedingResults = evaluateFeedingRouteSafety(patient, meals);
  allResults.push(...feedingResults);

  // 3. Energy Floor Safety (Adult BMR floor, Pregnancy/Pediatric adequacy)
  const energyResults = evaluateEnergySafety(patient, meals, options?.discretionarySchedule);
  allResults.push(...energyResults);

  // 4. Medication-Nutrition Safety (Insulin, Sulfonylureas, RAAS, etc.)
  const medResults = evaluateMedicationSafety(patient, meals, options?.plannedFastingHours);
  allResults.push(...medResults);

  // 5. Fasting Eligibility (if fasting is planned)
  if (options?.plannedFastingHours && options.plannedFastingHours > 0) {
    const { safetyResults: fastingResults } = evaluateFastingEligibility(patient, options.plannedFastingHours);
    allResults.push(...fastingResults);
  }

  // 6. Fluid, Sodium, Potassium & Phosphorus Accounting
  const { safetyResults: fluidResults } = evaluateFluidAndElectrolytes(
    patient, 
    meals, 
    allFoods, 
    options?.fluidPrescription, 
    options?.discretionarySchedule
  );
  allResults.push(...fluidResults);

  // Group results by decision level
  const hardStops = allResults.filter(r => r.decision === 'HARD_STOP');
  const clinicalReviewsRequired = allResults.filter(r => r.decision === 'CLINICAL_REVIEW_REQUIRED');
  const advisories = allResults.filter(r => r.decision === 'ADVISORY');

  // Determine Overall Decision
  let overallDecision: ClinicalSafetyDecision = 'ELIGIBLE_FOR_APPROVAL';
  let isEligible = true;

  if (hardStops.length > 0) {
    overallDecision = 'HARD_STOP';
    isEligible = false;
  } else if (clinicalReviewsRequired.length > 0) {
    overallDecision = 'CLINICAL_REVIEW_REQUIRED';
    isEligible = false;
  } else if (advisories.length > 0) {
    overallDecision = 'ADVISORY';
    isEligible = true;
  }

  const summary_en = hardStops.length > 0
    ? `Intervention BLOCKED: ${hardStops.length} hard clinical safety stop(s) detected. Must be resolved before approval.`
    : clinicalReviewsRequired.length > 0
    ? `Clinical Review Required: ${clinicalReviewsRequired.length} item(s) require clinician verification.`
    : `All automated safety checks passed (${allResults.length} rules evaluated). Eligible for clinician review.`;

  const summary_bn = hardStops.length > 0
    ? `খাদ্যতালিকা স্থগিত: ${hardStops.length}টি আবশ্যকীয় ক্লিনিক্যাল বাধা শনাক্ত হয়েছে। অনুমোদনের পূর্বে সংশোধন আবশ্যক।`
    : clinicalReviewsRequired.length > 0
    ? `ক্লিনিক্যাল পর্যালোচনা আবশ্যক: ${clinicalReviewsRequired.length}টি সতর্কতা পুষ্টিবিদ কর্তৃক যাচাই করা প্রয়োজন।`
    : `সকল স্বয়ংক্রিয় নিরাপত্তা পরীক্ষা উত্তীর্ণ হয়েছে (${allResults.length}টি যাচাইকৃত)। অনুমোদনের জন্য উপযুক্ত।`;

  return {
    overallDecision,
    isEligibleForApproval: isEligible,
    hardStops,
    clinicalReviewsRequired,
    advisories,
    results: allResults,
    evaluatedAt: new Date().toISOString(),
    summary_en,
    summary_bn
  };
}
