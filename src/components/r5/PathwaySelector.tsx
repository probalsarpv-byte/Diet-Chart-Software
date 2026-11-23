'use client';

import React, { useState, useMemo } from 'react';
import {
  R5ClinicalPathwayId,
  ClinicalPathwayCategory,
  PathwaySelectionState
} from '../../types/r5Systems';
import {
  CLINICAL_PATHWAYS_REGISTRY,
  determinePathwaySelectionState
} from '../../engine/r5PathwayRegistry';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Shield,
  Layers,
  Heart,
  Activity,
  Flame,
  Brain,
  Zap
} from 'lucide-react';

interface PathwaySelectorProps {
  selectedPathwayIds: R5ClinicalPathwayId[];
  isExplicitlyNoPathways?: boolean;
  onChange: (selectedIds: R5ClinicalPathwayId[], isExplicitlyNoPathways: boolean) => void;
  readOnly?: boolean;
}

const CATEGORY_LABELS: Record<ClinicalPathwayCategory, { en: string; bn: string; icon: any }> = {
  'Metabolic & Organ Systems': { en: 'Metabolic & Organ Systems', bn: 'বিপাকীয় ও অঙ্গসংস্থান', icon: Activity },
  'Immune & Inflammatory': { en: 'Immune & Inflammatory', bn: 'রোগপ্রতিরোধ ও প্রদাহজনিত', icon: Flame },
  'Neuropsychiatric & Brain': { en: 'Neuropsychiatric & Brain', bn: 'মানসিক স্বাস্থ্য ও স্নায়বিক', icon: Brain },
  'Surgical & Acute Care': { en: 'Surgical & Acute Care', bn: 'অস্ত্রোপচার ও জরুরি যত্ন', icon: Heart },
  'Life Span & Musculoskeletal': { en: 'Life Span & Musculoskeletal', bn: 'জীবনকাল ও অস্থিকঙ্কাল', icon: Zap }
};

