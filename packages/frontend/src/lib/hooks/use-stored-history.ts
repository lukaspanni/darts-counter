import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/local-storage";
import { useEffect, useState } from "react";
import type { z } from "zod";

type DatedItem = {
  date: string;
};

export function useStoredHistory<TItem extends DatedItem>(
  storageKey: string,
  schema: z.ZodType<TItem[]>,
) {
  const [history, setHistory] = useState<TItem[]>([]);

  const updateHistory = (nextHistory: TItem[]) => {
    setHistory(nextHistory);
    saveToLocalStorage(storageKey, nextHistory);
  };

  useEffect(() => {
    const { ok, result } = loadFromLocalStorage(storageKey, schema);
    if (!ok) {
      setHistory([]);
      saveToLocalStorage(storageKey, []);
      return;
    }

    setHistory(result);
  }, [storageKey, schema]);

  const addItem = (item: TItem) => {
    updateHistory([...history, item]);
  };

  const removeItem = (predicate: (item: TItem) => boolean) => {
    updateHistory(history.filter((item) => !predicate(item)));
  };

  const sortedHistory = [...history].sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return {
    history: sortedHistory,
    addItem,
    removeItem,
  };
}
