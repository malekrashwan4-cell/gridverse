import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, ChevronRight, CircleHelp, Clock3, Flag, Lightbulb, Pause, Play, RotateCcw, Share2, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { GameBoard, createInitialPuzzleState } from "@/components/GameBoard";
import { Button } from "@/components/ui/button";
import { games } from "@/data/games";
import NotFound from "@/pages/NotFound";
import { ChallengeMode, getChallengeConfig, getSavedChallengeMode, saveChallengeMode } from "@/lib/difficulty";
import { supabase } from "@/integrations/supabase/client";
import { formatDuration, getChallengeMetrics, getDailyPuzzleId, recordChallengeMetric, saveGuestResult } from "@/lib/progress";
import { calculateScore } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import { audio } from "@/lib/audio";
import { unlockAchievements } from "@/lib/achievements";
import { createMatrixPuzzle, createOddPuzzle } from "@/lib/puzzle-engine";

type GameStatus = "ready" | "playing" | "paused" | "complete" | "failed";

const modes: Array<{ id: ChallengeMode; title: string; detail: string }> = [
  { id: "normal", title: "Easy", detail: "Clear relationships" },
  { id: "medium", title: "Medium", detail: "Linked properties" },
  { id: "hard", title: "Hard", detail: "Deeper deduction" },
  { id: "expert", title: "Expert", detail: "Layered reasoning" },
];

