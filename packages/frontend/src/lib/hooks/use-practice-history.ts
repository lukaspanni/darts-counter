import { type PracticeSession, type PracticeHistory, practiceHistorySchema } from "@/lib/schemas";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/local-storage";
import { useEffect, useState } from "react";

const STORAGE_KEY = "practice-history-v1";

export function usePracticeHistory() {
  const [practiceHistory, setPracticeHistory] = useState<PracticeHistory>([]);

  useEffect(() => {
    const { ok, result } = loadFromLocalStorage(STORAGE_KEY, practiceHistorySchema);
    if (!ok) {
      updatePracticeHistory([]);
      return;
    }
    setPracticeHistory(result);
  }, []);

  const updatePracticeHistory = (newHistory: PracticeHistory) => {
    setPracticeHistory(newHistory);
    saveToLocalStorage(STORAGE_KEY, newHistory);
  };

  const addSession = (session: PracticeSession) => {
    const newHistory = [...practiceHistory, session];
    updatePracticeHistory(newHistory);
  };

  const removeSession = (removeId: string) => {
    const newHistory = practiceHistory.filter((s) => s.id !== removeId);
    updatePracticeHistory(newHistory);
  };

  // Sort sessions by date, newest first
  const sortedHistory = [...practiceHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return {
    practiceHistory: sortedHistory,
    addSession,
    removeSession,
  };
}
