import {
  Binary,
  Blocks,
  Brain,
  CircleDot,
  Compass,
  Crosshair,
  Eye,
  Grid3X3,
  Lightbulb,
  Network,
  Palette,
  Puzzle,
  RotateCw,
  Search,
  Shapes,
  Sparkles,
  SquareStack,
  Target,
  Triangle,
  Trophy,
  Waypoints,
} from "lucide-react";

export type GameCategory = "Logic" | "Patterns" | "Spatial" | "Memory" | "Deduction";
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
  { id: "number-grid", title: "Number Grid", slug: "number-grid", category: "Logic", difficulty: "Medium", duration: "3–5 min", players: "12.4k", description: "Place the missing numbers without repeating a row or column.", kind: "number-grid", accent: "#635BFF", icon: Grid3X3, featured: true },
  { id: "mine-logic", title: "Mine Logic", slug: "mine-logic", category: "Logic", difficulty: "Hard", duration: "4–7 min", players: "8.9k", description: "Read the clues, mark the mines, and clear the board safely.", kind: "mine-logic", accent: "#FF7A59", icon: Crosshair },
  { id: "nonogram", title: "Nonogram", slug: "nonogram", category: "Logic", difficulty: "Medium", duration: "5–8 min", players: "10.8k", description: "Reveal a hidden pixel picture from row and column clues.", kind: "nonogram", accent: "#2F9B86", icon: Blocks },
  { id: "binary-grid", title: "Binary Grid", slug: "binary-grid", category: "Logic", difficulty: "Medium", duration: "2–4 min", players: "9.7k", description: "Complete the zeros and ones: no triples, balanced lines.", kind: "binary-grid", accent: "#2E73E8", icon: Binary },
  { id: "pathfinder", title: "Pathfinder", slug: "pathfinder", category: "Logic", difficulty: "Easy", duration: "2–3 min", players: "15.1k", description: "Reach the endpoint through adjacent open cells without revisiting a cell.", kind: "pathfinder", accent: "#E5A23C", icon: Waypoints },
  { id: "region-rules", title: "Region Rules", slug: "region-rules", category: "Logic", difficulty: "Hard", duration: "5–9 min", players: "6.4k", description: "Divide the board into regions that satisfy every clue.", kind: "region-rules", accent: "#A15CE4", icon: SquareStack },
  { id: "perfect-placement", title: "Perfect Placement", slug: "perfect-placement", category: "Logic", difficulty: "Expert", duration: "6–10 min", players: "4.2k", description: "Place pieces so every line has one of each shape.", kind: "perfect-placement", accent: "#D65B94", icon: Target },
  { id: "pattern-shift", title: "Pattern Shift", slug: "pattern-shift", category: "Patterns", difficulty: "Medium", duration: "2–4 min", players: "11.6k", description: "Spot the transformation hiding between each frame.", kind: "pattern-shift", accent: "#635BFF", icon: Sparkles, featured: true },
  { id: "odd-one-out", title: "Odd One Out", slug: "odd-one-out", category: "Patterns", difficulty: "Easy", duration: "1–2 min", players: "18.2k", description: "Find the single tile that breaks the visual rule.", kind: "odd-one-out", accent: "#F05D7B", icon: Search },
  { id: "matrix-mystery", title: "Matrix Mystery", slug: "matrix-mystery", category: "Patterns", difficulty: "Hard", duration: "3–5 min", players: "7.8k", description: "Complete the missing cell in a visual relationship matrix.", kind: "matrix-mystery", accent: "#2F9B86", icon: Grid3X3 },
  { id: "color-logic", title: "Color Logic", slug: "color-logic", category: "Patterns", difficulty: "Medium", duration: "2–4 min", players: "8.2k", description: "Reconstruct the palette using positional clues.", kind: "color-logic", accent: "#EEAA3A", icon: Palette },
  { id: "sequence-detective", title: "Sequence Detective", slug: "sequence-detective", category: "Patterns", difficulty: "Hard", duration: "3–5 min", players: "6.9k", description: "Find the next symbol in a non-numerical sequence.", kind: "sequence-detective", accent: "#AA63D6", icon: Compass },
  { id: "mirror-world", title: "Mirror World", slug: "mirror-world", category: "Spatial", difficulty: "Easy", duration: "2–3 min", players: "9.3k", description: "Rebuild a shape on the opposite side of the mirror.", kind: "mirror-world", accent: "#2E73E8", icon: Shapes },
  { id: "shape-packing", title: "Shape Packing", slug: "shape-packing", category: "Spatial", difficulty: "Expert", duration: "6–10 min", players: "3.8k", description: "Fit every piece into the target area with no overlap.", kind: "shape-packing", accent: "#DF6E52", icon: Blocks },
  { id: "rotation-puzzle", title: "Rotation Puzzle", slug: "rotation-puzzle", category: "Spatial", difficulty: "Medium", duration: "2–4 min", players: "8.5k", description: "Rotate the object until its silhouette matches the target.", kind: "rotation-puzzle", accent: "#5B74DE", icon: RotateCw },
  { id: "cube-explorer", title: "Cube Explorer", slug: "cube-explorer", category: "Spatial", difficulty: "Hard", duration: "3–5 min", players: "5.6k", description: "Predict which faces meet after the cube turns.", kind: "cube-explorer", accent: "#C066D9", icon: SquareStack },
  { id: "shadow-match", title: "Shadow Match", slug: "shadow-match", category: "Spatial", difficulty: "Easy", duration: "1–3 min", players: "13.7k", description: "Match each object to its silhouette from a new angle.", kind: "shadow-match", accent: "#E6A538", icon: CircleDot },
  { id: "flash-grid", title: "Flash Grid", slug: "flash-grid", category: "Memory", difficulty: "Medium", duration: "2–4 min", players: "14.6k", description: "Memorize the highlighted cells before they disappear.", kind: "flash-grid", accent: "#635BFF", icon: Eye, featured: true },
  { id: "symbol-recall", title: "Symbol Recall", slug: "symbol-recall", category: "Memory", difficulty: "Hard", duration: "3–5 min", players: "7.1k", description: "Remember which symbol belongs in each position.", kind: "symbol-recall", accent: "#4D9D84", icon: Brain },
  { id: "change-detector", title: "Change Detector", slug: "change-detector", category: "Memory", difficulty: "Easy", duration: "1–2 min", players: "16.4k", description: "Identify the one detail that changed between two scenes.", kind: "change-detector", accent: "#E16C5F", icon: Search },
  { id: "sequence-memory", title: "Sequence Memory", slug: "sequence-memory", category: "Memory", difficulty: "Medium", duration: "2–4 min", players: "12.1k", description: "Repeat an expanding sequence of visual signals.", kind: "sequence-memory", accent: "#D69031", icon: Lightbulb },
  { id: "hidden-pattern", title: "Hidden Pattern", slug: "hidden-pattern", category: "Memory", difficulty: "Hard", duration: "3–5 min", players: "5.2k", description: "Study the board, then find the pattern from memory.", kind: "hidden-pattern", accent: "#7D6BE0", icon: Eye },
  { id: "rule-breaker", title: "Rule Breaker", slug: "rule-breaker", category: "Deduction", difficulty: "Hard", duration: "4–6 min", players: "6.8k", description: "Test arrangements to discover the hidden rule.", kind: "rule-breaker", accent: "#EA7757", icon: Puzzle },
  { id: "switchboard", title: "Switchboard", slug: "switchboard", category: "Deduction", difficulty: "Medium", duration: "3–5 min", players: "9.9k", description: "Activate every light using interconnected switches.", kind: "switchboard", accent: "#E3A632", icon: Lightbulb },
  { id: "mystery-network", title: "Mystery Network", slug: "mystery-network", category: "Deduction", difficulty: "Expert", duration: "6–9 min", players: "3.1k", description: "Infer the correct connections from a web of clues.", kind: "mystery-network", accent: "#3B8EC4", icon: Network },
  { id: "one-move", title: "One Move", slug: "one-move", category: "Deduction", difficulty: "Easy", duration: "1–2 min", players: "17.3k", description: "Solve the board with exactly one strategic move.", kind: "one-move", accent: "#D45B83", icon: Trophy },
  { id: "constraint-master", title: "Constraint Master", slug: "constraint-master", category: "Deduction", difficulty: "Expert", duration: "5–8 min", players: "4.5k", description: "Satisfy several interacting conditions at the same time.", kind: "constraint-master", accent: "#635BFF", icon: Triangle },
  { id: "daily-mystery", title: "Daily Mystery", slug: "daily-mystery", category: "Deduction", difficulty: "Hard", duration: "4–7 min", players: "21.8k", description: "A fresh handcrafted deduction challenge for everyone.", kind: "daily-mystery", accent: "#8E61D8", icon: Sparkles, featured: true, newGame: true },
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
