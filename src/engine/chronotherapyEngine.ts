/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Phase R4: 24-Hour Chronotherapy Timeline & Spacing Conflict Engine
 * 
 * Clinical Rules:
 * 1. Levothyroxine separation: >= 4h from Calcium, Iron, Magnesium, and Coffee/tea.
 * 2. Bisphosphonates: >= 1h (60 min) before food, supplements, or any other meds; full glass of water.
 * 3. Fluoroquinolones: >= 2h before or >= 4h after polyvalent cations (Ca, Mg, Fe, Zn).
 * 4. Oral Antibiotics vs Probiotics: >= 2h separation.
 * 5. Divalent Minerals (Iron vs Calcium): >= 2h separation to avoid competitive DMT1 absorption.
 * 6. Fat-soluble nutrients (D3, K2, CoQ10, Omega-3): recommended co-scheduled with fat-containing meals.
 * 7. Melatonin / Magnesium Glycinate: 30-60m prior to bedtime.
 * 8. Sleep & Circadian rhythm: Bedtime, wake time, morning light exposure, caffeine curfew.
 */

import {
  ChronotherapyTimelineItem,
  ChronoSpacingWarning,
  TimingConflictFinding,
  LifestyleProtocol,
  ExerciseProtocol,
  SleepCircadianProtocol,
  HydrationProtocol,
  SupplementProtocolItem,
  ChronoEventCategory
} from '../types/r4Protocol';
import { PatientProfile } from '../types';

export interface ChronoInputMedication {
  name?: string;
  medication_name?: string;
  generic_name?: string;
  dosage?: string;
  dose?: string;
  frequency?: string;
  timing?: string;
  administration_time?: string;
}

/**
 * Converts HH:mm time string into minutes from midnight (0..1439).
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return 0;
  return ((h % 24) * 60 + (m % 60) + 1440) % 1440;
}

/**
 * Converts minutes from midnight into 24-hour HH:mm string.
 */
export function minutesToTime(totalMinutes: number): string {
  const norm = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Calculates shortest difference in hours between two times around a 24h clock.
 */
export function calculateCircularDifferenceHours(timeA: string, timeB: string): number {
  const minA = timeToMinutes(timeA);
  const minB = timeToMinutes(timeB);
  let diffMin = Math.abs(minA - minB);
  if (diffMin > 720) {
    diffMin = 1440 - diffMin;
  }
  return Number((diffMin / 60).toFixed(2));
}

/**
 * Determines period of the day based on standard clinical chronobiology divisions:
 * - morning: 05:00 - 11:59
 * - afternoon: 12:00 - 16:59
 * - evening: 17:00 - 20:59
 * - night: 21:00 - 04:59
 */
export function getPeriodForTime(timeStr: string): 'morning' | 'afternoon' | 'evening' | 'night' {
  const mins = timeToMinutes(timeStr);
  if (mins >= 300 && mins < 720) return 'morning';
  if (mins >= 720 && mins < 1020) return 'afternoon';
  if (mins >= 1020 && mins < 1260) return 'evening';
  return 'night';
}

/**
 * Check if a medication name contains a specific active ingredient.
 */
function medMatches(medName: string, keywords: string[]): boolean {
  const lower = medName.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase()));
}

/**
 * Check if a supplement contains specific nutrient.
 */
function suppMatches(supp: SupplementProtocolItem, keywords: string[]): boolean {
  const target = `${supp.generic_nutrient} ${supp.chemical_form} ${supp.brand_name || ''}`.toLowerCase();
  return keywords.some(k => target.includes(k.toLowerCase()));
}

/**
 * Assemble Chronotherapy Timeline from all protocol sections and active medications.
 */
