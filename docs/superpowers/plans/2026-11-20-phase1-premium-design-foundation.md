# Phase 1: Global Shell & Premium Clinical Design Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Goal
Elevate the global layout, shell styling, color palette, and navigation of the SHUDDHO Clinical Nutrition platform to a high-end, clinical-grade medical application aesthetic (inspired by Linear, modern Epic Systems UX, and Apple Health), while strictly maintaining all existing clinical engines, calculations, data models, and automated test selectors.

---

## Proposed Changes

### 1. Design System & Theme Foundations (`tailwind.config.js` & `src/app/globals.css`)
- Configure refined clinical color variables in `globals.css`:
  - Obsidian slate dark surfaces (`#090d16` canvas, `#0f172a` cards, `#1e293b` elevated surfaces)
  - Pure clinical white light surfaces (`#ffffff` card over `#f8fafc` canvas)
  - Refined surgical emerald brand tones (`#059669`, `#10b981`, `#047857`)
  - Glow and border highlight utility classes: `.glass-card`, `.glass-header`, `.clinical-glow`, `.tabular-nums`
- Update `tailwind.config.js` to expose extended box shadows (inset top-lighting highlights `inset 0 1px 0 0 rgba(255,255,255,0.06)`), refined blur, and custom borders.

### 2. Header Component Polish (`src/components/Header.tsx`)
- Enhance the clinic brand logo badge with subtle emerald pulse and clean SVG icon.
- Elevate the active patient indicator badge with smooth gradient chips while strictly preserving the selector class `header .bg-secondary/70 span.font-semibold` and button labels (`Save`, `সংরক্ষণ`, `New`, etc.).
- Refine the language and theme toggles with smooth pill hover interactions and clean iconography.

### 3. Navigation Tabs Elevation (`src/components/NavigationTabs.tsx`)
- Enhance the primary 7-tab bar with modern glowing pill indicators for the active tab (`shadow-sm ring-1 ring-emerald-500/30`).
- Elevate tab status badges (e.g. `P1 Engine`, `P2 Decision`, `7-Day Diet Planner`, `A4 Hub`) with glowing micro-indicators.
- Elevate the "Advanced Tools" secondary menu dropdown with polished backdrop blur and glass card elevation.
- Strictly preserve all `data-testid` (`nav-tab-${tab.id}`, `nav-tools-menu`, `nav-subtab-${tab.id}`) and text labels.

### 4. Persistent Patient Bar Elevation (`src/components/navigation/PersistentPatientBar.tsx`)
- Transform the patient bar into a high-tech clinical HUD (Head-Up Display).
- Add visual micro-chips for patient age, gender, active visit date, and clinical phase with glowing icons.
- Enhance the Allergy Reconciliation, Medication Reconciliation, and Hard Stop alert badges with refined glowing border rings and high-contrast clinical status indicators.
- Preserve all modal triggers, switch patient dialogs, and visit creation workflows.

---

## Verification Plan

### Automated Test Suite
Execute the full test and verification battery to prove zero regressions:
1. `npx tsc --noEmit` -> Must return 0 TypeScript errors.
2. `npm run test:step01:browser` -> Verifies Header save button and active patient name selectors.
3. `npm run test:step02:browser` -> Verifies navigation tab selectors (`nav-tab-clinical_intelligence`, `nav-tab-patients`, etc.).
4. `npm run test:step05:browser` -> Verifies diet planner tab integration and browser workflows.
5. `npm test` -> Verifies complete 814/814 unit test battery.
6. `npm run test:step05:qa` -> Verifies Python referential integrity QA suite.
7. `npm run build` -> Verifies clean Next.js 14.2.15 static export build.
