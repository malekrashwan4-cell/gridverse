import { Check, ChevronLeft, Flag, Lightbulb, Lock, X } from "lucide-react";
import type { Game, GameKind } from "@/data/games";
import type { ChallengeConfig } from "@/lib/difficulty";
import { getGivenIndices, getMemoryTarget, getMineClues, getMineTargets, getMirrorTarget, getPathObstacles, getPathTarget, getSceneTargets, getSequenceTarget, getSwitchStart } from "@/lib/challenge-data";
import { binaryTarget, getChoicePuzzle, isAdjacent, nonogramTarget, numberTarget } from "@/lib/gameplay";
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
  choiceStreak: number;
};

type GameBoardProps = {
  game: Game;
  state: PuzzleState;
  setState: React.Dispatch<React.SetStateAction<PuzzleState>>;
  challenge: ChallengeConfig;
  onComplete: () => void;
  onMistake: () => void;
  onMove: () => void;
  hintUsed: boolean;
};

const symbols = ["◆", "●", "▲", "✚", "■", "✦"];

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

function ChoiceBoard({ game, state, setState, challenge, onComplete, onMistake, onMove }: GameBoardProps) {
  const puzzle = getChoicePuzzle(game.kind);
  const shift = state.choiceStreak % puzzle.options.length;
  const options = puzzle.options.map((_, index) => puzzle.options[(index + shift) % puzzle.options.length]);
  const answer = (puzzle.answer - shift + puzzle.options.length) % puzzle.options.length;
  const choose = (index: number) => {
    onMove();
    const nextStreak = state.choiceStreak + (index === answer ? 1 : 0);
    setState((current) => ({ ...current, answer: index === answer ? index : null, choiceStreak: index === answer ? nextStreak : 0 }));
    if (index === answer && nextStreak >= challenge.choiceRounds) onComplete();
    if (index !== answer) onMistake();
  };
  const paletteColors = ["#635BFF", "#E16B77", "#2F9B86", "#E3A032"];

  return <div className="w-full max-w-[560px] text-center"><Rule text={challenge.choiceRounds > 1 ? `${puzzle.prompt} · Round ${Math.min(state.choiceStreak + 1, challenge.choiceRounds)} of ${challenge.choiceRounds}` : puzzle.prompt} hint={`${puzzle.clue} ${challenge.choiceRounds > 1 ? "Keep the rule in mind: consecutive correct answers are required." : ""}`} /><div className="mb-6 rounded-2xl border border-border/60 bg-muted/35 p-5"><div className="mb-4 text-[10px] font-bold uppercase tracking-[.18em] text-primary">Reasoning panel</div><div className={cn("mx-auto grid max-w-[390px] items-center gap-3", puzzle.display === "matrix" ? "grid-cols-2" : "grid-cols-4")}>{puzzle.visual.map((item, index) => puzzle.display === "palette" ? <span key={item} className="flex flex-col items-center gap-2 text-[10px] font-bold text-muted-foreground"><span className="h-11 w-11 rounded-xl shadow-inner" style={{ backgroundColor: paletteColors[(index + shift) % paletteColors.length] }} />{item}</span> : <span key={`${item}-${index}`} className={cn("flex min-h-12 items-center justify-center rounded-xl border border-border/60 bg-card px-2 font-display text-xl font-extrabold", item === "?" && "border-dashed border-primary/50 text-primary")}>{item}</span>)}</div></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{options.map((option, index) => <ChoiceButton key={`${option}-${index}`} choiceIndex={index} active={state.answer === index} wrong={state.answer === index && index !== answer} onClick={() => choose(index)}><span className="grid h-6 w-6 place-items-center rounded-lg bg-muted text-[10px] text-muted-foreground">{index + 1}</span>{puzzle.display === "palette" && <span className="h-4 w-4 rounded-md" style={{ backgroundColor: paletteColors[(index + shift) % paletteColors.length] }} />}{option}</ChoiceButton>)}</div><p className="mt-4 text-[11px] font-semibold text-muted-foreground">{challenge.choiceRounds > 1 ? `${state.choiceStreak}/${challenge.choiceRounds} correct rounds · one wrong answer costs a mistake` : "Choose carefully. Wrong attempts cost points, but never hide the rule."}</p></div>;
}

