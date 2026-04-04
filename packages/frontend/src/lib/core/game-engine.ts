import type { ScoreModifier } from "@/lib/schemas";

/**
 * Outcome of processing a single dart throw.
 *
 * Returned by every GameEngine implementation. Field semantics are
 * mode-agnostic: `isRoundWin` means "this throw completed the current
 * round" — a leg win in X01, a completed session in Around the Clock, etc.
 */
export type ThrowOutcome = {
  newScore: number;
  validatedScore: number;
  isBust: boolean;
  isRoundWin: boolean;
  isCheckoutAttempt: boolean;
  isDoubleAttempt: boolean;
  isMissedDouble: boolean;
};

/**
 * Strategy interface for game mode logic.
 *
 * Each game mode (X01, Around the Clock, Cricket, …) implements this
 * interface. The store delegates all scoring and win-condition decisions
 * to the active engine, keeping itself mode-agnostic.
 *
 * Engines are **stateless** — they are cheap to create from settings and
 * should not be stored in Zustand (to avoid serialization issues).
 */
export interface GameEngine {
  /** Maximum darts allowed per visit/turn (e.g. 3 for X01). */
  readonly maxDartsPerVisit: number;

  /** Maximum possible score in a single visit (e.g. 180 for X01). */
  readonly maxVisitScore: number;

  /**
   * Process a single dart throw against the current player score.
   *
   * Pure function — no side effects. The store is responsible for
   * applying state mutations and emitting domain events.
   */
  processThrow(
    playerScore: number,
    dartScore: number,
    modifier: ScoreModifier,
  ): ThrowOutcome;

  /**
   * Check whether a player has won the overall game/match given
   * the number of rounds (legs) they have won so far.
   */
  isMatchWon(legsWon: number): boolean;

  /** Starting score for a new round/leg. */
  getStartingScore(): number;
}
