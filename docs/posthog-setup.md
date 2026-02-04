# PostHog Feature Flags Setup Guide

## Overview

This project uses PostHog for feature flags and analytics. Feature flags allow you to toggle features on/off without redeployment, enabling/disabling them for specific users or rolling them out gradually.

## Initial Setup

### 1. Create PostHog Account

1. Go to [https://posthog.com](https://posthog.com) and sign up for a free account
   - Alternatively, you can self-host PostHog: [https://posthog.com/docs/self-host](https://posthog.com/docs/self-host)
2. Create a new project or use an existing one

### 2. Get Your API Keys

#### Project API Key (Required)
1. In PostHog dashboard, go to **Settings > Project > Project Variables**
2. Copy the **Project API Key** (starts with `phc_`)
3. This key is used for both client and server-side PostHog integration

#### Personal API Key (Optional, but recommended for server-side flags)
1. Go to **Settings > User > Personal API Keys**
2. Click **Create personal API key**
3. Give it a descriptive name (e.g., "Darts Counter Server")
4. Select **Read** permissions
5. Click **Create key** and copy the generated key

### 3. Configure Environment Variables

1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your keys:
   ```bash
   # Required: Project API Key for client and server
   NEXT_PUBLIC_POSTHOG_KEY=phc_your_actual_project_api_key_here
   
   # Required: PostHog host URL (use your self-hosted URL if applicable)
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   
   # Optional: Personal API Key for server-side flag evaluation
   # Without this, server-side flags will use default values
   POSTHOG_PERSONAL_API_KEY=your_actual_personal_api_key_here
   ```

3. **Important Notes:**
   - Variables with `NEXT_PUBLIC_` prefix are exposed to the browser
   - `POSTHOG_PERSONAL_API_KEY` is server-only (no prefix) for security
   - Never commit `.env.local` to version control (it's in .gitignore)

### 4. Create Feature Flags in PostHog

1. In PostHog dashboard, go to **Feature Flags**
2. Click **New feature flag**
3. Create the debug flag:
   - **Key:** `enableDebugLogs`
   - **Name:** Enable Debug Logs
   - **Type:** Boolean
   - **Description:** Enable detailed debug logging for live stream WebSocket connections
4. Configure rollout:
   - **Everyone:** Turn on for all users
   - **Specific users:** Target by email or distinct ID
   - **Percentage rollout:** Gradually roll out (e.g., 10%, 50%, 100%)
5. Click **Save**

## Using Feature Flags

### Current Feature Flags

#### `enableDebugLogs`
- **Type:** Boolean
- **Purpose:** Enables debug tooling for live stream WebSocket connections
- **Features when enabled:**
  - Console logging of all sent/received WebSocket events
  - Status indicators showing "Last event: X s ago"
  - Debug panel for hosts (manual event crafting, reconnect/close controls)
  - Structured JSON logs in Cloudflare Workers
- **Default:** `false` (disabled)

### Testing Feature Flags

1. **Test locally:**
   - Set up environment variables as described above
   - Toggle the flag in PostHog dashboard
   - Refresh your browser to see changes

2. **Test in production:**
   - Deploy your app with environment variables set
   - Use PostHog's targeting to enable for specific users:
     - By email: `email = your@email.com`
     - By distinct ID: `distinct_id = anonymous` (default for unauthenticated)
     - By percentage: Roll out to X% of users

3. **Debug flag not working?**
   - Check browser console for PostHog initialization message
   - Verify API keys are correct in `.env.local`
   - Check PostHog dashboard for flag status
   - Ensure flag key matches exactly: `enableDebugLogs`

## Advanced Configuration

### User Identification

By default, the app uses `'anonymous'` as the distinct ID. To identify users:

```typescript
import { getPostHog } from '@/lib/posthog-provider';

const posthog = getPostHog();
if (posthog) {
  posthog.identify('user-id', {
    email: 'user@example.com',
    name: 'User Name',
  });
}
```

### Adding New Feature Flags

1. Create the flag in PostHog dashboard
2. Use in server components:
   ```typescript
   import { evaluateFeatureFlag } from '@/lib/posthog-server';
   
   const myFlag = await evaluateFeatureFlag('myFlagKey', 'user-id', false);
   ```

3. Use in client components:
   ```typescript
   import { getPostHog } from '@/lib/posthog-provider';
   
   const posthog = getPostHog();
   const isEnabled = posthog?.isFeatureEnabled('myFlagKey');
   ```

### Self-Hosted PostHog

If using self-hosted PostHog:

1. Update `NEXT_PUBLIC_POSTHOG_HOST` to your instance URL:
   ```bash
   NEXT_PUBLIC_POSTHOG_HOST=https://your-posthog-instance.com
   ```

2. Follow the same setup steps above

## Troubleshooting

### Flags not loading
- **Check:** Environment variables are set correctly
- **Check:** PostHog key starts with `phc_`
- **Check:** Browser console for errors
- **Solution:** Verify keys in PostHog dashboard match `.env.local`

### Server-side flags always return default
- **Check:** `POSTHOG_PERSONAL_API_KEY` is set
- **Check:** Personal API key has correct permissions
- **Solution:** Regenerate personal API key with Read permissions

### Flags work locally but not in production
- **Check:** Environment variables are set in deployment platform (Vercel/etc)
- **Check:** Using correct host URL for your region
- **Solution:** Add environment variables in deployment settings

## Resources

- [PostHog Documentation](https://posthog.com/docs)
- [PostHog Feature Flags Guide](https://posthog.com/docs/feature-flags)
- [PostHog Next.js Integration](https://posthog.com/docs/libraries/next-js)
