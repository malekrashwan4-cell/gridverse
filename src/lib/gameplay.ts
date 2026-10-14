import type { GameKind } from "@/data/games";

export type ChoiceDisplay = "sequence" | "tiles" | "matrix" | "palette" | "network" | "board" | "spatial";

export type ChoicePuzzle = {
  prompt: string;
  clue: string;
  options: string[];
  answer: number;
  display: ChoiceDisplay;
  visual: string[];
};

export const numberTarget = [
  1, 2, 3, 4,
  3, 4, 1, 2,
  2, 1, 4, 3,
  4, 3, 2, 1,
];

export const binaryTarget = [
  0, 1, 0, 1,
  1, 0, 1, 0,
  1, 0, 1, 0,
  0, 1, 0, 1,
];

export const nonogramTarget = [
  true, true, false, false,
  false, true, false, false,
  false, true, true, true,
  false, false, true, true,
];

export const mirrorTarget = [
  false, true, false, false,
  true, true, false, false,
  false, false, true, false,
  false, false, false, false,
];

export const hiddenPatternTarget = [
  false, true, true, false,
  true, false, false, true,
  false, false, true, true,
  false, false, false, false,
];

export const mineLocations = [2, 7, 11, 14];
export const pathSolution = [0, 1, 2, 3, 7, 11, 15];
export const flashTarget = [1, 5, 8, 12];
export const symbolTarget = [2, 6, 9, 14];
export const sequenceTarget = [1, 4, 7, 3];