function LogicBoard({ game, state, setState, challenge, onComplete, onMistake, onMove, hintUsed }: GameBoardProps) {
  const kind = game.kind;
  const mineClues = getMineClues(challenge);
  if (kind === "number-grid" || kind === "binary-grid") {
    const target = kind === "number-grid" ? numberTarget : binaryTarget;
    const givens = getGivenIndices(kind, challenge);
    const binary = kind === "binary-grid";
    return <div className="w-full max-w-[430px]"><Rule text={binary ? "Complete the binary grid: every row has two 0s and two 1s, with no triples." : "Fill every row and column with 1–4 exactly once."} hint={hintUsed ? "Use the locked clues as anchors, then eliminate candidates." : binary ? "Tap to cycle 0 → 1 → blank." : "Tap to cycle 1 → 2 → 3 → 4 → blank."} /><CellGrid>{(i) => { const given = givens.includes(i); return <GridCell label={`${binary ? "Binary" : "Number"} cell ${i + 1}`} disabled={given} onClick={() => { const cells = [...state.cells]; cells[i] = binary ? cells[i] === null ? 0 : cells[i] === 0 ? 1 : null : cells[i] === null ? 1 : Number(cells[i]) === 4 ? null : Number(cells[i]) + 1; onMove(); setState((current) => ({ ...current, cells })); if (cells.every((cell) => cell !== null)) { if (cells.every((cell, index) => cell === target[index])) onComplete(); else onMistake(); } }} className="font-display text-xl">{state.cells[i] ?? <span className="text-muted-foreground/30">·</span>}</GridCell>; }}</CellGrid><p className="mt-4 text-center text-[11px] font-semibold text-muted-foreground">{givens.length} locked clues · Stage {challenge.stage}/3</p></div>;
  }
  if (kind === "nonogram") {
    return <div className="w-full max-w-[430px]"><Rule text="Reveal the pixel picture from the row and column clues." hint={hintUsed ? "The first row begins with two filled cells." : "Tap: filled → marked empty → unknown."} /><div className="mb-4 grid grid-cols-4 gap-2 text-center text-[10px] font-bold text-muted-foreground"><span>1</span><span>3</span><span>2</span><span>2</span></div><CellGrid>{(i) => <GridCell label={`Nonogram cell ${i + 1}`} onClick={() => { const cells = [...state.cells]; cells[i] = cells[i] === null ? true : cells[i] === true ? false : null; onMove(); setState((current) => ({ ...current, cells })); if (cells.every((cell) => cell !== null)) { if (cells.every((cell, index) => Boolean(cell) === nonogramTarget[index])) onComplete(); else onMistake(); } }} className={state.cells[i] === false ? "border-dashed bg-muted/30" : state.cells[i] === true ? "border-primary bg-primary" : "bg-card"}>{state.cells[i] === false ? <X className="mx-auto h-4 w-4 text-muted-foreground/60" /> : state.cells[i] === null ? <span className="text-muted-foreground/25">·</span> : null}</GridCell>}</CellGrid><div className="mt-4 flex justify-between text-[10px] font-bold text-muted-foreground"><span>Rows: 2 · 1 · 3 · 2</span><span>Columns: 1 · 3 · 2 · 2</span></div></div>;
  }
  if (kind === "mine-logic") {
    const mines = getMineTargets(challenge);
    return <div className="w-full max-w-[430px]"><Rule text={`Flag all ${mines.length} mines using the numbered clues. An incorrect flag consumes a mistake.`} hint={hintUsed ? "Start with cells whose clue count is unique in its neighborhood." : "Hard stages hide more mines and demand more deduction before flagging."} /><CellGrid>{(i) => { const flagged = state.selected.includes(i); return <GridCell label={`Mine logic cell ${i + 1}`} active={flagged} onClick={() => { const selected = flagged ? state.selected.filter((value) => value !== i) : [...state.selected, i]; onMove(); setState((current) => ({ ...current, selected })); if (!flagged && !mines.includes(i)) onMistake(); if (selected.length === mines.length && selected.every((value) => mines.includes(value))) onComplete(); }} className={flagged ? mines.includes(i) ? "border-emerald-500 bg-emerald-500/15 text-emerald-600" : "border-rose-500 bg-rose-500/15 text-rose-600" : "bg-card"}>{flagged ? mines.includes(i) ? <Check className="mx-auto h-5 w-5" /> : <X className="mx-auto h-5 w-5" /> : <span>{mineClues[i]}</span>}</GridCell>; }}</CellGrid><div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-bold text-muted-foreground"><Flag className="h-3.5 w-3.5 text-primary" /> {state.selected.length}/{mines.length} flags placed</div></div>;
  }
  if (kind === "pathfinder") {
    const target = getPathTarget(challenge);
    const obstacles = getPathObstacles(challenge);
    const end = target[target.length - 1];
    return <div className="w-full max-w-[430px]"><Rule text="Reach END through adjacent open cells without crossing an obstacle or revisiting a cell." hint={hintUsed ? "The first turn is still along the top row." : `Stage ${challenge.stage} adds ${Math.max(0, target.length - 7)} planning step${target.length - 7 === 1 ? "" : "s"}. Undo is available, but costs a move.`} /><CellGrid>{(i) => { const blocked = obstacles.includes(i); const inPath = state.path.includes(i); return <GridCell label={`Path cell ${i + 1}`} disabled={blocked} active={inPath} onClick={() => { const previous = state.path[state.path.length - 1]; if (inPath || blocked) return; if (!isAdjacent(previous, i)) { onMove(); onMistake(); return; } const path = [...state.path, i]; onMove(); setState((current) => ({ ...current, path })); if (path.length === target.length) { if (path.every((value, index) => value === target[index])) onComplete(); else onMistake(); } }} className={cn(i === 0 && "border-emerald-500 bg-emerald-500/10 text-emerald-600", i === end && "border-rose-500 bg-rose-500/10 text-rose-600", blocked && "bg-muted")}>{i === 0 ? "START" : i === end ? "END" : blocked ? <Lock className="mx-auto h-4 w-4" /> : inPath ? state.path.indexOf(i) + 1 : ""}</GridCell>; }}</CellGrid><Button type="button" variant="outline" disabled={state.path.length <= 1} onClick={() => { onMove(); setState((current) => ({ ...current, path: current.path.slice(0, -1) })); }} className="mt-5 h-9 rounded-xl text-xs font-bold"><ChevronLeft className="mr-1 h-3.5 w-3.5" /> Undo step</Button></div>;
  }
  if (kind === "switchboard") {
    return <div className="w-full max-w-[430px]"><Rule text="Turn every light on. Each switch toggles itself and its orthogonal neighbors." hint={hintUsed ? "Look for pairs of switches that cancel each other." : `Stage ${challenge.stage} starts from a different solvable pattern. Find the shortest sequence.`} /><div className="mx-auto grid max-w-[310px] grid-cols-3 gap-2">{state.lights.map((isOn, i) => <GridCell key={i} label={`Switch ${i + 1}`} active={isOn} onClick={() => { const lights = [...state.lights]; [i, i - 1, i + 1, i - 3, i + 3].forEach((index) => { if (index >= 0 && index < 9 && !(index === i - 1 && i % 3 === 0) && !(index === i + 1 && i % 3 === 2)) lights[index] = !lights[index]; }); onMove(); setState((current) => ({ ...current, lights })); if (lights.every(Boolean)) onComplete(); }} className={cn("aspect-square", isOn ? "border-amber-400 bg-amber-300/80 text-amber-950 shadow-[0_0_24px_rgb(251_191_36_/_0.3)]" : "bg-card")}><Lightbulb className="mx-auto h-5 w-5" /></GridCell>)}</div></div>;
  }
  return <ChoiceBoard game={game} state={state} setState={setState} challenge={challenge} onComplete={onComplete} onMistake={onMistake} onMove={onMove} hintUsed={hintUsed} />;
}

