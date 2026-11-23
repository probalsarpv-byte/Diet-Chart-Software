'use client';

import React from 'react';
import {
  SystemsNetworkGraph,
  SystemsNetworkNode,
  SystemsNetworkEdge
} from '../../types/r5Systems';
import {
  Network,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Sparkles,
  Layers,
  Activity
} from 'lucide-react';

interface SystemsNetworkViewerProps {
  systemsGraph: SystemsNetworkGraph;
}

export const SystemsNetworkViewer: React.FC<SystemsNetworkViewerProps> = ({
  systemsGraph
}) => {
  const { nodes, edges, active_conflicts_count, unresolved_hypotheses_count } = systemsGraph;

  const nodeMap = new Map<string, SystemsNetworkNode>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" data-testid="r5-systems-network-viewer">
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-800 text-base">
              Deterministic Systems Network Graph
            </h3>
            <span className="text-xs text-slate-500 font-normal">
              (আন্তঃশারীরবৃত্তীয় নেটওয়ার্ক ও মেকানিজম বিশ্লেষণ)
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Directional mechanistic links across physiological domains and pharmacological exposures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {active_conflicts_count > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
              <ShieldAlert className="w-3.5 h-3.5" />
              {active_conflicts_count} Active Conflict(s)
            </span>
          )}
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {edges.length} Cross-System Edge(s)
          </span>
        </div>
      </div>

      {/* Network Edges / Mechanistic Relationships List */}
      <div className="p-4 space-y-3">
        {edges.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <Network className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-600">No cross-system pathological interactions detected.</p>
            <p className="text-slate-400 mt-0.5">Physiological networks appear homeostatically balanced.</p>
          </div>
        ) : (
          edges.map(edge => {
            const sourceNode = nodeMap.get(edge.source_node_id);
            const targetNode = nodeMap.get(edge.target_node_id);

            return (
              <div
                key={edge.id}
                className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 shadow-xs transition"
                data-testid={`systems-edge-${edge.id}`}
              >
                {/* Node Connection Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-800 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                      {sourceNode?.label_en || edge.source_node_id}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase">
                      {edge.relationship.replace(/_/g, ' ')}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                      {targetNode?.label_en || edge.target_node_id}
                    </span>
                  </div>

                  {/* Priority Badge */}
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    edge.clinical_relevance === 'critical_safety' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                    edge.clinical_relevance === 'high_priority' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {edge.clinical_relevance.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Rationale & Mechanism */}
                <div className="mt-2 text-xs">
                  <div className="text-slate-800 font-medium leading-relaxed">
                    {edge.rationale_en}
                  </div>
                  <div className="text-teal-800 mt-1 leading-relaxed">
                    {edge.rationale_bn}
                  </div>
                </div>

                {/* Citation */}
                {edge.evidence_citation && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">Evidence: {edge.evidence_citation}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
