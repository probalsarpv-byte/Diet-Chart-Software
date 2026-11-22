'use client';

import React, { useState } from 'react';
import { AlertCircle, ShieldAlert, ArrowLeft, RefreshCw, PhoneCall } from 'lucide-react';

interface IntakeInvalidTokenProps {
  reason?: 'missing' | 'expired' | 'revoked' | 'completed' | 'error';
  errorMessage?: string;
  onRetry?: () => void;
}

export const IntakeInvalidToken: React.FC<IntakeInvalidTokenProps> = ({
  reason = 'missing',
  errorMessage,
  onRetry,
}) => {
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const bn = lang === 'bn';

  const titles: Record<string, { en: string; bn: string }> = {
    missing: {
      en: 'Assessment Link Missing or Incomplete',
      bn: 'অ্যাসেসমেন্ট লিংক পাওয়া যায়নি বা অসম্পূর্ণ',
    },
    expired: {
      en: 'Assessment Link Expired',
      bn: 'অ্যাসেসমেন্ট লিংকের মেয়াদ উত্তীর্ণ হয়েছে',
    },
    revoked: {
      en: 'Assessment Link Revoked',
      bn: 'অ্যাসেসমেন্ট লিংকটি বাতিল করা হয়েছে',
    },
    completed: {
      en: 'Assessment Already Submitted',
      bn: 'অ্যাসেসমেন্ট ইতিমধ্যে জমা দেওয়া হয়েছে',
    },
    error: {
      en: 'Unable to Load Assessment',
      bn: 'অ্যাসেসমেন্ট লোড করা যায়নি',
    },
  };

  const descriptions: Record<string, { en: string; bn: string }> = {
    missing: {
      en: 'The self-assessment link you followed does not contain a valid security token. Please click the full link sent by your nutritionist or clinic.',
      bn: 'আপনার প্রবেশ করা লিংকে সঠিক সিকিউরিটি টোকেন নেই। দয়া করে আপনার পুষ্টিবিদ বা ক্লিনিক থেকে পাঠানো সম্পূর্ণ লিংকটি ব্যবহার করুন।',
    },
    expired: {
      en: 'For clinical privacy and security, intake assessment links expire after their designated time. Please contact your clinician to request a fresh link.',
      bn: 'চিকিৎসা তথ্যের নিরাপত্তা ও গোপনীয়তার স্বার্থে এই লিংকের মেয়াদ শেষ হয়ে গেছে। নতুন লিংকের জন্য আপনার পুষ্টিবিদের সাথে যোগাযোগ করুন।',
    },
    revoked: {
      en: 'This intake session has been updated or cancelled by your clinical provider. Please request a new link before completing your questionnaire.',
      bn: 'এই সেশনটি আপনার স্বাস্থ্যসেবা প্রদানকারী দ্বারা পরিবর্তিত বা বাতিল করা হয়েছে। অনুগ্রহ করে নতুন একটি লিংক সংগ্রহ করুন।',
    },
    completed: {
      en: 'Your responses have already been safely recorded and staged in your clinical dossier. Your nutritionist will review them during your consultation.',
      bn: 'আপনার তথ্যসমূহ নিরাপদে গ্রহণ করা হয়েছে এবং ক্লিনিক্যাল রেকর্ডে সংরক্ষিত আছে। আপনার অ্যাপয়েন্টমেন্টে পুষ্টিবিদ এটি পর্যালোচনা করবেন।',
    },
    error: {
      en: errorMessage || 'An unexpected error occurred while verifying your intake session. Please check your internet connection and try again.',
      bn: errorMessage || 'আপনার তথ্য যাচাইয়ের সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। দয়া করে ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।',
    },
  };

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

      {/* Main Card */}
      <div className="max-w-xl mx-auto w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-5 ${
            reason === 'completed'
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
          }`}>
            {reason === 'completed' ? (
              <AlertCircle className="h-8 w-8" />
            ) : (
              <ShieldAlert className="h-8 w-8" />
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
            {titles[reason]?.[lang] || titles.error[lang]}
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mb-8">
            {descriptions[reason]?.[lang] || descriptions.error[lang]}
          </p>

          <div className="w-full bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 text-left mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
              {bn ? 'পরবর্তী করণীয়' : 'What you should do'}
            </h4>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside">
              <li>
                {bn
                  ? 'আপনার চিকিৎসক বা পুষ্টিবিদের সহকারীকে মেসেজ দিয়ে নতুন লিংক চেয়ে নিন।'
                  : 'Contact your nutritionist or clinic coordinator to request a fresh assessment link.'}
              </li>
              <li>
                {bn
                  ? 'পূর্ববর্তী যেকোনো উত্তর আপনার ক্লিনিকের সার্ভারে নিরাপদে সংরক্ষিত রয়েছে।'
                  : 'Any previously confirmed records remain safely stored in your clinical chart.'}
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 transition"
              >
                <RefreshCw className="h-4 w-4" />
                {bn ? 'পুনরায় চেষ্টা করুন' : 'Retry Verification'}
              </button>
            )}
            <a
              href="./"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              {bn ? 'হোমপেজে যান' : 'Return to Portal'}
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-xl mx-auto w-full text-center mt-6">
        <p className="text-[11px] text-slate-400 dark:text-slate-600">
          SHUDDHO Precision & Functional Nutrition Clinical Intelligence • Confidential Health Portal
        </p>
      </div>
    </div>
  );
};
