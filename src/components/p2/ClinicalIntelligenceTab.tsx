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
import { ClinicalIntelligenceReport } from './ClinicalIntelligenceReport';

type SubTab = 'matrix' | 'hypotheses' | 'redflags' | 'timeline' | 'priorities' | 'interventions' | 'missing' | 'report';

const SUB_TABS: Array<{ id: SubTab; label_en: string; label_bn: string }> = [
  { id: 'redflags', label_en: 'Red Flags', label_bn: 'রেড ফ্ল্যাগ' },
  { id: 'matrix', label_en: 'Functional Matrix', label_bn: 'ফাংশনাল ম্যাট্রিক্স' },
  { id: 'hypotheses', label_en: 'Hypotheses', label_bn: 'হাইপোথিসিস' },
  { id: 'priorities', label_en: 'Priority Board', label_bn: 'অগ্রাধিকার' },
  { id: 'timeline', label_en: 'Timeline', label_bn: 'টাইমলাইন' },
  { id: 'interventions', label_en: 'Interventions', label_bn: 'হস্তক্ষেপ' },
  { id: 'missing', label_en: 'Data Gaps', label_bn: 'তথ্য ফাঁক' },
  { id: 'report', label_en: 'Clinical Report', label_bn: 'ক্লিনিক্যাল রিপোর্ট' },
];

export const ClinicalIntelligenceTab: React.FC = () => {
  const { patient, language } = usePractice();
  const { data: assessmentData } = useAssessment();
  const lang = language;
  const [subTab, setSubTab] = useState<SubTab>('redflags');

  // Run P2 analysis memoized on patient and assessment changes
  const analysis = useMemo(() => {
    if (!patient?.id) return null;
    try {
      return runP2Analysis(patient, assessmentData.answers);
    } catch (e) {
      console.error("P2 Analysis error:", e);
      return null;
    }
  }, [patient, assessmentData.answers]);

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
    setHypotheses(prev => prev.map(h =>
      h.id === id ? { ...h, clinicianDecision: decision, clinicianNote: note ?? h.clinicianNote } : h
    ));
  }, []);

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold">
            {lang === 'bn' ? 'ক্লিনিক্যাল ইন্টেলিজেন্স ড্যাশবোর্ড' : 'Clinical Intelligence Dashboard'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {lang === 'bn' ? `${patient.name} — ` : `${patient.name} — `}
            {new Date(analysis.generatedAt).toLocaleString()}
          </p>
        </div>
        {immediateCount > 0 && (
          <div className="bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full animate-pulse">
            🚨 {immediateCount} {lang === 'bn' ? 'জরুরি ফ্ল্যাগ' : 'immediate flag(s)'}
          </div>
        )}
      </div>

      {/* Sub-tab navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-border">
        {SUB_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`shrink-0 text-xs px-3 py-2 rounded-t-lg font-medium border-b-2 transition-all ${
              subTab === tab.id
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {lang === 'bn' ? tab.label_bn : tab.label_en}
            {tab.id === 'redflags' && analysis.redFlags.length > 0 && (
              <span className="ml-1 bg-rose-500 text-white text-[9px] px-1 rounded-full">
                {analysis.redFlags.length}
              </span>
            )}
            {tab.id === 'missing' && analysis.missingHighValueData.length > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-[9px] px-1 rounded-full">
                {analysis.missingHighValueData.length}
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
        {subTab === 'timeline' && (
          <ClinicalTimelineView
            events={timelineEvents}
            lang={lang}
            onAnnotate={handleAnnotate}
          />
        )}
        {subTab === 'priorities' && (
          <PriorityBoard priorities={analysis.priorities} lang={lang} />
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
        {subTab === 'report' && (
          <ClinicalIntelligenceReport result={analysis} patient={patient} lang={lang} />
        )}
      </div>
    </div>
  );
};
