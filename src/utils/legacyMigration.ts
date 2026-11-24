/**
 * SHUDDHO CLINICAL INFORMATICS ARCHITECTURE
 * Idempotent Legacy Record Migration
 * 
 * Complies with Section 6.6 & Section 11 of Step 01 specifications:
 * - Migrates legacy unversioned patient and visit structures to schema version 2.
 * - Guarantees idempotency: running migration multiple times on the same record
 *   preserves identical IDs, timestamps, and revisions without duplicating visits
 *   or generating orphan snapshot revisions.
 */

import { generateEntityId } from './idGenerator';
import {
  PatientRecord,
  PatientProfile,
  ClinicalVisit,
  ClinicalVisitSnapshot,
  CURRENT_SCHEMA_VERSION
} from '../types';

/**
 * Idempotently migrates an arbitrary or legacy patient record to Schema Version 2.
 */
export function migratePatientRecord(record: any): PatientRecord {
  if (!record || typeof record !== 'object') {
    throw new Error('[Migration] Invalid patient record: record must be an object');
  }

  const rawPatient = record.patient || {};
  const patientId = rawPatient.id || generateEntityId('pt');

  // 1. Normalize Patient Profile
  const migratedPatient: PatientProfile = {
    ...rawPatient,
    schema_version: CURRENT_SCHEMA_VERSION,
    id: patientId,
    name: rawPatient.name || "Patient",
    age: rawPatient.age ?? 0,
    gender: rawPatient.gender || 'female',
    phone: rawPatient.phone || "",
    email: rawPatient.email,
    visit_date: rawPatient.visit_date || new Date().toISOString().split('T')[0],
    current_visit_id: rawPatient.current_visit_id,
    current_phase: rawPatient.current_phase || 1,
    height_cm: rawPatient.height_cm ?? 0,
    weight_kg: rawPatient.weight_kg ?? 0,
    waist_cm: rawPatient.waist_cm ?? 0,
    activity_level: rawPatient.activity_level || 'sedentary',
    sleep_hours: rawPatient.sleep_hours || 7,
    shift_worker: Boolean(rawPatient.shift_worker),
    population_group: rawPatient.population_group || 'adult_standard',
    clinical_pathways: Array.isArray(rawPatient.clinical_pathways) ? rawPatient.clinical_pathways : [],
    r5_pathways: rawPatient.r5_pathways || undefined,
    trimester: rawPatient.trimester,
    bmr_floor_strategy: rawPatient.bmr_floor_strategy || 'clamped_to_bmr',
    custom_calorie_floor: rawPatient.custom_calorie_floor,
    confirmed_allergies: Array.isArray(rawPatient.confirmed_allergies) ? rawPatient.confirmed_allergies : [],
    allergy_reconciliation_status: rawPatient.allergy_reconciliation_status || 'not_assessed',
    clinician_disallowed_foods: Array.isArray(rawPatient.clinician_disallowed_foods) ? rawPatient.clinician_disallowed_foods : [],
    clinician_disallowed_tags: Array.isArray(rawPatient.clinician_disallowed_tags) ? rawPatient.clinician_disallowed_tags : [],
    selected_conditions: Array.isArray(rawPatient.selected_conditions) ? rawPatient.selected_conditions : [],
    active_medications: Array.isArray(rawPatient.active_medications) ? rawPatient.active_medications : [],
    medication_records: Array.isArray(rawPatient.medication_records) ? rawPatient.medication_records : [],
    medication_reconciliation_status: rawPatient.medication_reconciliation_status || 'not_assessed',
    gut_profile: rawPatient.gut_profile || {
      bloating: 'none',
      acid_reflux_hypoacidity: false,
      bristol_stool_score: 4,
      energy_score: 7,
      sleep_quality_score: 7,
      digestive_fire_agni: 'unassessed'
    },
    labs: rawPatient.labs || { lab_flags: [] },
    calculated: rawPatient.calculated || {
      bmi: 0,
      bmi_category_en: 'Unmeasured',
      bmi_category_bn: 'পরিমাপ করা হয়নি',
      bmr: 0,
      tdee: 0,
      target_calories: 0,
      target_protein_g: 0,
      target_carbs_g: 0,
      target_fat_g: 0,
      whtr: 0,
      whtr_risk_en: 'Unmeasured',
      whtr_risk_bn: 'পরিমাপ করা হয়নি',
      is_unmeasured: true
    },
    custom_clinical_notes: rawPatient.custom_clinical_notes || "",
    is_diet_plan_dirty: Boolean(rawPatient.is_diet_plan_dirty),
    assessment_last_updated_at: rawPatient.assessment_last_updated_at || new Date().toISOString(),
    diet_plan_generated_at: rawPatient.diet_plan_generated_at || new Date().toISOString(),
    manual_edits_preserved: Boolean(rawPatient.manual_edits_preserved)
  };

  // 2. Normalize Clinical Visits
  let rawClinicalVisits = Array.isArray(record.clinical_visits) ? record.clinical_visits : [];

  // If clinical_visits is empty but legacy visits (LongitudinalVisit[]) exist, migrate them
  if (rawClinicalVisits.length === 0 && Array.isArray(record.visits) && record.visits.length > 0) {
    rawClinicalVisits = record.visits.map((lv: any, idx: number) => {
      const vid = lv.visit_id || lv.id || `vis_legacy_${patientId}_${idx + 1}`;
      return {
        visit_id: vid,
        id: vid,
        patient_id: patientId,
        visit_number: idx + 1,
        visit_type: idx === 0 ? 'baseline_consultation' : 'routine_followup',
        visit_date: lv.visit_date || migratedPatient.visit_date,
        created_at: lv.created_at || new Date().toISOString(),
        status: 'completed',
        clinical_notes: lv.notes_en || lv.notes_bn || lv.notes || 'Migrated from legacy longitudinal visits'
      };
    });
  }

  const migratedClinicalVisits: ClinicalVisit[] = rawClinicalVisits.map((v: any, idx: number) => {
    const visitId = v.visit_id || v.id || generateEntityId(`vis_${patientId}`);
    return {
      ...v,
      visit_id: visitId,
      id: visitId,
      patient_id: v.patient_id || patientId,
      visit_number: v.visit_number || (idx + 1),
      visit_type: v.visit_type || (idx === 0 ? 'baseline_consultation' : 'routine_followup'),
      visit_date: v.visit_date || migratedPatient.visit_date,
      created_at: v.created_at || new Date().toISOString(),
      status: v.status || 'completed'
    };
  });

  // Ensure patient.current_visit_id is set if visits exist
  if (!migratedPatient.current_visit_id && migratedClinicalVisits.length > 0) {
    migratedPatient.current_visit_id = migratedClinicalVisits[0].visit_id;
  }

  // 3. Normalize Visit Snapshots
  let rawSnapshots = Array.isArray(record.visit_snapshots) ? record.visit_snapshots : [];

  // If no snapshots exist but we migrated legacy visits with measurements, preserve historical measurements as snapshots
  if (rawSnapshots.length === 0 && Array.isArray(record.visits) && record.visits.length > 0) {
    rawSnapshots = record.visits.map((lv: any, idx: number) => {
      const matchingVisit = migratedClinicalVisits[idx];
      const vid = matchingVisit?.visit_id || lv.visit_id || `vis_legacy_${patientId}_${idx + 1}`;
      return {
        snapshot_id: `snap_migrated_${patientId}_${idx + 1}`,
        patient_id: patientId,
        visit_id: vid,
        visit_number: idx + 1,
        visit_date: lv.visit_date || migratedPatient.visit_date,
        is_baseline: idx === 0,
        schema_version: CURRENT_SCHEMA_VERSION,
        revision: 1,
        approval_status: 'draft',
        created_at: lv.created_at || new Date().toISOString(),
        captured_at: lv.created_at || new Date().toISOString(),
        anthropometrics: {
          weight_kg: lv.weight_kg,
          waist_cm: lv.waist_cm,
          whtr: lv.whtr
        },
        gut_metrics: {
          bristol_stool_score: lv.bristol_stool,
          energy_score: lv.energy_score
        },
        biomarkers: {
          homa_ir: lv.homa_ir,
          tg_hdl_ratio: lv.tg_hdl_ratio,
          hba1c: lv.hba1c
        }
      };
    });
  }
  const migratedSnapshots: ClinicalVisitSnapshot[] = rawSnapshots.map((s: any) => {
    const snapId = s.snapshot_id || s.id || generateEntityId(`snap_${patientId}`);
    const visitId = s.visit_id || migratedPatient.current_visit_id || migratedClinicalVisits[0]?.visit_id || generateEntityId(`vis_${patientId}`);
    return {
      ...s,
      snapshot_id: snapId,
      patient_id: s.patient_id || patientId,
      visit_id: visitId,
      schema_version: CURRENT_SCHEMA_VERSION,
      revision: s.revision || 1,
      approval_status: s.approval_status || 'draft',
      created_at: s.created_at || new Date().toISOString(),
      captured_at: s.captured_at || s.created_at || new Date().toISOString(),
      visit_type: s.visit_type || (s.is_baseline ? 'baseline_consultation' : 'routine_followup'),
      is_baseline: Boolean(s.is_baseline)
    };
  });

  return {
    schema_version: CURRENT_SCHEMA_VERSION,
    patient: migratedPatient,
    visits: Array.isArray(record.visits) ? record.visits : [],
    clinical_visits: migratedClinicalVisits,
    follow_up_appointments: Array.isArray(record.follow_up_appointments) ? record.follow_up_appointments : [],
    visit_snapshots: migratedSnapshots,
    progress_reports: Array.isArray(record.progress_reports) ? record.progress_reports : [],
    current_diet_chart: Array.isArray(record.current_diet_chart) ? record.current_diet_chart : [],
    weekly_diet_plan: record.weekly_diet_plan || undefined,
    current_supplements: Array.isArray(record.current_supplements) ? record.current_supplements : [],
    timeline: Array.isArray(record.timeline) ? record.timeline : [],
    updated_at: record.updated_at || new Date().toISOString(),
    created_at: record.created_at || migratedPatient.assessment_last_updated_at || new Date().toISOString()
  };
}
