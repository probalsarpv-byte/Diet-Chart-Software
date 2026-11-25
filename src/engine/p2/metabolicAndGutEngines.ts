// P2 Metabolic Health & Gut Health Analysis Engines
// Deterministic clinical evaluations of glycemic dynamics, hypoglycemic medication safety,
// Bristol stool patterning, transit times, and gut functional mechanisms.

import { PatientProfile } from '../../types';
import {
  ClinicalObservation,
  MetabolicHealthAnalysisResult,
  GutHealthAnalysisResult,
} from './types';

export function analyzeMetabolicHealth(
  patient: PatientProfile,
  observations: ClinicalObservation[],
  assessmentAnswers: Record<string, any> = {}
): MetabolicHealthAnalysisResult {
  // Check active medications for hypoglycemic agents
  const hypoMedRegex = /insulin|gliclazide|glimepiride|glipizide|repaglinide|nateglinide/i;
  const hypoglycemicMedicationActive = patient.active_medications.some(m => hypoMedRegex.test(m));
  const medicationMealSafetyPriority = hypoglycemicMedicationActive;

  // Central adiposity
  const whtr = patient.waist_cm && patient.height_cm ? patient.waist_cm / patient.height_cm : 0;
  const centralAdiposityRisk =
    whtr > 0.5 ||
    (patient.gender === 'male' && patient.waist_cm ? patient.waist_cm > 90 : false) ||
    (patient.gender === 'female' && patient.waist_cm ? patient.waist_cm > 80 : false) ||
    observations.some(o => o.tags?.includes('central_adiposity'));

  // HOMA-IR calculation — Checkpoint F: respect authoritative R7 derived HOMA-IR eligibility & verification provenance
  let homaIrAnalysis: MetabolicHealthAnalysisResult['homaIrAnalysis'] | undefined = undefined;
  const labs = patient.labs || {};
  const onExogenousInsulin =
    hypoglycemicMedicationActive &&
    (patient.active_medications.some(m => /insulin/i.test(m)) ||
      (patient.medication_records || []).some(m => m.status === 'active' && /insulin/i.test(m.generic_name || '')));

  const homaObs = observations.find(o => o.sourceLabMarker === 'homa_ir');
  const hasStructuredLabPipeline = observations.some(
    o => o.category === 'lab' && o.provenance !== 'legacy_unprovenanced_homa_ir_screen'
  );

  if (homaObs && typeof homaObs.observedValue === 'number' && !onExogenousInsulin) {
    const val = homaObs.observedValue;
    homaIrAnalysis = {
      value: val,
      status: val < 1.4 ? 'normal' : val <= 1.9 ? 'borderline' : 'significant_insulin_resistance',
      isValidated: homaObs.verificationStatus === 'lab_confirmed',
    };
  } else if (!hasStructuredLabPipeline && !onExogenousInsulin) {
    // Legacy scalar fallback without paired fasting metadata: NEVER mark isValidated = true
    if (labs.homa_ir !== undefined) {
      const val = labs.homa_ir;
      homaIrAnalysis = {
        value: val,
        status: val < 1.4 ? 'normal' : val <= 1.9 ? 'borderline' : 'significant_insulin_resistance',
        isValidated: false,
      };
    } else if (labs.fasting_glucose !== undefined && labs.fasting_insulin !== undefined && labs.fasting_insulin > 0) {
      const calculated = Math.round(((labs.fasting_glucose * labs.fasting_insulin) / 405) * 100) / 100;
      homaIrAnalysis = {
        value: calculated,
        status: calculated < 1.4 ? 'normal' : calculated <= 1.9 ? 'borderline' : 'significant_insulin_resistance',
        isValidated: false,
      };
    }
  }

  // Glycemic stability pattern
  const hasPostprandialCrash =
    assessmentAnswers['q_metab_energy_crash'] === 'yes' ||
    observations.some(o => o.tags?.includes('postprandial_fatigue') || o.tags?.includes('sugar_cravings'));

  const hasDysglycemiaMarkers =
    patient.selected_conditions.includes('t2d_ir') ||
    (labs.fasting_glucose && labs.fasting_glucose >= 100) ||
    (labs.hba1c && labs.hba1c >= 5.7) ||
    (homaIrAnalysis && homaIrAnalysis.isValidated && homaIrAnalysis.status === 'significant_insulin_resistance');

  let glycemicStabilityPattern: MetabolicHealthAnalysisResult['glycemicStabilityPattern'] = 'uncertain';
  if (hasDysglycemiaMarkers) {
    glycemicStabilityPattern = 'dysglycemia_pattern';
  } else if (hasPostprandialCrash) {
    glycemicStabilityPattern = 'reactive_hypoglycemia_tendency';
  } else if (labs.fasting_glucose !== undefined || labs.hba1c !== undefined) {
    glycemicStabilityPattern = 'stable';
  }

  // Metabolic priorities
  const metabolicPriorities: string[] = [];

  if (medicationMealSafetyPriority) {
    metabolicPriorities.push(
      'CRITICAL SAFETY: Synchronize carbohydrate intake with insulin/sulfonylurea administration to strictly prevent iatrogenic hypoglycemia.'
    );
  }

  if (glycemicStabilityPattern === 'dysglycemia_pattern' || centralAdiposityRisk) {
    metabolicPriorities.push(
      'Optimize dietary fiber matrix (minimum 30g/day) and pair all carbohydrates with healthy fats and protein to blunt postprandial glucose peaks.'
    );
    metabolicPriorities.push(
      'Prioritize low glycemic load staples: Parboiled Lal Chal, steel-cut oats, and legumes instead of refined white rice or maida.'
    );
  }

  if (glycemicStabilityPattern === 'reactive_hypoglycemia_tendency') {
    metabolicPriorities.push(
      'Eliminate high-glycemic isolated sugars; implement 3 balanced meals with evenly distributed protein to stabilize insulin excursions.'
    );
  }

  if (metabolicPriorities.length === 0) {
    metabolicPriorities.push('Maintain balanced whole-food carbohydrate distribution and habitual physical activity.');
  }

  return {
    glycemicStabilityPattern,
    hypoglycemicMedicationActive,
    medicationMealSafetyPriority,
    centralAdiposityRisk,
    homaIrAnalysis,
    metabolicPriorities,
  };
}

