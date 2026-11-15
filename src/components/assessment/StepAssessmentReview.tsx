'use client';

import React, { useState } from 'react';
import { usePractice } from '@/context/PracticeContext';
import { useAssessment } from '@/context/AssessmentContext';
import { prepareP2Handoff } from '@/engine/assessment/p2HandoffAdapter';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Edit3,
  Sparkles,
  Network,
  Activity,
  FileCheck,
  ChevronLeft
} from 'lucide-react';

export const StepAssessmentReview: React.FC = () => {
  const { patient, setActiveTab, language, executeP2Analysis } = usePractice();
  const bn = language === 'bn';
  const {
    currentStep,
    setCurrentStep,
    mode,
    data,
    ffqAnalysis,
    prakritiResult,
    vikritiResult,
    agniResult,
    masanumasikaAssessment,
    labEntries,
    completionPercentage,
    completionStatus,
    exportClinicalAssessment,
    markCompleted
  } = useAssessment();

  const [handoffSuccess, setHandoffSuccess] = useState<boolean>(false);
  const [safetyBlockedNotice, setSafetyBlockedNotice] = useState<string | null>(null);

  const isSafetyComplete = completionStatus.clinical_safety_completed;
  const isFullyComplete = isSafetyComplete && completionStatus.mandatory_sections_completed;

  const handleRunP2Analysis = () => {
    // 1. Safety review gate check
    if (!isSafetyComplete) {
      setSafetyBlockedNotice(
        bn
          ? `জরুরি নিরাপত্তা প্রশ্ন অসম্পূর্ণ: ${completionStatus.unanswered_critical_questions.join(', ')}। বিশ্লেষণ চালানোর পূর্বে নিরাপত্তা প্রশ্নের পর্যালোচনা সম্পন্ন করা আবশ্যক।`
          : `Required safety screening incomplete (${completionStatus.unanswered_critical_questions.join(', ')}). Critical safety review must not be bypassed.`
      );
      return;
    }

    setSafetyBlockedNotice(null);

    // 2. Export structured ClinicalAssessment contract
    const clinicalAssessment = exportClinicalAssessment();

    // 3. Mark completed ONLY if all mandatory sections and safety criteria are fulfilled.
    // Incomplete assessments strictly remain provisional!
    markCompleted(isFullyComplete);
    if (!isFullyComplete) {
      clinicalAssessment.completion.is_provisional = true;
    }

    // 4. Execute real P2 analysis with complete structured assessment into shared P2 state
    executeP2Analysis(clinicalAssessment);

    setHandoffSuccess(true);

    // 5. Navigate directly to Tab 3 (Root-Cause Intelligence & Matrix) after brief confirmation
    setTimeout(() => {
      setActiveTab('clinical_intelligence');
    }, 600);
  };

  const testedLabsCount = Object.values(labEntries).filter(e => e.status === 'previously_tested').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">
            {bn ? 'ধাপ ৯: ক্লিনিক্যাল অ্যাসেসমেন্ট পর্যালোচনা ও P2 হ্যান্ডঅফ' : 'Step 9: Clinical Assessment Review & P2 Handoff'}
          </h3>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {completionPercentage}% {bn ? 'সম্পন্ন' : 'Completed'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {bn
            ? 'সকল ধাপের সংগৃহীত তথ্য পর্যালোচনা করুন। "ক্লিনিক্যাল বিশ্লেষণ করুন" বাটনে ক্লিক করলে তথ্য P2 রুট-কজ ইন্টেলিজেন্স ইঞ্জিনে স্থানান্তরিত হবে।'
            : 'Review captured assessment findings. Clicking "Analyze Clinical Assessment" hands off structured data to the P2 Root-Cause Engine.'}
        </p>
      </div>

      {/* Completion Status Alert */}
      <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
        completionStatus.clinical_safety_completed
          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
          : 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400'
      }`}>
        {completionStatus.clinical_safety_completed ? (
          <ShieldCheck className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
        ) : (
          <ShieldAlert className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        )}
        <div className="min-w-0 flex-1 text-xs">
          <div className="font-bold text-sm">
            {completionStatus.clinical_safety_completed
              ? (bn ? 'নিরাপত্তা স্ক্রিনিং সম্পন্ন হয়েছে' : 'Clinical Safety Screening Complete')
              : (bn ? 'কিছু জরুরি নিরাপত্তা প্রশ্ন বাকি রয়েছে' : 'Required Clinical Safety Questions Pending')}
          </div>
          <p className="mt-1 leading-relaxed opacity-90">
            {completionStatus.clinical_safety_completed
              ? (bn ? 'ইনসুলিন, অ্যালার্জি ও ফিডিং রুটের উচ্চ-ঝুঁকিপূর্ণ শর্তাবলি যাচাই করা হয়েছে। ডাটা P2 বিশ্লেষণের জন্য প্রস্তুত।' : 'All high-risk insulin, allergy, and feeding route safety checks are verified. Eligible for root-cause analysis.')
              : (bn ? `জরুরি প্রশ্ন বাকি: ${completionStatus.unanswered_critical_questions.join(', ')}` : `Unanswered safety items: ${completionStatus.unanswered_critical_questions.join(', ')}`)}
          </p>
        </div>
      </div>

      {/* Structured Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Category & Demographics Card */}
        <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              {bn ? '১. জনমিতি ও জনসংখ্যা পথ' : '1. Demographics & Pathways'}
            </h4>
            <button
              type="button"
              onClick={() => setCurrentStep('step_category')}
              className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Edit3 className="h-3 w-3" />
              {bn ? 'সম্পাদনা' : 'Edit'}
            </button>
          </div>

          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{bn ? 'নাম ও বয়স:' : 'Name & Age:'}</span>
              <span className="font-bold text-foreground">{patient.name} ({patient.age}y, {patient.gender})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{bn ? 'উচ্চতা ও ওজন:' : 'Height & Weight:'}</span>
              <span className="font-semibold text-foreground">{patient.height_cm} cm, {patient.weight_kg} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">BMI & WHtR:</span>
              <span className="font-semibold text-foreground">{patient.calculated.bmi} (WHtR {patient.calculated.whtr})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{bn ? 'জনসংখ্যা গ্রুপ:' : 'Population Group:'}</span>
              <span className="font-bold text-primary">{patient.population_group}</span>
            </div>
          </div>
        </div>

        {/* 2. Safety & Allergies Card */}
        <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              {bn ? '২. নিরাপত্তা, ওষুধ ও অ্যালার্জি' : '2. Safety, Drugs & Allergies'}
            </h4>
            <button
              type="button"
              onClick={() => setCurrentStep('step_medical_history')}
              className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Edit3 className="h-3 w-3" />
              {bn ? 'সম্পাদনা' : 'Edit'}
            </button>
          </div>

          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{bn ? 'নিশ্চিত অ্যালার্জি:' : 'Confirmed Allergies:'}</span>
              <span className="font-bold text-rose-500">
                {patient.confirmed_allergies.length > 0 ? patient.confirmed_allergies.join(', ') : 'None'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{bn ? 'সক্রিয় ওষুধসমূহ:' : 'Active Medications:'}</span>
              <span className="font-semibold text-foreground truncate max-w-[160px]">
                {patient.active_medications.length > 0 ? patient.active_medications.join(', ') : 'None'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{bn ? 'ইনসুলিন স্ট্যাটাস:' : 'Insulin Therapy:'}</span>
              <span className="font-semibold text-foreground">
                {data.answers['safety_insulin_active'] === 'yes' ? 'Active Insulin' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{bn ? 'ফিডিং রুট:' : 'Feeding Route:'}</span>
              <span className="font-semibold text-foreground">{patient.feeding_status?.route || 'oral_standard'}</span>
            </div>
          </div>
        </div>

        {/* 3. 7-Day FFQ Dietary Patterns */}
        <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              {bn ? '৩. ৭ দিনের খাদ্য ফ্রিকোয়েন্সি (FFQ)' : '3. Seven-Day FFQ Patterns'}
            </h4>
            <button
              type="button"
              onClick={() => setCurrentStep('step_ffq')}
              className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Edit3 className="h-3 w-3" />
              {bn ? 'সম্পাদনা' : 'Edit'}
            </button>
          </div>

          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{bn ? 'উদ্ভিজ্জ বৈচিত্র্য সূচক:' : 'Plant Diversity Score:'}</span>
              <span className="font-bold text-emerald-600">{ffqAnalysis.summary.weekly_plant_diversity_score} / 8</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{bn ? 'দৈনিক ফল ও সবজি:' : 'Daily Fruit/Veg Servings:'}</span>
              <span className="font-semibold text-foreground">~{ffqAnalysis.summary.daily_fruit_veg_servings_est} serv/day</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{bn ? 'প্রক্রিয়াজাত খাবারের মাত্রা:' : 'Ultra-Processed Burden:'}</span>
              <span className="font-bold text-foreground">{ffqAnalysis.summary.ultra_processed_burden}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{bn ? 'টেবিলে বাড়তি কাঁচা লবণ:' : 'Raw Table Salt Added:'}</span>
              <span className="font-semibold text-foreground">
                {ffqAnalysis.summary.sodium_risk_flag ? 'Yes (High Sodium Risk)' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Ayurvedic Assessment Card */}
        <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              {bn ? '৪. আয়ুর্বেদিক প্রকৃতি ও অগ্নি' : '4. Prakriti, Vikriti & Agni'}
            </h4>
            <button
              type="button"
              onClick={() => setCurrentStep('step_ayurveda')}
              className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Edit3 className="h-3 w-3" />
              {bn ? 'সম্পাদনা' : 'Edit'}
            </button>
          </div>

          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{bn ? 'জন্মগত প্রকৃতি:' : 'Prakriti Constitution:'}</span>
              <span className="font-bold text-primary">
                {prakritiResult.primary_constitution.replace('_', '-').toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vata / Pitta / Kapha:</span>
              <span className="font-semibold text-foreground">
                {prakritiResult.vata_score}% / {prakritiResult.pitta_score}% / {prakritiResult.kapha_score}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{bn ? 'বর্তমান বিকৃতি:' : 'Active Vikriti Imbalance:'}</span>
              <span className="font-semibold text-amber-500">
                {vikritiResult.active_aggravations.length > 0 ? vikritiResult.active_aggravations.join(', ') : 'Balanced'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{bn ? 'পরিপাক অগ্নি:' : 'Digestive Agni:'}</span>
              <span className="font-bold text-foreground">{agniResult.name_en.split(' ')[0]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Special Population & Labs Summary Strip */}
      <div className="p-4 rounded-2xl border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-bold text-foreground">
            {masanumasikaAssessment
              ? (bn ? `গর্ভাবস্থা: মাস ${masanumasikaAssessment.pregnancy_month} (${masanumasikaAssessment.gestational_age_weeks} সপ্তাহ)` : `Pregnancy Month ${masanumasikaAssessment.pregnancy_month} (${masanumasikaAssessment.gestational_age_weeks} weeks)`)
              : (bn ? `সক্রিয় পাথওয়ে: ${patient.clinical_pathways?.join(', ')}` : `Active Pathways: ${patient.clinical_pathways?.join(', ')}`)}
          </span>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {bn ? `ল্যাবরেটরি রিপোর্ট এন্ট্রি: ${testedLabsCount}টি টেস্ট সম্পন্ন` : `Laboratory intake: ${testedLabsCount} biomarker test(s) documented`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCurrentStep('step_labs')}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <Edit3 className="h-3 w-3" />
          <span>{bn ? 'ল্যাব রিপোর্ট সম্পাদনা' : 'Edit Labs'}</span>
        </button>
      </div>

      {/* Big Action Button: Handoff to P2 Root-Cause Intelligence */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-purple-500/10 border-2 border-primary/20 space-y-3 text-center">
        <h4 className="text-sm font-bold text-foreground">
          {bn ? 'ক্লিনিক্যাল তথ্য রূপান্তর ও রুট-কজ ইন্টেলিজেন্স হ্যান্ডঅফ' : 'Clinical Data Handoff & Root-Cause Intelligence'}
        </h4>
        <p className="text-xs text-muted-foreground max-w-xl mx-auto leading-relaxed">
          {bn
            ? 'অ্যাসেসমেন্টের সমস্ত ডেটা (১৪ ডোমেন, ৭ দিনের এফএফকিউ, আয়ুর্বেদিক প্রকৃতি ও ল্যাব) পি২ ক্লিনিশিয়ান ডিসিশন সাপোর্ট ইঞ্জিনে স্থানান্তরিত হবে।'
            : 'Convert all assessment inputs into deterministic clinical observations and launch P2 Root-Cause Hypothesis Generation.'}
        </p>

        {safetyBlockedNotice && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center justify-between gap-2 max-w-lg mx-auto text-left">
            <span>⚠️ {safetyBlockedNotice}</span>
            <button
              type="button"
              onClick={() => setCurrentStep('step_medical_history')}
              className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[11px] font-bold hover:bg-amber-700 shrink-0"
            >
              {bn ? 'নিরাপত্তা প্রশ্নে যান' : 'Complete Safety Questions'}
            </button>
          </div>
        )}

        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={handleRunP2Analysis}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Network className="h-4 w-4" />
            <span>{bn ? 'ক্লিনিক্যাল বিশ্লেষণ করুন (Analyze Clinical Assessment)' : 'Analyze Clinical Assessment → Launch P2'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {handoffSuccess && (
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-1 mt-2 animate-bounce">
            <CheckCircle2 className="h-4 w-4" />
            <span>{bn ? 'হ্যান্ডঅফ সফল! P2 ট্যাবে স্থানান্তরিত হচ্ছে...' : 'Handoff successful! Navigating to Root-Cause Intelligence...'}</span>
          </div>
        )}
      </div>

      {/* Bottom Back Button */}
      <div className="flex justify-start pt-2">
        <button
          type="button"
          onClick={() => setCurrentStep('step_labs')}
          className="px-4 py-2 border rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition-all flex items-center gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{bn ? 'পূর্ববর্তী: ল্যাবরেটরি ডাটা' : 'Previous: Laboratory Intake'}</span>
        </button>
      </div>
    </div>
  );
};
