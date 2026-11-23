'use client';

import React, { useState } from 'react';
import { 
  LifestyleProtocol, 
  LifestyleRecommendation, 
  LifestyleCategory 
} from '@/types/r4Protocol';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Clock, 
  Tag, 
  Info,
  HelpCircle
} from 'lucide-react';

interface LifestyleSectionProps {
  lifestyle: LifestyleProtocol;
  onChange: (updated: LifestyleProtocol) => void;
  language: 'bn' | 'en';
}

export const LifestyleSection: React.FC<LifestyleSectionProps> = ({
  lifestyle,
  onChange,
  language
}) => {
  const bn = language === 'bn';
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActionEn, setNewActionEn] = useState('');
  const [newActionBn, setNewActionBn] = useState('');
  const [newCategory, setNewCategory] = useState<LifestyleCategory>('daily_routine');
  const [newFreq, setNewFreq] = useState('Daily');
  const [newTime, setNewTime] = useState('08:00 AM');
  const [newPurposeEn, setNewPurposeEn] = useState('');
  const [newPurposeBn, setNewPurposeBn] = useState('');

  const handleToggleActive = (id: string) => {
    const updated = lifestyle.recommendations.map(r => 
      r.id === id ? { ...r, is_active: !r.is_active } : r
    );
    onChange({ ...lifestyle, recommendations: updated });
  };

  const handleDelete = (id: string) => {
    const updated = lifestyle.recommendations.filter(r => r.id !== id);
    onChange({ ...lifestyle, recommendations: updated });
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionEn.trim() && !newActionBn.trim()) return;

    const newRec: LifestyleRecommendation = {
      id: `custom_rec_${Date.now()}`,
      category: newCategory,
      action_en: newActionEn || newActionBn,
      action_bn: newActionBn || newActionEn,
      suggested_frequency: newFreq,
      suggested_time: newTime,
      expected_purpose_en: newPurposeEn || 'Clinical lifestyle optimization',
      expected_purpose_bn: newPurposeBn || 'জীবনযাত্রা ও আচরণগত উন্নয়ন',
      clinical_rationale_en: 'Clinician individualized behavioral intervention.',
      clinical_rationale_bn: 'ক্লিনিশিয়ান কর্তৃক নির্ধারিত স্বতন্ত্র জীবনযাত্রা নির্দেশিকা।',
      safety_classification: 'SAFE',
      evidence_status: 'expert_consensus',
      is_active: true,
      is_custom: true
    };

    onChange({
      ...lifestyle,
      recommendations: [...lifestyle.recommendations, newRec]
    });

    setNewActionEn('');
    setNewActionBn('');
    setNewPurposeEn('');
    setNewPurposeBn('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* ── Focus Header ── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {bn ? 'লাইফস্টাইল ও আচরণগত প্রোটোকল' : 'Lifestyle & Behavioral Protocols'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {bn ? 'সার্কাডিয়ান সিনক্রোনাইজেশন, ভ্যাগাল স্টিমুলেশন ও আসীন আচরণ হ্রাস' : 'Circadian entrainment, vagal activation, and postural ergonomics'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground flex items-center gap-1.5 shrink-0 transition-all shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>{bn ? 'নতুন আচরণ নির্দেশ যোগ করুন' : 'Add Custom Guidance'}</span>
          </button>
        </div>

        {/* Overall Focus Text Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              {bn ? 'সামগ্রিক প্রোটোকল ফোকাস (বাংলা)' : 'Protocol Core Focus (Bangla)'}
            </label>
            <input
              type="text"
              value={lifestyle.overall_focus_bn}
              onChange={(e) => onChange({ ...lifestyle, overall_focus_bn: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              {bn ? 'সামগ্রিক প্রোটোকল ফোকাস (English)' : 'Protocol Core Focus (English)'}
            </label>
            <input
              type="text"
              value={lifestyle.overall_focus_en}
              onChange={(e) => onChange({ ...lifestyle, overall_focus_en: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* ── Add Custom Guidance Form Modal/Drawer ── */}
      {showAddForm && (
        <form onSubmit={handleAddCustom} className="bg-card border border-primary/40 rounded-2xl p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-foreground">
              {bn ? 'কাস্টম আচরণ নির্দেশ তৈরি করুন' : 'Create Custom Lifestyle Recommendation'}
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
                {bn ? 'আচরণ / নির্দেশ (বাংলা) *' : 'Action Instruction (Bangla) *'}
              </label>
              <input
                type="text"
                required
                value={newActionBn}
                onChange={(e) => setNewActionBn(e.target.value)}
                placeholder="যেমন: প্রতিদিন সকালে ১০ মিনিট মুক্ত বাতাসে বুক ভরে নিঃশ্বাস নেওয়া"
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {bn ? 'আচরণ / নির্দেশ (English) *' : 'Action Instruction (English) *'}
              </label>
              <input
                type="text"
                required
                value={newActionEn}
                onChange={(e) => setNewActionEn(e.target.value)}
                placeholder="e.g. 10 minutes deep outdoor diaphragmatic breathing each morning"
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {bn ? 'বিভাগ' : 'Category'}
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as LifestyleCategory)}
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
              >
                <option value="daily_routine">Daily Routine</option>
                <option value="light_exposure">Light Exposure</option>
                <option value="sedentary_reduction">Sedentary Reduction</option>
                <option value="stress_management">Stress Management</option>
                <option value="work_rest">Work-Rest Balance</option>
                <option value="shift_work">Shift Work Adaptation</option>
                <option value="sleep_hygiene">Sleep Hygiene</option>
                <option value="behavioral_adherence">Behavioral Adherence</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  {bn ? 'ফ্রিকোয়েন্সি' : 'Frequency'}
                </label>
                <input
                  type="text"
                  value={newFreq}
                  onChange={(e) => setNewFreq(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  {bn ? 'সময়' : 'Time'}
                </label>
                <input
                  type="text"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {bn ? 'প্রত্যাশিত উদ্দেশ্য (বাংলা)' : 'Purpose (Bangla)'}
              </label>
              <input
                type="text"
                value={newPurposeBn}
                onChange={(e) => setNewPurposeBn(e.target.value)}
                placeholder="যেমন: মানসিক চাপ ও কর্টিসল নিয়ন্ত্রণ"
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {bn ? 'প্রত্যাশিত উদ্দেশ্য (English)' : 'Purpose (English)'}
              </label>
              <input
                type="text"
                value={newPurposeEn}
                onChange={(e) => setNewPurposeEn(e.target.value)}
                placeholder="e.g. Parasympathetic tone enhancement"
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
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs"
            >
              {bn ? 'সংরক্ষণ করুন' : 'Save Guidance'}
            </button>
          </div>
        </form>
      )}

      {/* ── Recommendations List ── */}
      <div className="space-y-3">
        {lifestyle.recommendations.map((rec) => {
          return (
            <div
              key={rec.id}
              className={`p-4 rounded-2xl border transition-all ${
                rec.is_active
                  ? 'bg-card border-border hover:border-primary/40'
                  : 'bg-muted/30 border-border/50 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={() => handleToggleActive(rec.id)}
                    className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                      rec.is_active
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground/40 bg-background text-transparent'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </button>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-secondary text-foreground uppercase tracking-wider">
                        {rec.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {rec.suggested_time} ({rec.suggested_frequency})
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        {rec.evidence_status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-foreground">
                      {bn ? rec.action_bn : rec.action_en}
                    </h4>

                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground/80">{bn ? 'উদ্দেশ্য: ' : 'Purpose: '}</span>
                      {bn ? rec.expected_purpose_bn : rec.expected_purpose_en}
                    </p>

                    <p className="text-[11px] text-muted-foreground/80 italic">
                      <span className="font-semibold text-foreground/70">{bn ? 'ক্লিনিক্যাল ভিত্তি: ' : 'Rationale: '}</span>
                      {bn ? rec.clinical_rationale_bn : rec.clinical_rationale_en}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                  {rec.is_custom && (
                    <button
                      onClick={() => handleDelete(rec.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                      title={bn ? 'মুছে ফেলুন' : 'Delete'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
