/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Local Demo / Offline Repository Implementation
 * Backed by browser localStorage with immutable audit trail simulation.
 */

import { 
  IPracticeRepository, 
  PracticeSyncStatus, 
  AuditEventPayload,
  AssessmentInvitation,
  AssessmentSubmission,
  AssessmentReview,
  ReconciliationDecision,
  PublicIntakeVerificationResult
} from './types';
import { PatientProfile, ClinicalVisit, WeeklyDietPlan } from '@/types';
import { ClinicianAuthProfile } from '@/lib/supabaseClient';
import { R4ProtocolStudioData } from '@/types/r4Protocol';
import { approveWeeklyDietPlan } from '@/engine/weeklyPlanner';
import { calculateAnthropometrics } from '@/engine/anthropometrics';
import { computeSha256Sync, generateSecureIntakeToken } from '@/lib/hashUtils';
import { generateEntityId } from '@/utils/idGenerator';

const STORAGE_KEYS = {
  PATIENTS: 'shuddho_saved_patients',
  AUDIT_LOG: 'shuddho_audit_events',
  PLAN_PREFIX: 'shuddho_plan_',
  INVITATIONS: 'shuddho_assessment_invitations',
  SUBMISSIONS: 'shuddho_assessment_submissions',
  REVIEWS: 'shuddho_assessment_reviews'
};

export class LocalDemoRepository implements IPracticeRepository {
  public readonly isCloud = false;
  private syncStatus: PracticeSyncStatus = {
    state: 'demo',
    lastSyncedAt: new Date().toISOString(),
    pendingChanges: 0,
    isCloudConnected: false
  };

