import type { GameKind } from "@/data/games";
import { getGameMechanic } from "@/lib/game-registry";
import { puzzleLevels } from "@/lib/puzzle-engine";

export type ChallengeMode = "normal" | "medium" | "hard" | "expert";
export type ChallengeConfig = {
  mode: ChallengeMode;
  stage: 1 | 2 | 3;
  seed: number;
  level: 1 | 2 | 3 | 4;
  tier: 1 | 2 | 3;
  label: string;
  description: string;
  maxMistakes: number;
  maxMoves: number;
  canUseHint: boolean;
  choiceRounds: number;
  studyDurationMs: number;
};

const modeLabels: Record<ChallengeMode, string> = { normal: "Easy", medium: "Medium", hard: "Hard", expert: "Expert" };
const descriptions: Record<ChallengeMode, string> = {
  normal: "One clear relationship, smaller memory load, generous clues.",
  medium: "Compare more information and track linked properties.",
  hard: "Intricate pictures, multiple relationships, and larger memory loads.",
  expert: "Deep comparisons, dense recall scenes, and layered transformations.",
};
const moveLimits: Record<string, [number, number]> = {
  "latin-grid": [100, 100], binary: [60, 60], nonogram: [120, 160], mines: [50, 45], memory: [40, 40], path: [32, 32], "lights-out": [24, 24], placement: [60, 60], spatial: [24, 24], constraints: [24, 24], pattern: [40, 40], sequence: [20, 20], network: [24, 24], regions: [60, 60], daily: [24, 24], choice: [20, 20],
};
export function getChallengeConfig(kind: GameKind, mode: ChallengeMode, attemptNumber: number): ChallengeConfig {
  const level = (mode === "normal" ? 1 : mode === "medium" ? 2 : mode === "hard" ? 3 : 4) as 1 | 2 | 3 | 4;
  const stage = Math.min(3, Math.max(1, attemptNumber)) as 1 | 2 | 3;
  const family = getGameMechanic(kind).family;
  const limits = moveLimits[family] ?? moveLimits.choice;
  return {
    mode, stage, seed: Math.max(1, attemptNumber), level, tier: Math.min(3, level) as 1 | 2 | 3,
    label: modeLabels[mode], description: descriptions[mode],
    maxMistakes: level <= 2 ? 5 : level === 3 ? 3 : 2,
    maxMoves: level <= 2 ? Number.POSITIVE_INFINITY : limits[level === 3 ? 0 : 1],
    canUseHint: mode !== "expert", choiceRounds: level,
    studyDurationMs: puzzleLevels[level - 1].studyMs,
  };
}
export function getSavedChallengeMode(gameId: string): ChallengeMode {
  try { const value = localStorage.getItem(`gridverse-difficulty-${gameId}`); return value === "medium" || value === "hard" || value === "expert" ? value : "normal"; }
  catch { return "normal"; }
}
export function saveChallengeMode(gameId: string, mode: ChallengeMode) {
  try { localStorage.setItem(`gridverse-difficulty-${gameId}`, mode); } catch { /* Settings remain in memory for this run. */ }
}
