// P2 Clinical Intelligence Engine - Main Entry Point
// Shuddho Functional Nutrition Software

import {
  P2AnalysisResult,
  ClinicalObservation,
  ClinicalHypothesis,
  ClinicalRedFlag,
  ClinicalPriority,
  DomainFinding,
  ClinicalTimelineEvent,
  InterventionGoal,
  ClinicianApprovalRecord,
  DietPlanningContext,
  EvidenceSupportLevel,
  FunctionalDomain,
  PopulationApplicability,
} from './types';
import { PatientProfile } from '../../types';
import { aggregateEvidence } from './evidenceAggregator';

// ─── P2 Engine Input ──────────────────────────────────────────────
export interface P2EngineInput {
  patient: PatientProfile;
  observations?: ClinicalObservation[];
  assessmentAnswers?: Record<string, any>;
  previousApprovals?: ClinicianApprovalRecord[];
}

// ─── Helper: Determine population applicability ───────────────────
function getPatientPopulations(patient: PatientProfile): PopulationApplicability[] {
  const pops: PopulationApplicability[] = ['all'];
  if (patient.age < 12) pops.push('pediatric');
  else if (patient.age < 18) pops.push('adolescent');
  else if (patient.age >= 65) pops.push('geriatric');
  else pops.push('adult');

  if (patient.population_group === 'pregnancy') pops.push('pregnancy');
  if (patient.population_group === 'lactation') pops.push('lactation');
  return pops;
}

function isPediatric(patient: PatientProfile): boolean {
  return patient.age < 12;
}

function isPregnant(patient: PatientProfile): boolean {
  return patient.population_group === 'pregnancy';
}

function observationMatchesTags(obs: ClinicalObservation, tags: string[]): boolean {
  if (!obs.tags) return false;
  return tags.some(tag => obs.tags!.includes(tag));
}

// ─── Domain Finder ────────────────────────────────────────────────
function buildDomainFindings(observations: ClinicalObservation[], _patient: PatientProfile): DomainFinding[] {
  const domainMeta: Record<FunctionalDomain, { name_en: string; name_bn: string }> = {
    assimilation: { name_en: 'Assimilation', name_bn: 'আত্মীকরণ' },
    defense_repair: { name_en: 'Defense & Repair', name_bn: 'প্রতিরক্ষা ও মেরামত' },
    energy: { name_en: 'Energy', name_bn: 'শক্তি' },
    biotransformation: { name_en: 'Biotransformation & Elimination', name_bn: 'জৈব রূপান্তর ও নির্গমন' },
    transport: { name_en: 'Transport', name_bn: 'পরিবহন' },
    communication: { name_en: 'Communication', name_bn: 'যোগাযোগ' },
    structural_integrity: { name_en: 'Structural Integrity', name_bn: 'কাঠামোগত অখণ্ডতা' },
  };

  const domains: FunctionalDomain[] = [
    'assimilation', 'defense_repair', 'energy',
    'biotransformation', 'transport', 'communication', 'structural_integrity',
  ];

  return domains.map(domain => {
    const relevant = observations.filter(o => o.associatedDomains.includes(domain));
    const burden = relevant.length === 0 ? 'none'
      : relevant.length <= 2 ? 'mild'
      : relevant.length <= 4 ? 'moderate'
      : 'significant';

    return {
      domain,
      domainName_en: domainMeta[domain].name_en,
      domainName_bn: domainMeta[domain].name_bn,
      relevantObservations: relevant.map(o => o.id),
      supportingEvidence: relevant.filter(o => o.severity === 'moderate' || o.severity === 'severe').map(o => o.id),
      pertinentNegatives: [],
      missingInformation: [],
      potentialConfounders: [],
      clinicalReviewFlags: [],
      furtherAssessmentSuggestions: [],
      overallBurden: burden as 'none' | 'mild' | 'moderate' | 'significant',
    };
  });
}

