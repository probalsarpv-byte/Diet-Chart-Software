/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * R2 Repository Layer Interface Contracts & Sync Types
 */

import { PatientProfile, ClinicalVisit, WeeklyDietPlan } from '@/types';
import { ClinicianAuthProfile } from '@/lib/supabaseClient';

export type SyncState = 'synced' | 'saving' | 'error' | 'offline' | 'demo';

export interface PracticeSyncStatus {
  state: SyncState;
  lastSyncedAt?: string;
  pendingChanges: number;
  errorMessage?: string;
  isCloudConnected: boolean;
}

export interface AuditEventPayload {
  id?: string;
  organization_id?: string;
  clinician_id?: string;
  clinician_name?: string;
  patient_id?: string;
  event_type: 
    | 'PATIENT_CREATED'
    | 'PATIENT_UPDATED'
    | 'PATIENT_DELETED'
    | 'VISIT_CREATED'
    | 'PLAN_GENERATED'
    | 'PLAN_UPDATED'
    | 'PLAN_APPROVED'
    | 'PLAN_INVALIDATED'
    | 'REPORT_RELEASED'
    | 'DATA_MIGRATED'
    | 'SESSION_LOGIN'
    | 'SESSION_LOGOUT';
  entity_type: 'patient' | 'visit' | 'nutrition_plan' | 'approval_record' | 'patient_report' | 'auth';
  entity_id: string;
  payload_before?: any;
  payload_after?: any;
  timestamp?: string;
}

export interface IPracticeRepository {
  readonly isCloud: boolean;
  
  // Patient Operations
  getPatients(): Promise<PatientProfile[]>;
  getPatientById(patientId: string): Promise<PatientProfile | null>;
  savePatient(patient: PatientProfile): Promise<PatientProfile>;
  deletePatient(patientId: string): Promise<boolean>;

  // Visit Operations
  getVisits(patientId: string): Promise<ClinicalVisit[]>;
  saveVisit(visit: ClinicalVisit): Promise<ClinicalVisit>;

  // Plan Operations
  getNutritionPlan(patientId: string, visitId?: string): Promise<WeeklyDietPlan | null>;
  saveNutritionPlan(plan: WeeklyDietPlan): Promise<WeeklyDietPlan>;
  approveNutritionPlan(
    plan: WeeklyDietPlan,
    clinician: ClinicianAuthProfile,
    notes?: string
  ): Promise<WeeklyDietPlan>;

  // Audit Operations
  logAuditEvent(event: Omit<AuditEventPayload, 'id' | 'timestamp'>): Promise<void>;
  getAuditEvents(patientId?: string, limit?: number): Promise<AuditEventPayload[]>;

  // Sync Diagnostics
  getSyncStatus(): PracticeSyncStatus;
}
