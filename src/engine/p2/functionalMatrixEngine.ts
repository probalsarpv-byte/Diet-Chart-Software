// P2 Functional Matrix Engine
// Maps ClinicalObservations to the 7 Functional Medicine domains
// producing DomainFinding[] with burden assessment.

import { ClinicalObservation, DomainFinding, FunctionalDomain } from './types';

// ─── Domain metadata ──────────────────────────────────────────────
const DOMAIN_META: Record<FunctionalDomain, { name_en: string; name_bn: string }> = {
  assimilation: {
    name_en: 'Assimilation (Digestion, Absorption, Microbiome)',
    name_bn: 'আত্মীকরণ (হজম, শোষণ, মাইক্রোবায়োম)',
  },
  defense_repair: {
    name_en: 'Defense & Repair (Immune, Inflammation)',
    name_bn: 'প্রতিরক্ষা ও মেরামত (ইমিউন, প্রদাহ)',
  },
  energy: {
    name_en: 'Energy Production (Mitochondria, Glycemic, Sleep)',
    name_bn: 'শক্তি উৎপাদন (মাইটোকন্ড্রিয়া, গ্লাইসেমিক, ঘুম)',
  },
  biotransformation: {
    name_en: 'Biotransformation & Elimination (Liver, Detoxification)',
    name_bn: 'বায়োট্রান্সফর্মেশন ও বিসর্জন (লিভার, ডিটক্স)',
  },
  transport: {
    name_en: 'Transport (Cardiovascular, Lymphatic)',
    name_bn: 'পরিবহন (কার্ডিওভাসকুলার, লিম্ফ্যাটিক)',
  },
  communication: {
    name_en: 'Communication (Hormones, Neurotransmitters)',
    name_bn: 'যোগাযোগ (হরমোন, নিউরোট্রান্সমিটার)',
  },
  structural_integrity: {
    name_en: 'Structural Integrity (Musculoskeletal, Cellular)',
    name_bn: 'কাঠামোগত অখণ্ডতা (মাস্কুলোস্কেলেটাল, সেলুলার)',
  },
};

// ─── Tag→concern and high-value-missing lists ─────────────────────
const DOMAIN_HIGH_VALUE_MISSING: Record<FunctionalDomain, string[]> = {
  assimilation: ['Stool culture/microbiome testing', 'Food intolerance panel', 'Calprotectin', '3-day dietary recall'],
  defense_repair: ['hs-CRP or ESR', 'Full blood count', 'IgE panel for specific allergens'],
  energy: ['Fasting insulin / HOMA-IR', 'HbA1c', 'Mitochondrial nutrient levels (CoQ10, B vitamins)'],
  biotransformation: ['ALT/AST/GGT', 'Bilirubin', 'Full liver function panel'],
  transport: ['Lipid panel (TG, HDL, LDL)', 'Ferritin and iron studies', 'Blood pressure'],
  communication: ['TSH, fT3, fT4', 'Vitamin D3', 'Reproductive hormone panel (LH, FSH, estradiol, testosterone)'],
  structural_integrity: ['DEXA scan or body composition', 'Vitamin D3', 'Calcium / phosphorus'],
};

const DOMAIN_FURTHER_SUGGESTIONS: Record<FunctionalDomain, string[]> = {
  assimilation: ['Consider low-FODMAP trial assessment', 'Detailed 3-day diet recall', 'Bristol stool chart monitoring'],
  defense_repair: ['Allergy testing if not done', 'Review food trigger diary', 'Anti-inflammatory dietary assessment'],
  energy: ['Continuous glucose monitoring if available', 'Sleep study if indicated', 'Thyroid panel if not done'],
  biotransformation: ['Medication review for hepatotoxic load', 'Alcohol intake detailed history', 'Cruciferous vegetable intake assessment'],
  transport: ['24-hour dietary recall for fat quality', 'Blood pressure monitoring', 'Iron absorption inhibitor review'],
  communication: ['Menstrual health detailed history', 'Stress and cortisol history', 'Iodine and selenium dietary intake'],
  structural_integrity: ['Resistance training history', 'Protein distribution across meals', 'Calcium and vitamin D adequacy'],
};

