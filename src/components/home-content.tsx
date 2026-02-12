"use client";

import { GameController } from "@/components/game-controller";
import { LiveStreamViewer } from "@/components/live-stream-viewer";
import { useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { useFeatureFlagEnabled } from "posthog-js/react";

export function HomeContent() {
  const searchParams = useSearchParams();
  const liveStreamId = searchParams.get("live-stream");
  posthog.featureFlags.ensureFlagsLoaded();
  posthog.onFeatureFlags((flags) => {
    console.log("Feature flags updated:", flags);
  });
  console.log("DEBUG LOGS", useFeatureFlagEnabled("enableDebugLogs"));

  if (liveStreamId) {
    return (
      <main className="grow flex-col">
        <LiveStreamViewer gameId={liveStreamId} />
      </main>
    );
  }

  return (
    <main className="grow flex-col p-4">
      <GameController />
    </main>
  );
}
