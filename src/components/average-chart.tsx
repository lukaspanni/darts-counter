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
  Brush,
} from "recharts";
import { calculatePlayerAverageHistory } from "@/lib/player-stats";
import type { GameHistory } from "@/lib/schemas";
import { format } from "date-fns";

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
  const { chartData, players } = useMemo(() => {
    const history = calculatePlayerAverageHistory(gameHistory, selectedPlayer);

    if (selectedPlayer) {
      // Single player view - simple format with date
      return {
        chartData: history.map((item) => ({
          date: new Date(item.date).getTime(),
          dateFormatted: format(new Date(item.date), "dd.MM.yyyy"),
          [item.name]: item.average,
        })),
        players: [selectedPlayer],
      };
    }

    // Multi-player view - group by date, using all game dates for x-axis
    const allDates = new Set<number>();
    const playerDataByDate = new Map<string, Map<number, number>>();

    history.forEach((item) => {
      const dateTime = new Date(item.date).getTime();
      allDates.add(dateTime);

      if (!playerDataByDate.has(item.name)) {
        playerDataByDate.set(item.name, new Map());
      }
      playerDataByDate.get(item.name)!.set(dateTime, item.average);
    });

    // Create chart data with all dates, filling in player values where they exist
    const chartData = Array.from(allDates)
      .sort((a, b) => a - b)
      .map((dateTime) => {
        const dataPoint: Record<string, number | string> = {
          date: dateTime,
          dateFormatted: format(new Date(dateTime), "dd.MM.yyyy"),
        };

        playerDataByDate.forEach((dateMap, playerName) => {
          // Only set value if player has data for this date
          if (dateMap.has(dateTime)) {
            dataPoint[playerName] = dateMap.get(dateTime)!;
          }
          // Otherwise leave undefined for connectNulls to interpolate
        });

        return dataPoint;
      });

    return {
      chartData,
      players: Array.from(playerDataByDate.keys()),
    };
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
              dataKey="date"
              type="number"
              domain={["auto", "auto"]}
              scale="time"
              tickFormatter={(timestamp: number) =>
                format(new Date(timestamp), "dd.MM.yy")
              }
              label={{ value: "Date", position: "insideBottom", offset: -5 }}
            />
            <YAxis
              label={{
                value: "Average (per round)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip
              labelFormatter={(timestamp) =>
                format(new Date(timestamp as number), "dd.MM.yyyy")
              }
            />
            <Legend />
            <Brush
              dataKey="date"
              height={30}
              stroke="#8884d8"
              tickFormatter={(timestamp: number) =>
                format(new Date(timestamp), "dd.MM")
              }
            />
            {players.map((player, index) => (
              <Line
                key={player}
                type="monotone"
                dataKey={player}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
