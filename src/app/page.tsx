"use client";

import { useEffect, useState, useRef } from "react";
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
import { GardenVisualization } from "@/components/garden/GardenVisualization";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ForceGraph3DInstance = any;

export default function Home() {
  const [data, setData] = useState<GardenData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const graphRef = useRef<ForceGraph3DInstance | null>(null);

  const {
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
  } = useGardenState({ data });

  // Load network data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/data/goodnews-network.json");
        if (!response.ok) throw new Error("Failed to load data");
        const json = (await response.json()) as GardenData;
        setData(json);
        setDataLoaded(true);
      } catch (err) {
        console.error("Error loading garden data:", err);
        setLoadError(true);
      }
    };

    loadData();
  }, []);

  const handleFitView = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50);
    }
  };

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
      {(isLoading || !dataLoaded) && !loadError && <LoadingScreen />}

      {/* Error State */}
      {loadError && (
        <div id="loading-screen">
          <h2 className="loader-text" style={{ color: "#e57373" }}>
            Error Loading Garden Data
          </h2>
        </div>
      )}

      {/* Graph Container */}
      {dataLoaded && data && (
        <GardenVisualization
          data={data}
          currentDateIndex={currentDateIndex}
          isPlaying={isPlaying}
          speed={speed}
          autoOrbit={autoOrbit}
          highlightedCategory={highlightedCategory}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onVisibleCountsUpdate={handleVisibleCountsUpdate}
          graphRef={graphRef}
        />
      )}

      {/* UI Overlay */}
      <div
        id="ui-overlay"
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ pointerEvents: "none" }}
      >
        {/* Title Bar */}
        {dataLoaded && (
          <TitleBar nodeCount={nodeCount} linkCount={linkCount} />
        )}

        {/* Date Display */}
        {dataLoaded && (
          <DateDisplay currentDate={currentDate} progress={progress} />
        )}

        {/* Controls */}
        {dataLoaded && (
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
            onFitView={handleFitView}
          />
        )}

        {/* Credits */}
        <Credits />

        {/* Info Panel */}
        {selectedNode && (
          <InfoPanel node={selectedNode} onClose={handleCloseInfo} />
        )}

        {/* Legend Panel */}
        {dataLoaded && (
          <LegendPanel
            highlightedCategory={highlightedCategory}
            onCategoryClick={handleCategoryClick}
          />
        )}

        {/* Text Stream */}
        {dataLoaded && data && (
          <TextStream
            nodes={data.nodes.slice(0, Math.max(0, nodeCount))}
            onNodeClick={handleNodeClick as (node: GardenNode) => void}
          />
        )}
      </div>
    </div>
  );
}
