import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AssessmentData } from "../types/index";
import { coreQuestions, registryVersion } from "../questionnaire/registry";

interface AssessmentContextProps {
  data: AssessmentData;
  setAnswer: (questionId: string, value: any) => void;
  resetAssessment: () => void;
}

const defaultData: AssessmentData = {
  version: registryVersion,
  answers: {},
  completed: false,
};

const AssessmentContext = createContext<AssessmentContextProps | undefined>(undefined);

export const AssessmentProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<AssessmentData>(() => {
    // Load draft from localStorage if present
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("assessmentDraft");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as AssessmentData;
          // ensure version compatibility
          if (parsed.version === registryVersion) return parsed;
        } catch {}
      }
    }
    return defaultData;
  });

  // autosave draft (debounced)
  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem("assessmentDraft", JSON.stringify(data));
    }, 500);
    return () => clearTimeout(handler);
  }, [data]);

  const setAnswer = (questionId: string, value: any) => {
    setData((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value },
    }));
  };

  const resetAssessment = () => {
    setData(defaultData);
    localStorage.removeItem("assessmentDraft");
  };

  return (
    <AssessmentContext.Provider value={{ data, setAnswer, resetAssessment }}>
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessment = () => {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("useAssessment must be used within AssessmentProvider");
  return ctx;
};
