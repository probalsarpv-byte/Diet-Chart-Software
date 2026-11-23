'use client';

import React, { useState } from 'react';
import { 
  ExerciseProtocol, 
  ExerciseItem, 
  ExerciseCategory, 
  ExerciseIntensity 
} from '@/types/r4Protocol';
import { 
  Activity, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Flame, 
  X,
  HeartPulse
} from 'lucide-react';

interface ExerciseSectionProps {
  exercise: ExerciseProtocol;
  onChange: (updated: ExerciseProtocol) => void;
  language: 'bn' | 'en';
}

export const ExerciseSection: React.FC<ExerciseSectionProps> = ({
  exercise,
  onChange,
  language
}) => {
  const bn = language === 'bn';
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitleEn, setNewTitleEn] = useState('');
  const [newTitleBn, setNewTitleBn] = useState('');
  const [newCategory, setNewCategory] = useState<ExerciseCategory>('walking');
  const [newIntensity, setNewIntensity] = useState<ExerciseIntensity>('moderate');
  const [newDuration, setNewDuration] = useState(30);
  const [newFreq, setNewFreq] = useState(5);
  const [newRpe, setNewRpe] = useState(4);
  const [newProgEn, setNewProgEn] = useState('');
  const [newProgBn, setNewProgBn] = useState('');

  const handleDeleteItem = (id: string) => {
    const updated = exercise.items.filter(item => item.id !== id);
    onChange({ ...exercise, items: updated });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleEn.trim() && !newTitleBn.trim()) return;

    const newItem: ExerciseItem = {
      id: `ex_${Date.now()}`,
      category: newCategory,
      title_en: newTitleEn || newTitleBn,
      title_bn: newTitleBn || newTitleEn,
      frequency_per_week: newFreq,
      duration_minutes: newDuration,
      intensity: newIntensity,
      target_rpe: newRpe,
      weekly_progression_en: newProgEn || 'Maintain steady comfortable pace.',
      weekly_progression_bn: newProgBn || 'নিয়মিত ও স্থির গতি বজায় রাখুন।',
      monitoring_instructions_en: 'Monitor heart rate and breathing; stop if dizziness or chest pain occurs.',
      monitoring_instructions_bn: 'হৃদস্পন্দন ও শ্বাস-প্রশ্বাস পর্যবেক্ষণ করুন; বুক ধড়ফড় বা মাথা ঘোরা হলে বন্ধ করুন।',
      stop_conditions_en: ['Acute chest tightness', 'Severe breathlessness', 'Dizziness or lightheadedness'],
      stop_conditions_bn: ['বুকে তীব্র চাপ', 'অতিরিক্ত শ্বাসকষ্ট', 'মাথা ঘোরা'],
      contraindications: [],
      approval_status: 'draft'
    };

    onChange({
      ...exercise,
      items: [...exercise.items, newItem]
    });

    setNewTitleEn('');
    setNewTitleBn('');
    setNewProgEn('');
    setNewProgBn('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* ── Exercise Safety & Targets Header ── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">
                  {bn ? 'শরীরচর্চা ও কার্ডিওরেসপিরেটরি প্রেসক্রিপশন' : 'Cardiorespiratory & Resistance Exercise'}
                </h2>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                  exercise.overall_safety_status === 'HARD_STOP'
                    ? 'bg-rose-500 text-white'
                    : exercise.overall_safety_status === 'REQUIRES_CLINICAL_REVIEW'
                    ? 'bg-amber-500 text-black'
                    : 'bg-emerald-500 text-white'
                }`}>
                  {exercise.overall_safety_status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {bn ? 'ক্লিনিক্যাল ক্লিয়ারেন্স স্ট্যাটাস: ' : 'Clinical Clearance Status: '}
                <span className="font-semibold text-foreground uppercase">
                  {exercise.cardiorespiratory_clearance_status.replace(/_/g, ' ')}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shrink-0 transition-all shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>{bn ? 'নতুন ব্যায়াম যুক্ত করুন' : 'Add Prescribed Exercise'}</span>
          </button>
        </div>

        {/* Weekly Target Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="bg-background border border-border rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-foreground block">
                {bn ? 'সাপ্তাহিক বায়বীয় (এরোবিক) সময়' : 'Weekly Aerobic Target'}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {bn ? 'WHO লক্ষ্য: ১৫০-৩০০ মিনিট' : 'WHO Guideline: 150-300 mins'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={600}
                value={exercise.weekly_aerobic_minutes_target}
                onChange={(e) => onChange({ ...exercise, weekly_aerobic_minutes_target: parseInt(e.target.value, 10) || 0 })}
                className="w-16 px-2 py-1 text-sm font-bold bg-secondary border border-border rounded-lg text-center"
              />
              <span className="text-xs text-muted-foreground font-semibold">min</span>
            </div>
          </div>

          <div className="bg-background border border-border rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-foreground block">
                {bn ? 'সাপ্তাহিক স্ট্রেংথ / রেজিস্ট্যান্স সেশন' : 'Weekly Strength / Resistance'}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {bn ? 'সপ্তাহে ন্যূনতম ২ দিন' : 'Minimum 2 days/week'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={7}
                value={exercise.weekly_resistance_sessions_target}
                onChange={(e) => onChange({ ...exercise, weekly_resistance_sessions_target: parseInt(e.target.value, 10) || 0 })}
                className="w-16 px-2 py-1 text-sm font-bold bg-secondary border border-border rounded-lg text-center"
              />
              <span className="text-xs text-muted-foreground font-semibold">days</span>
            </div>
          </div>
        </div>

        {/* Contraindications Warning Box */}
        {exercise.clinical_contraindications.length > 0 && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{bn ? 'চিকিৎসাগত সম্পূর্ণ নিষেধাজ্ঞা (হার্ড স্টপ)' : 'Clinical Contraindication Alert (Hard Stop)'}</span>
            </div>
            {exercise.clinical_contraindications.map((c, idx) => (
              <p key={idx} className="pl-5 text-[11px]">{c}</p>
            ))}
          </div>
        )}
      </div>

      {/* ── Add Exercise Form Modal/Drawer ── */}
      {showAddForm && (
        <form onSubmit={handleAddItem} className="bg-card border border-emerald-500/40 rounded-2xl p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-foreground">
              {bn ? 'নতুন ব্যায়াম নির্ধারণ করুন' : 'Prescribe New Exercise'}
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {bn ? 'ব্যায়ামের নাম (বাংলা) *' : 'Exercise Title (Bangla) *'}
              </label>
              <input
                type="text"
                required
                value={newTitleBn}
                onChange={(e) => setNewTitleBn(e.target.value)}
                placeholder="যেমন: দ্রুত হাঁটা (ব্রিস্ক ওয়াকিং)"
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {bn ? 'ব্যায়ামের নাম (English) *' : 'Exercise Title (English) *'}
              </label>
              <input
                type="text"
                required
                value={newTitleEn}
                onChange={(e) => setNewTitleEn(e.target.value)}
                placeholder="e.g. Moderate Brisk Walking"
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {bn ? 'বিভাগ' : 'Category'}
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as ExerciseCategory)}
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
              >
                <option value="walking">Walking</option>
                <option value="brisk_walking">Brisk Walking</option>
                <option value="post_meal_walking">Post-Meal Walking (GLUT4)</option>
                <option value="aerobic_conditioning">Aerobic Conditioning</option>
                <option value="resistance_training">Resistance Training</option>
                <option value="mobility">Mobility & Joint Flexibility</option>
                <option value="balance_training">Balance Training (Fall Prevention)</option>
                <option value="low_impact">Low-Impact Rehabilitation</option>
                <option value="breathing_exercises">Breathing & Core Stability</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {bn ? 'তীব্রতা' : 'Intensity'}
              </label>
              <select
                value={newIntensity}
                onChange={(e) => setNewIntensity(e.target.value as ExerciseIntensity)}
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
              >
                <option value="very_light">Very Light</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="vigorous">Vigorous</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  {bn ? 'সময় (মিনিট)' : 'Duration (min)'}
                </label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={newDuration}
                  onChange={(e) => setNewDuration(parseInt(e.target.value, 10) || 30)}
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  {bn ? 'দিন/সপ্তাহ' : 'Freq/wk'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={newFreq}
                  onChange={(e) => setNewFreq(parseInt(e.target.value, 10) || 3)}
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  {bn ? 'বর্গ RPE (১-১০)' : 'Target RPE (1-10)'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={newRpe}
                  onChange={(e) => setNewRpe(parseInt(e.target.value, 10) || 4)}
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {bn ? 'সাপ্তাহিক অগ্রগতি নির্দেশ (বাংলা)' : 'Progression (Bangla)'}
              </label>
              <input
                type="text"
                value={newProgBn}
                onChange={(e) => setNewProgBn(e.target.value)}
                placeholder="যেমন: প্রতি সপ্তাহে ৫ মিনিট করে বৃদ্ধি"
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
              />
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
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              {bn ? 'সংরক্ষণ করুন' : 'Save Exercise'}
            </button>
          </div>
        </form>
      )}

      {/* ── Exercise Items List ── */}
      <div className="space-y-3">
        {exercise.items.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-2xl bg-card border border-border hover:border-emerald-500/40 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {item.category.replace(/_/g, ' ')}
                </span>
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {item.duration_minutes}m • {item.frequency_per_week}x/week
                </span>
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-amber-500" />
                  {item.intensity} {item.target_rpe ? `(RPE ${item.target_rpe}/10)` : ''}
                </span>
              </div>

              <h4 className="text-sm font-bold text-foreground">
                {bn ? item.title_bn : item.title_en}
              </h4>

              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground/80">{bn ? 'সাপ্তাহিক অগ্রগতি: ' : 'Progression: '}</span>
                {bn ? item.weekly_progression_bn : item.weekly_progression_en}
              </p>

              <p className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground/80">{bn ? 'পর্যবেক্ষণ: ' : 'Monitoring: '}</span>
                {bn ? item.monitoring_instructions_bn : item.monitoring_instructions_en}
              </p>

              {item.stop_conditions_en.length > 0 && (
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-rose-500 block">
                    {bn ? 'থামানোর সতর্কতা (Stop Conditions):' : 'Immediate Stop Triggers:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-0.5">
                    {(bn ? item.stop_conditions_bn : item.stop_conditions_en).map((sc, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-medium">
                        {sc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => handleDeleteItem(item.id)}
              className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all self-end md:self-start shrink-0"
              title={bn ? 'মুছে ফেলুন' : 'Delete'}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
