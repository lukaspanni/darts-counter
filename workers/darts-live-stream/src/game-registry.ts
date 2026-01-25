import { DurableObject } from 'cloudflare:workers';

interface GameRegistryEntry {
	gameId: string;
	createdAt: number;
}

/**
 * GameRegistry Durable Object
 * 
 * Tracks all active game streams in the system.
 * - Registers new games when created
 * - Provides game discovery (future enhancement)
 * - Automatically cleans up old game entries (24 hour retention)
 */
export class GameRegistry extends DurableObject<Env> {
	async registerGame(gameId: string): Promise<void> {
		console.log(`[GameRegistry] Registering game with ID: ${gameId}`);
		
		const games = (await this.ctx.storage.get<GameRegistryEntry[]>('games')) || [];
		games.push({ gameId, createdAt: Date.now() });
		
		// Store the updated list
		await this.ctx.storage.put('games', games);
		
		// Optional: Clean up old games (e.g., older than 24 hours)
		const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
		const activeGames = games.filter(g => g.createdAt > cutoffTime);
		
		if (activeGames.length !== games.length) {
			await this.ctx.storage.put('games', activeGames);
		}
	}

	async getActiveGames(): Promise<GameRegistryEntry[]> {
		const games = (await this.ctx.storage.get<GameRegistryEntry[]>('games')) || [];
		return games;
	}
}
