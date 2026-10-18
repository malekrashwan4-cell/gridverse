// Pure puzzle rules: no rendering, timers, audio, or persistence.
export type PictureCells = Array<number | boolean | null>;
export type PendingTap = { index: number; at: number } | null;
export type PictureClues = { rows: number[][]; columns: number[][] };
export type PicturePuzzle = { size: number; target: boolean[]; clues: PictureClues };
export type OddItem = { id: number; sides: number; marks: number; rotation: number; value: string; valid: boolean };
export type OddPuzzle = { items: OddItem[]; answer: number; rule: string; hint: string; family: number; level: number };
export type MatrixPuzzle = { cells: string[]; options: string[]; answer: number; rule: string; hint: string; level: number; family: number; base: number; missing: number; solution: string };
export type SceneItem = { shape: string; rotation: number; tone: number; small: boolean; value: number };
export type RecallPuzzle = { before: Array<SceneItem | null>; after: Array<SceneItem | null>; changed: number[]; explanations: string[]; studyMs: number; level: number };

export const TAP_INTERVAL_MS = 350;
export const puzzleLevels = [
  { size: 4, objects: 5, changes: 1, studyMs: 5000, choices: 4, rules: 1 },
  { size: 5, objects: 8, changes: 2, studyMs: 4500, choices: 4, rules: 2 },
  { size: 6, objects: 11, changes: 3, studyMs: 4000, choices: 6, rules: 3 },
  { size: 7, objects: 14, changes: 4, studyMs: 3500, choices: 6, rules: 4 },
];
export function randomFor(seed: number) {
  let value = (seed + 1) >>> 0;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
}
export function shuffle<T>(values: T[], random: () => number): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function lineRuns(values: boolean[]): number[] {
  const result = []; let run = 0;
  for (const value of values) { if (value) run++; else if (run) { result.push(run); run = 0; } }
  if (run) result.push(run);
  return result.length ? result : [0];
}
export function pictureClues(target: boolean[], size: number): PictureClues {
  return {
    rows: Array.from({ length: size }, (_, r) => lineRuns(target.slice(r * size, (r + 1) * size))),
    columns: Array.from({ length: size }, (_, c) => lineRuns(Array.from({ length: size }, (_, r) => target[r * size + c]))),
  };
}
export function exactPicture(cells: PictureCells, target: boolean[]): boolean {
  return cells.length === target.length && cells.every((cell, index) => typeof cell === 'boolean' && cell === target[index]);
}
export function countPictureSolutions(clues: PictureClues, size: number, limit = 2): number {
  const candidates = clues.rows.map(clue => Array.from({ length: 2 ** size }, (_, mask) => Array.from({ length: size }, (_, c) => Boolean(mask & (1 << c)))).filter(row => JSON.stringify(lineRuns(row)) === JSON.stringify(clue)));
  const rows: boolean[][] = []; let solutions = 0;
  function visit(depth: number) {
    if (solutions >= limit) return;
    if (depth === size) { if (clues.columns.every((clue, c) => JSON.stringify(lineRuns(rows.map(row => row[c]))) === JSON.stringify(clue))) solutions++; return; }
    for (const row of candidates[depth]) {
      rows.push(row);
      const possible = clues.columns.every((clue, c) => {
        const prefix = rows.map(r => r[c]);
        const runs = lineRuns(prefix); const nonzero = runs[0] === 0 ? [] : runs;
        if (clue[0] === 0) return !prefix.some(Boolean);
        if (nonzero.length > clue.length) return false;
        return nonzero.every((run, i) => run <= clue[i] && (i === nonzero.length - 1 && prefix[prefix.length - 1] || run === clue[i]));
      });
      if (possible) visit(depth + 1);
      rows.pop();
      if (solutions >= limit) break;
    }
  }
  visit(0); return solutions;
}
export function createPicture(level: number, seed: number): PicturePuzzle {
  const size = puzzleLevels[level - 1].size; const random = randomFor(seed * 37 + level);
  for (let attempt = 0; attempt < 150; attempt++) {
    const target = Array.from({ length: size * size }, () => random() < 0.58);
    const clues = pictureClues(target, size);
    if (target.some(Boolean) && target.some(value => !value) && countPictureSolutions(clues, size) === 1) return { size, target, clues };
  }
  const target = Array.from({ length: size * size }, (_, i) => i % size <= Math.floor(i / size));
  return { size, target, clues: pictureClues(target, size) };
}
export function pictureTap(cells: PictureCells, pending: PendingTap, index: number, now: number, interval = TAP_INTERVAL_MS): { cells: PictureCells; pending: PendingTap } {
  const filled = pending !== null && pending.index === index && now - pending.at <= interval;
  const next = [...cells]; next[index] = filled;
  return { cells: next, pending: filled ? null : { index, at: now } };
}
export function createOddPuzzle(level: number, seed: number): OddPuzzle {
  const random = randomFor(seed * 71 + level); const count = puzzleLevels[level - 1].choices;
  const family = seed % 3;
  const items = Array.from({ length: count }, (_, i) => {
    const base = 2 + Math.floor(random() * 3) + i * 3;
    const sides = 3 + i;
    if (family === 0) return { id: i, sides, marks: sides + (level >= 2 ? 1 : 0), rotation: level >= 3 ? (sides % 4) * 90 : 0, value: '', valid: true };
    if (family === 1) { const marks = level >= 3 ? sides - 2 : 1; return { id: i, sides, marks, rotation: level === 1 ? 0 : ((sides + (level === 4 ? marks : 0)) % 4) * 90, value: '', valid: true }; }
    const n = level === 1 ? base * 2 : level === 2 ? base * base : level === 3 ? base * (base + 1) : base * base + base + 1;
    return { id: i, sides: 0, marks: 0, rotation: 0, value: `${base} → ${n}`, valid: true };
  });
  const odd = Math.floor(random() * count);
  items[odd] = { ...items[odd], valid: false };
  if (family === 0) items[odd].marks++;
  if (family === 1) items[odd].rotation = (items[odd].rotation + 90) % 360;
  if (family === 2) { const parts = items[odd].value.split(' → '); items[odd].value = `${parts[0]} → ${Number(parts[1]) + 2}`; }
  // Expert links a second property to the first; all regular items obey both.
  if (level === 4 && family === 0) items.forEach(item => { if (item.valid) item.rotation = (item.marks % 4) * 90; });
  const directionRule = '0 up, 1 right, 2 down, 3 left';
  const rule = family === 0 ? `The interior mark count equals the number of sides${level >= 2 ? ' plus one' : ''}${level >= 3 ? `; direction matches ${level === 4 ? 'the mark count' : 'the side count'} modulo four (${directionRule})` : ''}.` : family === 1 ? level === 1 ? 'All regular tiles point up.' : `Direction matches ${level === 4 ? 'sides plus marks' : 'the side count'} modulo four (${directionRule})${level >= 3 ? '; marks equal sides minus two' : ''}.` : level === 1 ? 'The output is twice the input.' : level === 2 ? 'The output is the square of the input.' : level === 3 ? 'The output is the input multiplied by the next integer.' : 'The output is input squared, plus the input, plus one.';
  const hint = family === 0 ? 'Compare the outside geometry with the number of interior marks.' : family === 1 ? 'Compare the side count with the arrow direction, rather than the shape size.' : 'Look for one consistent transformation from input to output.';
  const shuffled = shuffle(items, random);
  const puzzle = { items: shuffled, answer: shuffled.findIndex(item => !item.valid), rule, hint, family, level };
  if (!validateOddPuzzle(puzzle)) throw new Error('Invalid observation puzzle');
  return puzzle;
}
export function oddItemFits(item: OddItem, puzzle: OddPuzzle): boolean {
  if (puzzle.family === 0) return item.marks === item.sides + (puzzle.level >= 2 ? 1 : 0) && (puzzle.level < 3 || item.rotation === ((puzzle.level === 4 ? item.marks : item.sides) % 4) * 90);
  if (puzzle.family === 1) return (puzzle.level < 3 || item.marks === item.sides - 2) && item.rotation === (puzzle.level === 1 ? 0 : ((item.sides + (puzzle.level === 4 ? item.marks : 0)) % 4) * 90);
  const [base, value] = item.value.split(' → ').map(Number);
  return value === (puzzle.level === 1 ? base * 2 : puzzle.level === 2 ? base * base : puzzle.level === 3 ? base * (base + 1) : base * base + base + 1);
}
export function validateOddPuzzle(puzzle: OddPuzzle): boolean {
  const failures = puzzle.items.map((item, i) => oddItemFits(item, puzzle) ? -1 : i).filter(i => i >= 0);
  return failures.length === 1 && failures[0] === puzzle.answer && new Set(puzzle.items.map(item => JSON.stringify([item.sides, item.marks, item.rotation, item.value]))).size === puzzle.items.length;
}
export function matrixValue(level: number, family: number, row: number, col: number, base: number): string {
  const arrows = ['↑', '→', '↓', '←'];
  if (family === 0) {
    const n = level === 1 ? base + row * 3 + col : level === 2 ? (base + row) * (col + 1) : level === 3 ? (base + row) ** 2 + col * (row + 1) : (base + row) * (col + 1) ** 2 + row;
    return String(n);
  }
  if (family === 1) return `${arrows[(row + col * (level >= 3 ? 2 : 1)) % 4]}${level >= 2 ? ` ${1 + row + col}` : ''}${level === 4 ? ` ${['○', '●'][(row + col) % 2]}` : ''}`;
  const shape = ['▲', '■', '⬟'][row];
  const count = level === 1 ? col + 1 : level === 2 ? (row + 1) * (col + 1) : (row + 1) * (col + 1) + (level === 4 ? col * col : col);
  return `${shape} × ${count}`;
}
export function createMatrixPuzzle(level: number, seed: number): MatrixPuzzle {
  const random = randomFor(seed * 97 + level); const family = seed % 3; const base = 2 + Math.floor(random() * 5);
  const missing = 8;
  const solution = matrixValue(level, family, 2, 2, base);
  const cells = Array.from({ length: 9 }, (_, i) => i === missing ? '?' : matrixValue(level, family, Math.floor(i / 3), i % 3, base));
  const candidates = family === 0 ? [solution, String(Number(solution) - 1), String(Number(solution) + 1), String(Number(solution) + base)] : family === 1 ? [solution, solution.replace(/[↑→↓←]/, ['→', '↓', '←', '↑'][['↑', '→', '↓', '←'].indexOf(solution[0])]), solution.replace(/[↑→↓←]/, ['↓', '←', '↑', '→'][['↑', '→', '↓', '←'].indexOf(solution[0])]), level >= 2 ? solution.replace(/\d+/, String(Number(solution.match(/\d+/)[0]) - 1)) : '↗'] : [solution, solution.replace(/\d+/, String(Number(solution.match(/\d+/)[0]) - 1)), solution.replace(/\d+/, String(Number(solution.match(/\d+/)[0]) + 1)), solution.replace('⬟', '■')];
  const options = shuffle([...new Set(candidates)], random);
  const rules = family === 0 ? ['Across a row add one; down a column add three.', 'Each row is its first value multiplied by 1, 2, then 3.', 'Each row starts at a successive square; its step increases by one down the rows.', 'For row index r (starting at zero): (base + r) × (column index + 1)² + r. Compare each row’s first value and its increasing differences.'] : family === 1 ? ['The arrow turns 90° clockwise across rows and down columns.', 'The arrow turns 90° clockwise; the count increases by one across rows and down columns.', 'Across each row turn 180°, down each column turn 90°; counts rise by one in both directions.', 'Across turn 180°, down turn 90°; counts rise by one, and fill alternates like a checkerboard.'] : ['Counts increase 1, 2, 3 across each row; each row keeps its shape.', 'Counts multiply the row number by the column number (both start at one).', 'Multiply row and column numbers, then add the zero-based column index.', 'Multiply row and column numbers, then add the square of the zero-based column index.'];
  const puzzle = { cells, options, answer: options.indexOf(solution), rule: rules[level - 1], hint: family === 0 ? 'Compare the differences across the first two rows.' : family === 1 ? 'Track direction separately from count and fill.' : 'Track object counts separately from the shape.', level, family, base, missing, solution };
  if (!validateMatrixPuzzle(puzzle)) throw new Error('Invalid matrix puzzle');
  return puzzle;
}
export function validateMatrixPuzzle(puzzle: MatrixPuzzle): boolean {
  return puzzle.options.length === 4 && new Set(puzzle.options).size === 4 && puzzle.options[puzzle.answer] === matrixValue(puzzle.level, puzzle.family, 2, 2, puzzle.base) && puzzle.cells.every((cell, i) => i === puzzle.missing ? cell === '?' : cell === matrixValue(puzzle.level, puzzle.family, Math.floor(i / 3), i % 3, puzzle.base));
}
export function sceneDifferences(before: Array<SceneItem | null>, after: Array<SceneItem | null>): number[] {
  return before.map((item, i) => JSON.stringify(item) !== JSON.stringify(after[i]) ? i : -1).filter(i => i >= 0);
}
export function createRecallPuzzle(level: number, seed: number): RecallPuzzle {
  const random = randomFor(seed * 131 + level); const config = puzzleLevels[level - 1];
  const positions = shuffle(Array.from({ length: 16 }, (_, i) => i), random);
  const before: Array<SceneItem | null> = Array(16).fill(null);
  const shapes = ['◆', '●', '▲', '■'];
  positions.slice(0, config.objects).forEach((position, i) => { before[position] = { shape: shapes[level >= 3 ? i % 2 : i % 4], rotation: level >= 2 ? (i % 4) * 90 : 0, tone: i % 3, small: false, value: level === 4 ? 1 + i % 5 : 0 }; });
  const after = before.map(item => item === null ? null : { ...item });
  const kind = seed % 6;
  const first = positions[0];
  if (kind === 0) after[first] = null;
  if (kind === 1) after[positions[config.objects]] = { shape: '▲', rotation: 0, tone: 1, small: false, value: 0 };
  if (kind === 2 && config.changes >= 2) { after[positions[config.objects]] = after[first]; after[first] = null; }
  if (kind === 3) after[first].tone = (after[first].tone + 1) % 3;
  if (kind === 4) after[first].rotation = (after[first].rotation + 90) % 360;
  if (kind === 5) after[first].small = true;
  if (kind === 2 && config.changes === 1) after[first].value++;
  let differences = sceneDifferences(before, after);
  for (const position of positions.slice(1, config.objects)) {
    if (differences.length >= config.changes) break;
    if (!differences.includes(position)) { after[position].value++; differences = sceneDifferences(before, after); }
  }
  const changed = sceneDifferences(before, after);
  const explanations = changed.map(i => {
    const a = before[i], b = after[i];
    const property = a === null ? 'an object appeared' : b === null ? 'an object disappeared / moved away' : a.shape !== b.shape ? 'the shape changed' : a.tone !== b.tone ? 'the color and texture changed' : a.rotation !== b.rotation ? 'the direction marker rotated' : a.small !== b.small ? 'the size changed' : 'the number changed';
    return `Cell ${i + 1}: ${property}.`;
  });
  const puzzle = { before, after, changed, explanations, studyMs: config.studyMs, level };
  if (!validateRecallPuzzle(puzzle)) throw new Error('Invalid recall puzzle');
  return puzzle;
}
export function validateRecallPuzzle(puzzle: RecallPuzzle): boolean {
  return puzzle.before.length === 16 && puzzle.after.length === 16 && JSON.stringify(sceneDifferences(puzzle.before, puzzle.after)) === JSON.stringify(puzzle.changed) && puzzle.changed.length === puzzleLevels[puzzle.level - 1].changes;
}
export function exactRecall(selected: number[], changed: number[]): boolean {
  return new Set(selected).size === selected.length && selected.length === changed.length && selected.every(i => changed.includes(i));
}
export function advanceStudy(remaining: number, delta: number, paused: boolean): number { return paused ? remaining : Math.max(0, remaining - delta); }
export function createTimeline(level: number, seed: number) {
  const count = 3 + level; const random = randomFor(seed);
  const events = Array.from({ length: count }, (_, i) => {
    const utc = (level >= 3 ? 11 : 8) * 60 + i * (level >= 3 ? 37 : 30);
    const offset = level === 4 ? [0, 60, -60][i % 3] : 0;
    const local = utc + offset;
    const hour = Math.floor(local / 60), minute = String(local % 60).padStart(2, '0');
    const time = level >= 3 ? `${hour % 12 || 12}:${minute} ${hour < 12 ? 'AM' : 'PM'}` : `${String(hour).padStart(2, '0')}:${minute}`;
    return { id: i, utc, label: `${['Gallery', 'Cafe', 'Observatory', 'Archive', 'Garden', 'Studio', 'Library'][i]} · ${time}${level === 4 ? ` UTC${offset >= 0 ? '+' : ''}${offset / 60}` : ''}` };
  });
  const items = shuffle(events, random);
  if (items.every((item, i) => item.id === i)) [items[0], items[1]] = [items[1], items[0]];
  return { items: items.map(item => item.label), answer: events.map(event => items.findIndex(item => item.id === event.id)), rule: level === 4 ? 'Convert each local time to UTC by subtracting its UTC offset, then order the stops earliest to latest.' : 'Order the witness stops by their displayed time, earliest to latest.' };
}
