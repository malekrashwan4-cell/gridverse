import { useEffect, useState } from "react";
import { Check, ChevronLeft, Flag, Lightbulb, Lock, RotateCw, X } from "lucide-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { Game, GameKind } from "@/data/games";
import type { ChallengeConfig } from "@/lib/difficulty";
import { getGivenIndices, getMemoryTarget, getMineClues, getMineTargets, getMirrorTarget, getPathObstacles, getSceneTargets, getSequenceTarget, getSwitchStart } from "@/lib/challenge-data";
import { getChoicePuzzle, getDailyMysteryPuzzle, getGridPuzzle, getMatrixMysteryPuzzle, getNonogramClues, getOddOneOutPuzzle, getPatternShiftPuzzle, getSequenceDetectivePuzzle, getSymbolLayout, isAdjacent, isValidBinaryGrid, isValidColorArrangement, isValidMirrorSolution, isValidNetwork, isValidNumberGrid, isValidPath, isValidSwitchboard, matchesNonogramClues, nonogramTarget, revealSafeCells, symbols } from "@/lib/gameplay";
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
  flags: number[];
  revealed: number[];
  mineMode: "reveal" | "flag";
};

type GameBoardProps = {
  game: Game;
  state: PuzzleState;
  setState: Dispatch<SetStateAction<PuzzleState>>;
  challenge: ChallengeConfig;
  onComplete: () => void;
  onMistake: () => void;
  onMove: () => void;
  hintUsed: boolean;
};

function Rule({ text, hint }: { text: string; hint?: string }) {
  return <div className="mb-5 rounded-2xl border border-border/60 bg-card/80 p-4 text-center text-xs font-semibold leading-5 text-muted-foreground"><span>{text}</span>{hint && <p className="mt-2 font-bold text-primary">{hint}</p>}</div>;
}

function CellGrid({ children, count = 16, className }: { children: (index: number) => ReactNode; count?: number; className?: string }) {
  return <div className={cn("grid grid-cols-4 gap-2", className)}>{Array.from({ length: count }, (_, index) => <div key={index}>{children(index)}</div>)}</div>;
}

function ChoiceButton({ active, onClick, children, wrong, choiceIndex }: { active?: boolean; onClick: () => void; children: ReactNode; wrong?: boolean; choiceIndex?: number }) {
  return <button type="button" data-choice-index={choiceIndex} onClick={onClick} aria-pressed={active} className={cn("flex min-h-12 touch-manipulation items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition hover:-translate-y-0.5 active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2", active ? wrong ? "border-rose-500 bg-rose-500/10 text-rose-600" : "border-primary bg-primary/10 text-primary shadow-[0_0_0_3px_hsl(var(--primary)/.08)]" : "border-border/70 bg-card text-foreground hover:border-primary/40 hover:bg-primary/[.035]")}>{children}</button>;
}

