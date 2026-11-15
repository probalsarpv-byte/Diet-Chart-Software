'use client';

import React, { useState } from 'react';
import { usePractice } from '@/context/PracticeContext';
import { useAssessment } from '@/context/AssessmentContext';
import {
  Baby,
  Heart,
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Info,
  CheckCircle2
} from 'lucide-react';

export const StepPopulationSpecific: React.FC = () => {
  const { patient, language } = usePractice();
  const bn = language === 'bn';
  const {
    masanumasikaAssessment,
    updatePregnancyGestational,
    populationData,
    setPopulationData,
    setCurrentStep
  } = useAssessment();

  const primaryGroup = patient.population_group || 'adult_standard';
  const pathways = patient.clinical_pathways || [];

  const isPregnancy = primaryGroup === 'pregnancy';
  const isPediatric = primaryGroup === 'pediatric' || patient.age < 12;
  const isOncology = primaryGroup === 'oncology' || pathways.includes('oncology');
  const isRenal = primaryGroup === 'renal' || pathways.includes('renal');
  const isUnderweight = pathways.includes('underweight_restoration');
  const isPostOp = pathways.includes('surgical_postoperative');

  // Pregnancy local state
  const [gestWeeks, setGestWeeks] = useState(masanumasikaAssessment?.gestational_age_weeks || 16);
  const [gestDays, setGestDays] = useState(masanumasikaAssessment?.gestational_age_days || 0);

  const handleGestWeeksChange = (w: number) => {
    setGestWeeks(w);
    updatePregnancyGestational(w, gestDays, masanumasikaAssessment?.maternal_risks);
  };

  const handleGestDaysChange = (d: number) => {
    setGestDays(d);
    updatePregnancyGestational(gestWeeks, d, masanumasikaAssessment?.maternal_risks);
  };

  const handleMaternalRiskToggle = (riskKey: string) => {
    if (!masanumasikaAssessment) return;
    const current = { ...masanumasikaAssessment.maternal_risks };
    (current as any)[riskKey] = !(current as any)[riskKey];
    updatePregnancyGestational(gestWeeks, gestDays, current);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-foreground">
          {bn ? 'ধাপ ৭: বিশেষ জনসংখ্যা ও ক্লিনিক্যাল পাথওয়ে মডিউল' : 'Step 7: Specialized Population & Clinical Pathway Modules'}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {bn
            ? 'রোগীর নির্দিষ্ট জনসংখ্যা গ্রুপ ও সক্রিয় পাথওয়ের ওপর ভিত্তি করে বিশেষায়িত মূল্যায়ন প্রশ্ন ও নির্দেশিকা।'
            : 'Population-specific clinical questions and evidence frameworks matching the patient\'s active clinical category.'}
        </p>
      </div>

      {/* 1. PREGNANCY: Masanumasika Garbhini Paricharya Framework */}
      {isPregnancy && masanumasikaAssessment && (
        <div className="bg-card border-2 border-primary/20 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                  {bn ? 'আয়ুর্বেদিক মাসানুমাসিক গর্ভিণী পরিচর্যা' : 'Ayurvedic Masanumasika Paricharya'}
                </span>
                <span className="text-xs font-bold text-primary">
                  {bn ? `মাস: ${masanumasikaAssessment.pregnancy_month}ম মাস` : `Pregnancy Month: ${masanumasikaAssessment.pregnancy_month}`}
                </span>
              </div>
              <h4 className="text-sm font-bold text-foreground mt-1">
                {bn ? 'মহাসূত্র: চরক সংহিতা ও সুশ্রুত সংহিতা মাসভিত্তিক পুষ্টি' : 'Classical Month-Wise Gestational Nutrition Framework'}
              </h4>
            </div>
            <div className="text-xs font-semibold text-muted-foreground">
              {bn ? `ট্রাইমেস্টার ${masanumasikaAssessment.trimester}` : `Trimester ${masanumasikaAssessment.trimester}`}
            </div>
          </div>

          {/* Gestational Age Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-3.5 bg-muted/40 rounded-xl">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                {bn ? 'গর্ভকালীন বয়স (সম্পূর্ণ সপ্তাহ)' : 'Gestational Age (Completed Weeks)'}
              </label>
              <input
                type="number"
                min="1"
                max="42"
                value={gestWeeks}
                onChange={(e) => handleGestWeeksChange(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                {bn ? 'অতিরিক্ত দিন (Days)' : 'Additional Days (0 - 6)'}
              </label>
              <input
                type="number"
                min="0"
                max="6"
                value={gestDays}
                onChange={(e) => handleGestDaysChange(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div className="flex flex-col justify-center">
              <span className="text-[10px] text-muted-foreground font-semibold">
                {bn ? 'গণনাকৃত গর্ভ মাস:' : 'Derived Pregnancy Month:'}
              </span>
              <span className="text-sm font-bold text-primary">
                {bn ? `মাস ${masanumasikaAssessment.pregnancy_month} (Month ${masanumasikaAssessment.pregnancy_month})` : `Month ${masanumasikaAssessment.pregnancy_month}`}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Classical Source: {masanumasikaAssessment.current_month_guidance.classical_source.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Classical Month Details Card */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
            <div>
              <div className="text-[10px] font-bold text-primary uppercase tracking-wider">
                {bn ? 'ভ্রূণের বিকাশ ও মাতৃশারীরিক লক্ষ্য' : 'Developmental & Maternal Physiological Focus'}
              </div>
              <p className="text-xs text-foreground font-medium mt-1 leading-relaxed">
                {bn
                  ? masanumasikaAssessment.current_month_guidance.developmental_focus_bn
                  : masanumasikaAssessment.current_month_guidance.developmental_focus_en}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {bn
                  ? masanumasikaAssessment.current_month_guidance.maternal_focus_bn
                  : masanumasikaAssessment.current_month_guidance.maternal_focus_en}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-primary/10">
              {/* Traditional Foods */}
              <div>
                <span className="text-[11px] font-bold text-foreground block mb-1">
                  {bn ? 'প্রাকৃতিক ঐতিহ্যবাহী খাদ্য (আয়ুর্বেদিক নীতি):' : 'Traditional Classical Foods (Ayurvedic Principles):'}
                </span>
                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                  {(bn
                    ? masanumasikaAssessment.current_month_guidance.recommended_traditional_foods_bn
                    : masanumasikaAssessment.current_month_guidance.recommended_traditional_foods_en
                  ).map((food, i) => (
                    <li key={i}>{food}</li>
                  ))}
                </ul>
              </div>

              {/* Bangladeshi Cultural Foods */}
              <div>
                <span className="text-[11px] font-bold text-foreground block mb-1">
                  {bn ? 'বাংলাদেশি খাদ্য বিকল্প (Bangladeshi Cultural Foods):' : 'Culturally Familiar Bangladeshi Alternatives:'}
                </span>
                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                  {(bn
                    ? masanumasikaAssessment.current_month_guidance.bangladeshi_cultural_substitutes_bn
                    : masanumasikaAssessment.current_month_guidance.bangladeshi_cultural_substitutes_en
                  ).map((food, i) => (
                    <li key={i}>{food}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Strict Safety Exclusions */}
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs">
              <span className="font-bold flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {bn ? 'কঠোর ক্লিনিক্যাল সতর্কতা ও নিষিদ্ধ উপাদান:' : 'Strict Clinical Safety & Contraindications:'}
              </span>
              <div className="flex flex-wrap gap-2 text-[11px]">
                {(bn
                  ? masanumasikaAssessment.current_month_guidance.restricted_or_unsafe_items_bn
                  : masanumasikaAssessment.current_month_guidance.restricted_or_unsafe_items_en
                ).map((item, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-card/60 border border-rose-500/20">
                    ✕ {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Maternal Risks Checkboxes */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold text-foreground uppercase tracking-wider block">
              {bn ? 'মাতৃকালীন ক্লিনিক্যাল ঝুঁকি মূল্যায়ন' : 'Maternal Clinical Risk Screening'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { key: 'gestational_diabetes', label_en: 'Gestational Diabetes (GDM)', label_bn: 'জেস্টেশনাল ডায়াবেটিস (GDM)' },
                { key: 'gestational_hypertension', label_en: 'Gestational Hypertension / Edema', label_bn: 'গর্ভকালীন উচ্চ রক্তচাপ বা শোথ' },
                { key: 'severe_morning_sickness_nausea', label_en: 'Severe Nausea / Hyperemesis', label_bn: 'তীব্র বমি ভাব বা ক্ষুধামন্দা' },
              ].map(r => {
                const isChecked = (masanumasikaAssessment.maternal_risks as any)[r.key];
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => handleMaternalRiskToggle(r.key)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                      isChecked
                        ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span>{bn ? r.label_bn : r.label_en}</span>
                    <div className={`h-4 w-4 rounded-md flex items-center justify-center flex-shrink-0 ${
                      isChecked ? 'bg-amber-500 text-white' : 'border border-muted-foreground/30'
                    }`}>
                      {isChecked && <CheckCircle2 className="h-3 w-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. PEDIATRIC MODULE */}
      {isPediatric && (
        <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Baby className="h-4 w-4 text-primary" />
            {bn ? 'শিশু পুষ্টি ও বৃদ্ধি মূল্যায়ন (<১২ বছর)' : 'Pediatric Nutrition & Growth (<12 Years)'}
          </h4>
          <p className="text-xs text-muted-foreground">
            {bn
              ? 'শিশুর বৃদ্ধি রেখা, বুকের দুধ ও পরিপূরক খাবার গ্রহণের ইতিহাস এবং খাওয়ানোর কষ্ট সম্পর্কিত তথ্য রেকর্ড করুন।'
              : 'Assess age-adjusted feeding history, complementary feeding, and caregiver-reported growth.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border bg-muted/40">
              <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                {bn ? 'খাবারের প্রতি তীব্র অনীহা বা কষ্ট' : 'Feeding Difficulties / Picky Eating'}
              </span>
              <p className="text-xs text-foreground font-medium">
                {bn ? 'বয়সোচিত ক্যালোরি ও প্রোটিন নিশ্চিতকরণে বিশেষ খাবার টেক্সচার সমন্বয় প্রয়োজন।' : 'Age-appropriate nutrient density and food texture pacing are required.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. ONCOLOGY MODULE */}
      {isOncology && (
        <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Activity className="h-4 w-4 text-rose-500" />
            {bn ? 'অনকোলজি ক্লিনিক্যাল পুষ্টি মূল্যায়ন' : 'Oncology Clinical Nutrition Evaluation'}
          </h4>
          <p className="text-xs text-muted-foreground">
            {bn
              ? 'ক্যান্সার থেরাপির পার্শ্বপ্রতিক্রিয়া (মুখের ঘা, স্বাদের পরিবর্তন, বমি ভাব) এবং পেশি অপচয় রোধে পুষ্টি পরিকল্পনা।'
              : 'Mitigate chemotherapy/radiotherapy taste changes (dysgeusia), oral mucositis, and involuntary muscle loss.'}
          </p>
        </div>
      )}

      {/* 4. RENAL MODULE */}
      {isRenal && (
        <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            {bn ? 'কিডনি ও রেনাল পুষ্টি ব্যবস্থাপনা' : 'Renal / CKD Clinical Nutrition Management'}
          </h4>
          <p className="text-xs text-muted-foreground">
            {bn
              ? 'ডায়ালাইসিস স্ট্যাটাস, পটাশিয়াম, ফসফরাস এবং ফ্লুইড সীমাবদ্ধতার ওপর ভিত্তি করে ডায়েট সীমাবদ্ধতা নির্ধারিত হবে।'
              : 'Precision restrictions based on dialysis status, serum potassium, phosphorus, and prescribed fluid limits.'}
          </p>
        </div>
      )}

      {/* Fallback if no specialized module is active */}
      {!isPregnancy && !isPediatric && !isOncology && !isRenal && !isUnderweight && !isPostOp && (
        <div className="p-8 text-center bg-card border rounded-2xl text-muted-foreground text-xs">
          {bn
            ? 'বর্তমান রোগীর জন্য কোনো অতিরিক্ত বিশেষায়িত জনসংখ্যা মডিউল প্রয়োজন নেই (সাধারণ প্রাপ্তবয়স্ক মেটাবলিক পাথওয়ে সক্রিয়)।'
            : 'No specialized population module required for standard adult metabolic pathway.'}
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t">
        <button
          type="button"
          onClick={() => setCurrentStep('step_ayurveda')}
          className="px-4 py-2 border rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition-all flex items-center gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{bn ? 'পূর্ববর্তী: আয়ুর্বেদিক মূল্যায়ন' : 'Previous: Ayurvedic Assessment'}</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentStep('step_labs')}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-all flex items-center gap-1.5"
        >
          <span>{bn ? 'পরবর্তী: ল্যাবরেটরি ডাটা এন্ট্রি' : 'Next: Laboratory Intake'}</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
