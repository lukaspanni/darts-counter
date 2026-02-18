import "server-only";
import { PostHog } from "posthog-node";
import { NextJSFlagCacheProvider } from "./posthog-cache-provider";

let posthogInstance: PostHog | undefined;

/**
 * Get or create a PostHog client instance.
 * @returns PostHog client instance or undefined if not configured
 */
export default function PostHogClient() {
  if (posthogInstance) return posthogInstance;

  // At least the public API key is required to create a client instance
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return undefined;

  // Local evaluation requires personal API key!
  if (!process.env.POSTHOG_PERSONAL_API_KEY) {
    console.warn(
      "PostHog: POSTHOG_PERSONAL_API_KEY is not set. " +
        "Local evaluation is disabled. Set the personal API key to enable local flag evaluation and caching.",
    );
    posthogInstance = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
    return posthogInstance;
  }

  // Create new instance with local evaluation and custom cache provider
  const cacheProvider = new NextJSFlagCacheProvider();

  posthogInstance = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
    personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY,
    enableLocalEvaluation: true,
    flagDefinitionCacheProvider: cacheProvider,
  });

  return posthogInstance;
}
