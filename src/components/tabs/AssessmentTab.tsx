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
  FileCheck,
  Link as LinkIcon,
  GitCompare
} from 'lucide-react';

export const AssessmentTab: React.FC = () => {
  const {
    patient,
    language,
    setIsInvitationModalOpen,
    setIsReconciliationModalOpen,
    stagedSubmissionsCount
  } = usePractice();
  const bn = language === 'bn';

  const {
    currentStep,
    saveDraft,
    resetAssessment,
    totalAnsweredCount,
    data
  } = useAssessment();

  const [showMobileSnapshot, setShowMobileSnapshot] = React.useState(false);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Action & Status Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold shadow-subtle">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-foreground tracking-tight">
                {bn ? 'অ্যাডাপ্টিভ ফাংশনাল নিউট্রিশন অ্যাসেসমেন্ট' : 'Adaptive Functional Nutrition Assessment'}
              </h2>
              {data.completed && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-[10px] flex items-center gap-1 border border-primary/20">
                  <CheckCircle2 className="h-3 w-3" />
                  {bn ? 'সম্পন্ন' : 'Completed'}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {bn
                ? `রোগী: ${patient.name || 'Anonymous'} (${patient.age} বছর, ${patient.gender === 'female' ? 'নারী' : 'পুরুষ'}) • উত্তর প্রদান: ${totalAnsweredCount} টি`
                : `Patient: ${patient.name || 'Anonymous'} (${patient.age}y, ${patient.gender}) • Answered: ${totalAnsweredCount} fields`}
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* R3 Remote Intake Link Generator */}
          <button
            type="button"
            onClick={() => setIsInvitationModalOpen(true)}
            data-testid="btn-remote-intake-link"
            className="px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors flex items-center gap-1.5 shadow-subtle"
            title={bn ? 'রোগীর জন্য রিমোট ইনটেক লিংক তৈরি করুন' : 'Generate remote intake link for patient'}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            <span>{bn ? 'রিমোট ইনটেক' : 'Remote Intake'}</span>
          </button>

          {/* R3 Staged Queue & Reconciliation */}
          <button
            type="button"
            onClick={() => setIsReconciliationModalOpen(true)}
            data-testid="btn-staged-queue"
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-subtle ${
              stagedSubmissionsCount > 0
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/40 animate-pulse'
                : 'border-border bg-card text-foreground hover:bg-secondary'
            }`}
            title={bn ? 'সেলফ-অ্যাসেসমেন্ট স্ট্যাজিং কিউ ও রিকনসিলিয়েশন' : 'Staged patient submissions & diff reconciliation'}
          >
            <GitCompare className="h-3.5 w-3.5 text-amber-500" />
            <span>{bn ? 'স্টেজড কিউ' : 'Staged Queue'}</span>
            {stagedSubmissionsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {stagedSubmissionsCount}
              </span>
            )}
          </button>

          {/* Mobile Snapshot Toggle Button */}
          <button
            type="button"
            onClick={() => setShowMobileSnapshot(!showMobileSnapshot)}
            className="lg:hidden px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-secondary transition-colors flex items-center gap-1.5 shadow-subtle"
          >
            <span>{showMobileSnapshot ? (bn ? 'স্ন্যাপশট লুকান' : 'Hide Snapshot') : (bn ? 'লাইভ স্ন্যাপশট' : 'Live Snapshot')}</span>
          </button>

          <button
            type="button"
            onClick={saveDraft}
            className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-secondary transition-colors flex items-center gap-1.5 shadow-subtle"
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
            className="px-3 py-1.5 rounded-xl border border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{bn ? 'রিসেট' : 'Reset'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Expandable Snapshot Drawer */}
      {showMobileSnapshot && (
        <div className="lg:hidden p-4 rounded-2xl bg-card border border-border shadow-dropdown animate-in fade-in duration-150">
          <AssessmentRightSnapshot />
        </div>
      )}

      {/* 3-Column Clinical Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Step Navigation & Mode */}
        <AssessmentLeftSidebar />

        {/* Center Workspace: Current Step View */}
        <div className="flex-1 min-w-0 bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-subtle w-full">
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

        {/* Right Column: Live Clinical Snapshot (Desktop) */}
        <div className="hidden lg:block">
          <AssessmentRightSnapshot />
        </div>
      </div>
    </div>
  );
};
