import "server-only";
import type {
  FlagDefinitionCacheProvider,
  FlagDefinitionCacheData,
} from "posthog-node/experimental";
import { createClient } from "redis";

const CACHE_TTL_SECONDS = 5 * 60;
const LOCK_TTL_SECONDS = 60;
const KEY_PREFIX = "posthog:flag-definitions";
const KEY_LOCK_SUFFIX = "lock";

type RedisClient = ReturnType<typeof createClient>;

let redisClient: RedisClient | undefined;
let redisClientPromise: Promise<RedisClient> | undefined;

const getRedisClient = async (): Promise<RedisClient | undefined> => {
  const url = process.env.REDIS_URL;
  if (!url) {
    return undefined;
  }

  if (redisClient) {
    return redisClient;
  }

  if (!redisClientPromise) {
    const client = createClient({ url });
    client.on("error", (error: unknown) => {
      console.warn("PostHog Redis cache error:", error);
    });
    redisClientPromise = client.connect().then(() => {
      redisClient = client;
      return client;
    });
  }

  return redisClientPromise;
};

const resolveCacheKey = () => {
  const teamKey = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "unknown";
  return `${KEY_PREFIX}:${teamKey}`;
};

const resolveLockKey = () => `${resolveCacheKey()}:${KEY_LOCK_SUFFIX}`;

/**
 * Next.js cache provider for PostHog flag definitions backed by Redis.
 *
 * This implementation stores flag definitions in Redis so all serverless instances
 * share the same cache. It also uses a Redis-based lock to ensure only one instance
 * refreshes flags at a time.
 */
export class NextJSFlagCacheProvider implements FlagDefinitionCacheProvider {
  /**
   * Retrieve cached flag definitions from Redis.
   * Returns cached data if available, undefined otherwise.
   */
  async getFlagDefinitions(): Promise<FlagDefinitionCacheData | undefined> {
    const client = await getRedisClient();
    if (!client) {
      return undefined;
    }

    const cached = await client.get(resolveCacheKey());
    if (!cached) {
      return undefined;
    }

    return JSON.parse(cached) as FlagDefinitionCacheData;
  }

  /**
   * Determines if this instance should fetch new flag definitions.
   * Uses a short-lived Redis lock to coordinate refreshes across instances.
   */
  async shouldFetchFlagDefinitions(): Promise<boolean> {
    const client = await getRedisClient();
    if (!client) {
      return true;
    }

    const lockKey = resolveLockKey();
    const acquired = await client.set(lockKey, "1", {
      NX: true,
      EX: LOCK_TTL_SECONDS,
    });

    return acquired === "OK";
  }

  /**
   * Store flag definitions in Redis after successful fetch.
   */
  async onFlagDefinitionsReceived(
    data: FlagDefinitionCacheData,
  ): Promise<void> {
    const client = await getRedisClient();
    if (!client) {
      return;
    }

    await client.set(resolveCacheKey(), JSON.stringify(data), {
      EX: CACHE_TTL_SECONDS,
    });
    await client.del(resolveLockKey());
  }

  /**
   * Cleanup on shutdown - clear any held lock.
   */
  async shutdown(): Promise<void> {
    const client = await getRedisClient();
    if (!client) {
      return;
    }

    await client.del(resolveLockKey());
    await client.quit();
    redisClient = undefined;
    redisClientPromise = undefined;
  }
}
