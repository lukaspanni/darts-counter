/**
 * Live Stream Worker - Entry Point
 *
 * This worker handles WebSocket connections for live streaming dart games.
 * It routes requests to appropriate Durable Objects (Game or GameRegistry)
 * and manages the creation and subscription of game streams.
 */

export { GameRegistry } from './game-registry';
export { Game } from './game';

const GAME_REGISTRY_DO_NAME = 'GameRegistry';
const PATH_REGEX = /^\/game(\/([a-z0-9-]{36}))?\/?$/i;
const ALLOWED_ORIGINS = new Set(['http://localhost:3000', 'https://darts.lukaspanni.de']);
const CORS_HEADERS = {
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, X-DO-Host-Secret, X-DO-Session-Id',
	'Access-Control-Max-Age': '86400',
};

const getCorsOrigin = (request: Request): string | null => {
	const origin = request.headers.get('Origin');
	if (origin && ALLOWED_ORIGINS.has(origin)) return origin;
	return null;
};

const withCors = (response: Response, request: Request): Response => {
	const origin = getCorsOrigin(request);
	if (!origin) return response;

	const headers = new Headers(response.headers);
	headers.set('Access-Control-Allow-Origin', origin);
	headers.set('Vary', 'Origin');
	Object.entries(CORS_HEADERS).forEach(([key, value]) => headers.set(key, value));

	// For WebSocket upgrade responses, preserve the webSocket property
	// Cloudflare Workers extend Response with webSocket for WebSocket upgrades
	const responseWithSocket = response as Response & { webSocket?: unknown };
	const init: ResponseInit = {
		status: response.status,
		statusText: response.statusText,
		headers,
	};
	if (responseWithSocket.webSocket) {
		return new Response(null, {
			...init,
			webSocket: responseWithSocket.webSocket,
		} as ResponseInit);
	}

	return new Response(response.body, init);
};

// PLAN
// - Creating games is handled using POST requests to /game with a host-secret
//   - A game is created inside the worker by creating a new Durable Object instance and setting the host secret
//     - The new game is stored in a global Durable Object that tracks all active games together with the creation timestamp
//   - The game id is returned to the client
//   - The client can then connect to the game DO using a GET request to /game/{id}/ -> this will open a WebSocket connection under the host role (if the host secret is set via X-DO-Host-Secret header)
// - Clients can subscribe to the game using a GET request to /game/{id}/

/**
 * Handles creating a new game.
 * @param request - the request to create a new game
 * @param env - The interface to reference bindings declared in wrangler.jsonc
 * @param ctx - The execution context of the Worker
 * @returns a Response object with the game ID and host secret needed to initialize the websocket connection
 */
const handleCreateGame = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
	const gameId = crypto.randomUUID();
	const hostSecret = Array.from(crypto.getRandomValues(new Uint8Array(16)))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	try {
		// create the DO for the game and initialize it with the host secret
		const gameDOId = env.GAME.idFromName(gameId);
		const gameStub = env.GAME.get(gameDOId);
		await gameStub.init(hostSecret);

		// register the new game
		const gameRegistryId = env.GAME_REGISTRY.idFromName(GAME_REGISTRY_DO_NAME);
		const gameRegistryStub = env.GAME_REGISTRY.get(gameRegistryId);
		await gameRegistryStub.registerGame(gameId);

		console.log('[Worker:GameCreated]', JSON.stringify({ gameId, timestamp: Date.now(), action: 'create_game', status: 'success' }));

		return new Response(JSON.stringify({ gameId, hostSecret }), {
			status: 201,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	} catch (error) {
		console.error('[Worker:GameCreateError]', JSON.stringify({ gameId, error: String(error), timestamp: Date.now(), action: 'create_game', status: 'error' }));
		return new Response('Internal Server Error', { status: 500 });
	}
};

/**
 * Handles creating the WebSocket connection for hosting a game or subscribing to game updates.
 * @param request - the request to open a WebSocket connection
 * @param env - The interface to reference bindings declared in wrangler.jsonc
 * @param ctx - The execution context of the Worker
 * @param gameId - the ID of the game
 * @returns a Response object that upgrades the connection to a WebSocket
 */
const handleSubscribeGame = async (request: Request, env: Env, ctx: ExecutionContext, gameId: string): Promise<Response> => {
	const upgradeHeader = request.headers.get('Upgrade');
	if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') return new Response('Expected Upgrade: websocket', { status: 426 });

	try {
		// Extract session ID and host secret from query params or headers
		// Note: WebSocket connections from browsers cannot send custom headers,
		// so we accept hostSecret from query params for WebSocket upgrade only
		const url = new URL(request.url);
		const sessionId = url.searchParams.get('sessionId') || request.headers.get('X-DO-Session-Id') || crypto.randomUUID();
		const hostSecret = url.searchParams.get('hostSecret') || request.headers.get('X-DO-Host-Secret');
		const role = hostSecret ? 'host' : 'viewer';

		// Create a new request with the extracted values as headers for the DO
		const doRequest = new Request(request.url, request);
		doRequest.headers.set('X-DO-Session-Id', sessionId);
		if (hostSecret) {
			doRequest.headers.set('X-DO-Host-Secret', hostSecret);
		}

		const id = env.GAME.idFromName(gameId);
		const stub = env.GAME.get(id);

		console.log('[Worker:WebSocketUpgrade]', JSON.stringify({ gameId, sessionId, role, timestamp: Date.now(), action: 'websocket_upgrade', status: 'success' }));

		return await stub.fetch(doRequest);
	} catch (error) {
		console.error('[Worker:WebSocketUpgradeError]', JSON.stringify({ gameId, error: String(error), timestamp: Date.now(), action: 'websocket_upgrade', status: 'error' }));
		return new Response('Internal Server Error', { status: 500 });
	}
};

export default {
	/**
	 * This is the standard fetch handler for a Cloudflare Worker
	 *
	 * @param request - The request submitted to the Worker from the client
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 * @param ctx - The execution context of the Worker
	 * @returns The response to be sent back to the client
	 */
	async fetch(request, env, ctx): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return withCors(new Response(null, { status: 204, headers: { Allow: 'GET, POST, OPTIONS' } }), request);
		}

		// handle invalid methods and paths above
		if (request.method !== 'GET' && request.method !== 'POST') {
			return withCors(new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, POST' } }), request);
		}

		const requestUrl = new URL(request.url);
		const pathMatch = requestUrl.pathname.match(PATH_REGEX);
		if (!pathMatch) return withCors(new Response('Not Found', { status: 404 }), request);
		const pathId = pathMatch[2];

		if (request.method === 'POST') return withCors(await handleCreateGame(request, env, ctx), request);
		if (request.method === 'GET' && pathId) return withCors(await handleSubscribeGame(request, env, ctx, pathId), request);
		return withCors(new Response('Bad Request', { status: 400 }), request);
	},
} satisfies ExportedHandler<Env>;