function SpatialBoard({ game, state, setState, challenge, onComplete, onMistake, onMove, hintUsed }: GameBoardProps) {
  if (game.kind === "mirror-world") {
    const original = getMirrorTarget(challenge);
    const target = original.map((_, index) => { const row = Math.floor(index / 4) * 4; return original[row + 3 - (index % 4)]; });
    return <div className="w-full max-w-[500px]"><Rule text="Rebuild the shape on the opposite side of the mirror." hint={hintUsed ? "The top-right cell is part of the reflection." : `The silhouette has ${target.filter(Boolean).length} cells at this stage; avoid relying on symmetry shortcuts.`} /><div className="grid grid-cols-2 gap-5"><div><p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">Original</p><CellGrid>{(i) => <span className={cn("aspect-square rounded-lg border border-border/60", original[i] ? "bg-primary" : "bg-muted/40")} />}</CellGrid></div><div><p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[.15em] text-primary">Reflection</p><CellGrid>{(i) => <GridCell label={`Reflection cell ${i + 1}`} active={Boolean(state.cells[i])} onClick={() => { const cells = [...state.cells]; cells[i] = !cells[i]; onMove(); setState((current) => ({ ...current, cells })); const selected = cells.filter(Boolean).length; if (selected === target.filter(Boolean).length) { if (cells.every((cell, index) => Boolean(cell) === target[index])) onComplete(); else onMistake(); } }} />}</CellGrid></div></div></div>;
  }
  return <ChoiceBoard game={game} state={state} setState={setState} challenge={challenge} onComplete={onComplete} onMistake={onMistake} onMove={onMove} hintUsed={hintUsed} />;
}

