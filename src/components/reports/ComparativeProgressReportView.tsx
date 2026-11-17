'use client';

import React, { useState } from 'react';
import { usePractice } from '@/context/PracticeContext';
import {
  ComparativeProgressReport,
  QuantitativeChange
} from '@/types';
import {
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Calendar,
  Clock,
  TrendingUp,
  Activity,
  Award,
  Sparkles,
  Lock,
  ArrowRight
} from 'lucide-react';

interface ComparativeProgressReportViewProps {
  report: ComparativeProgressReport;
  onApprove?: (reportId: string, clinicianId: string, notes?: string) => boolean;
}

export const ComparativeProgressReportView: React.FC<ComparativeProgressReportViewProps> = ({
  report,
  onApprove
}) => {
  const { language, patient } = usePractice();
  const bn = language === 'bn';

  const [clinicianId, setClinicianId] = useState(
    report.approved_by || report.sectionL_nutritionistReview?.reviewing_nutritionist || ''
  );
  const [signoffNotes, setSignoffNotes] = useState(
    report.clinician_notes || report.sectionL_nutritionistReview?.notes || ''
  );
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [approvalSuccess, setApprovalSuccess] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(report.is_approved);

  const handlePrint = () => {
    window.print();
  };

  const handleSignOffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = clinicianId.trim();
    if (!trimmed || trimmed.length < 3) {
      setApprovalError(bn ? 'বৈধ চিকিৎসকের নাম বা আইডি আবশ্যক (কমপক্ষে ৩ অক্ষর)।' : 'A valid licensed practitioner name or clinician ID is required (min 3 chars).');
      return;
    }
    const isPlaceholder = ['clinician', 'dr. clinical nutritionist', 'doctor', 'nutritionist', 'admin', 'user', 'test', 'guest'].includes(trimmed.toLowerCase());
    if (isPlaceholder) {
      setApprovalError(bn ? 'অনুগ্রহ করে আসল চিকিৎসকের নাম লিখুন (প্লেসহোল্ডার গ্রহণযোগ্য নয়)।' : 'Generic placeholder names are not permitted. Please enter the licensed practitioner name.');
      return;
    }

    setApprovalError(null);
    if (onApprove) {
      const ok = onApprove(report.report_id, trimmed, signoffNotes);
      if (ok) {
        setIsApproved(true);
        setApprovalSuccess(bn ? 'লংগিটিউডিনাল প্রগ্রেস রিপোর্ট সফলভাবে অনুমোদিত ও সংরক্ষিত হয়েছে।' : 'Comparative progress report officially approved and persisted.');
      } else {
        setApprovalError(bn ? 'অনুমোদন সংরক্ষণ ব্যর্থ হয়েছে।' : 'Failed to persist report approval.');
      }
    }
  };

  const renderBadge = (outcome: string) => {
    if (outcome === 'improved') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          {bn ? 'উন্নতি' : 'Improved'}
        </span>
      );
    }
    if (outcome === 'worsened') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
          {bn ? 'অবনতি' : 'Worsened'}
        </span>
      );
    }
    if (outcome === 'stable') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
          {bn ? 'স্থিতিশীল' : 'Stable'}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
        {bn ? 'অপর্যাপ্ত' : 'N/A'}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* ── Top Floating Action Bar (Hidden in Print) ──────────────── */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-bold text-sm text-foreground">
              {bn ? 'লংগিটিউডিনাল তুলনামূলক ক্লিনিক্যাল প্রগ্রেস রিপোর্ট' : 'Comparative Clinical Progress Report'}
            </h2>
            <p className="text-xs text-muted-foreground">
              Report ID: {report.report_id} • {bn ? 'প্রিন্ট ও স্বাক্ষরের জন্য প্রস্তুত' : 'Formatted for crisp A4 portrait printing'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 text-xs font-bold flex items-center gap-1.5 shadow-md transition"
          >
            <Printer className="h-4 w-4" />
            <span>{bn ? 'প্রিন্ট / PDF ডাউনলোড' : 'Print / Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* ── A4 Printable Document Container ────────────────────────── */}
      <div className="bg-card border rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 text-foreground print:border-none print:shadow-none print:p-0">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { font-size: 11px; color: #000 !important; background: #fff !important; }
            .no-print { display: none !important; }
            .print-table th, .print-table td { font-size: 9px; padding: 3px 4px; word-break: break-word; }
            tr, .print-avoid-break { break-inside: avoid; page-break-inside: avoid; }
            @page { margin: 12mm 15mm; size: A4 portrait; }
          }
        `}} />
        
        {/* ── Institutional Header ───────────────────────────────────── */}
        <div className="border-b-2 border-primary/30 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary text-primary-foreground font-black text-sm">
                SN
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
                SHUDDHO FUNCTIONAL & PRECISION NUTRITION
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Clinical Functional Medicine & Integrative Ayurvedic Clinical Informatics
            </p>
          </div>

          <div className="text-left sm:text-right text-xs space-y-0.5 text-muted-foreground">
            <div className="font-bold text-foreground">
              {bn ? 'ক্লিনিক্যাল প্রগ্রেস ইভালুয়েশন' : 'Clinical Progress Evaluation'}
            </div>
            <div>Generated: {new Date(report.generated_at).toLocaleDateString()}</div>
            <div>Status: <span className="font-bold text-primary">{isApproved ? 'CLINICIAN APPROVED' : 'PROVISIONAL / DRAFT'}</span></div>
          </div>
        </div>

        {/* ── Section A: Patient & Consultation Header ────────────────── */}
        <div className="p-4 rounded-2xl bg-muted/20 border space-y-3">
          <div className="text-xs font-bold text-primary uppercase tracking-wider">
            {bn ? 'সেকশন A: রোগীর পরিচিতি ও পরামর্শ সময়কাল' : 'Section A: Patient & Consultation Framework'}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">{bn ? 'রোগীর নাম' : 'Patient Name'}:</span>
              <strong className="text-foreground text-sm">{report.sectionA_patientAndConsultation.patient_name}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">{bn ? 'রোগীর আইডি' : 'Patient ID'}:</span>
              <strong className="text-foreground">{report.sectionA_patientAndConsultation.patient_id}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">{bn ? 'বয়স / লিঙ্গ' : 'Age / Gender'}:</span>
              <strong className="text-foreground">
                {report.sectionA_patientAndConsultation.age > 0 ? `${report.sectionA_patientAndConsultation.age}y` : 'Unrecorded'} • {report.sectionA_patientAndConsultation.gender}
              </strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">{bn ? 'দায়িত্বপ্রাপ্ত নিউট্রিশনিস্ট' : 'Reviewing Nutritionist'}:</span>
              <strong className="text-foreground">{report.sectionA_patientAndConsultation.reviewing_nutritionist}</strong>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">{bn ? 'বেসলাইন ভিজিট' : 'Baseline Date'}:</span>
              <strong className="text-foreground">{report.sectionA_patientAndConsultation.baseline_date}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">{bn ? 'বর্তমান মূল্যায়ন' : 'Current Date'}:</span>
              <strong className="text-foreground">{report.sectionA_patientAndConsultation.comparison_date}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">{bn ? 'অতিবাহিত দিন' : 'Days Elapsed'}:</span>
              <strong className="text-foreground">{report.sectionA_patientAndConsultation.days_elapsed} days</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">{bn ? 'কেয়ার ফেজ' : 'Care Phase'}:</span>
              <strong className="text-primary font-bold">Phase {patient.current_phase || 1}</strong>
            </div>
          </div>
        </div>

        {/* ── Section B: Overall Progress Executive Summary ───────────── */}
        <div className="space-y-3">
          <div className="border-b pb-1 text-xs font-bold text-primary uppercase tracking-wider">
            {bn ? 'সেকশন B: সামগ্রিক ক্লিনিক্যাল অগ্রগতির সারসংক্ষেপ' : 'Section B: Executive Longitudinal Progress Summary'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Key Improvements */}
            <div className="p-3.5 rounded-xl border bg-emerald-500/5 border-emerald-500/20 space-y-1.5">
              <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>{bn ? 'চিহ্নিত উন্নতিসমূহ (Improvements)' : 'Verified Improvements'}</span>
              </div>
              {report.sectionB_overallSummary.improved.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">{bn ? 'কোনো সুস্পষ্ট উন্নতি নথিভুক্ত নেই।' : 'No verified improvements logged yet.'}</p>
              ) : (
                <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-foreground">
                  {report.sectionB_overallSummary.improved.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Worsened / Emergent Concerns */}
            <div className="p-3.5 rounded-xl border bg-rose-500/5 border-rose-500/20 space-y-1.5">
              <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                <span>{bn ? 'অবনতি বা নতুন ঝুঁকি (Concerns)' : 'Deteriorations / Risks'}</span>
              </div>
              {report.sectionB_overallSummary.worsened.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">{bn ? 'কোনো অবনতি পরিলক্ষিত হয়নি।' : 'No deterioration flags triggered.'}</p>
              ) : (
                <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-foreground">
                  {report.sectionB_overallSummary.worsened.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Stable Indicators */}
            <div className="p-3.5 rounded-xl border bg-blue-500/5 border-blue-500/20 space-y-1.5">
              <div className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Activity className="h-4 w-4" />
                <span>{bn ? 'স্থিতিশীল পরিমাপসমূহ (Stable)' : 'Stable Parameters'}</span>
              </div>
              {report.sectionB_overallSummary.stable.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">{bn ? 'পরিমাপ অপরিবর্তিত।' : 'Baseline stability observed.'}</p>
              ) : (
                <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-foreground">
                  {report.sectionB_overallSummary.stable.slice(0, 4).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* ── Section C: Quantitative Anthropometrics Comparison ──────── */}
        <div className="space-y-3">
          <div className="border-b pb-1 text-xs font-bold text-primary uppercase tracking-wider">
            {bn ? 'সেকশন C: শারীরিক পরিমাপ ও ম্যাক্রোনিউট্রিয়েন্ট তুলনা' : 'Section C: Quantitative Anthropometrics & Energy Progression'}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs print-table">
              <thead>
                <tr className="border-b text-muted-foreground text-left">
                  <th className="pb-2 font-medium">{bn ? 'পরিমাপক (Metric)' : 'Parameter'}</th>
                  <th className="pb-2 font-medium">{bn ? 'বেসলাইন' : 'Baseline'}</th>
                  <th className="pb-2 font-medium">{bn ? 'বর্তমান' : 'Current'}</th>
                  <th className="pb-2 font-medium">{bn ? 'পরিবর্তন (Delta)' : 'Absolute Delta'}</th>
                  <th className="pb-2 font-medium">{bn ? 'শতাংশ (%)' : '% Change'}</th>
                  <th className="pb-2 font-medium">{bn ? 'ফলাফল' : 'Outcome'}</th>
                  <th className="pb-2 font-medium">{bn ? 'ক্লিনিক্যাল ব্যাখ্যা' : 'Clinical Interpretation'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {report.sectionC_anthropometricComparison.map((m, idx) => (
                  <tr key={idx} className="hover:bg-muted/10">
                    <td className="py-2 font-semibold text-foreground">
                      {bn ? m.marker_name_bn : m.marker_name_en}
                    </td>
                    <td className="py-2 text-muted-foreground">{m.baseline_value !== undefined ? `${m.baseline_value} ${m.unit}` : 'N/A'}</td>
                    <td className="py-2 font-bold text-foreground">{m.current_value !== undefined ? `${m.current_value} ${m.unit}` : 'N/A'}</td>
                    <td className="py-2 font-semibold">
                      {m.absolute_change !== undefined ? `${m.absolute_change > 0 ? '+' : ''}${m.absolute_change} ${m.unit}` : 'N/A'}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {m.percentage_change !== undefined ? `${m.percentage_change > 0 ? '+' : ''}${m.percentage_change}%` : 'N/A'}
                    </td>
                    <td className="py-2">{renderBadge(m.outcome)}</td>
                    <td className="py-2 text-[11px] text-muted-foreground max-w-xs">
                      {bn ? m.clinical_interpretation_bn : m.clinical_interpretation_en}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Section D & E: Symptom Progress & Lab Trends ────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Section D: Symptoms & Stool */}
          <div className="space-y-3">
            <div className="border-b pb-1 text-xs font-bold text-primary uppercase tracking-wider">
              {bn ? 'সেকশন D: লক্ষণ ও পরিপাকতন্ত্রের স্থিতি' : 'Section D: Symptoms & Stool Health'}
            </div>

            <div className="space-y-2">
              {report.sectionD_symptomProgress.map((s, idx) => (
                <div key={idx} className="p-2.5 rounded-xl border bg-muted/10 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-foreground">{bn ? s.marker_name_bn : s.marker_name_en}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {s.baseline_value !== undefined ? `Base: ${s.baseline_value}` : 'Base: N/A'} →{' '}
                      <strong>Curr: {s.current_value ?? 'N/A'}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    {renderBadge(s.outcome)}
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {bn ? s.clinical_interpretation_bn : s.clinical_interpretation_en}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section E: Laboratory Trends */}
          <div className="space-y-3">
            <div className="border-b pb-1 text-xs font-bold text-primary uppercase tracking-wider">
              {bn ? 'সেকশন E: ল্যাবরেটরি বায়োমার্কার ট্রেন্ড' : 'Section E: Laboratory Biomarker Trends'}
            </div>

            {report.sectionE_laboratoryTrends.length === 0 ? (
              <div className="p-4 rounded-xl border bg-muted/10 text-xs text-muted-foreground text-center">
                {bn ? 'কোনো ল্যাব ডেটা রেকর্ড করা নেই।' : 'No laboratory observations recorded for comparison.'}
              </div>
            ) : (
              <div className="space-y-2">
                {report.sectionE_laboratoryTrends.map((lab, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl border bg-muted/10 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-foreground">{bn ? lab.marker_name_bn : lab.marker_name_en}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {lab.baseline_value !== undefined ? `Base: ${lab.baseline_value} ${lab.unit}` : 'Base: N/A'} →{' '}
                        <strong>Curr: {lab.current_value !== undefined ? `${lab.current_value} ${lab.unit}` : 'N/A'}</strong>
                      </div>
                    </div>
                    <div className="text-right">
                      {renderBadge(lab.outcome)}
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {bn ? lab.clinical_interpretation_bn : lab.clinical_interpretation_en}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Section F: Functional Nutrition 7-Domain Status ─────────── */}
        <div className="space-y-3">
          <div className="border-b pb-1 text-xs font-bold text-primary uppercase tracking-wider">
            {bn ? 'সেকশন F: ফাংশনাল নিউট্রিশন ৭-ডোমেন ম্যাট্রিক্স অগ্রগতি' : 'Section F: Functional Nutrition 7-Domain Matrix'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {report.sectionF_functionalMatrixChanges.map(d => (
              <div key={d.domain} className="p-3.5 rounded-xl border bg-muted/10 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-foreground">{bn ? d.domain_name_bn : d.domain_name_en}</div>
                  {renderBadge(d.status)}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Burden: <strong className="capitalize">{d.baseline_burden}</strong> → <strong className="capitalize text-foreground">{d.current_burden}</strong>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {d.clinical_notes}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section G & H: Dietary Adherence & Ayurvedic Progress ───── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Section G: Dietary Pattern & Adherence */}
          <div className="p-4 rounded-2xl bg-muted/20 border space-y-2 text-xs">
            <div className="font-bold text-primary uppercase tracking-wider text-[11px]">
              {bn ? 'সেকশন G: ডায়েট প্যাটার্ন ও খাদ্যতালিকা অনুসরণ (Adherence)' : 'Section G: Dietary Adherence & Evolution'}
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-muted-foreground">{bn ? 'খাদ্যতালিকা অনুসরণের হার:' : 'Reported Adherence Rate:'}</span>
              <strong className="text-foreground text-sm font-bold">
                {report.sectionG_dietaryPatternAndAdherence.adherence_score_pct ?? 75}%
              </strong>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {bn ? 'বাধা বা চ্যালেঞ্জ:' : 'Reported Barriers:'}{' '}
              {report.sectionG_dietaryPatternAndAdherence.barriers.length > 0
                ? report.sectionG_dietaryPatternAndAdherence.barriers.join(', ')
                : (bn ? 'কোনো গুরুতর বাধা পাওয়া যায়নি।' : 'None reported.')}
            </p>
          </div>

          {/* Section H: Ayurvedic Progress */}
          <div className="p-4 rounded-2xl bg-muted/20 border space-y-2 text-xs">
            <div className="font-bold text-primary uppercase tracking-wider text-[11px]">
              {bn ? 'সেকশন H: আয়ুর্বেদিক দোষিক ভারসাম্য ও অগ্নির ক্রমবিকাশ' : 'Section H: Ayurvedic Vikriti & Agni Progress'}
            </div>
            <div className="text-[11px]">
              <span className="text-muted-foreground">{bn ? 'জন্মগত প্রকৃতি (স্থির):' : 'Constitutional Prakriti (Constant):'}</span>{' '}
              <strong className="text-foreground">{report.sectionH_ayurvedicProgress.prakriti_constant}</strong>
            </div>
            <div className="text-[11px]">
              <span className="text-muted-foreground">{bn ? 'পাচক অগ্নি অবস্থা:' : 'Agni State:'}</span>{' '}
              <strong className="capitalize text-foreground">
                {report.sectionH_ayurvedicProgress.baseline_agni} → {report.sectionH_ayurvedicProgress.current_agni}
              </strong>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {bn ? report.sectionH_ayurvedicProgress.agni_interpretation_bn : report.sectionH_ayurvedicProgress.agni_interpretation_en}
            </p>
          </div>
        </div>

        {/* ── Section I & J: Clinical Safety & Outcome Interpretation ─── */}
        <div className="p-4 rounded-2xl border bg-muted/10 space-y-3 text-xs">
          <div className="font-bold text-primary uppercase tracking-wider text-[11px]">
            {bn ? 'সেকশন I ও J: নিরাপত্তা পর্যালোচনা ও ফলাফলের ক্লিনিক্যাল মূল্যায়ন' : 'Section I & J: Safety Review & Clinical Outcome Attribution'}
          </div>

          <div className="text-[11px] text-muted-foreground leading-relaxed">
            <strong>{bn ? 'কার্যকারণ সংক্রান্ত সতর্কতা (Causality Caveat):' : 'Causality Caveat:'}</strong>{' '}
            {bn ? report.sectionJ_clinicalOutcomeInterpretation.causality_caveat_bn : report.sectionJ_clinicalOutcomeInterpretation.causality_caveat_en}
          </div>
        </div>

        {/* ── Section K: Next Clinical Priorities ─────────────────────── */}
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2 text-xs">
          <div className="font-bold text-primary uppercase tracking-wider text-[11px]">
            {bn ? 'সেকশন K: পরবর্তী কেয়ার ফেজের ক্লিনিক্যাল অগ্রাধিকারসমূহ' : 'Section K: Next Phase Clinical Priorities'}
          </div>
          <ul className="list-disc pl-5 text-[11px] space-y-1 text-foreground">
            {report.sectionK_nextClinicalPriorities.map((item, idx) => (
              <li key={idx} className="font-semibold">{item}</li>
            ))}
          </ul>
        </div>

        {/* ── Section L: Registered Nutritionist Sign-Off & Governance ─── */}
        <div className="border-t-2 border-primary/30 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <div className="font-bold text-sm text-foreground">
                {bn ? 'সেকশন L: দায়িত্বপ্রাপ্ত ক্লিনিক্যাল নিউট্রিশনিস্টের স্বাক্ষর ও অনুমোদন' : 'Section L: Registered Nutritionist Sign-Off & Clinical Governance'}
              </div>
            </div>

            {isApproved && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>OFFICIALLY APPROVED</span>
              </span>
            )}
          </div>

          {!isApproved ? (
            <form onSubmit={handleSignOffSubmit} className="space-y-3 no-print">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {bn ? 'অনুমোদনকারী নিউট্রিশনিস্টের নাম / আইডি *' : 'Reviewing Clinician Name / ID *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={clinicianId}
                    onChange={e => setClinicianId(e.target.value)}
                    placeholder="e.g. Dr. A. Rahman, Clinical Nutritionist"
                    className="w-full px-3 py-2 rounded-xl border bg-background text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {bn ? 'ক্লিনিক্যাল মন্তব্য ও নির্দেশনা' : 'Clinical Directives / Notes'}
                  </label>
                  <input
                    type="text"
                    value={signoffNotes}
                    onChange={e => setSignoffNotes(e.target.value)}
                    placeholder={bn ? 'অগ্রগতি সন্তোষজনক; পরবর্তী ফেজ অনুমোদিত...' : 'Satisfactory progress; next phase goals approved...'}
                    className="w-full px-3 py-2 rounded-xl border bg-background text-xs"
                  />
                </div>
              </div>

              {approvalError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-semibold">
                  {approvalError}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{bn ? 'চূড়ান্ত অনুমোদন ও সংরক্ষণ করুন' : 'Approve Progress Report'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-foreground space-y-1">
              <div>
                <strong>{bn ? 'অনুমোদনকারী নিউট্রিশনিস্ট:' : 'Signed Off By:'}</strong>{' '}
                {report.approved_by || clinicianId}
              </div>
              <div>
                <strong>{bn ? 'অনুমোদনের তারিখ:' : 'Approval Date:'}</strong>{' '}
                {report.approval_date || new Date().toISOString().split('T')[0]}
              </div>
              {signoffNotes && (
                <div>
                  <strong>{bn ? 'ক্লিনিক্যাল নোট:' : 'Directives:'}</strong> {signoffNotes}
                </div>
              )}
            </div>
          )}

          {/* Printable Signature Line */}
          <div className="pt-8 hidden print:flex items-end justify-between text-xs text-muted-foreground">
            <div>
              <div className="border-t border-foreground w-48 mb-1" />
              <div>Patient / Guardian Signature</div>
            </div>
            <div className="text-right">
              <div className="border-t border-foreground w-48 mb-1 ml-auto" />
              <div className="font-bold text-foreground">{report.approved_by || clinicianId || 'Authorized Clinician'}</div>
              <div>Licensed Clinical Nutritionist</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
