# Plan: Practice / Training Modes (#181)

## Goal

Add dedicated practice modes (Around the Clock, Checkout Practice, Cricket) that reuse the existing dartboard and scoring UI but have their own game logic, state, and persistence — without complicating the existing match flow.

---

## Current Architecture Summary

The app has a single `GameController` with a linear phase state machine (`setup → preGame → playing → gameOver`), a single Zustand store (`createGameStore`) that owns all match state, and a `GamePlay` component tightly coupled to 501/301 match semantics (legs, visits, bust detection, checkout assist).

Key coupling points:
- `GameStoreState` mixes phase control, match rules, player turn management, and history tracking into one flat object
- `handleDartThrow` in `store.ts` contains hardcoded 501/301 scoring logic (bust detection, leg win, match win, visit max 180)
- `GamePlay` reads from the store and renders match-specific UI (leg counter, checkout suggestion, 180 celebration, leg-won modal)
- `computeDartThrow` in `lib/core/darts-score.ts` is 501/301-specific (bust rules, out mode validation)
- `GameSettings` schema assumes leg-based match format with starting score and out mode

Practice modes need fundamentally different:
- **Win conditions**: hit all 20 segments (ATC), complete a checkout (Checkout Practice), close all segments + have most points (Cricket)
- **State shape**: current target segment (ATC), random target score (Checkout), segment marks per player (Cricket)
- **Player count**: solo only (ATC, Checkout Practice), 1-2 players (Cricket)
- **Session semantics**: no "legs" concept, sessions may repeat indefinitely

---

## Refactoring Candidates

These refactors would make practice modes (and future game types) cleaner to implement. They are **not prerequisites** — practice modes can be built as a parallel system — but they reduce long-term duplication and coupling.

### R1: Extract dart input as a standalone concern

**What**: The `Dartboard` and `ScoreKeypad` components are already well-isolated with a simple `onScoreEntry(score, modifier)` callback. No refactoring needed here — they are fully reusable as-is.

### R2: Extract match-specific logic from `store.ts`

**What**: Move the 501/301 scoring rules (`computeDartThrow`, bust detection, leg/match win checks, `calculateRequiredLegsToWin`) into a dedicated module like `lib/core/match-engine.ts`. The store would call into an engine function rather than embedding the logic inline.

**Why**: `handleDartThrow` is ~100 lines mixing state mutations with game rule evaluation. Extracting the rules makes them testable in isolation and makes it clear what's match-specific vs. generic store plumbing.

**Scope**: Medium. The logic is already partially extracted (`computeDartThrow` in `darts-score.ts`), but the leg/match win detection, visit-max check, and event emission are still inline in the store.

### R3: Separate game phase routing from match orchestration

**What**: `GameController` currently handles both routing (which component to render per phase) and match lifecycle (saving history, pending game management). Split into a thin router and a `MatchOrchestrator` that wraps `GamePlay`/`GameOver` with match-specific side effects.

**Why**: Practice modes need their own phase routing and lifecycle (no pending game save, different history storage) but would duplicate the phase-switching pattern. A shared router pattern avoids this.

**Scope**: Small-medium. Move the `useEffect` hooks from `GameController` into a `useMatchLifecycle` hook, keep the `switch` statement as the generic router.

### R4: Make `GameSettings` a discriminated union

**What**: Currently `GameSettings` is a flat object with fields (`startingScore`, `outMode`, `legsToWin`, `gameMode`, `checkoutAssist`) that only apply to 501/301. For practice modes, most of these are irrelevant. A discriminated union by game type would make the type system enforce which settings apply where.

```ts
type MatchSettings = { type: "match"; startingScore: number; outMode: OutMode; ... }
type AroundTheClockSettings = { type: "aroundTheClock"; includeDoubles: boolean; ... }
type CheckoutPracticeSettings = { type: "checkoutPractice"; scoreRange: [number, number]; ... }
type CricketSettings = { type: "cricket"; variant: "standard" | "cutThroat"; ... }
type GameSettings = MatchSettings | AroundTheClockSettings | CheckoutPracticeSettings | CricketSettings
```

**Why**: Prevents invalid state combinations and makes each mode's config self-documenting.

