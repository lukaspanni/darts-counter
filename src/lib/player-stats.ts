import type { GameHistory, VisitHistory } from "./schemas";

const DARTS_PER_VISIT = 3;

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

function createPlayerAccumulator(name: string): PlayerAccumulator {
  return {
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
}

function getOrCreateAccumulator(
  playerMap: Map<string, PlayerAccumulator>,
  name: string,
): PlayerAccumulator {
  const existing = playerMap.get(name);
  if (existing) {
    return existing;
  }
  const created = createPlayerAccumulator(name);
  playerMap.set(name, created);
  return created;
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

function safeDivideAndRound(
  numerator: number,
  denominator: number,
  precision = 2,
  multiplier = 1,
): number {
  if (denominator <= 0) {
    return 0;
  }
  return Number(((numerator / denominator) * multiplier).toFixed(precision));
}

function resolveAveragePerVisit(totalScored: number, totalDarts: number): number {
  if (totalDarts === 0) {
    return 0;
  }
  return (totalScored / totalDarts) * DARTS_PER_VISIT;
}

function applyMatchResult(
  stats: PlayerAccumulator,
  didWinMatch: boolean,
): PlayerAccumulator {
  return {
    ...stats,
    matchesPlayed: stats.matchesPlayed + 1,
    matchesWon: didWinMatch ? stats.matchesWon + 1 : stats.matchesWon,
  };
}

function applyVisitToStats(
  stats: PlayerAccumulator,
  visit: VisitHistory,
  dartsThrownInLeg: number,
): { nextStats: PlayerAccumulator; nextDartsThrownInLeg: number } {
  let nextDartsThrownInLeg = dartsThrownInLeg;
  let firstNineScored = stats.firstNineScored;
  let firstNineDarts = stats.firstNineDarts;
  let checkoutAttempts = stats.checkoutAttempts;
  let checkoutSuccesses = stats.checkoutSuccesses;
  let missedDoubles = stats.missedDoubles;

  visit.darts.forEach((dart) => {
    if (nextDartsThrownInLeg < 9) {
      firstNineScored += dart.validatedScore;
      firstNineDarts += 1;
    }
    nextDartsThrownInLeg += 1;

    if (dart.isCheckoutAttempt) {
      checkoutAttempts += 1;
    }
    if (dart.isCheckoutSuccess) {
      checkoutSuccesses += 1;
    }
    if (dart.isMissedDouble) {
      missedDoubles += 1;
    }
  });

  return {
    nextStats: {
      ...stats,
      totalScored: stats.totalScored + visit.totalScore,
      totalDarts: stats.totalDarts + visit.darts.length,
      highestVisit: Math.max(stats.highestVisit, visit.totalScore),
      total180s: stats.total180s + (visit.totalScore === 180 ? 1 : 0),
      total100PlusVisits: stats.total100PlusVisits + (visit.totalScore >= 100 ? 1 : 0),
      firstNineScored,
      firstNineDarts,
      checkoutAttempts,
      checkoutSuccesses,
      missedDoubles,
    },
    nextDartsThrownInLeg,
  };
}

function applyLegPlayed(stats: PlayerAccumulator): PlayerAccumulator {
  return {
    ...stats,
    legsPlayed: stats.legsPlayed + 1,
  };
}

function applyLegWin(
  stats: PlayerAccumulator,
  dartsToFinish: number,
): PlayerAccumulator {
  return {
    ...stats,
    legsWon: stats.legsWon + 1,
    dartsToFinishTotal: stats.dartsToFinishTotal + (dartsToFinish > 0 ? dartsToFinish : 0),
    finishedLegs: stats.finishedLegs + (dartsToFinish > 0 ? 1 : 0),
  };
}

function accumulateLegVisitStats(
  playerMap: Map<string, PlayerAccumulator>,
  visits: VisitHistory[],
) {
  const legDartsByPlayer = new Map<string, number>();

  visits.forEach((visit) => {
    const current = getOrCreateAccumulator(playerMap, visit.playerName);
    const dartsThrownInLeg = legDartsByPlayer.get(visit.playerName) ?? 0;
    const { nextStats, nextDartsThrownInLeg } = applyVisitToStats(
      current,
      visit,
      dartsThrownInLeg,
    );
    playerMap.set(visit.playerName, nextStats);
    legDartsByPlayer.set(visit.playerName, nextDartsThrownInLeg);
  });
}

function accumulateLegParticipation(
  playerMap: Map<string, PlayerAccumulator>,
  game: GameHistory,
) {
  game.players.forEach((player) => {
    const current = getOrCreateAccumulator(playerMap, player.name);
    playerMap.set(player.name, applyLegPlayed(current));
  });
}

function accumulateLegWinner(
  playerMap: Map<string, PlayerAccumulator>,
  game: GameHistory,
  leg: GameHistory["legs"][number],
) {
  const legWinnerName = game.players.find(
    (player) => player.id === leg.winnerPlayerId,
  )?.name;
  if (!legWinnerName) {
    return;
  }

  const dartsToFinish = leg.visits
    .filter((visit) => visit.playerName === legWinnerName)
    .reduce((sum, visit) => sum + visit.darts.length, 0);

  const current = getOrCreateAccumulator(playerMap, legWinnerName);
  playerMap.set(legWinnerName, applyLegWin(current, dartsToFinish));
}

function buildPlayerStats(player: PlayerAccumulator): PlayerStats {
  const averagePerVisit = resolveAveragePerVisit(player.totalScored, player.totalDarts);
  const averagePerDart = averagePerVisit / DARTS_PER_VISIT;

  return {
    name: player.name,
    matchesPlayed: player.matchesPlayed,
    matchesWon: player.matchesWon,
    matchWinPercentage: calculatePercentage(player.matchesWon, player.matchesPlayed),
    averageScore: Number(averagePerDart.toFixed(2)),
    averagePerVisit: Number(averagePerVisit.toFixed(2)),
    firstNineAverage: safeDivideAndRound(
      player.firstNineScored,
      player.firstNineDarts,
      2,
      DARTS_PER_VISIT,
    ),
    highestVisit: player.highestVisit,
    total180s: player.total180s,
    oneEightiesPerMatch: safeDivideAndRound(player.total180s, player.matchesPlayed),
    total100PlusVisits: player.total100PlusVisits,
    checkoutAttempts: player.checkoutAttempts,
    checkoutSuccesses: player.checkoutSuccesses,
    checkoutPercentage: calculatePercentage(
      player.checkoutSuccesses,
      player.checkoutAttempts,
    ),
    averageDartsToFinish: safeDivideAndRound(
      player.dartsToFinishTotal,
      player.finishedLegs,
    ),
    missedDoublesPerLeg: safeDivideAndRound(player.missedDoubles, player.legsPlayed),
    legsWon: player.legsWon,
    legsPlayed: player.legsPlayed,
    legWinPercentage: calculatePercentage(player.legsWon, player.legsPlayed),
  };
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
  return totalDarts > 0 ? (totalScored / totalDarts) * DARTS_PER_VISIT : null;
}

/**
 * Calculate all-time statistics for each player from game history
 */
export function calculatePlayerStats(gameHistory: GameHistory[]): PlayerStats[] {
  const playerMap = new Map<string, PlayerAccumulator>();

  gameHistory.forEach((game) => {
    game.players.forEach((player) => {
      const current = getOrCreateAccumulator(playerMap, player.name);
      playerMap.set(
        player.name,
        applyMatchResult(current, game.winner === player.name),
      );
    });

    game.legs.forEach((leg) => {
      accumulateLegVisitStats(playerMap, leg.visits);
      accumulateLegParticipation(playerMap, game);
      accumulateLegWinner(playerMap, game, leg);
    });
  });

  const stats = Array.from(playerMap.values()).map(buildPlayerStats);
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
