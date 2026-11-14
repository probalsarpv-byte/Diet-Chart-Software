'use client';

import React from 'react';
import { usePractice } from '@/context/PracticeContext';
import { 
  Pill, 
  Clock, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Sparkles, 
  Calendar,
  Coffee,
  Heart
} from 'lucide-react';

export const DNITab: React.FC = () => {
  const { allMedicines, patient, toggleMedication, dniResult, language } = usePractice();
  const bn = language === 'bn';

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Medication Selector Grid */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Pill className="h-4 w-4 text-primary" />
            <span>{bn ? 'প্রেসক্রিপশন ওষুধ নির্বাচন (Medex & Bangladesh Generic Data)' : 'Active Prescription Medications (Medex BD)'}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {bn ? 'ওষুধ-পুষ্টি মিথস্ক্রিয়া (DNI) যাচাই করতে ওষুধ নির্বাচন করুন' : 'Select all current medications to detect depletions'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allMedicines.map(med => {
            const isSelected = patient.active_medications.some(m => 
              m === med.id || m.toLowerCase() === med.generic_name.toLowerCase()
            );
            return (
              <button
                key={med.id}
                type="button"
                onClick={() => toggleMedication(med.id)}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  isSelected 
                    ? 'bg-primary/10 border-primary shadow-sm ring-1 ring-primary/40' 
                    : 'bg-background hover:bg-secondary/40 text-muted-foreground'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-semibold text-xs ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {med.generic_name}
                    </span>
                    <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${
                      isSelected ? 'bg-primary text-white' : 'border border-muted-foreground/30'
                    }`}>
                      {isSelected ? '✓' : ''}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mb-1.5 font-medium">
                    {med.drug_class}
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {bn ? med.mechanism_bn : med.mechanism_en}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                  <span className="font-semibold text-foreground">{bn ? 'বাংলাদেশি ব্র্যান্ড:' : 'BD Brands:'} </span>
                  {med.brand_names_bd.slice(0, 4).join(', ')}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Critical Spacing & Absorption Alerts */}
      {dniResult.criticalWarnings.length > 0 && (
        <div className="space-y-3">
          {dniResult.criticalWarnings.map((warn, idx) => (
            <div key={idx} className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs text-foreground leading-relaxed">
                <span className="font-bold text-rose-500 block mb-0.5">
                  {bn ? 'জরুরি সেবন ব্যবধান ও ক্লিনিক্যাল সতর্কতা:' : 'Critical Timing & Separation Protocol:'}
                </span>
                {bn ? warn.warning_bn : warn.warning_en}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Nutrient Depletions & Orthomolecular Supplements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Depletions */}
        <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs border-b pb-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>{bn ? 'ওষুধজনিত মাইক্রোনিউট্রিয়েন্ট ঘাটতি (Nutrient Depletions)' : 'Drug-Induced Nutrient Depletions'}</span>
          </div>

          {dniResult.depletions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              {bn ? 'কোনো ওষুধ নির্বাচন করা হয়নি বা কোনো ঘাটতি শনাক্ত হয়নি।' : 'No active depletions flagged.'}
            </p>
          ) : (
            <div className="space-y-3">
              {dniResult.depletions.map((dep, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border bg-secondary/30 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground text-sm">{dep.depletion.nutrient}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-rose-500/15 text-rose-500 uppercase">
                      {dep.depletion.severity} Depletion
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    <strong className="text-foreground">{dep.medicineName}</strong> {bn ? 'ওষুধ ব্যবহারের ফলে:' : 'induced mechanism:'}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {bn ? dep.depletion.reason_bn : dep.depletion.reason_en}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Targeted Orthomolecular Supplements */}
        <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs border-b pb-3">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <span>{bn ? 'টার্গেটেড অর্থোমলিকুলার সাপ্লিমেন্ট (বাংলাদেশে ভেরিফাইড ব্র্যান্ড)' : 'Targeted Orthomolecular Supplements (BD Brands)'}</span>
          </div>

          <div className="space-y-3">
            {dniResult.recommendedSupplements.map(supp => (
              <div key={supp.id} className="p-3.5 rounded-xl border bg-background text-xs space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-foreground text-sm">
                      {bn ? supp.name_bn : supp.name_en}
                    </h4>
                    <span className="text-[11px] text-muted-foreground">{supp.category}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-semibold">
                    {supp.recommended_dose}
                  </span>
                </div>

                <div className="text-[11px] text-muted-foreground bg-secondary/40 p-2 rounded-lg leading-relaxed">
                  <strong>{bn ? 'সেবন সময় ও প্রোটোকল: ' : 'Timing & Note: '}</strong>
                  {bn ? supp.timing_note_bn : supp.timing_note_en}
                </div>

                <div className="flex items-center gap-1.5 text-[11px]">
                  <strong className="text-foreground">{bn ? 'ভেরিফাইড ব্র্যান্ড:' : 'Verified BD Brands:'}</strong>
                  <div className="flex flex-wrap gap-1">
                    {supp.verified_bd_brands.map((b, bIdx) => (
                      <span key={bIdx} className="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-medium text-[10px]">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. Visual 24-Hour Daily Gantt/Schedule Timeline */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>{bn ? '২৪ ঘণ্টার দৈনিক ওষুধ, সাপ্লিমেন্ট ও খাদ্য রুটিন (Visual Timeline)' : 'Visual 24-Hour Pill, Supplement & Meal Timeline'}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {bn ? 'সঠিক সময়ের ব্যবধানে শোষণ ১০০% বৃদ্ধি পায়' : 'Chronological Absorption Synchronization'}
          </span>
        </div>

        <div className="relative border-l-2 border-primary/30 ml-4 sm:ml-6 pl-4 sm:pl-6 space-y-6 py-2">
          {dniResult.timeline.map((item, idx) => {
            const isMed = item.category === 'medication';
            const isSupp = item.category === 'supplement';
            const isMeal = item.category === 'meal';
            const isProto = item.category === 'protocol';

            const dotColor = isMed 
              ? 'bg-rose-500' 
              : isSupp 
              ? 'bg-emerald-500' 
              : isMeal 
              ? 'bg-blue-500' 
              : 'bg-amber-500';

            return (
              <div key={idx} className="relative group">
                {/* Timeline Dot */}
                <div className={`absolute -left-[25px] sm:-left-[33px] top-1.5 h-4 w-4 rounded-full border-2 border-background ${dotColor} shadow`} />

                <div className="p-3.5 rounded-xl border bg-background/70 hover:bg-background hover:shadow-sm transition text-xs space-y-1.5">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground bg-secondary px-2 py-0.5 rounded text-[11px]">
                        {item.time}
                      </span>
                      <h4 className="font-semibold text-foreground text-sm">
                        {bn ? item.title_bn : item.title_en}
                      </h4>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                      isMed ? 'bg-rose-500/15 text-rose-500' : isSupp ? 'bg-emerald-500/15 text-emerald-500' : 'bg-blue-500/15 text-blue-500'
                    }`}>
                      {item.category}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {bn ? item.instructions_bn : item.instructions_en}
                  </p>

                  {item.warning_bn && (
                    <div className="text-[10px] text-rose-500 font-medium bg-rose-500/10 p-1.5 rounded">
                      ⚠️ {bn ? item.warning_bn : item.warning_en}
                    </div>
                  )}

                  {item.verified_products && item.verified_products.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                      <span className="text-muted-foreground font-semibold">{bn ? 'আইটেম / ব্র্যান্ড:' : 'Products:'}</span>
                      {item.verified_products.map((p, pIdx) => (
                        <span key={pIdx} className="px-1.5 py-0.2 rounded bg-secondary text-foreground font-medium">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

