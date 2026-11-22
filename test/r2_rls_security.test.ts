/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION SOFTWARE
 * R2: ROW LEVEL SECURITY & SQL MIGRATION SECURITY SUITE
 * 
 * Verifies:
 * - 23 Master entities + support tables are present in migration scripts.
 * - RLS is explicitly enabled on all entities.
 * - Security policies enforce multi-clinic tenancy isolation.
 * - Audit log immutability (NO UPDATE, NO DELETE).
 * - Approval records immutability (NO DELETE, Assistant Dietitian blocked).
 */

import * as fs from 'fs';
import * as path from 'path';

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition: boolean, message: string) {
  totalAssertions++;
  if (!condition) {
    failedAssertions++;
    console.error(`  ✗ FAIL: ${message}`);
  } else {
    passedAssertions++;
    console.log(`  ✓ PASS: ${message}`);
  }
}

console.log('\n================================================================');
console.log('SHUDDHO R2: ROW LEVEL SECURITY & SQL SCHEMA SECURITY SUITE');
console.log('================================================================\n');

const migration1Path = path.join(__dirname, '../supabase/migrations/20261122000001_r2_master_schema.sql');
const migration2Path = path.join(__dirname, '../supabase/migrations/20261122000002_r2_rls_policies.sql');
const bundlePath = path.join(__dirname, '../supabase/r2_complete_bundle.sql');

assert(fs.existsSync(migration1Path), 'Schema Migration 1 file exists');
assert(fs.existsSync(migration2Path), 'RLS Migration 2 file exists');
assert(fs.existsSync(bundlePath), 'Complete Supabase Bundle SQL file exists');

const schemaSql = fs.readFileSync(migration1Path, 'utf8');
const rlsSql = fs.readFileSync(migration2Path, 'utf8');
const bundleSql = fs.readFileSync(bundlePath, 'utf8');

// -------------------------------------------------------------------
// 1. Check all 23 R0 Master Entities in Database Schema
// -------------------------------------------------------------------
console.log('\n--- 1. All 23 Master Entities Present in Schema ---');
const expected23Entities = [
  'organizations',
  'clinicians',
  'patients',
  'visits',
  'assessment_templates',
  'assessment_invitations',
  'assessment_submissions',
  'assessment_reviews',
  'clinical_observations',
  'clinical_hypotheses',
  'evidence_references',
  'lab_results',
  'foods',
  'recipes',
  'medications',
  'supplements',
  'nutrition_plans',
  'lifestyle_plans',
  'approval_records',
  'patient_reports',
  'follow_ups',
  'outcome_records',
  'audit_events'
];

for (const entity of expected23Entities) {
  const tableCheck = schemaSql.includes(`CREATE TABLE IF NOT EXISTS public.${entity}`) ||
                     schemaSql.includes(`CREATE TABLE public.${entity}`);
  assert(tableCheck, `Master Entity [${entity}] created in schema`);
}

// -------------------------------------------------------------------
// 2. Check Support Tables
// -------------------------------------------------------------------
console.log('\n--- 2. Support Tables Present in Schema ---');
const supportTables = [
  'organization_members',
  'patient_assignments',
  'private_file_references',
  'schema_migrations'
];

for (const tbl of supportTables) {
  const tableCheck = schemaSql.includes(`CREATE TABLE IF NOT EXISTS public.${tbl}`) ||
                     schemaSql.includes(`CREATE TABLE public.${tbl}`);
  assert(tableCheck, `Support Table [${tbl}] created in schema`);
}

// -------------------------------------------------------------------
// 3. Row Level Security Enabled on All Entities
// -------------------------------------------------------------------
console.log('\n--- 3. Row Level Security Explicitly Enabled on All Tables ---');
for (const entity of [...expected23Entities, 'organization_members', 'patient_assignments', 'private_file_references']) {
  const rlsEnabled = rlsSql.includes(`ALTER TABLE public.${entity} ENABLE ROW LEVEL SECURITY;`);
  assert(rlsEnabled, `RLS explicitly enabled on [${entity}]`);
}

// -------------------------------------------------------------------
// 4. Strict Immutability Policies
// -------------------------------------------------------------------
console.log('\n--- 4. Strict Immutability Policies Enforced ---');
// audit_events: update forbidden
assert(
  rlsSql.includes('CREATE POLICY "audit_events_update_forbidden" ON public.audit_events') &&
  rlsSql.includes('FOR UPDATE TO authenticated') &&
  rlsSql.includes('USING (false)'),
  'Audit Events update is strictly forbidden (USING false)'
);

// audit_events: delete forbidden
assert(
  rlsSql.includes('CREATE POLICY "audit_events_delete_forbidden" ON public.audit_events') &&
  rlsSql.includes('FOR DELETE TO authenticated') &&
  rlsSql.includes('USING (false)'),
  'Audit Events delete is strictly forbidden (USING false)'
);

// approval_records: delete forbidden
assert(
  rlsSql.includes('CREATE POLICY "approval_records_delete_forbidden" ON public.approval_records') &&
  rlsSql.includes('FOR DELETE TO authenticated') &&
  rlsSql.includes('USING (false)'),
  'Approval Records delete is strictly forbidden (USING false)'
);

// approval_records: assistant dietitian restricted from insertion
assert(
  rlsSql.includes('approval_records_insert_licensed_only') &&
  rlsSql.includes("'CLINICAL_DIRECTOR', 'TREATING_NUTRITIONIST'"),
  'Approval Records insertion strictly requires CLINICAL_DIRECTOR or TREATING_NUTRITIONIST'
);

// -------------------------------------------------------------------
// 5. Multi-Clinic Tenancy Isolation
// -------------------------------------------------------------------
console.log('\n--- 5. Multi-Clinic Tenancy Isolation ---');
assert(
  rlsSql.includes('current_clinician_org_ids()') &&
  rlsSql.includes('organization_id IN (SELECT org_id FROM public.current_clinician_org_ids())'),
  'Tenancy isolation function current_clinician_org_ids() enforced across patient tables'
);

console.log('\n================================================================');
console.log(`R2 RLS SECURITY RESULTS: ${passedAssertions}/${totalAssertions} PASSED (${failedAssertions} FAILED)`);
console.log('================================================================\n');

if (failedAssertions > 0) {
  process.exit(1);
}
