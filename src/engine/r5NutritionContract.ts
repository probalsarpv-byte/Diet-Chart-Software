import { ClinicalVisit, PatientProfile } from '../types';
import { StructuredLabEntry } from '../types/assessment';
import { R5MedicationRecord, R5NutritionAdjustmentContract } from '../types/r5Systems';
import { R7NormalizedLabObservation } from '../types/r7Laboratory';
import { evaluateR7LaboratoryIntelligence } from './r7/biomarkerIntelligence';
import { isEligibleCanonicalScalarObservation } from './r7/labFoundation';
import { evaluateMedicationNutritionInteractions } from './r5MedicationNutritionEngine';
import { analyzeInsulinRegimen } from './r5InsulinEngine';
import { extractLabNumericValue } from './r5SystemsNetworkEngine';

type MarkerAvailabilityState =
  | 'available_verified'
  | 'available_unverified'
  | 'conflicting'
  | 'invalid'
  | 'pending'
  | 'unavailable';

function isConfirmedVerification(status?: string): boolean {
  return status === 'clinician_verified' || status === 'lab_document_reviewed';
}

function classifyMarkerState(
  obs: R7NormalizedLabObservation | undefined,
  legacyRaw: unknown
): { state: MarkerAvailabilityState; value: number | undefined; verified: boolean } {
  if (obs) {
    if (obs.data_quality_flags.includes('conflicting_duplicate_results')) {
      return { state: 'conflicting', value: undefined, verified: false };
    }
    if (obs.availability === 'invalid') {
      return { state: 'invalid', value: undefined, verified: false };
    }
    if (obs.availability === 'pending') {
      return { state: 'pending', value: undefined, verified: false };
    }
    if (obs.availability === 'not_tested' || obs.availability === 'declined_unavailable' || obs.availability === 'superseded') {
      return { state: 'unavailable', value: undefined, verified: false };
    }
    if (!isEligibleCanonicalScalarObservation(obs)) {
      return { state: 'invalid', value: undefined, verified: false };
    }
    const verified = isConfirmedVerification(obs.verification_status);
    return {
      state: verified ? 'available_verified' : 'available_unverified',
      value: obs.normalized_value,
      verified
    };
  }

  const legacyNum = extractLabNumericValue(legacyRaw);
  if (legacyNum !== null && Number.isFinite(legacyNum) && legacyNum >= 0) {
    return { state: 'available_unverified', value: legacyNum, verified: false };
  }

  return { state: 'unavailable', value: undefined, verified: false };
}

/**
 * Authoritative pure builder for the R5 + R7 reactive Nutrition Adjustment Contract
 * (`PracticeContext.r5NutritionContract`). Enforces canonical R7 biomarker lookup
 * (`potassium`, `reported_egfr`, separate `calculated_egfr`), zero fabricated defaults
 * (never `potassium ?? 0` or `egfr ?? 100`), unverified vs verified separation,
 * and non-bypassable critical safety escalation.
 */
