'use client';

import React, { useState, useMemo } from 'react';
import { usePractice } from '@/context/PracticeContext';
import {
  Pill,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Clock,
  ShieldCheck,
  UserCheck,
  Search,
  AlertTriangle
} from 'lucide-react';
import {
  ReconciledMedicationRecord,
  MedicationReconciliationSummary,
  MedicationReconciliationOverallStatus,
  MedicationVerificationStatus
} from '@/types';
import { R5MedicationRecord } from '@/types/r5Systems';
import { SmartMedicationPicker } from '@/components/r5/SmartMedicationPicker';
import { normalizeMedicationRecord } from '@/engine/r5MedicationSearchEngine';

interface MedicationReconciliationEditorProps {
  onSave?: (summary: MedicationReconciliationSummary) => void;
}

export const MedicationReconciliationEditor: React.FC<MedicationReconciliationEditorProps> = ({ onSave }) => {
  const { language, patient, updatePatient, updateR5Medications } = usePractice();
  const bn = language === 'bn';

  const [reconcilerName, setReconcilerName] = useState('Dr. Clinical Nutritionist');
  const [verifiedNoMeds, setVerifiedNoMeds] = useState(
    patient.medication_reconciliation?.verified_no_medications || false
  );
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Active records from authoritative patient profile
  const records: ReconciledMedicationRecord[] = useMemo(() => {
    return patient.medication_records || [];
  }, [patient.medication_records]);

  // Compute overall status and missing elements without inventing defaults
  const computedSummary = useMemo((): MedicationReconciliationSummary => {
    if (verifiedNoMeds) {
      return {
        status: 'no_medications',
        reconciled_records: [],
        verified_no_medications: true,
        reconciled_by: reconcilerName,
        reconciled_at: new Date().toISOString(),
        missing_elements: []
      };
    }

    if (records.length === 0) {
      return {
        status: 'unreconciled',
        reconciled_records: [],
        verified_no_medications: false,
        missing_elements: ['No medications recorded and "No Medications" not verified']
      };
    }

    const missing: string[] = [];
    records.forEach((r) => {
      const doseVal = r.prescribed_dose || r.dose;
      if (!doseVal || doseVal === 'UNKNOWN' || !doseVal.trim()) {
        missing.push(`${r.medication_name}: Missing prescribed dose`);
      }
      if (!r.frequency || r.frequency === 'UNKNOWN' || !r.frequency.trim()) {
        missing.push(`${r.medication_name}: Missing prescribed frequency`);
      }
      if (!r.timing || r.timing === 'unknown' || !r.timing.trim()) {
        missing.push(`${r.medication_name}: Missing meal administration timing`);
      }
      if (r.verification_status === 'unverified') {
        missing.push(`${r.medication_name}: Unverified status`);
      }
    });

    const status: MedicationReconciliationOverallStatus =
      missing.length === 0 ? 'fully_reconciled' : 'partially_reconciled';

    return {
      status,
      reconciled_records: records,
      verified_no_medications: false,
      reconciled_by: reconcilerName,
      reconciled_at: new Date().toISOString(),
      missing_elements: missing
    };
  }, [verifiedNoMeds, records, reconcilerName]);

  const handleUpdatePatientWithSummary = (
    newRecords: ReconciledMedicationRecord[],
    noMeds: boolean
  ) => {
    const missing: string[] = [];
    if (!noMeds) {
      newRecords.forEach(r => {
        const doseVal = r.prescribed_dose || r.dose;
        if (!doseVal || doseVal === 'UNKNOWN' || !doseVal.trim()) missing.push(`${r.medication_name}: Missing prescribed dose`);
        if (!r.frequency || r.frequency === 'UNKNOWN' || !r.frequency.trim()) missing.push(`${r.medication_name}: Missing frequency`);
        if (!r.timing || r.timing === 'unknown' || !r.timing.trim()) missing.push(`${r.medication_name}: Missing meal timing`);
        if (r.verification_status === 'unverified') missing.push(`${r.medication_name}: Unverified status`);
      });
    }

    let overallStatus: MedicationReconciliationOverallStatus = 'unreconciled';
    if (noMeds) {
      overallStatus = 'no_medications';
    } else if (newRecords.length > 0 && missing.length === 0) {
      overallStatus = 'fully_reconciled';
    } else if (newRecords.length > 0) {
      overallStatus = 'partially_reconciled';
    }

    const summary: MedicationReconciliationSummary = {
      status: overallStatus,
      reconciled_records: noMeds ? [] : newRecords,
      verified_no_medications: noMeds,
      reconciled_by: reconcilerName,
      reconciled_at: new Date().toISOString(),
      missing_elements: missing
    };

    const activeMeds = Array.from(new Set(
      newRecords
        .filter(m => (m.status || 'active') === 'active')
        .flatMap(r => [r.brand_name, r.generic_name, r.medication_name].filter(Boolean) as string[])
    ));

    // Synchronize both patient profile and R5 system state simultaneously
    updatePatient({
      medication_records: noMeds ? [] : newRecords,
      medication_reconciliation: summary,
      medication_reconciliation_status: overallStatus,
      active_medications: noMeds ? [] : activeMeds
    });

    const r5Format = (noMeds ? [] : newRecords).map(normalizeMedicationRecord);
    updateR5Medications(r5Format);

    if (onSave) onSave(summary);
  };

  const handleSelectMedicationFromPicker = (medPartial: Partial<R5MedicationRecord>) => {
    const newRecord: ReconciledMedicationRecord = {
      id: medPartial.id || `med_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      medication_name: medPartial.brand_name || medPartial.generic_name || 'Unknown Medicine',
      generic_name: medPartial.generic_name,
      brand_name: medPartial.brand_name,
      manufacturer: medPartial.manufacturer,
      formulation: medPartial.formulation || 'Tablet',
      product_strength: medPartial.product_strength,
      prescribed_dose: medPartial.prescribed_dose || 'UNKNOWN',
      dose: medPartial.prescribed_dose || 'UNKNOWN',
      dose_unit: medPartial.dose_unit || 'mg',
      frequency: medPartial.frequency || 'UNKNOWN',
      timing: medPartial.relationship_to_meals || 'unknown',
      relationship_to_meals: medPartial.relationship_to_meals || 'unknown',
      route: medPartial.route || 'Oral',
      administration_times: medPartial.administration_times || [],
      is_timing_unknown: medPartial.is_timing_unknown ?? true,
      status: medPartial.status || 'active',
      is_prn: Boolean(medPartial.is_prn),
      verification_status: medPartial.verification_status || 'patient_reported',
      rule_coverage: (medPartial.rule_coverage as any) || 'rules_unavailable',
      source: 'clinician_entry',
      verified_by: reconcilerName,
      verified_at: new Date().toISOString(),
      notes: medPartial.notes,
      prescriber_instructions: medPartial.prescriber_instructions
    };

    const updated = [...records, newRecord];
    setVerifiedNoMeds(false);
    setIsAddingNew(false);
    handleUpdatePatientWithSummary(updated, false);
  };

  const handleRemoveMedication = (id: string) => {
    const updated = records.filter(r => r.id !== id);
    handleUpdatePatientWithSummary(updated, verifiedNoMeds);
  };

  const handleToggleVerifiedNoMeds = (checked: boolean) => {
    setVerifiedNoMeds(checked);
    handleUpdatePatientWithSummary(checked ? [] : records, checked);
  };

  return (
    <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4" data-testid="medication-reconciliation-editor">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
        <div className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-bold text-sm text-foreground">
              {bn ? 'ওষুধ পুনর্মিলন ও প্রেসক্রিপশন প্রোফাইল (ডোমেন ১৩)' : 'Complete Medication Reconciliation (Domain 13)'}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {bn
                ? 'প্রেসক্রিপশন ওষুধ, মাত্রা, সেবনকাল ও খাদ্য মিথস্ক্রিয়া যাচাইকরণ'
                : 'Prescription drugs, actual prescribed dose, meal timing, and drug-nutrient safety verification'}
            </p>
          </div>
        </div>

        {computedSummary.status === 'fully_reconciled' || computedSummary.status === 'no_medications' ? (
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold flex items-center gap-1 self-start sm:self-auto">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>
              {computedSummary.status === 'no_medications'
                ? (bn ? 'কোনো ওষুধ নেই (যাচাইকৃত)' : 'Verified No Medications')
                : (bn ? 'সম্পূর্ণ সমন্বিত' : 'Fully Reconciled')}
            </span>
          </span>
        ) : (
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 font-bold flex items-center gap-1 self-start sm:self-auto">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>
              {computedSummary.status === 'partially_reconciled'
                ? (bn ? 'আংশিক সমন্বিত (তথ্য অনুপস্থিত)' : 'Partially Reconciled')
                : (bn ? 'অসমন্বিত নিরাপত্তা গেট' : 'Unreconciled Gate')}
            </span>
          </span>
        )}
      </div>

      {/* Verified No Medications Checkbox */}
      <div className="p-3 rounded-xl bg-muted/20 border flex items-center justify-between">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-foreground">
          <input
            type="checkbox"
            data-testid="med-verified-no-meds"
            checked={verifiedNoMeds}
            onChange={e => handleToggleVerifiedNoMeds(e.target.checked)}
            className="rounded h-4 w-4 text-primary focus:ring-primary"
          />
          <span>{bn ? 'রোগী বর্তমানে কোনো ওষুধ সেবন করছেন না (যাচাইকৃত)' : 'Patient currently takes no medications (Verified)'}</span>
        </label>
        {verifiedNoMeds && (
          <span className="text-[10px] text-emerald-600 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10">
            {bn ? 'নিশ্চিত — কোনো ওষুধ নেই' : 'Verified No Medications'}
          </span>
        )}
      </div>

      {!verifiedNoMeds && (
        <div className="space-y-4">
          {/* Smart Medication Search & Entry Picker */}
          <div className="rounded-xl border bg-card">
            <SmartMedicationPicker
              onSelectMedication={handleSelectMedicationFromPicker}
            />
          </div>

          {/* Active Medication List Table */}
          {records.length > 0 && (
            <div className="overflow-x-auto border rounded-xl bg-card">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground text-left">
                    <th className="py-2.5 px-3 font-semibold">{bn ? 'ওষুধ / ব্র্যান্ড' : 'Medication / Brand'}</th>
                    <th className="py-2.5 px-3 font-semibold">{bn ? 'উৎপাদিত মাত্রা' : 'Strength'}</th>
                    <th className="py-2.5 px-3 font-semibold">{bn ? 'প্রেসক্রাইবড ডোজ' : 'Prescribed Dose'}</th>
                    <th className="py-2.5 px-3 font-semibold">{bn ? 'ফ্রিকোয়েন্সি' : 'Frequency'}</th>
                    <th className="py-2.5 px-3 font-semibold">{bn ? 'টাইমিং ও সেবনকাল' : 'Timing & Administration'}</th>
                    <th className="py-2.5 px-3 font-semibold">{bn ? 'অবস্থা' : 'Verification'}</th>
                    <th className="py-2.5 px-3 font-semibold text-right">{bn ? 'মুছুন' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {records.map(rec => {
                    const isUnknownTiming = rec.is_timing_unknown || !rec.administration_times || rec.administration_times.length === 0 || rec.timing === 'unknown';
                    const isUnknownDose = !rec.prescribed_dose || rec.prescribed_dose === 'UNKNOWN';
                    const isUnknownFreq = !rec.frequency || rec.frequency === 'UNKNOWN';

                    return (
                      <tr key={rec.id} className="hover:bg-muted/10 transition" data-testid={`reconciled-row-${rec.id}`}>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-foreground">
                            {rec.brand_name || rec.medication_name}
                          </div>
                          {rec.generic_name && (
                            <div className="text-[10px] text-muted-foreground font-medium">{rec.generic_name}</div>
                          )}
                          {rec.notes && (
                            <div className="text-[9px] text-amber-700 bg-amber-50 px-1 py-0.2 rounded mt-0.5 inline-block border border-amber-200">
                              {rec.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {rec.product_strength ? (
                            <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                              {rec.product_strength}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-semibold">
                          {isUnknownDose ? (
                            <span className="text-amber-700 font-bold text-[11px]">UNKNOWN</span>
                          ) : (
                            <span className="text-foreground">{rec.prescribed_dose || rec.dose} {rec.dose_unit || ''}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {isUnknownFreq ? (
                            <span className="text-amber-700 font-bold text-[11px]">UNKNOWN</span>
                          ) : (
                            <span className="text-muted-foreground">{rec.frequency}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {isUnknownTiming ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                              data-testid="unknown-timing-badge"
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-700" />
                              UNKNOWN — MEDICATION TIMING REQUIRES REVIEW
                            </span>
                          ) : (
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{rec.administration_times?.join(', ') || rec.timing.replace(/_/g, ' ')}</span>
                              <span className="text-[10px] text-slate-500">({rec.timing.replace(/_/g, ' ')})</span>
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${
                              rec.verification_status === 'clinician_verified' || rec.verification_status === 'verified_active'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : rec.verification_status === 'patient_reported'
                                ? 'bg-blue-500/10 text-blue-600'
                                : 'bg-amber-500/10 text-amber-600'
                            }`}
                          >
                            {rec.verification_status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveMedication(rec.id)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-500/10 transition"
                            title="Remove Medication"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Missing Elements Alert (if any) */}
          {computedSummary.missing_elements.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 space-y-1 text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                <span>{bn ? 'সমন্বয় অসস্পূর্ণ: নিম্নোক্ত উপাদানসমূহ পূরণ করা আবশ্যক' : 'Incomplete Reconciliation Elements:'}</span>
              </div>
              <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                {computedSummary.missing_elements.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <UserCheck className="h-3.5 w-3.5 text-primary" />
          <span>
            {bn ? 'যাচাইকারী চিকিৎসক:' : 'Reconciling Clinician:'} <strong>{reconcilerName}</strong>
          </span>
        </div>
        <div>
          {computedSummary.reconciled_at ? (
            <span>
              {bn ? 'সর্বশেষ যাচাই:' : 'Last verified:'} {new Date(computedSummary.reconciled_at).toLocaleString()}
            </span>
          ) : (
            <span>{bn ? 'এখনও যাচাই নিশ্চিত হয়নি' : 'Pending verification'}</span>
          )}
        </div>
      </div>
    </div>
  );
};
