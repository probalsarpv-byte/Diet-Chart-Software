'use client';

import React, { useMemo, useState } from 'react';
import { usePractice } from '@/context/PracticeContext';
import { useAssessment } from '@/context/AssessmentContext';
import { StructuredLabEntry, LabCategory } from '@/types/assessment';
import {
  LabResultAvailability,
  LabSourceType,
  LabVerificationStatus
} from '@/types/r7Laboratory';
import {
  R7_CANONICAL_MARKERS,
  R7_CANONICAL_TO_LEGACY_LAB_KEY,
  getCanonicalMarkerId,
  isEligibleCanonicalScalarObservation,
  reconcilePatientLaboratories
} from '@/engine/r7/labFoundation';
import { evaluateR7LaboratoryIntelligence } from '@/engine/r7/biomarkerIntelligence';
import {
  FlaskConical,
  AlertTriangle,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  TrendingUp,
  Activity,
  Info,
  CheckCircle2
} from 'lucide-react';

const CATEGORIES: { id: LabCategory | 'all'; label_en: string; label_bn: string }[] = [
  { id: 'all', label_en: 'All Panels', label_bn: 'সকল প্যানেল' },
  { id: 'glycemic', label_en: 'Glycemic / Diabetes', label_bn: 'সুগার ও ডায়াবেটিস' },
  { id: 'lipid', label_en: 'Lipid Profile', label_bn: 'লিপিড প্রোফাইল' },
  { id: 'renal', label_en: 'Renal / Kidney', label_bn: 'কিডনি ও রেনাল' },
  { id: 'hepatic', label_en: 'Hepatic / Liver', label_bn: 'লিভার এনজাইম' },
  { id: 'electrolytes', label_en: 'Electrolytes', label_bn: 'ইলেক্ট্রোলাইটস' },
  { id: 'thyroid', label_en: 'Thyroid', label_bn: 'থাইরয়েড' },
  { id: 'hematology_iron', label_en: 'CBC & Iron', label_bn: 'রক্ত ও আয়রন' },
  { id: 'vitamins_minerals', label_en: 'Vitamins & Minerals', label_bn: 'ভিটামিন ও খনিজ' },
  { id: 'inflammatory_markers', label_en: 'Inflammatory (CRP)', label_bn: 'প্রদাহ সূচক' },
  { id: 'custom', label_en: 'Custom Markers', label_bn: 'কাস্টম মার্কার' }
];

const LEGACY_TO_PATIENT_LAB_KEY: Record<string, string> = {
  fbs: 'fasting_glucose',
  fasting_glucose: 'fasting_glucose',
  ppbs: 'two_hour_post_prandial',
  postprandial_glucose: 'two_hour_post_prandial',
  hba1c: 'hba1c',
  fasting_insulin: 'fasting_insulin',
  total_cholesterol: 'total_cholesterol',
  triglycerides: 'triglycerides',
  hdl: 'hdl',
  ldl: 'ldl',
  serum_creatinine: 'serum_creatinine',
  creatinine: 'serum_creatinine',
  reported_egfr: 'egfr',
  egfr: 'egfr',
  serum_potassium: 'serum_potassium',
  potassium: 'serum_potassium',
  sodium: 'sodium',
  serum_sodium: 'sodium',
  serum_uric_acid: 'uric_acid',
  uric_acid: 'uric_acid',
  sgpt_alt: 'alt',
  alt: 'alt',
  ast: 'ast',
  tsh: 'tsh',
  ft4: 'ft4',
  ft3: 'ft3',
  hemoglobin: 'hemoglobin',
  serum_ferritin: 'ferritin',
  ferritin: 'ferritin',
  vitamin_d3: 'vitamin_d3',
  vitamin_b12: 'vitamin_b12',
  homocysteine: 'homocysteine',
  hs_crp: 'hs_crp'
};

