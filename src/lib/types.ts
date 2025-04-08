export interface Player {
  id: number;
  name: string;
  score: number;
  roundsWon: number;
  dartsThrown: number;
  totalScore: number;
}

export interface GameSettings {
  startingScore: number;
  outMode: "single" | "double";
  roundsToWin: number;
  checkoutAssist: boolean;
}

export interface GameHistory {
  id: number;
  date: string;
  players: {
    name: string;
    roundsWon: number;
    averageScore: number;
  }[];
  winner: string;
  gameMode: string;
  roundsPlayed: number;
}

// Checkout types
export type Dart = string;
export type Checkout = Dart[];
