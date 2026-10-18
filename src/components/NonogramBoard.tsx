import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import type { GameBoardProps } from "@/components/GameBoard";
import { createPicture, exactPicture, pictureTap, TAP_INTERVAL_MS } from "@/lib/puzzle-engine";
import { cn } from "@/lib/utils";

type Pending = { index: number; at: number } | null;
export function NonogramBoard({ state, setState, challenge, onComplete, onMove, hintUsed }: GameBoardProps) {
  const puzzle = useMemo(() => createPicture(challenge.level, challenge.seed), [challenge.level, challenge.seed]);
  const cellsRef = useRef(state.cells);
  const pendingRef = useRef<Pending>(null);
  const won = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const board = useRef<HTMLDivElement>(null);
  useEffect(() => { cellsRef.current = state.cells; }, [state.cells]);
  useEffect(() => {
    if (!won.current && exactPicture(state.cells, puzzle.target)) { won.current = true; onComplete(); }
  }, [onComplete, puzzle.target, state.cells]);
  const cancel = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null; pendingRef.current = null; setPending(null);
  };
  useEffect(() => {
    const stop = () => { if (timer.current !== null) clearTimeout(timer.current); pendingRef.current = null; setPending(null); };
    window.addEventListener("gridverse-pause", stop);
    return () => { window.removeEventListener("gridverse-pause", stop); if (timer.current !== null) clearTimeout(timer.current); };
  }, []);
  const tap = (index: number) => {
    if (won.current) return;
    const next = pictureTap(cellsRef.current, pendingRef.current, index, performance.now(), TAP_INTERVAL_MS);
    cancel();
    cellsRef.current = next.cells;
    pendingRef.current = next.pending;
    setPending(next.pending);
    onMove();
    setState(current => ({ ...current, cells: next.cells }));
    if (next.pending) timer.current = setTimeout(cancel, TAP_INTERVAL_MS);
  };
  return <div ref={board} className="w-full max-w-[560px] gv-enter" onClick={cancel}>
    <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center text-xs leading-5">
      <p className="font-bold">One tap marks X and arms the cell. Tap it again within {TAP_INTERVAL_MS}ms to fill.</p>
      <p className="mt-1 text-muted-foreground">To correct any cell, repeat the same gesture. Another cell or the board background cancels the highlight, leaving X. Tab / arrows navigate; Enter or Space taps.</p>
      {hintUsed && <p className="mt-2 font-bold text-primary">Clues count consecutive filled runs separated by at least one X. All empty cells must be marked.</p>}
    </div>
    <div className="grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `minmax(38px, .9fr) repeat(${puzzle.size}, minmax(0, 1fr))` }}>
      <span aria-hidden="true" />
      {puzzle.clues.columns.map((clue: number[], i: number) => <span key={`c${i}`} aria-label={`Column ${i + 1}: ${clue.join(', ')}`} className="flex min-h-10 items-end justify-center pb-2 text-center font-mono text-xs font-bold text-primary">{clue.join(' · ')}</span>)}
      {Array.from({ length: puzzle.size }, (_, row) => <div key={row} className="contents"><span aria-label={`Row ${row + 1}: ${puzzle.clues.rows[row].join(', ')}`} className="flex items-center justify-end pr-2 text-right font-mono text-xs font-bold text-primary">{puzzle.clues.rows[row].join(' · ')}</span>{Array.from({ length: puzzle.size }, (_, col) => {
        const index = row * puzzle.size + col; const value = state.cells[index]; const armed = pending?.index === index;
        return <button key={index} type="button" data-nonogram-cell={index} aria-label={`Row ${row + 1}, column ${col + 1}: ${armed ? 'armed, tap again to fill' : value === true ? 'filled' : value === false ? 'eliminated' : 'unknown'}`} aria-pressed={value === true} onClick={event => { event.stopPropagation(); tap(index); }} onKeyDown={event => {
          const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -puzzle.size, ArrowDown: puzzle.size }[event.key];
          if (offset !== undefined) { event.preventDefault(); event.stopPropagation(); cancel(); board.current?.querySelector<HTMLButtonElement>(`[data-nonogram-cell="${Math.max(0, Math.min(puzzle.size ** 2 - 1, index + offset))}"]`)?.focus(); }
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); tap(index); }
        }} className={cn("gv-cell aspect-square min-h-8 w-full touch-manipulation rounded-lg border-2 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2", armed ? "border-amber-500 bg-amber-100 text-amber-900 ring-2 ring-amber-500/30 dark:bg-amber-950 dark:text-amber-100" : value === true ? "border-primary bg-primary text-primary-foreground" : value === false ? "border-dashed border-border bg-muted/60 text-muted-foreground" : "border-border bg-card text-muted-foreground")}>{value === false ? <X className="mx-auto h-4 w-4" /> : value === true ? <span className="sr-only">Filled</span> : '·'}</button>;
      })}</div>)}
    </div>
    <p className="mt-4 text-center text-[11px] font-semibold text-muted-foreground">{puzzle.size} × {puzzle.size} · uniquely solvable · {state.cells.filter(cell => typeof cell === 'boolean').length}/{puzzle.size ** 2} cells declared</p>
  </div>;
}
