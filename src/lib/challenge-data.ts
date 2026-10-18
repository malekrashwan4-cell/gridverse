import type { GameKind } from "@/data/games";
import type { ChallengeConfig } from "@/lib/difficulty";
import { binaryTarget, getGridPuzzle, mirrorTarget, numberTarget, pathSolution } from "@/lib/gameplay";
import { createPicture, randomFor, shuffle } from "@/lib/puzzle-engine";

export function getGivenIndices(kind: GameKind, challenge: ChallengeConfig) {
  return getGridPuzzle(kind === "binary-grid" ? "binary-grid" : "number-grid", challenge.level, challenge.seed).givens;
}
export function getMineTargets(challenge: ChallengeConfig) {
  return shuffle(Array.from({ length: 15 }, (_, i) => i + 1), randomFor(challenge.seed * 59)).slice(0, challenge.level + 3);
}
export function getMineClues(challenge: ChallengeConfig) {
  const mines = new Set(getMineTargets(challenge));
  return Array.from({ length: 16 }, (_, index) => {
    let count = 0;
    for (let r = -1; r <= 1; r++) for (let c = -1; c <= 1; c++) {
      if (!r && !c) continue;
      const row = Math.floor(index / 4) + r, column = index % 4 + c;
      if (row >= 0 && row < 4 && column >= 0 && column < 4 && mines.has(row * 4 + column)) count++;
    }
    return count;
  });
}
export function getMemoryTarget(kind: GameKind, challenge: ChallengeConfig): number[] {
  const count = (kind === "hidden-pattern" ? 6 : 4) + (challenge.level - 1) * 2;
  return shuffle(Array.from({ length: 16 }, (_, i) => i), randomFor(challenge.seed * 43)).slice(0, count);
}
export function getSequenceTarget(challenge: ChallengeConfig) {
  return shuffle(Array.from({ length: 8 }, (_, i) => i), randomFor(challenge.seed * 61)).slice(0, challenge.level + 3);
}
export function getSceneTargets(challenge: ChallengeConfig) {
  const changed = [2, 6, 9, 10].slice(0, challenge.level);
  const before = [1, 5, 13];
  return { before, after: [...before, ...changed], changed };
}
export function getMirrorTarget(challenge: ChallengeConfig) {
  const count = 4 + (challenge.level - 1) * 2;
  const indices = shuffle(Array.from({ length: 16 }, (_, i) => i), randomFor(challenge.seed * 47)).slice(0, count);
  return mirrorTarget.map((_, i) => indices.includes(i));
}
export function getPathWaypoints(challenge: ChallengeConfig) {
  return [[], [9], [5, 12], [3, 8, 14]][challenge.level - 1];
}
export function getPathTarget(challenge: ChallengeConfig) {
  return challenge.level === 1 ? pathSolution : challenge.level === 2 ? [0, 1, 5, 9, 13, 14, 15] : challenge.level === 3 ? [0, 1, 5, 9, 8, 12, 13, 14, 15] : [0, 1, 2, 3, 7, 11, 10, 9, 5, 4, 8, 12, 13, 14, 15];
}
export function getPathObstacles(challenge: ChallengeConfig) {
  return challenge.level === 1 ? [5, 6, 10] : challenge.level === 2 ? [6, 10] : [6];
}
export function toggleSwitch(lights: boolean[], index: number) {
  [index, index - 1, index + 1, index - 3, index + 3].forEach(candidate => {
    if (candidate >= 0 && candidate < 9 && !(candidate === index - 1 && index % 3 === 0) && !(candidate === index + 1 && index % 3 === 2)) lights[candidate] = !lights[candidate];
  });
}
export function getSwitchSolution(challenge: ChallengeConfig) {
  return shuffle(Array.from({ length: 9 }, (_, i) => i), randomFor(challenge.seed * 67)).slice(0, [3, 4, 6, 7][challenge.level - 1]);
}
export function getSwitchStart(challenge: ChallengeConfig) {
  const lights = Array(9).fill(true) as boolean[];
  getSwitchSolution(challenge).forEach(index => toggleSwitch(lights, index));
  return lights;
}
export function getBaseTarget(kind: GameKind, challenge?: ChallengeConfig) {
  if (kind === "number-grid") return challenge ? getGridPuzzle("number-grid", challenge.level, challenge.seed).target : numberTarget;
  if (kind === "binary-grid") return challenge ? getGridPuzzle("binary-grid", challenge.level, challenge.seed).target : binaryTarget;
  return binaryTarget;
}
export function getNonogramTarget(challenge: ChallengeConfig) { return createPicture(challenge.level, challenge.seed).target; }
