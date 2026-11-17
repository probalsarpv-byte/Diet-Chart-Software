/**
 * SHUDDHO FUNCTIONAL NUTRITION SOFTWARE
 * Asia/Dhaka Timezone & Clinical KPI Aggregation Utilities
 * 
 * Provides deterministic date calculations in Asia/Dhaka (UTC+06:00):
 * - Guarantees date boundary correctness (e.g. 19:30 UTC is next day in Dhaka)
 * - Safe practice-wide KPI calculation without synthetic or demo pollution
 * - Strict exclusion of completed & cancelled appointments from pending metrics
 */

import { PatientRecord, FollowUpAppointment, ClinicalVisit } from '../types';

export const DHAKA_TIMEZONE = 'Asia/Dhaka';

export interface PracticeKPIs {
  totalPatients: number;
  newThisMonth: number;
  visitsToday: number;
  dueToday: number;
  overdue: number;
  upcoming7Days: number;
  pendingAssessments: number;
  pendingReports: number;
}

/**
 * Returns current or given date formatted as YYYY-MM-DD in Asia/Dhaka timezone.
 */
export function getDhakaTodayDateString(referenceDate: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: DHAKA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(referenceDate);
  } catch {
    // Fallback: manually offset UTC by +6 hours
    const dhakaMs = referenceDate.getTime() + 6 * 60 * 60 * 1000;
    return new Date(dhakaMs).toISOString().split('T')[0];
  }
}

/**
 * Returns formatted date and time in Asia/Dhaka.
 */
export function getDhakaDateTime(referenceDate: Date = new Date()): {
  date: string;
  time: string;
  formatted: string;
} {
  const dateStr = getDhakaTodayDateString(referenceDate);
  let timeStr = '12:00 PM';
  try {
    timeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: DHAKA_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(referenceDate);
  } catch {
    timeStr = referenceDate.toTimeString().substring(0, 5);
  }

  return {
    date: dateStr,
    time: timeStr,
    formatted: `${dateStr} ${timeStr}`
  };
}

/**
 * Checks if a YYYY-MM-DD string equals today in Asia/Dhaka.
 */
export function isDateTodayDhaka(dateStr: string, referenceDate: Date = new Date()): boolean {
  if (!dateStr || !dateStr.trim()) return false;
  return dateStr.trim() === getDhakaTodayDateString(referenceDate);
}

/**
 * Checks if a YYYY-MM-DD string is before today in Asia/Dhaka.
 */
export function isDatePastDhaka(dateStr: string, referenceDate: Date = new Date()): boolean {
  if (!dateStr || !dateStr.trim()) return false;
  return dateStr.trim() < getDhakaTodayDateString(referenceDate);
}

/**
 * Checks if a YYYY-MM-DD string falls strictly in the upcoming window (tomorrow through next N days) in Asia/Dhaka.
 */
export function isDateUpcomingDhaka(
  dateStr: string,
  daysAhead: number = 7,
  referenceDate: Date = new Date()
): boolean {
  if (!dateStr || !dateStr.trim()) return false;
  const todayStr = getDhakaTodayDateString(referenceDate);
  
  // Calculate N days ahead in Dhaka
  const futureMs = referenceDate.getTime() + daysAhead * 24 * 60 * 60 * 1000;
  const maxDateStr = getDhakaTodayDateString(new Date(futureMs));

  return dateStr > todayStr && dateStr <= maxDateStr;
}

/**
 * Computes authoritative practice-wide KPIs across all saved patients in safeStorage.
 * Excludes cancelled and completed appointments from pending/due/overdue queues.
 */
export function calculatePracticeKPIs(
  patients: PatientRecord[],
  referenceDate: Date = new Date()
): PracticeKPIs {
  if (!Array.isArray(patients) || patients.length === 0) {
    return {
      totalPatients: 0,
      newThisMonth: 0,
      visitsToday: 0,
      dueToday: 0,
      overdue: 0,
      upcoming7Days: 0,
      pendingAssessments: 0,
      pendingReports: 0
    };
  }

  const todayDhaka = getDhakaTodayDateString(referenceDate);
  const currentMonth = todayDhaka.substring(0, 7); // YYYY-MM

  // 1. Total patients
  const totalPatients = patients.length;

  // 2. New this month (safe registration date converted to Asia/Dhaka)
  const newThisMonth = patients.filter(p => {
    const raw = p.created_at || (p.patient as any).created_at || p.patient.visit_date || '';
    if (!raw) return false;
    let dhakaDateStr = raw;
    if (raw.includes('T')) {
      try {
        dhakaDateStr = getDhakaTodayDateString(new Date(raw));
      } catch {
        dhakaDateStr = raw;
      }
    }
    return dhakaDateStr.substring(0, 7) === currentMonth;
  }).length;

  // 3. Aggregate all visits with deduplication by visit_id
  const visitMap = new Map<string, ClinicalVisit>();
  patients.forEach(p => {
    (p.clinical_visits || []).forEach(v => {
      const vId = v.visit_id || v.id;
      if (vId) visitMap.set(vId, v);
    });
  });
  const allVisits = Array.from(visitMap.values());
  const visitsToday = allVisits.filter(v => v.visit_date === todayDhaka).length;

  // 4. Aggregate all appointments with deduplication by appointment_id
  const aptMap = new Map<string, FollowUpAppointment>();
  patients.forEach(p => {
    (p.follow_up_appointments || []).forEach(a => {
      const aId = a.appointment_id || a.id;
      if (aId) aptMap.set(aId, a);
    });
  });
  const allAppointments = Array.from(aptMap.values());

  // Active appointments are strictly NOT completed and NOT cancelled
  const activeAppointments = allAppointments.filter(
    a => a.status !== 'completed' && a.status !== 'cancelled'
  );

  // Due today
  const dueToday = activeAppointments.filter(
    a => a.status === 'due_today' || a.scheduled_date === todayDhaka
  ).length;

  // Overdue
  const overdue = activeAppointments.filter(
    a => a.status === 'overdue' || a.scheduled_date < todayDhaka
  ).length;

  // Upcoming in next 7 days
  const upcoming7Days = activeAppointments.filter(
    a => isDateUpcomingDhaka(a.scheduled_date, 7, referenceDate)
  ).length;

  // 5. Pending assessments: unmeasured baseline anthropometrics or unassessed allergy reconciliation
  const pendingAssessments = patients.filter(p => {
    const isUnmeasured = p.patient.weight_kg === 0 || p.patient.height_cm === 0;
    const isUnreconciled = p.patient.allergy_reconciliation_status === 'not_assessed';
    return isUnmeasured || isUnreconciled;
  }).length;

  // 6. Pending reports: unapproved progress reports or clinical conditions requiring clinician review
  const pendingReports = patients.filter(p => {
    const reports = p.progress_reports || [];
    const hasUnapproved = reports.some(r => !r.is_approved);
    const hasConditionsAwaitingPlan = reports.length === 0 && (p.patient.selected_conditions || []).length > 0;
    return hasUnapproved || hasConditionsAwaitingPlan;
  }).length;

  return {
    totalPatients,
    newThisMonth,
    visitsToday,
    dueToday,
    overdue,
    upcoming7Days,
    pendingAssessments,
    pendingReports
  };
}
