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
  
  // Use Next.js caching for flag results
  // This reduces API calls and improves performance
  const getCachedFlags = unstable_cache(
    async (id: string) => {
      return await posthog.getAllFlags(id);
    },
    [`feature-flags-${distinctId}`],
    {
      revalidate: 60, // Cache for 60 seconds
      tags: [`feature-flags`, `user-${distinctId}`],
    }
  );
  
  return await getCachedFlags(distinctId);
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
  
  // Use Next.js caching for individual flag results
  const getCachedFlag = unstable_cache(
    async (key: string, id: string) => {
      return await posthog.getFeatureFlag(key, id);
    },
    [`feature-flag-${flagKey}-${distinctId}`],
    {
      revalidate: 60, // Cache for 60 seconds
      tags: [`feature-flag-${flagKey}`, `user-${distinctId}`],
    }
  );
  
  return await getCachedFlag(flagKey, distinctId);
}
