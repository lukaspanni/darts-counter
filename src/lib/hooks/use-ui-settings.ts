import { type UiSettings, uiSettingsSchema } from "@/lib/schemas";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/local-storage";
import { useEffect, useState } from "react";

const STORAGE_KEY = "ui-settings";
const SETTINGS_UPDATED_EVENT = "ui-settings-updated";

const defaultSettings: UiSettings = {
  enhancedView: false,
};

export function useUiSettings() {
  const [settings, setSettings] = useState<UiSettings>(defaultSettings);

  useEffect(() => {
    const syncSettings = () => {
      const { ok, result, error } = loadFromLocalStorage(
        STORAGE_KEY,
        uiSettingsSchema,
      );
      if (ok) {
        setSettings(result);
      } else {
        console.error("Failed to load UI settings from local storage:", error);
        saveToLocalStorage(STORAGE_KEY, defaultSettings);
        setSettings(defaultSettings);
      }
    };

    syncSettings();

    const handleUpdate = () => syncSettings();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener(SETTINGS_UPDATED_EVENT, handleUpdate);

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener(SETTINGS_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  const updateSettings = (updates: Partial<UiSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      saveToLocalStorage(STORAGE_KEY, next);
      window.dispatchEvent(new Event(SETTINGS_UPDATED_EVENT));
      return next;
    });
  };

  return { settings, updateSettings };
}
