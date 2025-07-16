import { DurableObject } from 'cloudflare:workers';

export class GameRegistry extends DurableObject<Env> {
	async registerGame(gameId: string): Promise<void> {
		// TODO
		console.log(`Registering game with ID: ${gameId}`);
	}
}
