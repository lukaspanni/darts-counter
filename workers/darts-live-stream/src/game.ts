import { DurableObject } from 'cloudflare:workers';
import { type Session, type GameState, type ClientEvent, type ServerEvent, sessionSchema, clientEventSchema } from './types';

/**
 * Game Durable Object
 *
 * Manages the state and WebSocket connections for a single game stream.
 * - Stores game metadata and host secret
 * - Validates host authentication
 * - Broadcasts events to all connected viewers
 * - Provides state synchronization for late joiners
 */
export class Game extends DurableObject<Env> {
	private sessions: Map<WebSocket, Session> = new Map();
	private state: GameState | null = null;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.sessions = new Map();

		// Restore WebSocket sessions
		this.ctx.getWebSockets().forEach((ws) => {
			const meta = ws.deserializeAttachment();
			const parsed = sessionSchema.safeParse(meta);
			if (parsed.success) {
				this.sessions.set(ws, parsed.data);
			}
		});
	}

	public async init(hostSecret: string): Promise<void> {
		// Check if game is already initialized to prevent re-initialization
		const existingState = await this.ctx.storage.get<GameState>('state');
		if (existingState) {
			console.warn('[Game:InitError]', JSON.stringify({ action: 'init', status: 'error', reason: 'already_initialized', timestamp: Date.now() }));
			throw new Error('Game already initialized');
		}

		this.state = {
			hostSecret,
			metadata: null,
			createdAt: Date.now(),
			lastActivity: Date.now(),
		};
		await this.ctx.storage.put('state', this.state);
		console.log('[Game:Initialized]', JSON.stringify({ action: 'init', status: 'success', timestamp: this.state.createdAt }));
	}

	public override async fetch(request: Request): Promise<Response> {
		// Load state if not already loaded
		if (!this.state) {
			const stored = await this.ctx.storage.get<GameState>('state');
			this.state = stored || null;
			if (!this.state) {
				return new Response('Game not initialized', { status: 400 });
			}
		}

		const { success: idOk, data: sessionId, error: idError } = sessionSchema.shape.id.safeParse(request.headers.get('X-DO-Session-Id'));
		if (!idOk) return new Response(`Invalid session ID: ${idError.message}`, { status: 400 });

		// Check if this is a host connection
		const hostSecret = request.headers.get('X-DO-Host-Secret');
		const isHost = hostSecret === this.state.hostSecret;
		const role = isHost ? 'host' : 'viewer';

		const { 0: client, 1: server } = new WebSocketPair();

		this.ctx.acceptWebSocket(server);

		const session: Session = { id: sessionId, role };
		server.serializeAttachment(session);
		this.sessions.set(server, session);

		// Send current game state to the new connection
		if (this.state.metadata) {
			const syncEvent: ServerEvent = {
				type: 'sync',
				metadata: this.state.metadata,
			};
			server.send(JSON.stringify(syncEvent));
		}

		console.log('[Game:SessionConnected]', JSON.stringify({ sessionId, role, action: 'session_connected', status: 'success', timestamp: Date.now(), totalSessions: this.sessions.size }));

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	override async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string): Promise<void> {
		const stringMessage = typeof message === 'string' ? message : new TextDecoder().decode(message);
		const session = this.sessions.get(ws);
		if (!session) return;
		if (stringMessage.length < 1) return;

		// Only hosts can send events
		if (session.role !== 'host') {
			ws.send(JSON.stringify({ type: 'error', message: 'Only hosts can send events' } satisfies ServerEvent));
			return;
		}

		// Ensure state exists before processing
		if (!this.state) {
			console.error('[Game:MessageError]', JSON.stringify({ sessionId: session.id, role: session.role, action: 'message', status: 'error', reason: 'state_null', timestamp: Date.now() }));
			ws.send(JSON.stringify({ type: 'error', message: 'Game state not initialized' } satisfies ServerEvent));
			return;
		}

		// Update last activity
		this.state.lastActivity = Date.now();

		try {
			const parsed = JSON.parse(stringMessage);
			const result = clientEventSchema.safeParse(parsed);

			if (!result.success) {
				console.error('[Game:MessageError]', JSON.stringify({ sessionId: session.id, role: session.role, action: 'message', status: 'error', reason: 'invalid_format', error: result.error.message, timestamp: Date.now() }));
				ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' } satisfies ServerEvent));
				return;
			}

			const event = result.data;

			// Handle gameUpdate to store metadata
			if (event.type === 'gameUpdate') {
				this.state.metadata = event.metadata;
				await this.ctx.storage.put('state', this.state);
			}

			if (event.type === 'heartbeat') {
				this.state.lastActivity = Date.now();
				await this.ctx.storage.put('state', this.state);
			}

			console.log('[Game:EventReceived]', JSON.stringify({ sessionId: session.id, role: session.role, eventType: event.type, action: 'event_received', status: 'success', timestamp: Date.now(), broadcastToSessions: this.sessions.size - 1 }));

			// Broadcast to all viewers (and other host connections)
			const broadcastEvent: ServerEvent = {
				type: 'broadcast',
				event,
			};
			const broadcastMessage = JSON.stringify(broadcastEvent);

			this.ctx.getWebSockets().forEach((client) => {
				const clientSession = this.sessions.get(client);
				// Don't send back to the sender
				if (clientSession && clientSession.id !== session.id) {
					client.send(broadcastMessage);
				}
			});
		} catch (error) {
			console.error('[Game:MessageError]', JSON.stringify({ sessionId: session.id, role: session.role, action: 'message', status: 'error', reason: 'processing_failed', error: String(error), timestamp: Date.now() }));
			ws.send(JSON.stringify({ type: 'error', message: 'Failed to process message' } satisfies ServerEvent));
		}
	}

	override async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
		const session = this.sessions.get(ws);

		console.log('[Game:SessionClosed]', JSON.stringify({ sessionId: session?.id, role: session?.role, code, wasClean, action: 'session_closed', status: 'success', timestamp: Date.now(), remainingSessions: this.sessions.size - 1 }));

		if (code === 1006) {
			console.warn('[Game:UnexpectedClose]', JSON.stringify({ sessionId: session?.id, reason, code, action: 'unexpected_close', timestamp: Date.now() }));
		}

		this.sessions.delete(ws);

		// If all connections are closed, we could optionally clean up
		if (this.sessions.size === 0) {
			console.log('[Game:AllConnectionsClosed]', JSON.stringify({ action: 'all_connections_closed', timestamp: Date.now() }));
		}
	}
}
