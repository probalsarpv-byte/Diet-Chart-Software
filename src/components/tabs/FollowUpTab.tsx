'use client';

import React, { useState } from 'react';
import { usePractice } from '@/context/PracticeContext';
import { CLINICAL_PHASES, compareLongitudinalProgress } from '@/engine/phaseProgression';
import { 
  TrendingUp, 
  ArrowRight, 
  Calendar, 
  Plus, 
  CheckCircle, 
  Flame, 
  Sparkles, 
  ShieldCheck,
  Activity,
  Award
} from 'lucide-react';
import { LongitudinalVisit } from '@/types';

export const FollowUpTab: React.FC = () => {
  const { patient, visits, addVisit, advancePatientPhase, language } = usePractice();
  const bn = language === 'bn';

  const [showAddVisitModal, setShowAddVisitModal] = useState(false);
  const [newWeight, setNewWeight] = useState<number>(patient.weight_kg);
  const [newWaist, setNewWaist] = useState<number>(patient.waist_cm);
  const [newStool, setNewStool] = useState<number>(patient.gut_profile.bristol_stool_score);
  const [newEnergy, setNewEnergy] = useState<number>(patient.gut_profile.energy_score);
  const [newRelief, setNewRelief] = useState<number>(50);
  const [newNotes, setNewNotes] = useState<string>('');

  const currentPhaseInfo = CLINICAL_PHASES[patient.current_phase];

  // Compare progress
  const comparison = compareLongitudinalProgress([
    {
      visit_id: 'v_baseline',
      visit_date: patient.visit_date,
      phase: 1,
      weight_kg: patient.weight_kg,
      waist_cm: patient.waist_cm,
      whtr: patient.calculated.whtr,
      bristol_stool: patient.gut_profile.bristol_stool_score,
      energy_score: patient.gut_profile.energy_score,
      symptom_relief_pct: 0,
      homa_ir: patient.labs.homa_ir,
      tg_hdl_ratio: patient.labs.tg_hdl_ratio,
      hba1c: patient.labs.hba1c
    },
    ...visits
  ]);

  const handleSaveVisit = () => {
    const today = new Date().toISOString().split('T')[0];
    const whtr = Math.round((newWaist / patient.height_cm) * 100) / 100;

    const newV: LongitudinalVisit = {
      visit_id: `v_${Date.now()}`,
      visit_date: today,
      phase: patient.current_phase,
      weight_kg: newWeight,
      waist_cm: newWaist,
      whtr,
      bristol_stool: newStool,
      energy_score: newEnergy,
      symptom_relief_pct: newRelief,
      homa_ir: patient.labs.homa_ir,
      tg_hdl_ratio: patient.labs.tg_hdl_ratio,
      hba1c: patient.labs.hba1c,
      notes_bn: newNotes || 'ফলো-আপ ভিজিট সম্পন্ন; সাধারণ স্বাস্থ্য অগ্রগতি রেকর্ড করা হয়েছে।',
      notes_en: newNotes || 'Follow-up consultation logged.'
    };

    addVisit(newV);
    setShowAddVisitModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Care Phase Progress Pipeline */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-bold text-sm text-foreground">
                {bn ? '৪-পর্যায়ের ক্লিনিক্যাল কেয়ার প্রোগ্রাম (Phases 1 to 4)' : '4-Phase Clinical Care Progression'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {bn ? 'কার্যকরী নিরাময়, অন্ত্র পুনর্বাসন ও টেকসই মেটাবলিক রূপান্তর' : 'Systematic Gut Reset, Metabolic Rebuild & Maintenance'}
              </p>
            </div>
          </div>

          {patient.current_phase < 4 ? (
            <button
              onClick={advancePatientPhase}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition"
            >
              <Sparkles className="h-4 w-4" />
              <span>{bn ? `১-ক্লিক পরবর্তী ফেজে রূপান্তর (Phase ${patient.current_phase + 1})` : `1-Click Next Phase (${patient.current_phase + 1})`}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-500 font-bold text-xs border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              <span>{bn ? 'চূড়ান্ত ফেজ ৪ সক্রিয় (আজীবন সুস্থতা)' : 'Phase 4 Active (Maintenance)'}</span>
            </span>
          )}
        </div>

        {/* 4 Phase Pipeline Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {([1, 2, 3, 4] as const).map(pNum => {
            const info = CLINICAL_PHASES[pNum];
            const isCurrent = patient.current_phase === pNum;
            const isCompleted = patient.current_phase > pNum;

            return (
              <div
                key={pNum}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'bg-primary/10 border-primary ring-2 ring-primary/40 shadow-sm'
                    : isCompleted
                    ? 'bg-secondary/40 border-emerald-500/30 text-muted-foreground'
                    : 'bg-background/50 border-dashed text-muted-foreground/60'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      isCurrent 
                        ? 'bg-primary text-primary-foreground' 
                        : isCompleted 
                        ? 'bg-emerald-500/20 text-emerald-500' 
                        : 'bg-secondary text-muted-foreground'
                    }`}>
                      {isCompleted ? 'COMPLETED' : isCurrent ? 'ACTIVE PHASE' : `PHASE ${pNum}`}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{info.duration_weeks}</span>
                  </div>

                  <h3 className={`font-semibold text-xs leading-snug mt-2 ${isCurrent ? 'text-primary font-bold' : 'text-foreground'}`}>
                    {bn ? info.title_bn : info.title_en}
                  </h3>

                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    {bn ? info.core_focus_bn : info.core_focus_en}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-border/50 text-[10px]">
                  <strong className="text-foreground">{bn ? 'খাদ্য সংযোজন:' : 'Allowed Foods:'} </strong>
                  <span className="text-muted-foreground">{bn ? info.allowed_reintroductions_bn : info.allowed_reintroductions_en}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Longitudinal Delta Comparison Cards */}
      {comparison && (
        <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span>{bn ? 'বেসলাইন বনাম বর্তমান ফলো-আপ ডেল্টা মেট্রিক্স' : 'Baseline vs Current Follow-Up Deltas'}</span>
            </div>
            <button
              onClick={() => setShowAddVisitModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition"
            >
              <Plus className="h-3.5 w-3.5 text-primary" />
              <span>{bn ? 'নতুন ফলো-আপ ভিজিট রেকর্ড' : 'Log New Visit'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            
            <div className="p-3.5 rounded-xl border bg-background space-y-1">
              <div className="text-[11px] text-muted-foreground">{bn ? 'ওজন পরিবর্তন (Weight Δ):' : 'Weight Delta:'}</div>
              <div className="text-lg font-bold text-emerald-500">
                {comparison.weightDeltaKg > 0 ? `+${comparison.weightDeltaKg}` : comparison.weightDeltaKg} kg
              </div>
              <div className="text-[10px] text-muted-foreground">
                {comparison.weightDeltaPct}% {bn ? 'পরিবর্তন' : 'change'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border bg-background space-y-1">
              <div className="text-[11px] text-muted-foreground">{bn ? 'কোমর অনুপাত (WHtR Δ):' : 'WHtR Delta:'}</div>
              <div className={`text-lg font-bold ${comparison.whtrDelta <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {comparison.whtrDelta > 0 ? `+${comparison.whtrDelta}` : comparison.whtrDelta}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {bn ? 'ভিসেরাল ফ্যাট হ্রাস' : 'Visceral fat impact'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border bg-background space-y-1">
              <div className="text-[11px] text-muted-foreground">{bn ? 'ব্রিস্টল স্টুল উন্নতি:' : 'Bristol Stool Δ:'}</div>
              <div className="text-lg font-bold text-blue-500">
                Type {comparison.baselineVisit.bristol_stool} ➔ {comparison.latestVisit.bristol_stool}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {comparison.latestVisit.bristol_stool === 4 ? (bn ? 'আদর্শ টাইপ ৪' : 'Optimal Type 4') : (bn ? 'উন্নতিশীল' : 'Improving')}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border bg-background space-y-1">
              <div className="text-[11px] text-muted-foreground">{bn ? 'উপসর্গ নিরাময় (Relief):' : 'Symptom Relief:'}</div>
              <div className="text-lg font-bold text-purple-500">
                +{comparison.latestVisit.symptom_relief_pct}%
              </div>
              <div className="text-[10px] text-muted-foreground">
                {bn ? 'রোগীর স্বস্তি রেটিং' : 'Self-reported relief'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border bg-background space-y-1">
              <div className="text-[11px] text-muted-foreground">HOMA-IR Δ:</div>
              <div className="text-lg font-bold text-amber-500">
                {patient.labs.homa_ir || 'N/A'}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {bn ? 'ইনসুলিন সংবেদনশীলতা' : 'Insulin sensitivity'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border bg-background space-y-1">
              <div className="text-[11px] text-muted-foreground">TG / HDL Δ:</div>
              <div className="text-lg font-bold text-rose-500">
                {patient.labs.tg_hdl_ratio || 'N/A'}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {bn ? 'এথেরোজেনিক মার্কার' : 'Atherogenic index'}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. Longitudinal Visit Logs Table */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{bn ? 'লংগিটিউডিনাল কনসালটেশন ও ফলো-আপ লগ' : 'Longitudinal Consultation History'}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {visits.length + 1} {bn ? 'টি ভিজিট রেকর্ড সংরক্ষিত' : 'visits on file'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/30 text-muted-foreground border-b text-[11px]">
              <tr>
                <th className="py-2.5 px-4 font-semibold">{bn ? 'তারিখ' : 'Date'}</th>
                <th className="py-2.5 px-3 font-semibold">{bn ? 'ফেজ' : 'Phase'}</th>
                <th className="py-2.5 px-3 font-semibold">{bn ? 'ওজন' : 'Weight'}</th>
                <th className="py-2.5 px-3 font-semibold">{bn ? 'কোমর (WHtR)' : 'Waist (WHtR)'}</th>
                <th className="py-2.5 px-3 font-semibold">{bn ? 'ব্রিস্টল স্টুল' : 'Bristol Stool'}</th>
                <th className="py-2.5 px-3 font-semibold">{bn ? 'উপশম %' : 'Relief %'}</th>
                <th className="py-2.5 px-4 font-semibold">{bn ? 'ক্লিনিক্যাল নোট' : 'Clinical Notes'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {/* Baseline row */}
              <tr className="hover:bg-accent/20">
                <td className="py-3 px-4 font-bold text-foreground">
                  {patient.visit_date} (Baseline)
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px]">
                    Phase 1
                  </span>
                </td>
                <td className="py-3 px-3 font-semibold">{patient.weight_kg} kg</td>
                <td className="py-3 px-3">{patient.waist_cm} cm ({patient.calculated.whtr})</td>
                <td className="py-3 px-3">Type {patient.gut_profile.bristol_stool_score}</td>
                <td className="py-3 px-3">Baseline</td>
                <td className="py-3 px-4 text-muted-foreground">
                  {bn ? 'প্রাথমিক পূর্ণাঙ্গ মূল্যায়ন ও ফেজ ১ প্রেসক্রিপশন প্রদান।' : 'Initial comprehensive functional nutrition intake.'}
                </td>
              </tr>

              {/* Follow-up rows */}
              {visits.map((v, idx) => (
                <tr key={v.visit_id || idx} className="hover:bg-accent/20">
                  <td className="py-3 px-4 font-bold text-foreground">
                    {v.visit_date}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px]">
                      Phase {v.phase}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold">{v.weight_kg} kg</td>
                  <td className="py-3 px-3">{v.waist_cm} cm ({v.whtr})</td>
                  <td className="py-3 px-3">Type {v.bristol_stool}</td>
                  <td className="py-3 px-3 text-emerald-500 font-bold">+{v.symptom_relief_pct}%</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {bn ? v.notes_bn : v.notes_en}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Log Follow-Up Modal */}
      {showAddVisitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-foreground">
                {bn ? 'নতুন ফলো-আপ ভিজিট সংরক্ষণ করুন' : 'Log Follow-Up Visit'}
              </h3>
              <button 
                onClick={() => setShowAddVisitModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-muted-foreground block mb-1">
                    {bn ? 'নতুন ওজন (কেজি):' : 'Weight (kg):'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newWeight}
                    onChange={e => setNewWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-background border rounded-lg focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-medium text-muted-foreground block mb-1">
                    {bn ? 'নতুন কোমর (সেমি):' : 'Waist (cm):'}
                  </label>
                  <input
                    type="number"
                    value={newWaist}
                    onChange={e => setNewWaist(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-background border rounded-lg focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-muted-foreground block mb-1">
                    {bn ? 'ব্রিস্টল স্টুল স্কেল (১-৭):' : 'Bristol Stool (1-7):'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={newStool}
                    onChange={e => setNewStool(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-background border rounded-lg focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-medium text-muted-foreground block mb-1">
                    {bn ? 'উপসর্গ উপশম % (Relief):' : 'Symptom Relief %:'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    value={newRelief}
                    onChange={e => setNewRelief(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-background border rounded-lg focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-muted-foreground block mb-1">
                  {bn ? 'ক্লিনিক্যাল মন্তব্য / রোগীর প্রতিক্রিয়া:' : 'Clinical Notes / Patient Feedback:'}
                </label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder={bn ? 'ওজন হ্রাস, পেটের ফোলাভাব বা এনার্জির উন্নতি...' : 'Improvements in bloating, sleep, energy...'}
                  className="w-full px-3 py-2 bg-background border rounded-lg focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowAddVisitModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-secondary transition"
              >
                {bn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveVisit}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition"
              >
                {bn ? 'সংরক্ষণ করুন' : 'Save Visit'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

