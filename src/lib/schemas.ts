import { z } from "zod";

export const playerSchema = z.object({
  id: z.number(),
  name: z.string(),
  score: z.number(),
  legsWon: z.number(),
  dartsThrown: z.number(),
  totalScore: z.number(),
  scoreHistory: z.array(z.array(z.number()).max(3)),
});

export type Player = z.infer<typeof playerSchema>;

export const gameTypeSchema = z.enum(["bestOf", "firstTo"]);
export type GameType = z.infer<typeof gameTypeSchema>;

export const gameSettingsSchema = z.object({
  startingScore: z.number(),
  outMode: z.enum(["single", "double"]),
  gameMode: gameTypeSchema,
  legsToWin: z.number(),
  checkoutAssist: z.boolean().default(false),
});

export type GameSettings = z.infer<typeof gameSettingsSchema>;

export const gameHistoryPlayerSchema = z.object({
  id: z.number(),
  name: z.string(),
  legsWon: z.number(),
});

export const visitDartSchema = z.object({
  score: z.number(),
  modifier: z.enum(["single", "double", "triple"]),
  validatedScore: z.number(),
  isBust: z.boolean(),
  isCheckoutAttempt: z.boolean(),
  isCheckoutSuccess: z.boolean(),
  isDoubleAttempt: z.boolean(),
  isMissedDouble: z.boolean(),
});

export const visitHistorySchema = z.object({
  playerId: z.number(),
  playerName: z.string(),
  legNumber: z.number(),
  darts: z.array(visitDartSchema).max(3),
  totalScore: z.number(),
  startedScore: z.number(),
  endedScore: z.number(),
  timestamp: z.string(),
});

export const legHistorySchema = z.object({
  legNumber: z.number(),
  winnerPlayerId: z.number().nullable(),
  visits: z.array(visitHistorySchema),
});

export const pendingGameSnapshotSchema = z.object({
  matchId: z.string(),
  date: z.string(),
  players: z.array(playerSchema),
  activePlayerId: z.number(),
  gameSettings: gameSettingsSchema,
  currentLeg: z.number(),
  currentVisitScores: z.array(z.number()),
  currentVisitDarts: z.array(visitDartSchema),
  historyLegs: z.array(legHistorySchema),
});

export const pendingGameSchema = z.object({
  status: z.literal("pending"),
  snapshot: pendingGameSnapshotSchema,
});

export const gameHistorySchema = z.array(
  z.object({
    id: z.uuid(),
    date: z.string(),
    players: z.array(gameHistoryPlayerSchema),
    winner: z.string(),
    gameMode: z.string(),
    legsPlayed: z.number(),
    settings: gameSettingsSchema,
    legs: z.array(legHistorySchema),
  }),
);

export type GameHistory = z.infer<typeof gameHistorySchema>[number];
export type VisitDart = z.infer<typeof visitDartSchema>;
export type VisitHistory = z.infer<typeof visitHistorySchema>;
export type LegHistory = z.infer<typeof legHistorySchema>;
export type PendingGame = z.infer<typeof pendingGameSchema>;
export type PendingGameSnapshot = z.infer<typeof pendingGameSnapshotSchema>;
export const uiSettingsSchema = z.object({
  enhancedView: z.boolean(),
  noBullshitMode: z.boolean().default(false),
});

export type UiSettings = z.infer<typeof uiSettingsSchema>;
export type Dart = string;
export type Checkout = Dart[];
export type ScoreModifier = "single" | "double" | "triple";
export type OutMode = z.infer<typeof gameSettingsSchema>["outMode"];
