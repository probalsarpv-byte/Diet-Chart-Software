/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION SOFTWARE
 * Meal Timing & Circadian Window Calculation Engine
 * 
 * Deterministic timestamp parsing, chronological sequencing, eating-window
 * boundary validation, and intake-to-intake fasting calculation.
 */

import { DietChartMeal } from '../types';

export interface ParsedTime {
  hours24: number;
  minutes: number;
  totalMinutes: number; // 0 to 1439
  display12h: string;   // e.g. "12:30 PM"
}

export interface MealTimingEvaluation {
  is_valid: boolean;
  first_meal_time?: string;
  last_meal_time?: string;
  first_meal_minutes?: number;
  last_meal_minutes?: number;
  scheduled_intake_window_hours: number; // Duration from first meal to last meal
  scheduled_overnight_fast_hours: number; // Duration from last meal to next day's first meal
  permitted_eating_window_hours?: number; // Configured window (e.g. 8.0 for 12:00 PM - 08:00 PM)
  is_intake_within_permitted_window: boolean;
  timing_discrepancies: string[];
  timing_discrepancies_bn: string[];
}

/**
 * Parses time strings in 12-hour (e.g. "12:30 PM", "7:30 am") or 24-hour (e.g. "14:30", "07:00") format.
 * Returns null if the format is invalid or values are out of bounds.
 */
export function parseTimeString(timeStr: string): ParsedTime | null {
  if (!timeStr || typeof timeStr !== 'string') return null;

  const cleaned = timeStr.trim();

  // Match 12-hour format: "hh:mm AM/PM" or "h:mm AM/PM"
  const match12 = cleaned.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const meridian = match12[3].toUpperCase();

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
      return null;
    }

    let hours24 = hours;
    if (meridian === 'AM') {
      if (hours === 12) hours24 = 0;
    } else {
      if (hours !== 12) hours24 = hours + 12;
    }

    const totalMinutes = hours24 * 60 + minutes;
    const formattedHours12 = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');

    return {
      hours24,
      minutes,
      totalMinutes,
      display12h: `${formattedHours12}:${formattedMinutes} ${meridian}`
    };
  }

  // Match 24-hour format: "HH:mm" or "H:mm"
  const match24 = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours24 = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);

    if (hours24 < 0 || hours24 > 23 || minutes < 0 || minutes > 59) {
      return null;
    }

    const meridian = hours24 >= 12 ? 'PM' : 'AM';
    let hours12 = hours24 % 12;
    if (hours12 === 0) hours12 = 12;

    const totalMinutes = hours24 * 60 + minutes;
    const formattedHours12 = hours12.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');

    return {
      hours24,
      minutes,
      totalMinutes,
      display12h: `${formattedHours12}:${formattedMinutes} ${meridian}`
    };
  }

  return null;
}

/**
 * Calculates duration in decimal hours between two timestamps, accounting for optional midnight rollover.
 */
export function calculateIntervalHours(
  startStr: string,
  endStr: string,
  allowMidnightRollover: boolean = false
): number | null {
  const start = parseTimeString(startStr);
  const end = parseTimeString(endStr);
  if (!start || !end) return null;

  let diffMinutes = end.totalMinutes - start.totalMinutes;
  if (diffMinutes < 0) {
    if (allowMidnightRollover) {
      diffMinutes += 1440; // 24 hours in minutes
    } else {
      return null; // Negative interval without rollover is invalid
    }
  }

  return Math.round((diffMinutes / 60) * 10) / 10;
}

/**
 * Evaluates the timing architecture of a list of meals against planned fasting / eating window constraints.
 */
