# Live Stream Feature

The Darts Scorer application supports live streaming of games, allowing unlimited viewers to watch games in real-time.

## Overview

The live stream feature uses Cloudflare Durable Objects to provide:
- Real-time score updates
- Automatic state synchronization for late joiners
- Type-safe communication between host and viewers
- Scalable architecture supporting unlimited viewers

## Architecture

### Components

1. **Cloudflare Worker** (`workers/darts-live-stream/`)
   - Handles WebSocket connections
   - Routes requests between hosts and viewers
   - Manages game state persistence

2. **Game Durable Object**
   - Stores game metadata and current state
   - Verifies host authentication
   - Broadcasts events to all connected viewers
   - Manages WebSocket sessions

3. **GameRegistry Durable Object**
   - Tracks active games
   - Provides game discovery (future feature)
   - Provides cleanup method for old game entries (requires periodic invocation)

4. **Frontend Integration**
   - Host controls: Start/stop stream, share URL
   - Viewer page: Real-time score display
   - Automatic reconnection on connection loss

## Technical Details

### WebSocket Connection Setup

The live stream feature uses WebSocket connections for real-time bidirectional communication between hosts/viewers and the Cloudflare Worker.

#### Connection Flow

```mermaid
sequenceDiagram
    participant Host as Host Browser
    participant App as Next.js App
    participant Worker as Cloudflare Worker
    participant Registry as GameRegistry DO
    participant Game as Game DO
    participant Viewer as Viewer Browser

    Note over Host,Game: Stream Creation (HTTP)
    Host->>App: Click "Start Stream"
    App->>Worker: POST /game
    Worker->>Worker: Generate gameId, hostSecret
    Worker->>Game: game.init(hostSecret)
    Game->>Game: Store hostSecret in state
    Worker->>Registry: registry.registerGame(gameId)
    Registry->>Registry: Add to active games list
    Worker-->>App: {gameId, hostSecret}
    App-->>Host: Display stream URL

    Note over Host,Game: Host Connection (WebSocket)
    Host->>App: Connect to stream
    App->>Worker: WebSocket Upgrade<br/>GET /game/{gameId}<br/>?hostSecret=xxx&sessionId=yyy
    Worker->>Worker: Extract hostSecret from query<br/>Add to X-DO-Host-Secret header
    Worker->>Game: Forward WebSocket upgrade request
    Game->>Game: Verify hostSecret matches
    Game->>Game: Create WebSocketPair<br/>(client, server)
    Game->>Game: Add server to sessions (isHost=true)
    Game-->>Worker: Response(101, {webSocket: client})
    Worker->>Worker: Preserve webSocket in CORS wrapper
    Worker-->>App: Return WebSocket client
    App-->>Host: WebSocket connected to Game DO
    Note right of Host: Direct WebSocket connection<br/>to Game DO established
    Host->>Game: Send gameUpdate (via WebSocket)
    Game->>Game: Store game metadata

    Note over Viewer,Game: Viewer Connection (WebSocket)
    Viewer->>Worker: WebSocket Upgrade<br/>GET /game/{gameId}<br/>?sessionId=zzz
    Worker->>Worker: No hostSecret - viewer connection
    Worker->>Game: Forward WebSocket upgrade request
    Game->>Game: Create WebSocketPair<br/>(client, server)
    Game->>Game: Add server to sessions (isHost=false)
    Game->>Game: Send sync event (current state)
    Game-->>Worker: Response(101, {webSocket: client})
    Worker->>Worker: Preserve webSocket in CORS wrapper
    Worker-->>Viewer: Return WebSocket client
    Note right of Viewer: Direct WebSocket connection<br/>to Game DO established

    Note over Host,Viewer: Score Event Broadcasting
    Host->>Game: Send score event (via direct WebSocket)
    Game->>Game: Validate sender isHost=true
    Game->>Game: Update stored metadata
    Game->>Game: Broadcast to all sessions
    Game->>Host: Broadcast event (direct WebSocket)
    Game->>Viewer: Broadcast event (direct WebSocket)

    Note over Host,Viewer: Connection Lifecycle
    Host->>Game: WebSocket close (direct)
    Game->>Game: Remove host from sessions
    Viewer->>Game: WebSocket close (direct)
    Game->>Game: Remove viewer from sessions
```

**Key Points:**
- **The Worker facilitates the WebSocket upgrade**: The Worker receives the initial WebSocket upgrade request, extracts authentication parameters, and forwards the request to the appropriate Game DO
- **Game DO creates direct WebSocket connections**: The Game DO creates a WebSocketPair and returns one end to the client through the Worker. After the upgrade, clients have a **direct WebSocket connection to the Game DO**
- **Messages flow directly between clients and Game DO**: Once the WebSocket is established, all messages (score events, broadcasts, etc.) flow directly between the client and the Game DO without going through the Worker
- **The Worker's role is limited to the initial handshake**: After returning the WebSocket upgrade response, the Worker is no longer involved in the WebSocket communication

This architecture provides optimal performance since messages don't need to be proxied through the Worker.

#### Host Authentication Flow

Due to browser WebSocket API limitations (no custom headers support), host authentication uses a hybrid approach:

1. **Query Parameter for WebSocket**: The `hostSecret` is sent as a query parameter in the WebSocket URL
   - Example: `ws://worker/game/abc123?hostSecret=xyz789`
   - This is secure for WebSockets as `ws://` URLs are not logged in browser history
   - The secret only appears in the WebSocket upgrade request

2. **Header Conversion at Worker**: The worker immediately extracts the secret from the query string and converts it to a header
   ```typescript
   const hostSecret = url.searchParams.get('hostSecret') || 
                     request.headers.get('X-DO-Host-Secret');
   ```

3. **Durable Object Validation**: The Game DO receives the secret via header and validates it
   ```typescript
   const providedSecret = request.headers.get('X-DO-Host-Secret');
   const isHost = providedSecret === this.state.hostSecret;
   ```

This approach ensures:
- ✅ Browser compatibility (query params work with WebSocket API)
- ✅ Security (secret not logged in browser history, immediately converted to header)
- ✅ Server-side validation (DO never sees query param, only header)
- ✅ Backward compatibility (HTTP endpoints still use headers only)

#### Connection State Management

The `LiveStreamManager` tracks connection state through a state machine:

```
disconnected --> connecting --> connected
     ^              |               |
     |              v               v
     +-------- reconnecting <-------+
                   |
                   v
            disconnecting --> disconnected
```


## Limitations

- Games are stored for 24 hours after creation
- Maximum game duration: No limit (as long as connection is active)
- Viewer capacity: No hard limit (Cloudflare Durable Objects scale automatically)


## Possible Future Enhancements

- Game Discovery/Browsing
- Game history for completed streams
- Viewer chat/reactions
- Analytics and statistics
- Custom branding for streams
