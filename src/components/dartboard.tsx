import "client-only";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScoreModifier } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const BOARD_NUMBERS = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
];
const MODIFIER_MULTIPLIER: Record<ScoreModifier, number> = {
  single: 1,
  double: 2,
  triple: 3,
};
const INNER_SINGLE_INNER_RADIUS = 25;
const OUTER_BULL_SCORE = 25;
// Match the inner single ring edge to avoid an unscored gap.
const OUTER_BULL_RADIUS = INNER_SINGLE_INNER_RADIUS;
const BULLSEYE_SCORE = 50;

const CENTER = 100;
const SEGMENT_ANGLE = 360 / BOARD_NUMBERS.length;
const LABEL_RADIUS = 108;

const polarToCartesian = (radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: CENTER + radius * Math.cos(angleInRadians),
    y: CENTER + radius * Math.sin(angleInRadians),
  };
};

const createSegmentPath = (
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
) => {
  const startOuter = polarToCartesian(outerRadius, endAngle);
  const endOuter = polarToCartesian(outerRadius, startAngle);
  const startInner = polarToCartesian(innerRadius, startAngle);
  const endInner = polarToCartesian(innerRadius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
};

type RingDefinition = {
  key: string;
  outerRadius: number;
  innerRadius: number;
  modifier: ScoreModifier;
  getClassName: (index: number) => string;
};

const ringDefinitions: RingDefinition[] = [
  {
    key: "double",
    outerRadius: 100,
    innerRadius: 90,
    modifier: "double",
    getClassName: (index) =>
      index % 2 === 0
        ? "fill-red-600 dark:fill-red-500"
        : "fill-green-600 dark:fill-green-500",
  },
  {
    key: "outer-single",
    outerRadius: 90,
    innerRadius: 60,
    modifier: "single",
    getClassName: (index) =>
      index % 2 === 0
        ? "fill-neutral-100 dark:fill-neutral-800"
        : "fill-neutral-300 dark:fill-neutral-700",
  },
  {
    key: "triple",
    outerRadius: 60,
    innerRadius: 50,
    modifier: "triple",
    getClassName: (index) =>
      index % 2 === 0
        ? "fill-red-500 dark:fill-red-400"
        : "fill-green-500 dark:fill-green-400",
  },
  {
    key: "inner-single",
    outerRadius: 50,
    innerRadius: INNER_SINGLE_INNER_RADIUS,
    modifier: "single",
    getClassName: (index) =>
      index % 2 === 0
        ? "fill-neutral-100 dark:fill-neutral-800"
        : "fill-neutral-300 dark:fill-neutral-700",
  },
];

type DartboardProps = {
  onScoreEntry: (scoreAfterModifier: number, modifier: ScoreModifier) => void;
  disabled?: boolean;
};

const getCursorClass = (disabled: boolean) =>
  disabled ? "cursor-not-allowed" : "cursor-pointer";

export function Dartboard({ onScoreEntry, disabled = false }: DartboardProps) {
  const handleScore = (scoreAfterModifier: number, modifier: ScoreModifier) => {
    if (disabled) return;
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
              return (
                <path
                  key={`${ring.key}-${value}`}
                  d={path}
                  onClick={() => handleScore(value * multiplier, ring.modifier)}
                  className={cn(
                    ring.getClassName(index),
                    getCursorClass(disabled),
                    "stroke-background stroke-[0.5px]",
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
                className="pointer-events-none fill-muted-foreground text-xs font-semibold"
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
              "fill-green-600 dark:fill-green-500 stroke-background stroke-[0.5px]",
              getCursorClass(disabled),
            )}
            onClick={() => handleScore(OUTER_BULL_SCORE, "single")}
          >
            <title>Outer bull (25)</title>
          </circle>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={10}
            className={cn(
              "fill-red-600 dark:fill-red-500 stroke-background stroke-[0.5px]",
              getCursorClass(disabled),
            )}
            onClick={() => handleScore(BULLSEYE_SCORE, "double")}
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
