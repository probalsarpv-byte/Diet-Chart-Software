# SHUDDHO — Dual Report & Access Security Contracts

**Document Code:** SHUDDHO-DOC-RAC-008  
**Version:** 1.0.0-R0  
**Phase:** R0 Architecture Baseline (Implementation target: Phase R1)  
**Scope:** Strict Architectural Segregation Between Clinician & Patient Projections  

---

## 1. The Cardinal Architectural Principle (U20 vs U21)

Modern clinical dietetics and functional medicine demonstrate that displaying raw caloric metrics and gram-level macronutrient ratios directly to patients induces orthorexic fixation, anxiety, and protocol abandonment. Conversely, withholding nutritional biochemistry from clinicians compromises patient safety and therapeutic efficacy.

**Therefore, SHUDDHO enforces an unbreakable architectural rule:**
> **Under no circumstances shall the patient-facing data payload, API projection, PDF export, or web view display calories, protein grams, carbohydrate grams, or fat grams calculations.**

```
                                  [MASTER NUTRITION PLAN]
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      ▼                                             ▼
          [CLINICIAN_REPORT PAYLOAD]                    [PATIENT_REPORT PAYLOAD]
          • Total Calories & BMR/TDEE deltas            • Approved Food Names (EN / বাংলা)
          • Exact Grams: Protein, Carbs, Fat            • Exact Household Portions (বাটি, চামচ, টুকরো)
          • Continuous Atwater balance bar              • Scheduled Meal Timings (e.g. সকাল ৮:৩০)
          • Micronutrient adequacy % curves             • Cooking & Preparation Instructions
          • Renal PRAL & Glycemic Load scores           • Approved Whole-Food Alternatives
          • Drug-Nutrient Chronotherapy gaps            • Hydration Schedule & Lifestyle Steps
          • Clinical Hypotheses & PubMed PMIDs          • STRICTLY ZERO KCAL / ZERO MACRO GRAMS
```

---

## 2. Payload Serialization Contract Schemas

### 2.1 Clinician Report Data Contract (`IClinicianReportPayload`)
```typescript
export interface IClinicianReportPayload {
  report_type: 'CLINICIAN_FULL_DOSSIER';
  generated_at: string;
  clinician_metadata: {
    name: string;
    registration_number: string;
    signature_hash: string;
  };
  patient_clinical_summary: {
    patient_id: string;
    age: number;
    gender: string;
    bmi: number;
    whtr: number;
    population_group: string;
    active_conditions: string[];
    confirmed_allergies: string[];
  };
  biochemical_energy_analysis: {
    calculated_bmr_kcal: number;
    target_tdee_kcal: number;
    actual_plan_kcal: number;
    atwater_protein_grams: number;
    atwater_protein_percent: number;
    atwater_carbs_grams: number;
    atwater_carbs_percent: number;
    atwater_fat_grams: number;
    atwater_fat_percent: number;
    net_daily_pral_score: number;
    average_glycemic_load: number;
  };
  micronutrient_sufficiency_matrix: Record<string, {
    actual_amount: number;
    dri_recommended: number;
    percent_adequacy: number;
    status: 'optimal' | 'marginal' | 'deficient' | 'excess';
  }>;
  drug_nutrient_chronotherapy_log: Array<{
    medication_name: string;
    nutrient_depleted: string;
    administration_time: string;
    mandated_meal_gap_minutes: number;
  }>;
  clinical_evidence_citations: Array<{
    pmid: string;
    citation: string;
    relevance: string;
  }>;
}
```

### 2.2 Patient Report Data Contract (`IPatientReportPayload`)
```typescript
export interface IPatientReportPayload {
  report_type: 'PATIENT_LIFESTYLE_PRESCRIPTION';
  generated_at: string;
  clinic_letterhead: {
    clinic_name: string;
    attending_clinician_name: string;
    contact_phone: string;
  };
  patient_identity: {
    name: string;
    patient_id: string;
    current_phase_title: string;
    valid_until_date: string;
  };
  daily_schedule: Array<{
    day_number: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    day_name_bn: string;
    day_name_en: string;
    meals: Array<{
      meal_slot: 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner' | 'bedtime';
      meal_name_bn: string;
      meal_name_en: string;
      scheduled_time: string; // e.g. "সকাল ৮:৩০ - ৯:০০"
      items: Array<{
        food_name_bn: string;
        food_name_en: string;
        household_portion_bn: string; // e.g. "১ মাঝারি বাটি (১০০ গ্রাম সেদ্ধ)"
        household_portion_en: string; // e.g. "1 medium bowl (100g cooked)"
        cooking_instruction_bn: string; // e.g. "কম তেলে হালকা ঝোল করে রান্না"
        cooking_instruction_en: string;
        approved_alternatives_bn: string[]; // e.g. ["১ টুকরো রুই মাছের বদলে ১ টুকরো কাতলা"]
      }>;
    }>;
  }>;
  hydration_and_lifestyle_guidelines: {
    daily_water_target_glasses: number;
    fasting_eating_window_note_bn: string;
    sleep_hygiene_directives_bn: string[];
    foods_to_avoid_completely_bn: string[]; // Confirmed allergies and medical hard stops
  };
  // IMPORTANT: Notice the COMPLETE ABSENCE of any kcal, macro, or Atwater keys!
}
```

---

## 3. Data Sanitization Engine Specification

When generating a patient report or PDF in Phase R1, the application must execute the deterministic `sanitizeToPatientProjection` filter function:

```typescript
export function sanitizeToPatientProjection(
  clinicianDossier: IClinicianReportPayload,
  rawPlan: any
): IPatientReportPayload {
  // 1. Extract only patient-safe food names, meal timings, and household measures
  // 2. Map gram weights to cultural household units (বাটি, চামচ, টুকরো, গ্লাস)
  // 3. Drop all internal calculation nodes: kcal, target_protein_g, target_carbs_g,
  //    target_fat_g, pral_score, glycemic_load, bmr, tdee, micronutrient vectors.
  // 4. Return pure IPatientReportPayload.
}
```

### Automated Acceptance Gate (Required in R1 CI):
```typescript
const patientJsonString = JSON.stringify(patientReportPayload).toLowerCase();
assert(!patientJsonString.includes('kcal'), 'Must not contain kcal');
assert(!patientJsonString.includes('calorie'), 'Must not contain calorie');
assert(!patientJsonString.includes('protein_g'), 'Must not contain protein_g');
assert(!patientJsonString.includes('carb_g'), 'Must not contain carb_g');
assert(!patientJsonString.includes('fat_g'), 'Must not contain fat_g');
```
