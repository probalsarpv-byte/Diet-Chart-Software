'use client';

import React, { useState } from 'react';
import { PatientReportPayload } from '@/engine/reports/dualReportEngine';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  Utensils, 
  CheckCircle, 
  XCircle, 
  Printer, 
  Calendar,
  Lock,
  HeartHandshake,
  Droplets,
  CookingPot,
  Sparkles,
  Award
} from 'lucide-react';

interface PatientDietReportViewProps {
  payload: PatientReportPayload;
  language: 'en' | 'bn';
  onPrint?: () => void;
}

export const PatientDietReportView: React.FC<PatientDietReportViewProps> = ({
  payload,
  language,
  onPrint
}) => {
  const bn = language === 'bn';
  const [activeDayIndex, setActiveDayIndex] = useState<number>(0);
  const [showAllDays, setShowAllDays] = useState<boolean>(true);

  const { 
    clinic_letterhead, 
    nutritionist_signoff, 
    patient_identity, 
    safety_instructions, 
    traffic_light_guide, 
    chronological_schedule, 
    days,
    release_eligibility,
    is_released,
    disclaimers
  } = payload;

  const currentDay = days[activeDayIndex] || days[0];

  return (
    <div className="space-y-6" data-testid="patient-diet-report-view">

      {/* Release Gate Notice Toolbar (Hidden in Print) */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-subtle space-y-3 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <HeartHandshake className="h-3.5 w-3.5 text-emerald-600" />
              <span>{bn ? 'রোগী ডায়েট প্রেসক্রিপশন (U21)' : 'Patient-Safe Diet Prescription (U21)'}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              {bn ? 'ক্যালোরি ও ম্যাক্রোমুক্ত গৃহস্থালি পাত্রের পরিমাপ' : 'Food-First Guidance with Zero Numerical Calories/Macros'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {days.length > 1 && (
              <button
                type="button"
                onClick={() => setShowAllDays(!showAllDays)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                  showAllDays 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-card text-foreground border-border hover:bg-secondary'
                }`}
              >
                {showAllDays ? (bn ? '৭-দিনের পূর্ণ তালিকা' : 'Full 7-Day View') : (bn ? 'একক দিন' : 'Single Day')}
              </button>
            )}

            {onPrint && (
              <button
                type="button"
                data-testid="btn-print-patient-report"
                disabled={!is_released}
                onClick={() => {
                  if (!is_released) return;
                  onPrint();
                }}
                title={!is_released ? (bn ? 'অনুমোদনহীন খসড়া প্রিন্ট বা বিতরণ করা যাবে না' : 'Unapproved draft cannot be released') : ''}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-subtle transition ${
                  is_released
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                }`}
              >
                <Printer className="h-3.5 w-3.5" />
                <span>{bn ? 'রোগীর প্রেসক্রিপশন প্রিন্ট / PDF' : 'Print / Save as PDF'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Release Status Feedback Banner */}
        {!is_released ? (
          <div data-testid="patient-release-blocked-alert" className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">
                {bn ? 'রোগীর নিকট বিতরণের অনুমোদন স্থগিত (খসড়া প্রাক-দর্শন):' : 'Final Dispensation Gate Active (Draft Preview Only):'}
              </span>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                {(bn ? release_eligibility.blocking_reasons_bn : release_eligibility.blocking_reasons_en).map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
              <p className="text-[10px] text-muted-foreground pt-1">
                {bn 
                  ? 'রোগীর নিরাপত্তার স্বার্থে লাইসেন্সপ্রাপ্ত ক্লিনিক্যাল নিউট্রিশনিস্ট দ্বারা অনুমোদিত না হওয়া পর্যন্ত চূড়ান্ত প্রিন্ট নিষ্ক্রিয় থাকবে।'
                  : 'For patient safety, final print and distribution remain locked until the plan is verified and approved by a licensed clinical nutritionist.'}
              </p>
            </div>
          </div>
        ) : (
          <div data-testid="patient-release-approved-banner" className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
            <span className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>{bn ? 'ক্লিনিক্যালি অনুমোদিত ও স্বাক্ষরিত প্রেসক্রিপশন — বিতরণের জন্য প্রস্তুত' : 'Clinically Verified & Licensed Prescription — Ready for Dispensation'}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase">
              RELEASED
            </span>
          </div>
        )}
      </div>

      {/* Printable Patient-Safe Container */}
      <div className="print-container relative bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 border border-border/80 rounded-3xl p-6 sm:p-12 max-w-4xl mx-auto shadow-xl space-y-7 print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Prominent Watermark if Unapproved Draft (also visible in print) */}
        {!is_released && (
          <div data-testid="draft-watermark" className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0 opacity-10 print:opacity-25">
            <span className="text-6xl sm:text-7xl font-black uppercase text-amber-600 -rotate-45 tracking-widest border-8 border-dashed border-amber-600 p-8 rounded-3xl">
              {bn ? 'খসড়া প্রাক-দর্শন' : 'PROVISIONAL DRAFT'}
            </span>
          </div>
        )}

        {/* Print-Visible Unreleased Block Banner (Never hidden in print) */}
        {!is_released && (
          <div data-testid="printable-draft-block-banner" className="relative z-10 p-3.5 rounded-2xl border-2 border-amber-500 bg-amber-50/95 text-amber-950 text-xs space-y-1 avoid-break">
            <div className="font-extrabold uppercase tracking-wide flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
              <span>
                {bn
                  ? 'অস্থায়ী খসড়া প্রেসক্রিপশন — চূড়ান্ত বিতরণের জন্য অনুমোদিত নয়'
                  : 'PROVISIONAL UNRELEASED DRAFT — NOT APPROVED FOR PATIENT DISPENSATION'}
              </span>
            </div>
            {(bn ? release_eligibility.blocking_reasons_bn : release_eligibility.blocking_reasons_en).length > 0 && (
              <ul className="list-disc pl-5 text-[11px] space-y-0.5 text-amber-900">
                {(bn ? release_eligibility.blocking_reasons_bn : release_eligibility.blocking_reasons_en).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Clinic Letterhead */}
        <div className="relative z-10 border-b-2 border-emerald-600 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-sm">
                শু
              </div>
              <div>
                <h1 className="font-extrabold text-xl leading-tight text-slate-900 dark:text-white print:text-black">
                  {bn ? clinic_letterhead.clinic_name_bn : clinic_letterhead.clinic_name_en}
                </h1>
                {(clinic_letterhead.clinic_tagline_bn || clinic_letterhead.clinic_tagline_en) && (
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 print:text-emerald-700">
                    {bn ? clinic_letterhead.clinic_tagline_bn : clinic_letterhead.clinic_tagline_en}
                  </p>
                )}
              </div>
            </div>
            {(clinic_letterhead.clinic_address || clinic_letterhead.contact_phone) && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-600 mt-1">
                {[clinic_letterhead.clinic_address, clinic_letterhead.contact_phone ? `Tel: ${clinic_letterhead.contact_phone}` : null].filter(Boolean).join(' • ')}
              </p>
            )}
          </div>

          <div className="text-left sm:text-right text-xs">
            <div className="font-bold text-slate-900 dark:text-white print:text-black text-sm">
              {bn ? 'ব্যক্তিগতকৃত পুষ্টি ও জীবনধারা প্রেসক্রিপশন' : 'Personalized Nutrition & Lifestyle Prescription'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-600 mt-0.5">
              Plan ID: {patient_identity.id}_v{payload.plan_version}
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
              {bn ? 'চিকিৎসা মেয়াদ: ' : 'Protocol Duration: '} {patient_identity.duration_weeks}
            </div>
          </div>
        </div>

        {/* Patient Identity & Consultation Demographics Bar */}
        <div className="relative z-10 bg-slate-50 dark:bg-slate-900 print:bg-slate-100 border border-slate-200 dark:border-slate-800 print:border-slate-300 rounded-2xl p-4 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-slate-500 print:text-slate-600 block text-[10px]">{bn ? 'রোগীর নাম:' : 'Patient Name:'}</span>
            <strong className="text-slate-900 dark:text-white print:text-black text-sm font-bold">{patient_identity.name}</strong>
          </div>
          <div>
            <span className="text-slate-500 print:text-slate-600 block text-[10px]">{bn ? 'বয়স ও লিঙ্গ:' : 'Age & Gender:'}</span>
            <span className="text-slate-800 dark:text-slate-200 print:text-black font-semibold">
              {patient_identity.age_display} • {patient_identity.gender_display}
            </span>
          </div>
          <div>
            <span className="text-slate-500 print:text-slate-600 block text-[10px]">{bn ? 'পরামর্শের তারিখ:' : 'Consultation Date:'}</span>
            <span className="text-slate-800 dark:text-slate-200 print:text-black font-semibold">
              {patient_identity.visit_date}
            </span>
          </div>
          {patient_identity.followup_date && (
            <div>
              <span className="text-slate-500 print:text-slate-600 block text-[10px]">{bn ? 'পরবর্তী সাক্ষাতের সম্ভাব্য তারিখ:' : 'Next Review Date:'}</span>
              <span className="text-emerald-700 dark:text-emerald-400 print:text-emerald-700 font-bold">
                {patient_identity.followup_date}
              </span>
            </div>
          )}
        </div>

        {/* Essential Safety Warnings & Restrictions */}
        {(safety_instructions.confirmed_allergies_to_avoid_bn.length > 0 || safety_instructions.clinician_food_exclusions_bn.length > 0) && (
          <div className="relative z-10 p-4 rounded-2xl border border-rose-300 bg-rose-50/80 dark:bg-rose-950/20 text-xs space-y-1.5 avoid-break">
            <span className="font-bold text-rose-800 dark:text-rose-400 flex items-center gap-1.5">
              <Lock className="h-4 w-4" />
              <span>{bn ? 'সম্পূর্ণ বর্জনীয় অ্যালার্জি ও চিকিৎসকের নিষেধাজ্ঞা (Strict Safety Exclusions):' : 'Strict Safety Exclusions (Allergies & Medical Restrictions):'}</span>
            </span>
            <div className="flex flex-wrap gap-3 text-[11px] text-slate-800 dark:text-slate-200">
              {safety_instructions.confirmed_allergies_to_avoid_bn.length > 0 && (
                <div>
                  <strong>{bn ? 'অ্যালার্জিযুক্ত খাবার:' : 'Confirmed Allergens:'} </strong>
                  <span className="text-rose-700 dark:text-rose-400 font-bold">
                    {bn ? safety_instructions.confirmed_allergies_to_avoid_bn.join(', ') : safety_instructions.confirmed_allergies_to_avoid_en.join(', ')}
                  </span>
                </div>
              )}
              {safety_instructions.clinician_food_exclusions_bn.length > 0 && (
                <div>
                  <strong>{bn ? 'চিকিৎসকের নিষেধাজ্ঞা:' : 'Medical Restrictions:'} </strong>
                  <span className="text-amber-700 dark:text-amber-400 font-bold">
                    {bn ? safety_instructions.clinician_food_exclusions_bn.join(', ') : safety_instructions.clinician_food_exclusions_en.join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fasting Schedule & Hypoglycemia Safeguards Banner */}
        {payload.fasting_evaluation?.is_fasting_prescribed && (
          <div data-testid="fasting-safety-banner" className={`relative z-10 p-3.5 rounded-2xl border text-xs space-y-1.5 avoid-break ${
            !payload.fasting_evaluation.is_safe_for_medication_regimen 
              ? 'bg-rose-50/90 dark:bg-rose-950/30 border-rose-300 text-rose-900 dark:text-rose-200' 
              : 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-300 text-emerald-900 dark:text-emerald-200'
          }`}>
            <div className="flex items-center gap-2 font-bold">
              <Clock className="h-4 w-4" />
              <span>
                {bn 
                  ? `ফাস্টিং ও আহারের সময়সূচি (${payload.fasting_evaluation.fasting_hours} ঘণ্টা ফাস্টিং: ${payload.fasting_evaluation.eating_window_start} – ${payload.fasting_evaluation.eating_window_end})`
                  : `Fasting Protocol (${payload.fasting_evaluation.fasting_hours}h Fasting: ${payload.fasting_evaluation.eating_window_start} – ${payload.fasting_evaluation.eating_window_end})`}
              </span>
            </div>
            {payload.fasting_evaluation.safety_warnings_bn.length > 0 && (
              <div className="text-[11px] font-semibold text-rose-800 dark:text-rose-300">
                {(bn ? payload.fasting_evaluation.safety_warnings_bn : payload.fasting_evaluation.safety_warnings_en).join(' ')}
              </div>
            )}
            {payload.fasting_evaluation.hypoglycemia_precautions_bn && (
              <div className="text-[10px] bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium">
                {bn ? payload.fasting_evaluation.hypoglycemia_precautions_bn : payload.fasting_evaluation.hypoglycemia_precautions_en}
              </div>
            )}
          </div>
        )}

        {/* Personalized 7-Food-Group Traffic Light Dietary Guide */}
        {(payload as any).seven_food_group_guide && (payload as any).seven_food_group_guide.groups?.length > 0 ? (
          <div className="relative z-10 border border-slate-200 dark:border-slate-800 print:border-slate-300 rounded-2xl p-4 space-y-3 bg-white dark:bg-slate-900/40 print:bg-white print:border-none print:p-0">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 print:text-black flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span>{bn ? '৭-টি প্রধান খাদ্য গ্রুপ ভিত্তিক ট্রাফিক লাইট খাদ্য নির্দেশিকা' : '7-Food-Group Traffic Light Dietary Guide'}</span>
              </h3>
              <span className="text-[10px] text-slate-500 print:text-slate-600">
                {bn ? 'গ্রিন (নির্দ্বিধায়) > ইয়েলো (মেপে/বুঝে) > রেড (পুরোপুরি বাদ)' : 'Green (Eat Freely) > Yellow (Portion Control) > Red (Strict Avoidance)'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse border border-slate-200 dark:border-slate-800 print:border-slate-300 print:text-[10px]">
                <thead className="print:table-header-group">
                  <tr className="bg-slate-50 dark:bg-slate-800/60 print:bg-slate-100 text-left border-b border-slate-200 dark:border-slate-800 print:border-slate-300">
                    <th className="p-2 font-bold text-slate-700 dark:text-slate-300 print:text-black w-[20%] border-r border-slate-200 dark:border-slate-800 print:border-slate-300">
                      {bn ? 'ফুড গ্রুপ (Food Group)' : 'Food Group'}
                    </th>
                    <th className="p-2 font-bold text-emerald-800 dark:text-emerald-400 print:text-emerald-900 w-[27%] border-r border-slate-200 dark:border-slate-800 print:border-slate-300 bg-emerald-50/30 print:bg-emerald-50/20">
                      {bn ? '🟢 গ্রিন জোন (নির্দ্বিধায় খান)' : '🟢 Green Zone (Eat Freely)'}
                    </th>
                    <th className="p-2 font-bold text-amber-800 dark:text-amber-400 print:text-amber-900 w-[27%] border-r border-slate-200 dark:border-slate-800 print:border-slate-300 bg-amber-50/30 print:bg-amber-50/20">
                      {bn ? '🟡 ইয়েলো জোন (মেপে/বুঝে খান)' : '🟡 Yellow Zone (Moderation)'}
                    </th>
                    <th className="p-2 font-bold text-rose-800 dark:text-rose-400 print:text-rose-900 w-[26%] bg-rose-50/30 print:bg-rose-50/20">
                      {bn ? '🔴 রেড জোন (পুরোপুরি বাদ)' : '🔴 Red Zone (Avoid Completely)'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-slate-300">
                  {((payload as any).seven_food_group_guide.groups as any[]).map(group => (
                    <tr key={group.group_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 print:break-inside-avoid">
                      <td className="p-2 font-semibold text-slate-800 dark:text-slate-200 print:text-black border-r border-slate-200 dark:border-slate-800 print:border-slate-300 align-top">
                        {bn ? group.title_bn : group.title_en}
                      </td>
                      <td className="p-2 text-slate-700 dark:text-slate-300 print:text-black border-r border-slate-200 dark:border-slate-800 print:border-slate-300 align-top bg-emerald-50/10 print:bg-transparent">
                        {group.green.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {group.green.map((item: any, idx: number) => (
                              <span key={idx} className="inline-block bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 print:bg-emerald-50 print:text-emerald-900 px-1.5 py-0.5 rounded text-[10px] break-words">
                                {bn ? item.name_bn : item.name_en}
                                {item.household_measure_bn && (
                                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400 print:text-emerald-800 ml-0.5">({bn ? item.household_measure_bn : item.household_measure_en})</span>
                                )}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">—</span>
                        )}
                      </td>
                      <td className="p-2 text-slate-700 dark:text-slate-300 print:text-black border-r border-slate-200 dark:border-slate-800 print:border-slate-300 align-top bg-amber-50/10 print:bg-transparent">
                        {group.yellow.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {group.yellow.map((item: any, idx: number) => (
                              <span key={idx} className="inline-block bg-amber-100/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 print:bg-amber-50 print:text-amber-900 px-1.5 py-0.5 rounded text-[10px] break-words">
                                {bn ? item.name_bn : item.name_en}
                                {item.household_measure_bn && (
                                  <span className="text-[9px] text-amber-700 dark:text-amber-400 print:text-amber-800 ml-0.5">({bn ? item.household_measure_bn : item.household_measure_en})</span>
                                )}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">—</span>
                        )}
                      </td>
                      <td className="p-2 text-slate-700 dark:text-slate-300 print:text-black align-top bg-rose-50/10 print:bg-transparent">
                        {group.red.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {group.red.map((item: any, idx: number) => (
                              <span key={idx} className="inline-block bg-rose-100/60 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 print:bg-rose-50 print:text-rose-900 px-1.5 py-0.5 rounded text-[10px] break-words">
                                {bn ? item.name_bn : item.name_en}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Baseline 3-column traffic light summary fallback */
          <div className="relative z-10 border border-slate-200 dark:border-slate-800 print:border-slate-300 rounded-2xl p-4 space-y-3 bg-white dark:bg-slate-900/40 print:bg-white avoid-break">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 print:text-black flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span>{bn ? 'আপনার জন্য ব্যক্তিগতকৃত ট্রাফিক লাইট খাদ্য নির্দেশিকা' : 'Your Personalized Traffic Light Food Guide'}</span>
              </h3>
              <span className="text-[10px] text-slate-500 print:text-slate-600">
                {bn ? 'স্বাচ্ছন্দ্যে গ্রহণীয় > পরিমিত > সম্পূর্ণ বর্জনীয়' : 'Green > Yellow > Red'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Green */}
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1">
                <span className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1 text-[11px]">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>{bn ? 'সবুজ (স্বাচ্ছন্দ্যে গ্রহণীয়):' : 'Green (Eat Freely):'}</span>
                </span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                  {(bn ? traffic_light_guide.green_foods_bn : traffic_light_guide.green_foods_en).join(', ')}
                </p>
              </div>

              {/* Yellow */}
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 space-y-1">
                <span className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1 text-[11px]">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>{bn ? 'হলুদ (পরিমিত ও সাবধানে):' : 'Yellow (Moderation):'}</span>
                </span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                  {(bn ? traffic_light_guide.yellow_foods_bn : traffic_light_guide.yellow_foods_en).join(', ')}
                </p>
              </div>

              {/* Red */}
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20 space-y-1">
                <span className="font-bold text-rose-800 dark:text-rose-400 flex items-center gap-1 text-[11px]">
                  <XCircle className="h-3.5 w-3.5" />
                  <span>{bn ? 'লাল (সম্পূর্ণ বর্জন করুন):' : 'Red (Avoid Completely):'}</span>
                </span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                  {(bn ? traffic_light_guide.red_foods_bn : traffic_light_guide.red_foods_en).join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 24-Hour Schedule & Chronotherapy Timeline */}
        {chronological_schedule.length > 0 && (
          <div className="relative z-10 border border-slate-200 dark:border-slate-800 print:border-slate-300 rounded-2xl p-4 space-y-3 bg-white dark:bg-slate-900/40 print:bg-white avoid-break">
            <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 print:text-black flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>{bn ? '২৪ ঘণ্টার খাবার ও ওষুধ সেবনের দৈনিক সময়সূচি' : 'Daily Meal & Medication Timing Schedule'}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {chronological_schedule.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[11px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-foreground font-mono">
                      {item.time}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {bn ? item.title_bn : item.title_en}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                    {bn ? item.instructions_bn : item.instructions_en}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Module 5: 6-Column Chronological Medication & Supplementation Protocol */}
        {payload.medication_supplement_protocol && (
          payload.medication_supplement_protocol.active_rows.length > 0 ||
          (payload.medication_supplement_protocol.pending_verification_rows?.length || 0) > 0 ||
          payload.medication_supplement_protocol.draft_candidates.length > 0
        ) && (
          <div data-testid="six-column-medication-protocol" className="relative z-10 border border-slate-200 dark:border-slate-800 print:border-slate-300 rounded-2xl p-4 space-y-3 bg-white dark:bg-slate-900/40 print:bg-white avoid-break">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 print:text-black flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-emerald-600" />
                <span>{bn ? 'ওষুধ ও সাপ্লিমেন্ট সেবনের ৬-কলাম দৈনিক প্রোটোকল' : '6-Column Medication & Supplementation Protocol'}</span>
              </h3>
              <span className="text-[10px] text-slate-500 print:text-slate-600">
                {bn ? 'সময়ক্রম অনুসারে সাজানো' : 'Sorted Chronologically'}
              </span>
            </div>

            {payload.medication_supplement_protocol.active_rows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse border border-slate-200 dark:border-slate-800 print:border-slate-300 print:text-[10px]">
                  <thead className="print:table-header-group">
                    <tr className="bg-slate-50 dark:bg-slate-800/60 print:bg-slate-100 text-left border-b border-slate-200 dark:border-slate-800 print:border-slate-300">
                      <th className="p-2 font-bold text-slate-700 dark:text-slate-300 print:text-black border-r border-slate-200 dark:border-slate-800 print:border-slate-300 w-[15%]">
                        {bn ? 'সময় (Time Sequence)' : 'Time Sequence'}
                      </th>
                      <th className="p-2 font-bold text-slate-700 dark:text-slate-300 print:text-black border-r border-slate-200 dark:border-slate-800 print:border-slate-300 w-[18%]">
                        {bn ? 'ওষুধ/সাপ্লিমেন্ট (ব্র্যান্ড)' : 'Brand Name'}
                      </th>
                      <th className="p-2 font-bold text-slate-700 dark:text-slate-300 print:text-black border-r border-slate-200 dark:border-slate-800 print:border-slate-300 w-[18%]">
                        {bn ? 'জেনেরিক নাম (Generic)' : 'Generic Name'}
                      </th>
                      <th className="p-2 font-bold text-slate-700 dark:text-slate-300 print:text-black border-r border-slate-200 dark:border-slate-800 print:border-slate-300 w-[15%]">
                        {bn ? 'ডোজ ও পরিমাণ (Dosage)' : 'Dosage'}
                      </th>
                      <th className="p-2 font-bold text-slate-700 dark:text-slate-300 print:text-black border-r border-slate-200 dark:border-slate-800 print:border-slate-300 w-[12%]">
                        {bn ? 'Duration' : 'Duration'}
                      </th>
                      <th className="p-2 font-bold text-slate-700 dark:text-slate-300 print:text-black w-[22%]">
                        {bn ? 'ক্লিনিক্যাল নির্দেশনা' : 'Clinical Instructions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-slate-300">
                    {payload.medication_supplement_protocol.active_rows.map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 print:break-inside-avoid">
                        <td className="p-2 font-mono font-bold text-slate-800 dark:text-slate-200 print:text-black border-r border-slate-200 dark:border-slate-800 print:border-slate-300">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] inline-block ${
                            row.sequence_time === 'UNKNOWN' 
                              ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-300' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                          }`}>
                            {bn ? row.sequence_time_bn : row.sequence_time_en}
                          </span>
                        </td>
                        <td className="p-2 font-bold text-slate-900 dark:text-white print:text-black border-r border-slate-200 dark:border-slate-800 print:border-slate-300">
                          {row.brand_name}
                          {row.requires_clinician_verification && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-900 border border-amber-300 font-normal print:inline-block print:border-amber-700">
                              {bn ? 'যাচাই সাপেক্ষ' : 'Review Required'}
                            </span>
                          )}
                        </td>
                        <td className="p-2 italic text-slate-600 dark:text-slate-400 print:text-slate-700 border-r border-slate-200 dark:border-slate-800 print:border-slate-300">
                          {row.generic_name}
                        </td>
                        <td className="p-2 font-semibold text-emerald-800 dark:text-emerald-400 print:text-emerald-900 border-r border-slate-200 dark:border-slate-800 print:border-slate-300">
                          {bn ? row.dosage_display_bn : row.dosage_display_en}
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-400 print:text-slate-700 border-r border-slate-200 dark:border-slate-800 print:border-slate-300">
                          {bn ? row.duration_bn : row.duration_en}
                        </td>
                        <td className="p-2 text-slate-700 dark:text-slate-300 print:text-black">
                          {bn ? row.clinical_instructions_bn : row.clinical_instructions_en}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Unverified / Incomplete Medication Reconciliation Warning Panel (Never hidden in print, strictly separated from approved active rows) */}
            {(payload.medication_supplement_protocol.pending_verification_rows?.length || 0) > 0 && (
              <div data-testid="pending-medication-verification-panel" className="mt-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-xs space-y-2 avoid-break">
                <span className="font-bold text-rose-800 dark:text-rose-300 print:text-rose-900 flex items-center gap-1.5 text-[11px]">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>
                    {bn
                      ? '⛔ অযাচাইকৃত বা অসম্পূর্ণ ওষুধ (রোগীর জন্য চূড়ান্ত নয় — চিকিৎসকের পুনর্মিলন আবশ্যক):'
                      : '⛔ Unverified / Incomplete Medications (Excluded from Approved Instructions — Clinician Verification Required):'}
                  </span>
                </span>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-800 dark:text-slate-200 print:text-black">
                  {payload.medication_supplement_protocol.pending_verification_rows.map((pRow, pIdx) => (
                    <li key={pRow.id || pIdx}>
                      <strong>{pRow.brand_name} ({pRow.generic_name})</strong> — {bn ? pRow.dosage_display_bn : pRow.dosage_display_en} • {bn ? pRow.sequence_time_bn : pRow.sequence_time_en}
                      {(bn ? pRow.verification_issue_reasons_bn : pRow.verification_issue_reasons_en)?.length ? (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-900 border border-amber-400 font-semibold print:inline-block">
                          {(bn ? pRow.verification_issue_reasons_bn : pRow.verification_issue_reasons_en)!.join('; ')}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Candidate / Draft Supplements Notice - Hidden in print as draft candidates are clinician review items only */}
            {payload.medication_supplement_protocol.draft_candidates.length > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5 no-print">
                <span className="font-bold text-amber-800 dark:text-amber-400 block text-[11px]">
                  {bn ? '⚠️ চিকিৎসকের অনুমোদন সাপেক্ষ খসড়া প্রস্তাবনা (Draft Candidates — Review Required):' : '⚠️ Draft Candidates (Pending Clinician Sign-off):'}
                </span>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                  {payload.medication_supplement_protocol.draft_candidates.map((cand, cIdx) => (
                    <li key={cIdx}>
                      <strong>{cand.brand_name} ({cand.generic_name})</strong> — {bn ? cand.dosage_display_bn : cand.dosage_display_en}: {bn ? cand.clinical_instructions_bn : cand.clinical_instructions_en}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Module 4: Bangladeshi Food Exchange & Household Portion Guide */}
        {payload.food_exchange_guide && payload.food_exchange_guide.length > 0 && (
          <div data-testid="food-exchange-guide" className="relative z-10 border border-slate-200 dark:border-slate-800 print:border-slate-300 rounded-2xl p-4 space-y-3 bg-white dark:bg-slate-900/40 print:bg-white avoid-break">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 print:text-black flex items-center gap-1.5">
                <Utensils className="h-4 w-4 text-emerald-600" />
                <span>{bn ? 'খাদ্য বিনিময় তালিকা ও পারিবারিক পাত্রের সঠিক পরিমাপ (Food Exchange Guide)' : 'Food Exchange & Household Portion Guide'}</span>
              </h3>
              <span className="text-[10px] text-slate-500 print:text-slate-600">
                {bn ? 'বাটি, কাপ, গ্লাস, চামচ, টুকরো ও হাতের তালুর মাপ' : 'Bati, Cup, Glass, Spoon, Piece & Palm Measures'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {payload.food_exchange_guide.map((ex, exIdx) => (
                <div key={exIdx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 dark:text-white print:text-black font-bold text-[12px]">
                      {bn ? ex.title_bn : ex.title_en}
                    </strong>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                      {bn ? ex.household_measure_bn : ex.household_measure_en}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    {bn ? ex.raw_to_cooked_conversion_note_bn : ex.raw_to_cooked_conversion_note_en}
                  </p>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    <strong>{bn ? 'উদাহরণ: ' : 'Examples: '}</strong>
                    {(bn ? ex.common_examples_bn : ex.common_examples_en).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patient-Specific Prescribed Food Exchange Options */}
        {payload.patient_specific_exchanges && payload.patient_specific_exchanges.length > 0 && (
          <div data-testid="patient-specific-food-exchanges" className="relative z-10 border border-slate-200 dark:border-slate-800 print:border-slate-300 rounded-2xl p-4 space-y-3 bg-white dark:bg-slate-900/40 print:bg-white avoid-break">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 print:text-black flex items-center gap-1.5">
                <Utensils className="h-4 w-4 text-emerald-600" />
                <span>{bn ? 'রোগীর জন্য অনুমোদিত সুনির্দিষ্ট বিকল্প খাদ্য বিনিময়' : 'Prescribed Food-Specific Exchange Options'}</span>
              </h3>
              <span className="text-[10px] text-slate-500 print:text-slate-600">
                {bn ? 'সমমানের পুষ্টিমান বজায় রেখে বিকল্প' : 'Matched Food Density Exchanges'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {payload.patient_specific_exchanges.slice(0, 6).map((px, pIdx) => (
                <div key={pIdx} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white print:text-black">
                      {bn ? px.original_food_name_bn : px.original_food_name_en} ({bn ? px.prescribed_household_portion_bn : px.prescribed_household_portion_en})
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold mx-2">⇄</span>
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">
                      {bn ? px.alternative_food_name_bn : px.alternative_food_name_en} ({bn ? px.alternative_household_portion_bn : px.alternative_household_portion_en})
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {bn ? px.nutritional_comparability_bn : px.nutritional_comparability_en}
                      {px.clinical_caution_bn ? ` • ${bn ? px.clinical_caution_bn : px.clinical_caution_en}` : ''}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium self-start sm:self-auto shrink-0">
                    {bn ? px.exchange_group_bn : px.exchange_group_en}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Page Break for Multi-Page Clean Print */}
        <div className="page-break" />

        {/* Meals & Portions Specification (The Core Patient Diet) */}
        <div className="relative z-10 border border-slate-200 dark:border-slate-800 print:border-slate-300 rounded-2xl p-4 sm:p-5 space-y-5 bg-white dark:bg-slate-900/40 print:bg-white print:border-none print:p-0">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white print:text-black flex items-center gap-1.5">
              <Utensils className="h-4 w-4 text-emerald-600" />
              <span>{bn ? 'খাদ্য তালিকা ও গৃহস্থালি পাত্রের সুনির্দিষ্ট পরিমাপ' : 'Prescribed Meals & Exact Household Portions'}</span>
            </h2>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
              {bn ? 'পারিবারিক পাত্রের সহজ মাপ' : 'Household Cups, Bowls & Pieces'}
            </span>
          </div>

          <div className="space-y-6">
            {(showAllDays ? days : [currentDay]).map(day => (
              <div key={day.day_number} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs print:break-inside-avoid print:mb-4">
                {/* Day Header */}
                <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                      {day.day_number}
                    </span>
                    <strong className="text-slate-900 dark:text-white print:text-black text-sm">
                      {bn ? day.day_name_bn : day.day_name_en}
                    </strong>
                  </div>
                  {day.fasting_window_display_bn && (
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                      {bn ? day.fasting_window_display_bn : day.fasting_window_display_en}
                    </span>
                  )}
                </div>

                {/* Meals */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {day.meals.map((meal, mIdx) => (
                    <div key={mIdx} className="p-3.5 space-y-2 bg-white dark:bg-slate-900/60">
                      <div className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800 pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                            {meal.target_time}
                          </span>
                          <strong className="text-slate-900 dark:text-white print:text-black font-semibold">
                            {bn ? meal.title_bn : meal.title_en}
                          </strong>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {meal.items.map((item, iIdx) => (
                          <div key={iIdx} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 text-xs gap-1.5">
                            <div>
                              <strong className="text-slate-900 dark:text-white print:text-black text-[13px]">
                                {bn ? item.food_name_bn : item.food_name_en}
                              </strong>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-600 mt-0.5">
                                {bn ? item.preparation_note_bn : item.preparation_note_en}
                              </p>
                              {item.approved_substitutes.length > 0 && (
                                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                                  {bn ? 'বিকল্প: ' : 'Alternative: '}
                                  {item.approved_substitutes.map(s => `${bn ? s.name_bn : s.name_en} (${bn ? s.portion_bn : s.portion_en})`).join(', ')}
                                </p>
                              )}
                            </div>

                            <div className="text-left sm:text-right shrink-0">
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 print:bg-emerald-100 print:text-emerald-800 font-bold text-xs">
                                {bn ? item.household_portion_bn : item.household_portion_en}
                              </span>
                              <span className="block text-[10px] text-slate-400 print:text-slate-500 mt-0.5 font-mono">
                                {item.raw_serving_weight_g}g {bn ? 'কাঁচা ওজন' : 'raw wt'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Essential Hydration, Oil & Salt Rules (Rendered only when prescribed) */}
        {(() => {
          const isOilPrescribed = safety_instructions.cooking_oil_rules_en && safety_instructions.cooking_oil_rules_en !== 'Not individually prescribed';
          const isSaltPrescribed = safety_instructions.salt_guidelines_en && safety_instructions.salt_guidelines_en !== 'Not individually prescribed';
          const isHydrationPrescribed = safety_instructions.hydration_guidelines_en && safety_instructions.hydration_guidelines_en !== 'Not individually prescribed';

          if (!isOilPrescribed && !isSaltPrescribed && !isHydrationPrescribed) {
            return null;
          }

          return (
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs avoid-break">
              {isOilPrescribed && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 print:text-black flex items-center gap-1.5">
                    <CookingPot className="h-4 w-4 text-amber-600" />
                    <span>{bn ? '১. রান্নার তেল ও ঘিয়ের মাপ:' : '1. Cooking Oil & Ghee:'}</span>
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {bn ? safety_instructions.cooking_oil_rules_bn : safety_instructions.cooking_oil_rules_en}
                  </p>
                </div>
              )}

              {isSaltPrescribed && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 print:text-black flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <span>{bn ? '২. রান্নার লবণের নির্দেশনা:' : '2. Cooking Salt Guidelines:'}</span>
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {bn ? safety_instructions.salt_guidelines_bn : safety_instructions.salt_guidelines_en}
                  </p>
                </div>
              )}

              {isHydrationPrescribed && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 print:text-black flex items-center gap-1.5">
                    <Droplets className="h-4 w-4 text-blue-600" />
                    <span>{bn ? '৩. বিশুদ্ধ পানি ও পানীয় পান:' : '3. Hydration Guidelines:'}</span>
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {bn ? safety_instructions.hydration_guidelines_bn : safety_instructions.hydration_guidelines_en}
                  </p>
                </div>
              )}
            </div>
          );
        })()}

        {/* Connected R4 Exercise & Circadian Support */}
        {payload.lifestyle_support && (payload.lifestyle_support.exercise?.is_prescribed || payload.lifestyle_support.sleep_circadian?.is_prescribed) && (
          <div data-testid="lifestyle-support-section" className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs avoid-break">
            {payload.lifestyle_support.exercise.is_prescribed && (
              <div className="space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 print:text-black flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span>{bn ? 'শারীরিক সক্রিয়তা ও ব্যায়াম নির্দেশনা:' : 'Physical Activity & Exercise:'}</span>
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {bn ? payload.lifestyle_support.exercise.target_bn : payload.lifestyle_support.exercise.target_en}
                </p>
                <p className="text-[10px] text-amber-700 dark:text-amber-400">
                  {bn ? payload.lifestyle_support.exercise.safety_instructions_bn : payload.lifestyle_support.exercise.safety_instructions_en}
                </p>
              </div>
            )}

            {payload.lifestyle_support.sleep_circadian.is_prescribed && (
              <div className="space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 print:text-black flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span>{bn ? 'ঘুম ও সার্কেডিয়ান সময়সূচি:' : 'Sleep & Circadian Timing:'}</span>
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {bn ? payload.lifestyle_support.sleep_circadian.instructions_bn : payload.lifestyle_support.sleep_circadian.instructions_en}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Nutritionist Sign-Off & Patient Disclaimer Block */}
        <div className="relative z-10 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 text-xs avoid-break">
          <div className="text-[10px] text-slate-500 max-w-md space-y-0.5">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              {bn ? disclaimers.bn : disclaimers.en}
            </p>
            <p>
              Shuddho Clinical Functional Nutrition
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className={`border-b pb-1 w-56 ml-auto text-center font-bold text-xs ${
              is_released 
                ? 'border-slate-400 text-slate-900 dark:text-white print:text-black' 
                : 'border-dashed border-amber-500 text-amber-600'
            }`}>
              {nutritionist_signoff.clinician_name}
            </div>
            {(nutritionist_signoff.license_title_bn || nutritionist_signoff.license_title_en) && (
              <div className="text-[10px] text-slate-500 mt-1 text-center">
                {bn ? nutritionist_signoff.license_title_bn : nutritionist_signoff.license_title_en}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
