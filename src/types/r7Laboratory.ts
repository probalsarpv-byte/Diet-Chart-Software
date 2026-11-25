/**
 * SHUDDHO Phase R7 — Canonical Laboratory, Biomarker Pattern & Evidence Governance Types
 */

import { FunctionalMatrixDomain } from './r5Systems';

export type R7LabPanelId =
  | 'glycemic'
  | 'lipid'
  | 'renal'
  | 'electrolytes'
  | 'hepatic'
  | 'thyroid'
  | 'hematology_iron'
  | 'vitamins_minerals'
  | 'inflammatory_markers'
  | 'custom';

export type LabResultAvailability =
  | 'available'
  | 'pending'
  | 'not_tested'
  | 'declined_unavailable'
  | 'invalid'
  | 'superseded';

export type LabVerificationStatus =
  | 'patient_reported'
  | 'imported_unreconciled'
  | 'lab_document_reviewed'
  | 'clinician_verified'
  | 'unverified';

export type LabSourceType =
  | 'manual_clinician_entry'
  | 'patient_intake'
  | 'lab_report_upload'
  | 'legacy_patient_profile'
  | 'derived_calculation'
  | 'imported_external';

export type LabSpecimenType =
  | 'serum'
  | 'plasma'
  | 'whole_blood'
  | 'urine_spot'
  | 'urine_24h'
  | 'capillary'
  | 'unknown';

export type R7ReferenceProvenance =
  | 'laboratory_provided'
  | 'guideline_fallback'
  | 'population_adapted'
  | 'unavailable';

export interface R7EvidenceReference {
  rule_id: string;
  clinical_claim: string;
  source_title: string;
  organization_or_authors: string;
  publication_date_or_version: string;
  source_url_or_doi: string;
  applicable_population: string;
  threshold_or_recommendation: string;
  evidence_category: 'tier1_guideline' | 'tier2_clinical_study' | 'tier3_consensus_safety' | 'exploratory_functional';
  known_limitations: string;
  verified_date: string;
}

export interface R7UnitConversionRule {
  from_unit: string;
  to_unit: string;
  factor?: number;
  formula_id: string;
  convert: (val: number) => number;
}

export interface R7CanonicalMarkerDefinition {
  canonical_id: string;
  legacy_marker_ids: string[];
  aliases: string[];
  panel: R7LabPanelId;
  label_en: string;
  label_bn: string;
  result_type: 'numeric' | 'qualitative';
  canonical_unit: string;
  supported_units: string[];
  disallowed_cross_conversions?: Array<{ from: string; to: string; reason: string }>;
  compatible_specimens: LabSpecimenType[];
  default_specimen: LabSpecimenType;
  requires_fasting?: boolean;
  population_applicability: 'all' | 'adult_only' | 'sex_specific_ref' | 'pediatric_caution';
  interpretation_eligible: boolean;
  related_systems: FunctionalMatrixDomain[];
  evidence_ids: string[];
  physiological_bounds?: { min: number; max: number };
  fallback_reference_interval?: {
    adult_all?: { low?: number; high?: number; text: string; source: string };
    male?: { low?: number; high?: number; text: string; source: string };
    female?: { low?: number; high?: number; text: string; source: string };
    pediatric_note?: string;
    pregnancy_note?: string;
  };
  exploratory_functional_range?: {
    low?: number;
    high?: number;
    text: string;
    disclaimer_en: string;
    disclaimer_bn: string;
  };
}

export interface R7NormalizedLabObservation {
  observation_id: string;
  canonical_marker_id: string;
  original_marker_id: string;
  original_marker_name: string;
  panel: R7LabPanelId;
  patient_id?: string;
  visit_id?: string;
  lab_report_id?: string;
  original_value?: number | string;
  original_unit?: string;
  normalized_value?: number;
  display_normalized_value?: number;
  canonical_unit?: string;
  is_exact_measurement: boolean;
  inequality_operator?: '<' | '<=' | '>' | '>=';
  qualitative_result?: string;
  specimen_type: LabSpecimenType;
  collection_datetime?: string;
  report_date?: string;
  fasting_status?: 'fasting' | 'nonfasting' | 'unknown';
  lab_ref_low?: number;
  lab_ref_high?: number;
  ref_interval_provenance: R7ReferenceProvenance;
  availability: LabResultAvailability;
  verification_status: LabVerificationStatus;
  source_type: LabSourceType;
  assay_method?: string;
  verified_by?: string;
  verified_at?: string;
  supersedes_observation_id?: string;
  notes?: string;
  data_quality_flags: string[];
  is_interpretable: boolean;
}

export type R7BiomarkerClassificationStatus =
  | 'not_assessed'
  | 'result_pending'
  | 'unverified_result'
  | 'within_reference_interval'
  | 'below_reference_interval'
  | 'above_reference_interval'
  | 'meets_clinical_decision_threshold'
  | 'critical_low'
  | 'critical_high'
  | 'indeterminate'
  | 'not_applicable'
  | 'conflicting_results'
  | 'clinical_review_required';

export type R7SafetySeverity = 'critical' | 'urgent_review' | 'moderate_review' | 'info' | 'none';

