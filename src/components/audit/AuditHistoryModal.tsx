'use client';

import React, { useState, useEffect } from 'react';
import { AuditEventPayload } from '@/repositories/types';
import { getPracticeRepository } from '@/repositories';

interface AuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
}

export const AuditHistoryModal: React.FC<AuditHistoryModalProps> = ({
  isOpen,
  onClose,
  patientId
}) => {
  const [events, setEvents] = useState<AuditEventPayload[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      loadAuditEvents();
    }
  }, [isOpen, patientId]);

  const loadAuditEvents = async () => {
    setIsLoading(true);
    try {
      const repo = getPracticeRepository();
      const list = await repo.getAuditEvents(patientId, 100);
      setEvents(list);
    } catch (e) {
      console.error('Failed to load audit events:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredEvents = events.filter(e => {
    if (filterType === 'all') return true;
    return e.event_type === filterType;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl p-6 text-slate-100 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-teal-400">
              ক্লিনিক্যাল অডিট লগ / Clinical Audit Trail (U18)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable regulatory record of clinical decisions, plans, and approvals
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm"
          >
            ✕
          </button>
        </div>

        <div className="py-3 flex items-center justify-between gap-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Filter Event:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Events</option>
              <option value="PLAN_APPROVED">PLAN_APPROVED</option>
              <option value="PLAN_UPDATED">PLAN_UPDATED</option>
              <option value="PATIENT_CREATED">PATIENT_CREATED</option>
              <option value="PATIENT_UPDATED">PATIENT_UPDATED</option>
              <option value="DATA_MIGRATED">DATA_MIGRATED</option>
            </select>
          </div>
          <span className="text-xs text-slate-400">
            Total Events: {filteredEvents.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-2">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              অডিট লগ লোড হচ্ছে... / Loading audit events...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              কোনো অডিট রেকর্ড পাওয়া যায়নি / No audit events recorded yet.
            </div>
          ) : (
            filteredEvents.map((evt, idx) => (
              <div
                key={evt.id || idx}
                className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex flex-col gap-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    evt.event_type.includes('APPROVED')
                      ? 'bg-teal-900/60 text-teal-300 border border-teal-600'
                      : evt.event_type.includes('CREATED')
                      ? 'bg-blue-900/60 text-blue-300 border border-blue-600'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {evt.event_type}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {evt.timestamp ? new Date(evt.timestamp).toLocaleString() : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-300 pt-1">
                  <span>Target: <strong className="text-slate-100">{evt.entity_type} ({evt.entity_id})</strong></span>
                  {evt.clinician_name && (
                    <span>By: <strong className="text-teal-300">{evt.clinician_name}</strong></span>
                  )}
                </div>
                {evt.payload_after && (
                  <pre className="mt-1 p-2 bg-slate-950/80 rounded border border-slate-800 text-[10px] text-slate-300 overflow-x-auto">
                    {JSON.stringify(evt.payload_after, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            বন্ধ করুন / Close
          </button>
        </div>
      </div>
    </div>
  );
};
