import { useMemo } from "react";
import { Check, ChevronLeft, Flag, Lightbulb, Lock, Network, RotateCcw, X } from "lucide-react";
import type { Game, GameKind } from "@/data/games";
import {
  binaryTarget,
  choicePuzzles,
  countTrue,
  flashTarget,
  getChoicePuzzle,
  hiddenPatternTarget,
  isAdjacent,
  mineLocations,
  mirrorTarget,
  nonogramTarget,
  numberTarget,
  pathSolution,
  sequenceTarget,
  symbolTarget,
} from "@/lib/gameplay";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PuzzleState = {
  cells: Array<number | boolean | null>;
  selected: number[];
  path: number[];
  lights: boolean[];
  input: number[];
  show: boolean;
  answer: number | null;
};

type GameBoardProps = {
  game: Game;
  state: PuzzleState;
  setState: React.Dispatch<React.SetStateAction<PuzzleState>>;
  onComplete: (score?: number) => void;
  onMistake: () => void;
  onMove: () => void;
  hintUsed: boolean;
};

const symbols = ["◆", "●", "▲", "✚", "■", "✦"];
const binaryGiven = [0, 2, 5, 7, 8, 10, 13, 15];
const numberGiven = [0, 3, 5, 6, 9, 10, 12, 15];
const mineClues = [1, 2, 1, 0, 2, 3, 1, 2, 1, 2, 2, 1, 0, 2, 1, 1];
const beforeScene = [1, 5, 13];
const changeScene = [1, 5, 9, 13];

function Rule({ text, hint }: { text: string; hint?: string }) {
  return <div className="mb-5 rounded-2xl border border-border/60 bg-card/80 p-4 text-center text-xs font-semibold leading-5 text-muted-foreground"><span>{text}</span>{hint && <p className="mt-2 font-bold text-primary">{hint}</p>}</div>;
}

function CellGrid({ children, count = 16, className }: { children: (index: number) => React.ReactNode; count?: number; className?: string }) {
  return <div className={cn("grid grid-cols-4 gap-2", className)}>{Array.from({ length: count }, (_, index) => <div key={index}>{children(index)}</div>)}</div>;
}

function ChoiceButton({ active, onClick, children, wrong, choiceIndex }: { active?: boolean; onClick: () => void; children: React.ReactNode; wrong?: boolean; choiceIndex?: number }) {
  return <button type="button" data-choice-index={choiceIndex} onClick={onClick} aria-pressed={active} className={cn("flex min-h-12 touch-manipulation items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition hover:-translate-y-0.5 active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2", active ? wrong ? "border-rose-500 bg-rose-500/10 text-rose-600" : "border-primary bg-primary/10 text-primary shadow-[0_0_0_3px_hsl(var(--primary)/.08)]" : "border-border/70 bg-card text-foreground hover:border-primary/40 hover:bg-primary/[.035]")}>{children}</button>;
}

