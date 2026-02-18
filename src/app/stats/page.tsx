"use client";

import { useEffect, useState } from "react";
import { StatsTable } from "@/components/stats-table";
import { PlayerAverages } from "@/components/player-averages";
import { AverageChart } from "@/components/average-chart";
import { useGameHistory } from "@/lib/hooks/use-game-history";
import posthog from "posthog-js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GameType } from "@/lib/schemas";

export default function StatsPage() {
  const { gameHistory } = useGameHistory();
  const [selectedPlayer, setSelectedPlayer] = useState<string | undefined>(
    undefined,
  );
  const gameModes = Array.from(
    new Set(gameHistory.map((game) => game.gameMode)),
  );
  const [selectedGameMode, setSelectedGameMode] = useState<string>("all");

  useEffect(() => {
    posthog.capture("stats_page_viewed", {
      history_event: "stats_page_viewed",
      total_games: gameHistory.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally only fire on page load
  }, []);

  const handlePlayerSelect = (playerName: string) => {
    setSelectedPlayer(selectedPlayer === playerName ? undefined : playerName);
  };

  const filteredGameHistory =
    selectedGameMode === "all"
      ? gameHistory
      : gameHistory.filter((game) => game.gameMode === selectedGameMode);

  const gameModeItems = Object.fromEntries(
    [
      { value: "all", label: "All game modes" },
      ...gameModes.map((gameMode) => ({
        value: gameMode,
        label: gameMode,
      })),
    ].map((option) => [option.value, option.label]),
  );

  return (
    <main className="flex grow flex-col items-center p-4">
      <h2 className="mb-8 text-3xl font-bold">Statistics</h2>

      <div className="w-full max-w-6xl space-y-8">
        <div className="flex items-center justify-end">
          <Select
            value={selectedGameMode}
            onValueChange={(value) => setSelectedGameMode(value ?? "all")}
            items={gameModeItems}
          >
            <SelectTrigger className="w-62.5">
              <SelectValue placeholder="Filter by game mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All game modes</SelectItem>
              {gameModes.map((gameMode) => (
                <SelectItem key={gameMode} value={gameMode}>
                  {gameMode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Player Averages Section */}
        <PlayerAverages
          gameHistory={filteredGameHistory}
          onPlayerSelect={handlePlayerSelect}
        />

        {/* Average Chart Section */}
        <AverageChart
          gameHistory={filteredGameHistory}
          selectedPlayer={selectedPlayer}
        />

        {/* Game History Section */}
        <div className="w-full">
          <h3 className="mb-4 text-xl font-semibold">Game History</h3>
          <StatsTable gameHistory={filteredGameHistory} />
        </div>
      </div>
    </main>
  );
}
