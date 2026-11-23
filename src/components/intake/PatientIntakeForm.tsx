'use client';

import React, { useState } from 'react';
import {
  User,
  Activity,
  Flame,
  Utensils,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Send,
  Loader2,
  Sparkles,
  Info,
} from 'lucide-react';
import { AssessmentInvitation } from '@/repositories/types';

interface PatientIntakeFormProps {
  invitation: AssessmentInvitation;
  patientName?: string;
  initialAge?: number;
  initialGender?: 'male' | 'female';
  onSubmit: (responses: Record<string, any>) => Promise<void>;
  isSubmitting?: boolean;
}

export const PatientIntakeForm: React.FC<PatientIntakeFormProps> = ({
  invitation,
  patientName = 'Valued Patient',
  initialAge = 35,
  initialGender = 'female',
  onSubmit,
  isSubmitting = false,
}) => {
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const bn = lang === 'bn';

  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 5;

  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Anthropometrics
    age: initialAge,
    gender: initialGender,
    height_cm: 160,
    weight_kg: 65,
    waist_cm: 80,
    sleep_hours: 7,
    activity_level: 'sedentary' as 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active',
    pregnancy_status: 'not_pregnant' as 'not_pregnant' | 'trimester_1' | 'trimester_2' | 'trimester_3' | 'lactating' | 'postpartum',
    menstrual_cycle: 'regular' as 'regular' | 'irregular' | 'menopausal' | 'pcos_suspected',
    pediatric_growth_concern: 'none' as 'none' | 'faltering_growth' | 'rapid_gain' | 'picky_eating',
    caregiver_meal_prep: 'fully_parental' as 'fully_parental' | 'partial_self' | 'school_canteen',

    // Step 2: Digestion & Elimination
    agni: 'samagni' as 'mandagni' | 'tikshnagni' | 'vishamagni' | 'samagni',
    bristol_stool: 4,
    bloating: 'none' as 'none' | 'mild' | 'moderate' | 'severe',
    bloating_timing: 'after_meals' as 'after_meals' | 'evening' | 'constant' | 'variable',
    bloating_triggers: [] as string[],
    acid_reflux: false,
    acid_reflux_frequency: 'occasional' as 'daily' | 'several_times_week' | 'occasional',
    acid_reflux_triggers: [] as string[],

    // Step 3: Diet & Lifestyle
    diet_type: 'omnivore' as 'omnivore' | 'vegetarian' | 'pescatarian',
    meal_structure: '3_meals' as '3_meals' | '3_meals_1_snack' | 'intermittent_fasting_16_8',
    fasting_interested: false,
    fasting_pattern: 'none' as 'none' | '14_10' | '16_8' | '20_4' | 'intermittent_24h',
    fasting_hypoglycemia_symptoms: [] as string[],
    water_liters: 2.0,
    tea_coffee_cups: 1,

    // Step 4: Medical History, Medications & Allergies
    selected_concerns: [] as string[],
    has_active_medications: false,
    active_medications_text: '',
    medication_timing: 'with_meals' as 'morning_empty_stomach' | 'with_meals' | 'bedtime' | 'variable',
    medication_side_effects: [] as string[],
    selected_allergies: [] as string[],
    other_allergies: '',

    // Step 5: Consent
    consentGiven: false,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleNext = () => {
    const errors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.age || formData.age < 5 || formData.age > 120) {
        errors.age = bn ? 'দয়া করে সঠিক বয়স লিখুন (৫-১২০)' : 'Please provide a valid age (5-120)';
      }
      if (!formData.height_cm || formData.height_cm < 50 || formData.height_cm > 250) {
        errors.height_cm = bn ? 'সঠিক উচ্চতা দিন (৫০-২৫০ সেমি)' : 'Please enter height (50-250 cm)';
      }
      if (!formData.weight_kg || formData.weight_kg < 20 || formData.weight_kg > 300) {
        errors.weight_kg = bn ? 'সঠিক ওজন দিন (২০-৩০০ কেজি)' : 'Please enter weight (20-300 kg)';
      }
      if (!formData.waist_cm || formData.waist_cm < 30 || formData.waist_cm > 250) {
        errors.waist_cm = bn ? 'সঠিক কোমরের মাপ দিন (৩০-২৫০ সেমি)' : 'Please enter waist circumference (30-250 cm)';
      }
    }

    if (currentStep === 5) {
      if (!formData.consentGiven) {
        errors.consent = bn ? 'এগিয়ে যেতে সম্মতি নিশ্চিত করুন' : 'You must accept the clinical declaration to submit';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    if (currentStep < totalSteps) {
      setCurrentStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(s => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consentGiven) {
      setFormErrors({ consent: bn ? 'সম্মতি প্রদান করা আবশ্যক' : 'Consent is required' });
      return;
    }

    const payload: Record<string, any> = {
      provenance: 'PATIENT_SELF_REPORTED',

      // Direct clinical metrics
      age: Number(formData.age),
      gender: formData.gender,
      height_cm: Number(formData.height_cm),
      weight_kg: Number(formData.weight_kg),
      waist_cm: Number(formData.waist_cm),
      sleep_hours: Number(formData.sleep_hours),
      activity_level: formData.activity_level,

      // Step 1 Adaptive: Women's health / Pediatric context
      pregnancy_lactation_status:
        formData.gender === 'female' && Number(formData.age) >= 18
          ? formData.pregnancy_status
          : undefined,
      menstrual_cycle:
        formData.gender === 'female' && Number(formData.age) >= 18
          ? formData.menstrual_cycle
          : undefined,
      pediatric_growth_concern:
        Number(formData.age) < 18 ? formData.pediatric_growth_concern : undefined,
      caregiver_meal_prep:
        Number(formData.age) < 18 ? formData.caregiver_meal_prep : undefined,

      // Gut & digestion
      digestive_fire_agni: formData.agni,
      bristol_stool_score: Number(formData.bristol_stool),
      bloating: formData.bloating,
      bloating_timing: formData.bloating !== 'none' ? formData.bloating_timing : undefined,
      bloating_triggers: formData.bloating !== 'none' ? formData.bloating_triggers : undefined,
      acid_reflux_hypoacidity: formData.acid_reflux,
      acid_reflux_frequency: formData.acid_reflux ? formData.acid_reflux_frequency : undefined,
      acid_reflux_triggers: formData.acid_reflux ? formData.acid_reflux_triggers : undefined,

      // Lifestyle
      dietary_preference: formData.diet_type,
      meal_structure: formData.meal_structure,
      fasting_interested: formData.fasting_interested,
      fasting_pattern: formData.fasting_interested ? formData.fasting_pattern : undefined,
      fasting_hypoglycemia_symptoms: formData.fasting_interested
        ? formData.fasting_hypoglycemia_symptoms
        : undefined,
      daily_water_liters: Number(formData.water_liters),
      tea_coffee_cups: Number(formData.tea_coffee_cups),

      // History & safety
      health_concerns: formData.selected_concerns,
      has_active_medications: formData.has_active_medications,
      reported_medications: formData.active_medications_text,
      medication_timing: formData.has_active_medications ? formData.medication_timing : undefined,
      medication_side_effects: formData.has_active_medications ? formData.medication_side_effects : undefined,
      reported_allergies: [
        ...formData.selected_allergies,
        ...(formData.other_allergies ? [formData.other_allergies.trim()] : []),
      ],

      // Metadata
      invitation_token: invitation.invitation_token,
      submitted_at_iso: new Date().toISOString(),
      patient_acknowledged_consent: true,
    };

    await onSubmit(payload);
  };

  const commonAllergens = [
    { id: 'dairy', en: 'Milk / Dairy', bn: 'দুধ / দুগ্ধজাত খাবার' },
    { id: 'egg', en: 'Eggs', bn: 'ডিম' },
    { id: 'peanut', en: 'Peanuts', bn: 'চীনাবাদাম' },
    { id: 'tree_nuts', en: 'Tree Nuts (Almond/Walnut)', bn: 'কাঠবাদাম / আখরোট' },
    { id: 'gluten', en: 'Wheat / Gluten', bn: 'গম / গ্লুটেন' },
    { id: 'soy', en: 'Soybeans', bn: 'সয়াবিন' },
    { id: 'fish', en: 'Fish', bn: 'মাছ' },
    { id: 'shellfish', en: 'Shellfish / Shrimp / Prawn', bn: 'চিংড়ি / কাঁকড়া' },
    { id: 'mustard', en: 'Mustard', bn: 'সরিষা' },
  ];

  const commonConcerns = [
    { id: 'weight_loss', en: 'Weight Loss / Body Fat', bn: 'ওজন নিয়ন্ত্রণ / মেদ কমানো' },
    { id: 'diabetes', en: 'Diabetes / Insulin Resistance', bn: 'ডায়াবেটিস / রক্তে উচ্চ শর্করা' },
    { id: 'fatty_liver', en: 'Fatty Liver (NAFLD)', bn: 'ফ্যাটি লিভার' },
    { id: 'hypertension', en: 'High Blood Pressure', bn: 'উচ্চ রক্তচাপ' },
    { id: 'gut_digestive', en: 'Gas, Bloating & Acidity', bn: 'গ্যাস, পেট ফাঁপা ও এসিডিটি' },
    { id: 'thyroid', en: 'Thyroid Imbalance', bn: 'থাইরয়েডের সমস্যা' },
    { id: 'pcos', en: 'PCOS / Hormonal Acne', bn: 'পিসিওএস / হরমোন ভারসাম্য' },
    { id: 'uric_acid', en: 'High Uric Acid / Joint Pain', bn: 'ইউরিক এসিড / বাতের ব্যথা' },
    { id: 'low_energy', en: 'Low Energy & Fatigue', bn: 'ক্লান্তি ও দুর্বলতা' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      {/* Header Bar */}
      <div className="max-w-3xl mx-auto flex justify-between items-center mb-6">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            শুদ্ধ
          </div>
          <div>
            <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight block">
              SHUDDHO CLINICAL
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">
              Patient Remote Intake
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setLang(l => (l === 'en' ? 'bn' : 'en'))}
          className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition shadow-xs"
        >
          {bn ? 'English' : 'বাংলায় দেখুন'}
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {/* Progress Bar & Stepper */}
        <div className="bg-slate-100/70 dark:bg-slate-800/40 p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {bn ? `ধাপ ${currentStep} / ${totalSteps}` : `Step ${currentStep} of ${totalSteps}`}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {currentStep === 1 && (bn ? 'শারীরিক পরিমাপ' : 'Body Measurements')}
              {currentStep === 2 && (bn ? 'হজম ও পেট' : 'Digestion & Gut')}
              {currentStep === 3 && (bn ? 'খাদ্যাভ্যাস' : 'Diet & Lifestyle')}
              {currentStep === 4 && (bn ? 'সমস্যা ও অ্যালার্জি' : 'Health & Allergies')}
              {currentStep === 5 && (bn ? 'যাচাই ও সম্মতি' : 'Review & Consent')}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full transition-all duration-300 ease-out rounded-full"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* STEP 1: Anthropometrics */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <User className="h-5 w-5" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {bn ? 'ব্যক্তিগত তথ্য ও শারীরিক মাপ' : 'Basic Anthropometrics & Lifestyle'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  {bn
                    ? 'আপনার সঠিক উচ্চতা ও বর্তমান ওজন দিন যাতে পুষ্টিবিদ সঠিক ক্যালোরি নির্ণয় করতে পারেন।'
                    : 'Provide your current physical measurements so your clinician can calculate precise energy expenditure.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Age */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {bn ? 'বয়স (বছর)' : 'Age (years)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 35"
                  />
                  {formErrors.age && <p className="text-xs text-rose-500 mt-1">{formErrors.age}</p>}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {bn ? 'লিঙ্গ' : 'Gender'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: 'female' })}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                        formData.gender === 'female'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {bn ? 'নারী (Female)' : 'Female'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: 'male' })}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                        formData.gender === 'male'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {bn ? 'পুরুষ (Male)' : 'Male'}
                    </button>
                  </div>
                </div>

                {/* Height */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {bn ? 'উচ্চতা (সেমি)' : 'Height (cm)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.height_cm}
                    onChange={e => setFormData({ ...formData, height_cm: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 165"
                  />
                  {formErrors.height_cm && <p className="text-xs text-rose-500 mt-1">{formErrors.height_cm}</p>}
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {bn ? 'বর্তমান ওজন (কেজি)' : 'Current Weight (kg)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight_kg}
                    onChange={e => setFormData({ ...formData, weight_kg: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 68.5"
                  />
                  {formErrors.weight_kg && <p className="text-xs text-rose-500 mt-1">{formErrors.weight_kg}</p>}
                </div>

                {/* Waist Circumference */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {bn ? 'কোমরের মাপ (সেমি / ইঞ্চি)' : 'Waist Circumference (cm)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.waist_cm}
                    onChange={e => setFormData({ ...formData, waist_cm: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 82"
                  />
                  {formErrors.waist_cm && <p className="text-xs text-rose-500 mt-1">{formErrors.waist_cm}</p>}
                </div>

                {/* Daily Sleep */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {bn ? 'দৈনিক গড় ঘুম (ঘণ্টা)' : 'Daily Sleep (hours/night)'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.sleep_hours}
                    onChange={e => setFormData({ ...formData, sleep_hours: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 7"
                  />
                </div>
              </div>

              {/* Activity Level */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {bn ? 'শারীরিক পরিশ্রমের মাত্রা (Activity Level)' : 'Daily Physical Activity Level'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'sedentary', labelEn: 'Sedentary (Desk job / minimal movement)', labelBn: 'বসে কাজ / শারীরিক পরিশ্রম কম' },
                    { id: 'lightly_active', labelEn: 'Lightly Active (1-3 days light exercise)', labelBn: 'হালকা পরিশ্রম / সপ্তাহে ১-৩ দিন হাঁটা' },
                    { id: 'moderately_active', labelEn: 'Moderately Active (3-5 days exercise)', labelBn: 'মাঝারি পরিশ্রম / নিয়মিত ব্যায়াম' },
                    { id: 'very_active', labelEn: 'Very Active (Heavy physical work/athlete)', labelBn: 'ভারী শারীরিক কাজ বা শরীরচর্চা' },
                  ].map(act => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, activity_level: act.id as any })}
                      className={`text-left p-3 rounded-xl border text-xs font-semibold transition ${
                        formData.activity_level === act.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 ring-1 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {bn ? act.labelBn : act.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Adaptive Section: Women's Health (Female & Age >= 18) */}
              {formData.gender === 'female' && Number(formData.age) >= 18 && (
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                      {bn ? 'নারী স্বাস্থ্য ও মাতৃত্ব সংক্রান্ত বিশেষ মূল্যায়ন' : "Women's Health & Maternal Screening"}
                    </h4>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {bn ? 'গর্ভাবস্থা বা স্তন্যদান অবস্থা (Maternal Status)' : 'Current Maternal / Pregnancy Status'}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'not_pregnant', en: 'Not Pregnant', bn: 'গর্ভবতী নন' },
                        { id: 'trimester_1', en: '1st Trimester (1-12w)', bn: '১ম ট্রাইমেস্টার (১-১২ সপ্তাহ)' },
                        { id: 'trimester_2', en: '2nd Trimester (13-27w)', bn: '২য় ট্রাইমেস্টার (১৩-২৭ সপ্তাহ)' },
                        { id: 'trimester_3', en: '3rd Trimester (28w+)', bn: '৩য় ট্রাইমেস্টার (২৮+ সপ্তাহ)' },
                        { id: 'lactating', en: 'Breastfeeding / Lactating', bn: 'স্তন্যদানকারী মা' },
                        { id: 'postpartum', en: 'Postpartum (<6 months)', bn: 'প্রসবোত্তর (৬ মাসের মধ্যে)' },
                      ].map(st => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, pregnancy_status: st.id as any })}
                          className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition ${
                            formData.pregnancy_status === st.id
                              ? 'border-emerald-600 bg-white text-emerald-800 dark:bg-slate-900 dark:text-emerald-300 ring-2 ring-emerald-500'
                              : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 hover:bg-white text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {bn ? st.bn : st.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {bn ? 'মাসিকের চক্র ও হরমোন অবস্থা (Menstrual Health)' : 'Menstrual Cycle / Hormonal Context'}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'regular', en: 'Regular (28-32d)', bn: 'নিয়মিত চক্র' },
                        { id: 'irregular', en: 'Irregular / Delayed', bn: 'অনিয়মিত / বিলম্বে' },
                        { id: 'pcos_suspected', en: 'PCOS / PCOD Diagnosed', bn: 'পিসিওএস / সিস্ট' },
                        { id: 'menopausal', en: 'Perimenopause / Menopause', bn: 'মেনোপজ' },
                      ].map(mc => (
                        <button
                          key={mc.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, menstrual_cycle: mc.id as any })}
                          className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition ${
                            formData.menstrual_cycle === mc.id
                              ? 'border-emerald-600 bg-white text-emerald-800 dark:bg-slate-900 dark:text-emerald-300 ring-2 ring-emerald-500'
                              : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 hover:bg-white text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {bn ? mc.bn : mc.en}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Adaptive Section: Pediatric Context (Age < 18) */}
              {Number(formData.age) < 18 && (
                <div className="bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-sky-600" />
                    <h4 className="text-xs font-bold text-sky-900 dark:text-sky-300 uppercase tracking-wider">
                      {bn ? 'শিশু ও কিশোর পুষ্টি মূল্যায়ন (Pediatric / Adolescent Growth)' : 'Pediatric / Adolescent Nutrition Screening'}
                    </h4>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {bn ? 'শারীরিক বৃদ্ধি সংক্রান্ত অগ্রাধিকার' : 'Growth & Development Observation'}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'none', en: 'Normal Growth Pace', bn: 'স্বাভাবিক বৃদ্ধি' },
                        { id: 'faltering_growth', en: 'Underweight / Slow Height', bn: 'ওজন বা উচ্চতা কম' },
                        { id: 'rapid_gain', en: 'Rapid Weight Gain', bn: 'দ্রুত ওজন বৃদ্ধি' },
                        { id: 'picky_eating', en: 'Picky Eater / Low Appetite', bn: 'খাবারে অনিহা / বায়না' },
                      ].map(pg => (
                        <button
                          key={pg.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, pediatric_growth_concern: pg.id as any })}
                          className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition ${
                            formData.pediatric_growth_concern === pg.id
                              ? 'border-sky-600 bg-white text-sky-800 dark:bg-slate-900 dark:text-sky-300 ring-2 ring-sky-500'
                              : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 hover:bg-white text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {bn ? pg.bn : pg.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {bn ? 'খাবার তৈরির দায়িত্ব ও পরিবেশ' : 'Caregiver Meal Context'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'fully_parental', en: 'Prepared by Parents', bn: 'পিতা-মাতা রান্না করেন' },
                        { id: 'partial_self', en: 'Self / Hosteller', bn: 'মেস / নিজে রান্না' },
                        { id: 'school_canteen', en: 'Frequent School Canteen', bn: 'ক্যান্টিনের খাবার' },
                      ].map(cg => (
                        <button
                          key={cg.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, caregiver_meal_prep: cg.id as any })}
                          className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition ${
                            formData.caregiver_meal_prep === cg.id
                              ? 'border-sky-600 bg-white text-sky-800 dark:bg-slate-900 dark:text-sky-300 ring-2 ring-sky-500'
                              : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 hover:bg-white text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {bn ? cg.bn : cg.en}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Digestion & Elimination (Agni & Gut) */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <Flame className="h-5 w-5" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {bn ? 'হজম ও পেট সংক্রান্ত মূল্যায়ন (Agni & Gut Health)' : 'Digestive Fire & Elimination'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  {bn
                    ? 'আয়ুর্বেদিক ও ফাংশনাল মেডিসিনের মূলভিত্তি হলো হজম ক্ষমতা। আপনার সঠিক অনুভূতি জানান।'
                    : 'Precision nutrition hinges on digestive capacity. Share how your stomach feels regularly.'}
                </p>
              </div>

              {/* Agni Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {bn ? 'আপনার স্বাভাবিক হজম শক্তি কেমন? (Digestive Fire / Agni)' : 'Which best describes your hunger and digestion pattern?'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'samagni',
                      titleEn: 'Samagni (Balanced & Regular)',
                      titleBn: 'সমাগ্নি (সুষম ও স্বাভাবিক)',
                      descEn: 'Hunger comes at regular times, food digests comfortably without distress.',
                      descBn: 'নির্দিষ্ট সময়ে স্বাভাবিক ক্ষুধা লাগে এবং সহজে খাবার হজম হয়।',
                    },
                    {
                      id: 'mandagni',
                      titleEn: 'Mandagni (Slow & Sluggish)',
                      titleBn: 'মন্দাগ্নি (ধীর ও ভারী লাগা)',
                      descEn: 'Low appetite, takes hours to digest, feeling heavy and sleepy after meals.',
                      descBn: 'ক্ষুধা কম লাগে, খাবার হজম হতে অনেক সময় নেয়, খাওয়ার পর অলস লাগে।',
                    },
                    {
                      id: 'tikshnagni',
                      titleEn: 'Tikshnagni (Sharp & Intense)',
                      titleBn: 'তীক্ষ্ণাগ্নি (তীব্র ক্ষুধা ও জ্বালাপোড়া)',
                      descEn: 'Intense sudden hunger, irritability if late, tendency to acidity or loose stool.',
                      descBn: 'খাবারের সময় দেরি হলে অসহ্য ক্ষুধা বা রাগ, বুকে জ্বালাপোড়া বা এসিডিটি।',
                    },
                    {
                      id: 'vishamagni',
                      titleEn: 'Vishamagni (Irregular & Variable)',
                      titleBn: 'বিষমাগ্নি (অনিয়মিত ক্ষুধা ও পেট ফাঁপা)',
                      descEn: 'Appetite fluctuates wildly; unpredictable bloating, gas and alternating stool.',
                      descBn: 'কখনও খুব ক্ষুধা কখনও একদম নেই, প্রায়ই পেট ফাঁপা, গ্যাস ও অনিয়মিত কোষ্ঠকাঠিন্য।',
                    },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, agni: item.id as any })}
                      className={`text-left p-3.5 rounded-2xl border transition ${
                        formData.agni === item.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 ring-2 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <h4 className="font-bold text-xs mb-1">{bn ? item.titleBn : item.titleEn}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                        {bn ? item.descBn : item.descEn}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bristol Stool Scale */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {bn ? 'মলত্যাগের স্বাভাবিক ধরন (Bristol Stool Scale: ১-৭)' : 'Typical Stool Consistency (Bristol Scale 1-7)'}
                </label>
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map(score => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setFormData({ ...formData, bristol_stool: score })}
                      className={`py-3 rounded-xl border text-center font-bold text-sm transition ${
                        formData.bristol_stool === score
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {formData.bristol_stool === 1 && (bn ? 'টাইপ ১: পৃথক শক্ত দলা (তীব্র কোষ্ঠকাঠিন্য)' : 'Type 1: Separate hard lumps (Severe constipation)')}
                    {formData.bristol_stool === 2 && (bn ? 'টাইপ ২: দলাযুক্ত সসেজ আকৃতি (হালকা কোষ্ঠকাঠিন্য)' : 'Type 2: Sausage-shaped, lumpy (Mild constipation)')}
                    {formData.bristol_stool === 3 && (bn ? 'টাইপ ৩: খাঁজযুক্ত নরম সসেজ (স্বাভাবিক)' : 'Type 3: Like sausage with cracks on surface (Normal)')}
                    {formData.bristol_stool === 4 && (bn ? 'টাইপ ৪: মসৃণ নরম সসেজ বা সাপের মতো (আদর্শ)' : 'Type 4: Smooth and soft snake-like (Optimal)')}
                    {formData.bristol_stool === 5 && (bn ? 'টাইপ ৫: সহজে বের হওয়া নরম টুকরা (ফাইবারের অভাব)' : 'Type 5: Soft blobs with clear-cut edges (Low fiber)')}
                    {formData.bristol_stool === 6 && (bn ? 'টাইপ ৬: নরম ঝাঁঝরা টুকরা (হালকা ডায়রিয়া)' : 'Type 6: Fluffy pieces with ragged edges (Mild diarrhea)')}
                    {formData.bristol_stool === 7 && (bn ? 'টাইপ ৭: সম্পূর্ণ পানির মতো তরল (তীব্র ডায়রিয়া)' : 'Type 7: Watery, no solid pieces (Diarrhea)')}
                  </span>
                </div>
              </div>

              {/* Bloating & Acid Reflux */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {bn ? 'খাওয়ার পর পেট ফাঁপা বা গ্যাস (Bloating)' : 'Post-Meal Bloating Severity'}
                  </label>
                  <select
                    value={formData.bloating}
                    onChange={e => setFormData({ ...formData, bloating: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="none">{bn ? 'একদম হয় না (None)' : 'None (No bloating)'}</option>
                    <option value="mild">{bn ? 'কখনও কখনও হালকা (Mild)' : 'Mild (Occasional)'}</option>
                    <option value="moderate">{bn ? 'নিয়মিত মাঝারি (Moderate)' : 'Moderate (Regularly distended)'}</option>
                    <option value="severe">{bn ? 'তীব্র ও কষ্টদায়ক (Severe)' : 'Severe (Painful distension)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {bn ? 'বুকে জ্বালাপোড়া বা এসিডিটি আছে?' : 'Frequent Acid Reflux / Heartburn?'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, acid_reflux: false })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        !formData.acid_reflux
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {bn ? 'না (No)' : 'No'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, acid_reflux: true })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        formData.acid_reflux
                          ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {bn ? 'হ্যাঁ (Yes)' : 'Yes'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Adaptive Bloating Details */}
              {formData.bloating !== 'none' && (
                <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-amber-600" />
                    {bn ? 'পেট ফাঁপার সময় ও সম্ভাব্য কারণ' : 'Bloating Timing & Suspected Triggers'}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {bn ? 'কখন বেশি অনুভূত হয়?' : 'Onset & Timing'}
                      </label>
                      <select
                        value={formData.bloating_timing}
                        onChange={e => setFormData({ ...formData, bloating_timing: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="after_meals">{bn ? 'খাওয়ার সাথে সাথে (৩০-৬০ মিনিট)' : 'Immediately post-meal (30-60m)'}</option>
                        <option value="evening">{bn ? 'বিকেলের দিকে বা রাতে' : 'Late afternoon / Evening'}</option>
                        <option value="constant">{bn ? 'সারাদিনই পেট ভারী থাকে' : 'Constant throughout day'}</option>
                        <option value="variable">{bn ? 'অনিয়মিত' : 'Intermittent / Variable'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {bn ? 'কোন খাবারে বেশি হয়?' : 'Suspected Trigger Foods'}
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'dairy', en: 'Milk/Dairy', bn: 'দুধ' },
                          { id: 'legumes', en: 'Lentils/Beans', bn: 'ডাল/ছোলা' },
                          { id: 'cruciferous', en: 'Cabbage/Cauli', bn: 'বাঁধাকপি/ফুলকপি' },
                          { id: 'raw_salad', en: 'Raw Salads', bn: 'কাঁচা সালাদ' },
                          { id: 'carbonated', en: 'Soft Drinks', bn: 'কোমল পানীয়' },
                        ].map(tr => {
                          const isSel = formData.bloating_triggers.includes(tr.id);
                          return (
                            <button
                              key={tr.id}
                              type="button"
                              onClick={() => {
                                const upd = isSel
                                  ? formData.bloating_triggers.filter(x => x !== tr.id)
                                  : [...formData.bloating_triggers, tr.id];
                                setFormData({ ...formData, bloating_triggers: upd });
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                                isSel
                                  ? 'border-amber-600 bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {bn ? tr.bn : tr.en}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Adaptive Acid Reflux Details */}
              {formData.acid_reflux && (
                <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                    {bn ? 'এসিডিটি ও বুক জ্বালাপোড়ার মাত্রা' : 'Reflux Frequency & Common Triggers'}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {bn ? 'কত ঘন ঘন হয়?' : 'Occurrence Frequency'}
                      </label>
                      <select
                        value={formData.acid_reflux_frequency}
                        onChange={e => setFormData({ ...formData, acid_reflux_frequency: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        <option value="daily">{bn ? 'প্রতিদিন প্রায়ই হয়' : 'Daily occurrence'}</option>
                        <option value="several_times_week">{bn ? 'সপ্তাহে কয়েকবার' : '2-3 times per week'}</option>
                        <option value="occasional">{bn ? 'মাঝে মাঝে ভারী খাবারের পর' : 'Occasional (post heavy meals)'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {bn ? 'কোন অবস্থায় বাড়ে?' : 'Trigger Conditions'}
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'spicy', en: 'Spicy/Oily', bn: 'ঝাল/তেলতেলে' },
                          { id: 'lying_down', en: 'Lying Down', bn: 'খাওয়ার পর শোয়া' },
                          { id: 'coffee_tea', en: 'Tea/Coffee', bn: 'চা/কফি' },
                          { id: 'empty_stomach', en: 'Empty Stomach', bn: 'খালি পেট' },
                        ].map(tr => {
                          const isSel = formData.acid_reflux_triggers.includes(tr.id);
                          return (
                            <button
                              key={tr.id}
                              type="button"
                              onClick={() => {
                                const upd = isSel
                                  ? formData.acid_reflux_triggers.filter(x => x !== tr.id)
                                  : [...formData.acid_reflux_triggers, tr.id];
                                setFormData({ ...formData, acid_reflux_triggers: upd });
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                                isSel
                                  ? 'border-rose-600 bg-rose-100 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {bn ? tr.bn : tr.en}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Dietary Patterns & Lifestyle */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <Utensils className="h-5 w-5" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {bn ? 'খাদ্যাভ্যাস ও পানি পানের পরিমাণ' : 'Dietary Pattern & Hydration'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  {bn
                    ? 'আপনার দৈনন্দিন খাবারের সময়সূচী ও খাদ্য নির্বাচনের অভ্যাস।'
                    : 'Tell us about your eating schedule and typical hydration routine.'}
                </p>
              </div>

              {/* Diet Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {bn ? 'খাদ্য পছন্দ (Dietary Preference)' : 'Primary Dietary Category'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'omnivore', en: 'All Foods (Meat & Fish)', bn: 'সব খাবার (মাছ/মাংসসহ)' },
                    { id: 'vegetarian', en: 'Strict Vegetarian', bn: 'নিরামিষাশী (শাকসবজি)' },
                    { id: 'pescatarian', en: 'Fish Only (No Meat)', bn: 'শুধু মাছ (মাংস ছাড়া)' },
                  ].map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, diet_type: d.id as any })}
                      className={`p-3 rounded-xl border text-xs font-semibold text-center transition ${
                        formData.diet_type === d.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 ring-1 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {bn ? d.bn : d.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meal Structure */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {bn ? 'দৈনিক খাবারের বিন্যাস' : 'Current Meal Pattern'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: '3_meals', en: '3 Regular Meals', bn: '৩ বেলা মূল খাবার' },
                    { id: '3_meals_1_snack', en: '3 Meals + 1 Snack', bn: '৩ বেলা খাবার + ১ বেলা স্ন্যাক্স' },
                    { id: 'intermittent_fasting_16_8', en: 'Intermittent Fasting (16:8)', bn: 'ইন্টারমিটেন্ট ফাস্টিং (১৬:৮)' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, meal_structure: m.id as any })}
                      className={`p-3 rounded-xl border text-xs font-semibold text-center transition ${
                        formData.meal_structure === m.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 ring-1 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {bn ? m.bn : m.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Adaptive Section: Fasting Experience */}
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {bn ? 'ফাস্টিং বা রোজা রাখার আগ্রহ / অভ্যাস আছে কি?' : 'Interested in or Practicing Intermittent Fasting?'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {bn ? 'ক্লিনিক্যাল নিরাপত্তার জন্য আপনার ফাস্টিং সহনশীলতা জানা প্রয়োজন।' : 'Helps our clinical engine evaluate metabolic flexibility and fasting safety.'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, fasting_interested: false })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        !formData.fasting_interested
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {bn ? 'না' : 'No'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, fasting_interested: true })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        formData.fasting_interested
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {bn ? 'হ্যাঁ' : 'Yes'}
                    </button>
                  </div>
                </div>

                {formData.fasting_interested && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {bn ? 'পছন্দের ফাস্টিং উইন্ডো' : 'Target / Current Fasting Schedule'}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: '14_10', label: '14:10 (Gentle)' },
                          { id: '16_8', label: '16:8 (Standard)' },
                          { id: '20_4', label: '20:4 (Warrior)' },
                          { id: 'intermittent_24h', label: '24h / Weekly' },
                        ].map(f => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, fasting_pattern: f.id as any })}
                            className={`p-2 rounded-xl border text-xs font-semibold text-center transition ${
                              formData.fasting_pattern === f.id
                                ? 'border-emerald-600 bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {bn ? 'উপবাসে কোনো অস্বাভাবিক উপসর্গ হয়? (রক্তে শর্করা হ্রাস লক্ষণ)' : 'Symptoms during fasting (Hypoglycemia checks)'}
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'none', en: 'No adverse symptoms', bn: 'কোনো সমস্যা হয় না' },
                          { id: 'dizziness', en: 'Dizziness / Lightheadedness', bn: 'মাথা ঘোরা' },
                          { id: 'shakiness', en: 'Shaking / Tremors', bn: 'হাত কাঁপা' },
                          { id: 'headache', en: 'Headache', bn: 'মাথাব্যথা' },
                          { id: 'extreme_hunger', en: 'Extreme Hunger / Irritability', bn: 'অতিরিক্ত ক্ষুধা/মেজাজ খিটখিটে' },
                        ].map(sym => {
                          const isSel = formData.fasting_hypoglycemia_symptoms.includes(sym.id);
                          return (
                            <button
                              key={sym.id}
                              type="button"
                              onClick={() => {
                                const upd = isSel
                                  ? formData.fasting_hypoglycemia_symptoms.filter(x => x !== sym.id)
                                  : [...formData.fasting_hypoglycemia_symptoms, sym.id];
                                setFormData({ ...formData, fasting_hypoglycemia_symptoms: upd });
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                                isSel
                                  ? 'border-emerald-600 bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {bn ? sym.bn : sym.en}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Water & Beverage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {bn ? 'দৈনিক পানি পান (লিটার)' : 'Daily Plain Water (liters)'}
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={formData.water_liters}
                    onChange={e => setFormData({ ...formData, water_liters: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 2.0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {bn ? 'চা বা কফি (কাপ/দিন)' : 'Tea / Coffee (cups per day)'}
                  </label>
                  <input
                    type="number"
                    value={formData.tea_coffee_cups}
                    onChange={e => setFormData({ ...formData, tea_coffee_cups: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Medical Concerns, Medications & Allergies */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <AlertTriangle className="h-5 w-5" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {bn ? 'স্বাস্থ্যগত উদ্বেগ, ওষুধ ও অ্যালার্জি' : 'Health Priorities, Medications & Allergies'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  {bn
                    ? 'আপনার সুরক্ষা আমাদের প্রথম অগ্রাধিকার। অ্যালার্জি ও চলমান ওষুধ সতর্কতার সাথে উল্লেখ করুন।'
                    : 'Clinical safety first. Disclose all diagnosed concerns, active medications, and food sensitivities.'}
                </p>
              </div>

              {/* Primary Concerns */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {bn ? 'আপনার প্রধান স্বাস্থ্যগত লক্ষ্য বা সমস্যা নির্বাচন করুন:' : 'Select your primary health concerns / goals:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {commonConcerns.map(item => {
                    const isSelected = formData.selected_concerns.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          const updated = isSelected
                            ? formData.selected_concerns.filter(x => x !== item.id)
                            : [...formData.selected_concerns, item.id];
                          setFormData({ ...formData, selected_concerns: updated });
                        }}
                        className={`text-left p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>{bn ? item.bn : item.en}</span>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Known Allergies */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {bn ? 'আপনার কি কোনো খাবারে এলার্জি বা তীব্র প্রতিক্রিয়া আছে?' : 'Do you have known food allergies or severe intolerances?'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {commonAllergens.map(item => {
                    const isSelected = formData.selected_allergies.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          const updated = isSelected
                            ? formData.selected_allergies.filter(x => x !== item.id)
                            : [...formData.selected_allergies, item.id];
                          setFormData({ ...formData, selected_allergies: updated });
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition ${
                          isSelected
                            ? 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 ring-1 ring-rose-500'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {bn ? item.bn : item.en}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2.5">
                  <input
                    type="text"
                    value={formData.other_allergies}
                    onChange={e => setFormData({ ...formData, other_allergies: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder={bn ? 'অন্যান্য অ্যালার্জি থাকলে এখানে লিখুন...' : 'Other allergies (e.g. pineapple, brinjal, mushrooms)...'}
                  />
                </div>
              </div>

              {/* Active Prescription Medications (Adaptive) */}
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {bn ? 'আপনি কি বর্তমানে কোনো প্রেসক্রিপশনের ওষুধ খাচ্ছেন?' : 'Are you currently taking prescription medications?'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {bn ? 'মেডিসিন-নিউট্রিয়েন্ট ইন্টারঅ্যাকশন ও পুষ্টি উপাদানের অপচয় রোধে জরুরি।' : 'Essential for checking drug-nutrient depletions and timing rules.'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, has_active_medications: false })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        !formData.has_active_medications
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {bn ? 'না' : 'No'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, has_active_medications: true })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        formData.has_active_medications
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {bn ? 'হ্যাঁ' : 'Yes'}
                    </button>
                  </div>
                </div>

                {formData.has_active_medications && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {bn ? 'ওষুধের নাম, ডোজ ও সেবনের সময়' : 'Medication Names, Dosages & Frequency'}
                      </label>
                      <textarea
                        rows={2}
                        value={formData.active_medications_text}
                        onChange={e => setFormData({ ...formData, active_medications_text: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder={
                          bn
                            ? 'উদাহরণ: মেটফর্মিন ৫০০ মিগ্রা (রাতে খাবারের পর), থাইরক্সিন ৫০ এমসিজি...'
                            : 'e.g., Metformin 500mg (dinner), Levothyroxine 50mcg (morning fasting)...'
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {bn ? 'সেবনের প্রধান সময়' : 'Typical Medication Timing'}
                        </label>
                        <select
                          value={formData.medication_timing}
                          onChange={e => setFormData({ ...formData, medication_timing: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="morning_empty_stomach">{bn ? 'সকালে খালি পেটে' : 'Morning Empty Stomach'}</option>
                          <option value="with_meals">{bn ? 'খাবারের সাথে বা পরপর' : 'With / After Meals'}</option>
                          <option value="bedtime">{bn ? 'রাতে ঘুমানোর আগে' : 'Bedtime'}</option>
                          <option value="variable">{bn ? 'বিভিন্ন সময়ে (একাধিক ওষুধ)' : 'Variable / Multiple Times'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {bn ? 'পার্শ্বপ্রতিক্রিয়া অনুভূত হয় কি?' : 'Experienced Side Effects'}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { id: 'none', en: 'None', bn: 'নেই' },
                            { id: 'nausea', en: 'Nausea / Acidity', bn: 'বমি বমি ভাব' },
                            { id: 'fatigue', en: 'Fatigue / Drowsy', bn: 'ক্লান্তি' },
                            { id: 'dizziness', en: 'Dizziness', bn: 'মাথা ঘোরা' },
                          ].map(se => {
                            const isSel = formData.medication_side_effects.includes(se.id);
                            return (
                              <button
                                key={se.id}
                                type="button"
                                onClick={() => {
                                  const upd = isSel
                                    ? formData.medication_side_effects.filter(x => x !== se.id)
                                    : [...formData.medication_side_effects, se.id];
                                  setFormData({ ...formData, medication_side_effects: upd });
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                                  isSel
                                    ? 'border-emerald-600 bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {bn ? se.bn : se.en}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Review & Consent */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <Sparkles className="h-5 w-5" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {bn ? 'চূড়ান্ত যাচাই ও সম্মতি' : 'Review Summary & Clinical Consent'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  {bn
                    ? 'আপনার দেওয়া তথ্যগুলো একনজরে দেখে নিন এবং নিচে টিক চিহ্ন দিয়ে সাবমিট করুন।'
                    : 'Review your self-reported inputs below before transmitting them to the clinical queue.'}
                </p>
              </div>

              {/* Summary Cards */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-slate-500 block">{bn ? 'বয়স / লিঙ্গ' : 'Age / Gender'}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formData.age}y • {formData.gender}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{bn ? 'উচ্চতা' : 'Height'}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formData.height_cm} cm</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{bn ? 'ওজন' : 'Weight'}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formData.weight_kg} kg</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{bn ? 'কোমরের মাপ' : 'Waist'}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formData.waist_cm} cm</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-slate-500 block">{bn ? 'হজম (অগ্নি)' : 'Agni (Digestion)'}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{formData.agni}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{bn ? 'ব্রিস্টল স্টুল' : 'Bristol Stool'}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Type {formData.bristol_stool}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{bn ? 'পেট ফাঁপা' : 'Bloating'}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{formData.bloating}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">{bn ? 'রিপোর্টকৃত অ্যালার্জি' : 'Reported Allergies'}</span>
                  {formData.selected_allergies.length > 0 || formData.other_allergies ? (
                    <div className="flex flex-wrap gap-1.5">
                      {formData.selected_allergies.map(a => (
                        <span key={a} className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-semibold text-[11px]">
                          {a}
                        </span>
                      ))}
                      {formData.other_allergies && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-semibold text-[11px]">
                          {formData.other_allergies}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      {bn ? 'কোনো অ্যালার্জি জানানো হয়নি' : 'None reported'}
                    </span>
                  )}
                </div>
              </div>

              {/* Patient Consent & Declaration */}
              <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consentGiven}
                    onChange={e => setFormData({ ...formData, consentGiven: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <span className="font-bold block text-slate-900 dark:text-white mb-0.5">
                      {bn ? 'রোগীর ঘোষণা ও তথ্য ব্যবহারের সম্মতি' : 'Patient Declaration & Clinical Data Consent'}
                    </span>
                    {bn
                      ? 'আমি ঘোষণা করছি যে উপরোক্ত সকল তথ্য সত্য ও নির্ভুল। আমি বুঝতে পারছি যে এটি একটি প্রাথমিক তথ্য সংগ্রহ এবং আমার পুষ্টিবিদ আমার সাথে আলোচনার মাধ্যমে এটি যাচাই করে প্রেসক্রিপশন চূড়ান্ত করবেন।'
                      : 'I hereby declare that the information provided is accurate to the best of my knowledge. I understand this self-reported assessment will be staged for clinical reconciliation and verified by my clinical nutritionist before finalizing my diet chart.'}
                  </div>
                </label>
                {formErrors.consent && <p className="text-xs text-rose-600 font-semibold mt-2">{formErrors.consent}</p>}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
              >
                <ChevronLeft className="h-4 w-4" />
                {bn ? 'পূর্ববর্তী' : 'Back'}
              </button>
            ) : (
              <div />
            )}

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-sm"
              >
                {bn ? 'পরবর্তী ধাপ' : 'Next Step'}
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !formData.consentGiven}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white transition shadow-sm ${
                  isSubmitting || !formData.consentGiven
                    ? 'bg-emerald-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {bn ? 'জমা দেওয়া হচ্ছে...' : 'Submitting to Queue...'}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {bn ? 'অ্যাসেসমেন্ট জমা দিন' : 'Submit Clinical Assessment'}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="max-w-3xl mx-auto text-center mt-6">
        <p className="text-[11px] text-slate-400 dark:text-slate-600 flex items-center justify-center gap-1.5">
          <Info className="h-3.5 w-3.5" />
          SHUDDHO Clinical Intelligence Platform • End-to-End Privacy • Feature U19
        </p>
      </div>
    </div>
  );
};
