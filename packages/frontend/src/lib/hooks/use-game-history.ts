import { type GameHistory, gameHistorySchema } from "@/lib/schemas";
import { useStoredHistory } from "@/lib/hooks/use-stored-history";

const STORAGE_KEY = "game-history-v2";

export function useGameHistory() {
  const { history, addItem, removeItem } = useStoredHistory<GameHistory>(
    STORAGE_KEY,
    gameHistorySchema,
  );

  return {
    gameHistory: history,
    addGame: addItem,
    removeGame: (removeId: string) => removeItem((game) => game.id === removeId),
  };
}
