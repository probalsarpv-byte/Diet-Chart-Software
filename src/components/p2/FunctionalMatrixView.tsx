'use client';

import React, { useState } from 'react';
import { DomainFinding } from '../../engine/p2/types';

const BURDEN_STYLES: Record<string, string> = {
  none: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  mild: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  moderate: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  significant: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

const BURDEN_LABEL: Record<string, { en: string; bn: string }> = {
  none: { en: 'None', bn: 'নেই' },
  mild: { en: 'Mild', bn: 'মৃদু' },
  moderate: { en: 'Moderate', bn: 'মাঝারি' },
  significant: { en: 'Significant', bn: 'উল্লেখযোগ্য' },
};

interface Props {
  domainFindings: DomainFinding[];
  lang: 'bn' | 'en';
}

export const FunctionalMatrixView: React.FC<Props> = ({ domainFindings, lang }) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (domainFindings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {lang === 'bn' ? 'ফাংশনাল ডোমেইন বিশ্লেষণ পাওয়া যায়নি।' : 'No functional domain analysis available.'}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {domainFindings.map((d) => {
        const isOpen = expanded === d.domain;
        const burdenStyle = BURDEN_STYLES[d.overallBurden] || BURDEN_STYLES.none;
        const burdenLabel = BURDEN_LABEL[d.overallBurden] || BURDEN_LABEL.none;

        return (
          <div
            key={d.domain}
            className={`rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm transition-shadow hover:shadow-md ${
              d.overallBurden === 'significant' ? 'border-rose-500/40' :
              d.overallBurden === 'moderate' ? 'border-orange-500/30' : 'border-border'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-sm leading-tight">
                  {lang === 'bn' ? d.domainName_bn : d.domainName_en}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lang === 'bn' ? d.domainName_en : d.domainName_bn}
                </p>
              </div>
              <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${burdenStyle}`}>
                {lang === 'bn' ? burdenLabel.bn : burdenLabel.en}
              </span>
            </div>

            {/* Observation count */}
            <div className="text-xs text-muted-foreground">
              {d.relevantObservations.length}{' '}
              {lang === 'bn' ? 'টি পর্যবেক্ষণ' : 'observations'}
            </div>

            {/* Review flags */}
            {d.clinicalReviewFlags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {d.clinicalReviewFlags.slice(0, 3).map((flag, i) => (
                  <span key={i} className="text-[10px] bg-amber-500/10 text-amber-400 rounded px-1.5 py-0.5 border border-amber-500/20">
                    {flag}
                  </span>
                ))}
                {d.clinicalReviewFlags.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">+{d.clinicalReviewFlags.length - 3}</span>
                )}
              </div>
            )}

            {/* Expand toggle */}
            <button
              onClick={() => setExpanded(isOpen ? null : d.domain)}
              className="text-xs text-primary hover:underline text-left"
            >
              {isOpen
                ? (lang === 'bn' ? '▲ সংকোচন করুন' : '▲ Collapse')
                : (lang === 'bn' ? '▼ বিস্তারিত দেখুন' : '▼ View details')}
            </button>

            {isOpen && (
              <div className="text-xs space-y-2 border-t border-border pt-2 mt-1">
                {d.supportingEvidence.length > 0 && (
                  <div>
                    <p className="font-medium text-emerald-400 mb-1">
                      {lang === 'bn' ? 'সমর্থনকারী প্রমাণ' : 'Supporting Evidence'}
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                      {d.supportingEvidence.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
                {d.missingInformation.length > 0 && (
                  <div>
                    <p className="font-medium text-amber-400 mb-1">
                      {lang === 'bn' ? 'অনুপস্থিত তথ্য' : 'Missing Information'}
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                      {d.missingInformation.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                )}
                {d.furtherAssessmentSuggestions.length > 0 && (
                  <div>
                    <p className="font-medium text-blue-400 mb-1">
                      {lang === 'bn' ? 'পরামর্শ' : 'Suggestions'}
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                      {d.furtherAssessmentSuggestions.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
