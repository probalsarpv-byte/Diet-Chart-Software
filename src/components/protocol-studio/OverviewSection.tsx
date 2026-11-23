'use client';

import React from 'react';
import { R4ProtocolStudioData } from '@/types/r4Protocol';
import { 
  Sparkles, 
  Activity, 
  Moon, 
  Droplet, 
  Pill, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface OverviewSectionProps {
  protocol: R4ProtocolStudioData;
  onNavigateTab: (tabId: string) => void;
  language: 'bn' | 'en';
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  protocol,
  onNavigateTab,
  language
}) => {
  const bn = language === 'bn';
  const { lifestyle, exercise, sleep, hydration, supplements, chronotherapy_timeline, safety_evaluation } = protocol;

  const activeRecsCount = lifestyle.recommendations.filter(r => r.is_active).length;
  const activeExCount = exercise.items.filter(e => e.approval_status !== 'contraindicated').length;
  const activeSuppsCount = supplements.filter(s => s.approval_status !== 'rejected' && s.approval_status !== 'discontinued').length;

  return (
    <div className="space-y-6">
      {/* ── Clinical Safety Banner ── */}
      <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
        safety_evaluation.overall_status === 'HARD_STOP'
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
          : safety_evaluation.overall_status === 'REQUIRES_REVIEW'
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
          : safety_evaluation.overall_status === 'CAUTION'
          ? 'bg-blue-500/10 border-blue-500/30 text-blue-500'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-background/80 flex items-center justify-center shrink-0 border border-current shadow-xs">
            {safety_evaluation.overall_status === 'HARD_STOP' ? (
              <ShieldAlert className="h-6 w-6 text-rose-500" />
            ) : safety_evaluation.overall_status === 'REQUIRES_REVIEW' ? (
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            ) : (
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                {bn ? 'ক্লিনিক্যাল সেফটি মূল্যায়ন' : 'Clinical Safety Clearance'}
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                safety_evaluation.overall_status === 'HARD_STOP'
                  ? 'bg-rose-500 text-white'
                  : safety_evaluation.overall_status === 'REQUIRES_REVIEW'
                  ? 'bg-amber-500 text-black'
                  : 'bg-emerald-500 text-white'
              }`}>
                {safety_evaluation.overall_status}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {safety_evaluation.can_approve
                ? (bn ? 'প্রোটোকলটিতে কোনো হার্ড স্টপ নেই। অনুমোদনের যোগ্য।' : 'Zero clinical hard stops detected. Eligible for clinician sign-off.')
                : (bn ? `মনোযোগ: ${safety_evaluation.hard_stops.length}টি হার্ড স্টপ রয়েছে যা সংশোধন না করলে অনুমোদন করা যাবে না।` : `Blocked: ${safety_evaluation.hard_stops.length} unresolved hard stop(s) prevent protocol approval.`)}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('safety')}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-background hover:bg-secondary text-foreground border border-border flex items-center gap-1.5 shrink-0 transition-all shadow-xs"
        >
          <span>{bn ? 'সেফটি রিপোর্ট দেখুন' : 'Review Safety Audit'}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Domain Summary Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Lifestyle & Daily Routine */}
        <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg">
                {activeRecsCount} {bn ? 'টি সক্রিয়' : 'Active'}
              </span>
            </div>
            <h3 className="font-bold text-base text-foreground mb-1">
              {bn ? 'লাইফস্টাইল ও আচরণবিধি' : 'Lifestyle & Behavioral Routine'}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {bn ? lifestyle.overall_focus_bn : lifestyle.overall_focus_en}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('lifestyle')}
            className="w-full mt-2 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground flex items-center justify-center gap-1.5 transition-all"
          >
            <span>{bn ? 'লাইফস্টাইল সম্পাদনা' : 'Manage Lifestyle'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Card 2: Exercise & Movement */}
        <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Activity className="h-5 w-5" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                exercise.overall_safety_status === 'HARD_STOP'
                  ? 'bg-rose-500/20 text-rose-500'
                  : exercise.overall_safety_status === 'REQUIRES_CLINICAL_REVIEW'
                  ? 'bg-amber-500/20 text-amber-500'
                  : 'bg-emerald-500/20 text-emerald-500'
              }`}>
                {exercise.cardiorespiratory_clearance_status.replace(/_/g, ' ')}
              </span>
            </div>
            <h3 className="font-bold text-base text-foreground mb-1">
              {bn ? 'শরীরচর্চা ও মুভমেন্ট প্রেসক্রিপশন' : 'Exercise & Movement Safety'}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {exercise.weekly_aerobic_minutes_target}m {bn ? 'বায়বীয় / সপ্তাহ' : 'aerobic/wk'} • {exercise.weekly_resistance_sessions_target} {bn ? 'শক্তি সেশন' : 'strength sessions'}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('exercise')}
            className="w-full mt-2 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground flex items-center justify-center gap-1.5 transition-all"
          >
            <span>{bn ? 'শরীরচর্চা সম্পাদনা' : 'Manage Exercise'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Card 3: Sleep & Chronobiology */}
        <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Moon className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-purple-500 bg-purple-500/10 px-2.5 py-1 rounded-lg">
                {sleep.target_sleep_hours}h {bn ? 'ঘুম লক্ষ্য' : 'Target'}
              </span>
            </div>
            <h3 className="font-bold text-base text-foreground mb-1">
              {bn ? 'ঘুম ও সার্কাডিয়ান ক্রোনোবায়োলজি' : 'Sleep & Circadian Rhythm'}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {bn ? 'ঘুম থেকে ওঠা:' : 'Wake:'} {sleep.wake_time} • {bn ? 'ঘুমানো:' : 'Bed:'} {sleep.bed_time} • {bn ? 'ক্যাফেইন কার্ফু:' : 'Caffeine cutoff:'} {sleep.caffeine_curfew_time}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('sleep')}
            className="w-full mt-2 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground flex items-center justify-center gap-1.5 transition-all"
          >
            <span>{bn ? 'ঘুম শিডিউল সম্পাদনা' : 'Manage Sleep'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Card 4: Hydration Protocol */}
        <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                <Droplet className="h-5 w-5" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                hydration.is_restricted ? 'bg-amber-500/20 text-amber-500' : 'bg-cyan-500/20 text-cyan-500'
              }`}>
                {hydration.is_restricted ? (bn ? 'ক্লিনিক্যাল সীমাবদ্ধতা' : 'Restricted') : (bn ? 'সাধারণ' : 'Standard')}
              </span>
            </div>
            <h3 className="font-bold text-base text-foreground mb-1">
              {bn ? 'হাইড্রেশন ও তরল গ্রহণ' : 'Hydration & Fluid Balance'}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {hydration.total_scheduled_ml} mL / {hydration.clinician_fluid_limit_ml || hydration.baseline_fluid_target_ml} mL {bn ? 'দৈনিক' : 'target/day'}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('hydration')}
            className="w-full mt-2 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground flex items-center justify-center gap-1.5 transition-all"
          >
            <span>{bn ? 'হাইড্রেশন সম্পাদনা' : 'Manage Hydration'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Card 5: Supplements Protocol */}
        <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Pill className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                {activeSuppsCount} {bn ? 'সাপ্লিমেন্ট' : 'Supplements'}
              </span>
            </div>
            <h3 className="font-bold text-base text-foreground mb-1">
              {bn ? 'টার্গেটেড সাপ্লিমেন্ট প্রেসক্রিপশন' : 'Targeted Supplement Protocols'}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {bn ? 'ডিএনআই ঘাটতি ও লক্ষ্যের ভিত্তিতে সক্রিয় ফর্মুলেশন' : 'DNI depletions & condition-targeted elemental dosages'}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('supplements')}
            className="w-full mt-2 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground flex items-center justify-center gap-1.5 transition-all"
          >
            <span>{bn ? 'সাপ্লিমেন্ট সম্পাদনা' : 'Manage Supplements'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Card 6: 24-Hour Chronotherapy Timeline */}
        <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                {chronotherapy_timeline.length} {bn ? 'ইভেন্ট' : 'Timeline Events'}
              </span>
            </div>
            <h3 className="font-bold text-base text-foreground mb-1">
              {bn ? '২৪ ঘণ্টার ক্রোনোথেরাপি টাইমলাইন' : '24-Hour Chronotherapy Timeline'}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {bn ? 'ওষুধ, সাপ্লিমেন্ট, খাবার ও ঘুমের সংঘাতমুক্ত সমন্বয়' : 'Integrated timing conflict detection & circadian synchronization'}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('chronotherapy')}
            className="w-full mt-2 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground flex items-center justify-center gap-1.5 transition-all"
          >
            <span>{bn ? 'টাইমলাইন দেখুন' : 'Open 24h Timeline'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
