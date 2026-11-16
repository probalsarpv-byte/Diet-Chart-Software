// P2 Comprehensive Pre-Intervention Clinical Health Assessment Report Builder
// Constructs a deterministic, multi-section clinical health assessment report (Sections A–N)
// suitable for professional clinical review, multidisciplinary medical handoff, and patient printout.

import { PatientProfile } from '../../types';
import {
  DomainFinding,
  ClinicalHypothesis,
  ClinicalRedFlag,
  ClinicalPriority,
  ClinicalTimelineEvent,
  InterventionGoal,
  LabRecommendation,
  AyurvedicInterpretationResult,
  MasanumasikaPregnancyAnalysisResult,
  DietaryPatternAnalysisResult,
  MetabolicHealthAnalysisResult,
  GutHealthAnalysisResult,
  ClinicianApprovalRecord,
  ClinicalHealthAssessmentReport,
} from './types';
import { ClinicalAssessment } from '../../types/assessment';
import { interpretGlucoseMarker } from '../assessment/p2HandoffAdapter';

export function buildClinicalHealthAssessmentReport(params: {
  patient: PatientProfile;
  assessment?: ClinicalAssessment;
  domainFindings: DomainFinding[];
  hypotheses: ClinicalHypothesis[];
  redFlags: ClinicalRedFlag[];
  priorities: ClinicalPriority[];
  timelineEvents: ClinicalTimelineEvent[];
  interventionGoals?: InterventionGoal[];
  labRecommendations: LabRecommendation[];
  ayurvedicInterpretation: AyurvedicInterpretationResult;
  masanumasikaAnalysis: MasanumasikaPregnancyAnalysisResult;
  dietaryPatternAnalysis: DietaryPatternAnalysisResult;
  metabolicHealthAnalysis: MetabolicHealthAnalysisResult;
  gutHealthAnalysis: GutHealthAnalysisResult;
  approvalHistory?: ClinicianApprovalRecord[];
  reportMode?: 'quick' | 'comprehensive';
  isApproved?: boolean;
  approvedBy?: string;
  approvalDate?: string;
  clinicianNotes?: string;
  analysisInvalidatedAt?: string;
  invalidationReason?: string;
  visitId?: string;
  reportId?: string;
}): ClinicalHealthAssessmentReport {
  const {
    patient,
    assessment,
    domainFindings,
    hypotheses,
    redFlags,
    priorities,
    timelineEvents,
    interventionGoals = [],
    labRecommendations,
    ayurvedicInterpretation,
    masanumasikaAnalysis,
    dietaryPatternAnalysis,
    metabolicHealthAnalysis,
    approvalHistory = [],
    reportMode = 'comprehensive',
    isApproved: explicitApproved,
    approvedBy: explicitApprovedBy,
    approvalDate: explicitApprovalDate,
    clinicianNotes: explicitClinicianNotes,
    analysisInvalidatedAt,
    invalidationReason,
    visitId: explicitVisitId,
    reportId: explicitReportId,
  } = params;

  const visitDateClean = patient.visit_date.replace(/[^0-9]/g, '');
  const visitId = explicitVisitId || patient.current_visit_id || `visit_${patient.id}_${visitDateClean}`;
  const reportId = explicitReportId || `rpt_${patient.id}_${visitId}_v1`;

  // Section A: Patient Info
  const sectionA_patientInfo = {
    name: patient.name,
    id: patient.id,
    age: patient.age,
    gender: patient.gender,
    visitDate: patient.visit_date,
    assessmentMode: reportMode,
    populationGroup: patient.population_group,
    clinicalPathways: patient.selected_conditions,
  };

  // Section B: Anthropometrics
  const height = assessment?.anthropometrics?.height_cm || patient.height_cm || 1;
  const weight = assessment?.anthropometrics?.weight_kg || patient.weight_kg || 0;
  const waist = assessment?.anthropometrics?.waist_cm || patient.waist_cm || 0;
  const bmi = assessment?.anthropometrics?.bmi || patient.calculated?.bmi || (height > 0 && weight > 0 ? Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10 : 0);
  let bmiCategory_en = 'Normal weight';
  let bmiCategory_bn = 'স্বাভাবিক ওজন';
  if (bmi < 18.5) {
    bmiCategory_en = 'Underweight';
    bmiCategory_bn = 'স্বল্প ওজন';
  } else if (bmi >= 23 && bmi < 27.5) {
    // Asian Indian / Bangladeshi BMI cutoffs
    bmiCategory_en = 'Overweight (Asian cut-off >= 23)';
    bmiCategory_bn = 'অতিরিক্ত ওজন (এশিয়ান সূচক >= ২৩)';
  } else if (bmi >= 27.5) {
    bmiCategory_en = 'Obese (Asian cut-off >= 27.5)';
    bmiCategory_bn = 'স্থূলতা (এশিয়ান সূচক >= ২৭.৫)';
  }

  const whtr = assessment?.anthropometrics?.whtr || (waist && height ? Math.round((waist / height) * 100) / 100 : 0);

  let whtrRisk_en = 'Normal visceral adiposity (< 0.50)';
  let whtrRisk_bn = 'স্বাভাবিক ভিসেরাল ফ্যাট (< ০.৫০)';
  if (whtr >= 0.50 && whtr < 0.60) {
    whtrRisk_en = 'Elevated cardiometabolic risk (WHtR >= 0.50)';
    whtrRisk_bn = 'উচ্চ কার্ডিওমেটাবলিক ঝুঁকি (WHtR >= ০.৫০)';
  } else if (whtr >= 0.60) {
    whtrRisk_en = 'Substantially increased cardiometabolic risk (WHtR >= 0.60)';
    whtrRisk_bn = 'অত্যন্ত উচ্চ কার্ডিওমেটাবলিক ঝুঁকি (WHtR >= ০.৬০)';
  }

  // Safe BMR floor: Mifflin-St Jeor
  let bmr = 0;
  if (patient.gender === 'male') {
    bmr = Math.round(10 * weight + 6.25 * height - 5 * patient.age + 5);
  } else {
    bmr = Math.round(10 * weight + 6.25 * height - 5 * patient.age - 161);
  }

  const sectionB_anthropometrics = {
    height_cm: height,
    weight_kg: weight,
    bmi,
    bmiCategory_en,
    bmiCategory_bn,
    waist_cm: waist,
    whtr,
    whtrRisk_en,
    whtrRisk_bn,
    weightTrend: 'Stable / Monitored',
    bmr_safe_floor: assessment?.anthropometrics?.bmr || bmr,
  };

  // Section C: Clinical History
  const sectionC_clinicalHistory = {
    chiefComplaint: patient.selected_conditions.length > 0
      ? `Evaluation and clinical nutrition management for: ${patient.selected_conditions.join(', ')}`
      : 'Comprehensive baseline functional nutrition assessment',
    onsetTimeline: 'Longitudinal outpatient presentation',
    triggerEvent: 'Clinical consultation request',
    conditions: patient.selected_conditions,
    timelineEvents,
  };

  // Section H: Lab Findings
  const availableResults: Array<{ marker: string; value: string | number; unit: string; flag?: string; normalRange: string; testDate?: string; status?: string }> = [];
  const pendingTests: string[] = [];

  const hasAssessmentLabs = Boolean(assessment?.labs?.entries && Object.keys(assessment.labs.entries).length > 0);

  if (hasAssessmentLabs && assessment?.labs?.entries) {
    // Primary source of truth: P1 structured laboratory entries
    for (const entry of Object.values(assessment.labs.entries)) {
      if (entry.status === 'previously_tested' && entry.numeric_value !== undefined && !isNaN(entry.numeric_value)) {
        let flag = 'NORMAL';
        let normalRange = '-';

        if (entry.marker_id === 'fbs' || entry.marker_id === 'ppbs') {
          const interp = interpretGlucoseMarker(entry.marker_id, entry.numeric_value, entry.unit);
          flag = interp.flag;
          normalRange = interp.normalRange;
        } else if (entry.marker_id === 'hba1c') {
          flag = entry.numeric_value >= 6.5 ? 'HIGH' : entry.numeric_value >= 5.7 ? 'ELEVATED' : 'NORMAL';
          normalRange = '< 5.7%';
        } else if (entry.marker_id === 'fasting_insulin') {
          flag = entry.numeric_value > 10 ? 'HIGH' : 'NORMAL';
          normalRange = '2–6 uIU/mL (Functional)';
        } else if (entry.marker_id === 'triglycerides') {
          flag = entry.numeric_value > 150 ? 'ELEVATED' : 'OPTIMAL';
          normalRange = '< 150 mg/dL';
        } else if (entry.marker_id === 'serum_creatinine') {
          const threshold = patient.gender === 'female' ? 1.1 : 1.2;
          flag = entry.numeric_value > threshold ? 'HIGH' : 'NORMAL';
          normalRange = patient.gender === 'female' ? '0.5–1.1 mg/dL' : '0.6–1.2 mg/dL';
        } else if (entry.marker_id === 'serum_uric_acid') {
          flag = entry.numeric_value > 6.5 ? 'HIGH' : 'NORMAL';
          normalRange = '3.5–6.0 mg/dL';
        } else if (entry.marker_id === 'serum_ferritin') {
          flag = entry.numeric_value < 30 ? 'DEPLETED' : 'ADEQUATE';
          normalRange = '50–100 ng/mL (Optimal)';
        } else if (entry.conventional_high !== undefined || entry.conventional_low !== undefined) {
          if (entry.conventional_high !== undefined && entry.numeric_value > entry.conventional_high) {
            flag = 'HIGH';
          } else if (entry.conventional_low !== undefined && entry.numeric_value < entry.conventional_low) {
            flag = 'LOW';
          } else {
            flag = 'NORMAL';
          }
          normalRange = `${entry.conventional_low ?? ''}–${entry.conventional_high ?? ''} ${entry.unit}`;
        }

        availableResults.push({
          marker: entry.name_en || entry.marker_id,
          value: entry.numeric_value,
          unit: entry.unit,
          flag,
          normalRange,
          testDate: entry.test_date,
          status: entry.status,
        });
      } else if (entry.status === 'pending_result' || (entry.status as string) === 'pending') {
        pendingTests.push(entry.name_en || entry.marker_id);
      }
    }
  } else if (!assessment || !assessment.labs?.entries || Object.keys(assessment.labs.entries).length === 0) {
    // Fallback to legacy patient.labs ONLY when assessment is omitted or contains zero laboratory entries
    const labs = patient.labs || {};

    if (labs.fasting_glucose !== undefined) {
      availableResults.push({
        marker: 'Fasting Blood Glucose',
        value: labs.fasting_glucose,
        unit: 'mg/dL',
        flag: labs.fasting_glucose >= 126 ? 'HIGH' : labs.fasting_glucose >= 100 ? 'BORDERLINE' : 'NORMAL',
        normalRange: '70–99 mg/dL',
      });
    }
    if (labs.hba1c !== undefined) {
      availableResults.push({
        marker: 'HbA1c',
        value: labs.hba1c,
        unit: '%',
        flag: labs.hba1c >= 6.5 ? 'HIGH' : labs.hba1c >= 5.7 ? 'PREDIABETIC' : 'OPTIMAL',
        normalRange: '< 5.7%',
      });
    }
    if (labs.fasting_insulin !== undefined) {
      availableResults.push({
        marker: 'Fasting Serum Insulin',
        value: labs.fasting_insulin,
        unit: 'uIU/mL',
        flag: labs.fasting_insulin > 10 ? 'HIGH' : 'NORMAL',
        normalRange: '2–6 uIU/mL (Functional)',
      });
    }
    if (labs.triglycerides !== undefined) {
      availableResults.push({
        marker: 'Triglycerides',
        value: labs.triglycerides,
        unit: 'mg/dL',
        flag: labs.triglycerides > 150 ? 'ELEVATED' : 'OPTIMAL',
        normalRange: '< 150 mg/dL',
      });
    }
    if (labs.uric_acid !== undefined) {
      availableResults.push({
        marker: 'Serum Uric Acid',
        value: labs.uric_acid,
        unit: 'mg/dL',
        flag: labs.uric_acid > 6.5 ? 'HIGH' : 'NORMAL',
        normalRange: '3.5–6.0 mg/dL',
      });
    }
    if (labs.ferritin !== undefined) {
      availableResults.push({
        marker: 'Serum Ferritin',
        value: labs.ferritin,
        unit: 'ng/mL',
        flag: labs.ferritin < 30 ? 'DEPLETED' : 'ADEQUATE',
        normalRange: '50–100 ng/mL (Optimal)',
      });
    }
  }

  // Include pending recommendations
  for (const r of labRecommendations) {
    if (r.existingTestStatus === 'pending' && (r.priority === 'immediate_clinical_evaluation' || r.priority === 'high_priority')) {
      if (!pendingTests.includes(r.testName_en)) {
        pendingTests.push(r.testName_en);
      }
    }
  }

  const missingInformation: string[] = [];
  if (availableResults.length === 0) {
    missingInformation.push('Zero diagnostic laboratory tests recorded. Clinical hypotheses remain unconfirmed pending laboratory testing.');
  }

  const sectionH_laboratoryFindings = {
    availableResults,
    pendingTests,
    missingInformation,
  };

  // Section J: Medication Review
  const safetyConsiderations: string[] = [];
  const depletionRisks: string[] = [];

  for (const med of patient.active_medications) {
    const medLower = med.toLowerCase();
    if (/metformin/i.test(medLower)) {
      depletionRisks.push('Metformin impairs ileal absorption of Vitamin B12; periodic B12 monitoring and supplementation warranted.');
      safetyConsiderations.push('Take with or immediately after meals to reduce gastrointestinal side effects.');
    }
    if (/omeprazole|esomeprazole|pantoprazole|rabeprazole/i.test(medLower)) {
      depletionRisks.push('Proton Pump Inhibitors induce gastric hypochlorhydria, reducing extraction of dietary Vitamin B12, non-heme iron, magnesium, and calcium.');
      safetyConsiderations.push('Evaluate clinical indication for deprescribing or stepwise taper to prevent chronic malabsorption.');
    }
    if (/statin|atorvastatin|rosuvastatin/i.test(medLower)) {
      depletionRisks.push('HMG-CoA reductase inhibition co-depletes endogenous Coenzyme Q10 (ubiquinone) synthesis.');
      safetyConsiderations.push('Monitor for statin-associated muscle symptoms (SAMS) and liver transaminases.');
    }
    if (/insulin|gliclazide|glimepiride|glipizide/i.test(medLower)) {
      safetyConsiderations.push('HIGH RISK: Hypoglycemic medication requires strictly timed carbohydrate intake. Prolonged fasting or sudden carbohydrate restriction contraindicated.');
    }
  }

  const sectionJ_medicationReview = {
    medications: patient.active_medications,
    safetyConsiderations,
    depletionRisks,
  };

  // Section K: Clinical Safety
  const rawRoute = patient.feeding_status?.route || 'oral_standard';
  const isOral =
    patient.feeding_status?.oral_intake_permitted !== undefined
      ? patient.feeding_status.oral_intake_permitted
      : rawRoute === 'oral_standard' ||
        rawRoute === 'oral_nutritional_supplements' ||
        rawRoute === 'modified_texture_soft' ||
        rawRoute === 'modified_texture_pureed' ||
        rawRoute === 'modified_texture_thickened_liquid' ||
        rawRoute.toLowerCase().includes('oral');

  const hardStops: string[] = [];

  // CLINICAL SAFETY AUDIT RULE (Allergy vs Hard Stop):
  // A documented allergy alone is a mandatory food-exclusion constraint, NOT a hard stop
  // that prevents approval of a Clinical Assessment Report.
  // Block only actual contraindicated interventions or unresolved clinically significant safety conflicts.
  for (const allergen of patient.confirmed_allergies) {
    const allergenLower = allergen.toLowerCase().trim();
    const conflictingGoal = interventionGoals.find(g =>
      g.title_en.toLowerCase().includes(allergenLower) ||
      g.rationale_en.toLowerCase().includes(allergenLower) ||
      g.nutritionalConstraints.some((c: string) => c.toLowerCase().includes(allergenLower))
    );
    if (conflictingGoal) {
      hardStops.push(`Allergic Conflict: Proposed intervention '${conflictingGoal.title_en}' conflicts with confirmed allergen '${allergen}'.`);
    }
  }

  // Non-oral feeding route without specialist authorization
  if (!isOral && !patient.feeding_status?.requires_specialist_support) {
    hardStops.push(`Non-oral feeding route (${rawRoute}): Standard oral solid diet contraindicated. Dedicated clinical enteral/parenteral specialist protocol required.`);
  }

  // Critical immediate red flags that block automated intervention approval
  for (const rf of redFlags) {
    if (rf.urgency === 'immediate' && rf.blocksAutoIntervention) {
      hardStops.push(`Critical Red Flag: ${rf.title_en} (${rf.recommendedAction_en})`);
    }
  }

  const sectionK_clinicalSafety = {
    confirmedAllergies: patient.confirmed_allergies,
    hardStops,
    redFlags,
    feedingRoute: rawRoute,
    hypoglycemiaProtocolRequired: metabolicHealthAnalysis.medicationMealSafetyPriority,
  };

  // Section N: Clinician Review
  const isPlaceholder = [
    'clinician',
    'dr. clinical nutritionist',
    'doctor',
    'nutritionist',
    'admin',
    'user',
  ].includes((explicitApprovedBy || '').trim().toLowerCase());

  const hasValidClinician =
    Boolean(explicitApprovedBy) &&
    (explicitApprovedBy || '').trim().length >= 3 &&
    !isPlaceholder;

  const isInvalidated = Boolean(analysisInvalidatedAt);
  const isApproved = Boolean(explicitApproved && hasValidClinician && !isInvalidated);

  const sectionN_clinicianReview: ClinicalHealthAssessmentReport['sectionN_clinicianReview'] = {
    reviewingNutritionist: isApproved ? explicitApprovedBy! : 'Pending Clinician Review',
    reviewDate: isApproved ? (explicitApprovalDate || patient.visit_date) : patient.visit_date,
    status: isApproved ? 'fully_approved' : 'pending',
    notes: explicitClinicianNotes || (isApproved
      ? 'Clinical assessment, hypotheses, and priorities reviewed and accepted for Phase P3 nutrition planning.'
      : isInvalidated
      ? `Prior approval invalidated: ${invalidationReason || 'Clinical data modified after sign-off.'}`
      : 'Provisional assessment generated. Requires supervising clinician sign-off prior to diet chart generation.'),
    revisionNumber: 1,
  };

  return {
    patientId: patient.id,
    visitId,
    assessmentId: assessment?.assessment_id,
    reportId,
    reportMode,
    generatedAt: new Date().toISOString(),
    revision: 1,
    isApproved,
    approvedBy: isApproved ? explicitApprovedBy : undefined,
    approvalDate: isApproved ? (explicitApprovalDate || patient.visit_date) : undefined,
    clinicianNotes: sectionN_clinicianReview.notes,
    analysisInvalidatedAt,
    invalidationReason,

    sectionA_patientInfo,
    sectionB_anthropometrics,
    sectionC_clinicalHistory,
    sectionD_functionalMatrix: domainFindings,
    sectionE_dietaryPattern: dietaryPatternAnalysis,
    sectionF_ayurvedicAssessment: ayurvedicInterpretation,
    sectionG_pregnancyMasanumasika: masanumasikaAnalysis.applicable ? masanumasikaAnalysis : undefined,
    sectionH_laboratoryFindings,
    sectionI_rootCauseHypotheses: hypotheses,
    sectionJ_medicationReview,
    sectionK_clinicalSafety,
    sectionL_laboratoryRecommendations: labRecommendations,
    sectionM_clinicalPriorities: priorities,
    sectionN_clinicianReview,
  };
}
