import {
  Binary,
  Blocks,
  Brain,
  Compass,
  Crosshair,
  Eye,
  Grid3X3,
  Lightbulb,
  Network,
  Search,
  Shapes,
  Sparkles,
  Waypoints,
} from "lucide-react";

export type GameCategory = "Logic" | "Patterns" | "Spatial" | "Memory" | "Deduction";

// The union retains archived mechanics so saved historical results and the implementation archive stay type-safe.
export type GameKind =
  | "number-grid" | "mine-logic" | "nonogram" | "binary-grid" | "pathfinder" | "region-rules" | "perfect-placement"
  | "pattern-shift" | "odd-one-out" | "matrix-mystery" | "color-logic" | "sequence-detective"
  | "mirror-world" | "shape-packing" | "rotation-puzzle" | "cube-explorer" | "shadow-match"
  | "flash-grid" | "symbol-recall" | "change-detector" | "sequence-memory" | "hidden-pattern"
  | "rule-breaker" | "switchboard" | "mystery-network" | "one-move" | "constraint-master" | "daily-mystery";

export type Game = {
  id: string;
  title: string;
  slug: string;
  category: GameCategory;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  duration: string;
  players: string;
  description: string;
  kind: GameKind;
  accent: string;
  icon: typeof Grid3X3;
  featured?: boolean;
  newGame?: boolean;
};

export const games: Game[] = [
  { id: "number-grid", title: "Number Grid", slug: "number-grid", category: "Logic", difficulty: "Medium", duration: "3–5 min", players: "12.4k", description: "Complete a compact Latin grid using row and column deduction.", kind: "number-grid", accent: "#635BFF", icon: Grid3X3, featured: true },
  { id: "mine-logic", title: "Mine Logic", slug: "mine-logic", category: "Logic", difficulty: "Hard", duration: "4–7 min", players: "8.9k", description: "Use neighboring counts to clear safe cells and mark certain mines.", kind: "mine-logic", accent: "#FF7A59", icon: Crosshair },
  { id: "nonogram", title: "Nonogram", slug: "nonogram", category: "Logic", difficulty: "Medium", duration: "5–8 min", players: "10.8k", description: "Reconstruct a hidden pixel pattern from run-length clues.", kind: "nonogram", accent: "#2F9B86", icon: Blocks },
  { id: "binary-grid", title: "Binary Grid", slug: "binary-grid", category: "Logic", difficulty: "Medium", duration: "2–4 min", players: "9.7k", description: "Balance every line while avoiding triples and duplicate patterns.", kind: "binary-grid", accent: "#2E73E8", icon: Binary },
  { id: "pathfinder", title: "Pathfinder", slug: "pathfinder", category: "Logic", difficulty: "Easy", duration: "2–3 min", players: "15.1k", description: "Plan a legal route to the endpoint without revisiting cells.", kind: "pathfinder", accent: "#E5A23C", icon: Waypoints },
  { id: "pattern-shift", title: "Pattern Shift", slug: "pattern-shift", category: "Patterns", difficulty: "Medium", duration: "2–4 min", players: "11.6k", description: "Infer the transformation and draw the next visual frame.", kind: "pattern-shift", accent: "#635BFF", icon: Sparkles, featured: true },
  { id: "odd-one-out", title: "Odd One Out", slug: "odd-one-out", category: "Patterns", difficulty: "Easy", duration: "1–2 min", players: "18.2k", description: "Spot the single tile that violates the shared visual attribute.", kind: "odd-one-out", accent: "#F05D7B", icon: Search },
  { id: "matrix-mystery", title: "Matrix Mystery", slug: "matrix-mystery", category: "Patterns", difficulty: "Hard", duration: "3–5 min", players: "7.8k", description: "Complete a visual relationship matrix by tracking transformations.", kind: "matrix-mystery", accent: "#2F9B86", icon: Grid3X3 },
  { id: "mirror-world", title: "Mirror World", slug: "mirror-world", category: "Spatial", difficulty: "Easy", duration: "2–3 min", players: "9.3k", description: "Reflect a shape across the mirror without rotating it.", kind: "mirror-world", accent: "#2E73E8", icon: Shapes },
  { id: "flash-grid", title: "Flash Grid", slug: "flash-grid", category: "Memory", difficulty: "Medium", duration: "2–4 min", players: "14.6k", description: "Memorize a growing spatial pattern before it disappears.", kind: "flash-grid", accent: "#635BFF", icon: Eye, featured: true },
  { id: "sequence-memory", title: "Sequence Memory", slug: "sequence-memory", category: "Memory", difficulty: "Medium", duration: "2–4 min", players: "12.1k", description: "Repeat an expanding sequence of visual signals in order.", kind: "sequence-memory", accent: "#D69031", icon: Brain },
  { id: "change-detector", title: "Change Detector", slug: "change-detector", category: "Memory", difficulty: "Easy", duration: "1–2 min", players: "16.4k", description: "Compare two scenes and identify every controlled change.", kind: "change-detector", accent: "#E16C5F", icon: Search },
  { id: "switchboard", title: "Switchboard", slug: "switchboard", category: "Deduction", difficulty: "Medium", duration: "3–5 min", players: "9.9k", description: "Plan interconnected toggles until every light is on.", kind: "switchboard", accent: "#E3A632", icon: Lightbulb },
  { id: "daily-mystery", title: "Daily Mystery", slug: "daily-mystery", category: "Deduction", difficulty: "Hard", duration: "4–7 min", players: "21.8k", description: "Solve the same date-seeded deduction challenge as everyone else.", kind: "daily-mystery", accent: "#8E61D8", icon: Compass, featured: true, newGame: true },
];

export const categories: Array<{ label: string; icon: typeof Grid3X3 }> = [
  { label: "All games", icon: Grid3X3 },
  { label: "Logic", icon: Binary },
  { label: "Patterns", icon: Sparkles },
  { label: "Spatial", icon: Shapes },
  { label: "Memory", icon: Brain },
  { label: "Deduction", icon: Network },
];

export const getGame = (slug?: string) => games.find((game) => game.slug === slug);
export const isPublishedGame = (kind: GameKind) => games.some((game) => game.kind === kind);