export interface R7DualRangeBiomarkerEvaluation {
  observation: R7NormalizedLabObservation;
  marker_label_en: string;
  marker_label_bn: string;
  panel: R7LabPanelId;
  reference_status: R7BiomarkerClassificationStatus;
  clinical_decision_status?: R7BiomarkerClassificationStatus;
  exploratory_functional_status?: 'within_exploratory_zone' | 'outside_exploratory_zone' | 'not_supported';
  layer1_reference_interval: {
    low?: number;
    high?: number;
    unit?: string;
    display: string;
    provenance: R7ReferenceProvenance;
    source_note?: string;
  };
  layer2_decision_threshold?: {
    threshold_label_en: string;
    threshold_label_bn: string;
    threshold_display: string;
    met: boolean;
    evidence_id: string;
    requires_confirmatory_repeat?: boolean;
  };
  layer3_exploratory_functional?: {
    low?: number;
    high?: number;
    unit?: string;
    display: string;
    note_en: string;
    note_bn: string;
    is_exploratory: true;
  };
  safety_severity: R7SafetySeverity;
  is_critical_finding: boolean;
  is_urgent_verification_required: boolean;
  insight_en: string;
  insight_bn: string;
  related_systems: FunctionalMatrixDomain[];
  evidence_ids: string[];
  population_notes?: string;
}

export interface R7DerivedBiomarkerResult {
  derived_id: 'homa_ir' | 'tg_hdl_ratio' | 'non_hdl' | 'transferrin_saturation' | 'ast_alt_ratio' | 'fib4' | 'uacr' | 'nlr' | 'calculated_egfr';
  name_en: string;
  name_bn: string;
  formula_id: string;
  formula_version: string;
  status: 'calculated' | 'unavailable' | 'not_applicable' | 'unverified_inputs';
  value?: number;
  display_value?: string;
  unit?: string;
  input_observation_ids: string[];
  input_summary: Array<{ marker_id: string; value?: number; unit?: string; collection_datetime?: string; verification_status?: LabVerificationStatus }>;
  eligibility_met: boolean;
  ineligibility_reason_en?: string;
  ineligibility_reason_bn?: string;
  evidence_source_id: string;
  limitations_en: string;
  limitations_bn: string;
  interpretation_en?: string;
  interpretation_bn?: string;
}

export interface R7BiomarkerPatternFinding {
  pattern_id:
    | 'glycemic_dysregulation'
    | 'insulin_associated_metabolic'
    | 'atherogenic_lipid'
    | 'renal_electrolyte_review'
    | 'hepatic_biomarker'
    | 'iron_anemia_review'
    | 'b12_folate_review'
    | 'thyroid_laboratory'
    | 'vitamin_d_mineral_review'
    | 'inflammatory_biomarker';
  title_en: string;
  title_bn: string;
  supporting_observation_ids: string[];
  contradictory_observation_ids: string[];
  missing_relevant_markers: string[];
  applicable_population: string;
  verification_state: 'verified' | 'partially_verified' | 'unverified' | 'insufficient_data';
  evidence_certainty: 'guideline_supported' | 'clinical_review_indicated' | 'exploratory_context' | 'insufficient_data';
  clinical_interpretation_en: string;
  clinical_interpretation_bn: string;
  possible_nutrition_implications_en: string[];
  possible_nutrition_implications_bn: string[];
  relevant_functional_systems: FunctionalMatrixDomain[];
  monitoring_considerations_en: string[];
  recommended_review_action_en: string;
  recommended_review_action_bn: string;
  evidence_ids: string[];
}

export interface R7CriticalLabFinding {
  finding_id: string;
  observation_id: string;
  canonical_marker_id: string;
  marker_label_en: string;
  marker_label_bn: string;
  category: 'lab_designated_critical' | 'software_critical_rule' | 'urgent_verification_required';
  value_display: string;
  verification_status: LabVerificationStatus;
  requires_clinician_reconciliation: boolean;
  blocks_patient_release: boolean;
  action_required_en: string;
  action_required_bn: string;
  evidence_id: string;
}

export interface R7LabTrendEntry {
  canonical_marker_id: string;
  marker_label_en: string;
  marker_label_bn: string;
  canonical_unit?: string;
  current_value?: number;
  current_date?: string;
  previous_value?: number;
  previous_date?: string;
  absolute_change?: number;
  percent_change?: number;
  direction: 'increased' | 'decreased' | 'stable' | 'insufficient_history' | 'incomparable';
  comparable: boolean;
  incomparability_reason?: string;
  reference_interval_changed: boolean;
}

export interface R7LabIntelligenceSummary {
  patient_id: string;
  visit_id?: string;
  reconciled_at: string;
  observations: Record<string, R7NormalizedLabObservation>;
  all_observations_list: R7NormalizedLabObservation[];
  evaluations: R7DualRangeBiomarkerEvaluation[];
  derived_indices: R7DerivedBiomarkerResult[];
  patterns: R7BiomarkerPatternFinding[];
  critical_findings: R7CriticalLabFinding[];
  review_queue: R7NormalizedLabObservation[];
  trends: R7LabTrendEntry[];
  has_blocking_critical_findings: boolean;
  has_unverified_urgent_findings: boolean;
  blocks_patient_release: boolean;
  blocking_reasons_en: string[];
  blocking_reasons_bn: string[];
}
