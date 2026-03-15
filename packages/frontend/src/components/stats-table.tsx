"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Trash2,
  Search,
  Trophy,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useGameHistory } from "@/lib/hooks/use-game-history";
import type { GameHistory } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type SortField = "date" | "gameMode" | "result";

interface StatsTableProps {
  gameHistory?: GameHistory[];
}

function GameCard({
  game,
  onDelete,
}: {
  game: GameHistory;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 transition-all duration-200 hover:border-border hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium tabular-nums">
              {game.gameMode}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(game.date), "dd MMM yyyy, HH:mm")}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/row:opacity-100 [.group\/row:hover_&]:opacity-100"
          onClick={() => onDelete(game.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        {game.players.map((player, i) => (
          <div key={player.name} className="flex items-center gap-2">
            {i > 0 && (
              <span className="text-xs font-medium text-muted-foreground">
                vs
              </span>
            )}
            <div className="flex items-center gap-1.5">
              {player.name === game.winner && (
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
              )}
              <span
                className={cn(
                  "text-sm",
                  player.name === game.winner
                    ? "font-semibold"
                    : "text-muted-foreground",
                )}
              >
                {player.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2">
        <span className="text-lg font-bold tabular-nums tracking-tight">
          {game.players.map((player) => player.legsWon).join(" - ")}
        </span>
      </div>
    </div>
  );
}

export function StatsTable({
  gameHistory: providedGameHistory,
}: StatsTableProps) {
  const { gameHistory, removeGame } = useGameHistory();
  const history = providedGameHistory ?? gameHistory;

  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
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

  const filteredAndSortedGames = history
    .filter((game) =>
      game.players.some((player) =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    )
    .sort((a, b) => {
      const multiplier = sortDirection === "asc" ? 1 : -1;
      switch (sortField) {
        case "date":
          return (
            (new Date(a.date).getTime() - new Date(b.date).getTime()) *
            multiplier
          );
        case "gameMode":
          return a.gameMode.localeCompare(b.gameMode) * multiplier;
        case "result":
          return a.winner.localeCompare(b.winner) * multiplier;
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/30 p-0.5">
          {(
            [
              { field: "date" as SortField, label: "Date" },
              { field: "gameMode" as SortField, label: "Mode" },
              { field: "result" as SortField, label: "Winner" },
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

      {filteredAndSortedGames.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border/50">
          <p className="text-sm text-muted-foreground">No matches found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedGames.map((game) => (
            <GameCard key={game.id} game={game} onDelete={removeGame} />
          ))}
        </div>
      )}
    </div>
  );
}