export function buildR5NutritionAdjustmentContract(options: {
  patient: PatientProfile;
  currentVisit?: ClinicalVisit | null;
  r5Pathways?: { selected_pathways?: string[] } | null;
  r5Medications?: R5MedicationRecord[];
  structuredLabEntries?: Record<string, StructuredLabEntry> | StructuredLabEntry[];
}): R5NutritionAdjustmentContract {
  const { patient, currentVisit, r5Pathways, r5Medications = [], structuredLabEntries } = options;
  const pathwayIds = r5Pathways?.selected_pathways || [];
  const contraindications: R5NutritionAdjustmentContract['absolute_contraindications'] = [];
  const cautions: R5NutritionAdjustmentContract['conditional_cautions'] = [];

  const activeVisitIdForLabs = patient.current_visit_id || currentVisit?.visit_id || currentVisit?.id;
  const r7LabSummary = evaluateR7LaboratoryIntelligence({
    patient,
    visitId: activeVisitIdForLabs,
    structuredEntries: structuredLabEntries
  });

  // 1. DNI Hard Stops & High-Risk Interventions (lab-qualified in R7)
  const dni = evaluateMedicationNutritionInteractions(r5Medications, patient, {
    labSummary: r7LabSummary
  });
  for (const d of dni) {
    if (d.severity === 'critical_hard_stop') {
      contraindications.push({
        food_name_bn: d.affected_nutrients.join(', ') || d.title_bn,
        food_name_en: d.affected_nutrients.join(', ') || d.title_en,
        reason_bn: d.required_action_bn,
        reason_en: d.required_action_en,
        priority_level: 1
      });
    } else if (d.severity === 'high_clinical_review' || d.severity === 'moderate_caution') {
      cautions.push({
        food_name_bn: d.affected_nutrients.join(', ') || d.title_bn,
        food_name_en: d.affected_nutrients.join(', ') || d.title_en,
        guideline_bn: d.required_action_bn,
        guideline_en: d.required_action_en
      });
    }
  }

  let potassiumLimit: number | undefined = undefined;
  let proteinGPerKg: number | undefined = undefined;
  let sodiumLimit: number | undefined = undefined;

  const labsAny = (patient.labs || {}) as Record<string, any>;

  // Checkpoint D: Canonical keys `potassium` & `reported_egfr` — NEVER `?? 0` or `?? 100`
  const potObs = r7LabSummary.observations.potassium;
  const potEval = classifyMarkerState(potObs, labsAny.potassium ?? labsAny.serum_potassium);
  const serumK = potEval.value;

  const repEgfrObs = r7LabSummary.observations.reported_egfr;
  const repEgfrEval = classifyMarkerState(repEgfrObs, labsAny.reported_egfr ?? labsAny.egfr);
  const reportedEgfr = repEgfrEval.value;

  const crObs = r7LabSummary.observations.creatinine;
  const crEval = classifyMarkerState(crObs, labsAny.serum_creatinine ?? labsAny.creatinine);

  const calcEgfrAny = r7LabSummary.derived_indices.find(d => d.derived_id === 'calculated_egfr');
  const calcEgfrDerived =
    calcEgfrAny && calcEgfrAny.status === 'calculated' && calcEgfrAny.eligibility_met
      ? calcEgfrAny
      : undefined;
  const calculatedEgfr =
    calcEgfrDerived && typeof calcEgfrDerived.value === 'number' && Number.isFinite(calcEgfrDerived.value) && calcEgfrDerived.value > 0
      ? calcEgfrDerived.value
      : undefined;

  const egfrDiscordant =
    reportedEgfr !== undefined &&
    calculatedEgfr !== undefined &&
    Math.abs(reportedEgfr - calculatedEgfr) >= 15 &&
    ((reportedEgfr < 60) !== (calculatedEgfr < 60) || (reportedEgfr < 30) !== (calculatedEgfr < 30));

  type EgfrState = NonNullable<R5NutritionAdjustmentContract['lab_safety_context']>['egfr_state'];
  let egfrState: EgfrState = 'unavailable';
  if (egfrDiscordant) {
    egfrState = 'conflicting';
  } else if (repEgfrEval.state !== 'unavailable') {
    egfrState = repEgfrEval.state;
  } else if (calcEgfrAny?.status === 'not_applicable') {
    egfrState = 'clinically_ineligible';
  } else if (calculatedEgfr !== undefined) {
    egfrState = crEval.verified ? 'available_verified' : 'available_unverified';
  }

  const effectiveEgfr = egfrDiscordant ? undefined : (reportedEgfr ?? calculatedEgfr);
  const egfrVerified = egfrState === 'available_verified';
  const egfrSource: 'reported' | 'calculated' | 'unavailable' =
    reportedEgfr !== undefined ? 'reported' : calculatedEgfr !== undefined ? 'calculated' : 'unavailable';

  const clinicalReviewFlags: NonNullable<R5NutritionAdjustmentContract['clinical_review_flags']> = [];
  const adjustmentCandidates: NonNullable<R5NutritionAdjustmentContract['adjustment_candidates']> = [];

  let acuteEscalation: R5NutritionAdjustmentContract['acute_escalation'] = undefined;

  // Conflicting potassium or invalid potassium still triggers clinical review/block without fabricating a numeric K+ limit
  if (potEval.state === 'conflicting') {
    clinicalReviewFlags.push({
      parameter: 'potassium',
      flag: 'CLINICAL_REVIEW_REQUIRED',
      rationale_en: 'Conflicting duplicate serum potassium values present; resolve laboratory discrepancy before applying renal/potassium rules.',
      rationale_bn: 'সিরাম পটাশিয়ামের পরস্পরবিরোধী ফলাফল বিদ্যমান; ল্যাব রিপোর্ট সমন্বয় না হওয়া পর্যন্ত অনুমোদন স্থগিত।',
      evidence_status: 'CONFLICTING_REQUIRES_RECONCILIATION'
    });
  }

  if (serumK !== undefined && serumK >= 6.0) {
    const isVerified = potEval.verified;
    acuteEscalation = {
      required: true,
      trigger: isVerified ? 'SERUM_POTASSIUM_SEVERE_ELEVATION' : 'SERUM_POTASSIUM_CRITICAL_UNVERIFIED',
      priority: isVerified ? 'CRITICAL_URGENT' : 'HIGH_REVIEW',
      message_en: isVerified
        ? `Critical Hyperkalemia Alert: Serum Potassium is ${serumK.toFixed(1)} mmol/L (>= 6.0 mmol/L). Acute electrophysiological risk of fatal cardiac arrhythmia. Immediate medical referral and ECG monitoring required; unreviewed diet prescription release blocked.`
        : `Urgent Verification Required: Unverified critical serum potassium (${serumK.toFixed(1)} mmol/L >= 6.0 mmol/L). Confirm with official laboratory report and urgent physician evaluation before releasing prescription.`,
      message_bn: isVerified
        ? `জরুরি হাইপারক্যালেমিয়া সতর্কতা: সিরাম পটাশিয়াম ${serumK.toFixed(1)} mmol/L (>= ৬.০)। মারাত্মক কার্ডিয়াক অ্যারিথমিয়া ঝুঁকি। অবিলম্বে চিকিৎসক রেফারেল ও ইসিজি প্রয়োজন; প্রেসক্রিপশন প্রকাশ স্থগিত।`
        : `জরুরি যাচাইকরণ আবশ্যক: অযাচাইকৃত মারাত্মক পটাশিয়াম (${serumK.toFixed(1)} mmol/L)। মূল ল্যাব রিপোর্ট ও চিকিৎসকের মূল্যায়ন ছাড়া প্রকাশ স্থগিত।`,
      block_release: true
    };
    clinicalReviewFlags.push({
      parameter: 'potassium',
      flag: isVerified ? 'HARD_CONTRAINDICATION' : 'CLINICAL_REVIEW_REQUIRED',
      rationale_en: isVerified
        ? `Verified serum potassium ${serumK.toFixed(1)} mmol/L indicates acute severe hyperkalemia. Unreviewed nutrition release blocked; requires emergency clinician orders.`
        : `Unverified serum potassium ${serumK.toFixed(1)} mmol/L is in critical hyperkalemic range. Cannot claim LAB_SUPPORTED without verification; release blocked pending confirmation.`,
      rationale_bn: isVerified
        ? `যাচাইকৃত সিরাম পটাশিয়াম ${serumK.toFixed(1)} mmol/L মারাত্মক হাইপারক্যালেমিয়া নির্দেশ করে। জরুরি মূল্যায়ন ব্যতীত প্রকাশ স্থগিত।`
        : `অযাচাইকৃত সিরাম পটাশিয়াম ${serumK.toFixed(1)} mmol/L জরুরি সীমায়; যাচাই না হওয়া পর্যন্ত প্রকাশ স্থগিত।`,
      evidence_status: isVerified ? 'LAB_SUPPORTED' : 'CLINICAL_REVIEW_REQUIRED'
    });
    adjustmentCandidates.push({
      id: 'adj_potassium_acute_emergency',
      triggering_source: isVerified
        ? 'Verified Lab Marker: Serum Potassium >= 6.0 mmol/L'
        : 'Unverified Critical Entry: Serum Potassium >= 6.0 mmol/L',
      clinical_rationale: isVerified
        ? 'Acute electrophysiological cardiac emergency'
        : 'Potentially life-threatening critical potassium entry awaiting laboratory verification',
      relevant_functional_systems: ['cardiovascular', 'renal_electrolyte'],
      evidence_status: isVerified ? 'LAB_SUPPORTED' : 'CLINICAL_REVIEW_REQUIRED',
      proposed_adjustment: isVerified
        ? 'Hold unreviewed diet chart; immediate hospital/nephrology referral'
        : 'Hold release; verify potassium with lab report / urgent repeat draw',
      clinician_review_required: true,
      affected_diet_components: ['high_potassium_foods', 'fluid_intake']
    });
  } else if (r7LabSummary.blocks_patient_release) {
    const topCritical = r7LabSummary.critical_findings[0];
    acuteEscalation = {
      required: true,
      trigger: topCritical ? `R7_${topCritical.canonical_marker_id.toUpperCase()}_SAFETY_GATE` : 'R7_LAB_SAFETY_GATE',
      priority: topCritical?.category === 'urgent_verification_required' ? 'HIGH_REVIEW' : 'CRITICAL_URGENT',
      message_en: r7LabSummary.blocking_reasons_en.join(' | '),
      message_bn: r7LabSummary.blocking_reasons_bn.join(' | '),
      block_release: true
    };
    for (const cf of r7LabSummary.critical_findings) {
      clinicalReviewFlags.push({
        parameter: cf.canonical_marker_id,
        flag: cf.category === 'urgent_verification_required' ? 'CLINICAL_REVIEW_REQUIRED' : 'HARD_CONTRAINDICATION',
        rationale_en: cf.action_required_en,
        rationale_bn: cf.action_required_bn,
        evidence_status: isConfirmedVerification(cf.verification_status) ? 'LAB_SUPPORTED' : 'CLINICAL_REVIEW_REQUIRED'
      });
    }
  }

  const patientPrescriptions = (patient as any).prescriptions;
  if (patientPrescriptions?.potassium?.limit_mg) {
    potassiumLimit = patientPrescriptions.potassium.limit_mg;
    clinicalReviewFlags.push({
      parameter: 'potassium',
      flag: 'CLINICIAN_APPROVED_TARGET',
      rationale_en: `Clinician documented potassium ceiling of ${potassiumLimit} mg/day approved.`,
      rationale_bn: `চিকিৎসক কর্তৃক অনুমোদিত পটাশিয়াম সিলিং ${potassiumLimit} মিগ্রা/দিন।`,
      evidence_status: 'CLINICIAN_VERIFIED'
    });
    adjustmentCandidates.push({
      id: 'adj_potassium_prescribed',
      triggering_source: 'Clinician Documented Prescription',
      clinical_rationale: 'Prescribed potassium target',
      relevant_functional_systems: ['renal_electrolyte'],
      evidence_status: 'CLINICIAN_VERIFIED',
      proposed_adjustment: `Enforce ${potassiumLimit} mg/day dietary potassium limit`,
      clinician_review_required: false,
      affected_diet_components: ['high_potassium_foods']
    });
  } else if (serumK !== undefined && serumK >= 5.0 && serumK < 6.0) {
    const isVerified = potEval.verified;
    clinicalReviewFlags.push({
      parameter: 'potassium',
      flag: 'CLINICAL_REVIEW_REQUIRED',
      rationale_en: isVerified
        ? `Serum Potassium ${serumK.toFixed(1)} mmol/L is borderline elevated. Individualized portion review and culinary leaching recommended. Clinician confirmation required before establishing numeric ceiling.`
        : `Unverified Serum Potassium ${serumK.toFixed(1)} mmol/L is borderline elevated. Confirm laboratory verification before applying potassium dietary adjustments.`,
      rationale_bn: isVerified
        ? `সিরাম পটাশিয়াম ${serumK.toFixed(1)} mmol/L কিছুটা বেশি। খাবারের পরিমাণ পর্যালোচনা এবং রান্নার পূর্বে ভিজিয়ে সিদ্ধ করা প্রয়োজন।`
        : `অযাচাইকৃত সিরাম পটাশিয়াম ${serumK.toFixed(1)} mmol/L; ল্যাব রিপোর্ট যাচাই প্রয়োজন।`,
      evidence_status: isVerified ? 'LAB_SUPPORTED' : 'CLINICAL_REVIEW_REQUIRED'
    });
    adjustmentCandidates.push({
      id: 'adj_potassium_borderline',
      triggering_source: `Lab Marker: Serum Potassium ${serumK.toFixed(1)} mmol/L (${isVerified ? 'Verified' : 'Unverified'})`,
      clinical_rationale: 'Borderline hyperkalemia requires culinary leaching and portion review without automatic hard prohibition',
      relevant_functional_systems: ['renal_electrolyte'],
      evidence_status: isVerified ? 'LAB_SUPPORTED' : 'CLINICAL_REVIEW_REQUIRED',
      proposed_adjustment: 'Advise vegetable leaching/boiling and portion moderation pending clinician verification; avoid arbitrary blanket cap',
      clinician_review_required: true,
      affected_diet_components: ['vegetables', 'fruits']
    });
  }

  // Protein targets derived from verified clinical diagnosis & dialysis status, NOT broad pathway or default eGFR
  const confirmedConditions = (patient.selected_conditions || []) as string[];
  const isDialysis = confirmedConditions.includes('ckd_dialysis') || (patient as any).is_on_dialysis === true;
  const hasReducedEgfr = egfrVerified && effectiveEgfr !== undefined && effectiveEgfr > 0 && effectiveEgfr < 60;
  const isCKDNonDialysis =
    confirmedConditions.includes('ckd_stage_1_3b') ||
    (confirmedConditions.includes('hypertension_ckd') && hasReducedEgfr);

  if (egfrDiscordant) {
    clinicalReviewFlags.push({
      parameter: 'egfr',
      flag: 'CLINICAL_REVIEW_REQUIRED',
      rationale_en: `Reported eGFR (${reportedEgfr!.toFixed(1)} mL/min/1.73m²) and calculated CKD-EPI eGFR (${calculatedEgfr!.toFixed(1)} mL/min/1.73m²) cross a clinical staging boundary. Clinician reconciliation required before automatic renal staging.`,
      rationale_bn: `রিপোর্টেড ইজিএফআর (${reportedEgfr!.toFixed(1)}) এবং হিসাবকৃত ইজিএফআর (${calculatedEgfr!.toFixed(1)})-এর মধ্যে উল্লেখযোগ্য পার্থক্য রয়েছে; ক্লিনিক্যাল পর্যালোচনা প্রয়োজন।`,
      evidence_status: 'CONFLICTING_REQUIRES_RECONCILIATION'
    });
  } else if (confirmedConditions.includes('hypertension_ckd') && !egfrVerified && !isDialysis) {
    clinicalReviewFlags.push({
      parameter: 'egfr',
      flag: 'CLINICAL_REVIEW_REQUIRED',
      rationale_en:
        egfrState === 'available_unverified'
          ? 'Calculated/reported eGFR relies on unverified laboratory input; verify creatinine/eGFR before establishing renal dietary prescriptions.'
          : egfrState === 'clinically_ineligible'
          ? 'Calculated eGFR is clinically ineligible (e.g., pregnancy, pediatric, AKI, or unspecified sex); obtain clinician renal assessment before protein restriction.'
          : 'Hypertension/CKD selected without verified/calculated eGFR result; eGFR unavailable (not assumed normal). Obtain creatinine or reported eGFR before finalizing protein target.',
      rationale_bn: 'হাইপারটেনশন/সিকেডি চিহ্নিত কিন্তু যাচাইকৃত ও উপযুক্ত ইজিএফআর তথ্য অনুপস্থিত; প্রোটিন মাত্রা চূড়ান্ত করার আগে ল্যাব ইজিএফআর যাচাই করুন।',
      evidence_status: 'CLINICAL_REVIEW_REQUIRED'
    });
  }

  if (false) {
    clinicalReviewFlags.push({
      parameter: 'egfr',
      flag: 'CLINICAL_REVIEW_REQUIRED',
      rationale_en: 'Hypertension/CKD selected without verified/calculated eGFR result; eGFR unavailable (not assumed normal). Obtain creatinine or reported eGFR before finalizing protein target.',
      rationale_bn: 'হাইপারটেনশন/সিকেডি চিহ্নিত কিন্তু ইজিএফআর তথ্য অনুপলব্ধ; প্রোটিন মাত্রা চূড়ান্ত করার আগে ল্যাব ইজিএফআর যাচাই করুন।',
      evidence_status: 'CLINICAL_REVIEW_REQUIRED'
    });
  }

  const hasDocumentedSarcopeniaOrMalnutrition = Boolean(
    (patient as any).sarcopenia_documented === true ||
    confirmedConditions.includes('underweight_malnutrition') ||
    (patient.calculated?.bmi && patient.calculated.bmi < 18.5 && patient.age && patient.age >= 65)
  );
  const hasConflictingSarcopeniaEvidence = Boolean(
    (patient.age && patient.age >= 65 && !hasDocumentedSarcopeniaOrMalnutrition) ||
    (patient.calculated?.bmi && patient.calculated.bmi < 18.5 && !confirmedConditions.includes('underweight_malnutrition'))
  );

  if (hasConflictingSarcopeniaEvidence) {
    clinicalReviewFlags.push({
      parameter: 'protein',
      flag: 'CLINICAL_REVIEW_REQUIRED',
      rationale_en: 'Age >= 65 or low BMI present without formal malnutrition/sarcopenia diagnosis. Validated clinical assessment recommended to calibrate protein prescription.',
      rationale_bn: 'বয়স ৬৫ বা তদূর্ধ্ব অথবা স্বল্প বিএমআই বিদ্যমান; সঠিক ক্লিনিক্যাল মূল্যায়ন প্রয়োজন।',
      evidence_status: 'CLINICAL_REVIEW_REQUIRED'
    });
  }

  if (patientPrescriptions?.protein?.target_g_per_kg) {
    proteinGPerKg = patientPrescriptions.protein.target_g_per_kg;
    clinicalReviewFlags.push({
      parameter: 'protein',
      flag: 'CLINICIAN_APPROVED_TARGET',
      rationale_en: `Clinician approved protein target of ${proteinGPerKg} g/kg/day.`,
      rationale_bn: `চিকিৎসক কর্তৃক অনুমোদিত প্রোটিন লক্ষ্যমাত্রা ${proteinGPerKg} গ্রাম/কেজি/দিন।`,
      evidence_status: 'CLINICIAN_VERIFIED'
    });
    adjustmentCandidates.push({
      id: 'adj_protein_prescribed',
      triggering_source: 'Clinician Documented Prescription',
      clinical_rationale: 'Clinician individualized protein prescription',
      relevant_functional_systems: ['structural_integrity', 'renal_electrolyte'],
      evidence_status: 'CLINICIAN_VERIFIED',
      proposed_adjustment: `Calibrate diet to ${proteinGPerKg} g/kg/day`,
      clinician_review_required: false,
      affected_diet_components: ['protein_foods']
    });
  } else if (isDialysis) {
    clinicalReviewFlags.push({
      parameter: 'protein',
      flag: 'NUTRITION_ADJUSTMENT_CANDIDATE',
      rationale_en: 'Dialysis therapy active: guideline recommendation is 1.2-1.4 g/kg/day to compensate dialytic amino acid losses.',
      rationale_bn: 'ডায়ালাইসিস চলমান: অ্যামাইনো অ্যাসিড ক্ষয় পূরণে ১.২-১.৪ গ্রাম/কেজি/দিন প্রোটিন প্রস্তাবিত।',
      evidence_status: 'CLINICAL_GUIDELINE'
    });
    adjustmentCandidates.push({
      id: 'adj_protein_dialysis',
      triggering_source: 'Maintenance Dialysis Status',
      clinical_rationale: 'Compensate dialytic protein loss',
      relevant_functional_systems: ['renal_electrolyte', 'structural_integrity'],
      evidence_status: 'CLINICAL_GUIDELINE',
      proposed_adjustment: 'Candidate protein intake 1.2 - 1.4 g/kg/day pending clinician order',
      clinician_review_required: true,
      affected_diet_components: ['protein_foods']
    });
  } else if (isCKDNonDialysis) {
    clinicalReviewFlags.push({
      parameter: 'protein',
      flag: 'NUTRITION_ADJUSTMENT_CANDIDATE',
      rationale_en: hasDocumentedSarcopeniaOrMalnutrition
        ? 'Non-dialysis CKD with sarcopenia/malnutrition: balanced 0.8-1.0 g/kg/day candidate target.'
        : 'Non-dialysis CKD: conservative renal preservation candidate range is 0.6-0.8 g/kg/day.',
      rationale_bn: hasDocumentedSarcopeniaOrMalnutrition
        ? 'নন-ডায়ালাইসিস সিকেডি ও অপুষ্টি: ০.৮-১.০ গ্রাম/কেজি/দিন সুষম প্রোটিন প্রস্তাবিত।'
        : 'নন-ডায়ালাইসিস সিকেডি: ০.৬-০.৮ গ্রাম/কেজি/দিন নিয়ন্ত্রিত প্রোটিন প্রস্তাবিত।',
      evidence_status: 'CLINICAL_GUIDELINE'
    });
    adjustmentCandidates.push({
      id: 'adj_protein_ckd_conservative',
      triggering_source: 'Confirmed CKD Non-Dialysis',
      clinical_rationale: 'Renal preservation without inducing protein-energy wasting',
      relevant_functional_systems: ['renal_electrolyte', 'structural_integrity'],
      evidence_status: 'CLINICAL_GUIDELINE',
      proposed_adjustment: hasDocumentedSarcopeniaOrMalnutrition ? '0.8 - 1.0 g/kg/day candidate target' : '0.6 - 0.8 g/kg/day candidate target',
      clinician_review_required: true,
      affected_diet_components: ['protein_foods']
    });
  }

  const hasSodiumRestrictedDiagnosis =
    confirmedConditions.includes('hypertension_ckd') ||
    confirmedConditions.includes('ckd_stage_1_3b') ||
    Boolean((patient.clinical_safety as any)?.sodium_restriction?.is_restricted);
  if (patientPrescriptions?.sodium?.limit_mg) {
    sodiumLimit = patientPrescriptions.sodium.limit_mg;
    clinicalReviewFlags.push({
      parameter: 'sodium',
      flag: 'CLINICIAN_APPROVED_TARGET',
      rationale_en: `Clinician approved sodium ceiling of ${sodiumLimit} mg/day.`,
      rationale_bn: `চিকিৎসক কর্তৃক অনুমোদিত সোডিয়াম সীমা ${sodiumLimit} মিগ্রা/দিন।`,
      evidence_status: 'CLINICIAN_VERIFIED'
    });
    adjustmentCandidates.push({
      id: 'adj_sodium_prescribed',
      triggering_source: 'Clinician Documented Prescription',
      clinical_rationale: 'Prescribed sodium target',
      relevant_functional_systems: ['cardiovascular', 'renal_electrolyte'],
      evidence_status: 'CLINICIAN_VERIFIED',
      proposed_adjustment: `Enforce ${sodiumLimit} mg/day sodium ceiling`,
      clinician_review_required: false,
      affected_diet_components: ['sodium_salt']
    });
  } else if (hasSodiumRestrictedDiagnosis) {
    clinicalReviewFlags.push({
      parameter: 'sodium',
      flag: 'NUTRITION_ADJUSTMENT_CANDIDATE',
      rationale_en: 'Cardiorenal/hypertension diagnosis confirmed: guideline candidate restriction < 2000 mg/day pending clinician confirmation.',
      rationale_bn: 'উচ্চ রক্তচাপ/সিকেডি বিদ্যমান: নির্দেশিকা অনুযায়ী ২০০০ মিগ্রা/দিনের নিচে রাখার প্রস্তাব।',
      evidence_status: 'CLINICAL_GUIDELINE'
    });
    adjustmentCandidates.push({
      id: 'adj_sodium_guideline_candidate',
      triggering_source: 'Confirmed Hypertension/CKD Diagnosis',
      clinical_rationale: 'Cardiovascular blood pressure and fluid control',
      relevant_functional_systems: ['cardiovascular', 'renal_electrolyte'],
      evidence_status: 'CLINICAL_GUIDELINE',
      proposed_adjustment: 'Candidate sodium restriction < 2000 mg/day for clinician confirmation',
      clinician_review_required: true,
      affected_diet_components: ['sodium_salt']
    });
  }

  const insulin = analyzeInsulinRegimen(r5Medications);
  const fluidLimit = patient.fluid_prescription?.total_fluid_limit_ml || patient.clinical_safety?.fluid_restriction?.limit_ml;

  return {
    patient_id: patient.id,
    clinical_pathway_ids: pathwayIds,
    nutrient_constraints: {
      potassium_mg_max: potassiumLimit,
      sodium_mg_max: sodiumLimit,
      protein_g_per_kg: proteinGPerKg,
      fluid_ml_max: fluidLimit,
      carbohydrate_consistency_required: insulin.regimen_context.active
    },
    absolute_contraindications: contraindications,
    conditional_cautions: cautions,
    meal_schedule_rules: {
      timing_buffers: [],
      fasting_eligible: !insulin.regimen_context.active,
      fasting_contraindication_reasons: insulin.regimen_context.active
        ? ['Insulin therapy active; prolonged fasting requires endocrinologist supervision']
        : [],
      default_fasting_schedule: insulin.regimen_context.active ? 'none' : '12_12'
    },
    lab_safety_context: {
      potassium_state: potEval.state,
      serum_potassium_mmol_l: serumK,
      egfr_state: egfrState,
      egfr_source: egfrSource,
      reported_egfr_ml_min: reportedEgfr,
      calculated_egfr_ml_min: calculatedEgfr
    },
    acute_escalation: acuteEscalation,
    clinical_review_flags: clinicalReviewFlags,
    adjustment_candidates: adjustmentCandidates,
    provenance: {
      generated_at: new Date().toISOString(),
      engine_version: 'R7-CP-D-INTEGRATED'
    }
  };
}
