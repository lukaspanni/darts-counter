import "client-only";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { LiveStreamControl } from "@/components/live-stream-control";
import { getConfiguredLegCount, getGameModeLabel } from "@/lib/schemas";
import { useGameStore } from "@/lib/store-provider";
import posthog from "posthog-js";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function PreGameStart() {
  const { players, setActivePlayer, setGamePhase, startGame, gameSettings } =
    useGameStore((state) => state);
  const [startingPlayerId, setStartingPlayerId] = useState<number>(
    players[0]?.id ?? 1,
  );

  const handleStartGame = useCallback(() => {
    posthog.capture("match_started", {
      history_event: "match_started",
      player_count: players.length,
      starting_score: gameSettings.startingScore,
      out_mode: gameSettings.outMode,
      game_mode: gameSettings.gameMode,
      legs_to_win: getConfiguredLegCount(gameSettings),
    });
    setActivePlayer(startingPlayerId);
    startGame();
  }, [
    startingPlayerId,
    setActivePlayer,
    startGame,
    players.length,
    gameSettings,
  ]);

  const handleBack = useCallback(() => {
    setGamePhase("setup");
  }, [setGamePhase]);

  useEffect(() => {
    if (players.length === 1) {
      handleStartGame();
    }
  }, [handleStartGame, players.length]);

  return (
    <div className="flex w-full flex-col gap-6 lg:mx-auto lg:max-w-xl">
      <div>
        <h2 className="mb-1 text-2xl font-bold tracking-tight">
          Who throws first?
        </h2>
        <p className="text-muted-foreground text-sm">
          {gameSettings.startingScore} ·{" "}
          {gameSettings.outMode === "single" ? "Single" : "Double"} out ·{" "}
          {getGameModeLabel(gameSettings)} {getConfiguredLegCount(gameSettings)}{" "}
          legs
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {players.map((player) => {
          const isSelected = startingPlayerId === player.id;
          return (
            <button
              key={player.id}
              type="button"
              onClick={() => setStartingPlayerId(player.id)}
              aria-pressed={isSelected}
              className={cn(
                "focus-visible:ring-ring relative rounded-lg border-2 px-4 py-6 text-center transition-all outline-none focus-visible:ring-2 active:scale-[0.98]",
                isSelected
                  ? "border-primary bg-primary/5 dark:bg-primary/10"
                  : "border-border hover:border-foreground/20 bg-transparent",
              )}
            >
              {isSelected && (
                <span className="bg-primary text-primary-foreground absolute top-2 right-2 flex size-5 items-center justify-center rounded-full">
                  <Check className="size-3" />
                </span>
              )}
              <span className="text-lg font-semibold">{player.name}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button size="lg" onClick={handleStartGame}>
          Start Match
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <LiveStreamControl />
    </div>
  );
}
