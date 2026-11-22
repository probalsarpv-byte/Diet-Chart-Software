/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Supabase Practice Repository Implementation
 * Interfaces with PostgreSQL tables enforcing Multi-Tenancy and RLS policies.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { 
  IPracticeRepository, 
  PracticeSyncStatus, 
  AuditEventPayload,
  AssessmentInvitation,
  AssessmentSubmission,
  AssessmentReview,
  ReconciliationDecision
} from './types';
import { PatientProfile, ClinicalVisit, WeeklyDietPlan } from '@/types';
import { ClinicianAuthProfile, getSupabaseClient } from '@/lib/supabaseClient';
import { approveWeeklyDietPlan } from '@/engine/weeklyPlanner';
import { calculateAnthropometrics } from '@/engine/anthropometrics';

export class SupabasePracticeRepository implements IPracticeRepository {
  public readonly isCloud = true;
  private client: SupabaseClient;
  private currentOrgId: string;
  private syncStatus: PracticeSyncStatus = {
    state: 'synced',
    lastSyncedAt: new Date().toISOString(),
    pendingChanges: 0,
    isCloudConnected: true
  };

  constructor(client: SupabaseClient, organizationId: string = 'a0000000-0000-0000-0000-000000000001') {
    this.client = client;
    this.currentOrgId = organizationId;
  }

