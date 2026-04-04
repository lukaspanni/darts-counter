"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { usePracticeStore } from "@/lib/practice-store-provider";
import type { OutMode } from "@/lib/core/checkout-practice";

type ScoreRangePreset = "easy" | "medium" | "hard" | "all";

const SCORE_RANGE_PRESETS: Record<ScoreRangePreset, [number, number]> = {
  easy: [2, 40],
  medium: [40, 100],
  hard: [100, 170],
  all: [2, 170],
};

const SCORE_RANGE_PRESET_ORDER: ScoreRangePreset[] = ["easy", "medium", "hard", "all"];

type ActiveMode = "aroundTheClock" | "checkoutPractice" | "cricket" | null;

export function PracticeSetup() {
  const [activeMode, setActiveMode] = useState<ActiveMode>(null);
  const [playerName, setPlayerName] = useState("");
  const [playerCount, setPlayerCount] = useState<1 | 2>(1);
  const [scoreRangePreset, setScoreRangePreset] =
    useState<ScoreRangePreset>("all");
  const [outMode, setOutMode] = useState<OutMode>("double");

  const setPlayerNameStore = usePracticeStore((s) => s.setPlayerName);
  const startAroundTheClock = usePracticeStore((s) => s.startAroundTheClock);
  const startCheckoutPractice = usePracticeStore(
    (s) => s.startCheckoutPractice,
  );
  const startCricket = usePracticeStore((s) => s.startCricket);

  const handleStart = () => {
    setPlayerNameStore(playerName.trim() || "Player");

    if (activeMode === "aroundTheClock") {
      startAroundTheClock();
    } else if (activeMode === "checkoutPractice") {
      startCheckoutPractice(SCORE_RANGE_PRESETS[scoreRangePreset], outMode);
    } else if (activeMode === "cricket") {
      startCricket(playerCount);
    }
  };

  const modes = [
    {
      key: "aroundTheClock" as const,
      title: "Around the Clock",
      description:
        "Hit each number from 1 to 20 in order. Track how many darts it takes per segment.",
      badge: "Solo",
    },
    {
      key: "checkoutPractice" as const,
      title: "Checkout Practice",
      description:
        "Practice finishing scores with random checkout targets. Improve your out-shot consistency.",
      badge: "Solo",
    },
    {
      key: "cricket" as const,
      title: "Cricket",
      description:
        "Close segments 15-20 and Bull by scoring three marks each. Score points on closed segments.",
      badge: "1-2 Players",
    },
  ];

  return (
    <main className="flex grow flex-col items-center px-4 pb-8 pt-6">
      <div className="w-full max-w-2xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Practice Modes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a mode to start training
          </p>
        </div>

        <div className="space-y-3">
          {modes.map((mode) => (
            <Card
              key={mode.key}
              className={`cursor-pointer transition-colors ${
                activeMode === mode.key
                  ? "border-primary ring-1 ring-primary"
                  : "hover:border-border"
              }`}
              onClick={() =>
                setActiveMode(activeMode === mode.key ? null : mode.key)
              }
            >
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{mode.title}</CardTitle>
                  <Badge variant="secondary">{mode.badge}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm text-muted-foreground">
                  {mode.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {activeMode !== null && (
          <Card>
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-base">Session Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-4">
              <div className="space-y-1.5">
                <Label htmlFor="player-name">Player Name</Label>
                <Input
                  id="player-name"
                  placeholder="Player"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
              </div>

              {activeMode === "cricket" && (
                <div className="space-y-1.5">
                  <Label>Players</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={playerCount === 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPlayerCount(1)}
                    >
                      Solo
                    </Button>
                    <Button
                      variant={playerCount === 2 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPlayerCount(2)}
                    >
                      2 Players
                    </Button>
                  </div>
                </div>
              )}

              {activeMode === "checkoutPractice" && (
                <>
                  <div className="space-y-1.5">
                    <Label>Score Range</Label>
                    <div className="flex flex-wrap gap-2">
                      {SCORE_RANGE_PRESET_ORDER.map((preset) => {
                        const range = SCORE_RANGE_PRESETS[preset];
                        return (
                          <Button
                            key={preset}
                            variant={
                              scoreRangePreset === preset ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setScoreRangePreset(preset)}
                          >
                            {preset.charAt(0).toUpperCase() + preset.slice(1)}{" "}
                            <span className="ml-1 text-xs opacity-70">
                              ({range[0]}-{range[1]})
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Out Mode</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={outMode === "single" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setOutMode("single")}
                      >
                        Single out
                      </Button>
                      <Button
                        variant={outMode === "double" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setOutMode("double")}
                      >
                        Double out
                      </Button>
                    </div>
                  </div>
                </>
              )}

              <Button className="w-full" onClick={handleStart}>
                Start Session
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
