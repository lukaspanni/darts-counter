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
import { TrendingUp } from "lucide-react";

interface AverageChartProps {
  gameHistory: GameHistory[];
  selectedPlayer?: string;
}

const COLORS = [
  "hsl(260, 80%, 55%)", // purple (matches primary)
  "hsl(350, 75%, 55%)", // rose
  "hsl(160, 60%, 45%)", // emerald
  "hsl(40, 90%, 55%)",  // amber
  "hsl(200, 80%, 55%)", // sky
  "hsl(320, 70%, 55%)", // pink
  "hsl(180, 60%, 45%)", // teal
  "hsl(25, 90%, 55%)",  // orange
];

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: number;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border/50 bg-popover px-3 py-2 shadow-lg">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
        {format(new Date(label ?? 0), "dd MMM yyyy")}
      </p>
      {payload.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs">{entry.name}</span>
          </div>
          <span className="text-xs font-semibold tabular-nums">
            {typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AverageChart({
  gameHistory,
  selectedPlayer,
}: AverageChartProps) {
  const { chartData, players } = useMemo(() => {
    const history = calculatePlayerAverageHistory(gameHistory, selectedPlayer);

    if (selectedPlayer) {
      return {
        chartData: history.map((item) => ({
          date: new Date(item.date).getTime(),
          dateFormatted: format(new Date(item.date), "dd.MM.yyyy"),
          [item.name]: item.average,
        })),
        players: [selectedPlayer],
      };
    }

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

    const chartData = Array.from(allDates)
      .sort((a, b) => a - b)
      .map((dateTime) => {
        const dataPoint: Record<string, number | string> = {
          date: dateTime,
          dateFormatted: format(new Date(dateTime), "dd.MM.yyyy"),
        };

        playerDataByDate.forEach((dateMap, playerName) => {
          if (dateMap.has(dateTime)) {
            dataPoint[playerName] = dateMap.get(dateTime)!;
          }
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
      <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-border/50">
        <TrendingUp className="mb-2 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Not enough data for the chart
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">
          {selectedPlayer
            ? `${selectedPlayer}'s Progression`
            : "Average Progression"}
        </h3>
        <p className="text-sm text-muted-foreground">
          Running 3-dart average over time
        </p>
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-3 sm:p-4">
        <ResponsiveContainer width="100%" height={320} minHeight={280}>
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              strokeOpacity={0.5}
            />
            <XAxis
              dataKey="date"
              type="number"
              domain={["auto", "auto"]}
              scale="time"
              tickFormatter={(timestamp: number) =>
                format(new Date(timestamp), "dd MMM")
              }
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
            />
            {chartData.length > 10 && (
              <Brush
                dataKey="date"
                height={24}
                stroke="hsl(var(--border))"
                fill="hsl(var(--muted))"
                tickFormatter={(timestamp: number) =>
                  format(new Date(timestamp), "dd.MM")
                }
              />
            )}
            {players.map((player, index) => (
              <Line
                key={player}
                type="monotone"
                dataKey={player}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 0, fill: COLORS[index % COLORS.length] }}
                activeDot={{
                  r: 5,
                  strokeWidth: 2,
                  stroke: "hsl(var(--background))",
                }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
