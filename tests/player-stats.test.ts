import { describe, expect, test } from "vitest";
import {
  calculatePlayerAverageHistory,
  calculatePlayerStats,
} from "../src/lib/player-stats";
import type { GameHistory, VisitDart } from "../src/lib/schemas";

function createDart(
  validatedScore: number,
  overrides?: Partial<VisitDart>,
): VisitDart {
  return {
    score: validatedScore,
    modifier: "single",
    validatedScore,
    isBust: false,
    isCheckoutAttempt: false,
    isCheckoutSuccess: false,
    isDoubleAttempt: false,
    isMissedDouble: false,
    ...overrides,
  };
}

const gameHistoryFixture: GameHistory[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    date: "2026-02-01T10:00:00.000Z",
    players: [
      { id: 1, name: "Alice", legsWon: 2 },
      { id: 2, name: "Bob", legsWon: 1 },
    ],
    winner: "Alice",
    gameMode: "501 double out",
    legsPlayed: 3,
    settings: {
      startingScore: 501,
      outMode: "double",
      gameMode: "bestOf",
      legsToWin: 3,
      checkoutAssist: false,
    },
    legs: [
      {
        legNumber: 1,
        winnerPlayerId: 1,
        visits: [
          {
            playerId: 1,
            playerName: "Alice",
            legNumber: 1,
            darts: [createDart(60), createDart(60), createDart(60)],
            totalScore: 180,
            startedScore: 501,
            endedScore: 321,
            timestamp: "2026-02-01T10:01:00.000Z",
          },
          {
            playerId: 1,
            playerName: "Alice",
            legNumber: 1,
            darts: [
              createDart(20, {
                modifier: "double",
                isCheckoutAttempt: true,
                isCheckoutSuccess: true,
                isDoubleAttempt: true,
              }),
            ],
            totalScore: 20,
            startedScore: 20,
            endedScore: 0,
            timestamp: "2026-02-01T10:02:00.000Z",
          },
          {
            playerId: 2,
            playerName: "Bob",
            legNumber: 1,
            darts: [createDart(20), createDart(20), createDart(20)],
            totalScore: 60,
            startedScore: 501,
            endedScore: 441,
            timestamp: "2026-02-01T10:01:30.000Z",
          },
        ],
      },
      {
        legNumber: 2,
        winnerPlayerId: 2,
        visits: [
          {
            playerId: 2,
            playerName: "Bob",
            legNumber: 2,
            darts: [createDart(60), createDart(40), createDart(40)],
            totalScore: 140,
            startedScore: 501,
            endedScore: 361,
            timestamp: "2026-02-01T10:05:00.000Z",
          },
          {
            playerId: 2,
            playerName: "Bob",
            legNumber: 2,
            darts: [
              createDart(20, {
                modifier: "double",
                isCheckoutAttempt: true,
                isCheckoutSuccess: true,
                isDoubleAttempt: true,
              }),
            ],
            totalScore: 20,
            startedScore: 20,
            endedScore: 0,
            timestamp: "2026-02-01T10:06:00.000Z",
          },
        ],
      },
      {
        legNumber: 3,
        winnerPlayerId: 1,
        visits: [
          {
            playerId: 1,
            playerName: "Alice",
            legNumber: 3,
            darts: [
              createDart(20, {
                modifier: "double",
                isCheckoutAttempt: true,
                isDoubleAttempt: true,
                isMissedDouble: true,
              }),
              createDart(20, {
                modifier: "double",
                isCheckoutAttempt: true,
                isDoubleAttempt: true,
                isMissedDouble: true,
              }),
              createDart(20, {
                modifier: "double",
                isCheckoutAttempt: true,
                isCheckoutSuccess: true,
                isDoubleAttempt: true,
              }),
            ],
            totalScore: 60,
            startedScore: 60,
            endedScore: 0,
            timestamp: "2026-02-01T10:10:00.000Z",
          },
        ],
      },
    ],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    date: "2026-02-02T10:00:00.000Z",
    players: [
      { id: 1, name: "Alice", legsWon: 0 },
      { id: 2, name: "Bob", legsWon: 2 },
    ],
    winner: "Bob",
    gameMode: "501 double out",
    legsPlayed: 2,
    settings: {
      startingScore: 501,
      outMode: "double",
      gameMode: "bestOf",
      legsToWin: 3,
      checkoutAssist: false,
    },
    legs: [
      {
        legNumber: 1,
        winnerPlayerId: 2,
        visits: [
          {
            playerId: 2,
            playerName: "Bob",
            legNumber: 1,
            darts: [createDart(60), createDart(60), createDart(60)],
            totalScore: 180,
            startedScore: 501,
            endedScore: 321,
            timestamp: "2026-02-02T10:01:00.000Z",
          },
        ],
      },
      {
        legNumber: 2,
        winnerPlayerId: 2,
        visits: [
          {
            playerId: 2,
            playerName: "Bob",
            legNumber: 2,
            darts: [
              createDart(16, {
                modifier: "double",
                isCheckoutAttempt: true,
                isCheckoutSuccess: true,
                isDoubleAttempt: true,
              }),
            ],
            totalScore: 16,
            startedScore: 16,
            endedScore: 0,
            timestamp: "2026-02-02T10:06:00.000Z",
          },
        ],
      },
    ],
  },
];

describe("calculatePlayerStats", () => {
  test("computes advanced match and checkout metrics from visit history", () => {
    const stats = calculatePlayerStats(gameHistoryFixture);
    const alice = stats.find((player) => player.name === "Alice");
    const bob = stats.find((player) => player.name === "Bob");

    expect(alice).toBeDefined();
    expect(alice?.matchesPlayed).toBe(2);
    expect(alice?.matchesWon).toBe(1);
    expect(alice?.matchWinPercentage).toBe(50);
    expect(alice?.total180s).toBe(1);
    expect(alice?.checkoutAttempts).toBe(4);
    expect(alice?.checkoutSuccesses).toBe(2);
    expect(alice?.checkoutPercentage).toBe(50);
    expect(alice?.missedDoublesPerLeg).toBe(0.4);
    expect(alice?.legsWon).toBe(2);
    expect(alice?.legsPlayed).toBe(5);
    expect(alice?.legWinPercentage).toBe(40);
    expect(alice?.averageDartsToFinish).toBe(3.5);

    expect(bob).toBeDefined();
    expect(bob?.matchesPlayed).toBe(2);
    expect(bob?.matchesWon).toBe(1);
    expect(bob?.total180s).toBe(1);
    expect(bob?.checkoutAttempts).toBe(2);
    expect(bob?.checkoutSuccesses).toBe(2);
    expect(bob?.checkoutPercentage).toBe(100);
    expect(bob?.averageDartsToFinish).toBe(2.67);
  });
});

describe("calculatePlayerAverageHistory", () => {
  test("returns running 3-dart average history per player", () => {
    const history = calculatePlayerAverageHistory(gameHistoryFixture, "Bob");

    expect(history).toHaveLength(2);
    expect(history[0]).toMatchObject({
      name: "Bob",
      average: 94.29,
      matchNumber: 1,
    });
    expect(history[1]).toMatchObject({
      name: "Bob",
      average: 120.64,
      matchNumber: 2,
    });
  });
});
