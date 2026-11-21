'use client';

import React from 'react';
import { usePractice } from '@/context/PracticeContext';
import { 
  User, 
  Scale, 
  HeartPulse, 
  ShieldAlert, 
  AlertTriangle, 
  Zap, 
  ExternalLink,
  ShieldCheck,
  Stethoscope,
  FlaskConical,
  Activity,
  ArrowRight,
  Info,
  Calendar,
  Pill,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { ACTIVITY_FACTORS } from '@/engine/anthropometrics';

export const IntakeTab: React.FC = () => {
  const { 
    patient, 
    setActiveTab, 
    language 
  } = usePractice();

  const { calculated, labs, gut_profile } = patient;
  const bn = language === 'bn';

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Unified Architecture Informational Banner */}
      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-subtle">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 mt-0.5">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground flex items-center gap-2">
              <span>{bn ? 'একীভূত ক্লিনিক্যাল ডেটা ব্যবস্থাপনা ও পর্যবেক্ষণ' : 'Unified Clinical Assessment Overview'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                {bn ? 'একক সত্যের উৎস' : 'Single Source of Truth'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">
              {bn
                ? 'ডুপ্লিকেট ডেটা এন্ট্রি প্রতিরোধের জন্য রোগীর মৌলিক জনমিতি রোগী রেজিস্ট্রিতে এবং শারীরিক মাপ, অ্যালার্জি, ল্যাব ও লক্ষণ ১৪-ডোমেন অ্যাসেসমেন্ট উইজার্ডে পরিচালিত হয়।'
                : 'To eliminate duplicate data entry, patient identity is managed in Patient Registry while anthropometrics, safety screening, structured labs, and symptoms are recorded in the 14-Domain Assessment Wizard.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('patients')}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-border bg-card hover:bg-secondary text-foreground transition-all flex items-center gap-1.5 shadow-subtle"
          >
            <User className="h-3.5 w-3.5 text-primary" />
            <span>{bn ? 'রোগী রেজিস্ট্রি' : 'Patient Registry'}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('assessment')}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center gap-1.5 shadow-subtle"
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>{bn ? 'অ্যাসেসমেন্ট উইজার্ড' : 'Assessment Wizard'}</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Population Precaution Banner */}
      {calculated.population_warning && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 shadow-subtle">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {bn ? 'ক্লিনিক্যাল পপুলেশন সতর্কতা' : 'Clinical Population Precaution'}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {calculated.population_warning}
            </p>
          </div>
        </div>
      )}

      {/* 1. Patient Demographics & Identification (Read-Only) */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <User className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              {bn ? 'রোগীর মৌলিক তথ্য (রেজিস্ট্রি নিয়ন্ত্রিত)' : 'Patient Demographics (Registry Controlled)'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('patients')}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
          >
            <span>{bn ? 'রেজিস্ট্রিতে পরিবর্তন করুন' : 'Edit in Patient Registry'}</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-secondary/40 border border-border shadow-2xs">
            <span className="text-[10px] font-semibold text-muted-foreground block uppercase">
              {bn ? 'রোগীর পুরো নাম' : 'Full Name'}
            </span>
            <span className="text-sm font-bold text-foreground mt-1 block truncate">
              {patient.name || (bn ? 'নামহীন রোগী' : 'Unnamed Patient')}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-secondary/40 border border-border shadow-2xs">
            <span className="text-[10px] font-semibold text-muted-foreground block uppercase">
              {bn ? 'বয়স ও জৈবিক লিঙ্গ' : 'Age & Gender'}
            </span>
            <span className="text-sm font-bold text-foreground mt-1 block capitalize">
              {patient.age} {bn ? 'বছর' : 'y'} • {patient.gender === 'female' ? (bn ? 'নারী' : 'Female') : (bn ? 'পুরুষ' : 'Male')}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-secondary/40 border border-border shadow-2xs">
            <span className="text-[10px] font-semibold text-muted-foreground block uppercase">
              {bn ? 'পপুলেশন গ্রুপ' : 'Population Group'}
            </span>
            <span className="text-sm font-bold text-primary mt-1 block uppercase tracking-wide">
              {patient.population_group?.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-secondary/40 border border-border shadow-2xs">
            <span className="text-[10px] font-semibold text-muted-foreground block uppercase">
              {bn ? 'যোগাযোগ নম্বর' : 'Phone / Contact'}
            </span>
            <span className="text-sm font-bold text-foreground mt-1 block truncate font-mono">
              {patient.phone || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Anthropometrics & Energy Architecture (Read-Only) */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Scale className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              {bn ? 'শারীরিক পরিমাপ ও মেটাবলিক সূচক (ধাপ ২ উইজার্ড নিয়ন্ত্রিত)' : 'Anthropometrics & Metabolic Indices (Step 2 Wizard Controlled)'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('assessment')}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
          >
            <span>{bn ? 'অ্যাসেসমেন্টে মাপ পরিবর্তন করুন' : 'Edit Vitals in Assessment'}</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-center">
          <div className="p-3 rounded-xl bg-secondary/40 border border-border shadow-2xs">
            <span className="text-[10px] text-muted-foreground font-semibold block">{bn ? 'উচ্চতা' : 'Height'}</span>
            <span className="text-sm font-bold text-foreground mt-0.5 block font-mono tabular-numbers">{patient.height_cm || '—'} cm</span>
          </div>

          <div className="p-3 rounded-xl bg-secondary/40 border border-border shadow-2xs">
            <span className="text-[10px] text-muted-foreground font-semibold block">{bn ? 'ওজন' : 'Weight'}</span>
            <span className="text-sm font-bold text-foreground mt-0.5 block font-mono tabular-numbers">{patient.weight_kg || '—'} kg</span>
          </div>

          <div className="p-3 rounded-xl bg-secondary/40 border border-border shadow-2xs">
            <span className="text-[10px] text-muted-foreground font-semibold block">{bn ? 'কোমর পরিধি' : 'Waist'}</span>
            <span className="text-sm font-bold text-foreground mt-0.5 block font-mono tabular-numbers">{patient.waist_cm || '—'} cm</span>
          </div>

          <div className="p-3 rounded-xl bg-secondary/40 border border-border shadow-2xs">
            <span className="text-[10px] text-muted-foreground font-semibold block">BMI (kg/m²)</span>
            <span className={`text-sm font-bold mt-0.5 block font-mono tabular-numbers ${calculated.bmi >= 25 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {calculated.bmi || '—'}
            </span>
            <span className="text-[9px] text-muted-foreground">{calculated.bmi_category_en || 'Standard'}</span>
          </div>

          <div className="p-3 rounded-xl bg-secondary/40 border border-border shadow-2xs">
            <span className="text-[10px] text-muted-foreground font-semibold block">WHtR</span>
            <span className={`text-sm font-bold mt-0.5 block font-mono tabular-numbers ${calculated.whtr >= 0.5 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {calculated.whtr || '—'}
            </span>
            <span className="text-[9px] text-muted-foreground">{calculated.whtr >= 0.5 ? 'Central Risk' : 'Healthy'}</span>
          </div>

          <div className="p-3 rounded-xl bg-secondary/40 border border-border shadow-2xs">
            <span className="text-[10px] text-muted-foreground font-semibold block">{bn ? 'টার্গেট ক্যালোরি' : 'Target Calories'}</span>
            <span className="text-sm font-bold text-primary mt-0.5 block font-mono tabular-numbers">{calculated.target_calories || '—'} kcal</span>
            <span className="text-[9px] text-muted-foreground font-mono">BMR: {calculated.bmr} kcal</span>
          </div>
        </div>

        {/* Macro Distribution Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between shadow-2xs">
            <span className="text-xs font-semibold text-foreground">{bn ? 'প্রোটিন বরাদ্দ' : 'Target Protein'}</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-numbers">{calculated.target_protein_g} gm ({Math.round((calculated.target_protein_g * 4 / Math.max(1, calculated.target_calories)) * 100)}%)</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-center justify-between shadow-2xs">
            <span className="text-xs font-semibold text-foreground">{bn ? 'শর্করা বরাদ্দ' : 'Target Carbs'}</span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono tabular-numbers">{calculated.target_carbs_g} gm ({Math.round((calculated.target_carbs_g * 4 / Math.max(1, calculated.target_calories)) * 100)}%)</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between shadow-2xs">
            <span className="text-xs font-semibold text-foreground">{bn ? 'স্নেহ বরাদ্দ' : 'Target Fat'}</span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono tabular-numbers">{calculated.target_fat_g} gm ({Math.round((calculated.target_fat_g * 9 / Math.max(1, calculated.target_calories)) * 100)}%)</span>
          </div>
        </div>
      </div>

      {/* 3. Safety, Allergies & Medication Overview (Read-Only) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-500" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                {bn ? 'নিশ্চিত অ্যালার্জি ও খাদ্য বর্জন' : 'Allergies & Food Exclusions'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('assessment')}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
            >
              <span>{bn ? 'ধাপ ৩-এ সমন্বয়' : 'Reconcile in Step 3'}</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-muted-foreground">
              {bn ? 'নিশ্চিত অ্যালার্জি:' : 'Confirmed Allergies:'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(patient.confirmed_allergies || []).length > 0 ? (
                patient.confirmed_allergies.map(a => (
                  <span key={a} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20 capitalize">
                    {a}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  {bn ? 'কোনো অ্যালার্জি নেই / অপ্রীক্ষিত' : 'No confirmed allergies recorded'}
                </span>
              )}
            </div>

            <div className="text-[11px] font-semibold text-muted-foreground pt-2">
              {bn ? 'চিকিৎসক কর্তৃক নিষিদ্ধ খাদ্য:' : 'Clinician Disallowed Foods:'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(patient.clinician_disallowed_foods || []).length > 0 ? (
                patient.clinician_disallowed_foods.map(f => (
                  <span key={f} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 capitalize">
                    {f}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  {bn ? 'কোনো বিশেষ খাদ্য বর্জন নেই' : 'No clinician disallowed items'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-purple-500" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                {bn ? 'সক্রিয় ওষুধ ও ড্রাগ-নিউট্রিয়েন্ট ইন্টারঅ্যাকশন' : 'Active Medications & DNI'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('dni')}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
            >
              <span>{bn ? 'DNI ট্যাব খুলুন' : 'Open DNI Tab'}</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-muted-foreground">
              {bn ? 'গৃহীত ওষুধসমূহ:' : 'Current Medications:'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(patient.active_medications || []).length > 0 ? (
                patient.active_medications.map(m => (
                  <span key={m} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20 capitalize">
                    {m.replace(/med_/, '')}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  {bn ? 'রোগী কোনো নিয়মিত ওষুধ খাচ্ছেন না' : 'No active medications reported'}
                </span>
              )}
            </div>

            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 mt-2">
              {bn
                ? 'ঔষধের সাথে পুষ্টির প্রতিক্রিয়া ও সময়সূচী DNI ট্যাবে বিস্তারিতভাবে স্বয়ংক্রিয়ভাবে হিসাব করা আছে।'
                : 'Drug-Nutrient Interactions and timing schedules are evaluated in the DNI & Timeline tab.'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Laboratory Biomarkers Summary Card (Read-Only) */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              {bn ? 'ল্যাবরেটরি রিপোর্ট ওভারভিউ (ধাপ ৮ উইজার্ড নিয়ন্ত্রিত)' : 'Laboratory Biomarkers Overview (Step 8 Controlled)'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('assessment')}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
          >
            <span>{bn ? 'ধাপ ৮-এ টেস্ট এন্ট্রি করুন' : 'Enter Labs in Step 8'}</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          <div className="p-3 rounded-xl bg-muted/40 border text-center">
            <span className="text-[10px] text-muted-foreground font-semibold block">FBS (Glucose)</span>
            <span className="text-sm font-bold text-foreground mt-0.5 block">{labs.fasting_glucose ?? 'Not tested'}</span>
            <span className="text-[9px] text-muted-foreground">{labs.fasting_glucose ? 'mg/dL' : ''}</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border text-center">
            <span className="text-[10px] text-muted-foreground font-semibold block">HbA1c</span>
            <span className={`text-sm font-bold mt-0.5 block ${(labs.hba1c ?? 0) >= 6.5 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {labs.hba1c ? `${labs.hba1c}%` : 'Not tested'}
            </span>
            <span className="text-[9px] text-muted-foreground">{(labs.hba1c ?? 0) >= 6.5 ? 'Diabetic' : ''}</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border text-center">
            <span className="text-[10px] text-muted-foreground font-semibold block">Fasting Insulin</span>
            <span className="text-sm font-bold text-foreground mt-0.5 block">{labs.fasting_insulin ?? 'Not tested'}</span>
            <span className="text-[9px] text-muted-foreground">{labs.fasting_insulin ? 'µIU/mL' : ''}</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border text-center">
            <span className="text-[10px] text-muted-foreground font-semibold block">HOMA-IR</span>
            <span className={`text-sm font-bold mt-0.5 block ${(labs.homa_ir ?? 0) >= 2.0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {labs.homa_ir ?? '—'}
            </span>
            <span className="text-[9px] text-muted-foreground">{(labs.homa_ir ?? 0) >= 2.0 ? 'Insulin Resist.' : ''}</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border text-center">
            <span className="text-[10px] text-muted-foreground font-semibold block">TG / HDL Ratio</span>
            <span className={`text-sm font-bold mt-0.5 block ${(labs.tg_hdl_ratio ?? 0) >= 3.0 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {labs.tg_hdl_ratio ?? '—'}
            </span>
            <span className="text-[9px] text-muted-foreground">{(labs.tg_hdl_ratio ?? 0) >= 3.0 ? 'Atherogenic' : ''}</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border text-center">
            <span className="text-[10px] text-muted-foreground font-semibold block">TSH</span>
            <span className="text-sm font-bold text-foreground mt-0.5 block">{labs.tsh ?? 'Not tested'}</span>
            <span className="text-[9px] text-muted-foreground">{labs.tsh ? 'µIU/mL' : ''}</span>
          </div>
        </div>
      </div>

      {/* 5. Functional Gut & Digestive Overview (Read-Only) */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              {bn ? 'গ্যাস্ট্রোইন্টেস্টাইনাল ও পরিপাক অগ্নির অবস্থা (ধাপ ৪ ও ৬ নিয়ন্ত্রিত)' : 'Digestive Vitals & Gut Health (Steps 4 & 6 Controlled)'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('assessment')}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
          >
            <span>{bn ? 'অ্যাসেসমেন্টে বিস্তারিত দেখুন' : 'View in Assessment Wizard'}</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-muted/40 border">
            <span className="text-[10px] font-semibold text-muted-foreground block">{bn ? 'পেট ফাঁপা (Bloating)' : 'Bloating Severity'}</span>
            <span className="text-xs font-bold text-foreground mt-1 capitalize block">{gut_profile?.bloating || 'None'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border">
            <span className="text-[10px] font-semibold text-muted-foreground block">{bn ? 'এসিড রিফ্লাক্স' : 'Acid Reflux / Hypoacidity'}</span>
            <span className="text-xs font-bold text-foreground mt-1 block">
              {gut_profile?.acid_reflux_hypoacidity ? (bn ? 'হ্যাঁ (উপস্থিত)' : 'Present') : (bn ? 'নেই' : 'Absent')}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border">
            <span className="text-[10px] font-semibold text-muted-foreground block">{bn ? 'ব্রিস্টল স্টুল স্কোর' : 'Bristol Stool Scale'}</span>
            <span className="text-xs font-bold text-foreground mt-1 block">
              Type {gut_profile?.bristol_stool_score || 4}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border">
            <span className="text-[10px] font-semibold text-muted-foreground block">{bn ? 'পরিপাক অগ্নি (Agni)' : 'Digestive Fire (Agni)'}</span>
            <span className="text-xs font-bold text-primary mt-1 block capitalize">
              {gut_profile?.digestive_fire_agni || 'Samagni'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
