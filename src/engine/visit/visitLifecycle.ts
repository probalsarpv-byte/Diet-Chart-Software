/**
 * SHUDDHO CLINICAL INFORMATICS ARCHITECTURE
 * Visit Lifecycle & Atomic State Transitions
 * 
 * Complies with Section 6.2 & Section 9 of Step 01 specifications:
 * - Pure, deterministic state transition boundaries for visit creation, selection, and completion.
 * - Eliminates asynchronous React state setter race conditions.
 * - Guarantees strict patient ownership and collision-resistant identifiers.
 * - Provides isolated transaction boundary with automatic rollback on persistence failure.
 */

import { generateEntityId } from '../../utils/idGenerator';
import { validateReferentialIntegrity } from '../../utils/referentialIntegrity';
import { calculateAnthropometrics } from '../anthropometrics';
import {
  ClinicalVisit,
  ClinicalVisitType,
  ClinicalVisitSnapshot,
  PatientProfile,
  PatientRecord
} from '../../types';

export interface CreateVisitTransitionParams {
  patient: PatientProfile;
  existingVisits: ClinicalVisit[];
  visitType?: ClinicalVisitType;
  notes?: string;
  visitDate?: string;
}

export interface CreateVisitTransitionResult {
  newVisit: ClinicalVisit;
  updatedPatient: PatientProfile;
  updatedVisits: ClinicalVisit[];
}

export function createNewVisitTransition(params: CreateVisitTransitionParams): CreateVisitTransitionResult {
  const {
    patient,
    existingVisits,
    visitType = 'routine_followup',
    notes,
    visitDate
  } = params;

  if (!patient || !patient.id) {
    throw new Error('INVALID_PATIENT: Cannot initiate visit without authoritative patient ID');
  }

  const today = visitDate || new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

  const newVisitId = generateEntityId(`vis_${patient.id}`);
  const hasBaseline = existingVisits.some(v => v.is_baseline || v.visit_type === 'baseline_consultation');
  const isBaseline = !hasBaseline && (visitType === 'baseline_consultation' || existingVisits.length === 0);

  const newVisit: ClinicalVisit = {
    id: newVisitId,
    visit_id: newVisitId,
    patient_id: patient.id,
    visit_number: existingVisits.length + 1,
    visit_type: visitType,
    visit_date: today,
    created_at: new Date().toISOString(),
    status: 'in_progress',
    is_baseline: isBaseline,
    clinical_notes: notes || `${visitType.replace(/_/g, ' ')} initiated`,
    notes: notes || `${visitType.replace(/_/g, ' ')} initiated`
  };

  const updatedPatient: PatientProfile = {
    ...patient,
    current_visit_id: newVisitId,
    visit_date: today,
    is_diet_plan_dirty: true,
    assessment_last_updated_at: new Date().toISOString()
  };

  const updatedVisits = [newVisit, ...existingVisits.filter(v => v.visit_id !== newVisitId && v.id !== newVisitId)];

  return {
    newVisit,
    updatedPatient,
    updatedVisits
  };
}

export function completeVisitTransition(
  visits: ClinicalVisit[],
  visitId: string,
  summary?: string
): ClinicalVisit[] {
  return visits.map(v => {
    if (v.visit_id === visitId || v.id === visitId) {
      return {
        ...v,
        status: 'completed',
        completed_at: new Date().toISOString(),
        clinical_notes: summary || v.clinical_notes || v.notes
      };
    }
    return v;
  });
}

export interface RestoreVisitStateParams {
  currentPatient: PatientProfile;
  targetVisit: ClinicalVisit;
  targetSnapshot?: ClinicalVisitSnapshot | null;
}

/**
 * Pure function to restore clinical state when switching visits.
 * Strictly avoids bleed-through: missing historical values remain undefined/zero.
 */
