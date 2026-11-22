-- =====================================================================
-- SHUDDHO CLINICAL FUNCTIONAL & PRECISION NUTRITION PLATFORM
-- R2 SEED DATA FOR LOCAL & TEST ENVIRONMENTS
-- =====================================================================

-- Insert Default Practice Organization
INSERT INTO public.organizations (id, name, slug, address, phone, email, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'SHUDDHO Functional Nutrition & Metabolic Health Clinic',
    'shuddho-metabolic-dhaka',
    'Level 7, Concord Tower, Gulshan-2, Dhaka-1212, Bangladesh',
    '+8801700000000',
    'info@shuddhobd.com',
    true
)
ON CONFLICT (slug) DO NOTHING;

-- Insert Clinicians (One of each role)
-- 1. Clinical Director
INSERT INTO public.clinicians (id, organization_id, name, email, role, license_number, phone, is_active)
VALUES (
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'Dr. Tariqul Islam, MD, PhD, CNS',
    'director@shuddhobd.com',
    'CLINICAL_DIRECTOR',
    'BMDC-A-45892',
    '+8801711111111',
    true
)
ON CONFLICT (email) DO NOTHING;

-- 2. Treating Nutritionist
INSERT INTO public.clinicians (id, organization_id, name, email, role, license_number, phone, is_active)
VALUES (
    'c0000000-0000-0000-0000-000000000002'::uuid,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'Dr. Farhana Rahman, MD, CNS',
    'farhana@shuddhobd.com',
    'TREATING_NUTRITIONIST',
    'BMDC-A-67123',
    '+8801722222222',
    true
)
ON CONFLICT (email) DO NOTHING;

-- 3. Assistant Dietitian
INSERT INTO public.clinicians (id, organization_id, name, email, role, license_number, phone, is_active)
VALUES (
    'c0000000-0000-0000-0000-000000000003'::uuid,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'Sabrina Chowdhury, BSc Nutrition',
    'sabrina@shuddhobd.com',
    'ASSISTANT_DIETITIAN',
    'BNDS-J-1204',
    '+8801733333333',
    true
)
ON CONFLICT (email) DO NOTHING;

-- Organization Memberships
INSERT INTO public.organization_members (organization_id, clinician_id, role)
VALUES 
    ('a0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'CLINICAL_DIRECTOR'),
    ('a0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid, 'TREATING_NUTRITIONIST'),
    ('a0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000003'::uuid, 'ASSISTANT_DIETITIAN')
ON CONFLICT (organization_id, clinician_id) DO NOTHING;

-- Demo Patient: Mrs. Nasreen Akhter
INSERT INTO public.patients (
    id, client_id, organization_id, name, age, gender, phone, email,
    current_visit_id, current_phase, population_group, height_cm, weight_kg, waist_cm,
    activity_level, sleep_hours, shift_worker, bmr_floor_strategy,
    confirmed_allergies, allergy_reconciliation_status, selected_conditions,
    calculated, is_diet_plan_dirty
)
VALUES (
    'p0000000-0000-0000-0000-000000000001'::uuid,
    'pt_nasreen_01',
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'Mrs. Nasreen Akhter',
    52,
    'female',
    '+8801712345678',
    'nasreen.akhter@example.com',
    'vis_nasreen_01',
    1,
    'adult_standard',
    155.00,
    68.50,
    88.00,
    'sedentary',
    6.5,
    false,
    'clamped_to_bmr',
    '["egg"]'::jsonb,
    'allergies_confirmed',
    '["t2d_ir", "hypertension_ckd", "fatty_liver"]'::jsonb,
    '{"bmi": 28.51, "bmr": 1285, "tdee": 1542, "target_calories": 1400, "target_protein_g": 70, "target_carbs_g": 140, "target_fat_g": 45}'::jsonb,
    false
)
ON CONFLICT (organization_id, client_id) DO NOTHING;

-- Assign Patient to Treating Nutritionist
INSERT INTO public.patient_assignments (organization_id, patient_id, clinician_id, is_primary)
VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'p0000000-0000-0000-0000-000000000001'::uuid,
    'c0000000-0000-0000-0000-000000000002'::uuid,
    true
)
ON CONFLICT (patient_id, clinician_id) DO NOTHING;

-- Demo Visit 1
INSERT INTO public.visits (
    id, client_visit_id, organization_id, patient_id, visit_number, visit_date,
    phase_number, visit_type, primary_goals, clinical_notes, status
)
VALUES (
    'v0000000-0000-0000-0000-000000000001'::uuid,
    'vis_nasreen_01',
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'p0000000-0000-0000-0000-000000000001'::uuid,
    1,
    '2026-11-20',
    1,
    'initial_assessment',
    '["Insulin sensitisation", "Blood pressure regulation", "Anti-inflammatory gut restoration"]'::jsonb,
    'Initial comprehensive functional nutrition evaluation. Patient diagnosed with T2D, Grade 1 HTN and Grade 2 hepatic steatosis.',
    'completed'
)
ON CONFLICT (organization_id, client_visit_id) DO NOTHING;
