'use client';

import React, { useState, useMemo } from 'react';
import { usePractice, getDhakaTodayDateString } from '@/context/PracticeContext';
import {
  Users,
  UserPlus,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
  Plus,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  UserCheck,
  Stethoscope,
  Activity,
  History,
  Lock
} from 'lucide-react';
import { ClinicalVisit, ClinicalVisitSnapshot, PatientRecord, PopulationGroup } from '@/types';

export const PatientsTab: React.FC = () => {
  const {
    language,
    savedPatients,
    patient,
    loadPatient,
    setActiveTab,
    clinicalVisits,
    currentVisit,
    startNewVisit,
    selectVisit,
    registerNewPatient,
    visitSnapshots,
    captureVisitSnapshot,
    saveCurrentPatient
  } = usePractice();

  const bn = language === 'bn';
  const today = getDhakaTodayDateString();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPopulationFilter, setSelectedPopulationFilter] = useState<string>('all');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<ClinicalVisitSnapshot | null>(null);

  // Registration Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [populationGroup, setPopulationGroup] = useState<PopulationGroup>('adult_standard');

  // Filtered patient list
  const filteredPatients = useMemo(() => {
    return savedPatients.filter(rec => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        rec.patient.name.toLowerCase().includes(q) ||
        rec.patient.id.toLowerCase().includes(q) ||
        rec.patient.phone.toLowerCase().includes(q);

      const matchPop =
        selectedPopulationFilter === 'all' ||
        rec.patient.population_group === selectedPopulationFilter;

      return matchSearch && matchPop;
    });
  }, [savedPatients, searchTerm, selectedPopulationFilter]);

  // Current patient's visit list
  const patientVisits = useMemo(() => {
    const list = clinicalVisits.filter(v => v.patient_id === patient.id);
    return list.sort((a, b) => b.visit_date.localeCompare(a.visit_date));
  }, [clinicalVisits, patient.id]);

  const handleStartNewVisit = () => {
    const v = startNewVisit(patient.id, 'routine_followup', 'Follow-up clinical consultation');
    if (!v) {
      alert(bn ? 'ভিজিট তৈরি করা সম্ভব হয়নি: স্টোরেজ ত্রুটি বা কোটা অতিক্রান্ত।' : 'Failed to create new visit: Storage persistence error or quota exceeded.');
      return;
    }
    setActiveTab('assessment');
  };

  const handleOpenVisitWorkspace = (v: ClinicalVisit) => {
    selectVisit(v.visit_id || v.id || '');
    setActiveTab('assessment');
  };

  const handleInspectSnapshot = (v: ClinicalVisit) => {
    const snap = visitSnapshots.find(s => s.visit_id === (v.visit_id || v.id));
    if (snap) {
      setSelectedSnapshot(snap);
    } else if (v.visit_id === currentVisit?.visit_id || v.id === currentVisit?.id) {
      // Capture live snapshot for the currently active visit
      const tempSnap = captureVisitSnapshot(v.is_baseline);
      setSelectedSnapshot(tempSnap);
    } else {
      // Historical visit without captured snapshot - do not fabricate retroactively
      alert(bn ? 'এই পূর্ববর্তী ভিজিটের জন্য কোনো সংরক্ষিত স্ন্যাপশট পাওয়া যায়নি।' : 'No recorded clinical snapshot found for this historical visit.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const registered = registerNewPatient({
      name: name.trim(),
      age: typeof age === 'number' ? age : 0,
      gender,
      phone: phone.trim(),
      email: email.trim(),
      population_group: populationGroup
    });

    if (!registered) {
      alert(bn ? 'রোগী নিবন্ধন ব্যর্থ হয়েছে: স্টোরেজ ত্রুটি বা কোটা অতিক্রান্ত।' : 'Failed to register patient: Storage persistence error or quota exceeded.');
      return;
    }

    setName('');
    setAge('');
    setPhone('');
    setEmail('');
    setShowRegisterModal(false);
    setActiveTab('assessment');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header / Registry Control Bar ──────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="font-bold text-base sm:text-lg text-foreground tracking-tight">
              {bn ? 'রোগী নিবন্ধন ও ভিজিট ব্যবস্থাপনা কেন্দ্র' : 'Patient Registry & Visit Management'}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {bn
              ? 'রোগীর প্রোফাইল, কালানুক্রমিক ভিজিট হিস্ট্রি, অপরিবর্তনীয় স্ন্যাপশট ও বহু-পরামর্শ ট্র্যাকিং'
              : 'Unified patient profiles, chronological visits, immutable historical snapshots & longitudinal records'}
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-subtle transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <UserPlus className="h-4 w-4" />
          <span>{bn ? '+ নতুন রোগী নিবন্ধন' : '+ Register Patient'}</span>
        </button>
      </div>

      {/* ── Active Patient Overview Card ───────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3.5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold shadow-subtle">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-foreground tracking-tight">{patient.name}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                  {bn ? 'সক্রিয় রোগী' : 'Active Patient'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary font-mono text-muted-foreground border border-border">
                  ID: {patient.id}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 tabular-numbers">
                {patient.age > 0 ? `${patient.age}y` : (bn ? 'বয়স অনির্ধারিত' : 'Age Unrecorded')} • {patient.gender === 'female' ? (bn ? 'নারী' : 'Female') : (bn ? 'পুরুষ' : 'Male')} • {patient.phone || (bn ? 'ফোন নেই' : 'No phone')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartNewVisit}
              className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-subtle transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{bn ? 'নতুন পরামর্শ শুরু করুন' : 'Start New Visit'}</span>
            </button>
          </div>
        </div>

        {/* Current Active Visit Banner */}
        <div className="p-3.5 rounded-xl bg-secondary/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span>
              {bn ? 'বর্তমান সক্রিয় ভিজিট সেশন:' : 'Current Active Visit Session:'}{' '}
              <strong className="text-foreground font-mono">{patient.current_visit_id || currentVisit?.visit_id || 'Initial Session'}</strong>
            </span>
            <span>•</span>
            <span className="tabular-numbers">{patient.visit_date}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('assessment')}
              className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>{bn ? 'অ্যাসেসমেন্ট উইজার্ডে যান' : 'Continue Assessment'}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Chronological Visits History Table */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-foreground flex items-center gap-1.5">
              <History className="h-4 w-4 text-muted-foreground" />
              <span>{bn ? 'কালানুক্রমিক ভিজিট ও পরামর্শ ইতিহাস' : 'Chronological Visit History'}</span>
            </h3>
            <span className="text-[11px] text-muted-foreground">
              {patientVisits.length} {bn ? 'টি পরামর্শ রেকর্ড' : 'Visits Recorded'}
            </span>
          </div>

          {patientVisits.length === 0 ? (
            <div className="p-4 text-center rounded-xl bg-secondary/30 border border-dashed border-border text-xs text-muted-foreground">
              {bn ? 'এই রোগীর কোনো পূর্ববর্তী পরামর্শ সংরক্ষিত নেই।' : 'No previous visits logged for this patient.'}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead className="bg-secondary/40">
                  <tr className="border-b border-border text-muted-foreground text-left">
                    <th className="py-2.5 px-3 font-semibold">{bn ? 'ভিজিট আইডি' : 'Visit ID'}</th>
                    <th className="py-2.5 px-3 font-semibold">{bn ? 'তারিখ' : 'Date'}</th>
                    <th className="py-2.5 px-3 font-semibold">{bn ? 'পরামর্শের ধরন' : 'Type'}</th>
                    <th className="py-2.5 px-3 font-semibold">{bn ? 'অবস্থা' : 'Status'}</th>
                    <th className="py-2.5 px-3 font-semibold">{bn ? 'ক্লিনিক্যাল নোট' : 'Clinical Summary'}</th>
                    <th className="py-2.5 px-3 font-semibold text-right">{bn ? 'অ্যাকশন' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {patientVisits.map((v, idx) => {
                    const isCurrent = v.visit_id === patient.current_visit_id || v.id === patient.current_visit_id;
                    return (
                      <tr key={v.visit_id || v.id || idx} className="hover:bg-secondary/30 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-foreground font-mono">
                          {v.visit_id || v.id}
                          {isCurrent && (
                            <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                              {bn ? 'সক্রিয়' : 'Current'}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground tabular-numbers">{v.visit_date}</td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary font-medium border border-border">
                            {v.visit_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {v.status === 'completed' ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="h-3.5 w-3.5" /> {bn ? 'সম্পন্ন' : 'Completed'}
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 text-[11px]">
                              <Clock className="h-3.5 w-3.5" /> {bn ? 'চলমান' : 'In Progress'}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground max-w-xs truncate">
                          {v.clinical_notes || v.clinical_summary || v.notes || (bn ? 'নিয়মিত পরামর্শ' : 'Routine consultation')}
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-1">
                          <button
                            onClick={() => handleInspectSnapshot(v)}
                            className="px-2 py-1 rounded-lg border border-border bg-card hover:bg-secondary text-[11px] font-semibold text-foreground transition-colors shadow-2xs inline-flex items-center gap-1"
                            title={bn ? 'স্ন্যাপশট দেখুন (রিড-অনলি)' : 'Inspect historical snapshot (read-only)'}
                          >
                            <Eye className="h-3 w-3" />
                            <span>{bn ? 'স্ন্যাপশট' : 'Snapshot'}</span>
                          </button>

                          <button
                            onClick={() => handleOpenVisitWorkspace(v)}
                            className="px-2 py-1 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-[11px] font-semibold transition-colors shadow-2xs inline-flex items-center gap-1"
                          >
                            <span>{bn ? 'ওয়ার্কস্পেস' : 'Open'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── All Saved Patients Directory ───────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3.5">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-sm text-foreground tracking-tight">
              {bn ? 'সকল রোগীর ডিরেক্টরি' : 'All Patients Directory'}
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedPopulationFilter}
              onChange={e => setSelectedPopulationFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">{bn ? 'সকল ক্যাটাগরি' : 'All Population Groups'}</option>
              <option value="adult_standard">{bn ? 'প্রাপ্তবয়স্ক (Adult)' : 'Adult Standard'}</option>
              <option value="pregnancy">{bn ? 'গর্ভবতী (Pregnancy)' : 'Pregnancy'}</option>
              <option value="pediatric">{bn ? 'শিশু (Pediatric)' : 'Pediatric'}</option>
              <option value="geriatric">{bn ? 'প্রবীণ (Geriatric)' : 'Geriatric'}</option>
              <option value="oncology">{bn ? 'অনকোলজি (Oncology)' : 'Oncology'}</option>
              <option value="renal">{bn ? 'রেনাল (Renal)' : 'Renal'}</option>
            </select>

            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={bn ? 'নাম, আইডি বা ফোন...' : 'Search by name, ID, phone...'}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
          </div>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-secondary/30 border border-dashed border-border text-muted-foreground">
            {bn ? 'কোনো রোগী পাওয়া যায়নি।' : 'No patients registered matching the filter.'}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead className="bg-secondary/40">
                <tr className="border-b border-border text-muted-foreground text-left">
                  <th className="py-2.5 px-3 font-semibold">{bn ? 'রোগীর বিবরণ' : 'Patient Information'}</th>
                  <th className="py-2.5 px-3 font-semibold">{bn ? 'যোগাযোগ' : 'Contact'}</th>
                  <th className="py-2.5 px-3 font-semibold">{bn ? 'ক্লিনিক্যাল গ্রুপ' : 'Clinical Group'}</th>
                  <th className="py-2.5 px-3 font-semibold">{bn ? 'ফেজ' : 'Phase'}</th>
                  <th className="py-2.5 px-3 font-semibold">{bn ? 'নিবন্ধনের তারিখ' : 'Registration Date'}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">{bn ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPatients.map(p => {
                  const isActive = patient.id === p.patient.id;
                  return (
                    <tr key={p.patient.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-foreground flex items-center gap-1.5 text-sm">
                          <span>{p.patient.name}</span>
                          {isActive && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                              {bn ? 'সক্রিয়' : 'Active'}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5 tabular-numbers">
                          ID: {p.patient.id} • {p.patient.age > 0 ? `${p.patient.age}y` : (bn ? 'অনির্ধারিত' : 'Unrecorded')} • {p.patient.gender}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        <div>{p.patient.phone || 'N/A'}</div>
                        <div className="text-[10px]">{p.patient.email || ''}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary font-medium text-foreground border border-border">
                          {p.patient.population_group || 'adult_standard'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-primary">
                        Phase {p.patient.current_phase || 1}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground tabular-numbers">
                        {p.patient.visit_date || 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            loadPatient(p.patient.id);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all shadow-2xs ${
                            isActive
                              ? 'bg-primary/10 text-primary border border-primary/30 font-bold'
                              : 'border border-border bg-card hover:bg-secondary text-foreground'
                          }`}
                        >
                          {isActive ? (bn ? 'বর্তমানে সক্রিয়' : 'Currently Active') : (bn ? 'নির্বাচন করুন' : 'Select Patient')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: Register New Patient ────────────────────────────── */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-dropdown space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3.5">
              <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                <UserPlus className="h-4 w-4 text-primary" />
                <span>{bn ? 'নতুন রোগী প্রাথমিক নিবন্ধন' : 'Register New Patient'}</span>
              </div>
              <button onClick={() => setShowRegisterModal(false)} className="text-muted-foreground hover:text-foreground text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {bn ? 'রোগীর পুরো নাম *' : 'Patient Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={bn ? 'উদা: রহিমা বেগম' : 'e.g. Rahima Begum'}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
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
                    value={age}
                    onChange={e => setAge(e.target.value ? Number(e.target.value) : '')}
                    placeholder="40"
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none tabular-numbers"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {bn ? 'লিঙ্গ' : 'Gender'}
                  </label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as 'female' | 'male')}
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="female">{bn ? 'নারী (Female)' : 'Female'}</option>
                    <option value="male">{bn ? 'পুরুষ (Male)' : 'Male'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {bn ? 'জনসংখ্যা ক্যাটাগরি' : 'Population Group'}
                </label>
                <select
                  value={populationGroup}
                  onChange={e => setPopulationGroup(e.target.value as PopulationGroup)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="adult_standard">{bn ? 'সাধারণ প্রাপ্তবয়স্ক (Adult Standard)' : 'Adult Standard'}</option>
                  <option value="pregnancy">{bn ? 'গর্ভকালীন (Pregnancy)' : 'Pregnancy'}</option>
                  <option value="lactation">{bn ? 'দুগ্ধদানকারী (Lactation)' : 'Lactation'}</option>
                  <option value="pediatric">{bn ? 'শিশু (Pediatric)' : 'Pediatric'}</option>
                  <option value="geriatric">{bn ? 'প্রবীণ (Geriatric)' : 'Geriatric'}</option>
                  <option value="oncology">{bn ? 'অনকোলজি (Oncology)' : 'Oncology'}</option>
                  <option value="renal">{bn ? 'রেনাল (Renal)' : 'Renal'}</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {bn ? 'মোবাইল নম্বর' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="017XX-XXXXXX"
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {bn ? 'ইমেইল (ঐচ্ছিক)' : 'Email (Optional)'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-border bg-card hover:bg-secondary text-xs font-semibold text-foreground transition-colors"
                >
                  {bn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-subtle transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {bn ? 'নিবন্ধন ও অ্যাসেসমেন্ট শুরু' : 'Register & Start Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Read-Only Historical Snapshot Viewer ────────────── */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 shadow-dropdown space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    {bn ? 'ঐতিহাসিক ভিজিট স্ন্যাপশট (শুধুমাত্র পাঠযোগ্য)' : 'Historical Visit Snapshot (Read-Only)'}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Visit ID: {selectedSnapshot.visit_id} • Date: {selectedSnapshot.visit_date}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Anthropometrics */}
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-2">
                <div className="font-bold text-foreground">
                  {bn ? 'শারীরিক পরিমাপ (Anthropometrics)' : 'Anthropometrics'}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-muted-foreground">Weight:</span>{' '}
                    <strong>{selectedSnapshot.anthropometrics.weight_kg ?? 'N/A'} kg</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Height:</span>{' '}
                    <strong>{selectedSnapshot.anthropometrics.height_cm ?? 'N/A'} cm</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">BMI:</span>{' '}
                    <strong>{selectedSnapshot.anthropometrics.bmi ?? 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Waist:</span>{' '}
                    <strong>{selectedSnapshot.anthropometrics.waist_cm ?? 'N/A'} cm</strong>
                  </div>
                </div>
              </div>

              {/* Biomarkers / Key Labs */}
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-2">
                <div className="font-bold text-foreground">
                  {bn ? 'বায়োমার্কার ও ল্যাব পর্যবেক্ষণ' : 'Biomarkers & Laboratory Values'}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedSnapshot.biomarkers && Object.entries(selectedSnapshot.biomarkers).filter(([_, v]) => v !== undefined).map(([k, v]) => (
                    <div key={k} className="p-1.5 rounded-lg bg-card border border-border text-[11px]">
                      <span className="text-muted-foreground uppercase">{k}:</span> <strong>{v}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ayurvedic State */}
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-2">
                <div className="font-bold text-foreground">
                  {bn ? 'আয়ুর্বেদিক ও পরিপাক অগ্নির অবস্থা' : 'Ayurvedic & Agni Status'}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">Agni:</span>{' '}
                    <strong className="capitalize">{selectedSnapshot.gut_metrics?.agni_status || 'Unassessed'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bristol Stool:</span>{' '}
                    <strong>Type {selectedSnapshot.gut_metrics?.bristol_stool_score ?? 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* Clinical Safety & Sign-Off Status */}
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1">
                <div className="font-bold text-foreground">
                  {bn ? 'নিরাপত্তা পর্যালোচনা ও রিপোর্ট অনুমোদন' : 'Safety & Approval Status'}
                </div>
                <div className="text-muted-foreground">
                  {bn ? 'অনুমোদন অবস্থা:' : 'Approval:'}{' '}
                  <strong>{selectedSnapshot.report_approval_status?.is_approved ? 'Approved' : 'Pending / Draft'}</strong>
                  {selectedSnapshot.report_approval_status?.approved_by && (
                    <span> by {selectedSnapshot.report_approval_status.approved_by}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="px-4 py-1.5 rounded-xl bg-card border border-border hover:bg-secondary text-xs font-semibold text-foreground transition-colors"
              >
                {bn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
