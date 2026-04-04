import type { GameSettings, ScoreModifier } from "@/lib/schemas";
import type { GameEngine, ThrowOutcome } from "./game-engine";

function isDoubleCheckoutScore(score: number): boolean {
  return score === 50 || (score > 0 && score <= 40 && score % 2 === 0);
}

/**
 * Create a GameEngine for X01 match play (501, 301, etc.).
 *
 * The engine is a plain object — cheap to create from settings and
 * safe to recreate on every action (no internal mutable state).
 */
export function createX01Engine(settings: GameSettings): GameEngine {
  const requiredLegs =
    settings.gameMode === "firstTo"
      ? settings.legsToWin
      : Math.ceil(settings.legsToWin / 2);

  return {
    maxDartsPerVisit: 3,
    maxVisitScore: 180,

    processThrow(
      playerScore: number,
      dartScore: number,
      modifier: ScoreModifier,
    ): ThrowOutcome {
      const isCheckoutAttempt =
        playerScore <= 170 &&
        playerScore > 0 &&
        (settings.outMode === "single" || playerScore !== 1);

      const isDoubleAttempt =
        modifier === "double" && isDoubleCheckoutScore(playerScore);

      let newScore = playerScore - dartScore;
      let validatedScore = dartScore;
      let isBust = false;
      let isRoundWin = false;

      if (
        newScore < 0 ||
        (settings.outMode === "double" && newScore === 1)
      ) {
        newScore = playerScore;
        validatedScore = 0;
        isBust = true;
      } else if (newScore === 0) {
        const validOut =
          settings.outMode === "single" || modifier === "double";
        if (validOut) {
          isRoundWin = true;
        } else {
          newScore = playerScore;
          validatedScore = 0;
          isBust = true;
        }
      }

      const isMissedDouble = isDoubleAttempt && !isRoundWin;

      return {
        newScore,
        validatedScore,
        isBust,
        isRoundWin,
        isCheckoutAttempt,
        isDoubleAttempt,
        isMissedDouble,
      };
    },

    isMatchWon(legsWon: number): boolean {
      return legsWon >= requiredLegs;
    },

    getStartingScore(): number {
      return settings.startingScore;
    },
  };
}
