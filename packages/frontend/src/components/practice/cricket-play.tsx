"use client";

import { Dartboard } from "@/components/dartboard";
import { ScoreKeypad } from "@/components/score-keypad";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePracticeStore } from "@/lib/practice-store-provider";
import { CRICKET_SEGMENTS } from "@/lib/core/cricket";
import type { ScoreModifier } from "@/lib/schemas";
import { cn } from "@/lib/utils";

function MarksDisplay({ marks }: { marks: number }) {
  if (marks === 0) return <span className="text-muted-foreground">-</span>;
  if (marks === 1) return <span>○</span>;
  if (marks === 2) return <span>/</span>;
  if (marks === 3) return <span className="text-primary font-bold">X</span>;
  // closed with points
  return <span className="text-primary font-bold">⊗</span>;
}

function DartPip({ filled }: { filled: boolean }) {
  return (
    <div
      className={cn(
        "h-2.5 w-2.5 rounded-full border-2",
        filled ? "border-primary bg-primary" : "border-muted-foreground",
      )}
    />
  );
}

export function CricketPlay() {
  const modeState = usePracticeStore((s) => s.modeState);
  const handleDartThrow = usePracticeStore((s) => s.handleDartThrow);
  const finishVisit = usePracticeStore((s) => s.finishVisit);
  const endSession = usePracticeStore((s) => s.endSession);
  const resetPractice = usePracticeStore((s) => s.resetPractice);
  const phase = usePracticeStore((s) => s.phase);

  if (!modeState || modeState.mode !== "cricket") return null;

  const {
    players,
    activePlayerIndex,
    currentVisitDarts,
    gameComplete,
    winnerIndex,
  } = modeState;

  const canThrowMoreDarts = currentVisitDarts < 3 && !gameComplete;
  const isMultiplayer = players.length > 1;

  const onScoreEntry = (score: number, modifier: ScoreModifier) => {
    handleDartThrow(score, modifier);
  };

  if (gameComplete || phase === "sessionComplete") {
    return (
      <main className="flex grow flex-col items-center px-4 pb-8 pt-6">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center">
            {winnerIndex !== null ? (
              <>
                <h2 className="text-2xl font-bold tracking-tight">Game Over!</h2>
                <p className="mt-2 text-muted-foreground">
                  {isMultiplayer
                    ? `Player ${winnerIndex + 1} wins!`
                    : "You closed the board!"}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold tracking-tight">Session Complete</h2>
                <p className="mt-2 text-muted-foreground">Cricket session ended early</p>
              </>
            )}
          </div>

          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-base">Final Scores</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-1.5 text-left font-medium text-muted-foreground">
                      Segment
                    </th>
                    {players.map((_, i) => (
                      <th
                        key={i}
                        className="py-1.5 text-center font-medium text-muted-foreground"
                      >
                        {isMultiplayer ? `P${i + 1}` : "Marks"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CRICKET_SEGMENTS.map((seg) => (
                    <tr key={seg} className="border-b border-border/50">
                      <td className="py-1.5 font-medium">
                        {seg === 25 ? "Bull" : seg}
                      </td>
                      {players.map((player, i) => (
                        <td key={i} className="py-1.5 text-center">
                          <MarksDisplay marks={player.marks[seg] ?? 0} />
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td className="py-1.5 font-bold">Points</td>
                    {players.map((player, i) => (
                      <td key={i} className="py-1.5 text-center font-bold">
                        {player.points}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Button className="w-full" onClick={resetPractice}>
            Play Again
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex grow flex-col items-center px-4 pb-8 pt-6">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Cricket</h2>
          <div className="flex gap-2">
            {isMultiplayer && (
              <Button
                variant="outline"
                size="sm"
                onClick={finishVisit}
                disabled={gameComplete || currentVisitDarts === 0}
              >
                Finish Visit
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => endSession()}
            >
              End Session
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-4 pb-4">
            {isMultiplayer && (
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm font-medium">
                  Player {activePlayerIndex + 1}&apos;s turn
                </span>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <DartPip key={i} filled={i < currentVisitDarts} />
                  ))}
                </div>
              </div>
            )}

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-1.5 text-left font-medium text-muted-foreground">
                    Segment
                  </th>
                  {players.map((_, i) => (
                    <th
                      key={i}
                      className={cn(
                        "py-1.5 text-center font-medium",
                        isMultiplayer && activePlayerIndex === i
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      {isMultiplayer ? `P${i + 1}` : "Marks"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CRICKET_SEGMENTS.map((seg) => (
                  <tr key={seg} className="border-b border-border/50">
                    <td className="py-1.5 font-medium">
                      {seg === 25 ? "Bull" : seg}
                    </td>
                    {players.map((player, i) => (
                      <td key={i} className="py-1.5 text-center">
                        <MarksDisplay marks={player.marks[seg] ?? 0} />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="py-1.5 font-bold text-xs uppercase tracking-wide text-muted-foreground">
                    Points
                  </td>
                  {players.map((player, i) => (
                    <td
                      key={i}
                      className={cn(
                        "py-1.5 text-center font-bold",
                        isMultiplayer && activePlayerIndex === i
                          ? "text-primary"
                          : "",
                      )}
                    >
                      {player.points}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            {!isMultiplayer && (
              <div className="mt-3 flex items-center gap-2 border-t pt-3">
                <span className="text-xs text-muted-foreground">
                  Darts thrown:
                </span>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <DartPip key={i} filled={i < currentVisitDarts} />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Dartboard
            onScoreEntry={onScoreEntry}
            disabled={!canThrowMoreDarts}
          />
          <ScoreKeypad
            onScoreEntry={onScoreEntry}
            canThrowMoreDarts={canThrowMoreDarts}
          />
        </div>
      </div>
    </main>
  );
}
