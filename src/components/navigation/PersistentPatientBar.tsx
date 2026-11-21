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
    const v = startNewVisit(patient.id, newVisitType);
    if (!v) {
      alert(bn ? "ভিজিট শুরু করতে ব্যর্থ হয়েছে: স্টোরেজ সীমা অতিক্রম করেছে বা ডাটা সংরক্ষণে ত্রুটি।" : "Failed to initiate new visit: storage quota exceeded or persistence error.");
      return;
    }
    setShowNewVisitModal(false);
    setActiveTab('assessment');
  };

  return (
    <div className="bg-card/95 backdrop-blur-md text-foreground border-b border-border shadow-subtle px-4 lg:px-8 py-2 text-xs no-print transition-colors">
      <div className="w-full flex flex-wrap items-center justify-between gap-3">
        
        {/* Patient Identity & Demographics */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold shadow-subtle transition-transform hover:scale-[1.03]">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground tracking-tight">{patient.name || (bn ? 'অজ্ঞাত রোগী' : 'Unnamed Patient')}</span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-lg bg-secondary text-foreground border border-border shadow-2xs tabular-numbers">
                {patient.id}
              </span>
              <span className="text-[11px] text-muted-foreground tabular-numbers">
                {patient.age > 0 ? `${patient.age}y` : (bn ? 'বয়স অনির্ধারিত' : 'Age unrecorded')}, {patient.gender === 'female' ? (bn ? 'মহিলা' : 'F') : (bn ? 'পুরুষ' : 'M')}
              </span>
            </div>

            {/* Visit metadata */}
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-primary" />
                <span className="text-foreground font-medium tabular-numbers">{currentVisit?.visit_date || patient.visit_date}</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 shadow-2xs">
                  {isBaseline ? (bn ? 'প্রথম ভিজিট' : 'Initial') : (bn ? 'ফলো-আপ' : 'Follow-up')}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">({currentVisit?.visit_id || 'Active'})</span>
              </span>

              {isFollowUp && baselineVisit && baselineVisit.visit_id !== currentVisit?.visit_id && (
                <>
                  <span className="text-border">|</span>
                  <span className="text-muted-foreground text-[10px]">
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
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-semibold border shadow-2xs transition-all ${
              isAllergyReconciled
                ? hasActiveAllergies 
                  ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30' 
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
            }`}
          >
            {isAllergyReconciled ? (
              hasActiveAllergies ? (
                <>
                  <AlertOctagon className="h-3.5 w-3.5 text-rose-500" />
                  <span>{patient.confirmed_allergies.length} {bn ? 'অ্যালার্জেন' : 'Allergen(s)'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{bn ? 'অ্যালার্জি রিকনসাইল্ড (NKDA)' : 'Allergies Reconciled'}</span>
                </>
              )
            ) : (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>{bn ? 'অ্যালার্জি অপরীক্ষিত' : 'Allergies Unreconciled'}</span>
              </>
            )}
          </div>

          {/* Medication Reconciliation Badge */}
          <div 
            title={bn ? `মেডিকেশন অবস্থা: ${medStatus}` : `Medication Status: ${medStatus}`}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-semibold border shadow-2xs transition-all ${
              isMedReconciled
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
            }`}
          >
            {isMedReconciled ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{bn ? 'ওষুধ রিকনসাইল্ড' : 'Meds Reconciled'}</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>{bn ? 'ওষুধ অপরীক্ষিত' : 'Meds Pending'}</span>
              </>
            )}
          </div>

          {/* Hard Stop Alert */}
          {hasHardStops && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold bg-rose-600 text-white border border-rose-700 animate-pulse shadow-subtle">
              <Lock className="h-3.5 w-3.5 text-white" />
              <span>{bn ? 'হার্ড স্টপ সক্রিয়!' : 'HARD STOP Active'}</span>
            </div>
          )}

          {/* Report Approval Badge */}
          <div 
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-semibold border shadow-2xs transition-all ${
              isReportApproved
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-secondary text-muted-foreground border-border'
            }`}
          >
            <FileCheck2 className={`h-3.5 w-3.5 ${isReportApproved ? 'text-primary' : 'text-muted-foreground'}`} />
            <span>{isReportApproved ? (bn ? 'রিপোর্ট অনুমোদিত' : 'Report Approved') : (bn ? 'রিপোর্ট পেন্ডিং' : 'Report Pending')}</span>
          </div>

          {/* Actions: Switch Patient & Start New Visit */}
          <div className="flex items-center gap-1.5 ml-2 border-l border-border pl-2">
            <button
              onClick={() => setShowSwitchModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all hover:scale-[1.02] active:scale-[0.98]"
              title={bn ? 'অন্য রোগী নির্বাচন করুন' : 'Switch active patient'}
            >
              <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">{bn ? 'রোগী বদল' : 'Switch'}</span>
            </button>

            <button
              onClick={() => setShowNewVisitModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground shadow-subtle transition-all hover:scale-[1.02] active:scale-[0.98]"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-foreground border border-border rounded-2xl max-w-md w-full p-6 shadow-dropdown space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-primary" />
                <span className="tracking-tight">{bn ? 'সক্রিয় রোগী পরিবর্তন করুন' : 'Switch Active Patient'}</span>
              </h3>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold h-7 w-7 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {bn
                ? 'তালিকা থেকে রোগী নির্বাচন করুন অথবা সম্পূর্ণ তালিকা ও সার্চের জন্য রোগী রেজিস্ট্রি ট্যাবে যান।'
                : 'Select a saved patient or go to the full Patients Directory tab.'}
            </p>

            <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-border pr-1">
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
                    className={`w-full text-left p-3 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      sp.patient.id === patient.id ? 'bg-primary/10 border border-primary/30 font-semibold' : 'hover:bg-secondary'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-foreground">{sp.patient.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono tabular-numbers">
                        {sp.patient.id} • {sp.patient.gender}, {sp.patient.age}y
                      </div>
                    </div>
                    {sp.patient.id === patient.id ? (
                      <span className="text-[10px] text-primary font-bold px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">{bn ? 'সক্রিয়' : 'Active'}</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground tabular-numbers">{sp.patient.visit_date}</span>
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-border flex justify-between items-center">
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
                className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors"
              >
                {bn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start New Visit Confirmation Modal */}
      {showNewVisitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-foreground border border-border rounded-2xl max-w-md w-full p-6 shadow-dropdown space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-primary" />
                <span className="tracking-tight">{bn ? 'নতুন ক্লিনিক্যাল ভিজিট শুরু করুন' : 'Start New Clinical Visit'}</span>
              </h3>
              <button
                onClick={() => setShowNewVisitModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold h-7 w-7 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
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
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setNewVisitType('followup')}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-colors ${
                    newVisitType === 'followup' ? 'border-primary bg-primary/10 text-primary shadow-subtle' : 'hover:bg-secondary border-border'
                  }`}
                >
                  <div className="font-bold">{bn ? 'ফলো-আপ ভিজিট' : 'Follow-Up Visit'}</div>
                  <div className="text-[10px] font-normal text-muted-foreground mt-0.5">{bn ? 'অগ্রগতি ও ল্যাব পর্যালোচনা' : 'Progress & Lab Review'}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setNewVisitType('acute')}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-colors ${
                    newVisitType === 'acute' ? 'border-primary bg-primary/10 text-primary shadow-subtle' : 'hover:bg-secondary border-border'
                  }`}
                >
                  <div className="font-bold">{bn ? 'জরুরি / একিউট' : 'Acute Consultation'}</div>
                  <div className="text-[10px] font-normal text-muted-foreground mt-0.5">{bn ? 'নতুন লক্ষণ বা সমস্যা' : 'New acute symptoms'}</div>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewVisitModal(false)}
                className="px-4 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors"
              >
                {bn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmNewVisit}
                className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-subtle transition-all hover:scale-[1.02] active:scale-[0.98]"
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
