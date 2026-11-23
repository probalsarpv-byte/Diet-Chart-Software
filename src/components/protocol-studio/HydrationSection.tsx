'use client';

import React, { useState } from 'react';
import { HydrationProtocol, HydrationEvent } from '@/types/r4Protocol';
import { 
  Droplet, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  X,
  CheckCircle2
} from 'lucide-react';

interface HydrationSectionProps {
  hydration: HydrationProtocol;
  onChange: (updated: HydrationProtocol) => void;
  language: 'bn' | 'en';
}

export const HydrationSection: React.FC<HydrationSectionProps> = ({
  hydration,
  onChange,
  language
}) => {
  const bn = language === 'bn';
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTime, setNewTime] = useState('10:30');
  const [newVolume, setNewVolume] = useState(250);
  const [newType, setNewType] = useState<HydrationEvent['type']>('plain_water');
  const [newMealRel, setNewMealRel] = useState<HydrationEvent['meal_relation']>('between_meals');
  const [newInstrEn, setNewInstrEn] = useState('');
  const [newInstrBn, setNewInstrBn] = useState('');

  const ceilingLimit = hydration.clinician_fluid_limit_ml || hydration.baseline_fluid_target_ml;
  const isOverCeiling = hydration.is_restricted && hydration.total_scheduled_ml > ceilingLimit;
  const progressPct = Math.min(100, Math.round((hydration.total_scheduled_ml / ceilingLimit) * 100));

  const handleDeleteEvent = (id: string) => {
    const updatedEvents = hydration.hydration_events.filter(e => e.id !== id);
    const newTotal = updatedEvents.reduce((s, e) => s + (e.volume_ml || 0), 0);
    onChange({
      ...hydration,
      hydration_events: updatedEvents,
      total_scheduled_ml: newTotal
    });
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: HydrationEvent = {
      id: `hyd_${Date.now()}`,
      time: newTime,
      volume_ml: newVolume,
      type: newType,
      instructions_en: newInstrEn || `Drink ${newVolume} mL slowly between meals.`,
      instructions_bn: newInstrBn || `${newVolume} মি.লি. পানি ধীরে ধীরে পান করুন।`,
      meal_relation: newMealRel
    };

    const updatedEvents = [...hydration.hydration_events, newEvent].sort((a, b) => a.time.localeCompare(b.time));
    const newTotal = updatedEvents.reduce((s, ev) => s + (ev.volume_ml || 0), 0);

    onChange({
      ...hydration,
      hydration_events: updatedEvents,
      total_scheduled_ml: newTotal
    });

    setShowAddForm(false);
    setNewInstrEn('');
    setNewInstrBn('');
  };

  return (
    <div className="space-y-6">
      {/* ── Fluid Metrics & Clinical Restriction Banner ── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
              <Droplet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">
                  {bn ? 'হাইড্রেশন ও তরল ভারসাম্য প্রোটোকল' : 'Personalized Hydration & Fluid Architecture'}
                </h2>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                  hydration.is_restricted ? 'bg-amber-500 text-black' : 'bg-cyan-500 text-white'
                }`}>
                  {hydration.is_restricted ? (bn ? 'ক্লিনিক্যাল সীমাবদ্ধতা' : 'Restricted Ceiling') : (bn ? 'সাধারণ' : 'Standard')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {bn ? 'পাকস্থলীর অ্যাসিড রক্ষা, ইলেক্ট্রোলাইট পর্যবেক্ষণ ও রেনাল লোড সমন্বয়' : 'Gastric acid integrity preservation, electrolyte monitoring, and cardiorenal volume control'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-1.5 shrink-0 transition-all shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>{bn ? 'নতুন পানি গ্রহণ সময় যোগ করুন' : 'Add Hydration Event'}</span>
          </button>
        </div>

        {/* Fluid Volume Target vs Scheduled Comparison */}
        <div className="bg-background border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              {bn ? 'নির্ধারিত দৈনিক তরল:' : 'Scheduled Fluid Volume:'}{' '}
              <span className={`font-extrabold text-sm ${isOverCeiling ? 'text-rose-500 font-black' : 'text-cyan-500'}`}>
                {hydration.total_scheduled_ml} mL
              </span>
            </span>
            <span className="text-muted-foreground">
              {bn ? 'নির্ধারিত সীমা / লক্ষ্য:' : 'Clinical Target Ceiling:'}{' '}
              <span className="font-bold text-foreground">{ceilingLimit} mL</span>
            </span>
          </div>

          {/* Visual Progress Bar */}
          <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isOverCeiling ? 'bg-rose-500' : progressPct > 80 ? 'bg-cyan-500' : 'bg-cyan-400'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {isOverCeiling && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>
                {bn
                  ? `সতর্কতা (হার্ড স্টপ): নির্ধারিত তরল (${hydration.total_scheduled_ml} মি.লি.) অনুমোদিত সীমা (${ceilingLimit} মি.লি.) অতিক্রম করেছে!`
                  : `Hard Stop Violation: Scheduled total fluid (${hydration.total_scheduled_ml} mL) exceeds clinical restriction ceiling (${ceilingLimit} mL)!`}
              </span>
            </div>
          )}

          {hydration.restriction_reason_en && (
            <p className="text-[11px] text-muted-foreground italic">
              <span className="font-semibold">{bn ? 'সীমাবদ্ধতার কারণ: ' : 'Restriction Rationale: '}</span>
              {bn ? hydration.restriction_reason_bn : hydration.restriction_reason_en}
            </p>
          )}
        </div>
      </div>

      {/* ── Add Hydration Event Form Modal ── */}
      {showAddForm && (
        <form onSubmit={handleAddEvent} className="bg-card border border-cyan-500/40 rounded-2xl p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-foreground">
              {bn ? 'নতুন পানি/তরল গ্রহণ শিডিউল করুন' : 'Schedule Hydration Event'}
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {bn ? 'সময় *' : 'Time *'}
              </label>
              <input
                type="time"
                required
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {bn ? 'পরিমাণ (mL) *' : 'Volume (mL) *'}
              </label>
              <input
                type="number"
                min={50}
                max={1000}
                step={50}
                required
                value={newVolume}
                onChange={(e) => setNewVolume(parseInt(e.target.value, 10) || 250)}
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {bn ? 'তরলের ধরন' : 'Fluid Type'}
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
              >
                <option value="plain_water">Plain Water</option>
                <option value="mineral_water">Mineral Water</option>
                <option value="herbal_infusion">Herbal Infusion</option>
                <option value="electrolyte_monitored">Electrolyte Monitored</option>
                <option value="with_medication">With Medication</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {bn ? 'খাবারের সাথে সম্পর্ক' : 'Meal Relation'}
              </label>
              <select
                value={newMealRel}
                onChange={(e) => setNewMealRel(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
              >
                <option value="waking">On Waking</option>
                <option value="between_meals">Between Meals</option>
                <option value="pre_meal">30m Pre-Meal</option>
                <option value="post_meal">60m Post-Meal</option>
                <option value="exercise_session">Exercise Session</option>
                <option value="bedtime">Bedtime Minimal</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-secondary text-foreground"
            >
              {bn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs"
            >
              {bn ? 'সংরক্ষণ করুন' : 'Add Event'}
            </button>
          </div>
        </form>
      )}

      {/* ── Hydration Events Table / Cards ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">
            {bn ? 'দৈনিক পানি ও তরল গ্রহণের সূচি' : 'Scheduled Daily Hydration Timetable'}
          </span>
          <span className="text-xs text-muted-foreground">
            {hydration.hydration_events.length} {bn ? 'টি ইভেন্ট' : 'events'}
          </span>
        </div>

        <div className="divide-y divide-border">
          {hydration.hydration_events.map((evt) => (
            <div key={evt.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-secondary/20 transition-all">
              <div className="flex items-center gap-3">
                <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-500 font-mono">
                  {evt.time}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {evt.volume_ml} mL
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-0.5 rounded-full bg-secondary">
                      {evt.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ({evt.meal_relation.replace(/_/g, ' ')})
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {bn ? evt.instructions_bn : evt.instructions_en}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDeleteEvent(evt.id)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                title={bn ? 'মুছে ফেলুন' : 'Delete'}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
