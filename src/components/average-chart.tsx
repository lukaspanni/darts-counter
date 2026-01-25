"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { calculatePlayerAverageHistory } from "@/lib/player-stats";
import type { GameHistory } from "@/lib/schemas";

interface AverageChartProps {
  gameHistory: GameHistory[];
  selectedPlayer?: string;
}

// Color palette for different players
const COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

export function AverageChart({
  gameHistory,
  selectedPlayer,
}: AverageChartProps) {
  const chartData = useMemo(() => {
    const history = calculatePlayerAverageHistory(gameHistory, selectedPlayer);

    if (selectedPlayer) {
      // Single player view - simple format
      return history.map((item) => ({
        gameNumber: item.gameNumber,
        [item.name]: item.average,
      }));
    }

    // Multi-player view - group by game number
    const grouped = new Map<number, Record<string, number | string>>();

    history.forEach((item) => {
      const existing = grouped.get(item.gameNumber) ?? {
        gameNumber: item.gameNumber,
      };
      existing[item.name] = item.average;
      grouped.set(item.gameNumber, existing);
    });

    return Array.from(grouped.values()).sort(
      (a, b) => (a.gameNumber as number) - (b.gameNumber as number),
    );
  }, [gameHistory, selectedPlayer]);

  const players = useMemo(() => {
    if (selectedPlayer) {
      return [selectedPlayer];
    }

    // Get unique player names
    const names = new Set<string>();
    calculatePlayerAverageHistory(gameHistory).forEach((item) => {
      names.add(item.name);
    });
    return Array.from(names);
  }, [gameHistory, selectedPlayer]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md border">
        <p className="text-muted-foreground">
          No data available for the chart
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <h3 className="text-xl font-semibold">
        {selectedPlayer
          ? `Average Progression - ${selectedPlayer}`
          : "Average Progression"}
      </h3>
      <div className="rounded-md border p-4">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="gameNumber"
              label={{ value: "Game Number", position: "insideBottom", offset: -5 }}
            />
            <YAxis
              label={{ value: "Average (per round)", angle: -90, position: "insideLeft" }}
            />
            <Tooltip />
            <Legend />
            {players.map((player, index) => (
              <Line
                key={player}
                type="monotone"
                dataKey={player}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
