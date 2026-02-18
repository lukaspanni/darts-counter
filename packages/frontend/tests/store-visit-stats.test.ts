import { describe, expect, test } from "vitest";
import { createGameStore } from "../src/lib/store";

describe("Store visit stats selectors", () => {
  test("getDartsInVisit returns correct count", () => {
    const store = createGameStore();
    const state = store.getState();

    state.setGameSettings({
      startingScore: 501,
      outMode: "single",
      gameMode: "firstTo",
      legsToWin: 1,
      checkoutAssist: false,
    });
    state.setPlayers([{ name: "Alice" }]);
    state.startGame();

    // Initially no darts thrown
    expect(store.getState().getDartsInVisit()).toBe(0);

    // Throw first dart
    store.getState().handleDartThrow(20, "single");
    expect(store.getState().getDartsInVisit()).toBe(1);

    // Throw second dart
    store.getState().handleDartThrow(20, "single");
    expect(store.getState().getDartsInVisit()).toBe(2);

    // Throw third dart
    store.getState().handleDartThrow(20, "single");
    expect(store.getState().getDartsInVisit()).toBe(3);

    // After finishing visit, darts reset
    store.getState().finishVisit();
    expect(store.getState().getDartsInVisit()).toBe(0);
  });

  test("getCurrentVisitScore returns correct total", () => {
    const store = createGameStore();
    const state = store.getState();

    state.setGameSettings({
      startingScore: 501,
      outMode: "single",
      gameMode: "firstTo",
      legsToWin: 1,
      checkoutAssist: false,
    });
    state.setPlayers([{ name: "Alice" }]);
    state.startGame();

    // Initially no score
    expect(store.getState().getCurrentVisitScore()).toBe(0);

    // Throw first dart (20)
    store.getState().handleDartThrow(20, "single");
    expect(store.getState().getCurrentVisitScore()).toBe(20);

    // Throw second dart (triple 20 = 60)
    store.getState().handleDartThrow(60, "triple");
    expect(store.getState().getCurrentVisitScore()).toBe(80);

    // Throw third dart (20)
    store.getState().handleDartThrow(20, "single");
    expect(store.getState().getCurrentVisitScore()).toBe(100);

    // After finishing visit, score resets
    store.getState().finishVisit();
    expect(store.getState().getCurrentVisitScore()).toBe(0);
  });

  test("getIsBust returns false when no bust", () => {
    const store = createGameStore();
    const state = store.getState();

    state.setGameSettings({
      startingScore: 501,
      outMode: "single",
      gameMode: "firstTo",
      legsToWin: 1,
      checkoutAssist: false,
    });
    state.setPlayers([{ name: "Alice" }]);
    state.startGame();

    // Initially no bust
    expect(store.getState().getIsBust()).toBe(false);

    // Throw a normal dart (no bust)
    store.getState().handleDartThrow(20, "single");
    expect(store.getState().getIsBust()).toBe(false);
  });

  test("getIsBust returns true when bust occurs", () => {
    const store = createGameStore();
    const state = store.getState();

    state.setGameSettings({
      startingScore: 10,
      outMode: "single",
      gameMode: "firstTo",
      legsToWin: 1,
      checkoutAssist: false,
    });
    state.setPlayers([{ name: "Alice" }]);
    state.startGame();

    // Throw a dart that causes bust (score goes below 0)
    const result = store.getState().handleDartThrow(20, "single");
    expect(result.isBust).toBe(true);
    expect(store.getState().getIsBust()).toBe(true);
  });

  test("visit stats reset after undo", () => {
    const store = createGameStore();
    const state = store.getState();

    state.setGameSettings({
      startingScore: 501,
      outMode: "single",
      gameMode: "firstTo",
      legsToWin: 1,
      checkoutAssist: false,
    });
    state.setPlayers([{ name: "Alice" }]);
    state.startGame();

    // Throw two darts
    store.getState().handleDartThrow(20, "single");
    store.getState().handleDartThrow(60, "triple");
    
    expect(store.getState().getDartsInVisit()).toBe(2);
    expect(store.getState().getCurrentVisitScore()).toBe(80);

    // Undo last dart
    store.getState().handleUndoThrow();
    
    expect(store.getState().getDartsInVisit()).toBe(1);
    expect(store.getState().getCurrentVisitScore()).toBe(20);
  });

  test("visit stats reset on new leg", () => {
    const store = createGameStore();
    const state = store.getState();

    state.setGameSettings({
      startingScore: 2,
      outMode: "double",
      gameMode: "bestOf",
      legsToWin: 3,
      checkoutAssist: false,
    });
    state.setPlayers([{ name: "Alice" }]);
    state.startGame();

    // Win the first leg
    store.getState().handleDartThrow(2, "double");
    
    // Start next leg
    store.getState().startNextLeg();
    
    // Visit stats should be reset
    expect(store.getState().getDartsInVisit()).toBe(0);
    expect(store.getState().getCurrentVisitScore()).toBe(0);
    expect(store.getState().getIsBust()).toBe(false);
  });
});
