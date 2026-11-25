'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { usePractice } from '@/context/PracticeContext';
import { CLINICAL_PHASES } from '@/engine/phaseProgression';
import { 
  Printer, 
  Globe, 
  ShieldCheck, 
  Activity, 
  Clock, 
  Utensils, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Lock,
  FileText,
  TrendingUp,
  Award,
  Sparkles,
  UserCheck,
  Calendar,
  CheckCircle2,
  HeartHandshake
} from 'lucide-react';
import { ComparativeProgressReportView } from '@/components/reports/ComparativeProgressReportView';
import { FunctionalNutritionReport } from '@/components/p2/FunctionalNutritionReport';
import { ClinicianReportView } from '@/components/reports/ClinicianReportView';
import { PatientDietReportView } from '@/components/reports/PatientDietReportView';
import { 
  buildClinicianReportProjection, 
  buildPatientReportProjection, 
  validateReportReleaseEligibility 
} from '@/engine/reports/dualReportEngine';
import { getLatestVisitSnapshot } from '@/engine/snapshot/snapshotManager';
import { ClinicalVisit, WeeklyDietPlan } from '@/types';

type ReportStudioMode = 'clinician' | 'patient';
type ClinicianSubTab = 'weekly_diet_plan' | 'diet_prescription' | 'clinical_assessment' | 'comparative_progress';

