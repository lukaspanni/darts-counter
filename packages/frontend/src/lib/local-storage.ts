import "client-only";

import { type Result, errorResult, okResult } from "@/types/result";
import type { z } from "zod";

export const saveToLocalStorage = <T>(key: string, data: T): Result<true> => {
  try {
    const serializedData = JSON.stringify(data);
    window.localStorage.setItem(key, serializedData);
    return okResult(true);
  } catch (error) {
    console.error("Error saving to localStorage:", error);
    return errorResult(error);
  }
};

export const loadFromLocalStorage = <T>(
  key: string,
  schema: z.ZodType<T>,
): Result<T> => {
  try {
    const serializedData = window.localStorage.getItem(key);
    if (!serializedData) return errorResult(new Error("No data found"));

    const parsed = schema.safeParse(JSON.parse(serializedData));
    if (!parsed.success) return errorResult(parsed.error);

    return okResult(parsed.data);
  } catch (error) {
    return errorResult(error);
  }
};
