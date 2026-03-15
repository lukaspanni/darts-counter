"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Crown,
  ChevronRight,
  Search,
} from "lucide-react";
import type { PlayerStats } from "@/lib/player-stats";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SortField = "name" | "matchesPlayed" | "matchesWon" | "averagePerVisit";

interface PlayerAveragesProps {
  playerStats: PlayerStats[];
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
          highlight && "text-purple-600 dark:text-purple-400",
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
  showRankStyle,
  isSelected,
  onClick,
  showAdvanced,
}: {
  player: PlayerStats;
  rank: number;
  showRankStyle: boolean;
  isSelected: boolean;
  onClick: () => void;
  showAdvanced: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={isSelected}
      aria-label={`View ${player.name}'s progression`}
      className={cn(
        "group w-full cursor-pointer rounded-xl border p-4 text-left transition-all duration-200",
        isSelected
          ? "border-purple-500/60 bg-primary/5 shadow-sm ring-1 ring-purple-500/40 dark:border-purple-400/50 dark:ring-purple-400/30"
          : "border-border/50 bg-card hover:border-border hover:shadow-sm",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
              showRankStyle && rank === 1
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : showRankStyle && rank === 2
                  ? "bg-gray-300/20 text-gray-500 dark:text-gray-300"
                  : showRankStyle && rank === 3
                    ? "bg-orange-400/15 text-orange-600 dark:text-orange-400"
                    : "bg-muted text-foreground/70",
            )}
          >
            {showRankStyle && rank === 1 ? (
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
            isSelected && "rotate-90 text-purple-600 dark:text-purple-400",
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
          value={`${player.matchWinPercentage}%`}
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
  playerStats,
  onPlayerSelect,
  selectedPlayer,
}: PlayerAveragesProps) {
  const [sortField, setSortField] = useState<SortField>("matchesWon");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [nameFilter, setNameFilter] = useState("");

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
      return <ArrowUpDown className="inline h-3.5 w-3.5 opacity-60" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="inline h-3.5 w-3.5" />
    ) : (
      <ChevronDown className="inline h-3.5 w-3.5" />
    );
  };

  const sortedStats = useMemo(() => {
    const filtered = nameFilter
      ? playerStats.filter((p) =>
          p.name.toLowerCase().includes(nameFilter.toLowerCase()),
        )
      : playerStats;
    return [...filtered].sort((a, b) => {
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
  }, [playerStats, sortField, sortDirection, nameFilter]);

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
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between xl:flex-col xl:items-start 2xl:flex-row 2xl:items-center">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Players</h3>
            <p className="text-sm text-muted-foreground">
              Click a player to view their progression
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* View mode toggle - segmented control */}
            <div
              role="radiogroup"
              aria-label="Stats detail level"
              className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/50 bg-muted/30 p-0.5"
            >
              <button
                role="radio"
                onClick={() => setShowAdvancedStats(false)}
                aria-checked={!showAdvancedStats}
                aria-label="Simple view"
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                  !showAdvancedStats
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Simple
              </button>
              <button
                role="radio"
                onClick={() => setShowAdvancedStats(true)}
                aria-checked={showAdvancedStats}
                aria-label="Detailed view"
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                  showAdvancedStats
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Detailed
              </button>
            </div>
            {/* Sort controls */}
            <div
              role="group"
              aria-label="Sort players"
              className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/50 bg-muted/30 p-0.5"
            >
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
                  aria-label={`Sort by ${label}`}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors",
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
        {/* Name filter */}
        {playerStats.length > 3 && (
          <div className="relative sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter players..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="pl-9"
              aria-label="Filter players by name"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {sortedStats.map((player, index) => (
          <PlayerCard
            key={player.name}
            player={player}
            rank={index + 1}
            showRankStyle={sortField !== "name"}
            isSelected={selectedPlayer === player.name}
            onClick={() => handlePlayerClick(player)}
            showAdvanced={showAdvancedStats}
          />
        ))}
      </div>
    </div>
  );
}
