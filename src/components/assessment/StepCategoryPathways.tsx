'use client';

import React from 'react';
import { usePractice } from '@/context/PracticeContext';
import { useAssessment } from '@/context/AssessmentContext';
import { PopulationGroup } from '@/types/index';
import { ClinicalPathway } from '@/types/clinical';
import {
  Users,
  Activity,
  Heart,
  Baby,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Scissors,
  CheckCircle2
} from 'lucide-react';

interface PopulationOption {
  id: PopulationGroup;
  title_en: string;
  title_bn: string;
  desc_en: string;
  desc_bn: string;
  badge?: string;
}

const PRIMARY_POPULATIONS: PopulationOption[] = [
  {
    id: 'adult_standard',
    title_en: 'Adult / Metabolic Health',
    title_bn: 'প্রাপ্তবয়স্ক ও মেটাবলিক স্বাস্থ্য',
    desc_en: 'Standard adult population, weight management, insulin resistance, dyslipidemia, metabolic syndrome.',
    desc_bn: 'সাধারণ প্রাপ্তবয়স্ক, ওজন নিয়ন্ত্রণ, ইনসুলিন রেজিস্ট্যান্স ও মেটাবলিক সিন্ড্রোম।'
  },
  {
    id: 'pediatric',
    title_en: 'Pediatric (< 12 Years)',
    title_bn: 'শিশু ও বাল্যকাল (< ১২ বছর)',
    desc_en: 'Infants and children requiring age-adjusted growth references and caregiver-guided assessment.',
    desc_bn: 'বয়স ও বৃদ্ধি অনুপাতে সমন্বিত পুষ্টি ও অভিভাবকদের নির্দেশিত মূল্যায়ন।'
  },
  {
    id: 'adolescent',
    title_en: 'Adolescent (12 - 18 Years)',
    title_bn: 'কৈশোর ও বয়ঃসন্ধিকাল (১২ - ১৮ বছর)',
    desc_en: 'Pubertal growth, sports nutrition, body image considerations, menstrual onset.',
    desc_bn: 'বয়ঃসন্ধিকালীন বৃদ্ধি, খেলাধুলার পুষ্টি এবং হরমোনজনিত ভারসাম্য।'
  },
  {
    id: 'pregnancy',
    title_en: 'Pregnancy (Garbhini)',
    title_bn: 'গর্ভাবস্থা (গর্ভিণী পরিচর্যা)',
    desc_en: 'Gestational nutritional adequacy, Masanumasika month-wise care, nausea, zero hypocaloric restriction.',
    desc_bn: 'গর্ভকালীন পর্যাপ্ত পুষ্টি, মাসানুমাসিক গর্ভিণী পরিচর্যা, ক্যালোরি ঘাটতি নিষিদ্ধ।'
  },
  {
    id: 'lactation',
    title_en: 'Lactation (Postpartum)',
    title_bn: 'স্তন্যদান ও প্রসবোত্তর পরিচর্যা',
    desc_en: 'Postpartum recovery, milk production support, maternal hydration, energy adequacy.',
    desc_bn: 'প্রসবোত্তর শক্তি পুনরুদ্ধার, মাতৃদুগ্ধ তৈরি এবং পর্যাপ্ত হাইড্রেশন।'
  },
  {
    id: 'oncology',
    title_en: 'Oncology Support',
    title_bn: 'ক্যান্সার ও অনকোলজি পুষ্টি',
    desc_en: 'Cancer therapy support, preserving lean mass, mitigating taste changes, nausea, and mucositis.',
    desc_bn: 'ক্যান্সার থেরাপি সাপোর্ট, পেশিক্ষয় রোধ ও মুখের ঘায়ের পথ্য ব্যবস্থাপনা।'
  },
  {
    id: 'geriatric',
    title_en: 'Geriatric (>= 65 Years)',
    title_bn: 'প্রবীণ স্বাস্থ্য (৬৫+ বছর)',
    desc_en: 'Sarcopenia prevention, dentition/chewing adaptation, polypharmacy review, hydration maintenance.',
    desc_bn: 'সারকোপেনিয়া প্রতিরোধ, চিবানোর সুবিধা, বহু-ওষুধ পর্যালোচনা ও পানিশূন্যতা রোধ।'
  },
  {
    id: 'renal',
    title_en: 'Renal / Chronic Kidney Disease',
    title_bn: 'কিডনি ও রেনাল পরিচর্যা',
    desc_en: 'CKD non-dialysis or dialysis therapy, electrolyte precision (potassium, phosphorus, fluid, sodium).',
    desc_bn: 'সিকেডি এবং ডায়ালাইসিস ব্যবস্থাপনা, সুনির্দিষ্ট পটাশিয়াম, ফসফরাস ও ফ্লুইড নিয়ন্ত্রণ।'
  }
];

