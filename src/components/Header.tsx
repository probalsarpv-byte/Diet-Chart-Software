'use client';

import React from 'react';
import { usePractice } from '@/context/PracticeContext';
import { 
  Activity, 
  Globe, 
  Moon, 
  Sun, 
  Printer, 
  Save, 
  UserPlus, 
  FolderOpen,
  ShieldCheck,
  Flame,
  Menu
} from 'lucide-react';
import { CLINICAL_PHASES } from '@/engine/phaseProgression';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { 
    language, 
    setLanguage, 
    theme, 
    setTheme, 
    patient, 
    savedPatients, 
    loadPatient, 
    createNewPatient, 
    saveCurrentPatient,
    activeTab,
    setActiveTab 
  } = usePractice();

  const phaseInfo = CLINICAL_PHASES[patient.current_phase];
  const bn = language === 'bn';

  const tabTitles: Record<string, { en: string; bn: string }> = {
    dashboard: { en: 'Practice Overview & Tasks', bn: 'ক্লিনিক্যাল প্র্যাকটিস ওভারভিউ' },
    patients: { en: 'Patient Directory & Visits', bn: 'রোগী রেজিস্ট্রি ও ভিজিট' },
    assessment: { en: '14-Domain Clinical Assessment', bn: '১৪-ডোমেন অ্যাসেসমেন্ট উইজার্ড' },
    clinical_intelligence: { en: 'Root-Cause Intelligence', bn: 'রুট-কজ ইন্টেলিজেন্স' },
    diet: { en: '7-Day Precision Diet Planner', bn: '৭-দিনের সমন্বিত ডায়েট প্ল্যান' },
    followup: { en: 'Longitudinal Follow-Up', bn: 'ফলো-আপ ও অগ্রগতি ট্র্যাকিং' },
    report: { en: 'Clinical Reports Hub (A4 Export)', bn: 'ক্লিনিক্যাল রিপোর্ট হাব' },
    intake: { en: 'Clinical Demographics & Intake', bn: 'ইনটেক ও ল্যাব ডাটা' },
    conditions: { en: 'Concurrent Conditions & Traffic Light', bn: 'মাল্টি-ডিজিজ কনফ্লিক্ট' },
    dni: { en: 'Drug-Nutrient Interactions (Medex BD)', bn: 'ওষুধ-পুষ্টি মিথস্ক্রিয়া (DNI)' }
  };

  const currentTitle = tabTitles[activeTab] || { en: 'Clinical Workspace', bn: 'ক্লিনিক্যাল ওয়ার্কস্পেস' };

  return (
    <header className="border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3 transition-colors shadow-subtle no-print">
      <div className="w-full flex items-center justify-between gap-3">
        
        {/* Left: Mobile Menu Toggle & Current Workspace Title */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-xl border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                SHUDDHO CLINICAL ATELIER
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                {bn ? 'ঢাকা সেন্টার' : 'Central Practice'}
              </span>
            </div>
            <h1 className="font-bold text-base sm:text-lg leading-tight tracking-tight text-foreground">
              {bn ? currentTitle.bn : currentTitle.en}
            </h1>
          </div>
        </div>

        {/* Right: Active Patient Context & Command Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Active Patient Identity Pill (Crucial E2E Locator: header .bg-secondary/70 span.font-semibold) */}
          <div className="flex items-center gap-2 bg-secondary/70 border border-border px-3 py-1.5 rounded-xl text-xs shadow-subtle hover:border-primary/30 transition-colors">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse ring-2 ring-primary/20 shrink-0" />
            <span className="font-semibold text-foreground tracking-tight max-w-[130px] sm:max-w-none truncate">
              {patient.name}
            </span>
            <span className="text-muted-foreground tabular-numbers hidden sm:inline">
              ({patient.age}y, {patient.gender === 'female' ? (bn ? 'মহিলা' : 'F') : (bn ? 'পুরুষ' : 'M')})
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-[11px] font-medium flex items-center gap-1 shrink-0">
              <Flame className="h-3 w-3 text-amber-500" />
              {bn ? `পর্যায় ${patient.current_phase}` : `Phase ${patient.current_phase}`}
            </span>
          </div>

          {/* Quick Actions (Save, New Patient, Patient Switcher) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={saveCurrentPatient}
              title={bn ? 'রোগীর প্রোফাইল সংরক্ষণ করুন' : 'Save Patient Profile'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground shadow-subtle transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{bn ? 'সংরক্ষণ' : 'Save'}</span>
            </button>

            <button
              onClick={createNewPatient}
              title={bn ? 'নতুন রোগী যুক্ত করুন' : 'Create New Patient'}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-border bg-card hover:bg-secondary text-foreground transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{bn ? 'নতুন রোগী' : 'New'}</span>
            </button>

            {savedPatients.length > 0 && (
              <div className="relative group">
                <button
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-border bg-card hover:bg-secondary text-foreground transition-all"
                  title="Load Saved Patient"
                >
                  <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="tabular-numbers">({savedPatients.length})</span>
                </button>
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-card border border-border rounded-xl shadow-dropdown p-1.5 hidden group-hover:block z-50">
                  <div className="text-[11px] font-semibold text-muted-foreground px-2 py-1 border-b border-border">
                    {bn ? 'সংরক্ষিত রোগী তালিকা' : 'Saved Patients'}
                  </div>
                  {savedPatients.map(p => (
                    <button
                      key={p.patient.id}
                      onClick={() => loadPatient(p.patient.id)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-secondary text-xs flex justify-between items-center transition-colors"
                    >
                      <span className="truncate font-medium">{p.patient.name}</span>
                      <span className="text-[10px] text-muted-foreground tabular-numbers">{p.patient.visit_date}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-[1px] bg-border mx-0.5 sm:mx-1" />

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-secondary text-foreground transition-all hover:scale-[1.02]"
            title="Toggle Language"
          >
            <Globe className="h-3.5 w-3.5 text-sky-500" />
            <span>{bn ? 'বাংলা' : 'EN'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-xl text-xs font-medium border border-border bg-card hover:bg-secondary transition-all text-muted-foreground hover:text-foreground hover:scale-[1.05]"
            title="Toggle Dark/Light Mode"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </button>

          {/* Print A4 Report */}
          <button
            data-testid="btn-print"
            onClick={() => {
              setActiveTab('report');
              setTimeout(() => window.print(), 350);
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-foreground text-background hover:opacity-90 shadow-subtle transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Print A4 Clinical Report"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>{bn ? 'A4 রিপোর্ট' : 'A4 Report'}</span>
          </button>
        </div>

      </div>
    </header>
  );
};

