"use client";

import { type ReactNode } from "react";
import { DebugFlagProvider } from "@/lib/debug-utils";

/**
 * Client component wrapper for DebugFlagProvider
 * This allows us to pass server-evaluated flag values to client components
 */
export function DebugFlagWrapper({
  debugEnabled,
  children,
}: {
  debugEnabled: boolean;
  children: ReactNode;
}) {
  return <DebugFlagProvider value={debugEnabled}>{children}</DebugFlagProvider>;
}
