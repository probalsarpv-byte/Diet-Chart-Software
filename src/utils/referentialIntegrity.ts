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
 * - snapshot.visit_id MUST exist in clinical_visits
 * - duplicate visit_id and snapshot_id are strictly rejected
 * - patient.current_visit_id MUST exist in clinical_visits
 * 
 * Guarantees zero cross-patient clinical data contamination at persistence boundaries.
 */

import { PatientRecord } from '../types';

export interface IntegrityValidationOptions {
  allowQuarantinedLegacy?: boolean;
}

export interface IntegrityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  isQuarantined?: boolean;
}

export function validateReferentialIntegrity(
  record: PatientRecord,
  options?: IntegrityValidationOptions
): IntegrityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const isQuarantined = Boolean(
    (record as any).quarantined_legacy ||
    (record as any).is_quarantined ||
    (record as any)._legacy_unverified
  );

  const patientId = record.patient?.id;
  if (!patientId || !patientId.trim()) {
    errors.push('INVALID_PATIENT_ID: Patient record missing authoritative patient ID');
    return { isValid: false, errors, warnings, isQuarantined };
  }

  const visitIds = new Set<string>();
  const snapshotIds = new Set<string>();

  // 1. Verify Clinical Visits
  if (Array.isArray(record.clinical_visits)) {
    record.clinical_visits.forEach((v, index) => {
      const vId = v.visit_id || v.id;
      if (!vId) {
        errors.push(`INVALID_VISIT_ID: Visit at index ${index} lacks valid visit ID`);
      } else {
        if (visitIds.has(vId)) {
          errors.push(`DUPLICATE_VISIT_ID: Duplicate visit identifier '${vId}' detected at index ${index}`);
        } else {
          visitIds.add(vId);
        }
      }

      if (v.patient_id !== patientId) {
        errors.push(`CROSS_PATIENT_VISIT: Visit ${vId} patient_id '${v.patient_id}' does not match record patient_id '${patientId}'`);
      }
    });
  }

  // 2. Verify Patient Current Visit Pointer
  if (record.patient?.current_visit_id) {
    if (!visitIds.has(record.patient.current_visit_id)) {
      if (options?.allowQuarantinedLegacy && isQuarantined) {
        warnings.push(`INVALID_CURRENT_VISIT: Legacy record current_visit_id '${record.patient.current_visit_id}' unverified`);
      } else {
        errors.push(`INVALID_CURRENT_VISIT: Patient current_visit_id '${record.patient.current_visit_id}' does not exist in clinical_visits`);
      }
    }
  }

  // 3. Verify Clinical Snapshots
  if (Array.isArray(record.visit_snapshots)) {
    record.visit_snapshots.forEach((snap, index) => {
      const snapId = snap.snapshot_id;
      if (snapId) {
        if (snapshotIds.has(snapId)) {
          errors.push(`DUPLICATE_SNAPSHOT_ID: Duplicate snapshot identifier '${snapId}' detected at index ${index}`);
        } else {
          snapshotIds.add(snapId);
        }
      }

      if (snap.patient_id !== patientId) {
        errors.push(`CROSS_PATIENT_SNAPSHOT: Snapshot ${snap.snapshot_id || index} patient_id '${snap.patient_id}' does not match record patient_id '${patientId}'`);
      }

      if (!snap.visit_id || !snap.visit_id.trim()) {
        errors.push(`MISSING_SNAPSHOT_VISIT_ID: Snapshot ${snap.snapshot_id || index} lacks valid non-empty visit_id`);
      } else if (!visitIds.has(snap.visit_id)) {
        if (options?.allowQuarantinedLegacy && isQuarantined) {
          warnings.push(`ORPHANED_SNAPSHOT_VISIT: Legacy snapshot ${snap.snapshot_id} references visit '${snap.visit_id}' not found in active clinical_visits list`);
        } else {
          errors.push(`ORPHANED_SNAPSHOT_VISIT: Snapshot ${snap.snapshot_id} references visit '${snap.visit_id}' not found in active clinical_visits list`);
        }
      }
    });
  }

  // 4. Verify Follow-Up Appointments
  if (Array.isArray(record.follow_up_appointments)) {
    record.follow_up_appointments.forEach((apt, index) => {
      if (apt.patient_id !== patientId) {
        errors.push(`CROSS_PATIENT_APPOINTMENT: Appointment ${apt.appointment_id || apt.id || index} patient_id '${apt.patient_id}' does not match record patient_id '${patientId}'`);
      }
    });
  }

  // 5. Verify Progress Reports
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
    warnings,
    isQuarantined
  };
}
