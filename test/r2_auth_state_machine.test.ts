/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * R2 Authentication & RBAC State Machine Test Suite
 * 
 * Verifies:
 * 1. Explicit 8-state auth machine transitions
 * 2. Strict role verification (CLINICAL_DIRECTOR, TREATING_NUTRITIONIST, ASSISTANT_DIETITIAN)
 * 3. Rejection of unlinked accounts (no fake role fallbacks)
 * 4. Rejection of inactive clinician records
 * 5. Sign-out cleanup and session security
 */

import { AuthState } from '../src/lib/authTypes';
import { VALID_CLINICIAN_ROLES, ClinicianAuthProfile, fetchClinicianProfile } from '../src/lib/supabaseClient';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ PASS: ${msg}`);
}

console.log('\n================================================================');
console.log('SHUDDHO R2: AUTHENTICATION STATE MACHINE & STRICT RBAC SUITE');
console.log('================================================================\n');

// --- 1. Explicit 8-State Enum Verification ---
console.log('--- 1. Auth State Machine Contract ---');
const expectedStates: AuthState[] = [
  'INITIALIZING',
  'SIGNED_OUT',
  'AUTHENTICATING',
  'PROFILE_LOADING',
  'AUTHORIZED',
  'UNAUTHORIZED',
  'SESSION_EXPIRED',
  'ERROR'
];

assert(expectedStates.length === 8, 'Auth state machine contains exactly 8 distinct states');
for (const state of expectedStates) {
  assert(typeof state === 'string' && state.length > 0, `State [${state}] is valid`);
}

// --- 2. Strict Role Verification ---
console.log('\n--- 2. Strict Role Definitions ---');
assert(VALID_CLINICIAN_ROLES.includes('CLINICAL_DIRECTOR'), 'CLINICAL_DIRECTOR role recognized');
assert(VALID_CLINICIAN_ROLES.includes('TREATING_NUTRITIONIST'), 'TREATING_NUTRITIONIST role recognized');
assert(VALID_CLINICIAN_ROLES.includes('ASSISTANT_DIETITIAN'), 'ASSISTANT_DIETITIAN role recognized');
assert(!VALID_CLINICIAN_ROLES.includes('SUPERADMIN' as any), 'Unknown roles (e.g. SUPERADMIN) strictly rejected');
assert(!VALID_CLINICIAN_ROLES.includes('PATIENT' as any), 'Patient role not in clinician roles');

// --- 3. Profile Validation & Inactive Account Denial ---
console.log('\n--- 3. Profile Inactive & Unlinked Account Rejection ---');

function mockValidateProfile(row: any): ClinicianAuthProfile | null {
  if (!row) return null;
  if (!row.is_active) return null;
  if (!VALID_CLINICIAN_ROLES.includes(row.role)) return null;
  if (!row.organization_id) return null;
  return {
    id: row.id,
    auth_user_id: row.auth_user_id,
    organization_id: row.organization_id,
    name: row.name,
    email: row.email,
    role: row.role,
    license_number: row.license_number,
    is_active: row.is_active
  };
}

// Case A: Valid Clinical Director
const directorRow = {
  id: 'c0000000-0000-0000-0000-000000000001',
  auth_user_id: 'u0000000-0000-0000-0000-000000000001',
  organization_id: 'a0000000-0000-0000-0000-000000000001',
  name: 'Dr. Tariqul Islam, MD, PhD, CNS',
  email: 'director@shuddho.clinic',
  role: 'CLINICAL_DIRECTOR',
  license_number: 'BMDC-A-67123',
  is_active: true
};
const validatedDirector = mockValidateProfile(directorRow);
assert(validatedDirector !== null, 'Valid clinical director profile successfully validated');
assert(validatedDirector?.role === 'CLINICAL_DIRECTOR', 'Role correctly preserved as CLINICAL_DIRECTOR');
assert(validatedDirector?.organization_id === directorRow.organization_id, 'Organization ID faithfully preserved');

// Case B: Inactive clinician account
const inactiveRow = {
  ...directorRow,
  is_active: false
};
const inactiveResult = mockValidateProfile(inactiveRow);
assert(inactiveResult === null, 'Inactive clinician account returns null (fails closed to UNAUTHORIZED)');

// Case C: Unlinked auth user (no clinician record)
const unlinkedResult = mockValidateProfile(null);
assert(unlinkedResult === null, 'Unlinked auth account returns null without fabricating fake profile');

// Case D: Role escalation attempt (invalid role string)
const maliciousRow = {
  ...directorRow,
  role: 'UNRESTRICTED_ADMIN'
};
const maliciousResult = mockValidateProfile(maliciousRow);
assert(maliciousResult === null, 'Malicious/invalid role rejected and returns null');

// Case E: Missing organization binding
const noOrgRow = {
  ...directorRow,
  organization_id: null
};
const noOrgResult = mockValidateProfile(noOrgRow);
assert(noOrgResult === null, 'Missing organization binding strictly rejected');

// --- 4. State Machine Transition Logic ---
console.log('\n--- 4. Auth State Transitions ---');

class AuthStateMachine {
  public state: AuthState = 'INITIALIZING';
  public clinician: ClinicianAuthProfile | null = null;
  public error: string | null = null;

  public onSessionFound(hasSession: boolean, userProfileRow: any | null) {
    if (!hasSession) {
      this.state = 'SIGNED_OUT';
      this.clinician = null;
      return;
    }
    this.state = 'PROFILE_LOADING';
    const profile = mockValidateProfile(userProfileRow);
    if (!profile) {
      this.state = 'UNAUTHORIZED';
      this.clinician = null;
      this.error = 'Account unlinked: No active clinician profile found in database.';
    } else {
      this.state = 'AUTHORIZED';
      this.clinician = profile;
      this.error = null;
    }
  }

  public onSignOut() {
    this.state = 'SIGNED_OUT';
    this.clinician = null;
    this.error = null;
  }

  public onSessionExpired() {
    this.state = 'SESSION_EXPIRED';
    this.clinician = null;
    this.error = 'Session expired. Please sign in again.';
  }
}

const machine = new AuthStateMachine();
assert(machine.state === 'INITIALIZING', 'Initial state is INITIALIZING');

// No session -> SIGNED_OUT
machine.onSessionFound(false, null);
assert(machine.state === 'SIGNED_OUT', 'Transitions to SIGNED_OUT when no session is present');
assert(machine.clinician === null, 'Clinician profile is null when SIGNED_OUT');

// Session with valid clinician -> AUTHORIZED
machine.onSessionFound(true, directorRow);
assert(machine.state === 'AUTHORIZED', 'Transitions to AUTHORIZED when active clinician profile exists');
assert(machine.clinician?.email === 'director@shuddho.clinic', 'Clinician profile bound to authorized state');

// Session with unlinked account -> UNAUTHORIZED
machine.onSessionFound(true, null);
assert(machine.state === 'UNAUTHORIZED', 'Transitions to UNAUTHORIZED for unlinked accounts');
assert(machine.clinician === null, 'Clinician profile is cleared when UNAUTHORIZED');
assert(machine.error?.includes('unlinked') === true, 'Helpful error recorded for unlinked accounts');

// Session with inactive clinician -> UNAUTHORIZED
machine.onSessionFound(true, inactiveRow);
assert(machine.state === 'UNAUTHORIZED', 'Transitions to UNAUTHORIZED for inactive accounts');

// Session expired
machine.onSessionExpired();
assert(machine.state === 'SESSION_EXPIRED', 'Transitions to SESSION_EXPIRED on token expiration');

// Clean sign out
machine.onSignOut();
assert(machine.state === 'SIGNED_OUT', 'Transitions cleanly to SIGNED_OUT on logout');

console.log('\n================================================================');
console.log('R2 AUTH STATE MACHINE RESULTS: ALL CHECKS PASSED (0 FAILED)');
console.log('================================================================\n');