export const ReportTab: React.FC = () => {
  const { 
    patient, 
    dietChart, 
    trafficLight, 
    dniResult, 
    candidateSupplements, 
    language, 
    setLanguage,
    clinicalSafetyEvaluation,
    p2AnalysisResult,
    previewP2AnalysisResult,
    approveP2Analysis,
    currentProgressReport,
    generateProgressReport,
    approveProgressReport,
    selectProgressReport,
    setActiveTab,
    currentVisit,
    clinicalVisits,
    selectVisit,
    selectedReportVisitId,
    selectReportVisit,
    progressReports,
    visitSnapshots,
    weeklyDietPlan,
    generateWeeklyPlan,
    isDietPlanDirty,
    r5NutritionContract,
    r5Medications,
    r4Protocol,
    reportStudioMode,
    setReportStudioMode,
    setReportReleaseGate
  } = usePractice();

  // Primary studio mode: Clinician (U20) or Patient (U21)
  const reportMode = reportStudioMode;
  const setReportMode = setReportStudioMode;
  
  // Clinician subtab (defaulting to 7-Day Weekly Nutrition Plan)
  const [clinicianSubTab, setClinicianSubTab] = useState<ClinicianSubTab>('weekly_diet_plan');

  const bn = language === 'bn';
  const phaseInfo = CLINICAL_PHASES[patient.current_phase || 1];

  // Derive the active visit specifically selected for report viewing
  const activeReportVisitId = selectedReportVisitId || currentVisit?.visit_id || currentVisit?.id || patient.current_visit_id;
  const activeReportVisit = useMemo<ClinicalVisit | null>(() => {
    if (clinicalVisits && clinicalVisits.length > 0) {
      const match = clinicalVisits.find(v => v.visit_id === activeReportVisitId || v.id === activeReportVisitId);
      if (match) return match;
    }
    return currentVisit;
  }, [clinicalVisits, activeReportVisitId, currentVisit]);

  // Isolate active consultation P2 analysis from historical report preview data
  const isCurrentActiveVisit = Boolean(
    (patient.current_visit_id && (activeReportVisitId === patient.current_visit_id)) ||
    (!patient.current_visit_id && currentVisit && (activeReportVisitId === currentVisit.visit_id || activeReportVisitId === currentVisit.id))
  );

  const activeDisplayP2 = isCurrentActiveVisit ? p2AnalysisResult : previewP2AnalysisResult;

  // Effective patient demographic context for report
  const targetVisitId = activeReportVisit?.visit_id || activeReportVisit?.id || patient.current_visit_id;
  const visitSnapshot = useMemo(() => {
    return targetVisitId ? getLatestVisitSnapshot(visitSnapshots, targetVisitId) : undefined;
  }, [visitSnapshots, targetVisitId]);

  const effectivePatientForReport = useMemo(() => {
    if (!activeReportVisit || targetVisitId === patient.current_visit_id) {
      return patient;
    }
    const snap = visitSnapshot;
    return {
      ...patient,
      current_visit_id: targetVisitId,
      visit_date: activeReportVisit.visit_date || patient.visit_date,
      weight_kg: activeDisplayP2?.report?.sectionB_anthropometrics?.weight_kg ?? (snap?.anthropometrics?.weight_kg ?? patient.weight_kg),
      height_cm: activeDisplayP2?.report?.sectionB_anthropometrics?.height_cm ?? (snap?.anthropometrics?.height_cm ?? patient.height_cm),
      waist_cm: snap?.anthropometrics?.waist_cm ?? patient.waist_cm
    };
  }, [patient, activeReportVisit, targetVisitId, visitSnapshot, activeDisplayP2]);

  // Derive effective nutrition plan and diet chart:
  // For the active current consultation: use live weeklyDietPlan and dietChart.
  // For historical visits: retrieve the snapshot recorded for that visit.
  // If the historical snapshot has no diet plan, DO NOT leak the live current plan!
  const effectiveWeeklyDietPlan = useMemo<WeeklyDietPlan | null>(() => {
    if (isCurrentActiveVisit) {
      return weeklyDietPlan;
    }
    return (visitSnapshot as any)?.weekly_diet_plan || null;
  }, [isCurrentActiveVisit, weeklyDietPlan, visitSnapshot]);

  const effectiveDietChart = useMemo<any[]>(() => {
    if (isCurrentActiveVisit) {
      return dietChart;
    }
    return (visitSnapshot as any)?.diet_chart || (effectiveWeeklyDietPlan?.days?.[0]?.meals) || [];
  }, [isCurrentActiveVisit, dietChart, visitSnapshot, effectiveWeeklyDietPlan]);

  const isHistoricalVisitWithoutPlan = !isCurrentActiveVisit && !effectiveWeeklyDietPlan && (!effectiveDietChart || effectiveDietChart.length === 0);

  // Subtab Single-Day vs 7-Day distinction
  const isSingleDayClinicianMode = clinicianSubTab === 'diet_prescription';

  // Effective medications for selected visit (isolated from live medications on historical views)
  const effectiveMedicationsForReport = useMemo(() => {
    if (isCurrentActiveVisit) {
      return r5Medications;
    }
    return ((visitSnapshot?.medications?.reconciled_records as any) || []);
  }, [isCurrentActiveVisit, r5Medications, visitSnapshot]);

  // Build Authoritative Projections
  const clinicianPayload = useMemo(() => {
    return buildClinicianReportProjection({
      patient: effectivePatientForReport,
      dietChart: effectiveDietChart,
      weeklyDietPlan: effectiveWeeklyDietPlan,
      dniResult,
      trafficLight,
      p2AnalysisResult: activeDisplayP2,
      candidateSupplements,
      visit: activeReportVisit,
      includeAllDays: !isSingleDayClinicianMode,
      activeDayNumber: 1
    });
  }, [effectivePatientForReport, effectiveDietChart, effectiveWeeklyDietPlan, dniResult, trafficLight, activeDisplayP2, candidateSupplements, activeReportVisit, isSingleDayClinicianMode]);

  const effectiveR4ProtocolForReport = useMemo(() => {
    if (isCurrentActiveVisit) {
      return r4Protocol;
    }
    return (visitSnapshot as any)?.r4_protocol || undefined;
  }, [isCurrentActiveVisit, r4Protocol, visitSnapshot]);

  const patientPayload = useMemo(() => {
    return buildPatientReportProjection({
      patient: effectivePatientForReport,
      dietChart: effectiveDietChart,
      weeklyDietPlan: effectiveWeeklyDietPlan,
      dniResult,
      trafficLight,
      visit: activeReportVisit,
      includeAllDays: true,
      safetyEvaluation: isCurrentActiveVisit ? clinicalSafetyEvaluation : undefined,
      isDietPlanDirty: isCurrentActiveVisit ? isDietPlanDirty : false,
      r5NutritionContract: isCurrentActiveVisit ? r5NutritionContract : undefined,
      medications: effectiveMedicationsForReport,
      r4Protocol: effectiveR4ProtocolForReport,
      supplements: [],
      candidateSupplements: isCurrentActiveVisit ? candidateSupplements : undefined
    });
  }, [effectivePatientForReport, effectiveDietChart, effectiveWeeklyDietPlan, dniResult, trafficLight, activeReportVisit, isCurrentActiveVisit, clinicalSafetyEvaluation, isDietPlanDirty, r5NutritionContract, effectiveMedicationsForReport, effectiveR4ProtocolForReport, candidateSupplements]);

  // Authoritative Release Eligibility derived directly from Master Prescription Composer
  const releaseEligibility = useMemo(() => ({
    isEligible: patientPayload.is_released,
    blockingReasons: patientPayload.release_eligibility.blocking_reasons_en,
    blockingReasons_bn: patientPayload.release_eligibility.blocking_reasons_bn
  }), [patientPayload]);

  useEffect(() => {
    setReportReleaseGate(releaseEligibility);
  }, [releaseEligibility, setReportReleaseGate]);

  const handlePrint = () => {
    if (reportMode === 'patient') {
      if (!releaseEligibility.isEligible) {
        alert(bn
          ? `ত্রুটি: রোগীর প্রেসক্রিপশন চূড়ান্ত বিতরণের জন্য এখনো অনুমোদিত নয়।\n\nকারনসমূহ:\n${releaseEligibility.blockingReasons_bn.join('\n')}`
          : `Error: The patient diet chart cannot be finalized for clinical release.\n\nBlocking Reasons:\n${releaseEligibility.blockingReasons.join('\n')}`
        );
        return;
      }
    }
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* ── Master Report Hub Header (Hidden in Print) ────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold shadow-subtle">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-foreground tracking-tight">
              {bn ? 'ক্লিনিক্যাল রিপোর্ট হাব ও প্রেসক্রিপশন স্টুডিও' : 'Dual Clinical Report & Prescription Studio'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {bn ? 'U20 নিউট্রিশনিস্ট ডসিয়ার ও U21 রোগী-বান্ধব প্রেসক্রিপশন (ক্যালোরিমুক্ত)' : 'U20 Clinician Nutrient Analytics & U21 Patient-Safe Prescription (Zero Macros)'}
            </p>
          </div>
        </div>

        {/* Global Print & Language Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-secondary text-xs font-semibold flex items-center gap-1.5 transition text-foreground shadow-subtle"
          >
            <Globe className="h-3.5 w-3.5 text-blue-500" />
            <span>{bn ? 'English' : 'বাংলা'}</span>
          </button>

          <button
            data-testid="btn-print-report"
            disabled={reportMode === 'patient' && !releaseEligibility.isEligible}
            onClick={handlePrint}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-subtle ${
              reportMode === 'patient' && !releaseEligibility.isEligible
                ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-70'
                : 'bg-primary hover:bg-primary-hover text-primary-foreground hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <Printer className="h-4 w-4" />
            <span>{bn ? 'প্রিন্ট / PDF ডাউনলোড' : 'Print / Save as PDF'}</span>
          </button>
        </div>
      </div>

      {/* ── Primary Dual Mode Switcher (Hidden in Print) ─────────────── */}
      <div data-testid="report-mode-switcher" className="bg-card border border-border rounded-2xl p-2.5 shadow-subtle no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Mode 1: Clinician Full Analysis (U20) */}
          <button
            type="button"
            data-testid="btn-mode-clinician"
            onClick={() => setReportMode('clinician')}
            className={`flex items-center justify-center gap-2.5 p-3 rounded-xl text-xs font-bold transition-all ${
              reportMode === 'clinician'
                ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20'
                : 'bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/80'
            }`}
          >
            <Lock className="h-4 w-4 shrink-0" />
            <div className="text-left">
              <span className="block font-bold">
                {bn ? '১. নিউট্রিশনিস্ট পূর্ণাঙ্গ ডসিয়ার (U20)' : '1. Nutritionist Full Analysis (U20)'}
              </span>
              <span className={`block text-[10px] font-normal ${reportMode === 'clinician' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                {bn ? 'ক্যালোরি, প্রোটিন/ফ্যাট গ্রাম, PRAL ও GL বিশ্লেষণ' : 'Full Atwater macros, energy variances, PRAL & GL'}
              </span>
            </div>
          </button>

          {/* Mode 2: Patient-Safe Diet Prescription (U21) */}
          <button
            type="button"
            data-testid="btn-mode-patient"
            onClick={() => setReportMode('patient')}
            className={`flex items-center justify-center gap-2.5 p-3 rounded-xl text-xs font-bold transition-all ${
              reportMode === 'patient'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                : 'bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/80'
            }`}
          >
            <HeartHandshake className="h-4 w-4 shrink-0" />
            <div className="text-left">
              <span className="block font-bold">
                {bn ? '২. রোগী ডায়েট প্রেসক্রিপশন (U21)' : '2. Patient-Safe Diet Chart (U21)'}
              </span>
              <span className={`block text-[10px] font-normal ${reportMode === 'patient' ? 'text-white/80' : 'text-muted-foreground'}`}>
                {bn ? 'পারিবারিক পাত্রের মাপ (ক্যালোরি ও ম্যাক্রো সংখ্যাবিহীন)' : 'Household portions & timings (Strictly Zero Calories/Macros)'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ── Patient & Visit Traceability Bar (Hidden in Print) ────────── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-subtle space-y-3.5 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold shadow-subtle">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground tracking-tight">
                  {effectivePatientForReport.name || (bn ? 'নামবিহীন রোগী' : 'Unnamed Patient')}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[10px] font-mono font-bold border border-border">
                  {effectivePatientForReport.id}
                </span>
                <span className="text-xs text-muted-foreground">
                  • {effectivePatientForReport.age}y / {effectivePatientForReport.gender === 'female' ? (bn ? 'মহিলা' : 'Female') : (bn ? 'পুরুষ' : 'Male')}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {bn ? 'পপুলেশন গ্রুপ: ' : 'Population: '}
                <span className="font-semibold text-foreground capitalize">
                  {effectivePatientForReport.population_group?.replace(/_/g, ' ')}
                </span>
                {effectivePatientForReport.phone ? ` • Tel: ${effectivePatientForReport.phone}` : ''}
              </p>
            </div>
          </div>

          {/* Visit Selector Dropdown */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <label className="text-xs font-semibold text-muted-foreground">{bn ? 'ক্লিনিক্যাল ভিজিট:' : 'Clinical Visit:'}</label>
            <select
              value={activeReportVisit?.visit_id || ''}
              onChange={(e) => selectReportVisit(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-inner"
            >
              {(clinicalVisits && clinicalVisits.length > 0 ? clinicalVisits : [
                { visit_id: effectivePatientForReport.current_visit_id || 'vis_initial', visit_date: effectivePatientForReport.visit_date, visit_type: 'baseline_consultation' }
              ]).map((v: any, idx: number) => (
                <option key={v.visit_id || idx} value={v.visit_id}>
                  Visit {v.visit_number || idx + 1}: {v.visit_date} ({v.visit_type?.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic State & Release Eligibility Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground">{bn ? 'ডকুমেন্ট স্ট্যাটাস:' : 'Document Status:'}</span>
            {clinicianSubTab === 'clinical_assessment' ? (
              activeDisplayP2?.report?.isApproved ? (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>{bn ? `অনুমোদিত: ${activeDisplayP2.report.approvedBy}` : `Approved: ${activeDisplayP2.report.approvedBy}`}</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{bn ? 'খসড়া / প্রোভিশনাল' : 'Draft / Provisional (Sign-off Required)'}</span>
                </span>
              )
            ) : reportMode === 'patient' && !releaseEligibility.isEligible ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                <span>{bn ? 'রিলিজ গেট সক্রিয় (যাচাইকরণ ও অনুমোদন বাকি)' : 'Release Blocked (Pending Clinical Verification)'}</span>
              </span>
            ) : weeklyDietPlan?.status === 'approved' && weeklyDietPlan?.is_approved ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                <span>
                  {bn ? 'অনুমোদিত: ' : 'Approved: '}
                  {weeklyDietPlan?.approved_by || weeklyDietPlan?.approval_metadata?.clinician_name}
                </span>
              </span>
            ) : weeklyDietPlan?.status === 'requires_review' ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                <span>{bn ? 'পুনঃনিরীক্ষণ প্রয়োজন (ডাটা পরিমার্জিত)' : 'Requires Re-Review (Plan Modified)'}</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                <span>{bn ? 'খসড়া / প্রোভিশনাল' : 'Draft / Provisional (Sign-off Required)'}</span>
              </span>
            )}
          </div>

          <div className="text-[11px] text-muted-foreground">
            {reportMode === 'patient' && (
              releaseEligibility.isEligible ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {bn ? 'রোগী বিতরণের জন্য অনুমোদিত' : 'Eligible for Patient Release'}
                </span>
              ) : (
                <span className="text-amber-600 font-bold flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" />
                  {bn ? 'বিতরণ স্থগিত (খসড়া প্রাক-দর্শন)' : 'Dispensation Gate Active'}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── MODE 1: CLINICIAN FULL ANALYSIS (U20) ────────────────────── */}
      {reportMode === 'clinician' && (
        <div className="space-y-6">
          {/* Clinician Subtab Selector (Hidden in Print) */}
          <div className="flex items-center gap-2 border border-border/80 bg-secondary/30 rounded-2xl p-1.5 no-print overflow-x-auto shadow-2xs">
            <button
              data-testid="tab-report-weekly-diet"
              onClick={() => setClinicianSubTab('weekly_diet_plan')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                clinicianSubTab === 'weekly_diet_plan'
                  ? 'bg-card text-foreground font-bold shadow-xs border border-border/80 ring-1 ring-primary/20'
                  : 'hover:bg-card/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>{bn ? '১. ৭-দিনের ব্যক্তিগতকৃত পুষ্টি পরিকল্পনা' : '1. 7-Day Weekly Nutrition Plan'}</span>
            </button>

            <button
              onClick={() => setClinicianSubTab('clinical_assessment')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                clinicianSubTab === 'clinical_assessment'
                  ? 'bg-card text-foreground font-bold shadow-xs border border-border/80 ring-1 ring-primary/20'
                  : 'hover:bg-card/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              <Award className="h-4 w-4" />
              <span>{bn ? '২. প্রাক-হস্তক্ষেপ পূর্ণাঙ্গ স্বাস্থ্য প্রতিবেদন' : '2. Pre-Intervention Health Report'}</span>
            </button>

            <button
              onClick={() => setClinicianSubTab('comparative_progress')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                clinicianSubTab === 'comparative_progress'
                  ? 'bg-card text-foreground font-bold shadow-xs border border-border/80 ring-1 ring-primary/20'
                  : 'hover:bg-card/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>{bn ? '৩. লংগিটিউডিনাল তুলনামূলক অগ্রগতি' : '3. Longitudinal Progress Report'}</span>
            </button>

            <button
              onClick={() => setClinicianSubTab('diet_prescription')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                clinicianSubTab === 'diet_prescription'
                  ? 'bg-card text-foreground font-bold shadow-xs border border-border/80 ring-1 ring-primary/20'
                  : 'hover:bg-card/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              <Utensils className="h-4 w-4" />
              <span>{bn ? '৪. একক দিনের ডায়েট চার্ট ও স্কেলিং' : '4. Single-Day Diet Chart'}</span>
            </button>
          </div>

          {/* Clinician View 1: 7-Day Weekly Clinical Plan Dossier */}
          {clinicianSubTab === 'weekly_diet_plan' && (
            <div data-testid="weekly-diet-report-view">
              {isHistoricalVisitWithoutPlan ? (
                <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-3 shadow-subtle max-w-xl mx-auto">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
                  <h3 className="font-bold text-base text-foreground">
                    {bn ? 'এই অতীত ভিজিটের জন্য কোনো ডায়েট প্ল্যান রেকর্ড করা নেই।' : 'No diet plan recorded for this visit.'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {bn ? 'অতীত ভিজিটের সংরক্ষিত ক্লিনিক্যাল স্ন্যাপশটে কোনো পুষ্টি পরিকল্পনা সংরক্ষিত নেই।' : 'No nutrition plan was recorded in the clinical snapshot for this historical consultation visit.'}
                  </p>
                </div>
              ) : (
                <ClinicianReportView
                  payload={clinicianPayload}
                  language={language}
                  onPrint={handlePrint}
                />
              )}
            </div>
          )}

          {/* Clinician View 2: Scaled Single-Day Plan Dossier */}
          {clinicianSubTab === 'diet_prescription' && (
            <div data-testid="weekly-diet-report-view">
              {isHistoricalVisitWithoutPlan ? (
                <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-3 shadow-subtle max-w-xl mx-auto">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
                  <h3 className="font-bold text-base text-foreground">
                    {bn ? 'এই অতীত ভিজিটের জন্য কোনো ডায়েট প্ল্যান রেকর্ড করা নেই।' : 'No diet plan recorded for this visit.'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {bn ? 'অতীত ভিজিটের সংরক্ষিত ক্লিনিক্যাল স্ন্যাপশটে কোনো পুষ্টি পরিকল্পনা সংরক্ষিত নেই।' : 'No nutrition plan was recorded in the clinical snapshot for this historical consultation visit.'}
                  </p>
                </div>
              ) : (
                <ClinicianReportView
                  payload={clinicianPayload}
                  language={language}
                  onPrint={handlePrint}
                />
              )}
            </div>
          )}

          {/* Clinician View 3: Pre-Intervention Assessment (P2) */}
          {clinicianSubTab === 'clinical_assessment' && (
            <div className="space-y-4">
              {activeDisplayP2 ? (
                <FunctionalNutritionReport
                  report={activeDisplayP2.report}
                  analysis={activeDisplayP2}
                  patient={effectivePatientForReport}
                  lang={language}
                  onApprove={(clinicianId, notes) => approveP2Analysis(clinicianId, notes, activeDisplayP2.visitId)}
                />
              ) : (
                <div className="bg-card border rounded-2xl p-10 text-center space-y-4 shadow-sm max-w-xl mx-auto">
                  <Award className="h-12 w-12 text-purple-500 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-foreground">
                      {bn ? 'প্রাক-হস্তক্ষেপ ক্লিনিক্যাল স্বাস্থ্য প্রতিবেদন প্রস্তুত নয়' : 'Pre-Intervention Assessment Report Pending'}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {bn
                        ? '১৪-ডোমেন অ্যাসেসমেন্টের উপর ভিত্তি করে ক্লিনিক্যাল ইন্টেলিজেন্স ও রুট-কজ বিশ্লেষণ সম্পন্ন হলে এই রিপোর্টটি স্বয়ংক্রিয়ভাবে এখানে প্রদর্শিত হবে।'
                        : 'Complete the 14-Domain Assessment and run the Clinical Intelligence analysis to generate the comprehensive pre-intervention report.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('clinical_intelligence')}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition"
                  >
                    {bn ? 'ক্লিনিক্যাল ইন্টেলিজেন্স ট্যাবে যান →' : 'Go to Clinical Intelligence Tab →'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Clinician View 4: Longitudinal Comparative Progress */}
          {clinicianSubTab === 'comparative_progress' && (
            <div className="space-y-4">
              {(currentProgressReport || (progressReports && progressReports.length > 0 ? progressReports[0] : null)) ? (
                <ComparativeProgressReportView
                  report={currentProgressReport || progressReports[0]}
                  onApprove={approveProgressReport}
                />
              ) : (
                <div className="bg-card border rounded-2xl p-10 text-center space-y-4 shadow-sm max-w-xl mx-auto">
                  <TrendingUp className="h-12 w-12 text-primary mx-auto" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-foreground">
                      {bn ? 'কোনো লংগিটিউডিনাল প্রগ্রেস রিপোর্ট তৈরি করা হয়নি' : 'No Longitudinal Progress Report Generated'}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {bn
                        ? 'তুলনামূলক অগ্রগতির জন্য রোগীর অন্তত দুটি ভিজিট (বেসলাইন এবং ফলো-আপ) আবশ্যক। ফলো-আপ ও অগ্রগতি ট্যাবে গিয়ে যেকোনো দুটি ভিজিট তুলনা করে এই রিপোর্ট তৈরি করা যাবে।'
                        : 'A comparative progress report requires at least two visits (baseline and follow-up). Go to the Follow-Up tab to generate a comparative analysis.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('followup')}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md transition"
                  >
                    {bn ? 'ফলো-আপ ও অগ্রগতি ট্যাবে যান →' : 'Go to Follow-Up Tab →'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── MODE 2: PATIENT-SAFE DIET PRESCRIPTION (U21) ─────────────── */}
      {reportMode === 'patient' && (
        <div data-testid="patient-projection-view">
          {isHistoricalVisitWithoutPlan ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-3 shadow-subtle max-w-xl mx-auto">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="font-bold text-base text-foreground">
                {bn ? 'এই অতীত ভিজিটের জন্য কোনো ডায়েট প্ল্যান রেকর্ড করা নেই।' : 'No diet plan recorded for this visit.'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {bn ? 'অতীত ভিজিটের সংরক্ষিত ক্লিনিক্যাল স্ন্যাপশটে কোনো পুষ্টি পরিকল্পনা সংরক্ষিত নেই।' : 'No nutrition plan was recorded in the clinical snapshot for this historical consultation visit.'}
              </p>
            </div>
          ) : (
            <PatientDietReportView
              payload={patientPayload}
              language={language}
              onPrint={handlePrint}
            />
          )}
        </div>
      )}

    </div>
  );
};
