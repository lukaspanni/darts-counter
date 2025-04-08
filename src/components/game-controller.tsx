"use client";

import { GameSetup } from "@/components/game-setup";
import { PreGameStart } from "@/components/pre-game-start";
import { GamePlay } from "@/components/game-play";
import { GameOver } from "@/components/game-over";
import { useGameHistory } from "@/lib/hooks/use-game-history";
import { useEffect, useState, useMemo } from "react";
import { useGameStore } from "@/lib/store-provider";

export function GameController() {
  const {
    gameSettings,
    currentRound,
    gamePhase,
    players,
    gameWinner,
    resetGame,
  } = useGameStore((state) => state);

  const { gameHistory, addGame } = useGameHistory();
  const [isInitialRender, setIsInitialRender] = useState(true);


  const winner = useMemo(() => {
    return !!gameWinner
      ? null
      : players.find((p) => p.id === gameWinner) || null;
  }, [gameWinner, players]);

  useEffect(() => {
    if (
      isInitialRender &&
      gamePhase === "gameOver" &&
      gameWinner !== null &&
      winner
    ) {
      setIsInitialRender(false);
      const newGameHistory = {
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
      addGame(newGameHistory);
    }
  }, [
    gamePhase,
    gameWinner,
    players,
    winner,
    gameSettings,
    currentRound,
    addGame,
    isInitialRender,
  ]);

  // Render the appropriate component based on game phase
  switch (gamePhase) {
    case "setup":
      return <GameSetup />;
    case "preGame":
      return <PreGameStart />;
    case "playing":
      return <GamePlay />;
    case "gameOver":
      if (winner) {
        return (
          <GameOver
            winner={winner}
            gameHistory={gameHistory}
            onNewGame={resetGame}
          />
        );
      }
      // Fallback in case of error
      return <GameSetup />;
    default:
      return <GameSetup />;
  }
}
