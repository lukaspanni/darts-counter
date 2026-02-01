/**
 * Debug utilities for live stream debugging
 *
 * Provides conditional logging and debugging features based on the
 * NEXT_PUBLIC_ENABLE_DEBUG_LOGS environment variable.
 */

/**
 * Check if debug logging is enabled via environment variable
 * Returns false if the environment variable is not set or not equal to "true"
 */
export function isDebugEnabled(): boolean {
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
