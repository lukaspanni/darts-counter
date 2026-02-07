"use client";

import { useEffect, type ReactNode } from "react";
import posthog from "posthog-js";
import { PostHogProvider as ReactPostHogProvider } from "@posthog/react";

/**
 * PostHog provider component for client-side analytics and feature flags
 *
 * This component initializes the PostHog client on the client side
 * and provides feature flag evaluation capabilities.
 */
export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialize PostHog only if API key is available
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY || "";
    if (typeof window !== "undefined") {
      posthog.init(apiKey, {
        api_host: "/api/posthog",
        defaults: "2025-11-30",
        person_profiles: "identified_only", // Only create profiles for identified users
        loaded: () => {
          if (process.env.NODE_ENV === "development") {
            console.log("[PostHog] Initialized");
          }
        },
      });
    }
  }, []);

  return (
    <ReactPostHogProvider client={posthog}>{children}</ReactPostHogProvider>
  );
}

/**
 * Get the PostHog client instance (client-side only)
 */
export function getPostHog() {
  if (typeof window === "undefined") {
    return null;
  }
  return posthog;
}
