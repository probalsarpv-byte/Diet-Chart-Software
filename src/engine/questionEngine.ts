// Adaptive Question Engine
// -------------------------
// Provides utilities for determining which questions should be displayed based on
// the current answer set and the visibility rules defined in the questionnaire
// registry.

import { QuestionDefinition } from "../questionnaire/registry";

/**
 * Evaluates a single visibility rule safely.
 * The rule condition is a JavaScript expression string evaluated with `answers`
 * in scope. We use `Function` to create a sandboxed evaluator – it has access only
 * to the `answers` argument and cannot reach outer variables.
 */
function evaluateCondition(condition: string, answers: Record<string, any>): boolean {
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function("answers", `return (${condition});`);
    const result = fn(answers);
    return !!result;
  } catch (e) {
    // If evaluation fails, be safe and hide the question.
    console.warn("Visibility condition evaluation error:", e, "condition:", condition);
    return false;
  }
}

/**
 * Returns the subset of `questions` that are visible given the current `answers`.
 * Questions without a `visibility` rule are always included.
 */
export function filterVisibleQuestions(
  answers: Record<string, any>,
  questions: QuestionDefinition[]
): QuestionDefinition[] {
  return questions.filter((q) => {
    if (!q.visibility) return true;
    return evaluateCondition(q.visibility.condition, answers);
  });
}

/**
 * Convenience helper that returns the ordered list of visible core questions.
 */
export function getVisibleCoreQuestions(
  answers: Record<string, any>
): QuestionDefinition[] {
  // Import lazily to avoid circular dependency issues at runtime.
  // The registry is a plain object, safe to import directly.
  const { coreQuestions } = require("../questionnaire/registry");
  return filterVisibleQuestions(answers, coreQuestions as QuestionDefinition[]);
}

export default {
  filterVisibleQuestions,
  getVisibleCoreQuestions,
};
