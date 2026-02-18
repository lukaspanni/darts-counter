"use server";

import PostHogClient from "./posthog-server";

/**
 * Get all feature flags for a user with caching.
 *
 * Caching strategy:
 * - Uses Next.js 16 "use cache" directive for automatic distributed caching
 * - Flags are cached per distinctId for 60 seconds (configured in next.config.mjs)
 * - Cache persists across requests in production (Vercel distributed cache)
 * - In development, cache is request-scoped only
 * - PostHog client also maintains local evaluation cache of flag definitions
 *
 * @param distinctId User identifier (empty string for anonymous users)
 * @returns Object with feature flag keys and values
 */
export async function getFeatureFlags(distinctId = "") {
  "use cache";

  const posthog = PostHogClient();
  if (!posthog) return {};
  return await posthog.getAllFlags(distinctId);
}

/**
 * Get a single feature flag value for a user with caching.
 *
 * Caching strategy:
 * - Uses Next.js 16 "use cache" directive for automatic distributed caching
 * - Flags are cached per flagKey and distinctId for 60 seconds
 * - Cache persists across requests in production (Vercel distributed cache)
 *
 * @param flagKey Feature flag key
 * @param distinctId User identifier (empty string for anonymous users)
 * @returns Feature flag value (boolean, string, or other types)
 */
export async function getFeatureFlag(flagKey: string, distinctId = "") {
  "use cache";

  const posthog = PostHogClient();
  if (!posthog) return false;
  return await posthog.getFeatureFlag(flagKey, distinctId);
}
