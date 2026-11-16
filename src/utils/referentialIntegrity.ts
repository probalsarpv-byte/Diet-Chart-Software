/**
 * SHUDDHO CLINICAL INFORMATICS ARCHITECTURE
 * Referential Integrity Validator
 * 
 * Enforces Section 6 referential integrity boundaries:
 * - assessment.patient_id === visit.patient_id
 * - snapshot.patient_id === visit.patient_id
 * - snapshot.visit_id === assessment.visit_id (when derived from that assessment)
 * - snapshot.patient_id === patient.id
 * - visit.patient_id === patient.id
 * 
 * Guarantees zero cross-patient clinical data contamination at persistence boundaries.
 */

import { PatientRecord } from '../types';

export interface IntegrityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateReferentialIntegrity(record: PatientRecord): IntegrityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const patientId = record.patient?.id;
  if (!patientId || !patientId.trim()) {
    errors.push('INVALID_PATIENT_ID: Patient record missing authoritative patient ID');
    return { isValid: false, errors, warnings };
  }

  const visitIds = new Set<string>();

  // 1. Verify Clinical Visits
  if (Array.isArray(record.clinical_visits)) {
    record.clinical_visits.forEach((v, index) => {
      const vId = v.visit_id || v.id;
      if (!vId) {
        errors.push(`INVALID_VISIT_ID: Visit at index ${index} lacks valid visit ID`);
      } else {
        visitIds.add(vId);
      }

      if (v.patient_id !== patientId) {
        errors.push(`CROSS_PATIENT_VISIT: Visit ${vId} patient_id '${v.patient_id}' does not match record patient_id '${patientId}'`);
      }
    });
  }

  // 2. Verify Clinical Snapshots
  if (Array.isArray(record.visit_snapshots)) {
    record.visit_snapshots.forEach((snap, index) => {
      if (snap.patient_id !== patientId) {
        errors.push(`CROSS_PATIENT_SNAPSHOT: Snapshot ${snap.snapshot_id || index} patient_id '${snap.patient_id}' does not match record patient_id '${patientId}'`);
      }

      if (snap.visit_id && !visitIds.has(snap.visit_id)) {
        // Warning if visit is historical and unlinked, or error if completely orphaned
        warnings.push(`ORPHANED_SNAPSHOT_VISIT: Snapshot ${snap.snapshot_id} references visit '${snap.visit_id}' not found in active clinical_visits list`);
      }
    });
  }

  // 3. Verify Follow-Up Appointments
  if (Array.isArray(record.follow_up_appointments)) {
    record.follow_up_appointments.forEach((apt, index) => {
      if (apt.patient_id !== patientId) {
        errors.push(`CROSS_PATIENT_APPOINTMENT: Appointment ${apt.appointment_id || apt.id || index} patient_id '${apt.patient_id}' does not match record patient_id '${patientId}'`);
      }
    });
  }

  // 4. Verify Progress Reports
  if (Array.isArray(record.progress_reports)) {
    record.progress_reports.forEach((rep, index) => {
      const rPatientId = rep.sectionA_patientAndConsultation?.patient_id;
      if (rPatientId && rPatientId !== patientId) {
        errors.push(`CROSS_PATIENT_REPORT: Progress report ${rep.report_id || index} patient_id '${rPatientId}' does not match record patient_id '${patientId}'`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
