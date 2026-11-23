'use client';

import React from 'react';
import {
  MultimorbidityConflictResolution
} from '../../types/r5Systems';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Scale,
  ArrowRight,
  ShieldCheck,
  Info
} from 'lucide-react';

interface MultimorbidityConflictSectionProps {
  conflicts: MultimorbidityConflictResolution[];
}

export const MultimorbidityConflictSection: React.FC<MultimorbidityConflictSectionProps> = ({
  conflicts
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" data-testid="r5-multimorbidity-conflicts-section">
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-800 text-base">
              Multimorbidity Conflict Priority Resolution Layer
            </h3>
            <span className="text-xs text-slate-500 font-normal">
              (বহুমুখী রোগের পুষ্টি দ্বন্দ্ব নিরসন)
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Deterministic hierarchical resolution for competing nutritional and clinical safety directives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {conflicts.length > 0 ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
              <AlertTriangle className="w-3.5 h-3.5" />
              {conflicts.length} Active Conflict Resolution(s)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Zero Contradictory Directives
            </span>
          )}
        </div>
      </div>

      {/* Conflicts List */}
      <div className="p-4 space-y-4">
        {conflicts.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-medium text-slate-700">No Multimorbidity Nutritional Conflicts</p>
            <p className="text-slate-400 mt-0.5">Active clinical pathways and pharmacotherapy directives do not exhibit mutual contradictions.</p>
          </div>
        ) : (
          conflicts.map((conflict, idx) => (
            <div
              key={conflict.conflict_id}
              className="p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs transition space-y-3"
              data-testid={`conflict-card-${conflict.conflict_id}`}
            >
              {/* Conflict Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                    {conflict.parameter.replace(/_/g, ' ')} Conflict
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {conflict.requires_clinician_verification && (
                    <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                      Clinician Verification Required
                    </span>
                  )}
                </div>
              </div>

              {/* Competing Recommendations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {conflict.competing_recommendations.map((rec, rIdx) => (
                  <div
                    key={`${conflict.conflict_id}_rec_${rIdx}`}
                    className="p-3 bg-white rounded-lg border border-slate-200 text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-500 font-semibold mb-1">
                      <span>Condition: {rec.source_condition}</span>
                      <span className="text-[10px] text-slate-400">Weight: {rec.priority_weight}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {rec.recommendation_en}
                    </p>
                    <p className="text-slate-500 mt-1 leading-relaxed">
                      {rec.recommendation_bn}
                    </p>
                  </div>
                ))}
              </div>

              {/* Resolved Recommendation Banner */}
              <div className="p-3.5 rounded-lg bg-teal-50 border border-teal-200 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-teal-900">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Clinical Hierarchical Resolution:</span>
                </div>
                <p className="text-slate-900 font-medium leading-relaxed">
                  {conflict.resolved_priority_recommendation_en}
                </p>
                <p className="text-teal-900 leading-relaxed font-medium">
                  {conflict.resolved_priority_recommendation_bn}
                </p>
              </div>

              {/* Decision Rationale */}
              <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                <span className="font-semibold text-slate-700">Clinical Rationale: </span>
                <span>{conflict.clinical_decision_rationale_en}</span>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  {conflict.clinical_decision_rationale_bn}
                </div>
              </div>

              {/* Hard Safety Boundary */}
              {conflict.hard_safety_boundary_en && (
                <div className="p-2 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Hard Safety Boundary: </span>
                    <span>{conflict.hard_safety_boundary_en}</span>
                    <div className="text-rose-900 text-[11px] mt-0.5 font-medium">
                      {conflict.hard_safety_boundary_bn}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
