import { type UiSettings, uiSettingsSchema } from "@/lib/schemas";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/local-storage";
import { useEffect, useState } from "react";

const STORAGE_KEY = "ui-settings";

const defaultSettings: UiSettings = {
  enhancedView: false,
};

export function useUiSettings() {
  const [settings, setSettings] = useState<UiSettings>(defaultSettings);

  useEffect(() => {
    const { ok, result, error } = loadFromLocalStorage(
      STORAGE_KEY,
      uiSettingsSchema,
    );
    if (ok) {
      setSettings(result);
    } else {
      console.error("Failed to load UI settings from local storage:", error);
      saveToLocalStorage(STORAGE_KEY, defaultSettings);
    }
  }, []);

  const updateSettings = (updates: Partial<UiSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      saveToLocalStorage(STORAGE_KEY, next);
      return next;
    });
  };

  return { settings, updateSettings };
}
