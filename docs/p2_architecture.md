# Shuddho Functional Nutrition Software
## Phase P2: Clinical Intelligence & Functional Decision-Support Architecture

### 1. Executive Overview & Core Mission
The P2 Clinical Intelligence Engine is a deterministic, explainable, zero-AI expert system that transforms multi-dimensional patient assessment data into structured clinical insights. It operationalizes systems-biology principles from functional medicine while adhering strictly to clinical safety and regulatory boundaries:
- **Zero Paid AI / LLMs:** 100% deterministic rule evaluations using strictly typed TypeScript engines.
- **Candidate Mechanisms vs. Medical Diagnoses:** Candidate mechanisms are explicitly tagged as functional hypotheses (`isConfirmedDiagnosis: false`). The system never labels an unconfirmed etiology as a definitive medical diagnosis. The clinician retains complete decision-making authority (`accepted`, `rejected`, `deferred`, `customized`).
- **Explainable Evidence Provenance:** Every hypothesis details its supporting observations, contradictory evidence, reference literature, and deterministic confidence score.
- **Sub-100ms Performance:** Full evaluation completes in under 1ms (average 0.30–0.45ms).
- **Full Bilingual Parity:** All clinical findings, red flags, recommendations, and matrix domains are fully localized in English and Bengali (`বাংলা`).

---

### 2. Systems-Biology Functional Medicine Matrix (7 Core Biological Domains)
The engine aggregates all patient observations (clinical timeline, anthropometrics, laboratory biomarkers, medications, allergies, and 14-domain assessment answers) into 7 core physiological domains:

| Domain | Systems Biology Focus | Key Biomarkers & Symptoms |
| :--- | :--- | :--- |
| **Assimilation** | Digestion, absorption, gut microbiota, intestinal permeability | Bloating, PPI use, food reactions, calprotectin, stool frequency |
| **Defense & Repair** | Immune response, systemic inflammation, autoimmunity | hs-CRP, ESR, joint stiffness, chronic allergies, recurring infections |
| **Energy** | Mitochondrial function, ATP production, cellular respiration | Chronic fatigue, post-exertional malaise, brain fog, CoQ10/B-vitamins |
| **Biotransformation** | Hepatic detoxification (Phase I/II), xenobiotic clearance | Elevated ALT/AST/GGT, environmental exposures, alcohol use, constipation |
| **Communication** | Endocrine signaling, neurotransmitters, hormonal axis | Fasting insulin, HOMA-IR, thyroid markers (TSH/fT4), cortisol, cycle regularity |
| **Transport** | Cardiovascular circulation, lymphatic drainage, vascular health | Lipid panel (Triglycerides, HDL, LDL), blood pressure, peripheral edema |
| **Structural Integrity** | Musculoskeletal tissue, cell membrane integrity, barrier function | Sarcopenia, waist-to-height ratio, joint pain, osteoporosis risk |

Each domain is scored for **Burden Level** (`optimal`, `mild`, `moderate`, `severe`), tracking contributing observations, physiological confounders, and data gaps.

---

### 3. The 10 Candidate Hypothesis Clusters (A–J)
The Clinical Intelligence Engine evaluates observations against 26 peer-reviewed clinical rules across 10 functional mechanism clusters:

- **Cluster A: Upper GI Hypochlorhydria & Digestive Insufficiency**  
  *Rule:* Evaluates PPI/antacid dependence, post-prandial fullness, undigested stool, with B12/ferritin/magnesium depletions.
- **Cluster B: Intestinal Dysbiosis & Permeability Alterations**  
  *Rule:* Post-antibiotic symptoms, bloating, food reactions, sugar cravings, inflammatory markers.
- **Cluster C: Systemic Low-Grade Chronic Inflammation**  
  *Rule:* Elevated hs-CRP, metabolic dysregulation, persistent joint pain, low-polyphenol diet.
- **Cluster D: Insulin Resistance & Metabolic Inflexibility**  
  *Rule:* Elevated HOMA-IR (>1.9), fasting glucose ≥100 mg/dL, HbA1c ≥5.7%, central adiposity (waist ≥85cm / WHtR ≥0.5).
- **Cluster E: Hypothalamic-Pituitary-Adrenal (HPA) Axis Dysregulation**  
  *Rule:* Unrefreshing sleep, circadian disruption, chronic stress, fluctuating daytime energy.
