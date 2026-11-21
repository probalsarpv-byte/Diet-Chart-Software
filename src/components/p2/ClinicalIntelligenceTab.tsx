'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { usePractice } from '@/context/PracticeContext';
import { useAssessment } from '@/context/AssessmentContext';
import { runP2Analysis } from '../../engine/p2/index';
import { ClinicianDecision } from '../../engine/p2/types';
import { FunctionalMatrixView } from './FunctionalMatrixView';
import { HypothesisExplorer } from './HypothesisExplorer';
import { RedFlagPanel } from './RedFlagPanel';
import { ClinicalTimelineView } from './ClinicalTimelineView';
import { InterventionStrategyView } from './InterventionStrategyView';
import { PriorityBoard } from './PriorityBoard';
import { MissingDataPanel } from './MissingDataPanel';
import { FunctionalNutritionReport } from './FunctionalNutritionReport';

type SubTab =
  | 'redflags'
  | 'matrix'
  | 'hypotheses'
  | 'priorities'
  | 'labs'
  | 'ayurveda'
  | 'metabolic_gut'
  | 'timeline'
  | 'interventions'
  | 'missing'
  | 'report';

const SUB_TABS: Array<{ id: SubTab; label_en: string; label_bn: string }> = [
  { id: 'redflags', label_en: 'Red Flags', label_bn: 'রেড ফ্ল্যাগ' },
  { id: 'matrix', label_en: 'Functional Matrix', label_bn: 'ফাংশনাল ম্যাট্রিক্স' },
  { id: 'hypotheses', label_en: 'Hypotheses', label_bn: 'হাইপোথিসিস' },
  { id: 'priorities', label_en: 'Priority Board', label_bn: 'অগ্রাধিকার' },
  { id: 'labs', label_en: 'Lab Recommendations', label_bn: 'ল্যাব সুপারিশ' },
  { id: 'ayurveda', label_en: 'Ayurveda & Pregnancy', label_bn: 'আয়ুর্বেদ ও গর্ভকালীন' },
  { id: 'metabolic_gut', label_en: 'Metabolic & Gut', label_bn: 'বিপাক ও অন্ত্র' },
  { id: 'timeline', label_en: 'Timeline', label_bn: 'টাইমলাইন' },
  { id: 'interventions', label_en: 'Interventions', label_bn: 'হস্তক্ষেপ' },
  { id: 'missing', label_en: 'Data Gaps', label_bn: 'তথ্য ফাঁক' },
  { id: 'report', label_en: 'A4 Health Report', label_bn: 'পূর্ণাঙ্গ স্বাস্থ্য প্রতিবেদন' },
];

