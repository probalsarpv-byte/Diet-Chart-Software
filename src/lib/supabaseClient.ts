/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Supabase Client & Connection Utilities
 * 
 * Complies with:
 * - Next.js Static Export (output: 'export')
 * - Safe client-side initialization via publishable/anon key
 * - Fallback to demo/local mode when environment variables are omitted
 * - Strict Clinician RBAC profile resolution without fake role fallbacks
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseUrl.trim() !== '' && 
    supabaseKey && 
    supabaseKey.trim() !== '' &&
    supabaseUrl.startsWith('http')
  );
};

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'shuddho_clinical_auth'
      }
    });
  }
  return clientInstance;
}

export const supabase = isSupabaseConfigured() ? getSupabaseClient() : null;

export type ClinicianRole = 'CLINICAL_DIRECTOR' | 'TREATING_NUTRITIONIST' | 'ASSISTANT_DIETITIAN';

export interface ClinicianAuthProfile {
  id: string;
  auth_user_id: string;
  organization_id: string;
  name: string;
  email: string;
  role: ClinicianRole;
  license_number?: string;
  phone?: string;
  is_active: boolean;
}

export const VALID_CLINICIAN_ROLES: ClinicianRole[] = [
  'CLINICAL_DIRECTOR',
  'TREATING_NUTRITIONIST',
  'ASSISTANT_DIETITIAN'
];

/**
 * Authoritative clinician profile resolver.
 * Queries public.clinicians for the authenticated user ID.
 * Returns null if user has no linked active clinician record.
 * Never fabricates default role or organization.
 */
export async function fetchClinicianProfile(authUserId: string): Promise<ClinicianAuthProfile | null> {
  const client = getSupabaseClient();
  if (!client || !authUserId) return null;

  try {
    const { data, error } = await client
      .from('clinicians')
      .select('id, auth_user_id, organization_id, name, email, role, license_number, phone, is_active')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    if (!data.is_active) {
      console.warn(`Clinician account [${data.id}] is marked inactive.`);
      return null;
    }

    if (!VALID_CLINICIAN_ROLES.includes(data.role as ClinicianRole)) {
      console.error(`Invalid clinician role [${data.role}] for user [${authUserId}].`);
      return null;
    }

    if (!data.organization_id) {
      console.error(`Missing organization binding for clinician [${data.id}].`);
      return null;
    }

    return {
      id: data.id,
      auth_user_id: data.auth_user_id,
      organization_id: data.organization_id,
      name: data.name || data.email,
      email: data.email,
      role: data.role as ClinicianRole,
      license_number: data.license_number || undefined,
      phone: data.phone || undefined,
      is_active: data.is_active
    };
  } catch (err) {
    console.error('Failed to fetch clinician profile:', err);
    return null;
  }
}
