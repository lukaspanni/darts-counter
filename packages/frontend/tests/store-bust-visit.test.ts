import { describe, expect, test } from "vitest";
import { startGame } from "./test-helpers";

const getFirstVisit = (store: ReturnType<typeof startGame>) => {
  const visit = store.getState().historyLegs[0]?.visits[0];
  if (!visit) throw new Error("Expected a recorded visit in history");
  return visit;
};

describe("Bust visit recording", () => {
  test("bust on first dart records visit total as 0", () => {
    const store = startGame({ settings: { startingScore: 50 } });

    store.getState().handleDartThrow(60, "single");
    store.getState().finishVisit();

    const visit = getFirstVisit(store);
    expect(visit.darts).toHaveLength(1);
    expect(visit.darts[0]!.isBust).toBe(true);
    expect(visit.totalScore).toBe(0);
  });

  test("bust on second dart zeroes the entire visit", () => {
    const store = startGame({ settings: { startingScore: 50 } });

    store.getState().handleDartThrow(20, "single");
    store.getState().handleDartThrow(40, "single"); // 30 remaining, bust
    store.getState().finishVisit();

    const visit = getFirstVisit(store);
    expect(visit.darts).toHaveLength(2);
    expect(visit.darts[0]!.isBust).toBe(false);
    expect(visit.darts[1]!.isBust).toBe(true);
    expect(visit.totalScore).toBe(0);
  });

  test("bust on third dart zeroes the entire visit", () => {
    const store = startGame({ settings: { startingScore: 50 } });

    store.getState().handleDartThrow(20, "single");
    store.getState().handleDartThrow(20, "single");
    store.getState().handleDartThrow(20, "single"); // 10 remaining, bust
    store.getState().finishVisit();

    const visit = getFirstVisit(store);
    expect(visit.darts).toHaveLength(3);
    expect(visit.totalScore).toBe(0);
  });

  test("normal visit records actual total score", () => {
    const store = startGame({ settings: { startingScore: 501 } });

    store.getState().handleDartThrow(60, "single");
    store.getState().handleDartThrow(60, "single");
    store.getState().handleDartThrow(60, "single");
    store.getState().finishVisit();

    const visit = getFirstVisit(store);
    expect(visit.darts).toHaveLength(3);
    expect(visit.totalScore).toBe(180);
  });

  test("bust from leaving 1 in double-out records visit total as 0", () => {
    const store = startGame({ settings: { startingScore: 21 } });

    store.getState().handleDartThrow(20, "single"); // leaves 1, bust in double-out
    store.getState().finishVisit();

    const visit = getFirstVisit(store);
    expect(visit.darts[0]!.isBust).toBe(true);
    expect(visit.totalScore).toBe(0);
  });

  test("bust from reaching 0 without double in double-out records visit total as 0", () => {
    const store = startGame({ settings: { startingScore: 20 } });

    store.getState().handleDartThrow(20, "single"); // reaches 0 but not a double, bust
    store.getState().finishVisit();

    const visit = getFirstVisit(store);
    expect(visit.darts[0]!.isBust).toBe(true);
    expect(visit.totalScore).toBe(0);
  });
});
