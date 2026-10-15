import { describe, expect, it } from "vitest";
import { getGridPuzzle, getNonogramClues, getChoicePuzzle, isValidBinaryGrid, isValidNumberGrid, matchesNonogramClues, nonogramTarget, revealSafeCells } from "@/lib/gameplay";
import { getDailyPuzzleId, getDailyStreak } from "@/lib/progress";

const tiers = [1, 2, 3] as const;

describe("Gridverse puzzle rules", () => {
  it("generates valid number grids and keeps every clue consistent", () => {
    tiers.forEach((tier) => {
      const puzzle = getGridPuzzle("number-grid", tier, tier);
      expect(isValidNumberGrid(puzzle.target)).toBe(true);
      puzzle.givens.forEach((index) => expect(puzzle.target[index]).not.toBeNull());
    });
  });

  it("generates balanced binary grids without duplicate lines", () => {
    tiers.forEach((tier) => expect(isValidBinaryGrid(getGridPuzzle("binary-grid", tier, tier).target)).toBe(true));
  });

  it("accepts any nonogram solution matching the calculated clues", () => {
    expect(matchesNonogramClues(nonogramTarget, getNonogramClues(nonogramTarget))).toBe(true);
  });

  it("expands zero-clue mine areas without revealing mines", () => {
    const revealed = revealSafeCells(0, [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1], [2, 7, 11, 14], [], []);
    expect(revealed).not.toContain(2);
    expect(revealed).toContain(0);
  });

  it("keeps the daily puzzle stable for a date and changes the identifier next day", () => {
    const today = new Date("2026-01-03T12:00:00Z");
    const tomorrow = new Date("2026-01-04T12:00:00Z");
    expect(getDailyPuzzleId(today)).toBe(getDailyPuzzleId(today));
    expect(getDailyPuzzleId(today)).not.toBe(getDailyPuzzleId(tomorrow));
    expect(getChoicePuzzle("daily-mystery").id).toMatch(/^daily-/);
  });

  it("counts consecutive completed daily dates", () => {
    const results = [
      { gameId: "daily-mystery", durationMs: 1000, score: 1, moves: 1, mistakes: 0, hintsUsed: 0, completedAt: "2026-01-03T10:00:00Z" },
      { gameId: "daily-mystery", durationMs: 1000, score: 1, moves: 1, mistakes: 0, hintsUsed: 0, completedAt: "2026-01-02T10:00:00Z" },
    ];
    expect(getDailyStreak(results, new Date("2026-01-03T12:00:00Z"))).toBe(2);
  });
});
EOF