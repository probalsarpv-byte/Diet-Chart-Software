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
  ClinicalProgressPlanningContext
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
import { advanceToNextPhase, recordFollowUpVisit, TransitionOptions } from '@/engine/phaseProgression';
import { runP2Analysis } from '@/engine/p2';
import { P2AnalysisResult, ClinicianDecision } from '@/engine/p2/types';
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
  activeTab: 'dashboard' | 'patients' | 'assessment' | 'clinical_intelligence' | 'diet' | 'followup' | 'report' | 'intake' | 'conditions' | 'dni';
  setActiveTab: (tab: 'dashboard' | 'patients' | 'assessment' | 'clinical_intelligence' | 'diet' | 'followup' | 'report' | 'intake' | 'conditions' | 'dni') => void;

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
  isAnalyzingP2: boolean;
  currentClinicalAssessment: ClinicalAssessment | null;
  executeP2Analysis: (assessmentOrAnswers?: ClinicalAssessment | Record<string, any>) => P2AnalysisResult | null;
  updateHypothesisDecision: (hypothesisId: string, decision: ClinicianDecision, note?: string) => void;
  approveP2Analysis: (clinicianId: string, notes?: string) => boolean;
  invalidateP2Approval: (reason?: string) => void;
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'patients' | 'assessment' | 'clinical_intelligence' | 'diet' | 'followup' | 'report' | 'intake' | 'conditions' | 'dni'>('dashboard');

  const [patient, setPatient] = useState<PatientProfile>(createInitialSeedPatient);
  const [visits, setVisits] = useState<LongitudinalVisit[]>([]);
  const [clinicalVisits, setClinicalVisits] = useState<ClinicalVisit[]>([]);
  const [currentVisit, setCurrentVisit] = useState<ClinicalVisit | null>(null);
  const [followUpAppointments, setFollowUpAppointments] = useState<FollowUpAppointment[]>([]);
  const [visitSnapshots, setVisitSnapshots] = useState<ClinicalVisitSnapshot[]>([]);
  const [progressReports, setProgressReports] = useState<ComparativeProgressReport[]>([]);
  const [currentProgressReport, setCurrentProgressReport] = useState<ComparativeProgressReport | null>(null);
  const [dietChart, setDietChart] = useState<DietChartMeal[]>([]);
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
      const visitId = patient.current_visit_id || `visit_${patient.id}_${visitDateClean}`;
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
  }, [patient?.id, patient?.visit_date, patient?.current_visit_id]);

  // Load patient-isolated P2 analysis from LocalStorage
  useEffect(() => {
    if (!patient?.id) return;
    const visitDateClean = (patient.visit_date || '').replace(/[^0-9]/g, '');
    const visitId = patient.current_visit_id || `visit_${patient.id}_${visitDateClean}`;
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

      const result = runP2Analysis({
        patient,
        assessment: asmt,
        assessmentAnswers: answers,
        previousApprovals: p2AnalysisResult?.approvalHistory,
        isOverallApproved: Boolean(p2AnalysisResult?.report?.isApproved && !p2AnalysisResult?.analysisInvalidatedAt),
        approvedByClinicianId: p2AnalysisResult?.report?.approvedBy,
        approvalTimestamp: p2AnalysisResult?.report?.approvalDate,
        clinicianNotes: p2AnalysisResult?.report?.clinicianNotes,
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
    const visitId = patient.current_visit_id || `visit_${patient.id}_${visitDateClean}`;
    const storageKey = `shuddho_p2_analysis_${patient.id}_${visitId}`;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(updatedResult));
      }
    } catch (err) {
      console.warn('Failed to persist hypothesis decision:', err);
    }
  }, [patient, p2AnalysisResult]);

  const approveP2Analysis = useCallback((clinicianId: string, notes?: string): boolean => {
    if (!p2AnalysisResult) return false;

    // Strict validation of clinician identity: prohibit generic placeholders
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

    // Require complete relevant clinical safety review before final approval
    if (p2AnalysisResult.report.sectionK_clinicalSafety.hardStops.length > 0) {
      console.warn('Rejected P2 approval: Active clinical safety hard stops exist. Must be clinically resolved before sign-off.');
      return false;
    }

    // Require complete safety screening: allergies, medication reconciliation, feeding route, population risks, restrictions
    if (currentClinicalAssessment) {
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

    // Check if any prescribed nutrient restrictions are marked Yes but missing confirmed limits
    if (p2AnalysisResult.p3PlanningContext.prescriptions) {
      const unclarified = Object.values(p2AnalysisResult.p3PlanningContext.prescriptions).filter(p => p.requiresClarification);
      if (unclarified.length > 0) {
        console.warn('Rejected P2 approval: Prescribed nutrient restrictions require clarification before sign-off.');
        return false;
      }
    }

    const timestamp = new Date().toISOString();
    const updatedReport = {
      ...p2AnalysisResult.report,
      isApproved: true,
      approvedBy: trimmedId,
      approvalDate: timestamp,
      clinicianNotes: notes || p2AnalysisResult.report.clinicianNotes,
      analysisInvalidatedAt: undefined,
      invalidationReason: undefined,
      sectionN_clinicianReview: {
        ...p2AnalysisResult.report.sectionN_clinicianReview,
        status: 'fully_approved' as const,
        reviewingNutritionist: trimmedId,
        reviewDate: timestamp.split('T')[0],
        notes: notes || p2AnalysisResult.report.sectionN_clinicianReview.notes,
      },
    };

    const updatedP3Context = {
      ...p2AnalysisResult.p3PlanningContext,
      clinicalAssessmentApproved: true,
      approvedByClinicianId: trimmedId,
      approvalTimestamp: timestamp,
      analysisInvalidatedAt: undefined,
      invalidationReason: undefined,
    };

    const updatedResult: P2AnalysisResult = {
      ...p2AnalysisResult,
      analysisInvalidatedAt: undefined,
      report: updatedReport,
      p3PlanningContext: updatedP3Context,
      dietPlanningContext: updatedP3Context,
    };

    // CLINICAL AUDIT RULE (Approval Persistence):
    // Report successful approval only after a valid clinician review and successful persistence.
    // If saving fails, return false and do not claim approval succeeded or mutate state.
    const visitDateClean = (patient.visit_date || '').replace(/[^0-9]/g, '');
    const visitId = patient.current_visit_id || currentClinicalAssessment?.visit_id || `visit_${patient.id}_${visitDateClean}`;
    const storageKey = `shuddho_p2_analysis_${patient.id}_${visitId}`;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(storageKey, JSON.stringify(updatedResult));
        const verified = window.localStorage.getItem(storageKey);
        if (!verified) {
          throw new Error('Verification read-back failed after localStorage write');
        }
      }
    } catch (err) {
      console.error('CRITICAL: Failed to persist approved P2 analysis to localStorage:', err);
      return false;
    }

    setP2AnalysisResult(updatedResult);
    return true;
  }, [patient, p2AnalysisResult, currentClinicalAssessment]);

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

  // 1. Reactive Traffic Light Conflict Resolver
  const trafficLight = useMemo(() => {
    const activeMeds = allMedicines.filter(m => 
      patient.active_medications.some(userMed => 
        userMed === m.id || 
        userMed.toLowerCase().includes(m.generic_name.toLowerCase()) ||
        m.brand_names_bd.some(b => userMed.toLowerCase().includes(b.toLowerCase()))
      )
    );

    return resolveConflicts(
      allFoods,
      patient.selected_conditions,
      activeMeds,
      patient.confirmed_allergies,
      patient.clinician_disallowed_foods,
      patient.clinician_disallowed_tags,
      patient.current_phase
    );
  }, [
    patient.selected_conditions,
    patient.active_medications,
    patient.confirmed_allergies,
    patient.clinician_disallowed_foods,
    patient.clinician_disallowed_tags,
    patient.current_phase
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
    const labs = analyzeFunctionalLabs(p.labs, p.gender);
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
    invalidateP2Approval('Laboratory biomarkers updated');
    setPatient(prev => {
      const merged = applyCalculations({
        ...prev,
        labs: { ...prev.labs, ...labUpdates }
      });
      return {
        ...merged,
        is_diet_plan_dirty: true,
        assessment_last_updated_at: new Date().toISOString()
      };
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
  }, [patient, trafficLight]);

  const updateMealItemRawGrams = useCallback((mealId: string, itemId: string, rawGrams: number) => {
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
  }, [foodMap]);

  const swapMealItemAlternative = useCallback((mealId: string, itemId: string, alt: FoodExchangeItem) => {
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
  }, [foodMap, trafficLight]);

  const removeMealItem = useCallback((mealId: string, itemId: string) => {
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
  }, []);

  const addMealItem = useCallback((mealId: string, foodId: string, rawGrams: number = 100) => {
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
  }, [foodMap, trafficLight, language]);

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
      current_supplements: candidateSupplements,
      timeline: dniResult.timeline,
      updated_at: new Date().toISOString()
    };

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
  }, [patient, visits, clinicalVisits, followUpAppointments, visitSnapshots, progressReports, dietChart, candidateSupplements, dniResult.timeline, savedPatients]);

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

    safeStorage.setItem('shuddho_active_patient_id', id);
    return true;
  }, [savedPatients, patient, saveCurrentPatient, language]);

  // Dedicated Patient Registration without fictional labs or placeholder anthropometrics
  const registerNewPatient = useCallback((adminData: Partial<PatientProfile>): PatientProfile | null => {
    const newId = generateCollisionResistantId('pt');
    const today = getDhakaTodayDateString();
    const initialVisitId = generateCollisionResistantId(`vis_${newId}`);

    const unmeasuredCalc = calculateAnthropometrics(
      adminData.age ?? 0,
      adminData.gender || 'female',
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
      gender: adminData.gender || 'female',
      phone: adminData.phone || "",
      email: adminData.email || "",
      visit_date: today,
      current_visit_id: initialVisitId,
      current_phase: 1,
      height_cm: adminData.height_cm ?? 0,
      weight_kg: adminData.weight_kg ?? 0,
      waist_cm: adminData.waist_cm ?? 0,
      activity_level: adminData.activity_level || 'sedentary',
      sleep_hours: adminData.sleep_hours || 7,
      shift_worker: Boolean(adminData.shift_worker),
      population_group: adminData.population_group || 'adult_standard',
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
    setCandidateSupplements([]);
    setP2AnalysisResult(null);
    setCurrentClinicalAssessment(null);
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
    setSavedPatients(tx.committedPatientsList);

    invalidateP2Approval(`New visit initiated: ${tx.newVisit.visit_id}`);
    return tx.newVisit;
  }, [patient, visits, clinicalVisits, followUpAppointments, visitSnapshots, progressReports, dietChart, candidateSupplements, dniResult.timeline, savedPatients, invalidateP2Approval]);

  const selectVisit = useCallback((visitId: string) => {
    const match = clinicalVisits.find(v => v.visit_id === visitId || v.id === visitId);
    if (!match) return;

    setCurrentVisit(match);
    const isCurrentActiveVisit = Boolean(
      (patient.current_visit_id && (match.visit_id === patient.current_visit_id || match.id === patient.current_visit_id)) ||
      (!patient.current_visit_id && match === clinicalVisits[0])
    );

    // Rehydrate P2 analysis specific to this selected visit
    const p2Key = `shuddho_p2_analysis_${patient.id}_${match.visit_id || match.id}`;
    try {
      const savedP2 = safeStorage.getItem<P2AnalysisResult>(p2Key);
      if (savedP2) {
        setP2AnalysisResult(savedP2);
      } else if (isCurrentActiveVisit) {
        // Only run analysis for the currently active consultation visit
        setP2AnalysisResult(runP2Analysis(patient));
      } else {
        // Historical visit with no saved P2 analysis: do NOT fabricate fake analysis from incomplete data
        setP2AnalysisResult(null);
      }
    } catch {
      if (isCurrentActiveVisit) {
        setP2AnalysisResult(runP2Analysis(patient));
      } else {
        setP2AnalysisResult(null);
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
    if (tx.committedRecord.current_supplements && tx.committedRecord.current_supplements.length > 0) {
      setCandidateSupplements(tx.committedRecord.current_supplements);
    }
    setCurrentClinicalAssessment(null);
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

    const demoRecord: PatientRecord = {
      schema_version: 2,
      patient: seedPatient,
      visits: demoVisits,
      clinical_visits: [visit2, visit1],
      follow_up_appointments: [apptToday],
      visit_snapshots: [snap2, snap1],
      progress_reports: [],
      current_diet_chart: demoDietChart,
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

    setPatient(seedPatient);
    setVisits(demoVisits);
    setClinicalVisits([visit2, visit1]);
    setCurrentVisit(visit2);
    setFollowUpAppointments([apptToday]);
    setVisitSnapshots([snap2, snap1]);
    setProgressReports([]);
    setSavedPatients(updatedList);
    setDietChart(demoDietChart);

    const p2 = runP2Analysis(seedPatient);
    setP2AnalysisResult(p2);
    setCurrentClinicalAssessment(null);
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
        isAnalyzingP2,
        currentClinicalAssessment,
        executeP2Analysis,
        updateHypothesisDecision,
        approveP2Analysis,
        invalidateP2Approval
      }}
    >
      {children}
    </PracticeContext.Provider>
  );
};

export const usePractice = () => {
  const context = useContext(PracticeContext);
  if (!context) throw new Error('usePractice must be used within PracticeProvider');
  return context;
};
