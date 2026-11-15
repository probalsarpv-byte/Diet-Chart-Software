'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode
} from "react";
import { AssessmentData, AllergyReconciliationStatus, MedicationReconciliationOverallStatus } from "../types/index";
import {
  registryVersion,
  AssessmentDomainId,
  ASSESSMENT_DOMAINS,
  coreQuestions
} from "../questionnaire/registry";
import { usePractice } from "./PracticeContext";
import { filterVisibleQuestions } from "../engine/questionEngine";
import {
  AssessmentMode,
  AssessmentStepId,
  FFQItemResponse,
  FFQFoodGroupId,
  DietaryHabitsSurvey,
  DietaryFrequencyAssessment,
  PrakritiScore,
  VikritiScore,
  AgniAssessmentResult,
  AgniClassification,
  MasanumasikaPregnancyAssessment,
  StructuredLabEntry,
  PopulationSpecificData,
  ClinicalAssessment,
  CompleteAyurvedicAssessment,
  AssessmentCompletionStatus
} from "../types/assessment";
import { calculatePrakriti } from "../engine/assessment/prakritiEngine";
import { calculateVikriti } from "../engine/assessment/vikritiEngine";
import { calculateAgni } from "../engine/assessment/agniEngine";
import { analyzeDietaryFrequency, FFQ_FOOD_DEFINITIONS } from "../engine/assessment/ffqEngine";
import { MASANUMASIKA_MONTH_FRAMEWORKS, calculatePregnancyMonth, getTrimesterFromWeeks } from "../questionnaire/masanumasikaData";

export interface FullAssessmentPersistedState {
  version: string;
  patientId: string;
  visitId: string;
  mode: AssessmentMode;
  currentStep: AssessmentStepId;
  answers: Record<string, any>; // core functional questions
  ffqItems: Record<string, FFQItemResponse>;
  ffqHabits: DietaryHabitsSurvey;
  prakritiAnswers: Record<string, string>;
  vikritiAnswers: Record<string, 'yes' | 'no' | 'sometimes'>;
  agniAnswers: Record<string, AgniClassification>;
  labEntries: Record<string, StructuredLabEntry>;
  populationData: PopulationSpecificData;
  completed: boolean;
  completedAt?: string;
  lastUpdated: string;
}

const defaultHabits: DietaryHabitsSurvey = {
  meal_frequency_per_day: '3_meals',
  typical_breakfast: 'heavy_rice_or_ruti',
  skips_breakfast_frequency: 'never',
  dinner_timing: '8_to_9_pm',
  late_night_snacking: 'rarely',
  cooking_oil_primary: 'mustard_oil',
  raw_salt_added_at_table: 'sometimes',
  fluid_intake_glasses_per_day: '7_9_glasses',
  is_past_week_representative: true,
};

