/**
 * Backward-compatibility wrapper.
 *
 * The scoring logic now lives in `x01-match-engine.ts` behind the
 * `GameEngine` interface. This module delegates to that engine so
 * existing call-sites and tests keep working unchanged.
 */
import type { Player, GameSettings, ScoreModifier } from "@/lib/schemas";
import { createX01Engine } from "./x01-match-engine";

export type DartThrowOutcome = {
  newScore: number;
  validatedScore: number;
  isBust: boolean;
  isLegWin: boolean;
  isCheckoutAttempt: boolean;
  isDoubleAttempt: boolean;
  isMissedDouble: boolean;
};

export const computeDartThrow = (
  player: Player,
  score: number,
  modifier: ScoreModifier,
  settings: GameSettings,
): DartThrowOutcome => {
  const engine = createX01Engine(settings);
  const outcome = engine.processThrow(player.score, score, modifier);

  return {
    newScore: outcome.newScore,
    validatedScore: outcome.validatedScore,
    isBust: outcome.isBust,
    isLegWin: outcome.isRoundWin,
    isCheckoutAttempt: outcome.isCheckoutAttempt,
    isDoubleAttempt: outcome.isDoubleAttempt,
    isMissedDouble: outcome.isMissedDouble,
  };
};
