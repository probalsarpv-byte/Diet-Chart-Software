'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { AssessmentData } from "../types/index";
import { registryVersion, AssessmentDomainId, ASSESSMENT_DOMAINS, coreQuestions } from "../questionnaire/registry";
import { usePractice } from "./PracticeContext";
import { filterVisibleQuestions } from "../engine/questionEngine";

interface AssessmentContextProps {
  data: AssessmentData;
  setAnswer: (questionId: string, value: any) => void;
  resetAssessment: () => void;
  activeDomain: AssessmentDomainId;
  setActiveDomain: (domain: AssessmentDomainId) => void;
  isQuickMode: boolean;
  setIsQuickMode: (quick: boolean) => void;
  markCompleted: (completed: boolean) => void;
  saveDraft: () => void;
  completionPercentage: number;
  totalAnsweredCount: number;
}

const defaultData: AssessmentData = {
  version: registryVersion,
  answers: {},
  completed: false,
};

const AssessmentContext = createContext<AssessmentContextProps | undefined>(undefined);

export const AssessmentProvider = ({ children }: { children: ReactNode }) => {
  const { patient } = usePractice();
  const patientId = patient?.id || "default_patient";

  const [data, setData] = useState<AssessmentData>(defaultData);
  const [activeDomain, setActiveDomain] = useState<AssessmentDomainId>('clinical_history');
  const [isQuickMode, setIsQuickMode] = useState<boolean>(false);

  // Load patient-specific assessment whenever patientId changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storageKey = `shuddho_assessment_${patientId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AssessmentData;
        setData(parsed);
        return;
      } catch (e) {
        console.warn("Failed to parse patient assessment:", e);
      }
    }
    // If not found in storage, check if patient profile already has initial answers
    setData({
      version: registryVersion,
      answers: {},
      completed: false,
    });
  }, [patientId]);

  // Debounced auto-save to patient-specific storage
  useEffect(() => {
    if (typeof window === "undefined" || !patientId) return;

    const handler = setTimeout(() => {
      try {
        const storageKey = `shuddho_assessment_${patientId}`;
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (e) {
        console.error("Auto-save failed:", e);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [data, patientId]);

  const setAnswer = useCallback((questionId: string, value: any) => {
    setData((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value },
    }));
  }, []);

  const resetAssessment = useCallback(() => {
    setData({
      version: registryVersion,
      answers: {},
      completed: false,
    });
    if (typeof window !== "undefined" && patientId) {
      localStorage.removeItem(`shuddho_assessment_${patientId}`);
    }
  }, [patientId]);

  const markCompleted = useCallback((completed: boolean) => {
    setData((prev) => ({
      ...prev,
      completed,
      completedAt: completed ? new Date().toISOString() : undefined,
    }));
  }, []);

  const saveDraft = useCallback(() => {
    if (typeof window !== "undefined" && patientId) {
      localStorage.setItem(`shuddho_assessment_${patientId}`, JSON.stringify(data));
    }
  }, [data, patientId]);

  // Compute completion metrics
  const visibleQuestions = useMemo(() => {
    return filterVisibleQuestions(data.answers, coreQuestions, {
      isQuickMode,
      populationGroup: patient?.population_group,
    });
  }, [data.answers, isQuickMode, patient?.population_group]);

  const totalAnsweredCount = useMemo(() => {
    return Object.keys(data.answers).filter(
      (k) => data.answers[k] !== undefined && data.answers[k] !== null && data.answers[k] !== ""
    ).length;
  }, [data.answers]);

  const completionPercentage = useMemo(() => {
    if (visibleQuestions.length === 0) return 0;
    const answeredVisible = visibleQuestions.filter(
      (q) => data.answers[q.id] !== undefined && data.answers[q.id] !== null && data.answers[q.id] !== ""
    ).length;
    return Math.min(100, Math.round((answeredVisible / visibleQuestions.length) * 100));
  }, [visibleQuestions, data.answers]);

  return (
    <AssessmentContext.Provider
      value={{
        data,
        setAnswer,
        resetAssessment,
        activeDomain,
        setActiveDomain,
        isQuickMode,
        setIsQuickMode,
        markCompleted,
        saveDraft,
        completionPercentage,
        totalAnsweredCount,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessment = () => {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("useAssessment must be used within AssessmentProvider");
  return ctx;
};
