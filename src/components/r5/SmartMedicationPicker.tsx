'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  R5MedicationRecord,
  R5RuleCoverageStatus
} from '../../types/r5Systems';
import {
  searchMedications,
  SearchResultItem,
  identifyCombinationDrug
} from '../../engine/r5MedicationSearchEngine';
import {
  Search,
  Pill,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Building,
  CheckCircle,
  X,
  FileQuestion,
  Clock,
  ArrowLeft,
  Syringe
} from 'lucide-react';

interface SmartMedicationPickerProps {
  onSelectMedication: (med: Partial<R5MedicationRecord>) => void;
  onCancel?: () => void;
}

function isInsulinDrug(genericName: string, brandName?: string): boolean {
  const g = (genericName || '').toLowerCase();
  const b = (brandName || '').toLowerCase();
  const insulinKeywords = ['insulin', 'glargine', 'degludec', 'aspart', 'lispro', 'glulisine', 'detemir', 'lantus', 'novorapid', 'humalog', 'tresiba', 'apidra', 'mixtard', 'ryzodeg', 'ইনসুলিন'];
  return insulinKeywords.some(k => g.includes(k) || b.includes(k));
}

interface StagedDrugItem {
  brand_name?: string;
  generic_name: string;
  strength?: string;
  formulation?: string;
  manufacturer?: string;
  rule_coverage: R5RuleCoverageStatus;
}