interface PathwayOption {
  id: ClinicalPathway;
  title_en: string;
  title_bn: string;
  desc_en: string;
  desc_bn: string;
}

const CLINICAL_PATHWAYS: PathwayOption[] = [
  {
    id: 'metabolic',
    title_en: 'Diabetes & Glycemic Regulation',
    title_bn: 'ডায়াবেটিস ও গ্লাইসেমিক নিয়ন্ত্রণ',
    desc_en: 'Type 2 Diabetes, prediabetes, reactive hypoglycemia, insulin resistance.',
    desc_bn: 'টাইপ ২ ডায়াবেটিস, প্রি-ডায়াবেটিস, সুগার ওঠানামা ও ইনসুলিন রেজিস্ট্যান্স।'
  },
  {
    id: 'underweight_restoration',
    title_en: 'Underweight & Nutritional Restoration',
    title_bn: 'অপুষ্টি ও দৈহিক ওজন পুনরুদ্ধার',
    desc_en: 'Severe unintentional weight loss, anorexia, early satiety, refeeding syndrome risk screening.',
    desc_bn: 'অতিরিক্ত কম ওজন, ক্ষুধামন্দা, দ্রুত পেট ভরা ও রিফিডিং সিন্ড্রোম স্ক্রিনিং।'
  },
  {
    id: 'cardiovascular',
    title_en: 'Cardiovascular & Hypertension',
    title_bn: 'হৃদরোগ ও উচ্চ রক্তচাপ',
    desc_en: 'Essential hypertension, heart failure, fluid & sodium tracking, dyslipidemia.',
    desc_bn: 'উচ্চ রক্তচাপ, হার্ট ফেইলিউর, সোডিয়াম ও ফ্লুইড সীমাবদ্ধতা।'
  },
  {
    id: 'gastrointestinal_hepatic',
    title_en: 'Gastrointestinal & Hepatic (Gut Reset)',
    title_bn: 'গ্যাস্ট্রোইন্টেস্টাইনাল ও লিভার স্বাস্থ্য',
    desc_en: 'IBS, dysbiosis, GERD, non-alcoholic fatty liver disease (NAFLD), gut barrier restoration.',
    desc_bn: 'আইবিএস, ফ্যাটি লিভার, গ্যাস্ট্রিক রিফ্লাক্স ও গাট ব্যারিয়ার মেরামত।'
  },
  {
    id: 'surgical_postoperative',
    title_en: 'Surgical & Postoperative Nutrition',
    title_bn: 'অস্ত্রোপচার পরবর্তী ক্লিনিক্যাল পুষ্টি',
    desc_en: 'Post-op recovery, wound healing, oral feeding tolerance, transitional feeding.',
    desc_bn: 'অপারেশন পরবর্তী খাদ্য সহনশীলতা, ক্ষত নিরাময় ও ট্রানজিশনাল ডায়েট।'
  },
  {
    id: 'critical_care_specialized_support',
    title_en: 'Critical Care & Specialized Nutrition Support',
    title_bn: 'বিশেষায়িত পুষ্টি সাপোর্ট ও ফিডিং রুট',
    desc_en: 'Enteral tube feeds, parenteral TPN coordination, dysphagia texture modification.',
    desc_bn: 'টিউব ফিডিং, স্যালাইন পুষ্টি ও ডিসফ্যাজিয়া টেক্সচার মডিফিকেশন।'
  }
];

