"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { subscribeToGameEvents } from "@/lib/game-events";
import { useLiveStream } from "@/lib/hooks/use-live-stream";
import { useGameStore } from "@/lib/store-provider";
import type { ScoreModifier } from "@/lib/schemas";

const MODIFIER_MULTIPLIER: Record<ScoreModifier, number> = {
  single: 1,
  double: 2,
  triple: 3,
};

export function useGameEventEffects() {
  const { state: liveStreamState, sendEvent } = useLiveStream();
  const players = useGameStore((state) => state.players);
  const gameSettings = useGameStore((state) => state.gameSettings);
  const currentLeg = useGameStore((state) => state.currentLeg);
  const activePlayerId = useGameStore((state) => state.activePlayerId);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const legWinner = useGameStore((state) => state.legWinner);
  const matchWinner = useGameStore((state) => state.matchWinner);

  useEffect(() => {
    if (
      liveStreamState.isActive &&
      liveStreamState.status === "connected" &&
      players.length > 0
    ) {
      sendEvent({
        type: "gameUpdate",
        metadata: {
          gameId: liveStreamState.connection?.gameId || "",
          settings: gameSettings,
          players: players.map((player) => ({
            id: player.id,
            name: player.name,
            score: player.score,
            legsWon: player.legsWon,
            dartsThrown: player.dartsThrown,
            totalScore: player.totalScore,
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
    gamePhase,
    legWinner,
    matchWinner,
    sendEvent,
  ]);

  useEffect(() => {
    const unsubscribe = subscribeToGameEvents((event) => {
      const isLiveStreamConnected =
        liveStreamState.isActive && liveStreamState.status === "connected";

      if (event.type === "dartThrown") {
        if (isLiveStreamConnected) {
          sendEvent({
            type: "score",
            playerId: event.playerId,
            score: event.score,
            modifier: event.modifier,
            segment: event.score / MODIFIER_MULTIPLIER[event.modifier],
            newScore: event.newScore,
            validatedScore: event.validatedScore,
            isLegWin: event.isLegWin,
            isBust: event.isBust,
            currentVisitTotal: event.currentVisitTotal,
          });
        }
        posthog.capture("dart_thrown", {
          history_event: "dart_thrown",
          leg_number: event.legNumber,
          player_name: event.playerName,
          score: event.score,
          validated_score: event.validatedScore,
          modifier: event.modifier,
          is_bust: event.isBust,
        });
        return;
      }

      if (event.type === "dartUndone") {
        if (isLiveStreamConnected) {
          sendEvent({
            type: "undo",
            playerId: event.playerId,
            lastScore: event.lastScore,
            newVisitTotal: event.newVisitTotal,
          });
        }
        return;
      }

      if (event.type === "visitCompleted") {
        posthog.capture("visit_completed", {
          history_event: "visit_completed",
          leg_number: event.legNumber,
          player_name: event.playerName,
          visit_score: event.visitScore,
          darts_in_visit: event.dartsInVisit,
          is_bust: event.isBust,
        });
        return;
      }

      if (event.type === "visitMaxScored") {
        posthog.capture("180_scored", {
          history_event: "180_scored",
          leg_number: event.legNumber,
        });
        return;
      }

      if (event.type === "legWon") {
        if (isLiveStreamConnected) {
          sendEvent({
            type: "roundFinish",
            legNumber: event.legNumber,
            winnerId: event.winnerId,
          });
        }
        if (!event.isMatchWin) {
          posthog.capture("leg_won", {
            history_event: "leg_won",
            leg_number: event.legNumber,
            player_count: event.playerCount,
          });
        }
        return;
      }

      if (event.type === "matchWon") {
        if (isLiveStreamConnected) {
          sendEvent({
            type: "matchFinish",
            winnerId: event.winnerId,
          });
        }

        posthog.capture("match_won", {
          history_event: "match_won",
          leg_number: event.legNumber,
          player_count: event.playerCount,
          player_name: event.winnerName,
        });

        posthog.capture("match_completed", {
          history_event: "match_completed",
          player_count: event.playerCount,
          legs_played: event.legsPlayed,
          starting_score: event.startingScore,
          out_mode: event.outMode,
          winner_average: event.winnerAverage,
        });
        return;
      }

      if (event.type === "matchReset") {
        posthog.capture("match_reset", {
          history_event: "match_reset",
          leg_number: event.legNumber,
          player_count: event.playerCount,
        });
      }
    });

    return unsubscribe;
  }, [liveStreamState.isActive, liveStreamState.status, sendEvent]);
}
