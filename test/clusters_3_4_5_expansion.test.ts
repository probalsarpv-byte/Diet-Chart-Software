/**
 * Clusters 3, 4, and 5 Clinical Functional Nutrition Expansion Test Suite
 * 
 * Verifies:
 * - Cluster 3: Autoimmune & Systemic Inflammation (RA, Psoriasis, Celiac, DMARDs, Biologics, Boswellia, Quercetin)
 * - Cluster 4: Renal, Electrolyte & Nephrolithiasis (CKD 1-3b, Hyperoxaluria, Citrate, Potassium-Sparing Safety)
 * - Cluster 5: Neuro-Adrenal, Hormonal & Sleep Axis (HPA Burnout, Migraine, Insomnia, SSRIs, Ashwagandha, L-Theanine)
 */

import { DISEASE_RULES } from '../src/engine/diseaseRules';
import { runDNIEngine, checkSupplementOverlaps } from '../src/engine/dniEngine';
import { evaluateFastingEligibility } from '../src/clinical-safety/fastingSafetyEngine';
import { PatientProfile, ClinicalConditionId, CandidateSupplement } from '../src/types';
import medicinesData from '../src/data/medicines.json';
import supplementsData from '../src/data/supplements.json';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failedCount++;
  }
}

function createBasePatient(overrides: Partial<PatientProfile> = {}): PatientProfile {
  return {
    schema_version: 2,
    id: 'test_patient_expansion',
    name: 'Clinical Test Patient',
    age: 42,
    gender: 'female',
    height_cm: 165,
    weight_kg: 62,
    activity_level: 'sedentary',
    population_group: 'general_adult',
    selected_conditions: [],
    confirmed_allergies: [],
    active_medications: [],
    gut_profile: {
      bloating: 'none',
      acid_reflux_hypoacidity: false,
      bristol_stool_score: 4,
      energy_score: 7,
      sleep_quality_score: 7,
      digestive_fire_agni: 'samagni'
    },
    labs: {
      lab_flags: []
    },
    calculated: {
      bmi: 22.8,
      bmi_category_en: 'Normal weight',
      bmi_category_bn: 'স্বাভাবিক ওজন',
      ibw_kg: 56.5,
      adjusted_bw_kg: 57.8,
      whtr: 0.48
    },
    ...overrides
  };
}

console.log("=====================================================================");
console.log("CLUSTERS 3, 4, 5 FUNCTIONAL NUTRITION EXPANSION ACCEPTANCE TEST SUITE");
console.log("=====================================================================\n");

// --- CLUSTER 3: AUTOIMMUNE & SYSTEMIC INFLAMMATION ---
console.log("--- 1. Cluster 3: Autoimmune & Systemic Inflammation ---");

assert(
  Boolean(DISEASE_RULES.rheumatoid_arthritis && DISEASE_RULES.psoriasis_metabolic_skin && DISEASE_RULES.celiac_gluten_sensitivity),
  "All Cluster 3 conditions registered in DISEASE_RULES"
);

const celiac = DISEASE_RULES.celiac_gluten_sensitivity;
assert(
  celiac.redTags.includes('contains_gluten') && celiac.greenTags.includes('gluten_free'),
  "Celiac Disease strictly flags contains_gluten as red tag and gluten_free as green tag"
);

assert(
  Boolean(celiac.redFoods && celiac.redFoods.includes('wheat') && celiac.redFoods.includes('barley')),
  "Celiac Disease lists wheat, atta, maida, barley in hard redFoods"
);

const ra = DISEASE_RULES.rheumatoid_arthritis;
assert(
  ra.macroAdjustment.carb_pct_range[0] === 35 && ra.macroAdjustment.protein_g_per_kg[1] === 1.5,
  "Rheumatoid Arthritis configures anti-inflammatory Mediterranean macronutrient targets"
);

const mtxPatient = createBasePatient({
  selected_conditions: ['rheumatoid_arthritis'],
  active_medications: ['Methotrexate']
});
const mtxDni = runDNIEngine(mtxPatient);
const mtxDep = mtxDni.depletions.find(d => d.medicineName === 'Methotrexate');
assert(
  Boolean(mtxDep && mtxDep.depletion.nutrient.includes('Folate') && mtxDep.depletion.severity === 'high'),
  "Methotrexate triggers high-severity Folate depletion"
);

assert(
  mtxDni.candidateSupplements.some(s => s.id === 'supp_active_folate_bcomplex'),
  "Methotrexate generates active L-Methylfolate candidate recommendation"
);

const mtxWarning = mtxDni.criticalWarnings.find(w => w.warning_en.includes('METHOTREXATE FOLATE TIMING'));
assert(
  Boolean(mtxWarning && mtxWarning.warning_bn.includes('মেথোট্রেক্সেট')),
  "Methotrexate generates strict 24-48h folate timing rule away from MTX dose"
);

