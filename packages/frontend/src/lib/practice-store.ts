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

function startSession<TState extends PracticeModeState>(
  state: PracticeStoreState,
  modeState: TState,
): void {
  state.phase = "playing";
  state.sessionStartTime = Date.now();
  state.modeState = modeState;
}

function buildPracticeResult(modeState: PracticeModeState): {
  dartsThrown: number;
  result: Record<string, unknown>;
} {
  if (modeState.mode === "aroundTheClock") {
    return {
      dartsThrown: modeState.totalDarts,
      result: {
        targetReached: modeState.currentTarget,
        dartsPerSegment: modeState.dartsPerSegment,
        sessionComplete: modeState.sessionComplete,
      },
    };
  }

  if (modeState.mode === "checkoutPractice") {
    return {
      dartsThrown: modeState.totalDartsUsed,
      result: {
        attemptsCompleted: modeState.attemptsCompleted,
        attemptsSucceeded: modeState.attemptsSucceeded,
        successRate:
          modeState.attemptsCompleted > 0
            ? modeState.attemptsSucceeded / modeState.attemptsCompleted
            : 0,
        outMode: modeState.outMode,
        scoreRange: modeState.scoreRange,
      },
    };
  }

  return {
    dartsThrown: modeState.totalDarts,
    result: {
      winnerIndex: modeState.winnerIndex,
      players: modeState.players,
      playerCount: modeState.players.length,
    },
  };
}

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
          const atcState = createInitialATCState();
          startSession(state, { ...atcState, mode: "aroundTheClock" });
        });
      },

      startCheckoutPractice(scoreRange, outMode) {
        set((state) => {
          const cpState = createInitialCheckoutState(scoreRange, outMode);
          startSession(state, { ...cpState, mode: "checkoutPractice" });
        });
      },

      startCricket(playerCount) {
        set((state) => {
          const cricketState = createInitialCricketState(playerCount);
          startSession(state, { ...cricketState, mode: "cricket" });
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
        const { dartsThrown, result } = buildPracticeResult(state.modeState);

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
