import type {
  ClientEvent,
  ServerEvent,
  LiveStreamConnection,
} from "./live-stream-types";
import {
  createGameResponseSchema,
  serverEventSchema,
} from "./live-stream-types";

export type LiveStreamEventHandler = (event: ServerEvent) => void;
export type ConnectionStateHandler = (state: ConnectionState) => void;

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnecting";

export class LiveStreamManager {
  private ws: WebSocket | null = null;
  private connection: LiveStreamConnection | null = null;
  private eventHandlers = new Set<LiveStreamEventHandler>();
  private connectionStateHandlers = new Set<ConnectionStateHandler>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private sessionId: string;
  private isDisconnecting = false;
  private connectionState: ConnectionState = "disconnected";
  private workerUrl: string | null = null;
  private isHost = false;
  private connectionId = 0; // Tracks connection attempts to handle race conditions
  private hasEverConnected = false;

  constructor() {
    this.sessionId = crypto.randomUUID();
  }

  public async createGame(
    workerUrl: string,
  ): Promise<LiveStreamConnection | null> {
    try {
      const response = await fetch(`${workerUrl}/game`, {
        method: "POST",
      });

      if (!response.ok) {
        console.error("Failed to create game:", response.statusText);
        return null;
      }

      const data: unknown = await response.json();

      // Validate response with Zod
      const result = createGameResponseSchema.safeParse(data);
      if (!result.success) {
        console.error("Invalid response from createGame:", result.error);
        return null;
      }

      const connection: LiveStreamConnection = {
        gameId: result.data.gameId,
        hostSecret: result.data.hostSecret,
      };
      this.connection = connection;
      return connection;
    } catch (error) {
      console.error("Error creating game:", error);
      return null;
    }
  }

  public connect(
    workerUrl: string,
    connection: LiveStreamConnection,
    isHost: boolean,
  ): void {
    // Increment connection ID to invalidate any pending operations from previous attempts
    this.connectionId++;
    const currentConnectionId = this.connectionId;

    // If already connected to the same game, don't reconnect
    if (
      this.connectionState === "connected" &&
      this.connection?.gameId === connection.gameId
    ) {
      console.log("[LiveStream] Already connected to this game");
      return;
    }

    // Cancel any pending reconnection
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Clean up existing WebSocket if any
    if (this.ws) {
      this.cleanupWebSocket();
    }

    this.connection = connection;
    this.isDisconnecting = false;
    this.workerUrl = workerUrl;
    this.isHost = isHost;
    this.setConnectionState("connecting");

    const wsUrl = this.buildWebSocketUrl(workerUrl, connection, isHost);
    console.log(
      "[LiveStream] Connecting to WebSocket at:",
      wsUrl.replace(/hostSecret=[^&]+/, "hostSecret=***"),
    );
    this.createWebSocket(wsUrl, currentConnectionId);
  }

  private buildWebSocketUrl(
    workerUrl: string,
    connection: LiveStreamConnection,
    isHost: boolean,
  ): string {
    // Build WebSocket URL with sessionId and optionally hostSecret in query params
    // Note: WebSocket API doesn't support custom headers, so we must use query params
    // The worker will extract these and set proper headers when forwarding to the DO
    const wsUrl = workerUrl.replace(/^http/, "ws");
    const url = new URL(`${wsUrl}/game/${connection.gameId}/`);
    url.searchParams.set("sessionId", this.sessionId);

    // For hosts, include the host secret in query params
    // This is secure because: 1) ws:// URLs aren't logged in browser history
    // 2) The worker immediately extracts and uses it server-side
    if (isHost) {
      url.searchParams.set("hostSecret", connection.hostSecret);
    }

    return url.toString();
  }

  private createWebSocket(wsUrl: string, connectionId: number): void {
    try {
      this.ws = new WebSocket(wsUrl);
      this.setupWebSocketHandlers(connectionId);
    } catch (error) {
      console.error("[LiveStream] Error creating WebSocket:", error);
      this.setConnectionState("disconnected");
      this.notifyHandlers({
        type: "error",
        message: "Failed to create WebSocket connection",
      });
    }
  }

