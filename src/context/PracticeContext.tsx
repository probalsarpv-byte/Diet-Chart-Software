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
  InterventionApprovalStatus
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

const CURRENT_SCHEMA_VERSION = 2;

const allFoods = foodsData as FoodItem[];
const allMedicines = medicinesData as MedicineItem[];
const allSupplements = supplementsData as SupplementItem[];

export interface PracticeContextType {
  language: 'bn' | 'en';
  setLanguage: (lang: 'bn' | 'en') => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  activeTab: 'intake' | 'assessment' | 'clinical_intelligence' | 'conditions' | 'dni' | 'diet' | 'followup' | 'report';
  setActiveTab: (tab: 'intake' | 'assessment' | 'clinical_intelligence' | 'conditions' | 'dni' | 'diet' | 'followup' | 'report') => void;

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

  // Patient Records Persistence
  savedPatients: PatientRecord[];
  saveCurrentPatient: () => void;
  loadPatient: (id: string) => void;
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

function migratePatientRecord(record: any): PatientRecord {
  const p = record.patient || {};
  const migratedPatient: PatientProfile = {
    schema_version: CURRENT_SCHEMA_VERSION,
    id: p.id || `pt_${Date.now()}`,
    name: p.name || "Patient",
    age: p.age || 40,
    gender: p.gender || 'female',
    phone: p.phone || "",
    email: p.email,
    visit_date: p.visit_date || new Date().toISOString().split('T')[0],
    current_phase: p.current_phase || 1,
    height_cm: p.height_cm || 155,
    weight_kg: p.weight_kg || 65,
    waist_cm: p.waist_cm || 80,
    activity_level: p.activity_level || 'sedentary',
    sleep_hours: p.sleep_hours || 7,
    shift_worker: Boolean(p.shift_worker),
    population_group: p.population_group || 'adult_standard',
    trimester: p.trimester,
    bmr_floor_strategy: p.bmr_floor_strategy || 'clamped_to_bmr',
    custom_calorie_floor: p.custom_calorie_floor,
    confirmed_allergies: Array.isArray(p.confirmed_allergies) ? p.confirmed_allergies : [],
    clinician_disallowed_foods: Array.isArray(p.clinician_disallowed_foods) ? p.clinician_disallowed_foods : [],
    clinician_disallowed_tags: Array.isArray(p.clinician_disallowed_tags) ? p.clinician_disallowed_tags : [],
    selected_conditions: Array.isArray(p.selected_conditions) ? p.selected_conditions : ['t2d_ir'],
    active_medications: Array.isArray(p.active_medications) ? p.active_medications : [],
    gut_profile: p.gut_profile || {
      bloating: 'none',
      acid_reflux_hypoacidity: false,
      bristol_stool_score: 4,
      energy_score: 7,
      sleep_quality_score: 7,
      digestive_fire_agni: 'samagni'
    },
    labs: p.labs || { lab_flags: [] },
    calculated: p.calculated || calculateAnthropometrics(p.age || 40, p.gender || 'female', p.height_cm || 155, p.weight_kg || 65, p.waist_cm || 80, p.activity_level || 'sedentary', p.selected_conditions || ['t2d_ir']),
    custom_clinical_notes: p.custom_clinical_notes || "",
    is_diet_plan_dirty: Boolean(p.is_diet_plan_dirty),
    assessment_last_updated_at: p.assessment_last_updated_at || new Date().toISOString(),
    diet_plan_generated_at: p.diet_plan_generated_at || new Date().toISOString(),
    manual_edits_preserved: Boolean(p.manual_edits_preserved)
  };

  return {
    schema_version: CURRENT_SCHEMA_VERSION,
    patient: migratedPatient,
    visits: Array.isArray(record.visits) ? record.visits : [],
    current_diet_chart: Array.isArray(record.current_diet_chart) ? record.current_diet_chart : [],
    current_supplements: Array.isArray(record.current_supplements) ? record.current_supplements : [],
    timeline: Array.isArray(record.timeline) ? record.timeline : [],
    updated_at: record.updated_at || new Date().toISOString(),
    created_at: record.created_at || new Date().toISOString()
  };
}

export const PracticeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeTab, setActiveTab] = useState<'intake' | 'assessment' | 'clinical_intelligence' | 'conditions' | 'dni' | 'diet' | 'followup' | 'report'>('intake');

  const [patient, setPatient] = useState<PatientProfile>(createInitialSeedPatient);
  const [visits, setVisits] = useState<LongitudinalVisit[]>([]);
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
      const visitId = `visit_${patient.id}_${visitDateClean}`;
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
  }, [patient?.id, patient?.visit_date]);

  // Load patient-isolated P2 analysis from LocalStorage
  useEffect(() => {
    if (!patient?.id) return;
    const visitDateClean = (patient.visit_date || '').replace(/[^0-9]/g, '');
    const visitId = `visit_${patient.id}_${visitDateClean}`;
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
  }, [patient?.id, patient?.visit_date]);

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

      const result = runP2Analysis({
        patient,
        assessment: asmt,
        assessmentAnswers: answers,
        previousApprovals: p2AnalysisResult?.approvalHistory,
        isOverallApproved: Boolean(p2AnalysisResult?.report?.isApproved && !p2AnalysisResult?.analysisInvalidatedAt),
        approvedByClinicianId: p2AnalysisResult?.report?.approvedBy,
        approvalTimestamp: p2AnalysisResult?.report?.approvalDate,
        clinicianNotes: p2AnalysisResult?.report?.clinicianNotes,
      });

      setP2AnalysisResult(result);
      const visitDateClean = (patient.visit_date || '').replace(/[^0-9]/g, '');
      const visitId = `visit_${patient.id}_${visitDateClean}`;
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
    const visitId = `visit_${patient.id}_${visitDateClean}`;
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
    if (currentClinicalAssessment && !currentClinicalAssessment.completion.clinical_safety_completed) {
      console.warn('Rejected P2 approval: Clinical safety assessment is incomplete. Unanswered critical safety questions must be resolved.');
      return false;
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
    };

    setP2AnalysisResult(updatedResult);
    const visitDateClean = (patient.visit_date || '').replace(/[^0-9]/g, '');
    const visitId = `visit_${patient.id}_${visitDateClean}`;
    const storageKey = `shuddho_p2_analysis_${patient.id}_${visitId}`;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(updatedResult));
      }
    } catch (err) {
      console.warn('Failed to persist approved P2 analysis:', err);
    }
    return true;
  }, [patient, p2AnalysisResult]);

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

      const saved = localStorage.getItem('shuddho_saved_patients');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const migrated = parsed.map(migratePatientRecord);
          setSavedPatients(migrated);
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
  const saveCurrentPatient = useCallback(() => {
    const record: PatientRecord = {
      schema_version: CURRENT_SCHEMA_VERSION,
      patient,
      visits,
      current_diet_chart: dietChart,
      current_supplements: candidateSupplements,
      timeline: dniResult.timeline,
      updated_at: new Date().toISOString()
    };

    setSavedPatients(prev => {
      const idx = prev.findIndex(p => p.patient.id === patient.id);
      let updated: PatientRecord[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = record;
      } else {
        updated = [record, ...prev];
      }
      try {
        localStorage.setItem('shuddho_saved_patients', JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save patient to localStorage:", e);
      }
      return updated;
    });
  }, [patient, visits, dietChart, candidateSupplements, dniResult.timeline]);

  const loadPatient = useCallback((id: string) => {
    const match = savedPatients.find(p => p.patient.id === id);
    if (match) {
      const migrated = migratePatientRecord(match);
      setPatient(migrated.patient);
      setVisits(migrated.visits || []);
      setDietChart(migrated.current_diet_chart || []);
      if (migrated.current_supplements && migrated.current_supplements.length > 0) {
        setCandidateSupplements(migrated.current_supplements);
      }
    }
  }, [savedPatients]);

  const createNewPatient = useCallback(() => {
    const newId = `pt_${Date.now()}`;
    const freshCalculated = calculateAnthropometrics(
      40, 'female', 155, 65, 80, 'sedentary', 
      [], 'adult_standard', undefined, 'clamped_to_bmr'
    );

    const freshPatient: PatientProfile = {
      schema_version: CURRENT_SCHEMA_VERSION,
      id: newId,
      name: "New Patient / নতুন রোগী",
      age: 40,
      gender: 'female',
      phone: "",
      visit_date: new Date().toISOString().split('T')[0],
      current_phase: 1,
      height_cm: 155,
      weight_kg: 65,
      waist_cm: 80,
      activity_level: 'sedentary',
      sleep_hours: 7,
      shift_worker: false,
      population_group: 'adult_standard',
      bmr_floor_strategy: 'clamped_to_bmr',
      confirmed_allergies: [],
      clinician_disallowed_foods: [],
      clinician_disallowed_tags: [],
      selected_conditions: [], // Patient isolation: New patients start with no pre-assigned conditions
      active_medications: [],
      gut_profile: {
        bloating: 'none',
        acid_reflux_hypoacidity: false,
        bristol_stool_score: 4,
        energy_score: 7,
        sleep_quality_score: 7,
        digestive_fire_agni: 'samagni'
      },
      labs: {
        lab_flags: []
      },
      calculated: freshCalculated,
      is_diet_plan_dirty: false,
      assessment_last_updated_at: new Date().toISOString(),
      diet_plan_generated_at: new Date().toISOString(),
      manual_edits_preserved: false
    };

    // Calculate fresh traffic light ISOLATED for this new patient!
    const freshTrafficLight = resolveConflicts(
      allFoods,
      freshPatient.selected_conditions,
      [],
      freshPatient.confirmed_allergies,
      freshPatient.clinician_disallowed_foods,
      freshPatient.clinician_disallowed_tags,
      freshPatient.current_phase
    );

    const freshChart = buildAutoScaledDietChart(freshPatient, allFoods, freshTrafficLight);

    setPatient(freshPatient);
    setVisits([]);
    setDietChart(freshChart);
    setCandidateSupplements([]);
  }, []);

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
