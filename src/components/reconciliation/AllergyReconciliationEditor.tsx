'use client';

import React, { useState } from 'react';
import { usePractice } from '@/context/PracticeContext';
import {
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Lock,
  UserCheck
} from 'lucide-react';
import { AllergyReconciliationStatus, AllergyReconciliationRecord } from '@/types';

interface AllergyReconciliationEditorProps {
  onSave?: (record: AllergyReconciliationRecord) => void;
}

export const AllergyReconciliationEditor: React.FC<AllergyReconciliationEditorProps> = ({ onSave }) => {
  const {
    language,
    patient,
    updatePatient,
    addConfirmedAllergy,
    removeConfirmedAllergy
  } = usePractice();

  const bn = language === 'bn';
  const status: AllergyReconciliationStatus = patient.allergy_reconciliation_status || 'not_assessed';
  const [allergenInput, setAllergenInput] = useState('');
  const [reconcilerName, setReconcilerName] = useState('Dr. Clinical Nutritionist');

  const commonAllergens = [
    { id: 'shrimp', bn: 'চিংড়ি (Shrimp)', en: 'Shrimp' },
    { id: 'egg', bn: 'ডিম (Egg)', en: 'Egg' },
    { id: 'peanut', bn: 'চীনাবাদাম (Peanut)', en: 'Peanut' },
    { id: 'gluten', bn: 'গ্লুটেন / গম (Gluten)', en: 'Gluten / Wheat' },
    { id: 'dairy', bn: 'দুধ / দুগ্ধজাত (Dairy)', en: 'Dairy / Cow Milk' },
    { id: 'soy', bn: 'সয়াবিন (Soy)', en: 'Soy' },
    { id: 'tree_nuts', bn: 'বাদাম (Tree Nuts)', en: 'Tree Nuts' },
    { id: 'fish', bn: 'মাছ (Fish)', en: 'Fish' }
  ];

  const handleStatusChange = (newStatus: AllergyReconciliationStatus) => {
    const isReconciled = newStatus === 'allergies_confirmed' || newStatus === 'none_confirmed';
    const updatedRecord: AllergyReconciliationRecord = {
      status: newStatus,
      reconciled: isReconciled,
      reconciled_by: reconcilerName,
      reconciled_at: new Date().toISOString(),
      confirmed_allergies: newStatus === 'allergies_confirmed' ? patient.confirmed_allergies : []
    };

    updatePatient({
      allergy_reconciliation_status: newStatus,
      allergy_reconciliation: updatedRecord,
      confirmed_allergies: newStatus === 'allergies_confirmed' ? patient.confirmed_allergies : []
    });

    if (onSave) onSave(updatedRecord);
  };

  const handleAddCustomAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = allergenInput.trim().toLowerCase();
    if (trimmed) {
      addConfirmedAllergy(trimmed);
      setAllergenInput('');

      // Auto ensure status is allergies_confirmed
      handleStatusChange('allergies_confirmed');
    }
  };

  return (
    <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-rose-500" />
          <div>
            <h3 className="font-bold text-sm text-foreground">
              {bn ? 'খাদ্য ও ড্রাগ অ্যালার্জি রিকনসিলিয়েশন' : 'Allergy Reconciliation Gateway'}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {bn
                ? '৪-স্তরীয় অ্যালার্জি লাইফসাইকেল: নিশ্চিত অ্যালার্জি খাদ্যতালিকা থেকে সম্পূর্ণ নিষিদ্ধ (RED) থাকবে'
                : 'Mandatory 4-state allergy lifecycle for food exclusions and clinical safety'}
            </p>
          </div>
        </div>

        {status === 'allergies_confirmed' || status === 'none_confirmed' ? (
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold flex items-center gap-1 self-start sm:self-auto">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{bn ? 'যাচাইকৃত ও সমন্বিত' : 'Reconciled'}</span>
          </span>
        ) : (
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 font-bold flex items-center gap-1 self-start sm:self-auto">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{bn ? 'সমন্বয় বাকী (অসম্পূর্ণ)' : 'Unreconciled Safety Gate'}</span>
          </span>
        )}
      </div>

      {/* 4-State Lifecycle Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => handleStatusChange('allergies_confirmed')}
          className={`p-3 rounded-xl border text-left transition ${
            status === 'allergies_confirmed'
              ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
              : 'border-border bg-card text-muted-foreground hover:bg-muted/20'
          }`}
        >
          <div className="text-xs">{bn ? '১. নিশ্চিত অ্যালার্জি আছে' : '1. Allergies Confirmed'}</div>
          <div className="text-[10px] opacity-80 mt-0.5">{bn ? 'খাদ্যতালিকায় নিষিদ্ধ' : 'Hard Exclusion'}</div>
        </button>

        <button
          type="button"
          data-testid="allergy-none-confirmed"
          onClick={() => handleStatusChange('none_confirmed')}
          className={`p-3 rounded-xl border text-left transition ${
            status === 'none_confirmed'
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 font-bold shadow-sm'
              : 'border-border bg-card text-muted-foreground hover:bg-muted/20'
          }`}
        >
          <div className="text-xs">{bn ? '২. নিশ্চিত কোনো অ্যালার্জি নেই' : '2. None Confirmed (NKFA)'}</div>
          <div className="text-[10px] opacity-80 mt-0.5">{bn ? 'যাচাইকৃত নিরাপদ' : 'Verified No Allergies'}</div>
        </button>

        <button
          type="button"
          onClick={() => handleStatusChange('unknown')}
          className={`p-3 rounded-xl border text-left transition ${
            status === 'unknown'
              ? 'border-amber-500 bg-amber-500/10 text-amber-600 font-bold shadow-sm'
              : 'border-border bg-card text-muted-foreground hover:bg-muted/20'
          }`}
        >
          <div className="text-xs">{bn ? '৩. অজ্ঞাত / নিশ্চিত নয়' : '3. Unknown'}</div>
          <div className="text-[10px] opacity-80 mt-0.5">{bn ? 'অজ্ঞাত অ্যালার্জি ঝুঁকি' : 'Unconfirmed / Caution'}</div>
        </button>

        <button
          type="button"
          onClick={() => handleStatusChange('not_assessed')}
          className={`p-3 rounded-xl border text-left transition ${
            status === 'not_assessed'
              ? 'border-slate-500 bg-slate-500/10 text-foreground font-bold shadow-sm'
              : 'border-border bg-card text-muted-foreground hover:bg-muted/20'
          }`}
        >
          <div className="text-xs">{bn ? '৪. এখনও যাচাই হয়নি' : '4. Not Assessed'}</div>
          <div className="text-[10px] opacity-80 mt-0.5">{bn ? 'প্রাথমিক অবস্থা' : 'Pending Verification'}</div>
        </button>
      </div>

      {/* Allergies Management (When 'allergies_confirmed') */}
      {status === 'allergies_confirmed' && (
        <div className="p-4 rounded-xl bg-muted/20 border space-y-3">
          <div className="text-xs font-semibold text-foreground">
            {bn ? 'নিশ্চিত অ্যালার্জিযুক্ত খাদ্য নির্বাচন করুন বা লিখুন:' : 'Select or add confirmed food allergens:'}
          </div>

          {/* Quick select pills */}
          <div className="flex flex-wrap gap-1.5">
            {commonAllergens.map(item => {
              const isSelected = patient.confirmed_allergies.includes(item.id);
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    if (isSelected) {
                      removeConfirmedAllergy(item.id);
                    } else {
                      addConfirmedAllergy(item.id);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                    isSelected
                      ? 'bg-rose-500 text-white border-rose-600 font-bold'
                      : 'bg-card text-foreground hover:bg-muted/40 border-border'
                  }`}
                >
                  {bn ? item.bn : item.en}
                </button>
              );
            })}
          </div>

          {/* Custom Allergen Input */}
          <form onSubmit={handleAddCustomAllergy} className="flex gap-2">
            <input
              type="text"
              value={allergenInput}
              onChange={e => setAllergenInput(e.target.value)}
              placeholder={bn ? 'অন্যান্য অ্যালার্জেন (উদা: মাশরুম, স্ট্রবেরি)...' : 'Other allergen (e.g. mushroom, strawberry)...'}
              className="flex-1 px-3 py-1.5 rounded-xl border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
            >
              <Plus className="h-4 w-4" />
            </button>
          </form>

          {/* Active Confirmed Allergies List */}
          {patient.confirmed_allergies.length > 0 && (
            <div className="pt-2">
              <div className="text-[11px] text-muted-foreground font-medium mb-1.5">
                {bn ? 'বর্তমান সক্রিয় নিশ্চিত অ্যালার্জি:' : 'Active confirmed allergies for this patient:'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {patient.confirmed_allergies.map(a => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-semibold text-xs"
                  >
                    <Lock className="h-3 w-3" />
                    <span>{a}</span>
                    <button
                      type="button"
                      onClick={() => removeConfirmedAllergy(a)}
                      className="hover:opacity-75"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reconciler Verification Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <UserCheck className="h-3.5 w-3.5 text-primary" />
          <span>
            {bn ? 'যাচাইকারী চিকিৎসক:' : 'Reconciling Clinician:'} <strong>{reconcilerName}</strong>
          </span>
        </div>

        <div>
          {patient.allergy_reconciliation?.reconciled_at ? (
            <span>
              {bn ? 'সর্বশেষ যাচাই:' : 'Last verified:'} {new Date(patient.allergy_reconciliation.reconciled_at).toLocaleString()}
            </span>
          ) : (
            <span className="text-amber-500 font-medium">
              {bn ? 'এখনও যাচাই নিশ্চিত করা হয়নি' : 'Verification pending'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
