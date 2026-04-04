"use client";

import { usePracticeStore } from "@/lib/practice-store-provider";
import { PracticeSetup } from "@/components/practice/practice-setup";
import { AroundTheClockPlay } from "@/components/practice/around-the-clock-play";
import { CheckoutPracticePlay } from "@/components/practice/checkout-practice-play";
import { CricketPlay } from "@/components/practice/cricket-play";

export function PracticeController() {
  const phase = usePracticeStore((s) => s.phase);
  const modeState = usePracticeStore((s) => s.modeState);

  if (phase === "setup") {
    return <PracticeSetup />;
  }

  if (phase === "playing" || phase === "sessionComplete") {
    if (!modeState) return <PracticeSetup />;

    if (modeState.mode === "aroundTheClock") {
      return <AroundTheClockPlay />;
    }

    if (modeState.mode === "checkoutPractice") {
      return <CheckoutPracticePlay />;
    }

    if (modeState.mode === "cricket") {
      return <CricketPlay />;
    }
  }

  return <PracticeSetup />;
}
