"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { calculatePlayerStats, type PlayerStats } from "@/lib/player-stats";
import type { GameHistory } from "@/lib/schemas";

type SortField = "name" | "matchesPlayed" | "matchesWon" | "averagePerVisit";

interface PlayerAveragesProps {
  gameHistory: GameHistory[];
  onPlayerSelect?: (playerName: string) => void;
}

export function PlayerAverages({
  gameHistory,
  onPlayerSelect,
}: PlayerAveragesProps) {
  const [sortField, setSortField] = useState<SortField>("matchesPlayed");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const playerStats = calculatePlayerStats(gameHistory);

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
      return <ArrowUpDown className="inline h-4 w-4 opacity-50" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="inline h-4 w-4" />
    ) : (
      <ChevronDown className="inline h-4 w-4" />
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

  return (
    <div className="w-full space-y-4">
      <h3 className="text-xl font-semibold">Player Averages</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                onClick={() => handleSort("name")}
                className="cursor-pointer"
              >
                Player {getSortIcon("name")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("matchesPlayed")}
                className="cursor-pointer"
              >
                Matches {getSortIcon("matchesPlayed")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("matchesWon")}
                className="cursor-pointer"
              >
                Wins {getSortIcon("matchesWon")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("averagePerVisit")}
                className="cursor-pointer"
              >
                Avg/Visit {getSortIcon("averagePerVisit")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStats.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No player data available
                </TableCell>
              </TableRow>
            )}

            {sortedStats.map((player) => (
              <TableRow
                key={player.name}
                onClick={() => handlePlayerClick(player)}
                className={
                  onPlayerSelect ? "hover:bg-muted cursor-pointer" : ""
                }
              >
                <TableCell className="font-medium">{player.name}</TableCell>
                <TableCell>{player.matchesPlayed}</TableCell>
                <TableCell>{player.matchesWon}</TableCell>
                <TableCell className="font-semibold">
                  {player.averagePerVisit}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
