'use client';

import React, { useState } from 'react';
import { usePractice } from '@/context/PracticeContext';
import { useAssessment } from '@/context/AssessmentContext';
import { PRAKRITI_QUESTIONS } from '@/engine/assessment/prakritiEngine';
import { VIKRITI_QUESTIONS } from '@/engine/assessment/vikritiEngine';
import { AGNI_QUESTIONS } from '@/engine/assessment/agniEngine';
import { AgniClassification } from '@/types/assessment';
import {
  Flame,
  Activity,
  Wind,
  Droplets,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';

export const StepAyurvedicAssessment: React.FC = () => {
  const { language } = usePractice();
  const bn = language === 'bn';
  const {
    prakritiAnswers,
    setPrakritiAnswer,
    prakritiResult,
    vikritiAnswers,
    setVikritiAnswer,
    vikritiResult,
    agniAnswers,
    setAgniAnswer,
    agniResult,
    mode,
    setCurrentStep
  } = useAssessment();

  const [activeSubTab, setActiveSubTab] = useState<'prakriti' | 'vikriti' | 'agni'>('prakriti');

  const visiblePrakriti = PRAKRITI_QUESTIONS.filter(q => {
    if (mode === 'quick' && !q.isQuickEligible && !prakritiAnswers[q.id]) {
      return false;
    }
    return true;
  });

  const visibleVikriti = VIKRITI_QUESTIONS.filter(q => {
    if (mode === 'quick' && !q.isHighValueQuick && !vikritiAnswers[q.id]) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">
            {bn ? 'ধাপ ৬: সম্পূর্ণ আয়ুর্বেদিক মূল্যায়ন (প্রকৃতি, বিকৃতি ও অগ্নি)' : 'Step 6: Ayurvedic Prakriti, Vikriti & Agni Assessment'}
          </h3>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            {bn ? 'আয়ুর্বেদিক পার্সোনালাইজেশন' : 'Ayurvedic Framework'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {bn
            ? 'জন্মগত প্রকৃতি (Prakriti), বর্তমান দোষের ভারসাম্যহীনতা (Vikriti) এবং মেটাবলিক পরিপাক অগ্নি (Agni) পৃথকভাবে মূল্যায়িত হয়।'
            : 'Constitutional baseline (Prakriti), current imbalance (Vikriti), and digestive metabolic fire (Agni) are evaluated independently.'}
        </p>
      </div>

      {/* Ayurvedic Status Overview Card */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-500" />
            {bn ? 'আয়ুর্বেদিক ফলাফল সারসংক্ষেপ' : 'Live Ayurvedic Profile Summary'}
          </h4>
          {prakritiResult.is_preliminary && (
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
              {bn ? 'কুইক স্ক্রিনিং (প্রাথমিক)' : 'Preliminary (Quick Mode)'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Prakriti Box */}
          <div className="p-3 rounded-xl bg-muted/60 border space-y-1.5">
            <div className="text-[10px] text-muted-foreground font-semibold uppercase">
              {bn ? '১. জন্মগত প্রকৃতি (Prakriti)' : '1. Innate Constitution'}
            </div>
            <div className="text-sm font-bold text-primary">
              {prakritiResult.primary_constitution.replace('_', '-').toUpperCase()}
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <span className="text-blue-500">V: {prakritiResult.vata_score}%</span>
              <span>•</span>
              <span className="text-rose-500">P: {prakritiResult.pitta_score}%</span>
              <span>•</span>
              <span className="text-emerald-500">K: {prakritiResult.kapha_score}%</span>
            </div>
          </div>

          {/* Vikriti Box */}
          <div className="p-3 rounded-xl bg-muted/60 border space-y-1.5">
            <div className="text-[10px] text-muted-foreground font-semibold uppercase">
              {bn ? '২. বর্তমান বিকৃতি (Vikriti)' : '2. Current Imbalance'}
            </div>
            <div className={`text-sm font-bold ${
              vikritiResult.active_aggravations.length > 0 ? 'text-amber-500' : 'text-emerald-500'
            }`}>
              {vikritiResult.dominant_imbalance.replace('_', ' ').toUpperCase()}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {vikritiResult.active_aggravations.length > 0
                ? `${vikritiResult.active_aggravations.join(', ')} aggravated`
                : 'Balanced state'}
            </div>
          </div>

          {/* Agni Box */}
          <div className="p-3 rounded-xl bg-muted/60 border space-y-1.5">
            <div className="text-[10px] text-muted-foreground font-semibold uppercase">
              {bn ? '৩. পরিপাক অগ্নি (Agni)' : '3. Digestive Fire (Agni)'}
            </div>
            <div className="text-sm font-bold text-foreground">
              {agniResult.name_en.split(' ')[0]}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {bn ? agniResult.name_bn : agniResult.clinical_summary_en}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('prakriti')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'prakriti'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          {bn ? '১. প্রকৃতি বিশ্লেষণ (১২ বৈশিষ্ট্য)' : '1. Prakriti Constitution (12 Traits)'}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('vikriti')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'vikriti'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          {bn ? '২. বিকৃতি লক্ষণ (১২ অসমতা)' : '2. Vikriti Imbalances (12 Symptoms)'}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('agni')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'agni'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          {bn ? '৩. পরিপাক অগ্নি (৪ প্রশ্ন)' : '3. Agni Evaluation (4 Questions)'}
        </button>
      </div>

      {/* SUB-TAB 1: Prakriti Questionnaire */}
      {activeSubTab === 'prakriti' && (
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">
            {bn
              ? 'রোগীর দীর্ঘমেয়াদী স্বাভাবিক শারীরিক ও মানসিক স্বভাব চিহ্নিত করুন (বর্তমান অসুস্থতার লক্ষণ বাদ দিয়ে)।'
              : 'Assess stable constitutional characteristics across life, excluding recent acute symptoms.'}
          </div>

          <div className="space-y-3">
            {visiblePrakriti.map((q, idx) => {
              const currentChoice = prakritiAnswers[q.id];

              return (
                <div
                  key={q.id}
                  className="bg-card border rounded-2xl p-4 shadow-sm hover:border-primary/40 transition-colors space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">
                      {idx + 1}. {bn ? q.trait_bn : q.trait_en}
                    </label>
                    {q.isQuickEligible && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600">
                        Quick
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {q.options.map(opt => {
                      const isSelected = currentChoice === opt.value;
                      const doshaColor = opt.value === 'vata' ? 'border-blue-500 text-blue-600' : opt.value === 'pitta' ? 'border-rose-500 text-rose-600' : 'border-emerald-500 text-emerald-600';

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setPrakritiAnswer(q.id, opt.value)}
                          className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/30 shadow-sm'
                              : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              {opt.value}
                            </span>
                            <div className={`h-4 w-4 rounded-full flex items-center justify-center ${
                              isSelected ? 'bg-primary text-primary-foreground' : 'border border-muted-foreground/30'
                            }`}>
                              {isSelected && <CheckCircle2 className="h-3 w-3" />}
                            </div>
                          </div>
                          <p className="text-[11px] leading-relaxed">
                            {bn ? opt.label_bn : opt.label_en}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Vikriti Questionnaire */}
      {activeSubTab === 'vikriti' && (
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">
            {bn
              ? 'রোগীর বর্তমান সময়ের অসমতা বা কষ্টদায়ক লক্ষণসমূহ চিহ্নিত করুন।'
              : 'Evaluate current acute or chronic changes relative to the individual\'s usual constitutional baseline.'}
          </div>

          <div className="space-y-3">
            {visibleVikriti.map((q, idx) => {
              const currentVal = vikritiAnswers[q.id];

              return (
                <div
                  key={q.id}
                  className="bg-card border rounded-2xl p-4 shadow-sm hover:border-primary/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                        {q.dosha}
                      </span>
                      <h4 className="text-xs font-bold text-foreground">
                        {bn ? q.imbalance_symptom_bn : q.imbalance_symptom_en}
                      </h4>
                    </div>
                  </div>

                  {/* Yes / No / Sometimes Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 flex-shrink-0 w-full sm:w-64">
                    {[
                      { val: 'yes' as const, label_en: 'Yes', label_bn: 'হ্যাঁ' },
                      { val: 'sometimes' as const, label_en: 'Often', label_bn: 'মাঝে মাঝে' },
                      { val: 'no' as const, label_en: 'No', label_bn: 'না' },
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setVikritiAnswer(q.id, opt.val)}
                        className={`py-1.5 px-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                          currentVal === opt.val
                            ? 'border-primary bg-primary text-primary-foreground font-bold shadow-sm'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {bn ? opt.label_bn : opt.label_en}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Agni Questionnaire */}
      {activeSubTab === 'agni' && (
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">
            {bn
              ? 'পরিপাক অগ্নির ৪টি স্তম্ভ: ক্ষুধা, খাওয়ার পরবর্তী অনুভূতি, সকালের মলত্যাগ এবং জিহ্বার আস্তরণ।'
              : 'The four classical pillars of metabolic digestive fire: hunger timing, postprandial sensation, evacuation, and morning tongue.'}
          </div>

          <div className="space-y-4">
            {AGNI_QUESTIONS.map((q, idx) => {
              const currentVal = agniAnswers[q.id];

              return (
                <div
                  key={q.id}
                  className="bg-card border rounded-2xl p-4 shadow-sm hover:border-primary/40 transition-colors space-y-3"
                >
                  <label className="text-xs font-bold text-foreground block">
                    {idx + 1}. {bn ? q.question_bn : q.question_en}
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {q.options.map(opt => {
                      const isSelected = currentVal === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setAgniAnswer(q.id, opt.value)}
                          className={`p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/30 shadow-sm'
                              : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                          }`}
                        >
                          <span className="min-w-0 pr-2">
                            {bn ? opt.label_bn : opt.label_en}
                          </span>
                          <div
                            className={`h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'border border-muted-foreground/30'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="h-3 w-3" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t">
        <button
          type="button"
          onClick={() => setCurrentStep('step_ffq')}
          className="px-4 py-2 border rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition-all flex items-center gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{bn ? 'পূর্ববর্তী: খাদ্য ফ্রিকোয়েন্সি' : 'Previous: 7-Day FFQ'}</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentStep('step_population')}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-all flex items-center gap-1.5"
        >
          <span>{bn ? 'পরবর্তী: বিশেষ জনসংখ্যা মডিউল' : 'Next: Population Modules'}</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
