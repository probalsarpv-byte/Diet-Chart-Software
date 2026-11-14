// Adaptive Question Engine
// -------------------------
// Provides pure, safe, deterministic utilities for evaluating questionnaire
// visibility rules without any eval() or new Function().
// Supports structured declarative operators: equals, notEquals, greaterThan,
// lessThan, greaterThanOrEqual, lessThanOrEqual, includes, exists, notExists,
// and nested boolean logic: AND, OR, NOT.

import {
  QuestionDefinition,
  DeclarativeCondition,
  VisibilityRule,
} from "../questionnaire/registry";

/**
 * Safely evaluates a single declarative condition object against current answers.
 * Zero dynamic code execution; completely deterministic.
 */
export function evaluateDeclarativeCondition(
  condition: DeclarativeCondition | string,
  answers: Record<string, any>
): boolean {
  if (!condition) return true;

  // Backwards compatibility for legacy string condition (e.g. "answers['foo'] === 'bar'")
  if (typeof condition === "string") {
    return evaluateLegacyStringCondition(condition, answers);
  }

  // CompoundCondition: AND
  if ("AND" in condition && Array.isArray(condition.AND)) {
    return condition.AND.every((sub) => evaluateDeclarativeCondition(sub, answers));
  }

  // CompoundCondition: OR
  if ("OR" in condition && Array.isArray(condition.OR)) {
    return condition.OR.some((sub) => evaluateDeclarativeCondition(sub, answers));
  }

  // CompoundCondition: NOT
  if ("NOT" in condition && condition.NOT) {
    return !evaluateDeclarativeCondition(condition.NOT, answers);
  }

  // SimpleCondition
  if ("field" in condition && condition.field) {
    const val = answers[condition.field];
    const target = condition.value;

    switch (condition.operator) {
      case "equals":
        return val === target;

      case "notEquals":
        return val !== target;

      case "greaterThan":
        return typeof val === "number" && typeof target === "number" && val > target;

      case "lessThan":
        return typeof val === "number" && typeof target === "number" && val < target;

      case "greaterThanOrEqual":
        return typeof val === "number" && typeof target === "number" && val >= target;

      case "lessThanOrEqual":
        return typeof val === "number" && typeof target === "number" && val <= target;

      case "includes":
        if (Array.isArray(val)) {
          return val.includes(target);
        }
        if (typeof val === "string") {
          return val.toLowerCase().includes(String(target).toLowerCase());
        }
        return false;

      case "exists":
        return val !== undefined && val !== null && val !== "" && !(Array.isArray(val) && val.length === 0);

      case "notExists":
        return val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0);

      default:
        return false;
    }
  }

  return true;
}

/**
 * Safe fallback evaluator for legacy string expressions without using eval/new Function.
 * Parses simple patterns like `answers['key'] === 'val'`, `answers.key === 'val'`, or truthy checks.
 */
function evaluateLegacyStringCondition(expr: string, answers: Record<string, any>): boolean {
  const trimmed = expr.trim();

  // Pattern: answers['foo'] === 'bar' or answers["foo"] === "bar"
  const eqMatch = trimmed.match(/answers\[['"]([^'"]+)['"]\]\s*===?\s*['"]([^'"]+)['"]/);
  if (eqMatch) {
    const [, field, expected] = eqMatch;
    return String(answers[field]) === expected;
  }

  // Pattern: answers['foo'] !== 'bar'
  const neMatch = trimmed.match(/answers\[['"]([^'"]+)['"]\]\s*!==?\s*['"]([^'"]+)['"]/);
  if (neMatch) {
    const [, field, expected] = neMatch;
    return String(answers[field]) !== expected;
  }

  // Pattern: answers['foo'] > 10
  const gtMatch = trimmed.match(/answers\[['"]([^'"]+)['"]\]\s*>\s*(\d+(\.\d+)?)/);
  if (gtMatch) {
    const [, field, num] = gtMatch;
    return typeof answers[field] === "number" && answers[field] > parseFloat(num);
  }

  // Pattern: answers['foo'] === true
  const boolMatch = trimmed.match(/answers\[['"]([^'"]+)['"]\]\s*===?\s*(true|false)/);
  if (boolMatch) {
    const [, field, boolStr] = boolMatch;
    return Boolean(answers[field]) === (boolStr === "true");
  }

  // Pattern: answers['foo'] (truthy)
  const truthyMatch = trimmed.match(/answers\[['"]([^'"]+)['"]\]/);
  if (truthyMatch) {
    const [, field] = truthyMatch;
    return Boolean(answers[field]);
  }

  return false;
}

/**
 * Returns the subset of `questions` that are visible given the current `answers`
 * and optional quick-mode screening flag.
 */
export function filterVisibleQuestions(
  answers: Record<string, any>,
  questions: QuestionDefinition[],
  options?: { isQuickMode?: boolean; populationGroup?: string }
): QuestionDefinition[] {
  return questions.filter((q) => {
    // In Quick Mode, only show high-value screening questions unless answered
    if (options?.isQuickMode && !q.isHighValueScreening && !answers[q.id]) {
      return false;
    }

    // Population applicability check
    if (q.applicablePopulation && options?.populationGroup) {
      if (
        !q.applicablePopulation.includes("all") &&
        !q.applicablePopulation.includes(options.populationGroup as any)
      ) {
        return false;
      }
    }

    // Declarative visibility rule check
    if (!q.visibility) return true;
    return evaluateDeclarativeCondition(q.visibility.condition, answers);
  });
}

/**
 * Returns all visible core screening questions.
 */
export function getVisibleCoreQuestions(
  answers: Record<string, any>,
  options?: { isQuickMode?: boolean; populationGroup?: string }
): QuestionDefinition[] {
  const { coreQuestions } = require("../questionnaire/registry");
  return filterVisibleQuestions(answers, coreQuestions as QuestionDefinition[], options);
}

export default {
  evaluateDeclarativeCondition,
  filterVisibleQuestions,
  getVisibleCoreQuestions,
};
