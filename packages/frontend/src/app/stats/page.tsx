"use client";

import { useEffect, useMemo, useState } from "react";
import { StatsTable } from "@/components/stats-table";
import { PlayerAverages } from "@/components/player-averages";
import { AverageChart } from "@/components/average-chart";
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
import {
  Target,
  Trophy,
  Flame,
  TrendingUp,
  Filter,
} from "lucide-react";
import { generateMockGameHistory } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  accentClass,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-4 transition-all duration-300 hover:border-border hover:shadow-md">

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight lg:text-3xl">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div
          className={`rounded-lg p-2 ${accentClass} transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

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

  const playerStats = useMemo(
    () => calculatePlayerStats(filteredGameHistory),
    [filteredGameHistory],
  );

  const summaryStats = useMemo(() => {
    const stats = playerStats;
    const totalGames = filteredGameHistory.length;
    const bestAvg = stats.reduce(
      (best, p) =>
        p.averagePerVisit > best.value
          ? { value: p.averagePerVisit, name: p.name }
          : best,
      { value: 0, name: "-" },
    );
    const mostWins = stats.reduce(
      (best, p) =>
        p.matchesWon > best.value
          ? { value: p.matchesWon, name: p.name }
          : best,
      { value: 0, name: "-" },
    );
    const total180s = stats.reduce((sum, p) => sum + p.total180s, 0);
    const top180Player = stats.reduce(
      (best, p) =>
        p.total180s > best.value
          ? { value: p.total180s, name: p.name }
          : best,
      { value: 0, name: "-" },
    );

    return { totalGames, bestAvg, mostWins, total180s, top180Player };
  }, [filteredGameHistory, playerStats]);

  const seedMockData = () => {
    const mockData = generateMockGameHistory();
    const serialized = JSON.stringify(mockData);
    window.localStorage.setItem("game-history-v2", serialized);
    window.location.reload();
  };

  if (gameHistory.length === 0) {
    return (
      <main className="flex grow flex-col items-center justify-center p-4">
        <div className="flex max-w-md flex-col items-center space-y-6 text-center">
          <div className="rounded-2xl bg-muted/50 p-6">
            <Target className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              No matches yet
            </h2>
            <p className="text-muted-foreground">
              Play some games to see your statistics here. Your performance data
              will appear automatically after each match.
            </p>
          </div>
          {process.env.NODE_ENV === "development" && (
            <Button variant="outline" onClick={seedMockData}>
              Seed mock data (dev only)
            </Button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex grow flex-col items-center px-4 pb-8 pt-6">
      <div className="w-full max-w-7xl space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">
              Statistics
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {summaryStats.totalGames} game{summaryStats.totalGames !== 1 ? "s" : ""} tracked
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedGameMode}
              onValueChange={(value) => setSelectedGameMode(value ?? "all")}
              items={gameModeItems}
            >
              <SelectTrigger className="w-44">
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
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total Games"
            value={summaryStats.totalGames}
            icon={Target}
            accentClass="bg-primary/10 text-primary"

          />
          <StatCard
            label="Best Average"
            value={summaryStats.bestAvg.value.toFixed(1)}
            subtitle={summaryStats.bestAvg.name}
            icon={TrendingUp}
            accentClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"

          />
          <StatCard
            label="Most Wins"
            value={summaryStats.mostWins.value}
            subtitle={summaryStats.mostWins.name}
            icon={Trophy}
            accentClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"

          />
          <StatCard
            label="Total 180s"
            value={summaryStats.total180s}
            subtitle={
              summaryStats.top180Player.value > 0
                ? `${summaryStats.top180Player.name} (${summaryStats.top180Player.value})`
                : undefined
            }
            icon={Flame}
            accentClass="bg-rose-500/10 text-rose-600 dark:text-rose-400"

          />
        </div>

        {/* Players + Chart - side by side on wide screens */}
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <section>
            <PlayerAverages
              playerStats={playerStats}
              onPlayerSelect={handlePlayerSelect}
              selectedPlayer={selectedPlayer}
            />
          </section>

          <section>
            <AverageChart
              gameHistory={filteredGameHistory}
              selectedPlayer={selectedPlayer}
            />
          </section>
        </div>

        {/* Game History Section */}
        <section>
          <div className="mb-4">
            <h3 className="text-lg font-semibold tracking-tight">
              Match History
            </h3>
            <p className="text-sm text-muted-foreground">
              All recorded matches
            </p>
          </div>
          <StatsTable gameHistory={filteredGameHistory} />
        </section>
      </div>
    </main>
  );
}
