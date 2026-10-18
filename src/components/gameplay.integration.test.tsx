import { StrictMode, act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NonogramBoard } from './NonogramBoard';
import { ChangeDetectorBoard } from './ChangeDetectorBoard';
import { createInitialPuzzleState } from './GameBoard';
import { games } from '@/data/games';
import { getChallengeConfig } from '@/lib/difficulty';
import { createPicture, createRecallPuzzle } from '@/lib/puzzle-engine';

let container: HTMLDivElement;
let root: Root;
const complete = vi.fn(), mistake = vi.fn(), move = vi.fn();
const challenge = getChallengeConfig('nonogram', 'normal', 1);
function NonogramHarness() {
  const [state, setState] = useState(() => createInitialPuzzleState('nonogram', challenge));
  return <NonogramBoard game={games.find(game => game.kind === 'nonogram')!} state={state} setState={setState} challenge={challenge} onComplete={complete} onMistake={mistake} onMove={move} hintUsed={false} />;
}
function click(index: number) {
  const button = container.querySelector<HTMLButtonElement>(`[data-nonogram-cell="${index}"]`)!;
  act(() => button.click());
}
function solvePicture() {
  const picture = createPicture(1, 1);
  picture.target.forEach((filled: boolean, i: number) => { if (filled) { click(i); click(i); } });
  picture.target.forEach((filled: boolean, i: number) => { if (!filled) click(i); });
}
beforeEach(() => {
  vi.useFakeTimers(); complete.mockClear(); mistake.mockClear(); move.mockClear();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); vi.useRealTimers(); });

describe('nonogram React input and completion regressions', () => {
  it('wins once when the final action eliminates an empty cell, under StrictMode', () => {
    act(() => root.render(<StrictMode><NonogramHarness /></StrictMode>));
    solvePicture(); expect(complete).toHaveBeenCalledTimes(1);
    click(0); act(() => vi.advanceTimersByTime(1000)); expect(complete).toHaveBeenCalledTimes(1);
  });
  it('also wins immediately when the final confirmation fills a required cell', () => {
    act(() => root.render(<NonogramHarness />));
    const picture = createPicture(1, 1); const last = picture.target.findIndex(Boolean);
    picture.target.forEach((filled: boolean, i: number) => { if (i !== last) { click(i); if (filled) click(i); } });
    expect(complete).not.toHaveBeenCalled(); click(last); click(last);
    expect(complete).toHaveBeenCalledTimes(1);
  });
  it('never completes an incorrect grid and supports rapid corrections', () => {
    act(() => root.render(<NonogramHarness />));
    const picture = createPicture(1, 1);
    picture.target.forEach((filled: boolean, i: number) => { click(i); if (filled && i !== picture.target.findIndex(Boolean)) click(i); });
    expect(complete).not.toHaveBeenCalled();
    const missing = picture.target.findIndex(Boolean); click(missing); click(missing);
    expect(complete).toHaveBeenCalledTimes(1);
  });
  it('uses one click stream for touch/mouse, cancels pending highlights, and preserves X', () => {
    act(() => root.render(<NonogramHarness />));
    const cell = container.querySelector<HTMLButtonElement>('[data-nonogram-cell="0"]')!;
    act(() => { cell.dispatchEvent(new Event('touchend', { bubbles: true })); cell.click(); });
    expect(cell.getAttribute('aria-pressed')).toBe('false'); expect(move).toHaveBeenCalledTimes(1);
    click(0); expect(cell.getAttribute('aria-pressed')).toBe('true');
    click(0); click(1); act(() => vi.advanceTimersByTime(351));
    expect(cell.getAttribute('aria-pressed')).toBe('false');
    expect(cell.getAttribute('aria-label')).toContain('eliminated');
  });
  it('supports keyboard confirmation, navigation, and background cancellation', () => {
    act(() => root.render(<NonogramHarness />));
    const cell = container.querySelector<HTMLButtonElement>('[data-nonogram-cell="0"]')!;
    act(() => { cell.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })); cell.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })); });
    expect(cell.getAttribute('aria-pressed')).toBe('true');
    click(1);
    act(() => container.querySelector<HTMLDivElement>('.gv-enter')!.click());
    expect(container.querySelector('[data-nonogram-cell="1"]')!.getAttribute('aria-label')).toContain('eliminated');
    act(() => cell.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
    expect(document.activeElement).toBe(container.querySelector('[data-nonogram-cell="1"]'));
  });
});
function RecallHarness() {
  const recallChallenge = getChallengeConfig('change-detector', 'medium', 1);
  const [state, setState] = useState(() => createInitialPuzzleState('change-detector', recallChallenge));
  return <ChangeDetectorBoard game={games.find(game => game.kind === 'change-detector')!} state={state} setState={setState} challenge={recallChallenge} onComplete={complete} onMistake={mistake} onMove={move} hintUsed={false} />;
}
describe('change detector study / hide / recall / feedback integration', () => {
  it('mounts only the active scene, pauses time, and requires exact confirmed changes', () => {
    act(() => root.render(<RecallHarness />));
    expect(container.querySelector('[aria-label="Original scene"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Scene cell 1"]')).toBeNull();
    act(() => { window.dispatchEvent(new Event('gridverse-pause')); vi.advanceTimersByTime(6000); });
    expect(container.textContent).toContain('Study');
    act(() => window.dispatchEvent(new Event('gridverse-resume')));
    act(() => vi.advanceTimersByTime(4560));
    expect(container.querySelector('[aria-label="Original scene"]')).toBeNull();
    expect(container.textContent).toContain('Hold the scene');
    act(() => vi.advanceTimersByTime(480));
    expect(container.querySelector('[aria-label="Original scene"]')).toBeNull();
    expect(container.textContent).toContain('Recall:');
    const puzzle = createRecallPuzzle(2, 1);
    for (const i of puzzle.changed) act(() => container.querySelector<HTMLButtonElement>(`[aria-label="Scene cell ${i + 1}"]`)!.click());
    act(() => [...container.querySelectorAll('button')].find(button => button.textContent?.includes('Confirm'))!.click());
    expect(mistake).not.toHaveBeenCalled(); expect(complete).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Memory matched');
    act(() => [...container.querySelectorAll('button')].find(button => button.textContent?.includes('Study next'))!.click());
    expect(container.textContent).toContain('Round 2/2'); expect(container.querySelector('[aria-label="Original scene"]')).not.toBeNull();
  });
});