// ─── Red Flag Detector ────────────────────────────────────────────
function detectRedFlags(observations: ClinicalObservation[], patient: PatientProfile): ClinicalRedFlag[] {
  const flags: ClinicalRedFlag[] = [];

  const weightLossObs = observations.filter(o =>
    o.tags?.includes('weight_loss') && o.tags?.includes('unintentional')
  );
  if (weightLossObs.length > 0) {
    flags.push({
      id: 'rf_weight_loss_significant',
      title_en: 'Significant Unintentional Weight Loss',
      title_bn: 'উল্লেখযোগ্য অনিচ্ছাকৃত ওজন হ্রাস',
      triggeringObservationIds: weightLossObs.map(o => o.id),
      urgency: 'immediate',
      recommendedAction_en: 'Refer for urgent medical evaluation to rule out malignancy or systemic disease.',
      recommendedAction_bn: 'ম্যালিগন্যান্সি বা পদ্ধতিগত রোগ বাদ দিতে জরুরি চিকিৎসা মূল্যায়নের জন্য রেফার করুন।',
      blocksAutoIntervention: true,
      requiresClinicianReview: true,
    });
  }

  const bleedingObs = observations.filter(o =>
    o.tags?.includes('gi_bleeding') || o.tags?.includes('rectal_bleeding')
  );
  if (bleedingObs.length > 0) {
    flags.push({
      id: 'rf_gi_bleeding',
      title_en: 'Gastrointestinal Bleeding',
      title_bn: 'গ্যাস্ট্রোইন্টেস্টাইনাল রক্তপাত',
      triggeringObservationIds: bleedingObs.map(o => o.id),
      urgency: 'immediate',
      recommendedAction_en: 'Immediate referral to gastroenterology for endoscopic evaluation.',
      recommendedAction_bn: 'এন্ডোস্কোপিক মূল্যায়নের জন্য গ্যাস্ট্রোএন্টেরোলজিতে তাৎক্ষণিক রেফারেল।',
      blocksAutoIntervention: true,
      requiresClinicianReview: true,
    });
  }

  if (isPregnant(patient)) {
    const weightLossInterventionObs = observations.filter(o =>
      o.tags?.includes('weight_loss_intervention')
    );
    if (weightLossInterventionObs.length > 0) {
      flags.push({
        id: 'rf_pregnancy_weight_restriction',
        title_en: 'Weight Loss Intervention Contraindicated in Pregnancy',
        title_bn: 'গর্ভাবস্থায় ওজন কমানোর হস্তক্ষেপ প্রতিবন্ধী',
        triggeringObservationIds: weightLossInterventionObs.map(o => o.id),
        urgency: 'immediate',
        recommendedAction_en: 'Weight loss interventions are contraindicated during pregnancy.',
        recommendedAction_bn: 'গর্ভাবস্থায় ওজন কমানোর হস্তক্ষেপ প্রতিবন্ধী।',
        blocksAutoIntervention: true,
        requiresClinicianReview: true,
      });
    }
  }

  return flags;
}

// ─── Hypothesis Generator ─────────────────────────────────────────
let _hypothesisCounter = 0;
function nextHypId(): string {
  return `hyp_${String(++_hypothesisCounter).padStart(3, '0')}`;
}

