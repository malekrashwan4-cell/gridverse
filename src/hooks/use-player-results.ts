import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getGuestHistory, StoredResult } from "@/lib/progress";

export function usePlayerResults() {
  const [results, setResults] = useState<StoredResult[]>(() => getGuestHistory());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError || !data.session?.user) {
        setLoading(false);
        if (sessionError) setError("Saved results are temporarily unavailable.");
        return;
      }
      const response = await supabase.from("game_sessions").select("game_id, duration_ms, score, moves, mistakes, hints_used, completed_at").eq("user_id", data.session.user.id).eq("completion_status", "completed").order("completed_at", { ascending: false }).limit(100);
      if (!active) return;
      if (response.error) setError("Your saved results are temporarily unavailable.");
      else setResults((response.data ?? []).map((row: any) => ({ gameId: row.game_id, durationMs: row.duration_ms ?? 0, score: row.score ?? 0, moves: row.moves ?? 0, mistakes: row.mistakes ?? 0, hintsUsed: row.hints_used ?? 0, completedAt: row.completed_at })));
      setLoading(false);
    }).catch(() => { if (active) { setError("Saved results are temporarily unavailable."); setLoading(false); } });
    return () => { active = false; };
  }, []);

  return { results, loading, error };
}
