import { createGameStore } from "../src/lib/store";
import type { GameSettings } from "../src/lib/schemas";

const defaultSettings: GameSettings = {
  startingScore: 501,
  outMode: "double",
  gameMode: "bestOf",
  totalLegs: 3,
  checkoutAssist: false,
};

function resolveSettings(
  settings?: Partial<GameSettings> & { gameMode?: GameSettings["gameMode"] },
): GameSettings {
  const sharedSettings = {
    startingScore: settings?.startingScore ?? defaultSettings.startingScore,
    outMode: settings?.outMode ?? defaultSettings.outMode,
    checkoutAssist: settings?.checkoutAssist ?? defaultSettings.checkoutAssist,
  };

  if (settings?.gameMode === "firstTo") {
    return {
      ...sharedSettings,
      gameMode: "firstTo",
      targetLegs: settings.targetLegs ?? 1,
    };
  }

  return {
    ...sharedSettings,
    gameMode: "bestOf",
    totalLegs: settings?.gameMode === "bestOf" ? (settings.totalLegs ?? 3) : 3,
  };
}

/**
 * Create a store with a game already in the "playing" phase.
 * Eliminates the repeated setGameSettings → setPlayers → startGame boilerplate.
 */
export function startGame(
  options: {
    settings?: Partial<GameSettings> & { gameMode?: GameSettings["gameMode"] };
    players?: string[];
  } = {},
) {
  const settings = resolveSettings(options.settings);
  const players = options.players ?? ["Alice"];

  const store = createGameStore();
  const state = store.getState();
  state.setGameSettings(settings);
  state.setPlayers(players.map((name) => ({ name })));
  state.startGame();

  return store;
}
