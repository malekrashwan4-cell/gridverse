import type { GameKind } from "@/data/games";
import type { ChallengeConfig } from "@/lib/difficulty";
import { binaryTarget, flashTarget, getGridPuzzle, hiddenPatternTarget, mirrorTarget, mineLocations, nonogramTarget, numberTarget, pathSolution, sequenceTarget, symbolTarget } from "@/lib/gameplay";

const numberGivens = {
  1: [0, 3, 5, 6, 9, 10, 12, 15],
  2: [0, 3, 5, 9, 10, 15],
  3: [0, 5, 10, 15],
};

const binaryGivens = {
  1: [0, 2, 5, 7, 8, 10, 13, 15],
  2: [0, 2, 5, 8, 10, 15],
  3: [0, 5, 10, 15],
};

export function getGivenIndices(kind: GameKind, challenge: ChallengeConfig) {
  const tier = challenge.tier === 2 || challenge.tier === 3 ? challenge.tier : 1;
  if (kind === "number-grid") return getGridPuzzle("number-grid", tier, challenge.stage).givens;
  if (kind === "binary-grid") return getGridPuzzle("binary-grid", tier, challenge.stage).givens;
  return numberGivens[tier] ?? binaryGivens[tier];
}

export function getMineTargets(challenge: ChallengeConfig) {
  const layouts = {
    1: [[...mineLocations], [1, 6, 10, 13]],
    2: [[1, 2, 6, 7, 11], [1, 5, 6, 10, 14]],
    3: [[1, 2, 6, 7, 10, 14], [1, 4, 6, 9, 11, 14]],
  } as const;
  return [...(layouts[challenge.tier][(challenge.stage - 1) % layouts[challenge.tier].length])];
}

export function getMineClues(challenge: ChallengeConfig) {
  const mines = new Set(getMineTargets(challenge));
  return Array.from({ length: 16 }, (_, index) => {
    const row = Math.floor(index / 4);
    const column = index % 4;
    let count = 0;
    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
      if (rowOffset === 0 && columnOffset === 0) continue;
      const nextRow = row + rowOffset;
      const nextColumn = column + columnOffset;
      if (nextRow >= 0 && nextRow < 4 && nextColumn >= 0 && nextColumn < 4 && mines.has(nextRow * 4 + nextColumn)) count += 1;
    }
    return count;
  });
}

export function getMemoryTarget(kind: GameKind, challenge: ChallengeConfig): number[] {
  const tier = challenge.tier;
  if (kind === "flash-grid") return [...flashTarget, ...(tier >= 2 ? [3, 14] : []), ...(tier >= 3 ? [6, 10] : [])];
  if (kind === "symbol-recall") return [...symbolTarget, ...(tier >= 2 ? [0, 4] : []), ...(tier >= 3 ? [11, 15] : [])];
  const hiddenPatternCells = hiddenPatternTarget.flatMap((value, index) => value ? [index] : []);
  return [...hiddenPatternCells, ...(tier >= 2 ? [5, 14] : []), ...(tier >= 3 ? [3, 12] : [])];
}

export function getSequenceTarget(challenge: ChallengeConfig) {
  return [...sequenceTarget, ...(challenge.tier >= 2 ? [6] : []), ...(challenge.tier >= 3 ? [0] : [])];
}

export function getSceneTargets(challenge: ChallengeConfig) {
  const changed = challenge.tier === 1 ? [9] : challenge.tier === 2 ? [2, 9] : [2, 6, 9];
  const before = [1, 5, 13];
  const after = [...before, ...changed];
  return { before, after, changed };
}

export function getMirrorTarget(challenge: ChallengeConfig) {
  const extra = challenge.tier === 1 ? [] : challenge.tier === 2 ? [6, 9] : [0, 15];
  return mirrorTarget.map((value, index) => value || extra.includes(index));
}

export function getPathTarget(challenge: ChallengeConfig) {
  if (challenge.tier === 1) return pathSolution;
  if (challenge.tier === 2) return [0, 1, 2, 3, 7, 11, 10, 9, 13, 14, 15];
  return [0, 1, 2, 3, 7, 11, 10, 9, 8, 12, 13, 14, 15];
}

export function getPathObstacles(challenge: ChallengeConfig) {
  if (challenge.tier === 1) return [5, 6, 10];
  if (challenge.tier === 2) return [5, 6, 8];
  return [4, 5, 6];
}

function toggleSwitch(lights: boolean[], index: number) {
  [index, index - 1, index + 1, index - 3, index + 3].forEach((candidate) => {
    if (candidate >= 0 && candidate < 9 && !(candidate === index - 1 && index % 3 === 0) && !(candidate === index + 1 && index % 3 === 2)) lights[candidate] = !lights[candidate];
  });
}

export function getSwitchStart(challenge: ChallengeConfig) {
  const solution = challenge.tier === 1 ? [0, 4, 8] : challenge.tier === 2 ? [0, 4, 8, 1, 7] : [0, 4, 8, 1, 7, 3];
  const lights = Array(9).fill(true) as boolean[];
  solution.forEach((index) => toggleSwitch(lights, index));
  return lights;
}

export function getBaseTarget(kind: GameKind, challenge?: ChallengeConfig) {
  if (kind === "number-grid") return challenge ? getGridPuzzle("number-grid", challenge.tier, challenge.stage).target : numberTarget;
  if (kind === "binary-grid") return challenge ? getGridPuzzle("binary-grid", challenge.tier, challenge.stage).target : binaryTarget;
  return binaryTarget;
}

export function getNonogramTarget() {
  return nonogramTarget;
}
EOF