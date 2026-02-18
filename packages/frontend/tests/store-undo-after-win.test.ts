import { describe, expect, test } from "vitest";
import { createGameStore } from "../src/lib/store";

describe("handleUndoThrow after win", () => {
  test("prevents undo after leg win", () => {
    const store = createGameStore();
    const state = store.getState();

    state.setGameSettings({
      startingScore: 2,
      outMode: "double",
      gameMode: "bestOf",
      legsToWin: 3,
      checkoutAssist: false,
    });
    state.setPlayers([{ name: "Alice" }, { name: "Bob" }]);
    state.startGame();

    // Alice wins the leg with a double 1
    const result = store.getState().handleDartThrow(2, "double");
    expect(result.isLegWin).toBe(true);
    expect(result.isMatchWin).toBe(false);

    // Store should have legWinner set
    expect(store.getState().legWinner).toBe(1);
    expect(store.getState().matchWinner).toBeNull();

    // Try to undo - should fail
    const undoResult = store.getState().handleUndoThrow();
    expect(undoResult.success).toBe(false);

    // State should remain unchanged
    expect(store.getState().legWinner).toBe(1);
    const alice = store.getState().players.find((p) => p.id === 1);
    expect(alice?.legsWon).toBe(1);
  });

  test("prevents undo after match win", () => {
    const store = createGameStore();
    const state = store.getState();

    state.setGameSettings({
      startingScore: 2,
      outMode: "double",
      gameMode: "firstTo",
      legsToWin: 1,
      checkoutAssist: false,
    });
    state.setPlayers([{ name: "Alice" }, { name: "Bob" }]);
    state.startGame();

    // Alice wins the match with a double 1
    const result = store.getState().handleDartThrow(2, "double");
    expect(result.isLegWin).toBe(true);
    expect(result.isMatchWin).toBe(true);

    // Store should have both legWinner and matchWinner set
    expect(store.getState().legWinner).toBe(1);
    expect(store.getState().matchWinner).toBe(1);

    // Try to undo - should fail
    const undoResult = store.getState().handleUndoThrow();
    expect(undoResult.success).toBe(false);

    // State should remain unchanged
    expect(store.getState().legWinner).toBe(1);
    expect(store.getState().matchWinner).toBe(1);
    const alice = store.getState().players.find((p) => p.id === 1);
    expect(alice?.legsWon).toBe(1);
  });

  test("allows undo before any win", () => {
    const store = createGameStore();
    const state = store.getState();

    state.setGameSettings({
      startingScore: 501,
      outMode: "double",
      gameMode: "bestOf",
      legsToWin: 3,
      checkoutAssist: false,
    });
    state.setPlayers([{ name: "Alice" }, { name: "Bob" }]);
    state.startGame();

    // Alice throws a 20
    store.getState().handleDartThrow(20, "single");
    const alice = store.getState().players.find((p) => p.id === 1);
    expect(alice?.score).toBe(481);
    expect(store.getState().currentVisitScores.length).toBe(1);

    // Undo should work
    const undoResult = store.getState().handleUndoThrow();
    expect(undoResult.success).toBe(true);
    expect(undoResult.lastScore).toBe(20);

    // State should be reverted
    const aliceAfterUndo = store.getState().players.find((p) => p.id === 1);
    expect(aliceAfterUndo?.score).toBe(501);
    expect(store.getState().currentVisitScores.length).toBe(0);
  });

  test("allows undo during a visit that hasn't won yet", () => {
    const store = createGameStore();
    const state = store.getState();

    state.setGameSettings({
      startingScore: 501,
      outMode: "double",
      gameMode: "bestOf",
      legsToWin: 3,
      checkoutAssist: false,
    });
    state.setPlayers([{ name: "Alice" }, { name: "Bob" }]);
    state.startGame();

    // Alice throws triple 20, triple 20
    store.getState().handleDartThrow(60, "triple");
    store.getState().handleDartThrow(60, "triple");
    const alice = store.getState().players.find((p) => p.id === 1);
    expect(alice?.score).toBe(501 - 120);

    // Undo should work
    const undoResult = store.getState().handleUndoThrow();
    expect(undoResult.success).toBe(true);
    expect(undoResult.lastScore).toBe(60);

    // State should be reverted
    const aliceAfterUndo = store.getState().players.find((p) => p.id === 1);
    expect(aliceAfterUndo?.score).toBe(501 - 60);
    expect(store.getState().currentVisitScores.length).toBe(1);
  });
});