function GridCell({ active, disabled, onClick, label, children, className }: { active?: boolean; disabled?: boolean; onClick?: () => void; label: string; children?: ReactNode; className?: string }) {
  return <button type="button" disabled={disabled} aria-label={label} onClick={onClick} className={cn("aspect-square w-full touch-manipulation rounded-xl border text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", active ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_18px_hsl(var(--primary)/.18)]" : "border-border/70 bg-card hover:border-primary/55 hover:bg-primary/[.04]", disabled && "cursor-not-allowed border-border/50 bg-muted/70 text-muted-foreground/60 hover:border-border/50 hover:bg-muted/70", className)}>{children}</button>;
}

function ChoiceBoard({ game, state, setState, challenge, onComplete, onMistake, onMove }: GameBoardProps) {
  const puzzle = getChoicePuzzle(game.kind, challenge.stage);
  const choose = (index: number) => {
    onMove();
    const correct = index === puzzle.answer;
    const nextStreak = correct ? state.choiceStreak + 1 : 0;
    setState((current) => ({ ...current, answer: correct ? index : null, choiceStreak: nextStreak }));
    if (correct && nextStreak >= challenge.choiceRounds) onComplete();
    if (!correct) onMistake();
  };
  return <div className="w-full max-w-[560px] text-center"><Rule text={challenge.choiceRounds > 1 ? `${puzzle.prompt} · Round ${Math.min(state.choiceStreak + 1, challenge.choiceRounds)} of ${challenge.choiceRounds}` : puzzle.prompt} hint={`${puzzle.clue} ${challenge.choiceRounds > 1 ? "Consecutive correct answers are required." : ""}`} /><div className="mb-6 rounded-2xl border border-border/60 bg-muted/35 p-5"><div className="mb-4 text-[10px] font-bold uppercase tracking-[.18em] text-primary">{puzzle.display === "matrix" ? "Relationship matrix" : puzzle.display === "network" ? "Evidence board" : "Reasoning panel"}</div><div className={cn("mx-auto grid max-w-[390px] items-center gap-3", puzzle.display === "matrix" ? "grid-cols-2" : "grid-cols-4")}>{puzzle.visual.map((item, index) => <span key={`${item}-${index}`} className={cn("flex min-h-12 items-center justify-center rounded-xl border border-border/60 bg-card px-2 font-display text-xl font-extrabold", item === "?" && "border-dashed border-primary/50 text-primary")}>{item}</span>)}</div></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{puzzle.options.map((option, index) => <ChoiceButton key={`${puzzle.id}-${index}`} choiceIndex={index} active={state.answer === index} wrong={state.answer === index && index !== puzzle.answer} onClick={() => choose(index)}><span className="grid h-6 w-6 place-items-center rounded-lg bg-muted text-[10px] text-muted-foreground">{index + 1}</span>{option}</ChoiceButton>)}</div><p className="mt-4 text-[11px] font-semibold text-muted-foreground">{challenge.choiceRounds > 1 ? `${state.choiceStreak}/${challenge.choiceRounds} correct rounds` : "Wrong attempts cost a mistake, but the puzzle remains visible."}</p></div>;
}

function MineBoard({ state, setState, challenge, onComplete, onMistake, onMove, hintUsed }: GameBoardProps) {
  const mines = getMineTargets(challenge);
  const clues = getMineClues(challenge);
  const reveal = (index: number) => {
    if (state.revealed.includes(index) || state.flags.includes(index)) return;
    onMove();
    if (mines.includes(index)) {
      onMistake();
      setState((current) => ({ ...current, flags: current.flags.includes(index) ? current.flags : [...current.flags, index] }));
      return;
    }
    const revealed = revealSafeCells(index, clues, mines, state.revealed, state.flags);
    setState((current) => ({ ...current, revealed }));
    if (revealed.length >= 16 - mines.length) onComplete();
  };
  const toggleFlag = (index: number) => {
    if (state.revealed.includes(index)) return;
    onMove();
    const flags = state.flags.includes(index) ? state.flags.filter((value) => value !== index) : [...state.flags, index];
    setState((current) => ({ ...current, flags }));
  };
  return <div className="w-full max-w-[430px]"><Rule text={`Reveal every safe cell. There are ${mines.length} hidden mines; numbered clues count adjacent mines.`} hint={hintUsed ? "Zero clues expand automatically. Flag only cells you have reason to suspect." : "Reveal mode opens safe areas; flag mode marks candidates without revealing them."} /><div className="mb-4 flex justify-center gap-2"><Button type="button" variant={state.mineMode === "reveal" ? "default" : "outline"} onClick={() => setState((current) => ({ ...current, mineMode: "reveal" }))} className="h-9 rounded-xl text-xs font-bold">Reveal</Button><Button type="button" variant={state.mineMode === "flag" ? "default" : "outline"} onClick={() => setState((current) => ({ ...current, mineMode: "flag" }))} className="h-9 rounded-xl text-xs font-bold"><Flag className="mr-1.5 h-3.5 w-3.5" /> Flag</Button></div><CellGrid>{(i) => { const revealed = state.revealed.includes(i); const flagged = state.flags.includes(i); return <GridCell label={`Mine logic cell ${i + 1}`} disabled={revealed} active={flagged} onClick={() => state.mineMode === "flag" ? toggleFlag(i) : reveal(i)} className={cn(revealed && "border-primary/20 bg-muted/50", flagged && "border-amber-500 bg-amber-500/10 text-amber-600")}>{flagged ? <Flag className="mx-auto h-4 w-4" /> : revealed ? <span className="font-display">{clues[i] || "·"}</span> : <span className="text-muted-foreground/30">?</span>}</GridCell>; }}</CellGrid><div className="mt-4 flex items-center justify-center gap-4 text-[11px] font-bold text-muted-foreground"><span>{state.revealed.length}/{16 - mines.length} safe cells</span><span>{state.flags.length}/{mines.length} flags</span></div></div>;
}

function LogicBoard({ game, state, setState, challenge, onComplete, onMistake, onMove, hintUsed }: GameBoardProps) {
  const kind = game.kind;
  if (kind === "mine-logic") return <MineBoard game={game} state={state} setState={setState} challenge={challenge} onComplete={onComplete} onMistake={onMistake} onMove={onMove} hintUsed={hintUsed} />;
  if (kind === "number-grid" || kind === "binary-grid") {
    const binary = kind === "binary-grid";
    const givens = getGivenIndices(kind, challenge);
    const complete = (cells: Array<number | boolean | null>) => binary ? isValidBinaryGrid(cells) : isValidNumberGrid(cells);
    return <div className="w-full max-w-[430px]"><Rule text={binary ? "Complete the binary grid: every row and column has two of each value, with no triples or duplicate lines." : "Fill every row and column with 1–4 exactly once. Any valid Latin grid is accepted."} hint={hintUsed ? "Use locked clues as anchors and eliminate candidates from each line." : binary ? "Tap to cycle 0 → 1 → blank." : "Tap to cycle 1 → 2 → 3 → 4 → blank."} /><CellGrid>{(i) => { const given = givens.includes(i); return <GridCell label={`${binary ? "Binary" : "Number"} cell ${i + 1}`} disabled={given} onClick={() => { const cells = [...state.cells]; cells[i] = binary ? cells[i] === null ? 0 : cells[i] === 0 ? 1 : null : cells[i] === null ? 1 : Number(cells[i]) === 4 ? null : Number(cells[i]) + 1; onMove(); setState((current) => ({ ...current, cells })); if (cells.every((cell) => cell !== null)) { if (complete(cells)) onComplete(); else onMistake(); } }} className="font-display text-xl">{state.cells[i] ?? <span className="text-muted-foreground/30">·</span>}</GridCell>; }}</CellGrid><p className="mt-4 text-center text-[11px] font-semibold text-muted-foreground">{givens.length} generated clues · stage {challenge.stage}/3</p></div>;
  }
  if (kind === "nonogram") {
    const clues = getNonogramClues(nonogramTarget);
    return <div className="w-full max-w-[430px]"><Rule text="Reveal the pixel picture from the actual row and column clues." hint={hintUsed ? "Clues describe runs of adjacent filled cells, not total cells in a row." : "Tap: filled → marked empty → unknown. Any pattern matching the clues is valid."} /><div className="mb-4 grid grid-cols-4 gap-2 text-center text-[10px] font-bold text-muted-foreground">{clues.columns.map((clue, index) => <span key={index}>{clue.join(" ")}</span>)}</div><CellGrid>{(i) => <GridCell label={`Nonogram cell ${i + 1}`} onClick={() => { const cells = [...state.cells]; cells[i] = cells[i] === null ? true : cells[i] === true ? false : null; onMove(); setState((current) => ({ ...current, cells })); if (cells.every((cell) => cell !== null)) { if (matchesNonogramClues(cells, clues)) onComplete(); else onMistake(); } }} className={state.cells[i] === false ? "border-dashed bg-muted/30" : state.cells[i] === true ? "border-primary bg-primary" : "bg-card"}>{state.cells[i] === false ? <X className="mx-auto h-4 w-4 text-muted-foreground/60" /> : state.cells[i] === null ? <span className="text-muted-foreground/25">·</span> : null}</GridCell>}</CellGrid><div className="mt-4 flex justify-between text-[10px] font-bold text-muted-foreground"><span>Rows: {clues.rows.map((clue) => clue.join(" ")).join(" · ")}</span><span>Columns describe runs</span></div></div>;
  }
  if (kind === "pathfinder") {
    const obstacles = getPathObstacles(challenge);
    const end = 15;
    return <div className="w-full max-w-[430px]"><Rule text="Reach END through adjacent open cells without crossing an obstacle or revisiting a cell. Any legal route is accepted." hint={hintUsed ? "The endpoint is fixed at the lower-right cell. Undo only removes the last step." : "A shorter route earns a better score, but the objective is reaching the endpoint legally."} /><CellGrid>{(i) => { const blocked = obstacles.includes(i); const inPath = state.path.includes(i); return <GridCell label={`Path cell ${i + 1}`} disabled={blocked || inPath || state.path[state.path.length - 1] === end} active={inPath} onClick={() => { const previous = state.path[state.path.length - 1]; if (inPath || blocked || previous === end) return; if (!isAdjacent(previous, i)) { onMove(); onMistake(); return; } const path = [...state.path, i]; onMove(); setState((current) => ({ ...current, path })); if (isValidPath(path, obstacles, end)) onComplete(); }} className={cn(i === 0 && "border-emerald-500 bg-emerald-500/10 text-emerald-600", i === end && "border-rose-500 bg-rose-500/10 text-rose-600", blocked && "bg-muted")}>{i === 0 ? "START" : i === end ? "END" : blocked ? <Lock className="mx-auto h-4 w-4" /> : inPath ? state.path.indexOf(i) + 1 : ""}</GridCell>; }}</CellGrid><Button type="button" variant="outline" disabled={state.path.length <= 1} onClick={() => { onMove(); setState((current) => ({ ...current, path: current.path.slice(0, -1) })); }} className="mt-5 h-9 rounded-xl text-xs font-bold"><ChevronLeft className="mr-1 h-3.5 w-3.5" /> Undo step</Button></div>;
  }
  if (kind === "switchboard") return <div className="w-full max-w-[430px]"><Rule text="Turn every light on. Each switch toggles itself and its orthogonal neighbors." hint={hintUsed ? "Find pairs of switches that cancel each other, then finish with efficient moves." : `Generated solvable layout · stage ${challenge.stage}`} /><div className="mx-auto grid max-w-[310px] grid-cols-3 gap-2">{state.lights.map((isOn, i) => <GridCell key={i} label={`Switch ${i + 1}`} active={isOn} onClick={() => { const lights = [...state.lights]; [i, i - 1, i + 1, i - 3, i + 3].forEach((index) => { if (index >= 0 && index < 9 && !(index === i - 1 && i % 3 === 0) && !(index === i + 1 && i % 3 === 2)) lights[index] = !lights[index]; }); onMove(); setState((current) => ({ ...current, lights })); if (isValidSwitchboard(lights)) onComplete(); }} className={cn("aspect-square", isOn ? "border-amber-400 bg-amber-300/80 text-amber-950 shadow-[0_0_24px_rgb(251_191_36_/_0.3)]" : "bg-card")}><Lightbulb className="mx-auto h-5 w-5" /></GridCell>)}</div></div>;
  return <ChoiceBoard {...{ game, state, setState, challenge, onComplete, onMistake, onMove } as GameBoardProps} />;
}

function isRegionSolution(cells: Array<number | boolean | null>) {
  if (cells.some((cell) => typeof cell !== "number" || cell < 0 || cell > 2)) return false;
  return [0, 1, 2].every((region) => {
    const members = cells.flatMap((cell, index) => cell === region ? [index] : []);
    if (members.length !== 4) return false;
    const seen = new Set([members[0]]);
    const queue = [members[0]];
    while (queue.length) {
      const current = queue.shift()!;
      [current - 1, current + 1, current - 4, current + 4].forEach((next) => { if (next >= 0 && next < 16 && Math.abs((next % 4) - (current % 4)) <= 1 && cells[next] === region && !seen.has(next)) { seen.add(next); queue.push(next); } });
    }
    return seen.size === 4;
  });
}

function PatternFrame({ cells, interactive, onToggle }: { cells: number[]; interactive?: boolean; onToggle?: (index: number) => void }) {
  return <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted/50 p-2">{Array.from({ length: 16 }, (_, index) => interactive ? <button type="button" key={index} aria-label={`Pattern cell ${index + 1}`} onClick={() => onToggle?.(index)} className={cn("aspect-square rounded-md border", cells.includes(index) ? "border-primary bg-primary" : "border-border/60 bg-card")} /> : <span key={index} className={cn("aspect-square rounded-md border border-border/60", cells.includes(index) ? "bg-primary" : "bg-card")} />)}</div>;
}

function ReasoningBoard({ game, state, setState, challenge, onComplete, onMistake, onMove, hintUsed }: GameBoardProps) {
  if (game.kind === "pattern-shift") {
    const puzzle = getPatternShiftPuzzle(challenge.stage);
    const selected = state.cells.flatMap((cell, index) => cell === true ? [index] : []);
    return <div className="w-full max-w-[560px] text-center"><Rule text="Construct the next frame in the visual sequence." hint={hintUsed ? puzzle.rule : "Study the first three frames, then fill the fourth frame and check it."} /><div className="mb-5 grid grid-cols-3 gap-2">{puzzle.frames.map((frame, index) => <div key={index}><p className="mb-2 text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">Frame {index + 1}</p><PatternFrame cells={frame} /></div>)}</div><div className="mb-5"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.15em] text-primary">Your next frame</p><PatternFrame cells={selected} interactive onToggle={(index) => { const cells = [...state.cells]; cells[index] = cells[index] === true ? false : true; onMove(); setState((current) => ({ ...current, cells })); }} /></div><Button type="button" onClick={() => { onMove(); if (selected.length === puzzle.target.length && selected.every((index) => puzzle.target.includes(index))) onComplete(); else onMistake(); }} className="rounded-xl font-bold">Check frame</Button></div>;
  }
  if (game.kind === "odd-one-out") {
    const puzzle = getOddOneOutPuzzle(challenge.stage);
    return <div className="w-full max-w-[520px] text-center"><Rule text="Identify the only tile that violates the visual rule." hint={hintUsed ? puzzle.rule : "Compare shape, fill, and rotation across all four tiles."} /><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{puzzle.items.map((item, index) => <button type="button" key={index} aria-label={`Odd one out tile ${index + 1}`} onClick={() => { onMove(); setState((current) => ({ ...current, answer: index })); if (index === puzzle.oddIndex) onComplete(); else onMistake(); }} className={cn("grid aspect-square place-items-center rounded-2xl border bg-card text-5xl transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", state.answer === index && "border-primary bg-primary/10")}><span style={{ transform: `rotate(${item.rotation}deg)`, opacity: item.fill === "outline" ? 0.45 : 1 }}>{item.shape}</span><small className="self-end pb-2 text-[10px] font-bold text-muted-foreground">Tile {index + 1}</small></button>)}</div></div>;
  }
  if (game.kind === "matrix-mystery") {
    const puzzle = getMatrixMysteryPuzzle(challenge.stage);
    return <div className="w-full max-w-[500px] text-center"><Rule text="Complete the 3×3 relationship matrix." hint={hintUsed ? puzzle.rule : "Look for the transformation shared by each row and column."} /><div className="mb-5 grid grid-cols-3 gap-2">{puzzle.cells.map((cell, index) => <span key={index} className={cn("grid aspect-square place-items-center rounded-xl border bg-card font-display text-2xl font-extrabold", cell === "?" && "border-dashed border-primary text-primary")}>{cell}</span>)}</div><div className="grid grid-cols-2 gap-2">{puzzle.options.map((option, index) => <ChoiceButton key={option} active={state.answer === index} onClick={() => { onMove(); setState((current) => ({ ...current, answer: index })); if (index === puzzle.answer) onComplete(); else onMistake(); }}>{option}</ChoiceButton>)}</div></div>;
  }
  if (game.kind === "sequence-detective") {
    const puzzle = getSequenceDetectivePuzzle(challenge.stage);
    return <div className="w-full max-w-[520px] text-center"><Rule text="Infer the next item in the changing sequence." hint={hintUsed ? puzzle.rule : "Track both the symbol and its position in the sequence."} /><div className="mb-5 flex items-center justify-center gap-2 text-3xl font-display font-extrabold">{puzzle.sequence.map((item, index) => <span key={index} className={cn("grid h-16 min-w-16 place-items-center rounded-xl border bg-card", item === "?" && "border-dashed border-primary text-primary")}>{item}</span>)}</div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{puzzle.options.map((option, index) => <ChoiceButton key={option} active={state.answer === index} onClick={() => { onMove(); setState((current) => ({ ...current, answer: index })); if (index === puzzle.answer) onComplete(); else onMistake(); }}>{option}</ChoiceButton>)}</div></div>;
  }
  const puzzle = getDailyMysteryPuzzle();
  const order = state.cells.slice(0, 4).map((cell, index) => typeof cell === "number" ? cell : index);
  const selected = state.selected[0];
  return <div className="w-full max-w-[560px] text-center"><Rule text="Reconstruct the witness timeline for today's mystery." hint={hintUsed ? puzzle.rule : "Select two stops to swap them. The same daily order is used all day."} /><div className="grid gap-3">{order.map((itemIndex, position) => <button type="button" key={`${itemIndex}-${position}`} onClick={() => { if (selected === undefined) { setState((current) => ({ ...current, selected: [position] })); return; } if (selected === position) { setState((current) => ({ ...current, selected: [] })); return; } const next = [...order]; [next[selected], next[position]] = [next[position], next[selected]]; onMove(); setState((current) => ({ ...current, cells: next, selected: [] })); if (next.every((value, index) => value === puzzle.answer[index])) onComplete(); }} className={cn("flex items-center justify-between rounded-2xl border bg-card px-4 py-4 text-left font-bold transition hover:border-primary/50", selected === position && "border-primary bg-primary/10")}><span className="mr-3 grid h-7 w-7 place-items-center rounded-lg bg-muted text-xs text-muted-foreground">{position + 1}</span><span className="flex-1">{puzzle.items[itemIndex]}</span><span className="text-xs text-muted-foreground">Select to swap</span></button>)}</div></div>;
}

