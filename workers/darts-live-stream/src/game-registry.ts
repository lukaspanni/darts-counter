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
		const timestamp = Date.now();

		const games = (await this.ctx.storage.get<GameRegistryEntry[]>('games')) || [];
		games.push({ gameId, createdAt: timestamp });

		// Store the updated list
		await this.ctx.storage.put('games', games);

		console.log(
			'[GameRegistry:GameRegistered]',
			JSON.stringify({ gameId, action: 'register_game', status: 'success', timestamp, totalGames: games.length }),
		);
	}

	/**
	 * Cleanup old games (should be called periodically, not on every registration)
	 * Games older than 24 hours are removed
	 */
	async cleanupOldGames(): Promise<void> {
		const games = (await this.ctx.storage.get<GameRegistryEntry[]>('games')) || [];
		const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
		const activeGames = games.filter((g) => g.createdAt > cutoffTime);

		if (activeGames.length !== games.length) {
			const removedCount = games.length - activeGames.length;
			await this.ctx.storage.put('games', activeGames);
			console.log(
				'[GameRegistry:CleanupComplete]',
				JSON.stringify({
					action: 'cleanup_old_games',
					status: 'success',
					removedCount,
					remainingGames: activeGames.length,
					timestamp: Date.now(),
				}),
			);
		}
	}

	async getActiveGames(): Promise<GameRegistryEntry[]> {
		const games = (await this.ctx.storage.get<GameRegistryEntry[]>('games')) || [];
		return games;
	}
}