  private mapRowToPatient(row: any): PatientProfile {
    return {
      schema_version: 2,
      id: row.client_id || row.id,
      name: row.name,
      age: row.age,
      gender: row.gender,
      phone: row.phone || undefined,
      email: row.email || undefined,
      visit_date: row.visit_date || (row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
      current_visit_id: row.current_visit_id || undefined,
      current_phase: row.current_phase || 1,
      population_group: row.population_group || 'adult_standard',
      height_cm: Number(row.height_cm),
      weight_kg: Number(row.weight_kg),
      waist_cm: row.waist_cm ? Number(row.waist_cm) : 85,
      activity_level: row.activity_level || 'sedentary',
      sleep_hours: row.sleep_hours ? Number(row.sleep_hours) : 7,
      shift_worker: Boolean(row.shift_worker),
      bmr_floor_strategy: row.bmr_floor_strategy || 'clamped_to_bmr',
      confirmed_allergies: row.confirmed_allergies || [],
      allergy_reconciliation_status: row.allergy_reconciliation_status || 'none_confirmed',
      clinician_disallowed_foods: row.clinician_disallowed_foods || [],
      clinician_disallowed_tags: row.clinician_disallowed_tags || [],
      selected_conditions: row.selected_conditions || [],
      active_medications: row.active_medications || [],
      medication_records: row.medication_records || [],
      medication_reconciliation_status: row.medication_reconciliation_status || 'unreconciled',
      feeding_status: row.feeding_status || { route: 'oral_standard', oral_intake_permitted: true },
      gut_profile: row.gut_profile || {},
      labs: row.labs || {},
      calculated: row.calculated || {},
      clinical_safety: row.clinical_safety || {},
      is_diet_plan_dirty: Boolean(row.is_diet_plan_dirty),
      custom_clinical_notes: row.notes || undefined
    };
  }

  async getPatients(): Promise<PatientProfile[]> {
    try {
      this.syncStatus.state = 'saving';
      const { data, error } = await this.client
        .from('patients')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      this.syncStatus.state = 'synced';
      this.syncStatus.lastSyncedAt = new Date().toISOString();
      return (data || []).map(row => this.mapRowToPatient(row));
    } catch (e: any) {
      this.syncStatus.state = 'error';
      this.syncStatus.errorMessage = e.message;
      throw e;
    }
  }

  async getPatientById(patientId: string): Promise<PatientProfile | null> {
    try {
      const { data, error } = await this.client
        .from('patients')
        .select('*')
        .or(`client_id.eq.${patientId},id.eq.${patientId}`)
        .maybeSingle();

      if (error) throw error;
      return data ? this.mapRowToPatient(data) : null;
    } catch (e: any) {
      console.error('Failed to get patient by ID:', e);
      return null;
    }
  }

  async savePatient(patient: PatientProfile): Promise<PatientProfile> {
    try {
      this.syncStatus.state = 'saving';
      const payload = {
        client_id: patient.id,
        organization_id: this.currentOrgId,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        current_visit_id: patient.current_visit_id,
        current_phase: patient.current_phase || 1,
        population_group: patient.population_group || 'adult_standard',
        height_cm: patient.height_cm,
        weight_kg: patient.weight_kg,
        waist_cm: patient.waist_cm,
        activity_level: patient.activity_level || 'sedentary',
        sleep_hours: patient.sleep_hours,
        shift_worker: patient.shift_worker || false,
        bmr_floor_strategy: patient.bmr_floor_strategy || 'clamped_to_bmr',
        confirmed_allergies: patient.confirmed_allergies || [],
        allergy_reconciliation_status: patient.allergy_reconciliation_status || 'none_confirmed',
        clinician_disallowed_foods: patient.clinician_disallowed_foods || [],
        clinician_disallowed_tags: patient.clinician_disallowed_tags || [],
        selected_conditions: patient.selected_conditions || [],
        active_medications: patient.active_medications || [],
        medication_records: patient.medication_records || [],
        medication_reconciliation_status: patient.medication_reconciliation_status || 'unreconciled',
        feeding_status: patient.feeding_status || { route: 'oral_standard', oral_intake_permitted: true },
        gut_profile: patient.gut_profile || {},
        labs: patient.labs || {},
        calculated: patient.calculated || {},
        clinical_safety: patient.clinical_safety || {},
        is_diet_plan_dirty: patient.is_diet_plan_dirty || false,
        notes: patient.custom_clinical_notes,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.client
        .from('patients')
        .upsert(payload, { onConflict: 'organization_id, client_id' })
        .select()
        .single();

      if (error) throw error;

      await this.logAuditEvent({
        organization_id: this.currentOrgId,
        patient_id: patient.id,
        event_type: 'PATIENT_UPDATED',
        entity_type: 'patient',
        entity_id: patient.id,
        payload_after: { name: patient.name, age: patient.age, phase: patient.current_phase }
      });

      this.syncStatus.state = 'synced';
      this.syncStatus.lastSyncedAt = new Date().toISOString();
      return this.mapRowToPatient(data);
    } catch (e: any) {
      this.syncStatus.state = 'error';
      this.syncStatus.errorMessage = e.message;
      throw e;
    }
  }

  async deletePatient(patientId: string): Promise<boolean> {
    try {
      this.syncStatus.state = 'saving';
      const { error } = await this.client
        .from('patients')
        .delete()
        .or(`client_id.eq.${patientId},id.eq.${patientId}`);

      if (error) throw error;

      await this.logAuditEvent({
        organization_id: this.currentOrgId,
        patient_id: patientId,
        event_type: 'PATIENT_DELETED',
        entity_type: 'patient',
        entity_id: patientId
      });

      this.syncStatus.state = 'synced';
      return true;
    } catch (e: any) {
      this.syncStatus.state = 'error';
      this.syncStatus.errorMessage = e.message;
      throw e;
    }
  }

  async getVisits(patientId: string): Promise<ClinicalVisit[]> {
    try {
      const { data, error } = await this.client
        .from('visits')
        .select('*')
        .eq('patient_id', patientId)
        .order('visit_number', { ascending: true });

      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.client_visit_id || row.id,
        visit_id: row.client_visit_id || row.id,
        patient_id: patientId,
        visit_number: row.visit_number || 1,
        visit_date: row.visit_date,
        visit_type: (row.visit_type as any) || 'routine_followup',
        clinical_notes: row.clinical_notes,
        status: (row.status as any) || 'in_progress',
        created_at: row.created_at || new Date().toISOString()
      }));
    } catch (e) {
      console.error('Failed to get visits from Supabase:', e);
      return [];
    }
  }

  async saveVisit(visit: ClinicalVisit): Promise<ClinicalVisit> {
    try {
      const payload = {
        client_visit_id: visit.visit_id,
        organization_id: this.currentOrgId,
        patient_id: visit.patient_id,
        visit_number: visit.visit_number || 1,
        visit_date: visit.visit_date,
        phase_number: 1,
        visit_type: visit.visit_type || 'routine_followup',
        clinical_notes: visit.clinical_notes,
        status: visit.status || 'in_progress',
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.client
        .from('visits')
        .upsert(payload, { onConflict: 'organization_id, client_visit_id' })
        .select()
        .single();

      if (error) throw error;

      await this.logAuditEvent({
        organization_id: this.currentOrgId,
        patient_id: visit.patient_id,
        event_type: 'VISIT_CREATED',
        entity_type: 'visit',
        entity_id: visit.visit_id,
        payload_after: visit
      });

      return visit;
    } catch (e: any) {
      console.error('Failed to save visit to Supabase:', e);
      throw e;
    }
  }

  async getNutritionPlan(patientId: string, visitId?: string): Promise<WeeklyDietPlan | null> {
    try {
      let query = this.client
        .from('nutrition_plans')
        .select('*')
        .eq('patient_id', patientId);

      if (visitId) {
        query = query.eq('visit_id', visitId);
      }

      const { data, error } = await query
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        plan_id: data.client_plan_id,
        patient_id: data.patient_id,
        visit_id: data.visit_id,
        version: data.version,
        schema_version: 2,
        status: data.status,
        is_approved: data.is_approved,
        meal_structure: data.meal_structure,
        fasting_schedule: data.fasting_schedule,
        target_macros: data.target_macros,
        days: data.days_json || [],
        nutritional_adequacy: data.nutritional_adequacy,
        overall_safety_status: data.overall_safety_status,
        unresolved_hard_stops: data.unresolved_hard_stops,
        p2_handoff_summary: data.p2_handoff_summary,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (e) {
      console.error('Failed to get plan from Supabase:', e);
      return null;
    }
  }

  async saveNutritionPlan(plan: WeeklyDietPlan): Promise<WeeklyDietPlan> {
    try {
      this.syncStatus.state = 'saving';
      const payload = {
        client_plan_id: plan.plan_id,
        organization_id: this.currentOrgId,
        patient_id: plan.patient_id,
        visit_id: plan.visit_id,
        version: plan.version,
        status: plan.status,
        is_approved: plan.is_approved,
        meal_structure: plan.meal_structure || '3_meals_1_snack',
        fasting_schedule: plan.fasting_schedule,
        target_macros: plan.target_macros || {},
        days_json: plan.days || [],
        nutritional_adequacy: plan.nutritional_adequacy || {},
        overall_safety_status: plan.overall_safety_status || 'SAFE',
        unresolved_hard_stops: plan.unresolved_hard_stops || [],
        p2_handoff_summary: plan.p2_handoff_summary,
        updated_at: new Date().toISOString()
      };

      const { error } = await this.client
        .from('nutrition_plans')
        .upsert(payload, { onConflict: 'organization_id, client_plan_id' });

      if (error) throw error;

      await this.logAuditEvent({
        organization_id: this.currentOrgId,
        patient_id: plan.patient_id,
        event_type: 'PLAN_UPDATED',
        entity_type: 'nutrition_plan',
        entity_id: plan.plan_id,
        payload_after: { version: plan.version, status: plan.status, safety: plan.overall_safety_status }
      });

      this.syncStatus.state = 'synced';
      return plan;
    } catch (e: any) {
      this.syncStatus.state = 'error';
      this.syncStatus.errorMessage = e.message;
      throw e;
    }
  }

  async approveNutritionPlan(
    plan: WeeklyDietPlan,
    clinician: ClinicianAuthProfile,
    notes?: string
  ): Promise<WeeklyDietPlan> {
    if (clinician.role === 'ASSISTANT_DIETITIAN') {
      throw new Error('Approval forbidden: Assistant Dietitians are not authorized to approve nutrition plans.');
    }

    const approvedPlan = approveWeeklyDietPlan(
      plan,
      clinician.name || clinician.email,
      notes
    );

    // Save plan first
    await this.saveNutritionPlan(approvedPlan);

    // Record formal legal signoff in approval_records
    const { error: approvalErr } = await this.client
      .from('approval_records')
      .insert({
        organization_id: this.currentOrgId,
        plan_id: approvedPlan.plan_id,
        patient_id: approvedPlan.patient_id,
        clinician_id: clinician.id,
        clinician_name: clinician.name,
        license_number: clinician.license_number || 'BMDC-VERIFIED',
        plan_version: approvedPlan.version,
        notes: notes || undefined
      });

    if (approvalErr) {
      console.warn('Failed to insert into approval_records directly (RLS gate):', approvalErr);
    }

    await this.logAuditEvent({
      organization_id: this.currentOrgId,
      patient_id: approvedPlan.patient_id,
      clinician_id: clinician.id,
      clinician_name: clinician.name,
      event_type: 'PLAN_APPROVED',
      entity_type: 'approval_record',
      entity_id: approvedPlan.plan_id,
      payload_after: {
        plan_version: approvedPlan.version,
        clinician_name: clinician.name,
        license: clinician.license_number,
        notes
      }
    });

    return approvedPlan;
  }

  // -------------------------------------------------------------------
  // R3 Patient Assessment Operations
  // -------------------------------------------------------------------

  async createAssessmentInvitation(
    patientId: string,
    clinician: ClinicianAuthProfile,
    expiresDays: number = 14
  ): Promise<AssessmentInvitation> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresDays);

    const token = 'sh_inv_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const payload = {
      organization_id: this.currentOrgId,
      patient_id: patientId,
      invitation_token: token,
      expires_at: expiresAt.toISOString(),
      status: 'pending',
      sent_via: 'link'
    };

    const { data, error } = await this.client
      .from('assessment_invitations')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    await this.logAuditEvent({
      organization_id: this.currentOrgId,
      event_type: 'INTAKE_INVITATION_CREATED',
      entity_type: 'assessment_invitation',
      entity_id: data.id,
      patient_id: patientId,
      clinician_id: clinician.id,
      clinician_name: clinician.name,
      payload_after: {
        token: data.invitation_token,
        expires_at: data.expires_at
      }
    });

    return data;
  }

  async getAssessmentInvitations(patientId?: string): Promise<AssessmentInvitation[]> {
    let query = this.client
      .from('assessment_invitations')
      .select('*')
      .order('created_at', { ascending: false });

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getAssessmentInvitationByToken(token: string): Promise<AssessmentInvitation | null> {
    const { data, error } = await this.client
      .from('assessment_invitations')
      .select('*')
      .eq('invitation_token', token)
      .maybeSingle();

    if (error) {
      console.error('Failed to resolve invitation by token:', error);
      return null;
    }
    return data || null;
  }

  async submitAssessment(
    invitationToken: string,
    responses: Record<string, any>
  ): Promise<AssessmentSubmission> {
    const invitation = await this.getAssessmentInvitationByToken(invitationToken);
    if (!invitation) {
      throw new Error('Invalid assessment invitation token.');
    }

    if (invitation.status === 'expired' || new Date(invitation.expires_at) < new Date()) {
      throw new Error('Assessment invitation has expired.');
    }
    if (invitation.status === 'revoked') {
      throw new Error('Assessment invitation has been revoked.');
    }
    if (invitation.status === 'completed') {
      throw new Error('Assessment has already been completed for this invitation.');
    }

    const payload = {
      organization_id: invitation.organization_id,
      invitation_id: invitation.id,
      patient_id: invitation.patient_id,
      responses_json: responses,
      submitted_at: new Date().toISOString()
    };

    const { data, error } = await this.client
      .from('assessment_submissions')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    // Transition invitation to completed
    await this.client
      .from('assessment_invitations')
      .update({ status: 'completed' })
      .eq('id', invitation.id);

    await this.logAuditEvent({
      organization_id: invitation.organization_id,
      event_type: 'INTAKE_SUBMITTED',
      entity_type: 'assessment_submission',
      entity_id: data.id,
      patient_id: invitation.patient_id,
      payload_after: {
        submission_id: data.id,
        response_keys: Object.keys(responses)
      }
    });

    return data;
  }

  async getStagedSubmissions(patientId?: string): Promise<AssessmentSubmission[]> {
    let query = this.client
      .from('assessment_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Filter out submissions that already have reviews
    const { data: reviews } = await this.client
      .from('assessment_reviews')
      .select('submission_id');

    const reviewedIds = new Set((reviews || []).map((r: any) => r.submission_id));
    return (data || []).filter((s: any) => !reviewedIds.has(s.id));
  }

  async getSubmissionById(submissionId: string): Promise<AssessmentSubmission | null> {
    const { data, error } = await this.client
      .from('assessment_submissions')
      .select('*')
      .eq('id', submissionId)
      .maybeSingle();

    if (error) return null;
    return data || null;
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

    // Apply granular decisions
    for (const [field, decision] of Object.entries(decisions)) {
      if (decision.status === 'accepted' || decision.status === 'edited') {
        hasAccepted = true;
        const val = decision.value;

        if (field === 'weight_kg' && val !== undefined) {
          patient.weight_kg = Number(val);
        } else if (field === 'height_cm' && val !== undefined) {
          patient.height_cm = Number(val);
        } else if (field === 'waist_cm' && val !== undefined) {
          patient.waist_cm = Number(val);
        } else if (field === 'sleep_hours' && val !== undefined) {
          patient.sleep_hours = Number(val);
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
          patient.confirmed_allergies = Array.from(new Set([...patient.confirmed_allergies, ...val]));
          patient.allergy_reconciliation_status = 'allergies_confirmed';
        }
      } else if (decision.status === 'rejected') {
        hasRejected = true;
      }
    }

    // Recalculate anthropometrics
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

    const reviewPayload = {
      organization_id: reviewer.organization_id || this.currentOrgId,
      submission_id: submissionId,
      reviewer_id: reviewer.id,
      reviewer_name: reviewer.name,
      review_status: reviewStatus,
      reconciliation_diff_json: decisions,
      merged_patient_snapshot: patient,
      review_notes: notes,
      reviewed_at: new Date().toISOString()
    };

    const { data: reviewData, error: reviewError } = await this.client
      .from('assessment_reviews')
      .insert(reviewPayload)
      .select('*')
      .single();

    if (reviewError) throw reviewError;

    // Save updated patient to PostgreSQL
    const savedPatient = await this.savePatient(patient);

    await this.logAuditEvent({
      organization_id: reviewer.organization_id || this.currentOrgId,
      event_type: reviewStatus === 'rejected' ? 'ASSESSMENT_SUBMISSION_REJECTED' : 'ASSESSMENT_SUBMISSION_ACCEPTED',
      entity_type: 'assessment_review',
      entity_id: reviewData.id,
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
        weight_kg: savedPatient.weight_kg,
        sleep_hours: savedPatient.sleep_hours,
        gut_profile: savedPatient.gut_profile,
        review_status: reviewStatus,
        notes
      }
    });

    return { review: reviewData, updatedPatient: savedPatient };
  }

  async logAuditEvent(event: Omit<AuditEventPayload, 'id' | 'timestamp'>): Promise<void> {
    try {
      const payload = {
        organization_id: event.organization_id || this.currentOrgId,
        clinician_id: event.clinician_id,
        patient_id: event.patient_id,
        event_type: event.event_type,
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        payload_before: event.payload_before,
        payload_after: event.payload_after,
        timestamp: new Date().toISOString()
      };

      await this.client.from('audit_events').insert(payload);
    } catch (e) {
      console.error('Failed to log audit event to Supabase:', e);
    }
  }

  async getAuditEvents(patientId?: string, limit: number = 50): Promise<AuditEventPayload[]> {
    try {
      let query = this.client
        .from('audit_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Failed to fetch audit events from Supabase:', e);
      return [];
    }
  }

  getSyncStatus(): PracticeSyncStatus {
    return this.syncStatus;
  }
}
