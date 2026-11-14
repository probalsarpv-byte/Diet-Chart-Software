'use client';

import React from 'react';

interface Props {
  missingItems: string[];
  lang: 'bn' | 'en';
}

export const MissingDataPanel: React.FC<Props> = ({ missingItems, lang }) => {
  if (missingItems.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 flex items-center gap-3">
        <span className="text-2xl">✅</span>
        <div>
          <p className="font-semibold text-emerald-400">
            {lang === 'bn' ? 'সমস্ত প্রয়োজনীয় তথ্য পাওয়া গেছে' : 'All high-value data collected'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lang === 'bn' ? 'বিশ্লেষণের জন্য কোনো তথ্য অনুপস্থিত নয়।' : 'No critical data gaps identified.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-card overflow-hidden">
      <div className="bg-amber-500/10 px-4 py-3 border-b border-amber-500/20">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <div>
            <h3 className="font-semibold text-sm text-amber-400">
              {lang === 'bn' ? 'অনুপস্থিত উচ্চ-মূল্যের তথ্য' : 'Missing High-Value Data'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {missingItems.length} {lang === 'bn' ? 'টি আইটেম সংগ্রহ করা যায়নি' : 'items not yet collected'}
            </p>
          </div>
        </div>
      </div>

      <ul className="divide-y divide-border">
        {missingItems.map((item, index) => (
          <li key={index} className="flex items-start gap-3 px-4 py-3">
            <span className="mt-0.5 w-5 h-5 rounded border-2 border-amber-500/50 shrink-0 flex items-center justify-center">
              <span className="text-[8px] text-amber-500">?</span>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground">{item}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {lang === 'bn'
                  ? 'এই তথ্যটি সংগ্রহ করলে বিশ্লেষণের নির্ভুলতা বাড়বে।'
                  : 'Collecting this would improve analysis accuracy.'}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