function generateHypotheses(
  observations: ClinicalObservation[],
  patient: PatientProfile,
  _redFlags: ClinicalRedFlag[],
): ClinicalHypothesis[] {
  _hypothesisCounter = 0;
  const hypotheses: ClinicalHypothesis[] = [];
  const isPed = isPediatric(patient);
  const isPreg = isPregnant(patient);

  const hasTag = (tag: string) => observations.some(o => o.tags?.includes(tag));
  const obsWithTag = (tag: string) => observations.filter(o => o.tags?.includes(tag));

  // ── GI / Assimilation cluster ──────────────────────────────────
  if (hasTag('bloating') || hasTag('gi_discomfort') || hasTag('constipation') || hasTag('diarrhea')) {
    const supportingObs = observations.filter(o =>
      observationMatchesTags(o, ['bloating', 'gi_discomfort', 'constipation', 'diarrhea', 'gas', 'abdominal_pain'])
    );
    const contradictoryObs = observations.filter(o =>
      observationMatchesTags(o, ['normal_colonoscopy', 'normal_endoscopy'])
    );
    const level: EvidenceSupportLevel = supportingObs.length >= 3 ? 'sufficient'
      : supportingObs.length >= 1 ? 'some' : 'limited';

    hypotheses.push({
      id: nextHypId(),
      cluster: 'gastrointestinal',
      title_en: 'Altered GI Microbiome / Dysbiosis Pattern',
      title_bn: 'পরিবর্তিত গ্যাস্ট্রোইন্টেস্টাইনাল মাইক্রোবায়োম / ডিসবায়োসিস প্যাটার্ন',
      description_en: 'Functional GI symptoms suggest possible disruption of gut microbiome balance.',
      description_bn: 'কার্যকরী গ্যাস্ট্রোইন্টেস্টাইনাল লক্ষণগুলি গাট মাইক্রোবায়োম ভারসাম্যের সম্ভাব্য ব্যাঘাত নির্দেশ করে।',
      biologicalSystems: ['assimilation', 'defense_repair'],
      supportingObservationIds: supportingObs.map(o => o.id),
      contradictoryObservationIds: contradictoryObs.map(o => o.id),
      missingEvidence: ['Stool microbiome analysis', 'H. pylori testing', 'Lactulose breath test'],
      alternativeExplanations: ['Food intolerance', 'Stress-induced motility change'],
      confounders: ['Antibiotic history', 'Recent dietary change'],
      potentialNutritionTargets: ['prebiotic_fiber', 'fermented_foods', 'low_fodmap_trial'],
      requiredInvestigations: ['stool_culture', 'h_pylori_test', 'breath_test_sibo'],
      evidenceSupportLevel: level,
      triggeringRuleIds: ['rule_gi_dysbiosis_01'],
      applicablePopulations: ['all'],
      clinicianDecision: 'pending',
      isConfirmedDiagnosis: false,
    });
  }

  // ── Medication confounding cluster ─────────────────────────────
  const medicationObs = observations.filter(o => o.category === 'medication');
  const giObs = observations.filter(o =>
    observationMatchesTags(o, ['bloating', 'gi_discomfort', 'nausea', 'diarrhea'])
  );
  if (medicationObs.length > 0 && giObs.length > 0) {
    hypotheses.push({
      id: nextHypId(),
      cluster: 'medication_supplement',
      title_en: 'Medication-Associated GI Symptom Pattern',
      title_bn: 'ওষুধ-সম্পর্কিত গ্যাস্ট্রোইন্টেস্টাইনাল লক্ষণ প্যাটার্ন',
      description_en: 'GI symptoms may be temporally associated with current medication. This is an observation of association, not a causal claim.',
      description_bn: 'গ্যাস্ট্রোইন্টেস্টাইনাল লক্ষণগুলি বর্তমান ওষুধের সাথে সময়গতভাবে যুক্ত হতে পারে।',
      biologicalSystems: ['assimilation', 'biotransformation'],
      supportingObservationIds: [...medicationObs, ...giObs].map(o => o.id),
      contradictoryObservationIds: [],
      missingEvidence: ['Temporal relationship documentation', 'Medication dose history'],
      alternativeExplanations: ['Pre-existing GI condition', 'Dietary change'],
      confounders: ['Multiple concurrent medications'],
      potentialNutritionTargets: ['medication_timing_with_food', 'probiotic_support'],
      requiredInvestigations: ['medication_timeline_review'],
      evidenceSupportLevel: 'some',
      triggeringRuleIds: ['rule_medication_gi_01'],
      applicablePopulations: ['all'],
      clinicianDecision: 'pending',
      isConfirmedDiagnosis: false,
    });
  }

  // ── Metabolic cluster ──────────────────────────────────────────
  const metabolicObs = observations.filter(o =>
    observationMatchesTags(o, ['elevated_glucose', 'insulin_resistance', 'central_adiposity', 'high_bmi', 'elevated_hba1c', 'elevated_triglycerides'])
  );
  if (!isPed && metabolicObs.length >= 1) {
    const hasLabEvidence = observations.some(o =>
      observationMatchesTags(o, ['elevated_glucose', 'elevated_hba1c', 'insulin_resistance'])
    );
    const level: EvidenceSupportLevel = metabolicObs.length >= 3 ? 'sufficient'
      : hasLabEvidence ? 'some' : 'limited';

    hypotheses.push({
      id: nextHypId(),
      cluster: 'metabolic',
      title_en: 'Insulin Resistance / Metabolic Dysregulation Pattern',
      title_bn: 'ইনসুলিন রেজিস্ট্যান্স / বিপাকীয় ডিসরেগুলেশন প্যাটার্ন',
      description_en: 'Clustering of metabolic risk markers suggests functional insulin resistance pattern. Not a confirmed diagnosis.',
      description_bn: 'বিপাকীয় ঝুঁকির চিহ্নগুলির ক্লাস্টারিং কার্যকরী ইনসুলিন রেজিস্ট্যান্স প্যাটার্ন নির্দেশ করে।',
      biologicalSystems: ['energy', 'communication', 'transport'],
      supportingObservationIds: metabolicObs.map(o => o.id),
      contradictoryObservationIds: [],
      missingEvidence: hasLabEvidence ? [] : ['Fasting glucose', 'HbA1c', 'Fasting insulin', 'HOMA-IR'],
      alternativeExplanations: ['Stress-induced hyperglycemia', 'Medication effect'],
      confounders: ['Corticosteroid use', 'Sleep deprivation'],
      potentialNutritionTargets: ['low_glycemic_load', 'protein_distribution', 'fiber_adequacy'],
      requiredInvestigations: hasLabEvidence ? ['oral_glucose_tolerance'] : ['fasting_glucose', 'hba1c', 'fasting_insulin'],
      evidenceSupportLevel: level,
      triggeringRuleIds: ['rule_metabolic_ir_01'],
      applicablePopulations: ['adult', 'geriatric'],
      clinicianDecision: 'pending',
      isConfirmedDiagnosis: false,
    });
  }

  // ── Nutritional deficiency cluster ─────────────────────────────
  const fatigueObs = obsWithTag('fatigue');
  if (fatigueObs.length > 0) {
    const hasLabs = observations.some(o => o.category === 'lab');
    const level: EvidenceSupportLevel = hasLabs ? 'some' : 'insufficient';

    hypotheses.push({
      id: nextHypId(),
      cluster: 'nutritional',
      title_en: 'Nutritional Deficiency Pattern (Micronutrient)',
      title_bn: 'পুষ্টির ঘাটতি প্যাটার্ন (মাইক্রোনিউট্রিয়েন্ট)',
      description_en: 'Fatigue may be consistent with micronutrient deficiency. Cannot be confirmed without laboratory assessment.',
      description_bn: 'ক্লান্তি মাইক্রোনিউট্রিয়েন্ট ঘাটতির সাথে সামঞ্জস্যপূর্ণ হতে পারে। পরীক্ষাগার মূল্যায়ন ছাড়া নিশ্চিত করা যাবে না।',
      biologicalSystems: ['energy', 'transport', 'communication'],
      supportingObservationIds: fatigueObs.map(o => o.id),
      contradictoryObservationIds: [],
      missingEvidence: hasLabs ? [] : ['Serum ferritin', 'Vitamin B12', 'Vitamin D3', 'CBC'],
      alternativeExplanations: ['Sleep deprivation', 'Thyroid dysfunction', 'Depression'],
      confounders: ['Poor dietary diversity', 'Malabsorption'],
      potentialNutritionTargets: ['iron_rich_foods', 'vitamin_d_sources', 'b12_sources'],
      requiredInvestigations: ['ferritin', 'vitamin_b12', 'vitamin_d3', 'cbc'],
      evidenceSupportLevel: level,
      triggeringRuleIds: ['rule_nutritional_deficiency_01'],
      applicablePopulations: ['all'],
      clinicianDecision: 'pending',
      isConfirmedDiagnosis: false,
    });
  }

  // ── Sleep/Stress/Circadian cluster ────────────────────────────
  const sleepObs = observations.filter(o =>
    observationMatchesTags(o, ['poor_sleep', 'insomnia', 'sleep_disruption', 'night_shift', 'stress'])
  );
  if (!isPed && sleepObs.length > 0) {
    hypotheses.push({
      id: nextHypId(),
      cluster: 'sleep_stress_circadian',
      title_en: 'Sleep-Circadian-Stress Dysregulation Pattern',
      title_bn: 'ঘুম-সার্কাডিয়ান-স্ট্রেস ডিসরেগুলেশন প্যাটার্ন',
      description_en: 'Disrupted sleep and stress patterns may contribute to cortisol dysregulation.',
      description_bn: 'বিঘ্নিত ঘুম এবং স্ট্রেস প্যাটার্ন কর্টিসল ডিসরেগুলেশনে অবদান রাখতে পারে।',
      biologicalSystems: ['communication', 'energy', 'defense_repair'],
      supportingObservationIds: sleepObs.map(o => o.id),
      contradictoryObservationIds: [],
      missingEvidence: ['Cortisol diurnal curve', 'Melatonin assessment'],
      alternativeExplanations: ['Primary sleep disorder', 'Medication side effect'],
      confounders: ['Caffeine intake', 'Screen exposure'],
      potentialNutritionTargets: ['magnesium_rich_foods', 'tryptophan_sources', 'meal_timing'],
      requiredInvestigations: ['cortisol_diurnal', 'sleep_study'],
      evidenceSupportLevel: sleepObs.length >= 2 ? 'some' : 'limited',
      triggeringRuleIds: ['rule_sleep_circadian_01'],
      applicablePopulations: ['adult', 'geriatric', 'adolescent'],
      clinicianDecision: 'pending',
      isConfirmedDiagnosis: false,
    });
  }

  // ── Immune/Inflammatory cluster ───────────────────────────────
  const inflammatoryObs = observations.filter(o =>
    observationMatchesTags(o, ['elevated_crp', 'joint_pain', 'inflammatory_markers', 'chronic_infection'])
  );
  if (!isPed && inflammatoryObs.length > 0) {
    hypotheses.push({
      id: nextHypId(),
      cluster: 'immune_inflammatory',
      title_en: 'Chronic Low-Grade Inflammatory Pattern',
      title_bn: 'দীর্ঘস্থায়ী নিম্ন-গ্রেডের প্রদাহজনক প্যাটার্ন',
      description_en: 'Inflammatory markers suggest a pattern of chronic low-grade inflammation.',
      description_bn: 'প্রদাহজনক চিহ্নগুলি দীর্ঘস্থায়ী নিম্ন-গ্রেডের প্রদাহের প্যাটার্ন নির্দেশ করে।',
      biologicalSystems: ['defense_repair', 'energy', 'structural_integrity'],
      supportingObservationIds: inflammatoryObs.map(o => o.id),
      contradictoryObservationIds: [],
      missingEvidence: ['hs-CRP', 'ESR', 'ANA screening'],
      alternativeExplanations: ['Acute infection', 'Autoimmune condition'],
      confounders: ['Obesity', 'Smoking'],
      potentialNutritionTargets: ['anti_inflammatory_foods', 'omega3_sources'],
      requiredInvestigations: ['hs_crp', 'esr', 'full_blood_count'],
      evidenceSupportLevel: 'some',
      triggeringRuleIds: ['rule_immune_inflammatory_01'],
      applicablePopulations: ['adult', 'geriatric'],
      clinicianDecision: 'pending',
      isConfirmedDiagnosis: false,
    });
  }

  void isPreg; // used in red flags; suppress unused var warning
  void getPatientPopulations;

  return hypotheses;
}

