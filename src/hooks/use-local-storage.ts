"use client";

import { useState, useEffect } from "react";
import type { z } from "zod";

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  schema?: z.ZodType<T>,
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);

      if (item) {
        const parsedItem = JSON.parse(item);

        if (schema) {
          const result = schema.safeParse(parsedItem);
          if (result.success) {
            setStoredValue(result.data);
          } else {
            console.error("Invalid data in localStorage:", result.error);
            setStoredValue(initialValue);
          }
        } else {
          setStoredValue(parsedItem);
        }
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      setStoredValue(initialValue);
    }
  }, [key, initialValue, schema]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      if (schema) {
        const result = schema.safeParse(valueToStore);
        if (!result.success) {
          console.error("Invalid data for localStorage:", result.error);
          return;
        }
      }

      setStoredValue(valueToStore);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  };

  return [storedValue, setValue];
}
