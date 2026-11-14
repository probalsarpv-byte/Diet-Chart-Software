'use client';

import React, { useState } from 'react';
import { ClinicalTimelineEvent } from '../../engine/p2/types';

const EVENT_ICONS: Record<string, string> = {
  symptom_onset: '🔴',
  medication_start: '💊',
  medication_stop: '⛔',
  antibiotic_exposure: '🦠',
  dietary_change: '🥗',
  weight_change: '⚖️',
  illness: '🤒',
  lab_result: '🧪',
  lifestyle_change: '🌱',
  reproductive_event: '🌸',
  intervention: '🩺',
  clinician_note: '📝',
};

interface Props {
  events: ClinicalTimelineEvent[];
  lang: 'bn' | 'en';
  onAnnotate: (id: string, annotation: string) => void;
}

export const ClinicalTimelineView: React.FC<Props> = ({ events, lang, onAnnotate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftAnnotation, setDraftAnnotation] = useState('');

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {lang === 'bn' ? 'ক্লিনিক্যাল টাইমলাইন ডেটা পাওয়া যায়নি।' : 'No clinical timeline data available.'}
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
      <div className="space-y-6 pl-14">
        {sorted.map(event => {
          const icon = EVENT_ICONS[event.eventType] || '📌';
          const isEditing = editingId === event.id;

          return (
            <div key={event.id} className="relative">
              {/* Dot */}
              <div className="absolute -left-9 top-1 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-base shadow-sm">
                {icon}
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                {/* Date + type */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">{event.date}</span>
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    {event.eventType.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Title */}
                <h4 className="font-semibold text-sm">
                  {lang === 'bn' ? event.title_bn : event.title_en}
                </h4>

                {/* Description */}
                <p className="text-xs text-muted-foreground mt-1">
                  {lang === 'bn' ? event.description_bn : event.description_en}
                </p>

                {/* Temporal association — soft suggestion, NOT causal */}
                {event.temporalAssociation && (
                  <div className="mt-2 text-[10px] italic text-amber-400/80 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1">
                    ⚠️ {lang === 'bn' ? 'সম্ভাব্য সংযোগ (কারণ নয়):' : 'Possible temporal association (not causal):'} {event.temporalAssociation}
                  </div>
                )}

                {/* Annotation */}
                <div className="mt-3 border-t border-border pt-2">
                  {event.clinicianAnnotation && !isEditing && (
                    <p className="text-xs text-primary/80 italic mb-1">
                      📝 {event.clinicianAnnotation}
                    </p>
                  )}
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={draftAnnotation}
                        onChange={e => setDraftAnnotation(e.target.value)}
                        placeholder={lang === 'bn' ? 'টীকা লিখুন...' : 'Add annotation...'}
                        className="flex-1 text-xs rounded-lg border border-border bg-background px-3 py-1.5 outline-none focus:border-primary"
                        autoFocus
                      />
                      <button
                        onClick={() => { onAnnotate(event.id, draftAnnotation); setEditingId(null); }}
                        className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded-lg"
                      >
                        {lang === 'bn' ? 'সংরক্ষণ' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs px-2 py-1 border border-border rounded-lg text-muted-foreground"
                      >
                        {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(event.id); setDraftAnnotation(event.clinicianAnnotation || ''); }}
                      className="text-[10px] text-primary hover:underline"
                    >
                      {event.clinicianAnnotation
                        ? (lang === 'bn' ? '✏️ টীকা সম্পাদনা করুন' : '✏️ Edit annotation')
                        : (lang === 'bn' ? '+ টীকা যোগ করুন' : '+ Add annotation')}
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