// ─── Priority Builder ─────────────────────────────────────────────
function buildPriorities(hypotheses: ClinicalHypothesis[], redFlags: ClinicalRedFlag[]): ClinicalPriority[] {
  const priorities: ClinicalPriority[] = [];
  let rank = 1;

  redFlags.forEach(rf => {
    priorities.push({
      id: `pri_${rank}`,
      type: 'medical_urgency',
      title_en: rf.title_en,
      title_bn: rf.title_bn,
      linkedObservationIds: rf.triggeringObservationIds,
      urgency: rf.urgency,
      rationale_en: rf.recommendedAction_en,
      rationale_bn: rf.recommendedAction_bn,
      rank: rank++,
    });
  });

  hypotheses
    .filter(h => h.evidenceSupportLevel === 'sufficient')
    .forEach(h => {
      priorities.push({
        id: `pri_${rank}`,
        type: 'nutrition_intervention',
        title_en: `Address: ${h.title_en}`,
        title_bn: `সমাধান করুন: ${h.title_bn}`,
        linkedHypothesisId: h.id,
        linkedObservationIds: h.supportingObservationIds,
        urgency: 'urgent',
        rationale_en: h.description_en,
        rationale_bn: h.description_bn,
        rank: rank++,
      });
    });

  const investigationsNeeded = [...new Set(hypotheses.flatMap(h => h.requiredInvestigations))];
  if (investigationsNeeded.length > 0) {
    priorities.push({
      id: `pri_${rank}`,
      type: 'further_assessment',
      title_en: 'Complete Missing Investigations',
      title_bn: 'অনুপস্থিত তদন্ত সম্পন্ন করুন',
      linkedObservationIds: [],
      urgency: 'routine',
      rationale_en: `Key investigations needed: ${investigationsNeeded.slice(0, 5).join(', ')}`,
      rationale_bn: `প্রয়োজনীয় মূল তদন্ত`,
      rank: rank++,
    });
  }

  return priorities;
}

