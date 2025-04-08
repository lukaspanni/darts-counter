import { z } from "zod";

export const playerSchema = z.object({
  id: z.number(),
  name: z.string(),
  score: z.number(),
  roundsWon: z.number(),
  dartsThrown: z.number(),
  totalScore: z.number(),
});

export type Player = z.infer<typeof playerSchema>;

export const gameSettingsSchema = z.object({
  startingScore: z.number(),
  outMode: z.enum(["single", "double"]),
  roundsToWin: z.number(),
  checkoutAssist: z.boolean().default(false),
});

export type GameSettings = z.infer<typeof gameSettingsSchema>;

export const gameHistoryPlayerSchema = z.object({
  name: z.string(),
  roundsWon: z.number(),
  averageScore: z.number(),
});

export const gameHistorySchema = z.array(
  z.object({
    id: z.number(),
    date: z.string(),
    players: z.array(gameHistoryPlayerSchema),
    winner: z.string(),
    gameMode: z.string(),
    roundsPlayed: z.number(),
  }),
);

export type GameHistory = z.infer<typeof gameHistorySchema>[number];
export type Dart = string;
export type Checkout = Dart[];
