import "client-only";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ScoreDisplay } from "@/components/score-display";
import { ScoreKeypad } from "@/components/score-keypad";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { findCheckout } from "@/lib/core/checkout";
import type { ScoreModifier } from "@/lib/schemas";
import { useGameStore } from "@/lib/store-provider";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";

export function GamePlay() {
  const {
    players,
    activePlayerId,
    gameSettings,
    finishRound,
    startNextRound,
    currentRound,
    handleDartThrow,
    handleUndoThrow,
    resetGame,
    roundWinner,
  } = useGameStore((state) => state);

  const [showRoundWonModal, setShowRoundWonModal] = useState(false);
  const [show180, setShow180] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [checkoutSuggestion, setCheckoutSuggestion] = useState<string | null>(
    null,
  );
  const [currentScore, setCurrentScore] = useState(0);
  const [dartsInRound, setDartsInRound] = useState(0);
  const [lastThrowBust, setLastThrowBust] = useState(false);

  const activePlayer = players.find((p) => p.id === activePlayerId)!;

  useEffect(() => {
    if (gameSettings.checkoutAssist && activePlayer) {
      const remainingDarts = 3 - dartsInRound;
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
    activePlayer.score,
    dartsInRound,
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

  const handleScoreEntry = (
    scoreAfterModifier: number,
    modifier: ScoreModifier,
  ) => {
    const result = handleDartThrow(scoreAfterModifier, modifier);

    // Update local component state
    setDartsInRound((prev) => prev + 1);
    setCurrentScore((prev) => prev + result.validatedScore);
    setLastThrowBust(result.isBust);

    if (result.isRoundWin) {
      setShowRoundWonModal(true);
      void confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      return;
    }

    if (result.currentRoundTotal === 180) {
      setShow180(true);
      void confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const endTurn = () => {
    finishRound();
    setDartsInRound(0);
    setCurrentScore(0);
    setLastThrowBust(false);
    setShow180(false);
  };

  const handleRoundComplete = () => {
    setShowRoundWonModal(false);
    startNextRound();
    setDartsInRound(0);
    setCurrentScore(0);
    setShow180(false);
  };

  const handleUndo = () => {
    const result = handleUndoThrow();

    if (result.success) {
      setLastThrowBust(false);
      setDartsInRound((prev) => prev - 1);
      setCurrentScore(result.newRoundTotal);
      setShow180(false);
    }
  };

  return (
    <div className="flex h-full flex-col lg:mx-auto lg:w-xl">
      {/* 180 Celebration */}
      {show180 && (
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
        currentRound={currentRound}
        dartsInRound={dartsInRound}
        currentRoundScore={currentScore}
        checkoutSuggestion={checkoutSuggestion}
        bust={lastThrowBust}
      />

      <ScoreKeypad
        onScoreEntry={handleScoreEntry}
        onUndo={handleUndo}
        onFinishRound={endTurn}
        dartsInRound={dartsInRound}
        canThrowMoreDarts={dartsInRound < 3 && !lastThrowBust}
      />
      <Button
        variant={"destructive"}
        className="mt-6"
        onClick={() => setShowConfirmDialog(true)}
      >
        Reset Game
      </Button>

      {/* Round Won Modal */}
      <Dialog open={showRoundWonModal} onOpenChange={setShowRoundWonModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Round Won!
            </DialogTitle>
            <DialogDescription className="text-center">
              {players.find((p) => p.id === roundWinner)?.name} has won the
              round!
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center space-y-2">
              <h3 className="text-lg font-medium">Current Score</h3>
              <div className="text-3xl font-bold">
                {players.map((player) => (
                  <div key={player.id} className="flex justify-between gap-8">
                    <span>{player.name}:</span>
                    <span>{player.roundsWon} rounds</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button onClick={handleRoundComplete}>Next Round</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => {
          resetGame();
        }}
        title="Reset Game"
        description="Are you sure you want to reset the game? All progress will be lost."
      />
    </div>
  );
}
