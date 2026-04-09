import { afterEach, describe, expect, test, vi } from "vitest";
import type { GameHistory, PracticeSession } from "../src/lib/schemas";

type HookModule<T> = {
  render: () => T;
  saveToLocalStorage: ReturnType<typeof vi.fn>;
};

async function setupHookModule<T>(
  modulePath: string,
  storageResult: unknown,
): Promise<HookModule<T>> {
  vi.resetModules();

  let stateSlots: unknown[] = [];
  let hookIndex = 0;

  vi.doMock("react", () => ({
    useState: (initialValue: unknown) => {
      const currentIndex = hookIndex++;
      if (!(currentIndex in stateSlots)) {
        stateSlots[currentIndex] = initialValue;
      }

      const setState = (nextValue: unknown) => {
        stateSlots[currentIndex] =
          typeof nextValue === "function"
            ? (nextValue as (current: unknown) => unknown)(stateSlots[currentIndex])
            : nextValue;
      };

      return [stateSlots[currentIndex], setState] as const;
    },
    useEffect: (effect: () => void) => {
      effect();
    },
  }));

  const loadFromLocalStorage = vi.fn().mockReturnValue(storageResult);
  const saveToLocalStorage = vi.fn();

  vi.doMock("@/lib/local-storage", () => ({
    loadFromLocalStorage,
    saveToLocalStorage,
  }));

  vi.doMock("@/lib/schemas", async () => import("../src/lib/schemas"));
  vi.doMock("@/lib/hooks/use-stored-history", async () =>
    import("../src/lib/hooks/use-stored-history")
  );

  const imported = (await import(modulePath)) as Record<string, () => T>;
  const hookName = Object.keys(imported)[0]!;

  return {
    render: () => {
      hookIndex = 0;
      return imported[hookName]!();
    },
    saveToLocalStorage,
  };
}

function createGame(id: string, date: string): GameHistory {
  return {
    id,
    date,
    players: [{ id: 1, name: "Alice", legsWon: 1 }],
    winner: "Alice",
    gameMode: "501 single out",
    legsPlayed: 1,
    settings: {
      startingScore: 501,
      outMode: "single",
      gameMode: "bestOf",
      totalLegs: 1,
      checkoutAssist: false,
    },
    legs: [
      {
        legNumber: 1,
        winnerPlayerId: 1,
        visits: [],
      },
    ],
  };
}

function createPracticeSession(id: string, date: string): PracticeSession {
  return {
    id,
    date,
    playerName: "Alice",
    mode: "cricket",
    durationMs: 123,
    dartsThrown: 3,
    result: {},
  };
}

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});

describe("history hooks", () => {
  test("useGameHistory sorts loaded history and updates storage through the shared hook", async () => {
    const olderGame = createGame(
      "550e8400-e29b-41d4-a716-446655440001",
      "2026-04-06T12:00:00.000Z",
    );
    const newerGame = createGame(
      "550e8400-e29b-41d4-a716-446655440002",
      "2026-04-07T12:00:00.000Z",
    );

    const { render, saveToLocalStorage } = await setupHookModule<{
      gameHistory: GameHistory[];
      addGame: (game: GameHistory) => void;
      removeGame: (id: string) => void;
    }>("../src/lib/hooks/use-game-history", {
      ok: true,
      result: [olderGame, newerGame],
    });

    render();
    const hook = render();
    expect(hook.gameHistory.map((game) => game.id)).toEqual([
      newerGame.id,
      olderGame.id,
    ]);

    const latestGame = createGame(
      "550e8400-e29b-41d4-a716-446655440003",
      "2026-04-08T12:00:00.000Z",
    );
    hook.addGame(latestGame);
    expect(saveToLocalStorage).toHaveBeenLastCalledWith("game-history-v2", [
      olderGame,
      newerGame,
      latestGame,
    ]);

    const rerenderedHook = render();
    rerenderedHook.removeGame(newerGame.id);
    expect(saveToLocalStorage).toHaveBeenLastCalledWith("game-history-v2", [
      olderGame,
      latestGame,
    ]);
  });

  test("useGameHistory resets invalid storage through the shared hook", async () => {
    const { render, saveToLocalStorage } = await setupHookModule<{
      gameHistory: GameHistory[];
    }>("../src/lib/hooks/use-game-history", {
      ok: false,
      error: new Error("Invalid history"),
    });

    render();
    const hook = render();

    expect(hook.gameHistory).toEqual([]);
    expect(saveToLocalStorage).toHaveBeenCalledWith("game-history-v2", []);
  });

  test("usePracticeHistory sorts loaded history and updates storage through the shared hook", async () => {
    const olderSession = createPracticeSession(
      "550e8400-e29b-41d4-a716-446655440011",
      "2026-04-06T12:00:00.000Z",
    );
    const newerSession = createPracticeSession(
      "550e8400-e29b-41d4-a716-446655440012",
      "2026-04-07T12:00:00.000Z",
    );

    const { render, saveToLocalStorage } = await setupHookModule<{
      practiceHistory: PracticeSession[];
      addSession: (session: PracticeSession) => void;
      removeSession: (id: string) => void;
    }>("../src/lib/hooks/use-practice-history", {
      ok: true,
      result: [olderSession, newerSession],
    });

    render();
    const hook = render();
    expect(hook.practiceHistory.map((session) => session.id)).toEqual([
      newerSession.id,
      olderSession.id,
    ]);

    const latestSession = createPracticeSession(
      "550e8400-e29b-41d4-a716-446655440013",
      "2026-04-08T12:00:00.000Z",
    );
    hook.addSession(latestSession);
    expect(saveToLocalStorage).toHaveBeenLastCalledWith(
      "practice-history-v1",
      [olderSession, newerSession, latestSession],
    );

    const rerenderedHook = render();
    rerenderedHook.removeSession(newerSession.id);
    expect(saveToLocalStorage).toHaveBeenLastCalledWith(
      "practice-history-v1",
      [olderSession, latestSession],
    );
  });
});
