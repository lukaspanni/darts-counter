"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlayerStats } from "@/lib/player-stats";

interface DetailedStatsCardProps {
  stats: PlayerStats[];
}

export function DetailedStatsCard({ stats }: DetailedStatsCardProps) {
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(
    new Set(),
  );

  const togglePlayer = (playerName: string) => {
    setExpandedPlayers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(playerName)) {
        newSet.delete(playerName);
      } else {
        newSet.add(playerName);
      }
      return newSet;
    });
  };

  if (stats.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      <h3 className="text-xl font-semibold">Detailed Statistics</h3>
      <div className="space-y-4">
        {stats.map((player) => {
          const isExpanded = expandedPlayers.has(player.name);

          return (
            <Card key={player.name}>
              <CardHeader
                onClick={() => togglePlayer(player.name)}
                className="cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{player.name}</CardTitle>
                    <CardDescription>
                      {player.matchesPlayed} matches played •{" "}
                      {player.matchWinPercentage}% win rate
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-4">
                  {/* Basic Stats */}
                  <div>
                    <h4 className="mb-2 font-medium text-sm text-muted-foreground">
                      Basic Statistics
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <StatItem
                        label="3-Dart Average"
                        value={player.averagePerVisit}
                      />
                      <StatItem
                        label="Matches Won"
                        value={`${player.matchesWon} / ${player.matchesPlayed}`}
                      />
                      <StatItem
                        label="Match Win %"
                        value={`${player.matchWinPercentage}%`}
                      />
                      <StatItem
                        label="Legs Won"
                        value={`${player.legsWon} / ${player.legsPlayed}`}
                      />
                      <StatItem
                        label="Leg Win %"
                        value={`${player.legWinPercentage}%`}
                      />
                    </div>
                  </div>

                  {/* Advanced Stats */}
                  <div>
                    <h4 className="mb-2 font-medium text-sm text-muted-foreground">
                      Advanced Statistics
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {player.first9Average > 0 && (
                        <StatItem
                          label="First 9 Average"
                          value={player.first9Average}
                          description="Average of first 9 darts"
                        />
                      )}
                      {player.highestScore > 0 && (
                        <StatItem
                          label="Highest Score"
                          value={player.highestScore}
                          description="Best 3-dart visit"
                        />
                      )}
                      {player.total180s > 0 && (
                        <StatItem
                          label="180s"
                          value={player.total180s}
                          description="Maximum scores"
                        />
                      )}
                      {player.total100Plus > 0 && (
                        <StatItem
                          label="100+ Visits"
                          value={player.total100Plus}
                          description="High scoring visits"
                        />
                      )}
                      {player.checkoutPercentage > 0 && (
                        <StatItem
                          label="Checkout %"
                          value={`${player.checkoutPercentage}%`}
                          description="Success rate on checkouts"
                        />
                      )}
                      {player.averageDartsPerLeg > 0 && (
                        <StatItem
                          label="Avg Darts/Leg"
                          value={player.averageDartsPerLeg}
                          description="For won legs"
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description?: string;
}) {
  return (
    <div className="bg-muted rounded-lg p-3">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <div className="text-xs text-muted-foreground mt-1">{description}</div>
      )}
    </div>
  );
}
