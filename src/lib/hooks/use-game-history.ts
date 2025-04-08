import { GameHistory } from "@/lib/schemas";
import { useEffect, useState } from "react";

const STORAGE_KEY = "game-history";

export function useGameHistory() {
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setGameHistory(JSON.parse(stored));
    }
  }, []);

  const addGame = (game: GameHistory) => {
    const newHistory = [...gameHistory, game];
    console.log("Adding game to history:", newHistory);
    setGameHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  };

  const removeGame = (gameId: string) => {
    const newHistory = gameHistory.filter((g) => g.id !== parseInt(gameId));
    setGameHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  };

  // Sort games by date, newest first
  const sortedHistory = [...gameHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return {
    gameHistory: sortedHistory,
    addGame,
    removeGame,
  };
}