function MemoryBoard({ game, state, setState, challenge, onComplete, onMistake, onMove, hintUsed }: GameBoardProps) {
  const kind = game.kind;
  const target: number[] = getMemoryTarget(kind, challenge);
  if (["flash-grid", "symbol-recall", "hidden-pattern"].includes(kind)) {
    return <div className="w-full max-w-[450px] text-center"><Rule text={state.show ? "Study the highlighted pattern, then hide it." : "Recreate every highlighted cell from memory."} hint={hintUsed ? `Hint: the pattern includes cell ${target[0] + 1}.` : `${target.length} cells must be recalled at this stage.`} /><CellGrid>{(i) => <GridCell label={`Memory cell ${i + 1}`} disabled={state.show} active={state.show ? target.includes(i) : state.selected.includes(i)} onClick={() => { if (state.show) return; const selected = state.selected.includes(i) ? state.selected.filter((value) => value !== i) : [...state.selected, i]; onMove(); setState((current) => ({ ...current, selected })); if (!target.includes(i)) onMistake(); if (selected.length === target.length) { if (selected.every((value) => target.includes(value))) onComplete(); else onMistake(); } }}>{state.show && kind === "symbol-recall" && target.includes(i) ? symbols[i % symbols.length] : state.show ? "" : state.selected.includes(i) ? <Check className="mx-auto h-4 w-4" /> : ""}</GridCell>}</CellGrid>{state.show ? <Button type="button" onClick={() => setState((current) => ({ ...current, show: false }))} className="mt-6 h-10 rounded-xl px-5 text-xs font-bold">Hide pattern</Button> : <p className="mt-4 text-[11px] font-semibold text-muted-foreground">{state.selected.length}/{target.length} cells selected</p>}</div>;
  }
  if (kind === "sequence-memory") {
    const sequence = getSequenceTarget(challenge);
    return <div className="w-full max-w-[450px] text-center"><Rule text={state.show ? "Memorize the signal order, then repeat it." : "Repeat the sequence in order."} hint={hintUsed ? `The sequence starts on cell ${sequence[0] + 1}.` : `${sequence.length} signals are chained at this stage. A wrong tap resets the chain.`} /><div className="mx-auto grid max-w-[310px] grid-cols-4 gap-2">{Array.from({ length: 8 }, (_, i) => <GridCell key={i} label={`Sequence signal ${i + 1}`} disabled={state.show} active={state.show && sequence.includes(i)} onClick={() => { if (state.show) return; const input = [...state.input, i]; onMove(); if (i !== sequence[input.length - 1]) { onMistake(); setState((current) => ({ ...current, input: [] })); return; } setState((current) => ({ ...current, input })); if (input.length === sequence.length) onComplete(); }}>{state.show && sequence.includes(i) ? i + 1 : state.input.includes(i) ? <Check className="mx-auto h-4 w-4" /> : i + 1}</GridCell>)}</div>{state.show && <Button type="button" onClick={() => setState((current) => ({ ...current, show: false }))} className="mt-6 h-10 rounded-xl px-5 text-xs font-bold">Hide sequence</Button>}{!state.show && <p className="mt-4 text-[11px] font-semibold text-muted-foreground">{state.input.length}/{sequence.length} correct signals</p>}</div>;
  }
  const scenes = getSceneTargets(challenge);
  return <div className="w-full max-w-[500px] text-center"><Rule text={`Find all ${scenes.changed.length} changed tiles between the two scenes.`} hint={hintUsed ? `One changed tile is in the third row.` : "Select every changed tile; selecting a stable tile costs a mistake."} /><div className="grid grid-cols-2 gap-5"><Scene title="Before" cells={scenes.before} /><div><p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[.15em] text-primary">After</p><div className="grid grid-cols-4 gap-2 rounded-2xl bg-muted/40 p-3">{Array.from({ length: 16 }, (_, i) => <button type="button" aria-label={`Changed scene tile ${i + 1}`} key={i} onClick={() => { const selected = state.selected.includes(i) ? state.selected.filter((value) => value !== i) : [...state.selected, i]; onMove(); setState((current) => ({ ...current, selected })); if (!scenes.changed.includes(i)) onMistake(); if (selected.length === scenes.changed.length && selected.every((value) => scenes.changed.includes(value))) onComplete(); }} className={cn("aspect-square rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", scenes.after.includes(i) ? "bg-primary" : "border-border/60 bg-card hover:border-primary", state.selected.includes(i) && "ring-2 ring-primary ring-offset-1")} />)}</div></div></div></div>;
}

