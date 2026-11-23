'use client';

import React from 'react';
import { SleepCircadianProtocol } from '@/types/r4Protocol';
import { 
  Moon, 
  Sun, 
  Coffee, 
  Utensils, 
  Activity, 
  Monitor, 
  AlertTriangle,
  Clock
} from 'lucide-react';
import { 
  subtractHoursFromTime, 
  addHoursToTime, 
  calculateIntervalHours 
} from '@/engine/sleepEngine';

interface SleepSectionProps {
  sleep: SleepCircadianProtocol;
  onChange: (updated: SleepCircadianProtocol) => void;
  language: 'bn' | 'en';
}

export const SleepSection: React.FC<SleepSectionProps> = ({
  sleep,
  onChange,
  language
}) => {
  const bn = language === 'bn';

  const handleWakeTimeChange = (newWake: string) => {
    const daylightTime = addHoursToTime(newWake, 0.5);
    const sleepDuration = calculateIntervalHours(sleep.bed_time, newWake);

    onChange({
      ...sleep,
      wake_time: newWake,
      target_sleep_hours: sleepDuration,
      daylight_exposure: {
        ...sleep.daylight_exposure,
        scheduled_time: daylightTime
      }
    });
  };

  const handleBedTimeChange = (newBed: string) => {
    const caffeineCurfew = subtractHoursFromTime(newBed, 9);
    const mealCurfew = subtractHoursFromTime(newBed, 3);
    const exerciseCurfew = subtractHoursFromTime(newBed, 3);
    const screenCurfew = subtractHoursFromTime(newBed, 1.5);
    const sleepDuration = calculateIntervalHours(newBed, sleep.wake_time);

    onChange({
      ...sleep,
      bed_time: newBed,
      target_sleep_hours: sleepDuration,
      caffeine_curfew_time: caffeineCurfew,
      last_meal_curfew_time: mealCurfew,
      exercise_curfew_time: exerciseCurfew,
      evening_light: {
        ...sleep.evening_light,
        cutoff_time: screenCurfew
      }
    });
  };

  const handleShiftTypeChange = (shiftType: any) => {
    const isShift = shiftType !== 'regular';
    if (shiftType === 'night_shift') {
      const wake = '16:30';
      const bed = '08:30';
      onChange({
        ...sleep,
        is_shift_worker: true,
        shift_schedule_type: shiftType,
        wake_time: wake,
        bed_time: bed,
        target_sleep_hours: 8.0,
        caffeine_curfew_time: subtractHoursFromTime(bed, 9),
        last_meal_curfew_time: subtractHoursFromTime(bed, 3),
        exercise_curfew_time: subtractHoursFromTime(bed, 3)
      });
    } else {
      const wake = '06:30';
      const bed = '23:00';
      onChange({
        ...sleep,
        is_shift_worker: isShift,
        shift_schedule_type: shiftType,
        wake_time: wake,
        bed_time: bed,
        target_sleep_hours: 7.5,
        caffeine_curfew_time: subtractHoursFromTime(bed, 9),
        last_meal_curfew_time: subtractHoursFromTime(bed, 3),
        exercise_curfew_time: subtractHoursFromTime(bed, 3)
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Sleep Header & Key Metrics ── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <Moon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              {bn ? 'ঘুম ও সার্কাডিয়ান ক্রোনোবায়োলজি' : 'Circadian Sleep & Biological Rhythm Architecture'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {bn ? 'মস্তিষ্কের পিনিয়াল গ্ল্যান্ড, মেলাটোনিন নিঃসরন ও সান্ধ্যকালীন সুরক্ষা' : 'SCN central oscillator, pineal melatonin entrainment, and daytime sleep synchronization'}
            </p>
          </div>
        </div>

        {/* Schedule Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border">
          <div className="bg-background border border-border rounded-xl p-3">
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              {bn ? 'ঘুম থেকে ওঠার সময় (Wake)' : 'Wake Up Time'}
            </label>
            <input
              type="time"
              value={sleep.wake_time}
              onChange={(e) => handleWakeTimeChange(e.target.value)}
              className="w-full px-2 py-1.5 text-sm font-bold bg-secondary border border-border rounded-lg text-center"
            />
          </div>

          <div className="bg-background border border-border rounded-xl p-3">
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              {bn ? 'ঘুমানোর সময় (Bedtime)' : 'Target Bedtime'}
            </label>
            <input
              type="time"
              value={sleep.bed_time}
              onChange={(e) => handleBedTimeChange(e.target.value)}
              className="w-full px-2 py-1.5 text-sm font-bold bg-secondary border border-border rounded-lg text-center"
            />
          </div>

          <div className="bg-background border border-border rounded-xl p-3 flex flex-col justify-between">
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              {bn ? 'পরিকল্পিত ঘুমের সময়' : 'Target Sleep Window'}
            </label>
            <div className="text-base font-extrabold text-purple-500 text-center py-1">
              {sleep.target_sleep_hours.toFixed(1)} hrs
            </div>
          </div>

          <div className="bg-background border border-border rounded-xl p-3">
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              {bn ? 'শিফট ওয়ার্ক শিডিউল' : 'Shift Schedule Mode'}
            </label>
            <select
              value={sleep.shift_schedule_type}
              onChange={(e) => handleShiftTypeChange(e.target.value)}
              className="w-full px-2 py-1.5 text-xs font-semibold bg-secondary border border-border rounded-lg"
            >
              <option value="regular">Standard Daytime</option>
              <option value="night_shift">Night Shift (Day Sleep)</option>
              <option value="evening_shift">Evening Shift</option>
              <option value="rotating_shift">Rotating Shift</option>
            </select>
          </div>
        </div>

        {/* OSA / Sleep Disorder Warning Box */}
        {sleep.suspected_sleep_disorder_alert && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              {sleep.suspected_sleep_disorder_alert}
            </p>
          </div>
        )}
      </div>

      {/* ── Dynamic Chronobiological Curfews ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Caffeine Curfew */}
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              {bn ? 'ক্যাফেইন কার্ফু (৯ ঘণ্টা পূর্বে)' : 'Caffeine Cutoff (9h prior)'}
            </span>
            <span className="text-sm font-extrabold text-foreground">
              {sleep.caffeine_curfew_time}
            </span>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {bn ? 'অ্যাডেনোসিন রিসেপ্টর সুরক্ষায় চা/কফি বন্ধ' : 'Clear adenosine receptor block'}
            </p>
          </div>
        </div>

        {/* Meal Curfew */}
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Utensils className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              {bn ? 'রাতের খাবার কার্ফু (৩ ঘণ্টা পূর্বে)' : 'Dinner Cutoff (3h prior)'}
            </span>
            <span className="text-sm font-extrabold text-foreground">
              {sleep.last_meal_curfew_time}
            </span>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {bn ? 'পাকস্থলী খালি হওয়া ও অ্যাসিড রিফ্লাক্স রোধ' : 'Complete gastric emptying'}
            </p>
          </div>
        </div>

        {/* Exercise Curfew */}
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              {bn ? 'ভারী ব্যায়াম কার্ফু (৩ ঘণ্টা পূর্বে)' : 'Exercise Cutoff (3h prior)'}
            </span>
            <span className="text-sm font-extrabold text-foreground">
              {sleep.exercise_curfew_time}
            </span>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {bn ? 'শরীরের তাপমাত্রা হ্রাস ও হৃদস্পন্দন শান্ত' : 'Core temperature downregulation'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Light Exposure & Pineal Protection Protocols ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Morning Daylight Card */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {bn ? 'সকালের প্রাকৃতিক আলো সংস্পর্শ' : 'Morning Daylight SCN Entrainment'}
              </h3>
              <span className="text-xs text-muted-foreground">
                {sleep.daylight_exposure?.scheduled_time} ({sleep.daylight_exposure?.duration_minutes}m)
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {bn ? sleep.daylight_exposure?.instructions_bn : sleep.daylight_exposure?.instructions_en}
          </p>
        </div>

        {/* Evening Screen Curfew Card */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {bn ? 'সান্ধ্যকালীন স্ক্রিন কার্ফু ও ব্লু-লাইট ফিল্টার' : 'Evening Light & Screen Curfew'}
              </h3>
              <span className="text-xs text-muted-foreground">
                {sleep.evening_light?.cutoff_time} ({sleep.evening_light?.screen_curfew_hours_before_bed}h prior)
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {bn ? sleep.evening_light?.instructions_bn : sleep.evening_light?.instructions_en}
          </p>
        </div>
      </div>
    </div>
  );
};
