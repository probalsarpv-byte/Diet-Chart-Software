// Questionnaire Registry for Functional Nutrition Assessment
// -------------------------------------------------------
// 14 Functional Nutrition Domains + Specialized Population Modules,
// bilingual (Bangla & English) questions, declarative visibility rules,
// quick/comprehensive screening flags, and clinical pathway routing.

export const registryVersion = "v2.2.0" as const;

export type AssessmentDomainId =
  | 'clinical_history'
  | 'anthropometrics'
  | 'metabolic'
  | 'gastrointestinal'
  | 'microbiome'
  | 'immune_inflammatory'
  | 'endocrine_hormonal'
  | 'hepatic_biotransformation'
  | 'mitochondrial_energy'
  | 'sleep_circadian'
  | 'stress_neurobehavioral'
  | 'dietary_nutrition'
  | 'medication_supplements'
  | 'environmental_lifestyle';

export interface DomainMetadata {
  id: AssessmentDomainId;
  name_en: string;
  name_bn: string;
  description_en: string;
  description_bn: string;
  iconName?: string;
}

export const ASSESSMENT_DOMAINS: DomainMetadata[] = [
  {
    id: 'clinical_history',
    name_en: 'Clinical History & Timeline',
    name_bn: 'ক্লিনিক্যাল ইতিহাস ও সময়রেখা',
    description_en: 'Antecedents, triggers, mediators, onset of symptoms, and major life health events.',
    description_bn: 'পূর্বসূত্র, সূত্রপাতকারী ঘটনা, রোগের সূচনা ও অতীতের স্বাস্থ্য ইতিহাস।'
  },
  {
    id: 'anthropometrics',
    name_en: 'Anthropometric & Body Composition',
    name_bn: 'নৃতাত্ত্বিক ও শারীরিক গঠন পরিমাপ',
    description_en: 'Body weight, height, waist circumference, waist-to-height ratio, and weight trajectory.',
    description_bn: 'ওজন, উচ্চতা, কোমর পরিধি, কোমরের সাথে উচ্চতার অনুপাত এবং ওজনের গতিপ্রকৃতি।'
  },
  {
    id: 'metabolic',
    name_en: 'Metabolic & Glycemic Regulation',
    name_bn: 'মেটাবলিক ও গ্লাইসেমিক নিয়ন্ত্রণ',
    description_en: 'Blood sugar stability, post-meal energy dips, sugar cravings, and insulin sensitivity signs.',
    description_bn: 'রক্তের শর্করার স্থিতিশীলতা, খাবারের পর ক্লান্তি, মিষ্টির তীব্র আকাঙ্ক্ষা।'
  },
  {
    id: 'gastrointestinal',
    name_en: 'Gastrointestinal Function',
    name_bn: 'পরিপাকতন্ত্র ও গ্যাস্ট্রোইন্টেস্টাইনাল স্বাস্থ্য',
    description_en: 'Digestion, bloating, reflux, abdominal discomfort, and bowel habit patterns.',
    description_bn: 'হজম শক্তি, পেট ফাঁপা, গ্যাস্ট্রিক এসিড রিফ্লাক্স ও পেটের অস্বস্তি।'
  },
  {
    id: 'microbiome',
    name_en: 'Microbiome & Gut Ecology',
    name_bn: 'মাইক্রোবায়োম ও গাট ইকোলজি',
    description_en: 'Bristol stool characteristics, antibiotic history, fermentable food tolerance, and dysbiosis signs.',
    description_bn: 'মল পরীক্ষার ধরন (ব্রিস্টল স্কেল), অ্যান্টিবায়োটিক সেবনের ইতিহাস ও ব্যাকটেরিয়ার ভারসাম্য।'
  },
  {
    id: 'immune_inflammatory',
    name_en: 'Immune & Inflammatory Function',
    name_bn: 'রোগপ্রতিরোধ ও প্রদাহজনিত লক্ষণ',
    description_en: 'Joint aches, skin reactions, allergies, food sensitivities, and chronic low-grade inflammation.',
    description_bn: 'জয়েন্টে ব্যথা, অ্যালার্জি, ত্বকের সমস্যা ও দীর্ঘস্থায়ী প্রদাহের লক্ষণ।'
  },
  {
    id: 'endocrine_hormonal',
    name_en: 'Endocrine & Hormonal Balance',
    name_bn: 'এন্ডোক্রাইন ও হরমোন ভারসাম্য',
    description_en: 'Thyroid signs, menstrual regularity, reproductive milestones, temperature tolerance, and cortisol rhythm.',
    description_bn: 'থাইরয়েডের লক্ষণ, মাসিক চক্রের নিয়মিততা, হরমোন ভারসাম্য ও তাপমাত্রা সহনশীলতা।'
  },
  {
    id: 'hepatic_biotransformation',
    name_en: 'Hepatic & Biotransformation',
    name_bn: 'যকৃতের স্বাস্থ্য ও বর্জ্য নিষ্কাশন',
    description_en: 'Liver biomarker history, chemical sensitivity, bowel regularity, gallbladder signs, and toxic exposure.',
    description_bn: 'লিভারের কার্যকারিতা, পিত্তথলির স্বাস্থ্য, রাসায়নিক সংবেদনশীলতা ও ডিটক্সিফিকেশন।'
  },
  {
    id: 'mitochondrial_energy',
    name_en: 'Mitochondrial & Energy Function',
    name_bn: 'মাইটোকন্ড্রিয়াল শক্তি ও স্ট্যামিনা',
    description_en: 'Cellular energy production, morning stamina, exercise recovery, and post-exertional malaise.',
    description_bn: 'কোষীয় শক্তি উৎপাদন, সকালের সতেজতা এবং দৈহিক ক্লান্তি।'
  },
  {
    id: 'sleep_circadian',
    name_en: 'Sleep & Circadian Rhythm',
    name_bn: 'ঘুম ও সার্কাডিয়ান ছন্দ',
    description_en: 'Sleep latency, night waking, daytime somnolence, shift work, and circadian alignment.',
    description_bn: 'ঘুমের গভীরতা, রাতে ঘুম ভাঙা, দিনের বেলার ঝিমুনি ও সার্কাডিয়ান ছন্দের ভারসাম্য।'
  },
  {
    id: 'stress_neurobehavioral',
    name_en: 'Stress & Neurobehavioral',
    name_bn: 'মানসিক চাপ ও স্নায়বিক সুস্থতা',
    description_en: 'Perceived stress, anxiety, cognitive clarity, brain fog, and psychological resilience.',
    description_bn: 'মানসিক চাপ, উদ্বেগ, মস্তিষ্কের স্বচ্ছতা (ব্রেন ফগ) ও মানসিক সহনশীলতা।'
  },
  {
    id: 'dietary_nutrition',
    name_en: 'Dietary Habits & Eating Patterns',
    name_bn: 'খাদ্যাভ্যাস ও খাওয়ার ধরন',
    description_en: 'Meal timing, emotional eating, chewing thoroughness, dining out, and hydration volume.',
    description_bn: 'খাওয়ার সময়ানুবর্তিতা, চিবিয়ে খাওয়ার অভ্যাস, বাইরের খাবার ও পানির পরিমাণ।'
  },
  {
    id: 'medication_supplements',
    name_en: 'Medications, Supplements & Allergies',
    name_bn: 'ওষুধ, সাপ্লিমেন্ট ও অ্যালার্জি ইতিহাস',
    description_en: 'Current prescription drugs, over-the-counter NSAIDs/PPIs, ongoing supplements, and adverse reactions.',
    description_bn: 'প্রেসক্রিপশন ওষুধ, অ্যান্টাসিড/পিপিআই, ভিটামিন সাপ্লিমেন্ট ও খাদ্য অ্যালার্জি।'
  },
  {
    id: 'environmental_lifestyle',
    name_en: 'Environmental & Lifestyle Factors',
    name_bn: 'পরিবেশগত ও জীবনধারা প্রভাব',
    description_en: 'Physical activity, sun exposure, occupational exposures, water source, and plastic/pesticide contact.',
    description_bn: 'শারীরিক পরিশ্রম, রোদ লাগা, কর্মস্থলের পরিবেশ ও রাসায়নিক এক্সপোজার।'
  }
];

export type AnswerType = "text" | "number" | "select" | "multiselect" | "yesno" | "date";

export interface AnswerOption {
  value: string;
  label: string;
  label_bn?: string;
  label_en?: string;
}

export type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'includes'
  | 'exists'
  | 'notExists';

export interface SimpleCondition {
  field: string;
  operator: ConditionOperator;
  value?: any;
}

export interface CompoundCondition {
  AND?: DeclarativeCondition[];
  OR?: DeclarativeCondition[];
  NOT?: DeclarativeCondition;
}

export type DeclarativeCondition = SimpleCondition | CompoundCondition;

export interface VisibilityRule {
  description?: string;
  condition: DeclarativeCondition | string;
}

export type PopulationGroup =
  | 'adult_standard'
  | 'pediatric'
  | 'adolescent'
  | 'pregnancy'
  | 'lactation'
  | 'geriatric'
  | 'oncology'
  | 'renal'
  | 'all';

export interface QuestionDefinition {
  id: string;
  label: string;
  label_bn: string;
  label_en: string;
  domain: AssessmentDomainId;
  subdomain?: string;
  answerType: AnswerType;
  options?: AnswerOption[];
  isHighValueScreening?: boolean; // Included in Quick Assessment
  visibility?: VisibilityRule;
  required?: boolean;
  clinicalTags?: string[];
  applicablePopulation?: PopulationGroup[];
  applicablePathways?: string[];
  unit?: string;
  hint_en?: string;
  hint_bn?: string;
}

