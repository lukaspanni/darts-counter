import "client-only";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScoreModifier } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import {
  BOARD_NUMBERS,
  MODIFIER_MULTIPLIER,
  OUTER_BULL_RADIUS,
  CENTER,
  SEGMENT_ANGLE,
  LABEL_RADIUS,
  polarToCartesian,
  createSegmentPath,
  ringDefinitions,
} from "@/components/dartboard-shared";

const OUTER_BULL_SCORE = 25;
const BULLSEYE_SCORE = 50;

type DartboardProps = {
  onScoreEntry: (scoreAfterModifier: number, modifier: ScoreModifier) => void;
  disabled?: boolean;
};

const getCursorClass = (disabled: boolean) =>
  disabled ? "cursor-not-allowed" : "cursor-pointer";

export function Dartboard({ onScoreEntry, disabled = false }: DartboardProps) {
  const [clickedSegment, setClickedSegment] = useState<string | null>(null);

  useEffect(() => {
    if (clickedSegment) {
      const timeoutId = setTimeout(() => setClickedSegment(null), 200);
      return () => clearTimeout(timeoutId);
    }
  }, [clickedSegment]);

  const handleScore = (
    scoreAfterModifier: number,
    modifier: ScoreModifier,
    segmentKey: string,
  ) => {
    if (disabled) return;

    // Trigger visual feedback
    setClickedSegment(segmentKey);

    onScoreEntry(scoreAfterModifier, modifier);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-lg">Dartboard</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <svg
          viewBox="0 0 200 200"
          role="img"
          aria-label="Interactive dartboard"
          className={cn(
            "h-[260px] w-[260px] overflow-visible sm:h-[320px] sm:w-[320px]",
            disabled && "pointer-events-none opacity-60",
            getCursorClass(disabled),
          )}
        >
          {ringDefinitions.map((ring) =>
            BOARD_NUMBERS.map((value, index) => {
              const startAngle = index * SEGMENT_ANGLE - SEGMENT_ANGLE / 2;
              const endAngle = startAngle + SEGMENT_ANGLE;
              const path = createSegmentPath(
                ring.outerRadius,
                ring.innerRadius,
                startAngle,
                endAngle,
              );
              const multiplier = MODIFIER_MULTIPLIER[ring.modifier];
              const segmentKey = `${ring.key}-${value}`;
              const isClicked = clickedSegment === segmentKey;

              return (
                <path
                  key={segmentKey}
                  d={path}
                  onClick={() =>
                    handleScore(value * multiplier, ring.modifier, segmentKey)
                  }
                  className={cn(
                    ring.getClassName(index),
                    getCursorClass(disabled),
                    "stroke-background stroke-[0.5px] transition-opacity duration-200",
                    isClicked && "opacity-60",
                  )}
                >
                  <title>
                    {ring.modifier} {value}
                  </title>
                </path>
              );
            }),
          )}
          {BOARD_NUMBERS.map((value, index) => {
            const angle = index * SEGMENT_ANGLE;
            const labelPosition = polarToCartesian(LABEL_RADIUS, angle);
            return (
              <text
                key={`label-${value}`}
                x={labelPosition.x}
                y={labelPosition.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground pointer-events-none text-xs font-semibold"
              >
                {value}
              </text>
            );
          })}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={OUTER_BULL_RADIUS}
            className={cn(
              "stroke-background fill-green-600 stroke-[0.5px] transition-opacity duration-200 dark:fill-green-500",
              getCursorClass(disabled),
              clickedSegment === "outer-bull" && "opacity-60",
            )}
            onClick={() =>
              handleScore(OUTER_BULL_SCORE, "single", "outer-bull")
            }
          >
            <title>Outer bull (25)</title>
          </circle>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={10}
            className={cn(
              "stroke-background fill-red-600 stroke-[0.5px] transition-opacity duration-200 dark:fill-red-500",
              getCursorClass(disabled),
              clickedSegment === "bullseye" && "opacity-60",
            )}
            onClick={() => handleScore(BULLSEYE_SCORE, "double", "bullseye")}
          >
            <title>Bullseye (50)</title>
          </circle>
        </svg>
        <p className="text-muted-foreground text-xs">
          Select a segment to enter the score.
        </p>
      </CardContent>
    </Card>
  );
}
