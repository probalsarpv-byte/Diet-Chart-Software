// P2 Evidence Aggregator
// Converts PatientProfile + P1 assessment answers into ClinicalObservation[]
// All observations are deterministically derived; no paid APIs used.

import { PatientProfile } from '../../types';
import { ClinicalObservation, FunctionalDomain } from './types';

// ─── Domain tag map ───────────────────────────────────────────────
const TAG_DOMAIN_MAP: Record<string, FunctionalDomain[]> = {
  bloating: ['assimilation'],
  dairy_consumer: ['assimilation'],
  dairy_intake: ['assimilation'],
  loose_stool_post_dairy: ['assimilation'],
  abdominal_pain: ['assimilation'],
  flatulence: ['assimilation'],
  constipation: ['assimilation'],
  diarrhea: ['assimilation'],
  low_vegetable_intake: ['assimilation'],
  low_whole_grain: ['assimilation'],
  low_fruit_intake: ['assimilation'],
  low_fiber_diet: ['assimilation'],
  nausea: ['assimilation'],
  acid_reflux: ['assimilation'],
  low_food_group_variety: ['assimilation'],
  antibiotic_exposure: ['assimilation', 'defense_repair'],
  irregular_meal_timing: ['assimilation', 'energy'],
  meal_skipping: ['assimilation', 'energy'],
  late_night_eating: ['assimilation', 'energy'],
  low_fluid_intake: ['assimilation', 'structural_integrity'],
  dark_urine: ['assimilation'],

  // Energy / metabolic
  elevated_homa_ir: ['energy'],
  elevated_fasting_glucose: ['energy'],
  elevated_hba1c: ['energy'],
  postprandial_fatigue: ['energy'],
  sugar_cravings: ['energy'],
  fatigue: ['energy'],
  low_sleep_hours: ['energy'],
  poor_sleep_quality: ['energy'],
  shift_worker: ['energy'],
  sedentary_activity_level: ['energy', 'structural_integrity'],

  // Transport
  elevated_tg_hdl: ['transport'],
  elevated_triglycerides: ['transport'],
  low_hdl: ['transport'],
  elevated_whtr: ['transport'],
  central_adiposity: ['transport'],
  elevated_bp: ['transport'],
  low_ferritin: ['transport'],
  pallor: ['transport'],

  // Defense / repair
  confirmed_allergy: ['defense_repair'],
  urticaria: ['defense_repair'],
  elevated_crp: ['defense_repair'],
  joint_pain: ['defense_repair'],
  chronic_fatigue: ['defense_repair', 'energy'],
  skin_rash: ['defense_repair'],
  gut_dysbiosis_condition: ['defense_repair', 'assimilation'],

  // Communication
  abnormal_tsh: ['communication'],
  low_vitamin_d3: ['communication'],
  menstrual_irregularity: ['communication'],
  pcos_condition: ['communication'],
  acne: ['communication'],
  hirsutism: ['communication'],

  // Biotransformation
  elevated_alt: ['biotransformation'],
  elevated_ast: ['biotransformation'],
  fatty_liver_condition: ['biotransformation'],
  alcohol_use: ['biotransformation'],
  hepatotoxic_medication: ['biotransformation'],
  nutrient_depleting_medication: ['assimilation', 'biotransformation'],
  gi_affecting_medication: ['assimilation'],

  // Structural
  muscle_weakness_or_loss: ['structural_integrity'],
  low_protein_food_frequency: ['structural_integrity'],
  bone_pain: ['structural_integrity'],
  hair_loss: ['structural_integrity'],
};

function domainsForTags(tags: string[]): FunctionalDomain[] {
  const set = new Set<FunctionalDomain>();
  for (const t of tags) {
    for (const d of TAG_DOMAIN_MAP[t] ?? []) set.add(d);
  }
  return Array.from(set);
}

function makeId(patientId: string, source: string, key: string): string {
  // Deterministic ID - no random, no crypto needed
  return `obs_${patientId.slice(0, 6)}_${source}_${key}`.replace(/[^a-zA-Z0-9_]/g, '_');
}

