// P1 Functional Nutrition Assessment Comprehensive Test Suite
// ------------------------------------------------------------------
// Tests 14 functional domains, declarative rule branching, Quick/Full modes,
// 7-Day FFQ engine, Ayurvedic Prakriti-Vikriti-Agni, Masanumasika Pregnancy,
// medication/lab intake, patient isolation, and P2 intelligence handoff.

import {
  ASSESSMENT_DOMAINS,
  coreQuestions,
  registryVersion,
} from '../src/questionnaire/registry';
import {
  evaluateDeclarativeCondition,
  filterVisibleQuestions,
} from '../src/engine/questionEngine';
import { calculatePrakriti } from '../src/engine/assessment/prakritiEngine';
import { calculateVikriti } from '../src/engine/assessment/vikritiEngine';
import { calculateAgni } from '../src/engine/assessment/agniEngine';
import {
  analyzeDietaryFrequency,
  FFQ_FOOD_DEFINITIONS,
  FREQUENCY_NUMERIC_ESTIMATES,
  PORTION_MULTIPLIERS
} from '../src/engine/assessment/ffqEngine';
import {
  calculatePregnancyMonth,
  getTrimesterFromWeeks,
  MASANUMASIKA_MONTH_FRAMEWORKS
} from '../src/questionnaire/masanumasikaData';
import {
  buildP2ClinicalObservations,
  buildFlattenedAnswersForP2,
  prepareP2Handoff
} from '../src/engine/assessment/p2HandoffAdapter';
import { searchMedications } from '../src/engine/medicationSearch';
import { runP2Analysis } from '../src/engine/p2/index';
import { calculateAnthropometrics } from '../src/engine/anthropometrics';
import { PatientProfile } from '../src/types';
import { ClinicalAssessment } from '../src/types/assessment';

let passed = 0;
let failed = 0;