export const STANDARD_LAB_MARKERS: StructuredLabEntry[] = [
  { marker_id: 'fbs', category: 'glycemic', name_en: 'Fasting Blood Sugar (FBS)', name_bn: 'খালি পেটে রক্তের গ্লুকোজ (FBS)', unit: 'mmol/L', conventional_low: 3.9, conventional_high: 5.5, functional_low: 4.2, functional_high: 5.0, status: 'not_tested' },
  { marker_id: 'ppbs', category: 'glycemic', name_en: '2h Post-Prandial Glucose (2hPP)', name_bn: 'খাওয়ার ২ ঘণ্টা পর গ্লুকোজ (2hPP)', unit: 'mmol/L', conventional_low: 4.4, conventional_high: 7.8, functional_low: 4.5, functional_high: 6.7, status: 'not_tested' },
  { marker_id: 'hba1c', category: 'glycemic', name_en: 'Glycated Hemoglobin (HbA1c)', name_bn: 'হিমোগ্লোবিন এওয়ানসি (HbA1c)', unit: '%', conventional_low: 4.0, conventional_high: 5.6, functional_low: 4.5, functional_high: 5.3, status: 'not_tested' },
  { marker_id: 'fasting_insulin', category: 'glycemic', name_en: 'Fasting Serum Insulin', name_bn: 'ফাস্টিং ইনসুলিন', unit: 'µIU/mL', conventional_low: 2.6, conventional_high: 24.9, functional_low: 3.0, functional_high: 6.0, status: 'not_tested' },
  { marker_id: 'total_cholesterol', category: 'lipid', name_en: 'Total Cholesterol', name_bn: 'টোটাল কোলেস্টেরল', unit: 'mg/dL', conventional_low: 120, conventional_high: 200, functional_low: 160, functional_high: 190, status: 'not_tested' },
  { marker_id: 'triglycerides', category: 'lipid', name_en: 'Serum Triglycerides (TG)', name_bn: 'ট্রাইগ্লিসারাইড (TG)', unit: 'mg/dL', conventional_low: 50, conventional_high: 150, functional_low: 70, functional_high: 100, status: 'not_tested' },
  { marker_id: 'hdl', category: 'lipid', name_en: 'HDL Cholesterol (Good)', name_bn: 'এইচডিএল কোলেস্টেরল (ভালো)', unit: 'mg/dL', conventional_low: 40, conventional_high: 80, functional_low: 50, functional_high: 75, status: 'not_tested' },
  { marker_id: 'ldl', category: 'lipid', name_en: 'LDL Cholesterol', name_bn: 'এলডিএল কোলেস্টেরল', unit: 'mg/dL', conventional_low: 70, conventional_high: 100, functional_low: 70, functional_high: 90, status: 'not_tested' },
  { marker_id: 'serum_creatinine', category: 'renal', name_en: 'Serum Creatinine', name_bn: 'সিরাম ক্রিয়েটিনিন', unit: 'mg/dL', conventional_low: 0.6, conventional_high: 1.2, functional_low: 0.7, functional_high: 1.0, status: 'not_tested' },
  { marker_id: 'serum_uric_acid', category: 'renal', name_en: 'Serum Uric Acid', name_bn: 'সিরাম ইউরিক এসিড', unit: 'mg/dL', conventional_low: 3.0, conventional_high: 7.0, functional_low: 3.5, functional_high: 5.5, status: 'not_tested' },
  { marker_id: 'sgpt_alt', category: 'hepatic', name_en: 'SGPT / ALT', name_bn: 'এসজিপিটি / এএলটি (লিভার এনজাইম)', unit: 'U/L', conventional_low: 7, conventional_high: 56, functional_low: 10, functional_high: 25, status: 'not_tested' },
  { marker_id: 'serum_potassium', category: 'electrolytes', name_en: 'Serum Potassium (K+)', name_bn: 'সিরাম পটাশিয়াম (K+)', unit: 'mmol/L', conventional_low: 3.5, conventional_high: 5.0, functional_low: 4.0, functional_high: 4.8, status: 'not_tested' },
  { marker_id: 'serum_phosphorus', category: 'electrolytes', name_en: 'Serum Phosphorus (PO4)', name_bn: 'সিরাম ফসফরাস (PO4)', unit: 'mg/dL', conventional_low: 2.5, conventional_high: 4.5, functional_low: 3.0, functional_high: 4.0, status: 'not_tested' },
  { marker_id: 'tsh', category: 'thyroid', name_en: 'Thyroid Stimulating Hormone (TSH)', name_bn: 'টিএসএইচ (TSH)', unit: 'µIU/mL', conventional_low: 0.4, conventional_high: 4.5, functional_low: 1.0, functional_high: 2.5, status: 'not_tested' },
  { marker_id: 'hemoglobin', category: 'hematology_iron', name_en: 'Hemoglobin (Hb)', name_bn: 'হিমোগ্লোবিন (Hb)', unit: 'g/dL', conventional_low: 12.0, conventional_high: 16.5, functional_low: 13.0, functional_high: 15.5, status: 'not_tested' },
  { marker_id: 'serum_ferritin', category: 'hematology_iron', name_en: 'Serum Ferritin', name_bn: 'সিরাম ফেরিটিন (আয়রন সঞ্চয়)', unit: 'ng/mL', conventional_low: 20, conventional_high: 250, functional_low: 50, functional_high: 150, status: 'not_tested' },
  { marker_id: 'vitamin_d3', category: 'vitamins_minerals', name_en: '25-Hydroxy Vitamin D3', name_bn: 'ভিটামিন ডি৩ (25-OH D3)', unit: 'ng/mL', conventional_low: 30, conventional_high: 100, functional_low: 50, functional_high: 80, status: 'not_tested' },
  { marker_id: 'vitamin_b12', category: 'vitamins_minerals', name_en: 'Serum Vitamin B12', name_bn: 'সিরাম ভিটামিন বি১২', unit: 'pg/mL', conventional_low: 200, conventional_high: 900, functional_low: 500, functional_high: 850, status: 'not_tested' },
  { marker_id: 'hs_crp', category: 'inflammatory_markers', name_en: 'High-Sensitivity CRP (hs-CRP)', name_bn: 'এইচএস-সিআরপি (প্রদাহ সূচক)', unit: 'mg/L', conventional_low: 0.0, conventional_high: 3.0, functional_low: 0.0, functional_high: 0.8, status: 'not_tested' }
];

