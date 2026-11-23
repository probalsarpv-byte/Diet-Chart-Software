'use client';

import React, { useState, useMemo } from 'react';
import {
  R5PopulationProfile,
  PatientPathwayState,
  R5MedicationRecord,
  R5ClinicalContextPayload,
  ExpandedClinicalPathwayId,
  DrugNutrientFinding
} from '../../types/r5Systems';
import { PathwaySelector } from './PathwaySelector';
import { RunningMedicationList } from './RunningMedicationList';
import { FunctionalMatrixSection } from './FunctionalMatrixSection';
import { SystemsNetworkViewer } from './SystemsNetworkViewer';
import { MultimorbidityConflictSection } from './MultimorbidityConflictSection';
import { evaluateFunctionalMatrix, buildSystemsNetworkGraph } from '../../engine/r5SystemsNetworkEngine';
import { evaluateMedicationNutritionInteractions } from '../../engine/r5MedicationNutritionEngine';
import { analyzeInsulinRegimen } from '../../engine/r5InsulinEngine';
import { resolveMultimorbidityConflicts } from '../../engine/r5MultimorbidityEngine';
import { adaptR5ContextToR4 } from '../../engine/r5ToR4Adapter';
import {
  Activity,
  Layers,
  Pill,
  ShieldAlert,
  AlertTriangle,
  User,
  Heart,
  Network,
  RefreshCw,
  CheckCircle2,
  Syringe,
  Sparkles,
  Baby
} from 'lucide-react';

interface R5SystemsDashboardProps {
  populationProfile: R5PopulationProfile;
  pathwayState: PatientPathwayState;
  medications: R5MedicationRecord[];
  onUpdatePathways: (selectedIds: ExpandedClinicalPathwayId[], isExplicitlyNoPathways: boolean) => void;
  onUpdateMedications: (meds: R5MedicationRecord[]) => void;
  onSyncToR4?: (adapterResult: any) => void;
  readOnly?: boolean;
}

