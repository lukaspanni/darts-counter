import { describe, expect, test } from "vitest";
import { computeDartThrow } from "../src/lib/core/darts-score";
import type { GameSettings, Player } from "../src/lib/schemas";

const baseSettings: GameSettings = {
  startingScore: 501,
  outMode: "single",
  gameMode: "firstTo",
  legsToWin: 1,
  checkoutAssist: false,
};

const createPlayer = (score: number): Player => ({
  id: 1,
  name: "Alice",
  score,
  legsWon: 0,
  dartsThrown: 0,
  totalScore: 0,
  scoreHistory: [[]],
});

describe("computeDartThrow", () => {
  test("flags checkout attempts at finishable scores", () => {
    const result = computeDartThrow(
      createPlayer(170),
      60,
      "single",
      baseSettings,
    );

    expect(result.isCheckoutAttempt).toBe(true);
  });

  test("does not flag checkout attempts above 170", () => {
    const result = computeDartThrow(
      createPlayer(171),
      60,
      "single",
      baseSettings,
    );

    expect(result.isCheckoutAttempt).toBe(false);
  });

  test("does not flag checkout attempts at 1 in double-out", () => {
    const result = computeDartThrow(
      createPlayer(1),
      1,
      "single",
      { ...baseSettings, outMode: "double" },
    );

    expect(result.isCheckoutAttempt).toBe(false);
  });

  test("marks double attempt and missed double when not finishing", () => {
    const result = computeDartThrow(
      createPlayer(32),
      10,
      "double",
      { ...baseSettings, outMode: "double" },
    );

    expect(result.isDoubleAttempt).toBe(true);
    expect(result.isLegWin).toBe(false);
    expect(result.isMissedDouble).toBe(true);
  });

  test("busts when leaving 1 in double-out", () => {
    const result = computeDartThrow(
      createPlayer(21),
      20,
      "single",
      { ...baseSettings, outMode: "double" },
    );

    expect(result.isBust).toBe(true);
    expect(result.validatedScore).toBe(0);
    expect(result.newScore).toBe(21);
  });

  test("busts when checking out without double in double-out", () => {
    const result = computeDartThrow(
      createPlayer(20),
      20,
      "single",
      { ...baseSettings, outMode: "double" },
    );

    expect(result.isBust).toBe(true);
    expect(result.isLegWin).toBe(false);
    expect(result.validatedScore).toBe(0);
    expect(result.newScore).toBe(20);
  });

  test("wins on single-out finish", () => {
    const result = computeDartThrow(
      createPlayer(20),
      20,
      "single",
      baseSettings,
    );

    expect(result.isLegWin).toBe(true);
    expect(result.isBust).toBe(false);
  });

  test("wins on double-out finish with double", () => {
    const result = computeDartThrow(
      createPlayer(20),
      20,
      "double",
      { ...baseSettings, outMode: "double" },
    );

    expect(result.isLegWin).toBe(true);
    expect(result.isDoubleAttempt).toBe(true);
    expect(result.isMissedDouble).toBe(false);
  });
});
