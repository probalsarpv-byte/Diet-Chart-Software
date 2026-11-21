# SHUDDHO — System Architecture Blueprint

**Document Code:** SHUDDHO-DOC-ARC-005  
**Version:** 1.0.0-R0  
**Phase:** R0 Architecture Baseline  
**Scope:** End-to-End Technical Architecture, Modular Engine Boundaries & Technology Contracts  

---

## 1. High-Level Architectural Model

SHUDDHO is structured as an **offline-resilient, deterministic, modular clinical web platform** designed for static CDN distribution (GitHub Pages) with a decoupled, future-ready backend boundary (planned for R2).

```
+-------------------------------------------------------------------------------------------------------------------+
|                                            SHUDDHO 5-TIER ARCHITECTURE                                            |
+-------------------------------------------------------------------------------------------------------------------+
| TIER 1: PRESENTATION & USER EXPERIENCE LAYER (Next.js 14 / React 18 / Tailwind CSS)                               |
| • Sticky Left Sidebar (256px)   • Top Command Bar            • Persistent Patient Bar   • Wide Canvas (1720px)    |
| • 14-Domain Wizard              • 8:4 Diet Planning Studio   • Asymmetric Dossier Split • Longitudinal SVG Charts |
+-------------------------------------------------------------------------------------------------------------------+
| TIER 2: CLINICAL DOMAIN & ENGINE LAYER (Deterministic TypeScript - Pure Functional Core)                          |
| • Clinical Safety Engine        • Atwater Macro Balancer     • Conflict Resolver        • 24h DNI Chronotherapy   |
| • IFM 7-Domain Evaluator        • Ayurvedic Dosha Calculator • Longitudinal Comparator  • Fasting Eligibility     |
+-------------------------------------------------------------------------------------------------------------------+
| TIER 3: DATA ABSTRACTION & REPOSITORY LAYER (Storage Agnostic)                                                    |
| • Active Context Providers      • Snapshot Manager           • Referential Integrity    • Storage Agnostic Repo   |
| • CURRENT: LocalStorage v2      • TRANSITION: IndexedDB PWA  • FUTURE (R2): Supabase / PostgreSQL Client (REST/WS)|
+-------------------------------------------------------------------------------------------------------------------+
| TIER 4: SECURITY, AUDIT & GOVERNANCE GATEWAY (R2 Baseline)                                                        |
| • Role-Based Access Control     • Row-Level Security (RLS)   • Immutable Audit Logger   • Tokenized Remote Intake |
+-------------------------------------------------------------------------------------------------------------------+
| TIER 5: EXTERNAL INTEGRATION ADAPTERS (R13 – R15 Horizon)                                                         |
| • FHIR / HL7 Laboratory Adapter • Wearables & CGM Connector  • AI Copilot Adapter (R14) • Mobile Push Service (R15)|
+-------------------------------------------------------------------------------------------------------------------+
```

---

## 2. Tier Breakdown & Component Responsibilities

### 2.1 Tier 1: Presentation & Design System Architecture
- **Framework:** Next.js 14 (App Router) configured for fully static export (`output: 'export'`).
- **Styling & Tokens:** Tailwind CSS 3.4 with custom clinical semantic design tokens:
  - *Light Palette:* Background `#F5F8F7`, Surface `#FFFFFF`, Primary `#047857` (Deep Emerald), Border `#DFE7E7`, Text `#10212B`.
  - *Dark Palette:* Background `#08141A`, Surface `#10212A`, Primary `#35C6A0` (Vibrant Mint), Border `#29404A`, Text `#EBF5F3`.
- **Bilingual Typographic System:**
  - Latin: Inter (`font-sans`).
  - Bengali: Hind Siliguri with Noto Sans Bengali fallback (`font-sans`).
- **Responsiveness:** Desktop multi-column split (1440px+ optimized up to 1720px) with fluid mobile drawers (<1024px) ensuring >44px touch ergonomics.

