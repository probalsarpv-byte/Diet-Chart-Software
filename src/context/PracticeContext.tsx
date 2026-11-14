'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  FoodItem, 
  MedicineItem, 
  SupplementItem, 
  PatientProfile, 
  DietChartMeal, 
  DietChartMealItem, 
  TrafficLightResult, 
  LongitudinalVisit, 
  PatientRecord, 
  ClinicalConditionId,
  FoodExchangeItem
} from '@/types';
import foodsData from '@/data/foods.json';
import medicinesData from '@/data/medicines.json';
import supplementsData from '@/data/supplements.json';
import { calculateAnthropometrics } from '@/engine/anthropometrics';
import { analyzeFunctionalLabs } from '@/engine/labAnalyzer';
import { resolveConflicts } from '@/engine/conflictResolver';
import { evaluateDNIAndTimeline, DNIEngineResult } from '@/engine/dniEngine';
import { buildAutoScaledDietChart, getCookedDisplay, generateExchangesForFood } from '@/engine/mealScaler';
import { advanceToNextPhase } from '@/engine/phaseProgression';

const allFoods = foodsData as FoodItem[];
const allMedicines = medicinesData as MedicineItem[];
const allSupplements = supplementsData as SupplementItem[];

export interface PracticeContextType {
  language: 'bn' | 'en';
  setLanguage: (lang: 'bn' | 'en') => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  activeTab: 'intake' | 'conditions' | 'dni' | 'diet' | 'followup' | 'report';
  setActiveTab: (tab: 'intake' | 'conditions' | 'dni' | 'diet' | 'followup' | 'report') => void;

  allFoods: FoodItem[];
  allMedicines: MedicineItem[];
  allSupplements: SupplementItem[];

  patient: PatientProfile;
  updatePatient: (updates: Partial<PatientProfile>) => void;
  updateLabs: (labUpdates: Partial<PatientProfile['labs']>) => void;
  updateGutProfile: (gutUpdates: Partial<PatientProfile['gut_profile']>) => void;
  toggleCondition: (id: ClinicalConditionId) => void;
  toggleMedication: (id: string) => void;

  trafficLight: TrafficLightResult;
  dniResult: DNIEngineResult;

  dietChart: DietChartMeal[];
  updateMealItemRawGrams: (mealId: string, itemId: string, rawGrams: number) => void;
  swapMealItemAlternative: (mealId: string, itemId: string, alt: FoodExchangeItem) => void;
  removeMealItem: (mealId: string, itemId: string) => void;
  addMealItem: (mealId: string, foodId: string, rawGrams?: number) => void;
  resetDietChartToAutoScaled: () => void;

  visits: LongitudinalVisit[];
  addVisit: (visit: LongitudinalVisit) => void;
  advancePatientPhase: () => void;

  savedPatients: PatientRecord[];
  saveCurrentPatient: () => void;
  loadPatient: (id: string) => void;
  createNewPatient: () => void;
}

const PracticeContext = createContext<PracticeContextType | undefined>(undefined);

