'use client';

import React, { useState, useMemo } from 'react';
import { usePractice } from '@/context/PracticeContext';
import { calculatePracticeKPIs, getDhakaTodayDateString } from '@/utils/dhakaDate';
import {
  Users,
  UserPlus,
  Calendar,
  CalendarCheck,
  CalendarClock,
  AlertCircle,
  FileText,
  Clock,
  Search,
  ArrowRight,
  Sparkles,
  Stethoscope,
  Utensils,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ShieldAlert,
  ChevronRight,
  Activity,
  Plus
} from 'lucide-react';
import { FollowUpAppointment, PatientRecord, ClinicalVisit } from '@/types';

export const DashboardTab: React.FC = () => {
  const {
    language,
    savedPatients,
    patient,
    loadPatient,
    setActiveTab,
    followUpAppointments,
    clinicalVisits,
    loadDemoPatient,
    rescheduleFollowUp,
    cancelFollowUp,
    completeFollowUp,
    startNewVisit,
    startFollowUpConsultation,
    registerNewPatient
  } = usePractice();

  const bn = language === 'bn';
  const today = getDhakaTodayDateString();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState<FollowUpAppointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState(today);
  const [rescheduleTime, setRescheduleTime] = useState('11:00 AM');
  const [rescheduleReason, setRescheduleReason] = useState('');

  // New Patient Form State
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState<number | ''>('');
  const [newGender, setNewGender] = useState<'male' | 'female'>('female');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Practice-wide aggregated appointments and visits
  const allPracticeAppointments = useMemo(() => {
    const map = new Map<string, FollowUpAppointment>();
    savedPatients.forEach(p => {
      (p.follow_up_appointments || []).forEach(a => {
        const key = a.appointment_id || a.id;
        if (key) map.set(key, a);
      });
    });
    followUpAppointments.forEach(a => {
      const key = a.appointment_id || a.id;
      if (key) map.set(key, a);
    });
    return Array.from(map.values());
  }, [savedPatients, followUpAppointments]);

  const allPracticeVisits = useMemo(() => {
    const map = new Map<string, ClinicalVisit>();
    savedPatients.forEach(p => {
      (p.clinical_visits || []).forEach(v => {
        const key = v.visit_id || v.id;
        if (key) map.set(key, v);
      });
    });
    clinicalVisits.forEach(v => {
      const key = v.visit_id || v.id;
      if (key) map.set(key, v);
    });
    return Array.from(map.values());
  }, [savedPatients, clinicalVisits]);

  // ── 1. Calculate Real Dynamic KPIs (Deterministic & Asia/Dhaka-Safe) ────
  const kpis = useMemo(() => {
    return calculatePracticeKPIs(savedPatients);
  }, [savedPatients]);

  // Filtered patients list
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return savedPatients.slice(0, 5);
    const q = searchTerm.toLowerCase();
    return savedPatients.filter(p => {
      const matchName = p.patient.name.toLowerCase().includes(q);
      const matchId = p.patient.id.toLowerCase().includes(q);
      const matchPhone = p.patient.phone.toLowerCase().includes(q);
      const matchGroup = (p.patient.population_group || '').toLowerCase().includes(q);
      return matchName || matchId || matchPhone || matchGroup;
    });
  }, [savedPatients, searchTerm]);

  // Today's appointments (practice-wide)
  const todayAppointments = useMemo(() => {
    return allPracticeAppointments.filter(a => a.scheduled_date === today && a.status !== 'cancelled');
  }, [allPracticeAppointments, today]);

  const handleOpenPatient = (pId: string) => {
    loadPatient(pId);
    setActiveTab('patients');
  };

  const handleStartFollowUpForAppointment = (apt: FollowUpAppointment) => {
    // Start consultation cleanly without premature completion; links actual_visit_id
    const newVisit = startFollowUpConsultation(apt.appointment_id, apt.patient_id);
    if (!newVisit) {
      alert(bn ? "ফলো-আপ ভিজিট শুরু করা যায়নি: স্টোরেজ সীমা বা এরর।" : "Failed to start follow-up visit: Storage persistence error or quota exceeded.");
      return;
    }
    setActiveTab('assessment');
  };

  const handleQuickRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const registered = registerNewPatient({
      name: newName.trim(),
      age: typeof newAge === 'number' ? newAge : 0,
      gender: newGender,
      phone: newPhone.trim(),
      email: newEmail.trim()
    });

    if (!registered) {
      alert("Failed to register patient: Storage persistence error or quota exceeded.");
      return;
    }

    setNewName('');
    setNewAge('');
    setNewPhone('');
    setNewEmail('');
    setShowRegisterModal(false);
    setActiveTab('assessment');
  };

  const handleConfirmReschedule = () => {
    if (!showRescheduleModal) return;
    const ok = rescheduleFollowUp(showRescheduleModal.appointment_id, rescheduleDate, rescheduleTime, rescheduleReason);
    if (!ok) {
      alert(bn ? "রি-শিডিউল ব্যর্থ হয়েছে: স্টোরেজ সীমা বা ত্রুটি।" : "Failed to reschedule appointment: Storage error or quota exceeded.");
      return;
    }
    setShowRescheduleModal(null);
    setRescheduleReason('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header / Quick Welcome Banner ───────────────────────── */}
      <div className="bg-gradient-to-r from-card via-card to-primary/5 border rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
            <Activity className="h-3.5 w-3.5" />
            <span>{bn ? 'শুদ্ধ ফাংশনাল নিউট্রিশন প্ল্যাটফর্ম • ড্যাশবোর্ড' : 'Shuddho Functional Nutrition • Clinical Hub'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {bn ? 'ক্লিনিক্যাল প্র্যাকটিস ওভারভিউ ও অ্যাকশন সেন্টার' : 'Clinical Practice Dashboard & Task Hub'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {bn 
              ? 'রোগীর ফলো-আপ শিডিউল, রুট-কজ বিশ্লেষণ, লংগিটিউডিনাল ট্র্যাকিং ও প্রি-ইন্টারভেনশন প্ল্যানিং'
              : 'Deterministic clinical intelligence, adaptive assessment, follow-up scheduling & progress analytics'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <UserPlus className="h-4 w-4" />
            <span>{bn ? '+ নতুন রোগী নিবন্ধন' : '+ Register Patient'}</span>
          </button>

          <button
            onClick={loadDemoPatient}
            className="px-3.5 py-2 rounded-xl border bg-secondary/60 hover:bg-secondary text-xs font-semibold flex items-center gap-1.5 transition text-foreground"
            title="Load Mrs. Nasreen Akhter demonstration consultation"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>{bn ? 'ডেমো কেস লোড করুন' : 'Load Demo Patient'}</span>
          </button>
        </div>
      </div>

      {/* ── 8 Operational KPI Cards (Zero-Safe / Deterministic) ─────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* KPI 1 */}
        <div className="bg-card border rounded-2xl p-3.5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">{bn ? 'মোট রোগী' : 'Total Patients'}</span>
            <Users className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-extrabold text-foreground">{kpis.totalPatients}</div>
          <div className="text-[10px] text-muted-foreground">{bn ? 'নিবন্ধিত' : 'Registered'}</div>
        </div>

        {/* KPI 2 */}
        <div className="bg-card border rounded-2xl p-3.5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">{bn ? 'চলতি মাসে' : 'This Month'}</span>
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-extrabold text-foreground">{kpis.newThisMonth}</div>
          <div className="text-[10px] text-emerald-600 font-medium">{bn ? 'নতুন রোগী' : 'New intakes'}</div>
        </div>

        {/* KPI 3 */}
        <div className="bg-card border rounded-2xl p-3.5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">{bn ? 'আজকের ভিজিট' : 'Visits Today'}</span>
            <Stethoscope className="h-3.5 w-3.5 text-purple-500" />
          </div>
          <div className="text-xl font-extrabold text-foreground">{kpis.visitsToday}</div>
          <div className="text-[10px] text-muted-foreground">{bn ? 'পরামর্শ সম্পন্ন' : 'Consultations'}</div>
        </div>

        {/* KPI 4 */}
        <div className={`bg-card border rounded-2xl p-3.5 shadow-sm space-y-1 ${kpis.dueToday > 0 ? 'border-amber-500/40 bg-amber-500/5' : ''}`}>
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">{bn ? 'আজকের ফলো-আপ' : 'Due Today'}</span>
            <CalendarCheck className={`h-3.5 w-3.5 ${kpis.dueToday > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
          </div>
          <div className={`text-xl font-extrabold ${kpis.dueToday > 0 ? 'text-amber-500' : 'text-foreground'}`}>
            {kpis.dueToday}
          </div>
          <div className="text-[10px] text-muted-foreground">{bn ? 'শিডিউলড' : 'Appointments'}</div>
        </div>

        {/* KPI 5 */}
        <div className="bg-card border rounded-2xl p-3.5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">{bn ? 'আসন্ন ৭ দিন' : 'Next 7 Days'}</span>
            <CalendarClock className="h-3.5 w-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-extrabold text-foreground">{kpis.upcoming7Days}</div>
          <div className="text-[10px] text-muted-foreground">{bn ? 'শিডিউলভুক্ত' : 'Upcoming'}</div>
        </div>

        {/* KPI 6 */}
        <div className={`bg-card border rounded-2xl p-3.5 shadow-sm space-y-1 ${kpis.overdue > 0 ? 'border-rose-500/40 bg-rose-500/5' : ''}`}>
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">{bn ? 'সময়োত্তীর্ণ' : 'Overdue'}</span>
            <AlertCircle className={`h-3.5 w-3.5 ${kpis.overdue > 0 ? 'text-rose-500' : 'text-muted-foreground'}`} />
          </div>
          <div className={`text-xl font-extrabold ${kpis.overdue > 0 ? 'text-rose-500' : 'text-foreground'}`}>
            {kpis.overdue}
          </div>
          <div className="text-[10px] text-muted-foreground">{bn ? 'রি-শিডিউল প্রয়োজন' : 'Needs attention'}</div>
        </div>

        {/* KPI 7 */}
        <div className="bg-card border rounded-2xl p-3.5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">{bn ? 'অপেক্ষমান অ্যাসেসমেন্ট' : 'Pending Asmt'}</span>
            <Clock className="h-3.5 w-3.5 text-orange-500" />
          </div>
          <div className="text-xl font-extrabold text-foreground">{kpis.pendingAssessments}</div>
          <div className="text-[10px] text-muted-foreground">{bn ? 'অসম্পূর্ণ' : 'Incomplete'}</div>
        </div>

        {/* KPI 8 */}
        <div className="bg-card border rounded-2xl p-3.5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">{bn ? 'অনুমোদন বাকী' : 'Pending Sign-Off'}</span>
            <FileText className="h-3.5 w-3.5 text-teal-500" />
          </div>
          <div className="text-xl font-extrabold text-foreground">{kpis.pendingReports}</div>
          <div className="text-[10px] text-muted-foreground">{bn ? 'রিপোর্ট রিভিউ' : 'Awaiting review'}</div>
        </div>
      </div>

      {/* ── Empty State Banner (Clean & Zero-Safe) ─────────────────── */}
      {savedPatients.length === 0 && (
        <div className="bg-gradient-to-br from-card via-card to-primary/10 border-2 border-dashed border-primary/20 rounded-3xl p-8 sm:p-10 text-center shadow-sm space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Users className="h-8 w-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              {bn ? 'প্র্যাকটিসে কোনো রোগী নিবন্ধিত নেই' : 'No Patients Registered Yet'}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {bn
                ? 'আপনার ক্লিনিক্যাল প্র্যাকটিস শুরু করতে প্রথম রোগী নিবন্ধন করুন অথবা একটি সম্পূর্ণ ডেমো রোগীর রেকর্ড লোড করে কার্যপদ্ধতি পর্যালোচনা করুন।'
                : 'Begin by registering your first patient or load a demonstration clinical record.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-2 hover:opacity-90 shadow-sm transition"
            >
              <UserPlus className="h-4 w-4" />
              <span>{bn ? '+ নতুন রোগী নিবন্ধন' : '+ Register Patient'}</span>
            </button>
            <button
              onClick={loadDemoPatient}
              className="px-5 py-2.5 rounded-xl border bg-secondary/80 hover:bg-secondary text-foreground font-semibold text-xs flex items-center gap-2 transition"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>{bn ? 'ডেমো কেস লোড করুন' : 'Load Demo Case'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Quick Action Launcher ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('assessment')}
          className="p-4 rounded-2xl border bg-card hover:bg-accent/40 text-left transition flex items-start gap-3 shadow-sm group"
        >
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground">
              {bn ? 'ক্লিনিক্যাল অ্যাসেসমেন্ট' : 'Start Assessment'}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {bn ? '১৪-ডোমেন ও ৭ দিনের FFQ' : 'P1 9-Step adaptive wizard'}
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('clinical_intelligence')}
          className="p-4 rounded-2xl border bg-card hover:bg-accent/40 text-left transition flex items-start gap-3 shadow-sm group"
        >
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 group-hover:bg-purple-600 group-hover:text-white transition">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground">
              {bn ? 'রুট-কজ ইন্টেলিজেন্স' : 'Root-Cause Matrix'}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {bn ? 'P2 ৫-স্তরীয় রোগনির্ণয়' : 'Hypotheses & diagnostic map'}
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('diet')}
          className="p-4 rounded-2xl border bg-card hover:bg-accent/40 text-left transition flex items-start gap-3 shadow-sm group"
        >
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition">
            <Utensils className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground">
              {bn ? 'অটো-স্কেলড ডায়েট চার্ট' : 'Scaled Diet Chart'}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {bn ? 'ট্রাফিক লাইট ও পরিমাপ' : 'Macronutrients & exchanges'}
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('followup')}
          className="p-4 rounded-2xl border bg-card hover:bg-accent/40 text-left transition flex items-start gap-3 shadow-sm group"
        >
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground">
              {bn ? 'ফলো-আপ ও অগ্রগতি' : 'Follow-Up Tracking'}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {bn ? 'লংগিটিউডিনাল অ্যানালাইসিস' : 'Comparison & scheduling'}
            </div>
          </div>
        </button>
      </div>

      {/* ── Main Two-Column Layout ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Today's Follow-Ups & Recent Patients */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Follow-Up Schedule Card */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="font-bold text-sm text-foreground">
                    {bn ? 'আজকের ফলো-আপ শিডিউল' : "Today's Follow-Up Schedule"}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {bn ? `তারিখ: ${today} (এশিয়া/ঢাকা সময়ানুযায়ী)` : `Date: ${today} (Asia/Dhaka timezone)`}
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                {todayAppointments.length} {bn ? 'টি সাক্ষাৎকার' : 'Consultations'}
              </span>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-muted/20 border border-dashed text-muted-foreground space-y-2">
                <Calendar className="h-8 w-8 mx-auto opacity-40" />
                <div className="text-xs font-medium">
                  {bn ? 'আজকের দিনে কোনো শিডিউলড ফলো-আপ অ্যাপয়েন্টমেন্ট নেই।' : 'No follow-up consultations scheduled for today.'}
                </div>
                <button
                  onClick={() => setActiveTab('followup')}
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>{bn ? 'নতুন ফলো-আপ শিডিউল করুন' : 'Schedule a follow-up appointment'}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayAppointments.map(apt => (
                  <div
                    key={apt.appointment_id}
                    className="p-3.5 rounded-xl border bg-muted/10 hover:bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {apt.patient_name || apt.patient_id}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-500/15 text-amber-500">
                          {apt.scheduled_time || 'Morning'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ID: {apt.patient_id}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {apt.reason || apt.reason_en || apt.reason_bn || 'Routine follow-up'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleStartFollowUpForAppointment(apt)}
                        className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-xs font-semibold transition"
                      >
                        {bn ? 'ভিজিট শুরু করুন' : 'Start Visit'}
                      </button>

                      <button
                        onClick={() => {
                          setShowRescheduleModal(apt);
                          setRescheduleDate(apt.scheduled_date);
                          setRescheduleTime(apt.scheduled_time || '11:00 AM');
                        }}
                        className="px-2.5 py-1.5 rounded-lg border bg-secondary/60 hover:bg-secondary text-xs font-medium text-foreground transition"
                      >
                        {bn ? 'পুনঃনির্ধারণ' : 'Reschedule'}
                      </button>

                      <button
                        onClick={() => {
                          const ok = cancelFollowUp(apt.appointment_id, 'Cancelled from dashboard');
                          if (!ok) {
                            alert(bn ? 'অ্যাপয়েন্টমেন্ট বাতিল করা যায়নি: স্টোরেজ সীমা বা ত্রুটি।' : 'Failed to cancel appointment: Storage error or quota exceeded.');
                          }
                        }}
                        className="px-2 py-1.5 rounded-lg border text-rose-500 hover:bg-rose-500/10 text-xs transition"
                        title={bn ? 'বাতিল করুন' : 'Cancel appointment'}
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Searchable Recent Patients Table */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="font-bold text-sm text-foreground">
                    {bn ? 'সাম্প্রতিক রোগী ও রেকর্ড তালিকা' : 'Recent Patient Registry'}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {bn ? 'নাম, আইডি, ফোন বা ক্যাটাগরি দিয়ে তাৎক্ষণিক অনুসন্ধান' : 'Filter by name, phone, or population group'}
                  </p>
                </div>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder={bn ? 'রোগী খুঁজুন...' : 'Search patient...'}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {filteredPatients.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-muted/20 border border-dashed text-muted-foreground">
                <div className="text-xs">
                  {bn ? 'কোনো রোগী পাওয়া যায়নি।' : 'No patients match the search criteria.'}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="pb-2 font-medium">{bn ? 'রোগীর নাম ও আইডি' : 'Patient Name & ID'}</th>
                      <th className="pb-2 font-medium">{bn ? 'বয়স / লিঙ্গ' : 'Age/Gender'}</th>
                      <th className="pb-2 font-medium">{bn ? 'জনসংখ্যা ক্যাটাগরি' : 'Population Group'}</th>
                      <th className="pb-2 font-medium">{bn ? 'বর্তমান ফেজ' : 'Phase'}</th>
                      <th className="pb-2 font-medium">{bn ? 'শেষ ভিজিট' : 'Last Visit'}</th>
                      <th className="pb-2 font-medium text-right">{bn ? 'অ্যাকশন' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredPatients.map(p => {
                      const isActive = patient.id === p.patient.id;
                      return (
                        <tr key={p.patient.id} className="hover:bg-muted/10 transition">
                          <td className="py-2.5">
                            <div className="font-bold text-foreground flex items-center gap-1.5">
                              <span>{p.patient.name}</span>
                              {isActive && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-primary/15 text-primary font-bold">
                                  {bn ? 'সক্রিয়' : 'Active'}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground">{p.patient.id}</div>
                          </td>
                          <td className="py-2.5 text-muted-foreground">
                            {p.patient.age > 0 ? `${p.patient.age}y` : bn ? 'অনির্ধারিত' : 'Unrecorded'} • {p.patient.gender}
                          </td>
                          <td className="py-2.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary font-medium">
                              {p.patient.population_group || 'adult_standard'}
                            </span>
                          </td>
                          <td className="py-2.5 font-semibold text-primary">
                            Phase {p.patient.current_phase || 1}
                          </td>
                          <td className="py-2.5 text-muted-foreground">
                            {p.patient.visit_date || 'N/A'}
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => handleOpenPatient(p.patient.id)}
                              className="px-2.5 py-1 rounded-lg border bg-secondary/50 hover:bg-secondary text-[11px] font-semibold text-foreground transition"
                            >
                              {bn ? 'প্রবেশ করুন' : 'Open'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-2 text-right">
              <button
                onClick={() => setActiveTab('patients')}
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>{bn ? 'সকল রোগী দেখুন' : 'View full patient registry'}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Pending Clinical Tasks & Quick Guidelines */}
        <div className="space-y-6">
          
          {/* Pending Tasks & Clinical Governance Card */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              <h2 className="font-bold text-sm text-foreground">
                {bn ? 'ক্লিনিক্যাল টাস্ক ও সুরক্ষা গেট' : 'Pending Tasks & Governance'}
              </h2>
            </div>

            <div className="space-y-3">
              {/* Task 1: Allergy & Medication Reconciliation */}
              <div className="p-3 rounded-xl border bg-muted/10 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    {bn ? 'অ্যালার্জি ও ওষুধ রিকনসিলিয়েশন' : 'Allergy & Med Reconciliation'}
                  </span>
                  {patient.allergy_reconciliation_status === 'allergies_confirmed' || patient.allergy_reconciliation_status === 'none_confirmed' ? (
                    <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="h-3 w-3" /> {bn ? 'যাচাইকৃত' : 'Reconciled'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                      <AlertCircle className="h-3 w-3" /> {bn ? 'বাকী' : 'Required'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {bn 
                    ? 'রোগী নিবন্ধনের পর প্রেসক্রিপশন চূড়ান্ত করার পূর্বে অ্যালার্জি ও ওষুধের তথ্য আবশ্যিকভাবে নিশ্চিত করুন।'
                    : 'Mandatory clinical safety gate before diet prescription approval.'}
                </p>
              </div>

              {/* Task 2: P1 Assessment Completion */}
              <div className="p-3 rounded-xl border bg-muted/10 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    {bn ? 'P1 ফাংশনাল অ্যাসেসমেন্ট' : 'P1 Functional Assessment'}
                  </span>
                  <span className="text-[10px] text-primary font-bold">
                    {bn ? 'উইজার্ড ৯ ধাপ' : '9 Steps'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {bn
                    ? '৭ দিনের খাদ্য ফ্রিকোয়েন্সি (FFQ) ও আয়ুর্বেদিক পরিপাক অগ্নির অবস্থা রেকর্ড করুন।'
                    : 'Record FFQ plant diversity, Bristol stool scale, and Agni classification.'}
                </p>
                <button
                  onClick={() => setActiveTab('assessment')}
                  className="w-full mt-1 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-semibold transition"
                >
                  {bn ? 'অ্যাসেসমেন্ট চালু করুন' : 'Open Assessment Wizard'}
                </button>
              </div>

              {/* Task 3: Printable Progress Reports */}
              <div className="p-3 rounded-xl border bg-muted/10 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    {bn ? 'লংগিটিউডিনাল প্রগ্রেস রিপোর্ট' : 'Progress Report Sign-Off'}
                  </span>
                  <span className="text-[10px] text-blue-500 font-bold">
                    A4 PDF
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {bn
                    ? 'বেসলাইন বনাম বর্তমান ভিজিটের পরিমাপ তুলনা করে প্রেসক্রিপশন রিপোর্ট প্রিন্ট করুন।'
                    : 'Compare baseline vs current visit metrics and export sign-off reports.'}
                </p>
                <button
                  onClick={() => setActiveTab('report')}
                  className="w-full mt-1 py-1 rounded-lg border bg-secondary/50 hover:bg-secondary text-foreground text-[11px] font-semibold transition"
                >
                  {bn ? 'রিপোর্ট সেন্টারে যান' : 'Go to Report Center'}
                </button>
              </div>
            </div>
          </div>

          {/* Clinical Safety Protocol Notice */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs">
              <ShieldAlert className="h-4 w-4" />
              <span>{bn ? 'ক্লিনিক্যাল নির্দেশনা ও নীতিমালা' : 'Clinical Protocol Notice'}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {bn
                ? 'অনুপস্থিত বা অপরীক্ষিত ল্যাব মার্কারের ক্ষেত্রে কোনো অনুমানমূলক মান স্বয়ংক্রিয়ভাবে তৈরি করা হয় না। ওজন হ্রাস সকল রোগীর জন্য ইতিবাচক নয়—আন্ডারওয়েট, অনকোলজি ও গর্ভবতী রোগীর ক্ষেত্রে বিশেষ সুরক্ষা নীতি প্রয়োগ করা হয়।'
                : 'Zero generative AI in runtime clinical decisions. Missing lab values remain unmeasured. Weight reduction is evaluated contextually according to clinical pathology.'}
            </p>
          </div>

        </div>
      </div>

      {/* ── Modal: Register New Patient ────────────────────────────── */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                <UserPlus className="h-4 w-4 text-primary" />
                <span>{bn ? 'নতুন রোগী প্রাথমিক নিবন্ধন' : 'Register New Patient'}</span>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {bn ? 'রোগীর পুরো নাম *' : 'Patient Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder={bn ? 'উদা: মোছাঃ সালমা খাতুন' : 'e.g. Mrs. Salma Khatun'}
                  className="w-full px-3 py-2 rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {bn ? 'বয়স (বছর)' : 'Age (years)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={newAge}
                    onChange={e => setNewAge(e.target.value ? Number(e.target.value) : '')}
                    placeholder="45"
                    className="w-full px-3 py-2 rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {bn ? 'লিঙ্গ' : 'Gender'}
                  </label>
                  <select
                    value={newGender}
                    onChange={e => setNewGender(e.target.value as 'male' | 'female')}
                    className="w-full px-3 py-2 rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="female">{bn ? 'নারী (Female)' : 'Female'}</option>
                    <option value="male">{bn ? 'পুরুষ (Male)' : 'Male'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {bn ? 'মোবাইল নম্বর' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="017XX-XXXXXX"
                  className="w-full px-3 py-2 rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {bn ? 'ইমেইল (ঐচ্ছিক)' : 'Email (Optional)'}
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full px-3 py-2 rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-muted/30 text-[11px] text-muted-foreground">
                {bn
                  ? 'নিবন্ধনের পর শারীরিক পরিমাপ (উচ্চতা, ওজন, রক্তচাপ) ক্লিনিক্যাল অ্যাসেসমেন্টে রেকর্ড করা হবে। কোনো পূর্বনির্ধারিত কাল্পনিক মান সংরক্ষণ করা হবে না।'
                  : 'Administrative registration only. Clinical baseline anthropometrics will be entered during Step 1 of the assessment wizard without fabricated values.'}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-3 py-1.5 rounded-xl border bg-secondary/50 text-xs font-semibold"
                >
                  {bn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
                >
                  {bn ? 'নিবন্ধন ও অ্যাসেসমেন্ট শুরু' : 'Register & Start Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Reschedule Appointment ──────────────────────────── */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="font-bold text-sm text-foreground">
                {bn ? 'ফলো-আপ পুনঃনির্ধারণ' : 'Reschedule Follow-Up'}
              </div>
              <button onClick={() => setShowRescheduleModal(null)} className="text-muted-foreground text-xs">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {bn ? 'নতুন তারিখ' : 'New Date'}
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={e => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-background"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {bn ? 'সময়' : 'Time'}
                </label>
                <input
                  type="text"
                  value={rescheduleTime}
                  onChange={e => setRescheduleTime(e.target.value)}
                  placeholder="11:00 AM"
                  className="w-full px-3 py-2 rounded-xl border bg-background"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {bn ? 'পুনঃনির্ধারণের কারণ' : 'Reason for Rescheduling'}
                </label>
                <textarea
                  rows={2}
                  value={rescheduleReason}
                  onChange={e => setRescheduleReason(e.target.value)}
                  placeholder={bn ? 'রোগীর অনুরোধ বা চিকিৎসকের সময় পরিবর্তন...' : 'Patient request or clinician availability...'}
                  className="w-full px-3 py-2 rounded-xl border bg-background"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(null)}
                  className="px-3 py-1.5 rounded-xl border bg-secondary/50 text-xs font-semibold"
                >
                  {bn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReschedule}
                  className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
                >
                  {bn ? 'নিশ্চিত করুন' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
