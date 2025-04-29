import { GameHistory, gameHistorySchema } from "@/lib/schemas";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/local-storage";
import { useEffect, useState } from "react";

const STORAGE_KEY = "game-history";

export function useGameHistory() {
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);

  useEffect(() => {
    const { ok, result, error } = loadFromLocalStorage(
      STORAGE_KEY,
      gameHistorySchema,
    );
    if (!ok) {
      console.error("Failed to load game history from local storage:", error);
      return;
    }

    setGameHistory(result);
  }, []);

  const updateGameHistory = (newHistory: GameHistory[]) => {
    setGameHistory(newHistory);
    saveToLocalStorage(STORAGE_KEY, newHistory);
  };

  const addGame = (game: GameHistory) => {
    const newHistory = [...gameHistory, game];
    updateGameHistory(newHistory);
  };

  const removeGame = (removeId: string) => {
    const newHistory = gameHistory.filter((g) => g.id !== removeId);
    updateGameHistory(newHistory);
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
