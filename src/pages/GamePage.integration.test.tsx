import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import GamePage from './GamePage';
import { createPicture } from '@/lib/puzzle-engine';
import { getChallengeMetrics, getGuestHistory } from '@/lib/progress';
const cloud = vi.hoisted(() => ({ submit: vi.fn().mockResolvedValue({ error: null }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'test-player' } } } }), onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })) },
  rpc: cloud.submit,
} }));
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
it('completes the actual game page once, saves a score, submits once, and opens the next puzzle', async () => {
  localStorage.clear(); cloud.submit.mockClear(); vi.useFakeTimers();
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const container = document.createElement('div'); document.body.appendChild(container); const root = createRoot(container);
  await act(async () => root.render(<MemoryRouter initialEntries={['/games/nonogram']}><Routes><Route path="/games/:slug" element={<GamePage />} /></Routes></MemoryRouter>));
  const button = (text: string) => [...container.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.includes(text))!;
  await act(async () => button('Start challenge').click());
  const puzzle = createPicture(1, 1);
  const tap = async (i: number) => { await act(async () => container.querySelector<HTMLButtonElement>(`[data-nonogram-cell="${i}"]`)!.click()); };
  for (let i = 0; i < puzzle.target.length; i++) if (puzzle.target[i]) { await tap(i); await tap(i); }
  for (let i = 0; i < puzzle.target.length; i++) if (!puzzle.target[i]) await tap(i);
  expect(container.textContent).toContain('You mastered the challenge.');
  expect(container.textContent).toContain('Synced to your account.');
  expect(getGuestHistory()).toHaveLength(1); expect(getGuestHistory()[0].score).toBeGreaterThan(0);
  expect(getChallengeMetrics().filter(metric => metric.completed)).toHaveLength(1);
  expect(cloud.submit).toHaveBeenCalledTimes(1);
  expect(cloud.submit).toHaveBeenCalledWith('submit_game_session', expect.objectContaining({ p_game_id: 'nonogram', p_puzzle_id: 'nonogram-normal-stage-1' }));
  await act(async () => button('Next puzzle').click());
  expect(container.textContent).toContain('Ready when you are.');
  await act(async () => button('Start challenge').click());
  expect(container.querySelectorAll('[data-nonogram-cell]')).toHaveLength(16);
  expect([...container.querySelectorAll('[data-nonogram-cell]')].every(cell => cell.getAttribute('aria-label')?.includes('unknown'))).toBe(true);
  expect(cloud.submit).toHaveBeenCalledTimes(1);
  act(() => root.unmount()); container.remove();
});
