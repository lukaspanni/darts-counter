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
import { GameOver } from "@/components/game-over";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { gameHistorySchema, type GameHistory } from "@/lib/schemas";
import { findCheckout } from "@/lib/checkout";
import confetti from "canvas-confetti";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Header } from "@/components/header";

export function GamePlay() {
  const {
    players,
    activePlayerId,
    gameSettings,
    switchPlayer,
    updatePlayerScore,
    incrementRoundsWon,
    currentRound,
    incrementRound,
    resetCurrentRoundScores,
    currentRoundScores,
    updateCurrentRoundScores,
    addDartThrown,
    resetGame,
  } = useGameStore();

  const [showRoundWonModal, setShowRoundWonModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [roundWinner, setRoundWinner] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameWinner, setGameWinner] = useState<number | null>(null);

  const [show180, setShow180] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [checkoutSuggestion, setCheckoutSuggestion] = useState<string | null>(
    null,
  );

  const [gameHistory, setGameHistory] = useLocalStorage<GameHistory[]>(
    "dartsGameHistory",
    [],
    gameHistorySchema,
  );

  const activePlayer = players.find((p) => p.id === activePlayerId)!;

  const [currentScore, setCurrentScore] = useState(0);
  const [modifier, setModifier] = useState<"single" | "double" | "triple">(
    "single",
  );
  const [dartsInRound, setDartsInRound] = useState(0);

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
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const message =
        "Are you sure you want to leave? Your game progress will be lost.";
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
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
      finishRound();
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

        handleRoundWin();
        return;
      } else {
        // Invalid checkout - bust
        finishRound();
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

  const handleRoundWin = () => {
    incrementRoundsWon(activePlayerId);
    setRoundWinner(activePlayerId);
    setShowRoundWonModal(true);

    const updatedPlayer = players.find((p) => p.id === activePlayerId)!;
    if (updatedPlayer.roundsWon + 1 >= gameSettings.roundsToWin) {
      setGameWinner(activePlayerId);
      setGameOver(true);
    }
  };

  const finishRound = () => {
    if (players.length > 1) {
      switchPlayer();
    }
    setDartsInRound(0);
    setCurrentScore(0);
    setModifier("single");
    resetCurrentRoundScores();
  };

  const startNextRound = () => {
    setShowRoundWonModal(false);
    players.forEach((player) => {
      updatePlayerScore(player.id, gameSettings.startingScore);
    });

    incrementRound();
    finishRound();

    if (gameOver) {
      const newGameHistory: GameHistory = {
        id: Date.now(),
        date: new Date().toISOString(),
        players: players.map((p) => ({
          name: p.name,
          roundsWon: p.roundsWon,
          averageScore:
            p.dartsThrown > 0
              ? Number((p.totalScore / p.dartsThrown).toFixed(2))
              : 0,
        })),
        winner: players.find((p) => p.id === gameWinner)?.name || "",
        gameMode: `${gameSettings.startingScore} ${gameSettings.outMode} out`,
        roundsPlayed: currentRound,
      };

      setGameHistory([...gameHistory, newGameHistory]);
      setShowGameOverModal(true);
    }
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

  if (showGameOverModal) {
    return (
      <GameOver
        winner={players.find((p) => p.id === gameWinner)!}
        gameHistory={gameHistory}
        onNewGame={resetGame}
      />
    );
  }

  return (
    <div className="relative flex h-full flex-col">
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
        onFinishRound={finishRound}
        dartsInRound={dartsInRound}
      />
      <Button onClick={() => setShowConfirmDialog(true)}>Reset Game</Button>

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
            <Button onClick={startNextRound}>
              {gameOver ? "End Game" : "Next Round"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => {
          resetGame();
          setShowConfirmDialog(false);
          setGameOver(false);
          setGameWinner(null);
          setShowGameOverModal(false);
        }}
        title="Reset Game"
        description="Are you sure you want to reset the game? All progress will be lost."
      />
    </div>
  );
}
