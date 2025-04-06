"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Player, GameSettings } from "@/lib/types";

interface GameState {
  players: Player[];
  activePlayerId: number;
  gameSettings: GameSettings;
  currentRound: number;
  currentRoundScores: number[];

  // Actions
  setPlayers: (players: Player[]) => void;
  setGameSettings: (settings: GameSettings) => void;
  setActivePlayer: (playerId: number) => void;
  switchPlayer: () => void;
  updatePlayerScore: (playerId: number, newScore: number) => void;
  incrementRoundsWon: (playerId: number) => void;
  incrementRound: () => void;
  resetCurrentRoundScores: () => void;
  updateCurrentRoundScores: (scores: number[]) => void;
  addDartThrown: (playerId: number, count?: number) => void;
  resetGame: () => void;
}

const initialGameSettings: GameSettings = {
  startingScore: 501,
  outMode: "single",
  roundsToWin: 3,
  checkoutAssist: false,
};

export const useGameStore = create<GameState>()(
  immer((set) => ({
    players: [],
    activePlayerId: 1,
    gameSettings: initialGameSettings,
    currentRound: 1,
    currentRoundScores: [],

    setPlayers: (players) => set({ players }),

    setGameSettings: (settings) => set({ gameSettings: settings }),

    setActivePlayer: (playerId) => set({ activePlayerId: playerId }),

    switchPlayer: () =>
      set((state) => {
        // If there's only one player, don't switch
        if (state.players.length <= 1) return;

        const currentActiveId = state.activePlayerId;
        const otherPlayer = state.players.find((p) => p.id !== currentActiveId);
        if (otherPlayer) {
          state.activePlayerId = otherPlayer.id;
        }
      }),

    updatePlayerScore: (playerId, newScore) =>
      set((state) => {
        const playerIndex = state.players.findIndex((p) => p.id === playerId);
        if (playerIndex !== -1) {
          const oldScore = state.players[playerIndex].score;
          const scoreDifference = oldScore - newScore;

          state.players[playerIndex].score = newScore;

          // Add to total score if this is a valid score (not a reset)
          if (scoreDifference > 0) {
            state.players[playerIndex].totalScore += scoreDifference;
          }
        }
      }),

    incrementRoundsWon: (playerId) =>
      set((state) => {
        const playerIndex = state.players.findIndex((p) => p.id === playerId);
        if (playerIndex !== -1) {
          state.players[playerIndex].roundsWon += 1;
        }
      }),

    incrementRound: () =>
      set((state) => {
        state.currentRound += 1;
      }),

    resetCurrentRoundScores: () => set({ currentRoundScores: [] }),

    updateCurrentRoundScores: (scores) => set({ currentRoundScores: scores }),

    addDartThrown: (playerId, count = 1) =>
      set((state) => {
        const playerIndex = state.players.findIndex((p) => p.id === playerId);
        if (playerIndex !== -1) {
          state.players[playerIndex].dartsThrown += count;
        }
      }),

    resetGame: () =>
      set({
        players: [],
        activePlayerId: 1,
        gameSettings: initialGameSettings,
        currentRound: 1,
        currentRoundScores: [],
      }),
  })),
);