function SpatialBoard({ game, state, setState, challenge, onComplete, onMistake, onMove, hintUsed }: GameBoardProps) {
  if (game.kind === "mirror-world") {
    const original = getMirrorTarget(challenge);
    const target = original.map((_, index) => original[Math.floor(index / 4) * 4 + 3 - (index % 4)]);
    return <div className="w-full max-w-[500px]"><Rule text="Rebuild the shape on the opposite side of the mirror." hint={hintUsed ? "Reflect columns; do not rotate rows." : `${target.filter(Boolean).length} cells belong in the reflection.`} /><div className="grid grid-cols-2 gap-5"><div><p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">Original</p><CellGrid>{(i) => <span className={cn("aspect-square rounded-lg border border-border/60", original[i] ? "bg-primary" : "bg-muted/40")} />}</CellGrid></div><div><p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[.15em] text-primary">Reflection</p><CellGrid>{(i) => <GridCell label={`Reflection cell ${i + 1}`} active={Boolean(state.cells[i])} onClick={() => { const cells = [...state.cells]; cells[i] = !cells[i]; onMove(); setState((current) => ({ ...current, cells })); if (cells.filter(Boolean).length === target.filter(Boolean).length) { if (cells.every((cell, index) => Boolean(cell) === target[index])) onComplete(); else onMistake(); } }} />}</CellGrid></div></div></div>;
  }
  if (game.kind === "shape-packing") {
    const target = [true, true, false, false, true, false, false, false, true, true, true, false, false, false, false, false];
    return <div className="w-full max-w-[430px]"><Rule text="Place the pieces inside the target footprint without overlap." hint={hintUsed ? "The packed silhouette occupies six cells and has one three-cell bar." : "Tap cells to place or remove a unit from the pieces."} /><CellGrid>{(i) => <GridCell label={`Packing cell ${i + 1}`} active={Boolean(state.cells[i])} onClick={() => { const cells = [...state.cells]; cells[i] = !cells[i]; onMove(); setState((current) => ({ ...current, cells })); if (cells.filter(Boolean).length === target.filter(Boolean).length) { if (cells.every((cell, index) => Boolean(cell) === target[index])) onComplete(); else onMistake(); } }} />}</CellGrid></div>;
  }
  if (game.kind === "rotation-puzzle") {
    const target = challenge.tier % 4;
    return <div className="w-full max-w-[430px] text-center"><Rule text="Rotate the grid shape until it matches the target orientation. Reflection is not allowed." hint={hintUsed ? `The target is orientation ${target + 1} of 4.` : "Each turn is 90° clockwise."} /><div className="mx-auto mb-6 grid h-28 w-28 place-items-center rounded-2xl border border-primary/20 bg-primary/5 text-6xl text-primary">{["└", "┌", "┐", "┘"][state.answer ?? 0]}</div><div className="grid grid-cols-4 gap-2">{[0, 1, 2, 3].map((rotation) => <ChoiceButton key={rotation} active={state.answer === rotation} onClick={() => { onMove(); setState((current) => ({ ...current, answer: rotation })); if (rotation === target) onComplete(); else onMistake(); }}>{["└", "┌", "┐", "┘"][rotation]}</ChoiceButton>)}</div></div>;
  }
  if (game.kind === "cube-explorer") {
    const target = challenge.tier % 4;
    const orientation = state.answer ?? 0;
    return <div className="w-full max-w-[430px] text-center"><Rule text="Turn the cube and identify the orientation where the marked face meets the gold face." hint={hintUsed ? `The correct turn is ${target + 1}.` : "A turn changes adjacency; it never mirrors the cube."} /><div className="mx-auto mb-6 grid max-w-[240px] grid-cols-3 gap-1 text-2xl font-extrabold"><span className="rounded-xl bg-blue-500 p-5 text-white">{["A", "B", "C", "D"][orientation]}</span><span className="rounded-xl bg-amber-400 p-5 text-amber-950">◆</span><span className="rounded-xl bg-emerald-500 p-5 text-white">{["B", "C", "D", "A"][orientation]}</span></div><Button type="button" onClick={() => { const next = (orientation + 1) % 4; onMove(); setState((current) => ({ ...current, answer: next })); if (next === target) onComplete(); }} className="rounded-xl font-bold"><RotateCw className="mr-2 h-4 w-4" /> Turn cube</Button></div>;
  }
  if (game.kind === "shadow-match") {
    const target = (challenge.tier + 2) % 4;
    const choices = ["diamond", "split diamond", "open diamond", "rectangle"];
    return <div className="w-full max-w-[500px] text-center"><Rule text="Choose the silhouette cast by the object from the marked light direction." hint={hintUsed ? `The silhouette is option ${target + 1}.` : "Compare the outer contour, not the object's color."} /><div className="mb-6 grid grid-cols-2 gap-4"><div className="grid h-28 place-items-center rounded-2xl bg-muted text-6xl">◆</div><div className="grid h-28 place-items-center rounded-2xl bg-slate-900 text-6xl text-white">{["◆", "◈", "◇", "▰"][target]}</div></div><div className="grid grid-cols-2 gap-2">{choices.map((choice, index) => <ChoiceButton key={choice} active={state.answer === index} onClick={() => { onMove(); setState((current) => ({ ...current, answer: index })); if (index === target) onComplete(); else onMistake(); }}>{index + 1}. {choice}</ChoiceButton>)}</div></div>;
  }
  if (game.kind === "color-logic") {
    const colors = ["coral", "indigo", "mint", "gold"];
    return <div className="w-full max-w-[500px] text-center"><Rule text="Arrange coral, indigo, mint, and gold so every adjacency rule is satisfied." hint={hintUsed ? "Coral is first; indigo and mint must touch." : "Tap a slot to cycle its color."} /><div className="grid grid-cols-4 gap-2">{state.cells.slice(0, 4).map((cell, index) => <button type="button" key={index} aria-label={`Color slot ${index + 1}`} onClick={() => { const cells = [...state.cells]; cells[index] = cell === null ? 0 : Number(cell) === 3 ? null : Number(cell) + 1; onMove(); setState((current) => ({ ...current, cells })); const nextValid = cells.length === 4 && cells.every((value) => typeof value === "number") && new Set(cells as number[]).size === 4 && cells[0] === 0 && Math.abs((cells as number[]).indexOf(1) - (cells as number[]).indexOf(2)) === 1 && Math.abs((cells as number[]).indexOf(3) - (cells as number[]).indexOf(0)) > 1; if (nextValid) onComplete(); }} className="aspect-square rounded-xl border border-border bg-card p-2 text-xs font-bold"><span className="block h-8 rounded-lg" style={{ backgroundColor: cell === null ? "hsl(var(--muted))" : ["#e16c5f", "#635bff", "#2f9b86", "#e3a032"][Number(cell)] }} />{cell === null ? "Empty" : colors[Number(cell)]}</button>)}</div></div>;
  }
  if (game.kind === "region-rules") return <div className="w-full max-w-[430px]"><Rule text="Divide the board into three connected regions of four cells. Each region contains one star clue." hint={hintUsed ? "Keep each region orthogonally connected." : "Tap a cell to cycle region A → B → C."} /><CellGrid>{(i) => <GridCell label={`Region cell ${i + 1}`} active={state.cells[i] !== null} onClick={() => { const cells = [...state.cells]; cells[i] = cells[i] === null ? 0 : Number(cells[i]) === 2 ? null : Number(cells[i]) + 1; onMove(); setState((current) => ({ ...current, cells })); if (isRegionSolution(cells)) onComplete(); }} className="font-display text-lg">{state.cells[i] === null ? "·" : ["A", "B", "C"][Number(state.cells[i])]}</GridCell>}</CellGrid></div>;
  if (game.kind === "perfect-placement") return <div className="w-full max-w-[430px]"><Rule text="Place one circle, triangle, square, and diamond in every row and column." hint={hintUsed ? "Each cell cycles through the four pieces." : "A valid Latin arrangement is accepted; there is no hidden fixed answer."} /><CellGrid>{(i) => <GridCell label={`Placement cell ${i + 1}`} onClick={() => { const cells = [...state.cells]; cells[i] = cells[i] === null ? 0 : Number(cells[i]) === 3 ? null : Number(cells[i]) + 1; onMove(); setState((current) => ({ ...current, cells })); if (cells.every((cell) => cell !== null) && isValidNumberGrid(cells.map((cell) => cell === null ? null : Number(cell) + 1))) onComplete(); }} className="font-display text-xl">{state.cells[i] === null ? "·" : ["●", "▲", "■", "◆"][Number(state.cells[i])]}</GridCell>}</CellGrid></div>;
  if (game.kind === "mystery-network") {
    const edges = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
    const selected = edges.map((_, index) => state.cells[index] === true);
    return <div className="w-full max-w-[500px] text-center"><Rule text="Build a single four-node network where every node has degree two." hint={hintUsed ? "Exactly four connections are needed; each node must have two." : "Toggle possible connections. A valid network is checked directly."} /><div className="mx-auto mb-5 grid max-w-[260px] grid-cols-2 gap-3">{["A", "B", "C", "D"].map((node) => <span key={node} className="grid h-16 place-items-center rounded-2xl border border-primary/30 bg-primary/10 font-display text-xl font-extrabold text-primary">{node}</span>)}</div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{edges.map(([from, to], index) => <ChoiceButton key={`${from}-${to}`} active={selected[index]} onClick={() => { const cells = [...state.cells]; cells[index] = !selected[index]; onMove(); setState((current) => ({ ...current, cells })); const next = edges.map((_, edgeIndex) => edgeIndex === index ? !selected[index] : selected[edgeIndex]); if (next.filter(Boolean).length === 4 && [0, 1, 2, 3].every((node) => edges.reduce((degree, [edgeFrom, edgeTo], edgeIndex) => degree + (next[edgeIndex] && (edgeFrom === node || edgeTo === node) ? 1 : 0), 0) === 2)) onComplete(); }}>{["A", "B", "C", "D"][from]} — {["A", "B", "C", "D"][to]}</ChoiceButton>)}</div></div>;
  }
  if (game.kind === "one-move") return <div className="w-full max-w-[430px] text-center"><Rule text="Perform exactly one legal move to place the token in the goal lane." hint={hintUsed ? "Move down is the valid action." : "The board accepts one action only."} /><div className="mx-auto mb-5 grid max-w-[220px] grid-cols-3 gap-2"><span className="grid aspect-square place-items-center rounded-xl bg-primary text-xl text-primary-foreground">●</span>{Array.from({ length: 8 }, (_, index) => <span key={index} className={cn("grid aspect-square place-items-center rounded-xl border", index === 7 ? "border-emerald-500 text-emerald-600" : "border-border bg-muted/30")}>{index === 7 ? "◎" : ""}</span>)}</div><div className="grid grid-cols-4 gap-2">{["←", "↑", "↓", "→"].map((move, index) => <ChoiceButton key={move} onClick={() => { onMove(); setState((current) => ({ ...current, answer: index })); if (index === 2) onComplete(); else onMistake(); }}>{move}</ChoiceButton>)}</div></div>;
  if (game.kind === "constraint-master") return <div className="w-full max-w-[500px] text-center"><Rule text="Arrange blue, circle, triangle, and star: blue first, triangle not last, circle beside star." hint={hintUsed ? "Use blue at slot one, then keep circle and star adjacent." : "Tap a slot to cycle its symbol."} /><div className="grid grid-cols-4 gap-2">{state.cells.slice(0, 4).map((cell, index) => <button type="button" key={index} aria-label={`Constraint slot ${index + 1}`} onClick={() => { const cells = [...state.cells]; cells[index] = cell === null ? 0 : Number(cell) === 3 ? null : Number(cell) + 1; onMove(); setState((current) => ({ ...current, cells })); const values = cells.slice(0, 4); const solved = values.every((value) => typeof value === "number") && values[0] === 0 && values[3] !== 2 && Math.abs(values.indexOf(1) - values.indexOf(3)) === 1; if (solved) onComplete(); }} className="aspect-square rounded-xl border border-border bg-card p-2 text-xs font-bold">{cell === null ? "Empty" : ["Blue", "Circle", "Triangle", "Star"][Number(cell)]}</button>)}</div></div>;
  if (game.kind === "rule-breaker") return <div className="w-full max-w-[430px] text-center"><Rule text="Fill the 3×3 arrangement so matching symbols never touch, even diagonally." hint={hintUsed ? "A checkerboard pattern satisfies the rule." : "Tap cells to switch between the two symbols."} /><CellGrid count={9}>{(i) => <GridCell label={`Rule cell ${i + 1}`} active={state.cells[i] === true} onClick={() => { const cells = [...state.cells]; cells[i] = cells[i] === true ? false : true; onMove(); setState((current) => ({ ...current, cells })); const valid = cells.slice(0, 9).every((cell) => typeof cell === "boolean") && cells.slice(0, 9).every((_, index) => [-1, 0, 1].every((rowOffset) => [-1, 0, 1].every((columnOffset) => { if (!rowOffset && !columnOffset) return true; const row = Math.floor(index / 3) + rowOffset; const column = index % 3 + columnOffset; const next = row * 3 + column; return row < 0 || row >= 3 || column < 0 || column >= 3 || cells[next] !== cells[index]; }))); if (valid) onComplete(); }} className="font-display text-xl">{state.cells[i] === true ? "◆" : "●"}</GridCell>}</CellGrid></div>;
  return <ChoiceBoard {...{ game, state, setState, challenge, onComplete, onMistake, onMove } as GameBoardProps} />;
}

