"use client";

import { StatsTable } from "@/components/stats-table";
import { useGameHistory } from "@/lib/hooks/use-game-history";

export default function StatsPage() {
  const { gameHistory } = useGameHistory();

  return (
    <main className="flex flex-grow flex-col items-center p-4">
      <h2 className="mb-8 text-3xl font-bold">Game History</h2>
      <StatsTable
        games={gameHistory}
        onGameDeleted={() => window.location.reload()}
      />
    </main>
  );
}
