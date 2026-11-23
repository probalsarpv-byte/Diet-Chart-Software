'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  ChevronDown,
  ChevronRight,
  Activity,
  ShieldCheck,
  Sparkles,
  X,
  Menu,
  Compass
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onMobileClose }) => {
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

  const bn = language === 'bn';
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);

  // Overdue or due today follow-up count
  const pendingAppointments = (followUpAppointments || []).filter(
    a => a.status === 'due_today' || a.status === 'overdue'
  ).length;

  const primaryNavItems = [
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
      badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
    },
    {
      id: 'diet' as const,
      icon: UtensilsCrossed,
      label_bn: '৫. ৭-দিনের ডায়েট প্ল্যান',
      label_en: '5. 7-Day Diet Planner',
      badge: isDietPlanDirty ? 'Sync' : (patient.calculated?.target_calories ? `${patient.calculated.target_calories} kcal` : null),
      badgeColor: isDietPlanDirty ? 'bg-amber-500 text-white font-bold animate-pulse' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
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
      badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
    },
    {
      id: 'protocol_studio' as const,
      icon: Sparkles,
      label_bn: '৮. প্রোটোকল স্টুডিও (R4)',
      label_en: '8. Protocol Studio (R4)',
      badge: 'R4 Studio',
      badgeColor: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
    }
  ];

  const advancedNavItems = [
    {
      id: 'intake' as const,
      icon: ClipboardList,
      testId: 'nav-subtab-intake',
      label_bn: 'ইনটেক ও ল্যাব ডাটা',
      label_en: 'Clinical Overview',
      badge: patient.labs?.lab_flags && patient.labs.lab_flags.length > 0 ? `${patient.labs.lab_flags.length} flags` : null,
      badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
    },
    {
      id: 'conditions' as const,
      icon: TrafficCone,
      testId: 'nav-subtab-conditions',
      label_bn: 'ট্রাফিক লাইট কনফ্লিক্ট',
      label_en: 'Traffic Light Conflicts',
      badge: `${(trafficLight?.red || []).length} Red`,
      badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
    },
    {
      id: 'dni' as const,
      icon: Pill,
      testId: 'nav-subtab-dni',
      label_bn: 'ড্রাগ-নিউট্রিয়েন্ট ইন্টারঅ্যাকশন',
      label_en: 'DNI & Timeline',
      badge: (dniResult?.criticalWarnings || []).length > 0 ? 'Alert' : null,
      badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
    }
  ];

  const handleNavClick = (tabId: any) => {
    setActiveTab(tabId);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card border-r border-border select-none">
      {/* Brand & Clinic Title */}
      <div className="p-5 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground font-black text-lg flex items-center justify-center shadow-subtle">
            শু
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-foreground">SHUDDHO</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium truncate max-w-[155px]">
              {bn ? 'ফাংশনাল নিউট্রিশন প্ল্যাটফর্ম' : 'Clinical Nutrition Studio'}
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 no-scrollbar">
        {/* Core Clinical Workspaces */}
        <div>
          <div className="px-3 mb-2 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            {bn ? 'ক্লিনিক্যাল ওয়ার্কস্পেস' : 'Core Clinical Workspaces'}
          </div>
          <div className="space-y-1">
            {primaryNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  data-testid={`nav-tab-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-subtle font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
                    <span className="truncate">{bn ? item.label_bn : item.label_en}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold shrink-0 tabular-numbers ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced Clinical Tools */}
        <div className="pt-2 border-t border-border">
          <button
            type="button"
            data-testid="nav-tools-menu"
            onClick={() => setShowAdvancedTools(!showAdvancedTools)}
            className="w-full flex items-center justify-between px-3 py-1.5 mb-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{bn ? 'অতিরিক্ত টুলস' : 'Advanced Tools'}</span>
            {showAdvancedTools ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>

          {showAdvancedTools && (
            <div className="space-y-1 animate-in fade-in duration-150">
              {advancedNavItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    data-testid={item.testId}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-subtle font-bold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
                      <span className="truncate">{bn ? item.label_bn : item.label_en}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold shrink-0 tabular-numbers ${
                        isActive ? 'bg-white/20 text-white' : item.badgeColor
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Master Architecture & Roadmap Link */}
        <div className="pt-2 border-t border-border">
          <Link
            href="/roadmap"
            data-testid="sidebar-link-roadmap"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Compass className="h-4 w-4 shrink-0 text-primary group-hover:rotate-45 transition-transform" />
              <span className="truncate">{bn ? 'মাস্টার রোডম্যাপ (R0–R15)' : 'Master Roadmap (R0–R15)'}</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-primary/15 text-primary shrink-0">
              R0
            </span>
          </Link>
        </div>
      </div>

      {/* Sidebar Footer: Practice Identity & Engine Status */}
      <div className="p-3.5 border-t border-border bg-secondary/30 shrink-0 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{bn ? 'ঢাকা ক্লিনিক্যাল সেন্টার' : 'Dhaka Central Practice'}</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">Asia/Dhaka</span>
        </div>
        <div className="p-2 rounded-xl bg-card border border-border/80 text-[10px] text-muted-foreground flex items-center justify-between shadow-2xs">
          <span>{bn ? 'ইঞ্জিন স্থিতি:' : 'Engine:'}</span>
          <span className="font-bold text-primary flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            100% Deterministic
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-30 no-print">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex no-print">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
