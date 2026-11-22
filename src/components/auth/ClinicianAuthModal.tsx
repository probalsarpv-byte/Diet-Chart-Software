'use client';

import React, { useState } from 'react';
import { ClinicianAuthProfile, isSupabaseConfigured, getSupabaseClient } from '@/lib/supabaseClient';
import { AuditEventPayload } from '@/repositories/types';

interface ClinicianAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClinician: ClinicianAuthProfile | null;
  onAuthSuccess: (clinician: ClinicianAuthProfile) => void;
  onLogout: () => void;
}

export const ClinicianAuthModal: React.FC<ClinicianAuthModalProps> = ({
  isOpen,
  onClose,
  currentClinician,
  onAuthSuccess,
  onLogout
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (!isConfigured) {
        // Mock demo login for environments without Supabase credentials
        const mockProfile: ClinicianAuthProfile = {
          id: 'c0000000-0000-0000-0000-000000000002',
          auth_user_id: 'u0000000-0000-0000-0000-000000000002',
          organization_id: 'a0000000-0000-0000-0000-000000000001',
          name: email.includes('director') ? 'Dr. Tariqul Islam, MD, PhD, CNS' : 'Dr. Farhana Rahman, MD, CNS',
          email: email || 'farhana@shuddhobd.com',
          role: email.includes('director') ? 'CLINICAL_DIRECTOR' : email.includes('assistant') ? 'ASSISTANT_DIETITIAN' : 'TREATING_NUTRITIONIST',
          license_number: 'BMDC-A-67123',
          is_active: true
        };
        onAuthSuccess(mockProfile);
        onClose();
        return;
      }

      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase client failed to initialize');

      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        // Query clinician profile from clinicians table
        const { data: profileData, error: profileErr } = await client
          .from('clinicians')
          .select('*')
          .eq('auth_user_id', data.user.id)
          .maybeSingle();

        if (profileErr) console.warn('Could not fetch clinician profile:', profileErr);

        const profile: ClinicianAuthProfile = {
          id: profileData?.id || data.user.id,
          auth_user_id: data.user.id,
          organization_id: profileData?.organization_id || 'a0000000-0000-0000-0000-000000000001',
          name: profileData?.name || data.user.email || 'Clinician',
          email: data.user.email || '',
          role: (profileData?.role as any) || 'TREATING_NUTRITIONIST',
          license_number: profileData?.license_number,
          is_active: true
        };

        onAuthSuccess(profile);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-teal-400">
              ক্লিনিক্যাল অথেন্টিকেশন / Clinician Login
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure RBAC & Clinical Sign-Off Authentication
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm"
          >
            ✕
          </button>
        </div>

        {currentClinician ? (
          <div className="py-6 space-y-4">
            <div className="p-4 bg-slate-800/80 rounded-xl border border-teal-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">Active Clinician</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentClinician.role === 'CLINICAL_DIRECTOR' 
                    ? 'bg-purple-900/80 text-purple-200 border border-purple-500' 
                    : currentClinician.role === 'TREATING_NUTRITIONIST'
                    ? 'bg-teal-900/80 text-teal-200 border border-teal-500'
                    : 'bg-amber-900/80 text-amber-200 border border-amber-500'
                }`}>
                  {currentClinician.role}
                </span>
              </div>
              <p className="font-semibold text-slate-100">{currentClinician.name}</p>
              <p className="text-xs text-slate-400">{currentClinician.email}</p>
              {currentClinician.license_number && (
                <p className="text-[11px] text-teal-300 mt-1">
                  License: {currentClinician.license_number}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex-1 py-2 px-4 rounded-xl text-xs font-semibold bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800/60 transition-colors"
              >
                লগআউট / Logout
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                বন্ধ করুন / Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="py-4 space-y-4">
            {!isConfigured && (
              <div className="p-3 bg-amber-950/50 border border-amber-600/40 rounded-xl text-xs text-amber-300">
                <span className="font-semibold block mb-0.5">লোকাল ডেমো মোড / Local Demo Mode</span>
                Supabase credentials not configured in this environment. You can log in using simulated roles (e.g. director@shuddhobd.com or farhana@shuddhobd.com).
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-950/60 border border-red-700 rounded-xl text-xs text-red-200">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Clinician Email / চিকিৎসকের ইমেইল
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farhana@shuddhobd.com"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password / পাসওয়ার্ড
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required={isConfigured}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                বাতিল / Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2 px-4 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-colors disabled:opacity-50"
              >
                {isLoading ? 'প্রবেশ করা হচ্ছে...' : 'লগইন / Sign In'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
