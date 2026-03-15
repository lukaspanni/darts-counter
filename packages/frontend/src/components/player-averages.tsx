"use client";

import { useState } from "react";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Crown,
  ChevronRight,
} from "lucide-react";
import { calculatePlayerStats, type PlayerStats } from "@/lib/player-stats";
import type { GameHistory } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SortField = "name" | "matchesPlayed" | "matchesWon" | "averagePerVisit";

interface PlayerAveragesProps {
  gameHistory: GameHistory[];
  onPlayerSelect?: (playerName: string) => void;
  selectedPlayer?: string;
}

function PlayerStatBadge({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          highlight && "text-primary",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function PlayerCard({
  player,
  rank,
  isSelected,
  onClick,
  showAdvanced,
}: {
  player: PlayerStats;
  rank: number;
  isSelected: boolean;
  onClick: () => void;
  showAdvanced: boolean;
}) {
  const winRate = player.matchWinPercentage;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full cursor-pointer rounded-xl border p-4 text-left transition-all duration-200",
        isSelected
          ? "border-primary/50 bg-primary/5 shadow-sm ring-1 ring-primary/20"
          : "border-border/50 bg-card hover:border-border hover:shadow-sm",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
              rank === 1
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : rank === 2
                  ? "bg-gray-300/20 text-gray-500 dark:text-gray-400"
                  : rank === 3
                    ? "bg-orange-400/15 text-orange-600 dark:text-orange-400"
                    : "bg-muted text-muted-foreground",
            )}
          >
            {rank === 1 ? (
              <Crown className="h-4 w-4" />
            ) : (
              `#${rank}`
            )}
          </div>
          <div>
            <h4 className="font-semibold leading-none">{player.name}</h4>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {player.matchesPlayed} match{player.matchesPlayed !== 1 ? "es" : ""}
            </p>
          </div>
        </div>
        <ChevronRight
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            isSelected && "rotate-90 text-primary",
          )}
        />
      </div>

      {/* Core Stats */}
      <div className="mt-4 grid grid-cols-4 gap-3">
        <PlayerStatBadge
          label="Avg/Visit"
          value={player.averagePerVisit.toFixed(1)}
          highlight
        />
        <PlayerStatBadge
          label="Win %"
          value={`${winRate}%`}
        />
        <PlayerStatBadge label="Wins" value={player.matchesWon} />
        <PlayerStatBadge label="180s" value={player.total180s} />
      </div>

      {/* Advanced Stats */}
      {showAdvanced && (
        <div className="mt-3 grid grid-cols-3 gap-3 border-t border-border/50 pt-3 sm:grid-cols-4 lg:grid-cols-5">
          <PlayerStatBadge
            label="1st 9 Avg"
            value={player.firstNineAverage.toFixed(1)}
          />
          <PlayerStatBadge label="Highest" value={player.highestVisit} />
          <PlayerStatBadge label="100+" value={player.total100PlusVisits} />
          <PlayerStatBadge
            label="Checkout"
            value={`${player.checkoutPercentage}%`}
          />
          <PlayerStatBadge
            label="Avg Finish"
            value={`${player.averageDartsToFinish}d`}
          />
          <PlayerStatBadge
            label="Missed Dbl"
            value={player.missedDoublesPerLeg.toFixed(1)}
          />
          <PlayerStatBadge
            label="Leg Win"
            value={`${player.legWinPercentage}%`}
          />
          <PlayerStatBadge
            label="Legs"
            value={`${player.legsWon}/${player.legsPlayed}`}
          />
        </div>
      )}
    </button>
  );
}

export function PlayerAverages({
  gameHistory,
  onPlayerSelect,
  selectedPlayer,
}: PlayerAveragesProps) {
  const [sortField, setSortField] = useState<SortField>("matchesWon");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);

  const playerStats = calculatePlayerStats(gameHistory);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field)
      return <ArrowUpDown className="inline h-3.5 w-3.5 opacity-40" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="inline h-3.5 w-3.5" />
    ) : (
      <ChevronDown className="inline h-3.5 w-3.5" />
    );
  };

  const sortedStats = [...playerStats].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;
    switch (sortField) {
      case "name":
        return a.name.localeCompare(b.name) * multiplier;
      case "matchesPlayed":
        return (a.matchesPlayed - b.matchesPlayed) * multiplier;
      case "matchesWon":
        return (a.matchesWon - b.matchesWon) * multiplier;
      case "averagePerVisit":
        return (a.averagePerVisit - b.averagePerVisit) * multiplier;
      default:
        return 0;
    }
  });

  const handlePlayerClick = (player: PlayerStats) => {
    if (onPlayerSelect) {
      onPlayerSelect(player.name);
    }
  };

  if (sortedStats.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border/50">
        <p className="text-sm text-muted-foreground">No player data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Players</h3>
          <p className="text-sm text-muted-foreground">
            Click a player to view their progression
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showAdvancedStats ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowAdvancedStats((prev) => !prev)}
          >
            {showAdvancedStats ? "Simple" : "Detailed"}
          </Button>
          <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/30 p-0.5">
            {(
              [
                { field: "matchesWon" as SortField, label: "Wins" },
                { field: "averagePerVisit" as SortField, label: "Avg" },
                { field: "matchesPlayed" as SortField, label: "Games" },
                { field: "name" as SortField, label: "Name" },
              ] as const
            ).map(({ field, label }) => (
              <button
                key={field}
                onClick={() => handleSort(field)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  sortField === field
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label} {getSortIcon(field)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sortedStats.map((player, index) => (
          <PlayerCard
            key={player.name}
            player={player}
            rank={index + 1}
            isSelected={selectedPlayer === player.name}
            onClick={() => handlePlayerClick(player)}
            showAdvanced={showAdvancedStats}
          />
        ))}
      </div>
    </div>
  );
}
