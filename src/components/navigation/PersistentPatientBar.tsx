'use client';

import React, { useState } from 'react';
import { usePractice } from '@/context/PracticeContext';
import { 
  User, 
  Calendar, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  ArrowRightLeft, 
  PlusCircle, 
  Clock,
  Check,
  FileCheck2,
  Lock
} from 'lucide-react';
import { ClinicalVisitType } from '@/types';

export const PersistentPatientBar: React.FC = () => {
  const { 
    patient, 
    currentVisit, 
    clinicalVisits, 
    activeTab, 
    setActiveTab, 
    language, 
    clinicalSafetyEvaluation,
    p2AnalysisResult,
    currentProgressReport,
    startNewVisit,
    savedPatients,
    loadPatient
  } = usePractice();

  const bn = language === 'bn';
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showNewVisitModal, setShowNewVisitModal] = useState(false);
  const [newVisitType, setNewVisitType] = useState<ClinicalVisitType>('followup');

  // Only display on clinical tabs (assessment, clinical_intelligence, diet, followup, report, intake, conditions, dni)
  const isClinicalTab = [
    'assessment', 
    'clinical_intelligence', 
    'diet', 
    'followup', 
    'report',
    'intake',
    'conditions',
    'dni'
  ].includes(activeTab);

  if (!isClinicalTab) return null;

  // Baseline visit determination
  const isBaseline = ['initial', 'initial_consultation', 'baseline_consultation'].includes(currentVisit?.visit_type || '');
  const baselineVisit = clinicalVisits.find(v => ['initial', 'initial_consultation', 'baseline_consultation'].includes(v.visit_type || '')) || clinicalVisits[0];
  const isFollowUp = currentVisit && !isBaseline;

  // Allergy safety state
  const allergyStatus = patient.allergy_reconciliation_status || 'not_assessed';
  const hasActiveAllergies = (patient.confirmed_allergies || []).length > 0;
  const isAllergyReconciled = allergyStatus === 'allergies_confirmed' || allergyStatus === 'none_confirmed';

  // Meds reconciliation state
  const medStatus = patient.medication_reconciliation_status || 'not_assessed';
  const isMedReconciled = medStatus === 'fully_reconciled' || medStatus === 'no_medications';

  // Hard stop checks
  const hasHardStops = clinicalSafetyEvaluation?.overallDecision === 'HARD_STOP';

  // Report approval status
  const isReportApproved = Boolean(
    p2AnalysisResult?.report?.isApproved || 
    currentProgressReport?.sectionL_nutritionistReview?.status === 'fully_approved'
  );

  const handleConfirmNewVisit = () => {
    startNewVisit(patient.id, newVisitType);
    setShowNewVisitModal(false);
    setActiveTab('assessment');
  };

  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-800 shadow-md px-4 lg:px-8 py-2.5 text-xs no-print transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Patient Identity & Demographics */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
            <User className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white tracking-tight">{patient.name || (bn ? 'অজ্ঞাত রোগী' : 'Unnamed Patient')}</span>
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {patient.id}
              </span>
              <span className="text-[11px] text-slate-400">
                {patient.age > 0 ? `${patient.age}y` : (bn ? 'বয়স অনির্ধারিত' : 'Age unrecorded')}, {patient.gender === 'female' ? (bn ? 'মহিলা' : 'F') : (bn ? 'পুরুষ' : 'M')}
              </span>
            </div>

            {/* Visit metadata */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-emerald-400" />
                <span className="text-slate-300 font-medium">{currentVisit?.visit_date || patient.visit_date}</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                  {isBaseline ? (bn ? 'প্রথম ভিজিট' : 'Initial') : (bn ? 'ফলো-আপ' : 'Follow-up')}
                </span>
                <span className="font-mono text-[10px] text-slate-400">({currentVisit?.visit_id || 'Active'})</span>
              </span>

              {isFollowUp && baselineVisit && baselineVisit.visit_id !== currentVisit?.visit_id && (
                <>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400 text-[10px]">
                    {bn ? 'বেসলাইন:' : 'Baseline:'} {baselineVisit.visit_date} ({baselineVisit.visit_id})
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Clinical Safety & Report Status Badges */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Allergy Reconciliation Badge */}
          <div 
            title={bn ? `অ্যালার্জি অবস্থা: ${allergyStatus}` : `Allergy Status: ${allergyStatus}`}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
              isAllergyReconciled
                ? hasActiveAllergies 
                  ? 'bg-rose-950/60 text-rose-300 border-rose-800' 
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                : 'bg-amber-950/60 text-amber-300 border-amber-800'
            }`}
          >
            {isAllergyReconciled ? (
              hasActiveAllergies ? (
                <>
                  <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
                  <span>{patient.confirmed_allergies.length} {bn ? 'অ্যালার্জেন' : 'Allergen(s)'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{bn ? 'অ্যালার্জি রিকনসাইল্ড (NKDA)' : 'Allergies Reconciled'}</span>
                </>
              )
            ) : (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span>{bn ? 'অ্যালার্জি অপরীক্ষিত' : 'Allergies Unreconciled'}</span>
              </>
            )}
          </div>

          {/* Medication Reconciliation Badge */}
          <div 
            title={bn ? `মেডিকেশন অবস্থা: ${medStatus}` : `Medication Status: ${medStatus}`}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
              isMedReconciled
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                : 'bg-amber-950/60 text-amber-300 border-amber-800'
            }`}
          >
            {isMedReconciled ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>{bn ? 'ওষুধ রিকনসাইল্ড' : 'Meds Reconciled'}</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span>{bn ? 'ওষুধ অপরীক্ষিত' : 'Meds Pending'}</span>
              </>
            )}
          </div>

          {/* Hard Stop Alert */}
          {hasHardStops && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-900 text-rose-200 border border-rose-700 animate-pulse">
              <Lock className="h-3.5 w-3.5" />
              <span>{bn ? 'হার্ড স্টপ সক্রিয়!' : 'HARD STOP Active'}</span>
            </div>
          )}

          {/* Report Approval Badge */}
          <div 
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
              isReportApproved
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <FileCheck2 className={`h-3.5 w-3.5 ${isReportApproved ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>{isReportApproved ? (bn ? 'রিপোর্ট অনুমোদিত' : 'Report Approved') : (bn ? 'রিপোর্ট পেন্ডিং' : 'Report Pending')}</span>
          </div>

          {/* Actions: Switch Patient & Start New Visit */}
          <div className="flex items-center gap-1.5 ml-2 border-l border-slate-800 pl-2">
            <button
              onClick={() => setShowSwitchModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title={bn ? 'অন্য রোগী নির্বাচন করুন' : 'Switch active patient'}
            >
              <ArrowRightLeft className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">{bn ? 'রোগী বদল' : 'Switch'}</span>
            </button>

            <button
              onClick={() => setShowNewVisitModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
              title={bn ? 'নতুন ভিজিট শুরু করুন' : 'Start new clinical visit'}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>{bn ? 'নতুন ভিজিট' : 'New Visit'}</span>
            </button>
          </div>

        </div>

      </div>

      {/* Switch Patient Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-foreground border rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-primary" />
                <span>{bn ? 'সক্রিয় রোগী পরিবর্তন করুন' : 'Switch Active Patient'}</span>
              </h3>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              {bn
                ? 'তালিকা থেকে রোগী নির্বাচন করুন অথবা সম্পূর্ণ তালিকা ও সার্চের জন্য রোগী রেজিস্ট্রি ট্যাবে যান।'
                : 'Select a saved patient or go to the full Patients Directory tab.'}
            </p>

            <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-border">
              {savedPatients.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  {bn ? 'কোনো সংরক্ষিত রোগী পাওয়া যায়নি।' : 'No saved patients found.'}
                </div>
              ) : (
                savedPatients.map(sp => (
                  <button
                    key={sp.patient.id}
                    onClick={() => {
                      loadPatient(sp.patient.id);
                      setShowSwitchModal(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg text-xs flex items-center justify-between transition ${
                      sp.patient.id === patient.id ? 'bg-primary/10 border border-primary/30 font-semibold' : 'hover:bg-accent'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-foreground">{sp.patient.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {sp.patient.id} • {sp.patient.gender}, {sp.patient.age}y
                      </div>
                    </div>
                    {sp.patient.id === patient.id ? (
                      <span className="text-[10px] text-primary font-bold">{bn ? 'সক্রিয়' : 'Active'}</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">{sp.patient.visit_date}</span>
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="pt-2 border-t flex justify-between items-center">
              <button
                onClick={() => {
                  setShowSwitchModal(false);
                  setActiveTab('patients');
                }}
                className="text-xs text-primary font-bold hover:underline"
              >
                {bn ? 'রোগী রেজিস্ট্রি ট্যাবে যান →' : 'Go to Patients Directory →'}
              </button>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-accent"
              >
                {bn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start New Visit Confirmation Modal */}
      {showNewVisitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-foreground border rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-emerald-600" />
                <span>{bn ? 'নতুন ক্লিনিক্যাল ভিজিট শুরু করুন' : 'Start New Clinical Visit'}</span>
              </h3>
              <button
                onClick={() => setShowNewVisitModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {bn
                ? `রোগী "${patient.name}" (${patient.id})-এর জন্য একটি নতুন ভিজিট সেশন শুরু হবে। বর্তমান ভিজিটের তথ্য সংরক্ষিত থাকবে এবং নতুন ভিজিটে তুলনামূলক অগ্রগতির জন্য বেসলাইন হিসেবে রেফারেন্স থাকবে।`
                : `A new clinical visit session will be created for "${patient.name}" (${patient.id}). The current visit will be saved in history and used as baseline for longitudinal comparison.`}
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground block">
                {bn ? 'ভিজিটের ধরন নির্বাচন করুন:' : 'Select Visit Type:'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewVisitType('followup')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                    newVisitType === 'followup' ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-accent'
                  }`}
                >
                  <div>{bn ? 'ফলো-আপ ভিজিট' : 'Follow-Up Visit'}</div>
                  <div className="text-[10px] font-normal text-muted-foreground">{bn ? 'অগ্রগতি ও ল্যাব পর্যালোচনা' : 'Progress & Lab Review'}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setNewVisitType('acute')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                    newVisitType === 'acute' ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-accent'
                  }`}
                >
                  <div>{bn ? 'জরুরি / একিউট' : 'Acute Consultation'}</div>
                  <div className="text-[10px] font-normal text-muted-foreground">{bn ? 'নতুন লক্ষণ বা সমস্যা' : 'New acute symptoms'}</div>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewVisitModal(false)}
                className="px-3.5 py-1.5 rounded-xl border text-xs font-semibold hover:bg-accent"
              >
                {bn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmNewVisit}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
              >
                {bn ? 'ভিজিট শুরু করুন' : 'Confirm & Start Visit'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
