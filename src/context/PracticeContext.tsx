'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FoodItem, 
  MedicineItem, 
  SupplementItem, 
  CandidateSupplement,
  PatientProfile, 
  DietChartMeal, 
  DietChartMealItem, 
  TrafficLightResult, 
  LongitudinalVisit, 
  PatientRecord, 
  ClinicalConditionId,
  FoodExchangeItem,
  SupplementOverlapWarning,
  InterventionApproval,
  InterventionRevision,
  InterventionLockState,
  FeedingStatus,
  ClinicalPathway,
  InterventionApprovalStatus,
  ClinicalVisitType,
  ClinicalVisitStatus,
  ClinicalVisit,
  AppointmentStatus,
  FollowUpAppointment,
  ClinicalVisitSnapshot,
  ComparativeProgressReport,
  LongitudinalProgressAnalysis,
  ClinicalProgressPlanningContext,
  DayPlanSummary,
  DayPlan,
  WeeklyDietPlan
} from '@/types';
import { 
  validateInterventionPlan, 
  ComprehensiveSafetyEvaluation 
} from '@/clinical-safety';
import foodsData from '@/data/foods.json';
import medicinesData from '@/data/medicines.json';
import supplementsData from '@/data/supplements.json';
import { calculateAnthropometrics } from '@/engine/anthropometrics';
import { analyzeFunctionalLabs } from '@/engine/labAnalyzer';
import { resolveConflicts } from '@/engine/conflictResolver';
import { evaluateDNIAndTimeline, DNIEngineResult, checkSupplementOverlaps } from '@/engine/dniEngine';
import { buildAutoScaledDietChart, getCookedDisplay, generateExchangesForFood } from '@/engine/mealScaler';
import { 
  generateWeeklyDietPlan, 
  regenerateDayInWeeklyPlan, 
  copyDayInWeeklyPlan, 
  calculateMealTotals,
  invalidateWeeklyPlanApproval,
  approveWeeklyDietPlan,
  validatePortionInput,
  evaluateWeeklyPlanClinicalSafety,
  recalculateDayPlan
} from '@/engine/weeklyPlanner';
import { advanceToNextPhase, recordFollowUpVisit, TransitionOptions } from '@/engine/phaseProgression';
import { runP2Analysis } from '@/engine/p2';
import { P2AnalysisResult, ClinicianDecision, P3NutritionPlanningContext } from '@/engine/p2/types';
import { ClinicalAssessment } from '@/types/assessment';
import { 
  executeLongitudinalComparison, 
  buildComparativeProgressReport, 
  constructClinicalProgressPlanningContext,
  validateClinicianCredentials
} from '@/engine/longitudinal/comparisonEngine';
import { safeStorage } from '@/utils/storageManager';
import { migratePatientRecord } from '@/utils/legacyMigration';
import { validateReferentialIntegrity } from '@/utils/referentialIntegrity';
import { 
  createNewVisitTransition, 
  completeVisitTransition,
  restoreVisitState,
  savePatientTransaction
} from '@/engine/visit/visitLifecycle';
import { 
  createClinicalSnapshot, 
  appendSnapshotWithRevisionPolicy, 
  getLatestVisitSnapshot, 
  getApprovedBaselineSnapshot,
  ClinicalObservationsPayload
} from '@/engine/snapshot/snapshotManager';
import { generateEntityId } from '@/utils/idGenerator';
import { ClinicianAuthProfile, isSupabaseConfigured, getSupabaseClient, fetchClinicianProfile } from '@/lib/supabaseClient';
import { AuthState } from '@/lib/authTypes';
import { getPracticeRepository, resetPracticeRepository, PracticeSyncStatus, AuditEventPayload, IPracticeRepository } from '@/repositories';
import { ClinicianAuthModal } from '@/components/auth/ClinicianAuthModal';
import { AuditHistoryModal } from '@/components/audit/AuditHistoryModal';
import { DataMigrationWizard } from '@/components/migration/DataMigrationWizard';
import { ClinicianInvitationModal } from '@/components/intake/ClinicianInvitationModal';
import { IntakeReconciliationModal } from '@/components/intake/IntakeReconciliationModal';
import { R4ProtocolStudioData } from '@/types/r4Protocol';
import { 
  generateAutomaticProtocolDraft, 
  createManualProtocolTemplate, 
  recalculateProtocolSafety 
} from '@/engine/r4ProtocolStudioEngine';
import { 
  PatientPathwayState, 
  R5MedicationRecord, 
  ExpandedClinicalPathwayId, 
  R5ClinicalContextPayload,
  R5NutritionAdjustmentContract
} from '@/types/r5Systems';
import { 
  evaluatePathwaySelectionState,
  mapLegacyPathwaysToExpanded,
  mapExpandedPathwaysToLegacy,
  mapPathwaysToConditionIds
} from '@/engine/r5PathwayRegistry';
import {
  normalizeMedicationRecord,
  canonicalToLegacyMedication,
  evaluateMedicationReconciliationStatus
} from '@/engine/r5MedicationSearchEngine';
import { deriveR5PopulationProfile } from '@/engine/r5PopulationEngine';
import { 
  evaluateFunctionalMatrix, 
  buildSystemsNetworkGraph, 
  adaptAssessmentEvidenceToMatrixInput,
  extractLabNumericValue,
  normalizeStructuredLabEntries
} from '@/engine/r5SystemsNetworkEngine';
import { resolveMultimorbidityConflicts } from '@/engine/r5MultimorbidityEngine';
import { buildR5NutritionAdjustmentContract } from '@/engine/r5NutritionContract';
import { analyzeInsulinRegimen } from '@/engine/r5InsulinEngine';
import { evaluateMedicationNutritionInteractions } from '@/engine/r5MedicationNutritionEngine';
import { adaptR5ContextToR4 } from '@/engine/r5ToR4Adapter';
import { evaluateR7LaboratoryIntelligence } from '@/engine/r7/biomarkerIntelligence';

export function generateCollisionResistantId(prefix: string): string {
  return generateEntityId(prefix);
}

import { getDhakaTodayDateString } from '@/utils/dhakaDate';
export { getDhakaTodayDateString };

export function refreshAppointmentStatus(apt: FollowUpAppointment): FollowUpAppointment {
  if (apt.status === 'completed' || apt.status === 'cancelled') {
    return apt;
  }
  const today = getDhakaTodayDateString();
  if (apt.scheduled_date === today) {
    return { ...apt, status: 'due_today' };
  } else if (apt.scheduled_date < today) {
    return { ...apt, status: 'overdue' };
  } else {
    return { ...apt, status: apt.rescheduled_from ? 'rescheduled' : 'scheduled' };
  }
}

const CURRENT_SCHEMA_VERSION = 2;

const allFoods = foodsData as FoodItem[];
const allMedicines = medicinesData as MedicineItem[];
const allSupplements = supplementsData as SupplementItem[];

export interface PracticeContextType {
  language: 'bn' | 'en';
  setLanguage: (lang: 'bn' | 'en') => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  activeTab: 'dashboard' | 'patients' | 'assessment' | 'clinical_intelligence' | 'diet' | 'followup' | 'report' | 'intake' | 'conditions' | 'dni' | 'protocol_studio' | 'systems_intelligence' | 'food_knowledge';
  setActiveTab: (tab: 'dashboard' | 'patients' | 'assessment' | 'clinical_intelligence' | 'diet' | 'followup' | 'report' | 'intake' | 'conditions' | 'dni' | 'protocol_studio' | 'systems_intelligence' | 'food_knowledge') => void;

  r5Pathways: PatientPathwayState;
  r5Medications: R5MedicationRecord[];
  updateR5Pathways: (selectedIds: ExpandedClinicalPathwayId[], isExplicitlyNoPathways: boolean) => void;
  updateR5Medications: (meds: R5MedicationRecord[]) => void;
  syncR5ToR4Protocol: () => void;
  r5NutritionContract: R5NutritionAdjustmentContract;

  r4Protocol: R4ProtocolStudioData | null;
  isR4ProtocolDirty: boolean;
  generateR4Draft: () => Promise<R4ProtocolStudioData>;
  createManualR4Protocol: () => Promise<R4ProtocolStudioData>;
  updateR4Protocol: (updated: R4ProtocolStudioData) => void;
  saveR4Protocol: () => Promise<R4ProtocolStudioData | null>;
  approveR4Protocol: (notes?: string) => Promise<R4ProtocolStudioData | null>;

  allFoods: FoodItem[];
  allMedicines: MedicineItem[];
  allSupplements: SupplementItem[];
  foodMap: Map<string, FoodItem>;

  patient: PatientProfile;
  updatePatient: (updates: Partial<PatientProfile>) => void;
  updateLabs: (labUpdates: Partial<PatientProfile['labs']>) => void;
  updateGutProfile: (gutUpdates: Partial<PatientProfile['gut_profile']>) => void;
  toggleCondition: (id: ClinicalConditionId) => void;
  toggleMedication: (id: string) => void;
  addConfirmedAllergy: (allergy: string) => void;
  removeConfirmedAllergy: (allergy: string) => void;
  addClinicianDisallowedFood: (foodIdOrKeyword: string) => void;
  removeClinicianDisallowedFood: (foodIdOrKeyword: string) => void;

  trafficLight: TrafficLightResult;
  dniResult: DNIEngineResult;
  overlapWarnings: SupplementOverlapWarning[];

  // Candidate Supplement Management
  candidateSupplements: CandidateSupplement[];
  approveCandidateSupplement: (id: string, dose?: string, notes?: string) => void;
  rejectCandidateSupplement: (id: string) => void;

  // Clinical Safety & Intervention Governance
  clinicalSafetyEvaluation: ComprehensiveSafetyEvaluation;
  interventionApproval: InterventionApproval;
  interventionRevisions: InterventionRevision[];
  lockState: InterventionLockState;
  approveCurrentIntervention: (clinicianId?: string, rationale?: string) => boolean;
  toggleItemLock: (type: 'food' | 'meal' | 'day' | 'supplement', id: string | number) => void;
  updateFeedingStatus: (status: Partial<FeedingStatus>) => void;
  updateClinicalPathways: (pathways: ClinicalPathway[]) => void;

  // Diet Plan Management
  dietChart: DietChartMeal[];
  isDietPlanDirty: boolean;
  recalculateDietPlan: (preserveManualEdits?: boolean) => void;
  dismissDirtyWarning: () => void;
  updateMealItemRawGrams: (mealId: string, itemId: string, rawGrams: number) => void;
  swapMealItemAlternative: (mealId: string, itemId: string, alt: FoodExchangeItem) => void;
  removeMealItem: (mealId: string, itemId: string) => void;
  addMealItem: (mealId: string, foodId: string, rawGrams?: number) => void;
  resetDietChartToAutoScaled: () => void;

  // Longitudinal Visits & Phases
  visits: LongitudinalVisit[];
  addVisit: (visit: Partial<LongitudinalVisit>) => void;
  advancePatientPhase: (options?: TransitionOptions) => void;

  // Longitudinal Visits, Appointments, Snapshots & Reports
  clinicalVisits: ClinicalVisit[];
  currentVisit: ClinicalVisit | null;
  followUpAppointments: FollowUpAppointment[];
  visitSnapshots: ClinicalVisitSnapshot[];
  progressReports: ComparativeProgressReport[];
  currentProgressReport: ComparativeProgressReport | null;

  registerNewPatient: (adminData: Partial<PatientProfile>) => PatientProfile | null;
  startNewVisit: (patientId: string, visitType?: ClinicalVisitType, notes?: string) => ClinicalVisit | null;
  selectVisit: (visitId: string) => void;
  selectedReportVisitId: string | null;
  selectReportVisit: (visitId: string) => void;
  completeCurrentVisit: (summary?: string) => void;
  scheduleFollowUp: (appointmentData: Omit<FollowUpAppointment, 'id' | 'appointment_id' | 'created_at' | 'status'> & { appointment_id?: string; status?: AppointmentStatus }) => FollowUpAppointment | null;
  rescheduleFollowUp: (appointmentId: string, newDate: string, newTime?: string, reason?: string) => boolean;
  cancelFollowUp: (appointmentId: string, reason?: string) => boolean;
  completeFollowUp: (appointmentId: string, actualVisitId?: string) => boolean;
  startFollowUpConsultation: (appointmentId: string, targetPatientId: string) => ClinicalVisit | null;
  logFollowUpConsultation: (payload: {
    weight_kg: number;
    waist_cm: number;
    whtr?: number;
    bristol_stool: number;
    energy_score: number;
    symptom_relief_pct: number;
    clinical_observations?: string;
    notes?: string;
  }) => boolean;
  captureVisitSnapshot: (isBaseline?: boolean, amendmentReason?: string, observationPayload?: ClinicalObservationsPayload) => ClinicalVisitSnapshot;
  generateProgressReport: (baselineVisitId: string, comparisonVisitId: string, comparisonMode?: 'baseline_vs_current' | 'previous_vs_current' | 'selected_pair' | 'trend_series') => ComparativeProgressReport | null;
  approveProgressReport: (reportId: string, clinicianId: string, notes?: string) => boolean;
  selectProgressReport: (reportId: string) => void;
  loadDemoPatient: () => void;

  // Patient Records Persistence
  savedPatients: PatientRecord[];
  saveCurrentPatient: () => boolean;
  loadPatient: (id: string) => boolean;
  createNewPatient: () => void;

  // Phase P2 Clinical Intelligence
  p2AnalysisResult: P2AnalysisResult | null;
  previewP2AnalysisResult: P2AnalysisResult | null;
  isAnalyzingP2: boolean;
  currentClinicalAssessment: ClinicalAssessment | null;
  executeP2Analysis: (assessmentOrAnswers?: ClinicalAssessment | Record<string, any>) => P2AnalysisResult | null;
  updateHypothesisDecision: (hypothesisId: string, decision: ClinicianDecision, note?: string) => void;
  approveP2Analysis: (clinicianId: string, notes?: string, targetVisitId?: string) => boolean;
  invalidateP2Approval: (reason?: string) => void;

  // Step 05: 7-Day Personalized Diet Planning & Prescription
  weeklyDietPlan: WeeklyDietPlan | null;
  activeDayNumber: number;
  setActiveDayNumber: (dayNumber: number) => void;
  generateWeeklyPlan: (forceRegenerate?: boolean) => WeeklyDietPlan | null;
  regenerateDay: (dayNumber: number, preserveLocks?: boolean) => WeeklyDietPlan | null;
  updateDayMealItemRawGrams: (dayNumber: number, mealId: string, itemId: string, rawGrams: number) => void;
  swapDayMealItemAlternative: (dayNumber: number, mealId: string, itemId: string, alt: FoodExchangeItem) => void;
  removeDayMealItem: (dayNumber: number, mealId: string, itemId: string) => void;
  addDayMealItem: (dayNumber: number, mealId: string, foodId: string, rawGrams?: number) => void;
  toggleDayLock: (dayNumber: number) => void;
  toggleMealLockInDay: (dayNumber: number, mealId: string) => void;
  toggleItemLockInDay: (dayNumber: number, itemId: string) => void;
  copyDayPlan: (sourceDayNumber: number, targetDayNumber: number) => boolean;
  approveWeeklyPlan: (clinicianId: string, notes?: string) => boolean;
  weeklyPlanApprovalError: string | null;
  clearWeeklyPlanApprovalError: () => void;

  // R2 Backend & Multi-Tenancy Authentication
  authState: AuthState;
  setAuthState: (state: AuthState) => void;
  authError: string | null;
  signOut: () => Promise<void>;
  currentClinician: ClinicianAuthProfile | null;
  setCurrentClinician: (clinician: ClinicianAuthProfile | null) => void;
  syncStatus: PracticeSyncStatus;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isAuditModalOpen: boolean;
  setIsAuditModalOpen: (open: boolean) => void;
  isMigrationModalOpen: boolean;
  setIsMigrationModalOpen: (open: boolean) => void;
  refreshSyncStatus: () => void;

  // R3 Patient Self-Assessment Portal
  repository: IPracticeRepository;
  clinicianUser: ClinicianAuthProfile;
  isInvitationModalOpen: boolean;
  setIsInvitationModalOpen: (open: boolean) => void;
  isReconciliationModalOpen: boolean;
  setIsReconciliationModalOpen: (open: boolean) => void;
  stagedSubmissionsCount: number;
  refreshStagedSubmissionsCount: () => Promise<void>;

  // Phase R6: Authoritative Report Mode & Print/PDF Release Gate
  reportStudioMode: 'clinician' | 'patient';
  setReportStudioMode: (mode: 'clinician' | 'patient') => void;
  reportReleaseGate: { isEligible: boolean; blockingReasons: string[]; blockingReasons_bn: string[] };
  setReportReleaseGate: (gate: { isEligible: boolean; blockingReasons: string[]; blockingReasons_bn: string[] }) => void;
}

const PracticeContext = createContext<PracticeContextType | undefined>(undefined);

function createInitialSeedPatient(): PatientProfile {
  const baseCalc = calculateAnthropometrics(
    48, 'female', 152, 74, 92, 'sedentary', 
    ['t2d_ir', 'hypothyroid', 'fatty_liver', 'uric_acid_gout'],
    'adult_standard', undefined, 'clamped_to_bmr'
  );

  const initialLabs = analyzeFunctionalLabs({
    fasting_glucose: 118,
    fasting_insulin: 16,
    triglycerides: 220,
    hdl: 38,
    tsh: 3.8,
    hba1c: 6.8,
    vitamin_d3: 18,
    vitamin_b12: 240,
    uric_acid: 6.8,
    alt: 38,
    lab_flags: []
  }, 'female');

  return {
    schema_version: CURRENT_SCHEMA_VERSION,
    id: 'pt_nasreen_01',
    name: "Mrs. Nasreen Akhter",
    age: 48,
    gender: 'female',
    phone: "01712-345678",
    email: "nasreen.akhter@example.com",
    visit_date: new Date().toISOString().split('T')[0],
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
    medication_reconciliation_status: 'fully_reconciled',
    medication_records: [
      {
        id: 'med_seed_metformin',
        medication_name: 'Metformin Hydrochloride (Comet 500)',
        generic_name: 'Metformin Hydrochloride',
        brand_name: 'Comet 500',
        prescribed_dose: '500 mg',
        dose: '500 mg',
        dose_unit: 'mg',
        frequency: 'Twice daily',
        timing: 'with_meal',
        route: 'Oral',
        administration_times: ['08:00', '20:00'],
        is_timing_unknown: false,
        relationship_to_meals: 'with_meal',
        is_prn: false,
        status: 'active',
        verification_status: 'clinician_verified',
        rule_coverage: 'interaction_monitored',
        source: 'clinician_entry',
        duration: '3 months',
        duration_bn: '৩ মাস',
        notes: 'Take with morning and evening meals'
      },
      {
        id: 'med_seed_thyrox',
        medication_name: 'Levothyroxine Sodium (Thyrox 50)',
        generic_name: 'Levothyroxine Sodium',
        brand_name: 'Thyrox 50',
        prescribed_dose: '50 mcg',
        dose: '50 mcg',
        dose_unit: 'mcg',
        frequency: 'Once daily morning',
        timing: 'before_meal_empty_stomach',
        route: 'Oral',
        administration_times: ['06:30'],
        is_timing_unknown: false,
        relationship_to_meals: 'before_meal_empty_stomach',
        is_prn: false,
        status: 'active',
        verification_status: 'clinician_verified',
        rule_coverage: 'interaction_monitored',
        source: 'clinician_entry',
        duration: 'Ongoing',
        duration_bn: 'চলমান',
        notes: 'Take 30 minutes before breakfast with plain water'
      },
      {
        id: 'med_seed_seclo',
        medication_name: 'Omeprazole (Seclo 20)',
        generic_name: 'Omeprazole',
        brand_name: 'Seclo 20',
        prescribed_dose: '20 mg',
        dose: '20 mg',
        dose_unit: 'mg',
        frequency: 'Once daily morning',
        timing: 'before_meal_empty_stomach',
        route: 'Oral',
        administration_times: ['07:30'],
        is_timing_unknown: false,
        relationship_to_meals: 'before_meal_empty_stomach',
        is_prn: false,
        status: 'active',
        verification_status: 'clinician_verified',
        rule_coverage: 'interaction_monitored',
        source: 'clinician_entry',
        duration: '4 weeks',
        duration_bn: '৪ সপ্তাহ',
        notes: 'Take 15-30 minutes before breakfast'
      }
    ],
    gut_profile: {
      bloating: 'severe',
      acid_reflux_hypoacidity: true,
      bristol_stool_score: 2,
      energy_score: 4,
      sleep_quality_score: 5,
      digestive_fire_agni: 'mandagni'
    },
    labs: initialLabs,
    calculated: baseCalc,
    custom_clinical_notes: "দীর্ঘদিন ধরে অম্লপিত্ত, মেটফর্মিন ও গ্যাস্ট্রিকের ওষুধ সেবন। থাইরয়েড নিয়ন্ত্রণের চেষ্টা চলছে।",
    is_diet_plan_dirty: false,
    assessment_last_updated_at: new Date().toISOString(),
    diet_plan_generated_at: new Date().toISOString(),
    manual_edits_preserved: false
  };
}


