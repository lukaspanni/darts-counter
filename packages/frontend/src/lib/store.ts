"use client";
import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";
import type {
  Player,
  GameSettings,
  ScoreModifier,
  LegHistory,
  VisitDart,
  PendingGameSnapshot,
} from "@/lib/schemas";
import { computeDartThrow } from "./core/darts-score";
import { createPlayers } from "./core/player-init";

/**
 * Calculate required legs to win based on game mode and legsToWin setting.
 * 
 * IMPORTANT: The semantics of `legsToWin` differ based on `gameMode`:
 * 
 * - **firstTo mode**: `legsToWin` is the target number of legs to win the match
 *   Example: firstTo 3 means "first player to win 3 legs wins the match"
 * 
 * - **bestOf mode**: `legsToWin` is the total number of legs in the match
 *   Example: bestOf 7 means "best of 7 legs" = first to win 4 legs wins the match
 *   Formula: Math.ceil(legsToWin / 2)
 * 
 * @param settings Game settings containing gameMode and legsToWin
 * @returns The number of legs a player needs to win to win the match
 */
function calculateRequiredLegsToWin(settings: GameSettings): number {
  if (settings.gameMode === "firstTo") {
    // In firstTo mode, legsToWin directly specifies the target
    return settings.legsToWin;
  }
  // In bestOf mode, legsToWin is the total legs, so we calculate the majority needed to win
  // e.g., best of 7 means first to 4, best of 5 means first to 3, best of 3 means first to 2
  return Math.ceil(settings.legsToWin / 2);
}

type GamePhase = "setup" | "preGame" | "playing" | "gameOver";

function isDoubleCheckoutScore(score: number): boolean {
  return score === 50 || (score > 0 && score <= 40 && score % 2 === 0);
}

export type GameStoreState = {
  gamePhase: GamePhase;
  players: Player[];
  matchId: string | null;
  activePlayerId: number;
  gameSettings: GameSettings;
  currentLeg: number;
  currentVisitScores: number[];
  currentVisitDarts: VisitDart[];
  historyLegs: LegHistory[];
  legWinner: number | null;
  matchWinner: number | null;
};

export type GameStoreSelectors = {
  // Derived visit stats
  getDartsInVisit(): number;
  getCurrentVisitScore(): number;
  getIsBust(): boolean;
};

export type DartThrowResult = {
  newScore: number;
  validatedScore: number;
  isLegWin: boolean;
  isMatchWin: boolean;
  matchWinner: number | null;
  isBust: boolean;
  currentVisitTotal: number;
};

export type UndoResult = {
  success: boolean;
  lastScore: number;
  newVisitTotal: number;
};

export type GameStoreActions = {
  // Setup
  setPlayers(players: Partial<Player>[]): void;
  setGameSettings(settings: GameSettings): void;

  // Pre-game start
  setActivePlayer(playerId: number): void;

  // Game phase control
  setGamePhase(phase: GamePhase): void;
  restorePendingGame(snapshot: PendingGameSnapshot): void;

  // Game play
  startGame(): void;
  finishVisit(): void;
  startNextLeg(): void;
  resetGame(): void;

  // Logic
  handleDartThrow(score: number, modifier: ScoreModifier): DartThrowResult;
  handleUndoThrow(): UndoResult;
};

export type GameStore = GameStoreState & GameStoreActions & GameStoreSelectors;

const initialSettings: GameSettings = {
  startingScore: 501,
  outMode: "single",
  gameMode: "bestOf",
  legsToWin: 3,
  checkoutAssist: false,
};

const initialState: GameStoreState = {
  gamePhase: "setup",
  players: [],
  matchId: null,
  activePlayerId: 1,
  gameSettings: initialSettings,
  currentLeg: 1,
  currentVisitScores: [],
  currentVisitDarts: [],
  historyLegs: [],
  legWinner: null,
  matchWinner: null,
};

