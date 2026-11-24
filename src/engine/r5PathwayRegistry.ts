/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Phase R5: Clinical Pathway Registry & Search Service
 * 
 * Defines 16+ comprehensive clinical pathway domains across 5 biological categories:
 * - Metabolic & Endocrine
 * - Gastrointestinal & Hepatobiliary
 * - Cardiovascular
 * - Renal & Electrolyte
 * - Oncology
 * - Underweight & Malnutrition
 * - Surgical & Postoperative
 * - Critical Care & Specialized Feeding
 * - Mental Health & Neuropsychiatric (pathway, NOT life stage!)
 * - Neurological & Neurodevelopmental
 * - Autoimmune & Inflammatory
 * - Reproductive & Hormonal
 * - Musculoskeletal & Bone
 * - Dermatological & Skin
 * - Feeding / Swallowing / Rehabilitation
 * - Other Multimorbidity
 */

import { 
  ExpandedClinicalPathwayId, 
  ClinicalPathwayMetadata, 
  PatientPathwayState, 
  PathwaySelectionState 
} from '@/types/r5Systems';
import { ClinicalPathway } from '@/types/clinical';

export const LEGACY_TO_EXPANDED_PATHWAY_MAP: Record<ClinicalPathway, ExpandedClinicalPathwayId> = {
  metabolic: 'metabolic_endocrine',
  underweight_restoration: 'underweight_malnutrition',
  cardiovascular: 'cardiovascular',
  renal: 'renal_electrolyte',
  oncology: 'oncology',
  gastrointestinal_hepatic: 'gastrointestinal_hepatobiliary',
  surgical_postoperative: 'surgical_postoperative',
  critical_care_specialized_support: 'critical_care_specialized_feeding',
  other_multimorbidity: 'other_multimorbidity'
};

export const EXPANDED_TO_LEGACY_PATHWAY_MAP: Record<ExpandedClinicalPathwayId, ClinicalPathway> = {
  metabolic_endocrine: 'metabolic',
  underweight_malnutrition: 'underweight_restoration',
  cardiovascular: 'cardiovascular',
  renal_electrolyte: 'renal',
  oncology: 'oncology',
  gastrointestinal_hepatobiliary: 'gastrointestinal_hepatic',
  surgical_postoperative: 'surgical_postoperative',
  critical_care_specialized_feeding: 'critical_care_specialized_support',
  other_multimorbidity: 'other_multimorbidity',
  mental_health_neuropsychiatric: 'other_multimorbidity',
  neurological_neurodevelopmental: 'other_multimorbidity',
  autoimmune_inflammatory: 'other_multimorbidity',
  reproductive_hormonal: 'other_multimorbidity',
  musculoskeletal_bone: 'other_multimorbidity',
  dermatological_skin: 'other_multimorbidity',
  feeding_swallowing_rehabilitation: 'critical_care_specialized_support'
};

export function mapLegacyPathwaysToExpanded(
  pathways: (ClinicalPathway | ExpandedClinicalPathwayId | string)[]
): ExpandedClinicalPathwayId[] {
  const result = new Set<ExpandedClinicalPathwayId>();
  pathways.forEach(p => {
    if (p in EXPANDED_TO_LEGACY_PATHWAY_MAP) {
      result.add(p as ExpandedClinicalPathwayId);
    } else if (p in LEGACY_TO_EXPANDED_PATHWAY_MAP) {
      result.add(LEGACY_TO_EXPANDED_PATHWAY_MAP[p as ClinicalPathway]);
    }
  });
  return Array.from(result);
}

export function mapExpandedPathwaysToLegacy(
  pathways: (ExpandedClinicalPathwayId | ClinicalPathway | string)[]
): ClinicalPathway[] {
  const result = new Set<ClinicalPathway>();
  pathways.forEach(p => {
    if (p in EXPANDED_TO_LEGACY_PATHWAY_MAP) {
      result.add(EXPANDED_TO_LEGACY_PATHWAY_MAP[p as ExpandedClinicalPathwayId]);
    } else if (p in LEGACY_TO_EXPANDED_PATHWAY_MAP) {
      result.add(p as ClinicalPathway);
    } else {
      result.add('other_multimorbidity');
    }
  });
  return Array.from(result);
}

