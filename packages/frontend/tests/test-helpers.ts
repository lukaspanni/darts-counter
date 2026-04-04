import { createGameStore } from "../src/lib/store";
import type { GameSettings } from "../src/lib/schemas";

const defaultSettings: GameSettings = {
  startingScore: 501,
  outMode: "double",
  gameMode: "bestOf",
  legsToWin: 3,
  checkoutAssist: false,
};

/**
 * Create a store with a game already in the "playing" phase.
 * Eliminates the repeated setGameSettings → setPlayers → startGame boilerplate.
 */
export function startGame(
  options: {
    settings?: Partial<GameSettings>;
    players?: string[];
  } = {},
) {
  const settings = { ...defaultSettings, ...options.settings };
  const players = options.players ?? ["Alice"];

  const store = createGameStore();
  const state = store.getState();
  state.setGameSettings(settings);
  state.setPlayers(players.map((name) => ({ name })));
  state.startGame();

  return store;
}
