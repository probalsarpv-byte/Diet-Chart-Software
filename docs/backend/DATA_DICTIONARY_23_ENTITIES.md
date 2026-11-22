# SHUDDHO Data Dictionary: 23 Master Entities & Support Tables

**Document ID:** SHUDDHO-DOC-R2-003  
**Audited Schema:** PostgreSQL 15 (Supabase)  
**Security Standard:** Strict Typed Contracts, JSONB Encodings, Check Constraints  

---

## 1. Practice & Clinician Tenancy

### 1.1 `organizations`
Multi-clinic enterprise practice tenant.
- `id` (UUID, PK): Unique organization UUID.
- `name` (TEXT, NOT NULL): Legal clinic name (e.g. *SHUDDHO Functional Nutrition Clinic*).
- `slug` (TEXT, UNIQUE): Human-readable URL identifier (e.g. *shuddho-metabolic-dhaka*).
- `address`, `phone`, `email` (TEXT): Clinical headquarters contact metadata.
- `logo_url` (TEXT): Clinic letterhead logo URL.
- `is_active` (BOOLEAN): Practice operational status.
- `created_at`, `updated_at` (TIMESTAMPTZ): Audit timestamps.

### 1.2 `clinicians`
Licensed healthcare providers, directors, and dietetic assistants.
- `id` (UUID, PK): Clinician identity UUID.
- `auth_user_id` (UUID, UNIQUE): Foreign key to Supabase `auth.users(id)`.
- `organization_id` (UUID, FK -> `organizations.id`): Active clinic practice.
- `name` (TEXT, NOT NULL): Full legal clinician name.
- `email` (TEXT, UNIQUE): Clinician professional email.
- `role` (TEXT, CHECK): Role designation (`CLINICAL_DIRECTOR`, `TREATING_NUTRITIONIST`, `ASSISTANT_DIETITIAN`).
- `license_number` (TEXT): Medical/Dietetics registration credential (e.g. *BMDC-A-67123*).
- `phone` (TEXT): Clinician contact number.
- `is_active` (BOOLEAN): Status.

### 1.3 `organization_members` (Support)
Multi-clinic roster binding clinicians to multiple organizations.

---

## 2. Patient & Consultation Registry

### 2.1 `patients`
Core patient demographic, metabolic, and clinical profile.
- `id` (UUID, PK): Database UUID.
- `client_id` (TEXT, NOT NULL): Client-facing logical identifier (e.g. *pt_nasreen_01*).
- `organization_id` (UUID, FK -> `organizations.id`): Practice isolation tenant.
- `name` (TEXT, NOT NULL): Patient name.
- `age` (INTEGER, CHECK 0-130): Somatic age in years.
- `gender` (TEXT, CHECK): Gender (`male`, `female`, `other`).
- `phone`, `email` (TEXT): Patient contact info.
- `current_visit_id` (TEXT): Active consultation visit pointer.
- `current_phase` (INTEGER, CHECK 1-4): Functional metabolic phase (1: Foundations, 2: Optimization, 3: Expansion, 4: Maintenance).
- `population_group` (TEXT): Population classification (`adult_standard`, `elderly`, `pregnancy`, `lactation`, `pediatric`).
- `height_cm`, `weight_kg`, `waist_cm` (NUMERIC): Somatic anthropometrics.
- `activity_level` (TEXT): Physical activity category.
- `sleep_hours` (NUMERIC): Circadian rest duration.
- `shift_worker` (BOOLEAN): Shift work indicator.
- `bmr_floor_strategy` (TEXT): Calorie clamping strategy.
- `confirmed_allergies` (JSONB): Reconciled food allergens.
- `allergy_reconciliation_status` (TEXT): Clinical reconciliation status.
- `clinician_disallowed_foods`, `clinician_disallowed_tags` (JSONB): Specific food eliminations.
- `selected_conditions` (JSONB): Active diagnosed conditions (`t2d_ir`, `hypertension_ckd`, `fatty_liver`, etc.).
- `active_medications`, `medication_records` (JSONB): Pharmaceutical regimen.
- `feeding_status` (JSONB): Route (`oral_standard`, `enteral`, `parenteral`, `npo`).
- `gut_profile` (JSONB): Functional GI parameters (Bristol stool, bloating, agni).
- `labs` (JSONB): Functional and conventional laboratory markers.
- `calculated` (JSONB): Derived metrics (BMI, BMR, TDEE, macro targets).
- `clinical_safety` (JSONB): Active safety evaluations and fluid restrictions.
- `is_diet_plan_dirty` (BOOLEAN): Dirty state detection.
- `notes` (TEXT): Confidential clinical notes.

