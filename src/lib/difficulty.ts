import type { GameKind } from "@/data/games";
import { getGameMechanic } from "@/lib/game-registry";

export type ChallengeMode = "normal" | "hard" | "expert";

export type ChallengeConfig = {
  mode: ChallengeMode;
  stage: 1 | 2 | 3;
  tier: 1 | 2 | 3;
  label: string;
  description: string;
  maxMistakes: number;
  maxMoves: number;
  canUseHint: boolean;
  choiceRounds: number;
  studyDurationMs: number;
};

const modeLabels: Record<ChallengeMode, string> = { normal: "Normal", hard: "Hard", expert: "Expert" };
const modeDescriptions: Record<ChallengeMode, string> = {
  normal: "Learn the rule with generous recovery room.",
  hard: "Fewer recoveries, leaner clues, and tighter execution.",
  expert: "A mastery run: one mistake and efficient decisions matter.",
};

const moveLimits: Record<string, [number, number]> = {
  "latin-grid": [72, 58], binary: [46, 34], nonogram: [54, 40], mines: [50, 36], memory: [28, 22], path: [22, 17], "lights-out": [15, 11], placement: [46, 34], spatial: [18, 14], constraints: [14, 10], pattern: [10, 8], sequence: [10, 8], network: [18, 12], regions: [42, 30], daily: [12, 9], choice: [10, 8],
};

export function getChallengeConfig(kind: GameKind, mode: ChallengeMode, attemptNumber: number): ChallengeConfig {
  const stage = Math.min(3, Math.max(1, attemptNumber)) as 1 | 2 | 3;
  const baseTier = mode === "normal" ? 1 : mode === "hard" ? 2 : 3;
  const tier = Math.min(3, Math.max(1, baseTier + (stage > 1 ? 1 : 0))) as 1 | 2 | 3;
  const family = getGameMechanic(kind).family;
  const [hardLimit, expertLimit] = moveLimits[family] ?? moveLimits.choice;
  const maxMoves = mode === "normal" ? Number.POSITIVE_INFINITY : mode === "hard" ? Math.max(6, hardLimit - (stage - 1) * 2) : Math.max(5, expertLimit - (stage - 1));
  const maxMistakes = mode === "normal" ? 5 : mode === "hard" ? Math.max(2, 3 - Math.floor((stage - 1) / 2)) : 1;
  return {
    mode,
    stage,
    tier,
    label: modeLabels[mode],
    description: modeDescriptions[mode],
    maxMistakes,
    maxMoves,
    canUseHint: mode !== "expert",
    choiceRounds: mode === "normal" ? 1 : mode === "hard" ? 2 : 3,
    studyDurationMs: mode === "normal" ? 3000 - (stage - 1) * 200 : mode === "hard" ? 2200 - (stage - 1) * 150 : 1600 - (stage - 1) * 100,
  };
}

export function getSavedChallengeMode(gameId: string): ChallengeMode {
  try {
    const value = localStorage.getItem(`gridverse-difficulty-${gameId}`);
    return value === "hard" || value === "expert" ? value : "normal";
  } catch {
    return "normal";
  }
}

export function saveChallengeMode(gameId: string, mode: ChallengeMode) {
  try { localStorage.setItem(`gridverse-difficulty-${gameId}`, mode); } catch { /* Settings remain in memory for this run. */ }
}