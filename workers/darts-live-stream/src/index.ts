export { GameRegistry } from './game-registry';
export { Game } from './game';

const GAME_REGISTRIY_DO_NAME = 'GameRegistry';
const PATH_REGEX = /^\/game(\/([a-z0-9-]{36}))?\/?$/i;

// PLAN
// - Creating games is handles using POST requests to /game with a host-secret
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
	console.log('[Worker] Creating game with ID:', gameId, 'and host secret:', hostSecret);

	try {
		// create the DO for the game and initialize it with the host secret
		const gameDOId = env.GAME.idFromName(gameId);
		const gameStub = env.GAME.get(gameDOId);
		await gameStub.init(hostSecret);

		// register the new game
		const gameRegistryId = env.GAME_REGISTRY.idFromName(GAME_REGISTRIY_DO_NAME);
		const gameRegistryStub = env.GAME_REGISTRY.get(gameRegistryId);
		await gameRegistryStub.registerGame(gameId);

		return new Response(JSON.stringify({ gameId, hostSecret }), {
			status: 201,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	} catch (error) {
		console.error('[Worker] Error creating game:', error);
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

	const id = env.GAME.idFromName(gameId);
	const stub = env.GAME.get(id);

	return stub.fetch(request);
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
		// handle invalid methods and paths above
		if (request.method !== 'GET' && request.method !== 'POST')
			return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, POST' } });

		const requestUrl = new URL(request.url);
		const pathMatch = requestUrl.pathname.match(PATH_REGEX);
		if (!pathMatch) return new Response('Not Found', { status: 404 });
		const pathId = pathMatch[2];
		console.log('[Worker] Received request:', request.method, request.url, 'Path ID:', pathId);

		if (request.method === 'POST') return handleCreateGame(request, env, ctx);
		if (request.method === 'GET' && pathId) return handleSubscribeGame(request, env, ctx, pathId);
		return new Response('Bad Request', { status: 400 });
	},
} satisfies ExportedHandler<Env>;
