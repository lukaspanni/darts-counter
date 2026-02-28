import type { ScoreModifier } from "@/lib/schemas";

export type DartThrownEvent = {
  type: "dartThrown";
  playerId: number;
  playerName: string;
  legNumber: number;
  score: number;
  modifier: ScoreModifier;
  validatedScore: number;
  isBust: boolean;
  currentVisitTotal: number;
};

export type VisitCompletedEvent = {
  type: "visitCompleted";
  playerId: number;
  playerName: string;
  legNumber: number;
  visitScore: number;
  dartsInVisit: number;
  isBust: boolean;
};

export type VisitMaxScoredEvent = {
  type: "visitMaxScored";
  playerId: number;
  playerName: string;
  legNumber: number;
  score: 180;
};

export type LegWonEvent = {
  type: "legWon";
  winnerId: number;
  winnerName: string;
  legNumber: number;
  isMatchWin: boolean;
  playerCount: number;
};

export type MatchWonEvent = {
  type: "matchWon";
  winnerId: number;
  winnerName: string;
  legNumber: number;
  playerCount: number;
  winnerAverage: number;
  legsPlayed: number;
  startingScore: number;
  outMode: string;
};

export type MatchResetEvent = {
  type: "matchReset";
  legNumber: number;
  playerCount: number;
};

export type LegStartedEvent = {
  type: "legStarted";
  legNumber: number;
};

export type GameDomainEvent =
  | DartThrownEvent
  | VisitCompletedEvent
  | VisitMaxScoredEvent
  | LegWonEvent
  | MatchWonEvent
  | MatchResetEvent
  | LegStartedEvent;

export type GameEventHandler = (event: GameDomainEvent) => void;

const listeners = new Set<GameEventHandler>();

export function emitGameEvent(event: GameDomainEvent) {
  for (const listener of listeners) {
    listener(event);
  }
}

export function subscribeToGameEvents(handler: GameEventHandler) {
  listeners.add(handler);
  return () => {
    listeners.delete(handler);
  };
}
