import type { ScoreModifier } from "@/lib/schemas";

export type AroundTheClockState = {
  mode: "aroundTheClock";
  currentTarget: number; // 1-20
  dartsPerSegment: number[]; // index i = segment i+1 (dartsPerSegment[0] = darts used for target 1)
  totalDarts: number;
  sessionComplete: boolean;
  currentSegmentDarts: number; // darts thrown at current target so far
};

export function createInitialATCState(): AroundTheClockState {
  return {
    mode: "aroundTheClock",
    currentTarget: 1,
    dartsPerSegment: [],
    totalDarts: 0,
    sessionComplete: false,
    currentSegmentDarts: 0,
  };
}

function getMultiplier(modifier: ScoreModifier): number {
  if (modifier === "double") return 2;
  if (modifier === "triple") return 3;
  return 1;
}

export function processATCThrow(
  state: AroundTheClockState,
  score: number,
  modifier: ScoreModifier,
): AroundTheClockState {
  if (state.sessionComplete) return state;

  const multiplier = getMultiplier(modifier);
  // score is scoreAfterModifier, so segment = score / multiplier
  // Special case: bull (25 single) and bullseye (50 double) - segment is 25 but ATC only goes to 20
  const segment = multiplier > 0 ? Math.round(score / multiplier) : 0;

  const isHit = segment === state.currentTarget;
  const newTotalDarts = state.totalDarts + 1;

  if (isHit) {
    const newDartsPerSegment = [
      ...state.dartsPerSegment,
      state.currentSegmentDarts + 1,
    ];
    const nextTarget = state.currentTarget + 1;
    const sessionComplete = nextTarget > 20;

    return {
      ...state,
      currentTarget: sessionComplete ? 20 : nextTarget,
      dartsPerSegment: newDartsPerSegment,
      totalDarts: newTotalDarts,
      sessionComplete,
      currentSegmentDarts: 0,
    };
  } else {
    return {
      ...state,
      totalDarts: newTotalDarts,
      currentSegmentDarts: state.currentSegmentDarts + 1,
    };
  }
}
