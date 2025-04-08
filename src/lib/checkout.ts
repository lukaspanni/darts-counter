import type { Dart, Checkout } from "@/lib/schemas";

const NUMBER_OF_SCORES = 20;

const singles = Array.from({ length: NUMBER_OF_SCORES }, (_, i) => `${i + 1}`);
const doubles = Array.from({ length: NUMBER_OF_SCORES }, (_, i) => `D${i + 1}`);
const trebles = Array.from({ length: NUMBER_OF_SCORES }, (_, i) => `T${i + 1}`);
const bull = "25";
const doubleBull = "D25";

const dartScores: Readonly<Record<string, number>> = Object.freeze(
  [...singles, ...doubles, ...trebles, bull, doubleBull].reduce(
    (acc, dart) => {
      let score: number;
      if (dart.startsWith("D")) {
        score = Number.parseInt(dart.slice(1)) * 2 || 50; // Handle D25 case
      } else if (dart.startsWith("T")) {
        score = Number.parseInt(dart.slice(1)) * 3;
      } else {
        score = Number.parseInt(dart) || 25; // Handle bull case
      }
      acc[dart] = score;
      return acc;
    },
    {} as Record<string, number>,
  ),
);

const allThrows = [...singles, ...doubles, ...trebles, bull];
const validDoubles = [...doubles, doubleBull];

export function findCheckout(
  score: number,
  remainingDarts: number,
  doubleCheckout: boolean,
): string | null {
  if (score < 2 || score > 170 || remainingDarts < 1 || remainingDarts > 3) {
    return null;
  }

  const dfs = (
    dartsLeft: number,
    currentScore: number,
    path: Dart[],
  ): Checkout | null => {
    if (dartsLeft === 1) {
      const validThrows = doubleCheckout ? validDoubles : allThrows;

      for (const dart of validThrows) {
        if (dartScores[dart] === currentScore) {
          return [...path, dart];
        }
      }
      return null;
    }

    for (const dart of allThrows) {
      const newScore = currentScore - dartScores[dart];
      if (newScore >= (doubleCheckout ? 2 : 1)) {
        const next = dfs(dartsLeft - 1, newScore, [...path, dart]);
        if (next) {
          return next;
        }
      }
    }

    return null;
  };

  for (let darts = 1; darts <= remainingDarts; darts++) {
    const result = dfs(darts, score, []);
    if (result) {
      return result.join(" - ");
    }
  }

  return null;
}
