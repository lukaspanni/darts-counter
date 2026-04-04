import { describe, expect, test } from "vitest";
import { startGame } from "./test-helpers";

describe("Visit tracking during gameplay", () => {
  test("tracks darts thrown in current visit", () => {
    const store = startGame({ settings: { startingScore: 501, outMode: "single" } });

    expect(store.getState().getDartsInVisit()).toBe(0);

    store.getState().handleDartThrow(20, "single");
    expect(store.getState().getDartsInVisit()).toBe(1);

    store.getState().handleDartThrow(20, "single");
    expect(store.getState().getDartsInVisit()).toBe(2);

    store.getState().handleDartThrow(20, "single");
    expect(store.getState().getDartsInVisit()).toBe(3);
  });

  test("resets dart count after finishing visit", () => {
    const store = startGame({ settings: { startingScore: 501, outMode: "single" } });

    store.getState().handleDartThrow(20, "single");
    store.getState().handleDartThrow(20, "single");
    store.getState().handleDartThrow(20, "single");
    store.getState().finishVisit();

    expect(store.getState().getDartsInVisit()).toBe(0);
  });

  test("accumulates visit score across darts", () => {
    const store = startGame({ settings: { startingScore: 501, outMode: "single" } });

    expect(store.getState().getCurrentVisitScore()).toBe(0);

    store.getState().handleDartThrow(20, "single");
    expect(store.getState().getCurrentVisitScore()).toBe(20);

    store.getState().handleDartThrow(60, "triple");
    expect(store.getState().getCurrentVisitScore()).toBe(80);

    store.getState().handleDartThrow(20, "single");
    expect(store.getState().getCurrentVisitScore()).toBe(100);
  });

  test("resets visit score after finishing visit", () => {
    const store = startGame({ settings: { startingScore: 501, outMode: "single" } });

    store.getState().handleDartThrow(20, "single");
    store.getState().finishVisit();

    expect(store.getState().getCurrentVisitScore()).toBe(0);
  });

  test("reports no bust when throw is valid", () => {
    const store = startGame({ settings: { startingScore: 501, outMode: "single" } });

    expect(store.getState().getIsBust()).toBe(false);

    store.getState().handleDartThrow(20, "single");
    expect(store.getState().getIsBust()).toBe(false);
  });

  test("reports bust when throw exceeds remaining score", () => {
    const store = startGame({ settings: { startingScore: 10, outMode: "single" } });

    store.getState().handleDartThrow(20, "single");
    expect(store.getState().getIsBust()).toBe(true);
  });

  test("undo reverts dart count and visit score", () => {
    const store = startGame({ settings: { startingScore: 501, outMode: "single" } });

    store.getState().handleDartThrow(20, "single");
    store.getState().handleDartThrow(60, "triple");

    expect(store.getState().getDartsInVisit()).toBe(2);
    expect(store.getState().getCurrentVisitScore()).toBe(80);

    store.getState().handleUndoThrow();

    expect(store.getState().getDartsInVisit()).toBe(1);
    expect(store.getState().getCurrentVisitScore()).toBe(20);
  });

  test("starting a new leg resets all visit tracking", () => {
    const store = startGame({ settings: { startingScore: 2, gameMode: "bestOf", legsToWin: 3 } });

    store.getState().handleDartThrow(2, "double");
    store.getState().startNextLeg();

    expect(store.getState().getDartsInVisit()).toBe(0);
    expect(store.getState().getCurrentVisitScore()).toBe(0);
    expect(store.getState().getIsBust()).toBe(false);
  });
});
