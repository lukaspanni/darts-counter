import "client-only";

import { Effect, pipe } from "effect";
import type { z } from "zod";

export const saveToLocalStorage = <T>(key: string, data: T): Effect.Effect<void, Error> =>
  pipe(
    Effect.try({
      try: () => window.localStorage.setItem(key, JSON.stringify(data)),
      catch: (error) =>
        error instanceof Error ? error : new Error("Unknown error", { cause: error }),
    }),
    Effect.tapError((e) => Effect.sync(() => console.error("Error saving to localStorage:", e))),
  );

export const loadFromLocalStorage = <T>(
  key: string,
  schema: z.ZodType<T>,
): Effect.Effect<T, Error> =>
  Effect.try({
    try: () => {
      const serializedData = window.localStorage.getItem(key);
      if (!serializedData) throw new Error("No data found");

      const parsed = schema.safeParse(JSON.parse(serializedData));
      if (!parsed.success) throw parsed.error;

      return parsed.data;
    },
    catch: (error) =>
      error instanceof Error ? error : new Error("Unknown error", { cause: error }),
  });
