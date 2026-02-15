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

  player.scoreHistory.forEach((legScores) => {
    if (legScores.length === 0) return;

    // Calculate first 9 darts average (first 3 visits)
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

    // Detect checkout attempts and success
    // A checkout attempt is when the player finishes with score reaching 0
    // or when they have a score that could be finished in remaining darts
    const lastScore = legScores[legScores.length - 1];
    if (lastScore === 0) {
      // This was the winning throw, but we need to check if it was a checkout attempt
      // Look at the pattern - if we finished, it was a successful checkout
      stats.checkoutSuccess++;
      stats.checkoutAttempts++;
    }
    // Note: Detecting failed checkout attempts is complex without additional data
    // We would need to track when player had a finishable score but didn't finish
  });

  // Calculate first 9 average
  if (first9DartsCount > 0) {
    stats.first9Average = Number(
      ((first9DartsTotal / first9DartsCount) * 3).toFixed(2),
    );
  }

  // Calculate average darts per leg
  const legsCompleted = player.legsWon;
  if (legsCompleted > 0) {
    stats.averageDartsPerLeg = Number(
      (player.dartsThrown / legsCompleted).toFixed(2),
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
