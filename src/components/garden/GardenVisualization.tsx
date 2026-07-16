"use client";

import { useEffect, useRef } from "react";
import type { GardenData, GardenNode } from "@/types/garden";
import { getFlowerPalette, GRAPH_CONFIG } from "@/lib/garden-config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ForceGraph3DInstance = any;

interface GardenVisualizationProps {
  data: GardenData;
  visibleNodeIds: Set<string>;
  highlightedCategory: string | null;
  autoOrbit: boolean;
  speed: number;
  onNodeClick: (node: GardenNode) => void;
  onGraphReady: () => void;
}

export function GardenVisualization({
  data,
  visibleNodeIds,
  highlightedCategory,
  autoOrbit,
  speed,
  onNodeClick,
  onGraphReady,
}: GardenVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraph3DInstance | null>(null);
  const animationRef = useRef<number>(0);
  const orbitAngleRef = useRef(0);
  const prevNodeIdsRef = useRef<string>("");

  // Initialize graph once
  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;

    const initGraph = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ForceGraph3D = (await import("3d-force-graph")).default as any;

        // three.js uses named exports, import the whole module
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const THREE = await import("three") as any;

        if (destroyed || !containerRef.current) return;

        const graph = ForceGraph3D()(containerRef.current)
          .graphData({ nodes: [], links: [] })
          .backgroundColor(GRAPH_CONFIG.backgroundColor)
          .nodeLabel("title")
          .nodeVal((node: GardenNode) => node.size || GRAPH_CONFIG.nodeBaseSize)
          .nodeColor((node: GardenNode) => {
            if (highlightedCategory && node.category !== highlightedCategory) {
              return `${GRAPH_CONFIG.defaultNodeColor}44`;
            }
            return getFlowerPalette(node.category).petal;
          })
          .nodeOpacity(GRAPH_CONFIG.nodeOpacityActive)
          .nodeThreeObject((node: GardenNode) => {
            const palette = getFlowerPalette(node.category);
            const size = Math.max(2, (node.size || GRAPH_CONFIG.nodeBaseSize) * 1.5);

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

            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({
              map: texture,
              transparent: true,
              opacity:
                highlightedCategory && node.category !== highlightedCategory
                  ? 0.15
                  : 0.9,
            });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(size, size, 1);
            return sprite;
          })
          .linkColor(() => GRAPH_CONFIG.linkColor)
          .linkOpacity(GRAPH_CONFIG.linkOpacity)
          .linkWidth(GRAPH_CONFIG.linkWidth)
          .onNodeClick((node: GardenNode) => {
            onNodeClick(node);
          })
          .enableNodeDrag(false)
          .cooldownTicks(200)
          .d3AlphaDecay(0.02)
          .d3VelocityDecay(0.3);

        // Camera
        graph.cameraPosition({ x: 0, y: 0, z: GRAPH_CONFIG.cameraDistance });

        graphRef.current = graph;
        onGraphReady();
      } catch (err) {
        console.error("Failed to initialize 3D graph:", err);
      }
    };

    initGraph();

    return () => {
      destroyed = true;
      if (graphRef.current) {
        try {
          graphRef.current._destructor();
        } catch {
          // ignore cleanup errors
        }
        graphRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update graph data when visible nodes change
  useEffect(() => {
    if (!graphRef.current) return;

    // Prevent unnecessary updates by comparing node IDs
    const currentIdSet = Array.from(visibleNodeIds).sort().join(",");
    if (currentIdSet === prevNodeIdsRef.current) return;
    prevNodeIdsRef.current = currentIdSet;

    const visibleNodes = data.nodes.filter((n) => visibleNodeIds.has(n.id));
    const visibleLinks = data.links.filter((l) => {
      const srcId = typeof l.source === "object" && l.source ? (l.source as GardenNode).id : l.source;
      const tgtId = typeof l.target === "object" && l.target ? (l.target as GardenNode).id : l.target;
      return visibleNodeIds.has(String(srcId)) && visibleNodeIds.has(String(tgtId));
    });

    graphRef.current.graphData({
      nodes: visibleNodes.map((n) => ({ ...n })),
      links: visibleLinks.map((l) => ({ ...l })),
    });
  }, [visibleNodeIds, data]);

  // Update highlighted category
  useEffect(() => {
    if (!graphRef.current) return;
    graphRef.current
      .nodeColor((node: GardenNode) => {
        if (highlightedCategory && node.category !== highlightedCategory) {
          return `${GRAPH_CONFIG.defaultNodeColor}44`;
        }
        return getFlowerPalette(node.category).petal;
      })
      .nodeThreeObject((node: GardenNode) => {
        const palette = getFlowerPalette(node.category);
        const size = Math.max(2, (node.size || GRAPH_CONFIG.nodeBaseSize) * 1.5);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const THREE = (graphRef.current as any)?.__three__;

        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext("2d")!;

        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, `${palette.glow}66`);
        gradient.addColorStop(0.5, `${palette.petal}44`);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);

        ctx.beginPath();
        ctx.arc(32, 32, 16, 0, Math.PI * 2);
        ctx.fillStyle = palette.petal;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(32, 32, 8, 0, Math.PI * 2);
        ctx.fillStyle = palette.center;
        ctx.fill();

        // Use basic sphere if THREE not available
        if (!THREE) return null;

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          opacity:
            highlightedCategory && node.category !== highlightedCategory
              ? 0.15
              : 0.9,
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(size, size, 1);
        return sprite;
      });
  }, [highlightedCategory]);

  // Auto-orbit
  useEffect(() => {
    if (!autoOrbit || !graphRef.current) return;

    const animate = () => {
      if (!graphRef.current || !autoOrbit) return;

      orbitAngleRef.current += GRAPH_CONFIG.cameraOrbitSpeed * speed;
      const angle = orbitAngleRef.current;
      const distance = GRAPH_CONFIG.cameraDistance;

      try {
        graphRef.current.cameraPosition({
          x: distance * Math.sin(angle),
          y: distance * 0.3,
          z: distance * Math.cos(angle),
          lookAt: { x: 0, y: 0, z: 0 },
        });
      } catch {
        // graph may have been destroyed
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [autoOrbit, speed]);

  return <div ref={containerRef} className="graph-container" />;
}