const SEED_PATIENT: PatientProfile = {
  id: 'pt_nasreen_01',
  name: "Mrs. Nasreen Akhter",
  age: 48,
  gender: 'female',
  phone: "01712-345678",
  email: "nasreen.akhter@example.com",
  visit_date: new Date().toISOString().split('T')[0],
  current_phase: 1,
  height_cm: 152,
  weight_kg: 74,
  waist_cm: 92,
  activity_level: 'sedentary',
  sleep_hours: 6,
  shift_worker: false,
  selected_conditions: ['t2d_ir', 'hypothyroid', 'fatty_liver', 'uric_acid_gout'],
  active_medications: ['med_metformin', 'med_ppi', 'med_levothyroxine'],
  gut_profile: {
    bloating: 'severe',
    acid_reflux_hypoacidity: true,
    bristol_stool_score: 2,
    energy_score: 4,
    sleep_quality_score: 5,
    digestive_fire_agni: 'mandagni'
  },
  labs: {
    fasting_glucose: 118,
    fasting_insulin: 16,
    triglycerides: 220,
    hdl: 38,
    tsh: 3.8,
    hba1c: 6.8,
    vitamin_d3: 18,
    vitamin_b12: 240,
    uric_acid: 6.8,
    alt: 38,
    lab_flags: []
  },
  calculated: {
    bmi: 32,
    bmi_category_en: "Obese (≥27.5)",
    bmi_category_bn: "স্থূলতা / ওবেসিটি (≥২৭.৫)",
    ibw_kg: 45.1,
    adjusted_bw_kg: 56.7,
    whtr: 0.61,
    whtr_risk_en: "Very High Visceral Fat & Health Risk (≥0.60)",
    whtr_risk_bn: "মারাত্মক ভিসেরাল ফ্যাট ও মেটাবলিক ঝুঁকি (≥০.৬০)",
    bmr: 1289,
    tdee: 1547,
    bmr_safe_calorie_floor: 1289,
    target_calories: 1300,
    target_protein_g: 77,
    target_carbs_g: 106,
    target_fat_g: 63,
    protein_ratio_used: "Adjusted Body Weight (1.35 g/kg of Adj BW)"
  },
  custom_clinical_notes: "দীর্ঘদিন ধরে অম্লপিত্ত, মেটফর্মিন ও গ্যাস্ট্রিকের ওষুধ সেবন। থাইরয়েড নিয়ন্ত্রণের চেষ্টা চলছে।"
};

