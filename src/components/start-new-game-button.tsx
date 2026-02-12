"use client";

import { Button } from "@/components/ui/button";
import posthog from "posthog-js";

export function StartNewGameButton({ onNewGame }: { onNewGame: () => void }) {
  const handleClick = () => {
    posthog.capture("new_game_started_from_game_over");
    onNewGame();
  };

  return (
    <Button onClick={handleClick} className="w-full">
      New Game
    </Button>
  );
}
