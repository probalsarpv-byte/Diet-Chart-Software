'use client';

import React from 'react';
import { usePractice } from '@/context/PracticeContext';
import { useAssessment } from '@/context/AssessmentContext';
import {
  User,
  Heart,
  Scale,
  ShieldAlert,
  Flame,
  Pill,
  Sparkles,
  AlertTriangle,
  Activity
} from 'lucide-react';

export const AssessmentRightSnapshot: React.FC = () => {
  const { patient, language, clinicalSafetyEvaluation } = usePractice();
  const { prakritiResult, agniResult, completionStatus } = useAssessment();
  const bn = language === 'bn';

  const bmi = patient.calculated?.bmi || 0;
  const bmr = patient.calculated?.bmr || 0;
  const whtr = patient.calculated?.whtr || 0;

  return (
    <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
      {/* Patient Header Card */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-subtle space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold shadow-subtle">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm text-foreground truncate">{patient.name || 'Anonymous Patient'}</h3>
            <p className="text-xs text-muted-foreground tabular-numbers">
              {patient.age}y • {patient.gender === 'female' ? (bn ? 'নারী' : 'Female') : (bn ? 'পুরুষ' : 'Male')} • {patient.phone}
            </p>
          </div>
        </div>

        {/* Category & Pathways */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {patient.population_group}
          </span>
          {patient.clinical_pathways?.map((p) => (
            <span key={p} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-foreground border border-border">
              {p.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Anthropometric Snapshot */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-subtle space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5 text-primary" />
            {bn ? 'শারীরিক পরিমাপ' : 'Anthropometrics'}
          </span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono">
            BMR: {bmr} kcal
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="p-2 rounded-xl bg-secondary/50 border border-border/50">
            <div className="text-[10px] text-muted-foreground">{bn ? 'উচ্চতা' : 'Height'}</div>
            <div className="text-xs font-bold text-foreground tabular-numbers">{patient.height_cm} cm</div>
          </div>
          <div className="p-2 rounded-xl bg-secondary/50 border border-border/50">
            <div className="text-[10px] text-muted-foreground">{bn ? 'ওজন' : 'Weight'}</div>
            <div className="text-xs font-bold text-foreground tabular-numbers">{patient.weight_kg} kg</div>
          </div>
          <div className="p-2 rounded-xl bg-secondary/50 border border-border/50">
            <div className="text-[10px] text-muted-foreground">BMI</div>
            <div className={`text-xs font-bold tabular-numbers ${bmi >= 25 ? 'text-destructive' : 'text-primary'}`}>
              {bmi}
            </div>
          </div>
        </div>

        {whtr > 0 && (
          <div className="text-[11px] text-muted-foreground flex items-center justify-between px-1">
            <span>{bn ? 'কোমর-উচ্চতা অনুপাত (WHtR):' : 'Waist-to-Height (WHtR):'}</span>
            <span className={`font-semibold tabular-numbers ${whtr >= 0.5 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-foreground'}`}>
              {whtr}
            </span>
          </div>
        )}
      </div>

      {/* Ayurvedic Live Profile */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-subtle space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            {bn ? 'আয়ুর্বেদিক প্রোফাইল' : 'Ayurvedic Profile'}
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {prakritiResult.primary_constitution.replace('_', '-')}
          </span>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Vata / Pitta / Kapha</span>
            <span className="font-semibold text-foreground tabular-numbers">
              {prakritiResult.vata_score}% / {prakritiResult.pitta_score}% / {prakritiResult.kapha_score}%
            </span>
          </div>

          <div className="w-full bg-secondary rounded-full h-1.5 flex overflow-hidden">
            <div style={{ width: `${prakritiResult.vata_score}%` }} className="bg-sky-400" />
            <div style={{ width: `${prakritiResult.pitta_score}%` }} className="bg-rose-400" />
            <div style={{ width: `${prakritiResult.kapha_score}%` }} className="bg-emerald-400" />
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-muted-foreground">{bn ? 'পরিপাক অগ্নি:' : 'Digestive Agni:'}</span>
            <span className="font-bold text-primary">{agniResult.type}</span>
          </div>
        </div>
      </div>

      {/* Safety & Allergies Card */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-subtle space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
            {bn ? 'নিরাপত্তা ও অ্যালার্জি' : 'Safety & Allergies'}
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
            completionStatus.clinical_safety_completed ? 'bg-primary/10 text-primary border-primary/20' : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}>
            {completionStatus.clinical_safety_completed ? (bn ? 'সুরক্ষিত' : 'Checked') : (bn ? 'স্ক্রিনিং বাকি' : 'Review')}
          </span>
        </div>

        {patient.confirmed_allergies && patient.confirmed_allergies.length > 0 ? (
          <div className="flex flex-wrap gap-1 pt-1">
            {patient.confirmed_allergies.map(a => (
              <span key={a} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                {a}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground italic">
            {bn ? 'কোনো নিশ্চিত অ্যালার্জি রিপোর্ট করা হয়নি।' : 'No confirmed food allergies documented.'}
          </p>
        )}

        {patient.feeding_status && (
          <div className="pt-1.5 border-t border-border text-[11px] flex items-center justify-between">
            <span className="text-muted-foreground">{bn ? 'ফিডিং রুট:' : 'Feeding Route:'}</span>
            <span className="font-semibold text-foreground">{patient.feeding_status.route}</span>
          </div>
        )}

        {clinicalSafetyEvaluation && clinicalSafetyEvaluation.hardStops && clinicalSafetyEvaluation.hardStops.length > 0 && (
          <div className="p-2 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold flex items-center gap-2 mt-2 border border-destructive/20">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{bn ? `${clinicalSafetyEvaluation.hardStops.length}টি নিরাপত্তা বাধা সক্রিয়` : `${clinicalSafetyEvaluation.hardStops.length} Clinical Hard Stop(s) active`}</span>
          </div>
        )}
      </div>
    </div>
  );
};
