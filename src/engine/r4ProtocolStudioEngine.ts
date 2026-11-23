/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Phase R4: Master Protocol Studio Orchestration Engine
 * 
 * Orchestrates:
 * 1. Automatic Clinical Protocol Generation
 * 2. Manual Protocol Template Instantiation
 * 3. Real-Time Re-evaluation of Chronotherapy & Multi-Axis Safety
 * 4. Immutable Versioning & Approval Gating
 */

import {
  R4ProtocolStudioData,
  LifestyleProtocol,
  ExerciseProtocol,
  SleepCircadianProtocol,
  HydrationProtocol,
  SupplementProtocolItem,
  R4SafetyEvaluation
} from '../types/r4Protocol';
import { PatientProfile } from '../types';
import { ClinicianAuthProfile } from '@/lib/supabaseClient';
import { generateLifestyleRecommendations } from './lifestyleEngine';
import { generateExerciseProtocol } from './exerciseEngine';
import { generateSleepCircadianProtocol } from './sleepEngine';
import { generateHydrationProtocol } from './hydrationEngine';
import { generateCandidateSupplements } from './supplementEngine';
import { buildChronotherapyTimeline } from './chronotherapyEngine';
import { evaluateR4ProtocolSafety } from './r4SafetyEngine';

/**
 * Generate a complete, evidence-based automatic protocol draft for a patient.
 */
export function generateAutomaticProtocolDraft(
  patient: PatientProfile,
  clinician?: ClinicianAuthProfile,
  organizationId: string = 'org-shuddho-default'
): R4ProtocolStudioData {
  const lifestyle = generateLifestyleRecommendations(patient);
  const exercise = generateExerciseProtocol(patient);
  const sleep = generateSleepCircadianProtocol(patient);
  const hydration = generateHydrationProtocol(patient);
  const supplements = generateCandidateSupplements(patient);

  const medications = (patient.medication_records && patient.medication_records.length > 0)
    ? patient.medication_records
    : (patient.active_medications || []);

  const { timeline, conflicts } = buildChronotherapyTimeline(
    lifestyle,
    exercise,
    sleep,
    hydration,
    supplements,
    medications
  );

  const safetyEvaluation = evaluateR4ProtocolSafety(
    lifestyle,
    exercise,
    sleep,
    hydration,
    supplements,
    conflicts,
    patient
  );

  const now = new Date().toISOString();
  const protocolId = `proto-r4-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  return {
    id: protocolId,
    patient_id: patient.id,
    visit_id: patient.current_visit_id || undefined,
    organization_id: organizationId,
    version: 1,
    status: 'draft',
    is_approved: false,
    mode: 'automatic_generated',
    lifestyle,
    exercise,
    sleep,
    hydration,
    supplements,
    chronotherapy_timeline: timeline,
    safety_evaluation: safetyEvaluation,
    created_at: now,
    updated_at: now
  };
}

/**
 * Create a clean manual protocol template for a patient with baseline safe defaults.
 */
export function createManualProtocolTemplate(
  patient: PatientProfile,
  clinician?: ClinicianAuthProfile,
  organizationId: string = 'org-shuddho-default'
): R4ProtocolStudioData {
  const sleep = generateSleepCircadianProtocol(patient);
  const hydration = generateHydrationProtocol(patient);

  const lifestyle: LifestyleProtocol = {
    recommendations: [],
    overall_focus_en: 'Custom Clinician-Guided Lifestyle Plan',
    overall_focus_bn: 'চিকিৎসক পরিচালিত কাস্টম জীবনযাত্রা পরিকল্পনা'
  };

  const exercise: ExerciseProtocol = {
    items: [],
    overall_safety_status: 'SAFE',
    clinical_contraindications: [],
    risk_factors_evaluated: [],
    cardiorespiratory_clearance_status: 'cleared_standard',
    weekly_aerobic_minutes_target: 150,
    weekly_resistance_sessions_target: 2
  };

  const supplements: SupplementProtocolItem[] = [];

  const medications = (patient.medication_records && patient.medication_records.length > 0)
    ? patient.medication_records
    : (patient.active_medications || []);

  const { timeline, conflicts } = buildChronotherapyTimeline(
    lifestyle,
    exercise,
    sleep,
    hydration,
    supplements,
    medications
  );

  const safetyEvaluation = evaluateR4ProtocolSafety(
    lifestyle,
    exercise,
    sleep,
    hydration,
    supplements,
    conflicts,
    patient
  );

  const now = new Date().toISOString();
  const protocolId = `proto-r4-man-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  return {
    id: protocolId,
    patient_id: patient.id,
    visit_id: patient.current_visit_id || undefined,
    organization_id: organizationId,
    version: 1,
    status: 'draft',
    is_approved: false,
    mode: 'manual_created',
    lifestyle,
    exercise,
    sleep,
    hydration,
    supplements,
    chronotherapy_timeline: timeline,
    safety_evaluation: safetyEvaluation,
    created_at: now,
    updated_at: now
  };
}

/**
 * Recalculate chronotherapy timeline and multi-axis safety evaluation
 * following any manual edit to any protocol section.
 */
export function recalculateProtocolSafety(
  protocol: R4ProtocolStudioData,
  patient: PatientProfile
): R4ProtocolStudioData {
  // 1. Recalculate total hydration volume
  const totalHydrationScheduled = protocol.hydration.hydration_events.reduce(
    (sum, evt) => sum + (evt.volume_ml || 0),
    0
  );
  const updatedHydration: HydrationProtocol = {
    ...protocol.hydration,
    total_scheduled_ml: totalHydrationScheduled
  };

  // 2. Rebuild Chronotherapy timeline
  const medications = (patient.medication_records && patient.medication_records.length > 0)
    ? patient.medication_records
    : (patient.active_medications || []);

  const { timeline, conflicts } = buildChronotherapyTimeline(
    protocol.lifestyle,
    protocol.exercise,
    protocol.sleep,
    updatedHydration,
    protocol.supplements,
    medications
  );

  // 3. Re-evaluate safety gates
  const safetyEvaluation = evaluateR4ProtocolSafety(
    protocol.lifestyle,
    protocol.exercise,
    protocol.sleep,
    updatedHydration,
    protocol.supplements,
    conflicts,
    patient
  );

  return {
    ...protocol,
    hydration: updatedHydration,
    chronotherapy_timeline: timeline,
    safety_evaluation: safetyEvaluation,
    mode: protocol.mode === 'automatic_generated' ? 'hybrid_edited' : protocol.mode,
    updated_at: new Date().toISOString()
  };
}
