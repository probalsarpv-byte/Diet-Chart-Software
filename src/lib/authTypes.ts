/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Explicit 8-State Authentication & Authorization State Machine
 * 
 * Strict Role-Based Access Control:
 * - CLINICAL_DIRECTOR: Full practice authority, plan approval, clinician onboarding
 * - TREATING_NUTRITIONIST: Patient care, plan creation & formal approval
 * - ASSISTANT_DIETITIAN: Chart prep & meal staging (approval strictly blocked)
 */

import { ClinicianAuthProfile } from './supabaseClient';

export type AuthState = 
  | 'INITIALIZING'     // Checking active session on mount
  | 'SIGNED_OUT'       // Unauthenticated visitor
  | 'AUTHENTICATING'   // Credentials verification in flight
  | 'PROFILE_LOADING'  // Auth session valid; resolving clinician DB profile
  | 'AUTHORIZED'       // Active verified clinician linked to organization
  | 'UNAUTHORIZED'     // Authenticated in Supabase, but missing active clinician record
  | 'SESSION_EXPIRED'  // Auth token expired or refresh failed
  | 'ERROR';           // Network or unexpected auth fault

export interface AuthContextValue {
  authState: AuthState;
  currentClinician: ClinicianAuthProfile | null;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}
