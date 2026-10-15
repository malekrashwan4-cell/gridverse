import type { GameKind } from "@/data/games";

export type ChoiceDisplay = "sequence" | "tiles" | "matrix" | "palette" | "network" | "board" | "spatial";

export type ChoicePuzzle = {
  id: string;
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
  0, 1, 1, 0,
  1, 0, 0, 1,
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

export const symbols = ["◆", "●", "▲", "✚", "■", "✦"];

export function seededRandom(seed: number) {
  let value = Math.abs(seed) + 0x6d2b79f5;
  return () => {
    value += 0x6d2b79f5;
    let result = Math.imul(value ^ (value >>> 15), 1 | value);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function getGridPuzzle(kind: "number-grid" | "binary-grid", tier: 1 | 2 | 3, stage = 1) {
  const random = seededRandom((kind === "number-grid" ? 41 : 97) + tier * 17 + stage * 31);
  if (kind === "binary-grid") {
    const rows = [
      [0, 1, 0, 1],
      [1, 0, 1, 0],
      [0, 1, 1, 0],
      [1, 0, 0, 1],
    ];
    const rowOrder = [0, 1, 2, 3].sort(() => random() - 0.5);
    const columnOrder = [0, 1, 2, 3].sort(() => random() - 0.5);
    const target = rowOrder.flatMap((row) => columnOrder.map((column) => rows[row][column]));
    const clueCount = tier === 1 ? 9 : tier === 2 ? 7 : 5;
    const givens = Array.from({ length: 16 }, (_, index) => index).sort(() => random() - 0.5).slice(0, clueCount).sort((a, b) => a - b);
    return { target, givens };
  }

  const base = [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [2, 1, 4, 3],
    [4, 3, 2, 1],
  ];
  const symbolsOrder = [1, 2, 3, 4].sort(() => random() - 0.5);
  const target = Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (_, column) => symbolsOrder[base[(row + stage) % 4][column] - 1]));
  const clueCount = tier === 1 ? 10 : tier === 2 ? 8 : 6;
  const givens = Array.from({ length: 16 }, (_, index) => index).sort(() => random() - 0.5).slice(0, clueCount).sort((a, b) => a - b);
  return { target, givens };
}

export function isValidNumberGrid(cells: Array<number | boolean | null>) {
  if (cells.length !== 16 || cells.some((cell) => typeof cell !== "number" || cell < 1 || cell > 4)) return false;
  for (let line = 0; line < 4; line += 1) {
    const row = cells.slice(line * 4, line * 4 + 4);
    const column = [cells[line], cells[line + 4], cells[line + 8], cells[line + 12]];
    if (new Set(row as number[]).size !== 4 || new Set(column as number[]).size !== 4) return false;
  }
  return true;
}

export function isValidBinaryGrid(cells: Array<number | boolean | null>) {
  if (cells.length !== 16 || cells.some((cell) => cell !== 0 && cell !== 1)) return false;
  const lines: number[][] = [];
  for (let line = 0; line < 4; line += 1) lines.push(cells.slice(line * 4, line * 4 + 4) as number[], [cells[line], cells[line + 4], cells[line + 8], cells[line + 12]] as number[]);
  if (lines.some((line) => line.filter(Boolean).length !== 2 || line.some((value, index) => index < 2 && value === line[index + 1] && value === line[index + 2]))) return false;
  return new Set(lines.slice(0, 4).map((line) => line.join(""))).size === 4 && new Set(lines.slice(4).map((line) => line.join(""))).size === 4;
}

export function getLineClues(values: boolean[]) {
  const clues: number[] = [];
  let run = 0;
  values.forEach((value) => {
    if (value) run += 1;
    else if (run) { clues.push(run); run = 0; }
  });
  if (run) clues.push(run);
  return clues.length ? clues : [0];
}

export function getNonogramClues(target: boolean[]) {
  const rows = Array.from({ length: 4 }, (_, row) => getLineClues(target.slice(row * 4, row * 4 + 4)));
  const columns = Array.from({ length: 4 }, (_, column) => getLineClues([target[column], target[column + 4], target[column + 8], target[column + 12]]));
  return { rows, columns };
}

export function matchesNonogramClues(cells: Array<number | boolean | null>, clues: ReturnType<typeof getNonogramClues>) {
  if (cells.length !== 16 || cells.some((cell) => cell === null)) return false;
  const filled = cells.map(Boolean);
  return clues.rows.every((clue, row) => JSON.stringify(clue) === JSON.stringify(getLineClues(filled.slice(row * 4, row * 4 + 4)))) && clues.columns.every((clue, column) => JSON.stringify(clue) === JSON.stringify(getLineClues([filled[column], filled[column + 4], filled[column + 8], filled[column + 12]])));
}

export function revealSafeCells(start: number, clues: number[], mines: number[], revealed: number[], flags: number[]) {
  if (mines.includes(start) || flags.includes(start)) return revealed;
  const next = new Set(revealed);
  const queue = [start];
  while (queue.length) {
    const current = queue.shift()!;
    if (next.has(current) || mines.includes(current) || flags.includes(current)) continue;
    next.add(current);
    if (clues[current] !== 0) continue;
    const row = Math.floor(current / 4);
    const column = current % 4;
    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
      const nextRow = row + rowOffset;
      const nextColumn = column + columnOffset;
      if (nextRow >= 0 && nextRow < 4 && nextColumn >= 0 && nextColumn < 4) queue.push(nextRow * 4 + nextColumn);
    }
  }
  return [...next].sort((a, b) => a - b);
}