export function restoreVisitState(params: RestoreVisitStateParams): PatientProfile {
  const { currentPatient, targetVisit, targetSnapshot } = params;
  const visitId = targetVisit.visit_id || targetVisit.id;

  const weightKg = targetSnapshot?.anthropometrics?.weight_kg ?? 0;
  const heightCm = targetSnapshot?.anthropometrics?.height_cm ?? currentPatient.height_cm;
  const waistCm = targetSnapshot?.anthropometrics?.waist_cm ?? 0;

  const calculated = calculateAnthropometrics(
    currentPatient.age,
    currentPatient.gender,
    heightCm,
    weightKg,
    waistCm,
    currentPatient.activity_level || 'sedentary',
    currentPatient.selected_conditions || [],
    currentPatient.population_group || 'adult_standard',
    currentPatient.trimester,
    currentPatient.bmr_floor_strategy || 'clamped_to_bmr'
  );

  if (!targetSnapshot) {
    return {
      ...currentPatient,
      current_visit_id: visitId,
      visit_date: targetVisit.visit_date,
      weight_kg: 0,
      waist_cm: 0,
      calculated,
      vitals: {},
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
      }
    };
  }

  return {
    ...currentPatient,
    current_visit_id: visitId,
    visit_date: targetSnapshot.visit_date || targetVisit.visit_date,
    weight_kg: weightKg,
    height_cm: heightCm,
    waist_cm: waistCm,
    calculated,
    vitals: targetSnapshot.vitals ? { ...targetSnapshot.vitals } : {},
    gut_profile: {
      bloating: targetSnapshot.gut_metrics?.bloating_severity ?? 'none',
      acid_reflux_hypoacidity: Boolean(targetSnapshot.gut_metrics?.acid_reflux_present),
      bristol_stool_score: targetSnapshot.gut_metrics?.bristol_stool_score ?? 4,
      energy_score: targetSnapshot.gut_metrics?.energy_score ?? 7,
      sleep_quality_score: targetSnapshot.gut_metrics?.sleep_quality_score ?? 7,
      digestive_fire_agni: targetSnapshot.gut_metrics?.agni_status ?? 'unassessed'
    },
    labs: {
      fasting_glucose: targetSnapshot.biomarkers?.fbs,
      two_hour_post_prandial: targetSnapshot.biomarkers?.ppbs,
      hba1c: targetSnapshot.biomarkers?.hba1c,
      fasting_insulin: targetSnapshot.biomarkers?.fasting_insulin,
      homa_ir: targetSnapshot.biomarkers?.homa_ir,
      total_cholesterol: targetSnapshot.biomarkers?.total_cholesterol,
      triglycerides: targetSnapshot.biomarkers?.triglycerides,
      hdl: targetSnapshot.biomarkers?.hdl,
      ldl: targetSnapshot.biomarkers?.ldl,
      tg_hdl_ratio: targetSnapshot.biomarkers?.tg_hdl_ratio,
      serum_creatinine: targetSnapshot.biomarkers?.serum_creatinine,
      egfr: targetSnapshot.biomarkers?.egfr,
      uric_acid: targetSnapshot.biomarkers?.serum_uric_acid,
      alt: targetSnapshot.biomarkers?.sgpt_alt,
      ast: targetSnapshot.biomarkers?.sgot_ast,
      potassium: targetSnapshot.biomarkers?.serum_potassium,
      sodium: targetSnapshot.biomarkers?.serum_sodium,
      tsh: targetSnapshot.biomarkers?.tsh,
      hemoglobin: targetSnapshot.biomarkers?.hemoglobin,
      ferritin: targetSnapshot.biomarkers?.serum_ferritin,
      vitamin_d3: targetSnapshot.biomarkers?.vitamin_d3,
      vitamin_b12: targetSnapshot.biomarkers?.vitamin_b12,
      hs_crp: targetSnapshot.biomarkers?.hs_crp,
      lab_flags: []
    }
  };
}

export interface StorageEngine {
  setItem: (key: string, value: any) => boolean | void;
  getItem?: (key: string) => any;
}

export type TransactionAction =
  | { type: 'SAVE_RECORD'; payload?: Partial<PatientRecord> }
  | { type: 'START_NEW_VISIT'; payload: { visitType?: ClinicalVisitType; visitDate?: string; notes?: string } }
  | { type: 'REGISTER_PATIENT'; payload: PatientRecord }
  | { type: 'START_CONSULTATION_FOR_APPOINTMENT'; payload: { appointmentId: string; visitType?: ClinicalVisitType; visitDate?: string; notes?: string } };

export interface TransactionResult {
  success: boolean;
  error?: string;
  committedRecord: PatientRecord;
  committedPatientsList: PatientRecord[];
  newVisit?: ClinicalVisit;
}

/**
 * Isolated transaction boundary for patient and visit persistence.
 * Validates referential integrity, executes storage write first,
 * and rolls back completely on any quota or storage failure.
 */
