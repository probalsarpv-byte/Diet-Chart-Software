'use client';

import React, { useState } from 'react';
import { usePractice } from '@/context/PracticeContext';
import { 
  Pill, 
  Clock, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Check, 
  X, 
  Edit3,
  Lock
} from 'lucide-react';

export const DNITab: React.FC = () => {
  const { 
    allMedicines, 
    patient, 
    toggleMedication, 
    dniResult, 
    candidateSupplements, 
    approveCandidateSupplement, 
    rejectCandidateSupplement, 
    overlapWarnings,
    language 
  } = usePractice();
  const bn = language === 'bn';

  const [editingId, setEditingId] = useState<string | null>(null);
  const [customDose, setCustomDose] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  const handleStartEdit = (id: string, currentDose: string, currentNotes?: string) => {
    setEditingId(id);
    setCustomDose(currentDose);
    setCustomNotes(currentNotes || '');
  };

  const handleSaveApproval = (id: string) => {
    approveCandidateSupplement(id, customDose, customNotes);
    setEditingId(null);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Medication Selector Grid */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Pill className="h-4 w-4 text-primary" />
            <span>{bn ? 'প্রেসক্রিপশন ওষুধ নির্বাচন (Medex & Bangladesh Generic Data)' : 'Active Prescription Medications (Medex BD)'}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {bn ? 'ওষুধ-পুষ্টি মিথস্ক্রিয়া (DNI) যাচাই করতে ওষুধ নির্বাচন করুন' : 'Select all current medications to detect depletions'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allMedicines.map(med => {
            const isSelected = patient.active_medications.some(m => 
              m === med.id || m.toLowerCase() === med.generic_name.toLowerCase()
            );
            return (
              <button
                key={med.id}
                type="button"
                onClick={() => toggleMedication(med.id)}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  isSelected 
                    ? 'bg-primary/10 border-primary shadow-sm ring-1 ring-primary/40' 
                    : 'bg-background hover:bg-secondary/40 text-muted-foreground'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-semibold text-xs ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {med.generic_name}
                    </span>
                    <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${
                      isSelected ? 'bg-primary text-white' : 'border border-muted-foreground/30'
                    }`}>
                      {isSelected ? '✓' : ''}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mb-1.5 font-medium">
                    {med.drug_class}
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {bn ? med.mechanism_bn : med.mechanism_en}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                  <span className="font-semibold text-foreground">{bn ? 'বাংলাদেশি ব্র্যান্ড:' : 'BD Brands:'} </span>
                  {med.brand_names_bd.slice(0, 4).join(', ')}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Cumulative Nutrient Overlap & Tolerable Upper Limit (UL) Warnings */}
      {overlapWarnings.length > 0 && (
        <div className="space-y-3">
          {overlapWarnings.map((warn, idx) => (
            <div key={idx} className="p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-foreground leading-relaxed">
                <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                  {bn ? `সাপ্লিমেন্ট ওভারল্যাপ সতর্কতা: ${warn.nutrient} (UL: ${warn.tolerable_upper_limit})` : `Nutrient Overlap Warning: ${warn.nutrient} (UL: ${warn.tolerable_upper_limit})`}
                </span>
                {bn ? warn.warning_bn : warn.warning_en}
                <div className="text-[11px] text-muted-foreground mt-1">
                  Sources: {warn.sources.join(' + ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Critical Spacing & Absorption Alerts */}
      {dniResult.criticalWarnings.length > 0 && (
        <div className="space-y-3">
          {dniResult.criticalWarnings.map((warn, idx) => (
            <div key={idx} className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs text-foreground leading-relaxed">
                <span className="font-bold text-rose-500 block mb-0.5">
                  {bn ? 'জরুরি সেবন ব্যবধান ও ফার্মাকোলজিক্যাল সতর্কতা:' : 'Critical Drug-Nutrient Spacing Protocol:'}
                </span>
                {bn ? warn.warning_bn : warn.warning_en}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Nutrient Depletions & Candidate Supplements with Clinician Review */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Depletions */}
        <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs border-b pb-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>{bn ? 'ওষুধজনিত মাইক্রোনিউট্রিয়েন্ট ঘাটতি (Nutrient Depletions)' : 'Drug-Induced Nutrient Depletions'}</span>
          </div>

          {dniResult.depletions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              {bn ? 'কোনো ওষুধ নির্বাচন করা হয়নি বা কোনো ঘাটতি শনাক্ত হয়নি।' : 'No active depletions flagged.'}
            </p>
          ) : (
            <div className="space-y-3">
              {dniResult.depletions.map((dep, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border bg-secondary/30 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground text-sm">{dep.depletion.nutrient}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-rose-500/15 text-rose-500 uppercase">
                      {dep.depletion.severity} Depletion
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    <strong className="text-foreground">{dep.medicineName}</strong> {bn ? 'ওষুধ ব্যবহারের ফলে ঘাটতির কারণ:' : 'induced mechanism:'}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {bn ? dep.depletion.reason_bn : dep.depletion.reason_en}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Candidate Orthomolecular Supplements with Clinician Review */}
        <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span>{bn ? 'ক্যান্ডিডেট অর্থোমলিকুলার সাপ্লিমেন্ট (চিকিৎসক অনুমোদন প্রয়োজন)' : 'Candidate Supplements (Clinician Approval Required)'}</span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {candidateSupplements.filter(s => s.approval_status === 'clinician_approved').length} / {candidateSupplements.length} {bn ? 'অনুমোদিত' : 'Approved'}
            </span>
          </div>

          <div className="space-y-3">
            {candidateSupplements.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                {bn ? 'কোনো ক্যান্ডিডেট সাপ্লিমেন্ট প্রস্তাবিত হয়নি।' : 'No candidate supplements triggered.'}
              </p>
            ) : (
              candidateSupplements.map(supp => {
                const isApproved = supp.approval_status === 'clinician_approved';
                const isRejected = supp.approval_status === 'rejected';
                const isUnderEdit = editingId === supp.id;

                return (
                  <div key={supp.id} className={`p-3.5 rounded-xl border text-xs space-y-2 transition ${
                    isApproved 
                      ? 'bg-emerald-500/5 border-emerald-500/30' 
                      : isRejected 
                      ? 'bg-rose-500/5 border-rose-500/20 opacity-60' 
                      : 'bg-background border-amber-500/30'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-foreground text-sm">
                          {bn ? supp.name_bn : supp.name_en}
                        </h4>
                        <span className="text-[10px] text-muted-foreground block">
                          Trigger: {supp.indication_trigger || supp.category}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          isApproved 
                            ? 'bg-emerald-500/15 text-emerald-500' 
                            : isRejected 
                            ? 'bg-rose-500/15 text-rose-500' 
                            : 'bg-amber-500/15 text-amber-500'
                        }`}>
                          {isApproved ? (bn ? 'অনুমোদিত' : 'Approved') : isRejected ? (bn ? 'বাতিল' : 'Rejected') : (bn ? 'রিভিউ প্রয়োজন' : 'Candidate Review')}
                        </span>
                      </div>
                    </div>

                    {/* Dosage and Notes */}
                    <div className="text-[11px] bg-secondary/40 p-2 rounded-lg space-y-1">
                      <div className="flex justify-between">
                        <span><strong>{bn ? 'প্রস্তাবিত ডোজ:' : 'Dose:'}</strong> {supp.prescribed_dose || supp.recommended_dose}</span>
                        <span><strong>{bn ? 'সময়বিধি:' : 'Timing:'}</strong> {supp.timing_schedule}</span>
                      </div>
                      {supp.clinician_notes && (
                        <div className="text-[10px] text-muted-foreground pt-1 border-t">
                          <strong>Note:</strong> {supp.clinician_notes}
                        </div>
                      )}
                    </div>

                    {/* Edit Mode */}
                    {isUnderEdit ? (
                      <div className="space-y-2 p-2 bg-background border rounded-lg">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground block">Dose:</label>
                            <input
                              type="text"
                              value={customDose}
                              onChange={e => setCustomDose(e.target.value)}
                              className="w-full px-2 py-1 text-xs border rounded bg-background"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground block">Clinician Note:</label>
                            <input
                              type="text"
                              value={customNotes}
                              onChange={e => setCustomNotes(e.target.value)}
                              className="w-full px-2 py-1 text-xs border rounded bg-background"
                              placeholder="e.g. For 6 weeks then retest"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 text-[10px] border rounded"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveApproval(supp.id)}
                            className="px-2.5 py-1 text-[10px] bg-emerald-600 text-white rounded font-medium"
                          >
                            Confirm Approval
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Approval Action Buttons */
                      <div className="flex justify-between items-center pt-1 border-t border-border/50">
                        <div className="flex flex-wrap gap-1">
                          {supp.verified_bd_brands.slice(0, 3).map((b, bIdx) => (
                            <span key={bIdx} className="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-medium text-[9px]">
                              {b}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-1">
                          {!isApproved && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(supp.id, supp.recommended_dose, supp.clinician_notes)}
                              className="px-2 py-1 rounded text-[10px] font-medium border bg-background hover:bg-secondary flex items-center gap-1 text-foreground"
                            >
                              <Edit3 className="h-3 w-3" />
                              <span>{bn ? 'কাস্টমাইজ ও অনুমোদন' : 'Edit & Approve'}</span>
                            </button>
                          )}
                          {!isApproved && (
                            <button
                              type="button"
                              onClick={() => approveCandidateSupplement(supp.id)}
                              className="px-2.5 py-1 rounded text-[10px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                            >
                              <Check className="h-3 w-3" />
                              <span>{bn ? 'অনুমোদন' : 'Approve'}</span>
                            </button>
                          )}
                          {!isRejected && (
                            <button
                              type="button"
                              onClick={() => rejectCandidateSupplement(supp.id)}
                              className="px-2 py-1 rounded text-[10px] font-medium border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 flex items-center gap-1"
                            >
                              <X className="h-3 w-3" />
                              <span>{bn ? 'বাতিল' : 'Reject'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* 5. Visual 24-Hour Daily Gantt/Schedule Timeline */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>{bn ? '২৪ ঘণ্টার দৈনিক ওষুধ, সাপ্লিমেন্ট ও খাদ্য রুটিন (Visual Timeline)' : 'Visual 24-Hour Pill, Supplement & Meal Timeline'}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {bn ? 'প্রেসক্রিপশন ওষুধ ও সাপ্লিমেন্ট স্পষ্টভাবে আলাদা চিহ্নিত' : 'Prescription vs Supplemental Differentiation'}
          </span>
        </div>

        <div className="relative border-l-2 border-primary/30 ml-4 sm:ml-6 pl-4 sm:pl-6 space-y-6 py-2">
          {dniResult.timeline.map((item, idx) => {
            const isMed = item.category === 'medication' || item.is_prescription_medication;
            const isSupp = item.category === 'supplement';
            const isMeal = item.category === 'meal';

            const dotColor = isMed 
              ? 'bg-rose-500' 
              : isSupp 
              ? 'bg-emerald-500' 
              : isMeal 
              ? 'bg-blue-500' 
              : 'bg-amber-500';

            return (
              <div key={idx} className="relative group">
                {/* Timeline Dot */}
                <div className={`absolute -left-[25px] sm:-left-[33px] top-1.5 h-4 w-4 rounded-full border-2 border-background ${dotColor} shadow`} />

                <div className="p-3.5 rounded-xl border bg-background/70 hover:bg-background hover:shadow-sm transition text-xs space-y-1.5">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground bg-secondary px-2 py-0.5 rounded text-[11px]">
                        {item.time}
                      </span>
                      <h4 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                        <span>{bn ? item.title_bn : item.title_en}</span>
                        {item.is_prescription_medication && (
                          <span className="text-[9px] px-1 py-0.2 bg-rose-500 text-white rounded font-bold">RX</span>
                        )}
                      </h4>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                      isMed ? 'bg-rose-500/15 text-rose-500' : isSupp ? 'bg-emerald-500/15 text-emerald-500' : 'bg-blue-500/15 text-blue-500'
                    }`}>
                      {item.category}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {bn ? item.instructions_bn : item.instructions_en}
                  </p>

                  {item.warning_bn && (
                    <div className="text-[10px] text-rose-500 font-medium bg-rose-500/10 p-1.5 rounded">
                      ⚠️ {bn ? item.warning_bn : item.warning_en}
                    </div>
                  )}

                  {item.verified_products && item.verified_products.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                      <span className="text-muted-foreground font-semibold">{bn ? 'আইটেম / ব্র্যান্ড:' : 'Products:'}</span>
                      {item.verified_products.map((p, pIdx) => (
                        <span key={pIdx} className="px-1.5 py-0.2 rounded bg-secondary text-foreground font-medium">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
