import "client-only";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb } from "lucide-react";
import type { Player } from "@/lib/schemas";

interface ScoreDisplayProps {
  players: Player[];
  activePlayerId: number;
  currentRound: number;
  dartsInRound: number;
  currentRoundScore: number;
  checkoutSuggestion: string | null;
  bust: boolean;
}

export function ScoreDisplay({
  players,
  activePlayerId,
  currentRound,
  dartsInRound,
  currentRoundScore,
  checkoutSuggestion,
  bust,
}: ScoreDisplayProps) {
  const activePlayer = players.find((p) => p.id === activePlayerId)!;

  // Calculate average score - fixed formula with 2 decimal places
  const calculateAverage = (player: Player) => {
    if (player.dartsThrown === 0) return 0;
    return ((player.totalScore / player.dartsThrown) * 3).toFixed(2);
  };
  return (
    <div className="mb-4 space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-xl">
            {activePlayer.name}&apos;s Turn
          </CardTitle>
        </CardHeader>
        <CardContent>
          {players.length === 1 ? (
            // Single player display
            <div className="bg-muted flex flex-col items-center rounded-lg p-2">
              <span className="text-sm font-medium">{activePlayer.name}</span>
              <span
                className={`text-4xl font-bold ${!!checkoutSuggestion ? "text-green-500" : ""}`}
              >
                {activePlayer.score}
              </span>
              <span className="text-muted-foreground text-xs">
                Rounds won: {activePlayer.roundsWon}
              </span>
            </div>
          ) : (
            // Two player display
            <div className="grid grid-cols-2 gap-4">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`flex flex-col items-center rounded-lg p-2 ${player.id === activePlayerId ? "bg-muted" : ""}`}
                >
                  <span className="text-sm font-medium">{player.name}</span>
                  <span
                    className={`text-4xl font-bold ${
                      player.id === activePlayerId && !!checkoutSuggestion
                        ? "text-green-500"
                        : ""
                    }`}
                  >
                    {player.score}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Rounds won: {player.roundsWon}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Checkout suggestion */}
          {!!checkoutSuggestion && (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-2">
              <Lightbulb className="h-4 w-4 text-green-600" />
              <div>
                <span className="text-sm font-medium text-green-800">
                  Possible checkout:{" "}
                </span>
                <Badge
                  variant="outline"
                  className="ml-1 bg-white text-green-700"
                >
                  {checkoutSuggestion}
                </Badge>
              </div>
            </div>
          )}

          {/* Current round score */}
          <div className="mt-3 text-center">
            <span className="text-muted-foreground text-sm">
              Current round:
            </span>
            <span className="ml-2 font-medium">{currentRoundScore}</span>
          </div>

          {/* Visual indicator for darts thrown */}
          <div className="mt-3 mb-1 flex justify-center gap-2">
            {bust ? (
              <div className="flex items-center space-x-2">
                <span className="text-red-500">Bust!</span>
              </div>
            ) : (
              [0, 1, 2].map((index) => (
                <div
                  key={index}
                  className={`h-3 w-3 rounded-full ${index < dartsInRound ? "bg-primary" : "bg-muted-foreground/30"}`}
                />
              ))
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="text-muted-foreground">Round</p>
              <p className="font-medium">{currentRound}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Darts</p>
              <p className="font-medium">{dartsInRound}/3</p>
            </div>
            <div>
              <p className="text-muted-foreground">Average</p>
              <p className="font-medium">{calculateAverage(activePlayer)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
