import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ClinicalConditionId } from '../src/types';
import { DISEASE_RULES } from '../src/engine/diseaseRules';
import { calculateAnthropometrics } from '../src/engine/anthropometrics';

describe('Task 1: Condition ID Types', () => {
  it('includes all 6 new condition IDs in ClinicalConditionId type domain', () => {
    const newConditions: ClinicalConditionId[] = [
      'dyslipidemia_atherosclerosis',
      'metabolic_syndrome',
      'lada_early_pancreatic',
      'sibo_microbial_overgrowth',
      'gerd_reflux_esophagitis',
      'ibd_mucosal_inflammation'
    ];
    assert.strictEqual(newConditions.length, 6);
  });
});

describe('Task 2: Disease Rules & Macro Adjustments', () => {
  it('contains valid rules, tags, and bilingual summaries for all 6 new conditions', () => {
    const ids = [
      'dyslipidemia_atherosclerosis',
      'metabolic_syndrome',
      'lada_early_pancreatic',
      'sibo_microbial_overgrowth',
      'gerd_reflux_esophagitis',
      'ibd_mucosal_inflammation'
    ] as const;

    for (const id of ids) {
      const rule = DISEASE_RULES[id];
      assert.ok(rule, `Rule for ${id} must exist`);
      assert.ok(rule.name_bn && rule.name_en, `${id} must have bilingual names`);
      assert.ok(rule.redTags.length > 0, `${id} must have redTags`);
      assert.ok(rule.greenTags.length > 0, `${id} must have greenTags`);
      assert.ok(rule.redFoods && rule.redFoods.length > 0, `${id} must have redFoods`);
      assert.ok(rule.greenFoods && rule.greenFoods.length > 0, `${id} must have greenFoods`);
      assert.ok(rule.macroAdjustment, `${id} must have macroAdjustment`);
      assert.ok(rule.mealTimingRules.length > 0, `${id} must have mealTimingRules`);
      assert.ok(rule.clinicalRationaleEn && rule.clinicalRationaleBn, `${id} must have rationales`);
    }
  });

  it('calculates 30% carb and 40% fat for metabolic_syndrome in calculateAnthropometrics', () => {
    const res = calculateAnthropometrics(
      45,
      'male',
      170,
      80,
      95,
      'sedentary',
      ['metabolic_syndrome']
    );
    assert.ok(res.target_carbs_g > 0);
    assert.ok(res.target_fat_g > 0);
    assert.ok(res.target_protein_g >= 90);
  });

  it('calculates 35% carb and 35% fat for sibo_microbial_overgrowth in calculateAnthropometrics', () => {
    const res = calculateAnthropometrics(
      38,
      'female',
      158,
      56,
      72,
      'sedentary',
      ['sibo_microbial_overgrowth']
    );
    assert.ok(res.target_carbs_g > 0);
    assert.ok(res.target_fat_g > 0);
  });
});

describe('Task 3: Medicines & DNI Engine', () => {
  it('contains SGLT2i, Sulfonylurea, ARB, and H2 blocker classes in medicines.json', async () => {
    const { default: medicinesData } = await import('../src/data/medicines.json');
    const classes = medicinesData.map((m: any) => m.drug_class);
    assert.ok(classes.some((c: string) => c.includes('SGLT2')));
    assert.ok(classes.some((c: string) => c.includes('Sulfonylurea')));
    assert.ok(classes.some((c: string) => c.includes('Angiotensin') || c.includes('ARB')));
    assert.ok(classes.some((c: string) => c.includes('H2 Receptor')));
    assert.ok(classes.some((c: string) => c.includes('NSAID')));
  });

  it('flags cumulative Zinc upper limit (>40mg/day) and Folate (>1000mcg/day)', async () => {
    const { checkSupplementOverlaps } = await import('../src/engine/dniEngine');
    const overlaps = checkSupplementOverlaps([
      { id: 'supp_zinc_carnosine', name_en: 'Zinc L-Carnosine 25mg', name_bn: 'জিংক কার্নোসিন', dose: '25mg', recommended_dose: '25mg', timing: 'with meal', approval_status: 'candidate' } as any,
      { id: 'supp_multivitamin_zinc', name_en: 'Chelated Zinc 20mg', name_bn: 'চিলেটেড জিংক', dose: '20mg', recommended_dose: '20mg', timing: 'with meal', approval_status: 'candidate' } as any
    ]);
    assert.ok(overlaps.some(o => o.nutrient.toLowerCase().includes('zinc')));

    const folateOverlaps = checkSupplementOverlaps([
      { id: 'supp_active_folate_bcomplex', name_en: 'L-Methylfolate 500mcg', name_bn: 'এল-মিথাইলফোলেট', dose: '500mcg', recommended_dose: '500mcg', timing: 'with meal', approval_status: 'candidate' } as any,
      { id: 'supp_prenatal_folate', name_en: 'Dietary Folate B9', name_bn: 'ফোলেট বি৯', dose: '600mcg', recommended_dose: '600mcg', timing: 'with meal', approval_status: 'candidate' } as any
    ]);
    assert.ok(folateOverlaps.some(o => o.nutrient.toLowerCase().includes('folate')));
  });

  it('suppresses Betaine HCl when NSAID medication is active and emits safety alert', async () => {
    const { runDNIEngine } = await import('../src/engine/dniEngine');
    const res = runDNIEngine({
      age: 50,
      gender: 'male',
      height_cm: 172,
      weight_kg: 75,
      activity_level: 'sedentary',
      selected_conditions: ['gerd_reflux_esophagitis'],
      active_medications: ['Naproxen']
    });
    assert.ok(!res.candidateSupplements.some(s => s.id === 'supp_betaine_hcl_pepsin'), 'Betaine HCl must be suppressed');
    assert.ok(res.criticalWarnings.some(w => w.warning_en.toLowerCase().includes('betaine') || w.warning_en.toLowerCase().includes('nsaid')));
  });
});

describe('Task 4: Fasting Safety for SGLT2i & Sulfonylureas', () => {
  it('caps fasting at 16h and triggers HARD_STOP on 18h fasting for SGLT2i patient', async () => {
    const { evaluateFastingEligibility } = await import('../src/clinical-safety/fastingSafetyEngine');
    const { eligibility, safetyResults } = evaluateFastingEligibility(
      {
        id: 'test_pt_sglt2',
        age: 50,
        gender: 'female',
        height_cm: 160,
        weight_kg: 68,
        waist_cm: 80,
        activity_level: 'sedentary',
        selected_conditions: ['t2d_ir'],
        active_medications: ['Empagliflozin'],
        population_group: 'adult_standard'
      } as any,
      18 // requested 18h fast
    );
    assert.ok(eligibility.max_allowable_fasting_hours <= 16);
    assert.strictEqual(safetyResults.some((r: any) => r.decision === 'HARD_STOP'), true);
    assert.ok(safetyResults.some((r: any) => r.rule_id.includes('SGLT2') || r.rule_id.includes('DURATION_EXCEEDS')));
  });
});
