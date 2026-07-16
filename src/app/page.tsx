"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { GardenData, GardenNode } from "@/types/garden";
import { useGardenState } from "@/hooks/useGardenState";
import { LoadingScreen } from "@/components/garden/LoadingScreen";
import { TitleBar } from "@/components/garden/TitleBar";
import { DateDisplay } from "@/components/garden/DateDisplay";
import { ControlsPanel } from "@/components/garden/ControlsPanel";
import { LegendPanel } from "@/components/garden/LegendPanel";
import { InfoPanel } from "@/components/garden/InfoPanel";
import { Credits } from "@/components/garden/Credits";
import { TextStream } from "@/components/garden/TextStream";

// Dynamically import the 3D visualization — requires browser APIs (window, WebGL)
const GardenVisualization = dynamic(
  () =>
    import("@/components/garden/GardenVisualization").then(
      (mod) => mod.GardenVisualization
    ),
  {
    ssr: false,
    loading: () => <div className="graph-container" />,
  }
) as any;

export default function Home() {
  const [data, setData] = useState<GardenData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  const {
    isPlaying,
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
    handlePlayPause,
    handleReset,
    handleSpeedChange,
    handleToggleOrbit,
    handleToggleZoom,
    handleCategoryClick,
    handleNodeClick,
    handleCloseInfo,
    handleGraphReady,
  } = useGardenState({ data });

  // Load network data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/data/goodnews-network.json");
        if (!response.ok) throw new Error("Failed to load data");
        const json = (await response.json()) as GardenData;
        setData(json);
      } catch (err) {
        console.error("Error loading garden data:", err);
        setLoadError(true);
      }
    };

    loadData();
  }, []);

  // Hide loading screen after a delay when graph is ready
  useEffect(() => {
    if (graphReady) {
      const timer = setTimeout(() => setShowLoading(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [graphReady]);

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{
        colorScheme: "light",
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      {/* Loading Screen */}
      {showLoading && !loadError && <LoadingScreen />}

      {/* Error State */}
      {loadError && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(165deg, #fdfcfa 0%, #fef6ee 40%, #f6faf6 100%)",
          }}
        >
          <h2 style={{ color: "#e57373", fontSize: "1.1rem" }}>
            Error Loading Garden Data
          </h2>
        </div>
      )}

      {/* Graph Container */}
      {data && (
        <GardenVisualization
          data={data}
          visibleNodeIds={visibleNodeIds}
          highlightedCategory={highlightedCategory}
          autoOrbit={autoOrbit}
          autoZoom={autoZoom}
          speed={speed}
          onNodeClick={handleNodeClick}
          onGraphReady={handleGraphReady}
        />
      )}

      {/* UI Overlay */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ pointerEvents: "none" }}
      >
        {/* Title Bar */}
        {data && <TitleBar nodeCount={nodeCount} linkCount={linkCount} />}

        {/* Date Display */}
        {data && <DateDisplay currentDate={currentDate} progress={progress} />}

        {/* Controls */}
        {data && (
          <ControlsPanel
            isPlaying={isPlaying}
            speed={speed}
            autoOrbit={autoOrbit}
            autoZoom={autoZoom}
            onPlayPause={handlePlayPause}
            onReset={handleReset}
            onSpeedChange={handleSpeedChange}
            onToggleOrbit={handleToggleOrbit}
            onToggleZoom={handleToggleZoom}
            onFitView={() => {
              if (typeof window !== 'undefined' && (window as any).__gardenFitView) {
                (window as any).__gardenFitView();
              }
            }}
          />
        )}

        {/* Credits */}
        <Credits />

        {/* Navigation Hints */}
        <div className="nav-info">
          Left-click: rotate · Mouse-wheel/middle-click: zoom · Right-click: pan
        </div>

        {/* Info Panel */}
        {selectedNode && (
          <InfoPanel node={selectedNode} onClose={handleCloseInfo} />
        )}

        {/* Legend Panel */}
        {data && (
          <LegendPanel
            highlightedCategory={highlightedCategory}
            onCategoryClick={handleCategoryClick}
          />
        )}

        {/* Text Stream */}
        {data && nodeCount > 0 && (
          <TextStream
            nodes={data.nodes.slice(0, nodeCount)}
            onNodeClick={handleNodeClick as (node: GardenNode) => void}
          />
        )}
      </div>
    </div>
  );
}
