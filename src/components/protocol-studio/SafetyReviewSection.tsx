'use client';

import React, { useState } from 'react';
import { R4SafetyEvaluation } from '@/types/r4Protocol';
import { ClinicianAuthProfile } from '@/lib/supabaseClient';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  FileCheck,
  Info,
  Clock,
  Sparkles
} from 'lucide-react';

interface SafetyReviewSectionProps {
  evaluation: R4SafetyEvaluation;
  clinician?: ClinicianAuthProfile | null;
  isApproved: boolean;
  version: number;
  onApprove: (notes?: string) => Promise<void>;
  language: 'bn' | 'en';
}

export const SafetyReviewSection: React.FC<SafetyReviewSectionProps> = ({
  evaluation,
  clinician,
  isApproved,
  version,
  onApprove,
  language
}) => {
  const bn = language === 'bn';
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { overall_status, can_approve, hard_stops, reviews_required, cautions, nutrient_overlaps, timing_conflicts } = evaluation;

  const handleApprove = async () => {
    if (!can_approve) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onApprove(approvalNotes);
    } catch (err: any) {
      setErrorMessage(err.message || 'Approval failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Status Header ── */}
      <div className={`p-6 rounded-2xl border ${
        overall_status === 'HARD_STOP'
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
          : overall_status === 'REQUIRES_REVIEW'
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
          : overall_status === 'CAUTION'
          ? 'bg-blue-500/10 border-blue-500/30 text-blue-500'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
      }`}>
        <div className="flex items-center gap-3.5 mb-2">
          <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center shrink-0 border border-current shadow-xs">
            {overall_status === 'HARD_STOP' ? (
              <ShieldAlert className="h-7 w-7 text-rose-500" />
            ) : overall_status === 'REQUIRES_REVIEW' ? (
              <AlertTriangle className="h-7 w-7 text-amber-500" />
            ) : (
              <ShieldCheck className="h-7 w-7 text-emerald-500" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-foreground">
                {bn ? 'ক্লিনিক্যাল সেফটি মূল্যায়ন ও সাইন-অফ গেট' : 'Multi-Axis Clinical Safety & Approval Gate'}
              </h2>
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                overall_status === 'HARD_STOP'
                  ? 'bg-rose-500 text-white'
                  : overall_status === 'REQUIRES_REVIEW'
                  ? 'bg-amber-500 text-black'
                  : 'bg-emerald-500 text-white'
              }`}>
                {overall_status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {can_approve
                ? (bn ? 'কোনো হার্ড স্টপ নেই। ক্লিনিশিয়ান পর্যালোচনার পর প্রোটোকল অনুমোদনের উপযুক্ত।' : 'No hard stop contraindications detected. Protocol is eligible for formal clinical approval.')
                : (bn ? 'হার্ড স্টপ বিদ্যমান। প্রোটোকল পরিবর্তন না করা পর্যন্ত স্বাক্ষর বা অনুমোদন সম্পূর্ণ নিষিদ্ধ।' : 'Active hard stop(s) detected. Protocol sign-off and release are strictly blocked.')}
            </p>
          </div>
        </div>
      </div>

      {/* ── Hard Stops Breakdown (If Any) ── */}
      {hard_stops.length > 0 && (
        <div className="bg-card border border-rose-500/40 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
            <ShieldAlert className="h-5 w-5" />
            <span>{bn ? `হার্ড স্টপ পর্যবেক্ষণ (${hard_stops.length}টি)` : `Clinical Hard Stops (${hard_stops.length})`}</span>
          </div>
          <div className="space-y-2">
            {hard_stops.map((hs, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1">
                <div className="font-bold text-rose-600 dark:text-rose-400">
                  {bn ? hs.title_bn : hs.title_en}
                </div>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground/80">{bn ? 'কারণ: ' : 'Rationale: '}</span>
                  {bn ? hs.rationale_bn : hs.rationale_en}
                </p>
                <p className="text-rose-500 font-medium">
                  <span className="font-semibold">{bn ? 'করণীয়: ' : 'Remedy: '}</span>
                  {bn ? hs.recommended_action_bn : hs.recommended_action_en}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Required Reviews Breakdown ── */}
      {reviews_required.length > 0 && (
        <div className="bg-card border border-amber-500/40 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
            <AlertTriangle className="h-5 w-5" />
            <span>{bn ? `পর্যালোচনা আবশ্যক (${reviews_required.length}টি)` : `Physician Review Required (${reviews_required.length})`}</span>
          </div>
          <div className="space-y-2">
            {reviews_required.map((rr, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                <div className="font-bold text-amber-600 dark:text-amber-400">
                  {bn ? rr.title_bn : rr.title_en}
                </div>
                <p className="text-muted-foreground">
                  {bn ? rr.rationale_bn : rr.rationale_en}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Overlap & Spacing Conflicts Breakdown ── */}
      {(nutrient_overlaps.length > 0 || timing_conflicts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nutrient Overlaps */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>{bn ? 'সাপ্লিমেন্ট ওভারল্যাপ ও ডোজ লিমিট' : 'Nutrient Overlaps & Upper Limits'}</span>
            </h3>
            {nutrient_overlaps.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                {bn ? 'কোনো ক্ষতিকর ওভারল্যাপ চিহ্নিত হয়নি।' : 'No multi-source nutrient overlaps detected.'}
              </p>
            ) : (
              <div className="space-y-2">
                {nutrient_overlaps.map((no, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-secondary/50 border border-border text-xs space-y-0.5">
                    <div className="font-bold text-foreground">
                      {no.nutrient}
                    </div>
                    <p className="text-muted-foreground text-[11px]">
                      {bn ? no.warning_bn : no.warning_en}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timing Conflicts */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-500" />
              <span>{bn ? 'টাইমিং ও স্পেসিং সংঘাত' : 'Timing & Spacing Conflicts'}</span>
            </h3>
            {timing_conflicts.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                {bn ? 'কোনো ড্রাগ-নিউট্রিয়েন্ট সময়ের সংঘাত নেই।' : 'No chronotherapy spacing collisions detected.'}
              </p>
            ) : (
              <div className="space-y-2">
                {timing_conflicts.map((tc, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-secondary/50 border border-border text-xs space-y-0.5">
                    <div className="font-bold text-foreground">
                      {tc.item1_title} ↔ {tc.item2_title}
                    </div>
                    <p className="text-muted-foreground text-[11px]">
                      {bn ? tc.warning_bn : tc.warning_en}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Formal Clinician Sign-Off Panel ── */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <FileCheck className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              {bn ? 'লাইসেন্সধারী ক্লিনিশিয়ানের আনুষ্ঠানিক অনুমোদন (Sign-Off)' : 'Licensed Clinician Formal Protocol Sign-Off'}
            </h3>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-secondary text-foreground">
            Version {version}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-background border border-border">
            <span className="text-muted-foreground block text-[11px] font-semibold mb-0.5">
              {bn ? 'অনুমোদনকারী ক্লিনিশিয়ান' : 'Signing Clinician'}
            </span>
            <span className="font-bold text-foreground">
              {clinician?.name || clinician?.email || (bn ? 'ডেমো ক্লিনিশিয়ান (সিমুলেশন)' : 'Demo Clinician (Simulation)')}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-background border border-border">
            <span className="text-muted-foreground block text-[11px] font-semibold mb-0.5">
              {bn ? 'প্রফেশনাল লাইসেন্স নম্বর' : 'License / Registration #'}
            </span>
            <span className="font-bold text-foreground font-mono">
              {clinician?.license_number || 'DEMO-SIMULATION-UNVERIFIED'}
            </span>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">
            {bn ? 'অনুমোদন ও পর্যবেক্ষণ নোট (ঐচ্ছিক)' : 'Clinical Approval Notes & Instructions'}
          </label>
          <textarea
            rows={2}
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder={bn ? 'প্রোটোকল অনুমোদন সংক্রান্ত কোনো বিশেষ পর্যবেক্ষণ বা পরামর্শ লিখুন...' : 'Document clinical rationale, titration notes, or follow-up milestones...'}
            className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-primary"
          />
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs">
            {errorMessage}
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            {can_approve
              ? (bn ? 'অনুমোদন সম্পন্ন হলে প্রোটোকলের একটি অপরিবর্তনীয় অডিট ভার্সন সংরক্ষিত হবে।' : 'Approval records an immutable audited timestamp and increments protocol version.')
              : (bn ? 'হার্ড স্টপ সংশোধন না হওয়া পর্যন্ত অনুমোদন বাটন নিষ্ক্রিয় থাকবে।' : 'Approval is strictly disabled until all critical Hard Stops are corrected.')}
          </p>

          <button
            onClick={handleApprove}
            disabled={!can_approve || isSubmitting}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all ${
              can_approve && !isSubmitting
                ? 'bg-primary hover:bg-primary-hover text-primary-foreground hover:scale-[1.02] cursor-pointer'
                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
            }`}
          >
            <Lock className="h-4 w-4" />
            <span>
              {isSubmitting
                ? (bn ? 'অনুমোদন প্রক্রিয়াধীন...' : 'Authorizing...')
                : isApproved
                ? (bn ? 'পুনঃঅনুমোদন ও ভার্সন লক' : 'Re-Approve & Bump Version')
                : (bn ? 'প্রোটোকল অনুমোদন করুন' : 'Approve & Lock Protocol')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