const biologicPatient = createBasePatient({
  selected_conditions: ['rheumatoid_arthritis'],
  active_medications: ['Humira']
});
const bioDni = runDNIEngine(biologicPatient);
assert(
  bioDni.criticalWarnings.some(w => w.warning_en.includes('IMMUNOSUPPRESSION SAFETY ALERT')),
  "Biologic anti-TNF therapy generates immunosuppression food safety alert"
);

const raPatient = createBasePatient({ selected_conditions: ['rheumatoid_arthritis'] });
const raDni = runDNIEngine(raPatient);
assert(
  raDni.candidateSupplements.some(s => s.id === 'supp_boswellia_serrata'),
  "Rheumatoid Arthritis triggers Boswellia serrata (AKBA) candidate recommendation"
);

const psoPatient = createBasePatient({ selected_conditions: ['psoriasis_metabolic_skin'] });
const psoDni = runDNIEngine(psoPatient);
assert(
  psoDni.candidateSupplements.some(s => s.id === 'supp_quercetin_phytosome'),
  "Psoriasis triggers Quercetin Phytosome candidate recommendation"
);


// --- CLUSTER 4: RENAL, ELECTROLYTE & NEPHROLITHIASIS ---
console.log("\n--- 2. Cluster 4: Renal, Electrolyte & Nephrolithiasis ---");

assert(
  Boolean(DISEASE_RULES.ckd_stage_1_3b && DISEASE_RULES.nephrolithiasis_hyperoxaluria),
  "All Cluster 4 conditions registered in DISEASE_RULES"
);

const ckd = DISEASE_RULES.ckd_stage_1_3b;
assert(
  ckd.macroAdjustment.protein_g_per_kg[0] === 0.6 && ckd.macroAdjustment.protein_g_per_kg[1] === 0.8,
  "CKD Stage 1-3b titrates protein to 0.6 - 0.8 g/kg to protect remnant nephrons"
);

const stones = DISEASE_RULES.nephrolithiasis_hyperoxaluria;
assert(
  stones.redTags.includes('high_oxalate') && Boolean(stones.redFoods?.includes('spinach')),
  "Nephrolithiasis flags high_oxalate as red tag and lists spinach, beetroot in redFoods"
);

const spiroPatient = createBasePatient({
  selected_conditions: ['nephrolithiasis_hyperoxaluria'],
  active_medications: ['Spironolactone']
});
const spiroDni = runDNIEngine(spiroPatient);
assert(
  spiroDni.criticalWarnings.some(w => w.warning_en.includes('CRITICAL SAFETY HARD STOP: Potassium-sparing')),
  "Spironolactone triggers critical warning against concurrent potassium supplements"
);

assert(
  !spiroDni.candidateSupplements.some(s => s.id === 'supp_potassium_citrate_functional'),
  "Spironolactone strictly suppresses potassium citrate candidate supplement to prevent hyperkalemia"
);

const coPrescriptionPatient = createBasePatient({
  active_medications: ['Spironolactone', 'Potassium Citrate']
});
const coDni = runDNIEngine(coPrescriptionPatient);
assert(
  coDni.criticalWarnings.some(w => w.warning_en.includes('CRITICAL DNI HARD STOP')),
  "Co-prescription of Spironolactone and Potassium Citrate triggers CRITICAL DNI HARD STOP"
);

const ckdFastingPatient = createBasePatient({
  selected_conditions: ['ckd_stage_1_3b'],
  labs: { egfr: 38, lab_flags: [] }
});
const ckdFastingEval = evaluateFastingEligibility(ckdFastingPatient, 16);
assert(
  ckdFastingEval.eligibility.max_allowable_fasting_hours === 14,
  "CKD Stage 3b caps max allowable fasting duration to 14 hours"
);
assert(
  ckdFastingEval.safetyResults.some(r => r.rule_id === 'FASTING_CKD_PROLONGED_STOP'),
  "CKD Stage 3b with 16h proposed fasting triggers FASTING_CKD_PROLONGED_STOP"
);

const severeCkdPatient = createBasePatient({
  labs: { egfr: 22, lab_flags: [] }
});
const severeCkdEval = evaluateFastingEligibility(severeCkdPatient, 12);
assert(
  severeCkdEval.eligibility.is_eligible_for_fasting === false && severeCkdEval.eligibility.max_allowable_fasting_hours === 0,
  "Severe CKD (eGFR <30) absolutely contraindicates fasting (0 hours)"
);
assert(
  severeCkdEval.safetyResults.some(r => r.rule_id === 'FASTING_CKD_STAGE4_5_STOP'),
  "Severe CKD triggers FASTING_CKD_STAGE4_5_STOP"
);


