import type { GameHistory, VisitHistory } from "./schemas";

const DARTS_PER_VISIT = 3;

export function sumVisitDarts(visits: VisitHistory[]): number {
  return visits.reduce((sum, visit) => sum + visit.darts.length, 0);
}

export function getLegWinnerName(
  game: GameHistory,
  leg: GameHistory["legs"][number],
): string | null {
  return (
    game.players.find((player) => player.id === leg.winnerPlayerId)?.name ??
    null
  );
}

export function getDartsThrownByPlayerInLeg(
  leg: GameHistory["legs"][number],
  playerName: string,
): number {
  return sumVisitDarts(
    leg.visits.filter((visit) => visit.playerName === playerName),
  );
}

export function getThreeDartAverageForVisits(
  visits: VisitHistory[],
): number | null {
  if (visits.length === 0) {
    return null;
  }

  const totalScored = visits.reduce((sum, visit) => sum + visit.totalScore, 0);
  const totalDarts = sumVisitDarts(visits);

  return totalDarts > 0 ? (totalScored / totalDarts) * DARTS_PER_VISIT : null;
}
