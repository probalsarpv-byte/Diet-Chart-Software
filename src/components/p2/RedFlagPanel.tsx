'use client';

import React from 'react';
import { ClinicalRedFlag } from '../../engine/p2/types';

const URGENCY_STYLES: Record<string, string> = {
  immediate: 'bg-rose-500 text-white border-rose-600',
  urgent: 'bg-orange-500/15 text-orange-400 border-orange-500/40',
  routine: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
  monitoring: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
};

const URGENCY_LABELS: Record<string, { en: string; bn: string }> = {
  immediate: { en: 'IMMEDIATE', bn: 'জরুরি' },
  urgent: { en: 'Urgent', bn: 'অতি জরুরি' },
  routine: { en: 'Routine', bn: 'নিয়মিত' },
  monitoring: { en: 'Monitoring', bn: 'পর্যবেক্ষণ' },
};

interface Props {
  redFlags: ClinicalRedFlag[];
  lang: 'bn' | 'en';
}

export const RedFlagPanel: React.FC<Props> = ({ redFlags, lang }) => {
  const immediateFlags = redFlags.filter(f => f.urgency === 'immediate');
  const otherFlags = redFlags.filter(f => f.urgency !== 'immediate');

  if (redFlags.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 flex items-center gap-3">
        <span className="text-2xl">✅</span>
        <div>
          <p className="font-semibold text-emerald-400">
            {lang === 'bn' ? 'কোনো গুরুত্বপূর্ণ নিরাপত্তা উদ্বেগ চিহ্নিত হয়নি' : 'No critical safety concerns identified'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lang === 'bn' ? 'বর্তমান তথ্যের ভিত্তিতে কোনো জরুরি রেড ফ্ল্যাগ নেই।' : 'No immediate red flags based on current data.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Immediate alert banner */}
      {immediateFlags.length > 0 && (
        <div className="rounded-xl border-2 border-rose-600 bg-rose-500/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🚨</span>
            <h3 className="font-bold text-rose-400 text-sm uppercase tracking-wide">
              {lang === 'bn' ? 'তাৎক্ষণিক মনোযোগ প্রয়োজন' : 'Immediate Attention Required'}
            </h3>
          </div>
          <div className="space-y-3">
            {immediateFlags.map(flag => (
              <div key={flag.id} className="rounded-lg bg-rose-500/10 border border-rose-500/40 p-3">
                <p className="font-semibold text-sm text-rose-300">
                  {lang === 'bn' ? flag.title_bn : flag.title_en}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {lang === 'bn' ? flag.recommendedAction_bn : flag.recommendedAction_en}
                </p>
                {flag.triggeringObservationIds.length > 0 && (
                  <p className="text-[10px] text-rose-400/70 mt-1">
                    {lang === 'bn' ? 'ট্রিগার:' : 'Triggers:'} {flag.triggeringObservationIds.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other flags */}
      {otherFlags.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            {lang === 'bn' ? 'অতিরিক্ত পর্যবেক্ষণ' : 'Additional Flags'}
          </h3>
          {otherFlags.map(flag => {
            const urgStyle = URGENCY_STYLES[flag.urgency] || URGENCY_STYLES.monitoring;
            const urgLabel = URGENCY_LABELS[flag.urgency] || URGENCY_LABELS.monitoring;
            return (
              <div key={flag.id} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${urgStyle}`}>
                    {lang === 'bn' ? urgLabel.bn : urgLabel.en}
                  </span>
                  <span className="font-semibold text-sm">
                    {lang === 'bn' ? flag.title_bn : flag.title_en}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {lang === 'bn' ? flag.recommendedAction_bn : flag.recommendedAction_en}
                </p>
                {flag.triggeringObservationIds.length > 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    {lang === 'bn' ? 'ট্রিগার:' : 'Triggers:'} {flag.triggeringObservationIds.join(', ')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
