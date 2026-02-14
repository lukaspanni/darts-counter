import "server-only";
import type {
  FlagDefinitionCacheProvider,
  FlagDefinitionCacheData,
} from "posthog-node/experimental";

// Module-level cache storage
let cachedFlagData: FlagDefinitionCacheData | undefined;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes to match PostHog polling

/**
 * Next.js-based cache provider for PostHog flag definitions.
 * 
 * This implementation provides a simple in-memory cache that persists
 * within the serverless function instance. In distributed environments:
 * - Each instance maintains its own cache
 * - PostHog's local evaluation handles flag computation locally
 * - Reduced API calls since flags are cached per instance
 * 
 * For true distributed caching across instances, consider using Vercel KV
 * or another shared cache backend (see documentation).
 */
export class NextJSFlagCacheProvider implements FlagDefinitionCacheProvider {
  private projectKey: string;
  
  constructor(projectKey: string) {
    this.projectKey = projectKey;
  }

  /**
   * Retrieve cached flag definitions.
   * Returns cached data if within TTL, undefined otherwise.
   */
  getFlagDefinitions(): FlagDefinitionCacheData | undefined {
    const now = Date.now();
    if (cachedFlagData && now - lastFetchTime < CACHE_TTL) {
      return cachedFlagData;
    }
    return undefined;
  }

  /**
   * Determines if this instance should fetch new flag definitions.
   * Returns true if cache is stale or empty.
   */
  shouldFetchFlagDefinitions(): boolean {
    const now = Date.now();
    return !cachedFlagData || now - lastFetchTime >= CACHE_TTL;
  }

  /**
   * Store flag definitions in cache after successful fetch.
   */
  onFlagDefinitionsReceived(data: FlagDefinitionCacheData): void {
    cachedFlagData = data;
    lastFetchTime = Date.now();
  }

  /**
   * Cleanup on shutdown - clear cache.
   */
  shutdown(): void {
    cachedFlagData = undefined;
    lastFetchTime = 0;
  }
}

