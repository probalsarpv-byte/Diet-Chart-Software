'use client';

import React, { useState, useMemo } from 'react';
import { usePractice } from '@/context/PracticeContext';
import {
  Pill,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Clock,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Edit3,
  Save,
  X,
  PauseCircle,
  PlayCircle
} from 'lucide-react';
import {
  ReconciledMedicationRecord,
  MedicationReconciliationSummary
} from '@/types';
import { R5MedicationRecord } from '@/types/r5Systems';
import { SmartMedicationPicker } from '@/components/r5/SmartMedicationPicker';
import {
  normalizeMedicationRecord,
  evaluateMedicationReconciliationStatus
} from '@/engine/r5MedicationSearchEngine';

interface MedicationReconciliationEditorProps {
  onSave?: (summary: MedicationReconciliationSummary) => void;
}

export const MedicationReconciliationEditor: React.FC<MedicationReconciliationEditorProps> = ({ onSave }) => {
  const { language, patient, updatePatient, updateR5Medications, currentClinician } = usePractice();
  const bn = language === 'bn';

  const [verifiedNoMeds, setVerifiedNoMeds] = useState(
    patient.medication_reconciliation?.verified_no_medications || false
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ReconciledMedicationRecord>>({});

  const reconcilerName = currentClinician?.name || 'Dr. Clinical Nutritionist (Demo)';

  // Active records from authoritative patient profile
  const records: ReconciledMedicationRecord[] = useMemo(() => {
    return patient.medication_records || [];
  }, [patient.medication_records]);

  // Compute overall status and missing elements using centralized evaluator
  const computedSummary = useMemo((): MedicationReconciliationSummary => {
    const evalResult = evaluateMedicationReconciliationStatus(records, verifiedNoMeds);
    return {
      status: evalResult.status,
      reconciled_records: verifiedNoMeds ? [] : records,
      verified_no_medications: verifiedNoMeds,
      reconciled_by: reconcilerName,
      reconciled_at: evalResult.status === 'fully_reconciled' ? new Date().toISOString() : undefined,
      missing_elements: evalResult.missing_elements
    };
  }, [verifiedNoMeds, records, reconcilerName]);

  const handleUpdatePatientWithSummary = (
    newRecords: ReconciledMedicationRecord[],
    noMeds: boolean
  ) => {
    const evalResult = evaluateMedicationReconciliationStatus(noMeds ? [] : newRecords, noMeds);

    const summary: MedicationReconciliationSummary = {
      status: evalResult.status,
      reconciled_records: noMeds ? [] : newRecords,
      verified_no_medications: noMeds,
      reconciled_by: reconcilerName,
      reconciled_at: evalResult.status === 'fully_reconciled' ? new Date().toISOString() : undefined,
      missing_elements: evalResult.missing_elements
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
      medication_reconciliation_status: evalResult.status,
      active_medications: noMeds ? [] : activeMeds
    });

    const r5Format = (noMeds ? [] : newRecords).map(normalizeMedicationRecord);
    updateR5Medications(r5Format);

    if (onSave) onSave(summary);
  };

  const handleSelectMedicationFromPicker = (medPartial: Partial<R5MedicationRecord>) => {
    const isClinicianVerified = medPartial.verification_status === 'clinician_verified';
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
      verified_by: isClinicianVerified ? (currentClinician?.name || 'clinician_demo_synth') : undefined,
      verified_at: isClinicianVerified ? new Date().toISOString() : undefined,
      notes: medPartial.notes,
      prescriber_instructions: medPartial.prescriber_instructions
    };

    const updated = [...records, newRecord];
    setVerifiedNoMeds(false);
    handleUpdatePatientWithSummary(updated, false);
  };

  const handleStartEdit = (rec: ReconciledMedicationRecord) => {
    setEditingId(rec.id);
    setEditForm({ ...rec });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = (recordId: string) => {
    const updated = records.map(r => {
      if (r.id !== recordId) return r;
      const isClinicianVerified = editForm.verification_status === 'clinician_verified';
      return {
        ...r,
        ...editForm,
        id: recordId, // Strict ID stability
        dose: editForm.prescribed_dose || editForm.dose || r.dose,
        timing: editForm.relationship_to_meals || editForm.timing || r.timing,
        verified_by: isClinicianVerified ? (currentClinician?.name || 'clinician_demo_synth') : r.verified_by,
        verified_at: isClinicianVerified ? (r.verified_at || new Date().toISOString()) : undefined
      };
    });

    handleUpdatePatientWithSummary(updated, verifiedNoMeds);
    setEditingId(null);
    setEditForm({});
  };

  const handleQuickVerify = (recordId: string) => {
    const updated = records.map(r => {
      if (r.id !== recordId) return r;
      return {
        ...r,
        verification_status: 'clinician_verified' as const,
        verified_by: currentClinician?.name || 'clinician_demo_synth',
        verified_at: new Date().toISOString()
      };
    });
    handleUpdatePatientWithSummary(updated, verifiedNoMeds);
  };

  const handleToggleHoldDiscontinue = (recordId: string, currentStatus?: string) => {
    const newStatus = currentStatus === 'active' ? 'held' : 'active';
    const updated = records.map(r => {
      if (r.id !== recordId) return r;
      return { ...r, status: newStatus as any };
    });
    handleUpdatePatientWithSummary(updated, verifiedNoMeds);
  };

  const handleRemoveMedication = (id: string) => {
    const updated = records.filter(r => r.id !== id);
    if (editingId === id) {
      setEditingId(null);
      setEditForm({});
    }
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
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold flex items-center gap-1 self-start sm:self-auto" data-testid="verified-no-meds-status-badge">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>
              {computedSummary.status === 'no_medications'
                ? (bn ? 'কোনো ওষুধ নেই (যাচাইকৃত)' : 'Verified No Medications')
                : (bn ? 'সম্পূর্ণ সমন্বিত' : 'Fully Reconciled')}
            </span>
          </span>
        ) : (
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 font-bold flex items-center gap-1 self-start sm:self-auto" data-testid="reconciliation-status-badge">
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
                    <th className="py-2.5 px-3 font-semibold text-right">{bn ? 'কার্যক্রম' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {records.map(rec => {
                    const isEditing = editingId === rec.id;
                    const isUnknownTiming = rec.is_timing_unknown || !rec.administration_times || rec.administration_times.length === 0 || rec.timing === 'unknown';
                    const isUnknownDose = !rec.prescribed_dose || rec.prescribed_dose === 'UNKNOWN';
                    const isUnknownFreq = !rec.frequency || rec.frequency === 'UNKNOWN';
                    const isHeld = rec.status === 'held' || rec.status === 'discontinued';

                    return (
                      <React.Fragment key={rec.id}>
                        <tr className={`hover:bg-muted/10 transition ${isHeld ? 'opacity-60 bg-muted/20' : ''}`} data-testid={`reconciled-row-${rec.id}`}>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-foreground">
                                {rec.brand_name || rec.medication_name}
                              </span>
                              {rec.status && rec.status !== 'active' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                                  {rec.status}
                                </span>
                              )}
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
                                UNKNOWN — TIMING REQUIRES REVIEW
                              </span>
                            ) : (
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{rec.administration_times?.join(', ') || rec.timing?.replace(/_/g, ' ')}</span>
                                <span className="text-[10px] text-slate-500">({rec.timing?.replace(/_/g, ' ')})</span>
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${
                                rec.verification_status === 'clinician_verified' || rec.verification_status === 'verified_active'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : rec.verification_status === 'prescription_documented'
                                  ? 'bg-indigo-500/10 text-indigo-600'
                                  : rec.verification_status === 'patient_reported'
                                  ? 'bg-blue-500/10 text-blue-600'
                                  : 'bg-amber-500/10 text-amber-600'
                              }`}
                            >
                              {rec.verification_status?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              {rec.verification_status !== 'clinician_verified' && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickVerify(rec.id)}
                                  className="p-1 rounded text-emerald-600 hover:bg-emerald-500/10 transition"
                                  title="Verify Medication Order"
                                  data-testid={`verify-btn-${rec.id}`}
                                >
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleStartEdit(rec)}
                                className="p-1 rounded text-primary hover:bg-primary/10 transition"
                                title="Edit Medication Details"
                                data-testid={`edit-btn-${rec.id}`}
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleHoldDiscontinue(rec.id, rec.status)}
                                className={`p-1 rounded transition ${isHeld ? 'text-amber-600 hover:bg-amber-500/10' : 'text-slate-500 hover:bg-slate-500/10'}`}
                                title={isHeld ? 'Resume Medication' : 'Hold Medication'}
                              >
                                {isHeld ? <PlayCircle className="h-3.5 w-3.5" /> : <PauseCircle className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveMedication(rec.id)}
                                className="p-1 rounded text-rose-500 hover:bg-rose-500/10 transition"
                                title="Remove Medication"
                                data-testid={`delete-btn-${rec.id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Inline Edit Form for Selected Row */}
                        {isEditing && (
                          <tr className="bg-muted/30 border-b border-primary/30">
                            <td colSpan={7} className="p-4 space-y-3">
                              <div className="font-bold text-xs text-foreground flex items-center justify-between border-b pb-2">
                                <span className="flex items-center gap-1.5 text-primary">
                                  <Edit3 className="w-3.5 h-3.5" />
                                  {bn ? 'ওষুধের বিস্তারিত সম্পাদনা:' : 'Edit Medication Details:'} {rec.medication_name}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono">ID: {rec.id}</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                                <div>
                                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                                    {bn ? 'প্রেসক্রাইবড ডোজ (Actual Dose):' : 'Prescribed Dose:'}
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.prescribed_dose || ''}
                                    onChange={e => setEditForm({ ...editForm, prescribed_dose: e.target.value })}
                                    placeholder="e.g. 500 mg, 14 units"
                                    className="w-full px-2.5 py-1.5 rounded-lg border bg-background text-foreground text-xs"
                                    data-testid="edit-prescribed-dose"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                                    {bn ? 'ডোজ ইউনিট:' : 'Dose Unit:'}
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.dose_unit || ''}
                                    onChange={e => setEditForm({ ...editForm, dose_unit: e.target.value })}
                                    placeholder="mg, units, mL"
                                    className="w-full px-2.5 py-1.5 rounded-lg border bg-background text-foreground text-xs"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                                    {bn ? 'সেবন ফ্রিকোয়েন্সি:' : 'Frequency:'}
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.frequency || ''}
                                    onChange={e => setEditForm({ ...editForm, frequency: e.target.value })}
                                    placeholder="e.g. Twice daily, Once daily"
                                    className="w-full px-2.5 py-1.5 rounded-lg border bg-background text-foreground text-xs"
                                    data-testid="edit-frequency"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                                    {bn ? 'খাবারের সাথে সম্পর্ক:' : 'Relationship to Meals:'}
                                  </label>
                                  <select
                                    value={editForm.relationship_to_meals || 'unknown'}
                                    onChange={e => setEditForm({ ...editForm, relationship_to_meals: e.target.value as any, timing: e.target.value })}
                                    className="w-full px-2.5 py-1.5 rounded-lg border bg-background text-foreground text-xs"
                                  >
                                    <option value="with_meal">With Meal (খাবারের সাথে)</option>
                                    <option value="before_meal_empty_stomach">Before Meal / Empty Stomach (খাবারের আগে)</option>
                                    <option value="after_meal">After Meal (খাবারের পরে)</option>
                                    <option value="bedtime">Bedtime (শোবার সময়)</option>
                                    <option value="independent_of_meals">Independent of Meals (খাবার নিরপেক্ষ)</option>
                                    <option value="unknown">Unknown / Unspecified</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                                    {bn ? 'সেবন সময় (Times, comma-separated):' : 'Administration Times:'}
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.administration_times?.join(', ') || ''}
                                    onChange={e => {
                                      const times = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                                      setEditForm({
                                        ...editForm,
                                        administration_times: times,
                                        is_timing_unknown: times.length === 0
                                      });
                                    }}
                                    placeholder="e.g. 08:00, 20:00"
                                    className="w-full px-2.5 py-1.5 rounded-lg border bg-background text-foreground text-xs"
                                    data-testid="edit-admin-times"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                                    {bn ? 'যাচাই অবস্থা:' : 'Verification Status:'}
                                  </label>
                                  <select
                                    value={editForm.verification_status || 'patient_reported'}
                                    onChange={e => setEditForm({ ...editForm, verification_status: e.target.value as any })}
                                    className="w-full px-2.5 py-1.5 rounded-lg border bg-background text-foreground text-xs"
                                    data-testid="edit-verification-status"
                                  >
                                    <option value="patient_reported">Patient Reported (রোগীর বক্তব্য)</option>
                                    <option value="prescription_documented">Prescription Documented (প্রেসক্রিপশন প্রমাণ)</option>
                                    <option value="clinician_verified">Clinician Verified (চিকিৎসক কর্তৃক যাচাইকৃত)</option>
                                    <option value="unverified">Unverified (অযাচাইকৃত)</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                                    {bn ? 'ওষুধের অবস্থা:' : 'Medication Status:'}
                                  </label>
                                  <select
                                    value={editForm.status || 'active'}
                                    onChange={e => setEditForm({ ...editForm, status: e.target.value as any })}
                                    className="w-full px-2.5 py-1.5 rounded-lg border bg-background text-foreground text-xs"
                                  >
                                    <option value="active">Active (চালু)</option>
                                    <option value="held">Temporarily Held (স্থগিত)</option>
                                    <option value="discontinued">Discontinued (বন্ধ)</option>
                                    <option value="draft_candidate">Draft Candidate</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                                    {bn ? 'রুট (Route):' : 'Route:'}
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.route || 'Oral'}
                                    onChange={e => setEditForm({ ...editForm, route: e.target.value })}
                                    placeholder="Oral, Subcutaneous"
                                    className="w-full px-2.5 py-1.5 rounded-lg border bg-background text-foreground text-xs"
                                  />
                                </div>

                                <div className="lg:col-span-4">
                                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                                    {bn ? 'ক্লিনিক্যাল নোট ও প্রিসক্রাইবার নির্দেশনা:' : 'Clinical Notes / Instructions:'}
                                  </label>
                                  <textarea
                                    value={editForm.notes || ''}
                                    onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                    placeholder="Enter titration history, lab review needs, or dietary cautions..."
                                    rows={2}
                                    className="w-full px-2.5 py-1.5 rounded-lg border bg-background text-foreground text-xs"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="px-3 py-1.5 rounded-lg border bg-background hover:bg-muted text-xs font-medium flex items-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>{bn ? 'বাতিল' : 'Cancel'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(rec.id)}
                                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold flex items-center gap-1 shadow-sm"
                                  data-testid="save-edit-btn"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  <span>{bn ? 'সংরক্ষণ করুন' : 'Save Changes'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Missing Elements Alert (if any) */}
          {computedSummary.missing_elements.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 space-y-1 text-xs" data-testid="reconciliation-missing-elements">
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
            <span>{bn ? 'এখনও যাচাই নিশ্চিত হয়নি' : 'Pending clinician verification'}</span>
          )}
        </div>
      </div>
    </div>
  );
};
