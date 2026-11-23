-- =====================================================================
-- SHUDDHO Clinical Functional Nutrition Platform
-- Phase R4: Advanced Lifestyle, Chronotherapy & Supplements (U06)
-- Forward-only Idempotent Migration
-- =====================================================================

BEGIN;

-- 1. Extend public.lifestyle_plans with R4 Protocol Studio columns
ALTER TABLE public.lifestyle_plans
    ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'automatic_generated',
    ADD COLUMN IF NOT EXISTS lifestyle_protocol JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS supplement_protocol JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS chronotherapy_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS safety_evaluation JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.clinicians(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS approval_notes TEXT;

-- 2. Create index on status and approval
CREATE INDEX IF NOT EXISTS idx_lifestyle_plans_approval 
    ON public.lifestyle_plans(patient_id, is_approved);

CREATE INDEX IF NOT EXISTS idx_lifestyle_plans_version 
    ON public.lifestyle_plans(patient_id, version);

-- 3. Register Migration
INSERT INTO public.schema_migrations (version, name, applied_at)
VALUES ('20261124000001', 'r4_protocol_studio', timezone('utc'::text, now()))
ON CONFLICT (version) DO UPDATE 
SET applied_at = timezone('utc'::text, now());

COMMIT;
