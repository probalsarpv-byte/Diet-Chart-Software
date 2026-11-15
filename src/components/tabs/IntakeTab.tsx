'use client';

import React, { useState } from 'react';
import { usePractice } from '@/context/PracticeContext';
import { 
  User, 
  Scale, 
  HeartPulse, 
  ShieldAlert, 
  AlertTriangle, 
  Zap,
  Plus,
  X,
  Lock,
  Baby,
  Stethoscope
} from 'lucide-react';
import { ACTIVITY_FACTORS } from '@/engine/anthropometrics';
import { ActivityLevel, AgniType, PopulationGroup, BmrFloorStrategy } from '@/types';

export const IntakeTab: React.FC = () => {
  const { 
    patient, 
    updatePatient, 
    updateLabs, 
    updateGutProfile, 
    language,
    addConfirmedAllergy,
    removeConfirmedAllergy,
    addClinicianDisallowedFood,
    removeClinicianDisallowedFood
  } = usePractice();

  const { calculated, labs, gut_profile } = patient;
  const bn = language === 'bn';

  const [allergyInput, setAllergyInput] = useState('');
  const [restrictionInput, setRestrictionInput] = useState('');

  const handleAddAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (allergyInput.trim()) {
      addConfirmedAllergy(allergyInput.trim());
      setAllergyInput('');
    }
  };

  const handleAddRestriction = (e: React.FormEvent) => {
    e.preventDefault();
    if (restrictionInput.trim()) {
      addClinicianDisallowedFood(restrictionInput.trim());
      setRestrictionInput('');
    }
  };

  const commonAllergens = [
    { id: 'shrimp', bn: 'চিংড়ি (Shrimp)', en: 'Shrimp' },
    { id: 'egg', bn: 'ডিম (Egg)', en: 'Egg' },
    { id: 'peanut', bn: 'চীনাবাদাম (Peanut)', en: 'Peanut' },
    { id: 'gluten', bn: 'গ্লুটেন / গম (Gluten)', en: 'Gluten / Wheat' },
    { id: 'dairy', bn: 'দুধ / দুগ্ধজাত (Dairy)', en: 'Dairy / Cow Milk' },
    { id: 'soy', bn: 'সয়াবিন (Soy)', en: 'Soy' },
  ];

  return (
    <div className="space-y-6 pb-12">

      {/* Population Warning Banner (If triggered) */}
      {calculated.population_warning && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-amber-500">
              {bn ? 'ক্লিনিক্যাল পপুলেশন সতর্কতা' : 'Clinical Population Precaution'}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {calculated.population_warning}
            </p>
          </div>
        </div>
      )}
      
      {/* 1. Patient Demographics & Anthropometrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Form Inputs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Basic Demographic Card */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3 text-foreground font-semibold text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span>{bn ? 'রোগীর প্রাথমিক তথ্য ও জনসংখ্যা ক্যাটাগরি' : 'Patient Information & Population Group'}</span>
              </div>
              <span className="text-[11px] font-normal text-muted-foreground">ID: {patient.id}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'রোগীর পূর্ণ নাম' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={patient.name}
                  onChange={e => updatePatient({ name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="e.g. Mrs. Nasreen Akhter"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'বয়স (বছর)' : 'Age (Years)'}
                </label>
                <input
                  type="number"
                  value={patient.age || ''}
                  onChange={e => updatePatient({ age: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'লিঙ্গ' : 'Gender'}
                </label>
                <select
                  value={patient.gender}
                  onChange={e => updatePatient({ gender: e.target.value as 'male' | 'female' })}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="female">{bn ? 'মহিলা (Female)' : 'Female'}</option>
                  <option value="male">{bn ? 'পুরুষ (Male)' : 'Male'}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'জনসংখ্যা গ্রুপ (Population Group)' : 'Population Group'}
                </label>
                <select
                  value={patient.population_group || 'adult_standard'}
                  onChange={e => updatePatient({ population_group: e.target.value as PopulationGroup })}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="adult_standard">{bn ? 'প্রাপ্তবয়স্ক সাধারণ (Adult Standard)' : 'Adult Standard'}</option>
                  <option value="pediatric">{bn ? 'পেডিয়াট্রিক / শিশু (<১০)' : 'Pediatric (<10y)'}</option>
                  <option value="adolescent">{bn ? 'কিশোর-কিশোরী (Adolescent 10-19y)' : 'Adolescent (10-19y)'}</option>
                  <option value="pregnancy">{bn ? 'গর্ভকালীন পুষ্টি (Pregnancy)' : 'Pregnancy'}</option>
                  <option value="lactation">{bn ? 'স্তন্যদানকারী মা (Lactation)' : 'Lactation'}</option>
                  <option value="geriatric">{bn ? 'বার্ধক্যকালীন পুষ্টি (Geriatric >65y)' : 'Geriatric (>65y)'}</option>
                  <option value="oncology">{bn ? 'অনকোলজি / ক্যান্সার পুষ্টি (Oncology)' : 'Oncology / Cancer'}</option>
                  <option value="renal">{bn ? 'রেনাল / কিডনি পুষ্টি (Renal)' : 'Renal / Nephrology'}</option>
                  <option value="malnutrition_risk">{bn ? 'ম্যালনিউট্রিশন ঝুঁকি / অপুষ্টি' : 'Malnutrition Risk / Underweight'}</option>
                </select>
              </div>

              {/* Multi-Pathway Clinical Categories */}
              <div className="col-span-full border-t pt-3 mt-2">
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {bn ? 'ক্লিনিক্যাল পাথওয়ে ও বিশেষায়িত বিভাগ (Clinical Pathways - Multi-Select)' : 'Clinical Pathways & Care Categories (Multi-Select)'}
                </label>
                <p className="text-[11px] text-muted-foreground mb-2">
                  {bn ? 'একক রোগী একই সাথে একাধিক ক্লিনিক্যাল ক্যাটাগরির অন্তর্ভুক্ত হতে পারেন।' : 'A patient may belong to multiple specialized clinical categories simultaneously.'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'metabolic', label_en: 'Metabolic & Glycemic', label_bn: 'মেটাবলিক ও ডায়াবেটিস' },
                    { id: 'underweight_restoration', label_en: 'Underweight Restoration', label_bn: 'ওজন পুনরুদ্ধার ও পুষ্টি' },
                    { id: 'oncology', label_en: 'Oncology / Cachexia', label_bn: 'ক্যান্সার ও ক্যাশেক্সিয়া' },
                    { id: 'renal', label_en: 'Renal / Dialysis', label_bn: 'কিডনি ও ডায়ালাইসিস' },
                    { id: 'cardiovascular', label_en: 'Cardiovascular / HTN', label_bn: 'হৃদরোগ ও উচ্চ রক্তচাপ' },
                    { id: 'gastrointestinal_hepatic', label_en: 'GI & Hepatic', label_bn: 'পরিপাকতন্ত্র ও লিভার' },
                    { id: 'surgical_postoperative', label_en: 'Surgical / Post-Op', label_bn: 'সার্জারি ও পোস্ট-অপারেটিভ' },
                    { id: 'critical_care_specialized_support', label_en: 'Specialized Nutrition Support', label_bn: 'বিশেষায়িত পুষ্টি সাপোর্ট' },
                    { id: 'other_multimorbidity', label_en: 'Complex Multimorbidity', label_bn: 'জটিল বহুমুখী রোগ' },
                  ].map(pw => {
                    const active = (patient.clinical_pathways || []).includes(pw.id as any);
                    return (
                      <button
                        key={pw.id}
                        type="button"
                        onClick={() => {
                          const current = patient.clinical_pathways || [];
                          const updated = active 
                            ? current.filter(x => x !== pw.id)
                            : [...current, pw.id as any];
                          updatePatient({ clinical_pathways: updated });
                        }}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                          active 
                            ? 'bg-primary text-primary-foreground border-primary font-medium shadow-sm' 
                            : 'bg-muted/40 text-muted-foreground hover:bg-muted border-border'
                        }`}
                      >
                        {bn ? pw.label_bn : pw.label_en}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hospital Feeding Route */}
              <div className="col-span-full border-t pt-3 mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    {bn ? 'খাওয়ার মাধ্যম / ফিডিং রুট (Hospital Feeding Route)' : 'Hospital Feeding Route'}
                  </label>
                  <select
                    value={patient.feeding_status?.route || 'oral_standard'}
                    onChange={e => {
                      const route = e.target.value as any;
                      const isNpo = route === 'npo_nil_per_os';
                      const isTube = route.startsWith('enteral') || route.startsWith('parenteral');
                      updatePatient({
                        feeding_status: {
                          ...(patient.feeding_status || { oral_intake_permitted: true, requires_specialist_support: false }),
                          route,
                          oral_intake_permitted: !isNpo && !isTube,
                          requires_specialist_support: isTube
                        }
                      });
                    }}
                    className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="oral_standard">{bn ? 'মুখের সাধারণ খাবার (Standard Oral Diet)' : 'Standard Oral Diet'}</option>
                    <option value="oral_nutritional_supplements">{bn ? 'ওরাল নিউট্রিশনাল সাপ্লিমেন্ট যুক্ত (Oral Supplements)' : 'Oral Diet + ONS'}</option>
                    <option value="modified_texture_soft">{bn ? 'নরম খাবার / সফট ডায়েট (IDDSI Level 6 Soft)' : 'Soft & Bite-Sized (IDDSI 6)'}</option>
                    <option value="modified_texture_pureed">{bn ? 'পিউরি / ব্লেন্ডারাইজড ডায়েট (IDDSI Level 4 Pureed)' : 'Pureed (IDDSI 4)'}</option>
                    <option value="enteral_tube_nasogastric">{bn ? 'এনজি টিউব / রাইলস টিউব (NG Tube Feeding)' : 'NG Tube Feeding'}</option>
                    <option value="enteral_tube_peg_pej">{bn ? 'পেগ টিউব / জেজুনোস্টমি (PEG / PEJ Tube)' : 'PEG / PEJ Tube'}</option>
                    <option value="parenteral_total_tpn">{bn ? 'শিরাপথে সম্পূর্ণ পুষ্টি (Total Parenteral TPN)' : 'Total Parenteral (TPN)'}</option>
                    <option value="npo_nil_per_os">{bn ? 'এনপিও / মুখে খাবার সম্পূর্ণ নিষেধ (NPO - Nil Per Os)' : 'NPO (Nil Per Os)'}</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end gap-1.5 pb-1">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(patient.feeding_status?.swallowing_difficulty_dysphagia)}
                      onChange={e => updatePatient({
                        feeding_status: {
                          ...(patient.feeding_status || { route: 'oral_standard', oral_intake_permitted: true, requires_specialist_support: false }),
                          swallowing_difficulty_dysphagia: e.target.checked
                        }
                      })}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span>{bn ? 'গিলতে সমস্যা / ডিসফেজিয়া (Dysphagia)' : 'Swallowing Impairment / Dysphagia'}</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(patient.feeding_status?.aspiration_risk)}
                      onChange={e => updatePatient({
                        feeding_status: {
                          ...(patient.feeding_status || { route: 'oral_standard', oral_intake_permitted: true, requires_specialist_support: false }),
                          aspiration_risk: e.target.checked
                        }
                      })}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span>{bn ? 'খাবার ফুসফুসে প্রবেশের ঝুঁকি (Aspiration Risk)' : 'Choking / Aspiration Risk'}</span>
                  </label>
                </div>
              </div>

              {patient.population_group === 'pregnancy' && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    {bn ? 'গর্ভকালীন ট্রাইমেস্টার' : 'Pregnancy Trimester'}
                  </label>
                  <select
                    value={patient.trimester || 1}
                    onChange={e => updatePatient({ trimester: Number(e.target.value) as 1 | 2 | 3 })}
                    className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value={1}>{bn ? '১ম ট্রাইমেস্টার (সপ্তাহ ১-১২: +০ kcal)' : '1st Trimester (+0 kcal)'}</option>
                    <option value={2}>{bn ? '২য় ট্রাইমেস্টার (সপ্তাহ ১৩-২৬: +৩৪০ kcal)' : '2nd Trimester (+340 kcal)'}</option>
                    <option value={3}>{bn ? '৩য় ট্রাইমেস্টার (সপ্তাহ ২৭-৪০: +৪৫২ kcal)' : '3rd Trimester (+452 kcal)'}</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'মোবাইল নম্বর' : 'Phone'}
                </label>
                <input
                  type="text"
                  value={patient.phone}
                  onChange={e => updatePatient({ phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="017xxxxxxxx"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'ভিজিটের তারিখ' : 'Visit Date'}
                </label>
                <input
                  type="date"
                  value={patient.visit_date}
                  onChange={e => updatePatient({ visit_date: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'বর্তমান ফেজ' : 'Care Phase'}
                </label>
                <select
                  value={patient.current_phase}
                  onChange={e => updatePatient({ current_phase: Number(e.target.value) as 1 | 2 | 3 | 4 })}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value={1}>{bn ? 'Phase 1: গাট রিসেট ও এলিমিনেশন' : 'Phase 1: Gut Reset'}</option>
                  <option value={2}>{bn ? 'Phase 2: মেটাবলিক রিবিল্ড' : 'Phase 2: Metabolic Rebuild'}</option>
                  <option value={3}>{bn ? 'Phase 3: খাদ্য পুনঃপ্রবর্তন' : 'Phase 3: Reintroduction'}</option>
                  <option value={4}>{bn ? 'Phase 4: লাইফস্টাইল রক্ষণাবেক্ষণ' : 'Phase 4: Maintenance'}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'ক্যালোরি ফ্লোর পলিসি' : 'BMR Floor Strategy'}
                </label>
                <select
                  value={patient.bmr_floor_strategy || 'clamped_to_bmr'}
                  onChange={e => updatePatient({ bmr_floor_strategy: e.target.value as BmrFloorStrategy })}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="clamped_to_bmr">{bn ? 'BMR এ আবদ্ধ (স্বাভাবিক ও নিরাপদ)' : 'Clamped to BMR (Safe standard)'}</option>
                  <option value="clinician_custom">{bn ? 'চিকিৎসকের কাস্টম ফ্লোর' : 'Clinician Custom Floor'}</option>
                  <option value="unrestricted_clinical_guidance">{bn ? 'ক্লিনিক্যাল গাইডেন্স (মুক্ত ঘাটতি)' : 'Clinical Guidance (Non-clamped)'}</option>
                </select>
              </div>

              {patient.bmr_floor_strategy === 'clinician_custom' && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    {bn ? 'কাস্টম ফ্লোর (kcal)' : 'Custom Calorie Floor'}
                  </label>
                  <input
                    type="number"
                    value={patient.custom_calorie_floor || ''}
                    onChange={e => updatePatient({ custom_calorie_floor: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="e.g. 1100"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Anthropometrics Input Card */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Scale className="h-4 w-4 text-primary" />
                <span>{bn ? 'অ্যানথ্রোপোমেট্রিক্স ও শারীরিক পরিমাপ' : 'Anthropometrics & Measurements'}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {bn ? 'Mifflin-St Jeor & Devine সমীকরণ' : 'Mifflin-St Jeor & Devine Equation'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'উচ্চতা (সেমি)' : 'Height (cm)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={patient.height_cm || ''}
                    onChange={e => updatePatient({ height_cm: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                    {Math.floor(patient.height_cm / 30.48)}&apos;{Math.round((patient.height_cm % 30.48) / 2.54)}&quot;
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'বর্তমান ওজন (কেজি)' : 'Current Weight (kg)'}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={patient.weight_kg || ''}
                  onChange={e => updatePatient({ weight_kg: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'কোমরের মাপ (সেমি)' : 'Waist Circumference (cm)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={patient.waist_cm || ''}
                    onChange={e => updatePatient({ waist_cm: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                    ~{Math.round(patient.waist_cm / 2.54)} inch
                  </span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'দৈনিক শারীরিক কার্যকলাপের স্তর (Physical Activity)' : 'Activity Level'}
                </label>
                <select
                  value={patient.activity_level}
                  onChange={e => updatePatient({ activity_level: e.target.value as ActivityLevel })}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {Object.entries(ACTIVITY_FACTORS).map(([key, item]) => (
                    <option key={key} value={key}>
                      {bn ? item.label_bn : item.label_en} ({item.factor}x)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'দৈনিক ঘুম (ঘণ্টা)' : 'Daily Sleep (Hours)'}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={patient.sleep_hours || ''}
                  onChange={e => updatePatient({ sleep_hours: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>

          {/* Confirmed Allergies & Clinician Direct Exclusions Card */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-3 text-foreground font-semibold text-sm">
              <Lock className="h-4 w-4 text-rose-500" />
              <span>{bn ? 'নিশ্চিত অ্যালার্জি ও চিকিৎসকের ব্যক্তিগত নিষেধাজ্ঞা' : 'Confirmed Allergies & Direct Clinician Restrictions'}</span>
            </div>

            {/* Confirmed Allergies Sub-section */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground block">
                {bn ? '১. রোগীর নিশ্চিত অ্যালার্জি (Confirmed Allergies - সম্পূর্ণ লাল তালিকাভুক্ত হবে):' : '1. Confirmed Allergies (Non-overridable RED exclusion):'}
              </label>

              {/* Quick Select Allergen Chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {commonAllergens.map(alg => {
                  const isSelected = patient.confirmed_allergies.includes(alg.id);
                  return (
                    <button
                      key={alg.id}
                      type="button"
                      onClick={() => isSelected ? removeConfirmedAllergy(alg.id) : addConfirmedAllergy(alg.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                        isSelected 
                          ? 'bg-rose-500 text-white border-rose-600' 
                          : 'bg-background hover:bg-secondary text-muted-foreground'
                      }`}
                    >
                      {bn ? alg.bn : alg.en} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>

              {/* Custom Allergy Input */}
              <form onSubmit={handleAddAllergy} className="flex gap-2">
                <input
                  type="text"
                  value={allergyInput}
                  onChange={e => setAllergyInput(e.target.value)}
                  placeholder={bn ? "অন্যান্য নির্দিষ্ট অ্যালার্জি টাইপ করুন (যেমন: cashew, mustard)" : "Type other specific allergy..."}
                  className="flex-1 px-3 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium bg-rose-500 hover:bg-rose-600 text-white rounded-lg flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>{bn ? 'যোগ করুন' : 'Add'}</span>
                </button>
              </form>

              {/* Active Allergies List */}
              {patient.confirmed_allergies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {patient.confirmed_allergies.map(alg => (
                    <span key={alg} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/30">
                      <strong>{alg}</strong>
                      <button type="button" onClick={() => removeConfirmedAllergy(alg)} className="hover:text-rose-700">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Clinician Direct Exclusions Sub-section */}
            <div className="space-y-2 pt-3 border-t">
              <label className="text-xs font-medium text-foreground block">
                {bn ? '২. চিকিৎসকের নির্দিষ্ট খাবার নিষেধাজ্ঞা (Direct Clinician Exclusions):' : '2. Clinician Specific Disallowed Foods / Tags:'}
              </label>

              <form onSubmit={handleAddRestriction} className="flex gap-2">
                <input
                  type="text"
                  value={restrictionInput}
                  onChange={e => setRestrictionInput(e.target.value)}
                  placeholder={bn ? "খাবারের নাম বা ট্যাগ (যেমন: beef, high_oxalate)" : "Enter food name or tag to restrict..."}
                  className="flex-1 px-3 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>{bn ? 'নিষেধাজ্ঞা যোগ' : 'Exclude'}</span>
                </button>
              </form>

              {patient.clinician_disallowed_foods.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {patient.clinician_disallowed_foods.map(item => (
                    <span key={item} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                      <span>{item}</span>
                      <button type="button" onClick={() => removeClinicianDisallowedFood(item)} className="hover:text-amber-700">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Right 1 Col: Live Calculated Cards & Safety Floor */}
        <div className="space-y-4">
          
          {/* BMR-Safe Calorie Floor Banner */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-500 font-semibold text-xs mb-1">
              <ShieldAlert className="h-4 w-4" />
              <span>{bn ? 'ক্যালোরি লক্ষ্য ও BMR ফ্লোর গ্যারান্টি' : 'Calorie Target & BMR Floor'}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {bn 
                ? 'থাইরয়েড ও মেটাবলিক গতি সচল রাখতে ক্যালোরি লক্ষ্য কখনই ঝুঁকিপূর্ণভাবে নামবে না।' 
                : 'Deficit is bounded to prevent metabolic slowdown. Policy: ' + patient.bmr_floor_strategy}
            </p>
            <div className="flex items-baseline justify-between pt-2 border-t border-emerald-500/20">
              <span className="text-xs font-medium">{bn ? 'নিরাপদ দৈনিক ক্যালোরি:' : 'Target Intake:'}</span>
              <span className="text-lg font-bold text-emerald-500">{calculated.target_calories} kcal</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 text-right">
              Floor: {calculated.bmr_safe_calorie_floor} kcal
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border rounded-xl p-3">
              <div className="text-[11px] text-muted-foreground">{bn ? 'বিএমআই (BMI)' : 'BMI'}</div>
              <div className="text-xl font-bold mt-0.5">{calculated.bmi}</div>
              <div className="text-[10px] text-amber-500 font-medium truncate">
                {bn ? calculated.bmi_category_bn : calculated.bmi_category_en}
              </div>
            </div>

            <div className="bg-card border rounded-xl p-3">
              <div className="text-[11px] text-muted-foreground">{bn ? 'কোমর-উচ্চতা অনুপাত (WHtR)' : 'WHtR Ratio'}</div>
              <div className="text-xl font-bold mt-0.5">{calculated.whtr}</div>
              <div className={`text-[10px] font-medium truncate ${calculated.whtr >= 0.6 ? 'text-rose-500' : 'text-amber-500'}`}>
                {calculated.whtr >= 0.6 ? (bn ? 'ভিসেরাল ফ্যাট ঝুঁকি' : 'High Visceral Risk') : (bn ? 'স্বাভাবিক' : 'Normal')}
              </div>
            </div>

            <div className="bg-card border rounded-xl p-3">
              <div className="text-[11px] text-muted-foreground">{bn ? 'আদর্শ ওজন (IBW)' : 'Ideal BW (Devine)'}</div>
              <div className="text-lg font-bold mt-0.5">{calculated.ibw_kg} kg</div>
              <div className="text-[10px] text-muted-foreground">
                {bn ? `এডজাস্টেড: ${calculated.adjusted_bw_kg}kg` : `Adjusted: ${calculated.adjusted_bw_kg}kg`}
              </div>
            </div>

            <div className="bg-card border rounded-xl p-3">
              <div className="text-[11px] text-muted-foreground">{bn ? 'বেসাল মেটাবলিজম (BMR)' : 'Basal BMR'}</div>
              <div className="text-lg font-bold mt-0.5">{calculated.bmr} kcal</div>
              <div className="text-[10px] text-muted-foreground">
                {bn ? `টিডিইই: ${calculated.tdee} kcal` : `TDEE: ${calculated.tdee} kcal`}
              </div>
            </div>
          </div>

          {/* Target Macro Breakdown */}
          <div className="bg-card border rounded-xl p-4 space-y-2.5">
            <div className="text-xs font-semibold flex justify-between items-center">
              <span>{bn ? 'টার্গেট ম্যাক্রোনিউট্রিয়েন্ট বিভাজন' : 'Target Macronutrient Breakdown'}</span>
              <span className="text-[10px] text-muted-foreground font-normal">{calculated.protein_ratio_used}</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-emerald-500 font-medium">{bn ? 'প্রোটিন (Protein):' : 'Protein:'}</span>
                <span className="font-semibold">{calculated.target_protein_g} gm ({Math.round((calculated.target_protein_g * 4 / Math.max(1, calculated.target_calories)) * 100)}%)</span>
              </div>
              <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${Math.round((calculated.target_protein_g * 4 / Math.max(1, calculated.target_calories)) * 100)}%` }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-blue-500 font-medium">{bn ? 'শর্করা (Complex Carbs):' : 'Carbohydrates:'}</span>
                <span className="font-semibold">{calculated.target_carbs_g} gm ({Math.round((calculated.target_carbs_g * 4 / Math.max(1, calculated.target_calories)) * 100)}%)</span>
              </div>
              <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full" style={{ width: `${Math.round((calculated.target_carbs_g * 4 / Math.max(1, calculated.target_calories)) * 100)}%` }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-amber-500 font-medium">{bn ? 'স্বাস্থ্যকর চর্বি (Healthy Fat):' : 'Healthy Fats:'}</span>
                <span className="font-semibold">{calculated.target_fat_g} gm ({Math.round((calculated.target_fat_g * 9 / Math.max(1, calculated.target_calories)) * 100)}%)</span>
              </div>
              <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: `${Math.round((calculated.target_fat_g * 9 / Math.max(1, calculated.target_calories)) * 100)}%` }} />
              </div>
            </div>

            <div className="pt-2 text-[10px] text-muted-foreground border-t">
              {bn ? 'দ্রষ্টব্য: সমস্ত শক্তির হিসাব গাণিতিক প্রাক্কলন (Mifflin-St Jeor), প্রত্যক্ষ ক্যালোরিমেট্রি নয়।' : 'Note: Values are calculated estimates, not direct calorimetry.'}
            </div>
          </div>

        </div>

      </div>

      {/* 2. Functional Lab Markers Analyzer */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <HeartPulse className="h-4 w-4 text-rose-500" />
            <span>{bn ? 'ফাংশনাল ল্যাব মার্কার ও মেটাবলিক রিস্ক অ্যানালাইজার' : 'Functional Lab Biomarkers & Risk Analyzer'}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {bn ? 'অপটিমাল ফাংশনাল টার্গেট (Functional Medicine Ranges)' : 'Evaluated against Functional Medicine Optimal Targets'}
          </span>
        </div>

        {/* Lab Inputs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Fasting Glucose (mg/dL)
            </label>
            <input
              type="number"
              value={labs.fasting_glucose || ''}
              onChange={e => updateLabs({ fasting_glucose: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 118"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Fasting Insulin (µIU/mL)
            </label>
            <input
              type="number"
              step="0.5"
              value={labs.fasting_insulin || ''}
              onChange={e => updateLabs({ fasting_insulin: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 16"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              HbA1c (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={labs.hba1c || ''}
              onChange={e => updateLabs({ hba1c: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 6.8"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Triglycerides (mg/dL)
            </label>
            <input
              type="number"
              value={labs.triglycerides || ''}
              onChange={e => updateLabs({ triglycerides: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 220"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              HDL Cholesterol (mg/dL)
            </label>
            <input
              type="number"
              value={labs.hdl || ''}
              onChange={e => updateLabs({ hdl: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 38"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              TSH (µIU/mL)
            </label>
            <input
              type="number"
              step="0.1"
              value={labs.tsh || ''}
              onChange={e => updateLabs({ tsh: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 3.8"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Vitamin D3 (ng/mL)
            </label>
            <input
              type="number"
              value={labs.vitamin_d3 || ''}
              onChange={e => updateLabs({ vitamin_d3: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 18"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Vitamin B12 (pg/mL)
            </label>
            <input
              type="number"
              value={labs.vitamin_b12 || ''}
              onChange={e => updateLabs({ vitamin_b12: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 240"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Serum Uric Acid (mg/dL)
            </label>
            <input
              type="number"
              step="0.1"
              value={labs.uric_acid || ''}
              onChange={e => updateLabs({ uric_acid: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 6.8"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              ALT / SGPT (U/L)
            </label>
            <input
              type="number"
              value={labs.alt || ''}
              onChange={e => updateLabs({ alt: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 38"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Ferritin (ng/mL)
            </label>
            <input
              type="number"
              value={labs.ferritin || ''}
              onChange={e => updateLabs({ ferritin: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 35"
            />
          </div>
        </div>

        {/* Auto Calculated Ratios (HOMA-IR & TG/HDL) Highlight Box */}
        {(labs.homa_ir !== undefined || labs.tg_hdl_ratio !== undefined) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t">
            {labs.homa_ir !== undefined && (
              <div className="p-3.5 rounded-xl border bg-secondary/40 flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span>HOMA-IR (ইনসুলিন রেজিস্ট্যান্স ইনডেক্স):</span>
                    <span className="text-sm font-bold text-rose-500">{labs.homa_ir}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {bn ? labs.homa_ir_status_bn : labs.homa_ir_status_en}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {bn ? 'ফর্মুলা: (Fasting Glucose × Fasting Insulin) ÷ ৪০৫' : 'Formula: (Glucose × Insulin) ÷ 405'}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${labs.homa_ir >= 2.0 ? 'bg-rose-500/15 text-rose-500' : 'bg-emerald-500/15 text-emerald-500'}`}>
                  {labs.homa_ir >= 2.0 ? (bn ? 'উচ্চ প্রতিরোধ ঝুঁকি' : 'High Risk') : (bn ? 'স্বাভাবিক' : 'Optimal')}
                </span>
              </div>
            )}

            {labs.tg_hdl_ratio !== undefined && (
              <div className="p-3.5 rounded-xl border bg-secondary/40 flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span>TG / HDL Ratio (এথেরোজেনিক মার্কার):</span>
                    <span className="text-sm font-bold text-rose-500">{labs.tg_hdl_ratio}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {bn ? labs.tg_hdl_status_bn : labs.tg_hdl_status_en}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {bn ? 'আদর্শ মান: ১.৫ এর নিচে (ছোট ঘন এলডিএল ও ফ্যাটি লিভারের পূর্বাভাস)' : 'Optimal: < 1.5 (Surrogate for small dense LDL)'}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${labs.tg_hdl_ratio >= 3.0 ? 'bg-rose-500/15 text-rose-500' : 'bg-emerald-500/15 text-emerald-500'}`}>
                  {labs.tg_hdl_ratio >= 3.0 ? (bn ? 'উচ্চ ঝুঁকি' : 'High Risk') : (bn ? 'নিরাপদ' : 'Safe')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Detailed Flags Table */}
        {labs.lab_flags && labs.lab_flags.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold text-foreground">
              {bn ? 'ফাংশনাল ল্যাব ঝুঁকি সূচক ও ক্লিনিক্যাল দিকনির্দেশনা:' : 'Functional Biomarker Risk Analysis & Flags:'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {labs.lab_flags.map((flag, idx) => (
                <div key={idx} className="p-3 rounded-xl border bg-background/50 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      {flag.marker}
                      {flag.is_diagnostic_threshold && (
                        <span className="text-[9px] px-1 py-0.2 bg-rose-500 text-white rounded font-bold">DIAGNOSTIC</span>
                      )}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      flag.status === 'optimal' 
                        ? 'bg-emerald-500/15 text-emerald-500' 
                        : flag.status === 'borderline' 
                        ? 'bg-amber-500/15 text-amber-500' 
                        : 'bg-rose-500/15 text-rose-500'
                    }`}>
                      {flag.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>{bn ? 'প্রাপ্ত মান:' : 'Value:'} <strong className="text-foreground">{flag.value} {flag.unit}</strong></span>
                    <span>{bn ? 'আদর্শ লক্ষ্য:' : 'Optimal:'} <strong>{flag.optimal_range}</strong></span>
                  </div>
                  <div className="text-[11px] text-muted-foreground/90 pt-1 border-t">
                    {bn ? flag.insight_bn : flag.insight_en}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Gut Health & Ayurvedic Agni Profile */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b pb-3 text-foreground font-semibold text-sm">
          <Zap className="h-4 w-4 text-amber-500" />
          <span>{bn ? 'গাট হেলথ, হজম শক্তি (Agni) ও ব্রিস্টল স্টুল স্কেল' : 'Gut Health, Digestive Agni & Bristol Stool Scale'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          {/* Acid Reflux & Bloating */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                {bn ? 'পেট ফাঁপা ও গ্যাস (Bloating)' : 'Bloating Severity'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['none', 'mild', 'severe'] as const).map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => updateGutProfile({ bloating: b })}
                    className={`py-1.5 px-2 text-xs rounded-lg border font-medium transition ${
                      gut_profile.bloating === b 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-secondary/40 hover:bg-secondary text-muted-foreground'
                    }`}
                  >
                    {b === 'none' ? (bn ? 'নেই' : 'None') : b === 'mild' ? (bn ? 'মাঝারি' : 'Mild') : (bn ? 'তীব্র' : 'Severe')}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl border bg-secondary/30 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                <input
                  type="checkbox"
                  checked={gut_profile.acid_reflux_hypoacidity}
                  onChange={e => updateGutProfile({ acid_reflux_hypoacidity: e.target.checked })}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <span>{bn ? 'অম্লপিত্ত / হাইপোক্লোরহাইড্রিয়া (Hypoacidity)' : 'Acid Reflux / Hypoacidity / Long-term PPI'}</span>
              </label>
              <p className="text-[11px] text-muted-foreground leading-relaxed pl-6">
                {bn 
                  ? 'খাবার পর দীর্ঘক্ষণ পেট ভারী থাকা, টক ঢেকুর বা নিয়মিত পিপিআই সেবনের ইতিহাস নির্দেশ করে পাকস্থলীর স্বাভাবিক হাইড্রোক্লোরিক অ্যাসিড কমে গেছে।' 
                  : 'Postprandial heaviness or chronic PPI use heralds low gastric acid, necessitating pre-meal digestive priming.'}
              </p>
            </div>
          </div>

          {/* Digestive Agni Type */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              {bn ? 'পরিপাক শক্তি (Digestive Fire / Agni)' : 'Digestive Fire (Ayurvedic Agni)'}
            </label>
            <div className="space-y-2">
              {[
                { id: 'mandagni', bn: 'মন্দাগ্নি (Mandagni - ধীর পরিপাক, ভারী পেট)', en: 'Mandagni (Hypoactive, sluggish)' },
                { id: 'tikshnagni', bn: 'তীক্ষ্ণাগ্নি (Tikshnagni - অতিরিক্ত ক্ষিধে ও অম্লপিত্ত)', en: 'Tikshnagni (Hyperacidic, burning)' },
                { id: 'vishamagni', bn: 'বিষমাগ্নি (Vishamagni - অনিয়মিত গ্যাস ও কোষ্ঠকাঠিন্য)', en: 'Vishamagni (Irregular, fluctuating)' },
                { id: 'samagni', bn: 'সমাগ্নি (Samagni - আদর্শ ভারসাম্যপূর্ণ পরিপাক)', en: 'Samagni (Balanced & optimal)' },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateGutProfile({ digestive_fire_agni: item.id as AgniType })}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs font-medium transition ${
                    gut_profile.digestive_fire_agni === item.id 
                      ? 'bg-primary/10 border-primary text-primary font-semibold' 
                      : 'bg-background hover:bg-secondary/40 text-muted-foreground'
                  }`}
                >
                  {bn ? item.bn : item.en}
                </button>
              ))}
            </div>
          </div>

          {/* Energy & Sleep Sliders */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium text-foreground">{bn ? 'দৈনিক এনার্জি স্কোর (Energy Level):' : 'Daily Energy Score:'}</span>
                <span className="font-bold text-primary">{gut_profile.energy_score} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={gut_profile.energy_score}
                onChange={e => updateGutProfile({ energy_score: Number(e.target.value) })}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{bn ? 'তীব্র ক্লান্তি' : 'Fatigued'}</span>
                <span>{bn ? 'পূর্ণ চনমনে' : 'Vibrant'}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium text-foreground">{bn ? 'ঘুমের গুণগত মান (Sleep Quality):' : 'Sleep Quality:'}</span>
                <span className="font-bold text-primary">{gut_profile.sleep_quality_score} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={gut_profile.sleep_quality_score}
                onChange={e => updateGutProfile({ sleep_quality_score: Number(e.target.value) })}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{bn ? 'অনিদ্রা/ভাঙা ঘুম' : 'Broken'}</span>
                <span>{bn ? 'গভীর ও সতেজ' : 'Deep REM'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bristol Stool Scale Selector (1-7) */}
        <div className="pt-3 border-t space-y-2">
          <div className="flex justify-between items-center text-xs font-medium text-foreground">
            <span>{bn ? 'ব্রিস্টল স্টুল স্কেল (Bristol Stool Form Scale 1 - 7):' : 'Bristol Stool Form Scale (1 - 7):'}</span>
            <span className="font-bold text-primary">{bn ? `টাইপ ${gut_profile.bristol_stool_score}` : `Type ${gut_profile.bristol_stool_score}`}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {[
              { type: 1, label_bn: 'টাইপ ১: ছাগলের নাদির মতো শক্ত গোটা (তীব্র কোষ্ঠকাঠিন্য)', label_en: 'Type 1: Hard separate lumps (severe constipation)', color: 'border-rose-500/50' },
              { type: 2, label_bn: 'টাইপ ২: সসেজের মতো কিন্তু অমসৃণ/শক্ত (হালকা কোষ্ঠকাঠিন্য)', label_en: 'Type 2: Lumpy sausage (mild constipation)', color: 'border-amber-500/50' },
              { type: 3, label_bn: 'টাইপ ৩: খাঁজকাটা সসেজের মতো (স্বাভাবিকের কাছাকাছি)', label_en: 'Type 3: Sausage with surface cracks', color: 'border-emerald-500/50' },
              { type: 4, label_bn: 'টাইপ ৪: মসৃণ ও নরম সাপের মতো (১০০% আদর্শ ও সুস্থ)', label_en: 'Type 4: Smooth, soft snake (Optimal)', color: 'border-emerald-500 font-bold' },
              { type: 5, label_bn: 'টাইপ ৫: ধারালো প্রান্তযুক্ত নরম বল (আঁশ স্বল্পতা)', label_en: 'Type 5: Soft blobs with clear cut edges', color: 'border-amber-500/50' },
              { type: 6, label_bn: 'টাইপ ৬: পাতলা থকথকে কাদাটে (হালকা ডায়রিয়া/প্রদাহ)', label_en: 'Type 6: Mushy stool with ragged edges', color: 'border-rose-500/50' },
              { type: 7, label_bn: 'টাইপ ৭: সম্পূর্ণ পানির মতো তরল (তীব্র ডায়রিয়া/ইনফেকশন)', label_en: 'Type 7: Liquid consistency, no solid pieces', color: 'border-rose-500' },
            ].map(b => (
              <button
                key={b.type}
                type="button"
                onClick={() => updateGutProfile({ bristol_stool_score: b.type })}
                className={`p-2 rounded-xl border text-left flex flex-col justify-between transition min-h-[90px] ${
                  gut_profile.bristol_stool_score === b.type 
                    ? 'bg-primary/15 border-primary shadow-sm' 
                    : 'bg-background hover:bg-secondary/40'
                }`}
              >
                <div className="flex justify-between items-center w-full mb-1">
                  <span className="font-bold text-xs">Type {b.type}</span>
                  {b.type === 4 && <span className="text-[9px] bg-emerald-500/20 text-emerald-500 px-1 py-0.2 rounded font-semibold">IDEAL</span>}
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {bn ? b.label_bn : b.label_en}
                </p>
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
