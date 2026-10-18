import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { audio } from './audio';
import { AudioSettings } from '@/components/AudioControls';
import { unlockAchievements } from './achievements';

const gains: Array<{ gain: { value: number; setTargetAtTime: ReturnType<typeof vi.fn> } }> = [];
const oscillators: Array<{ start: ReturnType<typeof vi.fn> }> = [];
let contexts = 0;
class FakeContext {
  state = 'running'; currentTime = 0; destination = {};
  constructor() { contexts++; }
  createGain() {
    const node = { gain: { value: 0, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() };
    gains.push(node); return node;
  }
  createOscillator() {
    const node = { type: 'sine', frequency: { value: 0 }, start: vi.fn(), stop: vi.fn(), connect: vi.fn(), disconnect: vi.fn(), onended: null };
    oscillators.push(node); return node;
  }
  resume() { this.state = 'running'; return Promise.resolve(); }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
  close() { this.state = 'closed'; return Promise.resolve(); }
}
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe('central audio and persisted controls', () => {
  it('unlocks one context, independently controls volumes, deduplicates effects, and cleans timers', () => {
    contexts = 0; gains.length = 0; oscillators.length = 0;
    vi.useFakeTimers(); vi.stubGlobal('AudioContext', FakeContext);
    audio.update({ music: true, effects: true, musicVolume: 0.3, effectsVolume: 0.6 });
    const detach = audio.attach();
    expect(contexts).toBe(0);
    document.dispatchEvent(new Event('pointerdown'));
    for (let i = 0; i < 10; i++) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(contexts).toBe(1);
    const before = oscillators.length; audio.play('correct'); audio.play('correct');
    expect(oscillators.length - before).toBe(2);
    audio.update({ effectsVolume: 0.2, music: false });
    expect(audio.getSnapshot().musicVolume).toBe(0.3);
    expect(audio.getSnapshot().effectsVolume).toBe(0.2);
    expect(gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 0.25);
    expect(gains[1].gain.setTargetAtTime.mock.calls.at(-1)?.[0]).toBeCloseTo(0.02);
    detach(); expect(vi.getTimerCount()).toBe(0);
  });
  it('audio failures cannot throw into gameplay', () => {
    vi.stubGlobal('AudioContext', class { constructor() { throw new Error('blocked'); } });
    const detach = audio.attach(); expect(() => audio.unlock()).not.toThrow(); expect(() => audio.play('victory')).not.toThrow(); detach();
  });
  it('renders real independent switches backed by persisted preferences', () => {
    vi.stubGlobal('AudioContext', FakeContext);
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    audio.update({ music: true, effects: true });
    const container = document.createElement('div'); document.body.appendChild(container); const root = createRoot(container);
    act(() => root.render(<AudioSettings />));
    act(() => container.querySelectorAll<HTMLButtonElement>('[role="switch"]')[0].click());
    expect(audio.getSnapshot().music).toBe(false); expect(audio.getSnapshot().effects).toBe(true);
    act(() => container.querySelectorAll<HTMLButtonElement>('[role="switch"]')[1].click());
    expect(audio.getSnapshot().effects).toBe(false);
    expect(JSON.parse(localStorage.getItem('gridverse-audio')!).effects).toBe(false);
    act(() => root.unmount()); container.remove();
    const detach = audio.attach(); detach();
  });
  it('awards milestones only on completed runs and persists exactly once', () => {
    localStorage.removeItem('gridverse-achievements');
    expect(unlockAchievements('nonogram', 1)).toEqual(['First solve']);
    expect(unlockAchievements('nonogram', 0)).toEqual(['Clean solve']);
    expect(unlockAchievements('nonogram', 0)).toEqual([]);
    expect(unlockAchievements('daily-mystery', 0)).toContain('Daily detective');
  });
});
