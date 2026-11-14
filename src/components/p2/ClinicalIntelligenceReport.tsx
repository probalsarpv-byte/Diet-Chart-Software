'use client';

import React from 'react';
import { P2AnalysisResult } from '@/engine/p2/types';
import { PatientProfile } from '@/types';
import {
  Printer,
  ShieldCheck,
  AlertOctagon,
  FileText,
  Clock,
  Layers,
  HelpCircle,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface ClinicalIntelligenceReportProps {
  result: P2AnalysisResult;
  patient: PatientProfile;
  lang: 'bn' | 'en';
}

export const ClinicalIntelligenceReport: React.FC<ClinicalIntelligenceReportProps> = ({
  result,
  patient,
  lang,
}) => {
  const bn = lang === 'bn';

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden in print) */}
      <div className="flex items-center justify-between p-4 bg-card border rounded-2xl shadow-sm no-print">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-600" />
          <div>
            <h3 className="font-bold text-sm text-foreground">
              {bn ? 'ক্লিনিক্যাল ইন্টেলিজেন্স ও রুট-কজ রিপোর্ট' : 'Clinical Intelligence & Root-Cause Report'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {bn ? 'এভিডেন্স-বেসড ফাংশনাল নিউট্রিশন ডিসিশন সাপোর্ট সামারি' : 'Evidence-Based Decision Support Summary'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
        >
          <Printer className="h-4 w-4" />
          <span>{bn ? 'প্রিন্ট / PDF ডাউনলোড' : 'Print / Export PDF'}</span>
        </button>
      </div>

      {/* Printable Report Document (A4 format) */}
      <div className="print-container bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 border rounded-3xl p-6 sm:p-10 max-w-4xl mx-auto shadow-xl space-y-6 print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Header & Clinic Letterhead */}
        <div className="border-b-2 border-purple-600 pb-4 flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-purple-600 text-white flex items-center justify-center font-black text-lg">
                শু
              </div>
              <div>
                <h1 className="font-extrabold text-xl leading-tight text-slate-900 dark:text-white print:text-black">
                  {bn ? 'শুদ্ধ ক্লিনিক্যাল ফাংশনাল নিউট্রিশন' : 'SHUDDHO CLINICAL FUNCTIONAL NUTRITION'}
                </h1>
                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 print:text-purple-700">
                  {bn ? 'ফাংশনাল মেডিসিন রুট-কজ ইন্টেলিজেন্স রিপোর্ট' : 'Functional Medicine Root-Cause Intelligence Report'}
                </p>
              </div>
            </div>
          </div>
          <div className="text-left sm:text-right text-xs">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 font-bold text-[10px]">
              DETERMINISTIC CLINICAL DECISION SUPPORT
            </span>
            <div className="text-[11px] text-muted-foreground mt-1">
              Generated: {new Date(result.generatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* 1 & 2: Patient Info & Consultation Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/50 print:bg-slate-50 p-4 rounded-xl border text-xs">
          <div>
            <span className="text-muted-foreground block">{bn ? 'রোগীর নাম:' : 'Patient Name:'}</span>
            <strong className="text-foreground font-bold">{patient.name}</strong>
          </div>
          <div>
            <span className="text-muted-foreground block">{bn ? 'বয়স ও লিঙ্গ:' : 'Age & Gender:'}</span>
            <strong className="text-foreground">{patient.age}y, {patient.gender}</strong>
          </div>
          <div>
            <span className="text-muted-foreground block">{bn ? 'আইডি ও ভিজিট:' : 'ID & Visit Date:'}</span>
            <strong className="text-foreground font-mono">{patient.id} ({patient.visit_date})</strong>
          </div>
          <div>
            <span className="text-muted-foreground block">{bn ? 'বর্তমান ফেজ:' : 'Care Phase:'}</span>
            <strong className="text-primary font-bold">Phase {patient.current_phase}</strong>
          </div>
        </div>

        {/* 14: Safety Concerns / Red Flags */}
        {result.redFlags.length > 0 && (
          <div className="p-4 rounded-xl border-2 border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertOctagon className="h-5 w-5 text-rose-500 shrink-0" />
              <span>{bn ? 'জরুরি ক্লিনিক্যাল সুরক্ষা সতর্কতা (Red Flags)' : 'Critical Clinical Safety Flags'}</span>
            </div>
            {result.redFlags.map((flag) => (
              <div key={flag.id} className="text-xs pl-7">
                <strong>• {bn ? flag.title_bn : flag.title_en}: </strong>
                <span>{bn ? flag.recommendedAction_bn : flag.recommendedAction_en}</span>
              </div>
            ))}
          </div>
        )}

        {/* 5: Functional Medicine Matrix Overview */}
        <div className="space-y-3">
          <h2 className="font-bold text-sm text-foreground flex items-center gap-2 border-b pb-1">
            <Layers className="h-4 w-4 text-purple-600" />
            <span>{bn ? 'ফাংশনাল মেডিসিন ম্যাট্রিক্স ওভারভিউ (৭টি সিস্টেম)' : 'Functional Medicine Matrix Overview (7 Systems)'}</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {result.domainFindings.map((df) => (
              <div key={df.domain} className="p-2.5 rounded-xl border bg-card space-y-1">
                <div className="font-semibold text-foreground text-[11px] truncate">
                  {bn ? df.domainName_bn : df.domainName_en}
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">{df.relevantObservations.length} obs</span>
                  <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                    df.overallBurden === 'significant' ? 'bg-rose-500/20 text-rose-600' :
                    df.overallBurden === 'moderate' ? 'bg-amber-500/20 text-amber-600' :
                    df.overallBurden === 'mild' ? 'bg-blue-500/20 text-blue-600' :
                    'bg-slate-500/10 text-muted-foreground'
                  }`}>
                    {df.overallBurden}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 9, 10, 11: Candidate Functional Mechanisms (Hypotheses) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-1">
            <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <span>{bn ? 'সম্ভাব্য কার্যকরী প্রক্রিয়া ও হাইপোথিসিস (Suspected Patterns)' : 'Candidate Functional Mechanisms & Hypotheses'}</span>
            </h2>
            <span className="text-[10px] text-muted-foreground italic">
              {bn ? '*অনুমিত মেকানিজম (নিশ্চিত মেডিকেল রোগ নির্ণয় নয়)' : '*Suspected mechanisms (not definitive medical diagnoses)'}
            </span>
          </div>

          <div className="space-y-3">
            {result.hypotheses.map((hyp) => (
              <div key={hyp.id} className="p-3.5 rounded-xl border bg-card text-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      {bn ? hyp.title_bn : hyp.title_en}
                    </h3>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      {bn ? hyp.description_bn : hyp.description_en}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold text-[10px] shrink-0 uppercase">
                    {hyp.evidenceSupportLevel}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <strong className="text-emerald-600 dark:text-emerald-400 block">
                      ✓ {bn ? 'সমর্থনকারী পর্যবেক্ষণসমূহ:' : 'Supporting Observations:'}
                    </strong>
                    <span className="text-muted-foreground">{hyp.supportingObservationIds.length} findings recorded</span>
                  </div>
                  <div>
                    <strong className="text-blue-600 dark:text-blue-400 block">
                      🔍 {bn ? 'প্রয়োজনীয় ক্লিনিক্যাল পরীক্ষা:' : 'Recommended Investigations:'}
                    </strong>
                    <span className="text-muted-foreground">{hyp.requiredInvestigations.join(', ') || 'Routine clinical monitoring'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 13: Clinical Priorities */}
        <div className="space-y-3">
          <h2 className="font-bold text-sm text-foreground border-b pb-1">
            {bn ? 'ক্লিনিক্যাল অগ্রাধিকার বোর্ড' : 'Clinical Priority Architecture'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {['medical_urgency', 'nutrition_intervention', 'further_assessment'].map((cat) => {
              const items = result.priorities.filter((p) => p.type === cat);
              return (
                <div key={cat} className="p-3 rounded-xl border bg-card space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider block text-muted-foreground">
                    {cat === 'medical_urgency' ? (bn ? 'চিকিৎসা সতর্কতা' : 'Medical Urgency') :
                     cat === 'nutrition_intervention' ? (bn ? 'পুষ্টি হস্তক্ষেপ' : 'Nutrition Priority') :
                     (bn ? 'অতিরিক্ত মূল্যায়ন' : 'Investigation')}
                  </span>
                  {items.length === 0 ? (
                    <span className="text-muted-foreground text-[11px] italic">None active</span>
                  ) : (
                    items.map((it) => (
                      <div key={it.id} className="text-[11px]">
                        <strong>• {bn ? it.title_bn : it.title_en}</strong>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 16, 17, 18: Intervention Strategy & Goals */}
        <div className="space-y-3">
          <h2 className="font-bold text-sm text-foreground border-b pb-1">
            {bn ? 'প্রস্তাবিত পার্সোনালাইজড পুষ্টি কৌশল' : 'Personalized Nutrition Intervention Goals'}
          </h2>
          <div className="space-y-2 text-xs">
            {result.interventionGoals.map((goal) => (
              <div key={goal.id} className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-900/40 print:bg-slate-50 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-foreground">{bn ? goal.title_bn : goal.title_en}</strong>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                    {goal.category}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {bn ? goal.clinicalObjective_bn : goal.clinicalObjective_en}
                </p>
                {goal.monitoringIndicators.length > 0 && (
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium pt-1">
                    🎯 Monitoring: {goal.monitoringIndicators.join(' • ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer & Clinician Signature Block */}
        <div className="border-t-2 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-xs text-muted-foreground print:pt-4">
          <div>
            <div className="font-bold text-foreground">
              {bn ? 'ক্লিনিক্যাল পর্যালোচনা ও সত্যতা বিধান' : 'Clinician Review & Verification'}
            </div>
            <p className="text-[11px] mt-0.5 max-w-sm">
              {bn
                ? 'এই সিদ্ধান্তগুলো ১০০% ডিটারমিনিস্টিক রুলস ইঞ্জিনের সহায়তায় প্রস্তুতকৃত এবং ক্লিনিক্যাল নিউট্রিশনিস্ট কর্তৃক যাচাইকৃত।'
                : 'Generated using 100% deterministic rules engine and verified by the attending Clinical Nutritionist.'}
            </p>
          </div>
          <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
            <div className="h-10 border-b border-dashed border-slate-400 w-48 mb-1"></div>
            <span className="font-bold text-foreground block">
              {bn ? 'ক্লিনিক্যাল নিউট্রিশনিস্টের স্বাক্ষর' : 'Clinical Nutritionist Signature'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
