'use client';

import React from 'react';
import { usePractice } from '@/context/PracticeContext';
import { useAssessment } from '@/context/AssessmentContext';
import { AssessmentLeftSidebar } from '@/components/assessment/AssessmentLeftSidebar';
import { AssessmentRightSnapshot } from '@/components/assessment/AssessmentRightSnapshot';
import { StepCategoryPathways } from '@/components/assessment/StepCategoryPathways';
import { StepDemographicsVitals } from '@/components/assessment/StepDemographicsVitals';
import { StepHistorySafety } from '@/components/assessment/StepHistorySafety';
import { StepFunctionalDomains } from '@/components/assessment/StepFunctionalDomains';
import { StepFoodFrequency } from '@/components/assessment/StepFoodFrequency';
import { StepAyurvedicAssessment } from '@/components/assessment/StepAyurvedicAssessment';
import { StepPopulationSpecific } from '@/components/assessment/StepPopulationSpecific';
import { StepLaboratoryIntake } from '@/components/assessment/StepLaboratoryIntake';
import { StepAssessmentReview } from '@/components/assessment/StepAssessmentReview';
import {
  ClipboardList,
  Save,
  RotateCcw,
  CheckCircle2,
  FileCheck
} from 'lucide-react';

export const AssessmentTab: React.FC = () => {
  const { patient, language } = usePractice();
  const bn = language === 'bn';

  const {
    currentStep,
    saveDraft,
    resetAssessment,
    totalAnsweredCount,
    data
  } = useAssessment();

  return (
    <div className="space-y-6 pb-16">
      {/* Top Action & Status Bar */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                ? `রোগী: ${patient.name || 'Anonymous'} (${patient.age} বছর, ${patient.gender === 'female' ? 'নারী' : 'পুরুষ'}) • উত্তর প্রদান: ${totalAnsweredCount} টি`
                : `Patient: ${patient.name || 'Anonymous'} (${patient.age}y, ${patient.gender}) • Answered: ${totalAnsweredCount} fields`}
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={saveDraft}
            className="px-3 py-1.5 rounded-xl border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Save className="h-3.5 w-3.5 text-primary" />
            <span>{bn ? 'ড্রাফট সেভ' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm(bn ? 'আপনি কি নিশ্চিত যে বর্তমান অ্যাসেসমেন্ট রিসেট করতে চান?' : 'Are you sure you want to reset the current assessment?')) {
                resetAssessment();
              }
            }}
            className="px-3 py-1.5 rounded-xl border border-destructive/20 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{bn ? 'রিসেট' : 'Reset'}</span>
          </button>
        </div>
      </div>

      {/* 3-Column Clinical Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Step Navigation & Mode */}
        <AssessmentLeftSidebar />

        {/* Center Workspace: Current Step View */}
        <div className="flex-1 min-w-0 bg-card border rounded-2xl p-5 sm:p-6 shadow-sm w-full">
          {currentStep === 'step_category' && <StepCategoryPathways />}
          {currentStep === 'step_demographics' && <StepDemographicsVitals />}
          {currentStep === 'step_medical_history' && <StepHistorySafety />}
          {currentStep === 'step_functional' && <StepFunctionalDomains />}
          {currentStep === 'step_ffq' && <StepFoodFrequency />}
          {currentStep === 'step_ayurveda' && <StepAyurvedicAssessment />}
          {currentStep === 'step_population' && <StepPopulationSpecific />}
          {currentStep === 'step_labs' && <StepLaboratoryIntake />}
          {currentStep === 'step_review' && <StepAssessmentReview />}
        </div>

        {/* Right Column: Live Clinical Snapshot */}
        <AssessmentRightSnapshot />
      </div>
    </div>
  );
};
