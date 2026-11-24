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
  const now = new Date().toISOString();

  // 1. Assimilation Domain Observations
  if (pathways.includes('gastrointestinal_hepatobiliary') || symptoms.some(s => s.includes('bloat') || s.includes('reflux') || s.includes('constip') || s.includes('diarrhea'))) {
    const hasReportedSymptoms = symptoms.some(s => s.includes('bloat') || s.includes('reflux') || s.includes('constip') || s.includes('diarrhea'));
    const obs: FunctionalObservation = {
      id: 'OBS_ASSIM_01',
      domain: 'assimilation',
      atm_type: 'mediator',
      title_en: 'Gastrointestinal Barrier & Microbiota Disruption (Plausible Hypothesis)',
      title_bn: 'পরিপাকতন্ত্রের প্রাচীর ও মাইক্রোবায়োমের ভারসাম্যহীনতা (সম্ভাব্য হাইপোথিসিস)',
      description_en: 'Reported digestive symptoms or GI pathway context suggest potential barrier permeability and dysbiosis. Clinical verification required before confirming mucosal barrier pathology.',
      description_bn: 'পরিপাকজনিত লক্ষণ বা গ্যাস্ট্রোইনটেস্টাইনাল উপসর্গ অন্ত্রের প্রাচীরের প্রদাহ ও উপকারী জীবাণুর ভারসাম্যহীনতার ইঙ্গিত দেয়। নিশ্চিতকরণের জন্য ক্লিনিক্যাল নিরীক্ষা প্রয়োজন।',
      confidence_status: hasReportedSymptoms ? 'patient_reported' : 'plausible_hypothesis',
      evidence_source: hasReportedSymptoms ? 'patient_symptom_report' : 'gastrointestinal_hepatobiliary_pathway_context',
      source_type: hasReportedSymptoms ? 'intake_self_report' : 'clinical_history',
      clinician_verified: false,
      recorded_at: now
    };
    domains.assimilation.push(obs);
    atm.mediators.push(obs);
  }

  // 2. Defense and Repair Observations
  if (pathways.includes('autoimmune_inflammatory') || symptoms.some(s => s.includes('joint') || s.includes('inflamm'))) {
    const hasSymptoms = symptoms.some(s => s.includes('joint') || s.includes('inflamm'));
    const obs: FunctionalObservation = {
      id: 'OBS_DEFENSE_01',
      domain: 'defense_repair',
      atm_type: 'mediator',
      title_en: 'Systemic Immune Activation & Inflammatory Tone (Plausible Hypothesis)',
      title_bn: 'রোগপ্রতিরোধ সক্রিয়তা ও প্রদাহজনিত প্রতিক্রিয়া (সম্ভাব্য হাইপোথিসিস)',
      description_en: 'Immune/inflammatory pathway context suggests systemic inflammatory burden. Elevated hs-CRP/ESR lab confirmation required for clinical confirmation.',
      description_bn: 'ইমিউন বা অ্যালার্জিক প্রতিক্রিয়ার প্রেক্ষাপট প্রদাহ বৃদ্ধির ইঙ্গিত দেয়। রক্তে সিআরপি পরীক্ষার মাধ্যমে নিশ্চিতকরণ প্রয়োজন।',
      confidence_status: hasSymptoms ? 'patient_reported' : 'plausible_hypothesis',
      evidence_source: hasSymptoms ? 'reported_joint_inflammatory_symptoms' : 'autoimmune_inflammatory_pathway_context',
      source_type: hasSymptoms ? 'intake_self_report' : 'clinical_history',
      clinician_verified: false,
      recorded_at: now
    };
    domains.defense_repair.push(obs);
    atm.mediators.push(obs);
  }

  // 3. Energy Domain Observations
  if (symptoms.some(s => s.includes('fatigue') || s.includes('lethargy') || s.includes('tired'))) {
    const obs: FunctionalObservation = {
      id: 'OBS_ENERGY_01',
      domain: 'energy',
      atm_type: 'mediator',
      title_en: 'Cellular ATP Insufficiency & Oxidative Vulnerability (Reported)',
      title_bn: 'কোষীয় এটিপি শক্তির ঘাটতি ও অবসাদ (রোগীর বক্তব্য)',
      description_en: 'Patient-reported fatigue and low stamina. Investigates potential mitochondrial phosphorylation or micronutrient cofactor deficit (CoQ10, B-complex, magnesium).',
      description_bn: 'মাইটোকন্ড্রিয়ায় শক্তি উৎপাদনের ঘাটতি এবং বি-কমপ্লেক্স বা ম্যাগনেসিয়ামের ঘাটতির ঝুঁকি পর্যবেক্ষণাধীন।',
      confidence_status: 'patient_reported',
      evidence_source: 'symptom_report',
      source_type: 'intake_self_report',
      clinician_verified: false,
      recorded_at: now
    };
    domains.energy.push(obs);
    atm.mediators.push(obs);
  }

  // 4. Biotransformation Domain Observations
  if (pathways.includes('renal_electrolyte') || meds.length >= 4) {
    const obs: FunctionalObservation = {
      id: 'OBS_BIOTRANS_01',
      domain: 'biotransformation',
      atm_type: 'trigger',
      title_en: 'Polypharmacy Hepatorenal Biotransformation Burden',
      title_bn: 'বহুবিধ ওষুধের কারণে যকৃত ও বৃক্কের বিপাকীয় চাপ',
      description_en: 'Multiple xenobiotic exposures increasing Phase I/II detoxification demand and renal clearance strain. Requires clinical monitoring rather than assumed hepatic/renal failure.',
      description_bn: 'একাধিক ওষুধের যুগপৎ সেবন অথবা যকৃতের সমস্যার কারণে লিভার ও কিডনির বিষমুক্তকরণ প্রক্রিয়ায় অতিরিক্ত চাপ।',
      confidence_status: 'plausible_hypothesis',
      evidence_source: 'medication_exposure_count',
      source_type: 'clinical_history',
      clinician_verified: false,
      recorded_at: now
    };
    domains.biotransformation.push(obs);
    atm.triggers.push(obs);
  }

  // 5. Transport Domain Observations
  if (pathways.includes('cardiovascular')) {
    const obs: FunctionalObservation = {
      id: 'OBS_TRANSPORT_01',
      domain: 'transport',
      atm_type: 'mediator',
      title_en: 'Endothelial Shear Stress & Microvascular Impairment (Plausible Hypothesis)',
      title_bn: 'রক্তনালীর অন্তর্বর্তী প্রাচীরের চাপ ও রক্তপ্রবাহের বাধা (সম্ভাব্য হাইপোথিসিস)',
      description_en: 'Cardiovascular risk context suggests potential arterial stiffness or lipid transit alterations. Requires objective blood pressure and lipid monitoring.',
      description_bn: 'উচ্চ রক্তচাপ বা চর্বির অসামঞ্জস্যের কারণে রক্তনালীর স্থিতিস্থাপকতা হ্রাস এবং সংবহনে বিঘ্নের ক্লিনিক্যাল হাইপোথিসিস।',
      confidence_status: 'plausible_hypothesis',
      evidence_source: 'cardiovascular_pathway_context',
      source_type: 'clinical_history',
      clinician_verified: false,
      recorded_at: now
    };
    domains.transport.push(obs);
    atm.mediators.push(obs);
  }

  // 6. Communication Domain Observations
  if (pathways.includes('metabolic_endocrine') || pathways.includes('mental_health_neuropsychiatric')) {
    const obs: FunctionalObservation = {
      id: 'OBS_COMM_01',
      domain: 'communication',
      atm_type: 'mediator',
      title_en: 'Dysregulated Endocrine & Neuro-Metabolic Signaling (Plausible Hypothesis)',
      title_bn: 'হরমোনীয় এবং বিপাকীয় বার্তা প্রেরণের ভারসাম্যহীনতা (সম্ভাব্য হাইপোথিসিস)',
      description_en: 'Endocrine or neuro-metabolic pathway context suggests potential peripheral insulin resistance or neurochemical dysregulation. Fasting insulin/HOMA-IR or clinical assessment required to confirm.',
      description_bn: 'ইনসুলিন রেজিস্ট্যান্স, অগ্ন্যাশয়ের হরমোনীয় অসামঞ্জস্য বা থাইরয়েডের ভারসাম্যে বিচ্যুতির হাইপোথিসিস।',
      confidence_status: 'plausible_hypothesis',
      evidence_source: 'metabolic_endocrine_pathway_context',
      source_type: 'clinical_history',
      clinician_verified: false,
      recorded_at: now
    };
    domains.communication.push(obs);
    atm.mediators.push(obs);
  }

  // 7. Structural Integrity Observations
  if (pathways.includes('musculoskeletal_bone') || pathways.includes('underweight_malnutrition')) {
    const obs: FunctionalObservation = {
      id: 'OBS_STRUCT_01',
      domain: 'structural_integrity',
      atm_type: 'mediator',
      title_en: 'Musculoskeletal Demineralization & Sarcopenic Risk (Plausible Hypothesis)',
      title_bn: 'পেশীর ক্ষয় ও অস্থির খনিজ ঘনত্বের ঘাটতির ঝুঁকি (সম্ভাব্য হাইপোথিসিস)',
      description_en: 'Clinical pathway context indicates risk of reduced skeletal muscle mass or compromised bone mineral density. DEXA scan or handgrip dynamometry recommended for diagnostic confirmation.',
      description_bn: 'পেশীর শক্তি হ্রাস বা হাড়ের দুর্বলতার সম্ভাব্য ঝুঁকি, যার জন্য সুনির্দিষ্ট ক্লিনিক্যাল মূল্যায়ন প্রয়োজন।',
      confidence_status: 'plausible_hypothesis',
      evidence_source: 'musculoskeletal_bone_pathway_context',
      source_type: 'clinical_history',
      clinician_verified: false,
      recorded_at: now
    };
    domains.structural_integrity.push(obs);
    atm.mediators.push(obs);
  }

  // Antecedents from family history
  if (input.family_history && input.family_history.length > 0) {
    const antObs: FunctionalObservation = {
      id: 'OBS_ANTECEDENT_GENETIC',
      domain: 'communication',
      atm_type: 'antecedent',
      title_en: 'Familial & Polygenic Predisposition',
      title_bn: 'পারিবারিক ও জিনগত প্রবণতা',
      description_en: `Recorded positive family history: ${input.family_history.join(', ')}`,
      description_bn: `পারিবারিক রোগের ইতিহাস: ${input.family_history.join(', ')}`,
      confidence_status: 'patient_reported',
      evidence_source: 'family_history_intake',
      source_type: 'intake_self_report',
      clinician_verified: false,
      recorded_at: now
    };
    atm.antecedents.push(antObs);
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

  // 1. Create Core Functional System Nodes
  for (const [domKey, meta] of Object.entries(FUNCTIONAL_DOMAINS_META)) {
    const domainKey = domKey as FunctionalMatrixDomain;
    const obsList = matrixState.domains[domainKey];

    nodes.push({
      id: `NODE_DOM_${domainKey}`,
      type: 'FunctionalSystem',
      label_en: meta.name_en,
      label_bn: meta.name_bn,
      functional_domains: [domainKey],
      confidence: obsList.length > 0 ? 'verified_fact' : 'unconfirmed'
    });
  }

  // 2. Interconnected Directional Relationships (Cross-System Pathophysiology)
  if (pathwayIds.includes('gastrointestinal_hepatobiliary') || pathwayIds.includes('autoimmune_inflammatory')) {
    edges.push({
      id: 'EDGE_ASSIM_DEFENSE',
      source_node_id: 'NODE_DOM_assimilation',
      target_node_id: 'NODE_DOM_defense_repair',
      relationship: 'MAY_CONTRIBUTE_TO',
      clinical_relevance: 'high_priority',
      evidence_citation: 'Zonulin mucosal barrier translocation; Fasano A. Ann NY Acad Sci 2012',
      rationale_en: 'Intestinal permeability translocates microbial antigens stimulating systemic immune response',
      rationale_bn: 'অন্ত্রের ঝিল্লির ছিদ্র দিয়ে জীবাণু ও অ্যান্টিজেন রক্তে প্রবেশ করে সার্বিক প্রতিরোধ ব্যবস্থাকে উত্তেজিত করে',
      uncertainty_flag: false,
      last_evaluated: now
    });
  }

  if (pathwayIds.includes('autoimmune_inflammatory') || pathwayIds.includes('metabolic_endocrine')) {
    edges.push({
      id: 'EDGE_DEFENSE_COMM',
      source_node_id: 'NODE_DOM_defense_repair',
      target_node_id: 'NODE_DOM_communication',
      relationship: 'MAY_MODIFY',
      clinical_relevance: 'high_priority',
      evidence_citation: 'TNF-alpha / IRS-1 serine phosphorylation; Hotamisligil GS. Nature 2006',
      rationale_en: 'Pro-inflammatory cytokines induce serine phosphorylation of IRS-1 impairing insulin signaling',
      rationale_bn: 'প্রদাহ সৃষ্টিকারী সাইটোকাইন ইনসুলিন রিসেপ্টরের স্বাভাবিক সংকেত গ্রহণে বাধা সৃষ্টি করে ইনসুলিন রেজিস্ট্যান্স বাড়ায়',
      uncertainty_flag: false,
      last_evaluated: now
    });
  }

  if (pathwayIds.includes('metabolic_endocrine') || pathwayIds.includes('cardiovascular')) {
    edges.push({
      id: 'EDGE_COMM_TRANSPORT',
      source_node_id: 'NODE_DOM_communication',
      target_node_id: 'NODE_DOM_transport',
      relationship: 'MAY_CONTRIBUTE_TO',
      clinical_relevance: 'critical_safety',
      evidence_citation: 'eNOS uncoupling & advanced glycation; Brownlee M. Diabetes 2005',
      rationale_en: 'Hyperinsulinemia and AGEs promote arterial stiffness and endothelial nitric oxide synthase decoupling',
      rationale_bn: 'অতিরিক্ত ইনসুলিন ও রক্তে গ্লুকোজের বিষক্রিয়া রক্তনালী শক্ত করে এবং নাইট্রিক অক্সাইড উৎপাদন কমিয়ে রক্তচাপ বাড়ায়',
      uncertainty_flag: false,
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
