"use client";

import { useState } from "react";
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
import { useGameStore } from "@/lib/store-provider";

export function PreGameStart() {
  const { players, setActivePlayer, setGamePhase, startGame } = useGameStore(
    (state) => state,
  );
  const [startingPlayerId, setStartingPlayerId] = useState<number>(
    players[0]?.id || 1,
  );

  const handleStartGame = () => {
    setActivePlayer(startingPlayerId);
    startGame();
  };

  const handleBack = () => {
    setGamePhase("setup");
  };

  // If there's only one player, skip the player selection screen
  if (players.length === 1) {
    return (
      <Card className="w-full lg:w-xl">
        <CardHeader>
          <CardTitle className="text-center">Ready to Play</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-center">
            Single player mode: {players[0].name}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <Button onClick={handleStartGame}>Start Game</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full lg:w-xl">
      <CardHeader>
        <CardTitle className="text-center">Who starts?</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          defaultValue={startingPlayerId.toString()}
          onValueChange={(value) => setStartingPlayerId(Number.parseInt(value))}
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
        <Button onClick={handleStartGame}>Start Game</Button>
      </CardFooter>
    </Card>
  );
}
