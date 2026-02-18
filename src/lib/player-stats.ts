import type { GameHistory } from "./schemas";

export interface PlayerStats {
  name: string;
  matchesPlayed: number;
  matchesWon: number;
  matchWinPercentage: number;
  averageScore: number; // Average per dart
  averagePerVisit: number; // 3-dart average
  firstNineAverage: number;
  highestVisit: number;
  total180s: number;
  oneEightiesPerMatch: number;
  total100PlusVisits: number;
  checkoutAttempts: number;
  checkoutSuccesses: number;
  checkoutPercentage: number;
  averageDartsToFinish: number;
  missedDoublesPerLeg: number;
  legsWon: number;
  legsPlayed: number;
  legWinPercentage: number;
}

export interface PlayerAverageHistory {
  name: string;
  date: string;
  average: number;
  matchNumber: number;
}

function calculatePercentage(
  numerator: number,
  denominator: number,
  precision = 1,
): number {
  if (denominator === 0) {
    return 0;
  }
  return Number(((numerator / denominator) * 100).toFixed(precision));
}

function resolveAveragePerVisit(totalScored: number, totalDarts: number): number {
  if (totalDarts === 0) {
    return 0;
  }
  return (totalScored / totalDarts) * 3;
}

function getThreeDartAverageForGame(
  game: GameHistory,
  playerName: string,
): number | null {
  const visits = game.legs.flatMap((leg) =>
    leg.visits.filter((visit) => visit.playerName === playerName),
  );
  if (visits.length === 0) {
    return null;
  }

  const totalScored = visits.reduce((sum, visit) => sum + visit.totalScore, 0);
  const totalDarts = visits.reduce((sum, visit) => sum + visit.darts.length, 0);

  if (totalDarts === 0) {
    return null;
  }

  return (totalScored / totalDarts) * 3;
}

/**
 * Calculate all-time statistics for each player from game history
 */
