// Questionnaire Registry for Functional Nutrition Assessment
// -------------------------------------------------------
// This file defines the core question set used by the adaptive assessment wizard.
// Each question is described by a `QuestionDefinition` interface.
// The registry is versioned via the exported `registryVersion` constant so that
// future migrations can be implemented deterministically.

export const registryVersion = "v1.0.0" as const;

/**
 * Supported answer types for the UI.
 */
export type AnswerType = "text" | "number" | "select" | "multiselect" | "yesno" | "date";

/**
 * A single option for `select` / `multiselect` answer types.
 */
export interface AnswerOption {
  /** Value stored in the answer object */
  value: string;
  /** Human‑readable label (Bengali/English will be resolved by i18n) */
  label: string;
}

/**
 * Visibility rule – determines whether a question should be shown based on
 * previously recorded answers.
 * The `condition` is a JavaScript expression evaluated with the current `answers`
 * object in scope.  It must return a boolean.
 */
export interface VisibilityRule {
  /** Human readable description (optional) */
  description?: string;
  /** JavaScript expression returning a boolean */
  condition: string;
}

/**
 * Full definition of a questionnaire item.
 */
export interface QuestionDefinition {
  /** Stable identifier – used as the key in the answer map. */
  id: string;
  /** Question text (i18n key). */
  label: string;
  /** Answer UI type. */
  answerType: AnswerType;
  /** Optional array of selectable options (for select/multiselect). */
  options?: AnswerOption[];
  /** Optional visibility rule – if omitted the question is always shown. */
  visibility?: VisibilityRule;
  /** Optional domain grouping – helpful for UI sections. */
  domain?: string;
  /** Indicates whether the question is required for a complete assessment. */
  required?: boolean;
}

/**
 * Core (high‑value) question set – ~30 questions covering the 14 clinical
 * domains.  This list is deliberately concise for the initial implementation;
 * additional questions can be added in separate lazy‑loaded modules.
 */
export const coreQuestions: QuestionDefinition[] = [
  // Demographics
  {
    id: "patient_name",
    label: "Patient Name",
    answerType: "text",
    required: true,
    domain: "demographics",
  },
  {
    id: "patient_age",
    label: "Age (years)",
    answerType: "number",
    required: true,
    domain: "demographics",
  },
  {
    id: "patient_gender",
    label: "Gender",
    answerType: "select",
    options: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
      { value: "other", label: "Other" },
    ],
    required: true,
    domain: "demographics",
  },
  // Anthropometrics
  {
    id: "height_cm",
    label: "Height (cm)",
    answerType: "number",
    required: true,
    domain: "anthropometrics",
  },
  {
    id: "weight_kg",
    label: "Weight (kg)",
    answerType: "number",
    required: true,
    domain: "anthropometrics",
  },
  {
    id: "waist_cm",
    label: "Waist circumference (cm)",
    answerType: "number",
    required: false,
    domain: "anthropometrics",
  },
  // Lifestyle
  {
    id: "activity_level",
    label: "Physical Activity Level",
    answerType: "select",
    options: [
      { value: "sedentary", label: "Sedentary" },
      { value: "light", label: "Light" },
      { value: "moderate", label: "Moderate" },
      { value: "active", label: "Active" },
    ],
    required: true,
    domain: "lifestyle",
  },
  // Symptoms – example for adaptive branching
  {
    id: "symptom_fatigue",
    label: "Do you experience chronic fatigue?",
    answerType: "yesno",
    required: false,
    domain: "symptoms",
  },
  {
    id: "symptom_gut_pain",
    label: "Frequent gut pain or bloating?",
    answerType: "yesno",
    required: false,
    domain: "symptoms",
  },
  // Conditional question – only ask if gut pain is yes
  {
    id: "gut_symptom_severity",
    label: "How severe is the gut symptom?",
    answerType: "select",
    options: [
      { value: "mild", label: "Mild" },
      { value: "moderate", label: "Moderate" },
      { value: "severe", label: "Severe" },
    ],
    required: true,
    domain: "symptoms",
    visibility: {
      condition: "answers['symptom_gut_pain'] === 'yes'",
    },
  },
  // Medication history – simple capture
  {
    id: "medication_list",
    label: "Current Medications (comma‑separated)",
    answerType: "text",
    required: false,
    domain: "medication",
  },
  // Lab markers – optional
  {
    id: "lab_hba1c",
    label: "HbA1c (%)",
    answerType: "number",
    required: false,
    domain: "labs",
  },
  {
    id: "lab_fasting_glucose",
    label: "Fasting Glucose (mg/dL)",
    answerType: "number",
    required: false,
    domain: "labs",
  },
  // Additional placeholder – will be expanded later
];

/**
 * Exported registry – consumers should import `coreQuestions` and, if needed,
 * merge with lazily loaded extensions.
 */
export const questionnaireRegistry = {
  version: registryVersion,
  core: coreQuestions,
};
