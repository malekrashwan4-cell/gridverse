import { describe, expect, it } from "vitest";
import { getDailyMysteryPuzzle, getGridPuzzle, getMatrixMysteryPuzzle, getNonogramClues, getOddOneOutPuzzle, getPatternShiftPuzzle, getSequenceDetectivePuzzle, getChoicePuzzle, isValidBinaryGrid, isValidNumberGrid, matchesNonogramClues, nonogramTarget, revealSafeCells } from "@/lib/gameplay";
import { getDailyPuzzleId, getDailyStreak } from "@/lib/progress";
import { calculateScore, getScoreBreakdown } from "@/lib/scoring";

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

  it("generates distinct mechanics with valid deterministic answer data", () => {
    const pattern = getPatternShiftPuzzle(2);
    expect(pattern.target).toEqual([0, 5, 10, 15]);
    const odd = getOddOneOutPuzzle(2);
    expect(odd.items.filter((item) => item.fill === "outline")).toHaveLength(1);
    expect(getMatrixMysteryPuzzle(2).options[getMatrixMysteryPuzzle(2).answer]).toBe("5");
    expect(getSequenceDetectivePuzzle(3).options[getSequenceDetectivePuzzle(3).answer]).toBe("◆◆◆");
    expect(getDailyMysteryPuzzle(new Date("2026-01-03T12:00:00Z")).answer).toEqual([3, 2, 1, 0]);
  });

  it("keeps the daily puzzle stable for a date and changes the identifier next day", () => {
    const today = new Date("2026-01-03T12:00:00Z");
    const tomorrow = new Date("2026-01-04T12:00:00Z");
    expect(getDailyPuzzleId(today)).toBe(getDailyPuzzleId(today));
    expect(getDailyPuzzleId(today)).not.toBe(getDailyPuzzleId(tomorrow));
    expect(getChoicePuzzle("daily-mystery").id).toMatch(/^daily-/);
  });

  it("keeps score non-negative and exposes its penalty breakdown", () => {
    const breakdown = getScoreBreakdown("mine-logic", 900000, 100, 20, 10, "expert");
    expect(breakdown.total).toBeGreaterThanOrEqual(0);
    expect(calculateScore("mine-logic", 1000, 1, 0, 0, "hard")).toBeGreaterThan(calculateScore("mine-logic", 1000, 1, 2, 0, "hard"));
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