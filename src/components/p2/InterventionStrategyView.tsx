'use client';

import React, { useState } from 'react';
import { InterventionGoal } from '../../engine/p2/types';

const CATEGORY_BADGE: Record<string, string> = {
  dietary_adequacy: 'bg-emerald-500/15 text-emerald-400',
  macronutrient_target: 'bg-lime-500/15 text-lime-400',
  protein_distribution: 'bg-teal-500/15 text-teal-400',
  fiber_adequacy: 'bg-green-500/15 text-green-400',
  meal_timing: 'bg-sky-500/15 text-sky-400',
  hydration: 'bg-blue-500/15 text-blue-400',
  food_trigger_investigation: 'bg-orange-500/15 text-orange-400',
  reintroduction: 'bg-amber-500/15 text-amber-400',
  nutritional_support: 'bg-purple-500/15 text-purple-400',
  metabolic_strategy: 'bg-indigo-500/15 text-indigo-400',
  sleep_circadian: 'bg-violet-500/15 text-violet-400',
  lifestyle_physical_activity: 'bg-pink-500/15 text-pink-400',
  restriction_management: 'bg-rose-500/15 text-rose-400',
  medication_nutrient_review: 'bg-red-500/15 text-red-400',
  lab_followup: 'bg-slate-500/15 text-slate-400',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  rejected: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  modified: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
};

const STATUS_LABELS: Record<string, { en: string; bn: string }> = {
  pending: { en: 'Pending', bn: 'অপেক্ষমান' },
  approved: { en: 'Approved', bn: 'অনুমোদিত' },
  rejected: { en: 'Rejected', bn: 'প্রত্যাখ্যাত' },
  modified: { en: 'Modified', bn: 'পরিবর্তিত' },
};

interface Props {
  goals: InterventionGoal[];
  onApprove: (id: string, status: string, note?: string) => void;
  lang: 'bn' | 'en';
}

export const InterventionStrategyView: React.FC<Props> = ({ goals, onApprove, lang }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  if (goals.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {lang === 'bn' ? 'কোনো হস্তক্ষেপ লক্ষ্যমাত্রা তৈরি হয়নি।' : 'No intervention goals generated.'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {goals.map(goal => {
        const isOpen = expanded === goal.id;
        const catCls = CATEGORY_BADGE[goal.category] || 'bg-slate-500/15 text-slate-400';
        const statusStyle = STATUS_STYLES[goal.clinicianApprovalStatus] || STATUS_STYLES.pending;
        const statusLabel = STATUS_LABELS[goal.clinicianApprovalStatus] || STATUS_LABELS.pending;

        return (
          <div key={goal.id} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-4 flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catCls}`}>
                  {goal.category.replace(/_/g, ' ')}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusStyle}`}>
                  {lang === 'bn' ? statusLabel.bn : statusLabel.en}
                </span>
              </div>

              <h3 className="font-semibold text-sm">
                {lang === 'bn' ? goal.title_bn : goal.title_en}
              </h3>
              <p className="text-xs text-muted-foreground">
                {lang === 'bn' ? goal.clinicalObjective_bn : goal.clinicalObjective_en}
              </p>

              <button
                onClick={() => setExpanded(isOpen ? null : goal.id)}
                className="text-xs text-primary hover:underline text-left"
              >
                {isOpen ? (lang === 'bn' ? '▲ সংকোচন' : '▲ Collapse') : (lang === 'bn' ? '▼ বিস্তারিত' : '▼ Details')}
              </button>
            </div>

            {isOpen && (
              <div className="border-t border-border bg-background/50 p-4 space-y-3">
                {/* Rationale */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    {lang === 'bn' ? 'যুক্তি' : 'Rationale'}
                  </p>
                  <p className="text-xs text-foreground">
                    {lang === 'bn' ? goal.rationale_bn : goal.rationale_en}
                  </p>
                </div>

                {/* Safety */}
                {goal.safetyConsiderations.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-amber-400 mb-1">
                      {lang === 'bn' ? 'নিরাপত্তা বিষয়' : 'Safety Considerations'}
                    </p>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                      {goal.safetyConsiderations.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}

                {/* Monitoring */}
                {goal.monitoringIndicators.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-400 mb-1">
                      {lang === 'bn' ? 'পর্যবেক্ষণ নির্দেশক' : 'Monitoring Indicators'}
                    </p>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                      {goal.monitoringIndicators.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                )}

                {/* Clinician approval */}
                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    {lang === 'bn' ? 'চিকিৎসকের অনুমোদন' : 'Clinician Approval'}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {['approved', 'rejected', 'modified'].map(action => (
                      <button
                        key={action}
                        onClick={() => onApprove(goal.id, action, notes[goal.id])}
                        className={`text-xs px-3 py-1 rounded-lg font-medium border transition-all ${
                          goal.clinicianApprovalStatus === action
                            ? STATUS_STYLES[action]
                            : 'border-border text-muted-foreground hover:bg-card/80'
                        }`}
                      >
                        {lang === 'bn' ? STATUS_LABELS[action].bn : STATUS_LABELS[action].en}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={notes[goal.id] || goal.clinicianNote || ''}
                    onChange={e => setNotes(prev => ({ ...prev, [goal.id]: e.target.value }))}
                    placeholder={lang === 'bn' ? 'নোট...' : 'Clinician note...'}
                    className="w-full text-xs rounded-lg border border-border bg-background px-3 py-1.5 outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
