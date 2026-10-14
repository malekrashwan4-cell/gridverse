export type StoredResult = {
  gameId: string;
  durationMs: number;
  score: number;
  moves: number;
  mistakes: number;
  hintsUsed: number;
  completedAt: string;
};

const HISTORY_KEY = "gridverse-history";

export function getGuestHistory(): StoredResult[] {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function saveGuestResult(result: StoredResult) {
  const history = getGuestHistory();
  localStorage.setItem(HISTORY_KEY, JSON.stringify([result, ...history].slice(0, 100)));
  localStorage.setItem(`gridverse-result-${result.gameId}`, JSON.stringify(result));
}

export function getBestGuestResult(gameId: string) {
  return getGuestHistory()
    .filter((result) => result.gameId === gameId)
    .sort((a, b) => a.durationMs - b.durationMs)[0];
}

export function formatDuration(durationMs?: number | null) {
  if (durationMs == null) return "—";
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}
