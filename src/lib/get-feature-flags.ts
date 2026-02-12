"use server";
import { unstable_cache } from "next/cache";
import PostHogClient from "./posthog-server";

/**
 * Get all feature flags for a user with caching.
 * 
 * Caching strategy:
 * - Flags are cached per distinctId for 60 seconds
 * - Uses Next.js cache which works on Vercel without additional setup
 * - PostHog client also maintains local evaluation cache of flag definitions
 * - unstable_cache automatically uses function parameters to differentiate cache entries
 * 
 * @param distinctId User identifier (empty string for anonymous users)
 * @returns Object with feature flag keys and values
 */
export const getFeatureFlags = unstable_cache(
  async (distinctId = "") => {
    const posthog = PostHogClient();
    if (!posthog) return {};
    return await posthog.getAllFlags(distinctId);
  },
  ["feature-flags"],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ["feature-flags"],
  }
);

/**
 * Get a single feature flag value for a user with caching.
 * 
 * Caching strategy:
 * - Flags are cached per flagKey and distinctId for 60 seconds
 * - unstable_cache automatically uses function parameters to differentiate cache entries
 * 
 * @param flagKey Feature flag key
 * @param distinctId User identifier (empty string for anonymous users)
 * @returns Feature flag value (boolean, string, or other types)
 */
export const getFeatureFlag = unstable_cache(
  async (flagKey: string, distinctId = "") => {
    const posthog = PostHogClient();
    if (!posthog) return false;
    return await posthog.getFeatureFlag(flagKey, distinctId);
  },
  ["feature-flag"],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ["feature-flags"],
  }
);
