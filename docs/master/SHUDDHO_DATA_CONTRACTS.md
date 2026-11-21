# SHUDDHO — Data Contracts & Relational Entity Specifications

**Document Code:** SHUDDHO-DOC-DTC-006  
**Version:** 1.0.0-R0  
**Phase:** R0 Architecture Baseline  
**Scope:** Complete Relational Entity Schema, Foreign Key Topography & Persistence Migration  

---

## 1. Relational Entity Topography

The SHUDDHO data model is organized into 23 future-ready relational entities designed for PostgreSQL 15+ (with strict Row-Level Security), while remaining backward-compatible with the current schema-versioned `localStorage` format.

```
+---------------------------------------------------------------------------------------------------+
|                                     ENTITY RELATIONSHIP TOPOGRAPHY                                |
+---------------------------------------------------------------------------------------------------+
| Organization ──< Clinician ──< Patient ──< Visit ──< ClinicalObservation                          |
|                                             │    ──< ClinicalHypothesis                           |
|                                             │    ──< LabResult                                    |
|                                             │    ──< NutritionPlan ──< ApprovalRecord             |
|                                             │    ──< LifestylePlan ──< PatientReport              |
|                                             │    ──< FollowUp                                     |
|                                             │    ──< OutcomeRecord                                |
|                                             └──< AuditEvent                                       |
| AssessmentTemplate ──< AssessmentInvitation ──< AssessmentSubmission ──< AssessmentReview        |
| Food / Recipe / Medication / Supplement / EvidenceReference (Global Knowledge Catalogs)           |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Specification of the 23 Core Relational Entities

### 1. `Organization`
- **Purpose:** Multi-tenant clinic or hospital department practice entity.
- **Fields:**
  - `id`: UUID (PK)
  - `name`: VARCHAR(255) NOT NULL
  - `license_number`: VARCHAR(100)
  - `jurisdiction`: VARCHAR(50) DEFAULT 'BD'
  - `timezone`: VARCHAR(50) DEFAULT 'Asia/Dhaka'
  - `created_at`: TIMESTAMPTZ NOT NULL

### 2. `Clinician`
- **Purpose:** Treating nutritionist, dietitian, or integrative medicine physician.
- **Fields:**
  - `id`: UUID (PK)
  - `organization_id`: UUID (FK -> Organization.id) NOT NULL
  - `email`: VARCHAR(255) UNIQUE NOT NULL
  - `full_name`: VARCHAR(255) NOT NULL
  - `registration_number`: VARCHAR(100) NOT NULL (e.g. BD Nutrition Council ID)
  - `role`: VARCHAR(50) NOT NULL (`CLINICAL_DIRECTOR`, `TREATING_NUTRITIONIST`, `ASSISTANT`)
  - `is_active`: BOOLEAN DEFAULT TRUE

### 3. `Patient`
- **Purpose:** Core patient master demographic and physiological profile.
- **Fields:**
  - `id`: VARCHAR(50) (PK) (e.g. `pat_alpha_001`)
  - `organization_id`: UUID (FK -> Organization.id) NOT NULL
  - `primary_clinician_id`: UUID (FK -> Clinician.id) NOT NULL
  - `name`: VARCHAR(255) NOT NULL
  - `age`: INT NOT NULL
  - `gender`: VARCHAR(20) NOT NULL (`male`, `female`, `other`)
  - `phone`: VARCHAR(50) NOT NULL
  - `population_group`: VARCHAR(50) NOT NULL (`adult_standard`, `pregnancy`, `lactation`, `pediatric`, `geriatric`, `renal`, `athlete`)
  - `current_phase`: INT DEFAULT 1
  - `created_at`: TIMESTAMPTZ NOT NULL

### 4. `Visit`
- **Purpose:** Discrete clinical consultation encounter.
- **Fields:**
  - `id`: VARCHAR(50) (PK) (e.g. `vis_baseline_001`)
  - `patient_id`: VARCHAR(50) (FK -> Patient.id) NOT NULL
  - `clinician_id`: UUID (FK -> Clinician.id) NOT NULL
  - `visit_number`: INT NOT NULL
  - `visit_date`: DATE NOT NULL
  - `visit_type`: VARCHAR(50) NOT NULL (`baseline`, `regular_followup`, `acute_flare`, `final_discharge`)
  - `weight_kg`: NUMERIC(5,2) NOT NULL
  - `height_cm`: NUMERIC(5,2) NOT NULL
  - `waist_cm`: NUMERIC(5,2)
  - `hip_cm`: NUMERIC(5,2)
  - `derived_bmi`: NUMERIC(4,1) NOT NULL
  - `derived_whtr`: NUMERIC(4,2)
  - `status`: VARCHAR(50) DEFAULT 'completed'

### 5. `AssessmentTemplate`
- **Purpose:** Dynamic functional questionnaire definitions and question logic.
- **Fields:**
  - `id`: UUID (PK)
  - `code`: VARCHAR(50) UNIQUE NOT NULL (e.g. `IFM_14_DOMAIN_V2`)
  - `title`: VARCHAR(255) NOT NULL
  - `domains_json`: JSONB NOT NULL (Question tree, conditional display rules)
  - `version`: INT NOT NULL

### 6. `AssessmentInvitation`
- **Purpose:** Secure, tokenized remote patient intake link generator.
- **Fields:**
  - `id`: UUID (PK)
  - `patient_id`: VARCHAR(50) (FK -> Patient.id) NOT NULL
  - `template_id`: UUID (FK -> AssessmentTemplate.id) NOT NULL
  - `token_hash`: VARCHAR(255) UNIQUE NOT NULL (HMAC-SHA256)
  - `expires_at`: TIMESTAMPTZ NOT NULL
  - `status`: VARCHAR(50) DEFAULT 'pending' (`pending`, `submitted`, `expired`, `cancelled`)

### 7. `AssessmentSubmission`
- **Purpose:** Staged remote patient submission holding unverified answers.
- **Fields:**
  - `id`: UUID (PK)
  - `invitation_id`: UUID (FK -> AssessmentInvitation.id) UNIQUE NOT NULL
  - `patient_id`: VARCHAR(50) (FK -> Patient.id) NOT NULL
  - `submitted_payload_json`: JSONB NOT NULL
  - `submitted_at`: TIMESTAMPTZ NOT NULL
  - `ip_address`: VARCHAR(45)

### 8. `AssessmentReview`
- **Purpose:** Clinician reconciliation and acceptance of patient submissions.
- **Fields:**
  - `id`: UUID (PK)
  - `submission_id`: UUID (FK -> AssessmentSubmission.id) UNIQUE NOT NULL
  - `clinician_id`: UUID (FK -> Clinician.id) NOT NULL
  - `reviewed_at`: TIMESTAMPTZ NOT NULL
  - `status`: VARCHAR(50) NOT NULL (`accepted_full`, `accepted_with_edits`, `rejected`)
  - `reconciliation_diff_json`: JSONB NOT NULL
  - `clinician_notes`: TEXT

### 9. `ClinicalObservation`
- **Purpose:** Normalized symptom, sign, or biomarker derived from assessment.
- **Fields:**
  - `id`: UUID (PK)
  - `visit_id`: VARCHAR(50) (FK -> Visit.id) NOT NULL
  - `domain`: VARCHAR(50) NOT NULL (`assimilation`, `defense_repair`, `energy`, etc.)
  - `code`: VARCHAR(100) NOT NULL
  - `severity_score`: INT NOT NULL (0 to 3)
  - `is_red_flag`: BOOLEAN DEFAULT FALSE

### 10. `ClinicalHypothesis`
- **Purpose:** Systems-biology root cause hypothesis generated by P2 engine.
- **Fields:**
  - `id`: UUID (PK)
  - `visit_id`: VARCHAR(50) (FK -> Visit.id) NOT NULL
  - `hypothesis_code`: VARCHAR(100) NOT NULL (e.g. `HYP_MITO_DYSFUNCTION`)
  - `confidence_score`: NUMERIC(3,2) NOT NULL (0.00 to 1.00)
  - `evidence_summary`: TEXT NOT NULL
  - `status`: VARCHAR(50) DEFAULT 'active' (`active`, `refuted`, `resolved`)

### 11. `EvidenceReference`
- **Purpose:** Biomedical literature and guideline citation database.
- **Fields:**
  - `id`: UUID (PK)
  - `pmid`: VARCHAR(20) UNIQUE
  - `doi`: VARCHAR(100)
  - `title`: TEXT NOT NULL
  - `authors`: TEXT
  - `journal`: VARCHAR(255)
  - `year`: INT
  - `evidence_tier`: INT NOT NULL (1: Meta-Analysis, 2: RCT, 3: Cohort, 4: Expert Mechanism)

### 12. `LabResult`
- **Purpose:** Laboratory biomarker readings with standard and functional ranges.
- **Fields:**
  - `id`: UUID (PK)
  - `visit_id`: VARCHAR(50) (FK -> Visit.id) NOT NULL
  - `test_code`: VARCHAR(100) NOT NULL (LOINC mapped where available)
  - `test_name`: VARCHAR(255) NOT NULL
  - `numeric_value`: NUMERIC(10,3) NOT NULL
  - `unit`: VARCHAR(50) NOT NULL
  - `standard_low`: NUMERIC(10,3)
  - `standard_high`: NUMERIC(10,3)
  - `functional_low`: NUMERIC(10,3)
  - `functional_high`: NUMERIC(10,3)
  - `status`: VARCHAR(50) NOT NULL (`optimal`, `subclinical_low`, `subclinical_high`, `critical`)

### 13. `Food`
- **Purpose:** 100g normalized nutritional composition from FCTB V6.
- **Fields:**
  - `id`: VARCHAR(50) (PK) (e.g. `f_01_0001`)
  - `name_en`: VARCHAR(255) NOT NULL
  - `name_bn`: VARCHAR(255) NOT NULL
  - `category`: VARCHAR(50) NOT NULL
  - `per_100g_json`: JSONB NOT NULL (kcal, protein, carbs, fat, fiber, micronutrients)
  - `glycemic_load`: VARCHAR(20) NOT NULL
  - `pral_score`: NUMERIC(5,2) NOT NULL
  - `tags`: TEXT[]

### 14. `Recipe`
- **Purpose:** Culinary preparation formulas combining foods with cooked yields.
- **Fields:**
  - `id`: UUID (PK)
  - `name_bn`: VARCHAR(255) NOT NULL
  - `name_en`: VARCHAR(255) NOT NULL
  - `ingredients_json`: JSONB NOT NULL
  - `cooking_instructions_bn`: TEXT NOT NULL
  - `yield_factor`: NUMERIC(4,2) NOT NULL

### 15. `Medication`
- **Purpose:** 32,461 commercial pharmaceuticals mapped to generic DNI rules.
- **Fields:**
  - `id`: UUID (PK)
  - `brand_name`: VARCHAR(255) NOT NULL
  - `generic_name`: VARCHAR(255) NOT NULL
  - `strength`: VARCHAR(100)
  - `manufacturer`: VARCHAR(255)
  - `dgda_reg_no`: VARCHAR(100)
  - `depletions_json`: JSONB
  - `timing_rules_json`: JSONB

### 16. `Supplement`
- **Purpose:** Curated nutraceutical formulations and therapeutic dosing rules.
- **Fields:**
  - `id`: VARCHAR(50) (PK) (e.g. `supp_berberine_500`)
  - `name_en`: VARCHAR(255) NOT NULL
  - `name_bn`: VARCHAR(255) NOT NULL
  - `active_compound`: VARCHAR(255) NOT NULL
  - `therapeutic_dose`: VARCHAR(100) NOT NULL
  - `contraindications`: TEXT[]
  - `verified_bd_brands`: TEXT[]

### 17. `NutritionPlan`
- **Purpose:** The structured 7-day cyclical dietary prescription.
- **Fields:**
  - `id`: VARCHAR(50) (PK) (e.g. `plan_weekly_001`)
  - `visit_id`: VARCHAR(50) (FK -> Visit.id) UNIQUE NOT NULL
  - `target_calories`: INT NOT NULL
  - `target_protein_g`: NUMERIC(5,1) NOT NULL
  - `target_carbs_g`: NUMERIC(5,1) NOT NULL
  - `target_fat_g`: NUMERIC(5,1) NOT NULL
  - `days_json`: JSONB NOT NULL (Meals, items, gram weights, meal times)
  - `is_approved`: BOOLEAN DEFAULT FALSE
  - `approval_status`: VARCHAR(50) DEFAULT 'draft' (`draft`, `approved`, `requires_review`)

### 18. `LifestylePlan`
- **Purpose:** Hydration, exercise, sleep hygiene, and chronotherapy guidelines.
- **Fields:**
  - `id`: UUID (PK)
  - `visit_id`: VARCHAR(50) (FK -> Visit.id) UNIQUE NOT NULL
  - `fluid_target_ml`: INT NOT NULL
  - `fasting_window_hours`: INT NOT NULL
  - `eating_start_time`: TIME NOT NULL
  - `eating_end_time`: TIME NOT NULL
  - `sleep_hygiene_notes`: TEXT

### 19. `ApprovalRecord`
- **Purpose:** Legal and governance digital signature block for prescriptions.
- **Fields:**
  - `id`: UUID (PK)
  - `nutrition_plan_id`: VARCHAR(50) (FK -> NutritionPlan.id) NOT NULL
  - `clinician_id`: UUID (FK -> Clinician.id) NOT NULL
  - `approved_at`: TIMESTAMPTZ NOT NULL
  - `clinician_registration_no`: VARCHAR(100) NOT NULL
  - `digital_signature_hash`: VARCHAR(255) NOT NULL (SHA-256)

### 20. `PatientReport`
- **Purpose:** Sanitized patient-facing projection record (U21 compliant).
- **Fields:**
  - `id`: UUID (PK)
  - `visit_id`: VARCHAR(50) (FK -> Visit.id) UNIQUE NOT NULL
  - `sanitized_content_json`: JSONB NOT NULL (**ZERO KCAL/MACROS**)
  - `generated_at`: TIMESTAMPTZ NOT NULL
  - `access_token`: VARCHAR(100) UNIQUE NOT NULL

### 21. `FollowUp`
- **Purpose:** Scheduled future appointments and review milestones.
- **Fields:**
  - `id`: VARCHAR(50) (PK)
  - `patient_id`: VARCHAR(50) (FK -> Patient.id) NOT NULL
  - `scheduled_date`: DATE NOT NULL
  - `scheduled_time`: VARCHAR(50)
  - `reason`: TEXT NOT NULL
  - `status`: VARCHAR(50) DEFAULT 'scheduled' (`scheduled`, `due_today`, `overdue`, `completed`, `cancelled`)
  - `actual_visit_id`: VARCHAR(50) (FK -> Visit.id)

### 22. `OutcomeRecord`
- **Purpose:** Measured clinical endpoints for longitudinal tracking and research.
- **Fields:**
  - `id`: UUID (PK)
  - `patient_id`: VARCHAR(50) (FK -> Patient.id) NOT NULL
  - `visit_id`: VARCHAR(50) (FK -> Visit.id) NOT NULL
  - `metric_name`: VARCHAR(100) NOT NULL (`weight_loss`, `hba1c_reduction`, `symptom_relief`)
  - `baseline_value`: NUMERIC(10,2) NOT NULL
  - `current_value`: NUMERIC(10,2) NOT NULL
  - `percentage_delta`: NUMERIC(5,2) NOT NULL

### 23. `AuditEvent`
- **Purpose:** Immutable 21 CFR Part 11 compliant audit trail.
- **Fields:**
  - `id`: UUID (PK)
  - `organization_id`: UUID (FK -> Organization.id) NOT NULL
  - `clinician_id`: UUID (FK -> Clinician.id) NOT NULL
  - `patient_id`: VARCHAR(50)
  - `event_type`: VARCHAR(100) NOT NULL (`PATIENT_REGISTERED`, `PLAN_APPROVED`, `GRAM_EDITED`, `SAFETY_OVERRIDE`)
  - `entity_affected`: VARCHAR(50) NOT NULL
  - `entity_id`: VARCHAR(50) NOT NULL
  - `before_payload`: JSONB
  - `after_payload`: JSONB
  - `timestamp`: TIMESTAMPTZ NOT NULL

---

## 3. Migration Strategy from Current LocalStorage

```
+------------------------------------+      +------------------------------------+
| CURRENT LOCALSTORAGE (Schema v2)   |      | FUTURE POSTGRESQL CLUSTER (R2)     |
| • shuddho_saved_patients           | ───► | • Patient + Visit + NutritionPlan  |
| • shuddho_appointments             | ───► | • FollowUp                         |
| • shuddho_clinical_snapshots       | ───► | • ClinicalObservation + Outcome    |
| • shuddho_audit_log                | ───► | • AuditEvent (Immutable append)    |
+------------------------------------+      +------------------------------------+
```

### Idempotent 3-Step Migration Script:
1. **Extraction & Validation:** Parse `localStorage.getItem('shuddho_saved_patients')` and run referential integrity validators (`qa_referential_integrity.py`).
2. **Schema Transformation:** Map JSON snapshots to normalized 3NF relational tables using the entity mapping above.
3. **Dual-Write Verification:** During R2 deployment, write to both local offline cache and PostgreSQL backend until data parity reaches 100%.
