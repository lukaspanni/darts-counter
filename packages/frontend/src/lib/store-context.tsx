"use client";

import { type ReactNode, createContext, useContext, useRef } from "react";
import { type ExtractState, useStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";

type StoreProviderProps = {
  children: ReactNode;
};

export function createStoreContext<TStore extends StoreApi<object>>(
  createStore: () => TStore,
  errorMessage: string,
) {
  const StoreContext = createContext<TStore | undefined>(undefined);

  const StoreProvider = ({ children }: StoreProviderProps) => {
    const storeRef = useRef<TStore | null>(null);
    storeRef.current ??= createStore();

    return (
      <StoreContext.Provider value={storeRef.current}>
        {children}
      </StoreContext.Provider>
    );
  };

  const useBoundStore = <T,>(
    selector: (store: ExtractState<TStore>) => T,
  ): T => {
    const storeContext = useContext(StoreContext);
    if (!storeContext) {
      throw new Error(errorMessage);
    }

    return useStore(storeContext, selector);
  };

  return {
    StoreContext,
    StoreProvider,
    useBoundStore,
  };
}
