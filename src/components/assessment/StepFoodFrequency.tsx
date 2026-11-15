'use client';

import React, { useState } from 'react';
import { usePractice } from '@/context/PracticeContext';
import { useAssessment } from '@/context/AssessmentContext';
import {
  FFQ_FOOD_DEFINITIONS,
  FREQUENCY_NUMERIC_ESTIMATES
} from '@/engine/assessment/ffqEngine';
import {
  FFQFoodGroupId,
  FFQFrequencyOption,
  FFQPortionSize
} from '@/types/assessment';
import {
  Utensils,
  Leaf,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

const FREQUENCY_OPTIONS: { value: FFQFrequencyOption; label_en: string; label_bn: string }[] = [
  { value: '0_times', label_en: '0 times', label_bn: '০ বার' },
  { value: '1_2_times', label_en: '1-2 times', label_bn: '১-২ বার' },
  { value: '3_4_times', label_en: '3-4 times', label_bn: '৩-৪ বার' },
  { value: '5_6_times', label_en: '5-6 times', label_bn: '৫-৬ বার' },
  { value: '7_10_times', label_en: '7-10 times (daily)', label_bn: '৭-১০ বার (প্রতিদিন)' },
  { value: '11_14_times', label_en: '11-14 times (~2x/d)', label_bn: '১১-১৪ বার (দিনে ২ বার)' },
  { value: '15_21_times', label_en: '15-21 times (~3x/d)', label_bn: '১৫-২১ বার (দিনে ৩ বার)' },
  { value: '22_plus_times', label_en: '22+ times', label_bn: '২২+ বার' },
  { value: 'not_sure', label_en: 'Not sure', label_bn: 'নিশ্চিত নই' }
];

const PORTION_OPTIONS: { value: FFQPortionSize; label_en: string; label_bn: string }[] = [
  { value: 'small', label_en: 'Small', label_bn: 'ছোট' },
  { value: 'medium', label_en: 'Medium', label_bn: 'মাঝারি' },
  { value: 'large', label_en: 'Large', label_bn: 'বড়' },
  { value: 'extra_large', label_en: 'X-Large', label_bn: 'অনেক বড়' }
];

export const StepFoodFrequency: React.FC = () => {
  const { language } = usePractice();
  const bn = language === 'bn';
  const {
    ffqItems,
    setFFQItem,
    ffqHabits,
    setFFQHabits,
    ffqAnalysis,
    mode,
    setCurrentStep
  } = useAssessment();

  const [activeTab, setActiveTab] = useState<'survey' | 'habits'>('survey');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const visibleFoods = FFQ_FOOD_DEFINITIONS.filter(f => {
    if (mode === 'quick' && !f.isHighValueQuick && !ffqItems[f.id]?.frequency) {
      return false;
    }
    if (filterCategory !== 'all' && f.category !== filterCategory) {
      return false;
    }
    return true;
  });

  const handleFrequencySelect = (foodId: FFQFoodGroupId, freq: FFQFrequencyOption) => {
    const existing = ffqItems[foodId] || { food_group_id: foodId, portion_size: 'medium' };
    setFFQItem(foodId, {
      ...existing,
      frequency: freq
    });
  };

  const handlePortionSelect = (foodId: FFQFoodGroupId, portion: FFQPortionSize) => {
    const existing = ffqItems[foodId] || { food_group_id: foodId, frequency: '0_times' };
    setFFQItem(foodId, {
      ...existing,
      portion_size: portion
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">
            {bn ? 'ধাপ ৫: ৭ দিনের খাদ্য ফ্রিকোয়েন্সি সমীক্ষা (FFQ)' : 'Step 5: Seven-Day Food Frequency Questionnaire (FFQ)'}
          </h3>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {mode === 'quick' ? (bn ? 'কুইক সমীক্ষা (১৪ খাদ্য)' : 'Quick FFQ (14 Foods)') : (bn ? 'বিস্তারিত সমীক্ষা (২৭ খাদ্য)' : 'Full FFQ (27 Foods)')}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {bn
            ? 'ডায়রি টাইপ করার কোনো প্রয়োজন নেই। গত ৭ দিনে রোগী কতবার খাবারটি গ্রহণ করেছেন তা বাটনে ক্লিক করে নির্বাচন করুন।'
            : 'No daily food diary required. Simply click the frequency options representing the past 7 days of consumption.'}
        </p>
      </div>

      {/* Summary Scorecard */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {bn ? 'খাদ্যাভ্যাস বিশ্লেষণ সূচক (FFQ Analysis)' : 'Dietary Pattern Analysis Summary'}
          </h4>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            ffqAnalysis.summary.atypical_week_flag ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
          }`}>
            {ffqAnalysis.summary.atypical_week_flag
              ? (bn ? 'ব্যতিক্রমী সপ্তাহ' : 'Atypical Week')
              : (bn ? 'স্বাভাবিক সপ্তাহ' : 'Representative Week')}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-muted/60 border">
            <div className="text-[10px] text-muted-foreground font-semibold">Plant Diversity</div>
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {ffqAnalysis.summary.weekly_plant_diversity_score} / 8
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {ffqAnalysis.summary.weekly_plant_diversity_score >= 5 ? 'Good Diversity' : 'Low Plant Variety'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/60 border">
            <div className="text-[10px] text-muted-foreground font-semibold">Fruit & Veg Daily</div>
            <div className="text-base font-bold text-foreground mt-0.5">
              ~{ffqAnalysis.summary.daily_fruit_veg_servings_est} serv/day
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {ffqAnalysis.summary.daily_fruit_veg_servings_est >= 3 ? 'Adequate' : 'Below WHO target'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/60 border">
            <div className="text-[10px] text-muted-foreground font-semibold">Ultra-Processed Burden</div>
            <div className={`text-base font-bold mt-0.5 ${
              ffqAnalysis.summary.ultra_processed_burden === 'high' || ffqAnalysis.summary.ultra_processed_burden === 'very_high'
                ? 'text-rose-500'
                : 'text-emerald-500'
            }`}>
              {ffqAnalysis.summary.ultra_processed_burden.toUpperCase()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Street food / Bakery
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/60 border">
            <div className="text-[10px] text-muted-foreground font-semibold">Added Sugar & Sodium</div>
            <div className={`text-base font-bold mt-0.5 ${
              ffqAnalysis.summary.sodium_risk_flag ? 'text-amber-500' : 'text-emerald-500'
            }`}>
              {ffqAnalysis.summary.added_sugar_exposure} / {ffqAnalysis.summary.sodium_risk_flag ? 'High Na' : 'Mod Na'}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {ffqAnalysis.summary.sodium_risk_flag ? 'Table salt added' : 'Standard salt'}
            </div>
          </div>
        </div>
      </div>

      {/* Mode Sub-Tabs: FFQ Survey vs General Dietary Habits */}
      <div className="flex items-center gap-2 border-b pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('survey')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'survey'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          {bn ? 'খাদ্য ফ্রিকোয়েন্সি সমীক্ষা (খাবারভিত্তিক)' : 'Food Group Frequencies (Survey)'}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('habits')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'habits'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          {bn ? 'খাবারের সময়সূচি ও রান্না তেল/লবণ' : 'Meal Timing, Oil & Salt Habits'}
        </button>
      </div>

      {/* TAB 1: Food Group Survey */}
      {activeTab === 'survey' && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'all', label_en: 'All Foods', label_bn: 'সকল খাদ্য' },
              { id: 'grain', label_en: 'Grains & Rice', label_bn: 'চাল ও শস্য' },
              { id: 'protein', label_en: 'Proteins & Dal', label_bn: 'মাছ, মাংস, ডাল ও ডিম' },
              { id: 'vegetable', label_en: 'Vegetables & Shak', label_bn: 'শাকসবজি' },
              { id: 'fruit', label_en: 'Fruits', label_bn: 'ফলমূল' },
              { id: 'dairy', label_en: 'Milk & Yogurt', label_bn: 'দুধ ও দই' },
              { id: 'snack_sweet', label_en: 'Fried & Sweets', label_bn: 'তেলে ভাজা ও মিষ্টি' },
              { id: 'beverage', label_en: 'Tea & Drinks', label_bn: 'চা ও পানীয়' }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filterCategory === cat.id
                    ? 'bg-primary/10 text-primary border border-primary/20 font-bold'
                    : 'bg-card border text-muted-foreground hover:bg-muted'
                }`}
              >
                {bn ? cat.label_bn : cat.label_en}
              </button>
            ))}
          </div>

          {/* Food Cards */}
          <div className="space-y-3">
            {visibleFoods.map(food => {
              const currentResp = ffqItems[food.id] || { frequency: '0_times', portion_size: 'medium' };

              return (
                <div
                  key={food.id}
                  className="bg-card border rounded-2xl p-4 shadow-sm hover:border-primary/40 transition-colors space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        {bn ? food.name_bn : food.name_en}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {bn ? `প্রমাণ সার্ভিং: ${food.standardPortionDescription_bn}` : `Standard portion: ${food.standardPortionDescription_en}`}
                      </p>
                    </div>

                    {/* Portion Size Toggle */}
                    <div className="flex items-center gap-1 self-start sm:self-auto">
                      <span className="text-[10px] text-muted-foreground font-semibold mr-1">
                        {bn ? 'পরিমাণ:' : 'Portion:'}
                      </span>
                      {PORTION_OPTIONS.map(p => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => handlePortionSelect(food.id, p.value)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all ${
                            currentResp.portion_size === p.value
                              ? 'border-primary bg-primary text-primary-foreground font-bold'
                              : 'border-border text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {bn ? p.label_bn : p.label_en}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frequency Click Buttons */}
                  <div>
                    <label className="text-[10px] text-muted-foreground font-semibold block mb-1">
                      {bn ? 'গত ৭ দিনে গ্রহণের সংখ্যা:' : 'Times consumed in past 7 days:'}
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
                      {FREQUENCY_OPTIONS.map(opt => {
                        const isSelected = currentResp.frequency === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleFrequencySelect(food.id, opt.value)}
                            className={`py-1.5 px-2 rounded-xl border text-[11px] font-medium text-center transition-all ${
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground font-bold shadow-sm'
                                : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                            }`}
                          >
                            {bn ? opt.label_bn : opt.label_en}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Dietary Habits & Meal Patterns */}
      {activeTab === 'habits' && (
        <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            {bn ? 'দৈনন্দিন আহারের সময়সূচি ও রান্না তেল' : 'Meal Timing, Cooking Oil & Salt Habits'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Meal Frequency */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                {bn ? 'দৈনিক প্রধান খাবারের সংখ্যা' : 'Daily Meal Frequency'}
              </label>
              <select
                value={ffqHabits.meal_frequency_per_day}
                onChange={(e) => setFFQHabits({ ...ffqHabits, meal_frequency_per_day: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="2_meals">2 meals per day</option>
                <option value="3_meals">3 standard meals per day</option>
                <option value="3_meals_1_snack">3 meals + 1 light evening snack</option>
                <option value="4_plus_meals">4+ frequent meals</option>
              </select>
            </div>

            {/* Typical Breakfast */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                {bn ? 'সকালের নাশতার ধরন' : 'Typical Breakfast Pattern'}
              </label>
              <select
                value={ffqHabits.typical_breakfast}
                onChange={(e) => setFFQHabits({ ...ffqHabits, typical_breakfast: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="heavy_rice_or_ruti">Handmade roti with dal/egg or rice</option>
                <option value="light_tea_biscuit">Light tea and biscuits / bakery</option>
                <option value="protein_egg">Egg / protein-centered breakfast</option>
                <option value="skipped">Frequently skipped / eats directly at lunch</option>
                <option value="variable">Irregular / Variable timing</option>
              </select>
            </div>

            {/* Dinner Timing */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                {bn ? 'রাতের খাবারের স্বাভাবিক সময়' : 'Dinner Timing'}
              </label>
              <select
                value={ffqHabits.dinner_timing}
                onChange={(e) => setFFQHabits({ ...ffqHabits, dinner_timing: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="before_8_pm">Early: Before 8:00 PM (Optimal)</option>
                <option value="8_to_9_pm">Standard: 8:00 - 9:00 PM</option>
                <option value="9_to_10_pm">Late: 9:00 - 10:00 PM</option>
                <option value="after_10_pm">Very Late: After 10:00 PM</option>
              </select>
            </div>

            {/* Primary Cooking Oil */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                {bn ? 'বাসায় রান্নার প্রধান তেল' : 'Primary Household Cooking Oil'}
              </label>
              <select
                value={ffqHabits.cooking_oil_primary}
                onChange={(e) => setFFQHabits({ ...ffqHabits, cooking_oil_primary: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="mustard_oil">Pure Mustard Oil (Ghani Shorisha)</option>
                <option value="soybean_oil">Refined Commercial Soybean Oil</option>
                <option value="palm_oil">Palm Oil / Super Palm</option>
                <option value="rice_bran">Rice Bran Oil</option>
                <option value="desi_ghee">Desi Cow Ghee (Pure)</option>
                <option value="sunflower_olive">Olive Oil / Sunflower Oil</option>
              </select>
            </div>

            {/* Raw Salt at Table */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                {bn ? 'খাবার টেবিলে বাড়তি কাঁচা লবণ খান?' : 'Added Raw Salt at Table?'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'never', label_en: 'Never', label_bn: 'কখনোই না' },
                  { id: 'sometimes', label_en: 'Sometimes', label_bn: 'মাঝে মাঝে' },
                  { id: 'always', label_en: 'Always', label_bn: 'সবসময়' },
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFFQHabits({ ...ffqHabits, raw_salt_added_at_table: s.id as any })}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                      ffqHabits.raw_salt_added_at_table === s.id
                        ? 'border-primary bg-primary text-primary-foreground font-bold shadow-sm'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {bn ? s.label_bn : s.label_en}
                  </button>
                ))}
              </div>
            </div>

            {/* Is representative week? */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                {bn ? 'গত ৭ দিন কি স্বাভাবিক খাদ্যভ্যাস ছিল?' : 'Were the past 7 days typical/representative?'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFFQHabits({ ...ffqHabits, is_past_week_representative: true })}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    ffqHabits.is_past_week_representative
                      ? 'border-primary bg-primary text-primary-foreground font-bold shadow-sm'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {bn ? 'হ্যাঁ (স্বাভাবিক)' : 'Yes, Typical'}
                </button>
                <button
                  type="button"
                  onClick={() => setFFQHabits({ ...ffqHabits, is_past_week_representative: false })}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    !ffqHabits.is_past_week_representative
                      ? 'border-amber-500 bg-amber-500 text-white font-bold shadow-sm'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {bn ? 'না (ব্যতিক্রমী/দাওয়াত/অসুস্থ)' : 'No (Illness/Event)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t">
        <button
          type="button"
          onClick={() => setCurrentStep('step_functional')}
          className="px-4 py-2 border rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition-all flex items-center gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{bn ? 'পূর্ববর্তী: ফাংশনাল ডোমেন' : 'Previous: Functional Domains'}</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentStep('step_ayurveda')}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-all flex items-center gap-1.5"
        >
          <span>{bn ? 'পরবর্তী: আয়ুর্বেদিক প্রকৃতি ও অগ্নি' : 'Next: Ayurvedic Assessment'}</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
