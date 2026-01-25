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
import { format } from "date-fns";
import { Input } from "./ui/input";
import { ArrowUpDown, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { useGameHistory } from "@/lib/hooks/use-game-history";

type SortField = "date" | "gameMode" | "result";

export function StatsTable() {
  const { gameHistory, removeGame } = useGameHistory();

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
      return <ArrowUpDown className="inline h-4 w-4 opacity-50" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="inline h-4 w-4" />
    ) : (
      <ChevronDown className="inline h-4 w-4" />
    );
  };

  const filteredAndSortedGames = gameHistory
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
    <div className="w-full space-y-4">
      <Input
        placeholder="Search players..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full"
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                onClick={() => handleSort("date")}
                className="cursor-pointer"
              >
                Date {getSortIcon("date")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("gameMode")}
                className="cursor-pointer"
              >
                Game Mode {getSortIcon("gameMode")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("result")}
                className="cursor-pointer"
              >
                Result {getSortIcon("result")}
              </TableHead>
              <TableHead className="max-w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedGames.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No games found
                </TableCell>
              </TableRow>
            )}

            {filteredAndSortedGames.map((game) => (
              <TableRow key={game.id}>
                <TableCell>
                  {format(new Date(game.date), "dd.MM.yyyy HH:mm")}
                </TableCell>
                <TableCell>{game.gameMode}</TableCell>
                <TableCell>
                  {game.players.map((player, i) => (
                    <span key={player.name}>
                      <span
                        className={
                          player.name === game.winner
                            ? "text-primary font-bold"
                            : ""
                        }
                      >
                        {player.name}
                      </span>
                      {i < game.players.length - 1 ? <span> vs. </span> : null}
                    </span>
                  ))}
                  <br />
                  {game.players.map((player) => player.roundsWon).join(" : ")}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeGame(game.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
