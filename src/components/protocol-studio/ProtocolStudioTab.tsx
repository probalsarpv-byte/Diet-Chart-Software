'use client';

import React, { useState } from 'react';
import { usePractice } from '@/context/PracticeContext';
import { 
  Sparkles, 
  Activity, 
  Moon, 
  Droplet, 
  Pill, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Save, 
  RotateCcw, 
  FileCheck, 
  FilePlus,
  Lock,
  Layers
} from 'lucide-react';
import { OverviewSection } from './OverviewSection';
import { LifestyleSection } from './LifestyleSection';
import { ExerciseSection } from './ExerciseSection';
import { SleepSection } from './SleepSection';
import { HydrationSection } from './HydrationSection';
import { SupplementsSection } from './SupplementsSection';
import { MedicationTimingSection } from './MedicationTimingSection';
import { ChronotherapySection } from './ChronotherapySection';
import { SafetyReviewSection } from './SafetyReviewSection';
import { recalculateProtocolSafety } from '@/engine/r4ProtocolStudioEngine';
import { ChronotherapyTimelineItem } from '@/types/r4Protocol';

export type ProtocolSubTab =
  | 'overview'
  | 'lifestyle'
  | 'exercise'
  | 'sleep'
  | 'hydration'
  | 'supplements'
  | 'medications'
  | 'chronotherapy'
  | 'safety';

