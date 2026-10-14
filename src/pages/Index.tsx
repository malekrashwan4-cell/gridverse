import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { games, categories, Game } from "@/data/games";
import { supabase } from "@/integrations/supabase/client";
import { getBestGuestResult, getGuestHistory, formatDuration, StoredResult } from "@/lib/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowUpRight, Clock3, Flame, Play, Search, Sparkles, Target, Trophy, Users, Zap } from "lucide-react";

const difficultyColor = (difficulty: Game["difficulty"]) => ({ Easy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400", Hard: "bg-orange-500/10 text-orange-600 dark:text-orange-400", Expert: "bg-rose-500/10 text-rose-600 dark:text-rose-400" }[difficulty]);

function GameCard({ game, compact = false }: { game: Game; compact?: boolean }) {
  const navigate = useNavigate();
  const Icon = game.icon;
  return <button aria-label={`Play ${game.title}`} onClick={() => navigate(`/games/${game.slug}`)} className={cn("group relative overflow-hidden rounded-[22px] border border-border/70 bg-card text-left shadow-[0_8px_30px_rgb(22_27_45_/_0.035)] transition duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_16px_40px_hsl(var(--primary)/.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2", compact ? "p-4" : "p-5")}>
    <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-[.055] transition group-hover:scale-150" style={{ backgroundColor: game.accent }} />
    <div className="relative flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-[14px]" style={{ backgroundColor: `${game.accent}16`, color: game.accent }}><Icon className="h-[19px] w-[19px]" /></span><span className="rounded-full border border-border/60 px-2 py-1 text-[10px] font-bold text-muted-foreground">{game.category}</span></div>
    <div className="relative mt-5"><h3 className="font-display text-[16px] font-bold tracking-[-.025em]">{game.title}</h3><p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-muted-foreground">{game.description}</p></div>
    <div className="relative mt-5 flex items-center justify-between border-t border-border/60 pt-4"><div className="flex items-center gap-3 text-[10px] font-semibold text-muted-foreground"><span className={cn("rounded-full px-2 py-1", difficultyColor(game.difficulty))}>{game.difficulty}</span><span className="flex items-center gap-1"><Clock3 className="h-3 w-3" />{game.duration}</span></div><span className="grid h-8 w-8 place-items-center rounded-full bg-foreground text-background transition group-hover:bg-primary"><ArrowUpRight className="h-4 w-4" /></span></div>
  </button>;
}

function usePlayerResults() {
  const [results, setResults] = useState<StoredResult[]>(() => getGuestHistory());
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session?.user) return;
      const response = await supabase.from("game_sessions").select("game_id, duration_ms, score, moves, mistakes, hints_used, completed_at").eq("user_id", data.session.user.id).eq("completion_status", "completed").order("completed_at", { ascending: false }).limit(100);
      if (active && !response.error) setResults((response.data ?? []).map((row: any) => ({ gameId: row.game_id, durationMs: row.duration_ms ?? 0, score: row.score ?? 0, moves: row.moves ?? 0, mistakes: row.mistakes ?? 0, hintsUsed: row.hints_used ?? 0, completedAt: row.completed_at })));
    });
    return () => { active = false; };
  }, []);
  return results;
}

