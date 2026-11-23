/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Phase R4: Multi-Axis Clinical Safety & Hard-Stop Evaluation Engine
 * 
 * Safety Axes:
 * 1. Cardiovascular & Exercise Contraindications (SBP >= 180, acute coronary, severe arrhythmias).
 * 2. Renal & Heart Failure Fluid Restrictions (ESRD / CHF ceiling violations).
 * 3. Tolerable Upper Limit (UL) & Overlap Toxicity (Elemental Mg > 350mg, Vit D > 10,000 IU, Zinc > 40mg).
 * 4. Severe Drug-Nutrient Spacing Violations (Levothyroxine, Bisphosphonates).
 * 5. Undetermined / Non-standardized Formulations requiring manual physician sign-off.
 */

import {
  R4SafetyEvaluation,
  SafetyFinding,
  TimingConflictFinding,
  LifestyleProtocol,
  ExerciseProtocol,
  SleepCircadianProtocol,
  HydrationProtocol,
  SupplementProtocolItem
} from '../types/r4Protocol';
import { PatientProfile, SupplementOverlapWarning } from '../types';
import { checkAdvancedSupplementOverlaps } from './supplementEngine';

export function evaluateR4ProtocolSafety(
  lifestyle: LifestyleProtocol,
  exercise: ExerciseProtocol,
  sleep: SleepCircadianProtocol,
  hydration: HydrationProtocol,
  supplements: SupplementProtocolItem[],
  conflicts: TimingConflictFinding[],
  patient: PatientProfile
): R4SafetyEvaluation {
  const hard_stops: SafetyFinding[] = [];
  const reviews_required: SafetyFinding[] = [];
  const cautions: SafetyFinding[] = [];

  // ── 1. Exercise Contraindications ─────────────────────────────────
  if (exercise.overall_safety_status === 'HARD_STOP') {
    exercise.clinical_contraindications.forEach(reason => {
      hard_stops.push({
        code: 'EXERCISE_HARD_STOP',
        severity: 'critical',
        title_en: 'Absolute Exercise Contraindication',
        title_bn: 'শরীরচর্চায় সম্পূর্ণ নিষেধাজ্ঞা (হার্ড স্টপ)',
        rationale_en: reason,
        rationale_bn: `শারীরিক ঝুঁকি: ${reason}`,
        recommended_action_en: 'Cancel vigorous/moderate exercise immediately. Limit to bed rest or gentle supervised physical therapy.',
        recommended_action_bn: 'তীব্র বা মাঝারি শরীরচর্চা অবিলম্বে বাতিল করুন। সম্পূর্ণ বিশ্রাম নিশ্চিত করুন।'
      });
    });
  } else if (exercise.overall_safety_status === 'REQUIRES_CLINICAL_REVIEW') {
    exercise.risk_factors_evaluated.forEach(rf => {
      reviews_required.push({
        code: 'EXERCISE_CLINICAL_REVIEW',
        severity: 'high',
        title_en: 'Exercise Prescribing Requires Physician Review',
        title_bn: 'শরীরচর্চা প্রেসক্রিপশনে চিকিৎসকের মূল্যায়ন আবশ্যক',
        rationale_en: rf,
        rationale_bn: `ঝুঁকি ফ্যাক্টর: ${rf}`,
        recommended_action_en: 'Consult supervising cardiologist/nephrologist before authorizing progressive physical exertion.',
        recommended_action_bn: 'শরীরচর্চা শুরুর পূর্বে বিশেষজ্ঞ চিকিৎসকের অনুমোদন গ্রহণ করুন।'
      });
    });
  } else if (exercise.overall_safety_status === 'CAUTION') {
    cautions.push({
      code: 'EXERCISE_CAUTION',
      severity: 'medium',
      title_en: 'Exercise Precautions & Monitoring Required',
      title_bn: 'শরীরচর্চায় সতর্কতা ও পর্যবেক্ষণ আবশ্যক',
      rationale_en: 'Patient has active metabolic, renal, or musculoskeletal conditions requiring guided intensity.',
      rationale_bn: 'রোগীর মেটাবলিক বা অন্যান্য স্বাস্থ্যগত কারণে শরীরচর্চার তীব্রতা সীমিত রাখা প্রয়োজন।',
      recommended_action_en: 'Adhere strictly to Borg RPE guidelines, stay hydrated, and monitor blood glucose/blood pressure.',
      recommended_action_bn: 'বর্গ স্কেল ও রক্তচাপ নিয়মিত পর্যবেক্ষণ করুন।'
    });
  }

  // ── 2. Fluid Restriction Safety Gate ──────────────────────────────
  if (hydration.is_restricted) {
    const limit = hydration.clinician_fluid_limit_ml || hydration.baseline_fluid_target_ml;
    if (hydration.total_scheduled_ml > limit) {
      hard_stops.push({
        code: 'FLUID_RESTRICTION_EXCEEDED',
        severity: 'critical',
        title_en: 'Scheduled Fluid Exceeds Prescribed Restriction Ceiling',
        title_bn: 'নির্ধারিত তরল গ্রহণ অনুমোদিত সীমা অতিক্রম করেছে',
        rationale_en: `Scheduled total fluid is ${hydration.total_scheduled_ml} mL/day, which dangerously exceeds the clinical restriction of ${limit} mL/day (${hydration.restriction_reason_en || 'Cardiorenal ceiling'}). Risk of acute pulmonary edema, hypervolemia, or severe heart failure decompensation.`,
        rationale_bn: `নির্ধারিত তরল ${hydration.total_scheduled_ml} মি.লি., যা অনুমোদিত সীমা ${limit} মি.লি. অতিক্রম করেছে। এতে ফুসফুসে পানি জমে শ্বাসকষ্ট বা হার্ট ফেইলিউর হতে পারে।`,
        recommended_action_en: `Reduce scheduled hydration events so the sum does not exceed ${limit} mL/day.`,
        recommended_action_bn: `দৈনিক পানির পরিমাণ কমিয়ে ${limit} মি.লি.-এর নিচে নিয়ে আসুন।`
      });
    }
  }

  // ── 3. Supplement Overlaps & Tolerable Upper Limits (UL) ───────────
  const activeSupplements = supplements.filter(s => s.approval_status !== 'rejected' && s.approval_status !== 'discontinued');
  const overlapWarnings = checkAdvancedSupplementOverlaps(activeSupplements, patient);

  overlapWarnings.forEach(w => {
    const isUndetermined = w.total_amount_estimated.includes('UNDETERMINED') || w.warning_en.includes('UNDETERMINED') || w.total_amount_estimated.includes('INCOMPATIBLE');
    if (isUndetermined) {
      reviews_required.push({
        code: 'SUPPLEMENT_UNDETERMINED_DOSE',
        severity: 'high',
        title_en: `Unstandardized or Unparseable Supplement: ${w.nutrient}`,
        title_bn: `অনির্ধারিত মাত্রার সাপ্লিমেন্ট: ${w.nutrient}`,
        rationale_en: w.warning_en,
        rationale_bn: w.warning_bn,
        recommended_action_en: 'Review certificate of analysis or specify exact elemental milligram dose before approving.',
        recommended_action_bn: 'অনুমোদনের পূর্বে প্রস্তুতকারকের বিবরণী অনুযায়ী সঠিক মিলিগ্রাম মাত্রা নির্ধারণ করুন।'
      });
    } else if (w.severity === 'high') {
      hard_stops.push({
        code: 'SUPPLEMENT_UL_EXCEEDED',
        severity: 'critical',
        title_en: `Tolerable Upper Limit (UL) Exceeded: ${w.nutrient}`,
        title_bn: `সর্বোচ্চ নিরাপদ মাত্রা (UL) অতিক্রম: ${w.nutrient}`,
        rationale_en: w.warning_en,
        rationale_bn: w.warning_bn,
        recommended_action_en: `Reduce dose of ${w.nutrient} to below established Tolerable Upper Intake Level (${w.tolerable_upper_limit}).`,
        recommended_action_bn: `${w.nutrient} এর মাত্রা কমিয়ে নিরাপদ দৈনিক ঊর্ধ্বসীমার নিচে নিয়ে আসুন।`
      });
    } else {
      cautions.push({
        code: 'SUPPLEMENT_OVERLAP_CAUTION',
        severity: 'medium',
        title_en: `Multi-Source Supplement Overlap: ${w.nutrient}`,
        title_bn: `একাধিক উৎস থেকে সাপ্লিমেন্ট গ্রহণ: ${w.nutrient}`,
        rationale_en: w.warning_en,
        rationale_bn: w.warning_bn,
        recommended_action_en: 'Monitor total cumulative intake and patient symptoms during follow-up.',
        recommended_action_bn: 'রোগীর সামগ্রিক গ্রহণ এবং উপসর্গ পর্যবেক্ষণ করুন।'
      });
    }
  });

  // ── 4. Chronotherapy Timing Conflicts ──────────────────────────────
  conflicts.forEach(c => {
    if (c.severity === 'critical') {
      hard_stops.push({
        code: 'TIMING_CONFLICT_CRITICAL',
        severity: 'critical',
        title_en: `Critical Spacing Violation: ${c.item1_title} vs ${c.item2_title}`,
        title_bn: `গুরুত্বপূর্ণ সময়ের ব্যবধান লঙ্ঘন: ${c.item1_title} বনাম ${c.item2_title}`,
        rationale_en: c.warning_en,
        rationale_bn: c.warning_bn,
        recommended_action_en: c.recommendation_en,
        recommended_action_bn: c.recommendation_bn
      });
    } else if (c.severity === 'high') {
      reviews_required.push({
        code: 'TIMING_CONFLICT_HIGH',
        severity: 'high',
        title_en: `Significant Spacing Conflict: ${c.item1_title} vs ${c.item2_title}`,
        title_bn: `সময়গত অসঙ্গতি: ${c.item1_title} বনাম ${c.item2_title}`,
        rationale_en: c.warning_en,
        rationale_bn: c.warning_bn,
        recommended_action_en: c.recommendation_en,
        recommended_action_bn: c.recommendation_bn
      });
    } else {
      cautions.push({
        code: 'TIMING_CONFLICT_ADVISORY',
        severity: 'medium',
        title_en: `Timing Advisory: ${c.item1_title} vs ${c.item2_title}`,
        title_bn: `সময় সচেতনতা: ${c.item1_title} বনাম ${c.item2_title}`,
        rationale_en: c.warning_en,
        rationale_bn: c.warning_bn,
        recommended_action_en: c.recommendation_en,
        recommended_action_bn: c.recommendation_bn
      });
    }
  });

  // ── 5. Overall Status & Approval Eligibility Determination ─────────
  let overall_status: 'SAFE' | 'CAUTION' | 'REQUIRES_REVIEW' | 'HARD_STOP' = 'SAFE';

  if (hard_stops.length > 0) {
    overall_status = 'HARD_STOP';
  } else if (reviews_required.length > 0) {
    overall_status = 'REQUIRES_REVIEW';
  } else if (cautions.length > 0) {
    overall_status = 'CAUTION';
  }

  const can_approve = hard_stops.length === 0;

  return {
    overall_status,
    can_approve,
    hard_stops,
    reviews_required,
    cautions,
    nutrient_overlaps: overlapWarnings,
    timing_conflicts: conflicts,
    evaluated_at: new Date().toISOString()
  };
}
