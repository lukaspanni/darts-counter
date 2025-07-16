import { DurableObject } from 'cloudflare:workers';
import { z } from 'zod';

type Session = { id: string; data: any };
const idSchema = z.string().uuid();

export class Game extends DurableObject<Env> {
	sessions: Map<WebSocket, Session> = new Map();

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.sessions = new Map();
		this.ctx.getWebSockets().forEach((ws) => {
			const meta = ws.deserializeAttachment();
			// TODO: make typesafe
			this.sessions.set(ws, { ...meta });
		});
	}

	public async init(hostSecret: string): Promise<void> {
		console.log('Initializing game with host secret:', hostSecret);
		// TODO: store and verify later
	}

	public async fetch(request: Request): Promise<Response> {
		const { success: idOk, data: id, error: idError } = idSchema.safeParse(request.headers.get('X-DO-Session-Id'));
		if (!idOk) return new Response(`Invalid session ID: ${idError.message}`, { status: 400 });

		console.log('Processing request with id:', id);
		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		this.ctx.acceptWebSocket(server);

		server.serializeAttachment({ id, data: 'TEST' });
		this.sessions.set(server, { id, data: 'TEST' });

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
		const stringMessage = typeof message === 'string' ? message : new TextDecoder().decode(message);
		console.log('Received message:', stringMessage);
		const session = this.sessions.get(ws);
		if (!session) return;
		if (stringMessage.length < 1) return;

		// TODO: make typesafe, add error handling
		const parsedMessage = JSON.parse(stringMessage);
		if (parsedMessage.type === 'broadcast') {
			console.log('Sending out broadcast message', this.sessions);
			this.ctx.getWebSockets().forEach((client) => {
				const { id } = client.deserializeAttachment() || session;
				if (id !== session.id) {
					console.log('Sending broadcast message to client', id);
					client.send(JSON.stringify({ type: 'broadcast', data: parsedMessage.data }));
				}
			});
		}
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
		// TODO: if the master closes, also close all other websockets for the given master
		if (code === 1006) {
			console.warn('WebSocket closed unexpectedly', reason);
			ws.close(1008, `Unexpected close received, ${reason}`);
			this.sessions.delete(ws);
			return;
		}
		ws.close(code, `Durable Object closing websocket, ${reason}`);
		this.sessions.delete(ws);
	}
}
