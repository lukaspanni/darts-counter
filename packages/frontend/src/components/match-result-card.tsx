import { Trophy } from "lucide-react";
import { forwardRef } from "react";
import {
  getConfiguredLegCount,
  getGameModeLabel,
  type Player,
  type GameSettings,
  type LegHistory,
} from "@/lib/schemas";

export interface MatchResultCardProps {
  players: Player[];
  winnerId: number;
  gameSettings: GameSettings;
  historyLegs: LegHistory[];
}

function computePlayerMatchStats(player: Player, historyLegs: LegHistory[]) {
  const visits = historyLegs.flatMap((leg) =>
    leg.visits.filter((v) => v.playerId === player.id),
  );
  const highestVisit = visits.reduce(
    (max, v) => Math.max(max, v.totalScore),
    0,
  );
  const count180s = visits.filter((v) => v.totalScore === 180).length;
  const average =
    player.dartsThrown > 0
      ? Number(((player.totalScore / player.dartsThrown) * 3).toFixed(1))
      : 0;

  return { highestVisit, count180s, average };
}

function formatGameMode(settings: GameSettings): string {
  const outMode = settings.outMode === "double" ? "Double Out" : "Single Out";
  const format = `${getGameModeLabel(settings)} ${getConfiguredLegCount(settings)}`;
  return `${settings.startingScore} · ${outMode} · ${format}`;
}

export const MatchResultCard = forwardRef<HTMLDivElement, MatchResultCardProps>(
  function MatchResultCard(
    { players, winnerId, gameSettings, historyLegs },
    ref,
  ) {
    const winner = players.find((p) => p.id === winnerId);

    return (
      <div
        ref={ref}
        className="w-[400px] rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-2xl"
      >
        {/* Header */}
        <div className="mb-5 text-center">
          <p className="mb-1 text-xs font-medium tracking-widest text-slate-400 uppercase">
            Match Result
          </p>
          <p className="text-xs text-slate-500">
            {formatGameMode(gameSettings)}
          </p>
        </div>

        {/* Score line */}
        <div className="mb-5 flex items-center justify-center gap-4">
          {players.map((player, i) => (
            <div key={player.id} className="flex items-center gap-4">
              {i > 0 && (
                <span className="text-lg font-light text-slate-500">–</span>
              )}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5">
                  {player.id === winnerId && (
                    <Trophy className="h-4 w-4 text-amber-400" />
                  )}
                  <span
                    className={`text-lg font-bold ${
                      player.id === winnerId
                        ? "text-amber-400"
                        : "text-slate-300"
                    }`}
                  >
                    {player.name}
                  </span>
                </div>
                <span className="text-3xl font-extrabold tabular-nums">
                  {player.legsWon}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="mb-4 border-t border-slate-700" />

        {/* Player stats */}
        <div className="space-y-3">
          {players.map((player) => {
            const stats = computePlayerMatchStats(player, historyLegs);
            const isWinner = player.id === winnerId;
            return (
              <div
                key={player.id}
                className={`rounded-lg px-3 py-2 ${
                  isWinner ? "bg-amber-400/10" : "bg-slate-700/40"
                }`}
              >
                <p
                  className={`mb-1 text-sm font-semibold ${
                    isWinner ? "text-amber-400" : "text-slate-300"
                  }`}
                >
                  {player.name}
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] tracking-wider text-slate-400 uppercase">
                      Average
                    </p>
                    <p className="text-sm font-bold tabular-nums">
                      {stats.average}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-wider text-slate-400 uppercase">
                      Highest
                    </p>
                    <p className="text-sm font-bold tabular-nums">
                      {stats.highestVisit}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-wider text-slate-400 uppercase">
                      180s
                    </p>
                    <p className="text-sm font-bold tabular-nums">
                      {stats.count180s}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-[10px] text-slate-500">
          {winner?.name} wins · {new Date().toLocaleDateString()}
        </p>
      </div>
    );
  },
);
