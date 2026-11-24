/**
 * SHUDDHO Phase R5 — Systems Network Engine
 * 
 * 7-Domain Functional Medicine Matrix & Deterministic Systems Network Graph.
 * 
 * Clinical Principles:
 * 1. 7 Core Functional Domains: assimilation, defense_repair, energy, biotransformation,
 *    transport, communication, structural_integrity.
 * 2. ATM Model: Categorizes Antecedents (predispositions), Triggers (initiating events),
 *    and Mediators (perpetuating drivers).
 * 3. Directional Systems Graph: Maps mechanistic cross-system pathophysiology (e.g. Gut Dysbiosis
 *    leading to Endothelial Inflammation leading to Cardiometabolic Dysfunction).
 * 4. Deterministic Centrality & Hub Identification: Detects key leverage points where targeted
 *    precision nutrition intervention yields multi-system therapeutic improvement.
 */

import {
  FunctionalMatrixDomain,
  ATMType,
  FunctionalObservation,
  SystemsNetworkNode,
  SystemsNetworkEdge,
  SystemsNetworkGraph,
  ExpandedClinicalPathwayId,
  R5MedicationRecord
} from '../types/r5Systems';

export interface MatrixEvaluationInput {
  pathway_ids: ExpandedClinicalPathwayId[];
  conditions?: string[];
  symptoms?: string[];
  medications?: R5MedicationRecord[];
  family_history?: string[];
  lifestyle_notes?: string[];
  patient_id?: string;
  visit_id?: string;
  assessment_answers?: Record<string, any>;
  lab_entries?: Record<string, any>;
  gut_profile?: {
    bloating?: string;
    acid_reflux_hypoacidity?: boolean;
    bristol_stool_score?: number;
    energy_score?: number;
    sleep_quality_score?: number;
    digestive_fire_agni?: string;
  };
  ffq_habits?: any;
  anthropometrics?: {
    bmi?: number;
    waist_cm?: number;
    height_cm?: number;
    weight_kg?: number;
  };
  sleep_data?: {
    sleep_hours?: number;
    shift_worker?: boolean;
    sleep_quality_score?: number;
  };
  activity_level?: string;
  confirmed_allergies?: string[];
}

/**
 * Clinical Evidence Adapter for the 14-Domain Assessment System (P1-001)
 * Extracts structured evidence from patient records and assessment answers
 * without duplicating questionnaire fields.
 */
export function adaptAssessmentEvidenceToMatrixInput(
  patient: any,
  assessmentAnswers?: Record<string, any>,
  labEntries?: Record<string, any>,
  ffqHabits?: any,
  pathways?: ExpandedClinicalPathwayId[],
  medications?: R5MedicationRecord[]
): MatrixEvaluationInput {
  const gut = patient?.gut_profile || {};
  const symptoms: string[] = [];
  if (gut.bloating && gut.bloating !== 'none') symptoms.push(`bloating_${gut.bloating}`);
  if (gut.acid_reflux_hypoacidity) symptoms.push('acid_reflux');
  if (gut.energy_score !== undefined && gut.energy_score < 5) symptoms.push('fatigue');

  return {
    patient_id: patient?.id,
    visit_id: patient?.current_visit_id,
    pathway_ids: pathways || patient?.r5_pathways?.selected_pathways || [],
    conditions: patient?.selected_conditions || [],
    medications: medications || patient?.medication_records || [],
    assessment_answers: assessmentAnswers || {},
    lab_entries: labEntries || patient?.labs || {},
    gut_profile: gut,
    ffq_habits: ffqHabits,
    anthropometrics: {
      bmi: patient?.calculated?.bmi,
      waist_cm: patient?.waist_cm,
      height_cm: patient?.height_cm,
      weight_kg: patient?.weight_kg
    },
    sleep_data: {
      sleep_hours: patient?.sleep_hours,
      shift_worker: patient?.shift_worker,
      sleep_quality_score: gut.sleep_quality_score
    },
    activity_level: patient?.activity_level,
    confirmed_allergies: patient?.confirmed_allergies || [],
    symptoms
  };
}

export interface FunctionalMatrixState {
  domains: Record<FunctionalMatrixDomain, FunctionalObservation[]>;
  atm: {
    antecedents: FunctionalObservation[];
    triggers: FunctionalObservation[];
    mediators: FunctionalObservation[];
  };
  total_observations: number;
}

/**
 * Standard Domain Metadata with Bilingual Titles & Descriptions
 */
export const FUNCTIONAL_DOMAINS_META: Record<
  FunctionalMatrixDomain,
  { name_en: string; name_bn: string; subtitle_en: string; subtitle_bn: string; icon: string }
> = {
  assimilation: {
    name_en: 'Assimilation',
    name_bn: 'পরিপাক ও শোষণ (Assimilation)',
    subtitle_en: 'Digestion, absorption, microbiota, mucosal barrier integrity',
    subtitle_bn: 'হজম, পুষ্টি শোষণ, অন্ত্রের মাইক্রোবায়োম ও শ্লেষ্মা ঝিল্লির সুস্থতা',
    icon: 'Apple'
  },
  defense_repair: {
    name_en: 'Defense & Repair',
    name_bn: 'প্রতিরক্ষা ও নিরাময় (Defense & Repair)',
    subtitle_en: 'Immune response, chronic inflammation, autoimmunity, infection',
    subtitle_bn: 'রোগ প্রতিরোধ ক্ষমতা, দীর্ঘস্থায়ী প্রদাহ, অটোইমিউনিটি ও সংক্রমণ',
    icon: 'ShieldCheck'
  },
  energy: {
    name_en: 'Energy',
    name_bn: 'কোষীয় শক্তি (Energy)',
    subtitle_en: 'Mitochondrial metabolism, oxidative stress, cellular ATP generation',
    subtitle_bn: 'মাইটোকন্ড্রিয়াল বিপাক, অক্সিডেটিভ স্ট্রেস ও কোষীয় এটিপি উৎপাদন',
    icon: 'Zap'
  },
  biotransformation: {
    name_en: 'Biotransformation',
    name_bn: 'বিষমুক্তকরণ (Biotransformation)',
    subtitle_en: 'Hepatic phase I/II detoxification, excretion, toxic load',
    subtitle_bn: 'যকৃতের বিষমুক্তকরণ প্রক্রিয়া (ফেজ ১/২), রেচন ও বর্জ্য অপসারণ',
    icon: 'Filter'
  },
  transport: {
    name_en: 'Transport',
    name_bn: 'সংবহন ও পরিবহন (Transport)',
    subtitle_en: 'Cardiovascular, lymphatic, microcirculation, endothelial health',
    subtitle_bn: 'হৃদসংবহন, লসিকাতন্ত্র, রক্তপ্রবাহ ও রক্তনালীর স্বাস্থ্য',
    icon: 'Heart'
  },
  communication: {
    name_en: 'Communication',
    name_bn: 'কোষীয় সমন্বয় ও বার্তা (Communication)',
    subtitle_en: 'Endocrine, neurotransmitters, neuropeptides, glycemic signaling',
    subtitle_bn: 'হরমোন ব্যবস্থা, নিউরোট্রান্সমিটার, ইনসুলিন ও রাসায়নিক বার্তা আদানপ্রদান',
    icon: 'Activity'
  },
  structural_integrity: {
    name_en: 'Structural Integrity',
    name_bn: 'শারীরিক গঠন ও কাঠামো (Structural Integrity)',
    subtitle_en: 'Musculoskeletal, cell membranes, connective tissue, bone density',
    subtitle_bn: 'পেশী ও কঙ্কালতন্ত্র, কোষের পর্দা, যোজক কলা ও হাড়ের ঘনত্ব',
    icon: 'Layers'
  }
};