**Scope**: Large — touches schemas, setup form, store, and all consumers of `GameSettings`. Best done incrementally: add the discriminant field first, migrate consumers, then split the union.

---

## Implementation Plan

### Phase 0: Infrastructure (prerequisite)

#### 0.1 Add `/practice` route

- Create `packages/frontend/src/app/practice/page.tsx`
- Add a `PracticeController` component (analogous to `GameController`) that manages practice-specific phase routing
- Add "Practice" link to the app header/navigation

#### 0.2 Create practice store

- Create `lib/practice-store.ts` with a **separate** Zustand store (not extending the match store)
- Common state: `playerName`, `sessionStartTime`, `dartsThrown`, `currentVisitDarts`
- Mode-specific state via discriminated union (see per-mode details below)
- Create `lib/practice-store-provider.tsx` (analogous to `store-provider.tsx`)
- The practice store wraps the `/practice` route, the match store stays on `/`

#### 0.3 Create practice session history schema

- Add to `schemas.ts`:
  ```ts
  const practiceSessionSchema = z.object({
    id: z.string(),
    date: z.string(),
    playerName: z.string(),
    mode: z.enum(["aroundTheClock", "checkoutPractice", "cricket"]),
    durationMs: z.number(),
    dartsThrown: z.number(),
    result: z.record(z.unknown()), // mode-specific result data
  })
  ```
- Persist to `localStorage` under `practice-history` key
- Create `usePracticeHistory` hook (mirrors `useGameHistory`)

#### 0.4 Practice mode selection screen

- `PracticeSetup` component: card-based mode picker (ATC, Checkout Practice, Cricket)
- Each card shows mode name, brief description, and player count
- Selecting a mode shows mode-specific settings, then starts the session

---

### Phase 1: Around the Clock

**Rules**: Hit segments 1-20 in order. Each segment requires one hit. Track total darts thrown and darts per segment. Session ends when all 20 segments are hit.

#### 1.1 State shape

```ts
type AroundTheClockState = {
  mode: "aroundTheClock";
  currentTarget: number;        // 1-20
  dartsPerSegment: number[];    // index 0 = segment 1, tracks darts to hit each
  completedSegments: number;
  totalDarts: number;
  sessionComplete: boolean;
}
```

#### 1.2 Game logic

- Create `lib/core/around-the-clock.ts`
- `processThrow(state, score, modifier)`:
  - If `score / multiplier === currentTarget` → advance target, record darts count
  - Otherwise → increment darts on current segment
  - If `currentTarget > 20` → session complete

#### 1.3 UI

- Create `components/practice/around-the-clock-play.tsx`
- Reuse `Dartboard` and `ScoreKeypad` with `onScoreEntry` callback
- Display: current target number (large), progress bar (segments 1-20), darts on current segment, total darts
- Highlight the target segment on the dartboard (pass `highlightSegment` prop — requires small dartboard enhancement)
- Session complete screen: total darts, darts per segment breakdown, "Play Again" button

#### 1.4 Dartboard enhancement

- Add optional `highlightedSegments?: number[]` prop to `Dartboard`
- Apply a subtle highlight class to matching segments
- This is reusable for checkout assist visualization later

---

### Phase 2: Checkout Practice

**Rules**: A random checkout score is presented (configurable range, e.g. 2-170). Player attempts to check out within 3 darts. Track success rate and average darts per checkout.

#### 2.1 State shape

```ts
type CheckoutPracticeState = {
  mode: "checkoutPractice";
  currentTarget: number;         // score to check out
  attemptsCompleted: number;
  attemptsSucceeded: number;
  totalDartsUsed: number;
  currentVisitDarts: VisitDart[];
  outMode: OutMode;              // configurable: single or double out
  scoreRange: [number, number];  // e.g. [2, 170]
}
```

#### 2.2 Game logic

- Create `lib/core/checkout-practice.ts`
- Reuse existing `computeDartThrow` from `darts-score.ts` for bust/win detection
- `processThrow(state, score, modifier, settings)`:
  - Apply dart to running score (starts at `currentTarget`)
  - If checkout achieved → success, generate next random target
  - If bust or 3 darts thrown → fail, generate next random target
