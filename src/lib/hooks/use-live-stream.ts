"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getHostManager } from "@/lib/live-stream-manager";
import type {
  ClientEvent,
  ServerEvent,
  LiveStreamState,
} from "@/lib/live-stream-types";

const WORKER_URL =
  process.env.NEXT_PUBLIC_LIVE_STREAM_WORKER_URL || "http://localhost:8787";

const HEARTBEAT_INTERVAL_MS = 40000;
const CONNECTION_GUARD_MS = 10000;

export function useLiveStream() {
  const managerRef = useRef(getHostManager());
  const heartbeatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const connectionGuardRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<LiveStreamState>(() => {
    // Initialize state from existing manager connection if available
    const manager = managerRef.current;
    const connectionState = manager.getConnectionState();
    const connection = manager.getConnection();
    return {
      isActive: connection !== null,
      connection,
      status:
        connectionState === "connected"
          ? "connected"
          : connectionState === "connecting" ||
              connectionState === "reconnecting"
            ? "connecting"
            : "disconnected",
      error: null,
    };
  });

  // Subscribe to events and connection state changes
  useEffect(() => {
    const manager = managerRef.current;

    const unsubscribe = manager.subscribe((event: ServerEvent) => {
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

    // Subscribe to connection state changes
    const unsubscribeState = manager.subscribeToConnectionState(
      (connectionState) => {
        setState((prev) => ({
          ...prev,
          status:
            connectionState === "connected"
              ? "connected"
              : connectionState === "connecting" ||
                  connectionState === "reconnecting"
                ? "connecting"
                : connectionState === "disconnected"
                  ? "disconnected"
                  : prev.status,
          // Update isActive based on connection availability
          isActive: manager.getConnection() !== null,
          connection: manager.getConnection(),
        }));
      },
    );

    return () => {
      unsubscribe();
      unsubscribeState();
    };
  }, []);

  const scheduleHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }

    heartbeatTimeoutRef.current = setTimeout(() => {
      if (managerRef.current.isConnected()) {
        managerRef.current.sendEvent({
          type: "heartbeat",
          timestamp: Date.now(),
        });
      }
      scheduleHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);
  }, []);

  useEffect(() => {
    scheduleHeartbeat();
    return () => {
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
      }
      if (connectionGuardRef.current) {
        clearTimeout(connectionGuardRef.current);
      }
    };
  }, [scheduleHeartbeat]);

  useEffect(() => {
    const manager = managerRef.current;

    if (connectionGuardRef.current) {
      clearTimeout(connectionGuardRef.current);
    }

    if (state.isActive && state.status !== "connected") {
      connectionGuardRef.current = setTimeout(() => {
        manager.ensureConnected();
      }, CONNECTION_GUARD_MS);
    }
  }, [state.isActive, state.status]);

  const startLiveStream = useCallback(async () => {
    const manager = managerRef.current;

    setState((prev) => ({ ...prev, status: "connecting" }));

    try {
      const connection = await manager.createGame(WORKER_URL);

      if (!connection) {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: "Failed to create live stream",
        }));
        return;
      }

      manager.connect(WORKER_URL, connection, true);

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
    managerRef.current.disconnect();
    setState({
      isActive: false,
      connection: null,
      status: "disconnected",
      error: null,
    });
  }, []);

  const retryConnection = useCallback(() => {
    const success = managerRef.current.retryConnection();
    if (success) {
      setState((prev) => ({ ...prev, status: "connecting", error: null }));
    }
    return success;
  }, []);

  const sendEvent = useCallback(
    (event: ClientEvent) => {
      managerRef.current.sendEvent(event);
      scheduleHeartbeat();
    },
    [scheduleHeartbeat],
  );

  const subscribeToEvents = useCallback(
    (handler: (event: ServerEvent) => void) => {
      return managerRef.current.subscribe(handler);
    },
    [],
  );

  const getLiveStreamUrl = useCallback(() => {
    if (!state.connection) return null;
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}?live-stream=${state.connection.gameId}`;
  }, [state.connection]);

  return {
    state,
    startLiveStream,
    stopLiveStream,
    retryConnection,
    sendEvent,
    subscribeToEvents,
    getLiveStreamUrl,
    manager: managerRef.current,
  };
}
