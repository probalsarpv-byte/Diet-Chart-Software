/**
 * SHUDDHO CLINICAL INFORMATICS ARCHITECTURE
 * Snapshot Manager & Revision Immutability Engine
 * 
 * Complies with Section 6.4 & Section 11 of Step 01 specifications:
 * - Implements immutable clinical snapshot creation and revision management.
 * - Approved historical snapshots are NEVER overwritten or silently deleted.
 * - Amendments to approved consultations increment the revision counter and preserve the audit trail.
 * - Unmeasured observations are preserved without synthetic values.
 */

import { generateEntityId } from '../../utils/idGenerator';
import { calculateAnthropometrics } from '../anthropometrics';
import {
  ClinicalVisitSnapshot,
  PatientProfile,
  ClinicalVisitType
} from '../../types';

export interface ClinicalObservationsPayload {
  weight_kg?: number;
  waist_cm?: number;
  whtr?: number;
  height_cm?: number;
  bristol_stool_score?: number;
  energy_score?: number;
  bloating_severity?: 'none' | 'mild' | 'moderate' | 'severe';
  acid_reflux_present?: boolean;
  sleep_quality_score?: number;
  agni_status?: string;
  notes?: string;
  biomarkers?: Record<string, any>;
  vitals?: Record<string, any>;
}

export interface CreateSnapshotParams {
  patient: PatientProfile;
  visitId: string;
  visitType?: ClinicalVisitType;
  isBaseline?: boolean;
  approvalStatus?: 'draft' | 'approved' | 'invalidated';
  approvedBy?: string;
  relatedAssessmentId?: string;
  amendmentReason?: string;
  amendedFromSnapshotId?: string;
  clinicalSafetyEvaluation?: any;
  p2AnalysisResult?: any;
  clinicalObservationsPayload?: ClinicalObservationsPayload;
}

/**
 * Creates a validated clinical visit snapshot from authoritative patient state.
 */
