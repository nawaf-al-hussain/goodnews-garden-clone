"use client";

import { useEffect, useRef, useCallback } from "react";
import type { GardenNode } from "@/types/garden";
import { getFlowerPalette, CATEGORY_EMOJIS, GRAPH_CONFIG } from "@/lib/garden-config";

// ── Bloom Animation Config ──────────────────────────────────────────
const GLOW_DURATION = 2000; // ms — matching original
const BLOOM_DURATION = 2000; // ms — matching original

// easeOutBack — springy overshoot (same as original)
function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

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
}: GardenVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const animationRef = useRef<number>(0);
  const glowAnimRef = useRef<number>(0);
  const orbitAngleRef = useRef(0);
  const zoomAngleRef = useRef(0);
  const readyCalledRef = useRef(false);
  const graphDataRef = useRef<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const threeRef = useRef<any>(null);

  // Track previously visible IDs to detect newly added nodes for glow animation
  const prevVisibleIdsRef = useRef<Set<string>>(new Set());
  // Map of node ID → timestamp when it started glowing
  const glowingNodesRef = useRef<Map<string, number>>(new Map());

  // Refs for callbacks that change over time (avoid stale closures)
  const highlightedCategoryRef = useRef(highlightedCategory);
  useEffect(() => { highlightedCategoryRef.current = highlightedCategory; }, [highlightedCategory]);

  const autoOrbitRef = useRef(autoOrbit);
  useEffect(() => { autoOrbitRef.current = autoOrbit; }, [autoOrbit]);

  const autoZoomRef = useRef(autoZoom);
  useEffect(() => { autoZoomRef.current = autoZoom; }, [autoZoom]);

  const speedRef = useRef(speed);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  const onNodeClickRef = useRef(onNodeClick);
  useEffect(() => { onNodeClickRef.current = onNodeClick; }, [onNodeClick]);

  // ── Create flower canvas texture ───────────────────────────────
  const createFlowerCanvas = useCallback(
    (category: string, bloomProgress: number, isGlowing: boolean, glowProgress: number) => {
      const palette = getFlowerPalette(category);
      const emoji = CATEGORY_EMOJIS[category] || "🌱";

      const canvasSize = 128;
      const canvas = document.createElement("canvas");
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      const ctx = canvas.getContext("2d")!;
      const cx = canvasSize / 2;
      const cy = canvasSize / 2;

      // Apply bloom scale (easeOutBack for springy pop)
      const bloomScale = easeOutBack(Math.min(bloomProgress, 1));

      // ── Glow ring (for newly appearing nodes) ──────────────
      if (isGlowing) {
        const glowRadius = (16 + (1 - glowProgress) * 24) * bloomScale;
        const glowOpacity = 0.4 * (1 - glowProgress * 0.8);
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
        const alphaHex = Math.round(Math.min(glowOpacity, 1) * 255).toString(16).padStart(2, "0");
        const alphaHex2 = Math.round(Math.min(glowOpacity * 0.5, 1) * 255).toString(16).padStart(2, "0");
        gradient.addColorStop(0, palette.glow + alphaHex);
        gradient.addColorStop(0.5, palette.petal + alphaHex2);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasSize, canvasSize);
      }

      // ── Petals ─────────────────────────────────────────────
      const petalRadius = 18 * bloomScale;
      ctx.beginPath();
      ctx.arc(cx, cy, petalRadius, 0, Math.PI * 2);
      ctx.fillStyle = palette.petal;
      ctx.fill();

      // ── Center ─────────────────────────────────────────────
      const centerRadius = 8 * bloomScale;
      ctx.beginPath();
      ctx.arc(cx, cy, centerRadius, 0, Math.PI * 2);
      ctx.fillStyle = palette.center;
      ctx.fill();

      // ── Emoji ──────────────────────────────────────────────
      if (bloomScale > 0.5) {
        ctx.font = `${Math.round(28 * bloomScale)}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(emoji, cx, cy - 4);
      }

      return canvas;
    },
    []
  );

  // ── nodeThreeObject — creates Three.js sprite for each node ───
  // Stored as ref so it can access THREE after lazy load
  const nodeThreeObjectFn = useCallback(
    (node: any) => {
      const THREE = threeRef.current;
      if (!THREE) return null;

      const gardenNode = node as GardenNode;
      const baseSize = Math.max(2, (gardenNode.size || GRAPH_CONFIG.nodeBaseSize) * 1.5);

      const now = Date.now();

      // Check if this node is glowing
      const glowStart = glowingNodesRef.current.get(gardenNode.id);
      const isGlowing = glowStart != null && now - glowStart < GLOW_DURATION;
      const glowProgress = isGlowing && glowStart != null
        ? (now - glowStart) / GLOW_DURATION
        : 1;

      // Check bloom progress
      const bloomProgress = glowStart != null
        ? Math.min((now - glowStart) / BLOOM_DURATION, 1)
        : 1; // Already bloomed

      // If node hasn't started blooming yet, make it tiny
      if (bloomProgress <= 0) {
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({ transparent: true, opacity: 0 })
        );
        sprite.scale.set(0.01, 0.01, 0.01);
        return sprite;
      }

      const canvas = createFlowerCanvas(
        gardenNode.category,
        bloomProgress,
        isGlowing,
        glowProgress
      );

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;

      // Dim non-highlighted categories
      const isHighlighted =
        !highlightedCategoryRef.current ||
        gardenNode.category === highlightedCategoryRef.current;

      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: isHighlighted ? 0.95 : 0.15,
        depthWrite: false,
      });

      const sprite = new THREE.Sprite(material);
      const finalScale = baseSize * easeOutBack(Math.min(bloomProgress, 1));
      sprite.scale.set(finalScale, finalScale, 1);
      return sprite;
    },
    [createFlowerCanvas]
  );

  // ── Initialize 3d-force-graph instance (lazy-load to avoid SSR) ─
  useEffect(() => {
    if (!containerRef.current || graphRef.current) return;

    let destroyed = false;

    // Lazy-load 3d-force-graph and three.js (client-only)
    Promise.all([
      import("3d-force-graph"),
      import("three"),
    ]).then(([fgModule, threeModule]) => {
      if (destroyed) return;

      // ForceGraph3D is a factory function at runtime, but typed as a class
      const FG3D = fgModule.default as any;
      const THREE = threeModule;
      threeRef.current = THREE;

      const graph = FG3D()(containerRef.current)
        .backgroundColor(GRAPH_CONFIG.backgroundColor)
        .nodeLabel("title")
        .nodeVal((node: any) => {
          const gardenNode = node as GardenNode;
          return gardenNode.size || GRAPH_CONFIG.nodeBaseSize;
        })
        .nodeColor((node: any) => {
          const gardenNode = node as GardenNode;
          if (highlightedCategoryRef.current && gardenNode.category !== highlightedCategoryRef.current) {
            return `${GRAPH_CONFIG.defaultNodeColor}44`;
          }
          return getFlowerPalette(gardenNode.category).petal;
        })
        .nodeOpacity(GRAPH_CONFIG.nodeOpacityActive)
        .nodeThreeObject(nodeThreeObjectFn)
        .nodeThreeObjectExtend(false)
        .linkColor(() => {
          if (highlightedCategoryRef.current) {
            return "rgba(129, 199, 132, 0.08)";
          }
          return GRAPH_CONFIG.linkColor;
        })
        .linkOpacity(GRAPH_CONFIG.linkOpacity)
        .linkWidth(GRAPH_CONFIG.linkWidth)
        .linkCurvature(0.25)
        .linkDirectionalArrowLength(0)
        .onNodeClick((node: any) => {
          // Camera fly to node (matching original's 1500ms transition)
          const targetPos = { x: node.x, y: node.y, z: node.z };
          graph.cameraPosition(targetPos, targetPos, 1500);
          onNodeClickRef.current(node as GardenNode);
        })
        .enableNodeDrag(false)
        .cooldownTicks(200)
        .d3AlphaDecay(0.02)
        .d3VelocityDecay(0.3)
        .showNavInfo(false);

      // Configure d3 forces (matching original)
      graph.d3Force("charge")?.strength(-50);
      graph.d3Force("link")?.distance(50);
      graph.d3Force("center")?.x(0)?.y(0);

      // Default camera position (angled isometric)
      const dist = GRAPH_CONFIG.cameraDistance;
      graph.cameraPosition({
        x: dist * 0.6,
        y: dist * 0.5,
        z: dist * 0.6,
        lookAt: { x: 0, y: 0, z: 0 },
      });

      graphRef.current = graph;

      // Set initial empty data so engine initializes
      if (data && data.nodes.length > 0) {
        const seedData = {
          nodes: data.nodes.slice(0, 3).map((n: GardenNode) => ({ ...n })),
          links: [] as any[],
        };
        graphDataRef.current = seedData;
        graph.graphData(seedData);
      }
    });

    return () => {
      destroyed = true;
      if (graphRef.current) {
        try {
          graphRef.current._destructor();
        } catch (e) {
          // ignore cleanup errors
        }
        graphRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update graph data when visibleNodeIds changes ──────────────
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || !data) return;

    const isEmpty = visibleNodeIds.size === 0;

    let visibleNodes: GardenNode[];
    let visibleLinks: any[];

    if (isEmpty && data.nodes.length > 0) {
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

    const newGraphData = {
      nodes: visibleNodes.map((n: GardenNode) => ({ ...n })),
      links: visibleLinks.map((l: any) => ({ ...l })),
    };

    // Detect new nodes for glow
    const prevIds = prevVisibleIdsRef.current;
    const now = Date.now();
    visibleNodeIds.forEach((id) => {
      if (!prevIds.has(id)) {
        glowingNodesRef.current.set(id, now);
      }
    });
    prevVisibleIdsRef.current = new Set(visibleNodeIds);

    graphDataRef.current = newGraphData;
    graph.graphData(newGraphData);

    // Notify ready on first real data load (not the seed)
    if (!readyCalledRef.current && visibleNodeIds.size > 0) {
      readyCalledRef.current = true;
      setTimeout(() => onGraphReady(), 500);
    }
  }, [data, visibleNodeIds, onGraphReady]);

  // ── Glow animation loop (~10fps, matching original) ────────────
  useEffect(() => {
    let lastUpdate = 0;
    const THROTTLE_MS = 100;

    const animateGlow = (timestamp: number) => {
      if (timestamp - lastUpdate >= THROTTLE_MS) {
        lastUpdate = timestamp;
        const graph = graphRef.current;
        if (graph && glowingNodesRef.current.size > 0) {
          const now = Date.now();
          // Clean up expired glows
          glowingNodesRef.current.forEach((startTime, id) => {
            if (now - startTime > GLOW_DURATION) {
              glowingNodesRef.current.delete(id);
            }
          });
          // Refresh node visuals for glowing nodes
          if (glowingNodesRef.current.size > 0) {
            graph.refresh();
          }
        }
      }
      glowAnimRef.current = requestAnimationFrame(animateGlow);
    };

    glowAnimRef.current = requestAnimationFrame(animateGlow);
    return () => cancelAnimationFrame(glowAnimRef.current);
  }, []);

  // ── Auto-orbit + auto-zoom animation loop ──────────────────────
  useEffect(() => {
    const animate = () => {
      const graph = graphRef.current;
      if (!graph) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const distance = GRAPH_CONFIG.cameraDistance;

      if (autoOrbitRef.current) {
        orbitAngleRef.current += GRAPH_CONFIG.cameraOrbitSpeed * speedRef.current;
      }

      const angle = orbitAngleRef.current;
      let x = distance * Math.sin(angle) * 0.8;
      let z = distance * Math.cos(angle) * 0.8;
      let y = distance * 0.45;

      if (autoZoomRef.current) {
        zoomAngleRef.current += 0.0003 * speedRef.current;
        const zoomFactor = 1 + 0.3 * Math.sin(zoomAngleRef.current);
        x *= zoomFactor;
        z *= zoomFactor;
        y *= 1 + 0.2 * Math.sin(zoomAngleRef.current * 0.7);
      }

      try {
        graph.cameraPosition({
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
  }, []);

  // ── Expose fit view via window ─────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      const graph = graphRef.current;
      if (graph) {
        const graphData = graph.graphData();
        const graphNodes = graphData.nodes;
        if (graphNodes.length > 0) {
          let cx = 0, cy = 0, cz = 0;
          graphNodes.forEach((n: any) => { cx += n.x || 0; cy += n.y || 0; cz += n.z || 0; });
          cx /= graphNodes.length;
          cy /= graphNodes.length;
          cz /= graphNodes.length;
          graph.cameraPosition({ x: cx, y: cy + 300, z: cz + 500 }, { x: cx, y: cy, z: cz }, 1500);
        } else {
          orbitAngleRef.current = 0;
          zoomAngleRef.current = 0;
          const dist = GRAPH_CONFIG.cameraDistance;
          graph.cameraPosition({
            x: dist * 0.6,
            y: dist * 0.5,
            z: dist * 0.6,
            lookAt: { x: 0, y: 0, z: 0 },
          });
        }
      }
    };
    (window as any).__gardenFitView = handler;
    return () => { delete (window as any).__gardenFitView; };
  }, []);

  return (
    <div
      ref={containerRef}
      className="graph-container"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