  private setupWebSocketHandlers(connectionId: number): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      // Check if this connection attempt is still valid
      if (connectionId !== this.connectionId) {
        console.log("[LiveStream] Ignoring stale connection open");
        return;
      }
      this.handleWebSocketOpen();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      if (connectionId !== this.connectionId) return;
      this.handleWebSocketMessage(event);
    };

    this.ws.onerror = (error) => {
      if (connectionId !== this.connectionId) {
        console.log("[LiveStream] Ignoring stale connection error");
        return;
      }
      this.handleWebSocketError(error);
    };

    this.ws.onclose = (event) => {
      if (connectionId !== this.connectionId) {
        console.log("[LiveStream] Ignoring stale connection close");
        return;
      }
      this.handleWebSocketClose(event);
    };
  }

  private handleWebSocketOpen(): void {
    console.log("[LiveStream] Connected");
    this.setConnectionState("connected");
    this.reconnectAttempts = 0;
    this.hasEverConnected = true;
  }

  private handleWebSocketMessage(event: MessageEvent): void {
    const eventData: unknown = event.data;
    const dataString =
      typeof eventData === "string" ? eventData : String(eventData);

    let parsed: unknown;
    try {
      parsed = JSON.parse(dataString);
    } catch (error) {
      console.error("[LiveStream] Error parsing message JSON:", error);
      return;
    }

    const result = serverEventSchema.safeParse(parsed);
    if (!result.success) {
      console.error("[LiveStream] Invalid message format:", result.error);
      return;
    }

    this.notifyHandlers(result.data);
  }

  private handleWebSocketError(error: Event): void {
    console.error("[LiveStream] WebSocket error:", error);
    // Don't change state here - wait for onclose which always fires after onerror
  }

  private handleWebSocketClose(event: CloseEvent): void {
    console.log(
      `[LiveStream] Disconnected (code: ${event.code}, clean: ${event.wasClean})`,
    );
    const previousState = this.connectionState;
    this.setConnectionState("disconnected");
    this.ws = null;

    // Don't reconnect if we're explicitly disconnecting
    if (this.isDisconnecting) {
      return;
    }

    // Only attempt reconnection if we were connected or reconnecting
    // Also attempt reconnection if we were connecting (connection failed during handshake)
    if (
      previousState === "connected" ||
      previousState === "reconnecting" ||
      previousState === "connecting"
    ) {
      this.attemptReconnection();
    }
  }

  private attemptReconnection(): void {
    // Guard against multiple concurrent reconnection attempts
    if (this.reconnectTimeout !== null) {
      console.log("[LiveStream] Reconnection already scheduled");
      return;
    }

    if (!this.connection || !this.workerUrl) {
      this.notifyHandlers({
        type: "error",
        message: "Failed to reconnect: missing connection details",
      });
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.notifyHandlers({
        type: "error",
        message: "Failed to reconnect after multiple attempts",
      });
      this.reconnectAttempts = 0;
      return;
    }

    this.reconnectAttempts++;
    this.setConnectionState("reconnecting");
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    console.log(
      `[LiveStream] Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.connection && this.workerUrl && !this.isDisconnecting) {
        this.connect(this.workerUrl, this.connection, this.isHost);
      }
    }, delay);
  }

  public sendEvent(event: ClientEvent): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      console.warn("[LiveStream] Cannot send event, not connected");
    }
  }

  public disconnect(): void {
    this.isDisconnecting = true;
    this.setConnectionState("disconnecting");

    // Increment connection ID to invalidate any pending callbacks
    this.connectionId++;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.cleanupWebSocket();

    this.connection = null;
    this.reconnectAttempts = 0;
    this.workerUrl = null;
    this.setConnectionState("disconnected");
  }

  private cleanupWebSocket(): void {
    if (this.ws) {
      // Remove event handlers to prevent memory leaks
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;

      // Close the WebSocket if it's still open
      if (
        this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING
      ) {
        this.ws.close();
      }

      this.ws = null;
    }
  }

  public subscribe(handler: LiveStreamEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => {
      this.eventHandlers.delete(handler);
    };
  }

  public subscribeToConnectionState(
    handler: ConnectionStateHandler,
  ): () => void {
    this.connectionStateHandlers.add(handler);
    return () => {
      this.connectionStateHandlers.delete(handler);
    };
  }

  private notifyHandlers(event: ServerEvent): void {
    this.eventHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error("[LiveStream] Error in event handler:", error);
      }
    });
  }

  private notifyConnectionStateHandlers(): void {
    this.connectionStateHandlers.forEach((handler) => {
      try {
        handler(this.connectionState);
      } catch (error) {
        console.error("[LiveStream] Error in connection state handler:", error);
      }
    });
  }

  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.notifyConnectionStateHandlers();
    }
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public isConnected(): boolean {
    return (
      this.connectionState === "connected" &&
      this.ws?.readyState === WebSocket.OPEN
    );
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  public getConnection(): LiveStreamConnection | null {
    return this.connection;
  }

  /**
   * Manually retry the connection using the existing connection details.
   * Useful when the host needs to reconnect after an unexpected disconnect.
   */
  public retryConnection(): boolean {
    if (!this.connection || !this.workerUrl) {
      console.warn(
        "[LiveStream] Cannot retry: no connection details available",
      );
      return false;
    }

    if (
      this.connectionState === "connecting" ||
      this.connectionState === "connected"
    ) {
      console.warn(
        "[LiveStream] Cannot retry: already connecting or connected",
      );
      return false;
    }

    console.log("[LiveStream] Manually retrying connection");
    this.reconnectAttempts = 0; // Reset attempts for manual retry
    this.isDisconnecting = false;
    this.connect(this.workerUrl, this.connection, this.isHost);
    return true;
  }

  public ensureConnected(): void {
    if (!this.connection || !this.workerUrl || this.isDisconnecting) return;
    if (
      this.connectionState === "connecting" ||
      this.connectionState === "connected" ||
      this.connectionState === "reconnecting"
    ) {
      return;
    }
    if (this.hasEverConnected) {
      this.reconnectAttempts = 0;
    }
    this.connect(this.workerUrl, this.connection, this.isHost);
  }
}

// Singleton instances for host and viewer connections
// This ensures React StrictMode remounts don't create duplicate connections
let hostManager: LiveStreamManager | null = null;
const viewerManagers = new Map<string, LiveStreamManager>();

/**
 * Gets or creates a singleton manager for hosting a live stream.
 */
export function getHostManager(): LiveStreamManager {
  hostManager ??= new LiveStreamManager();
  return hostManager;
}

/**
 * Resets the host manager (for testing or explicit cleanup).
 */
export function resetHostManager(): void {
  if (hostManager) {
    hostManager.disconnect();
    hostManager = null;
  }
}

/**
 * Gets or creates a singleton manager for viewing a specific game.
 * Each gameId gets its own manager instance.
 */
export function getViewerManager(gameId: string): LiveStreamManager {
  let manager = viewerManagers.get(gameId);
  if (!manager) {
    manager = new LiveStreamManager();
    viewerManagers.set(gameId, manager);
  }
  return manager;
}

/**
 * Removes a viewer manager for a specific game.
 */
export function removeViewerManager(gameId: string): void {
  const manager = viewerManagers.get(gameId);
  if (manager) {
    manager.disconnect();
    viewerManagers.delete(gameId);
  }
}