### 2.2 `patient_assignments` (Support)
Maps patients to treating nutritionists and primary case clinicians.

### 2.3 `visits`
Longitudinal consultation ledger.
- `id` (UUID, PK): Database UUID.
- `client_visit_id` (TEXT, NOT NULL): Logical visit ID (e.g. *vis_nasreen_01*).
- `organization_id`, `patient_id` (UUID, FK).
- `visit_number` (INTEGER): Sequential consultation counter.
- `visit_date` (DATE): Consult calendar date.
- `phase_number` (INTEGER): Clinical phase at visit.
- `visit_type` (TEXT, CHECK): Consultation modality (`initial_assessment`, `phase_progression_review`, `acute_flare_review`, `discharge_summary`).
- `primary_goals` (JSONB): Agreed therapeutic goals.
- `clinical_notes` (TEXT): Clinician subjective/objective evaluation.
- `status` (TEXT, CHECK): Lifecycle state (`scheduled`, `in_progress`, `completed`, `cancelled`).

---

## 3. Assessment & Clinical Intelligence

### 3.1 `assessment_templates`
Standardized 14-domain functional health questionnaires.

### 3.2 `assessment_invitations`
Secure, tokenized questionnaire invitations dispatched to patients.

### 3.3 `assessment_submissions`
Raw patient response sets captured via secure web forms.

### 3.4 `assessment_reviews`
Clinician scored domain metrics, symptom severity indexes, and red flags.

### 3.5 `clinical_observations`
Physical signs (tongue, pulse, nail, skin, somatic observations).

### 3.6 `clinical_hypotheses`
Systems-biology functional hypotheses (e.g. *Dysbiosis-driven intestinal hyperpermeability*).

### 3.7 `evidence_references`
Citations, PubMed IDs, and clinical guidelines backing functional hypotheses.

### 3.8 `lab_results`
Biomarker measurements, units, conventional ranges, functional optimal targets, and flags.

---

## 4. Nutrition, Interventions & Therapeutic Plans

### 4.1 `foods`
Authentic Bangladesh Food Composition Database (FCTB) items with native macronutrients, PRAL, and glycemic load.

### 4.2 `recipes`
Therapeutic Bengali culinary formulations, ingredients, preparation instructions, and yield.

### 4.3 `medications`
Active pharmaceuticals, routes, timing, and nutrient depletion profiles.

### 4.4 `supplements`
Targeted nutraceuticals, doses, forms, timing, and evidence grades.

### 4.5 `nutrition_plans`
Authoritative 7-day personalized weekly nutrition plan, day schedules, meal items, target macros, and adequacy evaluations.

### 4.6 `lifestyle_plans`
Circadian, sleep hygiene, physical movement, stress reduction, and hydration protocols.

---

## 5. Governance, Reporting & Auditing

### 5.1 `approval_records`
Formal legal clinical approval record binding plan version to clinician license number.

### 5.2 `patient_reports`
Patient-safe projected diet prescriptions physically omitting internal calculations (calories, macros, BMR, TDEE, PRAL, GL).

### 5.3 `follow_ups`
Scheduled progress reviews, reminder channels (SMS/WhatsApp), and attendance tracking.

### 5.4 `outcome_records`
Longitudinal outcome measurements (weight delta, HbA1c drop, symptom resolution %).

### 5.5 `audit_events` (U18)
Immutable regulatory ledger recording timestamp, clinician ID, event type, entity ID, and delta payload.

### 5.6 `private_file_references` (Support)
Metadata linking patient records to private Supabase Storage files.

### 5.7 `schema_migrations` (Support)
PostgreSQL migration ledger verifying applied schema versions.
