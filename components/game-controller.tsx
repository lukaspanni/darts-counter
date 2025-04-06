"use client";

import { useGameStore } from "@/lib/store";
import { GameSetup } from "@/components/game-setup";
import { PreGameStart } from "@/components/pre-game-start";
import { GamePlay } from "@/components/game-play";
import { GameOver } from "@/components/game-over";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { gameHistorySchema, type GameHistory } from "@/lib/schemas";
import { useEffect } from "react";

export function GameController() {
  const { gamePhase, players, gameWinner, resetGame } = useGameStore();

  const [gameHistory, setGameHistory] = useLocalStorage<GameHistory[]>(
    "dartsGameHistory",
    [],
    gameHistorySchema,
  );

  // Record game in history when a game completes
  useEffect(() => {
    if (gamePhase === "gameOver" && gameWinner !== null) {
      const winner = players.find((p) => p.id === gameWinner);
      if (!winner) return;

      const { gameSettings, currentRound } = useGameStore.getState();

      const newGameHistory: GameHistory = {
        id: Date.now(),
        date: new Date().toISOString(),
        players: players.map((p) => ({
          name: p.name,
          roundsWon: p.roundsWon,
          averageScore:
            p.dartsThrown > 0
              ? Number((p.totalScore / p.dartsThrown).toFixed(2))
              : 0,
        })),
        winner: winner.name,
        gameMode: `${gameSettings.startingScore} ${gameSettings.outMode} out`,
        roundsPlayed: currentRound,
      };

      setGameHistory([...gameHistory, newGameHistory]);
    }
  }, [gamePhase, gameWinner, players, setGameHistory, gameHistory]);

  // Render the appropriate component based on game phase
  switch (gamePhase) {
    case "setup":
      return <GameSetup />;
    case "preGame":
      return <PreGameStart />;
    case "playing":
      return <GamePlay />;
    case "gameOver":
      if (gameWinner !== null) {
        const winner = players.find((p) => p.id === gameWinner);
        if (winner) {
          return (
            <GameOver
              winner={winner}
              gameHistory={gameHistory}
              onNewGame={resetGame}
            />
          );
        }
      }
      // Fallback in case of error
      return <GameSetup />;
    default:
      return <GameSetup />;
  }
}