### 2.2 Tier 2: Modular Clinical Engine Layer (The Pure Core)
To ensure absolute clinical reliability, all calculation engines are designed as **pure, side-effect-free, deterministic TypeScript functions**:
1. `energySafetyEngine.ts`: Calculates BMR floors, TDEE deficits, pregnancy/lactation surplus, and pediatric growth bounds.
2. `foodAllergyEngine.ts`: Evaluates confirmed allergies and permanently blocks unsafe foods from ever appearing in plan suggestions.
3. `fluidElectrolyteEngine.ts`: Tallies total fluid intake across foods and discretionary beverages, enforcing prescribed limits in CKD/CHF.
4. `fastingSafetyEngine.ts`: Evaluates maximum allowable intermittent fasting hours based on diabetes medication, pregnancy, and eGFR.
5. `conflictResolver.ts`: Resolves multi-disease food rules using the invariant hierarchy: `RED (Hard Block) > YELLOW (Caution) > GREEN (Therapeutic)`.
6. `weeklyPlanner.ts`: Aggregates 7-day cyclical nutritional totals, enforcing Atwater macro conservation:
   $$\text{Total kcal} = (\text{Protein g} \times 4) + (\text{Carbs g} \times 4) + (\text{Fat g} \times 9)$$

### 2.3 Tier 3: Data Abstraction & Repository Layer
- **Architecture:** Repository Pattern (`IPracticeRepository`) decoupling UI components from specific storage media.
- **Current State (R0–R1):** High-reliability `localStorage` wrapper with JSON serialization, idempotent migration scripts (`legacyMigration.ts`), and write-failure rollback protections.
- **Future State (R2+):** Supabase (PostgreSQL 15+) client library utilizing PostgreSQL Row-Level Security (RLS) to ensure absolute tenant and patient record isolation.

### 2.4 Tier 4: Security, Audit & Access Governance
- **Clinician Authentication:** Multi-factor authentication (MFA) via TOTP / WebAuthn.
- **Role-Based Access Control (RBAC):**
  - `CLINICAL_DIRECTOR`: Full practice configuration, template approval, audit trail inspection.
  - `TREATING_NUTRITIONIST`: Patient consultation, assessment, diet drafting, clinical sign-off.
  - `ASSISTANT_DIETITIAN`: Intake recording, patient measurement logging (cannot approve prescriptions).
  - `PATIENT_PORTAL_USER`: Read-only access to approved `PATIENT_REPORT`, meal schedules, and self-assessment forms.
- **Data Provenance:** Every change to a patient chart or diet plan records an immutable `AuditEvent` with clinician ID, timestamp, and delta diff.

### 2.5 Tier 5: External Integration Adapters
- Decoupled interface contracts allowing future connectivity without altering core clinical engines:
  - `ILabResultAdapter`: Ingests HL7 / FHIR R4 bundles into standard `LabResult` structures.
  - `ICGMSensorAdapter`: Ingests continuous glucose monitoring time-series telemetry.
  - `IAIProviderAdapter`: Gated bridge for future R14 LLM copilot services.

---

## 3. Data Flow Architecture: From Intake to Prescription

```
[Patient Intake / Invitation]
        │
        ▼ (R3: Staging Queue)
[Clinician Reconciliation & Approval Gate]
        │
        ▼ (Symptom & Biomarker Vector)
[14-Domain Assessment Engine (P1)] ──► [Agni / Dosha / Chrono Rules]
        │
        ▼ (Derived Observations & Flags)
[Root-Cause Intelligence Engine (P2)] ──► [Multi-Disease Conflict Resolver]
        │
        ▼ (Clamped Caloric & Macro Constraints)
[7-Day Precision Diet Studio (P3)] ◄──► [Bangladesh FCTB V6 Database]
        │
        ▼ (Live Safety & Atwater Balancing)
[Clinician Review & Approval Sign-Off]
        │
        ├──────────────────────────────────────┐
        ▼                                      ▼
[CLINICIAN_REPORT Projection]          [PATIENT_REPORT Projection]
(Full Macros, kcal, PRAL, DNI, PMIDs)  (Food Names, বাটি/চামচ, Times, NO KCAL/MACROS)
```

---

## 4. Hosting & Deployment Architecture

- **Primary Static Edge:** GitHub Pages CDN (`https://probalsarpv-byte.github.io/Diet-Chart-Software/`).
- **Build Pipeline:** GitHub Actions runner executing `npm run build` with `next.config.js` static export:
  - `output: 'export'`
  - `basePath: '/Diet-Chart-Software'`
  - `trailingSlash: true`
- **Future Cloud Edge (R2+):** Vercel / Cloudflare Pages frontend paired with a managed Supabase / PostgreSQL instance in the APAC (Singapore) region for ultra-low latency (<40ms to Dhaka).
