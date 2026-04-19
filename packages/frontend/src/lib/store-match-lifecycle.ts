import type { GameDomainEvent } from "./game-events";
import { getRequiredLegsToWin } from "./schemas";
import type { GameSettings, Player, ScoreModifier, VisitDart } from "./schemas";

type ThrowContext = {
  player: Player;
  legNumber: number;
  playerCount: number;
  gameSettings: GameSettings;
  currentLegScores: number[];
  score: number;
  modifier: ScoreModifier;
  newScore: number;
  validatedScore: number;
  isBust: boolean;
  isLegWin: boolean;
  isCheckoutAttempt: boolean;
  isDoubleAttempt: boolean;
  isMissedDouble: boolean;
};

export type BuiltThrowResult = {
  newScore: number;
  validatedScore: number;
  isBust: boolean;
  isLegWin: boolean;
  isMatchWin: boolean;
  matchWinner: number | null;
  currentVisitTotal: number;
  scoreDelta: number;
  dart: VisitDart;
  events: GameDomainEvent[];
};

export type PlayerThrowUpdate = {
  score: number;
  totalScore: number;
  dartsThrown: number;
  legScores: number[];
};

export type CompletedLegState = {
  legWinner: number;
  matchWinner: number | null;
  nextGamePhase: "gameOver" | null;
  matchPausedAt: number;
  visitStartTime: null;
};


export function rotateActivePlayer(
  players: Player[],
  activePlayerId: number,
): number {
  if (players.length <= 1) {
    return activePlayerId;
  }

  return (
    players.find((player) => player.id !== activePlayerId)?.id ?? activePlayerId
  );
}

export function buildThrowResult(context: ThrowContext): BuiltThrowResult {
  const isMatchWin =
    context.isLegWin &&
    context.player.legsWon + 1 >= getRequiredLegsToWin(context.gameSettings);
  const scoreDelta = context.player.score - context.newScore;
  const totalScoreAfter = context.player.totalScore + scoreDelta;
  const dartsThrownAfter = context.player.dartsThrown + 1;
  const currentVisitTotal =
    context.currentLegScores.reduce((sum, score) => sum + score, 0) +
    context.validatedScore;
  const winnerAverage =
    dartsThrownAfter > 0
      ? Number(((totalScoreAfter / dartsThrownAfter) * 3).toFixed(2))
      : 0;
  const dart: VisitDart = {
    score: context.score,
    modifier: context.modifier,
    validatedScore: context.validatedScore,
    isBust: context.isBust,
    isCheckoutAttempt: context.isCheckoutAttempt,
    isCheckoutSuccess: context.isLegWin,
    isDoubleAttempt: context.isDoubleAttempt,
    isMissedDouble: context.isMissedDouble,
  };

  const events: GameDomainEvent[] = [
    {
      type: "dartThrown",
      playerId: context.player.id,
      playerName: context.player.name,
      legNumber: context.legNumber,
      score: context.score,
      modifier: context.modifier,
      validatedScore: context.validatedScore,
      newScore: context.newScore,
      isBust: context.isBust,
      isLegWin: context.isLegWin,
      currentVisitTotal,
    },
  ];

  if (currentVisitTotal === 180) {
    events.push({
      type: "visitMaxScored",
      playerId: context.player.id,
      playerName: context.player.name,
      legNumber: context.legNumber,
      score: 180,
    });
  }

  if (context.isLegWin) {
    events.push({
      type: "legWon",
      winnerId: context.player.id,
      winnerName: context.player.name,
      legNumber: context.legNumber,
      isMatchWin,
      playerCount: context.playerCount,
    });
  }

  if (isMatchWin) {
    events.push({
      type: "matchWon",
      winnerId: context.player.id,
      winnerName: context.player.name,
      legNumber: context.legNumber,
      playerCount: context.playerCount,
      winnerAverage,
      legsPlayed: context.legNumber,
      startingScore: context.gameSettings.startingScore,
      outMode: context.gameSettings.outMode,
    });
  }

  return {
    newScore: context.newScore,
    validatedScore: context.validatedScore,
    isBust: context.isBust,
    isLegWin: context.isLegWin,
    isMatchWin,
    matchWinner: isMatchWin ? context.player.id : null,
    currentVisitTotal,
    scoreDelta,
    dart,
    events,
  };
}

export function applyThrowToPlayer(
  player: Player,
  currentLegScores: number[],
  throwResult: BuiltThrowResult,
): PlayerThrowUpdate {
  return {
    score: throwResult.newScore,
    totalScore: player.totalScore + throwResult.scoreDelta,
    dartsThrown: player.dartsThrown + 1,
    legScores: [...currentLegScores, throwResult.validatedScore],
  };
}

export function completeLeg(
  playerId: number,
  isMatchWin: boolean,
  now: number,
): CompletedLegState {
  return {
    legWinner: playerId,
    matchWinner: isMatchWin ? playerId : null,
    nextGamePhase: isMatchWin ? "gameOver" : null,
    matchPausedAt: now,
    visitStartTime: null,
  };
}