export const SmartMedicationPicker: React.FC<SmartMedicationPickerProps> = ({
  onSelectMedication,
  onCancel
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Staged drug for detailed prescription verification
  const [stagedDrug, setStagedDrug] = useState<StagedDrugItem | null>(null);

  // Staged input fields (explicitly uninvented / safe defaults)
  const [stagedPrescribedDose, setStagedPrescribedDose] = useState('');
  const [stagedDoseUnit, setStagedDoseUnit] = useState('mg');
  const [stagedFrequency, setStagedFrequency] = useState('');
  const [stagedMealRel, setStagedMealRel] = useState<'with_meal' | 'before_meal_empty_stomach' | 'after_meal' | 'independent_of_meals' | 'bedtime' | 'unknown'>('unknown');
  const [stagedIsTimingUnknown, setStagedIsTimingUnknown] = useState(true);
  const [stagedAdminTimes, setStagedAdminTimes] = useState('');
  const [stagedRoute, setStagedRoute] = useState('Oral');
  const [stagedIsPrn, setStagedIsPrn] = useState(false);
  const [stagedVerificationStatus, setStagedVerificationStatus] = useState<'patient_reported' | 'clinician_verified' | 'prescription_documented' | 'unverified'>('patient_reported');
  const [stagedInsulinUnits, setStagedInsulinUnits] = useState('');
  const [stagedInsulinRegimen, setStagedInsulinRegimen] = useState('basal_only');
  const [stagedNotes, setStagedNotes] = useState('');

  // Custom drug fields
  const [customGeneric, setCustomGeneric] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [customStrength, setCustomStrength] = useState('');
  const [customForm, setCustomForm] = useState('Tablet');

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      const searchRes = searchMedications(query, 15);
      setResults(searchRes);
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  const handlePickResult = (item: SearchResultItem) => {
    const isInsulin = isInsulinDrug(item.generic_name, item.brand_name);
    let defaultUnit = 'mg';
    if (item.strength) {
      if (item.strength.includes('mcg')) defaultUnit = 'mcg';
      else if (item.strength.includes('mg')) defaultUnit = 'mg';
      else if (item.strength.includes('g') && !item.strength.includes('mg')) defaultUnit = 'g';
      else if (item.strength.includes('units') || isInsulin) defaultUnit = 'units';
      else if (item.strength.includes('mL') || item.strength.includes('ml')) defaultUnit = 'mL';
      else defaultUnit = 'tablets';
    } else if (isInsulin) {
      defaultUnit = 'units';
    }

    setStagedDrug({
      brand_name: item.brand_name || undefined,
      generic_name: item.generic_name,
      strength: item.strength || undefined,
      formulation: item.formulation || 'Tablet',
      manufacturer: item.manufacturer || undefined,
      rule_coverage: item.rule_coverage
    });

    // CRITICAL CLINICAL SAFETY DEFAULTS:
    // Never auto-set prescribed dose to product strength or 1 tablet.
    // Never default frequency to Once daily.
    // Never default meal relationship to with_meal.
    // Never default timing to 08:00 (isTimingUnknown = true).
    // Never default verification to clinician_verified without clinical review.
    setStagedPrescribedDose('');
    setStagedDoseUnit(defaultUnit);
    setStagedFrequency('');
    setStagedMealRel('unknown');
    setStagedIsTimingUnknown(true);
    setStagedAdminTimes('');
    setStagedRoute(item.formulation === 'Injection' || isInsulin ? 'Subcutaneous' : 'Oral');
    setStagedIsPrn(false);
    setStagedVerificationStatus('patient_reported');
    setStagedInsulinUnits('');
    setStagedInsulinRegimen('basal_only');
    setStagedNotes('');
  };

  const handleStageCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGeneric.trim()) return;

    const isInsulin = isInsulinDrug(customGeneric, customBrand);
    setStagedDrug({
      brand_name: customBrand.trim() || undefined,
      generic_name: customGeneric.trim(),
      strength: customStrength.trim() || undefined,
      formulation: customForm,
      rule_coverage: 'rules_unavailable'
    });

    setStagedPrescribedDose('');
    setStagedDoseUnit(isInsulin ? 'units' : (customStrength.includes('mg') ? 'mg' : 'tablets'));
    setStagedFrequency('');
    setStagedMealRel('unknown');
    setStagedIsTimingUnknown(true);
    setStagedAdminTimes('');
    setStagedRoute(customForm === 'Injection' || isInsulin ? 'Subcutaneous' : 'Oral');
    setStagedIsPrn(false);
    setStagedVerificationStatus('patient_reported');
    setStagedInsulinUnits('');
    setStagedInsulinRegimen('basal_only');
    setStagedNotes('Manually entered custom medication');
    setIsCustomMode(false);
  };

  const handleConfirmStaged = () => {
    if (!stagedDrug) return;

    const isCombo = identifyCombinationDrug(stagedDrug.generic_name);
    const isInsulin = isInsulinDrug(stagedDrug.generic_name, stagedDrug.brand_name);

    const doseToSave = stagedPrescribedDose.trim() ? stagedPrescribedDose.trim() : 'UNKNOWN';
    const freqToSave = stagedFrequency.trim() ? stagedFrequency.trim() : 'UNKNOWN';

    onSelectMedication({
      brand_name: stagedDrug.brand_name || undefined,
      generic_name: stagedDrug.generic_name,
      manufacturer: stagedDrug.manufacturer || undefined,
      formulation: stagedDrug.formulation || 'Tablet',
      product_strength: stagedDrug.strength || undefined,
      prescribed_dose: doseToSave,
      dose_unit: stagedDoseUnit.trim() || 'mg',
      frequency: freqToSave,
      route: stagedRoute,
      administration_times: stagedIsTimingUnknown || !stagedAdminTimes.trim()
        ? []
        : stagedAdminTimes.split(',').map(s => s.trim()).filter(Boolean),
      is_timing_unknown: stagedIsTimingUnknown || !stagedAdminTimes.trim(),
      relationship_to_meals: stagedMealRel,
      status: 'active',
      is_prn: stagedIsPrn,
      verification_status: stagedVerificationStatus,
      rule_coverage: stagedDrug.rule_coverage,
      source: 'clinician_entry',
      notes: stagedNotes.trim() ? stagedNotes.trim() : (isCombo.is_combination ? `Combination medication: ${isCombo.individual_actives.join(' + ')}` : undefined),
      prescriber_instructions: isInsulin && stagedInsulinUnits ? `Prescribed insulin units: ${stagedInsulinUnits} (${stagedInsulinRegimen})` : undefined
    });

    setStagedDrug(null);
    setQuery('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-md p-4" data-testid="smart-medication-picker">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Pill className="w-5 h-5 text-teal-600" />
          <h4 className="text-sm font-semibold text-slate-800">
            Smart Medication Search & Reconciliation (Domain 13)
          </h4>
          <span className="text-xs text-slate-500 font-normal">
            (ওষুধ অনুসন্ধান ও সুনির্দিষ্ট সংযোজন)
          </span>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* STAGE 1: SEARCH / AUTOCOMPLETE VIEW */}
      {!stagedDrug && !isCustomMode && (
        <div className="mt-3 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by brand name or generic (e.g. Napa, Metformin, Seclo, Thyrox, ইনসুলিন)..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
              autoFocus
              data-testid="medication-search-input"
            />
          </div>

          {/* Results List */}
          {results.length > 0 && (
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white shadow-inner">
              {results.map((item, idx) => {
                const isCombo = identifyCombinationDrug(item.generic_name);
                return (
                  <div
                    key={`${item.brand_name}-${item.generic_name}-${idx}`}
                    onClick={() => handlePickResult(item)}
                    className="p-2.5 hover:bg-teal-50/60 cursor-pointer transition flex items-center justify-between gap-3 text-xs"
                    data-testid={`search-result-item-${idx}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 truncate">
                          {item.brand_name || item.generic_name}
                        </span>
                        {item.strength && (
                          <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded" data-testid={`result-strength-${idx}`}>
                            {item.strength}
                          </span>
                        )}
                        {item.formulation && (
                          <span className="text-[10px] text-slate-500 uppercase">
                            {item.formulation}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-teal-800 font-medium truncate mt-0.5">
                        {item.generic_name}
                      </div>

                      {item.manufacturer && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                          <Building className="w-3 h-3" />
                          <span className="truncate">{item.manufacturer}</span>
                        </div>
                      )}
                    </div>

                    {/* Rule Coverage Badge */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {item.rule_coverage === 'fully_covered' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" />
                          Rules Active
                        </span>
                      )}
                      {item.rule_coverage === 'partially_covered' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <CheckCircle className="w-3 h-3" />
                          Basic Rules
                        </span>
                      )}
                      {item.rule_coverage === 'rules_unavailable' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                          <FileQuestion className="w-3 h-3" />
                          Review
                        </span>
                      )}

                      {isCombo.is_combination && (
                        <span className="text-[9px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          Combo ({isCombo.individual_actives.length})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {query.trim() && results.length === 0 && (
            <div className="p-4 text-center text-slate-500 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p>No indexed medications match "{query}".</p>
              <button
                type="button"
                onClick={() => {
                  setCustomGeneric(query);
                  setIsCustomMode(true);
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add as Custom / Unindexed Medication
              </button>
            </div>
          )}

          <div className="pt-2 flex justify-between items-center text-xs text-slate-500">
            <span>Searching 32,400+ Bangladesh pharmaceuticals</span>
            <button
              type="button"
              onClick={() => setIsCustomMode(true)}
              className="text-teal-700 hover:underline font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Manual Custom Entry
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: STRUCTURED PRESCRIPTION ENTRY / CONFIRMATION FORM */}
      {stagedDrug && (
        <div className="mt-3 space-y-4" data-testid="medication-detail-form">
          {/* Selected Product Card */}
          <div className="p-3.5 rounded-lg bg-teal-50/70 border border-teal-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900" data-testid="selected-product-name">
                  {stagedDrug.brand_name || stagedDrug.generic_name}
                </span>
                {stagedDrug.strength && (
                  <span className="text-xs font-semibold text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-300" data-testid="product-strength-badge">
                    Product Strength: {stagedDrug.strength}
                  </span>
                )}
                {stagedDrug.formulation && (
                  <span className="text-[10px] text-slate-600 bg-teal-100/60 px-1.5 py-0.5 rounded uppercase font-medium">
                    {stagedDrug.formulation}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-700 mt-0.5 font-medium">
                Generic: <span className="font-semibold text-slate-800">{stagedDrug.generic_name}</span>
                {stagedDrug.manufacturer && <span className="text-slate-500 text-[11px] ml-2 font-normal">Mfg: {stagedDrug.manufacturer}</span>}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStagedDrug(null)}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Medicine</span>
            </button>
          </div>

          {/* Safety Notice regarding autonomous dose invention */}
          <div className="p-2.5 bg-amber-50/80 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Clinical Safety Rule:</span> Prescribed dose, frequency, and meal administration timing must be explicitly recorded from prescriber instructions. Product strength is displayed above for reference, but prescribed dose is kept explicitly unknown until entered.
            </div>
          </div>

          {/* Structured Dosage & Schedule Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Prescribed Dose */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Actual Prescribed Dose *
              </label>
              <input
                type="text"
                value={stagedPrescribedDose}
                onChange={e => setStagedPrescribedDose(e.target.value)}
                placeholder="e.g. 500, 1000, 1 tablet..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                data-testid="prescribed-dose-input"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {stagedPrescribedDose ? `Dose: ${stagedPrescribedDose}` : 'Dose currently UNKNOWN'}
              </span>
            </div>

            {/* Dose Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dose Unit
              </label>
              <input
                type="text"
                value={stagedDoseUnit}
                onChange={e => setStagedDoseUnit(e.target.value)}
                placeholder="mg, units, tablets, ml..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                data-testid="dose-unit-input"
              />
            </div>

            {/* Prescribed Frequency */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Frequency (সেবনের মাত্রা)
              </label>
              <select
                value={stagedFrequency}
                onChange={e => setStagedFrequency(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                data-testid="frequency-select"
              >
                <option value="">Select frequency (Unknown / Unspecified)</option>
                <option value="Once daily">Once daily (দিনে ১ বার)</option>
                <option value="Twice daily">Twice daily (দিনে ২ বার)</option>
                <option value="Three times daily">Three times daily (দিনে ৩ বার)</option>
                <option value="Four times daily">Four times daily (দিনে ৪ বার)</option>
                <option value="Every other day">Every other day (একদিন পর পর)</option>
                <option value="Weekly">Weekly (সপ্তাহে ১ বার)</option>
                <option value="As needed (PRN)">As needed / PRN (প্রয়োজনে)</option>
              </select>
            </div>

            {/* Meal Relationship */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Meal Relationship (খাবারের সাথে সম্পর্ক)
              </label>
              <select
                value={stagedMealRel}
                onChange={e => setStagedMealRel(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                data-testid="meal-timing-select"
              >
                <option value="unknown">Unknown / Not specified (অনির্দিষ্ট)</option>
                <option value="with_meal">With meal (খাবারের সাথে)</option>
                <option value="before_meal_empty_stomach">Before meal / Empty stomach (খাবারের পূর্বে / খালি পেটে)</option>
                <option value="after_meal">After meal (খাবারের পরে)</option>
                <option value="bedtime">Bedtime (রাতে ঘুমানোর আগে)</option>
                <option value="independent_of_meals">Independent of meals (খাবারের সাথে সম্পর্কহীন)</option>
              </select>
            </div>

            {/* Administration Times & Unknown Checkbox */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specific Timing (ঘড়ির সময়)
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  disabled={stagedIsTimingUnknown}
                  value={stagedAdminTimes}
                  onChange={e => setStagedAdminTimes(e.target.value)}
                  placeholder="e.g. 08:00, 20:00"
                  className={`w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    stagedIsTimingUnknown ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300'
                  }`}
                  data-testid="admin-times-input"
                />
                <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stagedIsTimingUnknown}
                    onChange={e => {
                      setStagedIsTimingUnknown(e.target.checked);
                      if (e.target.checked) setStagedAdminTimes('');
                    }}
                    className="rounded h-3.5 w-3.5 text-teal-600 focus:ring-teal-500"
                    data-testid="timing-unknown-checkbox"
                  />
                  <span>Timing unknown / not specified</span>
                </label>
              </div>
            </div>

            {/* Verification Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Verification Status (যাচাইকরণ)
              </label>
              <select
                value={stagedVerificationStatus}
                onChange={e => setStagedVerificationStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                data-testid="verification-status-select"
              >
                <option value="patient_reported">Patient Reported (রোগী কর্তৃক বর্ণিত)</option>
                <option value="prescription_documented">Prescription Documented (প্রেসক্রিপশন দৃশ্যমান)</option>
                <option value="clinician_verified">Clinician Verified (ক্লিনিক্যাল যাচাইকৃত)</option>
                <option value="unverified">Unverified (অযাচাইকৃত)</option>
              </select>
            </div>
          </div>

          {/* Explicit Insulin Regimen Fields if Insulin Detected */}
          {isInsulinDrug(stagedDrug.generic_name, stagedDrug.brand_name) && (
            <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 space-y-2" data-testid="insulin-regimen-section">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                <Syringe className="w-4 h-4 text-blue-600" />
                <span>Insulin Therapy Verification & Regimen Specification</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Safety Protocol Mandate: Autonomous insulin-to-carb ratio (ICR) or correction factor (ISF) calculation is prohibited. Record the prescriber's exact units and timing regimen.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-blue-900 mb-1">
                    Insulin Regimen Type
                  </label>
                  <select
                    value={stagedInsulinRegimen}
                    onChange={e => setStagedInsulinRegimen(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-300 rounded-lg focus:ring-blue-500"
                    data-testid="insulin-regimen-select"
                  >
                    <option value="basal_only">Basal Only (e.g. Glargine / Degludec at bedtime)</option>
                    <option value="rapid_acting_mealtime">Rapid-Acting Mealtime (e.g. Aspart / Lispro before meals)</option>
                    <option value="regular_insulin">Regular Insulin (Short-acting 30m before meal)</option>
                    <option value="premixed_biphasic">Premixed / Biphasic (e.g. Mixtard 30/70)</option>
                    <option value="basal_bolus">Basal-Bolus Regimen</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-blue-900 mb-1">
                    Prescribed Units per Injection
                  </label>
                  <input
                    type="text"
                    value={stagedInsulinUnits}
                    onChange={e => setStagedInsulinUnits(e.target.value)}
                    placeholder="e.g. 14 units morning, 10 units night..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-300 rounded-lg focus:ring-blue-500"
                    data-testid="insulin-units-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Clinician Notes / Prescriber Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Prescriber Instructions / Clinical Notes (ঐচ্ছিক মন্তব্য)
            </label>
            <input
              type="text"
              value={stagedNotes}
              onChange={e => setStagedNotes(e.target.value)}
              placeholder="e.g. Take with breakfast; titrate upward in 2 weeks; monitor B12..."
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              data-testid="medication-notes-input"
            />
          </div>

          {/* Confirmation Action Buttons */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStagedDrug(null)}
              className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmStaged}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition flex items-center gap-1.5"
              data-testid="confirm-medication-btn"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Confirm & Add Medication</span>
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3: MANUAL CUSTOM ENTRY */}
      {!stagedDrug && isCustomMode && (
        <form onSubmit={handleStageCustom} className="mt-3 space-y-3" data-testid="custom-medication-form">
          <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="font-semibold">Unindexed Medication Entry:</span> Please provide the active generic name. Generic classification enables automatic drug-nutrient safety verification.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Generic Name * (জেনেরিক নাম)
              </label>
              <input
                type="text"
                required
                value={customGeneric}
                onChange={e => setCustomGeneric(e.target.value)}
                placeholder="e.g. Metformin Hydrochloride"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Brand Name (ব্র্যান্ড নাম)
              </label>
              <input
                type="text"
                value={customBrand}
                onChange={e => setCustomBrand(e.target.value)}
                placeholder="e.g. Comet"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Strength (মাত্রা)
              </label>
              <input
                type="text"
                value={customStrength}
                onChange={e => setCustomStrength(e.target.value)}
                placeholder="e.g. 500 mg, 10 mg/5 mL"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Dosage Form (ফর্ম)
              </label>
              <select
                value={customForm}
                onChange={e => setCustomForm(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Tablet">Tablet (ট্যাবলেট)</option>
                <option value="Capsule">Capsule (ক্যাপসুল)</option>
                <option value="Syrup">Syrup (সিরাপ)</option>
                <option value="Injection">Injection / Insulin (ইনজেকশন)</option>
                <option value="Drops">Drops (ড্রপ)</option>
                <option value="Inhaler">Inhaler (ইনহেলার)</option>
                <option value="Sachet">Powder / Sachet (স্যাচেট)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCustomMode(false)}
              className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Back to Index Search
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Next: Record Prescribed Dose</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
