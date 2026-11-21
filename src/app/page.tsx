'use client';

import React, { useState } from 'react';
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

export default function Home() {
  const { activeTab } = usePractice();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        </main>
      </div>
    </div>
  );
}
