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
  Search
} from 'lucide-react';
import {
  ReconciledMedicationRecord,
  MedicationReconciliationSummary,
  MedicationReconciliationOverallStatus,
  MedicationVerificationStatus
} from '@/types';
import { searchMedications, MedicationSearchResult } from '@/engine/medicationSearch';

interface MedicationReconciliationEditorProps {
  onSave?: (summary: MedicationReconciliationSummary) => void;
}

export const MedicationReconciliationEditor: React.FC<MedicationReconciliationEditorProps> = ({ onSave }) => {
  const { language, patient, updatePatient, allMedicines } = usePractice();
  const bn = language === 'bn';

  const [reconcilerName, setReconcilerName] = useState('Dr. Clinical Nutritionist');
  const [verifiedNoMeds, setVerifiedNoMeds] = useState(
    patient.medication_reconciliation?.verified_no_medications || false
  );

  // Active records
  const records = useMemo(() => {
    return patient.medication_records || [];
  }, [patient.medication_records]);

  // Form for adding new medicine
  const [medName, setMedName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [timing, setTiming] = useState('with_meal');
  const [verificationStatus, setVerificationStatus] = useState<MedicationVerificationStatus>('verified_active');
  const [searchResults, setSearchResults] = useState<MedicationSearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleMedNameChange = (val: string) => {
    setMedName(val);
    if (val.trim().length >= 2) {
      const res = searchMedications(val, 8);
      setSearchResults(res);
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const handleSelectMedication = (item: MedicationSearchResult) => {
    setMedName(item.brandName || item.name);
    setGenericName(item.genericName || item.generic_name || '');
    if (item.strength) {
      setDose(item.strength);
    }
    setShowDropdown(false);
  };

  // Compute overall status and missing elements
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
    records.forEach((r, idx) => {
      if (!r.dose || !r.dose.trim()) missing.push(`${r.medication_name}: Missing dose`);
      if (!r.frequency || !r.frequency.trim()) missing.push(`${r.medication_name}: Missing frequency`);
      if (!r.timing || !r.timing.trim()) missing.push(`${r.medication_name}: Missing meal timing`);
      if (r.verification_status === 'unverified') missing.push(`${r.medication_name}: Unverified status`);
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
        if (!r.dose || !r.dose.trim()) missing.push(`${r.medication_name}: Missing dose`);
        if (!r.frequency || !r.frequency.trim()) missing.push(`${r.medication_name}: Missing frequency`);
        if (!r.timing || !r.timing.trim()) missing.push(`${r.medication_name}: Missing meal timing`);
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
      newRecords.flatMap(r => [r.generic_name, r.medication_name].filter(Boolean) as string[])
    ));

    updatePatient({
      medication_records: noMeds ? [] : newRecords,
      medication_reconciliation: summary,
      medication_reconciliation_status: overallStatus,
      active_medications: noMeds ? [] : activeMeds
    });

    if (onSave) onSave(summary);
  };

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) return;

    const newRecord: ReconciledMedicationRecord = {
      id: `med_${Date.now()}`,
      medication_name: medName.trim(),
      generic_name: genericName.trim() || medName.trim(),
      dose: dose.trim() || 'Unspecified',
      frequency: frequency.trim(),
      timing: timing.trim(),
      verification_status: verificationStatus,
      verified_by: reconcilerName,
      verified_at: new Date().toISOString()
    };

    const updated = [...records, newRecord];
    setMedName('');
    setGenericName('');
    setDose('');
    setVerifiedNoMeds(false);

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
    <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
        <div className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-bold text-sm text-foreground">
              {bn ? 'সম্পূর্ণ ওষুধ রিকনসিলিয়েশন ও খাদ্য মিথস্ক্রিয়া' : 'Complete Medication Reconciliation'}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {bn
                ? 'ডোজ, ফ্রিকোয়েন্সি, সেবনকাল ও যাচাইকরণের বিশদ বিবরণ আবশ্যিক'
                : 'Dose, frequency, meal administration timing, and clinician verification status required'}
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
            {bn ? 'নিশ্চিত' : 'NKDA/No Meds'}
          </span>
        )}
      </div>

      {!verifiedNoMeds && (
        <div className="space-y-4">
          {/* Add Medication Form */}
          <form onSubmit={handleAddMedication} className="p-4 rounded-xl border bg-muted/10 space-y-3">
            <div className="text-xs font-bold text-foreground">
              {bn ? '+ ওষুধ যোগ করুন:' : '+ Add Medication Record:'}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="relative">
                <label className="text-[11px] text-muted-foreground block mb-1">
                  {bn ? 'ওষুধের নাম / ব্র্যান্ড *' : 'Medication / Brand *'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={medName}
                    onChange={e => handleMedNameChange(e.target.value)}
                    placeholder={bn ? 'উদা: Metformin / Tab. Glucophage' : 'Search brand or generic...'}
                    className="w-full px-3 py-1.5 pl-8 rounded-xl border bg-background text-xs"
                  />
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none" />
                </div>

                {/* Live 32,461 MediNutrition search dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-card border rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-border/60">
                    {searchResults.map((item, idx) => (
                      <button
                        key={`${item.name}_${idx}`}
                        type="button"
                        onClick={() => handleSelectMedication(item)}
                        className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors flex items-start justify-between gap-2"
                      >
                        <div>
                          <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                            <span>{item.brandName || item.name}</span>
                            {item.strength && (
                              <span className="text-[10px] text-muted-foreground font-normal">({item.strength})</span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {item.genericName || item.generic_name} {item.manufacturer ? `• ${item.manufacturer}` : ''}
                          </div>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap ${
                            item.rule_coverage_status === 'fully_covered'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : item.rule_coverage_status === 'partially_covered'
                              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {item.rule_coverage_status === 'fully_covered'
                            ? (bn ? 'ক্লিনিক্যাল রুলস সক্রিয়' : 'Rules Active')
                            : item.rule_coverage_status === 'partially_covered'
                            ? (bn ? 'আংশিক রুলস' : 'Partial')
                            : (bn ? 'ক্লিনিক্যাল নোট আবশ্যক' : 'Clinician Note Req.')}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">
                  {bn ? 'জেনেরিক নাম (ঐচ্ছিক)' : 'Generic Name (Optional)'}
                </label>
                <input
                  type="text"
                  value={genericName}
                  onChange={e => setGenericName(e.target.value)}
                  placeholder="Metformin Hydrochloride"
                  className="w-full px-3 py-1.5 rounded-xl border bg-background text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">
                  {bn ? 'ডোজ ও মাত্রা *' : 'Dose (e.g. 500mg) *'}
                </label>
                <input
                  type="text"
                  required
                  value={dose}
                  onChange={e => setDose(e.target.value)}
                  placeholder="500 mg"
                  className="w-full px-3 py-1.5 rounded-xl border bg-background text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">
                  {bn ? 'ফ্রিকোয়েন্সি *' : 'Frequency *'}
                </label>
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border bg-background text-xs"
                >
                  <option value="Once daily">{bn ? 'দিনে ১ বার (Once daily)' : 'Once daily'}</option>
                  <option value="Twice daily">{bn ? 'দিনে ২ বার (Twice daily)' : 'Twice daily'}</option>
                  <option value="Three times daily">{bn ? 'দিনে ৩ বার (TDS)' : 'Three times daily'}</option>
                  <option value="As needed">{bn ? 'প্রয়োজনে (PRN)' : 'As needed'}</option>
                  <option value="Weekly">{bn ? 'সাপ্তাহিক (Weekly)' : 'Weekly'}</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">
                  {bn ? 'খাওয়ার সাথে সম্পর্ক (টাইমিং) *' : 'Relationship to Meals *'}
                </label>
                <select
                  value={timing}
                  onChange={e => setTiming(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border bg-background text-xs"
                >
                  <option value="with_meal">{bn ? 'খাবারের সাথে (With meal)' : 'With meal'}</option>
                  <option value="before_meal_empty_stomach">{bn ? 'খাবারের পূর্বে / খালি পেটে' : 'Before meal / Empty stomach'}</option>
                  <option value="after_meal">{bn ? 'খাবারের পর (After meal)' : 'After meal'}</option>
                  <option value="bedtime">{bn ? 'ঘুমানোর আগে (Bedtime)' : 'Bedtime'}</option>
                  <option value="independent_of_meals">{bn ? 'খাবারের সাথে সম্পর্কহীন' : 'Independent of meals'}</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">
                  {bn ? 'যাচাইকরণের অবস্থা' : 'Verification Status'}
                </label>
                <select
                  value={verificationStatus}
                  onChange={e => setVerificationStatus(e.target.value as MedicationVerificationStatus)}
                  className="w-full px-3 py-1.5 rounded-xl border bg-background text-xs"
                >
                  <option value="verified_active">{bn ? 'যাচাইকৃত সক্রিয় (Verified Active)' : 'Verified Active'}</option>
                  <option value="patient_reported">{bn ? 'রোগী কর্তৃক বর্ণিত (Reported)' : 'Patient Reported'}</option>
                  <option value="unverified">{bn ? 'অযাচাইকৃত (Unverified)' : 'Unverified'}</option>
                  <option value="discontinued">{bn ? 'বন্ধ করা হয়েছে (Discontinued)' : 'Discontinued'}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                <span>{bn ? 'ওষুধ সংরক্ষণ করুন' : 'Add Medication'}</span>
              </button>
            </div>
          </form>

          {/* Active Medication List Table */}
          {records.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="pb-2 font-medium">{bn ? 'ওষুধ' : 'Medication'}</th>
                    <th className="pb-2 font-medium">{bn ? 'ডোজ' : 'Dose'}</th>
                    <th className="pb-2 font-medium">{bn ? 'ফ্রিকোয়েন্সি' : 'Frequency'}</th>
                    <th className="pb-2 font-medium">{bn ? 'টাইমিং' : 'Timing'}</th>
                    <th className="pb-2 font-medium">{bn ? 'অবস্থা' : 'Status'}</th>
                    <th className="pb-2 font-medium text-right">{bn ? 'মুছুন' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {records.map(rec => (
                    <tr key={rec.id} className="hover:bg-muted/10 transition">
                      <td className="py-2.5">
                        <div className="font-bold text-foreground">{rec.medication_name}</div>
                        {rec.generic_name && (
                          <div className="text-[10px] text-muted-foreground">{rec.generic_name}</div>
                        )}
                      </td>
                      <td className="py-2.5 font-semibold text-foreground">{rec.dose}</td>
                      <td className="py-2.5 text-muted-foreground">{rec.frequency}</td>
                      <td className="py-2.5 text-muted-foreground">
                        <span className="capitalize">{rec.timing.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            rec.verification_status === 'verified_active'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : rec.verification_status === 'patient_reported'
                              ? 'bg-blue-500/10 text-blue-600'
                              : 'bg-amber-500/10 text-amber-600'
                          }`}
                        >
                          {rec.verification_status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(rec.id)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Missing Elements Alert (if any) */}
          {computedSummary.missing_elements.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 space-y-1 text-xs">
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
