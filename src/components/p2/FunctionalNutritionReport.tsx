'use client';

import React, { useState, useEffect } from 'react';
import { ClinicalHealthAssessmentReport, P2AnalysisResult } from '../../engine/p2/types';
import { PatientProfile } from '../../types';

interface FunctionalNutritionReportProps {
  report: ClinicalHealthAssessmentReport;
  analysis: P2AnalysisResult;
  patient: PatientProfile;
  lang: 'bn' | 'en';
  onApprove?: (clinicianId: string, notes?: string) => void;
}

export const FunctionalNutritionReport: React.FC<FunctionalNutritionReportProps> = ({
  report,
  analysis,
  patient,
  lang,
  onApprove,
}) => {
  const [reportMode, setReportMode] = useState<'comprehensive' | 'quick'>('comprehensive');
  const [clinicianId, setClinicianId] = useState(report.approvedBy || '');
  const [approvalNotes, setApprovalNotes] = useState(report.clinicianNotes || '');
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [approvalSuccessMessage, setApprovalSuccessMessage] = useState<string | null>(null);
  const [safetyReviewConfirmed, setSafetyReviewConfirmed] = useState(report.isApproved);
  const [isApproved, setIsApproved] = useState(report.isApproved);

  // Synchronize state when report prop changes
  useEffect(() => {
    setIsApproved(Boolean(report.isApproved));
    if (report.approvedBy) setClinicianId(report.approvedBy);
    if (report.clinicianNotes) setApprovalNotes(report.clinicianNotes);
    if (report.isApproved) setSafetyReviewConfirmed(true);
  }, [report.isApproved, report.approvedBy, report.clinicianNotes]);

  const hasActiveHardStops = Boolean(report.sectionK_clinicalSafety?.hardStops && report.sectionK_clinicalSafety.hardStops.length > 0);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleSignOff = () => {
    const trimmed = clinicianId.trim();
    if (!trimmed || trimmed.length < 3) {
      setApprovalError(lang === 'bn' ? 'চিকিৎসক/নিউট্রিশনিস্টের বৈধ নাম বা আইডি প্রদান আবশ্যক (কমপক্ষে ৩ অক্ষর)।' : 'A valid licensed clinician name or practitioner ID is required (min 3 chars).');
      return;
    }
    const isPlaceholder = ['clinician', 'dr. clinical nutritionist', 'doctor', 'nutritionist', 'admin', 'user', 'test', 'guest'].includes(trimmed.toLowerCase());
    if (isPlaceholder) {
      setApprovalError(lang === 'bn' ? 'অনুগ্রহ করে আসল চিকিৎসকের নাম লিখুন (প্লেসহোল্ডার গ্রহণযোগ্য নয়)।' : 'Generic placeholder names are not permitted. Please enter the licensed practitioner name.');
      return;
    }

    if (hasActiveHardStops) {
      setApprovalError(lang === 'bn' ? 'অননুমোদিত: সক্রিয় ক্লিনিক্যাল সেফটি হার্ড স্টপ রয়েছে। অনুমোদন করার আগে সমাধান করুন।' : 'Approval blocked: Unresolved clinical safety hard stops exist. Review and resolve before sign-off.');
      return;
    }

    if (!safetyReviewConfirmed) {
      setApprovalError(lang === 'bn' ? 'অনুমোদনের পূর্বে নিরাপত্তা পর্যালোচনা (অ্যালার্জি, হার্ড স্টপ, ফিডিং রুট) নিশ্চিত করা আবশ্যক।' : 'You must confirm completion of the clinical safety review (allergies, red flags, and contraindications) before final approval.');
      return;
    }

    setApprovalError(null);

    // CLINICAL AUDIT RULE (Approval Persistence):
    // Report successful approval only after a valid clinician review and successful persistence.
    // If saving fails, show failure and do not claim the approval was saved.
    const success = onApprove ? onApprove(trimmed, approvalNotes) : false;
    if (success) {
      setIsApproved(true);
      setApprovalSuccessMessage(lang === 'bn' ? 'অ্যাসেসমেন্ট রিপোর্ট সফলভাবে অনুমোদিত ও সংরক্ষিত হয়েছে।' : 'Clinical assessment report officially approved and persisted for P3 planning.');
    } else {
      setIsApproved(false);
      setApprovalSuccessMessage(null);
      setApprovalError(lang === 'bn'
        ? 'অনুমোদন ব্যর্থ হয়েছে বা লোকাল স্টোরেজে সংরক্ষণ সম্পন্ন করা যায়নি। অনুগ্রহ করে প্রয়োজনীয় নিরাপত্তা যাচাই সম্পন্ন করে পুনরায় চেষ্টা করুন।'
        : 'Approval failed: Could not persist clinical approval to storage or clinical safety criteria were not met. Approval was not saved.');
    }
  };

  const isQuick = reportMode === 'quick';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Action Bar (hidden during print) */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-card border border-border rounded-xl shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReportMode('comprehensive')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              reportMode === 'comprehensive'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {lang === 'bn' ? 'পূর্ণাঙ্গ প্রতিবেদন (Comprehensive)' : 'Comprehensive Report'}
          </button>
          <button
            onClick={() => setReportMode('quick')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              reportMode === 'quick'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {lang === 'bn' ? 'সংক্ষিপ্ত সারাংশ (Quick Summary)' : 'Quick Summary'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
            isApproved
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          }`}>
            {isApproved
              ? (lang === 'bn' ? '✓ ক্লিনিক্যালি অনুমোদিত' : '✓ Clinically Approved')
              : (lang === 'bn' ? '⏳ অনুমোদন অপেক্ষমাণ (Provisional)' : '⏳ Provisional Review')}
          </span>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow transition-colors"
          >
            <span>🖨️</span>
            {lang === 'bn' ? 'প্রতিবেদন প্রিন্ট / PDF সংরক্ষণ' : 'Print Report / Save PDF'}
          </button>
        </div>
      </div>

      {/* ─── Printable A4 Document Sheet ─── */}
      <div className="bg-card text-card-foreground p-8 md:p-12 border border-border rounded-2xl shadow-lg print:border-none print:shadow-none print:p-0 print:m-0 space-y-8 font-sans">
        
        {/* Document Header */}
        <div className="border-b-2 border-primary/20 pb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌱</span>
              <h1 className="text-2xl font-black tracking-tight text-primary">
                SHUDDHO FUNCTIONAL NUTRITION PRACTICE
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Clinical Decision Support System | Root-Cause Functional Medicine & Whole-Food Nutrition
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              Dhaka, Bangladesh | Deterministic & 100% Non-AI Clinical Architecture
            </p>
          </div>
          <div className="text-right text-xs space-y-1">
            <div className="font-mono font-bold text-foreground">
              REPORT ID: <span className="text-primary">{report.reportId}</span>
            </div>
            <div className="text-muted-foreground">
              Date: <span className="font-semibold text-foreground">{patient.visit_date}</span>
            </div>
            <div className="text-muted-foreground">
              Format: <span className="uppercase font-semibold text-foreground">{reportMode}</span>
            </div>
          </div>
        </div>

        {/* ─── SECTION A: Patient Identification & Clinical Demographics ─── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-1">
            <span>👤 Section A: Patient Identification & Clinical Profile</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-xl text-xs">
            <div>
              <span className="text-muted-foreground block">Patient Name:</span>
              <strong className="text-sm font-semibold">{patient.name}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Patient ID:</span>
              <span className="font-mono font-semibold">{patient.id}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Age / Gender:</span>
              <span className="font-semibold">{patient.age} yrs / {patient.gender === 'female' ? 'Female' : 'Male'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Population Group:</span>
              <span className="font-semibold capitalize">{patient.population_group.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Care Phase:</span>
              <span className="font-semibold">Phase {patient.current_phase} (Elimination & Healing)</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Contact / Phone:</span>
              <span className="font-mono">{patient.phone || 'N/A'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground block">Active Clinical Pathways:</span>
              <span className="font-semibold text-primary">
                {patient.selected_conditions.length > 0 ? patient.selected_conditions.join(', ') : 'None registered'}
              </span>
            </div>
          </div>
        </section>

        {/* ─── SECTION B: Anthropometric & Metabolic Risk Markers ─── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-1">
            <span>⚖️ Section B: Anthropometrics & Visceral Adiposity</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-muted/30 rounded-xl">
              <span className="text-muted-foreground block">Height & Weight:</span>
              <strong className="text-sm">{patient.height_cm} cm / {patient.weight_kg} kg</strong>
            </div>
            <div className="p-3 bg-muted/30 rounded-xl">
              <span className="text-muted-foreground block">BMI (Asian Cut-off):</span>
              <strong className="text-sm">{report.sectionB_anthropometrics.bmi} kg/m²</strong>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                {report.sectionB_anthropometrics.bmiCategory_en}
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded-xl">
              <span className="text-muted-foreground block">Waist-to-Height Ratio (WHtR):</span>
              <strong className="text-sm">{report.sectionB_anthropometrics.whtr}</strong>
              <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                {report.sectionB_anthropometrics.whtrRisk_en}
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded-xl">
              <span className="text-muted-foreground block">BMR Safe Floor:</span>
              <strong className="text-sm">{report.sectionB_anthropometrics.bmr_safe_floor} kcal/day</strong>
              <div className="text-[11px] text-muted-foreground mt-0.5">Mifflin-St Jeor Minimum</div>
            </div>
          </div>
        </section>

        {/* ─── SECTION C: Clinical History & Conditions ─── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-1">
            <span>📋 Section C: Clinical History & Presenting Conditions</span>
          </div>
          <div className="p-4 bg-muted/20 rounded-xl text-xs space-y-2">
            <div>
              <span className="font-semibold text-foreground">Presenting Concerns: </span>
              <span className="text-muted-foreground">{report.sectionC_clinicalHistory.chiefComplaint}</span>
            </div>
            {patient.custom_clinical_notes && (
              <div>
                <span className="font-semibold text-foreground">Clinician Notes: </span>
                <span className="text-muted-foreground">{patient.custom_clinical_notes}</span>
              </div>
            )}
          </div>
        </section>

        {/* ─── SECTION D: 7-Domain Functional Nutrition Matrix ─── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-1">
            <span>🕸️ Section D: 7-Domain Functional Medicine Matrix</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {report.sectionD_functionalMatrix.map(finding => {
              const burdenColors: Record<string, string> = {
                significant: 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300',
                moderate: 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300',
                mild: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300',
                none: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300',
                insufficient_data: 'border-gray-400 bg-gray-50/50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400',
              };

              return (
                <div key={finding.domain} className="p-3.5 border rounded-xl bg-card space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-foreground">{finding.domainName_en.split(' ')[0]}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${burdenColors[finding.overallBurden]}`}>
                      {finding.overallBurden.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground line-clamp-2">
                    {finding.supportingEvidence.length > 0
                      ? `Findings: ${finding.supportingEvidence.slice(0, 2).join('; ')}`
                      : 'No significant dysfunction markers noted'}
                  </div>
                  {finding.missingInformation.length > 0 && (
                    <div className="text-[10px] text-amber-600 dark:text-amber-400">
                      Missing: {finding.missingInformation[0]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── SECTION E: Dietary Pattern & PRAL Acid Load ─── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-1">
            <span>🥗 Section E: Dietary Pattern & Potential Renal Acid Load (PRAL)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-muted/30 rounded-xl">
              <span className="text-muted-foreground block">Plant Food Diversity:</span>
              <strong className="text-sm text-foreground">
                {report.sectionE_dietaryPattern.plantFoodGroupDiversityScore} / 12 groups
              </strong>
              <div className="text-[11px] text-primary capitalize mt-0.5">
                Rank: {report.sectionE_dietaryPattern.plantDiversityRank}
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded-xl">
              <span className="text-muted-foreground block">Ultra-Processed Food (UPF):</span>
              <strong className="text-sm capitalize text-foreground">
                {report.sectionE_dietaryPattern.ultraProcessedBurden.replace('_', ' ')}
              </strong>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Sugar: {report.sectionE_dietaryPattern.addedSugarExposure}
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded-xl">
              <span className="text-muted-foreground block">Estimated PRAL Score:</span>
              <strong className="text-sm text-foreground">
                {typeof report.sectionE_dietaryPattern.estimatedPRALScore === 'number'
                  ? `${report.sectionE_dietaryPattern.estimatedPRALScore} mEq/day`
                  : 'Insufficient quantitative data'}
              </strong>
              <div className="text-[11px] text-primary capitalize mt-0.5">
                {report.sectionE_dietaryPattern.pralInterpretation.replace('_', ' ')}
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded-xl">
              <span className="text-muted-foreground block">Sodium Risk Flag:</span>
              <strong className={`text-sm ${report.sectionE_dietaryPattern.sodiumRiskFlag ? 'text-rose-500' : 'text-emerald-500'}`}>
                {report.sectionE_dietaryPattern.sodiumRiskFlag ? 'Elevated Intake' : 'Moderate'}
              </strong>
            </div>
          </div>
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl text-[11px] text-blue-800 dark:text-blue-300">
            {report.sectionE_dietaryPattern.pralCaveat}
          </div>
        </section>

        {/* ─── SECTION F: Ayurvedic Prakriti-Vikriti & Agni ─── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-1">
            <span>🌿 Section F: Ayurvedic Interpretation (Constitutional & Functional Agni)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-muted/30 rounded-xl space-y-1">
              <span className="text-muted-foreground block">Prakriti (Baseline Constitution):</span>
              <strong className="text-sm text-foreground">
                {report.sectionF_ayurvedicAssessment.prakriti.dominant_constitution}
              </strong>
              <div className="text-[11px] text-muted-foreground">
                Vata: {report.sectionF_ayurvedicAssessment.prakriti.vataPercentage || report.sectionF_ayurvedicAssessment.prakriti.vata_score}% |
                Pitta: {report.sectionF_ayurvedicAssessment.prakriti.pittaPercentage || report.sectionF_ayurvedicAssessment.prakriti.pitta_score}% |
                Kapha: {report.sectionF_ayurvedicAssessment.prakriti.kaphaPercentage || report.sectionF_ayurvedicAssessment.prakriti.kapha_score}%
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded-xl space-y-1">
              <span className="text-muted-foreground block">Vikriti (Current Imbalance):</span>
              <strong className="text-sm text-amber-600 dark:text-amber-400">
                {report.sectionF_ayurvedicAssessment.vikriti.primary_aggravation} Imbalance
              </strong>
              <div className="text-[11px] text-muted-foreground">
                Severity: {report.sectionF_ayurvedicAssessment.vikriti.aggravation_severity}
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded-xl space-y-1">
              <span className="text-muted-foreground block">Digestive Fire (Agni Status):</span>
              <strong className="text-sm text-primary uppercase">
                {report.sectionF_ayurvedicAssessment.agni.type}
              </strong>
              <div className="text-[11px] text-muted-foreground line-clamp-2">
                {report.sectionF_ayurvedicAssessment.agni.clinical_manifestation_en}
              </div>
            </div>
          </div>
          <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
            {report.sectionF_ayurvedicAssessment.clinicalSafetyPrimacyNote}
          </div>
        </section>

        {/* ─── SECTION G: Masanumasika Pregnancy Nutrition Analysis (if applicable) ─── */}
        {report.sectionG_pregnancyMasanumasika && report.sectionG_pregnancyMasanumasika.applicable && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-1">
              <span>🤰 Section G: Masanumasika Garbhini Paricharya (Month-by-Month Pregnancy Nutrition)</span>
            </div>
            <div className="p-4 bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <strong className="text-sm text-purple-900 dark:text-purple-200">
                  {report.sectionG_pregnancyMasanumasika.classicalMonthTitle_en}
                </strong>
                <span className="bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                  Trimester {report.sectionG_pregnancyMasanumasika.trimester} (Week {report.sectionG_pregnancyMasanumasika.gestationalWeeks})
                </span>
              </div>

              <div>
                <span className="font-semibold text-foreground">Maternal Nutritional Priorities:</span>
                <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
                  {report.sectionG_pregnancyMasanumasika.maternalNutritionalPriorities?.map((p, i) => (
                    <li key={i}>
                      <strong className="text-foreground">{p.nutrient}:</strong> {p.rationale_en} (Sources: {p.dietarySources.slice(0, 3).join(', ')})
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg text-[11px] text-rose-800 dark:text-rose-300">
                {report.sectionG_pregnancyMasanumasika.safetyBoundaryNotice}
              </div>
            </div>
          </section>
        )}

        {/* ─── SECTION H: Laboratory Findings ─── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-1">
            <span>🔬 Section H: Laboratory & Diagnostic Findings</span>
          </div>
          {report.sectionH_laboratoryFindings.availableResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-border rounded-xl overflow-hidden">
                <thead className="bg-muted text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-2.5">Biomarker</th>
                    <th className="p-2.5">Recorded Value</th>
                    <th className="p-2.5">Standard Range</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {report.sectionH_laboratoryFindings.availableResults.map((r, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="p-2.5 font-medium">{r.marker}</td>
                      <td className="p-2.5 font-mono font-semibold">{r.value} {r.unit}</td>
                      <td className="p-2.5 text-muted-foreground">{r.normalRange}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.flag === 'HIGH' || r.flag === 'PREDIABETIC' || r.flag === 'DEPLETED'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {r.flag || 'NORMAL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300">
              ⚠️ No laboratory results on file. Clinical root-cause hypotheses remain provisional until diagnostic labs are obtained.
            </div>
          )}
        </section>

        {/* ─── SECTION I: Clinical Root-Cause Hypotheses ─── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-1">
            <span>🔍 Section I: Root-Cause Clinical Hypotheses</span>
          </div>
          <div className="space-y-3">
            {report.sectionI_rootCauseHypotheses.slice(0, isQuick ? 3 : 6).map((h, i) => (
              <div key={h.id} className="p-4 border border-border rounded-xl bg-card space-y-2 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-sm text-foreground">
                    #{i + 1}. {h.title_en}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {h.evidenceSupportLevel} Evidence
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      h.clinicianDecision === 'accepted'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {h.clinicianDecision}
                    </span>
                  </div>
                </div>
                <p className="text-muted-foreground">{h.description_en}</p>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                  <span>Systems: <strong className="text-foreground">{h.biologicalSystems.join(', ')}</strong></span>
                  <span>Investigations needed: <strong className="text-foreground">{h.requiredInvestigations.slice(0, 2).join(', ')}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── SECTION J: Medication-Nutrient Review ─── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-1">
            <span>💊 Section J: Medication-Nutrient Review & Depletion Risks</span>
          </div>
          <div className="p-4 bg-muted/20 rounded-xl space-y-2 text-xs">
            <div>
              <span className="font-semibold text-foreground">Active Medications: </span>
              <span className="font-mono text-muted-foreground">
                {report.sectionJ_medicationReview.medications.join(', ') || 'None recorded'}
              </span>
            </div>
            {report.sectionJ_medicationReview.depletionRisks.length > 0 && (
              <div>
                <span className="font-semibold text-amber-600 dark:text-amber-400">Nutrient Depletion Risks:</span>
                <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-0.5">
                  {report.sectionJ_medicationReview.depletionRisks.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.sectionJ_medicationReview.safetyConsiderations.length > 0 && (
              <div>
                <span className="font-semibold text-rose-600 dark:text-rose-400">Administration Timing & Safety:</span>
                <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-0.5">
                  {report.sectionJ_medicationReview.safetyConsiderations.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* ─── SECTION K: Critical Clinical Safety & Red Flags ─── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 border-b border-border pb-1">
            <span>🚨 Section K: Critical Clinical Safety & Red Flag Alerts</span>
          </div>
          <div className="p-4 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2 text-xs">
            <div>
              <span className="font-semibold text-foreground">Confirmed Food Allergies: </span>
              <strong className="text-rose-600 dark:text-rose-400">
                {report.sectionK_clinicalSafety.confirmedAllergies.length > 0
                  ? report.sectionK_clinicalSafety.confirmedAllergies.join(', ').toUpperCase()
                  : 'NONE REPORTED'}
              </strong>
            </div>
            <div>
              <span className="font-semibold text-foreground">Feeding Route: </span>
              <span className="font-semibold">{report.sectionK_clinicalSafety.feedingRoute}</span>
            </div>
            {report.sectionK_clinicalSafety.hypoglycemiaProtocolRequired && (
              <div className="p-2 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold rounded">
                ⚠️ ACTIVE HYPOGLYCEMIC MEDICATION PROTOCOL: Strict carbohydrate meal synchronization required.
              </div>
            )}
            {report.sectionK_clinicalSafety.redFlags.length > 0 && (
              <div className="pt-2">
                <span className="font-semibold text-rose-700 dark:text-rose-300">Active Red Flags:</span>
                <ul className="list-disc list-inside text-rose-600 dark:text-rose-400 mt-1 space-y-1">
                  {report.sectionK_clinicalSafety.redFlags.map(rf => (
                    <li key={rf.id}>
                      <strong>{rf.title_en}:</strong> {rf.recommendedAction_en}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* ─── SECTION L: Personalized Laboratory Recommendations ─── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-1">
            <span>🧪 Section L: Personalized Laboratory Recommendations</span>
          </div>
          <div className="space-y-2">
            {report.sectionL_laboratoryRecommendations
              .filter(r => r.existingTestStatus === 'pending')
              .slice(0, isQuick ? 4 : 8)
              .map(rec => (
                <div key={rec.id} className="p-3 border border-border rounded-xl bg-card flex items-start justify-between flex-wrap gap-2 text-xs">
                  <div className="space-y-0.5">
                    <strong className="text-foreground">{rec.testName_en}</strong>
                    <p className="text-muted-foreground text-[11px]">{rec.clinicalRationale_en}</p>
                    <div className="text-[10px] text-muted-foreground">
                      Specimen: {rec.specimenType} | Fasting: {rec.fastingRequirement_en}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                    rec.priority === 'immediate_clinical_evaluation'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : rec.priority === 'high_priority'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    {rec.priority.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
          </div>
        </section>

        {/* ─── SECTION M: Clinical Priorities ─── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-1">
            <span>🎯 Section M: Ranked Clinical Intervention Priorities</span>
          </div>
          <div className="space-y-2 text-xs">
            {report.sectionM_clinicalPriorities.map(p => (
              <div key={p.id} className="p-3 bg-muted/20 border border-border rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
                    {p.rank}
                  </span>
                  <div>
                    <strong className="text-foreground">{p.title_en}</strong>
                    <div className="text-[11px] text-muted-foreground">{p.rationale_en}</div>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground shrink-0">
                  {p.urgency}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── SECTION N: Clinician Sign-off & Phase P3 Handoff ─── */}
        <section className="space-y-4 border-t-2 border-primary/20 pt-6">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-1">
            <span>✍️ Section N: Clinician Review & Phase P3 Nutrition Planning Handoff</span>
          </div>

          {report.analysisInvalidatedAt && !isApproved && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-400 text-xs">
              ⚠️ <strong>{lang === 'bn' ? 'অনুমোদন বাতিল হয়েছে:' : 'Prior Approval Invalidated:'}</strong>{' '}
              {report.invalidationReason || 'Patient assessment or clinical profile was updated after previous clinician sign-off. Please review the updated analysis and re-sign below.'}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-muted/20 rounded-xl space-y-2">
              <span className="font-semibold text-foreground block">P3 Diet Engine Target Summary:</span>
              <div className="space-y-1 text-muted-foreground">
                <div>Energy Target: <strong className="text-foreground">{analysis.p3PlanningContext.energyTargetCalories} kcal/day</strong></div>
                <div>Protein Target: <strong className="text-foreground">{analysis.p3PlanningContext.proteinTargetGrams} g/day</strong></div>
                <div>Confirmed Allergies: <strong className="text-rose-500">{analysis.p3PlanningContext.confirmedAllergies.join(', ') || 'None'}</strong></div>
                <div>Feeding Permitted: <strong className="text-foreground">{analysis.p3PlanningContext.feedingRoute.oral_intake_permitted ? 'Oral Diet Permitted' : 'Specialist Required'}</strong></div>
              </div>
            </div>

            <div className="p-4 border border-border rounded-xl space-y-3 bg-card">
              <div>
                <label className="block text-muted-foreground text-[11px] mb-1">
                  {lang === 'bn' ? 'চিকিৎসক / ক্লিনিক্যাল নিউট্রিশনিস্টের নাম ও আইডি:' : 'Reviewing Clinician / Nutritionist Name & ID:'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'উদা: ডা. ফারহানা আহমেদ, RD-1048' : 'e.g. Dr. Farhana Ahmed, RD-1048'}
                  value={clinicianId}
                  onChange={e => setClinicianId(e.target.value)}
                  className="w-full text-xs p-2 bg-background border border-border rounded-lg"
                  disabled={isApproved}
                />
              </div>
              <div>
                <label className="block text-muted-foreground text-[11px] mb-1">Clinical Handoff Notes:</label>
                <textarea
                  value={approvalNotes}
                  onChange={e => setApprovalNotes(e.target.value)}
                  placeholder="Enter clinical rationale or notes before signing off for diet chart generation..."
                  rows={2}
                  className="w-full text-xs p-2 bg-background border border-border rounded-lg resize-none"
                  disabled={isApproved}
                />
              </div>

              {/* Mandatory Clinical Safety Review Verification */}
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={safetyReviewConfirmed || isApproved}
                    onChange={e => setSafetyReviewConfirmed(e.target.checked)}
                    disabled={isApproved}
                    className="mt-0.5 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-[11px] leading-relaxed text-foreground">
                    <strong>{lang === 'bn' ? 'ক্লিনিক্যাল নিরাপত্তা পর্যালোচনা সম্পন্ন:' : 'Clinical Safety Review Verified:'}</strong>{' '}
                    {lang === 'bn'
                      ? 'আমি নিশ্চিত করছি যে রোগীর নিশ্চিত অ্যালার্জি, ক্ষতিকর খাদ্য নিষেধাজ্ঞা, রেড ফ্ল্যাগ ও ফিডিং রুট সংক্রান্ত সমস্ত নিরাপত্তা বিষয় পুঙ্খানুপুঙ্খভাবে পর্যালোচনা করা হয়েছে।'
                      : 'I confirm that all Section K clinical safety elements (confirmed allergies, hard contraindications, red flags, and feeding route safety) have been reviewed.'}
                  </span>
                </label>
              </div>

              {hasActiveHardStops && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-600 dark:text-rose-400 text-[11px] font-semibold">
                  ⚠️ {lang === 'bn'
                    ? 'অনুমোদন স্থগিত: সক্রিয় ক্লিনিক্যাল সেফটি হার্ড স্টপ বিদ্যমান। সমাধান ব্যতীত অনুমোদন সম্ভব নয়।'
                    : 'Approval Blocked: Active clinical safety hard stops exist. Must be clinically resolved before sign-off.'}
                </div>
              )}

              {approvalError && (
                <div className="text-[11px] text-rose-500 font-semibold">
                  ⚠️ {approvalError}
                </div>
              )}

              {approvalSuccessMessage && (
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-center font-bold rounded-lg text-xs">
                  ✓ {approvalSuccessMessage}
                </div>
              )}

              {!isApproved ? (
                <button
                  onClick={handleSignOff}
                  disabled={hasActiveHardStops}
                  className={`w-full py-2.5 px-4 font-bold rounded-lg shadow text-xs transition-colors ${
                    hasActiveHardStops
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  ✓ Approve Clinical Assessment & Sign Off for Phase P3 Diet Chart
                </button>
              ) : (
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-center font-bold rounded-lg text-xs">
                  ✓ Officially Approved & Locked for Phase P3 Handoff by {clinicianId || report.approvedBy}
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground text-center pt-4 border-t border-border">
            Shuddho Functional Nutrition Practice Management System | Deterministic Clinical Rule Engine V2.0 | Zero Paid AI / Zero Cloud APIs | Clinical Judgment Primacy
          </div>
        </section>

      </div>
    </div>
  );
};
