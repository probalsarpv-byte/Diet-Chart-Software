'use client';

import React from 'react';
import { usePractice } from '@/context/PracticeContext';
import { useAssessment } from '@/context/AssessmentContext';
import { ActivityLevel } from '@/types/index';
import {
  Scale,
  Ruler,
  User,
  Heart,
  ChevronLeft,
  ChevronRight,
  Calculator,
  AlertCircle
} from 'lucide-react';

export const StepDemographicsVitals: React.FC = () => {
  const { patient, updatePatient, language } = usePractice();
  const { setCurrentStep, setAnswer, functionalAnswers } = useAssessment();
  const bn = language === 'bn';

  const isPediatric = patient.age < 12;

  const handleNumChange = (field: string, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      updatePatient({ [field]: num });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-foreground">
          {bn ? 'ধাপ ২: জনমিতি ও শারীরিক গঠন পরিমাপ' : 'Step 2: Demographics & Anthropometrics'}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {bn
            ? 'রোগীর মৌলিক জনমিতি, উচ্চতা, ওজন এবং কোমর পরিধি রেকর্ড করুন। সিস্টেম স্বয়ংক্রিয়ভাবে বিএমআই, বিএমআর ও ডব্লিউএইচটিআর হিসাব করবে।'
            : 'Record baseline demographics and physical vitals. BMI, BMR, and Waist-to-Height Ratio (WHtR) are calculated deterministically.'}
        </p>
      </div>

      {/* Basic Demographics */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          {bn ? 'ব্যক্তিগত তথ্য' : 'Patient Information'}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground">
              {bn ? 'রোগীর পুরো নাম' : 'Full Name'}
            </label>
            <input
              type="text"
              value={patient.name}
              onChange={(e) => updatePatient({ name: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-xs rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground">
              {bn ? 'বয়স (বছর)' : 'Age (years)'}
            </label>
            <input
              type="number"
              value={patient.age || ''}
              onChange={(e) => handleNumChange('age', e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground">
              {bn ? 'জৈবিক লিঙ্গ' : 'Biological Gender'}
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => updatePatient({ gender: 'male' })}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                  patient.gender === 'male'
                    ? 'border-primary bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {bn ? 'পুরুষ' : 'Male'}
              </button>
              <button
                type="button"
                onClick={() => updatePatient({ gender: 'female' })}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                  patient.gender === 'female'
                    ? 'border-primary bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {bn ? 'নারী' : 'Female'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Anthropometric Measurements */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" />
          {bn ? 'শারীরিক মাপ ও পরিধি' : 'Physical Vitals & Body Size'}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground">
              {bn ? 'উচ্চতা (সেন্টিমিটার)' : 'Height (cm)'}
            </label>
            <input
              type="number"
              value={patient.height_cm || ''}
              onChange={(e) => handleNumChange('height_cm', e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground">
              {bn ? 'বর্তমান ওজন (কেজি)' : 'Current Weight (kg)'}
            </label>
            <input
              type="number"
              value={patient.weight_kg || ''}
              onChange={(e) => handleNumChange('weight_kg', e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground">
              {bn ? 'কোমর পরিধি (সেন্টিমিটার)' : 'Waist Circumference (cm)'}
            </label>
            <input
              type="number"
              value={patient.waist_cm || ''}
              onChange={(e) => handleNumChange('waist_cm', e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>

        {/* Physical Activity Level */}
        <div className="pt-2">
          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
            {bn ? 'শারীরিক পরিশ্রমের মাত্রা (PAL)' : 'Physical Activity Level (PAL)'}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { id: 'sedentary', label_en: 'Sedentary (1.2)', label_bn: 'বসে কাজ (১.২)' },
              { id: 'light', label_en: 'Light Active (1.375)', label_bn: 'হালকা পরিশ্রম (১.৩৭৫)' },
              { id: 'moderate', label_en: 'Moderate (1.55)', label_bn: 'মাঝারি পরিশ্রম (১.৫৫)' },
              { id: 'very_active', label_en: 'Very Active (1.725)', label_bn: 'ভারী পরিশ্রম (১.৭২৫)' },
            ].map((act) => (
              <button
                key={act.id}
                type="button"
                onClick={() => updatePatient({ activity_level: act.id as ActivityLevel })}
                className={`py-2 px-2.5 text-xs font-semibold rounded-xl border text-center transition-all ${
                  patient.activity_level === act.id
                    ? 'border-primary bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {bn ? act.label_bn : act.label_en}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Derived Anthropometric Indices */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          {bn ? 'হিসাবকৃত ক্লিনিক্যাল ইনডেক্স' : 'Calculated Clinical Indices'}
        </h4>

        {isPediatric ? (
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs">
            {bn
              ? 'শিশু রোগীর জন্য প্রাপ্তবয়স্কদের সাধারণ BMI ক্যাটাগরি প্রযোজ্য নয়। বয়সের প্রেক্ষিতে বৃদ্ধি রেখা (Growth Percentile) অনুসরণ করা হবে।'
              : 'Pediatric patient (<12y): Adult BMI cutoff categories are bypassed in favor of age-adjusted growth references.'}
          </div>
        ) : null}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-muted/60 border">
            <div className="text-[10px] text-muted-foreground font-semibold">BMI (kg/m²)</div>
            <div className={`text-base font-bold mt-0.5 ${
              patient.calculated.bmi >= 25 ? 'text-rose-500' : 'text-emerald-500'
            }`}>
              {patient.calculated.bmi}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {patient.calculated.bmi >= 25 ? 'Overweight / Obese' : 'Normal Range'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/60 border">
            <div className="text-[10px] text-muted-foreground font-semibold">WHtR (Waist/Height)</div>
            <div className={`text-base font-bold mt-0.5 ${
              patient.calculated.whtr >= 0.5 ? 'text-amber-500' : 'text-emerald-500'
            }`}>
              {patient.calculated.whtr}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {patient.calculated.whtr >= 0.5 ? 'Central Adiposity' : 'Healthy Ratio'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/60 border">
            <div className="text-[10px] text-muted-foreground font-semibold">Estimated BMR</div>
            <div className="text-base font-bold text-foreground mt-0.5">
              {patient.calculated.bmr} kcal
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Mifflin-St Jeor Floor
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/60 border">
            <div className="text-[10px] text-muted-foreground font-semibold">Target Energy</div>
            <div className="text-base font-bold text-primary mt-0.5">
              {patient.calculated.target_calories} kcal
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              PAL adjusted
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <button
          type="button"
          onClick={() => setCurrentStep('step_category')}
          className="px-4 py-2 border rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition-all flex items-center gap-1.5"
        >
          <span>←</span>
          <span>{bn ? 'পূর্ববর্তী: ক্যাটাগরি' : 'Previous: Categories'}</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentStep('step_medical_history')}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-all flex items-center gap-1.5"
        >
          <span>{bn ? 'পরবর্তী: ইতিহাস ও নিরাপত্তা' : 'Next: History & Safety'}</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
