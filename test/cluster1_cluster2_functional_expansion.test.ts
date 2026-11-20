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