// ─── Timeline Builder ─────────────────────────────────────────────
function buildTimeline(observations: ClinicalObservation[], patient: PatientProfile): ClinicalTimelineEvent[] {
  const events: ClinicalTimelineEvent[] = [];

  observations.filter(o => o.category === 'medication').forEach((obs, i) => {
    events.push({
      id: `tl_med_${i}`,
      date: obs.date,
      eventType: 'medication_start',
      title_en: `Medication: ${obs.observedValue}`,
      title_bn: `ওষুধ: ${obs.observedValue}`,
      description_en: 'Patient started or is currently taking this medication.',
      description_bn: 'রোগী এই ওষুধ বর্তমানে ব্যবহার করছেন।',
      relatedHypothesisIds: [],
      temporalAssociation: 'possible contributor',
      clinicianConfirmed: false,
    });
  });

  observations.filter(o => o.tags?.includes('weight_change')).forEach((obs, i) => {
    events.push({
      id: `tl_wt_${i}`,
      date: obs.date,
      eventType: 'weight_change',
      title_en: `Weight Change: ${obs.observedValue}${obs.unit || ''}`,
      title_bn: `ওজন পরিবর্তন: ${obs.observedValue}${obs.unit || ''}`,
      description_en: 'Recorded weight change.',
      description_bn: 'রেকর্ড করা ওজন পরিবর্তন।',
      relatedHypothesisIds: [],
      temporalAssociation: 'possible contributor',
      clinicianConfirmed: false,
    });
  });

  if (isPregnant(patient)) {
    events.push({
      id: 'tl_pregnancy',
      date: patient.visit_date,
      eventType: 'reproductive_event',
      title_en: `Pregnancy (Trimester ${patient.trimester ?? '?'})`,
      title_bn: `গর্ভাবস্থা (ট্রাইমেস্টার ${patient.trimester ?? '?'})`,
      description_en: 'Patient is currently pregnant.',
      description_bn: 'রোগী বর্তমানে গর্ভবতী।',
      relatedHypothesisIds: [],
      clinicianConfirmed: true,
    });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Intervention Goal Builder ────────────────────────────────────
function buildInterventionGoals(
  hypotheses: ClinicalHypothesis[],
  patient: PatientProfile,
  redFlags: ClinicalRedFlag[],
): InterventionGoal[] {
  if (redFlags.some(rf => rf.blocksAutoIntervention)) return [];

  if (isPregnant(patient)) {
    return [{
      id: 'ig_pregnancy_safe',
      category: 'dietary_adequacy',
      title_en: 'Gestational Nutritional Adequacy',
      title_bn: 'গর্ভকালীন পুষ্টিগত পর্যাপ্ততা',
      clinicalObjective_en: 'Ensure adequate folate, iron, calcium, and iodine for pregnancy.',
      clinicalObjective_bn: 'গর্ভাবস্থার জন্য পর্যাপ্ত ফোলেট, আয়রন, ক্যালসিয়াম এবং আয়োডিন নিশ্চিত করুন।',
      rationale_en: 'Gestational nutrition is critical for fetal development.',
      rationale_bn: 'গর্ভকালীন পুষ্টি ভ্রূণের বিকাশের জন্য গুরুত্বপূর্ণ।',
      safetyConsiderations: ['No weight loss targets during pregnancy'],
      nutritionalConstraints: ['gestational_weight_gain_guidelines'],
      monitoringIndicators: ['weight_gain_rate', 'fundal_height'],
      proposedFollowUpWeeks: 4,
      clinicianApprovalStatus: 'pending',
    }];
  }

  return hypotheses
    .filter(h => h.evidenceSupportLevel !== 'insufficient')
    .slice(0, 5)
    .map((h, i) => ({
      id: `ig_${i + 1}`,
      category: 'dietary_adequacy' as const,
      title_en: `Nutritional Support for ${h.cluster} Pattern`,
      title_bn: `${h.cluster} প্যাটার্নের জন্য পুষ্টিগত সহায়তা`,
      clinicalObjective_en: `Address nutritional factors related to ${h.cluster} pattern.`,
      clinicalObjective_bn: `${h.cluster} প্যাটার্নের সাথে সম্পর্কিত পুষ্টিগত কারণগুলি সমাধান করুন।`,
      linkedHypothesisId: h.id,
      rationale_en: h.description_en,
      rationale_bn: h.description_bn,
      safetyConsiderations: [],
      nutritionalConstraints: [],
      monitoringIndicators: [],
      proposedFollowUpWeeks: 8,
      clinicianApprovalStatus: 'pending' as const,
    }));
}

// ─── Missing Data Identifier ──────────────────────────────────────
function identifyMissingData(observations: ClinicalObservation[], hypotheses: ClinicalHypothesis[]): string[] {
  const missing: string[] = [];
  const hasLabs = observations.some(o => o.category === 'lab');
  if (!hasLabs) {
    missing.push('No laboratory data provided — clinical hypotheses cannot be confirmed');
    missing.push('Recommend: CBC, ferritin, vitamin B12, vitamin D3, fasting glucose, HbA1c');
  }
  hypotheses.forEach(h => {
    h.missingEvidence.forEach(m => {
      if (!missing.includes(m)) missing.push(m);
    });
  });
  return missing;
}

// ─── Main Engine Function ─────────────────────────────────────────
export function runP2Analysis(
  inputOrPatient: P2EngineInput | PatientProfile,
  assessmentAnswers?: Record<string, any>,
  previousApprovals?: ClinicianApprovalRecord[]
): P2AnalysisResult {
  let patient: PatientProfile;
  let observations: ClinicalObservation[];
  let approvals: ClinicianApprovalRecord[] = previousApprovals || [];

  if ('id' in inputOrPatient && 'gender' in inputOrPatient && 'age' in inputOrPatient) {
    // Called as runP2Analysis(patient, assessmentAnswers, previousApprovals)
    patient = inputOrPatient as PatientProfile;
    observations = aggregateEvidence(patient, assessmentAnswers || {});
  } else {
    // Called as runP2Analysis(P2EngineInput)
    const input = inputOrPatient as P2EngineInput;
    patient = input.patient;
    if (input.observations && input.observations.length > 0) {
      observations = input.observations;
    } else {
      observations = aggregateEvidence(patient, input.assessmentAnswers || {});
    }
    if (input.previousApprovals) {
      approvals = input.previousApprovals;
    }
  }

  const domainFindings = buildDomainFindings(observations, patient);
  const redFlags = detectRedFlags(observations, patient);
  const hypotheses = generateHypotheses(observations, patient, redFlags);
  const priorities = buildPriorities(hypotheses, redFlags);
  const timelineEvents = buildTimeline(observations, patient);
  const interventionGoals = buildInterventionGoals(hypotheses, patient, redFlags);
  const missingData = identifyMissingData(observations, hypotheses);

  const finalHypotheses = hypotheses.map(h => {
    const prior = approvals.find(a => a.targetId === h.id && a.targetType === 'hypothesis');
    if (prior) {
      return { ...h, clinicianDecision: prior.decision as 'accepted' | 'rejected' | 'uncertain' | 'more_info_needed' | 'pending' };
    }
    return h;
  });

  const dietPlanningContext: DietPlanningContext = {
    patientId: patient.id,
    visitId: `visit_${patient.visit_date}`,
    generatedAt: new Date().toISOString(),
    confirmedAllergies: patient.confirmed_allergies,
    hardRestrictions: [],
    approvedInterventionGoals: interventionGoals.filter(g => g.clinicianApprovalStatus === 'approved'),
    nutritionalTargets: [],
    lifeStage: patient.population_group,
    medicationConstraints: patient.active_medications,
    foodPreferences: patient.dietary_preferences || {},
    currentCarePhase: patient.current_phase,
    clinicianApprovedHypotheses: finalHypotheses.filter(h => h.clinicianDecision === 'accepted').map(h => h.id),
    unconfirmedHypotheses: finalHypotheses.filter(h => h.clinicianDecision === 'pending').map(h => h.id),
  };

  return {
    patientId: patient.id,
    visitId: `visit_${patient.visit_date}`,
    analysisVersion: '2.0.0',
    generatedAt: new Date().toISOString(),
    observations,
    domainFindings,
    hypotheses: finalHypotheses,
    redFlags,
    priorities,
    timelineEvents,
    interventionGoals,
    approvalHistory: approvals,
    dietPlanningContext,
    missingHighValueData: missingData,
  };
}