function Scene({ title, cells }: { title: string; cells: number[] }) {
  return <div><p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">{title}</p><div className="grid grid-cols-4 gap-2 rounded-2xl bg-muted/40 p-3">{Array.from({ length: 16 }, (_, i) => <span key={i} className={cn("aspect-square rounded-lg border border-border/60", cells.includes(i) ? "bg-primary" : "bg-card")} />)}</div></div>;
}

function isChoiceKind(kind: GameKind) {
  return ["region-rules", "perfect-placement", "pattern-shift", "odd-one-out", "matrix-mystery", "color-logic", "sequence-detective", "shape-packing", "rotation-puzzle", "cube-explorer", "shadow-match", "rule-breaker", "mystery-network", "one-move", "constraint-master", "daily-mystery"].includes(kind);
}

export function GameBoard(props: GameBoardProps) {
  if (isChoiceKind(props.game.kind)) return <ChoiceBoard {...props} />;
  if (["number-grid", "mine-logic", "nonogram", "binary-grid", "pathfinder", "switchboard"].includes(props.game.kind)) return <LogicBoard {...props} />;
  if (props.game.kind === "mirror-world") return <SpatialBoard {...props} />;
  return <MemoryBoard {...props} />;
}

export function createInitialPuzzleState(kind: GameKind, challenge: ChallengeConfig): PuzzleState {
  const safeChallenge = challenge?.tier === 2 || challenge?.tier === 3 ? challenge : { mode: "normal" as const, stage: 1 as const, tier: 1 as const, label: "Normal", description: "Learn the rule with generous recovery room.", maxMistakes: Number.POSITIVE_INFINITY, maxMoves: Number.POSITIVE_INFINITY, canUseHint: true, choiceRounds: 1 };
  const cells: Array<number | boolean | null> = Array(16).fill(null);
  if (kind === "number-grid") getGivenIndices(kind, safeChallenge).forEach((index) => { cells[index] = numberTarget[index]; });
  if (kind === "binary-grid") getGivenIndices(kind, safeChallenge).forEach((index) => { cells[index] = binaryTarget[index]; });
  const lights = kind === "switchboard" ? getSwitchStart(safeChallenge) : Array(9).fill(false) as boolean[];
  return { cells, selected: [], path: [0], lights, input: [], show: ["flash-grid", "symbol-recall", "sequence-memory", "hidden-pattern"].includes(kind), answer: null, choiceStreak: 0 };
}
