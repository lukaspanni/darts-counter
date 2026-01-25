import type {
  ClientEvent,
  ServerEvent,
  LiveStreamConnection,
  LiveStreamGameMetadata,
} from "./live-stream-types";

export type LiveStreamEventHandler = (event: ServerEvent) => void;

export class LiveStreamManager {
  private ws: WebSocket | null = null;
  private connection: LiveStreamConnection | null = null;
  private eventHandlers: Set<LiveStreamEventHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;
  private sessionId: string;

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

      const data = (await response.json()) as LiveStreamConnection;
      this.connection = data;
      return data;
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

    // Build WebSocket URL with query parameters
    const wsUrl = workerUrl.replace(/^http/, "ws");
    const url = new URL(`${wsUrl}/game/${connection.gameId}/`);
    url.searchParams.set("sessionId", this.sessionId);
    if (isHost) {
      url.searchParams.set("hostSecret", connection.hostSecret);
    }

    try {
      this.ws = new WebSocket(url.toString());
      
      this.ws.onopen = () => {
        console.log("[LiveStream] Connected");
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ServerEvent;
          this.notifyHandlers(data);
        } catch (error) {
          console.error("[LiveStream] Error parsing message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("[LiveStream] WebSocket error:", error);
        this.notifyHandlers({
          type: "error",
          message: "WebSocket connection error",
        });
      };

      this.ws.onclose = () => {
        console.log("[LiveStream] Disconnected");
        this.ws = null;

        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          console.log(`[LiveStream] Reconnecting in ${delay}ms...`);
          
          this.reconnectTimeout = window.setTimeout(() => {
            if (this.connection) {
              this.connect(workerUrl, this.connection, isHost);
            }
          }, delay);
        } else {
          this.notifyHandlers({
            type: "error",
            message: "Failed to reconnect after multiple attempts",
          });
        }
      };
    } catch (error) {
      console.error("[LiveStream] Error creating WebSocket:", error);
      this.notifyHandlers({
        type: "error",
        message: "Failed to create WebSocket connection",
      });
    }
  }

  public sendEvent(event: ClientEvent): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      console.warn("[LiveStream] Cannot send event, not connected");
    }
  }

  public disconnect(): void {
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
