"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type { GardenData, GardenNode } from "@/types/garden";

interface UseGardenStateProps {
  data: GardenData | null;
}

export function useGardenState({ data }: UseGardenStateProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDateIndex, setCurrentDateIndex] = useState(-1);
  const [speed, setSpeed] = useState(1);
  const [autoOrbit, setAutoOrbit] = useState(true);
  const [autoZoom, setAutoZoom] = useState(true);
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GardenNode | null>(null);
  const [currentDate, setCurrentDate] = useState("planting...");
  const [progress, setProgress] = useState(0);
  const [graphReady, setGraphReady] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute unique sorted dates
  const uniqueDates = useMemo(() => {
    if (!data) return [];
    const dateSet = new Set<string>();
    data.nodes.forEach((n) => dateSet.add(n.date));
    return Array.from(dateSet).sort((a, b) => {
      const [da, ma, ya] = a.split("/").map(Number);
      const [db, mb, yb] = b.split("/").map(Number);
      return (
        new Date(ya, ma - 1, da).getTime() -
        new Date(yb, mb - 1, db).getTime()
      );
    });
  }, [data]);

  // Compute which node IDs are currently visible
  const visibleNodeIds = useMemo(() => {
    const ids = new Set<string>();
    if (!data || currentDateIndex < 0) return ids;
    for (let i = 0; i <= Math.min(currentDateIndex, uniqueDates.length - 1); i++) {
      const date = uniqueDates[i];
      data.nodes.forEach((n) => {
        if (n.date === date) ids.add(n.id);
      });
    }
    return ids;
  }, [data, currentDateIndex, uniqueDates]);

  // Visible counts
  const nodeCount = visibleNodeIds.size;

  const linkCount = useMemo(() => {
    if (!data || visibleNodeIds.size === 0) return 0;
    return data.links.filter((l) => {
      const srcId = typeof l.source === "object" && l.source ? (l.source as GardenNode).id : String(l.source);
      const tgtId = typeof l.target === "object" && l.target ? (l.target as GardenNode).id : String(l.target);
      return visibleNodeIds.has(srcId) && visibleNodeIds.has(tgtId);
    }).length;
  }, [data, visibleNodeIds]);

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying || !data || !graphReady) return;

    const tick = () => {
      setCurrentDateIndex((prev) => {
        const next = prev + 1;
        if (next >= uniqueDates.length) {
          setIsPlaying(false);
          return prev;
        }
        setCurrentDate(uniqueDates[next]);
        setProgress(((next + 1) / uniqueDates.length) * 100);
        return next;
      });
    };

    const interval = Math.max(200, 1500 / speed);
    timerRef.current = setTimeout(function repeat() {
      tick();
      if (isPlaying) {
        timerRef.current = setTimeout(repeat, interval);
      }
    }, interval);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, speed, data, graphReady, uniqueDates]);

  const handlePlayPause = useCallback(() => {
    if (!graphReady) return;
    setIsPlaying((prev) => !prev);
  }, [graphReady]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentDateIndex(-1);
    setCurrentDate("planting...");
    setProgress(0);
  }, []);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
  }, []);

  const handleToggleOrbit = useCallback(() => {
    setAutoOrbit((prev) => !prev);
  }, []);

  const handleToggleZoom = useCallback(() => {
    setAutoZoom((prev) => !prev);
  }, []);

  const handleCategoryClick = useCallback((category: string | null) => {
    setHighlightedCategory(category);
  }, []);

  const handleNodeClick = useCallback((node: GardenNode) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
  }, []);

  const handleNodeHover = useCallback((_node: GardenNode | null) => {
    // Future: tooltip
  }, []);

  const handleCloseInfo = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleGraphReady = useCallback(() => {
    setGraphReady(true);
    // Auto-start playing when graph is ready
    setIsPlaying(true);
    setCurrentDateIndex(0);
    if (uniqueDates.length > 0) {
      setCurrentDate(uniqueDates[0]);
      setProgress((1 / uniqueDates.length) * 100);
    }
  }, [uniqueDates]);

  return {
    // State
    isPlaying,
    currentDateIndex,
    speed,
    autoOrbit,
    autoZoom,
    highlightedCategory,
    selectedNode,
    nodeCount,
    linkCount,
    currentDate,
    progress,
    graphReady,
    visibleNodeIds,

    // Actions
    handlePlayPause,
    handleReset,
    handleSpeedChange,
    handleToggleOrbit,
    handleToggleZoom,
    handleCategoryClick,
    handleNodeClick,
    handleNodeHover,
    handleCloseInfo,
    handleGraphReady,
  };
}