export function createClinicalSnapshot(params: CreateSnapshotParams): ClinicalVisitSnapshot {
  const {
    patient,
    visitId,
    visitType = 'routine_followup',
    isBaseline = false,
    approvalStatus = 'draft',
    approvedBy,
    relatedAssessmentId,
    amendmentReason,
    amendedFromSnapshotId,
    clinicalSafetyEvaluation,
    p2AnalysisResult,
    clinicalObservationsPayload
  } = params;

  const snapId = generateEntityId(`snap_${patient.id}`);
  const now = new Date().toISOString();

  // Distinguish unmeasured anthropometrics from measured zero
  const isUnmeasured = Boolean(patient.calculated?.is_unmeasured || (patient.weight_kg === 0 && patient.height_cm === 0));

  const obs = clinicalObservationsPayload;
  const weightKg = obs?.weight_kg !== undefined
    ? obs.weight_kg
    : (isUnmeasured && patient.weight_kg === 0 ? undefined : patient.weight_kg);

  const waistCm = obs?.waist_cm !== undefined
    ? obs.waist_cm
    : (isUnmeasured && patient.waist_cm === 0 ? undefined : patient.waist_cm);

  const heightCm = obs?.height_cm !== undefined
    ? obs.height_cm
    : (isUnmeasured && patient.height_cm === 0 ? undefined : patient.height_cm);

  const whtr = (heightCm && heightCm > 0 && waistCm && waistCm > 0)
    ? Math.round((waistCm / heightCm) * 100) / 100
    : (obs?.whtr ?? (isUnmeasured ? undefined : patient.calculated?.whtr));

  let calculatedMetrics = patient.calculated;
  if (weightKg !== undefined && heightCm !== undefined && (obs?.weight_kg !== undefined || obs?.waist_cm !== undefined)) {
    calculatedMetrics = calculateAnthropometrics(
      patient.age,
      patient.gender,
      heightCm,
      weightKg,
      waistCm ?? 0,
      patient.activity_level || 'sedentary',
      patient.selected_conditions || [],
      patient.population_group || 'adult_standard',
      patient.trimester,
      patient.bmr_floor_strategy || 'clamped_to_bmr'
    );
  }

  return {
    snapshot_id: snapId,
    patient_id: patient.id,
    visit_id: visitId,
    visit_date: patient.visit_date || now.split('T')[0],
    visit_type: visitType,
    is_baseline: isBaseline,
    schema_version: 2,
    revision: 1,
    created_at: now,
    captured_at: now,
    approval_status: approvalStatus,
    approved_by: approvedBy,
    related_assessment_id: relatedAssessmentId,
    amendment_reason: amendmentReason,
    amended_from_snapshot_id: amendedFromSnapshotId,
    anthropometrics: {
      weight_kg: weightKg,
      height_cm: heightCm,
      bmi: (weightKg && heightCm) ? calculatedMetrics?.bmi : (isUnmeasured ? undefined : patient.calculated?.bmi),
      waist_cm: waistCm,
      whtr: whtr,
      bmr_kcal: isUnmeasured && !weightKg ? undefined : calculatedMetrics?.bmr,
      tdee_kcal: isUnmeasured && !weightKg ? undefined : calculatedMetrics?.tdee,
      target_calories: isUnmeasured && !weightKg ? undefined : calculatedMetrics?.target_calories,
      target_protein_g: isUnmeasured && !weightKg ? undefined : calculatedMetrics?.target_protein_g,
      target_carbs_g: isUnmeasured && !weightKg ? undefined : calculatedMetrics?.target_carbs_g,
      target_fat_g: isUnmeasured && !weightKg ? undefined : calculatedMetrics?.target_fat_g
    },
    vitals: obs?.vitals ? { ...(patient.vitals || {}), ...obs.vitals } : (patient.vitals || {}),
    biomarkers: (() => {
      const findP2ObsValue = (mId: string): number | undefined => {
        if (!Array.isArray(p2AnalysisResult?.observations)) return undefined;
        const found = p2AnalysisResult.observations.find((o: any) => o.markerId === mId || o.marker_id === mId);
        return typeof found?.value === 'number' ? found.value : undefined;
      };
      return {
        fbs: obs?.biomarkers?.fbs !== undefined ? obs.biomarkers.fbs : (findP2ObsValue('fasting_glucose') ?? (obs ? undefined : patient.labs?.fasting_glucose)),
        ppbs: obs?.biomarkers?.ppbs !== undefined ? obs.biomarkers.ppbs : (findP2ObsValue('two_hour_post_prandial') ?? (obs ? undefined : patient.labs?.two_hour_post_prandial)),
        hba1c: obs?.biomarkers?.hba1c !== undefined ? obs.biomarkers.hba1c : (findP2ObsValue('hba1c') ?? (obs ? undefined : patient.labs?.hba1c)),
        fasting_insulin: obs?.biomarkers?.fasting_insulin !== undefined ? obs.biomarkers.fasting_insulin : (findP2ObsValue('fasting_insulin') ?? (obs ? undefined : patient.labs?.fasting_insulin)),
        homa_ir: obs?.biomarkers?.homa_ir !== undefined ? obs.biomarkers.homa_ir : (findP2ObsValue('homa_ir') ?? (obs ? undefined : patient.labs?.homa_ir)),
        total_cholesterol: obs?.biomarkers?.total_cholesterol !== undefined ? obs.biomarkers.total_cholesterol : (findP2ObsValue('total_cholesterol') ?? (obs ? undefined : patient.labs?.total_cholesterol)),
        triglycerides: obs?.biomarkers?.triglycerides !== undefined ? obs.biomarkers.triglycerides : (findP2ObsValue('triglycerides') ?? (obs ? undefined : patient.labs?.triglycerides)),
        hdl: obs?.biomarkers?.hdl !== undefined ? obs.biomarkers.hdl : (findP2ObsValue('hdl') ?? (obs ? undefined : patient.labs?.hdl)),
        ldl: obs?.biomarkers?.ldl !== undefined ? obs.biomarkers.ldl : (findP2ObsValue('ldl') ?? (obs ? undefined : patient.labs?.ldl)),
        tg_hdl_ratio: obs?.biomarkers?.tg_hdl_ratio !== undefined ? obs.biomarkers.tg_hdl_ratio : (findP2ObsValue('tg_hdl_ratio') ?? (obs ? undefined : patient.labs?.tg_hdl_ratio)),
        serum_creatinine: obs?.biomarkers?.serum_creatinine !== undefined ? obs.biomarkers.serum_creatinine : (findP2ObsValue('serum_creatinine') ?? (obs ? undefined : patient.labs?.serum_creatinine)),
        egfr: obs?.biomarkers?.egfr !== undefined ? obs.biomarkers.egfr : (findP2ObsValue('egfr') ?? (obs ? undefined : patient.labs?.egfr)),
        serum_uric_acid: obs?.biomarkers?.serum_uric_acid !== undefined ? obs.biomarkers.serum_uric_acid : (findP2ObsValue('serum_uric_acid') ?? (obs ? undefined : patient.labs?.uric_acid)),
        sgpt_alt: obs?.biomarkers?.sgpt_alt !== undefined ? obs.biomarkers.sgpt_alt : (findP2ObsValue('alt') ?? (obs ? undefined : patient.labs?.alt)),
        sgot_ast: obs?.biomarkers?.sgot_ast !== undefined ? obs.biomarkers.sgot_ast : (findP2ObsValue('ast') ?? (obs ? undefined : patient.labs?.ast)),
        serum_potassium: obs?.biomarkers?.serum_potassium !== undefined ? obs.biomarkers.serum_potassium : (findP2ObsValue('potassium') ?? (obs ? undefined : patient.labs?.potassium)),
        serum_sodium: obs?.biomarkers?.serum_sodium !== undefined ? obs.biomarkers.serum_sodium : (findP2ObsValue('sodium') ?? (obs ? undefined : patient.labs?.sodium)),
        tsh: obs?.biomarkers?.tsh !== undefined ? obs.biomarkers.tsh : (findP2ObsValue('tsh') ?? (obs ? undefined : patient.labs?.tsh)),
        hemoglobin: obs?.biomarkers?.hemoglobin !== undefined ? obs.biomarkers.hemoglobin : (findP2ObsValue('hemoglobin') ?? (obs ? undefined : patient.labs?.hemoglobin)),
        serum_ferritin: obs?.biomarkers?.serum_ferritin !== undefined ? obs.biomarkers.serum_ferritin : (findP2ObsValue('serum_ferritin') ?? (obs ? undefined : patient.labs?.ferritin)),
        vitamin_d3: obs?.biomarkers?.vitamin_d3 !== undefined ? obs.biomarkers.vitamin_d3 : (findP2ObsValue('vitamin_d3') ?? (obs ? undefined : patient.labs?.vitamin_d3)),
        vitamin_b12: obs?.biomarkers?.vitamin_b12 !== undefined ? obs.biomarkers.vitamin_b12 : (findP2ObsValue('vitamin_b12') ?? (obs ? undefined : patient.labs?.vitamin_b12)),
        hs_crp: obs?.biomarkers?.hs_crp !== undefined ? obs.biomarkers.hs_crp : (findP2ObsValue('hs_crp') ?? (obs ? undefined : patient.labs?.hs_crp))
      };
    })(),
    gut_metrics: {
      bloating_severity: (obs?.bloating_severity ?? patient.gut_profile?.bloating) as any,
      acid_reflux_present: obs?.acid_reflux_present ?? patient.gut_profile?.acid_reflux_hypoacidity,
      bristol_stool_score: obs?.bristol_stool_score ?? patient.gut_profile?.bristol_stool_score,
      energy_score: obs?.energy_score ?? patient.gut_profile?.energy_score,
      sleep_quality_score: obs?.sleep_quality_score ?? patient.gut_profile?.sleep_quality_score,
      agni_status: (obs?.agni_status ?? patient.gut_profile?.digestive_fire_agni) as any
    },
    ayurvedic_state: {
      agni_classification: patient.gut_profile?.digestive_fire_agni,
      prakriti: patient.ayurvedic_context?.prakriti,
      vikriti: patient.ayurvedic_context?.vikriti
    },
    medications: patient.medication_reconciliation || {
      status: patient.medication_reconciliation_status || 'unreconciled',
      reconciled_records: patient.medication_records || [],
      verified_no_medications: false,
      missing_elements: []
    },
    allergies: patient.allergy_reconciliation || {
      status: patient.allergy_reconciliation_status || 'not_assessed',
      confirmed_allergies: patient.confirmed_allergies || [],
      reconciled: Boolean(patient.allergy_reconciliation_status === 'allergies_confirmed' || patient.allergy_reconciliation_status === 'none_confirmed')
    },
    clinical_safety: {
      allergy_reconciliation_status: patient.allergy_reconciliation_status || 'not_assessed',
      medication_reconciliation_status: patient.medication_reconciliation_status || 'not_assessed',
      has_hard_stops: Boolean(clinicalSafetyEvaluation?.overallDecision === 'HARD_STOP'),
      hard_stop_reasons: clinicalSafetyEvaluation?.hardStops?.map((h: any) => h.title_en || h.clinical_explanation_en || 'Contraindication') || []
    },
    report_approval_status: {
      is_approved: Boolean(p2AnalysisResult?.report?.isApproved),
      approved_by: p2AnalysisResult?.report?.approvedBy,
      approved_at: p2AnalysisResult?.report?.approvalDate
    },
    clinical_priorities: (p2AnalysisResult?.p3PlanningContext?.approvedInterventionGoals || []).map((g: any) => g.title_en),
    approved_goals: (p2AnalysisResult?.p3PlanningContext?.approvedInterventionGoals || []).map((g: any) => g.title_en)
  };
}

