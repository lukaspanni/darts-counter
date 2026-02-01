/**
 * Vercel Feature Flags Configuration
 * 
 * This file defines feature flags that can be toggled at runtime
 * via the Vercel dashboard without redeployment.
 * 
 * See: https://vercel.com/docs/workflow-collaboration/feature-flags
 */

import { flag } from "@vercel/flags/next";

export const enableDebugLogs = flag<boolean>({
  key: "enableDebugLogs",
  async decide() {
    // Default to environment variable if flag not set
    return process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS === "true";
  },
  defaultValue: false,
  description: "Enable detailed debug logs for live stream debugging, including event logging, timestamps, and debug UI",
  origin: "https://github.com/lukaspanni/darts-counter",
  options: [
    { value: false, label: "Disabled" },
    { value: true, label: "Enabled" },
  ],
});

export const precompute = [enableDebugLogs];
