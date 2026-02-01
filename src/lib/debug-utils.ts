/**
 * Debug utilities for live stream debugging
 *
 * Provides conditional logging and debugging features based on the
 * enableDebugLogs feature flag.
 * 
 * This can be controlled via:
 * 1. Vercel feature flags (runtime toggle) - requires setup in Vercel dashboard
 * 2. NEXT_PUBLIC_ENABLE_DEBUG_LOGS environment variable (build-time default)
 */

/**
 * Check if debug logging is enabled via environment variable or Vercel flags
 * Returns false if the feature is not enabled
 * 
 * To enable via Vercel flags:
 * 1. Set up feature flag "enableDebugLogs" in Vercel dashboard
 * 2. Access via window.vercelFlags?.enableDebugLogs
 * 
 * To enable via environment variable:
 * Set NEXT_PUBLIC_ENABLE_DEBUG_LOGS=true
 */
export function isDebugEnabled(): boolean {
  // Check Vercel flags first (if available in browser)
  if (typeof window !== "undefined" && "vercelFlags" in window) {
    const flags = window as Window & { vercelFlags?: { enableDebugLogs?: boolean } };
    if (typeof flags.vercelFlags?.enableDebugLogs === "boolean") {
      return flags.vercelFlags.enableDebugLogs;
    }
  }
  
  // Fall back to environment variable
  return process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS === "true";
}

/**
 * Log a debug message to console if debug mode is enabled
 */
export function debugLog(prefix: string, message: string, ...args: unknown[]): void {
  if (isDebugEnabled()) {
    console.log(`[DEBUG ${prefix}]`, message, ...args);
  }
}

/**
 * Format a timestamp as "X s ago"
 */
export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 1) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