export function savePatientTransaction(params: {
  currentRecord: PatientRecord;
  storageEngine: StorageEngine;
  action: TransactionAction;
  savedPatientsList?: PatientRecord[];
}): TransactionResult {
  const { currentRecord, storageEngine, action, savedPatientsList = [] } = params;
  let proposedRecord: PatientRecord;
  let newVisit: ClinicalVisit | undefined;

  if (action.type === 'START_CONSULTATION_FOR_APPOINTMENT') {
    const appointmentId = action.payload.appointmentId;
    const existingApts = currentRecord.follow_up_appointments || [];
    const apt = existingApts.find(a => a.appointment_id === appointmentId || a.id === appointmentId);

    if (!apt) {
      return {
        success: false,
        error: `Appointment not found: ${appointmentId}`,
        committedRecord: currentRecord,
        committedPatientsList: savedPatientsList
      };
    }

    if (apt.patient_id !== currentRecord.patient.id) {
      return {
        success: false,
        error: `Cross-patient mismatch: appointment belongs to ${apt.patient_id}, not ${currentRecord.patient.id}`,
        committedRecord: currentRecord,
        committedPatientsList: savedPatientsList
      };
    }

    if (apt.status === 'cancelled' || apt.status === 'completed') {
      return {
        success: false,
        error: `Cannot start consultation for ${apt.status} appointment ${appointmentId}`,
        committedRecord: currentRecord,
        committedPatientsList: savedPatientsList
      };
    }

    // Repeated click protection: check if a valid consultation is already linked
    if (apt.actual_visit_id) {
      const existingVisit = (currentRecord.clinical_visits || []).find(
        v => v.visit_id === apt.actual_visit_id || v.id === apt.actual_visit_id
      );
      if (existingVisit) {
        return {
          success: true,
          committedRecord: currentRecord,
          committedPatientsList: savedPatientsList,
          newVisit: existingVisit
        };
      }
    }

    // Pure visit transition
    const transition = createNewVisitTransition({
      patient: currentRecord.patient,
      existingVisits: currentRecord.clinical_visits || [],
      visitType: action.payload.visitType || 'routine_followup',
      visitDate: action.payload.visitDate,
      notes: action.payload.notes || `Follow-up from appointment ${appointmentId}`
    });
    newVisit = transition.newVisit;

    const updatedApts = existingApts.map(a => {
      if (a.appointment_id === appointmentId || a.id === appointmentId) {
        return {
          ...a,
          actual_visit_id: newVisit!.visit_id
        };
      }
      return a;
    });

    proposedRecord = {
      ...currentRecord,
      patient: transition.updatedPatient,
      clinical_visits: transition.updatedVisits,
      follow_up_appointments: updatedApts,
      updated_at: new Date().toISOString()
    };
  } else if (action.type === 'START_NEW_VISIT') {
    const transition = createNewVisitTransition({
      patient: currentRecord.patient,
      existingVisits: currentRecord.clinical_visits || [],
      visitType: action.payload.visitType,
      visitDate: action.payload.visitDate,
      notes: action.payload.notes
    });
    newVisit = transition.newVisit;
    proposedRecord = {
      ...currentRecord,
      patient: transition.updatedPatient,
      clinical_visits: transition.updatedVisits,
      updated_at: new Date().toISOString()
    };
  } else if (action.type === 'REGISTER_PATIENT') {
    proposedRecord = action.payload;
  } else {
    // SAVE_RECORD
    proposedRecord = {
      ...currentRecord,
      ...(action.payload || {}),
      updated_at: new Date().toISOString()
    };
  }

  // 1. Referential integrity validation
  const integrity = validateReferentialIntegrity(proposedRecord);
  if (!integrity.isValid) {
    return {
      success: false,
      error: `Referential integrity validation failed: ${integrity.errors.join('; ')}`,
      committedRecord: currentRecord,
      committedPatientsList: savedPatientsList
    };
  }

  // 2. Prepare proposed updated list
  const patientId = proposedRecord.patient.id;
  let updatedList: PatientRecord[];
  if (action.type === 'REGISTER_PATIENT') {
    updatedList = [proposedRecord, ...savedPatientsList.filter(p => p.patient.id !== patientId)];
  } else {
    const existingIndex = savedPatientsList.findIndex(p => p.patient.id === patientId);
    if (existingIndex >= 0) {
      updatedList = [...savedPatientsList];
      updatedList[existingIndex] = proposedRecord;
    } else {
      updatedList = [proposedRecord, ...savedPatientsList];
    }
  }

  // 3. Attempt atomic persistence
  try {
    const writeResult = storageEngine.setItem('shuddho_saved_patients', updatedList);
    if (writeResult === false) {
      return {
        success: false,
        error: 'Storage write failed (storage returned false)',
        committedRecord: currentRecord,
        committedPatientsList: savedPatientsList
      };
    }
    return {
      success: true,
      committedRecord: proposedRecord,
      committedPatientsList: updatedList,
      newVisit
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Storage write exception (e.g. QuotaExceededError)',
      committedRecord: currentRecord,
      committedPatientsList: savedPatientsList
    };
  }
}
