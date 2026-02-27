import type { Player, GameSettings, ScoreModifier } from "@/lib/schemas";

export type DartThrowOutcome = {
  newScore: number;
  validatedScore: number;
  isBust: boolean;
  isLegWin: boolean;
  isCheckoutAttempt: boolean;
  isDoubleAttempt: boolean;
  isMissedDouble: boolean;
};

function isDoubleCheckoutScore(score: number): boolean {
  return score === 50 || (score > 0 && score <= 40 && score % 2 === 0);
}

export const computeDartThrow = (
  player: Player,
  score: number,
  modifier: ScoreModifier,
  settings: GameSettings,
): DartThrowOutcome => {
  const isCheckoutAttempt =
    player.score <= 170 &&
    player.score > 0 &&
    (settings.outMode === "single" || player.score !== 1);
  const isDoubleAttempt =
    modifier === "double" && isDoubleCheckoutScore(player.score);
  let newScore = player.score - score;
  let validatedScore = score;
  let isBust = false;
  let isLegWin = false;

  if (newScore < 0 || (settings.outMode === "double" && newScore === 1)) {
    newScore = player.score;
    validatedScore = 0;
    isBust = true;
  } else if (newScore === 0) {
    const validOut = settings.outMode === "single" || modifier === "double";
    if (validOut) {
      isLegWin = true;
    } else {
      newScore = player.score;
      validatedScore = 0;
      isBust = true;
    }
  }

  const isMissedDouble = isDoubleAttempt && !isLegWin;

  return {
    newScore,
    validatedScore,
    isBust,
    isLegWin,
    isCheckoutAttempt,
    isDoubleAttempt,
    isMissedDouble,
  };
};
