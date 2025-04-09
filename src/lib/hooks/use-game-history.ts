import { GameHistory, gameHistorySchema } from "@/lib/schemas";
import { useLocalStorage } from "@/hooks/use-local-storage";

const STORAGE_KEY = "game-history";

export function useGameHistory() {
  const [gameHistory, setGameHistory] = useLocalStorage<GameHistory[]>(
    STORAGE_KEY,
    [],
    gameHistorySchema,
  );

  const addGame = (game: GameHistory) => {
    const newHistory = [...gameHistory, game];
    console.log("Adding game to history:", newHistory);
    setGameHistory(newHistory);
  };

  const removeGame = (gameId: string) => {
    const newHistory = gameHistory.filter((g) => g.id !== parseInt(gameId));
    setGameHistory(newHistory);
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
