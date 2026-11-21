'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Compass,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Sparkles,
  Globe,
  Database,
  Cpu,
  Smartphone,
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
  FileText,
  AlertTriangle,
  Award,
  Calendar,
  Activity,
  HeartHandshake
} from 'lucide-react';

interface PhaseItem {
  id: string;
  name_en: string;
  name_bn: string;
  status: 'COMPLETED' | 'READY' | 'PLANNED' | 'DEFERRED';
  category: 'core' | 'intelligence' | 'practice' | 'future';
  features: string[];
  benchmark: string;
  deliverables_en: string;
  deliverables_bn: string;
  acceptanceCriteria_en: string;
  acceptanceCriteria_bn: string;
}

interface UniqueFeature {
  id: string;
  name_en: string;
  name_bn: string;
  phase: string;
  benchmark: string;
  status: 'IMPLEMENTED' | 'PARTIALLY IMPLEMENTED' | 'PLANNED' | 'FUTURE / DEFERRED';
  summary_en: string;
  summary_bn: string;
  safety_en: string;
  safety_bn: string;
  tags: string[];
}

export default function RoadmapPage() {
  const [language, setLanguage] = useState<'bn' | 'en'>('en');
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'core' | 'intelligence' | 'practice' | 'future'>('all');
  const [featureSearch, setFeatureSearch] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<UniqueFeature | null>(null);

  const bn = language === 'bn';

  // ── 16 Roadmap Phases (R0 – R15) ─────────────────────────────────
  const phases: PhaseItem[] = [
    {
      id: 'R0',
      name_en: 'Master Architecture & Feature Contracts',
      name_bn: 'মাস্টার আর্কিটেকচার ও ফিচার কন্ট্রাক্টস',
      status: 'COMPLETED',
      category: 'core',
      features: ['F01', 'F02', 'F03', 'F04', 'F05', 'F06', 'F07', 'F08'],
      benchmark: 'ISO/IEC 25010 Clinical Standard',
      deliverables_en: '10 Master Blueprint Documents, Public Roadmap Route, Playwright Browser Verification Suites.',
      deliverables_bn: '১০টি মাস্টার আর্কিটেকচার ডকুমেন্ট, পাবলিক রোডম্যাপ রুট, ব্রাউজার ই২ই টেস্ট স্যুটের পূর্ণ ভেরিফিকেশন।',
      acceptanceCriteria_en: '100% test pass rate across 164 assertions; static export exit 0; zero regressions.',
      acceptanceCriteria_bn: '১৬৪টি ব্রাউজার টেস্টের শতভাগ পাস; স্ট্যাটিক এক্সপোর্ট ত্রুটিমুক্ত; ক্লিনিক্যাল ইঞ্জিনে শূন্য রিগ্রেশন।'
    },
    {
      id: 'R1',
      name_en: 'Dual Report & PDF Studio',
      name_bn: 'ডুয়েল রিপোর্ট ও পিডিএফ স্টুডিও',
      status: 'READY',
      category: 'core',
      features: ['U20', 'U21'],
      benchmark: 'That Clean Life / Clinical Psychology Standard',
      deliverables_en: 'Strict Clinician vs Patient report projections; absolute zero calories/macros in patient export.',
      deliverables_bn: 'ক্লিনিশিয়ান ও রোগীর সম্পূর্ণ পৃথক রিপোর্ট; রোগীর প্রেসক্রিপশনে ক্যালোরি ও ম্যাক্রো শতভাগ অনুপস্থিত।',
      acceptanceCriteria_en: 'String search for "kcal" or "protein g" in patient PDF export payload yields 0 matches.',
      acceptanceCriteria_bn: 'রোগীর রিপোর্ট ও পিডিএফে "kcal" বা "protein" সংক্রান্ত সার্চে শূন্য ফলাফল নিশ্চিতকরণ।'
    },
    {
      id: 'R2',
      name_en: 'Secure Backend, Auth, DB & Storage',
      name_bn: 'সিকিউর ব্যাকএন্ড, অথেন্টিকেশন ও ডাটাবেজ',
      status: 'PLANNED',
      category: 'core',
      features: ['U18'],
      benchmark: 'PostgreSQL / Supabase / HIPAA RLS',
      deliverables_en: 'PostgreSQL relational cluster, Row-Level Security, 21 CFR Part 11 immutable audit logging.',
      deliverables_bn: 'পোস্টগ্রেসকিউএল রিলেশনাল ক্লাস্টার, রো-লেভেল সিকিউরিটি, অপরিবর্তনীয় অডিট লগિંગ সিস্টেম।',
      acceptanceCriteria_en: 'Cross-tenant data access blocked by RLS policies; automated localStorage migration verification.',
      acceptanceCriteria_bn: 'আরএলএস পলিসি দ্বারা ক্লিনিকভিত্তিক ডাটা সুরক্ষা; লোকাল স্টোরেজ থেকে স্বয়ংক্রিয় মাইগ্রেশন।'
    },
    {
      id: 'R3',
      name_en: 'Patient Self-Assessment Portal',
      name_bn: 'রোগীর নিজস্ব মূল্যায়ন ও ওয়েব পোর্টাল',
      status: 'PLANNED',
      category: 'core',
      features: ['U19'],
      benchmark: 'Practice Better / OptiMantra',
      deliverables_en: 'Tokenized patient remote intake links, isolated submission staging queue, clinician review gate.',
      deliverables_bn: 'টোকেনযুক্ত রিমোট ইনটেক লিংক, পৃথক স্টেজড কিউ এবং ক্লিনিশিয়ান রিভিউ অনুমোদন গেট।',
      acceptanceCriteria_en: 'Patient submissions cannot alter active chart until clinician explicitly verifies and merges data.',
      acceptanceCriteria_bn: 'ক্লিনিশিয়ানের স্পষ্ট অনুমোদন ব্যতীত রোগীর সাবমিশন সক্রিয় ফাইলে যুক্ত হতে পারবে না।'
    },
    {
      id: 'R4',
      name_en: 'Lifestyle, Chronotherapy & Supplements',
      name_bn: 'লাইফস্টাইল, ক্রোনোথেরাপি ও সাপ্লিমেন্ট',
      status: 'PLANNED',
      category: 'core',
      features: ['U06'],
      benchmark: 'Cerbo / Circadian Chronobiology',
      deliverables_en: '24-hour visual chronotherapy schedule, nutrient absorption spacing, sleep hygiene rules.',
      deliverables_bn: '২৪ ঘণ্টার ভিজ্যুয়াল ক্রোনোথেরাপি শিডিউল, পুষ্টি শোষণের সময় ব্যবধান ও ঘুম সুরক্ষার নিয়ম।',
      acceptanceCriteria_en: 'Enforces mandatory 2h gap between calcium/iron minerals and thyroid medications.',
      acceptanceCriteria_bn: 'ক্যালসিয়াম/আয়রন এবং থাইরয়েড ওষুধের মধ্যে বাধ্যতামূলক ২ ঘণ্টার ব্যবধান নিশ্চিতকরণ।'
    },
    {
      id: 'R5',
      name_en: 'Master Prescription Composer',
      name_bn: 'মাস্টার প্রেসক্রিপশন কম্পোজার',
      status: 'PLANNED',
      category: 'core',
      features: ['U24'],
      benchmark: 'That Clean Life / Clinical Practice Standards',
      deliverables_en: 'Integrated composer orchestrating diet, lifestyle, hydration, supplements, and education handouts.',
      deliverables_bn: 'ডায়েট, জীবনযাত্রা, পানি, সাপ্লিমেন্ট ও রোগী শিক্ষামূলক নির্দেশিকার সমন্বিত প্রেসক্রিপশন হাব।',
      acceptanceCriteria_en: 'Generates single cohesive multi-part prescription dossier with unified clinician sign-off.',
      acceptanceCriteria_bn: 'একক সমন্বিত ফাইলে সকল ক্লিনিক্যাল কম্পোনেন্ট ডিজিটাল সাইন-অফ সহ অন্তর্ভুক্তকরণ।'
    },
    {
      id: 'R6',
      name_en: 'Advanced Functional Intelligence (P2)',
      name_bn: 'অ্যাডভান্সড ফাংশনাল ইন্টেলিজেন্স ও রুট-কজ',
      status: 'PLANNED',
      category: 'intelligence',
      features: ['U01', 'U02', 'U03', 'U04', 'U05'],
      benchmark: 'Etio / Biocanic / IFM Matrix',
      deliverables_en: 'Interactive root-cause node graph, multi-disease conflict matrix, disease sub-phenotype engine.',
      deliverables_bn: 'ইন্টারঅ্যাক্টিভ রুট-কজ নোড গ্রাফ, বহু-রোগের কনফ্লিক্ট সমাধান ম্যাট্রিক্স ও সাব-ফেনোটাইপ ইঞ্জিন।',
      acceptanceCriteria_en: 'Deterministically resolves multi-morbidity conflicts using RED > YELLOW > GREEN hierarchy.',
      acceptanceCriteria_bn: 'লাল > হলুদ > সবুজ অগ্রাধিকার নীতির মাধ্যমে জটিল রোগের খাদ্য দ্বন্দ্ব সমাধান।'
    },
    {
      id: 'R7',
      name_en: 'Advanced Labs, DNI & Supplements',
      name_bn: 'উন্নত ল্যাব, ওষুধের মিথস্ক্রিয়া ও সাপ্লিমেন্ট',
      status: 'PLANNED',
      category: 'intelligence',
      features: ['U07'],
      benchmark: 'Biocanic / DGDA Pharmacopeia',
      deliverables_en: 'Functional biomarker pattern analyzer (TG/HDL, HOMA-IR), 32k DGDA brand depletions.',
      deliverables_bn: 'ফাংশনাল বায়োমার্কার অ্যানালাইজার এবং ৩২ হাজার বাংলাদেশি ওষুধের পুষ্টি ঘাটতি নির্ণয়।',
      acceptanceCriteria_en: 'TG/HDL ratio >3.0 triggers subclinical functional insulin resistance warning.',
      acceptanceCriteria_bn: 'ট্রাইগ্লিসারাইড/এইচডিএল অনুপাত ৩.০ এর বেশি হলে প্রাথমিক সতর্কবার্তা প্রদর্শন।'
    },
    {
      id: 'R8',
      name_en: 'Food, Nutrient & Recipe Knowledge Base',
      name_bn: 'খাদ্য, পুষ্টি উপাদান ও রেসিপি নলেজ বেস',
      status: 'PLANNED',
      category: 'intelligence',
      features: ['U08', 'U11'],
      benchmark: 'Nutrium / FAO INFOODS FCTB V6',
      deliverables_en: 'Nutrient-to-Mechanism matrix, 1-click intelligent food substitution engine with macro parity.',
      deliverables_bn: 'পুষ্টি উপাদান বনাম বায়োলজিক্যাল মেকানিজম ম্যাট্রিক্স ও সমমান পুষ্টির স্বয়ংক্রিয় খাদ্য বদল।',
      acceptanceCriteria_en: 'Candidate substitutions match target item within ±10% macro variance and zero contraindications.',
      acceptanceCriteria_bn: 'বিকল্প খাদ্য নির্বাচনে ম্যাক্রো পুষ্টির ব্যবধান অনূর্ধ্ব ±১০% এবং কোনো অ্যালার্জি দ্বন্দ্ব না থাকা।'
    },
    {
      id: 'R9',
      name_en: 'Precision Diet, Budget & Family Kitchen',
      name_bn: 'সাশ্রয়ী খাদ্য অপ্টিমাইজেশন ও পারিবারিক রান্না',
      status: 'PLANNED',
      category: 'intelligence',
      features: ['U09', 'U10', 'U12', 'U13'],
      benchmark: 'Proprietary Bangladesh Context',
      deliverables_en: 'BDT daily cost tier optimizer, joint family kitchen core dish + patient modification guidance.',
      deliverables_bn: 'টাকা/দিন খরচের সাশ্রয়ী খাদ্য তালিকা, যৌথ পরিবারের একই হাঁড়িতে রোগীর উপযোগী রান্নার নির্দেশিকা।',
      acceptanceCriteria_en: 'Swapping imported ingredients for local superfoods cuts cost >50% while preserving bioactives.',
      acceptanceCriteria_bn: 'বিদেশি পণ্যের বদলে দেশীয় খাদ্য নির্বাচনে ৫০% খরচ হ্রাস ও পুষ্টির মান অক্ষুণ্ণ রাখা।'
    },
    {
      id: 'R10',
      name_en: 'Longitudinal Follow-up & Outcomes',
      name_bn: 'দীর্ঘমেয়াদী ফলো-আপ ও থেরাপিউটিক ফেজ',
      status: 'PLANNED',
      category: 'practice',
      features: ['U15', 'U16', 'U17', 'U22'],
      benchmark: 'Cronometer Pro / Practice Better',
      deliverables_en: 'Therapeutic phase progression manager, N-of-1 elimination tracker, adaptive 5-minute follow-ups.',
      deliverables_bn: 'চিকিৎসার পর্যায়ক্রমিক অগ্রগতি ট্র্যাকার, খাদ্য সংবেদনশীলতা টেস্ট ও দ্রুত ফলো-আপ ইনটেক ফর্ম।',
      acceptanceCriteria_en: 'Advancing therapeutic phase dynamically recalculates permitted food exchanges and supplements.',
      acceptanceCriteria_bn: 'পরবর্তী ফেজে উত্তীর্ণ হওয়ার সাথে সাথে খাদ্যের অনুমতি ও সাপ্লিমেন্ট স্বয়ংক্রিয়ভাবে আপডেট হওয়া।'
    },
    {
      id: 'R11',
      name_en: 'Practice Management & Portal',
      name_bn: 'পুষ্টি প্র্যাকটিস ম্যানেজমেন্ট ও শেয়ারিং',
      status: 'PLANNED',
      category: 'practice',
      features: ['U25'],
      benchmark: 'Practice Better / Nutrium',
      deliverables_en: 'Multi-nutritionist organizational RBAC, protocol template marketplace, practice appointment calendar.',
      deliverables_bn: 'একাধিক পুষ্টিবিদের ভূমিকাভিত্তিক প্রবেশাধিকার, প্রোটোকল মার্কেটপ্লেস ও অ্যাপয়েন্টমেন্ট শিডিউলিং।',
      acceptanceCriteria_en: 'Allows clinical teams to safely share, clone, and customize evidence-based diet templates.',
      acceptanceCriteria_bn: 'ক্লিনিক্যাল টিমে যাচাইকৃত ডায়েট টেমপ্লেট নিরাপদে শেয়ার ও ক্লোন করার সুবিধা।'
    },
    {
      id: 'R12',
      name_en: 'Clinical Research & Outcomes Engine',
      name_bn: 'ক্লিনিক্যাল রিসার্চ ও আউটকাম অ্যানালিটিক্স',
      status: 'PLANNED',
      category: 'practice',
      features: ['U14', 'U23', 'U26'],
      benchmark: 'Biocanic Clinical Research / HIPAA Safe Harbor',
      deliverables_en: 'De-identified clinical outcome analytics, in-silico metabolic digital twin scenario models.',
      deliverables_bn: 'পরিচয়হীন ক্লিনিক্যাল গবেষণার তথ্য বিশ্লেষণ ও ডিজিটাল মেটাবলিক টুইন পূর্বাভাস মডেল।',
      acceptanceCriteria_en: 'Exports anonymized outcome datasets to standard statistical formats (CSV, R) with zero PHI.',
      acceptanceCriteria_bn: 'ব্যক্তিগত তথ্য ব্যতীত সম্পূর্ণ সুরক্ষিতভাবে গবেষণার জন্য পরিসংখ্যানমূলক ডাটা এক্সপোর্ট।'
    },
    {
      id: 'R13',
      name_en: 'Laboratory, Wearable & External APIs',
      name_bn: 'ডায়াগনস্টিক ল্যাব, ওয়্যারেবল ও এক্সটার্নাল এপিআই',
      status: 'PLANNED',
      category: 'practice',
      features: ['External Connectors'],
      benchmark: 'HL7 / FHIR Release 4 / Apple HealthKit',
      deliverables_en: 'FHIR DiagnosticReport bundle parsers, continuous glucose monitoring (CGM) telemetry ingestion.',
      deliverables_bn: 'এফএইচআইআর ল্যাব রিপোর্ট পার্সিং এবং সিজিএম গ্লুকোজ ডেটার সমন্বিত বিশ্লেষণ এপিআই।',
      acceptanceCriteria_en: 'Directly ingests and maps electronic lab bundles into normalized functional ranges.',
      acceptanceCriteria_bn: 'ল্যাব থেকে আগত ইলেকট্রনিক রিপোর্ট স্বয়ংক্রিয়ভাবে ফাংশনাল রেঞ্জে রূপান্তর।'
    },
    {
      id: 'R14',
      name_en: 'Future AI Intelligence Layer (DEFERRED)',
      name_bn: 'ভবিষ্যৎ কৃত্রিম বুদ্ধিমত্তা স্তর (স্থগিত)',
      status: 'DEFERRED',
      category: 'future',
      features: ['U27', 'U28', 'U29'],
      benchmark: 'Passio AI / Whisper Bengali / OpenEvidence',
      deliverables_en: 'Food photo portion estimation, colloquial Bengali voice logging, supervised literature copilot.',
      deliverables_bn: 'খাবারের ছবির মাধ্যমে পুষ্টির অনুমান, বাংলা ভয়েস ডায়েরি এবং সুপারভাইজড রিসার্চ অ্যাসিস্ট্যান্ট।',
      acceptanceCriteria_en: 'Strictly bounded to advisory drafts; zero autonomous record edits or unsupervised prescriptions.',
      acceptanceCriteria_bn: 'সম্পূর্ণরূপে খসড়া পরামর্শক হিসেবে কাজ করবে; পুষ্টিবিদের অনুমোদন ছাড়া কোনো প্রেসক্রিপশন কার্যকর নয়।'
    },
    {
      id: 'R15',
      name_en: 'Future Android/iOS Mobile Companion (DEFERRED)',
      name_bn: 'ভবিষ্যৎ অ্যান্ড্রয়েড ও আইওএস অ্যাপ (স্থগিত)',
      status: 'DEFERRED',
      category: 'future',
      features: ['U30'],
      benchmark: 'Apple Health / Nutrium Client App',
      deliverables_en: 'Dedicated native iOS & Android applications with offline SQLCipher, chronotherapy alerts, zero macros.',
      deliverables_bn: 'নেটিভ মোবাইল অ্যাপ, অফলাইন ডাটা স্টোরেজ, ক্রোনোথেরাপি নোটিফিকেশন (ক্যালোরি/ম্যাক্রো ব্যতীত)।',
      acceptanceCriteria_en: 'Patient mobile client enforces U21 (zero calories/macros displayed) with offline meal schedules.',
      acceptanceCriteria_bn: 'রোগীর মোবাইল অ্যাপে কোনো ক্যালোরি বা ম্যাক্রো সংখ্যা প্রদর্শিত হবে না; অফলাইনেও চলবে।'
    }
  ];

  // ── 30 Unique Features (U01 – U30) ────────────────────────────────
  const uniqueFeatures: UniqueFeature[] = [
    {
      id: 'U01',
      name_en: 'Functional Root-Cause Explorer',
      name_bn: 'ফাংশনাল রুট-কজ এক্সপ্লোরার',
      phase: 'R6',
      benchmark: 'Etio, Biocanic',
      status: 'PARTIALLY IMPLEMENTED',
      summary_en: 'Interactive graph tracing physical symptoms to cellular antecedents, triggers, and mediators.',
      summary_bn: 'শারীরিক লক্ষণ থেকে কোষীয় মেটাবলিক কারণ নির্ণয়ের ইন্টারঅ্যাক্টিভ নোড গ্রাফ।',
      safety_en: 'Clearly differentiates functional hypotheses from conventional pathology.',
      safety_bn: 'ফাংশনাল হাইপোথিসিসকে ডায়াগনস্টিক সিদ্ধান্ত থেকে স্পষ্ট আলাদা রাখে।',
      tags: ['root-cause', 'systems-biology', 'matrix']
    },
    {
      id: 'U02',
      name_en: 'Disease-Mechanism Knowledge Graph',
      name_bn: 'রোগ ও বায়োলজিক্যাল মেকানিজম গ্রাফ',
      phase: 'R6',
      benchmark: 'Etio, Reactome',
      status: 'PARTIALLY IMPLEMENTED',
      summary_en: 'Structured biomedical graph linking 21 conditions to 50+ inflammatory and metabolic mechanisms.',
      summary_bn: '২১টি ক্লিনিক্যাল কন্ডিশন ও ৫০+ মেকানিজমের সমন্বিত বায়োমেডিক্যাল গ্রাফ।',
      safety_en: 'Grounded exclusively in peer-reviewed pathophysiology literature.',
      safety_bn: 'যাচাইকৃত ক্লিনিক্যাল লিটারেচারের রেফারেন্স ভিত্তিক।',
      tags: ['knowledge-graph', 'mechanisms', 'pathology']
    },
    {
      id: 'U03',
      name_en: 'Multi-Disease Conflict Resolver',
      name_bn: 'বহু-রোগের খাদ্য দ্বন্দ্ব সমাধান ইঞ্জিন',
      phase: 'R6',
      benchmark: 'Proprietary SHUDDHO Innovation',
      status: 'IMPLEMENTED',
      summary_en: 'Arbitrates contradictory dietary guidelines for comorbid patients (e.g. CKD 3b + Gout + T2D).',
      summary_bn: 'একাধিক রোগে আক্রান্ত রোগীর বিপরীতমুখী খাদ্য নিয়মের স্বয়ংক্রিয় দ্বন্দ্ব নিরসন।',
      safety_en: 'Strict hierarchy: Renal & Allergy Safety (RED) > Caution (YELLOW) > Benefit (GREEN).',
      safety_bn: 'কঠোর অগ্রাধিকার: কিডনি ও অ্যালার্জি সুরক্ষা (লাল) > সতর্কতা (হলুদ) > থেরাপিউটিক (সবুজ)।',
      tags: ['safety-engine', 'conflict-resolver', 'deterministic']
    },
    {
      id: 'U04',
      name_en: 'Clinical Evidence Passport',
      name_bn: 'ক্লিনিক্যাল এভিডেন্স পাসপোর্ট',
      phase: 'R6',
      benchmark: 'Etio, UpToDate',
      status: 'PARTIALLY IMPLEMENTED',
      summary_en: 'Traceability drawer displaying PubMed PMIDs, study designs, and evidence tiers for every rule.',
      summary_bn: 'প্রতিটি ক্লিনিক্যাল বিধির পেছনে পাবমেড রেফারেন্স ও গবেষণার মান যাচাইকরণ।',
      safety_en: 'Identifies emerging evidence distinctly from established clinical standards.',
      safety_bn: 'প্রাথমিক গবেষণাকে চূড়ান্ত নির্দেশিকা থেকে স্পষ্ট আলাদা হিসেবে নির্দেশ করে।',
      tags: ['evidence', 'pubmed', 'traceability']
    },
    {
      id: 'U05',
      name_en: 'Disease Stage & Phenotype Engine',
      name_bn: 'রোগের পর্যায় ও সাব-ফেনোটাইপ ইঞ্জিন',
      phase: 'R6',
      benchmark: 'Biocanic, KDIGO Guidelines',
      status: 'IMPLEMENTED',
      summary_en: 'Calibrates macronutrient targets based on staging (e.g. CKD 1-2 vs 3b vs 5; T2D vs LADA).',
      summary_bn: 'রোগের বিভিন্ন ধাপ অনুযায়ী প্রোটিন ও পুষ্টির সীমা স্বয়ংক্রিয়ভাবে নিয়ন্ত্রণ (যেমন: কিডনি ধাপ ৩বি)।',
      safety_en: 'Prevents dangerous protein/potassium overprescription in advanced organ impairment.',
      safety_bn: 'উন্নত কিডনি বা লিভারের জটিলতায় অতিরিক্ত প্রোটিন/পটাশিয়ামের ঝুঁকি রোধ।',
      tags: ['staging', 'ckd', 'phenotyping']
    },
    {
      id: 'U06',
      name_en: 'Medication-Supplement-Meal Timeline',
      name_bn: 'ওষুধ, সাপ্লিমেন্ট ও খাবারের ২৪ ঘণ্টা ক্রোনোথেরাপি',
      phase: 'R4',
      benchmark: 'Cerbo, Chrono-nutrition',
      status: 'IMPLEMENTED',
      summary_en: 'Visual 24h schedule preventing absorption competition and drug-nutrient depletions.',
      summary_bn: 'ওষুধ ও খাবারের সঠিক সময়ের ২৪ ঘণ্টার চার্ট যাতে পুষ্টির শোষণ ব্যাহত না হয়।',
      safety_en: 'Enforces mandatory 2h gap between calcium/iron minerals and thyroid medications.',
      safety_bn: 'থাইরয়েড ওষুধের সাথে ক্যালসিয়াম বা আয়রনের ২ ঘণ্টার ব্যবধান বাধ্যতামূলক করা।',
      tags: ['chronotherapy', 'dni', 'medication-timing']
    },
    {
      id: 'U07',
      name_en: 'Functional Biomarker Pattern Intelligence',
      name_bn: 'ফাংশনাল বায়োমার্কার প্যাটার্ন বিশ্লেষণ',
      phase: 'R7',
      benchmark: 'Biocanic, Etio',
      status: 'IMPLEMENTED',
      summary_en: 'Calculates optimal functional zones and multi-marker ratios (TG/HDL, HOMA-IR, De Ritis).',
      summary_bn: 'ল্যাব টেস্টের মান থেকে মেটাবলিক প্যাটার্ন ও কার্যকরী অনুপাত নির্ণয়।',
      safety_en: 'Emphasizes that functional ranges are for nutritional optimization, not formal pathology diagnosis.',
      safety_bn: 'ফাংশনাল রেঞ্জ পুষ্টির মানোন্নয়নের জন্য, প্যাথলজিক্যাল ডায়াগনোসিসের জন্য নয়।',
      tags: ['biomarkers', 'labs', 'homa-ir']
    },
    {
      id: 'U08',
      name_en: 'Nutrient-Mechanism-Food Mapping',
      name_bn: 'পুষ্টি, মেকানিজম ও দেশীয় খাদ্যের ম্যাপিং',
      phase: 'R8',
      benchmark: 'That Clean Life, Nutrium',
      status: 'PARTIALLY IMPLEMENTED',
      summary_en: 'Bidirectional matrix connecting bioactives (e.g. Sulforaphane, Curcumin) to local whole foods.',
      summary_bn: 'থেরাপিউটিক পুষ্টি উপাদানের সাথে দেশীয় পরিচিত খাবারের সমন্বিত ডাটাবেজ।',
      safety_en: 'Suppresses candidate foods contraindicated by active patient conditions.',
      safety_bn: 'রোগীর অ্যালার্জি বা নিষিদ্ধ খাদ্য তালিকা থেকে স্বয়ংক্রিয়ভাবে বাদ দেওয়া।',
      tags: ['whole-foods', 'bioactives', 'nutrition']
    },
    {
      id: 'U09',
      name_en: 'Bangladesh Affordability Optimizer',
      name_bn: 'বাংলাদেশ পুষ্টি সাশ্রয় অপ্টিমাইজার',
      phase: 'R9',
      benchmark: 'Proprietary Bangladesh Context',
      status: 'PLANNED',
      summary_en: 'Substitutes expensive imported health foods with nutrient-dense, low-cost native alternatives in BDT.',
      summary_bn: 'বিদেশি দামি খাবারের বদলে সমমানের পুষ্টিকর ও সাশ্রয়ী দেশীয় খাবার নির্বাচন (টাকা/দিন)।',
      safety_en: 'Ensures affordable swaps maintain complete protein and mineral adequacy.',
      safety_bn: 'সাশ্রয়ী পরিবর্তনে প্রোটিন ও প্রয়োজনীয় মিনারেলের মান কোনোভাবেই ক্ষুণ্ণ না হওয়া।',
      tags: ['affordability', 'bdt-cost', 'bangladesh-first']
    },
    {
      id: 'U10',
      name_en: 'Family Kitchen Optimizer',
      name_bn: 'পারিবারিক রান্নার দ্বৈত নির্দেশিকা',
      phase: 'R9',
      benchmark: 'That Clean Life (Joint Family Adaptation)',
      status: 'PLANNED',
      summary_en: 'Generates single household core recipe with patient-specific extraction and seasoning instructions.',
      summary_bn: 'একই রান্নায় পুরো পরিবারের জন্য সাধারণ খাবার এবং রোগীর বিশেষ অংশের স্পষ্ট নির্দেশনা।',
      safety_en: 'Eliminates cross-contamination for severe allergies and renal sodium bounds.',
      safety_bn: 'তীব্র অ্যালার্জি এবং কিডনি রোগীর লবণের মাত্রায় ভুল এড়াতে সাহায্য করে।',
      tags: ['family-kitchen', 'recipes', 'portioning']
    },
    {
      id: 'U11',
      name_en: 'Intelligent Food Substitution Engine',
      name_bn: 'বুদ্ধিমান খাদ্য বিকল্প ইঞ্জিন',
      phase: 'R8',
      benchmark: 'Nutrium, That Clean Life',
      status: 'IMPLEMENTED',
      summary_en: '1-click alternative selector matching macronutrient density, glycemic index, and safety tags.',
      summary_bn: 'এক ক্লিকে সমমানের পুষ্টি ও ক্যালোরির নিরাপদ বিকল্প খাদ্য নির্বাচন।',
      safety_en: 'Instantly filters out any item marked RED in the active patient conflict matrix.',
      safety_bn: 'রোগীর জন্য লাল চিহ্নিত কোনো ক্ষতিকর খাবার কখনোই বিকল্প হিসেবে আসবে না।',
      tags: ['food-swaps', 'alternatives', 'macro-parity']
    },
    {
      id: 'U12',
      name_en: 'Smart Grocery & Bazaar Planner',
      name_bn: 'স্মার্ট বাজার ও কাঁচাবাজার প্ল্যানার',
      phase: 'R9',
      benchmark: 'That Clean Life, Practice Better',
      status: 'PLANNED',
      summary_en: 'Consolidates 7-day plans into raw market purchase kg categorized by local bazaar departments.',
      summary_bn: 'সাপ্তাহিক খাবারের তালিকাকে কাঁচাবাজার, মাছের বাজার ও মুদি তালিকায় রূপান্তর।',
      safety_en: 'Applies accurate cooked-to-raw yield factors to avoid under-purchasing.',
      safety_bn: 'রান্নার পরের ওজনের সাথে কাঁচা বাজারের ওজনের সঠিক রূপান্তর নিশ্চিতকরণ।',
      tags: ['grocery-list', 'raw-weights', 'bazaar']
    },
    {
      id: 'U13',
      name_en: 'Nutrition What-If Simulator',
      name_bn: 'নিউট্রিশন "হোয়াট-ইফ" মেটাবলিক সিমুলেটর',
      phase: 'R9',
      benchmark: 'Cronometer Pro, Etio',
      status: 'PARTIALLY IMPLEMENTED',
      summary_en: 'Interactive sandbox previewing real-time glycemic load, PRAL, and BMR impacts of macro shifts.',
      summary_bn: 'খাদ্য পরিবর্তনের সাথে সাথে ক্যালোরি, গ্লাইসেমিক লোড ও কিডনি চাপের সম্ভাব্য পরিবর্তন প্রদর্শন।',
      safety_en: 'Clear visual banner marking simulation state as unapproved and non-clinical.',
      safety_bn: 'সিমুলেশন অবস্থাকে স্পষ্ট খসড়া হিসেবে নির্দেশ করে অননুমোদিত থাকা নিশ্চিতকরণ।',
      tags: ['simulator', 'sandbox', 'what-if']
    },
    {
      id: 'U14',
      name_en: 'Clinical Digital Twin Scenario Model',
      name_bn: 'ক্লিনিক্যাল ডিজিটাল টুইন মেটাবলিক মডেল',
      phase: 'R12',
      benchmark: 'Etio, Hall NIH Metabolic Model',
      status: 'PLANNED',
      summary_en: 'Models anticipated patient weight curve, lean mass retention, and metabolic adaptation over 12 weeks.',
      summary_bn: '১২ সপ্তাহের ওজন পরিবর্তন ও মেটাবলিক অ্যাডাপ্টেশনের গাণিতিক পূর্বাভাস মডেল।',
      safety_en: 'Prevents crash dieting projections by dampening weight loss over time.',
      safety_bn: 'মেটাবলিজম কমে যাওয়াকে হিসাব করে বাস্তবসম্মত ও স্বাস্থ্যকর ওজন হ্রাসের পরিকল্পনা।',
      tags: ['digital-twin', 'metabolism', 'research']
    },
    {
      id: 'U15',
      name_en: 'N-of-1 Nutrition Response Tracker',
      name_bn: 'এন-অফ-১ পারসোনালাইজড রেসপন্স ট্র্যাকার',
      phase: 'R10',
      benchmark: 'Biocanic, IFM Protocols',
      status: 'PLANNED',
      summary_en: 'Single-subject trial tracker analyzing biological response to deliberate food reintroductions.',
      summary_bn: 'নির্দিষ্ট খাবার বাদ দেওয়া ও পুনরায় খাওয়ার পর রোগীর শারীরিক লক্ষণের বৈজ্ঞানিক ট্র্যাকিং।',
      safety_en: 'Immediate protocol freeze if acute inflammatory flare or allergic response occurs.',
      safety_bn: 'অ্যালার্জি বা প্রদাহের লক্ষণ দেখা দিলে অবিলম্বে খাদ্য বন্ধ করার স্বয়ংক্রিয় নির্দেশ।',
      tags: ['n-of-1', 'elimination-diet', 'sensitivities']
    },
    {
      id: 'U16',
      name_en: 'Therapeutic Protocol Phase Manager',
      name_bn: 'থেরাপিউটিক প্রোটোকল ফেজ ম্যানেজার',
      phase: 'R10',
      benchmark: 'Biocanic, OptiMantra',
      status: 'IMPLEMENTED',
      summary_en: 'Manages multi-stage treatment progressions (Phase 1: Reset, Phase 2: Repair, Phase 3: Maintain).',
      summary_bn: 'চিকিৎসার ধাপভিত্তিক পরিচালনা (পর্যায় ১: নিয়ন্ত্রণ, পর্যায় ২: নিরাময়, পর্যায় ৩: স্থায়িত্ব)।',
      safety_en: 'Blocks premature phase promotion if foundational clinical milestones are unmet.',
      safety_bn: 'প্রাথমিক উন্নতি অর্জিত না হওয়া পর্যন্ত পরবর্তী ধাপে উত্তরণে সতর্কতা।',
      tags: ['phases', 'protocol-stages', 'progression']
    },
    {
      id: 'U17',
      name_en: 'Smart Reassessment Trigger',
      name_bn: 'স্মার্ট পুনর্মূল্যায়ন ও ফলো-আপ অ্যালার্ট',
      phase: 'R10',
      benchmark: 'Practice Better, Cerbo',
      status: 'IMPLEMENTED',
      summary_en: 'Automated task engine alerting clinicians when lab test dates expire or follow-up is overdue.',
      summary_bn: 'ল্যাব পরীক্ষার মেয়াদ উত্তীর্ণ হলে বা ফলো-আপের সময় পার হলে ক্লিনিশিয়ানকে স্বয়ংক্রিয় নোটিফিকেশন।',
      safety_en: 'Ensures high-risk patients on insulin or diuretics receive timely clinical review.',
      safety_bn: 'ইনসুলিন বা জটিল ওষুধ গ্রহণকারী রোগীর সময়মত নিরীক্ষা নিশ্চিতকরণ।',
      tags: ['reassessment', 'follow-up-queue', 'tasks']
    },
    {
      id: 'U18',
      name_en: 'Explainable Decision & Audit History',
      name_bn: 'ব্যাখ্যাযোগ্য সিদ্ধান্ত ও অপরিবর্তনীয় অডিট ইতিহাস',
      phase: 'R2',
      benchmark: 'Cerbo, 21 CFR Part 11',
      status: 'PARTIALLY IMPLEMENTED',
      summary_en: 'Immutable chronological audit stream capturing every gram edit, override, and sign-off.',
      summary_bn: 'প্রতিটি খাদ্য ও পরিমাপ পরিবর্তনের সময়, কারণ ও অনুমোদনকারীর সম্পূর্ণ অপরিবর্তনীয় রেকর্ড।',
      safety_en: 'Provides complete legal audit trail and peer clinical review capability.',
      safety_bn: 'মেডিকো-লিগ্যাল নিরাপত্তা ও ক্লিনিক্যাল অডিটের পূর্ণ স্বচ্ছতা প্রদান।',
      tags: ['audit-trail', 'governance', 'provenance']
    },
    {
      id: 'U19',
      name_en: 'Patient Self-Assessment Link & Approval',
      name_bn: 'রোগীর নিজস্ব মূল্যায়ন লিংক ও অনুমোদন গেট',
      phase: 'R3',
      benchmark: 'Practice Better, OptiMantra',
      status: 'PLANNED',
      summary_en: 'Tokenized remote web questionnaire submitting to an isolated staging queue for clinician review.',
      summary_bn: 'রোগীর ঘরে বসে অনলাইনে তথ্য পূরণের লিংক যা ক্লিনিশিয়ানের অনুমোদনের পর ফাইলে যুক্ত হয়।',
      safety_en: 'Unverified patient submissions cannot overwrite clinical safety flags directly.',
      safety_bn: 'রোগীর দেওয়া তথ্য ক্লিনিশিয়ান যাচাই করার আগে সরাসরি ক্লিনিক্যাল নিয়মে প্রভাব ফেলবে না।',
      tags: ['patient-portal', 'intake-link', 'staging-queue']
    },
    {
      id: 'U20',
      name_en: 'Nutritionist-Only Nutrient Analytics',
      name_bn: 'শুধু পুষ্টিবিদের জন্য পূর্ণ বায়োকেমিক্যাল বিশ্লেষণ',
      phase: 'R1',
      benchmark: 'Cronometer Pro, Nutrium',
      status: 'IMPLEMENTED',
      summary_en: 'Exhaustive metabolic workbench for treating clinicians: Atwater ratios, PRAL, DRI sufficiency.',
      summary_bn: 'ক্লিনিশিয়ানের নিজস্ব স্ক্রিনে পূর্ণ ক্যালোরি, ম্যাক্রো গ্রাম, পিআরএএল ও মিনারেল বিশ্লেষণ।',
      safety_en: 'Provides maximum biochemical depth required for safe medical nutrition therapy.',
      safety_bn: 'নিরাপদ পুষ্টি চিকিৎসার জন্য ক্লিনিশিয়ানকে সম্পূর্ণ পুষ্টির গভীরতা প্রদান।',
      tags: ['clinician-view', 'biochemistry', 'atwater']
    },
    {
      id: 'U21',
      name_en: 'Patient-Safe Diet Chart (Zero Calories/Macros)',
      name_bn: 'রোগীর খাদ্য তালিকা (ক্যালোরি/ম্যাক্রো ব্যতীত)',
      phase: 'R1',
      benchmark: 'Proprietary Clinical Standard',
      status: 'PLANNED',
      summary_en: 'Clean, compassionate patient projection displaying foods, times, and household portions with ZERO numbers.',
      summary_bn: 'রোগীর হাতে দেওয়া খাদ্য তালিকায় কোনো ক্যালোরি বা ম্যাক্রো গ্রাম থাকবে না; থাকবে শুধু খাবারের নাম ও বাটির মাপ।',
      safety_en: 'Eliminates orthorexic fixation, anxiety, and dangerous self-medication by patients.',
      safety_bn: 'রোগীর খাদ্যভীতি ও সংখ্যা নিয়ে অতিরিক্ত মানসিক চাপ প্রতিরোধ।',
      tags: ['patient-report', 'eating-disorder-safe', 'zero-macros']
    },
    {
      id: 'U22',
      name_en: 'Adaptive Follow-up Questionnaire',
      name_bn: 'অ্যাডাপ্টিভ সংক্ষিপ্ত ফলো-আপ প্রশ্নমালা',
      phase: 'R10',
      benchmark: 'Practice Better, Etio',
      status: 'PLANNED',
      summary_en: 'Dynamic follow-up form condensing intake to 5 minutes by querying only previously abnormal markers.',
      summary_bn: 'পূর্ববর্তী ভিজিটের সমস্যার ওপর ভিত্তি করে তৈরি ৫ মিনিটের দ্রুত ফলো-আপ ফরম।',
      safety_en: 'Always retains mandatory acute red-flag safety screening.',
      safety_bn: 'জরুরি বিপদচিহ্নগুলোর প্রশ্ন সর্বদা উপস্থিত থাকে।',
      tags: ['adaptive-intake', 'rapid-followup', 'questionnaire']
    },
    {
      id: 'U23',
      name_en: 'Clinical Outcomes & Research Engine',
      name_bn: 'ক্লিনিক্যাল আউটকাম ও গবেষণা ইঞ্জিন',
      phase: 'R12',
      benchmark: 'Biocanic Clinical Research',
      status: 'PLANNED',
      summary_en: 'Aggregates de-identified patient cohorts to measure clinical effectiveness across pathways.',
      summary_bn: 'ব্যক্তিগত তথ্য ব্যতীত গবেষণার জন্য সামগ্রিক চিকিৎসার ফলাফল পরিমাপ।',
      safety_en: 'Full HIPAA/GDPR de-identification (Safe Harbor Standard); zero PHI exposure.',
      safety_bn: 'রোগীর ব্যক্তিগত তথ্যের গোপনীয়তা শতভাগ সুরক্ষিত রেখে গবেষণামূলক ডাটা তৈরি।',
      tags: ['research', 'outcomes', 'anonymized-data']
    },
    {
      id: 'U24',
      name_en: 'Personalized Patient Education Library',
      name_bn: 'ব্যক্তিগত রোগী শিক্ষামূলক নির্দেশিকা লাইব্রেরি',
      phase: 'R5',
      benchmark: 'That Clean Life, Practice Better',
      status: 'PLANNED',
      summary_en: 'Illustrated bilingual handouts appended to reports based on diagnosed conditions (e.g. Uric Acid guide).',
      summary_bn: 'রোগীর রোগ অনুযায়ী সহজ বাংলায় লেখা খাদ্য ও রান্নার সচেতনতামূলক নির্দেশিকা।',
      safety_en: 'Written at a 6th-grade comprehension level to prevent misinterpretation.',
      safety_bn: 'সহজবোধ্য ভাষায় রচিত যাতে ভুল বোঝাবুঝি না ঘটে।',
      tags: ['patient-education', 'bilingual', 'handouts']
    },
    {
      id: 'U25',
      name_en: 'Protocol & Template Marketplace',
      name_bn: 'পুষ্টি প্রোটোকল ও টেমপ্লেট মার্কেটপ্লেস',
      phase: 'R11',
      benchmark: 'That Clean Life, Practice Better',
      status: 'PLANNED',
      summary_en: 'Internal repository allowing senior dietitians to publish, share, and clone validated meal plans.',
      summary_bn: 'অভিজ্ঞ পুষ্টিবিদদের তৈরি করা সফল ডায়েট প্ল্যান নিরাপদে সংরক্ষণ ও টিমের মাঝে শেয়ার।',
      safety_en: 'Shared templates must pass deterministic safety validation before publishing.',
      safety_bn: 'প্রকাশের পূর্বে সকল টেমপ্লেটকে স্বয়ংক্রিয় ক্লিনিক্যাল সেফটি টেস্টে উত্তীর্ণ হতে হবে।',
      tags: ['templates', 'protocol-sharing', 'marketplace']
    },
    {
      id: 'U26',
      name_en: 'De-identified Outcome Benchmarking',
      name_bn: 'বেনামি ক্লিনিক্যাল ফলাফল বেঞ্চমার্কিং',
      phase: 'R12',
      benchmark: 'Biocanic',
      status: 'PLANNED',
      summary_en: 'Compares practice treatment success percentiles against national functional medicine cohorts.',
      summary_bn: 'অন্যান্য ক্লিনিকের সাথে নিজের প্র্যাকটিসের চিকিৎসার সাফল্যের তুলনামূলক চিত্র।',
      safety_en: 'Differential privacy noise injection prevents re-identification of rare conditions.',
      safety_bn: 'অতিরিক্ত সুরক্ষায় ডিফারেনশিয়াল প্রাইভেসি অ্যালগরিদম ব্যবহার।',
      tags: ['benchmarking', 'cohort-analytics', 'peer-review']
    },
    {
      id: 'U27',
      name_en: 'Future AI Food Photo Analyzer',
      name_bn: 'ভবিষ্যৎ এআই খাবারের ছবি বিশ্লেষক',
      phase: 'R14',
      benchmark: 'Passio AI, Cronometer Photo',
      status: 'FUTURE / DEFERRED',
      summary_en: 'Computer vision pipeline estimating food items and portions from cooked meal photographs.',
      summary_bn: 'খাবারের ছবি থেকে দেশীয় খাদ্য চিহ্নিতকরণ ও আনুমানিক পরিমাপ নির্ণয়।',
      safety_en: 'Mandatory human nutritionist review; AI output permanently tagged as unverified draft.',
      safety_bn: 'পুষ্টিবিদের অনুমোদন ছাড়া কোনো এআই আউটপুট চূড়ান্ত হিসেবে গণ্য হবে না।',
      tags: ['ai-vision', 'photo-logging', 'deferred-r14']
    },
    {
      id: 'U28',
      name_en: 'Future Bengali Voice Food Diary',
      name_bn: 'ভবিষ্যৎ বাংলা ভয়েস ফুড ডায়েরি',
      phase: 'R14',
      benchmark: 'Proprietary SHUDDHO Innovation',
      status: 'FUTURE / DEFERRED',
      summary_en: 'Speech-to-text pipeline parsing spoken colloquial Bengali meals into structured food log entries.',
      summary_bn: 'মুখে বাংলায় বলে খাবারের হিসাব ডায়েরিতে রেকর্ড করার আধুনিক সুবিধা।',
      safety_en: 'Transcribed items require patient confirmation before inclusion in diary tally.',
      safety_bn: 'রোগীর স্পষ্ট সম্মতি ছাড়া ভয়েস রেকর্ড খাদ্য তালিকায় সরাসরি যোগ হবে না।',
      tags: ['ai-voice', 'bengali-nlp', 'deferred-r14']
    },
    {
      id: 'U29',
      name_en: 'Future AI Clinical Copilot',
      name_bn: 'ভবিষ্যৎ এআই ক্লিনিক্যাল কোপাইলট',
      phase: 'R14',
      benchmark: 'Etio, OpenEvidence',
      status: 'FUTURE / DEFERRED',
      summary_en: 'Grounded retrieval-augmented assistant summarizing patient history and searching medical literature.',
      summary_bn: 'রোগীর ইতিহাস বিশ্লেষণ ও প্রাসঙ্গিক বৈজ্ঞানিক গবেষণাপত্র খুঁজে দেওয়ার সহযোগী।',
      safety_en: 'Strictly advisory; cannot directly prescribe or edit clinical records without clinician action.',
      safety_bn: 'কখনোই নিজে থেকে প্রেসক্রিপশন করতে পারবে না; শুধুমাত্র পরামর্শক হিসেবে থাকবে।',
      tags: ['ai-copilot', 'literature-rag', 'deferred-r14']
    },
    {
      id: 'U30',
      name_en: 'Future Native Mobile Health Companion',
      name_bn: 'ভবিষ্যৎ নেটিভ মোবাইল স্বাস্থ্য সঙ্গী',
      phase: 'R15',
      benchmark: 'Apple Health, Practice Better App',
      status: 'FUTURE / DEFERRED',
      summary_en: 'Dedicated iOS/Android app with offline SQLite sync, chronotherapy meal notifications, zero macros.',
      summary_bn: 'আইফোন ও অ্যান্ড্রয়েডের ডেডিকেটেড অ্যাপ, অফলাইন ব্যবহারের সুবিধা ও নোটিফিকেশন।',
      safety_en: 'Strictly enforces U21; never caches or displays raw calories or macronutrient figures.',
      safety_bn: 'মোবাইল অ্যাপেও কোনো ক্যালোরি বা ম্যাক্রো সংখ্যা থাকবে না; শুধু খাবারের সময় ও নির্দেশনা।',
      tags: ['native-mobile', 'offline-sync', 'deferred-r15']
    }
  ];

  // ── Filtered Features ─────────────────────────────────────────────
  const filteredFeatures = useMemo(() => {
    return uniqueFeatures.filter(f => {
      const matchSearch =
        f.id.toLowerCase().includes(featureSearch.toLowerCase()) ||
        f.name_en.toLowerCase().includes(featureSearch.toLowerCase()) ||
        f.name_bn.includes(featureSearch) ||
        f.tags.some(t => t.toLowerCase().includes(featureSearch.toLowerCase()));

      const matchPhase =
        phaseFilter === 'all' ||
        (phaseFilter === 'core' && ['R0', 'R1', 'R2', 'R3', 'R4', 'R5'].includes(f.phase)) ||
        (phaseFilter === 'intelligence' && ['R6', 'R7', 'R8', 'R9', 'R10'].includes(f.phase)) ||
        (phaseFilter === 'practice' && ['R11', 'R12', 'R13'].includes(f.phase)) ||
        (phaseFilter === 'future' && ['R14', 'R15'].includes(f.phase));

      return matchSearch && matchPhase;
    });
  }, [uniqueFeatures, featureSearch, phaseFilter]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* ── Top Command Bar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border shadow-subtle px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-secondary text-xs font-semibold text-foreground transition-all hover:scale-[1.02]"
            title="Return to Clinical Dashboard"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            <span className="hidden sm:inline">{bn ? 'ক্লিনিক্যাল ড্যাশবোর্ড' : 'Clinical Workspace'}</span>
          </Link>

          <div className="h-4 w-[1px] bg-border" />

          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground font-black text-xs flex items-center justify-center shadow-subtle">
              শু
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-foreground">SHUDDHO</span>
              <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                R0 BASELINE
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Status Indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>R0 Architecture Technically Closed</span>
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-secondary text-foreground transition-all hover:scale-[1.02]"
          >
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span>{bn ? 'English' : 'বাংলা'}</span>
          </button>
        </div>
      </header>

      {/* ── Main Content Container ────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 py-8 space-y-12">
        {/* Hero Section */}
        <div className="relative rounded-3xl bg-gradient-to-br from-card via-card to-primary/[0.04] border border-border p-6 sm:p-10 shadow-subtle overflow-hidden">
          <div className="max-w-4xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold tracking-wide uppercase">
              <Compass className="h-3.5 w-3.5" />
              <span>{bn ? 'মাস্টার প্রোডাক্ট চার্টার ও রোডম্যাপ (R0–R15)' : 'Master Product Charter & Roadmap (R0–R15)'}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {bn 
                ? 'বিশুদ্ধ — ফাংশনাল ও প্রিসিশন নিউট্রিশন ক্লিনিক্যাল ইন্টেলিজেন্স'
                : 'SHUDDHO — Functional & Precision Nutrition Clinical Platform'}
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {bn
                ? 'বাংলাদেশের খাদ্য ও চিকিৎসাব্যবস্থাকে কেন্দ্র করে তৈরি বিশ্বের প্রথম সিস্টেমস-বায়োলজি পুষ্টিবিজ্ঞান প্ল্যাটফর্ম। এখানে ক্লিনিক্যাল সিদ্ধান্ত সম্পূর্ণ ডিটারমিনিস্টিক (১০০% নিয়ম-ভিত্তিক), রোগীদের প্রেসক্রিপশন মানসিক চাপমুক্ত (ক্যালোরি ও ম্যাক্রো সংখ্যাবিহীন) এবং সমগ্র আর্কিটেকচার উন্মুক্ত ও বৈজ্ঞানিকভাবে যাচাইকৃত।'
                : 'The Bangladesh-first, systems-biology clinical nutrition platform combining the IFM 7-domain matrix, Ayurvedic constitutional intelligence, and FCTB native food biochemistry. Fully deterministic clinical safety, dual-projection reporting, and an open, vendor-independent architectural blueprint.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                381 Indigenous FCTB Foods
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                32,461 DGDA Medicine Brands
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                Zero Hallucination Safety Core
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-primary">
                <Award className="h-4 w-4" />
                FOSS-First Architecture
              </span>
            </div>
          </div>
        </div>

        {/* ── 4 Cardinal Product Invariants ──────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-subtle space-y-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="text-sm font-bold text-foreground">
              {bn ? 'সিস্টেমস-বায়োলজি পুষ্টিবিজ্ঞান' : 'Systems-Biology Foundation'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {bn
                ? 'আইএফএম ম্যাট্রিক্স এবং আয়ুর্বেদিক অগ্নি/দোষার সমন্বয়ে লক্ষণের পেছনের মূল কারণ চিহ্নিতকরণ।'
                : '7-domain IFM functional matrix + Ayurvedic Agni/Prakriti root-cause evaluation.'}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-subtle space-y-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="text-sm font-bold text-foreground">
              {bn ? 'ডিটারমিনিস্টিক সেফটি কোর' : 'Deterministic Safety Core'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {bn
                ? '১০০% নিয়ম-ভিত্তিক নিরাপত্তা। বিএমআর ফ্লোর, কিডনি প্রোটিন সিলিং এবং ওষুধের দ্বন্দ্বে শূন্য ত্রুটি।'
                : '100% rule-based safety with zero AI hallucinations; strict BMR floors and eGFR clamps.'}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-subtle space-y-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="text-sm font-bold text-foreground">
              {bn ? 'ডুয়েল রিপোর্ট প্রজেকশন' : 'Dual-Projection Reporting'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {bn
                ? 'ক্লিনিশিয়ান দেখেন পূর্ণ পুষ্টিরসায়ন; রোগীর প্রেসক্রিপশনে ক্যালোরি বা ম্যাক্রোর সংখ্যা শতভাগ নিষিদ্ধ।'
                : 'Clinicians see full Atwater macros; patients receive food-first guidance with ZERO calories/macros.'}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-subtle space-y-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              4
            </div>
            <h3 className="text-sm font-bold text-foreground">
              {bn ? 'বাংলাদেশ-ফার্স্ট বাস্তুতন্ত্র' : 'Bangladesh-First Ecosystem'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {bn
                ? '৩৮১টি দেশীয় খাদ্য, ৩২ হাজার ওষুধের ব্র্যান্ড, স্থানীয় বাজারদর ও যৌথ পরিবারের রান্নার সমন্বয়।'
                : '381 indigenous foods (FCTB), 32k DGDA brands, joint family cooking, and BDT affordability.'}
            </p>
          </div>
        </div>

        {/* ── Section: 16-Phase Roadmap Timeline (R0 – R15) ──────────────── */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
                <Layers className="h-4 w-4" />
                <span>{bn ? 'পরিকল্পিত উন্নয়ন রোডম্যাপ' : 'Controlled Development Horizon'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {bn ? '১৬-ধাপের মাস্টার রোডম্যাপ (R0 – R15)' : '16-Phase Master Roadmap (R0 – R15)'}
              </h2>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                onClick={() => setPhaseFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  phaseFilter === 'all'
                    ? 'bg-primary text-primary-foreground shadow-subtle'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {bn ? 'সকল ফেজ (১৬)' : 'All Phases (16)'}
              </button>
              <button
                onClick={() => setPhaseFilter('core')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  phaseFilter === 'core'
                    ? 'bg-primary text-primary-foreground shadow-subtle'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                Core (R0–R5)
              </button>
              <button
                onClick={() => setPhaseFilter('intelligence')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  phaseFilter === 'intelligence'
                    ? 'bg-primary text-primary-foreground shadow-subtle'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                Intelligence (R6–R10)
              </button>
              <button
                onClick={() => setPhaseFilter('practice')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  phaseFilter === 'practice'
                    ? 'bg-primary text-primary-foreground shadow-subtle'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                Practice (R11–R13)
              </button>
              <button
                onClick={() => setPhaseFilter('future')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  phaseFilter === 'future'
                    ? 'bg-primary text-primary-foreground shadow-subtle'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                Future (R14–R15)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {phases
              .filter(p => phaseFilter === 'all' || p.category === phaseFilter)
              .map(phase => {
                const isCompleted = phase.status === 'COMPLETED';
                const isReady = phase.status === 'READY';
                const isDeferred = phase.status === 'DEFERRED';

                return (
                  <div
                    key={phase.id}
                    className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 transition-all shadow-subtle ${
                      isCompleted
                        ? 'bg-emerald-500/[0.03] border-emerald-500/30'
                        : isReady
                        ? 'bg-primary/[0.04] border-primary/40 ring-1 ring-primary/20'
                        : isDeferred
                        ? 'bg-card border-border/60 opacity-80'
                        : 'bg-card border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-secondary text-foreground border border-border">
                          {phase.id}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isCompleted
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : isReady
                              ? 'bg-primary text-primary-foreground font-extrabold shadow-subtle animate-pulse'
                              : isDeferred
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-secondary text-muted-foreground border border-border'
                          }`}
                        >
                          {phase.status}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-base text-foreground">
                          {bn ? phase.name_bn : phase.name_en}
                        </h3>
                        <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          Benchmark: {phase.benchmark}
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {bn ? phase.deliverables_bn : phase.deliverables_en}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-border/80 space-y-2">
                      <div className="text-[11px]">
                        <span className="font-semibold text-foreground">
                          {bn ? 'অ্যাকসেপ্টেন্স শর্ত:' : 'Acceptance Standard:'}
                        </span>{' '}
                        <span className="text-muted-foreground">
                          {bn ? phase.acceptanceCriteria_bn : phase.acceptanceCriteria_en}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {phase.features.map(f => (
                          <span
                            key={f}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-foreground font-mono font-medium border border-border"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>

        {/* ── Section: Dual Report Access Showcase ────────────────────────── */}
        <section className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-subtle space-y-6">
          <div className="border-b border-border pb-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
              <ShieldAlert className="h-4 w-4" />
              <span>{bn ? 'ক্লিনিক্যাল সাইকোলজি ও গোপনীয়তা মানদণ্ড' : 'Clinical Psychology & Privacy Standard'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {bn ? 'ডুয়েল রিপোর্ট প্রজেকশন নীতি (U20 বনাম U21)' : 'Dual Report Projection Invariant (U20 vs U21)'}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {bn
                ? 'রোগীদের ক্যালোরি বা ম্যাক্রোর সংখ্যা গণনা দেখানো মানসিক চাপ তৈরি করে। তাই শুদ্ধ প্ল্যাটফর্মে ক্লিনিশিয়ান ও রোগীর ডেটা প্রজেকশন সম্পূর্ণ পৃথক।'
                : 'Displaying numerical calories and macronutrient counts to patients induces orthorexic fixation. SHUDDHO enforces an architectural separation between clinician analytics and patient food instructions.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Clinician Projection Card */}
            <div data-testid="clinician-projection-view" className="rounded-2xl border border-primary/30 bg-primary/[0.02] p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-primary flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  Clinician Full Dossier (U20)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  Doctor / Dietitian View
                </span>
              </div>
              <ul className="text-xs space-y-2 text-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Exact Total Calories & Atwater distribution (4/4/9 kcal/g)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Gram-level protein, carbohydrate, and fat actuals vs targets</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Renal Potential Renal Acid Load (PRAL) & Glycemic Load</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Micronutrient sufficiency curves and DRI fulfillments</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Systems-biology hypotheses with PubMed PMID citations</span>
                </li>
              </ul>
            </div>

            {/* Patient Projection Card */}
            <div data-testid="patient-projection-view" className="rounded-2xl border border-border bg-card p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-1.5">
                  <HeartHandshake className="h-4 w-4 text-emerald-500" />
                  Patient Lifestyle Prescription (U21)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                  Patient / Family View
                </span>
              </div>
              <ul className="text-xs space-y-2 text-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Clear food names in Bengali and English (e.g. রুই মাছের পাতলা ঝোল)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Household portions (১ মাঝারি বাটি, ১ চামচ, ১ টুকরো)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Specific scheduled meal times (সকাল ৮:৩০, দুপুর ১:১৫)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Cooking guidance, hydration glasses, and sleep hygiene notes</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                  <span>STRICTLY ZERO KCAL, PROTEIN G, CARB G, OR FAT G NUMBERS</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── Section: Unique Features Explorer (U01 – U30) ─────────────── */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
                <Sparkles className="h-4 w-4" />
                <span>{bn ? 'অনন্য উদ্ভাবন রেজিস্ট্রি' : 'Proprietary Capabilities'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {bn ? '৩০টি অনন্য ফিচারের পূর্ণ ক্যাটালগ (U01 – U30)' : '30 Unique Capabilities Registry (U01 – U30)'}
              </h2>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                value={featureSearch}
                onChange={e => setFeatureSearch(e.target.value)}
                placeholder={bn ? 'ফিচার বা আইডি খুঁজুন...' : 'Search features or tags...'}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFeatures.map(feat => (
              <div
                key={feat.id}
                onClick={() => setSelectedFeature(selectedFeature?.id === feat.id ? null : feat)}
                className={`cursor-pointer rounded-2xl border p-4.5 space-y-3 transition-all shadow-subtle hover:scale-[1.01] ${
                  selectedFeature?.id === feat.id
                    ? 'border-primary ring-1 ring-primary bg-primary/[0.03]'
                    : 'bg-card border-border hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {feat.id}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Phase {feat.phase}
                    </span>
                  </div>

                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      feat.status === 'IMPLEMENTED'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : feat.status === 'PARTIALLY IMPLEMENTED'
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                        : feat.status.includes('DEFERRED')
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {feat.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {bn ? feat.name_bn : feat.name_en}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {bn ? feat.summary_bn : feat.summary_en}
                  </p>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="truncate max-w-[180px]">Ref: {feat.benchmark}</span>
                  <span className="text-primary font-semibold flex items-center gap-0.5">
                    {selectedFeature?.id === feat.id ? 'Close' : 'Details'}
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>

                {selectedFeature?.id === feat.id && (
                  <div className="pt-3 border-t border-border space-y-2 text-xs animate-in fade-in duration-150">
                    <div>
                      <span className="font-bold text-foreground">{bn ? 'ক্লিনিক্যাল সেফটি:' : 'Clinical Safety:'}</span>{' '}
                      <span className="text-muted-foreground">{bn ? feat.safety_bn : feat.safety_en}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {feat.tags.map(t => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Section: International Benchmark Matrix ────────────────────── */}
        <section className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-subtle space-y-6">
          <div className="border-b border-border pb-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
              <Globe className="h-4 w-4" />
              <span>{bn ? 'আন্তর্জাতিক মানদণ্ড তুলনা' : 'Global Industry Benchmarks'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {bn ? 'শীর্ষ ৮ আন্তর্জাতিক প্ল্যাটফর্মের সাথে তুলনা' : 'Evaluation Against 8 Global Benchmark Platforms'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Biocanic', focus: 'Functional Lab Tests & Protocols', mapped: 'U01, U07, U15, U16, U23' },
              { name: 'Etio', focus: 'Mechanism-Based Reasoning & PMIDs', mapped: 'U01, U02, U03, U04, U05, U14' },
              { name: 'Nutrium', focus: 'Meal Planning & Client Diary App', mapped: 'F03, F06, U11, U20, U30' },
              { name: 'That Clean Life', focus: 'Clean Recipes & Branded Reports', mapped: 'F03, U08, U10, U11, U12, U24' },
              { name: 'Practice Better', focus: 'Client Portal & Intake Automation', mapped: 'F06, U17, U19, U22, U25, R11' },
              { name: 'Cerbo (Specialty Tools)', focus: 'Supplement Protocols & Labs (No EHR)', mapped: 'F07, U06, U17, U18' },
              { name: 'OptiMantra (Wellness)', focus: 'Ayurvedic Intake & Wellness Scheduling', mapped: 'F02, U16, U25' },
              { name: 'Cronometer Pro', focus: 'High-Precision Micronutrients & Ratios', mapped: 'F04, F08, U13, U20' },
            ].map(b => (
              <div key={b.name} className="p-4 rounded-xl border border-border bg-secondary/20 space-y-2">
                <div className="font-bold text-sm text-foreground">{b.name}</div>
                <p className="text-xs text-muted-foreground">{b.focus}</p>
                <div className="text-[10px] text-primary font-mono font-medium pt-1 border-t border-border">
                  SHUDDHO: {b.mapped}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section: Governance & Audit Sign-Off ────────────────────────── */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.03] p-6 text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="h-4 w-4" />
            <span>SHUDDHO R0 — TECHNICALLY CLOSED</span>
          </div>

          <h3 className="text-lg font-bold text-foreground">
            {bn 
              ? 'মাস্টার আর্কিটেকচার অনুমোদিত ও লকড — ফেজ R1 এর জন্য প্রস্তুত'
              : 'Master Architecture Approved & Locked — Ready for Phase R1: Dual Report & PDF Studio'}
          </h3>

          <p className="text-xs text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {bn
              ? 'সকল ১০টি ব্লুপ্রিন্ট ডকুমেন্ট অনুমোদিত, ব্রাউজার ই২ই টেস্টের শতভাগ ফলাফল যাচাইকৃত এবং লাইভ গিটহাব পেজে ডিপ্লয়মেন্ট কার্যকর করা হয়েছে। কোনো পরীক্ষামূলক বা অপ্রস্তুত ফিচার সক্রিয় করা হয়নি।'
              : 'All 10 blueprint documents versioned, 164 browser assertions passing, static export validated, and zero runtime AI or premature native mobile code executed.'}
          </p>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-subtle transition-all hover:scale-[1.02]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{bn ? 'ক্লিনিক্যাল প্র্যাকটিসে ফিরে যান' : 'Return to Clinical Practice Dashboard'}</span>
            </Link>
          </div>
        </div>
      </main>

      {/* ── Global Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card px-4 sm:px-8 py-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span>© 2026 SHUDDHO Clinical Platform. Free & Open-Source Software (FOSS).</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <Link href="/" className="hover:text-foreground transition-colors">
            {bn ? 'ড্যাশবোর্ড' : 'Dashboard'}
          </Link>
          <span>•</span>
          <a
            href="https://github.com/probalsarpv-byte/Diet-Chart-Software"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <span>GitHub</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </footer>
    </div>
  );
}
