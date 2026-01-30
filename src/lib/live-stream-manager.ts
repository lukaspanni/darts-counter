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

export class LiveStreamManager {
  private ws: WebSocket | null = null;
  private connection: LiveStreamConnection | null = null;
  private eventHandlers = new Set<LiveStreamEventHandler>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;
  private sessionId: string;
  private isDisconnecting = false;

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
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.warn("WebSocket already connected");
      return;
    }

    this.connection = connection;
    this.isDisconnecting = false;

    const wsUrl = this.buildWebSocketUrl(workerUrl, connection.gameId);
    this.createWebSocket(wsUrl, workerUrl, isHost);
  }

  private buildWebSocketUrl(workerUrl: string, gameId: string): string {
    // Build WebSocket URL with sessionId in query params only
    // Host secret is NOT sent via query params for security
    const wsUrl = workerUrl.replace(/^http/, "ws");
    const url = new URL(`${wsUrl}/game/${gameId}/`);
    url.searchParams.set("sessionId", this.sessionId);
    return url.toString();
  }

  private createWebSocket(
    wsUrl: string,
    workerUrl: string,
    isHost: boolean,
  ): void {
    try {
      this.ws = new WebSocket(wsUrl);
    } catch (error) {
      console.error("[LiveStream] Error creating WebSocket:", error);
      this.notifyHandlers({
        type: "error",
        message: "Failed to create WebSocket connection",
      });
      return;
    }

    this.setupWebSocketHandlers(workerUrl, isHost);
  }

  private setupWebSocketHandlers(workerUrl: string, isHost: boolean): void {
    if (!this.ws) return;

    this.ws.onopen = () => this.handleWebSocketOpen(isHost);
    this.ws.onmessage = (event: MessageEvent) => this.handleWebSocketMessage(event);
    this.ws.onerror = (error) => this.handleWebSocketError(error);
    this.ws.onclose = () => this.handleWebSocketClose(workerUrl, isHost);
  }

  private handleWebSocketOpen(isHost: boolean): void {
    console.log("[LiveStream] Connected");
    this.reconnectAttempts = 0;

    // For hosts, auth is handled via headers at the worker level
    // Future enhancement: send auth message post-connection
    if (isHost) {
      // Authentication handled during WebSocket upgrade
    }
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
    this.notifyHandlers({
      type: "error",
      message: "WebSocket connection error",
    });
  }

  private handleWebSocketClose(workerUrl: string, isHost: boolean): void {
    console.log("[LiveStream] Disconnected");
    this.ws = null;

    if (this.isDisconnecting) {
      return;
    }

    this.attemptReconnection(workerUrl, isHost);
  }

  private attemptReconnection(workerUrl: string, isHost: boolean): void {
    if (
      this.reconnectAttempts >= this.maxReconnectAttempts ||
      !this.connection
    ) {
      this.notifyHandlers({
        type: "error",
        message: "Failed to reconnect after multiple attempts",
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    console.log(`[LiveStream] Reconnecting in ${delay}ms...`);

    this.reconnectTimeout = window.setTimeout(() => {
      if (this.connection && !this.isDisconnecting) {
        this.connect(workerUrl, this.connection, isHost);
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

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connection = null;
    this.reconnectAttempts = 0;
  }

  public subscribe(handler: LiveStreamEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => {
      this.eventHandlers.delete(handler);
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

  public getSessionId(): string {
    return this.sessionId;
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
