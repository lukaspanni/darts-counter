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
import { emitGameEvent, type GameDomainEvent } from "./game-events";
import { createX01Engine } from "./core/x01-match-engine";
import { createPlayers } from "./core/player-init";

function recordVisit(
  state: GameStoreState,
  player: Player,
  darts: VisitDart[],
): void {
  if (darts.length === 0) return;
  const currentLeg = state.historyLegs[state.currentLeg - 1];
  if (!currentLeg) return;
  const hasBust = darts.some((dart) => dart.isBust);
  const totalScore = hasBust
    ? 0
    : darts.reduce((sum, dart) => sum + dart.validatedScore, 0);
  const visitDurationMs = state.visitStartTime
    ? Date.now() - state.visitStartTime
    : undefined;
  currentLeg.visits.push({
    playerId: player.id,
    playerName: player.name,
    legNumber: state.currentLeg,
    darts: [...darts],
    totalScore,
    startedScore: player.score + totalScore,
    endedScore: player.score,
    timestamp: new Date().toISOString(),
    visitDurationMs,
  });
}

function emitGameEvents(events: GameDomainEvent[]): void {
  for (const event of events) {
    emitGameEvent(event);
  }
}

function createLegHistory(legNumber: number): LegHistory {
  return {
    legNumber,
    winnerPlayerId: null,
    visits: [],
  };
}

type GamePhase = "setup" | "preGame" | "playing" | "gameOver";


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
  matchStartTime: number | null;
  visitStartTime: number | null;
  matchPausedAt: number | null;
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
  events: GameDomainEvent[];
};

export type FinishVisitResult = {
  completed: boolean;
  events: GameDomainEvent[];
};

export type StartNextLegResult = {
  started: boolean;
  events: GameDomainEvent[];
};

export type UndoResult = {
  success: boolean;
  lastScore: number;
  newVisitTotal: number;
};

export type GameStoreActions = {
  // Setup
  setPlayers(this: void, players: Partial<Player>[]): void;
  setGameSettings(this: void, settings: GameSettings): void;

  // Pre-game start
  setActivePlayer(this: void, playerId: number): void;

  // Game phase control
  setGamePhase(this: void, phase: GamePhase): void;
  restorePendingGame(this: void, snapshot: PendingGameSnapshot): void;

  // Game play
  startGame(this: void): void;
  finishVisit(this: void): FinishVisitResult;
  startNextLeg(this: void): StartNextLegResult;
  resetGame(this: void): void;

  // Logic
  handleDartThrow(this: void, score: number, modifier: ScoreModifier): DartThrowResult;
  handleUndoThrow(this: void): UndoResult;
};

export type GameStore = GameStoreState & GameStoreActions & GameStoreSelectors;

