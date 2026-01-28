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

## Usage

### For Hosts

1. **Start a Live Stream**:
   - Set up your game as usual
   - Before starting the game, enable the "Live Stream" option
   - Click "Start Stream"
   - Copy the shareable URL

2. **Share with Viewers**:
   - Send the generated URL to viewers via any communication channel
   - The URL format is: `https://your-domain.com/?live-stream=<game-id>`

3. **During the Game**:
   - Play normally - all score events are automatically broadcast
   - The live indicator shows connection status
   - Viewers will see updates in real-time

4. **Stop Streaming**:
   - Click "Stop Stream" to end the broadcast
   - Viewers will be disconnected

### For Viewers

1. **Join a Stream**:
   - Open the shared URL in your browser
   - Wait for the connection to establish

2. **Watch the Game**:
   - See real-time score updates
   - View player statistics
   - See who's currently throwing
   - Watch game progress (rounds, winners)

3. **Late Joining**:
   - Join at any time during the game
   - Automatically receive current game state
   - See all subsequent updates in real-time

## Setup

### Development

1. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   # Edit .env and set NEXT_PUBLIC_LIVE_STREAM_WORKER_URL
   ```

2. **Start the Worker** (in a separate terminal):
   ```bash
   cd workers/darts-live-stream
   pnpm dev
   # Worker will run on http://localhost:8787
   ```

3. **Start the Next.js App**:
   ```bash
   pnpm dev
   # App will run on http://localhost:3000
   ```

4. **Test the Feature**:
   - Navigate to http://localhost:3000
   - Set up a game
   - Enable live stream
   - Open the viewer URL in another browser tab

### Production

1. **Deploy the Worker**:
   ```bash
   cd workers/darts-live-stream
   pnpm deploy
   # Note the deployed worker URL
   ```

2. **Configure the Frontend**:
   ```bash
   # Set environment variable in your hosting platform
   NEXT_PUBLIC_LIVE_STREAM_WORKER_URL=https://your-worker.workers.dev
   ```

3. **Deploy the Frontend**:
   - Deploy to Vercel, Netlify, or your preferred platform
   - Ensure the environment variable is set

## Technical Details

### Message Types

#### Client to Server (Host Only)

- **score**: Score throw event with all details
- **undo**: Undo last throw
- **roundFinish**: Round completed
- **gameFinish**: Game completed
- **gameUpdate**: Full game state update

#### Server to Client

- **sync**: Initial state sent to new connections
- **broadcast**: Forwarded game event to all viewers
- **error**: Error message

### Security

- Host authentication via secret token
- Viewers cannot send events (read-only)
- Game state validated on the server
- Automatic cleanup of inactive games

### Performance

- WebSocket for low-latency updates
- Durable Objects for global state management
- Automatic reconnection with exponential backoff
- Efficient broadcast to multiple viewers

## Limitations

- Games are stored for 24 hours after creation
- Maximum game duration: No limit (as long as connection is active)
- Viewer capacity: No hard limit (Cloudflare Durable Objects scale automatically)

## Troubleshooting

### Connection Issues

**Problem**: "Failed to connect to live stream"
- **Solution**: Check that the worker is running and accessible
- Verify `NEXT_PUBLIC_LIVE_STREAM_WORKER_URL` is set correctly
- Check browser console for CORS errors

**Problem**: Frequent disconnections
- **Solution**: Check network stability
- Verify worker is deployed and healthy
- Check Cloudflare dashboard for errors

### Score Not Updating

**Problem**: Viewer not receiving updates
- **Solution**: Refresh the viewer page
- Verify the host is still connected
- Check that the game ID in the URL is correct

### Host Cannot Start Stream

**Problem**: "Failed to create live stream"
- **Solution**: Verify worker is accessible
- Check worker logs for errors
- Ensure worker bindings are configured correctly

## Future Enhancements

- Multiple hosts for team games
- Game history for completed streams
- Viewer chat/reactions
- Analytics and statistics
- Mobile app support
- Custom branding for streams
