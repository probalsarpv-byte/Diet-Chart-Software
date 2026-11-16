/**
 * SHUDDHO CLINICAL INFORMATICS ARCHITECTURE
 * Visit Lifecycle & Atomic State Transitions
 * 
 * Complies with Section 6.2 & Section 9 of Step 01 specifications:
 * - Pure, deterministic state transition boundaries for visit creation, selection, and completion.
 * - Eliminates asynchronous React state setter race conditions.
 * - Guarantees strict patient ownership and collision-resistant identifiers.
 */

import { generateEntityId } from '../../utils/idGenerator';
import { ClinicalVisit, ClinicalVisitType, PatientProfile } from '../../types';

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
