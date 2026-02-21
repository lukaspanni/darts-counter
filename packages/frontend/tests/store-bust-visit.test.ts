import { describe, expect, test } from "vitest";
import { createGameStore } from "../src/lib/store";

describe("createGameStore bust visit recording", () => {
  test("records totalScore as 0 when bust occurs on first dart", () => {
    const store = createGameStore();
    let state = store.getState();

    state.setGameSettings({
      startingScore: 50,
      outMode: "double",
      gameMode: "firstTo",
      legsToWin: 1,
      checkoutAssist: false,
    });
    state.setPlayers([{ name: "Alice" }]);
    state.startGame();

    // Throw 60 when player has 50 remaining (bust)
    state.handleDartThrow(60, "single");
    state.finishVisit();

    state = store.getState();
    const visit = state.historyLegs[0].visits[0];
    expect(visit).toBeDefined();
    expect(visit.darts).toHaveLength(1);
    expect(visit.darts[0].isBust).toBe(true);
    expect(visit.darts[0].validatedScore).toBe(0);
    expect(visit.totalScore).toBe(0);
  });

  test("records totalScore as 0 when bust occurs on second dart", () => {
    const store = createGameStore();
    let state = store.getState();

    state.setGameSettings({
      startingScore: 50,
      outMode: "double",
      gameMode: "firstTo",
      legsToWin: 1,
      checkoutAssist: false,
    });
    state.setPlayers([{ name: "Alice" }]);
    state.startGame();

    // First dart: 20 (valid)
    state.handleDartThrow(20, "single");
    // Second dart: 40 when player has 30 remaining (bust)
    state.handleDartThrow(40, "single");
    state.finishVisit();

    state = store.getState();
    const visit = state.historyLegs[0].visits[0];
    expect(visit).toBeDefined();
    expect(visit.darts).toHaveLength(2);
    expect(visit.darts[0].isBust).toBe(false);
    expect(visit.darts[0].validatedScore).toBe(20);
    expect(visit.darts[1].isBust).toBe(true);
    expect(visit.darts[1].validatedScore).toBe(0);
    expect(visit.totalScore).toBe(0); // Should be 0, not 20
  });

  test("records totalScore as 0 when bust occurs on third dart", () => {
    const store = createGameStore();
    let state = store.getState();

    state.setGameSettings({
      startingScore: 50,
      outMode: "double",
      gameMode: "firstTo",
      legsToWin: 1,
      checkoutAssist: false,
    });
    state.setPlayers([{ name: "Alice" }]);
    state.startGame();

    // First dart: 20 (valid)
    state.handleDartThrow(20, "single");
    // Second dart: 20 (valid)
    state.handleDartThrow(20, "single");
    // Third dart: 20 when player has 10 remaining (bust)
    state.handleDartThrow(20, "single");
    state.finishVisit();

    state = store.getState();
    const visit = state.historyLegs[0].visits[0];
    expect(visit).toBeDefined();
    expect(visit.darts).toHaveLength(3);
    expect(visit.darts[0].isBust).toBe(false);
    expect(visit.darts[0].validatedScore).toBe(20);
    expect(visit.darts[1].isBust).toBe(false);
    expect(visit.darts[1].validatedScore).toBe(20);
    expect(visit.darts[2].isBust).toBe(true);
    expect(visit.darts[2].validatedScore).toBe(0);
    expect(visit.totalScore).toBe(0); // Should be 0, not 40
  });

  test("records totalScore correctly for non-bust visit", () => {
    const store = createGameStore();
    let state = store.getState();

    state.setGameSettings({
      startingScore: 501,
      outMode: "double",
      gameMode: "firstTo",
      legsToWin: 1,
      checkoutAssist: false,
    });
    state.setPlayers([{ name: "Alice" }]);
    state.startGame();

    // Normal visit: 60, 60, 60
    state.handleDartThrow(60, "single");
    state.handleDartThrow(60, "single");
    state.handleDartThrow(60, "single");
    state.finishVisit();

    state = store.getState();
    const visit = state.historyLegs[0].visits[0];
    expect(visit).toBeDefined();
    expect(visit.darts).toHaveLength(3);
    expect(visit.darts[0].isBust).toBe(false);
    expect(visit.darts[1].isBust).toBe(false);
    expect(visit.darts[2].isBust).toBe(false);
    expect(visit.totalScore).toBe(180);
  });

  test("records totalScore as 0 when bust occurs in double-out mode with score of 1", () => {
    const store = createGameStore();
    let state = store.getState();

    state.setGameSettings({
      startingScore: 21,
      outMode: "double",
      gameMode: "firstTo",
      legsToWin: 1,
      checkoutAssist: false,
    });
    state.setPlayers([{ name: "Alice" }]);
    state.startGame();

    // Throw 20 single, leaving 1 (bust in double-out mode)
    state.handleDartThrow(20, "single");
    state.finishVisit();

    state = store.getState();
    const visit = state.historyLegs[0].visits[0];
    expect(visit).toBeDefined();
    expect(visit.darts).toHaveLength(1);
    expect(visit.darts[0].isBust).toBe(true);
    expect(visit.darts[0].validatedScore).toBe(0);
    expect(visit.totalScore).toBe(0);
  });

  test("records totalScore as 0 when trying to checkout without double in double-out mode", () => {
    const store = createGameStore();
    let state = store.getState();

    state.setGameSettings({
      startingScore: 20,
      outMode: "double",
      gameMode: "firstTo",
      legsToWin: 1,
      checkoutAssist: false,
    });
    state.setPlayers([{ name: "Alice" }]);
    state.startGame();

    // Throw 20 single to checkout (bust because not a double)
    state.handleDartThrow(20, "single");
    state.finishVisit();

    state = store.getState();
    const visit = state.historyLegs[0].visits[0];
    expect(visit).toBeDefined();
    expect(visit.darts).toHaveLength(1);
    expect(visit.darts[0].isBust).toBe(true);
    expect(visit.darts[0].validatedScore).toBe(0);
    expect(visit.totalScore).toBe(0);
  });
});
