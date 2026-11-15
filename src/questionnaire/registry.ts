// Questionnaire Registry for Functional Nutrition Assessment
// -------------------------------------------------------
// 14 Functional Nutrition Domains + Specialized Population Modules,
// bilingual (Bangla & English) questions, declarative visibility rules,
// quick/comprehensive screening flags, and clinical pathway routing.

export const registryVersion = "v2.1.0" as const;

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
    name_bn: 'ঘুম ও সার্কেডিয়ান ছন্দ',
    description_en: 'Sleep onset, nocturnal awakenings, unrefreshing sleep, shift work, and daylight exposure.',
    description_bn: 'ঘুমের সূচনা, রাতে ঘুম ভাঙা, অপর্যাপ্ত ঘুম এবং শিফট ডিউটির প্রভাব।'
  },
  {
    id: 'stress_neurobehavioral',
    name_en: 'Stress & Neurobehavioral Function',
    name_bn: 'মানসিক চাপ ও স্নায়বিক স্বাস্থ্য',
    description_en: 'Perceived stress, nervous tension, emotional eating patterns, memory, and cognitive focus.',
    description_bn: 'মানসিক চাপ, উদ্বেগের প্রভাব, মানসিক আবেগে খাওয়ার প্রবণতা ও ব্রেন ফগ।'
  },
  {
    id: 'dietary_nutrition',
    name_en: 'Dietary & Nutritional Assessment',
    name_bn: 'খাদ্যাভ্যাস ও পুষ্টি মূল্যায়ন',
    description_en: 'Dietary diversity, protein intake, fiber variety, hydration, meal timing, and ultra-processed food frequency.',
    description_bn: 'দৈনন্দিন খাবারের বৈচিত্র্য, প্রোটিন গ্রহণ, ভোজ্য ফাইবার, পানি পানের পরিমাণ ও প্রক্রিয়াজাত খাদ্য।'
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
  label: string; // Default English or generic label
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
  label: string; // English primary fallback
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
  // ── 1. CLINICAL HISTORY & TIMELINE ──────────────────────────────
  {
    id: "chief_complaint",
    label: "Chief Health Complaint",
    label_en: "Primary health concern or chief reason for consultation",
    label_bn: "রোগীর প্রধান শারীরিক সমস্যা বা বর্তমান স্বাস্থ্য উদ্বেগ",
    domain: "clinical_history",
    answerType: "text",
    isHighValueScreening: true,
    required: true,
    clinicalTags: ["chief_complaint"]
  },
  {
    id: "symptom_onset_timeline",
    label: "Onset of Primary Symptoms",
    label_en: "When did your current symptoms first begin?",
    label_bn: "বর্তমান শারীরিক সমস্যাগুলো কতদিন আগে শুরু হয়েছিল?",
    domain: "clinical_history",
    answerType: "select",
    isHighValueScreening: true,
    options: [
      { value: "less_than_1_month", label: "< 1 month", label_en: "Less than 1 month ago", label_bn: "১ মাসের কম সময় আগে" },
      { value: "1_to_6_months", label: "1-6 months", label_en: "1 to 6 months ago", label_bn: "১ থেকে ৬ মাস আগে" },
      { value: "6_to_12_months", label: "6-12 months", label_en: "6 to 12 months ago", label_bn: "৬ মাস থেকে ১ বছর আগে" },
      { value: "1_to_3_years", label: "1-3 years", label_en: "1 to 3 years ago", label_bn: "১ থেকে ৩ বছর আগে" },
      { value: "chronic_over_3_years", label: "> 3 years", label_en: "More than 3 years (Chronic)", label_bn: "৩ বছরের বেশি সময় ধরে (দীর্ঘস্থায়ী)" }
    ],
    clinicalTags: ["timeline_onset"]
  },
  {
    id: "trigger_event_history",
    label: "Triggering Event Preceding Symptoms",
    label_en: "Did anything major happen immediately before symptoms began?",
    label_bn: "লক্ষণগুলো শুরু হওয়ার ঠিক আগে কোনো বিশেষ ঘটনা ঘটেছিল কি?",
    domain: "clinical_history",
    answerType: "select",
    options: [
      { value: "none_apparent", label: "No obvious event", label_en: "No obvious triggering event", label_bn: "নির্দিষ্ট কোনো ঘটনা মনে নেই" },
      { value: "severe_infection", label: "Severe infection or food poisoning", label_en: "Severe infection, typhoid, or gastroenteritis", label_bn: "টাইফয়েড, ডায়রিয়া বা মারাত্মক ফুড পয়জনিং" },
      { value: "heavy_antibiotics", label: "Heavy antibiotic course", label_en: "Strong course of antibiotics", label_bn: "অ্যান্টিবায়োটিকের কড়া ডোজ সেবন" },
      { value: "major_stress", label: "Major psychological stress or grief", label_en: "Severe emotional shock, bereavement, or acute job stress", label_bn: "তীব্র মানসিক আঘাত, শোক বা কর্মক্ষেত্রের অতিরিক্ত চাপ" },
      { value: "pregnancy_childbirth", label: "Pregnancy or postpartum", label_en: "Post-pregnancy or delivery", label_bn: "গর্ভাবস্থা বা সন্তান প্রসবের পর" },
      { value: "surgical_procedure", label: "Surgery or hospitalization", label_en: "Major surgery or hospitalization", label_bn: "অস্ত্রোপচার বা হাসপাতালে ভর্তি" }
    ],
    clinicalTags: ["trigger_event"]
  },
  {
    id: "family_chronic_history",
    label: "Family Medical History",
    label_en: "Family history of chronic disease (parents/siblings)",
    label_bn: "পরিবারে রক্তসম্পর্কীয় সদস্যদের মধ্যে দীর্ঘস্থায়ী রোগের ইতিহাস",
    domain: "clinical_history",
    answerType: "multiselect",
    options: [
      { value: "family_t2d", label: "Type 2 Diabetes", label_en: "Type 2 Diabetes", label_bn: "টাইপ ২ ডায়াবেটিস" },
      { value: "family_hypertension", label: "Hypertension / Heart Disease", label_en: "Hypertension / CVD", label_bn: "উচ্চ রক্তচাপ বা হৃদরোগ" },
      { value: "family_thyroid", label: "Thyroid Disorder", label_en: "Hypo/Hyperthyroidism", label_bn: "থাইরয়েড রোগ" },
      { value: "family_autoimmune", label: "Autoimmune Disease", label_en: "Rheumatoid / Lupus / Vitiligo", label_bn: "অটোইমিউন রোগ (বাত, লুপাস, শ্বেতী)" },
      { value: "family_fatty_liver", label: "Fatty Liver / NASH", label_en: "Fatty Liver Disease", label_bn: "ফ্যাটি লিভার" },
      { value: "family_kidney", label: "Kidney Disease / Stones", label_en: "Kidney Disease or Calculi", label_bn: "কিডনি রোগ বা পাথর" }
    ],
    clinicalTags: ["family_history"]
  },
  {
    id: "recent_infections_antibiotics",
    label: "Recent Antibiotic or Infection History",
    label_en: "Have you taken antibiotics or had a serious infection in the last 6 months?",
    label_bn: "গত ৬ মাসে অ্যান্টিবায়োটিক সেবন করেছেন বা গুরুতর সংক্রমণে ভুগেছেন কি?",
    domain: "clinical_history",
    answerType: "yesno",
    isHighValueScreening: true,
    clinicalTags: ["antibiotic_exposure", "dysbiosis_risk"]
  },

  // ── 2. ANTHROPOMETRICS & BODY COMPOSITION ────────────────────────
  {
    id: "unintentional_weight_loss",
    label: "Unexplained Weight Loss",
    label_en: "Have you experienced rapid, unintentional weight loss (>5% in 3 months)?",
    label_bn: "গত ৩ মাসে না চাইতেই আপনার কি উল্লেখযোগ্য বা অস্বাভাবিক ওজন কমেছে (>৫%)?",
    domain: "anthropometrics",
    answerType: "yesno",
    isHighValueScreening: true,
    clinicalTags: ["weight_loss", "unintentional", "red_flag_weight_loss"]
  },
  {
    id: "weight_loss_amount_kg",
    label: "Amount of Unintentional Weight Loss",
    label_en: "How many kilograms lost unintentionally in recent months?",
    label_bn: "সাম্প্রতিক মাসগুলোতে কত কেজি ওজন কমেছে?",
    domain: "anthropometrics",
    answerType: "number",
    unit: "kg",
    visibility: {
      condition: { field: "unintentional_weight_loss", operator: "equals", value: "yes" }
    },
    clinicalTags: ["weight_loss_kg"]
  },
  {
    id: "weight_trend_last_year",
    label: "1-Year Weight Trajectory",
    label_en: "General weight trend over the past 12 months",
    label_bn: "গত ১ বছরে আপনার ওজনের সামগ্রিক গতিপ্রকৃতি কেমন ছিল?",
    domain: "anthropometrics",
    answerType: "select",
    options: [
      { value: "stable", label: "Stable (± 2 kg)", label_en: "Stable (± 2 kg)", label_bn: "মোটামুটি স্থিতিশীল" },
      { value: "gradual_gain", label: "Gradual weight gain", label_en: "Gradually increasing (+3 to 7 kg)", label_bn: "ধীরে ধীরে ওজন বৃদ্ধি (+৩ থেকে ৭ কেজি)" },
      { value: "rapid_gain", label: "Rapid weight gain", label_en: "Rapid increase (> 7 kg)", label_bn: "দ্রুত অতিরিক্ত ওজন বৃদ্ধি (> ৭ কেজি)" },
      { value: "yo_yo_dieting", label: "Fluctuating / Yo-Yo weight cycles", label_en: "Repeated gain and loss cycles", label_bn: "বারবার ওজন কমা ও বাড়ার চক্র" }
    ],
    clinicalTags: ["weight_trajectory"]
  },
  {
    id: "body_fat_distribution",
    label: "Perceived Body Fat Distribution",
    label_en: "Where do you primarily carry excess weight?",
    label_bn: "আপনার শরীরের কোন অংশে মেদ বা চর্বি বেশি জমা হয়?",
    domain: "anthropometrics",
    answerType: "select",
    options: [
      { value: "abdominal_visceral", label: "Abdominal / Belly (Apple shape)", label_en: "Around belly & waist (Central/Visceral)", label_bn: "পেট ও কোমরের চারপাশে (আপেল আকৃতি)" },
      { value: "hips_thighs", label: "Hips & Thighs (Pear shape)", label_en: "Hips, thighs, and buttocks (Pear)", label_bn: "নিতম্ব ও উরুতে (পিয়ার আকৃতি)" },
      { value: "generalized", label: "Evenly distributed", label_en: "Evenly across the whole body", label_bn: "সমগ্র শরীরে সমভাবে বিস্তৃত" }
    ],
    clinicalTags: ["fat_distribution", "central_adiposity"]
  },

  // ── 3. METABOLIC & GLYCEMIC REGULATION ───────────────────────────
  {
    id: "diagnosed_diabetes_prediabetes",
    label: "Diabetes or Prediabetes Diagnosis",
    label_en: "Have you been diagnosed with Type 2 Diabetes or Prediabetes?",
    label_bn: "আপনার কি টাইপ ২ ডায়াবেটিস বা প্রি-ডায়াবেটিস শনাক্ত হয়েছে?",
    domain: "metabolic",
    answerType: "select",
    isHighValueScreening: true,
    options: [
      { value: "no_normal_glucose", label: "No (Normal glucose)", label_en: "No, normal glucose", label_bn: "না, সুগার স্বাভাবিক" },
      { value: "prediabetes_impaired_fbs", label: "Prediabetes / Impaired Fasting Glucose", label_en: "Prediabetes", label_bn: "প্রি-ডায়াবেটিস" },
      { value: "type_2_diabetes_medicated", label: "Type 2 Diabetes (on oral medications)", label_en: "T2D on oral meds", label_bn: "টাইপ ২ ডায়াবেটিস (মুখে খাওয়ার ওষুধে)" },
      { value: "type_2_diabetes_insulin", label: "Type 2 Diabetes (on insulin)", label_en: "T2D on insulin", label_bn: "টাইপ ২ ডায়াবেটিস (ইনসুলিন নির্ভর)" },
      { value: "not_tested_recently", label: "Not sure / Not tested recently", label_en: "Not tested recently", label_bn: "নিশ্চিত নই / পরীক্ষা করা হয়নি" }
    ],
    clinicalTags: ["diabetes_diagnosis", "glycemic_regulation"]
  },
  {
    id: "postprandial_fatigue",
    label: "Post-Meal Energy Crash",
    label_en: "Do you feel intense sleepiness or brain fog within 1-2 hours after high-carb meals?",
    label_bn: "ভাত বা ভারী শর্করাযুক্ত খাবার খাওয়ার ১-২ ঘণ্টার মধ্যে তীব্র ঘুম বা ক্লান্তি আসে কি?",
    domain: "metabolic",
    answerType: "yesno",
    isHighValueScreening: true,
    clinicalTags: ["postprandial_fatigue", "reactive_hypoglycemia_risk", "insulin_resistance"]
  },
  {
    id: "sugar_carbohydrate_cravings",
    label: "Sugar & Refined Carb Cravings",
    label_en: "Do you experience strong cravings for sweets, tea with sugar, or bakery items late afternoon or night?",
    label_bn: "বিকেল বা রাতে মিষ্টি, মিষ্টি চা, বিস্কুট বা মিষ্টিজাতীয় খাবার খাওয়ার তীব্র আকাঙ্ক্ষা হয় কি?",
    domain: "metabolic",
    answerType: "select",
    options: [
      { value: "never", label: "Rarely or never", label_en: "Rarely / Never", label_bn: "কখনোই না বললেই চলে" },
      { value: "occasional", label: "Occasional (1-2 times/week)", label_en: "Occasional", label_bn: "মাঝে মাঝে (সপ্তাহে ১-২ বার)" },
      { value: "frequent_daily", label: "Daily intense cravings", label_en: "Daily strong cravings", label_bn: "প্রতিদিন তীব্র ক্ষুধা ও ক্রেভিং" }
    ],
    clinicalTags: ["sugar_cravings"]
  },
  {
    id: "shakiness_if_meal_delayed",
    label: "Shakiness or Irritability When Hungry ('Hangry')",
    label_en: "Do you feel shaky, jittery, lightheaded, or irritable if a meal is delayed by 1 hour?",
    label_bn: "খাবার খেতে ১ ঘণ্টা দেরি হলে মাথা ঘোরা, হাত কাঁপা বা অতিরিক্ত রাগ হয় কি?",
    domain: "metabolic",
    answerType: "yesno",
    isHighValueScreening: true,
    clinicalTags: ["reactive_hypoglycemia_risk", "dysglycemia"]
  },
  {
    id: "blood_pressure_history",
    label: "Blood Pressure Status",
    label_en: "Have you been told you have high blood pressure (Hypertension)?",
    label_bn: "আপনার কি উচ্চ রক্তচাপ (হাই ব্লাড প্রেশার) আছে?",
    domain: "metabolic",
    answerType: "select",
    isHighValueScreening: true,
    options: [
      { value: "normal_bp", label: "Normal (<120/80 mmHg)", label_en: "Normal BP", label_bn: "স্বাভাবিক রক্তচাপ" },
      { value: "elevated_unmedicated", label: "Elevated / Borderline (no meds)", label_en: "Borderline elevated", label_bn: "সামান্য বেশি (ওষুধ ছাড়া)" },
      { value: "hypertension_on_meds", label: "Hypertension (on daily medication)", label_en: "Hypertension on meds", label_bn: "উচ্চ রক্তচাপ (নিয়মিত ওষুধে)" }
    ],
    clinicalTags: ["hypertension", "cardiovascular_risk"]
  },

  // ── 4. GASTROINTESTINAL FUNCTION ─────────────────────────────────
  {
    id: "bloating_frequency",
    label: "Frequency of Abdominal Bloating",
    label_en: "How frequently do you experience noticeable abdominal bloating or distension?",
    label_bn: "কত ঘন ঘন পেটে গ্যাস বা পেট ফাঁপার সমস্যা হয়?",
    domain: "gastrointestinal",
    answerType: "select",
    isHighValueScreening: true,
    options: [
      { value: "none", label: "Rarely or never", label_en: "Never / Rarely", label_bn: "কখনোই না" },
      { value: "mild_occasional", label: "Occasional (1-2 times/week)", label_en: "Occasional mild", label_bn: "মাঝে মাঝে হালকা" },
      { value: "moderate_daily", label: "Daily mild-to-moderate", label_en: "Daily moderate", label_bn: "প্রতিদিন মাঝারি ধরনের" },
      { value: "severe_post_meal", label: "Severe bloating after almost every meal", label_en: "Severe after meals", label_bn: "প্রায় প্রতিবার খাওয়ার পরেই তীব্র পেট ফাঁপা" }
    ],
    clinicalTags: ["bloating", "dyspepsia"]
  },
  {
    id: "bloating_trigger_foods",
    label: "Foods that Provoke Bloating",
    label_en: "Which foods consistently trigger abdominal bloating or discomfort?",
    label_bn: "কোন কোন খাবার খেলে পেট বেশি ফাঁপে বা অস্বস্তি বাড়ে?",
    domain: "gastrointestinal",
    answerType: "multiselect",
    visibility: {
      condition: {
        OR: [
          { field: "bloating_frequency", operator: "equals", value: "moderate_daily" },
          { field: "bloating_frequency", operator: "equals", value: "severe_post_meal" }
        ]
      }
    },
    options: [
      { value: "milk_dairy", label: "Milk, sweet doi, or dairy foods", label_en: "Cow milk / Dairy", label_bn: "দুধ বা দুগ্ধজাত খাবার" },
      { value: "wheat_ruti", label: "Wheat roti, paratha, or bakery bread", label_en: "Wheat roti / Bread", label_bn: "আটার রুটি, পরোটা বা পাউরুটি" },
      { value: "lentils_dal", label: "Masoor, chana, or thick dal", label_en: "Lentils / Dal", label_bn: "মসুর বা ছোলার ডাল" },
      { value: "raw_salad", label: "Raw cucumber, tomato, or onion salad", label_en: "Raw salad / Cucumber", label_bn: "কাঁচা শসা, টমেটো বা পেঁয়াজ সালাদ" },
      { value: "fried_foods", label: "Singara, puri, or oily street snacks", label_en: "Fried oily foods", label_bn: "তেলে ভাজা খাবার" }
    ],
    clinicalTags: ["food_intolerance_triggers"]
  },
  {
    id: "acid_reflux_frequency",
    label: "Acid Reflux & Heartburn",
    label_en: "Do you experience acid regurgitation, sour taste in mouth, or burning in the chest?",
    label_bn: "বুকজ্বালা, টক ঢেকুর বা গলায় এসিড উঠে আসার সমস্যা হয় কি?",
    domain: "gastrointestinal",
    answerType: "select",
    isHighValueScreening: true,
    options: [
      { value: "none", label: "Never", label_en: "Never", label_bn: "কখনোই না" },
      { value: "occasional_after_heavy", label: "Occasional (after heavy or spicy meals)", label_en: "Occasional after heavy meals", label_bn: "মাঝে মাঝে (ভারী বা ঝাল খাবারের পর)" },
      { value: "frequent_3_plus", label: "Frequent (3 or more times per week)", label_en: "Frequent (>= 3x/week)", label_bn: "নিয়মিত (সপ্তাহে ৩ বা তার বেশি দিন)" },
      { value: "daily_medicated", label: "Daily (requires regular antacids / PPIs)", label_en: "Daily (needs PPI)", label_bn: "প্রতিদিন (গ্যাসের ওষুধ ছাড়া চলে না)" }
    ],
    clinicalTags: ["gerd", "acid_reflux", "ppi_indication"]
  },
  {
    id: "early_satiety",
    label: "Early Satiety (Fullness after few bites)",
    label_en: "Do you feel uncomfortably full after eating only a small fraction of a normal meal?",
    label_bn: "সামান্য কয়েক লোকমা খাওয়ার পরেই কি অস্বাভাবিক পেট ভরা মনে হয়?",
    domain: "gastrointestinal",
    answerType: "yesno",
    isHighValueScreening: true,
    clinicalTags: ["early_satiety", "delayed_gastric_emptying", "malnutrition_risk"]
  },

  // ── 5. MICROBIOME & GUT ECOLOGY ──────────────────────────────────
  {
    id: "bristol_stool_form",
    label: "Bristol Stool Consistency",
    label_en: "What is your most typical stool form over the past 2 weeks?",
    label_bn: "গত দুই সপ্তাহে আপনার পায়খানার স্বভাবজাত আকার বা ধরন কেমন?",
    domain: "microbiome",
    answerType: "select",
    isHighValueScreening: true,
    options: [
      { value: "bristol_1_separate_hard", label: "Type 1: Separate hard lumps, like nuts (Severe constipation)", label_en: "Type 1: Hard lumps", label_bn: "টাইপ ১: ছাগলের লাদির মতো শক্ত গুটি গুটি (তীব্র কোষ্ঠকাঠিন্য)" },
      { value: "bristol_2_lumpy_sausage", label: "Type 2: Sausage-shaped but lumpy", label_en: "Type 2: Lumpy sausage", label_bn: "টাইপ ২: শক্ত দড়ির মতো তবে খসখসে" },
      { value: "bristol_3_cracked_sausage", label: "Type 3: Like a sausage with cracks on its surface (Normal)", label_en: "Type 3: Sausage with cracks", label_bn: "টাইপ ৩: স্বাভাবিক মসৃণ তবে হালকা ফাটা" },
      { value: "bristol_4_smooth_snake", label: "Type 4: Like a sausage or snake, smooth and soft (Ideal)", label_en: "Type 4: Smooth and soft (Ideal)", label_bn: "টাইপ ৪: একদম স্বাভাবিক, নরম ও মসৃণ (আদর্শ)" },
      { value: "bristol_5_soft_blobs", label: "Type 5: Soft blobs with clear-cut edges (Lacking fiber)", label_en: "Type 5: Soft blobs", label_bn: "টাইপ ৫: নরম টুকরো টুকরো তবে স্পষ্ট কিনারাযুক্ত" },
      { value: "bristol_6_mushy_fluffy", label: "Type 6: Fluffy pieces with ragged edges, a mushy stool", label_en: "Type 6: Mushy stool", label_bn: "টাইপ ৬: নরম পেস্টের মতো পাতলা পায়খানা" },
      { value: "bristol_7_watery_liquid", label: "Type 7: Entirely liquid, no solid pieces (Diarrhea)", label_en: "Type 7: Watery diarrhea", label_bn: "টাইপ ৭: সম্পূর্ণ পানির মতো পাতলা (ডায়রিয়া)" }
    ],
    clinicalTags: ["bristol_stool", "gut_motility", "microbiome_health"]
  },
  {
    id: "bowel_movement_frequency",
    label: "Bowel Evacuation Frequency",
    label_en: "How many times do you typically pass stool?",
    label_bn: "সাধারণত কত ঘন ঘন পায়খানা হয়?",
    domain: "microbiome",
    answerType: "select",
    isHighValueScreening: true,
    options: [
      { value: "less_than_3_weekly", label: "Less than 3 times per week (Constipation)", label_en: "< 3 times / week", label_bn: "সপ্তাহে ৩ বারের কম (কোষ্ঠকাঠিন্য)" },
      { value: "once_every_1_2_days", label: "Once every 1 to 2 days (Standard)", label_en: "1x per 1-2 days", label_bn: "১ থেকে ২ দিনে একবার" },
      { value: "once_or_twice_daily", label: "1 to 2 times daily (Optimal)", label_en: "1-2x daily (Optimal)", label_bn: "প্রতিদিন ১ থেকে ২ বার (আদর্শ)" },
      { value: "three_or_more_daily", label: "3 or more times daily (Hyper-motile / Loose)", label_en: ">= 3x daily", label_bn: "প্রতিদিন ৩ বার বা তার বেশি" }
    ],
    clinicalTags: ["bowel_frequency"]
  },
  {
    id: "antibiotic_history_past_year",
    label: "Antibiotic Exposure in Past Year",
    label_en: "How many courses of oral antibiotics have you completed in the past 12 months?",
    label_bn: "গত ১২ মাসে কতবার অ্যান্টিবায়োটিক কোর্স সেবন করেছেন?",
    domain: "microbiome",
    answerType: "select",
    isHighValueScreening: true,
    options: [
      { value: "none", label: "None in past year", label_en: "0 courses", label_bn: "একবারও না" },
      { value: "one_course", label: "1 course", label_en: "1 course", label_bn: "১ বার" },
      { value: "two_to_three_courses", label: "2 to 3 courses", label_en: "2-3 courses", label_bn: "২ থেকে ৩ বার" },
      { value: "four_plus_frequent", label: "4 or more courses (High dysbiosis risk)", label_en: ">= 4 courses", label_bn: "৪ বার বা তার বেশি" }
    ],
    clinicalTags: ["antibiotic_exposure", "dysbiosis_risk"]
  },

  // ── 6. IMMUNE & INFLAMMATORY FUNCTION ────────────────────────────
  {
    id: "joint_stiffness_pain",
    label: "Joint Aches & Morning Stiffness",
    label_en: "Do you wake up with joint stiffness or pain that takes more than 30 minutes to ease?",
    label_bn: "সকালে ঘুম থেকে ওঠার পর হাত-পায়ের গাঁটে ব্যথা বা শক্ত ভাব ৩০ মিনিটের বেশি থাকে কি?",
    domain: "immune_inflammatory",
    answerType: "yesno",
    isHighValueScreening: true,
    clinicalTags: ["joint_pain", "systemic_inflammation", "arthritis_risk"]
  },
  {
    id: "skin_reactions_eczema_acne",
    label: "Chronic Skin Conditions",
    label_en: "Do you suffer from recurrent eczema, psoriasis, hives (urticaria), or cystic acne?",
    label_bn: "একজিমা, সোরিয়াসিস, অ্যালার্জি বা ত্বকে লালচে চুলকানির সমস্যা আছে কি?",
    domain: "immune_inflammatory",
    answerType: "select",
    options: [
      { value: "none", label: "Clear skin / No chronic rashes", label_en: "Clear skin", label_bn: "ত্বক স্বাভাবিক / কোনো সমস্যা নেই" },
      { value: "occasional_hives", label: "Occasional allergy / hives with certain foods", label_en: "Occasional hives", label_bn: "মাঝে মাঝে নির্দিষ্ট খাবারে এলার্জি বা চুলকানি" },
      { value: "chronic_inflammatory_skin", label: "Chronic persistent rash, eczema, or psoriasis", label_en: "Chronic eczema/psoriasis", label_bn: "দীর্ঘস্থায়ী একজিমা, সোরিয়াসিস বা চুলকানি" }
    ],
    clinicalTags: ["skin_inflammation", "gut_skin_axis"]
  },

  // ── 7. ENDOCRINE & HORMONAL HEALTH ───────────────────────────────
  {
    id: "thyroid_condition_diagnosed",
    label: "Thyroid Health Diagnosis",
    label_en: "Have you been diagnosed with Hypothyroidism, Hashimoto's, or Goiter?",
    label_bn: "আপনার কি হাইপোথাইরয়েড বা থাইরয়েডের কোনো সমস্যা আছে?",
    domain: "endocrine_hormonal",
    answerType: "select",
    isHighValueScreening: true,
    options: [
      { value: "no_normal_thyroid", label: "No (Normal thyroid)", label_en: "No, normal thyroid", label_bn: "না, থাইরয়েড স্বাভাবিক" },
      { value: "hypothyroid_medicated", label: "Hypothyroidism (taking Levothyroxine/Thyrox)", label_en: "Hypothyroid on Thyrox", label_bn: "হাইপোথাইরয়েড (নিয়মিত থাইরক্সিন ওষুধ খাচ্ছেন)" },
      { value: "hypothyroid_unmedicated", label: "Elevated TSH but not taking medication", label_en: "Subclinical hypothyroid", label_bn: "টিএসএইচ বেশি তবে ওষুধ খাচ্ছেন না" },
      { value: "hyperthyroid", label: "Hyperthyroidism (overactive thyroid)", label_en: "Hyperthyroid", label_bn: "হাইপারথাইরয়েড (অতিরিক্ত সক্রিয় থাইরয়েড)" }
    ],
    clinicalTags: ["thyroid_diagnosis", "hypothyroidism"]
  },
  {
    id: "thyroid_medication_timing",
    label: "Levothyroxine Administration Timing",
    label_en: "Do you take your thyroid hormone on an empty stomach with plain water at least 30-60 min before food?",
    label_bn: "থাইরয়েডের ওষুধ কি সকালে খালি পেটে খাওয়ার অন্তত ৩০-৬০ মিনিট আগে শুধু পানি দিয়ে খান?",
    domain: "endocrine_hormonal",
    answerType: "yesno",
    visibility: {
      condition: { field: "thyroid_condition_diagnosed", operator: "equals", value: "hypothyroid_medicated" }
    },
    clinicalTags: ["levothyroxine_timing", "drug_food_interaction"]
  },
  {
    id: "menstrual_regularity",
    label: "Menstrual Cycle Regularity (Females)",
    label_en: "Are your menstrual cycles regular (24 to 35 days) with normal flow?",
    label_bn: "মাসিক চক্র কি নিয়মিত (২৪ থেকে ৩৫ দিন অন্তর) এবং স্বাভাবিক?",
    domain: "endocrine_hormonal",
    answerType: "select",
    options: [
      { value: "regular_cycles", label: "Regular (every 26-32 days)", label_en: "Regular cycles", label_bn: "নিয়মিত (২৬-৩২ দিন অন্তর)" },
      { value: "irregular_infrequent", label: "Irregular or delayed (>35 days, PCOS signs)", label_en: "Irregular / Delayed", label_bn: "অনিয়মিত বা দেরিতে (৩৫ দিনের বেশি, পিসিওএস)" },
      { value: "heavy_painful", label: "Regular but excessively heavy or painful", label_en: "Heavy / Painful flow", label_bn: "নিয়মিত তবে অতিরিক্ত রক্তপাত বা তীব্র ব্যথা" },
      { value: "menopausal", label: "Post-menopausal (no periods for >12 months)", label_en: "Post-menopausal", label_bn: "মেনোপজ হয়েছে (১ বছরের বেশি বন্ধ)" },
      { value: "not_applicable_male", label: "Not applicable (Male)", label_en: "Not applicable (Male)", label_bn: "প্রযোজ্য নয় (পুরুষ)" }
    ],
    clinicalTags: ["menstrual_cycle", "pcos_risk"]
  },

  // ── 8. HEPATIC & BIOTRANSFORMATION ───────────────────────────────
  {
    id: "fatty_liver_diagnosis",
    label: "Fatty Liver Disease Diagnosis",
    label_en: "Have you had an ultrasound showing fatty liver (Grade 1, 2, or 3)?",
    label_bn: "আল্ট্রাসনোগ্রামে কি ফ্যাটি লিভার ধরা পড়েছে?",
    domain: "hepatic_biotransformation",
    answerType: "select",
    isHighValueScreening: true,
    options: [
      { value: "no_or_normal", label: "No / Normal liver ultrasound", label_en: "No / Normal liver", label_bn: "না / লিভার স্বাভাবিক" },
      { value: "grade_1_fatty_liver", label: "Grade 1 Fatty Liver (Mild steatosis)", label_en: "Grade 1 Fatty Liver", label_bn: "গ্রেড ১ ফ্যাটি লিভার (হালকা)" },
      { value: "grade_2_3_fatty_liver", label: "Grade 2 or 3 Fatty Liver (Moderate-Severe steatosis)", label_en: "Grade 2/3 Fatty Liver", label_bn: "গ্রেড ২ বা ৩ ফ্যাটি লিভার (মাঝারি-তীব্র)" },
      { value: "never_tested", label: "Never had an abdominal ultrasound", label_en: "Never tested", label_bn: "কখনো আল্ট্রাসনোগ্রাম করা হয়নি" }
    ],
    clinicalTags: ["fatty_liver", "hepatic_steatosis"]
  },

  // ── 9. MITOCHONDRIAL & ENERGY FUNCTION ───────────────────────────
  {
    id: "morning_fatigue_level",
    label: "Morning Awakening Energy",
    label_en: "Do you wake up feeling unrefreshed, exhausted, or needing caffeine immediately to function?",
    label_bn: "সকালে ঘুম থেকে ওঠার পর শরীর কি ক্লান্ত লাগে এবং চা/কফি ছাড়া স্বাভাবিক হওয়া কঠিন হয়?",
    domain: "mitochondrial_energy",
    answerType: "yesno",
    isHighValueScreening: true,
    clinicalTags: ["unrefreshed_sleep", "mitochondrial_fatigue", "adrenal_fatigue"]
  },

  // ── 10. SLEEP & CIRCADIAN RHYTHM ─────────────────────────────────
  {
    id: "sleep_duration_hours",
    label: "Average Nightly Sleep Duration",
    label_en: "How many hours of actual sleep do you get per night on average?",
    label_bn: "রাতে গড়ে সাধারণত কত ঘণ্টা ঘুম হয়?",
    domain: "sleep_circadian",
    answerType: "number",
    unit: "hours",
    isHighValueScreening: true,
    clinicalTags: ["sleep_duration"]
  },
  {
    id: "shift_work_schedule",
    label: "Shift Work or Night Duty",
    label_en: "Do you regularly work night shifts, rotating hours, or stay awake past 1:00 AM?",
    label_bn: "আপনি কি নিয়মিত নাইট শিফটে কাজ করেন বা রাত ১টার পর ঘুমাতে যান?",
    domain: "sleep_circadian",
    answerType: "yesno",
    isHighValueScreening: true,
    clinicalTags: ["shift_worker", "circadian_disruption"]
  },

  // ── 11. STRESS & NEUROBEHAVIORAL ─────────────────────────────────
  {
    id: "perceived_stress_level",
    label: "Perceived Daily Stress Level",
    label_en: "How would you rate your everyday baseline mental stress level?",
    label_bn: "আপনার দৈনন্দিন মানসিক চাপের মাত্রা কেমন?",
    domain: "stress_neurobehavioral",
    answerType: "select",
    isHighValueScreening: true,
    options: [
      { value: "low_manageable", label: "Low / Well managed", label_en: "Low / Calm", label_bn: "কম / নিয়ন্ত্রিত" },
      { value: "moderate_routine", label: "Moderate routine stress", label_en: "Moderate", label_bn: "মাঝারি ধরনের স্বাভাবিক চাপ" },
      { value: "high_overwhelming", label: "High / Chronic overwhelming stress", label_en: "High / Overwhelming", label_bn: "অতিরিক্ত ও দীর্ঘস্থায়ী তীব্র মানসিক চাপ" }
    ],
    clinicalTags: ["stress_level", "hpa_axis"]
  },

  // ── 12. MEDICATIONS, SUPPLEMENTS & ALLERGIES ─────────────────────
  {
    id: "confirmed_food_allergies_list",
    label: "Confirmed Food Allergies",
    label_en: "Diagnosed or severe immediate reactions to specific foods",
    label_bn: "কোনো খাবারে কি নিশ্চিত মারাত্মক অ্যালার্জি আছে?",
    domain: "medication_supplements",
    answerType: "multiselect",
    isHighValueScreening: true,
    options: [
      { value: "shrimp_prawn", label: "Shrimp / Prawn / Crab", label_en: "Shrimp / Shellfish", label_bn: "চিংড়ি বা কাঁকড়া" },
      { value: "egg_hen", label: "Egg (hen/duck)", label_en: "Egg", label_bn: "ডিম" },
      { value: "peanuts", label: "Peanuts", label_en: "Peanuts", label_bn: "চিনাবাদাম" },
      { value: "cow_milk_dairy", label: "Cow's Milk Dairy Protein", label_en: "Cow Milk", label_bn: "গরুর দুধের প্রোটিন" },
      { value: "beef", label: "Beef", label_en: "Beef", label_bn: "গরুর মাংস" },
      { value: "hilsa_fish", label: "Ilish / Hilsa Fish", label_en: "Hilsa Fish", label_bn: "ইলিশ মাছ" },
      { value: "eggplant_brinjal", label: "Eggplant (Begun)", label_en: "Eggplant", label_bn: "বেগুন" }
    ],
    clinicalTags: ["confirmed_allergy"]
  },
  {
    id: "regular_ppi_antacid_use",
    label: "Regular Antacid / PPI Gastric Medicine Use",
    label_en: "Do you take Omeprazole, Esomeprazole, or Pantoprazole almost every day?",
    label_bn: "আপনি কি প্রায় প্রতিদিন গ্যাসের ওষুধ (যেমন ওমিপ্রাজল, ইসোমিপ্রাজল) খান?",
    domain: "medication_supplements",
    answerType: "yesno",
    isHighValueScreening: true,
    clinicalTags: ["ppi_dependence", "b12_magnesium_depletion_risk"]
  },

  // ── 13. MANDATORY CLINICAL SAFETY SCREENING ──────────────────────
  {
    id: "safety_insulin_active",
    label: "Active Insulin Therapy",
    label_en: "Are you currently taking injectable insulin for diabetes management?",
    label_bn: "আপনি কি বর্তমানে ইনজেকশনের মাধ্যমে ইনসুলিন নিচ্ছেন?",
    domain: "medication_supplements",
    answerType: "yesno",
    isHighValueScreening: true,
    required: true,
    clinicalTags: ["insulin_safety", "hypoglycemia_risk"]
  },
  {
    id: "safety_sulfonylurea_active",
    label: "Active Sulfonylurea Therapy",
    label_en: "Are you taking Glimepiride, Gliclazide, or Glipizide (medicines causing hypoglycemia)?",
    label_bn: "আপনি কি গ্লাইমেপিরাইড বা গ্লিক্লাজাইড জাতীয় সুগার কমানোর ওষুধ খাচ্ছেন?",
    domain: "medication_supplements",
    answerType: "yesno",
    isHighValueScreening: true,
    required: true,
    clinicalTags: ["sulfonylurea_safety", "hypoglycemia_risk"]
  },
  {
    id: "safety_prescribed_fluid_limit",
    label: "Prescribed Fluid Restriction",
    label_en: "Has a doctor placed you on a strict daily fluid restriction (e.g. for dialysis or heart failure)?",
    label_bn: "ডাক্তার কি কিডনি বা হার্টের কারণে আপনাকে নির্দিষ্ট পরিমাণ পানি পানের নির্দেশ দিয়েছেন?",
    domain: "clinical_history",
    answerType: "select",
    isHighValueScreening: true,
    required: true,
    options: [
      { value: "no_restriction", label: "No restriction (Drink freely)", label_en: "No restriction", label_bn: "কোনো বিধিনিষেধ নেই" },
      { value: "restricted_1000ml", label: "Strict <= 1000 mL / day", label_en: "<= 1000 mL/day", label_bn: "কঠোরভাবে ১ লিটারের কম" },
      { value: "restricted_1500ml", label: "Strict <= 1500 mL / day", label_en: "<= 1500 mL/day", label_bn: "দেড় লিটারের কম (১৫০০ মিলি)" },
      { value: "restricted_2000ml", label: "Strict <= 2000 mL / day", label_en: "<= 2000 mL/day", label_bn: "২ লিটারের কম (২০০০ মিলি)" }
    ],
    clinicalTags: ["fluid_restriction", "renal_cardiac_safety"]
  },
  {
    id: "safety_hospital_feeding_route",
    label: "Feeding Route Status",
    label_en: "What is your current feeding route?",
    label_bn: "আপনার বর্তমান খাদ্য গ্রহণের মাধ্যম কোনটি?",
    domain: "clinical_history",
    answerType: "select",
    isHighValueScreening: true,
    required: true,
    options: [
      { value: "oral_standard", label: "Oral standard (Eats normally by mouth)", label_en: "Oral standard", label_bn: "মুখে স্বাভাবিক খাবার খান" },
      { value: "oral_modified_texture", label: "Oral texture modified (Pureed/Soft/Liquid)", label_en: "Texture modified", label_bn: "নরম বা তরল ব্লেন্ড করা খাবার" },
      { value: "npo_nil_per_os", label: "Strict NPO (Nothing by mouth prescribed)", label_en: "Strict NPO", label_bn: "সম্পূর্ণ মুখে খাওয়া নিষিদ্ধ (NPO)" },
      { value: "enteral_tube", label: "Enteral tube (NG Tube or PEG/PEJ)", label_en: "Enteral tube", label_bn: "নাকের বা পেটের নালীর মাধ্যমে (টিউব ফিডিং)" },
      { value: "parenteral_tpn", label: "Parenteral (Intravenous TPN/PPN)", label_en: "Parenteral TPN", label_bn: "শিরার মাধ্যমে স্যালাইন পুষ্টি (TPN)" }
    ],
    clinicalTags: ["feeding_route", "hospital_safety"]
  },
  {
    id: "safety_dysphagia_choking_risk",
    label: "Swallowing Difficulty / Choking Risk",
    label_en: "Do you experience coughing, choking, or difficulty swallowing foods or liquids (Dysphagia)?",
    label_bn: "খাবার বা পানি গিলতে গেলে কি কাশি, গলায় আটকানো বা বিষম খাওয়ার সমস্যা হয়?",
    domain: "gastrointestinal",
    answerType: "yesno",
    isHighValueScreening: true,
    required: true,
    clinicalTags: ["dysphagia", "aspiration_risk"]
  },

  // ── 14. ENVIRONMENTAL & LIFESTYLE ────────────────────────────────
  {
    id: "daily_sunlight_exposure",
    label: "Direct Sun Exposure",
    label_en: "Do you get at least 15-20 minutes of midday direct sun exposure without sunscreen?",
    label_bn: "প্রতিদিন অন্তত ১৫-২০ মিনিট খোলা গায়ে রোদে থাকা হয় কি?",
    domain: "environmental_lifestyle",
    answerType: "select",
    options: [
      { value: "none_indoor_all_day", label: "Practically none (indoor all day)", label_en: "Virtually zero sun", label_bn: "সারাদিন ইনডোরে (রোদ লাগে না বললেই চলে)" },
      { value: "weekly_once_or_twice", label: "1-2 times weekly", label_en: "1-2 times/week", label_bn: "সপ্তাহে ১ বা ২ দিন" },
      { value: "regular_daily_sun", label: "Daily direct sunlight (Optimal)", label_en: "Daily midday sun", label_bn: "নিয়মিত প্রতিদিন রোদে যাওয়া হয়" }
    ],
    clinicalTags: ["sunlight_exposure", "vitamin_d_deficiency_risk"]
  },
  {
    id: "drinking_water_purification",
    label: "Drinking Water Source & Filtration",
    label_en: "What is your primary household drinking water source?",
    label_bn: "খাবার পানির প্রধান উৎস ও পরিশোধন ব্যবস্থা কী?",
    domain: "environmental_lifestyle",
    answerType: "select",
    options: [
      { value: "boiled_tap_water", label: "Boiled municipal tap water", label_en: "Boiled tap water", label_bn: "ফুটানো সাপ্লাই পানি" },
      { value: "ro_membrane_purifier", label: "Reverse Osmosis (RO) Filter", label_en: "RO Purifier", label_bn: "রিভার্স অসমোসিস (RO) ফিল্টার" },
      { value: "ceramic_candle_filter", label: "Ceramic / Candle filter", label_en: "Ceramic filter", label_bn: "সিরামিক বা সাধারণ ফিল্টার" },
      { value: "deep_tubewell", label: "Deep Tubewell water", label_en: "Deep Tubewell", label_bn: "গভীর নলকূপের পানি" },
      { value: "jar_commercial_water", label: "Commercial 20L Jar water", label_en: "Commercial Jar water", label_bn: "বাণিজ্যিক ২০ লিটার জার পানি" }
    ],
    clinicalTags: ["water_quality"]
  },

  // ── SPECIAL POPULATION MODULE: PREGNANCY ─────────────────────────
  {
    id: "pregnancy_gestational_week",
    label: "Gestational Week (Pregnancy)",
    label_en: "Current week of pregnancy (completed weeks)",
    label_bn: "গর্ভাবস্থার বর্তমান সপ্তাহ",
    domain: "clinical_history",
    subdomain: "pregnancy",
    answerType: "number",
    applicablePopulation: ["pregnancy"],
    isHighValueScreening: true,
    clinicalTags: ["pregnancy_week"]
  },
  {
    id: "pregnancy_blood_pressure_edema",
    label: "High Blood Pressure or Severe Swelling",
    label_en: "Have you noticed sudden swelling of face/hands or elevated blood pressure?",
    label_bn: "হাত-মুখ হঠাৎ ফুলে যাওয়া বা রক্তচাপ বেড়ে যাওয়ার সমস্যা হয়েছে কি?",
    domain: "clinical_history",
    subdomain: "pregnancy",
    answerType: "yesno",
    applicablePopulation: ["pregnancy"],
    isHighValueScreening: true,
    clinicalTags: ["preeclampsia_risk", "red_flag_pregnancy"]
  },

  // ── SPECIAL POPULATION MODULE: PEDIATRIC (<12 years) ──────────────
  {
    id: "pediatric_growth_percentile",
    label: "Child Growth Trajectory",
    label_en: "Is the child tracking normally on their growth curve for height and weight?",
    label_bn: "শিশুর বয়স অনুযায়ী উচ্চতা ও ওজনের স্বাভাবিক বৃদ্ধি হচ্ছে কি?",
    domain: "anthropometrics",
    subdomain: "pediatric",
    answerType: "select",
    applicablePopulation: ["pediatric"],
    isHighValueScreening: true,
    options: [
      { value: "normal_growth", label: "Growing normally", label_en: "Normal growth curve", label_bn: "স্বাভাবিক বৃদ্ধি হচ্ছে" },
      { value: "underweight_stunting", label: "Underweight / Stunted growth concern", label_en: "Underweight concern", label_bn: "বয়সের তুলনায় কম ওজন বা কম উচ্চতা" },
      { value: "rapid_childhood_weight", label: "Accelerated rapid weight gain", label_en: "Accelerated weight gain", label_bn: "অস্বাভাবিক দ্রুত ওজন বৃদ্ধি" }
    ],
    clinicalTags: ["pediatric_growth"]
  },
  {
    id: "pediatric_feeding_difficulty",
    label: "Child Feeding Habits & Appetite",
    label_en: "Does the child experience extreme food refusal, sensory aversion, or feeding fatigue?",
    label_bn: "শিশু কি খাবার খেতে তীব্র অনীহা বা অতিরিক্ত কষ্ট প্রকাশ করে?",
    domain: "gastrointestinal",
    subdomain: "pediatric",
    answerType: "select",
    applicablePopulation: ["pediatric"],
    options: [
      { value: "good_appetite", label: "Good appetite, eats varied foods", label_en: "Good appetite", label_bn: "ভালো রুচি ও স্বাভাবিক খাওয়া" },
      { value: "picky_eating_moderate", label: "Picky eating (eats only 3-4 specific foods)", label_en: "Picky eating", label_bn: "নির্দিষ্ট কয়েকটি খাবার ছাড়া খেতে চায় না" },
      { value: "severe_feeding_refusal", label: "Severe feeding refusal / weight loss", label_en: "Severe refusal", label_bn: "মারাত্মক খাওয়ানোর কষ্ট ও ওজন হ্রাস" }
    ],
    clinicalTags: ["pediatric_feeding"]
  },

  // ── SPECIAL POPULATION: ONCOLOGY ─────────────────────────────────
  {
    id: "oncology_treatment_phase",
    label: "Oncology Treatment Stage",
    label_en: "Current phase of cancer therapy",
    label_bn: "ক্যান্সার চিকিৎসার বর্তমান পর্যায়",
    domain: "clinical_history",
    subdomain: "oncology",
    answerType: "select",
    applicablePopulation: ["oncology"],
    applicablePathways: ["oncology"],
    isHighValueScreening: true,
    options: [
      { value: "active_chemotherapy", label: "Active Chemotherapy", label_en: "Active Chemotherapy", label_bn: "বর্তমানে কেমোথেরাপি চলছে" },
      { value: "active_radiotherapy", label: "Active Radiotherapy", label_en: "Active Radiotherapy", label_bn: "বর্তমানে রেডিওথেরাপি চলছে" },
      { value: "post_surgical_recovery", label: "Post-surgical recovery", label_en: "Post-surgical recovery", label_bn: "অস্ত্রোপচারের পর পুনরুদ্ধার পর্ব" },
      { value: "remission_surveillance", label: "Remission / Long-term surveillance", label_en: "Remission / Surveillance", label_bn: "রেমিশন / পর্যবেক্ষণ পর্যায়" }
    ],
    clinicalTags: ["oncology_treatment"]
  },

  // ── SPECIAL POPULATION: RENAL (CKD) ──────────────────────────────
  {
    id: "renal_dialysis_status",
    label: "Dialysis Status",
    label_en: "Are you currently receiving regular hemodialysis or peritoneal dialysis?",
    label_bn: "আপনি কি নিয়মিত হেমোডায়ালাইসিস নিচ্ছেন?",
    domain: "clinical_history",
    subdomain: "renal",
    answerType: "select",
    applicablePopulation: ["renal"],
    applicablePathways: ["renal"],
    isHighValueScreening: true,
    options: [
      { value: "not_on_dialysis", label: "No (Non-dialysis CKD)", label_en: "Non-dialysis CKD", label_bn: "না (ডায়ালাইসিস ছাড়া সিকেডি)" },
      { value: "hemodialysis_twice_weekly", label: "Hemodialysis (2x per week)", label_en: "Hemodialysis 2x/week", label_bn: "হেমোডায়ালাইসিস (সপ্তাহে ২ বার)" },
      { value: "hemodialysis_thrice_weekly", label: "Hemodialysis (3x per week)", label_en: "Hemodialysis 3x/week", label_bn: "হেমোডায়ালাইসিস (সপ্তাহে ৩ বার)" },
      { value: "peritoneal_dialysis", label: "Peritoneal Dialysis (CAPD)", label_en: "Peritoneal Dialysis", label_bn: "পেরিটনিয়াল ডায়ালাইসিস" }
    ],
    clinicalTags: ["dialysis_status", "ckd_management"]
  }
];

export const questionnaireRegistry = {
  version: registryVersion,
  domains: ASSESSMENT_DOMAINS,
  core: coreQuestions,
};
