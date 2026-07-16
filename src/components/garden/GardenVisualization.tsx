"use client";

import { useEffect, useRef, useCallback } from "react";
import type { GardenData, GardenNode } from "@/types/garden";
import { getFlowerPalette, GRAPH_CONFIG } from "@/lib/garden-config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ForceGraph3DInstance = any;

interface GardenVisualizationProps {
  data: GardenData;
  currentDateIndex: number;
  isPlaying: boolean;
  speed: number;
  autoOrbit: boolean;
  highlightedCategory: string | null;
  onNodeClick: (node: GardenNode) => void;
  onNodeHover: (node: GardenNode | null) => void;
  onVisibleCountsUpdate: (nodes: number, links: number) => void;
  graphRef: React.MutableRefObject<ForceGraph3DInstance | null>;
}

export function GardenVisualization({
  data,
  currentDateIndex,
  isPlaying,
  speed,
  autoOrbit,
  highlightedCategory,
  onNodeClick,
  onNodeHover,
  onVisibleCountsUpdate,
  graphRef,
}: GardenVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const orbitAngleRef = useRef(0);

  // Group nodes by date
  const nodesByDate = useCallback(() => {
    const grouped: Record<string, GardenNode[]> = {};
    const uniqueDates: string[] = [];

    data.nodes.forEach((node) => {
      if (!grouped[node.date]) {
        grouped[node.date] = [];
        uniqueDates.push(node.date);
      }
      grouped[node.date].push(node);
    });

    return { grouped, uniqueDates };
  }, [data]);

  useEffect(() => {
    if (!containerRef.current) return;

    let graph: ForceGraph3DInstance | null = null;
    let destroyed = false;

    const initGraph = async () => {
      // Dynamic imports for 3D force graph (client-side only)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ForceGraph3D = (await import("3d-force-graph")).default as any;

      const Three = await import("three");

      if (destroyed || !containerRef.current) return;

      const { grouped, uniqueDates } = nodesByDate();

      // Get nodes up to current date index
      const visibleNodeIds = new Set<string>();
      for (let i = 0; i <= Math.min(currentDateIndex, uniqueDates.length - 1); i++) {
        const dateNodes = grouped[uniqueDates[i]] || [];
        dateNodes.forEach((n) => visibleNodeIds.add(n.id));
      }

      const visibleNodes = data.nodes.filter((n) => visibleNodeIds.has(n.id));
      const visibleLinks = data.links.filter(
        (l) =>
          visibleNodeIds.has(typeof l.source === "string" ? l.source : (l.source as GardenNode).id) &&
          visibleNodeIds.has(typeof l.target === "string" ? l.target : (l.target as GardenNode).id)
      );

      onVisibleCountsUpdate(visibleNodes.length, visibleLinks.length);

      const graphData = {
        nodes: visibleNodes.map((n) => ({ ...n })),
        links: visibleLinks.map((l) => ({ ...l })),
      };

      graph = ForceGraph3D()(containerRef.current!)
        .graphData(graphData)
        .backgroundColor(GRAPH_CONFIG.backgroundColor)
        .nodeLabel((node: GardenNode) => node.title)
        .nodeVal((node: GardenNode) => (node as GardenNode).size || GRAPH_CONFIG.nodeBaseSize)
        .nodeColor((node: GardenNode) => {
          const n = node as GardenNode;
          if (highlightedCategory && n.category !== highlightedCategory) {
            return `${GRAPH_CONFIG.defaultNodeColor}44`;
          }
          return getFlowerPalette(n.category).petal;
        })
        .nodeOpacity(GRAPH_CONFIG.nodeOpacityActive)
        .nodeThreeObject((node: GardenNode) => {
          const n = node as GardenNode;
          const palette = getFlowerPalette(n.category);
          const size = Math.max(2, (n.size || GRAPH_CONFIG.nodeBaseSize) * 1.5);

          // Create a flower-like sprite
          const canvas = document.createElement("canvas");
          canvas.width = 64;
          canvas.height = 64;
          const ctx = canvas.getContext("2d")!;

          // Glow
          const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
          gradient.addColorStop(0, `${palette.glow}66`);
          gradient.addColorStop(0.5, `${palette.petal}44`);
          gradient.addColorStop(1, "transparent");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 64, 64);

          // Petals
          ctx.beginPath();
          ctx.arc(32, 32, 16, 0, Math.PI * 2);
          ctx.fillStyle = palette.petal;
          ctx.fill();

          // Center
          ctx.beginPath();
          ctx.arc(32, 32, 8, 0, Math.PI * 2);
          ctx.fillStyle = palette.center;
          ctx.fill();

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const texture = new (Three as any).CanvasTexture(canvas);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const material = new (Three as any).SpriteMaterial({
            map: texture,
            transparent: true,
            opacity:
              highlightedCategory && n.category !== highlightedCategory
                ? 0.15
                : 0.9,
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sprite = new (Three as any).Sprite(material);
          sprite.scale.set(size, size, 1);
          return sprite;
        })
        .linkColor(() => GRAPH_CONFIG.linkColor)
        .linkOpacity(GRAPH_CONFIG.linkOpacity)
        .linkWidth(GRAPH_CONFIG.linkWidth)
        .linkDirectionalParticles(0)
        .onNodeClick((node: GardenNode) => {
          onNodeClick(node as GardenNode);
        })
        .onNodeHover((node: GardenNode | null) => {
          onNodeHover(node as GardenNode | null);
          if (containerRef.current) {
            containerRef.current.style.cursor = node ? "pointer" : "default";
          }
        })
        .enableNodeDrag(false)
        .cooldownTicks(200)
        .cooldownTime(10000)
        .d3AlphaDecay(0.02)
        .d3VelocityDecay(0.3);

      // Camera setup
      graph.cameraPosition({ x: 0, y: 0, z: GRAPH_CONFIG.cameraDistance });

      graphRef.current = graph;
    };

    initGraph();

    return () => {
      destroyed = true;
      if (graph) {
        graph._destructor();
      }
      graphRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDateIndex, highlightedCategory]);

  // Auto-orbit animation
  useEffect(() => {
    if (!autoOrbit || !graphRef.current) return;

    const animate = () => {
      if (!graphRef.current || !autoOrbit) return;

      orbitAngleRef.current += GRAPH_CONFIG.cameraOrbitSpeed * speed;
      const angle = orbitAngleRef.current;
      const distance = GRAPH_CONFIG.cameraDistance;

      graphRef.current.cameraPosition({
        x: distance * Math.sin(angle),
        y: distance * 0.3,
        z: distance * Math.cos(angle),
        lookAt: { x: 0, y: 0, z: 0 },
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [autoOrbit, speed, graphRef]);

  return <div ref={containerRef} className="graph-container" />;
}
