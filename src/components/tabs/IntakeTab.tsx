'use client';

import React from 'react';
import { usePractice } from '@/context/PracticeContext';
import { 
  User, 
  Scale, 
  HeartPulse, 
  Flame, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import { ACTIVITY_FACTORS } from '@/engine/anthropometrics';
import { ActivityLevel, AgniType } from '@/types';

export const IntakeTab: React.FC = () => {
  const { patient, updatePatient, updateLabs, updateGutProfile, language } = usePractice();
  const { calculated, labs, gut_profile } = patient;

  const bn = language === 'bn';

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Patient Demographics & Anthropometrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Form Inputs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Basic Demographic Card */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-3 text-foreground font-semibold text-sm">
              <User className="h-4 w-4 text-primary" />
              <span>{bn ? 'রোগীর প্রাথমিক তথ্য' : 'Patient Information'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'রোগীর পূর্ণ নাম' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={patient.name}
                  onChange={e => updatePatient({ name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="e.g. Mrs. Nasreen Akhter"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'বয়স (বছর)' : 'Age (Years)'}
                </label>
                <input
                  type="number"
                  value={patient.age || ''}
                  onChange={e => updatePatient({ age: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'লিঙ্গ' : 'Gender'}
                </label>
                <select
                  value={patient.gender}
                  onChange={e => updatePatient({ gender: e.target.value as 'male' | 'female' })}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="female">{bn ? 'মহিলা (Female)' : 'Female'}</option>
                  <option value="male">{bn ? 'পুরুষ (Male)' : 'Male'}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'মোবাইল নম্বর' : 'Phone'}
                </label>
                <input
                  type="text"
                  value={patient.phone}
                  onChange={e => updatePatient({ phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="017xxxxxxxx"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'ভিজিটের তারিখ' : 'Visit Date'}
                </label>
                <input
                  type="date"
                  value={patient.visit_date}
                  onChange={e => updatePatient({ visit_date: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'বর্তমান ফেজ' : 'Care Phase'}
                </label>
                <select
                  value={patient.current_phase}
                  onChange={e => updatePatient({ current_phase: Number(e.target.value) as 1 | 2 | 3 | 4 })}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value={1}>{bn ? 'Phase 1: গাট রিসেট ও এলিমিনেশন' : 'Phase 1: Gut Reset'}</option>
                  <option value={2}>{bn ? 'Phase 2: মেটাবলিক রিবিল্ড' : 'Phase 2: Metabolic Rebuild'}</option>
                  <option value={3}>{bn ? 'Phase 3: খাদ্য পুনঃপ্রবর্তন' : 'Phase 3: Reintroduction'}</option>
                  <option value={4}>{bn ? 'Phase 4: লাইফস্টাইল রক্ষণাবেক্ষণ' : 'Phase 4: Maintenance'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Anthropometrics Input Card */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Scale className="h-4 w-4 text-primary" />
                <span>{bn ? 'অ্যানথ্রোপোমেট্রিক্স ও শারীরিক পরিমাপ' : 'Anthropometrics & Measurements'}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {bn ? 'Mifflin-St Jeor & Devine সমীকরণ' : 'Mifflin-St Jeor & Devine Equation'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'উচ্চতা (সেমি)' : 'Height (cm)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={patient.height_cm || ''}
                    onChange={e => updatePatient({ height_cm: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                    {Math.floor(patient.height_cm / 30.48)}&apos;{Math.round((patient.height_cm % 30.48) / 2.54)}&quot;
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'বর্তমান ওজন (কেজি)' : 'Current Weight (kg)'}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={patient.weight_kg || ''}
                  onChange={e => updatePatient({ weight_kg: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'কোমরের মাপ (সেমি)' : 'Waist Circumference (cm)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={patient.waist_cm || ''}
                    onChange={e => updatePatient({ waist_cm: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                    ~{Math.round(patient.waist_cm / 2.54)} inch
                  </span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'দৈনিক শারীরিক কার্যকলাপের স্তর (Physical Activity)' : 'Activity Level'}
                </label>
                <select
                  value={patient.activity_level}
                  onChange={e => updatePatient({ activity_level: e.target.value as ActivityLevel })}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {Object.entries(ACTIVITY_FACTORS).map(([key, item]) => (
                    <option key={key} value={key}>
                      {bn ? item.label_bn : item.label_en} ({item.factor}x)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'দৈনিক ঘুম (ঘণ্টা)' : 'Daily Sleep (Hours)'}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={patient.sleep_hours || ''}
                  onChange={e => updatePatient({ sleep_hours: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right 1 Col: Live Calculated Cards & Safety Floor */}
        <div className="space-y-4">
          
          {/* BMR-Safe Calorie Floor Banner */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-500 font-semibold text-xs mb-1">
              <ShieldAlert className="h-4 w-4" />
              <span>{bn ? 'BMR-নিরাপদ ক্যালোরি ফ্লোর গ্যারান্টি' : 'BMR-Safe Calorie Floor'}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {bn 
                ? 'থাইরয়েড ফাংশন ও বেসাল মেটাবলিক রেট অক্ষুণ্ণ রাখতে ক্যালোরি লক্ষ্য কখনই BMR এর নিচে নামবে না।' 
                : 'Deficit is strictly clamped at or above BMR to prevent metabolic adaptation and thyroid down-regulation.'}
            </p>
            <div className="flex items-baseline justify-between pt-2 border-t border-emerald-500/20">
              <span className="text-xs font-medium">{bn ? 'নিরাপদ দৈনিক ক্যালোরি:' : 'Target Intake:'}</span>
              <span className="text-lg font-bold text-emerald-500">{calculated.target_calories} kcal</span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border rounded-xl p-3">
              <div className="text-[11px] text-muted-foreground">{bn ? 'বিএমআই (BMI)' : 'BMI'}</div>
              <div className="text-xl font-bold mt-0.5">{calculated.bmi}</div>
              <div className="text-[10px] text-amber-500 font-medium truncate">
                {bn ? calculated.bmi_category_bn : calculated.bmi_category_en}
              </div>
            </div>

            <div className="bg-card border rounded-xl p-3">
              <div className="text-[11px] text-muted-foreground">{bn ? 'কোমর-উচ্চতা অনুপাত (WHtR)' : 'WHtR Ratio'}</div>
              <div className="text-xl font-bold mt-0.5">{calculated.whtr}</div>
              <div className={`text-[10px] font-medium truncate ${calculated.whtr >= 0.6 ? 'text-rose-500' : 'text-amber-500'}`}>
                {calculated.whtr >= 0.6 ? (bn ? 'ভিসেরাল ফ্যাট ঝুঁকি' : 'High Visceral Risk') : (bn ? 'স্বাভাবিক' : 'Normal')}
              </div>
            </div>

            <div className="bg-card border rounded-xl p-3">
              <div className="text-[11px] text-muted-foreground">{bn ? 'আদর্শ ওজন (IBW)' : 'Ideal BW (Devine)'}</div>
              <div className="text-lg font-bold mt-0.5">{calculated.ibw_kg} kg</div>
              <div className="text-[10px] text-muted-foreground">
                {bn ? `এডজাস্টেড: ${calculated.adjusted_bw_kg}kg` : `Adjusted: ${calculated.adjusted_bw_kg}kg`}
              </div>
            </div>

            <div className="bg-card border rounded-xl p-3">
              <div className="text-[11px] text-muted-foreground">{bn ? 'বেসাল মেটাবলিজম (BMR)' : 'Basal BMR'}</div>
              <div className="text-lg font-bold mt-0.5">{calculated.bmr} kcal</div>
              <div className="text-[10px] text-muted-foreground">
                {bn ? `টিডিইই: ${calculated.tdee} kcal` : `TDEE: ${calculated.tdee} kcal`}
              </div>
            </div>
          </div>

          {/* Target Macro Breakdown */}
          <div className="bg-card border rounded-xl p-4 space-y-2.5">
            <div className="text-xs font-semibold flex justify-between items-center">
              <span>{bn ? 'টার্গেট ম্যাক্রোনিউট্রিয়েন্ট বিভাজন' : 'Target Macronutrient Breakdown'}</span>
              <span className="text-[10px] text-muted-foreground font-normal">{calculated.protein_ratio_used}</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-emerald-500 font-medium">{bn ? 'প্রোটিন (Protein):' : 'Protein:'}</span>
                <span className="font-semibold">{calculated.target_protein_g} gm ({Math.round((calculated.target_protein_g * 4 / calculated.target_calories) * 100)}%)</span>
              </div>
              <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${Math.round((calculated.target_protein_g * 4 / calculated.target_calories) * 100)}%` }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-blue-500 font-medium">{bn ? 'শর্করা (Complex Carbs):' : 'Carbohydrates:'}</span>
                <span className="font-semibold">{calculated.target_carbs_g} gm ({Math.round((calculated.target_carbs_g * 4 / calculated.target_calories) * 100)}%)</span>
              </div>
              <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full" style={{ width: `${Math.round((calculated.target_carbs_g * 4 / calculated.target_calories) * 100)}%` }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-amber-500 font-medium">{bn ? 'স্বাস্থ্যকর চর্বি (Healthy Fat):' : 'Healthy Fats:'}</span>
                <span className="font-semibold">{calculated.target_fat_g} gm ({Math.round((calculated.target_fat_g * 9 / calculated.target_calories) * 100)}%)</span>
              </div>
              <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: `${Math.round((calculated.target_fat_g * 9 / calculated.target_calories) * 100)}%` }} />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 2. Functional Lab Markers Analyzer */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <HeartPulse className="h-4 w-4 text-rose-500" />
            <span>{bn ? 'ফাংশনাল ল্যাব মার্কার ও মেটাবলিক রিস্ক অ্যানালাইজার' : 'Functional Lab Biomarkers & Risk Analyzer'}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {bn ? 'অপটিমাল ফাংশনাল টার্গেট (Functional Medicine Ranges)' : 'Evaluated against Functional Medicine Optimal Targets'}
          </span>
        </div>

        {/* Lab Inputs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Fasting Glucose (mg/dL)
            </label>
            <input
              type="number"
              value={labs.fasting_glucose || ''}
              onChange={e => updateLabs({ fasting_glucose: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 118"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Fasting Insulin (µIU/mL)
            </label>
            <input
              type="number"
              step="0.5"
              value={labs.fasting_insulin || ''}
              onChange={e => updateLabs({ fasting_insulin: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 16"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              HbA1c (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={labs.hba1c || ''}
              onChange={e => updateLabs({ hba1c: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 6.8"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Triglycerides (mg/dL)
            </label>
            <input
              type="number"
              value={labs.triglycerides || ''}
              onChange={e => updateLabs({ triglycerides: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 220"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              HDL Cholesterol (mg/dL)
            </label>
            <input
              type="number"
              value={labs.hdl || ''}
              onChange={e => updateLabs({ hdl: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 38"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              TSH (µIU/mL)
            </label>
            <input
              type="number"
              step="0.1"
              value={labs.tsh || ''}
              onChange={e => updateLabs({ tsh: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 3.8"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Vitamin D3 (ng/mL)
            </label>
            <input
              type="number"
              value={labs.vitamin_d3 || ''}
              onChange={e => updateLabs({ vitamin_d3: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 18"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Vitamin B12 (pg/mL)
            </label>
            <input
              type="number"
              value={labs.vitamin_b12 || ''}
              onChange={e => updateLabs({ vitamin_b12: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 240"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Serum Uric Acid (mg/dL)
            </label>
            <input
              type="number"
              step="0.1"
              value={labs.uric_acid || ''}
              onChange={e => updateLabs({ uric_acid: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 6.8"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              ALT / SGPT (U/L)
            </label>
            <input
              type="number"
              value={labs.alt || ''}
              onChange={e => updateLabs({ alt: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 38"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Ferritin (ng/mL)
            </label>
            <input
              type="number"
              value={labs.ferritin || ''}
              onChange={e => updateLabs({ ferritin: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 35"
            />
          </div>
        </div>

        {/* Auto Calculated Ratios (HOMA-IR & TG/HDL) Highlight Box */}
        {(labs.homa_ir !== undefined || labs.tg_hdl_ratio !== undefined) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t">
            {labs.homa_ir !== undefined && (
              <div className="p-3.5 rounded-xl border bg-secondary/40 flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span>HOMA-IR (ইনসুলিন রেজিস্ট্যান্স ইনডেক্স):</span>
                    <span className="text-sm font-bold text-rose-500">{labs.homa_ir}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {bn ? labs.homa_ir_status_bn : labs.homa_ir_status_en}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {bn ? 'ফর্মুলা: (Fasting Glucose × Fasting Insulin) ÷ ৪০৫' : 'Formula: (Glucose × Insulin) ÷ 405'}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${labs.homa_ir >= 2.0 ? 'bg-rose-500/15 text-rose-500' : 'bg-emerald-500/15 text-emerald-500'}`}>
                  {labs.homa_ir >= 2.0 ? (bn ? 'উচ্চ প্রতিরোধ' : 'High IR') : (bn ? 'স্বাভাবিক' : 'Optimal')}
                </span>
              </div>
            )}

            {labs.tg_hdl_ratio !== undefined && (
              <div className="p-3.5 rounded-xl border bg-secondary/40 flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span>TG / HDL Ratio (এথেরোজেনিক মার্কার):</span>
                    <span className="text-sm font-bold text-rose-500">{labs.tg_hdl_ratio}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {bn ? labs.tg_hdl_status_bn : labs.tg_hdl_status_en}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {bn ? 'আদর্শ মান: ১.৫ এর নিচে (ছোট ঘন এলডিএল ও ফ্যাটি লিভারের পূর্বাভাস)' : 'Optimal: < 1.5 (Surrogate for small dense LDL)'}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${labs.tg_hdl_ratio >= 3.0 ? 'bg-rose-500/15 text-rose-500' : 'bg-emerald-500/15 text-emerald-500'}`}>
                  {labs.tg_hdl_ratio >= 3.0 ? (bn ? 'উচ্চ ঝুঁকি' : 'High Risk') : (bn ? 'নিরাপদ' : 'Safe')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Detailed Flags Table */}
        {labs.lab_flags.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold text-foreground">
              {bn ? 'স্বয়ংক্রিয় অপটিমাল রেঞ্জ মূল্যায়ন ও ক্লিনিক্যাল দিকনির্দেশনা:' : 'Functional Range Analysis & Clinical Flags:'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {labs.lab_flags.map((flag, idx) => (
                <div key={idx} className="p-3 rounded-xl border bg-background/50 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">{flag.marker}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      flag.status === 'optimal' 
                        ? 'bg-emerald-500/15 text-emerald-500' 
                        : flag.status === 'borderline' 
                        ? 'bg-amber-500/15 text-amber-500' 
                        : 'bg-rose-500/15 text-rose-500'
                    }`}>
                      {flag.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>{bn ? 'প্রাপ্ত মান:' : 'Value:'} <strong className="text-foreground">{flag.value} {flag.unit}</strong></span>
                    <span>{bn ? 'আদর্শ লক্ষ্য:' : 'Optimal:'} <strong>{flag.optimal_range}</strong></span>
                  </div>
                  <div className="text-[11px] text-muted-foreground/90 pt-1 border-t">
                    {bn ? flag.insight_bn : flag.insight_en}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Gut Health & Ayurvedic Agni Profile */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b pb-3 text-foreground font-semibold text-sm">
          <Zap className="h-4 w-4 text-amber-500" />
          <span>{bn ? 'গাট হেলথ, হজম শক্তি (Agni) ও ব্রিস্টল স্টুল স্কেল' : 'Gut Health, Digestive Agni & Bristol Stool Scale'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          {/* Acid Reflux & Bloating */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                {bn ? 'পেট ফাঁপা ও গ্যাস (Bloating)' : 'Bloating Severity'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['none', 'mild', 'severe'] as const).map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => updateGutProfile({ bloating: b })}
                    className={`py-1.5 px-2 text-xs rounded-lg border font-medium transition ${
                      gut_profile.bloating === b 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-secondary/40 hover:bg-secondary text-muted-foreground'
                    }`}
                  >
                    {b === 'none' ? (bn ? 'নেই' : 'None') : b === 'mild' ? (bn ? 'মাঝারি' : 'Mild') : (bn ? 'তীব্র' : 'Severe')}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl border bg-secondary/30 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                <input
                  type="checkbox"
                  checked={gut_profile.acid_reflux_hypoacidity}
                  onChange={e => updateGutProfile({ acid_reflux_hypoacidity: e.target.checked })}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <span>{bn ? 'অম্লপিত্ত / হাইপোক্লোরহাইড্রিয়া (Hypoacidity)' : 'Acid Reflux / Hypoacidity / Long-term PPI'}</span>
              </label>
              <p className="text-[11px] text-muted-foreground leading-relaxed pl-6">
                {bn 
                  ? 'খাবার পর দীর্ঘক্ষণ পেট ভারী থাকা, টক ঢেকুর বা নিয়মিত পিপিআই সেবনের ইতিহাস নির্দেশ করে পাকস্থলীর স্বাভাবিক হাইড্রোক্লোরিক অ্যাসিড কমে গেছে।' 
                  : 'Postprandial heaviness or chronic PPI use heralds low gastric acid, necessitating pre-meal digestive priming.'}
              </p>
            </div>
          </div>

          {/* Digestive Agni Type */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              {bn ? 'পরিপাক শক্তি (Digestive Fire / Agni)' : 'Digestive Fire (Ayurvedic Agni)'}
            </label>
            <div className="space-y-2">
              {[
                { id: 'mandagni', bn: 'মন্দাগ্নি (Mandagni - ধীর পরিপাক, ভারী পেট)', en: 'Mandagni (Hypoactive, sluggish)' },
                { id: 'tikshnagni', bn: 'তীক্ষ্ণাগ্নি (Tikshnagni - অতিরিক্ত ক্ষিধে ও অম্লপিত্ত)', en: 'Tikshnagni (Hyperacidic, burning)' },
                { id: 'vishamagni', bn: 'বিষমাগ্নি (Vishamagni - অনিয়মিত গ্যাস ও কোষ্ঠকাঠিন্য)', en: 'Vishamagni (Irregular, fluctuating)' },
                { id: 'samagni', bn: 'সমাগ্নি (Samagni - আদর্শ ভারসাম্যপূর্ণ পরিপাক)', en: 'Samagni (Balanced & optimal)' },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateGutProfile({ digestive_fire_agni: item.id as AgniType })}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs font-medium transition ${
                    gut_profile.digestive_fire_agni === item.id 
                      ? 'bg-primary/10 border-primary text-primary font-semibold' 
                      : 'bg-background hover:bg-secondary/40 text-muted-foreground'
                  }`}
                >
                  {bn ? item.bn : item.en}
                </button>
              ))}
            </div>
          </div>

          {/* Energy & Sleep Sliders */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium text-foreground">{bn ? 'দৈনিক এনার্জি স্কোর (Energy Level):' : 'Daily Energy Score:'}</span>
                <span className="font-bold text-primary">{gut_profile.energy_score} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={gut_profile.energy_score}
                onChange={e => updateGutProfile({ energy_score: Number(e.target.value) })}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{bn ? 'তীব্র ক্লান্তি' : 'Fatigued'}</span>
                <span>{bn ? 'পূর্ণ চনমনে' : 'Vibrant'}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium text-foreground">{bn ? 'ঘুমের গুণগত মান (Sleep Quality):' : 'Sleep Quality:'}</span>
                <span className="font-bold text-primary">{gut_profile.sleep_quality_score} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={gut_profile.sleep_quality_score}
                onChange={e => updateGutProfile({ sleep_quality_score: Number(e.target.value) })}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{bn ? 'অনিদ্রা/ভাঙা ঘুম' : 'Broken'}</span>
                <span>{bn ? 'গভীর ও সতেজ' : 'Deep REM'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bristol Stool Scale Selector (1-7) */}
        <div className="pt-3 border-t space-y-2">
          <div className="flex justify-between items-center text-xs font-medium text-foreground">
            <span>{bn ? 'ব্রিস্টল স্টুল স্কেল (Bristol Stool Form Scale 1 - 7):' : 'Bristol Stool Form Scale (1 - 7):'}</span>
            <span className="font-bold text-primary">{bn ? `টাইপ ${gut_profile.bristol_stool_score}` : `Type ${gut_profile.bristol_stool_score}`}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {[
              { type: 1, label_bn: 'টাইপ ১: ছাগলের নাদির মতো শক্ত গোটা (তীব্র কোষ্ঠকাঠিন্য)', label_en: 'Type 1: Hard separate lumps (severe constipation)', color: 'border-rose-500/50' },
              { type: 2, label_bn: 'টাইপ ২: সসেজের মতো কিন্তু অমসৃণ/শক্ত (হালকা কোষ্ঠকাঠিন্য)', label_en: 'Type 2: Lumpy sausage (mild constipation)', color: 'border-amber-500/50' },
              { type: 3, label_bn: 'টাইপ ৩: খাঁজকাটা সসেজের মতো (স্বাভাবিকের কাছাকাছি)', label_en: 'Type 3: Sausage with surface cracks', color: 'border-emerald-500/50' },
              { type: 4, label_bn: 'টাইপ ৪: মসৃণ ও নরম সাপের মতো (১০০% আদর্শ ও সুস্থ)', label_en: 'Type 4: Smooth, soft snake (Optimal)', color: 'border-emerald-500 font-bold' },
              { type: 5, label_bn: 'টাইপ ৫: ধারালো প্রান্তযুক্ত নরম বল (আঁশ স্বল্পতা)', label_en: 'Type 5: Soft blobs with clear cut edges', color: 'border-amber-500/50' },
              { type: 6, label_bn: 'টাইপ ৬: পাতলা থকথকে কাদাটে (হালকা ডায়রিয়া/প্রদাহ)', label_en: 'Type 6: Mushy stool with ragged edges', color: 'border-rose-500/50' },
              { type: 7, label_bn: 'টাইপ ৭: সম্পূর্ণ পানির মতো তরল (তীব্র ডায়রিয়া/ইনফেকশন)', label_en: 'Type 7: Liquid consistency, no solid pieces', color: 'border-rose-500' },
            ].map(b => (
              <button
                key={b.type}
                type="button"
                onClick={() => updateGutProfile({ bristol_stool_score: b.type })}
                className={`p-2 rounded-xl border text-left flex flex-col justify-between transition min-h-[90px] ${
                  gut_profile.bristol_stool_score === b.type 
                    ? 'bg-primary/15 border-primary shadow-sm' 
                    : 'bg-background hover:bg-secondary/40'
                }`}
              >
                <div className="flex justify-between items-center w-full mb-1">
                  <span className="font-bold text-xs">Type {b.type}</span>
                  {b.type === 4 && <span className="text-[9px] bg-emerald-500/20 text-emerald-500 px-1 py-0.2 rounded font-semibold">IDEAL</span>}
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {bn ? b.label_bn : b.label_en}
                </p>
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

