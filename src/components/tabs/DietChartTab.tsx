'use client';

import React, { useState } from 'react';
import { usePractice } from '@/context/PracticeContext';
import { 
  Utensils, 
  RotateCcw, 
  Plus, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  Sparkles, 
  Info,
  Layers,
  ChevronDown,
  CookingPot
} from 'lucide-react';
import { FoodExchangeItem } from '@/types';

export const DietChartTab: React.FC = () => {
  const { 
    patient, 
    dietChart, 
    updateMealItemRawGrams, 
    swapMealItemAlternative, 
    removeMealItem, 
    addMealItem, 
    resetDietChartToAutoScaled, 
    allFoods, 
    trafficLight, 
    language 
  } = usePractice();

  const bn = language === 'bn';
  const [selectedMealForAdd, setSelectedMealForAdd] = useState<string | null>(null);
  const [selectedFoodIdToAdd, setSelectedFoodIdToAdd] = useState<string>('');
  const [addFoodGrams, setAddFoodGrams] = useState<number>(100);

  // Compute total diet chart macros
  const totalKcal = dietChart.reduce((sum, m) => sum + m.meal_calories, 0);
  const totalProtein = Math.round(dietChart.reduce((sum, m) => sum + m.meal_protein_g, 0) * 10) / 10;
  const totalCarbs = Math.round(dietChart.reduce((sum, m) => sum + m.meal_carbs_g, 0) * 10) / 10;
  const totalFat = Math.round(dietChart.reduce((sum, m) => sum + m.meal_fat_g, 0) * 10) / 10;
  const avgGl = Math.round(dietChart.reduce((sum, m) => sum + m.meal_gl, 0));
  const totalPral = Math.round(dietChart.reduce((sum, m) => sum + m.meal_pral, 0) * 10) / 10;

  const targetKcal = patient.calculated.target_calories;
  const targetProtein = patient.calculated.target_protein_g;
  const targetCarbs = patient.calculated.target_carbs_g;
  const targetFat = patient.calculated.target_fat_g;

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Macro & Calorie Targets vs Current Chart Header */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-sm text-foreground">
                {bn ? 'অটো-স্কেলড ডায়েট চার্ট ও পুষ্টি ক্যালকুলেটর' : 'Auto-Scaled Diet Chart & Nutritional Targets'}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {bn 
                ? 'কাঁচা গ্রাম (Raw) ও রান্না করা পারিবারিক পাত্রের মাপ (Cooked) উভয় প্রদর্শিত হচ্ছে।' 
                : 'Raw grams and cooked family-pot portions side-by-side with 1-click food exchanges.'}
            </p>
          </div>

          <button
            onClick={resetDietChartToAutoScaled}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border bg-secondary/50 hover:bg-secondary text-foreground transition self-start sm:self-auto"
            title="Reset to Auto-Scaled proportions"
          >
            <RotateCcw className="h-3.5 w-3.5 text-primary" />
            <span>{bn ? 'স্বয়ংক্রিয় স্কেলিং রিস্টোর' : 'Reset Auto-Scale'}</span>
          </button>
        </div>

        {/* Comparison Target Bars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          
          <div className="p-3 rounded-xl border bg-background space-y-1">
            <div className="text-[11px] text-muted-foreground">{bn ? 'মোট ক্যালোরি:' : 'Total Calories:'}</div>
            <div className="text-base font-bold flex items-baseline justify-between">
              <span>{totalKcal} <span className="text-xs font-normal text-muted-foreground">kcal</span></span>
              <span className="text-[10px] text-muted-foreground">/ {targetKcal}</span>
            </div>
            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full ${Math.abs(totalKcal - targetKcal) <= 50 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, (totalKcal / targetKcal) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl border bg-background space-y-1">
            <div className="text-[11px] text-muted-foreground">{bn ? 'মোট প্রোটিন:' : 'Protein Target:'}</div>
            <div className="text-base font-bold flex items-baseline justify-between">
              <span className="text-emerald-500">{totalProtein} <span className="text-xs font-normal text-muted-foreground">g</span></span>
              <span className="text-[10px] text-muted-foreground">/ {targetProtein}g</span>
            </div>
            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full"
                style={{ width: `${Math.min(100, (totalProtein / targetProtein) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl border bg-background space-y-1">
            <div className="text-[11px] text-muted-foreground">{bn ? 'মোট শর্করা:' : 'Carbs Target:'}</div>
            <div className="text-base font-bold flex items-baseline justify-between">
              <span className="text-blue-500">{totalCarbs} <span className="text-xs font-normal text-muted-foreground">g</span></span>
              <span className="text-[10px] text-muted-foreground">/ {targetCarbs}g</span>
            </div>
            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full"
                style={{ width: `${Math.min(100, (totalCarbs / targetCarbs) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl border bg-background space-y-1">
            <div className="text-[11px] text-muted-foreground">{bn ? 'স্বাস্থ্যকর চর্বি:' : 'Fat Target:'}</div>
            <div className="text-base font-bold flex items-baseline justify-between">
              <span className="text-amber-500">{totalFat} <span className="text-xs font-normal text-muted-foreground">g</span></span>
              <span className="text-[10px] text-muted-foreground">/ {targetFat}g</span>
            </div>
            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full"
                style={{ width: `${Math.min(100, (totalFat / targetFat) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl border bg-background space-y-1">
            <div className="text-[11px] text-muted-foreground">{bn ? 'গ্লাইসেমিক লোড (GL):' : 'Glycemic Load:'}</div>
            <div className="text-base font-bold text-purple-500">{avgGl}</div>
            <div className="text-[10px] text-muted-foreground font-medium">
              {avgGl < 50 ? (bn ? 'লো গ্লাইসেমিক (আদর্শ)' : 'Low (Optimal)') : (bn ? 'মাঝারি' : 'Moderate')}
            </div>
          </div>

          <div className="p-3 rounded-xl border bg-background space-y-1">
            <div className="text-[11px] text-muted-foreground">{bn ? 'PRAL এসিড/ক্ষার স্কোর:' : 'PRAL Score:'}</div>
            <div className={`text-base font-bold ${totalPral < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {totalPral}
            </div>
            <div className="text-[10px] text-muted-foreground font-medium">
              {totalPral < 0 ? (bn ? 'ক্ষারীয় (Alkaline)' : 'Alkaline (Optimal)') : (bn ? 'অ্যাসিডিক (Acidic)' : 'Net Acidic')}
            </div>
          </div>

        </div>
      </div>

      {/* 2. Structured Meals Accordion / Tables */}
      <div className="space-y-5">
        {dietChart.map(meal => (
          <div key={meal.id} className="bg-card border rounded-2xl shadow-sm overflow-hidden">
            
            {/* Meal Header */}
            <div className="p-4 bg-secondary/40 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs">
                  {meal.target_time}
                </span>
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    {bn ? meal.title_bn : meal.title_en}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                    <span>{meal.meal_calories} kcal</span>
                    <span>•</span>
                    <span className="text-emerald-500">P: {meal.meal_protein_g}g</span>
                    <span>•</span>
                    <span className="text-blue-500">C: {meal.meal_carbs_g}g</span>
                    <span>•</span>
                    <span className="text-amber-500">F: {meal.meal_fat_g}g</span>
                  </div>
                </div>
              </div>

              {/* Meal Level Badges & Add Item */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/15 text-purple-500 font-semibold">
                  GL: {meal.meal_gl}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                  meal.meal_pral < 0 ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'
                }`}>
                  PRAL: {meal.meal_pral}
                </span>
                <button
                  onClick={() => setSelectedMealForAdd(meal.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition"
                >
                  <Plus className="h-3 w-3" />
                  <span>{bn ? 'খাবার যুক্ত' : 'Add Food'}</span>
                </button>
              </div>
            </div>

            {/* Incompatible Warnings Banner if present */}
            {meal.incompatible_warnings && meal.incompatible_warnings.length > 0 && (
              <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-2.5 space-y-1">
                {meal.incompatible_warnings.map((w, wIdx) => (
                  <div key={wIdx} className="text-xs text-rose-500 flex items-center gap-2 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>{bn ? w.warning_bn : w.warning_en}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/20 text-muted-foreground border-b text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">{bn ? 'খাবারের নাম' : 'Food Name'}</th>
                    <th className="py-2.5 px-3 font-semibold">{bn ? 'কাঁচা ওজন (Raw g)' : 'Raw (g)'}</th>
                    <th className="py-2.5 px-3 font-semibold">{bn ? 'রান্না করা পরিমাপ (Family Pot Portion)' : 'Cooked Household Measure'}</th>
                    <th className="py-2.5 px-3 font-semibold">Kcal</th>
                    <th className="py-2.5 px-3 font-semibold">P / C / F</th>
                    <th className="py-2.5 px-3 font-semibold">{bn ? 'নিরাপদ সমতুল্য বিকল্প (Food Exchanges)' : 'Safe Equivalents'}</th>
                    <th className="py-2.5 px-3 font-semibold text-right">{bn ? 'মুছুন' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {meal.items.map(item => (
                    <tr key={item.id} className="hover:bg-accent/30 transition">
                      
                      {/* Name & Prep */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground text-xs">
                          {bn ? item.food_name_bn : item.food_name_en}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 max-w-xs">
                          {bn ? item.prep_note_bn : item.prep_note_en}
                        </div>
                      </td>

                      {/* Raw Grams Input */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            step="5"
                            value={item.raw_weight_g}
                            onChange={e => updateMealItemRawGrams(meal.id, item.id, Number(e.target.value))}
                            className="w-16 px-2 py-1 text-xs font-semibold bg-background border rounded-lg focus:ring-1 focus:ring-primary text-center"
                          />
                          <span className="text-[11px] text-muted-foreground">g</span>
                        </div>
                      </td>

                      {/* Cooked Display */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <CookingPot className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span>{bn ? item.cooked_display_bn : item.cooked_display_en}</span>
                        </div>
                      </td>

                      {/* Kcal */}
                      <td className="py-3 px-3 font-bold text-foreground">
                        {item.kcal}
                      </td>

                      {/* Macros */}
                      <td className="py-3 px-3 text-[11px]">
                        <span className="text-emerald-500 font-semibold">{item.protein_g}p</span> / 
                        <span className="text-blue-500 font-semibold"> {item.carbs_g}c</span> / 
                        <span className="text-amber-500 font-semibold"> {item.fat_g}f</span>
                      </td>

                      {/* Food Exchange Alternatives */}
                      <td className="py-3 px-3">
                        {item.alternatives && item.alternatives.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {item.alternatives.slice(0, 3).map((alt, aIdx) => (
                              <button
                                key={aIdx}
                                type="button"
                                onClick={() => swapMealItemAlternative(meal.id, item.id, alt)}
                                title={bn ? `${alt.name_bn} (${alt.cooked_display_bn}) দিয়ে বদলান` : `Swap with ${alt.name_en}`}
                                className="px-2 py-0.5 rounded-lg border bg-background hover:bg-primary/10 hover:border-primary text-[10px] text-muted-foreground hover:text-primary transition flex items-center gap-1"
                              >
                                <RefreshCw className="h-2.5 w-2.5" />
                                <span>{bn ? alt.name_bn : alt.name_en} ({alt.raw_weight_g}g)</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">
                            {bn ? 'অনন্য উপাদান' : 'Standard staple'}
                          </span>
                        )}
                      </td>

                      {/* Delete Action */}
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => removeMealItem(meal.id, item.id)}
                          className="p-1 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        ))}
      </div>

      {/* 3. Add Custom Food Item Modal */}
      {selectedMealForAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-foreground">
                {bn ? 'খাবারের তালিকা থেকে যোগ করুন' : 'Add Food from Database'}
              </h3>
              <button 
                onClick={() => setSelectedMealForAdd(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'খাবার নির্বাচন করুন (সবুজ বা নিরাপদ খাবার অগ্রাধিকার দিন):' : 'Select Food Item:'}
                </label>
                <select
                  value={selectedFoodIdToAdd}
                  onChange={e => setSelectedFoodIdToAdd(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">{bn ? '-- খাবার বাছাই করুন --' : '-- Choose Food --'}</option>
                  {allFoods.map(f => (
                    <option key={f.id} value={f.id}>
                      {bn ? f.name_bn : f.name_en} ({f.per_100g.kcal} kcal/100g)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'কাঁচা ওজন (গ্রাম):' : 'Raw Weight (Grams):'}
                </label>
                <input
                  type="number"
                  step="5"
                  min="5"
                  value={addFoodGrams}
                  onChange={e => setAddFoodGrams(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setSelectedMealForAdd(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-secondary transition"
              >
                {bn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={!selectedFoodIdToAdd}
                onClick={() => {
                  if (selectedFoodIdToAdd) {
                    addMealItem(selectedMealForAdd, selectedFoodIdToAdd, addFoodGrams);
                    setSelectedMealForAdd(null);
                    setSelectedFoodIdToAdd('');
                  }
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition"
              >
                {bn ? 'যুক্ত করুন' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

