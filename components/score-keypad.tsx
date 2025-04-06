"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw, Check } from "lucide-react";

interface ScoreKeypadProps {
  onScoreEntry: (value: number) => void;
  onModifierChange: (modifier: "single" | "double" | "triple") => void;
  currentModifier: "single" | "double" | "triple";
  onUndo: () => void;
  onFinishRound: () => void;
  dartsInRound: number;
}

export function ScoreKeypad({
  onScoreEntry,
  onModifierChange,
  currentModifier,
  onUndo,
  onFinishRound,
  dartsInRound,
}: ScoreKeypadProps) {
  // Generate buttons 1-20
  const numberButtons = Array.from({ length: 20 }, (_, i) => i + 1);

  return (
    <Card>
      <CardContent className="p-4">
        {/* Modifier buttons */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          <Button
            variant={currentModifier === "single" ? "default" : "outline"}
            onClick={() => onModifierChange("single")}
            className="h-10"
            disabled={dartsInRound >= 3}
          >
            Single
          </Button>
          <Button
            variant={currentModifier === "double" ? "default" : "outline"}
            onClick={() => onModifierChange("double")}
            className="h-10"
            disabled={dartsInRound >= 3}
          >
            Double
          </Button>
          <Button
            variant={currentModifier === "triple" ? "default" : "outline"}
            onClick={() => onModifierChange("triple")}
            className="h-10"
            disabled={dartsInRound >= 3}
          >
            Triple
          </Button>
        </div>

        {/* Number grid */}
        <div className="mb-4 grid grid-cols-5 gap-2">
          {numberButtons.map((num) => (
            <Button
              key={num}
              variant="outline"
              onClick={() => onScoreEntry(num)}
              disabled={dartsInRound >= 3}
              className="h-10 w-full"
            >
              {num}
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={() => onScoreEntry(25)}
            disabled={dartsInRound >= 3 || currentModifier === "triple"}
            className="h-10"
          >
            Bull
          </Button>
          <Button
            variant="outline"
            onClick={() => onScoreEntry(0)}
            disabled={dartsInRound >= 3}
            className="h-10"
          >
            Miss
          </Button>
        </div>

        {/* Control buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={onUndo}
            disabled={dartsInRound === 0}
            className="h-12"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Undo
          </Button>
          <Button
            onClick={onFinishRound}
            disabled={dartsInRound === 0}
            className="h-12"
            variant={dartsInRound === 3 ? "default" : "outline"}
          >
            <Check className="mr-2 h-4 w-4" />
            {dartsInRound === 3 ? "Confirm Round" : "Finish Round"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