function MemoryBoard({ game, state, setState, challenge, onComplete, onMistake, onMove, hintUsed }: GameBoardProps) {
  const kind = game.kind;
  const target = getMemoryTarget(kind, challenge);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const pause = () => setPaused(true);
    const resume = () => setPaused(false);
    window.addEventListener("gridverse-pause", pause);
    window.addEventListener("gridverse-resume", resume);
    return () => { window.removeEventListener("gridverse-pause", pause); window.removeEventListener("gridverse-resume", resume); };
  }, []);
  useEffect(() => {
    if (!state.show || paused) return;
    const timer = window.setTimeout(() => setState((current) => ({ ...current, show: false })), challenge.studyDurationMs);
    return () => window.clearTimeout(timer);
  }, [challenge.studyDurationMs, paused, setState, state.show]);
  if (kind === "symbol-recall") {
    const layout = getSymbolLayout(challenge.tier);
    const correct = Object.entries(layout).every(([index, symbol]) => state.cells[Number(index)] === symbol) && Object.keys(layout).length === state.cells.filter((cell) => cell !== null).length;
    return <div className="w-full max-w-[450px] text-center"><Rule text={state.show ? "Study each symbol and its position. The board hides automatically." : "Reconstruct the symbol identities and positions."} hint={hintUsed ? `The first symbol is ${symbols[Object.values(layout)[0]]}.` : `${Object.keys(layout).length} distinct symbols are shown.`} /><CellGrid>{(i) => <GridCell label={`Symbol position ${i + 1}`} disabled={state.show} active={state.cells[i] !== null} onClick={() => { const cells = [...state.cells]; cells[i] = cells[i] === null ? 0 : Number(cells[i]) === symbols.length - 1 ? null : Number(cells[i]) + 1; onMove(); setState((current) => ({ ...current, cells })); if (cells.filter((cell) => cell !== null).length === Object.keys(layout).length) { if (Object.entries(layout).every(([index, symbol]) => cells[Number(index)] === symbol)) onComplete(); else onMistake(); } }}>{state.show ? layout[i] !== undefined ? symbols[layout[i]] : "" : state.cells[i] === null ? "·" : symbols[Number(state.cells[i])]}</GridCell>}</CellGrid><p className="mt-4 text-[11px] font-semibold text-muted-foreground">{state.show ? "Timed study phase" : `${state.cells.filter((cell) => cell !== null).length}/${Object.keys(layout).length} symbols reconstructed`}</p></div>;
  }
  if (["flash-grid", "hidden-pattern"].includes(kind)) return <div className="w-full max-w-[450px] text-center"><Rule text={state.show ? "Study the highlighted pattern. It will hide automatically." : "Recreate every highlighted cell from memory."} hint={hintUsed ? `The pattern includes cell ${Number(target[0]) + 1}.` : `${target.length} cells must be recalled at this stage.`} /><CellGrid>{(i) => <GridCell label={`Memory cell ${i + 1}`} disabled={state.show} active={state.show ? target.includes(i) : state.selected.includes(i)} onClick={() => { const selected = state.selected.includes(i) ? state.selected.filter((value) => value !== i) : [...state.selected, i]; onMove(); setState((current) => ({ ...current, selected })); if (!target.includes(i)) onMistake(); if (selected.length === target.length) { if (selected.every((value) => target.includes(value))) onComplete(); else onMistake(); } }}>{state.show ? "" : state.selected.includes(i) ? <Check className="mx-auto h-4 w-4" /> : ""}</GridCell>}</CellGrid><p className="mt-4 text-[11px] font-semibold text-muted-foreground">{state.show ? "Timed study phase" : `${state.selected.length}/${target.length} cells selected`}</p></div>;
  const sequence = getSequenceTarget(challenge);
  if (kind === "sequence-memory") return <div className="w-full max-w-[450px] text-center"><Rule text={state.show ? "Memorize the ordered signal sequence. It will hide automatically." : "Repeat the sequence in order."} hint={hintUsed ? `The sequence starts on cell ${sequence[0] + 1}.` : `${sequence.length} signals are chained at this stage.`} /><div className="mx-auto grid max-w-[310px] grid-cols-4 gap-2">{Array.from({ length: 8 }, (_, i) => <GridCell key={i} label={`Sequence signal ${i + 1}`} disabled={state.show} active={state.show && sequence.includes(i)} onClick={() => { const input = [...state.input, i]; onMove(); if (i !== sequence[input.length - 1]) { onMistake(); setState((current) => ({ ...current, input: [] })); return; } setState((current) => ({ ...current, input })); if (input.length === sequence.length) onComplete(); }}>{state.show ? sequence.includes(i) ? sequence.indexOf(i) + 1 : "" : state.input.includes(i) ? <Check className="mx-auto h-4 w-4" /> : i + 1}</GridCell>)}</div><p className="mt-4 text-[11px] font-semibold text-muted-foreground">{state.show ? "Timed study phase" : `${state.input.length}/${sequence.length} correct signals`}</p></div>;
  const scenes = getSceneTargets(challenge);
  return <div className="w-full max-w-[500px] text-center"><Rule text={`Find all ${scenes.changed.length} changed tiles between the two scenes.`} hint={hintUsed ? "One changed tile is in the third row." : "Select every changed tile; a stable tile costs a mistake."} /><div className="grid grid-cols-2 gap-5"><Scene title="Before" cells={scenes.before} /><div><p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[.15em] text-primary">After</p><div className="grid grid-cols-4 gap-2 rounded-2xl bg-muted/40 p-3">{Array.from({ length: 16 }, (_, i) => <button type="button" aria-label={`Changed scene tile ${i + 1}`} key={i} onClick={() => { const selected = state.selected.includes(i) ? state.selected.filter((value) => value !== i) : [...state.selected, i]; onMove(); setState((current) => ({ ...current, selected })); if (!scenes.changed.includes(i)) onMistake(); if (selected.length === scenes.changed.length && selected.every((value) => scenes.changed.includes(value))) onComplete(); }} className={cn("aspect-square rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", scenes.after.includes(i) ? "bg-primary" : "border-border/60 bg-card hover:border-primary", state.selected.includes(i) && "ring-2 ring-primary ring-offset-1")} />)}</div></div></div></div>;
}

