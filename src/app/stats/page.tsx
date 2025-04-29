import { StatsTable } from "@/components/stats-table";

export default function StatsPage() {
  return (
    <main className="flex flex-grow flex-col items-center p-4">
      <h2 className="mb-8 text-3xl font-bold">Game History</h2>
      <StatsTable />
    </main>
  );
}