function GridCell({ active, disabled, onClick, label, children, className }: { active?: boolean; disabled?: boolean; onClick?: () => void; label: string; children?: React.ReactNode; className?: string }) {
  return <button type="button" disabled={disabled} aria-label={label} onClick={onClick} className={cn("aspect-square w-full touch-manipulation rounded-xl border text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", active ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_18px_hsl(var(--primary)/.18)]" : "border-border/70 bg-card hover:border-primary/55 hover:bg-primary/[.04]", disabled && "cursor-not-allowed border-border/50 bg-muted/70 text-muted-foreground/40 hover:border-border/50 hover:bg-muted/70", className)}>{children}</button>;
}

function ChoiceBoard({ game, state, setState, onComplete, onMistake, onMove }: GameBoardProps) {
  const puzzle = getChoicePuzzle(game.kind);
  const choose = (index: number) => {
    onMove();
    setState((current) => ({ ...current, answer: index }));
    if (index === puzzle.answer) onComplete(920);
    else onMistake();
  };
  const paletteColors = ["#635BFF", "#E16B77", "#2F9B86", "#E3A032"];

  return <div className="w-full max-w-[560px] text-center"><Rule text={puzzle.prompt} hint={puzzle.clue} /><div className="mb-6 rounded-2xl border border-border/60 bg-muted/35 p-5"><div className="mb-4 text-[10px] font-bold uppercase tracking-[.18em] text-primary">Reasoning panel</div><div className={cn("mx-auto grid max-w-[390px] items-center gap-3", puzzle.display === "matrix" ? "grid-cols-2" : "grid-cols-4")}>{puzzle.visual.map((item, index) => puzzle.display === "palette" ? <span key={item} className="flex flex-col items-center gap-2 text-[10px] font-bold text-muted-foreground"><span className="h-11 w-11 rounded-xl shadow-inner" style={{ backgroundColor: paletteColors[index % paletteColors.length] }} />{item}</span> : <span key={`${item}-${index}`} className={cn("flex min-h-12 items-center justify-center rounded-xl border border-border/60 bg-card px-2 font-display text-xl font-extrabold", item === "?" && "border-dashed border-primary/50 text-primary")}>{item}</span>)}</div></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{puzzle.options.map((option, index) => <ChoiceButton key={option} choiceIndex={index} active={state.answer === index} wrong={state.answer === index && index !== puzzle.answer} onClick={() => choose(index)}><span className="grid h-6 w-6 place-items-center rounded-lg bg-muted text-[10px] text-muted-foreground">{index + 1}</span>{puzzle.display === "palette" && <span className="h-4 w-4 rounded-md" style={{ backgroundColor: paletteColors[index] }} />}{option}</ChoiceButton>)}</div><p className="mt-4 text-[11px] font-semibold text-muted-foreground">Choose carefully. Wrong attempts cost points, but never lock the puzzle.</p></div>;
}

function LogicBoard({ game, state, setState, onComplete, onMistake, onMove, hintUsed }: GameBoardProps) {
  const kind = game.kind;
  if (kind === "number-grid") {
    return <div className="w-full max-w-[430px]"><Rule text="Fill every row and column with 1–4 exactly once." hint={hintUsed ? "The diagonal givens are already correct." : "Tap a cell to cycle 1 → 2 → 3 → 4 → blank."} /><CellGrid>{(i) => { const given = numberGiven.includes(i); return <GridCell label={`Number cell ${i + 1}`} disabled={given} onClick={() => { const cells = [...state.cells]; cells[i] = cells[i] === null ? 1 : Number(cells[i]) === 4 ? null : Number(cells[i]) + 1; onMove(); setState((current) => ({ ...current, cells })); if (cells.every((cell) => cell !== null)) { if (cells.every((cell, index) => cell === numberTarget[index])) onComplete(970); else onMistake(); } }} className="font-display text-xl">{state.cells[i] ?? <span className="text-muted-foreground/30">·</span>}</GridCell>; }}</CellGrid><p className="mt-4 text-center text-[11px] font-semibold text-muted-foreground">{numberGiven.length} cells are locked clues.</p></div>;
  }
  if (kind === "binary-grid") {
    return <div className="w-full max-w-[430px]"><Rule text="Complete the binary grid: each row has two 0s and two 1s, with no triples." hint={hintUsed ? "The first and last rows share the same rhythm." : "Tap a cell to cycle 0 → 1 → blank."} /><CellGrid>{(i) => { const given = binaryGiven.includes(i); return <GridCell label={`Binary cell ${i + 1}`} disabled={given} onClick={() => { const cells = [...state.cells]; cells[i] = cells[i] === null ? 0 : cells[i] === 0 ? 1 : null; onMove(); setState((current) => ({ ...current, cells })); if (cells.every((cell) => cell !== null)) { if (cells.every((cell, index) => cell === binaryTarget[index])) onComplete(940); else onMistake(); } }} className="font-display text-xl">{state.cells[i] ?? <span className="text-muted-foreground/30">·</span>}</GridCell>; }}</CellGrid></div>;
  }
  if (kind === "nonogram") {
    return <div className="w-full max-w-[430px]"><Rule text="Reveal the pixel picture from the row and column clues." hint={hintUsed ? "The first row begins with two filled cells." : "Tap: filled → marked empty → unknown."} /><div className="mb-4 grid grid-cols-4 gap-2 text-center text-[10px] font-bold text-muted-foreground"><span>1</span><span>3</span><span>2</span><span>2</span></div><CellGrid>{(i) => <GridCell label={`Nonogram cell ${i + 1}`} onClick={() => { const cells = [...state.cells]; cells[i] = cells[i] === null ? true : cells[i] === true ? false : null; onMove(); setState((current) => ({ ...current, cells })); if (cells.every((cell) => cell !== null)) { if (cells.every((cell, index) => Boolean(cell) === nonogramTarget[index])) onComplete(950); else onMistake(); } }} className={state.cells[i] === false ? "border-dashed bg-muted/30" : state.cells[i] === true ? "border-primary bg-primary" : "bg-card"}>{state.cells[i] === false ? <X className="mx-auto h-4 w-4 text-muted-foreground/60" /> : state.cells[i] === null ? <span className="text-muted-foreground/25">·</span> : null}</GridCell>}</CellGrid><div className="mt-4 flex justify-between text-[10px] font-bold text-muted-foreground"><span>Rows: 2 · 1 · 3 · 2</span><span>Columns: 1 · 3 · 2 · 2</span></div></div>;
  }
  if (kind === "mine-logic") {
    return <div className="w-full max-w-[430px]"><Rule text="Flag all four mines using the numbered clues. A wrong flag costs a life of score." hint={hintUsed ? "No mine is in the first row." : "Tap once to flag; tap again to remove a flag."} /><CellGrid>{(i) => { const flagged = state.selected.includes(i); return <GridCell label={`Mine logic cell ${i + 1}`} active={flagged} onClick={() => { const selected = flagged ? state.selected.filter((value) => value !== i) : [...state.selected, i]; onMove(); setState((current) => ({ ...current, selected })); if (!flagged && !mineLocations.includes(i)) onMistake(); if (selected.length === mineLocations.length) { if (selected.every((value) => mineLocations.includes(value))) onComplete(980); } }} className={flagged ? mineLocations.includes(i) ? "border-emerald-500 bg-emerald-500/15 text-emerald-600" : "border-rose-500 bg-rose-500/15 text-rose-600" : "bg-card"}>{flagged ? mineLocations.includes(i) ? <Check className="mx-auto h-5 w-5" /> : <X className="mx-auto h-5 w-5" /> : <span>{mineClues[i]}</span>}</GridCell>; }}</CellGrid><div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-bold text-muted-foreground"><Flag className="h-3.5 w-3.5 text-primary" /> {state.selected.length}/4 flags placed</div></div>;
  }
  if (kind === "pathfinder") {
    return <div className="w-full max-w-[430px]"><Rule text="Connect START to END through open cells without crossing an obstacle." hint={hintUsed ? "Stay on the top row until the first turn." : "Tap an adjacent cell. Use undo if you take a wrong turn."} /><CellGrid>{(i) => { const blocked = [5, 6, 10].includes(i); const inPath = state.path.includes(i); return <GridCell label={`Path cell ${i + 1}`} disabled={blocked} active={inPath} onClick={() => { const previous = state.path[state.path.length - 1]; if (inPath || blocked) return; if (!isAdjacent(previous, i)) { onMove(); onMistake(); return; } const path = [...state.path, i]; onMove(); setState((current) => ({ ...current, path })); if (path.length === pathSolution.length) { if (path.every((value, index) => value === pathSolution[index])) onComplete(980); else onMistake(); } }} className={cn(i === 0 && "border-emerald-500 bg-emerald-500/10 text-emerald-600", i === 15 && "border-rose-500 bg-rose-500/10 text-rose-600", blocked && "bg-muted")}>{i === 0 ? "START" : i === 15 ? "END" : blocked ? <Lock className="mx-auto h-4 w-4" /> : inPath ? state.path.indexOf(i) + 1 : ""}</GridCell>; }}</CellGrid><Button type="button" variant="outline" disabled={state.path.length <= 1} onClick={() => { onMove(); setState((current) => ({ ...current, path: current.path.slice(0, -1) })); }} className="mt-5 h-9 rounded-xl text-xs font-bold"><ChevronLeft className="mr-1 h-3.5 w-3.5" /> Undo step</Button></div>;
  }
  if (kind === "switchboard") {
    return <div className="w-full max-w-[430px]"><Rule text="Turn every light on. Each switch toggles itself and its orthogonal neighbors." hint={hintUsed ? "Try the center and corner switches in pairs." : "The board is always solvable; look for changes, not just lights."} /><div className="mx-auto grid max-w-[310px] grid-cols-3 gap-2">{state.lights.map((isOn, i) => <GridCell key={i} label={`Switch ${i + 1}`} active={isOn} onClick={() => { const lights = [...state.lights]; [i, i - 1, i + 1, i - 3, i + 3].forEach((index) => { if (index >= 0 && index < 9 && !(index === i - 1 && i % 3 === 0) && !(index === i + 1 && i % 3 === 2)) lights[index] = !lights[index]; }); onMove(); setState((current) => ({ ...current, lights })); if (lights.every(Boolean)) onComplete(955); }} className={cn("aspect-square", isOn ? "border-amber-400 bg-amber-300/80 text-amber-950 shadow-[0_0_24px_rgb(251_191_36_/_0.3)]" : "bg-card")}><Lightbulb className="mx-auto h-5 w-5" /></GridCell>)}</div></div>;
  }
  return <ChoiceBoard game={game} state={state} setState={setState} onComplete={onComplete} onMistake={onMistake} onMove={onMove} hintUsed={hintUsed} />;
}

function SpatialBoard({ game, state, setState, onComplete, onMistake, onMove, hintUsed }: GameBoardProps) {
  if (game.kind === "mirror-world") {
    const target = mirrorTarget.map((_, index) => { const row = Math.floor(index / 4) * 4; return mirrorTarget[row + 3 - (index % 4)]; });
    return <div className="w-full max-w-[500px]"><Rule text="Rebuild the shape on the opposite side of the mirror." hint={hintUsed ? "The top-right cell is part of the reflection." : "The left shape is reflected across a vertical axis."} /><div className="grid grid-cols-2 gap-5"><div><p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">Original</p><CellGrid>{(i) => <span className={cn("aspect-square rounded-lg border border-border/60", mirrorTarget[i] ? "bg-primary" : "bg-muted/40")} />}</CellGrid></div><div><p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[.15em] text-primary">Reflection</p><CellGrid>{(i) => <GridCell label={`Reflection cell ${i + 1}`} active={Boolean(state.cells[i])} onClick={() => { const cells = [...state.cells]; cells[i] = !cells[i]; onMove(); setState((current) => ({ ...current, cells })); const selected = cells.filter(Boolean).length; if (selected === target.filter(Boolean).length) { if (cells.every((cell, index) => Boolean(cell) === target[index])) onComplete(930); else onMistake(); } }} />}</CellGrid></div></div></div>;
  }
  return <ChoiceBoard game={game} state={state} setState={setState} onComplete={onComplete} onMistake={onMistake} onMove={onMove} hintUsed={hintUsed} />;
}

function MemoryBoard({ game, state, setState, onComplete, onMistake, onMove, hintUsed }: GameBoardProps) {
  const kind = game.kind;
  const target = kind === "flash-grid" ? flashTarget : kind === "symbol-recall" ? symbolTarget : hiddenPatternTarget;
  if (["flash-grid", "symbol-recall", "hidden-pattern"].includes(kind)) {
    return <div className="w-full max-w-[450px] text-center"><Rule text={state.show ? "Study the highlighted pattern, then hide it." : "Recreate every highlighted cell from memory."} hint={hintUsed ? `Hint: the pattern includes cell ${target[0] + 1}.` : "There is no penalty for taking time before you hide the pattern."} /><CellGrid>{(i) => <GridCell label={`Memory cell ${i + 1}`} disabled={state.show} active={state.show ? target.includes(i) : state.selected.includes(i)} onClick={() => { if (state.show) return; const selected = state.selected.includes(i) ? state.selected.filter((value) => value !== i) : [...state.selected, i]; onMove(); setState((current) => ({ ...current, selected })); if (!target.includes(i)) onMistake(); if (selected.length === target.length) { if (selected.every((value) => target.includes(value))) onComplete(960); else onMistake(); } }}>{state.show && kind === "symbol-recall" && target.includes(i) ? symbols[i % symbols.length] : state.show ? "" : state.selected.includes(i) ? <Check className="mx-auto h-4 w-4" /> : ""}</GridCell>}</CellGrid>{state.show ? <Button type="button" onClick={() => setState((current) => ({ ...current, show: false }))} className="mt-6 h-10 rounded-xl px-5 text-xs font-bold"><EyeIcon /> Hide pattern</Button> : <p className="mt-4 text-[11px] font-semibold text-muted-foreground">{state.selected.length}/{target.length} cells selected</p>}</div>;
  }
  if (kind === "sequence-memory") {
    return <div className="w-full max-w-[450px] text-center"><Rule text={state.show ? "Memorize the signal order, then repeat it." : "Repeat the sequence in order."} hint={hintUsed ? `The sequence starts on cell ${sequenceTarget[0] + 1}.` : "A wrong tap resets the sequence, so slow down."} /><div className="mx-auto grid max-w-[310px] grid-cols-4 gap-2">{Array.from({ length: 8 }, (_, i) => <GridCell key={i} label={`Sequence signal ${i + 1}`} disabled={state.show} active={state.show && sequenceTarget.includes(i)} onClick={() => { if (state.show) return; const input = [...state.input, i]; onMove(); if (i !== sequenceTarget[input.length - 1]) { onMistake(); setState((current) => ({ ...current, input: [] })); return; } setState((current) => ({ ...current, input })); if (input.length === sequenceTarget.length) onComplete(990); }}>{state.show && sequenceTarget.includes(i) ? i + 1 : state.input.includes(i) ? <Check className="mx-auto h-4 w-4" /> : i + 1}</GridCell>)}</div>{state.show && <Button type="button" onClick={() => setState((current) => ({ ...current, show: false }))} className="mt-6 h-10 rounded-xl px-5 text-xs font-bold"><EyeIcon /> Hide sequence</Button>}{!state.show && <p className="mt-4 text-[11px] font-semibold text-muted-foreground">{state.input.length}/{sequenceTarget.length} correct signals</p>}</div>;
  }
  return <div className="w-full max-w-[500px] text-center"><Rule text="One tile changed between the two scenes. Find it." hint={hintUsed ? "Look in the third row." : "Compare position and color, not just the outline."} /><div className="grid grid-cols-2 gap-5"><Scene title="Before" changed={false} /><div><p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[.15em] text-primary">After</p><div className="grid grid-cols-4 gap-2 rounded-2xl bg-muted/40 p-3">{Array.from({ length: 16 }, (_, i) => <button type="button" aria-label={`Changed scene tile ${i + 1}`} key={i} onClick={() => { onMove(); if (i === 9) onComplete(950); else onMistake(); }} className={cn("aspect-square rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", changeScene.includes(i) ? "bg-primary" : "border-border/60 bg-card hover:border-primary")} />)}</div></div></div></div>;
}

function Scene({ title, changed }: { title: string; changed: boolean }) {
  return <div><p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">{title}</p><div className="grid grid-cols-4 gap-2 rounded-2xl bg-muted/40 p-3">{Array.from({ length: 16 }, (_, i) => <span key={i} className={cn("aspect-square rounded-lg border border-border/60", (changed ? changeScene : beforeScene).includes(i) ? "bg-primary" : "bg-card")} />)}</div></div>;
}

function EyeIcon() {
  return <span className="mr-2 inline-block h-3.5 w-3.5 rounded-full border-2 border-current" aria-hidden="true" />;
}

export function GameBoard(props: GameBoardProps) {
  const logicKinds: GameKind[] = ["number-grid", "mine-logic", "nonogram", "binary-grid", "pathfinder", "region-rules", "perfect-placement", "switchboard", "rule-breaker", "constraint-master", "one-move", "mystery-network", "daily-mystery", "pattern-shift", "odd-one-out", "matrix-mystery", "color-logic", "sequence-detective", "rotation-puzzle", "cube-explorer", "shadow-match", "shape-packing"];
  if (logicKinds.includes(props.game.kind)) return <LogicBoard {...props} />;
  if (["mirror-world"].includes(props.game.kind)) return <SpatialBoard {...props} />;
  if (["flash-grid", "symbol-recall", "change-detector", "sequence-memory", "hidden-pattern"].includes(props.game.kind)) return <MemoryBoard {...props} />;
  return <ChoiceBoard {...props} />;
}

export function createInitialPuzzleState(kind: GameKind): PuzzleState {
  const cells: Array<number | boolean | null> = Array(16).fill(null);
  if (kind === "number-grid") numberGiven.forEach((index) => { cells[index] = numberTarget[index]; });
  if (kind === "binary-grid") binaryGiven.forEach((index) => { cells[index] = binaryTarget[index]; });
  const lights = kind === "switchboard" ? [false, true, true, true, false, true, true, true, false] : Array(9).fill(false);
  return { cells, selected: [], path: [0], lights, input: [], show: ["flash-grid", "symbol-recall", "sequence-memory", "hidden-pattern"].includes(kind), answer: null };
}
