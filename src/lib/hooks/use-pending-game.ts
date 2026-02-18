"use client";

import { type PendingGame, type PendingGameSnapshot } from "@/lib/schemas";
import { saveToLocalStorage } from "@/lib/local-storage";
import { useCallback, useEffect, useState } from "react";

const PENDING_GAME_STORAGE_KEY = "pending-game-v1";

export function usePendingGame() {
  const [pendingGame, setPendingGame] = useState<PendingGame | null>(null);

  useEffect(() => {
    const rawPendingGame = window.localStorage.getItem(
      PENDING_GAME_STORAGE_KEY,
    );
    if (!rawPendingGame) {
      return;
    }

    try {
      const parsed = JSON.parse(rawPendingGame) as PendingGame;
      if (parsed?.status === "pending" && parsed.snapshot) {
        setPendingGame(parsed);
      }
    } catch {
      window.localStorage.removeItem(PENDING_GAME_STORAGE_KEY);
    }
  }, []);

  const savePendingGame = useCallback((snapshot: PendingGameSnapshot) => {
    const pending: PendingGame = {
      status: "pending",
      snapshot,
    };
    setPendingGame(pending);
    saveToLocalStorage(PENDING_GAME_STORAGE_KEY, pending);
  }, []);

  const clearPendingGame = useCallback(() => {
    setPendingGame(null);
    window.localStorage.removeItem(PENDING_GAME_STORAGE_KEY);
  }, []);

  return {
    pendingGame,
    savePendingGame,
    clearPendingGame,
  };
}
