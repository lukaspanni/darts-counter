import "client-only";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Dartboard } from "@/components/dartboard";
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
import { useUiSettings } from "@/lib/hooks/use-ui-settings";
import { useLiveStream } from "@/lib/hooks/use-live-stream";
import { usePendingGame } from "@/lib/hooks/use-pending-game";
import type { ScoreModifier } from "@/lib/schemas";
import { useGameStore } from "@/lib/store-provider";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import posthog from "posthog-js";
import { useEffect, useState } from "react";

const MAX_DARTS_PER_VISIT = 3;

export function GamePlay() {
  const {
    players,
    activePlayerId,
    gameSettings,
    gamePhase,
    finishVisit,
    startNextLeg,
    currentLeg,
    handleDartThrow,
    handleUndoThrow,
    resetGame,
    legWinner,
    matchWinner,
  } = useGameStore((state) => state);

  const { state: liveStreamState, sendEvent } = useLiveStream();
  const { clearPendingGame } = usePendingGame();

  const [showLegWonModal, setShowLegWonModal] = useState(false);
  const [show180, setShow180] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [checkoutSuggestion, setCheckoutSuggestion] = useState<string | null>(
    null,
  );
  const [currentScore, setCurrentScore] = useState(0);
  const [dartsInVisit, setDartsInVisit] = useState(0);
  const [lastThrowBust, setLastThrowBust] = useState(false);
  const { isLargeScreen, settings } = useUiSettings();

  const activePlayer = players.find((p) => p.id === activePlayerId)!;
  const canThrowMoreDarts =
    dartsInVisit < MAX_DARTS_PER_VISIT && !lastThrowBust;
  const showEnhancedView = settings.enhancedView;

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
    activePlayer.score,
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

  // Send initial game state when live stream becomes active
  useEffect(() => {
    if (
      liveStreamState.isActive &&
      liveStreamState.status === "connected" &&
      players.length > 0
    ) {
      // Send game update with current state
      sendEvent({
        type: "gameUpdate",
        metadata: {
          gameId: liveStreamState.connection?.gameId || "",
          startingScore: gameSettings.startingScore,
          outMode: gameSettings.outMode,
          gameMode: gameSettings.gameMode,
          legsToWin: gameSettings.legsToWin,
          players: players.map((p) => ({
            id: p.id,
            name: p.name,
            score: p.score,
            legsWon: p.legsWon,
            dartsThrown: p.dartsThrown,
            totalScore: p.totalScore,
          })),
          currentLeg,
          activePlayerId,
          gamePhase,
          legWinner,
          matchWinner,
        },
      });
    }
  }, [
    liveStreamState.isActive,
    liveStreamState.status,
    liveStreamState.connection,
    players,
    gameSettings,
    currentLeg,
    activePlayerId,
    legWinner,
    matchWinner,
    gamePhase,
    sendEvent,
  ]);

  const handleScoreEntry = (
    scoreAfterModifier: number,
    modifier: ScoreModifier,
  ) => {
    const result = handleDartThrow(scoreAfterModifier, modifier);
    const isLiveStreamConnected =
      liveStreamState.isActive && liveStreamState.status === "connected";

    posthog.capture("dart_thrown", {
      history_event: "dart_thrown",
      leg_number: currentLeg,
      player_name: activePlayer.name,
      score: scoreAfterModifier,
      validated_score: result.validatedScore,
      modifier,
      is_bust: result.isBust,
    });

    // Update local component state
    setDartsInVisit((prev) => prev + 1);
    setCurrentScore((prev) => prev + result.validatedScore);
    setLastThrowBust(result.isBust);

    if (result.isLegWin) {
      if (result.isMatchWin && result.matchWinner !== null) {
        if (isLiveStreamConnected) {
          sendEvent({
            type: "matchFinish",
            winnerId: result.matchWinner,
          });
        }

        posthog.capture("match_won", {
          history_event: "match_won",
          leg_number: currentLeg,
          player_count: players.length,
          player_name: activePlayer.name,
        });
      } else {
        posthog.capture("leg_won", {
          history_event: "leg_won",
          leg_number: currentLeg,
          player_count: players.length,
        });
      }

      setShowLegWonModal(true);
      if (!settings.noBullshitMode) {
        void confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      return;
    }

    if (result.currentVisitTotal === 180) {
      posthog.capture("180_scored", {
        history_event: "180_scored",
        leg_number: currentLeg,
      });
      setShow180(true);
      if (!settings.noBullshitMode) {
        void confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  };

  const endTurn = () => {
    posthog.capture("visit_completed", {
      history_event: "visit_completed",
      leg_number: currentLeg,
      player_name: activePlayer.name,
      visit_score: currentScore,
      darts_in_visit: dartsInVisit,
    });
    finishVisit();
    setDartsInVisit(0);
    setCurrentScore(0);
    setLastThrowBust(false);
    setShow180(false);
  };

  const handleLegComplete = () => {
    setShowLegWonModal(false);
    startNextLeg();
    setDartsInVisit(0);
    setCurrentScore(0);
    setShow180(false);
  };

  const handleUndo = () => {
    const result = handleUndoThrow();

    if (result.success) {
      setLastThrowBust(false);
      setDartsInVisit((prev) => prev - 1);
      setCurrentScore(result.newVisitTotal);
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
          posthog.capture("match_reset", {
            history_event: "match_reset",
            leg_number: currentLeg,
            player_count: players.length,
          });
          clearPendingGame();
          resetGame();
        }}
        title="Reset Match"
        description="Are you sure you want to reset the match? All progress will be lost."
      />
    </div>
  );
}