- **Cluster F: Mitochondrial Dysregulation & Cellular Energy Impairment**  
  *Rule:* Persistent fatigue unimproved by rest, post-viral malaise, statin/metformin depletions.
- **Cluster G: Hepatic Detoxification & Biotransformation Overload**  
  *Rule:* Elevated liver enzymes, chronic polypharmacy, high chemical/pesticide exposure, sluggish bowel transit.
- **Cluster H: Micronutrient Depletion Patterns**  
  *Rule:* Vitamin D, B12, ferritin, magnesium depletions driven by diet, malabsorption, or pharmaceutical nutrient robbery.
- **Cluster I: Circadian & Sleep Architecture Disruption**  
  *Rule:* Shift work, late-night meal timing, sleep latency >45 min, blue light exposure.
- **Cluster J: Musculoskeletal & Structural Integrity Vulnerability**  
  *Rule:* Inadequate daily protein intake (<1 meal/day), muscle weakness/loss, osteopenia risk.

---

### 4. Clinical Safety Guardrails & Priority Classification
The engine enforces multi-layered clinical safety gates:
1. **Red Flag Screening (Immediate Urgency):**  
   - Detection of alarm symptoms (unintentional weight loss, rectal/GI bleeding, unexplained persistent fever, acute dysphagia).
   - Oncology cachexia and severe underweight (<45 kg / BMI < 17.5).
   - **Hard Block:** When immediate red flags are present, `blocksAutoIntervention` is engaged. Automated diet interventions are strictly suspended until reviewed by a medical clinician.
2. **Special Population Safety Protections:**  
   - **Pregnancy & Lactation:** Hypocaloric deficits, intermittent fasting, and aggressive detoxification protocols are permanently blocked. Nutritional adequacy and micronutrient density are enforced.
   - **Pediatrics (<18y):** Adult metabolic syndrome rules and adult fasting guidelines are disabled. Pediatric growth tracking is mandated.
   - **Geriatrics:** Protein sparing (minimum 1.2–1.5 g/kg) and hydration adequacy safeguards are enforced.
3. **Medication Confounder Distinction:**  
   - Symptoms co-occurring with pharmaceuticals (e.g., Metformin GI distress, Statin-induced myalgia, PPI hypochlorhydria) are explicitly flagged as potential drug-induced or confounders, rather than assumed primary pathology.
4. **Missing Biomarker Uncertainty Preservation:**  
   - If a clinical hypothesis lacks objective lab corroboration, it is marked with low evidence support, and the missing lab markers are surfaced as a prioritized **Clinical Data Gap**.

---

### 5. Clinician Governance & Decision Preservation
Clinical nutritionists maintain full editorial sovereignty over the decision-support system:
- **Decision States:** Clinicians can set any hypothesis to `accepted`, `rejected`, `deferred`, or `customized`.
- **Audit History:** Decision records, timestamps, and clinician rationales are stored in `clinicianDecisionHistory` and preserved across subsequent evaluations and app reloads.
- **Patient Isolation:** Observations, answers, and clinical matrix results are strictly isolated by unique patient UUID (`shuddho_assessment_${patientId}`), preventing data leakage.

---

### 6. P3 Diet Planning Context Interface Readiness
The P2 output delivers a strictly typed `DietPlanningContext` specifically engineered to power the upcoming Phase P3 7-Day Diet Planning Engine:
```typescript
export interface DietPlanningContext {
  patientId: string;
  confirmedAllergens: string[];            // Hard RED exclusions for P3 meal generator
  contraindicatedFoods: string[];          // Clinician & disease-specific restrictions
  approvedTherapeuticGoals: string[];      // Verified clinical goals (e.g., glycemic control)
  candidateMechanismsOnly: string[];       // Unconfirmed hypotheses (informational only; NOT hard restrictions)
  caloricTarget: number;                   // Clinically safe target >= BMR floor
  macroSplit: {
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  };
  specialPopulation: PopulationGroup;
  trafficLightOverrides: Record<string, 'GREEN' | 'YELLOW' | 'RED'>;
}
```
This guarantees a clean, uncoupled transition into P3 without requiring any refactoring of clinical logic.
