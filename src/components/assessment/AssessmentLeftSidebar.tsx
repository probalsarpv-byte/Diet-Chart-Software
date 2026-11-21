'use client';

import React from 'react';
import { usePractice } from '@/context/PracticeContext';
import { useAssessment } from '@/context/AssessmentContext';
import { ASSESSMENT_STEPS, AssessmentStepId } from '@/types/assessment';
import {
  CheckCircle2,
  AlertCircle,
  Zap,
  BookOpen,
  ShieldCheck,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

export const AssessmentLeftSidebar: React.FC = () => {
  const { language } = usePractice();
  const bn = language === 'bn';
  const {
    currentStep,
    setCurrentStep,
    mode,
    setMode,
    completionPercentage,
    totalAnsweredCount,
    completionStatus
  } = useAssessment();

  return (
    <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
      {/* Mode Switcher */}
      <div className="bg-card border border-border rounded-2xl p-3.5 shadow-subtle space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {bn ? 'অ্যাসেসমেন্ট মোড' : 'Assessment Mode'}
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {mode === 'quick' ? (bn ? 'কুইক' : 'Quick') : (bn ? 'বিস্তারিত' : 'Full')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 p-1 bg-secondary rounded-xl">
          <button
            type="button"
            onClick={() => setMode('quick')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'quick'
                ? 'bg-card text-foreground shadow-subtle font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>{bn ? 'কুইক মোড' : 'Quick Mode'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('comprehensive')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'comprehensive'
                ? 'bg-card text-foreground shadow-subtle font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span>{bn ? 'বিস্তারিত' : 'Full Mode'}</span>
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {mode === 'quick'
            ? (bn ? 'হাসপাতাল ব্যস্ত সময়ের জন্য ২৫-৩৫টি উচ্চ-প্রভাবশালী স্ক্রিনিং প্রশ্ন।' : 'Focused 25-35 high-yield screening questions for fast consultations.')
            : (bn ? 'সম্পূর্ণ ও গভীর ফাংশনাল নিউট্রিশন পর্যালোচনা (সমস্ত মডিউল অন্তর্ভুক্ত)।' : 'In-depth functional nutrition evaluation across all clinical domains.')}
        </p>
      </div>

      {/* Progress & Safety Banner */}
      <div className="bg-card border border-border rounded-2xl p-3.5 shadow-subtle space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">
            {bn ? 'সামগ্রিক অগ্রগতি' : 'Overall Progress'}
          </span>
          <span className="font-bold text-primary tabular-numbers">{completionPercentage}%</span>
        </div>

        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
          <span className="tabular-numbers">{bn ? `মোট উত্তর: ${totalAnsweredCount} টি` : `Total answered: ${totalAnsweredCount}`}</span>
          {completionStatus.clinical_safety_completed ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              {bn ? 'নিরাপত্তা সম্পন্ন' : 'Safety Complete'}
            </span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5" />
              {bn ? 'নিরাপত্তা বাকি' : 'Safety Pending'}
            </span>
          )}
        </div>
      </div>

      {/* Step Navigation List */}
      <div className="bg-card border border-border rounded-2xl p-2.5 shadow-subtle space-y-1">
        <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {bn ? 'অ্যাসেসমেন্ট ধাপসমূহ (১-৯)' : 'Assessment Steps (1-9)'}
        </div>

        {ASSESSMENT_STEPS.map((step) => {
          const isActive = currentStep === step.id;
          return (
            <button
              key={step.id}
              data-testid={`assessment-step-nav-${step.id}`}
              type="button"
              onClick={() => setCurrentStep(step.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between text-xs font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground font-bold shadow-subtle'
                  : 'text-foreground hover:bg-secondary'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    isActive
                      ? 'bg-primary-foreground text-primary'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {step.stepNumber}
                </span>
                <span className="truncate">{bn ? step.label_bn : step.label_en}</span>
              </div>
              <ChevronRight
                className={`h-3.5 w-3.5 flex-shrink-0 ${
                  isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
