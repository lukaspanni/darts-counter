"use client";

import { type PracticeStore, createPracticeStore } from "@/lib/practice-store";
import { createStoreContext } from "@/lib/store-context";

export type PracticeStoreApi = ReturnType<typeof createPracticeStore>;

const {
  StoreContext: PracticeStoreContext,
  StoreProvider: PracticeStoreProvider,
  useBoundStore: usePracticeStoreBase,
} = createStoreContext(
  createPracticeStore,
  "usePracticeStore must be used within a PracticeStoreProvider",
);

export { PracticeStoreContext, PracticeStoreProvider };

export const usePracticeStore = <T,>(
  selector: (store: PracticeStore) => T,
): T => {
  return usePracticeStoreBase(selector);
};