export const CLINICAL_PATHWAY_REGISTRY: ClinicalPathwayMetadata[] = [
  // ── Category 1: Metabolic & Organ Systems ─────────────────────────
  {
    id: 'metabolic_endocrine',
    category: 'Metabolic & Organ Systems',
    title_en: 'Metabolic & Endocrine Pathway',
    title_bn: 'মেটাবলিক ও এন্ডোক্রাইন পথ',
    description_en: 'Type 1/2 Diabetes, Insulin Resistance, Metabolic Syndrome, Thyroid dysfunction, PCOS',
    description_bn: 'ডায়াবেটিস, ইনসুলিন রেজিস্ট্যান্স, থাইরয়েড সমস্যা ও হরমোনজনিত ভারসাম্যহীনতা',
    icon_name: 'Activity',
    relevant_conditions_map: ['t2d_ir', 'hypothyroid', 'hyperthyroid', 'pcos_insulin_resistance', 'metabolic_syndrome']
  },
  {
    id: 'gastrointestinal_hepatobiliary',
    category: 'Metabolic & Organ Systems',
    title_en: 'Gastrointestinal & Hepatobiliary Pathway',
    title_bn: 'পরিপাকতন্ত্র ও লিভার-পিত্তথলি পথ',
    description_en: 'GERD, SIBO, IBD (Crohn’s/Colitis), IBS, Fatty Liver (NAFLD/NASH), Gallbladder disease',
    description_bn: 'অ্যাসিড রিফ্লাক্স, ফ্যাটি লিভার, আইবিএস, আইবিডি ও পরিপাকতন্ত্রের প্রদাহ',
    icon_name: 'Stomach',
    relevant_conditions_map: ['gerd_reflux_esophagitis', 'ibs_diarrhea', 'ibs_constipation', 'fatty_liver', 'ibd_crohns_colitis', 'celiac_sprue']
  },
  {
    id: 'cardiovascular',
    category: 'Metabolic & Organ Systems',
    title_en: 'Cardiovascular Pathway',
    title_bn: 'কার্ডিওভাসকুলার (হৃদরোগ) পথ',
    description_en: 'Essential Hypertension, Dyslipidemia, Atherosclerosis, Coronary Artery Disease, Heart Failure',
    description_bn: 'উচ্চ রক্তচাপ, কোলেস্টেরল আধিক্য, করোনারি আর্টারি ডিজিজ ও হৃদপিণ্ডের দুর্বলতা',
    icon_name: 'Heart',
    relevant_conditions_map: ['hypertension_ckd', 'dyslipidemia', 'coronary_artery_disease', 'heart_failure']
  },
  {
    id: 'renal_electrolyte',
    category: 'Metabolic & Organ Systems',
    title_en: 'Renal & Electrolyte Pathway',
    title_bn: 'কিডনি ও ইলেক্ট্রোলাইট পথ',
    description_en: 'Chronic Kidney Disease (Stages 1-5), Hemodialysis, Proteinuria, Nephrotic Syndrome, Hyperkalemia',
    description_bn: 'ক্রনিক কিডনি ডিজিজ (সিকেডি), ডায়ালাইসিস, প্রোটিন ক্ষয় ও ইলেক্ট্রোলাইট ভারসাম্য',
    icon_name: 'ShieldCheck',
    relevant_conditions_map: ['ckd_predialysis', 'ckd_dialysis', 'nephrotic_syndrome', 'uric_acid_gout']
  },

  // ── Category 2: Neuropsychiatric & Brain ──────────────────────────
  {
    id: 'mental_health_neuropsychiatric',
    category: 'Neuropsychiatric & Brain',
    title_en: 'Mental Health & Neuropsychiatric Pathway',
    title_bn: 'মানসিক স্বাস্থ্য ও নিউরোসাইকিয়াট্রিক পথ',
    description_en: 'Major Depressive Disorder, Generalized Anxiety, Bipolar, Schizophrenia, Psychotropic exposures',
    description_bn: 'ডিপ্রেশন, উদ্বেগ, মেজাজের ওঠানামা এবং সাইকিয়াট্রিক ওষুধের পুষ্টিগত ব্যবস্থাপনা',
    icon_name: 'Brain',
    relevant_conditions_map: ['major_depression', 'anxiety_disorder', 'bipolar_spectrum', 'psychotropic_medication_exposure']
  },
  {
    id: 'neurological_neurodevelopmental',
    category: 'Neuropsychiatric & Brain',
    title_en: 'Neurological & Neurodevelopmental Pathway',
    title_bn: 'নিউরোলজিক্যাল ও নিউরো-ডেভেলপমেন্টাল পথ',
    description_en: 'Epilepsy/Seizures, Migraine, Parkinson’s, Neuropathy, ADHD, Autism Spectrum',
    description_bn: 'মাইগ্রেন, মৃগীরোগ, নিউরোপ্যাথি, পার্কিনসন ও নিউরো-ডেভেলপমেন্টাল সহায়তা',
    icon_name: 'Zap',
    relevant_conditions_map: ['migraine_chronic', 'epilepsy_ketogenic_candidate', 'peripheral_neuropathy', 'adhd_nutritional_support']
  },

  // ── Category 3: Immune & Inflammatory ─────────────────────────────
  {
    id: 'autoimmune_inflammatory',
    category: 'Immune & Inflammatory',
    title_en: 'Autoimmune & Systemic Inflammatory Pathway',
    title_bn: 'অটোইমিউন ও দীর্ঘমেয়াদী প্রদাহ পথ',
    description_en: 'Rheumatoid Arthritis, Hashimoto’s, Systemic Lupus, Celiac Disease, Psoriatic Arthritis',
    description_bn: 'রিউমাটয়েড আর্থ্রাইটিস, হাশিমোটো, লুপাস, সিলিয়াক ও সিস্টেমিক ইনফ্ল্যামেশন',
    icon_name: 'ShieldAlert',
    relevant_conditions_map: ['rheumatoid_arthritis', 'hashimotos_thyroiditis', 'systemic_lupus', 'chronic_systemic_inflammation']
  },
  {
    id: 'dermatological_skin',
    category: 'Immune & Inflammatory',
    title_en: 'Dermatological & Nutritional Skin Pathway',
    title_bn: 'ত্বক ও পুষ্টিগত ডার্মাটোলজি পথ',
    description_en: 'Atopic Eczema, Psoriasis, Acne Vulgaris, Chronic Urticaria, Impaired Wound Healing',
    description_bn: 'একজিমা, সোরিয়াসিস, অ্যালার্জি ও ত্বকের দীর্ঘস্থায়ী ক্ষত নিরাময়',
    icon_name: 'Sparkles',
    relevant_conditions_map: ['atopic_dermatitis_eczema', 'psoriasis_vulgaris', 'chronic_wound_healing']
  },

  // ── Category 4: Surgical & Acute Care ─────────────────────────────
  {
    id: 'oncology',
    category: 'Surgical & Acute Care',
    title_en: 'Oncology & Cancer Nutrition Pathway',
    title_bn: 'অনকোলজি ও ক্যান্সার পুষ্টি পথ',
    description_en: 'Solid tumors, Hematologic malignancies, Chemotherapy/Radiation adjunct, Cancer Cachexia',
    description_bn: 'ক্যান্সার রোগীদের পুষ্টিহীনতা রোধ, কেমোথেরাপির পার্শ্বপ্রতিক্রিয়া হ্রাস ও প্রতিরোধ',
    icon_name: 'Award',
    relevant_conditions_map: ['oncology_active_chemotherapy', 'cancer_cachexia_wasting']
  },
  {
    id: 'underweight_malnutrition',
    category: 'Surgical & Acute Care',
    title_en: 'Underweight & Malnutrition Restoration Pathway',
    title_bn: 'কম ওজন ও পুষ্টিহীনতা নিরাময় পথ',
    description_en: 'Severe Underweight (BMI < 16), Sarcopenia, Involuntary weight loss, Micronutrient wasting',
    description_bn: 'অতিরিক্ত কম ওজন, পেশিক্ষয়, অপুষ্টি এবং দ্রুত ওজন পুনরুদ্ধারের কৌশল',
    icon_name: 'TrendingUp',
    relevant_conditions_map: ['severe_malnutrition', 'sarcopenia_frailty', 'anorexia_poor_appetite']
  },
  {
    id: 'surgical_postoperative',
    category: 'Surgical & Acute Care',
    title_en: 'Surgical & Postoperative Recovery Pathway',
    title_bn: 'অস্ত্রোপচার ও পোস্ট-অপারেটিভ আরোগ্য পথ',
    description_en: 'Preoperative optimization, Post-op wound healing, Bariatric surgery, Bowel resection/stoma',
    description_bn: 'অপারেশনের প্রস্তুতি, অস্ত্রোপচার পরবর্তী দ্রুত ক্ষত নিরাময় ও বেরিয়াট্রিক সার্জারি',
    icon_name: 'Scissors',
    relevant_conditions_map: ['post_operative_resection', 'bariatric_post_op', 'stoma_ileostomy_colostomy']
  },
  {
    id: 'critical_care_specialized_feeding',
    category: 'Surgical & Acute Care',
    title_en: 'Specialized Enteral/Parenteral Feeding Pathway',
    title_bn: 'বিশেষায়িত এন্টারাল ও প্যারেন্টেরাল ফিডিং পথ',
    description_en: 'Total Parenteral Nutrition (TPN), Enteral PEG/NG Tube, NPO status, Severe acute dysphagia',
    description_bn: 'নল দিয়ে খাবার গ্রহণ (PEG/NG), স্যালাইনের মাধ্যমে পুষ্টি (TPN) ও গিলতে জটিলতা',
    icon_name: 'Droplet',
    relevant_conditions_map: ['enteral_feeding_active', 'tpn_parenteral_active', 'npo_acute_status']
  },

  // ── Category 5: Life Span & Musculoskeletal ───────────────────────
  {
    id: 'reproductive_hormonal',
    category: 'Life Span & Musculoskeletal',
    title_en: 'Reproductive & Hormonal Health Pathway',
    title_bn: 'প্রজনন ও হরমোন স্বাস্থ্য পথ',
    description_en: 'Female/Male Infertility, Endometriosis, Perimenopause/Menopause, Andropause',
    description_bn: 'প্রজনন উর্বরতা বৃদ্ধি, এন্ডোমেট্রিওসিস, মেনোপজ ও হরমোন ভারসাম্য রক্ষা',
    icon_name: 'HeartHandshake',
    relevant_conditions_map: ['infertility_reproductive', 'endometriosis_adenomyosis', 'menopause_transition']
  },
  {
    id: 'musculoskeletal_bone',
    category: 'Life Span & Musculoskeletal',
    title_en: 'Musculoskeletal & Bone Density Pathway',
    title_bn: 'হাড় ও পেশি স্বাস্থ্য পথ',
    description_en: 'Osteoporosis, Osteopenia, Osteoarthritis, Gouty Arthritis, Chronic musculoskeletal fatigue',
    description_bn: 'অস্টিওপোরোসিস (হাড় ক্ষয়), বাতের ব্যথা, ইউরিক অ্যাসিড ও অস্থিসন্ধির ক্ষয়',
    icon_name: 'Bone',
    relevant_conditions_map: ['osteoporosis_osteopenia', 'osteoarthritis_degenerative', 'gouty_arthritis']
  },
  {
    id: 'feeding_swallowing_rehabilitation',
    category: 'Life Span & Musculoskeletal',
    title_en: 'Swallowing & Rehabilitation Pathway',
    title_bn: 'গিলতে সমস্যা ও পুনর্বাসন পথ',
    description_en: 'Oropharyngeal Dysphagia, IDDSI texture modification, Post-stroke swallowing rehab',
    description_bn: 'খাবার গিলতে কষ্ট, খাবার আটকে যাওয়া ও স্ট্রোক পরবর্তী রিহ্যাবিলিটেশন',
    icon_name: 'Coffee',
    relevant_conditions_map: ['iddsi_modified_texture_needed', 'stroke_rehabilitation_feeding']
  },
  {
    id: 'other_multimorbidity',
    category: 'Life Span & Musculoskeletal',
    title_en: 'Complex Multimorbidity Pathway',
    title_bn: 'জটিল বহু-রোগ সমন্বয় পথ',
    description_en: 'Intersecting chronic diseases requiring multi-system conflict resolution',
    description_bn: 'একসাথে একাধিক জটিল রোগের উপস্থিতি যেখানে খাদ্যের নিয়মাবলী পারস্পরিক সাংঘর্ষিক',
    icon_name: 'Layers',
    relevant_conditions_map: ['multimorbidity_complex_clash']
  }
];

