export type StoredResult = {
  gameId: string;
  durationMs: number;
  score: number;
  moves: number;
  mistakes: number;
  hintsUsed: number;
  completedAt: string;
  difficulty?: "normal" | "hard" | "expert";
  stage?: number;
  scoreVersion?: 2;
};

export type ChallengeMetric = {
  gameId: string;
  difficulty: "normal" | "hard" | "expert";
  stage: number;
  completed: boolean;
  durationMs: number;
  moves: number;
  mistakes: number;
  hintsUsed?: number;
  recordedAt: string;
};

const HISTORY_KEY = "gridverse-history";
const METRICS_KEY = "gridverse-challenge-metrics";

function readArray<T>(key: string): T[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function getGuestHistory(): StoredResult[] {
  return readArray<StoredResult>(HISTORY_KEY).filter((result) => result && typeof result.gameId === "string" && Number.isFinite(result.durationMs) && Number.isFinite(result.score));
}

export function saveGuestResult(result: StoredResult) {
  try {
    const history = getGuestHistory();
    const next = { ...result, durationMs: Math.max(0, Math.round(result.durationMs)), score: Math.max(0, Math.round(result.score)), scoreVersion: 2 as const };
    localStorage.setItem(HISTORY_KEY, JSON.stringify([next, ...history].slice(0, 100)));
    localStorage.setItem(`gridverse-result-${result.gameId}`, JSON.stringify(next));
  } catch {
    // Guest mode remains playable when browser storage is blocked or full.
  }
}

export function getChallengeMetrics(): ChallengeMetric[] {
  return readArray<ChallengeMetric>(METRICS_KEY);
}

export function recordChallengeMetric(metric: ChallengeMetric) {
  try {
    localStorage.setItem(METRICS_KEY, JSON.stringify([metric, ...getChallengeMetrics()].slice(0, 300)));
  } catch {
    // Metrics are optional and never block a run.
  }
}

export function getBestGuestResult(gameId: string) {
  return getGuestHistory().filter((result) => result.gameId === gameId).sort((a, b) => a.durationMs - b.durationMs || b.score - a.score)[0];
}

export function getDailyPuzzleId(date = new Date()) {
  return `daily-${date.toISOString().slice(0, 10)}`;
}

export function getDailyStreak(results: StoredResult[], now = new Date()) {
  const days = new Set(results.filter((result) => result.gameId === "daily-mystery").map((result) => result.completedAt.slice(0, 10)));
  let cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export function formatDuration(durationMs?: number | null) {
  if (durationMs == null || !Number.isFinite(durationMs)) return "—";
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}
EOF