/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * R2/R3 Repository Layer Interface Contracts & Sync Types
 */

import { PatientProfile, ClinicalVisit, WeeklyDietPlan } from '@/types';
import { ClinicianAuthProfile } from '@/lib/supabaseClient';
import { R4ProtocolStudioData } from '@/types/r4Protocol';

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
    | 'SESSION_LOGOUT'
    | 'INTAKE_INVITATION_CREATED'
    | 'INTAKE_INVITATION_REVOKED'
    | 'INTAKE_INVITATION_ROTATED'
    | 'INTAKE_SUBMITTED'
    | 'ASSESSMENT_SUBMISSION_ACCEPTED'
    | 'ASSESSMENT_SUBMISSION_REJECTED';
  entity_type: 
    | 'patient' 
    | 'visit' 
    | 'nutrition_plan' 
    | 'lifestyle_plan'
    | 'approval_record' 
    | 'patient_report' 
    | 'auth'
    | 'assessment_invitation'
    | 'assessment_submission'
    | 'assessment_review';
  entity_id: string;
  payload_before?: any;
  payload_after?: any;
  timestamp?: string;
}

export interface AssessmentInvitation {
  id: string;
  organization_id: string;
  patient_id: string;
  template_id?: string;
  invitation_token: string;
  token_hash?: string;
  expires_at: string;
  status: 'pending' | 'completed' | 'expired' | 'revoked';
  sent_via?: 'link' | 'whatsapp' | 'email' | 'sms';
  access_count?: number;
  first_accessed_at?: string;
  last_accessed_at?: string;
  revoked_at?: string;
  created_at: string;
}

export interface AssessmentSubmission {
  id: string;
  organization_id: string;
  invitation_id: string;
  patient_id: string;
  responses_json: Record<string, any>;
  calculated_scores_json?: Record<string, any>;
  submitted_at: string;
  client_ip?: string;
}

export interface ReconciliationDecision {
  status: 'accepted' | 'rejected' | 'edited';
  value?: any;
  reason?: string;
}

export interface AssessmentReview {
  id: string;
  organization_id: string;
  submission_id: string;
  reviewer_id: string;
  reviewer_name: string;
  review_status: 'pending' | 'approved' | 'rejected' | 'partially_accepted';
  reconciliation_diff_json: Record<string, any>;
  merged_patient_snapshot?: any;
  review_notes?: string;
  reviewed_at: string;
}

export interface PublicIntakeVerificationResult {
  valid: boolean;
  reason?: 'missing' | 'invalid' | 'revoked' | 'completed' | 'expired';
  invitation_id?: string;
  expires_at?: string;
  status?: string;
  patient_display_name?: string;
  initial_age?: number;
  initial_gender?: 'male' | 'female';
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

  // R4 Lifestyle & Protocol Studio Operations
  getLifestylePlan(patientId: string, visitId?: string): Promise<R4ProtocolStudioData | null>;
  saveLifestylePlan(protocol: R4ProtocolStudioData): Promise<R4ProtocolStudioData>;
  approveLifestylePlan(
    protocol: R4ProtocolStudioData,
    clinician: ClinicianAuthProfile,
    notes?: string
  ): Promise<R4ProtocolStudioData>;

  // R3 Patient Assessment Operations
  createAssessmentInvitation(
    patientId: string,
    clinician: ClinicianAuthProfile,
    expiresDays?: number
  ): Promise<AssessmentInvitation>;
  revokeAssessmentInvitation(
    invitationId: string,
    clinician: ClinicianAuthProfile
  ): Promise<boolean>;
  rotateAssessmentInvitation(
    invitationId: string,
    clinician: ClinicianAuthProfile,
    expiresDays?: number
  ): Promise<AssessmentInvitation>;
  getAssessmentInvitations(patientId?: string): Promise<AssessmentInvitation[]>;
  getAssessmentInvitationByToken(token: string): Promise<AssessmentInvitation | null>;
  submitAssessment(
    invitationToken: string,
    responses: Record<string, any>
  ): Promise<AssessmentSubmission>;
  getStagedSubmissions(patientId?: string): Promise<AssessmentSubmission[]>;
  getSubmissionById(submissionId: string): Promise<AssessmentSubmission | null>;
  reconcileAssessmentSubmission(
    submissionId: string,
    reviewer: ClinicianAuthProfile,
    decisions: Record<string, ReconciliationDecision>,
    notes?: string
  ): Promise<{ review: AssessmentReview; updatedPatient: PatientProfile }>;

  // R3 Secure Public Intake Portal Operations (Security Definer RPC or Demo)
  verifyPublicIntakeToken(token: string): Promise<PublicIntakeVerificationResult>;
  submitPublicIntakeAssessment(
    token: string,
    responses: Record<string, any>
  ): Promise<{ success: boolean; submission_id: string; submitted_at: string }>;

  // Audit Operations
  logAuditEvent(event: Omit<AuditEventPayload, 'id' | 'timestamp'>): Promise<void>;
  getAuditEvents(patientId?: string, limit?: number): Promise<AuditEventPayload[]>;

  // Sync Diagnostics
  getSyncStatus(): PracticeSyncStatus;
}
