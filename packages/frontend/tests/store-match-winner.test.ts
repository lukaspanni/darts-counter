import { describe, expect, test } from "vitest";
import { createGameStore } from "../src/lib/store";

describe("createGameStore handleDartThrow", () => {
  describe("firstTo mode", () => {
    test("marks a winning checkout as match-winning in deciding leg (firstTo 1)", () => {
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

    test("firstTo 3: wins on 3rd leg", () => {
      const store = createGameStore();
      const state = store.getState();

      state.setGameSettings({
        startingScore: 2,
        outMode: "double",
        gameMode: "firstTo",
        legsToWin: 3,
        checkoutAssist: false,
      });
      state.setPlayers([{ name: "Alice" }, { name: "Bob" }]);
      state.startGame();

      // Win first leg
      let result = store.getState().handleDartThrow(2, "double");
      expect(result.isLegWin).toBe(true);
      expect(result.isMatchWin).toBe(false);
      expect(store.getState().players[0]!.legsWon).toBe(1);

      // Start next leg
      state.startNextLeg();

      // Win second leg
      result = store.getState().handleDartThrow(2, "double");
      expect(result.isLegWin).toBe(true);
      expect(result.isMatchWin).toBe(false);
      expect(store.getState().players[0]!.legsWon).toBe(2);

      // Start next leg
      state.startNextLeg();

      // Win third leg - should be match win
      result = store.getState().handleDartThrow(2, "double");
      expect(result.isLegWin).toBe(true);
      expect(result.isMatchWin).toBe(true);
      expect(result.matchWinner).toBe(1);
      expect(store.getState().players[0]!.legsWon).toBe(3);
    });

    test("firstTo 5: wins on 5th leg", () => {
      const store = createGameStore();
      const state = store.getState();

      state.setGameSettings({
        startingScore: 2,
        outMode: "double",
        gameMode: "firstTo",
        legsToWin: 5,
        checkoutAssist: false,
      });
      state.setPlayers([{ name: "Alice" }, { name: "Bob" }]);
      state.startGame();

      // Win 4 legs
      for (let i = 0; i < 4; i++) {
        const result = store.getState().handleDartThrow(2, "double");
        expect(result.isLegWin).toBe(true);
        expect(result.isMatchWin).toBe(false);
        state.startNextLeg();
      }

      // Win 5th leg - should be match win
      const result = store.getState().handleDartThrow(2, "double");
      expect(result.isLegWin).toBe(true);
      expect(result.isMatchWin).toBe(true);
      expect(result.matchWinner).toBe(1);
      expect(store.getState().players[0]!.legsWon).toBe(5);
    });
  });

  describe("bestOf mode", () => {
    test("bestOf 3 (first to 2): does not mark first leg as match-winning", () => {
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

    test("bestOf 3 (first to 2): wins on 2nd leg", () => {
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

      // Win first leg
      let result = store.getState().handleDartThrow(2, "double");
      expect(result.isLegWin).toBe(true);
      expect(result.isMatchWin).toBe(false);
      expect(store.getState().players[0]!.legsWon).toBe(1);

      // Start next leg
      state.startNextLeg();

      // Win second leg - should be match win (2 out of 3)
      result = store.getState().handleDartThrow(2, "double");
      expect(result.isLegWin).toBe(true);
      expect(result.isMatchWin).toBe(true);
      expect(result.matchWinner).toBe(1);
      expect(store.getState().players[0]!.legsWon).toBe(2);
    });

    test("bestOf 5 (first to 3): wins on 3rd leg", () => {
      const store = createGameStore();
      const state = store.getState();

      state.setGameSettings({
        startingScore: 2,
        outMode: "double",
        gameMode: "bestOf",
        legsToWin: 5,
        checkoutAssist: false,
      });
      state.setPlayers([{ name: "Alice" }, { name: "Bob" }]);
      state.startGame();

      // Win 2 legs
      for (let i = 0; i < 2; i++) {
        const result = store.getState().handleDartThrow(2, "double");
        expect(result.isLegWin).toBe(true);
        expect(result.isMatchWin).toBe(false);
        state.startNextLeg();
      }

      // Win 3rd leg - should be match win (3 out of 5)
      const result = store.getState().handleDartThrow(2, "double");
      expect(result.isLegWin).toBe(true);
      expect(result.isMatchWin).toBe(true);
      expect(result.matchWinner).toBe(1);
      expect(store.getState().players[0]!.legsWon).toBe(3);
    });

    test("bestOf 7 (first to 4): wins on 4th leg", () => {
      const store = createGameStore();
      const state = store.getState();

      state.setGameSettings({
        startingScore: 2,
        outMode: "double",
        gameMode: "bestOf",
        legsToWin: 7,
        checkoutAssist: false,
      });
      state.setPlayers([{ name: "Alice" }, { name: "Bob" }]);
      state.startGame();

      // Win 3 legs
      for (let i = 0; i < 3; i++) {
        const result = store.getState().handleDartThrow(2, "double");
        expect(result.isLegWin).toBe(true);
        expect(result.isMatchWin).toBe(false);
        state.startNextLeg();
      }

      // Win 4th leg - should be match win (4 out of 7)
      const result = store.getState().handleDartThrow(2, "double");
      expect(result.isLegWin).toBe(true);
      expect(result.isMatchWin).toBe(true);
      expect(result.matchWinner).toBe(1);
      expect(store.getState().players[0]!.legsWon).toBe(4);
    });

    test("bestOf 9 (first to 5): wins on 5th leg", () => {
      const store = createGameStore();
      const state = store.getState();

      state.setGameSettings({
        startingScore: 2,
        outMode: "double",
        gameMode: "bestOf",
        legsToWin: 9,
        checkoutAssist: false,
      });
      state.setPlayers([{ name: "Alice" }, { name: "Bob" }]);
      state.startGame();

      // Win 4 legs
      for (let i = 0; i < 4; i++) {
        const result = store.getState().handleDartThrow(2, "double");
        expect(result.isLegWin).toBe(true);
        expect(result.isMatchWin).toBe(false);
        state.startNextLeg();
      }

      // Win 5th leg - should be match win (5 out of 9)
      const result = store.getState().handleDartThrow(2, "double");
      expect(result.isLegWin).toBe(true);
      expect(result.isMatchWin).toBe(true);
      expect(result.matchWinner).toBe(1);
      expect(store.getState().players[0]!.legsWon).toBe(5);
    });
  });
});
