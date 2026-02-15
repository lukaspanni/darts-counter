"use client";

import { useEffect, useState } from "react";
import { StatsTable } from "@/components/stats-table";
import { PlayerAverages } from "@/components/player-averages";
import { AverageChart } from "@/components/average-chart";
import { DetailedStatsCard } from "@/components/detailed-stats-card";
import { useGameHistory } from "@/lib/hooks/use-game-history";
import { calculatePlayerStats } from "@/lib/player-stats";
import posthog from "posthog-js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function StatsPage() {
  const { gameHistory } = useGameHistory();
  const [selectedPlayer, setSelectedPlayer] = useState<string | undefined>(
    undefined,
  );
  const [gameModeFilter, setGameModeFilter] = useState<string>("all");

  useEffect(() => {
    posthog.capture("stats_page_viewed", {
      total_games: gameHistory.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally only fire on page load
  }, []);

  const handlePlayerSelect = (playerName: string) => {
    setSelectedPlayer(selectedPlayer === playerName ? undefined : playerName);
  };

  // Get unique game modes
  const gameModes = Array.from(
    new Set(gameHistory.map((game) => game.gameMode)),
  ).sort();

  // Filter game history by game mode
  const filteredGameHistory =
    gameModeFilter === "all"
      ? gameHistory
      : gameHistory.filter((game) => game.gameMode === gameModeFilter);

  // Calculate stats from filtered data
  const playerStats = calculatePlayerStats(filteredGameHistory);

  return (
    <main className="flex flex-grow flex-col items-center p-4">
      <h2 className="mb-8 text-3xl font-bold">Statistics</h2>

      <div className="w-full max-w-6xl space-y-8">
        {/* Filter Section */}
        {gameModes.length > 1 && (
          <div className="flex items-center gap-4">
            <label htmlFor="game-mode-filter" className="font-medium">
              Game Mode:
            </label>
            <Select value={gameModeFilter} onValueChange={setGameModeFilter}>
              <SelectTrigger id="game-mode-filter" className="w-[240px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Game Modes</SelectItem>
                {gameModes.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Player Averages Section */}
        <PlayerAverages
          gameHistory={filteredGameHistory}
          onPlayerSelect={handlePlayerSelect}
        />

        {/* Detailed Statistics Section */}
        <DetailedStatsCard stats={playerStats} />

        {/* Average Chart Section */}
        <AverageChart
          gameHistory={filteredGameHistory}
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
