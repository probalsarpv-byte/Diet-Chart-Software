'use client';

import React, { useState } from 'react';
import {
  R5MedicationRecord
} from '../../types/r5Systems';
import { SmartMedicationPicker } from './SmartMedicationPicker';
import {
  Pill,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  ShieldCheck,
  FileQuestion,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface RunningMedicationListProps {
  medications: R5MedicationRecord[];
  onUpdateMedications: (meds: R5MedicationRecord[]) => void;
  readOnly?: boolean;
}

export const RunningMedicationList: React.FC<RunningMedicationListProps> = ({
  medications,
  onUpdateMedications,
  readOnly = false
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddMedication = (newMedPartial: Partial<R5MedicationRecord>) => {
    const fullMed: R5MedicationRecord = {
      id: `med_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      generic_name: newMedPartial.generic_name || 'Unknown Generic',
      brand_name: newMedPartial.brand_name,
      manufacturer: newMedPartial.manufacturer,
      formulation: newMedPartial.formulation || 'Tablet',
      product_strength: newMedPartial.product_strength,
      prescribed_dose: newMedPartial.prescribed_dose || '1',
      dose_unit: newMedPartial.dose_unit || 'tablets',
      frequency: newMedPartial.frequency || 'Once Daily',
      route: newMedPartial.route || 'Oral',
      administration_times: newMedPartial.administration_times || ['08:00'],
      is_timing_unknown: Boolean(newMedPartial.is_timing_unknown),
      relationship_to_meals: newMedPartial.relationship_to_meals || 'with_meal',
      status: newMedPartial.status || 'active',
      is_prn: Boolean(newMedPartial.is_prn),
      verification_status: newMedPartial.verification_status || 'clinician_verified',
      rule_coverage: newMedPartial.rule_coverage || 'rules_unavailable',
      source: newMedPartial.source || 'clinician_entry',
      notes: newMedPartial.notes
    };

    onUpdateMedications([...medications, fullMed]);
    setIsAdding(false);
  };

  const handleRemoveMedication = (id: string) => {
    if (readOnly) return;
    onUpdateMedications(medications.filter(m => m.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    if (readOnly) return;
    onUpdateMedications(
      medications.map(m => {
        if (m.id === id) {
          const nextStatus = m.status === 'active' ? 'discontinued' : 'active';
          return { ...m, status: nextStatus };
        }
        return m;
      })
    );
  };

  const handleUpdateTiming = (id: string, time: string, isUnknown: boolean, mealRel?: any) => {
    if (readOnly) return;
    onUpdateMedications(
      medications.map(m => {
        if (m.id === id) {
          return {
            ...m,
            administration_times: isUnknown ? [] : [time],
            is_timing_unknown: isUnknown,
            relationship_to_meals: mealRel || m.relationship_to_meals
          };
        }
        return m;
      })
    );
  };

  const activeMeds = medications.filter(m => m.status === 'active');
  const discontinuedMeds = medications.filter(m => m.status === 'discontinued');

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" data-testid="r5-running-medications-list">
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-800 text-base">
              Running Medications & Reconciliation
            </h3>
            <span className="text-xs text-slate-500 font-normal">
              (চলমান ওষুধের তালিকা ও পুনর্মিলন)
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Structured pharmaceutical profiles linked to drug-nutrient interactions & chronotherapy timing.
          </p>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition"
            data-testid="add-medication-button"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medication (ওষুধ যোগ)</span>
          </button>
        )}
      </div>

      {/* Add Medication Picker Inline */}
      {isAdding && (
        <div className="p-4 bg-teal-50/50 border-b border-teal-200">
          <SmartMedicationPicker
            onSelectMedication={handleAddMedication}
            onCancel={() => setIsAdding(false)}
          />
        </div>
      )}

      {/* Medication Cards List */}
      <div className="p-4 space-y-3">
        {activeMeds.length === 0 && !isAdding && (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-600">No active medications recorded.</p>
            <p className="text-slate-400 mt-0.5">Click "Add Medication" to search Bangladesh pharmaceutical index.</p>
          </div>
        )}

        {activeMeds.map(med => {
          const isUnknown = med.is_timing_unknown || !med.administration_times || med.administration_times.length === 0;
          const displayTime = isUnknown ? 'UNKNOWN' : med.administration_times[0];

          return (
            <div
              key={med.id}
              className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-3"
              data-testid={`medication-card-${med.id}`}
            >
              {/* Left Column: Drug Identity */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-sm text-slate-800">
                    {med.brand_name ? `${med.brand_name}` : med.generic_name}
                  </span>
                  {med.product_strength && (
                    <span className="text-xs font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {med.product_strength}
                    </span>
                  )}
                  {med.formulation && (
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">
                      {med.formulation}
                    </span>
                  )}
                </div>

                {med.brand_name && (
                  <div className="text-xs text-slate-600 mt-0.5 font-medium">
                    Generic: <span className="text-slate-700">{med.generic_name}</span>
                  </div>
                )}

                {med.manufacturer && (
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Mfg: {med.manufacturer}
                  </div>
                )}

                {med.notes && (
                  <div className="text-[11px] text-amber-700 bg-amber-50/70 p-1 rounded mt-1.5 border border-amber-200/60 inline-block">
                    {med.notes}
                  </div>
                )}
              </div>

              {/* Middle Column: Timing & Administration */}
              <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
                {isUnknown ? (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs"
                    data-testid="unknown-timing-badge"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    UNKNOWN — MEDICATION TIMING REQUIRES REVIEW
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{displayTime}</span>
                    <span className="text-[10px] text-slate-500">({med.relationship_to_meals.replace(/_/g, ' ')})</span>
                  </span>
                )}

                {/* Rule Coverage Badge */}
                <div className="flex items-center gap-1.5">
                  {med.rule_coverage === 'fully_covered' && (
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Interaction Rules Active
                    </span>
                  )}
                  {med.rule_coverage === 'rules_unavailable' && (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FileQuestion className="w-3 h-3" />
                      Unindexed / Manual Verification
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Actions */}
              {!readOnly && (
                <div className="flex items-center gap-1.5 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 shrink-0">
                  {/* Timing Toggle or Quick Set */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isUnknown) {
                        handleUpdateTiming(med.id, '08:00', false, 'with_meal');
                      } else {
                        handleUpdateTiming(med.id, '', true);
                      }
                    }}
                    className="p-1.5 text-xs text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition"
                    title={isUnknown ? "Set Standard Timing (08:00)" : "Mark Timing Unknown"}
                  >
                    <Clock className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(med.id)}
                    className="px-2 py-1 text-xs text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded border border-slate-200 transition"
                    title="Discontinue Medication"
                  >
                    Discontinue
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveMedication(med.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Medication"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Discontinued Medications Accordion/Section */}
        {discontinuedMeds.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-200">
            <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Discontinued Medications ({discontinuedMeds.length})
            </h5>
            <div className="space-y-2 opacity-60">
              {discontinuedMeds.map(med => (
                <div
                  key={med.id}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <span className="line-through text-slate-600">
                    {med.brand_name || med.generic_name} ({med.product_strength || ''})
                  </span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(med.id)}
                      className="text-[11px] text-teal-700 hover:underline font-medium"
                    >
                      Re-activate
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