export const PracticeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeTab, setActiveTab] = useState<'intake' | 'conditions' | 'dni' | 'diet' | 'followup' | 'report'>('intake');

  const [patient, setPatient] = useState<PatientProfile>(SEED_PATIENT);
  const [visits, setVisits] = useState<LongitudinalVisit[]>([]);
  const [dietChart, setDietChart] = useState<DietChartMeal[]>([]);
  const [savedPatients, setSavedPatients] = useState<PatientRecord[]>([]);

  // 1. Reactive Anthropometrics & Lab calculations
  useEffect(() => {
    const calculated = calculateAnthropometrics(
      patient.age,
      patient.gender,
      patient.height_cm,
      patient.weight_kg,
      patient.waist_cm,
      patient.activity_level,
      patient.selected_conditions
    );

    const analyzedLabs = analyzeFunctionalLabs(patient.labs, patient.gender);

    setPatient(prev => ({
      ...prev,
      calculated,
      labs: analyzedLabs
    }));
  }, [
    patient.age,
    patient.gender,
    patient.height_cm,
    patient.weight_kg,
    patient.waist_cm,
    patient.activity_level,
    JSON.stringify(patient.selected_conditions),
    patient.labs.fasting_glucose,
    patient.labs.fasting_insulin,
    patient.labs.triglycerides,
    patient.labs.hdl,
    patient.labs.tsh,
    patient.labs.hba1c,
    patient.labs.vitamin_d3,
    patient.labs.vitamin_b12,
    patient.labs.uric_acid,
    patient.labs.alt
  ]);

  // 2. Reactive Conflict Resolver
  const trafficLight = useMemo(() => {
    const activeMeds = allMedicines.filter(m => patient.active_medications.includes(m.id));
    return resolveConflicts(allFoods, patient.selected_conditions, activeMeds);
  }, [JSON.stringify(patient.selected_conditions), JSON.stringify(patient.active_medications)]);

  // 3. Reactive DNI & Timeline
  const dniResult = useMemo(() => {
    return evaluateDNIAndTimeline(patient, allMedicines, allSupplements);
  }, [JSON.stringify(patient.active_medications), JSON.stringify(patient.selected_conditions), patient.gut_profile.acid_reflux_hypoacidity]);

  // 4. Initialize Diet Chart
  useEffect(() => {
    if (dietChart.length === 0 && trafficLight.green.length > 0) {
      const generated = buildAutoScaledDietChart(patient, allFoods, trafficLight.green);
      setDietChart(generated);
    }
  }, [trafficLight.green.length]);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('shuddho_lang');
      if (savedLang === 'bn' || savedLang === 'en') setLanguage(savedLang);

      const savedTheme = localStorage.getItem('shuddho_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      } else {
        document.documentElement.classList.add('dark');
      }

      const saved = localStorage.getItem('shuddho_saved_patients');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedPatients(parsed);
        }
      }
    } catch (e) {
      console.warn("LocalStorage access issue:", e);
    }
  }, []);

  // Update theme class on HTML element
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('shuddho_theme', theme);
    } catch (e) {}
  }, [theme]);

  // Save language
  useEffect(() => {
    try {
      localStorage.setItem('shuddho_lang', language);
    } catch (e) {}
  }, [language]);

  // Helper functions
  const updatePatient = (updates: Partial<PatientProfile>) => {
    setPatient(prev => ({ ...prev, ...updates }));
  };

  const updateLabs = (labUpdates: Partial<PatientProfile['labs']>) => {
    setPatient(prev => ({
      ...prev,
      labs: { ...prev.labs, ...labUpdates }
    }));
  };

  const updateGutProfile = (gutUpdates: Partial<PatientProfile['gut_profile']>) => {
    setPatient(prev => ({
      ...prev,
      gut_profile: { ...prev.gut_profile, ...gutUpdates }
    }));
  };

  const toggleCondition = (id: ClinicalConditionId) => {
    setPatient(prev => {
      const exists = prev.selected_conditions.includes(id);
      const updated = exists 
        ? prev.selected_conditions.filter(c => c !== id)
        : [...prev.selected_conditions, id];
      return { ...prev, selected_conditions: updated };
    });
  };

  const toggleMedication = (id: string) => {
    setPatient(prev => {
      const exists = prev.active_medications.includes(id);
      const updated = exists 
        ? prev.active_medications.filter(m => m !== id)
        : [...prev.active_medications, id];
      return { ...prev, active_medications: updated };
    });
  };

  const updateMealItemRawGrams = (mealId: string, itemId: string, rawGrams: number) => {
    setDietChart(prev => prev.map(meal => {
      if (meal.id !== mealId) return meal;
      const updatedItems = meal.items.map(item => {
        if (item.id !== itemId) return item;
        const food = allFoods.find(f => f.id === item.food_id);
        const ratio = food ? food.raw_to_cooked_ratio : 1;
        const per100 = food ? food.per_100g : {
          kcal: (item.kcal / (item.raw_weight_g || 100)) * 100,
          protein_g: (item.protein_g / (item.raw_weight_g || 100)) * 100,
          carbs_g: (item.carbs_g / (item.raw_weight_g || 100)) * 100,
          fat_g: (item.fat_g / (item.raw_weight_g || 100)) * 100,
          fiber_g: (item.fiber_g / (item.raw_weight_g || 100)) * 100
        };
        const cookedG = Math.round(rawGrams * ratio);
        const display = food ? getCookedDisplay(food, rawGrams, cookedG) : { bn: `${cookedG} গ্রাম`, en: `${cookedG}g` };
        const mult = rawGrams / 100;
        return {
          ...item,
          raw_weight_g: rawGrams,
          cooked_weight_g: cookedG,
          cooked_display_bn: display.bn,
          cooked_display_en: display.en,
          kcal: Math.round(per100.kcal * mult),
          protein_g: Math.round(per100.protein_g * mult * 10) / 10,
          carbs_g: Math.round(per100.carbs_g * mult * 10) / 10,
          fat_g: Math.round(per100.fat_g * mult * 10) / 10,
          fiber_g: Math.round(per100.fiber_g * mult * 10) / 10
        };
      });

      const meal_calories = updatedItems.reduce((sum, i) => sum + i.kcal, 0);
      const meal_protein_g = Math.round(updatedItems.reduce((sum, i) => sum + i.protein_g, 0) * 10) / 10;
      const meal_carbs_g = Math.round(updatedItems.reduce((sum, i) => sum + i.carbs_g, 0) * 10) / 10;
      const meal_fat_g = Math.round(updatedItems.reduce((sum, i) => sum + i.fat_g, 0) * 10) / 10;

      return {
        ...meal,
        items: updatedItems,
        meal_calories,
        meal_protein_g,
        meal_carbs_g,
        meal_fat_g
      };
    }));
  };

  const swapMealItemAlternative = (mealId: string, itemId: string, alt: FoodExchangeItem) => {
    const food = allFoods.find(f => f.id === alt.food_id);
    if (!food) return;

    setDietChart(prev => prev.map(meal => {
      if (meal.id !== mealId) return meal;
      const updatedItems = meal.items.map(item => {
        if (item.id !== itemId) return item;
        const rawG = alt.raw_weight_g;
        const cookedG = Math.round(rawG * food.raw_to_cooked_ratio);
        const display = getCookedDisplay(food, rawG, cookedG);
        const mult = rawG / 100;
        return {
          id: item.id,
          food_id: food.id,
          food_name_bn: food.name_bn,
          food_name_en: food.name_en,
          category: food.category,
          raw_weight_g: rawG,
          cooked_weight_g: cookedG,
          cooked_display_bn: display.bn,
          cooked_display_en: display.en,
          kcal: Math.round(food.per_100g.kcal * mult),
          protein_g: Math.round(food.per_100g.protein_g * mult * 10) / 10,
          carbs_g: Math.round(food.per_100g.carbs_g * mult * 10) / 10,
          fat_g: Math.round(food.per_100g.fat_g * mult * 10) / 10,
          fiber_g: Math.round(food.per_100g.fiber_g * mult * 10) / 10,
          prep_note_bn: food.prep_note_bn,
          prep_note_en: food.prep_note_en,
          alternatives: generateExchangesForFood(food, rawG, allFoods, new Set(trafficLight.green.map(g => g.id)))
        };
      });

      const meal_calories = updatedItems.reduce((sum, i) => sum + i.kcal, 0);
      const meal_protein_g = Math.round(updatedItems.reduce((sum, i) => sum + i.protein_g, 0) * 10) / 10;
      const meal_carbs_g = Math.round(updatedItems.reduce((sum, i) => sum + i.carbs_g, 0) * 10) / 10;
      const meal_fat_g = Math.round(updatedItems.reduce((sum, i) => sum + i.fat_g, 0) * 10) / 10;

      return {
        ...meal,
        items: updatedItems,
        meal_calories,
        meal_protein_g,
        meal_carbs_g,
        meal_fat_g
      };
    }));
  };

  const removeMealItem = (mealId: string, itemId: string) => {
    setDietChart(prev => prev.map(meal => {
      if (meal.id !== mealId) return meal;
      const updatedItems = meal.items.filter(i => i.id !== itemId);
      return {
        ...meal,
        items: updatedItems,
        meal_calories: updatedItems.reduce((sum, i) => sum + i.kcal, 0),
        meal_protein_g: Math.round(updatedItems.reduce((sum, i) => sum + i.protein_g, 0) * 10) / 10,
        meal_carbs_g: Math.round(updatedItems.reduce((sum, i) => sum + i.carbs_g, 0) * 10) / 10,
        meal_fat_g: Math.round(updatedItems.reduce((sum, i) => sum + i.fat_g, 0) * 10) / 10
      };
    }));
  };

  const addMealItem = (mealId: string, foodId: string, rawGrams: number = 100) => {
    const food = allFoods.find(f => f.id === foodId);
    if (!food) return;

    const cookedG = Math.round(rawGrams * food.raw_to_cooked_ratio);
    const display = getCookedDisplay(food, rawGrams, cookedG);
    const mult = rawGrams / 100;

    const newItem: DietChartMealItem = {
      id: `item_${food.id}_${Date.now()}`,
      food_id: food.id,
      food_name_bn: food.name_bn,
      food_name_en: food.name_en,
      category: food.category,
      raw_weight_g: rawGrams,
      cooked_weight_g: cookedG,
      cooked_display_bn: display.bn,
      cooked_display_en: display.en,
      kcal: Math.round(food.per_100g.kcal * mult),
      protein_g: Math.round(food.per_100g.protein_g * mult * 10) / 10,
      carbs_g: Math.round(food.per_100g.carbs_g * mult * 10) / 10,
      fat_g: Math.round(food.per_100g.fat_g * mult * 10) / 10,
      fiber_g: Math.round(food.per_100g.fiber_g * mult * 10) / 10,
      prep_note_bn: food.prep_note_bn,
      prep_note_en: food.prep_note_en,
      alternatives: generateExchangesForFood(food, rawGrams, allFoods, new Set(trafficLight.green.map(g => g.id)))
    };

    setDietChart(prev => prev.map(meal => {
      if (meal.id !== mealId) return meal;
      const updatedItems = [...meal.items, newItem];
      return {
        ...meal,
        items: updatedItems,
        meal_calories: updatedItems.reduce((sum, i) => sum + i.kcal, 0),
        meal_protein_g: Math.round(updatedItems.reduce((sum, i) => sum + i.protein_g, 0) * 10) / 10,
        meal_carbs_g: Math.round(updatedItems.reduce((sum, i) => sum + i.carbs_g, 0) * 10) / 10,
        meal_fat_g: Math.round(updatedItems.reduce((sum, i) => sum + i.fat_g, 0) * 10) / 10
      };
    }));
  };

  const resetDietChartToAutoScaled = () => {
    const fresh = buildAutoScaledDietChart(patient, allFoods, trafficLight.green);
    setDietChart(fresh);
  };

  const addVisit = (visit: LongitudinalVisit) => {
    setVisits(prev => [...prev, visit]);
  };

  const advancePatientPhase = () => {
    const currentRec: PatientRecord = {
      patient,
      visits,
      current_diet_chart: dietChart,
      current_supplements: dniResult.recommendedSupplements,
      timeline: dniResult.timeline,
      updated_at: new Date().toISOString()
    };

    const advanced = advanceToNextPhase(currentRec);
    setPatient(advanced.patient);
    setVisits(advanced.visits);
    resetDietChartToAutoScaled();
  };

  const saveCurrentPatient = () => {
    const record: PatientRecord = {
      patient,
      visits,
      current_diet_chart: dietChart,
      current_supplements: dniResult.recommendedSupplements,
      timeline: dniResult.timeline,
      updated_at: new Date().toISOString()
    };

    setSavedPatients(prev => {
      const idx = prev.findIndex(p => p.patient.id === patient.id);
      let updated: PatientRecord[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = record;
      } else {
        updated = [record, ...prev];
      }
      try {
        localStorage.setItem('shuddho_saved_patients', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const loadPatient = (id: string) => {
    const match = savedPatients.find(p => p.patient.id === id);
    if (match) {
      setPatient(match.patient);
      setVisits(match.visits || []);
      setDietChart(match.current_diet_chart || []);
    }
  };

  const createNewPatient = () => {
    const newId = `pt_${Date.now()}`;
    const fresh: PatientProfile = {
      id: newId,
      name: "New Patient / নতুন রোগী",
      age: 40,
      gender: 'female',
      phone: "",
      visit_date: new Date().toISOString().split('T')[0],
      current_phase: 1,
      height_cm: 155,
      weight_kg: 65,
      waist_cm: 80,
      activity_level: 'sedentary',
      sleep_hours: 7,
      shift_worker: false,
      selected_conditions: ['t2d_ir'],
      active_medications: [],
      gut_profile: {
        bloating: 'none',
        acid_reflux_hypoacidity: false,
        bristol_stool_score: 4,
        energy_score: 7,
        sleep_quality_score: 7,
        digestive_fire_agni: 'samagni'
      },
      labs: {
        lab_flags: []
      },
      calculated: calculateAnthropometrics(40, 'female', 155, 65, 80, 'sedentary', ['t2d_ir'])
    };

    setPatient(fresh);
    setVisits([]);
    const freshChart = buildAutoScaledDietChart(fresh, allFoods, trafficLight.green);
    setDietChart(freshChart);
  };

  return (
    <PracticeContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        setTheme,
        activeTab,
        setActiveTab,
        allFoods,
        allMedicines,
        allSupplements,
        patient,
        updatePatient,
        updateLabs,
        updateGutProfile,
        toggleCondition,
        toggleMedication,
        trafficLight,
        dniResult,
        dietChart,
        updateMealItemRawGrams,
        swapMealItemAlternative,
        removeMealItem,
        addMealItem,
        resetDietChartToAutoScaled,
        visits,
        addVisit,
        advancePatientPhase,
        savedPatients,
        saveCurrentPatient,
        loadPatient,
        createNewPatient
      }}
    >
      {children}
    </PracticeContext.Provider>
  );
};

export const usePractice = () => {
  const context = useContext(PracticeContext);
  if (!context) throw new Error('usePractice must be used within PracticeProvider');
  return context;
};
