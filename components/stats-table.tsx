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
import { GameHistory } from "@/lib/types";
import { format } from "date-fns";
import { DeleteGameButton } from "./delete-game-button";
import { Input } from "./ui/input";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";

interface StatsTableProps {
  games: GameHistory[];
  onGameDeleted?: () => void;
}

type SortField = "date" | "gameMode" | "result";

export function StatsTable({ games, onGameDeleted }: StatsTableProps) {
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

  const filteredAndSortedGames = games
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
    <div className="w-full space-y-4 lg:max-w-4xl">
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
            {filteredAndSortedGames.map((game) => (
              <TableRow key={game.id}>
                <TableCell>
                  {format(new Date(game.date), "dd.MM.yyyy HH:mm")}
                </TableCell>
                <TableCell>{game.gameMode}</TableCell>
                <TableCell>
                  {game.players.map((player, i) => (
                    <>
                      <span
                        key={player.name}
                        className={
                          player.name === game.winner
                            ? "text-primary font-bold"
                            : ""
                        }
                      >
                        {player.name}
                      </span>
                      {i < game.players.length - 1 ? <span> vs. </span> : null}
                    </>
                  ))}
                  <br />
                  {game.players.map((player) => player.roundsWon).join(" : ")}
                </TableCell>
                <TableCell>
                  <DeleteGameButton
                    gameId={game.id.toString()}
                    onSuccess={onGameDeleted}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
