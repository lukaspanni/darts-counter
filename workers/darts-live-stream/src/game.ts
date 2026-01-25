import { DurableObject } from 'cloudflare:workers';
import {
	type Session,
	type GameState,
	type ClientEvent,
	type ServerEvent,
	sessionSchema,
	clientEventSchema,
} from './types';

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
		console.log('[Game DO] Initializing game with host secret');
		this.state = {
			hostSecret,
			metadata: null,
			createdAt: Date.now(),
			lastActivity: Date.now(),
		};
		await this.ctx.storage.put('state', this.state);
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
		const role: Session['role'] = isHost ? 'host' : 'viewer';

		console.log('[Game DO] Processing request with session ID:', sessionId, 'role:', role);

		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		if (!server) {
			return new Response('Failed to create WebSocket', { status: 500 });
		}

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

		// Update last activity
		if (this.state) {
			this.state.lastActivity = Date.now();
		}

		try {
			const parsed = JSON.parse(stringMessage);
			const result = clientEventSchema.safeParse(parsed);
			
			if (!result.success) {
				console.error('[Game DO] Invalid message:', result.error);
				ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' } satisfies ServerEvent));
				return;
			}

			const event = result.data;
			console.log('[Game DO] Received event:', event.type);

			// Handle gameUpdate to store metadata
			if (event.type === 'gameUpdate') {
				if (this.state) {
					this.state.metadata = event.metadata;
					await this.ctx.storage.put('state', this.state);
				}
			}

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
			console.error('[Game DO] Error processing message:', error);
			ws.send(JSON.stringify({ type: 'error', message: 'Failed to process message' } satisfies ServerEvent));
		}
	}

	override async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
		const session = this.sessions.get(ws);
		console.log('[Game DO] WebSocket closed:', session?.id, 'code:', code, 'clean:', wasClean);
		
		if (code === 1006) {
			console.warn('[Game DO] WebSocket closed unexpectedly', reason);
		}
		
		this.sessions.delete(ws);
		
		// If all connections are closed, we could optionally clean up
		if (this.sessions.size === 0) {
			console.log('[Game DO] All connections closed');
		}
	}
}
