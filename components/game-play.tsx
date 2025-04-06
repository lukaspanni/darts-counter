"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGameStore } from "@/lib/store";
import { ScoreDisplay } from "@/components/score-display";
import { ScoreKeypad } from "@/components/score-keypad";
import { findCheckout } from "@/lib/checkout";
import confetti from "canvas-confetti";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function GamePlay() {
  const {
    players,
    activePlayerId,
    gameSettings,
    finishRound,
    updatePlayerScore,
    handleRoundWin,
    currentRound,
    startNextRound,
    currentRoundScores,
    updateCurrentRoundScores,
    addDartThrown,
    resetGame,
    roundWinner,
    setRoundWinner,
  } = useGameStore();

  const [showRoundWonModal, setShowRoundWonModal] = useState(false);
  const [show180, setShow180] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [checkoutSuggestion, setCheckoutSuggestion] = useState<string | null>(
    null,
  );
  const [currentScore, setCurrentScore] = useState(0);
  const [modifier, setModifier] = useState<"single" | "double" | "triple">(
    "single",
  );
  const [dartsInRound, setDartsInRound] = useState(0);

  const activePlayer = players.find((p) => p.id === activePlayerId)!;

  // Show round won modal when a round winner is set
  useEffect(() => {
    if (roundWinner !== null) {
      setShowRoundWonModal(true);
      void confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [roundWinner]);

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
    activePlayer?.score,
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

  const canFinish = (score: number): boolean => {
    if (gameSettings.outMode === "single") {
      return score <= 20 || score === 25 || score === 50;
    } else {
      return (score <= 40 && score % 2 === 0) || score === 50;
    }
  };

  const handleScoreEntry = (value: number) => {
    if (dartsInRound >= 3) return;

    let scoreToAdd = value;
    if (modifier === "double") scoreToAdd = value * 2;
    if (modifier === "triple") scoreToAdd = value * 3;

    const newScore = activePlayer.score - scoreToAdd;

    if (newScore < 0 || (gameSettings.outMode === "double" && newScore === 1)) {
      endTurn();
      return;
    }

    if (newScore === 0) {
      const isValidOut =
        gameSettings.outMode === "single" ||
        (gameSettings.outMode === "double" && modifier === "double") ||
        (gameSettings.outMode === "double" &&
          value === 25 &&
          modifier === "double"); // Bull

      if (isValidOut) {
        updatePlayerScore(activePlayerId, newScore);
        addDartThrown(activePlayerId);
        setDartsInRound((prev) => prev + 1);

        const roundScoresCopy = [...currentRoundScores, scoreToAdd];
        updateCurrentRoundScores(roundScoresCopy);
        setCurrentScore((prev) => prev + scoreToAdd);

        handleRoundWin(activePlayerId);
        return;
      } else {
        // Invalid checkout - bust
        endTurn();
        return;
      }
    }

    updatePlayerScore(activePlayerId, newScore);
    addDartThrown(activePlayerId);
    setDartsInRound((prev) => prev + 1);
    setCurrentScore((prev) => prev + scoreToAdd);

    const roundScoresCopy = [...currentRoundScores, scoreToAdd];
    updateCurrentRoundScores(roundScoresCopy);

    if (dartsInRound === 2 && currentScore + scoreToAdd === 180) {
      setShow180(true);
      void confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    setModifier("single");
  };

  const endTurn = () => {
    finishRound();
    setDartsInRound(0);
    setCurrentScore(0);
    setModifier("single");
  };

  const handleRoundComplete = () => {
    setShowRoundWonModal(false);
    startNextRound();
    setDartsInRound(0);
    setCurrentScore(0);
    setModifier("single");
    setRoundWinner(null);
  };

  const handleUndo = () => {
    if (dartsInRound === 0 || currentRoundScores.length === 0) return;

    const lastScore = currentRoundScores[currentRoundScores.length - 1];
    updatePlayerScore(activePlayerId, activePlayer.score + lastScore);
    addDartThrown(activePlayerId, -1);
    setDartsInRound((prev) => prev - 1);
    setCurrentScore((prev) => prev - lastScore);
    const roundScoresCopy = [...currentRoundScores];
    roundScoresCopy.pop();
    updateCurrentRoundScores(roundScoresCopy);
    if (show180 && currentScore - lastScore !== 180) {
      setShow180(false);
    }
  };

  return (
    <div className="flex h-full flex-col lg:w-xl">
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
        canFinish={canFinish}
        currentRoundScore={currentScore}
        checkoutSuggestion={checkoutSuggestion}
      />

      <ScoreKeypad
        onScoreEntry={handleScoreEntry}
        onModifierChange={setModifier}
        currentModifier={modifier}
        onUndo={handleUndo}
        onFinishRound={endTurn}
        dartsInRound={dartsInRound}
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
