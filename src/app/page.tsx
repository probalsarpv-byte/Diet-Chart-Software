'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePractice } from '@/context/PracticeContext';
import { Sidebar } from '@/components/navigation/Sidebar';
import { Header } from '@/components/Header';
import { PersistentPatientBar } from '@/components/navigation/PersistentPatientBar';
import { DashboardTab } from '@/components/tabs/DashboardTab';
import { PatientsTab } from '@/components/tabs/PatientsTab';
import { IntakeTab } from '@/components/tabs/IntakeTab';
import { AssessmentTab } from '@/components/tabs/AssessmentTab';
import { ConditionsTab } from '@/components/tabs/ConditionsTab';
import { DNITab } from '@/components/tabs/DNITab';
import { DietChartTab } from '@/components/tabs/DietChartTab';
import { FollowUpTab } from '@/components/tabs/FollowUpTab';
import { ReportTab } from '@/components/tabs/ReportTab';
import { ClinicalIntelligenceTab } from '@/components/p2/ClinicalIntelligenceTab';
import { ProtocolStudioTab } from '@/components/protocol-studio/ProtocolStudioTab';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { Lock, LogIn, ShieldAlert, Loader2, Stethoscope, ArrowRight } from 'lucide-react';

export default function Home() {
  const { activeTab, authState, signOut, language } = usePractice();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const bn = language === 'bn';
  const isCloud = isSupabaseConfigured();

  // If Supabase is configured and user is not verified, render secure access gates
  if (isCloud && authState !== 'AUTHORIZED') {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="flex-1 flex items-center justify-center p-6">
          {/* 1. Loading Session */}
          {(authState === 'INITIALIZING' || authState === 'PROFILE_LOADING' || authState === 'AUTHENTICATING') && (
            <div className="flex flex-col items-center gap-3 p-8">
              <Loader2 className="h-9 w-9 text-primary animate-spin" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center">
                {bn 
                  ? 'ক্লিনিক্যাল অথেন্টিকেশন যাচাই করা হচ্ছে...' 
                  : 'Verifying Clinical Authentication & Organization Session...'}
              </p>
            </div>
          )}

          {/* 2. Unauthorized Account (Authenticated in Supabase, but no active clinician record) */}
          {authState === 'UNAUTHORIZED' && (
            <div className="w-full max-w-lg bg-card border border-destructive/40 rounded-3xl p-8 shadow-2xl text-center backdrop-blur-xl">
              <div className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 mx-auto flex items-center justify-center mb-4">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">
                {bn ? 'অ্যাক্সেস সংরক্ষিত: অননুমোদিত অ্যাকাউন্ট' : 'Access Restricted: Unlinked Clinician Account'}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                {bn
                  ? 'আপনার ব্যবহারকারী অ্যাকাউন্টটি সুপাবেসে অনুমোদিত হলেও এই ক্লিনিক্যাল প্রতিষ্ঠানে কোনো সক্রিয় ক্লিনিশিয়ান রেকর্ডের সাথে যুক্ত নয়। রোগীর স্বাস্থ্য সুরক্ষার স্বার্থে চার্ট অ্যাক্সেস সীমাবদ্ধ করা হয়েছে।'
                  : 'Your account identity is authenticated, but is not linked to an active clinician profile within this clinical organization. Under clinical safety and data privacy protocols, patient chart access is restricted.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={signOut}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border hover:bg-secondary text-foreground transition-all hover:scale-[1.02]"
                >
                  {bn ? 'সাইন আউট / অ্যাকাউন্ট পরিবর্তন' : 'Sign Out / Switch Account'}
                </button>
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground transition-all shadow-subtle flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                  <LogIn className="h-4 w-4" />
                  <span>{bn ? 'অন্য অ্যাকাউন্টে সাইন-ইন' : 'Sign In with Another Account'}</span>
                </Link>
              </div>
            </div>
          )}

          {/* 3. Signed Out / Session Expired / Error */}
          {(authState === 'SIGNED_OUT' || authState === 'SESSION_EXPIRED' || authState === 'ERROR') && (
            <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-8 shadow-2xl text-center backdrop-blur-xl relative overflow-hidden">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 mx-auto flex items-center justify-center mb-4">
                <Lock className="h-8 w-8" />
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
                SHUDDHO CLINICAL ATELIER
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-2">
                {bn ? 'ক্লিনিক্যাল অথেন্টিকেশন প্রয়োজন' : 'Clinical Authentication Required'}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6 max-w-md mx-auto">
                {bn
                  ? 'রোগীর গোপনীয় তথ্য সুরক্ষা এবং পেশাদার নিউট্রিশন প্রেসক্রিপশন পরিচালনার জন্য অনুমোদিত ক্লিনিশিয়ান সাইন-ইন বাধ্যতামূলক।'
                  : 'Verified clinician authentication is required to access patient charts, 14-domain clinical assessments, and 7-day precision nutrition planning engines.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/login"
                  className="px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-primary hover:bg-primary-hover text-primary-foreground transition-all shadow-subtle flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                  <LogIn className="h-4 w-4" />
                  <span>{bn ? 'ওয়ার্কস্পেসে সাইন-ইন করুন' : 'Sign In to Clinical Workspace'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors selection:bg-primary/20 selection:text-primary relative overflow-x-hidden font-sans">
      {/* Subtle ambient clinical lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[360px] bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04),transparent_70%)] pointer-events-none -z-10 blur-2xl" />
      
      {/* ── Left Sidebar Navigation (Desktop Fixed, Mobile Drawer) ── */}
      <Sidebar 
        mobileOpen={mobileMenuOpen} 
        onMobileClose={() => setMobileMenuOpen(false)} 
      />

      {/* ── Main Application Column (Header, Context Bar, Active Workspace) ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <PersistentPatientBar />

        <main className="flex-1 w-full max-w-[1720px] mx-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'patients' && <PatientsTab />}
          {activeTab === 'assessment' && <AssessmentTab />}
          {activeTab === 'clinical_intelligence' && <ClinicalIntelligenceTab />}
          {activeTab === 'diet' && <DietChartTab />}
          {activeTab === 'followup' && <FollowUpTab />}
          {activeTab === 'report' && <ReportTab />}
          {activeTab === 'intake' && <IntakeTab />}
          {activeTab === 'conditions' && <ConditionsTab />}
          {activeTab === 'dni' && <DNITab />}
          {activeTab === 'protocol_studio' && <ProtocolStudioTab />}
        </main>
      </div>
    </div>
  );
}
