/**
 * SHUDDHO FUNCTIONAL NUTRITION SOFTWARE
 * Medication-Nutrition Clinical Safety Engine (Phase P0 Foundation)
 * 
 * Evaluates active medications against proposed meals, fasting schedules,
 * carbohydrate distribution, and nutrient depletions.
 * Implements high-priority clinical rules for insulin, sulfonylureas, SGLT2i,
 * RAAS blockers, warfarin, levothyroxine, and unknown medication behavior.
 */

import { PatientProfile, DietChartMeal, ClinicalSafetyResult } from '../types';
import { PRIORITY_MEDICATION_SAFETY_RULES } from './safetyRuleRegistry';
import { searchMedications } from '../engine/medicationSearch';

export function evaluateMedicationSafety(
  patient: PatientProfile,
  meals: DietChartMeal[],
  plannedFastingHours?: number
): ClinicalSafetyResult[] {
  const results: ClinicalSafetyResult[] = [];
  const activeMeds = (patient.active_medications || []).map(m => m.toLowerCase().trim());

  if (activeMeds.length === 0) {
    return results;
  }

  // Calculate total planned carbohydrates
  const totalCarbsG = meals.reduce((sum, m) => sum + (m.meal_carbs_g || 0), 0);
  const fastingHours = plannedFastingHours || 0;

  for (const medString of activeMeds) {
    // 1. Resolve medicine against MediNutrition corpus
    const searchMatch = searchMedications(medString, 1)[0];
    const resolvedGeneric = (searchMatch?.generic_name || medString).toLowerCase();

    // 2. Check Unknown / Uncovered Medication Status (Section 6.4)
    if (searchMatch && searchMatch.rule_coverage_status === 'no_rules_available') {
      results.push({
        rule_id: 'MED_UNKNOWN_INTERACTION_REVIEW',
        rule_version: '1.0.0',
        patient_id: patient.id,
        decision: 'CLINICAL_REVIEW_REQUIRED',
        severity: 'medium',
        title_en: `Incomplete Interaction Knowledge: ${searchMatch.name}`,
        title_bn: `ইন্টারঅ্যাকশন তথ্য অসম্পূর্ণ: ${searchMatch.name}`,
        clinical_explanation_en: `Medication '${searchMatch.name}' (${searchMatch.generic_name}) was identified in the Bangladesh pharmaceutical corpus, but clinical nutrition interaction coverage is incomplete. The software cannot assume it is interaction-free.`,
        clinical_explanation_bn: `'${searchMatch.name}' বাংলাদেশের ওষুধ ডাটাবেসে শনাক্ত হয়েছে, কিন্তু পুষ্টিগত ইন্টারঅ্যাকশন তথ্য অসম্পূর্ণ। এটি পার্শ্বপ্রতিক্রিয়াহীন হিসেবে ধরে নেওয়া যাবে না।`,
        required_action_en: 'Review patient prescription and evaluate whether dietary intervention or supplement timing requires manual clinical coordination.',
        required_action_bn: 'খাদ্যতালিকায় অন্তর্ভুক্তির পূর্বে চিকিৎসকের পরামর্শ ও প্রেসক্রিপশন পর্যালোচনা করুন।',
        affected_entity: {
          type: 'medicine',
          id: medString,
          name_en: searchMatch.name,
          name_bn: searchMatch.name
        },
        triggering_observations: [`active_medication:${medString}`],
        clinician_review_required: true,
        provenance_reference: 'Section 6.4: Uncovered Medication Clinical Governance Protocol',
        timestamp: new Date().toISOString()
      });
    }

    // 3. Match against Priority Rules
    for (const rule of PRIORITY_MEDICATION_SAFETY_RULES) {
      const matchesRule = rule.generic_patterns.some(pat => 
        resolvedGeneric.includes(pat) || medString.includes(pat)
      );

      if (!matchesRule) continue;

      // ── Rule A: Insulin Safety ──────────────────────────────────
      if (rule.id === 'MED_INSULIN_SAFETY') {
        // Fasting conflict
        if (fastingHours >= 14) {
          results.push({
            rule_id: 'INSULIN_FASTING_STOP',
            rule_version: '1.0.0',
            patient_id: patient.id,
            decision: 'HARD_STOP',
            severity: 'critical',
            title_en: 'Insulin Safety Block: Prolonged Fasting Contraindicated',
            title_bn: 'ইনসুলিন সতর্কতা: দীর্ঘ উপবাস সম্পূর্ণ নিষিদ্ধ',
            clinical_explanation_en: `Patient is prescribed insulin and proposed fasting duration is ${fastingHours} hours. Unsupervised fasting with exogenous insulin causes life-threatening hypoglycemia.`,
            clinical_explanation_bn: `রোগী ইনসুলিন নিচ্ছেন এবং ${fastingHours} ঘণ্টা উপবাসের পরিকল্পনা করা হয়েছে। এটি মারাত্মক হাইপোগ্লাইসেমিয়া ঘটাতে পারে।`,
            required_action_en: 'Prolonged intermittent fasting is blocked. Transition to consistent meal timing with medical dose reconciliation.',
            required_action_bn: 'উপবাস বাতিল করুন এবং নিয়মিত খাদ্যতালিকা বজায় রাখুন।',
            triggering_observations: [`medication:${medString}`, `fasting_hours:${fastingHours}`],
            clinician_review_required: true,
            provenance_reference: rule.reference_guideline,
            timestamp: new Date().toISOString()
          });
        }

        // Severe carbohydrate reduction check (<80g total daily or <25g per main meal)
        if (totalCarbsG > 0 && totalCarbsG < 80) {
          results.push({
            rule_id: 'INSULIN_CARB_CRASH_REVIEW',
            rule_version: '1.0.0',
            patient_id: patient.id,
            decision: 'CLINICAL_REVIEW_REQUIRED',
            severity: 'critical',
            title_en: 'Insulin Hypoglycemia Risk: Very Low Carbohydrate Diet Proposed',
            title_bn: 'ইনসুলিন হাইপোগ্লাইসেমিয়া ঝুঁকি: খাদ্যে শর্করা অতিরিক্ত কম',
            clinical_explanation_en: `Diet plan supplies only ${totalCarbsG}g total carbohydrates. Sudden carbohydrate restriction without proactive insulin down-titration will precipitate neuroglycopenic hypoglycemia. Never alter prescribed insulin doses automatically.`,
            clinical_explanation_bn: `খাদ্যতালিকায় মাত্র ${totalCarbsG}g কার্বোহাইড্রেট রয়েছে। ইনসুলিনের ডোজ না কমিয়ে হঠাৎ কার্ব কমালে হাইপোগ্লাইসেমিয়ার ঝুঁকি থাকে। চিকিৎসকের পরামর্শ ছাড়া ইনসুলিন ডোজ পরিবর্তন করবেন না।`,
            required_action_en: 'Obtain endocrinology consultation to taper insulin prior to initiating dietary carbohydrate reduction.',
            required_action_bn: 'খাদ্যে শর্করা কমানোর পূর্বে চিকিৎসকের মাধ্যমে ইনসুলিন সমন্বয় করুন।',
            triggering_observations: [`total_carbs_g:${totalCarbsG}`, `medication:${medString}`],
            clinician_review_required: true,
            provenance_reference: rule.reference_guideline,
            timestamp: new Date().toISOString()
          });
        }
      }

      // ── Rule B: Sulfonylurea Safety ──────────────────────────────
      if (rule.id === 'MED_SULFONYLUREA_SAFETY') {
        if (fastingHours >= 14) {
          results.push({
            rule_id: 'SULFONYLUREA_FASTING_STOP',
            rule_version: '1.0.0',
            patient_id: patient.id,
            decision: 'HARD_STOP',
            severity: 'critical',
            title_en: `Sulfonylurea Alert: Fasting Blocked on ${medString.toUpperCase()}`,
            title_bn: `সালফোনিলইউরিয়া সতর্কতা: ${medString} চলাকালীন উপবাস নিষিদ্ধ`,
            clinical_explanation_en: `${medString} stimulates ongoing insulin secretion. Fasting (${fastingHours}h) creates a severe risk of prolonged, refractory hypoglycemia.`,
            clinical_explanation_bn: `${medString} অবিরাম ইনসুলিন নিঃসরণ করায় উপবাসের সময় গ্লুকোজ মারাত্মক কমে যাওয়ার ঝুঁকি থাকে।`,
            required_action_en: 'Block automated prolonged fasting. Enforce regular meal intervals.',
            required_action_bn: 'উপবাস বন্ধ রাখুন এবং নিয়মিত সময় অনুযায়ী খাবার গ্রহণ করুন।',
            triggering_observations: [`medication:${medString}`, `fasting_hours:${fastingHours}`],
            clinician_review_required: true,
            provenance_reference: rule.reference_guideline,
            timestamp: new Date().toISOString()
          });
        }
      }

      // ── Rule C: SGLT2 Inhibitor Safety ───────────────────────────
      if (rule.id === 'MED_SGLT2_SAFETY') {
        if (totalCarbsG > 0 && totalCarbsG < 60) {
          results.push({
            rule_id: 'SGLT2_KETOSIS_STOP',
            rule_version: '1.0.0',
            patient_id: patient.id,
            decision: 'HARD_STOP',
            severity: 'critical',
            title_en: 'SGLT2i Euglycemic DKA Danger: Ketogenic Diet Contraindicated',
            title_bn: 'এসজিএলটি২ ইনহিবিটর: কিটো ডায়েটে প্রাণঘাতী অ্যাসিডোসিসের ঝুঁকি',
            clinical_explanation_en: `Concomitant SGLT2i therapy and extreme carbohydrate restriction (${totalCarbsG}g) shifts fuel utilization to rapid ketogenesis, precipitating normal-glucose ketoacidosis.`,
            clinical_explanation_bn: `এসজিএলটি২ ওষুধের সাথে খুব কম কার্ব বা কিটো ডায়েট গ্রহণ করলে রক্তে সুগার স্বাভাবিক থাকা সত্ত্বেও প্রাণঘাতী কিটোঅ্যাসিডোসিস হতে পারে।`,
            required_action_en: 'Increase carbohydrate to safe minimum (>= 130g/day) or recommend medication substitution through prescribing physician.',
            required_action_bn: 'খাদ্যে জটিল কার্বোহাইড্রেটের মাত্রা স্বাভাবিক রাখুন এবং পর্যাপ্ত পানি নিশ্চিত করুন।',
            triggering_observations: [`medication:${medString}`, `carbs_g:${totalCarbsG}`],
            clinician_review_required: true,
            provenance_reference: rule.reference_guideline,
            timestamp: new Date().toISOString()
          });
        }
      }

      // ── Rule G: RAAS & Potassium Safety ──────────────────────────
      if (rule.id === 'MED_RAAS_POTASSIUM_SAFETY') {
        results.push({
          rule_id: 'RAAS_POTASSIUM_ADVISORY',
          rule_version: '1.0.0',
          patient_id: patient.id,
          decision: 'ADVISORY',
          severity: 'high',
          title_en: `RAAS Blocker Precaution: Avoid Potassium Salt Substitutes (${medString})`,
          title_bn: `রেনিন-অ্যাঞ্জিওটেনসিন সতর্কতা: বিকল্প লবণ সম্পূর্ণ বর্জনীয় (${medString})`,
          clinical_explanation_en: `${medString} reduces urinary potassium excretion. Potassium chloride salt substitutes must be strictly avoided.`,
          clinical_explanation_bn: `${medString} শরীর থেকে পটাসিয়াম নির্গমন কমিয়ে দেয়। পটাসিয়ামযুক্ত বিকল্প লবণ বর্জন করুন।`,
          required_action_en: 'Do not prescribe potassium chloride salt substitutes. Monitor serum potassium.',
          required_action_bn: 'বিকল্প লবণ ব্যবহার করবেন না। নিয়মিত পটাসিয়াম মাত্রা পরীক্ষা করুন।',
          triggering_observations: [`medication:${medString}`],
          clinician_review_required: false,
          provenance_reference: rule.reference_guideline,
          timestamp: new Date().toISOString()
        });
      }

      // ── Rule H: Warfarin & Vitamin K Consistency ─────────────────
      if (rule.id === 'MED_WARFARIN_VITK_SAFETY') {
        results.push({
          rule_id: 'WARFARIN_VITK_CONSISTENCY_ADVISORY',
          rule_version: '1.0.0',
          patient_id: patient.id,
          decision: 'ADVISORY',
          severity: 'critical',
          title_en: 'Warfarin Protocol: Strict Vitamin K Consistency Required',
          title_bn: 'ওয়ারফারিন প্রোটোকল: ভিটামিন কে-এর সামঞ্জস্য বজায় রাখুন',
          clinical_explanation_en: 'Green leafy vegetable consumption must remain consistent day-to-day. Avoid large fluctuations.',
          clinical_explanation_bn: 'সবুজ শাকসবজির পরিমাণ হঠাৎ বাড়ানো বা কমানো যাবে না, প্রতিদিন একই মাত্রায় রাখুন।',
          required_action_en: 'Instruct patient to maintain steady intake of greens and notify physician before major dietary transitions.',
          required_action_bn: 'শাকসবজি নিয়মিত একই মাত্রায় গ্রহণ করতে রোগীকে নির্দেশ দিন।',
          triggering_observations: [`medication:${medString}`],
          clinician_review_required: false,
          provenance_reference: rule.reference_guideline,
          timestamp: new Date().toISOString()
        });
      }

      // ── Rule I: Levothyroxine Timing ─────────────────────────────
      if (rule.id === 'MED_LEVOTHYROXINE_TIMING_SAFETY') {
        results.push({
          rule_id: 'LEVOTHYROXINE_TIMING_ADVISORY',
          rule_version: '1.0.0',
          patient_id: patient.id,
          decision: 'ADVISORY',
          severity: 'high',
          title_en: 'Levothyroxine Administration: Morning Fasting & 4h Mineral Separation',
          title_bn: 'লেভোথাইরক্সিন নিয়ম: সকালে খালি পেটে সেবন ও মিনারেল থেকে ৪ ঘণ্টা ব্যবধান',
          clinical_explanation_en: 'Must be taken with water 30-60m before breakfast. Calcium, iron, and antacids must be separated by 4 hours.',
          clinical_explanation_bn: 'সকালে নাশতার ৩০-৬০ মিনিট আগে সাধারণ পানিতে সেবন করুন। ক্যালসিয়াম ও আয়রন বড়ি ৪ ঘণ্টা দূরে রাখুন।',
          required_action_en: 'Schedule mineral supplements in lunch/evening to prevent malabsorption.',
          required_action_bn: 'ক্যালসিয়াম ও আয়রন সাপ্লিমেন্ট দুপুরের খাবারে বা সন্ধ্যায় নির্ধারণ করুন।',
          triggering_observations: [`medication:${medString}`],
          clinician_review_required: false,
          provenance_reference: rule.reference_guideline,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  return results;
}
