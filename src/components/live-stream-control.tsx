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
import { getStatusColor, getStatusText } from "@/lib/live-stream-utils";
import { Copy, Check, Radio, RadioTower, RefreshCw } from "lucide-react";
import { useState } from "react";

export function LiveStreamControl() {
  const {
    state,
    startLiveStream,
    stopLiveStream,
    retryConnection,
    getLiveStreamUrl,
  } = useLiveStream();
  const [copied, setCopied] = useState(false);

  const liveStreamUrl = getLiveStreamUrl();

  const handleCopyUrl = async () => {
    if (liveStreamUrl) {
      await navigator.clipboard.writeText(liveStreamUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRetry = () => {
    retryConnection();
  };

  // Show retry button when there's an error but we still have connection details
  const showRetryButton = state.status === "error" && state.isActive;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RadioTower className="h-5 w-5" />
          Live Stream (experimental)
        </CardTitle>
        <CardDescription>
          Share your game in real-time with others
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className={`h-4 w-4 ${getStatusColor(state.status)}`} />
            <span className="text-sm font-medium">
              {getStatusText(state.status, state.error)}
            </span>
          </div>
          <div className="flex gap-2">
            {showRetryButton && (
              <Button onClick={handleRetry} size="sm" variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
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
        </div>

        {state.isActive && liveStreamUrl && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              Share this URL with viewers:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={liveStreamUrl}
                readOnly
                className="border-input bg-background flex-1 rounded-md border px-3 py-2 text-sm"
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
