/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Supabase Practice Repository Implementation
 * Interfaces with PostgreSQL tables enforcing Multi-Tenancy and RLS policies.
 * 
 * Provides:
 * - Robust UUID <-> Client ID bidirectional resolution & caching
 * - Atomic stored procedure plan approvals (public.approve_nutrition_plan_atomic)
 * - Cryptographically secure token generation (crypto.getRandomValues)
 * - Security-Definer public intake verification & atomic submission RPCs
 */

import { SupabaseClient } from '@supabase/supabase-js';
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
import { computeSha256, generateSecureIntakeToken } from '@/lib/hashUtils';
import { generateEntityId } from '@/utils/idGenerator';

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

  // In-memory mapping cache for Client ID <-> PostgreSQL UUID
  private patientClientToUuid = new Map<string, string>();
  private patientUuidToClient = new Map<string, string>();

  constructor(client: SupabaseClient, organizationId?: string) {
    this.client = client;
    this.currentOrgId = organizationId || '';
  }

  public isUuid(val: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  }

  public async resolvePatientUuid(clientOrUuid: string): Promise<string> {
    if (!clientOrUuid) return clientOrUuid;
    if (this.isUuid(clientOrUuid)) return clientOrUuid;
    if (this.patientClientToUuid.has(clientOrUuid)) {
      const cached = this.patientClientToUuid.get(clientOrUuid);
      if (cached) return cached;
    }
    try {
      const { data } = await this.client
        .from('patients')
        .select('id, client_id')
        .eq('client_id', clientOrUuid)
        .maybeSingle();

      if (data?.id) {
        this.patientClientToUuid.set(clientOrUuid, data.id);
        this.patientUuidToClient.set(data.id, clientOrUuid);
        return data.id;
      }
    } catch (err) {
      console.warn(`Could not resolve patient UUID for client_id [${clientOrUuid}]:`, err);
    }
    return clientOrUuid;
  }

  public async resolvePatientClientId(uuidOrClient: string): Promise<string> {
    if (!uuidOrClient) return uuidOrClient;
    if (!this.isUuid(uuidOrClient)) return uuidOrClient;
    if (this.patientUuidToClient.has(uuidOrClient)) {
      return this.patientUuidToClient.get(uuidOrClient)!;
    }
    try {
      const { data } = await this.client
        .from('patients')
        .select('id, client_id')
        .eq('id', uuidOrClient)
        .maybeSingle();

      if (data?.client_id) {
        this.patientUuidToClient.set(uuidOrClient, data.client_id);
        this.patientClientToUuid.set(data.client_id, uuidOrClient);
        return data.client_id;
      }
    } catch (err) {
      console.warn(`Could not resolve client_id for patient UUID [${uuidOrClient}]:`, err);
    }
    return uuidOrClient;
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
      return (data || []).map(row => {
        if (row.id && row.client_id) {
          this.patientClientToUuid.set(row.client_id, row.id);
          this.patientUuidToClient.set(row.id, row.client_id);
        }
        return this.mapRowToPatient(row);
      });
    } catch (e: any) {
      this.syncStatus.state = 'error';
      this.syncStatus.errorMessage = e.message;
      throw e;
    }
  }

  async getPatientById(patientId: string): Promise<PatientProfile | null> {
    try {
      let query = this.client.from('patients').select('*');
      if (this.isUuid(patientId)) {
        query = query.eq('id', patientId);
      } else {
        query = query.eq('client_id', patientId);
      }
      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      if (data) {
        if (data.id && data.client_id) {
          this.patientClientToUuid.set(data.client_id, data.id);
          this.patientUuidToClient.set(data.id, data.client_id);
        }
        return this.mapRowToPatient(data);
      }
      return null;
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

      if (data && data.id && data.client_id) {
        this.patientClientToUuid.set(data.client_id, data.id);
        this.patientUuidToClient.set(data.id, data.client_id);
      }

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
      let query = this.client.from('patients').delete();
      if (this.isUuid(patientId)) {
        query = query.eq('id', patientId);
      } else {
        query = query.eq('client_id', patientId);
      }
      const { error } = await query;

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
      const patientUuid = await this.resolvePatientUuid(patientId);
      const { data, error } = await this.client
        .from('visits')
        .select('*')
        .eq('patient_id', patientUuid)
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
      const patientUuid = await this.resolvePatientUuid(visit.patient_id);
      const payload = {
        client_visit_id: visit.visit_id,
        organization_id: this.currentOrgId,
        patient_id: patientUuid,
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
      const patientUuid = await this.resolvePatientUuid(patientId);
      let query = this.client
        .from('nutrition_plans')
        .select('*')
        .eq('patient_id', patientUuid);

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
        patient_id: patientId,
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
      const patientUuid = await this.resolvePatientUuid(plan.patient_id);
      const payload = {
        client_plan_id: plan.plan_id,
        organization_id: this.currentOrgId,
        patient_id: patientUuid,
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

    if (!clinician.license_number || !clinician.license_number.trim()) {
      throw new Error('Validation Failed: Professional license number is required for formal sign-off.');
    }

    // 1. Save latest plan contents
    await this.saveNutritionPlan(plan);

    // 2. Execute authoritative atomic approval RPC
    const { data: rpcResult, error: rpcErr } = await this.client.rpc('approve_nutrition_plan_atomic', {
      p_organization_id: this.currentOrgId,
      p_client_plan_id: plan.plan_id,
      p_client_patient_id: plan.patient_id,
      p_clinician_id: clinician.id,
      p_license_number: clinician.license_number,
      p_plan_version: plan.version,
      p_notes: notes || null
    });

    if (rpcErr) {
      console.error('Atomic plan approval RPC error:', rpcErr);
      throw new Error(`Plan approval failed: ${rpcErr.message}`);
    }

    const approvedPlan = approveWeeklyDietPlan(
      plan,
      clinician.name || clinician.email,
      notes
    );

    return approvedPlan;
  }

  // -------------------------------------------------------------------
  // R4 Lifestyle & Protocol Studio Operations
  // -------------------------------------------------------------------

  async getLifestylePlan(patientId: string, visitId?: string): Promise<R4ProtocolStudioData | null> {
    try {
      const patientUuid = await this.resolvePatientUuid(patientId);
      let query = this.client
        .from('lifestyle_plans')
        .select('*')
        .eq('patient_id', patientUuid);

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
        id: data.id,
        patient_id: patientId,
        visit_id: data.visit_id || undefined,
        organization_id: data.organization_id || this.currentOrgId,
        version: data.version || 1,
        status: data.status || 'draft',
        is_approved: Boolean(data.is_approved),
        approved_by: data.approved_by || undefined,
        approved_at: data.approved_at || undefined,
        approval_notes: data.approval_notes || undefined,
        mode: (data.mode as any) || 'automatic_generated',
        lifestyle: data.lifestyle_protocol || { recommendations: [], overall_focus_en: '', overall_focus_bn: '' },
        exercise: data.movement_protocol || { items: [], overall_safety_status: 'SAFE', clinical_contraindications: [], risk_factors_evaluated: [], cardiorespiratory_clearance_status: 'cleared_standard', weekly_aerobic_minutes_target: 150, weekly_resistance_sessions_target: 2 },
        sleep: data.sleep_protocol || { wake_time: '06:30', bed_time: '23:00', target_sleep_hours: 7.5, sleep_regularity_goal_en: '', sleep_regularity_goal_bn: '', daylight_exposure: { scheduled_time: '07:00', duration_minutes: 20, instructions_en: '', instructions_bn: '' }, evening_light: { cutoff_time: '21:30', blue_blockers_recommended: false, screen_curfew_hours_before_bed: 1.5, instructions_en: '', instructions_bn: '' }, caffeine_curfew_time: '14:00', last_meal_curfew_time: '20:00', exercise_curfew_time: '20:00', is_shift_worker: false, shift_schedule_type: 'regular', relaxation_routine_en: '', relaxation_routine_bn: '' },
        hydration: data.hydration_protocol || { baseline_fluid_target_ml: 2200, is_restricted: false, hydration_events: [], total_scheduled_ml: 0, timing_guidance_en: '', timing_guidance_bn: '' },
        supplements: data.supplement_protocol || [],
        chronotherapy_timeline: data.chronotherapy_schedule || [],
        safety_evaluation: data.safety_evaluation || { overall_status: 'SAFE', can_approve: true, hard_stops: [], reviews_required: [], cautions: [], nutrient_overlaps: [], timing_conflicts: [], evaluated_at: new Date().toISOString() },
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (e) {
      console.error('Failed to get lifestyle protocol from Supabase:', e);
      return null;
    }
  }

  async saveLifestylePlan(protocol: R4ProtocolStudioData): Promise<R4ProtocolStudioData> {
    try {
      this.syncStatus.state = 'saving';
      const patientUuid = await this.resolvePatientUuid(protocol.patient_id);
      const payload: any = {
        organization_id: this.currentOrgId,
        patient_id: patientUuid,
        visit_id: protocol.visit_id || null,
        version: protocol.version || 1,
        mode: protocol.mode || 'automatic_generated',
        status: protocol.status || 'draft',
        is_approved: Boolean(protocol.is_approved),
        approved_by: protocol.approved_by || null,
        approved_at: protocol.approved_at || null,
        approval_notes: protocol.approval_notes || null,
        lifestyle_protocol: protocol.lifestyle || {},
        movement_protocol: protocol.exercise || {},
        sleep_protocol: protocol.sleep || {},
        hydration_protocol: protocol.hydration || {},
        supplement_protocol: protocol.supplements || [],
        chronotherapy_schedule: protocol.chronotherapy_timeline || [],
        safety_evaluation: protocol.safety_evaluation || {},
        updated_at: new Date().toISOString()
      };

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(protocol.id);
      if (isUuid) {
        payload.id = protocol.id;
      }

      const { data, error } = await this.client
        .from('lifestyle_plans')
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;

      await this.logAuditEvent({
        organization_id: this.currentOrgId,
        patient_id: protocol.patient_id,
        event_type: 'PLAN_UPDATED',
        entity_type: 'lifestyle_plan',
        entity_id: data?.id || protocol.id,
        payload_after: {
          version: protocol.version,
          status: protocol.status,
          safety: protocol.safety_evaluation?.overall_status,
          can_approve: protocol.safety_evaluation?.can_approve
        }
      });

      this.syncStatus.state = 'synced';
      return {
        ...protocol,
        id: data?.id || protocol.id
      };
    } catch (e: any) {
      this.syncStatus.state = 'error';
      this.syncStatus.errorMessage = e.message;
      throw e;
    }
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
      updated_at: new Date().toISOString()
    };

    const saved = await this.saveLifestylePlan(approved);

    await this.logAuditEvent({
      organization_id: this.currentOrgId,
      patient_id: saved.patient_id,
      event_type: 'PLAN_APPROVED',
      entity_type: 'approval_record',
      entity_id: saved.id,
      clinician_id: clinician.id,
      clinician_name: clinician.name,
      payload_after: {
        protocol_version: saved.version,
        clinician_name: clinician.name,
        license: clinician.license_number,
        notes
      }
    });

    return saved;
  }

  // -------------------------------------------------------------------
  // R3 Patient Assessment Operations
  // -------------------------------------------------------------------

  async createAssessmentInvitation(
    patientId: string,
    clinician: ClinicianAuthProfile,
    expiresDays: number = 14
  ): Promise<AssessmentInvitation> {
    const orgId = clinician.organization_id || this.currentOrgId;
    if (!orgId) {
      throw new Error('Unauthorized: Clinician is not bound to a valid organization.');
    }
    const patientUuid = await this.resolvePatientUuid(patientId);

    // Authoritative Backend Generation RPC (Security Definer) ONLY
    // Production clinical operations strictly fail closed without client-side fallback
    const { data: rpcData, error: rpcErr } = await this.client.rpc('issue_assessment_invitation', {
      p_patient_id: patientUuid,
      p_expires_days: expiresDays,
      p_sent_via: 'link'
    });

    if (rpcErr) {
      console.error('issue_assessment_invitation RPC error:', rpcErr);
      throw new Error(`Invitation creation failed: ${rpcErr.message}`);
    }

    if (!rpcData?.success) {
      throw new Error('Invitation creation failed: invalid backend response.');
    }

    return {
      id: rpcData.invitation_id,
      organization_id: orgId,
      patient_id: patientId,
      invitation_token: rpcData.token, // Plaintext returned ONCE to clinician
      token_hash: rpcData.token_hash,
      access_count: 0,
      expires_at: rpcData.expires_at,
      status: 'pending',
      sent_via: 'link',
      created_at: new Date().toISOString()
    };
  }

  async revokeAssessmentInvitation(
    invitationId: string,
    clinician: ClinicianAuthProfile
  ): Promise<boolean> {
    // Authoritative Backend Revocation RPC (Security Definer) ONLY
    const { error: rpcError } = await this.client.rpc('revoke_assessment_invitation', {
      p_invitation_id: invitationId
    });

    if (rpcError) {
      console.error('revoke_assessment_invitation RPC error:', rpcError);
      throw new Error(`Revocation failed: ${rpcError.message}`);
    }

    await this.logAuditEvent({
      organization_id: clinician.organization_id || this.currentOrgId,
      event_type: 'INTAKE_INVITATION_REVOKED',
      entity_type: 'assessment_invitation',
      entity_id: invitationId,
      clinician_id: clinician.id,
      clinician_name: clinician.name,
      payload_after: {
        revoked_at: new Date().toISOString()
      }
    });

    return true;
  }

  async rotateAssessmentInvitation(
    invitationId: string,
    clinician: ClinicianAuthProfile,
    expiresDays: number = 14
  ): Promise<AssessmentInvitation> {
    // Authoritative Backend Rotation RPC (Security Definer) ONLY
    const { data: rpcData, error: rpcErr } = await this.client.rpc('rotate_assessment_invitation', {
      p_invitation_id: invitationId,
      p_expires_days: expiresDays
    });

    if (rpcErr) {
      console.error('rotate_assessment_invitation RPC error:', rpcErr);
      throw new Error(`Invitation rotation failed: ${rpcErr.message}`);
    }

    if (!rpcData?.success) {
      throw new Error('Invitation rotation failed: invalid backend response.');
    }

    return {
      id: rpcData.invitation_id,
      organization_id: clinician.organization_id || this.currentOrgId,
      patient_id: '',
      invitation_token: rpcData.token,
      token_hash: rpcData.token_hash,
      access_count: 0,
      expires_at: rpcData.expires_at,
      status: 'pending',
      sent_via: 'link',
      created_at: new Date().toISOString()
    };
  }

  async getAssessmentInvitations(patientId?: string): Promise<AssessmentInvitation[]> {
    let query = this.client
      .from('assessment_invitations')
      .select('*')
      .order('created_at', { ascending: false });

    if (patientId) {
      const patientUuid = await this.resolvePatientUuid(patientId);
      query = query.eq('patient_id', patientUuid);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getAssessmentInvitationByToken(token: string): Promise<AssessmentInvitation | null> {
    if (!token) return null;
    const tokenHash = await computeSha256(token);
    const { data, error } = await this.client
      .from('assessment_invitations')
      .select('*')
      .or(`token_hash.eq.${tokenHash},invitation_token.eq.${token},token.eq.${token}`)
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
    // Authoritative Backend Submission RPC (Security Definer) ONLY
    // Delegates to submitPublicIntakeAssessment to enforce server-side consent,
    // atomic one-time invitation consumption, and token sanitization.
    const consent = Boolean(responses?.patient_acknowledged_consent);
    if (!consent) {
      throw new Error('Consent Not Acknowledged: Patient must explicitly acknowledge the consent statement before submitting assessment data.');
    }
    const res = await this.submitPublicIntakeAssessment(invitationToken, responses, consent);
    const sub = await this.getSubmissionById(res.submission_id);
    if (!sub) {
      throw new Error('Failed to retrieve staged assessment submission.');
    }
    return sub;
  }

  async getStagedSubmissions(patientId?: string): Promise<AssessmentSubmission[]> {
    let query = this.client
      .from('assessment_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (patientId) {
      const patientUuid = await this.resolvePatientUuid(patientId);
      query = query.eq('patient_id', patientUuid);
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

    // 1. Authoritative Atomic Database Transaction via RPC
    try {
      const { data: rpcData, error: rpcError } = await this.client.rpc(
        'reconcile_intake_submission_atomic',
        {
          p_submission_id: submissionId,
          p_decisions: decisions,
          p_notes: notes || null
        }
      );

      if (!rpcError && rpcData?.success) {
        const updatedPatient = await this.getPatientById(submission.patient_id);
        if (!updatedPatient) {
          throw new Error('Failed to load updated patient after reconciliation.');
        }

        const { data: reviewData } = await this.client
          .from('assessment_reviews')
          .select('*')
          .eq('id', rpcData.review_id)
          .maybeSingle();

        const review: AssessmentReview = reviewData || {
          id: rpcData.review_id,
          organization_id: reviewer.organization_id || this.currentOrgId,
          submission_id: submissionId,
          reviewer_id: reviewer.id,
          reviewer_name: reviewer.name,
          review_status: rpcData.review_status || 'completed',
          reconciliation_diff_json: decisions,
          merged_patient_snapshot: updatedPatient,
          review_notes: notes,
          reviewed_at: rpcData.reviewed_at || new Date().toISOString()
        };

        return { review, updatedPatient };
      }

      if (rpcError) {
        // If RPC raised a validation or authorization error, bubble it up directly
        if (rpcError.message && (
          rpcError.message.includes('Unauthorized') || 
          rpcError.message.includes('Forbidden') || 
          rpcError.message.includes('Validation Failed') ||
          rpcError.message.includes('Security Violation') ||
          rpcError.message.includes('already been reconciled')
        )) {
          throw new Error(rpcError.message);
        }
        // Any other RPC error — still propagate; no client-side fallback permitted for clinical operations
        throw new Error(`Reconciliation RPC failed: ${rpcError.message}`);
      }
    } catch (rpcErr: any) {
      if (rpcErr.message && (
        rpcErr.message.includes('Unauthorized') || 
        rpcErr.message.includes('Forbidden') || 
        rpcErr.message.includes('Validation Failed') ||
        rpcErr.message.includes('Security Violation') ||
        rpcErr.message.includes('already been reconciled') ||
        rpcErr.message.includes('Reconciliation RPC failed')
      )) {
        throw rpcErr;
      }
      // All other exceptions from the RPC call propagate — no silent fallback
      throw new Error(`Reconciliation failed: ${rpcErr.message || 'Unknown error'}`);
    }

    // Should never reach here — RPC always throws or returns
    throw new Error('Reconciliation: unexpected code path reached.');
  }

  // -------------------------------------------------------------------
  // R3 Secure Public Intake Operations (Security Definer RPC)
  // -------------------------------------------------------------------

  async verifyPublicIntakeToken(token: string): Promise<PublicIntakeVerificationResult> {
    try {
      const { data, error } = await this.client.rpc('verify_public_intake_token', {
        p_token: token
      });

      if (error) {
        console.error('RPC verify_public_intake_token error:', error);
        return { valid: false, reason: 'invalid' };
      }

      return data as PublicIntakeVerificationResult;
    } catch (err: any) {
      console.error('Failed to verify public intake token:', err);
      return { valid: false, reason: 'invalid' };
    }
  }

  async submitPublicIntakeAssessment(
    token: string,
    responses: Record<string, any>,
    patientAcknowledgedConsent?: boolean
  ): Promise<{ success: boolean; submission_id: string; submitted_at: string }> {
    // Derive consent: explicit parameter takes priority; fallback to responses field
    const consentAcknowledged = patientAcknowledgedConsent ?? Boolean(responses?.patient_acknowledged_consent);

    if (!consentAcknowledged) {
      throw new Error('Consent Not Acknowledged: Patient must explicitly acknowledge the consent statement before submitting assessment data.');
    }

    const { data, error } = await this.client.rpc('submit_public_intake_assessment', {
      p_token: token,
      p_responses: responses,
      p_client_ip: null,
      p_patient_acknowledged_consent: consentAcknowledged
    });

    if (error) {
      console.error('RPC submit_public_intake_assessment error:', error);
      throw new Error(error.message || 'Failed to submit intake assessment.');
    }

    return data;
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
