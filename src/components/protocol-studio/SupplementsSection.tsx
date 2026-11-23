'use client';

import React, { useState } from 'react';
import { 
  SupplementProtocolItem, 
  SupplementFrequency, 
  FoodRelationship 
} from '@/types/r4Protocol';
import { 
  Pill, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2,
  Utensils
} from 'lucide-react';
import supplementsData from '@/data/supplements.json';

interface SupplementsSectionProps {
  supplements: SupplementProtocolItem[];
  onChange: (updated: SupplementProtocolItem[]) => void;
  language: 'bn' | 'en';
}

export const SupplementsSection: React.FC<SupplementsSectionProps> = ({
  supplements,
  onChange,
  language
}) => {
  const bn = language === 'bn';
  const [showAddForm, setShowAddForm] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [newNutrient, setNewNutrient] = useState('');
  const [newForm, setNewForm] = useState('');
  const [newDose, setNewDose] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newFreq, setNewFreq] = useState<SupplementFrequency>('once_daily');
  const [newFoodRel, setNewFoodRel] = useState<FoodRelationship>('with_breakfast');
  const [newIndicationEn, setNewIndicationEn] = useState('');
  const [newIndicationBn, setNewIndicationBn] = useState('');

  const handleStatusChange = (id: string, newStatus: SupplementProtocolItem['approval_status']) => {
    const updated = supplements.map(s => s.id === id ? { ...s, approval_status: newStatus } : s);
    onChange(updated);
  };

  const handleDelete = (id: string) => {
    const updated = supplements.filter(s => s.id !== id);
    onChange(updated);
  };

  const handleSelectCatalogItem = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catId = e.target.value;
    setSelectedCatalogId(catId);
    if (!catId) return;

    const found = (supplementsData as any[]).find(s => s.id === catId);
    if (found) {
      setNewNutrient(found.name_en);
      setNewDose(found.recommended_dose);
      setNewIndicationEn(found.clinical_indications?.join(', ') || 'Targeted nutritional support');
      setNewIndicationBn(found.timing_note_bn || 'পুষ্টিগত ঘাটতি পূরণ');
    }
  };

  const handleAddSupplement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNutrient.trim() || !newDose.trim()) return;

    const newItem: SupplementProtocolItem = {
      id: `supp_${Date.now()}`,
      catalog_id: selectedCatalogId || undefined,
      generic_nutrient: newNutrient,
      chemical_form: newForm || 'Standard Bioavailable Form',
      brand_verification_status: 'generic_prescription_only',
      indication_en: newIndicationEn || 'Targeted nutritional protocol',
      indication_bn: newIndicationBn || 'টার্গেটেড পুষ্টিগত সহায়তা',
      evidence_category: 'evidence_based',
      total_compound_dose: newDose,
      frequency: newFreq,
      administration_time: newTime,
      relationship_to_food: newFoodRel,
      duration_weeks: 12,
      monitoring_parameters: ['Serum levels', 'Symptom resolution'],
      contraindications: [],
      known_interactions: [],
      approval_status: 'draft_candidate',
      source: 'clinician_manual_entry'
    };

    onChange([...supplements, newItem]);

    setNewNutrient('');
    setNewForm('');
    setNewDose('');
    setSelectedCatalogId('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* ── Supplements Header ── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Pill className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {bn ? 'টার্গেটেড সাপ্লিমেন্ট প্রেসক্রিপশন স্টুডিও' : 'Targeted Supplement Prescription Studio'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {bn ? 'ড্রাগ-নিউট্রিয়েন্ট ঘাটতি, সক্রিয় ফর্মুলেশন ও সেফটি লিমিট সমন্বয়' : 'DNI depletions, active elemental forms, and Tolerable Upper Intake Level (UL) verification'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shrink-0 transition-all shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>{bn ? 'সাপ্লিমেন্ট যুক্ত করুন' : 'Add Supplement'}</span>
          </button>
        </div>
      </div>

      {/* ── Add Supplement Form Modal ── */}
      {showAddForm && (
        <form onSubmit={handleAddSupplement} className="bg-card border border-amber-500/40 rounded-2xl p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-foreground">
              {bn ? 'সাপ্লিমেন্ট নির্বাচন বা কাস্টম নির্ধারণ' : 'Select from Catalog or Custom Formulation'}
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Catalog Selector */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {bn ? 'ক্যাটালগ থেকে দ্রুত লোড করুন (ঐচ্ছিক)' : 'Quick Load from Catalog (Optional)'}
              </label>
              <select
                value={selectedCatalogId}
                onChange={handleSelectCatalogItem}
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
              >
                <option value="">{bn ? '-- ক্যাটালগ আইটেম বেছে নিন --' : '-- Choose from verified catalog --'}</option>
                {(supplementsData as any[]).map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name_en} ({s.recommended_dose})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {bn ? 'নিউট্রিয়েন্টের নাম *' : 'Nutrient Name *'}
              </label>
              <input
                type="text"
                required
                value={newNutrient}
                onChange={(e) => setNewNutrient(e.target.value)}
                placeholder="e.g. Magnesium"
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {bn ? 'কেমিক্যাল ফর্ম' : 'Chemical Form'}
              </label>
              <input
                type="text"
                value={newForm}
                onChange={(e) => setNewForm(e.target.value)}
                placeholder="e.g. Bisglycinate Chelate"
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {bn ? 'ডোজ / মাত্রা *' : 'Dose / Formulation *'}
              </label>
              <input
                type="text"
                required
                value={newDose}
                onChange={(e) => setNewDose(e.target.value)}
                placeholder="e.g. 200 mg elemental (2000 mg bisglycinate)"
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {bn ? 'সময় (Administration Time)' : 'Time (HH:mm)'}
              </label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {bn ? 'ফ্রিকোয়েন্সি' : 'Frequency'}
              </label>
              <select
                value={newFreq}
                onChange={(e) => setNewFreq(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
              >
                <option value="once_daily">Once Daily</option>
                <option value="twice_daily">Twice Daily</option>
                <option value="thrice_daily">Thrice Daily</option>
                <option value="weekly">Weekly</option>
                <option value="alternate_days">Alternate Days</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {bn ? 'খাবারের সাথে সম্পর্ক' : 'Food Relationship'}
              </label>
              <select
                value={newFoodRel}
                onChange={(e) => setNewFoodRel(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
              >
                <option value="empty_stomach_waking">Empty Stomach on Waking</option>
                <option value="with_breakfast">With Breakfast</option>
                <option value="with_lunch">With Lunch</option>
                <option value="with_dinner">With Dinner</option>
                <option value="with_fatty_meal">With Fatty Meal (D3/K2/Omega-3)</option>
                <option value="between_meals">Between Meals</option>
                <option value="before_bed">30-60m Before Bed (Mg/Theanine)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-secondary text-foreground"
            >
              {bn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
            >
              {bn ? 'যুক্ত করুন' : 'Add to Protocol'}
            </button>
          </div>
        </form>
      )}

      {/* ── Supplements List / Table ── */}
      <div className="space-y-3">
        {supplements.map((supp) => {
          const isCandidate = supp.approval_status === 'draft_candidate';
          const isApproved = supp.approval_status === 'clinician_approved';
          const isRejected = supp.approval_status === 'rejected';

          return (
            <div
              key={supp.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                isRejected
                  ? 'bg-muted/20 border-border opacity-50'
                  : isApproved
                  ? 'bg-card border-border hover:border-amber-500/40'
                  : 'bg-amber-500/5 border-amber-500/30'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    {supp.generic_nutrient}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono bg-secondary px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {supp.administration_time}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                    <Utensils className="h-3 w-3" />
                    {supp.relationship_to_food.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    isApproved ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                    isRejected ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' :
                    'bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse'
                  }`}>
                    {supp.approval_status.replace(/_/g, ' ')}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-foreground">
                  {supp.chemical_form} — <span className="font-extrabold text-primary">{supp.total_compound_dose}</span> ({supp.frequency.replace(/_/g, ' ')})
                </h4>

                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground/80">{bn ? 'ক্লিনিক্যাল নির্দেশক: ' : 'Indication: '}</span>
                  {bn ? supp.indication_bn : supp.indication_en}
                </p>

                {supp.source === 'dni_auto_candidate' && (
                  <p className="text-[10px] text-amber-500 font-semibold">
                    {bn ? '★ প্রেসক্রিপশন ড্রাগ-নিউট্রিয়েন্ট ঘাটতি থেকে প্রস্তাবিত' : '★ Auto-suggested from prescription Drug-Nutrient Depletion'}
                  </p>
                )}
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-start shrink-0">
                {isCandidate && (
                  <>
                    <button
                      onClick={() => handleStatusChange(supp.id, 'clinician_approved')}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs transition-all"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{bn ? 'অনুমোদন' : 'Approve'}</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(supp.id, 'rejected')}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-destructive/40 hover:bg-destructive/10 text-destructive flex items-center gap-1 transition-all"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>{bn ? 'প্রত্যাখ্যান' : 'Reject'}</span>
                    </button>
                  </>
                )}

                {isApproved && (
                  <button
                    onClick={() => handleStatusChange(supp.id, 'discontinued')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-border hover:bg-secondary text-muted-foreground transition-all"
                  >
                    {bn ? 'স্থগিত করুন' : 'Discontinue'}
                  </button>
                )}

                <button
                  onClick={() => handleDelete(supp.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  title={bn ? 'মুছে ফেলুন' : 'Delete'}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
