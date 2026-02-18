import { describe, expect, test } from "vitest";
import { createGameStore } from "../src/lib/store";
import { createPlayers } from "../src/lib/core/player-init";

describe("Player count validation", () => {
  describe("createPlayers", () => {
    test("accepts 1 player", () => {
      const players = createPlayers([{ name: "Alice" }], 501);
      expect(players).toHaveLength(1);
      expect(players[0]!.name).toBe("Alice");
      expect(players[0]!.id).toBe(1);
    });

    test("accepts 2 players", () => {
      const players = createPlayers(
        [{ name: "Alice" }, { name: "Bob" }],
        501,
      );
      expect(players).toHaveLength(2);
      expect(players[0]!.name).toBe("Alice");
      expect(players[1]!.name).toBe("Bob");
    });

    test("clamps more than 2 players to 2", () => {
      const players = createPlayers(
        [
          { name: "Alice" },
          { name: "Bob" },
          { name: "Charlie" },
          { name: "Dave" },
        ],
        501,
      );
      expect(players).toHaveLength(2);
      expect(players[0]!.name).toBe("Alice");
      expect(players[1]!.name).toBe("Bob");
    });

    test("handles empty array by creating 1 default player", () => {
      const players = createPlayers([], 501);
      expect(players).toHaveLength(1);
      expect(players[0]!.name).toBe("Player 1");
    });
  });

  describe("store setPlayers", () => {
    test("sets 1 player correctly", () => {
      const store = createGameStore();
      const state = store.getState();

      state.setPlayers([{ name: "Alice" }]);

      const players = store.getState().players;
      expect(players).toHaveLength(1);
      expect(players[0]!.name).toBe("Alice");
    });

    test("sets 2 players correctly", () => {
      const store = createGameStore();
      const state = store.getState();

      state.setPlayers([{ name: "Alice" }, { name: "Bob" }]);

      const players = store.getState().players;
      expect(players).toHaveLength(2);
      expect(players[0]!.name).toBe("Alice");
      expect(players[1]!.name).toBe("Bob");
    });

    test("clamps more than 2 players to 2", () => {
      const store = createGameStore();
      const state = store.getState();

      state.setPlayers([
        { name: "Alice" },
        { name: "Bob" },
        { name: "Charlie" },
      ]);

      const players = store.getState().players;
      expect(players).toHaveLength(2);
      expect(players[0]!.name).toBe("Alice");
      expect(players[1]!.name).toBe("Bob");
    });

    test("handles empty array by creating 1 default player", () => {
      const store = createGameStore();
      const state = store.getState();

      state.setPlayers([]);

      const players = store.getState().players;
      expect(players).toHaveLength(1);
      expect(players[0]!.name).toBe("Player 1");
    });
  });

  describe("store restorePendingGame", () => {
    test("restores game with 1 player", () => {
      const store = createGameStore();
      const state = store.getState();

      state.restorePendingGame({
        matchId: "test-match",
        date: new Date().toISOString(),
        players: [
          {
            id: 1,
            name: "Alice",
            score: 301,
            legsWon: 0,
            dartsThrown: 6,
            totalScore: 200,
            scoreHistory: [[60, 60, 60], [20]],
          },
        ],
        activePlayerId: 1,
        gameSettings: {
          startingScore: 501,
          outMode: "double",
          gameMode: "bestOf",
          legsToWin: 3,
          checkoutAssist: false,
        },
        currentLeg: 1,
        currentVisitScores: [],
        currentVisitDarts: [],
        historyLegs: [],
      });

      const restoredState = store.getState();
      expect(restoredState.players).toHaveLength(1);
      expect(restoredState.players[0]!.name).toBe("Alice");
      expect(restoredState.gamePhase).toBe("playing");
    });

    test("restores game with 2 players", () => {
      const store = createGameStore();
      const state = store.getState();

      state.restorePendingGame({
        matchId: "test-match",
        date: new Date().toISOString(),
        players: [
          {
            id: 1,
            name: "Alice",
            score: 301,
            legsWon: 0,
            dartsThrown: 3,
            totalScore: 200,
            scoreHistory: [[60, 60, 60]],
          },
          {
            id: 2,
            name: "Bob",
            score: 401,
            legsWon: 0,
            dartsThrown: 3,
            totalScore: 100,
            scoreHistory: [[40, 40, 20]],
          },
        ],
        activePlayerId: 1,
        gameSettings: {
          startingScore: 501,
          outMode: "double",
          gameMode: "bestOf",
          legsToWin: 3,
          checkoutAssist: false,
        },
        currentLeg: 1,
        currentVisitScores: [],
        currentVisitDarts: [],
        historyLegs: [],
      });

      const restoredState = store.getState();
      expect(restoredState.players).toHaveLength(2);
      expect(restoredState.players[0]!.name).toBe("Alice");
      expect(restoredState.players[1]!.name).toBe("Bob");
    });

    test("clamps more than 2 players to 2 when restoring", () => {
      const store = createGameStore();
      const state = store.getState();

      state.restorePendingGame({
        matchId: "test-match",
        date: new Date().toISOString(),
        players: [
          {
            id: 1,
            name: "Alice",
            score: 301,
            legsWon: 0,
            dartsThrown: 3,
            totalScore: 200,
            scoreHistory: [[60, 60, 60]],
          },
          {
            id: 2,
            name: "Bob",
            score: 401,
            legsWon: 0,
            dartsThrown: 3,
            totalScore: 100,
            scoreHistory: [[40, 40, 20]],
          },
          {
            id: 3,
            name: "Charlie",
            score: 501,
            legsWon: 0,
            dartsThrown: 0,
            totalScore: 0,
            scoreHistory: [[]],
          },
        ],
        activePlayerId: 1,
        gameSettings: {
          startingScore: 501,
          outMode: "double",
          gameMode: "bestOf",
          legsToWin: 3,
          checkoutAssist: false,
        },
        currentLeg: 1,
        currentVisitScores: [],
        currentVisitDarts: [],
        historyLegs: [],
      });

      const restoredState = store.getState();
      expect(restoredState.players).toHaveLength(2);
      expect(restoredState.players[0]!.name).toBe("Alice");
      expect(restoredState.players[1]!.name).toBe("Bob");
    });

    test("does not restore game with 0 players", () => {
      const store = createGameStore();
      const state = store.getState();

      const initialPhase = store.getState().gamePhase;

      state.restorePendingGame({
        matchId: "test-match",
        date: new Date().toISOString(),
        players: [],
        activePlayerId: 1,
        gameSettings: {
          startingScore: 501,
          outMode: "double",
          gameMode: "bestOf",
          legsToWin: 3,
          checkoutAssist: false,
        },
        currentLeg: 1,
        currentVisitScores: [],
        currentVisitDarts: [],
        historyLegs: [],
      });

      const restoredState = store.getState();
      // Game phase should not change when restoration fails
      expect(restoredState.gamePhase).toBe(initialPhase);
      expect(restoredState.players).toHaveLength(0);
    });
  });
});
