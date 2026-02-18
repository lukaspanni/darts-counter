import { z } from "zod";

// Score modifier - shared between frontend scoring and live stream events
export const scoreModifierSchema = z.enum(["single", "double", "triple"]);
export type ScoreModifier = z.infer<typeof scoreModifierSchema>;

// Game type schema
export const gameTypeSchema = z.enum(["bestOf", "firstTo"]);
export type GameType = z.infer<typeof gameTypeSchema>;

// Out mode schema
export const outModeSchema = z.enum(["single", "double"]);
export type OutMode = z.infer<typeof outModeSchema>;

// Game phase schema
export const gamePhaseSchema = z.enum(["setup", "preGame", "playing", "gameOver"]);
export type GamePhase = z.infer<typeof gamePhaseSchema>;

// Live stream player schema - the subset of player data shared over the wire
export const liveStreamPlayerSchema = z.object({
	id: z.number(),
	name: z.string(),
	score: z.number(),
	legsWon: z.number(),
	dartsThrown: z.number(),
	totalScore: z.number(),
});

export type LiveStreamPlayer = z.infer<typeof liveStreamPlayerSchema>;

// Game metadata schema - shared between frontend and worker
export const liveStreamGameMetadataSchema = z.object({
	gameId: z.string().uuid(),
	startingScore: z.number(),
	outMode: outModeSchema,
	gameMode: gameTypeSchema,
	legsToWin: z.number(),
	players: z.array(liveStreamPlayerSchema),
	currentLeg: z.number(),
	activePlayerId: z.number(),
	gamePhase: gamePhaseSchema,
	legWinner: z.number().nullable(),
	matchWinner: z.number().nullable(),
});

export type LiveStreamGameMetadata = z.infer<typeof liveStreamGameMetadataSchema>;

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

export const matchFinishEventSchema = z.object({
	type: z.literal("matchFinish"),
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
	matchFinishEventSchema,
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
