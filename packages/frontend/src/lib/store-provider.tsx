"use client";

import { type GameStore, createGameStore } from "@/lib/store";
import { createStoreContext } from "@/lib/store-context";

export type GameStoreApi = ReturnType<typeof createGameStore>;

const {
  StoreContext: GameStoreContext,
  StoreProvider: GameStoreProvider,
  useBoundStore: useGameStoreBase,
} = createStoreContext(
  createGameStore,
  "useGameStore must be used within a GameStoreProvider",
);

export { GameStoreContext, GameStoreProvider };

export const useGameStore = <T,>(selector: (store: GameStore) => T): T => {
  return useGameStoreBase(selector);
};