/**
 * Searches and filters clinical pathways by query string.
 */
export function searchClinicalPathways(query: string): ClinicalPathwayMetadata[] {
  if (!query || query.trim() === '') return CLINICAL_PATHWAY_REGISTRY;
  const q = query.toLowerCase().trim();
  return CLINICAL_PATHWAY_REGISTRY.filter(p => 
    p.title_en.toLowerCase().includes(q) ||
    p.title_bn.includes(q) ||
    p.description_en.toLowerCase().includes(q) ||
    p.description_bn.includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.relevant_conditions_map.some(c => c.toLowerCase().includes(q))
  );
}

/**
 * Resolves legacy condition IDs into matching expanded clinical pathway IDs.
 */
export function mapConditionsToPathways(conditions: string[]): ExpandedClinicalPathwayId[] {
  const result = new Set<ExpandedClinicalPathwayId>();
  const lowerConditions = conditions.map(c => c.toLowerCase());

  CLINICAL_PATHWAY_REGISTRY.forEach(pathway => {
    const hasMatch = pathway.relevant_conditions_map.some(target => 
      lowerConditions.some(c => c.includes(target) || target.includes(c))
    );
    if (hasMatch) {
      result.add(pathway.id);
    }
  });

  return Array.from(result);
}

/**
 * Evaluates patient pathway selection state.
 */
