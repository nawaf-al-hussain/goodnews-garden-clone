export interface GardenNode {
  id: string;
  date: string;
  title: string;
  keywords: string[];
  category: string;
  titleTag: string;
  narasi_preview: string;
  url: string;
  size: number;
  narasiLength: number;
}

export interface GardenLink {
  source: string;
  target: string;
}

export interface GardenData {
  nodes: GardenNode[];
  links: GardenLink[];
}

export interface FlowerPalette {
  petal: string;
  center: string;
  glow: string;
}

export interface CategoryConfig {
  emoji: string;
  palette: FlowerPalette;
  label: string;
}

export type CategoryName =
  | "Wisata"
  | "IPTEK & Pendidikan"
  | "Nasional"
  | "Humaniora"
  | "Sosial Budaya"
  | "Sejarah"
  | "Opini"
  | "Internasional"
  | "Ekonomi"
  | "Olahraga"
  | "Legenda"
  | "Uncategorized";

export interface GardenState {
  isPlaying: boolean;
  currentDateIndex: number;
  speed: number;
  autoOrbit: boolean;
  autoZoom: boolean;
  highlightedCategory: string | null;
  selectedNode: GardenNode | null;
  nodeCount: number;
  linkCount: number;
  currentDate: string;
  progress: number;
}
