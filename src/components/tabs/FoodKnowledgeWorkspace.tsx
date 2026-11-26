'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePractice } from '@/context/PracticeContext';
import {
  R8_BASELINE_FOODS,
  R8_CANONICAL_NUTRIENTS,
  deriveFoodMetadataExtension,
  extractFoodNutrientMeasurement,
} from '@/engine/r8/foodFoundation';
import {
  R8_BIOACTIVE_COMPOUNDS,
  R8_BIOLOGICAL_MECHANISMS,
} from '@/data/r8KnowledgeData';
import {
  evaluatePatientFoodEligibility,
  queryR8KnowledgeNetwork,
} from '@/engine/r8/knowledgeNetwork';
import { R8_PREPARATION_GUIDANCE, R8_REPRESENTATIVE_RECIPES } from '@/data/r8RecipesData';
import {
  addRecipeIngredient,
  adjustRecipeServings,
  computeRecipeAnalysis,
  createRecipeDraftFromReference,
  removeRecipeIngredient,
  replaceRecipeIngredient,
  updateRecipeIngredientQuantity,
} from '@/engine/r8/recipeEngine';
import { R8Recipe } from '@/types/r8FoodKnowledge';
import {
  AlertTriangle,
  BookOpen,
  ChefHat,
  CheckCircle2,
  FlaskConical,
  Network,
  Search,
  ShieldAlert,
  ShieldCheck,
  Utensils,
} from 'lucide-react';

type SubTab = 'food_explorer' | 'network' | 'recipes';

const CORE_DISPLAY_NUTRIENTS = [
  'energy',
  'protein',
  'available_carbohydrate',
  'total_fat',
  'dietary_fiber',
  'iron',
  'calcium',
  'potassium',
  'sodium',
  'magnesium',
  'zinc',
  'folate',
  'vitamin_c',
  'vitamin_b12',
];