export function evaluatePathwaySelectionState(
  selectedIds: ExpandedClinicalPathwayId[],
  explicitNoKnownPathway: boolean = false
): PatientPathwayState {
  if (explicitNoKnownPathway) {
    return {
      status: 'NO_KNOWN_PATHWAY',
      selected_pathways: [],
      notes: 'Patient explicitly evaluated with no known chronic clinical disease pathways.',
      assessed_at: new Date().toISOString()
    };
  }

  if (selectedIds.length === 0) {
    return {
      status: 'NOT_ASSESSED',
      selected_pathways: [],
      notes: 'Clinical pathways have not yet been evaluated for this patient.',
      assessed_at: new Date().toISOString()
    };
  }

  return {
    status: 'PATHWAYS_SELECTED',
    selected_pathways: selectedIds,
    notes: `${selectedIds.length} clinical pathway(s) active.`,
    assessed_at: new Date().toISOString()
  };
}

export const CLINICAL_PATHWAYS_REGISTRY = CLINICAL_PATHWAY_REGISTRY;
export const determinePathwaySelectionState = (
  selectedIds: ExpandedClinicalPathwayId[],
  explicitNoKnownPathway: boolean = false
): PathwaySelectionState => evaluatePathwaySelectionState(selectedIds, explicitNoKnownPathway).status;

