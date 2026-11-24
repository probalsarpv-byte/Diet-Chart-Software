'use client';

import React from 'react';
import { usePractice } from '@/context/PracticeContext';
import { useAssessment } from '@/context/AssessmentContext';
import { FeedingRouteType } from '@/types/clinical';
import {
  FileText,
  AlertOctagon,
  Pill,
  CheckCircle2
} from 'lucide-react';
import { AllergyReconciliationEditor } from '@/components/reconciliation/AllergyReconciliationEditor';

export const StepHistorySafety: React.FC = () => {
  const { patient, updatePatient, language } = usePractice();
  const { setCurrentStep, setActiveDomain, setAnswer, functionalAnswers } = useAssessment();
  const bn = language === 'bn';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-foreground">
          {bn ? 'ধাপ ৩: চিকিৎসা ইতিহাস ও জরুরি নিরাপত্তা স্ক্রিনিং' : 'Step 3: Medical History & Mandatory Clinical Safety'}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {bn
            ? 'প্রধান অভিযোগ, নিশ্চিত অ্যালার্জি রিকনসিলিয়েশন, প্রেসক্রিপশন ড্রাগ রিকনসিলিয়েশন এবং ক্লিনিক্যাল নিরাপত্তা প্রশ্নাবলি পূরণ করুন।'
            : 'Capture chief complaints, explicit allergy reconciliation, full medication reconciliation, and high-priority medication safety checks.'}
        </p>
      </div>

      {/* 1. Chief Complaint & Timeline */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          {bn ? '১. প্রধান স্বাস্থ্য অভিযোগ ও সূচনা' : '1. Chief Complaint & Symptom Timeline'}
        </h4>

        <div>
          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
            {bn ? 'প্রধান শারীরিক সমস্যা বা পরামর্শের কারণ (Chief Complaint)' : 'Primary Health Concern / Chief Complaint'}
          </label>
          <input
            type="text"
            value={functionalAnswers['chief_complaint'] || ''}
            onChange={(e) => setAnswer('chief_complaint', e.target.value)}
            placeholder={bn ? "যেমন: পেটে গ্যাস, ক্লান্তি, রক্তে উচ্চ সুগার..." : "e.g., Postprandial bloating, chronic fatigue, dysglycemia..."}
            className="w-full px-3 py-2 text-xs rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              {bn ? 'সমস্যা কতদিন ধরে চলছে?' : 'Symptom Duration / Onset'}
            </label>
            <select
              value={functionalAnswers['symptom_onset_timeline'] || '1_to_6_months'}
              onChange={(e) => setAnswer('symptom_onset_timeline', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="less_than_1_month">&lt; 1 month (Acute)</option>
              <option value="1_to_6_months">1 to 6 months</option>
              <option value="6_to_12_months">6 months to 1 year</option>
              <option value="1_to_3_years">1 to 3 years</option>
              <option value="chronic_over_3_years">&gt; 3 years (Chronic)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              {bn ? 'লক্ষণ শুরুর আগে বিশেষ কোনো ঘটনা ঘটেছিল?' : 'Triggering Antecedent Event'}
            </label>
            <select
              value={functionalAnswers['trigger_event_history'] || 'none_apparent'}
              onChange={(e) => setAnswer('trigger_event_history', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="none_apparent">No obvious triggering event</option>
              <option value="severe_infection">Severe infection / Typhoid / Food poisoning</option>
              <option value="heavy_antibiotics">Heavy antibiotic course</option>
              <option value="major_stress">Severe psychological stress or grief</option>
              <option value="pregnancy_childbirth">Postpartum / Pregnancy</option>
              <option value="surgical_procedure">Major surgery or hospitalization</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Explicit Allergy Reconciliation (4-State Lifecycle) */}
      <AllergyReconciliationEditor />

      {/* 3. Authoritative Prescribed Medications Summary (Domain 13 Reference) */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3" data-testid="step-history-medication-summary">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              {bn ? '৩. চলমান প্রেসক্রিপশন ওষুধের সারসংক্ষেপ (ডোমেন ১৩)' : '3. Current Prescribed Medications Summary (Domain 13)'}
            </h4>
          </div>

          <button
            type="button"
            onClick={() => {
              setCurrentStep('step_functional');
              setActiveDomain('medication_supplements');
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition flex items-center gap-1.5 self-start sm:self-auto"
            data-testid="nav-to-domain13-btn"
          >
            <span>{bn ? 'ফাংশনাল মূল্যায়নে ওষুধ সম্পাদনা করুন (ডোমেন ১৩) →' : 'Edit Medications in Functional Assessment (Domain 13) →'}</span>
          </button>
        </div>

        {patient.medication_reconciliation?.verified_no_medications ? (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{bn ? 'যাচাইকৃত: রোগী বর্তমানে কোনো ওষুধ সেবন করছেন না।' : 'Verified: Patient currently takes no medications.'}</span>
          </div>
        ) : (patient.medication_records && patient.medication_records.length > 0) ? (
          <div className="space-y-2">
            <div className="text-[11px] text-muted-foreground">
              {patient.medication_records.length} {bn ? 'টি ওষুধ সক্রিয়ভাবে রেকর্ড করা আছে:' : 'active medication(s) recorded:'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {patient.medication_records.map(rec => (
                <div key={rec.id} className="p-2.5 rounded-xl border bg-muted/20 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground">{rec.brand_name || rec.medication_name}</span>
                    {rec.product_strength && <span className="ml-1.5 text-[10px] text-teal-800 bg-teal-50 px-1 rounded">{rec.product_strength}</span>}
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Dose: {rec.prescribed_dose || rec.dose || 'Unknown'} • {rec.frequency || 'Unknown'}
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                    {rec.verification_status?.replace(/_/g, ' ') || 'Reported'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 text-center rounded-xl bg-muted/20 text-xs text-muted-foreground">
            {bn
              ? 'এখনও কোনো ওষুধ রেকর্ড করা হয়নি। ফাংশনাল অ্যাসেসমেন্টের ডোমেন ১৩-এ ওষুধ যোগ করুন।'
              : 'No medications recorded yet. Use Domain 13 in Functional Assessment for structured medication entry.'}
          </div>
        )}
      </div>

      {/* 4. Mandatory Clinical Safety Screening */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 text-amber-500" />
          {bn ? '৪. বাধ্যতামূলক ক্লিনিক্যাল নিরাপত্তা স্ক্রিনিং' : '4. Mandatory Clinical Nutrition Safety Screening'}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Insulin Active */}
          <div className="p-3 rounded-xl border bg-muted/30 space-y-2">
            <label className="text-xs font-bold text-foreground block">
              {bn ? 'রোগী কি ইনসুলিন নিচ্ছেন?' : 'Active Insulin Therapy?'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAnswer('safety_insulin_active', 'yes')}
                className={`py-1.5 px-3 text-xs font-semibold rounded-lg border transition-all ${
                  functionalAnswers['safety_insulin_active'] === 'yes'
                    ? 'border-amber-500 bg-amber-500 text-white font-bold'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {bn ? 'হ্যাঁ (ইনসুলিন)' : 'Yes (Insulin)'}
              </button>
              <button
                type="button"
                data-testid="safety-insulin-no"
                onClick={() => setAnswer('safety_insulin_active', 'no')}
                className={`py-1.5 px-3 text-xs font-semibold rounded-lg border transition-all ${
                  functionalAnswers['safety_insulin_active'] === 'no'
                    ? 'border-primary bg-primary text-primary-foreground font-bold'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {bn ? 'না' : 'No'}
              </button>
            </div>
            {functionalAnswers['safety_insulin_active'] === 'yes' && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                {bn ? 'সতর্কতা: দীর্ঘ সময় উপবাস বা খাবার বাদ দেওয়া নিষিদ্ধ।' : 'Safety rule: Prolonged fasting >12h is strictly contraindicated.'}
              </p>
            )}
          </div>

          {/* Sulfonylurea Active */}
          <div className="p-3 rounded-xl border bg-muted/30 space-y-2">
            <label className="text-xs font-bold text-foreground block">
              {bn ? 'সালফোনাইলইউরিয়া ওষুধ খাচ্ছেন? (Glimepiride/Gliclazide)' : 'Active Sulfonylurea Therapy?'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAnswer('safety_sulfonylurea_active', 'yes')}
                className={`py-1.5 px-3 text-xs font-semibold rounded-lg border transition-all ${
                  functionalAnswers['safety_sulfonylurea_active'] === 'yes'
                    ? 'border-amber-500 bg-amber-500 text-white font-bold'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {bn ? 'হ্যাঁ' : 'Yes'}
              </button>
              <button
                type="button"
                data-testid="safety-sulfonylurea-no"
                onClick={() => setAnswer('safety_sulfonylurea_active', 'no')}
                className={`py-1.5 px-3 text-xs font-semibold rounded-lg border transition-all ${
                  functionalAnswers['safety_sulfonylurea_active'] === 'no'
                    ? 'border-primary bg-primary text-primary-foreground font-bold'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {bn ? 'না' : 'No'}
              </button>
            </div>
          </div>

          {/* Hospital Feeding Route */}
          <div className="p-3 rounded-xl border bg-muted/30 space-y-2">
            <label className="text-xs font-bold text-foreground block">
              {bn ? 'খাদ্য গ্রহণের বর্তমান রুট (Feeding Route)' : 'Hospital Feeding Route'}
            </label>
            <select
              data-testid="safety-feeding-route"
              value={functionalAnswers['safety_hospital_feeding_route'] || patient.feeding_status?.route || 'oral_standard'}
              onChange={(e) => {
                const route = e.target.value as FeedingRouteType;
                setAnswer('safety_hospital_feeding_route', route);
                updatePatient({
                  feeding_status: {
                    route,
                    oral_intake_permitted: route === 'oral_standard' || route === 'modified_texture_soft',
                    requires_specialist_support: route.includes('tube') || route.includes('tpn') || route.includes('npo')
                  }
                });
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="oral_standard">Oral Standard (Normal oral diet)</option>
              <option value="modified_texture_soft">Oral Modified Texture (Soft / Pureed)</option>
              <option value="npo_nil_per_os">NPO Strict (Nothing by mouth)</option>
              <option value="enteral_tube_nasogastric">Enteral Tube (NG Tube / PEG)</option>
              <option value="parenteral_total_tpn">Parenteral Nutrition (TPN / IV)</option>
            </select>
          </div>

          {/* Dysphagia / Choking Risk */}
          <div className="p-3 rounded-xl border bg-muted/30 space-y-2">
            <label className="text-xs font-bold text-foreground block">
              {bn ? 'খাবার গিলতে কষ্ট বা বিষম খাওয়ার সমস্যা (Dysphagia)?' : 'Dysphagia / Choking Risk?'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAnswer('safety_dysphagia_choking_risk', 'yes')}
                className={`py-1.5 px-3 text-xs font-semibold rounded-lg border transition-all ${
                  functionalAnswers['safety_dysphagia_choking_risk'] === 'yes'
                    ? 'border-rose-500 bg-rose-500 text-white font-bold'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {bn ? 'হ্যাঁ (কষ্ট হয়)' : 'Yes (Dysphagia)'}
              </button>
              <button
                type="button"
                data-testid="safety-dysphagia-no"
                onClick={() => setAnswer('safety_dysphagia_choking_risk', 'no')}
                className={`py-1.5 px-3 text-xs font-semibold rounded-lg border transition-all ${
                  functionalAnswers['safety_dysphagia_choking_risk'] === 'no'
                    ? 'border-primary bg-primary text-primary-foreground font-bold'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {bn ? 'না (স্বাভাবিক)' : 'No'}
              </button>
            </div>
          </div>

          {/* Prescribed Fluid Limit */}
          <div className="p-3 rounded-xl border bg-muted/30 space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-foreground block">
              {bn ? 'চিকিৎসক কর্তৃক তরল পানের দৈনিক সীমাবদ্ধতা (Fluid Restriction)?' : 'Prescribed Fluid Restriction?'}
            </label>
            <div className="grid grid-cols-2 gap-2 max-w-xs">
              <button
                type="button"
                onClick={() => setAnswer('safety_prescribed_fluid_limit', 'yes')}
                className={`py-1.5 px-3 text-xs font-semibold rounded-lg border transition-all ${
                  functionalAnswers['safety_prescribed_fluid_limit'] === 'yes'
                    ? 'border-amber-500 bg-amber-500 text-white font-bold'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {bn ? 'হ্যাঁ (নির্দিষ্ট সীমা)' : 'Yes (Restricted)'}
              </button>
              <button
                type="button"
                data-testid="safety-fluid-limit-no"
                onClick={() => setAnswer('safety_prescribed_fluid_limit', 'no')}
                className={`py-1.5 px-3 text-xs font-semibold rounded-lg border transition-all ${
                  functionalAnswers['safety_prescribed_fluid_limit'] === 'no'
                    ? 'border-primary bg-primary text-primary-foreground font-bold'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {bn ? 'না (স্বাভাবিক)' : 'No'}
              </button>
            </div>
            {functionalAnswers['safety_prescribed_fluid_limit'] === 'yes' && (
              <div className="pt-2">
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  {bn ? 'দৈনিক সর্বোচ্চ তরলের পরিমাণ (মিলি/দিন):' : 'Prescribed Maximum Fluid (mL/day):'}
                </label>
                <input
                  type="number"
                  value={functionalAnswers['safety_prescribed_fluid_limit_ml'] || ''}
                  onChange={(e) => setAnswer('safety_prescribed_fluid_limit_ml', e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-36 px-2.5 py-1.5 text-xs rounded-xl border bg-background text-foreground font-bold focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <button
          type="button"
          onClick={() => setCurrentStep('step_demographics')}
          className="px-4 py-2 border rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition-all flex items-center gap-1.5"
        >
          <span>←</span>
          <span>{bn ? 'পূর্ববর্তী: জনমিতি' : 'Previous: Demographics'}</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentStep('step_functional')}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-all flex items-center gap-1.5"
        >
          <span>{bn ? 'পরবর্তী: ফাংশনাল মূল্যায়ন' : 'Next: Functional Assessment'}</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
