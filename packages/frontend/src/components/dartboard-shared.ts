import type { ScoreModifier } from "@/lib/schemas";

export const BOARD_NUMBERS = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
];

export const MODIFIER_MULTIPLIER: Record<ScoreModifier, number> = {
  single: 1,
  double: 2,
  triple: 3,
};

export const INNER_SINGLE_INNER_RADIUS = 25;
export const OUTER_BULL_RADIUS = INNER_SINGLE_INNER_RADIUS;

export const CENTER = 100;
export const SEGMENT_ANGLE = 360 / BOARD_NUMBERS.length;
export const LABEL_RADIUS = 108;

export const polarToCartesian = (radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: CENTER + radius * Math.cos(angleInRadians),
    y: CENTER + radius * Math.sin(angleInRadians),
  };
};

export const createSegmentPath = (
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

export type RingDefinition = {
  key: string;
  outerRadius: number;
  innerRadius: number;
  modifier: ScoreModifier;
  getClassName: (index: number) => string;
};

export const ringDefinitions: RingDefinition[] = [
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

/** Get the segment key for a given board number and modifier */
export function getSegmentKey(segment: number, modifier: ScoreModifier): string {
  if (segment === 25) {
    return modifier === "double" ? "bullseye" : "outer-bull";
  }
  const ring = ringDefinitions.find((r) => r.modifier === modifier);
  if (!ring) return "";
  return `${ring.key}-${segment}`;
}

/** Get the center position of a segment for label placement */
export function getSegmentCenter(
  segment: number,
  modifier: ScoreModifier,
): { x: number; y: number } {
  if (segment === 25) {
    return { x: CENTER, y: CENTER };
  }

  const boardIndex = BOARD_NUMBERS.indexOf(segment);
  if (boardIndex === -1) return { x: CENTER, y: CENTER };

  const angle = boardIndex * SEGMENT_ANGLE;
  const ring = ringDefinitions.find((r) => r.modifier === modifier);
  if (!ring) return { x: CENTER, y: CENTER };

  // For single modifier, pick the ring with the larger area (outer-single)
  let targetRing = ring;
  if (modifier === "single") {
    targetRing =
      ringDefinitions.find((r) => r.key === "outer-single") ?? ring;
  }

  const midRadius = (targetRing.outerRadius + targetRing.innerRadius) / 2;
  return polarToCartesian(midRadius, angle);
}