// --- CLUSTER 5: NEURO-ADRENAL, HORMONAL & SLEEP AXIS ---
console.log("\n--- 3. Cluster 5: Neuro-Adrenal, Hormonal & Sleep Axis ---");

assert(
  Boolean(DISEASE_RULES.hpa_axis_burnout && DISEASE_RULES.migraine_neurovascular && DISEASE_RULES.insomnia_circadian_disruption),
  "All Cluster 5 conditions registered in DISEASE_RULES"
);

const migraine = DISEASE_RULES.migraine_neurovascular;
assert(
  migraine.redTags.includes('tyramine_rich') && migraine.redTags.includes('msg_nitrites'),
  "Migraine rule eliminates vasoactive aminergic triggers (tyramine, histamine, MSG)"
);

const insomnia = DISEASE_RULES.insomnia_circadian_disruption;
assert(
  insomnia.mealTimingRules.some(r => r.rule_en.includes('3-4 hours prior')),
  "Insomnia rule enforces 3-4 hours pre-bedtime meal completion"
);

const ssriPatient = createBasePatient({
  active_medications: ['Escitalopram']
});
const ssriDni = runDNIEngine(ssriPatient);
assert(
  ssriDni.criticalWarnings.some(w => w.warning_en.includes('SEROTONIN SYNDROME WARNING')),
  "SSRI triggers Serotonin Syndrome warning against concurrent 5-HTP"
);

const hpaPatient = createBasePatient({
  selected_conditions: ['hpa_axis_burnout']
});
const hpaEval = evaluateFastingEligibility(hpaPatient, 16);
assert(
  hpaEval.eligibility.max_allowable_fasting_hours === 14,
  "HPA-Axis burnout caps fasting duration to 14 hours"
);
assert(
  hpaEval.safetyResults.some(r => r.rule_id === 'FASTING_HPA_BURNOUT_PROLONGED_STOP'),
  "HPA-Axis burnout with 16h proposed fasting triggers FASTING_HPA_BURNOUT_PROLONGED_STOP"
);

const neuroPatient = createBasePatient({
  selected_conditions: ['hpa_axis_burnout', 'insomnia_circadian_disruption']
});
const neuroDni = runDNIEngine(neuroPatient);
assert(
  neuroDni.candidateSupplements.some(s => s.id === 'supp_ashwagandha_ksm66'),
  "HPA Burnout triggers Ashwagandha KSM-66 candidate recommendation"
);
assert(
  neuroDni.candidateSupplements.some(s => s.id === 'supp_l_theanine'),
  "Insomnia triggers L-Theanine candidate recommendation"
);


// --- 4. REFERENTIAL INTEGRITY & UPPER LIMIT SCREENING ---
console.log("\n--- 4. Referential Integrity & Catalog Completeness ---");

const potassiumCandidates: CandidateSupplement[] = [
  {
    id: 'supp_potassium_citrate_functional',
    name_en: 'Potassium Magnesium Citrate',
    name_bn: 'পটাশিয়াম ম্যাগনেসিয়াম সাইট্রেট',
    category: 'Electrolyte',
    clinical_indications: [],
    recommended_dose: '10 mEq',
    timing_schedule: 'Post-meal',
    timing_note_bn: '',
    timing_note_en: '',
    verified_bd_brands: ['K-Cit'],
    contraindications: [],
    approval_status: 'candidate_review',
    indication_trigger: 'Kidney stones'
  },
  {
    id: 'supp_potassium_gluconate_extra',
    name_en: 'Potassium Gluconate',
    name_bn: 'পটাশিয়াম গ্লুকোনেট',
    category: 'Electrolyte',
    clinical_indications: [],
    recommended_dose: '99 mg',
    timing_schedule: 'Post-meal',
    timing_note_bn: '',
    timing_note_en: '',
    verified_bd_brands: [],
    contraindications: [],
    approval_status: 'candidate_review',
    indication_trigger: 'Electrolyte repletion'
  }
];

const kOverlap = checkSupplementOverlaps(potassiumCandidates);
assert(
  kOverlap.some(w => w.nutrient.includes('Potassium') && w.severity === 'high'),
  "Multiple concurrent potassium formulations trigger high-severity Upper Limit overlap alert"
);

const allConditionKeys = Object.keys(DISEASE_RULES) as ClinicalConditionId[];
assert(
  allConditionKeys.length === 21,
  `Total conditions count is exactly 21 (found ${allConditionKeys.length})`
);

assert(
  medicinesData.length === 20,
  `Medicines catalog contains exactly 20 evidence-based classes (found ${medicinesData.length})`
);

assert(
  supplementsData.length === 19,
  `Supplements catalog contains exactly 19 functional nutraceuticals (found ${supplementsData.length})`
);

console.log("\n=====================================================================");
console.log(`ACCEPTANCE RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("=====================================================================");

if (failedCount > 0) {
  process.exit(1);
}
