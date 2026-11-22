/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Local Demo / Offline Repository Implementation
 * Backed by browser localStorage with immutable audit trail simulation.
 */

import { IPracticeRepository, PracticeSyncStatus, AuditEventPayload } from './types';
import { PatientProfile, ClinicalVisit, WeeklyDietPlan } from '@/types';
import { ClinicianAuthProfile } from '@/lib/supabaseClient';
import { approveWeeklyDietPlan } from '@/engine/weeklyPlanner';

const STORAGE_KEYS = {
  PATIENTS: 'shuddho_saved_patients',
  AUDIT_LOG: 'shuddho_audit_events',
  PLAN_PREFIX: 'shuddho_plan_'
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

  getSyncStatus(): PracticeSyncStatus {
    return this.syncStatus;
  }
}
