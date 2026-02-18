// Re-export shared live stream types
export {
  scoreModifierSchema,
  type ScoreModifier,
  liveStreamPlayerSchema,
  liveStreamGameMetadataSchema,
  type LiveStreamGameMetadata,
  scoreEventSchema,
  undoEventSchema,
  roundFinishEventSchema,
  matchFinishEventSchema,
  gameUpdateEventSchema,
  heartbeatEventSchema,
  clientEventSchema,
  type ClientEvent,
  syncEventSchema,
  broadcastEventSchema,
  errorEventSchema,
  serverEventSchema,
  type ServerEvent,
  createGameResponseSchema,
  type CreateGameResponse,
} from "@darts-counter/shared";

// Frontend-only connection and state types
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
