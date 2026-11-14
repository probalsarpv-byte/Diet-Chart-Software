'use client';

import React, { useMemo } from 'react';
import { usePractice } from '@/context/PracticeContext';
import { useAssessment } from '@/context/AssessmentContext';
import {
  ASSESSMENT_DOMAINS,
  AssessmentDomainId,
  QuestionDefinition,
  coreQuestions,
} from '@/questionnaire/registry';
import { filterVisibleQuestions } from '@/engine/questionEngine';
import {
  ClipboardList,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Save,
  Zap,
  BookOpen,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export const AssessmentTab: React.FC = () => {
  const { patient, language } = usePractice();
  const bn = language === 'bn';

  const {
    data,
    setAnswer,
    resetAssessment,
    activeDomain,
    setActiveDomain,
    isQuickMode,
    setIsQuickMode,
    markCompleted,
    saveDraft,
    completionPercentage,
    totalAnsweredCount,
  } = useAssessment();

  // Find index of active domain
  const activeDomainIndex = useMemo(() => {
    const idx = ASSESSMENT_DOMAINS.findIndex((d) => d.id === activeDomain);
    return idx >= 0 ? idx : 0;
  }, [activeDomain]);

  const currentDomainMeta = ASSESSMENT_DOMAINS[activeDomainIndex];

  // Filter questions for the current active domain
  const domainQuestions = useMemo(() => {
    const allDomainQ = coreQuestions.filter((q) => q.domain === activeDomain);
    return filterVisibleQuestions(data.answers, allDomainQ, {
      isQuickMode,
      populationGroup: patient?.population_group,
    });
  }, [activeDomain, data.answers, isQuickMode, patient?.population_group]);

  // Handle navigation
  const handleNext = () => {
    if (activeDomainIndex < ASSESSMENT_DOMAINS.length - 1) {
      setActiveDomain(ASSESSMENT_DOMAINS[activeDomainIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (activeDomainIndex > 0) {
      setActiveDomain(ASSESSMENT_DOMAINS[activeDomainIndex - 1].id);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Sticky Top Bar & Patient Summary ───────────────────────── */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-foreground">
                {bn ? 'অ্যাডাপ্টিভ ফাংশনাল নিউট্রিশন অ্যাসেসমেন্ট' : 'Adaptive Functional Nutrition Assessment'}
              </h2>
              {data.completed && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {bn ? 'সম্পন্ন' : 'Completed'}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {bn
                ? `রোগী: ${patient.name} (${patient.age} বছর, ${patient.gender === 'female' ? 'নারী' : 'পুরুষ'}) • উত্তর প্রদান: ${totalAnsweredCount} টি`
                : `Patient: ${patient.name} (${patient.age}y, ${patient.gender}) • Answered: ${totalAnsweredCount} questions`}
            </p>
          </div>
        </div>

        {/* Quick vs Comprehensive Mode & Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <button
            type="button"
            onClick={() => setIsQuickMode(!isQuickMode)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              isQuickMode
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                : 'bg-secondary text-foreground hover:bg-secondary/80'
            }`}
          >
            {isQuickMode ? <Zap className="h-3.5 w-3.5 text-amber-500" /> : <BookOpen className="h-3.5 w-3.5 text-primary" />}
            <span>{isQuickMode ? (bn ? 'কুইক স্ক্রিনিং মোড' : 'Quick Mode (Screening)') : (bn ? 'ফুল কম্প্রিহেনসিভ মোড' : 'Comprehensive Mode')}</span>
          </button>

          <button
            type="button"
            onClick={saveDraft}
            className="px-3 py-1.5 rounded-xl border bg-secondary/50 hover:bg-secondary text-xs font-medium flex items-center gap-1.5 transition"
            title="Save draft"
          >
            <Save className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">{bn ? 'খসড়া সংরক্ষণ' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm(bn ? "আপনি কি নিশ্চিতভাবে এই রোগীর সমস্ত অ্যাসেসমেন্ট উত্তর মুছে নতুন করে শুরু করতে চান?" : "Are you sure you want to reset all assessment answers for this patient?")) {
                resetAssessment();
              }
            }}
            className="p-1.5 rounded-xl border text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition"
            title="Reset assessment"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Progress & Domain Stepper ─────────────────────────────── */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {bn ? 'অ্যাসেসমেন্ট সম্পন্নতার অগ্রগতি' : 'Assessment Completion Progress'}:
          </span>
          <span className="font-bold text-primary">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300 rounded-full"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {/* 14 Domain Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {ASSESSMENT_DOMAINS.map((domain, idx) => {
            const isActive = domain.id === activeDomain;
            const domainQ = coreQuestions.filter((q) => q.domain === domain.id);
            const answeredInDomain = domainQ.filter((q) => data.answers[q.id] !== undefined && data.answers[q.id] !== '').length;
            const isFinished = domainQ.length > 0 && answeredInDomain === domainQ.length;

            return (
              <button
                key={domain.id}
                type="button"
                onClick={() => setActiveDomain(domain.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition shrink-0 ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                    : isFinished
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-secondary/60 hover:bg-secondary text-muted-foreground'
                }`}
              >
                <span>{idx + 1}.</span>
                <span>{bn ? domain.name_bn : domain.name_en}</span>
                {isFinished && <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active Domain Questions Section ──────────────────────── */}
      <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="border-b pb-4">
          <div className="text-xs text-primary font-bold uppercase tracking-wider">
            {bn ? `পর্যায় ${activeDomainIndex + 1} / ${ASSESSMENT_DOMAINS.length}` : `Domain ${activeDomainIndex + 1} of ${ASSESSMENT_DOMAINS.length}`}
          </div>
          <h3 className="text-lg font-bold text-foreground mt-0.5">
            {bn ? currentDomainMeta.name_bn : currentDomainMeta.name_en}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {bn ? currentDomainMeta.description_bn : currentDomainMeta.description_en}
          </p>
        </div>

        {/* Questions list */}
        {domainQuestions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground space-y-2">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/60" />
            <p className="text-xs">
              {bn
                ? 'এই ক্যাটাগরিতে বর্তমানে প্রদর্শনের জন্য কোনো সক্রিয় প্রশ্ন নেই (পূর্ববর্তী উত্তরের ভিত্তিতে ফিল্টার করা হয়েছে অথবা কুইক মোডে অপ্রাসঙ্গিক)।'
                : 'No active questions to display in this domain based on your current filters or adaptive rules.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6 divide-y divide-border/50">
            {domainQuestions.map((q, qIndex) => {
              const currentVal = data.answers[q.id];

              return (
                <div key={q.id} className={qIndex > 0 ? 'pt-6 space-y-3' : 'space-y-3'}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <label className="text-sm font-semibold text-foreground block">
                        {bn ? q.label_bn : q.label_en}
                        {q.required && <span className="text-rose-500 ml-1">*</span>}
                      </label>
                      {q.clinicalTags && q.clinicalTags.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {q.clinicalTags.map((tag) => (
                            <span key={tag} className="text-[9px] px-1.5 py-0.2 rounded bg-secondary text-muted-foreground font-mono">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Question Input Types */}
                  {/* YES / NO */}
                  {q.answerType === 'yesno' && (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setAnswer(q.id, 'yes')}
                        className={`px-5 py-2 rounded-xl text-xs font-bold border transition ${
                          currentVal === 'yes'
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-background hover:bg-secondary text-foreground'
                        }`}
                      >
                        {bn ? 'হ্যাঁ (Yes)' : 'Yes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnswer(q.id, 'no')}
                        className={`px-5 py-2 rounded-xl text-xs font-bold border transition ${
                          currentVal === 'no'
                            ? 'bg-secondary text-foreground border-border font-bold'
                            : 'bg-background hover:bg-secondary text-foreground'
                        }`}
                      >
                        {bn ? 'না (No)' : 'No'}
                      </button>
                    </div>
                  )}

                  {/* SELECT */}
                  {q.answerType === 'select' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt) => {
                        const isSelected = currentVal === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setAnswer(q.id, opt.value)}
                            className={`p-3 rounded-xl border text-left text-xs transition flex items-center justify-between ${
                              isSelected
                                ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm'
                                : 'bg-background hover:bg-secondary/50 text-foreground border-border/80'
                            }`}
                          >
                            <span>{bn ? opt.label_bn || opt.label : opt.label_en || opt.label}</span>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* MULTISELECT */}
                  {q.answerType === 'multiselect' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt) => {
                        const selectedList: string[] = Array.isArray(currentVal) ? currentVal : [];
                        const isSelected = selectedList.includes(opt.value);

                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              const updated = isSelected
                                ? selectedList.filter((v) => v !== opt.value)
                                : [...selectedList, opt.value];
                              setAnswer(q.id, updated);
                            }}
                            className={`p-3 rounded-xl border text-left text-xs transition flex items-center justify-between ${
                              isSelected
                                ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm'
                                : 'bg-background hover:bg-secondary/50 text-foreground border-border/80'
                            }`}
                          >
                            <span>{bn ? opt.label_bn || opt.label : opt.label_en || opt.label}</span>
                            <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary border-primary text-white' : 'border-border'}`}>
                              {isSelected && <CheckCircle2 className="h-3 w-3" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* NUMBER */}
                  {q.answerType === 'number' && (
                    <div className="flex items-center gap-2 max-w-xs pt-1">
                      <input
                        type="number"
                        step="any"
                        value={currentVal !== undefined ? currentVal : ''}
                        onChange={(e) => setAnswer(q.id, e.target.value === '' ? undefined : Number(e.target.value))}
                        placeholder={bn ? 'মান লিখুন...' : 'Enter value...'}
                        className="w-full px-3 py-2 text-sm bg-background border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                      {q.unit && (
                        <span className="text-xs font-semibold px-2.5 py-2 bg-secondary rounded-xl text-muted-foreground whitespace-nowrap">
                          {q.unit}
                        </span>
                      )}
                    </div>
                  )}

                  {/* TEXT */}
                  {q.answerType === 'text' && (
                    <div className="pt-1">
                      <textarea
                        rows={2}
                        value={currentVal || ''}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                        placeholder={bn ? 'বিস্তারিত বর্ণনা লিখুন...' : 'Enter descriptive details...'}
                        className="w-full px-3 py-2 text-sm bg-background border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Navigation Buttons ───────────────────────────────────── */}
        <div className="border-t pt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={activeDomainIndex === 0}
            className="px-4 py-2 rounded-xl border bg-secondary/40 hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{bn ? 'পূর্ববর্তী বিভাগ' : 'Previous Domain'}</span>
          </button>

          <div className="flex items-center gap-2">
            {activeDomainIndex === ASSESSMENT_DOMAINS.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  markCompleted(true);
                  alert(bn ? "ফাংশনাল নিউট্রিশন অ্যাসেসমেন্ট সফলভাবে সম্পন্ন হিসেবে চিহ্নিত করা হয়েছে।" : "Functional nutrition assessment marked as complete!");
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold flex items-center gap-1.5 shadow-md transition"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{bn ? 'অ্যাসেসমেন্ট সম্পন্ন করুন' : 'Finalize Assessment'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 text-xs font-bold flex items-center gap-1.5 shadow-md transition"
              >
                <span>{bn ? 'পরবর্তী বিভাগ' : 'Next Domain'}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
