# SHUDDHO — Master Product Scope & Clinical Charter

**Product Name:** SHUDDHO (বিশুদ্ধ) — Functional & Precision Nutrition Clinical Intelligence Platform  
**Document Code:** SHUDDHO-DOC-MPS-001  
**Version:** 1.0.0-R0  
**Phase:** R0 — Master Architecture & Foundation  
**Effective Date:** November 2026  
**Status:** Approved & Locked Architecture Baseline  

---

## 1. Executive Vision & Problem Statement

### 1.1 Clinical Vision
SHUDDHO is an advanced, deterministic, precision nutrition and functional medicine clinical platform designed specifically for Bangladesh and global low-to-middle income countries (LMIC), while adhering to international clinical excellence standards. It bridges the critical divide between standard symptomatic dietetics and systems-biology functional medicine.

By synthesizing the **Institute for Functional Medicine (IFM) 7-System Functional Matrix**, evidence-based **Western clinical dietetics**, classical **Ayurvedic constitutional intelligence (Agni, Prakriti, Vikriti)**, and an exhaustive **Bangladesh-native food and pharmaceutical corpus**, SHUDDHO empowers clinical nutritionists and integrative practitioners to identify root causes, resolve multi-condition therapeutic conflicts, simulate metabolic responses, and produce legally auditable, safe dietary prescriptions.

### 1.2 The Core Problem in Modern Dietetics
Contemporary clinical practice suffers from three fundamental bottlenecks:
1. **Siloed Calorie-Centric Reductionism:** Conventional platforms reduce nutrition to simplistic calorie counting and generic macro splits (carbs/protein/fat), failing to account for bioavailability, nutrient depletions, chronobiology, inflammatory triggers, or metabolic phenotypes.
2. **Patient Orthorexic Fixation & Confusion:** Presenting raw calorie and macronutrient figures directly to patients often triggers health anxiety, orthorexic fixation, and compliance failure. Patients need clear, food-first, culturally relevant lifestyle guidance in familiar household measurements.
3. **Western Database Mismatch:** Leading international platforms (Nutrium, That Clean Life, Cronometer) lack native South Asian and Bangladeshi food items (e.g., specific inland freshwater fish, indigenous leafy greens, local lentils), local cooking methodologies, and regional pharmaceutical brand mappings.

---

## 2. Permanent Product Principles & Invariants

The following architectural and clinical invariants are **permanently locked** across all releases (R0 through R15):

```
+-------------------------------------------------------------------------------------------------------+
|                                    SHUDDHO PERMANENT CORE INVARIANTS                                   |
+------------------------------------+------------------------------------+-----------------------------+
| 1. Functional Medicine & Systems    | 2. Bangladesh-First Clinical       | 3. Deterministic Safety     |
|    Biology Foundation              |    Ecosystem                       |    Foundation (100% Rules)  |
|    IFM 7-domain matrix + root cause|    381 native FCTB foods + 32k    |    Zero-hallucination math, |
|    analysis + Ayurvedic Agni/Dosha |    DGDA brands + localized cost    |    hard contraindication stops|
+------------------------------------+------------------------------------+-----------------------------+
| 4. Dual Clinician / Patient         | 5. Patient Assessment Link & DB   | 6. Nutritionist Ownership   |
|    Report Projections              |    Isolation                       |    & Mandatory Verification |
|    Patients NEVER see kcal/macros; |    Secure web intake + isolated db |    Every automated draft    |
|    Clinicians see full biochemistry|    + mandatory verification gate   |    requires clinician sign-off|
+------------------------------------+------------------------------------+-----------------------------+
| 7. FOSS-First Architecture         | 8. Future AI as Supervised Copilot | 9. Future Mobile Companion  |
|    Open core, zero vendor lock-in, |    Architecture now, inference     |    Architecture now, native |
|    replaceable database adapters   |    deferred to R14; strictly gated |    apps deferred to R15     |
+------------------------------------+------------------------------------+-----------------------------+
```

