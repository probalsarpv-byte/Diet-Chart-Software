'use client';

import React from 'react';
import { usePractice } from '@/context/PracticeContext';
import { Header } from '@/components/Header';
import { NavigationTabs } from '@/components/NavigationTabs';
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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <Header />
      <NavigationTabs />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'intake' && <IntakeTab />}
        {activeTab === 'assessment' && <AssessmentTab />}
        {activeTab === 'conditions' && <ConditionsTab />}
        {activeTab === 'dni' && <DNITab />}
        {activeTab === 'diet' && <DietChartTab />}
        {activeTab === 'followup' && <FollowUpTab />}
        {activeTab === 'report' && <ReportTab />}
        {activeTab === 'clinical_intelligence' && <ClinicalIntelligenceTab />}
      </main>
    </div>
  );
}