function Scene({ title, cells }: { title: string; cells: number[] }) {
  return <div><p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">{title}</p><div className="grid grid-cols-4 gap-2 rounded-2xl bg-muted/40 p-3">{Array.from({ length: 16 }, (_, i) => <span key={i} className={cn("aspect-square rounded-lg border border-border/60", cells.includes(i) ? "bg-primary" : "bg-card")} />)}</div></div>;
}

function isChoiceKind(kind: GameKind) {
  return ["region-rules", "perfect-placement", "pattern-shift", "odd-one-out", "matrix-mystery", "color-logic", "sequence-detective", "shape-packing", "rotation-puzzle", "cube-explorer", "shadow-match", "rule-breaker", "mystery-network", "one-move", "constraint-master", "daily-mystery"].includes(kind);
}

export function GameBoard(props: GameBoardProps) {
  if (["number-grid", "mine-logic", "nonogram", "binary-grid", "pathfinder", "switchboard"].includes(props.game.kind)) return <LogicBoard {...props} />;
  if (["pattern-shift", "odd-one-out", "matrix-mystery", "sequence-detective", "daily-mystery"].includes(props.game.kind)) return <ReasoningBoard {...props} />;
  if (["mirror-world", "shape-packing", "rotation-puzzle", "cube-explorer", "shadow-match", "color-logic", "region-rules", "perfect-placement", "mystery-network", "one-move", "constraint-master", "rule-breaker"].includes(props.game.kind)) return <SpatialBoard {...props} />;
  if (isChoiceKind(props.game.kind)) return <ChoiceBoard {...props} />;
  return <MemoryBoard {...props} />;
}

export function createInitialPuzzleState(kind: GameKind, challenge: ChallengeConfig): PuzzleState {
  const cells: Array<number | boolean | null> = Array(16).fill(null);
  if (kind === "number-grid" || kind === "binary-grid") {
    const puzzle = getGridPuzzle(kind, challenge.tier, challenge.stage);
    puzzle.givens.forEach((index) => { cells[index] = puzzle.target[index]; });
  }
  const lights = kind === "switchboard" ? getSwitchStart(challenge) : Array(9).fill(false) as boolean[];
  if (kind === "daily-mystery") cells.splice(0, 4, 0, 1, 2, 3);
  return { cells, selected: [], path: [0], lights, input: [], show: ["flash-grid", "symbol-recall", "sequence-memory", "hidden-pattern"].includes(kind), answer: null, choiceStreak: 0, flags: [], revealed: kind === "mine-logic" ? [0] : [], mineMode: "reveal" };
}