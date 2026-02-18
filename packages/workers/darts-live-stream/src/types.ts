import { z } from 'zod';
import type { LiveStreamGameMetadata } from '@darts-counter/shared';

// Re-export shared types used by other worker modules
export type { ClientEvent, ServerEvent } from '@darts-counter/shared';
export { clientEventSchema, serverEventSchema } from '@darts-counter/shared';

// Session types (worker-only)
export const sessionSchema = z.object({
	id: z.string().uuid(),
	role: z.enum(['host', 'viewer']),
});

export type Session = z.infer<typeof sessionSchema>;

// Game state stored in DO (worker-only)
export interface GameState {
	hostSecret: string;
	metadata: LiveStreamGameMetadata | null;
	createdAt: number;
	lastActivity: number;
}
