'use client';

import React, { useState, useMemo } from 'react';
import { usePractice } from '@/context/PracticeContext';
import { DISEASE_RULES } from '@/engine/diseaseRules';
import { mapPathwaysToConditionIds } from '@/engine/r5PathwayRegistry';
import { 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Filter, 
  Flame, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Lock,
  ShieldCheck,
  Activity,
  Layers
} from 'lucide-react';

export const ConditionsTab: React.FC = () => {
  const { patient, trafficLight, language, r5Pathways, setActiveTab } = usePractice();
  const bn = language === 'bn';

  const [activeTrafficTab, setActiveTrafficTab] = useState<'GREEN' | 'YELLOW' | 'RED'>('GREEN');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFoodId, setExpandedFoodId] = useState<string | null>(null);

  // Confirmed clinical conditions are authoritative from patient profile
  const confirmedConditions = useMemo(() => {
    return (patient.selected_conditions || []) as string[];
  }, [patient.selected_conditions]);

  // Selected rules for confirmed conditions display
  const activeRules = useMemo(() => {
    return confirmedConditions.map(c => (DISEASE_RULES as any)[c]).filter(Boolean);
  }, [confirmedConditions]);

  // Current list based on traffic tab
  const currentFoods = trafficLight[activeTrafficTab.toLowerCase() as 'green' | 'yellow' | 'red'];

  // Filter foods by query and category
  const filteredFoods = useMemo(() => {
    return currentFoods.filter(f => {
      const matchCat = selectedCategory === 'all' || f.category === selectedCategory;
      const text = `${f.name_en} ${f.name_bn} ${f.tags.join(' ')}`.toLowerCase();
      const matchQuery = !searchQuery || text.includes(searchQuery.toLowerCase().trim());
      return matchCat && matchQuery;
    });
  }, [currentFoods, searchQuery, selectedCategory]);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'confirmed_allergy': return bn ? 'নিশ্চিত অ্যালার্জি' : 'Confirmed Allergy';
      case 'clinician_restriction': return bn ? 'চিকিৎসকের নিষেধাজ্ঞা' : 'Clinician Exclusion';
      case 'hard_contraindication': return bn ? 'ক্লিনিক্যাল নিষেধাজ্ঞা' : 'Hard Contraindication';
      case 'evidence_conditional': return bn ? 'শর্তসাপেক্ষ সতর্কতা' : 'Conditional Precaution';
      case 'phase_specific': return bn ? 'ফেজ-নির্দিষ্ট নিয়ম' : 'Phase Protocol';
      case 'suspected_intolerance': return bn ? 'সম্ভাব্য সেনসিটিভিটি' : 'Suspected Sensitivity';
      case 'preference': return bn ? 'থেরাপিউটিক পুষ্টি' : 'Therapeutic Nutrition';
      default: return cat;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Read-Only Clinical Pathways & Confirmed Diagnoses Summary (P1-001) */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-subtle space-y-4">
        
        {/* Header with Navigation Link to Authoritative Assessment */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3.5">
          <div className="flex items-center gap-2.5 text-foreground font-bold text-sm">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <span>{bn ? 'ক্লিনিক্যাল খাদ্য নির্দেশিকা ও রোগ বিশ্লেষণ ওয়ার্কস্পেস' : 'Clinical Food Guide & Diagnostic Reference Workspace'}</span>
              <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                {bn ? 'নিশ্চিত রোগ নির্ণয় ও ক্লিনিক্যাল পাথওয়ের ওপর ভিত্তি করে স্বয়ংক্রিয় ট্রাফিক লাইট ফিল্টারিং' : 'Evidence-based traffic light food classification driven by confirmed diagnoses and pathways'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('assessment')}
            className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-subtle hover:bg-primary/90 transition self-start sm:self-auto"
          >
            <Activity className="h-3.5 w-3.5" />
            <span>{bn ? 'অ্যাসেসমেন্টে রোগ পরিবর্তন করুন' : 'Edit Diagnoses in Assessment'}</span>
          </button>
        </div>

        {/* Selected Clinical Pathways (Read-Only) */}
        <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span>{bn ? 'সক্রিয় ক্লিনিক্যাল পাথওয়ে (ধাপ ১):' : 'Active Clinical Pathways (Step 1):'}</span>
            </span>
            <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
              {r5Pathways?.selected_pathways?.length || 0} {bn ? 'টি সক্রিয়' : 'active'}
            </span>
          </div>
          {r5Pathways?.selected_pathways && r5Pathways.selected_pathways.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {r5Pathways.selected_pathways.map(pId => (
                <span key={pId} className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-semibold flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span>{pId.replace(/_/g, ' ')}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              {bn ? 'কোনো ক্লিনিক্যাল পাথওয়ে নির্ধারিত নেই।' : 'No broad clinical pathways selected.'}
            </p>
          )}
        </div>

        {/* Confirmed Diagnoses Summary (Read-Only) */}
        <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              <span>{bn ? 'নিশ্চিত ক্লিনিক্যাল সমস্যা ও রোগ নির্ণয়:' : 'Confirmed Clinical Diagnoses (Authoritative):'}</span>
            </span>
            <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full">
              {activeRules.length} {bn ? 'টি নিশ্চিত রোগ' : 'confirmed'}
            </span>
          </div>
          {activeRules.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              {activeRules.map(rule => (
                <div key={rule.id} className="p-3 rounded-xl border border-primary/30 bg-primary/5 text-xs space-y-1.5 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">
                      {bn ? rule.name_bn : rule.name_en}
                    </span>
                    <span className="text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                      {bn ? 'নিশ্চিত' : 'Confirmed'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {bn ? rule.clinical_summary_bn : rule.clinical_summary_en}
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(rule.redTags || []).slice(0, 3).map((t: string, idx: number) => (
                      <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground p-3 rounded-xl border border-dashed border-border flex items-center justify-between">
              <span>{bn ? 'কোনো নির্দিষ্ট রোগ নির্ণয় রেকর্ড করা হয়নি। সাধারণ পুষ্টি নির্দেশনা সক্রিয়।' : 'No specific disease diagnoses confirmed. General therapeutic baseline active.'}</span>
              <button
                type="button"
                onClick={() => setActiveTab('assessment')}
                className="text-primary hover:underline font-bold text-xs"
              >
                {bn ? 'রোগ যোগ করুন' : 'Add Diagnoses'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Combined Clinical Rules Summary & Strictest-Wins Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Strictest-Wins Priority Alert */}
        <div className="lg:col-span-2 bg-secondary/30 border border-border rounded-2xl p-5 space-y-3 shadow-subtle">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
            <ShieldAlert className="h-4 w-4" />
            <span>
              {bn ? 'স্ট্রিক্টেস্ট-উইন্স (Strictest-Wins) ইন্টারসেকশন প্রায়োরিটি নীতি: RED > YELLOW > GREEN' : 'Strictest-Wins Rule Priority: RED > YELLOW > GREEN'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {bn 
              ? 'যদি একটি খাদ্য একটি রোগের জন্য সবুজ বা উপকারী হয়, কিন্তু রোগীর নিশ্চিত অ্যালার্জি, চিকিৎসকের নিষেধাজ্ঞা বা অপর কোনো রোগের কারণে লাল হয়, তবে চূড়ান্ত তালিকায় খাদ্যটি শতভাগ লাল (RED) হিসেবে বর্জিত হবে এবং প্রতিটি সিদ্ধান্তের প্রমাণ ও ক্যাটাগরি প্রদর্শিত হবে।' 
              : 'Deterministic Safety Guarantee: Confirmed Allergies, Clinician Exclusions, and Hard Contraindications strictly override lower-tier preferences. If any reason is RED, the final status MUST be Red.'}
          </p>

          {/* Active Timing Rules */}
          {activeRules.length > 0 && (
            <div className="pt-2 border-t border-border space-y-2">
              <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span>{bn ? 'রোগ সমন্বিত খাদ্য গ্রহণের সময়বিধি ও প্রোটোকল:' : 'Integrated Meal Timing Protocols:'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeRules.flatMap(r => r.mealTimingRules).map((rule, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl border border-border bg-card text-[11px] text-muted-foreground shadow-2xs">
                    {bn ? rule.rule_bn : rule.rule_en}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Combined Macronutrient Target Guidance */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-subtle">
          <div className="flex items-center gap-2 text-foreground font-bold text-xs border-b border-border pb-2.5">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <span>{bn ? 'রোগ সমন্বিত ম্যাক্রো অনুপাত' : 'Condition Macro Adjustments'}</span>
          </div>
          <div className="space-y-2 text-xs">
            {activeRules.map(r => (
              <div key={r.id} className="p-2.5 rounded-xl border border-border bg-secondary/20 space-y-1 shadow-2xs">
                <span className="font-bold text-foreground">{bn ? r.name_bn : r.name_en}</span>
                <div className="flex justify-between text-[11px] text-muted-foreground font-mono tabular-numbers">
                  <span>Carbs: {r.macroAdjustment.carb_pct_range[0]}-{r.macroAdjustment.carb_pct_range[1]}%</span>
                  <span>Protein: {r.macroAdjustment.protein_g_per_kg[0]}-{r.macroAdjustment.protein_g_per_kg[1]} g/kg</span>
                  <span>Fat: {r.macroAdjustment.fat_pct_range[0]}-{r.macroAdjustment.fat_pct_range[1]}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. Interactive Traffic Light Browser */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-subtle space-y-5">
        
        {/* Tab Controls & Counts */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTrafficTab('GREEN')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-subtle ${
                activeTrafficTab === 'GREEN'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              <span>{bn ? 'সবুজ: স্বাচ্ছন্দ্যে গ্রহণীয়' : 'Green: Eat Freely'}</span>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                {trafficLight.green.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTrafficTab('YELLOW')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-subtle ${
                activeTrafficTab === 'YELLOW'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              <span>{bn ? 'হলুদ: পরিমিত ও শর্তসাপেক্ষে' : 'Yellow: Conditional'}</span>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                {trafficLight.yellow.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTrafficTab('RED')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-subtle ${
                activeTrafficTab === 'RED'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
              }`}
            >
              <XCircle className="h-4 w-4" />
              <span>{bn ? 'লাল: সম্পূর্ণ বর্জনীয়' : 'Red: Strictly Avoid'}</span>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                {trafficLight.red.length}
              </span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={bn ? 'খাবারের নাম বা ট্যাগ দিয়ে খুঁজুন...' : 'Search by food or tag...'}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-muted-foreground mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            {bn ? 'ক্যাটাগরি:' : 'Category:'}
          </span>
          {[
            { id: 'all', bn: 'সকল খাবার', en: 'All' },
            { id: 'grain', bn: 'শস্যদানা (Grain)', en: 'Grains' },
            { id: 'protein', bn: 'প্রোটিন / মাছ / মাংস / ডাল', en: 'Proteins' },
            { id: 'vegetable', bn: 'শাকসবজি', en: 'Vegetables' },
            { id: 'fruit', bn: 'ফলমূল', en: 'Fruits' },
            { id: 'fat_oil', bn: 'চর্বি ও তেল', en: 'Fats & Oils' },
            { id: 'seed_nut', bn: 'বাদাম ও বীজ', en: 'Nuts & Seeds' },
            { id: 'dairy', bn: 'দুগ্ধজাত', en: 'Dairy' }
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                selectedCategory === c.id
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-secondary/40 hover:bg-secondary text-muted-foreground'
              }`}
            >
              {bn ? c.bn : c.en}
            </button>
          ))}
        </div>

        {/* Food Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          {filteredFoods.slice(0, 48).map(food => {
            const isExpanded = expandedFoodId === food.id;
            const badgeColor = activeTrafficTab === 'GREEN' 
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
              : activeTrafficTab === 'YELLOW' 
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
              : 'bg-rose-500/10 text-rose-500 border-rose-500/20';

            return (
              <div 
                key={food.id}
                className="p-4 rounded-xl border bg-card/60 hover:bg-card hover:shadow-md transition space-y-2.5"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-semibold text-sm leading-tight text-foreground flex items-center gap-1.5">
                      <span>{bn ? food.name_bn : food.name_en}</span>
                      {food.hard_blocked && (
                        <span title="Hard Blocked (Non-overridable)">
                          <Lock className="h-3 w-3 text-rose-500" />
                        </span>
                      )}
                    </h4>
                    <span className="text-[11px] text-muted-foreground">
                      {bn ? food.name_en : food.name_bn}
                    </span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider ${badgeColor}`}>
                    {food.traffic_status}
                  </span>
                </div>

                {/* Nutrition Badges */}
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-secondary text-foreground font-medium">
                    {food.per_100g.kcal} kcal
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-medium">
                    P: {food.per_100g.protein_g}g
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-medium">
                    C: {food.per_100g.carbs_g}g
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium">
                    F: {food.per_100g.fat_g}g
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 font-medium">
                    GL: {food.glycemic_load}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded font-medium ${food.pral_score < 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    PRAL: {food.pral_score}
                  </span>
                </div>

                {/* Preparation Note */}
                <p className="text-[11px] text-muted-foreground bg-secondary/30 p-2 rounded-lg leading-relaxed">
                  <strong>{bn ? 'প্রস্তুতি পরামর্শ:' : 'Prep:'} </strong>
                  {bn ? food.prep_note_bn : food.prep_note_en}
                </p>

                {/* Clinical Audit Reasons Accordion */}
                <div className="border-t pt-2">
                  <button
                    type="button"
                    onClick={() => setExpandedFoodId(isExpanded ? null : food.id)}
                    className="w-full flex justify-between items-center text-[11px] font-medium text-primary hover:underline"
                  >
                    <span>{bn ? `ক্লিনিক্যাল অডিট ট্রেইল (${food.reasons.length}টি কারণ)` : `Clinical Audit Trail (${food.reasons.length} reasons)`}</span>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 space-y-1.5 pt-1">
                      {food.reasons.map((r, idx) => (
                        <div 
                          key={idx}
                          className={`p-2 rounded text-[10px] border ${
                            r.status === 'RED' 
                              ? 'bg-rose-500/5 border-rose-500/30 text-rose-500' 
                              : r.status === 'YELLOW' 
                              ? 'bg-amber-500/5 border-amber-500/30 text-amber-500' 
                              : 'bg-emerald-500/5 border-emerald-500/30 text-emerald-500'
                          }`}
                        >
                          <div className="font-semibold flex justify-between items-center mb-0.5">
                            <span>{bn ? r.conditionNameBn : r.conditionNameEn}</span>
                            <span className="text-[9px] px-1 py-0.2 bg-foreground/10 rounded">
                              {getCategoryLabel(r.category)}
                            </span>
                          </div>
                          <div className="text-[9px] text-muted-foreground mb-1">
                            Provenance: {r.provenance} • {r.isOverridable ? 'Overridable' : 'Strict Non-overridable'}
                          </div>
                          <div className="text-muted-foreground mt-0.5">
                            {bn ? r.note_bn : r.note_en}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {filteredFoods.length > 48 && (
          <div className="text-center text-xs text-muted-foreground pt-4">
            {bn ? `মোট ${filteredFoods.length} টি খাবারের মধ্যে প্রথম ৪৮টি প্রদর্শিত হয়েছে। সার্চ ফিল্টার ব্যবহার করে নির্দিষ্ট খাবার খুঁজুন।` : `Showing 48 of ${filteredFoods.length} foods. Narrow down using search.`}
          </div>
        )}

      </div>

    </div>
  );
};
