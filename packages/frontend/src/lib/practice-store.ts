"use client";
import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";
import type { ScoreModifier, PracticeSession } from "@/lib/schemas";
import {
  createInitialATCState,
  processATCThrow,
  type AroundTheClockState,
} from "@/lib/core/around-the-clock";
import {
  createInitialCheckoutState,
  processCheckoutThrow,
  type CheckoutPracticeState,
  type OutMode,
} from "@/lib/core/checkout-practice";
import {
  createInitialCricketState,
  processCricketThrow,
  advanceToNextVisit,
  type CricketState,
} from "@/lib/core/cricket";
import { saveToLocalStorage, loadFromLocalStorage } from "@/lib/local-storage";
import { practiceHistorySchema, type PracticeHistory } from "@/lib/schemas";

const PRACTICE_HISTORY_KEY = "practice-history-v1";

type PracticePhase = "setup" | "playing" | "sessionComplete";

type PracticeModeState =
  | ({ mode: "aroundTheClock" } & AroundTheClockState)
  | ({ mode: "checkoutPractice" } & CheckoutPracticeState)
  | ({ mode: "cricket" } & CricketState);

export type PracticeStoreState = {
  phase: PracticePhase;
  playerName: string;
  sessionStartTime: number | null;
  modeState: PracticeModeState | null;
};

export type PracticeStoreActions = {
  setPlayerName(this: void, name: string): void;
  startAroundTheClock(this: void): void;
  startCheckoutPractice(
    this: void,
    scoreRange: [number, number],
    outMode: OutMode,
  ): void;
  startCricket(this: void, playerCount: 1 | 2): void;
  handleDartThrow(this: void, score: number, modifier: ScoreModifier): void;
  finishVisit(this: void): void;
  endSession(this: void): PracticeSession | null;
  resetPractice(this: void): void;
};

export type PracticeStore = PracticeStoreState & PracticeStoreActions;

const initialState: PracticeStoreState = {
  phase: "setup",
  playerName: "",
  sessionStartTime: null,
  modeState: null,
};

export const createPracticeStore = () =>
  createStore<PracticeStore>()(
    immer((set, get) => ({
      ...initialState,

      setPlayerName(name) {
        set((state) => {
          state.playerName = name;
        });
      },

      startAroundTheClock() {
        set((state) => {
          state.phase = "playing";
          state.sessionStartTime = Date.now();
          const atcState = createInitialATCState();
          state.modeState = { ...atcState, mode: "aroundTheClock" };
        });
      },

      startCheckoutPractice(scoreRange, outMode) {
        set((state) => {
          state.phase = "playing";
          state.sessionStartTime = Date.now();
          const cpState = createInitialCheckoutState(scoreRange, outMode);
          state.modeState = { ...cpState, mode: "checkoutPractice" };
        });
      },

      startCricket(playerCount) {
        set((state) => {
          state.phase = "playing";
          state.sessionStartTime = Date.now();
          const cricketState = createInitialCricketState(playerCount);
          state.modeState = { ...cricketState, mode: "cricket" };
        });
      },

      handleDartThrow(score, modifier) {
        set((state) => {
          if (!state.modeState || state.phase !== "playing") return;

          if (state.modeState.mode === "aroundTheClock") {
            const next = processATCThrow(state.modeState, score, modifier);
            state.modeState = { ...next, mode: "aroundTheClock" };
            if (next.sessionComplete) {
              state.phase = "sessionComplete";
            }
          } else if (state.modeState.mode === "checkoutPractice") {
            const next = processCheckoutThrow(state.modeState, score, modifier);
            state.modeState = { ...next, mode: "checkoutPractice" };
          } else if (state.modeState.mode === "cricket") {
            const next = processCricketThrow(state.modeState, score, modifier);
            state.modeState = { ...next, mode: "cricket" };
            if (next.gameComplete) {
              state.phase = "sessionComplete";
            }
          }
        });
      },

      finishVisit() {
        set((state) => {
          if (state.modeState?.mode !== "cricket") return;
          const next = advanceToNextVisit(state.modeState);
          state.modeState = { ...next, mode: "cricket" };
        });
      },

      endSession() {
        const state = get();
        if (!state.modeState || !state.sessionStartTime) return null;

        const durationMs = Date.now() - state.sessionStartTime;
        let dartsThrown = 0;
        let result: Record<string, unknown> = {};

        if (state.modeState.mode === "aroundTheClock") {
          dartsThrown = state.modeState.totalDarts;
          result = {
            targetReached: state.modeState.currentTarget,
            dartsPerSegment: state.modeState.dartsPerSegment,
            sessionComplete: state.modeState.sessionComplete,
          };
        } else if (state.modeState.mode === "checkoutPractice") {
          dartsThrown = state.modeState.totalDartsUsed;
          result = {
            attemptsCompleted: state.modeState.attemptsCompleted,
            attemptsSucceeded: state.modeState.attemptsSucceeded,
            successRate:
              state.modeState.attemptsCompleted > 0
                ? state.modeState.attemptsSucceeded /
                  state.modeState.attemptsCompleted
                : 0,
            outMode: state.modeState.outMode,
            scoreRange: state.modeState.scoreRange,
          };
        } else if (state.modeState.mode === "cricket") {
          dartsThrown = state.modeState.totalDarts;
          result = {
            winnerIndex: state.modeState.winnerIndex,
            players: state.modeState.players,
            playerCount: state.modeState.players.length,
          };
        }

        const session: PracticeSession = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          playerName: state.playerName,
          mode: state.modeState.mode,
          durationMs,
          dartsThrown,
          result,
        };

        // Save to local storage
        const { ok, result: existing } = loadFromLocalStorage(
          PRACTICE_HISTORY_KEY,
          practiceHistorySchema,
        );
        const history: PracticeHistory = ok ? existing : [];
        saveToLocalStorage(PRACTICE_HISTORY_KEY, [...history, session]);

        set((state) => {
          state.phase = "sessionComplete";
        });

        return session;
      },

      resetPractice() {
        set(() => ({ ...initialState }));
      },
    })),
  );
