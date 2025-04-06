"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Player, GameHistory } from "@/lib/types";

interface GameOverProps {
  winner: Player;
  gameHistory: GameHistory[];
  onNewGame: () => void;
}

export function GameOver({ winner, gameHistory, onNewGame }: GameOverProps) {
  const winnerStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    averageScore: 0,
  };

  // Calculate historical stats
  gameHistory.forEach((game) => {
    game.players.forEach((player) => {
      if (player.name === winner.name) {
        winnerStats.gamesPlayed++;
        winnerStats.averageScore += player.averageScore;
      }
    });

    if (game.winner === winner.name) {
      winnerStats.gamesWon++;
    }
  });

  if (winnerStats.gamesPlayed > 0) {
    winnerStats.averageScore = Number(
      (winnerStats.averageScore / winnerStats.gamesPlayed).toFixed(2),
    );
  }

  const currentAverage =
    winner.dartsThrown > 0
      ? Number((winner.totalScore / winner.dartsThrown).toFixed(2))
      : 0;

  const isAboveAverage =
    currentAverage > winnerStats.averageScore && winnerStats.gamesPlayed > 0;

  return (
    <div className="relative">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Game Over!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Winner</h2>
            <p className="mt-2 text-3xl font-bold">{winner.name}</p>
            <p className="mt-1 text-lg">Rounds won: {winner.roundsWon}</p>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <h3 className="mb-2 font-medium">Performance Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Average Score:</span>
                <span className="font-medium">{currentAverage}</span>
              </div>

              {winnerStats.gamesPlayed > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>Historical Average:</span>
                    <span className="font-medium">
                      {winnerStats.averageScore}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Performance:</span>
                    <span
                      className={`font-medium ${isAboveAverage ? "text-green-500" : "text-amber-500"}`}
                    >
                      {isAboveAverage ? "Above Average" : "Below Average"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={onNewGame} className="w-full">
            New Game
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