// ─── Main aggregator ─────────────────────────────────────────────
export function aggregateEvidence(
  patient: PatientProfile,
  assessmentAnswers: Record<string, unknown>,
): ClinicalObservation[] {
  const obs: ClinicalObservation[] = [];
  const seen = new Set<string>();
  const visitId = `visit_${patient.visit_date.replace(/-/g, '')}`;
  const date = patient.visit_date;

  function add(o: ClinicalObservation): void {
    if (!seen.has(o.id)) {
      seen.add(o.id);
      obs.push(o);
    }
  }

  // ── Allergies ──────────────────────────────────────────────────
  for (const allergen of patient.confirmed_allergies) {
    const tags = ['confirmed_allergy', allergen];
    add({
      id: makeId(patient.id, 'allergy', allergen),
      patientId: patient.id,
      visitId,
      category: 'allergy',
      observedValue: allergen,
      date,
      dataSource: 'clinician_recorded',
      verificationStatus: 'clinician_verified',
      associatedDomains: domainsForTags(tags),
      tags,
    });
  }

  // ── Confirmed conditions ───────────────────────────────────────
  const conditionTagMap: Record<string, string[]> = {
    t2d_ir: ['elevated_homa_ir', 'elevated_fasting_glucose', 'elevated_hba1c'],
    hypothyroid: ['abnormal_tsh'],
    fatty_liver: ['fatty_liver_condition', 'elevated_alt'],
    pcos: ['pcos_condition', 'menstrual_irregularity'],
    gut_dysbiosis: ['gut_dysbiosis_condition'],
    uric_acid_gout: ['elevated_uric_acid'],
    hypertension_ckd: ['elevated_bp'],
  };
  for (const condId of patient.selected_conditions) {
    const ctags = conditionTagMap[condId] ?? [condId];
    add({
      id: makeId(patient.id, 'condition', condId),
      patientId: patient.id,
      visitId,
      category: 'history',
      observedValue: condId,
      date,
      dataSource: 'clinician_recorded',
      verificationStatus: 'clinician_verified',
      associatedDomains: domainsForTags(ctags),
      tags: ['confirmed_condition', condId, ...ctags],
    });
  }

  // ── Medications ────────────────────────────────────────────────
  const hepatotoxicMeds = ['methotrexate', 'isoniazid', 'statins', 'paracetamol_high_dose'];
  const nutrientDepletingMeds = ['metformin', 'ppi', 'omeprazole', 'esomeprazole', 'pantoprazole', 'atorvastatin', 'rosuvastatin'];
  const giAffectingMeds = ['metformin', 'nsaid', 'ibuprofen', 'diclofenac', 'antibiotics', 'iron_supplement'];

  for (const med of patient.active_medications) {
    const medLower = med.toLowerCase();
    const tags: string[] = ['medication'];
    if (hepatotoxicMeds.some((h) => medLower.includes(h))) tags.push('hepatotoxic_medication');
    if (nutrientDepletingMeds.some((n) => medLower.includes(n))) tags.push('nutrient_depleting_medication');
    if (giAffectingMeds.some((g) => medLower.includes(g))) tags.push('gi_affecting_medication');

    add({
      id: makeId(patient.id, 'medication', med),
      patientId: patient.id,
      visitId,
      category: 'medication',
      observedValue: med,
      date,
      dataSource: 'clinician_recorded',
      verificationStatus: 'clinician_verified',
      associatedDomains: domainsForTags(tags),
      tags,
    });
  }

  // ── Lab values ─────────────────────────────────────────────────
  const labs = patient.labs;

  if (labs.homa_ir !== undefined) {
    const elevated = labs.homa_ir > 2.5;
    const tags = elevated ? ['elevated_homa_ir', 'central_adiposity'] : ['normal_homa_ir'];
    add({
      id: makeId(patient.id, 'lab', 'homa_ir'),
      patientId: patient.id,
      visitId,
      category: 'lab',
      sourceLabMarker: 'homa_ir',
      observedValue: labs.homa_ir,
      unit: 'index',
      date,
      dataSource: 'measured',
      verificationStatus: 'lab_confirmed',
      associatedDomains: domainsForTags(tags),
      tags,
    });
  }

  if (labs.hba1c !== undefined) {
    const elevated = labs.hba1c >= 5.7;
    const tags = elevated ? ['elevated_hba1c'] : ['normal_hba1c'];
    add({
      id: makeId(patient.id, 'lab', 'hba1c'),
      patientId: patient.id,
      visitId,
      category: 'lab',
      sourceLabMarker: 'hba1c',
      observedValue: labs.hba1c,
      unit: '%',
      date,
      severity: labs.hba1c >= 6.5 ? 'moderate' : labs.hba1c >= 5.7 ? 'mild' : 'none',
      dataSource: 'measured',
      verificationStatus: 'lab_confirmed',
      associatedDomains: domainsForTags(tags),
      tags,
    });
  }

  if (labs.fasting_glucose !== undefined) {
    const elevated = labs.fasting_glucose >= 100;
    const tags = elevated ? ['elevated_fasting_glucose'] : ['normal_fasting_glucose'];
    add({
      id: makeId(patient.id, 'lab', 'fasting_glucose'),
      patientId: patient.id,
      visitId,
      category: 'lab',
      sourceLabMarker: 'fasting_glucose',
      observedValue: labs.fasting_glucose,
      unit: 'mg/dL',
      date,
      dataSource: 'measured',
      verificationStatus: 'lab_confirmed',
      associatedDomains: domainsForTags(tags),
      tags,
    });
  }

  if (labs.tsh !== undefined) {
    const abnormal = labs.tsh < 0.4 || labs.tsh > 4.0;
    const tags = abnormal ? ['abnormal_tsh'] : ['normal_tsh'];
    add({
      id: makeId(patient.id, 'lab', 'tsh'),
      patientId: patient.id,
      visitId,
      category: 'lab',
      sourceLabMarker: 'tsh',
      observedValue: labs.tsh,
      unit: 'mIU/L',
      date,
      dataSource: 'measured',
      verificationStatus: 'lab_confirmed',
      associatedDomains: domainsForTags(tags),
      tags,
    });
  }

  if (labs.vitamin_d3 !== undefined) {
    const insufficient = labs.vitamin_d3 < 50;
    const tags = insufficient ? ['low_vitamin_d3'] : ['normal_vitamin_d'];
    add({
      id: makeId(patient.id, 'lab', 'vitamin_d3'),
      patientId: patient.id,
      visitId,
      category: 'lab',
      sourceLabMarker: 'vitamin_d3',
      observedValue: labs.vitamin_d3,
      unit: 'nmol/L',
      date,
      severity: labs.vitamin_d3 < 30 ? 'moderate' : labs.vitamin_d3 < 50 ? 'mild' : 'none',
      dataSource: 'measured',
      verificationStatus: 'lab_confirmed',
      associatedDomains: domainsForTags(tags),
      tags,
    });
  }

  if (labs.ferritin !== undefined) {
    const low = labs.ferritin < 20;
    const tags = low ? ['low_ferritin'] : labs.ferritin > 200 ? ['high_ferritin'] : ['normal_ferritin'];
    add({
      id: makeId(patient.id, 'lab', 'ferritin'),
      patientId: patient.id,
      visitId,
      category: 'lab',
      sourceLabMarker: 'ferritin',
      observedValue: labs.ferritin,
      unit: 'ng/mL',
      date,
      dataSource: 'measured',
      verificationStatus: 'lab_confirmed',
      associatedDomains: domainsForTags(tags),
      tags,
    });
  }

  if (labs.alt !== undefined) {
    const elevated = labs.alt > 40;
    const tags = elevated ? ['elevated_alt'] : ['normal_liver_enzymes'];
    add({
      id: makeId(patient.id, 'lab', 'alt'),
      patientId: patient.id,
      visitId,
      category: 'lab',
      sourceLabMarker: 'alt',
      observedValue: labs.alt,
      unit: 'U/L',
      date,
      dataSource: 'measured',
      verificationStatus: 'lab_confirmed',
      associatedDomains: domainsForTags(tags),
      tags,
    });
  }

  if (labs.ast !== undefined) {
    const elevated = labs.ast > 40;
    const tags = elevated ? ['elevated_ast'] : [];
    add({
      id: makeId(patient.id, 'lab', 'ast'),
      patientId: patient.id,
      visitId,
      category: 'lab',
      sourceLabMarker: 'ast',
      observedValue: labs.ast,
      unit: 'U/L',
      date,
      dataSource: 'measured',
      verificationStatus: 'lab_confirmed',
      associatedDomains: domainsForTags(tags),
      tags,
    });
  }

  if (labs.tg_hdl_ratio !== undefined) {
    const elevated = labs.tg_hdl_ratio > 3.5;
    const tags = elevated ? ['elevated_tg_hdl'] : [];
    add({
      id: makeId(patient.id, 'lab', 'tg_hdl_ratio'),
      patientId: patient.id,
      visitId,
      category: 'lab',
      sourceLabMarker: 'tg_hdl_ratio',
      observedValue: labs.tg_hdl_ratio,
      unit: 'ratio',
      date,
      dataSource: 'measured',
      verificationStatus: 'lab_confirmed',
      associatedDomains: domainsForTags(tags),
      tags,
    });
  }

  // ── Gut Profile ────────────────────────────────────────────────
  const gut = patient.gut_profile;
  if (gut.bloating !== 'none') {
    const tags = ['bloating'];
    if (gut.bloating === 'severe') tags.push('severe_bloating');
    add({
      id: makeId(patient.id, 'gut', 'bloating'),
      patientId: patient.id,
      visitId,
      category: 'symptom',
      observedValue: gut.bloating,
      date,
      severity: gut.bloating === 'severe' ? 'severe' : 'mild',
      dataSource: 'patient_reported',
      verificationStatus: 'unverified',
      associatedDomains: domainsForTags(tags),
      tags,
    });
  }

  if (gut.acid_reflux_hypoacidity) {
    add({
      id: makeId(patient.id, 'gut', 'acid_reflux'),
      patientId: patient.id,
      visitId,
      category: 'symptom',
      observedValue: true,
      date,
      dataSource: 'patient_reported',
      verificationStatus: 'unverified',
      associatedDomains: ['assimilation'],
      tags: ['acid_reflux'],
    });
  }

  if (gut.bristol_stool_score <= 2) {
    add({
      id: makeId(patient.id, 'gut', 'constipation'),
      patientId: patient.id,
      visitId,
      category: 'symptom',
      observedValue: gut.bristol_stool_score,
      date,
      severity: 'mild',
      dataSource: 'patient_reported',
      verificationStatus: 'unverified',
      associatedDomains: ['assimilation'],
      tags: ['constipation', 'low_bristol_score'],
    });
  } else if (gut.bristol_stool_score >= 6) {
    add({
      id: makeId(patient.id, 'gut', 'diarrhea'),
      patientId: patient.id,
      visitId,
      category: 'symptom',
      observedValue: gut.bristol_stool_score,
      date,
      severity: gut.bristol_stool_score === 7 ? 'severe' : 'mild',
      dataSource: 'patient_reported',
      verificationStatus: 'unverified',
      associatedDomains: ['assimilation'],
      tags: ['diarrhea'],
    });
  }

  if (gut.energy_score <= 4) {
    add({
      id: makeId(patient.id, 'gut', 'fatigue'),
      patientId: patient.id,
      visitId,
      category: 'symptom',
      observedValue: gut.energy_score,
      date,
      severity: gut.energy_score <= 2 ? 'severe' : 'mild',
      dataSource: 'patient_reported',
      verificationStatus: 'unverified',
      associatedDomains: ['energy'],
      tags: ['fatigue', 'low_energy_score'],
    });
  }

  if (gut.sleep_quality_score <= 5) {
    add({
      id: makeId(patient.id, 'gut', 'poor_sleep'),
      patientId: patient.id,
      visitId,
      category: 'lifestyle',
      observedValue: gut.sleep_quality_score,
      date,
      dataSource: 'patient_reported',
      verificationStatus: 'unverified',
      associatedDomains: ['energy'],
      tags: ['poor_sleep_quality'],
    });
  }

  // ── Anthropometrics ────────────────────────────────────────────
  const calc = patient.calculated;
  if (calc.whtr >= 0.5) {
    add({
      id: makeId(patient.id, 'anthro', 'whtr_elevated'),
      patientId: patient.id,
      visitId,
      category: 'anthropometric',
      observedValue: calc.whtr,
      date,
      dataSource: 'calculated',
      verificationStatus: 'clinician_verified',
      associatedDomains: ['transport'],
      tags: ['elevated_whtr', 'central_adiposity'],
    });
  }

  // ── Lifestyle ──────────────────────────────────────────────────
  if (patient.sleep_hours < 7) {
    add({
      id: makeId(patient.id, 'lifestyle', 'low_sleep'),
      patientId: patient.id,
      visitId,
      category: 'lifestyle',
      observedValue: patient.sleep_hours,
      unit: 'hours',
      date,
      dataSource: 'patient_reported',
      verificationStatus: 'unverified',
      associatedDomains: ['energy'],
      tags: ['low_sleep_hours'],
    });
  }

  if (patient.shift_worker) {
    add({
      id: makeId(patient.id, 'lifestyle', 'shift_worker'),
      patientId: patient.id,
      visitId,
      category: 'lifestyle',
      observedValue: true,
      date,
      dataSource: 'patient_reported',
      verificationStatus: 'unverified',
      associatedDomains: ['energy'],
      tags: ['shift_worker'],
    });
  }

  if (patient.activity_level === 'sedentary') {
    add({
      id: makeId(patient.id, 'lifestyle', 'sedentary'),
      patientId: patient.id,
      visitId,
      category: 'lifestyle',
      observedValue: 'sedentary',
      date,
      dataSource: 'patient_reported',
      verificationStatus: 'unverified',
      associatedDomains: ['energy', 'structural_integrity'],
      tags: ['sedentary_activity_level'],
    });
  }

  // ── Assessment answers ─────────────────────────────────────────
  const knownTags: Array<[string, string[], FunctionalDomain[]]> = [
    ['bloating_post_dairy', ['bloating', 'dairy_consumer', 'loose_stool_post_dairy'], ['assimilation']],
    ['low_vegetable_intake', ['low_vegetable_intake'], ['assimilation']],
    ['low_protein_intake', ['low_protein_food_frequency'], ['structural_integrity']],
    ['meal_skipping', ['meal_skipping', 'irregular_meal_timing'], ['assimilation', 'energy']],
    ['irregular_meal_timing', ['irregular_meal_timing'], ['assimilation', 'energy']],
    ['low_fluid_intake', ['low_fluid_intake'], ['assimilation', 'structural_integrity']],
    ['recent_antibiotic', ['antibiotic_exposure'], ['assimilation', 'defense_repair']],
    ['muscle_weakness', ['muscle_weakness_or_loss'], ['structural_integrity']],
    ['hair_loss', ['hair_loss'], ['structural_integrity']],
    ['menstrual_irregularity', ['menstrual_irregularity'], ['communication']],
    ['sugar_cravings', ['sugar_cravings'], ['energy']],
    ['alcohol_use', ['alcohol_use'], ['biotransformation']],
  ];

  for (const [answerKey, tags, domains] of knownTags) {
    const val = assessmentAnswers[answerKey];
    if (val === true || val === 'yes' || val === 'often' || val === 'always') {
      add({
        id: makeId(patient.id, 'assessment', answerKey),
        patientId: patient.id,
        visitId,
        category: 'symptom',
        sourceQuestionId: answerKey,
        observedValue: val as string | boolean,
        date,
        dataSource: 'patient_reported',
        verificationStatus: 'unverified',
        associatedDomains: domains,
        tags,
      });
    }
  }

  // Sort: lab_confirmed first, then clinician_verified, then unverified
  const order: Record<string, number> = { lab_confirmed: 0, clinician_verified: 1, unverified: 2 };
  obs.sort((a, b) => (order[a.verificationStatus] ?? 3) - (order[b.verificationStatus] ?? 3));

  return obs;
}
