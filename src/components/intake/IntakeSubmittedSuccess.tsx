'use client';

import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, HeartHandshake, Calendar, FileText, ArrowLeft } from 'lucide-react';
import { AssessmentSubmission } from '@/repositories/types';

interface IntakeSubmittedSuccessProps {
  submission: AssessmentSubmission;
  patientName?: string;
}

export const IntakeSubmittedSuccess: React.FC<IntakeSubmittedSuccessProps> = ({
  submission,
  patientName,
}) => {
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const bn = lang === 'bn';

  const dateStr = new Date(submission.submitted_at).toLocaleString(bn ? 'bn-BD' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      {/* Top Bar with Language Toggle */}
      <div className="max-w-xl mx-auto w-full flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            শুদ্ধ
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight">
            SHUDDHO CLINICAL
          </span>
        </div>
        <button
          type="button"
          onClick={() => setLang(l => (l === 'en' ? 'bn' : 'en'))}
          className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition shadow-xs"
        >
          {bn ? 'English' : 'বাংলায় দেখুন'}
        </button>
      </div>

      {/* Success Card */}
      <div className="max-w-xl mx-auto w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center mb-5">
            <CheckCircle2 className="h-9 w-9 stroke-[2.2]" />
          </div>

          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 mb-3 tracking-wide uppercase">
            {bn ? 'সফলভাবে জমা হয়েছে' : 'Submission Confirmed'}
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
            {bn ? 'ধন্যবাদ' : 'Thank You'}
            {patientName ? `, ${patientName}` : ''}!
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mb-8">
            {bn
              ? 'আপনার জীবনযাপন, হজম প্রক্রিয়া ও পুষ্টি বিষয়ক তথ্যসমূহ নিরাপদে আপনার পুষ্টিবিদের স্ট্যাজিং কিউতে জমা দেওয়া হয়েছে।'
              : 'Your health history, digestive assessment, and lifestyle details have been securely recorded and staged for your clinical nutritionist.'}
          </p>

          {/* Submission Receipt Details */}
          <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 text-left space-y-3 mb-8">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                {bn ? 'সাবমিশন আইডি' : 'Submission ID'}
              </span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {submission.id.substring(0, 16)}...
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                {bn ? 'সময়' : 'Timestamp'}
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {dateStr}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                {bn ? 'ক্লিনিক্যাল স্ট্যাটাস' : 'Clinical Staging'}
              </span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                {bn ? 'পর্যালোচনার অপেক্ষায়' : 'Staged for Clinician Review'}
              </span>
            </div>
          </div>

          {/* What Happens Next Card */}
          <div className="w-full bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-900/50 text-left mb-8">
            <div className="flex items-center gap-2 mb-2">
              <HeartHandshake className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wide">
                {bn ? 'এরপর কী হবে?' : 'What happens next?'}
              </h4>
            </div>
            <p className="text-xs text-emerald-950 dark:text-emerald-200/90 leading-relaxed">
              {bn
                ? 'আপনার পরামর্শের সময় আপনার পুষ্টিবিদ এই তথ্যগুলো বিস্তারিত যাচাই করবেন। আপনার হজমের ধরন (অগ্নি) এবং খাদ্যতালিকা অনুযায়ী একটি সুনির্দিষ্ট প্রেসক্রিপশন প্রস্তুত করা হবে।'
                : 'During your consultation, your licensed clinical nutritionist will review these self-reported entries side-by-side with your health metrics to curate your customized diet prescription.'}
            </p>
          </div>

          <a
            href="./"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            {bn ? 'হোমপেজে ফিরুন' : 'Return to Home'}
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-xl mx-auto w-full text-center mt-6">
        <p className="text-[11px] text-slate-400 dark:text-slate-600">
          SHUDDHO Precision & Functional Nutrition Clinical Intelligence • Patient Privacy Protected
        </p>
      </div>
    </div>
  );
};
