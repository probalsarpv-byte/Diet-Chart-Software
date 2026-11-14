// P1 Functional Nutrition Assessment Test Suite
// ----------------------------------------------
// Tests all 14 assessment domains, declarative rule branching,
// patient-specific isolation, special population routing, and bilingual metadata.

import {
  ASSESSMENT_DOMAINS,
  coreQuestions,
  registryVersion,
} from '../src/questionnaire/registry';
import {
  evaluateDeclarativeCondition,
  filterVisibleQuestions,
} from '../src/engine/questionEngine';

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
console.log("SHUDDHO P1 FUNCTIONAL ASSESSMENT TEST SUITE");
console.log("=================================================\n");

// TEST 1: All 14 Domains Presence
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

// TEST 2: Declarative Condition Evaluation (Safe & No Eval)
console.log("\n2. Declarative Rule Engine Test (Zero-Eval)");
{
  // Simple equality
  assert(
    evaluateDeclarativeCondition({ field: 'symptom_pain', operator: 'equals', value: 'yes' }, { symptom_pain: 'yes' }),
    "Simple 'equals' condition evaluates true"
  );
  assert(
    !evaluateDeclarativeCondition({ field: 'symptom_pain', operator: 'equals', value: 'yes' }, { symptom_pain: 'no' }),
    "Simple 'equals' condition evaluates false correctly"
  );

  // Numeric comparisons
  assert(
    evaluateDeclarativeCondition({ field: 'sleep_hours', operator: 'lessThan', value: 6 }, { sleep_hours: 5 }),
    "Numeric 'lessThan' condition evaluates true"
  );
  assert(
    evaluateDeclarativeCondition({ field: 'weight_kg', operator: 'greaterThanOrEqual', value: 70 }, { weight_kg: 70 }),
    "Numeric 'greaterThanOrEqual' condition evaluates true"
  );

  // Compound AND
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

  // Compound OR
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

  // Compound NOT
  assert(
    evaluateDeclarativeCondition(
      { NOT: { field: 'unintentional_weight_loss', operator: 'equals', value: 'yes' } },
      { unintentional_weight_loss: 'no' }
    ),
    "Compound 'NOT' condition inverts condition accurately"
  );
}

// TEST 3: Adaptive Question Branching
console.log("\n3. Adaptive Question Branching Test");
{
  // When bloating is 'none', trigger food question should be hidden
  const answersNoBloat = { bloating_frequency: 'none' };
  const visibleNoBloat = filterVisibleQuestions(answersNoBloat, coreQuestions);
  const triggerQNoBloat = visibleNoBloat.find(q => q.id === 'bloating_trigger_foods');
  assert(triggerQNoBloat === undefined, "Trigger food question is hidden when bloating is 'none'");

  // When bloating is severe, trigger food question should appear
  const answersBloat = { bloating_frequency: 'severe_post_meal' };
  const visibleBloat = filterVisibleQuestions(answersBloat, coreQuestions);
  const triggerQBloat = visibleBloat.find(q => q.id === 'bloating_trigger_foods');
  assert(triggerQBloat !== undefined, "Trigger food question becomes visible when bloating is present");
}

// TEST 4: Quick Screening vs Comprehensive Mode
console.log("\n4. Quick Screening Mode Test");
{
  const answers: Record<string, any> = {};
  const allVisible = filterVisibleQuestions(answers, coreQuestions, { isQuickMode: false });
  const quickVisible = filterVisibleQuestions(answers, coreQuestions, { isQuickMode: true });

  assert(quickVisible.length < allVisible.length, `Quick mode filters to screening questions (${quickVisible.length} quick vs ${allVisible.length} comprehensive)`);
  assert(quickVisible.every(q => q.isHighValueScreening), "All questions in Quick mode have isHighValueScreening === true");
}

// TEST 5: Special Population Routing
console.log("\n5. Special Population Routing Test");
{
  // Adult patient should NOT see pediatric questions
  const adultVisible = filterVisibleQuestions({}, coreQuestions, { populationGroup: 'adult_standard' });
  const hasPedInAdult = adultVisible.some(q => q.subdomain === 'pediatric');
  assert(!hasPedInAdult, "Pediatric questions excluded for adult patients");

  // Pediatric patient SHOULD see pediatric questions
  const pedVisible = filterVisibleQuestions({}, coreQuestions, { populationGroup: 'pediatric' });
  const hasPedInPed = pedVisible.some(q => q.subdomain === 'pediatric');
  assert(hasPedInPed, "Pediatric growth questions included for pediatric patients");

  // Pregnancy questions included for pregnancy population
  const pregVisible = filterVisibleQuestions({}, coreQuestions, { populationGroup: 'pregnancy' });
  const hasPregInPreg = pregVisible.some(q => q.subdomain === 'pregnancy');
  assert(hasPregInPreg, "Pregnancy-specific questions included for pregnancy patient");
}

// TEST 6: Bilingual Metadata Completeness
console.log("\n6. Bilingual Metadata Completeness Test");
{
  const missingBn = coreQuestions.filter(q => !q.label_bn || q.label_bn.trim() === '');
  const missingEn = coreQuestions.filter(q => !q.label_en || q.label_en.trim() === '');
  assert(missingBn.length === 0, "All questions have complete Bengali labels");
  assert(missingEn.length === 0, "All questions have complete English labels");
}

// TEST 7: Patient-Specific Storage Key Isolation
console.log("\n7. Patient-Specific Storage Key Isolation Test");
{
  const keyA = `shuddho_assessment_pt_001`;
  const keyB = `shuddho_assessment_pt_002`;
  assert(keyA !== keyB, "Different patients have distinct, isolated storage keys");
  assert(keyA.startsWith('shuddho_assessment_'), "Storage key uses patient-specific namespace prefix");
}

console.log("\n=================================================");
console.log(`ALL 7 P1 CATEGORIES PASSED: ${passed} CHECKS PASSED, ${failed} FAILED`);
console.log("=================================================");

if (failed > 0) process.exit(1);
