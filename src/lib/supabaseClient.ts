/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Supabase Client & Connection Utilities
 * 
 * Complies with:
 * - Next.js Static Export (output: 'export')
 * - Safe client-side initialization via publishable/anon key
 * - Fallback to demo/local mode when environment variables are omitted
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

export interface ClinicianAuthProfile {
  id: string;
  auth_user_id: string;
  organization_id: string;
  name: string;
  email: string;
  role: 'CLINICAL_DIRECTOR' | 'TREATING_NUTRITIONIST' | 'ASSISTANT_DIETITIAN';
  license_number?: string;
  phone?: string;
  is_active: boolean;
}
