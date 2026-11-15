'use client';

import React, { useState } from 'react';
import { usePractice } from '@/context/PracticeContext';
import { useAssessment } from '@/context/AssessmentContext';
import { searchMedications, MedicationSearchResult } from '@/engine/medicationSearch';
import { FeedingRouteType } from '@/types/clinical';
import {
  ShieldAlert,
  AlertTriangle,
  Pill,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  AlertOctagon
} from 'lucide-react';

const COMMON_ALLERGENS = [
  { id: 'egg', label_en: 'Egg (Hen/Duck)', label_bn: 'ডিম' },
  { id: 'shrimp', label_en: 'Shrimp / Prawn / Shellfish', label_bn: 'চিংড়ি / কাঁকড়া' },
  { id: 'peanut', label_en: 'Peanuts', label_bn: 'চিনাবাদাম' },
  { id: 'dairy', label_en: 'Cow Milk / Dairy Protein', label_bn: 'গরুর দুধের প্রোটিন' },
  { id: 'gluten', label_en: 'Wheat Gluten / Celiac', label_bn: 'গমের গ্লুটেন' },
  { id: 'beef', label_en: 'Beef', label_bn: 'গরুর মাংস' },
  { id: 'hilsa', label_en: 'Hilsa / Ilish Fish', label_bn: 'ইলিশ মাছ' },
  { id: 'soy', label_en: 'Soy / Soybean', label_bn: 'সয়াবিন' }
];

export const StepHistorySafety: React.FC = () => {
  const { patient, updatePatient, language } = usePractice();
  const { setCurrentStep, setAnswer, functionalAnswers } = useAssessment();
  const bn = language === 'bn';

  // Medication search state
  const [medQuery, setMedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MedicationSearchResult[]>([]);

  const handleMedSearch = (q: string) => {
    setMedQuery(q);
    if (q.trim().length >= 2) {
      const res = searchMedications(q, 8);
      setSearchResults(res);
    } else {
      setSearchResults([]);
    }
  };

  const handleAddMedication = (med: MedicationSearchResult) => {
    const canonicalName = med.genericName;
    if (!patient.active_medications.includes(canonicalName)) {
      updatePatient({
        active_medications: [...patient.active_medications, canonicalName]
      });
    }
    setMedQuery('');
    setSearchResults([]);
  };

  const handleRemoveMedication = (name: string) => {
    updatePatient({
      active_medications: patient.active_medications.filter(m => m !== name)
    });
  };

  const handleToggleAllergy = (allergyId: string) => {
    let updated: string[];
    if (patient.confirmed_allergies.includes(allergyId)) {
      updated = patient.confirmed_allergies.filter(a => a !== allergyId);
    } else {
      updated = [...patient.confirmed_allergies, allergyId];
    }
    updatePatient({ confirmed_allergies: updated });
    setAnswer('safety_confirmed_allergies', updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-foreground">
          {bn ? 'ধাপ ৩: চিকিৎসা ইতিহাস ও জরুরি নিরাপত্তা স্ক্রিনিং' : 'Step 3: Medical History & Mandatory Clinical Safety'}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {bn
            ? 'প্রধান অভিযোগ, সক্রিয় ওষুধ, নিশ্চিত অ্যালার্জি এবং ইনসুলিন/হাইপোগ্লাইসেমিয়া সংক্রান্ত উচ্চ-ঝুঁকিপূর্ণ নিরাপত্তা প্রশ্নাবলি পূরণ করুন।'
            : 'Capture chief complaints, active medications, confirmed allergies, and high-priority medication safety checks.'}
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

      {/* 2. Confirmed Allergies (Non-overridable) */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            {bn ? '২. নিশ্চিত খাদ্য অ্যালার্জি (অপরিবর্তনীয় রেড স্টপ)' : '2. Confirmed Food Allergies (Non-Overrideable HARD STOP)'}
          </h4>
          <span className="text-[10px] font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
            {patient.confirmed_allergies.length} {bn ? 'টি নিশ্চিত অ্যালার্জি' : 'Allergies Active'}
          </span>
        </div>

        <p className="text-[11px] text-muted-foreground">
          {bn
            ? 'রোগীর নিশ্চিত এলার্জিক খাদ্যসমূহ ক্লিক করে চিহ্নিত করুন। এসব খাবার ডায়েট চার্টে সম্পূর্ণ নিষিদ্ধ থাকবে এবং কোনো অবস্থাতেই বিকল্প হিসেবে দেওয়া হবে না।'
            : 'Select any confirmed food allergies. These foods will be strictly blocked across all meal scaling and exchange engines.'}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {COMMON_ALLERGENS.map((allergy) => {
            const isChecked = patient.confirmed_allergies.includes(allergy.id);
            return (
              <button
                key={allergy.id}
                type="button"
                onClick={() => handleToggleAllergy(allergy.id)}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                  isChecked
                    ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold shadow-sm'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <span>{bn ? allergy.label_bn : allergy.label_en}</span>
                {isChecked ? (
                  <CheckCircle2 className="h-4 w-4 text-rose-500 flex-shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-muted-foreground/30 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Medication Reconciliation (P0 Integrated) */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Pill className="h-4 w-4 text-primary" />
          {bn ? '৩. প্রেসক্রিপশন ওষুধ রিকনসিলিয়েশন (মেডিনিউট্রিশন ৩২,৪৬১ ব্র্যান্ড ইনডেক্স)' : '3. Medication Reconciliation (MediNutrition V5 Index)'}
        </h4>

        {/* Live Search Bar */}
        <div className="relative">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-background">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={medQuery}
              onChange={(e) => handleMedSearch(e.target.value)}
              placeholder={bn ? "ব্র্যান্ড বা জেনেরিক নাম লিখুন (যেমন: Napa, Metfo, Thyrox, Seclo, Insulin)..." : "Search 32,461 Bangladesh brands or generics (e.g., Napa, Metfo, Thyrox, Seclo)..."}
              className="w-full text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Search Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-card border rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-border">
              {searchResults.map((m, idx) => (
                <div
                  key={`${m.brandName}_${idx}`}
                  onClick={() => handleAddMedication(m)}
                  className="p-2.5 hover:bg-muted/60 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <div className="font-bold text-foreground">
                      {m.brandName}{' '}
                      <span className="font-normal text-muted-foreground">({m.genericName})</span>
                    </div>
                    {m.manufacturer && (
                      <div className="text-[10px] text-muted-foreground">{m.manufacturer}</div>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    m.hasDedicatedRules
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {m.hasDedicatedRules ? 'Rules Active' : 'Verified Generic'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Meds List */}
        {patient.active_medications.length > 0 ? (
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-semibold text-muted-foreground">
              {bn ? 'সক্রিয় ওষুধসমূহ:' : 'Current Active Medications:'}
            </div>
            <div className="flex flex-wrap gap-2">
              {patient.active_medications.map(name => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 text-primary text-xs font-semibold border border-primary/20"
                >
                  <span>{name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMedication(name)}
                    className="hover:text-rose-500 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground italic">
            {bn ? 'কোনো ওষুধ যোগ করা হয়নি।' : 'No active medications currently selected.'}
          </p>
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
