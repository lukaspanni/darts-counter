"use client";

import type { ScoreModifier } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import {
  BOARD_NUMBERS,
  OUTER_BULL_RADIUS,
  CENTER,
  SEGMENT_ANGLE,
  LABEL_RADIUS,
  polarToCartesian,
  createSegmentPath,
  ringDefinitions,
  getSegmentKey,
  getSegmentCenter,
} from "@/components/dartboard-shared";

export type DartHit = {
  dartNumber: number;
  segment: number;
  modifier: ScoreModifier;
};

type DartboardViewerProps = {
  hits: DartHit[];
};

export function DartboardViewer({ hits }: DartboardViewerProps) {
  const hitsBySegmentKey = new Map<string, number[]>();
  for (const hit of hits) {
    const key = getSegmentKey(hit.segment, hit.modifier);
    if (!key) continue;
    const existing = hitsBySegmentKey.get(key) ?? [];
    existing.push(hit.dartNumber);
    hitsBySegmentKey.set(key, existing);
  }

  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label="Dartboard showing hit segments"
      className="h-[220px] w-[220px] overflow-visible sm:h-[280px] sm:w-[280px]"
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
          const segmentKey = `${ring.key}-${value}`;
          const isHit = hitsBySegmentKey.has(segmentKey);

          return (
            <path
              key={segmentKey}
              d={path}
              className={cn(
                ring.getClassName(index),
                "stroke-background stroke-[0.5px] transition-opacity duration-300",
                isHit && "opacity-60",
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
          "stroke-background fill-green-600 stroke-[0.5px] transition-opacity duration-300 dark:fill-green-500",
          hitsBySegmentKey.has("outer-bull") && "opacity-60",
        )}
      >
        <title>Outer bull (25)</title>
      </circle>
      <circle
        cx={CENTER}
        cy={CENTER}
        r={10}
        className={cn(
          "stroke-background fill-red-600 stroke-[0.5px] transition-opacity duration-300 dark:fill-red-500",
          hitsBySegmentKey.has("bullseye") && "opacity-60",
        )}
      >
        <title>Bullseye (50)</title>
      </circle>

      {/* Dart number indicators */}
      {hits.map((hit) => {
        const pos = getSegmentCenter(hit.segment, hit.modifier);
        // Offset multiple darts hitting the same segment
        const key = getSegmentKey(hit.segment, hit.modifier);
        const dartsInSegment = hitsBySegmentKey.get(key) ?? [];
        const indexInSegment = dartsInSegment.indexOf(hit.dartNumber);
        const offsetX = dartsInSegment.length > 1 ? (indexInSegment - (dartsInSegment.length - 1) / 2) * 6 : 0;

        return (
          <g key={`dart-${hit.dartNumber}`}>
            <circle
              cx={pos.x + offsetX}
              cy={pos.y}
              r={4}
              className="fill-primary stroke-primary-foreground stroke-[0.5px]"
            />
            <text
              x={pos.x + offsetX}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-primary-foreground pointer-events-none text-[5px] font-bold"
            >
              {hit.dartNumber}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
