'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  GitCompare,
  CheckCircle2,
  XCircle,
  Edit3,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  User,
  Activity,
  Flame,
  Utensils,
  Check,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { usePractice } from '@/context/PracticeContext';
import { AssessmentSubmission, ReconciliationDecision } from '@/repositories/types';

interface IntakeReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReconciliationComplete?: () => void;
}

export const IntakeReconciliationModal: React.FC<IntakeReconciliationModalProps> = ({
  isOpen,
  onClose,
  onReconciliationComplete,
}) => {
  const { patient, language, repository, clinicianUser, updatePatient } = usePractice();
  const bn = language === 'bn';

  const [submissions, setSubmissions] = useState<AssessmentSubmission[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [merging, setMerging] = useState<boolean>(false);
  const [reviewNotes, setReviewNotes] = useState<string>('');

  // Field decision states: { [fieldKey]: { status: 'accepted' | 'rejected' | 'edited', value?: any } }
  const [decisions, setDecisions] = useState<Record<string, ReconciliationDecision>>({});

  const loadSubmissions = async () => {
    if (!patient?.id) return;
    try {
      setLoading(true);
      const list = await repository.getStagedSubmissions(patient.id);
      setSubmissions(list);
      if (list.length > 0 && !selectedSubId) {
        setSelectedSubId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load staged submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && patient?.id) {
      loadSubmissions();
    }
  }, [isOpen, patient?.id]);

  const activeSubmission = submissions.find(s => s.id === selectedSubId) || submissions[0] || null;

  // Initialize decisions when active submission changes
  useEffect(() => {
    if (activeSubmission) {
      const resp = activeSubmission.responses_json || {};
      const initial: Record<string, ReconciliationDecision> = {};

      const fieldsToCheck = [
        'weight_kg',
        'height_cm',
        'waist_cm',
        'sleep_hours',
        'activity_level',
        'digestive_fire_agni',
        'bristol_stool_score',
        'bloating',
        'acid_reflux_hypoacidity',
      ];

      fieldsToCheck.forEach(f => {
        if (resp[f] !== undefined) {
          initial[f] = { status: 'accepted', value: resp[f] };
        }
      });

      // Allergies
      if (Array.isArray(resp.reported_allergies) && resp.reported_allergies.length > 0) {
        initial['confirmed_allergies'] = { status: 'accepted', value: resp.reported_allergies };
      }

      setDecisions(initial);
      setReviewNotes(`Reconciliation reviewed by ${clinicianUser.name} on ${new Date().toLocaleDateString()}`);
    }
  }, [activeSubmission, clinicianUser.name]);

  if (!isOpen || !patient) return null;

  const setDecisionStatus = (field: string, status: 'accepted' | 'rejected' | 'edited', value?: any) => {
    setDecisions(prev => ({
      ...prev,
      [field]: {
        status,
        value: value !== undefined ? value : prev[field]?.value,
      },
    }));
  };

  const handleMerge = async () => {
    if (!activeSubmission) return;

    try {
      setMerging(true);
      const result = await repository.reconcileAssessmentSubmission(
        activeSubmission.id,
        clinicianUser,
        decisions,
        reviewNotes
      );

      // Update patient in PracticeContext
      updatePatient(result.updatedPatient);

      alert(
        bn
          ? 'রোগীর চার্ট সফলভাবে আপডেট ও রিকনসাইল করা হয়েছে!'
          : 'Patient chart successfully reconciled and updated with audit sign-off!'
      );

      if (onReconciliationComplete) {
        onReconciliationComplete();
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to reconcile assessment submission:', err);
      alert(err?.message || 'Failed to reconcile assessment submission');
    } finally {
      setMerging(false);
    }
  };

  const responses = activeSubmission?.responses_json || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
              <GitCompare className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">
                  {bn ? 'পেশেন্ট সেলফ-অ্যাসেসমেন্ট রিকনসিলিয়েশন' : 'Patient Self-Assessment Reconciliation'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  {submissions.length} {bn ? 'টি স্টেজড সাবমিশন' : 'Staged Submissions'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {bn
                  ? `রোগী: ${patient.name} • লাইসেন্সপ্রাপ্ত পুষ্টিবিদ দ্বারা যাচাইকরণ আবশ্যক`
                  : `Patient: ${patient.name} • Clinical verification and selective sign-off required`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              {bn ? 'স্ট্যাজিং কিউ লোড হচ্ছে...' : 'Loading staging queue...'}
            </div>
          ) : submissions.length === 0 ? (
            <div className="py-12 text-center bg-muted/20 border border-dashed border-border rounded-3xl p-8 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-sm text-foreground">
                {bn ? 'কোনো অমীমাংসিত সাবমিশন নেই' : 'No Pending Intake Submissions'}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {bn
                  ? 'এই রোগীর জন্য বর্তমানে কোনো নতুন সেলফ-রিপোর্টেড সাবমিশন অপেক্ষমাণ নেই। রিমোট ইনভাইটেশন পাঠাতে ইনভাইটেশন মডাল ব্যবহার করুন।'
                  : 'There are no pending patient self-assessments in the staging queue for this patient. You can send a new intake link from the invitation modal.'}
              </p>
            </div>
          ) : (
            <>
              {/* Submission Selector Tabs */}
              {submissions.length > 1 && (
                <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
                  {submissions.map(sub => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedSubId(sub.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                        selectedSubId === sub.id
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {new Date(sub.submitted_at).toLocaleDateString()} (ID: {sub.id.substring(0, 8)})
                    </button>
                  ))}
                </div>
              )}

              {/* Patient Submission Meta Banner */}
              <div className="bg-muted/40 border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-bold text-foreground">
                    {patient.name}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    {bn ? 'জমার সময়:' : 'Submitted:'}{' '}
                    {new Date(activeSubmission.submitted_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    {bn ? 'আইসোলেটেড স্ট্যাজিং কিউ' : 'Isolated Staging Queue'}
                  </span>
                </div>
              </div>

              {/* Side-by-Side Diff Table */}
              <div className="border border-border rounded-2xl overflow-hidden shadow-xs">
                <div className="grid grid-cols-12 bg-muted/60 p-3 text-xs font-bold text-muted-foreground border-b border-border">
                  <div className="col-span-4">{bn ? 'ক্লিনিক্যাল প্যারামিটার' : 'Clinical Metric / Parameter'}</div>
                  <div className="col-span-3 text-center">{bn ? 'বিদ্যমান চার্ট' : 'Active Clinical Chart'}</div>
                  <div className="col-span-3 text-center text-primary">{bn ? 'রোগীর সেলফ-রিপোর্ট' : 'Patient Self-Reported'}</div>
                  <div className="col-span-2 text-right">{bn ? 'সিদ্ধান্ত' : 'Action'}</div>
                </div>

                <div className="divide-y divide-border text-xs">
                  {/* Weight */}
                  {responses.weight_kg !== undefined && (
                    <div className="grid grid-cols-12 p-3.5 items-center hover:bg-muted/20">
                      <div className="col-span-4">
                        <span className="font-bold text-foreground block">
                          {bn ? 'ওজন (Weight)' : 'Body Weight'}
                        </span>
                        <span className="text-[11px] text-muted-foreground">kg</span>
                      </div>
                      <div className="col-span-3 text-center font-semibold text-muted-foreground">
                        {patient.weight_kg} kg
                      </div>
                      <div className="col-span-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {responses.weight_kg} kg
                      </div>
                      <div className="col-span-2 flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDecisionStatus('weight_kg', 'accepted', responses.weight_kg)}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] transition ${
                            decisions.weight_kg?.status === 'accepted'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {bn ? 'গ্রহণ' : 'Accept'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDecisionStatus('weight_kg', 'rejected')}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] transition ${
                            decisions.weight_kg?.status === 'rejected'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {bn ? 'বাতিল' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Height */}
                  {responses.height_cm !== undefined && (
                    <div className="grid grid-cols-12 p-3.5 items-center hover:bg-muted/20">
                      <div className="col-span-4">
                        <span className="font-bold text-foreground block">
                          {bn ? 'উচ্চতা (Height)' : 'Body Height'}
                        </span>
                        <span className="text-[11px] text-muted-foreground">cm</span>
                      </div>
                      <div className="col-span-3 text-center font-semibold text-muted-foreground">
                        {patient.height_cm} cm
                      </div>
                      <div className="col-span-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {responses.height_cm} cm
                      </div>
                      <div className="col-span-2 flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDecisionStatus('height_cm', 'accepted', responses.height_cm)}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] transition ${
                            decisions.height_cm?.status === 'accepted'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {bn ? 'গ্রহণ' : 'Accept'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDecisionStatus('height_cm', 'rejected')}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] transition ${
                            decisions.height_cm?.status === 'rejected'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {bn ? 'বাতিল' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Waist */}
                  {responses.waist_cm !== undefined && (
                    <div className="grid grid-cols-12 p-3.5 items-center hover:bg-muted/20">
                      <div className="col-span-4">
                        <span className="font-bold text-foreground block">
                          {bn ? 'কোমরের মাপ (Waist)' : 'Waist Circumference'}
                        </span>
                        <span className="text-[11px] text-muted-foreground">cm</span>
                      </div>
                      <div className="col-span-3 text-center font-semibold text-muted-foreground">
                        {patient.waist_cm} cm
                      </div>
                      <div className="col-span-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {responses.waist_cm} cm
                      </div>
                      <div className="col-span-2 flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDecisionStatus('waist_cm', 'accepted', responses.waist_cm)}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] transition ${
                            decisions.waist_cm?.status === 'accepted'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {bn ? 'গ্রহণ' : 'Accept'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDecisionStatus('waist_cm', 'rejected')}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] transition ${
                            decisions.waist_cm?.status === 'rejected'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {bn ? 'বাতিল' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sleep Hours */}
                  {responses.sleep_hours !== undefined && (
                    <div className="grid grid-cols-12 p-3.5 items-center hover:bg-muted/20">
                      <div className="col-span-4">
                        <span className="font-bold text-foreground block">
                          {bn ? 'দৈনিক ঘুম (Sleep)' : 'Sleep Duration'}
                        </span>
                        <span className="text-[11px] text-muted-foreground">hours/night</span>
                      </div>
                      <div className="col-span-3 text-center font-semibold text-muted-foreground">
                        {patient.sleep_hours} hrs
                      </div>
                      <div className="col-span-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {responses.sleep_hours} hrs
                      </div>
                      <div className="col-span-2 flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDecisionStatus('sleep_hours', 'accepted', responses.sleep_hours)}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] transition ${
                            decisions.sleep_hours?.status === 'accepted'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {bn ? 'গ্রহণ' : 'Accept'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDecisionStatus('sleep_hours', 'rejected')}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] transition ${
                            decisions.sleep_hours?.status === 'rejected'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {bn ? 'বাতিল' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Agni */}
                  {responses.digestive_fire_agni !== undefined && (
                    <div className="grid grid-cols-12 p-3.5 items-center hover:bg-muted/20">
                      <div className="col-span-4">
                        <span className="font-bold text-foreground block">
                          {bn ? 'হজম ও অগ্নি (Agni)' : 'Digestive Agni'}
                        </span>
                        <span className="text-[11px] text-muted-foreground">Ayurvedic</span>
                      </div>
                      <div className="col-span-3 text-center font-semibold text-muted-foreground capitalize">
                        {patient.gut_profile?.digestive_fire_agni || 'unassessed'}
                      </div>
                      <div className="col-span-3 text-center font-bold text-emerald-600 dark:text-emerald-400 capitalize">
                        {responses.digestive_fire_agni}
                      </div>
                      <div className="col-span-2 flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDecisionStatus('digestive_fire_agni', 'accepted', responses.digestive_fire_agni)}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] transition ${
                            decisions.digestive_fire_agni?.status === 'accepted'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {bn ? 'গ্রহণ' : 'Accept'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDecisionStatus('digestive_fire_agni', 'rejected')}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] transition ${
                            decisions.digestive_fire_agni?.status === 'rejected'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {bn ? 'বাতিল' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bristol Stool */}
                  {responses.bristol_stool_score !== undefined && (
                    <div className="grid grid-cols-12 p-3.5 items-center hover:bg-muted/20">
                      <div className="col-span-4">
                        <span className="font-bold text-foreground block">
                          {bn ? 'ব্রিস্টল স্টুল স্কেল' : 'Bristol Stool Score'}
                        </span>
                        <span className="text-[11px] text-muted-foreground">1-7</span>
                      </div>
                      <div className="col-span-3 text-center font-semibold text-muted-foreground">
                        Type {patient.gut_profile?.bristol_stool_score || 4}
                      </div>
                      <div className="col-span-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        Type {responses.bristol_stool_score}
                      </div>
                      <div className="col-span-2 flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDecisionStatus('bristol_stool_score', 'accepted', responses.bristol_stool_score)}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] transition ${
                            decisions.bristol_stool_score?.status === 'accepted'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {bn ? 'গ্রহণ' : 'Accept'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDecisionStatus('bristol_stool_score', 'rejected')}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] transition ${
                            decisions.bristol_stool_score?.status === 'rejected'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {bn ? 'বাতিল' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bloating */}
                  {responses.bloating !== undefined && (
                    <div className="grid grid-cols-12 p-3.5 items-center hover:bg-muted/20">
                      <div className="col-span-4">
                        <span className="font-bold text-foreground block">
                          {bn ? 'পেট ফাঁপা (Bloating)' : 'Bloating Severity'}
                        </span>
                        <span className="text-[11px] text-muted-foreground">Gut</span>
                      </div>
                      <div className="col-span-3 text-center font-semibold text-muted-foreground capitalize">
                        {patient.gut_profile?.bloating || 'none'}
                      </div>
                      <div className="col-span-3 text-center font-bold text-emerald-600 dark:text-emerald-400 capitalize">
                        {responses.bloating}
                      </div>
                      <div className="col-span-2 flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDecisionStatus('bloating', 'accepted', responses.bloating)}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] transition ${
                            decisions.bloating?.status === 'accepted'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {bn ? 'গ্রহণ' : 'Accept'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDecisionStatus('bloating', 'rejected')}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] transition ${
                            decisions.bloating?.status === 'rejected'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {bn ? 'বাতিল' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Self-Reported Allergies Alert */}
                  {Array.isArray(responses.reported_allergies) && responses.reported_allergies.length > 0 && (
                    <div className="p-4 bg-amber-500/10 border-t border-b border-amber-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <span className="font-bold text-xs text-amber-900 dark:text-amber-200">
                            {bn ? 'রোগীর সেলফ-রিপোর্টেড অ্যালার্জি সতর্কতা' : 'Patient Self-Reported Allergies'}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDecisionStatus('confirmed_allergies', 'accepted', responses.reported_allergies)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition ${
                              decisions.confirmed_allergies?.status === 'accepted'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {bn ? 'চার্টে অ্যালার্জি যোগ করুন' : 'Confirm & Add to Chart'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDecisionStatus('confirmed_allergies', 'rejected')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition ${
                              decisions.confirmed_allergies?.status === 'rejected'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {bn ? 'প্রত্যাখ্যান' : 'Reject (Unverified)'}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {responses.reported_allergies.map((alg: string) => (
                          <span
                            key={alg}
                            className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200"
                          >
                            {alg}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300">
                        {bn
                          ? 'অ্যালার্জি নিশ্চিত করলে সফটওয়্যার স্বয়ংক্রিয়ভাবে বিপরীতমুখী বা ক্ষতিকর খাদ্যসমূহ লক করবে।'
                          : 'Accepting will add these to confirmed allergies and engage dietary safety contraindication filters.'}
                      </p>
                    </div>
                  )}

                  {/* Reported Medications text */}
                  {responses.reported_medications && (
                    <div className="p-4 bg-muted/30 space-y-1">
                      <span className="font-bold text-foreground text-xs block">
                        {bn ? 'রোগীর উল্লেখিত ওষুধ/সাপ্লিমেন্ট:' : 'Reported Medications / Supplements:'}
                      </span>
                      <p className="text-xs text-muted-foreground italic">
                        "{responses.reported_medications}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Clinician Reviewer Notes */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  {bn ? 'ক্লিনিক্যাল রিকনসিলিয়েশন নোটস' : 'Clinical Reconciliation Notes (Immutable Audit Entry)'}
                </label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Clinical observations regarding reconciled metrics..."
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border bg-card text-muted-foreground text-xs font-semibold hover:bg-muted transition"
          >
            {bn ? 'বাতিল' : 'Cancel'}
          </button>

          {submissions.length > 0 && activeSubmission && (
            <button
              type="button"
              onClick={handleMerge}
              disabled={merging}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
            >
              {merging ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {bn ? 'মার্জ হচ্ছে...' : 'Merging & Auditing...'}
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  {bn ? 'চার্টে মার্জ ও সাইন-অফ করুন' : 'Merge Reconciled Answers into Patient Chart'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
