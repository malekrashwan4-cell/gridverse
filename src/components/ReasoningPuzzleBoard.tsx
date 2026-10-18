import { useMemo, useRef, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import type { GameBoardProps } from "@/components/GameBoard";
import { createMatrixPuzzle, createOddPuzzle } from "@/lib/puzzle-engine";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function ObservationTile({ item }: { item: ReturnType<typeof createOddPuzzle>['items'][number] }) {
  if (item.value) return <span className="font-mono text-lg font-bold sm:text-xl">{item.value}</span>;
  const points = Array.from({ length: item.sides }, (_, i) => { const angle = i * 2 * Math.PI / item.sides - Math.PI / 2; return `${50 + 43 * Math.cos(angle)},${50 + 43 * Math.sin(angle)}`; }).join(' ');
  return <svg viewBox="0 0 100 100" aria-hidden="true" className="h-full max-h-36 w-full text-primary"><polygon points={points} fill="hsl(var(--primary) / .06)" stroke="currentColor" strokeWidth="3" /><g>{Array.from({ length: item.marks }, (_, i) => <circle key={i} cx={34 + (i % 4) * 11} cy={34 + Math.floor(i / 4) * 10} r="3" fill="currentColor" />)}</g><path d="M50 72 V59 M45 64 L50 59 L55 64" fill="none" stroke="currentColor" strokeWidth="2.5" transform={`rotate(${item.rotation} 50 65)`} /></svg>;
}
export function ReasoningPuzzleBoard({ game, challenge, onComplete, onMistake, onMove, hintUsed }: GameBoardProps) {
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const solvedRef = useRef(false);
  const odd = game.kind === 'odd-one-out';
  const puzzle = useMemo(() => odd ? createOddPuzzle(challenge.level, challenge.seed + round) : createMatrixPuzzle(challenge.level, challenge.seed + round), [challenge.level, challenge.seed, odd, round]);
  const choose = (index: number) => {
    if (solvedRef.current) return;
    onMove(); setSelected(index);
    if (index !== puzzle.answer) { onMistake(); return; }
    solvedRef.current = true; setSolved(true);
    window.dispatchEvent(new CustomEvent('gridverse-feedback', { detail: 'correct' }));
    if (round + 1 === challenge.choiceRounds) onComplete();
  };
  return <div className="gv-enter w-full max-w-[560px] text-center" key={round}>
    <div className="mb-5 rounded-2xl border border-border bg-card p-4 text-xs leading-5"><p className="font-bold">{odd ? 'Find the one tile that breaks the shared relationship.' : 'Infer the rule and complete the missing matrix cell.'}</p><p className="mt-1 text-muted-foreground">Round {round + 1}/{challenge.choiceRounds} · {odd ? 'Compare sides, marks, direction, or input/output.' : 'Read across rows and down columns. Compare each property separately.'}</p>{hintUsed && <p className="mt-2 font-bold text-primary">{puzzle.hint}</p>}</div>
    {!odd && <div className="mb-5 grid grid-cols-3 gap-2">{('cells' in puzzle ? puzzle.cells : []).map((cell: string, i: number) => <span key={i} className={cn('grid aspect-square place-items-center rounded-2xl border bg-card px-1 font-mono text-lg font-bold sm:text-2xl', cell === '?' && 'border-dashed border-primary bg-primary/5 text-primary gv-pending')}>{cell === '?' && solved ? ('options' in puzzle ? puzzle.options[puzzle.answer] : '?') : cell}</span>)}</div>}
    <div className={cn('grid gap-3', odd ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2')}>
      {odd && 'items' in puzzle ? puzzle.items.map((item, i: number) => <button key={item.id} type="button" data-choice-index={i} aria-label={`Observation option ${i + 1}`} aria-pressed={selected === i} disabled={solved} onClick={() => choose(i)} className={cn('gv-cell flex aspect-square flex-col items-center justify-center rounded-2xl border-2 bg-card p-3', selected === i ? solved ? 'border-primary bg-primary/10' : 'border-rose-500 bg-rose-500/5' : 'border-border hover:border-primary/50')}><ObservationTile item={item} /><span className="mt-2 text-[10px] font-bold text-muted-foreground">Option {i + 1}</span></button>) : ('options' in puzzle ? puzzle.options : []).map((option: string, i: number) => <Button key={option} type="button" variant="outline" data-choice-index={i} disabled={solved} onClick={() => choose(i)} className={cn('gv-cell h-14 rounded-xl border-2 font-mono text-lg font-bold', selected === i && (solved ? 'border-primary bg-primary/10 text-primary' : 'border-rose-500 text-rose-600'))}>{option}</Button>)}
    </div>
    {selected !== null && <div role="status" className={cn('gv-enter mt-5 rounded-2xl p-4 text-xs leading-5', solved ? 'bg-primary/10 text-primary' : 'bg-rose-500/10 text-foreground')}><p className="font-bold">{solved ? <><Check className="mr-1 inline h-4 w-4" /> Correct. {puzzle.rule}</> : `Not this tile. ${puzzle.hint}`}</p>{solved && round + 1 < challenge.choiceRounds && <Button type="button" onClick={() => { solvedRef.current = false; setSolved(false); setSelected(null); setRound(value => value + 1); window.dispatchEvent(new CustomEvent('gridverse-feedback', { detail: 'level' })); }} className="mt-3 rounded-xl text-xs font-bold">Next pattern <ChevronRight className="ml-1 h-4 w-4" /></Button>}</div>}
  </div>;
}
