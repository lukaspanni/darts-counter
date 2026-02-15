"use client";

import { GameSetup } from "@/components/game-setup";
import { PreGameStart } from "@/components/pre-game-start";
import { GamePlay } from "@/components/game-play";
import { GameOver } from "@/components/game-over";
import { useGameHistory } from "@/lib/hooks/use-game-history";
import { calculateEnhancedStats } from "@/lib/enhanced-stats";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/store-provider";

export function GameController() {
  const {
    gameSettings,
    currentLeg,
    gamePhase,
    players,
    matchWinner,
    resetGame,
  } = useGameStore((state) => state);

  const { gameHistory, addGame } = useGameHistory();
  const [isInitialRender, setIsInitialRender] = useState(true);

  useEffect(() => {
    if (isInitialRender && gamePhase === "gameOver" && matchWinner !== null) {
      setIsInitialRender(false);

      const winnerPlayer = players.find((p) => p.id === matchWinner);
      const winnerAverage =
        winnerPlayer && winnerPlayer.dartsThrown > 0
          ? Number(
              (
                (winnerPlayer.totalScore / winnerPlayer.dartsThrown) *
                3
              ).toFixed(2),
            )
          : 0;

      posthog.capture("match_completed", {
        player_count: players.length,
        legs_played: currentLeg,
        starting_score: gameSettings.startingScore,
        out_mode: gameSettings.outMode,
        winner_average: winnerAverage,
      });

      const newGameHistory = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        players: players.map((p) => {
          const enhancedStats = calculateEnhancedStats(p);
          return {
            name: p.name,
            legsWon: p.legsWon,
            averageScore:
              p.dartsThrown > 0
                ? Number(((p.totalScore / p.dartsThrown) * 3).toFixed(2))
                : 0,
            first9Average: enhancedStats.first9Average,
            highestScore: enhancedStats.highestScore,
            count180s: enhancedStats.count180s,
            count100Plus: enhancedStats.count100Plus,
            checkoutAttempts: enhancedStats.checkoutAttempts,
            checkoutSuccess: enhancedStats.checkoutSuccess,
            averageDartsPerLeg: enhancedStats.averageDartsPerLeg,
            totalDarts: enhancedStats.totalDarts,
          };
        }),
        winner: winnerPlayer?.name || "",
        gameMode: `${gameSettings.startingScore} ${gameSettings.outMode} out`,
        legsPlayed: currentLeg,
      };
      addGame(newGameHistory);
    }
  }, [
    gamePhase,
    matchWinner,
    players,
    gameSettings,
    currentLeg,
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
      if (matchWinner) {
        return (
          <GameOver
            winner={players.find((p) => p.id === matchWinner)!}
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
