import { z } from "zod";
import { playerSchema, gameSettingsSchema } from "./schemas";

// Derive score modifier from existing schema
export const scoreModifierSchema = z.enum(["single", "double", "triple"]);
export type ScoreModifier = z.infer<typeof scoreModifierSchema>;

// Game metadata schema - derived from existing player and game settings schemas
export const liveStreamPlayerSchema = playerSchema.pick({
  id: true,
  name: true,
  score: true,
  legsWon: true,
  legsWon: true,
  dartsThrown: true,
  totalScore: true,
});

export const liveStreamGameMetadataSchema = z.object({
  gameId: z.string().uuid(),
  startingScore: z.number(),
  outMode: gameSettingsSchema.shape.outMode,
  gameMode: gameSettingsSchema.shape.gameMode,
  legsToWin: z.number(),
  players: z.array(liveStreamPlayerSchema),
  currentLeg: z.number(),
  activePlayerId: z.number(),
  gamePhase: z.enum(["setup", "preGame", "playing", "gameOver"]),
  legWinner: z.number().nullable(),
  matchWinner: z.number().nullable(),
});

export type LiveStreamGameMetadata = z.infer<
  typeof liveStreamGameMetadataSchema
>;

// Client event schemas (messages from client to server)
export const scoreEventSchema = z.object({
  type: z.literal("score"),
  playerId: z.number(),
  score: z.number(),
  modifier: scoreModifierSchema,
  newScore: z.number(),
  validatedScore: z.number(),
  isLegWin: z.boolean(),
  isBust: z.boolean(),
  currentVisitTotal: z.number(),
});

export const undoEventSchema = z.object({
  type: z.literal("undo"),
  playerId: z.number(),
  lastScore: z.number(),
  newVisitTotal: z.number(),
});

export const roundFinishEventSchema = z.object({
  type: z.literal("roundFinish"),
  legNumber: z.number(),
  winnerId: z.number().nullable(),
});

export const gameFinishEventSchema = z.object({
  type: z.literal("gameFinish"),
  winnerId: z.number(),
});

export const gameUpdateEventSchema = z.object({
  type: z.literal("gameUpdate"),
  metadata: liveStreamGameMetadataSchema,
});

export const heartbeatEventSchema = z.object({
  type: z.literal("heartbeat"),
  timestamp: z.number(),
});

// Union of all client events
export const clientEventSchema = z.discriminatedUnion("type", [
  scoreEventSchema,
  undoEventSchema,
  roundFinishEventSchema,
  gameFinishEventSchema,
  gameUpdateEventSchema,
  heartbeatEventSchema,
]);

export type ClientEvent = z.infer<typeof clientEventSchema>;

// Server event schemas (messages from server to client)
export const syncEventSchema = z.object({
  type: z.literal("sync"),
  metadata: liveStreamGameMetadataSchema,
});

export const broadcastEventSchema = z.object({
  type: z.literal("broadcast"),
  event: clientEventSchema,
});

export const errorEventSchema = z.object({
  type: z.literal("error"),
  message: z.string(),
});

// Union of all server events
export const serverEventSchema = z.discriminatedUnion("type", [
  syncEventSchema,
  broadcastEventSchema,
  errorEventSchema,
]);

export type ServerEvent = z.infer<typeof serverEventSchema>;

// API response schemas
export const createGameResponseSchema = z.object({
  gameId: z.string().uuid(),
  hostSecret: z.string(),
});

export type CreateGameResponse = z.infer<typeof createGameResponseSchema>;

// Connection and state types
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
