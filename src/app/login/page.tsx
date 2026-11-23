'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  Globe,
  Sparkles,
  Stethoscope
} from 'lucide-react';
import { isSupabaseConfigured, getSupabaseClient, fetchClinicianProfile } from '@/lib/supabaseClient';
import { usePractice } from '@/context/PracticeContext';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const { setCurrentClinician, setAuthState } = usePractice();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'bn'>('en');

  const isConfigured = isSupabaseConfigured();
  const bn = lang === 'bn';

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage(bn ? 'ইমেইল এবং পাসওয়ার্ড প্রদান করুন।' : 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      if (!isConfigured) {
        if (process.env.NODE_ENV === 'production') {
          setErrorMessage(
            bn 
              ? 'নিরাপত্তা ত্রুটি: প্রোডাকশন পরিবেশে লাইভ ব্যাকএন্ড কনফিগারেশন ছাড়া ডেমো লগইন নিষিদ্ধ।' 
              : 'Production Security Error: Live Supabase backend is unconfigured. Simulated login is strictly disabled in production.'
          );
          setAuthState('ERROR');
          return;
        }

        // Mock demo login for local / test environments without Supabase credentials
        const mockProfile = {
          id: 'c0000000-0000-0000-0000-000000000002',
          auth_user_id: 'u0000000-0000-0000-0000-000000000002',
          organization_id: 'a0000000-0000-0000-0000-000000000001',
          name: email.toLowerCase().includes('director') ? 'Dr. Tariqul Islam, MD, PhD, CNS' : 'Dr. Farhana Rahman, MD, CNS',
          email: email.trim(),
          role: email.toLowerCase().includes('director') 
            ? ('CLINICAL_DIRECTOR' as const)
            : email.toLowerCase().includes('assistant') 
            ? ('ASSISTANT_DIETITIAN' as const) 
            : ('TREATING_NUTRITIONIST' as const),
          license_number: 'BMDC-A-67123',
          is_active: true
        };
        setCurrentClinician(mockProfile);
        setAuthState('AUTHORIZED');
        router.push(redirectPath);
        return;
      }

      const client = getSupabaseClient();
      if (!client) {
        throw new Error(bn ? 'ডাটাবেস ক্লায়েন্ট সংযোগ ব্যর্থ হয়েছে।' : 'Supabase client failed to initialize.');
      }

      setAuthState('AUTHENTICATING');
      const { data: authData, error: authError } = await client.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (authError) {
        setAuthState('ERROR');
        throw authError;
      }

      if (!authData.user) {
        setAuthState('ERROR');
        throw new Error(bn ? 'লগইন সফল হয়নি। আবার চেষ্টা করুন।' : 'Authentication failed. Please try again.');
      }

      // Step 2: Fetch and strictly validate clinician database profile
      setAuthState('PROFILE_LOADING');
      const profile = await fetchClinicianProfile(authData.user.id);

      if (!profile) {
        setAuthState('UNAUTHORIZED');
        setErrorMessage(
          bn 
            ? 'অননুমোদিত: এই অ্যাকাউন্টের সাথে কোনো সক্রিয় ক্লিনিকাল রেকর্ড যুক্ত নেই। ক্লিনিকাল ডিরেক্টরের সাথে যোগাযোগ করুন।' 
            : 'Access Denied: Your account is authenticated, but is not linked to an active clinician record in this clinical organization. Please contact your Clinical Director.'
        );
        return;
      }

      setCurrentClinician(profile);
      setAuthState('AUTHORIZED');
      router.push(redirectPath);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setErrorMessage(err?.message || (bn ? 'লগইন ব্যর্থ হয়েছে।' : 'Authentication failed. Please verify credentials.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrorMessage(bn ? 'পাসওয়ার্ড রিসেটের জন্য প্রথমে আপনার ইমেইল প্রদান করুন।' : 'Please enter your email address to reset password.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      if (!isConfigured) {
        setSuccessMessage(
          bn 
            ? 'ডেমো মোড: পাসওয়ার্ড রিসেট লিঙ্ক সিমুলেট করা হয়েছে।' 
            : 'Demo Mode: Password reset instructions simulated.'
        );
        return;
      }

      const client = getSupabaseClient();
      if (!client) throw new Error('Database client not configured');

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${origin}${window.location.pathname}`;

      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl
      });

      if (error) throw error;

      setSuccessMessage(
        bn 
          ? `পাসওয়ার্ড রিসেটের নির্দেশাবলী ${email.trim()} ঠিকানায় পাঠানো হয়েছে।` 
          : `Password reset instructions sent to ${email.trim()}. Please check your inbox.`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || (bn ? 'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে।' : 'Failed to send password reset email.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{bn ? 'ওয়ার্কস্পেসে ফিরে যান' : 'Back to Workspace'}</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
          >
            <Globe className="h-3.5 w-3.5 text-emerald-400" />
            <span>{bn ? 'English' : 'বাংলা'}</span>
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-xl relative overflow-hidden">
          {/* Subtle clinical accent glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Practice Branding & Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3 shadow-inner">
              <Stethoscope className="h-7 w-7" />
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-1">
              <span>SHUDDHO CLINICAL ATELIER</span>
              <span>•</span>
              <span>RBAC PORTAL</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {bn ? 'ক্লিনিশিয়ান লগইন' : 'Clinician Authentication'}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {bn 
                ? 'কার্যকরী ও সুনির্দিষ্ট পুষ্টি প্ল্যাটফর্মে নিরাপদ অ্যাক্সেস' 
                : 'Secure access to Functional & Precision Nutrition Intelligence'}
            </p>
          </div>

          {/* Status / Alert Messages */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {bn ? 'ইমেইল অ্যাড্রেস' : 'Clinician Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={bn ? 'ডাক্তার / নিউট্রিশনিস্টের ইমেইল' : 'director@shuddho.clinic'}
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {bn ? 'পাসওয়ার্ড' : 'Account Password'}
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {bn ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot password?'}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{bn ? 'যাচাই করা হচ্ছে...' : 'Authenticating Clinician...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>{bn ? 'ক্লিনিক্যাল সাইন-ইন' : 'Sign In to Clinical Workspace'}</span>
                </>
              )}
            </button>
          </form>

          {/* Clinical Security Notice */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 mb-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>BMDC & HIPAA Compliant Role-Based Access Gate</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {bn 
                ? 'শুধুমাত্র অনুমোদিত ডায়েটিশিয়ান ও ক্লিনিশিয়ানদের জন্য সংরক্ষিত।' 
                : 'Restricted to verified Clinical Directors, Treating Nutritionists & Clinical Staff.'}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-[11px] text-slate-600">
        SHUDDHO Clinical Intelligence Platform © {new Date().getFullYear()} • Dual Cloudflare & Supabase Architecture
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
          <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mb-3" />
          <p className="text-xs uppercase tracking-widest text-slate-500">
            Initializing Secure Auth Channel...
          </p>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