export const ProtocolStudioTab: React.FC = () => {
  const { 
    patient, 
    language, 
    currentClinician,
    r4Protocol,
    updateR4Protocol,
    generateR4Draft,
    createManualR4Protocol,
    saveR4Protocol,
    approveR4Protocol,
    isR4ProtocolDirty
  } = usePractice();

  const bn = language === 'bn';
  const [activeSubTab, setActiveSubTab] = useState<ProtocolSubTab>('overview');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // If no protocol is yet loaded in state, offer immediate auto-generation
  if (!r4Protocol) {
    return (
      <div className="p-8 sm:p-12 text-center bg-card border border-border rounded-3xl max-w-xl mx-auto space-y-4 my-12 shadow-sm">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto mb-2">
          <Sparkles className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {bn ? 'প্রোটোকল স্টুডিও: কোনো সক্রিয় প্রোটোকল নেই' : 'Protocol Studio: No Active Protocol'}
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {bn
            ? 'রোগীর ১৪-ডোমেন অ্যাসেসমেন্ট, ডিএনআই ঘাটতি এবং বর্তমান স্বাস্থ্যের ভিত্তিতে একটি স্বয়ংক্রিয় প্রেসক্রিপশন ড্রাফট তৈরি করুন অথবা নতুন ব্ল্যাঙ্ক প্রোটোকল শুরু করুন।'
            : 'Generate a personalized, rule-based clinical draft combining lifestyle, sleep, exercise, hydration, and supplements, or create a blank clinician protocol.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => generateR4Draft()}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="h-4 w-4" />
            <span>{bn ? 'স্বয়ংক্রিয় ক্লিনিক্যাল ড্রাফট তৈরি করুন' : 'Generate Auto Protocol Draft'}</span>
          </button>
          <button
            onClick={() => createManualR4Protocol()}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border hover:bg-secondary text-foreground flex items-center justify-center gap-2 transition-all"
          >
            <FilePlus className="h-4 w-4" />
            <span>{bn ? 'নতুন খালি প্রোটোকল তৈরি' : 'Create Blank Protocol'}</span>
          </button>
        </div>
      </div>
    );
  }

  // Handle section changes with immediate safety recalculation
  const handleLifestyleChange = (lifestyle: any) => {
    const updated = recalculateProtocolSafety({ ...r4Protocol, lifestyle }, patient);
    updateR4Protocol(updated);
  };

  const handleExerciseChange = (exercise: any) => {
    const updated = recalculateProtocolSafety({ ...r4Protocol, exercise }, patient);
    updateR4Protocol(updated);
  };

  const handleSleepChange = (sleep: any) => {
    const updated = recalculateProtocolSafety({ ...r4Protocol, sleep }, patient);
    updateR4Protocol(updated);
  };

  const handleHydrationChange = (hydration: any) => {
    const updated = recalculateProtocolSafety({ ...r4Protocol, hydration }, patient);
    updateR4Protocol(updated);
  };

  const handleSupplementsChange = (supplements: any) => {
    const updated = recalculateProtocolSafety({ ...r4Protocol, supplements }, patient);
    updateR4Protocol(updated);
  };

  const handleTimelineTimeChange = (item: ChronotherapyTimelineItem, newTime: string) => {
    if (item.category === 'wake') {
      handleSleepChange({ ...r4Protocol.sleep, wake_time: newTime });
    } else if (item.category === 'sleep') {
      handleSleepChange({ ...r4Protocol.sleep, bed_time: newTime });
    } else if (item.category === 'supplement' && item.entity_id) {
      const updatedSupps = r4Protocol.supplements.map(s => 
        s.id === item.entity_id ? { ...s, administration_time: newTime } : s
      );
      handleSupplementsChange(updatedSupps);
    } else if (item.category === 'hydration' && item.entity_id) {
      const updatedEvents = r4Protocol.hydration.hydration_events.map(h => 
        h.id === item.entity_id ? { ...h, time: newTime } : h
      );
      handleHydrationChange({ ...r4Protocol.hydration, hydration_events: updatedEvents });
    }
  };

  const handleSave = async () => {
    try {
      await saveR4Protocol();
      setSaveSuccessMsg(bn ? 'প্রোটোকল সফলভাবে সংরক্ষিত হয়েছে।' : 'Protocol saved successfully.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    }
  };

  const handleApprove = async (notes?: string) => {
    await approveR4Protocol(notes);
    setSaveSuccessMsg(bn ? 'প্রোটোকল আনুষ্ঠানিকভাবে অনুমোদিত হয়েছে।' : 'Protocol formally approved & version incremented.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const subNavItems: Array<{ id: ProtocolSubTab; icon: any; label_bn: string; label_en: string; badge?: string | null }> = [
    { id: 'overview', icon: Layers, label_bn: 'ওভারভিউ', label_en: 'Overview' },
    { id: 'lifestyle', icon: Sparkles, label_bn: 'লাইফস্টাইল', label_en: 'Lifestyle', badge: `${r4Protocol.lifestyle.recommendations.filter(r => r.is_active).length}` },
    { id: 'exercise', icon: Activity, label_bn: 'শরীরচর্চা', label_en: 'Exercise', badge: `${r4Protocol.exercise.items.length}` },
    { id: 'sleep', icon: Moon, label_bn: 'ঘুম ও ছন্দ', label_en: 'Sleep & Rhythm' },
    { id: 'hydration', icon: Droplet, label_bn: 'হাইড্রেশন', label_en: 'Hydration' },
    { id: 'supplements', icon: Pill, label_bn: 'সাপ্লিমেন্ট', label_en: 'Supplements', badge: `${r4Protocol.supplements.length}` },
    { id: 'medications', icon: Pill, label_bn: 'ওষুধ টাইমিং', label_en: 'Med Spacing' },
    { id: 'chronotherapy', icon: Clock, label_bn: '২৪ঘণ্টা টাইমলাইন', label_en: '24h Timeline', badge: r4Protocol.safety_evaluation.timing_conflicts.length > 0 ? 'Alert' : null },
    { id: 'safety', icon: ShieldCheck, label_bn: 'সেফটি ও সাইন-অফ', label_en: 'Safety & Sign-Off', badge: r4Protocol.safety_evaluation.overall_status }
  ];

  return (
    <div className="space-y-6">
      {/* ── Studio Header Bar ── */}
      <div className="bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest">
              PHASE R4: PROTOCOL STUDIO
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-secondary text-foreground">
              v{r4Protocol.version}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
              r4Protocol.is_approved
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
            }`}>
              {r4Protocol.is_approved ? (bn ? 'অনুমোদিত' : 'Approved') : (bn ? 'ড্রাফট' : 'Draft')}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-0.5 rounded-md bg-secondary">
              {r4Protocol.mode.replace(/_/g, ' ')}
            </span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
              r4Protocol.safety_evaluation.overall_status === 'HARD_STOP'
                ? 'bg-rose-500 text-white'
                : r4Protocol.safety_evaluation.overall_status === 'REQUIRES_REVIEW'
                ? 'bg-amber-500 text-black'
                : 'bg-emerald-500 text-white'
            }`}>
              {r4Protocol.safety_evaluation.overall_status}
            </span>
            {isR4ProtocolDirty && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500 text-white animate-pulse">
                {bn ? 'অসংরক্ষিত পরিবর্তন' : 'Unsaved Changes'}
              </span>
            )}
          </div>

          <h1 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
            {bn 
              ? `${patient.name} — লাইফস্টাইল, এক্সারসাইজ, ঘুম ও সাপ্লিমেন্ট প্রোটোকল` 
              : `${patient.name} — Lifestyle, Exercise, Sleep & Supplement Studio`}
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {saveSuccessMsg && (
            <span className="text-xs font-bold text-emerald-500 mr-2 animate-in fade-in">
              ✓ {saveSuccessMsg}
            </span>
          )}

          <button
            onClick={() => generateR4Draft()}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-muted text-foreground flex items-center gap-1.5 transition-all"
            title={bn ? 'নতুন স্বয়ংক্রিয় ড্রাফট তৈরি করুন' : 'Regenerate Draft'}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{bn ? 'রি-জেনারেট ড্রাফট' : 'Regenerate Draft'}</span>
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{bn ? 'সংরক্ষণ করুন' : 'Save Protocol'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('safety')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
              r4Protocol.safety_evaluation.can_approve
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                : 'bg-muted text-muted-foreground opacity-60'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>{bn ? 'অনুমোদন ও লক' : 'Review & Approve'}</span>
          </button>
        </div>
      </div>

      {/* ── Sub-Tab Pill Navigation ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-border">
        {subNavItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{bn ? tab.label_bn : tab.label_en}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : tab.badge === 'Alert' || tab.badge === 'HARD_STOP'
                    ? 'bg-rose-500 text-white'
                    : 'bg-primary/10 text-primary'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Active Sub-Tab Workspace ── */}
      <div className="pt-2">
        {activeSubTab === 'overview' && (
          <OverviewSection
            protocol={r4Protocol}
            onNavigateTab={(tab) => setActiveSubTab(tab as ProtocolSubTab)}
            language={language}
          />
        )}

        {activeSubTab === 'lifestyle' && (
          <LifestyleSection
            lifestyle={r4Protocol.lifestyle}
            onChange={handleLifestyleChange}
            language={language}
          />
        )}

        {activeSubTab === 'exercise' && (
          <ExerciseSection
            exercise={r4Protocol.exercise}
            onChange={handleExerciseChange}
            language={language}
          />
        )}

        {activeSubTab === 'sleep' && (
          <SleepSection
            sleep={r4Protocol.sleep}
            onChange={handleSleepChange}
            language={language}
          />
        )}

        {activeSubTab === 'hydration' && (
          <HydrationSection
            hydration={r4Protocol.hydration}
            onChange={handleHydrationChange}
            language={language}
          />
        )}

        {activeSubTab === 'supplements' && (
          <SupplementsSection
            supplements={r4Protocol.supplements}
            onChange={handleSupplementsChange}
            language={language}
          />
        )}

        {activeSubTab === 'medications' && (
          <MedicationTimingSection
            patient={patient}
            onNavigateTab={(tab) => setActiveSubTab(tab as ProtocolSubTab)}
            language={language}
          />
        )}

        {activeSubTab === 'chronotherapy' && (
          <ChronotherapySection
            timeline={r4Protocol.chronotherapy_timeline}
            onTimeChange={handleTimelineTimeChange}
            language={language}
          />
        )}

        {activeSubTab === 'safety' && (
          <SafetyReviewSection
            evaluation={r4Protocol.safety_evaluation}
            clinician={currentClinician}
            isApproved={r4Protocol.is_approved}
            version={r4Protocol.version}
            onApprove={handleApprove}
            language={language}
          />
        )}
      </div>
    </div>
  );
};