export const StepCategoryPathways: React.FC = () => {
  const { patient, updatePatient, language } = usePractice();
  const { setCurrentStep } = useAssessment();
  const bn = language === 'bn';

  const selectedPrimary = patient.population_group || 'adult_standard';
  const selectedPathways = patient.clinical_pathways || ['metabolic'];

  const handleSelectPrimary = (group: PopulationGroup) => {
    updatePatient({ population_group: group });
  };

  const handleTogglePathway = (pathway: ClinicalPathway) => {
    let updated: ClinicalPathway[];
    if (selectedPathways.includes(pathway)) {
      // Don't remove if it's the last one
      if (selectedPathways.length > 1) {
        updated = selectedPathways.filter(p => p !== pathway);
      } else {
        return;
      }
    } else {
      updated = [...selectedPathways, pathway];
    }
    updatePatient({ clinical_pathways: updated });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-foreground">
          {bn ? 'ধাপ ১: রোগীর জনসংখ্যা ও ক্লিনিক্যাল পাথওয়ে নির্বাচন' : 'Step 1: Patient Category & Clinical Pathway Selection'}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {bn
            ? 'রোগীর প্রাথমিক স্বাস্থ্য গ্রুপ ও সক্রিয় ক্লিনিক্যাল পাথওয়েগুলো নির্বাচন করুন। এটি প্রাসঙ্গিক প্রশ্নাবলি ও নিরাপত্তা নিয়ম সক্রিয় করবে।'
            : 'Select the primary population and all active clinical pathways. This activates relevant conditional questions and clinical safety gates.'}
        </p>
      </div>

      {/* 1. Primary Population Category */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            {bn ? '১. প্রাথমিক জনসংখ্যা গ্রুপ (বাধ্যতামূলক)' : '1. Primary Population Group (Select One)'}
          </label>
          <span className="text-[11px] font-semibold text-primary">
            {bn ? 'বর্তমান: ' : 'Active: '} {selectedPrimary}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PRIMARY_POPULATIONS.map((pop) => {
            const isSelected = selectedPrimary === pop.id;
            return (
              <div
                key={pop.id}
                onClick={() => handleSelectPrimary(pop.id)}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-foreground">
                      {bn ? pop.title_bn : pop.title_en}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      {bn ? pop.desc_bn : pop.desc_en}
                    </p>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'border border-muted-foreground/30'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Additional Clinical Pathways (Multi-select) */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            {bn ? '২. ওভারল্যাপিং ক্লিনিক্যাল পথসমূহ (একাধিক নির্বাচনযোগ্য)' : '2. Overlapping Clinical Pathways (Multi-Selectable)'}
          </label>
          <span className="text-[11px] text-muted-foreground">
            {selectedPathways.length} {bn ? 'টি পথ সক্রিয়' : 'active'}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          {bn
            ? 'একজন রোগী একসাথে অনকোলজি এবং অপুষ্টিতে আক্রান্ত হতে পারেন, বা গর্ভাবস্থার সাথে ডায়াবেটিসে আক্রান্ত হতে পারেন। প্রযোজ্য সব পাথওয়ে নির্বাচন করুন।'
            : 'Patients frequently have concurrent comorbidities (e.g. oncology + underweight, pregnancy + gestational diabetes). Select all applicable pathways.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CLINICAL_PATHWAYS.map((p) => {
            const isSelected = selectedPathways.includes(p.id);
            return (
              <div
                key={p.id}
                onClick={() => handleTogglePathway(p.id)}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-sm'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-foreground">
                      {bn ? p.title_bn : p.title_en}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      {bn ? p.desc_bn : p.desc_en}
                    </p>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'border border-muted-foreground/30'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-end pt-4 border-t">
        <button
          type="button"
          onClick={() => setCurrentStep('step_demographics')}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-all flex items-center gap-1.5"
        >
          <span>{bn ? 'পরবর্তী: জনমিতি ও পরিমাপ' : 'Next: Demographics & Vitals'}</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