### 2.1 Functional Medicine & Systems-Biology Focus
- Evaluates patients through the 7 functional physiological domains: Assimilation (Digestion), Defense & Repair (Immune/Inflammation), Energy (Mitochondrial), Biotransformation (Detoxification), Transport (Cardiovascular/Lymphatic), Communication (Endocrine/Neurotransmitters), and Structural Integrity.
- Identifies underlying antecedents, triggers, and mediators rather than prescribing band-aid symptomatic meal plans.

### 2.2 Bangladesh-First Clinical & Food Ecosystem
- Powered by the verified **Food Composition Table for Bangladesh (FCTB V6)** containing 381 indigenous foods with analyzed macro/micronutrients, PRAL, glycemic load, purines, oxalates, and phytates.
- Integrates the 32,461-brand database of the **Directorate General of Drug Administration (DGDA)** for real-time drug-nutrient interaction (DNI) screening.
- Respects family kitchen reality: multi-generational cooking dynamics, batch meal prep, budget constraints, and cultural/religious fasting patterns.

### 2.3 Deterministic Clinical Safety Foundation
- **Zero Hallucination Guarantee:** All caloric equations (Mifflin-St Jeor, Schofield, Katch-McArdle), macro boundaries, BMR clamps, and eGFR-adjusted protein ceilings execute through deterministic, transparent TypeScript engines.
- Non-negotiable hard stops for confirmed food allergens, severe drug-nutrient interactions (e.g., Spironolactone + Potassium Citrate, Warfarin + unstable Vitamin K), and absolute fasting contraindications.

### 2.4 Automated Draft Generation with Mandatory Nutritionist Approval
- Generates intelligent baseline meal plans through combinatorial constraint satisfaction algorithms.
- **Strict Governance:** No automated plan is ever released to a patient without explicit review, manual fine-tuning, and biometric digital sign-off by a registered nutritionist/clinician.

### 2.5 Patient-Specific Secure Assessment Workflow
- Clinicians issue tokenized, expiring invitation links for remote patient intake.
- Patient-submitted answers are stored in an isolated, encrypted staging database.
- Submitted data never pollutes active clinical records until explicitly vetted and accepted by the treating practitioner.

### 2.6 Dual Report Projection (Strict Information Segregation)
- **CLINICIAN_REPORT:** Exhaustive clinical dossier featuring total kcal, exact macro grams and Atwater energy ratios, micronutrient adequacy curves, PRAL acid-base load, glycemic index/load, BMR/TDEE variance, DNI chronotherapy timeline, and clinical evidence citations.
- **PATIENT_REPORT:** Compassionate, actionable, food-first lifestyle prescription displaying approved meal timings, culturally familiar food names (Bengali/English), exact household measurements (বাটি, চামচ, টুকরো), cooking instructions, approved alternatives, and hydration directives.
- **THE CARDINAL PRIVACY RULE:** Under no circumstances shall patient-facing reports, PDFs, or mobile exports display raw calories, protein grams, carbohydrate grams, or fat grams calculations.

### 2.7 FOSS-First & Modular Architecture
- Core logic, algorithms, calculators, and database adapters are developed open-source-first to ensure long-term public health accessibility, prevent vendor extortion, and support community research.

---

## 3. Explicitly Excluded Scope

To maintain clinical focus, regulatory compliance, and rapid execution velocity, the following domains are **strictly excluded** from SHUDDHO:

1. **Full Hospital EHR / EMR Infrastructure:** Inpatient bed tracking, hospital admission/discharge/transfer (ADT) systems, operating theatre management, nursing shift handovers, and general surgical records.
2. **Hospital Administration & General Billing:** Hospital facility billing, insurance claim EDI transactions (ANSI X12 837/835), ICD-10 reimbursement processing, and third-party payer claims.
3. **Pharmaceutical E-Prescribing:** Direct electronic transmission of prescription medications to commercial pharmacies (SHUDDHO handles dietary and nutraceutical prescriptions only).
4. **Native Mobile App Binary Builds in R0:** Native Swift/Kotlin codebase generation is deferred to R15; R0 provides interface contracts and progressive web architecture only.
5. **Runtime AI Inference in R0:** Production LLM API integrations and vision models are deferred to R14; R0 establishes data models and human-in-the-loop validation adapters only.

