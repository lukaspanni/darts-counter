import "server-only";
import { PostHog } from "posthog-node";

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
  
  // Create new instance with local evaluation
  posthogInstance = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
    personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY,
    // Enable local evaluation for feature flags
    // This fetches and caches all flag definitions locally
    enableLocalEvaluation: true,
    // Poll for flag updates every 5 minutes (default is 5 minutes)
    featureFlagsPollingInterval: 300000,
  });
  
  return posthogInstance;
}
