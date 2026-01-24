import { type UiSettings, uiSettingsSchema } from "@/lib/schemas";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/local-storage";
import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "ui-settings";
const SETTINGS_UPDATED_EVENT = "ui-settings-updated";
const LARGE_SCREEN_QUERY = "(min-width: 1024px)";

const defaultSettings: UiSettings = {
  enhancedView: true,
};

export function useUiSettings() {
  const [settings, setSettings] = useState<UiSettings>(defaultSettings);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const wasLargeScreenRef = useRef(false);
  const enforceSmallScreenDefaults = useCallback(() => {
    setSettings((prev) => {
      if (!prev.enhancedView) return prev;
      const next = { ...prev, enhancedView: false };
      saveToLocalStorage(STORAGE_KEY, next);
      window.dispatchEvent(new Event(SETTINGS_UPDATED_EVENT));
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia(LARGE_SCREEN_QUERY);
    const updateMatch = () => setIsLargeScreen(mediaQuery.matches);
    updateMatch();
    mediaQuery.addEventListener("change", updateMatch);
    return () => mediaQuery.removeEventListener("change", updateMatch);
  }, []);

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

  useEffect(() => {
    if (wasLargeScreenRef.current && !isLargeScreen) {
      enforceSmallScreenDefaults();
    }
    wasLargeScreenRef.current = isLargeScreen;
  }, [enforceSmallScreenDefaults, isLargeScreen]);

  const updateSettings = (updates: Partial<UiSettings>) => {
    setSettings((prev) => {
      if (!isLargeScreen && updates.enhancedView) {
        return prev;
      }
      const next = { ...prev, ...updates };
      saveToLocalStorage(STORAGE_KEY, next);
      window.dispatchEvent(new Event(SETTINGS_UPDATED_EVENT));
      return next;
    });
  };

  return {
    settings,
    updateSettings,
    isLargeScreen,
    isEnhancedViewActive: isLargeScreen && settings.enhancedView,
    enforceSmallScreenDefaults,
  };
}
