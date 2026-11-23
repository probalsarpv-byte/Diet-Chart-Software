'use client';

import React from 'react';
import { PatientProfile } from '@/types';
import { Pill, Clock, Lock, ShieldAlert, AlertTriangle, ArrowRight } from 'lucide-react';

interface MedicationTimingSectionProps {
  patient: PatientProfile;
  onNavigateTab: (tabId: string) => void;
  language: 'bn' | 'en';
}

export const MedicationTimingSection: React.FC<MedicationTimingSectionProps> = ({
  patient,
  onNavigateTab,
  language
}) => {
  const bn = language === 'bn';

  const medications = (patient.medication_records && patient.medication_records.length > 0)
    ? patient.medication_records.map(m => ({
        name: m.medication_name,
        dose: m.dose,
        frequency: m.frequency,
        timing: (m.timing && m.timing.includes(':')) ? m.timing : undefined,
        route: m.route || 'Oral'
      }))
    : (patient.active_medications || []).map(m => {
        const str = typeof m === 'string' ? m : (m as any).medication_name || (m as any).name || '';
        return {
          name: str,
          dose: (m as any).dose || 'Prescribed',
          frequency: (m as any).frequency || 'Daily',
          timing: (m as any).timing && (m as any).timing.includes(':') ? (m as any).timing : undefined,
          route: 'Oral'
        };
      });

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Pill className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              {bn ? 'প্রেসক্রিপশন ওষুধ ও ড্রাগ-নিউট্রিয়েন্ট টাইমিং' : 'Prescription Medications & Chronotherapy Spacing'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {bn ? 'প্রেসক্রিপশন ওষুধের সময় অপরিবর্তনীয়; সাপ্লিমেন্ট ও খাদ্যের সময় এর সাথে সমন্বয় করতে হবে।' : 'Prescription dosing times are clinically anchored. Nutritional supplements and meals are rescheduled around them.'}
            </p>
          </div>
        </div>
      </div>

      {/* Medication List */}
      <div className="space-y-3">
        {medications.length === 0 ? (
          <div className="p-8 text-center bg-card border border-border rounded-2xl">
            <p className="text-xs text-muted-foreground">
              {bn ? 'এই রোগীর জন্য কোনো সক্রিয় প্রেসক্রিপশন ওষুধ নথিভুক্ত নেই।' : 'No active prescription medications documented for this patient.'}
            </p>
          </div>
        ) : (
          medications.map((med, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                {med.timing ? (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 font-mono flex items-center gap-1 shrink-0">
                    <Clock className="h-3 w-3" />
                    {med.timing}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-500 flex items-center gap-1.5 shrink-0 border border-amber-500/30">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>{bn ? 'অজ্ঞাত — ওষুধের সময়সূচী পর্যালোচনা প্রয়োজন' : 'UNKNOWN — MEDICATION TIMING REQUIRES REVIEW'}</span>
                  </span>
                )}
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {med.name} <span className="text-xs font-normal text-muted-foreground">({med.dose})</span>
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {bn ? 'ফ্রিকোয়েন্সি: ' : 'Frequency: '} {med.frequency} • {bn ? 'রুট: ' : 'Route: '} {med.route}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold px-2.5 py-1 rounded-lg bg-secondary shrink-0">
                <Lock className="h-3.5 w-3.5" />
                <span>{med.timing ? (bn ? 'লকড শিডিউল' : 'Anchored Time') : (bn ? 'পর্যালোচনা আবশ্যক' : 'Review Required')}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mandatory Separation Rules Reference */}
      <div className="p-5 rounded-2xl bg-secondary/30 border border-border space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
          {bn ? 'বাধ্যতামূলক ড্রাগ-নিউট্রিয়েন্ট সেপারেশন গাইডলাইন (Clinical Rules)' : 'Mandatory Clinical Drug-Nutrient Separation Rules'}
        </h3>
        <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-5 leading-relaxed">
          <li>
            <strong className="text-foreground">Levothyroxine (Thyrox/Eltroxin):</strong> {bn ? 'ক্যালসিয়াম, আয়রন, ম্যাগনেসিয়াম ও কফি/চা থেকে কমপক্ষে ৪ ঘণ্টার ব্যবধান রাখতে হবে।' : 'Minimum 4 hours separation from Calcium, Iron, Magnesium, and Coffee/tea.'}
          </li>
          <li>
            <strong className="text-foreground">Bisphosphonates (Alendronate):</strong> {bn ? 'ঘুম থেকে উঠে শুধুমাত্র সাধারণ পানি দিয়ে সেবন; খাদ্য বা অন্য কোনো কিছু খাওয়ার পূর্বে কমপক্ষে ৬০ মিনিট ব্যবধান।' : 'Full glass of plain water upon waking; minimum 60 minutes before any food, supplement, or other medication.'}
          </li>
          <li>
            <strong className="text-foreground">Oral Antibiotics vs Probiotics:</strong> {bn ? 'অ্যান্টিবায়োটিকের ধ্বংসাত্মক প্রভাব এড়াতে প্রোবায়োটিক গ্রহণের মাঝে কমপক্ষে ২ ঘণ্টার ব্যবধান আবশ্যক।' : 'Minimum 2 hours separation to prevent antibiotic neutralization of live probiotic cultures.'}
          </li>
          <li>
            <strong className="text-foreground">Calcium vs Iron:</strong> {bn ? 'উভয়েই একই রিসেপ্টরে প্রতিযোগিতা করে, তাই কমপক্ষে ২ ঘণ্টার ব্যবধানে সেবন করতে হবে।' : 'Minimum 2 hours separation to avoid competitive DMT1 absorption blockage.'}
          </li>
        </ul>
      </div>
    </div>
  );
};
