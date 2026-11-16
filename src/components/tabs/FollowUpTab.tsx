'use client';

import React, { useState, useMemo } from 'react';
import { usePractice, getDhakaTodayDateString } from '@/context/PracticeContext';
import { CLINICAL_PHASES, compareLongitudinalProgress } from '@/engine/phaseProgression';
import { 
  TrendingUp, 
  ArrowRight, 
  Calendar, 
  Plus, 
  CheckCircle, 
  Flame, 
  Sparkles, 
  ShieldCheck,
  Award,
  CalendarClock,
  Clock,
  AlertCircle,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  Search,
  Filter
} from 'lucide-react';
import { FollowUpAppointment, LongitudinalVisit, AppointmentStatus, QuantitativeChange } from '@/types';
import { ComparativeProgressReportView } from '@/components/reports/ComparativeProgressReportView';

type FollowUpSubTab = 'schedule' | 'phases_progress' | 'comparison_workspace' | 'progress_reports';

export const FollowUpTab: React.FC = () => {
  const {
    patient,
    visits,
    addVisit,
    advancePatientPhase,
    language,
    followUpAppointments,
    scheduleFollowUp,
    rescheduleFollowUp,
    cancelFollowUp,
    completeFollowUp,
    clinicalVisits,
    visitSnapshots,
    captureVisitSnapshot,
    progressReports,
    generateProgressReport,
    approveProgressReport
  } = usePractice();

  const bn = language === 'bn';
  const today = getDhakaTodayDateString();

  const [activeSubTab, setActiveSubTab] = useState<FollowUpSubTab>('schedule');

  // Modals state
  const [showAddVisitModal, setShowAddVisitModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState<FollowUpAppointment | null>(null);

  // New Appointment Form State
  const [aptDate, setAptDate] = useState(today);
  const [aptTime, setAptTime] = useState('11:00 AM');
  const [aptReason, setAptReason] = useState('1-Month Dietary Compliance and Symptom Review');
  const [aptType, setAptType] = useState<FollowUpAppointment['appointment_type']>('routine_followup');
  const [aptNotes, setAptNotes] = useState('');

  // Reschedule Form State
  const [reschedDate, setReschedDate] = useState(today);
  const [reschedTime, setReschedTime] = useState('11:00 AM');
  const [reschedReason, setReschedReason] = useState('');

  // Follow-up form state
  const [newWeight, setNewWeight] = useState<number>(patient.weight_kg);
  const [newWaist, setNewWaist] = useState<number>(patient.waist_cm);
  const [newStool, setNewStool] = useState<number>(patient.gut_profile.bristol_stool_score);
  const [newEnergy, setNewEnergy] = useState<number>(patient.gut_profile.energy_score);
  const [newRelief, setNewRelief] = useState<number>(50);
  const [clinicalObs, setClinicalObs] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');

  // Transition form state
  const [transitionRelief, setTransitionRelief] = useState<number>(65);
  const [transitionRationale, setTransitionRationale] = useState<string>('');
  const [transitionObservations, setTransitionObservations] = useState<string>('');

  // Comparison Workspace State
  const [comparisonMode, setComparisonMode] = useState<'baseline_vs_current' | 'previous_vs_current' | 'selected_pair' | 'trend_series'>('baseline_vs_current');
  const [selectedBaselineId, setSelectedBaselineId] = useState<string>(
    visitSnapshots.length > 0 ? visitSnapshots[visitSnapshots.length - 1].visit_id : 'initial'
  );
  const [selectedCurrentId, setSelectedCurrentId] = useState<string>(
    visitSnapshots.length > 0 ? visitSnapshots[0].visit_id : 'current'
  );

  // Active Report in Viewer
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    progressReports.length > 0 ? progressReports[0].report_id : null
  );

  const activeProgressReport = useMemo(() => {
    if (!selectedReportId) return progressReports[0] || null;
    return progressReports.find(r => r.report_id === selectedReportId) || progressReports[0] || null;
  }, [progressReports, selectedReportId]);

  // Baseline comparison for Phase Pipeline
  const comparison = compareLongitudinalProgress([
    {
      visit_id: 'v_baseline',
      visit_date: patient.visit_date,
      phase: 1,
      weight_kg: patient.weight_kg,
      waist_cm: patient.waist_cm,
      whtr: patient.calculated.whtr,
      bristol_stool: patient.gut_profile.bristol_stool_score,
      energy_score: patient.gut_profile.energy_score,
      symptom_relief_pct: 0,
      homa_ir: patient.labs.homa_ir,
      tg_hdl_ratio: patient.labs.tg_hdl_ratio,
      hba1c: patient.labs.hba1c
    },
    ...visits
  ]);

  const handleSaveVisit = () => {
    const whtr = patient.height_cm > 0 ? Math.round((newWaist / patient.height_cm) * 100) / 100 : 0;

    const newV: Partial<LongitudinalVisit> = {
      visit_date: today,
      weight_kg: newWeight,
      waist_cm: newWaist,
      whtr,
      bristol_stool: newStool,
      energy_score: newEnergy,
      symptom_relief_pct: newRelief,
      clinical_observations: clinicalObs,
      notes_bn: newNotes || 'নিয়মিত ফলো-আপ ভিজিট সম্পন্ন; সাধারণ স্বাস্থ্য অগ্রগতি রেকর্ড করা হয়েছে।',
      notes_en: newNotes || 'Routine follow-up consultation logged.'
    };

    addVisit(newV);
    captureVisitSnapshot(false);
    setShowAddVisitModal(false);
  };

  const handleConfirmPhaseAdvance = () => {
    advancePatientPhase({
      actualSymptomReliefPct: transitionRelief,
      rationale: transitionRationale || `Clinician confirmed criteria met for Phase ${patient.current_phase + 1}.`,
      clinicalObservations: transitionObservations || "Patient successfully completed initial phase goals."
    });
    captureVisitSnapshot(false);
    setShowAdvanceModal(false);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    scheduleFollowUp({
      patient_id: patient.id,
      patient_name: patient.name,
      scheduled_date: aptDate,
      scheduled_time: aptTime,
      reason: aptReason,
      appointment_type: aptType,
      clinician_notes: aptNotes
    });
    setShowScheduleModal(false);
    setAptNotes('');
  };

  const handleConfirmReschedule = () => {
    if (!showRescheduleModal) return;
    rescheduleFollowUp(showRescheduleModal.appointment_id, reschedDate, reschedTime, reschedReason);
    setShowRescheduleModal(null);
    setReschedReason('');
  };

  const handleGenerateReportClick = () => {
    const report = generateProgressReport(selectedBaselineId, selectedCurrentId, comparisonMode);
    if (report) {
      setSelectedReportId(report.report_id);
      setActiveSubTab('progress_reports');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Sub-Navigation Tabs ─────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 border-b pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('schedule')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition ${
            activeSubTab === 'schedule'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
          }`}
        >
          <CalendarClock className="h-4 w-4" />
          <span>{bn ? '১. ফলো-আপ শিডিউল ও অ্যাপয়েন্টমেন্ট' : '1. Schedule & Appointments'}</span>
          {followUpAppointments.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/20 text-current">
              {followUpAppointments.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('phases_progress')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition ${
            activeSubTab === 'phases_progress'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>{bn ? '২. ৪-পর্যায়ের কেয়ার প্রোগ্রাম ও লগ' : '2. 4-Phase Program & Logs'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/20 text-current">
            Phase {patient.current_phase}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('comparison_workspace')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition ${
            activeSubTab === 'comparison_workspace'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>{bn ? '৩. লংগিটিউডিনাল তুলনা ওয়ার্কস্পেস' : '3. Comparison Workspace'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('progress_reports')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition ${
            activeSubTab === 'progress_reports'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>{bn ? '৪. তুলনামূলক প্রগ্রেস রিপোর্ট (A4)' : '4. Progress Reports (A4)'}</span>
          {progressReports.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/20 text-current">
              {progressReports.length}
            </span>
          )}
        </button>
      </div>

      {/* ── SUB-TAB 1: Schedule & Appointments ──────────────────────── */}
      {activeSubTab === 'schedule' && (
        <div className="space-y-6">
          <div className="bg-card border rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-sm sm:text-base text-foreground">
                  {bn ? 'ফলো-আপ অ্যাপয়েন্টমেন্ট শিডিউলিং সাবসিস্টেম' : 'Follow-Up Scheduling Subsystem'}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {bn ? `এশিয়া/ঢাকা সময়ানুযায়ী স্বয়ংক্রিয় স্ট্যাটাস ট্র্যাকিং • আজকের তারিখ: ${today}` : `Asia/Dhaka timezone • Current date: ${today}`}
              </p>
            </div>

            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="h-4 w-4" />
              <span>{bn ? '+ নতুন অ্যাপয়েন্টমেন্ট শিডিউল' : '+ Schedule Follow-Up'}</span>
            </button>
          </div>

          {/* Appointments Table */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{bn ? 'অ্যাপয়েন্টমেন্ট তালিকা ও স্ট্যাটাস' : 'Appointments & Status Log'}</span>
              </h3>
              <span className="text-xs text-muted-foreground">
                {followUpAppointments.length} {bn ? 'টি সাক্ষাৎকার' : 'records'}
              </span>
            </div>

            {followUpAppointments.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-muted/20 border border-dashed text-muted-foreground text-xs space-y-2">
                <Calendar className="h-8 w-8 mx-auto opacity-40" />
                <div>{bn ? 'কোনো ফলো-আপ অ্যাপয়েন্টমেন্ট নির্ধারিত নেই।' : 'No follow-up appointments scheduled yet.'}</div>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  {bn ? 'প্রথম অ্যাপয়েন্টমেন্ট শিডিউল করুন' : 'Schedule first appointment'}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="pb-2 font-medium">{bn ? 'তারিখ ও সময়' : 'Date & Time'}</th>
                      <th className="pb-2 font-medium">{bn ? 'রোগী' : 'Patient'}</th>
                      <th className="pb-2 font-medium">{bn ? 'ধরন' : 'Type'}</th>
                      <th className="pb-2 font-medium">{bn ? 'কারণ' : 'Reason'}</th>
                      <th className="pb-2 font-medium">{bn ? 'স্ট্যাটাস' : 'Status'}</th>
                      <th className="pb-2 font-medium text-right">{bn ? 'অ্যাকশন' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {followUpAppointments.map(apt => (
                      <tr key={apt.appointment_id} className="hover:bg-muted/10 transition">
                        <td className="py-3">
                          <div className="font-bold text-foreground">{apt.scheduled_date}</div>
                          <div className="text-[10px] text-muted-foreground">{apt.scheduled_time || 'Morning'}</div>
                        </td>
                        <td className="py-3">
                          <div className="font-semibold text-foreground">{apt.patient_name || apt.patient_id}</div>
                          <div className="text-[10px] text-muted-foreground">{apt.patient_id}</div>
                        </td>
                        <td className="py-3">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary font-medium">
                            {apt.appointment_type || 'routine'}
                          </span>
                        </td>
                        <td className="py-3 text-muted-foreground max-w-xs truncate">
                          {apt.reason || apt.reason_en || apt.reason_bn || 'Routine follow-up'}
                        </td>
                        <td className="py-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              apt.status === 'due_today'
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                : apt.status === 'overdue'
                                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                : apt.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : apt.status === 'rescheduled'
                                ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                : 'bg-secondary text-foreground'
                            }`}
                          >
                            {apt.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 text-right space-x-1">
                          {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                            <>
                              <button
                                onClick={() => {
                                  setShowRescheduleModal(apt);
                                  setReschedDate(apt.scheduled_date);
                                  setReschedTime(apt.scheduled_time || '11:00 AM');
                                }}
                                className="px-2 py-1 rounded-lg border bg-secondary/50 hover:bg-secondary text-[11px] font-semibold text-foreground transition"
                              >
                                {bn ? 'রি-শিডিউল' : 'Reschedule'}
                              </button>

                              <button
                                onClick={() => completeFollowUp(apt.appointment_id)}
                                className="px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-semibold transition"
                              >
                                {bn ? 'সম্পন্ন' : 'Complete'}
                              </button>

                              <button
                                onClick={() => cancelFollowUp(apt.appointment_id)}
                                className="p-1 rounded text-rose-500 hover:bg-rose-500/10 transition inline-block align-middle"
                                title="Cancel"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUB-TAB 2: Care Program Phases & Historical Visits ──────── */}
      {activeSubTab === 'phases_progress' && (
        <div className="space-y-6">
          {/* Care Phase Progress Pipeline */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="font-bold text-sm text-foreground">
                    {bn ? '৪-পর্যায়ের ক্লিনিক্যাল কেয়ার প্রোগ্রাম (Phases 1 to 4)' : '4-Phase Clinical Care Progression'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {bn ? 'কার্যকরী নিরাময়, অন্ত্র পুনর্বাসন ও টেকসই মেটাবলিক রূপান্তর' : 'Systematic Gut Reset, Metabolic Rebuild & Maintenance'}
                  </p>
                </div>
              </div>

              {patient.current_phase < 4 ? (
                <button
                  onClick={() => setShowAdvanceModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{bn ? `পরবর্তী ফেজে রূপান্তর মূল্যায়ন (Phase ${patient.current_phase + 1})` : `Evaluate Transition to Phase ${patient.current_phase + 1}`}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-500 font-bold text-xs border border-emerald-500/30 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  <span>{bn ? 'চূড়ান্ত ফেজ ৪ সক্রিয় (আজীবন সুস্থতা)' : 'Phase 4 Active (Maintenance)'}</span>
                </span>
              )}
            </div>

            {/* 4 Phase Pipeline Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {([1, 2, 3, 4] as const).map(pNum => {
                const info = CLINICAL_PHASES[pNum];
                const isCurrent = patient.current_phase === pNum;
                const isCompleted = patient.current_phase > pNum;

                return (
                  <div
                    key={pNum}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      isCurrent
                        ? 'bg-primary/10 border-primary ring-2 ring-primary/40 shadow-sm'
                        : isCompleted
                        ? 'bg-secondary/40 border-emerald-500/30 text-muted-foreground'
                        : 'bg-background/50 border-dashed text-muted-foreground/60'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isCurrent 
                            ? 'bg-primary text-primary-foreground' 
                            : isCompleted 
                            ? 'bg-emerald-500/20 text-emerald-500' 
                            : 'bg-secondary text-muted-foreground'
                        }`}>
                          {isCompleted ? 'COMPLETED' : isCurrent ? 'ACTIVE PHASE' : `PHASE ${pNum}`}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{info.duration_weeks}</span>
                      </div>

                      <h3 className={`font-semibold text-xs leading-snug mt-2 ${isCurrent ? 'text-primary font-bold' : 'text-foreground'}`}>
                        {bn ? info.title_bn : info.title_en}
                      </h3>

                      <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                        {bn ? info.core_focus_bn : info.core_focus_en}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-border/50 text-[10px]">
                      <strong className="text-foreground">{bn ? 'খাদ্য সংযোজন:' : 'Allowed Foods:'} </strong>
                      <span className="text-muted-foreground">{bn ? info.allowed_reintroductions_bn : info.allowed_reintroductions_en}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Longitudinal Delta Comparison Cards */}
          {comparison && (
            <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span>{bn ? 'বেসলাইন বনাম বর্তমান ফলো-আপ ডেল্টা মেট্রিক্স' : 'Baseline vs Current Follow-Up Deltas'}</span>
                </div>
                <button
                  onClick={() => setShowAddVisitModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition"
                >
                  <Plus className="h-3.5 w-3.5 text-primary" />
                  <span>{bn ? 'নিয়মিত ফলো-আপ ভিজিট রেকর্ড' : 'Log Regular Visit'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-xl border bg-background space-y-1">
                  <div className="text-[11px] text-muted-foreground">{bn ? 'ওজন পরিবর্তন (Weight Δ):' : 'Weight Delta:'}</div>
                  <div className="text-lg font-bold text-emerald-500">
                    {comparison.weightDeltaKg > 0 ? `+${comparison.weightDeltaKg}` : comparison.weightDeltaKg} kg
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {comparison.weightDeltaPct}% {bn ? 'পরিবর্তন' : 'change'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border bg-background space-y-1">
                  <div className="text-[11px] text-muted-foreground">{bn ? 'কোমর অনুপাত (WHtR Δ):' : 'WHtR Delta:'}</div>
                  <div className={`text-lg font-bold ${comparison.whtrDelta <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {comparison.whtrDelta > 0 ? `+${comparison.whtrDelta}` : comparison.whtrDelta}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {bn ? 'ভিসেরাল ফ্যাট হ্রাস' : 'Visceral fat impact'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border bg-background space-y-1">
                  <div className="text-[11px] text-muted-foreground">{bn ? 'ব্রিস্টল স্টুল উন্নতি:' : 'Bristol Stool Δ:'}</div>
                  <div className="text-lg font-bold text-blue-500">
                    Type {comparison.baselineVisit.bristol_stool} ➔ {comparison.latestVisit.bristol_stool}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {comparison.latestVisit.bristol_stool === 4 ? (bn ? 'আদর্শ টাইপ ৪' : 'Optimal Type 4') : (bn ? 'উন্নতিশীল' : 'Improving')}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border bg-background space-y-1">
                  <div className="text-[11px] text-muted-foreground">{bn ? 'উপসর্গ উপশম (Relief):' : 'Evaluated Relief:'}</div>
                  <div className="text-lg font-bold text-purple-500">
                    +{comparison.latestVisit.symptom_relief_pct}%
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {bn ? 'ক্লিনিক্যাল মূল্যায়ন' : 'Clinician Evaluated'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border bg-background space-y-1">
                  <div className="text-[11px] text-muted-foreground">HOMA-IR:</div>
                  <div className="text-lg font-bold text-amber-500">
                    {patient.labs.homa_ir || 'N/A'}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {bn ? 'ইনসুলিন সংবেদনশীলতা' : 'Insulin sensitivity'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border bg-background space-y-1">
                  <div className="text-[11px] text-muted-foreground">TG / HDL:</div>
                  <div className="text-lg font-bold text-rose-500">
                    {patient.labs.tg_hdl_ratio || 'N/A'}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {bn ? 'এথেরোজেনিক মার্কার' : 'Atherogenic index'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Consultation History Table */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{bn ? 'লংগিটিউডিনাল কনসালটেশন ও ফলো-আপ লগ' : 'Longitudinal Consultation History'}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {visits.length + 1} {bn ? 'টি ভিজিট রেকর্ড সংরক্ষিত' : 'visits on file'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/30 text-muted-foreground border-b text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">{bn ? 'তারিখ' : 'Date'}</th>
                    <th className="py-2.5 px-3 font-semibold">{bn ? 'ফেজ' : 'Phase'}</th>
                    <th className="py-2.5 px-3 font-semibold">{bn ? 'ওজন' : 'Weight'}</th>
                    <th className="py-2.5 px-3 font-semibold">{bn ? 'কোমর (WHtR)' : 'Waist (WHtR)'}</th>
                    <th className="py-2.5 px-3 font-semibold">{bn ? 'ব্রিস্টল স্টুল' : 'Bristol Stool'}</th>
                    <th className="py-2.5 px-3 font-semibold">{bn ? 'উপশম %' : 'Relief %'}</th>
                    <th className="py-2.5 px-4 font-semibold">{bn ? 'পর্যবেক্ষণ ও নোট' : 'Observations & Notes'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr className="hover:bg-accent/20">
                    <td className="py-3 px-4 font-bold text-foreground">
                      {patient.visit_date} (Baseline)
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px]">
                        Phase 1
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold">{patient.weight_kg} kg</td>
                    <td className="py-3 px-3">{patient.waist_cm} cm ({patient.calculated.whtr})</td>
                    <td className="py-3 px-3">Type {patient.gut_profile.bristol_stool_score}</td>
                    <td className="py-3 px-3">Baseline</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {bn ? 'প্রাথমিক পূর্ণাঙ্গ মূল্যায়ন ও ফেজ ১ প্রেসক্রিপশন প্রদান।' : 'Initial comprehensive functional nutrition intake.'}
                    </td>
                  </tr>

                  {visits.map((v, idx) => (
                    <tr key={v.visit_id || idx} className="hover:bg-accent/20">
                      <td className="py-3 px-4 font-bold text-foreground">
                        {v.visit_date}
                        {v.is_phase_transition && (
                          <span className="ml-1 text-[9px] px-1 py-0.2 bg-emerald-500/20 text-emerald-600 rounded font-bold">
                            TRANSITION
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px]">
                          Phase {v.phase}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold">{v.weight_kg} kg</td>
                      <td className="py-3 px-3">{v.waist_cm} cm ({v.whtr})</td>
                      <td className="py-3 px-3">Type {v.bristol_stool}</td>
                      <td className="py-3 px-3 text-emerald-500 font-bold">+{v.symptom_relief_pct}%</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <div>{bn ? v.notes_bn : v.notes_en}</div>
                        {v.clinical_observations && (
                          <div className="text-[10px] text-muted-foreground/80 mt-0.5 italic">
                            Obs: {v.clinical_observations}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-TAB 3: Comparison Workspace ─────────────────────────── */}
      {activeSubTab === 'comparison_workspace' && (
        <div className="space-y-6">
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <h2 className="font-bold text-sm text-foreground">
                  {bn ? 'লংগিটিউডিনাল ক্লিনিক্যাল তুলনা ইঞ্জিন' : 'Deterministic Longitudinal Comparison Engine'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {bn
                    ? '৪টি তুলনা মোড: বেসলাইন বনাম বর্তমান, পূর্ববর্তী বনাম বর্তমান, নির্বাচিত জোড়া, বহু-ভিজিট ট্রেন্ড'
                    : 'Contextual interpretations: bidirectional Bristol stool, population-aware weight delta'}
                </p>
              </div>

              <button
                onClick={handleGenerateReportClick}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-sm transition self-start sm:self-auto"
              >
                <FileText className="h-4 w-4" />
                <span>{bn ? 'প্রগ্রেস রিপোর্ট তৈরি করুন' : 'Generate Progress Report'}</span>
              </button>
            </div>

            {/* Comparison Mode Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setComparisonMode('baseline_vs_current')}
                className={`p-3 rounded-xl border text-left text-xs transition ${
                  comparisonMode === 'baseline_vs_current'
                    ? 'bg-primary/10 border-primary text-primary font-bold'
                    : 'bg-card text-muted-foreground hover:bg-muted/20'
                }`}
              >
                <div>Mode A: Baseline vs Current</div>
                <div className="text-[10px] opacity-80 mt-0.5">{bn ? 'প্রারম্ভিক বনাম বর্তমান' : 'Total trajectory'}</div>
              </button>

              <button
                onClick={() => setComparisonMode('previous_vs_current')}
                className={`p-3 rounded-xl border text-left text-xs transition ${
                  comparisonMode === 'previous_vs_current'
                    ? 'bg-primary/10 border-primary text-primary font-bold'
                    : 'bg-card text-muted-foreground hover:bg-muted/20'
                }`}
              >
                <div>Mode B: Previous vs Current</div>
                <div className="text-[10px] opacity-80 mt-0.5">{bn ? 'পূর্ববর্তী বনাম বর্তমান' : 'Immediate delta'}</div>
              </button>

              <button
                onClick={() => setComparisonMode('selected_pair')}
                className={`p-3 rounded-xl border text-left text-xs transition ${
                  comparisonMode === 'selected_pair'
                    ? 'bg-primary/10 border-primary text-primary font-bold'
                    : 'bg-card text-muted-foreground hover:bg-muted/20'
                }`}
              >
                <div>Mode C: Selected vs Selected</div>
                <div className="text-[10px] opacity-80 mt-0.5">{bn ? 'যেকোনো দুই ভিজিটের তুলনা' : 'Arbitrary pair'}</div>
              </button>

              <button
                onClick={() => setComparisonMode('trend_series')}
                className={`p-3 rounded-xl border text-left text-xs transition ${
                  comparisonMode === 'trend_series'
                    ? 'bg-primary/10 border-primary text-primary font-bold'
                    : 'bg-card text-muted-foreground hover:bg-muted/20'
                }`}
              >
                <div>Mode D: Multi-Visit Trend</div>
                <div className="text-[10px] opacity-80 mt-0.5">{bn ? 'ধারাবাহিক ট্রেন্ড' : 'All consultations'}</div>
              </button>
            </div>

            {/* Snapshot Selector if Selected Pair */}
            {comparisonMode === 'selected_pair' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-muted/20 border text-xs">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {bn ? 'বেসলাইন / রেফারেন্স স্ন্যাপশট:' : 'Baseline / Reference Snapshot:'}
                  </label>
                  <select
                    value={selectedBaselineId}
                    onChange={e => setSelectedBaselineId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border bg-background"
                  >
                    {visitSnapshots.map(s => (
                      <option key={s.snapshot_id} value={s.visit_id}>
                        {s.visit_date} (Visit: {s.visit_id}) {s.is_baseline ? '- Baseline' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {bn ? 'তুলনামূলক বর্তমান স্ন্যাপশট:' : 'Comparison / Current Snapshot:'}
                  </label>
                  <select
                    value={selectedCurrentId}
                    onChange={e => setSelectedCurrentId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border bg-background"
                  >
                    {visitSnapshots.map(s => (
                      <option key={s.snapshot_id} value={s.visit_id}>
                        {s.visit_date} (Visit: {s.visit_id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUB-TAB 4: Comparative Progress Reports (A4) ────────────── */}
      {activeSubTab === 'progress_reports' && (
        <div className="space-y-6">
          {progressReports.length > 1 && (
            <div className="flex items-center gap-2 p-3 bg-card border rounded-2xl text-xs overflow-x-auto no-scrollbar">
              <span className="font-semibold text-muted-foreground shrink-0">
                {bn ? 'রিপোর্ট নির্বাচন:' : 'Select Report:'}
              </span>
              {progressReports.map(r => (
                <button
                  key={r.report_id}
                  onClick={() => setSelectedReportId(r.report_id)}
                  className={`px-3 py-1 rounded-lg shrink-0 font-medium transition ${
                    selectedReportId === r.report_id
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'border bg-secondary/50 text-foreground hover:bg-secondary'
                  }`}
                >
                  {r.sectionA_patientAndConsultation.comparison_date} ({r.is_approved ? 'Approved' : 'Draft'})
                </button>
              ))}
            </div>
          )}

          {activeProgressReport ? (
            <ComparativeProgressReportView
              report={activeProgressReport}
              onApprove={approveProgressReport}
            />
          ) : (
            <div className="p-12 text-center rounded-2xl bg-card border border-dashed space-y-3">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground opacity-40" />
              <h3 className="font-bold text-sm text-foreground">
                {bn ? 'কোনো তুলনামূলক প্রগ্রেস রিপোর্ট তৈরি করা হয়নি' : 'No Comparative Progress Reports Generated Yet'}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {bn
                  ? 'পূর্ববর্তী ভিজিট ও বর্তমান ভিজিটের পরিমাপ তুলনা করে নতুন A4 প্রগ্রেস রিপোর্ট তৈরি করুন।'
                  : 'Execute deterministic longitudinal comparison to produce an A4 report with nutritionist sign-off.'}
              </p>
              <button
                onClick={handleGenerateReportClick}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition shadow-sm"
              >
                {bn ? 'প্রগ্রেস রিপোর্ট তৈরি করুন' : 'Generate Progress Report'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Schedule Follow-Up Appointment ──────────────────── */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                <CalendarClock className="h-4 w-4 text-primary" />
                <span>{bn ? 'নতুন ফলো-আপ শিডিউল করুন' : 'Schedule Follow-Up Appointment'}</span>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-muted-foreground text-xs">✕</button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {bn ? 'তারিখ (Date) *' : 'Appointment Date *'}
                </label>
                <input
                  type="date"
                  required
                  value={aptDate}
                  onChange={e => setAptDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-background"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {bn ? 'সময় (Time)' : 'Scheduled Time'}
                </label>
                <input
                  type="text"
                  value={aptTime}
                  onChange={e => setAptTime(e.target.value)}
                  placeholder="11:00 AM"
                  className="w-full px-3 py-2 rounded-xl border bg-background"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {bn ? 'পরামর্শের ধরন' : 'Appointment Type'}
                </label>
                <select
                  value={aptType}
                  onChange={e => setAptType(e.target.value as FollowUpAppointment['appointment_type'])}
                  className="w-full px-3 py-2 rounded-xl border bg-background"
                >
                  <option value="routine_followup">{bn ? 'নিয়মিত ফলো-আপ (Routine Follow-Up)' : 'Routine Follow-Up'}</option>
                  <option value="lab_review">{bn ? 'ল্যাব রিপোর্ট পর্যালোচনা (Lab Review)' : 'Lab Review'}</option>
                  <option value="acute_flare_review">{bn ? 'তীব্র উপসর্গ বা ফ্লেয়ার পর্যালোচনা' : 'Acute Flare Review'}</option>
                  <option value="comprehensive_reassessment">{bn ? 'পূর্ণাঙ্গ পুনঃমূল্যায়ন (Comprehensive)' : 'Comprehensive Reassessment'}</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {bn ? 'উদ্দেশ্য / কারণ *' : 'Clinical Reason / Objective *'}
                </label>
                <input
                  type="text"
                  required
                  value={aptReason}
                  onChange={e => setAptReason(e.target.value)}
                  placeholder="1-Month Dietary Compliance and Symptom Review"
                  className="w-full px-3 py-2 rounded-xl border bg-background"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {bn ? 'ক্লিনিক্যাল মন্তব্য (ঐচ্ছিক)' : 'Clinician Notes (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={aptNotes}
                  onChange={e => setAptNotes(e.target.value)}
                  placeholder={bn ? 'প্রয়োজনীয় ল্যাব টেস্ট বা বিশেষ পর্যবেক্ষণ...' : 'Special instructions or tests to review...'}
                  className="w-full px-3 py-2 rounded-xl border bg-background"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-3 py-1.5 rounded-xl border bg-secondary/50 text-xs font-semibold"
                >
                  {bn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
                >
                  {bn ? 'শিডিউল নিশ্চিত করুন' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Reschedule Appointment ──────────────────────────── */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="font-bold text-sm text-foreground">
                {bn ? 'ফলো-আপ পুনঃনির্ধারণ' : 'Reschedule Appointment'}
              </div>
              <button onClick={() => setShowRescheduleModal(null)} className="text-muted-foreground text-xs">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {bn ? 'নতুন তারিখ' : 'New Date'}
                </label>
                <input
                  type="date"
                  value={reschedDate}
                  onChange={e => setReschedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-background"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {bn ? 'নতুন সময়' : 'New Time'}
                </label>
                <input
                  type="text"
                  value={reschedTime}
                  onChange={e => setReschedTime(e.target.value)}
                  placeholder="11:00 AM"
                  className="w-full px-3 py-2 rounded-xl border bg-background"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {bn ? 'পুনঃনির্ধারণের কারণ' : 'Reason for Reschedule'}
                </label>
                <input
                  type="text"
                  value={reschedReason}
                  onChange={e => setReschedReason(e.target.value)}
                  placeholder={bn ? 'রোগীর অনুরোধ বা চিকিৎসকের সময়সূচি পরিবর্তন...' : 'Patient request or scheduling change...'}
                  className="w-full px-3 py-2 rounded-xl border bg-background"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(null)}
                  className="px-3 py-1.5 rounded-xl border bg-secondary/50 text-xs font-semibold"
                >
                  {bn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReschedule}
                  className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
                >
                  {bn ? 'পুনঃনির্ধারণ নিশ্চিত করুন' : 'Confirm Reschedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Log Follow-Up (Regular Visit) ────────────────────── */}
      {showAddVisitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-foreground">
                {bn ? 'নতুন ফলো-আপ ভিজিট সংরক্ষণ করুন' : 'Log Regular Follow-Up Visit'}
              </h3>
              <button 
                onClick={() => setShowAddVisitModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    {bn ? 'বর্তমান ওজন (kg)' : 'Weight (kg)'}
                  </label>
                  <input 
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={e => setNewWeight(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    {bn ? 'কোমরের মাপ (cm)' : 'Waist (cm)'}
                  </label>
                  <input 
                    type="number"
                    step="0.5"
                    value={newWaist}
                    onChange={e => setNewWaist(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    {bn ? 'ব্রিস্টল স্টুল (1-7)' : 'Bristol Stool (1-7)'}
                  </label>
                  <select
                    value={newStool}
                    onChange={e => setNewStool(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border bg-background text-foreground"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(s => (
                      <option key={s} value={s}>Type {s} {s === 4 ? '(Optimal)' : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    {bn ? 'শক্তি স্কোর (1-10)' : 'Energy Score (1-10)'}
                  </label>
                  <input 
                    type="number"
                    min="1"
                    max="10"
                    value={newEnergy}
                    onChange={e => setNewEnergy(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border bg-background text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  {bn ? 'উপসর্গ উপশম শতাংশ (%)' : 'Symptom Relief (%)'}
                </label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={newRelief}
                    onChange={e => setNewRelief(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="font-bold text-foreground w-12 text-right">{newRelief}%</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  {bn ? 'ক্লিনিক্যাল পর্যবেক্ষণ' : 'Clinical Observations'}
                </label>
                <textarea 
                  rows={2}
                  value={clinicalObs}
                  onChange={e => setClinicalObs(e.target.value)}
                  placeholder={bn ? 'রোগীর সামগ্রিক শারীরিক ও মানসিক অবস্থার পরিবর্তন...' : 'Key functional changes noted...'}
                  className="w-full px-3 py-1.5 rounded-xl border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  {bn ? 'পরামর্শ নোট' : 'Consultation Notes'}
                </label>
                <textarea 
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder={bn ? 'পরবর্তী ভিজিটের জন্য নির্দেশনা...' : 'Directives for upcoming review...'}
                  className="w-full px-3 py-1.5 rounded-xl border bg-background text-foreground"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                onClick={() => setShowAddVisitModal(false)}
                className="px-3.5 py-1.5 rounded-xl border bg-secondary/50 text-xs font-semibold"
              >
                {bn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveVisit}
                className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
              >
                {bn ? 'ভিজিট সংরক্ষণ করুন' : 'Save Visit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Phase Transition ────────────────────────────────── */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>{bn ? `ফেজ ${patient.current_phase + 1} এ রূপান্তর অনুমোদন` : `Approve Transition to Phase ${patient.current_phase + 1}`}</span>
              </h3>
              <button onClick={() => setShowAdvanceModal(false)} className="text-muted-foreground text-sm font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  {bn ? 'নিশ্চিত উপসর্গ উপশম (%)' : 'Confirmed Symptom Relief (%)'}
                </label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range"
                    min="50"
                    max="100"
                    value={transitionRelief}
                    onChange={e => setTransitionRelief(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="font-bold text-foreground w-12 text-right">{transitionRelief}%</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  {bn ? 'চিকিৎসকের রূপান্তর যুক্তি (Rationale) *' : 'Clinician Rationale *'}
                </label>
                <textarea 
                  rows={2}
                  value={transitionRationale}
                  onChange={e => setTransitionRationale(e.target.value)}
                  placeholder={bn ? 'রোগীর উন্নতি সন্তোষজনক হওয়ায় পরবর্তী ফেজে খাদ্য বৈচিত্র্য বৃদ্ধির সিদ্ধান্ত...' : 'Patient has met initial gut reset goals; ready for systematic food reintroduction...'}
                  className="w-full px-3 py-1.5 rounded-xl border bg-background text-foreground"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="px-3.5 py-1.5 rounded-xl border bg-secondary/50 text-xs font-semibold"
              >
                {bn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmPhaseAdvance}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                {bn ? 'ফেজ রূপান্তর নিশ্চিত করুন' : 'Confirm Phase Advance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
