import "client-only";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Dartboard } from "@/components/dartboard";
import { ScoreDisplay } from "@/components/score-display";
import { ScoreKeypad } from "@/components/score-keypad";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { findCheckout } from "@/lib/core/checkout";
import { subscribeToGameEvents } from "@/lib/game-events";
import { useUiSettings } from "@/lib/hooks/use-ui-settings";
import { usePendingGame } from "@/lib/hooks/use-pending-game";
import type { ScoreModifier } from "@/lib/schemas";
import { useGameStore } from "@/lib/store-provider";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";

const MAX_DARTS_PER_VISIT = 3;

export function GamePlay() {
  const players = useGameStore((state) => state.players);
  const activePlayerId = useGameStore((state) => state.activePlayerId);
  const gameSettings = useGameStore((state) => state.gameSettings);
  const finishVisit = useGameStore((state) => state.finishVisit);
  const startNextLeg = useGameStore((state) => state.startNextLeg);
  const currentLeg = useGameStore((state) => state.currentLeg);
  const handleDartThrow = useGameStore((state) => state.handleDartThrow);
  const handleUndoThrow = useGameStore((state) => state.handleUndoThrow);
  const resetGame = useGameStore((state) => state.resetGame);
  const legWinner = useGameStore((state) => state.legWinner);
  const matchWinner = useGameStore((state) => state.matchWinner);
  const dartsInVisit = useGameStore((state) => state.getDartsInVisit());
  const currentScore = useGameStore((state) => state.getCurrentVisitScore());
  const lastThrowBust = useGameStore((state) => state.getIsBust());

  const { clearPendingGame } = usePendingGame();

  const [showLegWonModal, setShowLegWonModal] = useState(false);
  const [show180, setShow180] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [checkoutSuggestion, setCheckoutSuggestion] = useState<string | null>(
    null,
  );
  const { isLargeScreen, settings } = useUiSettings();

  const activePlayer = players.find((p) => p.id === activePlayerId);
  const canThrowMoreDarts =
    dartsInVisit < MAX_DARTS_PER_VISIT && !lastThrowBust;
  const showEnhancedView = settings.enhancedView;

  useEffect(() => {
    const unsubscribe = subscribeToGameEvents((event) => {
      if (event.type === "visitCompleted") {
        setShow180(false);
        return;
      }

      if (event.type === "visitMaxScored") {
        setShow180(true);
        if (!settings.noBullshitMode) {
          void confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
        return;
      }

      if (event.type === "legWon") {
        setShowLegWonModal(true);
        if (!settings.noBullshitMode) {
          void confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      }
    });

    return unsubscribe;
  }, [settings.noBullshitMode]);

  useEffect(() => {
    if (gameSettings.checkoutAssist && activePlayer) {
      const remainingDarts = 3 - dartsInVisit;
      const checkout = findCheckout(
        activePlayer.score,
        remainingDarts,
        gameSettings.outMode === "double",
      );
      setCheckoutSuggestion(checkout);
    } else {
      setCheckoutSuggestion(null);
    }
  }, [
    activePlayer,
    activePlayer?.score,
    dartsInVisit,
    gameSettings.checkoutAssist,
    gameSettings.outMode,
  ]);

  useEffect(() => {
    const abortController = new AbortController();
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload, {
      signal: abortController.signal,
    });

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    if (show180) {
      const timer = setTimeout(() => {
        setShow180(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show180]);

  // Safety check: if no active player, render fallback
  if (!activePlayer) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full lg:mx-auto lg:w-xl">
          <CardHeader>
            <CardTitle className="text-center">Game Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">
              Unable to find active player. Please restart the game.
            </p>
            <Button
              variant="default"
              className="mt-4 w-full"
              onClick={resetGame}
            >
              Restart Game
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleScoreEntry = (
    scoreAfterModifier: number,
    modifier: ScoreModifier,
  ) => {
    handleDartThrow(scoreAfterModifier, modifier);
  };

  const endTurn = () => {
    finishVisit();
  };

  const handleLegComplete = () => {
    setShowLegWonModal(false);
    startNextLeg();
    setShow180(false);
  };

  const handleUndo = () => {
    const result = handleUndoThrow();

    if (result.success) {
      setShow180(false);
    }
  };

  const dartboardProps = {
    onScoreEntry: handleScoreEntry,
    disabled: !canThrowMoreDarts,
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col",
        showEnhancedView ? "lg:mx-auto lg:max-w-6xl" : "lg:mx-auto lg:w-xl",
      )}
    >
      {/* 180 Celebration */}
      {show180 && !settings.noBullshitMode && (
        <>
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="animate-bounce rounded-lg bg-black/70 px-8 py-4 text-4xl font-bold text-white">
              ONE HUNDRED AND EIGHTY!
            </div>
          </div>
        </>
      )}

      <ScoreDisplay
        players={players}
        activePlayerId={activePlayerId}
        currentLeg={currentLeg}
        dartsInVisit={dartsInVisit}
        currentVisitScore={currentScore}
        checkoutSuggestion={checkoutSuggestion}
        bust={lastThrowBust}
      />

      {showEnhancedView ? (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex flex-col gap-4 lg:w-1/2">
            <ScoreKeypad
              onScoreEntry={handleScoreEntry}
              onUndo={handleUndo}
              onFinishVisit={endTurn}
              dartsInVisit={dartsInVisit}
              canThrowMoreDarts={canThrowMoreDarts}
              canUndo={legWinner === null && matchWinner === null}
            />
            {!isLargeScreen && <Dartboard {...dartboardProps} />}
            <Button
              variant={"destructive"}
              onClick={() => setShowConfirmDialog(true)}
            >
              Reset Match
            </Button>
          </div>
          {isLargeScreen && (
            <div className="w-1/2">
              <Dartboard {...dartboardProps} />
            </div>
          )}
        </div>
      ) : (
        <>
          <ScoreKeypad
            onScoreEntry={handleScoreEntry}
            onUndo={handleUndo}
            onFinishVisit={endTurn}
            dartsInVisit={dartsInVisit}
            canThrowMoreDarts={canThrowMoreDarts}
            canUndo={legWinner === null && matchWinner === null}
          />
          <Button
            variant={"destructive"}
            className="mt-6"
            onClick={() => setShowConfirmDialog(true)}
          >
            Reset Game
          </Button>
        </>
      )}

      {/* Leg Won Modal */}
      <Dialog open={showLegWonModal} onOpenChange={setShowLegWonModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Leg Won!</DialogTitle>
            <DialogDescription className="text-center">
              {players.find((p) => p.id === legWinner)?.name} has won the leg!
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center space-y-2">
              <h3 className="text-lg font-medium">Current Score</h3>
              <div className="text-3xl font-bold">
                {players.map((player) => (
                  <div key={player.id} className="flex justify-between gap-8">
                    <span>{player.name}:</span>
                    <span>{player.legsWon} legs</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button onClick={handleLegComplete}>Next Leg</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => {
          clearPendingGame();
          resetGame();
        }}
        title="Reset Match"
        description="Are you sure you want to reset the match? All progress will be lost."
      />
    </div>
  );
}
