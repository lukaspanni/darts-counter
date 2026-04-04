"use client";

import { Dartboard } from "@/components/dartboard";
import { ScoreKeypad } from "@/components/score-keypad";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePracticeStore } from "@/lib/practice-store-provider";
import { findCheckout } from "@/lib/core/checkout";
import type { ScoreModifier } from "@/lib/schemas";
import { cn } from "@/lib/utils";

function DartPip({ filled }: { filled: boolean }) {
  return (
    <div
      className={cn(
        "h-3 w-3 rounded-full border-2",
        filled ? "border-primary bg-primary" : "border-muted-foreground",
      )}
    />
  );
}

export function CheckoutPracticePlay() {
  const modeState = usePracticeStore((s) => s.modeState);
  const handleDartThrow = usePracticeStore((s) => s.handleDartThrow);
  const endSession = usePracticeStore((s) => s.endSession);
  const resetPractice = usePracticeStore((s) => s.resetPractice);
  const phase = usePracticeStore((s) => s.phase);

  if (modeState?.mode !== "checkoutPractice") return null;

  const {
    currentTarget,
    currentScore,
    currentVisitDarts,
    attemptsCompleted,
    attemptsSucceeded,
    lastAttemptResult,
    outMode,
  } = modeState;

  const canThrowMoreDarts = currentVisitDarts < 3;
  const remainingDarts = 3 - currentVisitDarts;
  const checkoutSuggestion = findCheckout(
    currentScore,
    remainingDarts,
    outMode === "double",
  );
  const successRate =
    attemptsCompleted > 0
      ? ((attemptsSucceeded / attemptsCompleted) * 100).toFixed(0)
      : "—";

  const onScoreEntry = (score: number, modifier: ScoreModifier) => {
    handleDartThrow(score, modifier);
  };

  if (phase === "sessionComplete") {
    return (
      <main className="flex grow flex-col items-center px-4 pt-6 pb-8">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              Session Complete
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Checkout Practice results
            </p>
          </div>

          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold">{attemptsCompleted}</p>
                  <p className="text-muted-foreground mt-1 text-xs">Attempts</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{attemptsSucceeded}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Successes
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    {successRate !== "—" ? `${successRate}%` : "—"}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Success Rate
                  </p>
                </div>
              </div>
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
          <h2 className="text-xl font-bold tracking-tight">
            Checkout Practice
          </h2>
          <Button variant="outline" size="sm" onClick={() => endSession()}>
            End Session
          </Button>
        </div>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 text-center">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Target
                </p>
                <p className="text-primary text-5xl font-bold">
                  {currentTarget}
                </p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Remaining
                </p>
                <p className="text-5xl font-bold">{currentScore}</p>
              </div>
              <div className="flex flex-1 flex-col items-center gap-2">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Darts
                </p>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <DartPip key={i} filled={i < currentVisitDarts} />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  {attemptsSucceeded}/{attemptsCompleted}
                </span>
                <span className="text-xs font-medium">
                  {successRate !== "—" ? `${successRate}%` : "—"}
                </span>
                <span className="text-muted-foreground text-xs">success</span>
              </div>

              {lastAttemptResult && (
                <Badge
                  variant={
                    lastAttemptResult === "success" ? "default" : "secondary"
                  }
                  className={
                    lastAttemptResult === "success"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                  }
                >
                  {lastAttemptResult === "success" ? "Hit!" : "Miss"}
                </Badge>
              )}
            </div>

            {checkoutSuggestion && (
              <div className="bg-muted/50 mt-3 rounded-md px-3 py-2">
                <p className="text-muted-foreground text-xs">Suggestion</p>
                <p className="text-sm font-medium">{checkoutSuggestion}</p>
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
