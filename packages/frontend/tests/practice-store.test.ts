import { beforeEach, describe, expect, test, vi } from "vitest";

async function loadPracticeStoreModule() {
  vi.resetModules();

  vi.doMock("@/lib/schemas", async () => import("../src/lib/schemas"));
  vi.doMock("@/lib/core/around-the-clock", async () =>
    import("../src/lib/core/around-the-clock")
  );
  vi.doMock("@/lib/core/checkout-practice", async () =>
    import("../src/lib/core/checkout-practice")
  );
  vi.doMock("@/lib/core/checkout", async () => import("../src/lib/core/checkout"));
  vi.doMock("@/lib/core/cricket", async () => import("../src/lib/core/cricket"));
  vi.doMock("@/lib/local-storage", () => ({
    saveToLocalStorage: vi.fn(),
    loadFromLocalStorage: vi.fn(() => ({ ok: true, result: [] })),
  }));

  return import("../src/lib/practice-store");
}

describe("practice store", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
      "550e8400-e29b-41d4-a716-446655440010",
    );
    vi.spyOn(Date, "now").mockReturnValue(1_000);
    vi.spyOn(Date.prototype, "toISOString").mockReturnValue(
      "2026-04-07T12:00:00.000Z",
    );
  });

  test("start actions initialize a playing session with the selected mode", async () => {
    const { createPracticeStore } = await loadPracticeStoreModule();
    const store = createPracticeStore();

    store.getState().startAroundTheClock();
    expect(store.getState().phase).toBe("playing");
    expect(store.getState().sessionStartTime).toBe(1_000);
    expect(store.getState().modeState?.mode).toBe("aroundTheClock");

    store.getState().resetPractice();
    store.getState().startCheckoutPractice([40, 40], "double");
    expect(store.getState().phase).toBe("playing");
    expect(store.getState().sessionStartTime).toBe(1_000);
    expect(store.getState().modeState?.mode).toBe("checkoutPractice");

    store.getState().resetPractice();
    store.getState().startCricket(2);
    expect(store.getState().phase).toBe("playing");
    expect(store.getState().sessionStartTime).toBe(1_000);
    expect(store.getState().modeState?.mode).toBe("cricket");
  });

  test("endSession builds around-the-clock results from the public state", async () => {
    const { createPracticeStore } = await loadPracticeStoreModule();
    const store = createPracticeStore();
    store.getState().setPlayerName("Alice");
    store.getState().startAroundTheClock();
    store.getState().handleDartThrow(1, "single");

    vi.spyOn(Date, "now").mockReturnValue(1_450);
    const session = store.getState().endSession();

    expect(session).toMatchObject({
      id: "550e8400-e29b-41d4-a716-446655440010",
      date: "2026-04-07T12:00:00.000Z",
      playerName: "Alice",
      mode: "aroundTheClock",
      durationMs: 450,
      dartsThrown: 1,
      result: {
        targetReached: 2,
        dartsPerSegment: [1],
        sessionComplete: false,
      },
    });
  });

  test("endSession builds checkout-practice results from the public state", async () => {
    const { createPracticeStore } = await loadPracticeStoreModule();
    const store = createPracticeStore();
    store.getState().setPlayerName("Alice");
    store.getState().startCheckoutPractice([40, 40], "double");
    store.getState().handleDartThrow(40, "double");

    vi.spyOn(Date, "now").mockReturnValue(1_600);
    const session = store.getState().endSession();

    expect(session).toMatchObject({
      playerName: "Alice",
      mode: "checkoutPractice",
      durationMs: 600,
      dartsThrown: 1,
      result: {
        attemptsCompleted: 1,
        attemptsSucceeded: 1,
        successRate: 1,
        outMode: "double",
        scoreRange: [40, 40],
      },
    });
  });

  test("endSession builds cricket results from the public state", async () => {
    const { createPracticeStore } = await loadPracticeStoreModule();
    const store = createPracticeStore();
    store.getState().setPlayerName("Alice");
    store.getState().startCricket(1);

    vi.spyOn(Date, "now").mockReturnValue(1_250);
    const session = store.getState().endSession();

    expect(session).toMatchObject({
      playerName: "Alice",
      mode: "cricket",
      durationMs: 250,
      dartsThrown: 0,
      result: {
        winnerIndex: null,
        playerCount: 1,
      },
    });
    expect((session?.result as { players: unknown[] }).players).toHaveLength(1);
  });
});
