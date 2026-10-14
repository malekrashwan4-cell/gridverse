import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Clock3, RefreshCw, Trophy } from "lucide-react";

type RankingRow = { rank: number; username: string; best_time: number | null; best_score: number | null; games_completed: number };

function formatTime(ms: number | null) {
  if (ms === null) return "—";
  const total = Math.floor(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function Rankings({ gameId }: { gameId?: string }) {
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(Boolean(gameId));
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!gameId) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    setError(false);
    supabase.rpc("get_game_leaderboard", { p_game_id: gameId, p_limit: 50 }).then(({ data, error: requestError }) => {
      if (!active) return;
      setRows((data ?? []) as RankingRow[]);
      setError(Boolean(requestError));
      setLoading(false);
    });
    return () => { active = false; };
  }, [attempt, gameId]);

  if (loading) return <div className="rounded-[22px] border border-border/70 bg-card p-10 text-center text-xs font-semibold text-muted-foreground">Loading verified rankings…</div>;
  if (error) return <div className="rounded-[22px] border border-dashed border-rose-500/30 bg-rose-500/[.04] p-10 text-center"><p className="text-xs font-bold text-rose-600">Rankings could not load.</p><p className="mt-2 text-[11px] text-muted-foreground">Check your connection and try again.</p><Button type="button" variant="outline" onClick={() => setAttempt((value) => value + 1)} className="mt-4 h-9 rounded-xl text-xs font-bold"><RefreshCw className="mr-2 h-3.5 w-3.5" /> Retry</Button></div>;
  if (!gameId || !rows.length) return <div className="rounded-[22px] border border-dashed border-border bg-card p-12 text-center"><Trophy className="mx-auto h-6 w-6 text-muted-foreground/40" /><h3 className="mt-4 font-display text-sm font-extrabold">Not enough data yet</h3><p className="mx-auto mt-2 max-w-[280px] text-[11px] leading-5 text-muted-foreground">Verified player rankings will appear here after the first public completions.</p></div>;
  return <div className="overflow-x-auto rounded-[22px] border border-border/70 bg-card"><div className="min-w-[520px]"><div className="grid grid-cols-[38px_1fr_100px_90px_80px] gap-3 border-b border-border/60 px-5 py-3 text-[9px] font-bold uppercase tracking-[.14em] text-muted-foreground"><span>#</span><span>Player</span><span>Best time</span><span>Best score</span><span className="text-right">Solved</span></div>{rows.map((row) => <div key={`${row.rank}-${row.username}`} className="grid grid-cols-[38px_1fr_100px_90px_80px] items-center gap-3 border-b border-border/50 px-5 py-4 text-xs last:border-0"><span className="font-display font-extrabold text-muted-foreground">{row.rank}</span><span className="flex items-center gap-2 font-bold"><Avatar className="h-7 w-7"><AvatarFallback className="bg-muted text-[9px] font-bold">{row.username.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>{row.username}</span><span className="flex items-center gap-1 font-semibold tabular-nums text-muted-foreground"><Clock3 className="h-3 w-3" />{formatTime(row.best_time)}</span><span className="font-semibold tabular-nums text-muted-foreground">{row.best_score ?? "—"}</span><span className="text-right font-semibold text-muted-foreground">{row.games_completed}</span></div>)}</div></div>;
}