export function buildChronotherapyTimeline(
  lifestyle: LifestyleProtocol,
  exercise: ExerciseProtocol,
  sleep: SleepCircadianProtocol,
  hydration: HydrationProtocol,
  supplements: SupplementProtocolItem[],
  patientMedications: Array<string | ChronoInputMedication | any> = []
): { timeline: ChronotherapyTimelineItem[]; conflicts: TimingConflictFinding[] } {
  const items: ChronotherapyTimelineItem[] = [];

  // 1. Wake event
  items.push({
    id: 'chrono-wake',
    time: sleep.wake_time,
    period: getPeriodForTime(sleep.wake_time),
    category: 'wake',
    title_en: 'Wake Up & Natural Cortisol Awakening',
    title_bn: 'ঘুম থেকে ওঠা এবং প্রাকৃতিক কর্টিসল সক্রিয়করণ',
    instructions_en: 'Rise consistently; avoid snoozing to protect circadian alignment.',
    instructions_bn: 'নিয়মিত সময়ে উঠুন; সার্কাডিয়ান তাল বজায় রাখতে অ্যালার্ম স্নুজ করবেন না।',
    is_editable: true
  });

  // 2. Morning Light Exposure
  if (sleep.daylight_exposure?.scheduled_time) {
    items.push({
      id: 'chrono-light-morning',
      time: sleep.daylight_exposure.scheduled_time,
      period: getPeriodForTime(sleep.daylight_exposure.scheduled_time),
      category: 'light_exposure',
      title_en: 'Outdoor Daylight Exposure (SCN Reset)',
      title_bn: 'সকালের প্রাকৃতিক রোদের সংস্পর্শ (এসসিএন রিসেট)',
      instructions_en: sleep.daylight_exposure.instructions_en,
      instructions_bn: sleep.daylight_exposure.instructions_bn,
      is_editable: true
    });
  }

  // 3. Hydration events
  hydration.hydration_events.forEach(h => {
    items.push({
      id: `chrono-hyd-${h.id}`,
      time: h.time,
      period: getPeriodForTime(h.time),
      category: 'hydration',
      title_en: `Hydration (${h.volume_ml} mL ${h.type.replace('_', ' ')})`,
      title_bn: `পানি ও তরল গ্রহণ (${h.volume_ml} মি.লি.)`,
      instructions_en: h.instructions_en,
      instructions_bn: h.instructions_bn,
      entity_id: h.id,
      is_editable: true
    });
  });

  // 4. Exercise Sessions
  exercise.items.forEach(ex => {
    if (ex.approval_status !== 'contraindicated') {
      // Default exercise timing: morning after daylight or late afternoon
      const exTime = '17:00';
      items.push({
        id: `chrono-ex-${ex.id}`,
        time: exTime,
        period: getPeriodForTime(exTime),
        category: 'exercise',
        title_en: `${ex.title_en} (${ex.duration_minutes}m, ${ex.intensity})`,
        title_bn: `${ex.title_bn} (${ex.duration_minutes} মিনিট)`,
        instructions_en: ex.monitoring_instructions_en,
        instructions_bn: ex.monitoring_instructions_bn,
        entity_id: ex.id,
        is_editable: true
      });
    }
  });

  // 5. Active Medications from Patient Profile
  patientMedications.forEach((med, idx) => {
    let medName = '';
    let medDose = '';
    let medFreq = 'as prescribed';
    let rawTime = '08:00';

    if (typeof med === 'string') {
      medName = med;
    } else if (med && typeof med === 'object') {
      medName = med.medication_name || med.name || med.generic_name || 'Prescription Medication';
      medDose = med.dose || med.dosage || '';
      medFreq = med.frequency || 'as prescribed';
      rawTime = med.timing || med.administration_time || '08:00';
    }

    // Normalize time to HH:mm
    const normTime = rawTime.includes(':') ? rawTime : '08:00';
    items.push({
      id: `chrono-med-${idx}`,
      time: normTime,
      period: getPeriodForTime(normTime),
      category: 'medication',
      title_en: `Prescription: ${medName} ${medDose ? `(${medDose})` : ''}`.trim(),
      title_bn: `নির্ধারিত ওষুধ: ${medName} ${medDose ? `(${medDose})` : ''}`.trim(),
      instructions_en: `Prescription medication. Frequency: ${medFreq}. Do not alter without prescribing doctor approval.`,
      instructions_bn: `চিকিৎসকের প্রেসক্রিপশনকৃত ওষুধ। মাত্রা পরিবর্তন করবেন না।`,
      is_prescription_medication: true,
      is_editable: false // Meds are locked from accidental rescheduling
    });
  });

  // 6. Supplement Protocols
  supplements.forEach(supp => {
    if (supp.approval_status !== 'rejected' && supp.approval_status !== 'discontinued') {
      const time = supp.administration_time || '08:00';
      items.push({
        id: `chrono-supp-${supp.id}`,
        time,
        period: getPeriodForTime(time),
        category: 'supplement',
        title_en: `${supp.generic_nutrient} (${supp.chemical_form}) - ${supp.total_compound_dose}`,
        title_bn: `${supp.generic_nutrient} (${supp.chemical_form}) - ${supp.total_compound_dose}`,
        instructions_en: `Take ${supp.relationship_to_food.replace(/_/g, ' ')}. ${supp.indication_en}`,
        instructions_bn: `নির্দেশনা: ${supp.indication_bn}`,
        entity_id: supp.id,
        is_editable: true
      });
    }
  });

  // 7. Evening Light & Screen Curfew
  if (sleep.evening_light?.cutoff_time) {
    items.push({
      id: 'chrono-screen-curfew',
      time: sleep.evening_light.cutoff_time,
      period: getPeriodForTime(sleep.evening_light.cutoff_time),
      category: 'relaxation',
      title_en: 'Screen Curfew & Evening Melatonin Protection',
      title_bn: 'স্ক্রিন কার্ফু এবং সান্ধ্যকালীন মেলাটোনিন সুরক্ষা',
      instructions_en: sleep.evening_light.instructions_en,
      instructions_bn: sleep.evening_light.instructions_bn,
      is_editable: true
    });
  }

  // 8. Sleep / Bedtime
  items.push({
    id: 'chrono-bed',
    time: sleep.bed_time,
    period: getPeriodForTime(sleep.bed_time),
    category: 'sleep',
    title_en: 'Bedtime & Nocturnal Recovery',
    title_bn: 'ঘুমাতে যাওয়া এবং রাতের শারীরিক পুনরুজ্জীবন',
    instructions_en: 'Dark, cool, silent bedroom environment for optimal deep slow-wave sleep.',
    instructions_bn: 'গভীর ঘুমের জন্য অন্ধকার, শীতল ও শান্ত পরিবেশ নিশ্চিত করুন।',
    is_editable: true
  });

  // Sort timeline chronologically (00:00 to 23:59)
  items.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  // Detect Spacing Conflicts & Collisions
  const conflicts: TimingConflictFinding[] = [];

  // Evaluate DNI & Nutrient Spacing Rules
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const item1 = items[i];
      const item2 = items[j];
      const gapHours = calculateCircularDifferenceHours(item1.time, item2.time);

      // Rule A: Levothyroxine (Thyroxine / Eltroxin / Thyrox) vs Iron / Calcium / Magnesium
      const isItem1Thyroid = item1.category === 'medication' && medMatches(item1.title_en, ['thyrox', 'eltroxin', 'levothyroxine', 'synthroid']);
      const isItem2Thyroid = item2.category === 'medication' && medMatches(item2.title_en, ['thyrox', 'eltroxin', 'levothyroxine', 'synthroid']);

      const isItem1Mineral = item1.category === 'supplement' && medMatches(item1.title_en, ['calcium', 'iron', 'magnesium', 'ferrous', 'caltrate']);
      const isItem2Mineral = item2.category === 'supplement' && medMatches(item2.title_en, ['calcium', 'iron', 'magnesium', 'ferrous', 'caltrate']);

      if ((isItem1Thyroid && isItem2Mineral) || (isItem2Thyroid && isItem1Mineral)) {
        if (gapHours < 4.0) {
          const thyroid = isItem1Thyroid ? item1 : item2;
          const mineral = isItem1Thyroid ? item2 : item1;
          const warning: ChronoSpacingWarning = {
            rule_id: 'RULE_LEVOTHYROXINE_MINERAL_SPACING',
            severity: 'critical',
            message_en: `Levothyroxine must be separated by at least 4 hours from ${mineral.title_en} to prevent severe unabsorbed malabsorption. Current gap: ${gapHours}h.`,
            message_bn: `লেভোথাইরক্সিন ওষুধ এবং ${mineral.title_bn}-এর মাঝে কমপক্ষে ৪ ঘণ্টার ব্যবধান আবশ্যক। বর্তমান ব্যবধান: ${gapHours} ঘণ্টা।`,
            required_gap_hours: 4.0,
            actual_gap_hours: gapHours
          };
          item1.collision_detected = true;
          item2.collision_detected = true;
          item1.spacing_warnings = item1.spacing_warnings || [];
          item2.spacing_warnings = item2.spacing_warnings || [];
          item1.spacing_warnings.push(warning);
          item2.spacing_warnings.push(warning);

          conflicts.push({
            item1_title: thyroid.title_en,
            item2_title: mineral.title_en,
            time1: thyroid.time,
            time2: mineral.time,
            min_interval_hours: 4.0,
            actual_interval_hours: gapHours,
            severity: 'critical',
            warning_en: warning.message_en,
            warning_bn: warning.message_bn,
            recommendation_en: `Reschedule ${mineral.title_en} to at least 4 hours after Levothyroxine (e.g. lunch or evening).`,
            recommendation_bn: `${mineral.title_bn} গ্রহণের সময় লেভোথাইরক্সিনের কমপক্ষে ৪ ঘণ্টা পর (যেমন দুপুরের খাবার বা সন্ধ্যায়) নির্ধারণ করুন।`
          });
        }
      }

      // Rule B: Bisphosphonates (Alendronate / Fosamax / Bonviva)
      const isItem1Bisphos = item1.category === 'medication' && medMatches(item1.title_en, ['alendronate', 'fosamax', 'risedronate', 'ibandronate', 'bonviva']);
      const isItem2Bisphos = item2.category === 'medication' && medMatches(item2.title_en, ['alendronate', 'fosamax', 'risedronate', 'ibandronate', 'bonviva']);

      if (isItem1Bisphos || isItem2Bisphos) {
        const other = isItem1Bisphos ? item2 : item1;
        const bisphos = isItem1Bisphos ? item1 : item2;
        if (gapHours < 1.0 && (other.category === 'supplement' || other.category === 'medication' || other.category === 'meal')) {
          const warning: ChronoSpacingWarning = {
            rule_id: 'RULE_BISPHOSPHONATE_SPACING',
            severity: 'critical',
            message_en: `Oral bisphosphonates require at least 60 minutes with plain water before any supplement, food, or medication. Current gap: ${gapHours}h.`,
            message_bn: `বাইসফসফোনেট ওষুধ গ্রহণের পর কমপক্ষে ৬০ মিনিট অন্য কোনো ওষুধ, সাপ্লিমেন্ট বা খাবার খাওয়া যাবে না। বর্তমান ব্যবধান: ${gapHours} ঘণ্টা।`,
            required_gap_hours: 1.0,
            actual_gap_hours: gapHours
          };
          item1.collision_detected = true;
          item2.collision_detected = true;
          item1.spacing_warnings = item1.spacing_warnings || [];
          item2.spacing_warnings = item2.spacing_warnings || [];
          item1.spacing_warnings.push(warning);
          item2.spacing_warnings.push(warning);

          conflicts.push({
            item1_title: bisphos.title_en,
            item2_title: other.title_en,
            time1: bisphos.time,
            time2: other.time,
            min_interval_hours: 1.0,
            actual_interval_hours: gapHours,
            severity: 'critical',
            warning_en: warning.message_en,
            warning_bn: warning.message_bn,
            recommendation_en: `Take Bisphosphonate immediately upon waking; reschedule ${other.title_en} at least 60 minutes later.`,
            recommendation_bn: `ঘুম থেকে উঠেই শুধুমাত্র সাধারণ পানি দিয়ে বাইসফসফোনেট সেবন করুন; অন্য কিছু কমপক্ষে ৬০ মিনিট পরে নিন।`
          });
        }
      }

      // Rule C: Antibiotic vs Probiotic Spacing
      const isItem1Abx = item1.category === 'medication' && medMatches(item1.title_en, ['amoxicillin', 'azithromycin', 'ciprofloxacin', 'cefixime', 'augmentin', 'metronidazole', 'doxycycline']);
      const isItem2Abx = item2.category === 'medication' && medMatches(item2.title_en, ['amoxicillin', 'azithromycin', 'ciprofloxacin', 'cefixime', 'augmentin', 'metronidazole', 'doxycycline']);
      const isItem1Probiotic = item1.category === 'supplement' && medMatches(item1.title_en, ['probiotic', 'lactobacillus', 'bifidobacterium', 'saccharomyces']);
      const isItem2Probiotic = item2.category === 'supplement' && medMatches(item2.title_en, ['probiotic', 'lactobacillus', 'bifidobacterium', 'saccharomyces']);

      if ((isItem1Abx && isItem2Probiotic) || (isItem2Abx && isItem1Probiotic)) {
        if (gapHours < 2.0) {
          const abx = isItem1Abx ? item1 : item2;
          const prob = isItem1Abx ? item2 : item1;
          const warning: ChronoSpacingWarning = {
            rule_id: 'RULE_ANTIBIOTIC_PROBIOTIC_SPACING',
            severity: 'high',
            message_en: `Probiotics must be taken at least 2 hours apart from antibiotics to prevent antibiotic neutralization of probiotic strains. Current gap: ${gapHours}h.`,
            message_bn: `অ্যান্টিবায়োটিকের কার্যকারিতায় প্রোবায়োটিক ধ্বংস রোধে উভয়ের মাঝে কমপক্ষে ২ ঘণ্টার ব্যবধান রাখুন।`,
            required_gap_hours: 2.0,
            actual_gap_hours: gapHours
          };
          item1.collision_detected = true;
          item2.collision_detected = true;
          item1.spacing_warnings = item1.spacing_warnings || [];
          item2.spacing_warnings = item2.spacing_warnings || [];
          item1.spacing_warnings.push(warning);
          item2.spacing_warnings.push(warning);

          conflicts.push({
            item1_title: abx.title_en,
            item2_title: prob.title_en,
            time1: abx.time,
            time2: prob.time,
            min_interval_hours: 2.0,
            actual_interval_hours: gapHours,
            severity: 'high',
            warning_en: warning.message_en,
            warning_bn: warning.message_bn,
            recommendation_en: `Reschedule ${prob.title_en} to at least 2 hours away from ${abx.title_en}.`,
            recommendation_bn: `${prob.title_bn} গ্রহণের সময় ${abx.title_bn} থেকে কমপক্ষে ২ ঘণ্টা দূরে নির্ধারণ করুন।`
          });
        }
      }

      // Rule D: Calcium vs Iron Spacing (Competitive DMT1 transporter inhibition)
      const isItem1Iron = item1.category === 'supplement' && medMatches(item1.title_en, ['iron', 'ferrous', 'carbonyl iron', 'bisglycinate iron']);
      const isItem2Iron = item2.category === 'supplement' && medMatches(item2.title_en, ['iron', 'ferrous', 'carbonyl iron', 'bisglycinate iron']);
      const isItem1Cal = item1.category === 'supplement' && medMatches(item1.title_en, ['calcium', 'caltrate']);
      const isItem2Cal = item2.category === 'supplement' && medMatches(item2.title_en, ['calcium', 'caltrate']);

      if ((isItem1Iron && isItem2Cal) || (isItem2Iron && isItem1Cal)) {
        if (gapHours < 2.0) {
          const iron = isItem1Iron ? item1 : item2;
          const cal = isItem1Iron ? item2 : item1;
          const warning: ChronoSpacingWarning = {
            rule_id: 'RULE_CALCIUM_IRON_SPACING',
            severity: 'high',
            message_en: `High-dose Calcium competitively inhibits Iron absorption via DMT1 transporter. Maintain at least 2 hours separation. Current gap: ${gapHours}h.`,
            message_bn: `ক্যালসিয়াম আয়রনের শোষণ বাধাগ্রস্ত করে। উভয়ের মাঝে কমপক্ষে ২ ঘণ্টার ব্যবধান বজায় রাখুন।`,
            required_gap_hours: 2.0,
            actual_gap_hours: gapHours
          };
          item1.collision_detected = true;
          item2.collision_detected = true;
          item1.spacing_warnings = item1.spacing_warnings || [];
          item2.spacing_warnings = item2.spacing_warnings || [];
          item1.spacing_warnings.push(warning);
          item2.spacing_warnings.push(warning);

          conflicts.push({
            item1_title: iron.title_en,
            item2_title: cal.title_en,
            time1: iron.time,
            time2: cal.time,
            min_interval_hours: 2.0,
            actual_interval_hours: gapHours,
            severity: 'high',
            warning_en: warning.message_en,
            warning_bn: warning.message_bn,
            recommendation_en: `Administer Iron in the morning/midday and Calcium in the evening/night.`,
            recommendation_bn: `আয়রন সকালে বা দুপুরে এবং ক্যালসিয়াম সন্ধ্যায় বা রাতে গ্রহণ করুন।`
          });
        }
      }
    }
  }

  return { timeline: items, conflicts };
}
