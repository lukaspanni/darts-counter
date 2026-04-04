import type { ScoreModifier } from "@/lib/schemas";

export const CRICKET_SEGMENTS = [15, 16, 17, 18, 19, 20, 25] as const;
export type CricketSegment = (typeof CRICKET_SEGMENTS)[number];

export type CricketPlayerState = {
  marks: Record<number, number>; // segment -> marks (0-3+)
  points: number;
};

export type CricketState = {
  mode: "cricket";
  players: CricketPlayerState[];
  activePlayerIndex: number;
  currentVisitDarts: number; // 0-3
  totalDarts: number;
  variant: "standard";
  gameComplete: boolean;
  winnerIndex: number | null;
};

function createPlayerState(): CricketPlayerState {
  return {
    marks: Object.fromEntries(CRICKET_SEGMENTS.map((s) => [s, 0])),
    points: 0,
  };
}

export function createInitialCricketState(playerCount: 1 | 2): CricketState {
  return {
    mode: "cricket",
    players: Array.from({ length: playerCount }, () => createPlayerState()),
    activePlayerIndex: 0,
    currentVisitDarts: 0,
    totalDarts: 0,
    variant: "standard",
    gameComplete: false,
    winnerIndex: null,
  };
}

function getMultiplier(modifier: ScoreModifier): number {
  if (modifier === "double") return 2;
  if (modifier === "triple") return 3;
  return 1;
}

function getSegmentFromThrow(score: number, modifier: ScoreModifier): number | null {
  const multiplier = getMultiplier(modifier);
  const segment = multiplier > 0 ? Math.round(score / multiplier) : 0;

  // Special: bullseye (score=50, modifier=double) -> segment 25
  // Outer bull (score=25, modifier=single) -> segment 25
  const isCricketSegment = (CRICKET_SEGMENTS as readonly number[]).includes(segment);
  if (!isCricketSegment) return null;
  return segment;
}

function allSegmentsClosed(player: CricketPlayerState): boolean {
  return CRICKET_SEGMENTS.every((s) => (player.marks[s] ?? 0) >= 3);
}

function checkWinner(players: CricketPlayerState[]): number | null {
  if (players.length === 1) {
    // Solo mode: win when all closed
    if (allSegmentsClosed(players[0]!)) return 0;
    return null;
  }

  // 2 player: win when all segments closed AND points >= opponent
  for (let i = 0; i < players.length; i++) {
    const player = players[i]!;
    if (allSegmentsClosed(player)) {
      const opponent = players[1 - i]!;
      if (player.points >= opponent.points) {
        return i;
      }
    }
  }
  return null;
}

export function processCricketThrow(
  state: CricketState,
  score: number,
  modifier: ScoreModifier,
): CricketState {
  if (state.gameComplete) return state;

  const segment = getSegmentFromThrow(score, modifier);
  const newDartsInVisit = state.currentVisitDarts + 1;
  const multiplier = getMultiplier(modifier);

  // Deep copy players
  const newPlayers: CricketPlayerState[] = state.players.map((p) => ({
    marks: { ...p.marks },
    points: p.points,
  }));

  if (segment !== null) {
    const activePlayer = newPlayers[state.activePlayerIndex]!;
    const currentMarks = activePlayer.marks[segment] ?? 0;
    const newMarks = currentMarks + multiplier;
    activePlayer.marks[segment] = newMarks;

    // Score points: marks beyond 3 score points if opponent hasn't closed the segment
    if (newMarks > 3) {
      const pointsToAdd = (newMarks - Math.max(currentMarks, 3)) * segment;
      const opponentClosed =
        state.players.length > 1 &&
        (newPlayers[1 - state.activePlayerIndex]?.marks[segment] ?? 0) >= 3;
      if (!opponentClosed && pointsToAdd > 0) {
        activePlayer.points += pointsToAdd;
      }
    }
  }

  const winnerIndex = checkWinner(newPlayers);
  const gameComplete = winnerIndex !== null;

  // In solo mode: auto-advance (reset visit) after 3 darts so play continues uninterrupted.
  // In multiplayer: stop at 3 darts; player must click "Finish Visit" to hand over the turn.
  const isSolo = state.players.length === 1;
  const soloAutoAdvance = isSolo && newDartsInVisit >= 3 && !gameComplete;
  const nextPlayerIndex = soloAutoAdvance
    ? 0
    : state.activePlayerIndex;
  const nextVisitDarts = soloAutoAdvance ? 0 : newDartsInVisit;

  return {
    ...state,
    players: newPlayers,
    activePlayerIndex: nextPlayerIndex,
    currentVisitDarts: nextVisitDarts,
    totalDarts: state.totalDarts + 1,
    gameComplete,
    winnerIndex,
  };
}

export function advanceToNextVisit(state: CricketState): CricketState {
  if (state.gameComplete || state.players.length === 1) return state;
  const nextPlayerIndex = (state.activePlayerIndex + 1) % state.players.length;
  return {
    ...state,
    activePlayerIndex: nextPlayerIndex,
    currentVisitDarts: 0,
  };
}
