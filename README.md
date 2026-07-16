# Good News Garden Clone

A pixel-perfect clone of [raihankalla.id/goodnews-garden](https://www.raihankalla.id/goodnews-garden) — an interactive 3D network visualization of Indonesian good news, styled as a blooming garden.

Built with the [ai-website-cloner-template](https://github.com/JCodesMore/ai-website-cloner-template).

## Features

- **3D Force Graph** — Interactive network visualization powered by 3d-force-graph + Three.js
- **Flower Sprites** — Each news node rendered as a flower with category-based colors
- **Animated Timeline** — Watch news bloom over time with play/pause/speed controls
- **Auto-Orbit Camera** — Smooth camera rotation around the network
- **Category Legend** — 10 categories with emoji and gradient colors (Wisata, Nasional, etc.)
- **Info Panel** — Click any node to see title, keywords, preview, and category
- **Text Stream** — Scrolling sidebar of recent news titles
- **Glass Morphism UI** — Soft, organic garden theme with blur effects
- **Responsive** — Mobile-friendly layout with collapsible panels

## Tech Stack

- **Next.js 16** — App Router, React 19, TypeScript strict
- **3D Force Graph** — Network visualization
- **Three.js** — 3D rendering and custom sprites
- **D3.js** — Data processing
- **Tailwind CSS v4** — oklch design tokens
- **Inter + JetBrains Mono** — Typography

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # ESLint check
npm run typecheck  # TypeScript check
npm run check      # Run lint + typecheck + build
```

## Project Structure

```
src/
  app/              # Next.js routes
  components/garden/# Garden-specific components
    GardenVisualization.tsx  # 3D force graph
    TitleBar.tsx            # Header with stats
    ControlsPanel.tsx       # Play/pause/speed/orbit
    LegendPanel.tsx         # Category legend
    InfoPanel.tsx           # Node detail panel
    LoadingScreen.tsx       # Loading animation
    DateDisplay.tsx         # Timeline progress
    TextStream.tsx          # Scrolling labels
    GraphTooltip.tsx        # Hover tooltips
    Credits.tsx             # Footer credits
  hooks/
    useGardenState.ts       # State management
  lib/
    garden-config.ts        # Colors, categories, config
  types/
    garden.ts               # TypeScript interfaces
public/data/
  goodnews-network.json     # 12MB news dataset
```

## Data

The visualization uses a 12MB JSON dataset containing Indonesian good news articles from [goodnewsfromindonesia.id](https://www.goodnewsfromindonesia.id), organized by category and date.

## License

MIT