---

## 4. Master Architectural Boundary & System Context

```
+-------------------------------------------------------------------------------------------------------+
|                                           SYSTEM CONTEXT                                              |
+------------------------------------+------------------------------------+-----------------------------+
| ACTORS                             | CORE SHUDDHO DOMAINS               | EXTERNAL SYSTEMS            |
| • Clinical Nutritionist            | • Practice Management & Census     | • Diagnostic Labs (R13)     |
| • Functional Medicine Physician    | • Adaptive Assessment (P1)         | • Wearables & CGMs (R13)    |
| • Patient / Client                 | • Root-Cause Intelligence (P2)     | • DGDA Drug Index           |
| • Clinical Supervisor / Auditor    | • Precision Diet Studio (P3)       | • FCTB Food Database        |
|                                    | • Lifestyle & Chronotherapy (P4)   | • Supabase / Postgres (R2)  |
|                                    | • Dual Report & PDF Studio (R1)    | • Local Storage (Current)   |
+------------------------------------+------------------------------------+-----------------------------+
```

---

## 5. Scope Traceability & Verification Matrix

| Scope Component | Implementation Phase | Core Engine Dependency | Regulatory Standard |
| :--- | :---: | :--- | :--- |
| **Foundation & Architecture** | **R0** | Static Export, Types, Design Tokens | ISO/IEC 25010, FOSS |
| **Dual Reporting Studio** | **R1** | `reportBuilder.ts`, CSS Paged Media | HIPAA / GDPR Privacy |
| **Secure Cloud Backend** | **R2** | Supabase, Row-Level Security | SOC2 Type II, Encrypted DB |
| **Remote Patient Intake** | **R3** | Tokenized URLs, Review Gate | Electronic Consent |
| **Lifestyle & Chronotherapy** | **R4** | `mealTimingEngine.ts` | Circadian Chronobiology |
| **Master Prescription** | **R5** | Master Orchestrator | Good Clinical Practice (GCP)|
| **Root-Cause Intelligence** | **R6** | `functionalMatrixEngine.ts` | IFM Functional Matrix |
| **Advanced Labs & DNI** | **R7** | `dniEngine.ts`, `labAnalyzer.ts` | DGDA Pharmacopeia |
| **Food Knowledge Base** | **R8** | FCTB V6 Engine | FAO/INFOODS Standards |
| **Affordable Meal Planning**| **R9** | `budgetOptimizer.ts` | BBS Market Basket Data |
| **Longitudinal Tracking** | **R10**| `comparisonEngine.ts` | Clinical Outcome Measures |
| **Practice Portal** | **R11**| RBAC Engine, Calendar Service | ISO 27001 Security |
| **Clinical Research Engine**| **R12**| Anonymization Engine | Declaration of Helsinki |
| **Lab/Wearable Connectors** | **R13**| FHIR / HL7 Adapters | HL7 FHIR Release 4 |
| **AI Copilot & Photo OCR** | **R14**| Python/Node AI Service (Deferred) | SaMD / AI Governance |
| **Native Mobile Apps** | **R15**| React Native / Capacitor (Deferred) | App Store Medical Guidelines |

---

## 6. Sign-Off & Architectural Lock

This Master Product Scope represents the unalterable architectural blueprint for Project SHUDDHO. All feature implementations in subsequent phases (R1 through R15) must trace back to this foundational charter.

**Approved by:**  
*Chief Clinical Informatics Architect*  
*Lead Software Systems Architect*  
*Director of Functional Nutrition Practice*