- `generateTarget(scoreRange, outMode)`: random score in range that has a valid checkout

#### 2.3 UI

- Create `components/practice/checkout-practice-play.tsx`
- Display: target score (large), remaining score after darts, attempt counter, success rate percentage
- Reuse `Dartboard`/`ScoreKeypad`
- Show checkout suggestion (reuse existing `findCheckout`) alongside the target
- Session has no natural end — player stops when they want. "End Session" button saves stats.

#### 2.4 Settings

- Score range selector (preset ranges: "Easy 2-40", "Medium 41-100", "Hard 101-170", "All")
- Out mode toggle (single/double)

---

### Phase 3: Cricket

**Rules**: Segments 15-20 and Bull. Hit a segment 3 times to "close" it. Once closed, further hits score points (unless opponent has also closed it). Player/team with all segments closed and most points wins.

#### 3.1 State shape

```ts
const CRICKET_SEGMENTS = [15, 16, 17, 18, 19, 20, 25] as const;

type CricketPlayerState = {
  marks: Record<number, number>;  // segment → marks (0-3+)
  points: number;
}

type CricketState = {
  mode: "cricket";
  players: CricketPlayerState[];
  activePlayerIndex: number;
  currentVisitDarts: number;  // 0-3
  variant: "standard" | "cutThroat";
  gameComplete: boolean;
  winnerId: number | null;
}
```

#### 3.2 Game logic

- Create `lib/core/cricket.ts`
- `processThrow(state, score, modifier)`:
  - Determine segment (score / multiplier) and marks to add (multiplier count)
  - If segment not in cricket segments → miss (no effect)
  - Add marks to player's segment count
  - If marks > 3 and opponent hasn't closed → score points (standard) or add to opponent (cut-throat)
  - Check win condition: all segments closed AND (highest points or tied)
- Supports 1-2 players (solo practice = just close all segments)

#### 3.3 UI

- Create `components/practice/cricket-play.tsx`
- Cricket-specific scoreboard: grid showing segments as rows, players as columns, marks displayed as `/`, `X`, `⊗` (1, 2, 3 marks)
- Points displayed per player
- Reuse `Dartboard` (highlight cricket segments) and `ScoreKeypad` (filter to show only 15-20 + Bull)
- Turn management: 3 darts per visit, then switch player

#### 3.4 ScoreKeypad enhancement

- Add optional `visibleNumbers?: number[]` prop to filter which buttons are shown
- For cricket: `[15, 16, 17, 18, 19, 20]` + Bull

---

### Phase 4: Practice Stats

#### 4.1 Practice stats page

- Add `/practice/stats` route or a "Practice" tab on the existing stats page
- Show per-mode summary cards:
  - **ATC**: best time (fewest darts), average darts to complete, sessions played
  - **Checkout**: overall success rate, best streak, average darts per checkout
  - **Cricket**: games won/lost, average darts to close all segments

#### 4.2 Session history

- List of past practice sessions with date, mode, duration, key stat
- Delete individual sessions

---

## Commit Strategy

Each phase should be merged independently via its own PR:

1. **Phase 0**: Infrastructure (route, store, schema, mode picker) — no playable mode yet
2. **Phase 1**: Around the Clock — first playable practice mode
3. **Phase 2**: Checkout Practice — second mode, reuses `computeDartThrow`
4. **Phase 3**: Cricket — most complex mode, new scoreboard UI
5. **Phase 4**: Practice stats page

Within each phase, aim for small focused commits:
- Schema/type changes
- Core game logic + tests
- UI components
- Wiring (store actions, event handling)

---

## Open Questions

1. **Shared navigation**: Should "Practice" be a top-level nav item alongside "Stats", or a mode selector on the home page before "New Match"?
2. **Dartboard segment highlighting**: Worth implementing in Phase 1 (ATC target highlight) or defer to keep scope small?
3. **Cricket player count**: Support 2 players from the start, or ship solo-only first and add 2-player later?
4. **Live stream integration**: Should practice modes support live streaming? Probably not initially, but the event system could support it later.
5. **Practice stats on main stats page**: Separate `/practice/stats` route vs. a tab on the existing `/stats` page?
