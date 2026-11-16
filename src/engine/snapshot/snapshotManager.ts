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
import {
  ClinicalVisitSnapshot,
  PatientProfile,
  ClinicalVisitType
} from '../../types';

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
    p2AnalysisResult
  } = params;

  const snapId = generateEntityId(`snap_${patient.id}`);
  const now = new Date().toISOString();

  // Distinguish unmeasured anthropometrics from measured zero
  const isUnmeasured = Boolean(patient.calculated?.is_unmeasured || (patient.weight_kg === 0 && patient.height_cm === 0));

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
      weight_kg: isUnmeasured && patient.weight_kg === 0 ? undefined : patient.weight_kg,
      height_cm: isUnmeasured && patient.height_cm === 0 ? undefined : patient.height_cm,
      bmi: isUnmeasured ? undefined : patient.calculated?.bmi,
      waist_cm: isUnmeasured && patient.waist_cm === 0 ? undefined : patient.waist_cm,
      whtr: isUnmeasured ? undefined : patient.calculated?.whtr,
      bmr_kcal: isUnmeasured ? undefined : patient.calculated?.bmr,
      tdee_kcal: isUnmeasured ? undefined : patient.calculated?.tdee,
      target_calories: isUnmeasured ? undefined : patient.calculated?.target_calories,
      target_protein_g: isUnmeasured ? undefined : patient.calculated?.target_protein_g,
      target_carbs_g: isUnmeasured ? undefined : patient.calculated?.target_carbs_g,
      target_fat_g: isUnmeasured ? undefined : patient.calculated?.target_fat_g
    },
    vitals: patient.vitals || {},
    biomarkers: {
      fbs: patient.labs?.fasting_glucose,
      ppbs: patient.labs?.two_hour_post_prandial,
      hba1c: patient.labs?.hba1c,
      fasting_insulin: patient.labs?.fasting_insulin,
      homa_ir: patient.labs?.homa_ir,
      total_cholesterol: patient.labs?.total_cholesterol,
      triglycerides: patient.labs?.triglycerides,
      hdl: patient.labs?.hdl,
      ldl: patient.labs?.ldl,
      tg_hdl_ratio: patient.labs?.tg_hdl_ratio,
      serum_creatinine: patient.labs?.serum_creatinine,
      egfr: patient.labs?.egfr,
      serum_uric_acid: patient.labs?.uric_acid,
      sgpt_alt: patient.labs?.alt,
      sgot_ast: patient.labs?.ast,
      serum_potassium: patient.labs?.potassium,
      serum_sodium: patient.labs?.sodium,
      tsh: patient.labs?.tsh,
      hemoglobin: patient.labs?.hemoglobin,
      serum_ferritin: patient.labs?.ferritin,
      vitamin_d3: patient.labs?.vitamin_d3,
      vitamin_b12: patient.labs?.vitamin_b12,
      hs_crp: patient.labs?.hs_crp
    },
    gut_metrics: {
      bloating_severity: patient.gut_profile?.bloating,
      acid_reflux_present: patient.gut_profile?.acid_reflux_hypoacidity,
      bristol_stool_score: patient.gut_profile?.bristol_stool_score,
      energy_score: patient.gut_profile?.energy_score,
      sleep_quality_score: patient.gut_profile?.sleep_quality_score,
      agni_status: patient.gut_profile?.digestive_fire_agni
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