export const choicePuzzles: Record<string, ChoicePuzzle> = {
  "pattern-shift": {
    prompt: "Which frame comes next?",
    clue: "One new symbol is added to the right on every frame.",
    visual: ["◆", "◆ ●", "◆ ● ▲", "?"],
    options: ["◆ ● ▲ ■", "◆ ◆ ● ▲", "● ▲ ■", "◆ ▲ ● ■"],
    answer: 0,
    display: "sequence",
  },
  "odd-one-out": {
    prompt: "Which tile breaks the visual rule?",
    clue: "Three tiles have a clockwise highlight; one turns against it.",
    visual: ["◒", "◒", "◓", "◒"],
    options: ["Tile 1", "Tile 2", "Tile 3", "Tile 4"],
    answer: 2,
    display: "tiles",
  },
  "matrix-mystery": {
    prompt: "Choose the missing cell in the relationship matrix.",
    clue: "The bottom row combines the shape from above with the color on the left.",
    visual: ["◆", "●", "▲", "?"],
    options: ["▲ + ●", "◆ + ▲", "● + ◆", "◆ + ●"],
    answer: 1,
    display: "matrix",
  },
  "color-logic": {
    prompt: "Which palette satisfies every clue?",
    clue: "Coral is first, indigo must touch mint, and gold cannot touch coral.",
    visual: ["indigo", "coral", "mint", "gold"],
    options: ["Indigo · Coral · Gold · Mint", "Coral · Indigo · Mint · Gold", "Gold · Coral · Indigo · Mint", "Indigo · Gold · Coral · Mint"],
    answer: 1,
    display: "palette",
  },
  "sequence-detective": {
    prompt: "What symbol completes the sequence?",
    clue: "The arrow rotates 90 degrees clockwise each step.",
    visual: ["↑", "→", "↓", "?"],
    options: ["↗", "←", "↙", "↑"],
    answer: 1,
    display: "sequence",
  },
  "rotation-puzzle": {
    prompt: "Which silhouette matches after a quarter turn?",
    clue: "Rotate the L-shaped silhouette clockwise, without flipping it.",
    visual: ["└", "?", "┘", "┌"],
    options: ["┌", "┘", "┐", "└"],
    answer: 0,
    display: "spatial",
  },
  "cube-explorer": {
    prompt: "Which face is opposite the blue face?",
    clue: "Opposite faces never share an edge in the three shown views.",
    visual: ["blue · 1 · 2", "blue · 2 · 3", "blue · 3 · 4"],
    options: ["Face 1", "Face 2", "Face 3", "Face 4"],
    answer: 3,
    display: "spatial",
  },
  "shadow-match": {
    prompt: "Match the object to its shadow.",
    clue: "The light comes from the upper-left, so the shadow extends down-right.",
    visual: ["◆", "◈", "◇", "▰"],
    options: ["Shadow A · sharp diamond", "Shadow B · split diamond", "Shadow C · open diamond", "Shadow D · rectangle"],
    answer: 2,
    display: "spatial",
  },
  "shape-packing": {
    prompt: "Which placement fills the target with no overlap?",
    clue: "The long piece must form the bottom edge; the triangle nests in the open corner.",
    visual: ["▰ + ▲", "▲ + ◆", "◆ + ◆", "▰ + ◇"],
    options: ["Placement A", "Placement B", "Placement C", "Placement D"],
    answer: 0,
    display: "spatial",
  },
  "region-rules": {
    prompt: "Choose the valid region split.",
    clue: "Each region contains exactly one star and its size matches the number shown.",
    visual: ["2 · ★ | 2 · ★", "3 · ★ | 1 · ★", "2 · ★ | 2 · ★", "1 · ★ | 3 · ★"],
    options: ["Vertical split", "Corner split", "Zig-zag split", "Horizontal split"],
    answer: 2,
    display: "board",
  },
  "perfect-placement": {
    prompt: "Which piece belongs in the final slot?",
    clue: "Every row and column needs one circle, triangle, square, and diamond.",
    visual: ["◆", "●", "▲", "■"],
    options: ["Circle", "Triangle", "Square", "Diamond"],
    answer: 3,
    display: "board",
  },
  "rule-breaker": {
    prompt: "Which arrangement follows the hidden rule?",
    clue: "No two matching symbols may touch, even diagonally.",
    visual: ["◆ ● ▲", "◆ ◆ ▲", "● ▲ ●", "▲ ▲ ◆"],
    options: ["Arrangement A", "Arrangement B", "Arrangement C", "Arrangement D"],
    answer: 0,
    display: "tiles",
  },
  "mystery-network": {
    prompt: "Which node completes every connection?",
    clue: "The missing node must connect to two blue nodes and one gold node.",
    visual: ["A — B", "B — C", "C — ?", "? — A"],
    options: ["Node A", "Node B", "Node C", "Node D"],
    answer: 1,
    display: "network",
  },
  "one-move": {
    prompt: "Make exactly one strategic move to solve it.",
    clue: "Move the corner token into the only open lane; do not move the center token.",
    visual: ["● · ·", "· ◆ ·", "· · ○"],
    options: ["Move left", "Move up", "Move down", "Move right"],
    answer: 2,
    display: "board",
  },
  "constraint-master": {
    prompt: "Which option satisfies every constraint?",
    clue: "Blue is first, triangle is not last, and the circle sits beside the star.",
    visual: ["● · ▲ · ★", "■ · ★ · ●", "★ · ● · ▲", "■ · ▲ · ●"],
    options: ["Option A", "Option B", "Option C", "Option D"],
    answer: 3,
    display: "board",
  },
  "daily-mystery": {
    prompt: "Which suspect has the complete alibi?",
    clue: "The correct timeline is gallery → cafe → observatory, with no overlap.",
    visual: ["Mira · 08:10", "Jo · 08:25", "Ren · 08:40", "Sol · 08:55"],
    options: ["Mira", "Jo", "Ren", "Sol"],
    answer: 1,
    display: "network",
  },
};

export function getChoicePuzzle(kind: GameKind): ChoicePuzzle {
  return choicePuzzles[kind] ?? choicePuzzles["daily-mystery"];
}

export function isAdjacent(a: number, b: number, width = 4) {
  return Math.abs(a - b) === 1 && Math.floor(a / width) === Math.floor(b / width) || Math.abs(a - b) === width;
}
