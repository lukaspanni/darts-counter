import type { GameHistory } from "./schemas";

export interface PlayerStats {
  name: string;
  gamesPlayed: number;
  gamesWon: number;
  averageScore: number; // Average per dart
  averagePerRound: number; // Average per round (3 darts)
}

export interface PlayerAverageHistory {
  name: string;
  date: string;
  average: number;
  gameNumber: number;
}

/**
 * Calculate all-time statistics for each player from game history
 */
export function calculatePlayerStats(
  gameHistory: GameHistory[],
): PlayerStats[] {
  const playerMap = new Map<string, PlayerStats>();

  gameHistory.forEach((game) => {
    game.players.forEach((player) => {
      const existing = playerMap.get(player.name);

      if (existing) {
        existing.gamesPlayed++;
        existing.averageScore += player.averageScore;
        if (game.winner === player.name) {
          existing.gamesWon++;
        }
      } else {
        playerMap.set(player.name, {
          name: player.name,
          gamesPlayed: 1,
          gamesWon: game.winner === player.name ? 1 : 0,
          averageScore: player.averageScore,
          averagePerRound: 0, // Will be calculated below
        });
      }
    });
  });

  // Calculate final averages
  const stats = Array.from(playerMap.values()).map((player) => ({
    ...player,
    averageScore:
      player.gamesPlayed > 0
        ? Number((player.averageScore / player.gamesPlayed).toFixed(2))
        : 0,
    averagePerRound:
      player.gamesPlayed > 0
        ? Number(((player.averageScore / player.gamesPlayed) * 3).toFixed(2))
        : 0,
  }));

  // Sort by games played descending
  return stats.sort((a, b) => b.gamesPlayed - a.gamesPlayed);
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
        average: Number((runningAverage * 3).toFixed(2)), // Convert to per-round
        gameNumber: gameIndex + 1,
      });
    });
  });

  return result;
}
