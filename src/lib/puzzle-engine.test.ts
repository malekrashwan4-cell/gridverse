import { describe, expect, it } from 'vitest';
import { advanceStudy, countPictureSolutions, createMatrixPuzzle, createOddPuzzle, createPicture, createRecallPuzzle, createTimeline, exactPicture, exactRecall, pictureClues, pictureTap, sceneDifferences, validateMatrixPuzzle, validateOddPuzzle, validateRecallPuzzle } from './puzzle-engine';
import { getChallengeConfig } from './difficulty';
import { getGridPuzzle, getPatternShiftPuzzle, isValidBinaryGrid, isValidNumberGrid, isValidPath } from './gameplay';
import { getMemoryTarget, getMineTargets, getPathObstacles, getPathTarget, getPathWaypoints, getSequenceTarget, getSwitchSolution, getSwitchStart, toggleSwitch } from './challenge-data';
const levels = [1, 2, 3, 4] as const;
const modes = ['normal', 'medium', 'hard', 'expert'] as const;

describe('nonogram rules and tap reducer', () => {
  it('generates unique, reachable pictures and exact clues at every size', () => {
    for (const level of levels) for (let seed = 1; seed <= 8; seed++) {
      const puzzle = createPicture(level, seed);
      expect(puzzle.size).toBe(level + 3);
      expect(pictureClues(puzzle.target, puzzle.size)).toEqual(puzzle.clues);
      expect(countPictureSolutions(puzzle.clues, puzzle.size)).toBe(1);
      expect(exactPicture(puzzle.target, puzzle.target)).toBe(true);
      expect(exactPicture(puzzle.target.map((cell: boolean, i: number) => i ? cell : !cell), puzzle.target)).toBe(false);
      expect(exactPicture(puzzle.target.map((cell: boolean, i: number) => i ? cell : null), puzzle.target)).toBe(false);
      expect(exactPicture(puzzle.target.map(Number), puzzle.target)).toBe(false);
    }
  });
  it('marks X immediately, confirms within 350ms, and permits corrections', () => {
    const first = pictureTap([null, null], null, 0, 0);
    expect(first.cells).toEqual([false, null]);
    const second = pictureTap(first.cells, first.pending, 0, 349);
    expect(second.cells).toEqual([true, null]);
    expect(second.pending).toBeNull();
    const correction = pictureTap(second.cells, null, 0, 400);
    expect(correction.cells[0]).toBe(false);
    expect(pictureTap(correction.cells, correction.pending, 0, 500).cells[0]).toBe(true);
  });
  it('uses authoritative rapid updates, cancels other selections, and never fills a late tap', () => {
    const first = pictureTap([null, null], null, 0, 0);
    const other = pictureTap(first.cells, first.pending, 1, 100);
    expect(other.cells).toEqual([false, false]);
    expect(other.pending?.index).toBe(1);
    const late = pictureTap(other.cells, other.pending, 1, 451);
    expect(late.cells[1]).toBe(false);
    const rapid = pictureTap(late.cells, late.pending, 1, 452);
    expect(rapid.cells).toEqual([false, true]);
    expect(pictureTap(rapid.cells, rapid.pending, 1, 453).cells[1]).toBe(false);
  });
});
describe('observation, matrix, and recall content', () => {
  it('validates 320 observation puzzles with diverse families and randomized answers', () => {
    for (const level of levels) {
      const positions = new Set<number>(); const signatures = new Set<string>();
      for (let seed = 1; seed <= 80; seed++) {
        const puzzle = createOddPuzzle(level, seed);
        expect(validateOddPuzzle(puzzle)).toBe(true);
        expect(puzzle.items.length).toBe(level <= 2 ? 4 : 6);
        positions.add(puzzle.answer); signatures.add(JSON.stringify(puzzle.items));
        expect(validateOddPuzzle({ ...puzzle, answer: (puzzle.answer + 1) % puzzle.items.length })).toBe(false);
      }
      expect(positions.size).toBeGreaterThan(2); expect(signatures.size).toBeGreaterThan(20);
    }
  });
  it('derives 320 matrix answers from numeric, direction/count, and shape/count rules', () => {
    for (const level of levels) {
      const positions = new Set<number>();
      for (let seed = 1; seed <= 80; seed++) {
        const puzzle = createMatrixPuzzle(level, seed);
        expect(validateMatrixPuzzle(puzzle)).toBe(true); positions.add(puzzle.answer);
        expect(validateMatrixPuzzle({ ...puzzle, cells: ['invalid', ...puzzle.cells.slice(1)] })).toBe(false);
      }
      expect(positions.size).toBeGreaterThan(2);
    }
    const pictures = levels.map(level => createMatrixPuzzle(level, 3).cells.join('|'));
    expect(new Set(pictures).size).toBe(4);
  });
  it('records exactly the real changes for 160 stable recall scenes', () => {
    for (const level of levels) for (let seed = 1; seed <= 40; seed++) {
      const puzzle = createRecallPuzzle(level, seed);
      expect(validateRecallPuzzle(puzzle)).toBe(true);
      expect(sceneDifferences(puzzle.before, puzzle.after)).toEqual(puzzle.changed);
      expect(puzzle.changed).toHaveLength(level);
      expect(exactRecall(puzzle.changed, puzzle.changed)).toBe(true);
      expect(exactRecall([puzzle.changed[0], puzzle.changed[0]], puzzle.changed)).toBe(false);
      expect(exactRecall([], puzzle.changed)).toBe(false);
    }
    const removal = createRecallPuzzle(1, 6);
    expect(removal.before.filter(Boolean).length - removal.after.filter(Boolean).length).toBe(1);
    const movement = createRecallPuzzle(2, 2);
    expect(movement.before.filter(Boolean).length).toBe(movement.after.filter(Boolean).length);
    expect(movement.changed).toHaveLength(2);
    expect(advanceStudy(1000, 300, true)).toBe(1000);
    expect(advanceStudy(1000, 1200, false)).toBe(0);
  });
});
describe('meaningful difficulty across the release lineup', () => {
  it('reduces clues, increases memory and switch depth, and introduces path checkpoints', () => {
    const clueCounts: number[] = [], memoryCounts: number[] = [], signalCounts: number[] = [], switchCounts: number[] = [];
    modes.forEach((mode, i) => {
      const challenge = getChallengeConfig('number-grid', mode, 1);
      expect(challenge.level).toBe(i + 1);
      const number = getGridPuzzle('number-grid', challenge.level, challenge.seed);
      const binary = getGridPuzzle('binary-grid', challenge.level, challenge.seed);
      expect(isValidNumberGrid(number.target)).toBe(true); expect(isValidBinaryGrid(binary.target)).toBe(true);
      clueCounts.push(number.givens.length); memoryCounts.push(getMemoryTarget('flash-grid', challenge).length); signalCounts.push(getSequenceTarget(challenge).length); switchCounts.push(getSwitchSolution(challenge).length);
      expect(getMineTargets(challenge)).toHaveLength(i + 4);
      const path = getPathTarget(challenge);
      expect(isValidPath(path, getPathObstacles(challenge))).toBe(true);
      expect(getPathWaypoints(challenge).every(point => path.includes(point))).toBe(true);
      const lights = getSwitchStart(challenge); getSwitchSolution(challenge).forEach(index => toggleSwitch(lights, index)); expect(lights.every(Boolean)).toBe(true);
      expect(createTimeline(challenge.level, 99).items).toHaveLength(i + 4);
    });
    expect(clueCounts).toEqual([10, 8, 6, 4]); expect(memoryCounts).toEqual([4, 6, 8, 10]); expect(signalCounts).toEqual([4, 5, 6, 7]); expect(switchCounts).toEqual([3, 4, 6, 7]);
    expect(new Set(levels.map(level => JSON.stringify(getPatternShiftPuzzle(1, level)))).size).toBe(4);
  });
  it('keeps daily timelines stable, unsolved initially, and chronological under every format', () => {
    for (const level of levels) {
      const puzzle = createTimeline(level, 88);
      expect(puzzle).toEqual(createTimeline(level, 88));
      expect(puzzle.answer.every((value: number, i: number) => value === i)).toBe(false);
      expect(new Set(puzzle.answer).size).toBe(puzzle.items.length);
    }
  });
});