export function calculatePlayerStats(
  gameHistory: GameHistory[],
): PlayerStats[] {
  type PlayerAccumulator = {
    name: string;
    matchesPlayed: number;
    matchesWon: number;
    totalScored: number;
    totalDarts: number;
    firstNineScored: number;
    firstNineDarts: number;
    highestVisit: number;
    total180s: number;
    total100PlusVisits: number;
    checkoutAttempts: number;
    checkoutSuccesses: number;
    missedDoubles: number;
    legsWon: number;
    legsPlayed: number;
    dartsToFinishTotal: number;
    finishedLegs: number;
  };

  const playerMap = new Map<string, PlayerAccumulator>();

  const getOrCreateAccumulator = (name: string): PlayerAccumulator => {
    const existing = playerMap.get(name);
    if (existing) {
      return existing;
    }

    const created: PlayerAccumulator = {
      name,
      matchesPlayed: 0,
      matchesWon: 0,
      totalScored: 0,
      totalDarts: 0,
      firstNineScored: 0,
      firstNineDarts: 0,
      highestVisit: 0,
      total180s: 0,
      total100PlusVisits: 0,
      checkoutAttempts: 0,
      checkoutSuccesses: 0,
      missedDoubles: 0,
      legsWon: 0,
      legsPlayed: 0,
      dartsToFinishTotal: 0,
      finishedLegs: 0,
    };
    playerMap.set(name, created);
    return created;
  };

  gameHistory.forEach((game) => {
    game.players.forEach((player) => {
      const stats = getOrCreateAccumulator(player.name);
      stats.matchesPlayed += 1;
      if (game.winner === player.name) {
        stats.matchesWon += 1;
      }
    });

    game.legs.forEach((leg) => {
      const legDartsByPlayer = new Map<string, number>();

      leg.visits.forEach((visit) => {
        const stats = getOrCreateAccumulator(visit.playerName);
        const visitDarts = visit.darts.length;
        const visitScore = visit.totalScore;

        stats.totalScored += visitScore;
        stats.totalDarts += visitDarts;
        stats.highestVisit = Math.max(stats.highestVisit, visitScore);
        if (visitScore === 180) {
          stats.total180s += 1;
        }
        if (visitScore >= 100) {
          stats.total100PlusVisits += 1;
        }

        let dartsThrownInLeg = legDartsByPlayer.get(visit.playerName) ?? 0;
        visit.darts.forEach((dart) => {
          if (dartsThrownInLeg < 9) {
            stats.firstNineScored += dart.validatedScore;
            stats.firstNineDarts += 1;
          }
          dartsThrownInLeg += 1;
          if (dart.isCheckoutAttempt) {
            stats.checkoutAttempts += 1;
          }
          if (dart.isCheckoutSuccess) {
            stats.checkoutSuccesses += 1;
          }
          if (dart.isMissedDouble) {
            stats.missedDoubles += 1;
          }
        });
        legDartsByPlayer.set(visit.playerName, dartsThrownInLeg);
      });

      game.players.forEach((player) => {
        const stats = getOrCreateAccumulator(player.name);
        stats.legsPlayed += 1;
      });

      const legWinnerName = game.players.find(
        (player) => player.id === leg.winnerPlayerId,
      )?.name;
      if (legWinnerName) {
        const winnerStats = getOrCreateAccumulator(legWinnerName);
        winnerStats.legsWon += 1;
        const dartsToFinish = leg.visits
          .filter((visit) => visit.playerName === legWinnerName)
          .reduce((sum, visit) => sum + visit.darts.length, 0);
        if (dartsToFinish > 0) {
          winnerStats.dartsToFinishTotal += dartsToFinish;
          winnerStats.finishedLegs += 1;
        }
      }
    });
  });

  const stats: PlayerStats[] = Array.from(playerMap.values()).map((player) => {
    const averagePerVisit = resolveAveragePerVisit(
      player.totalScored,
      player.totalDarts,
    );
    const averagePerDart = averagePerVisit / 3;

    return {
      name: player.name,
      matchesPlayed: player.matchesPlayed,
      matchesWon: player.matchesWon,
      matchWinPercentage: calculatePercentage(
        player.matchesWon,
        player.matchesPlayed,
      ),
      averageScore: Number(averagePerDart.toFixed(2)),
      averagePerVisit: Number(averagePerVisit.toFixed(2)),
      firstNineAverage:
        player.firstNineDarts > 0
          ? Number(
              ((player.firstNineScored / player.firstNineDarts) * 3).toFixed(2),
            )
          : 0,
      highestVisit: player.highestVisit,
      total180s: player.total180s,
      oneEightiesPerMatch:
        player.matchesPlayed > 0
          ? Number((player.total180s / player.matchesPlayed).toFixed(2))
          : 0,
      total100PlusVisits: player.total100PlusVisits,
      checkoutAttempts: player.checkoutAttempts,
      checkoutSuccesses: player.checkoutSuccesses,
      checkoutPercentage: calculatePercentage(
        player.checkoutSuccesses,
        player.checkoutAttempts,
      ),
      averageDartsToFinish:
        player.finishedLegs > 0
          ? Number((player.dartsToFinishTotal / player.finishedLegs).toFixed(2))
          : 0,
      missedDoublesPerLeg:
        player.legsPlayed > 0
          ? Number((player.missedDoubles / player.legsPlayed).toFixed(2))
          : 0,
      legsWon: player.legsWon,
      legsPlayed: player.legsPlayed,
      legWinPercentage: calculatePercentage(player.legsWon, player.legsPlayed),
    };
  });

  return stats.sort((a, b) => b.matchesPlayed - a.matchesPlayed);
}

/**
 * Calculate average history over time for graphing
 */
export function calculatePlayerAverageHistory(
  gameHistory: GameHistory[],
  playerName?: string,
): PlayerAverageHistory[] {
  const sortedGames = [...gameHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const playerAverages = new Map<string, number[]>();
  const result: PlayerAverageHistory[] = [];

  sortedGames.forEach((game, gameIndex) => {
    game.players.forEach((player) => {
      if (playerName && player.name !== playerName) {
        return;
      }

      const matchAverage = getThreeDartAverageForGame(game, player.name);
      if (matchAverage === null) {
        return;
      }

      const averages = playerAverages.get(player.name) ?? [];
      averages.push(matchAverage);
      playerAverages.set(player.name, averages);

      const sum = averages.reduce((acc, val) => acc + val, 0);
      const runningAverage = sum / averages.length;

      result.push({
        name: player.name,
        date: game.date,
        average: Number(runningAverage.toFixed(2)),
        matchNumber: gameIndex + 1,
      });
    });
  });

  return result;
}
