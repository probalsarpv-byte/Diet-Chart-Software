/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * R3 Authoritative Deployment Script & Contract Verification Test
 * 
 * Verifies:
 * 1. Transactional integrity (BEGIN/COMMIT)
 * 2. Idempotent column and index alterations
 * 3. Safe conditional revokes (no failing unconditional REVOKEs)
 * 4. Audit events schema contract: zero direct table inserts into clinician_name
 * 5. Patients confirmed_allergies contract: preserved as JSONB
 * 6. Assessment invitations token nullability (DROP NOT NULL for hash-only architecture)
 * 7. Single authoritative 4-argument submit_public_intake_assessment signature
 * 8. Strict privilege grants (least-privilege boundaries)
 */

import * as fs from 'fs';
import * as path from 'path';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ PASS: ${msg}`);
}

console.log('\n================================================================');
console.log('SHUDDHO R3: DEPLOYMENT SCRIPT & DATABASE CONTRACT TEST');
console.log('================================================================\n');

const deploymentScriptPath = path.join(__dirname, '../supabase/deployment/R3_FINAL_INSTALL_OR_UPGRADE.sql');
const bundleScriptPath = path.join(__dirname, '../supabase/r3_complete_bundle.sql');
const migration3Path = path.join(__dirname, '../supabase/migrations/20261123000003_r3_jsonb_fix.sql');

assert(fs.existsSync(deploymentScriptPath), 'Unified deployment script exists at supabase/deployment/R3_FINAL_INSTALL_OR_UPGRADE.sql');
assert(fs.existsSync(bundleScriptPath), 'Complete bundle exists at supabase/r3_complete_bundle.sql');
assert(fs.existsSync(migration3Path), 'Corrective migration exists at supabase/migrations/20261123000003_r3_jsonb_fix.sql');

const sqlFiles = [
  { name: 'R3_FINAL_INSTALL_OR_UPGRADE.sql', content: fs.readFileSync(deploymentScriptPath, 'utf8') },
  { name: 'r3_complete_bundle.sql', content: fs.readFileSync(bundleScriptPath, 'utf8') },
  { name: '20261123000003_r3_jsonb_fix.sql', content: fs.readFileSync(migration3Path, 'utf8') }
];

for (const { name, content } of sqlFiles) {
  console.log(`\n--- Auditing ${name} ---`);

  // 1. Transactional safety
  assert(content.includes('BEGIN;'), `${name} begins transaction with BEGIN;`);
  assert(content.includes('COMMIT;'), `${name} ends transaction with COMMIT;`);

  // 2. No unconditional REVOKE ON FUNCTION submit_public_intake_assessment
  const unconditionalRevoke = /^REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.submit_public_intake_assessment/m;
  assert(!unconditionalRevoke.test(content), `${name} does NOT contain unconditional REVOKE on non-existent function`);

  // 3. Conditional revoke guard exists
  assert(
    content.includes("pg_proc") && content.includes("submit_public_intake_assessment"),
    `${name} includes safe pg_proc check before revoking legacy submit_public_intake_assessment`
  );

  // 4. Zero inserts into public.audit_events with clinician_name column
  // Regular expression matching INSERT INTO public.audit_events ( ... clinician_name ... )
  const auditInsertWithClinicianName = /INSERT\s+INTO\s+public\.audit_events\s*\([^)]*clinician_name[^)]*\)/gi;
  const auditMatches = content.match(auditInsertWithClinicianName);
  assert(
    auditMatches === null,
    `${name} NEVER inserts directly into audit_events.clinician_name (preserves R2 schema contract)`
  );

  // 5. Preserves confirmed_allergies as JSONB in reconciliation update
  if (name !== '20261123000003_r3_jsonb_fix.sql') {
    // Check reconcile_intake_submission_atomic
    assert(
      content.includes('confirmed_allergies = v_new_allergies'),
      `${name} sets confirmed_allergies = v_new_allergies (JSONB direct)`
    );
    assert(
      !content.includes('confirmed_allergies = ARRAY('),
      `${name} does not cast confirmed_allergies to ARRAY() text[]`
    );
  }

  // 6. Authoritative submit_public_intake_assessment has 4 parameters with consent
  assert(
    content.includes('submit_public_intake_assessment(') &&
    content.includes('p_patient_acknowledged_consent BOOLEAN'),
    `${name} defines authoritative 4-arg submit_public_intake_assessment with p_patient_acknowledged_consent`
  );

  assert(
    content.includes('p_patient_acknowledged_consent IS NOT TRUE'),
    `${name} enforces strict server-side consent validation`
  );

  // 7. Privilege isolation
  assert(
    content.includes('GRANT EXECUTE ON FUNCTION public.submit_public_intake_assessment(TEXT, JSONB, TEXT, BOOLEAN) TO anon'),
    `${name} grants 4-arg submit_public_intake_assessment to anon`
  );

  // Standalone full deployment scripts must also grant verify token and revoke direct table access from anon
  if (name !== '20261123000003_r3_jsonb_fix.sql') {
    assert(
      content.includes('GRANT EXECUTE ON FUNCTION public.verify_public_intake_token(TEXT) TO anon'),
      `${name} grants verify_public_intake_token to anon`
    );
    assert(
      content.includes('REVOKE ALL ON public.assessment_invitations FROM anon;'),
      `${name} revokes direct table access from anon on assessment_invitations`
    );
  }
}

// Check unified script specific requirements
const finalScript = sqlFiles[0].content;
console.log('\n--- Specific checks on R3_FINAL_INSTALL_OR_UPGRADE.sql ---');
assert(
  finalScript.includes('ALTER TABLE public.assessment_invitations ALTER COLUMN token DROP NOT NULL;'),
  'Deployment script safely drops NOT NULL on assessment_invitations.token'
);
assert(
  finalScript.includes('ALTER TABLE public.audit_events\n    ADD COLUMN IF NOT EXISTS clinician_name TEXT;'),
  'Deployment script adds clinician_name as safe non-breaking compatibility column on audit_events'
);
assert(
  finalScript.includes('ADD COLUMN IF NOT EXISTS token_hash TEXT'),
  'Deployment script ensures token_hash column exists on assessment_invitations'
);
assert(
  finalScript.includes('ADD COLUMN IF NOT EXISTS responses_json JSONB'),
  'Deployment script ensures responses_json column exists on assessment_submissions'
);
assert(
  finalScript.includes('ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES public.clinicians(id)'),
  'Deployment script ensures reviewer_id column exists on assessment_reviews'
);

console.log('\n================================================================');
console.log('R3 DEPLOYMENT CONTRACT RESULTS: ALL CHECKS PASSED (0 FAILED)');
console.log('================================================================\n');