/**
 * Derives the 7-domain Functional Medicine Matrix and ATM from clinical inputs
 */
export function evaluateFunctionalMatrix(input: MatrixEvaluationInput): FunctionalMatrixState {
  const domains: Record<FunctionalMatrixDomain, FunctionalObservation[]> = {
    assimilation: [],
    defense_repair: [],
    energy: [],
    biotransformation: [],
    transport: [],
    communication: [],
    structural_integrity: []
  };

  const atm: FunctionalMatrixState['atm'] = {
    antecedents: [],
    triggers: [],
    mediators: []
  };

  const pathways = input.pathway_ids || [];
  const symptoms = (input.symptoms || []).map(s => s.toLowerCase());
  const meds = input.medications || [];
  const answers = input.assessment_answers || {};
  const labs = input.lab_entries || {};
  const now = new Date().toISOString();

  // Helper to check valid positive/reported symptom value (not 'none', 'never', 'no', '', undefined)
  const isAffirmative = (val: any): boolean => {
    if (val === undefined || val === null) return false;
    if (typeof val === 'boolean') return val === true;
    if (typeof val === 'number') return val > 0;
    if (Array.isArray(val)) return val.length > 0;
    const s = String(val).trim().toLowerCase();
    return s !== '' && s !== 'none' && s !== 'never' && s !== 'no' && s !== '0' && s !== 'false';
  };

  // Helper to parse numeric lab values safely
  const parseLabNum = (val: any): number | null => {
    if (typeof val === 'number') return isNaN(val) ? null : val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  };

  // 1. Assimilation Domain Observations
  if (pathways.includes('gastrointestinal_hepatobiliary') || symptoms.some(s => s.includes('bloat') || s.includes('reflux') || s.includes('constip') || s.includes('diarrhea'))) {
    const hasReportedSymptoms = symptoms.some(s => s.includes('bloat') || s.includes('reflux') || s.includes('constip') || s.includes('diarrhea'));
    const obs: FunctionalObservation = {
      id: 'OBS_ASSIM_01',
      observation_id: 'OBS_ASSIM_01',
      patient_id: input.patient_id,
      domain: 'assimilation',
      clinical_domain: 'gastrointestinal',
      observation_type: 'symptom',
      atm_type: 'mediator',
      title_en: 'Gastrointestinal Barrier & Microbiota Disruption (Plausible Hypothesis)',
      title_bn: 'পরিপাকতন্ত্রের প্রাচীর ও মাইক্রোবায়োমের ভারসাম্যহীনতা (সম্ভাব্য হাইপোথিসিস)',
      description_en: 'Reported digestive symptoms or GI pathway context suggest potential barrier permeability and dysbiosis. Clinical verification required before confirming mucosal barrier pathology.',
      description_bn: 'পরিপাকজনিত লক্ষণ বা গ্যাস্ট্রোইনটেস্টাইনাল উপসর্গ অন্ত্রের প্রাচীরের প্রদাহ ও উপকারী জীবাণুর ভারসাম্যহীনতার ইঙ্গিত দেয়। নিশ্চিতকরণের জন্য ক্লিনিক্যাল নিরীক্ষা প্রয়োজন।',
      confidence_status: hasReportedSymptoms ? 'PATIENT_REPORTED' : 'PLAUSIBLE_HYPOTHESIS',
      evidence_source: hasReportedSymptoms ? 'patient_symptom_report' : 'gastrointestinal_hepatobiliary_pathway_context',
      source_type: hasReportedSymptoms ? 'intake_self_report' : 'clinical_history',
      clinician_verified: false,
      potential_nutrition_implication: 'Individualized elimination of trigger foods, prebiotic fiber review, and mindful meal eating.',
      recorded_at: now
    };
    domains.assimilation.push(obs);
    atm.mediators.push(obs);
  }

  // 1b. Stool & Motility from Gut Profile
  if (input.gut_profile?.bristol_stool_score) {
    const bss = input.gut_profile.bristol_stool_score;
    if (bss <= 2 || bss >= 6) {
      const isConstip = bss <= 2;
      const obsStool: FunctionalObservation = {
        id: isConstip ? 'OBS_ASSIM_CONSTIP' : 'OBS_ASSIM_RAPID_TRANSIT',
        observation_id: isConstip ? 'OBS_ASSIM_CONSTIP' : 'OBS_ASSIM_RAPID_TRANSIT',
        patient_id: input.patient_id,
        domain: 'assimilation',
        clinical_domain: 'microbiome',
        observation_type: 'symptom',
        atm_type: 'mediator',
        title_en: isConstip ? 'Colonic Hypomotility & Delayed Transit (Bristol Stool Type 1-2)' : 'Hyperosmotic Motility & Rapid Transit (Bristol Stool Type 6-7)',
        title_bn: isConstip ? 'মল নিষ্কাশনে বিলম্ব ও কোষ্ঠকাঠিন্য (ব্রিস্টল টাইপ ১-২)' : 'দ্রুত অন্ত্রের গতি ও নরম মল (ব্রিস্টল টাইপ ৬-৭)',
        description_en: isConstip ? 'Pellet-like or hard stool indicating delayed colonic transit and potential fluid reabsorption.' : 'Loose or mushy stool indicating accelerated colonic transit time.',
        description_bn: isConstip ? 'শক্ত মল ও দীর্ঘমেয়াদী কোষ্ঠকাঠিন্যের লক্ষণ।' : 'পাতলা বা নরম মল ও দ্রুত অন্ত্রের ট্রানজিট সময়।',
        confidence_status: 'PATIENT_REPORTED',
        evidence_source: 'gut_profile_bristol_score',
        source_type: 'functional_assessment',
        clinician_verified: false,
        potential_nutrition_implication: isConstip ? 'Increase soluble dietary fiber (oats, chia) and ensure 2-2.5L daily hydration.' : 'Assess FODMAP tolerance and replenish electrolyte balance.',
        recorded_at: now
      };
      domains.assimilation.push(obsStool);
      atm.mediators.push(obsStool);
    }
  }

  // 1c. Assessment Questionnaire Evidence — Assimilation Domain
  if (isAffirmative(answers.bloating_frequency)) {
    const obsBloat: FunctionalObservation = {
      id: 'OBS_ASSIM_BLOATING',
      observation_id: 'OBS_ASSIM_BLOATING',
      patient_id: input.patient_id,
      domain: 'assimilation',
      clinical_domain: 'gastrointestinal',
      observation_type: 'symptom',
      atm_type: 'mediator',
      title_en: 'Postprandial Abdominal Bloating & Fermentative Distension',
      title_bn: 'খাবারের পর পেট ফাঁপা ও গ্যাসজনিত অস্বস্তি',
      description_en: `Patient documents frequent/daily abdominal bloating (${answers.bloating_frequency}). Investigates FODMAP fermentation, SIBO, or pancreatic exocrine insufficiency.`,
      description_bn: `নিয়মিত পেট ফাঁপা ও হজমের সমস্যার ক্লিনিক্যাল লক্ষণ।`,
      confidence_status: 'PATIENT_REPORTED',
      evidence_source: 'assessment_bloating_frequency',
      source_type: 'intake_self_report',
      clinician_verified: false,
      potential_nutrition_implication: 'Evaluate fermentable carbohydrate tolerance, warm cooked meals, and ginger digestive infusion.',
      recorded_at: now
    };
    domains.assimilation.push(obsBloat);
    atm.mediators.push(obsBloat);
  }

  if (isAffirmative(answers.acid_reflux_frequency)) {
    const obsReflux: FunctionalObservation = {
      id: 'OBS_ASSIM_REFLUX',
      observation_id: 'OBS_ASSIM_REFLUX',
      patient_id: input.patient_id,
      domain: 'assimilation',
      clinical_domain: 'gastrointestinal',
      observation_type: 'symptom',
      atm_type: 'mediator',
      title_en: 'Upper GI Acid Reflux & Dysfunctional Lower Esophageal Barrier',
      title_bn: 'গ্যাস্ট্রিক এসিড রিফ্লাক্স ও বুক জ্বালাপোড়া',
      description_en: `Reported recurring reflux/heartburn (${answers.acid_reflux_frequency}).`,
      description_bn: `বুক জ্বালাপোড়া ও টক ঢেকুরের উপস্থিতি।`,
      confidence_status: 'PATIENT_REPORTED',
      evidence_source: 'assessment_acid_reflux_frequency',
      source_type: 'intake_self_report',
      clinician_verified: false,
      potential_nutrition_implication: 'Avoid high-fat late dinners, elevation of head during sleep, and acidic trigger avoidance.',
      recorded_at: now
    };
    domains.assimilation.push(obsReflux);
    atm.mediators.push(obsReflux);
  }

  if (isAffirmative(answers.antibiotic_history_past_year) && String(answers.antibiotic_history_past_year).toLowerCase() !== 'none') {
    const obsAntibiotic: FunctionalObservation = {
      id: 'OBS_ASSIM_ANTIBIOTIC_TRIGGER',
      observation_id: 'OBS_ASSIM_ANTIBIOTIC_TRIGGER',
      patient_id: input.patient_id,
      domain: 'assimilation',
      clinical_domain: 'microbiome',
      observation_type: 'medication_impact',
      atm_type: 'trigger',
      title_en: 'Recent Antibiotic-Induced Gut Microbiota Perturbation',
      title_bn: 'অ্যান্টিবায়োটিক সেবন পরবর্তী অন্ত্রের উপকারী জীবাণুর ঘাটতি',
      description_en: `Documented antibiotic course in past year (${answers.antibiotic_history_past_year}) representing acute microbiome depletion trigger.`,
      description_bn: `সাম্প্রতিক অ্যান্টিবায়োটিক ব্যবহারের কারণে অন্ত্রের মাইক্রোবায়োমের ক্ষতি।`,
      confidence_status: 'PATIENT_REPORTED',
      evidence_source: 'assessment_antibiotic_history',
      source_type: 'intake_self_report',
      clinician_verified: false,
      potential_nutrition_implication: 'Prebiotic soluble fibers, diversified dietary polyphenols, and fermented foods if tolerated.',
      recorded_at: now
    };
    domains.assimilation.push(obsAntibiotic);
    atm.triggers.push(obsAntibiotic);
  }

  // 2. Defense and Repair Observations
  if (pathways.includes('autoimmune_inflammatory') || symptoms.some(s => s.includes('joint') || s.includes('inflamm'))) {
    const hasSymptoms = symptoms.some(s => s.includes('joint') || s.includes('inflamm'));
    const obs: FunctionalObservation = {
      id: 'OBS_DEFENSE_01',
      observation_id: 'OBS_DEFENSE_01',
      patient_id: input.patient_id,
      domain: 'defense_repair',
      clinical_domain: 'immune_inflammatory',
      observation_type: 'symptom',
      atm_type: 'mediator',
      title_en: 'Systemic Immune Activation & Inflammatory Tone (Plausible Hypothesis)',
      title_bn: 'রোগপ্রতিরোধ সক্রিয়তা ও প্রদাহজনিত প্রতিক্রিয়া (সম্ভাব্য হাইপোথিসিস)',
      description_en: 'Immune/inflammatory pathway context suggests systemic inflammatory burden. Elevated hs-CRP/ESR lab confirmation required for clinical confirmation.',
      description_bn: 'ইমিউন বা অ্যালার্জিক প্রতিক্রিয়ার প্রেক্ষাপট প্রদাহ বৃদ্ধির ইঙ্গিত দেয়। রক্তে সিআরপি পরীক্ষার মাধ্যমে নিশ্চিতকরণ প্রয়োজন।',
      confidence_status: hasSymptoms ? 'PATIENT_REPORTED' : 'PLAUSIBLE_HYPOTHESIS',
      evidence_source: hasSymptoms ? 'reported_joint_inflammatory_symptoms' : 'autoimmune_inflammatory_pathway_context',
      source_type: hasSymptoms ? 'intake_self_report' : 'clinical_history',
      clinician_verified: false,
      potential_nutrition_implication: 'Anti-inflammatory Mediterranean pattern, omega-3 fatty acids, and avoidance of verified personal food triggers.',
      recorded_at: now
    };
    domains.defense_repair.push(obs);
    atm.mediators.push(obs);
  }

  // 2b. Confirmed Allergies Evidence
  if (input.confirmed_allergies && input.confirmed_allergies.length > 0) {
    const obsAllergy: FunctionalObservation = {
      id: 'OBS_DEFENSE_CONFIRMED_ALLERGIES',
      observation_id: 'OBS_DEFENSE_CONFIRMED_ALLERGIES',
      patient_id: input.patient_id,
      domain: 'defense_repair',
      clinical_domain: 'immune_inflammatory',
      observation_type: 'symptom',
      atm_type: 'mediator',
      title_en: `Documented Immunological Allergen Reactivity (${input.confirmed_allergies.join(', ')})`,
      title_bn: `নিশ্চিত অ্যালার্জি প্রতিক্রিয়া (${input.confirmed_allergies.join(', ')})`,
      description_en: `Documented IgE/immune-mediated clinical allergy requiring strict dietary elimination.`,
      description_bn: `নিশ্চিত খাদ্য অ্যালার্জি যা খাদ্য তালিকা থেকে সম্পূর্ণ বর্জনীয়।`,
      confidence_status: 'CLINICIAN_VERIFIED',
      evidence_source: 'patient_confirmed_allergies',
      source_type: 'clinician_evaluation',
      clinician_verified: true,
      potential_nutrition_implication: 'Absolute zero-tolerance exclusion of allergen-containing foods.',
      recorded_at: now
    };
    domains.defense_repair.push(obsAllergy);
    atm.mediators.push(obsAllergy);
  }

  // 2c. Assessment Questionnaire Evidence — Defense & Repair Domain
  if (isAffirmative(answers.joint_stiffness_pain)) {
    const obsJoint: FunctionalObservation = {
      id: 'OBS_DEFENSE_JOINT',
      observation_id: 'OBS_DEFENSE_JOINT',
      patient_id: input.patient_id,
      domain: 'defense_repair',
      clinical_domain: 'immune_inflammatory',
      observation_type: 'symptom',
      atm_type: 'mediator',
      title_en: 'Articular Stiffness & Inflammatory Tone (Patient-Reported)',
      title_bn: 'জয়েন্টে শক্তভাব ও প্রদাহজনিত অস্বস্তি',
      description_en: `Patient documents joint discomfort/morning stiffness (${answers.joint_stiffness_pain}). Investigates cytokine-mediated cartilage stress.`,
      description_bn: `সন্ধিতে ব্যথা ও প্রদাহের উপসর্গ।`,
      confidence_status: 'PATIENT_REPORTED',
      evidence_source: 'assessment_joint_stiffness_pain',
      source_type: 'intake_self_report',
      clinician_verified: false,
      potential_nutrition_implication: 'Rich dietary anthocyanins, cold-water omega-3 EPA/DHA, and turmeric/curcumin incorporation.',
      recorded_at: now
    };
    domains.defense_repair.push(obsJoint);
    atm.mediators.push(obsJoint);
  }

  if (isAffirmative(answers.skin_reactions_eczema_acne)) {
    const obsSkin: FunctionalObservation = {
      id: 'OBS_DEFENSE_SKIN',
      observation_id: 'OBS_DEFENSE_SKIN',
      patient_id: input.patient_id,
      domain: 'defense_repair',
      clinical_domain: 'immune_inflammatory',
      observation_type: 'symptom',
      atm_type: 'mediator',
      title_en: 'Cutaneous Inflammatory Reactivity & Barrier Disruption',
      title_bn: 'ত্বকের প্রদাহ ও অ্যালার্জিক প্রতিক্রিয়া',
      description_en: `Reported recurring skin reactions (${answers.skin_reactions_eczema_acne}).`,
      description_bn: `ত্বকে একজিমা বা প্রদাহের উপস্থিতি।`,
      confidence_status: 'PATIENT_REPORTED',
      evidence_source: 'assessment_skin_reactions',
      source_type: 'intake_self_report',
      clinician_verified: false,
      potential_nutrition_implication: 'Zinc carnosine, omega-3, and elimination of dairy/gluten triggers if indicated.',
      recorded_at: now
    };
    domains.defense_repair.push(obsSkin);
    atm.mediators.push(obsSkin);
  }

  // 2d. Lab Evidence — Defense & Repair Domain
  const hsCrpVal = parseLabNum(labs.hs_crp || labs.crp);
  if (hsCrpVal !== null && hsCrpVal > 1.0) {
    const obsCrp: FunctionalObservation = {
      id: 'OBS_DEFENSE_CRP_LAB',
      observation_id: 'OBS_DEFENSE_CRP_LAB',
      patient_id: input.patient_id,
      domain: 'defense_repair',
      clinical_domain: 'immune_inflammatory',
      observation_type: 'biomarker',
      atm_type: 'mediator',
      title_en: `Elevated Systemic Inflammatory Biomarker (hs-CRP ${hsCrpVal} mg/L)`,
      title_bn: `রক্তে প্রদাহজনিত মার্কার বৃদ্ধি (সিআরপি ${hsCrpVal} মিগ্রা/লি)`,
      description_en: `Objective serum hs-CRP ${hsCrpVal} mg/L confirms active systemic inflammatory tone.`,
      description_bn: `রক্ত পরীক্ষায় প্রদাহের নিশ্চিত উপস্থিতি।`,
      confidence_status: 'LAB_SUPPORTED',
      evidence_source: 'lab_serum_hs_crp',
      source_type: 'biomarker_lab',
      clinician_verified: false,
      potential_nutrition_implication: 'Strict anti-inflammatory Mediterranean dietary framework.',
      recorded_at: now
    };
    domains.defense_repair.push(obsCrp);
    atm.mediators.push(obsCrp);
  }

  // 3. Energy Domain Observations
  if (symptoms.some(s => s.includes('fatigue') || s.includes('lethargy') || s.includes('tired')) || (input.gut_profile?.energy_score !== undefined && input.gut_profile.energy_score < 5)) {
    const obs: FunctionalObservation = {
      id: 'OBS_ENERGY_01',
      observation_id: 'OBS_ENERGY_01',
      patient_id: input.patient_id,
      domain: 'energy',
      clinical_domain: 'metabolic',
      observation_type: 'symptom',
      atm_type: 'mediator',
      title_en: 'Cellular ATP Insufficiency & Oxidative Vulnerability (Reported)',
      title_bn: 'কোষীয় এটিপি শক্তির ঘাটতি ও অবসাদ (রোগীর বক্তব্য)',
      description_en: 'Patient-reported fatigue and low stamina. Investigates potential mitochondrial phosphorylation or micronutrient cofactor deficit (CoQ10, B-complex, magnesium). Clinical hypothesis; not an automated mitochondrial disease diagnosis.',
      description_bn: 'মাইটোকন্ড্রিয়ায় শক্তি উৎপাদনের ঘাটতি এবং বি-কমপ্লেক্স বা ম্যাগনেসিয়ামের ঘাটতির ঝুঁকি পর্যবেক্ষণাধীন। এটি একটি ক্লিনিক্যাল হাইপোথিসিস।',
      confidence_status: 'PATIENT_REPORTED',
      evidence_source: 'symptom_report',
      source_type: 'intake_self_report',
      clinician_verified: false,
      potential_nutrition_implication: 'Mitochondrial cofactor support (B-complex, CoQ10, magnesium) and low glycemic fueling.',
      recorded_at: now
    };
    domains.energy.push(obs);
    atm.mediators.push(obs);
  }

  // 3b. Assessment Questionnaire Evidence — Energy Domain
  if (isAffirmative(answers.morning_fatigue_level)) {
    const obsFatigue: FunctionalObservation = {
      id: 'OBS_ENERGY_FATIGUE_Q',
      observation_id: 'OBS_ENERGY_FATIGUE_Q',
      patient_id: input.patient_id,
      domain: 'energy',
      clinical_domain: 'mitochondrial_energy',
      observation_type: 'symptom',
      atm_type: 'mediator',
      title_en: 'Morning Fatigue & Unrefreshed Awakening (Patient-Reported)',
      title_bn: 'সকালের অবসাদ ও ক্লান্তি (রোগীর বক্তব্য)',
      description_en: `Patient documents unrefreshed morning fatigue level (${answers.morning_fatigue_level}). Investigates cellular energy efficiency and micronutrient cofactors; clinical hypothesis, not an automated mitochondrial disease diagnosis.`,
      description_bn: `সকালে ঘুম থেকে উঠেও ক্লান্তি অনুভব। মাইটোকন্ড্রিয়াল পুষ্টি ও ঘুমের গুণগত মান পর্যালোচনার হাইপোথিসিস।`,
      confidence_status: 'PATIENT_REPORTED',
      evidence_source: 'assessment_morning_fatigue_level',
      source_type: 'intake_self_report',
      clinician_verified: false,
      potential_nutrition_implication: 'Assess magnesium and B-complex intake; ensure adequate daytime hydration.',
      recorded_at: now
    };
    domains.energy.push(obsFatigue);
    atm.mediators.push(obsFatigue);
  }

  // 4. Biotransformation Domain Observations
  if (pathways.includes('renal_electrolyte') || meds.length >= 4) {
    const obs: FunctionalObservation = {
      id: 'OBS_BIOTRANS_01',
      observation_id: 'OBS_BIOTRANS_01',
      patient_id: input.patient_id,
      domain: 'biotransformation',
      clinical_domain: 'renal_fluid',
      observation_type: 'medication_impact',
      atm_type: 'trigger',
      title_en: 'Polypharmacy Hepatorenal Biotransformation Burden',
      title_bn: 'বহুবিধ ওষুধের কারণে যকৃত ও বৃক্কের বিপাকীয় চাপ',
      description_en: 'Multiple xenobiotic exposures increasing Phase I/II detoxification demand and renal clearance strain. Requires clinical monitoring rather than assumed hepatic/renal failure.',
      description_bn: 'একাধিক ওষুধের যুগপৎ সেবন অথবা যকৃতের সমস্যার কারণে লিভার ও কিডনির বিষমুক্তকরণ প্রক্রিয়ায় অতিরিক্ত চাপ।',
      confidence_status: 'OBSERVED',
      evidence_source: 'medication_exposure_count',
      source_type: 'clinical_history',
      clinician_verified: false,
      potential_nutrition_implication: 'Glutathione support (cruciferous sulforaphane, allium sulfur compounds) and adequate hydration.',
      recorded_at: now
    };
    domains.biotransformation.push(obs);
    atm.triggers.push(obs);
  }

  // 4b. Assessment Questionnaire Evidence — Biotransformation Domain
  if (isAffirmative(answers.regular_ppi_antacid_use)) {
    const obsPpi: FunctionalObservation = {
      id: 'OBS_BIOTRANS_PPI',
      observation_id: 'OBS_BIOTRANS_PPI',
      patient_id: input.patient_id,
      domain: 'biotransformation',
      clinical_domain: 'hepatic_biotransformation',
      observation_type: 'medication_impact',
      atm_type: 'trigger',
      title_en: 'Chronic Proton Pump Inhibitor / Antacid Exposure',
      title_bn: 'নিয়মিত অ্যান্টাসিড বা পিপিআই সেবনের ইতিহাস',
      description_en: `Patient documents regular PPI/antacid use (${answers.regular_ppi_antacid_use}). Prolonged gastric hypochlorhydria impairs vitamin B12, iron, and magnesium absorption and alters hepatic clearance.`,
      description_bn: `নিয়মিত অ্যান্টাসিড সেবনের কারণে পাকস্থলীর স্বাভাবিক এসিড নিঃসরণ বাধাগ্রস্ত ও পুষ্টি শোষণ বিঘ্নিত হওয়ার ঝুঁকি।`,
      confidence_status: 'PATIENT_REPORTED',
      evidence_source: 'assessment_regular_ppi_antacid_use',
      source_type: 'intake_self_report',
      clinician_verified: false,
      potential_nutrition_implication: 'Monitor B12 and magnesium status; counsel gradual weaning under physician direction.',
      recorded_at: now
    };
    domains.biotransformation.push(obsPpi);
    atm.triggers.push(obsPpi);
  }

  // 4c. Lab Evidence — Biotransformation Domain
  const altVal = parseLabNum(labs.alt);
  const astVal = parseLabNum(labs.ast);
  if ((altVal !== null && altVal > 40) || (astVal !== null && astVal > 40)) {
    const obsLiverLab: FunctionalObservation = {
      id: 'OBS_BIOTRANS_LIVER_LAB',
      observation_id: 'OBS_BIOTRANS_LIVER_LAB',
      patient_id: input.patient_id,
      domain: 'biotransformation',
      clinical_domain: 'hepatic_biotransformation',
      observation_type: 'biomarker',
      atm_type: 'mediator',
      title_en: `Elevated Hepatic Transaminases (ALT ${altVal || '—'}, AST ${astVal || '—'} U/L)`,
      title_bn: `যকৃতের এনজাইম বৃদ্ধি (এসজিপিটি/এসজিওটি)`,
      description_en: `Objective liver transaminase elevation indicating hepatic parenchymal stress and altered phase I/II biotransformation.`,
      description_bn: `রক্তে লিভারের এনজাইম বৃদ্ধির প্রমাণ।`,
      confidence_status: 'LAB_SUPPORTED',
      evidence_source: 'lab_hepatic_panel',
      source_type: 'biomarker_lab',
      clinician_verified: false,
      potential_nutrition_implication: 'Hepatoprotective nutrition: avoid added sugars/fructose, support hepatic glutathione with cruciferous vegetables.',
      recorded_at: now
    };
    domains.biotransformation.push(obsLiverLab);
    atm.mediators.push(obsLiverLab);
  }

  // 5. Transport Domain Observations
  if (pathways.includes('cardiovascular')) {
    const obs: FunctionalObservation = {
      id: 'OBS_TRANSPORT_01',
      observation_id: 'OBS_TRANSPORT_01',
      patient_id: input.patient_id,
      domain: 'transport',
      clinical_domain: 'cardiovascular',
      observation_type: 'pathway_context',
      atm_type: 'mediator',
      title_en: 'Endothelial Shear Stress & Microvascular Impairment (Plausible Hypothesis)',
      title_bn: 'রক্তনালীর অন্তর্বর্তী প্রাচীরের চাপ ও রক্তপ্রবাহের বাধা (সম্ভাব্য হাইপোথিসিস)',
      description_en: 'Cardiovascular risk context suggests potential arterial stiffness or lipid transit alterations. Requires objective blood pressure and lipid monitoring.',
      description_bn: 'উচ্চ রক্তচাপ বা চর্বির অসামঞ্জস্যের কারণে রক্তনালীর স্থিতিস্থাপকতা হ্রাস এবং সংবহনে বিঘ্নের ক্লিনিক্যাল হাইপোথিসিস।',
      confidence_status: 'PLAUSIBLE_HYPOTHESIS',
      evidence_source: 'cardiovascular_pathway_context',
      source_type: 'clinical_history',
      clinician_verified: false,
      potential_nutrition_implication: 'High-polyphenol plant foods, beetroot dietary nitrates for nitric oxide production, and DASH sodium moderation.',
      recorded_at: now
    };
    domains.transport.push(obs);
    atm.mediators.push(obs);
  }

  // 5b. Assessment Questionnaire Evidence — Transport Domain
  if (isAffirmative(answers.blood_pressure_history)) {
    const obsBp: FunctionalObservation = {
      id: 'OBS_TRANSPORT_BP',
      observation_id: 'OBS_TRANSPORT_BP',
      patient_id: input.patient_id,
      domain: 'transport',
      clinical_domain: 'cardiovascular',
      observation_type: 'symptom',
      atm_type: 'mediator',
      title_en: 'Elevated Systemic Blood Pressure / Hypertension History (Reported)',
      title_bn: 'উচ্চ রক্তচাপের ইতিহাস (রোগীর বক্তব্য)',
      description_en: `Patient documents personal history of elevated blood pressure (${answers.blood_pressure_history}).`,
      description_bn: `উচ্চ রক্তচাপের পারিবারিক বা ব্যক্তিগত ইতিহাস।`,
      confidence_status: 'PATIENT_REPORTED',
      evidence_source: 'assessment_blood_pressure_history',
      source_type: 'intake_self_report',
      clinician_verified: false,
      potential_nutrition_implication: 'DASH dietary pattern, sodium moderation (1500-2000 mg/day), and potassium-rich whole foods if renal function cleared.',
      recorded_at: now
    };
    domains.transport.push(obsBp);
    atm.mediators.push(obsBp);
  }

  // 6. Communication Domain Observations
  if (pathways.includes('metabolic_endocrine') || pathways.includes('mental_health_neuropsychiatric')) {
    const obs: FunctionalObservation = {
      id: 'OBS_COMM_01',
      observation_id: 'OBS_COMM_01',
      patient_id: input.patient_id,
      domain: 'communication',
      clinical_domain: 'metabolic',
      observation_type: 'pathway_context',
      atm_type: 'mediator',
      title_en: 'Dysregulated Endocrine & Neuro-Metabolic Signaling (Plausible Hypothesis)',
      title_bn: 'হরমোনীয় এবং বিপাকীয় বার্তা প্রেরণের ভারসাম্যহীনতা (সম্ভাব্য হাইপোথিসিস)',
      description_en: 'Endocrine or neuro-metabolic pathway context suggests potential peripheral insulin resistance or neurochemical dysregulation. Fasting insulin/HOMA-IR or clinical assessment required to confirm. Never infer neurotransmitter deficit solely from psychiatric diagnosis.',
      description_bn: 'ইনসুলিন রেজিস্ট্যান্স, অগ্ন্যাশয়ের হরমোনীয় অসামঞ্জস্য বা থাইরয়েডের ভারসাম্যে বিচ্যুতির হাইপোথিসিস।',
      confidence_status: 'PLAUSIBLE_HYPOTHESIS',
      evidence_source: 'metabolic_endocrine_pathway_context',
      source_type: 'clinical_history',
      clinician_verified: false,
      potential_nutrition_implication: 'Carbohydrate distribution across eating occasions, chromium and magnesium-rich whole grains.',
      recorded_at: now
    };
    domains.communication.push(obs);
    atm.mediators.push(obs);
  }

  // 6b. Circadian and Sleep Rhythm Evidence
  if (input.sleep_data?.shift_worker || (input.sleep_data?.sleep_hours !== undefined && input.sleep_data.sleep_hours < 6)) {
    const obsSleep: FunctionalObservation = {
      id: 'OBS_COMM_CIRCADIAN',
      observation_id: 'OBS_COMM_CIRCADIAN',
      patient_id: input.patient_id,
      domain: 'communication',
      clinical_domain: 'neurocognitive_sleep',
      observation_type: 'lifestyle',
      atm_type: 'trigger',
      title_en: 'Circadian Desynchrony & Sleep Debt Signaling',
      title_bn: 'সার্কাডিয়ান ছন্দের ব্যাঘাত ও ঘুমের অপর্যাপ্ততা',
      description_en: `Patient documents ${input.sleep_data.shift_worker ? 'shift work' : `${input.sleep_data.sleep_hours}h sleep`}. Circadian misalignment alters peripheral clock gene expression in pancreas and liver, impairing insulin sensitivity.`,
      description_bn: `অনিয়মিত ঘুম বা নাইট শিফটের কারণে পরিপাক ও ইনসুলিনের জৈবিক ঘড়ি ক্ষতিগ্রস্ত হতে পারে।`,
      confidence_status: 'PATIENT_REPORTED',
      evidence_source: 'sleep_assessment_intake',
      source_type: 'intake_self_report',
      clinician_verified: false,
      potential_nutrition_implication: 'Align eating window with daylight hours; avoid high-glycemic carbohydrates within 3 hours of sleep.',
      recorded_at: now
    };
    domains.communication.push(obsSleep);
    atm.triggers.push(obsSleep);
  }

  // 6c. Assessment Questionnaire Evidence — Communication Domain
  if (isAffirmative(answers.sugar_carbohydrate_cravings)) {
    const obsCravings: FunctionalObservation = {
      id: 'OBS_COMM_CRAVINGS',
      observation_id: 'OBS_COMM_CRAVINGS',
      patient_id: input.patient_id,
      domain: 'communication',
      clinical_domain: 'metabolic',
      observation_type: 'symptom',
      atm_type: 'mediator',
      title_en: 'Postprandial Glycemic Volatility & Sugar Cravings',
      title_bn: 'খাবারের পর শর্করার অসামঞ্জস্য ও মিষ্টির তীব্র আকাঙ্ক্ষা',
      description_en: `Patient documents intense carbohydrate/sugar cravings (${answers.sugar_carbohydrate_cravings}), indicating reactive glycemic excursions or dopaminergic reward signaling.`,
      description_bn: `মিষ্টির প্রতি অস্বাভাবিক আকর্ষণ ও ইনসুলিন সংকেতের অস্থিতিশীলতা।`,
      confidence_status: 'PATIENT_REPORTED',
      evidence_source: 'assessment_sugar_cravings',
      source_type: 'intake_self_report',
      clinician_verified: false,
      potential_nutrition_implication: 'Protein-fiber-fat anchored meals to blunt postprandial glucose surges; cinnamon and chromium support.',
      recorded_at: now
    };
    domains.communication.push(obsCravings);
    atm.mediators.push(obsCravings);
  }

  // 6d. Lab Evidence — Communication Domain
  const hba1cVal = parseLabNum(labs.hba1c);
  const fbgVal = parseLabNum(labs.fasting_blood_glucose);
  if ((hba1cVal !== null && hba1cVal >= 5.7) || (fbgVal !== null && fbgVal > 100)) {
    const obsGlycemicLab: FunctionalObservation = {
      id: 'OBS_COMM_GLYCEMIC_LAB',
      observation_id: 'OBS_COMM_GLYCEMIC_LAB',
      patient_id: input.patient_id,
      domain: 'communication',
      clinical_domain: 'metabolic',
      observation_type: 'biomarker',
      atm_type: 'mediator',
      title_en: `Elevated Glycemic Biomarker (HbA1c ${hba1cVal || '—'}% / FBG ${fbgVal || '—'} mg/dL)`,
      title_bn: `রক্তে শর্করার আধিক্য (এইচবিএ১সি ${hba1cVal || '—'}%)`,
      description_en: `Objective glycemic biomarker confirms peripheral insulin signaling impairment and systemic glycation.`,
      description_bn: `রক্তে শর্করার বৃদ্ধি ও ইনসুলিন রেজিস্ট্যান্সের ক্লিনিক্যাল প্রমাণ।`,
      confidence_status: 'LAB_SUPPORTED',
      evidence_source: 'lab_glycemic_panel',
      source_type: 'biomarker_lab',
      clinician_verified: false,
      potential_nutrition_implication: 'Low glycemic load meal planning, consistent carbohydrate distribution, and resistance exercise stimulus.',
      recorded_at: now
    };
    domains.communication.push(obsGlycemicLab);
    atm.mediators.push(obsGlycemicLab);
  }

  // 7. Structural Integrity Observations
  if (pathways.includes('musculoskeletal_bone') || pathways.includes('underweight_malnutrition')) {
    const obs: FunctionalObservation = {
      id: 'OBS_STRUCT_01',
      observation_id: 'OBS_STRUCT_01',
      patient_id: input.patient_id,
      domain: 'structural_integrity',
      clinical_domain: 'musculoskeletal',
      observation_type: 'pathway_context',
      atm_type: 'mediator',
      title_en: 'Musculoskeletal Demineralization & Sarcopenic Risk (Plausible Hypothesis)',
      title_bn: 'পেশীর ক্ষয় ও অস্থির খনিজ ঘনত্বের ঘাটতির ঝুঁকি (সম্ভাব্য হাইপোথিসিস)',
      description_en: 'Clinical pathway context indicates risk of reduced skeletal muscle mass or compromised bone mineral density. DEXA scan or handgrip dynamometry recommended for diagnostic confirmation.',
      description_bn: 'পেশীর শক্তি হ্রাস বা হাড়ের দুর্বলতার সম্ভাব্য ঝুঁকি, যার জন্য সুনির্দিষ্ট ক্লিনিক্যাল মূল্যায়ন প্রয়োজন।',
      confidence_status: 'PLAUSIBLE_HYPOTHESIS',
      evidence_source: 'musculoskeletal_bone_pathway_context',
      source_type: 'clinical_history',
      clinician_verified: false,
      potential_nutrition_implication: 'Adequate dietary calcium, vitamin D3, and leucine-rich protein distribution.',
      recorded_at: now
    };
    domains.structural_integrity.push(obs);
    atm.mediators.push(obs);
  }

  // 7b. Anthropometrics (BMI < 18.5)
  if (input.anthropometrics?.bmi !== undefined && input.anthropometrics.bmi > 0 && input.anthropometrics.bmi < 18.5) {
    const obsBMI: FunctionalObservation = {
      id: 'OBS_STRUCT_LEAN',
      observation_id: 'OBS_STRUCT_LEAN',
      patient_id: input.patient_id,
      domain: 'structural_integrity',
      clinical_domain: 'anthropometrics',
      observation_type: 'anthropometric',
      atm_type: 'mediator',
      title_en: `Anthropometric Underweight Risk (BMI ${input.anthropometrics.bmi.toFixed(1)} kg/m²)`,
      title_bn: `শারীরিক ওজনের ঘাটতি (বিএমআই ${input.anthropometrics.bmi.toFixed(1)} কেজি/মি²)`,
      description_en: `Calculated BMI < 18.5 kg/m² indicating potential lean tissue depletion. Requires clinician assessment for secondary malnutrition etiology.`,
      description_bn: `কম ওজনের কারণে পেশী ও শক্তির ঘাটতির ঝুঁকি। চিকিৎসকের মূল্যায়ন আবশ্যক।`,
      confidence_status: 'OBSERVED',
      evidence_source: 'anthropometric_calculation',
      source_type: 'clinical_history',
      clinician_verified: false,
      potential_nutrition_implication: 'Caloric surplus with 1.2-1.5 g/kg protein and nutrient-dense healthy fats.',
      recorded_at: now
    };
    domains.structural_integrity.push(obsBMI);
    atm.mediators.push(obsBMI);
  }

  // 7c. Assessment Questionnaire Evidence — Structural Integrity Domain
  if (isAffirmative(answers.unintentional_weight_loss)) {
    const obsWeightLoss: FunctionalObservation = {
      id: 'OBS_STRUCT_WEIGHT_LOSS',
      observation_id: 'OBS_STRUCT_WEIGHT_LOSS',
      patient_id: input.patient_id,
      domain: 'structural_integrity',
      clinical_domain: 'anthropometrics',
      observation_type: 'symptom',
      atm_type: 'mediator',
      title_en: 'Unintentional Weight Loss & Lean Body Mass Depletion (Reported)',
      title_bn: 'অনিচ্ছাকৃত ওজন হ্রাস ও পেশীর ক্ষয় (রোগীর বক্তব্য)',
      description_en: `Patient documents unintentional weight loss. Investigates underlying catabolic state, malabsorption, or protein-energy malnutrition.`,
      description_bn: `চেষ্টা না করেই দ্রুত ওজন হ্রাসের ইতিহাস। পুষ্টিহীনতা বা শোষণের সমস্যার ঝুঁকি।`,
      confidence_status: 'PATIENT_REPORTED',
      evidence_source: 'assessment_unintentional_weight_loss',
      source_type: 'intake_self_report',
      clinician_verified: false,
      potential_nutrition_implication: 'Nutrient-dense caloric optimization with high-biological-value protein distribution.',
      recorded_at: now
    };
    domains.structural_integrity.push(obsWeightLoss);
    atm.mediators.push(obsWeightLoss);
  }

  // Antecedents from family history & questionnaire
  if (input.family_history && input.family_history.length > 0) {
    const antObs: FunctionalObservation = {
      id: 'OBS_ANTECEDENT_GENETIC',
      observation_id: 'OBS_ANTECEDENT_GENETIC',
      domain: 'communication',
      atm_type: 'antecedent',
      title_en: 'Familial & Polygenic Predisposition',
      title_bn: 'পারিবারিক ও জিনগত প্রবণতা',
      description_en: `Recorded positive family history: ${input.family_history.join(', ')}`,
      description_bn: `পারিবারিক রোগের ইতিহাস: ${input.family_history.join(', ')}`,
      confidence_status: 'PATIENT_REPORTED',
      evidence_source: 'family_history_intake',
      source_type: 'intake_self_report',
      clinician_verified: false,
      recorded_at: now
    };
    atm.antecedents.push(antObs);
  } else if (isAffirmative(answers.family_chronic_history)) {
    const antObsQ: FunctionalObservation = {
      id: 'OBS_ANTECEDENT_FAMILY_Q',
      observation_id: 'OBS_ANTECEDENT_FAMILY_Q',
      domain: 'communication',
      atm_type: 'antecedent',
      title_en: 'Familial Chronic Disease Predisposition (Reported)',
      title_bn: 'পারিবারিক দীর্ঘমেয়াদী রোগের ইতিহাস',
      description_en: `Patient reports family history of chronic illness: ${answers.family_chronic_history}`,
      description_bn: `পারিবারিক রোগের ইতিবৃত্ত।`,
      confidence_status: 'PATIENT_REPORTED',
      evidence_source: 'assessment_family_chronic_history',
      source_type: 'intake_self_report',
      clinician_verified: false,
      recorded_at: now
    };
    atm.antecedents.push(antObsQ);
  }

  let totalObs = 0;
  for (const dom of Object.values(domains)) {
    totalObs += dom.length;
  }

  return {
    domains,
    atm,
    total_observations: totalObs
  };
}

