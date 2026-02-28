"use client";

import { GameSetup } from "@/components/game-setup";
import { PreGameStart } from "@/components/pre-game-start";
import { GamePlay } from "@/components/game-play";
import { GameOver } from "@/components/game-over";
import { useGameEventEffects } from "@/lib/hooks/use-game-event-effects";
import { useGameHistory } from "@/lib/hooks/use-game-history";
import { usePendingGame } from "@/lib/hooks/use-pending-game";
import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/store-provider";

export function GameController() {
  useGameEventEffects();

  const {
    gameSettings,
    currentLeg,
    gamePhase,
    players,
    matchId,
    activePlayerId,
    currentVisitScores,
    currentVisitDarts,
    historyLegs,
    matchWinner,
    resetGame,
  } = useGameStore((state) => state);

  const { gameHistory, addGame } = useGameHistory();
  const { savePendingGame, clearPendingGame } = usePendingGame();
  const [isInitialRender, setIsInitialRender] = useState(true);

  useEffect(() => {
    if (gamePhase !== "playing") {
      return;
    }

    const hasAnyVisits = historyLegs.some((leg) => leg.visits.length > 0);
    if (!hasAnyVisits || !matchId) {
      return;
    }

    savePendingGame({
      matchId,
      date: new Date().toISOString(),
      players,
      activePlayerId,
      gameSettings,
      currentLeg,
      currentVisitScores,
      currentVisitDarts,
      historyLegs,
    });
  }, [
    gamePhase,
    historyLegs,
    matchId,
    players,
    activePlayerId,
    gameSettings,
    currentLeg,
    currentVisitScores,
    currentVisitDarts,
    savePendingGame,
  ]);

  useEffect(() => {
    if (isInitialRender && gamePhase === "gameOver" && matchWinner !== null) {
      setIsInitialRender(false);
      clearPendingGame();

      const winnerPlayer = players.find((p) => p.id === matchWinner);
      const newGameHistory = {
        id: matchId ?? crypto.randomUUID(),
        date: new Date().toISOString(),
        players: players.map((p) => ({
          id: p.id,
          name: p.name,
          legsWon: p.legsWon,
        })),
        winner: winnerPlayer?.name || "",
        gameMode: `${gameSettings.startingScore} ${gameSettings.outMode} out`,
        legsPlayed: currentLeg,
        settings: gameSettings,
        legs: historyLegs,
      };
      addGame(newGameHistory);
    }
  }, [
    gamePhase,
    matchWinner,
    clearPendingGame,
    players,
    matchId,
    gameSettings,
    currentLeg,
    historyLegs,
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
      if (matchWinner !== null) {
        const winner = players.find((p) => p.id === matchWinner);
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