export const PathwaySelector: React.FC<PathwaySelectorProps> = ({
  selectedPathwayIds,
  isExplicitlyNoPathways = false,
  onChange,
  readOnly = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ClinicalPathwayCategory | 'ALL'>('ALL');

  const selectionState = determinePathwaySelectionState(selectedPathwayIds, isExplicitlyNoPathways);

  // Filtered pathways
  const filteredPathways = useMemo(() => {
    return CLINICAL_PATHWAYS_REGISTRY.filter(p => {
      // Category filter
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchEn = p.title_en.toLowerCase().includes(q) || p.description_en.toLowerCase().includes(q);
        const matchBn = p.title_bn.includes(q) || p.description_bn.includes(q);
        const matchKey = p.relevant_conditions_map.some(k => k.toLowerCase().includes(q));
        return matchEn || matchBn || matchKey;
      }
      return true;
    });
  }, [searchQuery, selectedCategory]);

  const handleTogglePathway = (id: R5ClinicalPathwayId) => {
    if (readOnly) return;
    if (selectedPathwayIds.includes(id)) {
      const next = selectedPathwayIds.filter(x => x !== id);
      onChange(next, false);
    } else {
      onChange([...selectedPathwayIds, id], false);
    }
  };

  const handleSelectNoPathways = () => {
    if (readOnly) return;
    if (isExplicitlyNoPathways) {
      onChange([], false);
    } else {
      onChange([], true);
    }
  };

  const handleClearAll = () => {
    if (readOnly) return;
    onChange([], false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" data-testid="r5-pathway-selector">
      {/* Header & Status Indicator */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-800 text-base">
              Clinical Pathways Registry & Matrix (R5)
            </h3>
            <span className="text-xs text-slate-500 font-normal">
              (ক্লিনিক্যাল পাথওয়ে নির্বাচন)
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Select one or more active clinical condition pathways, or designate healthy preventive care.
          </p>
        </div>

        {/* State Badge */}
        <div className="flex items-center gap-2">
          {selectionState === 'PATHWAYS_SELECTED' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {selectedPathwayIds.length} Active Pathway(s) Selected
            </span>
          )}
          {selectionState === 'NO_KNOWN_PATHWAY' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
              <Shield className="w-3.5 h-3.5" />
              Healthy Preventive / No Known Disease Pathway
            </span>
          )}
          {selectionState === 'NOT_ASSESSED' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5" />
              Assessment Incomplete / Not Assessed
            </span>
          )}

          {!readOnly && (selectedPathwayIds.length > 0 || isExplicitlyNoPathways) && (
            <button
              onClick={handleClearAll}
              className="text-xs text-slate-500 hover:text-rose-600 px-2 py-1 rounded border border-slate-200 bg-white hover:bg-rose-50 transition"
              title="Reset Pathway Selections"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Explicit "Healthy / No Known Pathway" Card */}
      {!readOnly && (
        <div className="p-4 border-b border-slate-100 bg-teal-50/40">
          <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
            isExplicitlyNoPathways
              ? 'bg-teal-50 border-teal-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}>
            <input
              type="checkbox"
              checked={isExplicitlyNoPathways}
              onChange={handleSelectNoPathways}
              className="mt-1 h-4 w-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              data-testid="no-known-pathways-checkbox"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">
                  No Known Chronic Disease Pathways / General Wellness & Preventive Care
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-medium">
                  সুস্থ / প্রতিরোধমূলক পুষ্টি
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Designates that the patient has undergone assessment and currently presents without active chronic multi-system pathology. Enables general life-stage precision nutrition recommendations.
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Selected Chips */}
      {selectedPathwayIds.length > 0 && (
        <div className="p-3 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 mr-1">Active Pathways:</span>
          {selectedPathwayIds.map(id => {
            const pathway = CLINICAL_PATHWAYS_REGISTRY.find(p => p.id === id);
            if (!pathway) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-900 border border-teal-200"
              >
                <span>{pathway.title_en}</span>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleTogglePathway(id)}
                    className="p-0.5 hover:bg-teal-200 rounded-full text-teal-700 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* Search and Category Filter Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search pathways (e.g. diabetes, renal, gut, ডায়াবেটিস, কিডনি)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
            disabled={isExplicitlyNoPathways}
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            disabled={isExplicitlyNoPathways}
            className={`px-2.5 py-1 text-xs rounded-lg transition font-medium ${
              selectedCategory === 'ALL'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            } ${isExplicitlyNoPathways ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            All Categories ({CLINICAL_PATHWAYS_REGISTRY.length})
          </button>
          {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => {
            const count = CLINICAL_PATHWAYS_REGISTRY.filter(p => p.category === catKey).length;
            const isSelected = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setSelectedCategory(catKey as ClinicalPathwayCategory)}
                disabled={isExplicitlyNoPathways}
                className={`px-2.5 py-1 text-xs rounded-lg transition font-medium flex items-center gap-1 ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                } ${isExplicitlyNoPathways ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span>{label.en}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-teal-800 text-teal-100' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pathway Cards Grid */}
      <div className={`p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto ${
        isExplicitlyNoPathways ? 'opacity-40 pointer-events-none' : ''
      }`}>
        {filteredPathways.map(pathway => {
          const isSelected = selectedPathwayIds.includes(pathway.id);
          const catMeta = CATEGORY_LABELS[pathway.category];
          const IconComp = catMeta?.icon || Activity;

          return (
            <div
              key={pathway.id}
              onClick={() => handleTogglePathway(pathway.id)}
              className={`p-3 rounded-lg border transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-teal-50/70 border-teal-400 shadow-sm ring-1 ring-teal-400/30'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
              data-testid={`pathway-card-${pathway.id}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <IconComp className={`w-4 h-4 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-semibold text-slate-800 leading-tight">
                      {pathway.title_en}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="h-3.5 w-3.5 text-teal-600 rounded border-slate-300 mt-0.5"
                    disabled={readOnly}
                  />
                </div>
                <div className="text-[11px] text-teal-800 font-medium mt-0.5">
                  {pathway.title_bn}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {pathway.description_en}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span className="uppercase tracking-wider font-semibold">
                  {catMeta?.en || pathway.category}
                </span>
                {pathway.relevant_conditions_map && pathway.relevant_conditions_map.length > 0 && (
                  <span className="text-slate-500 font-medium flex items-center gap-0.5">
                    {pathway.relevant_conditions_map.length} Condition Match(es)
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredPathways.length === 0 && (
          <div className="col-span-full py-8 text-center text-slate-400 text-xs">
            No clinical pathways match the search filter "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  );
};
