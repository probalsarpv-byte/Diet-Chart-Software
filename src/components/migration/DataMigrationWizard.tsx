'use client';

import React, { useState } from 'react';
import { PatientProfile } from '@/types';
import { getPracticeRepository } from '@/repositories';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

interface DataMigrationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onMigrationComplete: () => void;
}

export const DataMigrationWizard: React.FC<DataMigrationWizardProps> = ({
  isOpen,
  onClose,
  onMigrationComplete
}) => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [migratedCount, setMigratedCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  const handleExportBackup = () => {
    try {
      const localPatients = localStorage.getItem('shuddho_saved_patients');
      const blob = new Blob([localPatients || '[]'], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shuddho_local_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setStatusMessage(`Backup failed: ${e.message}`);
    }
  };

  const handleStartMigration = async () => {
    setIsMigrating(true);
    setStatusMessage('লোকাল ডাটা স্ক্যান করা হচ্ছে... / Scanning local storage...');

    try {
      const raw = localStorage.getItem('shuddho_saved_patients');
      const patients: PatientProfile[] = raw ? JSON.parse(raw) : [];

      if (patients.length === 0) {
        setStatusMessage('কোনো লোকাল রোগী রেকর্ড পাওয়া যায়নি / No local patient records found.');
        setIsMigrating(false);
        return;
      }

      setStatusMessage(`${patients.length} রোগীর রেকর্ড ক্লাউডে পাঠানো হচ্ছে... / Uploading ${patients.length} records to Supabase...`);

      const repo = getPracticeRepository();
      let successCount = 0;

      for (const p of patients) {
        await repo.savePatient(p);
        successCount++;
      }

      await repo.logAuditEvent({
        event_type: 'DATA_MIGRATED',
        entity_type: 'patient',
        entity_id: 'batch_migration',
        payload_after: { count: successCount, source: 'localStorage' }
      });

      setMigratedCount(successCount);
      setStatusMessage(`সফলভাবে ${successCount} রোগীর রেকর্ড ক্লাউড ব্যাকএন্ডে সংরক্ষিত হয়েছে!`);
      onMigrationComplete();
    } catch (e: any) {
      setStatusMessage(`মাইগ্রেশন ত্রুটি / Migration Error: ${e.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-teal-400">
              ডাটা মাইগ্রেশন উইজার্ড / Data Migration Wizard
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Seamlessly migrate localStorage patient records to Supabase PostgreSQL
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm"
          >
            ✕
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          <p className="text-slate-300">
            এই উইজার্ডের মাধ্যমে আপনার ব্রাউজারের লোকাল স্টোরেজে সংরক্ষিত রোগীর ডাটা নিরাপদে ক্লাউড ব্যাকএন্ডে (Supabase) স্থানান্তর করা যাবে।
          </p>

          {!isConfigured && (
            <div className="p-3 bg-amber-950/50 border border-amber-600/40 rounded-xl text-amber-300">
              ক্লাউড ব্যাকএন্ড কনফিগার করা নেই। ডাটা স্থানান্তর ক্লাউডে যুক্ত না হয়ে লোকাল রিপোজিটরিতে সিমুলেটেড হবে।
            </div>
          )}

          {statusMessage && (
            <div className="p-3 bg-slate-800/80 border border-teal-500/40 rounded-xl text-teal-200">
              {statusMessage}
            </div>
          )}

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-2">
            <span className="font-semibold text-slate-200 block">ধাপ ১: ব্যাকআপ সংরক্ষণ (Recommended)</span>
            <p className="text-slate-400 text-[11px]">
              মাইগ্রেশন শুরু করার পূর্বে একটি অফলাইন JSON ব্যাকআপ কপি ডাউনলোড করে রাখুন।
            </p>
            <button
              onClick={handleExportBackup}
              type="button"
              className="py-1.5 px-3 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
            >
              📥 ডাউনলোড ব্যাকআপ JSON / Export Backup
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            বন্ধ করুন / Close
          </button>
          <button
            onClick={handleStartMigration}
            disabled={isMigrating}
            className="flex-1 py-2 px-4 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-colors disabled:opacity-50"
          >
            {isMigrating ? 'স্থানান্তর হচ্ছে...' : '🚀 ক্লাউড মাইগ্রেশন শুরু করুন'}
          </button>
        </div>
      </div>
    </div>
  );
};
