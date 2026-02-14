import "server-only";
import { PostHog } from "posthog-node";
import { NextJSFlagCacheProvider } from "./posthog-cache-provider";

// Singleton instance for local evaluation with caching
let posthogInstance: PostHog | undefined;

/**
 * Get or create a PostHog client instance with local evaluation enabled.
 * This instance is reused across requests to enable caching of feature flag definitions.
 * 
 * Local evaluation benefits:
 * - Feature flags are cached locally, reducing API calls
 * - Faster flag evaluation (no network request per evaluation)
 * - PostHog automatically refreshes flag definitions in the background
 * 
 * @returns PostHog client instance or undefined if not configured
 */
export default function PostHogClient() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return undefined;
  
  // Return existing instance if available (enables caching)
  if (posthogInstance) {
    return posthogInstance;
  }
  
  // Local evaluation requires personal API key
  if (!process.env.POSTHOG_PERSONAL_API_KEY) {
    console.warn(
      "PostHog: POSTHOG_PERSONAL_API_KEY is not set. " +
      "Local evaluation is disabled. Set the personal API key to enable local flag evaluation and caching."
    );
    // Create instance without local evaluation
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
    // Enable local evaluation for feature flags
    // This fetches and caches all flag definitions locally
    enableLocalEvaluation: true,
    // Poll for flag updates every 5 minutes
    featureFlagsPollingInterval: 300000,
    // Custom cache provider for distributed serverless environment
    flagDefinitionCacheProvider: cacheProvider,
  });
  
  return posthogInstance;
}

