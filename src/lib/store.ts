"use client";
import { createStore } from "zustand/vanilla";

import { immer } from "zustand/middleware/immer";
import type { Player, GameSettings } from "@/lib/schemas";

type GamePhase = "setup" | "preGame" | "playing" | "gameOver";

export type GameStoreState = {
  gamePhase: GamePhase;
  players: Player[];
  activePlayerId: number;
  gameSettings: GameSettings;
  currentRound: number;
  currentRoundScores: number[];
  roundWinner: number | null;
  gameWinner: number | null;
};

export type GameStoreActions = {
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

  // Game phase management
  setGamePhase: (phase: GamePhase) => void;
  startGame: () => void;
  finishRound: () => void;
  handleRoundWin: (playerId: number) => void;
  startNextRound: () => void;
  setRoundWinner: (playerId: number | null) => void;
  setGameWinner: (playerId: number | null) => void;
};

export type GameStore = GameStoreState & GameStoreActions;

const initialGameSettings: GameSettings = {
  startingScore: 501,
  outMode: "single",
  roundsToWin: 3,
  checkoutAssist: false,
};

const initialGameStoreState: GameStoreState = {
  gamePhase: "setup",
  players: [],
  activePlayerId: 1,
  gameSettings: initialGameSettings,
  currentRound: 1,
  currentRoundScores: [],
  roundWinner: null,
  gameWinner: null,
};

export const createGameStore = (
  initState: GameStoreState = initialGameStoreState,
) =>
  createStore<GameStore>()(
    immer((set) => ({
      ...initState,

      setPlayers: (players) => set({ players }),
      setGameSettings: (settings) => set({ gameSettings: settings }),
      setActivePlayer: (playerId) => set({ activePlayerId: playerId }),
      switchPlayer: () =>
        set((state) => {
          // If there's only one player, don't switch
          if (state.players.length <= 1) return;

          const currentActiveId = state.activePlayerId;
          const otherPlayer = state.players.find(
            (p) => p.id !== currentActiveId,
          );
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
            state.players[playerIndex].totalScore += scoreDifference;
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
      setGamePhase: (phase) => set({ gamePhase: phase }),
      startGame: () =>
        set((state) => {
          state.gamePhase = "playing";
        }),
      finishRound: () =>
        set((state) => {
          // If there's only one player, don't switch
          if (state.players.length > 1) {
            const currentActiveId = state.activePlayerId;
            const otherPlayer = state.players.find(
              (p) => p.id !== currentActiveId,
            );
            if (otherPlayer) {
              state.activePlayerId = otherPlayer.id;
            }
          }

          state.currentRoundScores = [];
        }),
      handleRoundWin: (playerId) =>
        set((state) => {
          // Increment rounds won
          const playerIndex = state.players.findIndex((p) => p.id === playerId);
          if (playerIndex !== -1) {
            state.players[playerIndex].roundsWon += 1;
          }

          // Set the round winner
          state.roundWinner = playerId;

          // Check if game is over
          const player = state.players.find((p) => p.id === playerId);
          if (player && player.roundsWon >= state.gameSettings.roundsToWin) {
            state.gameWinner = playerId;
            state.gamePhase = "gameOver";
          }
        }),
      startNextRound: () =>
        set((state) => {
          // Reset players' scores to starting score
          state.players.forEach((player, index) => {
            state.players[index].score = state.gameSettings.startingScore;
          });

          // Increment round
          state.currentRound += 1;

          // Reset current round data
          state.currentRoundScores = [];
          state.roundWinner = null;
        }),
      setRoundWinner: (playerId) => set({ roundWinner: playerId }),
      setGameWinner: (playerId) => set({ gameWinner: playerId }),
      resetGame: () =>
        set({
          gamePhase: "setup",
          players: [],
          activePlayerId: 1,
          gameSettings: initialGameSettings,
          currentRound: 1,
          currentRoundScores: [],
          roundWinner: null,
          gameWinner: null,
        }),
    })),
  );
