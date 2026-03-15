import { DurableObject } from 'cloudflare:workers';

interface RateLimitResult {
	allowed: boolean;
	retryAfter: number | null;
}

const LIMITS = [
	{ window: 60_000, max: 2 }, // 2 per minute
	{ window: 3_600_000, max: 20 }, // 20 per hour
] as const;

/**
 * RateLimiter Durable Object
 *
 * Tracks game creation timestamps per client IP using a sliding window.
 * One instance per IP address.
 */
export class RateLimiter extends DurableObject<Env> {
	async checkLimit(): Promise<RateLimitResult> {
		const now = Date.now();
		const maxWindow = LIMITS[LIMITS.length - 1].window;

		// Load and prune timestamps outside the largest window
		let timestamps = (await this.ctx.storage.get<number[]>('timestamps')) || [];
		timestamps = timestamps.filter((t) => now - t < maxWindow);

		for (const { window, max } of LIMITS) {
			const windowStart = now - window;
			const count = timestamps.filter((t) => t >= windowStart).length;
			if (count >= max) {
				// Find the oldest timestamp in this window to calculate retry-after
				const oldestInWindow = timestamps.filter((t) => t >= windowStart).sort((a, b) => a - b)[0];
				const retryAfter = Math.ceil((oldestInWindow + window - now) / 1000);
				return { allowed: false, retryAfter };
			}
		}

		timestamps.push(now);
		await this.ctx.storage.put('timestamps', timestamps);
		return { allowed: true, retryAfter: null };
	}
}
