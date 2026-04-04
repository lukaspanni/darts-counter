import type { ScoreModifier } from "@/lib/schemas";
import { findCheckout } from "@/lib/core/checkout";

export type OutMode = "single" | "double";

export type CheckoutPracticeState = {
  mode: "checkoutPractice";
  currentTarget: number; // score to check out
  attemptsCompleted: number;
  attemptsSucceeded: number;
  totalDartsUsed: number;
  currentVisitDarts: number; // 0-3
  currentScore: number; // remaining score in current attempt
  outMode: OutMode;
  scoreRange: [number, number];
  lastAttemptResult: "success" | "fail" | null;
};

export function generateCheckoutTarget(
  scoreRange: [number, number],
  outMode: OutMode,
): number {
  const [min, max] = scoreRange;
  const doubleCheckout = outMode === "double";
  const candidates: number[] = [];

  for (let s = min; s <= max; s++) {
    if (findCheckout(s, 3, doubleCheckout) !== null) {
      candidates.push(s);
    }
  }

  if (candidates.length === 0) {
    // Fallback: return a score that definitely has a checkout
    return doubleCheckout ? 32 : 20;
  }

  return candidates[Math.floor(Math.random() * candidates.length)]!;
}

export function createInitialCheckoutState(
  scoreRange: [number, number],
  outMode: OutMode,
): CheckoutPracticeState {
  const currentTarget = generateCheckoutTarget(scoreRange, outMode);
  return {
    mode: "checkoutPractice",
    currentTarget,
    attemptsCompleted: 0,
    attemptsSucceeded: 0,
    totalDartsUsed: 0,
    currentVisitDarts: 0,
    currentScore: currentTarget,
    outMode,
    scoreRange,
    lastAttemptResult: null,
  };
}

function isBust(
  currentScore: number,
  score: number,
  outMode: OutMode,
  modifier: ScoreModifier,
): boolean {
  const newScore = currentScore - score;
  if (newScore < 0) return true;
  if (outMode === "double" && newScore === 1) return true;
  if (newScore === 0 && outMode === "double" && modifier !== "double")
    return true;
  return false;
}

function isSuccess(
  currentScore: number,
  score: number,
  outMode: OutMode,
  modifier: ScoreModifier,
): boolean {
  const newScore = currentScore - score;
  if (newScore !== 0) return false;
  if (outMode === "double") return modifier === "double";
  return true;
}

export function processCheckoutThrow(
  state: CheckoutPracticeState,
  score: number,
  modifier: ScoreModifier,
): CheckoutPracticeState {
  if (state.currentVisitDarts >= 3) return state;

  const newDartsInVisit = state.currentVisitDarts + 1;
  const newTotalDarts = state.totalDartsUsed + 1;

  const bust = isBust(state.currentScore, score, state.outMode, modifier);
  const success = !bust && isSuccess(state.currentScore, score, state.outMode, modifier);
  const endOfAttempt = bust || success || newDartsInVisit >= 3;

  if (endOfAttempt) {
    const attemptsCompleted = state.attemptsCompleted + 1;
    const attemptsSucceeded = state.attemptsSucceeded + (success ? 1 : 0);
    const lastAttemptResult: "success" | "fail" = success ? "success" : "fail";
    const newTarget = generateCheckoutTarget(state.scoreRange, state.outMode);

    return {
      ...state,
      attemptsCompleted,
      attemptsSucceeded,
      totalDartsUsed: newTotalDarts,
      currentVisitDarts: 0,
      currentScore: newTarget,
      currentTarget: newTarget,
      lastAttemptResult,
    };
  }

  const newScore = state.currentScore - score;
  return {
    ...state,
    currentVisitDarts: newDartsInVisit,
    currentScore: newScore,
    totalDartsUsed: newTotalDarts,
    lastAttemptResult: null,
  };
}
