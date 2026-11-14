'use client';

import React from 'react';
import { usePractice } from '@/context/PracticeContext';
import { CLINICAL_PHASES } from '@/engine/phaseProgression';
import { 
  Printer, 
  Globe, 
  ShieldCheck, 
  Activity, 
  Flame, 
  Clock, 
  Utensils, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  CookingPot
} from 'lucide-react';

export const ReportTab: React.FC = () => {
  const { patient, dietChart, trafficLight, dniResult, language, setLanguage } = usePractice();
  const bn = language === 'bn';
  const phaseInfo = CLINICAL_PHASES[patient.current_phase];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Action Bar (Hidden in Print) */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <Printer className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-bold text-sm text-foreground">
              {bn ? 'ক্লায়েন্ট-রেডি A4 ক্লিনিক্যাল রিপোর্ট ও প্রেসক্রিপশন' : 'Client-Ready Printable A4 Clinical Report'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {bn ? 'বাংলা ও ইংরেজি ফন্ট সুবিন্যস্ত এবং এফোর পেজে প্রিন্টের জন্য অপ্টিমাইজড' : 'Formatted for crisp A4 portrait printing and instant PDF export'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl border bg-secondary/50 hover:bg-secondary text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Globe className="h-3.5 w-3.5 text-blue-500" />
            <span>{bn ? 'Report Language: English' : 'রিপোর্ট ভাষা: বাংলা'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none px-4 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition"
          >
            <Printer className="h-4 w-4" />
            <span>{bn ? 'প্রিন্ট / PDF ডাউনলোড' : 'Print / Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* Printable A4 Report Container */}
      <div className="print-container bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 border rounded-3xl p-6 sm:p-10 max-w-4xl mx-auto shadow-xl space-y-6 print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Clinic Letterhead */}
        <div className="border-b-2 border-emerald-600 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-lg">
                শু
              </div>
              <div>
                <h1 className="font-extrabold text-xl leading-tight text-slate-900 dark:text-white print:text-black">
                  {bn ? 'শুদ্ধ ক্লিনিক্যাল ফাংশনাল নিউট্রিশন সেন্টার' : 'SHUDDHO CLINICAL FUNCTIONAL NUTRITION'}
                </h1>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 print:text-emerald-700">
                  {bn ? 'সেন্টার ফর মেটাবলিক রিবুট ও এভিডেন্স-বেসড ফাংশনাল মেডিসিন' : 'Center for Metabolic Reboot & Evidence-Based Nutrition Practice'}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-600 mt-1">
              Gulshan-2 / Dhanmondi, Dhaka, Bangladesh | +880 1712-000000 | clinic@shuddhobd.com
            </p>
          </div>

          <div className="text-left sm:text-right text-xs">
            <div className="font-bold text-slate-900 dark:text-white print:text-black">
              {bn ? 'সিনিয়র ক্লিনিক্যাল ফাংশনাল নিউট্রিশনিস্ট' : 'Lead Clinical Functional Nutritionist'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-600">
              MSc (Food & Nutrition), Certified Functional Medicine Specialist
            </div>
            <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 print:bg-emerald-100 print:text-emerald-800 text-[10px] font-bold">
              100% DETERMINISTIC ZERO-AI PROTOCOL
            </div>
          </div>
        </div>

        {/* Patient Demographic Bar */}
        <div className="bg-slate-50 dark:bg-slate-900 print:bg-slate-100 border border-slate-200 dark:border-slate-800 print:border-slate-300 rounded-xl p-3 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <span className="text-slate-500 print:text-slate-600 block text-[10px]">{bn ? 'রোগীর নাম:' : 'Patient Name:'}</span>
            <strong className="text-slate-900 dark:text-white print:text-black font-bold">{patient.name}</strong>
          </div>
          <div>
            <span className="text-slate-500 print:text-slate-600 block text-[10px]">{bn ? 'বয়স ও লিঙ্গ:' : 'Age & Gender:'}</span>
            <strong className="text-slate-900 dark:text-white print:text-black">
              {patient.age}y / {patient.gender === 'female' ? (bn ? 'মহিলা' : 'Female') : (bn ? 'পুরুষ' : 'Male')}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 print:text-slate-600 block text-[10px]">{bn ? 'তারিখ ও আইডি:' : 'Date & ID:'}</span>
            <strong className="text-slate-900 dark:text-white print:text-black">{patient.visit_date} ({patient.id})</strong>
          </div>
          <div>
            <span className="text-slate-500 print:text-slate-600 block text-[10px]">{bn ? 'বর্তমান ফেজ:' : 'Active Phase:'}</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 print:text-emerald-700">
              Phase {patient.current_phase} ({phaseInfo.duration_weeks})
            </span>
          </div>
        </div>

        {/* Anthropometrics & Functional Biomarkers Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          <div className="border rounded-xl p-3.5 space-y-2 bg-slate-50/50 dark:bg-slate-900/50 print:bg-slate-50">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 print:text-black flex items-center gap-1.5 border-b pb-1.5">
              <Activity className="h-4 w-4 text-emerald-600" />
              <span>{bn ? 'শারীরিক গঠন ও মেটাবলিক টার্গেট' : 'Anthropometrics & Caloric Target'}</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>{bn ? 'উচ্চতা:' : 'Height:'} <strong>{patient.height_cm} cm</strong></div>
              <div>{bn ? 'ওজন:' : 'Weight:'} <strong>{patient.weight_kg} kg</strong></div>
              <div>{bn ? 'বিএমআই (BMI):' : 'BMI:'} <strong>{patient.calculated.bmi} ({bn ? patient.calculated.bmi_category_bn : patient.calculated.bmi_category_en})</strong></div>
              <div>{bn ? 'কোমর (WHtR):' : 'WHtR:'} <strong>{patient.calculated.whtr} ({patient.calculated.whtr >= 0.6 ? (bn ? 'উচ্চ ভিসেরাল চর্বি' : 'High Risk') : (bn ? 'স্বাভাবিক' : 'Normal')})</strong></div>
              <div>{bn ? 'আদর্শ ওজন (IBW):' : 'Ideal BW:'} <strong>{patient.calculated.ibw_kg} kg</strong></div>
              <div>{bn ? 'এডজাস্টেড ওজন:' : 'Adjusted BW:'} <strong>{patient.calculated.adjusted_bw_kg} kg</strong></div>
            </div>
            <div className="pt-2 border-t flex justify-between items-baseline text-xs font-semibold">
              <span className="text-emerald-700 dark:text-emerald-400 print:text-emerald-800">
                {bn ? 'নিরাপদ দৈনিক ক্যালোরি:' : 'Target Calories:'} {patient.calculated.target_calories} kcal
              </span>
              <span className="text-slate-500 print:text-slate-600 text-[10px]">
                BMR Floor: {patient.calculated.bmr_safe_calorie_floor} kcal
              </span>
            </div>
            <div className="text-[10px] text-slate-500 print:text-slate-600">
              Protein: <strong>{patient.calculated.target_protein_g}g</strong> | Carbs: <strong>{patient.calculated.target_carbs_g}g</strong> | Healthy Fat: <strong>{patient.calculated.target_fat_g}g</strong>
            </div>
          </div>

          <div className="border rounded-xl p-3.5 space-y-2 bg-slate-50/50 dark:bg-slate-900/50 print:bg-slate-50">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 print:text-black flex items-center gap-1.5 border-b pb-1.5">
              <ShieldCheck className="h-4 w-4 text-rose-600" />
              <span>{bn ? 'ক্লিনিক্যাল কন্ডিশন ও ফাংশনাল ল্যাব ঝুঁকি' : 'Clinical Diagnoses & Functional Labs'}</span>
            </h3>
            <div className="flex flex-wrap gap-1">
              {patient.selected_conditions.map(c => (
                <span key={c} className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 print:bg-emerald-100 print:text-emerald-800 text-[10px] font-semibold">
                  {c.toUpperCase()}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              {patient.labs.homa_ir && (
                <div>HOMA-IR: <strong className="text-rose-600">{patient.labs.homa_ir}</strong> (Insulin Resistance)</div>
              )}
              {patient.labs.tg_hdl_ratio && (
                <div>TG/HDL: <strong className="text-rose-600">{patient.labs.tg_hdl_ratio}</strong> (Atherogenic Risk)</div>
              )}
              {patient.labs.hba1c && <div>HbA1c: <strong>{patient.labs.hba1c}%</strong></div>}
              {patient.labs.tsh && <div>TSH: <strong>{patient.labs.tsh} µIU/mL</strong></div>}
              {patient.labs.vitamin_d3 && <div>Vit D3: <strong>{patient.labs.vitamin_d3} ng/mL</strong></div>}
              {patient.labs.vitamin_b12 && <div>Vit B12: <strong>{patient.labs.vitamin_b12} pg/mL</strong></div>}
            </div>
            <div className="text-[10px] text-slate-500 print:text-slate-600 pt-1 border-t">
              Bristol Stool: <strong>Type {patient.gut_profile.bristol_stool_score}</strong> | Bloating: <strong>{patient.gut_profile.bloating}</strong> | Agni: <strong>{patient.gut_profile.digestive_fire_agni}</strong>
            </div>
          </div>

        </div>

        {/* 24-Hour Pill, Supplement & Hydration Timeline */}
        <div className="border rounded-xl p-4 space-y-3 bg-white dark:bg-slate-900/40 print:bg-white avoid-break">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 print:text-black flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>{bn ? '২৪ ঘণ্টার ওষুধ, সাপ্লিমেন্ট ও পানীয় সেবন সময়সূচি (Strict Separation Rules)' : '24-Hour Chronological Pill, Supplement & Meal Schedule'}</span>
            </h3>
            <span className="text-[10px] text-slate-500 print:text-slate-600">
              {bn ? 'লেভোথাইরক্সিন ও খনিজ ব্যবধান নিশ্চিত' : '4-Hour Thyroid Mineral Separation Active'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {dniResult.timeline.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-lg border bg-slate-50/70 dark:bg-slate-800/40 print:bg-slate-50 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[11px] bg-slate-200 dark:bg-slate-700 print:bg-slate-200 px-1.5 py-0.2 rounded">
                    {item.time}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 print:text-slate-700">
                    {bn ? item.title_bn : item.title_en}
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 print:text-slate-700 leading-tight">
                  {bn ? item.instructions_bn : item.instructions_en}
                </p>
                {item.verified_products && (
                  <div className="text-[9px] text-emerald-700 dark:text-emerald-400 print:text-emerald-700 font-semibold">
                    {item.verified_products.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Personalized Traffic Light Food Guide Summary */}
        <div className="border rounded-xl p-4 space-y-3 bg-white dark:bg-slate-900/40 print:bg-white avoid-break">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 print:text-black">
              {bn ? 'রোগ ও ওষুধের ভিত্তিতে ট্রাফিক লাইট খাদ্য গাইড (Personalized Food Guide)' : 'Personalized Traffic Light Food Guide'}
            </h3>
            <span className="text-[10px] text-slate-500 print:text-slate-600">
              RED &gt; YELLOW &gt; GREEN
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            
            <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 print:bg-emerald-50/60 space-y-1">
              <div className="font-bold text-emerald-800 dark:text-emerald-400 print:text-emerald-800 flex items-center gap-1 text-[11px]">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>{bn ? 'সবুজ (স্বাচ্ছন্দ্যে গ্রহণীয়):' : 'Green (Eat Freely):'}</span>
              </div>
              <p className="text-[10px] text-slate-700 dark:text-slate-300 print:text-slate-800 leading-relaxed">
                {trafficLight.green.slice(0, 15).map(f => bn ? f.name_bn : f.name_en).join(', ')}...
              </p>
            </div>

            <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20 print:bg-amber-50/60 space-y-1">
              <div className="font-bold text-amber-800 dark:text-amber-400 print:text-amber-800 flex items-center gap-1 text-[11px]">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{bn ? 'হলুদ (পরিমিত ও শর্তসাপেক্ষে):' : 'Yellow (Conditional):'}</span>
              </div>
              <p className="text-[10px] text-slate-700 dark:text-slate-300 print:text-slate-800 leading-relaxed">
                {trafficLight.yellow.slice(0, 12).map(f => bn ? f.name_bn : f.name_en).join(', ')}...
              </p>
            </div>

            <div className="p-2.5 rounded-lg border border-rose-500/30 bg-rose-50/60 dark:bg-rose-950/20 print:bg-rose-50/60 space-y-1">
              <div className="font-bold text-rose-800 dark:text-rose-400 print:text-rose-800 flex items-center gap-1 text-[11px]">
                <XCircle className="h-3.5 w-3.5" />
                <span>{bn ? 'লাল (সম্পূর্ণ বর্জনীয়):' : 'Red (Strictly Avoid):'}</span>
              </div>
              <p className="text-[10px] text-slate-700 dark:text-slate-300 print:text-slate-800 leading-relaxed">
                {trafficLight.red.slice(0, 14).map(f => bn ? f.name_bn : f.name_en).join(', ')}...
              </p>
            </div>

          </div>
        </div>

        {/* Page Break for Multi-page Clean Print */}
        <div className="page-break" />

        {/* Full Daily Diet Chart (Family-Pot & Raw Weights) */}
        <div className="border rounded-xl p-4 space-y-4 bg-white dark:bg-slate-900/40 print:bg-white avoid-break">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 print:text-black flex items-center gap-1.5">
              <Utensils className="h-4 w-4 text-emerald-600" />
              <span>{bn ? 'দৈনিক স্বয়ংক্রিয় ডায়েট চার্ট (কাঁচা ও রান্না করা পারিবারিক পাত্রের মাপ)' : 'Therapeutic Daily Meal Plan (Raw & Cooked Measures)'}</span>
            </h3>
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 print:text-emerald-700">
              Total: {dietChart.reduce((sum, m) => sum + m.meal_calories, 0)} kcal | P: {Math.round(dietChart.reduce((sum, m) => sum + m.meal_protein_g, 0))}g
            </span>
          </div>

          <div className="space-y-4">
            {dietChart.map(meal => (
              <div key={meal.id} className="border rounded-lg overflow-hidden text-xs">
                <div className="bg-slate-100 dark:bg-slate-800/60 print:bg-slate-100 p-2 font-bold flex justify-between items-center text-[11px]">
                  <span>{meal.target_time} - {bn ? meal.title_bn : meal.title_en}</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300 print:text-slate-700">
                    {meal.meal_calories} kcal | P: {meal.meal_protein_g}g | C: {meal.meal_carbs_g}g | F: {meal.meal_fat_g}g
                  </span>
                </div>

                <div className="p-2 space-y-1.5">
                  {meal.items.map(item => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800/40 pb-1.5 last:border-none last:pb-0 gap-1 text-[11px]">
                      <div>
                        <strong className="text-slate-900 dark:text-white print:text-black">
                          {bn ? item.food_name_bn : item.food_name_en}
                        </strong>
                        <span className="text-slate-500 print:text-slate-600 ml-1.5 text-[10px]">
                          ({bn ? item.prep_note_bn : item.prep_note_en})
                        </span>
                      </div>
                      <div className="text-right flex items-center gap-2 self-end sm:self-auto text-[10px]">
                        <span className="bg-slate-100 dark:bg-slate-800 print:bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                          Raw: {item.raw_weight_g}g
                        </span>
                        <span className="font-semibold text-emerald-800 dark:text-emerald-400 print:text-emerald-800">
                          {bn ? item.cooked_display_bn : item.cooked_display_en}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clinical Practice Rules for Bangladeshi Patients */}
        <div className="border border-slate-200 dark:border-slate-800 print:border-slate-300 rounded-xl p-3.5 bg-slate-50 dark:bg-slate-900/50 print:bg-slate-50 text-[11px] space-y-1.5 leading-relaxed avoid-break">
          <strong className="font-bold text-slate-800 dark:text-slate-200 print:text-black block text-xs">
            {bn ? 'রোগীর জন্য অবশ্য পালনীয় ক্লিনিক্যাল নিয়মাবলী:' : 'Essential Patient Guidelines & Cooking Instructions:'}
          </strong>
          <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300 print:text-slate-700 text-[10px]">
            <li>{bn ? 'রান্নায় কোনোভাবেই রিফাইন্ড সয়াবিন বা পাম তেল ব্যবহার করবেন না; খাঁটি ঘানিভাঙা সরিষার তেল (দৈনিক ১৫-২০ মিলি) অথবা খাঁটি দেশি ঘিয়ে রান্না করুন।' : 'Strictly avoid refined industrial seed oils. Use cold-pressed unrefined mustard oil (15-20 ml/day) or pure cow ghee.'}</li>
            <li>{bn ? 'খাবারের ফ্যান বা মাড় সম্পূর্ণ ঝরিয়ে ফেলুন এবং লাল চাল রান্নার পূর্বে ৩০ মিনিট ভিজিয়ে রাখুন।' : 'Discard rice starch gruel after boiling. Soak unpolished rice 30 mins prior to cooking.'}</li>
            <li>{bn ? 'ডাল রান্নার আগে অন্তত ৮-১২ ঘণ্টা পানিতে ভিজিয়ে রেখে পানি ফেলে দিয়ে রান্না করতে হবে (ফাইটেট হ্রাস পাবে)।' : 'Soak all legumes (dal) for 8-12 hours and discard soaking liquid to neutralize phytic acid.'}</li>
            <li>{bn ? 'প্রতিদিন অন্তত ৩.৫ লিটার কুসুম গরম পানি পান করুন; ভারী খাবারের মাঝে পানি পান না করে ৩০ মিনিট পূর্বে বা ৪৫ মিনিট পরে পান করুন।' : 'Consume minimum 3.5 L water daily; avoid drinking large volumes during meals to preserve digestive fire.'}</li>
          </ul>
        </div>

        {/* Nutritionist Signature & Disclaimer */}
        <div className="pt-6 border-t flex flex-col sm:flex-row justify-between items-end gap-6 text-xs avoid-break">
          <div className="text-[10px] text-slate-400 print:text-slate-500 max-w-sm">
            {bn 
              ? 'এই পরামর্শপত্র ১০০% বৈজ্ঞানিক ও ডিটারমিনিস্টিক রুলস ইঞ্জিনের সাহায্যে তৈরি। কোনো কৃত্রিম বুদ্ধিমত্তা (AI) বা অনির্দিষ্ট অ্যালগরিদম ব্যবহৃত হয়নি।' 
              : '100% deterministic clinical functional nutrition protocol. Generated strictly via evidence-based clinical rules engines.'}
          </div>

          <div className="text-center sm:text-right">
            <div className="h-10 border-b border-slate-400 border-dashed w-48 mb-1" />
            <div className="font-bold text-slate-900 dark:text-white print:text-black">
              {bn ? 'নিউট্রিশনিস্টের স্বাক্ষর ও সিল' : 'Clinical Nutritionist Signature'}
            </div>
            <div className="text-[10px] text-slate-500 print:text-slate-600">
              Shuddho Functional Nutrition Practice
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

