import type { Player } from "@/lib/schemas";

export const createPlayers = (
  partials: Partial<Player>[],
  startingScore: number,
): Player[] => {
  // Guard: Only support 1-2 players
  if (partials.length < 1 || partials.length > 2) {
    console.warn(`Invalid player count: ${partials.length}. Clamping to 1-2 players.`);
  }
  const validPartials = partials.slice(0, 2);
  if (validPartials.length === 0) {
    validPartials.push({});
  }
  
  return validPartials.map((p, i) => ({
    id: i + 1,
    name: p.name || `Player ${i + 1}`,
    score: startingScore,
    legsWon: 0,
    dartsThrown: 0,
    totalScore: 0,
    scoreHistory: [[]],
  }));
};
