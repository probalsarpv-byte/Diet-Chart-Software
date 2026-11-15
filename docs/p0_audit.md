# Shuddho Functional Nutrition Software
## Phase P0 Comprehensive Repository Audit Baseline

**Date:** 2026-11-15  
**Active Branch:** `feature/p0-clinical-safety-foundation-v2`  
**Repository:** https://github.com/probalsarpv-byte/Diet-Chart-Software  

---

### 1. Executive Status Matrix

| Module / Component | File Location | Status | Audit Findings & Next Steps |
| :--- | :--- | :---: | :--- |
| **Root Application Shell** | `src/app/page.tsx`, `layout.tsx` | **Implemented and Verified** | Next.js 14 App Router, dynamic bilingual fonts, clean navigation state. All 8 clinical tabs mounted. |
| **Navigation & Tab Routing** | `src/components/NavigationTabs.tsx` | **Implemented and Verified** | Responsive tab bar with Bengali & English labels. Clean transition states across clinical workflows. |
| **Patient Registration & Intake** | `src/components/tabs/IntakeTab.tsx` | **Partially Implemented** | Anthropometrics, BMR/TDEE calculation and lab intake present. Needs multiple clinical pathways selection (metabolic, oncology, renal, surgical) and feeding route input. |
| **Functional Assessment Intake** | `src/components/tabs/AssessmentTab.tsx` | **Implemented and Verified** | 14-domain functional assessment wizard with quick screening (17 questions) and comprehensive (49 questions) modes. Uses patient-isolated storage. |
| **Disease Traffic Light & Rules** | `src/components/tabs/ConditionsTab.tsx`, `src/engine/diseaseRules.ts` | **Implemented and Verified** | 7 core conditions, multi-condition intersection engine (RED > YELLOW > GREEN). Non-overrideable allergen safety. |
| **Drug-Nutrient Interactions** | `src/components/tabs/DNITab.tsx`, `src/engine/dniEngine.ts` | **Partially Implemented** | Currently models 6 core medicines. Needs integration with MediNutrition corpus (32,461 brands, 4,994 generics) and high-priority medication safety rules. |
| **Diet Chart & Food Exchange** | `src/components/tabs/DietChartTab.tsx`, `src/engine/mealScaler.ts` | **Partially Implemented** | Interactive meal slots and exchanges. Preserves newly contraindicated RED foods. Needs daily actual energy validation against BMR floor, fluid accounting, and discretionary oil/salt tracking. |
| **Longitudinal Follow-up** | `src/components/tabs/FollowUpTab.tsx`, `src/engine/phaseProgression.ts` | **Implemented and Verified** | Longitudinal comparison, weight delta, symptom relief tracking. Phase transition criteria are non-fabricated. |
| **Clinical Intelligence Engine (P2)** | `src/components/p2/`, `src/engine/p2/` | **Implemented and Verified** | 26 evidence-backed rules across 10 hypothesis clusters, 7 functional matrix domains, clinician governance, red flags auto-intervention block. |
| **Printable Report Engine** | `src/components/tabs/ReportTab.tsx` | **Implemented and Verified** | A4 bilingual clinical report. Hard safety block: printing/exporting is disabled if any meal item is RED. |
| **State & Persistence Layer** | `src/context/PracticeContext.tsx` | **Partially Implemented** | Patient-specific state, diet recalculation, allergen checks. Needs central Clinical Safety Engine integration, feeding route safety, and intervention versioning. |
| **Declarative Question Engine** | `src/engine/questionEngine.ts` | **Implemented and Verified** | Zero `eval()`, zero `new Function()`. Declarative AST evaluator for conditional branching. |
| **Food Composition Database** | `src/data/foods.json`, `src/data/raw/bangladesh_foods_raw.json` | **Partially Implemented (Critical Bug Found)** | 381 foods present, but in `foods.json` missing values were silently converted to `0` (29 missing kcals, 63 missing potassium values), and `phosphorus_mg` is omitted. Must migrate to explicit `null` / unavailable values and add phosphorus. |
| **Medicine Database** | `src/data/medicines.json` | **Partially Implemented** | Contains only 6 curated medicines. Raw MediNutrition corpus (32,461 brands, 4,994 generics) needs to be indexed into a lightweight client search engine. |
| **Clinical Safety Engine** | `src/clinical-safety/` | **Missing (Core P0 Deliverable)** | Centralized safety engine with standardized safety results (HARD STOP, CLINICAL REVIEW REQUIRED, ADVISORY, ELIGIBLE FOR APPROVAL), feeding route safety, fasting eligibility, and multi-nutrient constraints. |
| **Ayurvedic Prakriti–Vikriti Layer** | `src/types/index.ts` | **Partially Implemented** | Agni type and basic gut profile exist. Separate Prakriti, Vikriti, Dosha attributes (Rasa, Guna, Virya, Vipaka), and integration contracts needed. |
| **Intervention Versioning & Locking** | `src/types/index.ts` | **Missing (Core P0 Deliverable)** | Support for intervention draft, approval, revision history, and item locking (food, meal, day, section). |

---

### 2. Immediate Action Plan (P0.2 – P0.10)
1. **P0.2:** Unify clinical data architecture in `src/types/clinical.ts` and `src/types/index.ts` with foundational entities, multiple clinical pathways, feeding routes, and schema versioning.
2. **P0.3:** Fix `src/data/foods.json` with Food Composition V6 data: add phosphorus, water, and full micronutrient profiles; strictly preserve `null` for missing values (never substitute 0).
3. **P0.4:** Build lightweight, high-performance medicine search index and normalization service using MediNutrition corpus (32,461 brands, 4,994 generics).
4. **P0.5:** Construct `src/clinical-safety/` engine with standardized decision levels, global safety precedence, and high-priority medication rules (Insulin, Sulfonylureas, SGLT2i, GLP1RA, Diuretics, ACEi/ARBs, Warfarin, Levothyroxine, Phosphate Binders, Corticosteroids).
5. **P0.6:** Implement daily calorie BMR floor enforcement, fluid accounting (mL non-duplicate), sodium/salt conversion, and discretionary oil/ghee accounting.
6. **P0.7:** Implement intervention draft, approval, revision tracking, and item locking.
7. **P0.8:** Establish separate Prakriti and Vikriti structures with Ayurvedic food compatibility contracts.
8. **P0.9 & P0.10:** Expand automated tests, verify builds, document data sources, and commit verified milestones.
