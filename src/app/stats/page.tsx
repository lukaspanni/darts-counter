"use client";

import { useEffect, useState } from "react";
import { StatsTable } from "@/components/stats-table";
import { PlayerAverages } from "@/components/player-averages";
import { AverageChart } from "@/components/average-chart";
import { useGameHistory } from "@/lib/hooks/use-game-history";
import posthog from "posthog-js";

export default function StatsPage() {
  const { gameHistory } = useGameHistory();
  const [selectedPlayer, setSelectedPlayer] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    posthog.capture("stats_page_viewed", {
      total_games: gameHistory.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally only fire on page load
  }, []);

  const handlePlayerSelect = (playerName: string) => {
    setSelectedPlayer(selectedPlayer === playerName ? undefined : playerName);
  };

  return (
    <main className="flex flex-grow flex-col items-center p-4">
      <h2 className="mb-8 text-3xl font-bold">Statistics</h2>

      <div className="w-full max-w-6xl space-y-8">
        {/* Player Averages Section */}
        <PlayerAverages
          gameHistory={gameHistory}
          onPlayerSelect={handlePlayerSelect}
        />

        {/* Average Chart Section */}
        <AverageChart
          gameHistory={gameHistory}
          selectedPlayer={selectedPlayer}
        />

        {/* Game History Section */}
        <div className="w-full">
          <h3 className="mb-4 text-xl font-semibold">Game History</h3>
          <StatsTable />
        </div>
      </div>
    </main>
  );
}
