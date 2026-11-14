'use client';

import React from 'react';
import { ClinicalPriority } from '../../engine/p2/types';

const COLUMNS: Array<{
  type: ClinicalPriority['type'];
  label_en: string;
  label_bn: string;
  headerCls: string;
  cardCls: string;
  rankCls: string;
}> = [
  {
    type: 'medical_urgency',
    label_en: 'Medical Urgency',
    label_bn: 'চিকিৎসা জরুরিতা',
    headerCls: 'bg-rose-500/15 text-rose-400 border-b border-rose-500/30',
    cardCls: 'border-rose-500/20 bg-rose-500/5',
    rankCls: 'bg-rose-500 text-white',
  },
  {
    type: 'nutrition_intervention',
    label_en: 'Nutrition Intervention',
    label_bn: 'পুষ্টি হস্তক্ষেপ',
    headerCls: 'bg-emerald-500/15 text-emerald-400 border-b border-emerald-500/30',
    cardCls: 'border-emerald-500/20 bg-emerald-500/5',
    rankCls: 'bg-emerald-500 text-white',
  },
  {
    type: 'further_assessment',
    label_en: 'Further Assessment',
    label_bn: 'আরও মূল্যায়ন',
    headerCls: 'bg-blue-500/15 text-blue-400 border-b border-blue-500/30',
    cardCls: 'border-blue-500/20 bg-blue-500/5',
    rankCls: 'bg-blue-500 text-white',
  },
];

interface Props {
  priorities: ClinicalPriority[];
  lang: 'bn' | 'en';
}

export const PriorityBoard: React.FC<Props> = ({ priorities, lang }) => {
  if (priorities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {lang === 'bn' ? 'কোনো অগ্রাধিকার নির্ধারিত হয়নি।' : 'No priorities defined.'}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map(col => {
        const colPriorities = priorities
          .filter(p => p.type === col.type)
          .sort((a, b) => a.rank - b.rank);

        return (
          <div key={col.type} className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Column header */}
            <div className={`px-4 py-3 ${col.headerCls}`}>
              <h3 className="font-semibold text-sm">
                {lang === 'bn' ? col.label_bn : col.label_en}
              </h3>
              <p className="text-xs opacity-70">{colPriorities.length} {lang === 'bn' ? 'টি আইটেম' : 'items'}</p>
            </div>

            {/* Priority cards */}
            <div className="p-3 space-y-3">
              {colPriorities.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {lang === 'bn' ? 'কোনো আইটেম নেই' : 'No items'}
                </p>
              ) : (
                colPriorities.map(p => (
                  <div key={p.id} className={`rounded-lg border p-3 ${col.cardCls}`}>
                    {/* Rank + title */}
                    <div className="flex items-start gap-2">
                      <span className={`shrink-0 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${col.rankCls}`}>
                        {p.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs leading-tight">
                          {lang === 'bn' ? p.title_bn : p.title_en}
                        </p>
                      </div>
                    </div>

                    {/* Rationale */}
                    <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                      {lang === 'bn' ? p.rationale_bn : p.rationale_en}
                    </p>

                    {/* Linked hypothesis */}
                    {p.linkedHypothesisId && (
                      <p className="text-[10px] text-primary/70 mt-1">
                        🔗 {p.linkedHypothesisId}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
