"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bug, Send, WifiOff, RefreshCw } from "lucide-react";
import type { ClientEvent } from "@/lib/live-stream-types";
import { useFeatureFlagEnabled } from "posthog-js/react";

interface LiveStreamDebugPanelProps {
  onSendEvent: (event: ClientEvent) => void;
  onReconnect: () => void;
  onClose: () => void;
  isConnected: boolean;
}

export function LiveStreamDebugPanel({
  onSendEvent,
  onReconnect,
  onClose,
  isConnected,
}: LiveStreamDebugPanelProps) {
  const [eventJson, setEventJson] = useState<string>(
    '{\n  "type": "heartbeat",\n  "timestamp": ' + Date.now() + "\n}",
  );
  const [error, setError] = useState<string | null>(null);
  const debugEnabled = useFeatureFlagEnabled("enableDebugLogs");

  // Don't render if debug is not enabled
  if (!debugEnabled) {
    return null;
  }

  const handleSendEvent = () => {
    try {
      const event = JSON.parse(eventJson) as ClientEvent;
      onSendEvent(event);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
    }
  };

  const loadTemplate = (template: string) => {
    const templates: Record<string, string> = {
      heartbeat: JSON.stringify(
        { type: "heartbeat", timestamp: Date.now() },
        null,
        2,
      ),
      score: JSON.stringify(
        {
          type: "score",
          playerId: 1,
          score: 60,
          modifier: "single",
          newScore: 441,
          validatedScore: 60,
          isRoundWin: false,
          isBust: false,
          currentRoundTotal: 60,
        },
        null,
        2,
      ),
      undo: JSON.stringify(
        {
          type: "undo",
          playerId: 1,
          lastScore: 60,
          newRoundTotal: 0,
        },
        null,
        2,
      ),
    };
    setEventJson(templates[template] || "{}");
    setError(null);
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-purple-500" />
          Debug Panel
        </CardTitle>
        <CardDescription>
          Developer tools for testing live stream events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Controls */}
        <div className="flex gap-2">
          <Button
            onClick={onReconnect}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reconnect
          </Button>
          <Button
            onClick={onClose}
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={!isConnected}
          >
            <WifiOff className="mr-2 h-4 w-4" />
            Close Socket
          </Button>
        </div>

        {/* Event Templates */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Quick Templates:</label>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => loadTemplate("heartbeat")}
              size="sm"
              variant="secondary"
            >
              Heartbeat
            </Button>
            <Button
              onClick={() => loadTemplate("score")}
              size="sm"
              variant="secondary"
            >
              Score
            </Button>
            <Button
              onClick={() => loadTemplate("undo")}
              size="sm"
              variant="secondary"
            >
              Undo
            </Button>
          </div>
        </div>

        {/* JSON Editor */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Custom Event JSON:</label>
          <textarea
            value={eventJson}
            onChange={(e) => {
              setEventJson(e.target.value);
              setError(null);
            }}
            className="border-input bg-background min-h-[200px] w-full rounded-md border p-3 font-mono text-sm"
            placeholder="Enter JSON event..."
          />
          {error && <p className="text-sm text-red-500">Error: {error}</p>}
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSendEvent}
          className="w-full"
          disabled={!isConnected}
        >
          <Send className="mr-2 h-4 w-4" />
          Send Event
        </Button>
      </CardContent>
    </Card>
  );
}
