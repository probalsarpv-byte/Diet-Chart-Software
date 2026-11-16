import { 
  PatientProfile, 
  LongitudinalVisit, 
  PatientRecord 
} from '../types';

export interface PhaseInfo {
  phase: 1 | 2 | 3 | 4;
  title_bn: string;
  title_en: string;
  duration_weeks: string;
  core_focus_bn: string;
  core_focus_en: string;
  allowed_reintroductions_bn: string;
  allowed_reintroductions_en: string;
}

export const CLINICAL_PHASES: Record<1 | 2 | 3 | 4, PhaseInfo> = {
  1: {
    phase: 1,
    title_bn: "পর্যায় ১: গাট রিসেট ও প্রদাহনাশক এলিমিনেশন",
    title_en: "Phase 1: Gut Reset & Inflammatory Elimination",
    duration_weeks: "৪ সপ্তাহ (সপ্তাহ ১ - ৪)",
    core_focus_bn: "অন্ত্রের মিউকোসা স্তরের নিরাময়, প্রদাহ সৃষ্টিকারী খাবার (গ্লুটেন, বাণিজ্যিক দুধ, চিনি, ভাজাপোড়া) সম্পূর্ণ বর্জন এবং পাচক রস বৃদ্ধি।",
    core_focus_en: "Quench mucosal inflammation, remove common antigen triggers (gluten, industrial dairy, refined sugar), and restore gastric hydrochloric acid.",
    allowed_reintroductions_bn: "কোনো প্রক্রিয়াজাত বা প্রদাহজনক খাবার পুনঃপ্রবর্তন নিষেধ।",
    allowed_reintroductions_en: "Strict elimination phase. No trigger foods allowed."
  },
  2: {
    phase: 2,
    title_bn: "পর্যায় ২: মেটাবলিক রিবুট ও মাইক্রোবায়োম রিবিল্ড",
    title_en: "Phase 2: Metabolic Reboot & Microbiome Diversity",
    duration_weeks: "৪ সপ্তাহ (সপ্তাহ ৫ - ৮)",
    core_focus_bn: "কোষীয় ইনসুলিন সংবেদনশীলতা বাড়ানো, যকৃতের চর্বি গলানো (Lipophagy) এবং ডাইভার্স প্রিবায়োটিক ফাইবার সংযোজন।",
    core_focus_en: "Restore insulin sensitivity, stimulate hepatic lipophagy, and introduce diverse resistant starches for beneficial short-chain fatty acid (SCFA) production.",
    allowed_reintroductions_bn: "ভালোভাবে ভেজানো দেশি ডাল (মুগ ও মসুর), টক দই (ঘাসের গরুর দুধের ছানা/দই) এবং পরিমিত মিষ্টি আলু।",
    allowed_reintroductions_en: "Carefully soaked sprouted legumes (mung/lentils), grass-fed A2 kefir/curd, and steamed tubers."
  },
  3: {
    phase: 3,
    title_bn: "পর্যায় ৩: খাদ্য পুনঃপ্রবর্তন ও মেটাবলিক ফ্লেক্সিবিলিটি",
    title_en: "Phase 3: Targeted Reintroduction & Optimization",
    duration_weeks: "৪ সপ্তাহ (সপ্তাহ ৯ - ১২)",
    core_focus_bn: "পূর্বে বাদ দেওয়া প্রাকৃতিক খাবারগুলো একে একে ৩ দিনের বিরতিতে পরীক্ষা করে সহ্যক্ষমতা যাচাই এবং স্থায়ী খাদ্যতালিকা তৈরি।",
    core_focus_en: "Systematic food challenge protocol: reintroduce one eliminated whole food every 3 days while monitoring for delayed IgG/GI flare-ups.",
    allowed_reintroductions_bn: "হাতে তৈরি লাল আটার রুটি, সামুদ্রিক মাছ, বাদাম এবং বিভিন্ন মৌসুমি দেশি ফল।",
    allowed_reintroductions_en: "Ancient grains (hand-pounded red wheat), broader nuts/seeds, and seasonal local low-GI fruits."
  },
  4: {
    phase: 4,
    title_bn: "পর্যায় ৪: টেকসই আজীবন সুস্থতা ও রক্ষণাবেক্ষণ",
    title_en: "Phase 4: Ancestral Lifestyle & Long-Term Resilience",
    duration_weeks: "আজীবন টেকসই",
    core_focus_bn: "শতভাগ প্রাকৃতিক দেশীয় খাবারে অভ্যস্ত হওয়া, ৮৫/১৫ অনুপাত মেনে সামাজিক জীবনে সুস্থ থাকা এবং প্রতি ৬ মাসে রুটিন ল্যাব চেক।",
    core_focus_en: "Sustainable ancestral Bangladeshi dietary rhythm (85/15 metabolic flexibility), circadian alignment, and biannual functional biomarkers.",
    allowed_reintroductions_bn: "সব প্রাকৃতিক পূর্ণাঙ্গ খাবার গ্রহণীয়; শুধুমাত্র কৃত্রিম চিনি, ট্রানস্ফ্যাট ও ক্ষতিকর রাসায়নিক স্থায়ীভাবে বর্জিত।",
    allowed_reintroductions_en: "Full spectrum whole natural diet; lifelong abstinence from hydrogenated seed oils and ultra-processed HFCS."
  }
};

