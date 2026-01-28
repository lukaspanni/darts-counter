"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLiveStream } from "@/lib/hooks/use-live-stream";
import { Copy, Check, Radio, RadioTower } from "lucide-react";
import { useState } from "react";

export function LiveStreamControl() {
  const { state, startLiveStream, stopLiveStream, getLiveStreamUrl } =
    useLiveStream();
  const [copied, setCopied] = useState(false);

  const liveStreamUrl = getLiveStreamUrl();

  const handleCopyUrl = async () => {
    if (liveStreamUrl) {
      await navigator.clipboard.writeText(liveStreamUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusColor = () => {
    switch (state.status) {
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
    switch (state.status) {
      case "connected":
        return "Live";
      case "connecting":
        return "Connecting...";
      case "error":
        return state.error || "Error";
      default:
        return "Not streaming";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RadioTower className="h-5 w-5" />
          Live Stream
        </CardTitle>
        <CardDescription>
          Share your game in real-time with viewers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className={`h-4 w-4 ${getStatusColor()}`} />
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
          {!state.isActive ? (
            <Button onClick={startLiveStream} size="sm">
              Start Stream
            </Button>
          ) : (
            <Button onClick={stopLiveStream} variant="destructive" size="sm">
              Stop Stream
            </Button>
          )}
        </div>

        {state.isActive && liveStreamUrl && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Share this URL with viewers:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={liveStreamUrl}
                readOnly
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <Button
                onClick={handleCopyUrl}
                size="sm"
                variant="outline"
                className="flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
