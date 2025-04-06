"use client";

import { Button } from "@/components/ui/button";
import { useGameHistory } from "@/lib/hooks/use-game-history";
import { Trash2 } from "lucide-react";

interface DeleteGameButtonProps {
  gameId: string;
  onSuccess?: () => void;
}

export function DeleteGameButton({ gameId, onSuccess }: DeleteGameButtonProps) {
  const { removeGame } = useGameHistory();

  const handleDelete = () => {
    removeGame(gameId);
    onSuccess?.();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={handleDelete}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
