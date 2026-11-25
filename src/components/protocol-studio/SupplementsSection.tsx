'use client';

import React, { useMemo, useState } from 'react';
import {
  SupplementProtocolItem,
  SupplementFrequency,
  FoodRelationship,
  SupplementIngredient
} from '@/types/r4Protocol';
import { PatientProfile } from '@/types';
import {
  calculateR7SupplementExposure,
  canonicalizeNutrientId
} from '@/engine/r7/supplementIntelligence';
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
  Utensils,
  Layers,
  Info
} from 'lucide-react';
import supplementsData from '@/data/supplements.json';

interface SupplementsSectionProps {
  supplements: SupplementProtocolItem[];
  onChange: (updated: SupplementProtocolItem[]) => void;
  language: 'bn' | 'en';
  patient?: Partial<PatientProfile>;
}

export const SupplementsSection: React.FC<SupplementsSectionProps> = ({
  supplements,
  onChange,
  language,
  patient
}) => {
  const bn = language === 'bn';
  const [showAddForm, setShowAddForm] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [newNutrient, setNewNutrient] = useState('');
  const [newForm, setNewForm] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newDose, setNewDose] = useState('');
  const [isDoseUnknown, setIsDoseUnknown] = useState(false);
  const [newUnitsPerDose, setNewUnitsPerDose] = useState('1');
  const [newStrengthText, setNewStrengthText] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [isTimingUnknown, setIsTimingUnknown] = useState(false);
  const [newFreq, setNewFreq] = useState<SupplementFrequency>('once_daily');
  const [newFoodRel, setNewFoodRel] = useState<FoodRelationship>('with_breakfast');
  const [newRoute, setNewRoute] = useState<SupplementProtocolItem['route']>('oral');
  const [newDurationWeeks, setNewDurationWeeks] = useState('');
  const [newIndicationEn, setNewIndicationEn] = useState('');
  const [newIndicationBn, setNewIndicationBn] = useState('');
  const [customIngredients, setCustomIngredients] = useState<SupplementIngredient[]>([]);

  // Live R7 Exposure & Overlap Screening (Current Approved vs Proposed Candidates)
  const exposureSummary = useMemo(() => {
    return calculateR7SupplementExposure({
      supplements,
      patient: patient || ({ age: 35, gender: 'unspecified' } as Partial<PatientProfile>)
    });
  }, [supplements, patient]);

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
      setNewBrand(found.verified_bd_brands?.[0] || '');
    }
  };

  const handleAddIngredientRow = () => {
    setCustomIngredients(prev => [
      ...prev,
      {
        id: `ing_${Date.now()}_${prev.length}`,
        nutrient_id: 'magnesium',
        nutrient_name: 'Magnesium',
        chemical_form: 'Bisglycinate',
        elemental_amount_per_unit: 100,
        amount_unit: 'mg',
        prescribed_units_per_dose: 1,
        is_standardized: true,
        is_elemental_known: true
      }
    ]);
  };

  const handleAddSupplement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNutrient.trim()) return;
    const effectiveDose = isDoseUnknown ? 'UNKNOWN' : (newDose.trim() || 'UNKNOWN');
    const unitsNum = parseFloat(newUnitsPerDose) || 1;
    const durNum = parseInt(newDurationWeeks, 10);

    const parsedIngredients: SupplementIngredient[] | undefined =
      customIngredients.length > 0
        ? customIngredients.map(ci => ({
            ...ci,
            nutrient_id: canonicalizeNutrientId(ci.nutrient_id || ci.nutrient_name)
          }))
        : undefined;

    const newItem: SupplementProtocolItem = {
      id: `supp_${Date.now()}`,
      catalog_id: selectedCatalogId || undefined,
      physical_product_key: `${newBrand || newNutrient}::${newForm}::${effectiveDose}`.toLowerCase(),
      generic_nutrient: newNutrient,
      chemical_form: newForm || 'Standardized Form',
      brand_name: newBrand.trim() || undefined,
      brand_verification_status: newBrand.trim() ? 'unverified_brand' : 'generic_prescription_only',
      brand_verification_metadata: {
        product_identity_verified: false,
        formulation_verified: false,
        regulatory_status: 'unverified',
        retail_availability_status: 'not_checked',
        verification_source: 'Clinician manual entry — product identity & label require verification'
      },
      ingredients: parsedIngredients,
      product_strength_text: newStrengthText.trim() || undefined,
      prescribed_units_per_dose: unitsNum,
      is_dose_unknown: isDoseUnknown || effectiveDose === 'UNKNOWN',
      is_frequency_unknown: newFreq === 'unknown',
      is_timing_unknown: isTimingUnknown || newTime === 'UNKNOWN',
      route: newRoute || 'oral',
      indication_en: newIndicationEn || 'Targeted nutritional protocol',
      indication_bn: newIndicationBn || 'টার্গেটেড পুষ্টিগত সহায়তা',
      evidence_category: 'evidence_based',
      total_compound_dose: effectiveDose,
      frequency: newFreq,
      administration_time: isTimingUnknown ? 'UNKNOWN' : newTime,
      relationship_to_food: newFoodRel,
      duration_weeks: !isNaN(durNum) && durNum > 0 ? durNum : undefined,
      monitoring_parameters: ['Serum levels', 'Symptom resolution'],
      contraindications: [],
      known_interactions: [],
      approval_status: 'draft_candidate',
      source: 'clinician_manual_entry'
    };

    onChange([...supplements, newItem]);

    setNewNutrient('');
    setNewForm('');
    setNewBrand('');
    setNewDose('');
    setNewStrengthText('');
    setIsDoseUnknown(false);
    setIsTimingUnknown(false);
    setNewDurationWeeks('');
    setCustomIngredients([]);
    setShowAddForm(false);
  };

  const approvedCount = supplements.filter(s => s.approval_status === 'clinician_approved').length;
  const candidateCount = supplements.filter(s => s.approval_status === 'draft_candidate').length;
  const exposureBuckets = Object.values(exposureSummary.exposures_by_nutrient);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            {bn ? 'সাপ্লিমেন্ট ও এলিমেন্টাল ডোজিং প্রোটোকল (R7)' : 'Individualized Supplement & Elemental Exposure Engine (R7)'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {bn
              ? 'ক্লিনিশিয়ানের অনুমোদন ছাড়া কোনো ড্রাফট সাপ্লিমেন্ট রোগীর চূড়ান্ত রিপোর্টে যুক্ত হয় না।'
              : 'Multi-ingredient elemental math, approved vs proposed isolation, UL gates & honest brand provenance.'}
          </p>
        </div>

        <button
          type="button"
          data-testid="r7-btn-add-supplement"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>{bn ? 'নতুন সাপ্লিমেন্ট যুক্ত করুন' : 'Add Supplement Formulation'}</span>
        </button>
      </div>

      {/* R7 Live Combined Nutrient Exposure & Overlap Screening */}
      {exposureBuckets.length > 0 && (
        <div
          data-testid="r7-supplement-exposure-panel"
          className="p-4 rounded-2xl border border-border bg-card space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Layers className="h-4 w-4 text-primary" />
              <span>{bn ? 'সম্মিলিত পুষ্টি মাত্রা ও UL নিরাপত্তা বিশ্লেষণ' : 'Cumulative Nutrient Exposure vs Life-Stage Upper Limits (UL)'}</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              Approved ({approvedCount}) + Candidate ({candidateCount})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            {exposureBuckets.map(bucket => (
              <div
                key={bucket.nutrient_id}
                className={`p-3 rounded-xl border space-y-1 ${
                  bucket.exceeds_ul
                    ? 'border-rose-500/50 bg-rose-500/5'
                    : bucket.is_incomplete_exposure || bucket.exceeds_single_dose_threshold
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-border bg-secondary/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <strong className="text-foreground">{bucket.nutrient_name}</strong>
                  <span className="font-mono font-bold text-[11px]">
                    {bucket.combined_daily} {bucket.unit}/day
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground flex flex-wrap gap-2">
                  <span>Current Approved: <strong>{bucket.current_approved_daily}</strong></span>
                  <span>Proposed Candidate: <strong>{bucket.proposed_candidate_daily}</strong></span>
                  <span>UL ({bucket.ul_life_stage}): <strong>{bucket.tolerable_upper_limit ?? 'N/A'} {bucket.tolerable_upper_limit !== undefined ? bucket.unit : ''}</strong></span>
                </div>
                {bucket.exceeds_ul && (
                  <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                    Exceeds Tolerable Upper Limit ({bucket.tolerable_upper_limit} {bucket.unit}/day)
                  </div>
                )}
                {bucket.is_incomplete_exposure && (
                  <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                    Incomplete exposure — unknown dose or bolus/PRN schedule
                  </div>
                )}
              </div>
            ))}
          </div>

          {exposureSummary.physical_duplicates.length > 0 && (
            <div className="text-[11px] text-blue-700 dark:text-blue-300 bg-blue-500/10 p-2 rounded-lg border border-blue-500/20 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>
                Deduplicated identical physical product entries: {exposureSummary.physical_duplicates.map(d => d.label).join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Status Summary Banner */}
      <div className="flex flex-wrap gap-3 p-3.5 rounded-xl bg-secondary/40 border border-border text-xs">
        <span className="flex items-center gap-1.5 font-bold text-emerald-500">
          <CheckCircle2 className="h-4 w-4" />
          {approvedCount} {bn ? 'অনুমোদিত সাপ্লিমেন্ট' : 'Clinician Approved'}
        </span>
        <span className="text-muted-foreground">•</span>
        <span className="flex items-center gap-1.5 font-bold text-amber-500">
          <AlertTriangle className="h-4 w-4" />
          {candidateCount} {bn ? 'প্রস্তাবিত ড্রাফট (অপেক্ষমাণ)' : 'Proposed Candidates (Awaiting Review)'}
        </span>
      </div>

      {/* Add Manual Supplement Form */}
      {showAddForm && (
        <form onSubmit={handleAddSupplement} className="p-5 rounded-2xl border border-primary/30 bg-card space-y-4 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="text-sm font-bold text-foreground">
              {bn ? 'নতুন সাপ্লিমেন্ট ফর্মুলেশন যোগ করুন' : 'Configure Structured Supplement Item'}
            </h3>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="md:col-span-2">
              <label className="text-muted-foreground font-semibold mb-1 block">
                {bn ? 'ক্যাটালগ থেকে নির্বাচন (ঐচ্ছিক):' : 'Select from Clinical Catalog (Optional):'}
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder={bn ? 'ক্যাটালগ সার্চ করুন...' : 'Filter catalog...'}
                  value={catalogQuery}
                  onChange={e => setCatalogQuery(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-secondary/40 text-xs text-foreground"
                />
                <select
                  value={selectedCatalogId}
                  onChange={handleSelectCatalogItem}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground"
                >
                  <option value="">-- {bn ? 'কাস্টম এন্ট্রি বা ক্যাটালগ বাছাই করুন' : 'Custom Entry or Select Catalog Product'} --</option>
                  {(supplementsData as any[])
                    .filter(s =>
                      !catalogQuery ||
                      s.name_en.toLowerCase().includes(catalogQuery.toLowerCase()) ||
                      s.category.toLowerCase().includes(catalogQuery.toLowerCase())
                    )
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name_en} ({s.recommended_dose})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-muted-foreground font-semibold mb-1 block">{bn ? 'পুষ্টি/উপাদান *:' : 'Product / Generic Name *:'}</label>
              <input
                type="text"
                required
                placeholder="e.g. Magnesium Bisglycinate + B6"
                value={newNutrient}
                onChange={e => setNewNutrient(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              />
            </div>

            <div>
              <label className="text-muted-foreground font-semibold mb-1 block">{bn ? 'ব্র্যান্ড নাম (যদি থাকে):' : 'Brand Name (Unverified unless DGDA checked):'}</label>
              <input
                type="text"
                placeholder="Optional brand reference"
                value={newBrand}
                onChange={e => setNewBrand(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              />
            </div>

            <div>
              <label className="text-muted-foreground font-semibold mb-1 block">{bn ? 'প্রোডাক্টের স্ট্রেংথ:' : 'Product Strength on Label:'}</label>
              <input
                type="text"
                placeholder="e.g. 200 mg elemental per tablet"
                value={newStrengthText}
                onChange={e => setNewStrengthText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              />
            </div>

            <div>
              <label className="text-muted-foreground font-semibold mb-1 block">{bn ? 'প্রেসক্রাইবড ডোজ *:' : 'Prescribed Dose & Unit *:'}</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  disabled={isDoseUnknown}
                  required={!isDoseUnknown}
                  placeholder="e.g. 200 mg elemental"
                  value={isDoseUnknown ? 'UNKNOWN' : newDose}
                  onChange={e => setNewDose(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono"
                />
                <label className="flex items-center gap-1 text-[11px] shrink-0">
                  <input
                    type="checkbox"
                    checked={isDoseUnknown}
                    onChange={e => setIsDoseUnknown(e.target.checked)}
                  />
                  Unknown Dose
                </label>
              </div>
            </div>

            <div>
              <label className="text-muted-foreground font-semibold mb-1 block">{bn ? 'গ্রহণের মাত্রা (Frequency):' : 'Frequency:'}</label>
              <select
                value={newFreq}
                onChange={e => setNewFreq(e.target.value as SupplementFrequency)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="once_daily">{bn ? 'দিনে ১ বার (OD)' : 'Once Daily (OD)'}</option>
                <option value="twice_daily">{bn ? 'দিনে ২ বার (BD)' : 'Twice Daily (BD)'}</option>
                <option value="thrice_daily">{bn ? 'দিনে ৩ বার (TDS)' : 'Thrice Daily (TDS)'}</option>
                <option value="weekly">{bn ? 'সপ্তাহে ১ দিন' : 'Once Weekly'}</option>
                <option value="twice_weekly">{bn ? 'সপ্তাহে ২ দিন' : 'Twice Weekly'}</option>
                <option value="alternate_days">{bn ? 'একদিন পর পর' : 'Alternate Days'}</option>
                <option value="single_bolus">{bn ? 'একক বোলাস ডোজ' : 'Single Bolus Dose'}</option>
                <option value="as_needed">{bn ? 'প্রয়োজনে (PRN)' : 'As Needed (PRN)'}</option>
                <option value="unknown">{bn ? 'অজ্ঞাত' : 'Unknown'}</option>
              </select>
            </div>

            <div>
              <label className="text-muted-foreground font-semibold mb-1 block">{bn ? 'সময় (২৪ ঘণ্টা):' : 'Administration Time:'}</label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  disabled={isTimingUnknown}
                  value={isTimingUnknown ? '' : newTime}
                  onChange={e => setNewTime(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono"
                />
                <label className="flex items-center gap-1 text-[11px] shrink-0">
                  <input
                    type="checkbox"
                    checked={isTimingUnknown}
                    onChange={e => setIsTimingUnknown(e.target.checked)}
                  />
                  Unknown Time
                </label>
              </div>
            </div>

            <div>
              <label className="text-muted-foreground font-semibold mb-1 block">{bn ? 'পদ্ধতি (Route):' : 'Route:'}</label>
              <select
                value={newRoute}
                onChange={e => setNewRoute(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="oral">Oral</option>
                <option value="sublingual">Sublingual</option>
                <option value="intramuscular">Intramuscular (IM)</option>
                <option value="intravenous">Intravenous (IV)</option>
              </select>
            </div>

            <div>
              <label className="text-muted-foreground font-semibold mb-1 block">{bn ? 'খাবারের সাথে সম্পর্ক:' : 'Meal Relationship:'}</label>
              <select
                value={newFoodRel}
                onChange={e => setNewFoodRel(e.target.value as FoodRelationship)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="empty_stomach_waking">{bn ? 'সকালে খালি পেটে' : 'Empty Stomach Upon Waking'}</option>
                <option value="with_breakfast">{bn ? 'সকালের নাশতার সাথে' : 'With Breakfast'}</option>
                <option value="with_lunch">{bn ? 'দুপুরের খাবারের সাথে' : 'With Lunch'}</option>
                <option value="with_fatty_meal">{bn ? 'চর্বিযুক্ত খাবারের সাথে' : 'With Fat-Containing Meal'}</option>
                <option value="with_dinner">{bn ? 'রাতের খাবারের সাথে' : 'With Dinner'}</option>
                <option value="between_meals">{bn ? 'দুই খাবারের মাঝে' : 'Between Meals'}</option>
                <option value="before_bed">{bn ? 'ঘুমানোর পূর্বে' : 'Before Bed'}</option>
                <option value="independent_of_meals">{bn ? 'যেকোনো সময়' : 'Independent of Meals'}</option>
              </select>
            </div>

            <div>
              <label className="text-muted-foreground font-semibold mb-1 block">{bn ? 'মেয়াদ (সপ্তাহ):' : 'Duration (Weeks):'}</label>
              <input
                type="number"
                min="1"
                data-testid="r7-input-duration-weeks"
                placeholder="e.g. 8"
                value={newDurationWeeks}
                onChange={e => setNewDurationWeeks(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono"
              />
            </div>
          </div>

          {/* Multi-Ingredient Composer */}
          <div className="p-3 rounded-xl bg-secondary/30 border border-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">
                {bn ? 'মাল্টি-ইনগ্রেডিয়েন্ট এলিমেন্টাল ব্রেকডাউন' : 'Structured Ingredients (Elemental Mass Decomposition)'}
              </span>
              <button
                type="button"
                onClick={handleAddIngredientRow}
                className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-muted font-semibold text-[11px] flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add Ingredient
              </button>
            </div>
            {customIngredients.map((ing, idx) => (
              <div key={ing.id || idx} className="grid grid-cols-4 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Nutrient (Magnesium)"
                  value={ing.nutrient_name}
                  onChange={e => {
                    const next = [...customIngredients];
                    next[idx] = { ...ing, nutrient_name: e.target.value, nutrient_id: canonicalizeNutrientId(e.target.value) };
                    setCustomIngredients(next);
                  }}
                  className="px-2 py-1 rounded border border-border bg-background"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Elemental"
                  value={ing.elemental_amount_per_unit ?? ''}
                  onChange={e => {
                    const next = [...customIngredients];
                    next[idx] = { ...ing, elemental_amount_per_unit: parseFloat(e.target.value) || undefined };
                    setCustomIngredients(next);
                  }}
                  className="px-2 py-1 rounded border border-border bg-background font-mono"
                />
                <select
                  value={ing.amount_unit || 'mg'}
                  onChange={e => {
                    const next = [...customIngredients];
                    next[idx] = { ...ing, amount_unit: e.target.value as any };
                    setCustomIngredients(next);
                  }}
                  className="px-2 py-1 rounded border border-border bg-background"
                >
                  <option value="mg">mg</option>
                  <option value="mcg">mcg</option>
                  <option value="IU">IU</option>
                </select>
                <button
                  type="button"
                  onClick={() => setCustomIngredients(prev => prev.filter((_, i) => i !== idx))}
                  className="px-2 py-1 rounded bg-rose-500/10 text-rose-500 text-[11px]"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-muted text-foreground"
            >
              {bn ? 'বাতিল করুন' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-primary-foreground"
            >
              {bn ? 'ড্রাফট হিসেবে যোগ করুন' : 'Add to Protocol Draft'}
            </button>
          </div>
        </form>
      )}

      {/* Supplements List */}
      <div className="space-y-3">
        {supplements.length === 0 ? (
          <div className="text-center p-8 rounded-2xl border border-dashed border-border text-muted-foreground text-xs">
            {bn ? 'কোনো সাপ্লিমেন্ট এখনো নির্ধারিত হয়নি।' : 'No supplements added to protocol yet.'}
          </div>
        ) : (
          supplements.map(item => {
            const isApproved = item.approval_status === 'clinician_approved';
            const isRejected = item.approval_status === 'rejected' || item.approval_status === 'discontinued';
            const verificationBadge =
              item.brand_verification_status === 'verified_bd_market'
                ? 'Verified'
                : item.brand_verification_status === 'generic_prescription_only'
                ? 'Generic'
                : item.brand_verification_status === 'catalog_unverified'
                ? 'Catalog (Unverified Label)'
                : 'Unverified Brand';

            return (
              <div
                key={item.id}
                data-testid={`r7-supplement-card-${item.id}`}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isApproved
                    ? 'bg-card border-emerald-500/40 shadow-2xs'
                    : isRejected
                    ? 'bg-secondary/20 border-border opacity-50'
                    : 'bg-amber-500/5 border-amber-500/30'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-extrabold text-foreground">
                      {item.generic_nutrient}
                    </span>
                    {item.brand_name && (
                      <span
                        data-testid={`supp-brand-prov-${item.id}`}
                        className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md"
                      >
                        {item.brand_name} ({verificationBadge})
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isApproved
                        ? 'bg-emerald-500/20 text-emerald-500'
                        : isRejected
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-amber-500/20 text-amber-500'
                    }`}>
                      {isApproved
                        ? (bn ? 'অনুমোদিত' : 'Approved')
                        : item.approval_status === 'rejected'
                        ? (bn ? 'বাতিল' : 'Rejected')
                        : item.approval_status === 'discontinued'
                        ? (bn ? 'বন্ধ' : 'Discontinued')
                        : (bn ? 'প্রস্তাবিত ড্রাফট' : 'Draft Candidate')}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-secondary text-foreground">
                      {item.total_compound_dose} • {item.frequency.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {bn ? item.indication_bn : item.indication_en}
                  </p>

                  {item.ingredients && item.ingredients.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {item.ingredients.map((ing, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-secondary/60 border border-border font-mono">
                          {ing.nutrient_name}: {ing.is_elemental_known ? `${ing.elemental_amount_per_unit} ${ing.amount_unit}` : 'UNKNOWN elemental'}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.monitoring_indication && (
                    <div className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                      {item.monitoring_indication}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground font-medium">
                    <span className="flex items-center gap-1 font-mono text-foreground font-bold">
                      <Clock className="h-3 w-3 text-primary" />
                      {item.administration_time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Utensils className="h-3 w-3 text-muted-foreground" />
                      {item.relationship_to_food.replace(/_/g, ' ')}
                    </span>
                    {item.route && <span className="uppercase font-mono text-[10px]">{item.route}</span>}
                    {item.duration_weeks && (
                      <span>{bn ? `${item.duration_weeks} সপ্তাহ` : `${item.duration_weeks} Weeks`}</span>
                    )}
                    {item.contraindications.length > 0 && (
                      <span className="flex items-center gap-1 text-rose-500">
                        <ShieldAlert className="h-3 w-3" />
                        {bn ? 'সতর্কতা: ' : 'CI: '}{item.contraindications.slice(0, 2).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {!isApproved && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(item.id, 'clinician_approved')}
                      className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                      title={bn ? 'অনুমোদন করুন' : 'Approve Supplement'}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  {isApproved && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(item.id, 'discontinued')}
                      className="px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-muted text-muted-foreground text-xs font-semibold"
                    >
                      {bn ? 'বন্ধ করুন' : 'Discontinue'}
                    </button>
                  )}
                  {!isRejected && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(item.id, 'rejected')}
                      className="p-2 rounded-lg bg-secondary hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500 transition-colors"
                      title={bn ? 'বাতিল করুন' : 'Reject'}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg bg-secondary hover:bg-rose-500 text-muted-foreground hover:text-white transition-colors"
                    title={bn ? 'মুছে ফেলুন' : 'Delete'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
