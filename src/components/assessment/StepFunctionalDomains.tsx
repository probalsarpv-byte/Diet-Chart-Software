'use client';

import React, { useMemo } from 'react';
import { usePractice } from '@/context/PracticeContext';
import { useAssessment } from '@/context/AssessmentContext';
import {
  ASSESSMENT_DOMAINS,
  AssessmentDomainId,
  coreQuestions,
  QuestionDefinition
} from '@/questionnaire/registry';
import { filterVisibleQuestions } from '@/engine/questionEngine';
import {
  Stethoscope,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export const StepFunctionalDomains: React.FC = () => {
  const { patient, language } = usePractice();
  const bn = language === 'bn';
  const {
    activeDomain,
    setActiveDomain,
    functionalAnswers,
    setAnswer,
    mode,
    setCurrentStep
  } = useAssessment();

  // Active domain metadata
  const activeDomainMeta = useMemo(() => {
    return ASSESSMENT_DOMAINS.find(d => d.id === activeDomain) || ASSESSMENT_DOMAINS[0];
  }, [activeDomain]);

  const activeIndex = useMemo(() => {
    return ASSESSMENT_DOMAINS.findIndex(d => d.id === activeDomain);
  }, [activeDomain]);

  // Questions for active domain
  const questionsForDomain = useMemo(() => {
    const rawDomainQuestions = coreQuestions.filter(q => q.domain === activeDomain);
    return filterVisibleQuestions(functionalAnswers, rawDomainQuestions, {
      isQuickMode: mode === 'quick',
      populationGroup: patient?.population_group,
      clinicalPathways: patient?.clinical_pathways
    });
  }, [activeDomain, functionalAnswers, mode, patient?.population_group, patient?.clinical_pathways]);

  const handleNextDomain = () => {
    if (activeIndex < ASSESSMENT_DOMAINS.length - 1) {
      setActiveDomain(ASSESSMENT_DOMAINS[activeIndex + 1].id);
    } else {
      setCurrentStep('step_ffq');
    }
  };

  const handlePrevDomain = () => {
    if (activeIndex > 0) {
      setActiveDomain(ASSESSMENT_DOMAINS[activeIndex - 1].id);
    } else {
      setCurrentStep('step_medical_history');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">
            {bn ? 'ধাপ ৪: অ্যাডাপ্টিভ ফাংশনাল নিউট্রিশন মূল্যায়ন' : 'Step 4: Adaptive Functional Nutrition Domains'}
          </h3>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {mode === 'quick' ? (bn ? 'কুইক মোড' : 'Quick Mode') : (bn ? 'বিস্তারিত মোড' : 'Comprehensive')}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {bn
            ? 'সিস্টেম বায়োলজি ভিত্তিক ১৪টি কার্যকরী ডোমেন। আপনার উত্তরের ওপর ভিত্তি করে প্রাসঙ্গিক প্রশ্নাবলি স্বয়ংক্রিয়ভাবে পরিবর্তিত হবে।'
            : 'Systems-biology 14-domain assessment. Questions adapt dynamically based on patient responses without page reloads.'}
        </p>
      </div>

      {/* Domain Navigation Pills (Horizontal scrollable) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {ASSESSMENT_DOMAINS.map((domain, idx) => {
          const isActive = domain.id === activeDomain;
          // Count answered in this domain
          const domainQs = coreQuestions.filter(q => q.domain === domain.id);
          const answeredInDomain = domainQs.filter(
            q => functionalAnswers[q.id] !== undefined && functionalAnswers[q.id] !== null && functionalAnswers[q.id] !== ""
          ).length;

          return (
            <button
              key={domain.id}
              type="button"
              onClick={() => setActiveDomain(domain.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                  : 'bg-card border text-muted-foreground hover:bg-muted'
              }`}
            >
              <span>{idx + 1}. {bn ? domain.name_bn.split(' ')[0] : domain.name_en.split(' ')[0]}</span>
              {answeredInDomain > 0 && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-foreground'
                }`}>
                  {answeredInDomain}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Domain Title Card */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold text-primary uppercase tracking-wider">
              {bn ? `ডোমেন ${activeIndex + 1} / ১৪` : `Domain ${activeIndex + 1} of 14`}
            </div>
            <h4 className="text-sm font-bold text-foreground mt-0.5">
              {bn ? activeDomainMeta.name_bn : activeDomainMeta.name_en}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {bn ? activeDomainMeta.description_bn : activeDomainMeta.description_en}
            </p>
          </div>
          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-xs">
            {activeIndex + 1}
          </div>
        </div>
      </div>

      {/* Questions List for Active Domain */}
      <div className="space-y-4">
        {questionsForDomain.length === 0 ? (
          <div className="p-8 text-center bg-card border rounded-2xl text-muted-foreground text-xs">
            {bn
              ? 'এই ডোমেনের সব শর্তসাপেক্ষ প্রশ্ন বর্তমান রোগীর ক্ষেত্রে বাদ দেওয়া হয়েছে।'
              : 'All conditional questions in this domain are hidden based on current patient profile.'}
          </div>
        ) : (
          questionsForDomain.map((q) => {
            const currentVal = functionalAnswers[q.id];

            return (
              <div
                key={q.id}
                className="bg-card border rounded-2xl p-4 shadow-sm hover:border-primary/40 transition-colors space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <label className="text-xs font-bold text-foreground block">
                      {bn ? q.label_bn : q.label_en}
                    </label>
                    {q.isHighValueScreening && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 flex-shrink-0">
                        {bn ? 'উচ্চ অগ্রাধিকার' : 'Screening'}
                      </span>
                    )}
                  </div>
                  {q.hint_en && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {bn && q.hint_bn ? q.hint_bn : q.hint_en}
                    </p>
                  )}
                </div>

                {/* Input Controls */}
                {/* 1. Yes / No Input */}
                {q.answerType === 'yesno' && (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 'yes', label_en: 'Yes', label_bn: 'হ্যাঁ' },
                      { val: 'no', label_en: 'No', label_bn: 'না' },
                      { val: 'not_sure', label_en: 'Not Sure', label_bn: 'নিশ্চিত নই' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setAnswer(q.id, opt.val)}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                          currentVal === opt.val
                            ? 'border-primary bg-primary text-primary-foreground font-bold shadow-sm'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {bn ? opt.label_bn : opt.label_en}
                      </button>
                    ))}
                  </div>
                )}

                {/* 2. Single Select */}
                {q.answerType === 'select' && q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt) => {
                      const isSelected = currentVal === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setAnswer(q.id, opt.value)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-primary bg-primary/5 text-primary font-bold ring-1 ring-primary/30 shadow-sm'
                              : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                          }`}
                        >
                          <span className="min-w-0 pr-2">
                            {bn && opt.label_bn ? opt.label_bn : opt.label_en || opt.label}
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
                )}

                {/* 3. Multi-Select */}
                {q.answerType === 'multiselect' && q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt) => {
                      const selectedArray = Array.isArray(currentVal) ? currentVal : [];
                      const isSelected = selectedArray.includes(opt.value);

                      const toggleMulti = () => {
                        let nextArray: string[];
                        if (isSelected) {
                          nextArray = selectedArray.filter((v: string) => v !== opt.value);
                        } else {
                          nextArray = [...selectedArray, opt.value];
                        }
                        setAnswer(q.id, nextArray);
                      };

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={toggleMulti}
                          className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-primary bg-primary/5 text-primary font-bold ring-1 ring-primary/30 shadow-sm'
                              : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                          }`}
                        >
                          <span className="min-w-0 pr-2">
                            {bn && opt.label_bn ? opt.label_bn : opt.label_en || opt.label}
                          </span>
                          <div
                            className={`h-4 w-4 rounded-md flex items-center justify-center flex-shrink-0 ${
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
                )}

                {/* 4. Number Input */}
                {q.answerType === 'number' && (
                  <div className="flex items-center gap-2 max-w-xs">
                    <input
                      type="number"
                      value={currentVal || ''}
                      onChange={(e) => setAnswer(q.id, parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
                    />
                    {q.unit && (
                      <span className="text-xs text-muted-foreground font-semibold flex-shrink-0">
                        {q.unit}
                      </span>
                    )}
                  </div>
                )}

                {/* 5. Text Input */}
                {q.answerType === 'text' && (
                  <input
                    type="text"
                    value={currentVal || ''}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t">
        <button
          type="button"
          onClick={handlePrevDomain}
          className="px-4 py-2 border rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition-all flex items-center gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{bn ? 'পূর্ববর্তী ডোমেন' : 'Previous Domain'}</span>
        </button>

        <button
          type="button"
          onClick={handleNextDomain}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-all flex items-center gap-1.5"
        >
          <span>
            {activeIndex < ASSESSMENT_DOMAINS.length - 1
              ? (bn ? 'পরবর্তী ডোমেন' : 'Next Domain')
              : (bn ? 'পরবর্তী: ৭-দিনের খাদ্য ফ্রিকোয়েন্সি' : 'Next: 7-Day FFQ')}
          </span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
