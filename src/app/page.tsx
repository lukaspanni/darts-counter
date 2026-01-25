import { HomeContent } from "@/components/home-content";
import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense fallback={<div className="flex-grow flex-col p-4">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