export function evaluateMealScheduleTiming(
  meals: DietChartMeal[],
  options?: {
    eatingWindowStart?: string; // e.g. "12:00 PM"
    eatingWindowEnd?: string;   // e.g. "08:00 PM"
    plannedFastingHours?: number;
  }
): MealTimingEvaluation {
  const discrepancies: string[] = [];
  const discrepancies_bn: string[] = [];

  if (!meals || meals.length === 0) {
    return {
      is_valid: true,
      scheduled_intake_window_hours: 0,
      scheduled_overnight_fast_hours: 24,
      is_intake_within_permitted_window: true,
      timing_discrepancies: [],
      timing_discrepancies_bn: []
    };
  }

  // Parse all meal times
  const parsedMeals: { meal: DietChartMeal; parsed: ParsedTime }[] = [];
  for (const m of meals) {
    const timeStr = m.scheduled_time || m.target_time;
    const parsed = parseTimeString(timeStr);
    if (parsed) {
      parsedMeals.push({ meal: m, parsed });
    } else {
      discrepancies.push(`Meal "${m.title_en}" has invalid or unparseable time: "${timeStr}".`);
      discrepancies_bn.push(`খাবার "${m.title_bn}"-এর সময়সূচি ("${timeStr}") সঠিক নয়।`);
    }
  }

  if (parsedMeals.length === 0) {
    return {
      is_valid: false,
      scheduled_intake_window_hours: 0,
      scheduled_overnight_fast_hours: 24,
      is_intake_within_permitted_window: false,
      timing_discrepancies: discrepancies,
      timing_discrepancies_bn: discrepancies_bn
    };
  }

  // Sort meals by chronological minutes from midnight
  const sorted = [...parsedMeals].sort((a, b) => a.parsed.totalMinutes - b.parsed.totalMinutes);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  // Calculate intake span (first meal to last meal)
  let intakeSpanMinutes = last.parsed.totalMinutes - first.parsed.totalMinutes;
  const intakeSpanHours = Math.round((intakeSpanMinutes / 60) * 10) / 10;

  // Calculate overnight fasting interval (last meal to next day's first meal)
  const overnightFastMinutes = (1440 - last.parsed.totalMinutes) + first.parsed.totalMinutes;
  const overnightFastHours = Math.round((overnightFastMinutes / 60) * 10) / 10;

  // Check permitted eating window if provided
  let permittedHours: number | undefined;
  let isWithinPermitted = true;

  if (options?.eatingWindowStart && options?.eatingWindowEnd) {
    const windowStart = parseTimeString(options.eatingWindowStart);
    const windowEnd = parseTimeString(options.eatingWindowEnd);

    if (windowStart && windowEnd) {
      let winDiff = windowEnd.totalMinutes - windowStart.totalMinutes;
      if (winDiff < 0) winDiff += 1440;
      permittedHours = Math.round((winDiff / 60) * 10) / 10;

      // Verify each caloric meal is within window boundaries
      for (const item of parsedMeals) {
        const itemMins = item.parsed.totalMinutes;
        const isCaloric = item.meal.meal_calories > 0 || (item.meal.items && item.meal.items.length > 0);
        if (isCaloric) {
          // Check if itemMins falls strictly inside [windowStart, windowEnd]
          let inWindow = false;
          if (windowStart.totalMinutes <= windowEnd.totalMinutes) {
            inWindow = itemMins >= windowStart.totalMinutes && itemMins <= windowEnd.totalMinutes;
          } else {
            // Window spans midnight
            inWindow = itemMins >= windowStart.totalMinutes || itemMins <= windowEnd.totalMinutes;
          }

          if (!inWindow) {
            isWithinPermitted = false;
            discrepancies.push(
              `Caloric intake "${item.meal.title_en}" (${item.parsed.display12h}) is outside the designated eating window (${options.eatingWindowStart} - ${options.eatingWindowEnd}).`
            );
            discrepancies_bn.push(
              `খাবার "${item.meal.title_bn}" (${item.parsed.display12h}) অনুমোদিত খাওয়ার উইন্ডোর (${options.eatingWindowStart} - ${options.eatingWindowEnd}) বাইরে নির্ধারিত।`
            );
          }
        }
      }
    }
  }

  // Validate chronological progression of raw meal array
  for (let i = 0; i < parsedMeals.length - 1; i++) {
    const current = parsedMeals[i];
    const next = parsedMeals[i + 1];
    if (next.parsed.totalMinutes < current.parsed.totalMinutes) {
      discrepancies.push(
        `Meal ordering inconsistency: "${next.meal.title_en}" (${next.parsed.display12h}) is scheduled before earlier meal "${current.meal.title_en}" (${current.parsed.display12h}).`
      );
      discrepancies_bn.push(
        `খাবারের ক্রমবিন্যাসে ত্রুটি: "${next.meal.title_bn}" (${next.parsed.display12h}) পূর্বের খাবার "${current.meal.title_bn}" (${current.parsed.display12h})-এর পূর্বে নির্ধারিত।`
      );
    }
  }

  const isValid = discrepancies.length === 0;

  return {
    is_valid: isValid,
    first_meal_time: first.parsed.display12h,
    last_meal_time: last.parsed.display12h,
    first_meal_minutes: first.parsed.totalMinutes,
    last_meal_minutes: last.parsed.totalMinutes,
    scheduled_intake_window_hours: intakeSpanHours,
    scheduled_overnight_fast_hours: overnightFastHours,
    permitted_eating_window_hours: permittedHours,
    is_intake_within_permitted_window: isWithinPermitted,
    timing_discrepancies: discrepancies,
    timing_discrepancies_bn: discrepancies_bn
  };
}
