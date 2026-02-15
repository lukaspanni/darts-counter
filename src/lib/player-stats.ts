import type { GameHistory } from "./schemas";

export interface PlayerStats {
  name: string;
  matchesPlayed: number;
  matchesWon: number;
  legsPlayed: number;
  legsWon: number;
  averageScore: number; // Average per dart
  averagePerVisit: number; // Average per visit (3 darts)
  // Enhanced statistics
  first9Average: number;
  highestScore: number;
  total180s: number;
  total100Plus: number;
  checkoutPercentage: number;
  averageDartsPerLeg: number;
  legWinPercentage: number;
  matchWinPercentage: number;
}

export interface PlayerAverageHistory {
  name: string;
  date: string;
  average: number;
  matchNumber: number;
}

/**
 * Calculate all-time statistics for each player from game history
 */
export function calculatePlayerStats(
  gameHistory: GameHistory[],
): PlayerStats[] {
  const playerMap = new Map<
    string,
    Omit<
      PlayerStats,
      | "averageScore"
      | "averagePerVisit"
      | "first9Average"
      | "checkoutPercentage"
      | "averageDartsPerLeg"
      | "legWinPercentage"
      | "matchWinPercentage"
    > & {
      totalAverageScore: number;
      totalFirst9Average: number;
      first9Count: number;
      totalCheckoutAttempts: number;
      totalCheckoutSuccess: number;
      totalDartsForLegsWon: number;
    }
  >();

  gameHistory.forEach((game) => {
    game.players.forEach((player) => {
      const existing = playerMap.get(player.name);

      if (existing) {
        existing.matchesPlayed++;
        existing.totalAverageScore += player.averageScore;
        existing.legsPlayed += game.legsPlayed;
        existing.legsWon += player.legsWon;
        existing.highestScore = Math.max(
          existing.highestScore,
          player.highestScore ?? 0,
        );
        existing.total180s += player.count180s ?? 0;
        existing.total100Plus += player.count100Plus ?? 0;
        existing.totalCheckoutAttempts += player.checkoutAttempts ?? 0;
        existing.totalCheckoutSuccess += player.checkoutSuccess ?? 0;

        if (player.first9Average) {
          existing.totalFirst9Average += player.first9Average;
          existing.first9Count++;
        }

        if (player.legsWon > 0 && player.averageDartsPerLeg) {
          existing.totalDartsForLegsWon +=
            player.averageDartsPerLeg * player.legsWon;
        }

        if (game.winner === player.name) {
          existing.matchesWon++;
        }
      } else {
        playerMap.set(player.name, {
          name: player.name,
          matchesPlayed: 1,
          matchesWon: game.winner === player.name ? 1 : 0,
          legsPlayed: game.legsPlayed,
          legsWon: player.legsWon,
          totalAverageScore: player.averageScore,
          highestScore: player.highestScore ?? 0,
          total180s: player.count180s ?? 0,
          total100Plus: player.count100Plus ?? 0,
          totalCheckoutAttempts: player.checkoutAttempts ?? 0,
          totalCheckoutSuccess: player.checkoutSuccess ?? 0,
          totalFirst9Average: player.first9Average ?? 0,
          first9Count: player.first9Average ? 1 : 0,
          totalDartsForLegsWon:
            player.legsWon > 0 && player.averageDartsPerLeg
              ? player.averageDartsPerLeg * player.legsWon
              : 0,
        });
      }
    });
  });

  // Calculate final averages
  const stats: PlayerStats[] = Array.from(playerMap.values()).map((player) => {
    const avgScore =
      player.matchesPlayed > 0
        ? player.totalAverageScore / player.matchesPlayed
        : 0;

    const first9Avg =
      player.first9Count > 0
        ? player.totalFirst9Average / player.first9Count
        : 0;

    const checkoutPct =
      player.totalCheckoutAttempts > 0
        ? (player.totalCheckoutSuccess / player.totalCheckoutAttempts) * 100
        : 0;

    const avgDartsPerLeg =
      player.legsWon > 0 ? player.totalDartsForLegsWon / player.legsWon : 0;

    const legWinPct =
      player.legsPlayed > 0 ? (player.legsWon / player.legsPlayed) * 100 : 0;

    const matchWinPct =
      player.matchesPlayed > 0
        ? (player.matchesWon / player.matchesPlayed) * 100
        : 0;

    return {
      name: player.name,
      matchesPlayed: player.matchesPlayed,
      matchesWon: player.matchesWon,
      legsPlayed: player.legsPlayed,
      legsWon: player.legsWon,
      averageScore: Number(avgScore.toFixed(2)),
      averagePerVisit: Number((avgScore * 3).toFixed(2)),
      first9Average: Number(first9Avg.toFixed(2)),
      highestScore: player.highestScore,
      total180s: player.total180s,
      total100Plus: player.total100Plus,
      checkoutPercentage: Number(checkoutPct.toFixed(1)),
      averageDartsPerLeg: Number(avgDartsPerLeg.toFixed(1)),
      legWinPercentage: Number(legWinPct.toFixed(1)),
      matchWinPercentage: Number(matchWinPct.toFixed(1)),
    };
  });

  // Sort by matches played descending
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
      // Filter by player name if specified
      if (playerName && player.name !== playerName) {
        return;
      }

      const averages = playerAverages.get(player.name) ?? [];
      averages.push(player.averageScore);
      playerAverages.set(player.name, averages);

      // Calculate running average
      const sum = averages.reduce((acc, val) => acc + val, 0);
      const runningAverage = sum / averages.length;

      result.push({
        name: player.name,
        date: game.date,
        average: Number((runningAverage * 3).toFixed(2)), // Convert to per-visit
        matchNumber: gameIndex + 1,
      });
    });
  });

  return result;
}
