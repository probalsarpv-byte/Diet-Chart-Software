'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  R5MedicationRecord
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
  FileQuestion
} from 'lucide-react';

interface SmartMedicationPickerProps {
  onSelectMedication: (med: Partial<R5MedicationRecord>) => void;
  onCancel?: () => void;
}

export const SmartMedicationPicker: React.FC<SmartMedicationPickerProps> = ({
  onSelectMedication,
  onCancel
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isCustomMode, setIsCustomMode] = useState(false);

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
    const isCombo = identifyCombinationDrug(item.generic_name);

    onSelectMedication({
      brand_name: item.brand_name || undefined,
      generic_name: item.generic_name,
      manufacturer: item.manufacturer || undefined,
      formulation: item.formulation || 'Tablet',
      product_strength: item.strength || undefined,
      prescribed_dose: item.strength ? item.strength.split(' ')[0] : '1',
      dose_unit: item.strength && item.strength.includes('mg') ? 'mg' : 'tablets',
      frequency: 'Once Daily',
      route: 'Oral',
      administration_times: ['08:00'],
      is_timing_unknown: false,
      relationship_to_meals: 'with_meal',
      status: 'active',
      is_prn: false,
      verification_status: 'clinician_verified',
      rule_coverage: item.rule_coverage,
      source: 'clinician_entry',
      notes: isCombo.is_combination
        ? `Combination medication: ${isCombo.individual_actives.join(' + ')}`
        : undefined
    });
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGeneric.trim()) return;

    const isCombo = identifyCombinationDrug(customGeneric);

    onSelectMedication({
      brand_name: customBrand.trim() || undefined,
      generic_name: customGeneric.trim(),
      formulation: customForm,
      product_strength: customStrength.trim() || undefined,
      prescribed_dose: customStrength.trim() || '1',
      dose_unit: customStrength.includes('mg') ? 'mg' : 'units',
      frequency: 'Once Daily',
      route: 'Oral',
      administration_times: ['08:00'],
      is_timing_unknown: false,
      relationship_to_meals: 'with_meal',
      status: 'active',
      is_prn: false,
      verification_status: 'clinician_verified',
      rule_coverage: 'rules_unavailable',
      source: 'clinician_entry',
      notes: isCombo.is_combination
        ? `Custom combination drug: ${isCombo.individual_actives.join(' + ')}`
        : 'Manually entered custom medication'
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-md p-4" data-testid="smart-medication-picker">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Pill className="w-5 h-5 text-teal-600" />
          <h4 className="text-sm font-semibold text-slate-800">
            Smart Medication Search & Reconciliation
          </h4>
          <span className="text-xs text-slate-500 font-normal">
            (ওষুধ অনুসন্ধান ও সংযোজন)
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

      {!isCustomMode ? (
        <div className="mt-3 space-y-3">
          {/* Search Input */}
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
                          <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
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
      ) : (
        /* Manual Custom Form */
        <form onSubmit={handleAddCustom} className="mt-3 space-y-3" data-testid="custom-medication-form">
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
              Add Medication
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
