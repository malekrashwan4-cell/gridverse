export function unlockAchievements(gameId: string, mistakes: number): string[] {
  const candidates = [{ id: `first-${gameId}`, title: 'First solve' }, ...(mistakes === 0 ? [{ id: `clean-${gameId}`, title: 'Clean solve' }] : []), ...(gameId === 'daily-mystery' ? [{ id: 'daily-first', title: 'Daily detective' }] : [])];
  try {
    const value: unknown = JSON.parse(localStorage.getItem('gridverse-achievements') ?? '[]');
    const existing = new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []);
    const unlocked = candidates.filter(item => !existing.has(item.id));
    unlocked.forEach(item => existing.add(item.id));
    localStorage.setItem('gridverse-achievements', JSON.stringify([...existing]));
    return unlocked.map(item => item.title);
  } catch { return []; }
}
