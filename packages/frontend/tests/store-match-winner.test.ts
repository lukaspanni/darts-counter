import { describe, expect, test } from "vitest";
import { startGame } from "./test-helpers";

describe("Match win detection", () => {
  test("first to 1: single leg win ends the match", () => {
    const store = startGame({
      settings: { startingScore: 2, gameMode: "firstTo", targetLegs: 1 },
      players: ["Alice", "Bob"],
    });

    const result = store.getState().handleDartThrow(2, "double");

    expect(result.isLegWin).toBe(true);
    expect(result.isMatchWin).toBe(true);
    expect(result.matchWinner).toBe(1);
  });

  test("first to 3: match is not won until 3rd leg", () => {
    const store = startGame({
      settings: { startingScore: 2, gameMode: "firstTo", targetLegs: 3 },
      players: ["Alice", "Bob"],
    });

    for (let i = 0; i < 2; i++) {
      const result = store.getState().handleDartThrow(2, "double");
      expect(result.isLegWin).toBe(true);
      expect(result.isMatchWin).toBe(false);
      store.getState().startNextLeg();
    }

    const result = store.getState().handleDartThrow(2, "double");
    expect(result.isMatchWin).toBe(true);
    expect(store.getState().players[0]!.legsWon).toBe(3);
  });

  test("best of 3: first leg does not win, second does (majority)", () => {
    const store = startGame({
      settings: { startingScore: 2, gameMode: "bestOf", totalLegs: 3 },
      players: ["Alice", "Bob"],
    });

    const first = store.getState().handleDartThrow(2, "double");
    expect(first.isMatchWin).toBe(false);

    store.getState().startNextLeg();

    const second = store.getState().handleDartThrow(2, "double");
    expect(second.isMatchWin).toBe(true);
    expect(store.getState().players[0]!.legsWon).toBe(2);
  });

  test("best of 7: match won after 4 legs (majority)", () => {
    const store = startGame({
      settings: { startingScore: 2, gameMode: "bestOf", totalLegs: 7 },
      players: ["Alice", "Bob"],
    });

    for (let i = 0; i < 3; i++) {
      store.getState().handleDartThrow(2, "double");
      store.getState().startNextLeg();
    }

    const result = store.getState().handleDartThrow(2, "double");
    expect(result.isMatchWin).toBe(true);
    expect(store.getState().players[0]!.legsWon).toBe(4);
  });

  test("transitions to gameOver phase on match win", () => {
    const store = startGame({
      settings: { startingScore: 2, gameMode: "firstTo", targetLegs: 1 },
      players: ["Alice", "Bob"],
    });

    store.getState().handleDartThrow(2, "double");

    expect(store.getState().gamePhase).toBe("gameOver");
  });
});

describe("Turn alternation", () => {
  test("active player switches after finishing a visit", () => {
    const store = startGame({
      settings: { startingScore: 501 },
      players: ["Alice", "Bob"],
    });

    expect(store.getState().activePlayerId).toBe(1);

    store.getState().handleDartThrow(60, "single");
    store.getState().finishVisit();
    expect(store.getState().activePlayerId).toBe(2);

    store.getState().handleDartThrow(40, "single");
    store.getState().finishVisit();
    expect(store.getState().activePlayerId).toBe(1);
  });

  test("both players' scores update independently across turns", () => {
    const store = startGame({
      settings: { startingScore: 501 },
      players: ["Alice", "Bob"],
    });

    // Alice throws 60
    store.getState().handleDartThrow(60, "single");
    store.getState().finishVisit();

    // Bob throws 40
    store.getState().handleDartThrow(40, "single");
    store.getState().finishVisit();

    const [alice, bob] = store.getState().players;
    expect(alice!.score).toBe(441);
    expect(bob!.score).toBe(461);
  });
});