/**
 * Appends or updates a snapshot in the snapshots collection obeying immutability & revision rules:
 * - Approved snapshots are NEVER deleted or overwritten.
 * - A new revision is minted when amending an existing visit with approved snapshots.
 * - Draft snapshots for the same visit without approved versions may be updated in place.
 */
export function appendSnapshotWithRevisionPolicy(
  existingSnapshots: ClinicalVisitSnapshot[],
  candidateSnapshot: ClinicalVisitSnapshot
): ClinicalVisitSnapshot[] {
  const visitId = candidateSnapshot.visit_id;
  const visitSnaps = existingSnapshots.filter(s => s.visit_id === visitId);

  // If no snapshot exists for this visit, initialize revision 1
  if (visitSnaps.length === 0) {
    const freshSnapshot = { ...candidateSnapshot, revision: 1 };
    return [freshSnapshot, ...existingSnapshots];
  }

  // Check if any existing snapshot for this visit was approved
  const hasApprovedSnapshot = visitSnaps.some(s => s.approval_status === 'approved');

  if (hasApprovedSnapshot) {
    // Check if the latest snapshot for this visit is already an unapproved draft amendment
    const latestSnap = visitSnaps.sort((a, b) => (b.revision || 1) - (a.revision || 1))[0];

    if (latestSnap.approval_status === 'draft') {
      // An unapproved draft amendment already exists for this approved visit.
      // Update this draft amendment in-place to avoid spurious revision increments.
      const updatedDraft: ClinicalVisitSnapshot = {
        ...candidateSnapshot,
        snapshot_id: latestSnap.snapshot_id,
        revision: latestSnap.revision || 1,
        amended_from_snapshot_id: latestSnap.amended_from_snapshot_id,
        captured_at: new Date().toISOString()
      };
      return [
        updatedDraft,
        ...existingSnapshots.filter(s => s.snapshot_id !== latestSnap.snapshot_id)
      ];
    }

    // Approved snapshots are IMMUTABLE. Mint a new revision.
    const maxRevision = Math.max(...visitSnaps.map(s => s.revision || 1));
    const latestApproved = visitSnaps
      .filter(s => s.approval_status === 'approved')
      .sort((a, b) => (b.revision || 1) - (a.revision || 1))[0];

    const amendedSnapshot: ClinicalVisitSnapshot = {
      ...candidateSnapshot,
      revision: maxRevision + 1,
      amended_from_snapshot_id: latestApproved?.snapshot_id || candidateSnapshot.amended_from_snapshot_id,
      captured_at: new Date().toISOString()
    };

    // Prepend the new revision while preserving all existing approved and draft revisions intact
    return [amendedSnapshot, ...existingSnapshots];
  }

  // If only drafts exist, update the latest draft in-place without generating orphan duplicates
  const latestDraft = visitSnaps.sort((a, b) => (b.revision || 1) - (a.revision || 1))[0];
  const updatedSnapshot: ClinicalVisitSnapshot = {
    ...candidateSnapshot,
    snapshot_id: latestDraft.snapshot_id, // Retain stable draft snapshot ID
    revision: latestDraft.revision || 1,
    captured_at: new Date().toISOString()
  };

  return [
    updatedSnapshot,
    ...existingSnapshots.filter(s => s.snapshot_id !== latestDraft.snapshot_id)
  ];
}

/**
 * Returns the latest (highest revision) snapshot for a specific visit.
 */
export function getLatestVisitSnapshot(
  snapshots: ClinicalVisitSnapshot[],
  visitId: string
): ClinicalVisitSnapshot | undefined {
  const matching = snapshots.filter(s => s.visit_id === visitId);
  if (matching.length === 0) return undefined;
  return matching.sort((a, b) => (b.revision || 1) - (a.revision || 1))[0];
}

/**
 * Returns the verified approved baseline snapshot for a patient.
 */
export function getApprovedBaselineSnapshot(
  snapshots: ClinicalVisitSnapshot[]
): ClinicalVisitSnapshot | undefined {
  // Prefer approved baseline snapshot
  const approvedBaseline = snapshots
    .filter(s => s.is_baseline && s.approval_status === 'approved')
    .sort((a, b) => (b.revision || 1) - (a.revision || 1))[0];

  if (approvedBaseline) return approvedBaseline;

  // Fallback to any baseline snapshot
  return snapshots
    .filter(s => s.is_baseline)
    .sort((a, b) => (b.revision || 1) - (a.revision || 1))[0];
}
