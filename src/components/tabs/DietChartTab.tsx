'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  CookingPot,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  AlertOctagon,
  CheckCircle2,
  AlertCircle,
  Copy,
  Calendar,
  FileText,
  Sliders,
  CheckSquare,
  Eye,
  Clock
} from 'lucide-react';
import { FoodExchangeItem, FoodItem } from '@/types';

export const DietChartTab: React.FC = () => {
  const { 
    patient, 
    currentVisit,
    p2AnalysisResult,
    dietChart, 
    isDietPlanDirty,
    recalculateDietPlan,
    dismissDirtyWarning,
    updateMealItemRawGrams, 
    swapMealItemAlternative, 
    removeMealItem, 
    addMealItem, 
    resetDietChartToAutoScaled, 
    allFoods, 
    trafficLight, 
    language,
    clinicalSafetyEvaluation,
    interventionApproval,
    approveCurrentIntervention,
    lockState,
    toggleItemLock,
    // Step 05: 7-Day Planning capabilities
    weeklyDietPlan,
    activeDayNumber,
    setActiveDayNumber,
    generateWeeklyPlan,
    regenerateDay,
    updateDayMealItemRawGrams,
    swapDayMealItemAlternative,
    removeDayMealItem,
    addDayMealItem,
    toggleDayLock,
    toggleMealLockInDay,
    toggleItemLockInDay,
    copyDayPlan,
    approveWeeklyPlan,
    weeklyPlanApprovalError,
    clearWeeklyPlanApprovalError
  } = usePractice();

  const bn = language === 'bn';
  const [selectedMealForAdd, setSelectedMealForAdd] = useState<string | null>(null);
  const [selectedFoodIdToAdd, setSelectedFoodIdToAdd] = useState<string>('');
  const [addFoodGrams, setAddFoodGrams] = useState<number>(100);
  const [foodSearchQuery, setFoodSearchQuery] = useState<string>('');
  const [foodCategoryFilter, setFoodCategoryFilter] = useState<string>('all');
  const [foodSafetyFilter, setFoodSafetyFilter] = useState<'all' | 'green' | 'yellow'>('all');

  // Copy Day Modal state
  const [isCopyModalOpen, setIsCopyModalOpen] = useState<boolean>(false);
  const [copySourceDay, setCopySourceDay] = useState<number>(activeDayNumber);
  const [copyTargetDay, setCopyTargetDay] = useState<number>(activeDayNumber === 1 ? 2 : 1);

  // Clinician Sign-Off Modal state
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState<boolean>(false);
  const [clinicianIdInput, setClinicianIdInput] = useState<string>('DR_NUTRITION_01');
  const [clinicianNotesInput, setClinicianNotesInput] = useState<string>('');
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);

  // Auto-generate weekly plan if not loaded
  useEffect(() => {
    if (!weeklyDietPlan && patient?.id) {
      generateWeeklyPlan();
    }
  }, [weeklyDietPlan, patient?.id, generateWeeklyPlan]);

  // Keep copySourceDay in sync with activeDayNumber
  useEffect(() => {
    setCopySourceDay(activeDayNumber);
    setCopyTargetDay(activeDayNumber === 1 ? 2 : 1);
  }, [activeDayNumber]);

  const currentDayPlan = weeklyDietPlan?.days?.find(d => d.day_number === activeDayNumber) || weeklyDietPlan?.days?.[0];
  const activeMeals = currentDayPlan ? currentDayPlan.meals : dietChart;

  // Active Day Totals & Variances
  const totalKcal = currentDayPlan?.summary?.calories ?? activeMeals.reduce((sum, m) => sum + m.meal_calories, 0);
  const totalProtein = currentDayPlan?.summary?.protein_g ?? Math.round(activeMeals.reduce((sum, m) => sum + m.meal_protein_g, 0) * 10) / 10;
  const totalCarbs = currentDayPlan?.summary?.carbs_g ?? Math.round(activeMeals.reduce((sum, m) => sum + m.meal_carbs_g, 0) * 10) / 10;
  const totalFat = currentDayPlan?.summary?.fat_g ?? Math.round(activeMeals.reduce((sum, m) => sum + m.meal_fat_g, 0) * 10) / 10;
  const totalFiber = currentDayPlan?.summary?.fiber_g ?? Math.round(activeMeals.reduce((sum, m) => sum + m.items.reduce((isum, item) => isum + item.fiber_g, 0), 0) * 10) / 10;
  const avgGl = currentDayPlan?.summary?.gl ?? Math.round(activeMeals.reduce((sum, m) => sum + m.meal_gl, 0));
  const totalPral = currentDayPlan?.summary?.pral ?? Math.round(activeMeals.reduce((sum, m) => sum + m.meal_pral, 0) * 10) / 10;

  const targetKcal = weeklyDietPlan?.target_macros?.calories ?? patient.calculated.target_calories;
  const targetProtein = weeklyDietPlan?.target_macros?.protein_g ?? patient.calculated.target_protein_g;
  const targetCarbs = weeklyDietPlan?.target_macros?.carbs_g ?? patient.calculated.target_carbs_g;
  const targetFat = weeklyDietPlan?.target_macros?.fat_g ?? patient.calculated.target_fat_g;

  // Step 05 Phase 6: Meal Structure, Fasting Schedule & Nutritional Adequacy
  const currentStructure = currentDayPlan?.meal_structure || weeklyDietPlan?.meal_structure || '3_meals_1_snack';
  const currentFasting = currentDayPlan?.fasting_schedule || weeklyDietPlan?.fasting_schedule;
  const currentAdequacy = currentDayPlan?.nutritional_adequacy || weeklyDietPlan?.nutritional_adequacy;

  const structureLabels: Record<string, { en: string; bn: string }> = {
    '3_meals': { en: '3 Regular Meals', bn: '৩টি নিয়মিত প্রধান আহার' },
    '3_meals_1_snack': { en: '3 Meals + 1 Snack', bn: '৩টি আহার + ১টি নাস্তা' },
    '5_meals_traditional': { en: '5 Meals (Ayurvedic/Morning Protocol)', bn: '৫টি আহার (ভোরের প্রোটোকলসহ)' },
    'intermittent_fasting_16_8': { en: '16:8 Intermittent Fasting (8h Window)', bn: '১৬:৮ ইন্টারমিটেন্ট ফাস্টিং (৮ ঘণ্টার উইন্ডো)' }
  };

  const greenIds = useMemo(() => new Set(trafficLight.green.map(g => g.id)), [trafficLight.green]);
  const yellowIds = useMemo(() => new Set(trafficLight.yellow.map(y => y.id)), [trafficLight.yellow]);
  const redIds = useMemo(() => new Set(trafficLight.red.map(r => r.id)), [trafficLight.red]);

  // Fluid Guidance: Distinguish Prescribed Limit vs Physiological Estimate vs Ad Libitum
  const fluidPrescription = p2AnalysisResult?.p3PlanningContext?.prescriptions?.fluid;
  const patientFluidRestriction = patient.clinical_safety?.fluid_restriction;
  const hasFluidLimit = Boolean(
    (fluidPrescription && fluidPrescription.hasConfirmedLimit && fluidPrescription.numericalLimit) ||
    (patientFluidRestriction && patientFluidRestriction.is_restricted && patientFluidRestriction.limit_ml)
  );
  const fluidLimitMl = (fluidPrescription?.numericalLimit) || (patientFluidRestriction?.limit_ml);
  const fluidLimitReason = (fluidPrescription?.clinicalReason) || (patientFluidRestriction?.condition) || '';

  const hasWeight = typeof patient.weight_kg === 'number' && patient.weight_kg > 0;
  const estimatedMinFluid = hasWeight ? Math.round(patient.weight_kg * 30) : null;
  const estimatedMaxFluid = hasWeight ? Math.round(patient.weight_kg * 35) : null;

  const fluidTitle = hasFluidLimit
    ? (bn ? 'ক্লিনিক্যাল তরল সীমা (নির্ধারিত):' : 'Clinical Fluid Prescription:')
    : hasWeight
    ? (bn ? 'শারীরবৃত্তীয় তরল চাহিদা (আনুমানিক ৩০-৩৫ মি.লি./কেজি):' : 'Physiological Baseline (30-35 mL/kg):')
    : (bn ? 'দৈনিক তরল হিসাব (Hydration):' : 'Hydration Guidance:');

  const fluidDisplayText = hasFluidLimit
    ? (bn ? `${fluidLimitMl} মিলি / দিন (ক্লিনিক্যাল সীমা)` : `${fluidLimitMl} mL / day (Prescribed Limit)`)
    : hasWeight
    ? (bn ? `${estimatedMinFluid} - ${estimatedMaxFluid} মিলি / দিন (অনুমান)` : `${estimatedMinFluid} - ${estimatedMaxFluid} mL / day (Advisory Baseline)`)
    : (bn ? 'স্বাভাবিক তৃষ্ণা অনুযায়ী গ্রহণ (Ad Libitum)' : 'Ad Libitum (Thirst-guided)');

  const fluidSubText = hasFluidLimit
    ? (bn ? `⚠️ চিকিৎসকের নির্দেশিত সর্বোচ্চ সীমা অতিক্রম করবেন না${fluidLimitReason ? ` (${fluidLimitReason})` : ''}` : `⚠️ Strictly capped by clinical prescription${fluidLimitReason ? ` (${fluidLimitReason})` : ''}`)
    : hasWeight
    ? (bn ? `রোগীর ওজন (${patient.weight_kg} কেজি) ভিত্তিক আনুমানিক চাহিদা; তৃষ্ণা ও আবহাওয়া অনুযায়ী গ্রহণ করুন` : `Advisory estimate for ${patient.weight_kg}kg body weight; adjust for climate and thirst`)
    : (bn ? 'কোনো বিশেষ তরল সীমাবদ্ধতা বা প্রেসক্রিপশন নির্ধারিত নেই' : 'No individual fluid restriction established');

  const fluidBadgeColor = hasFluidLimit
    ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
    : hasWeight
    ? 'border-sky-500/30 bg-sky-500/5 text-sky-700 dark:text-sky-300'
    : 'border-muted bg-muted/40 text-muted-foreground';

  // Available food categories for Add Food Modal
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    allFoods.forEach(f => {
      if (f.category) cats.add(f.category);
    });
    return Array.from(cats).sort();
  }, [allFoods]);

  // Filtered Food Candidates for Add Food Modal
  const filteredFoodCandidates = useMemo(() => {
    return allFoods.filter(f => {
      const isRed = redIds.has(f.id);
      if (foodSafetyFilter === 'green' && !greenIds.has(f.id)) return false;
      if (foodSafetyFilter === 'yellow' && !yellowIds.has(f.id)) return false;
      if (foodCategoryFilter !== 'all' && f.category !== foodCategoryFilter) return false;

      if (foodSearchQuery.trim()) {
        const q = foodSearchQuery.toLowerCase().trim();
        const matchesNameBn = (f.name_bn || '').toLowerCase().includes(q);
        const matchesNameEn = (f.name_en || '').toLowerCase().includes(q);
        const matchesCat = (f.category || '').toLowerCase().includes(q);
        return matchesNameBn || matchesNameEn || matchesCat;
      }

      if (isRed && !foodSearchQuery.trim()) return false;
      return true;
    });
  }, [allFoods, redIds, greenIds, yellowIds, foodCategoryFilter, foodSafetyFilter, foodSearchQuery]);

  const selectedFoodObj = useMemo(() => {
    if (!selectedFoodIdToAdd) return null;
    return allFoods.find(f => f.id === selectedFoodIdToAdd) || null;
  }, [allFoods, selectedFoodIdToAdd]);

  const selectedFoodTraffic = useMemo(() => {
    if (!selectedFoodObj) return null;
    if (redIds.has(selectedFoodObj.id)) return 'RED';
    if (greenIds.has(selectedFoodObj.id)) return 'GREEN';
    if (yellowIds.has(selectedFoodObj.id)) return 'YELLOW';
    return 'NEUTRAL';
  }, [selectedFoodObj, redIds, greenIds, yellowIds]);

  const handleCopyDay = () => {
    if (copySourceDay === copyTargetDay) return;
    const success = copyDayPlan(copySourceDay, copyTargetDay);
    if (success) {
      setIsCopyModalOpen(false);
      setActiveDayNumber(copyTargetDay);
    }
  };

  const handleApprovePlan = () => {
    if (!clinicianIdInput.trim()) return;
    const success = approveWeeklyPlan(clinicianIdInput.trim(), clinicianNotesInput.trim());
    if (success) {
      setApprovalFeedback(bn ? 'সফলভাবে অনুমোদিত হয়েছে!' : 'Plan successfully approved!');
      setTimeout(() => {
        setIsSignOffModalOpen(false);
        setApprovalFeedback(null);
      }, 1000);
    } else {
      setApprovalFeedback(
        weeklyPlanApprovalError || (bn 
          ? 'অনুমোদন ব্যর্থ হয়েছে। সক্রিয় হার্ড স্টপ, P2 অনুমোদন বা লাইসেন্স আইডি পরীক্ষা করুন।' 
          : 'Approval failed. Verify clinician ID, P2 assessment approval, or resolve active hard stops.')
      );
    }
  };

  const isWeeklyPlanApproved = Boolean(weeklyDietPlan && weeklyDietPlan.status === 'approved' && weeklyDietPlan.is_approved === true);
  const isRequiresReview = Boolean(weeklyDietPlan && weeklyDietPlan.status === 'requires_review');
  const hasHardStop = weeklyDietPlan?.overall_safety_status === 'HARD_STOP' || clinicalSafetyEvaluation.overallDecision === 'HARD_STOP';

  return (
    <div className="space-y-6 pb-12" data-testid="diet-chart-workspace">
      
      {/* ── Top Clinical Traceability Bar ────────────────────────────────────────── */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3" data-testid="clinical-traceability-bar">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-bold text-foreground">
                  {patient.name}
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-md bg-secondary text-muted-foreground font-mono">
                  {patient.id}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-primary/15 text-primary font-semibold">
                  {bn ? `পর্যায় ${patient.current_phase || 1}` : `Phase ${patient.current_phase || 1}`}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                <span>
                  <strong>{bn ? 'ভিজিট আইডি:' : 'Visit ID:'}</strong>{' '}
                  <span className="font-mono">{patient.current_visit_id || currentVisit?.visit_id || currentVisit?.id || 'vis_baseline'}</span>
                </span>
                <span>•</span>
                <span>
                  <strong>{bn ? 'তারিখ:' : 'Date:'}</strong> {patient.visit_date}
                </span>
                <span>•</span>
                <span>
                  <strong>{bn ? 'পি২ অবস্থা:' : 'P2 Status:'}</strong>{' '}
                  {p2AnalysisResult?.report?.isApproved ? (
                    <span className="text-emerald-500 font-semibold inline-flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      {bn ? `অনুমোদিত (${p2AnalysisResult.report.approvedBy})` : `Approved (${p2AnalysisResult.report.approvedBy})`}
                    </span>
                  ) : (
                    <span className="text-amber-500 font-semibold">
                      {bn ? 'খসড়া / ড্রাফট' : 'Pending / Draft'}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Target Macros Badge Matrix */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-2.5 py-1 rounded-lg border bg-background text-xs">
              <span className="text-muted-foreground block text-[10px]">{bn ? 'ক্যালোরি লক্ষ্য' : 'Target Cal'}</span>
              <span className="font-bold text-foreground">{targetKcal} kcal</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg border bg-background text-xs">
              <span className="text-muted-foreground block text-[10px]">{bn ? 'প্রোটিন লক্ষ্য' : 'Target Protein'}</span>
              <span className="font-bold text-emerald-500">{targetProtein}g</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg border bg-background text-xs">
              <span className="text-muted-foreground block text-[10px]">{bn ? 'শর্করা লক্ষ্য' : 'Target Carbs'}</span>
              <span className="font-bold text-blue-500">{targetCarbs}g</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg border bg-background text-xs">
              <span className="text-muted-foreground block text-[10px]">{bn ? 'চর্বি লক্ষ্য' : 'Target Fat'}</span>
              <span className="font-bold text-amber-500">{targetFat}g</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg border bg-background text-xs">
              <span className="text-muted-foreground block text-[10px]">{bn ? 'নিরাপত্তা স্থিতি' : 'Safety Status'}</span>
              <span className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${
                hasHardStop ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
              }`}>
                {weeklyDietPlan?.overall_safety_status || clinicalSafetyEvaluation.overallDecision}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Governance Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="btn-regenerate-day"
              onClick={() => regenerateDay(activeDayNumber, true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border bg-secondary/60 hover:bg-secondary text-foreground transition flex items-center gap-1.5 shadow-sm"
              title="Regenerate this specific day while keeping locked items and other days intact"
            >
              <RotateCcw className="h-3.5 w-3.5 text-primary" />
              <span>{bn ? `চলতি দিন (${activeDayNumber}) পুনঃগণনা` : `Regenerate Day ${activeDayNumber}`}</span>
            </button>

            <button
              type="button"
              data-testid="btn-regenerate-weekly-plan"
              onClick={() => generateWeeklyPlan(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition flex items-center gap-1.5 shadow-sm"
              title="Recompute all 7 days with fresh deterministic rotation"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{bn ? '৭ দিনের সম্পূর্ণ প্ল্যান তৈরি' : 'Regenerate 7-Day Plan'}</span>
            </button>

            <button
              type="button"
              data-testid="btn-lock-day"
              onClick={() => toggleDayLock(activeDayNumber)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                currentDayPlan?.is_locked || lockState.locked_days.includes(activeDayNumber)
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                  : 'bg-background hover:bg-secondary text-foreground'
              }`}
            >
              {currentDayPlan?.is_locked || lockState.locked_days.includes(activeDayNumber) ? (
                <>
                  <Lock className="h-3.5 w-3.5 text-amber-500" />
                  <span>{bn ? 'দিনটি লকড' : 'Day Locked'}</span>
                </>
              ) : (
                <>
                  <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{bn ? 'দিন লক করুন' : 'Lock Day'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              data-testid="btn-open-copy-modal"
              onClick={() => setIsCopyModalOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border bg-background hover:bg-secondary text-foreground transition flex items-center gap-1.5"
            >
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{bn ? 'অন্য দিনে কপি' : 'Copy Day'}</span>
            </button>
          </div>

          {/* Clinician Approval Button & Status Badges */}
          <div className="flex items-center gap-2">
            {isWeeklyPlanApproved ? (
              <div 
                data-testid="badge-approved-plan"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>
                  {bn 
                    ? `অনুমোদিত প্ল্যান (${weeklyDietPlan?.approved_by || 'Verified'})` 
                    : `Approved Plan (${weeklyDietPlan?.approved_by || 'Verified'})`}
                </span>
              </div>
            ) : isRequiresReview ? (
              <div className="flex items-center gap-2">
                <div 
                  data-testid="badge-requires-review"
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  title={weeklyDietPlan?.invalidation_reason ? `Invalidated: ${weeklyDietPlan.invalidation_reason}` : undefined}
                >
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  <span>{bn ? 'পুনঃনিরীক্ষণ প্রয়োজন (পরিমার্জিত)' : 'Requires Re-review (Modified)'}</span>
                </div>
                <button
                  type="button"
                  data-testid="btn-approve-weekly-plan"
                  disabled={hasHardStop}
                  onClick={() => {
                    clearWeeklyPlanApprovalError();
                    setIsSignOffModalOpen(true);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                    hasHardStop
                      ? 'bg-muted text-muted-foreground cursor-not-allowed border'
                      : 'bg-amber-600 text-white hover:bg-amber-700'
                  }`}
                  title={hasHardStop ? 'Cannot approve: Clinical hard stops exist' : 'Re-approve modified 7-day diet prescription'}
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>{bn ? 'পুনরায় অনুমোদন করুন' : 'Re-Approve Sign-Off'}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-testid="btn-approve-weekly-plan"
                disabled={hasHardStop}
                onClick={() => {
                  clearWeeklyPlanApprovalError();
                  setIsSignOffModalOpen(true);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                  hasHardStop
                    ? 'bg-muted text-muted-foreground cursor-not-allowed border'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
                title={hasHardStop ? 'Cannot approve: Clinical hard stops exist' : 'Sign-off and approve 7-day diet prescription'}
              >
                <CheckSquare className="h-3.5 w-3.5" />
                <span>{bn ? 'ক্লিনিক্যাল অনুমোদন সাইন-অফ' : 'Clinician Sign-Off'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Assessment Dirty Notification Banner ─────────────────────────────── */}
      {isDietPlanDirty && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {bn ? 'রোগীর মূল্যায়ন পরিবর্তিত হয়েছে — ডায়েট চার্ট সমন্বয় প্রয়োজন' : 'Clinical Assessment Updated — Diet Plan Synchronization Required'}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {bn 
                  ? 'রোগীর রোগ, অ্যালার্জি, ল্যাব বা পরিমাপ পরিবর্তিত হয়েছে। নতুন ক্লিনিক্যাল প্রোটোকল অনুযায়ী ডায়েট চার্টটি পুনঃগণনা করুন।' 
                  : 'Anthropometrics, conditions, allergies, or medications have changed. Re-synchronize the diet plan.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => generateWeeklyPlan(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{bn ? 'নতুন নিয়মে পুনঃগণনা' : 'Regenerate Plan'}</span>
            </button>
            <button
              type="button"
              onClick={dismissDirtyWarning}
              className="px-2 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Clinical Meal Architecture, Fasting Schedule & Nutritional Adequacy ── */}
      <div className="p-4 rounded-2xl bg-card border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Meal Structure & Fasting Window */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Meal Structure */}
          <div 
            data-testid="meal-structure-badge"
            className="px-3 py-1.5 rounded-xl border bg-secondary/40 text-xs font-semibold flex items-center gap-2"
          >
            <Utensils className="h-4 w-4 text-primary shrink-0" />
            <div>
              <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">
                {bn ? 'খাবারের কাঠামো' : 'Meal Structure'}
              </span>
              <span className="text-foreground font-bold">
                {bn ? (structureLabels[currentStructure]?.bn || currentStructure) : (structureLabels[currentStructure]?.en || currentStructure)}
              </span>
            </div>
          </div>

          {/* Fasting Schedule & Safety Panel */}
          <div
            data-testid="fasting-status-badge"
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              currentFasting?.decision_status === 'fasting_contraindicated' || (currentFasting?.reasons_en && currentFasting.reasons_en.length > 0 && !currentFasting.is_fasting)
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                : currentFasting?.is_fasting || currentStructure === 'intermittent_fasting_16_8'
                ? 'border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300'
                : 'border-slate-500/20 bg-secondary/30 text-muted-foreground'
            }`}
          >
            {currentFasting?.decision_status === 'fasting_contraindicated' ? (
              <AlertOctagon className="h-4 w-4 text-rose-500 shrink-0" />
            ) : currentFasting?.is_fasting || currentStructure === 'intermittent_fasting_16_8' ? (
              <Clock className="h-4 w-4 text-purple-500 shrink-0" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            )}
            <div>
              <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">
                {bn ? 'উপবাস মূল্যায়ন ও সময়সূচি' : 'Fasting Status & Window'}
              </span>
              <span className="font-bold">
                {currentFasting?.decision_status === 'fasting_contraindicated'
                  ? (bn ? `উপবাস নিষিদ্ধ: ${currentFasting.reasons_bn?.[0] || 'ঝুঁকিপূর্ণ'}` : `Fasting Contraindicated: ${currentFasting.reasons_en?.[0] || 'High Risk'}`)
                  : (currentFasting?.is_fasting || currentStructure === 'intermittent_fasting_16_8')
                  ? (bn ? 'উপবাস সক্রিয়: দুপুর ১২:০০ - রাত ০৮:০০ (১৬ ঘণ্টা)' : 'Active 16:8 Window: 12:00 PM – 08:00 PM (16h Fast)')
                  : (bn ? 'নিয়মিত আহার (উপবাস পরিহার্য)' : 'Regular Schedule (No Fasting)')}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Nutritional Adequacy Status Badge */}
        <div className="flex items-center gap-2">
          <div
            data-testid="nutritional-adequacy-badge"
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 shadow-sm ${
              currentAdequacy?.is_adequate !== false
                ? 'border-emerald-500/30 bg-emerald-600/15 text-emerald-700 dark:text-emerald-300'
                : 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300'
            }`}
            title={currentAdequacy?.deficits && currentAdequacy.deficits.length > 0 ? currentAdequacy.deficits.join('\n') : undefined}
          >
            {currentAdequacy?.is_adequate !== false ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            )}
            <div>
              <span className="text-[10px] opacity-80 block uppercase tracking-wider font-semibold">
                {bn ? 'পুষ্টি পর্যাপ্ততা' : 'Nutritional Adequacy'}
              </span>
              <span>
                {currentAdequacy?.is_adequate !== false
                  ? (bn ? 'পুষ্টির লক্ষ্যমাত্রা অর্জিত হয়েছে' : 'Nutritional Adequacy Achieved')
                  : (bn ? `পুষ্টির লক্ষ্যমাত্রা অর্জিত হয়নি (${currentAdequacy?.deficits_bn?.[0] || 'ঘাটতি'})` : `Nutritional Targets Not Achieved: ${currentAdequacy?.deficits?.[0] || 'Deficit'}`)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 7-Day Navigation Tabs ────────────────────────────────────────────────── */}
      <div className="bg-card border rounded-2xl p-2 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2" role="tablist">
          {[1, 2, 3, 4, 5, 6, 7].map(dayNum => {
            const dayData = weeklyDietPlan?.days?.find(d => d.day_number === dayNum);
            const isActive = activeDayNumber === dayNum;
            const isLocked = Boolean(dayData?.is_locked || lockState.locked_days.includes(dayNum));
            const calories = dayData?.summary?.calories ?? 0;
            const variance = dayData?.summary?.calorie_variance ?? 0;

            const nameBn = dayData?.day_name_bn || `${dayNum}ম দিন`;
            const nameEn = dayData?.day_name_en || `Day ${dayNum}`;

            return (
              <button
                key={dayNum}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-testid={`day-tab-${dayNum}`}
                onClick={() => setActiveDayNumber(dayNum)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between min-h-[72px] ${
                  isActive
                    ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                    : 'border-border/60 bg-background/50 hover:bg-secondary/40'
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <span className={`text-xs font-bold truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {bn ? nameBn : nameEn}
                  </span>
                  {isLocked && (
                    <span title="Day locked">
                      <Lock className="h-3 w-3 text-amber-500 shrink-0" />
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-baseline justify-between w-full">
                  <span className="text-sm font-extrabold text-foreground">
                    {calories > 0 ? calories : '—'}{' '}
                    <span className="text-[10px] font-normal text-muted-foreground">kcal</span>
                  </span>
                  {calories > 0 && (
                    <span className={`text-[10px] font-semibold ${
                      Math.abs(variance) <= 50 ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      {variance > 0 ? `+${variance}` : variance}
                    </span>
                  )}
                </div>

                {dayData?.safety_decision === 'HARD_STOP' && (
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" title="Clinical Hard Stop" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active Day Macro Targets & Nutritional Highlights ────────────────────── */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-sm text-foreground">
                {bn 
                  ? `${currentDayPlan?.day_name_bn || `দিন ${activeDayNumber}`} — পুষ্টি উপাদান ও পারিবারিক পরিমাপ`
                  : `${currentDayPlan?.day_name_en || `Day ${activeDayNumber}`} — Nutritional Matrix & Household Portions`}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {bn 
                ? 'কাঁচা গ্রাম (Raw) ও রান্না করা পারিবারিক পাত্রের মাপ (Cooked) উভয় প্রদর্শিত হচ্ছে।' 
                : 'Raw grams and cooked household portions side-by-side with 1-click food exchanges.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-muted-foreground">
              {bn ? 'সক্রিয় দিন:' : 'Active Day:'} <strong>{activeDayNumber} / 7</strong>
            </span>
          </div>
        </div>

        {/* Macro Bars Matrix */}
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
                style={{ width: `${Math.min(100, (totalKcal / Math.max(1, targetKcal)) * 100)}%` }}
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
                style={{ width: `${Math.min(100, (totalProtein / Math.max(1, targetProtein)) * 100)}%` }}
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
                style={{ width: `${Math.min(100, (totalCarbs / Math.max(1, targetCarbs)) * 100)}%` }}
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
                style={{ width: `${Math.min(100, (totalFat / Math.max(1, targetFat)) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl border bg-background space-y-1">
            <div className="text-[11px] text-muted-foreground">{bn ? 'আনুমানিক GL (প্রাক্কলিত):' : 'Estimated GL:'}</div>
            <div className="text-base font-bold text-purple-500">{avgGl}</div>
            <div className="text-[10px] text-muted-foreground font-medium">
              {avgGl < 50 ? (bn ? 'লো গ্লাইসেমিক (আদর্শ)' : 'Low (Optimal)') : (bn ? 'মাঝারি' : 'Moderate')}
            </div>
          </div>

          <div className="p-3 rounded-xl border bg-background space-y-1">
            <div className="text-[11px] text-muted-foreground">{bn ? 'PRAL স্কোর:' : 'PRAL Score:'}</div>
            <div className={`text-base font-bold ${totalPral < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {totalPral}
            </div>
            <div className="text-[10px] text-muted-foreground font-medium">
              {totalPral < 0 ? (bn ? 'ক্ষারীয় (Alkaline)' : 'Alkaline (Optimal)') : (bn ? 'অ্যাসিডিক (Acidic)' : 'Net Acidic')}
            </div>
          </div>

        </div>

        {/* P0 Foundations: BMR Energy Floor, Discretionary Oil/Ghee, Salt & Fluid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t">
          <div className="p-2.5 rounded-xl bg-muted/40 border text-xs">
            <span className="text-muted-foreground block text-[10px]">{bn ? 'বিএমআর নিরাপদ সীমা (BMR Floor):' : 'BMR Energy Floor:'}</span>
            <span className="font-bold text-foreground">{patient.calculated.bmr} kcal/day</span>
            <span className={`text-[10px] font-medium block mt-0.5 ${
              totalKcal >= patient.calculated.bmr ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
            }`}>
              {totalKcal >= patient.calculated.bmr 
                ? (bn ? '✓ বিএমআরের চেয়ে বেশি (নিরাপদ)' : '✓ Met (>= BMR)')
                : (bn ? `⚠️ ঘাটতি: ${patient.calculated.bmr - totalKcal} kcal` : `⚠️ Deficit: ${patient.calculated.bmr - totalKcal} kcal`)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/40 border text-xs">
            <span className="text-muted-foreground block text-[10px]">{bn ? 'রান্নার তেল/ঘি বরাদ্দ:' : 'Discretionary Oil/Ghee:'}</span>
            <span className="font-bold text-foreground">15g (~135 kcal)</span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              {bn ? 'সরিষার তেল / খাঁটি দেশি ঘি' : 'Mustard Oil / Pure Ghee'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/40 border text-xs">
            <span className="text-muted-foreground block text-[10px]">{bn ? 'দৈনিক বাড়তি লবণ (Discretionary Salt):' : 'Added Cooking Salt:'}</span>
            <span className="font-bold text-foreground">5g salt (~1967 mg Na)</span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              {bn ? '১ চা চামচ সমান' : '1 level teaspoon daily limit'}
            </span>
          </div>

          <div className={`p-2.5 rounded-xl border text-xs ${fluidBadgeColor}`} data-testid="hydration-guidance-card">
            <span className="text-muted-foreground block text-[10px]">{fluidTitle}</span>
            <span className="font-bold text-foreground">{fluidDisplayText}</span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              {fluidSubText}
            </span>
          </div>
        </div>
      </div>

      {/* ── Structured Meals Workspace for Selected Day ─────────────────────────── */}
      <div className="space-y-5" data-testid="active-day-meals">
        {activeMeals.map(meal => {
          const isMealLocked = Boolean(meal.is_locked || lockState.locked_meal_ids.includes(meal.id));

          return (
            <div key={meal.id} className="bg-card border rounded-2xl shadow-sm overflow-hidden" data-testid={`meal-card-${meal.id}`}>
              
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

                {/* Meal Level Badges & Actions */}
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
                    type="button"
                    data-testid={`btn-lock-meal-${meal.id}`}
                    onClick={() => toggleMealLockInDay(activeDayNumber, meal.id)}
                    className={`p-1.5 rounded-lg border text-xs transition flex items-center gap-1 ${
                      isMealLocked
                        ? 'bg-amber-500/20 text-amber-600 border-amber-500/40 font-semibold'
                        : 'bg-muted/40 text-muted-foreground hover:text-foreground border-border'
                    }`}
                    title={isMealLocked ? 'Meal locked from regeneration' : 'Lock meal'}
                  >
                    {isMealLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                    <span className="text-[10px] hidden sm:inline">{isMealLocked ? (bn ? 'লকড' : 'Locked') : (bn ? 'আনলক' : 'Lock')}</span>
                  </button>

                  <button
                    onClick={() => setSelectedMealForAdd(meal.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition"
                  >
                    <Plus className="h-3 w-3" />
                    <span>{bn ? 'খাবার যুক্ত' : 'Add Food'}</span>
                  </button>
                </div>
              </div>

              {/* Slot Constraint Errors if present */}
              {meal.slot_errors && meal.slot_errors.length > 0 && (
                <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-3 space-y-2">
                  {meal.slot_errors.map((err, errIdx) => (
                    <div key={errIdx} className="text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
                      <AlertOctagon className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block">{bn ? `খাদ্য স্লট সতর্কতা (${err.slot_name}):` : `Slot Safety Constraint (${err.slot_name}):`}</strong>
                        <span>{bn ? err.reason_bn : err.reason_en}</span>
                        {err.violated_constraints.length > 0 && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {err.violated_constraints.join(' • ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Incompatible Pair Warnings */}
              {meal.incompatible_warnings && meal.incompatible_warnings.length > 0 && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 space-y-1">
                  {meal.incompatible_warnings.map((w, wIdx) => (
                    <div key={wIdx} className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2 font-medium">
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
                      <th className="py-2.5 px-3 font-semibold text-center">{bn ? 'লক' : 'Lock'}</th>
                      <th className="py-2.5 px-3 font-semibold text-right">{bn ? 'মুছুন' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {meal.items.map(item => {
                      const isItemLocked = Boolean(item.is_locked || lockState.locked_food_ids.includes(item.id));

                      return (
                        <tr key={item.id} className="hover:bg-accent/30 transition">
                          
                          {/* Name & Prep */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                              <span>{bn ? item.food_name_bn : item.food_name_en}</span>
                              {item.traffic_status === 'YELLOW' && (
                                <span className="text-[9px] px-1 py-0.5 bg-amber-500/20 text-amber-600 rounded font-semibold">
                                  CONDITIONAL
                                </span>
                              )}
                              {item.traffic_status === 'RED' && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-rose-500 text-white rounded font-bold">
                                  CONTRAINDICATED (RED)
                                </span>
                              )}
                            </div>
                            {item.traffic_status === 'RED' && item.contraindicated_reasons && item.contraindicated_reasons.length > 0 && (
                              <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                                ⚠ {bn ? item.contraindicated_reasons_bn?.join('; ') || item.contraindicated_reasons.join('; ') : item.contraindicated_reasons.join('; ')}
                              </div>
                            )}
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
                                onChange={e => updateDayMealItemRawGrams(activeDayNumber, meal.id, item.id, Number(e.target.value))}
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
                                    onClick={() => swapDayMealItemAlternative(activeDayNumber, meal.id, item.id, alt)}
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

                          {/* Item Lock Toggle */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleItemLockInDay(activeDayNumber, item.id)}
                              className={`p-1 rounded-md border text-[10px] transition ${
                                isItemLocked
                                  ? 'bg-amber-500/20 text-amber-600 border-amber-500/40'
                                  : 'text-muted-foreground hover:text-foreground border-transparent hover:border-border'
                              }`}
                              title={isItemLocked ? 'Item locked' : 'Lock item'}
                            >
                              {isItemLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                            </button>
                          </td>

                          {/* Delete Action */}
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => removeDayMealItem(activeDayNumber, meal.id, item.id)}
                              className="p-1 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition"
                              title="Remove item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          );
        })}
      </div>

      {/* ── 7-Day Nutrition Overview Matrix ─────────────────────────────────────── */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4" data-testid="weekly-overview-matrix">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">
              {bn ? '৭ দিনের সাপ্তাহিক পুষ্টি ম্যাট্রিক্স ও সমন্বিত সামারি' : '7-Day Weekly Nutrition Matrix & Longitudinal Comparison'}
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {bn ? 'সকল দিনের ক্যালোরি ও ম্যাক্রো সামঞ্জস্য' : 'Cross-day variance and compliance summary'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" data-testid="weekly-overview-table">
            <thead className="bg-secondary/20 text-muted-foreground border-b text-[11px]">
              <tr>
                <th className="py-2.5 px-3 font-semibold">{bn ? 'দিন' : 'Day'}</th>
                <th className="py-2.5 px-3 font-semibold">{bn ? 'নাম' : 'Day Name'}</th>
                <th className="py-2.5 px-3 font-semibold">Calories (kcal)</th>
                <th className="py-2.5 px-3 font-semibold">{bn ? 'ক্যালোরি পার্থক্য' : 'Calorie Var'}</th>
                <th className="py-2.5 px-3 font-semibold">Protein (g)</th>
                <th className="py-2.5 px-3 font-semibold">Carbs (g)</th>
                <th className="py-2.5 px-3 font-semibold">Fat (g)</th>
                <th className="py-2.5 px-3 font-semibold">Est. GL</th>
                <th className="py-2.5 px-3 font-semibold">PRAL</th>
                <th className="py-2.5 px-3 font-semibold">{bn ? 'নিরাপত্তা' : 'Safety'}</th>
                <th className="py-2.5 px-3 font-semibold text-right">{bn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {[1, 2, 3, 4, 5, 6, 7].map(num => {
                const dayPlan = weeklyDietPlan?.days?.find(d => d.day_number === num);
                const isSelected = activeDayNumber === num;
                const cal = dayPlan?.summary?.calories ?? 0;
                const varCal = dayPlan?.summary?.calorie_variance ?? 0;
                const p = dayPlan?.summary?.protein_g ?? 0;
                const c = dayPlan?.summary?.carbs_g ?? 0;
                const f = dayPlan?.summary?.fat_g ?? 0;
                const gl = dayPlan?.summary?.gl ?? 0;
                const pral = dayPlan?.summary?.pral ?? 0;
                const safety = dayPlan?.safety_decision || 'SAFE';

                return (
                  <tr 
                    key={num} 
                    className={`transition cursor-pointer ${
                      isSelected ? 'bg-primary/10 font-medium' : 'hover:bg-accent/30'
                    }`}
                    onClick={() => setActiveDayNumber(num)}
                  >
                    <td className="py-2.5 px-3 font-bold text-foreground">
                      {num}
                    </td>
                    <td className="py-2.5 px-3 text-foreground">
                      {bn ? dayPlan?.day_name_bn || `${num}ম দিন` : dayPlan?.day_name_en || `Day ${num}`}
                      {dayPlan?.is_locked && <Lock className="inline h-3 w-3 ml-1 text-amber-500" />}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-foreground">
                      {cal}
                    </td>
                    <td className={`py-2.5 px-3 font-semibold ${
                      Math.abs(varCal) <= 50 ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      {varCal > 0 ? `+${varCal}` : varCal} kcal
                    </td>
                    <td className="py-2.5 px-3 text-emerald-500 font-semibold">{p}g</td>
                    <td className="py-2.5 px-3 text-blue-500 font-semibold">{c}g</td>
                    <td className="py-2.5 px-3 text-amber-500 font-semibold">{f}g</td>
                    <td className="py-2.5 px-3 text-purple-500">{gl}</td>
                    <td className={`py-2.5 px-3 font-semibold ${pral < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {pral}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        safety === 'HARD_STOP'
                          ? 'bg-rose-500 text-white'
                          : safety === 'CLINICAL_REVIEW_REQUIRED'
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-500 text-white'
                      }`}>
                        {safety}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDayNumber(num);
                        }}
                        className="px-2 py-1 rounded-md text-[11px] font-semibold bg-secondary hover:bg-secondary/80 text-foreground transition"
                      >
                        {bn ? 'দেখুন' : 'View'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Custom Food Item Modal ─────────────────────────────────────────── */}
      {selectedMealForAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="add-food-modal">
          <div className="bg-card border rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3 shrink-0">
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  {bn ? 'ক্লিনিক্যাল খাদ্য নির্বাচন ও সংযোজন' : 'Add Clinically Safe Food'}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {bn ? `নির্বাচিত মিল: ${selectedMealForAdd} • দিন: ${activeDayNumber}` : `Target Meal: ${selectedMealForAdd} • Day ${activeDayNumber}`}
                </p>
              </div>
              <button 
                onClick={() => {
                  setSelectedMealForAdd(null);
                  setSelectedFoodIdToAdd('');
                  setFoodSearchQuery('');
                }}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {/* Search & Filter Row */}
              <div className="space-y-2">
                <div>
                  <input
                    type="text"
                    data-testid="input-food-search"
                    placeholder={bn ? "খাবারের নাম বা ক্যাটাগরি খুঁজুন (বাংলা / English)..." : "Search food by name or category (Bn/En)..."}
                    value={foodSearchQuery}
                    onChange={e => setFoodSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <select
                      data-testid="select-food-category"
                      value={foodCategoryFilter}
                      onChange={e => setFoodCategoryFilter(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="all">{bn ? '-- সকল ক্যাটাগরি --' : '-- All Categories --'}</option>
                      {availableCategories.map((cat: string) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-1 shrink-0 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setFoodSafetyFilter('all')}
                      className={`px-2 py-1 rounded border transition ${foodSafetyFilter === 'all' ? 'bg-primary text-primary-foreground font-semibold' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                    >
                      {bn ? 'সকল' : 'All'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFoodSafetyFilter('green')}
                      className={`px-2 py-1 rounded border transition ${foodSafetyFilter === 'green' ? 'bg-emerald-600 text-white font-semibold' : 'bg-background hover:bg-muted text-emerald-600'}`}
                    >
                      🟢 {bn ? 'সুপারিশ' : 'Rec'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFoodSafetyFilter('yellow')}
                      className={`px-2 py-1 rounded border transition ${foodSafetyFilter === 'yellow' ? 'bg-amber-600 text-white font-semibold' : 'bg-background hover:bg-muted text-amber-600'}`}
                    >
                      🟡 {bn ? 'সতর্ক' : 'Caution'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Candidates List */}
              <div className="border rounded-lg max-h-48 overflow-y-auto divide-y bg-background/50">
                {filteredFoodCandidates.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    {bn ? 'কোনো খাবার পাওয়া যায়নি।' : 'No matching foods found.'}
                  </div>
                ) : (
                  filteredFoodCandidates.map((f: FoodItem) => {
                    const isRed = redIds.has(f.id);
                    const isGreen = greenIds.has(f.id);
                    const isYellow = yellowIds.has(f.id);
                    const isSelected = selectedFoodIdToAdd === f.id;

                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFoodIdToAdd(f.id)}
                        className={`w-full text-left p-2 text-xs flex items-center justify-between transition hover:bg-muted/60 ${
                          isSelected ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-foreground truncate">
                            {bn ? f.name_bn : f.name_en}
                            {f.name_en !== f.name_bn && (
                              <span className="text-[10px] text-muted-foreground font-normal ml-1">
                                ({bn ? f.name_en : f.name_bn})
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {f.category} • {f.per_100g.kcal} kcal, P: {f.per_100g.protein_g}g, C: {f.per_100g.carbs_g}g, F: {f.per_100g.fat_g}g
                          </div>
                        </div>

                        <div className="shrink-0 text-[10px] font-medium">
                          {isRed ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 border border-rose-500/30">
                              🔴 {bn ? 'নিষিদ্ধ' : 'Contraindicated'}
                            </span>
                          ) : isGreen ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                              🟢 {bn ? 'সুপারিশকৃত' : 'Recommended'}
                            </span>
                          ) : isYellow ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/30">
                              🟡 {bn ? 'সতর্কতা' : 'Caution'}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground border">
                              ⚪ {bn ? 'সাধারণ' : 'General'}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Selected Item Portion & Macro Preview */}
              {selectedFoodObj && (
                <div className="p-3 rounded-lg border bg-card space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-foreground">
                      {bn ? selectedFoodObj.name_bn : selectedFoodObj.name_en}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {selectedFoodObj.category}
                    </span>
                  </div>

                  {selectedFoodTraffic === 'RED' ? (
                    <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium">
                      ⛔ {bn 
                        ? 'ক্লিনিক্যাল সতর্কতা: এই খাদ্যটি রোগীর বর্তমান বায়োমার্কার বা অবস্থার সাথে সরাসরি সাংঘর্ষিক (Contraindicated)। এটি খাদ্য তালিকায় যোগ করা নিষিদ্ধ।'
                        : 'Clinical Warning: This food is strictly contraindicated for the patient\'s active clinical conditions/biomarkers. Addition is blocked.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-muted-foreground shrink-0">
                          {bn ? 'কাঁচা ওজন (গ্রাম):' : 'Raw Weight (g):'}
                        </label>
                        <input
                          type="number"
                          data-testid="input-add-food-grams"
                          step="5"
                          min="5"
                          value={addFoodGrams}
                          onChange={e => setAddFoodGrams(Number(e.target.value))}
                          className="w-24 px-2 py-1 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 text-center font-bold"
                        />
                      </div>

                      {/* Live calculated macros for portion */}
                      {addFoodGrams > 0 && (
                        <div className="text-[11px] grid grid-cols-5 gap-1 text-center bg-muted/40 p-2 rounded-lg">
                          <div>
                            <div className="text-muted-foreground text-[9px]">{bn ? 'ক্যালোরি' : 'Kcal'}</div>
                            <div className="font-semibold">{Math.round(((selectedFoodObj.per_100g.kcal ?? 0) * addFoodGrams) / 100)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-[9px]">{bn ? 'প্রোটিন' : 'Protein'}</div>
                            <div className="font-semibold">{Math.round((((selectedFoodObj.per_100g.protein_g ?? 0) * addFoodGrams) / 100) * 10) / 10}g</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-[9px]">{bn ? 'কার্ব' : 'Carbs'}</div>
                            <div className="font-semibold">{Math.round((((selectedFoodObj.per_100g.carbs_g ?? 0) * addFoodGrams) / 100) * 10) / 10}g</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-[9px]">{bn ? 'ফ্যাট' : 'Fat'}</div>
                            <div className="font-semibold">{Math.round((((selectedFoodObj.per_100g.fat_g ?? 0) * addFoodGrams) / 100) * 10) / 10}g</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-[9px]">{bn ? 'ফাইবার' : 'Fiber'}</div>
                            <div className="font-semibold">{Math.round((((selectedFoodObj.per_100g.fiber_g ?? 0) * addFoodGrams) / 100) * 10) / 10}g</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedMealForAdd(null);
                  setSelectedFoodIdToAdd('');
                  setFoodSearchQuery('');
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-secondary transition"
              >
                {bn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                data-testid="btn-submit-add-food"
                disabled={!selectedFoodIdToAdd || selectedFoodTraffic === 'RED' || addFoodGrams <= 0 || isNaN(addFoodGrams)}
                onClick={() => {
                  if (selectedFoodIdToAdd && selectedFoodTraffic !== 'RED' && addFoodGrams > 0) {
                    addDayMealItem(activeDayNumber, selectedMealForAdd, selectedFoodIdToAdd, addFoodGrams);
                    setSelectedMealForAdd(null);
                    setSelectedFoodIdToAdd('');
                    setFoodSearchQuery('');
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

      {/* ── Copy Day Modal ────────────────────────────────────────────────────── */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="copy-day-modal">
          <div className="bg-card border rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-foreground">
                {bn ? 'ডায়েট প্ল্যান কপি করুন' : 'Copy Day Meal Plan'}
              </h3>
              <button 
                onClick={() => setIsCopyModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'উৎস দিন (Source Day):' : 'Source Day:'}
                </label>
                <select
                  value={copySourceDay}
                  onChange={e => setCopySourceDay(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map(num => (
                    <option key={num} value={num}>
                      {bn ? `${num}ম দিন` : `Day ${num}`} ({weeklyDietPlan?.days?.[num - 1]?.summary?.calories || 0} kcal)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'গন্তব্য দিন (Target Day):' : 'Target Day:'}
                </label>
                <select
                  value={copyTargetDay}
                  onChange={e => setCopyTargetDay(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map(num => (
                    <option key={num} value={num} disabled={num === copySourceDay}>
                      {bn ? `${num}ম দিন` : `Day ${num}`} {num === copySourceDay ? `(${bn ? 'উৎস' : 'Source'})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-[11px] text-muted-foreground">
                {bn 
                  ? 'গন্তব্য দিনের খাবারসমূহ নতুন উপাদান আইডি দিয়ে প্রতিস্থাপিত হবে এবং সম্পূর্ণ ক্লিনিক্যাল সেফটি নিয়মাবলি পুনঃযাচাই করা হবে।' 
                  : 'Target day items will receive fresh unique IDs and undergo full safety revalidation.'}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsCopyModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-secondary transition"
              >
                {bn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                data-testid="btn-submit-copy-day"
                onClick={handleCopyDay}
                disabled={copySourceDay === copyTargetDay}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition"
              >
                {bn ? 'কপি সম্পন্ন করুন' : 'Confirm Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Clinician Sign-Off Modal ───────────────────────────────────────────── */}
      {isSignOffModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="sign-off-modal">
          <div className="bg-card border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-emerald-500" />
                <h3 className="font-bold text-sm text-foreground">
                  {bn ? '৭ দিনের ডায়েট প্রেসক্রিপশন ক্লিনিক্যাল অনুমোদন' : '7-Day Nutrition Prescription Sign-Off'}
                </h3>
              </div>
              <button 
                onClick={() => setIsSignOffModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'লাইসেন্সধারী ক্লিনিক্যাল নিউট্রিশনিস্ট / চিকিৎসক আইডি:' : 'Licensed Clinician / Nutritionist ID:'}
                </label>
                <input
                  type="text"
                  data-testid="input-clinician-id"
                  value={clinicianIdInput}
                  onChange={e => setClinicianIdInput(e.target.value)}
                  placeholder="e.g. BMDC_A-12345 or DR_NUTRITION_01"
                  className="w-full px-3 py-2 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {bn ? 'ক্লিনিক্যাল মন্তব্য / নির্দেশিকা (ঐচ্ছিক):' : 'Clinician Notes / Prescription Rationale (Optional):'}
                </label>
                <textarea
                  rows={3}
                  value={clinicianNotesInput}
                  onChange={e => setClinicianNotesInput(e.target.value)}
                  placeholder={bn ? 'রোগীর বিশেষ নির্দেশিকা লিখুন...' : 'Enter clinical directions or rationale...'}
                  className="w-full px-3 py-2 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>

              {approvalFeedback && (
                <div className={`p-2.5 rounded-lg text-xs font-semibold ${
                  approvalFeedback.includes('failed') || approvalFeedback.includes('ব্যর্থ')
                    ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                    : 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                }`}>
                  {approvalFeedback}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsSignOffModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-secondary transition"
              >
                {bn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                data-testid="btn-submit-approval"
                onClick={handleApprovePlan}
                disabled={!clinicianIdInput.trim() || hasHardStop}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition"
              >
                {bn ? 'চূড়ান্ত অনুমোদন প্রদান' : 'Approve & Sign-Off'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