// ─────────────────────────────────────────────────────────────────
// Comprehensive Question Bank (Covering all 14 domains + Pathways)
// ─────────────────────────────────────────────────────────────────
export const coreQuestions: QuestionDefinition[] = [
  {
    "id": "chief_complaint",
    "label": "Chief Health Complaint",
    "label_en": "Primary health concern or chief reason for consultation",
    "label_bn": "রোগীর প্রধান শারীরিক সমস্যা বা বর্তমান স্বাস্থ্য উদ্বেগ",
    "domain": "clinical_history",
    "answerType": "text",
    "isHighValueScreening": true,
    "required": true,
    "clinicalTags": [
      "chief_complaint"
    ]
  },
  {
    "id": "symptom_onset_timeline",
    "label": "Onset of Primary Symptoms",
    "label_en": "When did your current symptoms first begin?",
    "label_bn": "বর্তমান শারীরিক সমস্যাগুলো কতদিন আগে শুরু হয়েছিল?",
    "domain": "clinical_history",
    "answerType": "select",
    "isHighValueScreening": true,
    "options": [
      {
        "value": "less_than_1_month",
        "label": "< 1 month",
        "label_en": "Less than 1 month ago",
        "label_bn": "১ মাসের কম সময় আগে"
      },
      {
        "value": "1_to_6_months",
        "label": "1-6 months",
        "label_en": "1 to 6 months ago",
        "label_bn": "১ থেকে ৬ মাস আগে"
      },
      {
        "value": "6_to_12_months",
        "label": "6-12 months",
        "label_en": "6 to 12 months ago",
        "label_bn": "৬ মাস থেকে ১ বছর আগে"
      },
      {
        "value": "1_to_3_years",
        "label": "1-3 years",
        "label_en": "1 to 3 years ago",
        "label_bn": "১ থেকে ৩ বছর আগে"
      },
      {
        "value": "chronic_over_3_years",
        "label": "> 3 years",
        "label_en": "More than 3 years (Chronic)",
        "label_bn": "৩ বছরের বেশি সময় ধরে (দীর্ঘস্থায়ী)"
      }
    ],
    "clinicalTags": [
      "timeline_onset"
    ]
  },
  {
    "id": "trigger_event_history",
    "label": "Triggering Event Preceding Symptoms",
    "label_en": "Did anything major happen immediately before symptoms began?",
    "label_bn": "লক্ষণগুলো শুরু হওয়ার ঠিক আগে কোনো বিশেষ ঘটনা ঘটেছিল কি?",
    "domain": "clinical_history",
    "answerType": "select",
    "options": [
      {
        "value": "none_apparent",
        "label": "No obvious event",
        "label_en": "No obvious triggering event",
        "label_bn": "নির্দিষ্ট কোনো ঘটনা মনে নেই"
      },
      {
        "value": "severe_infection",
        "label": "Severe infection or food poisoning",
        "label_en": "Severe infection, typhoid, or gastroenteritis",
        "label_bn": "টাইফয়েড, ডায়রিয়া বা মারাত্মক ফুড পয়জনিং"
      },
      {
        "value": "heavy_antibiotics",
        "label": "Heavy antibiotic course",
        "label_en": "Strong course of antibiotics",
        "label_bn": "অ্যান্টিবায়োটিকের কড়া ডোজ সেবন"
      },
      {
        "value": "major_stress",
        "label": "Major psychological stress or grief",
        "label_en": "Severe emotional shock, bereavement, or acute job stress",
        "label_bn": "তীব্র মানসিক আঘাত, শোক বা কর্মক্ষেত্রের অতিরিক্ত চাপ"
      },
      {
        "value": "pregnancy_childbirth",
        "label": "Pregnancy or postpartum",
        "label_en": "Post-pregnancy or delivery",
        "label_bn": "গর্ভাবস্থা বা সন্তান প্রসবের পর"
      },
      {
        "value": "surgical_procedure",
        "label": "Surgery or hospitalization",
        "label_en": "Major surgery or hospitalization",
        "label_bn": "অস্ত্রোপচার বা হাসপাতালে ভর্তি"
      }
    ],
    "clinicalTags": [
      "trigger_event"
    ]
  },
  {
    "id": "family_chronic_history",
    "label": "Family Medical History",
    "label_en": "Family history of chronic disease (parents/siblings)",
    "label_bn": "পরিবারে রক্তসম্পর্কীয় সদস্যদের মধ্যে দীর্ঘস্থায়ী রোগের ইতিহাস",
    "domain": "clinical_history",
    "answerType": "multiselect",
    "options": [
      {
        "value": "family_t2d",
        "label": "Type 2 Diabetes",
        "label_en": "Type 2 Diabetes",
        "label_bn": "টাইপ ২ ডায়াবেটিস"
      },
      {
        "value": "family_hypertension",
        "label": "Hypertension / Heart Disease",
        "label_en": "Hypertension / CVD",
        "label_bn": "উচ্চ রক্তচাপ বা হৃদরোগ"
      },
      {
        "value": "family_thyroid",
        "label": "Thyroid Disorder",
        "label_en": "Hypo/Hyperthyroidism",
        "label_bn": "থাইরয়েড রোগ"
      },
      {
        "value": "family_autoimmune",
        "label": "Autoimmune Disease",
        "label_en": "Rheumatoid / Lupus / Vitiligo",
        "label_bn": "অটোইমিউন রোগ (বাত, লুপাস, শ্বেতী)"
      },
      {
        "value": "family_fatty_liver",
        "label": "Fatty Liver / NASH",
        "label_en": "Fatty Liver Disease",
        "label_bn": "ফ্যাটি লিভার"
      },
      {
        "value": "family_kidney",
        "label": "Kidney Disease / Stones",
        "label_en": "Kidney Disease or Calculi",
        "label_bn": "কিডনি রোগ বা পাথর"
      }
    ],
    "clinicalTags": [
      "family_history"
    ]
  },
  {
    "id": "recent_infections_antibiotics",
    "label": "Recent Antibiotic or Infection History",
    "label_en": "Have you taken antibiotics or had a serious infection in the last 6 months?",
    "label_bn": "গত ৬ মাসে অ্যান্টিবায়োটিক সেবন করেছেন বা গুরুতর সংক্রমণে ভুগেছেন কি?",
    "domain": "clinical_history",
    "answerType": "yesno",
    "isHighValueScreening": true,
    "clinicalTags": [
      "antibiotic_exposure",
      "dysbiosis_risk"
    ]
  },
  {
    "id": "childhood_illness_history",
    "label": "Childhood Health Antecedents",
    "label_en": "Did you suffer from frequent childhood health conditions?",
    "label_bn": "শৈশবে বারবার কোনো রোগে আক্রান্ত হওয়ার ইতিহাস ছিল কি?",
    "domain": "clinical_history",
    "answerType": "multiselect",
    "options": [
      {
        "value": "frequent_ear_tonsil",
        "label": "Frequent Ear / Tonsil Infections",
        "label_en": "Frequent ear or tonsil infections",
        "label_bn": "বারবার কান বা টনসিলের সংক্রমণ"
      },
      {
        "value": "childhood_asthma_allergies",
        "label": "Asthma, Eczema, or Bronchitis",
        "label_en": "Childhood asthma or severe allergies",
        "label_bn": "অ্যাজমা, শ্বাসকষ্ট বা তীব্র চর্মরোগ"
      },
      {
        "value": "recurrent_stomach_bugs",
        "label": "Recurrent Amoebic / Bacillary Dysentery",
        "label_en": "Recurrent dysentery or gut parasites",
        "label_bn": "বারবার আমাশয় বা পেটের অসুখ"
      },
      {
        "value": "none_unremarkable",
        "label": "Unremarkable healthy childhood",
        "label_en": "Generally healthy childhood",
        "label_bn": "শৈশব স্বাভাবিক ও সুস্থ ছিল"
      }
    ],
    "clinicalTags": [
      "childhood_antecedents"
    ]
  },
  {
    "id": "surgical_history_past",
    "label": "Past Surgeries & Procedures",
    "label_en": "Have you undergone any major surgical operations?",
    "label_bn": "অতীতে আপনার কোনো বড় ধরনের অপারেশন বা সার্জারি হয়েছে কি?",
    "domain": "clinical_history",
    "answerType": "multiselect",
    "options": [
      {
        "value": "cholecystectomy_gallbladder",
        "label": "Gallbladder Removal (Cholecystectomy)",
        "label_en": "Cholecystectomy",
        "label_bn": "পিত্তথলি অপসারণ (কলিসিস্টেক্টমি)"
      },
      {
        "value": "appendectomy",
        "label": "Appendectomy",
        "label_en": "Appendectomy",
        "label_bn": "অ্যাপেন্ডিসাইটিস অপারেশন"
      },
      {
        "value": "c_section",
        "label": "Cesarean Delivery",
        "label_en": "Cesarean Section",
        "label_bn": "সিজারিয়ান ডেলিভারি"
      },
      {
        "value": "bariatric_gastric",
        "label": "Bariatric / Gastric Bypass",
        "label_en": "Bariatric Surgery",
        "label_bn": "ওজন কমানোর বেরিয়াট্রিক সার্জারি"
      },
      {
        "value": "hysterectomy",
        "label": "Hysterectomy",
        "label_en": "Hysterectomy",
        "label_bn": "জরায়ু অপসারণ"
      },
      {
        "value": "none",
        "label": "No major surgeries",
        "label_en": "No surgeries",
        "label_bn": "কোনো সার্জারি হয়নি"
      }
    ],
    "clinicalTags": [
      "surgical_history"
    ]
  },
  {
    "id": "symptom_progression_trend",
    "label": "Symptom Progression Direction",
    "label_en": "Over the past 6 months, are your primary symptoms progressing or improving?",
    "label_bn": "গত ৬ মাসে লক্ষণগুলোর গতিপ্রকৃতি কেমন?",
    "domain": "clinical_history",
    "answerType": "select",
    "options": [
      {
        "value": "steadily_worsening",
        "label": "Steadily worsening",
        "label_en": "Steadily worsening",
        "label_bn": "ক্রমাগত খারাপের দিকে যাচ্ছে"
      },
      {
        "value": "stable_plateau",
        "label": "Stationary / Stable",
        "label_en": "Stationary / Plateaued",
        "label_bn": "একই রকম স্থিতিশীল আছে"
      },
      {
        "value": "fluctuating_flares",
        "label": "Fluctuating with good and bad days",
        "label_en": "Fluctuating with acute flares",
        "label_bn": "মাঝে ভালো, মাঝে তীব্র খারাপ (উত্থান-পতনশীল)"
      },
      {
        "value": "gradually_improving",
        "label": "Gradually improving",
        "label_en": "Gradually improving",
        "label_bn": "ধীরে ধীরে উন্নতির দিকে"
      }
    ],
    "clinicalTags": [
      "progression_trend"
    ]
  },
  {
    "id": "environmental_mold_exposure",
    "label": "Water Damage / Mold Exposure History",
    "label_en": "Have you lived or worked in buildings with persistent dampness, visible black mold, or water leaks?",
    "label_bn": "স্যাঁতসেঁতে বা কালো ছত্রাকযুক্ত (মোল্ড) ঘরে দীর্ঘদিন বসবাস বা কাজের অভিজ্ঞতা আছে কি?",
    "domain": "clinical_history",
    "answerType": "yesno",
    "clinicalTags": [
      "mold_exposure",
      "mycotoxin_burden"
    ]
  },
  {
    "id": "family_early_cardiovascular",
    "label": "Premature Cardiovascular Disease in Family",
    "label_en": "Did any first-degree male relative (<55y) or female (<65y) suffer a premature heart attack or stroke?",
    "label_bn": "পরিবারে অল্প বয়সে (পুরুষ <৫৫, নারী <৬৫) হার্ট অ্যাটাক বা স্ট্রোকের ইতিহাস আছে কি?",
    "domain": "clinical_history",
    "answerType": "yesno",
    "clinicalTags": [
      "family_early_cvd"
    ]
  },
  {
    "id": "past_hospitalizations_count",
    "label": "Hospital Admissions in Past 2 Years",
    "label_en": "How many times have you been admitted to a hospital overnight in the last 2 years?",
    "label_bn": "গত ২ বছরে কতবার হাসপাতালে ভর্তি থাকতে হয়েছে?",
    "domain": "clinical_history",
    "answerType": "select",
    "options": [
      {
        "value": "zero",
        "label": "0 times",
        "label_en": "0 times",
        "label_bn": "একবারও না"
      },
      {
        "value": "one_time",
        "label": "1 time",
        "label_en": "1 time",
        "label_bn": "১ বার"
      },
      {
        "value": "two_to_three",
        "label": "2 to 3 times",
        "label_en": "2-3 times",
        "label_bn": "২ থেকে ৩ বার"
      },
      {
        "value": "four_plus",
        "label": "4 or more times",
        "label_en": "4+ times",
        "label_bn": "৪ বার বা তার বেশি"
      }
    ],
    "clinicalTags": [
      "hospitalization_history"
    ]
  },
  {
    "id": "dental_health_amalgams",
    "label": "Dental Amalgams or Root Canals",
    "label_en": "Do you have silver/mercury amalgam dental fillings or root canal treated teeth?",
    "label_bn": "দাঁতে কি সিলভার ফিলিং (অ্যামালগাম) বা রুট ক্যানেল করানো আছে?",
    "domain": "clinical_history",
    "answerType": "select",
    "options": [
      {
        "value": "none",
        "label": "No amalgams or root canals",
        "label_en": "None",
        "label_bn": "কোনোটিই নেই"
      },
      {
        "value": "amalgams_present",
        "label": "Silver amalgam fillings present (1-3)",
        "label_en": "1-3 Amalgams",
        "label_bn": "১-৩টি সিলভার ফিলিং আছে"
      },
      {
        "value": "multiple_amalgams_root_canals",
        "label": "Multiple amalgams (4+) or root canals",
        "label_en": "Multiple amalgams / Root canals",
        "label_bn": "একাধিক ফিলিং বা রুট ক্যানেল আছে"
      }
    ],
    "clinicalTags": [
      "dental_health",
      "heavy_metal_amalgam"
    ]
  },
  {
    "id": "chronic_pain_syndrome",
    "label": "Chronic Musculoskeletal Pain / Fibromyalgia",
    "label_en": "Do you suffer from generalized body aches or fibromyalgia-type tender points?",
    "label_bn": "শরীরে দীর্ঘস্থায়ী তীব্র মাংসপেশির ব্যথা বা ফাইব্রোমায়ালজিয়ার সমস্যা আছে কি?",
    "domain": "clinical_history",
    "answerType": "yesno",
    "clinicalTags": [
      "chronic_pain",
      "central_sensitization"
    ]
  },
  {
    "id": "previous_covid_infection_severity",
    "label": "History of Severe Viral Infection / Long COVID",
    "label_en": "Did you have severe COVID-19 or post-viral syndrome with lingering fatigue/brain fog?",
    "label_bn": "অতীতে তীব্র করোনা বা ভাইরাল সংক্রমণের পর কি দীর্ঘস্থায়ী ক্লান্তি বা দুর্বলতা থেকে গেছে?",
    "domain": "clinical_history",
    "answerType": "select",
    "options": [
      {
        "value": "never_had_or_mild",
        "label": "No / Mild illness with full recovery",
        "label_en": "Mild / Full recovery",
        "label_bn": "মৃদু ছিল এবং পুরোপুরি সুস্থ"
      },
      {
        "value": "lingering_fatigue_post_viral",
        "label": "Yes, developed long-term fatigue or brain fog post-illness",
        "label_en": "Long-term post-viral fatigue",
        "label_bn": "হ্যাঁ, এরপর থেকেই ক্লান্তি ও মাথা ঝাপসা ভাব শুরু হয়"
      }
    ],
    "clinicalTags": [
      "long_covid",
      "post_viral_syndrome"
    ]
  },
  {
    "id": "patient_primary_goal",
    "label": "Patient's Primary Treatment Goal",
    "label_en": "What is your highest personal health priority from this clinical nutrition program?",
    "label_bn": "এই পুষ্টি পরামর্শ থেকে আপনার প্রধান স্বাস্থ্য প্রত্যাশা কী?",
    "domain": "clinical_history",
    "answerType": "select",
    "isHighValueScreening": true,
    "options": [
      {
        "value": "fat_loss_metabolic",
        "label": "Sustainable Fat Loss & Metabolic Reversal",
        "label_en": "Fat loss & metabolic health",
        "label_bn": "ওজন ও মেদ কমানো এবং মেটাবলিক সুস্থতা"
      },
      {
        "value": "digestive_relief",
        "label": "Relief from Gas, Bloating & Gut Distress",
        "label_en": "Digestive symptom relief",
        "label_bn": "গ্যাস, এসিডিটি ও পেটের সমস্যা নিরাময়"
      },
      {
        "value": "energy_vitality",
        "label": "Overcoming Fatigue & Restoring Daily Vitality",
        "label_en": "Energy and vitality restoration",
        "label_bn": "ক্লান্তি দূর করে দৈহিক শক্তি ও সতেজতা ফিরে পাওয়া"
      },
      {
        "value": "hormonal_balance",
        "label": "Thyroid, PCOS, or Menstrual Balance",
        "label_en": "Hormonal and endocrine balance",
        "label_bn": "থাইরয়েড বা হরমোনের ভারসাম্য ফিরিয়ে আনা"
      },
      {
        "value": "chronic_disease_support",
        "label": "Dietary Support for CKD / Heart / Fatty Liver",
        "label_en": "Chronic disease nutritional management",
        "label_bn": "কিডনি, ফ্যাটি লিভার বা হৃদরোগের খাদ্য ব্যবস্থাপনা"
      }
    ],
    "clinicalTags": [
      "primary_goal",
      "patient_centricity"
    ]
  },
  {
    "id": "unintentional_weight_loss",
    "label": "Unexplained Weight Loss",
    "label_en": "Have you experienced rapid, unintentional weight loss (>5% in 3 months)?",
    "label_bn": "গত ৩ মাসে না চাইতেই আপনার কি উল্লেখযোগ্য বা অস্বাভাবিক ওজন কমেছে (>৫%)?",
    "domain": "anthropometrics",
    "answerType": "yesno",
    "isHighValueScreening": true,
    "clinicalTags": [
      "weight_loss",
      "unintentional",
      "red_flag_weight_loss"
    ]
  },
  {
    "id": "weight_loss_amount_kg",
    "label": "Amount of Unintentional Weight Loss",
    "label_en": "How many kilograms lost unintentionally in recent months?",
    "label_bn": "সাম্প্রতিক মাসগুলোতে কত কেজি ওজন কমেছে?",
    "domain": "anthropometrics",
    "answerType": "number",
    "unit": "kg",
    "visibility": {
      "condition": {
        "field": "unintentional_weight_loss",
        "operator": "equals",
        "value": "yes"
      }
    },
    "clinicalTags": [
      "weight_loss_kg"
    ]
  },
  {
    "id": "weight_trend_last_year",
    "label": "1-Year Weight Trajectory",
    "label_en": "General weight trend over the past 12 months",
    "label_bn": "গত এক বছরে ওজনের গতিপ্রকৃতি কেমন ছিল?",
    "domain": "anthropometrics",
    "answerType": "select",
    "options": [
      {
        "value": "stable",
        "label": "Stable (+/- 2 kg)",
        "label_en": "Stable (+/- 2 kg)",
        "label_bn": "স্থিতিশীল (+/- ২ কেজি)"
      },
      {
        "value": "gradual_gain",
        "label": "Gradual weight gain (2-5 kg)",
        "label_en": "Gradual weight gain (2-5 kg)",
        "label_bn": "ধীরে ধীরে ২-৫ কেজি বৃদ্ধি"
      },
      {
        "value": "rapid_gain",
        "label": "Rapid weight gain (> 5 kg)",
        "label_en": "Rapid weight gain (> 5 kg)",
        "label_bn": "দ্রুত ৫ কেজির বেশি বৃদ্ধি"
      },
      {
        "value": "intentional_loss",
        "label": "Intentional loss through diet/exercise",
        "label_en": "Intentional loss",
        "label_bn": "চেষ্টা করে ওজন কমানো"
      },
      {
        "value": "unintentional_loss",
        "label": "Unintentional weight loss",
        "label_en": "Unintentional weight loss",
        "label_bn": "চেষ্টা ছাড়াই কমে যাওয়া"
      }
    ],
    "clinicalTags": [
      "weight_trajectory"
    ]
  },
  {
    "id": "body_fat_distribution",
    "label": "Body Fat Distribution Pattern",
    "label_en": "Where is excess weight or adipose tissue primarily stored?",
    "label_bn": "শরীরে বাড়তি মেদ প্রধানত কোথায় জমে থাকে?",
    "domain": "anthropometrics",
    "answerType": "select",
    "options": [
      {
        "value": "central_visceral",
        "label": "Belly / Abdomen (Apple shape)",
        "label_en": "Central / Abdominal visceral",
        "label_bn": "পেট ও কোমরের চারদিকে (আপেল আকৃতি)"
      },
      {
        "value": "peripheral_gynoid",
        "label": "Hips, Thighs & Buttocks (Pear shape)",
        "label_en": "Gynoid / Hips and thighs",
        "label_bn": "নিতম্ব ও উরুর অংশে (নাশপাতি আকৃতি)"
      },
      {
        "value": "evenly_distributed",
        "label": "Evenly distributed throughout body",
        "label_en": "Even generalized distribution",
        "label_bn": "শরীরের সর্বত্র সমভাবে বিন্যস্ত"
      },
      {
        "value": "lean_minimal_fat",
        "label": "Naturally lean with minimal body fat",
        "label_en": "Naturally lean / ectomorphic",
        "label_bn": "স্বাভাবিকভাবেই মেদহীন বা শীর্ণ"
      }
    ],
    "clinicalTags": [
      "fat_distribution",
      "visceral_fat_risk"
    ]
  },
  {
    "id": "highest_adult_weight_kg",
    "label": "Highest Adult Weight",
    "label_en": "What was your lifetime highest non-pregnant adult weight (kg)?",
    "label_bn": "প্রাপ্তবয়স্ক জীবনে আপনার সর্বোচ্চ ওজন কত ছিল (কেজি)?",
    "domain": "anthropometrics",
    "answerType": "number",
    "unit": "kg",
    "clinicalTags": [
      "highest_weight"
    ]
  },
  {
    "id": "lowest_adult_weight_kg",
    "label": "Lowest Adult Weight",
    "label_en": "What was your lowest non-pathological adult weight (kg)?",
    "label_bn": "প্রাপ্তবয়স্ক জীবনে সুস্থ অবস্থায় আপনার সর্বনিম্ন ওজন কত ছিল (কেজি)?",
    "domain": "anthropometrics",
    "answerType": "number",
    "unit": "kg",
    "clinicalTags": [
      "lowest_weight"
    ]
  },
  {
    "id": "peripheral_edema_present",
    "label": "Peripheral Ankle or Leg Swelling",
    "label_en": "Do you experience fluid retention or swelling in your feet/ankles?",
    "label_bn": "পা বা গোড়ালিতে পানি আসা বা ফোলা ভাব লক্ষ্য করেছেন কি?",
    "domain": "anthropometrics",
    "answerType": "select",
    "options": [
      {
        "value": "none",
        "label": "No swelling",
        "label_en": "No peripheral edema",
        "label_bn": "কোনো ফোলা ভাব নেই"
      },
      {
        "value": "mild_evening_dependent",
        "label": "Mild ankle swelling after standing/evening",
        "label_en": "Mild evening dependent edema",
        "label_bn": "সন্ধ্যায় বা দীর্ঘক্ষণ দাঁড়ালে গোড়ালিতে সামান্য ফোলা"
      },
      {
        "value": "moderate_pitting",
        "label": "Pitting edema (indentation remains when pressed)",
        "label_en": "Pitting edema",
        "label_bn": "চাপ দিলে বসে যায় এমন স্পষ্ট ফোলা (পিটিং এডিমা)"
      },
      {
        "value": "severe_bilateral_legs",
        "label": "Severe swelling extending up to shins/knees",
        "label_en": "Bilateral severe leg edema",
        "label_bn": "হাঁটু পর্যন্ত ছড়িয়ে পড়া তীব্র ফোলা"
      }
    ],
    "clinicalTags": [
      "peripheral_edema",
      "fluid_retention"
    ]
  },
  {
    "id": "clothing_fit_recent",
    "label": "Recent Clothing Fit Changes",
    "label_en": "How have clothes been fitting around your waist in the last 2-3 months?",
    "label_bn": "গত ২-৩ মাসে পোশাকের কোমরের মাপ কেমন অনুভব করছেন?",
    "domain": "anthropometrics",
    "answerType": "select",
    "options": [
      {
        "value": "noticeably_tighter",
        "label": "Tighter around the waistband",
        "label_en": "Noticeably tighter",
        "label_bn": "কোমরে ক্রমশ আঁটসাঁট হয়ে যাচ্ছে"
      },
      {
        "value": "fitting_same",
        "label": "Fitting exactly the same",
        "label_en": "Unchanged fit",
        "label_bn": "একই রকম রয়েছে"
      },
      {
        "value": "getting_looser",
        "label": "Looser / need a smaller belt notch",
        "label_en": "Looser waist",
        "label_bn": "ঢিলেঢালা হয়ে যাচ্ছে / বেল্টের ফুটো বদলাতে হচ্ছে"
      }
    ],
    "clinicalTags": [
      "waist_trend"
    ]
  },
  {
    "id": "neck_circumference_bracket",
    "label": "Neck Circumference Measurement",
    "label_en": "Do you have a thick neck circumference (>40cm for men, >36cm for women, OSA risk)?",
    "label_bn": "আপনার ঘাড়ের পরিধি কি তুলনামূলক মোটা (>৪০ সেমি পুরুষ, >৩৬ সেমি নারী)?",
    "domain": "anthropometrics",
    "answerType": "select",
    "options": [
      {
        "value": "normal_neck",
        "label": "Normal neck circumference",
        "label_en": "Normal neck",
        "label_bn": "স্বাভাবিক ঘাড়ের পরিধি"
      },
      {
        "value": "enlarged_thick_neck",
        "label": "Thick neck / shirts tight at collar (OSA & metabolic risk)",
        "label_en": "Thick neck (>40cm/36cm)",
        "label_bn": "মোটা ঘাড় / শার্টের কলার আঁটসাঁট (স্লিপ অ্যাপনিয়ার ঝুঁকি)"
      }
    ],
    "clinicalTags": [
      "neck_circumference",
      "osa_risk"
    ]
  },
  {
    "id": "muscle_wasting_loss_strength",
    "label": "Perceived Loss of Muscle Tone or Grip Strength",
    "label_en": "Have you noticed diminishing muscle firmness, softer muscles, or weaker handgrip?",
    "label_bn": "মাংসপেশির শক্তি কমে যাওয়া বা হাতের মুঠোর শক্তি দুর্বল মনে হয় কি?",
    "domain": "anthropometrics",
    "answerType": "yesno",
    "clinicalTags": [
      "muscle_loss",
      "sarcopenia_sign"
    ]
  },
  {
    "id": "visceral_belly_firmness",
    "label": "Belly Firmness (Hard vs Soft Adiposity)",
    "label_en": "Is your abdominal protrusion hard and firm (visceral fat) or soft and pinchable (subcutaneous)?",
    "label_bn": "পেটের ফোলা অংশটি কি শক্ত ও টানটান (ভিসারাল ফ্যাট) নাকি নরম ও চেপে ধরা যায়?",
    "domain": "anthropometrics",
    "answerType": "select",
    "options": [
      {
        "value": "hard_firm_protruding",
        "label": "Hard, firm protruding belly (High visceral fat risk)",
        "label_en": "Hard / firm visceral",
        "label_bn": "শক্ত ও টানটান পেট (উচ্চ ভিসারাল ফ্যাটের ঝুঁকি)"
      },
      {
        "value": "soft_pinchable",
        "label": "Soft, loose, pinchable subcutaneous fat",
        "label_en": "Soft subcutaneous",
        "label_bn": "নরম চামড়ার নিচে জমে থাকা মেদ"
      },
      {
        "value": "flat_minimal_belly",
        "label": "Flat or minimal abdominal fat",
        "label_en": "Minimal belly",
        "label_bn": "পেট সমতল বা মেদহীন"
      }
    ],
    "clinicalTags": [
      "visceral_firmness",
      "steatohepatitis_risk"
    ]
  },
  {
    "id": "facial_puffiness_morning",
    "label": "Morning Facial & Eyelid Puffiness",
    "label_en": "Do you wake with visible puffiness around your eyelids and face that subsides later?",
    "label_bn": "সকালে ঘুম থেকে উঠলে কি চোখ-মুখ ফোলা থাকে যা দুপুরের দিকে কমে যায়?",
    "domain": "anthropometrics",
    "answerType": "yesno",
    "clinicalTags": [
      "facial_edema",
      "renal_or_thyroid_sign"
    ]
  },
  {
    "id": "calf_thinning_sarcopenia",
    "label": "Calf Thinning Relative to Abdomen",
    "label_en": "Have your lower legs or calves become unusually thin while your belly expanded?",
    "label_bn": "পেটের তুলনায় আপনার পায়ের ডিম বা নিচের অংশ কি অস্বাভাবিক শুকিয়ে গেছে?",
    "domain": "anthropometrics",
    "answerType": "yesno",
    "clinicalTags": [
      "calf_thinning",
      "sarcopenic_obesity"
    ]
  },
  {
    "id": "diagnosed_diabetes_prediabetes",
    "label": "Diabetes or Prediabetes Diagnosis",
    "label_en": "Have you been diagnosed with Type 2 Diabetes, Prediabetes, or Impaired Fasting Glucose?",
    "label_bn": "আপনার কি টাইপ ২ ডায়াবেটিস বা প্রি-ডায়াবেটিস শনাক্ত হয়েছে?",
    "domain": "metabolic",
    "answerType": "select",
    "isHighValueScreening": true,
    "options": [
      {
        "value": "no_normal_glucose",
        "label": "No (Normal Blood Sugar)",
        "label_en": "No (Normal Blood Sugar)",
        "label_bn": "না (রক্তে শর্করা স্বাভাবিক)"
      },
      {
        "value": "prediabetes_impaired",
        "label": "Prediabetes / Borderline (HbA1c 5.7 - 6.4%)",
        "label_en": "Prediabetes (HbA1c 5.7-6.4%)",
        "label_bn": "প্রি-ডায়াবেটিস বা বর্ডারলাইন (HbA1c ৫.৭-৬.৪%)"
      },
      {
        "value": "type_2_diabetes",
        "label": "Type 2 Diabetes (HbA1c >= 6.5%)",
        "label_en": "Type 2 Diabetes",
        "label_bn": "টাইপ ২ ডায়াবেটিস"
      },
      {
        "value": "gestational_diabetes_past",
        "label": "Past Gestational Diabetes (GDM)",
        "label_en": "Past Gestational Diabetes",
        "label_bn": "অতীতে গর্ভাবস্থায় ডায়াবেটিস ছিল"
      }
    ],
    "clinicalTags": [
      "diabetes_status",
      "glycemic_dysregulation"
    ]
  },
  {
    "id": "postprandial_fatigue",
    "label": "Post-Meal Energy Crash (Food Coma)",
    "label_en": "Do you experience severe sleepiness, lethargy, or brain fog 30-90 minutes after eating carbohydrate-rich meals?",
    "label_bn": "ভাত বা ভারী খাবারের ৩০-৯০ মিনিট পর কি প্রচণ্ড ঘুম বা ক্লান্তি লাগে?",
    "domain": "metabolic",
    "answerType": "yesno",
    "isHighValueScreening": true,
    "clinicalTags": [
      "postprandial_fatigue",
      "reactive_hypoglycemia",
      "insulin_resistance"
    ]
  },
  {
    "id": "sugar_carbohydrate_cravings",
    "label": "Sweet or Refined Carbohydrate Cravings",
    "label_en": "How strong are your daily cravings for sugar, sweets, or refined carbohydrates (biscuits, bakery)?",
    "label_bn": "মিষ্টি, চিনিযুক্ত খাবার বা বেকারি বিস্কুটের প্রতি আপনার তীব্র আকাঙ্ক্ষা কতটা?",
    "domain": "metabolic",
    "answerType": "select",
    "isHighValueScreening": true,
    "options": [
      {
        "value": "rarely_never",
        "label": "Rarely or never",
        "label_en": "Minimal cravings",
        "label_bn": "খুব কম বা কখনই না"
      },
      {
        "value": "moderate_after_meals",
        "label": "Moderate cravings specifically after lunch or dinner",
        "label_en": "Moderate post-meal",
        "label_bn": "খাবারের পরপরই মিষ্টি খাওয়ার মৃদু ইচ্ছা"
      },
      {
        "value": "intense_afternoon_evening",
        "label": "Intense afternoon (3-5 PM) or late-night cravings",
        "label_en": "Intense 3-5 PM cravings",
        "label_bn": "বিকেল ৩-৫টা বা গভীর রাতে তীব্র মিষ্টির টান"
      },
      {
        "value": "uncontrollable_daily",
        "label": "Uncontrollable daily urge that impairs diet adherence",
        "label_en": "Uncontrollable daily urges",
        "label_bn": "নিয়ন্ত্রণহীন দৈনিক আকাঙ্ক্ষা"
      }
    ],
    "clinicalTags": [
      "sugar_cravings",
      "dopamine_glycemic_loop"
    ]
  },
  {
    "id": "shakiness_if_meal_delayed",
    "label": "Shakiness or Irritability when Meals Delayed",
    "label_en": "Do you experience trembling hands, sweatiness, dizziness, or intense irritability (hangry) if meals are delayed past your normal hour?",
    "label_bn": "নির্দিষ্ট সময়ে খাবার না পেলে কি হাত কাঁপা, মাথা ঘোরা বা প্রচণ্ড রাগ/খিটখিটে ভাব হয়?",
    "domain": "metabolic",
    "answerType": "yesno",
    "isHighValueScreening": true,
    "clinicalTags": [
      "hypoglycemia_tendency",
      "glycemic_instability"
    ]
  },
  {
    "id": "blood_pressure_history",
    "label": "Blood Pressure Classification",
    "label_en": "Current blood pressure diagnosis or historical reading pattern",
    "label_bn": "বর্তমান রক্তচাপের অবস্থা বা চিকিৎসকের নির্ণয়",
    "domain": "metabolic",
    "answerType": "select",
    "isHighValueScreening": true,
    "options": [
      {
        "value": "optimal_normal",
        "label": "Normal (< 120/80 mmHg)",
        "label_en": "Optimal (< 120/80 mmHg)",
        "label_bn": "স্বাভাবিক (< ১২০/৮০)"
      },
      {
        "value": "elevated_prehypertension",
        "label": "Elevated / Prehypertension (120-129 / < 80 mmHg)",
        "label_en": "Prehypertension",
        "label_bn": "সামান্য বেশি (১২০-১২৯ / < ৮০)"
      },
      {
        "value": "hypertension_stage_1",
        "label": "Stage 1 Hypertension (130-139 / 80-89 mmHg)",
        "label_en": "Stage 1 HTN",
        "label_bn": "গ্রেড ১ উচ্চ রক্তচাপ (১৩০-১৩৯ / ৮০-৮৯)"
      },
      {
        "value": "hypertension_stage_2",
        "label": "Stage 2 Hypertension (>= 140/90 mmHg)",
        "label_en": "Stage 2 HTN",
        "label_bn": "গ্রেড ২ উচ্চ রক্তচাপ (>= ১৪০/৯০)"
      },
      {
        "value": "medication_controlled",
        "label": "Hypertension controlled by daily anti-hypertensive medication",
        "label_en": "Medication controlled",
        "label_bn": "নিয়মিত ওষুধ সেবনের মাধ্যমে নিয়ন্ত্রিত"
      }
    ],
    "clinicalTags": [
      "blood_pressure",
      "cardiovascular_risk"
    ]
  },
  {
    "id": "nocturnal_urination_frequency",
    "label": "Nocturia (Waking to Urinate at Night)",
    "label_en": "How many times per night do you wake up specifically to urinate?",
    "label_bn": "রাতে প্রস্রাবের জন্য সাধারণত কতবার ঘুম ভাঙে?",
    "domain": "metabolic",
    "answerType": "select",
    "options": [
      {
        "value": "zero_times",
        "label": "0 times (sleep through the night)",
        "label_en": "0 times",
        "label_bn": "০ বার (ঘুম ভাঙে না)"
      },
      {
        "value": "one_time",
        "label": "1 time per night",
        "label_en": "1 time",
        "label_bn": "১ বার"
      },
      {
        "value": "two_to_three_times",
        "label": "2 to 3 times per night",
        "label_en": "2-3 times",
        "label_bn": "২ থেকে ৩ বার"
      },
      {
        "value": "four_plus_times",
        "label": "4 or more times (disrupts sleep severely)",
        "label_en": "4+ times",
        "label_bn": "৪ বার বা তার বেশি"
      }
    ],
    "clinicalTags": [
      "nocturia",
      "osmotic_diuresis",
      "prostate_or_glycemia"
    ]
  },
  {
    "id": "excessive_thirst_polydipsia",
    "label": "Excessive Thirst (Polydipsia)",
    "label_en": "Do you experience an unquenchable, constant thirst and dry mouth even after drinking adequate water?",
    "label_bn": "পর্যাপ্ত পানি পানের পরও কি অস্বাভাবিক বা অতৃপ্ত তৃষ্ণা পায়?",
    "domain": "metabolic",
    "answerType": "yesno",
    "clinicalTags": [
      "polydipsia",
      "osmotic_thirst"
    ]
  },
  {
    "id": "acanthosis_nigricans_skin_tags",
    "label": "Darkened Skin Folds or Multiple Skin Tags",
    "label_en": "Have you noticed velvety darkening of skin around the neck, armpits, or groin, or multiple small skin tags?",
    "label_bn": "ঘাড়ের চারপাশে, বগলে বা কুঁচকিতে কালো ছোপ (অ্যাকান্থোসিস) বা ছোট আঁচিল দেখা দিয়েছে কি?",
    "domain": "metabolic",
    "answerType": "yesno",
    "clinicalTags": [
      "acanthosis_nigricans",
      "hyperinsulinemia_marker"
    ]
  },
  {
    "id": "reactive_hypoglycemia_timing",
    "label": "Timing of Reactive Energy Slumps",
    "label_en": "When do lightheadedness, shakiness, or cold sweats occur most prominently?",
    "label_bn": "মাথা ঘোরা বা হাত কাঁপার মতো সমস্যাগুলো কখন বেশি অনুভূত হয়?",
    "domain": "metabolic",
    "answerType": "select",
    "options": [
      {
        "value": "none",
        "label": "Does not occur",
        "label_en": "None",
        "label_bn": "হয় না"
      },
      {
        "value": "one_two_hours_post_carb",
        "label": "1 to 2 hours after a heavy rice/sweet meal (Rebound hypoglycemia)",
        "label_en": "1-2h post carbohydrate",
        "label_bn": "ভারী ভাত বা মিষ্টি খাওয়ার ১-২ ঘণ্টা পর"
      },
      {
        "value": "extended_fasting_only",
        "label": "Only after prolonged fasting (> 6-8 hours without food)",
        "label_en": "Extended fasting only",
        "label_bn": "দীর্ঘক্ষণ খালি পেটে থাকলে (৬-৮ ঘণ্টার বেশি)"
      }
    ],
    "clinicalTags": [
      "reactive_hypoglycemia",
      "insulin_spike"
    ]
  },
  {
    "id": "high_uric_acid_gout_history",
    "label": "Uric Acid Elevation or Gout Flares",
    "label_en": "Have you experienced elevated blood uric acid or sudden painful big toe/joint swelling (Gout)?",
    "label_bn": "রক্তে ইউরিক এসিড বেশি বা পায়ের বৃদ্ধাঙ্গুলে তীব্র ব্যথাসহ ফোলা (গাউট) হয়েছে কি?",
    "domain": "metabolic",
    "answerType": "select",
    "options": [
      {
        "value": "normal_uric_acid",
        "label": "Normal / Never tested high",
        "label_en": "Normal uric acid",
        "label_bn": "স্বাভাবিক ইউরিক এসিড"
      },
      {
        "value": "asymptomatic_high_uric",
        "label": "High blood uric acid on lab test, but no joint pain",
        "label_en": "Asymptomatic hyperuricemia",
        "label_bn": "রক্ত পরীক্ষায় বেশি এসেছে কিন্তু কোনো জয়েন্টে ব্যথা নেই"
      },
      {
        "value": "active_gout_attacks",
        "label": "Diagnosed Gout with acute painful joint flares",
        "label_en": "Active Gout flares",
        "label_bn": "গাউট বা তীব্র অস্থিসন্ধির প্রদাহের ইতিহাস রয়েছে"
      }
    ],
    "clinicalTags": [
      "uric_acid",
      "gout_purine_risk"
    ]
  },
  {
    "id": "triglyceride_cholesterol_history",
    "label": "Dyslipidemia History (Triglycerides & HDL)",
    "label_en": "Have recent blood tests shown high triglycerides (>150 mg/dL) or low HDL (<40/50 mg/dL)?",
    "label_bn": "রক্তে ট্রাইগ্লিসারাইড বেশি (>১৫০) বা ভালো কোলেস্টেরল এইচডিএল কম আছে কি?",
    "domain": "metabolic",
    "answerType": "yesno",
    "clinicalTags": [
      "dyslipidemia",
      "atherogenic_dyslipidemia",
      "tg_hdl_ratio"
    ]
  },
  {
    "id": "artificial_sweetener_usage",
    "label": "Daily Artificial Sweetener Use (Diet Drinks/Splenda)",
    "label_en": "Do you consume artificial sweeteners (sucralose, aspartame, stevia drops) daily in tea or diet sodas?",
    "label_bn": "চা বা ডায়েট ড্রিংকসে কি প্রতিদিন কৃত্রিম সুইটনার ব্যবহার করেন?",
    "domain": "metabolic",
    "answerType": "select",
    "options": [
      {
        "value": "never_rarely",
        "label": "Never or rarely",
        "label_en": "Never",
        "label_bn": "কখনই না বা খুব কদাচিৎ"
      },
      {
        "value": "one_to_two_tablets",
        "label": "1-2 tablets daily in tea",
        "label_en": "1-2 tablets daily",
        "label_bn": "দিনে ১-২টি ট্যাবলেট"
      },
      {
        "value": "heavy_multiple_daily",
        "label": "Multiple packets/diet drinks daily (gut microbiome alteration risk)",
        "label_en": "Heavy daily use",
        "label_bn": "দিনে একাধিক প্যাকেট বা ডায়েট কোলা"
      }
    ],
    "clinicalTags": [
      "artificial_sweeteners",
      "microbiome_glucose_intolerance"
    ]
  },
  {
    "id": "fasting_tolerance_hours",
    "label": "Comfortable Fasting Tolerance Without Distress",
    "label_en": "How many hours can you comfortably go without food during waking hours without weakness, migraine, or shaking?",
    "label_bn": "দিনের বেলা দুর্বলতা বা মাথাব্যথা ছাড়া আপনি টানা কত ঘণ্টা না খেয়ে থাকতে পারেন?",
    "domain": "metabolic",
    "answerType": "select",
    "options": [
      {
        "value": "under_3_hours",
        "label": "< 3 hours (Must graze constantly)",
        "label_en": "< 3 hours",
        "label_bn": "৩ ঘণ্টার কম (ঘনঘন খেতে হয়)"
      },
      {
        "value": "4_to_5_hours",
        "label": "4 to 5 hours (Standard inter-meal interval)",
        "label_en": "4-5 hours",
        "label_bn": "৪ থেকে ৫ ঘণ্টা (স্বাভাবিক বিরতি)"
      },
      {
        "value": "6_to_14_hours",
        "label": "6 to 14 hours comfortably (Intermittent fasting capable)",
        "label_en": "6-14 hours",
        "label_bn": "৬ থেকে ১৪ ঘণ্টা (ইন্টারমিটেন্ট ফাস্টিংয়ে অভ্যস্ত)"
      }
    ],
    "clinicalTags": [
      "metabolic_flexibility",
      "fat_oxidation_capacity"
    ]
  },
  {
    "id": "cold_hands_feet_metabolic",
    "label": "Cold Hands and Feet (Peripheral Vasoconstriction)",
    "label_en": "Do your hands and feet feel persistently ice cold even in warm weather?",
    "label_bn": "গরমের দিনেও কি হাত ও পায়ের তালু অস্বাভাবিক বরফের মতো ঠান্ডা থাকে?",
    "domain": "metabolic",
    "answerType": "yesno",
    "clinicalTags": [
      "cold_extremities",
      "vasoconstriction_metabolic"
    ]
  },
  {
    "id": "salt_sodium_craving_intensity",
    "label": "Craving for Salty Foods / Pickles",
    "label_en": "Do you experience strong cravings for salty snacks, chanachur, or add extra table salt to your rice?",
    "label_bn": "লবণাক্ত খাবার, চানাচুর বা পাতে বাড়তি কাঁচা লবণ নেওয়ার তীব্র অভ্যাস আছে কি?",
    "domain": "metabolic",
    "answerType": "select",
    "options": [
      {
        "value": "normal_no_craving",
        "label": "No particular salt craving",
        "label_en": "Normal salt appetite",
        "label_bn": "লবণের প্রতি বিশেষ টান নেই"
      },
      {
        "value": "adds_table_salt_habit",
        "label": "Habitually adds extra raw table salt to every meal",
        "label_en": "Adds table salt habitually",
        "label_bn": "নিয়মিত পাতে বাড়তি কাঁচা লবণ খাই"
      },
      {
        "value": "craves_salty_snacks",
        "label": "Strong urges for salty chanachur, chips, or salted pickles",
        "label_en": "Craves salty snacks",
        "label_bn": "লবণাক্ত চানাচুর, চিপস বা আচার খুব পছন্দ"
      }
    ],
    "clinicalTags": [
      "salt_craving",
      "adrenal_aldosterone_or_hypertension"
    ]
  },
  {
    "id": "hba1c_latest_known_value",
    "label": "Latest Measured HbA1c Percentage",
    "label_en": "If known, what was your most recent HbA1c test result (%)?",
    "label_bn": "জানা থাকলে আপনার সর্বশেষ HbA1c রক্ত পরীক্ষার ফলাফল কত ছিল (%)?",
    "domain": "metabolic",
    "answerType": "number",
    "unit": "%",
    "clinicalTags": [
      "hba1c_value"
    ]
  },
  {
    "id": "bloating_frequency",
    "label": "Bloating Frequency & Onset",
    "label_en": "How frequently do you experience abdominal distension or bloating?",
    "label_bn": "পেট ফাঁপা বা পেট ভারী লাগার সমস্যাটি কত ঘনঘন হয়?",
    "domain": "gastrointestinal",
    "answerType": "select",
    "isHighValueScreening": true,
    "options": [
      {
        "value": "never_rare",
        "label": "Never or rarely",
        "label_en": "Never or rarely",
        "label_bn": "কখনই না বা খুব কদাচিৎ"
      },
      {
        "value": "mild_occasional",
        "label": "Mild, 1-2 days per week",
        "label_en": "Mild, 1-2 days/week",
        "label_bn": "মৃদু, সপ্তাহে ১-২ দিন"
      },
      {
        "value": "frequent_post_meals",
        "label": "Frequent, builds progressively after meals through the day",
        "label_en": "Builds progressively through day",
        "label_bn": "ঘনঘন, দুপুরের পর থেকে পেটের ফোলা ভাব বাড়তে থাকে"
      },
      {
        "value": "constant_severe_distension",
        "label": "Daily, severe visible distension (like a balloon)",
        "label_en": "Severe daily visible distension",
        "label_bn": "প্রতিদিন তীব্রভাবে পেট ফুলে থাকে"
      }
    ],
    "clinicalTags": [
      "bloating",
      "fermentation_dysbiosis"
    ]
  },
  {
    "id": "bloating_trigger_foods",
    "label": "Identified Trigger Foods for Bloating",
    "label_en": "Which specific foods trigger immediate gas, cramps, or bloating?",
    "label_bn": "কোন কোন খাবার খাওয়ার পর পেটে গ্যাস বা অস্বস্তি বাড়ে?",
    "domain": "gastrointestinal",
    "answerType": "multiselect",
    "options": [
      {
        "value": "dairy_milk",
        "label": "Cow's Milk, Tok Doi, or Paneer",
        "label_en": "Dairy products",
        "label_bn": "দুধ বা দুগ্ধজাত খাদ্য"
      },
      {
        "value": "lentils_pulses",
        "label": "Dal, Chola, Boot, or Bean seeds",
        "label_en": "Lentils and pulses",
        "label_bn": "ডাল, ছোলা বা শিমের বিচি"
      },
      {
        "value": "wheat_flour",
        "label": "Atta Roti, Paratha, Bread, or Biscuits",
        "label_en": "Wheat products",
        "label_bn": "আটার রুটি, পরোটা বা বিস্কুট"
      },
      {
        "value": "cruciferous_veg",
        "label": "Cabbage, Cauliflower, Broccoli, Radish",
        "label_en": "Cruciferous vegetables",
        "label_bn": "বাঁধাকপি, ফুলকপি বা মূলা"
      },
      {
        "value": "onion_garlic",
        "label": "Heavy raw or cooked onion/garlic curries",
        "label_en": "Onion / Garlic",
        "label_bn": "অতিরিক্ত পেঁয়াজ বা রসুনযুক্ত ঝোল"
      },
      {
        "value": "deep_fried_oily",
        "label": "Deep-fried street snacks (singara, puri)",
        "label_en": "Fried / greasy foods",
        "label_bn": "তেলে ভাজা খাবার (সিঙ্গাড়া, পুরি)"
      }
    ],
    "clinicalTags": [
      "food_triggers",
      "fodmap_sensitivity"
    ]
  },
  {
    "id": "acid_reflux_frequency",
    "label": "Acid Reflux & Heartburn Frequency",
    "label_en": "How frequently do you experience retrosternal burning, sour burps, or regurgitation?",
    "label_bn": "বুক জ্বালাপোড়া বা টক ঢেঁকুরের সমস্যা কত ঘনঘন হয়?",
    "domain": "gastrointestinal",
    "answerType": "select",
    "isHighValueScreening": true,
    "options": [
      {
        "value": "never_rare",
        "label": "Never or rarely",
        "label_en": "Never or rarely",
        "label_bn": "কখনই না বা কদাচিৎ"
      },
      {
        "value": "occasional_after_spicy",
        "label": "Occasional after heavy/spicy meals",
        "label_en": "Occasional post-spicy",
        "label_bn": "ভারী বা ঝাল খাবারের পর মাঝে মাঝে"
      },
      {
        "value": "frequent_multiple_week",
        "label": "Frequent (3-4 days per week)",
        "label_en": "3-4 days/week",
        "label_bn": "নিয়মিত (সপ্তাহে ৩-৪ দিন)"
      },
      {
        "value": "daily_nighttime_reflux",
        "label": "Daily or nocturnal reflux waking from sleep",
        "label_en": "Daily / Nocturnal reflux",
        "label_bn": "প্রতিদিন বা রাতে ঘুমানোর পর তীব্র বুক জ্বালা"
      }
    ],
    "clinicalTags": [
      "acid_reflux",
      "gerd",
      "les_incompetence"
    ]
  },
  {
    "id": "early_satiety",
    "label": "Early Satiety (Fullness After Small Bites)",
    "label_en": "Do you feel uncomfortably full after only eating a few small mouthfuls of food?",
    "label_bn": "কয়েক লোকমা খাবার খাওয়ার পরই কি অস্বাভাবিক পেট ভরা বা খাবার আটকে থাকার অনুভূতি হয়?",
    "domain": "gastrointestinal",
    "answerType": "yesno",
    "isHighValueScreening": true,
    "clinicalTags": [
      "early_satiety",
      "delayed_gastric_emptying",
      "gastroparesis_sign"
    ]
  },
  {
    "id": "upper_abdominal_burning_timing",
    "label": "Stomach Burning Timing Relation to Food",
    "label_en": "When does epigastric or stomach burning feel most intense?",
    "label_bn": "পেটের উপরিভাগে জ্বালাপোড়া বা ব্যথা কখন বেশি হয়?",
    "domain": "gastrointestinal",
    "answerType": "select",
    "options": [
      {
        "value": "no_burning",
        "label": "No burning pain",
        "label_en": "No burning",
        "label_bn": "জ্বালাপোড়া হয় না"
      },
      {
        "value": "empty_stomach_relieved_food",
        "label": "Worse on empty stomach, relieved by eating (Duodenal pattern)",
        "label_en": "Worse empty, relieved by eating",
        "label_bn": "খালি পেটে বাড়ে, কিছু খেলে কমে"
      },
      {
        "value": "immediately_after_eating",
        "label": "Worse immediately after food intake (Gastric ulcer pattern)",
        "label_en": "Worse after food",
        "label_bn": "খাওয়ার সাথে সাথেই ব্যথা বাড়ে"
      },
      {
        "value": "late_night_waking",
        "label": "Wakes you at 2-3 AM with burning pain",
        "label_en": "Wakes at 2-3 AM",
        "label_bn": "গভীর রাতে পেটের ব্যথায় ঘুম ভেঙে যায়"
      }
    ],
    "clinicalTags": [
      "peptic_ulcer_pattern",
      "epigastric_pain"
    ]
  },
  {
    "id": "nausea_vomiting_frequency",
    "label": "Nausea or Vomiting Episodes",
    "label_en": "Do you experience recurrent nausea or vomiting unrelated to pregnancy?",
    "label_bn": "বমি ভাব বা বমি হওয়ার সমস্যা আছে কি?",
    "domain": "gastrointestinal",
    "answerType": "select",
    "options": [
      {
        "value": "none",
        "label": "No nausea",
        "label_en": "No nausea",
        "label_bn": "বমি ভাব হয় না"
      },
      {
        "value": "occasional_motion_or_indigestion",
        "label": "Occasional with motion or severe indigestion",
        "label_en": "Occasional",
        "label_bn": "মাঝে মাঝে বদহজম হলে"
      },
      {
        "value": "frequent_morning_nausea",
        "label": "Frequent morning nausea without vomiting",
        "label_en": "Frequent morning nausea",
        "label_bn": "সকালে ঘুম থেকে উঠলে বমি বমি ভাব"
      },
      {
        "value": "vomiting_undigested_food",
        "label": "Recurrent vomiting of undigested meals hours later",
        "label_en": "Vomiting undigested food",
        "label_bn": "খাওয়ার কয়েক ঘণ্টা পরও অপাচিত খাবার বমি হওয়া"
      }
    ],
    "clinicalTags": [
      "nausea",
      "gastric_motility"
    ]
  },
  {
    "id": "incomplete_evacuation_urgency",
    "label": "Bowel Urgency & Incomplete Evacuation",
    "label_en": "Do you feel an urgent rush to the toilet or a sensation of incomplete evacuation (tenesmus)?",
    "label_bn": "মলত্যাগের পর কি মনে হয় পেট পুরোপুরি পরিষ্কার হয়নি, অথবা হঠাৎ তীব্র বেগ হয়?",
    "domain": "gastrointestinal",
    "answerType": "yesno",
    "clinicalTags": [
      "tenesmus",
      "pelvic_floor_or_ibs"
    ]
  },
  {
    "id": "belching_latency_timing",
    "label": "Belching Onset Time After Meals",
    "label_en": "When does frequent belching or burping occur after eating?",
    "label_bn": "খাবার খাওয়ার কতক্ষণ পর ঘনঘন ঢেঁকুর ওঠে?",
    "domain": "gastrointestinal",
    "answerType": "select",
    "options": [
      {
        "value": "minimal_no_belching",
        "label": "Minimal or normal belching",
        "label_en": "Minimal belching",
        "label_bn": "খুব সামান্য বা স্বাভাবিক"
      },
      {
        "value": "immediate_first_15_mins",
        "label": "Immediately within 5-15 mins of eating (Hypochlorhydria sign)",
        "label_en": "Immediate <15 mins",
        "label_bn": "খাওয়ার ৫-১৫ মিনিটের মধ্যেই (পাকস্থলীর এসিড ঘাটতি)"
      },
      {
        "value": "delayed_one_to_two_hours",
        "label": "Delayed, 1-2 hours later with stomach distension (SIBO sign)",
        "label_en": "Delayed 1-2 hours",
        "label_bn": "খাওয়ার ১-২ ঘণ্টা পর পেট ফাঁপাসহ ঢেঁকুর"
      }
    ],
    "clinicalTags": [
      "belching_timing",
      "hypochlorhydria",
      "sibo_fermentation"
    ]
  },
  {
    "id": "lactose_dairy_symptom_types",
    "label": "Lactose & Dairy Tolerance Pattern",
    "label_en": "What specific symptoms develop after drinking a glass of whole cow's milk?",
    "label_bn": "এক গ্লাস গরুর দুধ পানের পর আপনার কী ধরনের প্রতিক্রিয়া হয়?",
    "domain": "gastrointestinal",
    "answerType": "multiselect",
    "options": [
      {
        "value": "tolerates_well",
        "label": "No issues, digests dairy easily",
        "label_en": "Tolerates well",
        "label_bn": "কোনো সমস্যা হয় না, সহজে হজম হয়"
      },
      {
        "value": "gas_bloating_rumbling",
        "label": "Loud abdominal gurgling, gas, and cramps within 2 hours",
        "label_en": "Gas & cramping",
        "label_bn": "পেটে গুড়গুড় শব্দ, গ্যাস ও পেটে মোচড়"
      },
      {
        "value": "loose_watery_diarrhea",
        "label": "Loose watery urgent diarrhea",
        "label_en": "Watery diarrhea",
        "label_bn": "পাতলা পায়খানা বা ডায়রিয়া"
      },
      {
        "value": "phlegm_congestion",
        "label": "Increased throat phlegm or sinus congestion (casein sensitivity)",
        "label_en": "Phlegm & mucus",
        "label_bn": "গলায় কফ জমা বা নাকে শ্লেষ্মা বৃদ্ধি"
      }
    ],
    "clinicalTags": [
      "lactose_intolerance",
      "casein_sensitivity"
    ]
  },
  {
    "id": "gluten_wheat_tolerance_pattern",
    "label": "Wheat & Gluten Tolerance",
    "label_en": "How do you feel after consuming atta roti, paratha, or wheat bread?",
    "label_bn": "আটার রুটি, পরোটা বা গমজাতীয় খাবার খাওয়ার পর কেমন অনুভব করেন?",
    "domain": "gastrointestinal",
    "answerType": "select",
    "options": [
      {
        "value": "tolerates_wheat_fine",
        "label": "Digests wheat fine without any discomfort",
        "label_en": "Tolerates fine",
        "label_bn": "স্বাভাবিকভাবে হজম হয়"
      },
      {
        "value": "bloating_brainfog_wheat",
        "label": "Causes abdominal distension, lethargy, or brain fog (Non-celiac wheat sensitivity)",
        "label_en": "Bloating and brain fog",
        "label_bn": "পেট ফাঁপে এবং শরীরে ক্লান্তি ও অলসতা ভর করে"
      },
      {
        "value": "severe_diarrhea_joint_pain",
        "label": "Severe gastrointestinal pain, diarrhea, or joint flare-up",
        "label_en": "Severe distress",
        "label_bn": "তীব্র পেটে ব্যথা, ডায়রিয়া বা অস্থিসন্ধিতে ব্যথা"
      }
    ],
    "clinicalTags": [
      "gluten_sensitivity",
      "ncws",
      "wheat_fructan"
    ]
  },
  {
    "id": "stomach_cramping_location",
    "label": "Abdominal Cramping Predominant Location",
    "label_en": "Where is abdominal pain or cramping most commonly felt?",
    "label_bn": "পেটের ব্যথা বা মোচড় প্রধানত কোন অংশে অনুভূত হয়?",
    "domain": "gastrointestinal",
    "answerType": "select",
    "options": [
      {
        "value": "no_cramping",
        "label": "No significant cramping",
        "label_en": "No cramping",
        "label_bn": "ব্যথা হয় না"
      },
      {
        "value": "epigastric_center",
        "label": "Upper central abdomen under ribcage",
        "label_en": "Upper central",
        "label_bn": "পেটের উপরিভাগে বুকের ঠিক নিচে"
      },
      {
        "value": "periumbilical_around_navel",
        "label": "Around the navel / mid-abdomen",
        "label_en": "Around navel",
        "label_bn": "নাভির চারদিকে"
      },
      {
        "value": "lower_left_colon",
        "label": "Lower left quadrant (sigmoid colon / IBS spasm)",
        "label_en": "Lower left quadrant",
        "label_bn": "তলপেটের বাম পাশে (আইবিএস স্পাজম)"
      },
      {
        "value": "lower_right_iliac",
        "label": "Lower right quadrant (ileocecal valve region)",
        "label_en": "Lower right quadrant",
        "label_bn": "তলপেটের ডান পাশে"
      }
    ],
    "clinicalTags": [
      "abdominal_pain_location",
      "ibs_spasm"
    ]
  },
  {
    "id": "laxative_use_dependency",
    "label": "Laxative or Stool Softener Use",
    "label_en": "Do you rely on daily or weekly laxatives, senna tea, or enemas to pass stool?",
    "label_bn": "মলত্যাগের জন্য কি নিয়মিত জোলাপ, সোনাপাতা, সিরাপ বা সাপোজিটরি ব্যবহার করতে হয়?",
    "domain": "gastrointestinal",
    "answerType": "select",
    "options": [
      {
        "value": "never_use_laxatives",
        "label": "Never use laxatives",
        "label_en": "Never",
        "label_bn": "কখনই প্রয়োজন হয় না"
      },
      {
        "value": "occasional_ispaghula_husk",
        "label": "Occasional Ispaghula Husk (Eshobguler Bhushi) with water",
        "label_en": "Occasional psyllium",
        "label_bn": "মাঝে মাঝে ইসবগুলের ভুসি খাই"
      },
      {
        "value": "daily_stimulant_laxatives",
        "label": "Dependent on daily laxatives, dulcolax, or senna pills",
        "label_en": "Dependent on laxatives",
        "label_bn": "নিয়মিত জোলাপ বা ওষুধ ছাড়া মলত্যাগ হয় না"
      }
    ],
    "clinicalTags": [
      "laxative_use",
      "motility_dependency"
    ]
  },
  {
    "id": "postprandial_diarrhea_gastrocolic",
    "label": "Urgent Bowel Urge Immediately After Meals",
    "label_en": "Do you have to rush to the toilet to pass loose stool immediately after breakfast or lunch (Exaggerated gastrocolic reflex)?",
    "label_bn": "সকালের নাস্তা বা দুপুরের খাবার খাওয়ার সাথে সাথেই কি মলত্যাগের তীব্র বেগ হয়?",
    "domain": "gastrointestinal",
    "answerType": "yesno",
    "clinicalTags": [
      "hyperactive_gastrocolic_reflex",
      "ibs_diarrhea"
    ]
  },
  {
    "id": "sulfur_rotten_egg_burps",
    "label": "Sulfur or Rotten Egg Smelling Burps",
    "label_en": "Do your burps smell like sulfur or rotten eggs, accompanied by sudden loose stools?",
    "label_bn": "ঢেঁকুরে কি পচা ডিমের মতো বা সালফারের গন্ধ এবং সাথে পাতলা পায়খানা হয়?",
    "domain": "gastrointestinal",
    "answerType": "yesno",
    "clinicalTags": [
      "hydrogen_sulfide_sibo",
      "giardia_or_dysbiosis"
    ]
  },
  {
    "id": "chronic_constipation_straining",
    "label": "Straining Severity During Bowel Movements",
    "label_en": "Do you have to strain severely for >10 minutes or apply manual pressure to evacuate?",
    "label_bn": "মলত্যাগের জন্য কি তীব্র বেগ দিতে হয় বা দীর্ঘক্ষণ বসে থাকতে হয়?",
    "domain": "gastrointestinal",
    "answerType": "yesno",
    "clinicalTags": [
      "pelvic_dyssynergia",
      "constipation_straining"
    ]
  },
  {
    "id": "bristol_stool_form",
    "label": "Bristol Stool Form Scale",
    "label_en": "What is the typical visual consistency and shape of your bowel movements?",
    "label_bn": "আপনার মলের স্বাভাবিক গঠন ও আকৃতি ব্রিস্টল স্কেল অনুযায়ী কেমন?",
    "domain": "microbiome",
    "answerType": "select",
    "isHighValueScreening": true,
    "options": [
      {
        "value": "type_1_separate_hard_lumps",
        "label": "Type 1: Separate hard lumps, like nuts (severe constipation)",
        "label_en": "Type 1: Hard lumps",
        "label_bn": "টাইপ ১: শক্ত গুটি গুটি ছাগলের নাদির মতো (তীব্র কোষ্ঠকাঠিন্য)"
      },
      {
        "value": "type_2_lumpy_sausage",
        "label": "Type 2: Sausage-shaped but lumpy (mild constipation)",
        "label_en": "Type 2: Lumpy sausage",
        "label_bn": "টাইপ ২: লম্বাটে কিন্তু শক্ত ও খণ্ড খণ্ড"
      },
      {
        "value": "type_3_cracked_sausage",
        "label": "Type 3: Like a sausage with cracks on its surface (normal)",
        "label_en": "Type 3: Cracked sausage",
        "label_bn": "টাইপ ৩: স্বাভাবিক, সামান্য ফাটলযুক্ত"
      },
      {
        "value": "type_4_smooth_snake",
        "label": "Type 4: Like a sausage or snake, smooth and soft (optimal)",
        "label_en": "Type 4: Smooth and soft",
        "label_bn": "টাইপ ৪: মোলায়েম ও মসৃণ (আদর্শ স্বাস্থ্যসম্মত)"
      },
      {
        "value": "type_5_soft_blobs",
        "label": "Type 5: Soft blobs with clear-cut edges (lacking fiber)",
        "label_en": "Type 5: Soft blobs",
        "label_bn": "টাইপ ৫: নরম টুকরো টুকরো (আঁশের অভাব)"
      },
      {
        "value": "type_6_mushy_fluffy",
        "label": "Type 6: Fluffy pieces with ragged edges, mushy (mild diarrhea)",
        "label_en": "Type 6: Mushy stool",
        "label_bn": "টাইপ ৬: নরম পেস্টের মতো (হালকা পাতলা পায়খানা)"
      },
      {
        "value": "type_7_watery_liquid",
        "label": "Type 7: Watery, entirely liquid, no solid pieces (diarrhea)",
        "label_en": "Type 7: Liquid diarrhea",
        "label_bn": "টাইপ ৭: সম্পূর্ণ তরল পানির মতো (ডায়রিয়া)"
      }
    ],
    "clinicalTags": [
      "bristol_stool",
      "transit_time",
      "microbiome_ecology"
    ]
  },
  {
    "id": "bowel_movement_frequency",
    "label": "Bowel Movement Frequency",
    "label_en": "How many times do you pass stool per day or per week?",
    "label_bn": "আপনি সাধারণত কত ঘনঘন মলত্যাগ করেন?",
    "domain": "microbiome",
    "answerType": "select",
    "isHighValueScreening": true,
    "options": [
      {
        "value": "less_than_3_per_week",
        "label": "Less than 3 times per week (constipated)",
        "label_en": "< 3 times/week",
        "label_bn": "সপ্তাহে ৩ বারের কম (কোষ্ঠকাঠিন্য)"
      },
      {
        "value": "once_every_2_days",
        "label": "Once every 2 days",
        "label_en": "Once every 2 days",
        "label_bn": "প্রতি দুই দিনে একবার"
      },
      {
        "value": "once_daily_regular",
        "label": "1 time per day (regular)",
        "label_en": "Once daily regular",
        "label_bn": "প্রতিদিন ১ বার (স্বাভাবিক)"
      },
      {
        "value": "twice_to_thrice_daily",
        "label": "2 to 3 times per day",
        "label_en": "2-3 times daily",
        "label_bn": "দিনে ২ থেকে ৩ বার"
      },
      {
        "value": "four_plus_times_daily",
        "label": "4 or more times per day (hyper-motility)",
        "label_en": "4+ times daily",
        "label_bn": "দিনে ৪ বার বা তার বেশি"
      }
    ],
    "clinicalTags": [
      "bowel_frequency",
      "constipation_vs_diarrhea"
    ]
  },
  {
    "id": "antibiotic_history_past_year",
    "label": "Antibiotic Use in Past 12 Months",
    "label_en": "How many courses of oral or injectable antibiotics have you completed in the past year?",
    "label_bn": "গত এক বছরে আপনি কতবার অ্যান্টিবায়োটিক সেবন করেছেন?",
    "domain": "microbiome",
    "answerType": "select",
    "isHighValueScreening": true,
    "options": [
      {
        "value": "zero_courses",
        "label": "0 courses (no antibiotics)",
        "label_en": "0 courses",
        "label_bn": "একবারও না"
      },
      {
        "value": "one_course",
        "label": "1 completed course",
        "label_en": "1 course",
        "label_bn": "১টি কোর্স"
      },
      {
        "value": "two_to_three_courses",
        "label": "2 to 3 courses",
        "label_en": "2-3 courses",
        "label_bn": "২ থেকে ৩টি কোর্স"
      },
      {
        "value": "four_plus_frequent",
        "label": "4 or more courses (frequent antibiotic user)",
        "label_en": "4+ courses",
        "label_bn": "৪ বার বা তার বেশি (ঘনঘন সেবন)"
      }
    ],
    "clinicalTags": [
      "antibiotic_frequency",
      "microbiome_depletion"
    ]
  },
  {
    "id": "stool_floating_vs_sinking",
    "label": "Stool Sinking vs Floating Characteristics",
    "label_en": "Does your stool consistently sink or float and stick to the bowl?",
    "label_bn": "আপনার মল কি কমোডে তলিয়ে যায় নাকি ভেসে থাকে ও প্যানে দাগ ফেলে?",
    "domain": "microbiome",
    "answerType": "select",
    "options": [
      {
        "value": "sinks_normally",
        "label": "Sinks normally to the bottom",
        "label_en": "Sinks normally",
        "label_bn": "স্বাভাবিকভাবে নিচে তলিয়ে যায়"
      },
      {
        "value": "floats_with_gas",
        "label": "Floats occasionally due to dietary gas",
        "label_en": "Floats with gas",
        "label_bn": "গ্যাসের কারণে মাঝে মাঝে ভেসে থাকে"
      },
      {
        "value": "greasy_sticky_pale",
        "label": "Greasy, pale, or leaves greasy film on water (steatorrhea sign)",
        "label_en": "Greasy / steatorrhea sign",
        "label_bn": "তৈলাক্ত, ফ্যাকাশে বা কমোডে দাগ ফেলে (চর্বি অপাচন লক্ষণ)"
      }
    ],
    "clinicalTags": [
      "steatorrhea",
      "fat_malabsorption",
      "pancreatic_or_bile"
    ]
  },
  {
    "id": "mucus_or_undigested_food",
    "label": "Visible Mucus or Undigested Food Particles",
    "label_en": "Do you frequently see visible white/yellow mucus or large undigested vegetable pieces in your stool?",
    "label_bn": "মলের সাথে কি সাদা বা পিচ্ছিল আম/শ্লেষ্মা অথবা অপাচিত খাদ্যকণা দেখা যায়?",
    "domain": "microbiome",
    "answerType": "yesno",
    "clinicalTags": [
      "gut_mucus",
      "colonic_inflammation",
      "chewing_mastication"
    ]
  },
  {
    "id": "stool_color_typical",
    "label": "Predominant Stool Color",
    "label_en": "What is the typical color of your bowel movements?",
    "label_bn": "মলের স্বাভাবিক রঙ সাধারণত কেমন থাকে?",
    "domain": "microbiome",
    "answerType": "select",
    "options": [
      {
        "value": "medium_brown_normal",
        "label": "Medium to dark brown (normal)",
        "label_en": "Medium brown",
        "label_bn": "স্বাভাবিক বাদামি"
      },
      {
        "value": "pale_clay_chalky",
        "label": "Pale, light tan, or clay-colored (Biliary obstruction sign)",
        "label_en": "Pale / clay colored",
        "label_bn": "ফ্যাকাশে বা মাটির মতো সাদাটে (পিত্ত নালীর সমস্যা)"
      },
      {
        "value": "dark_tarry_black",
        "label": "Pitch black or tarry (Melena - Medical review required)",
        "label_en": "Tarry black (Melena)",
        "label_bn": "আলকাতরার মতো কুচকুচে কালো (পাকস্থলীতে রক্তক্ষরণ লক্ষণ)"
      },
      {
        "value": "yellow_greasy",
        "label": "Yellowish and foul-smelling (Rapid transit / Giardia / Malabsorption)",
        "label_en": "Yellowish greasy",
        "label_bn": "হলদেটে ও অতিরিক্ত দুর্গন্ধযুক্ত"
      }
    ],
    "clinicalTags": [
      "stool_color",
      "biliary_patency",
      "melena_red_flag"
    ]
  },
  {
    "id": "probiotic_ferment_tolerance",
    "label": "Tolerance to Tok Doi & Fermented Foods",
    "label_en": "How does your digestive tract react when consuming Tok Doi (sour curd), kefir, or pickles?",
    "label_bn": "টক দই বা গাঁজানো খাবার খেলে আপনার পেটের অবস্থা কেমন হয়?",
    "domain": "microbiome",
    "answerType": "select",
    "options": [
      {
        "value": "soothes_digestion",
        "label": "Soothes digestion, feels good in stomach",
        "label_en": "Soothes digestion",
        "label_bn": "হজম ভালো হয়, পেটে আরাম লাগে"
      },
      {
        "value": "causes_immediate_gas",
        "label": "Causes instant gas, belly swelling, or diarrhea (dysbiosis sign)",
        "label_en": "Instant gas / swelling",
        "label_bn": "তীব্র গ্যাস ও পেট ফাঁপার সৃষ্টি করে"
      },
      {
        "value": "triggers_histamine_headache",
        "label": "Triggers nasal stuffiness, flushing, or headache (Histamine intolerance)",
        "label_en": "Histamine flare",
        "label_bn": "মাথাব্যথা, নাক বন্ধ বা ত্বকে চুলকানি বাড়ে"
      }
    ],
    "clinicalTags": [
      "probiotic_tolerance",
      "histamine_intolerance",
      "d_lactic_acidosis"
    ]
  },
  {
    "id": "flatulence_odor_characteristics",
    "label": "Daily Flatulence Volume & Odor",
    "label_en": "How would you characterize daily gas passage and odor?",
    "label_bn": "প্রতিদিনের পেটে তৈরি হওয়া বাতকর্মের পরিমাণ ও গন্ধ কেমন?",
    "domain": "microbiome",
    "answerType": "select",
    "options": [
      {
        "value": "minimal_odorless",
        "label": "Normal frequency (< 14 times/day), mostly odorless",
        "label_en": "Normal odorless",
        "label_bn": "স্বাভাবিক ও গন্ধহীন"
      },
      {
        "value": "frequent_bloating_odorless",
        "label": "Frequent volume, air-like with little odor (Methane/Hydrogen excess)",
        "label_en": "High volume odorless",
        "label_bn": "প্রচুর গ্যাস কিন্তু তীব্র দুর্গন্ধ নেই"
      },
      {
        "value": "foul_sulfur_putrid",
        "label": "Extremely foul smelling / rotten egg odor (Protein putrefaction or H2S dysbiosis)",
        "label_en": "Foul sulfur odor",
        "label_bn": "তীব্র পচা গন্ধ বা সালফারের মতো দুর্গন্ধ"
      }
    ],
    "clinicalTags": [
      "flatulence_odor",
      "protein_putrefaction",
      "h2s_sibo"
    ]
  },
  {
    "id": "candida_fungal_signs",
    "label": "Fungal Overgrowth Signs (Oral Thrush / Nails / Skin)",
    "label_en": "Do you have thick white coating on tongue, fungal toenails, or recurrent candidiasis?",
    "label_bn": "জিহ্বায় সাদা স্তর, নখে ফাঙ্গাস বা বারবার ত্বকে ছত্রাকের সংক্রমণ হয় কি?",
    "domain": "microbiome",
    "answerType": "yesno",
    "clinicalTags": [
      "candida_overgrowth",
      "oral_thrush",
      "fungal_dysbiosis"
    ]
  },
  {
    "id": "travelers_dysentery_history",
    "label": "History of Severe Food Poisoning or Amoebiasis",
    "label_en": "Did gut issues begin directly after a severe bout of traveler's diarrhea or amoebic dysentery?",
    "label_bn": "তীব্র ফুড পয়জনিং বা আমাশয়ের পর থেকেই কি পেটের সমস্যা স্থায়ী রূপ নিয়েছে?",
    "domain": "microbiome",
    "answerType": "yesno",
    "clinicalTags": [
      "post_infectious_ibs",
      "cytolethal_distending_toxin"
    ]
  },
  {
    "id": "joint_stiffness_pain",
    "label": "Joint Stiffness or Inflammatory Ache",
    "label_en": "Do you experience joint stiffness or pain, particularly worse in the morning upon waking?",
    "label_bn": "সকালে ঘুম থেকে উঠলে কি হাত-পায়ের গিরায় ব্যথা বা শক্ত ভাব অনুভব করেন?",
    "domain": "immune_inflammatory",
    "answerType": "select",
    "isHighValueScreening": true,
    "options": [
      {
        "value": "none",
        "label": "No joint stiffness",
        "label_en": "No stiffness",
        "label_bn": "কোনো শক্ত ভাব বা ব্যথা নেই"
      },
      {
        "value": "mild_transient",
        "label": "Mild stiffness lasting < 15 minutes",
        "label_en": "< 15 minutes",
        "label_bn": "মৃদু, ১৫ মিনিটের কম সময় থাকে"
      },
      {
        "value": "moderate_morning",
        "label": "Moderate morning stiffness lasting 30-60 minutes",
        "label_en": "30-60 minutes morning stiffness",
        "label_bn": "মাঝারি, আধা থেকে এক ঘণ্টা থাকে"
      },
      {
        "value": "severe_inflammatory",
        "label": "Severe stiffness > 1 hour or visibly swollen, warm joints",
        "label_en": "> 1 hour with warmth/swelling",
        "label_bn": "তীব্র, ১ ঘণ্টার বেশি থাকে এবং গিরা ফুলে থাকে"
      }
    ],
    "clinicalTags": [
      "joint_stiffness",
      "inflammatory_arthritis",
      "systemic_inflammation"
    ]
  },
  {
    "id": "skin_reactions_eczema_acne",
    "label": "Skin Manifestations (Eczema, Hives, Acne, Psoriasis)",
    "label_en": "Which chronic or recurrent skin conditions do you currently experience?",
    "label_bn": "আপনার কি কোনো দীর্ঘস্থায়ী চর্মরোগ বা ত্বকের সমস্যা রয়েছে?",
    "domain": "immune_inflammatory",
    "answerType": "multiselect",
    "isHighValueScreening": true,
    "options": [
      {
        "value": "eczema_atopic",
        "label": "Eczema / Atopic Dermatitis (dry, itchy red patches)",
        "label_en": "Eczema",
        "label_bn": "একজিমা বা চুলকানিযুক্ত শুষ্ক ছোপ"
      },
      {
        "value": "urticaria_hives",
        "label": "Urticaria / Hives (sudden allergic welts)",
        "label_en": "Urticaria / Hives",
        "label_bn": "আমবাত বা হঠাৎ চাকা চাকা অ্যালার্জি"
      },
      {
        "value": "inflammatory_acne",
        "label": "Cystic / Inflammatory Acne",
        "label_en": "Cystic Acne",
        "label_bn": "তীব্র ব্রণের সমস্যা"
      },
      {
        "value": "psoriasis_silvery",
        "label": "Psoriasis (silvery scaly plaques)",
        "label_en": "Psoriasis",
        "label_bn": "সোরিয়াসিস (রূপালী আঁইশের মতো ত্বক)"
      },
      {
        "value": "none",
        "label": "Clear skin / No chronic skin conditions",
        "label_en": "Clear skin",
        "label_bn": "ত্বক পরিষ্কার ও স্বাভাবিক"
      }
    ],
    "clinicalTags": [
      "skin_inflammation",
      "gut_skin_axis"
    ]
  },
  {
    "id": "seasonal_allergic_rhinitis",
    "label": "Allergic Rhinitis or Sinus Congestion",
    "label_en": "Do you suffer from recurrent seasonal sneezing, watery eyes, or chronic sinus pressure?",
    "label_bn": "বারবার হাঁচি, চোখ দিয়ে পানি পড়া বা নাকের সাইনাসে অস্বস্তির সমস্যা আছে কি?",
    "domain": "immune_inflammatory",
    "answerType": "yesno",
    "clinicalTags": [
      "allergic_rhinitis",
      "histamine_burden"
    ]
  },
  {
    "id": "infection_frequency_recovery",
    "label": "Frequency of Colds & Recovery Speed",
    "label_en": "How often do you catch viral infections, and how fast do you typically recover?",
    "label_bn": "বছরে কতবার সর্দি-কাশি বা ফ্লুতে আক্রান্ত হন এবং সুস্থ হতে কতদিন লাগে?",
    "domain": "immune_inflammatory",
    "answerType": "select",
    "options": [
      {
        "value": "rarely_catch_colds",
        "label": "Rarely sick (0-1 cold/year, recovers in 3-4 days)",
        "label_en": "Rarely sick, rapid recovery",
        "label_bn": "খুব কম অসুস্থ হই (বছরে ০-১ বার, দ্রুত সুস্থ)"
      },
      {
        "value": "average_frequency",
        "label": "Average (2-3 colds/year, recovers in a week)",
        "label_en": "Average recovery",
        "label_bn": "মাঝারি (বছরে ২-৩ বার)"
      },
      {
        "value": "frequent_slow_recovery",
        "label": "Frequently sick (> 4 times/year, cough lingers for weeks)",
        "label_en": "Frequent sick, slow recovery",
        "label_bn": "ঘনঘন অসুস্থ হওয়া (> ৪ বার) এবং কাশি দীর্ঘদিন থাকা"
      }
    ],
    "clinicalTags": [
      "immune_competence",
      "mucosal_immunity"
    ]
  },
  {
    "id": "oral_aphthous_ulcers",
    "label": "Recurrent Canker Sores / Mouth Ulcers",
    "label_en": "Do you get frequent painful mouth ulcers (aphthous stomatitis) or bleeding gums?",
    "label_bn": "মুখে বা মাড়িতে কি ঘনঘন ঘা (অ্যাপথাস আলসার) বা রক্ত পড়ার সমস্যা হয়?",
    "domain": "immune_inflammatory",
    "answerType": "yesno",
    "clinicalTags": [
      "mouth_ulcers",
      "b12_folate_deficiency",
      "celiac_autoimmune_sign"
    ]
  },
  {
    "id": "dry_eyes_mouth_sicca",
    "label": "Dry Eyes or Dry Mouth Sensation",
    "label_en": "Do you experience persistent gritty dry eyes or difficulty swallowing dry food without water?",
    "label_bn": "চোখ খচখচ করা বা পানি ছাড়া শুকনো খাবার গিলতে না পারার মতো শুষ্কতা আছে কি?",
    "domain": "immune_inflammatory",
    "answerType": "yesno",
    "clinicalTags": [
      "sicca_syndrome",
      "sjogrens_risk",
      "autoimmune_screen"
    ]
  },
  {
    "id": "sunlight_skin_rash_photosensitivity",
    "label": "Photosensitivity (Malar or Solar Rash)",
    "label_en": "Does sun exposure trigger an immediate red burning rash or facial butterfly redness?",
    "label_bn": "রোদে গেলে কি মুখে প্রজাপতির মতো লালচে দাগ বা তীব্র র্যাশ বের হয়?",
    "domain": "immune_inflammatory",
    "answerType": "yesno",
    "clinicalTags": [
      "photosensitivity",
      "malar_rash",
      "lupus_screening"
    ]
  },
  {
    "id": "thyroid_condition_diagnosed",
    "label": "Thyroid Disorder Diagnosis",
    "label_en": "Have you been clinically diagnosed with a thyroid disorder?",
    "label_bn": "আপনার কি কোনো থাইরয়েড রোগ শনাক্ত হয়েছে?",
    "domain": "endocrine_hormonal",
    "answerType": "select",
    "isHighValueScreening": true,
    "options": [
      {
        "value": "no_thyroid_issue",
        "label": "No (Normal Thyroid)",
        "label_en": "Normal Thyroid",
        "label_bn": "না (থাইরয়েড স্বাভাবিক)"
      },
      {
        "value": "hypothyroid_primary",
        "label": "Hypothyroidism (Underactive Thyroid / High TSH)",
        "label_en": "Hypothyroidism",
        "label_bn": "হাইপোথাইরয়েডিজম (অলস থাইরয়েড / বেশি TSH)"
      },
      {
        "value": "hashimotos_autoimmune",
        "label": "Hashimoto's Autoimmune Thyroiditis (High Anti-TPO)",
        "label_en": "Hashimoto's Thyroiditis",
        "label_bn": "হাশিমোটোস অটোইমিউন থাইরয়েডাইটিস"
      },
      {
        "value": "hyperthyroid",
        "label": "Hyperthyroidism (Overactive Thyroid / Low TSH)",
        "label_en": "Hyperthyroidism",
        "label_bn": "হাইপারথাইরয়েডিজম (অতিরিক্ত সক্রিয় থাইরয়েড)"
      }
    ],
    "clinicalTags": [
      "thyroid_diagnosis",
      "hypothyroid"
    ]
  },
  {
    "id": "thyroid_medication_timing",
    "label": "Levothyroxine (Thyrox) Administration Timing",
    "label_en": "If taking thyroid hormone replacement (Thyrox/Eltroxin), when do you take it relative to morning food or calcium/iron supplements?",
    "label_bn": "থাইরয়েড ওষুধ (Thyrox/Eltroxin) সকালে খাবার বা অন্য ওষুধের কতক্ষণ আগে সেবন করেন?",
    "domain": "endocrine_hormonal",
    "answerType": "select",
    "visibility": {
      "condition": {
        "field": "thyroid_condition_diagnosed",
        "operator": "includes",
        "value": "hypothyroid"
      }
    },
    "options": [
      {
        "value": "correct_empty_stomach_60m",
        "label": "Empty stomach with plain water at least 45-60 mins before tea/breakfast",
        "label_en": "Empty stomach 45-60m before food",
        "label_bn": "সকালে খালি পেটে শুধু পানিতে, নাস্তা/চায়ের অন্তত ৪৫-৬০ মিনিট আগে (সঠিক নিয়ম)"
      },
      {
        "value": "with_breakfast_or_tea",
        "label": "Immediately with morning tea or breakfast",
        "label_en": "With tea or breakfast",
        "label_bn": "সকালের চা বা নাস্তার সাথে সাথে খেয়ে ফেলি"
      },
      {
        "value": "with_calcium_iron_multivitamin",
        "label": "Together with calcium, iron, or multivitamin tablets",
        "label_en": "With calcium or iron tablet",
        "label_bn": "ক্যালসিয়াম বা আয়রন ট্যাবলেটের সাথে একসাথে"
      }
    ],
    "clinicalTags": [
      "thyroid_timing",
      "drug_nutrient_binding"
    ]
  },
  {
    "id": "cold_intolerance_sluggishness",
    "label": "Cold Temperature Intolerance & Dry Skin",
    "label_en": "Do you feel chilled when others feel comfortable, along with persistent dry skin and brittle hair?",
    "label_bn": "অন্যদের তুলনায় কি আপনার অতিরিক্ত শীত লাগে এবং ত্বক ও চুল কি অস্বাভাবিক শুষ্ক?",
    "domain": "endocrine_hormonal",
    "answerType": "yesno",
    "clinicalTags": [
      "cold_intolerance",
      "hypothyroid_symptom"
    ]
  },
  {
    "id": "menstrual_regularity",
    "label": "Menstrual Cycle Pattern (Biological Females)",
    "label_en": "How regular is your menstrual cycle over the past 6 months?",
    "label_bn": "গত ৬ মাসে আপনার মাসিক চক্রের নিয়মিততা কেমন ছিল?",
    "domain": "endocrine_hormonal",
    "answerType": "select",
    "applicablePopulation": [
      "adult_standard",
      "adolescent",
      "all"
    ],
    "options": [
      {
        "value": "regular_28_32_days",
        "label": "Regular (every 26-32 days)",
        "label_en": "Regular 26-32 days",
        "label_bn": "নিয়মিত (২৬-৩২ দিন অন্তর)"
      },
      {
        "value": "irregular_pcos_pattern",
        "label": "Irregular / Delayed (cycles > 35-60 days apart, PCOS sign)",
        "label_en": "Irregular / Delayed (PCOS sign)",
        "label_bn": "অনিয়মিত বা দেরিতে (৩৫-৬০ দিন পর পর)"
      },
      {
        "value": "frequent_short_cycles",
        "label": "Frequent / Short cycles (< 24 days apart)",
        "label_en": "Short cycles (< 24 days)",
        "label_bn": "খুব ঘনঘন (২৪ দিনের কম অন্তর)"
      },
      {
        "value": "amenorrhea_absent",
        "label": "Amenorrhea (absent for 3+ months, non-pregnant)",
        "label_en": "Absent > 3 months",
        "label_bn": "মাসিক বন্ধ থাকা (৩ মাসের বেশি সময় ধরে)"
      },
      {
        "value": "postmenopausal",
        "label": "Postmenopausal (natural cessation of menses)",
        "label_en": "Postmenopausal",
        "label_bn": "মেনোপজ পরবর্তী (স্থায়ীভাবে বন্ধ)"
      },
      {
        "value": "not_applicable_male",
        "label": "Not applicable (Biological Male)",
        "label_en": "Not applicable",
        "label_bn": "প্রযোজ্য নয় (পুরুষ)"
      }
    ],
    "clinicalTags": [
      "menstrual_cycle",
      "pcos_hormone_axis"
    ]
  },
  {
    "id": "hair_thinning_eyebrow_loss",
    "label": "Hair Thinning & Outer Eyebrow Thinning",
    "label_en": "Are you losing hair diffusely or noticing thinning at the outer third of your eyebrows (Hertoghe sign)?",
    "label_bn": "মাথার চুল অতিরিক্ত পাতলা হওয়া বা ভুরুর বাইরের অংশ ঝরে যাওয়ার সমস্যা আছে কি?",
    "domain": "endocrine_hormonal",
    "answerType": "select",
    "options": [
      {
        "value": "normal_hair_density",
        "label": "Normal hair density",
        "label_en": "Normal density",
        "label_bn": "স্বাভাবিক চুলের ঘনত্ব"
      },
      {
        "value": "diffuse_scalp_shedding",
        "label": "Diffuse scalp shedding (Telogen effluvium)",
        "label_en": "Diffuse shedding",
        "label_bn": "সার্বিকভাবে চুল পাতলা হয়ে যাওয়া"
      },
      {
        "value": "outer_eyebrow_and_hair",
        "label": "Thinning of outer eyebrows + dry hair (Classic hypothyroid sign)",
        "label_en": "Outer eyebrow thinning",
        "label_bn": "ভুরুর বাইরের অংশ ও চুল অতিরিক্ত ঝরে পড়া (থাইরয়েড লক্ষণ)"
      }
    ],
    "clinicalTags": [
      "hertoghe_sign",
      "hypothyroid_hair"
    ]
  },
  {
    "id": "hirsutism_facial_hair_pcos",
    "label": "Excess Facial Hair / Androgen Excess (Females)",
    "label_en": "Do you experience coarse dark hair growth on chin, upper lip, chest, or abdomen (Hirsutism)?",
    "label_bn": "চিবুক, ঠোঁটের ওপর বা শরীরে অতিরিক্ত অনাকাঙ্ক্ষিত শক্ত লোমের বৃদ্ধি আছে কি?",
    "domain": "endocrine_hormonal",
    "answerType": "yesno",
    "clinicalTags": [
      "hirsutism",
      "androgen_excess",
      "pcos_marker"
    ]
  },
  {
    "id": "evening_wired_tired_cortisol",
    "label": "Wired but Tired Evening Feeling (Cortisol Pattern)",
    "label_en": "Are you exhausted all day but suddenly feel energetic, restless, or second-wind at 10-11 PM?",
    "label_bn": "সারাদিন প্রচণ্ড ক্লান্ত কিন্তু রাত ১০-১১টায় হঠাৎ চাঙ্গা ও ঘুম উবে যাওয়ার অনুভূতি হয় কি?",
    "domain": "endocrine_hormonal",
    "answerType": "yesno",
    "clinicalTags": [
      "hpa_axis_dysregulation",
      "evening_cortisol_spike"
    ]
  },
  {
    "id": "fatty_liver_diagnosis",
    "label": "Fatty Liver Disease (NAFLD / MASLD)",
    "label_en": "Have you been diagnosed with Grade 1, 2, or 3 Fatty Liver via ultrasound or liver enzymes (ALT/AST)?",
    "label_bn": "আল্ট্রাসনোগ্রামে আপনার কি ফ্যাটি লিভার (গ্রেড ১, ২ বা ৩) ধরা পড়েছে?",
    "domain": "hepatic_biotransformation",
    "answerType": "select",
    "isHighValueScreening": true,
    "options": [
      {
        "value": "no_normal_liver",
        "label": "No (Normal Liver on Scan)",
        "label_en": "Normal Liver",
        "label_bn": "না (লিভার স্বাভাবিক)"
      },
      {
        "value": "grade_1_mild",
        "label": "Grade 1 Fatty Liver (Mild steatosis)",
        "label_en": "Grade 1 Fatty Liver",
        "label_bn": "গ্রেড ১ ফ্যাটি লিভার (মৃদু)"
      },
      {
        "value": "grade_2_moderate",
        "label": "Grade 2 Fatty Liver (Moderate)",
        "label_en": "Grade 2 Fatty Liver",
        "label_bn": "গ্রেড ২ ফ্যাটি লিভার (মাঝারি)"
      },
      {
        "value": "grade_3_severe",
        "label": "Grade 3 Fatty Liver / NASH / Fibrosis",
        "label_en": "Grade 3 / NASH",
        "label_bn": "গ্রেড ৩ ফ্যাটি লিভার বা লিভার ফাইব্রোসিস"
      },
      {
        "value": "not_tested",
        "label": "Not tested / Never had ultrasound",
        "label_en": "Not tested",
        "label_bn": "কখনই পরীক্ষা করা হয়নি"
      }
    ],
    "clinicalTags": [
      "fatty_liver",
      "hepatic_steatosis"
    ]
  },
  {
    "id": "caffeine_and_chemical_tolerance",
    "label": "Caffeine & Chemical Smell Sensitivity",
    "label_en": "How do you respond to caffeine or strong chemical odors (perfumes, gasoline, paint)?",
    "label_bn": "চা-কফি বা কড়া পারফিউম, রঙ বা পেট্রোলের গন্ধে আপনার অনুভূতি কেমন হয়?",
    "domain": "hepatic_biotransformation",
    "answerType": "select",
    "options": [
      {
        "value": "normal_tolerance",
        "label": "Normal tolerance to caffeine and scents",
        "label_en": "Normal tolerance",
        "label_bn": "স্বাভাবিক সহনশীলতা"
      },
      {
        "value": "jittery_poor_sleep_caffeine",
        "label": "Caffeine gives tremors, anxiety, or insomnia for hours",
        "label_en": "Caffeine sensitivity",
        "label_bn": "কফি বা চা খেলে বুক ধড়ফড় বা অনিদ্রা হয়"
      },
      {
        "value": "chemical_odor_nausea_headache",
        "label": "Strong perfumes or paint trigger immediate nausea or headache (Phase 1/2 mismatch)",
        "label_en": "Perfume/chemical sensitivity",
        "label_bn": "কড়া গন্ধে তীব্র মাথা ব্যথা বা বমি ভাব হয়"
      }
    ],
    "clinicalTags": [
      "cyp450_phase1",
      "biotransformation_clearance"
    ]
  },
  {
    "id": "right_upper_quadrant_fullness",
    "label": "Right Upper Quadrant Heaviness / Fullness",
    "label_en": "Do you experience dull discomfort or heaviness under your right ribcage, especially after fatty meals?",
    "label_bn": "ডান পাঁজরের নিচে ভারী ভাব বা অস্বস্তি অনুভূত হয় কি (বিশেষ করে তৈলাক্ত খাবারের পর)?",
    "domain": "hepatic_biotransformation",
    "answerType": "yesno",
    "clinicalTags": [
      "hepatic_capsule_stretch",
      "biliary_sluggishness"
    ]
  },
  {
    "id": "bitter_taste_morning_mouth",
    "label": "Bitter Taste in Mouth Upon Waking",
    "label_en": "Do you wake with a persistent metallic or bitter bile taste in your mouth?",
    "label_bn": "সকালে ঘুম ভাঙলে মুখে কি তেতো ভাব বা পিত্তের স্বাদ অনুভব করেন?",
    "domain": "hepatic_biotransformation",
    "answerType": "yesno",
    "clinicalTags": [
      "biliary_reflux",
      "liver_pitta_sign"
    ]
  },
  {
    "id": "dark_circles_periorbital",
    "label": "Prominent Dark Circles Under Eyes",
    "label_en": "Do you have pronounced dark pigmentation under your eyes unrelated to acute sleep loss?",
    "label_bn": "ঘুমের অভাব ছাড়াও চোখের নিচে কি স্থায়ী কালচে দাগ (ডার্ক সার্কেল) আছে?",
    "domain": "hepatic_biotransformation",
    "answerType": "yesno",
    "clinicalTags": [
      "allergic_shiners",
      "sluggish_microcirculation"
    ]
  },
  {
    "id": "morning_fatigue_level",
    "label": "Morning Energy & Restorative Sleep",
    "label_en": "How do you feel upon waking in the morning?",
    "label_bn": "সকালে ঘুম থেকে ওঠার পর শারীরিক সতেজতা কেমন অনুভব করেন?",
    "domain": "mitochondrial_energy",
    "answerType": "select",
    "isHighValueScreening": true,
    "options": [
      {
        "value": "refreshed_energetic",
        "label": "Refreshed and ready for the day",
        "label_en": "Refreshed and energetic",
        "label_bn": "পরিপূর্ণ সতেজ ও কর্মচঞ্চল"
      },
      {
        "value": "sluggish_needs_tea",
        "label": "Sluggish, requires tea/coffee to get going",
        "label_en": "Needs caffeine to start",
        "label_bn": "ক্লান্ত লাগে, চা-কফি ছাড়া দিন শুরু করা যায় না"
      },
      {
        "value": "exhausted_unrefreshed",
        "label": "Exhausted as if not slept at all (unrefreshed sleep)",
        "label_en": "Exhausted unrefreshed",
        "label_bn": "প্রচণ্ড ক্লান্ত, মনে হয় এক ফোঁটাও ঘুমাইনি"
      }
    ],
    "clinicalTags": [
      "unrefreshed_sleep",
      "mitochondrial_dysfunction",
      "adrenal_circadian"
    ]
  },
  {
    "id": "post_exertional_recovery",
    "label": "Post-Exertional Fatigue & Recovery Time",
    "label_en": "How does your body react to physical exertion or exercise?",
    "label_bn": "হাঁটাহাঁটি বা শারীরিক পরিশ্রমের পর আপনার ক্লান্তি কেমন লাগে?",
    "domain": "mitochondrial_energy",
    "answerType": "select",
    "options": [
      {
        "value": "energized_rapid_recovery",
        "label": "Energized, recovers within 1 hour",
        "label_en": "Energized",
        "label_bn": "শরীর হালকা ও চাঙ্গা লাগে"
      },
      {
        "value": "normal_tiredness",
        "label": "Normal muscular tiredness, fine next day",
        "label_en": "Normal tiredness",
        "label_bn": "স্বাভাবিক শারীরিক ক্লান্তি"
      },
      {
        "value": "severe_crash_takes_days",
        "label": "Severe exhaustion or body ache lasting 24-48+ hours (PEM sign)",
        "label_en": "Takes 24-48h to recover",
        "label_bn": "সামান্য পরিশ্রমেও শরীর ভেঙে পড়ে এবং সুস্থ হতে ২৪-৪৮ ঘণ্টা লাগে"
      }
    ],
    "clinicalTags": [
      "post_exertional_malaise",
      "mitochondrial_capacity"
    ]
  },
  {
    "id": "brain_fog_severity",
    "label": "Brain Fog & Cognitive Clarity",
    "label_en": "Do you experience mental cloudiness, forgetfulness, or difficulty concentrating during the day?",
    "label_bn": "দিনের বেলা মনোযোগ দিতে কষ্ট হওয়া বা মাথায় ঝাপসা ভাব (ব্রেন ফগ) হয় কি?",
    "domain": "mitochondrial_energy",
    "answerType": "select",
    "options": [
      {
        "value": "clear_focused",
        "label": "Sharp and mentally focused all day",
        "label_en": "Clear focus",
        "label_bn": "মনোযোগ স্বাভাবিক ও স্পষ্ট"
      },
      {
        "value": "mild_afternoon_dip",
        "label": "Mild sluggishness during the afternoon",
        "label_en": "Mild afternoon dip",
        "label_bn": "দুপুরের পর সামান্য অলসতা"
      },
      {
        "value": "frequent_severe_fog",
        "label": "Frequent severe fog, forgetfulness, and word-finding difficulty",
        "label_en": "Severe daily brain fog",
        "label_bn": "প্রতিদিন তীব্র ঝাপসা ভাব ও ভুলে যাওয়ার প্রবণতা"
      }
    ],
    "clinicalTags": [
      "brain_fog",
      "neuroinflammation",
      "metabolic_encephalopathy"
    ]
  },
  {
    "id": "cellular_stamina_stairs",
    "label": "Physical Stamina Climbing Stairs",
    "label_en": "Do your thigh muscles burn and tremble when climbing only 1-2 flights of stairs?",
    "label_bn": "মাত্র ১-২ তলা সিঁড়ি ভাঙলে কি পায়ের পেশিতে টান ও জ্বালাপোড়া ধরে যায়?",
    "domain": "mitochondrial_energy",
    "answerType": "yesno",
    "clinicalTags": [
      "mitochondrial_burn",
      "lactic_acid_accumulation"
    ]
  },
  {
    "id": "sleep_duration_hours",
    "label": "Average Nightly Sleep Duration",
    "label_en": "How many hours of actual sleep do you get on average per night?",
    "label_bn": "প্রতি রাতে আপনার গড়ে কত ঘণ্টা ঘুম হয়?",
    "domain": "sleep_circadian",
    "answerType": "select",
    "isHighValueScreening": true,
    "options": [
      {
        "value": "less_than_5_hours",
        "label": "< 5 hours (Severe sleep deprivation)",
        "label_en": "< 5 hours",
        "label_bn": "৫ ঘণ্টার কম (মারাত্মক ঘাটতি)"
      },
      {
        "value": "5_to_6_hours",
        "label": "5 to 6 hours",
        "label_en": "5-6 hours",
        "label_bn": "৫ থেকে ৬ ঘণ্টা"
      },
      {
        "value": "7_to_8_hours",
        "label": "7 to 8 hours (Optimal)",
        "label_en": "7-8 hours",
        "label_bn": "৭ থেকে ৮ ঘণ্টা (আদর্শ)"
      },
      {
        "value": "more_than_9_hours",
        "label": "> 9 hours (Hypersomnia / excessive)",
        "label_en": "> 9 hours",
        "label_bn": "৯ ঘণ্টার বেশি"
      }
    ],
    "clinicalTags": [
      "sleep_duration",
      "circadian_health"
    ]
  },
  {
    "id": "sleep_onset_latency_minutes",
    "label": "Time Taken to Fall Asleep (Sleep Latency)",
    "label_en": "How long does it typically take you to fall asleep once in bed?",
    "label_bn": "বিছানায় যাওয়ার পর সাধারণত ঘুম আসতে কত সময় লাগে?",
    "domain": "sleep_circadian",
    "answerType": "select",
    "options": [
      {
        "value": "under_15_mins",
        "label": "< 15 minutes (Falls asleep easily)",
        "label_en": "< 15 mins",
        "label_bn": "১৫ মিনিটের কম (সহজেই ঘুম আসে)"
      },
      {
        "value": "15_to_30_mins",
        "label": "15 to 30 minutes (Normal)",
        "label_en": "15-30 mins",
        "label_bn": "১৫ থেকে ৩০ মিনিট (স্বাভাবিক)"
      },
      {
        "value": "30_to_60_mins",
        "label": "30 to 60 minutes (Delayed onset)",
        "label_en": "30-60 mins",
        "label_bn": "আধা থেকে এক ঘণ্টা"
      },
      {
        "value": "over_60_mins_tossing",
        "label": "> 60 minutes, mind racing / tossing and turning",
        "label_en": "> 60 mins insomnia",
        "label_bn": "এক ঘণ্টার বেশি সময় এপাশ-ওপাশ করতে হয়"
      }
    ],
    "clinicalTags": [
      "sleep_latency",
      "melatonin_suppression"
    ]
  },
  {
    "id": "shift_work_schedule",
    "label": "Shift Work or Night Schedule",
    "label_en": "Do you work night shifts, rotating shifts, or irregular late-night hours?",
    "label_bn": "আপনি কি নাইট শিফট বা অনিয়মিত রাতের কাজের সাথে যুক্ত?",
    "domain": "sleep_circadian",
    "answerType": "yesno",
    "isHighValueScreening": true,
    "clinicalTags": [
      "shift_worker",
      "circadian_misalignment"
    ]
  },
  {
    "id": "snoring_apnea_gasping",
    "label": "Loud Snoring or Choking in Sleep",
    "label_en": "Has anyone told you that you snore loudly, stop breathing, or wake up choking/gasping for air?",
    "label_bn": "আপনি কি রাতে তীব্র নাক ডাকেন অথবা শ্বাস আটকে দম বন্ধ হয়ে ঘুম ভেঙে যায়?",
    "domain": "sleep_circadian",
    "answerType": "yesno",
    "clinicalTags": [
      "sleep_apnea_sign",
      "nocturnal_hypoxia"
    ]
  },
  {
    "id": "perceived_stress_level",
    "label": "Chronic Perceived Stress Level",
    "label_en": "How would you rate your ongoing daily stress level (work, family, financial)?",
    "label_bn": "দৈনন্দিন জীবনে আপনার মানসিক চাপের মাত্রা কেমন?",
    "domain": "stress_neurobehavioral",
    "answerType": "select",
    "isHighValueScreening": true,
    "options": [
      {
        "value": "low_manageable",
        "label": "Low and well manageable",
        "label_en": "Low manageable",
        "label_bn": "কম ও নিয়ন্ত্রণে"
      },
      {
        "value": "moderate_intermittent",
        "label": "Moderate, occasional high-stress episodes",
        "label_en": "Moderate",
        "label_bn": "মাঝারি ধরনের চাপ"
      },
      {
        "value": "high_chronic",
        "label": "High chronic stress on most days",
        "label_en": "High chronic",
        "label_bn": "উচ্চমাত্রার দীর্ঘস্থায়ী চাপ"
      },
      {
        "value": "overwhelming_burnout",
        "label": "Severe / Overwhelming burnout (unable to cope)",
        "label_en": "Overwhelming burnout",
        "label_bn": "অসহনীয় মানসিক ক্লান্তি বা বার্নআউট"
      }
    ],
    "clinicalTags": [
      "chronic_stress",
      "hpa_axis_hyperactivation"
    ]
  },
  {
    "id": "anxiety_panic_racing_heart",
    "label": "Anxiety, Restlessness or Palpitations",
    "label_en": "Do you experience sudden episodes of heart racing, tightness in chest, or feeling on edge?",
    "label_bn": "হঠাৎ বুক ধড়ফড়, অস্থিরতা বা অকারণ উদ্বেগের অনুভূতি হয় কি?",
    "domain": "stress_neurobehavioral",
    "answerType": "yesno",
    "clinicalTags": [
      "anxiety",
      "sympathetic_dominance"
    ]
  },
  {
    "id": "emotional_eating_coping",
    "label": "Emotional Eating / Stress Binging",
    "label_en": "Do you turn to sugary, high-carbohydrate, or crunchy foods when anxious, lonely, or bored?",
    "label_bn": "মন খারাপ বা মানসিক চাপের সময় কি অতিরিক্ত মিষ্টি বা ভাজাপোড়া খাবার খাওয়ার প্রবণতা হয়?",
    "domain": "stress_neurobehavioral",
    "answerType": "yesno",
    "clinicalTags": [
      "emotional_eating",
      "dopamine_seeking"
    ]
  },
  {
    "id": "meal_regularity_pattern",
    "label": "Daily Meal Timing Regularity",
    "label_en": "How consistent are your daily breakfast, lunch, and dinner meal timings?",
    "label_bn": "আপনার প্রতিদিনের সকাল, দুপুর ও রাতের খাবারের সময় কতটা নিয়মিত?",
    "domain": "dietary_nutrition",
    "answerType": "select",
    "options": [
      {
        "value": "very_consistent",
        "label": "Consistent within 30 minutes every day",
        "label_en": "Consistent timings",
        "label_bn": "প্রতিদিন প্রায় একই নির্দিষ্ট সময়ে"
      },
      {
        "value": "moderate_variation",
        "label": "Varies by 1-2 hours depending on work",
        "label_en": "Varies by 1-2 hours",
        "label_bn": "কাজের চাপে ১-২ ঘণ্টা এদিক-ওদিক হয়"
      },
      {
        "value": "highly_erratic_skipping",
        "label": "Highly erratic, frequently skip lunch or eat dinner past 11 PM",
        "label_en": "Highly erratic / Late night",
        "label_bn": "খুব অনিয়মিত, প্রায়ই দুপুরের খাবার বাদ পড়ে বা রাত ১১টার পর খাওয়া হয়"
      }
    ],
    "clinicalTags": [
      "meal_timing",
      "circadian_eating"
    ]
  },
  {
    "id": "chewing_eating_speed",
    "label": "Chewing Thoroughness & Eating Speed",
    "label_en": "Do you chew your food thoroughly, or do you tend to eat very quickly while rushed or multitasking?",
    "label_bn": "খাবার খাওয়ার সময় কি ভালো করে চিবিয়ে খান, নাকি তাড়াহুড়ো করে দ্রুত গিলে ফেলেন?",
    "domain": "dietary_nutrition",
    "answerType": "select",
    "options": [
      {
        "value": "slow_thorough_chewer",
        "label": "Slow, mindful, chews each bite thoroughly (20+ chews)",
        "label_en": "Slow and mindful",
        "label_bn": "ধীরে সুস্থে, ভালো করে চিবিয়ে খাই"
      },
      {
        "value": "average_pace",
        "label": "Normal speed (10-15 minutes per meal)",
        "label_en": "Average speed",
        "label_bn": "স্বাভাবিক গতিতে"
      },
      {
        "value": "very_fast_gulper",
        "label": "Very fast (finishes in under 5 minutes, washes down with water)",
        "label_en": "Fast gulper (< 5 mins)",
        "label_bn": "খুব দ্রুত খাই (৫ মিনিটের কম সময়ে এবং পানি দিয়ে গিলে ফেলি)"
      }
    ],
    "clinicalTags": [
      "mastication",
      "digestive_enzymes",
      "swallowed_air"
    ]
  },
  {
    "id": "daily_drinking_water_liters",
    "label": "Total Daily Plain Water Intake",
    "label_en": "How many liters of plain water do you drink per day (excluding sweet tea/sodas)?",
    "label_bn": "চা বা কোমল পানীয় ছাড়া দৈনিক গড়ে কত লিটার সাধারণ পানি পান করেন?",
    "domain": "dietary_nutrition",
    "answerType": "select",
    "options": [
      {
        "value": "less_than_1_liter",
        "label": "< 1 Liter (Severely inadequate)",
        "label_en": "< 1 Liter",
        "label_bn": "১ লিটারের কম (অপ্রতুল)"
      },
      {
        "value": "1_to_1_5_liters",
        "label": "1.0 to 1.5 Liters",
        "label_en": "1.0 - 1.5 L",
        "label_bn": "১.০ থেকে ১.৫ লিটার"
      },
      {
        "value": "1_5_to_2_5_liters",
        "label": "1.5 to 2.5 Liters (Adequate for most adults)",
        "label_en": "1.5 - 2.5 L",
        "label_bn": "১.৫ থেকে ২.৫ লিটার (স্বাভাবিক)"
      },
      {
        "value": "over_2_5_liters",
        "label": "> 2.5 Liters",
        "label_en": "> 2.5 L",
        "label_bn": "২.৫ লিটারের বেশি"
      }
    ],
    "clinicalTags": [
      "hydration_volume",
      "cellular_hydration"
    ]
  },
  {
    "id": "cooking_oil_type_primary",
    "label": "Primary Cooking Fat Used at Home",
    "label_en": "Which oil or cooking medium is predominantly used in your household cooking?",
    "label_bn": "বাসার রান্নায় প্রধানত কোন তেল ব্যবহৃত হয়?",
    "domain": "dietary_nutrition",
    "answerType": "select",
    "options": [
      {
        "value": "mustard_oil_pure",
        "label": "Cold-Pressed / Pure Mustard Oil (Kachi Ghani Shorshar Tel)",
        "label_en": "Mustard oil",
        "label_bn": "ঘানিভাঙা খাঁটি সরিষার তেল"
      },
      {
        "value": "soybean_refined",
        "label": "Commercial Refined Soybean Oil (Packet)",
        "label_en": "Refined soybean oil",
        "label_bn": "প্যাকেটজাত পরিশোধিত সয়াবিন তেল"
      },
      {
        "value": "rice_bran_sunflower",
        "label": "Rice Bran or Sunflower Oil",
        "label_en": "Rice bran / Sunflower",
        "label_bn": "রাইস ব্র্যান বা সূর্যমুখী তেল"
      },
      {
        "value": "pure_desi_ghee",
        "label": "Desi Ghee (Clarified Butter)",
        "label_en": "Desi Ghee",
        "label_bn": "খাঁটি গাওয়া ঘি"
      },
      {
        "value": "palm_oil_commercial",
        "label": "Palm Oil / Commercial Mixed Frying Oil",
        "label_en": "Palm oil",
        "label_bn": "পাম তেল"
      }
    ],
    "clinicalTags": [
      "cooking_oil",
      "omega6_omega3_ratio",
      "lipid_peroxidation"
    ]
  },
  {
    "id": "late_night_eating_habit",
    "label": "Late-Night Dining (Past 9:30 PM)",
    "label_en": "How frequently do you eat dinner or heavy snacks within 2 hours of going to sleep?",
    "label_bn": "ঘুমানোর ২ ঘণ্টার মধ্যে বা রাত সাড়ে ৯টার পর ভারী খাবার কত ঘনঘন খাওয়া হয়?",
    "domain": "dietary_nutrition",
    "answerType": "select",
    "options": [
      {
        "value": "rarely_early_diner",
        "label": "Rarely (eats by 8-8:30 PM, sleeps 2-3h later)",
        "label_en": "Early diner",
        "label_bn": "খুব কম, রাত ৮-৮:৩০টার মধ্যে খেয়ে নিই"
      },
      {
        "value": "frequent_late_diner",
        "label": "Frequent (eats dinner past 10 PM and sleeps immediately)",
        "label_en": "Late diner",
        "label_bn": "নিয়মিত রাত ১০টার পর খেয়ে সাথে সাথেই ঘুমিয়ে পড়ি"
      }
    ],
    "clinicalTags": [
      "circadian_eating",
      "nocturnal_glycemia"
    ]
  },
  {
    "id": "confirmed_food_allergies_list",
    "label": "Confirmed Food Allergies & Anaphylaxis",
    "label_en": "Do you have medical history of severe allergic reactions (hives, lip/throat swelling, difficulty breathing) to any foods?",
    "label_bn": "কোনো খাবারে কি আপনার মারাত্মক অ্যালার্জি বা শ্বাসকষ্ট/ঠোঁট ফোলার ইতিহাস আছে?",
    "domain": "medication_supplements",
    "answerType": "multiselect",
    "isHighValueScreening": true,
    "options": [
      {
        "value": "shrimp_prawn",
        "label": "Shrimp / Prawn (Chingri)",
        "label_en": "Shrimp / Prawn",
        "label_bn": "চিংড়ি মাছ"
      },
      {
        "value": "crab_shellfish",
        "label": "Crab or Shellfish",
        "label_en": "Crab / Shellfish",
        "label_bn": "কাঁকড়া বা সামুদ্রিক খোলসযুক্ত মাছ"
      },
      {
        "value": "egg_protein",
        "label": "Egg (White or Yolk)",
        "label_en": "Egg",
        "label_bn": "ডিম"
      },
      {
        "value": "peanuts",
        "label": "Peanuts (Cheena Badam)",
        "label_en": "Peanuts",
        "label_bn": "চিনাবাদাম"
      },
      {
        "value": "cow_milk_protein",
        "label": "Cow's Milk (Casein / Whey)",
        "label_en": "Cow's Milk",
        "label_bn": "গরুর দুধের প্রোটিন"
      },
      {
        "value": "beef_protein",
        "label": "Beef (Gorur Mangsho)",
        "label_en": "Beef",
        "label_bn": "গরুর মাংস"
      },
      {
        "value": "hilsa_fish",
        "label": "Hilsa Fish (Ilish)",
        "label_en": "Hilsa Fish",
        "label_bn": "ইলিশ মাছ"
      },
      {
        "value": "eggplant_brinjal",
        "label": "Eggplant / Brinjal (Begun)",
        "label_en": "Eggplant",
        "label_bn": "বেগুন"
      },
      {
        "value": "taro_kochu",
        "label": "Taro root or stems (Kochu)",
        "label_en": "Taro (Kochu)",
        "label_bn": "কচু বা কচুশাক"
      },
      {
        "value": "none",
        "label": "No known confirmed food allergies",
        "label_en": "No food allergies",
        "label_bn": "কোনো নিশ্চিত খাদ্য অ্যালার্জি নেই"
      }
    ],
    "clinicalTags": [
      "food_allergies",
      "anaphylaxis_risk"
    ]
  },
  {
    "id": "regular_ppi_antacid_use",
    "label": "Chronic Antacid or PPI Use",
    "label_en": "How long have you been taking daily acid-blocking medications (Omeprazole, Esomeprazole, Pantoprazole)?",
    "label_bn": "গ্যাসের ওষুধ (Omeprazole, Esomeprazole, Pantoprazole) কতদিন ধরে খাচ্ছেন?",
    "domain": "medication_supplements",
    "answerType": "select",
    "isHighValueScreening": true,
    "options": [
      {
        "value": "never_rarely",
        "label": "Never or rarely as needed",
        "label_en": "Never or rarely",
        "label_bn": "কখনই না বা খুব কদাচিৎ"
      },
      {
        "value": "less_than_1_month",
        "label": "Under 1 month",
        "label_en": "< 1 month",
        "label_bn": "১ মাসের কম সময়"
      },
      {
        "value": "1_to_6_months",
        "label": "1 to 6 months continuously",
        "label_en": "1-6 months",
        "label_bn": "১ থেকে ৬ মাস টানা"
      },
      {
        "value": "chronic_over_6_months",
        "label": "Over 6 months (Long-term PPI user - Hypochlorhydria & B12/Iron risk)",
        "label_en": "Chronic > 6 months",
        "label_bn": "৬ মাসের বেশি সময় ধরে নিয়মিত (B12 ও আয়রন শোষণে বাধার ঝুঁকি)"
      }
    ],
    "clinicalTags": [
      "ppi_duration",
      "hypochlorhydria",
      "b12_depletion_risk"
    ]
  },
  {
    "id": "nsaid_painkiller_frequency",
    "label": "NSAID Painkiller Usage Frequency",
    "label_en": "How frequently do you take non-steroidal anti-inflammatory painkillers (Aceclofenac, Naproxen, Ibuprofen)?",
    "label_bn": "ব্যথানাশক ওষুধ (যেমন Aceclofenac, Naproxen) কত ঘনঘন সেবন করেন?",
    "domain": "medication_supplements",
    "answerType": "select",
    "options": [
      {
        "value": "rarely_never",
        "label": "Rarely or never",
        "label_en": "Rarely or never",
        "label_bn": "কখনই না বা কদাচিৎ"
      },
      {
        "value": "few_times_month",
        "label": "A few times a month for headache/cramps",
        "label_en": "Few times/month",
        "label_bn": "মাসে কয়েকবার"
      },
      {
        "value": "weekly_multiple",
        "label": "1 to 3 times per week for joint/back pain",
        "label_en": "Weekly 1-3 times",
        "label_bn": "সপ্তাহে ১-৩ দিন"
      },
      {
        "value": "daily_chronic",
        "label": "Daily chronic use (High GI ulcer and renal risk)",
        "label_en": "Daily chronic use",
        "label_bn": "প্রতিদিন নিয়মিত (আলসার ও কিডনির ক্ষতি হওয়ার ঝুঁকি)"
      }
    ],
    "clinicalTags": [
      "nsaid_frequency",
      "gastric_mucosa_damage",
      "renal_risk"
    ]
  },
  {
    "id": "safety_insulin_active",
    "label": "Active Insulin Therapy",
    "label_en": "Are you currently prescribed and using injectable Insulin therapy?",
    "label_bn": "আপনি কি বর্তমানে ইনসুলিন ইনজেকশন নিচ্ছেন?",
    "domain": "medication_supplements",
    "answerType": "yesno",
    "isHighValueScreening": true,
    "required": true,
    "clinicalTags": [
      "insulin_therapy",
      "hypoglycemia_safety_critical"
    ]
  },
  {
    "id": "safety_sulfonylurea_active",
    "label": "Active Sulfonylurea Medication",
    "label_en": "Are you taking a Sulfonylurea oral medication (Glimepiride, Gliclazide, Glibenclamide)?",
    "label_bn": "আপনি কি সালফোনাইলইউরিয়া জাতীয় ডায়াবেটিস ওষুধ (যেমন Glimepiride, Gliclazide) সেবন করছেন?",
    "domain": "medication_supplements",
    "answerType": "yesno",
    "isHighValueScreening": true,
    "required": true,
    "clinicalTags": [
      "sulfonylurea_active",
      "hypoglycemia_safety_critical"
    ]
  },
  {
    "id": "safety_prescribed_fluid_limit",
    "label": "Clinician-Prescribed Daily Fluid Restriction",
    "label_en": "Has a cardiologist or nephrologist prescribed a strict daily fluid restriction (e.g., 1000 mL or 1500 mL/day)?",
    "label_bn": "ডাক্তার কি আপনার দৈনিক পানি বা তরল গ্রহণের নির্দিষ্ট মাত্রা (যেমন ১০০০ বা ১৫০০ মিলি) বেঁধে দিয়েছেন?",
    "domain": "medication_supplements",
    "answerType": "yesno",
    "isHighValueScreening": true,
    "required": true,
    "clinicalTags": [
      "fluid_restriction_active",
      "safety_critical_fluid"
    ]
  },
  {
    "id": "safety_hospital_feeding_route",
    "label": "Non-Oral Feeding Route / NPO Status",
    "label_en": "Is the patient currently NPO (Nil Per Os) or receiving enteral tube feeding (NG tube, PEG tube)?",
    "label_bn": "রোগী কি বর্তমানে মুখে খাবার খেতে নিষেধ (NPO) অথবা নল দিয়ে খাবার গ্রহণ করছেন?",
    "domain": "medication_supplements",
    "answerType": "select",
    "isHighValueScreening": true,
    "required": true,
    "options": [
      {
        "value": "oral_standard",
        "label": "Oral standard (Safe to eat normally)",
        "label_en": "Oral standard",
        "label_bn": "মুখে স্বাভাবিক খাবার খাচ্ছেন"
      },
      {
        "value": "npo_strict",
        "label": "Strict NPO (Nothing by mouth - Oral food blocked)",
        "label_en": "Strict NPO",
        "label_bn": "সম্পূর্ণ মুখে খাওয়া নিষেধ (NPO)"
      },
      {
        "value": "enteral_ng_tube",
        "label": "Enteral via Nasogastric (NG) Tube",
        "label_en": "Enteral NG Tube",
        "label_bn": "নাকের নল দিয়ে লিকুইড ডায়েট"
      },
      {
        "value": "enteral_peg_tube",
        "label": "Enteral via PEG / G-Tube",
        "label_en": "Enteral PEG Tube",
        "label_bn": "পেটের ছিদ্র/নল দিয়ে খাবার (PEG)"
      }
    ],
    "clinicalTags": [
      "feeding_route_safety",
      "hospital_safety_hard_stop"
    ]
  },
  {
    "id": "safety_dysphagia_choking_risk",
    "label": "Dysphagia & Choking Risk on Liquids or Solids",
    "label_en": "Does the patient cough, choke, or have difficulty swallowing thin liquids or solid food?",
    "label_bn": "খাবার বা পানি গেলার সময় কি কাশি, বিষম খাওয়া বা খাবার আটকে যাওয়ার সমস্যা হয়?",
    "domain": "medication_supplements",
    "answerType": "select",
    "isHighValueScreening": true,
    "required": true,
    "options": [
      {
        "value": "normal_swallowing",
        "label": "Normal swallowing, no choking",
        "label_en": "Normal swallowing",
        "label_bn": "স্বাভাবিকভাবে গিলতে পারেন"
      },
      {
        "value": "thin_liquid_coughing",
        "label": "Coughs on thin liquids (requires nectar-thick fluids)",
        "label_en": "Coughs on liquids",
        "label_bn": "পানি বা পাতলা তরল খেতে গেলে বিষম লাগে"
      },
      {
        "value": "solid_food_difficulty",
        "label": "Difficulty with coarse solids (requires soft/pureed diet)",
        "label_en": "Solid food difficulty",
        "label_bn": "শক্ত খাবার চিবিয়ে গিলতে কষ্ট হয়"
      },
      {
        "value": "severe_aspiration_risk",
        "label": "Severe aspiration risk / Specialist speech-swallow review needed",
        "label_en": "Severe aspiration risk",
        "label_bn": "তীব্র গিলে ফেলার সমস্যা / ফুসফুসে খাবার যাওয়ার মারাত্মক ঝুঁকি"
      }
    ],
    "clinicalTags": [
      "dysphagia",
      "choking_hazard",
      "texture_modification"
    ]
  },
  {
    "id": "statin_myopathy_muscle_ache",
    "label": "Statin-Induced Muscle Aches / CoQ10 Depletion",
    "label_en": "If taking a cholesterol statin (Atorvastatin, Rosuvastatin), do you experience persistent aching in thighs or calves?",
    "label_bn": "কোলেস্টেরলের স্ট্যাটিন ওষুধ খাওয়ার পর থেকে কি উরু বা মাংসপেশিতে অবশ ভাব ও ব্যথা হয়?",
    "domain": "medication_supplements",
    "answerType": "yesno",
    "clinicalTags": [
      "statin_myopathy",
      "coq10_depletion"
    ]
  },
  {
    "id": "daily_sunlight_exposure",
    "label": "Direct Midday Sun Exposure",
    "label_en": "On average, how many minutes per day are your arms and face exposed to direct midday sunlight without sunscreen?",
    "label_bn": "সানস্ক্রিন ছাড়া দিনে কতক্ষণ সরাসরি রোদে থাকা হয়?",
    "domain": "environmental_lifestyle",
    "answerType": "select",
    "options": [
      {
        "value": "less_than_10_mins",
        "label": "< 10 minutes (Predominantly indoor / High Vitamin D risk)",
        "label_en": "< 10 minutes",
        "label_bn": "১০ মিনিটের কম (সারাদিন ভেতরে থাকা)"
      },
      {
        "value": "10_to_20_mins",
        "label": "10 to 20 minutes",
        "label_en": "10-20 minutes",
        "label_bn": "১০ থেকে ২০ মিনিট"
      },
      {
        "value": "20_to_45_mins",
        "label": "20 to 45 minutes",
        "label_en": "20-45 minutes",
        "label_bn": "২০ থেকে ৪৫ মিনিট"
      },
      {
        "value": "over_45_outdoor",
        "label": "> 45 minutes (Regular outdoor work/activities)",
        "label_en": "> 45 minutes outdoor",
        "label_bn": "৪৫ মিনিটের বেশি (নিয়মিত বাইরে কাজ)"
      }
    ],
    "clinicalTags": [
      "sunlight_exposure",
      "vitamin_d_synthesis"
    ]
  },
  {
    "id": "drinking_water_purification",
    "label": "Drinking Water Source & Filtration",
    "label_en": "What is your primary source of household drinking water?",
    "label_bn": "বাসায় পান করার জন্য কোন উৎস ও পরিশোধনের পানি ব্যবহার করেন?",
    "domain": "environmental_lifestyle",
    "answerType": "select",
    "options": [
      {
        "value": "boiled_and_filtered",
        "label": "Municipal supply boiled and candle-filtered",
        "label_en": "Boiled and filtered",
        "label_bn": "ফুটিয়ে ফিল্টার করা সাপ্লাই পানি"
      },
      {
        "value": "ro_reverse_osmosis",
        "label": "Reverse Osmosis (RO) system at home",
        "label_en": "Reverse Osmosis (RO)",
        "label_bn": "রিভার্স অসমোসিস (RO) ফিল্টার"
      },
      {
        "value": "deep_tube_well",
        "label": "Deep tube-well water (> 500 ft)",
        "label_en": "Deep tube-well",
        "label_bn": "গভীর নলকূপের পানি"
      },
      {
        "value": "commercial_jar_water",
        "label": "Commercial 20L plastic jar water",
        "label_en": "Commercial plastic jar",
        "label_bn": "প্লাস্টিকের জারের পানি"
      },
      {
        "value": "direct_tap_unboiled",
        "label": "Direct tap water unboiled (High enteric pathogen risk)",
        "label_en": "Direct unboiled tap",
        "label_bn": "না ফুটিয়ে সরাসরি ট্যাপের পানি"
      }
    ],
    "clinicalTags": [
      "water_source",
      "pathogen_exposure",
      "heavy_metals"
    ]
  },
  {
    "id": "tobacco_smoking_usage",
    "label": "Tobacco & Nicotine Exposure",
    "label_en": "Current tobacco or smokeless nicotine usage status",
    "label_bn": "ধূমপান বা জর্দা/গুল ব্যবহারের অভ্যাস আছে কি?",
    "domain": "environmental_lifestyle",
    "answerType": "select",
    "options": [
      {
        "value": "never_user",
        "label": "Never used tobacco",
        "label_en": "Never used",
        "label_bn": "কখনই কোনো তামাক ব্যবহার করিনি"
      },
      {
        "value": "former_smoker",
        "label": "Former smoker (Quit > 1 year ago)",
        "label_en": "Former smoker",
        "label_bn": "অতীতে খেতাম, এখন ছেড়ে দিয়েছি"
      },
      {
        "value": "daily_cigarette_smoker",
        "label": "Daily cigarette smoker (> 5 sticks/day)",
        "label_en": "Daily smoker",
        "label_bn": "নিয়মিত সিগারেট ধূমপায়ী"
      },
      {
        "value": "smokeless_jarda_gul",
        "label": "Smokeless tobacco (Jarda / Sadapata / Gul with Paan)",
        "label_en": "Smokeless tobacco (Jarda/Gul)",
        "label_bn": "পানের সাথে জর্দা, সাদাপাতা বা গুল ব্যবহার"
      }
    ],
    "clinicalTags": [
      "tobacco_use",
      "oxidative_stress",
      "endothelial_damage"
    ]
  },
  {
    "id": "pregnancy_gestational_week",
    "label": "Gestational Week (Pregnancy)",
    "label_en": "Current week of pregnancy (completed weeks)",
    "label_bn": "গর্ভাবস্থার বর্তমান সপ্তাহ",
    "domain": "clinical_history",
    "subdomain": "pregnancy",
    "answerType": "number",
    "applicablePopulation": [
      "pregnancy"
    ],
    "isHighValueScreening": true,
    "clinicalTags": [
      "pregnancy_week"
    ]
  },
  {
    "id": "pregnancy_blood_pressure_edema",
    "label": "High Blood Pressure or Severe Swelling",
    "label_en": "Have you noticed sudden swelling of face/hands or elevated blood pressure?",
    "label_bn": "হাত-মুখ হঠাৎ ফুলে যাওয়া বা রক্তচাপ বেড়ে যাওয়ার সমস্যা হয়েছে কি?",
    "domain": "clinical_history",
    "subdomain": "pregnancy",
    "answerType": "yesno",
    "applicablePopulation": [
      "pregnancy"
    ],
    "isHighValueScreening": true,
    "clinicalTags": [
      "preeclampsia_risk",
      "red_flag_pregnancy"
    ]
  },
  {
    "id": "pregnancy_nausea_vomiting_hyperemesis",
    "label": "Morning Sickness & Food Tolerance",
    "label_en": "How severe is your pregnancy-related nausea or vomiting?",
    "label_bn": "গর্ভাবস্থায় বমি ভাব বা খাবার খাওয়ার কষ্ট কতটা তীব্র?",
    "domain": "gastrointestinal",
    "subdomain": "pregnancy",
    "answerType": "select",
    "applicablePopulation": [
      "pregnancy"
    ],
    "options": [
      {
        "value": "none_mild",
        "label": "None to mild morning nausea, eats well",
        "label_en": "Mild, eats well",
        "label_bn": "মৃদু বা স্বাভাবিক, খেতে পারি"
      },
      {
        "value": "moderate_specific_aversions",
        "label": "Moderate with specific food smells (rice, fish) triggering nausea",
        "label_en": "Moderate smell aversions",
        "label_bn": "মাঝারি, ভাতের গন্ধ বা মাছের গন্ধে বমি ভাব"
      },
      {
        "value": "severe_hyperemesis",
        "label": "Severe hyperemesis (unable to keep fluids/food down, losing weight)",
        "label_en": "Hyperemesis gravidarum",
        "label_bn": "মারাত্মক বমি, তরল বা খাবার কিছুই পেটে থাকছে না (হাইপারমেসিস)"
      }
    ],
    "clinicalTags": [
      "hyperemesis_gravidarum",
      "maternal_hydration"
    ]
  },
  {
    "id": "lactation_milk_supply_perception",
    "label": "Breast Milk Supply & Maternal Fatigue",
    "label_en": "If lactating, how is your milk supply perception and physical energy?",
    "label_bn": "স্তন্যদানকালীন সময়ে বুকের দুধের পরিমাণ ও আপনার শারীরিক শক্তি কেমন?",
    "domain": "clinical_history",
    "subdomain": "lactation",
    "answerType": "select",
    "applicablePopulation": [
      "lactation"
    ],
    "options": [
      {
        "value": "adequate_well_nourished",
        "label": "Adequate supply, baby gaining weight normally",
        "label_en": "Adequate supply",
        "label_bn": "পর্যাপ্ত দুধ ও শিশুর স্বাভাবিক ওজন বৃদ্ধি"
      },
      {
        "value": "perceived_low_supply",
        "label": "Perceived low supply, frequent hunger cues from infant",
        "label_en": "Perceived low supply",
        "label_bn": "দুধের পরিমাণ কম মনে হয়, বাচ্চা ঘনঘন কাঁদে"
      },
      {
        "value": "severe_maternal_exhaustion",
        "label": "Severe maternal exhaustion, dehydration, and low caloric intake",
        "label_en": "Maternal exhaustion",
        "label_bn": "তীব্র শারীরিক দুর্বলতা, অপুষ্টি ও অপর্যাপ্ত পানি পান"
      }
    ],
    "clinicalTags": [
      "lactation_adequacy",
      "maternal_nutrition"
    ]
  },
  {
    "id": "pediatric_growth_percentile",
    "label": "Child Growth Trajectory",
    "label_en": "Is the child tracking normally on their growth curve for height and weight?",
    "label_bn": "শিশুর বয়স অনুযায়ী উচ্চতা ও ওজনের স্বাভাবিক বৃদ্ধি হচ্ছে কি?",
    "domain": "anthropometrics",
    "subdomain": "pediatric",
    "answerType": "select",
    "applicablePopulation": [
      "pediatric"
    ],
    "isHighValueScreening": true,
    "options": [
      {
        "value": "normal_growth",
        "label": "Growing normally",
        "label_en": "Normal growth curve",
        "label_bn": "স্বাভাবিক বৃদ্ধি হচ্ছে"
      },
      {
        "value": "underweight_stunting",
        "label": "Underweight / Stunted growth concern",
        "label_en": "Underweight concern",
        "label_bn": "বয়সের তুলনায় কম ওজন বা কম উচ্চতা"
      },
      {
        "value": "rapid_childhood_weight",
        "label": "Accelerated rapid weight gain",
        "label_en": "Accelerated weight gain",
        "label_bn": "অস্বাভাবিক দ্রুত ওজন বৃদ্ধি"
      }
    ],
    "clinicalTags": [
      "pediatric_growth"
    ]
  },
  {
    "id": "pediatric_feeding_difficulty",
    "label": "Child Feeding Habits & Appetite",
    "label_en": "Does the child experience extreme food refusal, sensory aversion, or feeding fatigue?",
    "label_bn": "শিশু কি খাবার খেতে তীব্র অনীহা বা অতিরিক্ত কষ্ট প্রকাশ করে?",
    "domain": "gastrointestinal",
    "subdomain": "pediatric",
    "answerType": "select",
    "applicablePopulation": [
      "pediatric"
    ],
    "options": [
      {
        "value": "good_appetite",
        "label": "Good appetite, eats varied foods",
        "label_en": "Good appetite",
        "label_bn": "ভালো রুচি ও স্বাভাবিক খাওয়া"
      },
      {
        "value": "picky_eating_moderate",
        "label": "Picky eating (eats only 3-4 specific foods)",
        "label_en": "Picky eating",
        "label_bn": "নির্দিষ্ট কয়েকটি খাবার ছাড়া খেতে চায় না"
      },
      {
        "value": "severe_feeding_refusal",
        "label": "Severe feeding refusal / weight loss",
        "label_en": "Severe refusal",
        "label_bn": "মারাত্মক খাওয়ানোর কষ্ট ও ওজন হ্রাস"
      }
    ],
    "clinicalTags": [
      "pediatric_feeding"
    ]
  },
  {
    "id": "pediatric_milk_dependence",
    "label": "Excessive Cow's Milk Dependence (> 500 mL/day)",
    "label_en": "Does the toddler or child drink excessive milk (> 2 glasses daily), causing low solid food intake?",
    "label_bn": "শিশু কি অতিরিক্ত দুধ পানের কারণে শক্ত খাবার খেতে চায় না?",
    "domain": "dietary_nutrition",
    "subdomain": "pediatric",
    "answerType": "yesno",
    "applicablePopulation": [
      "pediatric"
    ],
    "clinicalTags": [
      "milk_anemia_risk",
      "pediatric_diet"
    ]
  },
  {
    "id": "oncology_treatment_phase",
    "label": "Oncology Treatment Stage",
    "label_en": "Current phase of cancer therapy",
    "label_bn": "ক্যান্সার চিকিৎসার বর্তমান পর্যায়",
    "domain": "clinical_history",
    "subdomain": "oncology",
    "answerType": "select",
    "applicablePopulation": [
      "oncology"
    ],
    "applicablePathways": [
      "oncology"
    ],
    "isHighValueScreening": true,
    "options": [
      {
        "value": "active_chemotherapy",
        "label": "Active Chemotherapy",
        "label_en": "Active Chemotherapy",
        "label_bn": "বর্তমানে কেমোথেরাপি চলছে"
      },
      {
        "value": "active_radiotherapy",
        "label": "Active Radiotherapy",
        "label_en": "Active Radiotherapy",
        "label_bn": "বর্তমানে রেডিওথেরাপি চলছে"
      },
      {
        "value": "post_surgical_recovery",
        "label": "Post-surgical recovery",
        "label_en": "Post-surgical recovery",
        "label_bn": "অস্ত্রোপচারের পর পুনরুদ্ধার পর্ব"
      },
      {
        "value": "remission_surveillance",
        "label": "Remission / Long-term surveillance",
        "label_en": "Remission / Surveillance",
        "label_bn": "রেমিশন / পর্যবেক্ষণ পর্যায়"
      }
    ],
    "clinicalTags": [
      "oncology_treatment"
    ]
  },
  {
    "id": "oncology_taste_metallic_dysgeusia",
    "label": "Metallic Taste / Severe Dysgeusia",
    "label_en": "Do you experience an unpleasant metallic taste or complete loss of food flavor?",
    "label_bn": "মুখে কি ধাতব স্বাদ বা খাবারের আসল স্বাদ না পাওয়ার অনুভূতি হয়?",
    "domain": "gastrointestinal",
    "subdomain": "oncology",
    "answerType": "yesno",
    "applicablePopulation": [
      "oncology"
    ],
    "applicablePathways": [
      "oncology"
    ],
    "clinicalTags": [
      "dysgeusia",
      "taste_alteration_oncology"
    ]
  },
  {
    "id": "oncology_mucositis_mouth_sores",
    "label": "Oral Mucositis / Painful Mouth Ulcers",
    "label_en": "Do you have painful mouth sores or burning when swallowing soft food?",
    "label_bn": "মুখে ঘা বা খাবার গিলতে তীব্র জ্বালাপোড়ার সমস্যা আছে কি?",
    "domain": "gastrointestinal",
    "subdomain": "oncology",
    "answerType": "yesno",
    "applicablePopulation": [
      "oncology"
    ],
    "applicablePathways": [
      "oncology"
    ],
    "clinicalTags": [
      "oral_mucositis",
      "soft_diet_required"
    ]
  },
  {
    "id": "renal_dialysis_status",
    "label": "Dialysis Status",
    "label_en": "Are you currently receiving regular hemodialysis or peritoneal dialysis?",
    "label_bn": "আপনি কি নিয়মিত হেমোডায়ালাইসিস নিচ্ছেন?",
    "domain": "clinical_history",
    "subdomain": "renal",
    "answerType": "select",
    "applicablePopulation": [
      "renal"
    ],
    "applicablePathways": [
      "renal"
    ],
    "isHighValueScreening": true,
    "options": [
      {
        "value": "not_on_dialysis",
        "label": "No (Non-dialysis CKD)",
        "label_en": "Non-dialysis CKD",
        "label_bn": "না (ডায়ালাইসিস ছাড়া সিকেডি)"
      },
      {
        "value": "hemodialysis_twice_weekly",
        "label": "Hemodialysis (2x per week)",
        "label_en": "Hemodialysis 2x/week",
        "label_bn": "হেমোডায়ালাইসিস (সপ্তাহে ২ বার)"
      },
      {
        "value": "hemodialysis_thrice_weekly",
        "label": "Hemodialysis (3x per week)",
        "label_en": "Hemodialysis 3x/week",
        "label_bn": "হেমোডায়ালাইসিস (সপ্তাহে ৩ বার)"
      },
      {
        "value": "peritoneal_dialysis",
        "label": "Peritoneal Dialysis (CAPD)",
        "label_en": "Peritoneal Dialysis",
        "label_bn": "পেরিটনিয়াল ডায়ালাইসিস"
      }
    ],
    "clinicalTags": [
      "dialysis_status",
      "ckd_management"
    ]
  },
  {
    "id": "renal_urine_output_volume",
    "label": "24-Hour Urine Volume Changes",
    "label_en": "Has your daily urine output noticeably decreased (oliguria < 500 mL)?",
    "label_bn": "দৈনিক প্রস্রাবের পরিমাণ কি আশঙ্কাজনকভাবে কমে গেছে (< ৫০০ মিলি)?",
    "domain": "hepatic_biotransformation",
    "subdomain": "renal",
    "answerType": "select",
    "applicablePopulation": [
      "renal"
    ],
    "applicablePathways": [
      "renal"
    ],
    "options": [
      {
        "value": "normal_volume_1_2L",
        "label": "Normal (1-2 Liters per day)",
        "label_en": "Normal 1-2L",
        "label_bn": "স্বাভাবিক (১-২ লিটার)"
      },
      {
        "value": "reduced_oliguria",
        "label": "Reduced volume (< 800 mL/day)",
        "label_en": "Reduced (< 800 mL)",
        "label_bn": "কমে গেছে (< ৮০০ মিলি)"
      },
      {
        "value": "anuria_near_zero",
        "label": "Minimal / Anuria (< 200 mL/day on dialysis)",
        "label_en": "Anuria (< 200 mL)",
        "label_bn": "খুবই সামান্য বা প্রায় বন্ধ"
      }
    ],
    "clinicalTags": [
      "urine_output",
      "oliguria_renal"
    ]
  },
  {
    "id": "renal_foamy_urine_proteinuria",
    "label": "Foamy or Frothy Urine (Proteinuria sign)",
    "label_en": "Does your urine consistently appear foamy with bubbles that do not easily disperse?",
    "label_bn": "প্রস্রাবে কি সাবানের ফেনার মতো প্রচুর বুদবুদ দেখা যায়?",
    "domain": "hepatic_biotransformation",
    "subdomain": "renal",
    "answerType": "yesno",
    "applicablePopulation": [
      "renal"
    ],
    "applicablePathways": [
      "renal"
    ],
    "clinicalTags": [
      "foamy_urine",
      "proteinuria"
    ]
  },
  {
    "id": "geriatric_chewing_dentition",
    "label": "Dentition & Chewing Capacity",
    "label_en": "Can the patient comfortably chew tough foods (raw salads, meat) with natural teeth or dentures?",
    "label_bn": "রোগী কি শক্ত খাবার (যেমন মাংস, সালাদ) স্বাভাবিকভাবে চিবিয়ে খেতে পারেন?",
    "domain": "gastrointestinal",
    "subdomain": "geriatric",
    "answerType": "select",
    "applicablePopulation": [
      "geriatric"
    ],
    "options": [
      {
        "value": "chews_normal_solids",
        "label": "Full dentition / chews all solid foods easily",
        "label_en": "Normal chewing",
        "label_bn": "সব খাবার স্বাভাবিকভাবে চিবিয়ে খেতে পারেন"
      },
      {
        "value": "dentures_needs_soft",
        "label": "Dentures / Needs soft cooked food and ground textures",
        "label_en": "Needs soft food",
        "label_bn": "দাঁত কম বা আলগা দাঁত / নরম খাবার প্রয়োজন"
      },
      {
        "value": "edentulous_pureed_only",
        "label": "Missing teeth / requires fully pureed or liquid meals",
        "label_en": "Requires pureed/liquid",
        "label_bn": "দাঁত নেই / তরল বা ব্লেন্ড করা খাবার ছাড়া খেতে পারেন না"
      }
    ],
    "clinicalTags": [
      "dentition",
      "geriatric_chewing"
    ]
  },
  {
    "id": "geriatric_falls_balance_history",
    "label": "Falls or Balance Instability in Past Year",
    "label_en": "Has the patient experienced any falls or significant gait unsteadiness in the past 12 months?",
    "label_bn": "গত এক বছরে রোগী কি পড়ে গেছেন বা হাঁটার সময় ভারসাম্যহীনতায় ভুগেছেন?",
    "domain": "anthropometrics",
    "subdomain": "geriatric",
    "answerType": "select",
    "applicablePopulation": [
      "geriatric"
    ],
    "options": [
      {
        "value": "zero_falls",
        "label": "0 falls, steady gait",
        "label_en": "0 falls",
        "label_bn": "কখনই পড়ে যাননি, হাঁটাচলা স্বাভাবিক"
      },
      {
        "value": "one_fall_minor",
        "label": "1 fall without major fracture",
        "label_en": "1 fall",
        "label_bn": "১ বার পড়ে গেছেন"
      },
      {
        "value": "multiple_falls_fracture_risk",
        "label": "2 or more falls / severe frailty (High fracture risk)",
        "label_en": "2+ falls / frailty",
        "label_bn": "২ বা ততোধিক বার পড়ে গেছেন (হাড় ভাঙার মারাত্মক ঝুঁকি)"
      }
    ],
    "clinicalTags": [
      "falls_risk",
      "sarcopenia_frailty"
    ]
  },
  {
    "id": "underweight_appetite_loss_severity",
    "label": "Severe Loss of Appetite (Anorexia)",
    "label_en": "How would you describe your current appetite for meals?",
    "label_bn": "আপনার বর্তমান খাবারের রুচি কেমন?",
    "domain": "gastrointestinal",
    "subdomain": "underweight",
    "answerType": "select",
    "isHighValueScreening": true,
    "options": [
      {
        "value": "normal_healthy_appetite",
        "label": "Normal appetite, enjoys food",
        "label_en": "Normal appetite",
        "label_bn": "স্বাভাবিক রুচি"
      },
      {
        "value": "diminished_must_force",
        "label": "Poor appetite, has to force-feed small portions",
        "label_en": "Diminished appetite",
        "label_bn": "রুচি খুব কম, জোর করে অল্প খেতে হয়"
      },
      {
        "value": "complete_aversion_anorexia",
        "label": "Complete food repulsion / nausea at the sight of food",
        "label_en": "Complete aversion",
        "label_bn": "খাবারের প্রতি তীব্র অনীহা বা খাবার দেখলে বমি ভাব"
      }
    ],
    "clinicalTags": [
      "anorexia",
      "malnutrition_risk"
    ]
  },
  {
    "id": "underweight_muscle_wasting_signs",
    "label": "Visible Muscle Wasting (Temples / Collarbones)",
    "label_en": "Is there visible hollowing of the temples, protruding collarbones, or loose skin on upper arms?",
    "label_bn": "কপালের দুই পাশ দেবে যাওয়া, কলারবোন বা গলার হাড় ভেসে ওঠা বা বাহুর মাংসপেশি শুকিয়ে গেছে কি?",
    "domain": "anthropometrics",
    "subdomain": "underweight",
    "answerType": "yesno",
    "isHighValueScreening": true,
    "clinicalTags": [
      "muscle_wasting",
      "sarcopenia_cachexia"
    ]
  },
  {
    "id": "cardio_exertional_chest_tightness",
    "label": "Exertional Chest Tightness or Pressure",
    "label_en": "Do you experience heaviness, tightness, or squeezing pressure in the chest when walking uphill or fast?",
    "label_bn": "দ্রুত বা চড়াইয়ে হাঁটার সময় কি বুকে ভারী ভাব, চাপ বা শ্বাসকষ্ট অনুভূত হয়?",
    "domain": "clinical_history",
    "subdomain": "cardiovascular",
    "answerType": "yesno",
    "applicablePathways": [
      "cardiovascular"
    ],
    "isHighValueScreening": true,
    "clinicalTags": [
      "angina_red_flag",
      "cardiovascular_urgency"
    ]
  },
  {
    "id": "cardio_orthopnea_pillows",
    "label": "Orthopnea / Sleeping on Multiple Pillows",
    "label_en": "Do you need to prop yourself up on 2 or more pillows at night to avoid feeling breathless lying flat?",
    "label_bn": "সোজা হয়ে শুলে শ্বাসকষ্ট হওয়ার কারণে কি রাতে ২ বা ততোধিক বালিশ উঁচু করে শুতে হয়?",
    "domain": "clinical_history",
    "subdomain": "cardiovascular",
    "answerType": "select",
    "applicablePathways": [
      "cardiovascular"
    ],
    "options": [
      {
        "value": "sleeps_flat_fine",
        "label": "Sleeps flat with 1 pillow comfortably",
        "label_en": "Sleeps flat",
        "label_bn": "একটি বালিশে স্বাভাবিকভাবে ঘুমাতে পারি"
      },
      {
        "value": "needs_elevated_pillows",
        "label": "Requires 2-3 pillows to breathe comfortably (Orthopnea sign)",
        "label_en": "Requires 2+ pillows",
        "label_bn": "শ্বাসকষ্টের জন্য ২-৩টি বালিশ উঁচু করে শুতে হয়"
      },
      {
        "value": "wakes_gasping_pnd",
        "label": "Wakes gasping for air 1-2 hours after falling asleep (PND sign)",
        "label_en": "Wakes gasping (PND)",
        "label_bn": "ঘুমানোর কয়েক ঘণ্টা পর দম বন্ধ হয়ে ঘুম ভেঙে যায়"
      }
    ],
    "clinicalTags": [
      "orthopnea",
      "paroxysmal_nocturnal_dyspnea",
      "heart_failure_screen"
    ]
  },
  {
    "id": "cardio_palpitations_racing",
    "label": "Arrhythmia or Irregular Palpitations",
    "label_en": "Do you experience sudden fluttering, skipped beats, or rapid pounding in your chest?",
    "label_bn": "বুকে হঠাৎ ধড়ফড়ানি, একটি বিট মিস হওয়া বা অস্বাভাবিক দ্রুত স্পন্দন হয় কি?",
    "domain": "metabolic",
    "subdomain": "cardiovascular",
    "answerType": "yesno",
    "applicablePathways": [
      "cardiovascular"
    ],
    "clinicalTags": [
      "palpitations",
      "arrhythmia_screen"
    ]
  },
  {
    "id": "cardio_prescribed_sodium_cap",
    "label": "Cardiologist Prescribed Salt Restriction",
    "label_en": "Has your physician instructed you to limit daily salt to less than 1 level teaspoon (< 5g salt / 2000mg Na)?",
    "label_bn": "ডাক্তার কি রান্নাসহ সারাদিনে ১ চা চামচের কম লবণ (< ৫ গ্রাম) খাওয়ার কড়া নির্দেশ দিয়েছেন?",
    "domain": "dietary_nutrition",
    "subdomain": "cardiovascular",
    "answerType": "yesno",
    "applicablePathways": [
      "cardiovascular"
    ],
    "clinicalTags": [
      "sodium_restriction_prescribed"
    ]
  },
  {
    "id": "cardio_intermittent_claudication",
    "label": "Calf Cramping When Walking (Claudication)",
    "label_en": "Do you get severe cramping pain in calves when walking that forces you to stop, and resolves with rest?",
    "label_bn": "কিছুক্ষণ হাঁটলেই কি পায়ের পেছনের পেশিতে তীব্র টান বা খিল ধরে যা থামলে কমে যায়?",
    "domain": "anthropometrics",
    "subdomain": "cardiovascular",
    "answerType": "yesno",
    "applicablePathways": [
      "cardiovascular"
    ],
    "clinicalTags": [
      "intermittent_claudication",
      "peripheral_arterial_disease"
    ]
  },
  {
    "id": "renal_potassium_restriction_prescribed",
    "label": "Prescribed Dietary Potassium Restriction",
    "label_en": "Has a nephrologist instructed you to avoid high-potassium foods (coconut water, bananas, dal water)?",
    "label_bn": "কিডনি চিকিৎসক কি ডাবের পানি, কলা বা শাকসবজির পটাশিয়াম সীমিত রাখতে বলেছেন?",
    "domain": "dietary_nutrition",
    "subdomain": "renal",
    "answerType": "yesno",
    "applicablePopulation": [
      "renal"
    ],
    "applicablePathways": [
      "renal"
    ],
    "clinicalTags": [
      "potassium_restriction_prescribed",
      "hyperkalemia_safety"
    ]
  },
  {
    "id": "renal_phosphorus_binders_timing",
    "label": "Phosphorus Binder Medication Timing",
    "label_en": "If taking phosphate binders (Calcium acetate, Sevelamer), do you take them with the first bites of meals?",
    "label_bn": "ফসফেট বাইন্ডার ওষুধ কি খাবারের প্রথম লোকমার সাথে খান?",
    "domain": "medication_supplements",
    "subdomain": "renal",
    "answerType": "select",
    "applicablePopulation": [
      "renal"
    ],
    "applicablePathways": [
      "renal"
    ],
    "options": [
      {
        "value": "not_prescribed",
        "label": "Not prescribed phosphate binders",
        "label_en": "Not prescribed",
        "label_bn": "এই ওষুধটি খাচ্ছি না"
      },
      {
        "value": "with_first_bites",
        "label": "Taken with the very first bites of food (Optimal binding)",
        "label_en": "With first bites",
        "label_bn": "খাবারের প্রথম লোকমার সাথে (সঠিক নিয়ম)"
      },
      {
        "value": "after_meals_empty",
        "label": "Taken on empty stomach or hours after eating (Ineffective binding)",
        "label_en": "Hours after meals",
        "label_bn": "খাওয়ার অনেক পরে বা খালি পেটে খাই"
      }
    ],
    "clinicalTags": [
      "phosphate_binders",
      "hyperphosphatemia"
    ]
  },
  {
    "id": "renal_uremic_pruritus_itching",
    "label": "Generalized Intractable Itching (Uremic Pruritus)",
    "label_en": "Do you experience severe, deep-seated skin itching all over without an allergic rash?",
    "label_bn": "কোনো র্যাশ বা অ্যালার্জি ছাড়াই কি সারা শরীরে তীব্র চুলকানি হয় (ইউরেমিক প্রুরাইটিস)?",
    "domain": "immune_inflammatory",
    "subdomain": "renal",
    "answerType": "yesno",
    "applicablePopulation": [
      "renal"
    ],
    "applicablePathways": [
      "renal"
    ],
    "clinicalTags": [
      "uremic_pruritus",
      "renal_toxin_accumulation"
    ]
  },
  {
    "id": "renal_metallic_breath_ammonia",
    "label": "Uremic Fetor / Ammonia Breath Odor",
    "label_en": "Do family members notice an ammonia-like or urine-like odor on your breath?",
    "label_bn": "নিশ্বাসে কি অ্যামোনিয়ার মতো বা অস্বাভাবিক গন্ধ লক্ষ্য করেছেন?",
    "domain": "gastrointestinal",
    "subdomain": "renal",
    "answerType": "yesno",
    "applicablePopulation": [
      "renal"
    ],
    "applicablePathways": [
      "renal"
    ],
    "clinicalTags": [
      "uremic_fetor",
      "advanced_ckd_sign"
    ]
  },
  {
    "id": "surgical_days_post_op",
    "label": "Days Since Surgical Procedure",
    "label_en": "How many days have passed since your surgery?",
    "label_bn": "অস্ত্রোপচারের পর কত দিন অতিবাহিত হয়েছে?",
    "domain": "clinical_history",
    "subdomain": "surgical",
    "answerType": "number",
    "unit": "days",
    "applicablePathways": [
      "surgical"
    ],
    "clinicalTags": [
      "post_op_days"
    ]
  },
  {
    "id": "surgical_bowel_sounds_flatus",
    "label": "Return of Bowel Sounds / Flatus Passage",
    "label_en": "Have you passed gas (flatus) or had a bowel movement since the operation?",
    "label_bn": "অপারেশনের পর কি পেটে বাতকর্ম হয়েছে বা মলত্যাগ শুরু হয়েছে?",
    "domain": "gastrointestinal",
    "subdomain": "surgical",
    "answerType": "yesno",
    "applicablePathways": [
      "surgical"
    ],
    "clinicalTags": [
      "post_op_ileus",
      "motility_return"
    ]
  },
  {
    "id": "surgical_parenteral_nutrition_tpn",
    "label": "Active Total Parenteral Nutrition (TPN / IV Nutrition)",
    "label_en": "Is the patient receiving central intravenous Total Parenteral Nutrition?",
    "label_bn": "রোগী কি বর্তমানে স্যালাইনের মাধ্যমে আইভি পুষ্টি (TPN) নিচ্ছেন?",
    "domain": "medication_supplements",
    "subdomain": "surgical",
    "answerType": "yesno",
    "applicablePathways": [
      "surgical"
    ],
    "clinicalTags": [
      "tpn_active",
      "intravenous_nutrition"
    ]
  },
  {
    "id": "surgical_wound_healing_drainage",
    "label": "Surgical Wound Healing & Purulent Drainage",
    "label_en": "Is the surgical incision healing cleanly, or is there persistent redness, gaping, or foul drainage?",
    "label_bn": "অপারেশনের ক্ষত কি শুকিয়ে আসছে নাকি সেখান থেকে পানি বা পুঁজ ঝরছে?",
    "domain": "immune_inflammatory",
    "subdomain": "surgical",
    "answerType": "select",
    "applicablePathways": [
      "surgical"
    ],
    "options": [
      {
        "value": "clean_healing",
        "label": "Clean incision, healing normally",
        "label_en": "Clean healing",
        "label_bn": "পরিষ্কার ও স্বাভাবিকভাবে শুকিয়ে আসছে"
      },
      {
        "value": "delayed_healing_redness",
        "label": "Delayed healing / local redness",
        "label_en": "Delayed healing",
        "label_bn": "শুকোতে দেরি হচ্ছে বা লালচে ভাব আছে"
      },
      {
        "value": "purulent_foul_drainage",
        "label": "Purulent or foul-smelling wound discharge (Infection sign)",
        "label_en": "Purulent drainage",
        "label_bn": "পুঁজ বা দুর্গন্ধযুক্ত রস ঝরছে (সংক্রমণের লক্ষণ)"
      }
    ],
    "clinicalTags": [
      "wound_healing",
      "protein_depletion_wound"
    ]
  },
  {
    "id": "underweight_loss_intentionality",
    "label": "Intentionality of Weight Loss",
    "label_en": "Was this weight loss caused by deliberate fasting/caloric restriction, or happened despite eating normally?",
    "label_bn": "ওজন হ্রাস কি ইচ্ছাকৃত ডায়েটের কারণে হয়েছে, নাকি স্বাভাবিক খাওয়া সত্ত্বেও নিজে থেকেই কমেছে?",
    "domain": "anthropometrics",
    "subdomain": "underweight",
    "answerType": "select",
    "options": [
      {
        "value": "intentional_diet_exercise",
        "label": "Intentional dieting or aggressive fasting",
        "label_en": "Intentional dieting",
        "label_bn": "ইচ্ছাকৃত ডায়েট বা রোজা রাখার কারণে"
      },
      {
        "value": "loss_despite_normal_intake",
        "label": "Unintentional loss despite eating normal or large portions (Malabsorption / Hypermetabolic)",
        "label_en": "Loss despite eating",
        "label_bn": "স্বাভাবিক খাওয়া সত্ত্বেও ওজন কমে যাচ্ছে (অপশোষণ বা উচ্চ বিপাক)"
      },
      {
        "value": "loss_due_to_loss_of_appetite",
        "label": "Caused by complete loss of appetite and nausea",
        "label_en": "Due to anorexia",
        "label_bn": "খাবারের রুচি পুরোপুরি চলে যাওয়ার কারণে"
      }
    ],
    "clinicalTags": [
      "weight_loss_intentionality",
      "malabsorption_screen"
    ]
  },
  {
    "id": "underweight_refeeding_edema_risk",
    "label": "Refeeding Risk / Edema After Carbohydrate Reintroduction",
    "label_en": "Has sudden ankle swelling or breathlessness occurred after restarting full meals following prolonged starvation?",
    "label_bn": "দীর্ঘদিন অনাহারে থাকার পর হঠাৎ বেশি খাবার শুরু করায় কি পা ফুলে যাওয়া বা শ্বাসকষ্ট হয়েছে?",
    "domain": "metabolic",
    "subdomain": "underweight",
    "answerType": "yesno",
    "isHighValueScreening": true,
    "clinicalTags": [
      "refeeding_syndrome_alert",
      "hypophosphatemia_risk"
    ]
  },
  {
    "id": "underweight_meal_access_finances",
    "label": "Food Security & Meal Access Capacity",
    "label_en": "Does the patient have consistent family support, culinary ability, and financial access to regular meals?",
    "label_bn": "রোগীর কি নিয়মিত পুষ্টিকর খাদ্য প্রস্তুত বা জোগাড় করার মতো আর্থিক ও পারিবারিক সহায়তা রয়েছে?",
    "domain": "dietary_nutrition",
    "subdomain": "underweight",
    "answerType": "yesno",
    "clinicalTags": [
      "food_security",
      "social_determinants"
    ]
  },
  {
    "id": "pediatric_constipation_withholding",
    "label": "Painful Defecation & Stool Withholding Behavior",
    "label_en": "Does the child avoid passing stool, hide in corners, or cry due to past painful hard stools?",
    "label_bn": "শিশু কি মলত্যাগে ব্যথার ভয়ে মল আটকে রাখে বা কান্নাকাটি করে?",
    "domain": "microbiome",
    "subdomain": "pediatric",
    "answerType": "yesno",
    "applicablePopulation": [
      "pediatric"
    ],
    "clinicalTags": [
      "pediatric_withholding",
      "encopresis_risk"
    ]
  },
  {
    "id": "adolescent_body_image_restriction",
    "label": "Severe Caloric Restriction or Fear of Gaining Weight",
    "label_en": "Does the adolescent show intense anxiety over body weight, skip meals intentionally, or use laxatives?",
    "label_bn": "কিশোর/কিশোরী কি মোটা হওয়ার ভয়ে খাবার খাওয়া অতিরিক্ত বন্ধ করে দিচ্ছে?",
    "domain": "stress_neurobehavioral",
    "subdomain": "adolescent",
    "answerType": "yesno",
    "applicablePopulation": [
      "adolescent"
    ],
    "clinicalTags": [
      "eating_disorder_screen",
      "anorexia_nervosa_risk"
    ]
  },
  {
    "id": "adolescent_energy_drink_caffeine",
    "label": "Energy Drink or Commercial Caffeine Consumption",
    "label_en": "Does the adolescent consume commercial energy drinks (Tiger, Speed) or multiple cups of sweet milk tea daily?",
    "label_bn": "কিশোর/কিশোরী কি প্রতিদিন প্যাকেট এনার্জি ড্রিংকস বা অতিরিক্ত চিনিযুক্ত দুধ চা পান করে?",
    "domain": "dietary_nutrition",
    "subdomain": "adolescent",
    "answerType": "yesno",
    "applicablePopulation": [
      "adolescent"
    ],
    "clinicalTags": [
      "adolescent_energy_drinks",
      "sugar_caffeine_excess"
    ]
  },
  {
    "id": "geriatric_polypharmacy_med_count",
    "label": "Polypharmacy Burden (Daily Prescription Count)",
    "label_en": "How many distinct prescription medicines does the older adult consume daily?",
    "label_bn": "বয়স্ক রোগী প্রতিদিন মোট কয়টি ভিন্ন ভিন্ন প্রেসক্রিপশনের ওষুধ খান?",
    "domain": "medication_supplements",
    "subdomain": "geriatric",
    "answerType": "select",
    "applicablePopulation": [
      "geriatric"
    ],
    "options": [
      {
        "value": "under_3_meds",
        "label": "1 to 3 medications",
        "label_en": "1-3 meds",
        "label_bn": "১ থেকে ৩টি ওষুধ"
      },
      {
        "value": "4_to_6_meds",
        "label": "4 to 6 medications (Moderate polypharmacy)",
        "label_en": "4-6 meds",
        "label_bn": "৪ থেকে ৬টি ওষুধ"
      },
      {
        "value": "7_plus_meds",
        "label": "7 or more daily medications (Severe polypharmacy & drug-nutrient interaction risk)",
        "label_en": "7+ meds",
        "label_bn": "৭টি বা তার বেশি ওষুধ (ওষুধে ওষুধে প্রতিক্রিয়ার উচ্চ ঝুঁকি)"
      }
    ],
    "clinicalTags": [
      "polypharmacy",
      "geriatric_safety"
    ]
  },
  {
    "id": "geriatric_taste_smell_diminution",
    "label": "Age-Related Diminution of Taste and Smell",
    "label_en": "Has food become largely tasteless, causing the senior to complain that 'nothing tastes good anymore'?",
    "label_bn": "খাবারের স্বাদ বা ঘ্রাণ কমে যাওয়ায় রোগী কি খেতে অনীহা প্রকাশ করছেন?",
    "domain": "gastrointestinal",
    "subdomain": "geriatric",
    "answerType": "yesno",
    "applicablePopulation": [
      "geriatric"
    ],
    "clinicalTags": [
      "hypogeusia",
      "zinc_deficiency_elderly"
    ]
  },
  {
    "id": "geriatric_thirst_blunting_dehydration",
    "label": "Blunted Thirst Sensation & Dehydration Risk",
    "label_en": "Does the elderly individual rarely ask for water or forget to drink fluids unless physically handed a glass?",
    "label_bn": "বয়স্ক রোগী কি নিজে থেকে পানি চাইতে ভুলে যান বা তৃষ্ণা না পাওয়ার কথা বলেন?",
    "domain": "dietary_nutrition",
    "subdomain": "geriatric",
    "answerType": "yesno",
    "applicablePopulation": [
      "geriatric"
    ],
    "clinicalTags": [
      "geriatric_dehydration",
      "thirst_blunting"
    ]
  },
  {
    "id": "oncology_weight_loss_pct_6m",
    "label": "Cancer-Related Weight Loss in Last 6 Months",
    "label_en": "What percentage of body weight has been lost in the past 6 months since cancer diagnosis?",
    "label_bn": "ক্যান্সার শনাক্তের পর গত ৬ মাসে দেহের মোট ওজনের কত শতাংশ কমেছে?",
    "domain": "anthropometrics",
    "subdomain": "oncology",
    "answerType": "select",
    "applicablePopulation": [
      "oncology"
    ],
    "applicablePathways": [
      "oncology"
    ],
    "options": [
      {
        "value": "under_5_pct",
        "label": "< 5% (Weight stable / mild)",
        "label_en": "< 5%",
        "label_bn": "৫% এর কম"
      },
      {
        "value": "5_to_10_pct",
        "label": "5% to 10% (Clinically significant cancer cachexia risk)",
        "label_en": "5-10%",
        "label_bn": "৫% থেকে ১০% (ক্যাচেক্সিয়ার ঝুঁকি)"
      },
      {
        "value": "over_10_pct_severe",
        "label": "> 10% (Severe cancer cachexia)",
        "label_en": "> 10%",
        "label_bn": "১০% এর বেশি (তীব্র ক্যাচেক্সিয়া)"
      }
    ],
    "clinicalTags": [
      "cancer_cachexia",
      "oncology_nutrition"
    ]
  },
  {
    "id": "oncology_neutropenia_food_safety",
    "label": "Neutropenia Alert / Strict Low-Microbial Diet Needed",
    "label_en": "Has the oncologist alerted that white blood cells / absolute neutrophil count (ANC) is critically low?",
    "label_bn": "রক্তে শ্বেতকণিকা (Neutrophil) মারাত্মক কমে যাওয়ায় ডাক্তার কি কাঁচা বা খোসা না ছাড়ানো খাবার নিষেধ করেছেন?",
    "domain": "immune_inflammatory",
    "subdomain": "oncology",
    "answerType": "yesno",
    "applicablePopulation": [
      "oncology"
    ],
    "applicablePathways": [
      "oncology"
    ],
    "isHighValueScreening": true,
    "clinicalTags": [
      "neutropenia_diet",
      "low_microbial_diet"
    ]
  },
  {
    "id": "lactation_infant_colic_post_dairy",
    "label": "Infant Colic or Blood in Stool After Maternal Dairy",
    "label_en": "Does your breastfed infant cry inconsolably with gas or show flecks of blood in stool after you drink cow's milk?",
    "label_bn": "মা গরুর দুধ খেলে কি শিশুর পেটে তীব্র গ্যাস বা কান্নাকাটি এবং মলে রক্তের কণা দেখা দেয়?",
    "domain": "immune_inflammatory",
    "subdomain": "lactation",
    "answerType": "yesno",
    "applicablePopulation": [
      "lactation"
    ],
    "clinicalTags": [
      "cows_milk_protein_allergy",
      "cmpa_maternal_elimination"
    ]
  },
  {
    "id": "lactation_daily_hydration_liters",
    "label": "Maternal Plain Water Intake While Breastfeeding",
    "label_en": "How many liters of water do you drink daily to support breast milk volume?",
    "label_bn": "বুকের দুধের উৎপাদনের জন্য দিনে কত লিটার পানি পান করছেন?",
    "domain": "dietary_nutrition",
    "subdomain": "lactation",
    "answerType": "select",
    "applicablePopulation": [
      "lactation"
    ],
    "options": [
      {
        "value": "less_than_2L",
        "label": "< 2 Liters (Risk of low milk volume and maternal dehydration)",
        "label_en": "< 2 L",
        "label_bn": "২ লিটারের কম (দুধ কমে যাওয়া ও পানিশূন্যতার ঝুঁকি)"
      },
      {
        "value": "2_to_3L",
        "label": "2.0 to 3.0 Liters (Optimal)",
        "label_en": "2-3 L",
        "label_bn": "২ থেকে ৩ লিটার (আদর্শ)"
      },
      {
        "value": "over_3L",
        "label": "> 3.0 Liters",
        "label_en": "> 3 L",
        "label_bn": "৩ লিটারের বেশি"
      }
    ],
    "clinicalTags": [
      "lactation_hydration",
      "milk_volume"
    ]
  },
  {
    "id": "dietary_table_salt_habit",
    "label": "Raw Table Salt Added to Rice",
    "label_en": "Do you habitually sprinkle raw table salt onto cooked rice or curry at the table?",
    "label_bn": "পাতে ভাতের সাথে বাড়তি কাঁচা লবণ মিশিয়ে খাওয়ার নিয়মিত অভ্যাস আছে কি?",
    "domain": "dietary_nutrition",
    "answerType": "yesno",
    "isHighValueScreening": true,
    "clinicalTags": [
      "raw_salt_exposure",
      "hypertension_sodium"
    ]
  },
  {
    "id": "dietary_daily_vegetable_servings",
    "label": "Daily Cooked Vegetable & Shak Servings",
    "label_en": "How many standard cups/katoris of green leafy vegetables (shak) or vegetable curry do you eat daily?",
    "label_bn": "সারাদিনে গড়ে কত বাটি শাকসবজি খাওয়া হয়?",
    "domain": "dietary_nutrition",
    "answerType": "select",
    "options": [
      {
        "value": "under_one_cup",
        "label": "Less than 1 cup per day",
        "label_en": "< 1 cup",
        "label_bn": "১ কাপের কম"
      },
      {
        "value": "one_to_two_cups",
        "label": "1 to 2 cups per day",
        "label_en": "1-2 cups",
        "label_bn": "১ থেকে ২ কাপ"
      },
      {
        "value": "three_plus_cups",
        "label": "3 or more cups per day (Optimal fiber and potassium)",
        "label_en": "3+ cups",
        "label_bn": "৩ বা ততোধিক কাপ (আদর্শ আঁশ ও পটাশিয়াম)"
      }
    ],
    "clinicalTags": [
      "vegetable_servings",
      "dietary_potassium",
      "fiber_intake"
    ]
  },
  {
    "id": "dietary_daily_fruit_servings",
    "label": "Daily Whole Fresh Fruit Intake",
    "label_en": "How many whole fresh seasonal fruits (banana, guava, papaya, apple) do you consume daily?",
    "label_bn": "প্রতিদিন গড়ে কয়টি গোটা তাজা ফল (যেমন পেয়ারা, কলা, পেঁপে বা আপেল) খাওয়া হয়?",
    "domain": "dietary_nutrition",
    "answerType": "select",
    "options": [
      {
        "value": "rarely_fruits",
        "label": "Rarely / 1-2 times a week",
        "label_en": "Rarely",
        "label_bn": "খুব কম / সপ্তাহে ১-২ দিন"
      },
      {
        "value": "one_fruit_daily",
        "label": "1 medium fruit daily",
        "label_en": "1 fruit/day",
        "label_bn": "প্রতিদিন ১টি"
      },
      {
        "value": "two_plus_fruits_daily",
        "label": "2 or more whole fruits daily",
        "label_en": "2+ fruits/day",
        "label_bn": "প্রতিদিন ২টি বা তার বেশি"
      }
    ],
    "clinicalTags": [
      "fruit_servings",
      "antioxidant_intake"
    ]
  },
  {
    "id": "dietary_sweet_tea_cups_per_day",
    "label": "Daily Sweet Milk Tea (Dudh Cha) Count",
    "label_en": "How many cups of sweetened milk tea do you drink per day?",
    "label_bn": "প্রতিদিন কত কাপ দুধ চা (চিনিযুক্ত) পান করেন?",
    "domain": "dietary_nutrition",
    "answerType": "select",
    "isHighValueScreening": true,
    "options": [
      {
        "value": "zero_cups",
        "label": "0 cups (do not drink sweet milk tea)",
        "label_en": "0 cups",
        "label_bn": "এক কাপও না"
      },
      {
        "value": "one_to_two_cups",
        "label": "1 to 2 cups per day",
        "label_en": "1-2 cups",
        "label_bn": "দিনে ১ থেকে ২ কাপ"
      },
      {
        "value": "three_to_four_cups",
        "label": "3 to 4 cups per day",
        "label_en": "3-4 cups",
        "label_bn": "দিনে ৩ থেকে ৪ কাপ"
      },
      {
        "value": "five_plus_heavy",
        "label": "5 or more cups per day (Heavy refined sugar and condensed milk exposure)",
        "label_en": "5+ cups",
        "label_bn": "৫ কাপ বা তার বেশি (অতিরিক্ত চিনি ও ফ্যাটের উৎস)"
      }
    ],
    "clinicalTags": [
      "milk_tea_sugar",
      "liquid_sugar_intake"
    ]
  },
  {
    "id": "dietary_fried_street_snack_frequency",
    "label": "Weekly Deep-Fried Street Food Frequency",
    "label_en": "How many days per week do you consume singara, somucha, puri, piyaju, or fried chicken?",
    "label_bn": "সপ্তাহে কত দিন সিঙ্গাড়া, সমুচা, পুরি, পেঁয়াজু বা ভাজাপোড়া খাবার খাওয়া হয়?",
    "domain": "dietary_nutrition",
    "answerType": "select",
    "isHighValueScreening": true,
    "options": [
      {
        "value": "never_rarely",
        "label": "Rarely or never",
        "label_en": "Rarely",
        "label_bn": "কখনই না বা খুব কম"
      },
      {
        "value": "one_to_two_days",
        "label": "1 to 2 days per week",
        "label_en": "1-2 days/week",
        "label_bn": "সপ্তাহে ১-২ দিন"
      },
      {
        "value": "three_to_four_days",
        "label": "3 to 4 days per week",
        "label_en": "3-4 days/week",
        "label_bn": "সপ্তাহে ৩-৪ দিন"
      },
      {
        "value": "daily_street_food",
        "label": "Almost daily street snacks (High trans fat and oxidized oil exposure)",
        "label_en": "Daily",
        "label_bn": "প্রায় প্রতিদিন (ট্রান্স ফ্যাট ও পোড়া তেলের ক্ষতি)"
      }
    ],
    "clinicalTags": [
      "fried_foods",
      "trans_fat",
      "lipid_peroxidation"
    ]
  },
  {
    "id": "lifestyle_sedentary_sitting_hours",
    "label": "Total Daily Sitting Time (Desk/Couch)",
    "label_en": "How many total hours per day do you spend seated (desk work, driving, TV)?",
    "label_bn": "সারাদিনে বসে কাটানোর সময় মোট কত ঘণ্টা?",
    "domain": "environmental_lifestyle",
    "answerType": "select",
    "options": [
      {
        "value": "under_4_hours",
        "label": "< 4 hours (Active on feet)",
        "label_en": "< 4 hours",
        "label_bn": "৪ ঘণ্টার কম (বেশিরভাগ সময় দাঁড়িয়ে বা হেঁটে)"
      },
      {
        "value": "4_to_8_hours",
        "label": "4 to 8 hours per day",
        "label_en": "4-8 hours",
        "label_bn": "৪ থেকে ৮ ঘণ্টা"
      },
      {
        "value": "over_8_hours_sedentary",
        "label": "> 8 hours per day (Prolonged sedentary metabolic risk)",
        "label_en": "> 8 hours",
        "label_bn": "৮ ঘণ্টার বেশি (দীর্ঘ সময় অলস বসে থাকা)"
      }
    ],
    "clinicalTags": [
      "sedentary_behavior",
      "metabolic_inactivity"
    ]
  },
  {
    "id": "lifestyle_resistance_exercise_weekly",
    "label": "Weekly Resistance / Strength Training",
    "label_en": "Do you perform bodyweight exercises, weights, or resistance work to maintain muscle mass?",
    "label_bn": "পেশির শক্তি বাড়ানোর জন্য কি ব্যায়াম বা শরীরচর্চা করেন?",
    "domain": "environmental_lifestyle",
    "answerType": "select",
    "options": [
      {
        "value": "zero_no_exercise",
        "label": "No structured strength exercise",
        "label_en": "No strength training",
        "label_bn": "ব্যায়াম করি না"
      },
      {
        "value": "walking_only",
        "label": "Daily walking only (Cardio but minimal resistance)",
        "label_en": "Walking only",
        "label_bn": "শুধু হাঁটার অভ্যাস আছে"
      },
      {
        "value": "two_plus_strength_sessions",
        "label": "2 or more weekly strength/bodyweight sessions",
        "label_en": "2+ strength sessions",
        "label_bn": "সপ্তাহে ২ বা ততোধিক দিন পেশির ব্যায়াম করি"
      }
    ],
    "clinicalTags": [
      "resistance_exercise",
      "glucose_sink_muscle"
    ]
  },
  {
    "id": "lifestyle_cookware_material_primary",
    "label": "Household Cookware Material",
    "label_en": "What material is predominantly used for cooking pans and pots at home?",
    "label_bn": "বাসায় রান্নায় কোন ধরনের তৈজসপত্র প্রধানত ব্যবহৃত হয়?",
    "domain": "environmental_lifestyle",
    "answerType": "select",
    "options": [
      {
        "value": "stainless_iron_clay",
        "label": "Stainless steel, cast iron, or clay pots (Non-toxic)",
        "label_en": "Stainless steel / Iron",
        "label_bn": "স্টেইনলেস স্টিল, লোহার কড়াই বা মাটির পাত্র"
      },
      {
        "value": "scratched_nonstick_teflon",
        "label": "Scratched non-stick Teflon pans (PFAS exposure risk)",
        "label_en": "Non-stick Teflon",
        "label_bn": "নন-স্টিক টেফলন কড়াই (দাগযুক্ত)"
      },
      {
        "value": "uncoated_aluminum",
        "label": "Bare uncoated aluminum pots and handis",
        "label_en": "Bare aluminum",
        "label_bn": "অ্যালুমিনিয়ামের পাতিল বা ডেকচি"
      }
    ],
    "clinicalTags": [
      "cookware_toxins",
      "pfas_heavy_metals"
    ]
  },
  {
    "id": "gi_cholecystectomy_fat_intolerance",
    "label": "Post-Cholecystectomy Bile Acid Diarrhea",
    "label_en": "If your gallbladder was removed, do oily meals cause sudden urgent watery diarrhea (Bile acid malabsorption)?",
    "label_bn": "পিত্তথলি অপসারণের পর তৈলাক্ত খাবার খেলে কি পেটে মোচড় দিয়ে হঠাৎ পাতলা পায়খানা হয়?",
    "domain": "gastrointestinal",
    "answerType": "yesno",
    "clinicalTags": [
      "bile_acid_malabsorption",
      "post_cholecystectomy_diarrhea"
    ]
  },
  {
    "id": "gi_h_pylori_tested_eradicated",
    "label": "Helicobacter Pylori Infection History",
    "label_en": "Have you tested positive for H. pylori infection or completed triple therapy eradication?",
    "label_bn": "আপনার কি অতীতে এইচ. পাইলোরি (H. pylori) জীবাণু বা পাকস্থলীর আলসার শনাক্ত হয়েছিল?",
    "domain": "gastrointestinal",
    "answerType": "select",
    "options": [
      {
        "value": "never_tested_negative",
        "label": "Negative / Never had H. pylori",
        "label_en": "Negative / Never",
        "label_bn": "নেগেটিভ বা কখনও হয়নি"
      },
      {
        "value": "treated_eradicated",
        "label": "Diagnosed and completed antibiotic eradication therapy",
        "label_en": "Treated and eradicated",
        "label_bn": "ওষুধ সেবন করে নিরাময় করেছি"
      },
      {
        "value": "recurrent_resistant",
        "label": "Recurrent / Symptoms returned after treatment",
        "label_en": "Recurrent symptoms",
        "label_bn": "চিকিৎসার পরও আবার লক্ষণ ফিরে এসেছে"
      }
    ],
    "clinicalTags": [
      "h_pylori_infection",
      "hypochlorhydria_risk"
    ]
  },
  {
    "id": "microbiome_probiotic_supplement_brand",
    "label": "Commercial Probiotic Supplement Use",
    "label_en": "Do you take probiotic capsules (Lactobacillus/Bifidobacterium or Saccharomyces boulardii)?",
    "label_bn": "আপনি কি কোনো প্রোবায়োটিক ক্যাপসুল বা সাপ্লিমেন্ট খাচ্ছেন?",
    "domain": "microbiome",
    "answerType": "select",
    "options": [
      {
        "value": "none",
        "label": "No probiotic supplements",
        "label_en": "None",
        "label_bn": "কোনো সাপ্লিমেন্ট খাচ্ছি না"
      },
      {
        "value": "occasional_with_antibiotics",
        "label": "Taken only during/after antibiotic courses",
        "label_en": "With antibiotics",
        "label_bn": "শুধু অ্যান্টিবায়োটিকের সময় খাই"
      },
      {
        "value": "daily_long_term",
        "label": "Daily long-term probiotic supplement",
        "label_en": "Daily long-term",
        "label_bn": "প্রতিদিন নিয়মিত খাই"
      }
    ],
    "clinicalTags": [
      "probiotic_use",
      "microbiome_support"
    ]
  },
  {
    "id": "immune_histamine_aged_cheese_ferments",
    "label": "Histamine Intolerance to Aged or Fermented Foods",
    "label_en": "Do aged cheese, fermented fish (Shutki), or vinegar trigger facial flushing, runny nose, or headache?",
    "label_bn": "শুটকি মাছ, পনির বা ভিনেগারযুক্ত খাবার খেলে কি ত্বকে লালচে ভাব বা মাথা ব্যথা হয়?",
    "domain": "immune_inflammatory",
    "answerType": "yesno",
    "clinicalTags": [
      "histamine_intolerance",
      "dao_enzyme_deficiency"
    ]
  },
  {
    "id": "immune_frequent_skin_boils_staph",
    "label": "Recurrent Skin Boils / Bacterial Infections",
    "label_en": "Do you get frequent painful boils (furuncles/carbuncles) on skin, indicating impaired neutrophil defense?",
    "label_bn": "শরীরে কি ঘনঘন ফোঁড়া বা পুঁজযুক্ত ত্বকের সংক্রমণ হয়?",
    "domain": "immune_inflammatory",
    "answerType": "yesno",
    "clinicalTags": [
      "recurrent_boils",
      "hyperglycemia_immune_suppression"
    ]
  },
  {
    "id": "endocrine_pms_breast_tenderness",
    "label": "Premenstrual Breast Tenderness / Swelling",
    "label_en": "Do you experience severe breast tenderness, fluid retention, or mood swings 7-10 days before periods?",
    "label_bn": "মাসিক শুরু হওয়ার ৭-১০ দিন আগে কি স্তনে তীব্র ব্যথা, শরীর ভারী লাগা বা মেজাজ খিটখিটে হয়?",
    "domain": "endocrine_hormonal",
    "answerType": "yesno",
    "applicablePopulation": [
      "adult_standard",
      "adolescent",
      "all"
    ],
    "clinicalTags": [
      "estrogen_dominance",
      "pms_cyclical"
    ]
  },
  {
    "id": "endocrine_hot_flashes_perimenopause",
    "label": "Hot Flashes & Night Sweats (Perimenopause)",
    "label_en": "Do you experience sudden waves of intense heat, sweating, and rapid heartbeat day or night?",
    "label_bn": "শরীরে হঠাৎ তীব্র গরমের ঝলকানি (হট ফ্ল্যাশ) বা রাতে ঘেমে ঘুম ভেঙে যাওয়ার সমস্যা আছে কি?",
    "domain": "endocrine_hormonal",
    "answerType": "yesno",
    "applicablePopulation": [
      "adult_standard",
      "all"
    ],
    "clinicalTags": [
      "hot_flashes",
      "vasomotor_symptoms",
      "perimenopause"
    ]
  },
  {
    "id": "hepatic_eye_sclera_yellowish_flush",
    "label": "Yellowing of Eyes or Tea-Colored Urine",
    "label_en": "Have you noticed yellowing in the whites of your eyes (scleral icterus) or unusually dark tea-colored urine?",
    "label_bn": "চোখের সাদা অংশ হলুদ হওয়া বা গাঢ় চায়ের মতো প্রস্রাব লক্ষ্য করেছেন কি?",
    "domain": "hepatic_biotransformation",
    "answerType": "yesno",
    "isHighValueScreening": true,
    "clinicalTags": [
      "jaundice_red_flag",
      "hepatic_dysfunction"
    ]
  },
  {
    "id": "mito_midday_nap_unavoidable",
    "label": "Inability to Function Without Midday Nap",
    "label_en": "Are you physically unable to stay awake in the afternoon without taking a 1-2 hour nap?",
    "label_bn": "দুপুরে ১-২ ঘণ্টা না ঘুমালে কি বিকেলে কাজ করার শক্তি একেবারেই পান না?",
    "domain": "mitochondrial_energy",
    "answerType": "yesno",
    "clinicalTags": [
      "daytime_hypersomnolence",
      "mitochondrial_energy_debt"
    ]
  },
  {
    "id": "mito_shortness_breath_mild_exertion",
    "label": "Dyspnea on Mild Exertion (Brisk Walking)",
    "label_en": "Do you feel out of breath when walking at normal pace on level ground with peers?",
    "label_bn": "সমতল রাস্তায় স্বাভাবিক গতিতে হাঁটলেও কি অন্যদের চেয়ে দ্রুত হাঁপিয়ে ওঠেন?",
    "domain": "mitochondrial_energy",
    "answerType": "yesno",
    "clinicalTags": [
      "exertional_dyspnea",
      "cardiorespiratory_fitness"
    ]
  },
  {
    "id": "sleep_wake_same_time_weekend",
    "label": "Weekend Social Jetlag (Sleep Timing Variability)",
    "label_en": "Does your weekend wake-up time vary by more than 2 hours compared to weekdays?",
    "label_bn": "ছুটির দিনে কি কর্মদিবসের চেয়ে ২ ঘণ্টার বেশি দেরিতে ঘুম থেকে ওঠেন (সোশ্যাল জেটলাগ)?",
    "domain": "sleep_circadian",
    "answerType": "yesno",
    "clinicalTags": [
      "social_jetlag",
      "circadian_irregularity"
    ]
  },
  {
    "id": "sleep_dark_room_environment",
    "label": "Bedroom Darkness & Streetlight Exposure",
    "label_en": "Is your bedroom completely pitch black, or do streetlights/nightlights shine into your room while sleeping?",
    "label_bn": "ঘুমানোর ঘরটি কি পুরোপুরি অন্ধকার থাকে, নাকি বাইরের বা ঘরের মৃদু আলো ঘুমের ব্যাঘাত ঘটায়?",
    "domain": "sleep_circadian",
    "answerType": "select",
    "options": [
      {
        "value": "pitch_black",
        "label": "Pitch black / black-out curtains used",
        "label_en": "Pitch black",
        "label_bn": "পরিপূর্ণ অন্ধকার"
      },
      {
        "value": "dim_light_present",
        "label": "Dim nightlight or street light shines in",
        "label_en": "Dim light shines in",
        "label_bn": "বাইরের বা ঘরের মৃদু আলো থাকে"
      }
    ],
    "clinicalTags": [
      "light_at_night",
      "nocturnal_melatonin"
    ]
  },
  {
    "id": "stress_relaxation_daily_practice",
    "label": "Daily Relaxation or Contemplative Practice",
    "label_en": "Do you practice daily prayer, deep breathing, meditation, or nature walks for nervous system calming?",
    "label_bn": "মন শান্ত রাখতে প্রতিদিন নামাজ/প্রার্থনা, মেডিটেশন বা মুক্ত বাতাসে হাঁটার অভ্যাস আছে কি?",
    "domain": "stress_neurobehavioral",
    "answerType": "select",
    "options": [
      {
        "value": "daily_consistent",
        "label": "Yes, consistent daily mindfulness/prayer (20+ mins)",
        "label_en": "Daily consistent",
        "label_bn": "হ্যাঁ, প্রতিদিন নিয়মিত ২০+ মিনিট"
      },
      {
        "value": "occasional",
        "label": "Occasionally when stressed",
        "label_en": "Occasional",
        "label_bn": "মাঝে মাঝে"
      },
      {
        "value": "never_no_time",
        "label": "No regular relaxation practice (Constant sympathetic overdrive)",
        "label_en": "Never / No time",
        "label_bn": "সময় পাই না বা কোনো অভ্যাস নেই"
      }
    ],
    "clinicalTags": [
      "parasympathetic_vagal_tone",
      "stress_resilience"
    ]
  },
  {
    "id": "dietary_raw_onion_garlic_intolerance",
    "label": "Raw vs Cooked Onion/Garlic Tolerance",
    "label_en": "Does eating raw onion or garlic in salads cause severe gastric burn or bloating compared to cooked curry?",
    "label_bn": "সালাদে কাঁচা পেঁয়াজ বা রসুন খেলে কি রান্না করা ঝোলের চেয়ে বেশি গ্যাস বা পেট জ্বলে?",
    "domain": "dietary_nutrition",
    "answerType": "yesno",
    "clinicalTags": [
      "raw_fructan_sensitivity",
      "fodmap_fructans"
    ]
  },
  {
    "id": "dietary_egg_intake_weekly",
    "label": "Whole Egg Weekly Consumption",
    "label_en": "How many whole boiled, poached, or fried eggs do you eat per week?",
    "label_bn": "সপ্তাহে গড়ে কয়টি আস্ত ডিম (কুসুমসহ) খাওয়া হয়?",
    "domain": "dietary_nutrition",
    "answerType": "select",
    "options": [
      {
        "value": "zero_eggs",
        "label": "0 eggs (Strictly avoid or allergic)",
        "label_en": "0 eggs",
        "label_bn": "০টি (খাই না বা অ্যালার্জি)"
      },
      {
        "value": "one_to_three",
        "label": "1 to 3 eggs per week",
        "label_en": "1-3 eggs/week",
        "label_bn": "সপ্তাহে ১ থেকে ৩টি"
      },
      {
        "value": "four_to_seven",
        "label": "4 to 7 eggs per week (Daily egg)",
        "label_en": "4-7 eggs/week",
        "label_bn": "সপ্তাহে ৪ থেকে ৭টি (প্রতিদিন ১টি)"
      },
      {
        "value": "eight_plus",
        "label": "8 or more eggs per week",
        "label_en": "8+ eggs/week",
        "label_bn": "সপ্তাহে ৮টি বা তার বেশি"
      }
    ],
    "clinicalTags": [
      "egg_consumption",
      "choline_intake"
    ]
  },
  {
    "id": "dietary_dal_lentil_daily_bowls",
    "label": "Daily Lentil / Dal Soup Frequency",
    "label_en": "How many bowls of dal (masoor, moong, chana) do you consume daily with meals?",
    "label_bn": "প্রতিদিন গড়ে কত বাটি ডাল খাওয়া হয়?",
    "domain": "dietary_nutrition",
    "answerType": "select",
    "options": [
      {
        "value": "rarely_dal",
        "label": "Rarely or < 2 times per week",
        "label_en": "Rarely",
        "label_bn": "খুব কম বা সপ্তাহে ২ দিনের কম"
      },
      {
        "value": "one_bowl_daily",
        "label": "1 standard bowl daily with lunch or dinner",
        "label_en": "1 bowl daily",
        "label_bn": "প্রতিদিন ১ বাটি"
      },
      {
        "value": "two_plus_bowls",
        "label": "2 or more bowls daily",
        "label_en": "2+ bowls daily",
        "label_bn": "প্রতিদিন ২ বা ততোধিক বাটি"
      }
    ],
    "clinicalTags": [
      "lentil_consumption",
      "plant_protein_base"
    ]
  },
  {
    "id": "lifestyle_daily_steps_bracket",
    "label": "Daily Average Step Count",
    "label_en": "What is your approximate daily smartphone/smartwatch step count?",
    "label_bn": "দৈনিক গড়ে আপনার কত কদম হাঁটা হয়?",
    "domain": "environmental_lifestyle",
    "answerType": "select",
    "options": [
      {
        "value": "under_3000_steps",
        "label": "< 3,000 steps (Sedentary)",
        "label_en": "< 3,000 steps",
        "label_bn": "৩,০০০ কদমের কম (অলস জীবনধারা)"
      },
      {
        "value": "3000_to_6000_steps",
        "label": "3,000 to 6,000 steps (Low active)",
        "label_en": "3,000 - 6,000 steps",
        "label_bn": "৩,০০০ থেকে ৬,০০০ কদম"
      },
      {
        "value": "7000_to_10000_steps",
        "label": "7,000 to 10,000 steps (Moderately active)",
        "label_en": "7,000 - 10,000 steps",
        "label_bn": "৭,০০০ থেকে ১০,০০০ কদম"
      },
      {
        "value": "over_10000_steps",
        "label": "> 10,000 steps (Highly active)",
        "label_en": "> 10,000 steps",
        "label_bn": "১০,০০০ কদমের বেশি (কর্মচঞ্চল)"
      }
    ],
    "clinicalTags": [
      "step_count",
      "daily_physical_activity"
    ]
  },
  {
    "id": "lifestyle_plastic_container_microwaving",
    "label": "Microwaving Food in Plastic Containers",
    "label_en": "Do you heat or reheat takeaway curries/rice inside thin plastic containers or polythene bags?",
    "label_bn": "প্লাস্টিকের পাত্র বা পলিথিনে খাবার রেখে কি মাইক্রোওয়েভে বা গরম করা হয়?",
    "domain": "environmental_lifestyle",
    "answerType": "yesno",
    "clinicalTags": [
      "endocrine_disruptor_bpa",
      "microplastics_phthalates"
    ]
  },
  {
    "id": "cardio_lightheaded_rapid_standing",
    "label": "Postural Dizziness / Orthostatic Lightheadedness",
    "label_en": "Do you feel dizzy, black out, or vision darkens when suddenly standing up from bed or chair?",
    "label_bn": "বসা বা শোয়া থেকে হঠাৎ উঠে দাঁড়ালে কি মাথা চক্কর দেয় বা চোখের সামনে অন্ধকার হয়ে আসে?",
    "domain": "clinical_history",
    "subdomain": "cardiovascular",
    "answerType": "yesno",
    "clinicalTags": [
      "orthostatic_hypotension",
      "autonomic_dysregulation"
    ]
  },
  {
    "id": "renal_edema_hands_eyelids",
    "label": "Morning Hand or Finger Ring Tightness",
    "label_en": "Do your finger rings feel painfully tight in the mornings due to fluid accumulation?",
    "label_bn": "সকালে ঘুম থেকে উঠলে কি হাতের আংটি অতিরিক্ত টাইট মনে হয় বা আঙুল ফুলে থাকে?",
    "domain": "anthropometrics",
    "subdomain": "renal",
    "answerType": "yesno",
    "clinicalTags": [
      "early_morning_edema",
      "renal_fluid_retention"
    ]
  },
  {
    "id": "pediatric_iron_rich_foods_frequency",
    "label": "Child Iron-Rich Food Frequency",
    "label_en": "Does the child eat fish, whole egg, chicken liver, or dal at least 4 days per week?",
    "label_bn": "শিশু কি সপ্তাহে অন্তত ৪ দিন মাছ, ডিম, কলিজা বা ডাল খায়?",
    "domain": "dietary_nutrition",
    "subdomain": "pediatric",
    "answerType": "yesno",
    "applicablePopulation": [
      "pediatric"
    ],
    "clinicalTags": [
      "pediatric_iron_adequacy",
      "pediatric_anemia_screen"
    ]
  },
  {
    "id": "history_autoimmune_diagnosis_named",
    "label": "Named Autoimmune Condition Diagnosed",
    "label_en": "Have you been diagnosed with an autoimmune disease (RA, Vitiligo, Celiac, Lupus, IBD)?",
    "label_bn": "আপনার কি কোনো সুনির্দিষ্ট অটোইমিউন রোগ (যেমন রিউমাটয়েড আথ্রাইটিস, শ্বেতী, সিলিয়াক, আলসারেটিভ কোলাইটিস) আছে?",
    "domain": "immune_inflammatory",
    "answerType": "select",
    "options": [
      {
        "value": "none_autoimmune",
        "label": "No autoimmune disease",
        "label_en": "None",
        "label_bn": "কোনো অটোইমিউন রোগ নেই"
      },
      {
        "value": "rheumatoid_arthritis",
        "label": "Rheumatoid Arthritis (RA)",
        "label_en": "Rheumatoid Arthritis",
        "label_bn": "রিউমাটয়েড আথ্রাইটিস"
      },
      {
        "value": "celiac_disease",
        "label": "Celiac Disease (Biopsy / TTG IgA confirmed)",
        "label_en": "Celiac Disease",
        "label_bn": "সিলিয়াক ডিজিজ"
      },
      {
        "value": "vitiligo_skin",
        "label": "Vitiligo (Skin depigmentation)",
        "label_en": "Vitiligo",
        "label_bn": "শ্বেতী রোগ"
      },
      {
        "value": "inflammatory_bowel_disease",
        "label": "IBD (Ulcerative Colitis or Crohn's Disease)",
        "label_en": "IBD (Crohn's / UC)",
        "label_bn": "আলসারেটিভ কোলাইটিস বা ক্রনস ডিজিজ"
      }
    ],
    "clinicalTags": [
      "autoimmune_diagnosis",
      "gut_barrier_autoimmunity"
    ]
  },
  {
    "id": "dietary_nighttime_snacking_past_10pm",
    "label": "Late-Night Kitchen Raiding Past 10 PM",
    "label_en": "Do you find yourself eating biscuits, chanachur, or leftovers past 10 PM while watching TV or scrolling phone?",
    "label_bn": "রাত ১০টার পর টিভি দেখা বা ফোন চালানোর সময় কি বিস্কুট, চানাচুর বা অন্যান্য খাবার খাওয়ার অভ্যাস আছে?",
    "domain": "dietary_nutrition",
    "answerType": "yesno",
    "clinicalTags": [
      "night_eating_syndrome",
      "circadian_insulin_blunting"
    ]
  }
];

export const questionnaireRegistry = {
  version: registryVersion,
  domains: ASSESSMENT_DOMAINS,
  core: coreQuestions,
};
