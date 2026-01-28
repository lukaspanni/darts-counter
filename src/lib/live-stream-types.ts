// This file contains types shared between the main app and the live stream feature
// These should match the worker types for proper type safety

export type ScoreModifier = "single" | "double" | "triple";

export interface LiveStreamGameMetadata {
  gameId: string;
  startingScore: number;
  outMode: "single" | "double";
  roundsToWin: number;
  players: Array<{
    id: number;
    name: string;
    score: number;
    roundsWon: number;
    dartsThrown: number;
    totalScore: number;
  }>;
  currentRound: number;
  activePlayerId: number;
  gamePhase: "setup" | "preGame" | "playing" | "gameOver";
  roundWinner: number | null;
  gameWinner: number | null;
}

export interface ScoreEvent {
  type: "score";
  playerId: number;
  score: number;
  modifier: ScoreModifier;
  newScore: number;
  validatedScore: number;
  isRoundWin: boolean;
  isBust: boolean;
  currentRoundTotal: number;
}

export interface UndoEvent {
  type: "undo";
  playerId: number;
  lastScore: number;
  newRoundTotal: number;
}

export interface RoundFinishEvent {
  type: "roundFinish";
  roundNumber: number;
  winnerId: number | null;
}

export interface GameFinishEvent {
  type: "gameFinish";
  winnerId: number;
}

export interface GameUpdateEvent {
  type: "gameUpdate";
  metadata: LiveStreamGameMetadata;
}

export type ClientEvent =
  | ScoreEvent
  | UndoEvent
  | RoundFinishEvent
  | GameFinishEvent
  | GameUpdateEvent;

export interface SyncEvent {
  type: "sync";
  metadata: LiveStreamGameMetadata;
}

export interface BroadcastEvent {
  type: "broadcast";
  event: ClientEvent;
}

export interface ErrorEvent {
  type: "error";
  message: string;
}

export type ServerEvent = SyncEvent | BroadcastEvent | ErrorEvent;

export interface LiveStreamConnection {
  gameId: string;
  hostSecret: string;
}

export interface LiveStreamState {
  isActive: boolean;
  connection: LiveStreamConnection | null;
  status: "disconnected" | "connecting" | "connected" | "error";
  error: string | null;
}
