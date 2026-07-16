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
  autoZoom: boolean;
  speed: number;
  onNodeClick: (node: GardenNode) => void;
  onGraphReady: () => void;
  onFitView?: () => void;
}

export function GardenVisualization({
  data,
  visibleNodeIds,
  highlightedCategory,
  autoOrbit,
  autoZoom,
  speed,
  onNodeClick,
  onGraphReady,
  onFitView,
}: GardenVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraph3DInstance | null>(null);
  const animationRef = useRef<number>(0);
  const zoomAnimationRef = useRef<number>(0);
  const orbitAngleRef = useRef(0);
  const prevNodeIdsRef = useRef<string>("");
  // Use refs for values accessed inside closures to avoid stale captures
  const highlightedCategoryRef = useRef<string | null>(null);
  const onNodeClickRef = useRef(onNodeClick);

  // Keep refs in sync with props
  useEffect(() => {
    highlightedCategoryRef.current = highlightedCategory;
  }, [highlightedCategory]);

  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  }, [onNodeClick]);

  // Default camera position (angled isometric view for 3D depth)
  const DEFAULT_CAMERA = {
    x: GRAPH_CONFIG.cameraDistance * 0.6,
    y: GRAPH_CONFIG.cameraDistance * 0.5,
    z: GRAPH_CONFIG.cameraDistance * 0.6,
    lookAt: { x: 0, y: 0, z: 0 },
  };

  // Create a flower sprite for a node — shared helper
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createFlowerSprite = (THREE: any, node: GardenNode) => {
    const palette = getFlowerPalette(node.category);
    const size = Math.max(2, (node.size || GRAPH_CONFIG.nodeBaseSize) * 1.5);
    const currentHighlight = highlightedCategoryRef.current;

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
        currentHighlight && node.category !== currentHighlight
          ? 0.15
          : 0.9,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(size, size, 1);
    return sprite;
  };

  // Initialize graph once
  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;

    const initGraph = async () => {
      try {
        // 3d-force-graph requires THREE on window. Load THREE first.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const THREE = await import("three") as any;

        // Make THREE available globally for 3d-force-graph
        if (typeof window !== "undefined") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).THREE = THREE;
        }

        // Now load 3d-force-graph (it reads window.THREE)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ForceGraph3D = (await import("3d-force-graph")).default as any;

        if (destroyed || !containerRef.current) return;

        const graph = ForceGraph3D()(containerRef.current)
          .graphData({ nodes: [], links: [] })
          .backgroundColor(GRAPH_CONFIG.backgroundColor)
          .nodeLabel("title")
          .nodeVal((node: GardenNode) => node.size || GRAPH_CONFIG.nodeBaseSize)
          .nodeColor((node: GardenNode) => {
            const currentHighlight = highlightedCategoryRef.current;
            if (currentHighlight && node.category !== currentHighlight) {
              return `${GRAPH_CONFIG.defaultNodeColor}44`;
            }
            return getFlowerPalette(node.category).petal;
          })
          .nodeOpacity(GRAPH_CONFIG.nodeOpacityActive)
          .nodeThreeObject((node: GardenNode) => {
            return createFlowerSprite(THREE, node);
          })
          .linkColor(() => GRAPH_CONFIG.linkColor)
          .linkOpacity(GRAPH_CONFIG.linkOpacity)
          .linkWidth(GRAPH_CONFIG.linkWidth)
          .onNodeClick((node: GardenNode) => {
            onNodeClickRef.current(node);
          })
          .enableNodeDrag(false)
          .cooldownTicks(200)
          .d3AlphaDecay(0.02)
          .d3VelocityDecay(0.3);

        // Camera — angled isometric view so 3D depth is immediately visible
        graph.cameraPosition(DEFAULT_CAMERA);

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const THREE = (typeof window !== "undefined") ? (window as any).THREE : null;

    graphRef.current
      .nodeColor((node: GardenNode) => {
        if (highlightedCategory && node.category !== highlightedCategory) {
          return `${GRAPH_CONFIG.defaultNodeColor}44`;
        }
        return getFlowerPalette(node.category).petal;
      });

    if (THREE) {
      // Dispose old Three.js objects to prevent GPU memory leaks
      const oldObjects = graphRef.current.scene()?.children || [];
      oldObjects.forEach((obj: any) => {
        if (obj?.material) {
          obj.material.dispose?.();
          if (obj.material.map) obj.material.map.dispose?.();
        }
      });

      graphRef.current
        .nodeThreeObject((node: GardenNode) => {
          return createFlowerSprite(THREE, node);
        });
    }
  }, [highlightedCategory]);

  // Auto-orbit with better 3D viewing angle
  useEffect(() => {
    if (!autoOrbit || !graphRef.current) return;

    const animate = () => {
      if (!graphRef.current || !autoOrbit) return;

      orbitAngleRef.current += GRAPH_CONFIG.cameraOrbitSpeed * speed;
      const angle = orbitAngleRef.current;
      const distance = GRAPH_CONFIG.cameraDistance;

      try {
        graphRef.current.cameraPosition({
          x: distance * Math.sin(angle) * 0.8,
          y: distance * 0.45,
          z: distance * Math.cos(angle) * 0.8,
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

  // Auto-zoom — slowly oscillate camera distance
  useEffect(() => {
    if (!autoZoom || !graphRef.current) return;

    let zoomAngle = 0;
    const baseDistance = GRAPH_CONFIG.cameraDistance * 0.75;
    const zoomAmplitude = GRAPH_CONFIG.cameraDistance * 0.25;

    const animateZoom = () => {
      if (!graphRef.current || !autoZoom) return;

      zoomAngle += 0.0003 * speed;
      const currentDistance = baseDistance + zoomAmplitude * Math.sin(zoomAngle);

      try {
        graphRef.current.cameraPosition(
          { x: 0, y: 0, z: currentDistance },
          { x: 0, y: 0, z: 0 }, // lookAt
          100 // transition duration ms
        );
      } catch {
        // graph may have been destroyed
      }

      zoomAnimationRef.current = requestAnimationFrame(animateZoom);
    };

    zoomAnimationRef.current = requestAnimationFrame(animateZoom);
    return () => cancelAnimationFrame(zoomAnimationRef.current);
  }, [autoZoom, speed]);

  // Expose fit view method via window so page.tsx can call it
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      if (graphRef.current) {
        orbitAngleRef.current = 0;
        graphRef.current.cameraPosition(DEFAULT_CAMERA);
      }
    };
    (window as any).__gardenFitView = handler;
    return () => {
      delete (window as any).__gardenFitView;
    };
  }, []);

  return <div ref={containerRef} className="graph-container" />;
}
