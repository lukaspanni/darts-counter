"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { LiveStreamManager } from "@/lib/live-stream-manager";
import type {
  ClientEvent,
  ServerEvent,
  LiveStreamState,
} from "@/lib/live-stream-types";

const WORKER_URL =
  process.env.NEXT_PUBLIC_LIVE_STREAM_WORKER_URL ||
  "http://localhost:8787";

export function useLiveStream() {
  const managerRef = useRef<LiveStreamManager | null>(null);
  const [state, setState] = useState<LiveStreamState>({
    isActive: false,
    connection: null,
    status: "disconnected",
    error: null,
  });

  // Initialize manager
  useEffect(() => {
    managerRef.current ??= new LiveStreamManager();
    
    // Cleanup on unmount or page unload
    return () => {
      if (managerRef.current) {
        managerRef.current.disconnect();
      }
    };
  }, []);

  // Subscribe to events
  useEffect(() => {
    if (!managerRef.current) return;

    const unsubscribe = managerRef.current.subscribe((event: ServerEvent) => {
      if (event.type === "sync") {
        setState((prev) => ({ ...prev, status: "connected", error: null }));
      } else if (event.type === "error") {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: event.message,
        }));
      }
      // broadcast events are handled by game logic
    });

    return unsubscribe;
  }, []);

  const startLiveStream = useCallback(async () => {
    if (!managerRef.current) return;

    setState((prev) => ({ ...prev, status: "connecting" }));

    try {
      const connection = await managerRef.current.createGame(WORKER_URL);

      if (!connection) {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: "Failed to create live stream",
        }));
        return;
      }

      managerRef.current.connect(WORKER_URL, connection, true);

      setState({
        isActive: true,
        connection,
        status: "connecting",
        error: null,
      });
    } catch (error) {
      console.error("Error starting live stream:", error);
      setState((prev) => ({
        ...prev,
        status: "error",
        error: "Failed to start live stream",
      }));
    }
  }, []);

  const stopLiveStream = useCallback(() => {
    if (!managerRef.current) return;

    managerRef.current.disconnect();
    setState({
      isActive: false,
      connection: null,
      status: "disconnected",
      error: null,
    });
  }, []);

  const sendEvent = useCallback((event: ClientEvent) => {
    if (!managerRef.current) return;
    managerRef.current.sendEvent(event);
  }, []);

  const subscribeToEvents = useCallback(
    (handler: (event: ServerEvent) => void) => {
      if (!managerRef.current) {
        return () => {
          // Cleanup function
        };
      }
      return managerRef.current.subscribe(handler);
    },
    [],
  );

  const getLiveStreamUrl = useCallback(() => {
    if (!state.connection) return null;
    const baseUrl =
      typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}?live-stream=${state.connection.gameId}`;
  }, [state.connection]);

  return {
    state,
    startLiveStream,
    stopLiveStream,
    sendEvent,
    subscribeToEvents,
    getLiveStreamUrl,
  };
}
