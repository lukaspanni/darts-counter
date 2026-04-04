import { describe, expect, test } from "vitest";
import { computeDartThrow } from "../src/lib/core/darts-score";
import type { GameSettings, Player } from "../src/lib/schemas";

/**
 * computeDartThrow is a backward-compat wrapper over the X01 engine.
 * Scoring behavior is tested exhaustively in x01-match-engine.test.ts.
 * These tests verify the wrapper's Player-based API and field mapping.
 */

const settings: GameSettings = {
  startingScore: 501,
  outMode: "double",
  gameMode: "firstTo",
  legsToWin: 1,
  checkoutAssist: false,
};

const player = (score: number): Player => ({
  id: 1,
  name: "Alice",
  score,
  legsWon: 0,
  dartsThrown: 0,
  totalScore: 0,
  scoreHistory: [[]],
});

describe("computeDartThrow backward-compat wrapper", () => {
  test("maps all engine fields through on a leg win", () => {
    const result = computeDartThrow(player(20), 20, "double", settings);

    expect(result.isLegWin).toBe(true);
    expect(result.newScore).toBe(0);
    expect(result.validatedScore).toBe(20);
    expect(result.isBust).toBe(false);
    expect(result.isCheckoutAttempt).toBe(true);
    expect(result.isDoubleAttempt).toBe(true);
    expect(result.isMissedDouble).toBe(false);
  });

  test("maps all engine fields through on a bust", () => {
    const result = computeDartThrow(player(10), 20, "single", settings);

    expect(result.isLegWin).toBe(false);
    expect(result.newScore).toBe(10);
    expect(result.validatedScore).toBe(0);
    expect(result.isBust).toBe(true);
  });

  test("reads score from the player object, not from settings", () => {
    const result = computeDartThrow(player(40), 40, "double", settings);
    expect(result.isLegWin).toBe(true);
    expect(result.newScore).toBe(0);
  });
});
