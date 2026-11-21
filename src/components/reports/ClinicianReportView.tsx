'use client';

import React, { useState } from 'react';
import { ClinicianReportPayload } from '@/engine/reports/dualReportEngine';
import { 
  ShieldCheck, 
  Activity, 
  Flame, 
  AlertTriangle, 
  Lock, 
  Clock, 
  Utensils, 
  CheckCircle, 
  XCircle,
  FileText,
  Printer,
  ChevronDown,
  Layers,
  Sparkles,
  Award,
  Pill
} from 'lucide-react';

interface ClinicianReportViewProps {
  payload: ClinicianReportPayload;
  language: 'en' | 'bn';
  onPrint?: () => void;
}

export const ClinicianReportView: React.FC<ClinicianReportViewProps> = ({
  payload,
  language,
  onPrint
}) => {
  const bn = language === 'bn';
  const [activeDayIndex, setActiveDayIndex] = useState<number>(0);
  const [showAllDays, setShowAllDays] = useState<boolean>(true);

  const { patient_context, energy_and_macro_analytics, days, micronutrient_sufficiency, drug_nutrient_interactions } = payload;
  const currentDay = days[activeDayIndex] || days[0];

  return (
    <div className="space-y-6" data-testid="clinician-report-view">
      
      {/* Clinician Dossier Control Toolbar (Hidden in Print) */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-subtle flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            <span>{bn ? 'অভ্যন্তরীণ ক্লিনিক্যাল ডসিয়ার (U20)' : 'Internal Clinical Dossier (U20)'}</span>
          </span>
          <span className="text-xs text-muted-foreground">
            {bn ? 'সম্পূর্ণ পুষ্টির হিসাব ও অ্যাটওয়াটার বিশ্লেষণ' : 'Full Nutritional Biochemistry & Atwater Balance'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {days.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setShowAllDays(!showAllDays)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                  showAllDays 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-card text-foreground border-border hover:bg-secondary'
                }`}
              >
                {showAllDays ? (bn ? '৭-দিনের পূর্ণ তালিকা' : 'Full 7-Day View') : (bn ? 'একক দিন' : 'Single Day')}
              </button>
            </div>
          )}

          {onPrint && (
            <button
              type="button"
              data-testid="btn-print-report"
              onClick={onPrint}
              className="px-3.5 py-1.5 rounded-xl bg-foreground text-background hover:opacity-90 text-xs font-bold flex items-center gap-1.5 shadow-subtle transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>{bn ? 'ক্লিনিক্যাল রিপোর্ট প্রিন্ট' : 'Print Clinical Report'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Printable Clinical Dossier Container */}
      <div className="print-container bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 border border-border/80 rounded-3xl p-6 sm:p-10 max-w-4xl mx-auto shadow-xl space-y-6 print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Clinician Document Header */}
        <div className="border-b-2 border-primary pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                {bn ? 'শুদ্ধ ক্লিনিক্যাল ফাংশনাল নিউট্রিশন' : 'SHUDDHO CLINICAL FUNCTIONAL NUTRITION'}
              </span>
              <span className="text-xs text-muted-foreground font-mono">v{payload.plan_version}.0</span>
              <span className="text-[10px] font-mono font-bold tracking-wider bg-secondary border border-border px-1.5 py-0.5 rounded text-muted-foreground">
                100% DETERMINISTIC ZERO-AI PROTOCOL
              </span>
            </div>
            <h1 className="font-extrabold text-xl sm:text-2xl tracking-tight text-foreground print:text-black mt-1">
              {bn ? '৭-দিনের ব্যক্তিগতকৃত পুষ্টি প্রেসক্রিপশন ও ক্লিনিক্যাল ডসিয়ার' : '7-Day Personalized Diet Prescription & Clinical Dossier'}
            </h1>
            <p className="text-xs text-muted-foreground print:text-slate-600 mt-0.5">
              {bn ? 'প্রিসিশন সিস্টেমস-বায়োলজি ও ডিটারমিনিস্টিক ফুড কম্পোজিশন রিপোর্ট' : 'Precision Systems-Biology & Deterministic Food Composition Protocol'}
            </p>
          </div>

          <div className="text-left sm:text-right text-xs space-y-1">
            <div className="inline-block px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-secondary border border-border">
              {payload.is_approved ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {bn ? 'অনুমোদিত' : 'CLINICALLY APPROVED'}
                </span>
              ) : (
                <span className="text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {bn ? 'খসড়া / প্রোভিশনাল' : 'PROVISIONAL DRAFT'}
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {bn ? 'তারিখ: ' : 'Generated: '} {payload.patient_context.visit_date}
            </div>
            {payload.approval_metadata && (
              <div className="text-[10px] text-muted-foreground">
                {bn ? 'অনুমোদনকারী: ' : 'Clinician: '} <strong>{payload.approval_metadata.clinician_name}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Patient Clinical Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-secondary/40 border border-border text-xs">
          <div>
            <span className="text-muted-foreground block text-[10px]">{bn ? 'রোগীর বিবরণ:' : 'Patient:'}</span>
            <span className="font-bold text-foreground text-sm">{patient_context.name}</span>
            <span className="text-muted-foreground block font-mono text-[10px] mt-0.5">{patient_context.id}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px]">{bn ? 'বায়োমেট্রিক্স:' : 'Biometrics:'}</span>
            <span className="font-semibold text-foreground">
              {patient_context.weight_kg} kg • {patient_context.height_cm} cm
            </span>
            <span className="text-muted-foreground block text-[10px] mt-0.5">
              BMI: {patient_context.bmi} • WHtR: {patient_context.whtr || '—'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px]">{bn ? 'জনগোষ্ঠী ও পর্যায়:' : 'Population & Phase:'}</span>
            <span className="font-semibold text-foreground capitalize">
              {patient_context.population_group.replace(/_/g, ' ')}
            </span>
            <span className="text-primary block text-[10px] font-bold mt-0.5">
              Phase {patient_context.current_phase}: {patient_context.phase_title}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px]">{bn ? 'ভিজিট আইডি:' : 'Visit ID:'}</span>
            <span className="font-mono text-foreground font-semibold">{patient_context.visit_id}</span>
            <span className="text-muted-foreground block text-[10px] mt-0.5">{patient_context.visit_date}</span>
          </div>
        </div>

        {/* Clinical Fluid Restriction Alert (When Active) */}
        {patient_context.clinical_safety?.fluid_restriction?.is_restricted && (
          <div className="p-3.5 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
            <div>
              <span className="font-bold text-xs block">
                {bn ? 'ক্লিনিক্যাল তরল নিয়ন্ত্রণ সতর্কতা (Fluid Restriction Active)' : 'Clinical Fluid Restriction Active (তরল নিয়ন্ত্রণ)'}
              </span>
              <span className="text-[11px]">
                {bn
                  ? `দৈনিক সর্বাধিক তরল গ্রহণ সীমা: ${patient_context.clinical_safety.fluid_restriction.limit_ml || 1200} মিলি (1200 mL)। পানি, চা, ঝোল সহ সকল তরল এই সীমার অন্তর্ভুক্ত।`
                  : `Strictly enforce maximum daily fluid limit: ${patient_context.clinical_safety.fluid_restriction.limit_ml || 1200} mL. All intake (water, soups, broths) counts toward this ceiling.`}
              </span>
            </div>
          </div>
        )}

        {/* Section A: Energy & Atwater Macronutrient Analytics */}
        <div className="border border-border rounded-2xl p-4 sm:p-5 space-y-4 bg-card shadow-2xs avoid-break">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h2 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-primary" />
              <span>{bn ? '১. মেটাবলিক এনার্জি ও অ্যাটওয়াটার ম্যাক্রো বিশ্লেষণ' : '1. Metabolic Energy & Atwater Macronutrient Analytics'}</span>
            </h2>
            <span className="text-[10px] text-muted-foreground font-mono">
              Atwater 4-4-9 Standard
            </span>
          </div>

          {/* Energy Floor & Targets KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-secondary/30 border border-border/80 space-y-0.5">
              <span className="text-muted-foreground text-[10px] block">{bn ? 'হিসাবকৃত BMR:' : 'Calculated BMR:'}</span>
              <strong className="text-base text-foreground font-mono">{energy_and_macro_analytics.bmr_kcal}</strong>
              <span className="text-[10px] text-muted-foreground block">kcal/day</span>
            </div>

            <div className="p-3 rounded-xl bg-secondary/30 border border-border/80 space-y-0.5">
              <span className="text-muted-foreground text-[10px] block">{bn ? 'টার্গেট TDEE:' : 'Target TDEE:'}</span>
              <strong className="text-base text-foreground font-mono">{energy_and_macro_analytics.tdee_kcal}</strong>
              <span className="text-[10px] text-muted-foreground block">kcal/day</span>
            </div>

            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-0.5">
              <span className="text-primary text-[10px] font-bold block">{bn ? 'টার্গেট ক্যালোরি:' : 'Prescribed Target:'}</span>
              <strong className="text-base text-primary font-mono">{energy_and_macro_analytics.target_calories_kcal}</strong>
              <span className="text-[10px] text-primary/80 block">kcal/day</span>
            </div>

            <div className="p-3 rounded-xl bg-secondary/30 border border-border/80 space-y-0.5">
              <span className="text-muted-foreground text-[10px] block">{bn ? 'পরিকল্পিত ক্যালোরি:' : 'Planned Intake:'}</span>
              <strong className="text-base text-foreground font-mono">{energy_and_macro_analytics.planned_calories_kcal}</strong>
              <span className={`text-[10px] font-semibold block ${
                Math.abs(energy_and_macro_analytics.calorie_variance_kcal) <= 50 ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {energy_and_macro_analytics.calorie_variance_kcal > 0 ? `+${energy_and_macro_analytics.calorie_variance_kcal}` : energy_and_macro_analytics.calorie_variance_kcal} kcal var
              </span>
            </div>
          </div>

          {/* Atwater Macro Target vs Actual Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-secondary/40 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-2 px-3">{bn ? 'ম্যাক্রোনিউট্রিয়েন্ট' : 'Macronutrient'}</th>
                  <th className="py-2 px-3">{bn ? 'টার্গেট' : 'Target'}</th>
                  <th className="py-2 px-3">{bn ? 'পরিকল্পিত' : 'Planned'}</th>
                  <th className="py-2 px-3">{bn ? 'পার্থক্য (Variance)' : 'Variance'}</th>
                  <th className="py-2 px-3">{bn ? 'অর্জিত %' : 'Achievement'}</th>
                  <th className="py-2 px-3">{bn ? 'অ্যাটওয়াটার ক্যালোরি অনুপাত' : 'Atwater Caloric Ratio'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                <tr>
                  <td className="py-2 px-3 font-semibold text-emerald-600 dark:text-emerald-400">
                    {bn ? 'প্রোটিন (Protein)' : 'Protein'}
                  </td>
                  <td className="py-2 px-3">{energy_and_macro_analytics.target_protein_g}g</td>
                  <td className="py-2 px-3 font-bold text-foreground">{energy_and_macro_analytics.planned_protein_g}g</td>
                  <td className="py-2 px-3">{energy_and_macro_analytics.protein_variance_g > 0 ? `+${energy_and_macro_analytics.protein_variance_g}` : energy_and_macro_analytics.protein_variance_g}g</td>
                  <td className="py-2 px-3">{energy_and_macro_analytics.protein_achievement_pct}%</td>
                  <td className="py-2 px-3">{energy_and_macro_analytics.protein_ratio_pct}% of energy</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-blue-600 dark:text-blue-400">
                    {bn ? 'কার্বোহাইড্রেট (Carbs)' : 'Carbohydrates'}
                  </td>
                  <td className="py-2 px-3">{energy_and_macro_analytics.target_carbs_g}g</td>
                  <td className="py-2 px-3 font-bold text-foreground">{energy_and_macro_analytics.planned_carbs_g}g</td>
                  <td className="py-2 px-3">{energy_and_macro_analytics.carbs_variance_g > 0 ? `+${energy_and_macro_analytics.carbs_variance_g}` : energy_and_macro_analytics.carbs_variance_g}g</td>
                  <td className="py-2 px-3">{energy_and_macro_analytics.carbs_achievement_pct}%</td>
                  <td className="py-2 px-3">{energy_and_macro_analytics.carbs_ratio_pct}% of energy</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-amber-600 dark:text-amber-400">
                    {bn ? 'ফ্যাট (Fat)' : 'Healthy Fats'}
                  </td>
                  <td className="py-2 px-3">{energy_and_macro_analytics.target_fat_g}g</td>
                  <td className="py-2 px-3 font-bold text-foreground">{energy_and_macro_analytics.planned_fat_g}g</td>
                  <td className="py-2 px-3">{energy_and_macro_analytics.fat_variance_g > 0 ? `+${energy_and_macro_analytics.fat_variance_g}` : energy_and_macro_analytics.fat_variance_g}g</td>
                  <td className="py-2 px-3">{energy_and_macro_analytics.fat_achievement_pct}%</td>
                  <td className="py-2 px-3">{energy_and_macro_analytics.fat_ratio_pct}% of energy</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Atwater Continuous Balance Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
              <span>Protein: {energy_and_macro_analytics.protein_ratio_pct}%</span>
              <span>Carbohydrates: {energy_and_macro_analytics.carbs_ratio_pct}%</span>
              <span>Fat: {energy_and_macro_analytics.fat_ratio_pct}%</span>
            </div>
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-secondary">
              <div style={{ width: `${energy_and_macro_analytics.protein_ratio_pct}%` }} className="bg-emerald-500" title="Protein" />
              <div style={{ width: `${energy_and_macro_analytics.carbs_ratio_pct}%` }} className="bg-blue-500" title="Carbohydrates" />
              <div style={{ width: `${energy_and_macro_analytics.fat_ratio_pct}%` }} className="bg-amber-500" title="Fat" />
            </div>
          </div>

          {/* Glycemic Load & PRAL Acid-Base Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-secondary/30 border border-border/70 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground block">{bn ? 'গ্লাইসেমিক লোড (GL):' : 'Glycemic Load (GL):'}</span>
                <span className="font-bold text-foreground text-sm font-mono">{energy_and_macro_analytics.glycemic_load}</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                energy_and_macro_analytics.glycemic_load <= 80 ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'
              }`}>
                {energy_and_macro_analytics.glycemic_load <= 80 ? 'Low GL' : 'Moderate GL'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-secondary/30 border border-border/70 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground block">{bn ? 'রেনাল অ্যাসিড লোড (PRAL):' : 'Potential Renal Acid Load (PRAL):'}</span>
                <span className="font-bold text-foreground text-sm font-mono">{energy_and_macro_analytics.pral_score} mEq/d</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                energy_and_macro_analytics.pral_score <= 0 ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'
              }`}>
                {energy_and_macro_analytics.pral_score <= 0 ? 'Alkaline' : 'Acid-Forming'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-secondary/30 border border-border/70 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground block">{bn ? 'খাদ্য আঁশ (Fiber):' : 'Dietary Fiber:'}</span>
                <span className="font-bold text-foreground text-sm font-mono">{energy_and_macro_analytics.total_fiber_g}g</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                energy_and_macro_analytics.total_fiber_g >= 25 ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'
              }`}>
                {energy_and_macro_analytics.total_fiber_g >= 25 ? 'Optimal' : 'Sub-Optimal'}
              </span>
            </div>
          </div>
        </div>

        {/* Section B: Clinical Safety, Warnings & Risk Stratification */}
        <div className="border border-border rounded-2xl p-4 sm:p-5 space-y-3 bg-card shadow-2xs avoid-break">
          <h2 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5 border-b border-border pb-2.5">
            <ShieldCheck className="h-4 w-4 text-rose-600" />
            <span>{bn ? '২. অ্যালার্জি, নিষেধাজ্ঞা ও ক্লিনিক্যাল সুরক্ষা ঝুঁকি' : '2. Allergens, Clinical Directives & Risk Stratification'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1">
              <span className="font-bold text-rose-700 dark:text-rose-400 block text-[11px] flex items-center gap-1">
                <Lock className="h-3 w-3" />
                {bn ? 'নিশ্চিত অ্যালার্জি (Non-Overridable Hard Block):' : 'Confirmed Allergies (Absolute Block):'}
              </span>
              <p className="text-[11px] text-rose-800 dark:text-rose-300 font-medium">
                {patient_context.confirmed_allergies.length > 0 
                  ? patient_context.confirmed_allergies.join(', ')
                  : (bn ? 'কোনো অ্যালার্জি রেকর্ড নেই' : 'None Recorded')}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
              <span className="font-bold text-amber-700 dark:text-amber-400 block text-[11px] flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {bn ? 'চিকিৎসকের নিষেধাজ্ঞা (Clinician Directives):' : 'Clinician Exclusions:'}
              </span>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                {patient_context.clinician_disallowed_foods.length > 0 
                  ? patient_context.clinician_disallowed_foods.join(', ')
                  : (bn ? 'কোনো নিষেধাজ্ঞা নেই' : 'None Recorded')}
              </p>
            </div>
          </div>

          {/* Active Lab Flags */}
          {patient_context.safety_flags.length > 0 && (
            <div className="p-2.5 rounded-xl bg-secondary/40 border border-border text-xs space-y-1">
              <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider block">
                {bn ? 'সক্রিয় ল্যাব অ্যালার্ট ও ঝুঁকি:' : 'Active Laboratory Alerts:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {patient_context.safety_flags.map((flag, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section C: Detailed Meal Plans (Day-by-Day or 7-Day) */}
        <div className="border border-border rounded-2xl p-4 sm:p-5 space-y-4 bg-card shadow-2xs avoid-break">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h2 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Utensils className="h-4 w-4 text-emerald-600" />
              <span>{bn ? '৩. খাদ্যতালিকার পুষ্টি হিসাব ও বিনিময় বিবরণী' : '3. Meal-Wise Nutritional Quantification & Food Exchanges'}</span>
            </h2>
            <span className="text-[10px] text-muted-foreground font-mono">
              Raw Grams + Cooked Household Measure
            </span>
          </div>

          {/* Render Days */}
          <div className="space-y-6">
            {(showAllDays ? days : [currentDay]).map(day => (
              <div key={day.day_number} data-testid={`report-day-${day.day_number}`} className="border border-border/80 rounded-2xl overflow-hidden shadow-2xs">
                {/* Day Header with Full Day Summary */}
                <div className="p-3 bg-secondary/50 border-b border-border flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded bg-primary text-primary-foreground font-bold text-[11px] flex items-center justify-center">
                      {day.day_number}
                    </span>
                    <strong className="text-foreground">{bn ? day.day_name_bn : day.day_name_en}</strong>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                    <span className="font-bold text-foreground">{day.summary.calories} kcal</span>
                    <span>•</span>
                    <span className="text-emerald-600">P: {day.summary.protein_g}g</span>
                    <span>•</span>
                    <span className="text-blue-600">C: {day.summary.carbs_g}g</span>
                    <span>•</span>
                    <span className="text-amber-600">F: {day.summary.fat_g}g</span>
                    <span>•</span>
                    <span>Fiber: {day.summary.fiber_g}g</span>
                  </div>
                </div>

                {/* Day Meals */}
                <div className="divide-y divide-border/60">
                  {day.meals.map(meal => (
                    <div key={meal.id} className="p-3.5 space-y-2 bg-card">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary font-mono font-bold text-muted-foreground">
                            {meal.target_time}
                          </span>
                          <span className="font-bold text-foreground">
                            {bn ? meal.title_bn : meal.title_en}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          <strong>{meal.meal_calories}</strong> kcal (P: {meal.meal_protein_g}g, C: {meal.meal_carbs_g}g, F: {meal.meal_fat_g}g)
                        </span>
                      </div>

                      {/* Items Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="text-[10px] text-muted-foreground bg-secondary/30">
                            <tr>
                              <th className="py-1 px-2">{bn ? 'খাবার' : 'Food Item'}</th>
                              <th className="py-1 px-2">{bn ? 'কাঁচা ওজন' : 'Raw Weight'}</th>
                              <th className="py-1 px-2">{bn ? 'রান্না করা গৃহস্থালি পরিমাপ' : 'Cooked Household Measure'}</th>
                              <th className="py-1 px-2">Kcal</th>
                              <th className="py-1 px-2">P / C / F</th>
                              <th className="py-1 px-2">{bn ? 'বিনিময় খাদ্য (Exchanges)' : 'Clinical Alternatives'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40 text-[11px] font-mono">
                            {meal.items.map(item => (
                              <tr key={item.id} className="hover:bg-secondary/20 transition">
                                <td className="py-1 px-2 font-medium text-foreground">
                                  {bn ? item.food_name_bn : item.food_name_en}
                                </td>
                                <td className="py-1 px-2 text-muted-foreground">
                                  {item.raw_weight_g}g
                                </td>
                                <td className="py-1 px-2 text-foreground font-sans">
                                  {bn ? item.cooked_display_bn : item.cooked_display_en}
                                </td>
                                <td className="py-1 px-2 font-bold text-foreground">
                                  {item.kcal}
                                </td>
                                <td className="py-1 px-2 text-muted-foreground text-[10px]">
                                  {item.protein_g}p / {item.carbs_g}c / {item.fat_g}f
                                </td>
                                <td className="py-1 px-2 text-[10px] font-sans text-muted-foreground">
                                  {(item.alternatives || []).length > 0 
                                    ? item.alternatives!.map(a => `${bn ? a.name_bn : a.name_en} (${(a.kcal_diff ?? 0) > 0 ? `+${a.kcal_diff}` : (a.kcal_diff ?? 0)} kcal)`).join(', ')
                                    : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section D: Drug-Nutrient Chronotherapy & Micronutrients */}
        <div className="border border-border rounded-2xl p-4 sm:p-5 space-y-3 bg-card shadow-2xs avoid-break">
          <h2 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5 border-b border-border pb-2.5">
            <Pill className="h-4 w-4 text-purple-600" />
            <span>{bn ? '৪. ড্রাগ-নিউট্রিয়েন্ট ইন্টারঅ্যাকশন ও ক্রোনোথেরাপি' : '4. Drug-Nutrient Chronotherapy & Critical Separations'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {(drug_nutrient_interactions.timeline || []).map((t, idx) => (
              <div key={idx} className="p-2.5 rounded-xl border border-border bg-secondary/30 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] font-bold bg-secondary px-1.5 py-0.5 rounded text-foreground">
                    {t.time}
                  </span>
                  <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400">
                    {bn ? t.title_bn : t.title_en}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {bn ? t.instructions_bn : t.instructions_en}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Clinician Sign-Off & Confidentiality Block */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 text-xs avoid-break">
          <div className="text-[10px] text-muted-foreground max-w-md space-y-1">
            <p className="font-bold text-foreground">
              {payload.clinical_disclaimers[language]}
            </p>
            <p>
              Audited Deterministic Clinical Architecture • Zero Black-Box LLM Calculations
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className="border-b border-foreground/40 pb-1 w-56 ml-auto text-center font-mono font-bold text-xs text-foreground">
              {payload.approval_metadata?.clinician_name || 'Dr. Clinical Specialist'}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 text-center">
              Licensed Clinical Functional Nutritionist
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
