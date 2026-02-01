"use client";

import { GameController } from "@/components/game-controller";
import { LiveStreamViewer } from "@/components/live-stream-viewer";
import { useSearchParams } from "next/navigation";

export function HomeContent() {
  const searchParams = useSearchParams();
  const liveStreamId = searchParams.get("live-stream");

  if (liveStreamId) {
    return (
      <main className="flex-grow flex-col">
        <LiveStreamViewer gameId={liveStreamId} />
      </main>
    );
  }

  return (
    <main className="flex-grow flex-col p-4">
      <GameController />
    </main>
  );
}