export interface LongitudinalComparison {
  baselineVisit: LongitudinalVisit;
  latestVisit: LongitudinalVisit;
  totalVisits: number;
  weightDeltaKg: number;
  weightDeltaPct: number;
  whtrDelta: number;
  bristolStoolDelta: number;
  symptomScoreDelta: number;
  homaIrDelta?: number;
  tgHdlDelta?: number;
  hba1cDelta?: number;
}

export function compareLongitudinalProgress(visits: LongitudinalVisit[]): LongitudinalComparison | null {
  if (!visits || visits.length === 0) return null;
  const sorted = [...visits].sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime());
  const baseline = sorted[0];
  const latest = sorted[sorted.length - 1];

  const weightDeltaKg = Math.round((latest.weight_kg - baseline.weight_kg) * 10) / 10;
  const weightDeltaPct = baseline.weight_kg > 0 
    ? Math.round(((latest.weight_kg - baseline.weight_kg) / baseline.weight_kg) * 1000) / 10 
    : 0;
  const whtrDelta = Math.round((latest.whtr - baseline.whtr) * 100) / 100;
  const bristolStoolDelta = latest.bristol_stool - baseline.bristol_stool;
  const symptomScoreDelta = (latest.symptom_relief_pct !== undefined && baseline.symptom_relief_pct !== undefined)
    ? latest.symptom_relief_pct - baseline.symptom_relief_pct
    : (latest.symptom_relief_pct ?? 0) - (baseline.symptom_relief_pct ?? 0);

  let homaIrDelta: number | undefined = undefined;
  if (latest.homa_ir !== undefined && baseline.homa_ir !== undefined) {
    homaIrDelta = Math.round((latest.homa_ir - baseline.homa_ir) * 100) / 100;
  }

  let tgHdlDelta: number | undefined = undefined;
  if (latest.tg_hdl_ratio !== undefined && baseline.tg_hdl_ratio !== undefined) {
    tgHdlDelta = Math.round((latest.tg_hdl_ratio - baseline.tg_hdl_ratio) * 100) / 100;
  }

  let hba1cDelta: number | undefined = undefined;
  if (latest.hba1c !== undefined && baseline.hba1c !== undefined) {
    hba1cDelta = Math.round((latest.hba1c - baseline.hba1c) * 10) / 10;
  }

  return {
    baselineVisit: baseline,
    latestVisit: latest,
    totalVisits: sorted.length,
    weightDeltaKg,
    weightDeltaPct,
    whtrDelta,
    bristolStoolDelta,
    symptomScoreDelta,
    homaIrDelta,
    tgHdlDelta,
    hba1cDelta
  };
}

export interface TransitionOptions {
  actualSymptomReliefPct?: number;
  clinicalObservations?: string;
  rationale?: string;
  notes_bn?: string;
  notes_en?: string;
  dietSnapshotSummary?: string;
}

/**
 * Transitions patient to the next functional care phase.
 * NEVER fabricates symptom relief percentages.
 * Records actual clinician evaluation, rationale, and diet snapshot summary.
 */
