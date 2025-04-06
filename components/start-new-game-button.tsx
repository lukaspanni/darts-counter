"use client";

import { Button } from "@/components/ui/button";

export function StartNewGameButton({ onNewGame }: { onNewGame: () => void }) {
  return (
    <Button onClick={onNewGame} className="w-full">
      New Game
    </Button>
  );
}