const baseChoicePuzzles: Record<string, ChoicePuzzle> = {
  "pattern-shift": { id: "pattern-shift-a", prompt: "Which frame comes next?", clue: "One new symbol is added to the right on every frame.", visual: ["◆", "◆ ●", "◆ ● ▲", "?"], options: ["◆ ● ▲ ■", "◆ ◆ ● ▲", "● ▲ ■", "◆ ▲ ● ■"], answer: 0, display: "sequence" },
  "odd-one-out": { id: "odd-one-out-a", prompt: "Which tile breaks the visual rule?", clue: "Three tiles rotate their highlight clockwise; one turns against it.", visual: ["◒", "◒", "◓", "◒"], options: ["Tile 1", "Tile 2", "Tile 3", "Tile 4"], answer: 2, display: "tiles" },
  "matrix-mystery": { id: "matrix-mystery-a", prompt: "Choose the missing cell in the relationship matrix.", clue: "The bottom row combines the shape from above with the color on the left.", visual: ["◆", "●", "▲", "?"], options: ["▲ + ●", "◆ + ▲", "● + ◆", "◆ + ●"], answer: 1, display: "matrix" },
  "color-logic": { id: "color-logic-a", prompt: "Which palette satisfies every clue?", clue: "Coral is first, indigo must touch mint, and gold cannot touch coral.", visual: ["indigo", "coral", "mint", "gold"], options: ["Indigo · Coral · Gold · Mint", "Coral · Indigo · Mint · Gold", "Gold · Coral · Indigo · Mint", "Indigo · Gold · Coral · Mint"], answer: 1, display: "palette" },
  "sequence-detective": { id: "sequence-detective-a", prompt: "What symbol completes the sequence?", clue: "The arrow rotates 90 degrees clockwise each step.", visual: ["↑", "→", "↓", "?"], options: ["↗", "←", "↙", "↑"], answer: 1, display: "sequence" },
  "region-rules": { id: "region-rules-a", prompt: "Choose the valid region split.", clue: "Every region must be connected and contain exactly one star.", visual: ["2 · ★ | 2 · ★", "3 · ★ | 1 · ★", "2 · ★ | 2 · ★", "1 · ★ | 3 · ★"], options: ["Vertical split", "Corner split", "Zig-zag split", "Horizontal split"], answer: 2, display: "board" },
  "rule-breaker": { id: "rule-breaker-a", prompt: "Which arrangement follows the hidden rule?", clue: "No two matching symbols may touch, even diagonally.", visual: ["◆ ● ▲", "◆ ◆ ▲", "● ▲ ●", "▲ ▲ ◆"], options: ["Arrangement A", "Arrangement B", "Arrangement C", "Arrangement D"], answer: 0, display: "tiles" },
  "mystery-network": { id: "mystery-network-a", prompt: "Which node completes every connection?", clue: "The missing node must connect to two blue nodes and one gold node.", visual: ["A — B", "B — C", "C — ?", "? — A"], options: ["Node A", "Node B", "Node C", "Node D"], answer: 1, display: "network" },
  "one-move": { id: "one-move-a", prompt: "Make exactly one strategic move to solve it.", clue: "Move the corner token into the only open lane.", visual: ["● · ·", "· ◆ ·", "· · ○"], options: ["Move left", "Move up", "Move down", "Move right"], answer: 2, display: "board" },
  "constraint-master": { id: "constraint-master-a", prompt: "Which option satisfies every constraint?", clue: "Blue is first, triangle is not last, and circle sits beside the star.", visual: ["● · ▲ · ★", "■ · ★ · ●", "★ · ● · ▲", "■ · ▲ · ●"], options: ["Option A", "Option B", "Option C", "Option D"], answer: 3, display: "board" },
};

export function getChoicePuzzle(kind: GameKind, stage = 1): ChoicePuzzle {
  if (kind === "daily-mystery") {
    const date = new Date();
    const seed = date.getUTCFullYear() * 372 + date.getUTCMonth() * 31 + date.getUTCDate();
    const options = ["Mira", "Jo", "Ren", "Sol"];
    const answer = seed % options.length;
    return { id: `daily-${date.toISOString().slice(0, 10)}`, prompt: "Which suspect has the complete alibi?", clue: "The correct timeline is gallery → cafe → observatory, with no overlap.", visual: ["Gallery · 08:10", "Cafe · 08:25", "Observatory · 08:40", "Archive · 08:55"], options: options.map((name, index) => `${name} · timeline ${index + 1}`), answer, display: "network" };
  }
  const puzzle = baseChoicePuzzles[kind] ?? baseChoicePuzzles["rule-breaker"];
  if (stage % 2 === 1 || kind !== "sequence-detective") return puzzle;
  return { ...puzzle, id: `${puzzle.id}-stage-${stage}`, clue: `${puzzle.clue} Stage ${stage} changes the order of the visual attributes.` };
}

export function isAdjacent(a: number, b: number, width = 4) {
  return Math.abs(a - b) === 1 && Math.floor(a / width) === Math.floor(b / width) || Math.abs(a - b) === width;
}


export function getSymbolLayout(stage: 1 | 2 | 3) {
  const positions = stage === 1 ? symbolTarget : stage === 2 ? [1, 4, 10, 15, 6] : [0, 5, 7, 10, 12, 15];
  return positions.reduce<Record<number, number>>((layout, position, index) => { layout[position] = (index + stage) % symbols.length; return layout; }, {});
}

export const choicePuzzles = baseChoicePuzzles;
EOF