import type { GameHistory } from "./schemas";

export interface PlayerStats {
  name: string;
  matchesPlayed: number;
  matchesWon: number;
  averageScore: number; // Average per dart
  averagePerVisit: number; // Average per visit (3 darts)
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
    Omit<PlayerStats, "averageScore" | "averagePerVisit"> & {
      totalAverageScore: number;
    }
  >();

  gameHistory.forEach((game) => {
    game.players.forEach((player) => {
      const existing = playerMap.get(player.name);

      if (existing) {
        existing.matchesPlayed++;
        existing.totalAverageScore += player.averageScore;
        if (game.winner === player.name) {
          existing.matchesWon++;
        }
      } else {
        playerMap.set(player.name, {
          name: player.name,
          matchesPlayed: 1,
          matchesWon: game.winner === player.name ? 1 : 0,
          totalAverageScore: player.averageScore,
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
    return {
      name: player.name,
      matchesPlayed: player.matchesPlayed,
      matchesWon: player.matchesWon,
      averageScore: Number(avgScore.toFixed(2)),
      averagePerVisit: Number((avgScore * 3).toFixed(2)),
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
