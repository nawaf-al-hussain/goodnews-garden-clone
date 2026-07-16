"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  const [nodeCount, setNodeCount] = useState(0);
  const [linkCount, setLinkCount] = useState(0);
  const [currentDate, setCurrentDate] = useState("planting...");
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uniqueDatesRef = useRef<string[]>([]);

  // Compute unique dates from data
  useEffect(() => {
    if (!data) return;

    const dateSet = new Set<string>();
    data.nodes.forEach((n) => dateSet.add(n.date));
    uniqueDatesRef.current = Array.from(dateSet).sort((a, b) => {
      const [da, ma, ya] = a.split("/").map(Number);
      const [db, mb, yb] = b.split("/").map(Number);
      return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
    });

    setIsLoading(false);
  }, [data]);

  // Play/pause animation
  useEffect(() => {
    if (!isPlaying || !data) return;

    const tick = () => {
      setCurrentDateIndex((prev) => {
        const next = prev + 1;
        if (next >= uniqueDatesRef.current.length) {
          setIsPlaying(false);
          return prev;
        }

        // Update current date
        const dateStr = uniqueDatesRef.current[next];
        setCurrentDate(dateStr);

        // Update progress
        setProgress(
          ((next + 1) / uniqueDatesRef.current.length) * 100
        );

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
  }, [isPlaying, speed, data]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentDateIndex(-1);
    setCurrentDate("planting...");
    setProgress(0);
    setNodeCount(0);
    setLinkCount(0);
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
    setSelectedNode(node);
  }, []);

  const handleNodeHover = useCallback((_node: GardenNode | null) => {
    // Could add hover effects here
  }, []);

  const handleCloseInfo = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleVisibleCountsUpdate = useCallback((nodes: number, links: number) => {
    setNodeCount(nodes);
    setLinkCount(links);
  }, []);

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
    isLoading,

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
    handleVisibleCountsUpdate,
  };
}
