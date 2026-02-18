import { describe, expect, test } from "vitest";
import { createGameStore } from "../src/lib/store";

describe("createGameStore handleDartThrow", () => {
  test("marks a winning checkout as match-winning in deciding leg", () => {
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

    const result = store.getState().handleDartThrow(2, "double");

    expect(result.isLegWin).toBe(true);
    expect(result.isMatchWin).toBe(true);
    expect(result.matchWinner).toBe(1);
  });

  test("does not mark non-deciding leg checkout as match-winning", () => {
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

    const result = store.getState().handleDartThrow(2, "double");

    expect(result.isLegWin).toBe(true);
    expect(result.isMatchWin).toBe(false);
    expect(result.matchWinner).toBeNull();
  });
});