function getCountdown() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const seconds = Math.max(0, Math.floor((next.getTime() - Date.now()) / 1000));
  return `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

const Index = () => {
  const navigate = useNavigate();
  const results = usePlayerResults();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All games");
  const [difficulty, setDifficulty] = useState("All");
  const [countdown, setCountdown] = useState(getCountdown);
  const featured = games.find((game) => game.slug === "daily-mystery")!;
  const filtered = useMemo(() => games.filter((game) => (category === "All games" || game.category === category) && (difficulty === "All" || game.difficulty === difficulty) && `${game.title} ${game.description}`.toLowerCase().includes(query.toLowerCase())), [category, difficulty, query]);
  const completed = results.length;
  const totalTime = results.reduce((sum, result) => sum + result.durationMs, 0);
  const averageScore = completed ? Math.round(results.reduce((sum, result) => sum + result.score, 0) / completed) : 0;
  const personalRecords = new Set(results.map((result) => result.gameId)).size;
  const continueGames = results.length ? results.map((result) => games.find((game) => game.id === result.gameId)).filter(Boolean).slice(0, 3) as Game[] : games.filter((game) => game.featured).slice(0, 3);

  useEffect(() => { const timer = window.setInterval(() => setCountdown(getCountdown()), 1000); return () => window.clearInterval(timer); }, []);

  return <AppShell><div className="mx-auto max-w-[1440px] px-4 pb-24 pt-8 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
    <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
      <div className="relative min-h-[298px] overflow-hidden rounded-[28px] bg-[#1f2540] p-7 text-white shadow-[0_18px_50px_rgb(31_37_64_/_0.17)] sm:p-9"><div className="absolute right-0 top-0 h-full w-[55%] opacity-80" aria-hidden="true"><div className="absolute right-[-8%] top-[-20%] h-[310px] w-[310px] rounded-full border border-white/10" /><div className="absolute right-[8%] top-[16%] grid w-[200px] grid-cols-5 gap-2 rotate-12 opacity-70">{Array.from({ length: 25 }).map((_, i) => <span key={i} className={cn("aspect-square rounded-[5px] border border-white/10", [3, 7, 8, 13, 18, 23].includes(i) ? "bg-[#8278ff] shadow-[0_0_18px_#8278ff]" : "bg-white/[.035]")} />)}</div></div><div className="relative z-10 flex h-full max-w-[480px] flex-col justify-between"><div><div className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#bdb8ff]"><Sparkles className="h-3.5 w-3.5" /> Today's featured puzzle</div><h1 className="max-w-[390px] font-display text-3xl font-extrabold leading-[1.05] tracking-[-.05em]">Make a little room for a <span className="text-[#aaa5ff]">big idea.</span></h1><p className="mt-4 max-w-[350px] text-[13px] leading-6 text-white/65">{featured.description} A fresh challenge for the whole Gridverse.</p></div><div className="mt-7 flex flex-wrap items-center gap-3"><Button onClick={() => navigate(`/games/${featured.slug}`)} className="h-11 rounded-xl bg-white px-5 text-[12px] font-bold text-[#272b49] hover:bg-white/90"><Play className="mr-2 h-3.5 w-3.5 fill-current" /> Play today's puzzle</Button><span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/55"><Clock3 className="h-3.5 w-3.5" /> Resets in {countdown} UTC</span></div></div></div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-2">{[{ label: "Games completed", value: completed ? String(completed) : "—", meta: completed ? "Synced progress" : "Play your first", icon: Target, color: "#635BFF" }, { label: "Total playtime", value: totalTime ? `${Math.floor(totalTime / 60000)}m` : "—", meta: totalTime ? "Across completed solves" : "No sessions yet", icon: Clock3, color: "#2F9B86" }, { label: "Average score", value: averageScore ? `${averageScore}` : "—", meta: averageScore ? "From saved results" : "No scores yet", icon: Zap, color: "#E39B32" }, { label: "Personal records", value: personalRecords ? String(personalRecords) : "—", meta: personalRecords ? "Games with a result" : "Keep exploring", icon: Trophy, color: "#E16B77" }].map(({ label, value, meta, icon: Icon, color }) => <div key={label} className="rounded-[22px] border border-border/70 bg-card p-5 shadow-[0_8px_30px_rgb(22_27_45_/_0.03)]"><div className="flex items-center justify-between"><span className="grid h-8 w-8 place-items-center rounded-xl" style={{ backgroundColor: `${color}16`, color }}><Icon className="h-4 w-4" /></span><ArrowUpRight className="h-4 w-4 text-muted-foreground/50" /></div><div className="mt-5 font-display text-2xl font-extrabold tracking-[-.04em]">{value}</div><div className="mt-1 text-[11px] font-semibold text-muted-foreground">{label}</div><div className="mt-3 text-[10px] font-bold" style={{ color }}>{meta}</div></div>)}</div>
    </section>

    <section className="mt-10"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-primary">Your queue</p><h2 className="mt-1 font-display text-2xl font-extrabold tracking-[-.04em]">{results.length ? "Continue playing" : "Start with a favorite"}</h2></div><Button variant="ghost" onClick={() => navigate("/games")} className="rounded-xl text-xs font-bold text-muted-foreground hover:text-primary">View all <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Button></div><div className="grid gap-4 md:grid-cols-3">{continueGames.map((game, index) => { const best = getBestGuestResult(game.id); return <div key={game.id} className="flex items-center gap-4 rounded-[20px] border border-border/70 bg-card p-4 shadow-[0_8px_30px_rgb(22_27_45_/_0.03)]"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px]" style={{ backgroundColor: `${game.accent}14`, color: game.accent }}><game.icon className="h-[19px] w-[19px]" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="truncate text-[13px] font-bold">{game.title}</h3><span className="text-[10px] font-bold text-primary">{best ? formatDuration(best.durationMs) : game.duration}</span></div><p className="mt-2 truncate text-[10px] font-semibold text-muted-foreground">{best ? `Best guest time · ${best.score} pts` : `${game.category} · ${game.difficulty}`}</p></div><Button onClick={() => navigate(`/games/${game.slug}`)} variant="outline" size="icon" aria-label={`Play ${game.title}`} className="h-8 w-8 shrink-0 rounded-lg"><Play className="h-3.5 w-3.5 fill-current" /></Button></div>; })}</div></section>

    <section className="mt-11"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-primary">Explore the archive</p><h2 className="mt-1 font-display text-2xl font-extrabold tracking-[-.04em]">Find your next puzzle</h2></div><div className="hidden items-center gap-2 text-[11px] font-semibold text-muted-foreground sm:flex"><Users className="h-3.5 w-3.5" /> Community rankings are verified</div></div><div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center"><div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search puzzles" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search puzzles by name or skill..." className="h-11 rounded-xl border-border/70 bg-card pl-10 text-xs shadow-none" /></div><div className="flex gap-2 overflow-x-auto pb-1">{categories.map(({ label, icon: Icon }) => <button key={label} onClick={() => setCategory(label)} aria-pressed={category === label} className={cn("flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2.5 text-[11px] font-bold transition", category === label ? "border-primary bg-primary text-primary-foreground" : "border-border/70 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground")}><Icon className="h-3.5 w-3.5" />{label}</button>)}</div><select aria-label="Filter by difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="h-11 rounded-xl border border-border/70 bg-card px-3 text-xs font-bold text-muted-foreground outline-none focus:border-primary"><option>All</option><option>Easy</option><option>Medium</option><option>Hard</option><option>Expert</option></select></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{filtered.slice(0, 8).map((game) => <GameCard key={game.id} game={game} />)}</div>{filtered.length === 0 && <div className="rounded-[22px] border border-dashed border-border p-12 text-center text-sm text-muted-foreground">No puzzles match that search yet.</div>}</section>

    <section className="mt-11 grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><div className="rounded-[24px] border border-border/70 bg-card p-6"><div className="flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-primary">Community pulse</p><h2 className="mt-1 font-display text-xl font-extrabold tracking-[-.035em]">Global activity</h2></div><Button variant="ghost" onClick={() => navigate("/leaderboards")} className="rounded-xl text-[11px] font-bold text-muted-foreground">Leaderboards <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Button></div><div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center"><Users className="mx-auto h-6 w-6 text-muted-foreground/40" /><p className="mt-3 text-xs font-bold">Verified activity will appear here</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Community counts are never invented. Complete a puzzle and rankings will update from stored sessions.</p></div></div><div className="relative overflow-hidden rounded-[24px] bg-primary p-6 text-primary-foreground"><div className="absolute -bottom-12 -right-8 h-36 w-36 rounded-full border-[22px] border-white/10" /><div className="relative"><Flame className="h-6 w-6 text-[#ffd078]" /><h2 className="mt-5 max-w-[230px] font-display text-2xl font-extrabold tracking-[-.04em]">Build a calmer streak.</h2><p className="mt-3 max-w-[250px] text-xs leading-5 text-white/70">Complete one puzzle today and keep your progress grounded in real solves.</p><Button onClick={() => navigate(`/games/${featured.slug}`)} className="mt-6 rounded-xl bg-white text-xs font-bold text-primary hover:bg-white/90">Play daily mystery <ArrowRight className="ml-2 h-3.5 w-3.5" /></Button></div></div></section>
  </div></AppShell>;
};

export { GameCard, difficultyColor };
export default Index;