export interface AssessmentContextProps {
  // Legacy compatibility
  data: AssessmentData;
  setAnswer: (questionId: string, value: any) => void;
  resetAssessment: () => void;
  activeDomain: AssessmentDomainId;
  setActiveDomain: (domain: AssessmentDomainId) => void;
  isQuickMode: boolean;
  setIsQuickMode: (quick: boolean) => void;
  markCompleted: (completed: boolean) => void;
  saveDraft: () => void;
  completionPercentage: number;
  totalAnsweredCount: number;

  // P1 Enhanced Workflow & State
  mode: AssessmentMode;
  setMode: (mode: AssessmentMode) => void;
  currentStep: AssessmentStepId;
  setCurrentStep: (step: AssessmentStepId) => void;
  functionalAnswers: Record<string, any>;
  
  // Sub-Assessments
  ffqItems: Record<string, FFQItemResponse>;
  setFFQItem: (foodGroupId: FFQFoodGroupId, response: FFQItemResponse) => void;
  ffqHabits: DietaryHabitsSurvey;
  setFFQHabits: (habits: DietaryHabitsSurvey) => void;
  ffqAnalysis: DietaryFrequencyAssessment;

  prakritiAnswers: Record<string, string>;
  setPrakritiAnswer: (questionId: string, value: string) => void;
  prakritiResult: PrakritiScore;

  vikritiAnswers: Record<string, 'yes' | 'no' | 'sometimes'>;
  setVikritiAnswer: (questionId: string, value: 'yes' | 'no' | 'sometimes') => void;
  vikritiResult: VikritiScore;

  agniAnswers: Record<string, AgniClassification>;
  setAgniAnswer: (questionId: string, value: AgniClassification) => void;
  agniResult: AgniAssessmentResult;

  labEntries: Record<string, StructuredLabEntry>;
  setLabEntry: (markerId: string, entry: StructuredLabEntry) => void;

  populationData: PopulationSpecificData;
  setPopulationData: (data: PopulationSpecificData) => void;

  masanumasikaAssessment: MasanumasikaPregnancyAssessment | null;
  updatePregnancyGestational: (weeks: number, days: number, maternalRisks?: any) => void;

  completionStatus: AssessmentCompletionStatus;
  exportClinicalAssessment: () => ClinicalAssessment;
  visitId: string;
  assessmentId: string;
  clinicianSafetyAcknowledged: boolean;
  setClinicianSafetyAcknowledged: (acknowledged: boolean) => void;
}

const AssessmentContext = createContext<AssessmentContextProps | undefined>(undefined);

