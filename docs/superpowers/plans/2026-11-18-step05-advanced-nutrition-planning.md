# Step 05: Advanced Clinical Nutrition Planning & 7-Day Personalized Diet Prescription System

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing single-day Diet Chart functionality into a comprehensive, clinician-controlled, deterministic 7-day personalized nutrition planning system with P2→P3 clinical handoff, multi-condition safety validation, day navigation, locks, persistence, clinician sign-off, and weekly A4 reporting.

**Architecture:** A layered clinical planning system that consumes verified `P3NutritionPlanningContext` from Phase P2, employs a deterministic 7-day meal rotation algorithm based on the Bangladesh Food Composition Database (FCTB), enforces safety precedence (allergies > feeding route > prescriptions > medications > disease contraindications), provides an interactive 7-day workspace with item/meal/day locks and day regeneration in `DietChartTab`, persists versioned plans in `PatientRecord` and storage, and renders clean A4 weekly reports in `ReportTab`.

**Tech Stack:** Next.js 14, React 18, TypeScript 5, Tailwind CSS, LocalStorage persistence, Playwright E2E.

**Spec:** User prompt specification for SHUDDHO Step 05.

## Global Constraints
- Zero AI-generated prescriptions: 100% deterministic, rule-based algorithms.
- Single source of truth: Patient identity, visit identity, anthropometrics, and P2 handoff.
- Reuse existing engines: `mealScaler.ts`, `conflictResolver.ts`, `diseaseRules.ts`, `foods.json`, `ReportTab.tsx`, `snapshotManager.ts`.
- Backward compatibility: Day 1 continues to synchronize with `current_diet_chart` / `dietChart` for existing consumers.
- No unprescribed inventions: Never fabricate missing sodium, potassium, protein, or fluid caps.
- Strict clinical hard-stop governance: Unresolved hard stops block final clinical approval.
- Complete patient and visit isolation: Never cross-contaminate weekly plans across patients or visits.

## Implementation Tasks

- [ ] **Task 1: Define 7-Day Weekly Nutrition Planning Data Model & Types**
  - Add `DayPlan`, `WeeklyDietPlan`, `WeeklyPlanSummary`, `DayLockState` in `src/types/index.ts` and `src/engine/weekly-plan/types.ts`.
  - Add optional `weekly_diet_plan?: WeeklyDietPlan` to `PatientRecord` in `src/types/index.ts`.
  - Ensure compatibility with existing `DietChartMeal`, `DietChartMealItem`, and `current_diet_chart`.

- [ ] **Task 2: Build Deterministic 7-Day Diet Generation Engine (`src/engine/weeklyPlanner.ts`)**
  - Create `src/engine/weeklyPlanner.ts`.
  - Implement 7-day deterministic meal generator rotating proteins, vegetables, and grains across Days 1–7.
  - Incorporate P2→P3 handoff targets (`target_calories`, `target_protein_g`, `target_carbs_g`, `target_fat_g`).
  - Enforce allergy exclusion (confirmed allergens excluded from all 7 days and all alternatives).
  - Enforce feeding route safety (flag solid foods if oral route contraindicated).
  - Enforce documented fluid restrictions (no universal 3.5L; qualify with explicit limit).
  - Support single-day regeneration preserving other days and respecting item/meal/day locks.
  - Implement full-week regeneration respecting locks.

- [ ] **Task 3: Integrate Weekly Plan State & Governance in `PracticeContext.tsx`**
  - Add `weeklyDietPlan: WeeklyDietPlan | null` and `activeDayNumber: number` (1..7) to `PracticeContextType`.
  - Add actions: `setActiveDayNumber`, `generateWeeklyPlan`, `regenerateDay`, `updateDayMealItemRawGrams`, `swapDayMealItemAlternative`, `removeDayMealItem`, `addDayMealItem`, `toggleDayLock`, `toggleMealLockInDay`, `toggleItemLockInDay`, `copyDayPlan`, `approveWeeklyPlan`.
  - Implement persist-first saving under `shuddho_weekly_plan_${patient.id}_${visitId}` and within `PatientRecord`.
  - Synchronize Day 1 meals with `dietChart` / `current_diet_chart` for seamless backward compatibility.
  - Reset / isolate weekly plan state on patient switch and new visit creation.

- [ ] **Task 4: Upgrade `DietChartTab.tsx` with 7-Day Workspace & Navigation**
  - Add top Clinical Traceability Bar with Patient ID, Visit ID, Phase, P2 Status, Target Macros, Safety Status.
  - Add 7-Day Navigation Tabs (Day 1 through Day 7) with active day indicators and lock status.
  - Implement Action Bar: Regenerate Selected Day, Regenerate Full Plan, Lock/Unlock Day, Copy Day Modal, Clinician Sign-Off.
  - Implement Day Workspace displaying active day's meals, items, cooked portions, macros, alternatives, and item/meal locks.
  - Implement Weekly Overview Matrix displaying Day 1..7 calorie/macro totals, variances, and safety status side-by-side.

- [ ] **Task 5: Extend `ReportTab.tsx` with 7-Day Clinical Nutrition Prescription**
  - Add 4th report type: `weekly_diet_plan` ("৪. ৭-দিনের সমন্বিত ডায়েট প্রেসক্রিপশন" / "4. 7-Day Weekly Diet Prescription").
  - Render full 7-day schedule with household portions, daily nutritional summaries, clinical disclaimers, and preparation notes.
  - Display draft banner if unapproved, or verified clinician approval signature if approved.
  - Enforce strict print isolation (`.print-container`, `.no-print`) so only the selected weekly report prints.

- [ ] **Task 6: Create Comprehensive Step 05 Acceptance Test Suite (`test/step05_weekly_nutrition_planning.test.ts`)**
  - Test Scenario 1: Generate valid 7-day plan from verified P3 context.
  - Test Scenario 2: 7 distinct days with meal structures and varied ingredients.
  - Test Scenario 3: Nutrient calculation accuracy and variance tracking.
  - Test Scenario 4: Allergy blocking across all 7 days and alternatives.
  - Test Scenario 5: Fluid restriction guard (no blanket 3.5L).
  - Test Scenario 6: Non-oral feeding route safety enforcement.
  - Test Scenario 7: Preservation of manual edits and item/meal/day locks during regeneration.
  - Test Scenario 8: Single-day regeneration without mutating other days.
  - Test Scenario 9: Day-to-day plan copy with safety revalidation.
  - Test Scenario 10: Patient and visit isolation (no cross-patient / cross-visit leakage).
  - Test Scenario 11: Approval governance (blocked when HARD_STOP exists).
  - Test Scenario 12: Backward compatibility with single-day `current_diet_chart`.

- [ ] **Task 7: Create Real Browser Playwright Acceptance Suite (`test/step05_browser_e2e.test.ts`)**
  - Register `"test:step05"` and `"test:step05:browser"` in `package.json`.
  - Update `"test"` and `"test:e2e"` scripts.
  - Test browser navigation to Tab 5 (Diet Planning), 7-day tab switching, meal item editing, day locking, day regeneration, approval workflow, reload persistence, and weekly report view.

- [ ] **Task 8: Full Verification & Build**
  - Run `npm run test:step05`.
  - Run `npm run test:step05:browser`.
  - Run `npm run test:step04`.
  - Run `npm test` (all 11 test suites).
  - Run `npm run test:e2e` (all 5 browser suites).
  - Run `npx tsc --noEmit`.
  - Run `npm run build`.
  - Commit to `feature/step05-advanced-nutrition-planning`.
