import type { GameHistory } from "./schemas";

function uuid(): string {
  return crypto.randomUUID();
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomModifier(): "single" | "double" | "triple" {
  const r = Math.random();
  if (r < 0.7) return "single";
  if (r < 0.9) return "double";
  return "triple";
}

function generateLeg(
  legNumber: number,
  players: { id: number; name: string }[],
  startingScore: number,
): {
  leg: GameHistory["legs"][number];
  winnerPlayerId: number;
} {
  const visits: GameHistory["legs"][number]["visits"] = [];
  const scores = new Map(players.map((p) => [p.id, startingScore]));
  let winnerPlayerId: number | null = null;
  let visitCount = 0;
  const maxVisits = 40;

  while (!winnerPlayerId && visitCount < maxVisits) {
    for (const player of players) {
      const currentScore = scores.get(player.id)!;
      if (currentScore <= 0) continue;

      const maxVisitScore = Math.min(currentScore, 180);
      const avgTarget =
        currentScore <= 40 ? currentScore : randomBetween(20, Math.min(maxVisitScore, 100));
      const totalScore = Math.min(avgTarget, currentScore);

      const isCheckout = totalScore === currentScore && currentScore <= 170;
      const checkoutSuccess = isCheckout && Math.random() > 0.4;
      const actualScore = checkoutSuccess ? currentScore : Math.min(totalScore, currentScore - 1 > 1 ? totalScore : totalScore);

      const dartCount = randomBetween(1, 3);
      const darts = [];
      let dartTotal = 0;

      for (let d = 0; d < dartCount; d++) {
        const isLastDart = d === dartCount - 1;
        const dartScore = isLastDart
          ? actualScore - dartTotal
          : randomBetween(1, Math.max(1, Math.floor((actualScore - dartTotal) / (dartCount - d))));
        const clampedScore = Math.max(0, Math.min(dartScore, actualScore - dartTotal));
        dartTotal += clampedScore;

        darts.push({
          score: clampedScore,
          modifier: randomModifier(),
          validatedScore: clampedScore,
          isBust: false,
          isCheckoutAttempt: isCheckout && isLastDart,
          isCheckoutSuccess: checkoutSuccess && isLastDart,
          isDoubleAttempt: isCheckout && isLastDart,
          isMissedDouble: isCheckout && !checkoutSuccess && isLastDart,
        });
      }

      const endedScore = currentScore - dartTotal;
      visits.push({
        playerId: player.id,
        playerName: player.name,
        legNumber,
        darts,
        totalScore: dartTotal,
        startedScore: currentScore,
        endedScore: Math.max(0, endedScore),
        timestamp: new Date().toISOString(),
      });

      scores.set(player.id, Math.max(0, endedScore));
      visitCount++;

      if (endedScore <= 0) {
        winnerPlayerId = player.id;
        break;
      }
    }
  }

  if (!winnerPlayerId) {
    winnerPlayerId = players[0]!.id;
    scores.set(winnerPlayerId, 0);
  }

  return {
    leg: { legNumber, winnerPlayerId, visits },
    winnerPlayerId,
  };
}

export function generateMockGameHistory(): GameHistory[] {
  const playerPool = [
    { id: 0, name: "Alex" },
    { id: 1, name: "Jordan" },
    { id: 2, name: "Sam" },
    { id: 3, name: "Morgan" },
  ];

  const games: GameHistory[] = [];
  const now = Date.now();

  for (let i = 0; i < 24; i++) {
    const daysAgo = randomBetween(0, 90);
    const date = new Date(now - daysAgo * 86400000 - randomBetween(0, 86400000));

    // Pick 2 players for this game
    const shuffled = [...playerPool].sort(() => Math.random() - 0.5);
    const gamePlayers = shuffled.slice(0, 2);

    const startingScore = Math.random() > 0.2 ? 501 : 301;
    const legsToWin = Math.random() > 0.5 ? 3 : 2;
    const gameMode = startingScore === 501 ? "firstTo" : "bestOf";

    const legs: GameHistory["legs"] = [];
    const legWins = new Map(gamePlayers.map((p) => [p.id, 0]));
    let matchWinner: string | null = null;
    let legNum = 1;

    const targetWins =
      gameMode === "firstTo"
        ? legsToWin
        : Math.ceil(legsToWin / 2);

    while (!matchWinner && legNum <= 9) {
      const { leg, winnerPlayerId } = generateLeg(
        legNum,
        gamePlayers,
        startingScore,
      );
      legs.push(leg);

      const wins = (legWins.get(winnerPlayerId) ?? 0) + 1;
      legWins.set(winnerPlayerId, wins);

      if (wins >= targetWins) {
        matchWinner = gamePlayers.find((p) => p.id === winnerPlayerId)!.name;
      }
      legNum++;
    }

    if (!matchWinner) {
      matchWinner = gamePlayers[0]!.name;
    }

    games.push({
      id: uuid(),
      date: date.toISOString(),
      players: gamePlayers.map((p) => ({
        id: p.id,
        name: p.name,
        legsWon: legWins.get(p.id) ?? 0,
      })),
      winner: matchWinner,
      gameMode: `${startingScore}`,
      legsPlayed: legs.length,
      settings: {
        startingScore,
        outMode: "double",
        gameMode,
        legsToWin,
        checkoutAssist: false,
      },
      legs,
    });
  }

  return games.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}
