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
  Flame
} from 'lucide-react';
import { CLINICAL_PHASES } from '@/engine/phaseProgression';

export const Header: React.FC = () => {
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
    setActiveTab 
  } = usePractice();

  const phaseInfo = CLINICAL_PHASES[patient.current_phase];

  return (
    <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3 transition-colors no-print">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Clinic Title */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-600/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-bold shadow-sm">
            <Activity className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg leading-tight tracking-tight text-foreground">
                {language === 'bn' ? 'শুদ্ধ ক্লিনিক্যাল ফাংশনাল নিউট্রিশন' : 'Shuddho Functional Nutrition'}
              </h1>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                100% Deterministic Engine
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'bn' 
                ? 'বাংলাদেশ ফুড ও ড্রাগ ডাটাবেজ সমন্বিত মেটাবলিক প্র্যাকটিস পোর্টাল' 
                : 'Bangladesh Food & Medex Corpus Clinical Practice Management'}
            </p>
          </div>
        </div>

        {/* Active Patient Indicator & Phase Badge */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-secondary/70 border px-3 py-1.5 rounded-lg text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold">{patient.name}</span>
            <span className="text-muted-foreground">({patient.age}y, {patient.gender === 'female' ? (language === 'bn' ? 'মহিলা' : 'F') : (language === 'bn' ? 'পুরুষ' : 'M')})</span>
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[11px] font-medium flex items-center gap-1">
              <Flame className="h-3 w-3" />
              {language === 'bn' ? `পর্যায় ${patient.current_phase}` : `Phase ${patient.current_phase}`}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={saveCurrentPatient}
              title={language === 'bn' ? 'রোগীর প্রোফাইল সংরক্ষণ করুন' : 'Save Patient Profile'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{language === 'bn' ? 'সংরক্ষণ' : 'Save'}</span>
            </button>

            <button
              onClick={createNewPatient}
              title={language === 'bn' ? 'নতুন রোগী যুক্ত করুন' : 'Create New Patient'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-card hover:bg-accent transition"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>{language === 'bn' ? 'নতুন রোগী' : 'New'}</span>
            </button>

            {savedPatients.length > 0 && (
              <div className="relative group">
                <button
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-card hover:bg-accent transition"
                  title="Load Saved Patient"
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  <span>({savedPatients.length})</span>
                </button>
                <div className="absolute right-0 top-full mt-1 w-56 bg-card border rounded-lg shadow-xl p-1 hidden group-hover:block z-50">
                  <div className="text-[11px] font-semibold text-muted-foreground px-2 py-1 border-b">
                    {language === 'bn' ? 'সংরক্ষিত রোগী তালিকা' : 'Saved Patients'}
                  </div>
                  {savedPatients.map(p => (
                    <button
                      key={p.patient.id}
                      onClick={() => loadPatient(p.patient.id)}
                      className="w-full text-left px-2.5 py-1.5 rounded hover:bg-accent text-xs flex justify-between items-center transition"
                    >
                      <span className="truncate">{p.patient.name}</span>
                      <span className="text-[10px] text-muted-foreground">{p.patient.visit_date}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-[1px] bg-border mx-1" />

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-card hover:bg-accent transition"
            title="Toggle Language"
          >
            <Globe className="h-3.5 w-3.5 text-blue-500" />
            <span className="font-semibold">{language === 'bn' ? 'বাংলা' : 'EN'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-lg text-xs font-medium border bg-card hover:bg-accent transition text-muted-foreground"
            title="Toggle Dark/Light Mode"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </button>

          {/* Print A4 Report */}
          <button
            onClick={() => {
              setActiveTab('report');
              setTimeout(() => window.print(), 350);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 shadow-sm transition"
            title="Print A4 Clinical Report"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>{language === 'bn' ? 'A4 রিপোর্ট' : 'A4 Report'}</span>
          </button>
        </div>

      </div>
    </header>
  );
};