export const createGameStore = (initState: GameStoreState = initialState) => {
  const resolvedState = {
    ...initialState,
    ...initState,
  };
  return createStore<GameStore>()(
    immer((set, get) => ({
      ...resolvedState,

      setPlayers(players) {
        set((state) => {
          // Guard: Only support 1-2 players
          if (players.length < 1 || players.length > 2) {
            console.warn(`Invalid player count in setPlayers: ${players.length}. Must be 1-2 players.`);
          }
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

      restorePendingGame(snapshot) {
        set((state) => {
          // Guard: Validate player count in restored game
          if (snapshot.players.length < 1 || snapshot.players.length > 2) {
            console.warn(`Invalid player count in restored game: ${snapshot.players.length}. Clamping to 1-2 players.`);
            snapshot.players = snapshot.players.slice(0, 2);
            if (snapshot.players.length === 0) {
              // Cannot restore a game with no players
              console.error("Cannot restore game with no players");
              return;
            }
          }
          state.matchId = snapshot.matchId;
          state.players = snapshot.players;
          state.activePlayerId = snapshot.activePlayerId;
          state.gameSettings = snapshot.gameSettings;
          state.currentLeg = snapshot.currentLeg;
          state.currentVisitScores = snapshot.currentVisitScores;
          state.currentVisitDarts = snapshot.currentVisitDarts;
          state.historyLegs = snapshot.historyLegs;
          state.legWinner = null;
          state.matchWinner = null;
          state.gamePhase = "playing";
        });
      },

      startGame() {
        set((state) => {
          state.gamePhase = "playing";
          state.matchId = crypto.randomUUID();
          state.currentLeg = 1;
          state.currentVisitScores = [];
          state.currentVisitDarts = [];
          state.historyLegs = [
            {
              legNumber: 1,
              winnerPlayerId: null,
              visits: [],
            },
          ];
        });
      },

      finishVisit() {
        set((state) => {
          const activePlayer = state.players.find(
            (p) => p.id === state.activePlayerId,
          );
          if (activePlayer && state.currentVisitDarts.length > 0) {
            const currentLeg = state.historyLegs[state.currentLeg - 1];
            const hasBust = state.currentVisitDarts.some((dart) => dart.isBust);
            const totalScore = hasBust
              ? 0
              : state.currentVisitDarts.reduce(
                  (sum, dart) => sum + dart.validatedScore,
                  0,
                );
            currentLeg?.visits.push({
              playerId: activePlayer.id,
              playerName: activePlayer.name,
              legNumber: state.currentLeg,
              darts: [...state.currentVisitDarts],
              totalScore,
              startedScore: activePlayer.score + totalScore,
              endedScore: activePlayer.score,
              timestamp: new Date().toISOString(),
            });
          }

          if (state.players.length > 1) {
            const next = state.players.find(
              (p) => p.id !== state.activePlayerId,
            );
            if (next) state.activePlayerId = next.id;
          }
          state.currentVisitScores = [];
          state.currentVisitDarts = [];
        });
      },

      startNextLeg() {
        set((state) => {
          state.players.forEach((p) => {
            p.score = state.gameSettings.startingScore;
            p.scoreHistory.push([]);
          });
          state.currentLeg += 1;
          state.currentVisitScores = [];
          state.currentVisitDarts = [];
          state.historyLegs.push({
            legNumber: state.currentLeg,
            winnerPlayerId: null,
            visits: [],
          });
          state.legWinner = null;
        });
      },

      resetGame() {
        set(initialState);
      },

      handleDartThrow(score, modifier) {
        const state = get();
        const player = state.players.find((p) => p.id === state.activePlayerId);
        if (!player) throw new Error("Active player not found");

        const { newScore, validatedScore, isBust, isLegWin } = computeDartThrow(
          player,
          score,
          modifier,
          state.gameSettings,
        );
        const isCheckoutAttempt =
          player.score <= 170 &&
          player.score > 0 &&
          (state.gameSettings.outMode === "single" || player.score !== 1);
        const isDoubleAttempt =
          modifier === "double" && isDoubleCheckoutScore(player.score);
        const isMissedDouble = isDoubleAttempt && !isLegWin;
        const requiredLegs = calculateRequiredLegsToWin(state.gameSettings);
        const totalLegsAfterWin = player.legsWon + 1;
        const isMatchWin = isLegWin && totalLegsAfterWin >= requiredLegs;

        const currentLegIndex = state.currentLeg - 1;
        const prevVisitTotal =
          player.scoreHistory[currentLegIndex]?.reduce(
            (sum, s) => sum + s,
            0,
          ) ?? 0;

        set((state) => {
          const p = state.players.find((x) => x.id === state.activePlayerId);
          if (!p) return;

          const legIdx = state.currentLeg - 1;
          const originalScore = p.score;

          p.score = newScore;
          p.totalScore += originalScore - newScore;
          p.dartsThrown += 1;
          p.scoreHistory[legIdx] ??= [];
          p.scoreHistory[legIdx].push(validatedScore);
          state.currentVisitDarts.push({
            score,
            modifier,
            validatedScore,
            isBust,
            isCheckoutAttempt,
            isCheckoutSuccess: isLegWin,
            isDoubleAttempt,
            isMissedDouble,
          });

          state.currentVisitScores.push(validatedScore);

          if (isLegWin) {
            const currentLeg = state.historyLegs[state.currentLeg - 1];
            const totalScore = state.currentVisitDarts.reduce(
              (sum, dart) => sum + dart.validatedScore,
              0,
            );
            currentLeg?.visits.push({
              playerId: p.id,
              playerName: p.name,
              legNumber: state.currentLeg,
              darts: [...state.currentVisitDarts],
              totalScore,
              startedScore: p.score + totalScore,
              endedScore: p.score,
              timestamp: new Date().toISOString(),
            });
            if (currentLeg) {
              currentLeg.winnerPlayerId = p.id;
            }

            state.currentVisitScores = [];
            state.currentVisitDarts = [];
            p.legsWon += 1;
            state.legWinner = p.id;

            if (isMatchWin) {
              state.matchWinner = p.id;
              state.gamePhase = "gameOver";
            }
          }
        });

        return {
          newScore,
          validatedScore,
          isBust,
          isLegWin,
          isMatchWin,
          matchWinner: isMatchWin ? player.id : null,
          currentVisitTotal: prevVisitTotal + validatedScore,
        };
      },

      handleUndoThrow() {
        const state = get();
        const player = state.players.find((p) => p.id === state.activePlayerId);
        if (!player || state.currentVisitScores.length === 0) {
          return { success: false, lastScore: 0, newVisitTotal: 0 };
        }

        const lastScore = state.currentVisitScores.at(-1)!;
        const currentLegIndex = state.currentLeg - 1;
        const prevTotal = state.currentVisitScores
          .slice(0, -1)
          .reduce((sum, s) => sum + s, 0);

        set((state) => {
          const p = state.players.find((x) => x.id === state.activePlayerId);
          if (!p) return;

          p.score += lastScore;
          p.totalScore -= lastScore;
          p.dartsThrown -= 1;

          p.scoreHistory[currentLegIndex]?.pop();
          state.currentVisitScores.pop();
          state.currentVisitDarts.pop();
        });

        return { success: true, lastScore, newVisitTotal: prevTotal };
      },

      // Selectors
      getDartsInVisit() {
        const state = get();
        return state.currentVisitDarts.length;
      },

      getCurrentVisitScore() {
        const state = get();
        return state.currentVisitScores.reduce((sum, score) => sum + score, 0);
      },

      getIsBust() {
        const state = get();
        if (state.currentVisitDarts.length === 0) return false;
        const lastDart = state.currentVisitDarts[state.currentVisitDarts.length - 1];
        return lastDart?.isBust ?? false;
      },
    })),
  );
};