export const AssessmentProvider = ({ children }: { children: ReactNode }) => {
  const { patient, updatePatient } = usePractice();
  const patientId = patient?.id || "default_patient";
  const visitDateClean = patient?.visit_date ? patient.visit_date.replace(/[^0-9]/g, '') : 'initial';
  const visitId = patient?.current_visit_id || (patient?.id ? `visit_${patient.id}_${visitDateClean}` : 'current_visit');
  const stableAssessmentId = useMemo(() => `asmt_${patientId}_${visitId}`, [patientId, visitId]);

  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [mode, setModeState] = useState<AssessmentMode>('quick');
  const [currentStep, setCurrentStep] = useState<AssessmentStepId>('step_category');
  const [activeDomain, setActiveDomain] = useState<AssessmentDomainId>('clinical_history');
  const [clinicianSafetyAcknowledged, setClinicianSafetyAcknowledged] = useState<boolean>(false);

  const [functionalAnswers, setFunctionalAnswers] = useState<Record<string, any>>({});
  const [ffqItems, setFfqItems] = useState<Record<string, FFQItemResponse>>({});
  const [ffqHabits, setFfqHabits] = useState<DietaryHabitsSurvey>(defaultHabits);
  const [prakritiAnswers, setPrakritiAnswers] = useState<Record<string, string>>({});
  const [vikritiAnswers, setVikritiAnswers] = useState<Record<string, 'yes' | 'no' | 'sometimes'>>({});
  const [agniAnswers, setAgniAnswers] = useState<Record<string, AgniClassification>>({});
  
  const [labEntries, setLabEntries] = useState<Record<string, StructuredLabEntry>>(() => {
    const map: Record<string, StructuredLabEntry> = {};
    for (const m of STANDARD_LAB_MARKERS) {
      map[m.marker_id] = { ...m };
    }
    return map;
  });

  const [populationData, setPopulationData] = useState<PopulationSpecificData>({});
  const [completed, setCompleted] = useState<boolean>(false);

  // Prevents saving stale state from previous patient during patient switch
  const loadedPatientIdRef = useRef<string>(patientId);

  const storageKey = `shuddho_assessment_${patientId}_${visitId}`;

  // 1. Patient Loading / Hydration
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsHydrated(false);
    loadedPatientIdRef.current = patientId;

    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as FullAssessmentPersistedState;
        if (parsed.patientId === patientId) {
          setModeState(parsed.mode || 'quick');
          setCurrentStep(parsed.currentStep || 'step_category');
          setFunctionalAnswers(parsed.answers || {});
          setFfqItems(parsed.ffqItems || {});
          setFfqHabits(parsed.ffqHabits || defaultHabits);
          setPrakritiAnswers(parsed.prakritiAnswers || {});
          setVikritiAnswers(parsed.vikritiAnswers || {});
          setAgniAnswers(parsed.agniAnswers || {});
          if (parsed.labEntries && Object.keys(parsed.labEntries).length > 0) {
            setLabEntries(parsed.labEntries);
          }
          setPopulationData(parsed.populationData || {});
          setCompleted(parsed.completed || false);
          setIsHydrated(true);
          return;
        }
      } catch (e) {
        console.warn("Failed to parse persisted assessment state:", e);
      }
    }

    // Initialize fresh baseline if not found
    setModeState('quick');
    setCurrentStep('step_category');
    setFunctionalAnswers({});
    setFfqItems({});
    setFfqHabits(defaultHabits);
    setPrakritiAnswers({});
    setVikritiAnswers({});
    setAgniAnswers({});
    const initLabs: Record<string, StructuredLabEntry> = {};
    for (const m of STANDARD_LAB_MARKERS) {
      initLabs[m.marker_id] = { ...m };
    }
    setLabEntries(initLabs);
    setPopulationData({});
    setCompleted(false);
    setIsHydrated(true);
  }, [patientId, storageKey]);

  // 2. Debounced Auto-Save
  useEffect(() => {
    if (typeof window === "undefined" || !isHydrated) return;
    if (loadedPatientIdRef.current !== patientId) return; // Prevent saving stale state

    const handler = setTimeout(() => {
      try {
        const stateToSave: FullAssessmentPersistedState = {
          version: registryVersion,
          patientId,
          visitId,
          mode,
          currentStep,
          answers: functionalAnswers,
          ffqItems,
          ffqHabits,
          prakritiAnswers,
          vikritiAnswers,
          agniAnswers,
          labEntries,
          populationData,
          completed,
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      } catch (e) {
        console.error("Auto-save assessment error:", e);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [
    isHydrated,
    patientId,
    visitId,
    mode,
    currentStep,
    functionalAnswers,
    ffqItems,
    ffqHabits,
    prakritiAnswers,
    vikritiAnswers,
    agniAnswers,
    labEntries,
    populationData,
    completed,
    storageKey
  ]);

  // Setters
  const setAnswer = useCallback((questionId: string, value: any) => {
    setFunctionalAnswers(prev => ({ ...prev, [questionId]: value }));
  }, []);

  const setFFQItem = useCallback((foodGroupId: FFQFoodGroupId, response: FFQItemResponse) => {
    setFfqItems(prev => ({ ...prev, [foodGroupId]: response }));
  }, []);

  const setFFQHabits = useCallback((habits: DietaryHabitsSurvey) => {
    setFfqHabits(habits);
  }, []);

  const setPrakritiAnswer = useCallback((id: string, value: string) => {
    setPrakritiAnswers(prev => ({ ...prev, [id]: value }));
  }, []);

  const setVikritiAnswer = useCallback((id: string, value: 'yes' | 'no' | 'sometimes') => {
    setVikritiAnswers(prev => ({ ...prev, [id]: value }));
  }, []);

  const setAgniAnswer = useCallback((id: string, value: AgniClassification) => {
    setAgniAnswers(prev => ({ ...prev, [id]: value }));
  }, []);

  const setLabEntry = useCallback((markerId: string, entry: StructuredLabEntry) => {
    setLabEntries(prev => ({ ...prev, [markerId]: entry }));
  }, []);

  const setMode = useCallback((newMode: AssessmentMode) => {
    setModeState(newMode);
    // Crucial requirement: Switching modes preserves ALL answers intact!
  }, []);

  const setIsQuickMode = useCallback((quick: boolean) => {
    setModeState(quick ? 'quick' : 'comprehensive');
  }, []);

  const markCompleted = useCallback((isComp: boolean) => {
    setCompleted(isComp);
  }, []);

  const saveDraft = useCallback(() => {
    if (typeof window !== "undefined" && isHydrated) {
      const stateToSave: FullAssessmentPersistedState = {
        version: registryVersion,
        patientId,
        visitId,
        mode,
        currentStep,
        answers: functionalAnswers,
        ffqItems,
        ffqHabits,
        prakritiAnswers,
        vikritiAnswers,
        agniAnswers,
        labEntries,
        populationData,
        completed,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    }
  }, [
    isHydrated,
    patientId,
    visitId,
    mode,
    currentStep,
    functionalAnswers,
    ffqItems,
    ffqHabits,
    prakritiAnswers,
    vikritiAnswers,
    agniAnswers,
    labEntries,
    populationData,
    completed,
    storageKey
  ]);

  const resetAssessment = useCallback(() => {
    setFunctionalAnswers({});
    setFfqItems({});
    setFfqHabits(defaultHabits);
    setPrakritiAnswers({});
    setVikritiAnswers({});
    setAgniAnswers({});
    const initLabs: Record<string, StructuredLabEntry> = {};
    for (const m of STANDARD_LAB_MARKERS) {
      initLabs[m.marker_id] = { ...m };
    }
    setLabEntries(initLabs);
    setPopulationData({});
    setCompleted(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  // 3. Computed Sub-Assessments
  const prakritiResult = useMemo(() => {
    return calculatePrakriti(prakritiAnswers);
  }, [prakritiAnswers]);

  const vikritiResult = useMemo(() => {
    return calculateVikriti(vikritiAnswers);
  }, [vikritiAnswers]);

  const agniResult = useMemo(() => {
    return calculateAgni(agniAnswers);
  }, [agniAnswers]);

  const ffqAnalysis = useMemo(() => {
    return analyzeDietaryFrequency(ffqItems, ffqHabits);
  }, [ffqItems, ffqHabits]);

  // Pregnancy / Masanumasika Model
  const masanumasikaAssessment: MasanumasikaPregnancyAssessment | null = useMemo(() => {
    if (patient?.population_group !== 'pregnancy') return null;
    const rawWeeks = functionalAnswers['pregnancy_gestational_week'] ?? populationData.pregnancy?.gestational_age_weeks;
    const weeks = (rawWeeks && Number(rawWeeks) > 0) ? Number(rawWeeks) : 0;
    const days = populationData.pregnancy?.gestational_age_days || 0;
    const month = weeks > 0 ? calculatePregnancyMonth(weeks, days) : 1;
    const trimester = weeks > 0 ? getTrimesterFromWeeks(weeks) : 1;

    return {
      gestational_age_weeks: weeks,
      gestational_age_days: days,
      pregnancy_month: month,
      trimester,
      weight_gain_trajectory: 'appropriate',
      maternal_risks: {
        gestational_diabetes: functionalAnswers['pregnancy_gdm'] === 'yes',
        gestational_hypertension: functionalAnswers['pregnancy_blood_pressure_edema'] === 'yes',
        preeclampsia_concerns: functionalAnswers['pregnancy_blood_pressure_edema'] === 'yes',
        anemia: false,
        severe_morning_sickness_nausea: false,
        constipation_digestive_sluggishness: false,
        leg_cramps_electrolyte_signs: false
      },
      current_month_guidance: MASANUMASIKA_MONTH_FRAMEWORKS[month]
    };
  }, [patient?.population_group, functionalAnswers, populationData.pregnancy]);

  const updatePregnancyGestational = useCallback((weeks: number, days: number, maternalRisks?: any) => {
    const month = calculatePregnancyMonth(weeks, days);
    const trimester = getTrimesterFromWeeks(weeks);

    const updated: MasanumasikaPregnancyAssessment = {
      gestational_age_weeks: weeks,
      gestational_age_days: days,
      pregnancy_month: month,
      trimester,
      weight_gain_trajectory: 'appropriate',
      maternal_risks: maternalRisks || {
        gestational_diabetes: false,
        gestational_hypertension: false,
        preeclampsia_concerns: false,
        anemia: false,
        severe_morning_sickness_nausea: false,
        constipation_digestive_sluggishness: false,
        leg_cramps_electrolyte_signs: false
      },
      current_month_guidance: MASANUMASIKA_MONTH_FRAMEWORKS[month]
    };

    setPopulationData(prev => ({ ...prev, pregnancy: updated }));
    setAnswer('pregnancy_gestational_week', weeks);
  }, [setAnswer]);

  // 4. Completion & Metric Calculations
  const visibleQuestions = useMemo(() => {
    return filterVisibleQuestions(functionalAnswers, coreQuestions, {
      isQuickMode: mode === 'quick',
      populationGroup: patient?.population_group,
      clinicalPathways: patient?.clinical_pathways
    });
  }, [functionalAnswers, mode, patient?.population_group, patient?.clinical_pathways]);

  const totalAnsweredCount = useMemo(() => {
    const countFunctional = Object.keys(functionalAnswers).filter(
      k => functionalAnswers[k] !== undefined && functionalAnswers[k] !== null && functionalAnswers[k] !== ""
    ).length;
    const countFFQ = Object.keys(ffqItems).filter(
      k => ffqItems[k]?.frequency && ffqItems[k].frequency !== '0_times' && ffqItems[k].frequency !== 'not_sure'
    ).length;
    const countPrakriti = Object.keys(prakritiAnswers).length;
    const countVikriti = Object.keys(vikritiAnswers).length;
    const countAgni = Object.keys(agniAnswers).length;

    return countFunctional + countFFQ + countPrakriti + countVikriti + countAgni;
  }, [functionalAnswers, ffqItems, prakritiAnswers, vikritiAnswers, agniAnswers]);

  const completionPercentage = useMemo(() => {
    if (visibleQuestions.length === 0) return 0;
    const answeredVisible = visibleQuestions.filter(
      q => functionalAnswers[q.id] !== undefined && functionalAnswers[q.id] !== null && functionalAnswers[q.id] !== ""
    ).length;
    return Math.min(100, Math.round((answeredVisible / visibleQuestions.length) * 100));
  }, [visibleQuestions, functionalAnswers]);

  const completionStatus: AssessmentCompletionStatus = useMemo(() => {
    const criticalSafetyQuestions = [
      'safety_insulin_active',
      'safety_sulfonylurea_active',
      'safety_prescribed_fluid_limit',
      'safety_hospital_feeding_route',
      'safety_dysphagia_choking_risk'
    ];

    const missingCritical = criticalSafetyQuestions.filter(
      qId => functionalAnswers[qId] === undefined || functionalAnswers[qId] === null || functionalAnswers[qId] === ""
    );

    // 1. Allergies Reconciled Check
    // CLINICAL INTEGRITY RULE:
    // A populated or empty array alone must not prove that allergy history was verified.
    // Explicit states: 'allergies_confirmed', 'none_confirmed', 'unknown', 'not_assessed'.
    // Only 'allergies_confirmed' (with list) or 'none_confirmed' (NKDA verified) satisfy reconciliation.
    let allergyStatus: AllergyReconciliationStatus = 'not_assessed';
    if (patient?.allergy_reconciliation?.status) {
      allergyStatus = patient.allergy_reconciliation.status;
    } else if (functionalAnswers['safety_allergy_reconciliation_status']) {
      allergyStatus = functionalAnswers['safety_allergy_reconciliation_status'];
    } else if (patient?.confirmed_allergies && patient.confirmed_allergies.length > 0) {
      allergyStatus = 'allergies_confirmed';
    }

    const allergiesReconciled =
      allergyStatus === 'allergies_confirmed' || allergyStatus === 'none_confirmed';

    // 2. Medication Reconciliation Check
    // CLINICAL INTEGRITY RULE:
    // Validate medication identity, dose, frequency, administration timing, verification status,
    // and relevant safety information. Insulin and sulfonylurea screening alone must not satisfy
    // the complete medication reconciliation gate.
    const activeMeds = patient?.active_medications || [];
    const medSummary = patient?.medication_reconciliation;
    const unreconciledMedElements: string[] = [];

    // Insulin & sulfonylurea screening required
    if (functionalAnswers['safety_insulin_active'] === undefined) {
      unreconciledMedElements.push('safety_insulin_active');
    }
    if (functionalAnswers['safety_sulfonylurea_active'] === undefined) {
      unreconciledMedElements.push('safety_sulfonylurea_active');
    }

    let medicationStatus: MedicationReconciliationOverallStatus = 'not_reconciled';
    if (medSummary?.overall_status) {
      medicationStatus = medSummary.overall_status;
    } else if (functionalAnswers['safety_medication_reconciliation_status']) {
      medicationStatus = functionalAnswers['safety_medication_reconciliation_status'];
    } else if (activeMeds.length === 0 && (functionalAnswers['safety_no_medications_confirmed'] === true || functionalAnswers['safety_no_medications_confirmed'] === 'yes')) {
      medicationStatus = 'no_medications_confirmed';
    }

    let activeMedsReconciled = false;
    if (activeMeds.length === 0) {
      activeMedsReconciled = medicationStatus === 'no_medications_confirmed';
      if (!activeMedsReconciled) {
        unreconciledMedElements.push('no_medications_unconfirmed');
      }
    } else {
      if (medSummary && medSummary.reconciled_medications && medSummary.reconciled_medications.length >= activeMeds.length) {
        let allValid = true;
        for (const med of medSummary.reconciled_medications) {
          if (!med.name || !med.dose || !med.frequency || !med.timing || med.timing === 'unspecified' || !med.verification_status) {
            allValid = false;
            unreconciledMedElements.push(`med_${med.name || 'unnamed'}_missing_timing_or_dose`);
          }
        }
        activeMedsReconciled = allValid && medicationStatus === 'complete';
      } else {
        activeMedsReconciled = false;
        unreconciledMedElements.push('active_medications_missing_detailed_reconciliation');
      }
    }

    const medicationReconciliationCompleted =
      unreconciledMedElements.length === 0 && activeMedsReconciled;

    // 3. Feeding Route & Swallowing Safety
    const feedingRouteVerified =
      Boolean(patient?.feeding_status?.route || functionalAnswers['safety_hospital_feeding_route']) &&
      functionalAnswers['safety_dysphagia_choking_risk'] !== undefined;

    // 4. Population-Specific Risks Resolved
    let populationRisksResolved = true;
    if (patient?.population_group === 'pregnancy') {
      const gestationalWeeks = populationData.pregnancy?.gestational_age_weeks || Number(functionalAnswers['pregnancy_gestational_week']) || 0;
      if (gestationalWeeks <= 0) {
        populationRisksResolved = false; // Gestational age is unrecorded/unverified
      }
    }

    // 5. Prescribed Restrictions Clarified (Do not allow unconfirmed Yes restrictions without limit)
    let prescribedRestrictionsClarified = true;
    if (functionalAnswers['cardio_prescribed_sodium_cap'] === 'yes') {
      const sodiumNum = Number(functionalAnswers['safety_prescribed_sodium_limit_mg']);
      if (!sodiumNum || isNaN(sodiumNum) || sodiumNum <= 0) {
        prescribedRestrictionsClarified = false;
      }
    }
    if (functionalAnswers['renal_potassium_restriction_prescribed'] === 'yes') {
      const potNum = Number(functionalAnswers['safety_prescribed_potassium_limit_mg']);
      if (!potNum || isNaN(potNum) || potNum <= 0) {
        prescribedRestrictionsClarified = false;
      }
    }
    if (functionalAnswers['safety_prescribed_fluid_limit'] === 'yes') {
      const fluidNum = Number(functionalAnswers['safety_prescribed_fluid_limit_ml']);
      if (!fluidNum || isNaN(fluidNum) || fluidNum <= 0) {
        prescribedRestrictionsClarified = false;
      }
    }

    const hasTestedLabs = Object.values(labEntries).some(
      e => e.status === 'previously_tested' && e.numeric_value !== undefined
    );

    const administrative_completed = Boolean(functionalAnswers['chief_complaint']);

    // CLINICAL AUDIT RULE:
    // Do not use an arbitrary percentage alone to authorize final approval.
    // Completeness requires comprehensive safety verification across all clinical risk domains.
    const clinical_safety_completed =
      missingCritical.length === 0 &&
      allergiesReconciled &&
      medicationReconciliationCompleted &&
      feedingRouteVerified &&
      populationRisksResolved &&
      prescribedRestrictionsClarified;

    const mandatory_sections_completed =
      clinical_safety_completed &&
      administrative_completed &&
      clinicianSafetyAcknowledged;

    const is_provisional = !mandatory_sections_completed;

    return {
      administrative_completed,
      clinical_safety_completed,
      mandatory_sections_completed,
      laboratory_data_available: hasTestedLabs,
      requires_clinical_review: is_provisional || !clinicianSafetyAcknowledged,
      unanswered_critical_questions: Array.from(new Set([...missingCritical, ...unreconciledMedElements])),
      is_provisional,
      allergies_reconciled: allergiesReconciled,
      allergy_status: allergyStatus,
      medication_reconciliation_completed: medicationReconciliationCompleted,
      medication_status: medicationStatus,
      unreconciled_medication_elements: unreconciledMedElements,
      feeding_route_verified: feedingRouteVerified,
      population_risks_resolved: populationRisksResolved,
      prescribed_restrictions_clarified: prescribedRestrictionsClarified,
    };
  }, [
    functionalAnswers,
    labEntries,
    clinicianSafetyAcknowledged,
    patient?.confirmed_allergies,
    patient?.allergy_reconciliation,
    patient?.active_medications,
    patient?.medication_reconciliation,
    patient?.feeding_status?.route,
    patient?.population_group,
    populationData.pregnancy?.gestational_age_weeks
  ]);

  // Legacy data adapter
  const legacyData: AssessmentData = useMemo(() => ({
    version: registryVersion,
    answers: functionalAnswers,
    completed
  }), [functionalAnswers, completed]);

  // 5. Complete Clinical Assessment Exporter (P2 Intelligence Contract)
  const exportClinicalAssessment = useCallback((): ClinicalAssessment => {
    const completeAyurveda: CompleteAyurvedicAssessment = {
      prakriti: prakritiResult,
      vikriti: vikritiResult,
      agni: agniResult,
      ama_status: agniResult.type === 'mandagni' ? 'moderate' : 'none',
      answers: { ...prakritiAnswers, ...vikritiAnswers, ...agniAnswers },
      assessment_date: new Date().toISOString(),
      is_complete: Object.keys(prakritiAnswers).length >= 8 && Object.keys(agniAnswers).length >= 3
    };

    const labData = {
      entries: labEntries,
      last_updated: new Date().toISOString(),
      total_tested_count: Object.values(labEntries).filter(e => e.status === 'previously_tested').length,
      pending_count: Object.values(labEntries).filter(e => e.status === 'pending_result').length
    };

    return {
      patient_id: patientId,
      visit_id: visitId,
      assessment_id: stableAssessmentId,
      assessment_date: new Date().toISOString(),
      mode,
      questionnaire_version: registryVersion,
      primary_population: patient?.population_group || 'adult_standard',
      clinical_pathways: patient?.clinical_pathways || ['metabolic'],
      feeding_status: patient?.feeding_status || {
        route: 'oral_standard',
        oral_intake_permitted: true,
        requires_specialist_support: false
      },
      functional_answers: functionalAnswers,
      dietary_frequency: ffqAnalysis,
      ayurveda: completeAyurveda,
      population_data: {
        ...populationData,
        pregnancy: masanumasikaAssessment || undefined
      },
      labs: labData,
      completion: completionStatus,
      allergy_reconciliation: patient?.allergy_reconciliation || {
        status: completionStatus.allergy_status || 'not_assessed',
        reconciled_allergies: patient?.confirmed_allergies || [],
        allergies_present: Boolean(patient?.confirmed_allergies && patient.confirmed_allergies.length > 0),
        recorded_date: patient?.visit_date,
      },
      medication_reconciliation: patient?.medication_reconciliation || {
        overall_status: completionStatus.medication_status || 'not_reconciled',
        total_active_medications: patient?.active_medications?.length || 0,
        reconciled_count: completionStatus.medication_reconciliation_completed ? (patient?.active_medications?.length || 0) : 0,
        unreconciled_count: completionStatus.medication_reconciliation_completed ? 0 : (patient?.active_medications?.length || 0),
        reconciled_medications: [],
      },
      safety_warnings_acknowledged: clinicianSafetyAcknowledged
    };
  }, [
    patientId,
    visitId,
    stableAssessmentId,
    clinicianSafetyAcknowledged,
    mode,
    patient,
    functionalAnswers,
    ffqAnalysis,
    prakritiResult,
    vikritiResult,
    agniResult,
    prakritiAnswers,
    vikritiAnswers,
    agniAnswers,
    populationData,
    masanumasikaAssessment,
    labEntries,
    completionStatus
  ]);

  return (
    <AssessmentContext.Provider
      value={{
        data: legacyData,
        setAnswer,
        resetAssessment,
        activeDomain,
        setActiveDomain,
        isQuickMode: mode === 'quick',
        setIsQuickMode,
        markCompleted,
        saveDraft,
        completionPercentage,
        totalAnsweredCount,

        mode,
        setMode,
        currentStep,
        setCurrentStep,
        functionalAnswers,

        ffqItems,
        setFFQItem,
        ffqHabits,
        setFFQHabits,
        ffqAnalysis,

        prakritiAnswers,
        setPrakritiAnswer,
        prakritiResult,

        vikritiAnswers,
        setVikritiAnswer,
        vikritiResult,

        agniAnswers,
        setAgniAnswer,
        agniResult,

        labEntries,
        setLabEntry,

        populationData,
        setPopulationData,

        masanumasikaAssessment,
        updatePregnancyGestational,

        completionStatus,
        exportClinicalAssessment,
        visitId,
        assessmentId: stableAssessmentId,
        clinicianSafetyAcknowledged,
        setClinicianSafetyAcknowledged
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessment = () => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error("useAssessment must be used within an AssessmentProvider");
  }
  return context;
};
