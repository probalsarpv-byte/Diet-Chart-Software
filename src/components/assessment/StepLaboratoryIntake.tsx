'use client';

import React, { useState } from 'react';
import { usePractice } from '@/context/PracticeContext';
import { useAssessment } from '@/context/AssessmentContext';
import { StructuredLabEntry, LabCategory } from '@/types/assessment';
import {
  FlaskConical,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

const CATEGORIES: { id: LabCategory | 'all'; label_en: string; label_bn: string }[] = [
  { id: 'all', label_en: 'All Panels', label_bn: 'সকল প্যানেল' },
  { id: 'glycemic', label_en: 'Glycemic / Diabetes', label_bn: 'সুগার ও ডায়াবেটিস' },
  { id: 'lipid', label_en: 'Lipid Profile', label_bn: 'লিপিড প্রোফাইল' },
  { id: 'renal', label_en: 'Renal / Kidney', label_bn: 'কিডনি ও রেনাল' },
  { id: 'hepatic', label_en: 'Hepatic / Liver', label_bn: 'লিভার এনজাইম' },
  { id: 'electrolytes', label_en: 'Electrolytes', label_bn: 'ইলেক্ট্রোলাইটস' },
  { id: 'thyroid', label_en: 'Thyroid', label_bn: 'থাইরয়েড' },
  { id: 'hematology_iron', label_en: 'CBC & Iron', label_bn: 'রক্ত ও আয়রন' },
  { id: 'vitamins_minerals', label_en: 'Vitamins & Minerals', label_bn: 'ভিটামিন ও খনিজ' },
  { id: 'inflammatory_markers', label_en: 'Inflammatory (CRP)', label_bn: 'প্রদাহ সূচক' }
];

export const StepLaboratoryIntake: React.FC = () => {
  const { language } = usePractice();
  const bn = language === 'bn';
  const { labEntries, setLabEntry, setCurrentStep } = useAssessment();
  const [selectedCategory, setSelectedCategory] = useState<LabCategory | 'all'>('all');

  const markers = Object.values(labEntries).filter(m => {
    if (selectedCategory !== 'all' && m.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const handleStatusChange = (markerId: string, status: StructuredLabEntry['status']) => {
    const existing = labEntries[markerId];
    if (existing) {
      setLabEntry(markerId, {
        ...existing,
        status,
        numeric_value: status === 'previously_tested' ? existing.numeric_value : undefined
      });
    }
  };

  const handleValueChange = (markerId: string, val: string) => {
    const num = parseFloat(val);
    const existing = labEntries[markerId];
    if (existing) {
      setLabEntry(markerId, {
        ...existing,
        numeric_value: !isNaN(num) ? num : undefined
      });
    }
  };

  const testedCount = Object.values(labEntries).filter(e => e.status === 'previously_tested').length;
  const pendingCount = Object.values(labEntries).filter(e => e.status === 'pending_result').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">
            {bn ? 'ধাপ ৮: ল্যাবরেটরি বায়োমার্কার ডাটা এন্ট্রি' : 'Step 8: Laboratory Biomarker Data Entry'}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
              {testedCount} {bn ? 'টি রিপোর্ট এন্ট্রি' : 'Tested'}
            </span>
            {pendingCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                {pendingCount} {bn ? 'টি অপেক্ষমাণ' : 'Pending'}
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {bn
            ? 'পরীক্ষিত ল্যাব রেজাল্ট রেকর্ড করুন অথবা পেন্ডিং/অপ্রীক্ষিত চিহ্নিত করুন। অপ্রীক্ষিত টেস্টে কখনো কাল্পনিক মান তৈরি করা হয় না।'
            : 'Record tested lab results, pending reports, or mark as not tested. Missing biomarkers are never assumed normal or zero.'}
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                : 'bg-card border text-muted-foreground hover:bg-muted'
            }`}
          >
            {bn ? cat.label_bn : cat.label_en}
          </button>
        ))}
      </div>

      {/* Biomarker Entry Cards */}
      <div className="space-y-3">
        {markers.map(m => {
          return (
            <div
              key={m.marker_id}
              className="bg-card border rounded-2xl p-4 shadow-sm hover:border-primary/40 transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    {bn ? m.name_bn : m.name_en}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {bn ? `স্বাভাবিক রেঞ্জ: ${m.conventional_low || ''} - ${m.conventional_high || ''} ${m.unit}` : `Ref Range: ${m.conventional_low || ''} - ${m.conventional_high || ''} ${m.unit}`}
                  </p>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-1">
                  {[
                    { id: 'previously_tested' as const, label_en: 'Tested', label_bn: 'পরীক্ষিত' },
                    { id: 'pending_result' as const, label_en: 'Pending', label_bn: 'অপেক্ষমাণ' },
                    { id: 'not_tested' as const, label_en: 'Not Tested', label_bn: 'করা হয়নি' },
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleStatusChange(m.marker_id, st.id)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                        m.status === st.id
                          ? st.id === 'previously_tested'
                            ? 'border-emerald-500 bg-emerald-500 text-white font-bold'
                            : st.id === 'pending_result'
                            ? 'border-amber-500 bg-amber-500 text-white font-bold'
                            : 'border-primary bg-primary text-primary-foreground font-bold'
                          : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {bn ? st.label_bn : st.label_en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Numeric Value Entry (Only if Tested) */}
              {m.status === 'previously_tested' && (
                <div className="flex items-center gap-3 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-semibold text-muted-foreground">
                      {bn ? 'ফলাফল মান:' : 'Value:'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={m.numeric_value !== undefined ? m.numeric_value : ''}
                      onChange={(e) => handleValueChange(m.marker_id, e.target.value)}
                      placeholder="e.g. 5.4"
                      className="w-28 px-2.5 py-1.5 text-xs rounded-xl border bg-background text-foreground font-bold focus:ring-1 focus:ring-primary outline-none"
                    />
                    <span className="text-xs text-muted-foreground font-semibold">{m.unit}</span>
                  </div>

                  {m.numeric_value !== undefined && m.conventional_high !== undefined && (
                    <div className="text-[11px] font-semibold">
                      {m.numeric_value > m.conventional_high ? (
                        <span className="text-rose-500 font-bold">▲ High (উচ্চ)</span>
                      ) : m.conventional_low !== undefined && m.numeric_value < m.conventional_low ? (
                        <span className="text-amber-500 font-bold">▼ Low (নিম্ন)</span>
                      ) : (
                        <span className="text-emerald-500">✓ Optimal (স্বাভাবিক)</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t">
        <button
          type="button"
          onClick={() => setCurrentStep('step_population')}
          className="px-4 py-2 border rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition-all flex items-center gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{bn ? 'পূর্ববর্তী: বিশেষ জনসংখ্যা' : 'Previous: Population Modules'}</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentStep('step_review')}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-all flex items-center gap-1.5"
        >
          <span>{bn ? 'পরবর্তী: পর্যালোচনা ও বিশ্লেষণ' : 'Next: Review & Analyze'}</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
