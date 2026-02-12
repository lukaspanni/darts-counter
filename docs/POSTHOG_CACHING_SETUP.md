# PostHog Server-Side Feature Flags with Caching

This document explains the PostHog caching implementation for server-side feature flag evaluation in the Vercel-hosted Darts Counter application.

## Overview

The application uses PostHog for feature flags with an optimized caching strategy that:
- Reduces API calls to PostHog servers
- Improves response times for feature flag evaluations
- Works seamlessly on Vercel without additional infrastructure
- Automatically refreshes cached data to ensure flags stay up-to-date

## Implementation Details

### Caching Strategy

The implementation uses a **two-tier caching approach**:

#### 1. PostHog Client Instance Caching (Local Evaluation)
- A singleton PostHog client instance is maintained across requests
- The client automatically fetches and caches all feature flag definitions
- PostHog SDK refreshes flag definitions in the background
- No network request needed for flag evaluation once cached

#### 2. Next.js Data Cache
- Feature flag evaluation results are cached using Next.js `unstable_cache` API
- Cache duration: 60 seconds per user/flag combination
- Works on Vercel Edge Runtime without additional configuration
- Supports cache invalidation via tags

### Benefits

✅ **Performance**: Flag evaluations are served from cache (sub-millisecond response time)  
✅ **Reduced API Calls**: Significantly fewer requests to PostHog API  
✅ **Cost Effective**: No additional infrastructure required (no Redis/KV store needed)  
✅ **Vercel Optimized**: Uses Vercel's built-in caching mechanism  
✅ **Zero Configuration**: Works out-of-the-box on Vercel deployment  

## Configuration

### Required Environment Variables

Set these environment variables in your Vercel project:

1. **`NEXT_PUBLIC_POSTHOG_KEY`** (Required)
   - Your PostHog Project API Key
   - Get it from: PostHog Dashboard → Settings → Project → Project Variables
   - Example: `phc_xxxxxxxxxxxxxxxxxxxxx`

2. **`NEXT_PUBLIC_POSTHOG_HOST`** (Required)
   - PostHog API host URL
   - Use `https://us.i.posthog.com` for US instance
   - Use `https://eu.i.posthog.com` for EU instance (recommended for GDPR)
   - Example: `https://eu.i.posthog.com`

3. **`POSTHOG_PERSONAL_API_KEY`** (Required for server-side evaluation)
   - Your PostHog Personal API Key
   - Get it from: PostHog Dashboard → Settings → User → Personal API Keys
   - Example: `phx_xxxxxxxxxxxxxxxxxxxxx`
   - ⚠️ **Important**: Do NOT prefix with `NEXT_PUBLIC_` (server-only secret)

### Vercel Dashboard Setup

#### Step 1: Navigate to Environment Variables
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**

#### Step 2: Add PostHog Variables
Add the following environment variables:

| Variable Name | Value | Environments |
|---------------|-------|--------------|
| `NEXT_PUBLIC_POSTHOG_KEY` | `phc_your_key_here` | Production, Preview, Development |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://eu.i.posthog.com` | Production, Preview, Development |
| `POSTHOG_PERSONAL_API_KEY` | `phx_your_personal_key` | Production, Preview, Development |

#### Step 3: Redeploy
1. Click **Save** for each environment variable
2. Redeploy your application to apply the changes

> **Note**: Vercel automatically encrypts and secures your environment variables.

## Vercel KV Alternative (Optional)

If you need more advanced caching (e.g., shared cache across serverless functions), you can optionally upgrade to Vercel KV:

### When to Use Vercel KV
- You need longer cache TTL (hours/days instead of 60 seconds)
- You want shared cache state across multiple serverless functions
- You have high traffic and want to minimize PostHog API calls further
- You're on Vercel Pro plan or higher

### Setup with Vercel KV

1. **Enable Vercel KV Storage**
   - Go to Vercel Dashboard → Your Project → Storage
   - Click "Create Database" → Select "KV"
   - Follow the setup wizard

2. **Install Vercel KV Package**
   ```bash
   pnpm add @vercel/kv
   ```

3. **Update Implementation** (example):
   ```typescript
   // src/lib/posthog-cache.ts
   import { kv } from '@vercel/kv';
   
   export async function getCachedFlags(distinctId: string) {
     const cacheKey = `posthog:flags:${distinctId}`;
     const cached = await kv.get(cacheKey);
     
     if (cached) return cached;
     
     const posthog = PostHogClient();
     const flags = await posthog.getAllFlags(distinctId);
     
     // Cache for 5 minutes
     await kv.set(cacheKey, flags, { ex: 300 });
     
     return flags;
   }
   ```

4. **Environment Variables** (auto-configured by Vercel):
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

> **Note**: Current implementation uses Next.js cache which is sufficient for most use cases. Vercel KV is optional and only needed for advanced scenarios.

## Cache Invalidation

### Automatic Invalidation
- Feature flag cache automatically expires after 60 seconds
- PostHog client refreshes flag definitions in the background

### Manual Invalidation (if needed)
If you need to force-refresh flags immediately:

```typescript
import { revalidateTag } from 'next/cache';

// Invalidate all flags for a specific user
revalidateTag(`user-${distinctId}`);

// Invalidate a specific flag
revalidateTag(`feature-flag-${flagKey}`);

// Invalidate all flags
revalidateTag('feature-flags');
```

## Monitoring and Debugging

### Verify Caching is Working

1. **Check Response Times**
   - First request: ~100-200ms (fetches from PostHog)
   - Subsequent requests: <10ms (served from cache)

2. **Enable PostHog Debug Logs** (in development)
   ```bash
   DEBUG=posthog* npm run dev
   ```

3. **Monitor Cache Hit Rate**
   - Check Vercel Analytics → Functions → Cache Performance
   - Look for reduced PostHog API calls in PostHog dashboard

### Common Issues

**Issue**: Feature flags not updating immediately  
**Solution**: This is expected behavior (60s cache). Adjust `revalidate` value in `get-feature-flags.ts` if needed.

**Issue**: Different flag values on different serverless function instances  
**Solution**: This is normal due to distributed caching. Values converge within cache TTL (60s).

## Performance Considerations

### Cache Duration
- **Current**: 60 seconds
- **Adjust**: Change `revalidate` value in `src/lib/get-feature-flags.ts`
- **Trade-off**: Longer cache = fewer API calls but slower flag updates

### Memory Usage
- PostHog client instance: ~1-5 MB (flag definitions)
- Per-user flag cache: ~1 KB per user
- Total impact: Negligible for typical Vercel function limits

## References

- [PostHog Local Evaluation Guide](https://posthog.com/docs/feature-flags/local-evaluation)
- [PostHog Distributed Environments](https://posthog.com/docs/feature-flags/local-evaluation/distributed-environments)
- [Next.js Data Cache](https://nextjs.org/docs/app/building-your-application/caching)
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)

## Support

For questions or issues:
1. Check PostHog dashboard for API key validity
2. Verify environment variables are set correctly in Vercel
3. Check Vercel function logs for errors
4. Review PostHog SDK logs with `DEBUG=posthog*`
