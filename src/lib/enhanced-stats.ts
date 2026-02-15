import type { Player } from "./schemas";

export interface EnhancedPlayerStats {
  first9Average: number;
  highestScore: number;
  count180s: number;
  count100Plus: number;
  checkoutAttempts: number;
  checkoutSuccess: number;
  averageDartsPerLeg: number;
  totalDarts: number;
}

/**
 * Calculate enhanced statistics from a player's game data
 */
export function calculateEnhancedStats(player: Player): EnhancedPlayerStats {
  const stats: EnhancedPlayerStats = {
    first9Average: 0,
    highestScore: 0,
    count180s: 0,
    count100Plus: 0,
    checkoutAttempts: 0,
    checkoutSuccess: 0,
    averageDartsPerLeg: 0,
    totalDarts: player.dartsThrown,
  };

  // Process each leg's score history
  let first9DartsTotal = 0;
  let first9DartsCount = 0;
  let totalLegsPlayed = 0;

  player.scoreHistory.forEach((legScores) => {
    if (legScores.length === 0) return;

    totalLegsPlayed++;

    // Calculate first 9 darts average (first 9 individual dart scores)
    const first9Darts = legScores.slice(0, 9);
    first9DartsTotal += first9Darts.reduce((sum, score) => sum + score, 0);
    first9DartsCount += first9Darts.length;

    // Process visits (groups of 3 darts) for this leg
    for (let i = 0; i < legScores.length; i += 3) {
      const visit = legScores.slice(i, i + 3);
      const visitTotal = visit.reduce((sum, score) => sum + score, 0);

      // Track highest score (per visit)
      if (visitTotal > stats.highestScore) {
        stats.highestScore = visitTotal;
      }

      // Count 180s (only if it's a complete 3-dart visit)
      if (visit.length === 3 && visitTotal === 180) {
        stats.count180s++;
      }

      // Count 100+ visits (only if it's a complete 3-dart visit)
      if (visit.length === 3 && visitTotal >= 100) {
        stats.count100Plus++;
      }
    }
  });

  // Calculate first 9 darts average (per-dart average)
  if (first9DartsCount > 0) {
    const perDartAverage = first9DartsTotal / first9DartsCount;
    // Convert to per-visit average (multiply by 3)
    stats.first9Average = Number((perDartAverage * 3).toFixed(2));
  }

  // Estimate checkout statistics based on legs won
  // Each leg won requires a successful checkout
  stats.checkoutSuccess = player.legsWon;
  // Estimate attempts: we count each leg played as having at least one checkout attempt
  // This is a conservative estimate since we don't track failed attempts
  stats.checkoutAttempts = totalLegsPlayed;

  // Calculate average darts per leg won
  if (player.legsWon > 0) {
    stats.averageDartsPerLeg = Number(
      (player.dartsThrown / player.legsWon).toFixed(2),
    );
  }

  return stats;
}

/**
 * Calculate visits from score history
 * A visit is 3 darts (or remaining darts if less than 3 at end of leg)
 */
export function calculateVisits(scoreHistory: number[][]): number[][] {
  const visits: number[][] = [];

  scoreHistory.forEach((legScores) => {
    for (let i = 0; i < legScores.length; i += 3) {
      const visit = legScores.slice(i, i + 3);
      if (visit.length > 0) {
        visits.push(visit);
      }
    }
  });

  return visits;
}

/**
 * Calculate the sum of a visit
 */
export function visitTotal(visit: number[]): number {
  return visit.reduce((sum, score) => sum + score, 0);
}
