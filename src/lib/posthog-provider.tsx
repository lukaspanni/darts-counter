"use client";

import { useEffect, type ReactNode } from "react";
import posthog from "posthog-js";

/**
 * PostHog provider component for client-side analytics and feature flags
 * 
 * This component initializes the PostHog client on the client side
 * and provides feature flag evaluation capabilities.
 */
export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialize PostHog only if API key is available
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only', // Only create profiles for identified users
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[PostHog] Initialized');
          }
        },
      });
    }

    return () => {
      // Cleanup is optional, PostHog handles this internally
    };
  }, []);

  return <>{children}</>;
}

/**
 * Get the PostHog client instance (client-side only)
 */
export function getPostHog() {
  if (typeof window === 'undefined') {
    return null;
  }
  return posthog;
}
