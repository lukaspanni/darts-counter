import { z } from 'zod';

// Session types
export const sessionSchema = z.object({
	id: z.string().uuid(),
	role: z.enum(['host', 'viewer']),
});

export type Session = z.infer<typeof sessionSchema>;

// Game metadata schema
export const gameMetadataSchema = z.object({
	gameId: z.string().uuid(),
	startingScore: z.number(),
	outMode: z.enum(['single', 'double']),
	roundsToWin: z.number(),
	players: z.array(
		z.object({
			id: z.number(),
			name: z.string(),
			score: z.number(),
			roundsWon: z.number(),
			dartsThrown: z.number(),
			totalScore: z.number(),
		}),
	),
	currentRound: z.number(),
	activePlayerId: z.number(),
	gamePhase: z.enum(['setup', 'preGame', 'playing', 'gameOver']),
	roundWinner: z.number().nullable(),
	gameWinner: z.number().nullable(),
});

export type GameMetadata = z.infer<typeof gameMetadataSchema>;

// Message schemas - from client to DO
export const scoreEventSchema = z.object({
	type: z.literal('score'),
	playerId: z.number(),
	score: z.number(),
	modifier: z.enum(['single', 'double', 'triple']),
	newScore: z.number(),
	validatedScore: z.number(),
	isRoundWin: z.boolean(),
	isBust: z.boolean(),
	currentRoundTotal: z.number(),
});

export const undoEventSchema = z.object({
	type: z.literal('undo'),
	playerId: z.number(),
	lastScore: z.number(),
	newRoundTotal: z.number(),
});

export const roundFinishEventSchema = z.object({
	type: z.literal('roundFinish'),
	roundNumber: z.number(),
	winnerId: z.number().nullable(),
});

export const gameFinishEventSchema = z.object({
	type: z.literal('gameFinish'),
	winnerId: z.number(),
});

export const gameUpdateEventSchema = z.object({
	type: z.literal('gameUpdate'),
	metadata: gameMetadataSchema,
});

export const heartbeatEventSchema = z.object({
	type: z.literal('heartbeat'),
	timestamp: z.number(),
});

// Union of all client-to-DO events
export const clientEventSchema = z.discriminatedUnion('type', [
	scoreEventSchema,
	undoEventSchema,
	roundFinishEventSchema,
	gameFinishEventSchema,
	gameUpdateEventSchema,
	heartbeatEventSchema,
]);

export type ClientEvent = z.infer<typeof clientEventSchema>;

// Message schemas - from DO to client
export const syncEventSchema = z.object({
	type: z.literal('sync'),
	metadata: gameMetadataSchema,
});

export const broadcastEventSchema = z.object({
	type: z.literal('broadcast'),
	event: clientEventSchema,
});

export const errorEventSchema = z.object({
	type: z.literal('error'),
	message: z.string(),
});

// Union of all DO-to-client events
export const serverEventSchema = z.discriminatedUnion('type', [syncEventSchema, broadcastEventSchema, errorEventSchema]);

export type ServerEvent = z.infer<typeof serverEventSchema>;

// Game state stored in DO
export interface GameState {
	hostSecret: string;
	metadata: GameMetadata | null;
	createdAt: number;
	lastActivity: number;
}
