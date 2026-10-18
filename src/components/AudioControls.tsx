import { useEffect, useId, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import { Music2, Volume2 } from "lucide-react";
import { audio } from "@/lib/audio";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export function AudioExperience() {
  const location = useLocation();
  useEffect(() => audio.attach(), []);
  useEffect(() => { window.dispatchEvent(new Event('gridverse-resume')); audio.setMood(/^\/games\/[^/]+$/.test(location.pathname) ? 'game' : 'home'); }, [location.pathname]);
  useEffect(() => {
    try { document.documentElement.classList.toggle('reduce-motion', localStorage.getItem('gridverse-reduced-motion') === 'on'); } catch { /* OS motion preference still applies. */ }
  }, []);
  return null;
}
export function AudioSettings() {
  const preferences = useSyncExternalStore(audio.subscribe, audio.getSnapshot);
  const prefix = useId();
  return <div className="space-y-6"><p className="text-xs leading-5 text-muted-foreground">Original ambient loops and quiet puzzle tones. Audio starts after your first interaction.</p>{(['music', 'effects'] as const).map(kind => <div key={kind} className="space-y-3"><div className="flex items-center justify-between gap-4"><label htmlFor={`${prefix}-audio-${kind}`} className="flex items-center gap-2 text-sm font-bold">{kind === 'music' ? <Music2 className="h-4 w-4 text-primary" /> : <Volume2 className="h-4 w-4 text-primary" />}{kind === 'music' ? 'Background music' : 'Sound effects'}</label><Switch id={`${prefix}-audio-${kind}`} checked={preferences[kind]} onCheckedChange={value => { audio.unlock(); audio.update({ [kind]: value }); }} className="data-[state=checked]:bg-primary" /></div><div className="flex items-center gap-3"><Slider aria-label={`${kind === 'music' ? 'Music' : 'Sound effects'} volume`} min={0} max={100} step={1} value={[Math.round(preferences[kind === 'music' ? 'musicVolume' : 'effectsVolume'] * 100)]} onValueChange={([value]) => audio.update(kind === 'music' ? { musicVolume: value / 100 } : { effectsVolume: value / 100 })} className="flex-1" /><span className="w-10 text-right text-xs font-bold tabular-nums text-primary">{Math.round(preferences[kind === 'music' ? 'musicVolume' : 'effectsVolume'] * 100)}%</span></div></div>)}</div>;
}
export function AudioControls() {
  return <Popover><PopoverTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label="Sound settings" className="rounded-xl text-muted-foreground hover:text-primary"><Volume2 className="h-[18px] w-[18px]" /></Button></PopoverTrigger><PopoverContent align="end" className="w-[min(320px,calc(100vw-24px))] rounded-2xl border-primary/20 p-5 shadow-xl"><h2 className="mb-3 font-display text-base font-extrabold">Your focus soundtrack</h2><AudioSettings /></PopoverContent></Popover>;
}
