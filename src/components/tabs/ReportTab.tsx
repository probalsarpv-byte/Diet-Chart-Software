'use client';

import React, { useState } from 'react';
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
  Calendar
} from 'lucide-react';
import { ComparativeProgressReportView } from '@/components/reports/ComparativeProgressReportView';
import { FunctionalNutritionReport } from '@/components/p2/FunctionalNutritionReport';
import { getLatestVisitSnapshot } from '@/engine/snapshot/snapshotManager';

type ReportType = 'diet_prescription' | 'comparative_progress' | 'clinical_assessment';

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
    approveP2Analysis,
    currentProgressReport,
    generateProgressReport,
    approveProgressReport,
    selectProgressReport,
    setActiveTab,
    currentVisit,
    clinicalVisits,
    selectVisit,
    progressReports,
    visitSnapshots
  } = usePractice();

  const [activeReportType, setActiveReportType] = useState<ReportType>('diet_prescription');

  const bn = language === 'bn';
  const phaseInfo = CLINICAL_PHASES[patient.current_phase || 1];

  // For historical visit reports, provide read-only demographic representation without mutating global patient state
  const effectivePatientForReport = React.useMemo(() => {
    if (!currentVisit || currentVisit.visit_id === patient.current_visit_id || currentVisit.id === patient.current_visit_id) {
      return patient;
    }
    const snap = getLatestVisitSnapshot(visitSnapshots, currentVisit.visit_id || currentVisit.id || '');
    return {
      ...patient,
      current_visit_id: currentVisit.visit_id || currentVisit.id,
      visit_date: currentVisit.visit_date || patient.visit_date,
      weight_kg: p2AnalysisResult?.report?.sectionB_anthropometrics?.weight_kg ?? (snap?.anthropometrics?.weight_kg ?? patient.weight_kg),
      height_cm: p2AnalysisResult?.report?.sectionB_anthropometrics?.height_cm ?? (snap?.anthropometrics?.height_cm ?? patient.height_cm),
      waist_cm: snap?.anthropometrics?.waist_cm ?? patient.waist_cm
    };
  }, [patient, currentVisit, visitSnapshots, p2AnalysisResult]);

  const redDietItems = dietChart.flatMap(m => m.items.filter(i => i.traffic_status === 'RED'));
  const hasHardStops = clinicalSafetyEvaluation?.overallDecision === 'HARD_STOP';
  const hasUnresolvedContraindications = redDietItems.length > 0 || hasHardStops;

  const handlePrint = () => {
    if (activeReportType === 'diet_prescription' && hasUnresolvedContraindications) {
      alert(bn
        ? "ত্রুটি: ক্লিনিক্যাল সেফটি হার্ড স্টপ বা খাদ্যতালিকায় নিষিদ্ধ (লাল) খাবার অন্তর্ভুক্ত রয়েছে। রোগীর নিরাপত্তার স্বার্থে এই রিপোর্ট প্রিন্ট বা অনুমোদন করা যাবে না।"
        : "Error: The plan contains active Clinical Safety HARD STOPS or contraindicated (RED) food items. For clinical safety, this report cannot be finalized or printed until resolved."
      );
      return;
    }
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Report Selector Header (Hidden in Print) */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-foreground">
              {bn ? 'ক্লিনিক্যাল রিপোর্ট হাব (A4 প্রিন্ট ও এক্সপোর্ট)' : 'Clinical Reports Hub (A4 Print & Export)'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {bn ? 'হাসপাতাল-গ্রেড ডিটারমিনিস্টিক রিপোর্ট জেনারেশন ও লাইসেন্সপ্রাপ্ত চিকিৎসকের অনুমোদন' : 'Hospital-grade deterministic clinical reports and clinician sign-off'}
            </p>
          </div>
        </div>

        {/* Global Print & Language Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            className="px-3 py-1.5 rounded-xl border bg-secondary/50 hover:bg-secondary text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Globe className="h-3.5 w-3.5 text-blue-500" />
            <span>{bn ? 'English' : 'বাংলা'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 text-xs font-bold flex items-center gap-1.5 shadow-md transition"
          >
            <Printer className="h-4 w-4" />
            <span>{bn ? 'প্রিন্ট / PDF ডাউনলোড' : 'Print / Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* Patient & Visit Traceability Header (Hidden in Print) */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-foreground">{patient.name || (bn ? 'নামবিহীন রোগী' : 'Unnamed Patient')}</span>
                <span className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[10px] font-mono font-bold">{patient.id}</span>
                <span className="text-xs text-muted-foreground">• {patient.age}y / {patient.gender === 'female' ? (bn ? 'মহিলা' : 'Female') : (bn ? 'পুরুষ' : 'Male')}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {bn ? 'পপুলেশন গ্রুপ: ' : 'Population: '}
                <span className="font-semibold text-foreground capitalize">{patient.population_group?.replace(/_/g, ' ')}</span>
                {patient.phone ? ` • Tel: ${patient.phone}` : ''}
              </p>
            </div>
          </div>

          {/* Visit Selector Dropdown */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <label className="text-xs font-semibold text-muted-foreground">{bn ? 'ক্লিনিক্যাল ভিজিট:' : 'Clinical Visit:'}</label>
            <select
              value={currentVisit?.visit_id || ''}
              onChange={(e) => selectVisit(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {(clinicalVisits && clinicalVisits.length > 0 ? clinicalVisits : [
                { visit_id: patient.current_visit_id || 'vis_initial', visit_date: patient.visit_date, visit_type: 'baseline_consultation' }
              ]).map((v: any, idx: number) => (
                <option key={v.visit_id || idx} value={v.visit_id}>
                  Visit {v.visit_number || idx + 1}: {v.visit_date} ({v.visit_type?.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Report State & Approval Badge Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground">{bn ? 'রিপোর্ট স্ট্যাটাস:' : 'Document Status:'}</span>
            {activeReportType === 'diet_prescription' && (
              hasUnresolvedContraindications ? (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  <span>{bn ? 'অমীমাংসিত ঝুঁকি / হার্ড স্টপ' : 'Safety Alert / Hard Stop'}</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  <span>{bn ? 'ক্লিনিক্যাল সুরক্ষা যাচাইকৃত' : 'Clinical Safety Verified'}</span>
                </span>
              )
            )}

            {activeReportType === 'clinical_assessment' && (
              p2AnalysisResult?.report?.isApproved ? (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>
                    {bn ? 'অনুমোদিত: ' : 'Approved: '}
                    {p2AnalysisResult.report.approvedBy} ({p2AnalysisResult.report.approvalDate?.split('T')[0]})
                  </span>
                </span>
              ) : p2AnalysisResult?.analysisInvalidatedAt ? (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{bn ? 'পুনঃপর্যালোচনা প্রয়োজন (ডাটা পরিবর্তন)' : 'Invalidated / Requires Re-review'}</span>
                </span>
              ) : p2AnalysisResult ? (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{bn ? 'খসড়া / প্রোভিশনাল (অনুমোদন বাকি)' : 'Draft / Provisional (Sign-off Required)'}</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{bn ? 'রিপোর্ট অপ্রাপ্য' : 'Report Unavailable'}</span>
                </span>
              )
            )}

            {activeReportType === 'comparative_progress' && (
              currentProgressReport ? (
                currentProgressReport.is_approved ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>
                      {bn ? 'অনুমোদিত: ' : 'Approved: '}
                      {currentProgressReport.approved_by} ({currentProgressReport.approval_date?.split('T')[0]})
                    </span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{bn ? 'খসড়া প্রগ্রেস রিপোর্ট' : 'Draft Progress Report'}</span>
                  </span>
                )
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
                  {bn ? 'তৈরি করা হয়নি' : 'Not Generated'}
                </span>
              )
            )}
          </div>

          {/* Progress Report Selector when in comparative_progress and multiple reports exist */}
          {activeReportType === 'comparative_progress' && progressReports && progressReports.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-muted-foreground">{bn ? 'রিপোর্ট বাছাই:' : 'Select Report:'}</label>
              <select
                value={currentProgressReport?.report_id || ''}
                onChange={(e) => selectProgressReport(e.target.value)}
                className="px-2.5 py-1 rounded-lg border bg-background text-foreground text-xs font-medium"
              >
                {progressReports.map((r, i) => (
                  <option key={r.report_id || i} value={r.report_id}>
                    {r.sectionA_patientAndConsultation.baseline_date} vs {r.sectionA_patientAndConsultation.comparison_date} {r.is_approved ? '✓ Approved' : '(Draft)'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 3 Report Selector Tabs (Hidden in Print) */}
      <div className="flex items-center gap-2 border-b no-print overflow-x-auto pb-1">
        <button
          onClick={() => setActiveReportType('diet_prescription')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeReportType === 'diet_prescription'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'hover:bg-muted text-muted-foreground'
          }`}
        >
          <Utensils className="h-4 w-4" />
          <span>{bn ? '১. দৈনিক ডায়েট চার্ট ও প্রেসক্রিপশন' : '1. Scaled Diet Chart & Prescription'}</span>
        </button>

        <button
          onClick={() => setActiveReportType('clinical_assessment')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeReportType === 'clinical_assessment'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'hover:bg-muted text-muted-foreground'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>{bn ? '২. প্রাক-হস্তক্ষেপ পূর্ণাঙ্গ স্বাস্থ্য প্রতিবেদন (P2)' : '2. Pre-Intervention Health Report (P2)'}</span>
        </button>

        <button
          onClick={() => setActiveReportType('comparative_progress')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeReportType === 'comparative_progress'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'hover:bg-muted text-muted-foreground'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>{bn ? '৩. লংগিটিউডিনাল তুলনামূলক অগ্রগতি রিপোর্ট' : '3. Longitudinal Progress Report'}</span>
        </button>
      </div>

      {/* VIEW 1: Scaled Diet Chart & Prescription */}
      {activeReportType === 'diet_prescription' && (
        <div className="space-y-6">
          {/* Critical Red Contraindication Alert Banner */}
          {hasUnresolvedContraindications && (
            <div className="bg-rose-500/10 border-2 border-rose-500 rounded-2xl p-4 text-rose-600 dark:text-rose-400 flex items-start gap-3 shadow-md no-print">
              <XCircle className="h-6 w-6 flex-shrink-0 mt-0.5 text-rose-500" />
              <div className="space-y-1">
                <h3 className="font-bold text-sm">
                  {bn ? 'ক্লিনিক্যাল সতর্কতা: খাদ্যতালিকায় নিষিদ্ধ (লাল) খাবার উপস্থিত!' : 'Critical Clinical Alert: Unresolved Contraindicated (RED) Foods!'}
                </h3>
                <p className="text-xs">
                  {bn
                    ? `খাদ্যতালিকায় ${redDietItems.length} টি খাবার রোগীর বর্তমান স্বাস্থ্য অবস্থা বা অ্যালার্জির সাথে সাংঘর্ষিক: ${redDietItems.map(i => i.food_name_bn).join(', ')}। চূড়ান্ত রিপোর্ট প্রিন্ট করার পূর্বে অবশ্যই এগুলো অপসারণ করতে হবে।`
                    : `The active diet chart contains ${redDietItems.length} contraindicated items (${redDietItems.map(i => i.food_name_en).join(', ')}). Report approval and export are blocked until these items are replaced.`
                  }
                </p>
              </div>
            </div>
          )}

          {/* Printable A4 Report Container */}
          <div className="print-container bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 border rounded-3xl p-6 sm:p-10 max-w-4xl mx-auto shadow-xl space-y-6 print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
            
            {/* Clinic Letterhead */}
            <div className="border-b-2 border-emerald-600 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-lg">
                    শু
                  </div>
                  <div>
                    <h1 className="font-extrabold text-xl leading-tight text-slate-900 dark:text-white print:text-black">
                      {bn ? 'শুদ্ধ ক্লিনিক্যাল ফাংশনাল নিউট্রিশন সেন্টার' : 'SHUDDHO CLINICAL FUNCTIONAL NUTRITION'}
                    </h1>
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 print:text-emerald-700">
                      {bn ? 'সেন্টার ফর মেটাবলিক রিবুট ও এভিডেন্স-বেসড ফাংশনাল মেডিসিন' : 'Center for Metabolic Reboot & Evidence-Based Nutrition Practice'}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-600 mt-1">
                  Gulshan-2 / Dhanmondi, Dhaka, Bangladesh | +880 1712-000000 | clinic@shuddhobd.com
                </p>
              </div>

              <div className="text-left sm:text-right text-xs">
                <div className="font-bold text-slate-900 dark:text-white print:text-black">
                  {bn ? 'সিনিয়র ক্লিনিক্যাল ফাংশনাল নিউট্রিশনিস্ট' : 'Lead Clinical Functional Nutritionist'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-600">
                  MSc (Food & Nutrition), Certified Functional Medicine Specialist
                </div>
                <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 print:bg-emerald-100 print:text-emerald-800 text-[10px] font-bold">
                  100% DETERMINISTIC ZERO-AI PROTOCOL
                </div>
              </div>
            </div>

            {/* Patient Demographic Bar */}
            <div className="bg-slate-50 dark:bg-slate-900 print:bg-slate-100 border border-slate-200 dark:border-slate-800 print:border-slate-300 rounded-xl p-3 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <span className="text-slate-500 print:text-slate-600 block text-[10px]">{bn ? 'রোগীর নাম:' : 'Patient Name:'}</span>
                <strong className="text-slate-900 dark:text-white print:text-black font-bold">{patient.name}</strong>
              </div>
              <div>
                <span className="text-slate-500 print:text-slate-600 block text-[10px]">{bn ? 'বয়স ও লিঙ্গ:' : 'Age & Gender:'}</span>
                <strong className="text-slate-900 dark:text-white print:text-black">
                  {patient.age > 0 ? `${patient.age}y` : (bn ? 'অনির্ধারিত' : 'Unrecorded')} / {patient.gender === 'female' ? (bn ? 'মহিলা' : 'Female') : (bn ? 'পুরুষ' : 'Male')}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 print:text-slate-600 block text-[10px]">{bn ? 'তারিখ ও আইডি:' : 'Date & ID:'}</span>
                <strong className="text-slate-900 dark:text-white print:text-black">{patient.visit_date} ({patient.id})</strong>
              </div>
              <div>
                <span className="text-slate-500 print:text-slate-600 block text-[10px]">{bn ? 'বর্তমান ফেজ:' : 'Active Phase:'}</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 print:text-emerald-700">
                  Phase {patient.current_phase || 1} ({phaseInfo?.duration_weeks || 'Weeks 1-4'})
                </span>
              </div>
            </div>

            {/* Safety Summary Bar: Allergies & Clinician Exclusions */}
            {((patient.confirmed_allergies || []).length > 0 || (patient.clinician_disallowed_foods || []).length > 0) && (
              <div className="p-3 rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/20 text-xs space-y-1">
                <div className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  <span>{bn ? 'ক্লিনিক্যাল সুরক্ষা ও সম্পূর্ণ নিষিদ্ধ খাদ্যসমূহ (Absolute Exclusions):' : 'Absolute Patient Exclusions (Allergens & Clinician Directives):'}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                  {patient.confirmed_allergies && patient.confirmed_allergies.length > 0 && (
                    <div>
                      <strong>{bn ? 'নিশ্চিত অ্যালার্জি:' : 'Confirmed Allergies:'} </strong>
                      <span className="text-rose-600 font-semibold">{patient.confirmed_allergies.join(', ')}</span>
                    </div>
                  )}
                  {patient.clinician_disallowed_foods && patient.clinician_disallowed_foods.length > 0 && (
                    <div>
                      <strong>{bn ? 'চিকিৎসকের নিষেধাজ্ঞা:' : 'Clinician Exclusions:'} </strong>
                      <span className="text-amber-600 font-semibold">{patient.clinician_disallowed_foods.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Anthropometrics & Functional Biomarkers Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              <div className="border rounded-xl p-3.5 space-y-2 bg-slate-50/50 dark:bg-slate-900/50 print:bg-slate-50">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 print:text-black flex items-center gap-1.5 border-b pb-1.5">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  <span>{bn ? 'শারীরিক গঠন ও মেটাবলিক টার্গেট' : 'Anthropometrics & Caloric Target'}</span>
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>{bn ? 'উচ্চতা:' : 'Height:'} <strong>{patient.height_cm > 0 ? `${patient.height_cm} cm` : (bn ? 'পরিমাপহীন' : 'Unmeasured')}</strong></div>
                  <div>{bn ? 'ওজন:' : 'Weight:'} <strong>{patient.weight_kg > 0 ? `${patient.weight_kg} kg` : (bn ? 'পরিমাপহীন' : 'Unmeasured')}</strong></div>
                  <div>{bn ? 'বিএমআই (BMI):' : 'BMI:'} <strong>{patient.calculated?.bmi || (bn ? 'পরিমাপহীন' : 'Uncalculated')}</strong></div>
                  <div>{bn ? 'কোমর (WHtR):' : 'WHtR:'} <strong>{patient.calculated?.whtr || (bn ? 'পরিমাপহীন' : 'Unmeasured')}</strong></div>
                  <div>{bn ? 'আদর্শ ওজন (IBW):' : 'Ideal BW:'} <strong>{patient.calculated?.ibw_kg || 0} kg</strong></div>
                  <div>{bn ? 'এডজাস্টেড ওজন:' : 'Adjusted BW:'} <strong>{patient.calculated?.adjusted_bw_kg || 0} kg</strong></div>
                </div>
                <div className="pt-2 border-t flex justify-between items-baseline text-xs font-semibold">
                  <span className="text-emerald-700 dark:text-emerald-400 print:text-emerald-800">
                    {bn ? 'নিরাপদ দৈনিক ক্যালোরি:' : 'Target Calories:'} {patient.calculated?.target_calories || 0} kcal
                  </span>
                  <span className="text-slate-500 print:text-slate-600 text-[10px]">
                    BMR Floor: {patient.calculated?.bmr_safe_calorie_floor || 0} kcal
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 print:text-slate-600">
                  Protein: <strong>{patient.calculated?.target_protein_g || 0}g</strong> | Carbs: <strong>{patient.calculated?.target_carbs_g || 0}g</strong> | Healthy Fat: <strong>{patient.calculated?.target_fat_g || 0}g</strong>
                </div>
              </div>

              <div className="border rounded-xl p-3.5 space-y-2 bg-slate-50/50 dark:bg-slate-900/50 print:bg-slate-50">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 print:text-black flex items-center gap-1.5 border-b pb-1.5">
                  <ShieldCheck className="h-4 w-4 text-rose-600" />
                  <span>{bn ? 'ক্লিনিক্যাল কন্ডিশন ও ফাংশনাল ল্যাব ঝুঁকি' : 'Clinical Diagnoses & Functional Labs'}</span>
                </h3>
                <div className="flex flex-wrap gap-1">
                  {(patient.selected_conditions || []).map(c => (
                    <span key={c} className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 print:bg-emerald-100 print:text-emerald-800 text-[10px] font-semibold">
                      {c.toUpperCase()}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  {patient.labs?.homa_ir && (
                    <div>HOMA-IR: <strong className="text-rose-600">{patient.labs.homa_ir}</strong> (Insulin Resistance)</div>
                  )}
                  {patient.labs?.tg_hdl_ratio && (
                    <div>TG/HDL: <strong className="text-rose-600">{patient.labs.tg_hdl_ratio}</strong> (Atherogenic Risk)</div>
                  )}
                  {patient.labs?.hba1c && <div>HbA1c: <strong>{patient.labs.hba1c}%</strong></div>}
                  {patient.labs?.tsh && <div>TSH: <strong>{patient.labs.tsh} µIU/mL</strong></div>}
                  {patient.labs?.vitamin_d3 && <div>Vit D3: <strong>{patient.labs.vitamin_d3} ng/mL</strong></div>}
                  {patient.labs?.vitamin_b12 && <div>Vit B12: <strong>{patient.labs.vitamin_b12} pg/mL</strong></div>}
                </div>
                <div className="text-[10px] text-slate-500 print:text-slate-600 pt-1 border-t">
                  Bristol Stool: <strong>Type {patient.gut_profile?.bristol_stool_score ?? (bn ? 'অপরীক্ষিত' : 'Unrecorded')}</strong> | Agni: <strong>{patient.gut_profile?.digestive_fire_agni || (bn ? 'অপরীক্ষিত' : 'unassessed')}</strong>
                </div>
              </div>

            </div>

            {/* 24-Hour Pill, Supplement & Hydration Timeline */}
            <div className="border rounded-xl p-4 space-y-3 bg-white dark:bg-slate-900/40 print:bg-white avoid-break">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 print:text-black flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>{bn ? '২৪ ঘণ্টার ওষুধ, সাপ্লিমেন্ট ও পানীয় সেবন সময়সূচি (Strict Separation Rules)' : '24-Hour Chronological Pill, Supplement & Meal Schedule'}</span>
                </h3>
                <span className="text-[10px] text-slate-500 print:text-slate-600">
                  {bn ? 'লেভোথাইরক্সিন ও খনিজ ব্যবধান নিশ্চিত' : '4-Hour Thyroid Mineral Separation Active'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {(dniResult?.timeline || []).map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border bg-slate-50/70 dark:bg-slate-800/40 print:bg-slate-50 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[11px] bg-slate-200 dark:bg-slate-700 print:bg-slate-200 px-1.5 py-0.2 rounded">
                        {item.time}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 print:text-slate-700">
                        {bn ? item.title_bn : item.title_en} {item.is_prescription_medication && '(RX)'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-300 print:text-slate-700 leading-tight">
                      {bn ? item.instructions_bn : item.instructions_en}
                    </p>
                    {item.verified_products && (
                      <div className="text-[9px] text-emerald-700 dark:text-emerald-400 print:text-emerald-700 font-semibold">
                        {item.verified_products.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Personalized Traffic Light Food Guide Summary */}
            <div className="border rounded-xl p-4 space-y-3 bg-white dark:bg-slate-900/40 print:bg-white avoid-break">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 print:text-black">
                  {bn ? 'রোগ ও ওষুধের ভিত্তিতে ট্রাফিক লাইট খাদ্য গাইড (Personalized Food Guide)' : 'Personalized Traffic Light Food Guide'}
                </h3>
                <span className="text-[10px] text-slate-500 print:text-slate-600">
                  RED &gt; YELLOW &gt; GREEN
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                
                <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 print:bg-emerald-50/60 space-y-1">
                  <div className="font-bold text-emerald-800 dark:text-emerald-400 print:text-emerald-800 flex items-center gap-1 text-[11px]">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>{bn ? 'সবুজ (স্বাচ্ছন্দ্যে গ্রহণীয়):' : 'Green (Eat Freely):'}</span>
                  </div>
                  <p className="text-[10px] text-slate-700 dark:text-slate-300 print:text-slate-800 leading-relaxed">
                    {(trafficLight?.green || []).slice(0, 15).map(f => bn ? f.name_bn : f.name_en).join(', ')}...
                  </p>
                </div>

                <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20 print:bg-amber-50/60 space-y-1">
                  <div className="font-bold text-amber-800 dark:text-amber-400 print:text-amber-800 flex items-center gap-1 text-[11px]">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>{bn ? 'হলুদ (পরিমিত ও শর্তসাপেক্ষে):' : 'Yellow (Conditional):'}</span>
                  </div>
                  <p className="text-[10px] text-slate-700 dark:text-slate-300 print:text-slate-800 leading-relaxed">
                    {(trafficLight?.yellow || []).slice(0, 12).map(f => bn ? f.name_bn : f.name_en).join(', ')}...
                  </p>
                </div>

                <div className="p-2.5 rounded-lg border border-rose-500/30 bg-rose-50/60 dark:bg-rose-950/20 print:bg-rose-50/60 space-y-1">
                  <div className="font-bold text-rose-800 dark:text-rose-400 print:text-rose-800 flex items-center gap-1 text-[11px]">
                    <XCircle className="h-3.5 w-3.5" />
                    <span>{bn ? 'লাল (সম্পূর্ণ বর্জনীয়):' : 'Red (Strictly Avoid):'}</span>
                  </div>
                  <p className="text-[10px] text-slate-700 dark:text-slate-300 print:text-slate-800 leading-relaxed">
                    {(trafficLight?.red || []).slice(0, 14).map(f => bn ? f.name_bn : f.name_en).join(', ')}...
                  </p>
                </div>

              </div>
            </div>

            {/* Page Break for Multi-page Clean Print */}
            <div className="page-break" />

            {/* Full Daily Diet Chart (Family-Pot & Raw Weights) */}
            <div className="border rounded-xl p-4 space-y-4 bg-white dark:bg-slate-900/40 print:bg-white avoid-break">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 print:text-black flex items-center gap-1.5">
                  <Utensils className="h-4 w-4 text-emerald-600" />
                  <span>{bn ? 'দৈনিক স্বয়ংক্রিয় ডায়েট চার্ট (কাঁচা ও রান্না করা পারিবারিক পাত্রের মাপ)' : 'Therapeutic Daily Meal Plan (Raw & Cooked Measures)'}</span>
                </h3>
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 print:text-emerald-700">
                  Total: {dietChart.reduce((sum, m) => sum + m.meal_calories, 0)} kcal | P: {Math.round(dietChart.reduce((sum, m) => sum + m.meal_protein_g, 0))}g
                </span>
              </div>

              <div className="space-y-4">
                {dietChart.map(meal => (
                  <div key={meal.id} className="border rounded-lg overflow-hidden text-xs">
                    <div className="bg-slate-100 dark:bg-slate-800/60 print:bg-slate-100 p-2 font-bold flex justify-between items-center text-[11px]">
                      <span>{meal.target_time} - {bn ? meal.title_bn : meal.title_en}</span>
                      <span className="font-medium text-slate-600 dark:text-slate-300 print:text-slate-700">
                        {meal.meal_calories} kcal | P: {meal.meal_protein_g}g | C: {meal.meal_carbs_g}g | F: {meal.meal_fat_g}g
                      </span>
                    </div>

                    <div className="p-2 space-y-1.5">
                      {meal.items.map(item => (
                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800/40 pb-1.5 last:border-none last:pb-0 gap-1 text-[11px]">
                          <div>
                            <strong className="text-slate-900 dark:text-white print:text-black">
                              {bn ? item.food_name_bn : item.food_name_en}
                            </strong>
                            <span className="text-slate-500 print:text-slate-600 ml-1.5 text-[10px]">
                              ({bn ? item.prep_note_bn : item.prep_note_en})
                            </span>
                          </div>
                          <div className="text-right flex items-center gap-2 self-end sm:self-auto text-[10px]">
                            <span className="bg-slate-100 dark:bg-slate-800 print:bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                              Raw: {item.raw_weight_g}g
                            </span>
                            <span className="font-semibold text-emerald-800 dark:text-emerald-400 print:text-emerald-800">
                              {bn ? item.cooked_display_bn : item.cooked_display_en}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Practice Rules for Bangladeshi Patients */}
            <div className="border border-slate-200 dark:border-slate-800 print:border-slate-300 rounded-xl p-3.5 bg-slate-50 dark:bg-slate-900/50 print:bg-slate-50 text-[11px] space-y-1.5 leading-relaxed avoid-break">
              <strong className="font-bold text-slate-800 dark:text-slate-200 print:text-black block text-xs">
                {bn ? 'রোগীর জন্য অবশ্য পালনীয় ক্লিনিক্যাল নিয়মাবলী:' : 'Essential Patient Guidelines & Cooking Instructions:'}
              </strong>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300 print:text-slate-700 text-[10px]">
                <li>{bn ? 'রান্নায় কোনোভাবেই রিফাইন্ড সয়াবিন বা পাম তেল ব্যবহার করবেন না; খাঁটি ঘানিভাঙা সরিষার তেল (দৈনিক ১৫-২০ মিলি) অথবা খাঁটি দেশি ঘিয়ে রান্না করুন।' : 'Strictly avoid refined industrial seed oils. Use cold-pressed unrefined mustard oil (15-20 ml/day) or pure cow ghee.'}</li>
                <li>{bn ? 'খাবারের ফ্যান বা মাড় সম্পূর্ণ ঝরিয়ে ফেলুন এবং লাল চাল রান্নার পূর্বে ৩০ মিনিট ভিজিয়ে রাখুন।' : 'Discard rice starch gruel after boiling. Soak unpolished rice 30 mins prior to cooking.'}</li>
                <li>{bn ? 'ডাল রান্নার আগে অন্তত ৮-১২ ঘণ্টা পানিতে ভিজিয়ে রেখে পানি ফেলে দিয়ে রান্না করতে হবে (ফাইটেট হ্রাস পাবে)।' : 'Soak all legumes (dal) for 8-12 hours and discard soaking liquid to neutralize phytic acid.'}</li>
                {patient.clinical_safety?.fluid_restriction?.is_restricted ? (
                  <li className="text-rose-600 dark:text-rose-400 font-bold">
                    {bn 
                      ? `ক্লিনিক্যাল সতর্কতা (তরল নিয়ন্ত্রণ): রোগীর চিকিৎসকের নির্দেশ মোতাবেক দৈনিক মোট তরল গ্রহণ কঠোরভাবে সর্বোচ্চ ${patient.clinical_safety.fluid_restriction.limit_ml || 'নির্দিষ্ট'} মিলি-তে সীমাবদ্ধ রাখুন।`
                      : `Clinical Fluid Restriction Active: Strictly limit total daily fluid intake to maximum ${patient.clinical_safety.fluid_restriction.limit_ml || 'prescribed'} mL/day as ordered by managing physician.`}
                  </li>
                ) : (
                  <li>{bn ? 'প্রতিদিন অন্তত ২.৫ থেকে ৩.০ লিটার বিশুদ্ধ কুসুম গরম পানি পান করুন; ভারী খাবারের মাঝে পানি পান না করে ৩০ মিনিট পূর্বে বা ৪৫ মিনিট পরে পান করুন।' : 'Consume adequate pure warm water daily (2.5-3.0 L); avoid drinking large volumes during meals to preserve digestive fire.'}</li>
                )}
              </ul>
            </div>

            {/* Nutritionist Signature & Disclaimer */}
            <div className="pt-6 border-t flex flex-col sm:flex-row justify-between items-end gap-6 text-xs avoid-break">
              <div className="text-[10px] text-slate-400 print:text-slate-500 max-w-sm space-y-1">
                <p>
                  {bn 
                    ? 'এই পরামর্শপত্র ১০০% বৈজ্ঞানিক ও ডিটারমিনিস্টিক রুলস ইঞ্জিনের সাহায্যে তৈরি। কোনো কৃত্রিম বুদ্ধিমত্তা (AI) ব্যবহৃত হয়নি।' 
                    : '100% deterministic clinical functional nutrition protocol. Generated strictly via evidence-based clinical rules engines.'}
                </p>
                <p className="text-[9px] text-slate-400">
                  Disclaimer: Clinical functional nutrition guidance. Patient records are stored locally on device.
                </p>
              </div>

              <div className="text-center sm:text-right">
                <div className="h-10 border-b border-slate-400 border-dashed w-48 mb-1" />
                <div className="font-bold text-slate-900 dark:text-white print:text-black">
                  {bn ? 'নিউট্রিশনিস্টের স্বাক্ষর ও সিল' : 'Clinical Nutritionist Signature'}
                </div>
                <div className="text-[10px] text-slate-500 print:text-slate-600">
                  Shuddho Functional Nutrition Practice
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* VIEW 2: Pre-Intervention Clinical Health Assessment Report (P2) */}
      {activeReportType === 'clinical_assessment' && (
        <div className="space-y-4">
          {p2AnalysisResult ? (
            <FunctionalNutritionReport
              report={p2AnalysisResult.report}
              analysis={p2AnalysisResult}
              patient={effectivePatientForReport}
              lang={language}
              onApprove={(clinicianId, notes) => approveP2Analysis(clinicianId, notes)}
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

      {/* VIEW 3: Longitudinal Comparative Progress Report */}
      {activeReportType === 'comparative_progress' && (
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
  );
};
