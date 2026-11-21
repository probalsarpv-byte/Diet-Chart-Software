# SHUDDHO — Clinical Safety & Evidence Governance Framework

**Document Code:** SHUDDHO-DOC-CSG-007  
**Version:** 1.0.0-R0  
**Phase:** R0 Architecture Baseline  
**Scope:** Clinical Evidence Grading, Safety Invariants, Hard Stops & Clinical Review Backlog  

---

## 1. Multi-Tier Evidence Hierarchy

To safeguard clinical accuracy and prevent pseudo-scientific or unverified claims from infiltrating dietary prescriptions, SHUDDHO establishes a strict 4-Tier Clinical Evidence Hierarchy:

```
+---------------------------------------------------------------------------------------------------+
|                                 4-TIER CLINICAL EVIDENCE HIERARCHY                                |
+-------------------+-----------------------------------+-------------------------------------------+
| TIER LEVEL        | DEFINITION & CLINICAL WEIGHT      | EXAMPLES IN SHUDDHO                       |
+-------------------+-----------------------------------+-------------------------------------------+
| TIER 1:           | Documented patient physiological  | Verified laboratory biomarker (HbA1c 8.2%)|
| VERIFIED FACTS    | facts, confirmed diagnoses, and   | Confirmed peanut anaphylaxis allergy,     |
|                   | active prescribed medications.    | Active prescription of Warfarin / Metformin|
+-------------------+-----------------------------------+-------------------------------------------+
| TIER 2:           | Consensus clinical guidelines and | eGFR <30 protein clamp (0.6–0.8 g/kg),    |
| ESTABLISHED RULES | validated physiological equations | BMR adult caloric floor, DGDA DNI rules,  |
|                   | (KDIGO, ADA, ESC, FAO/WHO).       | Atwater energy factor conservation.       |
+-------------------+-----------------------------------+-------------------------------------------+
| TIER 3:           | Peer-reviewed functional trial    | Berberine 500mg AMPK activation,          |
| EMERGING EVIDENCE | data and chronobiology evidence   | Sulforaphane Nrf2 upregulation,           |
|                   | (RCTs, systematic reviews).       | Circadian pre-bedtime 3h meal cessation.  |
+-------------------+-----------------------------------+-------------------------------------------+
| TIER 4:           | Systems-biology root cause links  | Gut-brain axis dysbiosis hypothesis,      |
| EXPLORATORY       | and classical Ayurvedic dosha     | Ayurvedic Vata aggravation during autumn, |
| HYPOTHESES        | constitutional tendencies.        | Subclinical mitochondrial sluggishness.   |
+-------------------+-----------------------------------+-------------------------------------------+
```

### Invariant Clinical Rule on Hierarchy:
**Higher-tier rules ALWAYS strictly override lower-tier suggestions.**  
*Example:* Even if Tier 3 emerging evidence suggests high-dose potassium citrate for kidney stone prevention, a Tier 2 established rule (CKD Stage 4 hyperkalemia risk) or a Tier 1 verified medication (concurrent Spironolactone) **absolutely halts** the recommendation with a `HARD_STOP`.

---

## 2. Hard Safety Stops vs Advisory Warnings

| Level | Severity | Behavior in Platform | Clinician Override Permitted? | Example Trigger |
| :---: | :---: | :--- | :---: | :--- |
| **HARD STOP** | **CRITICAL** | Completely blocks plan approval, hides print actions, highlights in high-contrast red alert modal. | **NO (Non-negotiable)** | Prescribing a food containing a confirmed allergen (e.g., egg in anaphylaxis); prolonged fasting (>14h) on sulfonylurea/insulin; total daily kcal < BMR. |
| **CLINICAL ADVISORY** | **MODERATE** | Displays persistent amber badge, logs advisory into audit trail, requires explicit clinician acknowledgement checkbox. | **YES (With documented note)** | Moderate drug-nutrient depletion (Metformin causing B12 depletion); sodium restriction borderline (>2000 mg in mild hypertension). |
| **PHYSIOLOGICAL NOTE** | **INFO** | Informational pill on clinician workspace, no sign-off block. | **N/A** | Suggestion to separate green tea consumption 1 hour away from iron-rich meals. |

---

## 3. Bangladesh Specific Clinical Safety Thresholds

1. **Adult BMR Floor Constraint:**
   - No adult outpatient dietary plan may provide calories below calculated Basal Metabolic Rate (BMR) without specialized inpatient oversight.
   - Equation: Mifflin-St Jeor formula calibrated for South Asian body composition.
2. **Renal Protein Ceilings (KDIGO Standard):**
   - Non-dialysis CKD Stage 1–2: $0.8\text{ g/kg/day}$
   - CKD Stage 3a–3b: $0.6 - 0.8\text{ g/kg/day}$
   - CKD Stage 4–5 (Non-dialysis): $0.6\text{ g/kg/day}$ strictly enforced
3. **Atwater Mathematical Conservation Bounds:**
   - In any approved daily plan, total caloric sum must match the Atwater equation within $\pm 1.0\text{ kcal}$:
     $$\text{Actual kcal} = (4 \times \text{Protein}) + (4 \times \text{Carbs}) + (9 \times \text{Fat})$$
4. **Fluid Restriction Accounting:**
   - Evaluates moisture content from solid foods ($water\_g$) + liquid dishes (ডাল, স্যুপ, ঝোল) + drinking water to prevent fluid overload in congestive heart failure (CHF) and anuric renal failure.

---

## 4. Documented Clinical Backlog for Expert Review

The following existing rules are flagged for ongoing review by our future Clinical Advisory Board during Phase R6/R7:

| Item Code | Rule Name | Current Logic | Questions for Future Board Review |
| :---: | :--- | :--- | :--- |
| **REV-01** | *Ashwagandha in Subclinical Hypothyroid* | Recommended for HPA burnout (Cluster 5) | Should Ashwagandha be contraindicated in concurrent hyperthyroidism due to potential T3/T4 stimulation? |
| **REV-02** | *Raw Cruciferous Goitrogen Thresholds* | Cautionary flag in hypothyroid | Does traditional Bangladeshi cooking (boiling/sautéing) sufficiently deactivate goitrogens to relax raw restrictions? |
| **REV-03** | *Intermittent Fasting in Fatty Liver (MASLD)* | 14-hour window allowed | Is 16-hour fasting safe in non-diabetic MASLD with normal BMI, or should 14h remain the absolute universal cap? |
| **REV-04** | *Phytate Dephytinization Yield Factors* | Static 0.85 bioavailability factor | Should soaking/germination of local lentils (মুগ, মসুর) dynamically increase zinc and iron absorption scalars? |
