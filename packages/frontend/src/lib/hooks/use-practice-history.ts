import { type PracticeSession, practiceHistorySchema } from "@/lib/schemas";
import { useStoredHistory } from "@/lib/hooks/use-stored-history";

const STORAGE_KEY = "practice-history-v1";

export function usePracticeHistory() {
  const { history, addItem, removeItem } = useStoredHistory<PracticeSession>(
    STORAGE_KEY,
    practiceHistorySchema,
  );

  return {
    practiceHistory: history,
    addSession: addItem,
    removeSession: (removeId: string) =>
      removeItem((session) => session.id === removeId),
  };
}
