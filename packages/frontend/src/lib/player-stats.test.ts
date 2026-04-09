import { describe, expect, it } from "vitest";
import {
  calculatePlayerAverageHistory,
  calculatePlayerStats,
} from "./player-stats";
import type { GameHistory, VisitHistory, VisitDart } from "./schemas";

function createDarts(scores: number[]): VisitDart[] {
  return scores.map((score, index) => ({
    score,
    modifier: "single",
    validatedScore: score,
    isBust: false,
    isCheckoutAttempt: index === scores.length - 1,
    isCheckoutSuccess: index === scores.length - 1,
    isDoubleAttempt: false,
    isMissedDouble: false,
  }));
}

function createVisit(
  playerId: number,
  playerName: string,
  legNumber: number,
  scores: number[],
  visitDurationMs?: number,
): VisitHistory {
  const totalScore = scores.reduce((sum, score) => sum + score, 0);

  return {
    playerId,
    playerName,
    legNumber,
    darts: createDarts(scores),
    totalScore,
    startedScore: 501,
    endedScore: 501 - totalScore,
    timestamp: new Date("2026-01-01T12:00:00.000Z").toISOString(),
    visitDurationMs,
  };
}

function createGame(
  id: string,
  date: string,
  winner: string,
  legs: GameHistory["legs"],
): GameHistory {
  return {
    id,
    date,
    players: [
      { id: 1, name: "Alice", legsWon: winner === "Alice" ? 1 : 0 },
      { id: 2, name: "Bob", legsWon: winner === "Bob" ? 1 : 0 },
    ],
    winner,
    gameMode: "bestOf",
    legsPlayed: legs.length,
    settings: {
      startingScore: 501,
      outMode: "double",
      gameMode: "bestOf",
      legsToWin: 3,
      checkoutAssist: false,
    },
    legs,
  };
}

describe("player stats", () => {
  it("calculates all-time player stats from leg and visit history", () => {
    const gameHistory: GameHistory[] = [
      createGame(
        "11111111-1111-4111-8111-111111111111",
        "2026-01-01T12:00:00.000Z",
        "Alice",
        [
          {
            legNumber: 1,
            winnerPlayerId: 1,
            visits: [
              createVisit(1, "Alice", 1, [20, 20, 20], 1000),
              createVisit(2, "Bob", 1, [15, 15, 15], 1500),
              createVisit(1, "Alice", 1, [20, 20], 2000),
            ],
          },
        ],
      ),
    ];

    const stats = calculatePlayerStats(gameHistory);
    const alice = stats.find((player) => player.name === "Alice");
    const bob = stats.find((player) => player.name === "Bob");

    expect(alice).toMatchObject({
      matchesPlayed: 1,
      matchesWon: 1,
      averageScore: 20,
      averagePerVisit: 60,
      highestVisit: 60,
      checkoutAttempts: 2,
      checkoutSuccesses: 2,
      averageDartsToFinish: 5,
      legsWon: 1,
      legsPlayed: 1,
      averageVisitTimeMs: 1500,
    });
    expect(bob).toMatchObject({
      matchesPlayed: 1,
      matchesWon: 0,
      averagePerVisit: 45,
      legsWon: 0,
      legsPlayed: 1,
      averageVisitTimeMs: 1500,
    });
  });

  it("builds running three-dart averages per player over time", () => {
    const gameHistory: GameHistory[] = [
      createGame(
        "11111111-1111-4111-8111-111111111111",
        "2026-01-01T12:00:00.000Z",
        "Alice",
        [
          {
            legNumber: 1,
            winnerPlayerId: 1,
            visits: [createVisit(1, "Alice", 1, [20, 20, 20])],
          },
        ],
      ),
      createGame(
        "22222222-2222-4222-8222-222222222222",
        "2026-01-02T12:00:00.000Z",
        "Alice",
        [
          {
            legNumber: 1,
            winnerPlayerId: 1,
            visits: [createVisit(1, "Alice", 1, [30, 30, 30])],
          },
        ],
      ),
    ];

    expect(calculatePlayerAverageHistory(gameHistory, "Alice")).toEqual([
      {
        name: "Alice",
        date: "2026-01-01T12:00:00.000Z",
        average: 60,
        matchNumber: 1,
      },
      {
        name: "Alice",
        date: "2026-01-02T12:00:00.000Z",
        average: 75,
        matchNumber: 2,
      },
    ]);
  });
});