export const ClinicalIntelligenceTab: React.FC = () => {
  const {
    patient,
    language,
    approveP2Analysis,
    p2AnalysisResult,
    updateHypothesisDecision,
  } = usePractice();
  const { exportClinicalAssessment } = useAssessment();
  const lang = language;
  const [subTab, setSubTab] = useState<SubTab>('redflags');

  // Display stored patient-and-visit-specific result; initialize with complete structured assessment if absent
  const analysis = useMemo(() => {
    if (p2AnalysisResult) return p2AnalysisResult;
    if (!patient?.id) return null;
    try {
      const assessment = exportClinicalAssessment();
      return runP2Analysis({ patient, assessment });
    } catch (e) {
      console.error("P2 Analysis error:", e);
      return null;
    }
  }, [p2AnalysisResult, patient, exportClinicalAssessment]);

  // Local state for clinician decisions (hypotheses & interventions)
  const [hypotheses, setHypotheses] = useState(() => analysis?.hypotheses ?? []);
  const [interventionGoals, setInterventionGoals] = useState(() => analysis?.interventionGoals ?? []);
  const [timelineEvents, setTimelineEvents] = useState(() => analysis?.timelineEvents ?? []);

  // Sync when analysis changes
  React.useEffect(() => {
    if (analysis) {
      setHypotheses(analysis.hypotheses);
      setInterventionGoals(analysis.interventionGoals);
      setTimelineEvents(analysis.timelineEvents);
    }
  }, [analysis]);

  const handleDecision = useCallback((id: string, decision: ClinicianDecision, note?: string) => {
    updateHypothesisDecision(id, decision, note);
    setHypotheses(prev => prev.map(h =>
      h.id === id ? { ...h, clinicianDecision: decision, clinicianNote: note ?? h.clinicianNote } : h
    ));
  }, [updateHypothesisDecision]);

  const handleApprove = useCallback((id: string, status: string, note?: string) => {
    setInterventionGoals(prev => prev.map(g =>
      g.id === id
        ? { ...g, clinicianApprovalStatus: status as 'pending' | 'approved' | 'rejected' | 'modified', clinicianNote: note ?? g.clinicianNote }
        : g
    ));
  }, []);

  const handleAnnotate = useCallback((id: string, annotation: string) => {
    setTimelineEvents(prev => prev.map(e =>
      e.id === id ? { ...e, clinicianAnnotation: annotation } : e
    ));
  }, []);

  if (!patient?.id) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <span className="text-4xl">🏥</span>
        <p className="text-lg font-medium">
          {lang === 'bn' ? 'রোগী নির্বাচন করুন' : 'No patient loaded'}
        </p>
        <p className="text-sm">
          {lang === 'bn'
            ? 'ক্লিনিক্যাল ইন্টেলিজেন্স বিশ্লেষণের জন্য প্রথমে মূল্যায়ন সম্পন্ন করুন।'
            : 'Complete an assessment first to run clinical intelligence analysis.'}
        </p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <span className="text-4xl animate-spin">⚙️</span>
        <p className="text-sm">
          {lang === 'bn' ? 'বিশ্লেষণ চলছে...' : 'Running analysis...'}
        </p>
      </div>
    );
  }

  const immediateCount = analysis.redFlags.filter(f => f.urgency === 'immediate').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-subtle flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold mb-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>{lang === 'bn' ? 'P2 রুট-কজ ইন্টেলিজেন্স ইঞ্জিন' : 'P2 Root-Cause Diagnostic Engine'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {lang === 'bn' ? 'ক্লিনিক্যাল ইন্টেলিজেন্স ড্যাশবোর্ড' : 'Clinical Intelligence Dashboard'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-semibold text-foreground">{patient.name}</span> ({patient.id}) •{' '}
            {lang === 'bn' ? 'বিশ্লেষণ তৈরির সময়: ' : 'Generated: '}
            <span className="tabular-numbers">{new Date(analysis.generatedAt).toLocaleString()}</span>
          </p>
        </div>
        {immediateCount > 0 && (
          <div className="bg-destructive/10 text-destructive border border-destructive/30 text-xs font-bold px-3.5 py-1.5 rounded-full animate-pulse shadow-subtle flex items-center gap-1.5">
            <span>🚨</span>
            <span>{immediateCount} {lang === 'bn' ? 'জরুরি ফ্ল্যাগ সক্রিয়' : 'immediate clinical flag(s)'}</span>
          </div>
        )}
      </div>

      {/* Sub-tab navigation */}
      <div className="flex gap-1.5 overflow-x-auto p-1.5 bg-secondary/40 border border-border rounded-xl no-scrollbar backdrop-blur-sm shadow-subtle">
        {SUB_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`shrink-0 text-xs px-3.5 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              subTab === tab.id
                ? 'bg-card text-foreground font-bold shadow-subtle border border-border ring-1 ring-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <span>{lang === 'bn' ? tab.label_bn : tab.label_en}</span>
            {tab.id === 'redflags' && analysis.redFlags.length > 0 && (
              <span className="bg-destructive/15 text-destructive border border-destructive/30 text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-numbers">
                {analysis.redFlags.length}
              </span>
            )}
            {tab.id === 'missing' && analysis.missingHighValueData.length > 0 && (
              <span className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-numbers">
                {analysis.missingHighValueData.length}
              </span>
            )}
            {tab.id === 'report' && (
              <span className="bg-primary/10 text-primary border border-primary/30 text-[10px] px-2 py-0.2 rounded-full font-bold">
                A4
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      <div>
        {subTab === 'matrix' && (
          <FunctionalMatrixView domainFindings={analysis.domainFindings} lang={lang} />
        )}
        {subTab === 'hypotheses' && (
          <HypothesisExplorer
            hypotheses={hypotheses}
            observations={analysis.observations}
            onDecision={handleDecision}
            lang={lang}
          />
        )}
        {subTab === 'redflags' && (
          <RedFlagPanel redFlags={analysis.redFlags} lang={lang} />
        )}
        {subTab === 'priorities' && (
          <PriorityBoard priorities={analysis.priorities} lang={lang} />
        )}

        {/* ─── LABS SUB-TAB ─── */}
        {subTab === 'labs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold">
                {lang === 'bn' ? 'ব্যক্তিগত ল্যাবরেটরি টেস্ট সুপারিশ' : 'Personalized Diagnostic Laboratory Recommendations'}
              </h3>
              <span className="text-xs text-muted-foreground">
                Total Recommended: {analysis.labRecommendations.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.labRecommendations.map(lab => (
                <div
                  key={lab.id}
                  className={`p-4 border rounded-xl bg-card space-y-2 text-xs transition-shadow hover:shadow-sm ${
                    lab.priority === 'immediate_clinical_evaluation'
                      ? 'border-rose-300 dark:border-rose-900 bg-rose-50/20'
                      : lab.priority === 'high_priority'
                      ? 'border-amber-300 dark:border-amber-900 bg-amber-50/20'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <strong className="text-sm font-semibold text-foreground">
                        {lang === 'bn' ? lab.testName_bn : lab.testName_en}
                      </strong>
                      <span className="block text-[10px] text-muted-foreground capitalize">
                        Panel: {lab.category.replace('_', ' ')}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                      lab.priority === 'immediate_clinical_evaluation'
                        ? 'bg-rose-500 text-white'
                        : lab.priority === 'high_priority'
                        ? 'bg-amber-500 text-white'
                        : 'bg-primary/20 text-primary'
                    }`}>
                      {lab.priority.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-muted-foreground">
                    {lang === 'bn' ? lab.clinicalRationale_bn : lab.clinicalRationale_en}
                  </p>

                  <div className="p-2.5 bg-muted/40 rounded-lg text-[11px] space-y-1">
                    <div>
                      <span className="font-semibold text-foreground">Specimen: </span>
                      <span className="text-muted-foreground">{lab.specimenType}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Fasting: </span>
                      <span className="text-muted-foreground">
                        {lang === 'bn' ? lab.fastingRequirement_bn : lab.fastingRequirement_en}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className={`font-semibold ${lab.existingTestStatus === 'tested' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      Status: {lab.existingTestStatus === 'tested' ? '✓ Already Recorded' : '⏳ Pending Investigation'}
                    </span>
                    {lab.lastKnownValue !== undefined && (
                      <span className="font-mono text-muted-foreground">
                        Last Value: {lab.lastKnownValue}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── AYURVEDA SUB-TAB ─── */}
        {subTab === 'ayurveda' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold">
              {lang === 'bn' ? 'আয়ুর্বেদিক ও গর্ভকালীন পুষ্টি মূল্যায়ন' : 'Ayurvedic & Masanumasika Pregnancy Nutrition Analysis'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 border border-border rounded-xl bg-card space-y-2 text-xs">
                <span className="font-bold text-sm text-foreground block">
                  Prakriti: {analysis.ayurvedicInterpretation.prakriti.dominant_constitution}
                </span>
                <div className="space-y-1.5 pt-1">
                  <div>
                    <div className="flex justify-between text-[11px]">
                      <span>Vata</span>
                      <span>{analysis.ayurvedicInterpretation.prakriti.vataPercentage || analysis.ayurvedicInterpretation.prakriti.vata_score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${analysis.ayurvedicInterpretation.prakriti.vataPercentage || 33}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px]">
                      <span>Pitta</span>
                      <span>{analysis.ayurvedicInterpretation.prakriti.pittaPercentage || analysis.ayurvedicInterpretation.prakriti.pitta_score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${analysis.ayurvedicInterpretation.prakriti.pittaPercentage || 33}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px]">
                      <span>Kapha</span>
                      <span>{analysis.ayurvedicInterpretation.prakriti.kaphaPercentage || analysis.ayurvedicInterpretation.prakriti.kapha_score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${analysis.ayurvedicInterpretation.prakriti.kaphaPercentage || 33}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-border rounded-xl bg-card space-y-2 text-xs">
                <span className="font-bold text-sm text-amber-600 dark:text-amber-400 block">
                  Vikriti: {analysis.ayurvedicInterpretation.vikriti.primary_aggravation} Imbalance
                </span>
                <p className="text-muted-foreground text-[11px]">
                  Aggravation Severity: <strong className="capitalize text-foreground">{analysis.ayurvedicInterpretation.vikriti.aggravation_severity}</strong>
                </p>
                <div className="text-[11px] text-muted-foreground">
                  Triggering Symptoms: {analysis.ayurvedicInterpretation.vikriti.triggeringSymptomIds?.length || 0} markers documented.
                </div>
              </div>

              <div className="p-4 border border-border rounded-xl bg-card space-y-2 text-xs">
                <span className="font-bold text-sm text-primary block uppercase">
                  Agni Status: {analysis.ayurvedicInterpretation.agni.type}
                </span>
                <p className="text-muted-foreground text-[11px]">
                  {analysis.ayurvedicInterpretation.agni.clinical_manifestation_en}
                </p>
              </div>
            </div>

            {/* Pathya / Apathya Guidelines */}
            <div className="p-4 border border-border rounded-xl bg-card space-y-3 text-xs">
              <span className="font-bold text-sm text-foreground block">
                {lang === 'bn' ? 'পথ্য ও অপথ্য খাদ্য নির্দেশিকা (Pathya / Apathya Guidance)' : 'Pathya / Apathya Whole-Food Guidelines'}
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg">
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300 block mb-1">
                    ✓ Favorable Whole Foods (Pathya):
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-[11px]">
                    {analysis.ayurvedicInterpretation.pathya_apathya_handoff.pathya_foods_bn.slice(0, 5).map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-lg">
                  <span className="font-semibold text-rose-800 dark:text-rose-300 block mb-1">
                    ✗ Unfavorable Items (Apathya):
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-[11px]">
                    {analysis.ayurvedicInterpretation.pathya_apathya_handoff.apathya_foods_bn.slice(0, 5).map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="text-[11px] text-amber-700 dark:text-amber-300 p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                {analysis.ayurvedicInterpretation.clinicalSafetyPrimacyNote}
              </div>
            </div>

            {/* Masanumasika Section if Applicable */}
            {analysis.masanumasikaAnalysis.applicable && (
              <div className="p-4 border border-purple-300 dark:border-purple-900 bg-purple-50/30 dark:bg-purple-950/20 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-sm text-purple-900 dark:text-purple-200">
                    {analysis.masanumasikaAnalysis.classicalMonthTitle_en}
                  </strong>
                  <span className="px-2.5 py-0.5 bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 font-bold rounded-full text-[11px]">
                    Month {analysis.masanumasikaAnalysis.pregnancyMonth} (Trimester {analysis.masanumasikaAnalysis.trimester})
                  </span>
                </div>
                <div className="space-y-1 text-muted-foreground">
                  {analysis.masanumasikaAnalysis.maternalNutritionalPriorities?.map((p, i) => (
                    <div key={i}>
                      <strong className="text-foreground">{p.nutrient}:</strong> {p.rationale_en}
                    </div>
                  ))}
                </div>
                <div className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 rounded font-semibold text-[11px]">
                  {analysis.masanumasikaAnalysis.safetyBoundaryNotice}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── METABOLIC & GUT SUB-TAB ─── */}
        {subTab === 'metabolic_gut' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold">
              {lang === 'bn' ? 'বিপাকীয় ও অন্ত্রের স্বাস্থ্য বিশ্লেষণ' : 'Metabolic Dynamics & Gastrointestinal Health Analysis'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Metabolic Card */}
              <div className="p-4 border border-border rounded-xl bg-card space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-sm text-foreground">Metabolic & Glycemic Profile</strong>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    analysis.metabolicHealthAnalysis.glycemicStabilityPattern === 'dysglycemia_pattern'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {analysis.metabolicHealthAnalysis.glycemicStabilityPattern.replace('_', ' ')}
                  </span>
                </div>

                {analysis.metabolicHealthAnalysis.medicationMealSafetyPriority && (
                  <div className="p-2.5 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 rounded-lg font-bold">
                    🚨 HYPOGLYCEMIC MEDICATION ACTIVE: Regular meal timing required to prevent severe hypoglycemia.
                  </div>
                )}

                <div className="space-y-1.5 text-muted-foreground">
                  <div>Central Adiposity Risk: <strong className="text-foreground">{analysis.metabolicHealthAnalysis.centralAdiposityRisk ? 'Elevated' : 'Normal'}</strong></div>
                  {analysis.metabolicHealthAnalysis.homaIrAnalysis && (
                    <div>HOMA-IR Score: <strong className="text-foreground">{analysis.metabolicHealthAnalysis.homaIrAnalysis.value}</strong> ({analysis.metabolicHealthAnalysis.homaIrAnalysis.status})</div>
                  )}
                </div>

                <div>
                  <span className="font-semibold text-foreground block mb-1">Metabolic Priorities:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-[11px]">
                    {analysis.metabolicHealthAnalysis.metabolicPriorities.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Gut Health Card */}
              <div className="p-4 border border-border rounded-xl bg-card space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-sm text-foreground">Gastrointestinal & Microbiome Profile</strong>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/20 text-primary">
                    {analysis.gutHealthAnalysis.transitTimeEstimate.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-1.5 text-muted-foreground">
                  <div>Bristol Stool Form: <strong className="text-foreground">{analysis.gutHealthAnalysis.bristolPattern}</strong></div>
                  <div>Dysbiosis Symptom Burden: <strong className="capitalize text-foreground">{analysis.gutHealthAnalysis.dysbiosisSymptomBurden}</strong></div>
                  <div>Upper GI Status: <strong className="text-foreground">{analysis.gutHealthAnalysis.upperGiStatus}</strong></div>
                </div>

                {analysis.gutHealthAnalysis.functionalMechanisms.length > 0 && (
                  <div>
                    <span className="font-semibold text-foreground block mb-1">Functional Mechanisms:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-[11px]">
                      {analysis.gutHealthAnalysis.functionalMechanisms.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-[10px] text-muted-foreground p-2 bg-muted/30 rounded">
                  {analysis.gutHealthAnalysis.microbiomeTestingCaveat}
                </div>
              </div>
            </div>
          </div>
        )}

        {subTab === 'timeline' && (
          <ClinicalTimelineView
            events={timelineEvents}
            lang={lang}
            onAnnotate={handleAnnotate}
          />
        )}
        {subTab === 'interventions' && (
          <InterventionStrategyView
            goals={interventionGoals}
            onApprove={handleApprove}
            lang={lang}
          />
        )}
        {subTab === 'missing' && (
          <MissingDataPanel missingItems={analysis.missingHighValueData} lang={lang} />
        )}

        {/* ─── FULL REPORT SUB-TAB ─── */}
        {subTab === 'report' && (
          <FunctionalNutritionReport
            report={analysis.report}
            analysis={analysis}
            patient={patient}
            lang={lang}
            onApprove={(cId, notes) => approveP2Analysis(cId, notes)}
          />
        )}
      </div>
    </div>
  );
};
