'use client';

import React from 'react';
import { usePractice } from '@/context/PracticeContext';
import { 
  ClipboardList, 
  TrafficCone, 
  Pill, 
  UtensilsCrossed, 
  TrendingUp, 
  FileText,
  AlertTriangle,
  Stethoscope,
  Network
} from 'lucide-react';

export const NavigationTabs: React.FC = () => {
  const { activeTab, setActiveTab, language, trafficLight, dniResult, patient, isDietPlanDirty } = usePractice();

  const tabs = [
    {
      id: 'intake' as const,
      icon: ClipboardList,
      label_bn: '১. ইনটেক ও ল্যাব',
      label_en: '1. Intake & Labs',
      badge: patient.labs.lab_flags && patient.labs.lab_flags.length > 0 ? `${patient.labs.lab_flags.length} flags` : null,
      badgeColor: 'bg-amber-500/15 text-amber-500'
    },
    {
      id: 'assessment' as const,
      icon: Stethoscope,
      label_bn: '২. ১৪-ডোমেন অ্যাসেসমেন্ট',
      label_en: '2. 14-Domain Assessment',
      badge: 'P1 Engine',
      badgeColor: 'bg-primary/15 text-primary'
    },
    {
      id: 'clinical_intelligence' as const,
      icon: Network,
      label_bn: '৩. রুট-কজ ইন্টেলিজেন্স ও ম্যাট্রিক্স',
      label_en: '3. Root-Cause Intelligence',
      badge: 'P2 Decision',
      badgeColor: 'bg-purple-500/15 text-purple-500'
    },
    {
      id: 'conditions' as const,
      icon: TrafficCone,
      label_bn: '৪. ট্রাফিক লাইট কনফ্লিক্ট',
      label_en: '4. Traffic Light Conflicts',
      badge: `${trafficLight.red.length} Red`,
      badgeColor: 'bg-rose-500/15 text-rose-500'
    },
    {
      id: 'dni' as const,
      icon: Pill,
      label_bn: '৫. ড্রাগ-নিউট্রিয়েন্ট ও টাইমলাইন',
      label_en: '5. DNI & Timeline',
      badge: dniResult.criticalWarnings.length > 0 ? 'Alert' : null,
      badgeColor: 'bg-rose-500/15 text-rose-500'
    },
    {
      id: 'diet' as const,
      icon: UtensilsCrossed,
      label_bn: '৬. অটো-স্কেলড ডায়েট',
      label_en: '6. Scaled Diet Chart',
      badge: isDietPlanDirty ? 'Sync' : `${patient.calculated.target_calories} kcal`,
      badgeColor: isDietPlanDirty ? 'bg-amber-500 text-white font-bold animate-pulse' : 'bg-emerald-500/15 text-emerald-500'
    },
    {
      id: 'followup' as const,
      icon: TrendingUp,
      label_bn: '৭. লংগিটিউডিনাল ফলো-আপ',
      label_en: '7. Follow-Up Visits',
      badge: `Phase ${patient.current_phase}`,
      badgeColor: 'bg-primary/15 text-primary'
    },
    {
      id: 'report' as const,
      icon: FileText,
      label_bn: '৮. প্রিন্ট-রেডি রিপোর্ট',
      label_en: '8. Clinical Report',
      badge: 'PDF',
      badgeColor: 'bg-blue-500/15 text-blue-500'
    }
  ];

  return (
    <div className="border-b bg-card px-4 lg:px-8 overflow-x-auto no-scrollbar no-print">
      <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                isActive 
                  ? 'border-primary text-primary font-semibold' 
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span>{language === 'bn' ? tab.label_bn : tab.label_en}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${tab.badgeColor}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
