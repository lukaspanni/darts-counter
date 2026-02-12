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
 * 
 * @param distinctId User identifier (empty string for anonymous users)
 * @returns Object with feature flag keys and values
 */
export async function getFeatureFlags(distinctId = "") {
  const posthog = PostHogClient();
  if (!posthog) return {};
  
  // Create cached version with distinctId in cache key
  const getCachedFlags = unstable_cache(
    async () => {
      return await posthog.getAllFlags(distinctId);
    },
    ["feature-flags", distinctId],
    {
      revalidate: 60, // Cache for 60 seconds
      tags: ["feature-flags"],
    }
  );
  
  return await getCachedFlags();
}

/**
 * Get a single feature flag value for a user with caching.
 * 
 * @param flagKey Feature flag key
 * @param distinctId User identifier (empty string for anonymous users)
 * @returns Feature flag value (boolean, string, or other types)
 */
export async function getFeatureFlag(flagKey: string, distinctId = "") {
  const posthog = PostHogClient();
  if (!posthog) return false;
  
  // Create cached version with flagKey and distinctId in cache key
  const getCachedFlag = unstable_cache(
    async () => {
      return await posthog.getFeatureFlag(flagKey, distinctId);
    },
    ["feature-flag", flagKey, distinctId],
    {
      revalidate: 60, // Cache for 60 seconds
      tags: ["feature-flags"],
    }
  );
  
  return await getCachedFlag();
}
