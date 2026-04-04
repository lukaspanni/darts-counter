"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";
import { type PracticeStore, createPracticeStore } from "@/lib/practice-store";

export type PracticeStoreApi = ReturnType<typeof createPracticeStore>;

export const PracticeStoreContext = createContext<PracticeStoreApi | undefined>(
  undefined,
);

export interface PracticeStoreProviderProps {
  children: ReactNode;
}

export const PracticeStoreProvider = ({
  children,
}: PracticeStoreProviderProps) => {
  const storeRef = useRef<PracticeStoreApi | null>(null);
  storeRef.current ??= createPracticeStore();

  return (
    <PracticeStoreContext.Provider value={storeRef.current}>
      {children}
    </PracticeStoreContext.Provider>
  );
};

export const usePracticeStore = <T,>(
  selector: (store: PracticeStore) => T,
): T => {
  const practiceStoreContext = useContext(PracticeStoreContext);
  if (!practiceStoreContext) {
    throw new Error(
      "usePracticeStore must be used within a PracticeStoreProvider",
    );
  }
  return useStore(practiceStoreContext, selector);
};