export const StepLaboratoryIntake: React.FC = () => {
  const { patient, currentVisit, language, updateLabs } = usePractice();
  const bn = language === 'bn';
  const { labEntries, setLabEntry, setCurrentStep, visitId } = useAssessment();

  const [selectedCategory, setSelectedCategory] = useState<LabCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customUnit, setCustomUnit] = useState('mg/dL');
  const [customValue, setCustomValue] = useState('');
  const [customLow, setCustomLow] = useState('');
  const [customHigh, setCustomHigh] = useState('');

  // Merge catalog definitions so all 9 panels are always searchable
  const allMarkers = useMemo(() => {
    const merged: Record<string, StructuredLabEntry> = {};
    for (const def of R7_CANONICAL_MARKERS) {
      const legacyKey = def.legacy_marker_ids[0] || def.canonical_id;
      const existing =
        labEntries[legacyKey] ||
        labEntries[def.canonical_id] ||
        Object.values(labEntries).find(e => getCanonicalMarkerId(e.marker_id) === def.canonical_id);
      if (existing) {
        merged[existing.marker_id] = existing;
      } else {
        merged[def.canonical_id] = {
          marker_id: def.canonical_id,
          canonical_marker_id: def.canonical_id,
          category: (def.panel as LabCategory) || 'custom',
          name_en: def.label_en,
          name_bn: def.label_bn,
          unit: def.canonical_unit,
          status: 'not_tested',
          verification_status: 'unverified',
          source_type: 'manual_clinician_entry',
          conventional_low: def.fallback_reference_interval?.adult_all?.low,
          conventional_high: def.fallback_reference_interval?.adult_all?.high,
          functional_low: def.exploratory_functional_range?.low,
          functional_high: def.exploratory_functional_range?.high
        };
      }
    }
    for (const [k, entry] of Object.entries(labEntries)) {
      if (!merged[k]) merged[k] = entry;
    }
    return Object.values(merged);
  }, [labEntries]);

  const filteredMarkers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allMarkers.filter(m => {
      if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        m.name_en.toLowerCase().includes(q) ||
        m.name_bn.toLowerCase().includes(q) ||
        m.marker_id.toLowerCase().includes(q) ||
        (m.canonical_marker_id || '').toLowerCase().includes(q)
      );
    });
  }, [allMarkers, selectedCategory, searchQuery]);

  // Live R7 Intelligence Evaluation across all structured lab entries
  const r7Summary = useMemo(() => {
    return evaluateR7LaboratoryIntelligence({
      patient,
      visitId: visitId || currentVisit?.visit_id || patient?.current_visit_id,
      structuredEntries: labEntries
    });
  }, [patient, visitId, currentVisit, labEntries]);

  const evalByCanonical = useMemo(() => {
    const map: Record<string, (typeof r7Summary.evaluations)[0]> = {};
    for (const ev of r7Summary.evaluations) {
      map[ev.observation.canonical_marker_id] = ev;
    }
    return map;
  }, [r7Summary]);

  const syncMarkerToPatientLabs = (
    entry: StructuredLabEntry,
    nextEntriesMap: Record<string, StructuredLabEntry>
  ) => {
    const cid = getCanonicalMarkerId(entry.canonical_marker_id || entry.marker_id);
    const labKey =
      LEGACY_TO_PATIENT_LAB_KEY[entry.marker_id] ||
      LEGACY_TO_PATIENT_LAB_KEY[cid] ||
      R7_CANONICAL_TO_LEGACY_LAB_KEY[cid];
    const effectiveVisitId = visitId || currentVisit?.visit_id || patient?.current_visit_id;

    if (!labKey) {
      // Unmapped / custom structured lab modifications must still invalidate stale R4 & Diet/P2 state (E4)
      updateLabs({} as any);
      return;
    }

    const recon = reconcilePatientLaboratories({
      patient: { ...patient, labs: undefined },
      visitId: effectiveVisitId,
      structuredEntries: nextEntriesMap
    });
    const obs = recon.latestByCanonical[cid];
    const projectedValue = isEligibleCanonicalScalarObservation(obs, recon.conflicts)
      ? obs.normalized_value
      : undefined;

    // Never fall back to raw unnormalized entry.numeric_value when normalized_value is absent/rejected;
    // also keep legacy alias keys consistent (e.g. clear stale potassium/serum_potassium).
    const patch: Record<string, any> = { [labKey]: projectedValue };
    if (cid === 'potassium') {
      patch.potassium = projectedValue;
    }
    updateLabs(patch as any);
  };

  const upsertLabEntry = (marker: StructuredLabEntry, patch: Partial<StructuredLabEntry>) => {
    const next: StructuredLabEntry = {
      ...marker,
      ...patch,
      patient_id: patient?.id,
      visit_id: visitId || currentVisit?.visit_id || patient?.current_visit_id,
      original_value: patch.numeric_value !== undefined ? patch.numeric_value : (patch.original_value ?? marker.numeric_value),
      original_unit: patch.unit || marker.unit
    };
    setLabEntry(marker.marker_id, next);
    const nextEntriesMap = { ...labEntries, [marker.marker_id]: next };
    syncMarkerToPatientLabs(next, nextEntriesMap);
  };

  const handleAddCustomMarker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const id = `custom_${customName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now().toString(36)}`;
    const numVal = parseFloat(customValue);
    const lowVal = parseFloat(customLow);
    const highVal = parseFloat(customHigh);
    const isValidNum = Number.isFinite(numVal) && numVal >= 0;
    const entry: StructuredLabEntry = {
      marker_id: id,
      canonical_marker_id: id,
      category: 'custom',
      name_en: customName.trim(),
      name_bn: customName.trim(),
      unit: customUnit.trim() || 'unit',
      status: isValidNum ? 'previously_tested' : 'not_tested',
      numeric_value: isValidNum ? numVal : undefined,
      original_value: !isNaN(numVal) ? numVal : undefined,
      original_unit: customUnit.trim() || 'unit',
      lab_ref_low: Number.isFinite(lowVal) ? lowVal : undefined,
      lab_ref_high: Number.isFinite(highVal) ? highVal : undefined,
      test_date: new Date().toISOString().split('T')[0],
      verification_status: 'clinician_verified',
      source_type: 'manual_clinician_entry',
      patient_id: patient?.id,
      visit_id: visitId || currentVisit?.visit_id || patient?.current_visit_id
    };
    setLabEntry(id, entry);
    syncMarkerToPatientLabs(entry, { ...labEntries, [id]: entry });
    setCustomName('');
    setCustomValue('');
    setCustomLow('');
    setCustomHigh('');
    setShowCustomForm(false);
    setSelectedCategory('custom');
  };

  const testedCount = Object.values(labEntries).filter(e => e.status === 'previously_tested').length;
  const pendingCount = Object.values(labEntries).filter(e => e.status === 'pending_result').length;

  return (
    <div className="space-y-6" data-testid="r7-laboratory-workspace">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-foreground">
            {bn ? 'ধাপ ৮: ল্যাবরেটরি বায়োমার্কার ও ইন্টেলিজেন্স ওয়ার্কস্পেস (R7)' : 'Step 8: Clinical Laboratory & Biomarker Intelligence (R7)'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {bn
              ? 'ইউনিট রূপান্তর, ৩-স্তর রেফারেন্স রেঞ্জ, ডিরাইভড ইনডেক্স এবং যাচাই-স্থিতি আলাদা করে প্রদর্শিত হয়। স্বাভাবিক মানকে কখনো ত্রুটি হিসেবে দেখানো হয় না।'
              : 'Supports analyte-specific unit conversion, 3-layer ranges, verification status provenance, derived indices & pattern review without fabricating missing labs.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-secondary text-foreground border border-border">
            {testedCount} {bn ? 'পরীক্ষিত' : 'Tested'}
          </span>
          {pendingCount > 0 && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              {pendingCount} {bn ? 'অপেক্ষমাণ' : 'Pending'}
            </span>
          )}
          <button
            type="button"
            data-testid="r7-add-custom-lab-btn"
            onClick={() => setShowCustomForm(v => !v)}
            className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{bn ? 'কাস্টম মার্কার' : 'Add Custom Marker'}</span>
          </button>
        </div>
      </div>

      {/* Critical Lab Escalation Banner */}
      {r7Summary.critical_findings.length > 0 && (
        <div
          data-testid="r7-critical-lab-banner"
          className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 space-y-2"
        >
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>
              {bn
                ? `গুরুতর ল্যাব সতর্কতা (${r7Summary.critical_findings.length}টি) — প্রেসক্রিপশন প্রকাশ স্থগিত`
                : `CRITICAL LAB ESCALATION (${r7Summary.critical_findings.length}) — Patient Release Blocked Pending Clinical Reconciliation`}
            </span>
          </div>
          <div className="space-y-1.5">
            {r7Summary.critical_findings.map(cf => (
              <div key={cf.finding_id} className="text-[11px] text-rose-900 dark:text-rose-200 bg-background/60 p-2 rounded-lg border border-rose-500/20">
                <strong className="mr-1.5">{bn ? cf.marker_label_bn : cf.marker_label_en}: {cf.value_display}</strong>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 mr-1.5">{cf.verification_status}</span>
                <span>{bn ? cf.action_required_bn : cf.action_required_en}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Lab Marker Form */}
      {showCustomForm && (
        <form onSubmit={handleAddCustomMarker} className="p-4 rounded-xl border border-primary/30 bg-card space-y-3">
          <div className="text-xs font-bold text-foreground">{bn ? 'নতুন কাস্টম বায়োমার্কার যোগ করুন' : 'Add Custom Laboratory Biomarker'}</div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <input
              type="text"
              placeholder={bn ? 'মার্কারের নাম (যেমন ApoB)' : 'Marker Name (e.g. ApoB)'}
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-border bg-secondary/40 text-xs"
              required
            />
            <input
              type="number"
              step="any"
              placeholder={bn ? 'মান' : 'Value'}
              value={customValue}
              onChange={e => setCustomValue(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-border bg-secondary/40 text-xs"
            />
            <input
              type="text"
              placeholder={bn ? 'ইউনিট' : 'Unit (mg/dL)'}
              value={customUnit}
              onChange={e => setCustomUnit(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-border bg-secondary/40 text-xs"
            />
            <input
              type="number"
              step="any"
              placeholder="Ref Low"
              value={customLow}
              onChange={e => setCustomLow(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-border bg-secondary/40 text-xs"
            />
            <input
              type="number"
              step="any"
              placeholder="Ref High"
              value={customHigh}
              onChange={e => setCustomHigh(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-border bg-secondary/40 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowCustomForm(false)} className="px-3 py-1 rounded-lg text-xs bg-secondary">
              {bn ? 'বাতিল' : 'Cancel'}
            </button>
            <button type="submit" className="px-3 py-1 rounded-lg text-xs font-bold bg-primary text-primary-foreground">
              {bn ? 'যোগ করুন' : 'Save Custom Marker'}
            </button>
          </div>
        </form>
      )}

      {/* Search + Panel Filter */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            data-testid="r7-lab-search-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={bn ? 'ল্যাব টেস্ট খুঁজুন (HbA1c, Ferritin, eGFR, Vitamin D, Magnesium...)' : 'Search 40+ canonical biomarkers across 9 panels (HbA1c, Ferritin, TSH, HOMA-IR inputs, CRP...)'}
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-border bg-card text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:bg-secondary/40'
              }`}
            >
              {bn ? cat.label_bn : cat.label_en}
            </button>
          ))}
        </div>
      </div>

      {/* Biomarker List */}
      <div className="space-y-3">
        {filteredMarkers.map(marker => {
          const cid = getCanonicalMarkerId(marker.canonical_marker_id || marker.marker_id);
          const def = R7_CANONICAL_MARKERS.find(d => d.canonical_id === cid);
          const ev = evalByCanonical[cid];
          const supportedUnits = def?.supported_units || [marker.unit].filter(Boolean);
          const isTested = marker.status === 'previously_tested';
          const refStatus = ev?.reference_status;
          const isCritical = Boolean(ev?.is_critical_finding);
          const isAbnormal = refStatus === 'above_reference_interval' || refStatus === 'below_reference_interval';

          return (
            <div
              key={marker.marker_id}
              data-testid={`r7-lab-row-${marker.marker_id}`}
              className={`p-3.5 rounded-xl border bg-card transition-all space-y-2.5 ${
                isCritical
                  ? 'border-rose-500/60 bg-rose-500/5'
                  : isAbnormal
                  ? 'border-amber-500/50'
                  : 'border-border'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-0.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <FlaskConical className={`h-3.5 w-3.5 ${isCritical ? 'text-rose-500' : isTested ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-bold text-foreground">
                      {bn ? marker.name_bn : marker.name_en}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                      {marker.unit}
                    </span>
                    {ev && isTested && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCritical
                            ? 'bg-rose-500 text-white'
                            : isAbnormal
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            : refStatus === 'within_reference_interval'
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                            : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {refStatus?.replace(/_/g, ' ')}
                      </span>
                    )}
                    {marker.verification_status && isTested && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                        {marker.verification_status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Availability & Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Result availability"
                    value={marker.status}
                    onChange={e =>
                      upsertLabEntry(marker, {
                        status: e.target.value as StructuredLabEntry['status'],
                        numeric_value: e.target.value === 'previously_tested' ? marker.numeric_value : undefined
                      })
                    }
                    className="px-2 py-1.5 rounded-lg border border-border bg-secondary/40 text-xs font-medium text-foreground"
                  >
                    <option value="not_tested">{bn ? 'পরীক্ষা করা হয়নি' : 'Not Tested'}</option>
                    <option value="previously_tested">{bn ? 'ফলাফল আছে' : 'Tested / Available'}</option>
                    <option value="pending_result">{bn ? 'রিপোর্ট অপেক্ষমাণ' : 'Pending Result'}</option>
                    <option value="declined_unavailable">{bn ? 'সম্ভব হয়নি / প্রত্যাখ্যান' : 'Declined / Unavailable'}</option>
                    <option value="invalid">{bn ? 'অকার্যকর নমুনা' : 'Invalid / Hemolyzed'}</option>
                  </select>

                  {isTested && (
                    <>
                      <input
                        type="number"
                        step="any"
                        placeholder={bn ? 'মান' : 'Value'}
                        value={marker.numeric_value ?? ''}
                        onChange={e => {
                          const num = parseFloat(e.target.value);
                          upsertLabEntry(marker, { numeric_value: !isNaN(num) ? num : undefined });
                        }}
                        className="w-24 px-2.5 py-1.5 rounded-lg border border-primary/40 bg-background text-xs font-bold font-mono text-foreground"
                      />

                      {supportedUnits.length > 1 ? (
                        <select
                          aria-label="Unit"
                          value={marker.unit}
                          onChange={e => upsertLabEntry(marker, { unit: e.target.value, original_unit: e.target.value })}
                          className="px-2 py-1.5 rounded-lg border border-border bg-secondary/40 text-xs"
                        >
                          {supportedUnits.map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[11px] font-mono text-muted-foreground">{marker.unit}</span>
                      )}

                      <input
                        type="date"
                        value={marker.test_date || ''}
                        onChange={e => upsertLabEntry(marker, { test_date: e.target.value })}
                        className="px-2 py-1.5 rounded-lg border border-border bg-background text-[11px]"
                        title={bn ? 'সংগ্রহের তারিখ' : 'Collection date'}
                      />

                      <select
                        aria-label="Verification status"
                        value={marker.verification_status || 'unverified'}
                        onChange={e =>
                          upsertLabEntry(marker, {
                            verification_status: e.target.value as LabVerificationStatus
                          })
                        }
                        className="px-2 py-1.5 rounded-lg border border-border bg-background text-[11px]"
                      >
                        <option value="unverified">Unverified</option>
                        <option value="patient_reported">Patient Reported</option>
                        <option value="lab_document_reviewed">Lab Report Reviewed</option>
                        <option value="clinician_verified">Clinician Verified</option>
                        <option value="imported_unreconciled">Imported (Unreconciled)</option>
                      </select>

                      <select
                        aria-label="Source type"
                        value={marker.source_type || 'manual_clinician_entry'}
                        onChange={e =>
                          upsertLabEntry(marker, { source_type: e.target.value as LabSourceType })
                        }
                        className="px-2 py-1.5 rounded-lg border border-border bg-background text-[11px]"
                      >
                        <option value="manual_clinician_entry">Clinician Entry</option>
                        <option value="lab_report_upload">Lab Sheet</option>
                        <option value="patient_intake">Patient Intake</option>
                        <option value="imported_external">External Import</option>
                      </select>
                    </>
                  )}
                </div>
              </div>

              {/* Lab Reference Inputs + 3-Layer Interpretation Card */}
              {isTested && (
                <div className="space-y-2 pt-1 border-t border-border/60">
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="text-muted-foreground">{bn ? 'ল্যাব রেফারেন্স সীমা:' : 'Lab Ref Interval (optional override):'}</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ref Low"
                      value={marker.lab_ref_low ?? ''}
                      onChange={e => {
                        const n = parseFloat(e.target.value);
                        upsertLabEntry(marker, { lab_ref_low: !isNaN(n) ? n : undefined });
                      }}
                      className="w-20 px-2 py-1 rounded border border-border bg-background font-mono text-[11px]"
                    />
                    <span>–</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ref High"
                      value={marker.lab_ref_high ?? ''}
                      onChange={e => {
                        const n = parseFloat(e.target.value);
                        upsertLabEntry(marker, { lab_ref_high: !isNaN(n) ? n : undefined });
                      }}
                      className="w-20 px-2 py-1 rounded border border-border bg-background font-mono text-[11px]"
                    />
                    <label className="flex items-center gap-1 ml-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(marker.is_critical_lab_flag)}
                        onChange={e => upsertLabEntry(marker, { is_critical_lab_flag: e.target.checked })}
                      />
                      <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                        {bn ? 'ল্যাব ক্রিটিক্যাল ফ্ল্যাগ' : 'Lab-Flagged Critical'}
                      </span>
                    </label>
                    {ev?.observation.canonical_unit &&
                      marker.unit !== ev.observation.canonical_unit &&
                      ev.observation.normalized_value !== undefined && (
                        <span className="ml-auto font-mono text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary">
                          Canonical: {ev.observation.display_normalized_value} {ev.observation.canonical_unit}
                        </span>
                      )}
                  </div>

                  {ev && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-secondary/40 border border-border">
                        <div className="text-[10px] font-bold uppercase text-muted-foreground">
                          Layer 1 · Standard Reference ({ev.layer1_reference_interval.provenance})
                        </div>
                        <div className="font-mono font-semibold text-foreground mt-0.5">
                          {ev.layer1_reference_interval.display}
                        </div>
                      </div>

                      {ev.layer2_decision_threshold && (
                        <div className="p-2 rounded-lg bg-secondary/40 border border-border">
                          <div className="text-[10px] font-bold uppercase text-muted-foreground">
                            Layer 2 · Clinical Decision Threshold
                          </div>
                          <div className="font-semibold text-foreground mt-0.5">
                            {bn ? ev.layer2_decision_threshold.threshold_label_bn : ev.layer2_decision_threshold.threshold_label_en} ({ev.layer2_decision_threshold.threshold_display})
                          </div>
                        </div>
                      )}

                      {ev.layer3_exploratory_functional && (
                        <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/30">
                          <div className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
                            Layer 3 · Exploratory Context Only
                          </div>
                          <div className="font-mono text-foreground mt-0.5">
                            {ev.layer3_exploratory_functional.display}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {bn ? ev.layer3_exploratory_functional.note_bn : ev.layer3_exploratory_functional.note_en}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Derived Indices Panel */}
      <div data-testid="r7-derived-indices-panel" className="p-4 rounded-xl border border-border bg-card space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Activity className="h-4 w-4 text-primary" />
          <span>{bn ? 'স্বয়ংক্রিয় ডিরাইভড বায়োমার্কার ইনডেক্স (HOMA-IR, FIB-4, UACR, eGFR, TSAT)' : 'Calculated & Derived Biomarker Indices (Provenance-Linked)'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
          {r7Summary.derived_indices.map(d => (
            <div key={d.derived_id} className="p-2.5 rounded-lg border border-border bg-secondary/30 space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-foreground">{bn ? d.name_bn : d.name_en}</strong>
                <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-background border border-border">
                  {d.status === 'calculated' ? `${d.display_value} ${d.unit || ''}`.trim() : d.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {d.status === 'calculated'
                  ? (bn ? d.interpretation_bn : d.interpretation_en)
                  : (bn ? d.ineligibility_reason_bn : d.ineligibility_reason_en)}
              </p>
              <div className="text-[10px] text-muted-foreground/80">
                Inputs: {d.input_summary.length > 0 ? d.input_summary.map(i => `${i.marker_id}=${i.value} ${i.unit || ''}`).join(', ') : 'Awaiting paired tests'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Biomarker Patterns */}
      {r7Summary.patterns.length > 0 && (
        <div data-testid="r7-pattern-findings-panel" className="p-4 rounded-xl border border-border bg-card space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <Info className="h-4 w-4 text-primary" />
            <span>{bn ? 'সমন্বিত বায়োমার্কার প্যাটার্ন ইন্টেলিজেন্স (কোনো কৃত্রিম % আত্মবিশ্বাস নয়)' : 'Evidence-Qualified Biomarker Patterns'}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
            {r7Summary.patterns.map(p => (
              <div key={p.pattern_id} className="p-3 rounded-lg border border-border bg-secondary/20 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-foreground">{bn ? p.title_bn : p.title_en}</strong>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary font-medium">
                    {p.verification_state.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">{bn ? p.clinical_interpretation_bn : p.clinical_interpretation_en}</p>
                {p.missing_relevant_markers.length > 0 && (
                  <p className="text-[10px] text-amber-700 dark:text-amber-300">
                    Next checks: {p.missing_relevant_markers.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Longitudinal Trends */}
      {r7Summary.trends.length > 0 && (
        <div data-testid="r7-trends-panel" className="p-4 rounded-xl border border-border bg-card space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span>{bn ? 'ধারাবাহিক ল্যাব ট্রেন্ড (ইউনিট-সমতুল্য তুলনা)' : 'Longitudinal Biomarker Trends (Normalized Comparability)'}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            {r7Summary.trends.map(t => (
              <div key={t.canonical_marker_id} className="p-2 rounded-lg bg-secondary/30 border border-border flex items-center justify-between">
                <span>{bn ? t.marker_label_bn : t.marker_label_en}</span>
                <span className="font-mono font-semibold">
                  {t.comparable && t.absolute_change !== undefined
                    ? `${t.previous_value} -> ${t.current_value} ${t.canonical_unit || ''} (${t.absolute_change > 0 ? '+' : ''}${t.absolute_change})`
                    : t.incomparability_reason || t.direction}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          type="button"
          onClick={() => setCurrentStep('step_ayurveda')}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-secondary/60 flex items-center gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{bn ? 'আগের ধাপ' : 'Previous: Ayurveda'}</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentStep('step_review')}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 shadow-sm"
        >
          <span>{bn ? 'পরবর্তী: রিভিউ ও সংরক্ষণ' : 'Next: Review & Save Assessment'}</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
