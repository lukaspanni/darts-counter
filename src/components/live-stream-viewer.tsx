"use client";

import { useEffect, useState, useRef } from "react";
import { getViewerManager } from "@/lib/live-stream-manager";
import type {
  ServerEvent,
  LiveStreamGameMetadata,
  ClientEvent,
} from "@/lib/live-stream-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Radio, RefreshCw } from "lucide-react";
import {
  getStatusColor,
  getStatusText,
  calculateAverage,
} from "@/lib/live-stream-utils";
import { formatTimeAgo } from "@/lib/debug-utils";
import { useFeatureFlagEnabled } from "posthog-js/react";

const WORKER_URL =
  process.env.NEXT_PUBLIC_LIVE_STREAM_WORKER_URL || "http://localhost:8787";

interface LiveStreamViewerProps {
  gameId: string;
}

// Helper functions for metadata updates
function updateScoreMetadata(
  metadata: LiveStreamGameMetadata,
  event: Extract<ClientEvent, { type: "score" }>,
): LiveStreamGameMetadata {
  return {
    ...metadata,
    players: metadata.players.map((p) =>
      p.id === event.playerId
        ? {
            ...p,
            score: event.newScore,
            totalScore: p.totalScore + event.validatedScore,
            dartsThrown: p.dartsThrown + 1,
          }
        : p,
    ),
  };
}

function undoScoreMetadata(
  metadata: LiveStreamGameMetadata,
  event: Extract<ClientEvent, { type: "undo" }>,
): LiveStreamGameMetadata {
  return {
    ...metadata,
    players: metadata.players.map((p) =>
      p.id === event.playerId
        ? {
            ...p,
            score: p.score + event.lastScore,
            totalScore: p.totalScore - event.lastScore,
            dartsThrown: p.dartsThrown - 1,
          }
        : p,
    ),
  };
}

function updateRoundFinishMetadata(
  metadata: LiveStreamGameMetadata,
  event: Extract<ClientEvent, { type: "roundFinish" }>,
): LiveStreamGameMetadata {
  if (!event.winnerId) return metadata;

  return {
    ...metadata,
    players: metadata.players.map((p) =>
      p.id === event.winnerId ? { ...p, legsWon: p.legsWon + 1 } : p,
    ),
    legWinner: event.winnerId,
  };
}

function updateGameFinishMetadata(
  metadata: LiveStreamGameMetadata,
  event: Extract<ClientEvent, { type: "gameFinish" }>,
): LiveStreamGameMetadata {
  return {
    ...metadata,
    matchWinner: event.winnerId,
    gamePhase: "gameOver",
  };
}

