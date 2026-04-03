import { describe, expect, test } from "vitest";
import { createX01Engine } from "../src/lib/core/x01-match-engine";
import type { GameSettings } from "../src/lib/schemas";

const singleOut: GameSettings = {
  startingScore: 501,
  outMode: "single",
  gameMode: "firstTo",
  legsToWin: 1,
  checkoutAssist: false,
};

const doubleOut: GameSettings = {
  ...singleOut,
  outMode: "double",
};

describe("X01 scoring rules", () => {
  describe("normal throws", () => {
    test("subtracts dart score from remaining", () => {
      const engine = createX01Engine(singleOut);
      const result = engine.processThrow(501, 60, "single");

      expect(result.newScore).toBe(441);
      expect(result.validatedScore).toBe(60);
      expect(result.isBust).toBe(false);
      expect(result.isRoundWin).toBe(false);
    });
  });

  describe("bust detection", () => {
    test("busts when dart score exceeds remaining", () => {
      const engine = createX01Engine(singleOut);
      const result = engine.processThrow(10, 20, "single");

      expect(result.isBust).toBe(true);
      expect(result.newScore).toBe(10);
      expect(result.validatedScore).toBe(0);
    });

    test("busts when leaving 1 in double-out mode", () => {
      const engine = createX01Engine(doubleOut);
      const result = engine.processThrow(21, 20, "single");

      expect(result.isBust).toBe(true);
      expect(result.newScore).toBe(21);
    });

    test("busts when reaching 0 without double in double-out mode", () => {
      const engine = createX01Engine(doubleOut);
      const result = engine.processThrow(20, 20, "single");

      expect(result.isBust).toBe(true);
      expect(result.isRoundWin).toBe(false);
      expect(result.newScore).toBe(20);
    });

    test("busts when reaching 0 with triple in double-out mode", () => {
      const engine = createX01Engine(doubleOut);
      const result = engine.processThrow(60, 60, "triple");

      expect(result.isBust).toBe(true);
      expect(result.isRoundWin).toBe(false);
      expect(result.newScore).toBe(60);
    });
  });

  describe("finishing a leg", () => {
    test("wins leg on single-out finish", () => {
      const engine = createX01Engine(singleOut);
      const result = engine.processThrow(20, 20, "single");

      expect(result.isRoundWin).toBe(true);
      expect(result.isBust).toBe(false);
      expect(result.newScore).toBe(0);
    });

    test("wins leg on double-out finish with double", () => {
      const engine = createX01Engine(doubleOut);
      const result = engine.processThrow(20, 20, "double");

      expect(result.isRoundWin).toBe(true);
      expect(result.isBust).toBe(false);
      expect(result.newScore).toBe(0);
    });

    test("wins leg on bullseye finish in double-out mode", () => {
      const engine = createX01Engine(doubleOut);
      const result = engine.processThrow(50, 50, "double");

      expect(result.isRoundWin).toBe(true);
      expect(result.isBust).toBe(false);
      expect(result.newScore).toBe(0);
    });
  });

  describe("checkout tracking", () => {
    test("flags checkout attempt at finishable score (170 or below)", () => {
      const engine = createX01Engine(singleOut);
      const result = engine.processThrow(170, 60, "single");

      expect(result.isCheckoutAttempt).toBe(true);
    });

    test("does not flag checkout attempt above 170", () => {
      const engine = createX01Engine(singleOut);
      const result = engine.processThrow(171, 60, "single");

      expect(result.isCheckoutAttempt).toBe(false);
    });

    test("does not flag checkout attempt at 1 in double-out (unfinishable)", () => {
      const engine = createX01Engine(doubleOut);
      const result = engine.processThrow(1, 1, "single");

      expect(result.isCheckoutAttempt).toBe(false);
    });

    test("tracks missed double when aiming for checkout", () => {
      const engine = createX01Engine(doubleOut);
      const result = engine.processThrow(32, 10, "double");

      expect(result.isDoubleAttempt).toBe(true);
      expect(result.isMissedDouble).toBe(true);
    });

    test("does not mark successful double finish as missed", () => {
      const engine = createX01Engine(doubleOut);
      const result = engine.processThrow(20, 20, "double");

      expect(result.isDoubleAttempt).toBe(true);
      expect(result.isMissedDouble).toBe(false);
    });
  });
});

describe("X01 match win conditions", () => {
  test("firstTo 1: match won after winning 1 leg", () => {
    const engine = createX01Engine({ ...singleOut, gameMode: "firstTo", legsToWin: 1 });
    expect(engine.isMatchWon(0)).toBe(false);
    expect(engine.isMatchWon(1)).toBe(true);
  });

  test("firstTo 3: match won after winning 3 legs", () => {
    const engine = createX01Engine({ ...singleOut, gameMode: "firstTo", legsToWin: 3 });
    expect(engine.isMatchWon(2)).toBe(false);
    expect(engine.isMatchWon(3)).toBe(true);
  });

  test("bestOf 3: need majority (2 legs) to win", () => {
    const engine = createX01Engine({ ...singleOut, gameMode: "bestOf", legsToWin: 3 });
    expect(engine.isMatchWon(1)).toBe(false);
    expect(engine.isMatchWon(2)).toBe(true);
  });

  test("bestOf 7: need majority (4 legs) to win", () => {
    const engine = createX01Engine({ ...singleOut, gameMode: "bestOf", legsToWin: 7 });
    expect(engine.isMatchWon(3)).toBe(false);
    expect(engine.isMatchWon(4)).toBe(true);
  });

  test("bestOf 9: need majority (5 legs) to win", () => {
    const engine = createX01Engine({ ...singleOut, gameMode: "bestOf", legsToWin: 9 });
    expect(engine.isMatchWon(4)).toBe(false);
    expect(engine.isMatchWon(5)).toBe(true);
  });
});
