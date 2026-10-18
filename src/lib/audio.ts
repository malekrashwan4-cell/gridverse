export type Sound = 'click' | 'select' | 'correct' | 'mistake' | 'victory' | 'level' | 'achievement' | 'daily' | 'warning' | 'error';
export type AudioPreferences = { music: boolean; effects: boolean; musicVolume: number; effectsVolume: number };
type Mood = 'home' | 'game' | 'victory';
const defaults: AudioPreferences = { music: true, effects: true, musicVolume: 0.35, effectsVolume: 0.55 };
const notes: Record<Sound, number[]> = { click: [440], select: [520], correct: [660, 880], mistake: [200, 160], victory: [523, 659, 784, 1047], level: [392, 523], achievement: [659, 784, 988], daily: [523, 784, 1047], warning: [330], error: [180, 140] };
function readPreferences(): AudioPreferences {
  try {
    const stored = JSON.parse(localStorage.getItem('gridverse-audio') ?? '{}');
    return { music: typeof stored.music === 'boolean' ? stored.music : true, effects: localStorage.getItem('gridverse-sound') === 'off' ? false : typeof stored.effects === 'boolean' ? stored.effects : true, musicVolume: Number.isFinite(stored.musicVolume) ? Math.max(0, Math.min(1, stored.musicVolume)) : defaults.musicVolume, effectsVolume: Number.isFinite(stored.effectsVolume) ? Math.max(0, Math.min(1, stored.effectsVolume)) : defaults.effectsVolume };
  } catch { return { ...defaults }; }
}
class AudioManager {
  private preferences = readPreferences();
  private listeners = new Set<() => void>();
  private context: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private effectsGain: GainNode | null = null;
  private voices = new Set<OscillatorNode>();
  private scheduler: ReturnType<typeof setInterval> | null = null;
  private lastEffect = new Map<Sound, number>();
  private step = 0;
  private mood: Mood = 'home';
  private paused = false;
  private users = 0;
  getSnapshot = () => this.preferences;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  update(patch: Partial<AudioPreferences>) {
    this.preferences = { ...this.preferences, ...patch };
    this.preferences.musicVolume = Math.max(0, Math.min(1, this.preferences.musicVolume));
    this.preferences.effectsVolume = Math.max(0, Math.min(1, this.preferences.effectsVolume));
    try { localStorage.setItem('gridverse-audio', JSON.stringify(this.preferences)); localStorage.setItem('gridverse-sound', this.preferences.effects ? 'on' : 'off'); } catch { /* In-memory settings still apply. */ }
    this.applyVolumes(); this.listeners.forEach(listener => listener());
  }
  setMood(mood: Mood) { if (this.mood !== mood) { this.mood = mood; this.step = 0; } }
  private applyVolumes() {
    if (!this.context) return;
    this.musicGain?.gain.setTargetAtTime(this.preferences.music && !this.paused && !document.hidden ? this.preferences.musicVolume * 0.045 : 0, this.context.currentTime, 0.25);
    this.effectsGain?.gain.setTargetAtTime(this.preferences.effects ? this.preferences.effectsVolume * 0.1 : 0, this.context.currentTime, 0.02);
  }
  unlock = () => {
    try {
      if (!this.context || this.context.state === 'closed') {
        this.context = new AudioContext();
        this.musicGain = this.context.createGain(); this.effectsGain = this.context.createGain();
        this.musicGain.gain.value = 0; this.effectsGain.gain.value = 0;
        this.musicGain.connect(this.context.destination); this.effectsGain.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
      this.applyVolumes();
      if (this.scheduler === null) { this.musicTick(); this.scheduler = setInterval(() => this.musicTick(), 1800); }
    } catch { /* Unsupported or blocked audio never interrupts play. */ }
  };
  private tone(frequency: number, at: number, duration: number, destination: GainNode, ambient = false) {
    const context = this.context;
    if (!context) return;
    const oscillator = context.createOscillator(), envelope = context.createGain();
    oscillator.type = ambient ? 'sine' : 'triangle'; oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(ambient ? 0.28 : 0.35, at + (ambient ? 0.25 : 0.008));
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(envelope); envelope.connect(destination); this.voices.add(oscillator);
    oscillator.onended = () => { this.voices.delete(oscillator); oscillator.disconnect(); envelope.disconnect(); };
    oscillator.start(at); oscillator.stop(at + duration + 0.02);
  }
  play(sound: Sound) {
    try {
      if (!this.preferences.effects || !this.context || this.context.state !== 'running' || document.hidden) return;
      const now = this.context.currentTime;
      const duration = sound === 'victory' || sound === 'daily' || sound === 'achievement' ? 0.8 : 0.2;
      if (now - (this.lastEffect.get(sound) ?? -100) < duration) return;
      this.lastEffect.set(sound, now);
      notes[sound].forEach((frequency, i) => this.tone(frequency, now + i * 0.09, 0.13, this.effectsGain!));
    } catch { /* Optional feedback. */ }
  }
  private musicTick() {
    try {
      if (!this.context || this.context.state !== 'running' || !this.preferences.music || this.paused || document.hidden) return;
      const progression = this.mood === 'home' ? [130.81, 164.81, 146.83, 196] : this.mood === 'victory' ? [174.61, 220, 261.63, 196] : [110, 130.81, 146.83, 130.81];
      const root = progression[this.step++ % progression.length];
      [1, 1.5, 2].forEach((ratio, i) => this.tone(root * ratio, this.context!.currentTime + i * 0.08, 2.6, this.musicGain!, true));
    } catch { /* Optional music. */ }
  }
  private visibility = () => {
    this.applyVolumes();
    if (document.hidden && this.context?.state === 'running') void this.context.suspend().catch(() => {});
    if (!document.hidden && this.context?.state === 'suspended') void this.context.resume().catch(() => {});
  };
  private pause = () => { this.paused = true; this.applyVolumes(); };
  private resume = () => { this.paused = false; this.applyVolumes(); };
  private feedback = (event: Event) => { const sound = (event as CustomEvent<Sound>).detail; if (sound in notes) this.play(sound); };
  private click = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target.closest('button, a, [role="switch"]') : null;
    if (target && !target.hasAttribute('disabled')) this.play(target.closest('[data-game-board]') ? 'select' : 'click');
  };
  private storage = () => { this.preferences = readPreferences(); this.applyVolumes(); this.listeners.forEach(listener => listener()); };
  attach() {
    if (this.users++ === 0) {
      document.addEventListener('pointerdown', this.unlock); document.addEventListener('keydown', this.unlock);
      document.addEventListener('click', this.click); document.addEventListener('visibilitychange', this.visibility);
      window.addEventListener('gridverse-pause', this.pause); window.addEventListener('gridverse-resume', this.resume);
      window.addEventListener('gridverse-feedback', this.feedback); window.addEventListener('storage', this.storage);
    }
    return () => {
      if (--this.users !== 0) return;
      document.removeEventListener('pointerdown', this.unlock); document.removeEventListener('keydown', this.unlock);
      document.removeEventListener('click', this.click); document.removeEventListener('visibilitychange', this.visibility);
      window.removeEventListener('gridverse-pause', this.pause); window.removeEventListener('gridverse-resume', this.resume);
      window.removeEventListener('gridverse-feedback', this.feedback); window.removeEventListener('storage', this.storage);
      if (this.scheduler !== null) clearInterval(this.scheduler); this.scheduler = null;
      this.voices.forEach(voice => { try { voice.stop(); } catch { /* Already ended. */ } }); this.voices.clear();
      if (this.context) void this.context.close().catch(() => {}); this.context = null;
    };
  }
}
export const audio = new AudioManager();
