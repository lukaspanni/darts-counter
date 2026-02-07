/**
 * PostHog server-side integration for feature flags
 *
 * This file provides server-side PostHog client initialization
 * for evaluating feature flags in server components.
 *
 * Setup Instructions:
 * 1. Create a PostHog account at https://posthog.com
 * 2. Get your Project API Key from PostHog Settings > Project > Project Variables
 * 3. Add to your environment variables (.env.local):
 *    NEXT_PUBLIC_POSTHOG_KEY=phc_your_api_key_here
 *    NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com (or your self-hosted URL)
 * 4. For server-side flag evaluation, also add:
 *    POSTHOG_PERSONAL_API_KEY=your_personal_api_key_here
 *    (Get from PostHog Settings > User > Personal API Keys)
 */

import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

/**
 * Get or create the server-side PostHog client
 */
export function getPostHogClient(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    console.warn("NEXT_PUBLIC_POSTHOG_KEY not set - feature flags disabled");
    return null;
  }

  posthogClient ??= new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY,
  });

  return posthogClient;
}

/**
 * Evaluate a feature flag for a given user or identifier
 * Returns the default value if PostHog is not configured
 */
export async function evaluateFeatureFlag(
  flagKey: string,
  distinctId = "anonymous",
  defaultValue = false,
): Promise<boolean> {
  const client = getPostHogClient();

  if (!client) {
    return defaultValue;
  }

  try {
    const result = await client.isFeatureEnabled(flagKey, distinctId);
    return result ?? defaultValue;
  } catch (error) {
    console.error("Error evaluating feature flag:", error);
    return defaultValue;
  }
}

/**
 * Shutdown the PostHog client (call this on app shutdown)
 */
export async function shutdownPostHog(): Promise<void> {
  if (posthogClient) {
    await posthogClient.shutdown();
    posthogClient = null;
  }
}
