import { describe, expect, test } from "vitest";
import { startGame } from "./test-helpers";

describe("Undo behavior", () => {
  test("blocks undo after a leg win", () => {
    const store = startGame({
      settings: { startingScore: 2, gameMode: "bestOf", totalLegs: 3 },
      players: ["Alice", "Bob"],
    });

    const throwResult = store.getState().handleDartThrow(2, "double");
    expect(throwResult.isLegWin).toBe(true);
    expect(throwResult.isMatchWin).toBe(false);

    const undoResult = store.getState().handleUndoThrow();
    expect(undoResult.success).toBe(false);

    // Leg win should still stand
    expect(store.getState().players[0]!.legsWon).toBe(1);
  });

  test("blocks undo after a match win", () => {
    const store = startGame({
      settings: { startingScore: 2, gameMode: "firstTo", targetLegs: 1 },
      players: ["Alice", "Bob"],
    });

    const throwResult = store.getState().handleDartThrow(2, "double");
    expect(throwResult.isMatchWin).toBe(true);

    const undoResult = store.getState().handleUndoThrow();
    expect(undoResult.success).toBe(false);

    expect(store.getState().players[0]!.legsWon).toBe(1);
    expect(store.getState().gamePhase).toBe("gameOver");
  });

  test("allows undo of a single dart before any win", () => {
    const store = startGame({
      settings: { startingScore: 501 },
      players: ["Alice", "Bob"],
    });

    store.getState().handleDartThrow(20, "single");
    expect(store.getState().players[0]!.score).toBe(481);

    const undoResult = store.getState().handleUndoThrow();
    expect(undoResult.success).toBe(true);
    expect(undoResult.lastScore).toBe(20);
    expect(store.getState().players[0]!.score).toBe(501);
  });

  test("allows undo mid-visit without affecting earlier darts", () => {
    const store = startGame({
      settings: { startingScore: 501 },
      players: ["Alice", "Bob"],
    });

    store.getState().handleDartThrow(60, "triple");
    store.getState().handleDartThrow(60, "triple");
    expect(store.getState().players[0]!.score).toBe(381);

    store.getState().handleUndoThrow();
    expect(store.getState().players[0]!.score).toBe(441);
    expect(store.getState().getDartsInVisit()).toBe(1);
  });
});
