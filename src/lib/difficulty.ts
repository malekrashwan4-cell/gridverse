import type { GameKind } from "@/data/games";

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
};

const modeLabels: Record<ChallengeMode, string> = {
  normal: "Normal",
  hard: "Hard",
  expert: "Expert",
};

const modeDescriptions: Record<ChallengeMode, string> = {
  normal: "Learn the rule with generous recovery room.",
  hard: "Fewer recoveries, leaner clues, and tighter execution.",
  expert: "A mastery run: one mistake and efficient decisions matter.",
};

const moveLimits: Record<string, [number, number]> = {
  grid: [74, 58],
  memory: [34, 27],
  path: [18, 14],
  switchboard: [15, 11],
  choice: [8, 6],
};

function getMoveFamily(kind: GameKind) {
  if (["number-grid", "binary-grid", "nonogram"].includes(kind)) return "grid";
  if (["flash-grid", "symbol-recall", "change-detector", "sequence-memory", "hidden-pattern"].includes(kind)) return "memory";
  if (kind === "pathfinder") return "path";
  if (kind === "switchboard") return "switchboard";
  return "choice";
}

export function getChallengeConfig(kind: GameKind, mode: ChallengeMode, attemptNumber: number): ChallengeConfig {
  const stage = Math.min(3, Math.max(1, attemptNumber)) as 1 | 2 | 3;
  const baseTier = mode === "normal" ? 0 : mode === "hard" ? 1 : 2;
  const tier = Math.min(3, Math.max(1, baseTier + (stage > 1 ? 1 : 0))) as 1 | 2 | 3;
  const family = getMoveFamily(kind);
  const [hardLimit, expertLimit] = moveLimits[family];
  const maxMoves = mode === "normal" ? Number.POSITIVE_INFINITY : mode === "hard" ? hardLimit - Math.max(0, stage - 2) * 4 : expertLimit - Math.max(0, stage - 2) * 2;
  const maxMistakes = mode === "normal" ? Number.POSITIVE_INFINITY : mode === "hard" ? Math.max(2, 3 - Math.floor((stage - 1) / 2)) : 1;

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
  };
}

export function getSavedChallengeMode(gameId: string): ChallengeMode {
  const value = localStorage.getItem(`gridverse-difficulty-${gameId}`);
  return value === "hard" || value === "expert" ? value : "normal";
}

export function saveChallengeMode(gameId: string, mode: ChallengeMode) {
  localStorage.setItem(`gridverse-difficulty-${gameId}`, mode);
}