export const R5SystemsDashboard: React.FC<R5SystemsDashboardProps> = ({
  populationProfile,
  pathwayState,
  medications,
  onUpdatePathways,
  onUpdateMedications,
  onSyncToR4,
  readOnly = false
}) => {
  const [syncAlert, setSyncAlert] = useState<string | null>(null);

  // 1. Evaluate Drug-Nutrient Interactions
  const dniFindings = useMemo(() => {
    return evaluateMedicationNutritionInteractions(medications);
  }, [medications]);

  // 2. Evaluate Insulin Regimen
  const insulinResult = useMemo(() => {
    return analyzeInsulinRegimen(medications);
  }, [medications]);

  // 3. Evaluate Functional Matrix & ATM
  const matrixState = useMemo(() => {
    return evaluateFunctionalMatrix({
      pathway_ids: pathwayState.selected_pathways,
      medications
    });
  }, [pathwayState.selected_pathways, medications]);

  // 4. Build Systems Network Graph
  const systemsGraph = useMemo(() => {
    return buildSystemsNetworkGraph(
      matrixState,
      pathwayState.selected_pathways,
      medications
    );
  }, [matrixState, pathwayState.selected_pathways, medications]);

  // 5. Multimorbidity Conflict Resolution
  const multimorbidityConflicts = useMemo(() => {
    return resolveMultimorbidityConflicts({
      pathway_ids: pathwayState.selected_pathways,
      medications
    });
  }, [pathwayState.selected_pathways, medications]);

  // Construct complete R5 Clinical Context Payload
  const currentPayload: R5ClinicalContextPayload = useMemo(() => {
    return {
      population: populationProfile,
      pathways: pathwayState,
      functional_findings: Object.values(matrixState.domains).flat(),
      medications,
      insulin_context: insulinResult.regimen_context,
      dni_findings: dniFindings,
      multimorbidity_resolutions: multimorbidityConflicts,
      systems_graph: systemsGraph,
      stale_r4_sections: [],
      generated_at: new Date().toISOString()
    };
  }, [populationProfile, pathwayState, matrixState, medications, insulinResult, dniFindings, multimorbidityConflicts, systemsGraph]);

  const handleTriggerSync = () => {
    const res = adaptR5ContextToR4(currentPayload);
    if (onSyncToR4) {
      onSyncToR4(res);
    }
    setSyncAlert(`Successfully generated R4 updates for: ${res.stale_notifications.map(s => s.section).join(', ')}.`);
    setTimeout(() => setSyncAlert(null), 5000);
  };

  const isExplicitlyNoPathways = pathwayState.status === 'NO_KNOWN_PATHWAY';

  return (
    <div className="space-y-6" data-testid="r5-systems-dashboard">
      {/* Top Banner / Sync to R4 Protocol Studio */}
      <div className="bg-gradient-to-r from-teal-800 to-slate-900 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-300" />
            <h2 className="text-lg font-bold">
              Systems Network Intelligence & Precision Reconciliation (Phase R5)
            </h2>
          </div>
          <p className="text-xs text-teal-100 mt-1 max-w-2xl leading-relaxed">
            Deterministic cross-system mapping uniting Life-Stage Population Profiles, 16+ Clinical Pathways, Bangladesh Pharmaceutical Index, Drug-Nutrient Safety, and Multimorbidity Resolution.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTriggerSync}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs rounded-lg shadow-sm transition"
            data-testid="sync-to-r4-button"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync with Protocol Studio (R4)</span>
          </button>
        </div>
      </div>

      {syncAlert && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{syncAlert}</span>
        </div>
      )}

      {/* 1. Life Stage & Population Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4" data-testid="r5-population-summary-card">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-800 text-sm">
              Life-Stage First Population Profile
            </h3>
            <span className="text-xs text-slate-500 font-normal">
              (জীবন পর্যায় ও জনসংখ্যা প্রোফাইল)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 uppercase">
              {populationProfile.life_stage.replace(/_/g, ' ')}
            </span>
            {populationProfile.pregnancy?.active && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-900">
                Pregnancy (Trimester {populationProfile.pregnancy.trimester || 1})
              </span>
            )}
            {populationProfile.lactation?.active && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900">
                Lactation ({populationProfile.lactation.stage || '<6m'})
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Biological Age:</span>
            <span className="font-semibold text-slate-800">
              {populationProfile.is_age_unentered ? 'Unentered / Not Specified' : `${populationProfile.age} years`}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Sex:</span>
            <span className="font-semibold text-slate-800 capitalize">
              {populationProfile.sex || 'Unentered'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Clinical Contexts:</span>
            <span className="font-semibold text-slate-800">
              {populationProfile.clinical_contexts.length > 0
                ? populationProfile.clinical_contexts.map(c => c.replace(/_/g, ' ')).join(', ')
                : 'None flagged'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Legacy Alignment:</span>
            <span className="font-medium text-slate-600">
              {populationProfile.historical_population_group || 'adult_standard'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Clinical Pathways Registry */}
      <PathwaySelector
        selectedPathwayIds={pathwayState.selected_pathways}
        isExplicitlyNoPathways={isExplicitlyNoPathways}
        onChange={onUpdatePathways}
        readOnly={readOnly}
      />

      {/* 3. Running Medications & Reconciliation */}
      <RunningMedicationList
        medications={medications}
        onUpdateMedications={onUpdateMedications}
        readOnly={readOnly}
      />

      {/* 4. Insulin-Aware Nutrition Regimen (If Active) */}
      {insulinResult.has_insulin && (
        <div className="bg-white rounded-xl border border-teal-300 shadow-sm overflow-hidden" data-testid="r5-insulin-regimen-card">
          <div className="p-4 bg-teal-50 border-b border-teal-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Syringe className="w-5 h-5 text-teal-700" />
              <h3 className="font-semibold text-teal-950 text-sm">
                Insulin-Aware Nutrition Regimen & Meal Timing Synchrony
              </h3>
              <span className="text-xs text-teal-700">
                (ইনসুলিন সমন্বয় ও হাইপোগ্লাইসেমিয়া প্রোটোকল)
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-200 text-teal-900 uppercase">
              {insulinResult.regimen_context.regimen_type.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="p-4 space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-semibold block text-[11px]">Active Insulins:</span>
                <span className="font-bold text-slate-800">{insulinResult.regimen_context.formulation_name}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-semibold block text-[11px]">Meal Synchronization:</span>
                <span className="font-bold text-slate-800 capitalize">
                  {insulinResult.regimen_context.timing_relative_to_meal?.replace(/_/g, ' ') || '15 min pre-meal'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-semibold block text-[11px]">Prescriber ICR / ISF:</span>
                <span className="font-bold text-slate-800">
                  {insulinResult.regimen_context.prescriber_icr
                    ? `1:${insulinResult.regimen_context.prescriber_icr} g`
                    : 'Prescriber defined only (Not Autonomous)'}
                </span>
              </div>
            </div>

            {/* Fast-Acting Carbs Mandate */}
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-300 flex items-start gap-2.5 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Mandatory Hypoglycemia Rescue (Rule of 15): </span>
                <span>Carry 15-20g rapid-acting glucose (3-4 glucose tabs or 1/2 cup juice). Check BG after 15 min; repeat if BG &lt; 70 mg/dL.</span>
                <div className="text-amber-800 text-[11px] mt-0.5">
                  ১৫ গ্রাম দ্রুত গ্লুকোজ কাছে রাখুন (৩-৪টি ট্যাবলেট বা আধ কাপ জুস)। ১৫ মিনিট পর সুগার মাপুন; ৭০ এর কম থাকলে পুনরায় গ্রহণ করুন।
                </div>
              </div>
            </div>

            <div className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-700">Clinical Directive: </span>
              <span>{insulinResult.regimen_context.required_action_summary_en}</span>
              <div className="text-slate-500 text-[11px] mt-0.5">
                {insulinResult.regimen_context.required_action_summary_bn}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Drug-Nutrient Interactions Alerts */}
      {dniFindings.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" data-testid="r5-dni-findings-card">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="font-semibold text-slate-800 text-sm">
                Evidence-Governed Drug-Nutrient Interactions ({dniFindings.length})
              </h3>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {dniFindings.map((finding: DrugNutrientFinding) => (
              <div
                key={finding.rule_id}
                className={`p-3 rounded-lg border text-xs ${
                  finding.severity === 'critical_hard_stop'
                    ? 'bg-rose-50/70 border-rose-300'
                    : 'bg-amber-50/50 border-amber-200'
                }`}
                data-testid={`dni-alert-${finding.rule_id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <span>{finding.title_en}</span>
                    <span className="text-slate-400 font-normal">({finding.drug_name})</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    finding.severity === 'critical_hard_stop'
                      ? 'bg-rose-200 text-rose-900'
                      : 'bg-amber-200 text-amber-900'
                  }`}>
                    {finding.severity.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="text-teal-800 font-medium text-[11px] mt-0.5">
                  {finding.title_bn}
                </div>

                <div className="text-slate-700 mt-1 leading-relaxed">
                  {finding.rationale_en}
                </div>
                <div className="text-slate-500 mt-0.5 leading-relaxed text-[11px]">
                  {finding.rationale_bn}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200/60 font-semibold text-slate-800">
                  Required Clinical Action: {finding.required_action_en}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Functional Matrix (7-Domain) */}
      <FunctionalMatrixSection matrixState={matrixState} readOnly={readOnly} />

      {/* 7. Systems Network Graph Viewer */}
      <SystemsNetworkViewer systemsGraph={systemsGraph} />

      {/* 8. Multimorbidity Conflict Priority Resolution Layer */}
      <MultimorbidityConflictSection conflicts={multimorbidityConflicts} />
    </div>
  );
};