export const PracticeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'patients' | 'assessment' | 'clinical_intelligence' | 'diet' | 'followup' | 'report' | 'intake' | 'conditions' | 'dni' | 'protocol_studio' | 'systems_intelligence' | 'food_knowledge'>('dashboard');

  const [r4Protocol, setR4Protocol] = useState<R4ProtocolStudioData | null>(null);
  const [isR4ProtocolDirty, setIsR4ProtocolDirty] = useState<boolean>(false);
  const [reportStudioMode, setReportStudioMode] = useState<'clinician' | 'patient'>('clinician');
  const [reportReleaseGate, setReportReleaseGate] = useState<{
    isEligible: boolean;
    blockingReasons: string[];
    blockingReasons_bn: string[];
  }>({ isEligible: false, blockingReasons: [], blockingReasons_bn: [] });

  const [patient, setPatient] = useState<PatientProfile>(createInitialSeedPatient);

  // Phase R5: Systems Intelligence & Expanded Pathways State (derived from active patient)
  const [r5Pathways, setR5Pathways] = useState<PatientPathwayState>(() => {
    const init = createInitialSeedPatient();
    if (init.r5_pathways) return init.r5_pathways;
    if (init.clinical_pathways && init.clinical_pathways.length > 0) {
      return evaluatePathwaySelectionState(mapLegacyPathwaysToExpanded(init.clinical_pathways), false);
    }
    return evaluatePathwaySelectionState([]);
  });
  const [r5Medications, setR5Medications] = useState<R5MedicationRecord[]>(() => {
    const init = createInitialSeedPatient();
    return (init.medication_records || []).map(normalizeMedicationRecord);
  });
  const [visits, setVisits] = useState<LongitudinalVisit[]>([]);
  const [clinicalVisits, setClinicalVisits] = useState<ClinicalVisit[]>([]);
  const [currentVisit, setCurrentVisit] = useState<ClinicalVisit | null>(null);
  const [selectedReportVisitId, setSelectedReportVisitId] = useState<string | null>(null);
  const [followUpAppointments, setFollowUpAppointments] = useState<FollowUpAppointment[]>([]);
  const [visitSnapshots, setVisitSnapshots] = useState<ClinicalVisitSnapshot[]>([]);
  const [progressReports, setProgressReports] = useState<ComparativeProgressReport[]>([]);
  const [currentProgressReport, setCurrentProgressReport] = useState<ComparativeProgressReport | null>(null);
  const [dietChart, setDietChart] = useState<DietChartMeal[]>([]);
  const [weeklyDietPlan, setWeeklyDietPlan] = useState<WeeklyDietPlan | null>(null);
  const [activeDayNumber, setActiveDayNumber] = useState<number>(1);
  const [weeklyPlanApprovalError, setWeeklyPlanApprovalError] = useState<string | null>(null);
  const clearWeeklyPlanApprovalError = useCallback(() => setWeeklyPlanApprovalError(null), []);

  // R2 Backend & Multi-Tenancy Authentication State
  const [authState, setAuthState] = useState<AuthState>(() => 
    isSupabaseConfigured() ? 'INITIALIZING' : (process.env.NODE_ENV === 'production' ? 'ERROR' : 'AUTHORIZED')
  );
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentClinician, setCurrentClinician] = useState<ClinicianAuthProfile | null>(() => {
    if (!isSupabaseConfigured() && process.env.NODE_ENV !== 'production') {
      return {
        id: 'c0000000-0000-0000-0000-000000000002',
        auth_user_id: 'u0000000-0000-0000-0000-000000000002',
        organization_id: 'a0000000-0000-0000-0000-000000000001',
        name: 'Dr. Tariqul Islam, MD, PhD, CNS',
        email: 'clinical.director@shuddho.clinic',
        role: 'CLINICAL_DIRECTOR',
        license_number: 'BMDC-A-67123',
        is_active: true
      };
    }
    return null;
  });
  const [syncStatus, setSyncStatus] = useState<PracticeSyncStatus>(() => getPracticeRepository().getSyncStatus());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);

  // R3 Patient Self-Assessment Portal State
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);
  const [isReconciliationModalOpen, setIsReconciliationModalOpen] = useState(false);
  const [stagedSubmissionsCount, setStagedSubmissionsCount] = useState(0);

  const repository = useMemo(() => {
    return getPracticeRepository(false, currentClinician?.organization_id);
  }, [currentClinician?.organization_id, syncStatus.state]);

  const clinicianUser: ClinicianAuthProfile = useMemo(() => {
    if (currentClinician) return currentClinician;
    if (!isSupabaseConfigured() && process.env.NODE_ENV !== 'production') {
      return {
        id: 'c0000000-0000-0000-0000-000000000002',
        auth_user_id: 'u0000000-0000-0000-0000-000000000002',
        organization_id: 'a0000000-0000-0000-0000-000000000001',
        name: 'Dr. Tariqul Islam, MD, PhD, CNS',
        email: 'clinical.director@shuddho.clinic',
        role: 'CLINICAL_DIRECTOR',
        license_number: 'BMDC-A-67123',
        is_active: true
      };
    }
    return {
      id: '',
      auth_user_id: '',
      organization_id: '',
      name: 'Unauthenticated Clinician',
      email: '',
      role: 'ASSISTANT_DIETITIAN',
      is_active: false
    };
  }, [currentClinician]);

  const signOut = useCallback(async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    resetPracticeRepository();
    setCurrentClinician(null);
    setAuthState('SIGNED_OUT');
    setAuthError(null);
    setPatient(createInitialSeedPatient());
  }, []);

  const refreshStagedSubmissionsCount = useCallback(async () => {
    if (!patient?.id) {
      setStagedSubmissionsCount(0);
      return;
    }
    try {
      const list = await repository.getStagedSubmissions(patient.id);
      setStagedSubmissionsCount(list.length);
    } catch {
      setStagedSubmissionsCount(0);
    }
  }, [patient?.id, repository]);

  useEffect(() => {
    refreshStagedSubmissionsCount();
  }, [patient?.id, refreshStagedSubmissionsCount]);

  const refreshSyncStatus = useCallback(() => {
    setSyncStatus(getPracticeRepository().getSyncStatus());
  }, []);

  // Restore Supabase session on client-side mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isSupabaseConfigured()) {
      setAuthState('AUTHORIZED');
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setAuthState('ERROR');
      setAuthError('Supabase client failed to initialize');
      return;
    }

    setAuthState('INITIALIZING');
    client.auth.getSession().then(async ({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        console.error('Session error:', sessionError);
        setAuthState('ERROR');
        setAuthError(sessionError.message);
        return;
      }

      if (!session?.user) {
        setCurrentClinician(null);
        setAuthState('SIGNED_OUT');
        return;
      }

      setAuthState('PROFILE_LOADING');
      const profile = await fetchClinicianProfile(session.user.id);
      if (!profile) {
        setCurrentClinician(null);
        setAuthState('UNAUTHORIZED');
        setAuthError('Account unlinked: No active clinician profile found in database.');
        return;
      }

      setCurrentClinician(profile);
      setAuthState('AUTHORIZED');
      setAuthError(null);
      refreshSyncStatus();
    }).catch((err) => {
      console.error('Auth initialization error:', err);
      setAuthState('ERROR');
      setAuthError(err?.message || 'Authentication error');
    });

    const { data: authListener } = client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setCurrentClinician(null);
        setAuthState('SIGNED_OUT');
        refreshSyncStatus();
        return;
      }

      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setAuthState('PROFILE_LOADING');
        const profile = await fetchClinicianProfile(session.user.id);
        if (!profile) {
          setCurrentClinician(null);
          setAuthState('UNAUTHORIZED');
          setAuthError('Account unlinked: No active clinician profile found in database.');
        } else {
          setCurrentClinician(profile);
          setAuthState('AUTHORIZED');
          setAuthError(null);
        }
        refreshSyncStatus();
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [refreshSyncStatus]);

  const persistWeeklyPlan = useCallback((plan: WeeklyDietPlan): boolean => {
    if (!plan || !plan.patient_id) return false;
    const targetVisitId = plan.visit_id || patient.current_visit_id || currentVisit?.visit_id || currentVisit?.id || 'default_visit';
    const planKey = `shuddho_weekly_plan_${plan.patient_id}_${targetVisitId}`;
    const saved = safeStorage.setItem(planKey, plan);
    if (!saved) return false;
    const readBack = safeStorage.getItem<WeeklyDietPlan>(planKey);
    if (!readBack || readBack.plan_id !== plan.plan_id || readBack.version !== plan.version) {
      return false;
    }
    return true;
  }, [patient?.current_visit_id, currentVisit]);
  const [candidateSupplements, setCandidateSupplements] = useState<CandidateSupplement[]>([]);
  const [savedPatients, setSavedPatients] = useState<PatientRecord[]>([]);

  // Clinical Safety & Intervention Revision State
  const [revisionNumber, setRevisionNumber] = useState(1);
  const [interventionApproval, setInterventionApproval] = useState<InterventionApproval>({
    intervention_id: `int_${patient.id}_1`,
    revision_number: 1,
    approved_by: '',
    approval_timestamp: '',
    status: 'draft',
    is_valid: false
  });
  const [interventionRevisions, setInterventionRevisions] = useState<InterventionRevision[]>([]);
  const [lockState, setLockState] = useState<InterventionLockState>({
    locked_food_ids: [],
    locked_meal_ids: [],
    locked_days: [],
    locked_supplement_ids: [],
    locked_sections: []
  });

  // Phase P2 Clinical Intelligence State
  const [p2AnalysisResult, setP2AnalysisResult] = useState<P2AnalysisResult | null>(null);
  const [previewP2AnalysisResult, setPreviewP2AnalysisResult] = useState<P2AnalysisResult | null>(null);
  const [currentClinicalAssessment, setCurrentClinicalAssessment] = useState<ClinicalAssessment | null>(null);
  const [isAnalyzingP2, setIsAnalyzingP2] = useState<boolean>(false);

  // Invalidate P2 overall approval when underlying clinical data changes
  const invalidateP2Approval = useCallback((reason = 'Patient clinical data modified after sign-off') => {
    setP2AnalysisResult(prev => {
      if (!prev || !prev.report?.isApproved) return prev;
      const invalidTimestamp = new Date().toISOString();
      const updated: P2AnalysisResult = {
        ...prev,
        analysisInvalidatedAt: invalidTimestamp,
        report: {
          ...prev.report,
          isApproved: false,
          approvedBy: undefined,
          approvalDate: undefined,
          analysisInvalidatedAt: invalidTimestamp,
          invalidationReason: reason,
          sectionN_clinicianReview: {
            ...prev.report.sectionN_clinicianReview,
            status: 'pending',
            notes: `Prior approval invalidated on ${invalidTimestamp}: ${reason}. Re-evaluation required.`,
          },
        },
        p3PlanningContext: {
          ...prev.p3PlanningContext,
          clinicalAssessmentApproved: false,
          approvedByClinicianId: undefined,
          approvalTimestamp: undefined,
          analysisInvalidatedAt: invalidTimestamp,
          invalidationReason: reason,
        },
      };

      const visitDateClean = (patient.visit_date || '').replace(/[^0-9]/g, '');
      const visitId = prev.visitId || prev.report?.visitId || patient.current_visit_id || `visit_${patient.id}_${visitDateClean}`;
      const storageKey = `shuddho_p2_analysis_${patient.id}_${visitId}`;
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        }
      } catch (err) {
        console.warn('Failed to persist invalidated P2 analysis:', err);
      }
      return updated;
    });

    setWeeklyDietPlan(wPrev => {
      if (!wPrev || (!wPrev.is_approved && wPrev.status !== 'approved')) return wPrev;
      const inv = invalidateWeeklyPlanApproval(wPrev, `Clinical assessment invalidated: ${reason}`);
      persistWeeklyPlan(inv);
      return inv;
    });
  }, [patient?.id, patient?.visit_date, patient?.current_visit_id, persistWeeklyPlan]);

  // Load patient-isolated P2 analysis from LocalStorage
  useEffect(() => {
    if (!patient?.id) return;
    const visitDateClean = (patient.visit_date || '').replace(/[^0-9]/g, '');
    const visitId = p2AnalysisResult?.visitId || p2AnalysisResult?.report?.visitId || patient.current_visit_id || `visit_${patient.id}_${visitDateClean}`;
    const storageKey = `shuddho_p2_analysis_${patient.id}_${visitId}`;
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
      if (saved) {
        setP2AnalysisResult(JSON.parse(saved));
      } else {
        const initial = runP2Analysis(patient);
        setP2AnalysisResult(initial);
      }
    } catch (e) {
      console.warn('Could not load P2 analysis from storage:', e);
      const initial = runP2Analysis(patient);
      setP2AnalysisResult(initial);
    }
  }, [patient?.id, patient?.visit_date, patient?.current_visit_id]);

  const executeP2Analysis = useCallback((assessmentOrAnswers?: ClinicalAssessment | Record<string, any>) => {
    if (!patient?.id) return null;
    setIsAnalyzingP2(true);
    try {
      let asmt: ClinicalAssessment | undefined = undefined;
      let answers: Record<string, any> | undefined = undefined;

      if (assessmentOrAnswers && 'questionnaire_version' in assessmentOrAnswers) {
        asmt = assessmentOrAnswers as ClinicalAssessment;
        setCurrentClinicalAssessment(asmt);
      } else if (assessmentOrAnswers) {
        answers = assessmentOrAnswers as Record<string, any>;
      } else if (currentClinicalAssessment) {
        asmt = currentClinicalAssessment;
      }

      const visitDateClean = (patient.visit_date || '').replace(/[^0-9]/g, '');
      const visitId = patient.current_visit_id || asmt?.visit_id || `visit_${patient.id}_${visitDateClean}`;
      const assessmentId = asmt?.assessment_id;

      const isSameVisitAnalysis = Boolean(p2AnalysisResult && (!p2AnalysisResult.visitId || p2AnalysisResult.visitId === visitId));
      const previousApprovals = isSameVisitAnalysis ? p2AnalysisResult?.approvalHistory : undefined;
      const isOverallApproved = isSameVisitAnalysis ? Boolean(p2AnalysisResult?.report?.isApproved && !p2AnalysisResult?.analysisInvalidatedAt) : false;
      const approvedByClinicianId = isSameVisitAnalysis ? p2AnalysisResult?.report?.approvedBy : undefined;
      const approvalTimestamp = isSameVisitAnalysis ? p2AnalysisResult?.report?.approvalDate : undefined;
      const clinicianNotes = isSameVisitAnalysis ? p2AnalysisResult?.report?.clinicianNotes : undefined;

      const result = runP2Analysis({
        patient,
        assessment: asmt,
        assessmentAnswers: answers,
        previousApprovals,
        isOverallApproved,
        approvedByClinicianId,
        approvalTimestamp,
        clinicianNotes,
        visitId,
        assessmentId,
      });

      setP2AnalysisResult(result);
      const storageKey = `shuddho_p2_analysis_${patient.id}_${visitId}`;
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, JSON.stringify(result));
        }
      } catch (err) {
        console.warn('Failed to persist P2 analysis to localStorage:', err);
      }
      return result;
    } finally {
      setIsAnalyzingP2(false);
    }
  }, [patient, p2AnalysisResult, currentClinicalAssessment]);

  const updateHypothesisDecision = useCallback((hypothesisId: string, decision: ClinicianDecision, note?: string) => {
    if (!p2AnalysisResult) return;
    const updatedHypotheses = p2AnalysisResult.hypotheses.map(h => {
      if (h.id === hypothesisId) {
        return {
          ...h,
          clinicianDecision: decision,
          clinicianNote: note !== undefined ? note : h.clinicianNote,
          clinicianDecidedAt: new Date().toISOString(),
        };
      }
      return h;
    });

    const approvalRecord = {
      targetId: hypothesisId,
      targetType: 'hypothesis' as const,
      decision,
      timestamp: new Date().toISOString(),
      reason: note,
      evidenceSnapshot: JSON.stringify({ hypothesisId, decision }),
      ruleVersion: '2.0.0',
    };

    const newApprovalHistory = [
      ...p2AnalysisResult.approvalHistory.filter(a => a.targetId !== hypothesisId),
      approvalRecord,
    ];

    const updatedResult: P2AnalysisResult = {
      ...p2AnalysisResult,
      hypotheses: updatedHypotheses,
      approvalHistory: newApprovalHistory,
    };

    setP2AnalysisResult(updatedResult);
    const visitDateClean = (patient.visit_date || '').replace(/[^0-9]/g, '');
    const visitId = p2AnalysisResult?.visitId || p2AnalysisResult?.report?.visitId || patient.current_visit_id || `visit_${patient.id}_${visitDateClean}`;
    const storageKey = `shuddho_p2_analysis_${patient.id}_${visitId}`;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(updatedResult));
      }
    } catch (err) {
      console.warn('Failed to persist hypothesis decision:', err);
    }
  }, [patient, p2AnalysisResult]);

  const approveP2Analysis = useCallback((clinicianId: string, notes?: string, targetVisitId?: string): boolean => {
    // Determine target analysis: preview report (if historical) vs active consultation p2
    const isHistoricalTarget = Boolean(
      (targetVisitId && patient.current_visit_id && targetVisitId !== patient.current_visit_id) ||
      (!targetVisitId && selectedReportVisitId && patient.current_visit_id && selectedReportVisitId !== patient.current_visit_id)
    );

    let targetAnalysis: P2AnalysisResult | null = null;
    if (isHistoricalTarget) {
      if (previewP2AnalysisResult && (!targetVisitId || previewP2AnalysisResult.visitId === targetVisitId || previewP2AnalysisResult.report?.visitId === targetVisitId)) {
        targetAnalysis = previewP2AnalysisResult;
      } else if (targetVisitId) {
        try {
          targetAnalysis = safeStorage.getItem<P2AnalysisResult>(`shuddho_p2_analysis_${patient.id}_${targetVisitId}`);
        } catch {
          targetAnalysis = null;
        }
      }
    } else {
      targetAnalysis = p2AnalysisResult;
    }

    if (!targetAnalysis || !targetAnalysis.report) {
      console.warn('Rejected P2 approval: No active P2 analysis result or report available.');
      return false;
    }

    // 1. Strict validation of clinician identity: prohibit generic placeholders
    const trimmedId = (clinicianId || '').trim();
    const isPlaceholder = [
      'clinician',
      'dr. clinical nutritionist',
      'doctor',
      'nutritionist',
      'admin',
      'user',
      'test',
      'guest'
    ].includes(trimmedId.toLowerCase());

    if (!trimmedId || trimmedId.length < 3 || isPlaceholder) {
      console.warn('Rejected P2 approval: Clinician ID must be a non-placeholder registered practitioner identifier.');
      return false;
    }

    // 2. Authoritative Report Identity Verification
    const reportPatientId = targetAnalysis.patientId || targetAnalysis.report.patientId;
    const reportVisitId = targetAnalysis.visitId || targetAnalysis.report.visitId;
    const reportId = targetAnalysis.report.reportId;

    // Cross-Patient Protection (Scenario D)
    if (!reportPatientId || reportPatientId !== patient.id) {
      console.warn(`Rejected P2 approval: Report patient ID (${reportPatientId}) does not match active patient ID (${patient.id}).`);
      return false;
    }
    if (targetAnalysis.report.patientId && targetAnalysis.report.patientId !== patient.id) {
      console.warn(`Rejected P2 approval: Embedded report patient ID does not match active patient ID.`);
      return false;
    }

    // Missing or Inconsistent Visit Identity (Scenario E)
    if (!reportVisitId || typeof reportVisitId !== 'string' || reportVisitId.trim() === '') {
      console.warn('Rejected P2 approval: Missing or empty report visit ID.');
      return false;
    }
    if (targetAnalysis.report.visitId && targetAnalysis.report.visitId !== reportVisitId) {
      console.warn(`Rejected P2 approval: Inconsistent report visit ID between result (${reportVisitId}) and report (${targetAnalysis.report.visitId}).`);
      return false;
    }
    if (targetVisitId && targetVisitId !== reportVisitId) {
      console.warn(`Rejected P2 approval: Target visit ID (${targetVisitId}) does not match authoritative report visit ID (${reportVisitId}).`);
      return false;
    }

    // Verify visit belongs to patient's clinical visits or active visit
    const visitExists = (clinicalVisits && clinicalVisits.some(v => v.visit_id === reportVisitId || v.id === reportVisitId)) ||
      reportVisitId === patient.current_visit_id ||
      (currentVisit && (reportVisitId === currentVisit.visit_id || reportVisitId === currentVisit.id));
    if (!visitExists) {
      console.warn(`Rejected P2 approval: Report visit ID (${reportVisitId}) is not recognized in patient clinical visits.`);
      return false;
    }

    // Verify reportId
    if (!reportId || typeof reportId !== 'string' || reportId.trim() === '') {
      console.warn('Rejected P2 approval: Missing or empty reportId.');
      return false;
    }

    // 3. Determine whether this is the active consultation visit or a historical visit
    const isCurrentActiveVisit = !isHistoricalTarget && Boolean(
      (patient.current_visit_id && reportVisitId === patient.current_visit_id) ||
      (!patient.current_visit_id && currentVisit && (reportVisitId === currentVisit.visit_id || reportVisitId === currentVisit.id))
    );

    const targetStorageKey = `shuddho_p2_analysis_${reportPatientId}_${reportVisitId}`;

    // 4. Policy Checks
    if (isCurrentActiveVisit) {
      // Active Visit Approval (Scenario A)
      if (targetAnalysis.report.sectionK_clinicalSafety?.hardStops && targetAnalysis.report.sectionK_clinicalSafety.hardStops.length > 0) {
        console.warn('Rejected P2 approval: Active clinical safety hard stops exist. Must be clinically resolved before sign-off.');
        return false;
      }

      // Require complete safety screening if current assessment belongs to active visit
      if (currentClinicalAssessment && (!currentClinicalAssessment.visit_id || currentClinicalAssessment.visit_id === reportVisitId)) {
        if (!currentClinicalAssessment.completion.clinical_safety_completed) {
          console.warn('Rejected P2 approval: Clinical safety assessment is incomplete. Critical safety screening must be resolved.');
          return false;
        }
        if (!currentClinicalAssessment.completion.allergies_reconciled) {
          console.warn('Rejected P2 approval: Allergy history is not explicitly reconciled.');
          return false;
        }
        if (!currentClinicalAssessment.completion.medication_reconciliation_completed) {
          console.warn('Rejected P2 approval: Complete medication reconciliation (dose, frequency, timing, verification) is required.');
          return false;
        }
      }

      // Nutrient restrictions clarification
      if (targetAnalysis.p3PlanningContext?.prescriptions) {
        const unclarified = Object.values(targetAnalysis.p3PlanningContext.prescriptions).filter(p => p.requiresClarification);
        if (unclarified.length > 0) {
          console.warn('Rejected P2 approval: Prescribed nutrient restrictions require clarification before sign-off.');
          return false;
        }
      }
    } else {
      // Historical Visit Approval Policy (Scenario B & C)
      // Preferred Policy: Original saved report must exist in durable storage
      let existingSavedReport: P2AnalysisResult | null = null;
      try {
        existingSavedReport = safeStorage.getItem<P2AnalysisResult>(targetStorageKey);
      } catch (err) {
        console.error('Storage check failed during historical approval:', err);
        return false;
      }
      if (!existingSavedReport) {
        console.warn(`Rejected historical P2 approval: Original saved report does not exist in storage for visit ${reportVisitId}. Cannot approve an unpersisted or fabricated historical report.`);
        return false;
      }

      // Report must not have been invalidated
      if (targetAnalysis.analysisInvalidatedAt || existingSavedReport.analysisInvalidatedAt) {
        console.warn('Rejected historical P2 approval: Historical report was previously invalidated. Cannot sign-off without re-review.');
        return false;
      }

      // Safety review evidence must be available and free of active hard stops
      if (targetAnalysis.report.sectionK_clinicalSafety?.hardStops && targetAnalysis.report.sectionK_clinicalSafety.hardStops.length > 0) {
        console.warn('Rejected historical P2 approval: Active clinical safety hard stops exist in historical report.');
        return false;
      }
      if (existingSavedReport.report.sectionK_clinicalSafety?.hardStops && existingSavedReport.report.sectionK_clinicalSafety.hardStops.length > 0) {
        console.warn('Rejected historical P2 approval: Active clinical safety hard stops exist in saved historical report.');
        return false;
      }

      // Nutrient restrictions clarification
      if (targetAnalysis.p3PlanningContext?.prescriptions) {
        const unclarified = Object.values(targetAnalysis.p3PlanningContext.prescriptions).filter(p => p.requiresClarification);
        if (unclarified.length > 0) {
          console.warn('Rejected historical P2 approval: Unclarified nutrient restrictions in historical context.');
          return false;
        }
      }
    }

    // 5. Avoid duplicate churn from repeated clicks if already approved with same clinician
    if (targetAnalysis.report.isApproved && targetAnalysis.report.approvedBy === trimmedId) {
      return true;
    }

    // 6. Build Updated Result preserving authoritative identity
    const timestamp = new Date().toISOString();
    const updatedReport = {
      ...targetAnalysis.report,
      patientId: reportPatientId,
      visitId: reportVisitId,
      reportId: reportId,
      isApproved: true,
      approvedBy: trimmedId,
      approvalDate: timestamp,
      clinicianNotes: notes !== undefined ? notes : targetAnalysis.report.clinicianNotes,
      analysisInvalidatedAt: undefined,
      invalidationReason: undefined,
      sectionN_clinicianReview: {
        ...targetAnalysis.report.sectionN_clinicianReview,
        status: 'fully_approved' as const,
        reviewingNutritionist: trimmedId,
        reviewDate: timestamp.split('T')[0],
        notes: notes !== undefined ? notes : targetAnalysis.report.sectionN_clinicianReview.notes,
      },
    };

    const updatedP3Context = {
      ...targetAnalysis.p3PlanningContext,
      visitId: reportVisitId,
      clinicalAssessmentApproved: true,
      approvedByClinicianId: trimmedId,
      approvalTimestamp: timestamp,
      analysisInvalidatedAt: undefined,
      invalidationReason: undefined,
    };

    const updatedResult: P2AnalysisResult = {
      ...targetAnalysis,
      patientId: reportPatientId,
      visitId: reportVisitId,
      analysisInvalidatedAt: undefined,
      report: updatedReport,
      p3PlanningContext: updatedP3Context,
      dietPlanningContext: updatedP3Context,
      approvalHistory: [
        ...(targetAnalysis.approvalHistory || []),
        {
          targetId: reportId,
          targetType: 'intervention',
          decision: 'approved',
          clinicianId: trimmedId,
          timestamp,
          reason: notes || 'Clinical assessment report approved',
          evidenceSnapshot: JSON.stringify({ patientId: reportPatientId, visitId: reportVisitId }),
          ruleVersion: '2.0.0'
        }
      ]
    };

    // 7. Persist-First Durable Storage with Verification (Scenario F: Storage Failure)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(targetStorageKey, JSON.stringify(updatedResult));
        const verifiedRaw = window.localStorage.getItem(targetStorageKey);
        if (!verifiedRaw) {
          throw new Error('Verification read-back failed after localStorage write');
        }
        const verifiedObj = JSON.parse(verifiedRaw) as P2AnalysisResult;
        if (
          verifiedObj.patientId !== reportPatientId ||
          verifiedObj.visitId !== reportVisitId ||
          verifiedObj.report?.isApproved !== true ||
          verifiedObj.report?.approvedBy !== trimmedId
        ) {
          throw new Error('Verification read-back validation mismatch');
        }
      }
    } catch (err) {
      console.error('CRITICAL: Failed to persist approved P2 analysis to localStorage:', err);
      // Rollback / do NOT mutate React approval state
      return false;
    }

    // 8. Commit in-memory React state only after storage confirmation
    if (isHistoricalTarget) {
      setPreviewP2AnalysisResult(updatedResult);
      // Active consultation p2AnalysisResult remains strictly untouched
    } else {
      setP2AnalysisResult(updatedResult);
    }
    return true;
  }, [patient, p2AnalysisResult, previewP2AnalysisResult, currentClinicalAssessment, clinicalVisits, currentVisit, selectedReportVisitId]);

  // Pre-index foods in a lookup map for optimal performance
  const foodMap = useMemo(() => new Map(allFoods.map(f => [f.id, f])), []);

  // Reactive Central Clinical Safety Engine
  const clinicalSafetyEvaluation = useMemo(() => {
    return validateInterventionPlan(patient, dietChart, allFoods);
  }, [patient, dietChart]);

  const approveCurrentIntervention = useCallback((clinicianId = 'CLINICIAN_ACTIVE', rationale?: string) => {
    if (!clinicalSafetyEvaluation.isEligibleForApproval) {
      return false;
    }
    const approval: InterventionApproval = {
      intervention_id: `int_${patient.id}_${revisionNumber}`,
      revision_number: revisionNumber,
      approved_by: clinicianId,
      approval_timestamp: new Date().toISOString(),
      status: 'clinician_approved',
      clinical_rationale: rationale,
      is_valid: true
    };
    setInterventionApproval(approval);
    return true;
  }, [clinicalSafetyEvaluation.isEligibleForApproval, patient.id, revisionNumber]);

  const toggleItemLock = useCallback((type: 'food' | 'meal' | 'day' | 'supplement', id: string | number) => {
    setLockState(prev => {
      if (type === 'food') {
        const sid = String(id);
        const exists = prev.locked_food_ids.includes(sid);
        return { ...prev, locked_food_ids: exists ? prev.locked_food_ids.filter(x => x !== sid) : [...prev.locked_food_ids, sid] };
      }
      if (type === 'meal') {
        const sid = String(id);
        const exists = prev.locked_meal_ids.includes(sid);
        return { ...prev, locked_meal_ids: exists ? prev.locked_meal_ids.filter(x => x !== sid) : [...prev.locked_meal_ids, sid] };
      }
      if (type === 'day') {
        const nid = Number(id);
        const exists = prev.locked_days.includes(nid);
        return { ...prev, locked_days: exists ? prev.locked_days.filter(x => x !== nid) : [...prev.locked_days, nid] };
      }
      if (type === 'supplement') {
        const sid = String(id);
        const exists = prev.locked_supplement_ids.includes(sid);
        return { ...prev, locked_supplement_ids: exists ? prev.locked_supplement_ids.filter(x => x !== sid) : [...prev.locked_supplement_ids, sid] };
      }
      return prev;
    });
  }, []);

  const updateFeedingStatus = useCallback((statusUpdates: Partial<FeedingStatus>) => {
    invalidateP2Approval('Feeding status modified');
    setPatient(prev => ({
      ...prev,
      feeding_status: {
        ...(prev.feeding_status || {
          route: 'oral_standard',
          oral_intake_permitted: true,
          requires_specialist_support: false
        }),
        ...statusUpdates
      }
    }));
  }, [invalidateP2Approval]);

  const updateClinicalPathways = useCallback((pathways: ClinicalPathway[]) => {
    invalidateP2Approval('Clinical pathways modified');
    setPatient(prev => ({
      ...prev,
      clinical_pathways: pathways
    }));
  }, [invalidateP2Approval]);

  // Phase R5 + R7: Reactive Nutrition Adjustment Contract (Clinical Intelligence → Diet Engine Bridge)
  const r5NutritionContract = useMemo((): R5NutritionAdjustmentContract => {
    const activeVisitIdForLabs = patient.current_visit_id || currentVisit?.visit_id || currentVisit?.id;
    const labAssessmentKey = patient?.id ? `shuddho_assessment_${patient.id}_${activeVisitIdForLabs || 'default_visit'}` : '';
    const storedAssessmentLabs = labAssessmentKey ? safeStorage.getItem<any>(labAssessmentKey)?.labEntries : undefined;
    return buildR5NutritionAdjustmentContract({
      patient,
      currentVisit,
      r5Pathways,
      r5Medications,
      structuredLabEntries: storedAssessmentLabs
    });
  }, [
    patient.id,
    patient.current_visit_id,
    patient.labs,
    patient.assessment_last_updated_at,
    patient.selected_conditions,
    (patient as any).prescriptions,
    (patient as any).is_on_dialysis,
    patient.age,
    patient.calculated?.bmi,
    patient.fluid_prescription?.total_fluid_limit_ml,
    patient.clinical_safety?.fluid_restriction?.limit_ml,
    (patient.clinical_safety as any)?.sodium_restriction?.is_restricted,
    currentVisit,
    r5Pathways,
    r5Medications
  ]);

  // 1. Reactive Traffic Light Conflict Resolver
  // P0-001: Only confirmed clinical conditions activate disease-specific food rules.
  // Broad functional pathways do NOT automatically assign disease diagnoses!
  const trafficLight = useMemo(() => {
    const activeMeds = allMedicines.filter(m => 
      patient.active_medications.some(userMed => 
        userMed === m.id || 
        userMed.toLowerCase().includes(m.generic_name.toLowerCase()) ||
        m.brand_names_bd.some(b => userMed.toLowerCase().includes(b.toLowerCase()))
      )
    );

    const confirmedConditions = (patient.selected_conditions || []) as ClinicalConditionId[];

    return resolveConflicts(
      allFoods,
      confirmedConditions,
      activeMeds,
      patient.confirmed_allergies,
      patient.clinician_disallowed_foods,
      patient.clinician_disallowed_tags,
      patient.current_phase,
      r5NutritionContract,
      patient.labs
    );
  }, [
    patient.selected_conditions,
    patient.active_medications,
    patient.confirmed_allergies,
    patient.clinician_disallowed_foods,
    patient.clinician_disallowed_tags,
    patient.current_phase,
    r5NutritionContract,
    patient.labs
  ]);

  // 2. Reactive DNI & Timeline
  const dniResult = useMemo(() => {
    return evaluateDNIAndTimeline(patient, allMedicines, allSupplements);
  }, [patient.active_medications, patient.selected_conditions, patient.gut_profile.acid_reflux_hypoacidity, patient.labs.tg_hdl_ratio]);

  // Sync candidate supplements when DNI results update, preserving clinician approvals
  useEffect(() => {
    setCandidateSupplements(prev => {
      const approvalMap = new Map(prev.map(s => [s.id, s.approval_status]));
      const doseMap = new Map(prev.map(s => [s.id, s.prescribed_dose]));
      const notesMap = new Map(prev.map(s => [s.id, s.clinician_notes]));

      return dniResult.candidateSupplements.map(item => ({
        ...item,
        approval_status: approvalMap.get(item.id) || item.approval_status,
        prescribed_dose: doseMap.get(item.id) || item.recommended_dose,
        clinician_notes: notesMap.get(item.id)
      }));
    });
  }, [dniResult.candidateSupplements]);

  // Screen overlaps among currently active candidate supplements
  const overlapWarnings = useMemo(() => {
    return checkSupplementOverlaps(candidateSupplements);
  }, [candidateSupplements]);

  // 3. Initialize Diet Chart on first mount
  useEffect(() => {
    if (dietChart.length === 0 && trafficLight.green.length > 0) {
      const generated = buildAutoScaledDietChart(patient, allFoods, trafficLight);
      setDietChart(generated);
    }
  }, []);

  // 4. Load from LocalStorage on mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('shuddho_lang');
      if (savedLang === 'bn' || savedLang === 'en') setLanguage(savedLang);

      const savedTheme = localStorage.getItem('shuddho_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      } else {
        document.documentElement.classList.add('dark');
      }

      const parsed = safeStorage.getItem<any[]>('shuddho_saved_patients');
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        const migrated = parsed.map(migratePatientRecord);
        setSavedPatients(migrated);

        const activeId = safeStorage.getItem<string>('shuddho_active_patient_id');
        const match = activeId ? migrated.find(p => p.patient.id === activeId) : null;
        if (match) {
          setPatient(match.patient);
          setVisits(match.visits || []);
          setClinicalVisits(match.clinical_visits || []);
          const activeVisit = (match.clinical_visits || []).find(
            v => v.visit_id === match.patient.current_visit_id || v.id === match.patient.current_visit_id
          ) || (match.clinical_visits && match.clinical_visits.length > 0 ? match.clinical_visits[0] : null);
          setCurrentVisit(activeVisit);
          setFollowUpAppointments(match.follow_up_appointments || []);
          setVisitSnapshots(match.visit_snapshots || []);
          setProgressReports(match.progress_reports || []);
          setDietChart(match.current_diet_chart || []);

          // Rehydrate P2 analysis for restored patient and active visit
          const targetVisitId = match.patient.current_visit_id || activeVisit?.visit_id || activeVisit?.id;
          const visitDateClean = (match.patient.visit_date || '').replace(/[^0-9]/g, '');
          const p2Key = `shuddho_p2_analysis_${match.patient.id}_${targetVisitId || `visit_${match.patient.id}_${visitDateClean}`}`;
          try {
            const savedP2 = safeStorage.getItem<P2AnalysisResult>(p2Key);
            if (savedP2) {
              setP2AnalysisResult(savedP2);
            }
          } catch (err) {
            console.warn('Failed to rehydrate P2 analysis on mount:', err);
          }

          // Rehydrate Step 05 Weekly Diet Plan for restored patient and active visit
          const planKey = `shuddho_weekly_plan_${match.patient.id}_${targetVisitId || 'default_visit'}`;
          try {
            const savedPlan = safeStorage.getItem<WeeklyDietPlan>(planKey) || match.weekly_diet_plan || null;
            if (savedPlan) {
              setWeeklyDietPlan(savedPlan);
              if (savedPlan.days && savedPlan.days[0]) {
                setDietChart(savedPlan.days[0].meals);
              }
            }
          } catch (err) {
            console.warn('Failed to rehydrate weekly diet plan on mount:', err);
          }
        }
      }
    } catch (e) {
      console.warn("LocalStorage access issue:", e);
    }
  }, []);

  // Update theme class on HTML element
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('shuddho_theme', theme);
    } catch (e) {}
  }, [theme]);

  // Save language
  useEffect(() => {
    try {
      localStorage.setItem('shuddho_lang', language);
    } catch (e) {}
  }, [language]);

  // Helper to recompute anthropometrics & labs synchronously
  const applyCalculations = useCallback((p: PatientProfile): PatientProfile => {
    const calculated = calculateAnthropometrics(
      p.age,
      p.gender,
      p.height_cm,
      p.weight_kg,
      p.waist_cm,
      p.activity_level,
      p.selected_conditions,
      p.population_group,
      p.trimester,
      p.bmr_floor_strategy,
      p.custom_calorie_floor
    );
    const labs = analyzeFunctionalLabs(p.labs, p.gender === 'unspecified' ? undefined : p.gender);
    return {
      ...p,
      calculated,
      labs
    };
  }, []);

  // Patient Updates with Assessment Dirty State Tracking & P2 Approval Invalidation
  const updatePatient = useCallback((updates: Partial<PatientProfile>) => {
    invalidateP2Approval('Patient demographics or anthropometrics modified');
    setPatient(prev => {
      const merged = applyCalculations({ ...prev, ...updates });
      return {
        ...merged,
        is_diet_plan_dirty: true,
        assessment_last_updated_at: new Date().toISOString()
      };
    });
  }, [applyCalculations, invalidateP2Approval]);

  const updateLabs = useCallback((labUpdates: Partial<PatientProfile['labs']>) => {
    const sanitizedUpdates: Record<string, any> = {};
    for (const [k, v] of Object.entries(labUpdates || {})) {
      if (typeof v === 'number') {
        sanitizedUpdates[k] = Number.isFinite(v) && v >= 0 ? v : undefined;
      } else {
        sanitizedUpdates[k] = v;
      }
    }
    invalidateP2Approval('Laboratory biomarkers updated');
    setPatient(prev => {
      const merged = applyCalculations({
        ...prev,
        labs: { ...prev.labs, ...sanitizedUpdates }
      });
      return {
        ...merged,
        is_diet_plan_dirty: true,
        assessment_last_updated_at: new Date().toISOString()
      };
    });

    // R7-D: Safety-relevant laboratory updates invalidate prior approved R4 supplement/lifestyle protocols
    setR4Protocol(prevProto => {
      if (prevProto && (prevProto.is_approved || prevProto.status === 'active')) {
        const invalidatedProto: R4ProtocolStudioData = {
          ...prevProto,
          is_approved: false,
          status: 'draft',
          approved_by: undefined,
          approved_at: undefined,
          invalidated_at: new Date().toISOString(),
          previous_approved_version: prevProto.version,
          approval_notes:
            (prevProto.approval_notes ? prevProto.approval_notes + ' | ' : '') +
            'Invalidated due to laboratory biomarker modification; requires clinician re-evaluation.',
          approval_metadata: undefined
        } as R4ProtocolStudioData;
        getPracticeRepository().saveLifestylePlan(invalidatedProto).catch(() => {});
        return invalidatedProto;
      }
      return prevProto;
    });
  }, [applyCalculations, invalidateP2Approval]);

  const updateGutProfile = useCallback((gutUpdates: Partial<PatientProfile['gut_profile']>) => {
    invalidateP2Approval('Gastrointestinal profile modified');
    setPatient(prev => ({
      ...prev,
      gut_profile: { ...prev.gut_profile, ...gutUpdates },
      is_diet_plan_dirty: true,
      assessment_last_updated_at: new Date().toISOString()
    }));
  }, [invalidateP2Approval]);

  const toggleCondition = useCallback((id: ClinicalConditionId) => {
    invalidateP2Approval(`Clinical condition toggled: ${id}`);
    setPatient(prev => {
      const exists = prev.selected_conditions.includes(id);
      const updatedConditions = exists 
        ? prev.selected_conditions.filter(c => c !== id)
        : [...prev.selected_conditions, id];
      const merged = applyCalculations({ ...prev, selected_conditions: updatedConditions });
      return {
        ...merged,
        is_diet_plan_dirty: true,
        assessment_last_updated_at: new Date().toISOString()
      };
    });
  }, [applyCalculations, invalidateP2Approval]);

  const toggleMedication = useCallback((id: string) => {
    invalidateP2Approval(`Active medication changed: ${id}`);
    setPatient(prev => {
      const exists = prev.active_medications.includes(id);
      const updated = exists 
        ? prev.active_medications.filter(m => m !== id)
        : [...prev.active_medications, id];
      return {
        ...prev,
        active_medications: updated,
        is_diet_plan_dirty: true,
        assessment_last_updated_at: new Date().toISOString()
      };
    });
  }, [invalidateP2Approval]);

  const addConfirmedAllergy = useCallback((allergy: string) => {
    const trimmed = allergy.trim().toLowerCase();
    if (!trimmed) return;
    invalidateP2Approval(`Confirmed allergy added: ${trimmed}`);
    setPatient(prev => {
      if (prev.confirmed_allergies.includes(trimmed)) return prev;
      return {
        ...prev,
        confirmed_allergies: [...prev.confirmed_allergies, trimmed],
        is_diet_plan_dirty: true,
        assessment_last_updated_at: new Date().toISOString()
      };
    });
  }, [invalidateP2Approval]);

  const removeConfirmedAllergy = useCallback((allergy: string) => {
    invalidateP2Approval(`Confirmed allergy removed: ${allergy}`);
    setPatient(prev => ({
      ...prev,
      confirmed_allergies: prev.confirmed_allergies.filter(a => a !== allergy),
      is_diet_plan_dirty: true,
      assessment_last_updated_at: new Date().toISOString()
    }));
  }, [invalidateP2Approval]);

  const addClinicianDisallowedFood = useCallback((foodIdOrKeyword: string) => {
    const trimmed = foodIdOrKeyword.trim().toLowerCase();
    if (!trimmed) return;
    invalidateP2Approval(`Disallowed food added: ${trimmed}`);
    setPatient(prev => {
      if (prev.clinician_disallowed_foods.includes(trimmed)) return prev;
      return {
        ...prev,
        clinician_disallowed_foods: [...prev.clinician_disallowed_foods, trimmed],
        is_diet_plan_dirty: true,
        assessment_last_updated_at: new Date().toISOString()
      };
    });
  }, [invalidateP2Approval]);

  const removeClinicianDisallowedFood = useCallback((foodIdOrKeyword: string) => {
    invalidateP2Approval(`Disallowed food removed: ${foodIdOrKeyword}`);
    setPatient(prev => ({
      ...prev,
      clinician_disallowed_foods: prev.clinician_disallowed_foods.filter(f => f !== foodIdOrKeyword),
      is_diet_plan_dirty: true,
      assessment_last_updated_at: new Date().toISOString()
    }));
  }, [invalidateP2Approval]);

  // Candidate Supplement Approval Actions
  const approveCandidateSupplement = useCallback((id: string, dose?: string, notes?: string) => {
    setCandidateSupplements(prev => prev.map(s => {
      if (s.id !== id) return s;
      return {
        ...s,
        approval_status: 'clinician_approved',
        prescribed_dose: dose || s.prescribed_dose || s.recommended_dose,
        clinician_notes: notes || s.clinician_notes
      };
    }));
  }, []);

  const rejectCandidateSupplement = useCallback((id: string) => {
    setCandidateSupplements(prev => prev.map(s => {
      if (s.id !== id) return s;
      return {
        ...s,
        approval_status: 'rejected'
      };
    }));
  }, []);

  // Diet Plan Actions
  const isDietPlanDirty = Boolean(patient.is_diet_plan_dirty);

  const dismissDirtyWarning = useCallback(() => {
    const hasRed = dietChart.some(m => m.items.some(i => i.traffic_status === 'RED'));
    if (hasRed) {
      // Cannot dismiss warning when hard RED contraindications remain in the active chart
      return;
    }
    setPatient(prev => ({ ...prev, is_diet_plan_dirty: false }));
  }, [dietChart]);

  const recalculateDietPlan = useCallback((preserveManualEdits: boolean = false) => {
    if (preserveManualEdits) {
      // Keep existing meals, but update items against current traffic light to highlight any red/yellow items
      const redMap = new Map(trafficLight.red.map(r => [r.id, r]));
      let hasRedContraindications = false;

      setDietChart(prev => prev.map(meal => {
        const updatedItems = meal.items.map(item => {
          const redMatch = redMap.get(item.food_id);
          if (redMatch) {
            hasRedContraindications = true;
            return {
              ...item,
              traffic_status: 'RED' as const,
              contraindicated_reasons: redMatch.reasons.map(r => r.note_en),
              contraindicated_reasons_bn: redMatch.reasons.map(r => r.note_bn)
            };
          }
          const isGreen = trafficLight.green.some(g => g.id === item.food_id);
          return {
            ...item,
            traffic_status: isGreen ? ('GREEN' as const) : ('YELLOW' as const),
            contraindicated_reasons: undefined,
            contraindicated_reasons_bn: undefined
          };
        });

        // Recalculate nutritional totals after modification
        const meal_calories = updatedItems.reduce((sum, i) => sum + i.kcal, 0);
        const meal_protein_g = Math.round(updatedItems.reduce((sum, i) => sum + i.protein_g, 0) * 10) / 10;
        const meal_carbs_g = Math.round(updatedItems.reduce((sum, i) => sum + i.carbs_g, 0) * 10) / 10;
        const meal_fat_g = Math.round(updatedItems.reduce((sum, i) => sum + i.fat_g, 0) * 10) / 10;

        return {
          ...meal,
          items: updatedItems,
          meal_calories,
          meal_protein_g,
          meal_carbs_g,
          meal_fat_g
        };
      }));

      setPatient(prev => ({
        ...prev,
        is_diet_plan_dirty: hasRedContraindications,
        has_unresolved_diet_contraindications: hasRedContraindications,
        diet_plan_generated_at: new Date().toISOString(),
        manual_edits_preserved: preserveManualEdits
      }));
    } else {
      const fresh = buildAutoScaledDietChart(patient, allFoods, trafficLight);
      setDietChart(fresh);
      setPatient(prev => ({
        ...prev,
        is_diet_plan_dirty: false,
        has_unresolved_diet_contraindications: false,
        diet_plan_generated_at: new Date().toISOString(),
        manual_edits_preserved: false
      }));
    }

    if (weeklyDietPlan && (weeklyDietPlan.status === 'approved' || weeklyDietPlan.is_approved)) {
      const invalidated = invalidateWeeklyPlanApproval(weeklyDietPlan, 'Patient profile or nutrition targets updated');
      setWeeklyDietPlan(invalidated);
      persistWeeklyPlan(invalidated);
    }
  }, [patient, trafficLight, weeklyDietPlan, persistWeeklyPlan]);

  const recalculateDayPlanSummary = useCallback((day: DayPlan, patientProfile: PatientProfile, targetMacros?: { calories: number; protein_g: number; carbs_g: number; fat_g: number }): DayPlan => {
    const macros = targetMacros || weeklyDietPlan?.target_macros || {
      calories: patientProfile.calculated.target_calories || 0,
      protein_g: patientProfile.calculated.target_protein_g || 0,
      carbs_g: patientProfile.calculated.target_carbs_g || 0,
      fat_g: patientProfile.calculated.target_fat_g || 0
    };
    return recalculateDayPlan(day, macros, patientProfile, allFoods, p2AnalysisResult?.p3PlanningContext);
  }, [weeklyDietPlan?.target_macros, allFoods, p2AnalysisResult?.p3PlanningContext]);

