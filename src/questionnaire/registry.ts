// Questionnaire Registry for Functional Nutrition Assessment
// -------------------------------------------------------
// 14 Functional Nutrition Domains with adaptive branching,
// bilingual (Bangla & English) questions, declarative visibility rules,
// and quick/comprehensive screening flags.

export const registryVersion = "v2.0.0" as const;

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
  unit?: string;
  hint_en?: string;
  hint_bn?: string;
}

// ─────────────────────────────────────────────────────────────────
// Comprehensive Question Bank (Covering all 14 domains)
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
    clinicalTags: ["reactive_hypoglycemia_risk", "dysglycemia"]
  },
  {
    id: "acanthosis_nigricans_skin_tags",
    label: "Darkened Skin Folds / Skin Tags",
    label_en: "Do you have velvety hyperpigmentation around the neck/armpits or multiple skin tags?",
    label_bn: "ঘাড়ের পেছনে বা বগলে কালো পুরু ত্বক (অ্যাকান্থোসিস) বা ছোট ছোট মাংসের আঁচিল আছে কি?",
    domain: "metabolic",
    answerType: "yesno",
    clinicalTags: ["insulin_resistance", "hyperinsulinemia_marker"]
  },

  // ── 4. GASTROINTESTINAL FUNCTION ─────────────────────────────────
  {
    id: "bloating_frequency",
    label: "Abdominal Bloating & Distension",
    label_en: "How frequently do you experience abdominal bloating or swelling after eating?",
    label_bn: "খাওয়ার পর পেট ফাঁপা বা পেট ভারী লাগার সমস্যা কতটা ঘন ঘন হয়?",
    domain: "gastrointestinal",
    answerType: "select",
    isHighValueScreening: true,
    options: [
      { value: "none", label: "None / Rare", label_en: "Rarely or never", label_bn: "কদাচিৎ বা হয় না" },
      { value: "mild_late_day", label: "Mild bloating towards the evening", label_en: "Mild, mostly evening", label_bn: "হালকা পেট ফাঁপা (বিশেষ করে সন্ধ্যায়)" },
      { value: "severe_post_meal", label: "Severe distension within 30-60 mins of eating", label_en: "Severe distension within 60 mins", label_bn: "খাওয়ার ৩০-৬০ মিনিটের মধ্যেই পেট ফুলে ঢোল হওয়া" }
    ],
    clinicalTags: ["bloating", "gi_distension"]
  },
  {
    id: "bloating_trigger_foods",
    label: "Foods Triggering Bloating",
    label_en: "Which specific foods trigger immediate gas or bloating?",
    label_bn: "কোন কোন খাবার খেলে দ্রুত গ্যাস বা পেট ফাঁপা হয়?",
    domain: "gastrointestinal",
    answerType: "multiselect",
    visibility: {
      condition: { field: "bloating_frequency", operator: "notEquals", value: "none" }
    },
    options: [
      { value: "dairy_milk", label: "Cow's milk / Sweets / Dairy", label_en: "Milk / Dairy products", label_bn: "গরুর দুধ, মিষ্টি বা দুগ্ধজাত খাবার" },
      { value: "lentils_dal", label: "Lentils / Chickpeas / Legumes", label_en: "Lentils / Dal / Chickpeas", label_bn: "মসুর ডাল, ছোলা বা যেকোনো ডাল" },
      { value: "wheat_gluten", label: "Wheat bread / Roti / Bakery", label_en: "Wheat flour, bread, biscuits", label_bn: "আটার রুটি, পাউরুটি, বিস্কুট" },
      { value: "onions_garlic", label: "Raw onion / Garlic / Spices", label_en: "Onions, garlic, rich gravy", label_bn: "কাঁচা পেঁয়াজ, রসুন বা অতিরিক্ত তেল-মসলা" },
      { value: "cruciferous_veg", label: "Cabbage / Cauliflower / Radish", label_en: "Cabbage, cauliflower", label_bn: "বাঁধাকপি, ফুলকপি বা মূলা" },
      { value: "fried_oily", label: "Singara, Puri, Fried snacks", label_en: "Deep-fried street snacks", label_bn: "সিঙ্গারা, পুরি, পেঁয়াজু বা ভাজাপোড়া" }
    ],
    clinicalTags: ["food_intolerance_triggers", "fodmap_sensitivity"]
  },
  {
    id: "acid_reflux_heartburn",
    label: "Acid Reflux / Sour Burping",
    label_en: "Do you have acid reflux, retrosternal burning, or sour fluid rising into the throat?",
    label_bn: "বুক জ্বালাপোড়া, টক ঢেকুর বা গলায় টক পানি উঠে আসার সমস্যা আছে কি?",
    domain: "gastrointestinal",
    answerType: "select",
    isHighValueScreening: true,
    options: [
      { value: "never", label: "Never", label_en: "Never", label_bn: "কখনোই না" },
      { value: "occasional_weekly", label: "Occasional (1-2x per week)", label_en: "1-2 times weekly", label_bn: "মাঝে মাঝে (সপ্তাহে ১-২ বার)" },
      { value: "frequent_nightly", label: "Severe / Wakes up at night choking", label_en: "Frequent / nocturnal choking", label_bn: "নিয়মিত বা রাতে শোয়ার পর দম বন্ধ ভাব" }
    ],
    clinicalTags: ["acid_reflux", "gerd_pattern"]
  },
  {
    id: "early_satiety_epigastric_heaviness",
    label: "Early Satiety / Hypochlorhydria Sensation",
    label_en: "Do you feel full after only a few bites, or feels like food sits in the stomach like a stone for hours?",
    label_bn: "অল্প খেলেই পেট ভরে যাওয়া অথবা পেটে খাবার পাথরের মতো দীর্ঘক্ষণ জমে থাকার অনুভূতি হয় কি?",
    domain: "gastrointestinal",
    answerType: "yesno",
    clinicalTags: ["early_satiety", "hypochlorhydria_pattern"]
  },
  {
    id: "gi_red_flags_blood",
    label: "GI Bleeding / Black Tarry Stools",
    label_en: "Have you noticed bright red blood in stool, black tarry stools, or coffee-ground vomiting?",
    label_bn: "মলে তাজা রক্ত, আলকাতরার মতো কালো পায়খানা বা কফির গুঁড়োর মতো বমি হয়েছে কি?",
    domain: "gastrointestinal",
    answerType: "yesno",
    isHighValueScreening: true,
    clinicalTags: ["gi_bleeding", "red_flag_bleeding"]
  },

  // ── 5. MICROBIOME & GUT ECOLOGY ──────────────────────────────────
  {
    id: "bristol_stool_form",
    label: "Bristol Stool Form",
    label_en: "Predominant stool consistency based on the Bristol Stool Chart",
    label_bn: "আপনার সাধারণ মলের ধরন বা কনসিস্টেন্সি (ব্রিস্টল স্কেল)",
    domain: "microbiome",
    answerType: "select",
    isHighValueScreening: true,
    options: [
      { value: "type_1_hard_lumps", label: "Type 1: Hard separate lumps (severe constipation)", label_en: "Type 1: Separate hard lumps", label_bn: "টাইপ ১: শক্ত গোল গোল ছাগলের লাদির মতো (তীব্র কোষ্ঠকাঠিন্য)" },
      { value: "type_2_lumpy_sausage", label: "Type 2: Lumpy sausage (mild constipation)", label_en: "Type 2: Lumpy sausage shape", label_bn: "টাইপ ২: শক্ত খণ্ড খণ্ড জোড়া লাগা মল" },
      { value: "type_3_cracked_sausage", label: "Type 3: Sausage with surface cracks (normal)", label_en: "Type 3: Sausage with surface cracks", label_bn: "টাইপ ৩: স্বাভাবিক মসৃণ কিন্তু কিছুটা ফাটলযুক্ত" },
      { value: "type_4_smooth_snake", label: "Type 4: Smooth soft snake (optimal healthy)", label_en: "Type 4: Smooth, soft, ideal sausage", label_bn: "টাইপ ৪: মসৃণ ও নরম কলার মতো (উত্তম সুস্থ মল)" },
      { value: "type_5_soft_blobs", label: "Type 5: Soft blobs with clear-cut edges", label_en: "Type 5: Soft blobs, lacking fiber", label_bn: "টাইপ ৫: নরম টুকরো টুকরো মল" },
      { value: "type_6_mushy_fluffy", label: "Type 6: Fluffy mushy pieces with ragged edges", label_en: "Type 6: Mushy stool (mild diarrhea)", label_bn: "টাইপ ৬: নরম পেস্টের মতো পাতলা পায়খানা" },
      { value: "type_7_watery_liquid", label: "Type 7: Entirely liquid, watery diarrhea", label_en: "Type 7: Watery diarrhea", label_bn: "টাইপ ৭: সম্পূর্ণ পানির মতো পাতলা পায়খানা" }
    ],
    clinicalTags: ["bristol_stool_score", "motility_status"]
  },
  {
    id: "bowel_movement_frequency",
    label: "Bowel Evacuation Frequency",
    label_en: "How often do you have a complete bowel movement?",
    label_bn: "সাধারণত কত ঘন ঘন পেট পরিষ্কার হয়?",
    domain: "microbiome",
    answerType: "select",
    options: [
      { value: "less_than_3_per_week", label: "Less than 3 times per week (Constipated)", label_en: "< 3 times/week", label_bn: "সপ্তাহে ৩ বারেরও কম (কোষ্ঠকাঠিন্য)" },
      { value: "once_every_1_2_days", label: "Once every 1 to 2 days", label_en: "Once every 1-2 days", label_bn: "প্রতি ১ বা ২ দিনে একবার" },
      { value: "once_to_twice_daily", label: "1-2 times daily (Optimal)", label_en: "1-2 times daily", label_bn: "প্রতিদিন ১ থেকে ২ বার (আদর্শ)" },
      { value: "three_or_more_daily", label: "3 or more times daily with urgency", label_en: "3+ times daily with urgency", label_bn: "দিনে ৩ বা ততোধিকবার বেগ সহকারে" }
    ],
    clinicalTags: ["bowel_frequency"]
  },
  {
    id: "antibiotic_history_past_year",
    label: "Antibiotic Exposure (Past 12 Months)",
    label_en: "How many courses of oral antibiotics have you taken in the past year?",
    label_bn: "গত এক বছরে আপনি মোট কয়টি অ্যান্টিবায়োটিক কোর্স সেবন করেছেন?",
    domain: "microbiome",
    answerType: "select",
    options: [
      { value: "none", label: "None", label_en: "0 courses", label_bn: "একটিও না" },
      { value: "one_course", label: "1 short course", label_en: "1 short course", label_bn: "১টি কোর্স" },
      { value: "multiple_courses", label: "2 to 3 courses", label_en: "2-3 courses", label_bn: "২ থেকে ৩টি কোর্স" },
      { value: "frequent_heavy", label: "4+ courses or long-term therapy", label_en: "4 or more courses", label_bn: "৪ বা তার অধিক কোর্স" }
    ],
    clinicalTags: ["antibiotic_exposure", "dysbiosis_risk"]
  },
  {
    id: "undigested_food_in_stool",
    label: "Undigested Food Fragments in Stool",
    label_en: "Do you regularly notice visible undigested vegetable or food particles in stool?",
    label_bn: "মলে নিয়মিতভাবে অপাচিত খাবার বা শাকসবজির অক্ষত অংশ দেখা যায় কি?",
    domain: "microbiome",
    answerType: "yesno",
    clinicalTags: ["maldigestion", "pancreatic_or_stomach_acid_insufficiency"]
  },

  // ── 6. IMMUNE & INFLAMMATORY FUNCTION ────────────────────────────
  {
    id: "chronic_joint_muscle_pain",
    label: "Joint Stiffness or Body Aches",
    label_en: "Do you suffer from morning joint stiffness or migratory muscle aches?",
    label_bn: "সকালে ঘুম থেকে ওঠার পর হাত-পায়ের জয়েন্টে শক্ত ভাব বা শরীরে দীর্ঘস্থায়ী ব্যথা থাকে কি?",
    domain: "immune_inflammatory",
    answerType: "select",
    isHighValueScreening: true,
    options: [
      { value: "none", label: "No pain", label_en: "No aches", label_bn: "কোনো ব্যথা নেই" },
      { value: "mild_weather_related", label: "Mild aches with cold/humidity", label_en: "Mild occasional aches", label_bn: "মাঝে মাঝে হালকা ব্যথা (শীত বা বৃষ্টিতে)" },
      { value: "persistent_stiffness", label: "Daily joint stiffness >30 minutes", label_en: "Daily stiffness >30 mins", label_bn: "প্রতিদিন ৩০ মিনিটের বেশি জয়েন্ট শক্ত থাকা" }
    ],
    clinicalTags: ["joint_pain", "inflammatory_burden"]
  },
  {
    id: "eczema_hives_allergies",
    label: "Allergic Symptoms (Skin / Sinus)",
    label_en: "Do you experience frequent hives, eczema, sneezing attacks, or itching after eating?",
    label_bn: "প্রায়শই ত্বকে চুলকানি, আমবাত (হাইভস), একজিমা বা খাবার পর হাঁচি-সর্দি হয় কি?",
    domain: "immune_inflammatory",
    answerType: "yesno",
    clinicalTags: ["atopy", "histamine_reactivity", "allergy_pattern"]
  },
  {
    id: "known_autoimmune_diagnoses",
    label: "Known Autoimmune Conditions",
    label_en: "Have you been medically diagnosed with an autoimmune disease?",
    label_bn: "চিকিৎসক কর্তৃক নিশ্চিতকৃত কোনো অটোইমিউন রোগ আছে কি?",
    domain: "immune_inflammatory",
    answerType: "multiselect",
    options: [
      { value: "none", label: "None diagnosed", label_en: "None", label_bn: "নেই" },
      { value: "hashimotos", label: "Hashimoto's Thyroiditis", label_en: "Hashimoto's", label_bn: "হাশিমোটোস থাইরয়েডাইটিস" },
      { value: "rheumatoid_arthritis", label: "Rheumatoid Arthritis", label_en: "Rheumatoid Arthritis", label_bn: "রিউমাটয়েড আর্থ্রাইটিস" },
      { value: "psoriasis_vitiligo", label: "Psoriasis / Vitiligo", label_en: "Psoriasis or Vitiligo", label_bn: "সোরিয়াসিস বা শ্বেতী" },
      { value: "sle_lupus", label: "Systemic Lupus (SLE)", label_en: "SLE", label_bn: "লুপাস (এসএলই)" },
      { value: "ankylosing_spondylitis", label: "Ankylosing Spondylitis", label_en: "Ankylosing Spondylitis", label_bn: "অ্যাঙ্কাইলোজিং স্পন্ডিলাইটিস" }
    ],
    clinicalTags: ["autoimmune_diagnosis"]
  },

  // ── 7. ENDOCRINE & HORMONAL BALANCE ──────────────────────────────
  {
    id: "cold_intolerance_dry_skin",
    label: "Cold Intolerance & Dry Skin/Hair",
    label_en: "Do you feel excessively cold when others feel comfortable, with brittle nails or thinning hair?",
    label_bn: "অন্যদের তুলনায় আপনার কি অস্বাভাবিক বেশি শীত লাগে, ত্বক খসখসে বা চুল পড়ে যাচ্ছে?",
    domain: "endocrine_hormonal",
    answerType: "yesno",
    isHighValueScreening: true,
    clinicalTags: ["hypothyroid_pattern", "metabolic_sluggishness"]
  },
  {
    id: "menstrual_regularity_female",
    label: "Menstrual Cycle Regularity (Females)",
    label_en: "Is your menstrual cycle regular (24-35 days) or irregular / absent?",
    label_bn: "মাসিক চক্র কি নিয়মিত (২৪-৩৫ দিন পরপর) হয় নাকি অনিয়মিত/দেরিতে হয়?",
    domain: "endocrine_hormonal",
    answerType: "select",
    applicablePopulation: ["adult_standard", "adolescent"],
    options: [
      { value: "regular", label: "Regular (24-35 days)", label_en: "Regular monthly cycle", label_bn: "নিয়মিত (২৪-৩৫ দিন)" },
      { value: "irregular_delayed", label: "Irregular / delayed (>35 to 60 days)", label_en: "Irregular / Delayed cycles", label_bn: "অনিয়মিত বা দেরিতে (৩৫-৬০ দিন)" },
      { value: "amenorrhea_missing", label: "Missing >3 months or absent", label_en: "Absent >3 months", label_bn: "৩ মাসের বেশি সময় বন্ধ থাকা" },
      { value: "menopause_achieved", label: "Post-menopausal (>1 year without period)", label_en: "Post-menopausal", label_bn: "স্থায়ী মেনোপজ সম্পন্ন" }
    ],
    clinicalTags: ["menstrual_cycle", "pcos_suspect"]
  },
  {
    id: "excess_facial_hair_acne",
    label: "Hirsutism / Persistent Adult Acne",
    label_en: "Females: Do you have excess coarse facial hair (chin/upper lip) or severe cystic acne?",
    label_bn: "মহিলাদের ক্ষেত্রে: চিবুক বা ঠোঁটের ওপর অস্বাভাবিক লোম অথবা তীব্র সিস্টিক ব্রণ আছে কি?",
    domain: "endocrine_hormonal",
    answerType: "yesno",
    applicablePopulation: ["adult_standard", "adolescent"],
    clinicalTags: ["androgen_excess", "pcos_marker"]
  },

  // ── 8. HEPATIC & BIOTRANSFORMATION ───────────────────────────────
  {
    id: "chemical_perfume_sensitivity",
    label: "Chemical, Perfume & Odor Sensitivity",
    label_en: "Do perfumes, vehicle exhaust, or chemical sprays easily trigger headaches or nausea?",
    label_bn: "সুগন্ধি, গাড়ির ধোঁয়া বা কীটনাশকের গন্ধে কি সহজেই মাথাব্যথা বা বমি বমি ভাব হয়?",
    domain: "hepatic_biotransformation",
    answerType: "yesno",
    clinicalTags: ["biotransformation_sensitivity", "chemical_intolerance"]
  },
  {
    id: "alcohol_caffeine_tolerance",
    label: "Caffeine & Stimulant Metabolism",
    label_en: "Does a small cup of tea/coffee late in the day cause palpitations, anxiety, or insomnia?",
    label_bn: "বিকেল বা সন্ধ্যায় চা/কফি খেলে কি বুক ধড়ফড়, উদ্বেগ বা রাতে একদম ঘুম না হওয়ার সমস্যা হয়?",
    domain: "hepatic_biotransformation",
    answerType: "select",
    options: [
      { value: "normal_tolerance", label: "Normal tolerance", label_en: "Tolerates normally", label_bn: "স্বাভাবিক সহ্যক্ষমতা" },
      { value: "sensitive_palpitations", label: "Very sensitive (causes jitters/insomnia)", label_en: "Very slow metabolizer", label_bn: "অতিরিক্ত সংবেদনশীল (বুক ধড়ফড় ও অনিদ্রা)" },
      { value: "never_consumes", label: "Never consumes caffeinated beverages", label_en: "Does not consume", label_bn: "চা বা কফি পান করি না" }
    ],
    clinicalTags: ["caffeine_clearance", "cyp1a2_metabolism"]
  },
  {
    id: "fatty_food_nausea_gallbladder",
    label: "Nausea After Fatty / Oily Meals",
    label_en: "Do fatty foods or rich biryani cause right upper quadrant fullness, burping, or nausea?",
    label_bn: "তৈলাক্ত বা চর্বিযুক্ত খাবার (যেমন কাচ্চি/বিরিয়ানি) খাওয়ার পর পেটের ডানপাশে ভারী লাগা বা বমি ভাব হয় কি?",
    domain: "hepatic_biotransformation",
    answerType: "yesno",
    clinicalTags: ["biliary_stasis", "fat_malabsorption"]
  },

  // ── 9. MITOCHONDRIAL & ENERGY FUNCTION ───────────────────────────
  {
    id: "chronic_fatigue_pattern",
    label: "Daytime Fatigue Severity",
    label_en: "How would you rate your overall daily energy and physical vitality?",
    label_bn: "সারাদিনের শারীরিক ক্লান্তি ও কর্মক্ষমতার মাত্রা কেমন?",
    domain: "mitochondrial_energy",
    answerType: "select",
    isHighValueScreening: true,
    options: [
      { value: "high_energy", label: "High / Vibrant (Energy 8-10/10)", label_en: "High & Vibrant", label_bn: "উচ্চ ও সতেজ (৮-১০/১০)" },
      { value: "moderate_fluctuating", label: "Moderate with afternoon dips (5-7/10)", label_en: "Moderate, afternoon dips", label_bn: "মাঝারি, দুপুরে ক্লান্তি নামে (৫-৭/১০)" },
      { value: "severe_exhaustion", label: "Persistent exhaustion even after waking (1-4/10)", label_en: "Severe chronic exhaustion", label_bn: "তীব্র অবসাদ, ঘুমানোর পরও ক্লান্তি কাটে না (১-৪/১০)" }
    ],
    clinicalTags: ["fatigue", "mitochondrial_burnout"]
  },
  {
    id: "exercise_recovery_capacity",
    label: "Post-Exertional Recovery",
    label_en: "How do you feel for 24 hours after moderate physical exertion or walking?",
    label_bn: "হাঁটাহাঁটি বা শারীরিক পরিশ্রম করার পরদিন শরীর কেমন লাগে?",
    domain: "mitochondrial_energy",
    answerType: "select",
    options: [
      { value: "energized_refreshed", label: "Refreshed and energized", label_en: "Refreshed & good recovery", label_bn: "সতেজ ও ঝরঝরে বোধ হয়" },
      { value: "delayed_soreness", label: "Normal muscle soreness", label_en: "Typical mild soreness", label_bn: "স্বাভাবিক মাংসপেশির ক্লান্তি" },
      { value: "drained_for_days", label: "Completely wiped out for 1-2 days", label_en: "Crashing exhaustion for days", label_bn: "১-২ দিন শরীর একদম ভেঙে পড়ে ও বিছানায় থাকতে হয়" }
    ],
    clinicalTags: ["post_exertional_malaise"]
  },

  // ── 10. SLEEP & CIRCADIAN RHYTHM ─────────────────────────────────
  {
    id: "sleep_duration_hours",
    label: "Average Nightly Sleep",
    label_en: "How many hours of actual sleep do you get on average per night?",
    label_bn: "প্রতি রাতে গড়ে কত ঘণ্টা নিশ্ছিদ্র ঘুম হয়?",
    domain: "sleep_circadian",
    answerType: "number",
    unit: "hours",
    isHighValueScreening: true,
    clinicalTags: ["sleep_hours", "sleep_restriction"]
  },
  {
    id: "sleep_quality_and_awakenings",
    label: "Sleep Disruption & Awakenings",
    label_en: "Do you wake up multiple times during the night or have difficulty falling asleep?",
    label_bn: "রাতে ঘন ঘন ঘুম ভেঙে যায় অথবা ঘুম আসতে ১ ঘণ্টার বেশি সময় লাগে কি?",
    domain: "sleep_circadian",
    answerType: "select",
    options: [
      { value: "sound_uninterrupted", label: "Sound sleep, falls asleep within 20 mins", label_en: "Sound sleep", label_bn: "গভীর ঘুম, ২০ মিনিটের মধ্যে ঘুমিয়ে পড়ি" },
      { value: "sleep_onset_delay", label: "Takes >45 mins to fall asleep (racing mind)", label_en: "Sleep latency >45 mins", label_bn: "ঘুম আসতে অনেক দেরি হয় (মাথায় চিন্তা ঘুরপাক খায়)" },
      { value: "nocturnal_awakenings", label: "Wakes at 2-4 AM and cannot get back to sleep", label_en: "Wakes 2-4 AM with difficulty", label_bn: "রাত ২টা থেকে ৪টার মধ্যে ঘুম ভাঙে এবং আর ঘুম আসে না" },
      { value: "sleep_apnea_snoring", label: "Loud snoring, choking, or gasping during sleep", label_en: "Loud snoring / gasping", label_bn: "বিকট নাক ডাকা বা ঘুমের মধ্যে দম বন্ধ হয়ে চমকে ওঠা" }
    ],
    clinicalTags: ["sleep_fragmentation", "circadian_disruption"]
  },
  {
    id: "screen_use_before_bed",
    label: "Late-Night Screen Exposure",
    label_en: "Do you use smartphones/tablets in bed in the dark within 1 hour of sleep?",
    label_bn: "ঘুমানোর পূর্বে অন্ধকারে বিছানায় শুয়ে স্মার্টফোন বা ল্যাপটপের উজ্জ্বল স্ক্রিন ব্যবহার করেন কি?",
    domain: "sleep_circadian",
    answerType: "yesno",
    clinicalTags: ["blue_light_exposure", "melatonin_suppression"]
  },

  // ── 11. STRESS & NEUROBEHAVIORAL FUNCTION ────────────────────────
  {
    id: "perceived_stress_level",
    label: "Perceived Daily Stress Burden",
    label_en: "How would you rate your ongoing daily mental/emotional stress level?",
    label_bn: "আপনার বর্তমান মানসিক চাপ বা উদ্বেগের মাত্রা কেমন?",
    domain: "stress_neurobehavioral",
    answerType: "select",
    isHighValueScreening: true,
    options: [
      { value: "low_manageable", label: "Low / Well managed", label_en: "Low / Managed", label_bn: "কম / সহজে নিয়ন্ত্রণযোগ্য" },
      { value: "moderate_daily", label: "Moderate routine work/family stress", label_en: "Moderate daily stress", label_bn: "মাঝারি পারিবারিক বা কর্মক্ষেত্রের চাপ" },
      { value: "high_overwhelming", label: "Severe / Constantly overwhelmed & anxious", label_en: "Severe / Chronic overwhelm", label_bn: "তীব্র উদ্বেগ, দুশ্চিন্তা ও অস্থিরতা" }
    ],
    clinicalTags: ["stress_burden", "hpa_axis_activation"]
  },
  {
    id: "stress_eating_pattern",
    label: "Stress-Induced / Emotional Eating",
    label_en: "Do you find yourself eating snacks, sweets, or fast food when stressed or sad?",
    label_bn: "মানসিক চাপ, রাগ বা একাকিত্বের সময় কি অতিরিক্ত খাওয়া বা মিষ্টি খোঁজার প্রবণতা হয়?",
    domain: "stress_neurobehavioral",
    answerType: "yesno",
    clinicalTags: ["emotional_eating"]
  },
  {
    id: "brain_fog_poor_concentration",
    label: "Brain Fog & Poor Memory",
    label_en: "Do you experience mental fog, forgetfulness, or difficulty concentrating on work?",
    label_bn: "মাথা ঘোলাটে লাগা (ব্রেন ফগ), মনোযোগ ধরে রাখতে কষ্ট বা ভুলে যাওয়ার প্রবণতা আছে কি?",
    domain: "stress_neurobehavioral",
    answerType: "yesno",
    clinicalTags: ["brain_fog", "neuroinflammation_indicator"]
  },

  // ── 12. DIETARY & NUTRITIONAL ASSESSMENT ─────────────────────────
  {
    id: "daily_vegetable_intake_servings",
    label: "Daily Vegetable & Greens Consumption",
    label_en: "How many palm-sized servings of fresh cooked vegetables or leafy greens (shak) daily?",
    label_bn: "প্রতিদিন গড়ে কত বাটি তাজা শাকসবজি খান?",
    domain: "dietary_nutrition",
    answerType: "select",
    isHighValueScreening: true,
    options: [
      { value: "rare_less_than_1", label: "< 1 serving per day", label_en: "< 1 serving/day", label_bn: "১ বাটিরও কম" },
      { value: "one_to_two", label: "1 to 2 servings daily", label_en: "1-2 servings/day", label_bn: "১ থেকে ২ বাটি" },
      { value: "three_or_more", label: "3 or more servings daily (Optimal)", label_en: "3+ servings/day", label_bn: "৩ বা ততোধিক বাটি (আদর্শ)" }
    ],
    clinicalTags: ["fiber_intake", "vegetable_adequacy"]
  },
  {
    id: "daily_protein_food_frequency",
    label: "Protein Food Ingestion Frequency",
    label_en: "How many meals per day contain a dedicated palm-sized protein source (fish, egg, chicken, dal)?",
    label_bn: "দিনে কয়টি খাবারে পর্যাপ্ত প্রোটিন (মাছ, ডিম, দেশি মুরগি বা ডাল) থাকে?",
    domain: "dietary_nutrition",
    answerType: "select",
    isHighValueScreening: true,
    options: [
      { value: "less_than_one", label: "Less than 1 meal with protein", label_en: "< 1 meal with protein", label_bn: "১ বেলারও কম (প্রধানত ভাত/রুটি নির্ভর)" },
      { value: "one_meal", label: "Only 1 meal (usually dinner)", label_en: "1 meal daily", label_bn: "দিনে মাত্র ১ বার" },
      { value: "two_meals", label: "2 meals containing protein", label_en: "2 meals daily", label_bn: "দিনে ২ বার" },
      { value: "every_meal_3_plus", label: "Every main meal (3x daily - Optimal)", label_en: "All 3 main meals", label_bn: "প্রতিটি মূল খাবারে (দিনে ৩ বার - আদর্শ)" }
    ],
    clinicalTags: ["protein_adequacy"]
  },
  {
    id: "cooking_oil_type_used",
    label: "Primary Cooking Oil at Home",
    label_en: "What primary cooking fat or oil is used in your household cooking?",
    label_bn: "বাড়ির দৈনন্দিন রান্নায় প্রধানত কোন তেল ব্যবহৃত হয়?",
    domain: "dietary_nutrition",
    answerType: "select",
    options: [
      { value: "refined_soybean_oil", label: "Refined Soybean Oil (commercial bottle)", label_en: "Refined Soybean Oil", label_bn: "বাণিজ্যিক পরিশোধিত সয়াবিন তেল" },
      { value: "palm_oil_loose", label: "Loose / Super Palm Oil", label_en: "Loose Palm Oil", label_bn: "খোলা বা পাম অয়েল" },
      { value: "pure_mustard_oil", label: "Cold-pressed / Ghani Mustard Oil (Kachi Ghani)", label_en: "Cold-pressed Mustard Oil", label_bn: "ঘানির খাঁটি সরিষার তেল" },
      { value: "rice_bran_oil", label: "Rice Bran Oil", label_en: "Rice Bran Oil", label_bn: "রাইস ব্রান অয়েল" },
      { value: "pure_ghee_coconut", label: "Pure Desi Cow Ghee / Virgin Coconut Oil", label_en: "Desi Ghee / Virgin Coconut Oil", label_bn: "খাঁটি গাওয়া ঘি বা নারকেল তেল" }
    ],
    clinicalTags: ["dietary_fats", "omega6_omega3_ratio"]
  },
  {
    id: "daily_fluid_water_liters",
    label: "Daily Pure Water Intake",
    label_en: "How many liters of pure drinking water do you consume each day?",
    label_bn: "প্রতিদিন গড়ে কত লিটার বিশুদ্ধ খাবার পানি পান করেন?",
    domain: "dietary_nutrition",
    answerType: "select",
    options: [
      { value: "less_than_1_liter", label: "< 1 Liter (Severely low)", label_en: "< 1 Liter", label_bn: "১ লিটারের কম (মারাত্মক কম)" },
      { value: "one_to_two_liters", label: "1.0 - 2.0 Liters", label_en: "1.0 - 2.0 Liters", label_bn: "১.০ থেকে ২.০ লিটার" },
      { value: "two_to_three_liters", label: "2.0 - 3.0 Liters (Optimal)", label_en: "2.0 - 3.0 Liters", label_bn: "২.০ থেকে ৩.০ লিটার (আদর্শ)" },
      { value: "over_3_liters", label: "> 3 Liters", label_en: "> 3 Liters", label_bn: "৩ লিটারের বেশি" }
    ],
    clinicalTags: ["hydration_status"]
  },

  // ── 13. MEDICATIONS, SUPPLEMENTS & ALLERGIES ─────────────────────
  {
    id: "regular_nsaid_painkiller_use",
    label: "Frequent Painkiller / NSAID Intake",
    label_en: "Do you take pain medications (Naproxen, Ibuprofen, Diclofenac) regularly for headache or joint pain?",
    label_bn: "মাথাব্যথা বা শরীর ব্যথার জন্য কি নিয়মিত পেইনকিলার (ন্যাপরোক্সেন, ডাইক্লোফেনাক ইত্যাদি) খান?",
    domain: "medication_supplements",
    answerType: "yesno",
    clinicalTags: ["nsaid_use", "gastric_mucosa_damage_risk"]
  },
  {
    id: "daily_ppi_antacid_dependence",
    label: "Daily PPI / Gastric Medicine Dependence",
    label_en: "Have you been taking daily acid-blocking medications (Omeprazole, Esomeprazole, Rabeprazole) for >3 months?",
    label_bn: "গত ৩ মাসের বেশি সময় ধরে কি প্রতিদিন গ্যাস্ট্রিকের ওষুধ (পিপিআই) সেবন করছেন?",
    domain: "medication_supplements",
    answerType: "yesno",
    isHighValueScreening: true,
    clinicalTags: ["ppi_dependence", "b12_magnesium_depletion_risk"]
  },
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

  // ── SPECIAL POPULATION MODULE: PREGNANCY & LACTATION ──────────────
  {
    id: "pregnancy_gestational_week",
    label: "Gestational Week (Pregnancy)",
    label_en: "Current week of pregnancy",
    label_bn: "গর্ভাবস্থার বর্তমান সপ্তাহ",
    domain: "clinical_history",
    subdomain: "pregnancy",
    answerType: "number",
    applicablePopulation: ["pregnancy"],
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
    options: [
      { value: "normal_growth", label: "Growing normally", label_en: "Normal growth curve", label_bn: "স্বাভাবিক বৃদ্ধি হচ্ছে" },
      { value: "underweight_stunting", label: "Underweight / Stunted growth concern", label_en: "Underweight concern", label_bn: "বয়সের তুলনায় কম ওজন বা কম উচ্চতা" },
      { value: "rapid_childhood_weight", label: "Accelerated rapid weight gain", label_en: "Accelerated weight gain", label_bn: "অস্বাভাবিক দ্রুত ওজন বৃদ্ধি" }
    ],
    clinicalTags: ["pediatric_growth"]
  }
];

export const questionnaireRegistry = {
  version: registryVersion,
  domains: ASSESSMENT_DOMAINS,
  core: coreQuestions,
};
