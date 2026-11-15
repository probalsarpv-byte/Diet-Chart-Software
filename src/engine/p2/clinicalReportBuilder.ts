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
  LabRecommendation,
  AyurvedicInterpretationResult,
  MasanumasikaPregnancyAnalysisResult,
  DietaryPatternAnalysisResult,
  MetabolicHealthAnalysisResult,
  GutHealthAnalysisResult,
  ClinicianApprovalRecord,
  ClinicalHealthAssessmentReport,
} from './types';

export function buildClinicalHealthAssessmentReport(params: {
  patient: PatientProfile;
  domainFindings: DomainFinding[];
  hypotheses: ClinicalHypothesis[];
  redFlags: ClinicalRedFlag[];
  priorities: ClinicalPriority[];
  timelineEvents: ClinicalTimelineEvent[];
  labRecommendations: LabRecommendation[];
  ayurvedicInterpretation: AyurvedicInterpretationResult;
  masanumasikaAnalysis: MasanumasikaPregnancyAnalysisResult;
  dietaryPatternAnalysis: DietaryPatternAnalysisResult;
  metabolicHealthAnalysis: MetabolicHealthAnalysisResult;
  gutHealthAnalysis: GutHealthAnalysisResult;
  approvalHistory?: ClinicianApprovalRecord[];
  reportMode?: 'quick' | 'comprehensive';
}): ClinicalHealthAssessmentReport {
  const {
    patient,
    domainFindings,
    hypotheses,
    redFlags,
    priorities,
    timelineEvents,
    labRecommendations,
    ayurvedicInterpretation,
    masanumasikaAnalysis,
    dietaryPatternAnalysis,
    metabolicHealthAnalysis,
    approvalHistory = [],
    reportMode = 'comprehensive',
  } = params;

  const visitDateClean = patient.visit_date.replace(/[^0-9]/g, '');
  const visitId = `visit_${patient.id}_${visitDateClean}`;
  const reportId = `rpt_${patient.id}_${visitDateClean}_v1`;

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
  const bmi = patient.calculated?.bmi || (patient.height_cm ? Math.round((patient.weight_kg / Math.pow(patient.height_cm / 100, 2)) * 10) / 10 : 0);
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

  const waist = patient.waist_cm || 0;
  const height = patient.height_cm || 1;
  const whtr = waist && height ? Math.round((waist / height) * 100) / 100 : 0;

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
    bmr = Math.round(10 * patient.weight_kg + 6.25 * patient.height_cm - 5 * patient.age + 5);
  } else {
    bmr = Math.round(10 * patient.weight_kg + 6.25 * patient.height_cm - 5 * patient.age - 161);
  }

  const sectionB_anthropometrics = {
    height_cm: patient.height_cm,
    weight_kg: patient.weight_kg,
    bmi,
    bmiCategory_en,
    bmiCategory_bn,
    waist_cm: waist,
    whtr,
    whtrRisk_en,
    whtrRisk_bn,
    weightTrend: 'Stable / Monitored',
    bmr_safe_floor: bmr,
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
  const availableResults: Array<{ marker: string; value: string | number; unit: string; flag?: string; normalRange: string }> = [];
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
  if (labs.creatinine !== undefined) {
    availableResults.push({
      marker: 'Serum Creatinine',
      value: labs.creatinine,
      unit: 'mg/dL',
      flag: labs.creatinine > 1.2 ? 'HIGH' : 'NORMAL',
      normalRange: '0.6–1.2 mg/dL',
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

  const pendingTests = labRecommendations
    .filter(r => !r.isAlreadyRecorded && (r.priority === 'immediate' || r.priority === 'high_priority'))
    .map(r => r.testName_en);

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
  const hardStops: string[] = [];
  if (patient.confirmed_allergies.length > 0) {
    hardStops.push(`Absolute exclusion of confirmed food allergens: ${patient.confirmed_allergies.join(', ')}.`);
  }
  if (patient.feeding_route && patient.feeding_route.toLowerCase() !== 'oral') {
    hardStops.push(`Non-oral feeding route (${patient.feeding_route}): strictly requires dedicated clinical enteral/parenteral specialist prescription.`);
  }

  const sectionK_clinicalSafety = {
    confirmedAllergies: patient.confirmed_allergies,
    hardStops,
    redFlags,
    feedingRoute: patient.feeding_route || 'Oral',
    hypoglycemiaProtocolRequired: metabolicHealthAnalysis.medicationMealSafetyPriority,
  };

  // Section N: Clinician Review
  const isApproved = approvalHistory.some(a => a.decision === 'accepted');
  const sectionN_clinicianReview: ClinicalHealthAssessmentReport['sectionN_clinicianReview'] = {
    reviewingNutritionist: 'Clinical Functional Nutritionist',
    reviewDate: patient.visit_date,
    status: isApproved ? 'fully_approved' : 'pending',
    notes: isApproved
      ? 'Clinical assessment, hypotheses, and priorities reviewed and accepted for Phase P3 nutrition planning.'
      : 'Provisional assessment generated. Requires supervising clinician sign-off prior to diet chart generation.',
    revisionNumber: 1,
  };

  return {
    patientId: patient.id,
    visitId,
    reportId,
    reportMode,
    generatedAt: new Date().toISOString(),
    revision: 1,
    isApproved,
    approvedBy: isApproved ? 'Clinician' : undefined,
    approvalDate: isApproved ? patient.visit_date : undefined,
    clinicianNotes: sectionN_clinicianReview.notes,

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