  private getStoredPatients(): PatientProfile[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PATIENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setStoredPatients(patients: PatientProfile[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    } catch (e) {
      console.error('Failed to persist patients locally:', e);
    }
  }

  async getPatients(): Promise<PatientProfile[]> {
    return this.getStoredPatients();
  }

  async getPatientById(patientId: string): Promise<PatientProfile | null> {
    const list = this.getStoredPatients();
    return list.find(p => p.id === patientId) || null;
  }

  async savePatient(patient: PatientProfile): Promise<PatientProfile> {
    const list = this.getStoredPatients();
    const idx = list.findIndex(p => p.id === patient.id);
    const existing = idx >= 0 ? list[idx] : null;

    const updated = {
      ...patient,
      updated_at: new Date().toISOString()
    };

    if (idx >= 0) {
      list[idx] = updated;
    } else {
      list.push(updated);
    }

    this.setStoredPatients(list);

    await this.logAuditEvent({
      event_type: existing ? 'PATIENT_UPDATED' : 'PATIENT_CREATED',
      entity_type: 'patient',
      entity_id: patient.id,
      patient_id: patient.id,
      payload_before: existing,
      payload_after: updated
    });

    return updated;
  }

  async deletePatient(patientId: string): Promise<boolean> {
    const list = this.getStoredPatients();
    const filtered = list.filter(p => p.id !== patientId);
    this.setStoredPatients(filtered);

    await this.logAuditEvent({
      event_type: 'PATIENT_DELETED',
      entity_type: 'patient',
      entity_id: patientId,
      patient_id: patientId
    });

    return true;
  }

  async getVisits(patientId: string): Promise<ClinicalVisit[]> {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(`shuddho_visits_${patientId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async saveVisit(visit: ClinicalVisit): Promise<ClinicalVisit> {
    if (typeof window === 'undefined') return visit;
    try {
      const key = `shuddho_visits_${visit.patient_id}`;
      const visits = await this.getVisits(visit.patient_id);
      const idx = visits.findIndex(v => v.visit_id === visit.visit_id);
      if (idx >= 0) {
        visits[idx] = visit;
      } else {
        visits.push(visit);
      }
      localStorage.setItem(key, JSON.stringify(visits));

      await this.logAuditEvent({
        event_type: 'VISIT_CREATED',
        entity_type: 'visit',
        entity_id: visit.visit_id,
        patient_id: visit.patient_id,
        payload_after: visit
      });
    } catch (e) {
      console.error('Failed to save visit locally:', e);
    }
    return visit;
  }

  async getNutritionPlan(patientId: string, visitId?: string): Promise<WeeklyDietPlan | null> {
    if (typeof window === 'undefined') return null;
    try {
      const key = `${STORAGE_KEYS.PLAN_PREFIX}${patientId}${visitId ? `_${visitId}` : ''}`;
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
      // Fallback to active patient plan if matching
      const fallback = localStorage.getItem('shuddho_weekly_plan');
      if (fallback) {
        const parsed = JSON.parse(fallback);
        if (parsed.patient_id === patientId) return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  async saveNutritionPlan(plan: WeeklyDietPlan): Promise<WeeklyDietPlan> {
    if (typeof window === 'undefined') return plan;
    try {
      const key = `${STORAGE_KEYS.PLAN_PREFIX}${plan.patient_id}_${plan.visit_id}`;
      localStorage.setItem(key, JSON.stringify(plan));
      localStorage.setItem('shuddho_weekly_plan', JSON.stringify(plan));

      await this.logAuditEvent({
        event_type: 'PLAN_UPDATED',
        entity_type: 'nutrition_plan',
        entity_id: plan.plan_id,
        patient_id: plan.patient_id,
        payload_after: {
          version: plan.version,
          status: plan.status,
          safety: plan.overall_safety_status
        }
      });
    } catch (e) {
      console.error('Failed to save plan locally:', e);
    }
    return plan;
  }

  async approveNutritionPlan(
    plan: WeeklyDietPlan,
    clinician: ClinicianAuthProfile,
    notes?: string
  ): Promise<WeeklyDietPlan> {
    if (clinician.role === 'ASSISTANT_DIETITIAN') {
      throw new Error('Approval forbidden: Assistant Dietitians cannot approve clinical plans.');
    }
    if (!clinician.license_number || !clinician.license_number.trim()) {
      throw new Error('Validation Failed: Professional license number is required for formal sign-off.');
    }

    const approved = approveWeeklyDietPlan(
      plan,
      clinician.name || clinician.email,
      notes
    );

    await this.saveNutritionPlan(approved);

    await this.logAuditEvent({
      event_type: 'PLAN_APPROVED',
      entity_type: 'approval_record',
      entity_id: approved.plan_id,
      patient_id: approved.patient_id,
      clinician_id: clinician.id,
      clinician_name: clinician.name,
      payload_after: {
        plan_version: approved.version,
        clinician_name: clinician.name,
        license: clinician.license_number,
        notes
      }
    });

    return approved;
  }

  // -------------------------------------------------------------------
  // R4 Lifestyle & Protocol Studio Operations
  // -------------------------------------------------------------------

  async getLifestylePlan(patientId: string, visitId?: string): Promise<R4ProtocolStudioData | null> {
    if (typeof window === 'undefined') return null;
    try {
      const key = `shuddho_lifestyle_plan_${patientId}${visitId ? `_${visitId}` : ''}`;
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
      // Fallback without visit
      const fallback = localStorage.getItem(`shuddho_lifestyle_plan_${patientId}`);
      if (fallback) return JSON.parse(fallback);
      return null;
    } catch {
      return null;
    }
  }

  async saveLifestylePlan(protocol: R4ProtocolStudioData): Promise<R4ProtocolStudioData> {
    if (typeof window === 'undefined') return protocol;
    try {
      const keyWithVisit = `shuddho_lifestyle_plan_${protocol.patient_id}${protocol.visit_id ? `_${protocol.visit_id}` : ''}`;
      const baseKey = `shuddho_lifestyle_plan_${protocol.patient_id}`;
      const serialized = JSON.stringify(protocol);
      localStorage.setItem(keyWithVisit, serialized);
      localStorage.setItem(baseKey, serialized);

      await this.logAuditEvent({
        event_type: 'PLAN_UPDATED',
        entity_type: 'lifestyle_plan',
        entity_id: protocol.id,
        patient_id: protocol.patient_id,
        payload_after: {
          version: protocol.version,
          status: protocol.status,
          safety: protocol.safety_evaluation?.overall_status,
          can_approve: protocol.safety_evaluation?.can_approve
        }
      });
    } catch (e) {
      console.error('Failed to save lifestyle protocol locally:', e);
    }
    return protocol;
  }

  async approveLifestylePlan(
    protocol: R4ProtocolStudioData,
    clinician: ClinicianAuthProfile,
    notes?: string
  ): Promise<R4ProtocolStudioData> {
    if (clinician.role === 'ASSISTANT_DIETITIAN') {
      throw new Error('Approval forbidden: Assistant Dietitians cannot approve clinical protocols.');
    }
    if (!clinician.license_number || !clinician.license_number.trim()) {
      throw new Error('Validation Failed: Professional license number is required for formal sign-off.');
    }
    if (!protocol.safety_evaluation?.can_approve) {
      throw new Error('Approval Blocked: Protocol contains unresolved clinical Hard Stops.');
    }

    const approved: R4ProtocolStudioData = {
      ...protocol,
      status: 'active',
      is_approved: true,
      approved_by: clinician.id,
      approved_at: new Date().toISOString(),
      approval_notes: notes || protocol.approval_notes,
      version: (protocol.version || 1) + 1,
      is_demo_unverified: true,
      approval_authority: 'LOCAL_SIMULATION_NON_AUTHORITATIVE',
      updated_at: new Date().toISOString()
    };

    await this.saveLifestylePlan(approved);

    // Immutable Historical Snapshot Archiving (P0-009)
    try {
      const historyKey = `shuddho_lifestyle_plan_history_${approved.patient_id}`;
      const existingHistoryJson = localStorage.getItem(historyKey);
      const historyArr: R4ProtocolStudioData[] = existingHistoryJson ? JSON.parse(existingHistoryJson) : [];
      historyArr.push(approved);
      localStorage.setItem(historyKey, JSON.stringify(historyArr));
    } catch (e) {
      console.warn('Failed to archive historical lifestyle protocol snapshot:', e);
    }

    await this.logAuditEvent({
      event_type: 'PLAN_APPROVED',
      entity_type: 'approval_record',
      entity_id: approved.id,
      patient_id: approved.patient_id,
      clinician_id: clinician.id,
      clinician_name: clinician.name,
      payload_after: {
        protocol_version: approved.version,
        clinician_name: clinician.name,
        license: clinician.license_number,
        notes
      }
    });

    return approved;
  }

  // -------------------------------------------------------------------
  // R3 Patient Assessment Operations
  // -------------------------------------------------------------------

  private getStoredInvitations(): AssessmentInvitation[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVITATIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setStoredInvitations(invitations: AssessmentInvitation[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(invitations));
    } catch (e) {
      console.error('Failed to save invitations locally:', e);
    }
  }

  private getStoredSubmissions(): AssessmentSubmission[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setStoredSubmissions(submissions: AssessmentSubmission[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
    } catch (e) {
      console.error('Failed to save submissions locally:', e);
    }
  }

  private getStoredReviews(): AssessmentReview[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setStoredReviews(reviews: AssessmentReview[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    } catch (e) {
      console.error('Failed to save reviews locally:', e);
    }
  }

  async createAssessmentInvitation(
    patientId: string,
    clinician: ClinicianAuthProfile,
    expiresDays: number = 14
  ): Promise<AssessmentInvitation> {
    const invitations = this.getStoredInvitations();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresDays);

    const token = generateSecureIntakeToken('sh_inv_');
    const tokenHash = computeSha256Sync(token);
    const newInvitationId = generateEntityId('inv_');

    // Storage record: Plaintext token is NEVER persisted in database or storage
    const storedInvitation: AssessmentInvitation = {
      id: newInvitationId,
      organization_id: clinician.organization_id || 'org_main',
      patient_id: patientId,
      invitation_token: '', // Plaintext token NOT persisted
      token_hash: tokenHash,
      access_count: 0,
      expires_at: expiresAt.toISOString(),
      status: 'pending',
      sent_via: 'link',
      created_at: new Date().toISOString()
    };

    invitations.unshift(storedInvitation);
    this.setStoredInvitations(invitations);

    await this.logAuditEvent({
      organization_id: clinician.organization_id || 'org_main',
      event_type: 'INTAKE_INVITATION_CREATED',
      entity_type: 'assessment_invitation',
      entity_id: storedInvitation.id,
      patient_id: patientId,
      clinician_id: clinician.id,
      clinician_name: clinician.name,
      payload_after: {
        token_hash_preview: tokenHash.substring(0, 10),
        expires_at: storedInvitation.expires_at
      }
    });

    // Return plaintext token ONCE to the authorized clinician
    return {
      ...storedInvitation,
      invitation_token: token
    };
  }

  async revokeAssessmentInvitation(
    invitationId: string,
    clinician: ClinicianAuthProfile
  ): Promise<boolean> {
    const invitations = this.getStoredInvitations();
    const inv = invitations.find(i => i.id === invitationId);
    if (!inv) return false;

    inv.status = 'revoked';
    inv.revoked_at = new Date().toISOString();
    this.setStoredInvitations(invitations);

    await this.logAuditEvent({
      organization_id: clinician.organization_id || 'org_main',
      event_type: 'INTAKE_INVITATION_REVOKED',
      entity_type: 'assessment_invitation',
      entity_id: inv.id,
      patient_id: inv.patient_id,
      clinician_id: clinician.id,
      clinician_name: clinician.name,
      payload_after: {
        revoked_at: inv.revoked_at,
        token_hash_preview: inv.token_hash?.substring(0, 10)
      }
    });

    return true;
  }

  async rotateAssessmentInvitation(
    invitationId: string,
    clinician: ClinicianAuthProfile,
    expiresDays: number = 14
  ): Promise<AssessmentInvitation> {
    const invitations = this.getStoredInvitations();
    const inv = invitations.find(i => i.id === invitationId);
    if (!inv) {
      throw new Error(`Invitation [${invitationId}] not found.`);
    }

    inv.status = 'revoked';
    inv.revoked_at = new Date().toISOString();
    this.setStoredInvitations(invitations);

    const freshInvitation = await this.createAssessmentInvitation(inv.patient_id, clinician, expiresDays);

    await this.logAuditEvent({
      organization_id: clinician.organization_id || 'org_main',
      event_type: 'INTAKE_INVITATION_ROTATED',
      entity_type: 'assessment_invitation',
      entity_id: freshInvitation.id,
      patient_id: inv.patient_id,
      clinician_id: clinician.id,
      clinician_name: clinician.name,
      payload_after: {
        previous_invitation_id: inv.id,
        fresh_invitation_id: freshInvitation.id,
        expires_at: freshInvitation.expires_at
      }
    });

    return freshInvitation;
  }

  async getAssessmentInvitations(patientId?: string): Promise<AssessmentInvitation[]> {
    const list = this.getStoredInvitations();
    const now = new Date();
    let mutated = false;

    // Check expiration transitions
    for (const inv of list) {
      if (inv.status === 'pending' && new Date(inv.expires_at) < now) {
        inv.status = 'expired';
        mutated = true;
      }
    }
    if (mutated) {
      this.setStoredInvitations(list);
    }

    if (patientId) {
      return list.filter(i => i.patient_id === patientId);
    }
    return list;
  }

  async getAssessmentInvitationByToken(token: string): Promise<AssessmentInvitation | null> {
    if (!token) return null;
    const tokenHash = computeSha256Sync(token);
    const list = await this.getAssessmentInvitations();
    const found = list.find(i => 
      i.token_hash === tokenHash || 
      (i.invitation_token && i.invitation_token === token)
    );
    return found || null;
  }

  async submitAssessment(
    invitationToken: string,
    responses: Record<string, any>
  ): Promise<AssessmentSubmission> {
    if (!invitationToken) {
      throw new Error('Invalid assessment invitation token.');
    }
    const tokenHash = computeSha256Sync(invitationToken);
    const invitations = this.getStoredInvitations();
    const invIndex = invitations.findIndex(i => 
      i.token_hash === tokenHash || 
      (i.invitation_token && i.invitation_token === invitationToken)
    );

    if (invIndex === -1) {
      throw new Error('Invalid assessment invitation token.');
    }

    const invitation = invitations[invIndex];
    if (invitation.status === 'expired' || new Date(invitation.expires_at) < new Date()) {
      throw new Error('Assessment invitation has expired.');
    }
    if (invitation.status === 'revoked') {
      throw new Error('Assessment invitation has been revoked.');
    }
    if (invitation.status === 'completed') {
      throw new Error('Assessment has already been completed for this invitation.');
    }

    // Sanitize clinical payload: strip any accidental bearer tokens
    const cleanResponses = { ...responses };
    delete cleanResponses.invitation_token;
    delete cleanResponses.token;

    const submissions = this.getStoredSubmissions();
    const newSubmission: AssessmentSubmission = {
      id: generateEntityId('sub_'),
      organization_id: invitation.organization_id,
      invitation_id: invitation.id,
      patient_id: invitation.patient_id,
      responses_json: cleanResponses,
      submitted_at: new Date().toISOString()
    };

    submissions.unshift(newSubmission);
    this.setStoredSubmissions(submissions);

    // Transition invitation status to completed
    invitations[invIndex].status = 'completed';
    this.setStoredInvitations(invitations);

    await this.logAuditEvent({
      organization_id: invitation.organization_id,
      event_type: 'INTAKE_SUBMITTED',
      entity_type: 'assessment_submission',
      entity_id: newSubmission.id,
      patient_id: invitation.patient_id,
      payload_after: {
        submission_id: newSubmission.id,
        response_keys: Object.keys(responses)
      }
    });

    return newSubmission;
  }

  async getStagedSubmissions(patientId?: string): Promise<AssessmentSubmission[]> {
    const submissions = this.getStoredSubmissions();
    const reviews = this.getStoredReviews();
    const reviewedSubmissionIds = new Set(reviews.map(r => r.submission_id));

    const pending = submissions.filter(s => !reviewedSubmissionIds.has(s.id));
    if (patientId) {
      return pending.filter(s => s.patient_id === patientId);
    }
    return pending;
  }

  async getSubmissionById(submissionId: string): Promise<AssessmentSubmission | null> {
    const submissions = this.getStoredSubmissions();
    return submissions.find(s => s.id === submissionId) || null;
  }

  async reconcileAssessmentSubmission(
    submissionId: string,
    reviewer: ClinicianAuthProfile,
    decisions: Record<string, ReconciliationDecision>,
    notes?: string
  ): Promise<{ review: AssessmentReview; updatedPatient: PatientProfile }> {
    const submission = await this.getSubmissionById(submissionId);
    if (!submission) {
      throw new Error(`Submission [${submissionId}] not found.`);
    }

    const patient = await this.getPatientById(submission.patient_id);
    if (!patient) {
      throw new Error(`Target patient [${submission.patient_id}] not found.`);
    }

    const patientBefore = JSON.parse(JSON.stringify(patient));
    let hasAccepted = false;
    let hasRejected = false;

    // Strict server-side allowlist for intake reconciliation
    const ALLOWED_RECONCILE_FIELDS = new Set([
      'weight_kg', 'height_cm', 'waist_cm', 'sleep_hours', 'activity_level',
      'bloating', 'bristol_stool_score', 'acid_reflux', 'digestive_fire_agni',
      'confirmed_allergies', 'reported_allergies'
    ]);

    for (const field of Object.keys(decisions)) {
      if (!ALLOWED_RECONCILE_FIELDS.has(field)) {
        throw new Error(`Security Violation: Field [${field}] is not permitted for chart reconciliation.`);
      }
    }

    // Apply granular accepted/edited decisions
    for (const [field, decision] of Object.entries(decisions)) {
      if (decision.status === 'accepted' || decision.status === 'edited') {
        hasAccepted = true;
        const val = decision.value;

        if (field === 'weight_kg' && val !== undefined) {
          const num = Number(val);
          if (isNaN(num) || num < 20 || num > 300) {
            throw new Error(`Validation Failed: Weight value [${val}] is outside plausible clinical range (20-300 kg).`);
          }
          patient.weight_kg = num;
        } else if (field === 'height_cm' && val !== undefined) {
          const num = Number(val);
          if (isNaN(num) || num < 50 || num > 250) {
            throw new Error(`Validation Failed: Height value [${val}] is outside plausible clinical range (50-250 cm).`);
          }
          patient.height_cm = num;
        } else if (field === 'waist_cm' && val !== undefined) {
          const num = Number(val);
          if (isNaN(num) || num < 30 || num > 200) {
            throw new Error(`Validation Failed: Waist value [${val}] is outside plausible clinical range (30-200 cm).`);
          }
          patient.waist_cm = num;
        } else if (field === 'sleep_hours' && val !== undefined) {
          const num = Number(val);
          if (isNaN(num) || num < 0 || num > 24) {
            throw new Error(`Validation Failed: Sleep hours [${val}] is outside plausible range (0-24 hrs).`);
          }
          patient.sleep_hours = num;
        } else if (field === 'activity_level' && val !== undefined) {
          patient.activity_level = val;
        } else if (field === 'bloating' && val !== undefined) {
          patient.gut_profile.bloating = val;
        } else if (field === 'bristol_stool_score' && val !== undefined) {
          patient.gut_profile.bristol_stool_score = Number(val);
        } else if (field === 'acid_reflux' && val !== undefined) {
          patient.gut_profile.acid_reflux_hypoacidity = Boolean(val);
        } else if (field === 'digestive_fire_agni' && val !== undefined) {
          patient.gut_profile.digestive_fire_agni = val;
        } else if (field === 'confirmed_allergies' && Array.isArray(val)) {
          const unionAllergies = Array.from(new Set([...patient.confirmed_allergies, ...val]));
          patient.confirmed_allergies = unionAllergies;
          patient.allergy_reconciliation_status = 'allergies_confirmed';
        }
      } else if (decision.status === 'rejected') {
        hasRejected = true;
      }
    }

    // Recalculate anthropometrics based on updated metrics
    patient.calculated = calculateAnthropometrics(
      patient.age,
      patient.gender,
      patient.height_cm,
      patient.weight_kg,
      patient.waist_cm,
      patient.activity_level,
      patient.selected_conditions,
      patient.population_group,
      patient.trimester,
      patient.bmr_floor_strategy,
      patient.custom_calorie_floor
    );

    let reviewStatus: 'approved' | 'rejected' | 'partially_accepted' = 'approved';
    if (hasAccepted && hasRejected) {
      reviewStatus = 'partially_accepted';
    } else if (!hasAccepted && hasRejected) {
      reviewStatus = 'rejected';
    }

    const review: AssessmentReview = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organization_id: reviewer.organization_id || 'org_main',
      submission_id: submissionId,
      reviewer_id: reviewer.id,
      reviewer_name: reviewer.name,
      review_status: reviewStatus,
      reconciliation_diff_json: decisions,
      merged_patient_snapshot: patient,
      review_notes: notes,
      reviewed_at: new Date().toISOString()
    };

    const reviews = this.getStoredReviews();
    reviews.unshift(review);
    this.setStoredReviews(reviews);

    // Save updated patient to persistence
    await this.savePatient(patient);

    // Invalidate approved nutrition plan if newly confirmed allergies were added or major weight shift occurs
    const allergiesBefore = new Set(patientBefore.confirmed_allergies || []);
    const allergiesAfter = new Set(patient.confirmed_allergies || []);
    const hasNewAllergies = [...allergiesAfter].some(a => !allergiesBefore.has(a));
    const weightBefore = patientBefore.weight_kg;
    const weightAfter = patient.weight_kg;
    const hasMajorWeightChange = weightBefore !== undefined && weightAfter !== undefined && Math.abs(weightAfter - weightBefore) >= 3.0;

    if (hasNewAllergies || hasMajorWeightChange) {
      const currentPlan = await this.getNutritionPlan(patient.id);
      if (currentPlan && currentPlan.is_approved) {
        currentPlan.is_approved = false;
        currentPlan.status = 'requires_review';
        await this.saveNutritionPlan(currentPlan);

        const reason = hasNewAllergies
          ? 'Newly reconciled allergens require clinical safety recalculation'
          : `Significant weight delta (${weightBefore}kg -> ${weightAfter}kg) alters baseline energy floor`;

        await this.logAuditEvent({
          organization_id: reviewer.organization_id || 'org_main',
          event_type: 'PLAN_INVALIDATED',
          entity_type: 'nutrition_plan',
          entity_id: currentPlan.plan_id,
          patient_id: patient.id,
          clinician_id: reviewer.id,
          clinician_name: reviewer.name,
          payload_after: {
            reason,
            plan_id: currentPlan.plan_id,
            new_allergies: [...allergiesAfter].filter(a => !allergiesBefore.has(a)),
            weight_before: weightBefore,
            weight_after: weightAfter
          }
        });
      }
    }

    await this.logAuditEvent({
      organization_id: reviewer.organization_id || 'org_main',
      event_type: reviewStatus === 'rejected' ? 'ASSESSMENT_SUBMISSION_REJECTED' : 'ASSESSMENT_SUBMISSION_ACCEPTED',
      entity_type: 'assessment_review',
      entity_id: review.id,
      patient_id: patient.id,
      clinician_id: reviewer.id,
      clinician_name: reviewer.name,
      payload_before: {
        weight_kg: patientBefore.weight_kg,
        sleep_hours: patientBefore.sleep_hours,
        gut_profile: patientBefore.gut_profile
      },
      payload_after: {
        submission_id: submissionId,
        weight_kg: patient.weight_kg,
        sleep_hours: patient.sleep_hours,
        gut_profile: patient.gut_profile,
        review_status: reviewStatus,
        notes
      }
    });

    return { review, updatedPatient: patient };
  }

  async logAuditEvent(event: Omit<AuditEventPayload, 'id' | 'timestamp'>): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const logs = await this.getAuditEvents();
      const newEvent: AuditEventPayload = {
        ...event,
        id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString()
      };
      logs.unshift(newEvent);
      // Keep max 200 local audit events
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(logs.slice(0, 200)));
    } catch (e) {
      console.error('Failed to log audit event locally:', e);
    }
  }

  async getAuditEvents(patientId?: string, limit: number = 50): Promise<AuditEventPayload[]> {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOG);
      const events: AuditEventPayload[] = data ? JSON.parse(data) : [];
      if (patientId) {
        return events.filter(e => e.patient_id === patientId).slice(0, limit);
      }
      return events.slice(0, limit);
    } catch {
      return [];
    }
  }

  async verifyPublicIntakeToken(token: string): Promise<PublicIntakeVerificationResult> {
    if (!token || !token.trim()) {
      return { valid: false, reason: 'missing' };
    }
    const tokenHash = computeSha256Sync(token);
    const invitations = this.getStoredInvitations();
    const inv = invitations.find(i => 
      i.token_hash === tokenHash || 
      i.invitation_token === token || 
      (i as any).token === token
    );
    if (!inv) {
      return { valid: false, reason: 'invalid' };
    }
    if (inv.status === 'revoked' || inv.revoked_at) {
      return { valid: false, reason: 'revoked' };
    }
    if (inv.status === 'completed') {
      return { valid: false, reason: 'completed' };
    }
    if (new Date(inv.expires_at) < new Date()) {
      return { valid: false, reason: 'expired' };
    }

    // Telemetry: increment access count and update timestamps
    inv.access_count = (inv.access_count || 0) + 1;
    inv.first_accessed_at = inv.first_accessed_at || new Date().toISOString();
    inv.last_accessed_at = new Date().toISOString();
    this.setStoredInvitations(invitations);

    const patient = await this.getPatientById(inv.patient_id);
    return {
      valid: true,
      invitation_id: inv.id,
      expires_at: inv.expires_at,
      status: inv.status,
      patient_display_name: patient?.name || 'Patient',
      initial_age: patient?.age || 35,
      initial_gender: patient?.gender === 'unspecified' ? 'female' : (patient?.gender || 'female')
    };
  }

  async submitPublicIntakeAssessment(
    token: string,
    responses: Record<string, any>,
    patientAcknowledgedConsent?: boolean
  ): Promise<{ success: boolean; submission_id: string; submitted_at: string }> {
    // Derive consent from explicit parameter or embedded responses field
    const consentAcknowledged = patientAcknowledgedConsent ?? Boolean(responses?.patient_acknowledged_consent);
    if (!consentAcknowledged) {
      throw new Error('Consent Not Acknowledged: Patient must explicitly acknowledge the consent statement before submitting assessment data.');
    }
    const verification = await this.verifyPublicIntakeToken(token);
    if (!verification.valid) {
      throw new Error(`Cannot submit assessment: invitation is ${verification.reason}`);
    }
    const submission = await this.submitAssessment(token, responses);
    return {
      success: true,
      submission_id: submission.id,
      submitted_at: submission.submitted_at
    };
  }

  getSyncStatus(): PracticeSyncStatus {
    return this.syncStatus;
  }
}
