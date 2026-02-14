import type { Player } from "@/lib/schemas";

export const createPlayers = (
  partials: Partial<Player>[],
  startingScore: number,
): Player[] => {
  return partials.map((p, i) => ({
    id: i + 1,
    name: p.name || `Player ${i + 1}`,
    score: startingScore,
    legsWon: 0,
    dartsThrown: 0,
    totalScore: 0,
    scoreHistory: [[]],
  }));
};
