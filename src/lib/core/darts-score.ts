import type { Player, GameSettings, ScoreModifier } from "@/lib/schemas";

export type DartThrowOutcome = {
  newScore: number;
  validatedScore: number;
  isBust: boolean;
  isRoundWin: boolean;
};

export const computeDartThrow = (
  player: Player,
  score: number,
  modifier: ScoreModifier,
  settings: GameSettings,
): DartThrowOutcome => {
  let newScore = player.score - score;
  let validatedScore = score;
  let isBust = false;
  let isRoundWin = false;

  if (newScore < 0 || (settings.outMode === "double" && newScore === 1)) {
    newScore = player.score;
    validatedScore = 0;
    isBust = true;
  } else if (newScore === 0) {
    const validOut = settings.outMode === "single" || modifier === "double";
    if (validOut) {
      isRoundWin = true;
    } else {
      newScore = player.score;
      validatedScore = 0;
      isBust = true;
    }
  }

  return { newScore, validatedScore, isBust, isRoundWin };
};
