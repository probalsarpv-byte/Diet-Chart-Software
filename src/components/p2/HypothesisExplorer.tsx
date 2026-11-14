'use client';

import React, { useState } from 'react';
import { ClinicalHypothesis, ClinicalObservation, ClinicianDecision } from '../../engine/p2/types';

const CLUSTER_COLORS: Record<string, string> = {
  gastrointestinal: 'bg-emerald-500/15 text-emerald-400',
  metabolic: 'bg-orange-500/15 text-orange-400',
  nutritional: 'bg-lime-500/15 text-lime-400',
  immune_inflammatory: 'bg-rose-500/15 text-rose-400',
  endocrine_hormonal: 'bg-purple-500/15 text-purple-400',
  hepatic_biotransformation: 'bg-amber-500/15 text-amber-400',
  sleep_stress_circadian: 'bg-indigo-500/15 text-indigo-400',
  medication_supplement: 'bg-sky-500/15 text-sky-400',
  musculoskeletal: 'bg-teal-500/15 text-teal-400',
  environmental_behavioral: 'bg-slate-500/15 text-slate-400',
};

const EVIDENCE_BADGE: Record<string, { label_en: string; label_bn: string; cls: string }> = {
  sufficient: { label_en: 'Sufficient', label_bn: 'পর্যাপ্ত', cls: 'bg-emerald-500/15 text-emerald-400' },
  some: { label_en: 'Some', label_bn: 'কিছু', cls: 'bg-amber-500/15 text-amber-400' },
  limited: { label_en: 'Limited', label_bn: 'সীমিত', cls: 'bg-orange-500/15 text-orange-400' },
  insufficient: { label_en: 'Insufficient', label_bn: 'অপর্যাপ্ত', cls: 'bg-rose-500/15 text-rose-400' },
  not_applicable: { label_en: 'N/A', label_bn: 'প্রযোজ্য নয়', cls: 'bg-slate-500/15 text-slate-400' },
};

const DECISION_BADGE: Record<string, { label_en: string; label_bn: string; cls: string }> = {
  accepted: { label_en: 'Accepted', label_bn: 'গৃহীত', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  rejected: { label_en: 'Rejected', label_bn: 'প্রত্যাখ্যাত', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  uncertain: { label_en: 'Uncertain', label_bn: 'অনিশ্চিত', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  more_info_needed: { label_en: 'More Info Needed', label_bn: 'আরও তথ্য প্রয়োজন', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  pending: { label_en: 'Pending', label_bn: 'অপেক্ষমান', cls: 'bg-slate-500/20 text-slate-300 border-slate-500/40' },
};

interface Props {
  hypotheses: ClinicalHypothesis[];
  observations: ClinicalObservation[];
  onDecision: (id: string, decision: ClinicianDecision, note?: string) => void;
  lang: 'bn' | 'en';
}

export const HypothesisExplorer: React.FC<Props> = ({ hypotheses, observations, onDecision, lang }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const obsMap = new Map(observations.map(o => [o.id, o]));

  if (hypotheses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {lang === 'bn' ? 'কোনো ক্লিনিক্যাল হাইপোথিসিস তৈরি হয়নি।' : 'No clinical hypotheses generated.'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hypotheses.map(h => {
        const isOpen = expanded === h.id;
        const clusterCls = CLUSTER_COLORS[h.cluster] || 'bg-slate-500/15 text-slate-400';
        const evidBadge = EVIDENCE_BADGE[h.evidenceSupportLevel] || EVIDENCE_BADGE.insufficient;
        const decBadge = DECISION_BADGE[h.clinicianDecision] || DECISION_BADGE.pending;

        return (
          <div key={h.id} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="p-4 flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${clusterCls}`}>
                  {h.cluster.replace(/_/g, ' ')}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${evidBadge.cls}`}>
                  {lang === 'bn' ? evidBadge.label_bn : evidBadge.label_en}
                </span>
                {h.clinicianDecision && h.clinicianDecision !== 'pending' && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${decBadge.cls}`}>
                    {lang === 'bn' ? decBadge.label_bn : decBadge.label_en}
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-sm">
                {lang === 'bn' ? h.title_bn : h.title_en}
              </h3>

              {/* Evidence counts */}
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="text-emerald-400">✓ {h.supportingObservationIds.length} {lang === 'bn' ? 'সমর্থন' : 'supporting'}</span>
                <span className="text-rose-400">✗ {h.contradictoryObservationIds.length} {lang === 'bn' ? 'বিরোধী' : 'contradictory'}</span>
                <span className="text-amber-400">? {h.missingEvidence.length} {lang === 'bn' ? 'অনুপস্থিত' : 'missing'}</span>
              </div>

              {/* Expand */}
              <button
                onClick={() => setExpanded(isOpen ? null : h.id)}
                className="text-xs text-primary hover:underline text-left"
              >
                {isOpen ? (lang === 'bn' ? '▲ সংকোচন' : '▲ Collapse') : (lang === 'bn' ? '▼ প্রমাণ দেখুন' : '▼ View Evidence')}
              </button>
            </div>

            {/* Expanded evidence */}
            {isOpen && (
              <div className="border-t border-border bg-background/50 p-4 space-y-3">
                {h.supportingObservationIds.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-400 mb-1">
                      {lang === 'bn' ? 'সমর্থনকারী পর্যবেক্ষণ' : 'Supporting Observations'}
                    </p>
                    <ul className="space-y-1">
                      {h.supportingObservationIds.map(id => {
                        const obs = obsMap.get(id);
                        return (
                          <li key={id} className="text-xs text-muted-foreground pl-3 border-l-2 border-emerald-500/40">
                            {obs ? `${obs.category}: ${String(obs.observedValue)}${obs.unit ? ` ${obs.unit}` : ''}` : id}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {h.contradictoryObservationIds.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-rose-400 mb-1">
                      {lang === 'bn' ? 'বিরোধী পর্যবেক্ষণ' : 'Contradictory Observations'}
                    </p>
                    <ul className="space-y-1">
                      {h.contradictoryObservationIds.map(id => {
                        const obs = obsMap.get(id);
                        return (
                          <li key={id} className="text-xs text-muted-foreground pl-3 border-l-2 border-rose-500/40">
                            {obs ? `${obs.category}: ${String(obs.observedValue)}${obs.unit ? ` ${obs.unit}` : ''}` : id}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Clinician actions */}
                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    {lang === 'bn' ? 'চিকিৎসকের সিদ্ধান্ত' : 'Clinician Decision'}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(['accepted', 'rejected', 'uncertain', 'more_info_needed'] as ClinicianDecision[]).map(d => (
                      <button
                        key={d}
                        onClick={() => onDecision(h.id, d, noteInputs[h.id])}
                        className={`text-xs px-3 py-1 rounded-lg font-medium transition-all border ${
                          h.clinicianDecision === d
                            ? DECISION_BADGE[d].cls
                            : 'border-border text-muted-foreground hover:bg-card/80'
                        }`}
                      >
                        {lang === 'bn' ? DECISION_BADGE[d].label_bn : DECISION_BADGE[d].label_en}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder={lang === 'bn' ? 'নোট যোগ করুন...' : 'Add note...'}
                    value={noteInputs[h.id] || ''}
                    onChange={e => setNoteInputs(prev => ({ ...prev, [h.id]: e.target.value }))}
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