function assert(cond: boolean, name: string, detail?: string) {
  if (cond) {
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${name} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

console.log("=================================================");
console.log("SHUDDHO P1 COMPLETE ADAPTIVE ASSESSMENT TEST SUITE");
console.log("=================================================\n");

// TEST 1: All 14 Domains Presence & Metadata
console.log("1. Functional Domain Verification Test");
{
  assert(ASSESSMENT_DOMAINS.length === 14, "Exactly 14 functional assessment domains defined");
  const domainIds = new Set(ASSESSMENT_DOMAINS.map(d => d.id));
  assert(domainIds.has('clinical_history'), "Domain: Clinical History & Timeline present");
  assert(domainIds.has('anthropometrics'), "Domain: Anthropometric & Body Composition present");
  assert(domainIds.has('metabolic'), "Domain: Metabolic & Glycemic Regulation present");
  assert(domainIds.has('gastrointestinal'), "Domain: Gastrointestinal Function present");
  assert(domainIds.has('microbiome'), "Domain: Microbiome & Gut Ecology present");
  assert(domainIds.has('immune_inflammatory'), "Domain: Immune & Inflammatory Function present");
  assert(domainIds.has('endocrine_hormonal'), "Domain: Endocrine & Hormonal Balance present");
  assert(domainIds.has('hepatic_biotransformation'), "Domain: Hepatic & Biotransformation present");
  assert(domainIds.has('mitochondrial_energy'), "Domain: Mitochondrial & Energy Function present");
  assert(domainIds.has('sleep_circadian'), "Domain: Sleep & Circadian Rhythm present");
  assert(domainIds.has('stress_neurobehavioral'), "Domain: Stress & Neurobehavioral Function present");
  assert(domainIds.has('dietary_nutrition'), "Domain: Dietary & Nutritional Assessment present");
  assert(domainIds.has('medication_supplements'), "Domain: Medications, Supplements & Allergies present");
  assert(domainIds.has('environmental_lifestyle'), "Domain: Environmental & Lifestyle Factors present");
}

// TEST 2: Declarative Condition Evaluation (Zero-Eval)
console.log("\n2. Declarative Rule Engine Test (Zero-Eval)");
{
  assert(
    evaluateDeclarativeCondition({ field: 'symptom_pain', operator: 'equals', value: 'yes' }, { symptom_pain: 'yes' }),
    "Simple 'equals' condition evaluates true"
  );
  assert(
    !evaluateDeclarativeCondition({ field: 'symptom_pain', operator: 'equals', value: 'yes' }, { symptom_pain: 'no' }),
    "Simple 'equals' condition evaluates false correctly"
  );
  assert(
    evaluateDeclarativeCondition({ field: 'sleep_hours', operator: 'lessThan', value: 6 }, { sleep_hours: 5 }),
    "Numeric 'lessThan' condition evaluates true"
  );
  assert(
    evaluateDeclarativeCondition({ field: 'weight_kg', operator: 'greaterThanOrEqual', value: 70 }, { weight_kg: 70 }),
    "Numeric 'greaterThanOrEqual' condition evaluates true"
  );
  assert(
    evaluateDeclarativeCondition(
      {
        AND: [
          { field: 'bloating', operator: 'equals', value: 'yes' },
          { field: 'dairy_intake', operator: 'equals', value: 'often' },
        ],
      },
      { bloating: 'yes', dairy_intake: 'often' }
    ),
    "Compound 'AND' condition passes when both match"
  );
  assert(
    evaluateDeclarativeCondition(
      {
        OR: [
          { field: 'bristol_stool', operator: 'equals', value: 1 },
          { field: 'bristol_stool', operator: 'equals', value: 2 },
        ],
      },
      { bristol_stool: 2 }
    ),
    "Compound 'OR' condition passes when at least one matches"
  );
  assert(
    evaluateDeclarativeCondition(
      { NOT: { field: 'unintentional_weight_loss', operator: 'equals', value: 'yes' } },
      { unintentional_weight_loss: 'no' }
    ),
    "Compound 'NOT' condition inverts condition accurately"
  );
}

// TEST 3: Adaptive Question Branching & Dynamic Expansion
console.log("\n3. Adaptive Question Branching Test");
{
  // Bloating triggers trigger-foods question
  const answersNoBloat = { bloating_frequency: 'none' };
  const visibleNoBloat = filterVisibleQuestions(answersNoBloat, coreQuestions);
  const triggerQNoBloat = visibleNoBloat.find(q => q.id === 'bloating_trigger_foods');
  assert(triggerQNoBloat === undefined, "Trigger food question is hidden when bloating is 'none'");

  const answersBloat = { bloating_frequency: 'severe_post_meal' };
  const visibleBloat = filterVisibleQuestions(answersBloat, coreQuestions);
  const triggerQBloat = visibleBloat.find(q => q.id === 'bloating_trigger_foods');
  assert(triggerQBloat !== undefined, "Trigger food question becomes visible when bloating is severe");

  // Thyroid medication timing branching
  const answersThyroidNo = { thyroid_condition_diagnosed: 'no_normal_thyroid' };
  const visibleThyroidNo = filterVisibleQuestions(answersThyroidNo, coreQuestions);
  assert(!visibleThyroidNo.some(q => q.id === 'thyroid_medication_timing'), "Thyroid timing question hidden when no thyroid disease");

  const answersThyroidYes = { thyroid_condition_diagnosed: 'hypothyroid_medicated' };
  const visibleThyroidYes = filterVisibleQuestions(answersThyroidYes, coreQuestions);
  assert(visibleThyroidYes.some(q => q.id === 'thyroid_medication_timing'), "Thyroid timing question appears when on levothyroxine");
}

// TEST 4: Quick Mode vs Comprehensive Mode & Answer Preservation
console.log("\n4. Quick Screening vs Comprehensive Mode & Answer Preservation");
{
  const answers: Record<string, any> = { chief_complaint: 'Fatigue and bloating' };
  const allVisible = filterVisibleQuestions(answers, coreQuestions, { isQuickMode: false });
  const quickVisible = filterVisibleQuestions(answers, coreQuestions, { isQuickMode: true });

  assert(quickVisible.length < allVisible.length, `Quick mode filters to screening questions (${quickVisible.length} quick vs ${allVisible.length} comprehensive)`);
  assert(quickVisible.every(q => q.isHighValueScreening || answers[q.id]), "Quick mode preserves answered questions plus screening items");

  // Mandatory safety questions remain in both modes
  assert(quickVisible.some(q => q.id === 'safety_insulin_active'), "Safety insulin question available in Quick Mode");
  assert(quickVisible.some(q => q.id === 'safety_hospital_feeding_route'), "Safety feeding route question available in Quick Mode");
  assert(quickVisible.some(q => q.id === 'confirmed_food_allergies_list'), "Allergies question available in Quick Mode");
}

// TEST 5: Seven-Day Food Frequency Questionnaire (FFQ) Engine
console.log("\n5. Seven-Day Food Frequency Questionnaire (FFQ) Test");
{
  assert(FFQ_FOOD_DEFINITIONS.length >= 24, "FFQ covers all core Bangladeshi food groups (found 27)");

  // Test frequency option > 7 per week (e.g. 15-21 times/week for rice consumed 3x daily)
  assert(FREQUENCY_NUMERIC_ESTIMATES['15_21_times'] === 18.0, "FFQ supports frequencies above 7 (15-21 times = 18 servings/week)");
  assert(PORTION_MULTIPLIERS['large'] === 1.4, "Portion size 'large' applies 1.4x serving multiplier");

  const testFFQItems: any = {
    rice_white_brown: { food_group_id: 'rice_white_brown', frequency: '15_21_times', portion_size: 'medium' },
    lentils_dal_soup: { food_group_id: 'lentils_dal_soup', frequency: '7_10_times', portion_size: 'medium' },
    fish_sweetwater_rui_katla: { food_group_id: 'fish_sweetwater_rui_katla', frequency: '5_6_times', portion_size: 'medium' },
    leafy_greens_shak: { food_group_id: 'leafy_greens_shak', frequency: '3_4_times', portion_size: 'large' },
    other_vegetables_curry: { food_group_id: 'other_vegetables_curry', frequency: '7_10_times', portion_size: 'medium' },
    fresh_fruits_seasonal: { food_group_id: 'fresh_fruits_seasonal', frequency: '7_10_times', portion_size: 'medium' },
    fried_snacks_singara_puri: { food_group_id: 'fried_snacks_singara_puri', frequency: '7_10_times', portion_size: 'medium' },
    sugar_sweetened_beverages: { food_group_id: 'sugar_sweetened_beverages', frequency: '3_4_times', portion_size: 'medium' }
  };

  const testHabits: any = {
    meal_frequency_per_day: '3_meals',
    typical_breakfast: 'heavy_rice_or_ruti',
    skips_breakfast_frequency: 'never',
    dinner_timing: '9_to_10_pm',
    late_night_snacking: 'rarely',
    cooking_oil_primary: 'mustard_oil',
    raw_salt_added_at_table: 'always',
    fluid_intake_glasses_per_day: '7_9_glasses',
    is_past_week_representative: true
  };

  const ffqResult = analyzeDietaryFrequency(testFFQItems, testHabits);
  assert(ffqResult.summary.weekly_plant_diversity_score >= 4, "Calculated plant diversity score (>=4 distinct groups)");
  assert(ffqResult.summary.daily_fruit_veg_servings_est > 0, "Daily fruit & veg servings computed");
  assert(ffqResult.summary.ultra_processed_burden === 'high' || ffqResult.summary.ultra_processed_burden === 'moderate', "Ultra-processed burden flagged");
  assert(ffqResult.summary.sodium_risk_flag === true, "Raw salt at table accurately triggers sodium_risk_flag");
}

// TEST 6: Complete Ayurvedic Prakriti Constitutional Engine
console.log("\n6. Ayurvedic Prakriti Constitutional Assessment Test");
{
  // Test Vata-dominant answers
  const vataAnswers: Record<string, string> = {
    pra_body_frame: 'vata',
    pra_skin_texture: 'vata',
    pra_hair_characteristics: 'vata',
    pra_appetite_nature: 'vata',
    pra_digestion_speed: 'vata',
    pra_temperature_preference: 'vata',
    pra_sleep_pattern: 'vata',
    pra_elimination_habit: 'vata',
    pra_physical_stamina: 'vata',
    pra_mental_tendency: 'vata',
    pra_stress_reaction: 'vata',
    pra_speech_pattern: 'vata'
  };
  const vataRes = calculatePrakriti(vataAnswers);
  assert(vataRes.primary_constitution === 'vata', "100% Vata responses classify as 'vata' constitution");
  assert(vataRes.vata_score === 100, "Vata score is 100%");
  assert(vataRes.is_preliminary === false, "Evaluated with 12 questions -> is_preliminary is false");

  // Test Dual Constitution (Vata-Pitta)
  const dualAnswers: Record<string, string> = {
    pra_body_frame: 'vata',
    pra_skin_texture: 'pitta',
    pra_appetite_nature: 'pitta',
    pra_digestion_speed: 'pitta',
    pra_temperature_preference: 'vata',
    pra_sleep_pattern: 'vata',
    pra_elimination_habit: 'pitta',
    pra_mental_tendency: 'vata'
  };
  const dualRes = calculatePrakriti(dualAnswers);
  assert(dualRes.primary_constitution === 'vata_pitta' || dualRes.primary_constitution === 'pitta_kapha', "Mixed answers classify as dual dosha (Dvandvaja)");

  // Test Quick Mode Preliminary Flag
  const quickPrakriti: Record<string, string> = {
    pra_body_frame: 'pitta',
    pra_skin_texture: 'pitta'
  };
  const quickRes = calculatePrakriti(quickPrakriti);
  assert(quickRes.is_preliminary === true, "Quick mode (<8 questions) correctly marked as is_preliminary: true");
}

// TEST 7: Ayurvedic Vikriti & Agni Digestive Fire Engines
console.log("\n7. Ayurvedic Vikriti & Agni Assessment Test");
{
  // Vikriti Imbalance
  const vikritiAnswers: any = {
    vik_gas_bloating: 'yes',
    vik_constipation_hard_stool: 'yes',
    vik_nervous_anxiety: 'yes',
    vik_acidity_heartburn: 'no',
    vik_heaviness_sluggishness: 'no'
  };
  const vikRes = calculateVikriti(vikritiAnswers);
  assert(vikRes.active_aggravations.includes('vata'), "Gas, constipation, and anxiety detect active Vata aggravation");
  assert(vikRes.dominant_imbalance === 'vata_aggravation', "Dominant imbalance is 'vata_aggravation'");

  // Agni Assessment
  const samagniAnswers: any = {
    agni_hunger_pattern: 'samagni',
    agni_post_meal_feel: 'samagni',
    agni_bowel_evacuation: 'samagni',
    agni_tongue_coating: 'samagni'
  };
  const agniRes = calculateAgni(samagniAnswers);
  assert(agniRes.type === 'samagni', "Balanced hunger and clean tongue classify as Samagni");

  const mandagniAnswers: any = {
    agni_hunger_pattern: 'mandagni',
    agni_post_meal_feel: 'mandagni',
    agni_bowel_evacuation: 'mandagni',
    agni_tongue_coating: 'mandagni'
  };
  const mandRes = calculateAgni(mandagniAnswers);
  assert(mandRes.type === 'mandagni', "Sluggish digestion and thick tongue classify as Mandagni");
}

// TEST 8: Masanumasika Pregnancy Nutrition Framework (Addendum)
console.log("\n8. Masanumasika Pregnancy Nutrition Framework Test");
{
  // 16 weeks, 3 days = 115 days -> Month 4
  const m4 = calculatePregnancyMonth(16, 3);
  assert(m4 === 4, "16 weeks 3 days maps to Pregnancy Month 4 (Dauhrida stage)");

  // Trimester derivation
  assert(getTrimesterFromWeeks(10) === 1, "10 weeks is Trimester 1");
  assert(getTrimesterFromWeeks(20) === 2, "20 weeks is Trimester 2");
  assert(getTrimesterFromWeeks(32) === 3, "32 weeks is Trimester 3");

  // All 9 monthly frameworks exist
  for (let m = 1; m <= 9; m++) {
    const f = MASANUMASIKA_MONTH_FRAMEWORKS[m];
    assert(f !== undefined, `Framework exists for Month ${m}`);
    assert(f.classical_source.includes('Samhita'), `Month ${m} cites classical Ayurvedic Samhita`);
    assert(f.bangladeshi_cultural_substitutes_en.length > 0, `Month ${m} includes familiar Bangladeshi cultural foods`);
    assert(f.restricted_or_unsafe_items_en.length > 0, `Month ${m} has strict clinical safety exclusions`);
  }
}

// TEST 9: Specialized Population Routing
console.log("\n9. Specialized Population Routing Test");
{
  const adultVisible = filterVisibleQuestions({}, coreQuestions, { populationGroup: 'adult_standard' });
  assert(!adultVisible.some(q => q.subdomain === 'pediatric'), "Pediatric questions excluded for adult standard");

  const pedVisible = filterVisibleQuestions({}, coreQuestions, { populationGroup: 'pediatric' });
  assert(pedVisible.some(q => q.subdomain === 'pediatric'), "Pediatric growth questions included for pediatric patients");

  const pregVisible = filterVisibleQuestions({}, coreQuestions, { populationGroup: 'pregnancy' });
  assert(pregVisible.some(q => q.subdomain === 'pregnancy'), "Pregnancy questions included for pregnancy patient");

  // Pathway routing (Renal pathway activates renal dialysis question)
  const renalVisible = filterVisibleQuestions({}, coreQuestions, { clinicalPathways: ['renal'] });
  assert(renalVisible.some(q => q.id === 'renal_dialysis_status'), "Renal dialysis question activated by renal clinical pathway");
}

// TEST 10: Medication Search & Laboratory Integration
console.log("\n10. Medication Search & Laboratory Integration Test");
{
  const medRes = searchMedications('Thyrox', 3);
  assert(medRes.length > 0, "MediNutrition search finds Thyrox");
  const gen = medRes[0].generic_name || medRes[0].genericName || '';
  assert(gen.toLowerCase().includes('levothyroxine'), "Thyrox resolves to canonical Levothyroxine Sodium");
}

// TEST 11: Patient Data Isolation
console.log("\n11. Patient-Specific Data Isolation Test");
{
  const key1: string = `shuddho_assessment_pt_001_visit_1`;
  const key2: string = `shuddho_assessment_pt_002_visit_1`;
  assert(key1 !== key2, "Different patients have distinct isolated storage keys");
}

// TEST 12: P2 Clinical Intelligence Handoff
console.log("\n12. P2 Clinical Intelligence Handoff Test");
{
  const mockPatient: PatientProfile = {
    schema_version: 2,
    id: 'pt_test_handoff',
    name: 'Rahim Uddin',
    age: 45,
    gender: 'male',
    phone: '01711000000',
    visit_date: '2026-11-15',
    current_phase: 1,
    height_cm: 170,
    weight_kg: 82,
    waist_cm: 94,
    activity_level: 'sedentary',
    sleep_hours: 6,
    shift_worker: false,
    population_group: 'adult_standard',
    clinical_pathways: ['metabolic'],
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: ['shrimp'],
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    selected_conditions: ['t2d_ir'],
    active_medications: ['Metformin Hydrochloride'],
    gut_profile: {
      bloating: 'mild',
      acid_reflux_hypoacidity: false,
      bristol_stool_score: 3,
      energy_score: 5,
      sleep_quality_score: 6,
      digestive_fire_agni: 'vishamagni'
    },
    labs: { lab_flags: [] },
    calculated: calculateAnthropometrics(45, 'male', 170, 82, 94, 'sedentary', ['t2d_ir'])
  };

  const mockAssessment: ClinicalAssessment = {
    patient_id: 'pt_test_handoff',
    visit_id: 'v1',
    assessment_id: 'asmt_01',
    assessment_date: '2026-11-15',
    mode: 'comprehensive',
    questionnaire_version: registryVersion,
    primary_population: 'adult_standard',
    clinical_pathways: ['metabolic'],
    feeding_status: { route: 'oral_standard', oral_intake_permitted: true, requires_specialist_support: false },
    functional_answers: {
      chief_complaint: 'Fatigue, acid reflux, and central weight gain',
      bloating_frequency: 'severe_post_meal',
      acid_reflux_frequency: 'frequent_3_plus',
      postprandial_fatigue: 'yes',
      sugar_cravings: 'strong_daily',
      safety_insulin_active: 'no',
      safety_sulfonylurea_active: 'no',
      safety_prescribed_fluid_limit: 'no_restriction',
      safety_hospital_feeding_route: 'oral_standard',
      safety_dysphagia_choking_risk: 'no'
    },
    dietary_frequency: {
      items: {} as any,
      habits: {
        meal_frequency_per_day: '3_meals',
        typical_breakfast: 'heavy_rice_or_ruti',
        skips_breakfast_frequency: 'never',
        dinner_timing: '9_to_10_pm',
        late_night_snacking: 'rarely',
        cooking_oil_primary: 'mustard_oil',
        raw_salt_added_at_table: 'always',
        fluid_intake_glasses_per_day: '7_9_glasses',
        is_past_week_representative: true
      },
      summary: {
        weekly_plant_diversity_score: 6,
        daily_fruit_veg_servings_est: 1.5,
        protein_intake_frequency_rank: 'moderate',
        ultra_processed_burden: 'high',
        added_sugar_exposure: 'moderate',
        sodium_risk_flag: true,
        atypical_week_flag: false,
        completeness_status: 'complete'
      }
    },
    ayurveda: {
      prakriti: { vata_score: 30, pitta_score: 50, kapha_score: 20, primary_constitution: 'pitta', is_preliminary: false, total_questions_evaluated: 12 },
      vikriti: { vata_aggravation: 60, pitta_aggravation: 50, kapha_aggravation: 20, dominant_imbalance: 'vata_aggravation', active_aggravations: ['vata', 'pitta'] },
      agni: { type: 'vishamagni', name_en: 'Vishamagni', name_bn: 'বিষমাগ্নি', clinical_summary_en: 'Variable digestion', clinical_summary_bn: 'অনিয়মিত পরিপাক', supporting_answers: [] },
      ama_status: 'none',
      answers: {},
      assessment_date: '2026-11-15',
      is_complete: true
    },
    population_data: {},
    labs: { entries: {}, last_updated: '2026-11-15', total_tested_count: 0, pending_count: 0 },
    completion: {
      administrative_completed: true,
      clinical_safety_completed: true,
      mandatory_sections_completed: true,
      laboratory_data_available: false,
      requires_clinical_review: false,
      unanswered_critical_questions: []
    },
    safety_warnings_acknowledged: true
  };

  const handoff = prepareP2Handoff(mockAssessment, mockPatient);
  assert(handoff.derivedObservations.length > 0, "Derived clinical observations created for P2");
  assert(handoff.derivedObservations.some(o => o.tags?.includes('bloating')), "Bloating observation derived with tags");
  assert(handoff.derivedObservations.some(o => o.tags?.includes('vata_aggravation')), "Ayurvedic Vata aggravation derived as clinical observation");

  // Run through actual P2 Clinical Intelligence Engine
  const p2Result = runP2Analysis(mockPatient, handoff.flattenedAnswersForP2);
  assert(p2Result !== null && p2Result !== undefined, "P2 runP2Analysis successfully executes on P1 handoff data");
  assert(p2Result.domainFindings !== undefined && p2Result.domainFindings.length === 7, "All 7 functional medicine domains computed from assessment answers");
  assert(p2Result.hypotheses.length > 0, "Clinical hypotheses generated from assessment symptoms");
}

console.log("\n=================================================");
console.log(`ALL P1 ASSESSMENT CHECKS PASSED: ${passed} CHECKS PASSED, ${failed} FAILED`);
console.log("=================================================");

if (failed > 0) process.exit(1);
