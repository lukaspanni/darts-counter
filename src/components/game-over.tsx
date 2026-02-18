import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Player, GameHistory } from "@/lib/schemas";
import { StartNewGameButton } from "./start-new-game-button";
import { calculatePlayerStats } from "@/lib/player-stats";

interface GameOverProps {
  winner: Player;
  gameHistory: GameHistory[];
  onNewGame: () => void;
}

export function GameOver({ winner, gameHistory, onNewGame }: GameOverProps) {
  const winnerStats = calculatePlayerStats(gameHistory).find(
    (stats) => stats.name === winner.name,
  );

  const currentAverage =
    winner.dartsThrown > 0
      ? Number(((winner.totalScore / winner.dartsThrown) * 3).toFixed(2))
      : 0;

  const isAboveAverage =
    currentAverage > (winnerStats?.averagePerVisit ?? 0) &&
    (winnerStats?.matchesPlayed ?? 0) > 0;

  return (
    <div>
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Match Over!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Winner</h2>
            <p className="mt-2 text-3xl font-bold">{winner.name}</p>
            <p className="mt-1 text-lg">Legs won: {winner.legsWon}</p>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <h3 className="mb-2 font-medium">Performance Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Average Score:</span>
                <span className="font-medium">{currentAverage}</span>
              </div>

              {(winnerStats?.matchesPlayed ?? 0) > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>Historical Average:</span>
                    <span className="font-medium">
                      {winnerStats?.averagePerVisit}
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
          <StartNewGameButton onNewGame={onNewGame} />
        </CardFooter>
      </Card>
    </div>
  );
}
