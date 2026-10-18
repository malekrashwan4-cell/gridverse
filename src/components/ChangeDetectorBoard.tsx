import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { GameBoardProps } from "@/components/GameBoard";
import { advanceStudy, createRecallPuzzle, exactRecall } from "@/lib/puzzle-engine";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Phase = 'study' | 'hide' | 'recall' | 'feedback';
export function ChangeDetectorBoard({ challenge, onComplete, onMistake, onMove, hintUsed }: GameBoardProps) {
  const [round, setRound] = useState(0);
  const puzzle = useMemo(() => createRecallPuzzle(challenge.level, challenge.seed + round), [challenge.level, challenge.seed, round]);
  const [phase, setPhase] = useState<Phase>('study');
  const [remaining, setRemaining] = useState(puzzle.studyMs);
  const remainingRef = useRef(puzzle.studyMs);
  const phaseRef = useRef<Phase>('study');
  const paused = useRef(false);
  const [selected, setSelected] = useState<number[]>([]);
  const selectedRef = useRef<number[]>([]);
  const [error, setError] = useState(false);
  const locked = useRef(false);
  const finished = useRef(false);
  const transition = (next: Phase, duration = 0) => { phaseRef.current = next; setPhase(next); remainingRef.current = duration; setRemaining(duration); };
  useEffect(() => {
    const pause = () => { paused.current = true; };
    const resume = () => { paused.current = false; };
    window.addEventListener('gridverse-pause', pause); window.addEventListener('gridverse-resume', resume);
    let last = performance.now();
    const clock = setInterval(() => {
      const now = performance.now(); const delta = now - last; last = now;
      if (phaseRef.current !== 'study' && phaseRef.current !== 'hide') return;
      remainingRef.current = advanceStudy(remainingRef.current, delta, paused.current || document.hidden);
      setRemaining(remainingRef.current);
      if (remainingRef.current === 0) transition(phaseRef.current === 'study' ? 'hide' : 'recall', phaseRef.current === 'study' ? 450 : 0);
    }, 80);
    return () => { clearInterval(clock); window.removeEventListener('gridverse-pause', pause); window.removeEventListener('gridverse-resume', resume); };
  }, []);
  const toggle = (i: number) => {
    if (paused.current || phaseRef.current !== 'recall' || locked.current) return;
    const next = selectedRef.current.includes(i) ? selectedRef.current.filter(value => value !== i) : [...selectedRef.current, i];
    selectedRef.current = next; setSelected(next); setError(false); onMove();
  };
  const submit = () => {
    if (paused.current || phaseRef.current !== 'recall' || locked.current) return;
    if (!exactRecall(selectedRef.current, puzzle.changed)) { onMistake(); setError(true); return; }
    locked.current = true; transition('feedback');
    window.dispatchEvent(new CustomEvent('gridverse-feedback', { detail: 'correct' }));
  };
  const next = () => {
    if (round + 1 === challenge.choiceRounds) { if (!finished.current) { finished.current = true; onComplete(); } return; }
    const following = createRecallPuzzle(challenge.level, challenge.seed + round + 1);
    selectedRef.current = []; setSelected([]); setError(false); locked.current = false;
    setRound(value => value + 1); transition('study', following.studyMs);
    window.dispatchEvent(new CustomEvent('gridverse-feedback', { detail: 'level' }));
  };
  // Only the active scene is mounted. The original is not rendered during recall.
  const cells = phase === 'study' ? puzzle.before : puzzle.after;
  return <div className="gv-enter w-full max-w-[440px] text-center">
    <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4"><p className="flex items-center justify-center gap-2 text-sm font-extrabold text-primary">{phase === 'study' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}{phase === 'study' ? `Study · ${(remaining / 1000).toFixed(1)}s` : phase === 'hide' ? 'Hold the scene in your mind…' : phase === 'recall' ? 'Recall: which cells changed?' : 'Memory matched'}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Round {round + 1}/{challenge.choiceRounds} · {puzzle.changed.length} changed cell{puzzle.changed.length > 1 ? 's' : ''}. Remember shape, position, color/texture, direction, size, and number.</p>{hintUsed && phase === 'recall' && <p className="mt-2 text-xs font-bold text-primary">Compare positions first, then inspect the properties you remember. Movement changes both origin and destination.</p>}</div>
    {phase === 'study' && <div role="progressbar" aria-label="Study time remaining" aria-valuemin={0} aria-valuemax={puzzle.studyMs} aria-valuenow={Math.round(remaining)} className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-100" style={{ width: `${100 * remaining / puzzle.studyMs}%` }} /></div>}
    <div className="grid grid-cols-4 gap-2 rounded-2xl border border-border bg-muted/30 p-3" aria-label={phase === 'study' ? 'Original scene' : 'Recall scene'}>
      {Array.from({ length: 16 }, (_, i) => {
        const item = phase === 'hide' ? null : cells[i];
        const visual = <>{item && <><span className={cn('inline-block', item.small ? 'text-xl' : 'text-3xl')} style={{ color: ['hsl(var(--primary))', '#b45309', '#0f766e'][item.tone] }}>{item.shape}</span><span className="absolute left-1 top-0.5 text-[9px] font-extrabold text-foreground">{['·', '═', '≋'][item.tone]}</span><span className="absolute right-1 top-0.5 text-xs font-bold text-foreground" style={{ transform: `rotate(${item.rotation}deg)` }}>↑</span>{item.value > 0 && <span className="absolute bottom-1 right-1 text-xs font-extrabold text-foreground">{item.value}</span>}</>}</>;
        const classes = cn('gv-cell relative grid aspect-square place-items-center rounded-xl border-2 bg-card', selected.includes(i) ? 'border-primary ring-2 ring-primary/20' : 'border-border', phase === 'feedback' && puzzle.changed.includes(i) && 'border-primary bg-primary/10');
        return phase === 'recall' ? <button key={i} type="button" aria-label={`Scene cell ${i + 1}`} aria-pressed={selected.includes(i)} onClick={() => toggle(i)} className={classes}>{visual}</button> : <div key={i} className={classes}>{visual}</div>;
      })}
    </div>
    {phase === 'recall' && <><Button type="button" onClick={submit} disabled={selected.length !== puzzle.changed.length} className="mt-5 h-11 rounded-xl px-6 text-xs font-bold">Confirm {selected.length}/{puzzle.changed.length} changed cells</Button>{error && <p role="status" className="gv-shake mt-3 text-xs font-semibold text-rose-600">That set is not exact. Recall the positions and properties; revise your selection.</p>}</>}
    {phase === 'feedback' && <div role="status" className="gv-enter mt-4 rounded-2xl bg-primary/10 p-4 text-xs leading-5 text-primary">{puzzle.explanations.map((text: string) => <p key={text}>{text}</p>)}<Button type="button" onClick={next} className="mt-3 rounded-xl text-xs font-bold">{round + 1 === challenge.choiceRounds ? 'Finish challenge' : 'Study next scene'}</Button></div>}
  </div>;
}
