'use client';

import React, { useState } from 'react';
import { ChronotherapyTimelineItem } from '@/types/r4Protocol';
import { 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Lock, 
  Edit2, 
  Check, 
  Sun, 
  Moon, 
  Pill, 
  Droplet, 
  Activity, 
  Sparkles,
  Utensils
} from 'lucide-react';

interface ChronotherapySectionProps {
  timeline: ChronotherapyTimelineItem[];
  onTimeChange: (item: ChronotherapyTimelineItem, newTime: string) => void;
  language: 'bn' | 'en';
}

export const ChronotherapySection: React.FC<ChronotherapySectionProps> = ({
  timeline,
  onTimeChange,
  language
}) => {
  const bn = language === 'bn';
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempTime, setTempTime] = useState('');

  const handleStartEdit = (item: ChronotherapyTimelineItem) => {
    if (!item.is_editable) return;
    setEditingId(item.id);
    setTempTime(item.time);
  };

  const handleSaveEdit = (item: ChronotherapyTimelineItem) => {
    if (tempTime && tempTime !== item.time) {
      onTimeChange(item, tempTime);
    }
    setEditingId(null);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'wake':
      case 'light_exposure':
        return <Sun className="h-4 w-4 text-amber-500" />;
      case 'sleep':
      case 'relaxation':
        return <Moon className="h-4 w-4 text-purple-500" />;
      case 'hydration':
        return <Droplet className="h-4 w-4 text-cyan-500" />;
      case 'exercise':
        return <Activity className="h-4 w-4 text-emerald-500" />;
      case 'medication':
        return <Pill className="h-4 w-4 text-blue-500" />;
      case 'supplement':
        return <Sparkles className="h-4 w-4 text-amber-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const periods: Array<{ id: 'morning' | 'afternoon' | 'evening' | 'night'; title_en: string; title_bn: string; range: string }> = [
    { id: 'morning', title_en: 'Morning Phase', title_bn: 'সকাল ও প্রাতঃকাল', range: '05:00 - 11:59' },
    { id: 'afternoon', title_en: 'Afternoon Phase', title_bn: 'দুপুর ও অপরাহ্ন', range: '12:00 - 16:59' },
    { id: 'evening', title_en: 'Evening Phase', title_bn: 'সন্ধ্যা ও প্রাক-শয়ন', range: '17:00 - 20:59' },
    { id: 'night', title_en: 'Nocturnal Phase', title_bn: 'রাত্রিকাল ও গভীর ঘুম', range: '21:00 - 04:59' }
  ];

  const collisionCount = timeline.filter(t => t.collision_detected).length;

  return (
    <div className="space-y-6">
      {/* ── Chronotherapy Header ── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">
                  {bn ? '২৪ ঘণ্টার সমন্বিত ক্রোনোথেরাপি টাইমলাইন' : 'Integrated 24-Hour Chronotherapy Timeline'}
                </h2>
                {collisionCount > 0 ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500 text-white flex items-center gap-1 animate-pulse">
                    <ShieldAlert className="h-3 w-3" />
                    <span>{collisionCount} {bn ? 'টি সংঘাত' : 'Collisions'}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                    {bn ? 'সংঘাতহীন' : 'Collision Free'}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {bn ? 'ওষুধ, সাপ্লিমেন্ট, শরীরচর্চা ও পানির গ্রহণের আদর্শ সময় ও পারস্পরিক ব্যবধান' : 'Optimal physiological timing for medications, supplements, meals, exercise, and restorative sleep'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Period Blocks ── */}
      <div className="space-y-6">
        {periods.map(period => {
          const itemsInPeriod = timeline.filter(t => t.period === period.id);

          return (
            <div key={period.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 bg-secondary/30 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {bn ? period.title_bn : period.title_en}
                  </h3>
                  <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                    {period.range}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground font-semibold">
                  {itemsInPeriod.length} {bn ? 'টি ঘটনা' : 'Events'}
                </span>
              </div>

              <div className="divide-y divide-border">
                {itemsInPeriod.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground italic">
                    {bn ? 'এই সময়ে কোনো নির্ধারিত ইভেন্ট নেই।' : 'No events scheduled during this window.'}
                  </div>
                ) : (
                  itemsInPeriod.map(item => {
                    const isEditing = editingId === item.id;
                    const hasCollision = item.collision_detected;

                    return (
                      <div
                        key={item.id}
                        className={`p-4 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                          hasCollision
                            ? 'bg-rose-500/5 hover:bg-rose-500/10'
                            : 'hover:bg-secondary/20'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 flex-1">
                          {/* Time display or inline editor */}
                          <div className="shrink-0 flex flex-col items-center">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="time"
                                  value={tempTime}
                                  onChange={(e) => setTempTime(e.target.value)}
                                  className="w-24 px-1.5 py-1 text-xs font-bold font-mono bg-background border border-primary rounded-lg text-center"
                                />
                                <button
                                  onClick={() => handleSaveEdit(item)}
                                  className="p-1 rounded bg-primary text-primary-foreground hover:bg-primary-hover"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleStartEdit(item)}
                                disabled={!item.is_editable}
                                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold font-mono flex items-center gap-1 transition-all ${
                                  hasCollision
                                    ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                                    : 'bg-secondary text-foreground hover:bg-primary/10 hover:text-primary'
                                } ${!item.is_editable ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                                title={item.is_editable ? (bn ? 'সময় পরিবর্তন করতে ক্লিক করুন' : 'Click to adjust time') : (bn ? 'প্রেসক্রিপশন ওষুধ লক করা' : 'Prescription locked')}
                              >
                                {item.time}
                                {item.is_editable ? (
                                  <Edit2 className="h-2.5 w-2.5 ml-0.5 opacity-60" />
                                ) : (
                                  <Lock className="h-2.5 w-2.5 ml-0.5 opacity-60" />
                                )}
                              </button>
                            )}
                          </div>

                          <div className="space-y-1 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="p-1 rounded-md bg-secondary shrink-0">
                                {getCategoryIcon(item.category)}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-secondary text-foreground">
                                {item.category.replace(/_/g, ' ')}
                              </span>
                              {hasCollision && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white flex items-center gap-1">
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                  <span>{bn ? 'সময়ের ব্যবধান লঙ্ঘন' : 'Spacing Conflict'}</span>
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-bold text-foreground">
                              {bn ? item.title_bn : item.title_en}
                            </h4>

                            <p className="text-xs text-muted-foreground">
                              {bn ? item.instructions_bn : item.instructions_en}
                            </p>

                            {/* Spacing Warnings Display */}
                            {item.spacing_warnings && item.spacing_warnings.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {item.spacing_warnings.map((w, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-start gap-2"
                                  >
                                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                                    <div>
                                      <p className="font-semibold">
                                        {bn ? w.message_bn : w.message_en}
                                      </p>
                                      <p className="text-[10px] text-rose-500/80 mt-0.5">
                                        {bn ? `প্রয়োজনীয় ব্যবধান: ${w.required_gap_hours} ঘণ্টা | বর্তমান: ${w.actual_gap_hours} ঘণ্টা` : `Required Separation: ${w.required_gap_hours}h | Current Gap: ${w.actual_gap_hours}h`}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
