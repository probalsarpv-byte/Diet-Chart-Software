/**
 * SHUDDHO FUNCTIONAL NUTRITION SOFTWARE
 * Central Clinical Nutrition Safety Engine - Types
 */

import { 
  ClinicalSafetyDecision, 
  ClinicalSafetyResult, 
  FeedingStatus, 
  PopulationGroup, 
  PatientProfile, 
  DietChartMeal, 
  CandidateSupplement, 
  FluidPrescription 
} from '../types';

export type { ClinicalSafetyDecision, ClinicalSafetyResult };

export interface SafetyCheckContext {
  patient: PatientProfile;
  dietChart?: DietChartMeal[];
  supplements?: CandidateSupplement[];
  fluidPrescription?: FluidPrescription;
  plannedFastingHours?: number;
  selectedMealItemIds?: string[];
}

export interface ComprehensiveSafetyEvaluation {
  overallDecision: ClinicalSafetyDecision;
  isEligibleForApproval: boolean;
  hardStops: ClinicalSafetyResult[];
  clinicalReviewsRequired: ClinicalSafetyResult[];
  advisories: ClinicalSafetyResult[];
  results: ClinicalSafetyResult[];
  evaluatedAt: string;
  summary_en: string;
  summary_bn: string;
}