export const FoodKnowledgeWorkspace: React.FC = () => {
  const {
    patient,
    currentVisit,
    language,
    trafficLight,
    r5NutritionContract,
    weeklyDietPlan,
    activeDayNumber,
    r8RecipeDrafts,
    saveR8RecipeDraft,
    includeRecipeInDietPlan,
  } = usePractice();
  const bn = language === 'bn';

  const [subTab, setSubTab] = useState<SubTab>('food_explorer');

  // Tab 1: Food Explorer state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [patientSafetyFilter, setPatientSafetyFilter] = useState<boolean>(true);
  const [selectedFoodId, setSelectedFoodId] = useState<string>('f_02_0008'); // Lentil default

  // Tab 2: Network Explorer state
  const [networkMode, setNetworkMode] = useState<
    'nutrient_to_foods' | 'bioactive_to_foods' | 'mechanism_to_foods' | 'system_to_nutrition' | 'lab_to_food_first_review'
  >('nutrient_to_foods');
  const [networkTarget, setNetworkTarget] = useState<string>('iron');

  // Tab 3: Recipe Studio state (clinician-editable draft)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(R8_REPRESENTATIVE_RECIPES[0].recipe_id);
  const [editableRecipe, setEditableRecipe] = useState<R8Recipe>(() =>
    createRecipeDraftFromReference(R8_REPRESENTATIVE_RECIPES[0])
  );
  useEffect(() => {
    const saved = r8RecipeDrafts?.[selectedRecipeId];
    if (saved) {
      setEditableRecipe(createRecipeDraftFromReference(saved));
    }
  }, [r8RecipeDrafts, selectedRecipeId]);
  const [servingMode, setServingMode] = useState<'divide_fixed_batch' | 'scale_batch'>('divide_fixed_batch');
  const [addFoodId, setAddFoodId] = useState<string>('f_04_0025');
  const [addFoodGrams, setAddFoodGrams] = useState<string>('50');
  const [recipeActionMsg, setRecipeActionMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [includeMealId, setIncludeMealId] = useState<string>('lunch');
  const [prescribedServings, setPrescribedServings] = useState<number>(1);

  const categories = useMemo(() => {
    const set = new Set<string>();
    R8_BASELINE_FOODS.forEach(f => {
      if (f.category) set.add(f.category);
    });
    return ['ALL', ...Array.from(set).sort()];
  }, []);

  const filteredFoods = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return R8_BASELINE_FOODS.filter(f => {
      if (categoryFilter !== 'ALL' && f.category !== categoryFilter) return false;
      if (q) {
        const hay = `${f.id} ${f.name_en} ${f.name_bn} ${f.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (patientSafetyFilter && patient) {
        const elig = evaluatePatientFoodEligibility(f, patient, {
          trafficLight,
        });
        if (!elig.is_safe_for_patient) return false;
      }
      return true;
    }).slice(0, 60);
  }, [searchQuery, categoryFilter, patientSafetyFilter, patient, trafficLight]);

  const selectedFood = useMemo(
    () => R8_BASELINE_FOODS.find(f => f.id === selectedFoodId) || filteredFoods[0] || R8_BASELINE_FOODS[0],
    [selectedFoodId, filteredFoods]
  );

  const selectedFoodMeta = useMemo(
    () => (selectedFood ? deriveFoodMetadataExtension(selectedFood) : null),
    [selectedFood]
  );

  const selectedFoodEligibility = useMemo(
    () =>
      selectedFood
        ? evaluatePatientFoodEligibility(selectedFood, patient, {
            trafficLight,
          })
        : null,
    [selectedFood, patient, trafficLight]
  );

  const selectedFoodNetwork = useMemo(
    () =>
      selectedFood
        ? queryR8KnowledgeNetwork({ mode: 'food_to_all', target_id: selectedFood.id, patient })
        : null,
    [selectedFood, patient]
  );

  const networkResult = useMemo(
    () =>
      queryR8KnowledgeNetwork({
        mode: networkMode,
        target_id: networkTarget,
        patient,
        limit: 12,
      }),
    [networkMode, networkTarget, patient]
  );

  const activeRecipe = editableRecipe;

  const recipeAnalysis = useMemo(
    () =>
      computeRecipeAnalysis(activeRecipe, {
        patient,
        r5NutritionContract,
        trafficLight,
      }),
    [activeRecipe, patient, r5NutritionContract, trafficLight]
  );

  const activeDayMeals = useMemo(() => {
    const day = weeklyDietPlan?.days?.find(d => d.day_number === activeDayNumber) || weeklyDietPlan?.days?.[0];
    return day?.meals || [];
  }, [weeklyDietPlan, activeDayNumber]);

  return (
    <div className="space-y-6" data-testid="r8-food-knowledge-workspace">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-subtle">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mb-2">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{bn ? 'R8 খাদ্য, পুষ্টি ও মেকানিজম নলেজ বেস' : 'R8 Food, Nutrient & Mechanism Knowledge Base'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {bn
                ? 'বাংলাদেশি খাদ্য, বায়োঅ্যাক্টিভ যৌগ ও রেসিপি বিশ্লেষণ'
                : 'Bangladeshi Food Composition, Bioactives & Recipe Intelligence'}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {bn
                ? 'FCTB V6 ভিত্তিক ৩৮১টি খাবার, অনুপস্থিত বনাম শূন্য মানের স্বচ্ছতা এবং প্রমাণ-ভিত্তিক মেকানিজম নেটওয়ার্ক।'
                : '381 FCTB V6 foods with explicit missing-vs-zero fidelity, evidence-tiered mechanisms, and patient safety filtering.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="r8-tab-food-explorer"
              onClick={() => setSubTab('food_explorer')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                subTab === 'food_explorer'
                  ? 'bg-primary text-primary-foreground border-primary shadow-subtle'
                  : 'bg-background text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              <Utensils className="h-3.5 w-3.5" />
              <span>{bn ? 'খাদ্য এক্সপ্লোরার' : 'Food Explorer'}</span>
            </button>
            <button
              type="button"
              data-testid="r8-tab-network"
              onClick={() => setSubTab('network')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                subTab === 'network'
                  ? 'bg-primary text-primary-foreground border-primary shadow-subtle'
                  : 'bg-background text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              <Network className="h-3.5 w-3.5" />
              <span>{bn ? 'নিউট্রিয়েন্ট-মেকানিজম নেটওয়ার্ক' : 'Nutrient–Mechanism Network'}</span>
            </button>
            <button
              type="button"
              data-testid="r8-tab-recipes"
              onClick={() => setSubTab('recipes')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                subTab === 'recipes'
                  ? 'bg-primary text-primary-foreground border-primary shadow-subtle'
                  : 'bg-background text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              <ChefHat className="h-3.5 w-3.5" />
              <span>{bn ? 'রেসিপি ও রান্না স্টুডিও' : 'Recipe & Prep Studio'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: FOOD EXPLORER */}
      {subTab === 'food_explorer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Search & List */}
          <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="relative">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                data-testid="r8-food-search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={bn ? 'বাংলা বা ইংরেজিতে খাবার খুঁজুন...' : 'Search foods in English or Bengali...'}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs"
              >
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c === 'ALL' ? (bn ? 'সকল শ্রেণি' : 'All Categories') : c}
                  </option>
                ))}
              </select>

              <label className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none px-2.5 py-1.5 rounded-lg border border-border bg-background">
                <input
                  type="checkbox"
                  data-testid="r8-patient-filter-toggle"
                  checked={patientSafetyFilter}
                  onChange={e => setPatientSafetyFilter(e.target.checked)}
                  className="rounded border-border"
                />
                <span>{bn ? 'রোগীর নিরাপত্তা ফিল্টার' : 'Patient Safety Filter'}</span>
              </label>
            </div>

            <div className="text-[11px] text-muted-foreground">
              {bn
                ? `দেখানো হচ্ছে ${filteredFoods.length}টি খাবার (${patient?.name || 'রোগী'})`
                : `Showing ${filteredFoods.length} food(s) for ${patient?.name || 'Active Patient'}`}
            </div>

            <div className="max-h-[480px] overflow-y-auto space-y-1.5 pr-1">
              {filteredFoods.map(food => {
                const isSelected = selectedFood?.id === food.id;
                const elig = evaluatePatientFoodEligibility(food, patient, { trafficLight });
                return (
                  <button
                    key={food.id}
                    type="button"
                    data-testid={`r8-food-item-${food.id}`}
                    onClick={() => setSelectedFoodId(food.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border/60 bg-background/60 hover:bg-muted/50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-foreground truncate">{food.name_en}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{food.name_bn}</div>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        !elig.is_safe_for_patient || elig.traffic_status === 'RED'
                          ? 'bg-rose-500/15 text-rose-600'
                          : elig.traffic_status === 'YELLOW' || elig.cautions_en.length > 0
                          ? 'bg-amber-500/15 text-amber-600'
                          : 'bg-emerald-500/15 text-emerald-600'
                      }`}
                    >
                      {!elig.is_safe_for_patient ? 'RED' : elig.traffic_status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Food Detail */}
          <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-5 space-y-4" data-testid="r8-food-detail">
            {selectedFood && (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <div className="text-[11px] font-mono text-muted-foreground">
                      {selectedFood.id} · {selectedFoodMeta?.source_version} · {selectedFoodMeta?.food_state.toUpperCase()} ({selectedFoodMeta?.measurement_basis})
                    </div>
                    <h2 className="text-lg font-bold text-foreground mt-0.5">{selectedFood.name_en}</h2>
                    <div className="text-sm text-muted-foreground">{selectedFood.name_bn}</div>
                  </div>
                  {selectedFoodEligibility && (
                    <div
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                        selectedFoodEligibility.is_safe_for_patient
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-rose-500/15 text-rose-600'
                      }`}
                    >
                      {selectedFoodEligibility.is_safe_for_patient ? (
                        <ShieldCheck className="h-4 w-4" />
                      ) : (
                        <ShieldAlert className="h-4 w-4" />
                      )}
                      <span>
                        {selectedFoodEligibility.is_safe_for_patient
                          ? `Safe (${selectedFoodEligibility.traffic_status})`
                          : 'Contraindicated / Excluded'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Patient safety advisories */}
                {selectedFoodEligibility &&
                  (selectedFoodEligibility.exclusion_reasons_en.length > 0 ||
                    selectedFoodEligibility.cautions_en.length > 0 ||
                    selectedFoodEligibility.drug_interactions_en.length > 0) && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1 text-xs">
                      {selectedFoodEligibility.exclusion_reasons_en.map((r, i) => (
                        <div key={`ex-${i}`} className="text-rose-600 font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          <span>{r}</span>
                        </div>
                      ))}
                      {selectedFoodEligibility.cautions_en.map((c, i) => (
                        <div key={`c-${i}`} className="text-amber-700 dark:text-amber-300">• {c}</div>
                      ))}
                      {selectedFoodEligibility.drug_interactions_en.map((d, i) => (
                        <div key={`d-${i}`} className="text-amber-700 dark:text-amber-300">• Drug-Food: {d}</div>
                      ))}
                    </div>
                  )}

                {/* Canonical Nutrient Table */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    {bn ? 'প্রতি ১০০ গ্রাম ভোজ্য অংশে পুষ্টিমান' : 'Canonical Composition (Per 100 g Edible Portion)'}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CORE_DISPLAY_NUTRIENTS.map(nId => {
                      const def = R8_CANONICAL_NUTRIENTS.find(d => d.canonical_id === nId);
                      const meas = extractFoodNutrientMeasurement(selectedFood, nId);
                      return (
                        <div key={nId} className="p-2.5 rounded-xl border border-border/70 bg-background/60">
                          <div className="text-[11px] text-muted-foreground truncate">{def?.label_en || nId}</div>
                          <div className="text-sm font-bold font-mono tabular-numbers mt-0.5">
                            {meas.value !== null ? (
                              <span>
                                {meas.value} {meas.unit}
                              </span>
                            ) : (
                              <span className="text-xs font-normal text-amber-600">Unavailable (FCTB null)</span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{meas.quality}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bioactives */}
                {selectedFoodNetwork && selectedFoodNetwork.bioactives && selectedFoodNetwork.bioactives.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {bn ? 'বায়োঅ্যাক্টিভ যৌগ ও প্রমাণ' : 'Documented Bioactive Compounds'}
                    </h3>
                    {selectedFoodNetwork.bioactives.map(bio => (
                      <div key={bio.compound_id} className="p-3 rounded-xl border border-border bg-muted/20 text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-foreground">{bio.name_en}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-600">
                            {bio.evidence_category.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{bio.culinary_vs_extract_note_en}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: NUTRIENT-MECHANISM NETWORK */}
      {subTab === 'network' && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-5" data-testid="r8-network-panel">
          <div className="flex flex-wrap gap-3 items-center">
            <select
              data-testid="r8-network-mode"
              value={networkMode}
              onChange={e => {
                const nextMode = e.target.value as any;
                setNetworkMode(nextMode);
                if (nextMode === 'nutrient_to_foods') setNetworkTarget('iron');
                else if (nextMode === 'bioactive_to_foods') setNetworkTarget(R8_BIOACTIVE_COMPOUNDS[0].compound_id);
                else if (nextMode === 'mechanism_to_foods') setNetworkTarget(R8_BIOLOGICAL_MECHANISMS[0].mechanism_id);
                else if (nextMode === 'system_to_nutrition') setNetworkTarget('assimilation');
                else setNetworkTarget('vitamin_b12');
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold"
            >
              <option value="nutrient_to_foods">Nutrient → Rich Bangladeshi Foods</option>
              <option value="bioactive_to_foods">Bioactive Compound → Culinary Sources</option>
              <option value="mechanism_to_foods">Biological Mechanism → Pathways & Foods</option>
              <option value="system_to_nutrition">Functional System → Nutrition Mechanisms</option>
              <option value="lab_to_food_first_review">Lab Marker → Food-First vs Escalation Review</option>
            </select>

            <select
              data-testid="r8-network-target"
              value={networkTarget}
              onChange={e => setNetworkTarget(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold min-w-[240px]"
            >
              {networkMode === 'nutrient_to_foods' &&
                R8_CANONICAL_NUTRIENTS.map(n => (
                  <option key={n.canonical_id} value={n.canonical_id}>
                    {n.label_en} ({n.canonical_unit})
                  </option>
                ))}
              {networkMode === 'bioactive_to_foods' &&
                R8_BIOACTIVE_COMPOUNDS.map(b => (
                  <option key={b.compound_id} value={b.compound_id}>
                    {b.name_en}
                  </option>
                ))}
              {networkMode === 'mechanism_to_foods' &&
                R8_BIOLOGICAL_MECHANISMS.map(m => (
                  <option key={m.mechanism_id} value={m.mechanism_id}>
                    {m.name_en}
                  </option>
                ))}
              {networkMode === 'system_to_nutrition' &&
                ['assimilation', 'defense_repair', 'energy', 'biotransformation', 'transport', 'communication', 'structural_integrity'].map(
                  sys => (
                    <option key={sys} value={sys}>
                      {sys}
                    </option>
                  )
                )}
              {networkMode === 'lab_to_food_first_review' && (
                <>
                  <option value="ferritin">Ferritin / Hemoglobin (Iron Support)</option>
                  <option value="vitamin_b12">Vitamin B12</option>
                  <option value="potassium">Serum Potassium / eGFR</option>
                  <option value="hba1c">HbA1c / Postprandial Glycemia</option>
                </>
              )}
            </select>
          </div>

          {networkResult.food_first_vs_escalation_note_en && (
            <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-xs text-foreground">
              <strong>Food-First vs Clinical Escalation: </strong>
              {networkResult.food_first_vs_escalation_note_en}
            </div>
          )}

          {networkResult.mechanisms && networkResult.mechanisms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {networkResult.mechanisms.map(mech => (
                <div key={mech.mechanism_id} className="p-3.5 rounded-xl border border-border bg-background/60 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-foreground">{mech.name_en}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        mech.is_exploratory_molecular
                          ? 'bg-purple-500/15 text-purple-600'
                          : 'bg-emerald-500/15 text-emerald-600'
                      }`}
                    >
                      {mech.is_exploratory_molecular ? 'Exploratory / Preclinical' : mech.evidence_category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{mech.summary_en}</p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    Limitation: {mech.limitations_en}
                  </p>
                </div>
              ))}
            </div>
          )}

          {networkResult.top_foods && networkResult.top_foods.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {bn ? 'শীর্ষ খাদ্য উৎস' : 'Ranked Bangladeshi Food Sources (Patient-Evaluated)'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {networkResult.top_foods.map(tf => (
                  <div key={tf.food.id} className="p-3 rounded-xl border border-border bg-background/60 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{tf.food.name_en}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{tf.food.name_bn}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold font-mono">
                        {tf.value !== null ? `${tf.value} ${tf.unit}` : 'Qualitative'}
                      </div>
                      {tf.eligibility && (
                        <div className={`text-[10px] font-bold ${tf.eligibility.is_safe_for_patient ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {tf.eligibility.is_safe_for_patient ? tf.eligibility.traffic_status : 'EXCLUDED'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: RECIPE & PREP STUDIO */}
      {subTab === 'recipes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" data-testid="r8-recipe-studio">
          <div className="lg:col-span-4 space-y-2">
            {R8_REPRESENTATIVE_RECIPES.map(r => (
              <button
                key={r.recipe_id}
                type="button"
                data-testid={`r8-recipe-select-${r.recipe_id}`}
                onClick={() => {
                  setSelectedRecipeId(r.recipe_id);
                  const savedDraft = r8RecipeDrafts?.[r.recipe_id];
                  setEditableRecipe(
                    savedDraft
                      ? createRecipeDraftFromReference(savedDraft)
                      : createRecipeDraftFromReference(r, {
                          patientId: patient?.id,
                          visitId: currentVisit?.visit_id || currentVisit?.id,
                        })
                  );
                  setRecipeActionMsg(null);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  activeRecipe.recipe_id === r.recipe_id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:bg-muted/40'
                }`}
              >
                <div className="text-xs font-bold text-foreground">{r.name_en}</div>
                <div className="text-[11px] text-muted-foreground">{r.name_bn}</div>
              </button>
            ))}

            <div className="rounded-xl border border-border bg-card p-3 space-y-2 mt-4">
              <div className="text-xs font-bold flex items-center gap-1.5">
                <FlaskConical className="h-3.5 w-3.5 text-primary" />
                <span>{bn ? 'রন্ধন ও সংরক্ষণ নির্দেশিকা' : 'Preparation Retention Notes'}</span>
              </div>
              {R8_PREPARATION_GUIDANCE.slice(0, 4).map(g => (
                <div key={g.id} className="text-[11px] border-t border-border/60 pt-1.5">
                  <div className="font-semibold text-foreground">{g.title_en}</div>
                  <div className="text-muted-foreground">{g.nutrient_retention_note_en}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">{activeRecipe.name_en}</h2>
                <div className="text-xs text-muted-foreground">
                  {activeRecipe.name_bn} · {activeRecipe.household_serving_en} ({recipeAnalysis.per_serving_weight_g} g/serving)
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  data-testid="r8-recipe-servings-mode"
                  value={servingMode}
                  onChange={e => setServingMode(e.target.value as 'divide_fixed_batch' | 'scale_batch')}
                  className="px-2 py-1 rounded-lg border border-border bg-background text-xs"
                >
                  <option value="divide_fixed_batch">Divide Fixed Batch</option>
                  <option value="scale_batch">Scale Whole Batch</option>
                </select>
                <label className="text-xs font-semibold">Servings:</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  data-testid="r8-recipe-servings-input"
                  value={activeRecipe.servings}
                  onChange={e => {
                    const nextVal = Number(e.target.value);
                    const res = adjustRecipeServings(activeRecipe, nextVal, servingMode);
                    if (res.ok) {
                      setEditableRecipe(res.recipe);
                      setRecipeActionMsg(null);
                    }
                  }}
                  className="w-16 px-2 py-1 rounded-lg border border-border bg-background text-xs font-mono text-center"
                />
                <button
                  type="button"
                  data-testid="r8-recipe-reset-btn"
                  onClick={() => {
                    const base = R8_REPRESENTATIVE_RECIPES.find(r => r.recipe_id === selectedRecipeId) || R8_REPRESENTATIVE_RECIPES[0];
                    setEditableRecipe(createRecipeDraftFromReference(base, { patientId: patient?.id, visitId: currentVisit?.visit_id || currentVisit?.id }));
                    setRecipeActionMsg({ ok: true, text: 'Reset to reference recipe.' });
                  }}
                  className="px-2.5 py-1 rounded-lg border border-border text-xs hover:bg-muted"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Clinician-Editable Ingredients */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Ingredients ({activeRecipe.ingredients.length})
              </div>
              <div className="space-y-1.5">
                {activeRecipe.ingredients.map((ing, idx) => {
                  const foodObj = R8_BASELINE_FOODS.find(f => f.id === ing.food_id);
                  return (
                    <div
                      key={`${ing.food_id}-${idx}`}
                      data-testid={`r8-recipe-ing-${idx}`}
                      className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl border border-border bg-background/60 text-xs"
                    >
                      <select
                        value={ing.food_id}
                        onChange={e => {
                          const res = replaceRecipeIngredient(activeRecipe, idx, e.target.value);
                          if (res.ok) setEditableRecipe(res.recipe);
                        }}
                        className="flex-1 min-w-[180px] px-2 py-1 rounded-lg border border-border bg-background text-xs"
                      >
                        {R8_BASELINE_FOODS.slice(0, 120).map(f => (
                          <option key={f.id} value={f.id}>
                            {f.name_en}
                          </option>
                        ))}
                        {!R8_BASELINE_FOODS.slice(0, 120).some(f => f.id === ing.food_id) && foodObj && (
                          <option value={foodObj.id}>{foodObj.name_en}</option>
                        )}
                      </select>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={5000}
                          data-testid={`r8-recipe-ing-grams-${idx}`}
                          value={ing.raw_weight_g}
                          onChange={e => {
                            const val = Number(e.target.value);
                            const res = updateRecipeIngredientQuantity(activeRecipe, idx, val);
                            if (res.ok) {
                              setEditableRecipe(res.recipe);
                              setRecipeActionMsg(null);
                            } else {
                              setRecipeActionMsg({ ok: false, text: res.reason });
                            }
                          }}
                          className="w-20 px-2 py-1 rounded-lg border border-border bg-background text-xs font-mono text-right"
                        />
                        <span className="text-muted-foreground">g</span>
                        <button
                          type="button"
                          data-testid={`r8-recipe-ing-remove-${idx}`}
                          onClick={() => setEditableRecipe(removeRecipeIngredient(activeRecipe, idx))}
                          className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-500/10 text-xs font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Ingredient Row */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <select
                  data-testid="r8-recipe-add-food-select"
                  value={addFoodId}
                  onChange={e => setAddFoodId(e.target.value)}
                  className="flex-1 min-w-[180px] px-2.5 py-1.5 rounded-xl border border-border bg-background text-xs"
                >
                  {R8_BASELINE_FOODS.slice(0, 120).map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name_en} ({f.id})
                    </option>
                  ))}
                  {['f_06_0015', 'f_09_0059', 'f_11_0001', 'f_04_0025', 'f_07_0020'].map(extraId => {
                    const ef = R8_BASELINE_FOODS.find(x => x.id === extraId);
                    if (!ef || R8_BASELINE_FOODS.slice(0, 120).some(x => x.id === extraId)) return null;
                    return (
                      <option key={ef.id} value={ef.id}>
                        {ef.name_en} ({ef.id})
                      </option>
                    );
                  })}
                </select>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  data-testid="r8-recipe-add-grams-input"
                  value={addFoodGrams}
                  onChange={e => setAddFoodGrams(e.target.value)}
                  className="w-20 px-2.5 py-1.5 rounded-xl border border-border bg-background text-xs font-mono"
                />
                <button
                  type="button"
                  data-testid="r8-recipe-add-btn"
                  onClick={() => {
                    const res = addRecipeIngredient(activeRecipe, addFoodId, Number(addFoodGrams));
                    if (res.ok) {
                      setEditableRecipe(res.recipe);
                      setRecipeActionMsg({ ok: true, text: 'Ingredient added to recipe draft.' });
                    } else {
                      setRecipeActionMsg({ ok: false, text: res.reason });
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
                >
                  Add Ingredient
                </button>
              </div>
            </div>

            {/* Allergen & Safety Propagation */}
            <div
              data-testid="r8-recipe-safety-banner"
              className={`p-3 rounded-xl border text-xs space-y-1 ${
                recipeAnalysis.safety.is_safe_for_patient
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                {recipeAnalysis.safety.is_safe_for_patient ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <span>
                  Recipe Safety: {recipeAnalysis.safety.traffic_status} · Propagated Allergens:{' '}
                  {recipeAnalysis.safety.propagated_allergens.length > 0
                    ? recipeAnalysis.safety.propagated_allergens.join(', ')
                    : 'None detected'}
                </span>
              </div>
              {recipeAnalysis.safety.hard_contraindications_en.map((h, i) => (
                <div key={i} className="font-semibold">• {h}</div>
              ))}
              {recipeAnalysis.is_nutrition_incomplete && (
                <div className="text-amber-700 dark:text-amber-300">
                  • Incomplete FCTB coverage for: {recipeAnalysis.incomplete_nutrients.join(', ')}
                </div>
              )}
            </div>

            {/* Per-serving nutrient breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" data-testid="r8-recipe-nutrients-grid">
              {['energy', 'protein', 'available_carbohydrate', 'total_fat', 'dietary_fiber', 'potassium', 'sodium', 'iron'].map(nId => {
                const sub = recipeAnalysis.nutrients[nId];
                if (!sub) return null;
                return (
                  <div key={nId} className="p-2.5 rounded-xl border border-border bg-background/60">
                    <div className="text-[11px] text-muted-foreground truncate">{sub.label_en}</div>
                    <div className="text-sm font-bold font-mono tabular-numbers">
                      {sub.per_serving} {sub.unit}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {sub.is_incomplete ? `Partial (${sub.contributing_foods_count}/${sub.total_foods_count})` : 'Complete'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save Draft & Include in Diet Plan */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  data-testid="r8-recipe-save-btn"
                  onClick={() => {
                    saveR8RecipeDraft(activeRecipe);
                    setRecipeActionMsg({ ok: true, text: 'Recipe draft saved locally for this patient/visit.' });
                  }}
                  className="px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold"
                >
                  Save Recipe Draft
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  data-testid="r8-recipe-include-meal-select"
                  value={includeMealId}
                  onChange={e => setIncludeMealId(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-border bg-background text-xs"
                >
                  {activeDayMeals.length > 0 ? (
                    activeDayMeals.map(m => (
                      <option key={m.id} value={m.id}>
                        Day {activeDayNumber} · {m.title_en}
                      </option>
                    ))
                  ) : (
                    <option value="lunch">Day {activeDayNumber} · Lunch</option>
                  )}
                </select>
                <input
                  type="number"
                  min={0.5}
                  max={4}
                  step={0.5}
                  value={prescribedServings}
                  onChange={e => setPrescribedServings(Math.max(0.5, Number(e.target.value) || 1))}
                  className="w-16 px-2 py-1.5 rounded-xl border border-border bg-background text-xs font-mono text-center"
                  title="Prescribed servings"
                />
                <button
                  type="button"
                  data-testid="r8-recipe-include-btn"
                  disabled={!recipeAnalysis.safety.is_safe_for_patient}
                  onClick={() => {
                    const targetMealId =
                      activeDayMeals.find(m => m.id === includeMealId)?.id || activeDayMeals[0]?.id || includeMealId;
                    const res = includeRecipeInDietPlan(activeDayNumber, targetMealId, activeRecipe, prescribedServings);
                    setRecipeActionMsg({
                      ok: res.ok,
                      text: res.ok ? 'Recipe included in Diet Plan draft (prior approval invalidated for review).' : (res.error || 'Blocked'),
                    });
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold"
                >
                  Include in Diet Plan
                </button>
              </div>
            </div>

            {recipeActionMsg && (
              <div
                data-testid="r8-recipe-action-msg"
                className={`p-2.5 rounded-xl text-xs font-semibold ${
                  recipeActionMsg.ok
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                }`}
              >
                {recipeActionMsg.text}
              </div>
            )}

            <div className="text-[11px] text-muted-foreground border-t border-border pt-3">
              {recipeAnalysis.provenance_note_en}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
