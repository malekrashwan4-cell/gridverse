import type { GameKind } from "@/data/games";
import { getGameMechanic } from "@/lib/game-registry";

export type ScoreBreakdown = {
  base: number;
  difficultyBonus: number;
  timePenalty: number;
  movePenalty: number;
  mistakePenalty: number;
  hintPenalty: number;
  total: number;
};

export function getScoreBreakdown(kind: GameKind, durationMs: number, moves: number, mistakes: number, hintsUsed: number, mode: "normal" | "hard" | "expert"): ScoreBreakdown {
  const multiplier = mode === "expert" ? 1.35 : mode === "hard" ? 1.15 : 1;
  const base = Math.round(10000 * multiplier);
  const timePenalty = Math.floor(Math.max(0, durationMs) / 90);
  const movePenalty = Math.max(0, moves) * getGameMechanic(kind).moveWeight;
  const mistakePenalty = Math.max(0, mistakes) * 90;
  const hintPenalty = Math.max(0, hintsUsed) * 125;
  return { base, difficultyBonus: base - 10000, timePenalty, movePenalty, mistakePenalty, hintPenalty, total: Math.max(0, base - timePenalty - movePenalty - mistakePenalty - hintPenalty) };
}

export function calculateScore(...args: Parameters<typeof getScoreBreakdown>) {
  return getScoreBreakdown(...args).total;
}