export function LiveStreamViewer({ gameId }: LiveStreamViewerProps) {
  const managerRef = useRef(getViewerManager(gameId));
  const [metadata, setMetadata] = useState<LiveStreamGameMetadata | null>(null);
  const [status, setStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("connecting");
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [lastEventTime, setLastEventTime] = useState<string | null>(null);
  const lastEventAtRef = useRef<number>(Date.now());
  const staleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debugEnabled = useFeatureFlagEnabled("enableDebugLogs");

  // Update last event time every second when debug is enabled
  useEffect(() => {
    if (!debugEnabled) return;

    const updateLastEventTime = () => {
      const lastReceived = managerRef.current.getLastEventReceivedAt();
      if (lastReceived) {
        setLastEventTime(formatTimeAgo(lastReceived));
      } else {
        setLastEventTime(null);
      }
    };

    updateLastEventTime();
    const interval = setInterval(updateLastEventTime, 1000);

    return () => clearInterval(interval);
  }, [debugEnabled]);

  // Update manager ref if gameId changes
  useEffect(() => {
    managerRef.current = getViewerManager(gameId);
  }, [gameId]);

  const handleRetry = () => {
    setStatus("connecting");
    setError(null);
    managerRef.current.retryConnection();
  };

  useEffect(() => {
    const manager = managerRef.current;

    const clearStaleTimeout = () => {
      if (staleTimeoutRef.current) {
        clearTimeout(staleTimeoutRef.current);
      }
    };

    const scheduleStaleCheck = () => {
      clearStaleTimeout();
      staleTimeoutRef.current = setTimeout(() => {
        const elapsed = Date.now() - lastEventAtRef.current;
        setIsStale(elapsed > 45000);
      }, 45000);
    };

    lastEventAtRef.current = Date.now();
    setIsStale(false);
    scheduleStaleCheck();

    // Connect as viewer (no host secret)
    manager.connect(
      WORKER_URL,
      { gameId, hostSecret: "" },
      false, // not host
    );

    // Subscribe to connection state changes
    const unsubscribeState = manager.subscribeToConnectionState((connState) => {
      if (connState === "connected") {
        setStatus("connected");
      } else if (connState === "connecting" || connState === "reconnecting") {
        setStatus("connecting");
      } else if (connState === "disconnected") {
        // Only set to disconnected if we weren't already connected
        // (auto-reconnect will handle it)
      }
    });

    // Subscribe to events
    const unsubscribe = manager.subscribe((event: ServerEvent) => {
      lastEventAtRef.current = Date.now();
      setIsStale(false);
      scheduleStaleCheck();
      switch (event.type) {
        case "sync":
          // Initial state - sets all values absolutely
          setMetadata(event.metadata);
          setStatus("connected");
          setError(null);
          break;

        case "broadcast": {
          const clientEvent = event.event;

          // Handle each event type with proper typing
          switch (clientEvent.type) {
            case "gameUpdate":
              // Full game state update
              setMetadata(clientEvent.metadata);
              break;

            case "score":
              setMetadata((prev) =>
                prev ? updateScoreMetadata(prev, clientEvent) : prev,
              );
              break;

            case "undo":
              setMetadata((prev) =>
                prev ? undoScoreMetadata(prev, clientEvent) : prev,
              );
              break;

            case "roundFinish":
              setMetadata((prev) =>
                prev ? updateRoundFinishMetadata(prev, clientEvent) : prev,
              );
              break;

            case "gameFinish":
              setMetadata((prev) =>
                prev ? updateGameFinishMetadata(prev, clientEvent) : prev,
              );
              break;
          }
          break;
        }

        case "error":
          setStatus("error");
          setError(event.message);
          break;
      }
    });

    return () => {
      unsubscribe();
      unsubscribeState();
      clearStaleTimeout();
      // Don't disconnect on cleanup - the singleton handles this
      // Only remove if navigating away from this game entirely
    };
  }, [gameId]);

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-500">
              Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-center">
              {error || "Failed to connect to live stream"}
            </p>
            <div className="flex justify-center">
              <Button onClick={handleRetry} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metadata || status === "connecting") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Radio className="h-5 w-5 animate-pulse text-yellow-500" />
                Connecting to Live Stream...
              </div>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col p-4">
      {/* Status Bar */}
      <div className="bg-card mb-4 flex items-center justify-center gap-2 rounded-lg p-2">
        <Radio className={`h-4 w-4 ${getStatusColor(status)}`} />
        <span className="text-sm font-medium">
          {getStatusText(status, error)}
        </span>
        <span className="text-muted-foreground text-xs">
          · Viewing {metadata.players.map((p) => p.name).join(" vs ")}
        </span>
        {debugEnabled && lastEventTime && (
          <span className="text-muted-foreground text-xs">
            · Last event: {lastEventTime}
          </span>
        )}
        {isStale && (
          <span className="text-xs font-medium text-amber-600">
            · Stream stale (no updates)
          </span>
        )}
      </div>

      {/* Score Display */}
      <div className="mx-auto w-full max-w-2xl space-y-4">
        {/* Game Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              Leg {Math.max(1, metadata.currentLeg)} ·{" "}
              {metadata.gameMode === "bestOf" ? "Best of" : "First to"}{" "}
              {metadata.legsToWin}
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Players */}
        {metadata.players.map((player) => (
          <Card
            key={player.id}
            className={
              player.id === metadata.activePlayerId
                ? "border-primary"
                : undefined
            }
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{player.name}</h3>
                  {player.id === metadata.activePlayerId && (
                    <p className="text-muted-foreground text-sm">
                      Currently throwing
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">{player.score}</div>
                  <div className="text-muted-foreground text-sm">
                    Legs won: {player.legsWon}
                    Legs won: {player.legsWon}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex justify-between text-sm">
                <span>
                  Average:{" "}
                  {calculateAverage(player.totalScore, player.dartsThrown)}
                </span>
                <span>Darts: {player.dartsThrown}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Match Over */}
        {metadata.gamePhase === "gameOver" && metadata.matchWinner && (
          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                🎯 Match Over! 🎯
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-xl font-bold">
                {
                  metadata.players.find((p) => p.id === metadata.matchWinner)
                    ?.name
                }{" "}
                wins!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
