"use client";

import { useEffect, useRef, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import type { GardenNode } from "@/types/garden";
import { getFlowerPalette, GRAPH_CONFIG } from "@/lib/garden-config";

// Dynamically import ForceGraph3D — client-only (no SSR)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ForceGraph3DNoSSR = dynamic(
  () => import("react-force-graph-3d").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <div className="graph-container" />,
  }
) as any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FG3DInstance = any;

interface GardenVisualizationProps {
  data: any;
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
  const fgRef = useRef<FG3DInstance>(null);
  const animationRef = useRef<number>(0);
  const orbitAngleRef = useRef(0);
  const zoomAngleRef = useRef(0);
  const readyCalledRef = useRef(false);

  // Default camera position (angled isometric view for 3D depth)
  const DEFAULT_CAMERA = useMemo(
    () => ({
      x: GRAPH_CONFIG.cameraDistance * 0.6,
      y: GRAPH_CONFIG.cameraDistance * 0.5,
      z: GRAPH_CONFIG.cameraDistance * 0.6,
      lookAt: { x: 0, y: 0, z: 0 },
    }),
    []
  );

  // Prepare visible graph data
  // When visibleNodeIds is empty (currentDateIndex = -1, initial state),
  // pass a small seed dataset so the ForceGraph3D engine initializes
  // and onEngineInit fires. This breaks the deadlock where empty data
  // → no engine init → no graphReady → no timeline start.
  const graphData = useMemo(() => {
    const isEmpty = visibleNodeIds.size === 0;

    let visibleNodes: GardenNode[];
    let visibleLinks: any[];

    if (isEmpty && data.nodes.length > 0) {
      // Seed: use only the first few nodes so the engine initializes
      // but the graph appears mostly empty (like the original site)
      visibleNodes = data.nodes.slice(0, 3);
      visibleLinks = [];
    } else if (isEmpty) {
      visibleNodes = [];
      visibleLinks = [];
    } else {
      visibleNodes = data.nodes.filter((n: GardenNode) =>
        visibleNodeIds.has(n.id)
      );
      visibleLinks = data.links.filter((l: any) => {
        const srcId =
          typeof l.source === "object" && l.source
            ? (l.source as GardenNode).id
            : l.source;
        const tgtId =
          typeof l.target === "object" && l.target
            ? (l.target as GardenNode).id
            : l.target;
        return (
          visibleNodeIds.has(String(srcId)) &&
          visibleNodeIds.has(String(tgtId))
        );
      });
    }

    return {
      nodes: visibleNodes.map((n: GardenNode) => ({ ...n })),
      links: visibleLinks.map((l: any) => ({ ...l })),
    };
  }, [data, visibleNodeIds]);

  // Node Three.js object — flower sprite
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeThreeObject = useCallback(
    (node: any) => {
      const gardenNode = node as GardenNode;
      const palette = getFlowerPalette(gardenNode.category);
      const size = Math.max(
        2,
        (gardenNode.size || GRAPH_CONFIG.nodeBaseSize) * 1.5
      );

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

      // Use window.THREE which is set by react-force-graph-3d internally
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const THREE = (window as any).THREE;
      if (!THREE) return null;

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity:
          highlightedCategory && gardenNode.category !== highlightedCategory
            ? 0.15
            : 0.9,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(size, size, 1);
      return sprite;
    },
    [highlightedCategory]
  );

  // Node color
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeColor = useCallback(
    (node: any) => {
      const gardenNode = node as GardenNode;
      if (highlightedCategory && gardenNode.category !== highlightedCategory) {
        return `${GRAPH_CONFIG.defaultNodeColor}44`;
      }
      return getFlowerPalette(gardenNode.category).petal;
    },
    [highlightedCategory]
  );

  // Node val (size)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeVal = useCallback(
    (node: any) => {
      const gardenNode = node as GardenNode;
      return gardenNode.size || GRAPH_CONFIG.nodeBaseSize;
    },
    []
  );

  // Link color
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkColor = useCallback(() => GRAPH_CONFIG.linkColor, []);

  // Node click handler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeClick = useCallback(
    (node: any) => {
      onNodeClick(node as GardenNode);
    },
    [onNodeClick]
  );

  // Combined auto-orbit + auto-zoom animation loop
  useEffect(() => {
    if (!fgRef.current) return;

    const animate = () => {
      const fg = fgRef.current;
      if (!fg) return;

      const distance = GRAPH_CONFIG.cameraDistance;

      if (autoOrbit) {
        orbitAngleRef.current += GRAPH_CONFIG.cameraOrbitSpeed * speed;
      }

      const angle = orbitAngleRef.current;
      let x = distance * Math.sin(angle) * 0.8;
      let z = distance * Math.cos(angle) * 0.8;
      let y = distance * 0.45;

      if (autoZoom) {
        zoomAngleRef.current += 0.0003 * speed;
        const zoomFactor = 1 + 0.3 * Math.sin(zoomAngleRef.current);
        x *= zoomFactor;
        z *= zoomFactor;
        y *= 1 + 0.2 * Math.sin(zoomAngleRef.current * 0.7);
      }

      try {
        fg.cameraPosition({
          x,
          y,
          z,
          lookAt: { x: 0, y: 0, z: 0 },
        });
      } catch {
        // graph may have been destroyed
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [autoOrbit, autoZoom, speed]);

  // Fit view — expose via window for page.tsx
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      if (fgRef.current) {
        orbitAngleRef.current = 0;
        zoomAngleRef.current = 0;
        fgRef.current.cameraPosition(DEFAULT_CAMERA);
      }
    };
    (window as any).__gardenFitView = handler;
    return () => {
      delete (window as any).__gardenFitView;
    };
  }, [DEFAULT_CAMERA]);

  // Handle engine init — set camera and notify parent
  const handleEngineInit = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.cameraPosition(DEFAULT_CAMERA);
    }
    // Only call onGraphReady once to avoid re-triggering
    if (!readyCalledRef.current) {
      readyCalledRef.current = true;
      onGraphReady();
    }
  }, [DEFAULT_CAMERA, onGraphReady]);

  return (
    <ForceGraph3DNoSSR
      ref={fgRef}
      graphData={graphData}
      backgroundColor={GRAPH_CONFIG.backgroundColor}
      nodeLabel="title"
      nodeVal={nodeVal}
      nodeColor={nodeColor}
      nodeOpacity={GRAPH_CONFIG.nodeOpacityActive}
      nodeThreeObject={nodeThreeObject}
      linkColor={linkColor}
      linkOpacity={GRAPH_CONFIG.linkOpacity}
      linkWidth={GRAPH_CONFIG.linkWidth}
      onNodeClick={handleNodeClick}
      enableNodeDrag={false}
      cooldownTicks={200}
      d3AlphaDecay={0.02}
      d3VelocityDecay={0.3}
      onEngineInit={handleEngineInit}
      showNavInfo={true}
      className="graph-container"
    />
  );
}