// P0-004: Typed minimal planning context fallback without synthetic clinical assumptions
function createTypedPlanningContextFallback(
  patient: PatientProfile,
  targetVisitId?: string,
  r5Contract?: R5NutritionAdjustmentContract
): P3NutritionPlanningContext {
  const feedingStatus = patient.feeding_status;
  const rawRoute = String(feedingStatus?.route || patient.clinical_safety?.feeding_route || '').toLowerCase();

  let routeName: string;
  let oralPermitted: boolean;
  let specialistRequired: boolean;

  if (rawRoute.includes('npo') || rawRoute === 'npo_nil_per_os' || feedingStatus?.oral_intake_permitted === false) {
    routeName = 'npo_nil_per_os';
    oralPermitted = false;
    specialistRequired = true;
  } else if (rawRoute.includes('enteral') || rawRoute.includes('parenteral') || rawRoute.includes('peg') || rawRoute.includes('nasogastric') || rawRoute.includes('tpn')) {
    routeName = feedingStatus?.route || 'enteral_tube_nasogastric';
    oralPermitted = false;
    specialistRequired = true;
  } else if (feedingStatus?.oral_intake_permitted === true || rawRoute.includes('oral')) {
    routeName = feedingStatus?.route || 'oral_standard';
    oralPermitted = true;
    specialistRequired = Boolean(feedingStatus?.requires_specialist_support);
  } else {
    // Unknown feeding status: do NOT invent oral intake!
    routeName = 'unknown';
    oralPermitted = false;
    specialistRequired = true;
  }

  return {
    patientId: patient.id,
    visitId: targetVisitId || patient.current_visit_id || '',
    assessmentId: '', // Never fabricate 'asm_current'
    assessmentVersion: '',
    clinicalAssessmentApproved: false,
    confirmedAllergies: patient.confirmed_allergies || [],
    allergyReconciliation: patient.allergy_reconciliation,
    medicationReconciliation: patient.medication_reconciliation,
    feedingRoute: {
      route: routeName,
      oral_intake_permitted: oralPermitted,
      requires_specialist_support: specialistRequired
    },
    hardRestrictions: [],
    prescribedFluidLimit_mL: r5Contract?.nutrient_constraints?.fluid_ml_max,
    prescribedSodiumLimit_mg: r5Contract?.nutrient_constraints?.sodium_mg_max,
    prescribedPotassiumLimit_mg: r5Contract?.nutrient_constraints?.potassium_mg_max,
    prescribedProteinCap_g: r5Contract?.nutrient_constraints?.protein_g_per_kg 
      ? Math.round(r5Contract.nutrient_constraints.protein_g_per_kg * (patient.weight_kg || 60)) 
      : undefined,
    prescriptions: {
      sodium: { nutrient: 'sodium', isRestricted: Boolean(r5Contract?.nutrient_constraints?.sodium_mg_max), hasConfirmedLimit: Boolean(r5Contract?.nutrient_constraints?.sodium_mg_max), numericalLimit: r5Contract?.nutrient_constraints?.sodium_mg_max, unit: 'mg/day', source: 'patient_profile', requiresClarification: false },
      potassium: { nutrient: 'potassium', isRestricted: Boolean(r5Contract?.nutrient_constraints?.potassium_mg_max), hasConfirmedLimit: Boolean(r5Contract?.nutrient_constraints?.potassium_mg_max), numericalLimit: r5Contract?.nutrient_constraints?.potassium_mg_max, unit: 'mg/day', source: 'patient_profile', requiresClarification: false },
      protein: { nutrient: 'protein', isRestricted: Boolean(r5Contract?.nutrient_constraints?.protein_g_per_kg), hasConfirmedLimit: Boolean(r5Contract?.nutrient_constraints?.protein_g_per_kg), numericalLimit: r5Contract?.nutrient_constraints?.protein_g_per_kg, unit: 'g/kg/day', source: 'patient_profile', requiresClarification: false },
      fluid: { nutrient: 'fluid', isRestricted: Boolean(r5Contract?.nutrient_constraints?.fluid_ml_max), hasConfirmedLimit: Boolean(r5Contract?.nutrient_constraints?.fluid_ml_max), numericalLimit: r5Contract?.nutrient_constraints?.fluid_ml_max, unit: 'mL/day', source: 'patient_profile', requiresClarification: false }
    },
    hasSuspectedRenalAbnormality: Boolean(
      (patient.labs as any)?.egfr && (patient.labs as any).egfr < 60 ||
      (patient.labs as any)?.serum_creatinine && (patient.labs as any).serum_creatinine > 1.2
    ),
    hasConfirmedCkdDiagnosis: Boolean(
      patient.selected_conditions?.includes('ckd_stage_1_3b' as any) ||
      patient.selected_conditions?.includes('ckd_dialysis' as any) ||
      patient.selected_conditions?.includes('hypertension_ckd' as any)
    ),
    energyTargetCalories: patient.calculated?.target_calories || 0,
    proteinTargetGrams: patient.calculated?.target_protein_g || 0,
    nutritionalTargets: [],
    carbohydrateConsiderations: [],
    medicationPrecautions: [],
    clinicalSafetyFindings: oralPermitted ? [] : ['Oral nutrition unverified or contraindicated per feeding status assessment'],
    functionalNutritionPriorities: [],
    r5NutritionConstraints: r5Contract,
    dietaryFrequencyFindings: {
      foodGroupFrequency: {},
      summaryInsights_en: [],
      summaryInsights_bn: [],
      riskFlags: [],
      protectiveFactors: []
    } as any,
    ayurvedicContext: {
      primaryPrakriti: ((patient as any).ayurvedic_profile?.prakriti as any) || 'unassessed',
      currentVikritiImbalances: [],
      recommendedTastes: [],
      tastesToModerate: []
    } as any,
    approvedInterventionGoals: [],
    generatedAt: new Date().toISOString(),
    lifeStage: patient.population_group || 'not_yet_assessed',
    medicationConstraints: [],
    foodPreferences: {},
    currentCarePhase: patient.current_phase || 1,
    clinicianApprovedHypotheses: [],
    unconfirmedHypotheses: []
  };
}

  const generateWeeklyPlan = useCallback((forceRegenerate: boolean = false): WeeklyDietPlan | null => {
    if (!patient?.id) return null;
    const targetVisitId = patient.current_visit_id || currentVisit?.visit_id || currentVisit?.id || 'default_visit';
    const planKey = `shuddho_weekly_plan_${patient.id}_${targetVisitId}`;

    if (!forceRegenerate && weeklyDietPlan && weeklyDietPlan.patient_id === patient.id && weeklyDietPlan.visit_id === targetVisitId) {
      return weeklyDietPlan;
    }

    // P0-004 & P1-002: Ensure typed planning context and R5 Nutrition Contract ALWAYS reach Diet Engine
    const effectiveP3Context: P3NutritionPlanningContext = p2AnalysisResult?.p3PlanningContext
      ? { ...p2AnalysisResult.p3PlanningContext, r5NutritionConstraints: r5NutritionContract }
      : createTypedPlanningContextFallback(patient, targetVisitId, r5NutritionContract);

    const plan = generateWeeklyDietPlan(
      patient,
      allFoods,
      trafficLight,
      effectiveP3Context,
      forceRegenerate ? (weeklyDietPlan || null) : null,
      { preserveLocks: true, forceRegenerate }
    );

    setWeeklyDietPlan(plan);
    if (plan.days && plan.days.length > 0 && plan.days[0].meals) {
      setDietChart(plan.days[0].meals);
    }
    persistWeeklyPlan(plan);
    return plan;
  }, [patient, currentVisit, weeklyDietPlan, p2AnalysisResult?.p3PlanningContext, trafficLight, allFoods, persistWeeklyPlan, r5NutritionContract]);

  const regenerateDay = useCallback((dayNumber: number, preserveLocks: boolean = true): WeeklyDietPlan | null => {
    if (!weeklyDietPlan || !patient?.id) return null;
    const effectiveP3Context: P3NutritionPlanningContext = p2AnalysisResult?.p3PlanningContext
      ? { ...p2AnalysisResult.p3PlanningContext, r5NutritionConstraints: r5NutritionContract }
      : createTypedPlanningContextFallback(patient, currentVisit?.visit_id || currentVisit?.id, r5NutritionContract);
    const updated = regenerateDayInWeeklyPlan(
      dayNumber,
      weeklyDietPlan,
      patient,
      allFoods,
      trafficLight,
      effectiveP3Context,
      preserveLocks
    );
    setWeeklyDietPlan(updated);
    if (dayNumber === 1 && updated.days && updated.days[0]) {
      setDietChart(updated.days[0].meals);
    }
    persistWeeklyPlan(updated);
    return updated;
  }, [weeklyDietPlan, patient, p2AnalysisResult?.p3PlanningContext, trafficLight, allFoods, persistWeeklyPlan]);

  const updateDayMealItemRawGrams = useCallback((dayNumber: number, mealId: string, itemId: string, rawGrams: number) => {
    const validation = validatePortionInput(rawGrams);
    if (!validation.is_valid) return;
    const sanitizedGrams = validation.sanitized_grams;

    setWeeklyDietPlan(prev => {
      if (!prev) return prev;
      const greenIds = new Set(trafficLight.green.map(g => g.id));
      const redIds = new Set(trafficLight.red.map(r => r.id));
      const yellowIds = new Set(trafficLight.yellow.map(y => y.id));

      const updatedDays = prev.days.map(day => {
        if (day.day_number !== dayNumber) return day;
        const updatedMeals = day.meals.map(meal => {
          if (meal.id !== mealId) return meal;
          const updatedItems = meal.items.map(item => {
            if (item.id !== itemId) return item;
            const food = foodMap.get(item.food_id);
            const ratio = food ? food.raw_to_cooked_ratio : 1;
            const per100 = food ? food.per_100g : {
              kcal: (item.kcal / (item.raw_weight_g || 100)) * 100,
              protein_g: (item.protein_g / (item.raw_weight_g || 100)) * 100,
              carbs_g: (item.carbs_g / (item.raw_weight_g || 100)) * 100,
              fat_g: (item.fat_g / (item.raw_weight_g || 100)) * 100,
              fiber_g: (item.fiber_g / (item.raw_weight_g || 100)) * 100
            };
            const cookedG = Math.round(sanitizedGrams * ratio);
            const display = food ? getCookedDisplay(food, sanitizedGrams, cookedG) : { bn: `${cookedG} গ্রাম`, en: `${cookedG}g` };
            const mult = sanitizedGrams / 100;
            return {
              ...item,
              raw_weight_g: sanitizedGrams,
              cooked_weight_g: cookedG,
              cooked_display_bn: display.bn,
              cooked_display_en: display.en,
              kcal: Math.round((per100.kcal ?? 0) * mult),
              protein_g: Math.round((per100.protein_g ?? 0) * mult * 10) / 10,
              carbs_g: Math.round((per100.carbs_g ?? 0) * mult * 10) / 10,
              fat_g: Math.round((per100.fat_g ?? 0) * mult * 10) / 10,
              fiber_g: Math.round((per100.fiber_g ?? 0) * mult * 10) / 10,
              alternatives: food ? generateExchangesForFood(food, sanitizedGrams, allFoods, greenIds, redIds, yellowIds) : item.alternatives
            };
          });

          return {
            ...meal,
            items: updatedItems,
            ...calculateMealTotals(updatedItems, allFoods)
          };
        });

        return recalculateDayPlanSummary({ ...day, meals: updatedMeals }, patient, prev.target_macros);
      });

      const updatedPlan: WeeklyDietPlan = {
        ...prev,
        days: updatedDays,
        updated_at: new Date().toISOString()
      };

      const safetyEval = evaluateWeeklyPlanClinicalSafety(patient, updatedPlan, allFoods, p2AnalysisResult?.p3PlanningContext);
      updatedPlan.overall_safety_status = safetyEval.overall_decision;
      updatedPlan.unresolved_hard_stops = safetyEval.unresolved_hard_stops.length > 0 ? safetyEval.unresolved_hard_stops : undefined;

      const invalidated = invalidateWeeklyPlanApproval(updatedPlan, 'Food quantity modified');
      if (dayNumber === 1 && updatedDays[0]) {
        setDietChart(updatedDays[0].meals);
      }
      persistWeeklyPlan(invalidated);
      return invalidated;
    });

    setPatient(prev => ({
      ...prev,
      is_diet_plan_dirty: true,
      manual_edits_preserved: true
    }));
  }, [foodMap, patient, trafficLight, allFoods, recalculateDayPlanSummary, p2AnalysisResult?.p3PlanningContext, persistWeeklyPlan]);

  const swapDayMealItemAlternative = useCallback((dayNumber: number, mealId: string, itemId: string, alt: FoodExchangeItem) => {
    const food = foodMap.get(alt.food_id);
    if (!food) return;

    setWeeklyDietPlan(prev => {
      if (!prev) return prev;
      const updatedDays = prev.days.map(day => {
        if (day.day_number !== dayNumber) return day;
        const updatedMeals = day.meals.map(meal => {
          if (meal.id !== mealId) return meal;
          const updatedItems = meal.items.map(item => {
            if (item.id !== itemId) return item;
            const rawG = alt.raw_weight_g;
            const cookedG = Math.round(rawG * food.raw_to_cooked_ratio);
            const display = getCookedDisplay(food, rawG, cookedG);
            const mult = rawG / 100;
            return {
              id: item.id,
              food_id: food.id,
              food_name_bn: food.name_bn,
              food_name_en: food.name_en,
              category: food.category,
              raw_weight_g: rawG,
              cooked_weight_g: cookedG,
              cooked_display_bn: display.bn,
              cooked_display_en: display.en,
              kcal: Math.round((food.per_100g.kcal ?? 0) * mult),
              protein_g: Math.round((food.per_100g.protein_g ?? 0) * mult * 10) / 10,
              carbs_g: Math.round((food.per_100g.carbs_g ?? 0) * mult * 10) / 10,
              fat_g: Math.round((food.per_100g.fat_g ?? 0) * mult * 10) / 10,
              fiber_g: Math.round((food.per_100g.fiber_g ?? 0) * mult * 10) / 10,
              prep_note_bn: food.prep_note_bn,
              prep_note_en: food.prep_note_en,
              alternatives: generateExchangesForFood(
                food, 
                rawG, 
                allFoods, 
                new Set(trafficLight.green.map(g => g.id)),
                new Set(trafficLight.red.map(r => r.id)),
                new Set(trafficLight.yellow.map(y => y.id))
              ),
              traffic_status: alt.traffic_status,
              is_locked: item.is_locked
            };
          });

          return {
            ...meal,
            items: updatedItems,
            ...calculateMealTotals(updatedItems, allFoods)
          };
        });

        return recalculateDayPlanSummary({ ...day, meals: updatedMeals }, patient, prev.target_macros);
      });

      const updatedPlan: WeeklyDietPlan = {
        ...prev,
        days: updatedDays,
        updated_at: new Date().toISOString()
      };

      const safetyEval = evaluateWeeklyPlanClinicalSafety(patient, updatedPlan, allFoods, p2AnalysisResult?.p3PlanningContext);
      updatedPlan.overall_safety_status = safetyEval.overall_decision;
      updatedPlan.unresolved_hard_stops = safetyEval.unresolved_hard_stops.length > 0 ? safetyEval.unresolved_hard_stops : undefined;

      const invalidated = invalidateWeeklyPlanApproval(updatedPlan, 'Food item swapped with alternative');
      if (dayNumber === 1 && updatedDays[0]) {
        setDietChart(updatedDays[0].meals);
      }
      persistWeeklyPlan(invalidated);
      return invalidated;
    });

    setPatient(prev => ({
      ...prev,
      is_diet_plan_dirty: true,
      manual_edits_preserved: true
    }));
  }, [foodMap, allFoods, trafficLight, patient, recalculateDayPlanSummary, p2AnalysisResult?.p3PlanningContext, persistWeeklyPlan]);

  const removeDayMealItem = useCallback((dayNumber: number, mealId: string, itemId: string) => {
    setWeeklyDietPlan(prev => {
      if (!prev) return prev;
      const updatedDays = prev.days.map(day => {
        if (day.day_number !== dayNumber) return day;
        const updatedMeals = day.meals.map(meal => {
          if (meal.id !== mealId) return meal;
          const updatedItems = meal.items.filter(i => i.id !== itemId);
          return {
            ...meal,
            items: updatedItems,
            ...calculateMealTotals(updatedItems, allFoods)
          };
        });

        return recalculateDayPlanSummary({ ...day, meals: updatedMeals }, patient, prev.target_macros);
      });

      const updatedPlan: WeeklyDietPlan = {
        ...prev,
        days: updatedDays,
        updated_at: new Date().toISOString()
      };

      const safetyEval = evaluateWeeklyPlanClinicalSafety(patient, updatedPlan, allFoods, p2AnalysisResult?.p3PlanningContext);
      updatedPlan.overall_safety_status = safetyEval.overall_decision;
      updatedPlan.unresolved_hard_stops = safetyEval.unresolved_hard_stops.length > 0 ? safetyEval.unresolved_hard_stops : undefined;

      const invalidated = invalidateWeeklyPlanApproval(updatedPlan, 'Food item removed');
      if (dayNumber === 1 && updatedDays[0]) {
        setDietChart(updatedDays[0].meals);
      }
      persistWeeklyPlan(invalidated);
      return invalidated;
    });

    setPatient(prev => ({
      ...prev,
      is_diet_plan_dirty: true,
      manual_edits_preserved: true
    }));
  }, [allFoods, patient, recalculateDayPlanSummary, p2AnalysisResult?.p3PlanningContext, persistWeeklyPlan]);

  const addDayMealItem = useCallback((dayNumber: number, mealId: string, foodId: string, rawGrams: number = 100) => {
    if (typeof rawGrams !== 'number' || isNaN(rawGrams) || rawGrams <= 0) return;

    const food = foodMap.get(foodId);
    if (!food) return;

    if (trafficLight.red.some(r => r.id === foodId)) {
      alert(language === 'bn' 
        ? "সতর্কতা: এই খাদ্যটি রোগীর স্বাস্থ্য অবস্থা বা অ্যালার্জির কারণে লাল তালিকায় নিষিদ্ধ। এটি যোগ করা সম্ভব নয়।"
        : "Safety Alert: This food is strictly contraindicated (RED) due to patient conditions or allergies."
      );
      return;
    }

    const cookedG = Math.round(rawGrams * food.raw_to_cooked_ratio);
    const display = getCookedDisplay(food, rawGrams, cookedG);
    const mult = rawGrams / 100;
    const status: 'GREEN' | 'YELLOW' = trafficLight.green.some(g => g.id === foodId) ? 'GREEN' : 'YELLOW';

    const newItem: DietChartMealItem = {
      id: `item_${food.id}_${Date.now()}`,
      food_id: food.id,
      food_name_bn: food.name_bn,
      food_name_en: food.name_en,
      category: food.category,
      raw_weight_g: rawGrams,
      cooked_weight_g: cookedG,
      cooked_display_bn: display.bn,
      cooked_display_en: display.en,
      kcal: Math.round((food.per_100g.kcal ?? 0) * mult),
      protein_g: Math.round((food.per_100g.protein_g ?? 0) * mult * 10) / 10,
      carbs_g: Math.round((food.per_100g.carbs_g ?? 0) * mult * 10) / 10,
      fat_g: Math.round((food.per_100g.fat_g ?? 0) * mult * 10) / 10,
      fiber_g: Math.round((food.per_100g.fiber_g ?? 0) * mult * 10) / 10,
      prep_note_bn: food.prep_note_bn,
      prep_note_en: food.prep_note_en,
      alternatives: generateExchangesForFood(
        food, 
        rawGrams, 
        allFoods, 
        new Set(trafficLight.green.map(g => g.id)),
        new Set(trafficLight.red.map(r => r.id)),
        new Set(trafficLight.yellow.map(y => y.id))
      ),
      traffic_status: status
    };

    setWeeklyDietPlan(prev => {
      if (!prev) return prev;
      const updatedDays = prev.days.map(day => {
        if (day.day_number !== dayNumber) return day;
        const updatedMeals = day.meals.map(meal => {
          if (meal.id !== mealId) return meal;
          const updatedItems = [...meal.items, newItem];
          return {
            ...meal,
            items: updatedItems,
            ...calculateMealTotals(updatedItems, allFoods)
          };
        });

        return recalculateDayPlanSummary({ ...day, meals: updatedMeals }, patient, prev.target_macros);
      });

      const updatedPlan: WeeklyDietPlan = {
        ...prev,
        days: updatedDays,
        updated_at: new Date().toISOString()
      };

      const safetyEval = evaluateWeeklyPlanClinicalSafety(patient, updatedPlan, allFoods, p2AnalysisResult?.p3PlanningContext);
      updatedPlan.overall_safety_status = safetyEval.overall_decision;
      updatedPlan.unresolved_hard_stops = safetyEval.unresolved_hard_stops.length > 0 ? safetyEval.unresolved_hard_stops : undefined;

      const invalidated = invalidateWeeklyPlanApproval(updatedPlan, 'Food item added');
      if (dayNumber === 1 && updatedDays[0]) {
        setDietChart(updatedDays[0].meals);
      }
      persistWeeklyPlan(invalidated);
      return invalidated;
    });

    setPatient(prev => ({
      ...prev,
      is_diet_plan_dirty: true,
      manual_edits_preserved: true
    }));
  }, [foodMap, trafficLight, language, allFoods, patient, recalculateDayPlanSummary, p2AnalysisResult?.p3PlanningContext, persistWeeklyPlan]);

  const toggleDayLock = useCallback((dayNumber: number) => {
    setWeeklyDietPlan(prev => {
      if (!prev) return prev;
      const updatedDays = prev.days.map(day => {
        if (day.day_number !== dayNumber) return day;
        return { ...day, is_locked: !day.is_locked };
      });
      const updatedPlan: WeeklyDietPlan = { ...prev, days: updatedDays };
      persistWeeklyPlan(updatedPlan);
      return updatedPlan;
    });
    toggleItemLock('day', dayNumber);
  }, [toggleItemLock, persistWeeklyPlan]);

  const toggleMealLockInDay = useCallback((dayNumber: number, mealId: string) => {
    setWeeklyDietPlan(prev => {
      if (!prev) return prev;
      const updatedDays = prev.days.map(day => {
        if (day.day_number !== dayNumber) return day;
        const updatedMeals = day.meals.map(meal => {
          if (meal.id !== mealId) return meal;
          return { ...meal, is_locked: !meal.is_locked };
        });
        return { ...day, meals: updatedMeals };
      });
      const updatedPlan: WeeklyDietPlan = { ...prev, days: updatedDays };
      persistWeeklyPlan(updatedPlan);
      return updatedPlan;
    });
    toggleItemLock('meal', mealId);
  }, [toggleItemLock, persistWeeklyPlan]);

  const toggleItemLockInDay = useCallback((dayNumber: number, itemId: string) => {
    setWeeklyDietPlan(prev => {
      if (!prev) return prev;
      const updatedDays = prev.days.map(day => {
        if (day.day_number !== dayNumber) return day;
        const updatedMeals = day.meals.map(meal => {
          const updatedItems = meal.items.map(item => {
            if (item.id !== itemId) return item;
            return { ...item, is_locked: !item.is_locked };
          });
          return { ...meal, items: updatedItems };
        });
        return { ...day, meals: updatedMeals };
      });
      const updatedPlan: WeeklyDietPlan = { ...prev, days: updatedDays };
      persistWeeklyPlan(updatedPlan);
      return updatedPlan;
    });
    toggleItemLock('food', itemId);
  }, [toggleItemLock, persistWeeklyPlan]);

  const copyDayPlan = useCallback((sourceDayNumber: number, targetDayNumber: number): boolean => {
    if (!weeklyDietPlan || !patient?.id) return false;
    const updated = copyDayInWeeklyPlan(
      sourceDayNumber,
      targetDayNumber,
      weeklyDietPlan,
      patient,
      allFoods,
      trafficLight
    );
    const safetyEval = evaluateWeeklyPlanClinicalSafety(patient, updated, allFoods, p2AnalysisResult?.p3PlanningContext);
    updated.overall_safety_status = safetyEval.overall_decision;
    updated.unresolved_hard_stops = safetyEval.unresolved_hard_stops.length > 0 ? safetyEval.unresolved_hard_stops : undefined;
    setWeeklyDietPlan(updated);
    if (targetDayNumber === 1 && updated.days && updated.days[0]) {
      setDietChart(updated.days[0].meals);
    }
    persistWeeklyPlan(updated);
    return true;
  }, [weeklyDietPlan, patient, allFoods, trafficLight, p2AnalysisResult?.p3PlanningContext, persistWeeklyPlan]);

  const approveWeeklyPlan = useCallback((clinicianId: string, notes?: string): boolean => {
    // Step A — Clinical Governance & Identity Verification
    // 1. Patient & Visit Identity
    if (!patient || !patient.id) {
      const err = 'No active patient selected.';
      console.warn(`[Weekly Diet Plan Approval Blocked] ${err}`);
      setWeeklyPlanApprovalError(err);
      return false;
    }

    const activeVisitId = currentVisit?.visit_id || currentVisit?.id || patient.current_visit_id;
    if (!activeVisitId) {
      const err = 'No active clinical visit selected.';
      console.warn(`[Weekly Diet Plan Approval Blocked] ${err}`);
      setWeeklyPlanApprovalError(err);
      return false;
    }

    if (!weeklyDietPlan || weeklyDietPlan.patient_id !== patient.id) {
      const err = 'Weekly diet plan does not belong to active patient.';
      console.warn(`[Weekly Diet Plan Approval Blocked] ${err}`);
      setWeeklyPlanApprovalError(err);
      return false;
    }

    // 2. Clinician Authorization
    if (!validateClinicianCredentials(clinicianId)) {
      const err = 'Invalid licensed clinician credentials. Sign-off requires an authorized clinician with valid license/credentials.';
      console.warn(`[Weekly Diet Plan Approval Blocked] ${err}`);
      setWeeklyPlanApprovalError(err);
      return false;
    }

    if (currentClinician && currentClinician.role === 'ASSISTANT_DIETITIAN') {
      const err = 'Approval blocked: Assistant Dietitians are not authorized to approve clinical nutrition plans (Requires Treating Nutritionist or Clinical Director).';
      console.warn(`[Weekly Diet Plan Approval Blocked] ${err}`);
      setWeeklyPlanApprovalError(err);
      return false;
    }

    // 3. P2 Clinical Governance Prerequisite
    if (!p2AnalysisResult || !p2AnalysisResult.report || !p2AnalysisResult.report.isApproved || p2AnalysisResult.analysisInvalidatedAt || p2AnalysisResult.report.analysisInvalidatedAt) {
      const err = 'Cannot approve 7-day diet prescription without an approved Phase 2 Clinical Assessment.';
      console.warn(`[Weekly Diet Plan Approval Blocked] ${err}`);
      setWeeklyPlanApprovalError(err);
      return false;
    }

    if (p2AnalysisResult.patientId && p2AnalysisResult.patientId !== patient.id) {
      const err = 'P2 Clinical Assessment does not match active patient.';
      console.warn(`[Weekly Diet Plan Approval Blocked] ${err}`);
      setWeeklyPlanApprovalError(err);
      return false;
    }

    if (p2AnalysisResult.visitId && p2AnalysisResult.visitId !== activeVisitId) {
      const err = 'P2 Clinical Assessment visit does not match active clinical visit.';
      console.warn(`[Weekly Diet Plan Approval Blocked] ${err}`);
      setWeeklyPlanApprovalError(err);
      return false;
    }

    // Step B — Comprehensive 7-Day Clinical Safety Revalidation
    const safetyEval = evaluateWeeklyPlanClinicalSafety(
      patient,
      weeklyDietPlan,
      allFoods,
      p2AnalysisResult?.p3PlanningContext
    );

    if (!safetyEval.is_eligible_for_approval || safetyEval.overall_decision === 'HARD_STOP') {
      const reason = safetyEval.unresolved_hard_stops.length > 0 
        ? safetyEval.unresolved_hard_stops.join('; ')
        : 'Clinical safety contraindications detected across weekly plan.';
      const err = `Clinical safety validation failed: ${reason}`;
      console.warn(`[Weekly Diet Plan Approval Blocked] ${err}`);
      setWeeklyPlanApprovalError(err);
      return false;
    }

    // Step C — Persist-First Sequence
    const targetVisitId = weeklyDietPlan.visit_id || activeVisitId;
    const planKey = `shuddho_weekly_plan_${weeklyDietPlan.patient_id}_${targetVisitId}`;

    const approvedPlan = approveWeeklyDietPlan(weeklyDietPlan, clinicianId, notes);

    // 1. Save to primary weekly plan storage
    const saveSucceeded = safeStorage.setItem(planKey, approvedPlan);
    if (!saveSucceeded) {
      const err = 'Storage failure: Failed to write approved weekly plan to local persistence.';
      console.error(`[Weekly Diet Plan Approval Persistence Error] ${err}`);
      setWeeklyPlanApprovalError(err);
      return false;
    }

    // 2. Read-back verification
    const readBack = safeStorage.getItem<WeeklyDietPlan>(planKey);
    if (!readBack || readBack.plan_id !== approvedPlan.plan_id || readBack.version !== approvedPlan.version || !readBack.is_approved) {
      const err = 'Persistence verification failed: Stored plan read-back did not match approved plan.';
      console.error(`[Weekly Diet Plan Approval Persistence Error] ${err}`);
      setWeeklyPlanApprovalError(err);
      return false;
    }

    // 3. Update saved_patients record in storage
    const currentSaved = safeStorage.getItem<PatientRecord[]>('shuddho_saved_patients') || savedPatients;
    const existingPatientRecord = currentSaved.find(p => p.patient.id === patient.id);
    if (existingPatientRecord) {
      const updatedRecord: PatientRecord = {
        ...existingPatientRecord,
        weekly_diet_plan: approvedPlan,
        updated_at: approvedPlan.updated_at
      };
      const tx = savePatientTransaction({
        currentRecord: updatedRecord,
        storageEngine: safeStorage,
        action: { type: 'SAVE_RECORD' },
        savedPatientsList: currentSaved
      });
      if (tx.success) {
        setSavedPatients(tx.committedPatientsList);
      }
    }

    // 4. ONLY commit in-memory React state after verified persistence
    setWeeklyDietPlan(approvedPlan);
    setWeeklyPlanApprovalError(null);

    // 5. Emit authoritative clinical audit event
    try {
      getPracticeRepository().logAuditEvent({
        event_type: 'PLAN_APPROVED',
        entity_type: 'approval_record',
        entity_id: approvedPlan.plan_id,
        patient_id: patient.id,
        clinician_name: clinicianId,
        payload_after: {
          version: approvedPlan.version,
          clinician_name: clinicianId,
          notes
        }
      }).catch(e => console.warn('Could not record approval audit event:', e));
    } catch (e) {
      console.warn('Audit trail emission error:', e);
    }

    return true;
  }, [patient, currentVisit, weeklyDietPlan, p2AnalysisResult, allFoods, savedPatients, currentClinician]);

  // -------------------------------------------------------------------
  // R4 Protocol Studio Orchestration & Lifecycle
  // -------------------------------------------------------------------

  const generateR4Draft = useCallback(async (): Promise<R4ProtocolStudioData> => {
    const draft = generateAutomaticProtocolDraft(patient, currentClinician || undefined);
    setR4Protocol(draft);
    setIsR4ProtocolDirty(true);
    try {
      await getPracticeRepository().saveLifestylePlan(draft);
      setIsR4ProtocolDirty(false);
    } catch (e) {
      console.warn('Failed to auto-save R4 draft:', e);
    }
    return draft;
  }, [patient, currentClinician]);

  const createManualR4Protocol = useCallback(async (): Promise<R4ProtocolStudioData> => {
    const template = createManualProtocolTemplate(patient, currentClinician || undefined);
    setR4Protocol(template);
    setIsR4ProtocolDirty(true);
    return template;
  }, [patient, currentClinician]);

  const updateR4Protocol = useCallback((updated: R4ProtocolStudioData) => {
    let draft = { ...updated };
    // If editing a previously approved protocol: preserve previous version, clear approval metadata, create new draft revision
    if (r4Protocol?.is_approved) {
      draft = {
        ...draft,
        is_approved: false,
        status: 'draft',
        approved_by: undefined,
        approved_at: undefined,
        approval_notes: undefined,
        previous_approved_version: r4Protocol.version,
        updated_at: new Date().toISOString()
      };
      if (typeof window !== 'undefined') {
        try {
          const archiveKey = `shuddho_lifestyle_archive_${r4Protocol.patient_id}_v${r4Protocol.version}`;
          localStorage.setItem(archiveKey, JSON.stringify(r4Protocol));
        } catch {
          // Ignore quota error
        }
      }
    }
    const safeDraft = recalculateProtocolSafety(draft, patient);
    setR4Protocol(safeDraft);
    setIsR4ProtocolDirty(true);
  }, [r4Protocol, patient]);

  const saveR4Protocol = useCallback(async (): Promise<R4ProtocolStudioData | null> => {
    if (!r4Protocol) return null;
    const saved = await getPracticeRepository().saveLifestylePlan(r4Protocol);
    setR4Protocol(saved);
    setIsR4ProtocolDirty(false);
    return saved;
  }, [r4Protocol]);

  const approveR4Protocol = useCallback(async (notes?: string): Promise<R4ProtocolStudioData | null> => {
    if (!r4Protocol) return null;
    const isConfigured = isSupabaseConfigured();

    if (isConfigured && !currentClinician) {
      throw new Error('Authentication required: Formal cloud protocol approval requires an active authenticated clinician session.');
    }

    const activeClinician: ClinicianAuthProfile = currentClinician || {
      id: 'demo-clinician-simulation',
      auth_user_id: 'auth-demo-unverified',
      organization_id: 'org-demo-simulation',
      email: 'demo@shuddho.local',
      name: 'Demo Clinician (Local Simulation — Non-Authoritative)',
      role: 'CLINICAL_DIRECTOR',
      license_number: 'DEMO-SIMULATION-UNVERIFIED',
      is_active: true
    };

    const approved = await getPracticeRepository().approveLifestylePlan(r4Protocol, activeClinician, notes);
    setR4Protocol(approved);
    setIsR4ProtocolDirty(false);
    return approved;
  }, [r4Protocol, currentClinician]);

  // Phase R5: Systems Intelligence Actions
  const updateR5Pathways = useCallback((selectedIds: ExpandedClinicalPathwayId[], isExplicitlyNoPathways: boolean) => {
    const newState = evaluatePathwaySelectionState(selectedIds, isExplicitlyNoPathways);
    setR5Pathways(newState);
    const legacyPathways = isExplicitlyNoPathways || selectedIds.length === 0
      ? []
      : mapExpandedPathwaysToLegacy(selectedIds);
    setPatient(prev => {
      return {
        ...prev,
        clinical_pathways: legacyPathways,
        // P0-001: Preserve confirmed conditions exactly as entered.
        // Never auto-inject unconfirmed disease diagnoses from broad pathway selections!
        selected_conditions: prev.selected_conditions || [],
        r5_pathways: newState,
        assessment_last_updated_at: new Date().toISOString()
      };
    });
  }, []);

  const updateR5Medications = useCallback((meds: R5MedicationRecord[]) => {
    const normalized = meds.map(normalizeMedicationRecord);
    setR5Medications(normalized);
    const legacyRecords = normalized.map(canonicalToLegacyMedication);

    const activeNames = Array.from(new Set(
      normalized
        .filter(m => (m.status || 'active') === 'active')
        .map(m => m.brand_name || m.generic_name || (m as any).medication_name || '')
        .filter(Boolean)
    ));

    setPatient(prev => {
      const verifiedNoMeds = Boolean(prev.medication_reconciliation?.verified_no_medications && normalized.length === 0);
      const reconEval = evaluateMedicationReconciliationStatus(normalized, verifiedNoMeds);

      return {
        ...prev,
        medication_records: legacyRecords,
        active_medications: activeNames,
        medication_reconciliation_status: reconEval.status,
        medication_reconciliation: {
          status: reconEval.status,
          reconciled_records: legacyRecords,
          verified_no_medications: verifiedNoMeds,
          reconciled_by: currentClinician?.name || prev.medication_reconciliation?.reconciled_by || undefined,
          reconciled_at: reconEval.status === 'fully_reconciled' ? new Date().toISOString() : prev.medication_reconciliation?.reconciled_at,
          missing_elements: reconEval.missing_elements
        },
        assessment_last_updated_at: new Date().toISOString()
      };
    });

    // Invalidate previously approved R4 protocol if medications change (P1-007: preserve history & clear stale sign-off)
    setR4Protocol(prevProto => {
      if (prevProto && (prevProto.is_approved || prevProto.status === 'active')) {
        return {
          ...prevProto,
          is_approved: false,
          status: 'draft',
          approved_by: undefined,
          approved_at: undefined,
          invalidated_at: new Date().toISOString(),
          previous_approved_version: prevProto.version,
          approval_notes: (prevProto.approval_notes ? prevProto.approval_notes + ' | ' : '') + 'Invalidated due to medication list modification; requires clinician re-approval.',
          approval_metadata: undefined
        } as R4ProtocolStudioData;
      }
      return prevProto;
    });
  }, [currentClinician]);

  const syncR5ToR4Protocol = useCallback(() => {
    const pop = deriveR5PopulationProfile(patient);
    const targetVisitId = patient.current_visit_id || currentVisit?.visit_id || currentVisit?.id || 'default_visit';
    const storageKey = `shuddho_assessment_${patient.id}_${targetVisitId}`;
    const persistedAssessment = safeStorage.getItem<any>(storageKey);
    const assessmentAnswers = persistedAssessment?.answers || (patient as any)?.assessment_answers || {};
    const labEntries = persistedAssessment?.labEntries || patient.labs || {};
    const ffqHabits = persistedAssessment?.ffqHabits;

    const r7LabSummary = evaluateR7LaboratoryIntelligence({
      patient,
      visitId: targetVisitId,
      structuredEntries: persistedAssessment?.labEntries
    });
    const matrixInput = adaptAssessmentEvidenceToMatrixInput(
      patient,
      assessmentAnswers,
      labEntries,
      ffqHabits,
      r5Pathways.selected_pathways,
      r5Medications
    );
    (matrixInput as any).r7_lab_summary = r7LabSummary;
    const matrix = evaluateFunctionalMatrix(matrixInput);
    const graph = buildSystemsNetworkGraph(matrix, r5Pathways.selected_pathways, r5Medications, r7LabSummary);
    const conflicts = resolveMultimorbidityConflicts({
      pathway_ids: r5Pathways.selected_pathways,
      medications: r5Medications,
      has_fluid_restriction: Boolean(patient.fluid_prescription?.total_fluid_limit_ml || patient.clinical_safety?.fluid_restriction?.limit_ml),
      is_on_dialysis: Boolean((patient as any).is_on_dialysis)
    });
    const insulin = analyzeInsulinRegimen(r5Medications);
    const dni = evaluateMedicationNutritionInteractions(r5Medications, patient, { labSummary: r7LabSummary });

    const payload: R5ClinicalContextPayload & { r7_lab_summary?: any } = {
      population: pop,
      pathways: r5Pathways,
      functional_findings: Object.values(matrix.domains).flat(),
      medications: r5Medications,
      insulin_context: insulin.regimen_context,
      dni_findings: dni,
      multimorbidity_resolutions: conflicts,
      systems_graph: graph,
      r7_lab_summary: r7LabSummary,
      stale_r4_sections: [],
      generated_at: new Date().toISOString()
    };

    const res = adaptR5ContextToR4(payload, r4Protocol || undefined);
    if (r4Protocol) {
      // Merge & deduplicate supplements across repeated R5->R4 sync calls
      const existingSupps = r4Protocol.supplements || [];
      const mergedSupps = [...existingSupps];
      for (const incoming of (res.updated_draft.supplements || [])) {
        const alreadyPresent = mergedSupps.some(
          s =>
            s.id === incoming.id ||
            ((s.generic_nutrient || '').trim().toLowerCase() === (incoming.generic_nutrient || '').trim().toLowerCase() &&
              (s.chemical_form || '').trim().toLowerCase() === (incoming.chemical_form || '').trim().toLowerCase())
        );
        if (!alreadyPresent) {
          mergedSupps.push(incoming);
        }
      }
      updateR4Protocol({
        ...r4Protocol,
        ...res.updated_draft,
        supplements: mergedSupps,
        status: r4Protocol.is_approved ? 'active' : 'draft'
      });
    }
  }, [patient, currentVisit, r5Pathways, r5Medications, r4Protocol, updateR4Protocol]);

  // Rehydrate or lazily initialize R4 protocol on patient/visit changes
  useEffect(() => {
    let isCancelled = false;
    async function loadProtocol() {
      try {
        const repo = getPracticeRepository();
        const existing = await repo.getLifestylePlan(patient.id, patient.current_visit_id);
        if (!isCancelled) {
          if (existing) {
            setR4Protocol(existing);
            setIsR4ProtocolDirty(false);
          } else {
            const autoDraft = generateAutomaticProtocolDraft(patient, currentClinician || undefined);
            setR4Protocol(autoDraft);
            setIsR4ProtocolDirty(false);
            repo.saveLifestylePlan(autoDraft).catch(() => {});
          }
        }
      } catch (err) {
        if (!isCancelled) {
          const autoDraft = generateAutomaticProtocolDraft(patient, currentClinician || undefined);
          setR4Protocol(autoDraft);
          setIsR4ProtocolDirty(false);
        }
      }
    }
    loadProtocol();
    return () => { isCancelled = true; };
  }, [patient.id, patient.current_visit_id]);

  const updateMealItemRawGrams = useCallback((mealId: string, itemId: string, rawGrams: number) => {
    if (weeklyDietPlan) {
      updateDayMealItemRawGrams(activeDayNumber, mealId, itemId, rawGrams);
      return;
    }
    setDietChart(prev => prev.map(meal => {
      if (meal.id !== mealId) return meal;
      const updatedItems = meal.items.map(item => {
        if (item.id !== itemId) return item;
        const food = foodMap.get(item.food_id);
        const ratio = food ? food.raw_to_cooked_ratio : 1;
        const per100 = food ? food.per_100g : {
          kcal: (item.kcal / (item.raw_weight_g || 100)) * 100,
          protein_g: (item.protein_g / (item.raw_weight_g || 100)) * 100,
          carbs_g: (item.carbs_g / (item.raw_weight_g || 100)) * 100,
          fat_g: (item.fat_g / (item.raw_weight_g || 100)) * 100,
          fiber_g: (item.fiber_g / (item.raw_weight_g || 100)) * 100
        };
        const cookedG = Math.round(rawGrams * ratio);
        const display = food ? getCookedDisplay(food, rawGrams, cookedG) : { bn: `${cookedG} গ্রাম`, en: `${cookedG}g` };
        const mult = rawGrams / 100;
        return {
          ...item,
          raw_weight_g: rawGrams,
          cooked_weight_g: cookedG,
          cooked_display_bn: display.bn,
          cooked_display_en: display.en,
          kcal: Math.round((per100.kcal ?? 0) * mult),
          protein_g: Math.round((per100.protein_g ?? 0) * mult * 10) / 10,
          carbs_g: Math.round((per100.carbs_g ?? 0) * mult * 10) / 10,
          fat_g: Math.round((per100.fat_g ?? 0) * mult * 10) / 10,
          fiber_g: Math.round((per100.fiber_g ?? 0) * mult * 10) / 10
        };
      });

      const meal_calories = updatedItems.reduce((sum, i) => sum + i.kcal, 0);
      const meal_protein_g = Math.round(updatedItems.reduce((sum, i) => sum + i.protein_g, 0) * 10) / 10;
      const meal_carbs_g = Math.round(updatedItems.reduce((sum, i) => sum + i.carbs_g, 0) * 10) / 10;
      const meal_fat_g = Math.round(updatedItems.reduce((sum, i) => sum + i.fat_g, 0) * 10) / 10;

      return {
        ...meal,
        items: updatedItems,
        meal_calories,
        meal_protein_g,
        meal_carbs_g,
        meal_fat_g
      };
    }));
  }, [foodMap, weeklyDietPlan, activeDayNumber, updateDayMealItemRawGrams]);

  const swapMealItemAlternative = useCallback((mealId: string, itemId: string, alt: FoodExchangeItem) => {
    if (weeklyDietPlan) {
      swapDayMealItemAlternative(activeDayNumber, mealId, itemId, alt);
      return;
    }
    const food = foodMap.get(alt.food_id);
    if (!food) return;

    setDietChart(prev => prev.map(meal => {
      if (meal.id !== mealId) return meal;
      const updatedItems = meal.items.map(item => {
        if (item.id !== itemId) return item;
        const rawG = alt.raw_weight_g;
        const cookedG = Math.round(rawG * food.raw_to_cooked_ratio);
        const display = getCookedDisplay(food, rawG, cookedG);
        const mult = rawG / 100;
        return {
          id: item.id,
          food_id: food.id,
          food_name_bn: food.name_bn,
          food_name_en: food.name_en,
          category: food.category,
          raw_weight_g: rawG,
          cooked_weight_g: cookedG,
          cooked_display_bn: display.bn,
          cooked_display_en: display.en,
          kcal: Math.round((food.per_100g.kcal ?? 0) * mult),
          protein_g: Math.round((food.per_100g.protein_g ?? 0) * mult * 10) / 10,
          carbs_g: Math.round((food.per_100g.carbs_g ?? 0) * mult * 10) / 10,
          fat_g: Math.round((food.per_100g.fat_g ?? 0) * mult * 10) / 10,
          fiber_g: Math.round((food.per_100g.fiber_g ?? 0) * mult * 10) / 10,
          prep_note_bn: food.prep_note_bn,
          prep_note_en: food.prep_note_en,
          alternatives: generateExchangesForFood(
            food, 
            rawG, 
            allFoods, 
            new Set(trafficLight.green.map(g => g.id)),
            new Set(trafficLight.red.map(r => r.id)),
            new Set(trafficLight.yellow.map(y => y.id))
          ),
          traffic_status: alt.traffic_status
        };
      });

      const meal_calories = updatedItems.reduce((sum, i) => sum + i.kcal, 0);
      const meal_protein_g = Math.round(updatedItems.reduce((sum, i) => sum + i.protein_g, 0) * 10) / 10;
      const meal_carbs_g = Math.round(updatedItems.reduce((sum, i) => sum + i.carbs_g, 0) * 10) / 10;
      const meal_fat_g = Math.round(updatedItems.reduce((sum, i) => sum + i.fat_g, 0) * 10) / 10;

      return {
        ...meal,
        items: updatedItems,
        meal_calories,
        meal_protein_g,
        meal_carbs_g,
        meal_fat_g
      };
    }));
  }, [foodMap, trafficLight, weeklyDietPlan, activeDayNumber, swapDayMealItemAlternative]);

  const removeMealItem = useCallback((mealId: string, itemId: string) => {
    if (weeklyDietPlan) {
      removeDayMealItem(activeDayNumber, mealId, itemId);
      return;
    }
    setDietChart(prev => prev.map(meal => {
      if (meal.id !== mealId) return meal;
      const updatedItems = meal.items.filter(i => i.id !== itemId);
      return {
        ...meal,
        items: updatedItems,
        meal_calories: updatedItems.reduce((sum, i) => sum + i.kcal, 0),
        meal_protein_g: Math.round(updatedItems.reduce((sum, i) => sum + i.protein_g, 0) * 10) / 10,
        meal_carbs_g: Math.round(updatedItems.reduce((sum, i) => sum + i.carbs_g, 0) * 10) / 10,
        meal_fat_g: Math.round(updatedItems.reduce((sum, i) => sum + i.fat_g, 0) * 10) / 10
      };
    }));
  }, [weeklyDietPlan, activeDayNumber, removeDayMealItem]);

  const addMealItem = useCallback((mealId: string, foodId: string, rawGrams: number = 100) => {
    if (weeklyDietPlan) {
      addDayMealItem(activeDayNumber, mealId, foodId, rawGrams);
      return;
    }
    const food = foodMap.get(foodId);
    if (!food) return;

    // Safety guard: prevent adding RED foods
    if (trafficLight.red.some(r => r.id === foodId)) {
      alert(language === 'bn' 
        ? "সতর্কতা: এই খাদ্যটি রোগীর স্বাস্থ্য অবস্থা বা অ্যালার্জির কারণে লাল তালিকায় নিষিদ্ধ। এটি যোগ করা সম্ভব নয়।"
        : "Safety Alert: This food is strictly contraindicated (RED) due to patient conditions or allergies."
      );
      return;
    }

    const cookedG = Math.round(rawGrams * food.raw_to_cooked_ratio);
    const display = getCookedDisplay(food, rawGrams, cookedG);
    const mult = rawGrams / 100;
    const status: 'GREEN' | 'YELLOW' = trafficLight.green.some(g => g.id === foodId) ? 'GREEN' : 'YELLOW';

    const newItem: DietChartMealItem = {
      id: `item_${food.id}_${Date.now()}`,
      food_id: food.id,
      food_name_bn: food.name_bn,
      food_name_en: food.name_en,
      category: food.category,
      raw_weight_g: rawGrams,
      cooked_weight_g: cookedG,
      cooked_display_bn: display.bn,
      cooked_display_en: display.en,
      kcal: Math.round((food.per_100g.kcal ?? 0) * mult),
      protein_g: Math.round((food.per_100g.protein_g ?? 0) * mult * 10) / 10,
      carbs_g: Math.round((food.per_100g.carbs_g ?? 0) * mult * 10) / 10,
      fat_g: Math.round((food.per_100g.fat_g ?? 0) * mult * 10) / 10,
      fiber_g: Math.round((food.per_100g.fiber_g ?? 0) * mult * 10) / 10,
      prep_note_bn: food.prep_note_bn,
      prep_note_en: food.prep_note_en,
      alternatives: generateExchangesForFood(
        food, 
        rawGrams, 
        allFoods, 
        new Set(trafficLight.green.map(g => g.id)),
        new Set(trafficLight.red.map(r => r.id)),
        new Set(trafficLight.yellow.map(y => y.id))
      ),
      traffic_status: status
    };

    setDietChart(prev => prev.map(meal => {
      if (meal.id !== mealId) return meal;
      const updatedItems = [...meal.items, newItem];
      return {
        ...meal,
        items: updatedItems,
        meal_calories: updatedItems.reduce((sum, i) => sum + i.kcal, 0),
        meal_protein_g: Math.round(updatedItems.reduce((sum, i) => sum + i.protein_g, 0) * 10) / 10,
        meal_carbs_g: Math.round(updatedItems.reduce((sum, i) => sum + i.carbs_g, 0) * 10) / 10,
        meal_fat_g: Math.round(updatedItems.reduce((sum, i) => sum + i.fat_g, 0) * 10) / 10
      };
    }));
  }, [foodMap, trafficLight, language, weeklyDietPlan, activeDayNumber, addDayMealItem]);

  const resetDietChartToAutoScaled = useCallback(() => {
    const fresh = buildAutoScaledDietChart(patient, allFoods, trafficLight);
    setDietChart(fresh);
    setPatient(prev => ({
      ...prev,
      is_diet_plan_dirty: false,
      diet_plan_generated_at: new Date().toISOString(),
      manual_edits_preserved: false
    }));
  }, [patient, trafficLight]);

  // Longitudinal Visits
  const addVisit = useCallback((visitData: Partial<LongitudinalVisit>) => {
    const currentRec: PatientRecord = {
      schema_version: CURRENT_SCHEMA_VERSION,
      patient,
      visits,
      current_diet_chart: dietChart,
      current_supplements: candidateSupplements,
      timeline: dniResult.timeline,
      updated_at: new Date().toISOString()
    };
    const updatedRec = recordFollowUpVisit(currentRec, visitData);
    setVisits(updatedRec.visits);
  }, [patient, visits, dietChart, candidateSupplements, dniResult.timeline]);

  const advancePatientPhase = useCallback((options?: TransitionOptions) => {
    const currentRec: PatientRecord = {
      schema_version: CURRENT_SCHEMA_VERSION,
      patient,
      visits,
      current_diet_chart: dietChart,
      current_supplements: candidateSupplements,
      timeline: dniResult.timeline,
      updated_at: new Date().toISOString()
    };

    const advanced = advanceToNextPhase(currentRec, options);
    setPatient(advanced.patient);
    setVisits(advanced.visits);

    // Auto-scale new diet chart with the advanced phase rules
    const newTrafficLight = resolveConflicts(
      allFoods,
      advanced.patient.selected_conditions,
      allMedicines.filter(m => advanced.patient.active_medications.includes(m.id)),
      advanced.patient.confirmed_allergies,
      advanced.patient.clinician_disallowed_foods,
      advanced.patient.clinician_disallowed_tags,
      advanced.patient.current_phase
    );
    const freshChart = buildAutoScaledDietChart(advanced.patient, allFoods, newTrafficLight);
    setDietChart(freshChart);
  }, [patient, visits, dietChart, candidateSupplements, dniResult.timeline]);

  // Persistence Actions
  const saveCurrentPatient = useCallback((): boolean => {
    let currentSnapshots = visitSnapshots;
    const isBaselineVisit = !currentVisit || currentVisit.is_baseline || currentVisit.visit_type === 'baseline_consultation';
    const hasBaselineSnapshot = currentSnapshots.some(s => s.is_baseline);

    // If on baseline visit and no snapshot exists or existing baseline snapshot is still unapproved draft, ensure snapshot reflects current measurements
    if (isBaselineVisit && (!hasBaselineSnapshot || currentSnapshots.some(s => s.is_baseline && s.approval_status === 'draft'))) {
      const visitId = patient.current_visit_id || currentVisit?.visit_id || currentVisit?.id || generateCollisionResistantId(`vis_${patient.id}`);
      const baseSnap = createClinicalSnapshot({
        patient,
        visitId,
        visitType: 'baseline_consultation',
        isBaseline: true,
        approvalStatus: p2AnalysisResult?.report?.isApproved ? 'approved' : 'draft',
        approvedBy: p2AnalysisResult?.report?.approvedBy,
        relatedAssessmentId: currentClinicalAssessment?.assessment_id,
        clinicalSafetyEvaluation,
        p2AnalysisResult
      });
      currentSnapshots = appendSnapshotWithRevisionPolicy(currentSnapshots, baseSnap);
      setVisitSnapshots(currentSnapshots);
    }

    const record: PatientRecord = {
      schema_version: CURRENT_SCHEMA_VERSION,
      patient,
      visits,
      clinical_visits: clinicalVisits,
      follow_up_appointments: followUpAppointments,
      visit_snapshots: currentSnapshots,
      progress_reports: progressReports,
      current_diet_chart: dietChart,
      weekly_diet_plan: weeklyDietPlan || undefined,
      current_supplements: candidateSupplements,
      timeline: dniResult.timeline,
      updated_at: new Date().toISOString()
    };

    if (weeklyDietPlan) {
      persistWeeklyPlan(weeklyDietPlan);
    }

    const tx = savePatientTransaction({
      currentRecord: record,
      storageEngine: safeStorage,
      action: { type: 'SAVE_RECORD' },
      savedPatientsList: savedPatients
    });

    if (!tx.success) {
      console.error('[Save Error] Transaction failed:', tx.error);
      return false;
    }

    // Only commit in-memory state after storage write succeeded
    setSavedPatients(tx.committedPatientsList);
    return true;
  }, [patient, visits, clinicalVisits, followUpAppointments, visitSnapshots, progressReports, dietChart, weeklyDietPlan, candidateSupplements, dniResult.timeline, savedPatients, persistWeeklyPlan]);

  const loadPatient = useCallback((id: string): boolean => {
    // 1. Flush/save currently active patient first to avoid data loss on patient switch
    if (patient && patient.id && patient.id !== id) {
      const saveSucceeded = saveCurrentPatient();
      if (!saveSucceeded) {
        console.error(`[Patient Switch Error] Failed to persist current patient (${patient.id}) before switching to ${id}. Aborting switch.`);
        if (typeof window !== 'undefined') {
          alert(language === 'bn' 
            ? 'রোগী পরিবর্তন স্থগিত: বর্তমান রোগীর তথ্য সংরক্ষণে ব্যর্থতা (স্টোরেজ ত্রুটি বা কোটা অতিক্রান্ত)। তথ্য সুরক্ষার স্বার্থে রোগী পরিবর্তন বাতিল করা হলো।' 
            : 'Patient switch aborted: Failed to persist current patient data to storage (quota exceeded or storage error). Switch was blocked to prevent data loss.');
        }
        return false;
      }
    }

    const currentSaved = safeStorage.getItem<PatientRecord[]>('shuddho_saved_patients') || savedPatients;
    const match = currentSaved.find(p => p.patient.id === id);
    if (!match) {
      console.warn(`[Load Patient] Target patient "${id}" not found in saved records.`);
      return false;
    }

    const migrated = migratePatientRecord(match);
    setPatient(migrated.patient);
    setVisits(migrated.visits || []);
    setClinicalVisits(migrated.clinical_visits || []);

    // Restore active visit: prefer migrated.patient.current_visit_id
    const activeVisit = (migrated.clinical_visits || []).find(
      v => v.visit_id === migrated.patient.current_visit_id || v.id === migrated.patient.current_visit_id
    ) || (migrated.clinical_visits && migrated.clinical_visits.length > 0 ? migrated.clinical_visits[0] : null);

    setCurrentVisit(activeVisit);
    setFollowUpAppointments(migrated.follow_up_appointments || []);
    setVisitSnapshots(migrated.visit_snapshots || []);
    setProgressReports(migrated.progress_reports || []);
    setCurrentProgressReport(migrated.progress_reports && migrated.progress_reports.length > 0 ? migrated.progress_reports[0] : null);
    setDietChart(migrated.current_diet_chart || []);
    if (migrated.current_supplements && migrated.current_supplements.length > 0) {
      setCandidateSupplements(migrated.current_supplements);
    }
    setCurrentClinicalAssessment(null);
    setSelectedReportVisitId(null);
    setPreviewP2AnalysisResult(null);

    // Rehydrate or isolate P2 analysis for newly loaded patient and visit
    const targetVisitId = migrated.patient.current_visit_id || activeVisit?.visit_id || activeVisit?.id;
    const visitDateClean = (migrated.patient.visit_date || '').replace(/[^0-9]/g, '');
    const p2Key = `shuddho_p2_analysis_${migrated.patient.id}_${targetVisitId || `visit_${migrated.patient.id}_${visitDateClean}`}`;
    try {
      const savedP2 = safeStorage.getItem<P2AnalysisResult>(p2Key);
      if (savedP2) {
        setP2AnalysisResult(savedP2);
      } else {
        setP2AnalysisResult(runP2Analysis(migrated.patient));
      }
    } catch {
      setP2AnalysisResult(runP2Analysis(migrated.patient));
    }

    // Rehydrate Step 05 Weekly Diet Plan for newly loaded patient and visit
    const planKey = `shuddho_weekly_plan_${migrated.patient.id}_${targetVisitId || 'default_visit'}`;
    let loadedPlan: WeeklyDietPlan | null = null;
    try {
      loadedPlan = safeStorage.getItem<WeeklyDietPlan>(planKey) || migrated.weekly_diet_plan || null;
    } catch {
      loadedPlan = migrated.weekly_diet_plan || null;
    }
    setWeeklyDietPlan(loadedPlan);
    setActiveDayNumber(1);
    if (loadedPlan && loadedPlan.days && loadedPlan.days[0]) {
      setDietChart(loadedPlan.days[0].meals);
    }

    // Rehydrate R5 Pathways and Medications from loaded patient record (zero leakage)
    if (migrated.patient.r5_pathways) {
      setR5Pathways(migrated.patient.r5_pathways);
    } else if (migrated.patient.clinical_pathways && migrated.patient.clinical_pathways.length > 0) {
      const expanded = mapLegacyPathwaysToExpanded(migrated.patient.clinical_pathways);
      setR5Pathways(evaluatePathwaySelectionState(expanded, false));
    } else {
      setR5Pathways(evaluatePathwaySelectionState([], false));
    }

    const loadedMeds = (migrated.patient.medication_records || []).map(normalizeMedicationRecord);
    setR5Medications(loadedMeds);

    safeStorage.setItem('shuddho_active_patient_id', id);
    return true;
  }, [savedPatients, patient, saveCurrentPatient, language]);

  // Dedicated Patient Registration without fictional labs or placeholder anthropometrics
  const registerNewPatient = useCallback((adminData: Partial<PatientProfile>): PatientProfile | null => {
    const newId = generateCollisionResistantId('pt');
    const today = getDhakaTodayDateString();
    const initialVisitId = generateCollisionResistantId(`vis_${newId}`);

    const isAgeUnentered = adminData.age === undefined || adminData.age === null || adminData.age === 0;
    const isGenderUnentered = !adminData.gender || adminData.gender === ('unspecified' as any);
    const isSleepHoursUnentered = adminData.sleep_hours === undefined || adminData.sleep_hours === null;
    const isActivityUnentered = !adminData.activity_level;
    const isPopulationUnentered = !adminData.population_group;
    const isDemographicsIncomplete = isAgeUnentered || isGenderUnentered || (!adminData.height_cm) || (!adminData.weight_kg);

    const unmeasuredCalc = calculateAnthropometrics(
      adminData.age ?? 0,
      adminData.gender || 'unspecified',
      adminData.height_cm ?? 0,
      adminData.weight_kg ?? 0,
      adminData.waist_cm ?? 0,
      adminData.activity_level || 'sedentary',
      [],
      adminData.population_group || 'adult_standard',
      adminData.trimester,
      'clamped_to_bmr'
    );

    const freshPatient: PatientProfile = {
      schema_version: CURRENT_SCHEMA_VERSION,
      id: newId,
      name: adminData.name || "New Patient",
      age: adminData.age ?? 0,
      is_age_unentered: isAgeUnentered,
      gender: adminData.gender || 'unspecified',
      is_gender_unentered: isGenderUnentered,
      phone: adminData.phone || "",
      email: adminData.email || "",
      visit_date: today,
      current_visit_id: initialVisitId,
      current_phase: 1,
      height_cm: adminData.height_cm ?? 0,
      weight_kg: adminData.weight_kg ?? 0,
      waist_cm: adminData.waist_cm ?? 0,
      activity_level: adminData.activity_level || 'sedentary',
      is_activity_unentered: isActivityUnentered,
      sleep_hours: adminData.sleep_hours ?? 0,
      is_sleep_unentered: isSleepHoursUnentered,
      shift_worker: Boolean(adminData.shift_worker),
      population_group: adminData.population_group || 'adult_standard',
      is_population_unentered: isPopulationUnentered,
      is_demographics_incomplete: isDemographicsIncomplete,
      bmr_floor_strategy: 'clamped_to_bmr',
      confirmed_allergies: [],
      allergy_reconciliation_status: 'not_assessed',
      clinician_disallowed_foods: [],
      clinician_disallowed_tags: [],
      selected_conditions: [],
      active_medications: [],
      medication_records: [],
      medication_reconciliation_status: 'not_assessed',
      gut_profile: {
        bloating: 'none',
        acid_reflux_hypoacidity: false,
        bristol_stool_score: 4,
        energy_score: 7,
        sleep_quality_score: 7,
        digestive_fire_agni: 'unassessed'
      },
      labs: {
        lab_flags: []
      },
      calculated: unmeasuredCalc,
      is_diet_plan_dirty: false,
      assessment_last_updated_at: new Date().toISOString(),
      diet_plan_generated_at: new Date().toISOString(),
      manual_edits_preserved: false
    };

    const initialVisit: ClinicalVisit = {
      visit_id: initialVisitId,
      id: initialVisitId,
      patient_id: newId,
      visit_number: 1,
      visit_type: 'baseline_consultation',
      visit_date: today,
      created_at: new Date().toISOString(),
      status: 'in_progress',
      notes: 'Initial clinical registration'
    };

    const newRecord: PatientRecord = {
      schema_version: CURRENT_SCHEMA_VERSION,
      patient: freshPatient,
      visits: [],
      clinical_visits: [initialVisit],
      follow_up_appointments: [],
      visit_snapshots: [],
      progress_reports: [],
      current_diet_chart: [],
      current_supplements: [],
      timeline: [],
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const tx = savePatientTransaction({
      currentRecord: newRecord,
      storageEngine: safeStorage,
      action: { type: 'REGISTER_PATIENT', payload: newRecord },
      savedPatientsList: savedPatients
    });

    if (!tx.success) {
      console.error('[Registration Error] Failed to persist new patient:', tx.error);
      return null;
    }

    setPatient(freshPatient);
    setClinicalVisits([initialVisit]);
    setCurrentVisit(initialVisit);
    setFollowUpAppointments([]);
    setVisitSnapshots([]);
    setProgressReports([]);
    setCurrentProgressReport(null);
    setVisits([]);
    setDietChart([]);
    setWeeklyDietPlan(null);
    setActiveDayNumber(1);
    setCandidateSupplements([]);
    setR5Pathways(evaluatePathwaySelectionState([], false));
    setR5Medications([]);
    setP2AnalysisResult(null);
    setCurrentClinicalAssessment(null);
    setSelectedReportVisitId(null);
    setPreviewP2AnalysisResult(null);
    setSavedPatients(tx.committedPatientsList);
    safeStorage.setItem('shuddho_active_patient_id', freshPatient.id);

    return freshPatient;
  }, [savedPatients]);

  const createNewPatient = useCallback(() => {
    registerNewPatient({
      name: "New Patient / নতুন রোগী",
      gender: 'female',
    });
  }, [registerNewPatient]);

  // Longitudinal Visits Management
  const startNewVisit = useCallback((patientId: string, visitType: ClinicalVisitType = 'routine_followup', notes?: string): ClinicalVisit | null => {
    const today = getDhakaTodayDateString();
    
    // Safe patient record isolation: if starting visit for a patient different from active in-memory patient
    let currentRecord: PatientRecord;
    const isDifferentPatient = Boolean(patientId && patient.id && patient.id !== patientId);
    
    if (isDifferentPatient) {
      const match = savedPatients.find(p => p.patient.id === patientId);
      if (!match) {
        console.error('[New Visit Error] Target patient not found in saved patients:', patientId);
        return null;
      }
      currentRecord = migratePatientRecord(match);
    } else {
      currentRecord = {
        schema_version: CURRENT_SCHEMA_VERSION,
        patient,
        visits,
        clinical_visits: clinicalVisits,
        follow_up_appointments: followUpAppointments,
        visit_snapshots: visitSnapshots,
        progress_reports: progressReports,
        current_diet_chart: dietChart,
        current_supplements: candidateSupplements,
        timeline: dniResult.timeline,
        updated_at: new Date().toISOString()
      };
    }

    const tx = savePatientTransaction({
      currentRecord,
      storageEngine: safeStorage,
      action: {
        type: 'START_NEW_VISIT',
        payload: {
          visitType,
          visitDate: today,
          notes
        }
      },
      savedPatientsList: savedPatients
    });

    if (!tx.success || !tx.newVisit) {
      console.error('[New Visit Error] Failed to persist new visit transaction:', tx.error);
      return null;
    }

    if (isDifferentPatient) {
      setVisits(tx.committedRecord.visits || []);
      setFollowUpAppointments(tx.committedRecord.follow_up_appointments || []);
      setVisitSnapshots(tx.committedRecord.visit_snapshots || []);
      setProgressReports(tx.committedRecord.progress_reports || []);
      setCurrentProgressReport(tx.committedRecord.progress_reports?.[0] || null);
      setDietChart(tx.committedRecord.current_diet_chart || []);
      safeStorage.setItem('shuddho_active_patient_id', patientId);
    }

    setClinicalVisits(tx.committedRecord.clinical_visits || []);
    setCurrentVisit(tx.newVisit);
    setPatient(tx.committedRecord.patient);
    setR4Protocol(null);
    setWeeklyDietPlan(null);
    setActiveDayNumber(1);
    setSavedPatients(tx.committedPatientsList);
    setSelectedReportVisitId(tx.newVisit.visit_id || tx.newVisit.id || null);
    setPreviewP2AnalysisResult(null);

    invalidateP2Approval(`New visit initiated: ${tx.newVisit.visit_id}`);
    return tx.newVisit;
  }, [patient, visits, clinicalVisits, followUpAppointments, visitSnapshots, progressReports, dietChart, candidateSupplements, dniResult.timeline, savedPatients, invalidateP2Approval]);

  const selectReportVisit = useCallback((visitId: string) => {
    const match = clinicalVisits.find(v => v.visit_id === visitId || v.id === visitId);
    if (!match) return;

    // Report preview only: maintain report-specific visit ID without mutating active consultation state
    const targetVisitId = match.visit_id || match.id || null;
    setSelectedReportVisitId(targetVisitId);

    const isCurrentActiveVisit = Boolean(
      (patient.current_visit_id && (targetVisitId === patient.current_visit_id)) ||
      (!patient.current_visit_id && currentVisit && (targetVisitId === currentVisit.visit_id || targetVisitId === currentVisit.id))
    );

    if (isCurrentActiveVisit) {
      setPreviewP2AnalysisResult(null);
      // Rehydrate active consultation p2 if null (e.g. fresh reload on report tab)
      if (!p2AnalysisResult && targetVisitId) {
        const activeKey = `shuddho_p2_analysis_${patient.id}_${targetVisitId}`;
        try {
          const savedP2 = safeStorage.getItem<P2AnalysisResult>(activeKey);
          if (savedP2) {
            setP2AnalysisResult(savedP2);
          } else {
            setP2AnalysisResult(runP2Analysis(patient));
          }
        } catch {
          setP2AnalysisResult(runP2Analysis(patient));
        }
      }
    } else {
      // Historical visit preview: load into previewP2AnalysisResult ONLY
      const p2Key = `shuddho_p2_analysis_${patient.id}_${targetVisitId}`;
      try {
        const savedP2 = safeStorage.getItem<P2AnalysisResult>(p2Key);
        setPreviewP2AnalysisResult(savedP2 || null);
      } catch {
        setPreviewP2AnalysisResult(null);
      }
      // CRITICAL: p2AnalysisResult is NEVER mutated when previewing a historical visit!
    }
  }, [clinicalVisits, patient, currentVisit, p2AnalysisResult]);

  const selectVisit = useCallback((visitId: string) => {
    const match = clinicalVisits.find(v => v.visit_id === visitId || v.id === visitId);
    if (!match) return;

    setCurrentVisit(match);
    const targetVisitId = match.visit_id || match.id || null;
    setSelectedReportVisitId(targetVisitId);
    const isCurrentActiveVisit = Boolean(
      (patient.current_visit_id && (targetVisitId === patient.current_visit_id)) ||
      (!patient.current_visit_id && match === clinicalVisits[0])
    );

    if (isCurrentActiveVisit) {
      setPreviewP2AnalysisResult(null);
      const p2Key = `shuddho_p2_analysis_${patient.id}_${targetVisitId}`;
      try {
        const savedP2 = safeStorage.getItem<P2AnalysisResult>(p2Key);
        if (savedP2) {
          setP2AnalysisResult(savedP2);
        } else {
          setP2AnalysisResult(runP2Analysis(patient));
        }
      } catch {
        setP2AnalysisResult(runP2Analysis(patient));
      }
    } else {
      // Historical visit: do not mutate active p2AnalysisResult
      const p2Key = `shuddho_p2_analysis_${patient.id}_${targetVisitId}`;
      try {
        const savedP2 = safeStorage.getItem<P2AnalysisResult>(p2Key);
        setPreviewP2AnalysisResult(savedP2 || null);
      } catch {
        setPreviewP2AnalysisResult(null);
      }
    }
  }, [clinicalVisits, patient]);

  const completeCurrentVisit = useCallback((summary?: string) => {
    if (!currentVisit) return;
    const visitId = currentVisit.visit_id || currentVisit.id || '';
    const updatedVisits = completeVisitTransition(clinicalVisits, visitId, summary);
    const completed = updatedVisits.find(v => v.visit_id === visitId || v.id === visitId) || null;

    const currentRecord: PatientRecord = {
      schema_version: CURRENT_SCHEMA_VERSION,
      patient,
      visits,
      clinical_visits: updatedVisits,
      follow_up_appointments: followUpAppointments,
      visit_snapshots: visitSnapshots,
      progress_reports: progressReports,
      current_diet_chart: dietChart,
      current_supplements: candidateSupplements,
      timeline: dniResult.timeline,
      updated_at: new Date().toISOString()
    };

    const tx = savePatientTransaction({
      currentRecord,
      storageEngine: safeStorage,
      action: { type: 'SAVE_RECORD', payload: { clinical_visits: updatedVisits } },
      savedPatientsList: savedPatients
    });

    if (tx.success) {
      setCurrentVisit(completed);
      setClinicalVisits(updatedVisits);
      setSavedPatients(tx.committedPatientsList);
    } else {
      console.error('[Complete Visit Error] Failed to persist visit completion:', tx.error);
    }
  }, [currentVisit, clinicalVisits, patient, visits, followUpAppointments, visitSnapshots, progressReports, dietChart, candidateSupplements, dniResult.timeline, savedPatients]);

  // Follow-Up Appointments Management (Transactional & Persistent - Persist-First Lifecycle)
  const scheduleFollowUp = useCallback((
    appointmentData: Omit<FollowUpAppointment, 'id' | 'appointment_id' | 'created_at' | 'status'> & { appointment_id?: string; status?: AppointmentStatus }
  ): FollowUpAppointment | null => {
    const targetPatientId = appointmentData.patient_id;
    if (!targetPatientId) {
      console.error('[scheduleFollowUp] Missing patient_id');
      return null;
    }

    const newAptId = appointmentData.appointment_id || generateCollisionResistantId(`apt_${targetPatientId}`);
    const rawStatus = appointmentData.status || (appointmentData.scheduled_date === getDhakaTodayDateString() ? 'due_today' : 'scheduled');
    const tempApt: FollowUpAppointment = {
      ...appointmentData,
      appointment_id: newAptId,
      id: newAptId,
      appointment_type: appointmentData.appointment_type || 'routine_followup',
      reason: appointmentData.reason || appointmentData.reason_en || 'Routine follow-up',
      created_at: new Date().toISOString(),
      status: rawStatus
    };
    const refreshed = refreshAppointmentStatus(tempApt);

    const isCurrent = targetPatientId === patient.id;
    const targetPatient = isCurrent ? {
      schema_version: CURRENT_SCHEMA_VERSION,
      patient,
      visits,
      clinical_visits: clinicalVisits,
      follow_up_appointments: followUpAppointments,
      visit_snapshots: visitSnapshots,
      progress_reports: progressReports,
      current_diet_chart: dietChart,
      current_supplements: candidateSupplements,
      timeline: dniResult.timeline,
      updated_at: new Date().toISOString()
    } : savedPatients.find(p => p.patient.id === targetPatientId);

    if (!targetPatient) {
      console.error('[scheduleFollowUp] Target patient not found:', targetPatientId);
      return null;
    }

    const nextApts = [refreshed, ...(targetPatient.follow_up_appointments || []).filter(a => a.appointment_id !== newAptId && a.id !== newAptId)];

    // Persist FIRST before mutating React state
    const tx = savePatientTransaction({
      currentRecord: targetPatient,
      storageEngine: safeStorage,
      action: {
        type: 'SAVE_RECORD',
        payload: { follow_up_appointments: nextApts }
      },
      savedPatientsList: savedPatients
    });

    if (!tx.success) {
      console.error('[scheduleFollowUp] Storage persistence failed:', tx.error);
      return null;
    }

    // React state updated ONLY after persistence succeeds
    setSavedPatients(tx.committedPatientsList);
    if (isCurrent) {
      setFollowUpAppointments(nextApts);
    }

    return refreshed;
  }, [patient, visits, clinicalVisits, followUpAppointments, visitSnapshots, progressReports, dietChart, candidateSupplements, dniResult.timeline, savedPatients]);

  const rescheduleFollowUp = useCallback((appointmentId: string, newDate: string, newTime?: string, reason?: string): boolean => {
    if (!appointmentId || !newDate) return false;

    // Find patient record owning this appointment
    const isCurrent = followUpAppointments.some(a => a.appointment_id === appointmentId || a.id === appointmentId);
    let targetPatient: PatientRecord | undefined;

    if (isCurrent) {
      targetPatient = {
        schema_version: CURRENT_SCHEMA_VERSION,
        patient,
        visits,
        clinical_visits: clinicalVisits,
        follow_up_appointments: followUpAppointments,
        visit_snapshots: visitSnapshots,
        progress_reports: progressReports,
        current_diet_chart: dietChart,
        current_supplements: candidateSupplements,
        timeline: dniResult.timeline,
        updated_at: new Date().toISOString()
      };
    } else {
      targetPatient = savedPatients.find(p => (p.follow_up_appointments || []).some(a => a.appointment_id === appointmentId || a.id === appointmentId));
    }

    if (!targetPatient) {
      console.error('[rescheduleFollowUp] Target patient/appointment not found:', appointmentId);
      return false;
    }

    const apt = (targetPatient.follow_up_appointments || []).find(a => a.appointment_id === appointmentId || a.id === appointmentId);
    if (!apt) return false;
    if (apt.status === 'cancelled' || apt.status === 'completed') {
      console.error(`[rescheduleFollowUp] Cannot reschedule ${apt.status} appointment:`, appointmentId);
      return false;
    }

    const historyEntry = {
      previous_date: apt.scheduled_date,
      previous_time: apt.scheduled_time,
      rescheduled_at: new Date().toISOString(),
      reason
    };
    const updatedApt: FollowUpAppointment = {
      ...apt,
      scheduled_date: newDate,
      scheduled_time: newTime || apt.scheduled_time,
      rescheduled_from: apt.scheduled_date,
      status: 'rescheduled',
      notes: reason ? `${apt.notes ? apt.notes + ' | ' : ''}Rescheduled: ${reason}` : apt.notes,
      clinician_notes: reason ? `${apt.clinician_notes ? apt.clinician_notes + ' | ' : ''}Rescheduled: ${reason}` : apt.clinician_notes,
      rescheduled_history: [...(apt.rescheduled_history || []), historyEntry]
    };
    const refreshed = refreshAppointmentStatus(updatedApt);
    const updatedApts = (targetPatient.follow_up_appointments || []).map(a => 
      (a.appointment_id === appointmentId || a.id === appointmentId) ? refreshed : a
    );

    // Persist FIRST before mutating React state
    const tx = savePatientTransaction({
      currentRecord: targetPatient,
      storageEngine: safeStorage,
      action: {
        type: 'SAVE_RECORD',
        payload: { follow_up_appointments: updatedApts }
      },
      savedPatientsList: savedPatients
    });

    if (!tx.success) {
      console.error('[rescheduleFollowUp] Storage write failed:', tx.error);
      return false;
    }

    setSavedPatients(tx.committedPatientsList);
    if (targetPatient.patient.id === patient.id) {
      setFollowUpAppointments(updatedApts);
    }
    return true;
  }, [patient, visits, clinicalVisits, followUpAppointments, visitSnapshots, progressReports, dietChart, candidateSupplements, dniResult.timeline, savedPatients]);

  const cancelFollowUp = useCallback((appointmentId: string, reason?: string): boolean => {
    if (!appointmentId) return false;

    const isCurrent = followUpAppointments.some(a => a.appointment_id === appointmentId || a.id === appointmentId);
    let targetPatient: PatientRecord | undefined;

    if (isCurrent) {
      targetPatient = {
        schema_version: CURRENT_SCHEMA_VERSION,
        patient,
        visits,
        clinical_visits: clinicalVisits,
        follow_up_appointments: followUpAppointments,
        visit_snapshots: visitSnapshots,
        progress_reports: progressReports,
        current_diet_chart: dietChart,
        current_supplements: candidateSupplements,
        timeline: dniResult.timeline,
        updated_at: new Date().toISOString()
      };
    } else {
      targetPatient = savedPatients.find(p => (p.follow_up_appointments || []).some(a => a.appointment_id === appointmentId || a.id === appointmentId));
    }

    if (!targetPatient) {
      console.error('[cancelFollowUp] Target patient/appointment not found:', appointmentId);
      return false;
    }

    const apt = (targetPatient.follow_up_appointments || []).find(a => a.appointment_id === appointmentId || a.id === appointmentId);
    if (!apt) return false;
    if (apt.status === 'cancelled' || apt.status === 'completed') {
      console.error(`[cancelFollowUp] Cannot cancel ${apt.status} appointment:`, appointmentId);
      return false;
    }

    const updatedApt: FollowUpAppointment = {
      ...apt,
      status: 'cancelled',
      cancellation_reason: reason || 'Cancelled by clinician'
    };
    const updatedApts = (targetPatient.follow_up_appointments || []).map(a => 
      (a.appointment_id === appointmentId || a.id === appointmentId) ? updatedApt : a
    );

    // Persist FIRST before mutating React state
    const tx = savePatientTransaction({
      currentRecord: targetPatient,
      storageEngine: safeStorage,
      action: {
        type: 'SAVE_RECORD',
        payload: { follow_up_appointments: updatedApts }
      },
      savedPatientsList: savedPatients
    });

    if (!tx.success) {
      console.error('[cancelFollowUp] Storage write failed:', tx.error);
      return false;
    }

    setSavedPatients(tx.committedPatientsList);
    if (targetPatient.patient.id === patient.id) {
      setFollowUpAppointments(updatedApts);
    }
    return true;
  }, [patient, visits, clinicalVisits, followUpAppointments, visitSnapshots, progressReports, dietChart, candidateSupplements, dniResult.timeline, savedPatients]);

  const completeFollowUp = useCallback((appointmentId: string, actualVisitId?: string): boolean => {
    if (!appointmentId) return false;

    const isCurrent = followUpAppointments.some(a => a.appointment_id === appointmentId || a.id === appointmentId);
    let targetPatient: PatientRecord | undefined;

    if (isCurrent) {
      targetPatient = {
        schema_version: CURRENT_SCHEMA_VERSION,
        patient,
        visits,
        clinical_visits: clinicalVisits,
        follow_up_appointments: followUpAppointments,
        visit_snapshots: visitSnapshots,
        progress_reports: progressReports,
        current_diet_chart: dietChart,
        current_supplements: candidateSupplements,
        timeline: dniResult.timeline,
        updated_at: new Date().toISOString()
      };
    } else {
      targetPatient = savedPatients.find(p => (p.follow_up_appointments || []).some(a => a.appointment_id === appointmentId || a.id === appointmentId));
    }

    if (!targetPatient) {
      console.error('[completeFollowUp] Target patient/appointment not found:', appointmentId);
      return false;
    }

    const apt = (targetPatient.follow_up_appointments || []).find(a => a.appointment_id === appointmentId || a.id === appointmentId);
    if (!apt) return false;
    if (apt.status === 'cancelled') {
      console.error('[completeFollowUp] Cannot complete cancelled appointment:', appointmentId);
      return false;
    }

    let visitIdToLink = actualVisitId || apt.actual_visit_id;
    if (!visitIdToLink && targetPatient.patient.id === patient.id) {
      visitIdToLink = currentVisit?.visit_id || currentVisit?.id;
    }

    // Prevent cross-patient linkage: verify visit belongs to target patient
    if (visitIdToLink) {
      const visitBelongsToPatient = (targetPatient.clinical_visits || []).some(
        v => (v.visit_id === visitIdToLink || v.id === visitIdToLink) && v.patient_id === targetPatient.patient.id
      );
      if (!visitBelongsToPatient) {
        console.error(`[completeFollowUp] Cross-patient linkage rejected: visit ${visitIdToLink} does not belong to patient ${targetPatient.patient.id}`);
        return false;
      }
    }

    const updatedApt: FollowUpAppointment = {
      ...apt,
      status: 'completed',
      actual_visit_id: visitIdToLink || apt.actual_visit_id,
      completed_visit_id: visitIdToLink || apt.actual_visit_id
    };
    const updatedApts = (targetPatient.follow_up_appointments || []).map(a => 
      (a.appointment_id === appointmentId || a.id === appointmentId) ? updatedApt : a
    );

    // Persist FIRST before mutating React state
    const tx = savePatientTransaction({
      currentRecord: targetPatient,
      storageEngine: safeStorage,
      action: {
        type: 'SAVE_RECORD',
        payload: { follow_up_appointments: updatedApts }
      },
      savedPatientsList: savedPatients
    });

    if (!tx.success) {
      console.error('[completeFollowUp] Storage write failed:', tx.error);
      return false;
    }

    setSavedPatients(tx.committedPatientsList);
    if (targetPatient.patient.id === patient.id) {
      setFollowUpAppointments(updatedApts);
    }
    return true;
  }, [patient, currentVisit, visits, clinicalVisits, followUpAppointments, visitSnapshots, progressReports, dietChart, candidateSupplements, dniResult.timeline, savedPatients]);

  // FIX 1: Atomic Consultation Creation & Appointment Linkage
  const startFollowUpConsultation = useCallback((appointmentId: string, targetPatientId: string): ClinicalVisit | null => {
    if (!appointmentId || !targetPatientId) {
      console.error('[startFollowUpConsultation] Missing appointmentId or targetPatientId');
      return null;
    }

    // 1. Flush/save active patient if switching away to another patient, preventing unsaved data loss
    let freshSavedPatients = savedPatients;
    const isDifferentPatient = Boolean(patient && patient.id && patient.id !== targetPatientId);

    if (isDifferentPatient) {
      const activeRecordToFlush: PatientRecord = {
        schema_version: CURRENT_SCHEMA_VERSION,
        patient,
        visits,
        clinical_visits: clinicalVisits,
        follow_up_appointments: followUpAppointments,
        visit_snapshots: visitSnapshots,
        progress_reports: progressReports,
        current_diet_chart: dietChart,
        current_supplements: candidateSupplements,
        timeline: dniResult.timeline,
        updated_at: new Date().toISOString()
      };
      const flushTx = savePatientTransaction({
        currentRecord: activeRecordToFlush,
        storageEngine: safeStorage,
        action: { type: 'SAVE_RECORD' },
        savedPatientsList: savedPatients
      });
      if (!flushTx.success) {
        console.error('[startFollowUpConsultation] Failed to save active patient before switching:', flushTx.error);
        return null; // A failed save prevents unsafe switching and visit creation!
      }
      freshSavedPatients = flushTx.committedPatientsList;
    }

    // 2. Locate target patient record
    let targetRecord: PatientRecord | undefined;
    if (!isDifferentPatient) {
      targetRecord = {
        schema_version: CURRENT_SCHEMA_VERSION,
        patient,
        visits,
        clinical_visits: clinicalVisits,
        follow_up_appointments: followUpAppointments,
        visit_snapshots: visitSnapshots,
        progress_reports: progressReports,
        current_diet_chart: dietChart,
        current_supplements: candidateSupplements,
        timeline: dniResult.timeline,
        updated_at: new Date().toISOString()
      };
    } else {
      targetRecord = freshSavedPatients.find(p => p.patient.id === targetPatientId);
    }

    if (!targetRecord) {
      console.error('[startFollowUpConsultation] Target patient record not found:', targetPatientId);
      return null;
    }

    // 3. Execute authoritative atomic transaction for consultation creation & appointment linkage
    const tx = savePatientTransaction({
      currentRecord: targetRecord,
      storageEngine: safeStorage,
      action: {
        type: 'START_CONSULTATION_FOR_APPOINTMENT',
        payload: {
          appointmentId,
          visitType: 'routine_followup',
          notes: `Follow-up from appointment ${appointmentId}`
        }
      },
      savedPatientsList: freshSavedPatients
    });

    if (!tx.success || !tx.newVisit) {
      console.error('[startFollowUpConsultation] Transaction failed:', tx.error);
      return null;
    }

    // 4. Update React state ONLY after persistence succeeds!
    setSavedPatients(tx.committedPatientsList);
    safeStorage.setItem('shuddho_active_patient_id', targetPatientId);

    setPatient(tx.committedRecord.patient);
    setVisits(tx.committedRecord.visits || []);
    setClinicalVisits(tx.committedRecord.clinical_visits || []);
    setCurrentVisit(tx.newVisit);
    setFollowUpAppointments(tx.committedRecord.follow_up_appointments || []);
    setVisitSnapshots(tx.committedRecord.visit_snapshots || []);
    setProgressReports(tx.committedRecord.progress_reports || []);
    setCurrentProgressReport(tx.committedRecord.progress_reports?.[0] || null);
    setDietChart(tx.committedRecord.current_diet_chart || []);
    setWeeklyDietPlan(null);
    setActiveDayNumber(1);
    if (tx.committedRecord.current_supplements && tx.committedRecord.current_supplements.length > 0) {
      setCandidateSupplements(tx.committedRecord.current_supplements);
    }
    setCurrentClinicalAssessment(null);
    setSelectedReportVisitId(null);
    setPreviewP2AnalysisResult(null);
    invalidateP2Approval(`Follow-up consultation started: ${tx.newVisit.visit_id}`);

    return tx.newVisit;
  }, [patient, visits, clinicalVisits, followUpAppointments, visitSnapshots, progressReports, dietChart, candidateSupplements, dniResult.timeline, savedPatients, invalidateP2Approval]);

  // Dedicated Follow-Up Visit Recording (Atomic Transaction & Snapshot)
  const logFollowUpConsultation = useCallback((payload: {
    weight_kg: number;
    waist_cm: number;
    whtr?: number;
    bristol_stool: number;
    energy_score: number;
    symptom_relief_pct: number;
    clinical_observations?: string;
    notes?: string;
  }): boolean => {
    const today = getDhakaTodayDateString();
    const isCurrentlyBaseline = !currentVisit || currentVisit.is_baseline || currentVisit.visit_type === 'baseline_consultation';

    let followUpVisit: ClinicalVisit;
    let nextClinicalVisits: ClinicalVisit[];

    if (isCurrentlyBaseline) {
      const followUpVisitId = generateCollisionResistantId(`vis_${patient.id}`);
      followUpVisit = {
        visit_id: followUpVisitId,
        id: followUpVisitId,
        patient_id: patient.id,
        visit_number: (clinicalVisits.length || 0) + 1,
        visit_type: 'routine_followup',
        visit_date: today,
        created_at: new Date().toISOString(),
        status: 'completed',
        notes: payload.notes || 'Routine follow-up consultation logged.',
        clinical_notes: payload.notes,
        clinical_summary: payload.clinical_observations,
        is_baseline: false
      };
      nextClinicalVisits = [...clinicalVisits, followUpVisit];
    } else {
      followUpVisit = currentVisit;
      nextClinicalVisits = clinicalVisits;
    }

    const targetVisitId = followUpVisit.visit_id || followUpVisit.id || generateCollisionResistantId(`vis_${patient.id}`);

    // Create the follow-up snapshot using the explicit observation payload
    const followUpSnapshot = createClinicalSnapshot({
      patient: { ...patient, current_visit_id: targetVisitId },
      visitId: targetVisitId,
      visitType: 'routine_followup',
      isBaseline: false,
      approvalStatus: 'draft',
      clinicalObservationsPayload: {
        weight_kg: payload.weight_kg,
        waist_cm: payload.waist_cm,
        whtr: payload.whtr,
        bristol_stool_score: payload.bristol_stool,
        energy_score: payload.energy_score,
        notes: payload.notes
      }
    });

    const nextSnapshots = appendSnapshotWithRevisionPolicy(visitSnapshots, followUpSnapshot);

    const newLongitudinalVisit: LongitudinalVisit = {
      visit_id: targetVisitId,
      visit_date: today,
      phase: patient.current_phase || 1,
      weight_kg: payload.weight_kg,
      waist_cm: payload.waist_cm,
      whtr: payload.whtr || (patient.height_cm > 0 ? Math.round((payload.waist_cm / patient.height_cm) * 100) / 100 : 0),
      bristol_stool: payload.bristol_stool,
      energy_score: payload.energy_score,
      symptom_relief_pct: payload.symptom_relief_pct,
      clinical_observations: payload.clinical_observations,
      notes_bn: payload.notes || 'নিয়মিত ফলো-আপ ভিজিট সম্পন্ন; সাধারণ স্বাস্থ্য অগ্রগতি রেকর্ড করা হয়েছে।',
      notes_en: payload.notes || 'Routine follow-up consultation logged.'
    };
    const nextVisits = [...visits, newLongitudinalVisit];

    const updatedPatient: PatientProfile = {
      ...patient,
      current_visit_id: targetVisitId,
      weight_kg: payload.weight_kg,
      waist_cm: payload.waist_cm,
      gut_profile: {
        ...patient.gut_profile,
        bristol_stool_score: payload.bristol_stool,
        energy_score: payload.energy_score
      }
    };

    const tx = savePatientTransaction({
      currentRecord: {
        schema_version: CURRENT_SCHEMA_VERSION,
        patient: updatedPatient,
        visits: nextVisits,
        clinical_visits: nextClinicalVisits,
        follow_up_appointments: followUpAppointments,
        visit_snapshots: nextSnapshots,
        progress_reports: progressReports,
        current_diet_chart: dietChart,
        current_supplements: candidateSupplements,
        timeline: dniResult.timeline,
        updated_at: new Date().toISOString()
      },
      storageEngine: safeStorage,
      action: { type: 'SAVE_RECORD' },
      savedPatientsList: savedPatients
    });

    if (!tx.success) {
      console.error('[Follow-Up Save Error] Transaction failed:', tx.error);
      return false;
    }

    setClinicalVisits(nextClinicalVisits);
    setCurrentVisit(followUpVisit);
    setVisitSnapshots(nextSnapshots);
    setVisits(nextVisits);
    setPatient(updatedPatient);
    setSavedPatients(tx.committedPatientsList);
    invalidateP2Approval(`Follow-up visit logged: ${targetVisitId}`);
    return true;
  }, [currentVisit, patient, clinicalVisits, visitSnapshots, visits, followUpAppointments, progressReports, dietChart, candidateSupplements, dniResult.timeline, savedPatients, invalidateP2Approval]);

  // Visit Snapshots
  const captureVisitSnapshot = useCallback((
    isBaseline: boolean = false, 
    amendmentReason?: string,
    clinicalObservationsPayload?: ClinicalObservationsPayload
  ): ClinicalVisitSnapshot => {
    const visitId = patient.current_visit_id || currentVisit?.visit_id || currentVisit?.id || generateCollisionResistantId(`vis_${patient.id}`);
    const snapshot = createClinicalSnapshot({
      patient,
      visitId,
      visitType: currentVisit?.visit_type || (isBaseline ? 'baseline_consultation' : 'routine_followup'),
      isBaseline,
      approvalStatus: p2AnalysisResult?.report?.isApproved ? 'approved' : 'draft',
      approvedBy: p2AnalysisResult?.report?.approvedBy,
      relatedAssessmentId: currentClinicalAssessment?.assessment_id,
      amendmentReason,
      clinicalSafetyEvaluation,
      p2AnalysisResult,
      clinicalObservationsPayload
    });

    setVisitSnapshots(prev => appendSnapshotWithRevisionPolicy(prev, snapshot));

    // When explicit observations are provided and it relates to current visit, update active patient profile
    if (clinicalObservationsPayload && (visitId === patient.current_visit_id || !patient.current_visit_id)) {
      setPatient(prev => ({
        ...prev,
        weight_kg: clinicalObservationsPayload.weight_kg ?? prev.weight_kg,
        waist_cm: clinicalObservationsPayload.waist_cm ?? prev.waist_cm,
        gut_profile: {
          ...prev.gut_profile,
          bloating: clinicalObservationsPayload.bloating_severity ?? prev.gut_profile.bloating,
          acid_reflux_hypoacidity: clinicalObservationsPayload.acid_reflux_present ?? prev.gut_profile.acid_reflux_hypoacidity,
          bristol_stool_score: clinicalObservationsPayload.bristol_stool_score ?? prev.gut_profile.bristol_stool_score,
          energy_score: clinicalObservationsPayload.energy_score ?? prev.gut_profile.energy_score
        }
      }));
    }

    return snapshot;
  }, [patient, currentVisit, p2AnalysisResult, currentClinicalAssessment, clinicalSafetyEvaluation]);

  // Longitudinal Progress Reports
  const generateProgressReport = useCallback((
    baselineVisitId: string,
    comparisonVisitId: string,
    comparisonMode: 'baseline_vs_current' | 'previous_vs_current' | 'selected_pair' | 'trend_series' = 'baseline_vs_current'
  ): ComparativeProgressReport | null => {
    if (baselineVisitId === comparisonVisitId) {
      console.warn('[ProgressReport] Comparison rejected: baseline and comparison visit are identical');
      return null;
    }

    const baselineSnap = getLatestVisitSnapshot(visitSnapshots, baselineVisitId);
    const compSnap = getLatestVisitSnapshot(visitSnapshots, comparisonVisitId);

    if (!baselineSnap) {
      console.warn('[ProgressReport] Comparison rejected: missing baseline snapshot for visit', baselineVisitId);
      return null;
    }

    if (!compSnap) {
      console.warn('[ProgressReport] Comparison rejected: missing comparison snapshot for visit', comparisonVisitId);
      return null;
    }

    // Cross-patient contamination check
    if (baselineSnap.patient_id !== patient.id || compSnap.patient_id !== patient.id) {
      console.error('[ProgressReport] Cross-patient contamination detected between snapshots and patient profile');
      return null;
    }

    const mode = comparisonMode === 'selected_pair' ? 'selected_vs_selected' : (comparisonMode === 'trend_series' ? 'multi_visit_trend' : comparisonMode);
    const analysis = executeLongitudinalComparison({
      patient,
      baselineSnapshot: baselineSnap,
      comparisonSnapshot: compSnap,
      comparisonMode: mode,
      allSnapshots: visitSnapshots,
    });

    const report = buildComparativeProgressReport({
      patient,
      baselineSnapshot: baselineSnap,
      comparisonSnapshot: compSnap,
      analysis,
    });

    setCurrentProgressReport(report);
    setProgressReports(prev => [report, ...prev.filter(r => r.report_id !== report.report_id)]);
    return report;
  }, [visitSnapshots, patient]);

  const selectProgressReport = useCallback((reportId: string) => {
    const match = progressReports.find(r => r.report_id === reportId);
    if (match) {
      setCurrentProgressReport(match);
    }
  }, [progressReports]);

  const approveProgressReport = useCallback((reportId: string, clinicianId: string, notes?: string): boolean => {
    if (!validateClinicianCredentials(clinicianId)) {
      console.warn('Progress report approval rejected: Invalid licensed clinician ID.');
      return false;
    }
    const trimmed = clinicianId.trim();

    const targetReport = progressReports.find(r => r.report_id === reportId);
    if (!targetReport) {
      console.warn('Progress report approval rejected: Target report not found:', reportId);
      return false;
    }

    const timestamp = new Date().toISOString();
    const updatedReport: ComparativeProgressReport = {
      ...targetReport,
      is_approved: true,
      approved_by: trimmed,
      approval_date: timestamp,
      sectionL_nutritionistReview: {
        ...targetReport.sectionL_nutritionistReview,
        status: 'fully_approved',
        reviewing_nutritionist: trimmed,
        review_date: timestamp.split('T')[0],
        notes: notes || targetReport.sectionL_nutritionistReview?.notes || '',
      },
      section_l_clinician_signoff: {
        is_approved: true,
        clinician_name: trimmed,
        signoff_date: timestamp.split('T')[0],
        notes: notes || targetReport.section_l_clinician_signoff?.notes || ''
      }
    };

    const updatedReports = progressReports.map(r => r.report_id === reportId ? updatedReport : r);

    const currentRecord: PatientRecord = {
      schema_version: CURRENT_SCHEMA_VERSION,
      patient,
      visits,
      clinical_visits: clinicalVisits,
      follow_up_appointments: followUpAppointments,
      visit_snapshots: visitSnapshots,
      progress_reports: updatedReports,
      current_diet_chart: dietChart,
      current_supplements: candidateSupplements,
      timeline: dniResult.timeline,
      updated_at: new Date().toISOString()
    };

    const tx = savePatientTransaction({
      currentRecord,
      storageEngine: safeStorage,
      action: {
        type: 'SAVE_RECORD',
        payload: { progress_reports: updatedReports }
      },
      savedPatientsList: savedPatients
    });

    if (!tx.success) {
      console.error('Failed to persist progress report approval into patient aggregate:', tx.error);
      return false;
    }

    const storageKey = `shuddho_progress_report_${patient.id}_${reportId}`;
    const persisted = safeStorage.setItem(storageKey, updatedReport);
    if (!persisted) {
      console.error('Failed to persist progress report approval with write-back verification');
      // Roll back the aggregate record to preserve multi-key atomicity
      safeStorage.setItem('shuddho_saved_patients', savedPatients);
      return false;
    }

    setSavedPatients(tx.committedPatientsList);
    setProgressReports(updatedReports);
    if (currentProgressReport && currentProgressReport.report_id === reportId) {
      setCurrentProgressReport(updatedReport);
    }

    return true;
  }, [progressReports, currentProgressReport, patient, visits, clinicalVisits, followUpAppointments, visitSnapshots, dietChart, candidateSupplements, dniResult.timeline, savedPatients]);

  const loadDemoPatient = useCallback(() => {
    const seed = createInitialSeedPatient();
    const baseVisitId = `vis_${seed.id}_initial`;
    const followUpVisitId = `vis_${seed.id}_fup1`;
    const today = getDhakaTodayDateString();

    const visit1: ClinicalVisit = {
      visit_id: baseVisitId,
      id: baseVisitId,
      patient_id: seed.id,
      visit_number: 1,
      visit_type: 'baseline_consultation',
      visit_date: '2026-10-15',
      created_at: '2026-10-15T10:00:00Z',
      status: 'completed',
      clinical_summary: 'Initial consultation: MetS, T2D, Hypothyroid, Fatty Liver.'
    };

    const visit2: ClinicalVisit = {
      visit_id: followUpVisitId,
      id: followUpVisitId,
      patient_id: seed.id,
      visit_number: 2,
      visit_type: 'routine_followup',
      visit_date: today,
      created_at: new Date().toISOString(),
      status: 'in_progress',
      notes: '1-Month Follow-Up: Reviewing symptom relief, Bristol stool improvement, and weight reduction.'
    };

    const apptToday: FollowUpAppointment = {
      appointment_id: `apt_${seed.id}_01`,
      id: `apt_${seed.id}_01`,
      patient_id: seed.id,
      scheduled_date: today,
      scheduled_time: '11:00 AM',
      reason: '1-Month Dietary Compliance and Glycemic Review',
      reason_en: '1-Month Dietary Compliance and Glycemic Review',
      reason_bn: '১ মাস পর খাদ্যতালিকা অনুসরণ ও রক্তে শর্করার মাত্রা পর্যালোচনা',
      appointment_type: 'routine_followup',
      status: 'due_today',
      created_at: '2026-10-15T10:30:00Z'
    };

    const seedPatient: PatientProfile = {
      ...seed,
      current_visit_id: followUpVisitId,
      visit_date: today
    };

    const snap1: ClinicalVisitSnapshot = {
      snapshot_id: `snap_${seed.id}_initial`,
      visit_id: baseVisitId,
      patient_id: seed.id,
      visit_date: '2026-10-15',
      created_at: '2026-10-15T10:15:00Z',
      is_baseline: true,
      anthropometrics: {
        weight_kg: 78,
        height_cm: seed.height_cm,
        bmi: 33.8,
        waist_cm: 94,
        whtr: 0.62
      },
      biomarkers: {
        hba1c: 7.4,
        fasting_blood_glucose: 126,
        tsh: 4.2
      },
      gut_metrics: {
        bristol_stool_score: 2,
        energy_score: 4,
        bloating_severity: 3
      },
      symptoms: {
        bristol_stool: 2,
        energy_score: 4
      }
    };

    const snap2: ClinicalVisitSnapshot = {
      snapshot_id: `snap_${seed.id}_fup1`,
      visit_id: followUpVisitId,
      patient_id: seed.id,
      visit_date: today,
      created_at: new Date().toISOString(),
      is_baseline: false,
      anthropometrics: {
        weight_kg: 74,
        height_cm: seed.height_cm,
        bmi: 32.0,
        waist_cm: 90,
        whtr: 0.59
      },
      biomarkers: {
        hba1c: 6.8,
        fasting_blood_glucose: 114,
        tsh: 3.8
      },
      gut_metrics: {
        bristol_stool_score: 4,
        energy_score: 7,
        bloating_severity: 1
      },
      symptoms: {
        bristol_stool: 4,
        energy_score: 7
      }
    };

    const freshTrafficLight = resolveConflicts(
      allFoods,
      seedPatient.selected_conditions,
      allMedicines.filter(m => seedPatient.active_medications.includes(m.id)),
      seedPatient.confirmed_allergies,
      seedPatient.clinician_disallowed_foods,
      seedPatient.clinician_disallowed_tags,
      seedPatient.current_phase
    );
    const demoDietChart = buildAutoScaledDietChart(seedPatient, allFoods, freshTrafficLight);

    const demoVisits: LongitudinalVisit[] = [
      {
        visit_id: baseVisitId,
        visit_date: '2026-10-15',
        phase: 1,
        weight_kg: 78,
        waist_cm: 94,
        whtr: 0.62,
        bristol_stool: 2,
        energy_score: 4,
        symptom_relief_pct: 0
      },
      {
        visit_id: followUpVisitId,
        visit_date: today,
        phase: 1,
        weight_kg: 74,
        waist_cm: 90,
        whtr: 0.59,
        bristol_stool: 4,
        energy_score: 7,
        symptom_relief_pct: 60
      }
    ];

    const p2 = runP2Analysis(seedPatient);
    const demoWeeklyPlan = generateWeeklyDietPlan(
      seedPatient,
      allFoods,
      freshTrafficLight,
      p2.p3PlanningContext
    );

    const demoRecord: PatientRecord = {
      schema_version: 2,
      patient: seedPatient,
      visits: demoVisits,
      clinical_visits: [visit2, visit1],
      follow_up_appointments: [apptToday],
      visit_snapshots: [snap2, snap1],
      progress_reports: [],
      current_diet_chart: demoDietChart,
      weekly_diet_plan: demoWeeklyPlan,
      current_supplements: [],
      timeline: [],
      created_at: '2026-10-15T10:00:00Z',
      updated_at: new Date().toISOString()
    };

    // Commit demo patient to safeStorage so KPIs and tables reflect it immediately
    const existingList = safeStorage.getItem<PatientRecord[]>('shuddho_saved_patients') || [];
    const updatedList = [demoRecord, ...existingList.filter(p => p.patient.id !== seed.id)];
    safeStorage.setItem('shuddho_saved_patients', updatedList);
    safeStorage.setItem('shuddho_active_patient_id', seed.id);
    safeStorage.setItem(`shuddho_weekly_plan_${seed.id}_${followUpVisitId}`, demoWeeklyPlan);

    const autoProtocol = generateAutomaticProtocolDraft(seedPatient);
    const demoR4Protocol: R4ProtocolStudioData = {
      ...autoProtocol,
      is_approved: true,
      approved_by: 'Dr. Shahriar Ahmed, Lead Nutritionist',
      approved_at: new Date().toISOString(),
      status: 'active',
      supplements: autoProtocol.supplements.map((s, idx) => ({
        ...s,
        approval_status: idx === 0 ? 'clinician_approved' : s.approval_status
      }))
    };

    // Persist demo R4 protocol under visit key BEFORE setPatient so loadProtocol useEffect does not overwrite it
    safeStorage.setItem(`shuddho_lifestyle_plan_${seed.id}_${followUpVisitId}`, demoR4Protocol);
    safeStorage.setItem(`shuddho_lifestyle_plan_${seed.id}`, demoR4Protocol);

    setPatient(seedPatient);
    setVisits(demoVisits);
    setClinicalVisits([visit2, visit1]);
    setCurrentVisit(visit2);
    setFollowUpAppointments([apptToday]);
    setVisitSnapshots([snap2, snap1]);
    setProgressReports([]);
    setSavedPatients(updatedList);
    setDietChart(demoDietChart);
    setWeeklyDietPlan(demoWeeklyPlan);
    setActiveDayNumber(1);
    setR5Medications((seedPatient.medication_records || []).map(normalizeMedicationRecord));
    setR4Protocol(demoR4Protocol);

    setP2AnalysisResult(p2);
    setCurrentClinicalAssessment(null);
    setSelectedReportVisitId(null);
    setPreviewP2AnalysisResult(null);
  }, [allFoods, allMedicines]);

  return (
    <PracticeContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        setTheme,
        activeTab,
        setActiveTab,
        allFoods,
        allMedicines,
        allSupplements,
        foodMap,
        patient,
        updatePatient,
        updateLabs,
        updateGutProfile,
        toggleCondition,
        toggleMedication,
        addConfirmedAllergy,
        removeConfirmedAllergy,
        addClinicianDisallowedFood,
        removeClinicianDisallowedFood,
        trafficLight,
        dniResult,
        overlapWarnings,
        candidateSupplements,
        approveCandidateSupplement,
        rejectCandidateSupplement,
        clinicalSafetyEvaluation,
        interventionApproval,
        interventionRevisions,
        lockState,
        approveCurrentIntervention,
        toggleItemLock,
        updateFeedingStatus,
        updateClinicalPathways,
        dietChart,
        isDietPlanDirty,
        recalculateDietPlan,
        dismissDirtyWarning,
        updateMealItemRawGrams,
        swapMealItemAlternative,
        removeMealItem,
        addMealItem,
        resetDietChartToAutoScaled,
        visits,
        addVisit,
        advancePatientPhase,
        clinicalVisits,
        currentVisit,
        followUpAppointments,
        visitSnapshots,
        progressReports,
        currentProgressReport,
        registerNewPatient,
        startNewVisit,
        selectVisit,
        selectedReportVisitId,
        selectReportVisit,
        completeCurrentVisit,
        scheduleFollowUp,
        rescheduleFollowUp,
        cancelFollowUp,
        completeFollowUp,
        startFollowUpConsultation,
        logFollowUpConsultation,
        captureVisitSnapshot,
        generateProgressReport,
        approveProgressReport,
        selectProgressReport,
        loadDemoPatient,
        savedPatients,
        saveCurrentPatient,
        loadPatient,
        createNewPatient,
        p2AnalysisResult,
        previewP2AnalysisResult,
        isAnalyzingP2,
        currentClinicalAssessment,
        executeP2Analysis,
        updateHypothesisDecision,
        approveP2Analysis,
        invalidateP2Approval,
        weeklyDietPlan,
        activeDayNumber,
        setActiveDayNumber,
        generateWeeklyPlan,
        regenerateDay,
        updateDayMealItemRawGrams,
        swapDayMealItemAlternative,
        removeDayMealItem,
        addDayMealItem,
        toggleDayLock,
        toggleMealLockInDay,
        toggleItemLockInDay,
        copyDayPlan,
        approveWeeklyPlan,
        weeklyPlanApprovalError,
        clearWeeklyPlanApprovalError,
        authState,
        setAuthState,
        authError,
        signOut,
        currentClinician,
        setCurrentClinician,
        syncStatus,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isAuditModalOpen,
        setIsAuditModalOpen,
        isMigrationModalOpen,
        setIsMigrationModalOpen,
        refreshSyncStatus,
        repository,
        clinicianUser,
        isInvitationModalOpen,
        setIsInvitationModalOpen,
        isReconciliationModalOpen,
        setIsReconciliationModalOpen,
        stagedSubmissionsCount,
        refreshStagedSubmissionsCount,
        r4Protocol,
        isR4ProtocolDirty,
        generateR4Draft,
        createManualR4Protocol,
        updateR4Protocol,
        saveR4Protocol,
        approveR4Protocol,
        r5Pathways,
        r5Medications,
        updateR5Pathways,
        updateR5Medications,
        syncR5ToR4Protocol,
        r5NutritionContract,
        reportStudioMode,
        setReportStudioMode,
        reportReleaseGate,
        setReportReleaseGate
      }}
    >
      {children}
      <ClinicianAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentClinician={currentClinician}
        onAuthSuccess={(clinician) => {
          setCurrentClinician(clinician);
          setAuthState('AUTHORIZED');
          refreshSyncStatus();
        }}
        onLogout={signOut}
      />
      <AuditHistoryModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        patientId={patient?.id}
      />
      <DataMigrationWizard
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
        onMigrationComplete={() => {
          refreshSyncStatus();
        }}
      />
      <ClinicianInvitationModal
        isOpen={isInvitationModalOpen}
        onClose={() => setIsInvitationModalOpen(false)}
      />
      <IntakeReconciliationModal
        isOpen={isReconciliationModalOpen}
        onClose={() => setIsReconciliationModalOpen(false)}
        onReconciliationComplete={() => {
          refreshStagedSubmissionsCount();
        }}
      />
    </PracticeContext.Provider>
  );
};

export const usePractice = () => {
  const context = useContext(PracticeContext);
  if (!context) throw new Error('usePractice must be used within PracticeProvider');
  return context;
};
