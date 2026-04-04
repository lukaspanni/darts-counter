"use client";

import { Dartboard } from "@/components/dartboard";
import { ScoreKeypad } from "@/components/score-keypad";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePracticeStore } from "@/lib/practice-store-provider";
import type { ScoreModifier } from "@/lib/schemas";

export function AroundTheClockPlay() {
  const modeState = usePracticeStore((s) => s.modeState);
  const handleDartThrow = usePracticeStore((s) => s.handleDartThrow);
  const endSession = usePracticeStore((s) => s.endSession);
  const resetPractice = usePracticeStore((s) => s.resetPractice);
  const phase = usePracticeStore((s) => s.phase);

  if (modeState?.mode !== "aroundTheClock") return null;

  const {
    currentTarget,
    totalDarts,
    dartsPerSegment,
    sessionComplete,
    currentSegmentDarts,
  } = modeState;

  const onScoreEntry = (score: number, modifier: ScoreModifier) => {
    handleDartThrow(score, modifier);
  };

  if (sessionComplete || phase === "sessionComplete") {
    return (
      <main className="flex grow flex-col items-center px-4 pt-6 pb-8">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              Session Complete!
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              You finished Around the Clock
            </p>
          </div>

          <Card>
            <CardHeader className="pt-4 pb-2">
              <CardTitle className="text-base">Results</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="mb-4 text-center">
                <p className="text-4xl font-bold">{totalDarts}</p>
                <p className="text-muted-foreground text-sm">Total Darts</p>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-muted-foreground py-1 text-left font-medium">
                      Target
                    </th>
                    <th className="text-muted-foreground py-1 text-right font-medium">
                      Darts
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dartsPerSegment.map((darts, idx) => (
                    <tr key={idx} className="border-border/50 border-b">
                      <td className="py-1">{idx + 1}</td>
                      <td className="py-1 text-right">{darts}</td>
                    </tr>
                  ))}
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
    <main className="flex grow flex-col items-center px-4 pt-6 pb-8">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Around the Clock</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              endSession();
            }}
          >
            End Session
          </Button>
        </div>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Current Target
                </p>
                <p className="text-primary text-6xl font-bold">
                  {currentTarget}
                </p>
                <p className="text-muted-foreground text-sm">
                  Target {currentTarget} / 20
                </p>
              </div>
              <div className="flex flex-1 flex-col gap-3 text-center">
                <div>
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Darts at Target
                  </p>
                  <p className="text-2xl font-bold">{currentSegmentDarts}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Total Darts
                  </p>
                  <p className="text-2xl font-bold">{totalDarts}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Dartboard onScoreEntry={onScoreEntry} />
          <ScoreKeypad onScoreEntry={onScoreEntry} canThrowMoreDarts={true} />
        </div>
      </div>
    </main>
  );
}