function getVisitStats(visitDarts: VisitDart[]) {
  const dartsInVisit = visitDarts.length;
  const hasBust = visitDarts.some((dart) => dart.isBust);
  const currentVisitScore = hasBust
    ? 0
    : visitDarts.reduce((sum, dart) => sum + dart.validatedScore, 0);
  const lastThrowBust = visitDarts.at(-1)?.isBust ?? false;

  return {
    dartsInVisit,
    hasBust,
    currentVisitScore,
    lastThrowBust,
  };
}

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
  matchStartTime: null,
  visitStartTime: null,
  matchPausedAt: null,
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
          state.matchStartTime = Date.now();
          state.visitStartTime = Date.now();
        });
      },

      startGame() {
        const now = Date.now();
        set((state) => {
          state.gamePhase = "playing";
          state.matchId = crypto.randomUUID();
          state.currentLeg = 1;
          state.currentVisitScores = [];
          state.currentVisitDarts = [];
          state.historyLegs = [createLegHistory(1)];
          state.matchStartTime = now;
          state.visitStartTime = now;
        });
      },

      finishVisit() {
        const state = get();
        const activePlayer = state.players.find((p) => p.id === state.activePlayerId);
        const { dartsInVisit, hasBust, currentVisitScore } = getVisitStats(
          state.currentVisitDarts,
        );

        if (!activePlayer || dartsInVisit === 0) {
          return { completed: false, events: [] };
        }

        const events: GameDomainEvent[] = [
          {
            type: "visitCompleted",
            playerId: activePlayer.id,
            playerName: activePlayer.name,
            legNumber: state.currentLeg,
            visitScore: currentVisitScore,
            dartsInVisit,
            isBust: hasBust,
          },
        ];

        set((state) => {
          const activePlayer = state.players.find(
            (p) => p.id === state.activePlayerId,
          );
          if (activePlayer) {
            recordVisit(state, activePlayer, state.currentVisitDarts);
          }

          if (state.players.length > 1) {
            const next = state.players.find(
              (p) => p.id !== state.activePlayerId,
            );
            if (next) state.activePlayerId = next.id;
          }
          state.currentVisitScores = [];
          state.currentVisitDarts = [];
          state.visitStartTime = Date.now();
        });

        emitGameEvents(events);

        return {
          completed: true,
          events,
        };
      },

      startNextLeg() {
        const state = get();
        if (state.legWinner === null) {
          return { started: false, events: [] };
        }

        const nextLegNumber = state.currentLeg + 1;

        set((state) => {
          state.players.forEach((p) => {
            p.score = state.gameSettings.startingScore;
            p.scoreHistory.push([]);
          });
          state.currentLeg += 1;
          state.currentVisitScores = [];
          state.currentVisitDarts = [];
          state.historyLegs.push(createLegHistory(state.currentLeg));
          state.legWinner = null;
          const now = Date.now();
          if (state.matchPausedAt && state.matchStartTime) {
            state.matchStartTime += now - state.matchPausedAt;
          }
          state.matchPausedAt = null;
          state.visitStartTime = now;
        });

        const events: GameDomainEvent[] = [
          { type: "legStarted", legNumber: nextLegNumber },
        ];

        emitGameEvents(events);

        return {
          started: true,
          events,
        };
      },

      resetGame() {
        const state = get();
        const events: GameDomainEvent[] = [
          {
            type: "matchReset",
            legNumber: state.currentLeg,
            playerCount: state.players.length,
          },
        ];

        set(initialState);

        emitGameEvents(events);
      },

      handleDartThrow(score, modifier) {
        const state = get();
        const player = state.players.find((p) => p.id === state.activePlayerId);
        if (!player) throw new Error("Active player not found");

        const engine = createX01Engine(state.gameSettings);
        const {
          newScore,
          validatedScore,
          isBust,
          isRoundWin: isLegWin,
          isCheckoutAttempt,
          isDoubleAttempt,
          isMissedDouble,
        } = engine.processThrow(player.score, score, modifier);
        const isMatchWin = isLegWin && engine.isMatchWon(player.legsWon + 1);
        const originalScore = player.score;
        const playerCount = state.players.length;

        const currentLegIndex = state.currentLeg - 1;
        const prevVisitTotal =
          player.scoreHistory[currentLegIndex]?.reduce(
            (sum, s) => sum + s,
            0,
          ) ?? 0;
        const currentVisitTotal = prevVisitTotal + validatedScore;
        const totalScoreAfter = player.totalScore + (originalScore - newScore);
        const dartsThrownAfter = player.dartsThrown + 1;
        const winnerAverage =
          dartsThrownAfter > 0
            ? Number(((totalScoreAfter / dartsThrownAfter) * 3).toFixed(2))
            : 0;

        const events: GameDomainEvent[] = [
          {
            type: "dartThrown",
            playerId: player.id,
            playerName: player.name,
            legNumber: state.currentLeg,
            score,
            modifier,
            validatedScore,
            newScore,
            isBust,
            isLegWin,
            currentVisitTotal,
          },
        ];

        if (currentVisitTotal === engine.maxVisitScore) {
          events.push({
            type: "visitMaxScored",
            playerId: player.id,
            playerName: player.name,
            legNumber: state.currentLeg,
            score: engine.maxVisitScore,
          });
        }

        if (isLegWin) {
          events.push({
            type: "legWon",
            winnerId: player.id,
            winnerName: player.name,
            legNumber: state.currentLeg,
            isMatchWin,
            playerCount,
          });
        }

        if (isMatchWin) {
          events.push({
            type: "matchWon",
            winnerId: player.id,
            winnerName: player.name,
            legNumber: state.currentLeg,
            playerCount,
            winnerAverage,
            legsPlayed: state.currentLeg,
            startingScore: state.gameSettings.startingScore,
            outMode: state.gameSettings.outMode,
          });
        }

        set((state) => {
          const p = state.players.find((x) => x.id === state.activePlayerId);
          if (!p) return;

          const legIdx = state.currentLeg - 1;

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
            recordVisit(state, p, state.currentVisitDarts);
            if (currentLeg) currentLeg.winnerPlayerId = p.id;

            state.currentVisitScores = [];
            state.currentVisitDarts = [];
            p.legsWon += 1;
            state.legWinner = p.id;
            state.visitStartTime = null;
            state.matchPausedAt = Date.now();

            if (isMatchWin) {
              state.matchWinner = p.id;
              state.gamePhase = "gameOver";
            }
          }
        });

        emitGameEvents(events);

        return {
          newScore,
          validatedScore,
          isBust,
          isLegWin,
          isMatchWin,
          matchWinner: isMatchWin ? player.id : null,
          currentVisitTotal,
          events,
        };
      },

      handleUndoThrow() {
        const state = get();
        const player = state.players.find((p) => p.id === state.activePlayerId);
        if (
          !player ||
          state.currentVisitScores.length === 0 ||
          state.legWinner !== null ||
          state.matchWinner !== null
        ) {
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

        emitGameEvent({
          type: "dartUndone",
          playerId: player.id,
          lastScore,
          newVisitTotal: prevTotal,
        });

        return { success: true, lastScore, newVisitTotal: prevTotal };
      },

      // Selectors
      getDartsInVisit() {
        const state = get();
        return getVisitStats(state.currentVisitDarts).dartsInVisit;
      },

      getCurrentVisitScore() {
        const state = get();
        return getVisitStats(state.currentVisitDarts).currentVisitScore;
      },

      getIsBust() {
        const state = get();
        return getVisitStats(state.currentVisitDarts).lastThrowBust;
      },
    })),
  );
};