export default function GamePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const requestedGame = games.find((item) => item.slug === slug);
  const game = requestedGame ?? games[0];
  const [mode, setMode] = useState<ChallengeMode>(() => getSavedChallengeMode(game.id));
  const [attemptNumber, setAttemptNumber] = useState(() => getChallengeMetrics().filter((metric) => metric.gameId === game.id && metric.completed).length + 1);
  const challenge = useMemo(() => getChallengeConfig(game.kind, mode, attemptNumber), [attemptNumber, game.kind, mode]);
  useEffect(() => {
    setMode(getSavedChallengeMode(game.id));
    setAttemptNumber(getChallengeMetrics().filter((metric) => metric.gameId === game.id && metric.completed).length + 1);
  }, [game.id]);
  const [status, setStatus] = useState<GameStatus>("ready");
  const [state, setState] = useState(() => createInitialPuzzleState(game.kind, challenge));
  const [elapsed, setElapsed] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [moves, setMoves] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [failureReason, setFailureReason] = useState("");
  const [result, setResult] = useState<{ durationMs: number; score: number } | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [rewards, setRewards] = useState<string[]>([]);
  const startedAt = useRef(0);
  const pausedAt = useRef<number | null>(null);
  const pausedDuration = useRef(0);
  const movesRef = useRef(0);
  const mistakesRef = useRef(0);
  const terminalRef = useRef(false);
  const completedRef = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const Icon = game.icon;

  const reset = useCallback(() => {
    window.dispatchEvent(new Event("gridverse-resume"));
    if (completedRef.current) {
      completedRef.current = false;
      setAttemptNumber((value) => value + 1);
    }
    setState(createInitialPuzzleState(game.kind, challenge));
    setStatus("ready");
    setElapsed(0);
    setMistakes(0);
    setMoves(0);
    setHintsUsed(0);
    setHintUsed(false);
    setFailureReason("");
    setResult(null);
    setSaveMessage("");
    setRewards([]);
    startedAt.current = 0;
    pausedAt.current = null;
    pausedDuration.current = 0;
    movesRef.current = 0;
    mistakesRef.current = 0;
    terminalRef.current = false;
  }, [challenge, game.kind]);

  useEffect(() => reset(), [reset]);

  const currentElapsed = useCallback(() => {
    if (!startedAt.current) return 0;
    const now = performance.now();
    const activePause = pausedAt.current ? now - pausedAt.current : 0;
    return Math.max(0, now - startedAt.current - pausedDuration.current - activePause);
  }, []);

  useEffect(() => {
    if (status !== "playing") return;
    const timer = window.setInterval(() => setElapsed(currentElapsed()), 80);
    return () => window.clearInterval(timer);
  }, [currentElapsed, status]);

  const start = useCallback(() => {
    terminalRef.current = false;
    window.dispatchEvent(new Event("gridverse-resume"));
    startedAt.current = performance.now();
    pausedAt.current = null;
    pausedDuration.current = 0;
    setElapsed(0);
    audio.unlock();
    audio.setMood("game");
    audio.play("level");
    setStatus("playing");
  }, []);

  useEffect(() => {
    if (status === "playing") boardRef.current?.querySelector<HTMLButtonElement>("button:not([disabled])")?.focus();
  }, [status]);

  const pause = useCallback(() => {
    if (status !== "playing") return;
    pausedAt.current = performance.now();
    window.dispatchEvent(new Event("gridverse-pause"));
    setStatus("paused");
  }, [status]);

  const resume = useCallback(() => {
    if (status !== "paused") return;
    pausedDuration.current += performance.now() - (pausedAt.current ?? performance.now());
    pausedAt.current = null;
    window.dispatchEvent(new Event("gridverse-resume"));
    setStatus("playing");
  }, [status]);

  const togglePause = useCallback(() => {
    if (status === "playing") pause();
    if (status === "paused") resume();
  }, [pause, resume, status]);

  useEffect(() => {
    if (status !== "playing") return;
    const handleVisibility = () => {
      if (document.hidden) pause();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [pause, status]);

  const fail = useCallback((reason: string) => {
    if (terminalRef.current) return;
    terminalRef.current = true;
    audio.play("error");
    setFailureReason(reason);
    setStatus("failed");
    recordChallengeMetric({ gameId: game.id, difficulty: challenge.mode, stage: challenge.stage, completed: false, durationMs: Math.round(currentElapsed()), moves: movesRef.current, mistakes: mistakesRef.current, recordedAt: new Date().toISOString() });
  }, [challenge.mode, challenge.stage, currentElapsed, game.id]);

  const registerMove = useCallback(() => {
    if (terminalRef.current) return;
    movesRef.current += 1;
    setMoves(movesRef.current);
    if (movesRef.current > challenge.maxMoves) fail(`The ${challenge.label.toLowerCase()} move budget was exceeded.`);
  }, [challenge.label, challenge.maxMoves, fail]);

  const registerMistake = useCallback(() => {
    if (terminalRef.current) return;
    audio.play("mistake");
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && !document.documentElement.classList.contains("reduce-motion")) boardRef.current?.animate([{ transform: "translateX(0)" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0)" }], { duration: 180 });
    mistakesRef.current += 1;
    setMistakes(mistakesRef.current);
    if (mistakesRef.current > challenge.maxMistakes) fail(`The ${challenge.label.toLowerCase()} run allows no more than ${challenge.maxMistakes} mistake${challenge.maxMistakes === 1 ? "" : "s"}.`);
  }, [challenge.label, challenge.maxMistakes, fail]);

  const complete = useCallback(async () => {
    if (terminalRef.current || status !== "playing") return;
    terminalRef.current = true;
    completedRef.current = true;
    audio.setMood("victory");
    audio.play(game.kind === "daily-mystery" ? "daily" : "victory");
    const durationMs = Math.max(700, Math.round(currentElapsed()));
    const finalScore = calculateScore(game.kind, durationMs, movesRef.current, mistakesRef.current, hintsUsed, challenge.mode);
    setElapsed(durationMs);
    setStatus("complete");
    setResult({ durationMs, score: finalScore });
    setRewards(unlockAchievements(game.id, mistakesRef.current));
    recordChallengeMetric({ gameId: game.id, difficulty: challenge.mode, stage: challenge.stage, completed: true, durationMs, moves: movesRef.current, mistakes: mistakesRef.current, recordedAt: new Date().toISOString() });
    saveGuestResult({ gameId: game.id, durationMs, score: finalScore, moves: movesRef.current, mistakes: mistakesRef.current, hintsUsed, completedAt: new Date().toISOString(), difficulty: challenge.mode, stage: challenge.stage });
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) {
      setSaveMessage("Saved on this device.");
      return;
    }
    const { error } = await supabase.rpc("submit_game_session", {
      p_game_id: game.id,
      p_puzzle_id: game.kind === "daily-mystery" ? getDailyPuzzleId() : `${game.slug}-${challenge.mode}-stage-${challenge.stage}`,
      p_started_at: new Date(Date.now() - durationMs).toISOString(),
      p_duration_ms: durationMs,
      p_score: finalScore,
      p_moves: movesRef.current,
      p_mistakes: mistakesRef.current,
      p_hints_used: hintsUsed,
    });
    setSaveMessage(error ? "Saved on this device. Cloud sync is temporarily unavailable." : "Synced to your account.");
  }, [challenge.mode, challenge.stage, currentElapsed, game, hintsUsed, status]);

  useEffect(() => {
    if (status !== "playing" && status !== "paused") return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.closest('[role="slider"], [data-radix-popper-content-wrapper]')) return;
      if (event.defaultPrevented) return;
      if (status === "paused" && target.closest('[data-game-board]') && target !== boardRef.current?.querySelector('[data-resume]')) { event.preventDefault(); return; }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) event.preventDefault();
      if (event.key.toLowerCase() === "p" || event.key === " " && !target.closest('button')) { event.preventDefault(); togglePause(); }
      if (event.key.toLowerCase() === "r") reset();
      if (status === "playing" && /^[1-6]$/.test(event.key)) {
        const choice = boardRef.current?.querySelector(`[data-choice-index="${Number(event.key) - 1}"]`) as HTMLButtonElement | null;
        if (choice) {
          event.preventDefault();
          choice.click();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reset, status, togglePause]);

  const selectMode = (nextMode: ChallengeMode) => {
    if (status !== "ready") return;
    saveChallengeMode(game.id, nextMode);
    setMode(nextMode);
  };

  const share = async () => {
    const text = `I solved ${game.title} on ${challenge.label} in ${formatDuration(result?.durationMs)} on Gridverse.`;
    try {
      if (navigator.share) await navigator.share({ title: "Gridverse result", text, url: window.location.href });
      else {
        await navigator.clipboard?.writeText(text);
        setSaveMessage("Result copied to clipboard.");
      }
    } catch {
      setSaveMessage("Sharing was cancelled.");
    }
  };

  const useHint = () => {
    if (status !== "playing" || hintUsed || !challenge.canUseHint) return;
    setHintsUsed((value) => value + 1);
    setHintUsed(true);
  };

  useEffect(() => {
    if (!rewards.length || status !== "complete") return;
    const timer = window.setTimeout(() => audio.play("achievement"), 850);
    return () => window.clearTimeout(timer);
  }, [rewards, status]);

  const statusTitle = status === "complete" ? "Challenge complete" : status === "failed" ? "Run ended" : status === "ready" ? "Ready when you are." : status === "paused" ? "Game paused" : "Make your next move.";

  if (!requestedGame) return <NotFound />;

  return <AppShell><div className="mx-auto max-w-[1080px] px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8"><button type="button" onClick={() => navigate("/games")} className="mb-6 flex items-center gap-2 text-[11px] font-bold text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ArrowLeft className="h-3.5 w-3.5" /> Back to games</button><div className="grid gap-6 lg:grid-cols-[1fr_290px]"><section className="rounded-[28px] border border-border/70 bg-card shadow-[0_12px_40px_rgb(22_27_45_/_0.045)]"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 px-5 py-5 sm:px-7"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-[15px]" style={{ backgroundColor: `${game.accent}15`, color: game.accent }}><Icon className="h-5 w-5" /></span><div><div className="flex flex-wrap items-center gap-2"><h1 className="font-display text-xl font-extrabold tracking-[-.04em]">{game.title}</h1><span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-primary">{game.category} · Stage {challenge.stage}</span></div><p className="mt-1 text-[11px] font-semibold text-muted-foreground">{game.description}</p></div></div><div className="flex items-center gap-2"><div aria-live="polite" className="flex items-center gap-2 rounded-xl bg-muted/55 px-3 py-2 text-sm font-bold tabular-nums"><Clock3 className="h-4 w-4 text-primary" /> {formatDuration(elapsed)}</div>{(status === "playing" || status === "paused") && <Button type="button" onClick={togglePause} variant="outline" size="icon" aria-label={status === "paused" ? "Resume game" : "Pause game"} className="h-9 w-9 rounded-xl">{status === "paused" ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}</Button>}<Button type="button" onClick={reset} variant="outline" size="icon" aria-label="Restart game" className="h-9 w-9 rounded-xl"><RotateCcw className="h-3.5 w-3.5" /></Button></div></div><div className="border-b border-border/60 px-5 py-4 sm:px-7"><div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Choose your challenge</p><p className="mt-1 text-[11px] font-semibold text-muted-foreground">{challenge.description} New puzzle layouts follow each completed run.</p></div><span className="hidden rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground sm:inline">{Number.isFinite(challenge.maxMoves) ? `${challenge.maxMoves} moves` : "Open moves"}</span></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Challenge difficulty">{modes.map((item) => <button key={item.id} type="button" role="radio" aria-checked={mode === item.id} disabled={status !== "ready"} onClick={() => selectMode(item.id)} className={cn("rounded-xl border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", mode === item.id ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-background text-muted-foreground hover:border-primary/40", status !== "ready" && "cursor-not-allowed opacity-70")}><span className="block text-[11px] font-extrabold">{item.title}</span><span className="mt-1 block text-[9px] font-semibold opacity-75">{item.detail}</span></button>)}</div></div><div data-game-status={status} className="min-h-[510px] p-5 sm:p-8"><div className="mb-8 flex items-center justify-between gap-4"><div><span className="text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">{game.category} / {game.difficulty} · {challenge.label}</span><h2 className="mt-2 font-display text-2xl font-extrabold tracking-[-.04em]">{statusTitle}</h2></div><div className="flex items-center gap-3 text-[11px] font-semibold text-muted-foreground"><span className="flex items-center gap-1.5"><Flag className="h-3.5 w-3.5" /> {mistakes}/{Number.isFinite(challenge.maxMistakes) ? challenge.maxMistakes : "∞"}</span><span className="hidden sm:inline">·</span><span className="hidden sm:inline">{moves}/{Number.isFinite(challenge.maxMoves) ? challenge.maxMoves : "∞"} moves</span></div></div>{status === "ready" ? <div className="flex min-h-[340px] flex-col items-center justify-center rounded-[22px] border border-dashed border-primary/25 bg-primary/[.025] px-5 text-center"><span className="grid h-16 w-16 place-items-center rounded-[22px] bg-primary/10 text-primary"><Icon className="h-7 w-7" /></span><p className="mt-5 text-[10px] font-bold uppercase tracking-[.18em] text-primary">Stage {challenge.stage} · {challenge.label}</p><h3 className="mt-2 font-display text-xl font-extrabold tracking-[-.03em]">{game.title}</h3><p className="mt-2 max-w-[390px] text-xs leading-5 text-muted-foreground">{game.description} {challenge.description}{game.kind === "nonogram" && " One tap immediately marks X and arms the cell; tap again within 350ms to fill. Repeat to correct any cell. Every empty cell needs X."}</p><Button type="button" onClick={start} className="mt-6 h-11 rounded-xl px-6 font-bold"><Play className="mr-2 h-4 w-4 fill-current" /> Start challenge</Button><p className="mt-4 text-[10px] font-semibold text-muted-foreground">Keyboard: P pauses · R restarts · 1–6 picks an answer · Enter / Space activates a focused cell</p></div> : status === "complete" ? <div className="flex min-h-[340px] flex-col items-center justify-center rounded-[22px] bg-primary/[.05] px-5 text-center"><span className="grid h-16 w-16 place-items-center rounded-[22px] bg-primary text-primary-foreground shadow-[0_12px_28px_hsl(var(--primary)/.25)]"><Trophy className="h-7 w-7" /></span><p className="mt-5 text-[10px] font-bold uppercase tracking-[.18em] text-primary">{mistakes ? "Solved with resilience" : "Clean solve"}</p><h3 className="mt-2 font-display text-2xl font-extrabold tracking-[-.04em]">You mastered the challenge.</h3>{rewards.length > 0 && <div className="gv-enter mt-4 flex flex-wrap justify-center gap-2" role="status">{rewards.map(reward => <span key={reward} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[10px] font-extrabold text-primary">✦ {reward} unlocked</span>)}</div>}<div className="mt-6 flex items-center gap-8"><div><div className="font-display text-2xl font-extrabold tabular-nums">{formatDuration(result?.durationMs)}</div><div className="mt-1 text-[10px] font-bold text-muted-foreground">Your time</div></div><div><div className="font-display text-2xl font-extrabold">{result?.score}</div><div className="mt-1 text-[10px] font-bold text-muted-foreground">Final score</div></div><div><div className="font-display text-2xl font-extrabold">{moves}</div><div className="mt-1 text-[10px] font-bold text-muted-foreground">Moves</div></div></div>{(game.kind === "odd-one-out" || game.kind === "matrix-mystery") && <p className="gv-enter mt-4 max-w-md rounded-xl bg-card p-4 text-xs leading-5 text-primary">{game.kind === "odd-one-out" ? createOddPuzzle(challenge.level, challenge.seed + challenge.choiceRounds - 1).rule : createMatrixPuzzle(challenge.level, challenge.seed + challenge.choiceRounds - 1).rule}</p>}{saveMessage && <p className="mt-4 text-[11px] font-bold text-primary">{saveMessage}</p>}<div className="mt-7 flex flex-wrap justify-center gap-2"><Button type="button" onClick={reset} variant="outline" className="rounded-xl font-bold"><RotateCcw className="mr-2 h-3.5 w-3.5" /> Next puzzle</Button><Button type="button" onClick={share} variant="outline" className="rounded-xl font-bold"><Share2 className="mr-2 h-3.5 w-3.5" /> Share result</Button><Button type="button" onClick={() => navigate(`/games/${game.slug}/stats`)} className="rounded-xl font-bold">View stats <ChevronRight className="ml-1 h-3.5 w-3.5" /></Button></div></div> : status === "failed" ? <div className="flex min-h-[340px] flex-col items-center justify-center rounded-[22px] bg-rose-500/[.06] px-5 text-center"><span className="grid h-16 w-16 place-items-center rounded-[22px] bg-rose-500/15 text-rose-600"><Flag className="h-7 w-7" /></span><p className="mt-5 text-[10px] font-bold uppercase tracking-[.18em] text-rose-600">Challenge failed fairly</p><h3 className="mt-2 font-display text-2xl font-extrabold tracking-[-.04em]">Your next run can beat this one.</h3><p className="mt-3 max-w-[350px] text-xs leading-5 text-muted-foreground">{failureReason} The board was solvable; restart to try a new line with the same clear rules.</p><div className="mt-7 flex flex-wrap justify-center gap-2"><Button type="button" onClick={reset} className="rounded-xl font-bold"><RotateCcw className="mr-2 h-3.5 w-3.5" /> Retry stage</Button><Button type="button" onClick={() => setMode(mode === "expert" ? "hard" : "normal")} variant="outline" className="rounded-xl font-bold">Step down difficulty</Button></div></div> : <div ref={boardRef} className={cn("relative flex min-h-[340px] items-center justify-center rounded-[22px] bg-muted/20 px-2 py-8 transition", status === "paused" && "blur-[2px]")} data-game-board><div inert={status === "paused"} aria-hidden={status === "paused"} className="flex w-full justify-center"><GameBoard key={`${game.id}-${mode}-${challenge.seed}`} game={game} state={state} setState={setState} challenge={challenge} onComplete={complete} onMistake={registerMistake} onMove={registerMove} hintUsed={hintUsed} /></div>{status === "paused" && <div className="absolute inset-0 grid place-items-center rounded-[22px] bg-background/70 backdrop-blur-sm"><div className="text-center"><Pause className="mx-auto h-7 w-7 text-primary" /><p className="mt-3 font-display text-lg font-extrabold">Paused</p><Button type="button" data-resume onClick={resume} className="mt-4 rounded-xl text-xs font-bold">Continue</Button></div></div>}</div>}</div></section><aside className="space-y-4"><div className="rounded-[22px] border border-border/70 bg-card p-5"><div className="flex items-center justify-between"><h3 className="font-display text-sm font-extrabold">How to play</h3><CircleHelp className="h-4 w-4 text-primary" /></div><p className="mt-3 text-xs leading-5 text-muted-foreground">{game.description}</p><div className="mt-5 space-y-3 border-t border-border/60 pt-4"><div className="flex items-center justify-between text-[11px] font-semibold"><span className="text-muted-foreground">Challenge</span><span>{challenge.label} · Stage {challenge.stage}</span></div><div className="flex items-center justify-between text-[11px] font-semibold"><span className="text-muted-foreground">Mistakes</span><span>{Number.isFinite(challenge.maxMistakes) ? `${challenge.maxMistakes} allowed` : "Recovery allowed"}</span></div><div className="flex items-center justify-between text-[11px] font-semibold"><span className="text-muted-foreground">Hints</span><span>{challenge.canUseHint ? "Available · -50 pts" : "Disabled in Expert"}</span></div><div className="flex items-center justify-between text-[11px] font-semibold"><span className="text-muted-foreground">Cloud save</span><span>{saveMessage || "After completion"}</span></div></div></div><div className="rounded-[22px] border border-primary/15 bg-primary/[.045] p-5"><div className="flex items-center gap-2 text-primary"><Lightbulb className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[.15em]">Need a nudge?</span></div><p className="mt-3 text-xs leading-5 text-muted-foreground">{challenge.canUseHint ? "A hint costs 50 points and reveals a focused clue without solving the board." : "Expert runs disable hints. Use the rule panel and plan before committing."}</p><Button type="button" disabled={status !== "playing" || hintUsed || !challenge.canUseHint} onClick={useHint} variant="outline" className="mt-4 h-9 w-full rounded-xl border-primary/20 text-[11px] font-bold text-primary hover:bg-primary/10"><Lightbulb className="mr-2 h-3.5 w-3.5" /> {!challenge.canUseHint ? "Expert hints disabled" : hintUsed ? "Hint active" : "Use a hint"}</Button></div><div className="rounded-[22px] border border-border/70 bg-card p-5"><div className="flex items-center gap-2 text-primary"><Check className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[.15em]">Fair challenge rules</span></div><ul className="mt-3 space-y-2 text-[11px] leading-5 text-muted-foreground"><li>• Pause freezes the timer.</li><li>• Switching tabs pauses automatically.</li><li>• Every advanced variant is deterministic and solvable.</li><li>• Restart clears the run without stale listeners.</li></ul></div><div className="flex gap-2"><Button type="button" variant="outline" onClick={share} className="h-10 flex-1 rounded-xl text-[11px] font-bold"><Share2 className="mr-2 h-3.5 w-3.5" /> Share</Button><Button type="button" variant="outline" className="h-10 flex-1 rounded-xl text-[11px] font-bold" onClick={() => navigate(`/games/${game.slug}/stats`)}><Trophy className="mr-2 h-3.5 w-3.5" /> Rankings</Button></div></aside></div></div></AppShell>;
}
