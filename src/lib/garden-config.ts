import type { CategoryConfig, FlowerPalette } from "@/types/garden";

export const FLOWER_PALETTES: Record<string, FlowerPalette> = {
  Wisata: { petal: "#81D4FA", center: "#FFE082", glow: "#4FC3F7" },
  "IPTEK & Pendidikan": { petal: "#A5D6A7", center: "#FFF59D", glow: "#66BB6A" },
  Nasional: { petal: "#EF9A9A", center: "#FFCC80", glow: "#E57373" },
  Humaniora: { petal: "#FFE082", center: "#FFAB91", glow: "#FFD54F" },
  "Sosial Budaya": { petal: "#F8BBD9", center: "#FFECB3", glow: "#F48FB1" },
  Sejarah: { petal: "#CE93D8", center: "#F8BBD9", glow: "#BA68C8" },
  Opini: { petal: "#90CAF9", center: "#B3E5FC", glow: "#64B5F6" },
  Internasional: { petal: "#80DEEA", center: "#E0F7FA", glow: "#4DD0E1" },
  Ekonomi: { petal: "#FFAB91", center: "#FFE0B2", glow: "#FF8A65" },
  Olahraga: { petal: "#C5E1A5", center: "#F0F4C3", glow: "#9CCC65" },
  Legenda: { petal: "#E1BEE7", center: "#F3E5F5", glow: "#CE93D8" },
  Uncategorized: { petal: "#CFD8DC", center: "#ECEFF1", glow: "#B0BEC5" },
};

export const CATEGORY_EMOJIS: Record<string, string> = {
  Wisata: "🌊",
  "IPTEK & Pendidikan": "🌿",
  Nasional: "🌹",
  Humaniora: "🌻",
  "Sosial Budaya": "🌸",
  Sejarah: "🍂",
  Opini: "💭",
  Internasional: "🌍",
  Ekonomi: "🌾",
  Olahraga: "🍀",
  Legenda: "✨",
  Uncategorized: "🌱",
};

export const CATEGORIES: CategoryConfig[] = [
  { emoji: "🌊", palette: FLOWER_PALETTES["Wisata"], label: "Wisata" },
  { emoji: "🌿", palette: FLOWER_PALETTES["IPTEK & Pendidikan"], label: "IPTEK & Pendidikan" },
  { emoji: "🌹", palette: FLOWER_PALETTES["Nasional"], label: "Nasional" },
  { emoji: "🌻", palette: FLOWER_PALETTES["Humaniora"], label: "Humaniora" },
  { emoji: "🌸", palette: FLOWER_PALETTES["Sosial Budaya"], label: "Sosial Budaya" },
  { emoji: "🍂", palette: FLOWER_PALETTES["Sejarah"], label: "Sejarah" },
  { emoji: "💭", palette: FLOWER_PALETTES["Opini"], label: "Opini" },
  { emoji: "🌍", palette: FLOWER_PALETTES["Internasional"], label: "Internasional" },
  { emoji: "🌾", palette: FLOWER_PALETTES["Ekonomi"], label: "Ekonomi" },
  { emoji: "🍀", palette: FLOWER_PALETTES["Olahraga"], label: "Olahraga" },
];

export const GRAPH_CONFIG = {
  nodeBaseSize: 3,
  nodeOpacityActive: 1,
  nodeOpacityFaded: 0.8,
  linkOpacity: 0.6,
  linkWidth: 1.5,
  cameraOrbitSpeed: 0.0005,
  cameraDistance: 800,
  cameraMinDistance: 50,
  cameraMaxDistance: 10000,
  glowIntensity: 2.5,
  backgroundColor: "#fefefe",
  defaultNodeColor: "#F8BBD9",
  linkColor: "rgba(129, 199, 132, 0.4)",
};

export function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJIS[category] || CATEGORY_EMOJIS["Uncategorized"] || "🌱";
}

export function getFlowerPalette(category: string): FlowerPalette {
  return FLOWER_PALETTES[category] || FLOWER_PALETTES["Uncategorized"];
}

export function getCategoryGradient(category: string): string {
  const palette = getFlowerPalette(category);
  return `linear-gradient(135deg, ${palette.petal}, ${palette.center})`;
}