export function analyzeGutHealth(
  patient: PatientProfile,
  observations: ClinicalObservation[],
  assessmentAnswers: Record<string, any> = {}
): GutHealthAnalysisResult {
  // Bristol stool form
  const stoolFormAns = assessmentAnswers['q_gi_stool_form'] || assessmentAnswers['q_gi_bristol_type'];
  let bristolPattern = 'Type 3–4 (Smooth sausage or snake-like, normal form)';
  let transitTimeEstimate: GutHealthAnalysisResult['transitTimeEstimate'] = 'normal';

  const hasConstipation =
    stoolFormAns === 'type_1_2' ||
    assessmentAnswers['q_gi_constipation'] === 'frequent' ||
    observations.some(o => o.tags?.includes('constipation'));

  const hasDiarrhea =
    stoolFormAns === 'type_5_6_7' ||
    assessmentAnswers['q_gi_diarrhea'] === 'frequent' ||
    observations.some(o => o.tags?.includes('diarrhea') || o.tags?.includes('loose_stool'));

  if (hasConstipation) {
    bristolPattern = 'Type 1–2 (Separate hard lumps, like nuts, or sausage-shaped but lumpy)';
    transitTimeEstimate = 'delayed_constipation';
  } else if (hasDiarrhea) {
    bristolPattern = 'Type 5–7 (Soft blobs with clear edges, mushy consistency, or watery diarrhea)';
    transitTimeEstimate = 'rapid_diarrhea';
  }

  // Dysbiosis symptom burden
  const dysbiosisTags = ['bloating', 'gas', 'flatulence', 'abdominal_pain', 'dairy_consumer', 'loose_stool_post_dairy', 'antibiotic_exposure'];
  const matchedSymptoms = observations.filter(o => o.tags?.some(t => dysbiosisTags.includes(t)));
  const count = matchedSymptoms.length;

  let dysbiosisSymptomBurden: GutHealthAnalysisResult['dysbiosisSymptomBurden'] = 'none';
  if (count >= 4) dysbiosisSymptomBurden = 'significant';
  else if (count >= 2) dysbiosisSymptomBurden = 'moderate';
  else if (count >= 1) dysbiosisSymptomBurden = 'mild';

  // Upper GI status
  const upperGiSymptoms: string[] = [];
  if (observations.some(o => o.tags?.includes('acid_reflux') || o.tags?.includes('heartburn'))) {
    upperGiSymptoms.push('Acid reflux / heartburn');
  }
  if (observations.some(o => o.tags?.includes('nausea'))) {
    upperGiSymptoms.push('Nausea / early satiety');
  }
  if (observations.some(o => o.tags?.includes('epigastric_pain'))) {
    upperGiSymptoms.push('Postprandial epigastric fullness / discomfort');
  }

  const upperGiStatus = upperGiSymptoms.length > 0
    ? `Upper GI involvement present: ${upperGiSymptoms.join(', ')}`
    : 'No significant upper gastrointestinal distress reported';

  // Functional mechanisms
  const functionalMechanisms: string[] = [];
  if (hasConstipation) {
    functionalMechanisms.push('Slow intestinal transit prolongs contact time between colonic mucosa and metabolic waste, promoting water hyper-resorption and dysbiosis.');
  }
  if (hasDiarrhea) {
    functionalMechanisms.push('Accelerated motility may impair adequate enzymatic hydrolytic breakdown and small intestinal micronutrient absorption.');
  }
  if (dysbiosisSymptomBurden !== 'none') {
    functionalMechanisms.push('Bacterial fermentation of undigested carbohydrates in the upper gut yields rapid hydrogen/methane gas production, triggering visceral hypersensitivity and distension.');
  }
  if (observations.some(o => o.tags?.includes('antibiotic_exposure'))) {
    functionalMechanisms.push('Recent or frequent antimicrobial exposure depletes commensal Bifidobacteria and butyrate-producing Clostridial clusters, disrupting mucosal barrier integrity.');
  }

  // Dietary contributors
  const dietaryContributors: string[] = [];
  if (observations.some(o => o.tags?.includes('low_fiber_diet'))) {
    dietaryContributors.push('Insufficient dietary prebiotic fiber depriving commensal microbiota of fermentable substrates.');
  }
  if (observations.some(o => o.tags?.includes('dairy_intake') && o.tags?.includes('bloating'))) {
    dietaryContributors.push('Unassimilated lactose exerting an osmotic draw and colonic bacterial fermentation.');
  }
  if (observations.some(o => o.tags?.includes('low_fluid_intake'))) {
    dietaryContributors.push('Suboptimal daily fluid intake hardening fecal consistency and slowing colon transit.');
  }

  const microbiomeTestingCaveat =
    'CLINICAL CAVEAT: Symptom-based functional gut patterns suggest altered microbial fermentation dynamics; they do not constitute an autonomous microbiological diagnosis. Comprehensive stool microbiome sequencing or lactulose breath testing requires clinical correlation.';

  const furtherInvestigationsSuggested: string[] = [];
  if (dysbiosisSymptomBurden === 'significant' || hasDiarrhea) {
    furtherInvestigationsSuggested.push('Stool Routine & Microscopic Examination (R/E) for parasites/protozoa');
    furtherInvestigationsSuggested.push('Fecal Calprotectin to evaluate for mucosal inflammation');
  }
  if (upperGiSymptoms.length > 0) {
    furtherInvestigationsSuggested.push('H. pylori stool antigen test or gastroenterology referral if refractory');
  }

  return {
    bristolPattern,
    transitTimeEstimate,
    dysbiosisSymptomBurden,
    upperGiStatus,
    functionalMechanisms,
    dietaryContributors,
    microbiomeTestingCaveat,
    furtherInvestigationsSuggested,
  };
}
