import type { GameKind } from "@/data/games";

export type GameMechanic = "latin-grid" | "mines" | "nonogram" | "binary" | "path" | "regions" | "placement" | "pattern" | "sequence" | "spatial" | "memory" | "lights-out" | "network" | "constraints" | "daily";

type MechanicDefinition = { family: GameMechanic; objective: string; moveWeight: number };

export const mechanicRegistry: Record<GameKind, MechanicDefinition> = {
  "number-grid": { family: "latin-grid", objective: "Complete every row and column without duplicates.", moveWeight: 16 },
  "mine-logic": { family: "mines", objective: "Reveal every safe cell using adjacent mine clues.", moveWeight: 18 },
  nonogram: { family: "nonogram", objective: "Match every row and column clue.", moveWeight: 18 },
  "binary-grid": { family: "binary", objective: "Balance lines, avoid triples, and keep them unique.", moveWeight: 16 },
  pathfinder: { family: "path", objective: "Reach the endpoint on a legal simple path.", moveWeight: 22 },
  "region-rules": { family: "regions", objective: "Build connected regions that satisfy their clues.", moveWeight: 22 },
  "perfect-placement": { family: "placement", objective: "Place one of each symbol in every line.", moveWeight: 22 },
  "pattern-shift": { family: "pattern", objective: "Infer the transformation between visual frames.", moveWeight: 16 },
  "odd-one-out": { family: "pattern", objective: "Find the only tile that violates the attribute rule.", moveWeight: 16 },
  "matrix-mystery": { family: "pattern", objective: "Apply consistent row and column transformations.", moveWeight: 18 },
  "color-logic": { family: "constraints", objective: "Arrange colors while satisfying every adjacency rule.", moveWeight: 20 },
  "sequence-detective": { family: "sequence", objective: "Continue a multi-attribute visual sequence.", moveWeight: 18 },
  "mirror-world": { family: "spatial", objective: "Reflect the arrangement across the marked axis.", moveWeight: 20 },
  "shape-packing": { family: "placement", objective: "Pack pieces into the target footprint without overlap.", moveWeight: 24 },
  "rotation-puzzle": { family: "spatial", objective: "Rotate without reflecting until the orientation matches.", moveWeight: 20 },
  "cube-explorer": { family: "spatial", objective: "Track face adjacency through cube turns.", moveWeight: 20 },
  "shadow-match": { family: "spatial", objective: "Match the contour created by the light direction.", moveWeight: 18 },
  "flash-grid": { family: "memory", objective: "Recall the timed cell pattern.", moveWeight: 12 },
  "symbol-recall": { family: "memory", objective: "Recall symbol identity and position.", moveWeight: 12 },
  "change-detector": { family: "memory", objective: "Identify every controlled scene change.", moveWeight: 14 },
  "sequence-memory": { family: "memory", objective: "Repeat the timed signal sequence in order.", moveWeight: 12 },
  "hidden-pattern": { family: "memory", objective: "Reconstruct the hidden visual structure.", moveWeight: 14 },
  "rule-breaker": { family: "constraints", objective: "Infer and apply the hidden arrangement rule.", moveWeight: 18 },
  switchboard: { family: "lights-out", objective: "Turn every light on using legal toggles.", moveWeight: 22 },
  "mystery-network": { family: "network", objective: "Build the network that satisfies every edge clue.", moveWeight: 22 },
  "one-move": { family: "constraints", objective: "Find the single legal move that reaches the goal.", moveWeight: 24 },
  "constraint-master": { family: "constraints", objective: "Satisfy all simultaneous placement constraints.", moveWeight: 24 },
  "daily-mystery": { family: "daily", objective: "Solve the date-seeded deduction challenge.", moveWeight: 20 },
};

export function getGameMechanic(kind: GameKind) {
  return mechanicRegistry[kind];
}