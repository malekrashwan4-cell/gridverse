# Gridverse mini-game audit

## Scope and method

This audit covers every game declared in the original `src/data/games.ts`, its board branch in `src/components/GameBoard.tsx`, the generators in `src/lib/gameplay.ts` and `src/lib/challenge-data.ts`, and the challenge/scoring flow in `src/pages/GamePage.tsx`. No browser automation or real-player study was available in this environment, so the scores below are design and code-review judgments, not player research or fabricated usage data.

Scores are out of 10: **fun**, **originality**, **depth**, **replayability**, **reliability**, and **potential**. The recommendation is the primary product decision.

| Game | Fun | Originality | Depth | Replayability | Reliability | Potential | Decision |
|---|---:|---:|---:|---:|---:|---:|---|
| Number Grid | 8 | 6 | 8 | 7 | 9 | 9 | KEEP |
| Mine Logic | 8 | 7 | 8 | 8 | 8 | 9 | KEEP |
| Nonogram | 8 | 8 | 8 | 7 | 9 | 9 | KEEP |
| Binary Grid | 7 | 6 | 8 | 7 | 9 | 8 | KEEP |
| Pathfinder | 7 | 6 | 7 | 7 | 8 | 8 | KEEP |
| Region Rules | 5 | 6 | 5 | 4 | 6 | 6 | MERGE → Number Grid |
| Perfect Placement | 6 | 5 | 7 | 6 | 8 | 7 | MERGE → Number Grid |
| Pattern Shift | 8 | 8 | 8 | 7 | 8 | 9 | KEEP |
| Odd One Out | 7 | 6 | 5 | 6 | 9 | 8 | KEEP |
| Matrix Mystery | 8 | 8 | 8 | 7 | 8 | 9 | KEEP |
| Color Logic | 5 | 5 | 5 | 4 | 8 | 6 | MERGE → Number Grid |
| Sequence Detective | 6 | 6 | 6 | 5 | 8 | 7 | MERGE → Pattern Shift |
| Mirror World | 8 | 8 | 7 | 7 | 9 | 9 | KEEP |
| Shape Packing | 4 | 7 | 4 | 3 | 6 | 5 | REMOVE |
| Rotation Puzzle | 4 | 4 | 2 | 3 | 9 | 4 | REMOVE |
| Cube Explorer | 4 | 7 | 3 | 3 | 7 | 5 | REMOVE |
| Shadow Match | 4 | 5 | 3 | 3 | 9 | 4 | REMOVE |
| Flash Grid | 8 | 6 | 7 | 8 | 9 | 9 | KEEP |
| Symbol Recall | 6 | 6 | 6 | 5 | 8 | 7 | MERGE → Flash Grid |
| Change Detector | 7 | 7 | 6 | 6 | 8 | 8 | KEEP |
| Sequence Memory | 8 | 6 | 8 | 8 | 9 | 9 | KEEP |
| Hidden Pattern | 5 | 5 | 5 | 4 | 8 | 6 | MERGE → Flash Grid |
| Rule Breaker | 4 | 6 | 3 | 3 | 8 | 5 | REMOVE |
| Switchboard | 8 | 8 | 8 | 8 | 8 | 9 | KEEP |
| Mystery Network | 4 | 7 | 3 | 3 | 7 | 5 | REMOVE |
| One Move | 4 | 5 | 2 | 2 | 9 | 4 | REMOVE |
| Constraint Master | 5 | 5 | 5 | 4 | 8 | 6 | MERGE → Number Grid |
| Daily Mystery | 8 | 7 | 6 | 9 | 8 | 9 | KEEP |

## Key findings

- The strongest Gridverse identity is a compact set of rule-driven puzzles: deduction grids, mines, Nonograms, binary logic, visual transformations, spatial reflection, memory, Lights Out, and the shared daily challenge.
- The largest overlap was among generic four-slot constraint/choice games (`Color Logic`, `Constraint Master`, `Region Rules`, and `Perfect Placement`) and among visual sequence games (`Sequence Detective` and `Pattern Shift`).
- The weakest implementations were not necessarily the longest files. Several spatial and deduction entries rendered a fixed answer behind a thin interaction layer: `Rotation Puzzle`, `One Move`, `Mystery Network`, `Rule Breaker`, and `Shape Packing` had little meaningful search space or replay value.
- The earlier Mine Logic correction is preserved: hitting a mine records one mistake and ends only when the configured mistake budget is exceeded; it no longer cascades into every possible mistake.

## Final release lineup

The release catalog is now 14 games:

- **Logic:** Number Grid, Mine Logic, Nonogram, Binary Grid, Pathfinder
- **Patterns:** Pattern Shift, Odd One Out, Matrix Mystery
- **Spatial:** Mirror World
- **Memory:** Flash Grid, Sequence Memory, Change Detector
- **Deduction:** Switchboard, Daily Mystery

The merged games are archived in the existing mechanic code rather than deleted. Their strongest ideas have a clear home: constraint placement belongs with the validated grid family, visual sequences belong with Pattern Shift, and spatial identity recall belongs with Flash Grid.

## Implementation changes

- Replaced the 28-item public catalog with the curated 14-game lineup.
- Retained the full `GameKind` union, board branches, generators, and registry entries so historical code and saved result identifiers are not destroyed.
- Updated the catalog copy and authentication surface to say 14 puzzles instead of 28.
- Kept daily challenges, filters, featured cards, rankings, stats routes, and progress persistence driven from the published catalog.
- Preserved deterministic generation and the existing authenticated/guest save flow.

## Verification status

The source was inspected and the existing unit tests were reviewed. Browser automation, `npm test`, `npm run lint`, and `npm run build` could not be executed in this environment because no command-execution tool is available. Those checks remain required before release. The existing gameplay tests cover valid number/binary grids, Nonogram clues, mine-safe expansion, deterministic pattern puzzles, daily IDs/streaks, and score penalties.
