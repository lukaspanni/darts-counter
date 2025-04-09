import "client-only";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ScoreModifier } from "@/lib/schemas";
import { RotateCcw, Check } from "lucide-react";
import { useState } from "react";

interface ScoreKeypadProps {
  onScoreEntry: (scoreAfterModifier: number, modifier: ScoreModifier) => void;
  onUndo: () => void;
  onFinishRound: () => void;
  dartsInRound: number;
  canThrowMoreDarts: boolean;
}

export function ScoreKeypad({
  onScoreEntry,
  onUndo,
  onFinishRound,
  dartsInRound,
  canThrowMoreDarts,
}: ScoreKeypadProps) {
  const [modifier, setModifier] = useState<ScoreModifier>("single");
  // Generate buttons 1-20
  const numberButtons = Array.from({ length: 20 }, (_, i) => i + 1);

  const onScoreButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const value = parseInt(e.currentTarget.value);
    onScoreEntry(
      value * (modifier === "single" ? 1 : modifier === "double" ? 2 : 3),
      modifier,
    );
    setModifier("single");
  };

  return (
    <Card>
      <CardContent className="p-4">
        {/* Modifier buttons */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          <Button
            variant={modifier === "single" ? "default" : "outline"}
            onClick={() => setModifier("single")}
            className="h-10"
            disabled={!canThrowMoreDarts}
          >
            Single
          </Button>
          <Button
            variant={modifier === "double" ? "default" : "outline"}
            onClick={() => setModifier("double")}
            className="h-10"
            disabled={!canThrowMoreDarts}
          >
            Double
          </Button>
          <Button
            variant={modifier === "triple" ? "default" : "outline"}
            onClick={() => setModifier("triple")}
            className="h-10"
            disabled={!canThrowMoreDarts}
          >
            Triple
          </Button>
        </div>

        {/* Number grid */}
        <div className="mb-4 grid grid-cols-5 gap-2">
          {numberButtons.map((num) => (
            <Button
              key={num}
              value={num}
              variant="outline"
              onClick={onScoreButtonClick}
              disabled={!canThrowMoreDarts}
              className="h-10 w-full"
            >
              {num}
            </Button>
          ))}
          <Button
            variant="outline"
            value={25}
            onClick={onScoreButtonClick}
            disabled={!canThrowMoreDarts || modifier === "triple"}
            className="h-10"
          >
            Bull
          </Button>
          <Button
            variant="outline"
            value={0}
            onClick={onScoreButtonClick}
            disabled={!canThrowMoreDarts}
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
            variant={!canThrowMoreDarts ? "default" : "outline"}
          >
            <Check className="mr-2 h-4 w-4" />
            {!canThrowMoreDarts ? "Confirm Round" : "Finish Round"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
