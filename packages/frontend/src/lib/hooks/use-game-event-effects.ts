"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { subscribeToGameEvents } from "@/lib/game-events";
import { useLiveStream } from "@/lib/hooks/use-live-stream";

export function useGameEventEffects() {
  const { state: liveStreamState, sendEvent } = useLiveStream();

  useEffect(() => {
    const unsubscribe = subscribeToGameEvents((event) => {
      const isLiveStreamConnected =
        liveStreamState.isActive && liveStreamState.status === "connected";

      if (event.type === "dartThrown") {
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
