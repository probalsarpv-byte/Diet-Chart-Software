# SHUDDHO CLINICAL ATELIER — UI/UX Design System Specification (v2.0)

## 1. Executive Summary & Philosophy
**SHUDDHO Clinical Atelier** is a unified, high-precision visual design system engineered specifically for clinical dietitians, functional medicine physicians, and metabolic health specialists. Combining the calm restraint of modern medical software with the high craft of interfaces like Linear and Apple Health, the Atelier design system delivers maximum readability, zero sensory clutter, and absolute clinical confidence.

---

## 2. Token-Based Color Palette

### 2.1 Theme Specifications
| Semantic Token | Light Theme Value | Dark Theme Value | Clinical Purpose |
| :--- | :--- | :--- | :--- |
| **Background** | `#F5F8F7` | `#08141A` | Main page canvas; restful, low-glare surface |
| **Surface (Card)** | `#FFFFFF` | `#10212A` | Primary container background for metrics and forms |
| **Elevated Surface**| `#FFFFFF` | `#162B34` | Modals, dropdowns, and floating inspectors |
| **Primary** | `#047857` (Emerald 700) | `#35C6A0` (Teal 400) | Brand accent, primary CTAs, active highlights |
| **Primary Hover** | `#065F46` (Emerald 800) | `#2AB38F` (Teal 500) | Hover state for primary interactive elements |
| **Text (Foreground)** | `#10212B` | `#EBF5F3` | High-contrast clinical data, headings, primary labels |
| **Muted Text** | `#526671` | `#A7BEC4` | Descriptive labels, units, clinical metadata |
| **Border / Divider** | `#DFE7E7` | `#29404A` | Clean structural delineation without harsh contrast |

### 2.2 Semantic Clinical Indicators
| Status | Token Base | Light Representation | Dark Representation | Usage Rule |
| :--- | :--- | :--- | :--- | :--- |
| **Success / Safe** | Emerald | `emerald-600` / `bg-emerald-500/10` | `emerald-400` / `bg-emerald-500/15` | Safe foods, met targets, verified sign-offs |
| **Warning / Review**| Amber | `amber-600` / `bg-amber-500/10` | `amber-400` / `bg-amber-500/15` | Conditional foods, required re-reviews |
| **Critical / Danger** | Clinical Red | `rose-600` / `bg-rose-500/10` | `rose-400` / `bg-rose-500/15` | Hard stops, contraindicated foods, red flags |
| **Information** | Ocean Blue | `blue-600` / `bg-blue-500/10` | `blue-400` / `bg-blue-500/15` | Advisory guidelines, carbs distribution |
| **Neutral** | Slate / Gray | `slate-600` / `bg-slate-500/10` | `slate-400` / `bg-slate-500/15` | Default secondary state, uncalculated vitals |

---

## 3. Typography Architecture

### 3.1 Font Families
- **English & Numeric Data:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`
- **Bangla Script:** `Hind Siliguri`, `Noto Sans Bengali`, `sans-serif`
- **Biomarkers, Dosages & Code:** `ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `monospace`

### 3.2 Typographic Scale & Rhythm
- **Page Titles (Display):** 24–28px, semi-bold to bold (`font-bold tracking-tight`)
- **Section Headers (H2/H3):** 16–20px, bold (`font-bold text-foreground`)
- **Card Subheadings (H4):** 13–14px, medium to semi-bold (`font-semibold text-foreground`)
- **Body Text:** 14–16px, regular to medium (`text-sm text-foreground` or `text-base leading-relaxed`)
- **Clinical Data & Metrics:** 14–18px, bold font-mono with `tabular-numbers`
- **Metadata, Units & Footnotes:** 11–12px, medium (`text-xs text-muted-foreground`)
- **Badges & Micro-tags:** 10–11px, bold uppercase tracking-wider (`text-[10px] font-bold`)

---

## 4. Layered 3D Elevation & Shadows

The Atelier system replaces harsh, flat borders and excessive glowing neon gradients with physical elevation:
- **`shadow-subtle`:** `0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 1px 3px 1px rgba(0, 0, 0, 0.02)`
- **`shadow-card`:** `0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 4px 6px -1px rgba(0, 0, 0, 0.04)`
- **`shadow-card-elevated`:** `0 4px 8px -2px rgba(0, 0, 0, 0.08), 0 8px 16px -4px rgba(0, 0, 0, 0.06)`
- **`shadow-dropdown`:** `0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)`

---

## 5. Component Guidelines

### 5.1 Clinical Cards (`.clinical-card`)
- Corner radius: `rounded-2xl` (16px) or `rounded-xl` (12px)
- Padding: `p-5` (desktop), `p-4` (tablet/mobile)
- Border: `border border-border`
- Background: `bg-card`
- Hover state: `hover:shadow-card hover:border-border transition-all duration-150`

### 5.2 Interactive Buttons & Controls
- **Primary Action:** `bg-primary hover:bg-primary-hover text-primary-foreground font-bold shadow-subtle active:scale-[0.98]`
- **Secondary Action:** `bg-card hover:bg-secondary text-foreground border border-border shadow-2xs`
- **Danger Action:** `bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-subtle`
- **Timing:** 120ms to 180ms ease-out transitions (`transition-all duration-150 ease-out`)

### 5.3 Modals & Overlays
- Backdrop: `fixed inset-0 z-50 bg-black/60 backdrop-blur-md`
- Container: `bg-card border border-border rounded-3xl max-w-lg w-full p-6 shadow-dropdown`
- Trapping: Strict focus trapping, clear escape and cancel controls

### 5.4 Data Tables
- Header: `bg-secondary/40 text-muted-foreground border-b border-border text-[11px] uppercase tracking-wider font-semibold`
- Cell typography: `text-xs font-medium text-foreground py-3 px-3.5`
- Number alignment: Right-aligned or monospace tabular numbers
- Row hover: `hover:bg-secondary/30 transition-colors duration-150`

---

## 6. Accessibility & WCAG Compliance
1. **Contrast Ratio:** Minimum 4.5:1 for body copy and 3:1 for large headers and graphical UI components in both light (`#F5F8F7`) and dark (`#08141A`) modes.
2. **Focus Visibility:** Clear focus rings with `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`.
3. **Screen Readers:** ARIA landmarks, roles (`role="tablist"`, `role="tab"`), and explicit labels.
4. **Touch Targets:** Minimum 44x44px bounding area on mobile navigation and actionable icons.

---

## 7. Responsive Breakpoint Matrix
- **Mobile (< 640px):** Single-column stacked layouts, hidden decorative elements, accessible slide-over drawers for secondary clinical snapshots.
- **Tablet (640px – 1024px):** 2-column grids for KPI tiles and assessments.
- **Desktop (1024px – 1440px):** 3-zone workspaces (Navigation / Form / Live Snapshot), 7-column day grids.
- **Ultra-Wide (>= 1440px):** Constrained max-width containers (`max-w-7xl` or `max-w-6xl`) with centered optical alignment.
