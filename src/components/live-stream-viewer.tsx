"use client";

import { useEffect, useState } from "react";
import { LiveStreamManager } from "@/lib/live-stream-manager";
import type {
  ServerEvent,
  LiveStreamGameMetadata,
} from "@/lib/live-stream-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radio } from "lucide-react";

const WORKER_URL =
  process.env.NEXT_PUBLIC_LIVE_STREAM_WORKER_URL ||
  "http://localhost:8787";

interface LiveStreamViewerProps {
  gameId: string;
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
      if (event.type === "sync") {
        setMetadata(event.metadata);
        setStatus("connected");
        setError(null);
      } else if (event.type === "broadcast") {
        // Handle different event types
        const clientEvent = event.event;
        
        if (clientEvent.type === "gameUpdate") {
          setMetadata(clientEvent.metadata);
        } else if (clientEvent.type === "score") {
          // Update the player's score
          setMetadata((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              players: prev.players.map((p) =>
                p.id === clientEvent.playerId
                  ? {
                      ...p,
                      score: clientEvent.newScore,
                      totalScore: p.totalScore + clientEvent.validatedScore,
                      dartsThrown: p.dartsThrown + 1,
                    }
                  : p,
              ),
            };
          });
        } else if (clientEvent.type === "undo") {
          // Handle undo
          setMetadata((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              players: prev.players.map((p) =>
                p.id === clientEvent.playerId
                  ? {
                      ...p,
                      score: p.score + clientEvent.lastScore,
                      totalScore: p.totalScore - clientEvent.lastScore,
                      dartsThrown: p.dartsThrown - 1,
                    }
                  : p,
              ),
            };
          });
        } else if (clientEvent.type === "roundFinish") {
          // Handle round finish
          if (clientEvent.winnerId) {
            setMetadata((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                players: prev.players.map((p) =>
                  p.id === clientEvent.winnerId
                    ? { ...p, roundsWon: p.roundsWon + 1 }
                    : p,
                ),
                roundWinner: clientEvent.winnerId,
              };
            });
          }
        } else if (clientEvent.type === "gameFinish") {
          setMetadata((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              gameWinner: clientEvent.winnerId,
              gamePhase: "gameOver",
            };
          });
        }
      } else if (event.type === "error") {
        setStatus("error");
        setError(event.message);
      }
    });

    return () => {
      unsubscribe();
      manager.disconnect();
    };
  }, [gameId, manager]);

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "text-green-500";
      case "connecting":
        return "text-yellow-500";
      case "error":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "connected":
        return "Live";
      case "connecting":
        return "Connecting...";
      case "error":
        return error || "Error";
      default:
        return "Disconnected";
    }
  };

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
        <Radio className={`h-4 w-4 ${getStatusColor()}`} />
        <span className="text-sm font-medium">{getStatusText()}</span>
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
                  Average:{" "}
                  {player.dartsThrown > 0
                    ? (player.totalScore / player.dartsThrown).toFixed(2)
                    : "0.00"}
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