/**
 * Derives appropriate systems network node confidence from observations
 */
function deriveSystemNodeConfidence(observations: FunctionalObservation[]): 'verified_fact' | 'patient_reported' | 'hypothesis' | 'unconfirmed' {
  if (!observations || observations.length === 0) return 'unconfirmed';
  const hasVerified = observations.some(o => o.confidence_status === 'CLINICIAN_VERIFIED' || o.confidence_status === 'LAB_SUPPORTED');
  if (hasVerified) return 'verified_fact';
  const hasPatientReported = observations.some(o => o.confidence_status === 'PATIENT_REPORTED' || o.confidence_status === 'OBSERVED');
  if (hasPatientReported) return 'patient_reported';
  return 'hypothesis';
}

/**
 * Builds the deterministic Systems Network Graph
 */
export function buildSystemsNetworkGraph(
  matrixState: FunctionalMatrixState,
  pathwayIds: ExpandedClinicalPathwayId[],
  medications: R5MedicationRecord[]
): SystemsNetworkGraph {
  const nodes: SystemsNetworkNode[] = [];
  const edges: SystemsNetworkEdge[] = [];
  const now = new Date().toISOString();

  // 1. Create Core Functional System Nodes with Evidence-Gated Confidence
  for (const [domKey, meta] of Object.entries(FUNCTIONAL_DOMAINS_META)) {
    const domainKey = domKey as FunctionalMatrixDomain;
    const obsList = matrixState.domains[domainKey];

    nodes.push({
      id: `NODE_DOM_${domainKey}`,
      type: 'FunctionalSystem',
      label_en: meta.name_en,
      label_bn: meta.name_bn,
      functional_domains: [domainKey],
      confidence: deriveSystemNodeConfidence(obsList)
    });
  }

  const getNodeConfidence = (nodeId: string) => nodes.find(n => n.id === nodeId)?.confidence || 'unconfirmed';
  const checkEdgeUncertainty = (sourceId: string, targetId: string) => {
    const sc = getNodeConfidence(sourceId);
    const tc = getNodeConfidence(targetId);
    return sc === 'hypothesis' || sc === 'unconfirmed' || tc === 'hypothesis' || tc === 'unconfirmed';
  };

  // 2. Interconnected Directional Relationships (Cross-System Pathophysiology)
  if (pathwayIds.includes('gastrointestinal_hepatobiliary') || pathwayIds.includes('autoimmune_inflammatory')) {
    const sourceId = 'NODE_DOM_assimilation';
    const targetId = 'NODE_DOM_defense_repair';
    edges.push({
      id: 'EDGE_ASSIM_DEFENSE',
      source_node_id: sourceId,
      target_node_id: targetId,
      relationship: 'MAY_CONTRIBUTE_TO',
      clinical_relevance: 'high_priority',
      evidence_citation: 'Zonulin mucosal barrier translocation; Fasano A. Ann NY Acad Sci 2012',
      rationale_en: 'Intestinal permeability translocates microbial antigens stimulating systemic immune response',
      rationale_bn: 'অন্ত্রের ঝিল্লির ছিদ্র দিয়ে জীবাণু ও অ্যান্টিজেন রক্তে প্রবেশ করে সার্বিক প্রতিরোধ ব্যবস্থাকে উত্তেজিত করে',
      uncertainty_flag: checkEdgeUncertainty(sourceId, targetId),
      last_evaluated: now
    });
  }

  if (pathwayIds.includes('autoimmune_inflammatory') || pathwayIds.includes('metabolic_endocrine')) {
    const sourceId = 'NODE_DOM_defense_repair';
    const targetId = 'NODE_DOM_communication';
    edges.push({
      id: 'EDGE_DEFENSE_COMM',
      source_node_id: sourceId,
      target_node_id: targetId,
      relationship: 'MAY_MODIFY',
      clinical_relevance: 'high_priority',
      evidence_citation: 'TNF-alpha / IRS-1 serine phosphorylation; Hotamisligil GS. Nature 2006',
      rationale_en: 'Pro-inflammatory cytokines induce serine phosphorylation of IRS-1 impairing insulin signaling',
      rationale_bn: 'প্রদাহ সৃষ্টিকারী সাইটোকাইন ইনসুলিন রিসেপ্টরের স্বাভাবিক সংকেত গ্রহণে বাধা সৃষ্টি করে ইনসুলিন রেজিস্ট্যান্স বাড়ায়',
      uncertainty_flag: checkEdgeUncertainty(sourceId, targetId),
      last_evaluated: now
    });
  }

  if (pathwayIds.includes('metabolic_endocrine') || pathwayIds.includes('cardiovascular')) {
    const sourceId = 'NODE_DOM_communication';
    const targetId = 'NODE_DOM_transport';
    edges.push({
      id: 'EDGE_COMM_TRANSPORT',
      source_node_id: sourceId,
      target_node_id: targetId,
      relationship: 'MAY_CONTRIBUTE_TO',
      clinical_relevance: 'critical_safety',
      evidence_citation: 'eNOS uncoupling & advanced glycation; Brownlee M. Diabetes 2005',
      rationale_en: 'Hyperinsulinemia and AGEs promote arterial stiffness and endothelial nitric oxide synthase decoupling',
      rationale_bn: 'অতিরিক্ত ইনসুলিন ও রক্তে গ্লুকোজের বিষক্রিয়া রক্তনালী শক্ত করে এবং নাইট্রিক অক্সাইড উৎপাদন কমিয়ে রক্তচাপ বাড়ায়',
      uncertainty_flag: checkEdgeUncertainty(sourceId, targetId),
      last_evaluated: now
    });
  }

  // Medication Exposure node if polypharmacy
  if (medications.length >= 3) {
    const medNodeId = 'NODE_PHARMA_BURDEN';
    nodes.push({
      id: medNodeId,
      type: 'MedicationExposure',
      label_en: `Polypharmacy Burden (${medications.length} Meds)`,
      label_bn: `বহুবিধ ওষুধ সেবনের চাপ (${medications.length}টি ওষুধ)`,
      functional_domains: ['biotransformation'],
      confidence: 'verified_fact'
    });

    edges.push({
      id: 'EDGE_PHARMA_BIOTRANS',
      source_node_id: medNodeId,
      target_node_id: 'NODE_DOM_biotransformation',
      relationship: 'REQUIRES_REVIEW',
      clinical_relevance: 'high_priority',
      evidence_citation: 'CYP450 competitive substrate saturation; Wilkinson GR. NEJM 2005',
      rationale_en: 'Hepatic cytochrome P450 competition and glutathione depletion',
      rationale_bn: 'সাইটোক্রোম পি৪৫০ এনজাইমের প্রতিযোগিতা এবং গ্লুটাথিয়ন অ্যান্টিঅক্সিডেন্ট হ্রাস',
      uncertainty_flag: false,
      last_evaluated: now
    });
  }

  return {
    nodes,
    edges,
    evaluated_at: now,
    active_conflicts_count: edges.filter(e => e.relationship === 'CONFLICTS_WITH' || e.relationship === 'CONTRAINDICATES').length,
    unresolved_hypotheses_count: nodes.filter(n => n.confidence === 'hypothesis' || n.confidence === 'unconfirmed').length
  };
}
