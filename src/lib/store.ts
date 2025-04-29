"use client";
import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";
import type { Player, GameSettings, ScoreModifier } from "@/lib/schemas";
import { computeDartThrow } from "./core/darts-score";
import { createPlayers } from "./core/player-init";

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

export type DartThrowResult = {
  newScore: number;
  validatedScore: number;
  isRoundWin: boolean;
  isBust: boolean;
  currentRoundTotal: number;
};

export type UndoResult = {
  success: boolean;
  lastScore: number;
  newRoundTotal: number;
};

export type GameStoreActions = {
  // Setup
  setPlayers(players: Partial<Player>[]): void;
  setGameSettings(settings: GameSettings): void;

  // Pre-game start
  setActivePlayer(playerId: number): void;

  // Game phase control
  setGamePhase(phase: GamePhase): void;

  // Game play
  startGame(): void;
  finishRound(): void;
  startNextRound(): void;
  resetGame(): void;

  // Logic
  handleDartThrow(score: number, modifier: ScoreModifier): DartThrowResult;
  handleUndoThrow(): UndoResult;
};

export type GameStore = GameStoreState & GameStoreActions;

const initialSettings: GameSettings = {
  startingScore: 501,
  outMode: "single",
  roundsToWin: 3,
  checkoutAssist: false,
};

const initialState: GameStoreState = {
  gamePhase: "setup",
  players: [],
  activePlayerId: 1,
  gameSettings: initialSettings,
  currentRound: 1,
  currentRoundScores: [],
  roundWinner: null,
  gameWinner: null,
};

export const createGameStore = (initState: GameStoreState = initialState) =>
  createStore<GameStore>()(
    immer((set, get) => ({
      ...initState,

      setPlayers(players) {
        set((state) => {
          state.players = createPlayers(
            players,
            state.gameSettings.startingScore,
          );
          state.activePlayerId = 1;
        });
      },

      setGameSettings(settings) {
        set({ gameSettings: settings });
      },

      setActivePlayer(id) {
        set({ activePlayerId: id });
      },

      setGamePhase(phase) {
        set({ gamePhase: phase });
      },

      startGame() {
        set({ gamePhase: "playing" });
      },

      finishRound() {
        set((state) => {
          if (state.players.length > 1) {
            const next = state.players.find(
              (p) => p.id !== state.activePlayerId,
            );
            if (next) state.activePlayerId = next.id;
          }
          state.currentRoundScores = [];
        });
      },

      startNextRound() {
        set((state) => {
          state.players.forEach((p) => {
            p.score = state.gameSettings.startingScore;
            p.scoreHistory.push([]);
          });
          state.currentRound += 1;
          state.currentRoundScores = [];
          state.roundWinner = null;
        });
      },

      resetGame() {
        set(initialState);
      },

      handleDartThrow(score, modifier) {
        const state = get();
        const player = state.players.find((p) => p.id === state.activePlayerId);
        if (!player) throw new Error("Active player not found");

        const { newScore, validatedScore, isBust, isRoundWin } =
          computeDartThrow(player, score, modifier, state.gameSettings);

        const currentRoundIndex = state.currentRound - 1;
        const prevRoundTotal =
          player.scoreHistory[currentRoundIndex]?.reduce(
            (sum, s) => sum + s,
            0,
          ) ?? 0;

        set((state) => {
          const p = state.players.find((x) => x.id === state.activePlayerId);
          if (!p) return;

          const roundIdx = state.currentRound - 1;
          const originalScore = p.score;

          p.score = newScore;
          p.totalScore += originalScore - newScore;
          p.dartsThrown += 1;
          p.scoreHistory[roundIdx] ??= [];
          p.scoreHistory[roundIdx].push(validatedScore);

          state.currentRoundScores.push(validatedScore);

          if (isRoundWin) {
            p.roundsWon += 1;
            state.roundWinner = p.id;

            if (p.roundsWon >= state.gameSettings.roundsToWin) {
              state.gameWinner = p.id;
              state.gamePhase = "gameOver";
            }
          }
        });

        return {
          newScore,
          validatedScore,
          isBust,
          isRoundWin,
          currentRoundTotal: prevRoundTotal + validatedScore,
        };
      },

      handleUndoThrow() {
        const state = get();
        const player = state.players.find((p) => p.id === state.activePlayerId);
        if (!player || state.currentRoundScores.length === 0) {
          return { success: false, lastScore: 0, newRoundTotal: 0 };
        }

        const lastScore = state.currentRoundScores.at(-1)!;
        const currentRoundIndex = state.currentRound - 1;
        const prevTotal = state.currentRoundScores
          .slice(0, -1)
          .reduce((sum, s) => sum + s, 0);

        set((state) => {
          const p = state.players.find((x) => x.id === state.activePlayerId);
          if (!p) return;

          p.score += lastScore;
          p.totalScore -= lastScore;
          p.dartsThrown -= 1;

          p.scoreHistory[currentRoundIndex]?.pop();
          state.currentRoundScores.pop();
        });

        return { success: true, lastScore, newRoundTotal: prevTotal };
      },
    })),
  );
