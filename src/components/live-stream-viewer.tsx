"use client";

import { useEffect, useState } from "react";
import { LiveStreamManager } from "@/lib/live-stream-manager";
import type {
  ServerEvent,
  LiveStreamGameMetadata,
  ClientEvent,
} from "@/lib/live-stream-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radio } from "lucide-react";
import {
  getStatusColor,
  getStatusText,
  calculateAverage,
} from "@/lib/live-stream-utils";

const WORKER_URL =
  process.env.NEXT_PUBLIC_LIVE_STREAM_WORKER_URL ||
  "http://localhost:8787";

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
      p.id === event.winnerId ? { ...p, roundsWon: p.roundsWon + 1 } : p,
    ),
    roundWinner: event.winnerId,
  };
}

function updateGameFinishMetadata(
  metadata: LiveStreamGameMetadata,
  event: Extract<ClientEvent, { type: "gameFinish" }>,
): LiveStreamGameMetadata {
  return {
    ...metadata,
    gameWinner: event.winnerId,
    gamePhase: "gameOver",
  };
}

export function LiveStreamViewer({ gameId }: LiveStreamViewerProps) {
  const [manager] = useState(() => new LiveStreamManager());
  const [metadata, setMetadata] = useState<LiveStreamGameMetadata | null>(
    null,
  );
  const [status, setStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("connecting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Connect as viewer (no host secret)
    manager.connect(
      WORKER_URL,
      { gameId, hostSecret: "" },
      false, // not host
    );

    // Subscribe to events
    const unsubscribe = manager.subscribe((event: ServerEvent) => {
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
              setMetadata((prev) => (prev ? updateScoreMetadata(prev, clientEvent) : prev));
              break;

            case "undo":
              setMetadata((prev) => (prev ? undoScoreMetadata(prev, clientEvent) : prev));
              break;

            case "roundFinish":
              setMetadata((prev) => (prev ? updateRoundFinishMetadata(prev, clientEvent) : prev));
              break;

            case "gameFinish":
              setMetadata((prev) => (prev ? updateGameFinishMetadata(prev, clientEvent) : prev));
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
      manager.disconnect();
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
          <CardContent>
            <p className="text-center text-muted-foreground">
              {error || "Failed to connect to live stream"}
            </p>
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
      <div className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-card p-2">
        <Radio className={`h-4 w-4 ${getStatusColor(status)}`} />
        <span className="text-sm font-medium">{getStatusText(status, error)}</span>
        <span className="text-xs text-muted-foreground">
          · Viewing {metadata.players.map((p) => p.name).join(" vs ")}
        </span>
      </div>

      {/* Score Display */}
      <div className="mx-auto w-full max-w-2xl space-y-4">
        {/* Game Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              Round {metadata.currentRound} · Best of {metadata.roundsToWin}
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
                    <p className="text-sm text-muted-foreground">
                      Currently throwing
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">{player.score}</div>
                  <div className="text-sm text-muted-foreground">
                    Rounds won: {player.roundsWon}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  Average: {calculateAverage(player.totalScore, player.dartsThrown)}
                </span>
                <span>Darts: {player.dartsThrown}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Game Over */}
        {metadata.gamePhase === "gameOver" && metadata.gameWinner && (
          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                🎯 Game Over! 🎯
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-xl font-bold">
                {metadata.players.find((p) => p.id === metadata.gameWinner)
                  ?.name}{" "}
                wins!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
