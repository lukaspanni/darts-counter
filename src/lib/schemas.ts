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

export const gameSettingsSchema = z.object({
  startingScore: z.number(),
  outMode: z.enum(["single", "double"]),
  gameMode: z.enum(["bestOf", "firstTo"]),
  legsToWin: z.number(),
  checkoutAssist: z.boolean().default(false),
});

export type GameSettings = z.infer<typeof gameSettingsSchema>;

export const gameHistoryPlayerSchema = z.object({
  name: z.string(),
  legsWon: z.number(),
  averageScore: z.number(),
});

export const gameHistorySchema = z.array(
  z.object({
    id: z.uuid(),
    date: z.string(),
    players: z.array(gameHistoryPlayerSchema),
    winner: z.string(),
    gameMode: z.string(),
    legsPlayed: z.number(),
  }),
);

export type GameHistory = z.infer<typeof gameHistorySchema>[number];
export const uiSettingsSchema = z.object({
  enhancedView: z.boolean(),
  noBullshitMode: z.boolean().default(false),
});

export type UiSettings = z.infer<typeof uiSettingsSchema>;
export type Dart = string;
export type Checkout = Dart[];
export type ScoreModifier = "single" | "double" | "triple";
export type OutMode = z.infer<typeof gameSettingsSchema>["outMode"];
