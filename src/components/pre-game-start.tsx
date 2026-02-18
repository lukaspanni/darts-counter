import "client-only";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { LiveStreamControl } from "@/components/live-stream-control";
import { useGameStore } from "@/lib/store-provider";
import posthog from "posthog-js";

export function PreGameStart() {
  const { players, setActivePlayer, setGamePhase, startGame, gameSettings } =
    useGameStore((state) => state);
  const [startingPlayerId, setStartingPlayerId] = useState<number>(
    players[0]?.id || 1,
  );

  const handleStartGame = useCallback(() => {
    posthog.capture("match_started", {
      history_event: "match_started",
      player_count: players.length,
      starting_score: gameSettings.startingScore,
      out_mode: gameSettings.outMode,
      game_mode: gameSettings.gameMode,
      legs_to_win: gameSettings.legsToWin,
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
    <div className="flex w-full flex-col gap-4 lg:mx-auto lg:w-xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Who starts?</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={startingPlayerId.toString()}
            onValueChange={(value) =>
              setStartingPlayerId(Number.parseInt(value))
            }
            className="space-y-4"
          >
            {players.map((player) => (
              <div key={player.id} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={player.id.toString()}
                  id={`player-${player.id}`}
                />
                <Label
                  htmlFor={`player-${player.id}`}
                  className="text-lg font-medium"
                >
                  {player.name}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <Button onClick={handleStartGame}>Start Match</Button>
        </CardFooter>
      </Card>

      <LiveStreamControl />
    </div>
  );
}
