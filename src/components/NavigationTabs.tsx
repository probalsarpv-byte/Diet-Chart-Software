'use client';

import React, { useState } from 'react';
import { usePractice } from '@/context/PracticeContext';
import { 
  LayoutDashboard,
  Users,
  Stethoscope,
  Network,
  UtensilsCrossed,
  TrendingUp,
  FileText,
  ClipboardList,
  TrafficCone,
  Pill,
  ChevronDown
} from 'lucide-react';

export const NavigationTabs: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    language, 
    trafficLight, 
    dniResult, 
    patient, 
    isDietPlanDirty,
    followUpAppointments
  } = usePractice();

  const [showSecondaryMenu, setShowSecondaryMenu] = useState(false);

  // Overdue or due today follow-up count
  const pendingAppointments = (followUpAppointments || []).filter(
    a => a.status === 'due_today' || a.status === 'overdue'
  ).length;

  const primaryTabs = [
    {
      id: 'dashboard' as const,
      icon: LayoutDashboard,
      label_bn: '১. ড্যাশবোর্ড',
      label_en: '1. Dashboard',
      badge: pendingAppointments > 0 ? `${pendingAppointments} due` : null,
      badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
    },
    {
      id: 'patients' as const,
      icon: Users,
      label_bn: '২. রোগী রেজিস্ট্রি',
      label_en: '2. Patients',
      badge: null,
      badgeColor: ''
    },
    {
      id: 'assessment' as const,
      icon: Stethoscope,
      label_bn: '৩. ১৪-ডোমেন অ্যাসেসমেন্ট',
      label_en: '3. Assessment',
      badge: 'P1 Engine',
      badgeColor: 'bg-primary/15 text-primary'
    },
    {
      id: 'clinical_intelligence' as const,
      icon: Network,
      label_bn: '৪. রুট-কজ ইন্টেলিজেন্স',
      label_en: '4. Intelligence',
      badge: 'P2 Decision',
      badgeColor: 'bg-purple-500/15 text-purple-500'
    },
    {
      id: 'diet' as const,
      icon: UtensilsCrossed,
      label_bn: '৫. ৭-দিনের ডায়েট প্ল্যান',
      label_en: '5. 7-Day Diet Planner',
      badge: isDietPlanDirty ? 'Sync' : (patient.calculated?.target_calories ? `${patient.calculated.target_calories} kcal` : null),
      badgeColor: isDietPlanDirty ? 'bg-amber-500 text-white font-bold animate-pulse' : 'bg-emerald-500/15 text-emerald-500'
    },
    {
      id: 'followup' as const,
      icon: TrendingUp,
      label_bn: '৬. ফলো-আপ ও অগ্রগতি',
      label_en: '6. Follow-Up',
      badge: `Phase ${patient.current_phase || 1}`,
      badgeColor: 'bg-primary/15 text-primary'
    },
    {
      id: 'report' as const,
      icon: FileText,
      label_bn: '৭. ক্লিনিক্যাল রিপোর্ট হাব',
      label_en: '7. Reports',
      badge: 'A4 Hub',
      badgeColor: 'bg-blue-500/15 text-blue-500'
    }
  ];

  const secondaryTabs = [
    {
      id: 'intake' as const,
      icon: ClipboardList,
      label_bn: 'ক্লিনিক্যাল ওভারভিউ (ভিউ)',
      label_en: 'Clinical Overview',
      badge: patient.labs?.lab_flags && patient.labs.lab_flags.length > 0 ? `${patient.labs.lab_flags.length} flags` : null,
      badgeColor: 'bg-amber-500/15 text-amber-500'
    },
    {
      id: 'conditions' as const,
      icon: TrafficCone,
      label_bn: 'ট্রাফিক লাইট কনফ্লিক্ট',
      label_en: 'Traffic Light Conflicts',
      badge: `${(trafficLight?.red || []).length} Red`,
      badgeColor: 'bg-rose-500/15 text-rose-500'
    },
    {
      id: 'dni' as const,
      icon: Pill,
      label_bn: 'ড্রাগ-নিউট্রিয়েন্ট ইন্টারঅ্যাকশন',
      label_en: 'DNI & Timeline',
      badge: (dniResult?.criticalWarnings || []).length > 0 ? 'Alert' : null,
      badgeColor: 'bg-rose-500/15 text-rose-500'
    }
  ];

  const isSecondaryActive = ['intake', 'conditions', 'dni'].includes(activeTab);

  return (
    <div className="border-b bg-card px-4 lg:px-8 overflow-x-auto no-scrollbar no-print shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 sm:gap-2">
        
        {/* 7 Primary Navigation Tabs */}
        <div className="flex items-center gap-1">
          {primaryTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                data-testid={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                  isActive 
                    ? 'border-primary text-primary font-bold' 
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

        {/* Secondary Safety Tools Dropdown / Quick Switcher */}
        <div className="relative">
          <button
            data-testid="nav-tools-menu"
            onClick={() => setShowSecondaryMenu(!showSecondaryMenu)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isSecondaryActive 
                ? 'bg-primary/10 border-primary/40 text-primary' 
                : 'bg-secondary/40 hover:bg-secondary text-muted-foreground hover:text-foreground border-border'
            }`}
          >
            <span>{language === 'bn' ? 'অতিরিক্ত টুলস' : 'Advanced Tools'}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>

          {showSecondaryMenu && (
            <div 
              onMouseLeave={() => setShowSecondaryMenu(false)}
              className="absolute right-0 top-full mt-1.5 w-64 bg-card border rounded-xl shadow-xl p-1.5 z-50 space-y-1 divide-y divide-border"
            >
              <div className="text-[10px] font-bold text-muted-foreground uppercase px-2.5 py-1">
                {language === 'bn' ? 'সাপোর্টিং ক্লিনিক্যাল মডিউল' : 'Supporting Clinical Modules'}
              </div>

              <div className="pt-1 space-y-1">
                {secondaryTabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      data-testid={`nav-subtab-${tab.id}`}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setShowSecondaryMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition ${
                        isActive ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-accent text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span>{language === 'bn' ? tab.label_bn : tab.label_en}</span>
                      </div>
                      {tab.badge && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${tab.badgeColor}`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
