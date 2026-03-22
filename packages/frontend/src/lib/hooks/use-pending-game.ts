"use client";

import { pendingGameSchema, type PendingGame, type PendingGameSnapshot } from "@/lib/schemas";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/local-storage";
import { Effect, pipe } from "effect";
import { useCallback, useEffect, useState } from "react";

const PENDING_GAME_STORAGE_KEY = "pending-game-v1";

export function usePendingGame() {
  const [pendingGame, setPendingGame] = useState<PendingGame | null>(null);

  useEffect(() => {
    Effect.runSync(
      pipe(
        loadFromLocalStorage(PENDING_GAME_STORAGE_KEY, pendingGameSchema),
        Effect.match({
          onSuccess: setPendingGame,
          onFailure: () => window.localStorage.removeItem(PENDING_GAME_STORAGE_KEY),
        }),
      ),
    );
  }, []);

  const savePendingGame = useCallback((snapshot: PendingGameSnapshot) => {
    const pending: PendingGame = {
      status: "pending",
      snapshot,
    };
    setPendingGame(pending);
    Effect.runSync(Effect.ignore(saveToLocalStorage(PENDING_GAME_STORAGE_KEY, pending)));
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