// Tags that are pertinent negatives (absence of problem = good)
const PERTINENT_NEGATIVE_TAGS: Record<FunctionalDomain, string[]> = {
  assimilation: ['normal_bowel_habit', 'no_bloating', 'adequate_fiber', 'high_dietary_diversity'],
  defense_repair: ['no_allergy', 'normal_inflammatory_markers', 'no_skin_rash'],
  energy: ['normal_homa_ir', 'normal_hba1c', 'adequate_sleep', 'active_lifestyle'],
  biotransformation: ['normal_liver_enzymes', 'no_alcohol_use', 'no_hepatotoxic_medication'],
  transport: ['normal_whtr', 'normal_tg_hdl', 'normal_ferritin'],
  communication: ['normal_tsh', 'normal_vitamin_d', 'regular_menstrual_cycle'],
  structural_integrity: ['adequate_protein_intake', 'adequate_muscle_mass', 'active_lifestyle'],
};

function burdenFromCount(count: number): DomainFinding['overallBurden'] {
  if (count === 0) return 'none';
  if (count <= 2) return 'mild';
  if (count <= 4) return 'moderate';
  return 'significant';
}

export function computeFunctionalMatrix(observations: ClinicalObservation[]): DomainFinding[] {
  const domains: FunctionalDomain[] = [
    'assimilation',
    'defense_repair',
    'energy',
    'biotransformation',
    'transport',
    'communication',
    'structural_integrity',
  ];

  return domains.map((domain) => {
    const meta = DOMAIN_META[domain];
    const relevantObs = observations.filter((o) => o.associatedDomains.includes(domain));
    const relevantIds = relevantObs.map((o) => o.id);

    // Supporting evidence: observations that are confirmed/verified
    const supporting = relevantObs
      .filter((o) => o.verificationStatus !== 'unverified' || o.category === 'lab')
      .map((o) => `${o.category}: ${o.observedValue}${o.unit ? ' ' + o.unit : ''} (${o.tags?.join(', ') ?? ''})`);

    // Pertinent negatives: tags that indicate absence of a problem
    const pertinentNegTags = PERTINENT_NEGATIVE_TAGS[domain] ?? [];
    const pertinentNegatives: string[] = [];
    for (const obs of observations) {
      for (const tag of obs.tags ?? []) {
        if (pertinentNegTags.includes(tag) && !pertinentNegatives.includes(tag)) {
          pertinentNegatives.push(`${tag} (documented)`);
        }
      }
    }

    // Missing info
    const hasLabObs = observations.some(
      (o) => o.category === 'lab' && o.associatedDomains.includes(domain),
    );
    const missingInformation: string[] = hasLabObs
      ? []
      : DOMAIN_HIGH_VALUE_MISSING[domain].slice(0, 2);

    // Potential confounders
    const confounders: string[] = [];
    if (domain === 'energy') {
      if (observations.some((o) => o.tags?.includes('shift_worker'))) {
        confounders.push('Shift work circadian disruption may affect glycemic and energy markers');
      }
      if (observations.some((o) => o.tags?.includes('low_sleep_hours'))) {
        confounders.push('Sleep restriction elevates cortisol which can mimic metabolic dysfunction');
      }
    }
    if (domain === 'biotransformation') {
      if (observations.some((o) => o.tags?.includes('hepatotoxic_medication'))) {
        confounders.push('Medication-induced hepatic elevation may confound dietary hepatic burden assessment');
      }
    }
    if (domain === 'transport') {
      if (observations.some((o) => o.tags?.includes('low_sleep_hours'))) {
        confounders.push('Sleep restriction transiently elevates triglycerides');
      }
    }

    // Clinical review flags
    const reviewFlags: string[] = [];
    if (relevantObs.some((o) => o.severity === 'severe')) {
      reviewFlags.push('Severe-rated observation present — clinician review required before intervention');
    }
    if (relevantObs.some((o) => o.tags?.includes('confirmed_condition'))) {
      reviewFlags.push('Confirmed clinical condition present — ensure coordination with treating physician');
    }

    return {
      domain,
      domainName_en: meta.name_en,
      domainName_bn: meta.name_bn,
      relevantObservations: relevantIds,
      supportingEvidence: supporting,
      pertinentNegatives,
      missingInformation,
      potentialConfounders: confounders,
      clinicalReviewFlags: reviewFlags,
      furtherAssessmentSuggestions: DOMAIN_FURTHER_SUGGESTIONS[domain],
      overallBurden: burdenFromCount(relevantObs.length),
    } satisfies DomainFinding;
  });
}