export function advanceToNextPhase(record: PatientRecord, options?: TransitionOptions): PatientRecord {
  const current = record.patient.current_phase;
  const nextPhase = (Math.min(4, current + 1)) as 1 | 2 | 3 | 4;

  const newPatient: PatientProfile = {
    ...record.patient,
    current_phase: nextPhase
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const lastVisit = record.visits[record.visits.length - 1];

  // Use actual evaluated percentage or carry forward last visit's actual recorded percentage (remains undefined if unassessed)
  const evaluatedSymptomRelief = options?.actualSymptomReliefPct !== undefined 
    ? Math.max(0, Math.min(100, options.actualSymptomReliefPct))
    : lastVisit?.symptom_relief_pct;

  const newVisit: LongitudinalVisit = {
    visit_id: `v_${Date.now()}`,
    visit_date: todayStr,
    phase: nextPhase,
    weight_kg: record.patient.weight_kg,
    waist_cm: record.patient.waist_cm,
    whtr: record.patient.calculated.whtr,
    bristol_stool: record.patient.gut_profile.bristol_stool_score,
    energy_score: record.patient.gut_profile.energy_score,
    symptom_relief_pct: evaluatedSymptomRelief,
    homa_ir: record.patient.labs.homa_ir,
    tg_hdl_ratio: record.patient.labs.tg_hdl_ratio,
    hba1c: record.patient.labs.hba1c,
    tsh: record.patient.labs.tsh,
    uric_acid: record.patient.labs.uric_acid,
    clinical_observations: options?.clinicalObservations || "Phase transition evaluated and recorded by clinician.",
    phase_transition_rationale: options?.rationale || `Clinician authorized phase transition to ${CLINICAL_PHASES[nextPhase].title_en} based on longitudinal clinical evaluation.`,
    is_phase_transition: true,
    diet_plan_snapshot_summary: options?.dietSnapshotSummary || `Target ${record.patient.calculated.target_calories} kcal, ${record.patient.calculated.target_protein_g}g Protein.`,
    notes_bn: options?.notes_bn || `${CLINICAL_PHASES[nextPhase].title_bn} শুরু করা হলো। রোগীর ক্লিনিক্যাল অগ্রগতির ভিত্তিতে পর্যায় পরিবর্তন অনুমোদন করা হয়েছে।`,
    notes_en: options?.notes_en || `Transitioned into ${CLINICAL_PHASES[nextPhase].title_en} upon clinician evaluation.`
  };

  return {
    ...record,
    patient: newPatient,
    visits: [...record.visits, newVisit],
    updated_at: new Date().toISOString()
  };
}

/**
 * Adds a follow-up visit while maintaining the current phase.
 * Allows longitudinal tracking without forcing an unwarranted phase jump.
 */
export function recordFollowUpVisit(record: PatientRecord, visitData: Partial<LongitudinalVisit>): PatientRecord {
  const todayStr = new Date().toISOString().split('T')[0];
  const lastVisit = record.visits[record.visits.length - 1];

  const newVisit: LongitudinalVisit = {
    visit_id: `v_${Date.now()}`,
    visit_date: visitData.visit_date || todayStr,
    phase: record.patient.current_phase,
    weight_kg: visitData.weight_kg ?? record.patient.weight_kg,
    waist_cm: visitData.waist_cm ?? record.patient.waist_cm,
    whtr: visitData.whtr ?? record.patient.calculated.whtr,
    bristol_stool: visitData.bristol_stool ?? record.patient.gut_profile.bristol_stool_score,
    energy_score: visitData.energy_score ?? record.patient.gut_profile.energy_score,
    symptom_relief_pct: visitData.symptom_relief_pct ?? (lastVisit?.symptom_relief_pct ?? 0),
    homa_ir: visitData.homa_ir ?? record.patient.labs.homa_ir,
    tg_hdl_ratio: visitData.tg_hdl_ratio ?? record.patient.labs.tg_hdl_ratio,
    hba1c: visitData.hba1c ?? record.patient.labs.hba1c,
    tsh: visitData.tsh ?? record.patient.labs.tsh,
    uric_acid: visitData.uric_acid ?? record.patient.labs.uric_acid,
    clinical_observations: visitData.clinical_observations,
    is_phase_transition: false,
    diet_plan_snapshot_summary: visitData.diet_plan_snapshot_summary,
    notes_bn: visitData.notes_bn || "নিয়মিত ফলো-আপ ভিজিট সম্পন্ন হয়েছে।",
    notes_en: visitData.notes_en || "Routine longitudinal follow-up visit logged."
  };

  return {
    ...record,
    visits: [...record.visits, newVisit],
    updated_at: new Date().toISOString()
  };
}
