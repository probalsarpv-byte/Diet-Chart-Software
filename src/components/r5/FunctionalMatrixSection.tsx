'use client';

import React, { useState } from 'react';
import {
  FunctionalMatrixDomain,
  ATMType,
  FunctionalObservation
} from '../../types/r5Systems';
import {
  FUNCTIONAL_DOMAINS_META,
  FunctionalMatrixState
} from '../../engine/r5SystemsNetworkEngine';
import {
  Layers,
  Apple,
  ShieldCheck,
  Zap,
  Filter,
  Heart,
  Activity,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface FunctionalMatrixSectionProps {
  matrixState: FunctionalMatrixState;
  readOnly?: boolean;
}

const DOMAIN_ICONS: Record<FunctionalMatrixDomain, any> = {
  assimilation: Apple,
  defense_repair: ShieldCheck,
  energy: Zap,
  biotransformation: Filter,
  transport: Heart,
  communication: Activity,
  structural_integrity: Layers
};

export const FunctionalMatrixSection: React.FC<FunctionalMatrixSectionProps> = ({
  matrixState,
  readOnly = false
}) => {
  const [selectedDomain, setSelectedDomain] = useState<FunctionalMatrixDomain | null>('assimilation');
  const [activeAtmTab, setActiveAtmTab] = useState<ATMType | 'ALL'>('ALL');

  const domainKeys = Object.keys(FUNCTIONAL_DOMAINS_META) as FunctionalMatrixDomain[];

  const currentObservations = selectedDomain ? matrixState.domains[selectedDomain] || [] : [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" data-testid="r5-functional-matrix-section">
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-800 text-base">
              7-Domain Functional Medicine Matrix & ATM Model
            </h3>
            <span className="text-xs text-slate-500 font-normal">
              (ফাংশনাল মেডিসিন ম্যাট্রিক্স ও এটিএম ফ্রেমওয়ার্ক)
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Interconnected physiological matrix mapping root dysfunctions, antecedents, triggers, and mediators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {matrixState.total_observations} Total Finding(s)
          </span>
        </div>
      </div>

      {/* 7-Domain Interactive Grid */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
          Select Physiological Domain (শারীরবৃত্তীয় ক্ষেত্র নির্বাচন করুন)
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          {domainKeys.map(dom => {
            const meta = FUNCTIONAL_DOMAINS_META[dom];
            const Icon = DOMAIN_ICONS[dom] || Layers;
            const obsCount = (matrixState.domains[dom] || []).length;
            const isSelected = selectedDomain === dom;

            return (
              <button
                key={dom}
                type="button"
                onClick={() => setSelectedDomain(dom)}
                className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm ring-2 ring-teal-600/30'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
                data-testid={`domain-card-${dom}`}
              >
                <div className="flex items-start justify-between">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-100' : 'text-teal-600'}`} />
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-teal-700 text-white'
                      : obsCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {obsCount}
                  </span>
                </div>
                <div className="mt-2">
                  <div className={`text-xs font-semibold leading-tight ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                    {meta.name_en}
                  </div>
                  <div className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                    {meta.name_bn.split(' ')[0]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Domain Findings & ATM Details */}
      {selectedDomain && (
        <div className="p-4">
          <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
            <div>
              <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <span>{FUNCTIONAL_DOMAINS_META[selectedDomain].name_en}</span>
                <span className="text-xs text-teal-700 font-normal">
                  ({FUNCTIONAL_DOMAINS_META[selectedDomain].name_bn})
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {FUNCTIONAL_DOMAINS_META[selectedDomain].subtitle_en}
              </p>
            </div>

            {/* ATM Filter Pills */}
            <div className="flex items-center gap-1">
              {(['ALL', 'antecedent', 'trigger', 'mediator'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveAtmTab(tab)}
                  className={`px-2 py-0.5 text-xs rounded transition font-medium capitalize ${
                    activeAtmTab === tab
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab === 'ALL' ? 'All Findings' : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Observations List */}
          <div className="space-y-3">
            {currentObservations
              .filter(obs => activeAtmTab === 'ALL' || obs.atm_type === activeAtmTab)
              .map(obs => (
                <div
                  key={obs.id}
                  className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition"
                  data-testid={`functional-observation-${obs.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800">
                        {obs.title_en}
                      </span>
                      {obs.atm_type && (
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          obs.atm_type === 'antecedent' ? 'bg-indigo-100 text-indigo-800' :
                          obs.atm_type === 'trigger' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {obs.atm_type}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 capitalize">
                      {obs.confidence_status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-teal-800 font-medium mt-1">
                    {obs.title_bn}
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {obs.description_en}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {obs.description_bn}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Source: {obs.evidence_source.replace(/_/g, ' ')}</span>
                    <span>Verified: {obs.clinician_verified ? 'Yes (Clinical)' : 'Self-Reported'}</span>
                  </div>
                </div>
              ))}

            {currentObservations.length === 0 && (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                <p className="font-medium text-slate-700">Optimal Domain Function</p>
                <p className="text-slate-400 mt-0.5">No pathological symptoms or clinical triggers detected in this domain.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
