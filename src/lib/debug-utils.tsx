/**
 * Debug utilities for live stream debugging
 *
 * Provides conditional logging and debugging features based on the
 * enableDebugLogs feature flag controlled via PostHog.
 * 
 * This can be toggled at runtime in the PostHog dashboard without redeployment.
 */

"use client";

import { useContext, createContext, type ReactNode, useEffect, useState } from "react";
import { getPostHog } from "./posthog-provider";

// Global state to track debug mode (set by React components)
let isDebugMode = false;

// Create a context for the debug flag
const DebugFlagContext = createContext<boolean>(false);

/**
 * Provider component to pass the debug flag value to children
 * This should wrap components that need access to the debug flag
 */
export function DebugFlagProvider({ value, children }: { value: boolean; children: ReactNode }) {
  // Update global state after render to avoid race conditions
  useEffect(() => {
    isDebugMode = value;
  }, [value]);
  
  return <DebugFlagContext.Provider value={value}>{children}</DebugFlagContext.Provider>;
}

/**
 * Hook to check if debug logging is enabled via PostHog feature flags
 * Returns false if the feature flag is not enabled
 * 
 * To enable:
 * 1. Set up feature flag "enableDebugLogs" in PostHog dashboard
 * 2. The flag is automatically evaluated on page load
 * 3. Changes take effect on next page load or when flag is reloaded
 */
export function useDebugEnabled(): boolean {
  const contextValue = useContext(DebugFlagContext);
  const [flagValue, setFlagValue] = useState(contextValue);

  useEffect(() => {
    // Update from context
    setFlagValue(contextValue);

    // Also check PostHog client-side for dynamic updates
    const posthog = getPostHog();
    if (posthog) {
      posthog.onFeatureFlags(() => {
        const enabled = posthog.isFeatureEnabled('enableDebugLogs');
        if (enabled !== undefined) {
          setFlagValue(!!enabled);
        }
      });
    }
  }, [contextValue]);

  return flagValue;
}

/**
 * Log a debug message to console if debug mode is enabled
 * This function can be used in both React and non-React code
 */
export function debugLog(prefix: string, message: string, ...args: unknown[]): void {
  if (isDebugMode) {
    console.log(`[DEBUG ${prefix}]`, message, ...args);
  }
}

/**
 * Format a timestamp as "X s ago"
 */
export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 1) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
