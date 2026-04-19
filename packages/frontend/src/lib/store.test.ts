import { describe, expect, it } from "vitest";
import { createGameStore } from "./store";

describe("createGameStore", () => {
  it("records a completed visit and rotates the active player", () => {
    const store = createGameStore();

    store.getState().setPlayers([{ name: "Alice" }, { name: "Bob" }]);
    store.getState().startGame();
    store.getState().handleDartThrow(60, "triple");

    const result = store.getState().finishVisit();
    const state = store.getState();

    expect(result.completed).toBe(true);
    expect(state.activePlayerId).toBe(2);
    expect(state.currentVisitScores).toEqual([]);
    expect(state.currentVisitDarts).toEqual([]);
    expect(state.historyLegs[0]?.visits).toHaveLength(1);
    expect(state.historyLegs[0]?.visits[0]).toMatchObject({
      playerName: "Alice",
      totalScore: 60,
      endedScore: 441,
    });
  });

  it("completes the leg and match on a winning checkout", () => {
    const store = createGameStore();

    store.getState().setGameSettings({
      startingScore: 40,
      outMode: "double",
      gameMode: "firstTo",
      targetLegs: 1,
      checkoutAssist: false,
    });
    store.getState().setPlayers([{ name: "Alice" }]);
    store.getState().startGame();

    const result = store.getState().handleDartThrow(40, "double");
    const state = store.getState();

    expect(result.isLegWin).toBe(true);
    expect(result.isMatchWin).toBe(true);
    expect(state.legWinner).toBe(1);
    expect(state.matchWinner).toBe(1);
    expect(state.gamePhase).toBe("gameOver");
    expect(state.players[0]).toMatchObject({
      score: 0,
      legsWon: 1,
      dartsThrown: 1,
      totalScore: 40,
    });
    expect(state.historyLegs[0]).toMatchObject({ winnerPlayerId: 1 });
    expect(state.historyLegs[0]?.visits).toHaveLength(1);
  });

  it("starts the next leg after a non-match-winning checkout", () => {
    const store = createGameStore();

    store.getState().setGameSettings({
      startingScore: 40,
      outMode: "double",
      gameMode: "firstTo",
      targetLegs: 2,
      checkoutAssist: false,
    });
    store.getState().setPlayers([{ name: "Alice" }]);
    store.getState().startGame();
    store.getState().handleDartThrow(40, "double");

    const result = store.getState().startNextLeg();
    const state = store.getState();

    expect(result.started).toBe(true);
    expect(state.currentLeg).toBe(2);
    expect(state.legWinner).toBeNull();
    expect(state.matchWinner).toBeNull();
    expect(state.players[0]?.score).toBe(40);
    expect(state.players[0]?.scoreHistory).toEqual([[40], []]);
    expect(state.historyLegs.map((leg) => leg.legNumber)).toEqual([1, 2]);
  });
});
